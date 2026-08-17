import React, { useState, useEffect, useCallback } from "react";
import {
  FiTrendingUp,
  FiUsers,
  FiCreditCard,
  FiCalendar,
  FiTarget,
  FiCpu,
  FiArrowUpRight,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import { useNavigate } from "react-router-dom";
import { DEFAULT_CURRENCY } from "../../config/runtimeConfig";

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

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  subtitle,
}) => {
  const { isRTL } = useRTL();
  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700";
      case "green":
        return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700";
      case "yellow":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700";
      case "red":
        return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700";
      case "purple":
        return "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700";
      case "orange":
        return "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-700";
      default:
        return "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 ease-in-out text-start" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className={`p-3 rounded-xl border ${getColorClasses(color)} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <FiArrowUpRight className={`h-4 w-4 ${isRTL ? 'rtl-flip' : ''}`} />
          <span>{change}</span>
        </div>
      </div>
      <div className="text-start">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

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
  const priorityColors = {
    high: "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20",
    medium: "border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20",
    low: "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20",
  };

  return (
    <div
      className={`p-6 rounded-2xl border ${priorityColors[priority]} hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 text-start`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex-shrink-0">{icon}</div>
        <div className="flex-1 text-start">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
            {value && (
              <span className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                {value}
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{description}</p>
          <button 
            onClick={onClick}
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <span>{action}</span>
            <FiArrowUpRight className={`h-4 w-4 ${isRTL ? 'rtl-flip' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const SmartDashboardOverview: React.FC<SmartDashboardOverviewProps> = ({
  refreshKey,
}) => {
  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPICardProps[]>([
    {
      title: t("dashboard.activeMembers"),
      value: 0,
      change: t("common.loading"),
      trend: "neutral",
      icon: <FiUsers className="h-6 w-6 text-blue-600" />,
      color: "blue",
      subtitle: t("dashboard.vsLastMonth"),
    },
    {
      title: t("dashboard.monthlyRevenue"),
      value: "0",
      change: t("common.loading"),
      trend: "neutral",
      icon: <FiCreditCard className="h-6 w-6 text-green-600" />,
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

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Get current week dates
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
      weekStart.setHours(0, 0, 0, 0);

      // Fetch data
      const [
        currentMembers,
        previousMembers,
        currentInvoices,
        previousInvoices,
        weekBookings,
        allMembers,
      ] = await Promise.all([
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
        supabase
          .from("class_bookings")
          .select("id, status, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(weekStart)),
        supabase
          .from("members")
          .select("id, created_at, join_date")
          .eq("tenant_id", tenantId),
      ]);

      // Calculate metrics
      const currentMemberCount = (currentMembers.data || []).length;
      const previousMemberCount = (previousMembers.data || []).length;
      const memberChange = previousMemberCount > 0
        ? ((currentMemberCount - previousMemberCount) / previousMemberCount) * 100
        : 0;

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
        return joinDate <= ninetyDaysAgo;
      }).length;
      const totalOldMembers = (allMembers.data || []).filter(m => {
        const joinDate = new Date(m.join_date || m.created_at);
        return joinDate <= ninetyDaysAgo;
      }).length;
      const retentionRate = totalOldMembers > 0 ? (retainedMembers / totalOldMembers) * 100 : 0;

      // Get currency
      const { data: settings } = await supabase
        .from("gym_settings")
        .select("currency")
        .eq("tenant_id", tenantId)
        .single();

      const currency = settings?.currency || DEFAULT_CURRENCY;
      const currencySymbol = currency || "";

      // Find inactive members (haven't visited in 14+ days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const { data: recentBookings } = await supabase
        .from("class_bookings")
        .select("member_id")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(fourteenDaysAgo));

      const activeMemberIds = new Set((recentBookings || []).map(b => b.member_id));
      const inactiveMembers = (currentMembers.data || []).filter(
        m => !activeMemberIds.has(m.id)
      ).length;

      setKpis([
        {
          title: t("dashboard.activeMembers"),
          value: currentMemberCount,
          change: memberChange >= 0 ? `+${memberChange.toFixed(1)}%` : `${memberChange.toFixed(1)}%`,
          trend: memberChange >= 0 ? "up" : "down",
          icon: <FiUsers className="h-6 w-6 text-blue-600" />,
          color: "blue",
          subtitle: t("dashboard.vsLastMonth"),
        },
        {
          title: t("dashboard.monthlyRevenue"),
          value: `${currencySymbol} ${(currentRevenue / 1000).toFixed(1)}k`,
          change: revenueChange >= 0 ? `+${revenueChange.toFixed(1)}%` : `${revenueChange.toFixed(1)}%`,
          trend: revenueChange >= 0 ? "up" : "down",
          icon: <FiCreditCard className="h-6 w-6 text-green-600" />,
          color: "green",
          subtitle: `${t("dashboard.target")}: ${currencySymbol} ${((currentRevenue * 1.1) / 1000).toFixed(1)}k`,
        },
        {
          title: t("dashboard.classAttendance"),
          value: `${weekAttendanceRate.toFixed(1)}%`,
          change: t("dashboard.thisWeek"),
          trend: "up",
          icon: <FiCalendar className="h-6 w-6 text-purple-600" />,
          color: "purple",
          subtitle: t("dashboard.averageThisWeek"),
        },
        {
          title: t("dashboard.memberRetention"),
          value: `${retentionRate.toFixed(1)}%`,
          change: t("dashboard.ninetyPlusDays"),
          trend: retentionRate >= 85 ? "up" : "down",
          icon: <FiTarget className="h-6 w-6 text-orange-600" />,
          color: "orange",
          subtitle: t("dashboard.twelveMonthAverage"),
        },
      ]);

      // Generate insights
      const insights: SmartInsightProps[] = [];
      
      if (inactiveMembers > 0) {
        insights.push({
          icon: <FiUsers className="h-6 w-6 text-blue-600" />,
          title: t("dashboard.memberChurnRisk"),
          description: `${inactiveMembers} ${t("dashboard.membersHaventVisited")}`,
          action: t("dashboard.sendCampaign"),
          priority: inactiveMembers > 10 ? "high" : "medium" as const,
          value: `${inactiveMembers} ${t("dashboard.atRisk")}`,
        });
      }

      if (weekAttendanceRate > 80) {
        insights.push({
          icon: <FiTrendingUp className="h-6 w-6 text-green-600" />,
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
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey, t]);

  const { isRTL } = useRTL();
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex-shrink-0">
            <FiCpu className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }} dir={isRTL ? "rtl" : "ltr"}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("dashboard.smartDashboard")}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t("dashboard.smartPoweredInsights")}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards - Enhanced 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpis.map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Smart Insights - Enhanced Single Column */}
      {smartInsights.length > 0 && (
        <div className="space-y-6">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
            <h3 className={`text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-left' : 'text-left'}`}>{t("dashboard.keyInsights")}</h3>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-2 text-sm text-gray-500 dark:text-gray-400`}>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{t("dashboard.liveUpdates")}</span>
            </div>
          </div>
          <div className="space-y-4">
            {smartInsights.map((insight, index) => {
              const typedInsight = insight as SmartInsightProps;
              return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2, duration: 0.3 }}
            >
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
            </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
