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
import { cleanExpenseCategories, validateExpenseCategories, type ExpenseCategoryError } from "./expenseCategories";
import {
  allocateTax,
  combinedRate,
  taxLabel,
  MAX_TAX_COMPONENTS,
  type TaxBreakdownLine,
  type TaxComponent,
} from "../utils/taxMath";

export type { TaxComponent };

/** What the owner edits about tax. */
export interface TaxSettings {
  enabled: boolean;
  /**
   * The taxes charged on a sale, in the order they apply (see utils/taxMath.ts).
   * Most gyms have exactly one ("VAT" at some rate); a gym can add more, for
   * example a service charge, or GST plus a provincial tax.
   */
  components: TaxComponent[];
  /** The gym's tax registration number, printed on invoices */
  number: string;
  /** Whether entered prices already include tax */
  pricesIncludeTax: boolean;
}

/** TaxSettings plus what is worked out from them. */
export interface TaxConfig extends TaxSettings {
  /** Heading for the taxes together: "VAT" or "Service charge + VAT" */
  name: string;
  /**
   * The single combined rate (percent) every line is charged at - the value in
   * gym_settings.vat_rate. Apply it with taxRateToApply.
   */
  rate: number;
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
  /** Expense categories the owner added to the built-in ones (see config/expenseCategories.ts) */
  expenseCategories: string[];
  /** True once the owner has saved this section (setup.configured_at is set) */
  configured: boolean;
}

/** The editable part: what the setup wizard and Settings > Business & tax save. */
export interface GymConfigInput {
  country: string;
  currency: string;
  timezone: string;
  tax: TaxSettings;
  business: BusinessProfile;
  /** Left out = keep whatever is stored. */
  expenseCategories?: string[];
}

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

function readComponents(value: unknown): TaxComponent[] {
  if (!Array.isArray(value)) return [];
  const out: TaxComponent[] = [];
  for (const item of value.slice(0, MAX_TAX_COMPONENTS)) {
    const c = obj(item);
    const name = str(c.name).trim();
    const rate = Number(c.rate);
    if (!name || !Number.isFinite(rate) || rate < 0) continue;
    out.push({ name, rate, compound: c.compound === true });
  }
  return out;
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
  const columnRate = row && Number.isFinite(rawRate) && rawRate >= 0 ? rawRate : defaults.vatRate;
  const enabled = row ? row.vat_enabled === true : defaults.vatRate > 0;

  // Gyms that configured a single tax before taxes became a list have only the
  // name in metadata and the rate in the column: that is one component.
  const stored = readComponents(tax.components);
  const components: TaxComponent[] =
    stored.length > 0 ? stored : [{ name: str(tax.name).trim() || "VAT", rate: columnRate, compound: false }];

  return {
    country: (str(general.country) || defaults.countryCode).toUpperCase(),
    currency: (row?.currency || defaults.currency).toUpperCase(),
    timezone: str(general.timezone) || defaults.timezone,
    tax: {
      enabled,
      components,
      name: taxLabel(components),
      // The column is what invoice maths multiplies by, so it is the rate in force.
      rate: columnRate,
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
    expenseCategories: cleanExpenseCategories(obj(meta.expenses).categories),
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
  | "tax_count"
  | "tax_combined_invalid"
  | "tax_combined_precision"
  | "tax_number_too_long"
  | "email_invalid"
  | "website_invalid"
  | ExpenseCategoryError;

export type ConfigErrors = Partial<Record<string, ConfigErrorCode>>;

/** Field-keyed error codes; empty object means valid. gym_settings.vat_rate is numeric(5,2). */
export function validateGymConfig(input: GymConfigInput): ConfigErrors {
  const errors: ConfigErrors = {};

  if (!isValidCurrencyCode(input.currency)) errors.currency = "currency_invalid";
  if (!isValidTimezone(input.timezone)) errors.timezone = "timezone_invalid";
  if (input.country && !/^[A-Z]{2}$/.test(input.country)) errors.country = "country_invalid";

  if (input.tax.enabled) {
    const components = input.tax.components;
    if (components.length < 1 || components.length > MAX_TAX_COMPONENTS) errors.taxCount = "tax_count";

    let allRatesValid = true;
    components.forEach((component, i) => {
      const name = component.name.trim();
      if (!name) errors[`taxName${i}`] = "tax_name_required";
      else if (name.length > MAX_TAX_NAME) errors[`taxName${i}`] = "tax_name_too_long";

      const rate = component.rate;
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        errors[`taxRate${i}`] = "tax_rate_invalid";
        allRatesValid = false;
      } else if (Math.round(rate * 100) / 100 !== rate) {
        errors[`taxRate${i}`] = "tax_rate_precision";
        allRatesValid = false;
      }
    });

    // Every rate column in the database is numeric(5,2): the taxes together must
    // come to a rate that fits it.
    if (allRatesValid && components.length > 0) {
      const combined = combinedRate(components);
      if (combined === null) errors.taxCombined = "tax_combined_precision";
      else if (combined > 100) errors.taxCombined = "tax_combined_invalid";
    }
  }
  if (input.tax.number.trim().length > MAX_TAX_NUMBER) errors.taxNumber = "tax_number_too_long";

  if (input.expenseCategories !== undefined) {
    const problem = validateExpenseCategories(input.expenseCategories);
    if (problem) errors.expenseCategories = problem;
  }

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
    // The one combined rate every line is charged at (validateGymConfig has
    // already checked it fits numeric(5,2)).
    vat_rate: input.tax.enabled ? (combinedRate(input.tax.components) ?? 0) : 0,
    metadata: {
      ...meta,
      general: {
        ...obj(meta.general),
        country: input.country.trim().toUpperCase(),
        timezone: input.timezone,
      },
      tax: {
        ...obj(meta.tax),
        // "name" is the older single-tax field; keep it as the heading so an
        // older build reading this gym still shows something sensible.
        name: taxLabel(input.tax.components),
        components: input.tax.components.map((c) => ({
          name: c.name.trim(),
          rate: c.rate,
          compound: c.compound,
        })),
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
      ...(input.expenseCategories === undefined
        ? {}
        : {
            expenses: {
              ...obj(meta.expenses),
              categories: cleanExpenseCategories(input.expenseCategories),
            },
          }),
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
  const { enabled, components, number, pricesIncludeTax } = config.tax;
  return {
    country: config.country,
    currency: config.currency,
    timezone: config.timezone,
    tax: { enabled, components: components.map((c) => ({ ...c })), number, pricesIncludeTax },
    business: { ...config.business },
    expenseCategories: [...config.expenseCategories],
  };
}

/**
 * `input` with a country preset applied: its currency, timezone and tax
 * suggestion replace the current ones (a single tax; the owner can add more).
 * Business details and the tax number are the owner's own and are left alone. A country with no national rate turns tax
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
      components: [{ name: preset.taxName, rate: preset.taxRate, compound: false }],
    },
  };
}

/**
 * How `taxAmount` splits between the gym's taxes, to store on a new document.
 * `rateUsed` is the rate the document was actually charged at: if the user
 * overrode the gym's rate (a different or exempt rate on the form), splitting by
 * the gym's taxes would be wrong, so the whole amount goes on one line at that
 * rate. Returns null when no tax was charged.
 */
export function buildTaxBreakdown(
  config: Pick<GymConfig, "tax">,
  taxAmount: number,
  rateUsed: number,
  currency: string,
): TaxBreakdownLine[] | null {
  if (!(taxAmount > 0)) return null;
  if (Math.abs(rateUsed - taxRateToApply(config)) < 0.005) {
    return allocateTax(taxAmount, config.tax.components, currency);
  }
  return allocateTax(taxAmount, [{ name: config.tax.name, rate: rateUsed, compound: false }], currency);
}
