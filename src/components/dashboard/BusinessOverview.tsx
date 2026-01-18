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

/**
 * BusinessOverview displays key gym KPIs in Apple-style cards.
 * Enhanced with better UI/UX design and visual hierarchy.
 * @returns {JSX.Element}
 */
const BusinessOverview: React.FC = () => {
  const { tenantId } = useAuth();
  const [kpis, setKpis] = useState<SmartKpiCardProps[]>([
    {
      label: "Active Members",
      value: 0,
      icon: <FiUsers className="h-6 w-6" />,
      color: "blue",
      trend: "up",
      trendValue: "0",
      tooltip: "Number of currently active memberships.",
      context: "Loading...",
    },
    {
      label: "Monthly Revenue (VAT)",
      value: "0",
      icon: <FiDollarSign className="h-6 w-6" />,
      color: "green",
      trend: "up",
      trendValue: "0",
      tooltip: "Total revenue this month including VAT.",
      context: "Loading...",
    },
    {
      label: "New Signups (30d)",
      value: 0,
      icon: <FiUserPlus className="h-6 w-6" />,
      color: "purple",
      trend: "up",
      trendValue: "0",
      tooltip: "New members in the last 30 days.",
      context: "Loading...",
    },
    {
      label: "Churn Rate",
      value: "0%",
      icon: <FiArrowDownRight className="h-6 w-6" />,
      color: "red",
      trend: "down",
      trendValue: "0%",
      tooltip: "Monthly churn rate.",
      context: "Loading...",
    },
  ]);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    try {
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

      const currency = settings?.currency || "AED";
      const currencySymbol = currency === "AED" ? "AED" : currency === "SAR" ? "SAR" : currency === "BHD" ? "BHD" : "$";

      setKpis([
        {
          label: "Active Members",
          value: currentMemberCount,
          icon: <FiUsers className="h-6 w-6" />,
          color: "blue",
          trend: memberChange >= 0 ? "up" : "down",
          trendValue: memberChange >= 0 ? `+${memberChange}` : `${memberChange}`,
          tooltip: "Number of currently active memberships.",
          context: memberChangePercent >= 0 ? `+${memberChangePercent.toFixed(1)}% vs. last month` : `${memberChangePercent.toFixed(1)}% vs. last month`,
        },
        {
          label: "Monthly Revenue (VAT)",
          value: `${currencySymbol} ${currentRevenue.toLocaleString()}`,
          icon: <FiDollarSign className="h-6 w-6" />,
          color: "green",
          trend: revenueChange >= 0 ? "up" : "down",
          trendValue: `${currencySymbol} ${Math.abs(revenueChange).toLocaleString()}`,
          tooltip: "Total revenue this month including VAT.",
          context: revenueChangePercent >= 0 ? `+${revenueChangePercent.toFixed(1)}% vs. last month` : `${revenueChangePercent.toFixed(1)}% vs. last month`,
        },
        {
          label: "New Signups (30d)",
          value: newSignupsCount,
          icon: <FiUserPlus className="h-6 w-6" />,
          color: "purple",
          trend: signupsChange >= 0 ? "up" : "down",
          trendValue: signupsChange >= 0 ? `+${signupsChange}` : `${signupsChange}`,
          tooltip: "New members in the last 30 days.",
          context: previousNewSignupsCount > 0
            ? `${((newSignupsCount - previousNewSignupsCount) / previousNewSignupsCount * 100).toFixed(1)}% vs. last 30d`
            : "New",
        },
        {
          label: "Churn Rate",
          value: `${churnRate.toFixed(1)}%`,
          icon: <FiArrowDownRight className="h-6 w-6" />,
          color: "red",
          trend: "down",
          trendValue: `${churnRate.toFixed(1)}%`,
          tooltip: "Monthly churn rate.",
          context: "This month",
        },
      ]);
    } catch (error) {
      console.error("Error fetching business overview:", error);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
  <section className="bg-white border border-gray-100 rounded-2xl p-6 transition-colors duration-300">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-blue-50 rounded-xl">
          <FiTrendingUp className="text-blue-600 text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            Business Overview
          </h2>
          <p className="text-sm text-gray-600">Key performance indicators</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Updated</span>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
              {kpi.icon}
            </div>
            <div className="flex items-center space-x-1 text-sm">
              {kpi.trend === "up" ? (
                <FiArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <FiArrowDownRight className="h-4 w-4 text-red-600" />
              )}
              <span className={kpi.trend === "up" ? "text-green-600" : "text-red-600"}>
                {kpi.trendValue}
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
          <div className="text-sm text-gray-600">{kpi.label}</div>
          <div className="text-xs text-gray-500 mt-1">{kpi.context}</div>
        </div>
      ))}
    </div>
  </section>
  );
};

export default BusinessOverview;
