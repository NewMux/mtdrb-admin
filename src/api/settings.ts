import { supabase } from "../supabaseClient";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  DEFAULT_TIMEZONE,
  DEFAULT_VAT_RATE,
} from "../config/runtimeConfig";

// The real `gym_settings` table only has these columns (verified directly
// against the Supabase schema). Anything that isn't one of these - gym name,
// profile fields, security policy, etc. - has no column to land in and must
// go through `metadata` (jsonb) or a different table/API entirely.
export interface GymSettings {
  id?: string;
  tenant_id: string;
  currency?: string;
  vat_enabled?: boolean;
  vat_rate?: number;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

export interface SettingsResponse {
  data: GymSettings | null;
  error: Error | null;
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
    const resolvedError =
      error instanceof Error ? error : new Error(String(error));
    return { data: null, error: resolvedError };
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
    const resolvedError =
      error instanceof Error ? error : new Error(String(error));
    return { data: null, error: resolvedError };
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
    const resolvedError =
      error instanceof Error ? error : new Error(String(error));
    return { data: null, error: resolvedError };
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
      currency: DEFAULT_CURRENCY,
      vat_enabled: DEFAULT_VAT_RATE > 0,
      vat_rate: DEFAULT_VAT_RATE,
      metadata: {
        general: {
          gym_name: "",
          timezone: DEFAULT_TIMEZONE,
          language: DEFAULT_LANGUAGE,
          dark_mode: false,
        },
        security: {
          two_factor_auth: false,
          password_expiry: 90,
          session_timeout: 30,
          min_password_length: 8,
          require_special_chars: true,
          lockout_threshold: 5,
        },
      },
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
    const resolvedError =
      error instanceof Error ? error : new Error(String(error));
    return { data: null, error: resolvedError };
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

  // Field-level validation for general/security values (gym name, password
  // policy, etc.) happens in useSettings.ts's own validateSettings() against
  // the local UI shape before it's converted for this API - those fields
  // now live in `metadata`, not as typed top-level columns here.

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
