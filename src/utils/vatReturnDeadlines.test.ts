import { describe, it, expect } from "vitest";
import { summarizeVatReturnDeadlines } from "./vatReturnDeadlines";

const TODAY = "2026-10-14";
const UNTIL = "2026-11-13";

describe("summarizeVatReturnDeadlines", () => {
  it("counts an unfiled draft past its due date as overdue, not upcoming", () => {
    const summary = summarizeVatReturnDeadlines(
      [{ status: "draft", due_date: "2026-07-28" }],
      TODAY,
      UNTIL,
    );
    expect(summary.overdue).toBe(1);
    expect(summary.upcoming).toBe(0);
  });

  it("does not count a rejected return as overdue before its due date", () => {
    const summary = summarizeVatReturnDeadlines(
      [{ status: "rejected", due_date: "2026-10-28" }],
      TODAY,
      UNTIL,
    );
    expect(summary.overdue).toBe(0);
    expect(summary.upcoming).toBe(1);
  });

  it("treats a return due today as upcoming, and one beyond the window as neither", () => {
    const summary = summarizeVatReturnDeadlines(
      [
        { status: "draft", due_date: TODAY },
        { status: "draft", due_date: "2026-12-28" },
      ],
      TODAY,
      UNTIL,
    );
    expect(summary.upcoming).toBe(1);
    expect(summary.overdue).toBe(0);
  });

  it("does not count filed returns as overdue or upcoming", () => {
    const summary = summarizeVatReturnDeadlines(
      [
        { status: "submitted", due_date: "2026-09-28", filed_date: "2026-09-20" },
        { status: "approved", due_date: "2026-10-28", filed_date: "2026-10-01" },
      ],
      TODAY,
      UNTIL,
    );
    expect(summary.overdue).toBe(0);
    expect(summary.upcoming).toBe(0);
  });

  it("computes the on-time filing rate over returns past their due date only", () => {
    const summary = summarizeVatReturnDeadlines(
      [
        { status: "submitted", due_date: "2026-08-28", filed_date: "2026-08-20" }, // on time
        { status: "submitted", due_date: "2026-09-28", filed_date: "2026-10-02" }, // late
        { status: "draft", due_date: "2026-07-28" }, // never filed
        { status: "draft", due_date: "2026-10-28" }, // not yet due - excluded
      ],
      TODAY,
      UNTIL,
    );
    expect(summary.pastDue).toBe(3);
    expect(summary.filedOnTime).toBe(1);
    expect(summary.onTimeFilingRate).toBe(33);
  });

  it("returns a null rate when nothing has reached its due date", () => {
    expect(
      summarizeVatReturnDeadlines([{ status: "draft", due_date: "2026-10-28" }], TODAY, UNTIL)
        .onTimeFilingRate,
    ).toBeNull();
    expect(summarizeVatReturnDeadlines([], TODAY, UNTIL).onTimeFilingRate).toBeNull();
  });

  it("falls back to the legacy filing_deadline column and ignores returns with no date", () => {
    const summary = summarizeVatReturnDeadlines(
      [{ status: "draft", filing_deadline: "2026-09-28" }, { status: "draft" }],
      TODAY,
      UNTIL,
    );
    expect(summary.overdue).toBe(1);
    expect(summary.pastDue).toBe(1);
  });
});
