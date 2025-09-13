import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";

export interface GymSettings {
  id?: string;
  tenant_id: string;
  gym_name?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  dark_mode?: boolean;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  profile_picture?: string;
  two_factor_auth?: boolean;
  password_expiry?: number;
  session_timeout?: number;
  min_password_length?: number;
  require_special_chars?: boolean;
  lockout_threshold?: number;
  current_plan?: string;
  payment_method?: string;
  auto_renewal?: boolean;
  billing_cycle?: string;
  google_calendar?: boolean;
  stripe_payments?: boolean;
  slack_notifications?: boolean;
  webhook_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SettingsResponse {
  data: GymSettings | null;
  error: any;
}

/**
 * Fetch gym settings for a specific tenant
 */
export const fetchGymSettings = async (
  tenantId: string,
): Promise<SettingsResponse> => {
  try {
    const { data, error } = await supabase
      .from("gym_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching gym settings:", error);
    return { data: null, error };
  }
};

/**
 * Save or update gym settings
 */
export const saveGymSettings = async (
  settings: Partial<GymSettings>,
): Promise<SettingsResponse> => {
  try {
    const payload = {
      ...settings,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("gym_settings")
      .upsert(payload, { onConflict: "tenant_id" })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error saving gym settings:", error);
    return { data: null, error };
  }
};

/**
 * Update specific setting fields
 */
export const updateGymSettings = async (
  tenantId: string,
  updates: Partial<GymSettings>,
): Promise<SettingsResponse> => {
  try {
    const { data, error } = await supabase
      .from("gym_settings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error updating gym settings:", error);
    return { data: null, error };
  }
};

/**
 * Create default settings for a new tenant
 */
export const createDefaultSettings = async (
  tenantId: string,
): Promise<SettingsResponse> => {
  try {
    const defaultSettings: GymSettings = {
      tenant_id: tenantId,
      gym_name: "MTDRB Gym",
      timezone: "Asia/Riyadh",
      currency: "SAR",
      language: "English",
      dark_mode: false,
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      two_factor_auth: false,
      password_expiry: 90,
      session_timeout: 30,
      min_password_length: 8,
      require_special_chars: true,
      lockout_threshold: 5,
      current_plan: "Premium Plan - $99/month",
      payment_method: "Visa ending in 4242",
      auto_renewal: true,
      billing_cycle: "monthly",
      google_calendar: false,
      stripe_payments: true,
      slack_notifications: false,
      webhook_url: "",
    };

    const { data, error } = await supabase
      .from("gym_settings")
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error creating default settings:", error);
    return { data: null, error };
  }
};

/**
 * Validate settings data
 */
export const validateSettings = (
  settings: Partial<GymSettings>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!settings.tenant_id) {
    errors.push("Tenant ID is required");
  }

  // Gym name validation
  if (settings.gym_name && settings.gym_name.trim().length === 0) {
    errors.push("Gym name cannot be empty");
  }

  // Email validation
  if (settings.email && !/\S+@\S+\.\S+/.test(settings.email)) {
    errors.push("Invalid email format");
  }

  // Numeric validations
  if (
    settings.password_expiry &&
    (settings.password_expiry < 30 || settings.password_expiry > 365)
  ) {
    errors.push("Password expiry must be between 30 and 365 days");
  }

  if (
    settings.session_timeout &&
    (settings.session_timeout < 5 || settings.session_timeout > 120)
  ) {
    errors.push("Session timeout must be between 5 and 120 minutes");
  }

  if (
    settings.min_password_length &&
    (settings.min_password_length < 6 || settings.min_password_length > 20)
  ) {
    errors.push("Minimum password length must be between 6 and 20 characters");
  }

  if (
    settings.lockout_threshold &&
    (settings.lockout_threshold < 1 || settings.lockout_threshold > 10)
  ) {
    errors.push("Lockout threshold must be between 1 and 10 attempts");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get settings with validation and error handling
 */
export const getGymSettings = async (
  tenantId: string,
): Promise<{
  settings: GymSettings | null;
  error: string | null;
  loading: boolean;
}> => {
  try {
    const { data, error } = await fetchGymSettings(tenantId);

    if (error) {
      return {
        settings: null,
        error: "Failed to load settings",
        loading: false,
      };
    }

    if (!data) {
      // Create default settings if none exist
      const { data: defaultData, error: createError } =
        await createDefaultSettings(tenantId);

      if (createError) {
        return {
          settings: null,
          error: "Failed to create default settings",
          loading: false,
        };
      }

      return {
        settings: defaultData,
        error: null,
        loading: false,
      };
    }

    return {
      settings: data,
      error: null,
      loading: false,
    };
  } catch (error) {
    console.error("Error in getGymSettings:", error);
    return {
      settings: null,
      error: "An unexpected error occurred",
      loading: false,
    };
  }
};

/**
 * Save settings with validation and error handling
 */
export const saveGymSettingsWithValidation = async (
  settings: Partial<GymSettings>,
): Promise<{
  success: boolean;
  error: string | null;
  data: GymSettings | null;
}> => {
  try {
    // Validate settings
    const validation = validateSettings(settings);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(", "),
        data: null,
      };
    }

    // Save settings
    const { data, error } = await saveGymSettings(settings);

    if (error) {
      return {
        success: false,
        error: "Failed to save settings",
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    console.error("Error in saveGymSettingsWithValidation:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
      data: null,
    };
  }
};
