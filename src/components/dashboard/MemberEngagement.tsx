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
import { countMembersActiveAsOf, isMemberCurrentlyActive, type MemberActivityRow } from "../../utils/memberActivity";
import { fetchAllRows } from "../../utils/fetchAllRows";

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
      const DAY = 24 * 60 * 60 * 1000;
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * DAY);
      // Two equal rolling 30-day windows, as full instants: "signups in the last
      // 30 days" against "the 30 days before that". (The old code compared a
      // bare date with a timestamptz column, which drops the whole last day, and
      // its two windows were different lengths.)
      const windowStart = new Date(now.getTime() - 30 * DAY).toISOString();
      const previousWindowStart = new Date(now.getTime() - 60 * DAY).toISOString();

      // All members, paged: the active count must not stop at PostgREST's 1000-row cap.
      const allMembers = await fetchAllRows<MemberActivityRow>((from, to) =>
        supabase
          .from("members")
          .select("created_at, join_date, expiry_date, status, membership_status")
          .eq("tenant_id", tenantId)
          .order("id", { ascending: true })
          .range(from, to),
      );
      // Signups are only counted.
      const [newSignups, previousNewSignups] = await Promise.all([
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", windowStart)
          .lte("created_at", now.toISOString()),
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", previousWindowStart)
          .lt("created_at", windowStart),
      ]);

      const firstError = newSignups.error || previousNewSignups.error;
      if (firstError) throw firstError;

      // Compare "active members today" against "members who would have
      // counted as active a week ago" (approximated from join_date/
      // expiry_date), not against "members who signed up in the last
      // week" - the latter is a different, much smaller population.
      const currentCount = allMembers.filter(isMemberCurrentlyActive).length;
      const previousCount = countMembersActiveAsOf(allMembers, lastWeek);
      const memberChange = previousCount > 0 ? currentCount - previousCount : null;

      const newSignupsCount = newSignups.count ?? 0;
      const previousNewSignupsCount = previousNewSignups.count ?? 0;
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
