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
import { DEFAULT_CURRENCY } from "../../config/runtimeConfig";

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
      target: "$0",
      progress: 0,
    },
    {
      name: t("dashboard.activeMembers"),
      value: "0",
      change: t("common.loading"),
      icon: <FiUsers className="w-6 h-6" />,
      color: "blue" as const,
      target: "0",
      progress: 0,
    },
    {
      name: t("dashboard.classAttendance"),
      value: "0%",
      change: t("common.loading"),
      icon: <FiCalendar className="w-6 h-6" />,
      color: "purple" as const,
      target: "85%",
      progress: 0,
    },
    {
      name: t("dashboard.memberSatisfaction"),
      value: "0/5",
      change: t("common.loading"),
      icon: <FiStar className="w-6 h-6" />,
      color: "yellow" as const,
      target: "4.8",
      progress: 0,
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
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Fetch invoices for revenue
      const [currentInvoices, previousInvoices] = await Promise.all([
        supabase
          .from("invoices")
          .select("amount, total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", formatDate(currentMonthStart)),
        supabase
          .from("invoices")
          .select("amount, total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", formatDate(previousMonthStart))
          .lte("created_at", formatDate(previousMonthEnd)),
      ]);

      // Fetch members
      const [currentMembers, previousMembers] = await Promise.all([
        supabase
          .from("members")
          .select("id, status, membership_status, created_at")
          .eq("tenant_id", tenantId)
          .in("status", ["active"])
          .in("membership_status", ["active", "trial"]),
        supabase
          .from("members")
          .select("id, status, membership_status, created_at")
          .eq("tenant_id", tenantId)
          .in("status", ["active"])
          .in("membership_status", ["active", "trial"])
          .gte("created_at", formatDate(previousMonthStart))
          .lte("created_at", formatDate(previousMonthEnd)),
      ]);

      const invoiceOrMemberError =
        currentInvoices.error ||
        previousInvoices.error ||
        currentMembers.error ||
        previousMembers.error;
      if (invoiceOrMemberError) throw invoiceOrMemberError;

      // Fetch class bookings for attendance
      const [currentBookings, previousBookings] = await Promise.all([
        supabase
          .from("class_bookings")
          .select("id, status")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(currentMonthStart)),
        supabase
          .from("class_bookings")
          .select("id, status")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(previousMonthStart))
          .lte("created_at", formatDate(previousMonthEnd)),
      ]);

      if (currentBookings.error || previousBookings.error) {
        throw currentBookings.error || previousBookings.error;
      }

      // Calculate revenue
      const currentRevenue = (currentInvoices.data || []).reduce(
        (sum, inv) => sum + Number(inv.total || inv.amount || 0),
        0
      );
      const previousRevenue = (previousInvoices.data || []).reduce(
        (sum, inv) => sum + Number(inv.total || inv.amount || 0),
        0
      );
      const revenueChange = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      // Calculate members
      const currentMemberCount = (currentMembers.data || []).length;
      const previousMemberCount = (previousMembers.data || []).length;
      const memberChange = currentMemberCount - previousMemberCount;

      // Calculate attendance
      const currentAttended = (currentBookings.data || []).filter(
        b => b.status === "checked_in" || b.status === "completed"
      ).length;
      const currentTotal = (currentBookings.data || []).length;
      const currentAttendanceRate = currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;

      const previousAttended = (previousBookings.data || []).filter(
        b => b.status === "checked_in" || b.status === "completed"
      ).length;
      const previousTotal = (previousBookings.data || []).length;
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

      // Calculate targets: use saved targets or fallback to calculated defaults
      const revenueTarget = targets?.revenue ?? (currentRevenue * 1.1);
      const membersTarget = targets?.activeMembers ?? (currentMemberCount * 1.05);
      const attendanceTarget = targets?.classAttendance ?? 85;
      const satisfactionTarget = targets?.memberSatisfaction ?? 4.8;

      // Format targets for display
      const revenueTargetDisplay = `${currencySymbol} ${revenueTarget.toLocaleString()}`;
      const membersTargetDisplay = membersTarget.toLocaleString();
      const attendanceTargetDisplay = `${attendanceTarget}%`;
      const satisfactionTargetDisplay = satisfactionTarget.toFixed(1);

      // Calculate progress percentages
      const revenueProgress = revenueTarget > 0 ? Math.min(100, (currentRevenue / revenueTarget) * 100) : 0;
      const membersProgress = membersTarget > 0 ? Math.min(100, (currentMemberCount / membersTarget) * 100) : 0;
      const attendanceProgress = Math.min(100, (currentAttendanceRate / attendanceTarget) * 100);
      const satisfactionProgress = avgRating > 0 ? Math.min(100, (avgRating / satisfactionTarget) * 100) : 0;

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
                {t("dashboard.target")} {stat.target}
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