import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("../supabaseClient", () => ({ supabase: { rpc: (...a: unknown[]) => h.rpc(...a) } }));

import {
  AccessControlError,
  createDeviceKey,
  daysUntil,
  detectCredentialType,
  ingestExample,
  issueCredential,
  parseScanResult,
  reasonKey,
  scanCredential,
} from "./accessControl";

beforeEach(() => h.rpc.mockReset());

describe("parseScanResult", () => {
  it("reads a full answer", () => {
    expect(
      parseScanResult({ allowed: true, reason: "ok", duplicate: false, direction: "check_out", member: { name: "Ann One", expiry_date: "2027-01-01" } }),
    ).toEqual({ allowed: true, reason: "ok", duplicate: false, direction: "check_out", memberName: "Ann One", memberExpiry: "2027-01-01" });
  });

  it("treats anything unexpected as a refusal, never an allow", () => {
    for (const bad of [null, undefined, "yes", 5, [], {}, { allowed: "true" }, { allowed: 1 }]) {
      const r = parseScanResult(bad);
      expect(r.allowed).toBe(false);
      expect(r.reason).toBe("unknown");
      expect(r.memberName).toBeNull();
    }
  });

  it("ignores an invalid direction", () => {
    expect(parseScanResult({ allowed: true, direction: "sideways" }).direction).toBeNull();
  });
});

describe("reasonKey", () => {
  it("maps known reasons and falls back for new ones", () => {
    expect(reasonKey("expired")).toBe("accessControl.reasons.expired");
    expect(reasonKey("unknown_credential")).toBe("accessControl.reasons.unknown_credential");
    expect(reasonKey("something_new")).toBe("accessControl.reasons.unknown");
  });
});

describe("calls", () => {
  it("scanCredential sends the credential, direction and branch to the database", async () => {
    h.rpc.mockResolvedValue({ data: { allowed: true, reason: "ok", member: { name: "Ann" } }, error: null });
    const r = await scanCredential({ type: "qr", credential: "MTDRB-1", direction: "auto", branchId: "b1", eventId: "e1" });
    expect(h.rpc).toHaveBeenCalledWith("attendance_scan", {
      p_credential_type: "qr",
      p_credential: "MTDRB-1",
      p_direction: "auto",
      p_branch_id: "b1",
      p_external_event_id: "e1",
    });
    expect(r.allowed).toBe(true);
  });

  it("surfaces a database refusal as an error", async () => {
    h.rpc.mockResolvedValue({ data: null, error: { message: "The subscription is not active" } });
    await expect(scanCredential({ type: "qr", credential: "x", direction: "auto", branchId: null })).rejects.toThrow(AccessControlError);
  });

  it("issueCredential returns the QR token once, and null for a card", async () => {
    h.rpc.mockResolvedValueOnce({ data: "MTDRB-ABCDEF0123456789ABCD", error: null });
    expect(await issueCredential("m1", "qr")).toBe("MTDRB-ABCDEF0123456789ABCD");
    h.rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await issueCredential("m1", "badge", "04A1")).toBeNull();
    expect(h.rpc).toHaveBeenLastCalledWith("attendance_issue_credential", { p_member_id: "m1", p_type: "badge", p_value: "04A1" });
  });

  it("createDeviceKey returns the key or fails loudly", async () => {
    h.rpc.mockResolvedValueOnce({ data: "mtdrb_dev_" + "a".repeat(48), error: null });
    expect(await createDeviceKey("d1")).toMatch(/^mtdrb_dev_/);
    h.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(createDeviceKey("d1")).rejects.toThrow(/no key/);
  });
});

describe("ingestExample", () => {
  it("builds a curl for the gym's own endpoint and key", () => {
    const text = ingestExample("https://abc.supabase.co/", "mtdrb_dev_x");
    expect(text).toContain("https://abc.supabase.co/functions/v1/attendance-ingest");
    expect(text).toContain("Authorization: Bearer mtdrb_dev_x");
    expect(text).toContain('"credential_type":"badge"');
  });
});

describe("detectCredentialType", () => {
  it("a MTDRB- code is a QR; anything else off a reader is a card", () => {
    expect(detectCredentialType("MTDRB-ABCDEF")).toBe("qr");
    expect(detectCredentialType("  mtdrb-abcdef ")).toBe("qr");
    expect(detectCredentialType("04A1B2C3")).toBe("badge");
    expect(detectCredentialType("0001234567")).toBe("badge");
  });
});

describe("daysUntil", () => {
  it("counts whole days, negative once past, null when there is no date", () => {
    expect(daysUntil("2026-10-30", "2026-10-24")).toBe(6);
    expect(daysUntil("2026-10-24", "2026-10-24")).toBe(0);
    expect(daysUntil("2026-10-20", "2026-10-24")).toBe(-4);
    expect(daysUntil(null, "2026-10-24")).toBeNull();
    expect(daysUntil("soon", "2026-10-24")).toBeNull();
  });
});
