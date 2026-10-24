import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const fetchBillingOverview = vi.fn();
const fetchInvoiceUrl = vi.fn();
vi.mock("../../../api/billing", () => ({
  fetchBillingOverview: (...a: unknown[]) => fetchBillingOverview(...a),
  fetchInvoiceUrl: (...a: unknown[]) => fetchInvoiceUrl(...a),
}));

const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));
vi.mock("react-hot-toast", () => ({ toast, default: toast }));

import "../../../i18n";
import BillingTab, { type SubscriptionInfo } from "../BillingTab";

const OVERVIEW = {
  paymentMethod: { type: "card", brand: "visa", last4: "4242", expiryMonth: 4, expiryYear: 2030 },
  updatePaymentMethodUrl: "https://pay.example.com/update",
  invoices: [
    { id: "txn_1", number: "1001-1", billedAt: "2026-10-01T09:00:00.000Z", status: "completed", total: { amount: 89, currency: "USD" }, canDownload: true },
    { id: "txn_2", number: "1001-2", billedAt: "2026-11-01T09:00:00.000Z", status: "billed", total: { amount: 89, currency: "USD" }, canDownload: false },
  ],
  invoicesAvailable: true,
};

const STARTER: SubscriptionInfo = {
  tier: "starter",
  isPaid: true,
  status: "active",
  paymentProvider: "paddle",
  amount: 49,
  currency: "USD",
  extraLocations: 0,
  currentPeriodEnd: "2026-11-24T00:00:00.000Z",
  startDate: "2026-09-01T00:00:00.000Z",
};

function show(info: Partial<SubscriptionInfo> = {}, props: Partial<React.ComponentProps<typeof BillingTab>> = {}) {
  const handlers = { onUpgrade: vi.fn(), onSubscribe: vi.fn(), onCancel: vi.fn(), onKeep: vi.fn() };
  render(
    <MemoryRouter>
      <BillingTab info={{ ...STARTER, ...info }} isAdmin resuming={false} {...handlers} {...props} />
    </MemoryRouter>,
  );
  return handlers;
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchBillingOverview.mockResolvedValue(OVERVIEW);
});

describe("subscription card", () => {
  it("shows the plan, price, renewal date and an upgrade button for Starter", async () => {
    const h = show();
    expect(screen.getByRole("heading", { name: "Starter plan" })).toBeInTheDocument();
    expect(screen.getByText("$49.00 per month")).toBeInTheDocument();
    expect(screen.getByText("Next renewal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /upgrade to pro/i }));
    expect(h.onUpgrade).toHaveBeenCalled();
    await screen.findByText(/visa ending 4242/i);
  });

  it("has no upgrade button, and no dead 'manage plan' button, on Pro", async () => {
    show({ tier: "pro", amount: 89 });
    expect(screen.queryByRole("button", { name: /upgrade|manage plan/i })).toBeNull();
    await screen.findByText(/visa ending 4242/i);
  });

  it("links to adding locations and shows the extra locations the gym pays for", async () => {
    show({ extraLocations: 2 });
    expect(screen.getByText(/1 included \+ 2 extra/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add locations/i })).toHaveAttribute("href", "/dashboard/branches");
    await screen.findByText(/visa ending 4242/i);
  });

  it("offers cancelling, and keeping once a cancellation is scheduled", async () => {
    const h = show();
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(h.onCancel).toHaveBeenCalled();
    await screen.findByText(/visa ending 4242/i);
  });

  it("says the subscription is ending and lets the gym keep it", async () => {
    const h = show({ cancelAt: "2026-11-24T00:00:00.000Z" });
    expect(screen.getByText("Ends on")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /keep subscription/i }));
    expect(h.onKeep).toHaveBeenCalled();
    await screen.findByText(/visa ending 4242/i);
  });

  it("warns a gym whose payment failed, with the date its access runs to", async () => {
    show({ status: "past_due", graceUntil: "2026-11-01T00:00:00.000Z" });
    expect(screen.getByRole("alert")).toHaveTextContent(/last payment failed/i);
    await screen.findByText(/visa ending 4242/i);
  });

  it("invites a gym with no subscription to subscribe, and asks billing for nothing", () => {
    const h = show({ tier: "Free", isPaid: false, paymentProvider: undefined });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(h.onSubscribe).toHaveBeenCalled();
    expect(fetchBillingOverview).not.toHaveBeenCalled();
  });

  it("explains a plan managed by MTDRB: no card, no invoices, no cancel button, no billing call", () => {
    show({ tier: "pro", paymentProvider: "manual", amount: 0 });
    expect(screen.getByText(/managed by mtdrb/i, { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText(/contact support to change it/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^cancel$/i })).toBeNull();
    expect(screen.queryByText(/payment method/i)).toBeNull();
    expect(fetchBillingOverview).not.toHaveBeenCalled();
  });

  it("shows only the plan to someone who is not the admin, and never asks for card details", () => {
    show({}, { isAdmin: false });
    expect(screen.getByText(/only your gym's admin can see billing details/i)).toBeInTheDocument();
    expect(fetchBillingOverview).not.toHaveBeenCalled();
  });
});

describe("payment method", () => {
  it("shows the card and a link to the provider's page that opens in a new tab", async () => {
    show();
    expect(await screen.findByText("Visa ending 4242")).toBeInTheDocument();
    expect(screen.getByText("Expires 04/2030")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /update payment method/i });
    expect(link).toHaveAttribute("href", "https://pay.example.com/update");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("says when no payment has been made yet", async () => {
    fetchBillingOverview.mockResolvedValue({ ...OVERVIEW, paymentMethod: null });
    show();
    expect(await screen.findByText(/no payment method on file yet/i)).toBeInTheDocument();
  });

  it("names a non-card method", async () => {
    fetchBillingOverview.mockResolvedValue({ ...OVERVIEW, paymentMethod: { type: "paypal", brand: null, last4: null, expiryMonth: null, expiryYear: null } });
    show();
    expect(await screen.findByText("Paid with PayPal")).toBeInTheDocument();
  });

  it("explains an ended subscription instead of a dead button", async () => {
    fetchBillingOverview.mockResolvedValue({ ...OVERVIEW, updatePaymentMethodUrl: null });
    show();
    expect(await screen.findByText(/subscription has ended/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /update payment method/i })).toBeNull();
  });

  it("shows the reason billing could not be loaded and tries again on request", async () => {
    fetchBillingOverview.mockRejectedValueOnce(new Error("Could not reach billing. Try again."));
    show();
    expect(await screen.findByText("Could not reach billing. Try again.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Visa ending 4242")).toBeInTheDocument();
    expect(fetchBillingOverview).toHaveBeenCalledTimes(2);
  });

  it("refreshes after the gym comes back from the provider's page", async () => {
    show();
    await screen.findByText("Visa ending 4242");
    fetchBillingOverview.mockResolvedValue({ ...OVERVIEW, paymentMethod: { ...OVERVIEW.paymentMethod, last4: "1881" } });
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(await screen.findByText("Visa ending 1881")).toBeInTheDocument();
  });
});

describe("billing history", () => {
  it("lists invoices with their amount and status, and a download only where there is a PDF", async () => {
    show();
    const table = await screen.findByRole("table");
    expect(table).toHaveTextContent("1001-1");
    expect(table).toHaveTextContent("$89.00");
    expect(table).toHaveTextContent("Paid");
    expect(table).toHaveTextContent("Due");
    expect(screen.getAllByRole("button", { name: /download invoice/i })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Download invoice 1001-1" })).toBeInTheDocument();
  });

  it("downloads an invoice through its short-lived link", async () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", { value: { ...window.location, assign }, writable: true });
    fetchInvoiceUrl.mockResolvedValue("https://pay.example.com/invoice.pdf");
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Download invoice 1001-1" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://pay.example.com/invoice.pdf"));
    expect(fetchInvoiceUrl).toHaveBeenCalledWith("txn_1");
  });

  it("tells the gym when an invoice could not be prepared", async () => {
    fetchInvoiceUrl.mockRejectedValue(new Error("Could not prepare the invoice. Try again."));
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Download invoice 1001-1" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not prepare the invoice. Try again."));
  });

  it("says there are no invoices yet, but not when the list simply failed to load", async () => {
    fetchBillingOverview.mockResolvedValue({ ...OVERVIEW, invoices: [] });
    const { unmount } = (show(), { unmount: () => {} });
    expect(await screen.findByText(/no invoices yet/i)).toBeInTheDocument();
    unmount();
  });

  it("does not claim there are no invoices when the list could not be loaded", async () => {
    fetchBillingOverview.mockResolvedValue({ ...OVERVIEW, invoices: [], invoicesAvailable: false });
    show();
    expect(await screen.findByText(/invoices couldn't be loaded/i)).toBeInTheDocument();
    expect(screen.queryByText(/no invoices yet/i)).toBeNull();
  });
});
