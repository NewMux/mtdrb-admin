import React, { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiActivity,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { StatStrip } from "../ui/StatStrip";
import { useRTL } from "../../hooks/useRTL";

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
  const [loadError, setLoadError] = useState(false);

  const fetchLiveData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setLoadError(false);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      const formatDateTime = (date: Date) => date.toISOString();

      // Fetch members currently in gym (checked in today and not checked out)
      const { data: todayCheckIns, error: todayCheckInsError } = await supabase
        .from("class_bookings")
        .select("id, member_id, check_in_time, check_out_time, status")
        .eq("tenant_id", tenantId)
        .gte("check_in_time", formatDateTime(todayStart))
        .lte("check_in_time", formatDateTime(todayEnd))
        .in("status", ["checked_in", "completed"]);
      if (todayCheckInsError) throw todayCheckInsError;

      // Count unique members who checked in today and haven't checked out
      const membersInGym = new Set(
        (todayCheckIns || [])
          .filter(booking => booking.status === "checked_in" && !booking.check_out_time)
          .map(booking => booking.member_id)
      ).size;

      // Get yesterday's count for comparison
      const { data: yesterdayCheckIns, error: yesterdayCheckInsError } = await supabase
        .from("class_bookings")
        .select("id, member_id, check_in_time, check_out_time, status")
        .eq("tenant_id", tenantId)
        .gte("check_in_time", formatDateTime(yesterdayStart))
        .lte("check_in_time", formatDateTime(yesterdayEnd))
        .in("status", ["checked_in", "completed"]);
      if (yesterdayCheckInsError) throw yesterdayCheckInsError;

      const yesterdayMembersInGym = new Set(
        (yesterdayCheckIns || [])
          .filter(booking => booking.status === "checked_in" && !booking.check_out_time)
          .map(booking => booking.member_id)
      ).size;

      const membersChange = membersInGym - yesterdayMembersInGym;

      // Fetch classes currently running (in_progress status)
      const { data: runningClasses, error: runningClassesError } = await supabase
        .from("classes")
        .select("id, status, start_time, end_time")
        .eq("tenant_id", tenantId)
        .eq("status", "in_progress")
        .gte("start_time", formatDateTime(todayStart))
        .lte("end_time", formatDateTime(todayEnd));
      if (runningClassesError) throw runningClassesError;

      // Get yesterday's running classes count
      const { data: yesterdayRunningClasses, error: yesterdayRunningClassesError } = await supabase
        .from("classes")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .eq("status", "in_progress")
        .gte("start_time", formatDateTime(yesterdayStart))
        .lte("end_time", formatDateTime(yesterdayEnd));
      if (yesterdayRunningClassesError) throw yesterdayRunningClassesError;

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
      setLoadError(true);
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
    <section className="space-y-3" dir={isRTL ? "rtl" : "ltr"}>
      <div className="text-start">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t("dashboard.liveActivity")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.realtimeGymStatus")}</p>
      </div>

      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {t("dashboard.failedToLoadData", "Failed to load business overview data")}
        </div>
      )}

      <StatStrip
        items={liveMetrics.map((metric) => ({
          label: metric.title,
          value: metric.value,
          detail: `${metric.change > 0 ? "+" : ""}${metric.change} ${t("dashboard.vsYesterday", "vs yesterday")}`,
        }))}
      />
    </section>
  );
};
