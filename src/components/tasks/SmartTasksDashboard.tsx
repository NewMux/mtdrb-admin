import React from "react";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiCheckSquare,
  FiClock,
  FiTarget,
  FiUsers,
} from "react-icons/fi";

interface KPICardProps {
  title: string;
  value: string | number;
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
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700";
      case "green":
        return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700";
      case "red":
        return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700";
      case "yellow":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700";
      case "purple":
        return "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700";
      case "orange":
        return "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-700";
      default:
        return "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600";
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
        <h3 className="text-sm font-medium text-gray-600 mb-1">
          {title}
        </h3>
        <p className="text-2xl font-bold text-gray-900">
          {value}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

interface TaskInsightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
}

const TaskInsight: React.FC<TaskInsightProps> = ({
  icon,
  title,
  description,
  action,
  priority,
}) => {
  const priorityColors = {
    high: "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30",
    medium:
      "border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30",
    low: "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30",
  };

  const priorityBadges = {
    high: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    medium:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    low: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  };

  return (
    <div
      className={`p-4 rounded-2xl border ${priorityColors[priority]} hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {icon}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {title}
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {description}
            </p>
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
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

interface SmartTasksDashboardProps {
  refreshKey: number;
  stats: any;
}

export const SmartTasksDashboard: React.FC<SmartTasksDashboardProps> = () => {
  const kpis = [
    {
      title: "Active Tasks",
      value: 23,
      subtitle: "12 due today",
      icon: <FiCheckSquare className="h-6 w-6" />,
      trend: "up" as const,
      trendValue: "+15%",
      color: "blue",
    },
    {
      title: "Completion Rate",
      value: "89%",
      subtitle: "This week",
      icon: <FiTarget className="h-6 w-6" />,
      trend: "up" as const,
      trendValue: "+5%",
      color: "green",
    },
    {
      title: "Overdue Tasks",
      value: 4,
      subtitle: "Needs attention",
      icon: <FiClock className="h-6 w-6" />,
      trend: "down" as const,
      trendValue: "-25%",
      color: "red",
    },
    {
      title: "Team Productivity",
      value: "94%",
      subtitle: "Avg efficiency",
      icon: <FiUsers className="h-6 w-6" />,
      trend: "up" as const,
      trendValue: "+8%",
      color: "purple",
    },
  ];

  const insights = [
    {
      icon: <FiUsers className="h-5 w-5 text-blue-600" />,
      title: "Member Follow-ups Pending",
      description: "8 new members need welcome calls scheduled within 24 hours",
      action: "Schedule Calls",
      priority: "high" as const,
    },
    {
      icon: <FiClock className="h-5 w-5 text-yellow-600" />,
      title: "Class Preparation Tasks",
      description:
        "3 classes tomorrow need equipment setup and material preparation",
      action: "Prepare Classes",
      priority: "medium" as const,
    },
    {
      icon: <FiClock className="h-5 w-5 text-green-600" />,
      title: "Automation Opportunity",
      description: "Member check-ins can be automated to save 2 hours daily",
      action: "Setup Automation",
      priority: "low" as const,
    },
    {
      icon: <FiTrendingUp className="h-5 w-5 text-purple-600" />,
      title: "Performance Review Due",
      description: "2 trainers have quarterly reviews scheduled for this week",
      action: "Schedule Reviews",
      priority: "medium" as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Smart Tasks Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Smart-powered task management and productivity insights
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Export Report
          </button>
          <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Create Task
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
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors text-left">
            <FiUsers className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">
              Schedule Member Calls
            </h3>
            <p className="text-sm text-gray-600">
              Auto-assign follow-up calls
            </p>
          </button>
          <button className="p-4 bg-green-50 rounded-2xl hover:bg-green-100 transition-colors text-left">
            <FiCheckSquare className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">
              Bulk Task Creation
            </h3>
            <p className="text-sm text-gray-600">
              Create recurring tasks
            </p>
          </button>
          <button className="p-4 bg-purple-50 rounded-2xl hover:bg-purple-100 transition-colors text-left">
            <FiClock className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Setup Automation</h3>
            <p className="text-sm text-gray-600">Automate routine tasks</p>
          </button>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Smart Task Insights</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Live Updates
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <TaskInsight key={index} {...insight} />
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Task Categories
          </h3>
          <div className="space-y-3">
            {[
              {
                name: "Member Management",
                count: 12,
                color: "bg-blue-500",
                percentage: 52,
              },
              {
                name: "Class Preparation",
                count: 6,
                color: "bg-green-500",
                percentage: 26,
              },
              {
                name: "Staff Management",
                count: 3,
                color: "bg-yellow-500",
                percentage: 13,
              },
              {
                name: "Facility Maintenance",
                count: 2,
                color: "bg-purple-500",
                percentage: 9,
              },
            ].map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${category.color}`}
                  ></div>
                  <span className="text-gray-700">{category.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-900 font-medium">
                    {category.count}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Team Performance
          </h3>
          <div className="space-y-4">
            {[
              {
                name: "Sarah Johnson",
                role: "Front Desk",
                completion: 95,
                tasks: 8,
              },
              { name: "Mike Chen", role: "Trainer", completion: 89, tasks: 12 },
              {
                name: "Emma Davis",
                role: "Manager",
                completion: 92,
                tasks: 15,
              },
              {
                name: "Alex Rodriguez",
                role: "Maintenance",
                completion: 87,
                tasks: 6,
              },
            ].map((member) => (
              <div
                key={member.name}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {member.completion}%
                  </p>
                  <p className="text-sm text-gray-600">{member.tasks} tasks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
