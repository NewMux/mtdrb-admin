import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
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
  AreaChart,
  Area,
} from "recharts";
import { AnimatePresence } from "framer-motion";

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

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

// Removed mock data - using real data from Supabase
// TODO: Fetch from Supabase
const emptyRevenueMetrics: RevenueMetrics = {
  totalRevenue: 124750,
  mrr: 45600,
  avgRevenuePerMember: 89.5,
  newRevenue: 18750,
  projectedRevenue: 49800,
  revenueFromAddons: 15600,
};

const mockInvoiceMetrics: InvoiceMetrics = {
  totalInvoicesIssued: 1247,
  paidInvoices: 1189,
  unpaidOverdueInvoices: 58,
  avgInvoiceValue: 850,
  failedPayments: 23,
};

// Removed - using empty defaults above
const _emptyExpenseMetrics: ExpenseMetrics = {
  totalExpenses: 15230,
  netProfit: 109520,
  topExpenseCategories: [
    { category: "Staff Salaries", amount: 8500 },
    { category: "Rent & Utilities", amount: 4200 },
    { category: "Equipment", amount: 1800 },
    { category: "Marketing", amount: 730 },
  ],
  avgProfitMargin: 87.8,
};

// Removed - using empty defaults above
const _emptyVatMetrics: VatMetrics = {
  vatCollected: 18712,
  vatPaid: 4560,
  vatBalance: 14152,
  nextFilingDeadline: "2024-01-31",
  filedReturnsThisPeriod: 4,
};

// Removed - using empty defaults above
const _emptyRiskMetrics: RiskMetrics = {
  churnedMembersRevenueLoss: 3450,
  atRiskRevenue: 8900,
  latePaymentRate: 4.7,
  unpaidHighValueInvoices: 3,
};

// Removed - using empty defaults above
const _emptyChartData: ChartData = {
  revenueTrend: [
    { date: "2024-01", revenue: 115000 },
    { date: "2024-02", revenue: 118500 },
    { date: "2024-03", revenue: 122000 },
    { date: "2024-04", revenue: 124750 },
  ],
  invoicesOverTime: [
    { date: "2024-01", count: 1150 },
    { date: "2024-02", count: 1180 },
    { date: "2024-03", count: 1210 },
    { date: "2024-04", count: 1247 },
  ],
  revenueByBranch: [
    { branch: "Main Branch", revenue: 75000 },
    { branch: "North Branch", revenue: 35000 },
    { branch: "South Branch", revenue: 14750 },
  ],
  paymentMethodSplit: [
    { method: "Card", percentage: 65 },
    { method: "Cash", percentage: 20 },
    { method: "Online", percentage: 15 },
  ],
  membershipTypeRevenue: [
    { type: "Monthly", percentage: 50 },
    { type: "Yearly", percentage: 35 },
    { type: "Class Pack", percentage: 15 },
  ],
};

const FilterBar: React.FC<{
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}> = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FiFilter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Financial Analytics Filters
          </span>
        </button>

        {isExpanded && (
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <FiRefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  value={filters.branches[0] || ""}
                  onChange={(e) => updateFilter("branches", [e.target.value])}
                >
                  <option value="">All Branches</option>
                  <option value="main">Main Branch</option>
                  <option value="north">North Branch</option>
                  <option value="south">South Branch</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Membership
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  value={filters.membershipType}
                  onChange={(e) =>
                    updateFilter("membershipType", e.target.value)
                  }
                >
                  <option value="">All Types</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="class-pack">Class Pack</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    updateFilter("paymentMethod", e.target.value)
                  }
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {/* Invoice Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invoice Status
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  value={filters.invoiceStatus}
                  onChange={(e) =>
                    updateFilter("invoiceStatus", e.target.value)
                  }
                >
                  <option value="">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* VAT Filing Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  VAT Status
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  value={filters.vatFilingStatus}
                  onChange={(e) =>
                    updateFilter("vatFilingStatus", e.target.value)
                  }
                >
                  <option value="">All Status</option>
                  <option value="filed">Filed</option>
                  <option value="pending">Pending</option>
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
}> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color,
  format = "number",
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
      return `BD ${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800"
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
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {title}
        </h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
    className={`bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 ${className}`}
  >
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {title}
    </h3>
    {children}
  </div>
);

export default function FinancialInsightsDashboard({
  refreshKey,
}: FinancialInsightsDashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    branches: [],
    dateRange: "this-month",
    membershipType: "",
    paymentMethod: "",
    invoiceStatus: "",
    vatFilingStatus: "",
  });

  const [revenueMetrics, setRevenueMetrics] =
    useState<RevenueMetrics>(mockRevenueMetrics);
  const [invoiceMetrics, setInvoiceMetrics] =
    useState<InvoiceMetrics>(mockInvoiceMetrics);
  const [expenseMetrics, setExpenseMetrics] =
    useState<ExpenseMetrics>(mockExpenseMetrics);
  const [vatMetrics, setVatMetrics] = useState<VatMetrics>(mockVatMetrics);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>(mockRiskMetrics);
  const [chartData, setChartData] = useState<ChartData>(mockChartData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBillingAnalyticsData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    };

    fetchBillingAnalyticsData();
  }, [refreshKey, filters]);

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
      <FilterBar filters={filters} onFilterChange={setFilters} />

      {/* Revenue Overview */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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
          />
        </div>
      </div>

      {/* Invoice & Payment Insights */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📈 Visuals
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Revenue Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`BD ${value}`, "Revenue"]} />
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
                <Tooltip formatter={(value) => [`BD ${value}`, "Revenue"]} />
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {category.category}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  BD {category.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* VAT Analytics */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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
            subtitle="> BD 500"
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
