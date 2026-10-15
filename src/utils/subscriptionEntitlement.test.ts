import { describe, expect, it } from "vitest";
import { isSubscriptionEntitled } from "./subscriptionEntitlement";

describe("isSubscriptionEntitled", () => {
  const now = new Date("2026-08-20T00:00:00.000Z");

  it("accepts an open-ended active manual grant", () => {
    expect(isSubscriptionEntitled({ status: "active" }, now)).toBe(true);
    expect(isSubscriptionEntitled({ status: "active", payment_provider: "manual" }, now)).toBe(true);
  });

  it("rejects an active Paddle subscription with no paid-through date", () => {
    expect(isSubscriptionEntitled({ status: "active", payment_provider: "paddle" }, now)).toBe(false);
  });

  it("accepts an active subscription whose current period is still open", () => {
    expect(
      isSubscriptionEntitled(
        { status: "active", current_period_end: "2026-08-21T00:00:00.000Z" },
        now,
      ),
    ).toBe(true);
  });

  it("keeps an active subscription for the renewal grace after its period ends", () => {
    expect(
      isSubscriptionEntitled(
        { status: "active", current_period_end: "2026-08-18T00:00:01.000Z" },
        now,
      ),
    ).toBe(true);
  });

  it("rejects an active subscription once the renewal grace has passed", () => {
    expect(
      isSubscriptionEntitled(
        { status: "active", current_period_end: "2026-08-17T23:59:59.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("accepts a trial only while trial_end is in the future", () => {
    expect(
      isSubscriptionEntitled(
        { status: "trialing", trial_end: "2026-08-20T00:00:01.000Z" },
        now,
      ),
    ).toBe(true);
  });

  it("rejects a trial without an end date or after it expires", () => {
    expect(isSubscriptionEntitled({ status: "trialing" }, now)).toBe(false);
    expect(
      isSubscriptionEntitled(
        { status: "trialing", trial_end: "2026-08-19T23:59:59.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("keeps a cancelled subscription until its paid period ends, with no grace", () => {
    expect(
      isSubscriptionEntitled({ status: "cancelled", current_period_end: "2026-08-25T00:00:00.000Z" }, now),
    ).toBe(true);
    expect(
      isSubscriptionEntitled({ status: "cancelled", current_period_end: "2026-08-19T23:59:59.000Z" }, now),
    ).toBe(false);
    expect(isSubscriptionEntitled({ status: "cancelled" }, now)).toBe(false);
  });

  it("rejects failed, expired, past_due, and unknown statuses even with a future date", () => {
    for (const status of ["failed", "expired", "past_due", "unknown"]) {
      expect(isSubscriptionEntitled({ status, current_period_end: "2026-09-20T00:00:00.000Z" }, now)).toBe(false);
    }
  });
});
