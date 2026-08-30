// Receives MPGS (CrediMax) webhook notifications for checkout transactions.
//
// This is a server-to-server endpoint, not browser-callable - no CORS
// handling needed. Authenticity is verified via the X-Notification-Secret
// header (configured in Merchant Administration > Admin > Webhook
// Notifications, a gateway-generated 32-character secret).
//
// IMPORTANT: per MPGS's own docs, notification delivery isn't guaranteed-
// timely and shouldn't be treated as the source of truth for settlement -
// this handler only uses a notification as a trigger to re-fetch the
// order's authoritative status via the Retrieve Order API, never by
// trusting fields inside the notification body itself. That call
// (retrieveAuthoritativeOrderStatus below) is NOT YET IMPLEMENTED: the
// Retrieve Order/Transaction endpoint path and its response shape for
// this MPGS API version haven't been confirmed against CrediMax's docs
// yet. Everything else in this file (secret verification, session lookup,
// idempotency, the platform_subscriptions/platform_checkout_sessions
// writes) is complete and ready - only that one call needs finishing
// before this function can be deployed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MPGS_WEBHOOK_SECRET = Deno.env.get("MPGS_WEBHOOK_SECRET")!;

// Billing period granted per successful charge. Monthly to match
// SUBSCRIPTION_PLANS' period="month" - this integration only covers a
// single paid period per checkout (see the plan's "explicitly deferred"
// section on recurring/renewal billing).
const BILLING_PERIOD_DAYS = 30;

type AuthoritativeOrderStatus =
  | { result: "SUCCESS"; amount: number; currency: string }
  | { result: "FAILURE" }
  | { result: "PENDING" };

/**
 * Calls MPGS's Retrieve Order (or Retrieve Transaction) API to get the
 * order's current, authoritative status - the only thing this handler
 * trusts for whether money actually moved.
 *
 * NOT YET IMPLEMENTED: needs the confirmed endpoint path and response
 * field names (order.status? transaction[].result? response.gatewayCode?)
 * from CrediMax's Retrieve Order/Query Transaction documentation.
 */
async function retrieveAuthoritativeOrderStatus(
  _orderId: string,
): Promise<AuthoritativeOrderStatus> {
  throw new Error(
    "retrieveAuthoritativeOrderStatus is not implemented - confirm MPGS's Retrieve Order/Transaction API contract before deploying this function",
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const providedSecret = req.headers.get("x-notification-secret");
  if (!providedSecret || providedSecret !== MPGS_WEBHOOK_SECRET) {
    console.error("mpgs-webhook: invalid or missing X-Notification-Secret");
    return new Response("Unauthorized", { status: 401 });
  }

  const notificationId = req.headers.get("x-notification-id");
  const attempt = req.headers.get("x-notification-attempt");

  try {
    const body = await req.json().catch(() => null);

    // The notification's own claims about the transaction result are
    // deliberately not read here (see file header) - only used to find
    // which order this is about, matching the order.id we generated
    // ourselves in create-checkout-session and stored on
    // platform_checkout_sessions.mpgs_order_id.
    const orderId: string | undefined = body?.order?.id ?? body?.transaction?.order?.id;
    if (!orderId) {
      console.error("mpgs-webhook: notification payload has no recognizable order id", {
        notificationId,
        attempt,
      });
      return new Response("Bad request: missing order id", { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: session, error: sessionError } = await adminClient
      .from("platform_checkout_sessions")
      .select("id, tenant_id, plan_tier, amount, currency, status")
      .eq("mpgs_order_id", orderId)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) {
      console.error("mpgs-webhook: no checkout session found for order", orderId);
      return new Response("Not found", { status: 404 });
    }

    // Idempotency: a redelivered notification (same or later attempt) for
    // an order we've already resolved is a no-op, not an error - MPGS
    // retries up to 20 times over 3 days regardless of whether we already
    // handled an earlier delivery.
    if (session.status !== "pending") {
      return new Response("OK (already resolved)", { status: 200 });
    }

    const authoritative = await retrieveAuthoritativeOrderStatus(orderId);

    if (authoritative.result === "PENDING") {
      // Still in flight (e.g. mid-3DS-challenge) - leave as pending, a
      // later notification will re-trigger this handler.
      return new Response("OK (pending)", { status: 200 });
    }

    const now = new Date().toISOString();

    if (authoritative.result === "SUCCESS") {
      const currentPeriodEnd = new Date(
        Date.now() + BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { error: subError } = await adminClient.from("platform_subscriptions").upsert(
        {
          tenant_id: session.tenant_id,
          status: "active",
          plan_tier: session.plan_tier,
          amount: authoritative.amount,
          currency: authoritative.currency,
          current_period_end: currentPeriodEnd,
          metadata: { last_order_id: orderId, last_event: "mpgs_checkout_success" },
          updated_at: now,
        },
        { onConflict: "tenant_id" },
      );
      if (subError) throw subError;

      await adminClient
        .from("platform_checkout_sessions")
        .update({ status: "completed", updated_at: now })
        .eq("id", session.id);

      await adminClient.from("activities").insert({
        tenant_id: session.tenant_id,
        type: "subscription",
        title: "Subscription Active",
        description: `Payment received for the ${session.plan_tier} plan.`,
        status: "success",
        metadata: { order_id: orderId },
      });
    } else {
      await adminClient
        .from("platform_checkout_sessions")
        .update({ status: "failed", updated_at: now })
        .eq("id", session.id);

      await adminClient.from("activities").insert({
        tenant_id: session.tenant_id,
        type: "subscription",
        title: "Payment Failed",
        description: `Checkout for the ${session.plan_tier} plan did not complete.`,
        status: "failed",
        metadata: { order_id: orderId },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("mpgs-webhook error:", error);
    // Non-2xx so MPGS retries per its documented backoff schedule.
    return new Response("Internal error", { status: 500 });
  }
});
