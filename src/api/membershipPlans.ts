// Client side of membership plans (supabase/migrations/20261025090000_membership_plans.sql).
// Dates and the plan arithmetic are done by the database in the gym's own calendar;
// this file only calls it and checks what comes back.

import { supabase } from "../supabaseClient";

export class MembershipPlanError extends Error {}

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
};

export interface ActivePlan {
  id: string;
  name: string;
  price: number;
  /** Days of access the plan gives. */
  duration: number;
}

export interface PlanAssignment {
  memberId: string;
  planId: string;
  planName: string;
  startDate: string;
  expiryDate: string;
  price: number;
  renewed: boolean;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Anything unexpected from the server is an error, never a half-filled result. */
export function parsePlanAssignment(data: unknown): PlanAssignment {
  if (
    !isRecord(data) ||
    typeof data.member_id !== "string" ||
    typeof data.plan_id !== "string" ||
    typeof data.plan_name !== "string" ||
    typeof data.start_date !== "string" ||
    typeof data.expiry_date !== "string"
  ) {
    throw new MembershipPlanError("Unexpected response from the server.");
  }
  const price = Number(data.price);
  return {
    memberId: data.member_id,
    planId: data.plan_id,
    planName: data.plan_name,
    startDate: data.start_date,
    expiryDate: data.expiry_date,
    price: Number.isFinite(price) ? price : 0,
    renewed: data.renewed === true,
  };
}

/** The plans a member can be put on: active ones, cheapest first. */
export async function listActivePlans(tenantId: string): Promise<ActivePlan[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, price, duration")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("price", { ascending: true });
  if (error) throw new MembershipPlanError(errorMessage(error));
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    duration: Number(row.duration) || 0,
  }));
}

export interface AssignOptions {
  /** Continue from the end of the paid period instead of starting today. */
  renew?: boolean;
  /** ISO date; defaults to today in the gym's timezone. */
  startDate?: string | null;
  /** Overrides the plan's price (a discount, or free). */
  price?: number | null;
}

export async function assignMemberPlan(
  memberId: string,
  planId: string,
  options: AssignOptions = {},
): Promise<PlanAssignment> {
  const { data, error } = await supabase.rpc("assign_member_plan", {
    p_member_id: memberId,
    p_plan_id: planId,
    p_renew: options.renew ?? false,
    p_start: options.startDate || null,
    p_price: options.price ?? null,
  } as never);
  if (error) throw new MembershipPlanError(errorMessage(error));
  return parsePlanAssignment(data);
}

/** Members currently on each plan, by plan id. */
export async function fetchPlanMemberCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("plan_member_counts" as never);
  if (error) throw new MembershipPlanError(errorMessage(error));
  const counts: Record<string, number> = {};
  for (const row of Array.isArray(data) ? data : []) {
    if (isRecord(row) && typeof row.plan_id === "string") counts[row.plan_id] = Number(row.members) || 0;
  }
  return counts;
}
