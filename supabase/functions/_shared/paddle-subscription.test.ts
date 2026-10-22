import { describe, expect, it } from "vitest";
import { readSubscriptionDates } from "./paddle-subscription";

const END = "2026-11-20T10:00:00Z";
const END_ISO = "2026-11-20T10:00:00.000Z";

describe("readSubscriptionDates", () => {
  it("a normal active subscription: next bill date is the period end, nothing scheduled", () => {
    expect(readSubscriptionDates({ next_billed_at: END, scheduled_change: null }, "active")).toEqual({
      cancelAt: null,
      periodEnd: END_ISO,
    });
  });

  it("a cancellation scheduled for the period end is recorded and the period end is kept", () => {
    const out = readSubscriptionDates(
      { next_billed_at: END, scheduled_change: { action: "cancel", effective_at: END, resume_at: null } },
      "active",
    );
    expect(out).toEqual({ cancelAt: END_ISO, periodEnd: END_ISO });
  });

  it("if Paddle drops next_billed_at once a cancel is scheduled, the cancel date is the period end (never 'no end')", () => {
    const out = readSubscriptionDates(
      { next_billed_at: null, scheduled_change: { action: "cancel", effective_at: END } },
      "active",
    );
    expect(out).toEqual({ cancelAt: END_ISO, periodEnd: END_ISO });
  });

  it("falls back to the current billing period's end for an active subscription with no other date", () => {
    const out = readSubscriptionDates({ current_billing_period: { starts_at: "2026-10-20T10:00:00Z", ends_at: END } }, "active");
    expect(out).toEqual({ cancelAt: null, periodEnd: END_ISO });
  });

  it("an active subscription with no usable date at all yields null (the caller's problem, not a guess)", () => {
    expect(readSubscriptionDates({}, "active")).toEqual({ cancelAt: null, periodEnd: null });
  });

  it("ignores scheduled changes that are not cancellations (pause)", () => {
    const out = readSubscriptionDates(
      { next_billed_at: END, scheduled_change: { action: "pause", effective_at: "2026-11-01T00:00:00Z" } },
      "active",
    );
    expect(out.cancelAt).toBeNull();
  });

  it("an ended subscription keeps no period end and no fallback", () => {
    expect(readSubscriptionDates({ next_billed_at: null, current_billing_period: { ends_at: END } }, "canceled")).toEqual({
      cancelAt: null,
      periodEnd: null,
    });
  });

  it("rejects unparseable dates rather than storing them", () => {
    const out = readSubscriptionDates(
      { next_billed_at: "soon", scheduled_change: { action: "cancel", effective_at: "later" } },
      "active",
    );
    expect(out).toEqual({ cancelAt: null, periodEnd: null });
  });

  it("copes with odd shapes", () => {
    expect(readSubscriptionDates({ scheduled_change: "cancel", current_billing_period: 5 }, "active")).toEqual({
      cancelAt: null,
      periodEnd: null,
    });
  });
});
