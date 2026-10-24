// Lets a tenant admin buy or release extra locations: changes the quantity of
// the extra-location line item on their Paddle subscription and records the
// result in platform_subscriptions.extra_locations. See handler.ts for the
// flow and why it is ordered that way, and DEPLOYMENT.md ("Extra locations")
// for setup.
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
//   PADDLE_STARTER_EXTRA_LOCATION_PRICE_ID / PADDLE_PRO_EXTRA_LOCATION_PRICE_ID
//   APP_ALLOWED_ORIGINS                     comma-separated app origins allowed to
//                                           call this from a browser (falls back to
//                                           PLATFORM_ALLOWED_ORIGINS)
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by
// Supabase automatically.

import { createClient } from "npm:@supabase/supabase-js@2";
import { readPriceConfig } from "../_shared/paddle-items.ts";
import {
  handleManageLocations,
  type LocationUsage,
  type ManageDeps,
  type PaddleResult,
  type StoredSubscription,
} from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY")?.trim() || undefined;
const PADDLE_PRODUCTION = Deno.env.get("PADDLE_ENVIRONMENT")?.trim() === "production";
const PADDLE_BASE_URL = PADDLE_PRODUCTION ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

// Highest number of extra locations a tenant may buy here. Keep in step with
// the CHECK on platform_subscriptions.extra_locations and the add-on price's
// maximum quantity in scripts/seed-paddle-catalog.mjs.
const MAX_EXTRA_LOCATIONS = 50;

if (PADDLE_API_KEY && !PADDLE_PRODUCTION && !PADDLE_API_KEY.includes("_sdbx")) {
  console.warn(
    'paddle-manage-locations: PADDLE_ENVIRONMENT is not "production" but PADDLE_API_KEY does not look like a sandbox key ("_sdbx"). Calls will fail until they match.',
  );
}

const allowedOrigins = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? Deno.env.get("PLATFORM_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn("paddle-manage-locations: APP_ALLOWED_ORIGINS is empty, so browsers will be refused by CORS");
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
      signal: AbortSignal.timeout(20_000),
    });
    const json = (await response.json().catch(() => null)) as
      | { data?: { items?: unknown[] }; error?: { type?: string; code?: string; detail?: string } }
      | null;
    if (!response.ok || !json?.data) {
      // Paddle's error object (type/code/detail) carries no customer data.
      return { ok: false, status: response.status, detail: JSON.stringify(json?.error ?? {}) };
    }
    return { ok: true, items: Array.isArray(json.data.items) ? json.data.items : [] };
  } catch (err) {
    return { ok: false, status: 0, detail: err instanceof Error ? err.message : "request failed" };
  }
}

const deps: ManageDeps = {
  allowedOrigins,
  maxExtra: MAX_EXTRA_LOCATIONS,
  prices: readPriceConfig((key) => Deno.env.get(key)),
  paddleConfigured: Boolean(PADDLE_API_KEY),

  async getUsage(token): Promise<LocationUsage | null> {
    const { data, error } = await callerClient(token).rpc("get_location_usage");
    if (error) throw error;
    return (data as LocationUsage | null) ?? null;
  },

  async loadSubscription(tenantId): Promise<StoredSubscription | null> {
    const { data, error } = await adminClient
      .from("platform_subscriptions")
      .select("plan_tier, status, payment_provider, payment_reference, extra_locations")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) throw error;
    return (data as StoredSubscription | null) ?? null;
  },

  async rateLimit(key) {
    // 20 changes per hour per gym: generous for real use, tight enough that a
    // stuck client cannot hammer the Paddle API (each change can bill).
    const { data, error } = await adminClient.rpc("check_rate_limit", {
      p_key: key,
      p_max_count: 20,
      p_window_seconds: 3600,
    });
    if (error) throw error;
    return data !== false;
  },

  getPaddleItems: (subscriptionId) => paddle("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`),

  updatePaddleItems: (subscriptionId, items, mode) =>
    paddle("PATCH", `/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      items,
      proration_billing_mode: mode,
    }),

  async saveExtraLocations(tenantId, extraLocations) {
    const { error } = await adminClient
      .from("platform_subscriptions")
      .update({ extra_locations: extraLocations })
      .eq("tenant_id", tenantId);
    if (error) throw error;
  },

  log: (message, detail) => console.error(`paddle-manage-locations: ${message}`, detail ?? ""),
};

Deno.serve(async (req) => {
  const result = await handleManageLocations(
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
