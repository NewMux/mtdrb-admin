// Lets a tenant admin move their gym from Starter to Pro on the subscription
// they already have: previews the prorated price, then changes the items in
// Paddle (charging the difference now) and records the new plan. See handler.ts
// for the flow and why it is ordered that way, and DEPLOYMENT.md ("Upgrading
// from Starter to Pro") for setup.
//
// Deployed with verify_jwt = false (supabase/config.toml) because the browser's
// CORS preflight carries no Authorization header and the platform's own JWT
// gate would reject it before this code runs. The caller's JWT is verified
// here instead: get_location_usage() runs as the caller, so Postgres decides
// who they are, which gym is theirs and whether they are its admin.
//
// Required secrets (supabase secrets set ...):
//   PADDLE_API_KEY                          server-side Paddle API key
//                                           (sandbox keys contain "_sdbx")
//   PADDLE_ENVIRONMENT                      "sandbox" (default) or "production"
//   PADDLE_STARTER_PRICE_ID / PADDLE_PRO_PRICE_ID
//   PADDLE_PRO_EXTRA_LOCATION_PRICE_ID      only needed for gyms that already pay
//                                           for extra locations
//   APP_ALLOWED_ORIGINS                     comma-separated app origins allowed to
//                                           call this from a browser (falls back to
//                                           PLATFORM_ALLOWED_ORIGINS)
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by
// Supabase automatically.

import { createClient } from "npm:@supabase/supabase-js@2";
import { readPriceConfig } from "../_shared/paddle-items.ts";
import {
  handleChangePlan,
  type Caller,
  type ChangePlanDeps,
  type PaddleItem,
  type PaddleResult,
  type StoredSubscription,
} from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY")?.trim() || undefined;
const PADDLE_PRODUCTION = Deno.env.get("PADDLE_ENVIRONMENT")?.trim() === "production";
const PADDLE_BASE_URL = PADDLE_PRODUCTION ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

if (PADDLE_API_KEY && !PADDLE_PRODUCTION && !PADDLE_API_KEY.includes("_sdbx")) {
  console.warn(
    'paddle-change-plan: PADDLE_ENVIRONMENT is not "production" but PADDLE_API_KEY does not look like a sandbox key ("_sdbx"). Calls will fail until they match.',
  );
}

const allowedOrigins = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? Deno.env.get("PLATFORM_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn("paddle-change-plan: APP_ALLOWED_ORIGINS is empty, so browsers will be refused by CORS");
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// A client that acts as the caller (their JWT), so Postgres sees their identity.
const callerClient = (token: string) =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

async function paddle(method: "GET" | "PATCH", path: string, body?: unknown): Promise<PaddleResult> {
  try {
    const response = await fetch(`${PADDLE_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      // A change that bills immediately can take a while to come back.
      signal: AbortSignal.timeout(30_000),
    });
    const json = (await response.json().catch(() => null)) as
      | { data?: Record<string, unknown>; error?: { type?: string; code?: string; detail?: string } }
      | null;
    if (!response.ok || !json?.data) {
      // Paddle's error object (type/code/detail) carries no customer data.
      return { ok: false, status: response.status, detail: JSON.stringify(json?.error ?? {}) };
    }
    return { ok: true, subscription: json.data };
  } catch (err) {
    return { ok: false, status: 0, detail: err instanceof Error ? err.message : "request failed" };
  }
}

const updateBody = (items: PaddleItem[]) => ({
  items,
  // Credit the unused part of Starter and charge the rest of the period at Pro,
  // now, to the card on file.
  proration_billing_mode: "prorated_immediately",
  // A declined card leaves the subscription exactly as it was.
  on_payment_failure: "prevent_change",
});

const deps: ChangePlanDeps = {
  allowedOrigins,
  prices: readPriceConfig((key) => Deno.env.get(key)),
  paddleConfigured: Boolean(PADDLE_API_KEY),

  async getCaller(token): Promise<Caller | null> {
    const { data, error } = await callerClient(token).rpc("get_location_usage");
    if (error) throw error;
    const row = data as { tenant_id?: unknown; is_admin?: unknown } | null;
    if (!row || typeof row.tenant_id !== "string") return null;
    return { tenant_id: row.tenant_id, is_admin: row.is_admin === true };
  },

  async loadSubscription(tenantId): Promise<StoredSubscription | null> {
    const { data, error } = await adminClient
      .from("platform_subscriptions")
      .select("plan_tier, status, payment_provider, payment_reference, cancel_at, extra_locations")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) throw error;
    return (data as StoredSubscription | null) ?? null;
  },

  async rateLimit(key, max) {
    const { data, error } = await adminClient.rpc("check_rate_limit", {
      p_key: key,
      p_max_count: max,
      p_window_seconds: 3600,
    });
    if (error) throw error;
    return data !== false;
  },

  getPaddleSubscription: (subscriptionId) => paddle("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`),

  previewUpdate: (subscriptionId, items) =>
    paddle("PATCH", `/subscriptions/${encodeURIComponent(subscriptionId)}/preview`, updateBody(items)),

  applyUpdate: (subscriptionId, items) =>
    paddle("PATCH", `/subscriptions/${encodeURIComponent(subscriptionId)}`, updateBody(items)),

  async saveUpgrade(tenantId, upgrade) {
    const { error } = await adminClient
      .from("platform_subscriptions")
      .update({
        plan_tier: upgrade.planTier,
        ...(upgrade.amount !== null ? { amount: upgrade.amount } : {}),
        ...(upgrade.currency ? { currency: upgrade.currency } : {}),
        ...(upgrade.extraLocations !== null ? { extra_locations: upgrade.extraLocations } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId);
    if (error) throw error;
  },

  log: (message, detail) => console.error(`paddle-change-plan: ${message}`, detail ?? ""),
};

Deno.serve(async (req) => {
  const result = await handleChangePlan(
    {
      method: req.method,
      origin: req.headers.get("Origin")?.replace(/\/+$/, "") ?? null,
      authorization: req.headers.get("Authorization"),
      bodyText: req.method === "POST" ? await req.text() : "",
    },
    deps,
  );
  return new Response(result.body, { status: result.status, headers: result.headers });
});
