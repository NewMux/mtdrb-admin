import React, { useState, useEffect, useCallback } from "react";
import {
  FiBell,
  FiMail,
  FiPhone,
  FiSettings,
  FiClock,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { fetchGymSettings, updateGymSettings } from "../../api/settings";

interface NotificationSettingsProps {
  refreshKey: number;
}

const DEFAULT_NOTIFICATION_SETTINGS = {
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
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  refreshKey,
}) => {
  const { t } = useTranslation();
  const { tenantId } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [existingMetadata, setExistingMetadata] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!tenantId) return;
      const { data } = await fetchGymSettings(tenantId);
      const metadata = data?.metadata || {};
      setExistingMetadata(metadata);
      const saved = metadata.notification_settings as
        | typeof DEFAULT_NOTIFICATION_SETTINGS
        | undefined;
      if (saved) {
        setSettings(saved);
      }
    };
    loadSettings();
  }, [tenantId, refreshKey]);

  const handleSaveSettings = useCallback(async () => {
    if (!tenantId) {
      toast.error(t("settings.noTenantIdFound"));
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await updateGymSettings(tenantId, {
        metadata: {
          ...existingMetadata,
          notification_settings: settings,
        },
      });
      if (error) throw error;
      toast.success(t("settings.notificationSettingsSaved"));
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      toast.error(t("settings.notificationSettingsSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [tenantId, existingMetadata, settings, t]);

  const handleTestNotification = useCallback((channel: string) => {
    toast(
      t("settings.testNotificationNotSetUp", { channel }),
      { icon: "ℹ️" },
    );
  }, [t]);

  const handleToggle = (path: string, value: boolean) => {
    const keys = path.split(".");
    setSettings((prev) => {
      const updated = { ...prev };
      let current = updated as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleInputChange = (path: string, value: string) => {
    const keys = path.split(".");
    setSettings((prev) => {
      const updated = { ...prev };
      let current = updated as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const channels = [
    {
      key: "emailNotifications",
      label: t("settings.emailNotifications"),
      description: t("settings.emailNotificationsDesc"),
      icon: <FiMail className="h-5 w-5 text-blue-600" />,
      enabled: settings.emailNotifications,
    },
    {
      key: "smsNotifications",
      label: t("settings.smsNotifications"),
      description: t("settings.smsNotificationsDesc"),
      icon: <FiPhone className="h-5 w-5 text-green-600" />,
      enabled: settings.smsNotifications,
    },
    {
      key: "pushNotifications",
      label: t("settings.pushNotifications"),
      description: t("settings.pushNotificationsDesc"),
      icon: <FiBell className="h-5 w-5 text-purple-600" />,
      enabled: settings.pushNotifications,
    },
    {
      key: "inAppNotifications",
      label: t("settings.inAppNotifications"),
      description: t("settings.inAppNotificationsDesc"),
      icon: <FiZap className="h-5 w-5 text-orange-600" />,
      enabled: settings.inAppNotifications,
    },
  ];

  const notificationTypes = [
    {
      key: "memberUpdates",
      label: t("settings.memberUpdates"),
      description: t("settings.memberUpdatesDesc"),
      enabled: settings.preferences.memberUpdates,
    },
    {
      key: "classReminders",
      label: t("settings.classReminders"),
      description: t("settings.classRemindersDesc"),
      enabled: settings.preferences.classReminders,
    },
    {
      key: "paymentAlerts",
      label: t("settings.paymentAlerts"),
      description: t("settings.paymentAlertsDesc"),
      enabled: settings.preferences.paymentAlerts,
    },
    {
      key: "systemAlerts",
      label: t("settings.systemAlerts"),
      description: t("settings.systemAlertsDesc"),
      enabled: settings.preferences.systemAlerts,
    },
    {
      key: "promotions",
      label: t("settings.promotionsMarketing"),
      description: t("settings.promotionsMarketingDesc"),
      enabled: settings.preferences.promotions,
    },
    {
      key: "reports",
      label: t("settings.reportsAnalytics"),
      description: t("settings.reportsAnalyticsDesc"),
      enabled: settings.preferences.reports,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("settings.notificationSettingsTitle")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("settings.notificationSettingsSubtitle")}
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]"
          >
            {isSaving ? t("settings.saving") : t("settings.saveSettings")}
          </button>
          <button
            onClick={() => handleTestNotification("email")}
            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]"
          >
            {t("settings.testEmail")}
          </button>
          <button
            onClick={() => handleTestNotification("SMS")}
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]"
          >
            {t("settings.testSms")}
          </button>
          <button
            onClick={() => handleTestNotification("push")}
            className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]"
          >
            {t("settings.testPush")}
          </button>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <FiBell className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("settings.notificationChannels")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((channel) => (
            <div
              key={channel.key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                  {channel.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{channel.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{channel.description}</p>
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
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <FiClock className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("settings.quietHoursTitle")}</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t("settings.enableQuietHours")}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("settings.limitNotificationsDesc")}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("settings.startTime")}
                </label>
                <input
                  type="time"
                  value={settings.quietHours.start}
                  onChange={(e) =>
                    handleInputChange("quietHours.start", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus:border-blue-600 focus:ring-0 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("settings.endTime")}
                </label>
                <input
                  type="time"
                  value={settings.quietHours.end}
                  onChange={(e) =>
                    handleInputChange("quietHours.end", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus:border-blue-600 focus:ring-0 dark:text-gray-100"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <FiUsers className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("settings.notificationTypesTitle")}
          </h2>
        </div>
        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"
            >
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{type.label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
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
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <FiSettings className="h-6 w-6 text-orange-600 dark:text-orange-400 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("settings.frequencySettingsTitle")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("settings.marketingNotifications")}
            </label>
            <select
              value={settings.frequency.marketing}
              onChange={(e) =>
                handleInputChange("frequency.marketing", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus:border-blue-600 focus:ring-0 dark:text-gray-100"
            >
              <option value="never">{t("settings.freqNever")}</option>
              <option value="weekly">{t("settings.freqWeekly")}</option>
              <option value="bi-weekly">{t("settings.freqBiWeekly")}</option>
              <option value="monthly">{t("settings.freqMonthly")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("settings.systemUpdates")}
            </label>
            <select
              value={settings.frequency.updates}
              onChange={(e) =>
                handleInputChange("frequency.updates", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus:border-blue-600 focus:ring-0 dark:text-gray-100"
            >
              <option value="immediate">{t("settings.freqImmediate")}</option>
              <option value="daily">{t("settings.freqDailySummary")}</option>
              <option value="weekly">{t("settings.freqWeeklySummary")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("settings.alertNotificationsLabel")}
            </label>
            <select
              value={settings.frequency.alerts}
              onChange={(e) =>
                handleInputChange("frequency.alerts", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus:border-blue-600 focus:ring-0 dark:text-gray-100"
            >
              <option value="immediate">{t("settings.freqImmediate")}</option>
              <option value="hourly">{t("settings.freqHourly")}</option>
              <option value="daily">{t("settings.freqDaily")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Test Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {t("settings.testNotificationsTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleTestNotification("email")}
            className="px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
          >
            {t("settings.testEmail")}
          </button>
          <button
            onClick={() => handleTestNotification("SMS")}
            className="px-4 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors"
          >
            {t("settings.testSms")}
          </button>
          <button
            onClick={() => handleTestNotification("push")}
            className="px-4 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-colors"
          >
            {t("settings.testPush")}
          </button>
          <button
            onClick={() => handleTestNotification("in-app")}
            className="px-4 py-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-colors"
          >
            {t("settings.testInApp")}
          </button>
        </div>
      </div>
    </div>
  );
};
