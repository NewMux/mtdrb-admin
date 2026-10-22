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
