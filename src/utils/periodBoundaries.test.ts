import { describe, it, expect } from "vitest";
import { monthBoundary, weekBoundary, dayBoundary, daysWindow } from "./periodBoundaries";

// Bahrain / Gulf time: UTC+3, no DST - a fixed, unambiguous offset that
// makes the historical bug reproducible: local midnight on the 1st is
// 21:00 UTC on the last day of the *previous* month.
const TZ = "Asia/Bahrain";

describe("monthBoundary", () => {
  it("does not shift the month start back a day in a positive-UTC-offset timezone (the historical bug)", () => {
    // 2026-09-15 10:00 UTC+3 is unambiguously September in Bahrain.
    const reference = new Date("2026-09-15T07:00:00Z"); // 10:00 local
    const { startISO, endExclusiveISO } = monthBoundary(reference, 0, TZ);

    // Local midnight Sept 1 in UTC+3 is 2026-08-31T21:00:00Z - the buggy
    // `new Date(2026, 8, 1).toISOString().split("T")[0]` would produce
    // "2026-08-31", one day into the wrong month.
    expect(startISO).toBe("2026-08-31T21:00:00.000Z");
    expect(endExclusiveISO).toBe("2026-09-30T21:00:00.000Z"); // Oct 1 local midnight
  });

  it("includes today's records via an exclusive upper bound, not <= a truncated date", () => {
    const reference = new Date("2026-09-02T05:00:00Z"); // Sept 2, early morning UTC
    const { endExclusiveISO } = monthBoundary(reference, 0, TZ);
    const today = new Date("2026-09-02T20:00:00Z"); // later the same day
    expect(today.getTime()).toBeLessThan(new Date(endExclusiveISO).getTime());
  });

  it("steps back whole months correctly across a year boundary", () => {
    const reference = new Date("2026-01-15T07:00:00Z"); // January, Bahrain
    const { startISO, endExclusiveISO } = monthBoundary(reference, 1, TZ);
    // Previous month is December 2025.
    expect(startISO).toBe("2025-11-30T21:00:00.000Z"); // Dec 1 local midnight
    expect(endExclusiveISO).toBe("2025-12-31T21:00:00.000Z"); // Jan 1 2026 local midnight
  });

  it("handles multiple months back within the same year", () => {
    const reference = new Date("2026-06-10T07:00:00Z");
    const { startISO } = monthBoundary(reference, 3, TZ);
    // 3 months before June is March.
    expect(startISO).toBe("2026-02-28T21:00:00.000Z"); // March 1 local midnight
  });
});

describe("weekBoundary", () => {
  it("anchors to Monday regardless of what weekday `reference` falls on", () => {
    // 2026-09-16 is a Wednesday.
    const wednesday = new Date("2026-09-16T10:00:00Z");
    const { startISO } = weekBoundary(wednesday, TZ);
    // Monday Sept 14 local midnight in UTC+3.
    expect(startISO).toBe("2026-09-13T21:00:00.000Z");
  });

  it("gives the same week start for every day within that week", () => {
    const monday = new Date("2026-09-14T10:00:00Z");
    const sunday = new Date("2026-09-20T10:00:00Z");
    expect(weekBoundary(monday, TZ).startISO).toBe(weekBoundary(sunday, TZ).startISO);
  });

  it("spans exactly 7 days from start to end", () => {
    const { startISO, endExclusiveISO } = weekBoundary(new Date("2026-09-16T10:00:00Z"), TZ);
    const diffDays =
      (new Date(endExclusiveISO).getTime() - new Date(startISO).getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });
});

describe("dayBoundary", () => {
  it("returns today's [midnight, next midnight) for daysAgo=0", () => {
    const reference = new Date("2026-09-16T10:00:00Z");
    const { startISO, endExclusiveISO } = dayBoundary(reference, 0, TZ);
    expect(startISO).toBe("2026-09-15T21:00:00.000Z");
    expect(endExclusiveISO).toBe("2026-09-16T21:00:00.000Z");
  });

  it("steps back across a month boundary correctly", () => {
    const reference = new Date("2026-09-02T10:00:00Z"); // Sept 2
    const { startISO } = dayBoundary(reference, 3, TZ); // 3 days before -> Aug 30
    expect(startISO).toBe("2026-08-29T21:00:00.000Z");
  });
});

describe("daysWindow", () => {
  it("covers exactly N days including today", () => {
    const reference = new Date("2026-09-16T10:00:00Z");
    const { startISO, endExclusiveISO } = daysWindow(reference, 30, TZ);
    const diffDays =
      (new Date(endExclusiveISO).getTime() - new Date(startISO).getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
  });

  it("end boundary matches today's end (exclusive, includes all of today)", () => {
    const reference = new Date("2026-09-16T10:00:00Z");
    const window = daysWindow(reference, 30, TZ);
    const today = dayBoundary(reference, 0, TZ);
    expect(window.endExclusiveISO).toBe(today.endExclusiveISO);
  });
});
