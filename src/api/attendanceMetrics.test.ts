import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../supabaseClient", () => ({ supabase: {} }));

import { getAttendanceMetrics } from "./attendance";

// Local-time constructors on purpose: "today" is the local calendar day, and the
// assertions must hold whatever timezone the tests run in.
const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
const event = (member_id: string, direction: "check_in" | "check_out", occurred_at: string) =>
  ({ member_id, direction, occurred_at }) as unknown as Parameters<typeof getAttendanceMetrics>[0][number];

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("getAttendanceMetrics - what counts as today", () => {
  it("counts an event from 00:30 local as today at 01:30 local (UTC would call it yesterday in UTC+3)", () => {
    vi.setSystemTime(new Date(2026, 10, 3, 1, 30));
    const metrics = getAttendanceMetrics([event("a", "check_in", at(2026, 11, 3, 0, 30))]);
    expect(metrics.checkInsToday).toBe(1);
    expect(metrics.eventsToday).toBe(1);
  });

  it("does not count 23:30 local the evening before", () => {
    vi.setSystemTime(new Date(2026, 10, 3, 1, 30));
    const metrics = getAttendanceMetrics([event("a", "check_in", at(2026, 11, 2, 23, 30))]);
    expect(metrics.checkInsToday).toBe(0);
    expect(metrics.eventsToday).toBe(0);
  });

  it("counts check-ins, check-outs and unique members for the local day", () => {
    vi.setSystemTime(new Date(2026, 10, 3, 18, 0));
    const metrics = getAttendanceMetrics([
      event("a", "check_out", at(2026, 11, 3, 17)),
      event("b", "check_in", at(2026, 11, 3, 16)),
      event("a", "check_in", at(2026, 11, 3, 9)),
      event("a", "check_in", at(2026, 11, 3, 8)),
      event("c", "check_in", at(2026, 11, 2, 20)),
    ]);
    expect(metrics.checkInsToday).toBe(3);
    expect(metrics.checkOutsToday).toBe(1);
    expect(metrics.uniqueMembersToday).toBe(2);
  });

  it("currentlyInGym uses each member's latest event (events arrive newest first)", () => {
    vi.setSystemTime(new Date(2026, 10, 3, 18, 0));
    const metrics = getAttendanceMetrics([
      event("a", "check_out", at(2026, 11, 3, 17)),
      event("b", "check_in", at(2026, 11, 3, 16)),
      event("a", "check_in", at(2026, 11, 3, 9)),
    ]);
    expect(metrics.currentlyInGym).toBe(1);
  });
});

describe("getAttendanceMetrics - which events count", () => {
  const withStatus = (member_id: string, direction: "check_in" | "check_out", occurred_at: string, status: string) =>
    ({ member_id, direction, occurred_at, status }) as unknown as Parameters<typeof getAttendanceMetrics>[0][number];

  it("ignores refused scans and double taps", () => {
    vi.setSystemTime(new Date(2026, 10, 3, 18, 0));
    const metrics = getAttendanceMetrics([
      withStatus("a", "check_in", at(2026, 11, 3, 17), "rejected"),
      withStatus("b", "check_in", at(2026, 11, 3, 16, 1), "duplicate"),
      withStatus("b", "check_in", at(2026, 11, 3, 16), "accepted"),
    ]);
    expect(metrics.eventsToday).toBe(1);
    expect(metrics.checkInsToday).toBe(1);
    expect(metrics.uniqueMembersToday).toBe(1);
    expect(metrics.currentlyInGym).toBe(1);
  });

  it("a refused exit scan does not mark someone as having left", () => {
    vi.setSystemTime(new Date(2026, 10, 3, 18, 0));
    const metrics = getAttendanceMetrics([
      withStatus("a", "check_out", at(2026, 11, 3, 17), "rejected"),
      withStatus("a", "check_in", at(2026, 11, 3, 9), "accepted"),
    ]);
    expect(metrics.currentlyInGym).toBe(1);
  });
});
