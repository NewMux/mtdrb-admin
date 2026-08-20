export type SubscriptionEntitlement = {
  status?: string | null;
  trial_end?: string | null;
  current_period_end?: string | null;
};

const isFuture = (value: string | null | undefined, now: Date): boolean => {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > now.getTime();
};

/**
 * Returns whether a tenant currently has access to the paid application.
 * Active paid subscriptions may omit an end date when the provider manages
 * renewal externally; trials must always have an explicit future end date.
 */
export const isSubscriptionEntitled = (
  subscription: SubscriptionEntitlement | null | undefined,
  now: Date = new Date(),
): boolean => {
  if (!subscription) return false;

  if (subscription.status === "active") {
    return !subscription.current_period_end || isFuture(subscription.current_period_end, now);
  }

  if (subscription.status === "trialing") {
    return isFuture(subscription.trial_end, now);
  }

  return false;
};
