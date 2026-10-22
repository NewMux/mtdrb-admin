import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("../supabaseClient", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

import { assignMemberPlan, fetchPlanMemberCounts, parsePlanAssignment, MembershipPlanError } from "./membershipPlans";

const good = {
  member_id: "m1", plan_id: "p1", plan_name: "Monthly",
  start_date: "2026-10-25", expiry_date: "2026-11-23", price: "20.500", renewed: true,
};

beforeEach(() => rpc.mockReset());

describe("parsePlanAssignment", () => {
  it("reads a valid answer", () => {
    expect(parsePlanAssignment(good)).toEqual({
      memberId: "m1", planId: "p1", planName: "Monthly",
      startDate: "2026-10-25", expiryDate: "2026-11-23", price: 20.5, renewed: true,
    });
  });

  it("refuses anything unexpected", () => {
    for (const bad of [null, "x", [], {}, { ...good, expiry_date: null }, { ...good, plan_id: 3 }]) {
      expect(() => parsePlanAssignment(bad)).toThrow(MembershipPlanError);
    }
  });

  it("treats a missing price as zero", () => {
    expect(parsePlanAssignment({ ...good, price: undefined, renewed: undefined })).toMatchObject({ price: 0, renewed: false });
  });
});

describe("assignMemberPlan", () => {
  it("sends the options the database expects", async () => {
    rpc.mockResolvedValue({ data: good, error: null });
    await assignMemberPlan("m1", "p1", { renew: true, price: 0 });
    expect(rpc).toHaveBeenCalledWith("assign_member_plan", {
      p_member_id: "m1", p_plan_id: "p1", p_renew: true, p_start: null, p_price: 0,
    });
  });

  it("defaults to a plain assignment from today at the plan's price", async () => {
    rpc.mockResolvedValue({ data: good, error: null });
    await assignMemberPlan("m1", "p1");
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_renew: false, p_start: null, p_price: null });
  });

  it("surfaces the database's message", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "This plan is not active" } });
    await expect(assignMemberPlan("m1", "p1")).rejects.toThrow("This plan is not active");
  });
});

describe("fetchPlanMemberCounts", () => {
  it("maps rows by plan id and ignores junk", async () => {
    rpc.mockResolvedValue({ data: [{ plan_id: "p1", members: "3" }, { plan_id: "p2", members: 1 }, null, { members: 9 }], error: null });
    expect(await fetchPlanMemberCounts()).toEqual({ p1: 3, p2: 1 });
  });

  it("returns nothing for an unexpected payload", async () => {
    rpc.mockResolvedValue({ data: { nope: true }, error: null });
    expect(await fetchPlanMemberCounts()).toEqual({});
  });
});
