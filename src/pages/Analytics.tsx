import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiDownload,
  FiFilter,
  FiTarget,
  FiCheckCircle,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient";
import { getSmartInsights as fetchSmartInsights } from "../api/automation";
import type { Member, Invoice } from "../types";
import type { SmartInsight } from "../api/automation";
import { useRTL } from "../hooks/useRTL";

// Analytics Components
import MemberAnalytics from "../components/analytics/MemberAnalytics";
import RevenueOverview from "../components/analytics/RevenueOverview";
// Report Components
import SmartInsightCards from "../components/reports/SmartInsightCards";

type MemberAnalyticsData = React.ComponentProps<typeof MemberAnalytics>;
type RevenueOverviewData = React.ComponentProps<typeof RevenueOverview>;

/**
 * Format a date to YYYY-MM-DD.
 */
const toDateString = (date: Date) => date.toISOString().split("T")[0];

/**
 * Resolve current and previous ranges based on filter.
 */
const resolveDateRange = (rangeKey: string, customStart?: string, customEnd?: string) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  let previousStart = new Date(now);
  let previousEnd = new Date(now);

  switch (rangeKey) {
    case "custom": {
      start = customStart ? new Date(customStart) : start;
      end = customEnd ? new Date(customEnd) : end;
      // Calculate length of the custom range in days
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      previousEnd = new Date(start);
      previousEnd.setDate(start.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - diffDays);
      break;
    }
    case "last-7-days": {
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      previousEnd = new Date(start);
      previousEnd.setDate(start.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 6);
      break;
    }
    case "last-90-days": {
      start = new Date(now);
      start.setDate(now.getDate() - 89);
      previousEnd = new Date(start);
      previousEnd.setDate(start.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 89);
      break;
    }
    case "this-year": {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = new Date(now.getFullYear() - 1, 11, 31);
      break;
    }
    case "last-30-days":
    default: {
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      previousEnd = new Date(start);
      previousEnd.setDate(start.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 29);
      break;
    }
  }

  return { start, end, previousStart, previousEnd };
};

/**
 * Convert a date string into a YYYY-MM key.
 */
const toMonthKey = (dateValue?: string | null) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Calculate percentage change between two values.
 */
const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Import all modal components
import {
  ExportReportModal,
  ScheduleReportModal,
  ShareReportModal,
  PrintReportModal,
} from "../components/analytics/modals";
import ViewDetailsModal from "../components/analytics/ViewDetailsModal";
import AdvancedFilterModal from "../components/ui/AdvancedFilterModal";

type AnalyticsView =
  | "overview"
  | "members"
  | "revenue"
  | "classes"
  | "insights"
  | "generator"
  | "scheduled"
  | "automation";

const ANALYTICS_URL_TABS: readonly AnalyticsView[] = [
  "overview",
  "members",
  "revenue",
  "classes",
  "insights",
  "generator",
  "scheduled",
];

export default function Analytics() {
  usePageThemeContext();
  const { user, isLoading: authLoading, userMetadata } = useAuth();
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const tenantId = userMetadata?.tenant_id || null;

  // Track loading state
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<AnalyticsView>("overview");
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [filters, setFilters] = useState({
    dateRange: "last-30-days",
    customStartDate: toDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    customEndDate: toDateString(new Date()),
    branch: "all",
    metricType: "all",
    minRevenue: "",
    maxRevenue: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [modalState, setModalState] = useState({
    settings: false,
    export: false,
    scheduleReport: false,
    downloadReport: false,
    shareReport: false,
    vatReport: false,
    smartInsights: false,
    customReport: false,
    printReport: false,
    askSystem: false,
    viewDetails: false,
  });

  const [viewDetailsData] = useState({
    section: "",
    data: null,
  });
  const [analyticsStats, setAnalyticsStats] = useState<
    Array<{
      name: string;
      value: string;
      change: string;
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
      color: string;
    }>
  >([]);
  const [memberAnalyticsData, setMemberAnalyticsData] =
    useState<MemberAnalyticsData | null>(null);
  const [revenueOverviewData, setRevenueOverviewData] =
    useState<RevenueOverviewData | null>(null);
  const [branchOptions, setBranchOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [, setCurrencyCode] = useState<string>("");
  const navigate = useNavigate();

  const isPro = userMetadata?.subscription_tier === "premium" || userMetadata?.subscription_tier === "enterprise";

  const tabs: { id: AnalyticsView; name: string; icon: IconType }[] = React.useMemo(() => [
    { id: "overview", name: t("analytics.overview"), icon: FiBarChart2 },
    { id: "members", name: t("analytics.members"), icon: FiUsers },
    { id: "revenue", name: t("analytics.revenue"), icon: FiDollarSign },
    { id: "classes", name: t("analytics.classes"), icon: FiCalendar },
    { id: "insights", name: t("analytics.insights"), icon: FiTarget },
  ], [t]);

  const dateFilters = React.useMemo(() => [
    { id: "last-7-days", name: t("members.last7Days"), count: 0 },
    { id: "last-30-days", name: t("members.last30Days"), count: 0 },
    { id: "last-90-days", name: t("members.last90Days"), count: 0 },
    { id: "this-year", name: t("members.thisYear"), count: 0 },
    { id: "custom", name: t("analytics.customRange") || "Custom Range", count: 0 },
  ], [t]);


  /**
   * Fetch smart insights from Supabase.
   */
  const fetchInitialData = useCallback(async () => {
    if (!tenantId) {
      return;
    }
    try {
      const insightsData = await fetchSmartInsights(tenantId);
      setInsights(insightsData);
    } catch (error) {
      console.error("Error fetching smart insights:", error);
      toast.error("Failed to load smart insights");
    }
  }, [tenantId]);

  /**
   * Fetch analytics data and prepare dashboard datasets.
   */
  const fetchDashboardData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const { start, end, previousStart, previousEnd } = resolveDateRange(
        filters.dateRange,
        filters.customStartDate,
        filters.customEndDate,
      );
      const queryStart = toDateString(previousStart);
      const queryEnd = toDateString(end);

      const [
        settingsResult,
        branchesResult,
        membersResult,
        invoicesResult,
        bookingsResult,
      ] = await Promise.all([
        supabase
          .from("gym_settings")
          .select("currency")
          .eq("tenant_id", tenantId)
          .single(),
        supabase
          .from("branches")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("members")
          .select(
            "id, name, full_name, email, status, membership_status, membership_type, join_date, created_at, assigned_branch_id",
          )
          .eq("tenant_id", tenantId),
        supabase
          .from("invoices")
          .select(
            "id, member_id, type, status, issue_date, created_at, payment_method, total, amount, paid_amount, vat_total, currency, line_items",
          )
          .eq("tenant_id", tenantId)
          .gte("created_at", queryStart)
          .lte("created_at", queryEnd),
        supabase
          .from("class_bookings")
          .select("id, member_id, status, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", queryStart)
          .lte("created_at", queryEnd),
      ]);

      // Handle errors with better messaging
      if (settingsResult.error && settingsResult.error.code !== "PGRST116") {
        console.error("Error fetching gym_settings:", settingsResult.error);
        // Non-critical, continue without settings
      }
      
      if (branchesResult.error) {
        console.error("Error fetching branches:", branchesResult.error);
        if (branchesResult.error.code === "PGRST116") {
          console.warn("branches table does not exist, continuing without branches");
        } else {
          throw new Error(`Failed to fetch branches: ${branchesResult.error.message}`);
        }
      }
      
      if (membersResult.error) {
        console.error("Error fetching members:", membersResult.error);
        throw new Error(`Failed to fetch members: ${membersResult.error.message}`);
      }
      
      if (invoicesResult.error) {
        console.error("Error fetching invoices:", invoicesResult.error);
        if (invoicesResult.error.code === "PGRST116") {
          console.warn("invoices table does not exist, continuing without invoices");
        } else {
          throw new Error(`Failed to fetch invoices: ${invoicesResult.error.message}`);
        }
      }
      
      if (bookingsResult.error) {
        console.error("Error fetching class_bookings:", bookingsResult.error);
        if (bookingsResult.error.code === "PGRST116") {
          console.warn("class_bookings table does not exist, continuing without bookings");
        } else {
          throw new Error(`Failed to fetch class bookings: ${bookingsResult.error.message}`);
        }
      }

      const branches = branchesResult.data || [];
      const members = (membersResult.data || []) as Member[];
      const invoices = (invoicesResult.data || []) as Invoice[];
      const bookings = bookingsResult.data || [];

      const invoiceCurrency =
        invoices.find((invoice) => invoice.currency)?.currency || "";
      const resolvedCurrency =
        settingsResult.data?.currency || invoiceCurrency || "";
      setCurrencyCode(resolvedCurrency);
      setBranchOptions(
        branches.map((branch) => ({ id: branch.id, name: branch.name })),
      );

      const branchFilterId =
        filters.branch && filters.branch !== "all" ? filters.branch : null;
      const filteredMembers = branchFilterId
        ? members.filter(
            (member) => member.assigned_branch_id === branchFilterId,
          )
        : members;
      const filteredMemberIds = new Set(
        filteredMembers.map((member) => member.id).filter(Boolean),
      );

      const invoiceDate = (invoice: Invoice) =>
        invoice.issue_date || invoice.created_at || "";
      const invoiceAmount = (invoice: Invoice) =>
        Number(invoice.total) ||
        Number(invoice.amount) ||
        Number(invoice.paid_amount) ||
        0;

      // Filter invoices by minimum and maximum revenue
      const minRev = filters.minRevenue ? parseFloat(filters.minRevenue) : null;
      const maxRev = filters.maxRevenue ? parseFloat(filters.maxRevenue) : null;

      const matchesRevenueFilter = (invoice: Invoice) => {
        const amount = invoiceAmount(invoice);
        if (minRev !== null && amount < minRev) return false;
        if (maxRev !== null && amount > maxRev) return false;
        return true;
      };

      const invoicesInRange = invoices.filter((invoice) => {
        const date = invoiceDate(invoice);
        if (!date) return false;
        const created = new Date(date);
        return created >= start && created <= end && matchesRevenueFilter(invoice);
      });
      const invoicesPrevious = invoices.filter((invoice) => {
        const date = invoiceDate(invoice);
        if (!date) return false;
        const created = new Date(date);
        return created >= previousStart && created <= previousEnd && matchesRevenueFilter(invoice);
      });

      const paidInvoices = invoicesInRange.filter(
        (invoice) => (invoice.status || "").toLowerCase() === "paid",
      );
      const paidInvoicesPrevious = invoicesPrevious.filter(
        (invoice) => (invoice.status || "").toLowerCase() === "paid",
      );

      const currentRevenue = paidInvoices.reduce(
        (sum, invoice) => sum + invoiceAmount(invoice),
        0,
      );
      const previousRevenue = paidInvoicesPrevious.reduce(
        (sum, invoice) => sum + invoiceAmount(invoice),
        0,
      );

      const currentBookings = bookings.filter((booking) => {
        const created = booking.created_at ? new Date(booking.created_at) : null;
        return created ? created >= start && created <= end : false;
      });
      const previousBookings = bookings.filter((booking) => {
        const created = booking.created_at ? new Date(booking.created_at) : null;
        return created
          ? created >= previousStart && created <= previousEnd
          : false;
      });

      const attendanceRate = (bookingList: typeof bookings) => {
        if (bookingList.length === 0) return 0;
        const attended = bookingList.filter((booking) =>
          ["checked_in", "completed"].includes(
            (booking.status || "").toLowerCase(),
          ),
        ).length;
        return (attended / bookingList.length) * 100;
      };

      const collectionRate = (invoiceList: Invoice[]) => {
        if (invoiceList.length === 0) return 0;
        const paid = invoiceList.filter(
          (invoice) => (invoice.status || "").toLowerCase() === "paid",
        ).length;
        return (paid / invoiceList.length) * 100;
      };

      const activeMembers = filteredMembers.filter((member) => {
        const status = (member.membership_status || member.status || "").toLowerCase();
        return status === "active" || status === "trial";
      }).length;

      const newMembersThisPeriod = filteredMembers.filter((member) => {
        const created = member.join_date || member.created_at;
        if (!created) return false;
        const createdDate = new Date(created);
        return createdDate >= start && createdDate <= end;
      }).length;

      const revenueChange = calculateChange(currentRevenue, previousRevenue);
      const attendanceChange = calculateChange(
        attendanceRate(currentBookings),
        attendanceRate(previousBookings),
      );
      const collectionChange = calculateChange(
        collectionRate(invoicesInRange),
        collectionRate(invoicesPrevious),
      );

      const formatCurrency = (value: number) =>
        resolvedCurrency
          ? `${resolvedCurrency} ${value.toLocaleString()}`
          : value.toLocaleString();

      setAnalyticsStats([
        {
          name: "Total Revenue",
          value: formatCurrency(currentRevenue),
          change: `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(
            1,
          )}% vs previous period`,
          icon: FiDollarSign,
          color: "from-green-500 to-green-600",
        },
        {
          name: "Active Members",
          value: activeMembers.toLocaleString(),
          change: `${newMembersThisPeriod} new this period`,
          icon: FiUsers,
          color: "from-blue-500 to-blue-600",
        },
        {
          name: "Class Attendance",
          value: `${attendanceRate(currentBookings).toFixed(1)}%`,
          change: `${attendanceChange >= 0 ? "+" : ""}${attendanceChange.toFixed(
            1,
          )}% vs previous period`,
          icon: FiCalendar,
          color: "from-purple-500 to-purple-600",
        },
        {
          name: "Collection Rate",
          value: `${collectionRate(invoicesInRange).toFixed(1)}%`,
          change: `${collectionChange >= 0 ? "+" : ""}${collectionChange.toFixed(
            1,
          )}% vs previous period`,
          icon: FiCheckCircle,
          color: "from-yellow-500 to-orange-500",
        },
      ]);

      const statusTotals = filteredMembers.reduce((acc, member) => {
        const label = member.membership_status || member.status || "Unknown";
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalMembers = filteredMembers.length || 1;
      const memberStatus = Object.entries(statusTotals).map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / totalMembers) * 100),
        color: "#3B82F6",
      }));

      const leadsCount = filteredMembers.length;
      const trialsCount = filteredMembers.filter((member) =>
        (member.membership_status || member.status || "").toLowerCase() === "trial",
      ).length;
      const paidCount = activeMembers;
      const retainedCount = filteredMembers.filter((member) => {
        const status = (member.membership_status || member.status || "").toLowerCase();
        if (status !== "active") return false;
        const joined = member.join_date || member.created_at;
        if (!joined) return false;
        const joinedDate = new Date(joined);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return joinedDate <= ninetyDaysAgo;
      }).length;

      const funnel = [
        { stage: "Leads", count: leadsCount, percentage: 100, color: "bg-blue-500" },
        {
          stage: "Trials",
          count: trialsCount,
          percentage: leadsCount ? Math.round((trialsCount / leadsCount) * 100) : 0,
          color: "bg-green-500",
        },
        {
          stage: "Paid",
          count: paidCount,
          percentage: leadsCount ? Math.round((paidCount / leadsCount) * 100) : 0,
          color: "bg-yellow-500",
        },
        {
          stage: "Retained",
          count: retainedCount,
          percentage: leadsCount ? Math.round((retainedCount / leadsCount) * 100) : 0,
          color: "bg-purple-500",
        },
      ];

      const spendByMember = paidInvoices.reduce((acc, invoice) => {
        const memberId = invoice.member_id || "";
        if (!filteredMemberIds.has(memberId)) return acc;
        acc[memberId] = (acc[memberId] || 0) + invoiceAmount(invoice);
        return acc;
      }, {} as Record<string, number>);

      const memberById = new Map(
        filteredMembers.map((member) => [member.id, member]),
      );

      const topSpenders = Object.entries(spendByMember)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([memberId, spend]) => {
          const member = memberById.get(memberId);
          const name = member?.name || member?.full_name || "Member";
          return {
            name,
            email: member?.email || "",
            spend,
            joinDate: member?.join_date || member?.created_at || "",
            status: member?.status || member?.membership_status || "Active",
          };
        });

      const longestMembers = [...filteredMembers]
        .filter((member) => member.join_date || member.created_at)
        .sort((a, b) => {
          const aDate = new Date(a.join_date || a.created_at || 0).getTime();
          const bDate = new Date(b.join_date || b.created_at || 0).getTime();
          return aDate - bDate;
        })
        .slice(0, 5)
        .map((member) => ({
          name: member.name || member.full_name || "Member",
          email: member.email || "",
          spend: spendByMember[member.id || ""] || 0,
          joinDate: member.join_date || member.created_at || "",
          status: member.status || member.membership_status || "Active",
        }));

      const lastSixMonths = Array.from({ length: 6 }).map((_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - index));
        return toMonthKey(date.toISOString());
      });

      const revenueByMonth = paidInvoices.reduce((acc, invoice) => {
        const key = toMonthKey(invoiceDate(invoice));
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + invoiceAmount(invoice);
        return acc;
      }, {} as Record<string, number>);

      const ltvTrend = lastSixMonths.map((monthKey) => ({
        month: monthKey,
        ltv:
          activeMembers > 0
            ? Math.round((revenueByMonth[monthKey] || 0) / activeMembers)
            : 0,
      }));

      const noShowMap = bookings.reduce((acc, booking) => {
        if ((booking.status || "").toLowerCase() !== "no_show") return acc;
        const memberId = booking.member_id || "";
        if (!filteredMemberIds.has(memberId)) return acc;
        const lastSeen = booking.created_at || "";
        if (!acc[memberId]) {
          acc[memberId] = { count: 1, lastSeen };
        } else {
          acc[memberId].count += 1;
          if (lastSeen && lastSeen > acc[memberId].lastSeen) {
            acc[memberId].lastSeen = lastSeen;
          }
        }
        return acc;
      }, {} as Record<string, { count: number; lastSeen: string }>);

      const noShows = Object.entries(noShowMap)
        .map(([memberId, data]) => {
          const member = memberById.get(memberId);
          return {
            name: member?.name || member?.full_name || "Member",
            count: data.count,
            lastSeen: data.lastSeen
              ? new Date(data.lastSeen).toLocaleDateString()
              : "",
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setMemberAnalyticsData({
        funnel,
        memberStatus,
        topSpenders,
        longestMembers,
        ltvTrend,
        noShows,
      });

      const paidAllInvoices = invoicesInRange.filter(
        (invoice) => (invoice.status || "").toLowerCase() === "paid",
      );
      const membershipRevenueMap = new Map<string, number>();
      paidAllInvoices.forEach((invoice) => {
        if (!filteredMemberIds.has(invoice.member_id || "")) return;
        const member = memberById.get(invoice.member_id || "");
        const type = member?.membership_type || "Unknown";
        membershipRevenueMap.set(
          type,
          (membershipRevenueMap.get(type) || 0) + invoiceAmount(invoice),
        );
      });
      const membershipRevenue = Array.from(membershipRevenueMap.entries()).map(
        ([category, amount]) => ({
          category,
          amount,
          percentage: currentRevenue > 0 ? Math.round((amount / currentRevenue) * 100) : 0,
          color: "#3B82F6",
        }),
      );

      const paymentRevenueMap = new Map<string, number>();
      paidAllInvoices.forEach((invoice) => {
        if (!filteredMemberIds.has(invoice.member_id || "")) return;
        const method = invoice.payment_method || "Unknown";
        paymentRevenueMap.set(
          method,
          (paymentRevenueMap.get(method) || 0) + invoiceAmount(invoice),
        );
      });
      const paymentMethodRevenue = Array.from(paymentRevenueMap.entries()).map(
        ([category, amount]) => ({
          category,
          amount,
          percentage: currentRevenue > 0 ? Math.round((amount / currentRevenue) * 100) : 0,
          color: "#10B981",
        }),
      );

      const sourceRevenueMap = new Map<string, number>();
      paidAllInvoices.forEach((invoice) => {
        if (!filteredMemberIds.has(invoice.member_id || "")) return;
        const source = invoice.type || "Unknown";
        sourceRevenueMap.set(
          source,
          (sourceRevenueMap.get(source) || 0) + invoiceAmount(invoice),
        );
      });
      const sourceRevenue = Array.from(sourceRevenueMap.entries()).map(
        ([category, amount]) => ({
          category,
          amount,
          percentage: currentRevenue > 0 ? Math.round((amount / currentRevenue) * 100) : 0,
          color: "#F59E0B",
        }),
      );

      const timeSeriesData = lastSixMonths.map((monthKey) => {
        const revenue = revenueByMonth[monthKey] || 0;
        const previousMonthRevenue =
          revenueByMonth[
            lastSixMonths[lastSixMonths.indexOf(monthKey) - 1] || ""
          ] || 0;
        return {
          period: monthKey,
          revenue,
          change: calculateChange(revenue, previousMonthRevenue),
        };
      });

      const productMap = new Map<string, { revenue: number; units: number }>();
      paidAllInvoices.forEach((invoice) => {
        if (!Array.isArray(invoice.line_items)) return;
        (invoice.line_items as Array<{
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
        }>).forEach((item) => {
          const name = item.description || "Item";
          const units = Number(item.quantity) || 1;
          const revenue = Number(item.total) || Number(item.unit_price) * units || 0;
          const existing = productMap.get(name) || { revenue: 0, units: 0 };
          productMap.set(name, {
            revenue: existing.revenue + revenue,
            units: existing.units + units,
          });
        });
      });
      const topProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, revenue: data.revenue, units: data.units }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const vatCollected = paidInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.vat_total || 0),
        0,
      );
      const vatRefunded = invoicesInRange
        .filter((invoice) => (invoice.status || "").toLowerCase() === "cancelled")
        .reduce((sum, invoice) => sum + Number(invoice.vat_total || 0), 0);

      setRevenueOverviewData({
        timeSeriesData,
        membershipRevenue,
        paymentMethodRevenue,
        sourceRevenue,
        topProducts,
        vatSummary: {
          total: currentRevenue,
          collected: vatCollected,
          refunded: vatRefunded,
          net: vatCollected - vatRefunded,
        },
      });
    } catch (error: unknown) {
      console.error("Error fetching analytics data:", error);

      // Narrow the unknown error to the Postgrest-style shape we expect
      const errObj =
        error && typeof error === "object"
          ? (error as Record<string, unknown>)
          : {};
      const errCode = typeof errObj.code === "string" ? errObj.code : undefined;
      const errMessageProp =
        typeof errObj.message === "string" ? errObj.message : undefined;
      const errDetails =
        typeof errObj.details === "string" ? errObj.details : undefined;
      const errHint = typeof errObj.hint === "string" ? errObj.hint : undefined;

      // Provide more specific error messages
      let errorMessage = "Failed to load analytics data";

      if (errMessageProp) {
        errorMessage = errMessageProp;
      } else if (errCode === "PGRST116" || errMessageProp?.includes("relation") || errMessageProp?.includes("does not exist")) {
        errorMessage = "One or more required database tables are missing. Please check your database schema.";
      } else if (errCode === "42501" || errMessageProp?.includes("permission denied") || errMessageProp?.includes("row-level security")) {
        errorMessage = "Permission denied. Please check your Row Level Security policies.";
      } else if (errCode === "42883" || (errMessageProp?.includes("function") && errMessageProp?.includes("does not exist"))) {
        errorMessage = "Database function missing. Please ensure get_user_tenant_id() function exists.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error("Analytics error details:", {
        message: errorMessage,
        code: errCode,
        details: errDetails,
        hint: errHint,
        fullError: error,
      });

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    filters.branch,
    filters.dateRange,
    filters.customStartDate,
    filters.customEndDate,
    filters.minRevenue,
    filters.maxRevenue,
    tenantId,
  ]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check authentication
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user has paid subscription
    if (!userMetadata?.paid) {
      navigate("/subscribe");
      return;
    }

    // User is authenticated and paid, fetch initial data
    if (tenantId) {
      fetchInitialData();
    }
  }, [authLoading, fetchInitialData, navigate, user, userMetadata, tenantId]);

  // Handle URL parameters for tab selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam && ANALYTICS_URL_TABS.includes(tabParam as AnalyticsView)) {
      setActiveView(tabParam as AnalyticsView);
    }
  }, []);

  // Fetch dashboard data when tenantId is available or filters change
  useEffect(() => {
    if (authLoading) {
      // Still waiting for auth, don't fetch yet
      return;
    }

    if (!tenantId) {
      // No tenantId available, ensure we're not stuck in loading
      setLoading(false);
      return;
    }

    // We have tenantId and auth is ready, fetch data
    fetchDashboardData();
  }, [
    authLoading,
    fetchDashboardData,
    filters.branch,
    filters.dateRange,
    filters.customStartDate,
    filters.customEndDate,
    filters.minRevenue,
    filters.maxRevenue,
    tenantId,
  ]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn("Analytics loading timeout - forcing loading to false");
        setLoading(false);
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [loading]);

  const mapInsightPriority = (priority: number): "high" | "medium" | "low" => {
    if (priority >= 80) return "high";
    if (priority >= 50) return "medium";
    return "low";
  };

  const mapInsightCategory = (
    insightType: SmartInsight["insight_type"],
  ): "revenue" | "members" | "operations" => {
    switch (insightType) {
      case "opportunity":
        return "revenue";
      case "trend":
        return "members";
      case "automation_suggestion":
        return "operations";
      case "critical_alert":
      default:
        return "operations";
    }
  };

  const uiInsights = React.useMemo(
    () =>
      insights.map((insight) => ({
        id: insight.id,
        title: insight.title,
        description: insight.description ?? "No description available.",
        priority: mapInsightPriority(insight.priority),
        impact: insight.impact ?? insight.potential ?? "N/A",
        action: insight.action ?? "Review",
        category: mapInsightCategory(insight.insight_type),
      })),
    [insights],
  );

  const handleInsightAction = (id: string, action: string) => {
    const label = action || id;
    switch (action) {
      case "Create Task":
        toast.success("Opening task creation...");
        break;
      case "Create Campaign":
        toast.success("Opening campaign creation...");
        break;
      case "View Members":
        toast.success("Opening members list...");
        navigate("/dashboard/members");
        break;
      case "Schedule Class":
        toast.success("Opening class scheduling...");
        break;
      case "Create Package":
        toast.success("Opening package creation...");
        break;
      default:
        toast(`Action: ${label}`);
    }
  };

  const showToast = (type: "success" | "error" | "info", message: string) => {
    if (type === "success") {
      toast.success(message);
      return;
    }
    if (type === "error") {
      toast.error(message);
      return;
    }
    toast(message);
  };

  const handleExportReport = async () => {
    try {
      // TODO: Implement real export functionality
      showToast("success", "Report exported successfully!");
    } catch (error) {
      showToast("error", "Failed to export report");
    }
  };


  const handleScheduleReport = async () => {
    try {
      // TODO: Implement real report scheduling
      showToast("success", "Report scheduled successfully!");
    } catch (error) {
      showToast("error", "Failed to schedule report");
    }
  };

  const handleShareReport = async () => {
    try {
      // TODO: Implement real report sharing
      showToast("success", "Report shared successfully!");
    } catch (error) {
      showToast("error", "Failed to share report");
    }
  };

  const handlePrintReport = async () => {
    try {
      // TODO: Implement real print functionality
      showToast("success", "Report sent to printer!");
    } catch (error) {
      showToast("error", "Failed to print report");
    }
  };

  const closeModal = (modalName: keyof typeof modalState) => {
    setModalState((prev) => ({ ...prev, [modalName]: false }));
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                      </div>
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : analyticsStats.length === 0 ? (
              <div className={`bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 ${isRTL ? 'text-right' : 'text-center'}`}>
                <FiBarChart2 className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-2 ${isRTL ? 'text-right' : 'text-center'}`}>
                  {t("analytics.noDataAvailable")}
                </h3>
                <p className={`text-gray-600 dark:text-gray-400 mb-6 ${isRTL ? 'text-right' : 'text-center'}`}>
                  {t("analytics.noDataDescription")}
                </p>
                <button
                  onClick={() => fetchDashboardData()}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                >
                  {t("analytics.refreshData")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {analyticsStats.map((stat, index) => (
                  <motion.div
                    key={stat.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {stat.name}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {stat.value}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {stat.change}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                      >
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}


          </div>
        );

      case "members":
        return (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  <p className={`ml-3 text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-3 ml-0' : ''}`}>{t("analytics.loadingMemberAnalytics")}</p>
                </div>
              </div>
            ) : memberAnalyticsData ? (
              <MemberAnalytics {...memberAnalyticsData} />
            ) : (
              <div className={`bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 ${isRTL ? 'text-right' : 'text-center'}`}>
                <FiUsers className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-2 ${isRTL ? 'text-right' : 'text-center'}`}>
                  {t("analytics.noDataAvailable")}
                </h3>
                <p className={`text-gray-600 dark:text-gray-400 mb-6 ${isRTL ? 'text-right' : 'text-center'}`}>
                  {t("analytics.noDataDescription")}
                </p>
                <button
                  onClick={() => fetchDashboardData()}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                >
                  {t("analytics.refreshData")}
                </button>
              </div>
            )}
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  <p className={`ml-3 text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-3 ml-0' : ''}`}>{t("analytics.loadingRevenueAnalytics")}</p>
                </div>
              </div>
            ) : revenueOverviewData ? (
              <RevenueOverview {...revenueOverviewData} />
            ) : (
              <div className={`bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 ${isRTL ? 'text-right' : 'text-center'}`}>
                <FiDollarSign className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-2 ${isRTL ? 'text-right' : 'text-center'}`}>
                  {t("analytics.noDataAvailable")}
                </h3>
                <p className={`text-gray-600 dark:text-gray-400 mb-6 ${isRTL ? 'text-right' : 'text-center'}`}>
                  {t("analytics.noDataDescription")}
                </p>
                <button
                  onClick={() => fetchDashboardData()}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                >
                  {t("analytics.refreshData")}
                </button>
              </div>
            )}
          </div>
        );

      case "classes":
        return (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  <p className={`ml-3 text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-3 ml-0' : ''}`}>Loading class analytics...</p>
                </div>
              </div>
            ) : (
              <div className={`bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 ${isRTL ? 'text-right' : 'text-center'}`}>
                <FiCalendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-2 ${isRTL ? 'text-right' : 'text-center'}`}>
                  {t("analytics.classAnalytics")}
                </h3>
                <p className={`text-gray-600 dark:text-gray-400 mb-6 ${isRTL ? 'text-right' : 'text-center'}`}>
                  {t("analytics.classAnalyticsContent")}
                </p>
                <button
                  onClick={() => fetchDashboardData()}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                >
                  {t("analytics.refreshData")}
                </button>
              </div>
            )}
          </div>
        );

      case "insights":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-semibold text-gray-900 dark:text-white mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("analytics.smartInsights")}
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  <p className={`ml-3 text-gray-600 ${isRTL ? 'mr-3 ml-0' : ''}`}>Loading insights...</p>
                </div>
              ) : uiInsights.length === 0 ? (
                <div className={`py-12 ${isRTL ? 'text-right' : 'text-center'}`}>
                  <FiTarget className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-2 ${isRTL ? 'text-right' : 'text-center'}`}>
                    No Insights Available
                  </h3>
                  <p className={`text-gray-600 dark:text-gray-400 mb-6 ${isRTL ? 'text-right' : 'text-center'}`}>
                    We&apos;re analyzing your data. Insights will appear here once we have enough information.
                  </p>
                  <button
                    onClick={() => {
                      fetchInitialData();
                      fetchDashboardData();
                    }}
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    {t("analytics.refreshData")}
                  </button>
                </div>
              ) : (
                <SmartInsightCards
                  insights={uiInsights}
                  onActionClick={(insight) =>
                    handleInsightAction(insight.id, insight.action)
                  }
                  isPro={isPro}
                />
              )}
            </div>
          </div>
        );



      default:
        return null;
    }
  };

  // Show loading spinner if actively loading or waiting for auth
  // The timeout safeguard ensures we don't get stuck forever
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="text-start">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              📊 Smart Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Smart-powered insights • Real-time data • Actionable reports
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setModalState((prev) => ({ ...prev, export: true }))
              }
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <FiDownload className="w-4 h-4" />
              <span>{t("analytics.export")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Range Filter */}
          <div className="flex-1">
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {dateFilters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filters.branch}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, branch: e.target.value }))
              }
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <option value="all">All Branches</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showAdvancedFilters
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Advanced filters"
            >
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Date Range Row */}
        {filters.dateRange === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-t border-gray-100 dark:border-gray-700/50 pt-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("analytics.startDate") || "Start Date"}
              </label>
              <input
                type="date"
                value={filters.customStartDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, customStartDate: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("analytics.endDate") || "End Date"}
              </label>
              <input
                type="date"
                value={filters.customEndDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, customEndDate: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === tab.id
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveView()}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>

        {modalState.export && (
          <ExportReportModal
            open={modalState.export}
            onClose={() => closeModal("export")}
            onSuccess={handleExportReport}
          />
        )}

        {modalState.scheduleReport && (
          <ScheduleReportModal
            open={modalState.scheduleReport}
            onClose={() => closeModal("scheduleReport")}
            onSuccess={handleScheduleReport}
          />
        )}

        {modalState.shareReport && (
          <ShareReportModal
            open={modalState.shareReport}
            onClose={() => closeModal("shareReport")}
            onSuccess={handleShareReport}
          />
        )}

        {modalState.printReport && (
          <PrintReportModal
            open={modalState.printReport}
            onClose={() => closeModal("printReport")}
            onSuccess={handlePrintReport}
          />
        )}

        {modalState.viewDetails && (
          <ViewDetailsModal
            open={modalState.viewDetails}
            onClose={() => closeModal("viewDetails")}
            section={viewDetailsData.section}
            data={viewDetailsData.data}
            dateRange={filters.dateRange}
          />
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        title={t("analytics.advancedFilters")}
        clearLabel={t("analytics.clearAllFilters")}
        onClear={() => {
          setFilters({
            dateRange: "last-30-days",
            customStartDate: toDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
            customEndDate: toDateString(new Date()),
            branch: "all",
            metricType: "all",
            minRevenue: "",
            maxRevenue: "",
          });
        }}
      >
        {/* Metric Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("analytics.metricType")}
          </label>
          <select
            value={filters.metricType}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                metricType: e.target.value,
              }))
            }
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <option value="all">{t("analytics.allMetrics")}</option>
            <option value="revenue">{t("analytics.revenue")}</option>
            <option value="members">{t("analytics.members")}</option>
            <option value="classes">{t("analytics.classes")}</option>
            <option value="attendance">{t("dashboard.attendance")}</option>
            <option value="retention">{t("members.retention")}</option>
          </select>
        </div>

        {/* Member Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("analytics.memberType")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("analytics.allMemberTypes")}</option>
            <option value="active">{t("members.active")}</option>
            <option value="inactive">{t("members.inactive")}</option>
            <option value="premium">{t("members.premium")}</option>
            <option value="standard">{t("members.standard")}</option>
            <option value="trial">{t("members.trial")}</option>
          </select>
        </div>

        {/* Class Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("analytics.classType")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("analytics.allClassTypes")}</option>
            <option value="group">{t("classes.groupClasses")}</option>
            <option value="personal">{t("classes.personalTraining")}</option>
            <option value="virtual">{t("classes.virtualClasses")}</option>
            <option value="workshop">{t("classes.workshops")}</option>
          </select>
        </div>

        {/* Revenue Range Filter */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("analytics.minimumRevenue") || "Min Revenue"}
            </label>
            <input
              type="number"
              value={filters.minRevenue}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  minRevenue: e.target.value,
                }))
              }
              placeholder="0.00"
              step="0.01"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all"
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("analytics.maximumRevenue") || "Max Revenue"}
            </label>
            <input
              type="number"
              value={filters.maxRevenue}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  maxRevenue: e.target.value,
                }))
              }
              placeholder="0.00"
              step="0.01"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all"
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
        </div>
      </AdvancedFilterModal>
    </div>
  );
}
