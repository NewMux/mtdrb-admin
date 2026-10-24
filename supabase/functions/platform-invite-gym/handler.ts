// Request handling for platform-invite-gym, kept free of Deno and Supabase
// imports so every branch can be unit-tested (see handler.test.ts). index.ts
// wires the real clients into `InviteDeps`.
//
// Flow, in this order (the order is the security model):
//   1. CORS / method / bearer token checks.
//   2. The caller must be a fully verified platform admin (allowlist + aal2 +
//      verified factor + live session). Checked with the CALLER'S token BEFORE
//      anything is validated or sent, so nobody else can trigger an email and
//      every denial looks the same.
//   3. Validate input, rate-limit the caller.
//   4. Send the Supabase Auth invitation (the only step that needs the
//      service-role key; it creates the unconfirmed account).
//   5. Call platform_provision_gym with the caller's own token. Authorisation,
//      the "must be a pending invitation" rule and the audit row all live in
//      Postgres. If it fails, the invited account is deleted again.

export interface InviteInput {
  gymName: string;
  adminEmail: string;
  planTier: string;
  /** ISO timestamp, or null for no expiry. The database validates the range. */
  until: string | null;
  reason: string;
}

export interface InviteRequest {
  method: string;
  origin: string | null;
  authorization: string | null;
  bodyText: string;
}

export interface InviteResponse {
  status: number;
  headers: Record<string, string>;
  /** JSON string, or null for an empty response. */
  body: string | null;
}

export type InviteResult = { ok: true; userId: string } | { ok: false; code: "already_registered" | "failed" };
export type ProvisionResult = { ok: true; tenantId: string } | { ok: false; code: string | null; message: string };

export interface InviteDeps {
  allowedOrigins: string[];
  /** Where the invitation link lands (the app's set-password page). */
  redirectTo: string | null;
  verify(token: string): Promise<{ status: string; userId: string | null }>;
  /** true = under the limit. */
  rateLimit(key: string): Promise<boolean>;
  invite(email: string, redirectTo: string, gymName: string): Promise<InviteResult>;
  provision(token: string, input: InviteInput & { userId: string }): Promise<ProvisionResult>;
  removeUser(userId: string): Promise<void>;
  log(message: string, detail?: unknown): void;
}

export const PLAN_TIERS = ["starter", "pro", "enterprise", "demo"] as const;
const MAX_BODY_BYTES = 10_000;
const FORBIDDEN = "You do not have access to this.";

// The database's own, user-safe messages for these states are passed through;
// anything else becomes a generic error.
const PASS_THROUGH_CODES = new Set(["22023", "55000"]);

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-application-name, prefer",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
  };
}

function reply(status: number, cors: Record<string, string>, payload?: unknown): InviteResponse {
  return {
    status,
    headers: { ...cors, ...(payload === undefined ? {} : { "Content-Type": "application/json" }) },
    body: payload === undefined ? null : JSON.stringify(payload),
  };
}

export function parseInput(raw: unknown): { ok: true; input: InviteInput } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Send a JSON object." };
  }
  const o = raw as Record<string, unknown>;

  const gymName = typeof o.gymName === "string" ? o.gymName.trim() : "";
  if (gymName.length < 1 || gymName.length > 160 || /[\u0000-\u001f\u007f]/.test(gymName)) {
    return { ok: false, error: "Enter a gym name of 1 to 160 characters." };
  }

  const adminEmail = typeof o.adminEmail === "string" ? o.adminEmail.trim().toLowerCase() : "";
  if (adminEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const planTier = typeof o.planTier === "string" ? o.planTier : "";
  if (!(PLAN_TIERS as readonly string[]).includes(planTier)) {
    return { ok: false, error: "Choose a plan." };
  }

  let until: string | null = null;
  if (o.until !== null && o.until !== undefined) {
    if (typeof o.until !== "string" || Number.isNaN(Date.parse(o.until))) {
      return { ok: false, error: "Choose a valid end date." };
    }
    until = new Date(o.until).toISOString();
  }

  const reason = typeof o.reason === "string" ? o.reason.trim() : "";
  if (reason.length < 3 || reason.length > 500) {
    return { ok: false, error: "Enter a reason of 3 to 500 characters." };
  }

  return { ok: true, input: { gymName, adminEmail, planTier, until, reason } };
}

export async function handleInvite(req: InviteRequest, deps: InviteDeps): Promise<InviteResponse> {
  const cors = corsHeaders(req.origin, deps.allowedOrigins);

  if (req.method === "OPTIONS") return reply(204, cors);
  if (req.method !== "POST") return reply(405, cors, { error: "Method not allowed." });

  const match = /^Bearer\s+(\S+)$/i.exec(req.authorization ?? "");
  if (!match) return reply(401, cors, { error: "Sign in again." });
  const token = match[1];

  // 2. Verified platform admin, before anything else is looked at.
  let caller: { status: string; userId: string | null };
  try {
    caller = await deps.verify(token);
  } catch (err) {
    deps.log("verify failed", err);
    return reply(403, cors, { error: FORBIDDEN });
  }
  if (caller.status !== "ok" || !caller.userId) return reply(403, cors, { error: FORBIDDEN });

  if (!deps.redirectTo) {
    deps.log("PLATFORM_APP_URL is not set; refusing to send an invitation with no landing page");
    return reply(500, cors, { error: "The invite service is not configured." });
  }

  // 3. Input + rate limit.
  if (req.bodyText.length > MAX_BODY_BYTES) return reply(413, cors, { error: "Request too large." });
  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return reply(400, cors, { error: "Send a JSON object." });
  }
  const parsed = parseInput(raw);
  if (!parsed.ok) return reply(400, cors, { error: parsed.error });
  const input = parsed.input;

  try {
    if (!(await deps.rateLimit(`platform-invite-gym:${caller.userId}`))) {
      return reply(429, cors, { error: "Too many invitations. Try again later." });
    }
  } catch (err) {
    // A broken limiter must not block a verified owner.
    deps.log("rate limit check failed", err);
  }

  // 4. Invitation (creates the unconfirmed account).
  let invited: InviteResult;
  try {
    invited = await deps.invite(input.adminEmail, deps.redirectTo, input.gymName);
  } catch (err) {
    deps.log("invite threw", err);
    invited = { ok: false, code: "failed" };
  }
  if (!invited.ok) {
    if (invited.code === "already_registered") {
      return reply(409, cors, { error: "That email already has an account. Ask them to sign in, or use a different email." });
    }
    return reply(502, cors, { error: "Could not send the invitation. Try again." });
  }

  // 5. Provision with the caller's own token; undo the invitation on failure.
  let provisioned: ProvisionResult;
  try {
    provisioned = await deps.provision(token, { ...input, userId: invited.userId });
  } catch (err) {
    deps.log("provision threw", err);
    provisioned = { ok: false, code: null, message: "" };
  }
  if (!provisioned.ok) {
    try {
      await deps.removeUser(invited.userId);
    } catch (err) {
      deps.log(`could not remove invited user ${invited.userId} after a failed provision`, err);
    }
    if (provisioned.code === "42501") return reply(403, cors, { error: FORBIDDEN });
    if (provisioned.code && PASS_THROUGH_CODES.has(provisioned.code) && provisioned.message) {
      return reply(provisioned.code === "22023" ? 400 : 409, cors, { error: provisioned.message });
    }
    deps.log("provision failed", provisioned);
    return reply(500, cors, { error: "Could not create the gym. Nothing was changed." });
  }

  return reply(200, cors, {
    tenantId: provisioned.tenantId,
    userId: invited.userId,
    email: input.adminEmail,
  });
}
