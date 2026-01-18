import * as React from "react";
import { motion } from "framer-motion";
import {
  FiZap,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiUsers,
  FiLock,
  FiPlay,
  FiSettings,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal } from "./useSmartAnalyticsModal";

interface ViewSmartInsightsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

const smartInsights = [
  {
    id: "1",
    type: "prediction",
    title: "Member Dropout Risk",
    description: "5 members show high risk of churning in the next 30 days",
    confidence: 87,
    impact: "high",
    category: "retention",
    icon: FiTrendingDown,
    color: "red",
    actions: [
      { label: "Apply Recommendation", action: "send_reengagement" },
      { label: "Assign Automation", action: "create_automation" },
      { label: "Expand Campaign", action: "expand_campaign" },
    ],
  },
  {
    id: "2",
    type: "forecast",
    title: "Revenue Forecast",
    description: "Projected 15% revenue increase in Q2 based on current trends",
    confidence: 92,
    impact: "high",
    category: "revenue",
    icon: FiTrendingUp,
    color: "green",
    actions: [
      { label: "Apply Recommendation", action: "optimize_pricing" },
      { label: "Assign Automation", action: "upsell_campaign" },
      { label: "Expand Campaign", action: "referral_program" },
    ],
  },
  {
    id: "3",
    type: "optimization",
    title: "Class Capacity Optimization",
    description:
      "HIIT Blast class at 110% capacity - recommend duplicate session",
    confidence: 94,
    impact: "medium",
    category: "operations",
    icon: FiUsers,
    color: "blue",
    actions: [
      { label: "Apply Recommendation", action: "add_class" },
      { label: "Assign Automation", action: "waitlist_management" },
      { label: "Expand Campaign", action: "class_promotion" },
    ],
  },
  {
    id: "4",
    type: "alert",
    title: "Low Trainer Engagement",
    description: "2 trainers showing decreased session completion rates",
    confidence: 78,
    impact: "medium",
    category: "performance",
    icon: FiAlertTriangle,
    color: "yellow",
    actions: [
      { label: "Apply Recommendation", action: "trainer_support" },
      { label: "Assign Automation", action: "performance_tracking" },
      { label: "Expand Campaign", action: "training_program" },
    ],
  },
];

const insightCategories = [
  { id: "all", label: "All Insights", count: smartInsights.length },
  {
    id: "retention",
    label: "Retention",
    count: smartInsights.filter((i) => i.category === "retention").length,
  },
  {
    id: "revenue",
    label: "Revenue",
    count: smartInsights.filter((i) => i.category === "revenue").length,
  },
  {
    id: "operations",
    label: "Operations",
    count: smartInsights.filter((i) => i.category === "operations").length,
  },
  {
    id: "performance",
    label: "Performance",
    count: smartInsights.filter((i) => i.category === "performance").length,
  },
];

export default function ViewSmartInsightsModal({
  open,
  onClose,
  onSuccess,
  isPro,
}: ViewSmartInsightsModalProps) {
  const { loading, alerts, clearAlerts } = useSmartAnalyticsModal();

  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [applyingAction, setApplyingAction] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleApplyAction = async (action: string) => {
    setApplyingAction(action);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onSuccess?.();
    } finally {
      setApplyingAction(null);
    }
  };

  const filteredInsights =
    selectedCategory === "all"
      ? smartInsights
      : smartInsights.filter((insight) => insight.category === selectedCategory);

  const getInsightColor = (color: string) => {
    switch (color) {
      case "red":
        return "text-red-600 bg-red-50 border-red-200";
      case "green":
        return "text-green-600 bg-green-50 border-green-200";
      case "blue":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "yellow":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  function Section({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {title}
        </h3>
        <div className="space-y-4">{children}</div>
      </section>
    );
  }

  if (!isPro) {
    return (
      <SmartAnalyticsModal
        open={open}
        onClose={onClose}
        title="Smart Insights"
        subtitle="Pro feature - Upgrade to access smart-powered insights"
      >
        <div className="text-center py-12">
          <FiLock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Pro Feature
          </h3>
          <p className="text-gray-600 mb-6">
            Smart Insights provide advanced analytics and predictive
            recommendations to optimize your gym operations.
          </p>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                What you&apos;ll get:
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Predictive member churn analysis</li>
                <li>• Revenue forecasting and optimization</li>
                <li>• Class capacity and scheduling insights</li>
                <li>• Trainer performance recommendations</li>
                <li>• Automated action implementation</li>
              </ul>
            </div>
            <button className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </SmartAnalyticsModal>
    );
  }

  return (
    <SmartAnalyticsModal
      open={open}
      onClose={onClose}
      title="Smart Insights"
      subtitle="Advanced analytics and predictive recommendations"
    >
      {/* Alerts */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2 ${
            alert.type === "error"
              ? "bg-red-50 text-red-700"
              : alert.type === "warning"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {alert.message}
        </div>
      ))}

      {/* Category Filter */}
      <Section title="Insight Categories">
        <div className="flex flex-wrap gap-2">
          {insightCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === category.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </Section>

      {/* Smart Insights */}
      <Section title="Smart Insights">
        <div className="space-y-4">
          {filteredInsights.map((insight) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 border rounded-lg ${getInsightColor(insight.color)}`}
              >
                <div className="flex items-start gap-4">
                  <Icon className="w-6 h-6 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {insight.title}
                      </h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          insight.impact === "high"
                            ? "bg-red-100 text-red-700"
                            : insight.impact === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {insight.impact} impact
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{insight.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {insight.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleApplyAction(action.action)}
                          disabled={applyingAction === action.action}
                          className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-60"
                        >
                          {applyingAction === action.action ? (
                            <>
                              <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <FiPlay className="w-3 h-3" />
                              {action.label}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Smart Summary */}
      <Section title="Smart Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">5</div>
              <div className="text-sm text-gray-600">High Risk Members</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">15%</div>
              <div className="text-sm text-gray-600">Revenue Growth</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600">
                Optimization Opportunities
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Smart Actions */}
      <Section title="Smart Actions">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiSettings className="text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Automated Recommendations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">
                    Immediate Actions
                  </h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Send re-engagement emails to at-risk members</li>
                    <li>• Schedule additional HIIT Blast sessions</li>
                    <li>• Implement waitlist management system</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">
                    Long-term Strategies
                  </h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Develop retention-focused marketing campaigns</li>
                    <li>• Optimize class scheduling based on demand</li>
                    <li>• Create trainer development programs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={() => {
              // Apply all recommendations
            }}
            disabled={loading}
          >
            <FiZap />
            Apply All Recommendations
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
