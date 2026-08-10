import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiUsers,
  FiAlertTriangle,
  FiDollarSign,
  FiArrowUp,
  FiArrowDown,
  FiTarget,
  FiActivity,
  FiCreditCard,
  FiFilter,
  FiPlay,
  FiX,
  FiMinus,
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
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";
import { useTheme } from "../../../contexts/ThemeContext";

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

interface PerformanceTrends {
  totalClassesHeld: number;
  totalAttendance: number;
  avgAttendancePerClass: number;
  classFillRate: number;
  cancelledClasses: number;
  noShows: number;
}

interface PerformanceData extends PerformanceTrends {
  trends: PerformanceTrends;
}

interface TrainerPerformanceEntry {
  name: string;
  attendance: number;
  rating: number;
  retention: number;
  revenue: number;
}

interface TrainerPerformanceData {
  topTrainers: TrainerPerformanceEntry[];
  avgRating: number;
  avgRetention: number;
  totalRevenue: number;
}

interface BookingItem {
  id: string;
  status: string;
  created_at: string;
  members?: {
    membership_type?: string;
    gender?: string;
    metadata?: {
      gender?: string;
    };
  };
  classes?: {
    name?: string;
    class_type?: string;
    trainer_id?: string;
    capacity?: number;
    start_time?: string;
    trainers?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

interface ClassInsightEntry {
  name: string;
  attendance: number;
  sessions: number;
  cancelled: number;
  total: number;
  capacity: number;
  overbooked: number;
}

interface ClassInsightsData {
  mostPopular: ClassInsightEntry[];
  leastAttended: ClassInsightEntry[];
  mostCancelled: ClassInsightEntry[];
  overbooked: ClassInsightEntry[];
}

interface AttendanceByMembershipEntry {
  type: string;
  attendance: number;
  percentage: number;
}

interface GenderSplitEntry {
  gender: string;
  attendance: number;
  percentage: number;
}

interface TimeOfDayEntry {
  time: string;
  attendance: number;
  percentage: number;
}

interface DropOffPointEntry {
  date: string;
  noShows: number;
}

interface MemberBehaviorData {
  attendanceByMembership: AttendanceByMembershipEntry[];
  genderSplit: GenderSplitEntry[];
  timeOfDay: TimeOfDayEntry[];
  repeatRate: number;
  dropOffPoints: DropOffPointEntry[];
}

interface RevenueByClassTypeEntry {
  type: string;
  revenue: number;
  classes: number;
}

interface RevenueData {
  totalRevenue: number;
  avgRevenuePerClass: number;
  costPerClass: number;
  profitPerClass: number;
  revenueByClassType: RevenueByClassTypeEntry[];
}

interface AttendanceTrendEntry {
  date: string;
  attendance: number;
}

interface ClassTypePopularityEntry {
  type: string;
  attendance: number;
  percentage: number;
}

interface TrainerImpactEntry {
  trainer: string;
  avgAttendance: number;
  classes: number;
}

interface NoShowTrendEntry {
  date: string;
  noShows: number;
}

interface ChartsData {
  attendanceTrend: AttendanceTrendEntry[];
  classTypePopularity: ClassTypePopularityEntry[];
  trainerImpact: TrainerImpactEntry[];
  noShowTrend: NoShowTrendEntry[];
}

interface ClassAnalyticsData {
  performance: PerformanceData;
  trainerPerformance: TrainerPerformanceData;
  classInsights: ClassInsightsData;
  memberBehavior: MemberBehaviorData;
  revenue: RevenueData;
  charts: ChartsData;
}

// Empty data structure for initial state
const emptyClassAnalyticsData: ClassAnalyticsData = {
  performance: {
    totalClassesHeld: 0,
    totalAttendance: 0,
    avgAttendancePerClass: 0,
    classFillRate: 0,
    cancelledClasses: 0,
    noShows: 0,
    trends: {
      totalClassesHeld: 0,
      totalAttendance: 0,
      avgAttendancePerClass: 0,
      classFillRate: 0,
      cancelledClasses: 0,
      noShows: 0,
    },
  },
  trainerPerformance: {
    topTrainers: [],
    avgRating: 0,
    avgRetention: 0,
    totalRevenue: 0,
  },
  classInsights: {
    mostPopular: [],
    leastAttended: [],
    mostCancelled: [],
    overbooked: [],
  },
  memberBehavior: {
    attendanceByMembership: [],
    genderSplit: [],
    timeOfDay: [],
    repeatRate: 0,
    dropOffPoints: [],
  },
  revenue: {
    totalRevenue: 0,
    avgRevenuePerClass: 0,
    costPerClass: 0,
    profitPerClass: 0,
    revenueByClassType: [],
  },
  charts: {
    attendanceTrend: [],
    classTypePopularity: [],
    trainerImpact: [],
    noShowTrend: [],
  },
};

// Filter Component
interface ClassAnalyticsFiltersState {
  branch: string;
  classType: string;
  trainer: string;
  dateRange: string;
  timeOfDay: string;
  memberGender: string;
  membershipType: string;
}

const ClassAnalyticsFilters: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ClassAnalyticsFiltersState>({
    branch: "all",
    classType: "all",
    trainer: "all",
    dateRange: "last30days",
    timeOfDay: "all",
    memberGender: "all",
    membershipType: "all",
  });

  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <FiFilter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("classes.analyticsFilters") || "Class Analytics Filters"}
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
              {/* Branch */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.branch}
                onChange={(e) =>
                  setFilters({ ...filters, branch: e.target.value })
                }
              >
                <option value="">All Branches</option>
                <option value="main">Main Branch</option>
                <option value="downtown">Downtown</option>
                <option value="westside">Westside</option>
              </select>

              {/* Class Type */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.classType}
                onChange={(e) =>
                  setFilters({ ...filters, classType: e.target.value })
                }
              >
                <option value="all">All Types</option>
                <option value="yoga">Yoga</option>
                <option value="hiit">HIIT</option>
                <option value="strength">Strength</option>
                <option value="pilates">Pilates</option>
                <option value="cardio">Cardio</option>
              </select>

              {/* Trainer */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.trainer}
                onChange={(e) =>
                  setFilters({ ...filters, trainer: e.target.value })
                }
              >
                <option value="all">All Trainers</option>
                <option value="sarah">Sarah Johnson</option>
                <option value="mike">Mike Chen</option>
                <option value="emma">Emma Davis</option>
                <option value="alex">Alex Kim</option>
              </select>

              {/* Date Range */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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

              {/* Time of Day */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.timeOfDay}
                onChange={(e) =>
                  setFilters({ ...filters, timeOfDay: e.target.value })
                }
              >
                <option value="all">All Times</option>
                <option value="morning">Morning (6-12)</option>
                <option value="afternoon">Afternoon (12-6)</option>
                <option value="evening">Evening (6-10)</option>
              </select>

              {/* Member Gender */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.memberGender}
                onChange={(e) =>
                  setFilters({ ...filters, memberGender: e.target.value })
                }
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              {/* Membership Type */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.membershipType}
                onChange={(e) =>
                  setFilters({ ...filters, membershipType: e.target.value })
                }
              >
                <option value="all">All Memberships</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="classpack">Class Pack</option>
                <option value="trial">Free Trial</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Performance Overview Cards Component
interface PerformanceOverviewCardsProps {
  performance: typeof emptyClassAnalyticsData.performance;
  loading?: boolean;
}

const PerformanceOverviewCards: React.FC<PerformanceOverviewCardsProps> = ({ performance, loading = false }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: t("classes.totalClassesHeld"),
      value: performance.totalClassesHeld.toLocaleString(),
      subtitle: t("classes.classesConductedInPeriod"),
      icon: FiPlay,
      color: "blue",
      trend: { value: Math.abs(performance.trends?.totalClassesHeld || 0), isPositive: (performance.trends?.totalClassesHeld || 0) >= 0 },
    },
    {
      title: t("classes.totalAttendance"),
      value: performance.totalAttendance.toLocaleString(),
      subtitle: t("classes.membersWhoAttended"),
      icon: FiUsers,
      color: "green",
      trend: { value: Math.abs(performance.trends?.totalAttendance || 0), isPositive: (performance.trends?.totalAttendance || 0) >= 0 },
    },
    {
      title: t("classes.avgAttendancePerClass"),
      value: performance.avgAttendancePerClass.toFixed(1),
      subtitle: t("classes.averageMembersPerClass"),
      icon: FiActivity,
      color: "purple",
      trend: { value: Math.abs(performance.trends?.avgAttendancePerClass || 0), isPositive: (performance.trends?.avgAttendancePerClass || 0) >= 0 },
    },
    {
      title: t("classes.classFillRate"),
      value: `${performance.classFillRate.toFixed(1)}%`,
      subtitle: t("classes.capacityUtilization"),
      icon: FiTarget,
      color: "orange",
      trend: { value: Math.abs(performance.trends?.classFillRate || 0), isPositive: (performance.trends?.classFillRate || 0) >= 0 },
    },
    {
      title: t("classes.cancelledClasses"),
      value: performance.cancelledClasses.toLocaleString(),
      subtitle: t("classes.classesCancelled"),
      icon: FiX,
      color: "red",
      trend: { value: Math.abs(performance.trends?.cancelledClasses || 0), isPositive: (performance.trends?.cancelledClasses || 0) <= 0 },
    },
    {
      title: t("classes.noShows"),
      value: performance.noShows.toLocaleString(),
      subtitle: t("classes.bookedButNotAttended"),
      icon: FiAlertTriangle,
      color: "yellow",
      trend: { value: Math.abs(performance.trends?.noShows || 0), isPositive: (performance.trends?.noShows || 0) <= 0 },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-xl bg-${card.color}-50 dark:bg-${card.color}-900/30 flex items-center justify-center`}
            >
              <card.icon className={`w-5 h-5 text-${card.color}-600 dark:text-${card.color}-400`} />
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{card.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Trainer Performance Cards Component
interface TrainerPerformanceCardsProps {
  trainerPerformance: typeof emptyClassAnalyticsData.trainerPerformance;
  loading?: boolean;
}

const TrainerPerformanceCards: React.FC<TrainerPerformanceCardsProps> = ({ trainerPerformance, loading = false }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-gray-200 animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Top Trainers */}
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          🏆 {t("classes.topTrainersByAttendance")}
        </h3>
        <div className="space-y-4">
          {trainerPerformance.topTrainers.map((trainer, index) => (
            <div
              key={trainer.name}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
            >
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{trainer.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trainer.attendance} {t("classes.attendees")}
                  </p>
                </div>
              </div>
              <div className={isRTL ? "text-left" : "text-right"}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ${trainer.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {trainer.rating}★ {t("classes.rating")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trainer Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          📊 {t("classes.trainerStats")}
        </h3>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {trainerPerformance.avgRating}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("classes.avgRating")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {trainerPerformance.avgRetention}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("classes.avgRetention")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${trainerPerformance.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("classes.totalRevenue")}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Class Insights Cards Component
interface ClassInsightsCardsProps {
  classInsights: typeof emptyClassAnalyticsData.classInsights;
  loading?: boolean;
}

const ClassInsightsCards: React.FC<ClassInsightsCardsProps> = ({ classInsights, loading = false }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Most Popular Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          🔥 {t("classes.mostPopularClasses")}
        </h3>
        <div className="space-y-3">
          {classInsights.mostPopular.map((classItem, index) => (
            <div
              key={classItem.name}
              className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{classItem.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {classItem.sessions} {t("classes.sessions")}
                  </p>
                </div>
              </div>
              <div className={isRTL ? "text-left" : "text-right"}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {classItem.attendance}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{t("classes.attendees")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Least Attended Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          ⚠️ {t("classes.leastAttendedClasses")}
        </h3>
        <div className="space-y-3">
          {classInsights.leastAttended.map((classItem, index) => (
            <div
              key={classItem.name}
              className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl"
            >
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
                <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{classItem.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {classItem.sessions} {t("classes.sessions")}
                  </p>
                </div>
              </div>
              <div className={isRTL ? "text-left" : "text-right"}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {classItem.attendance}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{t("classes.attendees")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Cancelled Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          ❌ {t("classes.mostCancelledClasses")}
        </h3>
        <div className="space-y-3">
          {classInsights.mostCancelled.map((classItem, index) => (
            <div
              key={classItem.name}
              className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl`}
            >
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
                <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{classItem.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {classItem.total} {t("common.total") || "total"}
                  </p>
                </div>
              </div>
              <div className={isRTL ? "text-left" : "text-right"}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {classItem.cancelled}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{t("classes.cancelled")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overbooked Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📈 {t("classes.overbookedClasses")}
        </h3>
        <div className="space-y-3">
          {classInsights.overbooked.map((classItem, index) => (
            <div
              key={classItem.name}
              className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
            >
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{classItem.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("classes.capacity")}: {classItem.capacity}
                  </p>
                </div>
              </div>
              <div className={isRTL ? "text-left" : "text-right"}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  +{classItem.overbooked}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{t("classes.overbooked")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Member Behavior Cards Component with Modern Charts
interface MemberBehaviorCardsProps {
  memberBehavior: typeof emptyClassAnalyticsData.memberBehavior;
  loading?: boolean;
}

const MemberBehaviorCards: React.FC<MemberBehaviorCardsProps> = ({ memberBehavior, loading = false }) => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const { isDark } = useTheme();
  
  // Gender Split Chart Data
  const genderChartData = useMemo(() => ({
    labels: memberBehavior.genderSplit.length > 0 
      ? memberBehavior.genderSplit.map((item) => item.gender)
      : [t("classes.noData")],
    datasets: [
      {
        data: memberBehavior.genderSplit.length > 0
          ? memberBehavior.genderSplit.map((item) => item.attendance)
          : [0],
        backgroundColor: [
          "rgba(236, 72, 153, 0.8)", // Pink
          "rgba(59, 130, 246, 0.8)", // Blue
          "rgba(34, 197, 94, 0.8)", // Green
        ],
        borderColor: [
          "rgba(236, 72, 153, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(34, 197, 94, 1)",
        ],
        borderWidth: 2,
      },
    ],
  }), [memberBehavior.genderSplit, t, i18n.language]);

  // Time of Day Chart Data
  const timeOfDayChartData = useMemo(() => ({
    labels: memberBehavior.timeOfDay.length > 0
      ? memberBehavior.timeOfDay.map((item) => item.time)
      : [t("classes.noData")],
    datasets: [
      {
        label: t("classes.attendance"),
        data: memberBehavior.timeOfDay.length > 0
          ? memberBehavior.timeOfDay.map((item) => item.attendance)
          : [0],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }), [memberBehavior.timeOfDay, t, i18n.language]);

  // Membership Type Chart Data
  const membershipChartData = useMemo(() => ({
    labels: memberBehavior.attendanceByMembership.length > 0
      ? memberBehavior.attendanceByMembership.map((item) => item.type)
      : [t("classes.noData")],
    datasets: [
      {
        data: memberBehavior.attendanceByMembership.length > 0
          ? memberBehavior.attendanceByMembership.map((item) => item.attendance)
          : [0],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // Blue
          "rgba(34, 197, 94, 0.8)", // Green
          "rgba(245, 158, 11, 0.8)", // Yellow
          "rgba(239, 68, 68, 0.8)", // Red
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  }), [memberBehavior.attendanceByMembership, t, i18n.language]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
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

  const barChartOptions = {
    ...chartOptions,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gender Split */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          👥 {t("classes.genderAttendanceSplit")}
        </h3>
        <div className="h-64">
          <Doughnut data={genderChartData} options={chartOptions} />
        </div>
      </div>

      {/* Time of Day */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          ⏰ {t("classes.timeOfDayBreakdown")}
        </h3>
        <div className="h-64">
          <Bar data={timeOfDayChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Membership Types */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          💳 {t("classes.attendanceByMembership")}
        </h3>
        <div className="h-64">
          <Doughnut data={membershipChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

// Revenue Cards Component
interface RevenueCardsProps {
  revenue: typeof emptyClassAnalyticsData.revenue;
  loading?: boolean;
}

const RevenueCards: React.FC<RevenueCardsProps> = ({ revenue, loading = false }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Total Revenue */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-start flex-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${revenue.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("classes.totalRevenue")}</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: "85%" }}
          ></div>
        </div>
      </div>

      {/* Avg Revenue per Class */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <FiCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-start flex-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${revenue.avgRevenuePerClass}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("classes.avgRevenuePerClass")}</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: "72%" }}
          ></div>
        </div>
      </div>

      {/* Cost per Class */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <FiMinus className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-start flex-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${revenue.costPerClass}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("classes.costPerClass")}</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full"
            style={{ width: "58%" }}
          ></div>
        </div>
      </div>

      {/* Profit per Class */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <FiTrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-start flex-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${revenue.profitPerClass}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("classes.profitPerClass")}</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full"
            style={{ width: "78%" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Modern Charts Component
interface ClassAnalyticsChartsProps {
  charts: typeof emptyClassAnalyticsData.charts;
  loading?: boolean;
}

const ClassAnalyticsCharts: React.FC<ClassAnalyticsChartsProps> = ({ charts, loading = false }) => {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  
  // Attendance Trend Chart
  const attendanceTrendData = useMemo(() => ({
    labels: charts.attendanceTrend.length > 0
      ? charts.attendanceTrend.map((item) => item.date)
      : [t("classes.noData")],
    datasets: [
      {
        label: t("classes.attendance"),
        data: charts.attendanceTrend.length > 0
          ? charts.attendanceTrend.map((item) => item.attendance)
          : [0],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  }), [charts.attendanceTrend, t, i18n.language]);

  // Class Type Popularity Chart
  const classTypePopularityData = useMemo(() => ({
    labels: charts.classTypePopularity.length > 0
      ? charts.classTypePopularity.map((item) => item.type)
      : [t("classes.noData")],
    datasets: [
      {
        label: t("classes.attendance"),
        data: charts.classTypePopularity.length > 0
          ? charts.classTypePopularity.map((item) => item.attendance)
          : [0],
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }), [charts.classTypePopularity, t, i18n.language]);

  // Trainer Impact Chart
  const trainerImpactData = useMemo(() => ({
    labels: charts.trainerImpact.length > 0
      ? charts.trainerImpact.map((item) => item.trainer)
      : [t("classes.noData")],
    datasets: [
      {
        label: t("classes.averageAttendance"),
        data: charts.trainerImpact.length > 0
          ? charts.trainerImpact.map((item) => item.avgAttendance)
          : [0],
        borderColor: "rgba(245, 158, 11, 1)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(245, 158, 11, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  }), [charts.trainerImpact, t, i18n.language]);

  // No-Show Trend Chart
  const noShowTrendData = useMemo(() => ({
    labels: charts.noShowTrend.length > 0
      ? charts.noShowTrend.map((item) => item.date)
      : [t("classes.noData")],
    datasets: [
      {
        label: t("classes.noShows"),
        data: charts.noShowTrend.length > 0
          ? charts.noShowTrend.map((item) => item.noShows)
          : [0],
        borderColor: "rgba(239, 68, 68, 1)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(239, 68, 68, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  }), [charts.noShowTrend, t, i18n.language]);

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const lineChartOptions = {
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

  const barChartOptions = {
    ...lineChartOptions,
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

  return (
    <div className="space-y-6">
      {/* Attendance Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📈 {t("classes.classAttendanceTrend")}
        </h3>
        <div className="h-80">
          <Line data={attendanceTrendData} options={lineChartOptions} />
        </div>
      </div>

      {/* Class Type Popularity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🏆 {t("classes.classTypePopularity")}
        </h3>
        <div className="h-80">
          <Bar data={classTypePopularityData} options={barChartOptions} />
        </div>
      </div>

      {/* Trainer Impact Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          👨‍🏫 {t("classes.trainerImpactTrend")}
        </h3>
        <div className="h-80">
          <Line data={trainerImpactData} options={lineChartOptions} />
        </div>
      </div>

      {/* No-Show Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ❌ {t("classes.noShowTrend")}
        </h3>
        <div className="h-80">
          <Line data={noShowTrendData} options={lineChartOptions} />
        </div>
      </div>
    </div>
  );
};

// Main Class Analytics Tab Component
interface ClassAnalyticsTabProps {
  classes: unknown[];
}

const ClassAnalyticsTab: React.FC<ClassAnalyticsTabProps> = ({
  classes: _classes,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { tenantId } = useAuth();
  const [analyticsData, setAnalyticsData] =
    useState<ClassAnalyticsData>(emptyClassAnalyticsData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassAnalytics = async () => {
      if (!tenantId) return;
      
      try {
        setLoading(true);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        // Fetch classes
        const { data: allClasses, error: classesError } = await supabase
          .from("classes")
          .select("*")
          .eq("tenant_id", tenantId)
          .gte("start_time", formatDate(thirtyDaysAgo));

        if (classesError) throw classesError;

        // Fetch class bookings
        const { data: allBookings, error: bookingsError } = await supabase
          .from("class_bookings")
          .select("*, members(*), classes(*)")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(thirtyDaysAgo));

        if (bookingsError) throw bookingsError;

        // Fetch previous period data for trends
        const { data: previousBookings } = await supabase
          .from("class_bookings")
          .select("*")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(sixtyDaysAgo))
          .lt("created_at", formatDate(thirtyDaysAgo));

        // Fetch trainers
        const { data: trainers, error: trainersError } = await supabase
          .from("trainers")
          .select("*")
          .eq("tenant_id", tenantId);

        if (trainersError) throw trainersError;

        // Fetch invoices for revenue
        const { data: invoices, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(thirtyDaysAgo))
          .in("status", ["paid", "completed"]);

        if (invoicesError) throw invoicesError;

        // Calculate performance metrics
        const completedClasses = (allClasses || []).filter(c => c.status === "completed");
        const cancelledClasses = (allClasses || []).filter(c => c.status === "cancelled");
        const totalClassesHeld = completedClasses.length;
        const totalAttendance = (allBookings || []).filter(b => 
          b.status === "checked_in" || b.status === "completed"
        ).length;
        const avgAttendancePerClass = totalClassesHeld > 0 ? totalAttendance / totalClassesHeld : 0;
        
        // Calculate capacity and fill rate
        const totalCapacity = completedClasses.reduce((sum, c) => sum + (c.capacity || 0), 0);
        const classFillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
        
        const noShows = (allBookings || []).filter(b => b.status === "no_show").length;

        // Calculate trends
        const previousTotalClasses = (previousBookings || []).length;
        const previousAttendance = (previousBookings || []).filter(b => 
          b.status === "checked_in" || b.status === "completed"
        ).length;
        const previousAvgAttendance = previousTotalClasses > 0 ? previousAttendance / previousTotalClasses : 0;
        const previousFillRate = 0; // Would need previous capacity data
        const previousCancelled = 0; // Would need previous cancelled classes
        const previousNoShows = (previousBookings || []).filter(b => b.status === "no_show").length;

        const trends = {
          totalClassesHeld: previousTotalClasses > 0 
            ? ((totalClassesHeld - previousTotalClasses) / previousTotalClasses) * 100 
            : 0,
          totalAttendance: previousAttendance > 0 
            ? ((totalAttendance - previousAttendance) / previousAttendance) * 100 
            : 0,
          avgAttendancePerClass: previousAvgAttendance > 0 
            ? ((avgAttendancePerClass - previousAvgAttendance) / previousAvgAttendance) * 100 
            : 0,
          classFillRate: previousFillRate > 0 
            ? classFillRate - previousFillRate 
            : 0,
          cancelledClasses: previousCancelled > 0 
            ? ((cancelledClasses.length - previousCancelled) / previousCancelled) * 100 
            : 0,
          noShows: previousNoShows > 0 
            ? ((noShows - previousNoShows) / previousNoShows) * 100 
            : 0,
        };

        // Calculate trainer performance
        const trainerStats = new Map();
        (allBookings || []).forEach((booking: BookingItem) => {
          if (booking.classes?.trainer_id && (booking.status === "checked_in" || booking.status === "completed")) {
            const trainerId = booking.classes.trainer_id;
            if (!trainerStats.has(trainerId)) {
              trainerStats.set(trainerId, { attendance: 0, bookings: [] });
            }
            const stats = trainerStats.get(trainerId);
            stats.attendance++;
            stats.bookings.push(booking);
          }
        });

        interface TrainerStats {
          attendance: number;
          bookings: unknown[];
        }
        const topTrainers = Array.from(trainerStats.entries())
          .map(([trainerId, stats]: [string, TrainerStats]) => {
            const trainer = (trainers || []).find(t => t.id === trainerId);
            if (!trainer) return null;
            
            // Calculate revenue from invoices for this trainer's classes
            const trainerRevenue = (invoices || []).reduce((sum, inv) => {
              // Check if invoice is related to trainer's classes
              const invoiceAmount = parseFloat(inv.amount || inv.total || "0");
              return sum + invoiceAmount;
            }, 0) / (trainers?.length || 1); // Rough estimate - divide by trainer count

            return {
              name: `${trainer.first_name || ''} ${trainer.last_name || ''}`.trim() || trainer.email,
              attendance: stats.attendance,
              rating: parseFloat(trainer.rating || "0"),
              retention: 85, // Would need historical data to calculate
              revenue: trainerRevenue,
            };
          })
          .filter(
            (trainer): trainer is TrainerPerformanceEntry => Boolean(trainer),
          )
          .sort((a, b) => b.attendance - a.attendance)
          .slice(0, 3);

        const avgRating = (trainers || []).length > 0
          ? (trainers || []).reduce((sum, t) => sum + parseFloat(t.rating || "0"), 0) / trainers.length
          : 0;

        const totalRevenue = (invoices || []).reduce((sum, inv) => 
          sum + parseFloat(inv.amount || inv.total || "0"), 0
        );

        // Calculate class insights
        const classStats = new Map();
        (allBookings || []).forEach((booking: BookingItem) => {
          if (booking.classes) {
            const className = booking.classes.name || booking.classes.class_type || "Unknown";
            if (!classStats.has(className)) {
              classStats.set(className, { attendance: 0, sessions: 0, cancelled: 0, total: 0, capacity: 0 });
            }
            const stats = classStats.get(className);
            if (booking.status === "checked_in" || booking.status === "completed") {
              stats.attendance++;
            }
            if (booking.status === "cancelled") {
              stats.cancelled++;
            }
            stats.total++;
            stats.capacity = booking.classes.capacity || 0;
          }
        });

        // Count unique sessions per class
        interface ClassItem {
          name?: string;
          class_type?: string;
        }
        (allClasses || []).forEach((cls: ClassItem) => {
          const className = cls.name || cls.class_type || "Unknown";
          if (classStats.has(className)) {
            classStats.get(className).sessions++;
          }
        });

        interface ClassStatsType {
          attendance: number;
          sessions: number;
          cancelled: number;
          total: number;
          capacity: number;
        }
        const classInsightsArray = Array.from(classStats.entries()).map(([name, stats]: [string, ClassStatsType]) => ({
          name,
          attendance: stats.attendance,
          sessions: stats.sessions,
          cancelled: stats.cancelled,
          total: stats.total,
          capacity: stats.capacity,
          overbooked: Math.max(0, stats.attendance - stats.capacity),
        }));

        const mostPopular = [...classInsightsArray]
          .sort((a, b) => b.attendance - a.attendance)
          .slice(0, 3);
        
        const leastAttended = [...classInsightsArray]
          .filter(c => c.sessions > 0)
          .sort((a, b) => a.attendance - b.attendance)
          .slice(0, 3);
        
        const mostCancelled = [...classInsightsArray]
          .filter(c => c.cancelled > 0)
          .sort((a, b) => b.cancelled - a.cancelled)
          .slice(0, 3);
        
        const overbooked = [...classInsightsArray]
          .filter(c => c.overbooked > 0)
          .sort((a, b) => b.overbooked - a.overbooked)
          .slice(0, 3);

        // Calculate member behavior
        const membershipStats = new Map();
        const genderStats = new Map();
        const timeStats = new Map();

        (allBookings || []).forEach((booking: BookingItem) => {
          if (booking.status === "checked_in" || booking.status === "completed") {
            const member = booking.members;
            if (member) {
              // Membership type
              const membershipType = member.membership_type || "Monthly";
              membershipStats.set(membershipType, (membershipStats.get(membershipType) || 0) + 1);

              // Gender
              const gender = member.gender || member.metadata?.gender || "Other";
              genderStats.set(gender, (genderStats.get(gender) || 0) + 1);

              // Time of day
              if (booking.classes?.start_time) {
                const hour = new Date(booking.classes.start_time).getHours();
                let timeSlot = "Evening (6-10)";
                if (hour >= 6 && hour < 12) timeSlot = "Morning (6-12)";
                else if (hour >= 12 && hour < 18) timeSlot = "Afternoon (12-6)";
                timeStats.set(timeSlot, (timeStats.get(timeSlot) || 0) + 1);
              }
            }
          }
        });

        const totalBehaviorAttendance = Array.from(membershipStats.values()).reduce((a, b) => a + b, 0);
        const attendanceByMembership = Array.from(membershipStats.entries()).map(([type, attendance]) => ({
          type,
          attendance,
          percentage: totalBehaviorAttendance > 0 ? (attendance / totalBehaviorAttendance) * 100 : 0,
        }));

        const totalGenderAttendance = Array.from(genderStats.values()).reduce((a, b) => a + b, 0);
        const genderSplit = Array.from(genderStats.entries()).map(([gender, attendance]) => ({
          gender: gender.charAt(0).toUpperCase() + gender.slice(1),
          attendance,
          percentage: totalGenderAttendance > 0 ? (attendance / totalGenderAttendance) * 100 : 0,
        }));

        const totalTimeAttendance = Array.from(timeStats.values()).reduce((a, b) => a + b, 0);
        const timeOfDay = Array.from(timeStats.entries()).map(([time, attendance]) => ({
          time,
          attendance,
          percentage: totalTimeAttendance > 0 ? (attendance / totalTimeAttendance) * 100 : 0,
        }));

        // Calculate revenue by class type
        const revenueByClassType = Array.from(classStats.entries()).map(([name, stats]: [string, ClassStatsType]) => {
          // Estimate revenue - would need proper invoice-class mapping
          const estimatedRevenue = (stats.attendance * 25); // Rough estimate
          return {
            type: name,
            revenue: estimatedRevenue,
            classes: stats.sessions,
          };
        });

        const avgRevenuePerClass = totalClassesHeld > 0 ? totalRevenue / totalClassesHeld : 0;
        const costPerClass = 120; // Would need actual cost data
        const profitPerClass = avgRevenuePerClass - costPerClass;

        // Generate chart data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dateObj: date,
          };
        });

        const attendanceTrend = last7Days.map(({ date, dateObj }) => {
          const dayStart = new Date(dateObj.setHours(0, 0, 0, 0));
          const dayEnd = new Date(dateObj.setHours(23, 59, 59, 999));
          interface BookingItem {
            created_at: string;
            status: string;
          }
          const dayBookings = (allBookings || []).filter((b: BookingItem) => {
            const bookingDate = new Date(b.created_at);
            return bookingDate >= dayStart && bookingDate <= dayEnd && 
                   (b.status === "checked_in" || b.status === "completed");
          });
          return { date, attendance: dayBookings.length };
        });

        const classTypePopularity = Array.from(classStats.entries())
          .map(([name, stats]: [string, ClassStatsType]) => ({
            type: name,
            attendance: stats.attendance,
            percentage: totalAttendance > 0 ? (stats.attendance / totalAttendance) * 100 : 0,
          }))
          .sort((a, b) => b.attendance - a.attendance)
          .slice(0, 5);

        const trainerImpact = topTrainers.map((trainer: TrainerPerformanceEntry) => ({
          trainer: trainer.name.split(' ').map((n: string) => n[0]).join('. '),
          avgAttendance: trainer.attendance / 10, // Rough estimate
          classes: 10, // Would need actual count
        }));

        const noShowTrend = last7Days.map(({ date, dateObj }) => {
          const dayStart = new Date(dateObj.setHours(0, 0, 0, 0));
          const dayEnd = new Date(dateObj.setHours(23, 59, 59, 999));
          const dayNoShows = (allBookings || []).filter((b: any) => {
            const bookingDate = new Date(b.created_at);
            return bookingDate >= dayStart && bookingDate <= dayEnd && b.status === "no_show";
          });
          return { date, noShows: dayNoShows.length };
        });

        setAnalyticsData({
          performance: {
            totalClassesHeld,
            totalAttendance,
            avgAttendancePerClass,
            classFillRate,
            cancelledClasses: cancelledClasses.length,
            noShows,
            trends,
          },
          trainerPerformance: {
            topTrainers,
            avgRating,
            avgRetention: 84.7, // Would need historical data
            totalRevenue,
          },
          classInsights: {
            mostPopular,
            leastAttended,
            mostCancelled,
            overbooked,
          },
          memberBehavior: {
            attendanceByMembership,
            genderSplit,
            timeOfDay,
            repeatRate: 73.2, // Would need historical data
            dropOffPoints: [], // Would need cancellation analysis
          },
          revenue: {
            totalRevenue,
            avgRevenuePerClass,
            costPerClass,
            profitPerClass,
            revenueByClassType,
          },
          charts: {
            attendanceTrend,
            classTypePopularity,
            trainerImpact,
            noShowTrend,
          },
        });
      } catch (error) {
        console.error("Error fetching class analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassAnalytics();
  }, [tenantId, _classes]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ClassAnalyticsFilters />

      {/* Performance Overview Cards */}
      <div className="space-y-6">
        <h2 className={`text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          📊 {t("classes.performanceOverview") || "Performance Overview"}
        </h2>
        <PerformanceOverviewCards performance={analyticsData.performance} loading={loading} />
      </div>

      {/* Trainer Performance Cards */}
      <div className="space-y-6">
        <h2 className={`text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          ⚙️ {t("classes.trainerPerformance") || "Trainer Performance"}
        </h2>
        <TrainerPerformanceCards trainerPerformance={analyticsData.trainerPerformance} loading={loading} />
      </div>

      {/* Class Insights Cards */}
      <div className="space-y-6">
        <h2 className={`text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          📈 {t("classes.classInsights")}
        </h2>
        <ClassInsightsCards classInsights={analyticsData.classInsights} loading={loading} />
      </div>

      {/* Member Behavior Cards */}
      <div className="space-y-6">
        <h2 className={`text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          🧩 {t("classes.memberBehaviorPatterns") || "Member Behavior Patterns"}
        </h2>
        <MemberBehaviorCards memberBehavior={analyticsData.memberBehavior} loading={loading} />
      </div>

      {/* Revenue Cards */}
      <div className="space-y-6">
        <h2 className={`text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          💰 {t("classes.classRevenueEfficiency") || "Class Revenue & Efficiency"}
        </h2>
        <RevenueCards revenue={analyticsData.revenue} loading={loading} />
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <h2 className={`text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          📈 {t("classes.chartsVisuals")}
        </h2>
        <ClassAnalyticsCharts charts={analyticsData.charts} loading={loading} />
      </div>
    </div>
  );
};

export default ClassAnalyticsTab;
