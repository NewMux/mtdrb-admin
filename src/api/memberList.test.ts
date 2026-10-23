import { beforeEach, describe, expect, it, vi } from "vitest";

// A query builder that records every call and resolves like PostgREST.
type Call = [string, ...unknown[]];
let calls: Call[] = [];
let result: { data: unknown; error: unknown; count: number | null } = { data: [], error: null, count: 0 };

function builder(): Record<string, unknown> {
  const b: Record<string, unknown> = {};
  for (const name of ["select", "eq", "or", "order", "range", "limit", "in", "gt", "gte", "lte"]) {
    b[name] = (...args: unknown[]) => {
      calls.push([name, ...args]);
      return b;
    };
  }
  b.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return b;
}
vi.mock("../supabaseClient", () => ({ supabase: { from: () => builder() } }));

import {
  MemberListError,
  fetchMemberCounts,
  fetchMemberPage,
  fetchRecentMembers,
  memberSearchClauses,
} from "./memberList";

const row = (over: Record<string, unknown> = {}) => ({
  id: "m1", first_name: "Ahmed", last_name: "Al-Mansoori", email: "a@x.dev", phone: "+973 1", status: "active",
  join_date: "2026-01-01", created_at: "2026-01-01T00:00:00Z", expiry_date: null, trainer_id: null,
  membership_type: "Standard", membership_status: "active", metadata: {}, ...over,
});
const newSince = { date: "2026-09-23", iso: "2026-09-23T00:00:00.000Z" };
const args = (name: string) => calls.filter((c) => c[0] === name).map((c) => c.slice(1));

beforeEach(() => {
  calls = [];
  result = { data: [], error: null, count: 0 };
});

describe("memberSearchClauses", () => {
  it("makes one clause per word, each matching name, email or phone", () => {
    expect(memberSearchClauses("ahmed mans")).toEqual([
      "first_name.ilike.%ahmed%,last_name.ilike.%ahmed%,email.ilike.%ahmed%,phone.ilike.%ahmed%",
      "first_name.ilike.%mans%,last_name.ilike.%mans%,email.ilike.%mans%,phone.ilike.%mans%",
    ]);
  });

  it("is empty for blank input", () => {
    expect(memberSearchClauses("   ")).toEqual([]);
    expect(memberSearchClauses("")).toEqual([]);
  });

  it("removes characters that would change the filter's meaning", () => {
    const clauses = memberSearchClauses('x),email.eq.a@b.co,(y "q" \\ 100% *');
    const joined = clauses.join("|");
    // Nothing the person typed can add a condition of its own.
    expect(joined).not.toMatch(/\)\s*,email\.eq/);
    for (const clause of clauses) {
      const outside = clause.replace(/%[^%,]*%/g, "");
      expect(outside).toBe("first_name.ilike.,last_name.ilike.,email.ilike.,phone.ilike.");
      expect(clause.split(",")).toHaveLength(4);
      expect(clause).not.toMatch(/[()"\\*]/);
    }
  });

  it("keeps emails and phone numbers searchable", () => {
    expect(memberSearchClauses("sara+gym@x.dev")[0]).toContain("%sara+gym@x.dev%");
    expect(memberSearchClauses("+973")[0]).toContain("phone.ilike.%+973%");
  });

  it("caps the number of words and the length", () => {
    expect(memberSearchClauses("a b c d e f g h")).toHaveLength(5);
    expect(memberSearchClauses("x".repeat(500))[0]).not.toContain("x".repeat(101));
  });
});

describe("fetchMemberPage", () => {
  it("asks for one page, in name order, scoped to the gym, and returns the total", async () => {
    result = { data: [row(), row({ id: "m2" })], error: null, count: 1234 };
    const page = await fetchMemberPage({ tenantId: "t1", page: 3, pageSize: 25, search: "", filter: "all", newSince });
    expect(args("eq")).toEqual([["tenant_id", "t1"]]);
    expect(args("select")).toEqual([["*", { count: "exact" }]]);
    expect(args("range")).toEqual([[50, 74]]);
    expect(args("order")).toEqual([["first_name", { ascending: true }], ["last_name", { ascending: true }], ["id", { ascending: true }]]);
    expect(page.total).toBe(1234);
    expect(page.rows).toHaveLength(2);
    expect(page.rows[0]).toMatchObject({ id: "m1", name: "Ahmed Al-Mansoori", planEnd: "" });
  });

  it("puts the search in the database, one condition per word", async () => {
    await fetchMemberPage({ tenantId: "t1", page: 1, pageSize: 10, search: "sara hass", filter: "all", newSince });
    expect(args("or")).toHaveLength(2);
  });

  it("filters by status and by 'new this month' in the database", async () => {
    await fetchMemberPage({ tenantId: "t1", page: 1, pageSize: 10, search: "", filter: "active", newSince });
    expect(args("eq")).toContainEqual(["status", "active"]);
    calls = [];
    await fetchMemberPage({ tenantId: "t1", page: 1, pageSize: 10, search: "", filter: "inactive", newSince });
    expect(args("eq")).toContainEqual(["status", "inactive"]);
    calls = [];
    await fetchMemberPage({ tenantId: "t1", page: 1, pageSize: 10, search: "", filter: "new", newSince });
    expect(args("or")).toEqual([["join_date.gte.2026-09-23,and(join_date.is.null,created_at.gte.2026-09-23T00:00:00.000Z)"]]);
  });

  it("clamps silly page sizes and pages", async () => {
    await fetchMemberPage({ tenantId: "t1", page: -4, pageSize: 99999, search: "", filter: "all", newSince });
    expect(args("range")).toEqual([[0, 199]]);
    calls = [];
    await fetchMemberPage({ tenantId: "t1", page: 2, pageSize: Number.NaN, search: "", filter: "all", newSince });
    expect(args("range")).toEqual([[10, 19]]);
  });

  it("raises the database's error", async () => {
    result = { data: null, error: { message: "boom" }, count: null };
    await expect(fetchMemberPage({ tenantId: "t1", page: 1, pageSize: 10, search: "", filter: "all", newSince })).rejects.toBeInstanceOf(MemberListError);
  });

  it("treats a missing count as zero", async () => {
    result = { data: null, error: null, count: null };
    expect(await fetchMemberPage({ tenantId: "t1", page: 1, pageSize: 10, search: "", filter: "all", newSince })).toEqual({ rows: [], total: 0 });
  });
});

describe("fetchRecentMembers", () => {
  it("returns the newest members first", async () => {
    result = { data: [row()], error: null, count: null };
    expect(await fetchRecentMembers("t1", 5)).toHaveLength(1);
    expect(args("order")[0]).toEqual(["created_at", { ascending: false }]);
    expect(args("limit")).toEqual([[5]]);
  });
});

describe("fetchMemberCounts", () => {
  it("runs head-only counts and maps them", async () => {
    result = { data: null, error: null, count: 7 };
    const counts = await fetchMemberCounts({ tenantId: "t1", newSince, previousMonthEnd: new Date("2026-09-30T20:59:59.999Z") });
    expect(counts).toEqual({ total: 7, active: 7, inactive: 7, newThisMonth: 7, previousTotal: 7, previousActive: 7 });
    // six counting queries, none downloading rows
    expect(args("select").every((a) => (a[1] as { head?: boolean }).head === true)).toBe(true);
    expect(args("select")).toHaveLength(6);
  });

  it("compares last month's end by its UTC date, as wasMemberActiveAsOf does", async () => {
    await fetchMemberCounts({ tenantId: "t1", newSince, previousMonthEnd: new Date("2026-09-30T20:59:59.999Z") });
    const ors = args("or").map((a) => a[0]);
    expect(ors).toContain("join_date.lte.2026-09-30,and(join_date.is.null,created_at.lte.2026-09-30T20:59:59.999Z)");
    expect(ors).toContain("expiry_date.is.null,expiry_date.gt.2026-09-30");
  });

  it("raises when any count fails", async () => {
    result = { data: null, error: { message: "denied" }, count: null };
    await expect(fetchMemberCounts({ tenantId: "t1", newSince, previousMonthEnd: new Date() })).rejects.toThrow("denied");
  });
});

// The counts above use date comparisons in the database in place of the instants
// wasMemberActiveAsOf() compares. They must agree for every join/expiry date and
// every instant, whatever the gym's timezone puts "end of last month" at.
describe("last month's counts agree with wasMemberActiveAsOf", () => {
  // The conditions fetchMemberCounts sends, evaluated in JS.
  const joinedByFilter = (m: { join_date: string | null; created_at: string | null }, asOf: Date) => {
    const asOfIso = asOf.toISOString();
    const asOfDate = asOfIso.slice(0, 10);
    if (m.join_date) return m.join_date <= asOfDate;
    return m.created_at !== null && new Date(m.created_at).toISOString() <= asOfIso;
  };
  const activeByFilter = (m: { join_date: string | null; created_at: string | null; expiry_date: string | null }, asOf: Date) =>
    joinedByFilter(m, asOf) && (m.expiry_date === null || m.expiry_date > asOf.toISOString().slice(0, 10));

  it("for a few hundred members and instants", async () => {
    const { wasMemberActiveAsOf } = await import("../utils/memberActivity");
    let seed = 12345;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const day = (offset: number) => new Date(Date.UTC(2026, 8, 1) + offset * 86_400_000).toISOString().slice(0, 10);
    for (let i = 0; i < 400; i++) {
      const m = {
        join_date: rand() < 0.2 ? null : day(Math.floor(rand() * 60) - 30),
        created_at: rand() < 0.1 ? null : new Date(Date.UTC(2026, 8, 1) + (rand() * 60 - 30) * 86_400_000).toISOString(),
        expiry_date: rand() < 0.4 ? null : day(Math.floor(rand() * 60) - 30),
      };
      // end of a month in timezones from UTC-12 to UTC+14
      const offsetHours = Math.floor(rand() * 27) - 12;
      const asOf = new Date(Date.UTC(2026, 8, 30, 23, 59, 59, 999) - offsetHours * 3_600_000);
      expect(activeByFilter(m, asOf)).toBe(wasMemberActiveAsOf(m, asOf));
    }
  });
});
