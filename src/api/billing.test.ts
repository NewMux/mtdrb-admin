import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
vi.mock("../supabaseClient", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

import { BillingError, cancelSubscription, previewUpgradeToPro, resumeSubscription, upgradeToPro } from "./billing";

beforeEach(() => invoke.mockReset());

describe("cancelSubscription / resumeSubscription", () => {
  it("cancel sends the cancel action and returns the end date", async () => {
    invoke.mockResolvedValue({ data: { cancel_at: "2026-11-20T10:00:00.000Z", synced: true }, error: null });
    expect(await cancelSubscription()).toEqual({ cancelAt: "2026-11-20T10:00:00.000Z", synced: true });
    expect(invoke).toHaveBeenCalledWith("paddle-cancel-subscription", { body: { action: "cancel" } });
  });

  it("resume sends the resume action and a null date", async () => {
    invoke.mockResolvedValue({ data: { cancel_at: null, synced: true }, error: null });
    expect(await resumeSubscription()).toEqual({ cancelAt: null, synced: true });
    expect(invoke).toHaveBeenCalledWith("paddle-cancel-subscription", { body: { action: "resume" } });
  });

  it("surfaces synced:false", async () => {
    invoke.mockResolvedValue({ data: { cancel_at: null, synced: false }, error: null });
    expect((await cancelSubscription()).synced).toBe(false);
  });

  it("shows the function's own message when it refuses", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 502, json: async () => ({ error: "Billing could not cancel your subscription, so nothing was changed." }) } },
    });
    await expect(cancelSubscription()).rejects.toThrow("nothing was changed");
    await expect(cancelSubscription()).rejects.toBeInstanceOf(BillingError);
  });

  it("explains a function that is not deployed, and any other transport failure", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 404 } } });
    await expect(cancelSubscription()).rejects.toThrow("isn't available yet");
    invoke.mockResolvedValue({ data: null, error: new Error("network") });
    await expect(cancelSubscription()).rejects.toThrow("Could not reach billing");
  });

  it.each([[null], [{ ok: true }], [{ cancel_at: 5 }], ["x"]])("rejects an unreadable answer: %j", async (data) => {
    invoke.mockResolvedValue({ data, error: null });
    await expect(cancelSubscription()).rejects.toThrow("unexpected answer");
  });
});

describe("previewUpgradeToPro / upgradeToPro", () => {
  it("preview asks for the preview action and reads the amounts", async () => {
    invoke.mockResolvedValue({
      data: {
        plan_tier: "pro",
        extra_locations: 2,
        charge_now: { amount: 21.5, currency: "BHD" },
        recurring: { amount: 169, currency: "BHD" },
        next_billed_at: "2026-11-24T00:00:00.000Z",
      },
      error: null,
    });
    expect(await previewUpgradeToPro()).toEqual({
      extraLocations: 2,
      chargeNow: { amount: 21.5, currency: "BHD" },
      recurring: { amount: 169, currency: "BHD" },
      nextBilledAt: "2026-11-24T00:00:00.000Z",
      alreadyOnPro: false,
    });
    expect(invoke).toHaveBeenCalledWith("paddle-change-plan", { body: { action: "preview" } });
  });

  it("treats an amount billing could not work out as unknown, not zero", async () => {
    invoke.mockResolvedValue({ data: { plan_tier: "pro", extra_locations: 0, charge_now: null, recurring: { amount: "x", currency: "USD" } }, error: null });
    expect(await previewUpgradeToPro()).toMatchObject({ chargeNow: null, recurring: null, nextBilledAt: null });
  });

  it("upgrade sends the upgrade action and reports synced / already", async () => {
    invoke.mockResolvedValue({ data: { plan_tier: "pro", extra_locations: 0, synced: true }, error: null });
    expect(await upgradeToPro()).toEqual({ extraLocations: 0, synced: true, alreadyOnPro: false });
    expect(invoke).toHaveBeenCalledWith("paddle-change-plan", { body: { action: "upgrade" } });

    invoke.mockResolvedValue({ data: { plan_tier: "pro", extra_locations: 1, synced: false }, error: null });
    expect((await upgradeToPro()).synced).toBe(false);

    invoke.mockResolvedValue({ data: { already: true, plan_tier: "pro", extra_locations: 0, synced: true }, error: null });
    expect((await upgradeToPro()).alreadyOnPro).toBe(true);
  });

  it("shows the function's own message when it refuses (declined card, not on Starter, ...)", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 502, json: async () => ({ error: "Billing could not complete the upgrade, so you were not charged and your plan is unchanged." }) } },
    });
    await expect(upgradeToPro()).rejects.toThrow("not charged");
    await expect(upgradeToPro()).rejects.toBeInstanceOf(BillingError);
  });

  it("explains a function that is not deployed, and any other transport failure", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 404 } } });
    await expect(upgradeToPro()).rejects.toThrow("isn't available yet");
    invoke.mockResolvedValue({ data: null, error: new Error("network") });
    await expect(previewUpgradeToPro()).rejects.toThrow("Could not reach billing");
  });

  it.each([[null], [{ ok: true }], [{ plan_tier: "starter", extra_locations: 0 }], [{ plan_tier: "pro" }], [{ plan_tier: "pro", extra_locations: 1.5 }]])(
    "rejects an unreadable answer: %j",
    async (data) => {
      invoke.mockResolvedValue({ data, error: null });
      await expect(upgradeToPro()).rejects.toThrow("unexpected answer");
    },
  );
});
