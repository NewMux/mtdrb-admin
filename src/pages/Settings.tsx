import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiSettings,
  FiUser,
  FiShield,
  FiCreditCard,
  FiUpload,
  FiSave,
  FiAlertCircle,
  FiX,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
import { SmartButton } from "../components/ui/DesignSystem";
import TabsNav from "../components/ui/TabsNav";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useSettings } from "../hooks/useSettings";
import { useToast } from "../hooks/useToast";
import { supabase } from "../supabaseClient";
import { SmartModal } from "../components/ui/SmartModal";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useRTL } from "../hooks/useRTL";
import { useTranslation } from "react-i18next";
import CancelSubscriptionModal from "../components/settings/CancelSubscriptionModal";
import { validatePassword } from "../utils/passwordPolicy";

const Settings: React.FC = () => {
  usePageThemeContext();
  useSubscription();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const { user, tenantId } = useAuth();
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    tier: string;
    startDate?: string;
    isPaid: boolean;
    status?: string;
    trialEnd?: string;
    currentPeriodEnd?: string;
  }>({ tier: "Free", isPaid: false });

  // Settings hook
  const {
    settings,
    loading,
    savingSection,
    sectionChanges,
    handleInputChange,
    handleSaveSection,
    handleReset,
    getFieldError,
  } = useSettings();

  // Local state
  const [activeTab, setActiveTab] = useState("general");


  // Fetch billing state from the membership-scoped subscription row.
  const fetchSubscriptionInfo = useCallback(async () => {
    if (!tenantId) {
      setSubscriptionInfo({ tier: "Free", isPaid: false });
      return;
    }

    try {
      const { data: subData, error: subscriptionError } = await supabase
        .from("platform_subscriptions")
        .select("status, plan_tier, amount, currency, created_at, trial_end, current_period_end, metadata")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (subscriptionError) throw subscriptionError;

      setSubscriptionInfo({
        tier: subData?.plan_tier || "Free",
        startDate: subData?.created_at,
        isPaid: subData?.status === "active" || subData?.status === "trialing",
        status: subData?.status,
        trialEnd: subData?.trial_end,
        currentPeriodEnd: subData?.current_period_end,
      });
    } catch (error) {
      console.error("Failed to fetch subscription info:", error);
      setSubscriptionInfo({ tier: "Free", isPaid: false });
    }
  }, [tenantId]);

  useEffect(() => {
    void fetchSubscriptionInfo();
  }, [fetchSubscriptionInfo]);

  // Handle subscription cancellation success
  const handleSubscriptionCancelled = () => {
    setSubscriptionInfo({ tier: "Free", isPaid: false });
    showSuccess(t("settings.subscriptionCancelled", "Subscription cancelled"), t("settings.subscriptionCancelledDesc", "Your subscription has been cancelled successfully."));
  };

  // Handlers for missing button functionality
  const handleProfilePictureChange = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError(t("settings.invalidFileType"), t("settings.invalidFileTypeDesc"));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError(t("settings.fileTooLarge"), t("settings.fileTooLargeDesc"));
      return;
    }

    if (!user || !tenantId) {
      showError(t("settings.authRequired"), t("settings.authRequiredDesc"));
      return;
    }

    setUploadingImage(true);

    try {
      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `profile-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${tenantId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, try creating it or use a different bucket
        console.error("Upload error:", uploadError);
        
        // Try alternative bucket name
        const { error: altUploadError } = await supabase.storage
          .from("attachments")
          .upload(`profile-pictures/${tenantId}/${fileName}`, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (altUploadError) {
          throw altUploadError;
        }

        // Get public URL from alternative bucket
        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(`profile-pictures/${tenantId}/${fileName}`);

        // Update settings with profile picture URL
        handleInputChange("profile", "profilePicture", urlData.publicUrl);
        
        // Save settings immediately
        await handleSaveSection("profile");
        
        showSuccess(t("settings.profilePictureUpdated"), "");
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(filePath);

        // Update settings with profile picture URL
        handleInputChange("profile", "profilePicture", urlData.publicUrl);
        
        // Save settings immediately
        await handleSaveSection("profile");
        
        showSuccess(t("settings.profilePictureUpdated"), "");
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      showError(t("settings.uploadFailed"), error instanceof Error ? error.message : "");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showError(t("settings.missingFields"), "");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError(t("settings.passwordMismatch"), "");
      return;
    }

    const passwordError = validatePassword(passwordData.newPassword, {
      minLength: settings.security.minPasswordLength,
      requireSpecialChars: settings.security.requireSpecialChars,
    });
    if (passwordError) {
      showError(passwordError, "");
      return;
    }

    setChangingPassword(true);
    try {
      // Update password using Supabase Auth. password_changed_at backs the
      // password-expiry check in AuthProvider.tsx.
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
        data: { password_changed_at: new Date().toISOString() },
      });

      if (error) {
        showError(t("settings.passwordUpdateFailed"), error.message);
        return;
      }

      showSuccess(t("settings.passwordUpdated"), "");
      setShowChangePasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      showError(t("settings.passwordUpdateFailed"), t("settings.unexpectedError"));
    } finally {
      setChangingPassword(false);
    }
  };

  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [loginHistory, setLoginHistory] = useState<
    { id: string; created_at: string; description: string }[]
  >([]);
  const [loadingLoginHistory, setLoadingLoginHistory] = useState(false);

  const handleViewLoginHistory = async () => {
    setShowLoginHistoryModal(true);
    setLoadingLoginHistory(true);
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("id, created_at, description")
        .eq("tenant_id", tenantId)
        .eq("type", "login")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!error && data) {
        setLoginHistory(data);
      }
    } finally {
      setLoadingLoginHistory(false);
    }
  };

  const handleUpgradePlan = () => {
    navigate("/subscribe");
  };

  const handleUpdatePaymentMethod = () => {
    navigate("/dashboard/billing");
  };

  const handleViewBillingHistory = () => {
    navigate("/dashboard/billing");
  };

  // Tab configuration
  const tabs = [
    { id: "general", name: t("settings.general"), icon: FiSettings },
    { id: "profile", name: t("settings.profile"), icon: FiUser },
    { id: "security", name: t("settings.security"), icon: FiShield },
    { id: "billing", name: t("settings.billing"), icon: FiCreditCard },
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

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("settings.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t("settings.subtitle")}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-gray-600 dark:text-gray-400`}>
              {t("settings.loadingSettings")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-start">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("settings.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">
            {t("settings.subtitle")}
          </p>
        </div>
      </div>

      {/* Unsaved Changes Warning - Section Specific */}
      {(() => {
        const sectionMap: Record<string, keyof typeof sectionChanges> = {
          "general": "general",
          "profile": "profile",
          "security": "security",
        };
        const currentSection = sectionMap[activeTab];
        return currentSection && sectionChanges[currentSection] ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
          >
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
              <FiAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm text-amber-800 dark:text-amber-300">
                {t("settings.unsavedChanges")} {t(`settings.${activeTab}`)}
              </span>
            </div>
          </motion.div>
        ) : null;
      })()}

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
              <div className="card dark:bg-gray-800 dark:border-gray-700 rounded-3xl shadow-sm p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-start">
                    {t("settings.generalSettings")}
                  </h3>
                  <div className="flex items-center gap-3">
                    {sectionChanges.general && (
                      <SmartButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReset("general")}
                        disabled={savingSection === "general"}
                        icon={<FiX className="w-4 h-4" />}
                      >
                        {t("settings.reset")}
                      </SmartButton>
                    )}
                    <SmartButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveSection("general")}
                      loading={savingSection === "general"}
                      disabled={!sectionChanges.general || savingSection === "general"}
                      icon={<FiSave className="w-4 h-4" />}
                    >
                      {savingSection === "general" ? t("settings.saving") : t("settings.saveChanges")}
                    </SmartButton>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Gym Name */}
                  <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                    <div className="flex-1 text-start">
                      <label
                        htmlFor="gym-name"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {t("settings.gymName")} *
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.gymNameDesc")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
                        className={`form-input w-64 rounded-xl ${getFieldError("general", "gymName") ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-sky-500 focus:ring-sky-500"}`}
                        placeholder={t("settings.gymNamePlaceholder")}
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
                  <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                    <div className="flex-1 text-start">
                      <label
                        htmlFor="timezone"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {t("settings.timezone")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.timezoneDesc")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
                  <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                    <div className="flex-1 text-start">
                      <label
                        htmlFor="currency"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {t("settings.currency")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.currencyDesc")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                    <div className="flex-1 text-start">
                      <label
                        htmlFor="language"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {t("settings.language")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.languageDesc")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <LanguageSwitcher />
                    </div>
                  </div>

                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <div className="flex-1 text-start">
                      <label
                        htmlFor="dark-mode"
                        className="block text-sm font-medium text-gray-900 dark:text-gray-100"
                      >
                        {t("settings.darkMode")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.darkModeDesc")}
                      </p>
                    </div>
                    <button
                      id="dark-mode"
                      onClick={toggleTheme}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        isDark ? "bg-sky-500" : "bg-gray-300"
                      } flex items-center ${isDark ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")} px-1`}
                      aria-label={isDark ? t("settings.disableDarkMode") : t("settings.enableDarkMode")}
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
              <div className="card dark:bg-gray-800 dark:border-gray-700 rounded-3xl shadow-sm">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6 p-6 pb-0`}>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("settings.profileSettings")}
                  </h3>
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
                    {sectionChanges.profile && (
                      <SmartButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReset("profile")}
                        disabled={savingSection === "profile"}
                        icon={<FiX className="w-4 h-4" />}
                      >
                        {t("settings.reset")}
                      </SmartButton>
                    )}
                    <SmartButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveSection("profile")}
                      loading={savingSection === "profile"}
                      disabled={!sectionChanges.profile || savingSection === "profile"}
                      icon={<FiSave className="w-4 h-4" />}
                    >
                      {savingSection === "profile" ? t("settings.saving") : t("settings.saveChanges")}
                    </SmartButton>
                  </div>
                </div>
                <div className="p-6 pt-4">

                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    {settings.profile.profilePicture ? (
                      <div className="w-20 h-20 rounded-full ring-2 ring-white shadow-sm overflow-hidden">
                        <img
                          src={settings.profile.profilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-white font-bold text-xl w-full h-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">${settings.profile.firstName?.[0]?.toUpperCase() || settings.profile.lastName?.[0]?.toUpperCase() || "A"}</span>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center ring-2 ring-white shadow-sm">
                        <span className="text-white font-bold text-xl">
                          {settings.profile.firstName?.[0]?.toUpperCase() || settings.profile.lastName?.[0]?.toUpperCase() || "A"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {t("settings.profilePicture")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {t("settings.profilePictureDesc")}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                        <SmartButton
                          variant="secondary"
                          size="sm"
                          onClick={handleProfilePictureChange}
                          icon={<FiUpload className="w-4 h-4" />}
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? t("settings.uploading") : settings.profile.profilePicture ? t("settings.changeImage") : t("settings.chooseImage")}
                        </SmartButton>
                        {settings.profile.profilePicture && (
                          <SmartButton
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              handleInputChange("profile", "profilePicture", undefined);
                              await handleSaveSection("profile");
                              showSuccess(t("settings.profilePictureRemoved"), "");
                            }}
                            icon={<FiX className="w-4 h-4" />}
                          >
                            {t("settings.remove")}
                          </SmartButton>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first-name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {t("settings.firstName")} <span className="text-red-500">*</span>
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
                        className={`form-input rounded-xl ${getFieldError("profile", "firstName") ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-sky-500 focus:ring-sky-500"}`}
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
                      <label htmlFor="last-name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {t("settings.lastName")} <span className="text-red-500">*</span>
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
                        className={`form-input rounded-xl ${getFieldError("profile", "lastName") ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-sky-500 focus:ring-sky-500"}`}
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
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {t("settings.emailAddress")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) =>
                          handleInputChange("profile", "email", e.target.value)
                        }
                        className={`form-input rounded-xl ${getFieldError("profile", "email") ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-sky-500 focus:ring-sky-500"}`}
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
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {t("settings.phoneNumber")}
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={settings.profile.phone}
                        onChange={(e) =>
                          handleInputChange("profile", "phone", e.target.value)
                        }
                        className="form-input rounded-xl border-gray-300 focus:border-sky-500 focus:ring-sky-500"
                        placeholder={t("settings.phonePlaceholder")}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.phoneNumberDesc")}
                      </p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="card dark:bg-gray-800 dark:border-gray-700 rounded-3xl shadow-sm">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6 p-6 pb-0`}>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("settings.securitySettings")}
                  </h3>
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
                    {sectionChanges.security && (
                      <SmartButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReset("security")}
                        disabled={savingSection === "security"}
                        icon={<FiX className="w-4 h-4" />}
                      >
                        {t("settings.reset")}
                      </SmartButton>
                    )}
                    <SmartButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveSection("security")}
                      loading={savingSection === "security"}
                      disabled={!sectionChanges.security || savingSection === "security"}
                      icon={<FiSave className="w-4 h-4" />}
                    >
                      {savingSection === "security" ? t("settings.saving") : t("settings.saveChanges")}
                    </SmartButton>
                  </div>
                </div>
                <div className="p-6 pt-4">

                <div className="space-y-4">
                  {/* Two-Factor Authentication */}
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {t("settings.twoFactorAuth")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.twoFactorAuthDesc")}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        {t("settings.twoFactorAuthNotEnforced", "This preference is saved but not yet enforced at login.")}
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
                      } flex items-center ${settings.security.twoFactorAuth ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")} px-1`}
                      aria-label={settings.security.twoFactorAuth ? t("settings.disableTwoFactor") : t("settings.enableTwoFactor")}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>

                  {/* Password Expiry */}
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    <div>
                      <label
                        htmlFor="password-expiry"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {t("settings.passwordExpiry")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.passwordExpiryDesc")}
                      </p>
                    </div>
                    <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
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
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    <div>
                      <label
                        htmlFor="session-timeout"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {t("settings.sessionTimeout")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.sessionTimeoutDesc")}
                      </p>
                    </div>
                    <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
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
                        className={`form-input w-24 rounded-xl ${getFieldError("security", "sessionTimeout") ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-sky-500 focus:ring-sky-500"}`}
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
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {t("settings.changePassword")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.changePasswordDesc")}
                      </p>
                    </div>
                    <SmartButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowChangePasswordModal(true)}
                    >
                      {t("settings.change")}
                    </SmartButton>
                  </div>

                  {/* Login History */}
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {t("settings.loginHistory")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.loginHistoryDesc")}
                      </p>
                    </div>
                    <SmartButton
                      variant="secondary"
                      size="sm"
                      onClick={handleViewLoginHistory}
                    >
                      {t("settings.view")}
                    </SmartButton>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              {/* Subscription Management Card */}
              <div className="card dark:bg-gray-800 dark:border-gray-700 rounded-3xl shadow-sm">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6 p-6 pb-0`}>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("settings.subscriptionManagement", "Subscription Management")}
                  </h3>
                </div>
                <div className="p-6 pt-4">
                  <div className="space-y-4">
                    {/* Current Subscription Status */}
                    <div className={`rounded-2xl p-5 ${subscriptionInfo.isPaid ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'}`}>
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
                          <div className={`w-12 h-12 rounded-xl ${subscriptionInfo.isPaid ? 'bg-blue-600' : 'bg-gray-400'} flex items-center justify-center`}>
                            <FiCreditCard className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)} {t("settings.plan", "Plan")}
                              </h4>
                              {subscriptionInfo.isPaid && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  <FiCheckCircle className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                  {t("settings.active", "Active")}
                                </span>
                              )}
                            </div>
                            {subscriptionInfo.startDate && (
                              <p className={`text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}>
                                <FiCalendar className="w-3.5 h-3.5" />
                                <span>{t("settings.memberSince", "Member since")} {new Date(subscriptionInfo.startDate).toLocaleDateString()}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                          {subscriptionInfo.isPaid && (
                            <SmartButton
                              variant="secondary"
                              size="sm"
                              onClick={handleUpgradePlan}
                            >
                              {subscriptionInfo.tier === "pro" ? t("settings.managePlan", "Manage Plan") : t("settings.upgrade", "Upgrade")}
                            </SmartButton>
                          )}
                          {!subscriptionInfo.isPaid && (
                            <SmartButton
                              variant="primary"
                              size="sm"
                              onClick={handleUpgradePlan}
                            >
                              {t("settings.subscribe", "Subscribe")}
                            </SmartButton>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cancel Subscription Option - Only show if subscribed */}
                    {subscriptionInfo.isPaid && (
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30`}>
                        <div>
                          <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                            {t("settings.cancelSubscription", "Cancel Subscription")}
                          </h4>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {t("settings.cancelSubscriptionDesc", "Cancel your subscription and lose access to premium features")}
                          </p>
                        </div>
                        <SmartButton
                          variant="danger"
                          size="sm"
                          onClick={() => setShowCancelSubscriptionModal(true)}
                        >
                          {t("settings.cancel", "Cancel")}
                        </SmartButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing Information Card */}
              <div className="card dark:bg-gray-800 dark:border-gray-700 rounded-3xl shadow-sm">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6 p-6 pb-0`}>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("settings.billingInformation")}
                  </h3>
                </div>
                <div className="p-6 pt-4">

                <div className="space-y-4">
                  {/* Current Plan */}
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {t("settings.currentPlan")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {subscriptionInfo.tier === "Free" ? t("settings.freePlan", "Free") : subscriptionInfo.tier}
                      </p>
                    </div>
                    <SmartButton
                      variant="secondary"
                      size="sm"
                      onClick={handleUpgradePlan}
                    >
                      {t("settings.upgrade")}
                    </SmartButton>
                  </div>

                  {/* Payment Method */}
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {t("settings.paymentMethod")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("billing.notSet", "Not set")}
                      </p>
                    </div>
                    <SmartButton
                      variant="secondary"
                      size="sm"
                      onClick={handleUpdatePaymentMethod}
                    >
                      {t("settings.update")}
                    </SmartButton>
                  </div>

                  {/* Auto Renewal - read-only: reflects the real subscription
                      status, there's no payment gateway to toggle this against */}
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {t("settings.autoRenewal")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {subscriptionInfo.status === "active"
                          ? t("settings.autoRenewalActive", "Renews automatically")
                          : subscriptionInfo.status === "trialing"
                            ? t("settings.autoRenewalTrial", "Trial ends {{date}}", {
                                date: subscriptionInfo.trialEnd
                                  ? new Date(subscriptionInfo.trialEnd).toLocaleDateString()
                                  : t("billing.notSet", "Not set"),
                              })
                            : subscriptionInfo.status === "cancelled"
                              ? t("settings.autoRenewalCancelled", "Cancelled, will not renew")
                              : t("settings.autoRenewalNone", "No active subscription")}
                      </p>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50`}>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {t("settings.billingHistory")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("settings.billingHistoryDesc")}
                      </p>
                    </div>
                    <SmartButton
                      variant="secondary"
                      size="sm"
                      onClick={handleViewBillingHistory}
                    >
                      {t("settings.view")}
                    </SmartButton>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Change Password Modal */}
      <SmartModal
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }}
        title={t("settings.changePasswordModal")}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="current-password" className="form-label">
              {t("settings.currentPassword")} *
            </label>
            <input
              id="current-password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              className="form-input"
              placeholder={t("settings.currentPasswordPlaceholder")}
            />
          </div>
          <div>
            <label htmlFor="new-password" className="form-label">
              {t("settings.newPassword")} *
            </label>
            <input
              id="new-password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              className="form-input"
              placeholder={t("settings.newPasswordPlaceholder")}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="form-label">
              {t("settings.confirmPassword")} *
            </label>
            <input
              id="confirm-password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              className="form-input"
              placeholder={t("settings.confirmPasswordPlaceholder")}
            />
          </div>
          <div className={`flex items-center ${isRTL ? 'justify-start space-x-reverse' : 'justify-end'} space-x-3 pt-4`}>
            <SmartButton
              variant="secondary"
              onClick={() => {
                setShowChangePasswordModal(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
              }}
            >
              {t("common.cancel")}
            </SmartButton>
            <SmartButton
              variant="primary"
              onClick={handleChangePassword}
              loading={changingPassword}
              disabled={changingPassword}
            >
              {changingPassword ? t("settings.changing") : t("settings.changePassword")}
            </SmartButton>
          </div>
        </div>
      </SmartModal>

      {/* Login History Modal */}
      <SmartModal
        isOpen={showLoginHistoryModal}
        onClose={() => setShowLoginHistoryModal(false)}
        title={t("settings.loginHistory")}
        size="md"
      >
        <div className="space-y-3">
          {loadingLoginHistory ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : loginHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              {t("settings.noLoginHistory", "No sign-ins recorded yet.")}
            </p>
          ) : (
            loginHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {entry.description}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </SmartModal>

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={showCancelSubscriptionModal}
        onClose={() => setShowCancelSubscriptionModal(false)}
        currentPlan={subscriptionInfo.tier}
        subscriptionStart={subscriptionInfo.startDate}
        onSuccess={handleSubscriptionCancelled}
      />
    </div>
  );
};

export default Settings;
