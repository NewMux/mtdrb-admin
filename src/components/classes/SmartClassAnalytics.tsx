import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiCalendar,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
} from "react-icons/fi";
import { SmartAnalyticsHeader, PerformanceMetricsCard } from "../ui";

interface SmartClassAnalyticsProps {
  refreshKey: number;
}

interface ClassMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  trend: "up" | "down" | "stable";
  format?: "currency" | "percentage" | "number" | "decimal";
  suffix?: string;
}

export default function SmartClassAnalytics({
  refreshKey,
}: SmartClassAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [loading, setLoading] = useState(false);

  // Mock class metrics data
  const classMetrics: ClassMetric[] = [
    {
      name: "Total Classes",
      current: 156,
      previous: 142,
      target: 180,
      trend: "up",
      format: "number",
    },
    {
      name: "Average Attendance",
      current: 78,
      previous: 72,
      target: 85,
      trend: "up",
      format: "percentage",
    },
    {
      name: "Class Utilization",
      current: 82,
      previous: 79,
      target: 90,
      trend: "up",
      format: "percentage",
    },
    {
      name: "Revenue per Class",
      current: 450,
      previous: 420,
      target: 500,
      trend: "up",
      format: "currency",
    },
    {
      name: "Waitlist Rate",
      current: 12,
      previous: 15,
      target: 8,
      trend: "down",
      format: "percentage",
    },
    {
      name: "Member Satisfaction",
      current: 4.6,
      previous: 4.4,
      target: 4.8,
      trend: "up",
      format: "decimal",
    },
  ];

  useEffect(() => {
    setLoading(false);
  }, [refreshKey, selectedTimeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SmartAnalyticsHeader
        title="Smart Class Analytics"
        subtitle="Advanced class performance metrics and optimization insights"
        icon={<FiBarChart className="text-2xl" />}
        gradientFrom="green-600"
        gradientTo="emerald-700"
        timeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
      />

      {/* Performance Metrics */}
      <PerformanceMetricsCard metrics={classMetrics} />
    </div>
  );
}
