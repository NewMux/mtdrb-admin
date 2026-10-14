// Deadline status for VAT returns, derived from each return's due date
// compared against today - not from its workflow status. (Previously
// "overdue" meant status === "rejected" and "upcoming" meant
// status === "draft", so a draft three months past its deadline counted
// as "upcoming" and a compliance score was invented from the rejected
// count.)

/** Statuses meaning the return has been filed with the tax authority. */
const FILED_STATUSES = new Set(["submitted", "approved"]);

export interface VatReturnDeadlineInput {
  status?: string | null;
  due_date?: string | null;
  /** Legacy column some older rows were written with instead of due_date. */
  filing_deadline?: string | null;
  filed_date?: string | null;
}

export interface VatReturnDeadlineSummary {
  /** Not yet filed, and the due date is before today. */
  overdue: number;
  /** Not yet filed, due today or within the upcoming window. */
  upcoming: number;
  /** Returns whose due date is before today (filed or not). */
  pastDue: number;
  /** Of `pastDue`, those filed on or before their due date. */
  filedOnTime: number;
  /**
   * filedOnTime / pastDue as a whole percentage, or null when no return
   * has reached its due date yet (there is nothing to measure).
   */
  onTimeFilingRate: number | null;
}

/** First 10 chars of a date or timestamp string (YYYY-MM-DD), or null. */
const toDateOnly = (value?: string | null): string | null =>
  value && value.length >= 10 ? value.slice(0, 10) : null;

/**
 * @param today            Today's date as YYYY-MM-DD in the gym's timezone.
 * @param upcomingUntil    Exclusive end (YYYY-MM-DD) of the "upcoming" window.
 *
 * Dates are compared as YYYY-MM-DD strings, which order correctly
 * lexicographically. Returns with no due date are ignored.
 */
export function summarizeVatReturnDeadlines(
  returns: VatReturnDeadlineInput[],
  today: string,
  upcomingUntil: string,
): VatReturnDeadlineSummary {
  let overdue = 0;
  let upcoming = 0;
  let pastDue = 0;
  let filedOnTime = 0;

  for (const vatReturn of returns) {
    const dueDate = toDateOnly(vatReturn.due_date) ?? toDateOnly(vatReturn.filing_deadline);
    if (!dueDate) continue;

    const filed = FILED_STATUSES.has((vatReturn.status || "").toLowerCase());
    const filedDate = toDateOnly(vatReturn.filed_date);

    if (dueDate < today) {
      pastDue += 1;
      if (!filed) {
        overdue += 1;
      } else if (filedDate && filedDate <= dueDate) {
        filedOnTime += 1;
      }
    } else if (!filed && dueDate < upcomingUntil) {
      upcoming += 1;
    }
  }

  return {
    overdue,
    upcoming,
    pastDue,
    filedOnTime,
    onTimeFilingRate: pastDue > 0 ? Math.round((filedOnTime / pastDue) * 100) : null,
  };
}
