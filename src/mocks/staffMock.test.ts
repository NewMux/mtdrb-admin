import { describe, expect, it } from "vitest";
import { mockInviteStaff, mockRoleRows, mockStaffRpc } from "./staffMock";

const rpc = (name: string, args: Record<string, unknown> = {}) => {
  const r = mockStaffRpc(name, args);
  if (!r) throw new Error("not a staff rpc");
  return r;
};

// The demo backend must answer the Team & roles screen the way the database would.
describe("demo backend: staff and roles", () => {
  it("reports a built-in admin with no limits", () => {
    expect(rpc("my_staff_access").data).toMatchObject({ role: "admin", permissions: null });
    expect(mockStaffRpc("something_else")).toBeUndefined();
  });

  it("creates, edits and deletes a role, with the database's validation", () => {
    expect(rpc("staff_role_save", { p_id: null, p_name: "  ", p_base_role: "employee", p_permissions: [] }).error?.code).toBe("22023");
    expect(rpc("staff_role_save", { p_id: null, p_name: "X", p_base_role: "admin", p_permissions: [] }).error?.code).toBe("22023");
    expect(rpc("staff_role_save", { p_id: null, p_name: "X", p_base_role: "employee", p_permissions: ["root"] }).error?.message).toBe("Unknown permission");
    expect(rpc("staff_role_save", { p_id: null, p_name: "X", p_base_role: "trainer", p_permissions: ["members.manage"] }).error?.message).toMatch(/trainer-level/);

    const created = rpc("staff_role_save", { p_id: null, p_name: " Front   desk ", p_base_role: "employee", p_permissions: ["pos.use", "billing.manage", "pos.use"] });
    expect(created.error).toBeNull();
    const role = created.data as { id: string; name: string; permissions: string[] };
    expect(role.name).toBe("Front desk");
    expect(role.permissions).toEqual(["billing.manage", "billing.view", "pos.use"]);
    expect(rpc("staff_role_save", { p_id: null, p_name: "front DESK", p_base_role: "employee", p_permissions: [] }).error?.code).toBe("23505");
    expect(mockRoleRows()).toContainEqual(expect.objectContaining({ id: role.id }));

    expect(rpc("staff_set_role", { p_user_id: "mock-staff-1", p_role: "employee", p_custom_role_id: role.id }).error).toBeNull();
    expect(rpc("staff_role_delete", { p_id: role.id }).error?.code).toBe("55000");
    expect(rpc("staff_set_role", { p_user_id: "mock-staff-1", p_role: "employee", p_custom_role_id: null }).error).toBeNull();
    expect(rpc("staff_role_delete", { p_id: role.id }).error).toBeNull();
    expect(mockRoleRows()).not.toContainEqual(expect.objectContaining({ id: role.id }));
  });

  it("never lets someone change or remove themselves", () => {
    expect(rpc("staff_set_role", { p_user_id: "mock-user-localhost", p_role: "employee" }).error?.code).toBe("55000");
    expect(rpc("staff_remove", { p_user_id: "mock-user-localhost" }).error?.code).toBe("55000");
    expect(rpc("staff_remove", { p_user_id: "nobody" }).error?.code).toBe("P0002");
  });

  it("invites, lists the invitation as pending, and refuses a duplicate email", async () => {
    const invited = mockInviteStaff({ email: "New@Example.com", role: "trainer" });
    expect(invited.error).toBeNull();
    const list = rpc("tenant_staff").data as Array<{ email: string; pending_invite: boolean; role: string }>;
    expect(list.find((p) => p.email === "new@example.com")).toMatchObject({ pending_invite: true, role: "trainer" });
    const dup = mockInviteStaff({ email: "new@example.com", role: "employee" });
    await expect((dup.error as { context: { json: () => Promise<{ error: string }> } }).context.json()).resolves.toMatchObject({ error: expect.stringMatching(/already has an account/) });
    expect(mockInviteStaff({ email: "nope" }).error).toBeTruthy();
  });
});
