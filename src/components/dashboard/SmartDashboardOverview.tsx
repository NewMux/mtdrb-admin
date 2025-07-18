import React from "react";
import { FiTrendingUp, FiUsers, FiCreditCard, FiCalendar, FiTarget, FiZap, FiCpu, FiAlertCircle, FiTrendingDown } from "react-icons/fi";

interface SmartDashboardOverviewProps {
  refreshKey: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, trend, icon, color, subtitle }) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'green':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'red':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'purple':
        return 'bg-violet-50 text-violet-600 border-violet-200';
      case 'orange':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${getColorClasses(color)}`}>
          {icon}
        </div>
        <div className={`flex items-center space-x-1 text-sm font-medium ${getTrendColor(trend)}`}>
          {trend === 'up' && <FiTrendingUp className="h-4 w-4" />}
          {trend === 'down' && <FiTrendingDown className="h-4 w-4" />}
          <span>{change}</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

interface AIInsightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  value?: string;
}

const AIInsight: React.FC<AIInsightProps> = ({ icon, title, description, action, priority, value }) => {
  const priorityColors = {
    high: "border-red-200 bg-red-50",
    medium: "border-yellow-200 bg-yellow-50", 
    low: "border-blue-200 bg-blue-50"
  };

  return (
    <div className={`p-4 rounded-2xl border ${priorityColors[priority]} hover:shadow-md transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {icon}
          </div>
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
      </div>
    </div>
  );
};

export const SmartDashboardOverview: React.FC<SmartDashboardOverviewProps> = ({ refreshKey }) => {
  const kpis = [
    {
      title: "Active Members",
      value: 1247,
      change: "+12.5%",
      trend: "up" as const,
      icon: <FiUsers className="h-6 w-6 text-blue-600" />,
      color: "blue",
      subtitle: "vs last month"
    },
    {
      title: "Monthly Revenue",
      value: "₹24.5k",
      change: "+18.2%",
      trend: "up" as const,
      icon: <FiCreditCard className="h-6 w-6 text-green-600" />,
      color: "green",
      subtitle: "Target: ₹25k"
    },
    {
      title: "Class Attendance",
      value: "89.4%",
      change: "+5.3%",
      trend: "up" as const,
      icon: <FiCalendar className="h-6 w-6 text-purple-600" />,
      color: "purple",
      subtitle: "Average this week"
    },
    {
      title: "Member Retention",
      value: "94.2%",
      change: "+2.1%",
      trend: "up" as const,
      icon: <FiTarget className="h-6 w-6 text-orange-600" />,
      color: "orange",
      subtitle: "12-month average"
    }
  ];

  const aiInsights = [
    {
      icon: <FiTrendingUp className="h-5 w-5 text-green-600" />,
      title: "Peak Hour Optimization",
      description: "Tuesday 6-7 PM shows 40% higher attendance. Consider adding more classes.",
      action: "Schedule Class",
      priority: "high" as const,
      value: "+40% attendance"
    },
    {
      icon: <FiUsers className="h-5 w-5 text-blue-600" />,
      title: "Member Churn Risk",
      description: "12 members haven't visited in 14+ days. Send re-engagement campaign.",
      action: "Send Campaign",
      priority: "medium" as const,
      value: "12 at-risk"
    },
    {
      icon: <FiCreditCard className="h-5 w-5 text-yellow-600" />,
      title: "Payment Optimization",
      description: "Monthly billing shows 23% higher retention vs quarterly.",
      action: "Adjust Plans",
      priority: "low" as const,
      value: "+23% retention"
    },
    {
      icon: <FiZap className="h-5 w-5 text-purple-600" />,
      title: "Trainer Performance",
      description: "Sarah leads with 98% attendance rate. Share best practices.",
      action: "View Details",
      priority: "low" as const,
      value: "98% rate"
    }
  ];

  const quickStats = [
    { label: "Today's Check-ins", value: 89, color: "text-blue-600" },
    { label: "Classes Running", value: 6, color: "text-green-600" },
    { label: "Pending Payments", value: 3, color: "text-red-600" },
    { label: "New Signups", value: 4, color: "text-purple-600" }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Smart Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">AI-powered insights for your gym management</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-4 text-sm">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FiCpu className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">AI Insights & Recommendations</h2>
          </div>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            Live Updates
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {aiInsights.map((insight, index) => (
            <AIInsight key={index} {...insight} />
          ))}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trends</h3>
          <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <FiTrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Interactive revenue chart will appear here</p>
              <p className="text-sm text-gray-500 mt-2">+18.2% growth this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Activity</h3>
          <div className="space-y-4">
            {[
              { time: "2 min ago", event: "New member: Sarah Johnson", type: "member" },
              { time: "5 min ago", event: "Class check-in: HIIT Training", type: "class" },
              { time: "12 min ago", event: "Payment received: ₹2,500", type: "payment" },
              { time: "18 min ago", event: "Class booking: Yoga Session", type: "booking" },
              { time: "25 min ago", event: "Member renewed: Premium Plan", type: "renewal" }
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-2xl">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'member' ? 'bg-green-500' :
                  activity.type === 'class' ? 'bg-blue-500' :
                  activity.type === 'payment' ? 'bg-yellow-500' :
                  activity.type === 'booking' ? 'bg-purple-500' : 'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.event}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
