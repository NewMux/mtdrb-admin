import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiUsers,
  FiCheckCircle,
  FiAlertTriangle,
  FiDollarSign,
  FiClock,
  FiDownload,
  FiMessageCircle,
  FiGift,
  FiZap,
  FiArrowUp,
  FiArrowDown,
  FiTarget,
  FiActivity,
  FiUserCheck,
  FiUserPlus,
  FiCreditCard,
  FiAlertCircle,
  FiStar,
  FiAward,
  FiRefreshCw,
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiBarChart,
  FiPieChart,
  FiTrendingDown,
  FiEye,
  FiHeart,
  FiShield,
  FiPlay,
  FiPause,
  FiX,
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

// Removed mock data - using real data from Supabase
// TODO: Fetch from Supabase
const emptyClassAnalyticsData = {
  performance: {
    totalClassesHeld: 342,
    totalAttendance: 2847,
    avgAttendancePerClass: 8.3,
    classFillRate: 76.2,
    cancelledClasses: 23,
    noShows: 156,
  },
  trainerPerformance: {
    topTrainers: [
      {
        name: "Sarah Johnson",
        attendance: 456,
        rating: 4.8,
        retention: 87,
        revenue: 12500,
      },
      {
        name: "Mike Chen",
        attendance: 389,
        rating: 4.6,
        retention: 82,
        revenue: 10800,
      },
      {
        name: "Emma Davis",
        attendance: 312,
        rating: 4.7,
        retention: 85,
        revenue: 9200,
      },
    ],
    avgRating: 4.6,
    avgRetention: 84.7,
    totalRevenue: 32500,
  },
  classInsights: {
    mostPopular: [
      { name: "Yoga Flow", attendance: 234, sessions: 28 },
      { name: "HIIT Training", attendance: 198, sessions: 24 },
      { name: "Strength Training", attendance: 167, sessions: 22 },
    ],
    leastAttended: [
      { name: "Advanced Pilates", attendance: 12, sessions: 8 },
      { name: "Meditation", attendance: 18, sessions: 12 },
      { name: "Senior Fitness", attendance: 23, sessions: 15 },
    ],
    mostCancelled: [
      { name: "Early Morning Yoga", cancelled: 8, total: 24 },
      { name: "Late Night HIIT", cancelled: 6, total: 20 },
      { name: "Weekend Pilates", cancelled: 5, total: 18 },
    ],
    overbooked: [
      { name: "Yoga Flow", overbooked: 12, capacity: 20 },
      { name: "HIIT Training", overbooked: 8, capacity: 15 },
      { name: "Strength Training", overbooked: 6, capacity: 12 },
    ],
  },
  memberBehavior: {
    attendanceByMembership: [
      { type: "Monthly", attendance: 1247, percentage: 45 },
      { type: "Yearly", attendance: 987, percentage: 35 },
      { type: "Class Pack", attendance: 423, percentage: 15 },
      { type: "Free Trial", attendance: 190, percentage: 5 },
    ],
    genderSplit: [
      { gender: "Female", attendance: 1456, percentage: 52 },
      { gender: "Male", attendance: 1234, percentage: 44 },
      { gender: "Other", attendance: 157, percentage: 4 },
    ],
    timeOfDay: [
      { time: "Morning (6-12)", attendance: 856, percentage: 30 },
      { time: "Afternoon (12-6)", attendance: 1123, percentage: 40 },
      { time: "Evening (6-10)", attendance: 868, percentage: 30 },
    ],
    repeatRate: 73.2,
    dropOffPoints: [
      { classType: "Advanced Classes", dropOff: 45, total: 120 },
      { classType: "Early Morning", dropOff: 38, total: 95 },
      { classType: "Weekend Classes", dropOff: 32, total: 85 },
    ],
  },
  revenue: {
    totalRevenue: 98750,
    avgRevenuePerClass: 289,
    costPerClass: 120,
    profitPerClass: 169,
    revenueByClassType: [
      { type: "Yoga", revenue: 28450, classes: 98 },
      { type: "HIIT", revenue: 31200, classes: 108 },
      { type: "Strength", revenue: 23400, classes: 78 },
      { type: "Pilates", revenue: 15700, classes: 58 },
    ],
  },
  charts: {
    attendanceTrend: [
      { date: "Jan 1", attendance: 45 },
      { date: "Jan 8", attendance: 52 },
      { date: "Jan 15", attendance: 48 },
      { date: "Jan 22", attendance: 61 },
      { date: "Jan 29", attendance: 58 },
      { date: "Feb 5", attendance: 67 },
      { date: "Feb 12", attendance: 73 },
    ],
    classTypePopularity: [
      { type: "Yoga", attendance: 234, percentage: 28 },
      { type: "HIIT", attendance: 198, percentage: 24 },
      { type: "Strength", attendance: 167, percentage: 20 },
      { type: "Pilates", attendance: 134, percentage: 16 },
      { type: "Cardio", attendance: 98, percentage: 12 },
    ],
    trainerImpact: [
      { trainer: "Sarah J.", avgAttendance: 16.3, classes: 28 },
      { trainer: "Mike C.", avgAttendance: 14.2, classes: 24 },
      { trainer: "Emma D.", avgAttendance: 13.8, classes: 22 },
      { trainer: "Alex K.", avgAttendance: 12.1, classes: 18 },
      { trainer: "Lisa M.", avgAttendance: 11.5, classes: 16 },
    ],
    noShowTrend: [
      { date: "Jan 1", noShows: 8 },
      { date: "Jan 8", noShows: 12 },
      { date: "Jan 15", noShows: 6 },
      { date: "Jan 22", noShows: 15 },
      { date: "Jan 29", noShows: 9 },
      { date: "Feb 5", noShows: 11 },
      { date: "Feb 12", noShows: 7 },
    ],
  },
};

// Filter Component
const ClassAnalyticsFilters: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    branch: [],
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
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FiFilter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Class Analytics Filters
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
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

              {/* Time of Day */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
const PerformanceOverviewCards: React.FC = () => {
  const { performance } = emptyClassAnalyticsData;

  const cards = [
    {
      title: "Total Classes Held",
      value: performance.totalClassesHeld.toLocaleString(),
      subtitle: "Classes conducted in period",
      icon: FiPlay,
      color: "blue",
      trend: { value: 8.2, isPositive: true },
    },
    {
      title: "Total Attendance",
      value: performance.totalAttendance.toLocaleString(),
      subtitle: "Members who attended",
      icon: FiUsers,
      color: "green",
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Avg. Attendance / Class",
      value: performance.avgAttendancePerClass.toFixed(1),
      subtitle: "Average members per class",
      icon: FiActivity,
      color: "purple",
      trend: { value: 5.1, isPositive: true },
    },
    {
      title: "Class Fill Rate",
      value: `${performance.classFillRate}%`,
      subtitle: "Capacity utilization",
      icon: FiTarget,
      color: "orange",
      trend: { value: 3.8, isPositive: true },
    },
    {
      title: "Cancelled Classes",
      value: performance.cancelledClasses.toLocaleString(),
      subtitle: "Classes cancelled",
      icon: FiX,
      color: "red",
      trend: { value: 15.2, isPositive: false },
    },
    {
      title: "No-Shows",
      value: performance.noShows.toLocaleString(),
      subtitle: "Booked but not attended",
      icon: FiAlertTriangle,
      color: "yellow",
      trend: { value: 8.7, isPositive: false },
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
          className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-xl bg-${card.color}-50 flex items-center justify-center`}
            >
              <card.icon className={`w-5 h-5 text-${card.color}-600`} />
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
            <h3 className="text-xl font-bold text-gray-900">{card.value}</h3>
            <p className="text-sm text-gray-600 mt-1">{card.title}</p>
            <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Trainer Performance Cards Component
const TrainerPerformanceCards: React.FC = () => {
  const { trainerPerformance } = emptyClassAnalyticsData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Top Trainers */}
      <div className="lg:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Top Trainers by Attendance
        </h3>
        <div className="space-y-4">
          {trainerPerformance.topTrainers.map((trainer, index) => (
            <div
              key={trainer.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{trainer.name}</p>
                  <p className="text-sm text-gray-600">
                    {trainer.attendance} attendees
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  ${trainer.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  {trainer.rating}★ rating
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trainer Stats */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Trainer Stats
        </h3>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {trainerPerformance.avgRating}
            </div>
            <div className="text-sm text-gray-600">Avg. Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {trainerPerformance.avgRetention}%
            </div>
            <div className="text-sm text-gray-600">Avg. Retention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              ${trainerPerformance.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Class Insights Cards Component
const ClassInsightsCards: React.FC = () => {
  const { classInsights } = emptyClassAnalyticsData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Most Popular Classes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔥 Most Popular Classes
        </h3>
        <div className="space-y-3">
          {classInsights.mostPopular.map((classItem, index) => (
            <div
              key={classItem.name}
              className="flex items-center justify-between p-3 bg-green-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{classItem.name}</p>
                  <p className="text-sm text-gray-600">
                    {classItem.sessions} sessions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {classItem.attendance}
                </p>
                <p className="text-xs text-gray-600">attendees</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Least Attended Classes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚠️ Least Attended Classes
        </h3>
        <div className="space-y-3">
          {classInsights.leastAttended.map((classItem, index) => (
            <div
              key={classItem.name}
              className="flex items-center justify-between p-3 bg-red-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{classItem.name}</p>
                  <p className="text-sm text-gray-600">
                    {classItem.sessions} sessions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {classItem.attendance}
                </p>
                <p className="text-xs text-gray-600">attendees</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Cancelled Classes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ❌ Most Cancelled Classes
        </h3>
        <div className="space-y-3">
          {classInsights.mostCancelled.map((classItem, index) => (
            <div
              key={classItem.name}
              className="flex items-center justify-between p-3 bg-orange-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{classItem.name}</p>
                  <p className="text-sm text-gray-600">
                    {classItem.total} total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {classItem.cancelled}
                </p>
                <p className="text-xs text-gray-600">cancelled</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overbooked Classes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Overbooked Classes
        </h3>
        <div className="space-y-3">
          {classInsights.overbooked.map((classItem, index) => (
            <div
              key={classItem.name}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{classItem.name}</p>
                  <p className="text-sm text-gray-600">
                    Capacity: {classItem.capacity}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  +{classItem.overbooked}
                </p>
                <p className="text-xs text-gray-600">overbooked</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Member Behavior Cards Component with Modern Charts
const MemberBehaviorCards: React.FC = () => {
  const { memberBehavior } = emptyClassAnalyticsData;

  // Gender Split Chart Data
  const genderChartData = {
    labels: memberBehavior.genderSplit.map((item) => item.gender),
    datasets: [
      {
        data: memberBehavior.genderSplit.map((item) => item.attendance),
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
  };

  // Time of Day Chart Data
  const timeOfDayChartData = {
    labels: memberBehavior.timeOfDay.map((item) => item.time),
    datasets: [
      {
        label: "Attendance",
        data: memberBehavior.timeOfDay.map((item) => item.attendance),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Membership Type Chart Data
  const membershipChartData = {
    labels: memberBehavior.attendanceByMembership.map((item) => item.type),
    datasets: [
      {
        data: memberBehavior.attendanceByMembership.map(
          (item) => item.attendance,
        ),
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
  };

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

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gender Split */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👥 Gender Attendance Split
        </h3>
        <div className="h-64">
          <Doughnut data={genderChartData} options={chartOptions} />
        </div>
      </div>

      {/* Time of Day */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⏰ Time of Day Breakdown
        </h3>
        <div className="h-64">
          <Bar data={timeOfDayChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Membership Types */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💳 Attendance by Membership
        </h3>
        <div className="h-64">
          <Doughnut data={membershipChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

// Revenue Cards Component
const RevenueCards: React.FC = () => {
  const { revenue } = emptyClassAnalyticsData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Total Revenue */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
            <FiDollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${revenue.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: "85%" }}
          ></div>
        </div>
      </div>

      {/* Avg Revenue per Class */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <FiCreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${revenue.avgRevenuePerClass}
            </div>
            <div className="text-sm text-gray-600">Avg. Revenue per Class</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: "72%" }}
          ></div>
        </div>
      </div>

      {/* Cost per Class */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
            <FiMinus className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${revenue.costPerClass}
            </div>
            <div className="text-sm text-gray-600">Cost per Class</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full"
            style={{ width: "58%" }}
          ></div>
        </div>
      </div>

      {/* Profit per Class */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
            <FiTrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${revenue.profitPerClass}
            </div>
            <div className="text-sm text-gray-600">Profit per Class</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
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
const ClassAnalyticsCharts: React.FC = () => {
  const { charts } = emptyClassAnalyticsData;

  // Attendance Trend Chart
  const attendanceTrendData = {
    labels: charts.attendanceTrend.map((item) => item.date),
    datasets: [
      {
        label: "Attendance",
        data: charts.attendanceTrend.map((item) => item.attendance),
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
  };

  // Class Type Popularity Chart
  const classTypePopularityData = {
    labels: charts.classTypePopularity.map((item) => item.type),
    datasets: [
      {
        label: "Attendance",
        data: charts.classTypePopularity.map((item) => item.attendance),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Trainer Impact Chart
  const trainerImpactData = {
    labels: charts.trainerImpact.map((item) => item.trainer),
    datasets: [
      {
        label: "Avg Attendance",
        data: charts.trainerImpact.map((item) => item.avgAttendance),
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
  };

  // No-Show Trend Chart
  const noShowTrendData = {
    labels: charts.noShowTrend.map((item) => item.date),
    datasets: [
      {
        label: "No-Shows",
        data: charts.noShowTrend.map((item) => item.noShows),
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
  };

  const lineChartOptions = {
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

  const barChartOptions = {
    ...lineChartOptions,
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
    <div className="space-y-6">
      {/* Attendance Trend Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Class Attendance Trend
        </h3>
        <div className="h-80">
          <Line data={attendanceTrendData} options={lineChartOptions} />
        </div>
      </div>

      {/* Class Type Popularity Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Class Type Popularity
        </h3>
        <div className="h-80">
          <Bar data={classTypePopularityData} options={barChartOptions} />
        </div>
      </div>

      {/* Trainer Impact Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👨‍🏫 Trainer Impact Trend
        </h3>
        <div className="h-80">
          <Line data={trainerImpactData} options={lineChartOptions} />
        </div>
      </div>

      {/* No-Show Trend Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ❌ No-Show Trend
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
  classes: any[];
  stats: any;
  onFilterClasses?: (filter: any) => void;
}

const ClassAnalyticsTab: React.FC<ClassAnalyticsTabProps> = ({
  classes,
  stats,
  onFilterClasses,
}) => {
  const [analyticsData, setAnalyticsData] = useState(emptyClassAnalyticsData);

  useEffect(() => {
    // In a real app, this would fetch data from an API
    const fetchClassAnalytics = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAnalyticsData(emptyClassAnalyticsData);
    };

    fetchClassAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ClassAnalyticsFilters />

      {/* Performance Overview Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📊 Performance Overview
        </h2>
        <PerformanceOverviewCards />
      </div>

      {/* Trainer Performance Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          ⚙️ Trainer Performance
        </h2>
        <TrainerPerformanceCards />
      </div>

      {/* Class Insights Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📈 Class Insights
        </h2>
        <ClassInsightsCards />
      </div>

      {/* Member Behavior Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          🧩 Member Behavior Patterns
        </h2>
        <MemberBehaviorCards />
      </div>

      {/* Revenue Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          💰 Class Revenue & Efficiency
        </h2>
        <RevenueCards />
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📈 Charts & Visuals
        </h2>
        <ClassAnalyticsCharts />
      </div>
    </div>
  );
};

export default ClassAnalyticsTab;
