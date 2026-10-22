// A gym's own business configuration - region, currency, tax and business
// details - and the single place that reads it from / writes it to
// gym_settings. The platform-wide env values in runtimeConfig.ts are only the
// starting point for a gym that has not configured itself yet.
//
// Storage (no migration needed): the existing columns currency / vat_enabled /
// vat_rate, and namespaced keys inside the existing metadata jsonb:
//   general { country, timezone, language, gym_name, logo_url, ... }
//   tax     { name, number, prices_include_tax }
//   business{ legal_name, address, phone, email, website }
//   setup   { configured_at }
// Writes MERGE into the existing metadata so other namespaces (security,
// dashboardTargets) and other keys are never dropped.

import { isValidCurrencyCode, isValidTimezone, type RegionPreset } from "./regions";

export interface TaxConfig {
  enabled: boolean;
  /** "VAT", "GST", "Sales tax"... shown on invoices and in reports */
  name: string;
  /** Standard rate in percent, as configured (apply with taxRateToApply) */
  rate: number;
  /** The gym's tax registration number, printed on invoices */
  number: string;
  /** Whether entered prices already include tax */
  pricesIncludeTax: boolean;
}

export interface BusinessProfile {
  legalName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface GymConfig {
  /** ISO 3166-1 alpha-2, or "" if not chosen */
  country: string;
  currency: string;
  timezone: string;
  tax: TaxConfig;
  business: BusinessProfile;
  /** True once the owner has saved this section (setup.configured_at is set) */
  configured: boolean;
}

/** The editable part: what the setup wizard and Settings > Business & tax save. */
export type GymConfigInput = Omit<GymConfig, "configured">;

export interface GymConfigDefaults {
  currency: string;
  timezone: string;
  countryCode: string;
  vatRate: number;
}

export interface GymSettingsRow {
  currency?: string | null;
  vat_enabled?: boolean | null;
  vat_rate?: number | string | null;
  metadata?: Record<string, unknown> | null;
}

export const MAX_TAX_NAME = 24;
export const MAX_TAX_NUMBER = 40;

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function resolveGymConfig(
  row: GymSettingsRow | null | undefined,
  defaults: GymConfigDefaults,
): GymConfig {
  const meta = obj(row?.metadata);
  const general = obj(meta.general);
  const tax = obj(meta.tax);
  const business = obj(meta.business);
  const setup = obj(meta.setup);

  const rawRate = Number(row?.vat_rate);
  const rate = row && Number.isFinite(rawRate) && rawRate >= 0 ? rawRate : defaults.vatRate;
  const enabled = row ? row.vat_enabled === true : defaults.vatRate > 0;

  return {
    country: (str(general.country) || defaults.countryCode).toUpperCase(),
    currency: (row?.currency || defaults.currency).toUpperCase(),
    timezone: str(general.timezone) || defaults.timezone,
    tax: {
      enabled,
      name: str(tax.name).trim() || "VAT",
      rate,
      number: str(tax.number).trim(),
      pricesIncludeTax: tax.prices_include_tax === true,
    },
    business: {
      legalName: str(business.legal_name),
      address: str(business.address),
      phone: str(business.phone),
      email: str(business.email),
      website: str(business.website),
    },
    configured: typeof setup.configured_at === "string" && setup.configured_at.length > 0,
  };
}

/** The percentage to actually charge: 0 whenever tax is switched off. */
export function taxRateToApply(config: Pick<GymConfig, "tax">): number {
  return config.tax.enabled ? config.tax.rate : 0;
}

export type ConfigErrorCode =
  | "currency_invalid"
  | "timezone_invalid"
  | "country_invalid"
  | "tax_name_required"
  | "tax_name_too_long"
  | "tax_rate_invalid"
  | "tax_rate_precision"
  | "tax_number_too_long"
  | "email_invalid"
  | "website_invalid";

export type ConfigErrors = Partial<Record<string, ConfigErrorCode>>;

/** Field-keyed error codes; empty object means valid. gym_settings.vat_rate is numeric(5,2). */
export function validateGymConfig(input: GymConfigInput): ConfigErrors {
  const errors: ConfigErrors = {};

  if (!isValidCurrencyCode(input.currency)) errors.currency = "currency_invalid";
  if (!isValidTimezone(input.timezone)) errors.timezone = "timezone_invalid";
  if (input.country && !/^[A-Z]{2}$/.test(input.country)) errors.country = "country_invalid";

  if (input.tax.enabled) {
    const name = input.tax.name.trim();
    if (!name) errors.taxName = "tax_name_required";
    else if (name.length > MAX_TAX_NAME) errors.taxName = "tax_name_too_long";

    const rate = input.tax.rate;
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) errors.taxRate = "tax_rate_invalid";
    else if (Math.round(rate * 100) / 100 !== rate) errors.taxRate = "tax_rate_precision";
  }
  if (input.tax.number.trim().length > MAX_TAX_NUMBER) errors.taxNumber = "tax_number_too_long";

  const email = input.business.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "email_invalid";

  const website = input.business.website.trim();
  if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) errors.website = "website_invalid";

  return errors;
}

export interface GymSettingsWrite {
  currency: string;
  vat_enabled: boolean;
  vat_rate: number;
  metadata: Record<string, unknown>;
}

/**
 * The gym_settings values to upsert for `input`, merged into `existingMetadata`
 * so nothing else stored there is lost. `now` stamps setup.configured_at the
 * first time only.
 */
export function buildSettingsWrite(
  input: GymConfigInput,
  existingMetadata: Record<string, unknown> | null | undefined,
  now: Date,
): GymSettingsWrite {
  const meta = obj(existingMetadata);
  const setup = obj(meta.setup);

  return {
    currency: input.currency.trim().toUpperCase(),
    vat_enabled: input.tax.enabled,
    vat_rate: input.tax.enabled ? input.tax.rate : 0,
    metadata: {
      ...meta,
      general: {
        ...obj(meta.general),
        country: input.country.trim().toUpperCase(),
        timezone: input.timezone,
      },
      tax: {
        ...obj(meta.tax),
        name: input.tax.name.trim() || "VAT",
        number: input.tax.number.trim(),
        prices_include_tax: input.tax.pricesIncludeTax,
      },
      business: {
        ...obj(meta.business),
        legal_name: input.business.legalName.trim(),
        address: input.business.address.trim(),
        phone: input.business.phone.trim(),
        email: input.business.email.trim(),
        website: input.business.website.trim(),
      },
      setup: {
        ...setup,
        configured_at:
          typeof setup.configured_at === "string" && setup.configured_at
            ? setup.configured_at
            : now.toISOString(),
      },
    },
  };
}

export function configToInput(config: GymConfig): GymConfigInput {
  const { configured: _configured, ...input } = config;
  void _configured;
  return input;
}

/**
 * `input` with a country preset applied: its currency, timezone and tax
 * suggestion replace the current ones. Business details and the tax number are
 * the owner's own and are left alone. A country with no national rate turns tax
 * off instead of inventing one.
 */
export function applyRegionPreset(input: GymConfigInput, preset: RegionPreset): GymConfigInput {
  return {
    ...input,
    country: preset.code,
    currency: preset.currency,
    timezone: preset.timezone,
    tax: {
      ...input.tax,
      enabled: preset.taxRate > 0,
      name: preset.taxName,
      rate: preset.taxRate,
    },
  };
}
