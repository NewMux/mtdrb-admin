import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import { useTheme } from "../../contexts/ThemeContext";
import { fetchAllRows } from "../../utils/fetchAllRows";
import {
  FiTrendingUp,
  FiClock,
  FiTarget,
  FiActivity,
  FiFilter,
  FiAlertTriangle,
  FiCheckCircle,
  FiAlertCircle,
  FiAward,
  FiEye,
} from "react-icons/fi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { AnimatePresence } from "framer-motion";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
);

interface SmartTaskAnalyticsProps {
  refreshKey: number;
}

interface TaskAnalyticsData {
  performanceSummary: {
    totalTasksCreated: number;
    tasksCompleted: number;
    completionRate: number;
    avgTimeToComplete: number;
    overdueTasks: number;
    avgTasksPerDay: number;
  };
  charts: {
    tasksOverTime: Array<{ date: string; created: number; completed: number }>;
    completionTrend: Array<{ date: string; completed: number }>;
    statusBreakdown: Array<{ status: string; count: number; percentage: number; color: string }>;
    priorityDistribution: Array<{ priority: string; count: number; percentage: number; color: string }>;
    staffProductivity: Array<{ staff: string; completed: number; avgTime: number }>;
  };
  teamInsights: {
    mostEfficientStaff: { name: string; avgTime: number };
    mostOverdueTasksBy: { name: string; count: number };
    mostTasksCompleted: { name: string; count: number };
    longestPendingTasks: { count: number; avgDays: number };
    tasksWithNoUpdates: { count: number; percentage: number };
  };
  riskIndicators: {
    stuckTasks: { count: number; percentage: number };
    highPriorityOverdue: { count: number; percentage: number };
  };
}

// A genuinely empty state - zeros and "N/A", never sample figures. It is
// what renders before data loads, when there is no tenant yet, and after a
// failed load. (It used to be hardcoded demo data with made-up staff names
// like "Sarah Johnson", which rendered for real whenever tenantId was
// missing.)
const emptyTaskAnalyticsData: TaskAnalyticsData = {
  performanceSummary: {
    totalTasksCreated: 0,
    tasksCompleted: 0,
    completionRate: 0,
    avgTimeToComplete: 0,
    overdueTasks: 0,
    avgTasksPerDay: 0,
  },
  charts: {
    tasksOverTime: [],
    completionTrend: [],
    statusBreakdown: [],
    priorityDistribution: [],
    staffProductivity: [],
  },
  teamInsights: {
    mostEfficientStaff: { name: "N/A", avgTime: 0 },
    mostOverdueTasksBy: { name: "N/A", count: 0 },
    mostTasksCompleted: { name: "N/A", count: 0 },
    longestPendingTasks: { count: 0, avgDays: 0 },
    tasksWithNoUpdates: { count: 0, percentage: 0 },
  },
  riskIndicators: {
    stuckTasks: { count: 0, percentage: 0 },
    highPriorityOverdue: { count: 0, percentage: 0 },
  },
};

// Filter Components - Updated to match other analytics tabs
const AnalyticsFilters: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { tenantId } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    branch: "all",
    assignedTo: "all",
    dateRange: "last30days",
    status: "all",
    priority: "all",
  });
  const [branchOptions, setBranchOptions] = useState<{ id: string; name: string }[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!tenantId) return;
      const [{ data: branches }, { data: trainers }] = await Promise.all([
        supabase
          .from("branches")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("trainers")
          .select("id, first_name, last_name")
          .eq("tenant_id", tenantId)
          .eq("status", "active")
          .order("first_name", { ascending: true }),
      ]);
      setBranchOptions((branches || []).map((b) => ({ id: b.id, name: b.name })));
      setStaffOptions(
        (trainers || []).map((s) => ({
          id: s.id,
          name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
        })),
      );
    };
    loadFilterOptions();
  }, [tenantId]);

  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-xl">
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
        <button
          onClick={toggleFilters}
          className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors`}
        >
          <FiFilter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("tasks.analyticsFilters")}
          </span>
        </button>
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
              {/* Branch */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                value={filters.branch}
                onChange={(e) =>
                  setFilters({ ...filters, branch: e.target.value })
                }
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="all">{t("tasks.allBranches")}</option>
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>

              {/* Assigned To */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                value={filters.assignedTo}
                onChange={(e) =>
                  setFilters({ ...filters, assignedTo: e.target.value })
                }
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="all">{t("tasks.allStaff")}</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>

              {/* Date Range */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="last7days">{t("tasks.last7Days")}</option>
                <option value="last30days">{t("tasks.last30Days")}</option>
                <option value="last90days">{t("tasks.last90Days")}</option>
                <option value="last6months">{t("tasks.last6Months")}</option>
                <option value="lastyear">{t("tasks.lastYear")}</option>
              </select>

              {/* Status */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="all">{t("tasks.allStatus")}</option>
                <option value="open">{t("tasks.open")}</option>
                <option value="in-progress">{t("tasks.inProgress")}</option>
                <option value="done">{t("tasks.done")}</option>
                <option value="overdue">{t("tasks.overdue")}</option>
              </select>

              {/* Priority */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="all">{t("tasks.allPriorities")}</option>
                <option value="low">{t("tasks.low")}</option>
                <option value="medium">{t("tasks.medium")}</option>
                <option value="high">{t("tasks.high")}</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Color mappings for KPI cards
const kpiColorMap = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-600 dark:text-purple-400",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-600 dark:text-orange-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/20",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-600 dark:text-red-400",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

// Performance Summary Cards - Updated to match other analytics tabs
const PerformanceSummaryCards: React.FC<{ data: TaskAnalyticsData }> = ({ data }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { performanceSummary } = data;

  const cards = [
    {
      title: t("tasks.totalTasksCreated"),
      value: performanceSummary.totalTasksCreated.toLocaleString(),
      subtitle: t("tasks.tasksCreatedInPeriod"),
      icon: FiTarget,
      color: "blue" as const,
    },
    {
      title: t("tasks.tasksCompleted"),
      value: performanceSummary.tasksCompleted.toLocaleString(),
      subtitle: t("tasks.tasksCompletedInPeriod"),
      icon: FiCheckCircle,
      color: "green" as const,
    },
    {
      title: t("tasks.completionRate"),
      value: `${performanceSummary.completionRate}%`,
      subtitle: t("tasks.averageCompletionRate"),
      icon: FiTrendingUp,
      color: "purple" as const,
    },
    {
      title: t("tasks.avgTimeToComplete"),
      value: `${performanceSummary.avgTimeToComplete} ${t("tasks.daysAvg")}`,
      subtitle: t("tasks.averageCompletionTime"),
      icon: FiClock,
      color: "orange" as const,
    },
    {
      title: t("tasks.overdueTasks"),
      value: performanceSummary.overdueTasks.toLocaleString(),
      subtitle: t("tasks.tasksPastDueDate"),
      icon: FiAlertTriangle,
      color: "red" as const,
    },
    {
      title: t("tasks.avgTasksPerDay"),
      value: performanceSummary.avgTasksPerDay.toFixed(1),
      subtitle: t("tasks.dailyTaskAverage"),
      icon: FiActivity,
      color: "indigo" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const colors = kpiColorMap[card.color];
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
              <div
                className={`w-12 h-12 rounded-2xl ${colors.iconBg} flex items-center justify-center`}
              >
                <card.icon className={`w-6 h-6 ${colors.text}`} />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.subtitle}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Chart Components
const TasksOverTimeChart: React.FC<{ data: TaskAnalyticsData }> = ({ data: analyticsData }) => {
  const { isDark } = useTheme();
  const data = analyticsData.charts.tasksOverTime;

  const chartData = {
    labels: data.map((item) =>
      new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    ),
    datasets: [
      {
        label: "Tasks Created",
        data: data.map((item) => item.created),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
      {
        label: "Tasks Completed",
        data: data.map((item) => item.completed),
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
        },
      },
    },
  };

  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📈 {t("tasks.tasksOverTime")}
      </h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

const CompletionTrendChart: React.FC<{ data: TaskAnalyticsData }> = ({ data: analyticsData }) => {
  const { isDark } = useTheme();
  const data = analyticsData.charts.completionTrend;

  const chartData = {
    labels: data.map((item) =>
      new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    ),
    datasets: [
      {
        label: "Tasks Completed",
        data: data.map((item) => item.completed),
        backgroundColor: "#10B981",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" },
        ticks: { color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)" },
      },
      x: {
        grid: { display: false },
        ticks: { color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)" },
      },
    },
  };

  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📊 {t("tasks.completionTrend")}
      </h3>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

const StatusBreakdownChart: React.FC<{ data: TaskAnalyticsData }> = ({ data: analyticsData }) => {
  const { isDark } = useTheme();
  const data = analyticsData.charts.statusBreakdown;

  const chartData = {
    labels: data.map((item) => item.status),
    datasets: [
      {
        data: data.map((item) => item.count),
        backgroundColor: data.map((item) => item.color),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
          color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
  };

  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🥧 {t("tasks.statusBreakdown")}
      </h3>
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

const PriorityDistributionChart: React.FC<{ data: TaskAnalyticsData }> = ({ data: analyticsData }) => {
  const { isDark } = useTheme();
  const data = analyticsData.charts.priorityDistribution;

  const chartData = {
    labels: data.map((item) => item.priority),
    datasets: [
      {
        data: data.map((item) => item.count),
        backgroundColor: data.map((item) => item.color),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
          color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
  };

  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🎯 {t("tasks.priorityDistribution")}
      </h3>
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

const StaffProductivityChart: React.FC<{ data: TaskAnalyticsData }> = ({ data: analyticsData }) => {
  const { isDark } = useTheme();
  const data = analyticsData.charts.staffProductivity;

  const chartData = {
    labels: data.map((item) => item.staff),
    datasets: [
      {
        label: "Tasks Completed",
        data: data.map((item) => item.completed),
        backgroundColor: "#3B82F6",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" },
        ticks: { color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)" },
      },
      x: {
        grid: { display: false },
        ticks: { color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)" },
      },
    },
  };

  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        👥 {t("tasks.staffProductivity")}
      </h3>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

// Team & Individual Insights - Updated to match other analytics tabs
const TeamInsightsCards: React.FC<{ data: TaskAnalyticsData }> = ({ data }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { teamInsights } = data;

  const insights = [
    {
      title: t("tasks.mostEfficientStaff"),
      value: teamInsights.mostEfficientStaff.name,
      subtitle: `${teamInsights.mostEfficientStaff.avgTime} ${t("tasks.daysAvg")}`,
      icon: FiAward,
      color: "green",
    },
    {
      title: t("tasks.mostOverdueTasksBy"),
      value: teamInsights.mostOverdueTasksBy.name,
      subtitle: `${teamInsights.mostOverdueTasksBy.count} ${t("tasks.overdueTasks")}`,
      icon: FiAlertTriangle,
      color: "red",
    },
    {
      title: t("tasks.mostTasksCompleted"),
      value: teamInsights.mostTasksCompleted.name,
      subtitle: `${teamInsights.mostTasksCompleted.count} ${t("tasks.tasksCompleted")}`,
      icon: FiCheckCircle,
      color: "blue",
    },
    {
      title: t("tasks.longestPendingTasks"),
      value: teamInsights.longestPendingTasks.count,
      subtitle: `${teamInsights.longestPendingTasks.avgDays} ${t("tasks.daysAverage")}`,
      icon: FiClock,
      color: "orange",
    },
    {
      title: t("tasks.tasksWithNoUpdates"),
      value: teamInsights.tasksWithNoUpdates.count,
      subtitle: `${teamInsights.tasksWithNoUpdates.percentage}% ${t("tasks.ofTotal")}`,
      icon: FiEye,
      color: "purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {insights.map((insight, index) => (
        <motion.div
          key={insight.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
            <div
              className={`w-12 h-12 rounded-2xl bg-${insight.color}-50 flex items-center justify-center`}
            >
              <insight.icon className={`w-6 h-6 text-${insight.color}-600`} />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{insight.value}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{insight.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Risk & Bottleneck Indicators - Updated to match other analytics tabs
const RiskIndicatorsCards: React.FC<{ data: TaskAnalyticsData }> = ({ data }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { riskIndicators } = data;

  // Only indicators computed from real task data are shown. "Tasks
  // reassigned often" and "weekends with no progress" used to render as
  // hardcoded zeros (the schema keeps no reassignment history), and every
  // card carried a hardcoded trend percentage - both looked like measured
  // findings and were removed rather than faked.
  const risks = [
    {
      title: t("tasks.stuckTasks"),
      value: riskIndicators.stuckTasks.count,
      subtitle: `${riskIndicators.stuckTasks.percentage}% ${t("tasks.ofTotal")}`,
      description: t("tasks.noActivity"),
      icon: FiAlertCircle,
      color: "red",
    },
    {
      title: t("tasks.highPriorityOverdue"),
      value: riskIndicators.highPriorityOverdue.count,
      subtitle: `${riskIndicators.highPriorityOverdue.percentage}% ${t("tasks.ofTotal")}`,
      description: t("tasks.highPriorityAndOverdue"),
      icon: FiAlertTriangle,
      color: "red",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {risks.map((risk, index) => (
        <motion.div
          key={risk.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
            <div
              className={`w-12 h-12 rounded-2xl bg-${risk.color}-50 flex items-center justify-center`}
            >
              <risk.icon className={`w-6 h-6 text-${risk.color}-600`} />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{risk.value}</h3>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{risk.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{risk.subtitle}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{risk.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Main Component
const SmartTaskAnalytics: React.FC<SmartTaskAnalyticsProps> = ({
  refreshKey,
}) => {
  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const [analyticsData, setAnalyticsData] = useState(emptyTaskAnalyticsData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskAnalytics = async () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch all tasks for the tenant. Assignee names are resolved
        // separately below in one batched, tenant-scoped lookup; embedding
        // `profiles` here (it was never read) would fail this whole query
        // if that table is unavailable.
        // Paged (fetchAllRows): PostgREST caps a response at 1000 rows, which
        // would silently cap every count below. `id` breaks created_at ties
        // so pages don't overlap or skip rows.
        const tasksData = await fetchAllRows((from, to) =>
          supabase
            .from("member_tasks")
            .select(
              `
            *,
            member:members(id, first_name, last_name)
          `,
            )
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, to),
        );

        // Calculate date range (last 30 days by default)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentTasks = tasksData.filter(
          (task) => new Date(task.created_at) >= thirtyDaysAgo,
        );

        // Performance Summary Calculations
        const totalTasksCreated = tasksData.length;
        const tasksCompleted = tasksData.filter(
          (t) => t.status === "completed",
        ).length;
        const completionRate =
          totalTasksCreated > 0
            ? (tasksCompleted / totalTasksCreated) * 100
            : 0;

        // Calculate average time to complete
        const completedTasks = tasksData.filter(
          (t) => t.status === "completed" && t.completed_at && t.created_at,
        );
        const avgTimeToComplete =
          completedTasks.length > 0
            ? completedTasks.reduce((sum, task) => {
                const created = new Date(task.created_at);
                const completed = new Date(task.completed_at);
                const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                return sum + days;
              }, 0) / completedTasks.length
            : 0;

        // Overdue tasks
        const overdueTasks = tasksData.filter((t) => {
          if (!t.due_date || t.status === "completed") return false;
          return new Date(t.due_date) < now;
        }).length;

        // Average tasks per day (last 30 days)
        const daysDiff = 30;
        const avgTasksPerDay = daysDiff > 0 ? recentTasks.length / daysDiff : 0;

        // Tasks Over Time (last 30 days)
        const tasksOverTime: Array<{ date: string; created: number; completed: number }> = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split("T")[0];
          const created = tasksData.filter(
            (t) => t.created_at?.split("T")[0] === dateStr,
          ).length;
          const completed = tasksData.filter(
            (t) =>
              t.completed_at?.split("T")[0] === dateStr &&
              t.status === "completed",
          ).length;
          tasksOverTime.push({ date: dateStr, created, completed });
        }

        // Completion Trend (last 30 days)
        const completionTrend = tasksOverTime.map((item) => ({
          date: item.date,
          completed: item.completed,
        }));

        // Status Breakdown
        const statusCounts: Record<string, number> = {};
        tasksData.forEach((task) => {
          const status = task.status || "pending";
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusBreakdown = [
          {
            status: "Pending",
            count: statusCounts.pending || 0,
            percentage:
              totalTasksCreated > 0
                ? ((statusCounts.pending || 0) / totalTasksCreated) * 100
                : 0,
            color: "#3B82F6",
          },
          {
            status: "In Progress",
            count: statusCounts.in_progress || 0,
            percentage:
              totalTasksCreated > 0
                ? ((statusCounts.in_progress || 0) / totalTasksCreated) * 100
                : 0,
            color: "#F59E0B",
          },
          {
            status: "Completed",
            count: statusCounts.completed || 0,
            percentage:
              totalTasksCreated > 0
                ? ((statusCounts.completed || 0) / totalTasksCreated) * 100
                : 0,
            color: "#10B981",
          },
          {
            status: "Overdue",
            count: overdueTasks,
            percentage:
              totalTasksCreated > 0 ? (overdueTasks / totalTasksCreated) * 100 : 0,
            color: "#EF4444",
          },
        ];

        // Priority Distribution
        const priorityCounts: Record<string, number> = {};
        tasksData.forEach((task) => {
          const priority = task.priority || "medium";
          priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
        });

        const priorityDistribution = [
          {
            priority: "Low",
            count: priorityCounts.low || 0,
            percentage:
              totalTasksCreated > 0
                ? ((priorityCounts.low || 0) / totalTasksCreated) * 100
                : 0,
            color: "#6B7280",
          },
          {
            priority: "Medium",
            count: priorityCounts.medium || 0,
            percentage:
              totalTasksCreated > 0
                ? ((priorityCounts.medium || 0) / totalTasksCreated) * 100
                : 0,
            color: "#F59E0B",
          },
          {
            priority: "High",
            count: priorityCounts.high || 0,
            percentage:
              totalTasksCreated > 0
                ? ((priorityCounts.high || 0) / totalTasksCreated) * 100
                : 0,
            color: "#EF4444",
          },
        ];

        // Staff Productivity (by assignee)
        const staffProductivityMap: Record<
          string,
          { completed: number; totalTime: number; count: number }
        > = {};
        completedTasks.forEach((task) => {
          if (task.assigned_to) {
            const assigneeId = task.assigned_to;
            if (!staffProductivityMap[assigneeId]) {
              staffProductivityMap[assigneeId] = {
                completed: 0,
                totalTime: 0,
                count: 0,
              };
            }
            staffProductivityMap[assigneeId].completed++;
            if (task.completed_at && task.created_at) {
              const created = new Date(task.created_at);
              const completed = new Date(task.completed_at);
              const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
              staffProductivityMap[assigneeId].totalTime += days;
              staffProductivityMap[assigneeId].count++;
            }
          }
        });

        const overdueByAssignee: Record<string, number> = {};
        tasksData
          .filter((t) => {
            if (!t.due_date || t.status === "completed") return false;
            return new Date(t.due_date) < now;
          })
          .forEach((task) => {
            if (task.assigned_to) {
              overdueByAssignee[task.assigned_to] =
                (overdueByAssignee[task.assigned_to] || 0) + 1;
            }
          });

        const mostOverdueTasksBy =
          Object.keys(overdueByAssignee).length > 0
            ? Object.entries(overdueByAssignee).reduce((a, b) =>
                a[1] > b[1] ? a : b,
              )
            : ["", 0];

        // Resolve every assignee name we need in one batched lookup
        // (previously one `profiles` round-trip per assignee, plus another
        // for the most-overdue assignee).
        const assigneeIds = Object.keys(staffProductivityMap);
        const idsToResolve = Array.from(
          new Set(
            [...assigneeIds, mostOverdueTasksBy[0] as string].filter(Boolean),
          ),
        );
        const assigneeNames = new Map<string, string>();
        if (idsToResolve.length > 0) {
          // Defence in depth on top of RLS: only resolve names for users
          // who are members of this tenant. `profiles` has no tenant_id
          // column to filter on, so scope through `memberships`.
          const { data: tenantUsers, error: tenantUsersError } = await supabase
            .from("memberships")
            .select("user_id")
            .eq("tenant_id", tenantId)
            .in("user_id", idsToResolve);
          if (tenantUsersError) {
            console.warn("Could not scope assignees to tenant:", tenantUsersError);
          }
          const tenantUserIds = (tenantUsers || []).map((row) => row.user_id as string);

          if (tenantUserIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name")
              .in("id", tenantUserIds);
            // Names are cosmetic: a failed lookup (e.g. no `profiles`
            // table) degrades to "Unknown" rather than failing the
            // whole dashboard.
            if (profilesError) {
              console.warn("Could not resolve assignee names:", profilesError);
            }
            (profiles || []).forEach((profile) => {
              const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
              if (name) assigneeNames.set(profile.id as string, name);
            });
          }
        }

        const staffProductivity = assigneeIds.map((assigneeId) => {
          const stats = staffProductivityMap[assigneeId];
          const avgTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
          return {
            staff: assigneeNames.get(assigneeId) || "Unknown",
            completed: stats.completed,
            avgTime: avgTime,
          };
        });

        // Team Insights
        const mostEfficientStaff =
          staffProductivity.length > 0
            ? staffProductivity.reduce((prev, current) =>
                prev.avgTime < current.avgTime ? prev : current,
              )
            : { staff: "N/A", avgTime: 0 };

        const mostOverdueName = mostOverdueTasksBy[0]
          ? assigneeNames.get(mostOverdueTasksBy[0] as string) || "Unknown"
          : "N/A";

        const mostTasksCompleted =
          staffProductivity.length > 0
            ? staffProductivity.reduce((prev, current) =>
                prev.completed > current.completed ? prev : current,
              )
            : { staff: "N/A", completed: 0 };

        // Longest pending tasks
        const pendingTasks = tasksData.filter((t) => t.status === "pending");
        const longestPendingDays =
          pendingTasks.length > 0
            ? pendingTasks.map((t) => {
                const created = new Date(t.created_at);
                return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
              })
            : [];
        const avgDaysPending =
          longestPendingDays.length > 0
            ? longestPendingDays.reduce((a, b) => a + b, 0) /
              longestPendingDays.length
            : 0;

        // Tasks with no updates (no completed_at and created more than 7 days ago)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const tasksWithNoUpdates = tasksData.filter(
          (t) =>
            !t.completed_at &&
            new Date(t.created_at) < sevenDaysAgo &&
            t.status !== "completed",
        ).length;

        // Risk Indicators
        const stuckTasks = tasksData.filter(
          (t) =>
            !t.completed_at &&
            new Date(t.created_at) < sevenDaysAgo &&
            t.status !== "completed",
        ).length;

        const highPriorityOverdue = tasksData.filter(
          (t) =>
            t.priority === "high" &&
            t.due_date &&
            new Date(t.due_date) < now &&
            t.status !== "completed",
        ).length;

        // Build analytics data
        const calculatedData: TaskAnalyticsData = {
          performanceSummary: {
            totalTasksCreated,
            tasksCompleted,
            completionRate: parseFloat(completionRate.toFixed(1)),
            avgTimeToComplete: parseFloat(avgTimeToComplete.toFixed(1)),
            overdueTasks,
            avgTasksPerDay: parseFloat(avgTasksPerDay.toFixed(1)),
          },
          charts: {
            tasksOverTime,
            completionTrend,
            statusBreakdown,
            priorityDistribution,
            staffProductivity: staffProductivity.slice(0, 10), // Top 10
          },
          teamInsights: {
            mostEfficientStaff: {
              name: mostEfficientStaff.staff,
              avgTime: parseFloat(mostEfficientStaff.avgTime.toFixed(1)),
            },
            mostOverdueTasksBy: {
              name: mostOverdueName,
              count: (mostOverdueTasksBy[1] as number) || 0,
            },
            mostTasksCompleted: {
              name: mostTasksCompleted.staff,
              count: mostTasksCompleted.completed,
            },
            longestPendingTasks: {
              count: pendingTasks.length,
              avgDays: parseFloat(avgDaysPending.toFixed(1)),
            },
            tasksWithNoUpdates: {
              count: tasksWithNoUpdates,
              percentage:
                totalTasksCreated > 0
                  ? parseFloat(
                      ((tasksWithNoUpdates / totalTasksCreated) * 100).toFixed(1),
                    )
                  : 0,
            },
          },
          riskIndicators: {
            stuckTasks: {
              count: stuckTasks,
              percentage:
                totalTasksCreated > 0
                  ? parseFloat(((stuckTasks / totalTasksCreated) * 100).toFixed(1))
                  : 0,
            },
            highPriorityOverdue: {
              count: highPriorityOverdue,
              percentage:
                totalTasksCreated > 0
                  ? parseFloat(
                      ((highPriorityOverdue / totalTasksCreated) * 100).toFixed(1),
                    )
                  : 0,
            },
          },
        };

        setAnalyticsData(calculatedData);
        console.log("Task analytics data loaded:", calculatedData.performanceSummary);
      } catch (error) {
        console.error("Error fetching task analytics:", error);
        setAnalyticsData(emptyTaskAnalyticsData);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAnalytics();
  }, [refreshKey, tenantId]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AnalyticsFilters />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Performance Summary */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              📊 {t("tasks.performanceSummary")}
            </h2>
            <PerformanceSummaryCards data={analyticsData} />
          </div>

          {/* Visualizations */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              📈 {t("tasks.visualizations")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TasksOverTimeChart data={analyticsData} />
              <CompletionTrendChart data={analyticsData} />
              <StatusBreakdownChart data={analyticsData} />
              <PriorityDistributionChart data={analyticsData} />
            </div>
            <StaffProductivityChart data={analyticsData} />
          </div>

          {/* Team & Individual Insights */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              🔍 {t("tasks.teamInsights")}
            </h2>
            <TeamInsightsCards data={analyticsData} />
          </div>

          {/* Risk & Bottleneck Indicators */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              ⚠️ {t("tasks.riskIndicators")}
            </h2>
            <RiskIndicatorsCards data={analyticsData} />
          </div>
        </>
      )}
    </div>
  );
};

export default SmartTaskAnalytics;
