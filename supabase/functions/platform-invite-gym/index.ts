// Creates a gym for an invited admin: sends the Supabase Auth invitation email,
// then provisions the gym and free access through platform_provision_gym.
// See handler.ts for the flow and why it is ordered that way, and
// DEPLOYMENT.md ("Create a gym and invite its admin") for setup.
//
// Deployed with verify_jwt = false (supabase/config.toml) because the browser's
// CORS preflight carries no Authorization header and the platform's own JWT
// gate would reject it before this code runs (the same trap that broke the
// CrediMax function this project used to have). The caller's JWT is verified
// here instead, and the database re-checks it on every privileged call.
//
// Required secrets (supabase secrets set ...):
//   PLATFORM_ALLOWED_ORIGINS  comma-separated origins allowed to call this from a
//                             browser, e.g. https://app.example.com
//   PLATFORM_APP_URL          the app's base URL; the invitation link lands on
//                             <PLATFORM_APP_URL>/reset-password
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by
// Supabase automatically.

import { createClient } from "npm:@supabase/supabase-js@2";
import { handleInvite, type InviteDeps, type InviteResult, type ProvisionResult } from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const allowedOrigins = (Deno.env.get("PLATFORM_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const appUrl = (Deno.env.get("PLATFORM_APP_URL") ?? "").trim().replace(/\/+$/, "");

if (allowedOrigins.length === 0) {
  console.warn("platform-invite-gym: PLATFORM_ALLOWED_ORIGINS is empty, so browsers will be refused by CORS");
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

const deps: InviteDeps = {
  allowedOrigins,
  redirectTo: appUrl ? `${appUrl}/reset-password` : null,

  async verify(token) {
    const client = callerClient(token);
    const [status, user] = await Promise.all([client.rpc("platform_admin_status"), client.auth.getUser(token)]);
    return {
      status: typeof status.data === "string" ? status.data : "not_admin",
      userId: user.data.user?.id ?? null,
    };
  },

  async rateLimit(key) {
    const { data, error } = await adminClient.rpc("check_rate_limit", {
      p_key: key,
      p_max_count: 10,
      p_window_seconds: 3600,
    });
    if (error) throw error;
    return data !== false;
  },

  async invite(email, redirectTo, gymName): Promise<InviteResult> {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { gym_name: gymName },
    });
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === "email_exists" || /already (been )?registered/i.test(error.message)) {
        return { ok: false, code: "already_registered" };
      }
      console.error("platform-invite-gym: invite failed", error.message);
      return { ok: false, code: "failed" };
    }
    if (!data.user?.id) return { ok: false, code: "failed" };
    return { ok: true, userId: data.user.id };
  },

  async provision(token, input): Promise<ProvisionResult> {
    const { data, error } = await callerClient(token).rpc("platform_provision_gym", {
      p_user_id: input.userId,
      p_gym_name: input.gymName,
      p_plan_tier: input.planTier,
      p_until: input.until,
      p_reason: input.reason,
    });
    if (error) return { ok: false, code: error.code ?? null, message: error.message };
    const tenantId = (data as { tenant_id?: string } | null)?.tenant_id;
    if (!tenantId) return { ok: false, code: null, message: "" };
    return { ok: true, tenantId };
  },

  async removeUser(userId) {
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;
  },

  log: (message, detail) => console.error(`platform-invite-gym: ${message}`, detail ?? ""),
};

Deno.serve(async (req) => {
  const result = await handleInvite(
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
