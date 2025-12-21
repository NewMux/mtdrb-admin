import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSettings,
  FiUser,
  FiShield,
  FiBell,
  FiCreditCard,
  FiDatabase,
  FiGlobe,
  FiDownload,
  FiUpload,
  FiSave,
  FiAlertCircle,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { SmartButton } from "../components/ui/DesignSystem";
import { SmartSettingsDashboard } from "../components/settings/SmartSettingsDashboard";
import TabsNav from "../components/ui/TabsNav";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useSettings } from "../hooks/useSettings";

const Settings: React.FC = () => {
  const { theme } = usePageThemeContext();
  const { isPro } = useSubscription();

  // Settings hook
  const {
    settings,
    loading,
    saving,
    hasChanges,
    errors,
    handleInputChange,
    handleSave,
    handleReset,
    getFieldError,
  } = useSettings();

  // Local state
  const [activeTab, setActiveTab] = useState("general");

  // Tab configuration
  const tabs = [
    { id: "general", name: "General", icon: FiSettings },
    { id: "profile", name: "Profile", icon: FiUser },
    { id: "security", name: "Security", icon: FiShield },
    { id: "billing", name: "Billing", icon: FiCreditCard },
    { id: "integrations", name: "Integrations", icon: FiDatabase },
  ];

  // Options for select fields
  const timezoneOptions = [
    { value: "Asia/Riyadh", label: "Riyadh (GMT+3)" },
    { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
    { value: "America/New_York", label: "Eastern Time (GMT-5)" },
    { value: "Europe/London", label: "London (GMT+0)" },
    { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
  ];

  const currencyOptions = [
    { value: "SAR", label: "Saudi Riyal (SAR)" },
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "British Pound (GBP)" },
  ];

  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Arabic", label: "العربية" },
    { value: "Spanish", label: "Español" },
    { value: "French", label: "Français" },
  ];

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your gym's configuration and preferences
            </p>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            <span className="ml-3 text-gray-600">
              Loading settings...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your gym's configuration and preferences
          </p>
        </div>

        {/* Save/Reset Actions */}
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <SmartButton
              variant="secondary"
              size="sm"
              onClick={handleReset}
              disabled={saving}
              icon={<FiX className="w-4 h-4" />}
            >
              Reset
            </SmartButton>
          )}
          <SmartButton
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges || saving}
            icon={<FiSave className="w-4 h-4" />}
          >
            {saving ? "Saving..." : "Save Changes"}
          </SmartButton>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4"
        >
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-amber-800">
              You have unsaved changes. Click "Save Changes" to apply them.
            </span>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <TabsNav
        tabs={tabs.map((tab) => ({
          id: tab.id,
          label: tab.name,
          icon: <tab.icon className="w-4 h-4" />,
        }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  General Settings
                </h3>

                <div className="space-y-6">
                  {/* Gym Name */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <label
                        htmlFor="gym-name"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Gym Name *
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Your gym's display name
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        id="gym-name"
                        type="text"
                        value={settings.general.gymName}
                        onChange={(e) =>
                          handleInputChange(
                            "general",
                            "gymName",
                            e.target.value,
                          )
                        }
                        className={`form-input w-48 ${getFieldError("general", "gymName") ? "border-red-500" : ""}`}
                        placeholder="Enter gym name"
                        aria-describedby={
                          getFieldError("general", "gymName")
                            ? "gym-name-error"
                            : undefined
                        }
                      />
                      {getFieldError("general", "gymName") && (
                        <p
                          id="gym-name-error"
                          className="text-red-500 text-xs mt-1"
                        >
                          {getFieldError("general", "gymName")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <label
                        htmlFor="timezone"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Timezone
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Your local timezone
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        id="timezone"
                        value={settings.general.timezone}
                        onChange={(e) =>
                          handleInputChange(
                            "general",
                            "timezone",
                            e.target.value,
                          )
                        }
                        className="form-select w-48"
                      >
                        {timezoneOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Currency */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <label
                        htmlFor="currency"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Currency
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Default currency for billing
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        id="currency"
                        value={settings.general.currency}
                        onChange={(e) =>
                          handleInputChange(
                            "general",
                            "currency",
                            e.target.value,
                          )
                        }
                        className="form-select w-48"
                      >
                        {currencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <label
                        htmlFor="language"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Language
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Interface language
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        id="language"
                        value={settings.general.language}
                        onChange={(e) =>
                          handleInputChange(
                            "general",
                            "language",
                            e.target.value,
                          )
                        }
                        className="form-select w-48"
                      >
                        {languageOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <label
                        htmlFor="dark-mode"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Dark Mode
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <button
                      id="dark-mode"
                      onClick={() =>
                        handleInputChange(
                          "general",
                          "darkMode",
                          !settings.general.darkMode,
                        )
                      }
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.general.darkMode ? "bg-sky-500" : "bg-gray-300"
                      } flex items-center ${settings.general.darkMode ? "justify-end" : "justify-start"} px-1`}
                      aria-label={`${settings.general.darkMode ? "Disable" : "Enable"} dark mode`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Profile Settings
                </h3>

                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">A</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Profile Picture
                      </h4>
                      <p className="text-xs text-gray-500">
                        Upload a new profile picture
                      </p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Change
                    </SmartButton>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="first-name" className="form-label">
                        First Name *
                      </label>
                      <input
                        id="first-name"
                        type="text"
                        value={settings.profile.firstName}
                        onChange={(e) =>
                          handleInputChange(
                            "profile",
                            "firstName",
                            e.target.value,
                          )
                        }
                        className={`form-input ${getFieldError("profile", "firstName") ? "border-red-500" : ""}`}
                        aria-describedby={
                          getFieldError("profile", "firstName")
                            ? "first-name-error"
                            : undefined
                        }
                      />
                      {getFieldError("profile", "firstName") && (
                        <p
                          id="first-name-error"
                          className="text-red-500 text-xs mt-1"
                        >
                          {getFieldError("profile", "firstName")}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="last-name" className="form-label">
                        Last Name *
                      </label>
                      <input
                        id="last-name"
                        type="text"
                        value={settings.profile.lastName}
                        onChange={(e) =>
                          handleInputChange(
                            "profile",
                            "lastName",
                            e.target.value,
                          )
                        }
                        className={`form-input ${getFieldError("profile", "lastName") ? "border-red-500" : ""}`}
                        aria-describedby={
                          getFieldError("profile", "lastName")
                            ? "last-name-error"
                            : undefined
                        }
                      />
                      {getFieldError("profile", "lastName") && (
                        <p
                          id="last-name-error"
                          className="text-red-500 text-xs mt-1"
                        >
                          {getFieldError("profile", "lastName")}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="form-label">
                        Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) =>
                          handleInputChange("profile", "email", e.target.value)
                        }
                        className={`form-input ${getFieldError("profile", "email") ? "border-red-500" : ""}`}
                        aria-describedby={
                          getFieldError("profile", "email")
                            ? "email-error"
                            : undefined
                        }
                      />
                      {getFieldError("profile", "email") && (
                        <p
                          id="email-error"
                          className="text-red-500 text-xs mt-1"
                        >
                          {getFieldError("profile", "email")}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone" className="form-label">
                        Phone
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={settings.profile.phone}
                        onChange={(e) =>
                          handleInputChange("profile", "phone", e.target.value)
                        }
                        className="form-input"
                        placeholder="+966 50 123 4567"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Security Settings
                </h3>

                <div className="space-y-4">
                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Two-Factor Authentication
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Add an extra layer of security
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleInputChange(
                          "security",
                          "twoFactorAuth",
                          !settings.security.twoFactorAuth,
                        )
                      }
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.security.twoFactorAuth
                          ? "bg-sky-500"
                          : "bg-gray-300"
                      } flex items-center ${settings.security.twoFactorAuth ? "justify-end" : "justify-start"} px-1`}
                      aria-label={`${settings.security.twoFactorAuth ? "Disable" : "Enable"} two-factor authentication`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>

                  {/* Password Expiry */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <label
                        htmlFor="password-expiry"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Password Expiry (days)
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Days before password expires
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        id="password-expiry"
                        type="number"
                        value={settings.security.passwordExpiry}
                        onChange={(e) =>
                          handleInputChange(
                            "security",
                            "passwordExpiry",
                            parseInt(e.target.value) || 90,
                          )
                        }
                        className={`form-input w-24 ${getFieldError("security", "passwordExpiry") ? "border-red-500" : ""}`}
                        min="30"
                        max="365"
                        aria-describedby={
                          getFieldError("security", "passwordExpiry")
                            ? "password-expiry-error"
                            : undefined
                        }
                      />
                      {getFieldError("security", "passwordExpiry") && (
                        <p
                          id="password-expiry-error"
                          className="text-red-500 text-xs"
                        >
                          {getFieldError("security", "passwordExpiry")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Session Timeout */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <label
                        htmlFor="session-timeout"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Session Timeout (minutes)
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Inactive session timeout
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        id="session-timeout"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) =>
                          handleInputChange(
                            "security",
                            "sessionTimeout",
                            parseInt(e.target.value) || 30,
                          )
                        }
                        className={`form-input w-24 ${getFieldError("security", "sessionTimeout") ? "border-red-500" : ""}`}
                        min="5"
                        max="120"
                        aria-describedby={
                          getFieldError("security", "sessionTimeout")
                            ? "session-timeout-error"
                            : undefined
                        }
                      />
                      {getFieldError("security", "sessionTimeout") && (
                        <p
                          id="session-timeout-error"
                          className="text-red-500 text-xs"
                        >
                          {getFieldError("security", "sessionTimeout")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Change Password
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Update your account password
                      </p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Change
                    </SmartButton>
                  </div>

                  {/* Login History */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Login History
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        View recent login activity
                      </p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      View
                    </SmartButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Billing Information
                </h3>

                <div className="space-y-4">
                  {/* Current Plan */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Current Plan
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {settings.billing.currentPlan}
                      </p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Upgrade
                    </SmartButton>
                  </div>

                  {/* Payment Method */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Payment Method
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {settings.billing.paymentMethod}
                      </p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Update
                    </SmartButton>
                  </div>

                  {/* Auto Renewal */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Auto Renewal
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically renew subscription
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleInputChange(
                          "billing",
                          "autoRenewal",
                          !settings.billing.autoRenewal,
                        )
                      }
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.billing.autoRenewal
                          ? "bg-sky-500"
                          : "bg-gray-300"
                      } flex items-center ${settings.billing.autoRenewal ? "justify-end" : "justify-start"} px-1`}
                      aria-label={`${settings.billing.autoRenewal ? "Disable" : "Enable"} auto renewal`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>

                  {/* Billing History */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Billing History
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        View past invoices
                      </p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      View
                    </SmartButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Third-Party Integrations
                </h3>

                <div className="space-y-4">
                  {/* Google Calendar */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                        <FiGlobe className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Google Calendar
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Sync class schedules
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleInputChange(
                          "integrations",
                          "googleCalendar",
                          !settings.integrations.googleCalendar,
                        )
                      }
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.integrations.googleCalendar
                          ? "bg-sky-500"
                          : "bg-gray-300"
                      } flex items-center ${settings.integrations.googleCalendar ? "justify-end" : "justify-start"} px-1`}
                      aria-label={`${settings.integrations.googleCalendar ? "Disconnect" : "Connect"} Google Calendar`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>

                  {/* Stripe Payments */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                        <FiDatabase className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Stripe Payments
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Process payments
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                  </div>

                  {/* Slack */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                        <FiBell className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Slack
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Team notifications
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleInputChange(
                          "integrations",
                          "slackNotifications",
                          !settings.integrations.slackNotifications,
                        )
                      }
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.integrations.slackNotifications
                          ? "bg-sky-500"
                          : "bg-gray-300"
                      } flex items-center ${settings.integrations.slackNotifications ? "justify-end" : "justify-start"} px-1`}
                      aria-label={`${settings.integrations.slackNotifications ? "Disconnect" : "Connect"} Slack`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>

                  {/* Webhook URL */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <label
                        htmlFor="webhook-url"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Webhook URL
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Custom webhook endpoint
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        id="webhook-url"
                        type="url"
                        value={settings.integrations.webhookUrl}
                        onChange={(e) =>
                          handleInputChange(
                            "integrations",
                            "webhookUrl",
                            e.target.value,
                          )
                        }
                        className="form-input w-64"
                        placeholder="https://your-domain.com/webhook"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Settings;
