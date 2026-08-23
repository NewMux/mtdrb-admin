import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./useToast";
import {
  getGymSettings,
  saveGymSettingsWithValidation,
  GymSettings,
} from "../api/settings";
import { supabase } from "../supabaseClient";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  DEFAULT_TIMEZONE,
  DEFAULT_VAT_RATE,
} from "../config/runtimeConfig";

// Shape of the general/security data nested under gym_settings.metadata -
// there's no dedicated column for any of this, so it's stored as JSON
// alongside the other namespaced keys already living there (dashboardTargets).
interface GeneralMetadata {
  gym_name?: string;
  timezone?: string;
  language?: string;
  dark_mode?: boolean;
}

interface SecurityMetadata {
  two_factor_auth?: boolean;
  password_expiry?: number;
  session_timeout?: number;
  min_password_length?: number;
  require_special_chars?: boolean;
  lockout_threshold?: number;
}

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
    gymOperations: false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [originalSettings, setOriginalSettings] = useState<SettingsData | null>(
    null,
  );
  const settingsRef = useRef(settings);
  const sectionChangesRef = useRef(sectionChanges);
  const hasChangesRef = useRef(hasChanges);
  // Metadata as last loaded from the DB, so a general/security save doesn't
  // clobber other namespaced keys already living there (e.g. dashboardTargets,
  // set by the Dashboard's target editor).
  const rawMetadataRef = useRef<Record<string, unknown>>({});

  // Convert API data to local format. Profile fields come from the auth
  // user object (see Fix 2), not from gym_settings - there's no profiles
  // table for them to live in.
  const apiToLocalFormat = useCallback(
    (apiData: GymSettings): SettingsData => {
      const generalMeta = (apiData.metadata?.general || {}) as GeneralMetadata;
      const securityMeta = (apiData.metadata?.security || {}) as SecurityMetadata;
      const userMetadata = user?.user_metadata as
        | { full_name?: string; name?: string; phone?: string; avatar_url?: string }
        | undefined;
      const fullName = userMetadata?.full_name || userMetadata?.name || "";
      const [firstName = "", ...lastNameParts] = fullName.split(" ");

      return {
        general: {
          gymName: generalMeta.gym_name || "",
          timezone: generalMeta.timezone || DEFAULT_TIMEZONE,
          currency: apiData.currency || DEFAULT_CURRENCY,
          language: generalMeta.language || DEFAULT_LANGUAGE,
          darkMode: generalMeta.dark_mode || false,
        },
        profile: {
          firstName,
          lastName: lastNameParts.join(" "),
          email: user?.email || "",
          phone: userMetadata?.phone || "",
          profilePicture: userMetadata?.avatar_url,
        },
        security: {
          twoFactorAuth: securityMeta.two_factor_auth || false,
          passwordExpiry: securityMeta.password_expiry || 90,
          sessionTimeout: securityMeta.session_timeout || 30,
          minPasswordLength: securityMeta.min_password_length || 8,
          requireSpecialChars: securityMeta.require_special_chars !== false,
          lockoutThreshold: securityMeta.lockout_threshold || 5,
        },
        gymOperations: {
          vatEnabled: apiData.vat_enabled === true,
          vatRate: apiData.vat_rate ?? DEFAULT_VAT_RATE,
        },
      };
    },
    [user],
  );

  // Convert local format to API format for the gym_settings table (general/
  // security/gymOperations only - profile is saved separately via
  // supabase.auth.updateUser, see saveProfile below).
  const localToApiFormat = useCallback(
    (
      localData: SettingsData,
      existingMetadata: Record<string, unknown> = {},
    ): Partial<GymSettings> => {
      return {
        tenant_id: tenantId || "",
        currency: localData.general.currency,
        vat_enabled: localData.gymOperations.vatEnabled,
        vat_rate: localData.gymOperations.vatRate,
        metadata: {
          ...existingMetadata,
          general: {
            gym_name: localData.general.gymName,
            timezone: localData.general.timezone,
            language: localData.general.language,
            dark_mode: localData.general.darkMode,
          },
          security: {
            two_factor_auth: localData.security.twoFactorAuth,
            password_expiry: localData.security.passwordExpiry,
            session_timeout: localData.security.sessionTimeout,
            min_password_length: localData.security.minPasswordLength,
            require_special_chars: localData.security.requireSpecialChars,
            lockout_threshold: localData.security.lockoutThreshold,
          },
        },
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
        rawMetadataRef.current = apiSettings.metadata || {};
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

  // Profile is saved via Supabase Auth, not gym_settings - there's no
  // profiles table for name/phone/avatar to land in. Email changes go
  // through a distinct call, since updateUser({email}) triggers Supabase's
  // email-confirmation flow rather than changing immediately.
  const saveProfile = useCallback(
    async (localData: SettingsData) => {
      const fullName = `${localData.profile.firstName} ${localData.profile.lastName}`.trim();
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: localData.profile.phone,
          avatar_url: localData.profile.profilePicture,
        },
      });

      if (metadataError) {
        return { success: false, error: metadataError.message, emailChangeRequested: false };
      }

      let emailChangeRequested = false;
      if (localData.profile.email && localData.profile.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: localData.profile.email,
        });
        if (emailError) {
          return { success: false, error: emailError.message, emailChangeRequested: false };
        }
        emailChangeRequested = true;
      }

      // supabase.auth.updateUser() already updates the local session and
      // fires a USER_UPDATED event that AuthProvider's onAuthStateChange
      // listener picks up globally - no need to force a full token refresh
      // here (that would also flip the whole app's isLoading state).
      return { success: true, error: null, emailChangeRequested };
    },
    [user?.email],
  );

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
        const currentSettings = settingsRef.current;

        // Profile has its own save path entirely (Supabase Auth, not
        // gym_settings) since it's a fundamentally different API call.
        if (section === "profile") {
          const { success, error, emailChangeRequested } =
            await saveProfile(currentSettings);

          if (!success) {
            showError("Failed to save profile", error || "Please try again.");
            return;
          }

          setOriginalSettings({ ...(originalSettings ?? currentSettings), profile: currentSettings.profile });
          const nextSectionChanges = { ...sectionChangesRef.current, profile: false };
          sectionChangesRef.current = nextSectionChanges;
          setSectionChanges(nextSectionChanges);
          const otherChanges = Object.entries(nextSectionChanges).some(
            ([key, hasChange]) => key !== "profile" && hasChange,
          );
          hasChangesRef.current = otherChanges;
          setHasChanges(otherChanges);
          setErrors({});
          showSuccess(
            "Profile settings saved successfully",
            emailChangeRequested
              ? "Check your new email address to confirm the change."
              : "Your changes have been applied.",
          );
          return;
        }

        // If saving a specific section, merge with original settings
        let settingsToSave = currentSettings;
        if (section && originalSettings) {
          settingsToSave = {
            ...originalSettings,
            [section]: currentSettings[section],
          };
        }

        // Saving "all" (no section) also covers profile, since it's not
        // part of the gym_settings payload below.
        if (!section) {
          const { success, error } = await saveProfile(settingsToSave);
          if (!success) {
            showError("Failed to save profile", error || "Please try again.");
            return;
          }
        }

        const apiData = localToApiFormat(settingsToSave, rawMetadataRef.current);
        const { success, error, data } =
          await saveGymSettingsWithValidation(apiData);

        if (!success) {
          showError("Failed to save settings", error || "Please try again.");
          return;
        }

        if (data) {
          rawMetadataRef.current = data.metadata || {};
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
      saveProfile,
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
