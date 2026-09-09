import { describe, it, expect } from "vitest";
import {
  wasMemberActiveAsOf,
  countMembersActiveAsOf,
  isMemberCurrentlyActive,
} from "./memberActivity";

describe("wasMemberActiveAsOf", () => {
  it("is true for a member who joined before the date and has no expiry", () => {
    expect(
      wasMemberActiveAsOf(
        { join_date: "2026-01-01", expiry_date: null },
        new Date("2026-06-01"),
      ),
    ).toBe(true);
  });

  it("is false for a member who joins after the date", () => {
    expect(
      wasMemberActiveAsOf(
        { join_date: "2026-07-01" },
        new Date("2026-06-01"),
      ),
    ).toBe(false);
  });

  it("is false once expiry_date is before the date", () => {
    expect(
      wasMemberActiveAsOf(
        { join_date: "2026-01-01", expiry_date: "2026-05-01" },
        new Date("2026-06-01"),
      ),
    ).toBe(false);
  });

  it("is true when expiry_date is on or after the date", () => {
    expect(
      wasMemberActiveAsOf(
        { join_date: "2026-01-01", expiry_date: "2026-06-01" },
        new Date("2026-06-01"),
      ),
    ).toBe(true);
  });

  it("falls back to created_at when join_date is missing", () => {
    expect(
      wasMemberActiveAsOf(
        { created_at: "2026-01-01T00:00:00Z" },
        new Date("2026-06-01"),
      ),
    ).toBe(true);
  });

  it("is false when neither join_date nor created_at is present", () => {
    expect(wasMemberActiveAsOf({}, new Date("2026-06-01"))).toBe(false);
  });
});

describe("countMembersActiveAsOf", () => {
  it("counts only members active as of the given date - not a mix of unrelated populations", () => {
    const members = [
      { join_date: "2025-01-01", expiry_date: null }, // still active
      { join_date: "2026-07-01", expiry_date: null }, // joined after the date
      { join_date: "2025-01-01", expiry_date: "2026-01-01" }, // expired before the date
    ];
    expect(countMembersActiveAsOf(members, new Date("2026-06-01"))).toBe(1);
  });

  it("does not conflate 'signed up in a period' with 'active as of a date' (the historical bug)", () => {
    // 500 long-tenured members, 10 who joined very recently. The bug being
    // fixed compared "500 active now" against "10 who signed up last
    // month" and reported a ~4900% swing. The correct comparison is
    // "active now" (510) vs "active as of last month" (500) - a sane 2%.
    const longTenured = Array.from({ length: 500 }, () => ({
      join_date: "2020-01-01",
      expiry_date: null,
    }));
    const recentSignups = Array.from({ length: 10 }, () => ({
      join_date: "2026-08-15",
      expiry_date: null,
    }));
    const allMembers = [...longTenured, ...recentSignups];

    const activeNow = countMembersActiveAsOf(allMembers, new Date("2026-09-01"));
    const activeLastMonthEnd = countMembersActiveAsOf(allMembers, new Date("2026-07-31"));

    expect(activeNow).toBe(510);
    expect(activeLastMonthEnd).toBe(500);
  });
});

describe("isMemberCurrentlyActive", () => {
  it("is true only for status 'active'", () => {
    expect(isMemberCurrentlyActive({ status: "active" })).toBe(true);
    expect(isMemberCurrentlyActive({ status: "Active" })).toBe(true);
  });

  it("is false for every other status", () => {
    expect(isMemberCurrentlyActive({ status: "inactive" })).toBe(false);
    expect(isMemberCurrentlyActive({ status: "expired" })).toBe(false);
    expect(isMemberCurrentlyActive({ status: null })).toBe(false);
    expect(isMemberCurrentlyActive({})).toBe(false);
  });
});
