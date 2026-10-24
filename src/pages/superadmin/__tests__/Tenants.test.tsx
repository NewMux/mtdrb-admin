import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const listTenants = vi.fn();
const inviteGym = vi.fn();
const fetchGymsByCountry = vi.fn();
vi.mock("../../../api/platformAdmin", () => ({
  listTenants: (...a: unknown[]) => listTenants(...a),
  inviteGym: (...a: unknown[]) => inviteGym(...a),
  fetchGymsByCountry: (...a: unknown[]) => fetchGymsByCountry(...a),
}));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Tenants from "../Tenants";

const row = (i: number) => ({
  id: `t${i}`, name: `Gym ${i}`, created_at: "2026-10-01T00:00:00Z", admin_email: `a${i}@x.dev`,
  admin_last_sign_in: null, access_state: "awaiting_activation", subscription: null,
  members: i, trainers: 0, branches: 0, classes: 0,
});

const renderAt = (url: string) =>
  render(<MemoryRouter initialEntries={[url]}><Tenants /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  listTenants.mockResolvedValue({ total: 60, rows: [row(1), row(2)] });
  fetchGymsByCountry.mockResolvedValue({
    generated_at: "x", total: 2, countries: 2,
    rows: [
      { country: "BH", gyms: 1, paid: 0, trialing: 0, members: 0 },
      { country: "DE", gyms: 1, paid: 0, trialing: 0, members: 0 },
    ],
  });
});

describe("Tenants", () => {
  it("builds the RPC arguments from the URL", async () => {
    renderAt("/?q=iron&filter=awaiting_activation&sort=name_asc&page=2");
    await waitFor(() => expect(listTenants).toHaveBeenCalled());
    expect(listTenants).toHaveBeenLastCalledWith({
      search: "iron", filter: "awaiting_activation", sort: "name_asc", country: "", limit: 25, offset: 25,
    });
  });

  it("ignores hostile query values", async () => {
    renderAt("/?filter=drop&sort=x;--&page=-9");
    await waitFor(() => expect(listTenants).toHaveBeenCalled());
    expect(listTenants).toHaveBeenLastCalledWith({ search: "", filter: "all", sort: "created_desc", country: "", limit: 25, offset: 0 });
  });

  it("refetches with the new filter and resets to page 1", async () => {
    renderAt("/?page=2");
    await waitFor(() => expect(listTenants).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Paid" }));
    await waitFor(() => expect(listTenants).toHaveBeenLastCalledWith(expect.objectContaining({ filter: "paid", offset: 0 })));
  });

  it("debounces typing into a single search", async () => {
    renderAt("/");
    await waitFor(() => expect(listTenants).toHaveBeenCalledTimes(1));
    const box = screen.getByLabelText(/search gyms/i);
    fireEvent.change(box, { target: { value: "i" } });
    fireEvent.change(box, { target: { value: "ir" } });
    fireEvent.change(box, { target: { value: "iron" } });
    await waitFor(() => expect(listTenants).toHaveBeenLastCalledWith(expect.objectContaining({ search: "iron" })));
    expect(listTenants).toHaveBeenCalledTimes(2);
  });

  it("shows range, pages forward, and an error with retry", async () => {
    renderAt("/");
    expect((await screen.findAllByText("Gym 1")).length).toBeGreaterThan(0);
    expect(screen.getByText("1–25 of 60")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(listTenants).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 25 })));
  });

  it("explains an empty result and offers to clear filters", async () => {
    listTenants.mockResolvedValue({ total: 0, rows: [] });
    renderAt("/?filter=paid");
    expect(await screen.findByText("No gyms match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("surfaces a load failure", async () => {
    listTenants.mockRejectedValue(new Error("boom"));
    renderAt("/");
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });

  it("invites a gym from the list and lands on the new gym's page", async () => {
    inviteGym.mockResolvedValue({ tenantId: "t77", userId: "u77", email: "sara@iron.dev" });
    render(
      <MemoryRouter initialEntries={["/superadmin/tenants"]}>
        <Routes>
          <Route path="/superadmin/tenants" element={<Tenants />} />
          <Route path="/superadmin/tenants/:id" element={<p>NEW GYM PAGE</p>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Invite a gym" }));
    fireEvent.change(screen.getByLabelText("Gym name"), { target: { value: "Iron Temple" } });
    fireEvent.change(screen.getByLabelText("Admin email"), { target: { value: "sara@iron.dev" } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "Founding customer" } });
    fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
    expect(await screen.findByText("NEW GYM PAGE")).toBeInTheDocument();
  });

  it("filters by the country in the URL and lets the owner pick another", async () => {
    renderAt("/?country=bh");
    await waitFor(() => expect(listTenants).toHaveBeenCalledWith(expect.objectContaining({ country: "BH" })));
    const select = await screen.findByLabelText("Country");
    await screen.findByRole("option", { name: "Germany" });
    fireEvent.change(select, { target: { value: "DE" } });
    await waitFor(() => expect(listTenants).toHaveBeenLastCalledWith(expect.objectContaining({ country: "DE", offset: 0 })));
  });

  it("shows each gym's country", async () => {
    listTenants.mockResolvedValue({ total: 1, rows: [{ ...row(1), country: "BH" }] });
    renderAt("/");
    expect((await screen.findAllByText("Bahrain")).length).toBeGreaterThan(0);
  });
});
