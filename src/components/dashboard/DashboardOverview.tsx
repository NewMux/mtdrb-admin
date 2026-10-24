import React, { useState, useEffect, useCallback } from "react";
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
import { StatStrip } from "../ui/StatStrip";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useGymConfig } from "../../contexts/gym-config-context";
import { monthBoundary, toZonedDateString } from "../../utils/periodBoundaries";
import { fetchAllRows } from "../../utils/fetchAllRows";

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

interface PrimaryStat {
  name: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: keyof typeof kpiColorMap;
  /** null = the gym has not set a target for this KPI: none is invented. */
  target: string | null;
  progress: number | undefined;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  refreshKey 
}) => {
  const { config: gymConfig } = useGymConfig();
  const timezone = gymConfig.timezone;

  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [savedTargets, setSavedTargets] = useState<DashboardTargets | null>(null);
  const [currency, setCurrency] = useState(gymConfig.currency);
  const [primaryStats, setPrimaryStats] = useState<PrimaryStat[]>([
    {
      name: t("dashboard.totalRevenue"),
      value: "$0",
      change: t("common.loading"),
      icon: <FiDollarSign className="w-6 h-6" />,
      color: "green" as const,
      target: null,
      progress: undefined,
    },
    {
      name: t("dashboard.activeMembers"),
      value: "0",
      change: t("common.loading"),
      icon: <FiUsers className="w-6 h-6" />,
      color: "blue" as const,
      target: null,
      progress: undefined,
    },
    {
      name: t("dashboard.classAttendance"),
      value: "0%",
      change: t("common.loading"),
      icon: <FiCalendar className="w-6 h-6" />,
      color: "purple" as const,
      target: null,
      progress: undefined,
    },
    {
      name: t("dashboard.memberSatisfaction"),
      value: "0/5",
      change: t("common.loading"),
      icon: <FiStar className="w-6 h-6" />,
      color: "yellow" as const,
      target: null,
      progress: undefined,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setLoadError(false);

      // Month boundaries are full instants in the gym's timezone with an
      // exclusive upper bound (see periodBoundaries.ts). The old code compared a
      // bare date to a timestamptz column, which silently dropped the whole last
      // day of every range and shifted the month start by a day in UTC+3.
      const now = new Date();
      const currentMonth = monthBoundary(now, 0, timezone);
      const previousMonth = monthBoundary(now, 1, timezone);

      // Fetch invoices for revenue. Paged: a money total must not stop growing
      // at PostgREST's 1000-row cap.
      const invoicesIn = (period: { startISO: string; endExclusiveISO: string }) =>
        fetchAllRows<{ amount: number | null; total: number | null; status: string }>((from, to) =>
          supabase
            .from("invoices")
            .select("amount, total, status")
            .eq("tenant_id", tenantId)
            .eq("status", "paid")
            .gte("created_at", period.startISO)
            .lt("created_at", period.endExclusiveISO)
            .order("id", { ascending: true })
            .range(from, to),
        );
      const [currentInvoices, previousInvoices] = await Promise.all([
        invoicesIn(currentMonth),
        invoicesIn(previousMonth),
      ]);

      // Members: only the counts are used, so ask the database to count (a
      // plain select would be capped at 1000 rows and under-report big gyms).
      // The previous figure is where the gym stood at the END of last month
      // (joined by then, not yet expired) - the same rule as memberActivity.ts -
      // not "members who joined last month", a much smaller group.
      const previousMonthLastDay = toZonedDateString(new Date(Date.parse(previousMonth.endExclusiveISO) - 1), timezone);
      const [currentMembers, previousMembers] = await Promise.all([
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .in("status", ["active"])
          .in("membership_status", ["active", "trial"]),
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .lte("join_date", previousMonthLastDay)
          .or(`expiry_date.is.null,expiry_date.gt.${previousMonthLastDay}`),
      ]);

      const memberError = currentMembers.error || previousMembers.error;
      if (memberError) throw memberError;

      // Class bookings for the attendance rate: counts only (total, and attended).
      const bookingCount = (period: { startISO: string; endExclusiveISO: string }, attendedOnly: boolean) => {
        let query = supabase
          .from("class_bookings")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", period.startISO)
          .lt("created_at", period.endExclusiveISO);
        if (attendedOnly) query = query.in("status", ["checked_in", "completed"]);
        return query;
      };
      const [currentBookingsTotal, currentBookingsAttended, previousBookingsTotal, previousBookingsAttended] =
        await Promise.all([
          bookingCount(currentMonth, false),
          bookingCount(currentMonth, true),
          bookingCount(previousMonth, false),
          bookingCount(previousMonth, true),
        ]);

      const bookingError =
        currentBookingsTotal.error ||
        currentBookingsAttended.error ||
        previousBookingsTotal.error ||
        previousBookingsAttended.error;
      if (bookingError) throw bookingError;

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

      // Calculate members
      const currentMemberCount = currentMembers.count ?? 0;
      const previousMemberCount = previousMembers.count ?? 0;
      const memberChange = currentMemberCount - previousMemberCount;

      // Calculate attendance
      const currentAttended = currentBookingsAttended.count ?? 0;
      const currentTotal = currentBookingsTotal.count ?? 0;
      const currentAttendanceRate = currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;

      const previousAttended = previousBookingsAttended.count ?? 0;
      const previousTotal = previousBookingsTotal.count ?? 0;
      const previousAttendanceRate = previousTotal > 0 ? (previousAttended / previousTotal) * 100 : 0;
      const attendanceChange = currentAttendanceRate - previousAttendanceRate;

      // Get currency and targets from settings
      const { data: settings } = await supabase
        .from("gym_settings")
        .select("currency, metadata")
        .eq("tenant_id", tenantId)
        .single();

      const settingsCurrency = settings?.currency || gymConfig.currency;
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

      // Targets are only what the gym has set (Set Targets). The old fallbacks -
      // 110% of this month's revenue, 105% of today's members - made every card
      // read about 91% "progress" whatever happened. With no target there is
      // nothing to measure against, so the card says so and shows no meter.
      const revenueTarget = targets?.revenue || null;
      const membersTarget = targets?.activeMembers || null;
      const attendanceTarget = targets?.classAttendance || null;
      const satisfactionTarget = targets?.memberSatisfaction || null;

      const revenueTargetDisplay = revenueTarget ? `${currencySymbol} ${revenueTarget.toLocaleString()}` : null;
      const membersTargetDisplay = membersTarget ? membersTarget.toLocaleString() : null;
      const attendanceTargetDisplay = attendanceTarget ? `${attendanceTarget}%` : null;
      const satisfactionTargetDisplay = satisfactionTarget ? satisfactionTarget.toFixed(1) : null;

      const progressOf = (value: number, target: number | null) =>
        target ? Math.min(100, (value / target) * 100) : undefined;
      const revenueProgress = progressOf(currentRevenue, revenueTarget);
      const membersProgress = progressOf(currentMemberCount, membersTarget);
      const attendanceProgress = progressOf(currentAttendanceRate, attendanceTarget);
      const satisfactionProgress = avgRating > 0 ? progressOf(avgRating, satisfactionTarget) : undefined;

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
  }, [tenantId, t, timezone, gymConfig.currency]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {t("dashboard.failedToLoadData", "Failed to load dashboard data")}
        </div>
      )}

      {/* Primary Stats */}
      <StatStrip
        items={primaryStats.map((stat) => ({
          label: stat.name,
          value: stat.value,
          meter: stat.progress,
          meterClass: kpiColorMap[stat.color].progressBar,
          detail: stat.change,
          accessory: (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTargetsModal(true);
              }}
              className="group inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex-shrink-0"
              title={t("dashboard.targets.setTargets")}
              type="button"
            >
              <span className="whitespace-nowrap">
                {stat.target ? `${t("dashboard.target")} ${stat.target}` : t("dashboard.targets.setTargets")}
              </span>
              <FiEdit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ),
        }))}
      />

      {/* Main Content - Enhanced Single Column Layout */}
      <div className="space-y-6">
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