import { describe, it, expect } from "vitest";
import {
  GYM_EXPORT_TABLES,
  MEMBER_EXPORT_TABLES,
  exportFileName,
  exportGymData,
  exportMemberData,
  type ExportClient,
  type Row,
} from "./gymExport";

/** An in-memory database: table -> rows. Applies .eq() and .range() like PostgREST. */
function fakeClient(db: Record<string, Row[]>, failing: string[] = [], pageCap = 1000): ExportClient {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: string) => ({
          order: () => ({
            range: async (from: number, to: number) => {
              if (failing.includes(table)) return { data: null, error: { message: `${table} denied` } };
              const matching = (db[table] ?? []).filter((r) => r[column] === value);
              return { data: matching.slice(from, Math.min(to + 1, from + pageCap)), error: null };
            },
          }),
        }),
      }),
    }),
  };
}

const T = "tenant-1";
const NOW = new Date("2026-10-24T08:00:00Z");

describe("export table lists", () => {
  it("never include the platform's internal tables", () => {
    for (const internal of ["platform_audit_log", "platform_suspensions", "legacy_unbilled_tenants", "platform_admins"]) {
      expect(GYM_EXPORT_TABLES).not.toContain(internal);
    }
  });
  it("have no duplicates", () => {
    expect(new Set(GYM_EXPORT_TABLES).size).toBe(GYM_EXPORT_TABLES.length);
    expect(new Set(MEMBER_EXPORT_TABLES).size).toBe(MEMBER_EXPORT_TABLES.length);
  });
});

describe("exportGymData", () => {
  it("reads every table for this gym only", async () => {
    const db = {
      members: [
        { id: "m1", tenant_id: T, first_name: "Ann" },
        { id: "m2", tenant_id: "other", first_name: "Bob" },
      ],
      invoices: [{ id: "i1", tenant_id: T, amount: 10 }],
    };
    const doc = await exportGymData(fakeClient(db), T, undefined, NOW);
    expect(doc).toMatchObject({ format: "mtdrb-gym-export", version: 1, tenant_id: T, exported_at: NOW.toISOString(), errors: {} });
    expect(doc.tables.members).toEqual([{ id: "m1", tenant_id: T, first_name: "Ann" }]);
    expect(doc.tables.invoices).toHaveLength(1);
    expect(Object.keys(doc.tables).sort()).toEqual([...GYM_EXPORT_TABLES].sort());
  });

  it("pages past the 1000-row cap", async () => {
    const rows = Array.from({ length: 2300 }, (_, i) => ({ id: `a${i}`, tenant_id: T }));
    const doc = await exportGymData(fakeClient({ attendance_events: rows }), T, undefined, NOW);
    expect(doc.tables.attendance_events).toHaveLength(2300);
  });

  it("records a table it could not read instead of hiding it", async () => {
    const doc = await exportGymData(fakeClient({ members: [{ id: "m1", tenant_id: T }] }, ["invoices"]), T, undefined, NOW);
    expect(doc.errors).toEqual({ invoices: "invoices denied" });
    expect(doc.tables.invoices).toBeUndefined();
    expect(doc.tables.members).toHaveLength(1);
  });

  it("reports progress for every table", async () => {
    const seen: number[] = [];
    await exportGymData(fakeClient({}), T, (done, total) => seen.push(done / total), NOW);
    expect(seen).toHaveLength(GYM_EXPORT_TABLES.length);
    expect(seen.at(-1)).toBe(1);
  });
});

describe("exportMemberData", () => {
  const db = {
    members: [
      { id: "m1", tenant_id: T, first_name: "Ann", email: "ann@x.dev" },
      { id: "m9", tenant_id: "other", first_name: "Zed" },
    ],
    invoices: [
      { id: "i1", tenant_id: T, member_id: "m1" },
      { id: "i2", tenant_id: T, member_id: "m2" },
    ],
    pos_sales: [{ id: "s1", tenant_id: T, member_id: "m1" }],
    pos_sale_items: [
      { id: "si1", tenant_id: T, sale_id: "s1" },
      { id: "si2", tenant_id: T, sale_id: "s2" },
    ],
    class_bookings: [{ id: "b1", tenant_id: "other", member_id: "m1" }],
  };

  it("collects the member's record and the rows that point at them, and nothing else", async () => {
    const doc = await exportMemberData(fakeClient(db), T, "m1", NOW);
    expect(doc.member).toMatchObject({ id: "m1", email: "ann@x.dev" });
    expect(doc.tables.invoices).toEqual([{ id: "i1", tenant_id: T, member_id: "m1" }]);
    expect(doc.tables.pos_sale_items).toEqual([{ id: "si1", tenant_id: T, sale_id: "s1" }]);
    expect(doc.errors).toEqual({});
  });

  it("never returns another gym's rows even if the database handed them back", async () => {
    const doc = await exportMemberData(fakeClient(db), T, "m1", NOW);
    expect(doc.tables.class_bookings).toEqual([]);
    const foreign = await exportMemberData(fakeClient(db), T, "m9", NOW);
    expect(foreign.member).toBeNull();
  });

  it("records failures", async () => {
    const doc = await exportMemberData(fakeClient(db, ["class_waitlist"]), T, "m1", NOW);
    expect(doc.errors).toEqual({ class_waitlist: "class_waitlist denied" });
  });
});

describe("exportFileName", () => {
  it("is dated and typed", () => {
    expect(exportFileName("gym", NOW)).toBe("mtdrb-gym-export-2026-10-24.json");
    expect(exportFileName("member", NOW)).toBe("mtdrb-member-export-2026-10-24.json");
  });
});
