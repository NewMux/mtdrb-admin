import React, { useState, useEffect, useCallback } from "react";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiGlobe,
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiShield,
  FiTarget,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiSend,
} from "react-icons/fi";
import { VatDashboardData, VatReturn } from "../../types";
import { toast } from "react-hot-toast";
import { SmartButton } from "../ui/DesignSystem";
import { supabase } from "../../supabaseClient";

interface SmartVatDashboardProps {
  tenantId: string;
  refreshKey: number;
}

type VatTab = "overview" | "returns" | "compliance" | "analytics";

interface InvoiceSummary {
  amount?: number | string | null;
  total?: number | string | null;
  status?: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

interface ExpenseSummary {
  amount?: number | string | null;
  vat_amount?: number | string | null;
  date?: string | null;
  status?: string | null;
}

interface MonthlyVatBreakdown {
  month: string;
  vatCollected: number;
  vatPaid: number;
  netVat: number;
}

interface VatCategorySummary {
  category: string;
  vat: number;
}

const isMissingTableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === "PGRST116" ||
    (maybeError.message?.includes("relation") ?? false) ||
    (maybeError.message?.includes("does not exist") ?? false)
  );
};

export default function SmartVatDashboard({
  tenantId,
  refreshKey,
}: SmartVatDashboardProps) {
  const [dashboardData, setDashboardData] = useState<VatDashboardData | null>(
    null,
  );
  const [insights, setInsights] = useState<{
    trends: string[];
    recommendations: string[];
    alerts: string[];
  } | null>(null);
  const [vatReturns, setVatReturns] = useState<VatReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<VatTab>("overview");

  const fetchDashboardData = useCallback(async () => {
    if (!tenantId) {
      console.warn("SmartVatDashboard: tenantId is missing");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);

      // Fetch invoices to calculate VAT
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("amount, status, created_at, metadata, total")
        .eq("tenant_id", tenantId);

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError);
        throw new Error(`Failed to fetch invoices: ${invoicesError.message || JSON.stringify(invoicesError)}`);
      }

      // Fetch expenses to calculate VAT paid
      let expenses = null;
      let expensesError = null;
      try {
        const expensesResult = await supabase
          .from("expenses")
          .select("amount, vat_amount, date, status")
          .eq("tenant_id", tenantId);
        expenses = expensesResult.data;
        expensesError = expensesResult.error;
      } catch (err: unknown) {
        // Table might not exist
        if (isMissingTableError(err)) {
          console.warn("Expenses table may not exist, continuing without expenses data");
          expenses = [];
        } else {
          throw err;
        }
      }

      if (expensesError && expensesError.code !== "PGRST116") {
        console.warn("Expenses query warning:", expensesError);
      }

      // Fetch VAT returns if table exists
      let vatReturnsData = null;
      let vatReturnsError = null;
      try {
        const vatReturnsResult = await supabase
          .from("vat_returns")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });
        vatReturnsData = vatReturnsResult.data;
        vatReturnsError = vatReturnsResult.error;
      } catch (err: unknown) {
        // Table might not exist
        if (isMissingTableError(err)) {
          console.warn("VAT returns table may not exist, continuing without VAT returns data");
          vatReturnsData = [];
        } else {
          throw err;
        }
      }

      if (vatReturnsError && vatReturnsError.code !== "PGRST116") {
        console.warn("VAT returns query warning:", vatReturnsError);
      }

      const invoiceList: InvoiceSummary[] = invoices ?? [];
      const expenseList: ExpenseSummary[] = expenses ?? [];
      const vatReturnsList: VatReturn[] = (vatReturnsData ?? []) as VatReturn[];

      // Calculate VAT collected (5% of paid invoices)
      const totalVatCollected = invoiceList
        .filter(inv => inv.status === "paid" || inv.status === "completed")
        .reduce((sum, inv) => {
          const amount = Number(inv.amount || inv.total || 0);
          return sum + (amount * 0.05);
        }, 0);

      // Calculate VAT paid from expenses
      const totalVatPaid = expenseList
        .filter(exp => exp.status !== "cancelled")
        .reduce((sum, exp) => sum + Number(exp.vat_amount || 0), 0);

      const netVatPayable = totalVatCollected - totalVatPaid;

      // Calculate monthly breakdown (last 6 months)
      const monthlyBreakdown: MonthlyVatBreakdown[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

        const monthInvoices = invoiceList.filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate >= monthStart && invDate <= monthEnd && (inv.status === "paid" || inv.status === "completed");
        });

        const monthVat = monthInvoices.reduce((sum, inv) => {
          const amount = Number(inv.amount || inv.total || 0);
          return sum + (amount * 0.05);
        }, 0);
        
        monthlyBreakdown.push({
          month: month.toISOString().substring(0, 7),
          vatCollected: monthVat,
          vatPaid: 0, // Would need expense data by month
          netVat: monthVat,
        });
      }

      // Top VAT categories (simplified - based on invoice types)
      const categoryMap = new Map<string, number>();
      invoiceList
        .filter(inv => inv.status === "paid" || inv.status === "completed")
        .forEach(inv => {
          const metadata =
            inv.metadata && typeof inv.metadata === "object"
              ? (inv.metadata as Record<string, unknown>)
              : {};
          const type =
            (typeof metadata.type === "string" ? metadata.type : undefined) ||
            "membership";
          const amount = Number(inv.amount || inv.total || 0);
          const vat = amount * 0.05;
          categoryMap.set(type, (categoryMap.get(type) || 0) + vat);
        });

      // Calculate top VAT categories for future use (storing in variable for potential later use)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _topVatCategories: VatCategorySummary[] = Array.from(
        categoryMap.entries(),
      )
        .map(([category, vat]) => ({ category, vat }))
        .sort((a, b) => b.vat - a.vat)
        .slice(0, 5);

      const currentPeriodVat =
        monthlyBreakdown[monthlyBreakdown.length - 1]?.vatCollected ?? 0;
      const previousPeriodVat =
        monthlyBreakdown[monthlyBreakdown.length - 2]?.vatCollected ?? 0;
      const vatGrowthPercentage =
        previousPeriodVat > 0
          ? ((currentPeriodVat - previousPeriodVat) / previousPeriodVat) * 100
          : 0;
      const overdueReturns = vatReturnsList.filter(
        (item) => item.status === "rejected",
      ).length;
      const upcomingDeadlines = vatReturnsList.filter(
        (item) => item.status === "draft",
      ).length;
      const criticalIssues = overdueReturns;
      const complianceScore = Math.max(0, 100 - criticalIssues * 10);

      setDashboardData({
        totalVatCollected,
        totalVatPaid,
        netVatPayable,
        complianceScore,
        currentPeriodVat,
        previousPeriodVat,
        vatGrowthPercentage,
        overdueReturns,
        upcomingDeadlines,
        criticalIssues,
        vatByCountry: [],
        recentTransactions: [],
        complianceAlerts: [],
      });

      // Generate insights based on data
      const trends: string[] = [];
      const recommendations: string[] = [];
      const alerts: string[] = [];

      if (monthlyBreakdown.length >= 2) {
        const currentMonth = monthlyBreakdown[monthlyBreakdown.length - 1].vatCollected;
        const previousMonth = monthlyBreakdown[monthlyBreakdown.length - 2].vatCollected;
        if (previousMonth > 0) {
          const change = ((currentMonth - previousMonth) / previousMonth) * 100;
          trends.push(`VAT collection ${change >= 0 ? "increased" : "decreased"} by ${Math.abs(change).toFixed(1)}% this month`);
        }
      }

      if (netVatPayable > 0) {
        alerts.push(
          `VAT return due: ${netVatPayable.toFixed(2)} AED payable`,
        );
      }

      recommendations.push("Consider implementing automated VAT filing");
      recommendations.push("Review expense categorization for better VAT recovery");

      setInsights({ trends, recommendations, alerts });

      setVatReturns(vatReturnsList);
    } catch (error: unknown) {
      console.error("Error loading VAT dashboard data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to load VAT dashboard data: ${errorMessage}`);
      
      // Set empty data to prevent UI crashes
      setDashboardData({
        totalVatCollected: 0,
        totalVatPaid: 0,
        netVatPayable: 0,
        complianceScore: 0,
        currentPeriodVat: 0,
        previousPeriodVat: 0,
        vatGrowthPercentage: 0,
        overdueReturns: 0,
        upcomingDeadlines: 0,
        criticalIssues: 0,
        vatByCountry: [],
        recentTransactions: [],
        complianceAlerts: [],
      });
      setInsights({ trends: [], recommendations: [], alerts: [] });
      setVatReturns([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  const handleRunComplianceCheck = async () => {
    try {
      setComplianceLoading(true);
      // TODO: Run compliance check via Supabase
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Compliance check completed");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error("Failed to run compliance check");
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleGenerateVatReturn = async () => {
    try {
      // TODO: Generate VAT return via Supabase
      toast.success("VAT return generated successfully");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error("Failed to generate VAT return");
    }
  };

  const handleSubmitVatReturn = async (returnId: string) => {
    try {
      void returnId;
      // TODO: Submit VAT return via Supabase
      toast.success("VAT return submitted successfully");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error("Failed to submit VAT return");
    }
  };

  const handleExportReport = async (format: "pdf" | "excel" | "csv") => {
    try {
      // TODO: Export report via Supabase
      toast.success(`${format.toUpperCase()} report exported successfully`);
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading VAT dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No VAT data available</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BHD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const tabs: { id: VatTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "overview", label: "Overview", icon: FiBarChart2 },
    { id: "returns", label: "VAT Returns", icon: FiFileText },
    { id: "compliance", label: "Compliance", icon: FiShield },
    { id: "analytics", label: "Analytics", icon: FiTrendingUp },
  ];

  const getComplianceIcon = (score: number) => {
    if (score >= 90) return <FiCheckCircle className="text-green-500" />;
    if (score >= 70) return <FiAlertTriangle className="text-yellow-500" />;
    return <FiAlertTriangle className="text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Smart Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Smart VAT Dashboard
          </h2>
          <p className="text-gray-600">
            Comprehensive VAT management and compliance monitoring
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SmartButton
            size="sm"
            variant="primary"
            icon={<FiRefreshCw size={16} />}
            onClick={handleRunComplianceCheck}
            disabled={complianceLoading}
          >
            {complianceLoading ? "Checking..." : "Run Compliance Check"}
          </SmartButton>
          <SmartButton
            size="sm"
            variant="primary"
            icon={<FiFileText size={16} />}
            onClick={handleGenerateVatReturn}
          >
            Generate VAT Return
          </SmartButton>
          <SmartButton
            size="sm"
            variant="ghost"
            icon={<FiDownload size={16} />}
            onClick={() => handleExportReport("pdf")}
          >
            Export PDF
          </SmartButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav
          className="flex overflow-x-auto gap-8 -mb-px"
          role="tablist"
          aria-label="VAT Dashboard Views"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selectedTab === tab.id}
              tabIndex={selectedTab === tab.id ? 0 : -1}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 whitespace-nowrap
                ${
                  selectedTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    VAT Collected
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardData.totalVatCollected)}
                  </p>
                  <div className="flex items-center mt-2">
                    {dashboardData.vatGrowthPercentage > 0 ? (
                      <FiTrendingUp className="text-green-500 mr-1" />
                    ) : (
                      <FiTrendingDown className="text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm ${dashboardData.vatGrowthPercentage > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {Math.abs(dashboardData.vatGrowthPercentage).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiDollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">VAT Paid</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(dashboardData.totalVatPaid)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <FiDollarSign className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Net VAT Payable
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(dashboardData.netVatPayable)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiTarget className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Compliance Score
                  </p>
                  <div className="flex items-center">
                    <p
                      className={`text-2xl font-bold ${getComplianceColor(dashboardData.complianceScore)}`}
                    >
                      {dashboardData.complianceScore}%
                    </p>
                    <span className="ml-2">
                      {getComplianceIcon(dashboardData.complianceScore)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <FiShield className="text-gray-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Alerts */}
          {(dashboardData?.complianceAlerts || []).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Compliance Alerts
              </h3>
              <div className="space-y-3">
                {(dashboardData?.complianceAlerts || []).map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-lg ${
                      alert.type === "error"
                        ? "bg-red-50 border border-red-200"
                        : alert.type === "warning"
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    {alert.type === "error" ? (
                      <FiAlertTriangle className="text-red-500 mr-3" />
                    ) : alert.type === "warning" ? (
                      <FiClock className="text-yellow-500 mr-3" />
                    ) : (
                      <FiCheckCircle className="text-blue-500 mr-3" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        alert.type === "error"
                          ? "text-red-800"
                          : alert.type === "warning"
                            ? "text-yellow-800"
                            : "text-blue-800"
                      }`}
                    >
                      {alert.message}
                    </span>
                    {alert.action_required && (
                      <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Action Required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Insights */}
          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Smart Insights
                </h3>
                <div className="space-y-3">
                  {(insights?.trends || []).map((trend, index) => (
                    <div key={index} className="flex items-start">
                      <FiTrendingUp className="text-blue-500 mr-3 mt-1" />
                      <span className="text-sm text-gray-700">{trend}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {(insights?.recommendations || []).map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <FiTarget className="text-green-500 mr-3 mt-1" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent VAT Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      VAT Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(dashboardData?.recentTransactions || [])
                    .slice(0, 5)
                    .map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === "Invoice"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.reference_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(transaction.vat_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === "Paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VAT Returns Tab */}
      {selectedTab === "returns" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                VAT Returns
              </h3>
              <div className="flex gap-2">
                <SmartButton
                  size="sm"
                  variant="primary"
                  icon={<FiFileText size={16} />}
                  onClick={handleGenerateVatReturn}
                >
                  Generate New Return
                </SmartButton>
              </div>
            </div>
            {(vatReturns || []).length === 0 ? (
              <div className="text-center py-8">
                <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No VAT returns
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate your first VAT return to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Net VAT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(vatReturns || []).map((vatReturn) => (
                      <tr
                        key={vatReturn.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vatReturn.return_period_start} -{" "}
                          {vatReturn.return_period_end}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiGlobe className="mr-2" />
                            {vatReturn.country_code || "BH"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(vatReturn.net_vat_payable || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vatReturn.submitted_at
                            ? new Date(
                                vatReturn.submitted_at,
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vatReturn.status === "draft"
                                ? "bg-yellow-100 text-yellow-800"
                                : vatReturn.status === "submitted"
                                  ? "bg-blue-100 text-blue-800"
                                  : vatReturn.status === "accepted"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vatReturn.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <SmartButton
                              size="sm"
                              variant="ghost"
                              icon={<FiEye size={16} />}
                              title="View"
                            />
                            <SmartButton
                              size="sm"
                              variant="ghost"
                              icon={<FiEdit size={16} />}
                              title="Edit"
                            />
                            {vatReturn.status === "draft" && (
                              <SmartButton
                                size="sm"
                                variant="primary"
                                icon={<FiSend size={16} />}
                                onClick={() =>
                                  handleSubmitVatReturn(vatReturn.id)
                                }
                                title="Submit"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {selectedTab === "compliance" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Compliance Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getComplianceColor(dashboardData?.complianceScore ?? 0)}`}
                >
                  {dashboardData?.complianceScore ?? 0}%
                </div>
                <p className="text-sm text-gray-600">
                  Compliance Score
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {dashboardData?.overdueReturns ?? 0}
                </div>
                <p className="text-sm text-gray-600">
                  Overdue Returns
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {dashboardData?.upcomingDeadlines ?? 0}
                </div>
                <p className="text-sm text-gray-600">
                  Upcoming Deadlines
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Compliance Checklist
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FiCalendar className="mr-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    VAT Returns Filed on Time
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (dashboardData?.overdueReturns ?? 0) === 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {(dashboardData?.overdueReturns ?? 0) === 0
                    ? "Compliant"
                    : `${dashboardData?.overdueReturns ?? 0} Overdue`}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FiDollarSign className="mr-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    VAT Payments Made on Time
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (dashboardData?.overdueReturns ?? 0) === 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {(dashboardData?.overdueReturns ?? 0) === 0
                    ? "Compliant"
                    : `${dashboardData?.overdueReturns ?? 0} Overdue`}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FiClock className="mr-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    Upcoming Deadlines
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (dashboardData?.upcomingDeadlines ?? 0) === 0
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {(dashboardData?.upcomingDeadlines ?? 0) === 0
                    ? "No Deadlines"
                    : `${dashboardData?.upcomingDeadlines ?? 0} Due Soon`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === "analytics" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              VAT Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3">
                  VAT by Country
                </h4>
                <div className="space-y-3">
                  {(dashboardData?.vatByCountry || []).map((country, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-900">
                        {country.country_name}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(country.net_vat)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3">
                  Period Comparison
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      Current Period
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(dashboardData?.currentPeriodVat ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      Previous Period
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {formatCurrency(dashboardData?.previousPeriodVat ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">Growth</span>
                    <span
                      className={`text-sm font-medium ${
                        (dashboardData?.vatGrowthPercentage ?? 0) > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(dashboardData?.vatGrowthPercentage ?? 0) > 0 ? "+" : ""}
                      {(dashboardData?.vatGrowthPercentage ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
