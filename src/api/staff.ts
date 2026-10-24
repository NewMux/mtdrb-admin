// Client side of staff roles and the team (supabase/migrations/
// 20261026090000_custom_roles.sql and supabase/functions/invite-staff).
// Who may do what is enforced by the database; these functions only call it and
// check what comes back.

import { supabase } from "../supabaseClient";
import { isStaffPermission, type StaffPermission, type StaffTier } from "../config/staffPermissions";

export class StaffError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "StaffError";
    this.code = code;
  }
}

type RpcResult = PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;
const client = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => RpcResult;
  from: (table: string) => {
    select: (columns: string) => { order: (column: string) => PromiseLike<{ data: unknown; error: { message: string } | null }> };
  };
  functions: {
    invoke: (name: string, options: { body: unknown }) => Promise<{ data: unknown; error: unknown }>;
  };
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

async function call(fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new StaffError(error.code === "42501" ? "You do not have access to this." : error.message, error.code);
  return data;
}

// --- What the signed-in person may do ---------------------------------------

export interface StaffAccess {
  role: string;
  customRoleId: string | null;
  customRoleName: string | null;
  /** null = a built-in role: everything its tier allows. */
  permissions: StaffPermission[] | null;
}

export function parseStaffAccess(data: unknown): StaffAccess | null {
  if (!isObject(data) || typeof data.role !== "string") return null;
  let permissions: StaffPermission[] | null = null;
  if (data.permissions !== null && data.permissions !== undefined) {
    // A custom role we cannot read must grant nothing, never everything.
    permissions = Array.isArray(data.permissions) ? data.permissions.filter(isStaffPermission) : [];
  }
  return {
    role: data.role,
    customRoleId: typeof data.custom_role_id === "string" ? data.custom_role_id : null,
    customRoleName: typeof data.custom_role_name === "string" ? data.custom_role_name : null,
    permissions,
  };
}

/**
 * Null when the function is not available (the database has not been updated
 * yet) or the call fails: the screens then behave as they always did, and the
 * database decides every write regardless.
 */
export async function fetchMyStaffAccess(): Promise<StaffAccess | null> {
  try {
    const { data, error } = await client.rpc("my_staff_access");
    if (error) return null;
    return parseStaffAccess(data);
  } catch {
    return null;
  }
}

// --- Roles -------------------------------------------------------------------

export interface StaffRole {
  id: string;
  name: string;
  baseRole: StaffTier;
  permissions: StaffPermission[];
}

export function parseRole(row: unknown): StaffRole | null {
  if (!isObject(row) || typeof row.id !== "string" || typeof row.name !== "string") return null;
  const base = row.base_role;
  if (base !== "employee" && base !== "trainer") return null;
  return {
    id: row.id,
    name: row.name,
    baseRole: base,
    permissions: Array.isArray(row.permissions) ? row.permissions.filter(isStaffPermission) : [],
  };
}

export async function listRoles(): Promise<StaffRole[]> {
  const { data, error } = await client.from("tenant_roles").select("id, name, base_role, permissions").order("name");
  if (error) throw new StaffError(error.message);
  return (Array.isArray(data) ? data : []).map(parseRole).filter((r): r is StaffRole => r !== null);
}

export async function saveRole(role: {
  id?: string | null;
  name: string;
  baseRole: StaffTier;
  permissions: readonly StaffPermission[];
}): Promise<StaffRole> {
  const data = await call("staff_role_save", {
    p_id: role.id ?? null,
    p_name: role.name,
    p_base_role: role.baseRole,
    p_permissions: [...role.permissions],
  });
  const parsed = parseRole(isObject(data) ? { ...data, base_role: data.base_role } : null);
  if (!parsed) throw new StaffError("Unexpected response from the server.");
  return parsed;
}

export async function deleteRole(id: string): Promise<void> {
  await call("staff_role_delete", { p_id: id });
}

// --- The team ----------------------------------------------------------------

export interface StaffMember {
  userId: string;
  email: string;
  name: string | null;
  role: "admin" | "employee" | "trainer";
  customRoleId: string | null;
  customRoleName: string | null;
  joinedAt: string | null;
  lastSignInAt: string | null;
  pendingInvite: boolean;
}

export function parseStaffMember(row: unknown): StaffMember | null {
  if (!isObject(row) || typeof row.user_id !== "string") return null;
  const role = row.role;
  if (role !== "admin" && role !== "employee" && role !== "trainer") return null;
  return {
    userId: row.user_id,
    email: typeof row.email === "string" ? row.email : "",
    name: typeof row.name === "string" ? row.name : null,
    role,
    customRoleId: typeof row.custom_role_id === "string" ? row.custom_role_id : null,
    customRoleName: typeof row.custom_role_name === "string" ? row.custom_role_name : null,
    joinedAt: typeof row.joined_at === "string" ? row.joined_at : null,
    lastSignInAt: typeof row.last_sign_in_at === "string" ? row.last_sign_in_at : null,
    pendingInvite: row.pending_invite === true,
  };
}

export async function listStaff(): Promise<StaffMember[]> {
  const data = await call("tenant_staff");
  if (!Array.isArray(data)) throw new StaffError("Unexpected response from the server.");
  return data.map(parseStaffMember).filter((m): m is StaffMember => m !== null);
}

/** A built-in role (customRoleId null) or a custom one. */
export async function setStaffRole(
  userId: string,
  role: "admin" | "employee" | "trainer",
  customRoleId: string | null = null,
): Promise<void> {
  await call("staff_set_role", { p_user_id: userId, p_role: role, p_custom_role_id: customRoleId });
}

export async function removeStaff(userId: string): Promise<void> {
  await call("staff_remove", { p_user_id: userId });
}

async function functionErrorMessage(error: unknown): Promise<string> {
  const ctx = (error as { context?: { status?: number; json?: () => Promise<unknown> } } | null)?.context;
  if (ctx?.json) {
    try {
      const body = await ctx.json();
      if (isObject(body) && typeof body.error === "string") return body.error;
    } catch {
      // fall through to the generic messages
    }
  }
  if (ctx?.status === 404) return "The invite service isn't deployed yet.";
  return "Could not reach the invite service. Try again.";
}

export async function inviteStaff(params: {
  email: string;
  role: "employee" | "trainer";
  customRoleId: string | null;
}): Promise<{ userId: string; email: string }> {
  const { data, error } = await client.functions.invoke("invite-staff", {
    body: { email: params.email, role: params.role, customRoleId: params.customRoleId },
  });
  if (error) throw new StaffError(await functionErrorMessage(error));
  if (!isObject(data) || typeof data.userId !== "string" || typeof data.email !== "string") {
    throw new StaffError("Unexpected response from the server.");
  }
  return { userId: data.userId, email: data.email };
}
