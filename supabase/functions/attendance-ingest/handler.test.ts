import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleIngest, parseScan, sha256Hex, type IngestDeps, type IngestRequest } from "./handler";

const KEY = "mtdrb_dev_" + "ab".repeat(24);

const decision = {
  allowed: true,
  reason: "ok",
  duplicate: false,
  direction: "check_in",
  event_id: "ev-1",
  member: { id: "m-1", name: "Ann One", expiry_date: "2027-01-01" },
};

function makeDeps(over: Partial<IngestDeps> = {}) {
  const deps = {
    scan: vi.fn().mockResolvedValue({ ok: true, result: decision }),
    rateLimit: vi.fn().mockResolvedValue(true),
    log: vi.fn(),
    ...over,
  };
  return deps as typeof deps & IngestDeps;
}

const req = (body: unknown = { credential_type: "qr", credential: "MTDRB-123" }, over: Partial<IngestRequest> = {}): IngestRequest => ({
  method: "POST",
  authorization: `Bearer ${KEY}`,
  deviceKeyHeader: null,
  bodyText: JSON.stringify(body),
  ...over,
});
const json = (r: { body: string | null }) => JSON.parse(r.body ?? "null");

let deps: ReturnType<typeof makeDeps>;
beforeEach(() => {
  deps = makeDeps();
});

describe("sha256Hex", () => {
  it("matches a known SHA-256", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("parseScan", () => {
  it("accepts a minimal and a full body", () => {
    expect(parseScan({ credential_type: "badge", credential: " 04A1 " })).toEqual({
      ok: true,
      scan: { credentialType: "badge", credential: "04A1", direction: null, eventId: null, occurredAt: null },
    });
    const full = parseScan({
      credential_type: "vendor_user_id",
      credential: "1007",
      direction: "check_out",
      event_id: "gw-99",
      occurred_at: "2026-10-24T08:00:00+03:00",
    });
    expect(full).toMatchObject({ ok: true, scan: { direction: "check_out", eventId: "gw-99", occurredAt: "2026-10-24T05:00:00.000Z" } });
  });

  it.each([
    [null],
    [[]],
    ["x"],
    [{}],
    [{ credential_type: "fingerprint", credential: "x" }],
    [{ credential_type: "qr" }],
    [{ credential_type: "qr", credential: "   " }],
    [{ credential_type: "qr", credential: "x".repeat(201) }],
    [{ credential_type: "qr", credential: "x", direction: "sideways" }],
    [{ credential_type: "qr", credential: "x", event_id: "" }],
    [{ credential_type: "qr", credential: "x", event_id: 5 }],
    [{ credential_type: "qr", credential: "x", occurred_at: "yesterday-ish" }],
  ])("rejects %j", (raw) => {
    expect(parseScan(raw).ok).toBe(false);
  });
});

describe("authentication and request shape", () => {
  it("only POST", async () => {
    expect((await handleIngest(req({}, { method: "GET" }), deps)).status).toBe(405);
  });

  it("needs a well-formed device key, from Authorization or X-Device-Key", async () => {
    for (const bad of [null, "Bearer nope", `Bearer ${KEY}x`, "Bearer mtdrb_dev_" + "z".repeat(48)]) {
      expect((await handleIngest(req(undefined, { authorization: bad }), deps)).status).toBe(401);
    }
    expect(deps.scan).not.toHaveBeenCalled();

    const viaHeader = await handleIngest(req(undefined, { authorization: null, deviceKeyHeader: KEY }), deps);
    expect(viaHeader.status).toBe(200);
  });

  it("rejects bad bodies before touching the database", async () => {
    expect((await handleIngest(req(undefined, { bodyText: "{nope" }), deps)).status).toBe(400);
    expect((await handleIngest(req({ credential_type: "qr" }), deps)).status).toBe(400);
    expect((await handleIngest(req(undefined, { bodyText: "x".repeat(4001) }), deps)).status).toBe(413);
    expect(deps.scan).not.toHaveBeenCalled();
  });

  it("sends no CORS headers: devices are not browsers", async () => {
    const r = await handleIngest(req(), deps);
    expect(Object.keys(r.headers).some((h) => h.toLowerCase().startsWith("access-control"))).toBe(false);
  });
});

describe("the decision", () => {
  it("passes only the hash of the key, never the key", async () => {
    await handleIngest(req(), deps);
    const params = deps.scan.mock.calls[0][0];
    expect(params.keyHash).toBe(await sha256Hex(KEY));
    expect(JSON.stringify(params)).not.toContain(KEY);
    expect(params).toMatchObject({ credentialType: "qr", credential: "MTDRB-123", direction: null, eventId: null, occurredAt: null });
  });

  it("returns allow with the member's name and nothing internal", async () => {
    const r = await handleIngest(req(), deps);
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({
      allowed: true,
      reason: "ok",
      duplicate: false,
      direction: "check_in",
      event_id: "ev-1",
      member: { name: "Ann One", expiry_date: "2027-01-01" },
    });
  });

  it("a refusal is still HTTP 200 with allowed false and a reason", async () => {
    deps.scan.mockResolvedValue({ ok: true, result: { allowed: false, reason: "expired", duplicate: false, direction: "check_in", event_id: "ev-2", member: { name: "Exp Member", expiry_date: "2026-09-01" } } });
    const r = await handleIngest(req(), deps);
    expect(r.status).toBe(200);
    expect(json(r)).toMatchObject({ allowed: false, reason: "expired" });
  });

  it("an unknown credential has no member in the answer", async () => {
    deps.scan.mockResolvedValue({ ok: true, result: { allowed: false, reason: "unknown_credential", duplicate: false } });
    const body = json(await handleIngest(req(), deps));
    expect(body).toEqual({ allowed: false, reason: "unknown_credential", duplicate: false });
  });

  it("anything unexpected from the database is treated as a refusal, never an allow", async () => {
    deps.scan.mockResolvedValue({ ok: true, result: { allowed: "yes", reason: 7 } });
    expect(json(await handleIngest(req(), deps))).toMatchObject({ allowed: false, reason: "unknown" });
  });

  it("forwards direction, event id and time", async () => {
    await handleIngest(req({ credential_type: "badge", credential: "04A1", direction: "auto", event_id: "gw-1", occurred_at: "2026-10-24T05:00:00Z" }), deps);
    expect(deps.scan.mock.calls[0][0]).toMatchObject({ direction: "auto", eventId: "gw-1", occurredAt: "2026-10-24T05:00:00.000Z" });
  });
});

describe("failures", () => {
  it.each([
    ["28000", 401],
    ["55000", 403],
    ["22023", 400],
  ])("maps database error %s to HTTP %i", async (code, status) => {
    deps.scan.mockResolvedValue({ ok: false, code, message: "msg" });
    expect((await handleIngest(req(), deps)).status).toBe(status);
  });

  it("an unexpected database error is a 500 and is not echoed", async () => {
    deps.scan.mockResolvedValue({ ok: false, code: "XX000", message: "internal detail" });
    const r = await handleIngest(req(), deps);
    expect(r.status).toBe(500);
    expect(r.body).not.toContain("internal detail");
  });

  it("a thrown error is a 500", async () => {
    deps.scan.mockRejectedValue(new Error("boom"));
    expect((await handleIngest(req(), deps)).status).toBe(500);
  });

  it("is rate limited per device", async () => {
    deps.rateLimit.mockResolvedValue(false);
    expect((await handleIngest(req(), deps)).status).toBe(429);
    expect(deps.rateLimit.mock.calls[0][0]).toBe(`attendance-ingest:${await sha256Hex(KEY)}`);
    expect(deps.scan).not.toHaveBeenCalled();
  });

  it("a broken limiter does not lock people out", async () => {
    deps.rateLimit.mockRejectedValue(new Error("limiter down"));
    expect((await handleIngest(req(), deps)).status).toBe(200);
  });
});
