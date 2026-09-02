import React, { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiArrowUpRight,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

// Color mappings for KPI cards
const kpiColorMap = {
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconText: "text-blue-600 dark:text-blue-400",
  },
  green: {
    iconBg: "bg-green-50 dark:bg-green-900/30",
    iconText: "text-green-600 dark:text-green-400",
  },
};

const MemberEngagement: React.FC = () => {
  interface EngagementMetric {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: "blue" | "green";
    change: number;
    trend: "up" | "down";
  }

  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [loadError, setLoadError] = useState(false);
  const [engagementMetrics, setEngagementMetrics] = useState<
    EngagementMetric[]
  >([
    {
      title: t("dashboard.activeMembers"),
      value: "0",
      icon: <FiUsers className="h-5 w-5" />,
      color: "blue",
      change: 0,
      trend: "up",
    },
    {
      title: t("dashboard.newSignups"),
      value: "0",
      icon: <FiUserPlus className="h-5 w-5" />,
      color: "green",
      change: 0,
      trend: "up",
    },
  ]);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoadError(false);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Fetch active members
      const [currentMembers, previousMembers, newSignups, previousNewSignups] = await Promise.all([
        supabase
          .from("members")
          .select("id, status, membership_status")
          .eq("tenant_id", tenantId)
          .in("status", ["active"])
          .in("membership_status", ["active", "trial"]),
        supabase
          .from("members")
          .select("id, status, membership_status")
          .eq("tenant_id", tenantId)
          .in("status", ["active"])
          .in("membership_status", ["active", "trial"])
          .gte("created_at", formatDate(lastWeek)),
        supabase
          .from("members")
          .select("id, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(lastMonth)),
        supabase
          .from("members")
          .select("id, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000)))
          .lte("created_at", formatDate(lastMonth)),
      ]);

      const firstError =
        currentMembers.error ||
        previousMembers.error ||
        newSignups.error ||
        previousNewSignups.error;
      if (firstError) throw firstError;

      const currentCount = (currentMembers.data || []).length;
      const previousCount = (previousMembers.data || []).length;
      const memberChange = currentCount - previousCount;

      const newSignupsCount = (newSignups.data || []).length;
      const previousNewSignupsCount = (previousNewSignups.data || []).length;
      const signupsChange = newSignupsCount - previousNewSignupsCount;

      setEngagementMetrics([
        {
          title: t("dashboard.activeMembers"),
          value: currentCount.toString(),
          icon: <FiUsers className="h-5 w-5" />,
          color: "blue",
          change: memberChange,
          trend: memberChange >= 0 ? "up" : "down",
        },
        {
          title: t("dashboard.newSignups"),
          value: newSignupsCount.toString(),
          icon: <FiUserPlus className="h-5 w-5" />,
          color: "green",
          change: signupsChange,
          trend: signupsChange >= 0 ? "up" : "down",
        },
      ]);
    } catch (error) {
      console.error("Error fetching member engagement:", error);
      setLoadError(true);
    }
  }, [tenantId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <FiUserCheck className="text-blue-600 dark:text-blue-400 text-xl" />
          </div>
          <div className="text-start">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
              {t("dashboard.memberEngagement")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("dashboard.memberActivityAndGrowth")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>{t("dashboard.updated")}</span>
        </div>
      </div>
      
      {loadError && (
        <div className="mb-4 text-sm text-red-600 dark:text-red-400">
          {t("dashboard.failedToLoadData") || "Failed to load engagement data"}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {engagementMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 hover:shadow-sm dark:hover:shadow-gray-900/20 transition-all duration-200 text-start"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className={`p-2 rounded-lg ${kpiColorMap[metric.color].iconBg} ${kpiColorMap[metric.color].iconText}`}>
                {metric.icon}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <FiArrowUpRight className={`h-4 w-4 text-green-600 dark:text-green-400 ${isRTL ? 'rtl-flip' : ''}`} />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {metric.change > 0 ? "+" : ""}{metric.change}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{metric.title}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                metric.trend === "up" ? "bg-green-500" : "bg-red-500"
              }`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">{metric.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MemberEngagement;
