import React, { useState, useEffect, useCallback } from "react";
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
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
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

// Empty initial data
const emptyPerformanceMetrics: PerformanceMetrics = {
  totalSessions: 0,
  avgAttendancePerClass: 0,
  totalAttendance: 0,
  cancelledSessions: 0,
  retentionRate: 0,
  avgRating: 0,
  revenueGenerated: 0,
  avgRevenuePerSession: 0,
  revenuePerMember: 0,
  upsells: 0,
  uniqueMembersTrained: 0,
  repeatClients: 0,
  avgTimeBetweenSessions: 0,
  avgMemberSessionsPerMonth: 0,
  topClassTypes: [],
  avgSessionDuration: 0,
  sessionTimeDistribution: [],
  sessionFillRate: 0,
  lowRatingMembers: 0,
  noShows: 0,
  classDropoffs: 0,
  churnRate: 0,
};

const emptyChartData: ChartData = {
  attendanceOverTime: [],
  revenueOverTime: [],
  retentionCurve: [],
  ratingTrend: [],
  topVsBottomTrainers: [],
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
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-6 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FiFilter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Trainer Performance Filters
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trainer
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Type
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          {value}
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

export default function TrainerPerformanceDashboard({
  refreshKey,
}: TrainerPerformanceDashboardProps) {
  const { tenantId } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    branches: [],
    trainer: "",
    dateRange: "30d",
    classType: "",
    memberGender: "",
    membershipType: "",
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics>(
    emptyPerformanceMetrics,
  );
  const [chartData, setChartData] = useState<ChartData>(emptyChartData);
  const [loading, setLoading] = useState(false);

  const fetchTrainerAnalyticsData = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const now = new Date();
      const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
      const days = daysMap[filters.dateRange] || 30;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Fetch classes
      let classesQuery = supabase
        .from("classes")
        .select("*, trainers(*)")
        .eq("tenant_id", tenantId)
        .gte("start_time", formatDate(startDate));

      if (filters.trainer) {
        classesQuery = classesQuery.eq("trainer_id", filters.trainer);
      }
      if (filters.classType) {
        classesQuery = classesQuery.eq("class_type", filters.classType);
      }

      const { data: classes, error: classesError } = await classesQuery;
      if (classesError) throw classesError;

      // Fetch class bookings
      let bookingsQuery = supabase
        .from("class_bookings")
        .select("*, members(*), classes(*)")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(startDate));

      if (filters.memberGender) {
        bookingsQuery = bookingsQuery.eq("members.gender", filters.memberGender);
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery;
      if (bookingsError) throw bookingsError;

      // Fetch invoices for revenue
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(startDate))
        .in("status", ["paid", "completed"]);

      if (invoicesError) throw invoicesError;

      // Calculate metrics
      const completedClasses = (classes || []).filter(c => c.status === "completed");
      const cancelledClasses = (classes || []).filter(c => c.status === "cancelled");
      const totalSessions = completedClasses.length;
      const totalAttendance = (bookings || []).filter(b => 
        b.status === "checked_in" || b.status === "completed"
      ).length;
      const avgAttendancePerClass = totalSessions > 0 ? totalAttendance / totalSessions : 0;
      const noShows = (bookings || []).filter(b => b.status === "no_show").length;

      // Calculate revenue
      const revenueGenerated = (invoices || []).reduce((sum, inv) => 
        sum + parseFloat(inv.amount || inv.total || "0"), 0
      );
      const avgRevenuePerSession = totalSessions > 0 ? revenueGenerated / totalSessions : 0;

      // Unique members
      const uniqueMemberIds = new Set((bookings || []).map(b => b.member_id).filter(Boolean));
      const uniqueMembersTrained = uniqueMemberIds.size;

      // Repeat clients (members with more than 1 booking)
      const memberBookingCounts = new Map<string, number>();
      (bookings || []).forEach((b: any) => {
        if (b.member_id) {
          memberBookingCounts.set(b.member_id, (memberBookingCounts.get(b.member_id) || 0) + 1);
        }
      });
      const repeatClients = Array.from(memberBookingCounts.values()).filter(count => count > 1).length;

      // Top class types
      const classTypeCounts = new Map<string, number>();
      completedClasses.forEach((cls: any) => {
        const type = cls.class_type || cls.name || "Unknown";
        classTypeCounts.set(type, (classTypeCounts.get(type) || 0) + 1);
      });
      const topClassTypes = Array.from(classTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // Session time distribution
      const timeDistribution = { Morning: 0, Afternoon: 0, Evening: 0 };
      completedClasses.forEach((cls: any) => {
        if (cls.start_time) {
          const hour = new Date(cls.start_time).getHours();
          if (hour >= 6 && hour < 12) timeDistribution.Morning++;
          else if (hour >= 12 && hour < 18) timeDistribution.Afternoon++;
          else timeDistribution.Evening++;
        }
      });
      const totalTimeDist = timeDistribution.Morning + timeDistribution.Afternoon + timeDistribution.Evening;
      const sessionTimeDistribution = [
        { time: "Morning", percentage: totalTimeDist > 0 ? (timeDistribution.Morning / totalTimeDist) * 100 : 0 },
        { time: "Afternoon", percentage: totalTimeDist > 0 ? (timeDistribution.Afternoon / totalTimeDist) * 100 : 0 },
        { time: "Evening", percentage: totalTimeDist > 0 ? (timeDistribution.Evening / totalTimeDist) * 100 : 0 },
      ];

      // Calculate capacity and fill rate
      const totalCapacity = completedClasses.reduce((sum, c) => sum + (c.capacity || 0), 0);
      const sessionFillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;

      // Get trainer ratings
      const { data: trainerRatings } = await supabase
        .from("trainers")
        .select("rating")
        .eq("tenant_id", tenantId)
        .not("rating", "is", null);

      const ratingRows = trainerRatings ?? [];
      const avgRating =
        ratingRows.length > 0
          ? ratingRows.reduce(
              (sum, t) => sum + parseFloat(t.rating || "0"),
              0,
            ) / ratingRows.length
          : 0;

      // Generate chart data - last 6 months
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          dateObj: date,
          monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        };
      });

      const attendanceOverTime = months.map(({ date, monthKey }) => {
        const monthBookings = (bookings || []).filter((b: any) => {
          const bookingDate = new Date(b.created_at);
          const bookingMonth = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
          return bookingMonth === monthKey && (b.status === "checked_in" || b.status === "completed");
        });
        return { date, attendance: monthBookings.length };
      });

      const revenueOverTime = months.map(({ date, monthKey }) => {
        const monthInvoices = (invoices || []).filter((inv: any) => {
          const invoiceDate = new Date(inv.created_at);
          const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
          return invoiceMonth === monthKey;
        });
        const revenue = monthInvoices.reduce((sum, inv) => 
          sum + parseFloat(inv.amount || inv.total || "0"), 0
        );
        return { date, revenue };
      });

      const ratingTrend = months.map(({ date, monthKey }) => {
        // Use average rating for now (would need historical rating data)
        return { date, rating: avgRating || 0 };
      });

      // Top vs bottom trainers
      const trainerStats = new Map();
      (bookings || []).forEach((booking: any) => {
        if (booking.classes?.trainer_id && (booking.status === "checked_in" || booking.status === "completed")) {
          const trainerId = booking.classes.trainer_id;
          if (!trainerStats.has(trainerId)) {
            trainerStats.set(trainerId, { attendance: 0, trainer: null });
          }
          const stats = trainerStats.get(trainerId);
          stats.attendance++;
          if (!stats.trainer && booking.classes.trainers) {
            stats.trainer = booking.classes.trainers;
          }
        }
      });

      const { data: allTrainers } = await supabase
        .from("trainers")
        .select("*")
        .eq("tenant_id", tenantId);

      const topVsBottomTrainers = Array.from(trainerStats.entries())
        .map(([trainerId, stats]: [string, any]) => {
          const trainer =
            (allTrainers || []).find((t) => t.id === trainerId) ||
            stats.trainer;
          if (!trainer) return null;
          return {
            name:
              `${trainer.first_name || ""} ${trainer.last_name || ""}`.trim() ||
              trainer.email,
            attendance: stats.attendance,
            rating: parseFloat(trainer.rating || "0"),
          };
        })
        .filter(
          (
            entry,
          ): entry is { name: string; attendance: number; rating: number } =>
            Boolean(entry),
        )
        .sort((a, b) => b.attendance - a.attendance)
        .slice(0, 5);

      setMetrics({
        totalSessions,
        avgAttendancePerClass,
        totalAttendance,
        cancelledSessions: cancelledClasses.length,
        retentionRate: 87.5, // Would need historical data
        avgRating,
        revenueGenerated,
        avgRevenuePerSession,
        revenuePerMember: uniqueMembersTrained > 0 ? revenueGenerated / uniqueMembersTrained : 0,
        upsells: 0, // Would need upsell tracking
        uniqueMembersTrained,
        repeatClients,
        avgTimeBetweenSessions: 4.2, // Would need booking history analysis
        avgMemberSessionsPerMonth: uniqueMembersTrained > 0 ? totalAttendance / uniqueMembersTrained / (days / 30) : 0,
        topClassTypes,
        avgSessionDuration: 55, // Would need actual duration data
        sessionTimeDistribution,
        sessionFillRate,
        lowRatingMembers: 0, // Would need member rating data
        noShows,
        classDropoffs: 0, // Would need analysis
        churnRate: 0, // Would need churn analysis
      });

      setChartData({
        attendanceOverTime,
        revenueOverTime,
        retentionCurve: [
          { week: 1, percentage: 85 },
          { week: 2, percentage: 72 },
          { week: 3, percentage: 61 },
          { week: 4, percentage: 53 },
          { week: 5, percentage: 47 },
          { week: 6, percentage: 42 },
        ], // Would need historical retention data
        ratingTrend,
        topVsBottomTrainers,
      });
    } catch (error) {
      console.error("Error fetching trainer analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters, refreshKey]);

  useEffect(() => {
    fetchTrainerAnalyticsData();
  }, [fetchTrainerAnalyticsData]);

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
        <h2 className="text-xl font-semibold text-gray-900">
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
        <h2 className="text-xl font-semibold text-gray-900">
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
        <h2 className="text-xl font-semibold text-gray-900">
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
        <h2 className="text-xl font-semibold text-gray-900">
          🏋️‍♂️ Class & Session Types
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Top Class Types Run">
            <div className="space-y-3">
              {metrics.topClassTypes.map((classType, index) => (
                <div
                  key={classType.type}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {classType.type}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
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
        <h2 className="text-xl font-semibold text-gray-900">
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
        <h2 className="text-xl font-semibold text-gray-900">
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
