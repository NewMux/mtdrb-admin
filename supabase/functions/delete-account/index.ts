// Lets a signed-in person erase their account (and, for a gym admin, the whole
// gym). See handler.ts for the flow and why it is ordered that way, and
// DEPLOYMENT.md ("Deleting an account") for setup.
//
// Deployed with verify_jwt = false (supabase/config.toml) because the browser's
// CORS preflight carries no Authorization header and the platform's own JWT
// gate would reject it before this code runs. The caller's JWT is verified here
// instead (auth.getUser(token) asks Supabase Auth, which checks the signature
// and that the user still exists).
//
// Required secrets (supabase secrets set ...):
//   PADDLE_API_KEY       server-side Paddle API key (sandbox keys contain "_sdbx")
//   PADDLE_ENVIRONMENT   "sandbox" (default) or "production"
//   APP_ALLOWED_ORIGINS  comma-separated app origins allowed to call this from a
//                        browser (falls back to PLATFORM_ALLOWED_ORIGINS)
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by
// Supabase automatically.

import { createClient } from "npm:@supabase/supabase-js@2";
import { removeTenantFiles, type StorageApi } from "../_shared/tenant-storage.ts";
import {
  handleDeleteAccount,
  type Caller,
  type DeleteDeps,
  type DeleteOutcome,
  type PaddleResult,
  type StoredSubscription,
} from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY")?.trim() || undefined;
const PADDLE_PRODUCTION = Deno.env.get("PADDLE_ENVIRONMENT")?.trim() === "production";
const PADDLE_BASE_URL = PADDLE_PRODUCTION ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

const allowedOrigins = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? Deno.env.get("PLATFORM_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn("delete-account: APP_ALLOWED_ORIGINS is empty, so browsers will be refused by CORS");
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

async function paddleCancelNow(subscriptionId: string): Promise<PaddleResult> {
  try {
    const response = await fetch(`${PADDLE_BASE_URL}/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${PADDLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ effective_from: "immediately" }),
      signal: AbortSignal.timeout(20_000),
    });
    if (response.ok) return { ok: true };
    const json = (await response.json().catch(() => null)) as { error?: { type?: string; code?: string; detail?: string } } | null;
    // Paddle's error object (type/code/detail) carries no customer data.
    return { ok: false, status: response.status, detail: JSON.stringify(json?.error ?? {}) };
  } catch (err) {
    return { ok: false, status: 0, detail: err instanceof Error ? err.message : "request failed" };
  }
}

function outcomeFromRpc(data: unknown, error: { message: string; code?: string } | null): DeleteOutcome {
  if (error) {
    // The functions raise readable messages for the refusals a person can act
    // on (wrong name, only admin...); anything else is an internal failure.
    const refusal = ["22023", "55000", "42501", "P0002"].includes(error.code ?? "");
    if (refusal) return { ok: false, code: error.code ?? "", message: error.message };
    throw new Error(error.message);
  }
  const row = (data ?? {}) as { deleted_users?: unknown };
  return { ok: true, deletedUsers: typeof row.deleted_users === "number" ? row.deleted_users : 1 };
}

const deps: DeleteDeps = {
  allowedOrigins,
  paddleConfigured: Boolean(PADDLE_API_KEY),

  async getCaller(token): Promise<Caller | null> {
    const { data: auth, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !auth?.user) return null;
    const user = auth.user;

    const { data: usage, error: usageError } = await callerClient(token).rpc("get_location_usage");
    if (usageError) throw usageError;
    const row = usage as { tenant_id?: unknown; is_admin?: unknown } | null;
    const tenantId = row && typeof row.tenant_id === "string" ? row.tenant_id : null;

    let tenantName: string | null = null;
    if (tenantId) {
      const { data: tenant, error } = await adminClient.from("tenants").select("name").eq("id", tenantId).maybeSingle();
      if (error) throw error;
      tenantName = (tenant as { name?: string } | null)?.name ?? null;
    }

    const { data: platformAdmin, error: paError } = await adminClient
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (paError) throw paError;

    return {
      user_id: user.id,
      email: user.email ?? null,
      tenant_id: tenantId,
      tenant_name: tenantName,
      is_admin: row?.is_admin === true,
      is_platform_admin: platformAdmin !== null,
    };
  },

  async loadSubscription(tenantId): Promise<StoredSubscription | null> {
    const { data, error } = await adminClient
      .from("platform_subscriptions")
      .select("status, payment_provider, payment_reference")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) throw error;
    return (data as StoredSubscription | null) ?? null;
  },

  async rateLimit(key) {
    // 5 attempts per hour per person.
    const { data, error } = await adminClient.rpc("check_rate_limit", {
      p_key: key,
      p_max_count: 5,
      p_window_seconds: 3600,
    });
    if (error) throw error;
    return data !== false;
  },

  cancelNow: paddleCancelNow,

  async deleteGym(userId, confirmName, billingCancelled) {
    const { data, error } = await adminClient.rpc("account_delete_gym", {
      p_user_id: userId,
      p_confirm_name: confirmName,
      p_billing_cancelled: billingCancelled,
    });
    return outcomeFromRpc(data, error);
  },

  async deleteUser(userId, confirmEmail) {
    const { data, error } = await adminClient.rpc("account_delete_user", {
      p_user_id: userId,
      p_confirm_email: confirmEmail,
    });
    return outcomeFromRpc(data, error);
  },

  async removeFiles(tenantId) {
    const result = await removeTenantFiles(adminClient.storage as unknown as StorageApi, tenantId);
    if (result.failures.length > 0) {
      console.error("delete-account: some uploaded files could not be removed", result.failures);
      return false;
    }
    return true;
  },

  log: (message, detail) => console.error(`delete-account: ${message}`, detail ?? ""),
};

Deno.serve(async (req) => {
  const result = await handleDeleteAccount(
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
