import { supabase } from "../supabaseClient";
import type { Database, Json } from "../types/supabase";

export type AttendanceEvent = Database["public"]["Tables"]["attendance_events"]["Row"];
export type AttendanceDevice = Database["public"]["Tables"]["attendance_devices"]["Row"];
export type AttendanceConnector = Database["public"]["Tables"]["attendance_connectors"]["Row"];
export type MemberRow = Database["public"]["Tables"]["members"]["Row"];
export type BranchRow = Database["public"]["Tables"]["branches"]["Row"];

export type AttendanceMethod = AttendanceEvent["method"];
export type AttendanceDirection = AttendanceEvent["direction"];
export type AttendanceSourceType = AttendanceEvent["source_type"];

export interface AttendanceEventView extends AttendanceEvent {
  member_name: string;
  member_email: string;
  branch_name: string;
}

export interface RecordAttendanceInput {
  tenantId: string;
  memberId: string;
  branchId?: string | null;
  method: AttendanceMethod;
  sourceType?: AttendanceSourceType;
  direction?: AttendanceDirection;
  externalEventId?: string;
  occurredAt?: string;
  deviceId?: string | null;
  connectorId?: string | null;
  metadata?: Record<string, Json | undefined>;
}

export interface RecordAttendanceResult {
  data: AttendanceEvent;
  duplicate: boolean;
}

export interface AttendanceSnapshot {
  events: AttendanceEventView[];
  members: MemberRow[];
  branches: BranchRow[];
  devices: AttendanceDevice[];
  connectors: AttendanceConnector[];
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
};

const buildMemberName = (member?: Pick<MemberRow, "first_name" | "last_name" | "email">) =>
  `${member?.first_name ?? ""} ${member?.last_name ?? ""}`.trim() || member?.email || "Unknown member";

/**
 * Load the records required by the attendance dashboard in one tenant-scoped snapshot.
 */
export async function fetchAttendanceSnapshot(
  tenantId: string,
  limit = 50,
): Promise<AttendanceSnapshot> {
  const [eventsResponse, membersResponse, branchesResponse, devicesResponse, connectorsResponse] =
    await Promise.all([
      supabase
        .from("attendance_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("occurred_at", { ascending: false })
        .limit(limit),
      supabase
        .from("members")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("first_name", { ascending: true }),
      supabase
        .from("branches")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true }),
      supabase
        .from("attendance_devices")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
      supabase
        .from("attendance_connectors")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
    ]);

  const responseErrors = [
    eventsResponse.error,
    membersResponse.error,
    branchesResponse.error,
    devicesResponse.error,
    connectorsResponse.error,
  ].filter(Boolean);

  if (responseErrors.length > 0) {
    throw new Error(responseErrors.map(getErrorMessage).join("; "));
  }

  const members = (membersResponse.data ?? []) as MemberRow[];
  const branches = (branchesResponse.data ?? []) as BranchRow[];
  const devices = (devicesResponse.data ?? []) as AttendanceDevice[];
  const connectors = (connectorsResponse.data ?? []) as AttendanceConnector[];
  const memberById = new Map(members.map((member) => [member.id, member]));
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  const events = ((eventsResponse.data ?? []) as AttendanceEvent[]).map((event) => ({
    ...event,
    member_name: buildMemberName(memberById.get(event.member_id)),
    member_email: memberById.get(event.member_id)?.email ?? "",
    branch_name: branchById.get(event.branch_id ?? "")?.name ?? "Unassigned branch",
  }));

  return { events, members, branches, devices, connectors };
}

/**
 * Record one check-in/check-out event. A stable external ID makes retries safe.
 */
export async function recordAttendanceEvent(
  input: RecordAttendanceInput,
): Promise<RecordAttendanceResult> {
  const externalEventId = input.externalEventId ?? `web-${crypto.randomUUID()}`;

  const { data: existing, error: existingError } = await supabase
    .from("attendance_events")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("external_event_id", externalEventId)
    .maybeSingle();

  if (existingError) throw new Error(getErrorMessage(existingError));
  if (existing) {
    return { data: existing as AttendanceEvent, duplicate: true };
  }

  const payload: Database["public"]["Tables"]["attendance_events"]["Insert"] = {
    tenant_id: input.tenantId,
    branch_id: input.branchId ?? null,
    member_id: input.memberId,
    connector_id: input.connectorId ?? null,
    device_id: input.deviceId ?? null,
    external_event_id: externalEventId,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    direction: input.direction ?? "check_in",
    method: input.method,
    source_type: input.sourceType ?? "web",
    status: "accepted",
    metadata: input.metadata ?? {},
  };

  const { data, error } = await supabase
    .from("attendance_events")
    .insert(payload)
    .select("*")
    .single();

  if (!error && data) {
    return { data: data as AttendanceEvent, duplicate: false };
  }

  if (error && error.code === "23505") {
    const { data: duplicate } = await supabase
      .from("attendance_events")
      .select("*")
      .eq("tenant_id", input.tenantId)
      .eq("external_event_id", externalEventId)
      .single();
    if (duplicate) return { data: duplicate as AttendanceEvent, duplicate: true };
  }

  throw new Error(getErrorMessage(error ?? new Error("Attendance event was not created")));
}

export async function fetchMemberAttendanceHistory(
  tenantId: string,
  memberId: string,
  limit = 25,
): Promise<AttendanceEvent[]> {
  const { data, error } = await supabase
    .from("attendance_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("member_id", memberId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(getErrorMessage(error));
  return (data ?? []) as AttendanceEvent[];
}

export function getAttendanceMetrics(events: AttendanceEvent[]) {
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((event) => event.occurred_at.slice(0, 10) === today);
  const checkIns = todayEvents.filter((event) => event.direction === "check_in");
  const checkOuts = todayEvents.filter((event) => event.direction === "check_out");
  const uniqueMembersToday = new Set(checkIns.map((event) => event.member_id));
  const latestEventByMember = new Map<string, AttendanceEvent>();

  for (const event of events) {
    if (!latestEventByMember.has(event.member_id)) {
      latestEventByMember.set(event.member_id, event);
    }
  }

  const currentlyInGym = [...latestEventByMember.values()].filter(
    (event) => event.direction === "check_in",
  ).length;

  return {
    eventsToday: todayEvents.length,
    checkInsToday: checkIns.length,
    checkOutsToday: checkOuts.length,
    uniqueMembersToday: uniqueMembersToday.size,
    currentlyInGym,
  };
}

export { buildMemberName };
