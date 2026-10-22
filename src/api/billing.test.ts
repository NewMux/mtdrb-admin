import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
vi.mock("../supabaseClient", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

import { BillingError, cancelSubscription, resumeSubscription } from "./billing";

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
