import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./useToast";
import {
  getGymSettings,
  saveGymSettingsWithValidation,
  GymSettings,
} from "../api/settings";

export interface SettingsData {
  general: {
    gymName: string;
    timezone: string;
    currency: string;
    language: string;
    darkMode: boolean;
  };
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePicture?: string;
  };
  security: {
    twoFactorAuth: boolean;
    passwordExpiry: number;
    sessionTimeout: number;
    minPasswordLength: number;
    requireSpecialChars: boolean;
    lockoutThreshold: number;
  };
  billing: {
    currentPlan: string;
    paymentMethod: string;
    autoRenewal: boolean;
    billingCycle: string;
  };
  integrations: {
    googleCalendar: boolean;
    stripePayments: boolean;
    slackNotifications: boolean;
    webhookUrl: string;
  };
}

export interface ValidationErrors {
  [key: string]: string;
}

export const useSettings = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // State
  const [settings, setSettings] = useState<SettingsData>({
    general: {
      gymName: "",
      timezone: "Asia/Riyadh",
      currency: "SAR",
      language: "English",
      darkMode: false,
    },
    profile: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
    security: {
      twoFactorAuth: false,
      passwordExpiry: 90,
      sessionTimeout: 30,
      minPasswordLength: 8,
      requireSpecialChars: true,
      lockoutThreshold: 5,
    },
    billing: {
      currentPlan: "Premium Plan - $99/month",
      paymentMethod: "Visa ending in 4242",
      autoRenewal: true,
      billingCycle: "monthly",
    },
    integrations: {
      googleCalendar: false,
      stripePayments: true,
      slackNotifications: false,
      webhookUrl: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [originalSettings, setOriginalSettings] = useState<SettingsData | null>(
    null,
  );

  // Convert API data to local format
  const apiToLocalFormat = useCallback(
    (apiData: GymSettings): SettingsData => {
      return {
        general: {
          gymName: apiData.gym_name || "",
          timezone: apiData.timezone || "Asia/Riyadh",
          currency: apiData.currency || "SAR",
          language: apiData.language || "English",
          darkMode: apiData.dark_mode || false,
        },
        profile: {
          firstName: apiData.first_name || "",
          lastName: apiData.last_name || "",
          email: apiData.email || user?.email || "",
          phone: apiData.phone || "",
          profilePicture: apiData.profile_picture,
        },
        security: {
          twoFactorAuth: apiData.two_factor_auth || false,
          passwordExpiry: apiData.password_expiry || 90,
          sessionTimeout: apiData.session_timeout || 30,
          minPasswordLength: apiData.min_password_length || 8,
          requireSpecialChars: apiData.require_special_chars !== false,
          lockoutThreshold: apiData.lockout_threshold || 5,
        },
        billing: {
          currentPlan: apiData.current_plan || "Premium Plan - $99/month",
          paymentMethod: apiData.payment_method || "Visa ending in 4242",
          autoRenewal: apiData.auto_renewal !== false,
          billingCycle: apiData.billing_cycle || "monthly",
        },
        integrations: {
          googleCalendar: apiData.google_calendar || false,
          stripePayments: apiData.stripe_payments !== false,
          slackNotifications: apiData.slack_notifications || false,
          webhookUrl: apiData.webhook_url || "",
        },
      };
    },
    [user?.email],
  );

  // Convert local format to API format
  const localToApiFormat = useCallback(
    (localData: SettingsData): Partial<GymSettings> => {
      return {
        tenant_id: user?.user_metadata?.tenant_id || user?.id || "",
        gym_name: localData.general.gymName,
        timezone: localData.general.timezone,
        currency: localData.general.currency,
        language: localData.general.language,
        dark_mode: localData.general.darkMode,
        first_name: localData.profile.firstName,
        last_name: localData.profile.lastName,
        email: localData.profile.email,
        phone: localData.profile.phone,
        profile_picture: localData.profile.profilePicture,
        two_factor_auth: localData.security.twoFactorAuth,
        password_expiry: localData.security.passwordExpiry,
        session_timeout: localData.security.sessionTimeout,
        min_password_length: localData.security.minPasswordLength,
        require_special_chars: localData.security.requireSpecialChars,
        lockout_threshold: localData.security.lockoutThreshold,
        current_plan: localData.billing.currentPlan,
        payment_method: localData.billing.paymentMethod,
        auto_renewal: localData.billing.autoRenewal,
        billing_cycle: localData.billing.billingCycle,
        google_calendar: localData.integrations.googleCalendar,
        stripe_payments: localData.integrations.stripePayments,
        slack_notifications: localData.integrations.slackNotifications,
        webhook_url: localData.integrations.webhookUrl,
      };
    },
    [user],
  );

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const tenantId = user.user_metadata?.tenant_id || user.id;
      const { settings: apiSettings, error } = await getGymSettings(tenantId);

      if (error) {
        showError("Failed to load settings", error);
        return;
      }

      if (apiSettings) {
        const localSettings = apiToLocalFormat(apiSettings);
        setSettings(localSettings);
        setOriginalSettings(localSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      showError("Failed to load settings", "Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, [user, apiToLocalFormat, showError]);

  // Save settings
  const saveSettings = useCallback(async () => {
    if (!user || !hasChanges) return;

    setSaving(true);
    try {
      const apiData = localToApiFormat(settings);
      const { success, error, data } =
        await saveGymSettingsWithValidation(apiData);

      if (!success) {
        showError("Failed to save settings", error || "Please try again.");
        return;
      }

      if (data) {
        const localSettings = apiToLocalFormat(data);
        setOriginalSettings(localSettings);
        setHasChanges(false);
        setErrors({});
        showSuccess(
          "Settings saved successfully",
          "Your changes have been applied.",
        );
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showError("Failed to save settings", "Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    user,
    settings,
    hasChanges,
    localToApiFormat,
    apiToLocalFormat,
    showSuccess,
    showError,
  ]);

  // Handle input changes
  const handleInputChange = useCallback(
    (section: keyof SettingsData, field: string, value: any) => {
      setSettings((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
      setHasChanges(true);

      // Clear validation error for this field
      if (errors[`${section}.${field}`]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`${section}.${field}`];
          return newErrors;
        });
      }
    },
    [errors],
  );

  // Validate settings
  const validateSettings = useCallback(() => {
    const newErrors: ValidationErrors = {};

    // General settings validation
    if (!settings.general.gymName.trim()) {
      newErrors["general.gymName"] = "Gym name is required";
    }

    // Profile settings validation
    if (!settings.profile.firstName.trim()) {
      newErrors["profile.firstName"] = "First name is required";
    }
    if (!settings.profile.lastName.trim()) {
      newErrors["profile.lastName"] = "Last name is required";
    }
    if (
      !settings.profile.email ||
      !/\S+@\S+\.\S+/.test(settings.profile.email)
    ) {
      newErrors["profile.email"] = "Valid email is required";
    }

    // Security settings validation
    if (
      settings.security.passwordExpiry < 30 ||
      settings.security.passwordExpiry > 365
    ) {
      newErrors["security.passwordExpiry"] =
        "Password expiry must be between 30 and 365 days";
    }
    if (
      settings.security.sessionTimeout < 5 ||
      settings.security.sessionTimeout > 120
    ) {
      newErrors["security.sessionTimeout"] =
        "Session timeout must be between 5 and 120 minutes";
    }
    if (
      settings.security.minPasswordLength < 6 ||
      settings.security.minPasswordLength > 20
    ) {
      newErrors["security.minPasswordLength"] =
        "Minimum password length must be between 6 and 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [settings]);

  // Handle save with validation
  const handleSave = useCallback(async () => {
    if (!validateSettings()) {
      showError("Validation failed", "Please fix the errors before saving.");
      return;
    }

    await saveSettings();
  }, [validateSettings, saveSettings, showError]);

  // Reset to original settings
  const handleReset = useCallback(() => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
      setErrors({});
      showSuccess("Settings reset", "All changes have been discarded.");
    }
  }, [originalSettings, showSuccess]);

  // Get error for a specific field
  const getFieldError = useCallback(
    (section: string, field: string) => {
      return errors[`${section}.${field}`];
    },
    [errors],
  );

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Check for unsaved changes before navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  return {
    // State
    settings,
    loading,
    saving,
    hasChanges,
    errors,

    // Actions
    handleInputChange,
    handleSave,
    handleReset,
    getFieldError,

    // Validation
    validateSettings,
  };
};
