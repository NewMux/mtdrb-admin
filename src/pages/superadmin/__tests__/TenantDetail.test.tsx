import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const api = {
  fetchTenantDetail: vi.fn(),
  suspendGym: vi.fn(),
  unsuspendGym: vi.fn(),
  deleteGym: vi.fn(),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  resetUserMfa: vi.fn(),
  deleteUser: vi.fn(),
  changeUserRole: vi.fn(),
};
vi.mock("../../../api/platformAdmin", () => ({
  fetchTenantDetail: (...a: unknown[]) => api.fetchTenantDetail(...a),
  suspendGym: (...a: unknown[]) => api.suspendGym(...a),
  unsuspendGym: (...a: unknown[]) => api.unsuspendGym(...a),
  deleteGym: (...a: unknown[]) => api.deleteGym(...a),
  banUser: (...a: unknown[]) => api.banUser(...a),
  unbanUser: (...a: unknown[]) => api.unbanUser(...a),
  resetUserMfa: (...a: unknown[]) => api.resetUserMfa(...a),
  deleteUser: (...a: unknown[]) => api.deleteUser(...a),
  changeUserRole: (...a: unknown[]) => api.changeUserRole(...a),
  // not used by this page, but imported by sibling components
  grantAccess: vi.fn(),
  revokeAccess: vi.fn(),
  addNote: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import TenantDetail from "../TenantDetail";

const staff = (over: Record<string, unknown> = {}) => ({
  user_id: "u1", email: "sam@iron.dev", role: "employee", joined_at: "2026-09-01T00:00:00Z",
  last_sign_in_at: null, banned: false, is_platform_admin: false, ...over,
});

const detail = (over: Record<string, unknown> = {}) => ({
  tenant: { id: "t1", name: "Iron Temple", created_at: "2026-09-01T00:00:00Z" },
  access_state: "complimentary",
  suspension: null,
  subscription: {
    status: "active", plan_tier: "pro", payment_provider: "manual", payment_reference: null,
    amount: 0, currency: "BHD", trial_end: null, current_period_end: null,
  },
  staff: [staff({ user_id: "u0", email: "boss@iron.dev", role: "admin" }), staff()],
  usage: { members: 12, active_members: 10, trainers: 2, branches: 1, classes: 4, last_activity_at: null },
  audit: [],
  ...over,
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/superadmin/tenants/t1"]}>
      <Routes>
        <Route path="/superadmin/tenants/:tenantId" element={<TenantDetail />} />
        <Route path="/superadmin/tenants" element={<p>GYM LIST</p>} />
      </Routes>
    </MemoryRouter>,
  );
}
const reason = (v = "Because reasons") => fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: v } });
const typed = (v: string) => fireEvent.change(screen.getByLabelText(/to confirm/i), { target: { value: v } });
const rowFor = (email: string) => screen.getByText(email).closest("tr") as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchTenantDetail.mockResolvedValue(detail());
  for (const fn of Object.values(api)) if (fn !== api.fetchTenantDetail) fn.mockResolvedValue(undefined);
});

describe("TenantDetail gym controls", () => {
  it("suspends a gym with a reason, then refetches", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Suspend gym" }));
    reason("Chargeback");
    fireEvent.click(screen.getAllByRole("button", { name: "Suspend gym" }).pop() as HTMLElement);
    await waitFor(() => expect(api.suspendGym).toHaveBeenCalledWith("t1", "Chargeback"));
    await waitFor(() => expect(api.fetchTenantDetail).toHaveBeenCalledTimes(2));
  });

  it("shows a suspended gym with Unsuspend and no per-user ban buttons", async () => {
    api.fetchTenantDetail.mockResolvedValue(
      detail({
        suspension: { suspended_at: "2026-10-01T00:00:00Z", reason: "Chargeback" },
        staff: [staff({ banned: true })],
      }),
    );
    renderPage();
    expect(await screen.findByRole("button", { name: "Unsuspend gym" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend gym" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Chargeback");
    expect(screen.queryByRole("button", { name: /^(Ban|Unban) sam@iron.dev/ })).not.toBeInTheDocument();
    expect(within(rowFor("sam@iron.dev")).getByText("Suspended")).toBeInTheDocument();
  });

  it("makes deleting a gym deliberate: exact name, reason, optional account deletion", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Delete gym" }));
    const confirm = screen.getByRole("button", { name: "Delete gym permanently" });
    expect(confirm).toBeDisabled();
    reason("Closing down");
    typed("iron temple");
    expect(confirm).toBeDisabled();
    typed("Iron Temple");
    fireEvent.click(screen.getByLabelText(/also delete the accounts/i));
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(api.deleteGym).toHaveBeenCalledWith({
        tenantId: "t1", confirmName: "Iron Temple", reason: "Closing down", deleteUsers: true,
      }),
    );
    expect(await screen.findByText("GYM LIST")).toBeInTheDocument(); // leaves the deleted gym's page
  });

  it("offers no suspend/delete for a gym that contains a platform admin", async () => {
    api.fetchTenantDetail.mockResolvedValue(
      detail({ staff: [staff({ user_id: "u9", email: "owner@mtdrb.dev", role: "admin", is_platform_admin: true })] }),
    );
    renderPage();
    expect(await screen.findByText(/includes a platform admin/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend gym" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete gym" })).not.toBeInTheDocument();
  });

  it("warns that a Paddle-billed gym must be cancelled in Paddle first", async () => {
    api.fetchTenantDetail.mockResolvedValue(
      detail({
        access_state: "paid",
        subscription: {
          status: "active", plan_tier: "pro", payment_provider: "paddle", payment_reference: "sub_1",
          amount: 35, currency: "BHD", trial_end: null, current_period_end: "2099-01-01T00:00:00Z",
        },
      }),
    );
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Delete gym" }));
    expect(screen.getByText(/cancel its subscription there first/i)).toBeInTheDocument();
  });
});

describe("TenantDetail staff controls", () => {
  it("bans, resets MFA and changes role for an ordinary staff member", async () => {
    renderPage();
    await screen.findByText("sam@iron.dev");

    fireEvent.click(within(rowFor("sam@iron.dev")).getByRole("button", { name: "Ban sam@iron.dev" }));
    reason("Abusive");
    fireEvent.click(screen.getAllByRole("button", { name: "Ban user" }).pop() as HTMLElement);
    await waitFor(() => expect(api.banUser).toHaveBeenCalledWith("u1", "Abusive"));

    fireEvent.click(await within(rowFor("sam@iron.dev")).findByRole("button", { name: "Reset MFA for sam@iron.dev" }));
    reason("Lost phone");
    fireEvent.click(screen.getAllByRole("button", { name: "Reset MFA" }).pop() as HTMLElement);
    await waitFor(() => expect(api.resetUserMfa).toHaveBeenCalledWith("u1", "Lost phone"));

    fireEvent.click(await within(rowFor("sam@iron.dev")).findByRole("button", { name: "Change role for sam@iron.dev" }));
    fireEvent.click(screen.getByLabelText(/^Admin/));
    reason("Promoted");
    fireEvent.click(screen.getByRole("button", { name: "Change role" }));
    await waitFor(() =>
      expect(api.changeUserRole).toHaveBeenCalledWith({ tenantId: "t1", userId: "u1", role: "admin", reason: "Promoted" }),
    );
  });

  it("shows Unban for a banned user", async () => {
    api.fetchTenantDetail.mockResolvedValue(detail({ staff: [staff({ banned: true })] }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Unban sam@iron.dev" }));
    reason("Apologised");
    fireEvent.click(screen.getAllByRole("button", { name: "Unban user" }).pop() as HTMLElement);
    await waitFor(() => expect(api.unbanUser).toHaveBeenCalledWith("u1", "Apologised"));
  });

  it("deletes a user only after their email is typed", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Delete sam@iron.dev" }));
    const confirm = screen.getByRole("button", { name: "Delete user permanently" });
    reason("Left the company");
    expect(confirm).toBeDisabled();
    typed("SAM@iron.dev");
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(api.deleteUser).toHaveBeenCalledWith({ userId: "u1", confirmEmail: "sam@iron.dev", reason: "Left the company" }),
    );
  });

  it("never offers actions on a platform admin", async () => {
    api.fetchTenantDetail.mockResolvedValue(
      detail({ staff: [staff({ user_id: "u9", email: "owner@mtdrb.dev", role: "admin", is_platform_admin: true })] }),
    );
    renderPage();
    const row = rowFor((await screen.findAllByText("owner@mtdrb.dev"))[0].textContent as string);
    expect(within(row).getByText("Platform admin")).toBeInTheDocument();
    expect(within(row).queryByRole("button")).not.toBeInTheDocument();
  });

  it("surfaces the database's refusal inside the dialog", async () => {
    api.changeUserRole.mockRejectedValue(new Error("Cannot demote the last admin of a gym"));
    api.fetchTenantDetail.mockResolvedValue(detail({ staff: [staff({ role: "admin" })] }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Change role for sam@iron.dev" }));
    fireEvent.click(screen.getByLabelText(/^Employee/));
    reason("Demote");
    fireEvent.click(screen.getByRole("button", { name: "Change role" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("last admin");
  });
});
