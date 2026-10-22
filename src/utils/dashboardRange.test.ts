import { describe, expect, it } from "vitest";
import { getDateRange } from "./dashboardRange";

// Local-time getters throughout: the ranges are browser-local calendar maths, so
// the assertions hold in whatever timezone the tests run in.
const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];
const hms = (d: Date) => [d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()];
const END_OF_DAY = [23, 59, 59, 999];
const START_OF_DAY = [0, 0, 0, 0];

describe("getDateRange", () => {
  const now = new Date(2026, 10, 15, 14, 30); // Sun 15 Nov 2026, 14:30 local

  it("month: current is month-to-date, previous is the whole of last month INCLUDING its last day", () => {
    const r = getDateRange("month", now);
    expect(ymd(r.currentStart)).toEqual([2026, 11, 1]);
    expect(hms(r.currentStart)).toEqual(START_OF_DAY);
    expect(r.currentEnd.getTime()).toBe(now.getTime());
    expect(ymd(r.previousStart)).toEqual([2026, 10, 1]);
    expect(hms(r.previousStart)).toEqual(START_OF_DAY);
    expect(ymd(r.previousEnd)).toEqual([2026, 10, 31]);
    expect(hms(r.previousEnd)).toEqual(END_OF_DAY);
  });

  it("week: Monday to Sunday, and the previous week keeps its Sunday", () => {
    const r = getDateRange("week", now); // 15 Nov 2026 is a Sunday: its week started Mon 9 Nov
    expect(ymd(r.currentStart)).toEqual([2026, 11, 9]);
    expect(ymd(r.currentEnd)).toEqual([2026, 11, 15]);
    expect(hms(r.currentEnd)).toEqual(END_OF_DAY);
    expect(ymd(r.previousStart)).toEqual([2026, 11, 2]);
    expect(ymd(r.previousEnd)).toEqual([2026, 11, 8]);
    expect(hms(r.previousEnd)).toEqual(END_OF_DAY);
  });

  it("quarter: previous quarter spans three whole months to the end of its last day", () => {
    const r = getDateRange("quarter", now); // Q4 2026
    expect(ymd(r.currentStart)).toEqual([2026, 10, 1]);
    expect(ymd(r.previousStart)).toEqual([2026, 7, 1]);
    expect(ymd(r.previousEnd)).toEqual([2026, 9, 30]);
    expect(hms(r.previousEnd)).toEqual(END_OF_DAY);
  });

  it("quarter in January reaches back into the previous year", () => {
    const r = getDateRange("quarter", new Date(2027, 0, 10));
    expect(ymd(r.previousStart)).toEqual([2026, 10, 1]);
    expect(ymd(r.previousEnd)).toEqual([2026, 12, 31]);
  });

  it("year: previous year runs to 31 December, end of day", () => {
    const r = getDateRange("year", now);
    expect(ymd(r.currentStart)).toEqual([2026, 1, 1]);
    expect(ymd(r.previousStart)).toEqual([2025, 1, 1]);
    expect(ymd(r.previousEnd)).toEqual([2025, 12, 31]);
    expect(hms(r.previousEnd)).toEqual(END_OF_DAY);
  });

  it("the previous period always ends before the current one starts, with no gap larger than the end-of-day instant", () => {
    for (const range of ["week", "month", "quarter", "year"] as const) {
      const r = getDateRange(range, now);
      expect(r.previousEnd.getTime()).toBeLessThan(r.currentStart.getTime());
      expect(r.currentStart.getTime() - r.previousEnd.getTime()).toBeLessThanOrEqual(1);
    }
  });
});
