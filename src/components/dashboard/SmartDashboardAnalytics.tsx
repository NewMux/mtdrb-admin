import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiStar,
  FiTarget,
} from "react-icons/fi";
import { SmartAnalyticsHeader, PerformanceMetricsCard } from "../ui";
import { supabase } from "../../supabaseClient";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import { DEFAULT_CURRENCY } from "../../config/runtimeConfig";
import { fetchAllRows } from "../../utils/fetchAllRows";
import { getDateRange } from "../../utils/dashboardRange";
import { getCurrencyDecimals, resolveInvoiceGrossAmount } from "../../utils/invoiceMath";
import { countMembersActiveAsOf, isMemberCurrentlyActive, type MemberActivityRow } from "../../utils/memberActivity";

interface SmartDashboardAnalyticsProps {
  refreshKey: number;
}

interface DashboardMetric {
  name: string;
  current: number;
  /** null = there is no earlier period to compare with (not "zero"). */
  previous: number | null;
  /** null = the gym has not set a target for this KPI: none is invented. */
  target: number | null;
  trend: "up" | "down" | "stable";
  format?: "currency" | "percentage" | "number" | "decimal";
  suffix?: string;
  icon?: React.ReactNode;
  color?: string;
}

const formatCurrency = (value: number, currency: string) => {
  const decimals = getCurrencyDecimals(currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

export default function SmartDashboardAnalytics({
  refreshKey,
}: SmartDashboardAnalyticsProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetric[]>([]);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  // The KPI targets this gym saved with "Set Targets" on the dashboard.
  const [targets, setTargets] = useState<{
    revenue?: number;
    activeMembers?: number;
    classAttendance?: number;
    memberSatisfaction?: number;
  } | null>(null);
  const [revenueData, setRevenueData] = useState({
    current: 0,
    previous: 0,
  });
  const [memberData, setMemberData] = useState({
    current: 0,
    previous: 0,
    newCount: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant_id
      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }

      if (!tenantId) return;

      const { currentStart, currentEnd, previousStart, previousEnd } =
        getDateRange(selectedTimeRange);

      // Full instants, not bare dates: comparing a date string with a
      // timestamptz column means "midnight UTC at the start of that day", which
      // dropped the whole last day of every range (today's rows never showed).
      const cur = { startISO: currentStart.toISOString(), endISO: currentEnd.toISOString() };
      const prev = { startISO: previousStart.toISOString(), endISO: previousEnd.toISOString() };

      const { data: settingsRow } = await supabase
        .from("gym_settings")
        .select("currency, metadata")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      setCurrency(settingsRow?.currency || DEFAULT_CURRENCY);
      const savedTargets =
        (settingsRow?.metadata as { dashboardTargets?: NonNullable<typeof targets> } | null)?.dashboardTargets ?? null;
      setTargets(savedTargets);

      // Revenue from paid invoices (gross, like the rest of the app). Paged so a
      // money total does not stop growing at PostgREST's 1000-row cap.
      const revenueIn = async (period: { startISO: string; endISO: string }) => {
        const invoices = await fetchAllRows<{ amount: number | null; total: number | null }>((from, to) =>
          supabase
            .from("invoices")
            .select("amount, total")
            .eq("tenant_id", tenantId)
            .eq("status", "paid")
            .gte("created_at", period.startISO)
            .lte("created_at", period.endISO)
            .order("id", { ascending: true })
            .range(from, to),
        );
        return invoices.reduce((sum, inv) => sum + resolveInvoiceGrossAmount(inv), 0);
      };
      const [currentRevenue, previousRevenue] = await Promise.all([revenueIn(cur), revenueIn(prev)]);

      setRevenueData({ current: currentRevenue, previous: previousRevenue });

      // Members: one paged read, then the same point-in-time estimate the
      // overview dashboard uses (join/expiry dates) instead of "current minus
      // new", which ignored everyone who left.
      const members = await fetchAllRows<MemberActivityRow>((from, to) =>
        supabase
          .from("members")
          .select("status, join_date, created_at, expiry_date")
          .eq("tenant_id", tenantId)
          .order("id", { ascending: true })
          .range(from, to),
      );
      const currentActiveMembers = members.filter(isMemberCurrentlyActive).length;
      const previousActiveMembers = countMembersActiveAsOf(members, previousEnd);
      const newMembersCount = members.filter((m) => {
        const joined = new Date(m.join_date || m.created_at || "");
        return joined >= currentStart && joined <= currentEnd;
      }).length;

      setMemberData({
        current: currentActiveMembers,
        previous: previousActiveMembers,
        newCount: newMembersCount,
      });

      // Class attendance: bookings are only counted, capacity is summed.
      const bookingsIn = (period: { startISO: string; endISO: string }) =>
        supabase
          .from("class_bookings")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "booked")
          .gte("created_at", period.startISO)
          .lte("created_at", period.endISO);
      const capacityIn = async (period: { startISO: string; endISO: string }) => {
        const classes = await fetchAllRows<{ capacity: number | null }>((from, to) =>
          supabase
            .from("classes")
            .select("capacity")
            .eq("tenant_id", tenantId)
            .gte("start_time", period.startISO)
            .lte("start_time", period.endISO)
            .order("id", { ascending: true })
            .range(from, to),
        );
        return classes.reduce((sum, c) => sum + (c.capacity || 0), 0);
      };
      const [currentBookings, previousBookings, currentCapacity, previousCapacity] = await Promise.all([
        bookingsIn(cur),
        bookingsIn(prev),
        capacityIn(cur),
        capacityIn(prev),
      ]);
      if (currentBookings.error || previousBookings.error) {
        throw currentBookings.error || previousBookings.error;
      }

      // Round the percentage, not the ratio: Math.round(0.62) * 100 is 100.
      const currentAttendance =
        currentCapacity > 0 ? Math.round(((currentBookings.count ?? 0) / currentCapacity) * 100) : 0;
      const previousAttendance =
        previousCapacity > 0 ? Math.round(((previousBookings.count ?? 0) / previousCapacity) * 100) : 0;

      // Fetch trainer ratings
      const trainersData = await supabase
        .from("trainers")
        .select("id, rating")
        .eq("tenant_id", tenantId);

      const ratings =
        trainersData.data?.map((t) => t.rating || 0).filter((r) => r > 0) || [];
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : 4.5;

      // Member retention: share of all members who are currently active.
      const totalMembers = members.length;
      const retentionRate =
        totalMembers > 0 ? Math.round((currentActiveMembers / totalMembers) * 100) : 0;

      // Build metrics array
      const metrics: DashboardMetric[] = [
        {
          name: t("dashboard.totalRevenue"),
          current: currentRevenue,
          previous: previousRevenue,
          target: savedTargets?.revenue || null,
          trend: currentRevenue >= previousRevenue ? "up" : "down",
          format: "currency",
          icon: <FiDollarSign className="h-5 w-5" />,
          color: "green",
        },
        {
          name: t("dashboard.activeMembers"),
          current: currentActiveMembers,
          previous: previousActiveMembers,
          target: savedTargets?.activeMembers || null,
          trend: currentActiveMembers >= previousActiveMembers ? "up" : "down",
          format: "number",
          icon: <FiUsers className="h-5 w-5" />,
          color: "blue",
        },
        {
          name: t("dashboard.classAttendance"),
          current: currentAttendance,
          previous: previousAttendance,
          target: savedTargets?.classAttendance || null,
          trend: currentAttendance >= previousAttendance ? "up" : "down",
          format: "percentage",
          icon: <FiCalendar className="h-5 w-5" />,
          color: "purple",
        },
        {
          name: t("dashboard.trainerRating"),
          current: Math.round(avgRating * 10) / 10,
          previous: null, // ratings are stored as a single current value: there is no history to compare
          target: savedTargets?.memberSatisfaction || null,
          trend: "stable",
          format: "decimal",
          icon: <FiStar className="h-5 w-5" />,
          color: "yellow",
        },
        {
          name: t("dashboard.memberRetention"),
          current: retentionRate,
          previous: null, // no earlier snapshot of retention is kept
          target: null, // retention has no target setting
          trend: "stable",
          format: "percentage",
          icon: <FiTarget className="h-5 w-5" />,
          color: "red",
        },
      ];

      setDashboardMetrics(metrics);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoadError(true);
      // Set empty metrics on error instead of hardcoded fallback
      setDashboardMetrics([
        {
          name: t("dashboard.totalRevenue"),
          current: 0,
          previous: 0,
          target: null,
          trend: "stable",
          format: "currency",
          icon: <FiDollarSign className="h-5 w-5" />,
          color: "green",
        },
        {
          name: t("dashboard.activeMembers"),
          current: 0,
          previous: 0,
          target: null,
          trend: "stable",
          format: "number",
          icon: <FiUsers className="h-5 w-5" />,
          color: "blue",
        },
        {
          name: t("dashboard.classAttendance"),
          current: 0,
          previous: 0,
          target: null,
          trend: "stable",
          format: "percentage",
          icon: <FiCalendar className="h-5 w-5" />,
          color: "purple",
        },
        {
          name: t("dashboard.trainerRating"),
          current: 0,
          previous: 0,
          target: null,
          trend: "stable",
          format: "decimal",
          icon: <FiStar className="h-5 w-5" />,
          color: "yellow",
        },
        {
          name: t("dashboard.memberRetention"),
          current: 0,
          previous: 0,
          target: null,
          trend: "stable",
          format: "percentage",
          icon: <FiTarget className="h-5 w-5" />,
          color: "red",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange, t]);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey, selectedTimeRange, fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <SmartAnalyticsHeader
        title={t("dashboard.analyticsDashboard")}
        subtitle={t("dashboard.comprehensiveBusinessInsights")}
        icon={<FiBarChart className="text-2xl" />}
        gradientFrom="purple-600"
        gradientTo="indigo-700"
        timeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
      />

      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {t("dashboard.failedToLoadData", "Failed to load business overview data")}
        </div>
      )}

      {/* Enhanced Performance Metrics */}
      <PerformanceMetricsCard 
        metrics={dashboardMetrics}
        currency={currency}
        title={t("dashboard.performanceOverview")}
        subtitle={t("dashboard.keyMetricsProgress")}
      />

      {/* Additional Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6"
        >
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3 mb-6`}>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("dashboard.revenueTrends")}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTimeRange === "week"
                  ? t("dashboard.weekly")
                  : selectedTimeRange === "month"
                  ? t("dashboard.monthly")
                  : selectedTimeRange === "quarter"
                  ? t("dashboard.quarterly")
                  : t("dashboard.yearly")}{" "}
                {t("dashboard.revenuePerformance")}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTimeRange === "week" ? t("dashboard.thisWeek") : selectedTimeRange === "month" ? t("dashboard.thisMonth") : selectedTimeRange === "quarter" ? t("dashboard.thisQuarter") : t("dashboard.thisYear")}
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(revenueData.current, currency)}
              </span>
            </div>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTimeRange === "week" ? t("dashboard.previousWeek") : selectedTimeRange === "month" ? t("dashboard.previousMonth") : selectedTimeRange === "quarter" ? t("dashboard.previousQuarter") : t("dashboard.previousYear")}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                {formatCurrency(revenueData.previous, currency)}
              </span>
            </div>
            {targets?.revenue ? (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 bg-green-500 dark:bg-green-400 rounded-full"
                  style={{
                    width: `${Math.min(100, (revenueData.current / targets.revenue) * 100)}%`,
                  }}
                ></div>
              </div>
            ) : null}
            <div
              className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-2 text-sm ${
                revenueData.current >= revenueData.previous
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {revenueData.current >= revenueData.previous ? (
                <FiTrendingUp className="h-4 w-4" />
              ) : (
                <FiTrendingDown className="h-4 w-4" />
              )}
              <span>
                {revenueData.previous > 0
                  ? `${((revenueData.current - revenueData.previous) / revenueData.previous * 100).toFixed(1)}%`
                  : "0%"} {t("dashboard.vsPrevious")} {t(`dashboard.${selectedTimeRange}`)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Member Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6"
        >
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3 mb-6`}>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("dashboard.memberInsights")}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("dashboard.memberEngagementMetrics")}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t("dashboard.activeMembers")}</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {memberData.current.toLocaleString()}
              </span>
            </div>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTimeRange === "week" ? t("dashboard.newThisWeek") : selectedTimeRange === "month" ? t("dashboard.newThisMonth") : selectedTimeRange === "quarter" ? t("dashboard.newThisQuarter") : t("dashboard.newThisYear")}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                +{memberData.newCount}
              </span>
            </div>
            {targets?.activeMembers ? (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 bg-blue-500 dark:bg-blue-400 rounded-full"
                  style={{
                    width: `${Math.min(100, (memberData.current / targets.activeMembers) * 100)}%`,
                  }}
                ></div>
              </div>
            ) : null}
            <div
              className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-2 text-sm ${
                memberData.current >= memberData.previous
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {memberData.current >= memberData.previous ? (
                <FiTrendingUp className="h-4 w-4" />
              ) : (
                <FiTrendingDown className="h-4 w-4" />
              )}
              <span>
                {memberData.previous > 0
                  ? `${((memberData.current - memberData.previous) / memberData.previous * 100).toFixed(1)}%`
                  : "0%"} {t("dashboard.vsPrevious")} {t(`dashboard.${selectedTimeRange}`)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
