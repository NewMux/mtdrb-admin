import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const invoke = vi.fn();
vi.mock("../supabaseClient", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
  },
}));

import {
  addNote,
  banUser,
  changeUserRole,
  deleteGym,
  deleteUser,
  fetchOverview,
  fetchPlatformAdminStatus,
  fetchTenantDetail,
  grantAccess,
  inviteGym,
  listTenants,
  PlatformAdminError,
  resetUserMfa,
  revokeAccess,
  suspendGym,
  unbanUser,
  unsuspendGym,
} from "./platformAdmin";

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const fail = (message: string, code?: string) =>
  Promise.resolve({ data: null, error: { message, code } });

beforeEach(() => {
  rpc.mockReset();
  invoke.mockReset();
});

describe("fetchPlatformAdminStatus", () => {
  it("returns ok / mfa_required / not_admin as documented", async () => {
    rpc.mockReturnValueOnce(ok("ok"));
    expect(await fetchPlatformAdminStatus()).toBe("ok");
    rpc.mockReturnValueOnce(ok("mfa_required"));
    expect(await fetchPlatformAdminStatus()).toBe("mfa_required");
    rpc.mockReturnValueOnce(ok("not_admin"));
    expect(await fetchPlatformAdminStatus()).toBe("not_admin");
    expect(rpc).toHaveBeenCalledWith("platform_admin_status", undefined);
  });

  it("never treats the mock client's fallback object as an admin", async () => {
    rpc.mockReturnValueOnce(ok({ total_members: 248, active_members: 210 }));
    expect(await fetchPlatformAdminStatus()).toBe("not_admin");
  });

  it("throws on a transport error so the guard can show a retry (not children, not a 404)", async () => {
    rpc.mockReturnValueOnce(fail("network down"));
    await expect(fetchPlatformAdminStatus()).rejects.toBeInstanceOf(PlatformAdminError);
  });
});

describe("response validation", () => {
  it("rejects a payload of the wrong shape", async () => {
    rpc.mockReturnValueOnce(ok({ total_members: 1 }));
    await expect(fetchOverview()).rejects.toThrow(/unexpected response/i);
    rpc.mockReturnValueOnce(ok("nope"));
    await expect(listTenants()).rejects.toThrow(/unexpected response/i);
    rpc.mockReturnValueOnce(ok({ total: 1, rows: "x" }));
    await expect(listTenants()).rejects.toThrow(/unexpected response/i);
    rpc.mockReturnValueOnce(ok(null));
    await expect(fetchTenantDetail("t1")).rejects.toThrow(/unexpected response/i);
  });

  it("maps the generic database denial to a friendly message", async () => {
    rpc.mockReturnValueOnce(fail("forbidden", "42501"));
    await expect(fetchOverview()).rejects.toThrow("You do not have access to this.");
  });
});

describe("request shaping", () => {
  it("sends list parameters with defaults and trims the search", async () => {
    rpc.mockReturnValueOnce(ok({ total: 0, rows: [] }));
    await listTenants({ search: "  iron ", filter: "paid", offset: 25 });
    expect(rpc).toHaveBeenCalledWith("platform_list_tenants", {
      p_search: "iron",
      p_filter: "paid",
      p_sort: "created_desc",
      p_limit: 25,
      p_offset: 25,
    });
  });

  it("sends a null search when blank", async () => {
    rpc.mockReturnValueOnce(ok({ total: 0, rows: [] }));
    await listTenants({ search: "   " });
    expect(rpc.mock.calls[0][1].p_search).toBeNull();
  });

  it("passes grant parameters straight through, with a null end date for no expiry", async () => {
    rpc.mockReturnValueOnce(ok({}));
    await grantAccess({ tenantId: "t1", planTier: "pro", until: null, reason: "  pilot " });
    expect(rpc).toHaveBeenCalledWith("platform_grant_access", {
      p_tenant_id: "t1",
      p_plan_tier: "pro",
      p_until: null,
      p_reason: "pilot",
    });
  });

  it("surfaces the database's refusal message for a Paddle-managed gym", async () => {
    rpc.mockReturnValueOnce(fail("This gym is billed through Paddle.", "55000"));
    await expect(
      grantAccess({ tenantId: "t1", planTier: "pro", until: null, reason: "x y z" }),
    ).rejects.toThrow("billed through Paddle");
  });

  it("revoke and note use their own RPCs", async () => {
    rpc.mockReturnValue(ok({}));
    await revokeAccess("t1", " done ");
    await addNote("t1", " hello ");
    expect(rpc).toHaveBeenCalledWith("platform_revoke_access", { p_tenant_id: "t1", p_reason: "done" });
    expect(rpc).toHaveBeenCalledWith("platform_add_note", { p_tenant_id: "t1", p_note: "hello" });
  });
});

describe("gym and user controls", () => {
  beforeEach(() => rpc.mockReturnValue(ok({})));

  it("sends each action to its RPC with trimmed reasons", async () => {
    await suspendGym("t1", "  chargeback ");
    expect(rpc).toHaveBeenLastCalledWith("platform_suspend_gym", { p_tenant_id: "t1", p_reason: "chargeback" });
    await unsuspendGym("t1", " paid ");
    expect(rpc).toHaveBeenLastCalledWith("platform_unsuspend_gym", { p_tenant_id: "t1", p_reason: "paid" });
    await banUser("u1", " abusive ");
    expect(rpc).toHaveBeenLastCalledWith("platform_ban_user", { p_user_id: "u1", p_reason: "abusive" });
    await unbanUser("u1", " sorry ");
    expect(rpc).toHaveBeenLastCalledWith("platform_unban_user", { p_user_id: "u1", p_reason: "sorry" });
    await resetUserMfa("u1", " lost phone ");
    expect(rpc).toHaveBeenLastCalledWith("platform_reset_user_mfa", { p_user_id: "u1", p_reason: "lost phone" });
  });

  it("passes the typed confirmations and options through for the destructive calls", async () => {
    await deleteGym({ tenantId: "t1", confirmName: " Iron Temple ", reason: " closing ", deleteUsers: true });
    expect(rpc).toHaveBeenLastCalledWith("platform_delete_gym", {
      p_tenant_id: "t1", p_confirm_name: "Iron Temple", p_reason: "closing", p_delete_users: true,
    });
    await deleteUser({ userId: "u1", confirmEmail: " sam@x.dev ", reason: " left " });
    expect(rpc).toHaveBeenLastCalledWith("platform_delete_user", {
      p_user_id: "u1", p_confirm_email: "sam@x.dev", p_reason: "left",
    });
    await changeUserRole({ tenantId: "t1", userId: "u1", role: "admin", reason: " promoted " });
    expect(rpc).toHaveBeenLastCalledWith("platform_change_user_role", {
      p_tenant_id: "t1", p_user_id: "u1", p_role: "admin", p_reason: "promoted",
    });
  });

  it("surfaces the database's refusal and maps a denial to the generic message", async () => {
    rpc.mockReturnValueOnce(fail("Cannot demote the last admin of a gym", "55000"));
    await expect(changeUserRole({ tenantId: "t", userId: "u", role: "trainer", reason: "reorg" })).rejects.toThrow(
      "Cannot demote the last admin of a gym",
    );
    rpc.mockReturnValueOnce(fail("forbidden", "42501"));
    await expect(banUser("u", "because")).rejects.toThrow("You do not have access to this.");
  });
});

describe("inviteGym", () => {
  const params = {
    gymName: " Iron Temple ", adminEmail: " sara@x.dev ", planTier: "pro" as const,
    until: "2026-12-01T00:00:00.000Z", reason: " founding ",
  };

  it("invokes the Edge Function with trimmed input and returns the ids", async () => {
    invoke.mockResolvedValue({ data: { tenantId: "t9", userId: "u9", email: "sara@x.dev" }, error: null });
    expect(await inviteGym(params)).toEqual({ tenantId: "t9", userId: "u9", email: "sara@x.dev" });
    expect(invoke).toHaveBeenCalledWith("platform-invite-gym", {
      body: { gymName: "Iron Temple", adminEmail: "sara@x.dev", planTier: "pro", until: "2026-12-01T00:00:00.000Z", reason: "founding" },
    });
  });

  it("shows the function's own error message", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 409, json: async () => ({ error: "That email already has an account." }) } },
    });
    await expect(inviteGym(params)).rejects.toThrow("That email already has an account.");
  });

  it("explains a function that is not deployed, and any other transport failure", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 404, json: async () => { throw new Error("not json"); } } } });
    await expect(inviteGym(params)).rejects.toThrow("isn't deployed yet");
    invoke.mockResolvedValue({ data: null, error: new Error("Failed to fetch") });
    await expect(inviteGym(params)).rejects.toThrow("Could not reach the invite service");
  });

  it("rejects a malformed success payload", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await expect(inviteGym(params)).rejects.toBeInstanceOf(PlatformAdminError);
  });
});
