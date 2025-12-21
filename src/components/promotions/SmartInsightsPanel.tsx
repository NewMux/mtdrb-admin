import React, { useState, useEffect } from "react";
import {
  FiTarget,
  FiUsers,
  FiTrendingUp,
  FiAlertTriangle,
  FiZap,
  FiGift,
  FiClock,
  FiAward,
} from "react-icons/fi";
import { motion } from "framer-motion";
import {
  getSmartPromotionInsights,
  SmartInsight,
} from "../../api/promotionInsights";

const SmartInsightsPanel: React.FC = () => {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await getSmartPromotionInsights();
        setInsights(data);
      } catch (error) {
        console.error("Error fetching insights:", error);
        // Fallback to empty array
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50 text-red-800";
      case "medium":
        return "border-yellow-200 bg-yellow-50 text-yellow-800";
      case "low":
        return "border-blue-200 bg-blue-50 text-blue-800";
      default:
        return "border-gray-200 bg-gray-50 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "churn":
        return <FiAlertTriangle className="h-4 w-4 text-red-600" />;
      case "acquisition":
        return <FiUsers className="h-4 w-4 text-blue-600" />;
      case "engagement":
        return <FiTrendingUp className="h-4 w-4 text-green-600" />;
      case "revenue":
        return <FiAward className="h-4 w-4 text-purple-600" />;
      default:
        return <FiTarget className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="animate-pulse bg-gray-200 h-6 w-6 rounded-full"></div>
          <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 h-32 rounded-2xl"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <FiZap className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Smart Campaign Insights
            </h2>
            <p className="text-sm text-gray-600">
              Smart recommendations to boost your campaigns
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Live Updates
          </span>
          <FiClock className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-2xl border hover:shadow-md transition-all duration-300 cursor-pointer ${
              insight.priority === "high"
                ? "border-red-200 bg-red-50"
                : insight.priority === "medium"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    insight.category === "churn"
                      ? "bg-red-100"
                      : insight.category === "acquisition"
                        ? "bg-blue-100"
                        : insight.category === "engagement"
                          ? "bg-green-100"
                          : "bg-purple-100"
                  }`}
                >
                  {getCategoryIcon(insight.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {insight.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}
                    >
                      {insight.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {insight.detectedIssue}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                    {getCategoryIcon(insight.category)}
                    <span className="capitalize">{insight.category}</span>
                    <span>•</span>
                    <span>{insight.expectedImpact}</span>
                    <span>•</span>
                    <span>
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 font-medium">
                {insight.recommendedAction}
              </p>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-all duration-300">
                {insight.actionCTA}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            💡 Smart analyzed{" "}
            {insights
              .reduce((sum, insight) => sum + insight.dataPoints, 0)
              .toLocaleString()}{" "}
            data points to generate these insights
          </span>
          <button className="text-purple-600 hover:text-purple-800 font-medium">
            View All Insights →
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartInsightsPanel;
export { SmartInsightsPanel };
