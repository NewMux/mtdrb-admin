import { describe, expect, it } from "vitest";
import { planIncludesAnalytics } from "./planFeatures";

describe("planIncludesAnalytics", () => {
  it("is off for Starter, whatever the casing", () => {
    expect(planIncludesAnalytics("starter")).toBe(false);
    expect(planIncludesAnalytics(" Starter ")).toBe(false);
  });

  it("is on for every other plan", () => {
    for (const tier of ["pro", "enterprise", "demo"]) expect(planIncludesAnalytics(tier)).toBe(true);
  });

  it("does not lock a gym with no plan on record", () => {
    expect(planIncludesAnalytics(null)).toBe(true);
    expect(planIncludesAnalytics(undefined)).toBe(true);
  });
});
