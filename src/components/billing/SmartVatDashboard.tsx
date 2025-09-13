import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { mockVatDashboardData } from "../../api/mockBillingData";
import { VatDashboardData, VatReturn, VatReportFilters } from "../../types";
import { toast } from "react-hot-toast";
import { SmartButton } from "../ui/DesignSystem";

interface SmartVatDashboardProps {
  tenantId: string;
  refreshKey: number;
}

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
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "returns" | "compliance" | "analytics"
  >("overview");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Use mock data instead of backend calls
      setDashboardData(mockVatDashboardData);

      // Mock insights data
      setInsights({
        trends: [
          "VAT collection increased by 12% this month",
          "Compliance rate improved to 100%",
          "New filing deadline approaching",
        ],
        recommendations: [
          "Consider implementing automated VAT filing",
          "Review expense categorization for better VAT recovery",
          "Set up reminders for upcoming filing deadlines",
        ],
        alerts: [
          "VAT return due in 5 days",
          "New VAT rate changes effective next month",
        ],
      });

      // Mock VAT returns data
      setVatReturns([
        {
          id: "return-001",
          period: "2024-06",
          status: "draft",
          vat_collected: 6250,
          vat_paid: 3125,
          net_vat_payable: 3125,
          filing_deadline: "2024-07-15T00:00:00Z",
          created_at: "2024-06-20T10:00:00Z",
        },
      ]);
    } catch (error) {
      console.error("Error loading VAT dashboard data:", error);
      toast.error("Failed to load VAT dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  const handleRunComplianceCheck = async () => {
    try {
      setComplianceLoading(true);
      // Mock compliance check
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Compliance check completed");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error running compliance check:", error);
      toast.error("Failed to run compliance check");
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleGenerateVatReturn = async () => {
    try {
      // Mock VAT return generation
      toast.success("VAT return generated successfully");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error generating VAT return:", error);
      toast.error("Failed to generate VAT return");
    }
  };

  const handleSubmitVatReturn = async (returnId: string) => {
    try {
      // Mock VAT return submission
      toast.success("VAT return submitted successfully");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error submitting VAT return:", error);
      toast.error("Failed to submit VAT return");
    }
  };

  const handleExportReport = async (format: "pdf" | "excel" | "csv") => {
    try {
      // Mock report export
      toast.success(`${format.toUpperCase()} report exported successfully`);
      console.log("Mock download URL for", format, "format");
    } catch (error) {
      console.error("Error exporting report:", error);
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
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav
          className="flex overflow-x-auto gap-8 -mb-px"
          role="tablist"
          aria-label="VAT Dashboard Views"
        >
          {[
            { id: "overview", label: "Overview", icon: FiBarChart2 },
            { id: "returns", label: "VAT Returns", icon: FiFileText },
            { id: "compliance", label: "Compliance", icon: FiShield },
            { id: "analytics", label: "Analytics", icon: FiTrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selectedTab === tab.id}
              tabIndex={selectedTab === tab.id ? 0 : -1}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 whitespace-nowrap
                ${
                  selectedTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent VAT Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      VAT Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === "Invoice"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {transaction.reference_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(transaction.vat_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === "Paid"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                <FiFileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No VAT returns
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Generate your first VAT return to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Net VAT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(vatReturns || []).map((vatReturn) => (
                      <tr
                        key={vatReturn.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {vatReturn.return_period_start} -{" "}
                          {vatReturn.return_period_end}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <FiGlobe className="mr-2" />
                            {vatReturn.country_code || "BH"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(vatReturn.net_vat_payable || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                                : vatReturn.status === "submitted"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                                  : vatReturn.status === "accepted"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Compliance Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getComplianceColor(dashboardData?.complianceScore ?? 0)}`}
                >
                  {dashboardData?.complianceScore ?? 0}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compliance Score
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {dashboardData?.overdueReturns ?? 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Overdue Returns
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {dashboardData?.upcomingDeadlines ?? 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upcoming Deadlines
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Compliance Checklist
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <FiCalendar className="mr-3 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    VAT Returns Filed on Time
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (dashboardData?.overdueReturns ?? 0) === 0
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                  }`}
                >
                  {(dashboardData?.overdueReturns ?? 0) === 0
                    ? "Compliant"
                    : `${dashboardData?.overdueReturns ?? 0} Overdue`}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <FiDollarSign className="mr-3 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    VAT Payments Made on Time
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (dashboardData?.overduePayments ?? 0) === 0
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                  }`}
                >
                  {(dashboardData?.overduePayments ?? 0) === 0
                    ? "Compliant"
                    : `${dashboardData?.overduePayments ?? 0} Overdue`}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
