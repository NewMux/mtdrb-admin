import { createContext, useContext } from "react";
import {
  resolveGymConfig,
  type ConfigErrors,
  type GymConfig,
  type GymConfigDefaults,
  type GymConfigInput,
} from "../config/gymConfig";
import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_CURRENCY,
  DEFAULT_TIMEZONE,
  DEFAULT_VAT_RATE,
} from "../config/runtimeConfig";

/** What a gym that has not configured itself yet gets: the platform's env defaults. */
export const PLATFORM_CONFIG_DEFAULTS: GymConfigDefaults = {
  currency: DEFAULT_CURRENCY,
  timezone: DEFAULT_TIMEZONE,
  countryCode: DEFAULT_COUNTRY_CODE,
  vatRate: DEFAULT_VAT_RATE,
};

export type SaveGymConfigResult =
  | { ok: true }
  | { ok: false; errors: ConfigErrors }
  | { ok: false; message: string };

export interface GymConfigContextType {
  config: GymConfig;
  /** True until the first load for the signed-in gym has finished */
  loading: boolean;
  /** Re-read gym_settings (after something else wrote it) */
  refresh: () => Promise<void>;
  /** Validate and persist; the in-memory config updates on success */
  save: (input: GymConfigInput) => Promise<SaveGymConfigResult>;
}

export const GymConfigContext = createContext<GymConfigContextType | undefined>(undefined);

const FALLBACK: GymConfigContextType = {
  config: resolveGymConfig(null, PLATFORM_CONFIG_DEFAULTS),
  loading: false,
  refresh: async () => {},
  save: async () => ({ ok: false, message: "No gym is loaded" }),
};

/**
 * The signed-in gym's own region, currency, tax and business configuration.
 * Outside a provider (tests, public pages) it returns the platform defaults.
 */
export function useGymConfig(): GymConfigContextType {
  return useContext(GymConfigContext) ?? FALLBACK;
}
