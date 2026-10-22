import { describe, expect, it } from "vitest";
import { createMockSupabaseClient } from "./mockSupabaseClient";
import { DEMO_PLANS } from "./demoData";

// The demo backend has to give the plan screens answers they accept.
describe("demo backend: membership plans", () => {
  const client = createMockSupabaseClient();

  it("answers assign_member_plan with a valid assignment", async () => {
    const { data, error } = await client.rpc("assign_member_plan", {
      p_member_id: "m1", p_plan_id: DEMO_PLANS[0].id, p_renew: false, p_start: "2026-10-01", p_price: null, p_invoice: true,
    });
    expect(error).toBeNull();
    expect(data).toMatchObject({ plan_name: DEMO_PLANS[0].name, start_date: "2026-10-01", expiry_date: "2026-10-30", invoice_id: "demo-invoice" });
  });

  it("makes no invoice for a free plan or when switched off, and refuses an unknown plan", async () => {
    expect((await client.rpc("assign_member_plan", { p_plan_id: DEMO_PLANS[0].id, p_price: 0 })).data).toMatchObject({ invoice_id: null });
    expect((await client.rpc("assign_member_plan", { p_plan_id: DEMO_PLANS[0].id, p_invoice: false })).data).toMatchObject({ invoice_id: null });
    expect((await client.rpc("assign_member_plan", { p_plan_id: "nope" })).error?.code).toBe("P0002");
  });

  it("answers plan_member_counts per plan", async () => {
    const { data } = await client.rpc("plan_member_counts");
    expect(data).toHaveLength(DEMO_PLANS.length);
    expect(data).toContainEqual({ plan_id: DEMO_PLANS[0].id, members: DEMO_PLANS[0].members_count });
  });
});
