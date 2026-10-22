// Receives and processes Paddle Billing webhook events, keeping
// platform_subscriptions in sync with what Paddle has actually billed.
// Public endpoint (Paddle calls this server-to-server, not as a logged-in
// Supabase user) -- authenticated via Paddle's HMAC webhook signature, not
// a Supabase JWT, so this is deployed with verify_jwt=false (see
// supabase/config.toml). This is the only path that may activate or
// change a subscription: the self-service trigger
// (enforce_platform_subscription_self_service) rejects every other
// client-side write to this table.
//
// The signature format and event shapes below follow Paddle's published
// Billing API v2 documentation (developer.paddle.com/webhooks/overview,
// .../webhooks/signature-verification), which is public and stable --
// unlike the CrediMax integration this replaces, this does not require
// guessing field names against an unreachable merchant-specific gateway.
// Still: verify against a real Paddle sandbox account and its actual
// webhook deliveries before relying on this for real customer traffic --
// event payload details can still differ in ways docs don't fully cover.

import { createClient } from "npm:@supabase/supabase-js@2";
import { breakdownItems, readPriceConfig } from "../_shared/paddle-items.ts";
import { mapPaddleStatus, nextGraceUntil, readSubscriptionDates } from "../_shared/paddle-subscription.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PADDLE_WEBHOOK_SECRET = Deno.env.get("PADDLE_WEBHOOK_SECRET");

// Price IDs from your Paddle catalog (see scripts/seed-paddle-catalog.mjs):
// the base Starter / Pro prices and the per-plan extra-location add-on prices.
const priceConfig = () => readPriceConfig((key) => Deno.env.get(key));

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!PADDLE_WEBHOOK_SECRET) {
    console.error("paddle-webhook: PADDLE_WEBHOOK_SECRET is not configured.");
    return new Response("Webhook not configured", { status: 500 });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Paddle's real traffic is a handful of events per subscription change --
  // 60/min per source IP is generous headroom for legitimate retries while
  // still capping abuse of this public, unauthenticated endpoint.
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { data: withinLimit, error: rateLimitError } = await serviceClient.rpc("check_rate_limit", {
    p_key: `paddle-webhook:${clientIp}`,
    p_max_count: 60,
    p_window_seconds: 60,
  });
  if (rateLimitError) {
    console.error("paddle-webhook: rate limit check failed", rateLimitError);
  } else if (withinLimit === false) {
    return new Response("Too many requests", { status: 429 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("Paddle-Signature");
  if (!signatureHeader || !(await isValidSignature(rawBody, signatureHeader, PADDLE_WEBHOOK_SECRET))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event_type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!event.data) {
    return new Response("Missing event data", { status: 400 });
  }

  try {
    switch (event.event_type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.activated":
      case "subscription.canceled":
      case "subscription.past_due":
      case "subscription.paused":
        await syncSubscription(serviceClient, event.data);
        break;
      default:
        // transaction.* and other event types: not acted on here.
        break;
    }
  } catch (error) {
    console.error("paddle-webhook processing error:", error);
    return new Response("Processing error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});

async function syncSubscription(
  serviceClient: ReturnType<typeof createClient>,
  data: Record<string, unknown>,
) {
  const customData = (data.custom_data ?? {}) as Record<string, unknown>;
  const tenantId = typeof customData.tenant_id === "string" ? customData.tenant_id : undefined;
  if (!tenantId) {
    console.error("paddle-webhook: subscription event missing custom_data.tenant_id", data.id);
    return;
  }

  // The subscription has a base plan item and, once the tenant has added
  // branches, an extra-location item. Items are matched by price ID (not
  // position); see _shared/paddle-items.ts.
  const { planTier, extraLocations, amount, currencyCode } = breakdownItems(data.items, priceConfig());

  const paddleStatus = typeof data.status === "string" ? data.status : "canceled";
  const status = mapPaddleStatus(paddleStatus);
  // A cancellation scheduled for the end of the period leaves the status
  // "active" (access continues) and shows up as scheduled_change.
  const { cancelAt, periodEnd } = readSubscriptionDates(data, paddleStatus);

  // A failed renewal keeps access for a grace period (see
  // 20261022150000_past_due_grace.sql). The window starts when the
  // subscription FIRST goes past_due, so read what is stored before deciding.
  let graceUntil: string | null = null;
  if (paddleStatus === "past_due") {
    const { data: existing, error: existingError } = await serviceClient
      .from("platform_subscriptions")
      .select("status, grace_until")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (existingError) throw existingError;
    graceUntil = nextGraceUntil(paddleStatus, existing);
  }

  const { error } = await serviceClient
    .from("platform_subscriptions")
    .upsert(
      {
        tenant_id: tenantId,
        status,
        ...(planTier ? { plan_tier: planTier } : {}),
        ...(amount !== null ? { amount } : {}),
        ...(currencyCode ? { currency: currencyCode } : {}),
        // null = extra-location price IDs aren't configured, so the quantity
        // can't be read: leave the stored value alone rather than zero it.
        ...(extraLocations !== null ? { extra_locations: extraLocations } : {}),
        current_period_end: periodEnd,
        cancel_at: cancelAt,
        grace_until: graceUntil,
        payment_provider: "paddle",
        payment_reference: typeof data.id === "string" ? data.id : null,
        metadata: {
          paddle_subscription_id: data.id,
          paddle_status: paddleStatus,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    );

  if (error) throw error;
}

// Paddle-Signature header format: "ts=<unix_timestamp>;h1=<hex_hmac_sha256>"
// computed over "${ts}:${rawBody}" using the webhook's notification secret.
async function isValidSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = parts.ts;
  const hash = parts.h1;
  if (!timestamp || !hash) return false;

  const signedPayload = `${timestamp}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const computedHash = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqualHex(computedHash, hash);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
