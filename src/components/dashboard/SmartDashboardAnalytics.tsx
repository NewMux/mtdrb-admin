import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiStar,
  FiTarget,
  FiZap,
} from "react-icons/fi";
import { SmartAnalyticsHeader, PerformanceMetricsCard } from "../ui";

interface SmartDashboardAnalyticsProps {
  refreshKey: number;
}

interface DashboardMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  trend: "up" | "down" | "stable";
  format?: "currency" | "percentage" | "number" | "decimal";
  suffix?: string;
  icon?: React.ReactNode;
  color?: string;
}

export default function SmartDashboardAnalytics({
  refreshKey,
}: SmartDashboardAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [loading, setLoading] = useState(false);

  // Enhanced dashboard metrics data with icons and colors
  const dashboardMetrics: DashboardMetric[] = [
    {
      name: "Total Revenue",
      current: 45280,
      previous: 40120,
      target: 50000,
      trend: "up",
      format: "currency",
      icon: <FiDollarSign className="h-5 w-5" />,
      color: "green",
    },
    {
      name: "Active Members",
      current: 1247,
      previous: 1189,
      target: 1300,
      trend: "up",
      format: "number",
      icon: <FiUsers className="h-5 w-5" />,
      color: "blue",
    },
    {
      name: "Class Attendance",
      current: 78,
      previous: 72,
      target: 85,
      trend: "up",
      format: "percentage",
      icon: <FiCalendar className="h-5 w-5" />,
      color: "purple",
    },
    {
      name: "Trainer Rating",
      current: 4.7,
      previous: 4.5,
      target: 4.8,
      trend: "up",
      format: "decimal",
      icon: <FiStar className="h-5 w-5" />,
      color: "yellow",
    },
    {
      name: "Member Retention",
      current: 87,
      previous: 89,
      target: 90,
      trend: "down",
      format: "percentage",
      icon: <FiTarget className="h-5 w-5" />,
      color: "red",
    },
    {
      name: "Gym Health Score",
      current: 92,
      previous: 88,
      target: 95,
      trend: "up",
      format: "percentage",
      icon: <FiZap className="h-5 w-5" />,
      color: "indigo",
    },
  ];

  useEffect(() => {
    setLoading(false);
  }, [refreshKey, selectedTimeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <SmartAnalyticsHeader
        title="Analytics Dashboard"
        subtitle="Comprehensive business insights and performance metrics"
        icon={<FiBarChart className="text-2xl" />}
        gradientFrom="purple-600"
        gradientTo="indigo-700"
        timeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
      />

      {/* Enhanced Performance Metrics */}
      <PerformanceMetricsCard 
        metrics={dashboardMetrics}
        title="Performance Overview"
        subtitle="Key metrics and their progress towards targets"
      />

      {/* Additional Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-50 rounded-xl">
              <FiTrendingUp className="text-green-600 text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Revenue Trends</h3>
              <p className="text-sm text-gray-600">Monthly revenue performance</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-lg font-bold text-gray-900">$45,280</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Month</span>
              <span className="text-sm text-gray-500">$40,120</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: '90.6%' }}></div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <FiTrendingUp className="h-4 w-4" />
              <span>+12.9% vs last month</span>
            </div>
          </div>
        </motion.div>

        {/* Member Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FiUsers className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Member Insights</h3>
              <p className="text-sm text-gray-600">Member engagement metrics</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Members</span>
              <span className="text-lg font-bold text-gray-900">1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New This Month</span>
              <span className="text-sm text-gray-500">+58</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: '95.9%' }}></div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <FiTrendingUp className="h-4 w-4" />
              <span>+4.9% vs last month</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
