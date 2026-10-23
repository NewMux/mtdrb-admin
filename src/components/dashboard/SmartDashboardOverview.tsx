import React, { useState, useEffect, useCallback } from "react";
import {
  FiTrendingUp,
  FiUsers,
  FiCreditCard,
  FiCalendar,
  FiTarget,
  FiArrowUpRight,
  FiArrowDownRight,
  FiMinus,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { StatStrip } from "../ui/StatStrip";
import { useRTL } from "../../hooks/useRTL";
import { useNavigate } from "react-router-dom";
import { useGymConfig } from "../../contexts/gym-config-context";
import { countMembersActiveAsOf, isMemberCurrentlyActive } from "../../utils/memberActivity";
import { monthBoundary, weekBoundary, daysWindow } from "../../utils/periodBoundaries";

interface SmartDashboardOverviewProps {
  refreshKey: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

interface SmartInsightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  value?: string;
  onClick?: () => void;
}

const SmartInsight: React.FC<SmartInsightProps> = ({
  icon,
  title,
  description,
  action,
  priority,
  value,
  onClick,
}) => {
  const { isRTL } = useRTL();
  // Priority is carried by the glyph's tint, not by a colored box.
  const priorityTint = {
    high: "text-red-500",
    medium: "text-orange-500",
    low: "text-blue-600 dark:text-blue-500",
  };

  return (
    <div className="flex items-start gap-3 px-4 py-3 text-start" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`mt-0.5 flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4 ${priorityTint[priority]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
          {value && (
            <span className="px-1.5 py-px bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded text-xs tabular-nums">
              {value}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button onClick={onClick} className="btn btn-secondary flex-shrink-0 self-center">
        {action}
      </button>
    </div>
  );
};

export const SmartDashboardOverview: React.FC<SmartDashboardOverviewProps> = ({
  refreshKey,
}) => {
  const { config: gymConfig } = useGymConfig();
  const timezone = gymConfig.timezone;

  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPICardProps[]>([
    {
      title: t("dashboard.activeMembers"),
      value: 0,
      change: t("common.loading"),
      trend: "neutral",
      icon: <FiUsers className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      color: "blue",
      subtitle: t("dashboard.vsLastMonth"),
    },
    {
      title: t("dashboard.monthlyRevenue"),
      value: "0",
      change: t("common.loading"),
      trend: "neutral",
      icon: <FiCreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />,
      color: "green",
      subtitle: t("dashboard.thisMonth"),
    },
    {
      title: t("dashboard.classAttendance"),
      value: "0%",
      change: t("common.loading"),
      trend: "neutral",
      icon: <FiCalendar className="h-6 w-6 text-purple-600" />,
      color: "purple",
      subtitle: t("dashboard.averageThisWeek"),
    },
    {
      title: t("dashboard.memberRetention"),
      value: "0%",
      change: t("common.loading"),
      trend: "neutral",
      icon: <FiTarget className="h-6 w-6 text-orange-600" />,
      color: "orange",
      subtitle: t("dashboard.twelveMonthAverage"),
    },
  ]);
  const [smartInsights, setSmartInsights] = useState<unknown[]>([]);
  const [, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setLoadError(false);

      const now = new Date();
      // Boundaries are full ISO instants in the gym's timezone with an
      // exclusive upper bound - see periodBoundaries.ts. A bare date
      // string compared against a timestamptz column truncates to
      // midnight UTC, silently excluding same-day records and shifting
      // month/week boundaries in positive-UTC-offset timezones.
      const currentMonth = monthBoundary(now, 0, timezone);
      const previousMonth = monthBoundary(now, 1, timezone);
      const previousMonthEnd = new Date(currentMonth.startISO);
      const week = weekBoundary(now, timezone);

      // Fetch data
      const [
        currentInvoices,
        previousInvoices,
        weekBookings,
        allMembers,
      ] = await Promise.all([
        supabase
          .from("invoices")
          .select("amount, total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", currentMonth.startISO)
          .lt("created_at", currentMonth.endExclusiveISO),
        supabase
          .from("invoices")
          .select("amount, total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", previousMonth.startISO)
          .lt("created_at", previousMonth.endExclusiveISO),
        // Filtered on the class's own start_time (via the inner join),
        // not the booking's created_at - a booking made weeks ago for a
        // class held this week is this week's attendance; a booking made
        // today for a class next month is not.
        supabase
          .from("class_bookings")
          .select("id, status, created_at, classes!inner(start_time)")
          .eq("tenant_id", tenantId)
          .gte("classes.start_time", week.startISO)
          .lt("classes.start_time", week.endExclusiveISO),
        supabase
          .from("members")
          .select("id, created_at, join_date, expiry_date, status, membership_status")
          .eq("tenant_id", tenantId),
      ]);

      const queryError =
        currentInvoices.error ||
        previousInvoices.error ||
        weekBookings.error ||
        allMembers.error;
      if (queryError) throw queryError;

      // Compare "active members today" against "members who would have
      // counted as active as of the end of last month" (approximated from
      // join_date/expiry_date), not against "members who signed up last
      // month" - the latter is a different, much smaller population and
      // produces meaningless swings when compared to the full active count.
      const currentMembersData = (allMembers.data || []).filter(isMemberCurrentlyActive);
      const currentMemberCount = currentMembersData.length;
      const previousMemberCount = countMembersActiveAsOf(
        allMembers.data || [],
        previousMonthEnd,
      );
      const memberChange = previousMemberCount > 0
        ? ((currentMemberCount - previousMemberCount) / previousMemberCount) * 100
        : null;

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

      const weekAttended = (weekBookings.data || []).filter(
        b => b.status === "checked_in" || b.status === "completed"
      ).length;
      const weekTotal = (weekBookings.data || []).length;
      const weekAttendanceRate = weekTotal > 0 ? (weekAttended / weekTotal) * 100 : 0;

      // Calculate retention (members who joined 90+ days ago and are still active)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const retainedMembers = (allMembers.data || []).filter(m => {
        const joinDate = new Date(m.join_date || m.created_at);
        return joinDate <= ninetyDaysAgo && m.status === "active";
      }).length;
      const totalOldMembers = (allMembers.data || []).filter(m => {
        const joinDate = new Date(m.join_date || m.created_at);
        return joinDate <= ninetyDaysAgo;
      }).length;
      const retentionRate = totalOldMembers > 0 ? (retainedMembers / totalOldMembers) * 100 : 0;

      // Get currency
      const { data: settings, error: settingsError } = await supabase
        .from("gym_settings")
        .select("currency, metadata")
        .eq("tenant_id", tenantId)
        .single();
      // PGRST116 = no row found, which is a legitimate "not configured
      // yet" state here, not a failure worth surfacing.
      if (settingsError && settingsError.code !== "PGRST116") throw settingsError;

      const currency = settings?.currency || gymConfig.currency;
      const currencySymbol = currency || "";
      // The revenue target is the one the gym set (Set Targets on the dashboard).
      // This card used to show "110% of this month's revenue" as a target, which is
      // not a target - it just moved with the number it was measuring.
      const savedRevenueTarget = Number(
        (settings?.metadata as { dashboardTargets?: { revenue?: number } } | null)?.dashboardTargets?.revenue,
      );

      // Find inactive members (haven't visited in 14+ days)
      const last14Days = daysWindow(now, 14, timezone);
      const { data: recentBookings, error: recentBookingsError } = await supabase
        .from("class_bookings")
        .select("member_id")
        .eq("tenant_id", tenantId)
        .gte("created_at", last14Days.startISO);
      if (recentBookingsError) throw recentBookingsError;

      const activeMemberIds = new Set((recentBookings || []).map(b => b.member_id));
      const inactiveMembers = currentMembersData.filter(
        m => !activeMemberIds.has(m.id)
      ).length;

      setKpis([
        {
          title: t("dashboard.activeMembers"),
          value: currentMemberCount,
          change:
            memberChange === null
              ? t("dashboard.notEnoughData", "Not enough data")
              : memberChange >= 0
                ? `+${memberChange.toFixed(1)}%`
                : `${memberChange.toFixed(1)}%`,
          trend: memberChange === null ? "neutral" : memberChange >= 0 ? "up" : "down",
          icon: <FiUsers className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
          color: "blue",
          subtitle: t("dashboard.vsLastMonth"),
        },
        {
          title: t("dashboard.monthlyRevenue"),
          value: `${currencySymbol} ${(currentRevenue / 1000).toFixed(1)}k`,
          change: revenueChange >= 0 ? `+${revenueChange.toFixed(1)}%` : `${revenueChange.toFixed(1)}%`,
          trend: revenueChange >= 0 ? "up" : "down",
          icon: <FiCreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />,
          color: "green",
          subtitle:
            savedRevenueTarget > 0
              ? `${t("dashboard.target")}: ${currencySymbol} ${(savedRevenueTarget / 1000).toFixed(1)}k`
              : t("dashboard.vsLastMonth"),
        },
        {
          // This week's raw attendance rate, not a trend - there's no
          // prior-week figure computed here to compare against, so the
          // arrow used to always claim "up" regardless of the value.
          title: t("dashboard.classAttendance"),
          value: `${weekAttendanceRate.toFixed(1)}%`,
          change: t("dashboard.thisWeek"),
          trend: "neutral",
          icon: <FiCalendar className="h-6 w-6 text-purple-600" />,
          color: "purple",
          subtitle: t("dashboard.averageThisWeek"),
        },
        {
          // Retention among members who joined 90+ days ago - not a
          // 12-month average (there's no data spanning that far back
          // here), and "trend" was really just an arbitrary >=85%
          // threshold, not a real prior-period comparison.
          title: t("dashboard.memberRetention"),
          value: `${retentionRate.toFixed(1)}%`,
          change: t("dashboard.ninetyPlusDays"),
          trend: "neutral",
          icon: <FiTarget className="h-6 w-6 text-orange-600" />,
          color: "orange",
          subtitle: t("dashboard.ninetyDayCohort", "90-day cohort"),
        },
      ]);

      // Generate insights
      const insights: SmartInsightProps[] = [];
      
      if (inactiveMembers > 0) {
        insights.push({
          icon: <FiUsers className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
          title: t("dashboard.memberChurnRisk"),
          description: `${inactiveMembers} ${t("dashboard.membersHaventVisited")}`,
          action: t("dashboard.sendCampaign"),
          priority: inactiveMembers > 10 ? "high" : "medium" as const,
          value: `${inactiveMembers} ${t("dashboard.atRisk")}`,
        });
      }

      if (weekAttendanceRate > 80) {
        insights.push({
          icon: <FiTrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />,
          title: t("dashboard.highAttendanceWeek"),
          description: `${t("dashboard.thisWeeksAttendance")} ${weekAttendanceRate.toFixed(1)}%. ${t("dashboard.considerAddingMoreClasses")}`,
          action: t("dashboard.scheduleClass"),
          priority: "medium" as const,
          value: `${weekAttendanceRate.toFixed(1)}% ${t("dashboard.attendance")}`,
        });
      }

      setSmartInsights(insights);
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, t, timezone, gymConfig.currency]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, t]);

  const { isRTL } = useRTL();
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }} dir={isRTL ? "rtl" : "ltr"}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("dashboard.smartDashboard")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.smartPoweredInsights")}</p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {t("dashboard.failedToLoadData", "Failed to load business overview data")}
        </div>
      )}

      {/* KPIs */}
      <StatStrip
        items={kpis.map((kpi) => {
          const TrendIcon =
            kpi.trend === "up" ? FiArrowUpRight : kpi.trend === "down" ? FiArrowDownRight : FiMinus;
          const trendColor =
            kpi.trend === "up"
              ? "text-green-600 dark:text-green-500"
              : kpi.trend === "down"
                ? "text-red-500"
                : "text-gray-500 dark:text-gray-400";
          return {
            label: kpi.title,
            value: kpi.value,
            detail: (
              <span className="inline-flex items-center gap-1">
                <span className={`inline-flex items-center gap-0.5 ${trendColor}`}>
                  <TrendIcon className={`h-3 w-3 ${isRTL ? "rtl-flip" : ""}`} />
                  {kpi.change}
                </span>
                {kpi.subtitle && <span>· {kpi.subtitle}</span>}
              </span>
            ),
          };
        })}
      />

      {/* Smart Insights - Enhanced Single Column */}
      {smartInsights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white text-start">{t("dashboard.keyInsights")}</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl divide-y divide-black/5 dark:divide-white/10">
            {smartInsights.map((insight, index) => {
              const typedInsight = insight as SmartInsightProps;
              return (
            <div key={index}>
              <SmartInsight 
                {...typedInsight} 
                onClick={() => {
                  if (typedInsight.action === t("dashboard.sendCampaign")) {
                    navigate("/dashboard/members");
                  } else if (typedInsight.action === t("dashboard.scheduleClass")) {
                    navigate("/dashboard/classes");
                  }
                }}
              />
            </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
