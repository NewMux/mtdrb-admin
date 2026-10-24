// Request handling for invite-staff, kept free of Deno and Supabase imports so
// every branch can be unit-tested (see handler.test.ts). index.ts wires the real
// clients into `InviteStaffDeps`.
//
// Flow, in this order (the order is the security model):
//   1. CORS / method / bearer token checks.
//   2. The caller must be an admin of a gym. Checked with the CALLER'S token
//      (staff_invite_context(), which raises unless they are an admin) BEFORE
//      anything is validated or sent, so nobody else can trigger an email and
//      every denial looks the same. The gym is taken from that answer - never from
//      the request body - so an admin can only ever invite into their own gym.
//   3. Validate input, rate-limit the gym.
//   4. Send the Supabase Auth invitation (the one step that needs the
//      service-role key; it creates the unconfirmed account).
//   5. staff_provision() (service role only) adds the membership with the chosen
//      role. If it fails, the invited account is deleted again.

export interface InviteStaffInput {
  email: string;
  /** Built-in role to start on (ignored when customRoleId is set). */
  role: "employee" | "trainer";
  customRoleId: string | null;
}

export interface InviteStaffRequest {
  method: string;
  origin: string | null;
  authorization: string | null;
  bodyText: string;
}

export interface InviteStaffResponse {
  status: number;
  headers: Record<string, string>;
  /** JSON string, or null for an empty response. */
  body: string | null;
}

export type InviteResult = { ok: true; userId: string } | { ok: false; code: "already_registered" | "failed" };
export type ProvisionResult = { ok: true } | { ok: false; code: string | null; message: string };

export interface InviteStaffDeps {
  allowedOrigins: string[];
  /** Where the invitation link lands (the app's set-password page). */
  redirectTo: string | null;
  /** The caller's gym if they are an admin of it, else null. */
  verify(token: string): Promise<{ tenantId: string; staffCount: number } | null>;
  /** true = under the limit. */
  rateLimit(key: string): Promise<boolean>;
  invite(email: string, redirectTo: string): Promise<InviteResult>;
  provision(tenantId: string, userId: string, input: InviteStaffInput): Promise<ProvisionResult>;
  removeUser(userId: string): Promise<void>;
  log(message: string, detail?: unknown): void;
}

const MAX_BODY_BYTES = 2_000;
export const MAX_STAFF = 50;
const FORBIDDEN = "You do not have access to this.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The database's own, user-safe messages for these states are passed through;
// anything else becomes a generic error.
const PASS_THROUGH_CODES = new Set(["22023", "55000", "54000"]);

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

function reply(status: number, cors: Record<string, string>, payload?: unknown): InviteStaffResponse {
  return {
    status,
    headers: { ...cors, ...(payload === undefined ? {} : { "Content-Type": "application/json" }) },
    body: payload === undefined ? null : JSON.stringify(payload),
  };
}

export function parseInput(raw: unknown): { ok: true; input: InviteStaffInput } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Send a JSON object." };
  }
  const o = raw as Record<string, unknown>;

  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  let customRoleId: string | null = null;
  if (o.customRoleId !== null && o.customRoleId !== undefined && o.customRoleId !== "") {
    if (typeof o.customRoleId !== "string" || !UUID.test(o.customRoleId)) {
      return { ok: false, error: "Choose a valid role." };
    }
    customRoleId = o.customRoleId.toLowerCase();
  }

  // Admin is deliberately not offered: promote someone after they have joined.
  const role = o.role;
  if (customRoleId === null && role !== "employee" && role !== "trainer") {
    return { ok: false, error: "Choose a role." };
  }

  return { ok: true, input: { email, role: role === "trainer" ? "trainer" : "employee", customRoleId } };
}

export async function handleInviteStaff(req: InviteStaffRequest, deps: InviteStaffDeps): Promise<InviteStaffResponse> {
  const cors = corsHeaders(req.origin, deps.allowedOrigins);

  if (req.method === "OPTIONS") return reply(204, cors);
  if (req.method !== "POST") return reply(405, cors, { error: "Method not allowed." });

  const match = /^Bearer\s+(\S+)$/i.exec(req.authorization ?? "");
  if (!match) return reply(401, cors, { error: "Sign in again." });
  const token = match[1];

  // 2. A gym admin, before anything else is looked at.
  let context: { tenantId: string; staffCount: number } | null;
  try {
    context = await deps.verify(token);
  } catch (err) {
    deps.log("verify failed", err);
    return reply(403, cors, { error: FORBIDDEN });
  }
  if (!context) return reply(403, cors, { error: FORBIDDEN });

  if (!deps.redirectTo) {
    deps.log("STAFF_APP_URL is not set; refusing to send an invitation with no landing page");
    return reply(500, cors, { error: "The invite service is not configured." });
  }

  // 3. Input + limits.
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

  if (context.staffCount >= MAX_STAFF) {
    return reply(409, cors, { error: `A gym can have at most ${MAX_STAFF} staff accounts.` });
  }

  try {
    if (!(await deps.rateLimit(`invite-staff:${context.tenantId}`))) {
      return reply(429, cors, { error: "Too many invitations. Try again later." });
    }
  } catch (err) {
    // A broken limiter must not block a verified admin.
    deps.log("rate limit check failed", err);
  }

  // 4. Invitation (creates the unconfirmed account).
  let invited: InviteResult;
  try {
    invited = await deps.invite(input.email, deps.redirectTo);
  } catch (err) {
    deps.log("invite threw", err);
    invited = { ok: false, code: "failed" };
  }
  if (!invited.ok) {
    if (invited.code === "already_registered") {
      return reply(409, cors, {
        error: "That email already has an account. A person can belong to one gym; ask them to use a different email.",
      });
    }
    return reply(502, cors, { error: "Could not send the invitation. Try again." });
  }

  // 5. Add them to the gym; undo the invitation on failure.
  let provisioned: ProvisionResult;
  try {
    provisioned = await deps.provision(context.tenantId, invited.userId, input);
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
    if (provisioned.code === "P0002") return reply(404, cors, { error: "That role no longer exists." });
    if (provisioned.code && PASS_THROUGH_CODES.has(provisioned.code) && provisioned.message) {
      return reply(provisioned.code === "22023" ? 400 : 409, cors, { error: provisioned.message });
    }
    deps.log("provision failed", provisioned);
    return reply(500, cors, { error: "Could not add them to your team. Nothing was changed." });
  }

  return reply(200, cors, { userId: invited.userId, email: input.email });
}
