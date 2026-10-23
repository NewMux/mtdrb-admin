// Invites a person to join the signed-in admin's own gym as staff: sends the
// Supabase Auth invitation email, then adds them through staff_provision().
// See handler.ts for the flow and why it is ordered that way, and
// DEPLOYMENT.md ("Team and custom roles") for setup.
//
// Deployed with verify_jwt = false (supabase/config.toml) because the browser's
// CORS preflight carries no Authorization header and the platform's own JWT
// gate would reject it before this code runs. The caller's JWT is verified here
// instead, and the database re-checks it (staff_invite_context raises unless the
// caller is a gym admin).
//
// Required secrets (supabase secrets set ...):
//   STAFF_ALLOWED_ORIGINS  comma-separated origins allowed to call this from a
//                          browser, e.g. https://app.example.com
//   STAFF_APP_URL          the app's base URL; the invitation link lands on
//                          <STAFF_APP_URL>/reset-password
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by
// Supabase automatically.

import { createClient } from "npm:@supabase/supabase-js@2";
import { handleInviteStaff, type InviteResult, type InviteStaffDeps, type ProvisionResult } from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const allowedOrigins = (Deno.env.get("STAFF_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const appUrl = (Deno.env.get("STAFF_APP_URL") ?? "").trim().replace(/\/+$/, "");

if (allowedOrigins.length === 0) {
  console.warn("invite-staff: STAFF_ALLOWED_ORIGINS is empty, so browsers will be refused by CORS");
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

const deps: InviteStaffDeps = {
  allowedOrigins,
  redirectTo: appUrl ? `${appUrl}/reset-password` : null,

  async verify(token) {
    const { data, error } = await callerClient(token).rpc("staff_invite_context");
    if (error || !data) return null;
    const ctx = data as { tenant_id?: string; staff_count?: number };
    if (typeof ctx.tenant_id !== "string") return null;
    return { tenantId: ctx.tenant_id, staffCount: Number(ctx.staff_count) || 0 };
  },

  async rateLimit(key) {
    const { data, error } = await adminClient.rpc("check_rate_limit", {
      p_key: key,
      p_max_count: 30,
      p_window_seconds: 3600,
    });
    if (error) throw error;
    return data !== false;
  },

  async invite(email, redirectTo): Promise<InviteResult> {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === "email_exists" || /already (been )?registered/i.test(error.message)) {
        return { ok: false, code: "already_registered" };
      }
      console.error("invite-staff: invite failed", error.message);
      return { ok: false, code: "failed" };
    }
    if (!data.user?.id) return { ok: false, code: "failed" };
    return { ok: true, userId: data.user.id };
  },

  async provision(tenantId, userId, input): Promise<ProvisionResult> {
    const { error } = await adminClient.rpc("staff_provision", {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_role: input.role,
      p_custom_role_id: input.customRoleId,
    });
    if (error) return { ok: false, code: error.code ?? null, message: error.message };
    return { ok: true };
  },

  async removeUser(userId) {
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;
  },

  log: (message, detail) => console.error(`invite-staff: ${message}`, detail ?? ""),
};

Deno.serve(async (req) => {
  const result = await handleInviteStaff(
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
