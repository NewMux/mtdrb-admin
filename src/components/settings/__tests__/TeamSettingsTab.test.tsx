import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const listStaff = vi.fn();
const listRoles = vi.fn();
const setStaffRole = vi.fn();
const removeStaff = vi.fn();
const inviteStaff = vi.fn();
const saveRole = vi.fn();
const deleteRole = vi.fn();
vi.mock("../../../api/staff", () => ({
  listStaff: (...a: unknown[]) => listStaff(...a),
  listRoles: (...a: unknown[]) => listRoles(...a),
  setStaffRole: (...a: unknown[]) => setStaffRole(...a),
  removeStaff: (...a: unknown[]) => removeStaff(...a),
  inviteStaff: (...a: unknown[]) => inviteStaff(...a),
  saveRole: (...a: unknown[]) => saveRole(...a),
  deleteRole: (...a: unknown[]) => deleteRole(...a),
}));
vi.mock("../../../contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "me" } }) }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() }, toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.name ? `${key}:${opts.name}` : opts?.email ? `${key}:${opts.email}` : key),
  }),
}));

import TeamSettingsTab from "../TeamSettingsTab";

const staff = [
  { userId: "me", email: "me@a.dev", name: "Me", role: "admin", customRoleId: null, customRoleName: null, joinedAt: null, lastSignInAt: "x", pendingInvite: false },
  { userId: "u2", email: "sara@a.dev", name: "Sara", role: "employee", customRoleId: "r1", customRoleName: "Front desk", joinedAt: null, lastSignInAt: "x", pendingInvite: false },
  { userId: "u3", email: "omar@a.dev", name: null, role: "trainer", customRoleId: null, customRoleName: null, joinedAt: null, lastSignInAt: null, pendingInvite: true },
];
const roles = [{ id: "r1", name: "Front desk", baseRole: "employee", permissions: ["members.manage", "pos.use"] }];

beforeEach(() => {
  vi.clearAllMocks();
  listStaff.mockResolvedValue(staff);
  listRoles.mockResolvedValue(roles);
  setStaffRole.mockResolvedValue(undefined);
  removeStaff.mockResolvedValue(undefined);
  inviteStaff.mockResolvedValue({ userId: "u9", email: "new@a.dev" });
  saveRole.mockResolvedValue({ id: "r2" });
  deleteRole.mockResolvedValue(undefined);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("TeamSettingsTab", () => {
  it("lists the team, marks pending invitations and prevents changing yourself", async () => {
    render(<TeamSettingsTab />);
    expect(await screen.findByText("Sara")).toBeInTheDocument();
    expect(screen.getByText("team.invitedPending")).toBeInTheDocument();
    expect(screen.getByLabelText("team.roleLabel — Me")).toBeDisabled();
    expect(screen.queryByLabelText("team.remove:Me")).not.toBeInTheDocument();
    expect(screen.getByLabelText("team.roleLabel — Sara")).toHaveValue("custom:r1");
  });

  it("moves someone to a custom role and back to a built-in one", async () => {
    render(<TeamSettingsTab />);
    await screen.findByText("Sara");
    fireEvent.change(screen.getByLabelText("team.roleLabel — omar@a.dev"), { target: { value: "custom:r1" } });
    await waitFor(() => expect(setStaffRole).toHaveBeenCalledWith("u3", "employee", "r1"));
    fireEvent.change(screen.getByLabelText("team.roleLabel — Sara"), { target: { value: "trainer" } });
    await waitFor(() => expect(setStaffRole).toHaveBeenCalledWith("u2", "trainer", null));
  });

  it("removes a person after confirming", async () => {
    render(<TeamSettingsTab />);
    await screen.findByText("Sara");
    fireEvent.click(screen.getByLabelText("team.remove:Sara"));
    await waitFor(() => expect(removeStaff).toHaveBeenCalledWith("u2"));
    (window.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    fireEvent.click(screen.getByLabelText("team.remove:omar@a.dev"));
    expect(removeStaff).toHaveBeenCalledTimes(1);
  });

  it("invites by email with the chosen role, and shows the server's refusal", async () => {
    render(<TeamSettingsTab />);
    await screen.findByText("Sara");
    fireEvent.change(screen.getByPlaceholderText("team.email"), { target: { value: " new@a.dev " } });
    const select = screen.getAllByLabelText("team.roleLabel").at(-1)!;
    fireEvent.change(select, { target: { value: "custom:r1" } });
    fireEvent.click(screen.getByRole("button", { name: "team.invite" }));
    await waitFor(() => expect(inviteStaff).toHaveBeenCalledWith({ email: "new@a.dev", role: "employee", customRoleId: "r1" }));

    inviteStaff.mockRejectedValueOnce(new Error("That email already has an account."));
    fireEvent.change(screen.getByPlaceholderText("team.email"), { target: { value: "dup@a.dev" } });
    fireEvent.click(screen.getByRole("button", { name: "team.invite" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That email already has an account.");
  });

  it("never offers 'admin' when inviting", async () => {
    render(<TeamSettingsTab />);
    await screen.findByText("Sara");
    const inviteSelect = screen.getAllByLabelText("team.roleLabel").at(-1)!;
    expect(Array.from(inviteSelect.querySelectorAll("option")).map((o) => o.getAttribute("value"))).not.toContain("admin");
  });

  it("shows a retry when the team cannot be loaded", async () => {
    listStaff.mockRejectedValue(new Error("You do not have access to this."));
    render(<TeamSettingsTab />);
    expect(await screen.findByRole("alert")).toHaveTextContent("You do not have access to this.");
  });
});

describe("RolesPanel (inside the tab)", () => {
  it("creates a role from a preset and saves what was chosen", async () => {
    render(<TeamSettingsTab />);
    await screen.findByText("Sara");
    fireEvent.click(screen.getByRole("button", { name: "team.newRole" }));
    fireEvent.click(screen.getByRole("button", { name: "team.presets.accountant" }));
    expect(screen.getByDisplayValue("team.presets.accountant")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "team.save" }));
    await waitFor(() =>
      expect(saveRole).toHaveBeenCalledWith({
        id: null, name: "team.presets.accountant", baseRole: "employee", permissions: ["billing.view", "billing.manage"],
      }),
    );
  });

  it("unticking view also removes manage, and a trainer level only offers its permissions", async () => {
    render(<TeamSettingsTab />);
    await screen.findByText("Sara");
    fireEvent.click(screen.getByRole("button", { name: "team.newRole" }));
    fireEvent.click(screen.getByRole("button", { name: "team.presets.accountant" }));
    fireEvent.click(screen.getByLabelText(/team.permissions.billing.view.name/));
    expect(screen.getByLabelText(/team.permissions.billing.manage.name/)).not.toBeChecked();

    fireEvent.change(screen.getByLabelText(/team.level/), { target: { value: "trainer" } });
    expect(screen.queryByLabelText(/team.permissions.members.manage.name/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/team.permissions.classes.manage.name/)).toBeInTheDocument();
  });

  it("shows the database's message when a save is refused", async () => {
    saveRole.mockRejectedValue(new Error("A role with that name already exists"));
    render(<TeamSettingsTab />);
    await screen.findByText("Sara");
    fireEvent.click(screen.getByRole("button", { name: "team.newRole" }));
    fireEvent.change(screen.getByLabelText(/team.roleName/), { target: { value: "Front desk" } });
    fireEvent.click(screen.getByRole("button", { name: "team.save" }));
    expect(await screen.findByText("A role with that name already exists")).toBeInTheDocument();
  });

  it("explains that a role in use cannot be deleted", async () => {
    deleteRole.mockRejectedValue(new Error("Move the people on this role to another role first"));
    render(<TeamSettingsTab />);
    await screen.findByText("Sara");
    fireEvent.click(screen.getByRole("button", { name: "team.deleteRole" }));
    await waitFor(() => expect(deleteRole).toHaveBeenCalledWith("r1"));
  });
});
