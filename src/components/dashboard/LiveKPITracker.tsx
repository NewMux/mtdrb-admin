import React, { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiActivity,
  FiArrowUpRight,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

// Color mappings for KPI cards
const kpiColorMap = {
  green: {
    iconBg: "bg-green-50 dark:bg-green-900/30",
    iconText: "text-green-600 dark:text-green-400",
  },
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconText: "text-blue-600 dark:text-blue-400",
  },
};

interface LiveKPITrackerProps {
  refreshKey?: number;
}

export const LiveKPITracker: React.FC<LiveKPITrackerProps> = ({ refreshKey }) => {
  interface LiveMetric {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: "green" | "blue";
    change: number;
    status: "active" | "stable";
  }

  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([
    {
      title: t("dashboard.membersInGym"),
      value: "0",
      icon: <FiUsers className="h-5 w-5" />,
      color: "green",
      change: 0,
      status: "active",
    },
    {
      title: t("dashboard.classesRunning"),
      value: "0",
      icon: <FiActivity className="h-5 w-5" />,
      color: "blue",
      change: 0,
      status: "stable",
    },
  ]);
  const [, setLoading] = useState(true);

  const fetchLiveData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      const formatDateTime = (date: Date) => date.toISOString();

      // Fetch members currently in gym (checked in today and not checked out)
      const { data: todayCheckIns } = await supabase
        .from("class_bookings")
        .select("id, member_id, check_in_time, check_out_time, status")
        .eq("tenant_id", tenantId)
        .gte("check_in_time", formatDateTime(todayStart))
        .lte("check_in_time", formatDateTime(todayEnd))
        .in("status", ["checked_in", "completed"]);

      // Count unique members who checked in today and haven't checked out
      const membersInGym = new Set(
        (todayCheckIns || [])
          .filter(booking => !booking.check_out_time || booking.status === "checked_in")
          .map(booking => booking.member_id)
      ).size;

      // Get yesterday's count for comparison
      const { data: yesterdayCheckIns } = await supabase
        .from("class_bookings")
        .select("id, member_id, check_in_time, check_out_time, status")
        .eq("tenant_id", tenantId)
        .gte("check_in_time", formatDateTime(yesterdayStart))
        .lte("check_in_time", formatDateTime(yesterdayEnd))
        .in("status", ["checked_in", "completed"]);

      const yesterdayMembersInGym = new Set(
        (yesterdayCheckIns || [])
          .filter(booking => !booking.check_out_time || booking.status === "checked_in")
          .map(booking => booking.member_id)
      ).size;

      const membersChange = membersInGym - yesterdayMembersInGym;

      // Fetch classes currently running (in_progress status)
      const { data: runningClasses } = await supabase
        .from("classes")
        .select("id, status, start_time, end_time")
        .eq("tenant_id", tenantId)
        .eq("status", "in_progress")
        .gte("start_time", formatDateTime(todayStart))
        .lte("end_time", formatDateTime(todayEnd));

      // Get yesterday's running classes count
      const { data: yesterdayRunningClasses } = await supabase
        .from("classes")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .eq("status", "in_progress")
        .gte("start_time", formatDateTime(yesterdayStart))
        .lte("end_time", formatDateTime(yesterdayEnd));

      const runningClassesCount = (runningClasses || []).length;
      const yesterdayRunningCount = (yesterdayRunningClasses || []).length;
      const classesChange = runningClassesCount - yesterdayRunningCount;

      setLiveMetrics([
        {
          title: t("dashboard.membersInGym"),
          value: membersInGym.toString(),
          icon: <FiUsers className="h-5 w-5" />,
          color: "green",
          change: membersChange,
          status: membersInGym > 0 ? "active" : "stable",
        },
        {
          title: t("dashboard.classesRunning"),
          value: runningClassesCount.toString(),
          icon: <FiActivity className="h-5 w-5" />,
          color: "blue",
          change: classesChange,
          status: runningClassesCount > 0 ? "active" : "stable",
        },
      ]);
    } catch (error) {
      console.error("Error fetching live activity data:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  useEffect(() => {
    fetchLiveData();
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveData, refreshKey]);

  const { isRTL } = useRTL();
  return (
    <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
            <FiActivity className="text-green-600 dark:text-green-400 text-xl" />
          </div>
          <div className="text-start">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
              {t("dashboard.liveActivity")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("dashboard.realtimeGymStatus")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>{t("dashboard.live")}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 hover:shadow-sm dark:hover:shadow-gray-900/20 transition-all duration-200 text-start"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between mb-3 gap-2">
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
                metric.status === "active" ? "bg-green-500" : "bg-blue-500"
              }`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">{metric.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
