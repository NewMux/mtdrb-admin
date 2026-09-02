// Creates an MPGS (CrediMax) Hosted Checkout session for a platform
// subscription payment. Runs with Supabase's default JWT verification, so
// only a genuinely authenticated user can call this.
//
// The amount charged is always computed here from server-side secrets
// (STARTER_PRICE/PRO_PRICE/PLATFORM_CURRENCY), never trusted from the
// request body -- the same principle the platform_subscriptions
// self-service trigger already enforces at the database layer.
//
// IMPORTANT: the exact MPGS request/response shape below follows the
// standard v100 Hosted Checkout ("INITIATE_CHECKOUT") pattern. Verify it
// against CrediMax's actual integration guide
// (https://credimax.gateway.mastercard.com/api/documentation/integrationGuidelines/index.html)
// before relying on this for real customer traffic -- this sandbox could
// not reach that domain to confirm the exact field names for this
// merchant's API version.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CREDIMAX_GATEWAY_HOST =
  Deno.env.get("CREDIMAX_GATEWAY_HOST") || "credimax.gateway.mastercard.com";
const CREDIMAX_MERCHANT_ID = Deno.env.get("CREDIMAX_MERCHANT_ID");
const CREDIMAX_API_PASSWORD = Deno.env.get("CREDIMAX_API_PASSWORD");
const CREDIMAX_API_VERSION = Deno.env.get("CREDIMAX_API_VERSION") || "100";

const APP_URL = Deno.env.get("APP_URL") || "https://mtdrb.net";
const PLATFORM_CURRENCY = Deno.env.get("PLATFORM_CURRENCY") || "BHD";

const PLAN_PRICING: Record<string, { price: number; name: string }> = {
  starter: {
    price: Number(Deno.env.get("STARTER_PRICE")) || 80,
    name: Deno.env.get("STARTER_PLAN_NAME") || "Starter",
  },
  pro: {
    price: Number(Deno.env.get("PRO_PRICE")) || 130,
    name: Deno.env.get("PRO_PLAN_NAME") || "Pro",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!CREDIMAX_MERCHANT_ID || !CREDIMAX_API_PASSWORD) {
      throw new Error(
        "CrediMax is not configured (missing CREDIMAX_MERCHANT_ID/CREDIMAX_API_PASSWORD secrets).",
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Missing Authorization header.", 401);
    }

    // Identify the caller from their own JWT -- never trust a tenant/user id
    // sent in the request body.
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();
    if (userError || !user) {
      return jsonError("Not authenticated.", 401);
    }

    const { planId } = (await req.json().catch(() => ({}))) as {
      planId?: string;
    };
    const plan = planId ? PLAN_PRICING[planId] : undefined;
    if (!plan) {
      return jsonError("Unknown or missing planId.", 400);
    }

    // Only a tenant admin may initiate platform billing -- mirrors the
    // "Tenant admins can insert/update platform subscriptions" RLS policies.
    const { data: membership, error: membershipError } = await callerClient
      .from("memberships")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) {
      return jsonError("Only a tenant admin can manage billing.", 403);
    }
    const tenantId = membership.tenant_id as string;

    // Order id encodes the tenant id so the webhook can resolve the tenant
    // without trusting anything else in the notification payload; timestamp
    // keeps it unique per checkout attempt.
    const orderId = `sub-${tenantId}-${Date.now()}`;

    const sessionResponse = await fetch(
      `https://${CREDIMAX_GATEWAY_HOST}/api/rest/version/${CREDIMAX_API_VERSION}/merchant/${CREDIMAX_MERCHANT_ID}/session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`merchant.${CREDIMAX_MERCHANT_ID}:${CREDIMAX_API_PASSWORD}`)}`,
        },
        body: JSON.stringify({
          apiOperation: "INITIATE_CHECKOUT",
          order: {
            id: orderId,
            amount: plan.price,
            currency: PLATFORM_CURRENCY,
            description: `MTDRB ${plan.name} plan subscription`,
            item: [
              {
                name: `MTDRB ${plan.name} plan`,
                quantity: 1,
                unitPrice: plan.price,
                category: "software_subscription",
              },
            ],
          },
          interaction: {
            operation: "PURCHASE",
            merchant: {
              name: "MTDRB",
            },
            returnUrl: `${APP_URL}/subscribe/callback?orderId=${orderId}`,
            displayControl: {
              billingAddress: "HIDE",
            },
          },
          customer: {
            email: user.email,
          },
          device: {
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
          },
        }),
      },
    );

    const sessionResult = await sessionResponse.json();
    if (!sessionResponse.ok || !sessionResult?.session?.id) {
      console.error("CrediMax session creation failed:", sessionResult);
      return jsonError(
        "Could not start checkout with the payment gateway. Please try again.",
        502,
      );
    }

    // Record the pending checkout attempt as a trusted, service-role write --
    // the self-service trigger blocks the anon/authenticated key from doing
    // this, by design.
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: upsertError } = await serviceClient
      .from("platform_subscriptions")
      .upsert(
        {
          tenant_id: tenantId,
          payment_reference: orderId,
          payment_provider: "credimax",
          metadata: {
            pending_checkout: {
              order_id: orderId,
              session_id: sessionResult.session.id,
              plan_tier: planId,
              amount: plan.price,
              currency: PLATFORM_CURRENCY,
              initiated_at: new Date().toISOString(),
            },
          },
        },
        { onConflict: "tenant_id" },
      );
    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({
        sessionId: sessionResult.session.id,
        merchantId: CREDIMAX_MERCHANT_ID,
        gatewayHost: CREDIMAX_GATEWAY_HOST,
        apiVersion: CREDIMAX_API_VERSION,
        orderId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("credimax-checkout error:", error);
    return jsonError("Unexpected error starting checkout.", 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
