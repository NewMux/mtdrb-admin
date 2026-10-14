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

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { toSubscriptionEventRecord, verifyPaddleSignature } from "../_shared/paddle.ts";

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
  const signature = signatureHeader
    ? await verifyPaddleSignature(rawBody, signatureHeader, PADDLE_WEBHOOK_SECRET)
    : { ok: false as const, reason: "malformed" as const };
  if (!signature.ok) {
    console.warn("paddle-webhook: rejected signature", signature.reason);
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event_id?: string; event_type?: string; occurred_at?: string; data?: Record<string, unknown> };
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
      case "subscription.resumed":
      case "subscription.trialing":
        await syncSubscription(serviceClient, event);
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
  serviceClient: SupabaseClient,
  event: { event_id?: string; event_type?: string; occurred_at?: string; data?: Record<string, unknown> },
) {
  const record = toSubscriptionEventRecord(event, priceIdToPlan);
  if ("error" in record) {
    // Not retryable -- the payload itself is unusable -- so acknowledge it
    // rather than have Paddle redeliver it forever.
    console.error("paddle-webhook: cannot apply event", event.event_id, record.error);
    return;
  }
  if (!record.p_plan_tier) {
    console.error("paddle-webhook: unknown price id; keeping the existing plan_tier", event.event_id);
  }

  // Ordering, replay and cross-tenant checks happen inside this function,
  // under a row lock (see 20261014100000_paddle_subscription_sync_hardening.sql).
  const { data: outcome, error } = await serviceClient.rpc("record_paddle_subscription_event", record);
  if (error) throw error;
  if (outcome !== "applied") {
    console.warn("paddle-webhook: event not applied", event.event_id, event.event_type, outcome);
  }
}
