import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiDollarSign,
  FiStar,
  FiCalendar,
  FiTarget,
  FiActivity,
  FiFilter,
  FiClock,
  FiUser,
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiDownload,
  FiRefreshCw,
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

interface TrainerPerformanceDashboardProps {
  refreshKey: number;
}

interface FilterState {
  branches: string[];
  trainer: string;
  dateRange: string;
  classType: string;
  memberGender: string;
  membershipType: string;
}

interface PerformanceMetrics {
  totalSessions: number;
  avgAttendancePerClass: number;
  totalAttendance: number;
  cancelledSessions: number;
  retentionRate: number;
  avgRating: number;
  revenueGenerated: number;
  avgRevenuePerSession: number;
  revenuePerMember: number;
  upsells: number;
  uniqueMembersTrained: number;
  repeatClients: number;
  avgTimeBetweenSessions: number;
  avgMemberSessionsPerMonth: number;
  topClassTypes: Array<{ type: string; count: number }>;
  avgSessionDuration: number;
  sessionTimeDistribution: Array<{ time: string; percentage: number }>;
  sessionFillRate: number;
  lowRatingMembers: number;
  noShows: number;
  classDropoffs: number;
  churnRate: number;
}

interface ChartData {
  attendanceOverTime: Array<{ date: string; attendance: number }>;
  revenueOverTime: Array<{ date: string; revenue: number }>;
  retentionCurve: Array<{ week: number; percentage: number }>;
  ratingTrend: Array<{ date: string; rating: number }>;
  topVsBottomTrainers: Array<{
    name: string;
    attendance: number;
    rating: number;
  }>;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

// Mock data for the dashboard
const mockPerformanceMetrics: PerformanceMetrics = {
  totalSessions: 342,
  avgAttendancePerClass: 8.3,
  totalAttendance: 2847,
  cancelledSessions: 23,
  retentionRate: 87.5,
  avgRating: 4.6,
  revenueGenerated: 125000,
  avgRevenuePerSession: 365.5,
  revenuePerMember: 890,
  upsells: 156,
  uniqueMembersTrained: 89,
  repeatClients: 67,
  avgTimeBetweenSessions: 4.2,
  avgMemberSessionsPerMonth: 3.8,
  topClassTypes: [
    { type: "Yoga Flow", count: 45 },
    { type: "HIIT Training", count: 38 },
    { type: "Strength Training", count: 32 },
    { type: "Pilates", count: 28 },
  ],
  avgSessionDuration: 55,
  sessionTimeDistribution: [
    { time: "Morning", percentage: 35 },
    { time: "Afternoon", percentage: 45 },
    { time: "Evening", percentage: 20 },
  ],
  sessionFillRate: 76.2,
  lowRatingMembers: 12,
  noShows: 34,
  classDropoffs: 23,
  churnRate: 8.5,
};

const mockChartData: ChartData = {
  attendanceOverTime: [
    { date: "2024-01", attendance: 245 },
    { date: "2024-02", attendance: 267 },
    { date: "2024-03", attendance: 289 },
    { date: "2024-04", attendance: 312 },
    { date: "2024-05", attendance: 298 },
    { date: "2024-06", attendance: 325 },
  ],
  revenueOverTime: [
    { date: "2024-01", revenue: 18500 },
    { date: "2024-02", revenue: 20100 },
    { date: "2024-03", revenue: 22400 },
    { date: "2024-04", revenue: 23800 },
    { date: "2024-05", revenue: 22100 },
    { date: "2024-06", revenue: 24500 },
  ],
  retentionCurve: [
    { week: 1, percentage: 85 },
    { week: 2, percentage: 72 },
    { week: 3, percentage: 61 },
    { week: 4, percentage: 53 },
    { week: 5, percentage: 47 },
    { week: 6, percentage: 42 },
  ],
  ratingTrend: [
    { date: "2024-01", rating: 4.4 },
    { date: "2024-02", rating: 4.5 },
    { date: "2024-03", rating: 4.6 },
    { date: "2024-04", rating: 4.7 },
    { date: "2024-05", rating: 4.6 },
    { date: "2024-06", rating: 4.8 },
  ],
  topVsBottomTrainers: [
    { name: "Sarah Johnson", attendance: 456, rating: 4.8 },
    { name: "Mike Chen", attendance: 389, rating: 4.6 },
    { name: "Emma Davis", attendance: 312, rating: 4.7 },
    { name: "David Kim", attendance: 234, rating: 4.3 },
    { name: "Lisa Wang", attendance: 198, rating: 4.2 },
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
            Trainer Performance Filters
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

      {/* Filter Bar */}
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

            {/* Trainer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trainer
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                value={filters.trainer}
                onChange={(e) => updateFilter("trainer", e.target.value)}
              >
                <option value="">All Trainers</option>
                <option value="sarah">Sarah Johnson</option>
                <option value="mike">Mike Chen</option>
                <option value="emma">Emma Davis</option>
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
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>

            {/* Class Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Class Type
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                value={filters.classType}
                onChange={(e) => updateFilter("classType", e.target.value)}
              >
                <option value="">All Types</option>
                <option value="yoga">Yoga</option>
                <option value="hiit">HIIT</option>
                <option value="strength">Strength</option>
                <option value="pilates">Pilates</option>
              </select>
            </div>

            {/* Member Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                value={filters.memberGender}
                onChange={(e) => updateFilter("memberGender", e.target.value)}
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
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
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
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
}> = ({ title, value, subtitle, trend, trendValue, icon, color }) => {
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
          {value}
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

export default function TrainerPerformanceDashboard({
  refreshKey,
}: TrainerPerformanceDashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    branches: [],
    trainer: "",
    dateRange: "30d",
    classType: "",
    memberGender: "",
    membershipType: "",
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics>(
    mockPerformanceMetrics,
  );
  const [chartData, setChartData] = useState<ChartData>(mockChartData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrainerAnalyticsData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    };

    fetchTrainerAnalyticsData();
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

      {/* Performance Overview */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          🎯 Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Sessions Led"
            value={metrics.totalSessions}
            subtitle="Classes conducted"
            trend="up"
            trendValue="+12%"
            icon={<FiCalendar className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Avg. Attendance / Class"
            value={metrics.avgAttendancePerClass}
            subtitle="Members per session"
            trend="up"
            trendValue="+8%"
            icon={<FiUsers className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Total Attendance"
            value={metrics.totalAttendance.toLocaleString()}
            subtitle="All members attended"
            trend="up"
            trendValue="+15%"
            icon={<FiUser className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Cancelled Sessions"
            value={metrics.cancelledSessions}
            subtitle="Missed classes"
            trend="down"
            trendValue="-5%"
            icon={<FiX className="w-6 h-6 text-white" />}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Revenue Impact */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          💰 Revenue Impact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Revenue Generated"
            value={`$${metrics.revenueGenerated.toLocaleString()}`}
            subtitle="Total earnings"
            trend="up"
            trendValue="+18%"
            icon={<FiDollarSign className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Avg. Revenue / Session"
            value={`$${metrics.avgRevenuePerSession}`}
            subtitle="Per class earnings"
            trend="up"
            trendValue="+6%"
            icon={<FiDollarSign className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Revenue / Member"
            value={`$${metrics.revenuePerMember}`}
            subtitle="Per attendee"
            trend="up"
            trendValue="+9%"
            icon={<FiUser className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Upsells"
            value={metrics.upsells}
            subtitle="PT add-ons sold"
            trend="up"
            trendValue="+22%"
            icon={<FiTrendingUp className="w-6 h-6 text-white" />}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📊 Engagement Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Unique Members Trained"
            value={metrics.uniqueMembersTrained}
            subtitle="Different attendees"
            trend="up"
            trendValue="+14%"
            icon={<FiUsers className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Repeat Clients"
            value={metrics.repeatClients}
            subtitle="Returning members"
            trend="up"
            trendValue="+11%"
            icon={<FiCheckCircle className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Avg. Time Between Sessions"
            value={`${metrics.avgTimeBetweenSessions} days`}
            subtitle="Member frequency"
            trend="down"
            trendValue="-3%"
            icon={<FiClock className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Avg. Sessions / Month"
            value={metrics.avgMemberSessionsPerMonth}
            subtitle="Per member average"
            trend="up"
            trendValue="+7%"
            icon={<FiCalendar className="w-6 h-6 text-white" />}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Class & Session Types */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          🏋️‍♂️ Class & Session Types
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Top Class Types Run">
            <div className="space-y-3">
              {metrics.topClassTypes.map((classType, index) => (
                <div
                  key={classType.type}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {classType.type}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {classType.count} sessions
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Session Time Distribution">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={metrics.sessionTimeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="percentage"
                  label={({ time, percentage }) => `${time}: ${percentage}%`}
                >
                  {metrics.sessionTimeDistribution.map((entry, index) => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            title="Avg. Duration per Session"
            value={`${metrics.avgSessionDuration} min`}
            subtitle="Class length"
            trend="neutral"
            icon={<FiClock className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Session Fill Rate"
            value={`${metrics.sessionFillRate}%`}
            subtitle="Capacity utilization"
            trend="up"
            trendValue="+4%"
            icon={<FiBarChart className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
        </div>
      </div>

      {/* Risk & Quality Signals */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          ⚠️ Risk & Quality Signals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Low Rating Members"
            value={metrics.lowRatingMembers}
            subtitle="Rating ≤ 2 stars"
            trend="down"
            trendValue="-12%"
            icon={<FiAlertTriangle className="w-6 h-6 text-white" />}
            color="bg-red-500"
          />
          <MetricCard
            title="No-Shows"
            value={metrics.noShows}
            subtitle="Missed appointments"
            trend="down"
            trendValue="-8%"
            icon={<FiX className="w-6 h-6 text-white" />}
            color="bg-orange-500"
          />
          <MetricCard
            title="Class Drop-offs"
            value={metrics.classDropoffs}
            subtitle="One-time attendees"
            trend="down"
            trendValue="-15%"
            icon={<FiTrendingDown className="w-6 h-6 text-white" />}
            color="bg-yellow-500"
          />
          <MetricCard
            title="Churn Rate"
            value={`${metrics.churnRate}%`}
            subtitle="Member loss"
            trend="down"
            trendValue="-3%"
            icon={<FiActivity className="w-6 h-6 text-white" />}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📈 Charts & Trends
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Attendance Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.attendanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#3B82F6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenue Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Retention Curve">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.retentionCurve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, "Retention"]} />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Rating Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.ratingTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[4, 5]} />
                <Tooltip formatter={(value) => [value, "Rating"]} />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#F59E0B"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Top vs Bottom Performing Trainers">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.topVsBottomTrainers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attendance" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rating" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
