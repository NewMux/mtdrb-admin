import { supabase } from "../supabaseClient";
import { parsePlatformAdminStatus } from "../utils/platformAdmin";
import type {
  GrantAccessParams,
  ListTenantsParams,
  GymRole,
  PlatformAdminStatus,
  PlatformAuditList,
  PlatformOverview,
  PlatformTenantDetail,
  PlatformTenantList,
} from "../types/platformAdmin";

/**
 * Thin wrappers over the platform_* RPCs (supabase/migrations/
 * 20261019090000_create_platform_admin_console.sql). Authorisation is enforced
 * by the database; these functions only shape requests and responses.
 *
 * Responses are validated before use: the dev mock client answers unknown RPC
 * names with an unrelated object, and a stale/partial deploy could return
 * anything, so nothing is assumed about the payload.
 */

type RpcResult = PromiseLike<{
  data: unknown;
  error: { message: string; code?: string } | null;
}>;

const client = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => RpcResult;
};

export class PlatformAdminError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "PlatformAdminError";
    this.code = code;
  }
}

async function call(fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await client.rpc(fn, args);
  if (error) {
    // Every denial is the same generic "forbidden" from the database.
    const message =
      error.code === "42501" ? "You do not have access to this." : error.message;
    throw new PlatformAdminError(message, error.code);
  }
  return data;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectObject<T>(value: unknown, what: string, keys: string[]): T {
  if (!isObject(value) || keys.some((k) => !(k in value))) {
    throw new PlatformAdminError(`Unexpected response from the server (${what}).`);
  }
  return value as T;
}

/**
 * Throws on a transport/RPC error so callers can show a retry state. Only a
 * clean 'ok' / 'mfa_required' answer is ever treated as an admin.
 */
export async function fetchPlatformAdminStatus(): Promise<PlatformAdminStatus> {
  return parsePlatformAdminStatus(await call("platform_admin_status"));
}

export async function fetchOverview(): Promise<PlatformOverview> {
  return expectObject<PlatformOverview>(await call("platform_overview"), "overview", [
    "totals",
    "by_state",
    "awaiting_activation",
  ]);
}

export async function listTenants(
  params: ListTenantsParams = {},
): Promise<PlatformTenantList> {
  const data = await call("platform_list_tenants", {
    p_search: params.search?.trim() || null,
    p_filter: params.filter ?? "all",
    p_sort: params.sort ?? "created_desc",
    p_limit: params.limit ?? 25,
    p_offset: params.offset ?? 0,
  });
  const list = expectObject<PlatformTenantList>(data, "tenant list", ["total", "rows"]);
  if (!Array.isArray(list.rows)) {
    throw new PlatformAdminError("Unexpected response from the server (tenant list).");
  }
  return list;
}

export async function fetchTenantDetail(tenantId: string): Promise<PlatformTenantDetail> {
  return expectObject<PlatformTenantDetail>(
    await call("platform_tenant_detail", { p_tenant_id: tenantId }),
    "tenant detail",
    ["tenant", "access_state", "staff", "usage"],
  );
}

export async function listAuditLog(
  tenantId: string | null = null,
  limit = 50,
  offset = 0,
): Promise<PlatformAuditList> {
  const data = await call("platform_list_audit_log", {
    p_tenant_id: tenantId,
    p_limit: limit,
    p_offset: offset,
  });
  return expectObject<PlatformAuditList>(data, "audit log", ["total", "rows"]);
}

export async function grantAccess(params: GrantAccessParams): Promise<void> {
  await call("platform_grant_access", {
    p_tenant_id: params.tenantId,
    p_plan_tier: params.planTier,
    p_until: params.until,
    p_reason: params.reason.trim(),
  });
}

export async function revokeAccess(tenantId: string, reason: string): Promise<void> {
  await call("platform_revoke_access", {
    p_tenant_id: tenantId,
    p_reason: reason.trim(),
  });
}

export async function addNote(tenantId: string, note: string): Promise<void> {
  await call("platform_add_note", { p_tenant_id: tenantId, p_note: note.trim() });
}

// --- Gym and user controls (20261021150000_platform_admin_gym_and_user_controls.sql)
// Every call needs a reason; the destructive ones also need the typed
// confirmation (gym name / user email), which the database re-checks.

export async function suspendGym(tenantId: string, reason: string): Promise<void> {
  await call("platform_suspend_gym", { p_tenant_id: tenantId, p_reason: reason.trim() });
}

export async function unsuspendGym(tenantId: string, reason: string): Promise<void> {
  await call("platform_unsuspend_gym", { p_tenant_id: tenantId, p_reason: reason.trim() });
}

export async function deleteGym(params: {
  tenantId: string;
  confirmName: string;
  reason: string;
  deleteUsers: boolean;
}): Promise<void> {
  await call("platform_delete_gym", {
    p_tenant_id: params.tenantId,
    p_confirm_name: params.confirmName.trim(),
    p_reason: params.reason.trim(),
    p_delete_users: params.deleteUsers,
  });
}

export async function banUser(userId: string, reason: string): Promise<void> {
  await call("platform_ban_user", { p_user_id: userId, p_reason: reason.trim() });
}

export async function unbanUser(userId: string, reason: string): Promise<void> {
  await call("platform_unban_user", { p_user_id: userId, p_reason: reason.trim() });
}

export async function resetUserMfa(userId: string, reason: string): Promise<void> {
  await call("platform_reset_user_mfa", { p_user_id: userId, p_reason: reason.trim() });
}

export async function changeUserRole(params: {
  tenantId: string;
  userId: string;
  role: GymRole;
  reason: string;
}): Promise<void> {
  await call("platform_change_user_role", {
    p_tenant_id: params.tenantId,
    p_user_id: params.userId,
    p_role: params.role,
    p_reason: params.reason.trim(),
  });
}

export async function deleteUser(params: {
  userId: string;
  confirmEmail: string;
  reason: string;
}): Promise<void> {
  await call("platform_delete_user", {
    p_user_id: params.userId,
    p_confirm_email: params.confirmEmail.trim(),
    p_reason: params.reason.trim(),
  });
}
