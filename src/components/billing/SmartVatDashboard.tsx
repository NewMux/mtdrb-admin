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
  FiEye,
  FiEdit,
  FiSend,
} from "react-icons/fi";
import { VatDashboardData, VatReturn } from "../../types";
import { toast } from "react-hot-toast";
import { SmartButton } from "../ui/DesignSystem";
import { supabase } from "../../supabaseClient";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import { DEFAULT_CURRENCY, DEFAULT_VAT_RATE } from "../../config/runtimeConfig";
import { exportCSV, exportExcel, exportPDF } from "../../utils/exportData";

interface SmartVatDashboardProps {
  tenantId: string;
  refreshKey: number;
}

type VatTab = "overview" | "returns" | "compliance" | "analytics";

interface InvoiceSummary {
  amount?: number | string | null;
  total?: number | string | null;
  vat_total?: number | string | null;
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
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [dashboardData, setDashboardData] = useState<VatDashboardData | null>(
    null,
  );
  const [insights, setInsights] = useState<{
    trends: string[];
    recommendations: string[];
    alerts: string[];
  } | null>(null);
  const [vatReturns, setVatReturns] = useState<VatReturn[]>([]);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<VatTab>("overview");

  const fetchDashboardData = useCallback(async () => {
    if (!tenantId) {
      console.warn("SmartVatDashboard: tenantId is missing");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);

      const { data: settingsData } = await supabase
        .from("gym_settings")
        .select("currency, vat_rate")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      const configuredVatRate = Number(settingsData?.vat_rate ?? DEFAULT_VAT_RATE);
      setCurrency(settingsData?.currency || DEFAULT_CURRENCY);

      // Fetch invoices to calculate VAT from the live invoice schema.
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("amount, status, created_at, metadata, total, vat_total")
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
      const invoiceVat = (invoice: InvoiceSummary) => {
        const storedVat = invoice.vat_total == null ? Number.NaN : Number(invoice.vat_total);
        if (Number.isFinite(storedVat)) return storedVat;
        const amount = Number(invoice.amount || invoice.total || 0);
        return (amount * configuredVatRate) / 100;
      };

      const totalVatCollected = invoiceList
        .filter(inv => inv.status === "paid" || inv.status === "completed")
        .reduce((sum, inv) => sum + invoiceVat(inv), 0);

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

        const monthVat = monthInvoices.reduce(
          (sum, inv) => sum + invoiceVat(inv),
          0,
        );
        
        monthlyBreakdown.push({
          month: month.toISOString().substring(0, 7),
          vatCollected: monthVat,
          vatPaid: expenseList
            .filter(exp => {
              if (exp.status === "cancelled") return false;
              const expenseDate = new Date(exp.date || "");
              return expenseDate >= monthStart && expenseDate <= monthEnd;
            })
            .reduce((sum, exp) => sum + Number(exp.vat_amount || 0), 0),
          netVat: monthVat - expenseList
            .filter(exp => {
              if (exp.status === "cancelled") return false;
              const expenseDate = new Date(exp.date || "");
              return expenseDate >= monthStart && expenseDate <= monthEnd;
            })
            .reduce((sum, exp) => sum + Number(exp.vat_amount || 0), 0),
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
          const vat = invoiceVat(inv);
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
        alerts.push(`VAT return due: ${netVatPayable.toFixed(2)} ${settingsData?.currency || DEFAULT_CURRENCY} payable`);
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

  const handleGenerateVatReturn = async () => {
    if (!tenantId || !dashboardData) return;
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const filingDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 28);

      const { error } = await supabase.from("vat_returns").insert([
        {
          tenant_id: tenantId,
          period: periodStart.toISOString().substring(0, 7),
          period_start: periodStart.toISOString().split("T")[0],
          period_end: periodEnd.toISOString().split("T")[0],
          status: "draft",
          vat_collected: dashboardData.totalVatCollected,
          vat_paid: dashboardData.totalVatPaid,
          net_vat_payable: dashboardData.netVatPayable,
          filing_deadline: filingDeadline.toISOString().split("T")[0],
        },
      ]);

      if (error) throw error;

      toast.success("VAT return generated successfully");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error generating VAT return:", error);
      toast.error(t("billing.vatReturnGenerationFailed"));
    }
  };

  const handleSubmitVatReturn = async (returnId: string) => {
    try {
      const { error } = await supabase
        .from("vat_returns")
        .update({
          status: "submitted",
          filed_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", returnId);

      if (error) throw error;

      toast.success(t("billing.vatReturnSubmitted"));
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error submitting VAT return:", error);
      toast.error(t("billing.vatReturnSubmissionFailed"));
    }
  };

  const handleExportReport = async (format: "pdf" | "excel" | "csv") => {
    try {
      const rows = vatReturns.map((vr) => ({
        Period: vr.period,
        "Period Start": vr.period_start,
        "Period End": vr.period_end,
        Status: vr.status,
        "VAT Collected": vr.vat_collected,
        "VAT Paid": vr.vat_paid,
        "Net VAT Payable": vr.net_vat_payable,
        "Filing Deadline": vr.filing_deadline,
        "Filed Date": vr.filed_date,
      }));
      const filename = `vat-returns-${new Date().toISOString().split("T")[0]}`;

      if (format === "csv") {
        exportCSV(rows, filename);
      } else if (format === "excel") {
        await exportExcel(rows, filename, "VAT Returns");
      } else {
        exportPDF(rows, filename, "VAT Returns");
      }

      toast.success(`${format.toUpperCase()} ${t("billing.reportExported")}`);
    } catch (error) {
      console.error("Error exporting VAT report:", error);
      toast.error(t("billing.reportExportFailed"));
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-center h-64`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-gray-600 dark:text-gray-400`}>{t("billing.loadingVatDashboard")}</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{t("billing.noVatDataAvailable")}</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    const code = /^[A-Z]{3}$/.test(currency) ? currency : DEFAULT_CURRENCY;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${code} ${amount.toFixed(2)}`;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const tabs: { id: VatTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "overview", label: t("billing.overview"), icon: FiBarChart2 },
    { id: "returns", label: t("billing.vatReturns"), icon: FiFileText },
    { id: "compliance", label: t("billing.compliance"), icon: FiShield },
    { id: "analytics", label: t("billing.analytics"), icon: FiTrendingUp },
  ];

  const getComplianceIcon = (score: number) => {
    if (score >= 90) return <FiCheckCircle className="text-green-500 dark:text-green-400" />;
    if (score >= 70) return <FiAlertTriangle className="text-yellow-500 dark:text-yellow-400" />;
    return <FiAlertTriangle className="text-red-500 dark:text-red-400" />;
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header with Smart Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="text-start">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("billing.smartVatDashboard", "لوحة تحكم القيمة المضافة الذكية")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("billing.comprehensiveVatManagement", "إدارة وتصريح القيمة المضافة ومتابعة الامتثال الضريبي")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SmartButton
            size="sm"
            variant="primary"
            icon={<FiFileText size={16} />}
            onClick={handleGenerateVatReturn}
          >
            {t("billing.generateVatReturn", "إنشاء الإقرار الضريبي")}
          </SmartButton>
          <SmartButton
            size="sm"
            variant="ghost"
            icon={<FiDownload size={16} />}
            onClick={() => handleExportReport("pdf")}
          >
            {t("billing.exportPdf", "تصدير PDF")}
          </SmartButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav
          className="flex overflow-x-auto gap-8 -mb-px"
          role="tablist"
          aria-label={t("billing.vatDashboardViews", "عرض لوحة تحكم القيمة المضافة")}
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
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }
              `}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? "rtl" : "ltr"}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("billing.vatCollected")}
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(dashboardData.totalVatCollected)}
                  </p>
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} mt-2`}>
                    {dashboardData.vatGrowthPercentage > 0 ? (
                      <FiTrendingUp className={`text-green-500 dark:text-green-400 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    ) : (
                      <FiTrendingDown className={`text-red-500 dark:text-red-400 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    )}
                    <span
                      className={`text-sm ${dashboardData.vatGrowthPercentage > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {Math.abs(dashboardData.vatGrowthPercentage).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <FiDollarSign className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? "rtl" : "ltr"}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("billing.vatPaid")}</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(dashboardData.totalVatPaid)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <FiDollarSign className="text-red-600 dark:text-red-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? "rtl" : "ltr"}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("billing.netVatPayable")}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(dashboardData.netVatPayable)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <FiTarget className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? "rtl" : "ltr"}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("billing.complianceScore")}
                  </p>
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <p
                      className={`text-2xl font-bold ${getComplianceColor(dashboardData.complianceScore)}`}
                    >
                      {dashboardData.complianceScore}%
                    </p>
                    <span className={isRTL ? 'mr-2' : 'ml-2'}>
                      {getComplianceIcon(dashboardData.complianceScore)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <FiShield className="text-gray-600 dark:text-gray-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Alerts */}
          {(dashboardData?.complianceAlerts || []).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("billing.complianceAlerts")}
              </h3>
              <div className="space-y-3">
                {(dashboardData?.complianceAlerts || []).map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-lg ${
                      alert.type === "error"
                        ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        : alert.type === "warning"
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                          : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {alert.type === "error" ? (
                      <FiAlertTriangle className={`text-red-500 dark:text-red-400 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                    ) : alert.type === "warning" ? (
                      <FiClock className={`text-yellow-500 dark:text-yellow-400 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                    ) : (
                      <FiCheckCircle className={`text-blue-500 dark:text-blue-400 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        alert.type === "error"
                          ? "text-red-800 dark:text-red-300"
                          : alert.type === "warning"
                            ? "text-yellow-800 dark:text-yellow-300"
                            : "text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {alert.message}
                    </span>
                    {alert.action_required && (
                      <span className={`${isRTL ? 'mr-auto' : 'ml-auto'} text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full`}>
                        {t("billing.actionRequired")}
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? "rtl" : "ltr"}>
                <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t("billing.smartInsights")}
                </h3>
                <div className="space-y-3">
                  {(insights?.trends || []).map((trend, index) => (
                    <div key={index} className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <FiTrendingUp className={`text-blue-500 dark:text-blue-400 ${isRTL ? 'ml-3' : 'mr-3'} mt-1`} />
                      <span className={`text-sm text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>{trend}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? "rtl" : "ltr"}>
                <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t("billing.recommendations")}
                </h3>
                <div className="space-y-3">
                  {(insights?.recommendations || []).map((rec, index) => (
                    <div key={index} className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <FiTarget className={`text-green-500 dark:text-green-400 ${isRTL ? 'ml-3' : 'mr-3'} mt-1`} />
                      <span className={`text-sm text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t("billing.recentVatTransactions")}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" dir={isRTL ? "rtl" : "ltr"}>
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                      {t("billing.date")}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                      {t("billing.status")}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                      {t("billing.reference")}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                      {t("billing.vatAmount")}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                      {t("billing.status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(dashboardData?.recentTransactions || [])
                    .slice(0, 5)
                    .map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === "Invoice"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                            }`}
                          >
                            {transaction.type === "Invoice" ? t("billing.invoice") : t("billing.expense")}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                          {transaction.reference_number}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                          {formatCurrency(transaction.vat_amount)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === "Paid"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                            }`}
                          >
                            {transaction.status === "Paid" ? t("billing.paid") : transaction.status}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6`}>
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("billing.vatReturns")}
              </h3>
              <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
                <SmartButton
                  size="sm"
                  variant="primary"
                  icon={<FiFileText size={16} />}
                  onClick={handleGenerateVatReturn}
                >
                  {t("billing.generateNewReturn")}
                </SmartButton>
              </div>
            </div>
            {(vatReturns || []).length === 0 ? (
              <div className="text-center py-8">
                <FiFileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {t("billing.noVatReturns")}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("billing.generateFirstVatReturn")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" dir={isRTL ? "rtl" : "ltr"}>
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                        {t("billing.period")}
                      </th>
                      <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                        {t("billing.country")}
                      </th>
                      <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                        {t("billing.netVat")}
                      </th>
                      <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                        {t("billing.dueDate")}
                      </th>
                      <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                        {t("billing.status")}
                      </th>
                      <th className={`px-6 py-3 ${isRTL ? 'text-left' : 'text-right'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}>
                        {t("billing.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(vatReturns || []).map((vatReturn) => (
                      <tr
                        key={vatReturn.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                          {vatReturn.period_start} -{" "}
                          {vatReturn.period_end}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <FiGlobe className={isRTL ? 'ml-2' : 'mr-2'} />
                            {vatReturn.period}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                          {formatCurrency(vatReturn.net_vat_payable || 0)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {vatReturn.filed_date
                            ? new Date(
                                vatReturn.filed_date,
                              ).toLocaleDateString()
                            : t("billing.nA")}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vatReturn.status === "draft"
                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                                : vatReturn.status === "submitted"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                                  : vatReturn.status === "approved"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                            }`}
                          >
                            {vatReturn.status === "draft" ? t("billing.draft") :
                             vatReturn.status === "submitted" ? t("billing.submitted") :
                             vatReturn.status === "approved" ? t("billing.accepted") :
                             vatReturn.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'} text-sm font-medium`}>
                          <div className={`flex items-center ${isRTL ? 'justify-start flex-row-reverse space-x-reverse' : 'justify-end'} gap-2`}>
                            <SmartButton
                              size="sm"
                              variant="ghost"
                              icon={<FiEye size={16} />}
                              title={t("billing.view")}
                            />
                            <SmartButton
                              size="sm"
                              variant="ghost"
                              icon={<FiEdit size={16} />}
                              title={t("billing.edit")}
                            />
                            {vatReturn.status === "draft" && (
                              <SmartButton
                                size="sm"
                                variant="primary"
                                icon={<FiSend size={16} />}
                                onClick={() =>
                                  handleSubmitVatReturn(vatReturn.id)
                                }
                                title={t("common.submit") || "Submit"}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t("billing.complianceOverview")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getComplianceColor(dashboardData?.complianceScore ?? 0)}`}
                >
                  {dashboardData?.complianceScore ?? 0}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("billing.complianceScore")}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {dashboardData?.overdueReturns ?? 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("billing.overdueReturns")}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {dashboardData?.upcomingDeadlines ?? 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("billing.upcomingDeadlines")}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t("billing.complianceChecklist")}
            </h3>
            <div className="space-y-4">
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <FiCalendar className={`${isRTL ? 'ml-3' : 'mr-3'} text-gray-400 dark:text-gray-500`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("billing.vatReturnsFiledOnTime")}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (dashboardData?.overdueReturns ?? 0) === 0
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                  }`}
                >
                  {(dashboardData?.overdueReturns ?? 0) === 0
                    ? t("billing.compliant")
                    : `${dashboardData?.overdueReturns ?? 0} ${t("billing.overdue")}`}
                </span>
              </div>

              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <FiDollarSign className={`${isRTL ? 'ml-3' : 'mr-3'} text-gray-400 dark:text-gray-500`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("billing.vatPaymentsMadeOnTime")}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (dashboardData?.overdueReturns ?? 0) === 0
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                  }`}
                >
                  {(dashboardData?.overdueReturns ?? 0) === 0
                    ? t("billing.compliant")
                    : `${dashboardData?.overdueReturns ?? 0} ${t("billing.overdue")}`}
                </span>
              </div>

              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <FiClock className={`${isRTL ? 'ml-3' : 'mr-3'} text-gray-400 dark:text-gray-500`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("billing.upcomingDeadlines")}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (dashboardData?.upcomingDeadlines ?? 0) === 0
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                  }`}
                >
                  {(dashboardData?.upcomingDeadlines ?? 0) === 0
                    ? t("billing.noDeadlines")
                    : `${dashboardData?.upcomingDeadlines ?? 0} ${t("billing.dueSoon")}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === "analytics" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t("billing.vatAnalytics")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div dir={isRTL ? "rtl" : "ltr"}>
                <h4 className={`text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t("billing.vatByCountry")}
                </h4>
                <div className="space-y-3">
                  {(dashboardData?.vatByCountry || []).map((country, index) => (
                    <div
                      key={index}
                      className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}
                    >
                      <span className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                        {country.country_name}
                      </span>
                      <span className={`text-sm font-medium text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                        {formatCurrency(country.net_vat)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div dir={isRTL ? "rtl" : "ltr"}>
                <h4 className={`text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t("billing.periodComparison")}
                </h4>
                <div className="space-y-3">
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                    <span className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("billing.currentPeriod")}
                    </span>
                    <span className={`text-sm font-medium text-green-600 dark:text-green-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {formatCurrency(dashboardData?.currentPeriodVat ?? 0)}
                    </span>
                  </div>
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                    <span className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("billing.previousPeriod")}
                    </span>
                    <span className={`text-sm font-medium text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {formatCurrency(dashboardData?.previousPeriodVat ?? 0)}
                    </span>
                  </div>
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                    <span className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>{t("analytics.trends")}</span>
                    <span
                      className={`text-sm font-medium ${
                        (dashboardData?.vatGrowthPercentage ?? 0) > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      } ${isRTL ? 'text-right' : 'text-left'}`}
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
