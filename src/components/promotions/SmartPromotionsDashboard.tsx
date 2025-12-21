import React from "react";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiGift,
  FiTarget,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiMail,
  FiPhone,
  FiZap,
  FiBarChart,
} from "react-icons/fi";

interface SmartPromotionsDashboardProps {
  refreshKey: number;
  stats: any;
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "green":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "yellow":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "red":
        return "bg-red-50 text-red-600 border-red-200";
      case "purple":
        return "bg-violet-50 text-violet-600 border-violet-200";
      case "orange":
        return "bg-orange-50 text-orange-600 border-orange-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-emerald-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${getColorClasses(color)}`}>
          {icon}
        </div>
        <div
          className={`flex items-center space-x-1 text-sm font-medium ${getTrendColor(trend)}`}
        >
          {trend === "up" && <FiTrendingUp className="h-4 w-4" />}
          {trend === "down" && <FiTrendingDown className="h-4 w-4" />}
          <span>{trendValue}</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

interface PromotionInsightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  value?: string;
}

const PromotionInsight: React.FC<PromotionInsightProps> = ({
  icon,
  title,
  description,
  action,
  priority,
  value,
}) => {
  const priorityColors = {
    high: "border-red-200 bg-red-50",
    medium: "border-yellow-200 bg-yellow-50",
    low: "border-blue-200 bg-blue-50",
  };

  const priorityBadges = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-blue-100 text-blue-800",
  };

  return (
    <div
      className={`p-4 rounded-2xl border ${priorityColors[priority]} hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900">{title}</h4>
              {value && (
                <span className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full text-xs font-medium">
                  {value}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-2">{description}</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              {action} →
            </button>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadges[priority]}`}
        >
          {priority.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

const SmartPromotionsDashboard: React.FC<SmartPromotionsDashboardProps> = ({
  refreshKey,
  stats,
}) => {
  const kpis = [
    {
      title: "Active Promotions",
      value: 8,
      subtitle: "3 expiring soon",
      icon: <FiGift className="h-6 w-6 text-purple-600" />,
      trend: "up" as const,
      trendValue: "+2",
      color: "purple",
    },
    {
      title: "Conversion Rate",
      value: "24.5%",
      subtitle: "Last 30 days",
      icon: <FiTarget className="h-6 w-6 text-green-600" />,
      trend: "up" as const,
      trendValue: "+3.2%",
      color: "green",
    },
    {
      title: "Promotion Revenue",
      value: "$12,450",
      subtitle: "This month",
      icon: <FiDollarSign className="h-6 w-6 text-blue-600" />,
      trend: "up" as const,
      trendValue: "+18%",
      color: "blue",
    },
    {
      title: "Engaged Members",
      value: 347,
      subtitle: "Used promotions",
      icon: <FiUsers className="h-6 w-6 text-orange-600" />,
      trend: "up" as const,
      trendValue: "+12%",
      color: "orange",
    },
  ];

  const insights = [
    {
      icon: <FiCalendar className="h-5 w-5 text-blue-600" />,
      title: "New Year Promotion Ready",
      description:
        "Create New Year fitness promotion targeting inactive members",
      action: "Create Campaign",
      priority: "high" as const,
      value: "1,200 eligible",
    },
    {
      icon: <FiMail className="h-5 w-5 text-green-600" />,
      title: "Email Campaign Performance",
      description: "Holiday promotion email had 32% open rate, 8% conversion",
      action: "View Analytics",
      priority: "medium" as const,
      value: "89 conversions",
    },
    {
      icon: <FiPhone className="h-5 w-5 text-purple-600" />,
      title: "Push Notification Opportunity",
      description:
        "Send push reminders to members who opened emails but didn't convert",
      action: "Send Push",
      priority: "medium" as const,
      value: "156 members",
    },
    {
      icon: <FiZap className="h-5 w-5 text-yellow-600" />,
      title: "Automation Optimization",
      description:
        "Member birthday promotions show 45% higher conversion rates",
      action: "Expand Automation",
      priority: "low" as const,
      value: "+45% ROI",
    },
  ];

  const topPromotions = [
    {
      name: "New Year Fitness Challenge",
      conversions: 89,
      revenue: "$4,450",
      roi: "340%",
    },
    {
      name: "Friend Referral Bonus",
      conversions: 67,
      revenue: "$3,350",
      roi: "280%",
    },
    {
      name: "Holiday Membership Special",
      conversions: 45,
      revenue: "$2,250",
      roi: "225%",
    },
    {
      name: "Student Discount Program",
      conversions: 34,
      revenue: "$1,700",
      roi: "190%",
    },
  ];

  const channelPerformance = [
    {
      channel: "Email",
      sent: 2450,
      opened: 784,
      converted: 156,
      rate: "19.9%",
    },
    {
      channel: "In-App",
      sent: 890,
      opened: 623,
      converted: 145,
      rate: "23.3%",
    },
    {
      channel: "Social Media",
      sent: 3200,
      opened: 1280,
      converted: 89,
      rate: "7.0%",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Smart Promotions Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Smart-powered promotion insights and performance analytics
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Export Report
          </button>
          <button className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Create Promotion
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-purple-50 rounded-2xl hover:bg-purple-100 transition-colors text-left">
            <FiGift className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">New Promotion</h3>
            <p className="text-sm text-gray-600">Create targeted campaign</p>
          </button>
          <button className="p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors text-left">
            <FiMail className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Email Blast</h3>
            <p className="text-sm text-gray-600">Send to segment</p>
          </button>
          <button className="p-4 bg-green-50 rounded-2xl hover:bg-green-100 transition-colors text-left">
            <FiBarChart className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">View performance</p>
          </button>
          <button className="p-4 bg-yellow-50 rounded-2xl hover:bg-yellow-100 transition-colors text-left">
            <FiZap className="h-6 w-6 text-yellow-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Automation</h3>
            <p className="text-sm text-gray-600">Setup workflows</p>
          </button>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Smart Promotion Insights
          </h2>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            Live Updates
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <PromotionInsight key={index} {...insight} />
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Top Performing Promotions
          </h3>
          <div className="space-y-4">
            {topPromotions.map((promo, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
              >
                <div>
                  <p className="font-medium text-gray-900">{promo.name}</p>
                  <p className="text-sm text-gray-600">
                    {promo.conversions} conversions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{promo.revenue}</p>
                  <p className="text-sm text-gray-600">{promo.roi} ROI</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Channel Performance
          </h3>
          <div className="space-y-4">
            {channelPerformance.map((channel, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {channel.channel}
                    </span>
                    <span className="font-bold text-blue-600">
                      {channel.rate}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(channel.converted / channel.sent) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{channel.sent} sent</span>
                    <span>{channel.converted} converted</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPromotionsDashboard;
export { SmartPromotionsDashboard };
