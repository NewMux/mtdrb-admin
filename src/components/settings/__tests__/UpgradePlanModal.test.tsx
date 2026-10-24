import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const previewUpgradeToPro = vi.fn();
const upgradeToPro = vi.fn();
vi.mock("../../../api/billing", () => ({
  previewUpgradeToPro: (...a: unknown[]) => previewUpgradeToPro(...a),
  upgradeToPro: (...a: unknown[]) => upgradeToPro(...a),
}));

let role = "admin";
vi.mock("../../../contexts/AuthContext", () => ({ useAuth: () => ({ userMetadata: { role } }) }));

const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));
vi.mock("react-hot-toast", () => ({ toast, default: toast }));

import "../../../i18n";
import UpgradePlanModal from "../UpgradePlanModal";

const PREVIEW = {
  extraLocations: 0,
  chargeNow: { amount: 21.5, currency: "USD" },
  recurring: { amount: 89, currency: "USD" },
  nextBilledAt: "2026-11-24T00:00:00.000Z",
  alreadyOnPro: false,
};

function open() {
  const onDone = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(<UpgradePlanModal isOpen onClose={onClose} onDone={onDone} />);
  return { onDone, onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
  role = "admin";
  previewUpgradeToPro.mockResolvedValue(PREVIEW);
  upgradeToPro.mockResolvedValue({ extraLocations: 0, synced: true, alreadyOnPro: false });
});

describe("UpgradePlanModal", () => {
  it("shows today's charge and the new monthly price before anything is paid", async () => {
    open();
    expect(await screen.findByText(/charged to your card today: \$21\.50/i)).toBeInTheDocument();
    expect(screen.getByText(/\$89\.00 per month, before tax/i)).toBeInTheDocument();
    expect(upgradeToPro).not.toHaveBeenCalled();
  });

  it("does not show a number it does not have", async () => {
    previewUpgradeToPro.mockResolvedValue({ ...PREVIEW, chargeNow: null, recurring: null });
    open();
    expect(await screen.findByText(/prorated difference for the rest of this billing period/i)).toBeInTheDocument();
    expect(screen.queryByText(/per month/i)).toBeNull();
  });

  it("says when paid extra locations move over", async () => {
    previewUpgradeToPro.mockResolvedValue({ ...PREVIEW, extraLocations: 2 });
    open();
    expect(await screen.findByText(/your 2 extra locations move to pro/i)).toBeInTheDocument();
  });

  it("cannot be confirmed until the price is known", async () => {
    previewUpgradeToPro.mockReturnValue(new Promise(() => {}));
    open();
    expect(await screen.findByText(/working out your price/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upgrade and pay/i })).toBeDisabled();
  });

  it("upgrades on confirm, thanks the gym and lets the page reload its plan", async () => {
    const { onDone } = open();
    await screen.findByText(/charged to your card today/i);
    fireEvent.click(screen.getByRole("button", { name: /upgrade and pay/i }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(upgradeToPro).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("You're on Pro");
  });

  it("mentions a record that has not caught up yet", async () => {
    upgradeToPro.mockResolvedValue({ extraLocations: 0, synced: false, alreadyOnPro: false });
    open();
    await screen.findByText(/charged to your card today/i);
    fireEvent.click(screen.getByRole("button", { name: /upgrade and pay/i }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringMatching(/may take a moment/i)));
  });

  it("keeps the dialog open and shows the reason when billing refuses (a declined card)", async () => {
    upgradeToPro.mockRejectedValue(new Error("Billing could not complete the upgrade, so you were not charged and your plan is unchanged."));
    const { onDone } = open();
    await screen.findByText(/charged to your card today/i);
    fireEvent.click(screen.getByRole("button", { name: /upgrade and pay/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/not charged/i)));
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /upgrade and pay/i })).toBeEnabled();
  });

  it("explains why it cannot show a price", async () => {
    previewUpgradeToPro.mockRejectedValue(new Error("Your subscription is set to end. Keep your subscription first, then upgrade."));
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent(/keep your subscription first/i);
    expect(screen.getByRole("button", { name: /upgrade and pay/i })).toBeDisabled();
  });

  it("offers nothing to someone who is not the admin, and never asks billing", async () => {
    role = "employee";
    open();
    expect(await screen.findByText(/only your gym's admin can change the plan/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upgrade and pay/i })).toBeNull();
    expect(previewUpgradeToPro).not.toHaveBeenCalled();
  });

  it("says so when billing already has the gym on Pro", async () => {
    previewUpgradeToPro.mockResolvedValue({ ...PREVIEW, alreadyOnPro: true, chargeNow: null });
    open();
    expect(await screen.findByText(/already on pro/i)).toBeInTheDocument();
  });
});
