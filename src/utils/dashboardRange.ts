// The current and previous periods behind the dashboard's week / month /
// quarter / year switch. Browser-local calendar arithmetic (staff and gym share
// a timezone). Both ranges are meant for inclusive `.gte(start).lte(end)`
// filters on timestamptz columns using full instants, so each END is the last
// millisecond of its final day - a range that ended at midnight at the START of
// its last day would leave that whole day out.

/**
 * Calculate date ranges based on time range selection
 */
export type DashboardTimeRange = "week" | "month" | "quarter" | "year";

export const getDateRange = (
  timeRange: DashboardTimeRange,
  now: Date = new Date(),
): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
} => {
  let currentStart: Date;
  let currentEnd: Date = new Date(now);
  let previousStart: Date;
  let previousEnd: Date;

  switch (timeRange) {
    case "week": {
      // Current week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      currentStart = new Date(now.getFullYear(), now.getMonth(), diff);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + 6);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous week
      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 6);
      break;
    }
    case "month": {
      // Current month
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now);

      // Previous month
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    }
    case "quarter": {
      // Current quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
      currentEnd = new Date(now);

      // Previous quarter
      const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
      const prevYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
      previousEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
      previousStart = new Date(prevYear, prevQuarter * 3, 1);
      break;
    }
    case "year": {
      // Current year
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = new Date(now);

      // Previous year
      previousEnd = new Date(now.getFullYear(), 0, 0);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      break;
    }
  }

  // previousEnd above is midnight at the START of the previous period's last
  // day; the range is used with an inclusive upper bound, so move it to the
  // end of that day or the whole last day would be left out.
  previousEnd.setHours(23, 59, 59, 999);

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
};

