// Lets a tenant admin cancel (at the end of the paid period) or keep their
// MTDRB subscription. Asks Paddle first, then records platform_subscriptions
// .cancel_at. See handler.ts for the flow and why it is ordered that way, and
// DEPLOYMENT.md ("Cancelling a subscription") for setup.
//
// Deployed with verify_jwt = false (supabase/config.toml) because the browser's
// CORS preflight carries no Authorization header and the platform's own JWT
// gate would reject it before this code runs. The caller's JWT is verified
// here instead: get_location_usage() runs as the caller, so Postgres decides
// who they are, which gym is theirs and whether they are its admin. (It is the
// existing RPC that returns exactly that identity; the location numbers it also
// returns are ignored here.)
//
// Required secrets (supabase secrets set ...):
//   PADDLE_API_KEY       server-side Paddle API key (sandbox keys contain "_sdbx")
//   PADDLE_ENVIRONMENT   "sandbox" (default) or "production"
//   APP_ALLOWED_ORIGINS  comma-separated app origins allowed to call this from a
//                        browser (falls back to PLATFORM_ALLOWED_ORIGINS)
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by
// Supabase automatically.

import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCancelSubscription, type Caller, type CancelDeps, type PaddleResult, type StoredSubscription } from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY")?.trim() || undefined;
const PADDLE_PRODUCTION = Deno.env.get("PADDLE_ENVIRONMENT")?.trim() === "production";
const PADDLE_BASE_URL = PADDLE_PRODUCTION ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

if (PADDLE_API_KEY && !PADDLE_PRODUCTION && !PADDLE_API_KEY.includes("_sdbx")) {
  console.warn(
    'paddle-cancel-subscription: PADDLE_ENVIRONMENT is not "production" but PADDLE_API_KEY does not look like a sandbox key ("_sdbx"). Calls will fail until they match.',
  );
}

const allowedOrigins = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? Deno.env.get("PLATFORM_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn("paddle-cancel-subscription: APP_ALLOWED_ORIGINS is empty, so browsers will be refused by CORS");
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

async function paddle(method: "POST" | "PATCH", path: string, body: unknown): Promise<PaddleResult> {
  try {
    const response = await fetch(`${PADDLE_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
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

const deps: CancelDeps = {
  allowedOrigins,
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
      .select("status, payment_provider, payment_reference, cancel_at, current_period_end")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) throw error;
    return (data as StoredSubscription | null) ?? null;
  },

  async rateLimit(key) {
    // 10 changes per hour per gym: plenty for a person deciding, tight enough
    // that a stuck client cannot hammer the Paddle API.
    const { data, error } = await adminClient.rpc("check_rate_limit", {
      p_key: key,
      p_max_count: 10,
      p_window_seconds: 3600,
    });
    if (error) throw error;
    return data !== false;
  },

  // "next_billing_period": the customer has paid for this period, so they keep
  // access until it ends and are not billed again.
  scheduleCancel: (subscriptionId) =>
    paddle("POST", `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, { effective_from: "next_billing_period" }),

  removeScheduledCancel: (subscriptionId) =>
    paddle("PATCH", `/subscriptions/${encodeURIComponent(subscriptionId)}`, { scheduled_change: null }),

  async saveCancelAt(tenantId, { cancelAt, currentPeriodEnd }) {
    const { error } = await adminClient
      .from("platform_subscriptions")
      .update({
        cancel_at: cancelAt,
        // Keep access pinned to the real end of the paid period; never write null over a known date.
        ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
      })
      .eq("tenant_id", tenantId);
    if (error) throw error;
  },

  log: (message, detail) => console.error(`paddle-cancel-subscription: ${message}`, detail ?? ""),
};

Deno.serve(async (req) => {
  const result = await handleCancelSubscription(
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
