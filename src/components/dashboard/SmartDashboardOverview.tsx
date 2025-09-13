import React from "react";
import {
  FiTrendingUp,
  FiUsers,
  FiCreditCard,
  FiCalendar,
  FiTarget,
  FiCpu,
  FiArrowUpRight,
} from "react-icons/fi";
import { motion } from "framer-motion";

interface SmartDashboardOverviewProps {
  refreshKey: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  color,
  subtitle,
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "green":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "yellow":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "red":
        return "bg-red-50 text-red-600 border-red-200";
      case "purple":
        return "bg-violet-50 text-violet-600 border-violet-200";
      case "orange":
        return "bg-orange-50 text-orange-600 border-orange-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${getColorClasses(color)}`}>
          {icon}
        </div>
        <div className="flex items-center space-x-1 text-sm font-medium text-emerald-600">
          <FiArrowUpRight className="h-4 w-4" />
          <span>{change}</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

interface AIInsightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  value?: string;
}

const AIInsight: React.FC<AIInsightProps> = ({
  icon,
  title,
  description,
  action,
  priority,
  value,
}) => {
  const priorityColors = {
    high: "border-red-200 bg-red-50",
    medium: "border-yellow-200 bg-yellow-50",
    low: "border-blue-200 bg-blue-50",
  };

  return (
    <div
      className={`p-6 rounded-2xl border ${priorityColors[priority]} hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-white rounded-xl shadow-sm">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
            {value && (
              <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm font-medium">
                {value}
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>
          <button className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors">
            <span>{action}</span>
            <FiArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const SmartDashboardOverview: React.FC<SmartDashboardOverviewProps> = ({
  refreshKey,
}) => {
  const kpis = [
    {
      title: "Active Members",
      value: 1247,
      change: "+12.5%",
      trend: "up" as const,
      icon: <FiUsers className="h-6 w-6 text-blue-600" />,
      color: "blue",
      subtitle: "vs last month",
    },
    {
      title: "Monthly Revenue",
      value: "₹24.5k",
      change: "+18.2%",
      trend: "up" as const,
      icon: <FiCreditCard className="h-6 w-6 text-green-600" />,
      color: "green",
      subtitle: "Target: ₹25k",
    },
    {
      title: "Class Attendance",
      value: "89.4%",
      change: "+5.3%",
      trend: "up" as const,
      icon: <FiCalendar className="h-6 w-6 text-purple-600" />,
      color: "purple",
      subtitle: "Average this week",
    },
    {
      title: "Member Retention",
      value: "94.2%",
      change: "+2.1%",
      trend: "up" as const,
      icon: <FiTarget className="h-6 w-6 text-orange-600" />,
      color: "orange",
      subtitle: "12-month average",
    },
  ];

  const aiInsights = [
    {
      icon: <FiTrendingUp className="h-6 w-6 text-green-600" />,
      title: "Peak Hour Optimization",
      description:
        "Tuesday 6-7 PM shows 40% higher attendance. Consider adding more classes during this time to maximize revenue.",
      action: "Schedule Class",
      priority: "high" as const,
      value: "+40% attendance",
    },
    {
      icon: <FiUsers className="h-6 w-6 text-blue-600" />,
      title: "Member Churn Risk",
      description:
        "12 members haven't visited in 14+ days. Send personalized re-engagement campaigns to retain them.",
      action: "Send Campaign",
      priority: "medium" as const,
      value: "12 at-risk",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-50 rounded-xl">
            <FiCpu className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Dashboard</h2>
            <p className="text-gray-600">AI-powered insights for your gym</p>
          </div>
        </div>
      </div>

      {/* KPI Cards - Enhanced 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpis.map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* AI Insights - Enhanced Single Column */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Key Insights</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Live Updates</span>
          </div>
        </div>
        <div className="space-y-4">
          {aiInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2, duration: 0.3 }}
            >
              <AIInsight {...insight} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
