// Receives CrediMax (MPGS) server-to-server payment notifications and is
// the ONLY thing allowed to activate a platform subscription -- the
// platform_subscriptions self-service trigger blocks every other caller
// from setting status to 'active'/'past_due'/'failed' or recording a real
// charge amount. This function runs with JWT verification disabled (see
// supabase/config.toml) since CrediMax calls it directly, not as a logged-in
// Supabase user; it authenticates the caller via HTTP Basic Auth instead.
//
// Security: never trust the notification body's claimed status by itself --
// after receiving one, this always re-fetches the order directly from MPGS
// with our own API credentials (a "Retrieve Order" call) and acts on that
// response, not on whatever the incoming request claimed.
//
// IMPORTANT: same caveat as credimax-checkout -- verify the exact
// notification payload shape and order.status values against CrediMax's
// actual integration guide before relying on this for real customer
// traffic. Configure the webhook URL + this same Basic Auth username/
// password pair in CrediMax's merchant portal notification settings.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CREDIMAX_GATEWAY_HOST =
  Deno.env.get("CREDIMAX_GATEWAY_HOST") || "credimax.gateway.mastercard.com";
const CREDIMAX_MERCHANT_ID = Deno.env.get("CREDIMAX_MERCHANT_ID");
const CREDIMAX_API_PASSWORD = Deno.env.get("CREDIMAX_API_PASSWORD");
const CREDIMAX_API_VERSION = Deno.env.get("CREDIMAX_API_VERSION") || "100";

const WEBHOOK_USERNAME = Deno.env.get("CREDIMAX_WEBHOOK_USERNAME");
const WEBHOOK_PASSWORD = Deno.env.get("CREDIMAX_WEBHOOK_PASSWORD");

const ORDER_ID_PATTERN = /^sub-([0-9a-f-]{36})-\d+$/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!CREDIMAX_MERCHANT_ID || !CREDIMAX_API_PASSWORD) {
    console.error("credimax-webhook: gateway credentials not configured.");
    return new Response("Server not configured", { status: 500 });
  }

  let orderId: string | undefined;
  try {
    const payload = await req.json().catch(() => ({}));
    orderId = payload?.order?.id || payload?.orderId || payload?.id;
  } catch {
    // fall through -- orderId stays undefined, handled below
  }

  if (!orderId) {
    return new Response("Missing order id", { status: 400 });
  }

  const match = ORDER_ID_PATTERN.exec(orderId);
  if (!match) {
    // Not one of our orders (or malformed) -- acknowledge so the gateway
    // doesn't retry forever, but don't act on it.
    console.warn("credimax-webhook: unrecognized order id format:", orderId);
    return new Response("ok", { status: 200 });
  }
  const tenantId = match[1];

  // Never trust the notification body's claimed result -- re-fetch the
  // order directly from MPGS with our own credentials.
  const orderResponse = await fetch(
    `https://${CREDIMAX_GATEWAY_HOST}/api/rest/version/${CREDIMAX_API_VERSION}/merchant/${CREDIMAX_MERCHANT_ID}/order/${orderId}`,
    {
      headers: {
        Authorization: `Basic ${btoa(`merchant.${CREDIMAX_MERCHANT_ID}:${CREDIMAX_API_PASSWORD}`)}`,
      },
    },
  );
  const order = await orderResponse.json().catch(() => null);
  if (!orderResponse.ok || !order) {
    console.error("credimax-webhook: could not retrieve order from gateway:", orderId);
    return new Response("Could not verify order", { status: 502 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: currentSub } = await supabase
    .from("platform_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const now = new Date().toISOString();
  const pendingCheckout = currentSub?.metadata?.pending_checkout as
    | { plan_tier?: string }
    | undefined;
  const planTier = pendingCheckout?.plan_tier || currentSub?.plan_tier || "starter";

  // MPGS order.status: CAPTURED (funds settled) is the success state we
  // activate on; treat anything else (FAILED, CANCELLED, etc.) as a failure.
  // Verify this against the real docs -- see file header.
  if (order.status === "CAPTURED" || order.status === "PAID") {
    const currentPeriodEnd = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error } = await supabase
      .from("platform_subscriptions")
      .upsert(
        {
          tenant_id: tenantId,
          status: "active",
          plan_tier: planTier,
          amount: order.amount ?? currentSub?.metadata?.pending_checkout?.amount,
          currency: order.currency,
          payment_reference: orderId,
          payment_provider: "credimax",
          current_period_end: currentPeriodEnd,
          metadata: {
            ...currentSub?.metadata,
            pending_checkout: null,
            retry_count: 0,
            last_success_at: now,
            last_order_status: order.status,
          },
        },
        { onConflict: "tenant_id" },
      );
    if (error) {
      console.error("credimax-webhook: failed to activate subscription:", error);
      return new Response("Database error", { status: 500 });
    }

    await logActivity(supabase, tenantId, "Subscription Active", `Payment received via CrediMax. Plan: ${planTier}.`, "success", { orderId, order });
  } else {
    const retryCount = ((currentSub?.metadata?.retry_count as number) || 0) + 1;
    const isLapsed = retryCount >= 3;

    const { error } = await supabase
      .from("platform_subscriptions")
      .upsert(
        {
          tenant_id: tenantId,
          status: isLapsed ? "failed" : "past_due",
          payment_reference: orderId,
          payment_provider: "credimax",
          metadata: {
            ...currentSub?.metadata,
            pending_checkout: null,
            retry_count: retryCount,
            last_failed_at: now,
            last_order_status: order.status,
          },
        },
        { onConflict: "tenant_id" },
      );
    if (error) {
      console.error("credimax-webhook: failed to record failed payment:", error);
      return new Response("Database error", { status: 500 });
    }

    await logActivity(
      supabase,
      tenantId,
      isLapsed ? "Subscription Lapsed" : "Payment Failed",
      `CrediMax order ${orderId} status: ${order.status}.`,
      "warning",
      { orderId, order },
    );
  }

  return new Response("ok", { status: 200 });
});

function isAuthorized(req: Request): boolean {
  if (!WEBHOOK_USERNAME || !WEBHOOK_PASSWORD) {
    console.error("credimax-webhook: CREDIMAX_WEBHOOK_USERNAME/PASSWORD not configured.");
    return false;
  }
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Basic ")) return false;
  try {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    return username === WEBHOOK_USERNAME && password === WEBHOOK_PASSWORD;
  } catch {
    return false;
  }
}

// deno-lint-ignore no-explicit-any
async function logActivity(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  title: string,
  description: string,
  status: "success" | "warning",
  metadata: unknown,
) {
  try {
    await supabase.from("activities").insert({
      tenant_id: tenantId,
      type: "subscription",
      title,
      description,
      status: status === "warning" ? "pending" : status,
      // deno-lint-ignore no-explicit-any
      metadata: metadata as any,
    });
  } catch (err) {
    console.error("credimax-webhook: failed to log activity:", err);
  }
}
