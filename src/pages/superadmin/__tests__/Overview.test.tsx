import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const fetchOverview = vi.fn();
const grantAccess = vi.fn();
vi.mock("../../../api/platformAdmin", () => ({
  fetchOverview: (...a: unknown[]) => fetchOverview(...a),
  grantAccess: (...a: unknown[]) => grantAccess(...a),
}));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Overview from "../Overview";

const overview = (awaiting: unknown[]) => ({
  generated_at: "2026-10-19T00:00:00Z",
  totals: { tenants: 4, new_7d: 2, new_30d: 3 },
  by_state: { awaiting_activation: awaiting.length, paid: 1, complimentary: 1, trialing: 0, inactive: 1 },
  no_expiry_comps: 1,
  awaiting_activation: awaiting,
  ending_soon: [],
  recent_changes: [],
});
const queued = { id: "t1", name: "Iron Temple", created_at: new Date().toISOString(), admin_email: "sara@x.dev", admin_last_sign_in: null, members: 3 };

const renderPage = () => render(<MemoryRouter><Overview /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  grantAccess.mockResolvedValue(undefined);
});

describe("Overview", () => {
  it("lists the awaiting-activation queue with an Activate action that opens the dialog", async () => {
    fetchOverview.mockResolvedValue(overview([queued]));
    renderPage();
    expect(await screen.findByText("Iron Temple")).toBeInTheDocument();
    expect(screen.getByText("sara@x.dev")).toBeInTheDocument();
    expect(screen.getByText(/never signed in/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Activate" }));
    expect(await screen.findByText("Activate gym")).toBeInTheDocument();
  });

  it("deep-links the stat tiles into filtered lists", async () => {
    fetchOverview.mockResolvedValue(overview([queued]));
    renderPage();
    await screen.findByText("Iron Temple");
    const tile = screen.getByText("Awaiting activation", { selector: "p" }).closest("a");
    expect(tile).toHaveAttribute("href", "/superadmin/tenants?filter=awaiting_activation");
    expect(screen.getByText("1 with no expiry")).toBeInTheDocument();
  });

  it("celebrates an empty queue", async () => {
    fetchOverview.mockResolvedValue(overview([]));
    renderPage();
    expect(await screen.findByText("All caught up")).toBeInTheDocument();
  });

  it("shows an error with retry when the first load fails", async () => {
    fetchOverview.mockRejectedValueOnce(new Error("nope")).mockResolvedValueOnce(overview([]));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("nope");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(screen.getByText("All caught up")).toBeInTheDocument());
  });
});
