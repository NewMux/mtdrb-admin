// Starts an MPGS (CrediMax) Hosted Checkout session for a tenant's platform
// subscription. Called by the browser with the signed-in admin's own JWT.
//
// This function is the only place allowed to decide how much a plan costs -
// the amount is never accepted from the client. It creates the MPGS session
// server-side (the API password never reaches the browser), then records a
// pending row in platform_checkout_sessions under the service role so the
// webhook handler has something trustworthy to resolve later.
//
// Plan pricing here must be kept in sync by hand with
// src/config/runtimeConfig.ts's VITE_STARTER_PRICE/VITE_PRO_PRICE - Vite env
// vars baked into the frontend bundle aren't available to this Deno
// runtime, so there is no single source of truth to import from. If you
// change one, change the other and the STARTER_PRICE/PRO_PRICE/
// PLATFORM_CURRENCY secrets set for this function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MPGS_GATEWAY_HOST = Deno.env.get("MPGS_GATEWAY_HOST") ?? "credimax.gateway.mastercard.com";
const MPGS_API_VERSION = Deno.env.get("MPGS_API_VERSION") ?? "100";
const MPGS_MERCHANT_ID = Deno.env.get("MPGS_MERCHANT_ID")!;
const MPGS_API_PASSWORD = Deno.env.get("MPGS_API_PASSWORD")!;

// The public app URL the payer is returned to after paying/cancelling.
const APP_URL = Deno.env.get("APP_URL")!;
const PLATFORM_CURRENCY = Deno.env.get("PLATFORM_CURRENCY") ?? "USD";

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  starter: { amount: Number(Deno.env.get("STARTER_PRICE") ?? "80"), name: "Starter" },
  pro: { amount: Number(Deno.env.get("PRO_PRICE") ?? "130"), name: "Pro" },
};

interface RequestBody {
  planTier?: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing authorization" }, 401, origin);
    }

    // Identify the caller from their own forwarded session - never trust a
    // client-supplied user or tenant id.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Invalid session" }, 401, origin);
    }

    const body = (await req.json().catch(() => null)) as RequestBody | null;
    const planTier = body?.planTier;
    const plan = planTier ? PLAN_PRICES[planTier] : undefined;
    if (!planTier || !plan) {
      return jsonResponse({ error: "Invalid plan" }, 400, origin);
    }

    // service_role from here on: looking up the caller's tenant/role
    // (identity already verified above, so bypassing RLS here is fine) and
    // writing the pending session row - platform_checkout_sessions has no
    // INSERT policy for anyone else, by design.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: membership, error: membershipError } = await adminClient
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) {
      return jsonResponse(
        { error: "Only a tenant admin can start a subscription checkout" },
        403,
        origin,
      );
    }

    const orderId = crypto.randomUUID();

    // CrediMax requires populating available customer/service data for
    // their fraud engine (per their onboarding notice). Only real,
    // already-known data is sent - never fabricated placeholders, which
    // would misinform risk scoring rather than help it. Signup only
    // collects a single "name" field (see Signup.tsx), so first/last name
    // is a best-effort split rather than a guaranteed accurate split.
    const fullName = (userData.user.user_metadata?.name as string | undefined)?.trim();
    const [firstName, ...lastNameParts] = fullName ? fullName.split(/\s+/) : [];
    const lastName = lastNameParts.length > 0 ? lastNameParts.join(" ") : undefined;
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    const mpgsResponse = await fetch(
      `https://${MPGS_GATEWAY_HOST}/api/rest/version/${MPGS_API_VERSION}/merchant/${MPGS_MERCHANT_ID}/session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`merchant.${MPGS_MERCHANT_ID}:${MPGS_API_PASSWORD}`),
        },
        body: JSON.stringify({
          apiOperation: "INITIATE_CHECKOUT",
          interaction: {
            // PURCHASE authorizes and captures in one step, appropriate for
            // an immediately-delivered digital subscription (no separate
            // capture step needed, unlike a shippable-goods order).
            operation: "PURCHASE",
            merchant: { name: "MTDRB" },
            returnUrl: `${APP_URL}/subscribe/complete?order=${orderId}`,
            cancelUrl: `${APP_URL}/subscribe?checkout=cancelled`,
            action: { "3DSecure": "MANDATORY" },
          },
          order: {
            id: orderId,
            currency: PLATFORM_CURRENCY,
            amount: plan.amount.toFixed(2),
            description: `MTDRB ${plan.name} plan subscription`,
            item: [
              {
                name: `${plan.name} Plan - monthly subscription`,
                quantity: 1,
                unitPrice: plan.amount.toFixed(2),
                category: "digital_services",
              },
            ],
          },
          customer: {
            email: userData.user.email,
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          },
          ...(clientIp ? { device: { ipAddress: clientIp } } : {}),
        }),
      },
    );

    const mpgsResult = await mpgsResponse.json();
    if (!mpgsResponse.ok || !mpgsResult?.session?.id) {
      console.error("MPGS session creation failed:", mpgsResponse.status, mpgsResult);
      return jsonResponse({ error: "Unable to start checkout" }, 502, origin);
    }

    const { error: insertError } = await adminClient.from("platform_checkout_sessions").insert({
      tenant_id: membership.tenant_id,
      mpgs_session_id: mpgsResult.session.id,
      mpgs_order_id: orderId,
      plan_tier: planTier,
      amount: plan.amount,
      currency: PLATFORM_CURRENCY,
      status: "pending",
      metadata: { success_indicator: mpgsResult.successIndicator ?? null },
    });
    if (insertError) throw insertError;

    return jsonResponse({ sessionId: mpgsResult.session.id, orderId }, 200, origin);
  } catch (error) {
    console.error("create-checkout-session error:", error);
    return jsonResponse({ error: "Internal error" }, 500, origin);
  }
});
