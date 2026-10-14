// Cancels the caller's platform subscription at the end of the period
// they've already paid for.
//
// Previously CancelSubscriptionModal set platform_subscriptions.status to
// 'cancelled' straight from the browser. Paddle never heard about it, so it
// kept charging the customer, and the next renewal webhook re-activated the
// row. This function instead asks Paddle to cancel at the next billing date
// (POST /subscriptions/{id}/cancel, effective_from=next_billing_period).
// Paddle then sends subscription.updated (scheduled_change.action=cancel)
// and, when the period ends, subscription.canceled; paddle-webhook applies
// both. Rows that aren't Paddle-managed (manual grants) are cancelled here
// directly and keep access until current_period_end.
//
// verify_jwt is off in supabase/config.toml so the browser's CORS preflight
// (sent without an Authorization header) reaches this code; the caller's
// JWT is verified below instead.

import { createClient } from "npm:@supabase/supabase-js@2";
import { paddleApiBase } from "../_shared/paddle.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY");
const PADDLE_ENVIRONMENT = Deno.env.get("PADDLE_ENVIRONMENT") ?? "sandbox";
// Comma-separated list of app origins allowed to call this from a browser,
// e.g. "https://app.example.com". Unset falls back to "*", which is still
// safe here because every request must carry a valid user JWT.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.length === 0 ? "*" : ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

const MAX_TEXT = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(req, { error: "Not signed in" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json(req, { error: "Not signed in" }, 401);

  let body: { reason?: unknown; feedback?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const reason = typeof body.reason === "string" ? body.reason.slice(0, MAX_TEXT) : "";
  const feedback = typeof body.feedback === "string" ? body.feedback.slice(0, MAX_TEXT) : "";

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Same tenant resolution as the client (oldest membership), and only a
  // workspace admin may manage billing.
  const { data: membership, error: membershipError } = await serviceClient
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError) {
    console.error("paddle-cancel-subscription: membership lookup failed", membershipError);
    return json(req, { error: "Could not load your workspace" }, 500);
  }
  if (!membership?.tenant_id) return json(req, { error: "No workspace found" }, 403);
  if (membership.role !== "admin") return json(req, { error: "Only a workspace admin can manage billing" }, 403);

  const { data: subscription, error: subscriptionError } = await serviceClient
    .from("platform_subscriptions")
    .select("status, payment_provider, payment_reference, current_period_end, metadata")
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();
  if (subscriptionError) {
    console.error("paddle-cancel-subscription: subscription lookup failed", subscriptionError);
    return json(req, { error: "Could not load your subscription" }, 500);
  }
  if (!subscription) return json(req, { error: "No subscription to cancel" }, 404);

  const cancellation = {
    cancellation_reason: reason,
    cancellation_feedback: feedback,
    cancellation_requested_at: new Date().toISOString(),
    cancellation_requested_by: userData.user.id,
  };
  const metadata = { ...(subscription.metadata ?? {}), ...cancellation };

  if (subscription.payment_provider === "paddle" && subscription.payment_reference) {
    if (!PADDLE_API_KEY) {
      console.error("paddle-cancel-subscription: PADDLE_API_KEY is not configured");
      return json(req, { error: "Billing is not configured" }, 500);
    }

    let apiBase: string;
    try {
      apiBase = paddleApiBase(PADDLE_ENVIRONMENT, PADDLE_API_KEY);
    } catch (configError) {
      console.error("paddle-cancel-subscription:", configError);
      return json(req, { error: "Billing is not configured" }, 500);
    }

    const response = await fetch(
      `${apiBase}/subscriptions/${encodeURIComponent(subscription.payment_reference)}/cancel`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${PADDLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ effective_from: "next_billing_period" }),
      },
    );
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("paddle-cancel-subscription: Paddle refused the cancellation", response.status, result?.error);
      return json(req, { error: "Billing provider could not cancel the subscription. Please try again." }, 502);
    }

    // Status and dates are left to paddle-webhook, which will receive the
    // scheduled cancellation from Paddle; only record why here.
    const { error: updateError } = await serviceClient
      .from("platform_subscriptions")
      .update({ metadata })
      .eq("tenant_id", membership.tenant_id);
    if (updateError) console.error("paddle-cancel-subscription: could not record reason", updateError);

    const effectiveAt = result?.data?.scheduled_change?.effective_at ?? subscription.current_period_end ?? null;
    return json(req, { cancelled: true, effective_at: effectiveAt });
  }

  // Manual/legacy grant: nothing to cancel upstream. Access continues until
  // current_period_end (see is_tenant_entitled()).
  const { error: updateError } = await serviceClient
    .from("platform_subscriptions")
    .update({ status: "cancelled", metadata })
    .eq("tenant_id", membership.tenant_id);
  if (updateError) {
    console.error("paddle-cancel-subscription: update failed", updateError);
    return json(req, { error: "Could not cancel the subscription" }, 500);
  }
  return json(req, { cancelled: true, effective_at: subscription.current_period_end ?? null });
});
