import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
} from "react-icons/fi";
import { SmartAnalyticsHeader, PerformanceMetricsCard } from "../ui";

interface SmartMemberAnalyticsProps {
  refreshKey: number;
}

interface MemberMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  trend: "up" | "down" | "stable";
  format?: "currency" | "percentage" | "number" | "decimal";
  suffix?: string;
}

export default function SmartMemberAnalytics({
  refreshKey,
}: SmartMemberAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [loading, setLoading] = useState(false);

  // Mock member metrics data
  const memberMetrics: MemberMetric[] = [
    {
      name: "Active Members",
      current: 1247,
      previous: 1189,
      target: 1300,
      trend: "up",
      format: "number",
    },
    {
      name: "New Signups",
      current: 89,
      previous: 76,
      target: 100,
      trend: "up",
      format: "number",
    },
    {
      name: "Retention Rate",
      current: 87,
      previous: 89,
      target: 90,
      trend: "down",
      format: "percentage",
    },
    {
      name: "Average LTV",
      current: 6800,
      previous: 6500,
      target: 7500,
      trend: "up",
      format: "currency",
    },
    {
      name: "Churn Rate",
      current: 3.2,
      previous: 4.0,
      target: 2.5,
      trend: "down",
      format: "decimal",
      suffix: "%",
    },
    {
      name: "Engagement Score",
      current: 91,
      previous: 88,
      target: 95,
      trend: "up",
      format: "percentage",
    },
  ];

  useEffect(() => {
    setLoading(false);
  }, [refreshKey, selectedTimeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SmartAnalyticsHeader
        title="Smart Member Analytics"
        subtitle="Advanced member insights and predictive retention modeling"
        icon={<FiBarChart className="text-2xl" />}
        gradientFrom="blue-600"
        gradientTo="indigo-700"
        timeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
      />

      {/* Performance Metrics */}
      <PerformanceMetricsCard metrics={memberMetrics} />
    </div>
  );
}
