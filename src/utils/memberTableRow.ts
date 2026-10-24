import type { Database } from "../types/supabase";
import type { Member } from "../types/member";
import { toLocalDateString } from "./analyticsRange";

export type MemberRow = Database["public"]["Tables"]["members"]["Row"];

// Shape of the application-specific data stored in members.metadata (jsonb)
export interface MemberRowMetadata {
  gender?: string;
  age?: number;
  last_check_in?: string;
  check_in_count?: number;
  membership_price?: number | string;
  forms_submitted?: string[];
  is_trial?: boolean;
  attendance?: string[];
  tags?: string[];
  fitness_goal?: string;
  membership_type?: string;
}

// The shape the members table renders.
export type TableMember = Member & {
  id: string;
  name: string;
  phone: string;
  age?: number;
  gender: "Male" | "Female" | "Other";
  joinDate: string;
  /** "" = no expiry date recorded. */
  planEnd: string;
  /** "" = no check-in recorded. */
  lastCheckIn: string;
  checkInCount: number;
  status: "active" | "inactive" | "suspended" | "expired" | "trial";
  membershipPrice?: number;
  formsSubmitted: string[];
  isTrial: boolean;
  attendance: string[];
  tags: string[];
  assignedTrainerId?: string;
  fitnessGoal?: string;
};

/** A members row as the table shows it. Missing data stays missing: nothing is invented. */
export function toTableMember(m: MemberRow): TableMember {
  const metadata = (m.metadata as MemberRowMetadata | null | undefined) ?? {};
  const rawStatus = String(m.status);
  const status: TableMember["status"] =
    rawStatus === "active"
      ? "active"
      : rawStatus === "inactive"
        ? "inactive"
        : rawStatus === "suspended"
          ? "suspended"
          : rawStatus === "trial"
            ? "trial"
            : "expired";
  return {
    id: m.id,
    name: `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email,
    email: m.email,
    phone: m.phone || "",
    age: metadata.age,
    gender: (["Male", "Female", "Other"].includes(metadata.gender ?? "")
      ? metadata.gender
      : "Other") as "Male" | "Female" | "Other",
    joinDate:
      m.join_date ||
      (m.created_at ? toLocalDateString(new Date(m.created_at)) : "") ||
      toLocalDateString(new Date()),
    planEnd: m.expiry_date || "", // "" = no expiry date recorded
    lastCheckIn: metadata.last_check_in || "", // "" = no check-in recorded
    checkInCount: metadata.check_in_count || 0,
    status,
    membershipPrice: parseFloat(String(metadata.membership_price ?? "")) || undefined,
    formsSubmitted: metadata.forms_submitted || [],
    isTrial: metadata.is_trial || false,
    attendance: metadata.attendance || [],
    tags: metadata.tags || [],
    assignedTrainerId: m.trainer_id || undefined,
    fitnessGoal: metadata.fitness_goal || undefined,
    membership_type: m.membership_type || metadata.membership_type,
    membership_status: m.membership_status as Member["membership_status"],
  };
}
