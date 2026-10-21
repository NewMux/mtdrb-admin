import React, { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiUserPlus,
  FiArrowUpRight,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { StatStrip } from "../ui/StatStrip";
import { useRTL } from "../../hooks/useRTL";
import { countMembersActiveAsOf, isMemberCurrentlyActive } from "../../utils/memberActivity";

const MemberEngagement: React.FC = () => {
  interface EngagementMetric {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: "blue" | "green";
    change: number | null;
    trend: "up" | "down" | "neutral";
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
      const [allMembers, newSignups, previousNewSignups] = await Promise.all([
        supabase
          .from("members")
          .select("id, created_at, join_date, expiry_date, status, membership_status")
          .eq("tenant_id", tenantId),
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
        allMembers.error ||
        newSignups.error ||
        previousNewSignups.error;
      if (firstError) throw firstError;

      // Compare "active members today" against "members who would have
      // counted as active a week ago" (approximated from join_date/
      // expiry_date), not against "members who signed up in the last
      // week" - the latter is a different, much smaller population.
      const currentCount = (allMembers.data || []).filter(isMemberCurrentlyActive).length;
      const previousCount = countMembersActiveAsOf(allMembers.data || [], lastWeek);
      const memberChange = previousCount > 0 ? currentCount - previousCount : null;

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
          trend: memberChange === null ? "neutral" : memberChange >= 0 ? "up" : "down",
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
    <section className="space-y-3" dir={isRTL ? "rtl" : "ltr"}>
      <div className="text-start">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t("dashboard.memberEngagement")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.memberActivityAndGrowth")}</p>
      </div>

      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {t("dashboard.failedToLoadData", "Failed to load engagement data")}
        </div>
      )}

      <StatStrip
        items={engagementMetrics.map((metric) => ({
          label: metric.title,
          value: metric.value,
          detail: (
            <span
              className={`inline-flex items-center gap-0.5 ${
                metric.trend === "up"
                  ? "text-green-600 dark:text-green-500"
                  : metric.trend === "down"
                    ? "text-red-500"
                    : ""
              }`}
            >
              {metric.trend !== "neutral" && (
                <FiArrowUpRight
                  className={`h-3 w-3 ${isRTL ? "rtl-flip" : ""} ${metric.trend === "down" ? "rotate-90" : ""}`}
                />
              )}
              {metric.change === null
                ? t("dashboard.notEnoughData", "Not enough data")
                : `${metric.change > 0 ? "+" : ""}${metric.change}`}
            </span>
          ),
        }))}
      />
    </section>
  );
};

export default MemberEngagement;
