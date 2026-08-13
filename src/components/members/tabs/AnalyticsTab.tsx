import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiUsers,
  FiAlertTriangle,
  FiDollarSign,
  FiGift,
  FiArrowUp,
  FiArrowDown,
  FiTarget,
  FiActivity,
  FiUserCheck,
  FiUserPlus,
  FiCreditCard,
  FiAlertCircle,
  FiStar,
  FiRefreshCw,
  FiFilter,
  FiCalendar,
} from "react-icons/fi";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { Member } from "../../../types/member";
import dayjs from "dayjs";
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

// Filter Component
const AnalyticsFilters: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    branch: "all",
    membershipType: "all",
    joinDateRange: "last30days",
    gender: "all",
    ageRange: "all",
    activityStatus: "all",
    trainer: "all",
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
            {t("members.analyticsFilters")}
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
                <option value="">{t("members.allBranches")}</option>
                <option value="main">{t("members.mainBranch")}</option>
                <option value="downtown">{t("members.downtownBranch")}</option>
                <option value="westside">{t("members.westsideBranch")}</option>
              </select>

              {/* Membership Type */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.membershipType}
                onChange={(e) =>
                  setFilters({ ...filters, membershipType: e.target.value })
                }
              >
                <option value="all">{t("members.allTypes")}</option>
                <option value="monthly">{t("members.monthly")}</option>
                <option value="yearly">{t("members.yearly")}</option>
                <option value="classpack">{t("members.classPack")}</option>
                <option value="trial">{t("members.trial")}</option>
              </select>

              {/* Join Date Range */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.joinDateRange}
                onChange={(e) =>
                  setFilters({ ...filters, joinDateRange: e.target.value })
                }
              >
                <option value="last7days">{t("members.last7Days")}</option>
                <option value="last30days">{t("members.last30Days")}</option>
                <option value="last90days">{t("members.last90Days")}</option>
                <option value="last6months">{t("members.last6Months")}</option>
                <option value="lastyear">{t("members.lastYear")}</option>
              </select>

              {/* Gender */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.gender}
                onChange={(e) =>
                  setFilters({ ...filters, gender: e.target.value })
                }
              >
                <option value="all">{t("members.allGenders")}</option>
                <option value="male">{t("members.male")}</option>
                <option value="female">{t("members.female")}</option>
                <option value="other">{t("members.other")}</option>
              </select>

              {/* Age Range */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.ageRange}
                onChange={(e) =>
                  setFilters({ ...filters, ageRange: e.target.value })
                }
              >
                <option value="all">{t("members.allAges")}</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55+">55+</option>
              </select>

              {/* Activity Status */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.activityStatus}
                onChange={(e) =>
                  setFilters({ ...filters, activityStatus: e.target.value })
                }
              >
                <option value="all">{t("members.allStatus")}</option>
                <option value="active">{t("members.active")}</option>
                <option value="inactive">{t("members.inactive")}</option>
                <option value="at-risk">{t("members.atRisk")}</option>
              </select>

              {/* Trainer */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={filters.trainer}
                onChange={(e) =>
                  setFilters({ ...filters, trainer: e.target.value })
                }
              >
                <option value="all">{t("members.allTrainers")}</option>
                <option value="sarah">Sarah Johnson</option>
                <option value="mike">Mike Chen</option>
                <option value="emma">Emma Davis</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Overview Cards Component
interface OverviewCardsProps {
  overview: {
    activeMembers: number;
    newThisPeriod: number;
    churnedThisPeriod: number;
    avgRetentionRate: number;
  };
  loading?: boolean;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ overview }) => {
  const { t } = useTranslation();

  const cards = [
    {
      title: t("members.activeMembers"),
      value: overview.activeMembers.toLocaleString(),
      subtitle: t("members.currentlyActiveMembers"),
      icon: FiUsers,
      color: "blue",
      trend: { value: 5.2, isPositive: true },
    },
    {
      title: t("members.newThisPeriod"),
      value: overview.newThisPeriod.toLocaleString(),
      subtitle: t("members.membersJoinedThisPeriod"),
      icon: FiUserPlus,
      color: "green",
      trend: { value: 12.3, isPositive: true },
    },
    {
      title: t("members.churnedThisPeriod"),
      value: overview.churnedThisPeriod.toLocaleString(),
      subtitle: t("members.membersWhoLeft"),
      icon: FiUserCheck,
      color: "red",
      trend: { value: 8.1, isPositive: false },
    },
    {
      title: t("members.avgRetentionRate"),
      value: `${overview.avgRetentionRate}%`,
      subtitle: t("members.averageMemberRetention"),
      icon: FiTarget,
      color: "purple",
      trend: { value: 2.1, isPositive: true },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-2xl bg-${card.color}-50 dark:bg-${card.color}-900/30 flex items-center justify-center`}
            >
              <card.icon className={`w-6 h-6 text-${card.color}-600 dark:text-${card.color}-400`} />
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
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{card.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Engagement Cards Component
interface EngagementCardsProps {
  engagement: {
    sessionsBooked: number;
    avgSessionsPerMember: number;
    topClasses: Array<{ name: string; sessions: number }>;
  };
  loading?: boolean;
}

const EngagementCards: React.FC<EngagementCardsProps> = ({ engagement }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sessions Booked */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <FiCalendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className={isRTL ? "text-left" : "text-right"}>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {engagement.sessionsBooked.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("members.sessionsBooked")}</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: "75%" }}
          ></div>
        </div>
      </div>

      {/* Avg Sessions per Member */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <FiActivity className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className={isRTL ? "text-left" : "text-right"}>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {engagement.avgSessionsPerMember}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t("members.avgSessionsPerMember")}
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: "68%" }}
          ></div>
        </div>
      </div>

      {/* Top Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <FiStar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className={isRTL ? "text-left" : "text-right"}>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{t("members.top3")}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("members.mostPopularClasses")}</div>
          </div>
        </div>
        <div className="space-y-2">
          {engagement.topClasses.map((classItem) => (
            <div
              key={classItem.name}
              className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between text-sm`}
            >
              <span className="text-gray-600 dark:text-gray-400">{classItem.name}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {classItem.sessions}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Demographic Cards Component with Modern Charts
interface DemographicCardsProps {
  demographics: {
    genderSplit: Array<{ gender: string; count: number; percentage: number }>;
    ageDistribution: Array<{ range: string; count: number }>;
    membershipTypes: Array<{ type: string; count: number; percentage: number }>;
  };
  loading?: boolean;
}

const DemographicCards: React.FC<DemographicCardsProps> = ({ demographics }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Gender Split Chart Data
  const genderChartData = {
    labels: demographics.genderSplit.map((item) => item.gender),
    datasets: [
      {
        data: demographics.genderSplit.map((item) => item.count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // Blue
          "rgba(236, 72, 153, 0.8)", // Pink
          "rgba(34, 197, 94, 0.8)", // Green
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(236, 72, 153, 1)",
          "rgba(34, 197, 94, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Age Distribution Chart Data
  const ageChartData = {
    labels: demographics.ageDistribution.map((item) => item.range),
    datasets: [
      {
        label: t("members.members"),
        data: demographics.ageDistribution.map((item) => item.count),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Membership Types Chart Data
  const membershipChartData = {
    labels: demographics.membershipTypes.map((item) => item.type),
    datasets: [
      {
        data: demographics.membershipTypes.map((item) => item.count),
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
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-start">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-start">
          {t("members.genderSplit", "توزيع الجنسين")}
        </h3>
        <div className="h-64">
          <Doughnut data={genderChartData} options={chartOptions} />
        </div>
      </div>

      {/* Age Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-start">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-start">
          {t("members.ageDistribution", "التوزيع العمري")}
        </h3>
        <div className="h-64">
          <Bar data={ageChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Membership Type Split */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-start">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-start">
          {t("members.membershipTypes", "أنواع العضويات")}
        </h3>
        <div className="h-64">
          <Doughnut data={membershipChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

// Risk & Opportunity Cards Component
interface RiskOpportunityCardsProps {
  riskOpportunity: {
    inactiveMembers: number;
    almostChurned: number;
    highValue: number;
    referralActive: number;
    unengagedNew: number;
  };
  loading?: boolean;
}

const RiskOpportunityCards: React.FC<RiskOpportunityCardsProps> = ({ riskOpportunity }) => {
  const { t } = useTranslation();

  const cards = [
    {
      title: t("members.inactiveMembers"),
      value: riskOpportunity.inactiveMembers,
      subtitle: t("members.noActivity14Days"),
      icon: FiAlertTriangle,
      color: "red",
      action: t("members.reEngage"),
    },
    {
      title: t("members.almostChurned"),
      value: riskOpportunity.almostChurned,
      subtitle: t("members.renewalDue7Days"),
      icon: FiAlertCircle,
      color: "orange",
      action: t("members.contact"),
    },
    {
      title: t("members.highValue"),
      value: riskOpportunity.highValue,
      subtitle: t("members.sessionsPerWeek"),
      icon: FiStar,
      color: "green",
      action: t("members.reward"),
    },
    {
      title: t("members.referralActive"),
      value: riskOpportunity.referralActive,
      subtitle: t("members.membersWithReferrals"),
      icon: FiGift,
      color: "blue",
      action: t("members.incentivize"),
    },
    {
      title: t("members.unengagedNew"),
      value: riskOpportunity.unengagedNew,
      subtitle: t("members.joined30Days1Session"),
      icon: FiUserPlus,
      color: "yellow",
      action: t("members.onboard"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              {card.action}
            </button>
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

// Revenue Cards Component
interface RevenueCardsProps {
  revenue: {
    totalRevenue: number;
    avgRevenuePerMember: number;
    estimatedLTV: number;
  };
  loading?: boolean;
}

const RevenueCards: React.FC<RevenueCardsProps> = ({ revenue }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Total Revenue */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className={isRTL ? "text-left" : "text-right"}>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${revenue.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("members.totalRevenue")}</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: "85%" }}
          ></div>
        </div>
      </div>

      {/* Avg Revenue per Member */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <FiCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className={isRTL ? "text-left" : "text-right"}>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${revenue.avgRevenuePerMember}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("members.avgRevenuePerMember")}</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: "72%" }}
          ></div>
        </div>
      </div>

      {/* Estimated LTV */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <FiTrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className={isRTL ? "text-left" : "text-right"}>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${revenue.estimatedLTV}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("members.estimatedLTV")}</div>
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
interface AnalyticsChartsProps {
  charts: {
    memberGrowth: Array<{ month: string; active: number }>;
    churnTrend: Array<{ month: string; churned: number }>;
    revenueTrend: Array<{ month: string; revenue: number }>;
  };
  loading?: boolean;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ charts }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Member Growth Chart
  const memberGrowthData = {
    labels: charts.memberGrowth.map((item) => item.month),
    datasets: [
      {
        label: t("members.activeMembers"),
        data: charts.memberGrowth.map((item) => item.active),
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

  // Revenue Trend Chart
  const revenueTrendData = {
    labels: charts.revenueTrend.map((item) => item.month),
    datasets: [
      {
        label: t("members.revenue"),
        data: charts.revenueTrend.map((item) => item.revenue),
        borderColor: "rgba(34, 197, 94, 1)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(34, 197, 94, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  // Churn Trend Chart
  const churnTrendData = {
    labels: charts.churnTrend.map((item) => item.month),
    datasets: [
      {
        label: t("members.churnedMembers"),
        data: charts.churnTrend.map((item) => item.churned),
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

  return (
    <div className="space-y-6">
      {/* Member Growth Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-start">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-start">
          {t("members.memberGrowth", "نمو الأعضاء")}
        </h3>
        <div className="h-80">
          <Line data={memberGrowthData} options={lineChartOptions} />
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-start">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-start">
          {t("members.revenueTrend", "اتجاه الإيرادات")}
        </h3>
        <div className="h-80">
          <Line data={revenueTrendData} options={lineChartOptions} />
        </div>
      </div>

      {/* Churn Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-start">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-start">
          {t("members.churnTrend", "اتجاه المغادرة")}
        </h3>
        <div className="h-80">
          <Line data={churnTrendData} options={lineChartOptions} />
        </div>
      </div>
    </div>
  );
};

// Main Analytics Tab Component
interface AnalyticsTabStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

interface AnalyticsTabProps {
  members?: Member[];
  stats?: AnalyticsTabStats;
  // TODO: shape of the filter payload is not determined by this file; the
  // current caller passes a no-arg callback, so this is left as unknown.
  onFilterMembers?: (filter: unknown) => void;
  refreshKey?: number;
}

// Local shape of the JSON `metadata` column on the members table, as
// consumed within this file (gender, age, last check-in, referrals).
interface MemberMetadata {
  gender?: string;
  age?: number;
  last_check_in?: string;
  referrals?: unknown[];
}

interface AnalyticsData {
  overview: {
    activeMembers: number;
    newThisPeriod: number;
    churnedThisPeriod: number;
    avgRetentionRate: number;
  };
  engagement: {
    sessionsBooked: number;
    avgSessionsPerMember: number;
    topClasses: Array<{ name: string; sessions: number }>;
  };
  demographics: {
    genderSplit: Array<{ gender: string; count: number; percentage: number }>;
    ageDistribution: Array<{ range: string; count: number }>;
    membershipTypes: Array<{ type: string; count: number; percentage: number }>;
  };
  riskOpportunity: {
    inactiveMembers: number;
    almostChurned: number;
    highValue: number;
    referralActive: number;
    unengagedNew: number;
  };
  revenue: {
    totalRevenue: number;
    avgRevenuePerMember: number;
    estimatedLTV: number;
  };
  charts: {
    memberGrowth: Array<{ month: string; active: number }>;
    churnTrend: Array<{ month: string; churned: number }>;
    revenueTrend: Array<{ month: string; revenue: number }>;
  };
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  refreshKey = 0,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { user, tenantId: contextTenantId } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError(t("members.userNotAuthenticated"));
        setLoading(false);
        return;
      }

      // Get tenant_id from context first, then try user metadata, then memberships
      let tenantId = contextTenantId || user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }

      if (!tenantId) {
        setError(t("members.tenantIdNotFound"));
        setLoading(false);
        return;
      }

      const formatDate = (date: Date) => date.toISOString().split("T")[0];
      const now = dayjs();
      const periodStart = now.subtract(30, "days").toDate();
      const periodEnd = now.toDate();

      // Fetch all necessary data in parallel
      const [
        allMembersResult,
        newMembersResult,
        bookingsResult,
        classesResult,
        invoicesResult,
      ] = await Promise.all([
        // All members
        supabase
          .from("members")
          .select("id, status, created_at, join_date, expiry_date, membership_type, metadata")
          .eq("tenant_id", tenantId),
        // New members this period
        supabase
          .from("members")
          .select("id, status, created_at, join_date")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(periodStart))
          .lte("created_at", formatDate(periodEnd)),
        // Bookings
        supabase
          .from("class_bookings")
          .select("id, class_id, member_id, created_at, status")
          .eq("tenant_id", tenantId)
          .in("status", ["booked", "checked_in", "completed"]),
        // Classes with names
        supabase
          .from("classes")
          .select("id, name")
          .eq("tenant_id", tenantId),
        // Invoices for revenue
        supabase
          .from("invoices")
          .select("amount, created_at, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid"),
      ]);

      const allMembers = allMembersResult.data || [];
      const newMembers = newMembersResult.data || [];
      const bookings = bookingsResult.data || [];
      const classes = classesResult.data || [];
      const invoices = invoicesResult.data || [];

      // Calculate overview metrics
      const activeMembers = allMembers.filter(
        (m) => m.status === "active" || m.status === "Active"
      ).length;

      const newThisPeriod = newMembers.length;

      // Calculate churned (members who became inactive this period)
      // This is a simplification - ideally track status changes
      const churnedThisPeriod = allMembers.filter((m) => {
        if (m.status !== "inactive") return false;
        const expiryDate = m.expiry_date ? dayjs(m.expiry_date) : null;
        if (expiryDate && expiryDate.isAfter(dayjs(periodStart)) && expiryDate.isBefore(dayjs(periodEnd))) {
          return true;
        }
        return false;
      }).length;

      // Calculate retention rate
      const totalMembers = allMembers.length;
      const retainedMembers = allMembers.filter((m) => {
        if (m.status === "inactive") return false;
        const expiryDate = m.expiry_date ? dayjs(m.expiry_date) : null;
        if (expiryDate && expiryDate.isBefore(now)) return false;
        return true;
      }).length;
      const avgRetentionRate = totalMembers > 0 ? (retainedMembers / totalMembers) * 100 : 0;

      // Calculate engagement metrics
      const sessionsBooked = bookings.length;
      const avgSessionsPerMember = activeMembers > 0 ? sessionsBooked / activeMembers : 0;

      // Calculate top classes
      const classMap = new Map(classes.map((c) => [c.id, c.name]));
      const classBookingsCount = new Map<string, number>();
      bookings.forEach((booking) => {
        const className = classMap.get(booking.class_id) || "Unknown";
        classBookingsCount.set(className, (classBookingsCount.get(className) || 0) + 1);
      });
      const topClasses = Array.from(classBookingsCount.entries())
        .map(([name, sessions]) => ({ name, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 3);

      // Calculate demographics
      const genderCounts = new Map<string, number>();
      const ageRanges = {
        "18-24": 0,
        "25-34": 0,
        "35-44": 0,
        "45-54": 0,
        "55+": 0,
      };
      const membershipTypeCounts = new Map<string, number>();

      allMembers.forEach((member) => {
        // Gender from metadata
        const gender = (member.metadata as MemberMetadata | null)?.gender || "Other";
        genderCounts.set(gender, (genderCounts.get(gender) || 0) + 1);

        // Age from metadata or calculate from join_date
        const age = (member.metadata as MemberMetadata | null)?.age;
        if (age) {
          if (age >= 18 && age <= 24) ageRanges["18-24"]++;
          else if (age >= 25 && age <= 34) ageRanges["25-34"]++;
          else if (age >= 35 && age <= 44) ageRanges["35-44"]++;
          else if (age >= 45 && age <= 54) ageRanges["45-54"]++;
          else if (age >= 55) ageRanges["55+"]++;
        }

        // Membership type
        const membershipType = member.membership_type || "Monthly";
        membershipTypeCounts.set(membershipType, (membershipTypeCounts.get(membershipType) || 0) + 1);
      });

      const totalForGender = Array.from(genderCounts.values()).reduce((a, b) => a + b, 0);
      const genderSplit = Array.from(genderCounts.entries()).map(([gender, count]) => ({
        gender,
        count,
        percentage: totalForGender > 0 ? Math.round((count / totalForGender) * 100) : 0,
      }));

      const ageDistribution = Object.entries(ageRanges).map(([range, count]) => ({
        range,
        count,
      }));

      const totalForMembership = Array.from(membershipTypeCounts.values()).reduce((a, b) => a + b, 0);
      const membershipTypes = Array.from(membershipTypeCounts.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: totalForMembership > 0 ? Math.round((count / totalForMembership) * 100) : 0,
      }));

      // Calculate risk & opportunity
      const fourteenDaysAgo = now.subtract(14, "days");
      const inactiveMembers = allMembers.filter((m) => {
        if (m.status === "inactive") return true;
        const lastCheckIn = (m.metadata as MemberMetadata | null)?.last_check_in;
        if (lastCheckIn && dayjs(lastCheckIn).isBefore(fourteenDaysAgo)) return true;
        return false;
      }).length;

      const sevenDaysFromNow = now.add(7, "days");
      const almostChurned = allMembers.filter((m) => {
        const expiryDate = m.expiry_date ? dayjs(m.expiry_date) : null;
        if (!expiryDate) return false;
        return expiryDate.isBefore(sevenDaysFromNow) && expiryDate.isAfter(now);
      }).length;

      // High value: members with 4+ sessions/week (simplified)
      const highValue = Math.floor(activeMembers * 0.1); // 10% of active members

      // Referral active (from metadata)
      const referralActive = allMembers.filter((m) => {
        const referrals = (m.metadata as MemberMetadata | null)?.referrals || [];
        return referrals.length > 0;
      }).length;

      // Unengaged new: joined 30 days ago, ≤1 session
      const thirtyDaysAgo = now.subtract(30, "days");
      const unengagedNew = allMembers.filter((m) => {
        const joinDate = m.join_date ? dayjs(m.join_date) : dayjs(m.created_at);
        if (!joinDate.isAfter(thirtyDaysAgo)) return false;
        const memberBookings = bookings.filter((b) => b.member_id === m.id);
        return memberBookings.length <= 1;
      }).length;

      // Calculate revenue
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const avgRevenuePerMember = activeMembers > 0 ? totalRevenue / activeMembers : 0;
      // Estimated LTV: average monthly revenue * 12 months
      const estimatedLTV = avgRevenuePerMember * 12;

      // Calculate chart data (last 4 months)
      const chartData: {
        memberGrowth: Array<{ month: string; active: number }>;
        churnTrend: Array<{ month: string; churned: number }>;
        revenueTrend: Array<{ month: string; revenue: number }>;
      } = {
        memberGrowth: [],
        churnTrend: [],
        revenueTrend: [],
      };

      for (let i = 3; i >= 0; i--) {
        const monthDate = now.subtract(i, "months");
        const monthStart = new Date(monthDate.year(), monthDate.month(), 1);
        const monthEnd = new Date(monthDate.year(), monthDate.month() + 1, 0, 23, 59, 59, 999);
        const monthName = monthDate.format("MMM");

        // Active members at end of month
        const activeAtMonthEnd = allMembers.filter((m) => {
          const joinDate = m.join_date ? dayjs(m.join_date) : dayjs(m.created_at);
          return joinDate.isBefore(monthEnd) && (m.status === "active" || m.status === "Active");
        }).length;

        // Churned in month
        const churnedInMonth = allMembers.filter((m) => {
          if (m.status !== "inactive") return false;
          const expiryDate = m.expiry_date ? dayjs(m.expiry_date) : null;
          if (!expiryDate) return false;
          return expiryDate.isAfter(monthStart) && expiryDate.isBefore(monthEnd);
        }).length;

        // Revenue in month
        const revenueInMonth = invoices
          .filter((inv) => {
            const invDate = dayjs(inv.created_at);
            return invDate.isAfter(monthStart) && invDate.isBefore(monthEnd);
          })
          .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        chartData.memberGrowth.push({ month: monthName, active: activeAtMonthEnd });
        chartData.churnTrend.push({ month: monthName, churned: churnedInMonth });
        chartData.revenueTrend.push({ month: monthName, revenue: revenueInMonth });
      }

      const data: AnalyticsData = {
        overview: {
          activeMembers,
          newThisPeriod,
          churnedThisPeriod,
          avgRetentionRate: Math.round(avgRetentionRate * 10) / 10,
        },
        engagement: {
          sessionsBooked,
          avgSessionsPerMember: Math.round(avgSessionsPerMember * 10) / 10,
          topClasses,
        },
        demographics: {
          genderSplit,
          ageDistribution,
          membershipTypes,
        },
        riskOpportunity: {
          inactiveMembers,
          almostChurned,
          highValue,
          referralActive,
          unengagedNew,
        },
        revenue: {
          totalRevenue: Math.round(totalRevenue),
          avgRevenuePerMember: Math.round(avgRevenuePerMember * 10) / 10,
          estimatedLTV: Math.round(estimatedLTV),
        },
        charts: chartData,
      };

      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(t("members.failedToLoadAnalytics"));
    } finally {
      setLoading(false);
    }
  }, [user, contextTenantId, t]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <FiRefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{t("members.loadingAnalyticsData")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => fetchAnalyticsData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("members.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="space-y-6 text-start" dir={isRTL ? "rtl" : "ltr"}>
      {/* Filters */}
      <AnalyticsFilters />

      {/* Overview Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-start">
          <span>🎯</span>
          <span>{t("dashboard.overview", "نظرة عامة")}</span>
        </h2>
        <OverviewCards overview={analyticsData.overview} loading={loading} />
      </div>

      {/* Engagement Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-start">
          <span>📊</span>
          <span>{t("members.memberEngagement", "تفاعل الأعضاء")}</span>
        </h2>
        <EngagementCards engagement={analyticsData.engagement} loading={loading} />
      </div>

      {/* Demographic Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-start">
          <span>👥</span>
          <span>{t("members.demographics", "البيانات الديموغرافية")}</span>
        </h2>
        <DemographicCards demographics={analyticsData.demographics} loading={loading} />
      </div>

      {/* Risk & Opportunity Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-start">
          <span>⚠️</span>
          <span>{t("members.riskOpportunity", "المخاطر والفرص")}</span>
        </h2>
        <RiskOpportunityCards riskOpportunity={analyticsData.riskOpportunity} loading={loading} />
      </div>

      {/* Revenue Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-start">
          <span>💰</span>
          <span>{t("members.revenue", "الإيرادات")}</span>
        </h2>
        <RevenueCards revenue={analyticsData.revenue} loading={loading} />
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-start">
          <span>📈</span>
          <span>{t("analytics.charts", "الرسوم البيانية")}</span>
        </h2>
        <AnalyticsCharts charts={analyticsData.charts} loading={loading} />
      </div>
    </div>
  );
};

export default AnalyticsTab;
