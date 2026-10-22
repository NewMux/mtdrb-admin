import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const setExtraLocations = vi.fn();
// The displayed prices come from env defaults; pin them so this test says what it means.
vi.mock("../../../../config/runtimeConfig", async (original) => ({
  ...(await original<typeof import("../../../../config/runtimeConfig")>()),
  PLATFORM_CURRENCY: "USD",
  STARTER_EXTRA_LOCATION_PRICE: 10,
  PRO_EXTRA_LOCATION_PRICE: 15,
}));

vi.mock("../../../../api/locations", async () => {
  const actual = await vi.importActual<typeof import("../../../../api/locations")>("../../../../api/locations");
  return { ...actual, setExtraLocations: (...a: unknown[]) => setExtraLocations(...a) };
});
const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastPlain = vi.fn();
vi.mock("react-hot-toast", () => ({
  toast: Object.assign((...a: unknown[]) => toastPlain(...a), {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  }),
}));

import "../../../../i18n";
import ExtraLocationModal from "../ExtraLocationModal";
import type { LocationUsage } from "../../../../api/locations";

const usage = (over: Partial<LocationUsage> = {}): LocationUsage => ({
  tenantId: "t1",
  used: 1,
  limit: 1,
  extraLocations: 0,
  planTier: "starter",
  status: "active",
  billingProvider: "paddle",
  isAdmin: true,
  ...over,
});

function open(u: LocationUsage, mode: "add" | "release" = "add") {
  const onDone = vi.fn();
  const onClose = vi.fn();
  render(<ExtraLocationModal isOpen usage={u} mode={mode} onClose={onClose} onDone={onDone} />);
  return { onDone, onClose };
}

const confirmButton = (name: RegExp) => screen.queryByRole("button", { name });

beforeEach(() => {
  vi.clearAllMocks();
  setExtraLocations.mockResolvedValue({ extraLocations: 1, limit: 2, synced: true });
});

describe("ExtraLocationModal (add)", () => {
  it("shows the price for the plan and that the prorated amount is charged now", () => {
    open(usage());
    expect(screen.getByText(/\+10 USD per month/)).toBeInTheDocument();
    expect(screen.getByText(/prorated amount/i)).toBeInTheDocument();
    expect(screen.getByText(/Starter plan includes 1 location/)).toBeInTheDocument();
  });

  it("uses Pro's price on Pro", () => {
    open(usage({ planTier: "pro" }));
    expect(screen.getByText(/\+15 USD per month/)).toBeInTheDocument();
  });

  it("buys exactly one more than the gym has now, then reports done", async () => {
    const { onDone } = open(usage({ used: 3, limit: 3, extraLocations: 2 }));
    fireEvent.click(confirmButton(/add location/i)!);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(setExtraLocations).toHaveBeenCalledWith(3);
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("a gym over its limit buys enough extras to open a slot, and is told the full price first", async () => {
    // Subscribed with 3 branches on a plan that includes 1: limit 1, used 3.
    const { onDone } = open(usage({ used: 3, limit: 1, extraLocations: 0 }));
    expect(screen.getByText(/already have 3 branches, so 3 extra locations are needed/)).toBeInTheDocument();
    expect(screen.getByText(/\+30 USD per month/)).toBeInTheDocument();
    fireEvent.click(confirmButton(/add location/i)!);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    // limit = 1 + 3 = 4 > used 3: the branch can now actually be created.
    expect(setExtraLocations).toHaveBeenCalledWith(3);
  });

  it("does not mention catching up when only one extra is needed", () => {
    open(usage({ used: 2, limit: 2, extraLocations: 1 }));
    expect(screen.queryByText(/extra locations are needed/)).toBeNull();
    expect(screen.getByText(/\+10 USD per month/)).toBeInTheDocument();
  });

  it("tells the user when billing changed but has not synced yet", async () => {
    setExtraLocations.mockResolvedValue({ extraLocations: 1, limit: 2, synced: false });
    const { onDone } = open(usage());
    fireEvent.click(confirmButton(/add location/i)!);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(toastPlain).toHaveBeenCalled();
  });

  it("shows the error and does not continue when billing fails", async () => {
    setExtraLocations.mockRejectedValue(new Error("Check your payment method."));
    const { onDone } = open(usage());
    fireEvent.click(confirmButton(/add location/i)!);
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Check your payment method."));
    expect(onDone).not.toHaveBeenCalled();
  });

  it("a non-admin is told to ask an admin and cannot buy", () => {
    open(usage({ isAdmin: false }));
    expect(screen.getByText(/ask a workspace admin/i)).toBeInTheDocument();
    expect(confirmButton(/add location/i)).toBeNull();
  });

  it.each([
    ["a cancelled subscription", { status: "cancelled" }],
    ["a manual grant", { billingProvider: "manual" }],
    ["an enterprise plan", { planTier: "enterprise" }],
  ])("cannot buy on %s", (_label, over) => {
    open(usage(over));
    expect(screen.getByText(/can't be added/i)).toBeInTheDocument();
    expect(confirmButton(/add location/i)).toBeNull();
  });

  it("stops at the maximum", () => {
    open(usage({ extraLocations: 50, used: 51, limit: 51 }));
    expect(screen.getByText(/maximum number of extra locations/i)).toBeInTheDocument();
    expect(confirmButton(/add location/i)).toBeNull();
  });
});

describe("ExtraLocationModal (release)", () => {
  const releasable = usage({ used: 2, limit: 5, extraLocations: 4 }); // 3 extras no branch needs

  it("says how many are unused and what removing them saves", () => {
    open(releasable, "release");
    expect(screen.getByText(/3 extra location\(s\) that no branch uses/)).toBeInTheDocument();
    expect(screen.getByText(/saves 30 USD per month/)).toBeInTheDocument();
  });

  it("sets the number of extras to what the branches need, never below", async () => {
    const { onDone } = open(releasable, "release");
    fireEvent.click(confirmButton(/remove unused/i)!);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(setExtraLocations).toHaveBeenCalledWith(1);
  });
});
