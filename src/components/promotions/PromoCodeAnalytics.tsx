import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiUsers,
  FiPercent,
  FiCalendar,
  FiEye,
  FiDownload,
  FiGift,
  FiFilter,
  FiMapPin,
  FiUser,
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiAlertCircle,
  FiZap,
  FiAward,
  FiStar,
  FiTrendingDown as FiTrendingDownIcon,
  FiEye as FiEyeIcon,
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
  FiClock,
  FiMapPin as FiMapPinIcon,
  FiUser as FiUserIcon,
  FiUsers as FiUsersIcon,
  FiDollarSign as FiDollarSignIcon,
  FiTrendingUp as FiTrendingUpIcon,
  FiActivity as FiActivityIcon,
  FiTarget as FiTargetIcon,
  FiAward as FiAwardIcon,
  FiStar as FiStarIcon,
  FiHeart as FiHeartIcon,
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

// Mock data for the campaign performance dashboard
const mockCampaignAnalyticsData = {
  filters: {
    branches: [
      { id: "main", name: "Main Branch", selected: true },
      { id: "north", name: "North Branch", selected: false },
      { id: "south", name: "South Branch", selected: false },
      { id: "east", name: "East Branch", selected: false },
    ],
    promoTypes: [
      { id: "discount", name: "Discount", selected: true },
      { id: "free-session", name: "Free Session", selected: true },
      { id: "referral", name: "Referral", selected: true },
      { id: "bundle", name: "Bundle", selected: true },
    ],
    campaigns: [
      { id: "newyear2024", name: "New Year 2024", selected: true },
      { id: "friend50", name: "Friend 50", selected: true },
      { id: "student25", name: "Student 25", selected: true },
      { id: "holiday30", name: "Holiday 30", selected: true },
      { id: "summer20", name: "Summer 20", selected: false },
      { id: "backtoschool", name: "Back to School", selected: false },
    ],
    dateRanges: [
      { id: "last-7-days", name: "Last 7 Days", selected: false },
      { id: "last-30-days", name: "Last 30 Days", selected: false },
      { id: "last-90-days", name: "Last 90 Days", selected: true },
      { id: "this-year", name: "This Year", selected: false },
    ],
    targetAudiences: [
      { id: "all", name: "All", selected: true },
      { id: "new-members", name: "New Members", selected: false },
      { id: "returning", name: "Returning", selected: false },
      { id: "inactive", name: "Inactive", selected: false },
      { id: "high-value", name: "High Value", selected: false },
    ],
  },
  promotionsOverview: {
    totalCampaigns: 24,
    activeCampaignsNow: 8,
    redemptionRate: 18.7,
    avgConversionsPerCampaign: 45.2,
    totalRevenueGenerated: 45680,
    avgRevenuePerRedemption: 89.5,
  },
  charts: {
    redemptionsOverTime: [
      { date: "2024-01-01", redemptions: 12 },
      { date: "2024-01-02", redemptions: 18 },
      { date: "2024-01-03", redemptions: 15 },
      { date: "2024-01-04", redemptions: 22 },
      { date: "2024-01-05", redemptions: 28 },
      { date: "2024-01-06", redemptions: 25 },
      { date: "2024-01-07", redemptions: 31 },
      { date: "2024-01-08", redemptions: 35 },
      { date: "2024-01-09", redemptions: 42 },
      { date: "2024-01-10", redemptions: 38 },
      { date: "2024-01-11", redemptions: 45 },
      { date: "2024-01-12", redemptions: 52 },
      { date: "2024-01-13", redemptions: 48 },
      { date: "2024-01-14", redemptions: 55 },
      { date: "2024-01-15", redemptions: 61 },
      { date: "2024-01-16", redemptions: 58 },
      { date: "2024-01-17", redemptions: 64 },
      { date: "2024-01-18", redemptions: 67 },
      { date: "2024-01-19", redemptions: 72 },
      { date: "2024-01-20", redemptions: 69 },
      { date: "2024-01-21", redemptions: 75 },
      { date: "2024-01-22", redemptions: 78 },
      { date: "2024-01-23", redemptions: 82 },
      { date: "2024-01-24", redemptions: 85 },
      { date: "2024-01-25", redemptions: 89 },
      { date: "2024-01-26", redemptions: 92 },
      { date: "2024-01-27", redemptions: 88 },
      { date: "2024-01-28", redemptions: 95 },
      { date: "2024-01-29", redemptions: 98 },
      { date: "2024-01-30", redemptions: 102 },
    ],
    campaignEngagement: [
      {
        campaign: "New Year 2024",
        clicks: 450,
        opens: 380,
        redemptions: 67,
        conversion: 14.9,
      },
      {
        campaign: "Friend 50",
        clicks: 320,
        opens: 280,
        redemptions: 45,
        conversion: 14.1,
      },
      {
        campaign: "Student 25",
        clicks: 280,
        opens: 240,
        redemptions: 38,
        conversion: 13.6,
      },
      {
        campaign: "Holiday 30",
        clicks: 380,
        opens: 320,
        redemptions: 52,
        conversion: 13.7,
      },
      {
        campaign: "Summer 20",
        clicks: 220,
        opens: 180,
        redemptions: 28,
        conversion: 12.7,
      },
      {
        campaign: "Back to School",
        clicks: 190,
        opens: 150,
        redemptions: 22,
        conversion: 11.6,
      },
    ],
    promoTypePerformance: [
      {
        type: "Discount",
        redemptions: 156,
        percentage: 45.2,
        color: "#3B82F6",
      },
      {
        type: "Free Session",
        redemptions: 89,
        percentage: 25.8,
        color: "#10B981",
      },
      { type: "Referral", redemptions: 67, percentage: 19.4, color: "#F59E0B" },
      { type: "Bundle", redemptions: 33, percentage: 9.6, color: "#EF4444" },
    ],
    targetVsActualReach: [
      { campaign: "New Year 2024", planned: 1000, reached: 850, redeemed: 67 },
      { campaign: "Friend 50", planned: 800, reached: 720, redeemed: 45 },
      { campaign: "Student 25", planned: 600, reached: 540, redeemed: 38 },
      { campaign: "Holiday 30", planned: 900, reached: 780, redeemed: 52 },
      { campaign: "Summer 20", planned: 500, reached: 420, redeemed: 28 },
      { campaign: "Back to School", planned: 400, reached: 340, redeemed: 22 },
    ],
    branchLevelROI: [
      { branch: "Main Branch", revenue: 18500, cost: 4200, roi: 14300 },
      { branch: "North Branch", revenue: 12400, cost: 2800, roi: 9600 },
      { branch: "South Branch", revenue: 9800, cost: 2200, roi: 7600 },
      { branch: "East Branch", revenue: 4980, cost: 1200, roi: 3780 },
    ],
  },
  behavioralInsights: {
    topPerformingCampaigns: [
      { name: "New Year 2024", redemptionRate: 14.9, revenueLift: 18500 },
      { name: "Holiday 30", redemptionRate: 13.7, revenueLift: 15200 },
      { name: "Friend 50", redemptionRate: 14.1, revenueLift: 13400 },
    ],
    worstPerformingCampaigns: [
      { name: "Back to School", redemptionRate: 11.6, revenueLift: 4200 },
      { name: "Summer 20", redemptionRate: 12.7, revenueLift: 5800 },
      { name: "Student 25", redemptionRate: 13.6, revenueLift: 7200 },
    ],
    mostEngagedSegments: [
      {
        segment: "Inactive Members Aged 25-34",
        engagement: 23.4,
        redemptions: 45,
      },
      { segment: "New Members First Month", engagement: 21.8, redemptions: 38 },
      { segment: "High Value Members", engagement: 19.2, redemptions: 52 },
    ],
    bestRedemptionDays: [
      { day: "Monday", redemptions: 156, percentage: 18.2 },
      { day: "Tuesday", redemptions: 142, percentage: 16.5 },
      { day: "Wednesday", redemptions: 138, percentage: 16.1 },
      { day: "Thursday", redemptions: 145, percentage: 16.9 },
      { day: "Friday", redemptions: 167, percentage: 19.4 },
      { day: "Saturday", redemptions: 89, percentage: 10.4 },
      { day: "Sunday", redemptions: 23, percentage: 2.7 },
    ],
    conversionLag: { avgHours: 4.2, medianHours: 2.8, maxHours: 72 },
  },
  riskIndicators: {
    campaignsWithZeroRedemptions: {
      count: 3,
      campaigns: ["TEST123", "OLDCODE", "EXPIRED"],
    },
    negativeROIAlerts: { count: 2, campaigns: ["SUMMER20", "BACKTOSCHOOL"] },
    overlappingCampaigns: {
      count: 4,
      pairs: ["NEWYEAR+HOLIDAY", "STUDENT+FRIEND"],
    },
    dropOffFunnels: [
      { stage: "Reached", count: 1000, percentage: 100 },
      { stage: "Clicked", count: 450, percentage: 45 },
      { stage: "Opened", count: 380, percentage: 38 },
      { stage: "Redeemed", count: 67, percentage: 6.7 },
    ],
  },
};

// Filter Components - Updated to match other analytics tabs
const CampaignFilters: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    branch: "all",
    promoType: "all",
    campaign: "all",
    dateRange: "last90days",
    targetAudience: "all",
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
            Campaign Performance Filters
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

              {/* Promo Type */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.promoType}
                onChange={(e) =>
                  setFilters({ ...filters, promoType: e.target.value })
                }
              >
                <option value="all">All Types</option>
                <option value="discount">Discount</option>
                <option value="free-session">Free Session</option>
                <option value="referral">Referral</option>
                <option value="bundle">Bundle</option>
              </select>

              {/* Campaign */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.campaign}
                onChange={(e) =>
                  setFilters({ ...filters, campaign: e.target.value })
                }
              >
                <option value="all">All Campaigns</option>
                <option value="summer2024">Summer 2024</option>
                <option value="newyear2024">New Year 2024</option>
                <option value="referral">Referral Program</option>
                <option value="loyalty">Loyalty Rewards</option>
              </select>

              {/* Date Range */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
              >
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="last6months">Last 6 Months</option>
                <option value="lastyear">Last Year</option>
                <option value="thisyear">This Year</option>
              </select>

              {/* Target Audience */}
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.targetAudience}
                onChange={(e) =>
                  setFilters({ ...filters, targetAudience: e.target.value })
                }
              >
                <option value="all">All Audiences</option>
                <option value="new-members">New Members</option>
                <option value="existing-members">Existing Members</option>
                <option value="inactive-members">Inactive Members</option>
                <option value="premium-members">Premium Members</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Promotions Overview Cards - Updated to match other analytics tabs
const PromotionsOverviewCards: React.FC = () => {
  const { promotionsOverview } = mockCampaignAnalyticsData;

  const cards = [
    {
      title: "Total Campaigns",
      value: promotionsOverview.totalCampaigns.toLocaleString(),
      subtitle: "Campaigns in period",
      icon: FiGift,
      color: "purple",
      trend: { value: 15.3, isPositive: true },
    },
    {
      title: "Active Campaigns Now",
      value: promotionsOverview.activeCampaignsNow.toLocaleString(),
      subtitle: "Currently running",
      icon: FiPlay,
      color: "green",
      trend: { value: 8.7, isPositive: true },
    },
    {
      title: "Redemption Rate",
      value: `${promotionsOverview.redemptionRate}%`,
      subtitle: "Average redemption rate",
      icon: FiPercent,
      color: "blue",
      trend: { value: 2.1, isPositive: true },
    },
    {
      title: "Avg. Conversions per Campaign",
      value: promotionsOverview.avgConversionsPerCampaign.toFixed(1),
      subtitle: "Average conversions",
      icon: FiUsers,
      color: "orange",
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Total Revenue Generated",
      value: `$${promotionsOverview.totalRevenueGenerated.toLocaleString()}`,
      subtitle: "Revenue from promotions",
      icon: FiDollarSign,
      color: "green",
      trend: { value: 18.4, isPositive: true },
    },
    {
      title: "Avg. Revenue per Redemption",
      value: `$${promotionsOverview.avgRevenuePerRedemption.toFixed(1)}`,
      subtitle: "Average revenue per redemption",
      icon: FiTrendingUp,
      color: "indigo",
      trend: { value: 5.2, isPositive: true },
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

// Behavioral Insights - Updated to match other analytics tabs
const BehavioralInsightsCards: React.FC = () => {
  const { behavioralInsights } = mockCampaignAnalyticsData;

  const insights = [
    {
      title: "Top Performing Campaigns",
      value: behavioralInsights.topPerformingCampaigns[0].name,
      subtitle: `${behavioralInsights.topPerformingCampaigns[0].redemptionRate}% redemption rate`,
      icon: FiAward,
      color: "green",
      trend: { value: 15.2, isPositive: true },
    },
    {
      title: "Worst Performing Campaigns",
      value: behavioralInsights.worstPerformingCampaigns[0].name,
      subtitle: `${behavioralInsights.worstPerformingCampaigns[0].redemptionRate}% redemption rate`,
      icon: FiAlertTriangle,
      color: "red",
      trend: { value: 8.3, isPositive: false },
    },
    {
      title: "Most Engaged Segments",
      value: behavioralInsights.mostEngagedSegments[0].segment,
      subtitle: `${behavioralInsights.mostEngagedSegments[0].engagement}% engagement`,
      icon: FiUsers,
      color: "blue",
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Best Redemption Day",
      value: behavioralInsights.bestRedemptionDays[0].day,
      subtitle: `${behavioralInsights.bestRedemptionDays[0].percentage}% of redemptions`,
      icon: FiCalendar,
      color: "purple",
      trend: { value: 5.7, isPositive: true },
    },
    {
      title: "Avg. Conversion Lag",
      value: `${behavioralInsights.conversionLag.avgHours}h`,
      subtitle: `${behavioralInsights.conversionLag.medianHours}h median`,
      icon: FiClock,
      color: "orange",
      trend: { value: 2.1, isPositive: false },
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

// Risk & Opportunities - Updated to match other analytics tabs
const RiskOpportunitiesCards: React.FC = () => {
  const { riskIndicators } = mockCampaignAnalyticsData;

  const risks = [
    {
      title: "Campaigns With 0 Redemptions",
      value: riskIndicators.campaignsWithZeroRedemptions.count,
      subtitle: `${riskIndicators.campaignsWithZeroRedemptions.count} campaigns`,
      description: "No engagement detected",
      icon: FiAlertCircle,
      color: "red",
      trend: { value: 12.8, isPositive: false },
    },
    {
      title: "Negative ROI Alerts",
      value: riskIndicators.negativeROIAlerts.count,
      subtitle: `${riskIndicators.negativeROIAlerts.count} campaigns`,
      description: "Revenue < discount cost",
      icon: FiTrendingDown,
      color: "red",
      trend: { value: 18.2, isPositive: false },
    },
    {
      title: "Overlapping Campaigns",
      value: riskIndicators.overlappingCampaigns.count,
      subtitle: `${riskIndicators.overlappingCampaigns.count} pairs`,
      description: "Same segment, same time",
      icon: FiAlertTriangle,
      color: "orange",
      trend: { value: 5.3, isPositive: false },
    },
    {
      title: "Drop-off Rate",
      value: `${(((riskIndicators.dropOffFunnels[0].count - riskIndicators.dropOffFunnels[3].count) / riskIndicators.dropOffFunnels[0].count) * 100).toFixed(1)}%`,
      subtitle: "Reached to Redeemed",
      description: "High funnel drop-off",
      icon: FiTrendingDown,
      color: "yellow",
      trend: { value: 8.7, isPositive: false },
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
interface PromoCodeAnalyticsProps {
  promotions?: any[];
  stats?: any;
  onFilterPromotions?: (filter: any) => void;
}

const PromoCodeAnalytics: React.FC<PromoCodeAnalyticsProps> = ({
  promotions = [],
  stats = {},
  onFilterPromotions,
}) => {
  const [analyticsData, setAnalyticsData] = useState(mockCampaignAnalyticsData);

  useEffect(() => {
    const fetchCampaignAnalytics = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAnalyticsData(mockCampaignAnalyticsData);
    };

    fetchCampaignAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <CampaignFilters />

      {/* Promotions Overview */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📊 Promotions Overview
        </h2>
        <PromotionsOverviewCards />
      </div>

      {/* Campaign Performance */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📈 Campaign Performance
        </h2>
        <BehavioralInsightsCards />
      </div>

      {/* Risk & Opportunities */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          ⚠️ Risk & Opportunities
        </h2>
        <RiskOpportunitiesCards />
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📈 Charts & Visuals
        </h2>
        <div className="space-y-6">
          {/* Redemptions Over Time Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📈 Redemptions Over Time
            </h3>
            <div className="h-80">
              <Line
                data={(() => {
                  const data =
                    mockCampaignAnalyticsData.charts.redemptionsOverTime;
                  return {
                    labels: data.map((item) =>
                      new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      }),
                    ),
                    datasets: [
                      {
                        label: "Redemptions",
                        data: data.map((item) => item.redemptions),
                        borderColor: "rgba(147, 51, 234, 1)",
                        backgroundColor: "rgba(147, 51, 234, 0.1)",
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: "rgba(147, 51, 234, 1)",
                        pointBorderColor: "#fff",
                        pointBorderWidth: 2,
                        pointRadius: 6,
                      },
                    ],
                  };
                })()}
                options={{
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
                }}
              />
            </div>
          </div>

          {/* Campaign Engagement Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Campaign Engagement
            </h3>
            <div className="h-80">
              <Bar
                data={(() => {
                  const data =
                    mockCampaignAnalyticsData.charts.campaignEngagement;
                  return {
                    labels: data.map((item) => item.campaign),
                    datasets: [
                      {
                        label: "Clicks",
                        data: data.map((item) => item.clicks),
                        backgroundColor: "#3B82F6",
                        borderRadius: 4,
                      },
                      {
                        label: "Opens",
                        data: data.map((item) => item.opens),
                        backgroundColor: "#10B981",
                        borderRadius: 4,
                      },
                      {
                        label: "Redemptions",
                        data: data.map((item) => item.redemptions),
                        backgroundColor: "#F59E0B",
                        borderRadius: 4,
                      },
                    ],
                  };
                })()}
                options={{
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
                }}
              />
            </div>
          </div>

          {/* Promo Type Performance Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🥧 Promo Type Performance
            </h3>
            <div className="h-80">
              <Doughnut
                data={(() => {
                  const data =
                    mockCampaignAnalyticsData.charts.promoTypePerformance;
                  return {
                    labels: data.map((item) => item.type),
                    datasets: [
                      {
                        data: data.map((item) => item.redemptions),
                        backgroundColor: data.map((item) => item.color),
                        borderWidth: 2,
                        borderColor: "#ffffff",
                      },
                    ],
                  };
                })()}
                options={{
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
                }}
              />
            </div>
          </div>

          {/* Target vs Actual Reach Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🎯 Target vs Actual Reach
            </h3>
            <div className="h-80">
              <Bar
                data={(() => {
                  const data =
                    mockCampaignAnalyticsData.charts.targetVsActualReach;
                  return {
                    labels: data.map((item) => item.campaign),
                    datasets: [
                      {
                        label: "Planned",
                        data: data.map((item) => item.planned),
                        backgroundColor: "#6B7280",
                        borderRadius: 4,
                      },
                      {
                        label: "Reached",
                        data: data.map((item) => item.reached),
                        backgroundColor: "#3B82F6",
                        borderRadius: 4,
                      },
                      {
                        label: "Redeemed",
                        data: data.map((item) => item.redeemed),
                        backgroundColor: "#10B981",
                        borderRadius: 4,
                      },
                    ],
                  };
                })()}
                options={{
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
                }}
              />
            </div>
          </div>

          {/* Branch-Level ROI Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💰 Branch-Level ROI
            </h3>
            <div className="h-80">
              <Bar
                data={(() => {
                  const data = mockCampaignAnalyticsData.charts.branchLevelROI;
                  return {
                    labels: data.map((item) => item.branch),
                    datasets: [
                      {
                        label: "ROI",
                        data: data.map((item) => item.roi),
                        backgroundColor: "#10B981",
                        borderRadius: 4,
                      },
                    ],
                  };
                })()}
                options={{
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
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeAnalytics;
