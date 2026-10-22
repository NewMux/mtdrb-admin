import { describe, expect, it } from "vitest";
import { endOfDay, parseLocalDate, resolveAnalyticsRange, startOfDay, toLocalDateString } from "./analyticsRange";

const now = new Date(2026, 10, 15, 14, 30); // Sun 15 Nov 2026, 14:30 local
const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];
const hms = (d: Date) => [d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()];
const dayCount = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000) + 1;

describe("resolveAnalyticsRange - rolling ranges", () => {
  it.each([
    ["last-7-days", 7],
    ["last-30-days", 30],
    ["last-90-days", 90],
  ])("%s starts at the start of its first day, runs to now, and the previous range is the same number of whole days", (key, days) => {
    const r = resolveAnalyticsRange(key, undefined, undefined, now);
    expect(hms(r.start)).toEqual([0, 0, 0, 0]);
    expect(dayCount(r.start, r.end)).toBe(days);
    expect(r.end.getTime()).toBe(now.getTime());
    expect(dayCount(r.previousStart, r.previousEnd)).toBe(days);
    expect(hms(r.previousStart)).toEqual([0, 0, 0, 0]);
    expect(hms(r.previousEnd)).toEqual([23, 59, 59, 999]);
  });

  it("the previous range ends exactly where the current one begins, with no gap and no overlap", () => {
    const r = resolveAnalyticsRange("last-30-days", undefined, undefined, now);
    expect(r.start.getTime() - r.previousEnd.getTime()).toBe(1);
    expect(ymd(r.start)).toEqual([2026, 10, 17]);
    expect(ymd(r.previousEnd)).toEqual([2026, 10, 16]);
  });

  it("an unknown key behaves like the 30-day default", () => {
    expect(resolveAnalyticsRange("nonsense", undefined, undefined, now)).toEqual(
      resolveAnalyticsRange("last-30-days", undefined, undefined, now),
    );
  });
});

describe("resolveAnalyticsRange - this year", () => {
  it("year to date, against the whole previous year INCLUDING 31 December", () => {
    const r = resolveAnalyticsRange("this-year", undefined, undefined, now);
    expect(ymd(r.start)).toEqual([2026, 1, 1]);
    expect(ymd(r.previousStart)).toEqual([2025, 1, 1]);
    expect(ymd(r.previousEnd)).toEqual([2025, 12, 31]);
    expect(hms(r.previousEnd)).toEqual([23, 59, 59, 999]);
  });
});

describe("resolveAnalyticsRange - custom", () => {
  it("includes the whole of the chosen end date (the old code cut it off at midnight)", () => {
    const r = resolveAnalyticsRange("custom", "2026-11-01", "2026-11-03", now);
    expect(ymd(r.start)).toEqual([2026, 11, 1]);
    expect(hms(r.start)).toEqual([0, 0, 0, 0]);
    expect(ymd(r.end)).toEqual([2026, 11, 3]);
    expect(hms(r.end)).toEqual([23, 59, 59, 999]);
  });

  it("compares with the same number of days immediately before", () => {
    const r = resolveAnalyticsRange("custom", "2026-11-08", "2026-11-14", now); // 7 days
    expect(dayCount(r.start, r.end)).toBe(7);
    expect(ymd(r.previousStart)).toEqual([2026, 11, 1]);
    expect(ymd(r.previousEnd)).toEqual([2026, 11, 7]);
  });

  it("a single day compares with the day before", () => {
    const r = resolveAnalyticsRange("custom", "2026-11-10", "2026-11-10", now);
    expect(dayCount(r.start, r.end)).toBe(1);
    expect(ymd(r.previousStart)).toEqual([2026, 11, 9]);
    expect(ymd(r.previousEnd)).toEqual([2026, 11, 9]);
  });

  it("missing dates fall back to today", () => {
    const r = resolveAnalyticsRange("custom", undefined, undefined, now);
    expect(ymd(r.start)).toEqual([2026, 11, 15]);
    expect(ymd(r.end)).toEqual([2026, 11, 15]);
  });
});

describe("date helpers", () => {
  it("parseLocalDate reads YYYY-MM-DD as that local day, not midnight UTC", () => {
    expect(ymd(parseLocalDate("2026-11-03"))).toEqual([2026, 11, 3]);
    expect(hms(parseLocalDate("2026-11-03"))).toEqual([0, 0, 0, 0]);
  });

  it("toLocalDateString is the local calendar day (UTC would be a day behind 00:00-03:00 in UTC+3)", () => {
    expect(toLocalDateString(new Date(2026, 10, 3, 0, 30))).toBe("2026-11-03");
    expect(toLocalDateString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("startOfDay / endOfDay do not mutate their input", () => {
    const d = new Date(2026, 10, 3, 12);
    startOfDay(d);
    endOfDay(d);
    expect(d.getHours()).toBe(12);
  });
});
