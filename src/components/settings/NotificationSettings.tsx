import React, { useState } from "react";
import {
  FiBell,
  FiMail,
  FiPhone,
  FiSettings,
  FiClock,
  FiUsers,
  FiZap,
  FiSave,
} from "react-icons/fi";

interface NotificationSettingsProps {
  refreshKey: number;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  refreshKey,
}) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    quietHours: {
      enabled: true,
      start: "22:00",
      end: "08:00",
    },
    frequency: {
      marketing: "weekly",
      updates: "daily",
      alerts: "immediate",
    },
    preferences: {
      memberUpdates: true,
      classReminders: true,
      paymentAlerts: true,
      systemAlerts: true,
      promotions: false,
      reports: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (path: string, value: boolean) => {
    const keys = path.split(".");
    setSettings((prev) => {
      const updated = { ...prev };
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleInputChange = (path: string, value: string) => {
    const keys = path.split(".");
    setSettings((prev) => {
      const updated = { ...prev };
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const channels = [
    {
      key: "emailNotifications",
      label: "Email Notifications",
      description: "Receive notifications via email",
      icon: <FiMail className="h-5 w-5 text-blue-600" />,
      enabled: settings.emailNotifications,
    },
    {
      key: "smsNotifications",
      label: "SMS Notifications",
      description: "Receive notifications via text message",
      icon: <FiPhone className="h-5 w-5 text-green-600" />,
      enabled: settings.smsNotifications,
    },
    {
      key: "pushNotifications",
      label: "Push Notifications",
      description: "Receive browser and mobile push notifications",
      icon: <FiBell className="h-5 w-5 text-purple-600" />,
      enabled: settings.pushNotifications,
    },
    {
      key: "inAppNotifications",
      label: "In-App Notifications",
      description: "Show notifications within the application",
      icon: <FiZap className="h-5 w-5 text-orange-600" />,
      enabled: settings.inAppNotifications,
    },
  ];

  const notificationTypes = [
    {
      key: "memberUpdates",
      label: "Member Updates",
      description: "New member registrations, profile changes",
      enabled: settings.preferences.memberUpdates,
    },
    {
      key: "classReminders",
      label: "Class Reminders",
      description: "Upcoming class notifications and changes",
      enabled: settings.preferences.classReminders,
    },
    {
      key: "paymentAlerts",
      label: "Payment Alerts",
      description: "Payment due dates, failed payments, receipts",
      enabled: settings.preferences.paymentAlerts,
    },
    {
      key: "systemAlerts",
      label: "System Alerts",
      description: "System maintenance, security alerts",
      enabled: settings.preferences.systemAlerts,
    },
    {
      key: "promotions",
      label: "Promotions & Marketing",
      description: "Special offers and promotional campaigns",
      enabled: settings.preferences.promotions,
    },
    {
      key: "reports",
      label: "Reports & Analytics",
      description: "Weekly reports and analytics summaries",
      enabled: settings.preferences.reports,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Notification Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Configure how and when you receive notifications
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Save Settings
          </button>
          <button className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Test Email
          </button>
          <button className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Test SMS
          </button>
          <button className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Test Push
          </button>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiBell className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">
            Notification Channels
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((channel) => (
            <div
              key={channel.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {channel.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{channel.label}</h3>
                  <p className="text-sm text-gray-600">{channel.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(channel.key, !channel.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  channel.enabled ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    channel.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiClock className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Quiet Hours</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div>
              <h3 className="font-medium text-gray-900">Enable Quiet Hours</h3>
              <p className="text-sm text-gray-600">
                Limit notifications during specified hours
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle("quietHours.enabled", !settings.quietHours.enabled)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.quietHours.enabled ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.quietHours.enabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {settings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.quietHours.start}
                  onChange={(e) =>
                    handleInputChange("quietHours.start", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.quietHours.end}
                  onChange={(e) =>
                    handleInputChange("quietHours.end", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiUsers className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">
            Notification Types
          </h2>
        </div>
        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
            >
              <div>
                <h3 className="font-medium text-gray-900">{type.label}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
              <button
                onClick={() =>
                  handleToggle(`preferences.${type.key}`, !type.enabled)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  type.enabled ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    type.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Frequency Settings */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiSettings className="h-6 w-6 text-orange-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">
            Frequency Settings
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marketing Notifications
            </label>
            <select
              value={settings.frequency.marketing}
              onChange={(e) =>
                handleInputChange("frequency.marketing", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            >
              <option value="never">Never</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Updates
            </label>
            <select
              value={settings.frequency.updates}
              onChange={(e) =>
                handleInputChange("frequency.updates", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily Summary</option>
              <option value="weekly">Weekly Summary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Notifications
            </label>
            <select
              value={settings.frequency.alerts}
              onChange={(e) =>
                handleInputChange("frequency.alerts", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
      </div>

      {/* Test Notifications */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Test Notifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button className="px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors">
            Test Email
          </button>
          <button className="px-4 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors">
            Test SMS
          </button>
          <button className="px-4 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-colors">
            Test Push
          </button>
          <button className="px-4 py-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-colors">
            Test In-App
          </button>
        </div>
      </div>
    </div>
  );
};
