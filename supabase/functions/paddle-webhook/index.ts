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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PADDLE_WEBHOOK_SECRET = Deno.env.get("PADDLE_WEBHOOK_SECRET");

// Maps a Paddle price ID (the subscription's first line item) to our
// plan_tier. Set PADDLE_STARTER_PRICE_ID/PADDLE_PRO_PRICE_ID to the real
// price IDs from your Paddle catalog once it exists.
function priceIdToPlan(priceId: string | undefined): string | undefined {
  if (!priceId) return undefined;
  if (priceId === Deno.env.get("PADDLE_STARTER_PRICE_ID")) return "starter";
  if (priceId === Deno.env.get("PADDLE_PRO_PRICE_ID")) return "pro";
  return undefined;
}

// Paddle subscription statuses -> our platform_subscriptions.status.
// Paddle: active | trialing | past_due | paused | canceled
// Ours:   active | trialing | cancelled
// No Paddle price should have a trial period configured -- the free
// trial was intentionally removed (see
// 20260909162346_revoke_self_service_trial_creation.sql) -- but if one
// ever is, "trialing" still maps correctly rather than silently
// mismatching. past_due/paused have no equivalent in our schema; treat
// them as not-entitled (cancelled) rather than leaving a stale "active"
// row a lapsed payment shouldn't keep granting.
function mapStatus(paddleStatus: string): string {
  if (paddleStatus === "active" || paddleStatus === "trialing") return paddleStatus;
  return "cancelled";
}

// Decimal places of a currency's smallest unit (ISO 4217).
function currencyDecimals(currency: string | undefined): number {
  const code = (currency ?? "").toUpperCase();
  if (["BHD", "KWD", "OMR", "JOD", "TND"].includes(code)) return 3;
  if (["JPY", "KRW", "VND", "CLP", "ISK"].includes(code)) return 0;
  return 2;
}

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

  const items = Array.isArray(data.items) ? (data.items as Record<string, unknown>[]) : [];
  const firstItem = items[0];
  const price = firstItem?.price as Record<string, unknown> | undefined;
  const priceId = typeof price?.id === "string" ? price.id : undefined;
  const planTier = priceIdToPlan(priceId);

  const paddleStatus = typeof data.status === "string" ? data.status : "canceled";
  const status = mapStatus(paddleStatus);
  const nextBilledAt = typeof data.next_billed_at === "string" ? data.next_billed_at : null;

  // Paddle returns unit_price.amount as a string in the currency's smallest
  // unit. Most currencies have 2 decimals, but BHD/KWD/OMR/JOD/TND have 3 and
  // JPY/KRW have 0, so dividing by a fixed 100 would store BHD 20.000 as 200.
  // UNVERIFIED against live Paddle BHD deliveries - confirm with a sandbox
  // subscription before relying on the stored amount.
  const unitPrice = price?.unit_price as Record<string, unknown> | undefined;
  const currencyCode = typeof unitPrice?.currency_code === "string" ? unitPrice.currency_code : undefined;
  const amount = typeof unitPrice?.amount === "string"
    ? Number(unitPrice.amount) / 10 ** currencyDecimals(currencyCode)
    : null;

  const { error } = await serviceClient
    .from("platform_subscriptions")
    .upsert(
      {
        tenant_id: tenantId,
        status,
        ...(planTier ? { plan_tier: planTier } : {}),
        ...(amount !== null ? { amount } : {}),
        ...(currencyCode ? { currency: currencyCode } : {}),
        current_period_end: nextBilledAt,
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
