import { describe, expect, it } from "vitest";
import { PAST_DUE_GRACE_DAYS, mapPaddleStatus, nextGraceUntil, readSubscriptionDates } from "./paddle-subscription";

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

describe("mapPaddleStatus", () => {
  it("keeps the statuses that have an equivalent, including past_due", () => {
    expect(mapPaddleStatus("active")).toBe("active");
    expect(mapPaddleStatus("trialing")).toBe("trialing");
    expect(mapPaddleStatus("past_due")).toBe("past_due");
  });

  it("everything else means no access", () => {
    for (const status of ["canceled", "paused", "", "something_new"]) {
      expect(mapPaddleStatus(status)).toBe("cancelled");
    }
  });
});

describe("nextGraceUntil", () => {
  const now = new Date("2026-11-01T12:00:00.000Z");
  const day = 24 * 60 * 60 * 1000;

  it("a first failure opens a fresh window", () => {
    const out = nextGraceUntil("past_due", { status: "active", grace_until: null }, now);
    expect(out).toBe(new Date(now.getTime() + PAST_DUE_GRACE_DAYS * day).toISOString());
    expect(nextGraceUntil("past_due", null, now)).toBe(out);
  });

  it("Paddle's retry events do not extend the window", () => {
    const first = nextGraceUntil("past_due", null, now);
    const later = new Date(now.getTime() + 3 * day);
    expect(nextGraceUntil("past_due", { status: "past_due", grace_until: first }, later)).toBe(first);
  });

  it("a second failure after a recovery starts a new window", () => {
    const old = "2026-09-01T00:00:00.000Z";
    // Recovered (stored status active, grace cleared) then failed again.
    expect(nextGraceUntil("past_due", { status: "active", grace_until: null }, now)).not.toBe(old);
    // Even a stale grace_until on a non-past_due row is ignored.
    expect(nextGraceUntil("past_due", { status: "active", grace_until: old }, now)).toBe(
      new Date(now.getTime() + PAST_DUE_GRACE_DAYS * day).toISOString(),
    );
  });

  it("a past_due row with an unreadable stored date gets a fresh window rather than none", () => {
    expect(nextGraceUntil("past_due", { status: "past_due", grace_until: "garbage" }, now)).toBe(
      new Date(now.getTime() + PAST_DUE_GRACE_DAYS * day).toISOString(),
    );
  });

  it("any other status clears it", () => {
    for (const status of ["active", "trialing", "canceled", "paused"]) {
      expect(nextGraceUntil(status, { status: "past_due", grace_until: "2026-11-05T00:00:00.000Z" }, now)).toBeNull();
    }
  });
});
