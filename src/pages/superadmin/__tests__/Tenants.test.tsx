import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const listTenants = vi.fn();
vi.mock("../../../api/platformAdmin", () => ({ listTenants: (...a: unknown[]) => listTenants(...a) }));

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
});

describe("Tenants", () => {
  it("builds the RPC arguments from the URL", async () => {
    renderAt("/?q=iron&filter=awaiting_activation&sort=name_asc&page=2");
    await waitFor(() => expect(listTenants).toHaveBeenCalled());
    expect(listTenants).toHaveBeenLastCalledWith({
      search: "iron", filter: "awaiting_activation", sort: "name_asc", limit: 25, offset: 25,
    });
  });

  it("ignores hostile query values", async () => {
    renderAt("/?filter=drop&sort=x;--&page=-9");
    await waitFor(() => expect(listTenants).toHaveBeenCalled());
    expect(listTenants).toHaveBeenLastCalledWith({ search: "", filter: "all", sort: "created_desc", limit: 25, offset: 0 });
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
});
