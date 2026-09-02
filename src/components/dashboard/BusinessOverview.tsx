import React, { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiDollarSign,
  FiUserPlus,
  FiArrowDownRight,
  FiTrendingUp,
  FiArrowUpRight,
} from "react-icons/fi";
import { type SmartKpiCardProps } from "../ui/SmartKpiCard";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import { DEFAULT_CURRENCY } from "../../config/runtimeConfig";

// Color mappings for KPI cards
const kpiColorMap: Record<string, { iconBg: string; iconText: string }> = {
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconText: "text-blue-600 dark:text-blue-400",
  },
  green: {
    iconBg: "bg-green-50 dark:bg-green-900/30",
    iconText: "text-green-600 dark:text-green-400",
  },
  purple: {
    iconBg: "bg-purple-50 dark:bg-purple-900/30",
    iconText: "text-purple-600 dark:text-purple-400",
  },
  yellow: {
    iconBg: "bg-yellow-50 dark:bg-yellow-900/30",
    iconText: "text-yellow-600 dark:text-yellow-400",
  },
  red: {
    iconBg: "bg-red-50 dark:bg-red-900/30",
    iconText: "text-red-600 dark:text-red-400",
  },
  orange: {
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconText: "text-orange-600 dark:text-orange-400",
  },
};

/**
 * BusinessOverview displays key gym KPIs in Apple-style cards.
 * Enhanced with better UI/UX design and visual hierarchy.
 * @returns {JSX.Element}
 */
const BusinessOverview: React.FC = () => {
  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [kpis, setKpis] = useState<SmartKpiCardProps[]>([
    {
      label: t("dashboard.activeMembers"),
      value: 0,
      icon: <FiUsers className="h-6 w-6" />,
      color: "blue",
      trend: "up",
      trendValue: "0",
      tooltip: t("dashboard.numberActiveMemberships"),
      context: t("common.loading"),
    },
    {
      label: t("dashboard.monthlyRevenueVat"),
      value: "0",
      icon: <FiDollarSign className="h-6 w-6" />,
      color: "green",
      trend: "up",
      trendValue: "0",
      tooltip: t("dashboard.totalRevenueThisMonth"),
      context: t("common.loading"),
    },
    {
      label: t("dashboard.newSignups30d"),
      value: 0,
      icon: <FiUserPlus className="h-6 w-6" />,
      color: "purple",
      trend: "up",
      trendValue: "0",
      tooltip: t("dashboard.newMembersLast30Days"),
      context: t("common.loading"),
    },
    {
      label: t("dashboard.churnRate"),
      value: "0%",
      icon: <FiArrowDownRight className="h-6 w-6" />,
      color: "red",
      trend: "down",
      trendValue: "0%",
      tooltip: t("dashboard.monthlyChurnRate"),
      context: t("common.loading"),
    },
  ]);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoadError(false);
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Fetch active members
      const [currentMembers, previousMembers, newMembers, allMembers] = await Promise.all([
        supabase
          .from("members")
          .select("id, status, membership_status")
          .eq("tenant_id", tenantId)
          .in("status", ["active"])
          .in("membership_status", ["active", "trial"]),
        supabase
          .from("members")
          .select("id, status, membership_status")
          .eq("tenant_id", tenantId)
          .in("status", ["active"])
          .in("membership_status", ["active", "trial"])
          .gte("created_at", formatDate(previousMonthStart))
          .lte("created_at", formatDate(previousMonthEnd)),
        supabase
          .from("members")
          .select("id, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(thirtyDaysAgo)),
        supabase
          .from("members")
          .select("id, created_at, status, membership_status")
          .eq("tenant_id", tenantId),
      ]);

      // Fetch revenue
      const [currentInvoices, previousInvoices] = await Promise.all([
        supabase
          .from("invoices")
          .select("amount, total, vat_total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", formatDate(currentMonthStart)),
        supabase
          .from("invoices")
          .select("amount, total, vat_total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", formatDate(previousMonthStart))
          .lte("created_at", formatDate(previousMonthEnd)),
      ]);

      const membersOrInvoicesError =
        currentMembers.error ||
        previousMembers.error ||
        newMembers.error ||
        allMembers.error;
      if (membersOrInvoicesError || currentInvoices.error || previousInvoices.error) {
        throw membersOrInvoicesError || currentInvoices.error || previousInvoices.error;
      }

      const currentMemberCount = (currentMembers.data || []).length;
      const previousMemberCount = (previousMembers.data || []).length;
      const memberChange = currentMemberCount - previousMemberCount;
      const memberChangePercent = previousMemberCount > 0
        ? ((currentMemberCount - previousMemberCount) / previousMemberCount) * 100
        : 0;

      const currentRevenue = (currentInvoices.data || []).reduce(
        (sum, inv) => sum + Number(inv.total || inv.amount || 0) + Number(inv.vat_total || 0),
        0
      );
      const previousRevenue = (previousInvoices.data || []).reduce(
        (sum, inv) => sum + Number(inv.total || inv.amount || 0) + Number(inv.vat_total || 0),
        0
      );
      const revenueChange = currentRevenue - previousRevenue;
      const revenueChangePercent = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      const newSignupsCount = (newMembers.data || []).length;
      const previousNewSignups = await supabase
        .from("members")
        .select("id")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000)))
        .lte("created_at", formatDate(thirtyDaysAgo));
      if (previousNewSignups.error) throw previousNewSignups.error;
      const previousNewSignupsCount = (previousNewSignups.data || []).length;
      const signupsChange = newSignupsCount - previousNewSignupsCount;

      // Calculate churn rate (members who left in last month)
      const churnedMembers = (allMembers.data || []).filter(m => {
        const created = new Date(m.created_at);
        return created < previousMonthStart && (m.status === "inactive" || m.membership_status === "expired");
      }).length;
      const totalMembersAtStart = (allMembers.data || []).filter(m => {
        const created = new Date(m.created_at);
        return created < previousMonthStart;
      }).length;
      const churnRate = totalMembersAtStart > 0 ? (churnedMembers / totalMembersAtStart) * 100 : 0;

      // Get currency
      const { data: settings } = await supabase
        .from("gym_settings")
        .select("currency")
        .eq("tenant_id", tenantId)
        .single();

      const currency = settings?.currency || DEFAULT_CURRENCY;
      const currencySymbol = currency || "";

      setKpis([
        {
          label: t("dashboard.activeMembers"),
          value: currentMemberCount,
          icon: <FiUsers className="h-6 w-6" />,
          color: "blue",
          trend: memberChange >= 0 ? "up" : "down",
          trendValue: memberChange >= 0 ? `+${memberChange}` : `${memberChange}`,
          tooltip: t("dashboard.numberActiveMemberships"),
          context: memberChangePercent >= 0 ? `+${memberChangePercent.toFixed(1)}% ${t("dashboard.vsLastMonth")}` : `${memberChangePercent.toFixed(1)}% ${t("dashboard.vsLastMonth")}`,
        },
        {
          label: t("dashboard.monthlyRevenueVat"),
          value: `${currencySymbol} ${currentRevenue.toLocaleString()}`,
          icon: <FiDollarSign className="h-6 w-6" />,
          color: "green",
          trend: revenueChange >= 0 ? "up" : "down",
          trendValue: `${currencySymbol} ${Math.abs(revenueChange).toLocaleString()}`,
          tooltip: t("dashboard.totalRevenueThisMonth"),
          context: revenueChangePercent >= 0 ? `+${revenueChangePercent.toFixed(1)}% ${t("dashboard.vsLastMonth")}` : `${revenueChangePercent.toFixed(1)}% ${t("dashboard.vsLastMonth")}`,
        },
        {
          label: t("dashboard.newSignups30d"),
          value: newSignupsCount,
          icon: <FiUserPlus className="h-6 w-6" />,
          color: "purple",
          trend: signupsChange >= 0 ? "up" : "down",
          trendValue: signupsChange >= 0 ? `+${signupsChange}` : `${signupsChange}`,
          tooltip: t("dashboard.newMembersLast30Days"),
          context: previousNewSignupsCount > 0
            ? `${((newSignupsCount - previousNewSignupsCount) / previousNewSignupsCount * 100).toFixed(1)}% ${t("dashboard.vsLastMonth")}`
            : t("dashboard.new"),
        },
        {
          label: t("dashboard.churnRate"),
          value: `${churnRate.toFixed(1)}%`,
          icon: <FiArrowDownRight className="h-6 w-6" />,
          color: "red",
          trend: "down",
          trendValue: `${churnRate.toFixed(1)}%`,
          tooltip: t("dashboard.monthlyChurnRate"),
          context: t("dashboard.thisMonth"),
        },
      ]);
    } catch (error) {
      console.error("Error fetching business overview:", error);
      setLoadError(true);
    }
  }, [tenantId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
  <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 transition-colors duration-300">
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
          <FiTrendingUp className="text-blue-600 dark:text-blue-400 text-xl" />
        </div>
        <div className="text-start">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {t("dashboard.businessOverview")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("dashboard.keyPerformanceIndicators")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>{t("dashboard.updated")}</span>
      </div>
    </div>
    {loadError && (
      <div className="mb-4 text-sm text-red-600 dark:text-red-400">
        {t("dashboard.failedToLoadData", "Failed to load business overview data")}
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 hover:shadow-sm dark:hover:shadow-gray-900/20 transition-all duration-200 text-start" dir={isRTL ? "rtl" : "ltr"}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className={`p-2 rounded-lg ${kpiColorMap[kpi.color]?.iconBg || kpiColorMap.blue.iconBg} ${kpiColorMap[kpi.color]?.iconText || kpiColorMap.blue.iconText}`}>
              {kpi.icon}
            </div>
            <div className="flex items-center gap-1 text-sm">
              {kpi.trend === "up" ? (
                <FiArrowUpRight className={`h-4 w-4 text-green-600 dark:text-green-400 ${isRTL ? 'rtl-flip' : ''}`} />
              ) : (
                <FiArrowDownRight className={`h-4 w-4 text-red-600 dark:text-red-400 ${isRTL ? 'rtl-flip' : ''}`} />
              )}
              <span className={kpi.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {kpi.trendValue}
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{kpi.value}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{kpi.label}</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{kpi.context}</div>
        </div>
      ))}
    </div>
  </section>
  );
};

export default BusinessOverview;
