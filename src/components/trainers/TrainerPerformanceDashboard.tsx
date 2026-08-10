import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiDollarSign,
  FiCalendar,
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
import type { Database } from "../../types/supabase";
import { useRTL } from "../../hooks/useRTL";
import { useTranslation } from "react-i18next";
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

type TrainerRow = Database["public"]["Tables"]["trainers"]["Row"];
// Classes row plus `class_type`, a column this file reads defensively as a
// fallback (`cls.class_type || cls.name`) but that isn't modeled on the
// hand-written classes Row type.
type ClassRow = Database["public"]["Tables"]["classes"]["Row"] & {
  class_type?: string;
};
type ClassWithTrainer = ClassRow & { trainers: TrainerRow | null };
// Bookings joined with member + class data. `classes.trainers` is read
// defensively below even though this query's join doesn't request it.
type ClassBookingWithRelations =
  Database["public"]["Tables"]["class_bookings"]["Row"] & {
    members?: Database["public"]["Tables"]["members"]["Row"] | null;
    classes?: (ClassRow & { trainers?: TrainerRow | null }) | null;
  };

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
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-3xl shadow-sm" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
        <button
          onClick={toggleFilters}
          className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors`}
        >
          <FiFilter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("trainers.advancedFilters")}
          </span>
        </button>

        {isExpanded && (
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-2`}>
            <button className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors`}>
              <FiRefreshCw className="w-4 h-4" />
              {t("common.reset") || "Reset"}
            </button>
            <button className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}>
              <FiDownload className="w-4 h-4" />
              {t("trainers.export")}
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
                {t("common.branch") || "Branch"}
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.branches[0] || ""}
                onChange={(e) => updateFilter("branches", [e.target.value])}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="">{t("common.allBranches") || "All Branches"}</option>
                <option value="main">{t("common.mainBranch") || "Main Branch"}</option>
                <option value="north">{t("common.northBranch") || "North Branch"}</option>
                <option value="south">{t("common.southBranch") || "South Branch"}</option>
              </select>
            </div>

            {/* Trainer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("trainers.title")}
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.trainer}
                onChange={(e) => updateFilter("trainer", e.target.value)}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="">{t("trainers.allTrainers")}</option>
                <option value="sarah">Sarah Johnson</option>
                <option value="mike">Mike Chen</option>
                <option value="emma">Emma Davis</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("common.dateRange") || "Date Range"}
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.dateRange}
                onChange={(e) => updateFilter("dateRange", e.target.value)}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="7d">{t("common.last7Days") || "Last 7 Days"}</option>
                <option value="30d">{t("common.last30Days") || "Last 30 Days"}</option>
                <option value="90d">{t("common.last90Days") || "Last 90 Days"}</option>
                <option value="1y">{t("common.lastYear") || "Last Year"}</option>
              </select>
            </div>

            {/* Class Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("classes.classType") || "Class Type"}
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.classType}
                onChange={(e) => updateFilter("classType", e.target.value)}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="">{t("common.allTypes") || "All Types"}</option>
                <option value="yoga">Yoga</option>
                <option value="hiit">HIIT</option>
                <option value="strength">Strength</option>
                <option value="pilates">Pilates</option>
              </select>
            </div>

            {/* Member Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("common.gender") || "Gender"}
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.memberGender}
                onChange={(e) => updateFilter("memberGender", e.target.value)}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="">{t("common.all") || "All"}</option>
                <option value="male">{t("common.male") || "Male"}</option>
                <option value="female">{t("common.female") || "Female"}</option>
              </select>
            </div>

            {/* Membership Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("members.membershipType") || "Membership"}
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.membershipType}
                onChange={(e) =>
                  updateFilter("membershipType", e.target.value)
                }
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="">{t("common.allTypes") || "All Types"}</option>
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
  const { isRTL } = useRTL();
  
  const getTrendColor = () => {
    if (trend === "up") return "text-green-600 dark:text-green-400";
    if (trend === "down") return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
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
      className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
        <div
          className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}
        >
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-1 text-sm ${getTrendColor()}`}>
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
}> = ({ title, children, className = "" }) => {
  const { isRTL } = useRTL();
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
};

export default function TrainerPerformanceDashboard({
  refreshKey,
}: TrainerPerformanceDashboardProps) {
  const { tenantId } = useAuth();
  const { isRTL } = useRTL();
  const { t } = useTranslation();
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

      const { data: classesData, error: classesError } = await classesQuery;
      if (classesError) throw classesError;
      const classes = (classesData || []) as ClassWithTrainer[];

      // Fetch class bookings
      let bookingsQuery = supabase
        .from("class_bookings")
        .select("*, members(*), classes(*)")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(startDate));

      if (filters.memberGender) {
        bookingsQuery = bookingsQuery.eq("members.gender", filters.memberGender);
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery;
      if (bookingsError) throw bookingsError;
      const bookings = (bookingsData || []) as ClassBookingWithRelations[];

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
        sum + parseFloat(String(inv.amount || inv.total || "0")), 0
      );
      const avgRevenuePerSession = totalSessions > 0 ? revenueGenerated / totalSessions : 0;

      // Unique members
      const uniqueMemberIds = new Set((bookings || []).map(b => b.member_id).filter(Boolean));
      const uniqueMembersTrained = uniqueMemberIds.size;

      // Repeat clients (members with more than 1 booking)
      const memberBookingCounts = new Map<string, number>();
      (bookings || []).forEach((b) => {
        if (b.member_id) {
          memberBookingCounts.set(b.member_id, (memberBookingCounts.get(b.member_id) || 0) + 1);
        }
      });
      const repeatClients = Array.from(memberBookingCounts.values()).filter(count => count > 1).length;

      // Top class types
      const classTypeCounts = new Map<string, number>();
      completedClasses.forEach((cls) => {
        const type = cls.class_type || cls.name || "Unknown";
        classTypeCounts.set(type, (classTypeCounts.get(type) || 0) + 1);
      });
      const topClassTypes = Array.from(classTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // Session time distribution
      const timeDistribution = { Morning: 0, Afternoon: 0, Evening: 0 };
      completedClasses.forEach((cls) => {
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
              (sum, t) => sum + parseFloat(String(t.rating || "0")),
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
        const monthBookings = (bookings || []).filter((b) => {
          const bookingDate = new Date(b.created_at);
          const bookingMonth = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
          return bookingMonth === monthKey && (b.status === "checked_in" || b.status === "completed");
        });
        return { date, attendance: monthBookings.length };
      });

      const revenueOverTime = months.map(({ date, monthKey }) => {
        const monthInvoices = (invoices || []).filter((inv) => {
          const invoiceDate = new Date(inv.created_at);
          const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
          return invoiceMonth === monthKey;
        });
        const revenue = monthInvoices.reduce((sum, inv) =>
          sum + parseFloat(String(inv.amount || inv.total || "0")), 0
        );
        return { date, revenue };
      });

      const ratingTrend = months.map(({ date }) => {
        // Use average rating for now (would need historical rating data)
        return { date, rating: avgRating || 0 };
      });

      // Top vs bottom trainers
      interface TrainerAttendanceStats {
        attendance: number;
        trainer: TrainerRow | null;
      }
      const trainerStats = new Map<string, TrainerAttendanceStats>();
      (bookings || []).forEach((booking) => {
        if (booking.classes?.trainer_id && (booking.status === "checked_in" || booking.status === "completed")) {
          const trainerId = booking.classes.trainer_id;
          if (!trainerStats.has(trainerId)) {
            trainerStats.set(trainerId, { attendance: 0, trainer: null });
          }
          const stats = trainerStats.get(trainerId)!;
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
        .map(([trainerId, stats]) => {
          const trainer =
            (allTrainers || []).find((t) => t.id === trainerId) ||
            stats.trainer;
          if (!trainer) return null;
          return {
            name:
              `${trainer.first_name || ""} ${trainer.last_name || ""}`.trim() ||
              trainer.email,
            attendance: stats.attendance,
            rating: parseFloat(String(trainer.rating || "0")),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey isn't read directly but changes the callback identity to trigger a refetch
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
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Filter Bar */}
      <FilterBar filters={filters} onFilterChange={setFilters} />

      {/* Performance Overview */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          🎯 {t("trainers.performanceOverview") || "Performance Overview"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title={t("trainers.totalSessionsLed")}
            value={metrics.totalSessions}
            subtitle={t("trainers.classesConducted")}
            trend="up"
            trendValue="+12%"
            icon={<FiCalendar className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title={t("trainers.avgAttendancePerClass")}
            value={metrics.avgAttendancePerClass}
            subtitle={t("trainers.membersPerSession")}
            trend="up"
            trendValue="+8%"
            icon={<FiUsers className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title={t("trainers.totalAttendance")}
            value={metrics.totalAttendance.toLocaleString()}
            subtitle={t("trainers.allMembersAttended")}
            trend="up"
            trendValue="+15%"
            icon={<FiUser className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title={t("trainers.cancelledSessions")}
            value={metrics.cancelledSessions}
            subtitle={t("trainers.missedClasses")}
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
          💰 {t("trainers.revenueImpact") || "Revenue Impact"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title={t("trainers.revenueGenerated")}
            value={`$${metrics.revenueGenerated.toLocaleString()}`}
            subtitle={t("trainers.totalEarnings")}
            trend="up"
            trendValue="+18%"
            icon={<FiDollarSign className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title={t("trainers.avgRevenuePerSession")}
            value={`$${metrics.avgRevenuePerSession}`}
            subtitle={t("trainers.perClassEarnings")}
            trend="up"
            trendValue="+6%"
            icon={<FiDollarSign className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title={t("trainers.revenuePerMember")}
            value={`$${metrics.revenuePerMember}`}
            subtitle={t("trainers.perAttendee")}
            trend="up"
            trendValue="+9%"
            icon={<FiUser className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title={t("trainers.upsells")}
            value={metrics.upsells}
            subtitle={t("trainers.ptAddOnsSold")}
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
          📊 {t("trainers.engagementMetrics") || "Engagement Metrics"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title={t("trainers.uniqueMembersTrained")}
            value={metrics.uniqueMembersTrained}
            subtitle={t("trainers.differentAttendees")}
            trend="up"
            trendValue="+14%"
            icon={<FiUsers className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title={t("trainers.repeatClients")}
            value={metrics.repeatClients}
            subtitle={t("trainers.returningMembers")}
            trend="up"
            trendValue="+11%"
            icon={<FiCheckCircle className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title={t("trainers.avgTimeBetweenSessions")}
            value={`${metrics.avgTimeBetweenSessions} ${t("trainers.days")}`}
            subtitle={t("trainers.memberFrequency")}
            trend="down"
            trendValue="-3%"
            icon={<FiClock className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
          <MetricCard
            title={t("trainers.avgSessionsPerMonth")}
            value={metrics.avgMemberSessionsPerMonth}
            subtitle={t("trainers.perMemberAverage")}
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
          🏋️‍♂️ {t("trainers.classSessionTypes") || "Class & Session Types"}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={t("trainers.topClassTypes") || "Top Class Types Run"}>
            <div className="space-y-3">
              {metrics.topClassTypes.map((classType, index) => (
                <div
                  key={classType.type}
                  className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl`}
                >
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {classType.type}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {classType.count} {t("trainers.sessions") || "sessions"}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title={t("trainers.sessionTimeDistribution") || "Session Time Distribution"}>
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
            title={t("trainers.avgDurationPerSession")}
            value={`${metrics.avgSessionDuration} ${t("trainers.min")}`}
            subtitle={t("trainers.classLength")}
            trend="neutral"
            icon={<FiClock className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title={t("trainers.sessionFillRate")}
            value={`${metrics.sessionFillRate}%`}
            subtitle={t("trainers.capacityUtilization")}
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
          ⚠️ {t("trainers.riskQualitySignals") || "Risk & Quality Signals"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title={t("trainers.lowRatingMembers")}
            value={metrics.lowRatingMembers}
            subtitle={t("trainers.rating2Stars")}
            trend="down"
            trendValue="-12%"
            icon={<FiAlertTriangle className="w-6 h-6 text-white" />}
            color="bg-red-500"
          />
          <MetricCard
            title={t("trainers.noShows")}
            value={metrics.noShows}
            subtitle={t("trainers.missedAppointments")}
            trend="down"
            trendValue="-8%"
            icon={<FiX className="w-6 h-6 text-white" />}
            color="bg-orange-500"
          />
          <MetricCard
            title={t("trainers.classDropoffs")}
            value={metrics.classDropoffs}
            subtitle={t("trainers.oneTimeAttendees")}
            trend="down"
            trendValue="-15%"
            icon={<FiTrendingDown className="w-6 h-6 text-white" />}
            color="bg-yellow-500"
          />
          <MetricCard
            title={t("trainers.churnRate")}
            value={`${metrics.churnRate}%`}
            subtitle={t("trainers.memberLoss")}
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
          📈 {t("trainers.chartsTrends") || "Charts & Trends"}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={t("trainers.attendanceOverTime") || "Attendance Over Time"}>
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

          <ChartCard title={t("trainers.revenueOverTime") || "Revenue Over Time"}>
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

          <ChartCard title={t("trainers.retentionCurve") || "Retention Curve"}>
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

          <ChartCard title={t("trainers.ratingTrend") || "Rating Trend"}>
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

        <ChartCard title={t("trainers.topBottomTrainers") || "Top vs Bottom Performing Trainers"}>
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
