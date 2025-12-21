import React from "react";
import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiZap,
} from "react-icons/fi";
// Removed import from mockReports - define type locally
interface SmartInsight {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  action: string;
  value?: number;
  trend?: "up" | "down" | "stable";
}
import { toast } from "react-hot-toast";

interface SmartInsightCardsProps {
  insights: SmartInsight[];
  onActionClick: (insight: SmartInsight) => void;
  isPro?: boolean;
}

const getPriorityColor = (priority: SmartInsight["priority"]) => {
  switch (priority) {
    case "high":
      return "border-red-200 bg-red-50";
    case "medium":
      return "border-yellow-200 bg-yellow-50";
    case "low":
      return "border-green-200 bg-green-50";
    default:
      return "border-gray-200 bg-gray-50";
  }
};

const getPriorityIcon = (priority: SmartInsight["priority"]) => {
  switch (priority) {
    case "high":
      return FiAlertTriangle;
    case "medium":
      return FiTrendingUp;
    case "low":
      return FiZap;
    default:
      return FiZap;
  }
};

const getCategoryIcon = (category: SmartInsight["category"]) => {
  switch (category) {
    case "trainer":
      return FiUsers;
    case "member":
      return FiUsers;
    case "class":
      return FiCalendar;
    case "revenue":
      return FiDollarSign;
    default:
      return FiZap;
  }
};

export default function SmartInsightCards({
  insights,
  onActionClick,
  isPro = false,
}: SmartInsightCardsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  if (!isPro) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200"
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Smart Insights
          </h3>
          <p className="text-gray-600 mb-4">
            Get smart recommendations to optimize your gym operations
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="text-2xl">🧠</div>
        <h3 className="text-xl font-semibold text-gray-900">Smart Insights</h3>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Smart Insights: ON
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const PriorityIcon = getPriorityIcon(insight.priority);
          const CategoryIcon = getCategoryIcon(insight.category);

          return (
            <motion.div
              key={insight.id}
              variants={cardVariants}
              className={`bg-white rounded-2xl p-6 border ${getPriorityColor(insight.priority)} shadow-md hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="text-2xl">{insight.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {insight.title}
                    </h4>
                    {insight.badge && (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          insight.badge === "New"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {insight.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Cause:</span> {insight.cause}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Suggestion:</span>{" "}
                    {insight.suggestion}
                  </p>
                </div>
                <PriorityIcon
                  className={`w-5 h-5 ${
                    insight.priority === "high"
                      ? "text-red-500"
                      : insight.priority === "medium"
                        ? "text-yellow-500"
                        : "text-green-500"
                  }`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CategoryIcon className="w-4 h-4" />
                  <span className="capitalize">{insight.category}</span>
                </div>
                <button
                  onClick={() => onActionClick(insight)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {insight.action}
                  <FiZap className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
