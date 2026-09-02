import { describe, expect, it } from "vitest";
import {
  validateDateRange,
  formatDateForTimezone,
  validateDateInput,
} from "./dateValidation";

describe("validateDateRange", () => {
  it("returns UTC yyyy-MM-dd strings for a valid range", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const end = new Date("2024-01-31T00:00:00Z");
    expect(validateDateRange(start, end)).toEqual({
      start: "2024-01-01",
      end: "2024-01-31",
    });
  });

  it("accepts a range where start and end are the same instant", () => {
    const date = new Date("2024-01-15T00:00:00Z");
    expect(validateDateRange(date, date)).toEqual({
      start: "2024-01-15",
      end: "2024-01-15",
    });
  });

  it("throws when the start date is after the end date", () => {
    const start = new Date("2024-02-01T00:00:00Z");
    const end = new Date("2024-01-01T00:00:00Z");
    expect(() => validateDateRange(start, end)).toThrow(
      "Start date must be before end date",
    );
  });

  it("throws when the end date is in the future", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const farFuture = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(() => validateDateRange(start, farFuture)).toThrow(
      "End date cannot be in the future",
    );
  });

  it("converts a local-time date to its correct UTC calendar day", () => {
    // A date constructed with an explicit negative offset that rolls the UTC
    // day backward - this is exactly the kind of off-by-one a timezone bug
    // would silently get wrong in a billing/report date-range filter.
    const start = new Date("2024-03-10T23:30:00-05:00"); // 2024-03-11T04:30:00Z
    const end = new Date("2024-03-10T23:30:00-05:00");
    expect(validateDateRange(start, end)).toEqual({
      start: "2024-03-11",
      end: "2024-03-11",
    });
  });
});

describe("formatDateForTimezone", () => {
  it("formats a date in UTC by default", () => {
    const date = new Date("2024-06-15T12:34:56Z");
    expect(formatDateForTimezone(date)).toBe("2024-06-15 12:34:56");
  });

  it("formats a date in a named timezone", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    expect(formatDateForTimezone(date, "America/New_York")).toBe(
      "2024-06-15 08:00:00",
    );
  });
});

describe("validateDateInput", () => {
  it("parses a valid ISO date string", () => {
    const result = validateDateInput("2024-01-01T00:00:00Z");
    expect(result.getTime()).toBe(new Date("2024-01-01T00:00:00Z").getTime());
  });

  it("throws for an unparsable date string", () => {
    expect(() => validateDateInput("not-a-date")).toThrow(
      "Invalid date format",
    );
  });

  it("throws for an empty string", () => {
    expect(() => validateDateInput("")).toThrow("Invalid date format");
  });
});
