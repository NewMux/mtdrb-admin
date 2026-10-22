import React, { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiDollarSign,
  FiUserPlus,
  FiArrowDownRight,
  FiArrowUpRight,
} from "react-icons/fi";
import { type SmartKpiCardProps } from "../ui/SmartKpiCard";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { StatStrip } from "../ui/StatStrip";
import { useRTL } from "../../hooks/useRTL";
import { useGymConfig } from "../../contexts/gym-config-context";
import { resolveInvoiceGrossAmount } from "../../utils/invoiceMath";
import { countMembersActiveAsOf, isMemberCurrentlyActive } from "../../utils/memberActivity";
import { monthBoundary, dayBoundary, daysWindow } from "../../utils/periodBoundaries";

/**
 * BusinessOverview displays key gym KPIs in Apple-style cards.
 * Enhanced with better UI/UX design and visual hierarchy.
 * @returns {JSX.Element}
 */
const BusinessOverview: React.FC = () => {
  const { config: gymConfig } = useGymConfig();
  const timezone = gymConfig.timezone;

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
      // Boundaries are computed as full ISO instants in the gym's
      // timezone, with an exclusive upper bound - see periodBoundaries.ts
      // for why: a bare date string compared against a timestamptz column
      // truncates to midnight UTC, silently excluding same-day records
      // and shifting month boundaries in positive-UTC-offset timezones.
      const currentMonth = monthBoundary(now, 0, timezone);
      const previousMonth = monthBoundary(now, 1, timezone);
      const currentMonthStart = new Date(currentMonth.startISO);
      const previousMonthStart = new Date(previousMonth.startISO);
      // previousMonth's exclusive end is exactly currentMonth's start.
      const previousMonthEnd = currentMonthStart;
      const last30Days = daysWindow(now, 30, timezone);
      const previous30DaysStart = dayBoundary(now, 59, timezone).startISO;

      // Fetch active members
      const [newMembers, allMembers] = await Promise.all([
        supabase
          .from("members")
          .select("id, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", last30Days.startISO)
          .lt("created_at", last30Days.endExclusiveISO),
        supabase
          .from("members")
          .select("id, created_at, join_date, expiry_date, status, membership_status")
          .eq("tenant_id", tenantId),
      ]);

      // Fetch revenue
      const [currentInvoices, previousInvoices] = await Promise.all([
        supabase
          .from("invoices")
          .select("amount, total, vat_total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", currentMonth.startISO)
          .lt("created_at", currentMonth.endExclusiveISO),
        supabase
          .from("invoices")
          .select("amount, total, vat_total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", previousMonth.startISO)
          .lt("created_at", previousMonth.endExclusiveISO),
      ]);

      const membersOrInvoicesError =
        newMembers.error ||
        allMembers.error;
      if (membersOrInvoicesError || currentInvoices.error || previousInvoices.error) {
        throw membersOrInvoicesError || currentInvoices.error || previousInvoices.error;
      }

      // Compare "active members today" against "members who would have
      // counted as active as of the end of last month" (approximated from
      // join_date/expiry_date - see wasMemberActiveAsOf), not against
      // "members who signed up last month". The latter is a different,
      // much smaller population and produces meaningless swings like
      // "+4900% vs last month" when compared to the full active count.
      const activeMembers = (allMembers.data || []).filter(isMemberCurrentlyActive);
      const currentMemberCount = activeMembers.length;
      const previousMemberCount = countMembersActiveAsOf(
        allMembers.data || [],
        previousMonthEnd,
      );
      const memberChange = currentMemberCount - previousMemberCount;
      const memberChangePercent = previousMemberCount > 0
        ? ((currentMemberCount - previousMemberCount) / previousMemberCount) * 100
        : null;

      // `total` is already the gross (net + VAT) amount - do not add
      // vat_total on top of it, that double-counts the tax component.
      const currentRevenue = (currentInvoices.data || []).reduce(
        (sum, inv) => sum + resolveInvoiceGrossAmount(inv),
        0
      );
      const previousRevenue = (previousInvoices.data || []).reduce(
        (sum, inv) => sum + resolveInvoiceGrossAmount(inv),
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
        .gte("created_at", previous30DaysStart)
        .lt("created_at", last30Days.startISO);
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
      const { data: settings, error: settingsError } = await supabase
        .from("gym_settings")
        .select("currency")
        .eq("tenant_id", tenantId)
        .single();
      // PGRST116 = no row found, a legitimate "not configured yet" state.
      if (settingsError && settingsError.code !== "PGRST116") throw settingsError;

      const currency = settings?.currency || gymConfig.currency;
      const currencySymbol = currency || "";

      setKpis([
        {
          label: t("dashboard.activeMembers"),
          value: currentMemberCount,
          icon: <FiUsers className="h-6 w-6" />,
          color: "blue",
          tooltip: t("dashboard.numberActiveMemberships"),
          // No previous-period baseline (or it's zero) means there's
          // nothing meaningful to compare against - show no trend badge
          // rather than a wrong one.
          ...(memberChangePercent === null
            ? {}
            : {
                trend: (memberChange >= 0 ? "up" : "down") as "up" | "down",
                trendValue: memberChange >= 0 ? `+${memberChange}` : `${memberChange}`,
                context: `${memberChangePercent >= 0 ? "+" : ""}${memberChangePercent.toFixed(1)}% ${t("dashboard.vsLastMonth")}`,
              }),
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
          // Cumulative churn among members who joined before last month,
          // not "churn that happened this month" - the schema has no
          // cancellation date to bound it by when a member churned, only
          // their current status. No trend badge: there's no prior-period
          // churn figure to compare against, so a hardcoded arrow would
          // just be a guess.
          label: t("dashboard.churnRate"),
          value: `${churnRate.toFixed(1)}%`,
          icon: <FiArrowDownRight className="h-6 w-6" />,
          color: "red",
          tooltip: t("dashboard.overallChurnRateTooltip", "Share of longer-tenured members who are now inactive or expired"),
          context: t("dashboard.allTime"),
        },
      ]);
    } catch (error) {
      console.error("Error fetching business overview:", error);
      setLoadError(true);
    }
  }, [tenantId, t, timezone, gymConfig.currency]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
  <section className="space-y-3" dir={isRTL ? "rtl" : "ltr"}>
    <div className="text-start">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        {t("dashboard.businessOverview")}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.keyPerformanceIndicators")}</p>
    </div>
    {loadError && (
      <div className="text-sm text-red-600 dark:text-red-400">
        {t("dashboard.failedToLoadData", "Failed to load business overview data")}
      </div>
    )}
    <StatStrip
      items={kpis.map((kpi) => {
        const up = kpi.trend === "up";
        const TrendIcon = up ? FiArrowUpRight : FiArrowDownRight;
        return {
          label: kpi.label,
          value: kpi.value,
          accessory: (
            <span className={`inline-flex items-center gap-0.5 text-xs ${up ? "text-green-600 dark:text-green-500" : "text-red-500"}`}>
              <TrendIcon className={`h-3 w-3 ${isRTL ? "rtl-flip" : ""}`} />
              {kpi.trendValue}
            </span>
          ),
          detail: kpi.context,
        };
      })}
    />
  </section>
  );
};

export default BusinessOverview;
