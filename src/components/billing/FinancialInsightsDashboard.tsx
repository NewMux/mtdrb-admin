import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCreditCard,
  FiFileText,
  FiCalendar,
  FiTarget,
  FiActivity,
  FiAward,
  FiFilter,
  FiClock,
  FiUser,
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiDownload,
  FiRefreshCw,
  FiPercent,
  FiPlus,
  FiShoppingCart,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AnimatePresence } from "framer-motion";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { Branch, Expense, Invoice, Member, PaymentMethodType, InvoiceStatus } from "../../types";

interface FinancialInsightsDashboardProps {
  refreshKey: number;
}

interface FilterState {
  branches: string[];
  dateRange: string;
  membershipType: string;
  paymentMethod: string;
  invoiceStatus: string;
  vatFilingStatus: string;
}

interface RevenueMetrics {
  totalRevenue: number;
  mrr: number;
  avgRevenuePerMember: number;
  newRevenue: number;
  projectedRevenue: number;
  revenueFromAddons: number;
}

interface InvoiceMetrics {
  totalInvoicesIssued: number;
  paidInvoices: number;
  unpaidOverdueInvoices: number;
  avgInvoiceValue: number;
  failedPayments: number;
}

interface ExpenseMetrics {
  totalExpenses: number;
  netProfit: number;
  topExpenseCategories: Array<{ category: string; amount: number }>;
  avgProfitMargin: number;
}

interface VatMetrics {
  vatCollected: number;
  vatPaid: number;
  vatBalance: number;
  nextFilingDeadline: string;
  filedReturnsThisPeriod: number;
}

interface RiskMetrics {
  churnedMembersRevenueLoss: number;
  atRiskRevenue: number;
  latePaymentRate: number;
  unpaidHighValueInvoices: number;
}

interface ChartData {
  revenueTrend: Array<{ date: string; revenue: number }>;
  invoicesOverTime: Array<{ date: string; count: number }>;
  revenueByBranch: Array<{ branch: string; revenue: number }>;
  paymentMethodSplit: Array<{ method: string; percentage: number }>;
  membershipTypeRevenue: Array<{ type: string; percentage: number }>;
}

interface FilterOptions {
  branches: Array<Pick<Branch, "id" | "name">>;
  membershipTypes: string[];
  paymentMethods: string[];
  invoiceStatuses: string[];
  vatStatuses: string[];
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

/**
 * Normalize a status value for comparisons.
 */
const normalizeStatus = (status?: string | null) =>
  (status || "").trim().toLowerCase();

/**
 * Resolve a date range from the filter key.
 */
const resolveDateRange = (rangeKey: string) => {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (rangeKey) {
    case "last-month": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end.setFullYear(now.getFullYear(), now.getMonth(), 0);
      break;
    }
    case "last-3-months": {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    }
    case "this-year": {
      start = new Date(now.getFullYear(), 0, 1);
      break;
    }
    case "this-month":
    default: {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
  }

  return { start, end };
};

/**
 * Format a date to YYYY-MM-DD for Supabase filters.
 */
const toDateString = (date: Date) => date.toISOString().split("T")[0];

/**
 * Resolve invoice date for grouping.
 */
const getInvoiceDate = (invoice: Pick<Invoice, "issue_date" | "created_at">) =>
  invoice.issue_date || invoice.created_at || "";

/**
 * Resolve invoice amount for rollups.
 */
const getInvoiceAmount = (
  invoice: Pick<Invoice, "total" | "amount" | "paid_amount">,
) => {
  return (
    Number(invoice.total) ||
    Number(invoice.amount) ||
    Number(invoice.paid_amount) ||
    0
  );
};

/**
 * Resolve expense date for grouping.
 */
/**
 * Convert a date string into a YYYY-MM key.
 */
const toMonthKey = (dateValue: string) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const FilterBar: React.FC<{
  filters: FilterState;
  options: FilterOptions;
  onFilterChange: (filters: FilterState) => void;
}> = ({ filters, options, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <Key extends keyof FilterState>(
    key: Key,
    value: FilterState[Key],
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-6 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FiFilter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Financial Analytics Filters
          </span>
        </button>

        {isExpanded && (
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <FiRefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <FiDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
              {/* Branch Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.branches[0] || ""}
                  onChange={(e) => updateFilter("branches", [e.target.value])}
                >
                  <option value="">All Branches</option>
                  {options.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.dateRange}
                  onChange={(e) => updateFilter("dateRange", e.target.value)}
                >
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="last-3-months">Last 3 Months</option>
                  <option value="this-year">This Year</option>
                </select>
              </div>

              {/* Membership Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membership
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.membershipType}
                  onChange={(e) =>
                    updateFilter("membershipType", e.target.value)
                  }
                >
                  <option value="">All Types</option>
                  {options.membershipTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    updateFilter("paymentMethod", e.target.value)
                  }
                >
                  <option value="">All Methods</option>
                  {options.paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Status
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.invoiceStatus}
                  onChange={(e) =>
                    updateFilter("invoiceStatus", e.target.value)
                  }
                >
                  <option value="">All Status</option>
                  {options.invoiceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* VAT Filing Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT Status
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.vatFilingStatus}
                  onChange={(e) =>
                    updateFilter("vatFilingStatus", e.target.value)
                  }
                >
                  <option value="">All Status</option>
                  {options.vatStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon: React.ReactNode;
  color: string;
  format?: "currency" | "percentage" | "number";
  currency?: string;
}> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color,
  format = "number",
  currency,
}) => {
  const getTrendColor = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = () => {
    if (trend === "up") return <FiTrendingUp className="w-4 h-4" />;
    if (trend === "down") return <FiTrendingDown className="w-4 h-4" />;
    return <FiActivity className="w-4 h-4" />;
  };

  const formatValue = (val: string | number) => {
    if (format === "currency") {
      const amount = Number(val).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return currency ? `${currency} ${amount}` : amount;
    }
    if (format === "percentage") {
      return `${val}%`;
    }
    return val;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}
        >
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">
          {title}
        </h3>
        <p className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <div
    className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-200 ${className}`}
  >
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      {title}
    </h3>
    {children}
  </div>
);

export default function FinancialInsightsDashboard({
  refreshKey,
}: FinancialInsightsDashboardProps) {
  const { tenantId } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    branches: [],
    dateRange: "this-month",
    membershipType: "",
    paymentMethod: "",
    invoiceStatus: "",
    vatFilingStatus: "",
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    branches: [],
    membershipTypes: [],
    paymentMethods: [],
    invoiceStatuses: [],
    vatStatuses: [],
  });
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    mrr: 0,
    avgRevenuePerMember: 0,
    newRevenue: 0,
    projectedRevenue: 0,
    revenueFromAddons: 0,
  });
  const [invoiceMetrics, setInvoiceMetrics] = useState<InvoiceMetrics>({
    totalInvoicesIssued: 0,
    paidInvoices: 0,
    unpaidOverdueInvoices: 0,
    avgInvoiceValue: 0,
    failedPayments: 0,
  });
  const [expenseMetrics, setExpenseMetrics] = useState<ExpenseMetrics>({
    totalExpenses: 0,
    netProfit: 0,
    topExpenseCategories: [],
    avgProfitMargin: 0,
  });
  const [vatMetrics, setVatMetrics] = useState<VatMetrics>({
    vatCollected: 0,
    vatPaid: 0,
    vatBalance: 0,
    nextFilingDeadline: "",
    filedReturnsThisPeriod: 0,
  });
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    churnedMembersRevenueLoss: 0,
    atRiskRevenue: 0,
    latePaymentRate: 0,
    unpaidHighValueInvoices: 0,
  });
  const [currencyCode, setCurrencyCode] = useState<string>("");
  const [chartData, setChartData] = useState<ChartData>({
    revenueTrend: [],
    invoicesOverTime: [],
    revenueByBranch: [],
    paymentMethodSplit: [],
    membershipTypeRevenue: [],
  });
  const [loading, setLoading] = useState(false);

  /**
   * Fetch billing analytics data from Supabase and hydrate metrics.
   */
  const fetchBillingAnalyticsData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);

      const { start, end } = resolveDateRange(filters.dateRange);
      const startDate = toDateString(start);
      const endDate = toDateString(end);

      const [
        settingsResult,
        branchesResult,
        membersResult,
        invoicesResult,
        expensesResult,
        vatReturnsResult,
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
            "id, status, membership_type, created_at, join_date, expiry_date, assigned_branch_id",
          )
          .eq("tenant_id", tenantId),
        supabase
          .from("invoices")
          .select(
            "id, member_id, type, status, issue_date, created_at, due_date, payment_method, total, amount, paid_amount, vat_total, currency",
          )
          .eq("tenant_id", tenantId)
          .gte("created_at", startDate)
          .lte("created_at", endDate),
        supabase
          .from("expenses")
          .select("amount, category, date, created_at, status, vat_amount")
          .eq("tenant_id", tenantId)
          .gte("date", startDate)
          .lte("date", endDate),
        supabase
          .from("vat_returns")
          .select("status, due_date, filed_date, period_start, period_end")
          .eq("tenant_id", tenantId),
      ]);

      if (settingsResult.error && settingsResult.error.code !== "PGRST116") {
        throw settingsResult.error;
      }
      if (branchesResult.error) throw branchesResult.error;
      if (membersResult.error) throw membersResult.error;
      if (invoicesResult.error) throw invoicesResult.error;
      if (expensesResult.error) throw expensesResult.error;
      if (vatReturnsResult.error) throw vatReturnsResult.error;

      const invoiceCurrency =
        invoicesResult.data?.find((invoice) => invoice.currency)?.currency || "";
      setCurrencyCode(settingsResult.data?.currency || invoiceCurrency || "");

      const branches = branchesResult.data || [];
      const members = (membersResult.data || []) as Member[];
      const invoices = (invoicesResult.data || []) as Invoice[];
      const expenses = (expensesResult.data || []) as Expense[];
      const vatReturns =
        (vatReturnsResult.data || []) as Array<{
          status: string | null;
          due_date: string | null;
          filed_date: string | null;
          period_start: string | null;
          period_end: string | null;
        }>;

      const branchOptions = branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
      }));
      const membershipTypes = Array.from(
        new Set(
          members
            .map((member) => member.membership_type)
            .filter((type): type is string => Boolean(type)),
        ),
      );
      const paymentMethods = Array.from(
        new Set(
          invoices
            .map((invoice) => invoice.payment_method)
            .filter((method): method is PaymentMethodType => Boolean(method) && typeof method === 'string'),
        ),
      );
      const invoiceStatuses = Array.from(
        new Set(
          invoices
            .map((invoice) => invoice.status)
            .filter((status): status is InvoiceStatus => Boolean(status) && typeof status === 'string'),
        ),
      );
      const vatStatuses = Array.from(
        new Set(
          vatReturns
            .map((vatReturn) => vatReturn.status)
            .filter((status): status is string => Boolean(status)),
        ),
      );

      setFilterOptions({
        branches: branchOptions,
        membershipTypes,
        paymentMethods,
        invoiceStatuses,
        vatStatuses,
      });

      const branchFilterIds = filters.branches.filter(Boolean);
      const memberIdsByBranch = branchFilterIds.length
        ? new Set(
            members
              .filter((member) =>
                branchFilterIds.includes(member.assigned_branch_id || ""),
              )
              .map((member) => member.id)
              .filter(Boolean),
          )
        : null;

      const memberIdsByType = filters.membershipType
        ? new Set(
            members
              .filter((member) => member.membership_type === filters.membershipType)
              .map((member) => member.id)
              .filter(Boolean),
          )
        : null;

      const filteredInvoices = invoices.filter((invoice) => {
        if (filters.paymentMethod && invoice.payment_method !== filters.paymentMethod) {
          return false;
        }
        if (
          filters.invoiceStatus &&
          normalizeStatus(invoice.status) !== normalizeStatus(filters.invoiceStatus)
        ) {
          return false;
        }
        if (memberIdsByBranch && !memberIdsByBranch.has(invoice.member_id || "")) {
          return false;
        }
        if (memberIdsByType && !memberIdsByType.has(invoice.member_id || "")) {
          return false;
        }
        return true;
      });

      const filteredMembers = members.filter((member) => {
        if (branchFilterIds.length && !branchFilterIds.includes(member.assigned_branch_id || "")) {
          return false;
        }
        if (filters.membershipType && member.membership_type !== filters.membershipType) {
          return false;
        }
        return true;
      });

      const paidInvoices = filteredInvoices.filter(
        (invoice) => normalizeStatus(invoice.status) === "paid",
      );
      const totalRevenue = paidInvoices.reduce(
        (sum, invoice) => sum + getInvoiceAmount(invoice),
        0,
      );
      const invoiceAmounts = filteredInvoices.map(getInvoiceAmount);
      const avgInvoiceValue =
        invoiceAmounts.length > 0
          ? invoiceAmounts.reduce((sum, amount) => sum + amount, 0) /
            invoiceAmounts.length
          : 0;

      const activeMembers = filteredMembers.filter((member) => {
        const status = normalizeStatus(member.status);
        return status === "active" || status === "trial";
      }).length;

      const monthsCovered =
        Math.max(
          1,
          (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth()) +
            1,
        );
      const mrr = monthsCovered > 0 ? totalRevenue / monthsCovered : totalRevenue;

      const newMembers = filteredMembers.filter((member) => {
        const created = member.join_date || member.created_at;
        if (!created) return false;
        const createdDate = new Date(created);
        return createdDate >= start && createdDate <= end;
      });
      const newMemberIds = new Set(newMembers.map((member) => member.id).filter(Boolean));
      const newRevenue = paidInvoices
        .filter((invoice) => newMemberIds.has(invoice.member_id || ""))
        .reduce((sum, invoice) => sum + getInvoiceAmount(invoice), 0);

      const nonMembershipRevenue = paidInvoices
        .filter((invoice) => normalizeStatus(invoice.type) !== "membership")
        .reduce((sum, invoice) => sum + getInvoiceAmount(invoice), 0);

      const overdueInvoices = filteredInvoices.filter((invoice) => {
        const status = normalizeStatus(invoice.status);
        if (status === "paid" || status === "cancelled") return false;
        if (!invoice.due_date) return false;
        return new Date(invoice.due_date) < new Date();
      });

      const failedPayments = filteredInvoices.filter(
        (invoice) => normalizeStatus(invoice.status) === "cancelled",
      );

      const eligibleExpenses = expenses.filter((expense) => {
        const status = normalizeStatus(expense.status);
        return status === "paid" || status === "approved";
      });

      const totalExpenses = eligibleExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0,
      );
      const netProfit = totalRevenue - totalExpenses;
      const avgProfitMargin =
        totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const expenseCategoryTotals = eligibleExpenses.reduce(
        (acc, expense) => {
          const category = expense.category || "Other";
          acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
          return acc;
        },
        {} as Record<string, number>,
      );
      const topExpenseCategories = Object.entries(expenseCategoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([category, amount]) => ({ category, amount }));

      const vatCollected = paidInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.vat_total || 0),
        0,
      );
      const vatPaid = eligibleExpenses.reduce(
        (sum, expense) => sum + Number(expense.vat_amount || 0),
        0,
      );
      const vatBalance = vatCollected - vatPaid;
      const vatReturnsFiltered = filters.vatFilingStatus
        ? vatReturns.filter(
            (vatReturn) =>
              normalizeStatus(vatReturn.status) ===
              normalizeStatus(filters.vatFilingStatus),
          )
        : vatReturns;
      const nextFilingDeadline =
        vatReturnsFiltered
          .filter((vatReturn) => vatReturn.due_date)
          .sort((a, b) =>
            new Date(a.due_date || 0).getTime() -
            new Date(b.due_date || 0).getTime(),
          )[0]?.due_date || "";

      const filedReturnsThisPeriod = vatReturnsFiltered.filter((vatReturn) => {
        if (!vatReturn.filed_date) return false;
        const filedDate = new Date(vatReturn.filed_date);
        return filedDate >= start && filedDate <= end;
      }).length;

      const churnedMemberIds = new Set(
        filteredMembers
          .filter((member) => normalizeStatus(member.status) === "inactive")
          .map((member) => member.id)
          .filter(Boolean),
      );
      const churnedMembersRevenueLoss = paidInvoices
        .filter((invoice) => churnedMemberIds.has(invoice.member_id || ""))
        .reduce((sum, invoice) => sum + getInvoiceAmount(invoice), 0);

      const atRiskThreshold = new Date();
      atRiskThreshold.setDate(atRiskThreshold.getDate() + 30);
      const atRiskMemberIds = new Set(
        filteredMembers
          .filter((member) => {
            if (!member.expiry_date) return false;
            const expiryDate = new Date(member.expiry_date);
            return expiryDate >= new Date() && expiryDate <= atRiskThreshold;
          })
          .map((member) => member.id)
          .filter(Boolean),
      );
      const atRiskRevenue = paidInvoices
        .filter((invoice) => atRiskMemberIds.has(invoice.member_id || ""))
        .reduce((sum, invoice) => sum + getInvoiceAmount(invoice), 0);

      const unpaidHighValueInvoices = overdueInvoices.filter(
        (invoice) => getInvoiceAmount(invoice) > 500,
      ).length;
      const latePaymentRate =
        filteredInvoices.length > 0
          ? (overdueInvoices.length / filteredInvoices.length) * 100
          : 0;

      const revenueTrendMap = new Map<string, number>();
      const invoicesTrendMap = new Map<string, number>();
      paidInvoices.forEach((invoice) => {
        const monthKey = toMonthKey(getInvoiceDate(invoice));
        if (!monthKey) return;
        revenueTrendMap.set(
          monthKey,
          (revenueTrendMap.get(monthKey) || 0) + getInvoiceAmount(invoice),
        );
      });
      filteredInvoices.forEach((invoice) => {
        const monthKey = toMonthKey(getInvoiceDate(invoice));
        if (!monthKey) return;
        invoicesTrendMap.set(
          monthKey,
          (invoicesTrendMap.get(monthKey) || 0) + 1,
        );
      });

      const revenueTrend = Array.from(revenueTrendMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, revenue]) => ({ date, revenue }));
      const invoicesOverTime = Array.from(invoicesTrendMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

      const branchRevenueMap = new Map<string, number>();
      const branchNameById = new Map(
        branches.map((branch) => [branch.id, branch.name]),
      );
      const memberBranchMap = new Map(
        members.map((member) => [member.id, member.assigned_branch_id || ""]),
      );
      paidInvoices.forEach((invoice) => {
        const branchId = memberBranchMap.get(invoice.member_id || "") || "";
        const branchName =
          branchNameById.get(branchId) || (branchId ? branchId : "Unassigned");
        branchRevenueMap.set(
          branchName,
          (branchRevenueMap.get(branchName) || 0) + getInvoiceAmount(invoice),
        );
      });
      const revenueByBranch = Array.from(branchRevenueMap.entries()).map(
        ([branch, revenue]) => ({ branch, revenue }),
      );

      const paymentRevenueMap = new Map<string, number>();
      paidInvoices.forEach((invoice) => {
        const method = invoice.payment_method || "Unknown";
        paymentRevenueMap.set(
          method,
          (paymentRevenueMap.get(method) || 0) + getInvoiceAmount(invoice),
        );
      });
      const paymentMethodSplit = Array.from(paymentRevenueMap.entries()).map(
        ([method, amount]) => ({
          method,
          percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
        }),
      );

      const membershipRevenueMap = new Map<string, number>();
      const memberTypeMap = new Map(
        members.map((member) => [member.id, member.membership_type || "Unknown"]),
      );
      paidInvoices.forEach((invoice) => {
        const type = memberTypeMap.get(invoice.member_id || "") || "Unknown";
        membershipRevenueMap.set(
          type,
          (membershipRevenueMap.get(type) || 0) + getInvoiceAmount(invoice),
        );
      });
      const membershipTypeRevenue = Array.from(
        membershipRevenueMap.entries(),
      ).map(([type, amount]) => ({
        type,
        percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
      }));

      setRevenueMetrics({
        totalRevenue,
        mrr,
        avgRevenuePerMember: activeMembers > 0 ? totalRevenue / activeMembers : 0,
        newRevenue,
        projectedRevenue: mrr,
        revenueFromAddons: nonMembershipRevenue,
      });
      setInvoiceMetrics({
        totalInvoicesIssued: filteredInvoices.length,
        paidInvoices: paidInvoices.length,
        unpaidOverdueInvoices: overdueInvoices.length,
        avgInvoiceValue,
        failedPayments: failedPayments.length,
      });
      setExpenseMetrics({
        totalExpenses,
        netProfit,
        topExpenseCategories,
        avgProfitMargin,
      });
      setVatMetrics({
        vatCollected,
        vatPaid,
        vatBalance,
        nextFilingDeadline,
        filedReturnsThisPeriod,
      });
      setRiskMetrics({
        churnedMembersRevenueLoss,
        atRiskRevenue,
        latePaymentRate,
        unpaidHighValueInvoices,
      });
      setChartData({
        revenueTrend,
        invoicesOverTime,
        revenueByBranch,
        paymentMethodSplit,
        membershipTypeRevenue,
      });
    } catch (error) {
      console.error("Failed to fetch billing analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange, filters.invoiceStatus, filters.membershipType, filters.paymentMethod, filters.vatFilingStatus, filters.branches, tenantId]);

  useEffect(() => {
    fetchBillingAnalyticsData();
  }, [fetchBillingAnalyticsData, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        options={filterOptions}
        onFilterChange={setFilters}
      />

      {/* Revenue Overview */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          💰 Revenue Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Total Revenue"
            value={revenueMetrics.totalRevenue}
            subtitle="This period"
            trend="up"
            trendValue="+12%"
            icon={<FiDollarSign className="w-6 h-6 text-white" />}
            color="bg-green-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="MRR"
            value={revenueMetrics.mrr}
            subtitle="Monthly Recurring Revenue"
            trend="up"
            trendValue="+8%"
            icon={<FiTrendingUp className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="Avg. Revenue per Member"
            value={revenueMetrics.avgRevenuePerMember}
            subtitle="Per member average"
            trend="up"
            trendValue="+5%"
            icon={<FiUser className="w-6 h-6 text-white" />}
            color="bg-purple-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="New Revenue"
            value={revenueMetrics.newRevenue}
            subtitle="This period"
            trend="up"
            trendValue="+15%"
            icon={<FiAward className="w-6 h-6 text-white" />}
            color="bg-orange-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="Projected Revenue"
            value={revenueMetrics.projectedRevenue}
            subtitle="Next month"
            trend="up"
            trendValue="+9%"
            icon={<FiTarget className="w-6 h-6 text-white" />}
            color="bg-indigo-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="Revenue from Add-ons"
            value={revenueMetrics.revenueFromAddons}
            subtitle="PT & extras"
            trend="up"
            trendValue="+22%"
            icon={<FiPlus className="w-6 h-6 text-white" />}
            color="bg-teal-500"
            format="currency"
            currency={currencyCode}
          />
        </div>
      </div>

      {/* Invoice & Payment Insights */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📄 Invoice & Payment Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="Total Invoices Issued"
            value={invoiceMetrics.totalInvoicesIssued}
            subtitle="This period"
            trend="up"
            trendValue="+8%"
            icon={<FiFileText className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Paid Invoices"
            value={invoiceMetrics.paidInvoices}
            subtitle="Successfully paid"
            trend="up"
            trendValue="+6%"
            icon={<FiCheckCircle className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Unpaid / Overdue"
            value={invoiceMetrics.unpaidOverdueInvoices}
            subtitle="Requires attention"
            trend="down"
            trendValue="-12%"
            icon={<FiAlertTriangle className="w-6 h-6 text-white" />}
            color="bg-red-500"
          />
          <MetricCard
            title="Avg. Invoice Value"
            value={invoiceMetrics.avgInvoiceValue}
            subtitle="Per invoice"
            trend="up"
            trendValue="+4%"
            icon={<FiDollarSign className="w-6 h-6 text-white" />}
            color="bg-purple-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="Failed Payments"
            value={invoiceMetrics.failedPayments}
            subtitle="This period"
            trend="down"
            trendValue="-18%"
            icon={<FiX className="w-6 h-6 text-white" />}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📈 Visuals
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Revenue Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `${currencyCode ? `${currencyCode} ` : ""}${value}`,
                    "Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Invoices Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.invoicesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenue by Branch">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.revenueByBranch}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `${currencyCode ? `${currencyCode} ` : ""}${value}`,
                    "Revenue",
                  ]}
                />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Payment Method Split">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.paymentMethodSplit}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="percentage"
                  label={({ method, percentage }) =>
                    `${method}: ${percentage}%`
                  }
                >
                  {chartData.paymentMethodSplit.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Membership Type Revenue Share">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.membershipTypeRevenue}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="percentage"
                label={({ type, percentage }) => `${type}: ${percentage}%`}
              >
                {chartData.membershipTypeRevenue.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Expense & Profitability Metrics */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📉 Expense & Profitability Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Expenses"
            value={expenseMetrics.totalExpenses}
            subtitle="This period"
            trend="down"
            trendValue="-3%"
            icon={<FiShoppingCart className="w-6 h-6 text-white" />}
            color="bg-red-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="Net Profit"
            value={expenseMetrics.netProfit}
            subtitle="Revenue - Expenses"
            trend="up"
            trendValue="+15%"
            icon={<FiTrendingUp className="w-6 h-6 text-white" />}
            color="bg-green-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="Avg. Profit Margin"
            value={expenseMetrics.avgProfitMargin}
            subtitle="Net profit %"
            trend="up"
            trendValue="+2%"
            icon={<FiPercent className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            format="percentage"
          />
        </div>

        <ChartCard title="Top Expense Categories">
          <div className="space-y-3">
            {expenseMetrics.topExpenseCategories.map((category, index) => (
              <div
                key={category.category}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600">
                      {index + 1}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {category.category}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {currencyCode ? `${currencyCode} ` : ""}
                  {category.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* VAT Analytics */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📊 VAT Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="VAT Collected"
            value={vatMetrics.vatCollected}
            subtitle="From invoices"
            trend="up"
            trendValue="+12%"
            icon={<FiPercent className="w-6 h-6 text-white" />}
            color="bg-green-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="VAT Paid"
            value={vatMetrics.vatPaid}
            subtitle="On expenses"
            trend="up"
            trendValue="+8%"
            icon={<FiCreditCard className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="VAT Balance"
            value={vatMetrics.vatBalance}
            subtitle="Collected - Paid"
            trend="up"
            trendValue="+15%"
            icon={<FiDollarSign className="w-6 h-6 text-white" />}
            color="bg-purple-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="Next Filing Deadline"
            value={vatMetrics.nextFilingDeadline}
            subtitle="Due date"
            trend="neutral"
            icon={<FiCalendar className="w-6 h-6 text-white" />}
            color="bg-orange-500"
          />
          <MetricCard
            title="Filed Returns"
            value={vatMetrics.filedReturnsThisPeriod}
            subtitle="This period"
            trend="up"
            trendValue="+1"
            icon={<FiFileText className="w-6 h-6 text-white" />}
            color="bg-teal-500"
          />
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📉 Risk Indicators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Churned Members' Revenue Loss"
            value={riskMetrics.churnedMembersRevenueLoss}
            subtitle="Lost revenue"
            trend="down"
            trendValue="-8%"
            icon={<FiTrendingDown className="w-6 h-6 text-white" />}
            color="bg-red-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="At-Risk Revenue"
            value={riskMetrics.atRiskRevenue}
            subtitle="Expiring soon"
            trend="up"
            trendValue="+5%"
            icon={<FiAlertTriangle className="w-6 h-6 text-white" />}
            color="bg-orange-500"
            format="currency"
            currency={currencyCode}
          />
          <MetricCard
            title="Late Payment Rate"
            value={riskMetrics.latePaymentRate}
            subtitle="% of invoices"
            trend="down"
            trendValue="-2%"
            icon={<FiClock className="w-6 h-6 text-white" />}
            color="bg-yellow-500"
            format="percentage"
          />
          <MetricCard
            title="Unpaid High-Value Invoices"
            value={riskMetrics.unpaidHighValueInvoices}
            subtitle={currencyCode ? `> ${currencyCode} 500` : "> 500"}
            trend="down"
            trendValue="-25%"
            icon={<FiX className="w-6 h-6 text-white" />}
            color="bg-red-500"
          />
        </div>
      </div>
    </div>
  );
}
