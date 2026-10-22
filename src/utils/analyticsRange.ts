// Date ranges for the Analytics page: the selected range and the equally long
// range right before it, for "vs previous" comparisons.
//
// Browser-local calendar days (staff and gym share a timezone), as full instants
// for `.gte(start).lte(end)` filters on timestamptz columns:
//   * a range STARTS at 00:00:00.000 of its first day and ENDS at 23:59:59.999 of
//     its last day (or "now" for a range that includes today), so no day is cut
//     short. The old code passed bare date strings, which mean "midnight UTC at the
//     start of that day": today's rows were excluded and a custom end date lost
//     its whole last day.
//   * the previous range has exactly as many days as the current one.

export interface AnalyticsRange {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const endOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

/** "2026-11-03" is that day in the viewer's timezone, not midnight UTC (which new Date() would give). */
export const parseLocalDate = (value: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
};

/** YYYY-MM-DD for the viewer's local calendar day, for <input type="date"> values. */
export const toLocalDateString = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** The previous range: the same number of whole days, ending the day before `start`. */
const previousRange = (start: Date, days: number): Pick<AnalyticsRange, "previousStart" | "previousEnd"> => {
  const previousEnd = endOfDay(addDays(start, -1));
  const previousStart = startOfDay(addDays(previousEnd, -(days - 1)));
  return { previousStart, previousEnd };
};

export function resolveAnalyticsRange(
  rangeKey: string,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date(),
): AnalyticsRange {
  switch (rangeKey) {
    case "custom": {
      const start = startOfDay(customStart ? parseLocalDate(customStart) : now);
      const end = endOfDay(customEnd ? parseLocalDate(customEnd) : now);
      const days = Math.max(1, Math.round((startOfDay(end).getTime() - start.getTime()) / DAY_MS) + 1);
      return { start, end, ...previousRange(start, days) };
    }
    case "this-year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return {
        start,
        end: new Date(now),
        previousStart: new Date(now.getFullYear() - 1, 0, 1),
        previousEnd: endOfDay(new Date(now.getFullYear() - 1, 11, 31)),
      };
    }
    case "last-7-days":
    case "last-90-days":
    case "last-30-days":
    default: {
      const days = rangeKey === "last-7-days" ? 7 : rangeKey === "last-90-days" ? 90 : 30;
      const start = startOfDay(addDays(now, -(days - 1)));
      return { start, end: new Date(now), ...previousRange(start, days) };
    }
  }
}
