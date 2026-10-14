import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiStar,
  FiEdit2,
} from "react-icons/fi";
import { SmartDashboardOverview } from "./SmartDashboardOverview";
import { LiveKPITracker } from "./LiveKPITracker";
import MemberEngagement from "./MemberEngagement";
import BusinessOverview from "./BusinessOverview";
import { SetTargetsModal } from "./SetTargetsModal";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from "../../config/runtimeConfig";
import { monthBoundary } from "../../utils/periodBoundaries";
import { fetchAllRows } from "../../utils/fetchAllRows";
import { countMembersActiveAsOf, isMemberCurrentlyActive } from "../../utils/memberActivity";

// Color mappings for KPI cards to ensure Tailwind classes work properly
const kpiColorMap = {
  green: {
    iconBg: "bg-green-50 dark:bg-green-900/30",
    iconText: "text-green-600 dark:text-green-400",
    progressBar: "bg-green-500 dark:bg-green-400",
  },
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconText: "text-blue-600 dark:text-blue-400",
    progressBar: "bg-blue-500 dark:bg-blue-400",
  },
  purple: {
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconText: "text-purple-600 dark:text-purple-400",
    progressBar: "bg-purple-500 dark:bg-purple-400",
  },
  yellow: {
    iconBg: "bg-yellow-50 dark:bg-yellow-900/30",
    iconText: "text-yellow-600 dark:text-yellow-400",
    progressBar: "bg-yellow-500 dark:bg-yellow-400",
  },
};

interface DashboardOverviewProps {
  refreshKey: number;
}

interface DashboardTargets {
  revenue?: number;
  activeMembers?: number;
  classAttendance?: number;
  memberSatisfaction?: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  refreshKey 
}) => {
  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [savedTargets, setSavedTargets] = useState<DashboardTargets | null>(null);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [primaryStats, setPrimaryStats] = useState([
    {
      name: t("dashboard.totalRevenue"),
      value: "$0",
      change: t("common.loading"),
      icon: <FiDollarSign className="w-6 h-6" />,
      color: "green" as const,
      target: null as string | null,
      progress: null as number | null,
    },
    {
      name: t("dashboard.activeMembers"),
      value: "0",
      change: t("common.loading"),
      icon: <FiUsers className="w-6 h-6" />,
      color: "blue" as const,
      target: null as string | null,
      progress: null as number | null,
    },
    {
      name: t("dashboard.classAttendance"),
      value: "0%",
      change: t("common.loading"),
      icon: <FiCalendar className="w-6 h-6" />,
      color: "purple" as const,
      target: null as string | null,
      progress: null as number | null,
    },
    {
      name: t("dashboard.memberSatisfaction"),
      value: "0/5",
      change: t("common.loading"),
      icon: <FiStar className="w-6 h-6" />,
      color: "yellow" as const,
      target: null as string | null,
      progress: null as number | null,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setLoadError(false);

      const now = new Date();
      // Month boundaries are full ISO instants in the gym's timezone with an
      // exclusive upper bound (see periodBoundaries.ts) - not
      // toISOString().split("T")[0], which shifts the month start by a day
      // in UTC+3 and, via .lte(<bare date>), drops everything created on
      // the last day of the previous month after midnight UTC.
      const currentMonth = monthBoundary(now, 0, DEFAULT_TIMEZONE);
      const previousMonth = monthBoundary(now, 1, DEFAULT_TIMEZONE);
      // previousMonth's exclusive end is exactly currentMonth's start.
      const previousMonthEnd = new Date(currentMonth.startISO);

      // Every query is paged (fetchAllRows): PostgREST caps a response at
      // 1000 rows and these totals would silently stop growing past that.
      const paidInvoicesBetween = (startISO: string, endExclusiveISO: string) =>
        fetchAllRows((from, to) =>
          supabase
            .from("invoices")
            .select("amount, total, status")
            .eq("tenant_id", tenantId)
            .eq("status", "paid")
            .gte("created_at", startISO)
            .lt("created_at", endExclusiveISO)
            .order("id")
            .range(from, to),
        );
      const bookingsBetween = (startISO: string, endExclusiveISO: string) =>
        fetchAllRows((from, to) =>
          supabase
            .from("class_bookings")
            .select("id, status")
            .eq("tenant_id", tenantId)
            .gte("created_at", startISO)
            .lt("created_at", endExclusiveISO)
            .order("id")
            .range(from, to),
        );

      const [currentInvoices, previousInvoices, allMembers, currentBookings, previousBookings] =
        await Promise.all([
          paidInvoicesBetween(currentMonth.startISO, currentMonth.endExclusiveISO),
          paidInvoicesBetween(previousMonth.startISO, previousMonth.endExclusiveISO),
          fetchAllRows((from, to) =>
            supabase
              .from("members")
              .select("id, created_at, join_date, expiry_date, status, membership_status")
              .eq("tenant_id", tenantId)
              .order("id")
              .range(from, to),
          ),
          bookingsBetween(currentMonth.startISO, currentMonth.endExclusiveISO),
          bookingsBetween(previousMonth.startISO, previousMonth.endExclusiveISO),
        ]);

      // Calculate revenue
      const currentRevenue = currentInvoices.reduce(
        (sum, inv) => sum + Number(inv.total || inv.amount || 0),
        0
      );
      const previousRevenue = previousInvoices.reduce(
        (sum, inv) => sum + Number(inv.total || inv.amount || 0),
        0
      );
      const revenueChange = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      // Compare "active members now" against "members who would have
      // counted as active at the end of last month" (approximated from
      // join_date/expiry_date - see memberActivity.ts), not against
      // "active members who signed up last month": that is a different,
      // much smaller population and made the change meaningless (C8).
      const currentMemberCount = allMembers.filter(isMemberCurrentlyActive).length;
      const previousMemberCount = countMembersActiveAsOf(allMembers, previousMonthEnd);
      const memberChange = currentMemberCount - previousMemberCount;

      // Calculate attendance
      const currentAttended = currentBookings.filter(
        b => b.status === "checked_in" || b.status === "completed"
      ).length;
      const currentTotal = currentBookings.length;
      const currentAttendanceRate = currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;

      const previousAttended = previousBookings.filter(
        b => b.status === "checked_in" || b.status === "completed"
      ).length;
      const previousTotal = previousBookings.length;
      const previousAttendanceRate = previousTotal > 0 ? (previousAttended / previousTotal) * 100 : 0;
      const attendanceChange = currentAttendanceRate - previousAttendanceRate;

      // Get currency and targets from settings
      const { data: settings } = await supabase
        .from("gym_settings")
        .select("currency, metadata")
        .eq("tenant_id", tenantId)
        .single();

      const settingsCurrency = settings?.currency || DEFAULT_CURRENCY;
      setCurrency(settingsCurrency);
      const currencySymbol = settingsCurrency || "";

      // Extract targets from metadata
      const metadata = settings?.metadata as { dashboardTargets?: DashboardTargets } | null;
      const targets = metadata?.dashboardTargets || null;
      setSavedTargets(targets);

      // Calculate average trainer rating as proxy for member satisfaction
      const { data: trainers } = await supabase
        .from("trainers")
        .select("rating")
        .eq("tenant_id", tenantId)
        .not("rating", "is", null);

      const avgRating = trainers && trainers.length > 0
        ? trainers.reduce((sum, t) => sum + Number(t.rating || 0), 0) / trainers.length
        : 0;

      const satisfactionValue = avgRating > 0 ? `${avgRating.toFixed(1)}/5` : t("dashboard.notAvailable");
      const satisfactionChange = avgRating > 0 ? t("dashboard.basedOnTrainerRatings") : t("dashboard.noRatingData");

      // Targets are only ever the admin's saved ones (SetTargetsModal).
      // With none saved, the card shows no target and no progress bar -
      // it used to invent one (revenue x1.1, members x1.05, 85%, 4.8).
      const revenueTarget = targets?.revenue ?? null;
      const membersTarget = targets?.activeMembers ?? null;
      const attendanceTarget = targets?.classAttendance ?? null;
      const satisfactionTarget = targets?.memberSatisfaction ?? null;

      const revenueTargetDisplay =
        revenueTarget === null ? null : `${currencySymbol} ${revenueTarget.toLocaleString()}`;
      const membersTargetDisplay = membersTarget === null ? null : membersTarget.toLocaleString();
      const attendanceTargetDisplay = attendanceTarget === null ? null : `${attendanceTarget}%`;
      const satisfactionTargetDisplay =
        satisfactionTarget === null ? null : satisfactionTarget.toFixed(1);

      // Progress toward a saved target; null (no bar) when there is none.
      const progressToward = (current: number, target: number | null) =>
        target === null ? null : target > 0 ? Math.min(100, (current / target) * 100) : 0;
      const revenueProgress = progressToward(currentRevenue, revenueTarget);
      const membersProgress = progressToward(currentMemberCount, membersTarget);
      const attendanceProgress = progressToward(currentAttendanceRate, attendanceTarget);
      const satisfactionProgress = progressToward(avgRating, satisfactionTarget);

      setPrimaryStats([
        {
          name: t("dashboard.totalRevenue"),
          value: `${currencySymbol} ${currentRevenue.toLocaleString()}`,
          change: revenueChange >= 0
            ? `+${currencySymbol} ${Math.abs(currentRevenue - previousRevenue).toLocaleString()} ${t("dashboard.vsLastMonth")}`
            : `-${currencySymbol} ${Math.abs(currentRevenue - previousRevenue).toLocaleString()} ${t("dashboard.vsLastMonth")}`,
          icon: <FiDollarSign className="w-6 h-6" />,
          color: "green" as const,
          target: revenueTargetDisplay,
          progress: revenueProgress,
        },
        {
          name: t("dashboard.activeMembers"),
          value: currentMemberCount.toLocaleString(),
          change: memberChange >= 0
            ? `+${memberChange} ${t("dashboard.vsLastMonth")}`
            : `${memberChange} ${t("dashboard.vsLastMonth")}`,
          icon: <FiUsers className="w-6 h-6" />,
          color: "blue" as const,
          target: membersTargetDisplay,
          progress: membersProgress,
        },
        {
          name: t("dashboard.classAttendance"),
          value: `${currentAttendanceRate.toFixed(1)}%`,
          change: attendanceChange >= 0
            ? `+${attendanceChange.toFixed(1)}% ${t("dashboard.vsLastMonth")}`
            : `${attendanceChange.toFixed(1)}% ${t("dashboard.vsLastMonth")}`,
          icon: <FiCalendar className="w-6 h-6" />,
          color: "purple" as const,
          target: attendanceTargetDisplay,
          progress: attendanceProgress,
        },
        {
          name: t("dashboard.memberSatisfaction"),
          value: satisfactionValue,
          change: satisfactionChange,
          icon: <FiStar className="w-6 h-6" />,
          color: "yellow" as const,
          target: satisfactionTargetDisplay,
          progress: satisfactionProgress,
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {t("dashboard.failedToLoadData", "Failed to load dashboard data")}
        </div>
      )}

      {/* Primary Stats - Enhanced 2x2 Grid with Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {primaryStats.map((stat, index) => {
          const colors = kpiColorMap[stat.color];
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <div 
                dir={isRTL ? "rtl" : "ltr"}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 text-start"
              >
                {/* Header: Icon on start side, Target button on end side */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${colors.iconBg} ${colors.iconText} flex-shrink-0`}>
                    {stat.icon}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTargetsModal(true);
                    }}
                    className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2.5 py-1 transition-all text-start"
                    title={t("dashboard.targets.setTargets")}
                    type="button"
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("dashboard.target")}</div>
                      <FiEdit2 className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-end">
                      {stat.target ?? t("dashboard.targets.notSet")}
                    </div>
                  </button>
                </div>
                
                {/* Value & Name */}
                <div className="mb-4 text-start">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</div>
                </div>
                
                {/* Progress Bar - only toward a target the admin actually saved */}
                {stat.progress === null ? (
                  <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {t("dashboard.targets.noTargetHint")}
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">{t("dashboard.progress")}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{Math.round(stat.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors.progressBar} transition-all duration-300`}
                        style={{ width: `${Math.min(stat.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Footer: Change message & Live indicator */}
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{stat.change}</span>
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 flex-shrink-0">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                    <span className="text-xs font-medium">{t("dashboard.live")}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content - Enhanced Single Column Layout */}
      <div className="space-y-8">
        <SmartDashboardOverview refreshKey={refreshKey} />
        <BusinessOverview />
        <LiveKPITracker />
        <MemberEngagement />
      </div>

      {/* Set Targets Modal */}
      <SetTargetsModal
        isOpen={showTargetsModal}
        onClose={() => setShowTargetsModal(false)}
        onSave={() => {
          fetchStats();
        }}
        currentTargets={savedTargets || undefined}
        currency={currency}
      />
    </div>
  );
}; 