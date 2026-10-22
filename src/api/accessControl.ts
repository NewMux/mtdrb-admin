// Client side of door/reader integration (supabase/migrations/20261024150000_access_control.sql).
// Everything that decides who gets in runs in the database; this file only calls
// it and translates the answers.

import { supabase } from "../supabaseClient";
import type { Database } from "../types/supabase";

export type AttendanceDeviceRow = Database["public"]["Tables"]["attendance_devices"]["Row"];
export type DeviceType = AttendanceDeviceRow["device_type"];
export type DeviceDirection = AttendanceDeviceRow["direction"];
export type CredentialType = "qr" | "badge" | "vendor_user_id";

export class AccessControlError extends Error {}

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
};

export interface ScanResult {
  allowed: boolean;
  /** ok, expired, suspended, inactive, not_active, unknown_credential, unknown_member */
  reason: string;
  duplicate: boolean;
  direction: "check_in" | "check_out" | null;
  memberName: string | null;
  memberExpiry: string | null;
}

/** Reads the database's answer defensively: anything unexpected is a refusal, never an allow. */
export function parseScanResult(raw: unknown): ScanResult {
  const r = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const member = typeof r.member === "object" && r.member !== null ? (r.member as Record<string, unknown>) : null;
  const direction = r.direction === "check_in" || r.direction === "check_out" ? r.direction : null;
  return {
    allowed: r.allowed === true,
    reason: typeof r.reason === "string" ? r.reason : "unknown",
    duplicate: r.duplicate === true,
    direction,
    memberName: member && typeof member.name === "string" ? member.name : null,
    memberExpiry: member && typeof member.expiry_date === "string" ? member.expiry_date : null,
  };
}

/**
 * What kind of credential a scanned string is. A member's QR code always starts
 * with MTDRB-; anything else coming off a keyboard-style reader is a card number.
 * (A terminal's own user id is chosen explicitly, since it looks like any number.)
 */
export function detectCredentialType(text: string): CredentialType {
  return /^MTDRB-/i.test(text.trim()) ? "qr" : "badge";
}

/** Whole days from `today` (YYYY-MM-DD) to an expiry date, or null if there is none. */
export function daysUntil(expiry: string | null, today: string): number | null {
  if (!expiry || !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return null;
  const ms = Date.parse(`${expiry}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.round(ms / 86_400_000) : null;
}

/** The translation key for a scan's reason, falling back to a generic refusal. */
export function reasonKey(reason: string): string {
  const known = ["ok", "expired", "suspended", "inactive", "not_active", "unknown_credential", "unknown_member"];
  return `accessControl.reasons.${known.includes(reason) ? reason : "unknown"}`;
}

/** A scan from the staff tablet/kiosk (signed in; no device key). */
export async function scanCredential(input: {
  type: CredentialType;
  credential: string;
  direction: "auto" | "check_in" | "check_out";
  branchId: string | null;
  eventId?: string;
}): Promise<ScanResult> {
  const { data, error } = await supabase.rpc("attendance_scan", {
    p_credential_type: input.type,
    p_credential: input.credential,
    p_direction: input.direction,
    p_branch_id: input.branchId,
    p_external_event_id: input.eventId ?? null,
  } as never);
  if (error) throw new AccessControlError(errorMessage(error));
  return parseScanResult(data);
}

/**
 * Issues a credential for a member. For "qr" it returns the new token (shown
 * once: only its hash is stored); for a card or a terminal's user id it returns null.
 */
export async function issueCredential(memberId: string, type: CredentialType, value?: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("attendance_issue_credential", {
    p_member_id: memberId,
    p_type: type,
    p_value: value ?? null,
  } as never);
  if (error) throw new AccessControlError(errorMessage(error));
  return typeof data === "string" ? data : null;
}

/** Creates (or replaces) a device's key. The plaintext is returned once and never stored. */
export async function createDeviceKey(deviceId: string): Promise<string> {
  const { data, error } = await supabase.rpc("attendance_create_device_key", { p_device_id: deviceId } as never);
  if (error) throw new AccessControlError(errorMessage(error));
  if (typeof data !== "string") throw new AccessControlError("The server returned no key.");
  return data;
}

export async function revokeDeviceKey(deviceId: string): Promise<void> {
  const { error } = await supabase.rpc("attendance_revoke_device_key", { p_device_id: deviceId } as never);
  if (error) throw new AccessControlError(errorMessage(error));
}

export async function addDevice(input: {
  tenantId: string;
  name: string;
  deviceType: DeviceType;
  direction: DeviceDirection;
  branchId: string | null;
}): Promise<AttendanceDeviceRow> {
  const name = input.name.trim();
  if (!name || name.length > 80) throw new AccessControlError("Enter a device name of up to 80 characters.");
  const { data, error } = await supabase
    .from("attendance_devices")
    .insert({
      tenant_id: input.tenantId,
      name,
      device_type: input.deviceType,
      direction: input.direction,
      branch_id: input.branchId,
    })
    .select("*")
    .single();
  if (error) throw new AccessControlError(errorMessage(error));
  return data as AttendanceDeviceRow;
}

export async function setDeviceStatus(deviceId: string, status: "active" | "paused" | "revoked"): Promise<void> {
  const { error } = await supabase.from("attendance_devices").update({ status }).eq("id", deviceId);
  if (error) throw new AccessControlError(errorMessage(error));
}

export interface MemberCredential {
  id: string;
  identity_type: "vendor_user_id" | "badge_uid_hash" | "qr_token_hash" | "passkey_credential";
  status: "active" | "revoked" | "pending";
  last_used_at: string | null;
  created_at: string;
}

export async function listMemberCredentials(memberId: string): Promise<MemberCredential[]> {
  const { data, error } = await supabase
    .from("attendance_member_identities")
    .select("id, identity_type, status, last_used_at, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  if (error) throw new AccessControlError(errorMessage(error));
  return (data ?? []) as MemberCredential[];
}

export async function revokeCredential(identityId: string): Promise<void> {
  const { error } = await supabase.from("attendance_member_identities").update({ status: "revoked" }).eq("id", identityId);
  if (error) throw new AccessControlError(errorMessage(error));
}

/** A ready-to-run example of what a gateway sends, for the admin to copy. */
export function ingestExample(baseUrl: string, key: string): string {
  return [
    `curl -X POST ${baseUrl.replace(/\/+$/, "")}/functions/v1/attendance-ingest \\`,
    `  -H "Authorization: Bearer ${key}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"credential_type":"badge","credential":"04A1B2C3","event_id":"turnstile-1-000123"}'`,
  ].join("\n");
}
