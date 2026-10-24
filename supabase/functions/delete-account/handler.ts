// Request handling for delete-account, kept free of Deno and Supabase imports
// so every branch can be unit-tested (see handler.test.ts). index.ts wires the
// real clients into `DeleteDeps`.
//
// Lets a signed-in person erase their data (the right to erasure):
//   scope "gym"  - a gym ADMIN deletes the gym and everything in it, plus the
//                  accounts of staff who belong to no other gym.
//   scope "me"   - anyone else (staff leaving, or an account that never made a
//                  gym) deletes just their own account.
//
// Flow, in this order (the order is the security model):
//   1. CORS / method / bearer token checks.
//   2. The caller's own JWT resolves WHO they are, which gym is theirs and
//      whether they are its admin. Nothing about identity comes from the body.
//   3. Platform admins are refused (remove the allowlist row first, deliberately).
//   4. The scope must fit the person (an admin cannot "just leave"; staff cannot
//      delete the gym), and the typed confirmation must match: the gym's exact
//      name for "gym", the account's email for "me". The database checks it again.
//   5. Rate limit.
//   6. For a gym with a live Paddle subscription: cancel it IMMEDIATELY in Paddle
//      and only continue if Paddle accepts. Otherwise the gym would keep being
//      billed for something that no longer exists. (If Paddle refuses, nothing
//      has been deleted and the person can retry.)
//   7. The database function deletes the data and the accounts in one
//      transaction.
//   8. Uploaded files are removed afterwards, best effort; a failure there is
//      reported but cannot undo step 7.
//
// The Paddle request shape (POST /subscriptions/{id}/cancel with
// effective_from "immediately") follows Paddle Billing API v2's published
// reference; the paddle-docs MCP server was not connected when this was written,
// so confirm it against the sandbox.

import { bearerToken, corsHeaders, reply, type HttpResponse } from "../_shared/http.ts";

export type DeleteResponse = HttpResponse;

export interface DeleteRequest {
  method: string;
  origin: string | null;
  authorization: string | null;
  bodyText: string;
}

export interface Caller {
  user_id: string;
  email: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  is_admin: boolean;
  is_platform_admin: boolean;
}

export interface StoredSubscription {
  status: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
}

export type PaddleResult = { ok: true } | { ok: false; status: number; detail: string };

export type DeleteOutcome = { ok: true; deletedUsers: number } | { ok: false; code: string; message: string };

export interface DeleteDeps {
  allowedOrigins: string[];
  paddleConfigured: boolean;
  getCaller(token: string): Promise<Caller | null>;
  loadSubscription(tenantId: string): Promise<StoredSubscription | null>;
  rateLimit(key: string): Promise<boolean>;
  /** Cancels the subscription now (no further charges). */
  cancelNow(subscriptionId: string): Promise<PaddleResult>;
  deleteGym(userId: string, confirmName: string, billingCancelled: boolean): Promise<DeleteOutcome>;
  deleteUser(userId: string, confirmEmail: string): Promise<DeleteOutcome>;
  /** Returns false if some files could not be removed. */
  removeFiles(tenantId: string): Promise<boolean>;
  log(message: string, detail?: unknown): void;
}

const MAX_BODY_BYTES = 2_000;
const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "paused"]);

export type Scope = "gym" | "me";

export function parseBody(raw: unknown): { scope: Scope; confirm: string } | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const { scope, confirm } = raw as Record<string, unknown>;
  if ((scope !== "gym" && scope !== "me") || typeof confirm !== "string") return null;
  const trimmed = confirm.trim();
  if (!trimmed || trimmed.length > 300) return null;
  return { scope, confirm: trimmed };
}

export async function handleDeleteAccount(req: DeleteRequest, deps: DeleteDeps): Promise<DeleteResponse> {
  const cors = corsHeaders(req.origin, deps.allowedOrigins);

  if (req.method === "OPTIONS") return reply(204, cors);
  if (req.method !== "POST") return reply(405, cors, { error: "Method not allowed." });

  const token = bearerToken(req.authorization);
  if (!token) return reply(401, cors, { error: "Sign in again." });

  // 2. Who is this?
  let caller: Caller | null;
  try {
    caller = await deps.getCaller(token);
  } catch (err) {
    deps.log("could not resolve the caller", err);
    return reply(401, cors, { error: "Sign in again." });
  }
  if (!caller) return reply(401, cors, { error: "Sign in again." });

  // 3. The platform owner's own account is never deleted from here.
  if (caller.is_platform_admin) {
    return reply(403, cors, { error: "A platform owner account cannot be deleted here." });
  }

  // 4. Input, scope and confirmation.
  if (req.bodyText.length > MAX_BODY_BYTES) return reply(413, cors, { error: "Request too large." });
  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return reply(400, cors, { error: "Send a JSON object." });
  }
  const body = parseBody(raw);
  if (!body) return reply(400, cors, { error: "Choose what to delete and type the confirmation." });

  const isGymAdmin = caller.tenant_id !== null && caller.is_admin;
  if (body.scope === "gym") {
    if (!isGymAdmin || !caller.tenant_name) {
      return reply(403, cors, { error: "Only the gym's admin can delete the gym." });
    }
    if (body.confirm !== caller.tenant_name.trim()) {
      return reply(400, cors, { error: "The name you typed does not match your gym." });
    }
  } else {
    if (isGymAdmin) {
      return reply(409, cors, {
        error: "You are an admin of a gym. Delete the gym, or make someone else an admin first.",
      });
    }
    if (!caller.email || body.confirm.toLowerCase() !== caller.email.toLowerCase()) {
      return reply(400, cors, { error: "The email you typed does not match your account." });
    }
  }

  // 5. Rate limit (per person: a stuck client must not hammer Paddle).
  try {
    if (!(await deps.rateLimit(`delete-account:${caller.user_id}`))) {
      return reply(429, cors, { error: "Too many attempts. Try again in a few minutes." });
    }
  } catch (err) {
    // A broken limiter must not block a verified person from erasing their data.
    deps.log("rate limit check failed", err);
  }

  // 6. A live subscription is cancelled first, or nothing is deleted.
  let billingCancelled = false;
  if (body.scope === "gym" && caller.tenant_id) {
    let sub: StoredSubscription | null;
    try {
      sub = await deps.loadSubscription(caller.tenant_id);
    } catch (err) {
      deps.log("loadSubscription failed", err);
      return reply(500, cors, { error: "Could not check your subscription. Nothing was deleted." });
    }
    const live =
      sub !== null &&
      sub.payment_provider === "paddle" &&
      Boolean(sub.payment_reference) &&
      LIVE_STATUSES.has(sub.status ?? "");
    if (live && sub?.payment_reference) {
      if (!deps.paddleConfigured) {
        deps.log("billing is not configured (PADDLE_API_KEY)");
        return reply(503, cors, { error: "Deletion is not available right now. Contact support." });
      }
      const outcome = await deps.cancelNow(sub.payment_reference);
      if (!outcome.ok) {
        deps.log("Paddle refused the immediate cancellation", outcome);
        return reply(502, cors, {
          error:
            "Billing could not cancel your subscription, so nothing was deleted and you have not been charged more. Try again, or contact support.",
        });
      }
      billingCancelled = true;
    }
  }

  // 7. Delete, in the database, in one transaction.
  let result: DeleteOutcome;
  try {
    result =
      body.scope === "gym"
        ? await deps.deleteGym(caller.user_id, body.confirm, billingCancelled)
        : await deps.deleteUser(caller.user_id, body.confirm);
  } catch (err) {
    deps.log("the delete failed", err);
    return reply(500, cors, { error: "Something went wrong and your data was not deleted. Try again, or contact support." });
  }
  if (!result.ok) {
    deps.log("the database refused the delete", result);
    return reply(409, cors, { error: result.message });
  }

  // 8. Files (best effort - the data is already gone).
  let filesRemoved = true;
  if (body.scope === "gym" && caller.tenant_id) {
    try {
      filesRemoved = await deps.removeFiles(caller.tenant_id);
    } catch (err) {
      filesRemoved = false;
      deps.log("could not remove uploaded files", err);
    }
  }

  return reply(200, cors, {
    deleted: true,
    scope: body.scope,
    deleted_users: result.deletedUsers,
    files_removed: filesRemoved,
    subscription_cancelled: billingCancelled,
  });
}
