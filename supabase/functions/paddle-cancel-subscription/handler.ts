// Request handling for paddle-cancel-subscription, kept free of Deno and
// Supabase imports so every branch can be unit-tested (see handler.test.ts).
// index.ts wires the real clients into `CancelDeps`.
//
// A tenant admin cancels - or changes their mind and keeps - their MTDRB
// subscription. Cancelling schedules the cancellation in Paddle for the END of
// the billing period they have already paid for: they keep access until then
// and are not billed again. Paddle is the source of truth, so this function
// asks Paddle first and only records the result (platform_subscriptions.cancel_at)
// once Paddle has accepted it. The row's `status` is never touched here: it
// stays "active" until Paddle sends subscription.canceled, which paddle-webhook
// turns into status "cancelled".
//
// Flow, in this order (the order is the security model):
//   1. CORS / method / bearer token checks.
//   2. The caller's own JWT resolves THEIR tenant and says whether they are its
//      admin. The tenant is never taken from the request.
//   3. Validate the action; rate-limit per tenant.
//   4. Load the stored subscription (service role). Only a Paddle subscription
//      can be cancelled here.
//   5. Ask Paddle. On refusal nothing is recorded.
//   6. Record cancel_at.
//
// The Paddle request shapes (POST /subscriptions/{id}/cancel with
// effective_from, PATCH /subscriptions/{id} with scheduled_change: null to
// remove a scheduled cancellation) follow Paddle Billing API v2's published
// reference. The paddle-docs MCP server was not connected when this was
// written, so confirm them against the sandbox before relying on this.

import { bearerToken, corsHeaders, reply, type HttpResponse } from "../_shared/http.ts";
import { readSubscriptionDates } from "../_shared/paddle-subscription.ts";

export type CancelResponse = HttpResponse;

export interface CancelRequest {
  method: string;
  origin: string | null;
  authorization: string | null;
  bodyText: string;
}

/** Who is calling, from the database's point of view. */
export interface Caller {
  tenant_id: string;
  is_admin: boolean;
}

/** The platform_subscriptions columns this function needs. */
export interface StoredSubscription {
  status: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  cancel_at: string | null;
  current_period_end: string | null;
}

export type PaddleResult = { ok: true; subscription: Record<string, unknown> } | { ok: false; status: number; detail: string };

export interface CancelDeps {
  allowedOrigins: string[];
  /** false when PADDLE_API_KEY is not set. */
  paddleConfigured: boolean;
  getCaller(token: string): Promise<Caller | null>;
  loadSubscription(tenantId: string): Promise<StoredSubscription | null>;
  /** true = under the limit. */
  rateLimit(key: string): Promise<boolean>;
  /** Schedules the cancellation for the end of the paid period. */
  scheduleCancel(subscriptionId: string): Promise<PaddleResult>;
  /** Removes a scheduled cancellation. */
  removeScheduledCancel(subscriptionId: string): Promise<PaddleResult>;
  saveCancelAt(tenantId: string, change: { cancelAt: string | null; currentPeriodEnd: string | null }): Promise<void>;
  log(message: string, detail?: unknown): void;
}

const MAX_BODY_BYTES = 1_000;

export function parseAction(raw: unknown): "cancel" | "resume" | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const action = (raw as Record<string, unknown>).action;
  return action === "cancel" || action === "resume" ? action : null;
}

export async function handleCancelSubscription(req: CancelRequest, deps: CancelDeps): Promise<CancelResponse> {
  const cors = corsHeaders(req.origin, deps.allowedOrigins);

  if (req.method === "OPTIONS") return reply(204, cors);
  if (req.method !== "POST") return reply(405, cors, { error: "Method not allowed." });

  const token = bearerToken(req.authorization);
  if (!token) return reply(401, cors, { error: "Sign in again." });

  // 2. Who is this, which gym, and are they its admin?
  let caller: Caller | null;
  try {
    caller = await deps.getCaller(token);
  } catch (err) {
    deps.log("could not resolve the caller", err);
    return reply(401, cors, { error: "Sign in again." });
  }
  if (!caller) return reply(401, cors, { error: "Sign in again." });
  if (!caller.is_admin) return reply(403, cors, { error: "Only a workspace admin can change billing." });

  // 3. Input + rate limit.
  if (req.bodyText.length > MAX_BODY_BYTES) return reply(413, cors, { error: "Request too large." });
  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return reply(400, cors, { error: "Send a JSON object." });
  }
  const action = parseAction(raw);
  if (!action) return reply(400, cors, { error: "Choose cancel or resume." });

  try {
    if (!(await deps.rateLimit(`paddle-cancel-subscription:${caller.tenant_id}`))) {
      return reply(429, cors, { error: "Too many changes. Try again in a few minutes." });
    }
  } catch (err) {
    // A broken limiter must not block a verified admin.
    deps.log("rate limit check failed", err);
  }

  // 4. Only a Paddle subscription can be changed here.
  let sub: StoredSubscription | null;
  try {
    sub = await deps.loadSubscription(caller.tenant_id);
  } catch (err) {
    deps.log("loadSubscription failed", err);
    return reply(500, cors, { error: "Could not load your subscription. Nothing was changed." });
  }
  if (!sub || sub.payment_provider !== "paddle" || !sub.payment_reference) {
    return reply(409, cors, {
      error: "Your plan is not billed through a subscription, so it cannot be cancelled here. Contact support to change it.",
    });
  }
  // past_due still has a live Paddle subscription (it is retrying the payment);
  // a gym with a failed card must be able to cancel to stop the retries.
  if (sub.status !== "active" && sub.status !== "past_due") {
    return reply(409, cors, { error: "Your subscription has already ended. Subscribe again to continue." });
  }

  // Already in the requested state: succeed without touching Paddle, so a
  // double click or a retry is harmless.
  if (action === "cancel" && sub.cancel_at) return reply(200, cors, { cancel_at: sub.cancel_at, synced: true });
  if (action === "resume" && !sub.cancel_at) return reply(200, cors, { cancel_at: null, synced: true });

  if (!deps.paddleConfigured) {
    deps.log("billing is not configured (PADDLE_API_KEY)");
    return reply(503, cors, { error: "Cancellation is not available right now. Contact support." });
  }

  // 5. Paddle first. If it refuses, nothing is recorded and nothing changed.
  const outcome =
    action === "cancel"
      ? await deps.scheduleCancel(sub.payment_reference)
      : await deps.removeScheduledCancel(sub.payment_reference);
  if (!outcome.ok) {
    deps.log(`Paddle rejected ${action}`, outcome);
    return reply(502, cors, {
      error:
        action === "cancel"
          ? "Billing could not cancel your subscription, so nothing was changed. Try again, or contact support."
          : "Billing could not keep your subscription, so nothing was changed. Try again, or contact support.",
    });
  }

  // 6. Record what Paddle now says. Paddle's response is the full subscription;
  // if it omits the schedule, a cancel still ends at the period we already know.
  const dates = readSubscriptionDates(outcome.subscription, "active");
  const cancelAt = action === "cancel" ? (dates.cancelAt ?? sub.current_period_end) : null;
  if (action === "cancel" && !cancelAt) {
    deps.log("Paddle accepted the cancellation but no end date is known", sub.payment_reference);
  }

  // Without an end date there is nothing to record yet: say so, and let the
  // webhook (subscription.updated carries scheduled_change) fill it in.
  let synced = !(action === "cancel" && !cancelAt);
  try {
    await deps.saveCancelAt(caller.tenant_id, { cancelAt, currentPeriodEnd: dates.periodEnd });
  } catch (err) {
    // Billing has changed; the webhook will bring our row in line.
    synced = false;
    deps.log(`changed in Paddle but not recorded for tenant ${caller.tenant_id}`, err);
  }

  return reply(200, cors, { cancel_at: cancelAt, synced });
}
