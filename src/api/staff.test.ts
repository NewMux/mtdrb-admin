import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const select = vi.fn();
const invoke = vi.fn();
vi.mock("../supabaseClient", () => ({
  supabase: {
    rpc: (...a: unknown[]) => rpc(...a),
    from: () => ({ select: (...a: unknown[]) => ({ order: () => select(...a) }) }),
    functions: { invoke: (...a: unknown[]) => invoke(...a) },
  },
}));

import {
  StaffError,
  deleteRole,
  fetchMyStaffAccess,
  inviteStaff,
  listRoles,
  listStaff,
  parseRole,
  parseStaffAccess,
  parseStaffMember,
  removeStaff,
  saveRole,
  setStaffRole,
} from "./staff";

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const fail = (message: string, code?: string) => Promise.resolve({ data: null, error: { message, code } });

beforeEach(() => {
  rpc.mockReset();
  select.mockReset();
  invoke.mockReset();
});

describe("parseStaffAccess", () => {
  it("reads a built-in role as 'no limits' (permissions null)", () => {
    expect(parseStaffAccess({ role: "employee", custom_role_id: null, custom_role_name: null, permissions: null })).toEqual({
      role: "employee", customRoleId: null, customRoleName: null, permissions: null,
    });
  });

  it("reads a custom role's list, dropping anything unknown", () => {
    expect(parseStaffAccess({ role: "employee", custom_role_id: "r1", custom_role_name: "Front desk", permissions: ["pos.use", "root", 3] })?.permissions).toEqual(["pos.use"]);
  });

  it("never turns an unreadable list into 'allowed everything'", () => {
    expect(parseStaffAccess({ role: "employee", permissions: "oops" })?.permissions).toEqual([]);
  });

  it("rejects what is not an answer", () => {
    for (const bad of [null, "x", [], {}, { role: 5 }]) expect(parseStaffAccess(bad)).toBeNull();
  });
});

describe("fetchMyStaffAccess", () => {
  it("is null when the function is missing or fails, so the app behaves as before", async () => {
    rpc.mockReturnValueOnce(fail("function public.my_staff_access() does not exist", "42883"));
    expect(await fetchMyStaffAccess()).toBeNull();
    rpc.mockReturnValueOnce(Promise.reject(new Error("network")));
    expect(await fetchMyStaffAccess()).toBeNull();
  });

  it("returns the access when it works", async () => {
    rpc.mockReturnValueOnce(ok({ role: "trainer", permissions: ["classes.manage"] }));
    expect((await fetchMyStaffAccess())?.permissions).toEqual(["classes.manage"]);
  });
});

describe("roles", () => {
  it("parses a role and rejects bad rows", () => {
    expect(parseRole({ id: "r1", name: "Coach", base_role: "trainer", permissions: ["classes.manage", "x"] })).toEqual({
      id: "r1", name: "Coach", baseRole: "trainer", permissions: ["classes.manage"],
    });
    expect(parseRole({ id: "r1", name: "Boss", base_role: "admin", permissions: [] })).toBeNull();
    expect(parseRole(null)).toBeNull();
  });

  it("lists roles, skipping malformed rows, and surfaces errors", async () => {
    select.mockReturnValueOnce(ok([{ id: "r1", name: "A", base_role: "employee", permissions: [] }, { nope: 1 }]));
    expect(await listRoles()).toHaveLength(1);
    select.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: "denied" } }));
    await expect(listRoles()).rejects.toThrow("denied");
  });

  it("saves with the parameters the database expects", async () => {
    rpc.mockReturnValueOnce(ok({ id: "r1", name: "Front desk", base_role: "employee", permissions: ["pos.use"] }));
    const saved = await saveRole({ name: "Front desk", baseRole: "employee", permissions: ["pos.use"] });
    expect(rpc).toHaveBeenCalledWith("staff_role_save", { p_id: null, p_name: "Front desk", p_base_role: "employee", p_permissions: ["pos.use"] });
    expect(saved.id).toBe("r1");
  });

  it("maps a denial to a friendly message and passes the database's own words through", async () => {
    rpc.mockReturnValueOnce(fail("forbidden", "42501"));
    await expect(deleteRole("r1")).rejects.toThrow("You do not have access to this.");
    rpc.mockReturnValueOnce(fail("Move the people on this role to another role first", "55000"));
    await expect(deleteRole("r1")).rejects.toThrow(/Move the people/);
  });
});

describe("team", () => {
  it("parses people, including pending invitations", () => {
    expect(parseStaffMember({ user_id: "u1", email: "a@b.co", role: "employee", custom_role_id: "r1", custom_role_name: "FD", pending_invite: true })).toMatchObject({
      userId: "u1", role: "employee", customRoleName: "FD", pendingInvite: true,
    });
    expect(parseStaffMember({ user_id: "u1", role: "owner" })).toBeNull();
  });

  it("lists the team and refuses an unexpected payload", async () => {
    rpc.mockReturnValueOnce(ok([{ user_id: "u1", email: "a@b.co", role: "admin" }, null]));
    expect(await listStaff()).toHaveLength(1);
    rpc.mockReturnValueOnce(ok({ nope: true }));
    await expect(listStaff()).rejects.toBeInstanceOf(StaffError);
  });

  it("sets and removes roles with the right parameters", async () => {
    rpc.mockReturnValue(ok(null));
    await setStaffRole("u1", "employee", "r1");
    expect(rpc).toHaveBeenLastCalledWith("staff_set_role", { p_user_id: "u1", p_role: "employee", p_custom_role_id: "r1" });
    await setStaffRole("u1", "trainer");
    expect(rpc).toHaveBeenLastCalledWith("staff_set_role", { p_user_id: "u1", p_role: "trainer", p_custom_role_id: null });
    await removeStaff("u1");
    expect(rpc).toHaveBeenLastCalledWith("staff_remove", { p_user_id: "u1" });
  });
});

describe("inviteStaff", () => {
  it("sends the invitation request and returns who was invited", async () => {
    invoke.mockResolvedValue({ data: { userId: "u9", email: "a@b.co" }, error: null });
    expect(await inviteStaff({ email: "a@b.co", role: "employee", customRoleId: null })).toEqual({ userId: "u9", email: "a@b.co" });
    expect(invoke).toHaveBeenCalledWith("invite-staff", { body: { email: "a@b.co", role: "employee", customRoleId: null } });
  });

  it("shows the function's own error message, or a helpful fallback", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 409, json: async () => ({ error: "That email already has an account." }) } } });
    await expect(inviteStaff({ email: "a@b.co", role: "employee", customRoleId: null })).rejects.toThrow("That email already has an account.");
    invoke.mockResolvedValue({ data: null, error: { context: { status: 404 } } });
    await expect(inviteStaff({ email: "a@b.co", role: "employee", customRoleId: null })).rejects.toThrow(/isn't deployed/);
    invoke.mockResolvedValue({ data: null, error: new Error("net") });
    await expect(inviteStaff({ email: "a@b.co", role: "employee", customRoleId: null })).rejects.toThrow(/Could not reach/);
  });

  it("rejects an unexpected success payload", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await expect(inviteStaff({ email: "a@b.co", role: "trainer", customRoleId: null })).rejects.toThrow(/Unexpected/);
  });
});
