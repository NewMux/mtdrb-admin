export type SubscriptionEntitlement = {
  status?: string | null;
  trial_end?: string | null;
  current_period_end?: string | null;
  payment_provider?: string | null;
};

// Paddle renews at the period end; the webhook carrying the next period can
// land a little later. A failed renewal flips the status to past_due.
export const RENEWAL_GRACE_MS = 2 * 24 * 60 * 60 * 1000;

const isAfter = (value: string | null | undefined, now: Date, graceMs = 0): boolean => {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp + graceMs > now.getTime();
};

/**
 * Returns whether a tenant currently has access to the paid application.
 * Must stay identical to public.is_tenant_entitled() (latest definition in
 * supabase/migrations/20261014100000_paddle_subscription_sync_hardening.sql):
 * - active: until current_period_end plus the renewal grace; an open-ended
 *   (null) end date only counts for manual grants, never Paddle rows.
 * - trialing: only with a future trial_end.
 * - cancelled: until the already-paid current_period_end.
 */
export const isSubscriptionEntitled = (
  subscription: SubscriptionEntitlement | null | undefined,
  now: Date = new Date(),
): boolean => {
  if (!subscription) return false;

  if (subscription.status === "active") {
    if (!subscription.current_period_end) return subscription.payment_provider !== "paddle";
    return isAfter(subscription.current_period_end, now, RENEWAL_GRACE_MS);
  }

  if (subscription.status === "trialing") {
    return isAfter(subscription.trial_end, now);
  }

  if (subscription.status === "cancelled") {
    return isAfter(subscription.current_period_end, now);
  }

  return false;
};
