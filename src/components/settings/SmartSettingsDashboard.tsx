import React from "react";
import {
  FiSettings,
  FiUser,
  FiBell,
  FiShield,
  FiCreditCard,
  FiLink,
  FiServer,
  FiZap,
} from "react-icons/fi";

interface SmartSettingsDashboardProps {
  refreshKey: number;
}

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "configured" | "incomplete" | "disabled";
  lastUpdated: string;
  onClick?: () => void;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  icon,
  status,
  lastUpdated,
  onClick,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "configured":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "incomplete":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "disabled":
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "configured":
        return "✓ Configured";
      case "incomplete":
        return "⚠ Incomplete";
      case "disabled":
        return "○ Disabled";
    }
  };

  const getIconColor = () => {
    switch (status) {
      case "configured":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "incomplete":
        return "bg-orange-50 text-orange-600 border-orange-200";
      case "disabled":
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl border ${getIconColor()}`}>{icon}</div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
        >
          {getStatusText()}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <p className="text-xs text-gray-500">Last updated: {lastUpdated}</p>
    </div>
  );
};

export const SmartSettingsDashboard: React.FC<SmartSettingsDashboardProps> = ({
  refreshKey,
}) => {
  const settingsCategories = [
    {
      title: "System Configuration",
      description:
        "General system settings, timezone, language, and operational preferences",
      icon: <FiSettings className="h-6 w-6 text-blue-600" />,
      status: "configured" as const,
      lastUpdated: "2 hours ago",
    },
    {
      title: "User Preferences",
      description:
        "Personal settings, dashboard layout, and user interface customization",
      icon: <FiUser className="h-6 w-6 text-green-600" />,
      status: "configured" as const,
      lastUpdated: "1 day ago",
    },
    {
      title: "Notification Settings",
      description:
        "Email, SMS, push notification preferences and automation rules",
      icon: <FiBell className="h-6 w-6 text-purple-600" />,
      status: "incomplete" as const,
      lastUpdated: "3 days ago",
    },
    {
      title: "Security & Privacy",
      description:
        "Password policies, two-factor authentication, and data privacy settings",
      icon: <FiShield className="h-6 w-6 text-red-600" />,
      status: "configured" as const,
      lastUpdated: "1 week ago",
    },
    {
      title: "Billing Configuration",
      description:
        "Payment methods, billing cycles, tax settings, and invoice customization",
      icon: <FiCreditCard className="h-6 w-6 text-orange-600" />,
      status: "incomplete" as const,
      lastUpdated: "5 days ago",
    },
    {
      title: "Integrations",
      description:
        "Third-party app connections, API settings, and webhook configurations",
      icon: <FiLink className="h-6 w-6 text-indigo-600" />,
      status: "disabled" as const,
      lastUpdated: "Never",
    },
  ];

  const quickActions = [
    {
      title: "System Health Check",
      description: "Run diagnostic check on all system components",
      icon: <FiServer className="h-5 w-5 text-blue-600" />,
      action: "Run Check",
    },
    {
      title: "Backup Settings",
      description: "Create backup of all configuration settings",
      icon: <FiSettings className="h-5 w-5 text-green-600" />,
      action: "Create Backup",
    },
    {
      title: "Smart Recommendations",
      description: "Get Smart-powered optimization suggestions",
      icon: <FiZap className="h-5 w-5 text-purple-600" />,
      action: "Get Suggestions",
    },
  ];

  const systemStatus = {
    totalSettings: 6,
    configured: 3,
    incomplete: 2,
    disabled: 1,
    lastBackup: "2 days ago",
    systemHealth: "98%",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Smart Settings Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all system configurations and preferences
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Export Settings
          </button>
          <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Save Changes
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {systemStatus.configured}/{systemStatus.totalSettings}
              </p>
              <p className="text-gray-600">Configured</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <FiSettings className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {systemStatus.systemHealth}
              </p>
              <p className="text-gray-600">System Health</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <FiServer className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {systemStatus.incomplete}
              </p>
              <p className="text-gray-600">Need Attention</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <FiZap className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900">
                {systemStatus.lastBackup}
              </p>
              <p className="text-gray-600">Last Backup</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <FiShield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Configuration Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCategories.map((category, index) => (
            <SettingsCard key={index} {...category} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {action.description}
                  </p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    {action.action} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Recent Configuration Changes
        </h2>
        <div className="space-y-4">
          {[
            {
              action: "System timezone updated",
              user: "Admin",
              time: "2 hours ago",
              type: "system",
            },
            {
              action: "Notification preferences modified",
              user: "Sarah Johnson",
              time: "1 day ago",
              type: "user",
            },
            {
              action: "Security policy updated",
              user: "Admin",
              time: "3 days ago",
              type: "security",
            },
            {
              action: "Billing settings configured",
              user: "Admin",
              time: "1 week ago",
              type: "billing",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    activity.type === "system"
                      ? "bg-blue-500"
                      : activity.type === "user"
                        ? "bg-green-500"
                        : activity.type === "security"
                          ? "bg-red-500"
                          : "bg-orange-500"
                  }`}
                ></div>
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">by {activity.user}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
