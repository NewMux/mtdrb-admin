import * as React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useSubscription } from "../contexts/SubscriptionContext";

/**
 * Shown while a gym's renewal payment has failed but its grace period has not
 * ended: access continues, and the gym needs to fix its payment method before
 * the date shown. Renders nothing in any other state - including once the grace
 * period has passed, when the gym is sent to /subscribe instead.
 */
export const PaymentFailedBanner: React.FC<{ now?: Date }> = ({ now = new Date() }) => {
  const { t } = useTranslation();
  const { subscription } = useSubscription();

  if (subscription?.status !== "past_due" || !subscription.grace_until) return null;
  const until = Date.parse(subscription.grace_until);
  if (Number.isNaN(until) || until <= now.getTime()) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200 sm:px-6 lg:px-8"
    >
      <FiAlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <p>
        {t(
          "settings.paymentFailedBanner",
          "We couldn't collect your latest subscription payment. Update your payment method before {{date}} to keep access. Check your email for the link from our payment provider.",
          { date: new Date(until).toLocaleDateString() },
        )}
      </p>
    </div>
  );
};

export default PaymentFailedBanner;
