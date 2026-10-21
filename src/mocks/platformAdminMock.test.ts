import { describe, expect, it } from "vitest";
import { mockPlatformRpc } from "./platformAdminMock";

const rpc = (name: string, args: Record<string, unknown> = {}) => {
  const res = mockPlatformRpc(name, args);
  if (!res) throw new Error("not a platform rpc");
  return res;
};
const detail = (id: string) => rpc("platform_tenant_detail", { p_tenant_id: id }).data as {
  suspension: unknown;
  staff: Array<{ user_id: string; email: string; role: string; banned: boolean }>;
  audit: Array<{ action: string }>;
};
const list = (filter = "all") =>
  (rpc("platform_list_tenants", { p_filter: filter, p_limit: 100 }).data as { total: number; rows: Array<{ id: string; suspended: boolean }> });

describe("mock platform controls mirror the database rules", () => {
  it("suspend → listed as suspended → unsuspend", () => {
    expect(rpc("platform_suspend_gym", { p_tenant_id: "demo-t-2", p_reason: "ab" }).error?.code).toBe("22023");
    expect(rpc("platform_suspend_gym", { p_tenant_id: "demo-t-2", p_reason: "chargeback" }).error).toBeNull();
    expect(rpc("platform_suspend_gym", { p_tenant_id: "demo-t-2", p_reason: "chargeback" }).error?.code).toBe("55000");

    expect(detail("demo-t-2").suspension).toMatchObject({ reason: "chargeback" });
    expect(detail("demo-t-2").staff.every((s) => s.banned)).toBe(true);
    expect(list("suspended").rows.map((r) => r.id)).toEqual(["demo-t-2"]);
    expect(list().rows.find((r) => r.id === "demo-t-2")?.suspended).toBe(true);

    const [admin] = detail("demo-t-2").staff;
    expect(rpc("platform_unban_user", { p_user_id: admin.user_id, p_reason: "long enough" }).error?.message).toMatch(/unsuspend the gym/);

    expect(rpc("platform_unsuspend_gym", { p_tenant_id: "demo-t-2", p_reason: "paid up" }).error).toBeNull();
    expect(detail("demo-t-2").suspension).toBeNull();
    expect(detail("demo-t-2").audit.map((a) => a.action)).toEqual(expect.arrayContaining(["suspend_gym", "unsuspend_gym"]));
  });

  it("bans, unbans and resets MFA with the database's refusals", () => {
    const [, staff] = detail("demo-t-4").staff;
    expect(rpc("platform_ban_user", { p_user_id: staff.user_id, p_reason: "abusive" }).error).toBeNull();
    expect(rpc("platform_ban_user", { p_user_id: staff.user_id, p_reason: "abusive" }).error?.code).toBe("55000");
    expect(detail("demo-t-4").staff[1].banned).toBe(true);
    expect(rpc("platform_unban_user", { p_user_id: staff.user_id, p_reason: "sorry" }).error).toBeNull();
    expect(rpc("platform_unban_user", { p_user_id: staff.user_id, p_reason: "sorry" }).error?.code).toBe("55000");

    expect(rpc("platform_reset_user_mfa", { p_user_id: staff.user_id, p_reason: "lost phone" }).error).toBeNull();
    expect(rpc("platform_reset_user_mfa", { p_user_id: staff.user_id, p_reason: "lost phone" }).error?.message).toMatch(/no MFA/);
    expect(rpc("platform_ban_user", { p_user_id: "nobody", p_reason: "abusive" }).error?.code).toBe("P0002");
  });

  it("changes roles but never demotes the last admin, and rejects platform roles", () => {
    const [admin, staff] = detail("demo-t-5").staff;
    const base = { p_tenant_id: "demo-t-5", p_reason: "reorg" };
    expect(rpc("platform_change_user_role", { ...base, p_user_id: staff.user_id, p_role: "superadmin" }).error?.message).toBe("Unknown role");
    expect(rpc("platform_change_user_role", { ...base, p_user_id: staff.user_id, p_role: "employee" }).error?.code).toBe("55000");
    expect(rpc("platform_change_user_role", { ...base, p_user_id: admin.user_id, p_role: "trainer" }).error?.message).toMatch(/last admin/);
    expect(rpc("platform_change_user_role", { ...base, p_user_id: staff.user_id, p_role: "admin" }).error).toBeNull();
    expect(rpc("platform_change_user_role", { ...base, p_user_id: admin.user_id, p_role: "trainer" }).error).toBeNull();
    expect(detail("demo-t-5").staff.map((s) => s.role)).toEqual(["trainer", "admin"]);
  });

  it("deletes a user only with the right email and never the only admin", () => {
    const [admin, staff] = detail("demo-t-6").staff;
    expect(rpc("platform_delete_user", { p_user_id: staff.user_id, p_confirm_email: "wrong@x.dev", p_reason: "left" }).error?.message).toMatch(/confirmation email/);
    expect(rpc("platform_delete_user", { p_user_id: admin.user_id, p_confirm_email: admin.email, p_reason: "left" }).error?.message).toMatch(/only admin/);
    expect(rpc("platform_delete_user", { p_user_id: staff.user_id, p_confirm_email: staff.email.toUpperCase(), p_reason: "left" }).error).toBeNull();
    expect(detail("demo-t-6").staff).toHaveLength(1);
  });

  it("deletes a gym only with its exact name and not while Paddle bills it", () => {
    expect(rpc("platform_delete_gym", { p_tenant_id: "demo-t-3", p_confirm_name: "my gym", p_reason: "cleanup" }).error?.message).toMatch(/confirmation name/);
    expect(rpc("platform_delete_gym", { p_tenant_id: "demo-t-4", p_confirm_name: "Pulse Athletics", p_reason: "cleanup" }).error?.message).toMatch(/Paddle/);
    expect(rpc("platform_delete_gym", { p_tenant_id: "demo-t-3", p_confirm_name: "My Gym", p_reason: "cleanup", p_delete_users: true }).error).toBeNull();
    expect(rpc("platform_tenant_detail", { p_tenant_id: "demo-t-3" }).error?.code).toBe("P0002");
    expect(list().rows.some((r) => r.id === "demo-t-3")).toBe(false);
  });

  it("still fails closed on an unknown platform call", () => {
    expect(rpc("platform_make_me_god").error?.code).toBe("MOCK");
  });
});
