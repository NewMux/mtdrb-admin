// Correct period boundaries for Supabase queries against timestamptz
// columns, anchored to the gym's configured timezone rather than UTC or
// the browser's local time.
//
// Two bugs this replaces:
//  1. `new Date(y, m, 1).toISOString().split("T")[0]` builds a *local*
//     Date, then serializes it through UTC. In a positive-UTC-offset
//     timezone (Bahrain is UTC+3), local midnight on the 1st becomes
//     21:00 UTC on the *previous* day, so the resulting date string is
//     off by one - "this month" silently includes the last day of the
//     prior month.
//  2. `.lte("created_at", "2026-09-02")` on a timestamptz column casts
//     the bare date to midnight UTC, so every row created *later that
//     same day* is excluded. Passing a full ISO timestamp and using an
//     *exclusive* upper bound (`.lt(nextPeriodStart)`) avoids this.
//
// Every function here returns full ISO timestamps (instants), meant for
// `.gte(startISO).lt(endExclusiveISO)` - never `.lte()` with a bare date.

import { zonedTimeToUtc } from "date-fns-tz";

export interface PeriodBoundary {
  startISO: string;
  endExclusiveISO: string;
}

/**
 * The instant that is local midnight on `date`, in `timezone`, expressed
 * as a UTC ISO timestamp - the correct building block for day/month/week
 * boundaries, replacing `new Date(y, m, d)` (which is always in the
 * browser's local timezone, not the tenant's).
 *
 * `monthIndex0`/`day` may be out of range (negative, or beyond the
 * month's length) - callers rely on this to do date arithmetic like
 * "7 days before the 3rd" without special-casing month/year rollover.
 * `Date.UTC` normalizes those per ECMA-262 before this ever builds a
 * wall-clock string, so the rollover is always correct.
 */
function zonedMidnight(
  year: number,
  monthIndex0: number,
  day: number,
  timezone: string,
): Date {
  const normalized = new Date(Date.UTC(year, monthIndex0, day));
  const pad = (n: number) => String(n).padStart(2, "0");
  const wallClock = `${normalized.getUTCFullYear()}-${pad(normalized.getUTCMonth() + 1)}-${pad(normalized.getUTCDate())}T00:00:00`;
  return zonedTimeToUtc(wallClock, timezone);
}

/**
 * [start of month, start of next month) for the month `monthsAgo` months
 * before `reference`, in `timezone`. monthsAgo=0 is the current month.
 */
export function monthBoundary(
  reference: Date,
  monthsAgo: number,
  timezone: string,
): PeriodBoundary {
  // Use the reference instant's wall-clock year/month *as seen in
  // `timezone`*, not the browser's local year/month.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
  }).formatToParts(reference);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month0 = Number(parts.find((p) => p.type === "month")?.value) - 1;

  const targetMonth0 = month0 - monthsAgo;
  const start = zonedMidnight(
    year,
    targetMonth0,
    1,
    timezone,
  );
  const endExclusive = zonedMidnight(
    year,
    targetMonth0 + 1,
    1,
    timezone,
  );
  return { startISO: start.toISOString(), endExclusiveISO: endExclusive.toISOString() };
}

/**
 * [start of the ISO week (Monday) containing `reference`, start of the
 * following day) is NOT what this returns - it returns [start of week,
 * start of next week) so "this week so far" queries stay correct as the
 * week progresses. Weeks are anchored to Monday to match the rest of the
 * app (see SmartDashboardOverview's own Monday-anchored week math).
 */
export function weekBoundary(reference: Date, timezone: string): PeriodBoundary {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(reference);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month0 = Number(parts.find((p) => p.type === "month")?.value) - 1;
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const weekdayShort = parts.find((p) => p.type === "weekday")?.value || "Mon";

  const weekdayIndex: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const offsetFromMonday = weekdayIndex[weekdayShort] ?? 0;

  const start = zonedMidnight(year, month0, day - offsetFromMonday, timezone);
  const endExclusive = zonedMidnight(year, month0, day - offsetFromMonday + 7, timezone);
  return { startISO: start.toISOString(), endExclusiveISO: endExclusive.toISOString() };
}

/**
 * [start of the day `daysAgo` days before `reference`, start of the
 * following day), in `timezone`. daysAgo=0 is today.
 */
export function dayBoundary(
  reference: Date,
  daysAgo: number,
  timezone: string,
): PeriodBoundary {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(reference);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month0 = Number(parts.find((p) => p.type === "month")?.value) - 1;
  const day = Number(parts.find((p) => p.type === "day")?.value);

  const start = zonedMidnight(year, month0, day - daysAgo, timezone);
  const endExclusive = zonedMidnight(year, month0, day - daysAgo + 1, timezone);
  return { startISO: start.toISOString(), endExclusiveISO: endExclusive.toISOString() };
}

/**
 * A rolling window covering the `days` days up to and including today, in
 * `timezone` - e.g. daysWindow(30, tz) for "the last 30 days" including
 * today, with an exclusive end at the start of tomorrow so today's rows
 * are never excluded.
 */
export function daysWindow(
  reference: Date,
  days: number,
  timezone: string,
): PeriodBoundary {
  const todayEnd = dayBoundary(reference, 0, timezone);
  const windowStart = dayBoundary(reference, days - 1, timezone);
  return { startISO: windowStart.startISO, endExclusiveISO: todayEnd.endExclusiveISO };
}

/**
 * [Jan 1, Jan 1 of the following year) for the year containing
 * `reference`, as seen in `timezone`.
 */
export function yearBoundary(reference: Date, timezone: string): PeriodBoundary {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(reference);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const start = zonedMidnight(year, 0, 1, timezone);
  const endExclusive = zonedMidnight(year + 1, 0, 1, timezone);
  return { startISO: start.toISOString(), endExclusiveISO: endExclusive.toISOString() };
}

/**
 * The calendar date (YYYY-MM-DD) that `instant` falls on in `timezone`.
 *
 * For filtering plain `date` columns (e.g. `expenses.date`), which hold a
 * wall-clock date, not an instant: passing a boundary's `startISO`
 * straight to a `date` column makes Postgres cast it via UTC, which in
 * UTC+3 lands on the previous day. Pair it with an exclusive upper bound:
 * `.gte(col, toZonedDateString(startISO, tz)).lt(col, toZonedDateString(endExclusiveISO, tz))`.
 */
export function toZonedDateString(instant: Date | string, timezone: string): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * The instant (UTC ISO) of local midnight, in `timezone`, at the start of
 * the calendar date `dateString` (YYYY-MM-DD) shifted by `offsetDays` -
 * for turning a date picked in the UI into a query boundary, e.g.
 * `zonedDateStartISO(end, tz, 1)` is the exclusive end of an inclusive
 * date range. Returns null for a malformed date string.
 */
export function zonedDateStartISO(
  dateString: string,
  timezone: string,
  offsetDays = 0,
): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;
  const [, year, month, day] = match;
  return zonedMidnight(
    Number(year),
    Number(month) - 1,
    Number(day) + offsetDays,
    timezone,
  ).toISOString();
}

/**
 * Whole days elapsed in the current month (counting today) and the total
 * days in it, in `timezone` - the inputs for a month-end run-rate
 * projection (`monthToDate / daysElapsed * daysInMonth`).
 */
export function monthProgress(
  reference: Date,
  timezone: string,
): { daysElapsed: number; daysInMonth: number } {
  const month = monthBoundary(reference, 0, timezone);
  const today = dayBoundary(reference, 0, timezone);
  const DAY_MS = 86_400_000;
  const monthStart = new Date(month.startISO).getTime();
  // Math.round absorbs a DST hour in timezones that observe it.
  const daysElapsed = Math.round(
    (new Date(today.endExclusiveISO).getTime() - monthStart) / DAY_MS,
  );
  const daysInMonth = Math.round(
    (new Date(month.endExclusiveISO).getTime() - monthStart) / DAY_MS,
  );
  return { daysElapsed, daysInMonth };
}
