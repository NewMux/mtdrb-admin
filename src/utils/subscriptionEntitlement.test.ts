import { describe, expect, it } from "vitest";
import {
  contextSubscriptionToEntitlement,
  isSubscriptionEntitled,
} from "./subscriptionEntitlement";

describe("isSubscriptionEntitled", () => {
  const now = new Date("2026-08-20T00:00:00.000Z");

  it("accepts an active subscription with no provider-managed end date", () => {
    expect(isSubscriptionEntitled({ status: "active" }, now)).toBe(true);
  });

  it("accepts an active subscription whose current period is still open", () => {
    expect(
      isSubscriptionEntitled(
        { status: "active", current_period_end: "2026-08-21T00:00:00.000Z" },
        now,
      ),
    ).toBe(true);
  });

  it("rejects an active subscription after its current period ends", () => {
    expect(
      isSubscriptionEntitled(
        { status: "active", current_period_end: "2026-08-19T23:59:59.000Z" },
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

  it("rejects cancelled, failed, expired, and unknown statuses", () => {
    for (const status of ["cancelled", "failed", "expired", "past_due", "unknown"]) {
      expect(isSubscriptionEntitled({ status }, now)).toBe(false);
    }
  });
});

describe("contextSubscriptionToEntitlement", () => {
  const now = new Date("2026-08-20T00:00:00.000Z");

  it("maps expires_at to current_period_end so a lapsed active subscription is not entitled", () => {
    const lapsed = {
      status: "active",
      trial_end: null,
      expires_at: "2026-08-19T00:00:00.000Z",
    };
    // The bug: passing the context object straight through ignores expires_at.
    expect(isSubscriptionEntitled(lapsed, now)).toBe(true);
    expect(isSubscriptionEntitled(contextSubscriptionToEntitlement(lapsed), now)).toBe(false);
  });

  it("keeps an open period and a future trial entitled", () => {
    expect(
      isSubscriptionEntitled(
        contextSubscriptionToEntitlement({ status: "active", expires_at: "2026-09-01T00:00:00.000Z" }),
        now,
      ),
    ).toBe(true);
    expect(
      isSubscriptionEntitled(
        contextSubscriptionToEntitlement({ status: "trialing", trial_end: "2026-08-21T00:00:00.000Z" }),
        now,
      ),
    ).toBe(true);
  });

  it("treats no subscription as not entitled", () => {
    expect(contextSubscriptionToEntitlement(null)).toBeNull();
    expect(isSubscriptionEntitled(contextSubscriptionToEntitlement(undefined), now)).toBe(false);
  });
});
