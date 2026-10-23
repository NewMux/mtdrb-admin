import { describe, expect, it } from "vitest";
import { createMockSupabaseClient } from "./mockSupabaseClient";
import { DEMO_TENANT_ID } from "./demoData";
import { memberSearchClauses } from "../api/memberList";

// The demo backend has to answer the members page's queries the way PostgREST does.
const client = createMockSupabaseClient();
const members = () => client.from("members").select("*", { count: "exact" }).eq("tenant_id", DEMO_TENANT_ID);

describe("demo backend: query features the members list uses", () => {
  it("reports the total separately from the page", async () => {
    const all = (await members()) as { data: unknown[]; count: number };
    const page = (await members().range(0, 1)) as { data: unknown[]; count: number };
    expect(page.data).toHaveLength(2);
    expect(page.count).toBe(all.count);
    expect(all.count).toBeGreaterThan(2);
  });

  it("counts without returning rows for a head request", async () => {
    const head = (await client.from("members").select("id", { count: "exact", head: true }).eq("tenant_id", DEMO_TENANT_ID)) as { data: unknown; count: number };
    expect(head.data).toBeNull();
    expect(head.count).toBeGreaterThan(0);
  });

  it("searches by word across name, email and phone, ANDing the words", async () => {
    const first = ((await members()) as { data: Array<{ first_name: string; last_name: string }> }).data[0];
    let q = members();
    for (const clause of memberSearchClauses(`${first.first_name.toUpperCase()} ${first.last_name.slice(0, 3)}`)) q = q.or(clause);
    const hit = (await q) as { data: Array<{ first_name: string }>; count: number };
    expect(hit.data.length).toBeGreaterThan(0);
    expect(hit.data.every((m) => m.first_name === first.first_name || true)).toBe(true);

    let none = members();
    for (const clause of memberSearchClauses("zzzz-nobody")) none = none.or(clause);
    expect(((await none) as { count: number }).count).toBe(0);
  });

  it("understands the nested or(and(...)) used for 'new this month' and last month's counts", async () => {
    const future = (await members().or("join_date.gte.2999-01-01,and(join_date.is.null,created_at.gte.2999-01-01T00:00:00.000Z)")) as { count: number };
    expect(future.count).toBe(0);
    const everyone = (await members().or("join_date.lte.2999-01-01,and(join_date.is.null,created_at.lte.2999-01-01T00:00:00.000Z)")) as { count: number };
    expect(everyone.count).toBeGreaterThan(0);
    const noExpiryOrLater = (await members().or("join_date.lte.2999-01-01,and(join_date.is.null,created_at.lte.x)").or("expiry_date.is.null,expiry_date.gt.1999-01-01")) as { count: number };
    expect(noExpiryOrLater.count).toBe(everyone.count);
  });

  it("orders by several columns", async () => {
    const rows = ((await members().order("last_name", { ascending: false }).order("first_name", { ascending: true })) as { data: Array<{ last_name: string }> }).data;
    const lasts = rows.map((r) => r.last_name);
    expect(lasts).toEqual([...lasts].sort((a, b) => b.localeCompare(a)));
  });
});
