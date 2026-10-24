import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiBarChart2 } from "react-icons/fi";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Analytics is part of the Pro plan and above. Starter gyms who open the address
 * directly see this explanation instead of the screen. (The sidebar item and the
 * Analytics tabs are hidden for them separately; see utils/planFeatures.ts.)
 */
export const AnalyticsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { canUseAnalytics, isLoading } = useSubscription();
  const { userMetadata } = useAuth();
  const isAdmin = userMetadata?.role === "admin";

  if (isLoading) {
    return (
      <div role="status" className="py-24 text-center text-sm text-gray-500 dark:text-gray-400">
        {t("common.loading")}
      </div>
    );
  }
  if (canUseAnalytics) return <>{children}</>;

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        <FiBarChart2 className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t("planGate.analyticsTitle")}</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t("planGate.analyticsBody")}</p>
      {!isAdmin && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t("planGate.askAdmin")}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {isAdmin ? (
          <Link to="/dashboard/settings?tab=billing&upgrade=pro" className="btn btn-primary">
            {t("planGate.upgradeToPro")}
          </Link>
        ) : (
          <Link to="/dashboard/settings?tab=billing" className="btn btn-primary">
            {t("planGate.viewPlan")}
          </Link>
        )}
        <Link to="/dashboard" className="btn btn-secondary">
          {t("planGate.backToDashboard")}
        </Link>
      </div>
    </div>
  );
};

export default AnalyticsGuard;
