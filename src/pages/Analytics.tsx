import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  FiTrendingUp,
  FiBarChart2,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiSettings,
  FiDownload,
  FiEye,
  FiZap,
  FiFileText,
  FiShare,
  FiClock,
  FiPrinter,
  FiCpu,
  FiToggleRight,
  FiMapPin,
  FiFilter,
  FiTarget,
  FiActivity,
  FiStar,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { usePageThemeContext } from "../contexts/PageThemeContext";

// Analytics Components
import MemberAnalytics from "../components/analytics/MemberAnalytics";
import RevenueOverview from "../components/analytics/RevenueOverview";
import SmartKPIHeader from "../components/analytics/SmartKPIHeader";
import AIInsights from "../components/analytics/AIInsights";

// Report Components
import SmartReportsDashboard from "../components/reports/SmartReportsDashboard";
import SmartReportAnalytics from "../components/reports/SmartReportAnalytics";
import ReportGenerator from "../components/reports/ReportGenerator";
import ScheduledReports from "../components/reports/ScheduledReports";
import SmartInsightCards from "../components/reports/SmartInsightCards";
import KPIGroup from "../components/reports/KPIGroup";
import ReportTemplates from "../components/reports/ReportTemplates";
import FilterBar from "../components/reports/FilterBar";

// Mock API
import {
  getSmartInsights,
  getWeeklySummary,
  getChartMetrics,
  getKPIStats,
  getReportTemplates,
  getBranches,
  getMetricTypes,
  SmartInsight,
  ReportTemplate,
} from "../api/mockReports";

// Import all modal components
import {
  SmartAnalyticsModal,
  ExportReportModal,
  GenerateReportModal,
  ScheduleReportModal,
  DownloadReportModal,
  ShareReportModal,
  GenerateVATReportModal,
  ViewAIInsightsModal,
  CreateCustomReportModal,
  PrintReportModal,
} from "../components/analytics/modals";
import ViewDetailsModal from "../components/analytics/ViewDetailsModal";

export default function Analytics() {
  const { theme } = usePageThemeContext();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<
    | "overview"
    | "members"
    | "revenue"
    | "classes"
    | "insights"
    | "reports"
    | "generator"
    | "scheduled"
  >("overview");
  const [weeklySummary, setWeeklySummary] = useState<string>("");
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [filters, setFilters] = useState({
    dateRange: "last-30-days",
    branch: "all",
    metricType: "all",
  });
  const [modalState, setModalState] = useState({
    settings: false,
    export: false,
    generateReport: false,
    scheduleReport: false,
    downloadReport: false,
    shareReport: false,
    vatReport: false,
    aiInsights: false,
    customReport: false,
    printReport: false,
    askAI: false,
    viewDetails: false,
  });
  const [viewDetailsData, setViewDetailsData] = useState({
    section: "",
    data: null,
  });
  const navigate = useNavigate();

  const isPro = user?.user_metadata?.subscription === "pro";

  const analyticsStats = [
    {
      name: "Total Revenue",
      value: "$124,750",
      change: "+12% from last month",
      icon: FiDollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      name: "Active Members",
      value: "1,247",
      change: "+8% from last month",
      icon: FiUsers,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Class Attendance",
      value: "94%",
      change: "+2% from last month",
      icon: FiCalendar,
      color: "from-purple-500 to-purple-600",
    },
    {
      name: "Member Satisfaction",
      value: "4.8/5",
      change: "+0.2 from last month",
      icon: FiStar,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const tabs = [
    { id: "overview", name: "Overview", icon: FiBarChart2 },
    { id: "members", name: "Members", icon: FiUsers },
    { id: "revenue", name: "Revenue", icon: FiDollarSign },
    { id: "classes", name: "Classes", icon: FiCalendar },
    { id: "insights", name: "Insights", icon: FiTarget },
    { id: "reports", name: "Reports", icon: FiFileText },
  ];

  const dateFilters = [
    { id: "last-7-days", name: "Last 7 Days", count: 0 },
    { id: "last-30-days", name: "Last 30 Days", count: 0 },
    { id: "last-90-days", name: "Last 90 Days", count: 0 },
    { id: "this-year", name: "This Year", count: 0 },
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login");
      } else if (!data.user.user_metadata || !data.user.user_metadata.paid) {
        navigate("/subscribe");
      } else {
        setUser(data.user);
        fetchInitialData();
      }
      setLoading(false);
    });
  }, [navigate]);

  // Handle URL parameters for tab selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (
      tabParam &&
      [
        "overview",
        "members",
        "revenue",
        "classes",
        "insights",
        "reports",
        "generator",
        "scheduled",
      ].includes(tabParam)
    ) {
      setActiveView(tabParam as any);
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      const [summaryData, insightsData] = await Promise.all([
        getWeeklySummary(),
        getSmartInsights(),
      ]);
      setWeeklySummary(summaryData);
      setInsights(insightsData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load some data");
    }
  };

  const handleInsightAction = (insight: SmartInsight) => {
    switch (insight.action) {
      case "Create Task":
        toast.success("Opening task creation...");
        break;
      case "Create Campaign":
        toast.success("Opening campaign creation...");
        break;
      case "Schedule Class":
        toast.success("Opening class scheduling...");
        break;
      case "Create Package":
        toast.success("Opening package creation...");
        break;
      default:
        toast.info(`Action: ${insight.action}`);
    }
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setActiveView("generator");
    toast.success(`Selected ${template.name} template`);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    toast.success("Filters updated");
  };

  const toggleAiInsights = () => {
    setAiInsightsEnabled(!aiInsightsEnabled);
    localStorage.setItem(
      "ai-insights-enabled",
      (!aiInsightsEnabled).toString(),
    );
    toast.success(
      `Smart Insights ${!aiInsightsEnabled ? "enabled" : "disabled"}`,
    );
  };

  const showToast = (type: "success" | "error" | "info", message: string) => {
    toast[type](message);
  };

  const simulateApiCall = async (action: string, delay: number = 1000) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return true;
    } catch (error) {
      throw new Error(`Failed to ${action}`);
    }
  };

  const handleExportReport = async () => {
    try {
      await simulateApiCall("export report", 2000);
      showToast("success", "Report exported successfully!");
    } catch (error) {
      showToast("error", "Failed to export report");
    }
  };

  const handleGenerateReport = async () => {
    try {
      await simulateApiCall("generate report", 1500);
      showToast("success", "Report generated successfully!");
    } catch (error) {
      showToast("error", "Failed to generate report");
    }
  };

  const handleScheduleReport = async () => {
    try {
      await simulateApiCall("schedule report", 1000);
      showToast("success", "Report scheduled successfully!");
    } catch (error) {
      showToast("error", "Failed to schedule report");
    }
  };

  const handleShareReport = async () => {
    try {
      await simulateApiCall("share report", 800);
      showToast("success", "Report shared successfully!");
    } catch (error) {
      showToast("error", "Failed to share report");
    }
  };

  const handlePrintReport = async () => {
    try {
      await simulateApiCall("print report", 500);
      showToast("success", "Report sent to printer!");
    } catch (error) {
      showToast("error", "Failed to print report");
    }
  };

  const handleViewDetails = (section: string, data: any) => {
    setViewDetailsData({ section, data });
    setModalState((prev) => ({ ...prev, viewDetails: true }));
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsStats.map((stat, index) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

            {/* AI Insights */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  🤖 AI Insights
                </h2>
                <button
                  onClick={toggleAiInsights}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    aiInsightsEnabled
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  <FiToggleRight className="w-4 h-4" />
                  <span>{aiInsightsEnabled ? "Enabled" : "Disabled"}</span>
                </button>
              </div>
              <AIInsights
                insights={insights}
                onActionClick={handleInsightAction}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                ⚡ Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() =>
                    setModalState((prev) => ({ ...prev, generateReport: true }))
                  }
                  className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <FiFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      Generate Report
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Create custom analytics report
                    </p>
                  </div>
                </button>

                <button
                  onClick={() =>
                    setModalState((prev) => ({ ...prev, export: true }))
                  }
                  className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <FiDownload className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <h3 className="font-medium text-green-900 dark:text-green-100">
                      Export Data
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Download analytics data
                    </p>
                  </div>
                </button>

                <button
                  onClick={() =>
                    setModalState((prev) => ({ ...prev, scheduleReport: true }))
                  }
                  className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <FiClock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <h3 className="font-medium text-purple-900 dark:text-purple-100">
                      Schedule Report
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Set up automated reports
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case "members":
        return (
          <div className="space-y-6">
            <MemberAnalytics />
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-6">
            <RevenueOverview />
          </div>
        );

      case "classes":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Class Analytics
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Class analytics content will be displayed here.
              </p>
            </div>
          </div>
        );

      case "insights":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Smart Insights
              </h2>
              <SmartInsightCards
                insights={insights}
                onActionClick={handleInsightAction}
                isPro={isPro}
              />
            </div>
          </div>
        );

      case "reports":
        return (
          <div className="space-y-6">
            <SmartReportsDashboard />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              📊 Smart Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Smart-powered insights • Real-time data • Actionable reports
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                setModalState((prev) => ({ ...prev, export: true }))
              }
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() =>
                setModalState((prev) => ({ ...prev, generateReport: true }))
              }
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiFileText className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Range Filter */}
          <div className="flex-1">
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {dateFilters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={filters.branch}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, branch: e.target.value }))
              }
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Branches</option>
              <option value="main">Main Branch</option>
              <option value="north">North Branch</option>
              <option value="south">South Branch</option>
            </select>

            <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === tab.id
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
        {modalState.generateReport && (
          <GenerateReportModal
            isOpen={modalState.generateReport}
            onClose={() => closeModal("generateReport")}
            onSuccess={handleGenerateReport}
          />
        )}

        {modalState.export && (
          <ExportReportModal
            isOpen={modalState.export}
            onClose={() => closeModal("export")}
            onSuccess={handleExportReport}
          />
        )}

        {modalState.scheduleReport && (
          <ScheduleReportModal
            isOpen={modalState.scheduleReport}
            onClose={() => closeModal("scheduleReport")}
            onSuccess={handleScheduleReport}
          />
        )}

        {modalState.shareReport && (
          <ShareReportModal
            isOpen={modalState.shareReport}
            onClose={() => closeModal("shareReport")}
            onSuccess={handleShareReport}
          />
        )}

        {modalState.printReport && (
          <PrintReportModal
            isOpen={modalState.printReport}
            onClose={() => closeModal("printReport")}
            onSuccess={handlePrintReport}
          />
        )}

        {modalState.viewDetails && (
          <ViewDetailsModal
            isOpen={modalState.viewDetails}
            onClose={() => closeModal("viewDetails")}
            section={viewDetailsData.section}
            data={viewDetailsData.data}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
