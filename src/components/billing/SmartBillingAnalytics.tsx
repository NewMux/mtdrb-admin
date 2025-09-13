import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
} from "react-icons/fi";
import { SmartAnalyticsHeader, PerformanceMetricsCard } from "../ui";

interface SmartBillingAnalyticsProps {
  refreshKey: number;
}

interface BillingMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  trend: "up" | "down" | "stable";
  format?: "currency" | "percentage" | "number" | "decimal";
  suffix?: string;
}

export default function SmartBillingAnalytics({
  refreshKey,
}: SmartBillingAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [loading, setLoading] = useState(false);

  // Mock billing metrics data
  const billingMetrics: BillingMetric[] = [
    {
      name: "Total Revenue",
      current: 45280,
      previous: 40120,
      target: 50000,
      trend: "up",
      format: "currency",
    },
    {
      name: "Collection Rate",
      current: 94,
      previous: 91,
      target: 95,
      trend: "up",
      format: "percentage",
    },
    {
      name: "Average Invoice",
      current: 850,
      previous: 780,
      target: 900,
      trend: "up",
      format: "currency",
    },
    {
      name: "Outstanding Amount",
      current: 3200,
      previous: 4800,
      target: 2000,
      trend: "down",
      format: "currency",
    },
    {
      name: "Payment Time",
      current: 12,
      previous: 15,
      target: 10,
      trend: "down",
      format: "number",
      suffix: " days",
    },
    {
      name: "Expense Ratio",
      current: 28,
      previous: 32,
      target: 25,
      trend: "down",
      format: "percentage",
    },
  ];

  useEffect(() => {
    setLoading(false);
  }, [refreshKey, selectedTimeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SmartAnalyticsHeader
        title="Smart Billing Analytics"
        subtitle="Advanced financial insights and revenue optimization"
        icon={<FiBarChart className="text-2xl" />}
        gradientFrom="purple-600"
        gradientTo="pink-700"
        timeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
      />

      {/* Performance Metrics */}
      <PerformanceMetricsCard metrics={billingMetrics} />
    </div>
  );
}
