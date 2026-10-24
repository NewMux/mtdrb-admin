// Request handling for attendance-ingest, kept free of Deno and Supabase imports
// so every branch can be unit-tested (see handler.test.ts). index.ts wires the
// real clients into `IngestDeps`.
//
// The one HTTP endpoint any reader, turnstile controller or gateway can call:
//
//   POST /functions/v1/attendance-ingest
//   Authorization: Bearer mtdrb_dev_...            (the device's own key)
//   { "credential_type": "badge" | "qr" | "vendor_user_id",
//     "credential": "<card UID | QR text | the terminal's user id>",
//     "direction": "check_in" | "check_out" | "auto"     (optional),
//     "event_id": "<your own id, so a retry is harmless>"  (optional),
//     "occurred_at": "<ISO time, for logs delivered late>"  (optional) }
//
// The answer is always the decision, with HTTP 200, for a request the server
// understood: { allowed, reason, duplicate, direction, event_id, member? }. A
// door opens when `allowed` is true. Non-200 means the REQUEST failed (bad key,
// bad body, rate limit), not that the member was refused.
//
// The key identifies the device, and the device identifies the gym; nothing in
// the body can name a gym. Only a hash of the key is ever stored or compared.

import { bearerToken, reply, type HttpResponse } from "../_shared/http.ts";

export type IngestResponse = HttpResponse;

export interface IngestRequest {
  method: string;
  authorization: string | null;
  /** Some devices cannot set Authorization; they may send X-Device-Key instead. */
  deviceKeyHeader: string | null;
  bodyText: string;
}

export type ScanOutcome =
  | { ok: true; result: Record<string, unknown> }
  | { ok: false; code: string; message: string };

export interface ScanParams {
  keyHash: string;
  credentialType: string;
  credential: string;
  direction: string | null;
  eventId: string | null;
  occurredAt: string | null;
}

export interface IngestDeps {
  scan(params: ScanParams): Promise<ScanOutcome>;
  /** true = under the limit. */
  rateLimit(key: string): Promise<boolean>;
  log(message: string, detail?: unknown): void;
}

const MAX_BODY_BYTES = 4_000;
const CREDENTIAL_TYPES = ["badge", "qr", "vendor_user_id"];
const DIRECTIONS = ["check_in", "check_out", "auto"];

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface ParsedScan {
  credentialType: string;
  credential: string;
  direction: string | null;
  eventId: string | null;
  occurredAt: string | null;
}

/** The scan from a request body, or the reason it is unusable. */
export function parseScan(raw: unknown): { ok: true; scan: ParsedScan } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Send a JSON object." };
  }
  const body = raw as Record<string, unknown>;

  const credentialType = typeof body.credential_type === "string" ? body.credential_type : "";
  if (!CREDENTIAL_TYPES.includes(credentialType)) {
    return { ok: false, error: "credential_type must be badge, qr or vendor_user_id." };
  }

  const credential = typeof body.credential === "string" ? body.credential.trim() : "";
  if (!credential || credential.length > 200) {
    return { ok: false, error: "credential must be 1 to 200 characters." };
  }

  let direction: string | null = null;
  if (body.direction !== undefined && body.direction !== null) {
    if (typeof body.direction !== "string" || !DIRECTIONS.includes(body.direction)) {
      return { ok: false, error: "direction must be check_in, check_out or auto." };
    }
    direction = body.direction;
  }

  let eventId: string | null = null;
  if (body.event_id !== undefined && body.event_id !== null) {
    if (typeof body.event_id !== "string" || !body.event_id.trim() || body.event_id.length > 200) {
      return { ok: false, error: "event_id must be 1 to 200 characters." };
    }
    eventId = body.event_id.trim();
  }

  let occurredAt: string | null = null;
  if (body.occurred_at !== undefined && body.occurred_at !== null) {
    if (typeof body.occurred_at !== "string" || Number.isNaN(Date.parse(body.occurred_at))) {
      return { ok: false, error: "occurred_at must be an ISO 8601 time." };
    }
    occurredAt = new Date(body.occurred_at).toISOString();
  }

  return { ok: true, scan: { credentialType, credential, direction, eventId, occurredAt } };
}

export async function handleIngest(req: IngestRequest, deps: IngestDeps): Promise<IngestResponse> {
  // Devices are not browsers: no CORS headers, no preflight.
  const none: Record<string, string> = {};

  if (req.method !== "POST") return reply(405, none, { error: "Method not allowed." });

  const key = bearerToken(req.authorization) ?? (req.deviceKeyHeader?.trim() || null);
  if (!key || !/^mtdrb_dev_[0-9a-f]{48}$/.test(key)) {
    return reply(401, none, { error: "A valid device key is required." });
  }

  if (req.bodyText.length > MAX_BODY_BYTES) return reply(413, none, { error: "Request too large." });
  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return reply(400, none, { error: "Send a JSON object." });
  }
  const parsed = parseScan(raw);
  if (!parsed.ok) return reply(400, none, { error: parsed.error });

  const keyHash = await sha256Hex(key);

  // 120 scans a minute per device: a busy turnstile is nowhere near that, a stuck
  // loop or a stolen key being hammered is.
  try {
    if (!(await deps.rateLimit(`attendance-ingest:${keyHash}`))) {
      return reply(429, none, { error: "Too many scans from this device. Slow down." });
    }
  } catch (err) {
    // A broken limiter must not lock people out of the gym.
    deps.log("rate limit check failed", err);
  }

  let outcome: ScanOutcome;
  try {
    outcome = await deps.scan({ keyHash, ...parsed.scan });
  } catch (err) {
    deps.log("scan failed", err);
    return reply(500, none, { error: "Could not process the scan. Try again." });
  }

  if (!outcome.ok) {
    if (outcome.code === "28000") return reply(401, none, { error: "A valid device key is required." });
    if (outcome.code === "55000") return reply(403, none, { error: "This device is not active." });
    if (outcome.code === "22023") return reply(400, none, { error: outcome.message });
    deps.log("scan refused", outcome);
    return reply(500, none, { error: "Could not process the scan. Try again." });
  }

  const r = outcome.result;
  const member = r.member as { name?: unknown; expiry_date?: unknown } | undefined;
  return reply(200, none, {
    allowed: r.allowed === true,
    reason: typeof r.reason === "string" ? r.reason : "unknown",
    duplicate: r.duplicate === true,
    ...(typeof r.direction === "string" ? { direction: r.direction } : {}),
    ...(typeof r.event_id === "string" ? { event_id: r.event_id } : {}),
    ...(member && typeof member.name === "string"
      ? { member: { name: member.name, expiry_date: typeof member.expiry_date === "string" ? member.expiry_date : null } }
      : {}),
  });
}
