import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiTarget,
  FiActivity,
  FiPieChart,
  FiBarChart,
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiAlertCircle,
  FiZap,
  FiAward,
  FiStar,
  FiTrendingDown,
  FiEye,
  FiHeart,
  FiShield,
  FiPlay,
  FiPause,
  FiCheck,
  FiMinus,
  FiPlus,
  FiBookmark,
  FiBookOpen,
  FiCalendar as FiCalendarIcon,
  FiClock as FiClockIcon,
  FiMapPin as FiMapPinIcon,
  FiUser as FiUserIcon,
  FiUsers as FiUsersIcon,
  FiDollarSign as FiDollarSignIcon,
  FiTrendingUp as FiTrendingUpIcon,
  FiTrendingDown as FiTrendingDownIcon,
  FiActivity as FiActivityIcon,
  FiTarget as FiTargetIcon,
  FiAward as FiAwardIcon,
  FiStar as FiStarIcon,
  FiHeart as FiHeartIcon,
  FiEye as FiEyeIcon,
  FiShield as FiShieldIcon,
  FiPlay as FiPlayIcon,
  FiPause as FiPauseIcon,
  FiX as FiXIcon,
  FiCheck as FiCheckIcon,
  FiMinus as FiMinusIcon,
  FiPlus as FiPlusIcon,
  FiBookmark as FiBookmarkIcon,
  FiBookOpen as FiBookOpenIcon,
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
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
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

// Mock data for the productivity insights dashboard
const mockTaskAnalyticsData = {
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
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FiFilter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Task Analytics Filters
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
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.branch}
                onChange={(e) =>
                  setFilters({ ...filters, branch: e.target.value })
                }
              >
                <option value="all">All Branches</option>
                <option value="main">Main Branch</option>
                <option value="north">North Branch</option>
                <option value="south">South Branch</option>
                <option value="east">East Branch</option>
              </select>

              {/* Assigned To */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.assignedTo}
                onChange={(e) =>
                  setFilters({ ...filters, assignedTo: e.target.value })
                }
              >
                <option value="all">All Staff</option>
                <option value="sarah">Sarah Johnson</option>
                <option value="mike">Mike Chen</option>
                <option value="emma">Emma Davis</option>
                <option value="alex">Alex Rodriguez</option>
                <option value="lisa">Lisa Thompson</option>
              </select>

              {/* Date Range */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
              >
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="last6months">Last 6 Months</option>
                <option value="lastyear">Last Year</option>
              </select>

              {/* Status */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="overdue">Overdue</option>
              </select>

              {/* Priority */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Performance Summary Cards - Updated to match other analytics tabs
const PerformanceSummaryCards: React.FC = () => {
  const { performanceSummary } = mockTaskAnalyticsData;

  const cards = [
    {
      title: "Total Tasks Created",
      value: performanceSummary.totalTasksCreated.toLocaleString(),
      subtitle: "Tasks created in period",
      icon: FiTarget,
      color: "blue",
      trend: { value: 12.3, isPositive: true },
    },
    {
      title: "Tasks Completed",
      value: performanceSummary.tasksCompleted.toLocaleString(),
      subtitle: "Tasks completed in period",
      icon: FiCheckCircle,
      color: "green",
      trend: { value: 8.7, isPositive: true },
    },
    {
      title: "Completion Rate",
      value: `${performanceSummary.completionRate}%`,
      subtitle: "Average completion rate",
      icon: FiTrendingUp,
      color: "purple",
      trend: { value: 2.1, isPositive: true },
    },
    {
      title: "Avg. Time to Complete",
      value: `${performanceSummary.avgTimeToComplete} days`,
      subtitle: "Average completion time",
      icon: FiClock,
      color: "orange",
      trend: { value: 5.2, isPositive: false },
    },
    {
      title: "Overdue Tasks",
      value: performanceSummary.overdueTasks.toLocaleString(),
      subtitle: "Tasks past due date",
      icon: FiAlertTriangle,
      color: "red",
      trend: { value: 15.4, isPositive: false },
    },
    {
      title: "Avg. Tasks Per Day",
      value: performanceSummary.avgTasksPerDay.toFixed(1),
      subtitle: "Daily task average",
      icon: FiActivity,
      color: "indigo",
      trend: { value: 3.8, isPositive: true },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-2xl bg-${card.color}-50 flex items-center justify-center`}
            >
              <card.icon className={`w-6 h-6 text-${card.color}-600`} />
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                card.trend.isPositive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
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
            <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
            <p className="text-sm text-gray-600 mt-1">{card.title}</p>
            <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Chart Components
const TasksOverTimeChart: React.FC = () => {
  const data = mockTaskAnalyticsData.charts.tasksOverTime;

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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Tasks Over Time
      </h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

const CompletionTrendChart: React.FC = () => {
  const data = mockTaskAnalyticsData.charts.completionTrend;

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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.1)" },
        ticks: { color: "rgba(0, 0, 0, 0.6)" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "rgba(0, 0, 0, 0.6)" },
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 Completion Trend
      </h3>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

const StatusBreakdownChart: React.FC = () => {
  const data = mockTaskAnalyticsData.charts.statusBreakdown;

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
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🥧 Task Status Breakdown
      </h3>
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

const PriorityDistributionChart: React.FC = () => {
  const data = mockTaskAnalyticsData.charts.priorityDistribution;

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
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🎯 Priority Distribution
      </h3>
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

const StaffProductivityChart: React.FC = () => {
  const data = mockTaskAnalyticsData.charts.staffProductivity;

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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.1)" },
        ticks: { color: "rgba(0, 0, 0, 0.6)" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "rgba(0, 0, 0, 0.6)" },
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        👥 Staff Productivity
      </h3>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

// Team & Individual Insights - Updated to match other analytics tabs
const TeamInsightsCards: React.FC = () => {
  const { teamInsights } = mockTaskAnalyticsData;

  const insights = [
    {
      title: "Most Efficient Staff",
      value: teamInsights.mostEfficientStaff.name,
      subtitle: `${teamInsights.mostEfficientStaff.avgTime} days avg`,
      icon: FiAward,
      color: "green",
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Most Overdue Tasks By",
      value: teamInsights.mostOverdueTasksBy.name,
      subtitle: `${teamInsights.mostOverdueTasksBy.count} overdue tasks`,
      icon: FiAlertTriangle,
      color: "red",
      trend: { value: 8.3, isPositive: false },
    },
    {
      title: "Most Tasks Completed",
      value: teamInsights.mostTasksCompleted.name,
      subtitle: `${teamInsights.mostTasksCompleted.count} tasks completed`,
      icon: FiCheckCircle,
      color: "blue",
      trend: { value: 15.2, isPositive: true },
    },
    {
      title: "Longest Pending Tasks",
      value: teamInsights.longestPendingTasks.count,
      subtitle: `${teamInsights.longestPendingTasks.avgDays} days avg`,
      icon: FiClock,
      color: "orange",
      trend: { value: 5.7, isPositive: false },
    },
    {
      title: "Tasks With No Updates",
      value: teamInsights.tasksWithNoUpdates.count,
      subtitle: `${teamInsights.tasksWithNoUpdates.percentage}% of total`,
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
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-2xl bg-${insight.color}-50 flex items-center justify-center`}
            >
              <insight.icon className={`w-6 h-6 text-${insight.color}-600`} />
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                insight.trend.isPositive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
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
            <h3 className="text-xl font-bold text-gray-900">{insight.value}</h3>
            <p className="text-sm text-gray-600 mt-1">{insight.title}</p>
            <p className="text-xs text-gray-500 mt-1">{insight.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Risk & Bottleneck Indicators - Updated to match other analytics tabs
const RiskIndicatorsCards: React.FC = () => {
  const { riskIndicators } = mockTaskAnalyticsData;

  const risks = [
    {
      title: "Stuck Tasks",
      value: riskIndicators.stuckTasks.count,
      subtitle: `${riskIndicators.stuckTasks.percentage}% of total`,
      description: "No activity > 7 days",
      icon: FiAlertCircle,
      color: "red",
      trend: { value: 12.8, isPositive: false },
    },
    {
      title: "Tasks Reassigned Often",
      value: riskIndicators.tasksReassignedOften.count,
      subtitle: `${riskIndicators.tasksReassignedOften.percentage}% of total`,
      description: "Reassignment count > 2",
      icon: FiZap,
      color: "orange",
      trend: { value: 5.3, isPositive: false },
    },
    {
      title: "High Priority Overdue",
      value: riskIndicators.highPriorityOverdue.count,
      subtitle: `${riskIndicators.highPriorityOverdue.percentage}% of total`,
      description: "High priority + overdue",
      icon: FiAlertTriangle,
      color: "red",
      trend: { value: 18.2, isPositive: false },
    },
    {
      title: "Weekends with No Progress",
      value: riskIndicators.weekendsWithNoProgress.count,
      subtitle: `${riskIndicators.weekendsWithNoProgress.percentage}% of total`,
      description: "Gaps in completion trend",
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
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-2xl bg-${risk.color}-50 flex items-center justify-center`}
            >
              <risk.icon className={`w-6 h-6 text-${risk.color}-600`} />
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                risk.trend.isPositive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
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
            <h3 className="text-2xl font-bold text-gray-900">{risk.value}</h3>
            <p className="text-sm font-semibold text-gray-900">{risk.title}</p>
            <p className="text-xs text-gray-500 mt-1">{risk.subtitle}</p>
            <p className="text-xs text-gray-400 mt-1">{risk.description}</p>
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
  const [analyticsData, setAnalyticsData] = useState(mockTaskAnalyticsData);

  useEffect(() => {
    // In a real app, this would fetch data from an API
    const fetchTaskAnalytics = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAnalyticsData(mockTaskAnalyticsData);
    };

    fetchTaskAnalytics();
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AnalyticsFilters />

      {/* Performance Summary */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📊 Task Performance Summary
        </h2>
        <PerformanceSummaryCards />
      </div>

      {/* Visualizations */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📈 Visualizations
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksOverTimeChart />
          <CompletionTrendChart />
          <StatusBreakdownChart />
          <PriorityDistributionChart />
        </div>
        <StaffProductivityChart />
      </div>

      {/* Team & Individual Insights */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          🔍 Team & Individual Insights
        </h2>
        <TeamInsightsCards />
      </div>

      {/* Risk & Bottleneck Indicators */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          ⚠️ Risk & Bottleneck Indicators
        </h2>
        <RiskIndicatorsCards />
      </div>
    </div>
  );
};

export default SmartTaskAnalytics;
