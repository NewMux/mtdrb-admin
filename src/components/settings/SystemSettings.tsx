import React, { useState } from "react";
import {
  FiServer,
  FiGlobe,
  FiClock,
  FiDatabase,
  FiWifi,
} from "react-icons/fi";

interface SystemSettingsProps {
  refreshKey: number;
}

export const SystemSettings: React.FC<SystemSettingsProps> = () => {
  const [settings, setSettings] = useState({
    systemName: "MTDRB Gym Management",
    timezone: "America/New_York",
    language: "en",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    maintenanceMode: false,
    backupFrequency: "daily",
    autoUpdates: true,
    debugMode: false,
    apiRateLimit: "1000",
    sessionTimeout: "30",
    maxFileSize: "10",
    enableLogging: true,
  });

  const handleInputChange = (
    field: string,
    value: string | boolean | number,
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "pt", label: "Portuguese" },
  ];

  const currencies = [
    { value: "USD", label: "US Dollar ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "British Pound (£)" },
    { value: "CAD", label: "Canadian Dollar (C$)" },
    { value: "AUD", label: "Australian Dollar (A$)" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            System Configuration
          </h1>
          <p className="text-gray-600 mt-1">
            Configure core system settings and operational parameters
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Save Changes
          </button>
          <button className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Test Connection
          </button>
        </div>
      </div>

      {/* Basic Configuration */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiServer className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">
            Basic Configuration
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Name
            </label>
            <input
              type="text"
              value={settings.systemName}
              onChange={(e) => handleInputChange("systemName", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleInputChange("currency", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiGlobe className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Regional Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => handleInputChange("timezone", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleInputChange("language", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={settings.dateFormat}
              onChange={(e) => handleInputChange("dateFormat", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <select
              value={settings.timeFormat}
              onChange={(e) => handleInputChange("timeFormat", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            >
              <option value="12h">12 Hour (AM/PM)</option>
              <option value="24h">24 Hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Performance */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiDatabase className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">
            Performance & Limits
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Rate Limit (per hour)
            </label>
            <input
              type="number"
              value={settings.apiRateLimit}
              onChange={(e) =>
                handleInputChange("apiRateLimit", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) =>
                handleInputChange("sessionTimeout", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max File Size (MB)
            </label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => handleInputChange("maxFileSize", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* System Toggles */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiWifi className="h-6 w-6 text-orange-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">System Features</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              key: "maintenanceMode",
              label: "Maintenance Mode",
              description: "Put system in maintenance mode for updates",
            },
            {
              key: "autoUpdates",
              label: "Automatic Updates",
              description: "Enable automatic system updates",
            },
            {
              key: "debugMode",
              label: "Debug Mode",
              description: "Enable debug logging and error reporting",
            },
            {
              key: "enableLogging",
              label: "System Logging",
              description: "Log system events and user activities",
            },
          ].map((toggle) => (
            <div
              key={toggle.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
            >
              <div>
                <h3 className="font-medium text-gray-900">{toggle.label}</h3>
                <p className="text-sm text-gray-600">{toggle.description}</p>
              </div>
              <button
                onClick={() =>
                  handleInputChange(
                    toggle.key,
                    !settings[toggle.key as keyof typeof settings],
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[toggle.key as keyof typeof settings]
                    ? "bg-blue-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[toggle.key as keyof typeof settings]
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Backup Configuration */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiClock className="h-6 w-6 text-indigo-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">
            Backup & Maintenance
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Frequency
            </label>
            <select
              value={settings.backupFrequency}
              onChange={(e) =>
                handleInputChange("backupFrequency", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors">
              Run Backup Now
            </button>
            <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors">
              System Health Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
