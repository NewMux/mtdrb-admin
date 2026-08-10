import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import { useTheme } from "../../contexts/ThemeContext";
import {
  FiTrendingUp,
  FiClock,
  FiTarget,
  FiActivity,
  FiFilter,
  FiAlertTriangle,
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
  FiAward,
  FiEye,
  FiPause,
  FiArrowUp,
  FiArrowDown,
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

// Removed mock data - using real data from Supabase
// TODO: Fetch from Supabase
const emptyTaskAnalyticsData = {
  filters: {
    branches: [
      { id: "main", name: "Main Branch", selected: true },
      { id: "north", name: "North Branch", selected: false },
      { id: "south", name: "South Branch", selected: false },
      { id: "east", name: "East Branch", selected: false },
    ],
    staff: [
      { id: "sarah", name: "Sarah Johnson", selected: true },
      { id: "mike", name: "Mike Chen", selected: true },
      { id: "emma", name: "Emma Davis", selected: false },
      { id: "alex", name: "Alex Rodriguez", selected: false },
      { id: "lisa", name: "Lisa Thompson", selected: false },
    ],
    dateRanges: [
      { id: "last-7-days", name: "Last 7 Days", selected: false },
      { id: "last-30-days", name: "Last 30 Days", selected: true },
      { id: "last-90-days", name: "Last 90 Days", selected: false },
      { id: "this-year", name: "This Year", selected: false },
    ],
    statuses: [
      { id: "open", name: "Open", selected: true },
      { id: "in-progress", name: "In Progress", selected: true },
      { id: "done", name: "Done", selected: true },
      { id: "overdue", name: "Overdue", selected: true },
    ],
    priorities: [
      { id: "low", name: "Low", selected: true },
      { id: "medium", name: "Medium", selected: true },
      { id: "high", name: "High", selected: true },
    ],
  },
  performanceSummary: {
    totalTasksCreated: 342,
    tasksCompleted: 287,
    completionRate: 83.9,
    avgTimeToComplete: 2.4,
    overdueTasks: 23,
    avgTasksPerDay: 11.4,
  },
  charts: {
    tasksOverTime: [
      { date: "2024-01-01", created: 8, completed: 6 },
      { date: "2024-01-02", created: 12, completed: 9 },
      { date: "2024-01-03", created: 15, completed: 13 },
      { date: "2024-01-04", created: 10, completed: 11 },
      { date: "2024-01-05", created: 14, completed: 12 },
      { date: "2024-01-06", created: 9, completed: 8 },
      { date: "2024-01-07", created: 11, completed: 10 },
      { date: "2024-01-08", created: 13, completed: 14 },
      { date: "2024-01-09", created: 16, completed: 15 },
      { date: "2024-01-10", created: 12, completed: 11 },
      { date: "2024-01-11", created: 14, completed: 13 },
      { date: "2024-01-12", created: 10, completed: 9 },
      { date: "2024-01-13", created: 8, completed: 7 },
      { date: "2024-01-14", created: 11, completed: 10 },
      { date: "2024-01-15", created: 13, completed: 12 },
      { date: "2024-01-16", created: 15, completed: 14 },
      { date: "2024-01-17", created: 12, completed: 11 },
      { date: "2024-01-18", created: 9, completed: 8 },
      { date: "2024-01-19", created: 11, completed: 10 },
      { date: "2024-01-20", created: 14, completed: 13 },
      { date: "2024-01-21", created: 16, completed: 15 },
      { date: "2024-01-22", created: 13, completed: 12 },
      { date: "2024-01-23", created: 10, completed: 9 },
      { date: "2024-01-24", created: 12, completed: 11 },
      { date: "2024-01-25", created: 15, completed: 14 },
      { date: "2024-01-26", created: 11, completed: 10 },
      { date: "2024-01-27", created: 9, completed: 8 },
      { date: "2024-01-28", created: 13, completed: 12 },
      { date: "2024-01-29", created: 14, completed: 13 },
      { date: "2024-01-30", created: 12, completed: 11 },
    ],
    completionTrend: [
      { date: "2024-01-01", completed: 6 },
      { date: "2024-01-02", completed: 9 },
      { date: "2024-01-03", completed: 13 },
      { date: "2024-01-04", completed: 11 },
      { date: "2024-01-05", completed: 12 },
      { date: "2024-01-06", completed: 8 },
      { date: "2024-01-07", completed: 10 },
      { date: "2024-01-08", completed: 14 },
      { date: "2024-01-09", completed: 15 },
      { date: "2024-01-10", completed: 11 },
      { date: "2024-01-11", completed: 13 },
      { date: "2024-01-12", completed: 9 },
      { date: "2024-01-13", completed: 7 },
      { date: "2024-01-14", completed: 10 },
      { date: "2024-01-15", completed: 12 },
      { date: "2024-01-16", completed: 14 },
      { date: "2024-01-17", completed: 11 },
      { date: "2024-01-18", completed: 8 },
      { date: "2024-01-19", completed: 10 },
      { date: "2024-01-20", completed: 13 },
      { date: "2024-01-21", completed: 15 },
      { date: "2024-01-22", completed: 12 },
      { date: "2024-01-23", completed: 9 },
      { date: "2024-01-24", completed: 11 },
      { date: "2024-01-25", completed: 14 },
      { date: "2024-01-26", completed: 10 },
      { date: "2024-01-27", completed: 8 },
      { date: "2024-01-28", completed: 12 },
      { date: "2024-01-29", completed: 13 },
      { date: "2024-01-30", completed: 11 },
    ],
    statusBreakdown: [
      { status: "Open", count: 45, percentage: 15.8, color: "#3B82F6" },
      { status: "In Progress", count: 67, percentage: 23.5, color: "#F59E0B" },
      { status: "Done", count: 287, percentage: 50.7, color: "#10B981" },
      { status: "Overdue", count: 23, percentage: 8.1, color: "#EF4444" },
    ],
    priorityDistribution: [
      { priority: "Low", count: 89, percentage: 31.2, color: "#6B7280" },
      { priority: "Medium", count: 156, percentage: 54.7, color: "#F59E0B" },
      { priority: "High", count: 40, percentage: 14.1, color: "#EF4444" },
    ],
    staffProductivity: [
      { staff: "Sarah Johnson", completed: 45, avgTime: 1.8 },
      { staff: "Mike Chen", completed: 38, avgTime: 2.1 },
      { staff: "Emma Davis", completed: 32, avgTime: 2.5 },
      { staff: "Alex Rodriguez", completed: 28, avgTime: 2.8 },
      { staff: "Lisa Thompson", completed: 25, avgTime: 3.2 },
    ],
  },
  teamInsights: {
    mostEfficientStaff: { name: "Sarah Johnson", avgTime: 1.8 },
    mostOverdueTasksBy: { name: "Lisa Thompson", count: 8 },
    mostTasksCompleted: { name: "Sarah Johnson", count: 45 },
    longestPendingTasks: { count: 12, avgDays: 15.3 },
    tasksWithNoUpdates: { count: 18, percentage: 6.3 },
  },
  riskIndicators: {
    stuckTasks: { count: 15, percentage: 5.3 },
    tasksReassignedOften: { count: 8, percentage: 2.8 },
    highPriorityOverdue: { count: 12, percentage: 4.2 },
    weekendsWithNoProgress: { count: 3, percentage: 1.1 },
  },
};

// Filter Components - Updated to match other analytics tabs
const AnalyticsFilters: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    branch: "all",
    assignedTo: "all",
    dateRange: "last30days",
    status: "all",
    priority: "all",
  });

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
                <option value="main">Main Branch</option>
                <option value="north">North Branch</option>
                <option value="south">South Branch</option>
                <option value="east">East Branch</option>
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
                <option value="sarah">Sarah Johnson</option>
                <option value="mike">Mike Chen</option>
                <option value="emma">Emma Davis</option>
                <option value="alex">Alex Rodriguez</option>
                <option value="lisa">Lisa Thompson</option>
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
const PerformanceSummaryCards: React.FC<{ data: typeof emptyTaskAnalyticsData }> = ({ data }) => {
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
      trend: { value: 12.3, isPositive: true },
    },
    {
      title: t("tasks.tasksCompleted"),
      value: performanceSummary.tasksCompleted.toLocaleString(),
      subtitle: t("tasks.tasksCompletedInPeriod"),
      icon: FiCheckCircle,
      color: "green" as const,
      trend: { value: 8.7, isPositive: true },
    },
    {
      title: t("tasks.completionRate"),
      value: `${performanceSummary.completionRate}%`,
      subtitle: t("tasks.averageCompletionRate"),
      icon: FiTrendingUp,
      color: "purple" as const,
      trend: { value: 2.1, isPositive: true },
    },
    {
      title: t("tasks.avgTimeToComplete"),
      value: `${performanceSummary.avgTimeToComplete} ${t("tasks.daysAvg")}`,
      subtitle: t("tasks.averageCompletionTime"),
      icon: FiClock,
      color: "orange" as const,
      trend: { value: 5.2, isPositive: false },
    },
    {
      title: t("tasks.overdueTasks"),
      value: performanceSummary.overdueTasks.toLocaleString(),
      subtitle: t("tasks.tasksPastDueDate"),
      icon: FiAlertTriangle,
      color: "red" as const,
      trend: { value: 15.4, isPositive: false },
    },
    {
      title: t("tasks.avgTasksPerDay"),
      value: performanceSummary.avgTasksPerDay.toFixed(1),
      subtitle: t("tasks.dailyTaskAverage"),
      icon: FiActivity,
      color: "indigo" as const,
      trend: { value: 3.8, isPositive: true },
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
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-1 ${
                  card.trend.isPositive
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}
              >
                {card.trend.isPositive ? (
                  <FiArrowUp className="w-3 h-3" />
                ) : (
                  <FiArrowDown className="w-3 h-3" />
                )}
                {Math.abs(card.trend.value)}%
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
const TasksOverTimeChart: React.FC<{ data: typeof emptyTaskAnalyticsData }> = ({ data: analyticsData }) => {
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

const CompletionTrendChart: React.FC<{ data: typeof emptyTaskAnalyticsData }> = ({ data: analyticsData }) => {
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

const StatusBreakdownChart: React.FC<{ data: typeof emptyTaskAnalyticsData }> = ({ data: analyticsData }) => {
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

const PriorityDistributionChart: React.FC<{ data: typeof emptyTaskAnalyticsData }> = ({ data: analyticsData }) => {
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

const StaffProductivityChart: React.FC<{ data: typeof emptyTaskAnalyticsData }> = ({ data: analyticsData }) => {
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
const TeamInsightsCards: React.FC<{ data: typeof emptyTaskAnalyticsData }> = ({ data }) => {
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
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: t("tasks.mostOverdueTasksBy"),
      value: teamInsights.mostOverdueTasksBy.name,
      subtitle: `${teamInsights.mostOverdueTasksBy.count} ${t("tasks.overdueTasks")}`,
      icon: FiAlertTriangle,
      color: "red",
      trend: { value: 8.3, isPositive: false },
    },
    {
      title: t("tasks.mostTasksCompleted"),
      value: teamInsights.mostTasksCompleted.name,
      subtitle: `${teamInsights.mostTasksCompleted.count} ${t("tasks.tasksCompleted")}`,
      icon: FiCheckCircle,
      color: "blue",
      trend: { value: 15.2, isPositive: true },
    },
    {
      title: t("tasks.longestPendingTasks"),
      value: teamInsights.longestPendingTasks.count,
      subtitle: `${teamInsights.longestPendingTasks.avgDays} ${t("tasks.daysAverage")}`,
      icon: FiClock,
      color: "orange",
      trend: { value: 5.7, isPositive: false },
    },
    {
      title: t("tasks.tasksWithNoUpdates"),
      value: teamInsights.tasksWithNoUpdates.count,
      subtitle: `${teamInsights.tasksWithNoUpdates.percentage}% ${t("tasks.ofTotal")}`,
      icon: FiEye,
      color: "purple",
      trend: { value: 3.2, isPositive: false },
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
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-1 ${
                insight.trend.isPositive
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}
            >
              {insight.trend.isPositive ? (
                <FiArrowUp className="w-3 h-3" />
              ) : (
                <FiArrowDown className="w-3 h-3" />
              )}
              {Math.abs(insight.trend.value)}%
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
const RiskIndicatorsCards: React.FC<{ data: typeof emptyTaskAnalyticsData }> = ({ data }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { riskIndicators } = data;

  const risks = [
    {
      title: t("tasks.stuckTasks"),
      value: riskIndicators.stuckTasks.count,
      subtitle: `${riskIndicators.stuckTasks.percentage}% ${t("tasks.ofTotal")}`,
      description: t("tasks.noActivity"),
      icon: FiAlertCircle,
      color: "red",
      trend: { value: 12.8, isPositive: false },
    },
    {
      title: t("tasks.tasksReassignedOften"),
      value: riskIndicators.tasksReassignedOften.count,
      subtitle: `${riskIndicators.tasksReassignedOften.percentage}% ${t("tasks.ofTotal")}`,
      description: t("tasks.reassignmentCount"),
      icon: FiZap,
      color: "orange",
      trend: { value: 5.3, isPositive: false },
    },
    {
      title: t("tasks.highPriorityOverdue"),
      value: riskIndicators.highPriorityOverdue.count,
      subtitle: `${riskIndicators.highPriorityOverdue.percentage}% ${t("tasks.ofTotal")}`,
      description: t("tasks.highPriorityAndOverdue"),
      icon: FiAlertTriangle,
      color: "red",
      trend: { value: 18.2, isPositive: false },
    },
    {
      title: t("tasks.weekendsWithNoProgress"),
      value: riskIndicators.weekendsWithNoProgress.count,
      subtitle: `${riskIndicators.weekendsWithNoProgress.percentage}% ${t("tasks.ofTotal")}`,
      description: t("tasks.gapsInCompletion"),
      icon: FiPause,
      color: "yellow",
      trend: { value: 2.1, isPositive: false },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-1 ${
                risk.trend.isPositive
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}
            >
              {risk.trend.isPositive ? (
                <FiArrowUp className="w-3 h-3" />
              ) : (
                <FiArrowDown className="w-3 h-3" />
              )}
              {Math.abs(risk.trend.value)}%
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
        // Fetch all tasks for the tenant
        const { data: tasks, error } = await supabase
          .from("member_tasks")
          .select(
            `
            *,
            member:members(id, first_name, last_name),
            assignee:profiles(id, first_name, last_name)
          `,
          )
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const tasksData = tasks || [];

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

        // Fetch assignee names
        const assigneeIds = Object.keys(staffProductivityMap);
        const staffProductivity = await Promise.all(
          assigneeIds.map(async (assigneeId) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", assigneeId)
              .single();

            const stats = staffProductivityMap[assigneeId];
            const avgTime =
              stats.count > 0 ? stats.totalTime / stats.count : 0;

            return {
              staff:
                profile
                  ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                  : "Unknown",
              completed: stats.completed,
              avgTime: avgTime,
            };
          }),
        );

        // Team Insights
        const mostEfficientStaff =
          staffProductivity.length > 0
            ? staffProductivity.reduce((prev, current) =>
                prev.avgTime < current.avgTime ? prev : current,
              )
            : { staff: "N/A", avgTime: 0 };

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

        const mostOverdueName = mostOverdueTasksBy[0]
          ? await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", mostOverdueTasksBy[0])
              .single()
              .then(({ data }) =>
                data
                  ? `${data.first_name || ""} ${data.last_name || ""}`.trim()
                  : "Unknown",
              )
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
        const calculatedData = {
          filters: emptyTaskAnalyticsData.filters,
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
            tasksReassignedOften: {
              count: 0, // Would need to track reassignments
              percentage: 0,
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
            weekendsWithNoProgress: {
              count: 0, // Would need more complex calculation
              percentage: 0,
            },
          },
        };

        setAnalyticsData(calculatedData);
        console.log("Task analytics data loaded:", calculatedData.performanceSummary);
      } catch (error) {
        console.error("Error fetching task analytics:", error);
        // Set empty/zero data on error instead of hardcoded values
        setAnalyticsData({
          ...emptyTaskAnalyticsData,
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
            tasksReassignedOften: { count: 0, percentage: 0 },
            highPriorityOverdue: { count: 0, percentage: 0 },
            weekendsWithNoProgress: { count: 0, percentage: 0 },
          },
        });
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
