// Reads the dates we store from a Paddle subscription entity.
//
// Cancelling in Paddle "at the end of the billing period" does not end the
// subscription: it stays status "active" with a scheduled_change of
//   { action: "cancel", effective_at: <end of the paid period>, resume_at: null }
// and Paddle sends subscription.canceled when that moment arrives. Until then
// the tenant has paid for access, so we keep status "active" and record the
// date in platform_subscriptions.cancel_at.
//
// Field names follow Paddle Billing's published subscription entity
// (scheduled_change, next_billed_at, current_billing_period). The paddle-docs
// MCP server was not connected when this was written - confirm against a real
// sandbox subscription that was cancelled at period end.

export interface SubscriptionDates {
  /** When a cancellation already scheduled in Paddle takes effect, or null. */
  cancelAt: string | null;
  /** End of the paid period (what access is checked against), or null. */
  periodEnd: string | null;
}

const asIso = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
};

export function readSubscriptionDates(data: Record<string, unknown>, paddleStatus: string): SubscriptionDates {
  const change = data.scheduled_change as Record<string, unknown> | null | undefined;
  const cancelAt = change && change.action === "cancel" ? asIso(change.effective_at) : null;

  const nextBilledAt = asIso(data.next_billed_at);
  if (nextBilledAt) return { cancelAt, periodEnd: nextBilledAt };

  // No next bill date. For a subscription that still grants access this must
  // not become "no end": an active row with a null period end is treated as
  // entitled for ever. Fall back to the date the paid period actually ends.
  if (paddleStatus === "active" || paddleStatus === "trialing") {
    const billingPeriod = data.current_billing_period as Record<string, unknown> | null | undefined;
    return { cancelAt, periodEnd: cancelAt ?? asIso(billingPeriod?.ends_at) };
  }

  return { cancelAt, periodEnd: null };
}

// --- Status mapping and the failed-payment grace period ---------------------

/** Days a gym keeps access after a renewal payment first fails. */
export const PAST_DUE_GRACE_DAYS = 7;

export type StoredStatus = "active" | "trialing" | "past_due" | "cancelled";

/**
 * Paddle: active | trialing | past_due | paused | canceled.
 * Ours:   active | trialing | past_due | cancelled.
 * past_due is kept (not collapsed into "cancelled") so the gym gets a grace
 * period while Paddle retries the payment; see 20261022150000_past_due_grace.sql.
 * paused has no equivalent (the app never pauses), so it counts as no access.
 */
export function mapPaddleStatus(paddleStatus: string): StoredStatus {
  if (paddleStatus === "active" || paddleStatus === "trialing" || paddleStatus === "past_due") return paddleStatus;
  return "cancelled";
}

/**
 * The grace_until to store for this event. A new failure starts a fresh
 * window; further past_due events (Paddle sends several while it retries) keep
 * the original date, otherwise every retry would extend the grace for ever.
 * Any other status clears it.
 */
export function nextGraceUntil(
  paddleStatus: string,
  existing: { status?: string | null; grace_until?: string | null } | null | undefined,
  now: Date = new Date(),
): string | null {
  if (paddleStatus !== "past_due") return null;
  const kept = existing?.status === "past_due" ? asIso(existing.grace_until) : null;
  if (kept) return kept;
  return new Date(now.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

// --- Event ordering ----------------------------------------------------------

/** The event's own timestamp (Paddle sets occurred_at on every event), as an ISO string, or null. */
export function eventOccurredAt(event: { occurred_at?: unknown }): string | null {
  return asIso(event.occurred_at);
}

/**
 * True when an event is OLDER than the newest one already applied, so it must be
 * ignored: applying it would roll the row back to a state Paddle has since left.
 * An event with the same timestamp is not stale (a redelivery of the same event
 * is idempotent), and when either time is unknown we cannot tell, so we apply it.
 */
export function isStaleEvent(appliedAt: string | null | undefined, eventAt: string | null | undefined): boolean {
  const applied = asIso(appliedAt);
  const incoming = asIso(eventAt);
  if (!applied || !incoming) return false;
  return Date.parse(incoming) < Date.parse(applied);
}
