import React from "react";
import { useSubscription } from "../contexts/SubscriptionContext";
import { FiLock, FiStar, FiZap, FiTrendingUp } from "react-icons/fi";

interface ProFeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPreview?: boolean;
}

export function ProFeatureGate({
  feature,
  children,
  fallback,
  showPreview = true,
}: ProFeatureGateProps) {
  const { checkProFeature, upgradePrompt } = useSubscription();

  if (checkProFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const featureNames: { [key: string]: string } = {
    deepAnalytics: "Deep Analytics",
    advancedReports: "Advanced Reports",
    automationEngine: "Automation Engine",
    memberInsights: "Member Insights",
    bulkOperations: "Bulk Operations",
    customBranding: "Custom Branding",
    apiAccess: "API Access",
  };

  const featureIcons: { [key: string]: React.ReactNode } = {
    deepAnalytics: <FiTrendingUp className="h-8 w-8 text-blue-500" />,
    advancedReports: <FiZap className="h-8 w-8 text-purple-500" />,
    automationEngine: <FiStar className="h-8 w-8 text-orange-500" />,
    memberInsights: <FiTrendingUp className="h-8 w-8 text-green-500" />,
    bulkOperations: <FiZap className="h-8 w-8 text-red-500" />,
    customBranding: <FiStar className="h-8 w-8 text-indigo-500" />,
    apiAccess: <FiLock className="h-8 w-8 text-gray-500" />,
  };

  return (
    <div className="relative">
      {showPreview && (
        <div className="blur-sm pointer-events-none opacity-30">{children}</div>
      )}

      <div
        className={`${showPreview ? "absolute inset-0" : ""} flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200 p-8`}
      >
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-4">
            {featureIcons[feature] || (
              <FiLock className="h-8 w-8 text-gray-500" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {featureNames[feature] || "Pro Feature"}
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            Upgrade to Pro to unlock this powerful feature and take your gym
            management to the next level.
          </p>

          <div className="space-y-2">
            <button
              onClick={upgradePrompt}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center"
            >
              <FiStar className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </button>

            <div className="text-xs text-gray-500">Starting at $29/month</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini version for smaller spaces
export function ProBadge({
  feature,
  onClick,
}: {
  feature: string;
  onClick?: () => void;
}) {
  const { checkProFeature, upgradePrompt } = useSubscription();

  if (checkProFeature(feature)) {
    return null;
  }

  return (
    <button
      onClick={onClick || upgradePrompt}
      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full hover:from-amber-200 hover:to-orange-200 transition-colors"
    >
      <FiStar className="mr-1 h-3 w-3" />
      Pro
    </button>
  );
}

// Inline pro feature wrapper
export function ProInline({
  feature,
  children,
}: {
  feature: string;
  children: React.ReactNode;
}) {
  const { checkProFeature } = useSubscription();

  if (!checkProFeature(feature)) {
    return null;
  }

  return <>{children}</>;
}
