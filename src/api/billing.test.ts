import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
vi.mock("../supabaseClient", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

import {
  BillingError,
  cancelSubscription,
  fetchBillingOverview,
  fetchInvoiceUrl,
  previewUpgradeToPro,
  resumeSubscription,
  upgradeToPro,
} from "./billing";

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

describe("fetchBillingOverview / fetchInvoiceUrl", () => {
  const overview = {
    payment_method: { type: "card", brand: "visa", last4: "4242", expiry_month: 4, expiry_year: 2030 },
    update_payment_method_url: "https://pay.example.com/update",
    invoices: [
      { id: "txn_1", number: "1001-1", billed_at: "2026-10-01T09:00:00.000Z", status: "completed", total: { amount: 89, currency: "USD" }, can_download: true },
      { id: "txn_2", number: null, billed_at: null, status: "billed", total: null, can_download: false },
    ],
    invoices_available: true,
  };

  it("asks for the overview and reads the card, the update link and the invoices", async () => {
    invoke.mockResolvedValue({ data: overview, error: null });
    expect(await fetchBillingOverview()).toEqual({
      paymentMethod: { type: "card", brand: "visa", last4: "4242", expiryMonth: 4, expiryYear: 2030 },
      updatePaymentMethodUrl: "https://pay.example.com/update",
      invoices: [
        { id: "txn_1", number: "1001-1", billedAt: "2026-10-01T09:00:00.000Z", status: "completed", total: { amount: 89, currency: "USD" }, canDownload: true },
        { id: "txn_2", number: null, billedAt: null, status: "billed", total: null, canDownload: false },
      ],
      invoicesAvailable: true,
    });
    expect(invoke).toHaveBeenCalledWith("paddle-billing-info", { body: { action: "overview" } });
  });

  it("never offers a link that is not https", async () => {
    invoke.mockResolvedValue({ data: { ...overview, update_payment_method_url: "javascript:alert(1)" }, error: null });
    expect((await fetchBillingOverview()).updatePaymentMethodUrl).toBeNull();
  });

  it("copes with no card, no link, and an invoice list that could not be loaded", async () => {
    invoke.mockResolvedValue({ data: { payment_method: null, update_payment_method_url: null, invoices: [], invoices_available: false }, error: null });
    expect(await fetchBillingOverview()).toEqual({ paymentMethod: null, updatePaymentMethodUrl: null, invoices: [], invoicesAvailable: false });
  });

  it("skips invoice rows it cannot read instead of failing the whole list", async () => {
    invoke.mockResolvedValue({ data: { ...overview, invoices: [overview.invoices[0], { id: 5 }, null, "x"] }, error: null });
    expect((await fetchBillingOverview()).invoices).toHaveLength(1);
  });

  it("shows the function's own message, or explains a missing function and a transport failure", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 403, json: async () => ({ error: "Only a workspace admin can see billing details." }) } } });
    await expect(fetchBillingOverview()).rejects.toThrow("Only a workspace admin");
    invoke.mockResolvedValue({ data: null, error: { context: { status: 404 } } });
    await expect(fetchBillingOverview()).rejects.toThrow("aren't available yet");
    invoke.mockResolvedValue({ data: null, error: new Error("network") });
    await expect(fetchBillingOverview()).rejects.toThrow("Could not reach billing");
  });

  it.each([[null], ["x"], [{ payment_method: null }]])("rejects an unreadable overview: %j", async (data) => {
    invoke.mockResolvedValue({ data, error: null });
    await expect(fetchBillingOverview()).rejects.toThrow("unexpected answer");
  });

  it("asks for one invoice and returns its https link", async () => {
    invoke.mockResolvedValue({ data: { url: "https://pay.example.com/invoice.pdf" }, error: null });
    expect(await fetchInvoiceUrl("txn_1")).toBe("https://pay.example.com/invoice.pdf");
    expect(invoke).toHaveBeenCalledWith("paddle-billing-info", { body: { action: "invoice", transaction_id: "txn_1" } });
  });

  it.each([[{ url: "http://insecure.example.com/x.pdf" }], [{ url: "javascript:alert(1)" }], [{}], [null]])("refuses an invoice link of %j", async (data) => {
    invoke.mockResolvedValue({ data, error: null });
    await expect(fetchInvoiceUrl("txn_1")).rejects.toBeInstanceOf(BillingError);
  });
});
