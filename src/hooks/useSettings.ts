import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./useToast";
import {
  getGymSettings,
  saveGymSettingsWithValidation,
  GymSettings,
} from "../api/settings";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  DEFAULT_TIMEZONE,
  DEFAULT_VAT_RATE,
} from "../config/runtimeConfig";

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
  gymOperations: {
    vatEnabled: boolean;
    vatRate: number;
  };
}

export interface ValidationErrors {
  [key: string]: string;
}

export const useSettings = () => {
  const { user, tenantId } = useAuth();
  const { showSuccess, showError } = useToast();

  // State
  const [settings, setSettings] = useState<SettingsData>({
    general: {
      gymName: "",
      timezone: DEFAULT_TIMEZONE,
      currency: DEFAULT_CURRENCY,
      language: DEFAULT_LANGUAGE,
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
      currentPlan: "",
      paymentMethod: "",
      autoRenewal: false,
      billingCycle: "",
    },
    integrations: {
      googleCalendar: false,
      stripePayments: true,
      slackNotifications: false,
      webhookUrl: "",
    },
    gymOperations: {
      vatEnabled: DEFAULT_VAT_RATE > 0,
      vatRate: DEFAULT_VAT_RATE,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [sectionChanges, setSectionChanges] = useState<Record<keyof SettingsData, boolean>>({
    general: false,
    profile: false,
    security: false,
    billing: false,
    integrations: false,
    gymOperations: false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [originalSettings, setOriginalSettings] = useState<SettingsData | null>(
    null,
  );
  const settingsRef = useRef(settings);
  const sectionChangesRef = useRef(sectionChanges);
  const hasChangesRef = useRef(hasChanges);

  // Convert API data to local format
  const apiToLocalFormat = useCallback(
    (apiData: GymSettings): SettingsData => {
      return {
        general: {
          gymName: apiData.gym_name || "",
          timezone: apiData.timezone || DEFAULT_TIMEZONE,
          currency: apiData.currency || DEFAULT_CURRENCY,
          language: apiData.language || DEFAULT_LANGUAGE,
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
          currentPlan: apiData.current_plan || "",
          paymentMethod: apiData.payment_method || "",
          autoRenewal: apiData.auto_renewal === true,
          billingCycle: apiData.billing_cycle || "",
        },
        integrations: {
          googleCalendar: apiData.google_calendar || false,
          stripePayments: apiData.stripe_payments !== false,
          slackNotifications: apiData.slack_notifications || false,
          webhookUrl: apiData.webhook_url || "",
        },
        gymOperations: {
          vatEnabled: apiData.vat_enabled === true,
          vatRate: apiData.vat_rate ?? DEFAULT_VAT_RATE,
        },
      };
    },
    [user?.email],
  );

  // Convert local format to API format
  const localToApiFormat = useCallback(
    (localData: SettingsData): Partial<GymSettings> => {
      return {
        tenant_id: tenantId || "",
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
        vat_enabled: localData.gymOperations.vatEnabled,
        vat_rate: localData.gymOperations.vatRate,
      };
    },
    [tenantId],
  );

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (!tenantId) {
        showError("Organization unavailable", "Your account is not connected to an organization yet.");
        return;
      }
      const { settings: apiSettings, error } = await getGymSettings(tenantId);

      if (error) {
        showError("Failed to load settings", error);
        return;
      }

      if (apiSettings) {
        const localSettings = apiToLocalFormat(apiSettings);
        settingsRef.current = localSettings;
        setSettings(localSettings);
        setOriginalSettings(localSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      showError("Failed to load settings", "Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, apiToLocalFormat, showError]);

  // Save settings
  const saveSettings = useCallback(
    async (section?: keyof SettingsData) => {
      if (!user) return;
      if (!tenantId) {
        showError("Organization unavailable", "Your account is not connected to an organization yet.");
        return;
      }

      // If saving a specific section, check if that section has changes
      if (section && !sectionChangesRef.current[section]) {
        return;
      }

      // If saving all, check if there are any changes
      if (!section && !hasChangesRef.current) return;

      if (section) {
        setSavingSection(section);
      } else {
        setSaving(true);
      }

      try {
        // If saving a specific section, merge with original settings
        const currentSettings = settingsRef.current;
        let settingsToSave = currentSettings;
        if (section && originalSettings) {
          settingsToSave = {
            ...originalSettings,
            [section]: currentSettings[section],
          };
        }

        const apiData = localToApiFormat(settingsToSave);
        const { success, error, data } =
          await saveGymSettingsWithValidation(apiData);

        if (!success) {
          showError("Failed to save settings", error || "Please try again.");
          return;
        }

        if (data) {
          const localSettings = apiToLocalFormat(data);
          setOriginalSettings(localSettings);
          
          if (section) {
            // Only update the saved section, preserve other unsaved changes
            const nextSettings = {
              ...settingsRef.current,
              [section]: localSettings[section],
            };
            settingsRef.current = nextSettings;
            setSettings(nextSettings);

            // Clear changes for this section
            const nextSectionChanges = {
              ...sectionChangesRef.current,
              [section]: false,
            };
            sectionChangesRef.current = nextSectionChanges;
            setSectionChanges(nextSectionChanges);

            // Check if there are any other changes
            const otherChanges = Object.entries(nextSectionChanges).some(
              ([key, hasChange]) => key !== section && hasChange,
            );
            hasChangesRef.current = otherChanges;
            setHasChanges(otherChanges);
          } else {
            // Update all settings when saving everything
            settingsRef.current = localSettings;
            setSettings(localSettings);
            hasChangesRef.current = false;
            setHasChanges(false);
            const clearedSectionChanges = {
              general: false,
              profile: false,
              security: false,
              billing: false,
              integrations: false,
              gymOperations: false,
            };
            sectionChangesRef.current = clearedSectionChanges;
            setSectionChanges(clearedSectionChanges);
          }
          
          setErrors({});
          showSuccess(
            section
              ? `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`
              : "Settings saved successfully",
            "Your changes have been applied.",
          );
        }
      } catch (error) {
        console.error("Error saving settings:", error);
        showError("Failed to save settings", "Please try again.");
      } finally {
        if (section) {
          setSavingSection(null);
        } else {
          setSaving(false);
        }
      }
    },
    [
      user,
      tenantId,
      originalSettings,
      localToApiFormat,
      apiToLocalFormat,
      showSuccess,
      showError,
    ],
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (section: keyof SettingsData, field: string, value: unknown) => {
      const nextSettings = {
        ...settingsRef.current,
        [section]: {
          ...settingsRef.current[section],
          [field]: value,
        },
      };
      settingsRef.current = nextSettings;
      setSettings(nextSettings);

      const nextSectionChanges = {
        ...sectionChangesRef.current,
        [section]: true,
      };
      sectionChangesRef.current = nextSectionChanges;
      setSectionChanges(nextSectionChanges);
      hasChangesRef.current = true;
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
  const validateSettings = useCallback(
    (section?: keyof SettingsData) => {
      const currentSettings = settingsRef.current;
      const newErrors: ValidationErrors = {};

      // If section is specified, only validate that section
      if (section === "general" || !section) {
        if (!currentSettings.general.gymName.trim()) {
          newErrors["general.gymName"] = "Gym name is required";
        }
      }

      if (section === "profile" || !section) {
        if (!currentSettings.profile.firstName.trim()) {
          newErrors["profile.firstName"] = "First name is required";
        }
        if (!currentSettings.profile.lastName.trim()) {
          newErrors["profile.lastName"] = "Last name is required";
        }
        if (
          !currentSettings.profile.email ||
          !/\S+@\S+\.\S+/.test(currentSettings.profile.email)
        ) {
          newErrors["profile.email"] = "Valid email is required";
        }
      }

      if (section === "security" || !section) {
        if (
          currentSettings.security.passwordExpiry < 30 ||
          currentSettings.security.passwordExpiry > 365
        ) {
          newErrors["security.passwordExpiry"] =
            "Password expiry must be between 30 and 365 days";
        }
        if (
          currentSettings.security.sessionTimeout < 5 ||
          currentSettings.security.sessionTimeout > 120
        ) {
          newErrors["security.sessionTimeout"] =
            "Session timeout must be between 5 and 120 minutes";
        }
        if (
          currentSettings.security.minPasswordLength < 6 ||
          currentSettings.security.minPasswordLength > 20
        ) {
          newErrors["security.minPasswordLength"] =
            "Minimum password length must be between 6 and 20 characters";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [],
  );

  // Handle save with validation
  const handleSave = useCallback(
    async (section?: keyof SettingsData) => {
      if (!validateSettings(section)) {
        showError("Validation failed", "Please fix the errors before saving.");
        return;
      }

      await saveSettings(section);
    },
    [validateSettings, saveSettings, showError],
  );

  // Handle save for a specific section
  const handleSaveSection = useCallback(
    async (section: keyof SettingsData) => {
      await handleSave(section);
    },
    [handleSave],
  );

  // Reset to original settings
  const handleReset = useCallback(
    (section?: keyof SettingsData) => {
      if (originalSettings) {
        if (section) {
          const nextSettings = {
            ...settingsRef.current,
            [section]: originalSettings[section],
          };
          settingsRef.current = nextSettings;
          setSettings(nextSettings);
          setSectionChanges((prev) => {
            const updated = {
              ...prev,
              [section]: false,
            };
            // Check if there are any other changes
            const otherChanges = Object.entries(updated).some(
              ([key, hasChange]) => key !== section && hasChange,
            );
            sectionChangesRef.current = updated;
            hasChangesRef.current = otherChanges;
            setHasChanges(otherChanges);
            return updated;
          });
          showSuccess(
            `${section.charAt(0).toUpperCase() + section.slice(1)} settings reset`,
            "Changes for this section have been discarded.",
          );
        } else {
          settingsRef.current = originalSettings;
          setSettings(originalSettings);
          hasChangesRef.current = false;
          setHasChanges(false);
          const clearedSectionChanges = {
            general: false,
            profile: false,
            security: false,
            billing: false,
            integrations: false,
            gymOperations: false,
          };
          sectionChangesRef.current = clearedSectionChanges;
          setSectionChanges(clearedSectionChanges);
          showSuccess("Settings reset", "All changes have been discarded.");
        }
        setErrors({});
      }
    },
    [originalSettings, showSuccess],
  );

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
    savingSection,
    hasChanges,
    sectionChanges,
    errors,

    // Actions
    handleInputChange,
    handleSave,
    handleSaveSection,
    handleReset,
    getFieldError,

    // Validation
    validateSettings,
  };
};
