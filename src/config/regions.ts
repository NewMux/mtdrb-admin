// Starting points for configuring a gym in a given country. Everything here is
// a SUGGESTION that pre-fills the setup form; the owner can change every value,
// and the tax rates are the standard rate on the day this was written, not tax
// advice. A country that is not listed (or "Other") simply pre-fills nothing.

export interface RegionPreset {
  /** ISO 3166-1 alpha-2 */
  code: string;
  /** ISO 4217 */
  currency: string;
  /** IANA zone of the main population centre; large countries have several */
  timezone: string;
  /** What the local sales tax is called on an invoice */
  taxName: string;
  /** Standard rate in percent. 0 = no general sales tax, or it varies locally. */
  taxRate: number;
}

export const REGION_PRESETS: readonly RegionPreset[] = [
  // Gulf and wider Middle East / North Africa
  { code: "BH", currency: "BHD", timezone: "Asia/Bahrain", taxName: "VAT", taxRate: 10 },
  { code: "AE", currency: "AED", timezone: "Asia/Dubai", taxName: "VAT", taxRate: 5 },
  { code: "SA", currency: "SAR", timezone: "Asia/Riyadh", taxName: "VAT", taxRate: 15 },
  { code: "OM", currency: "OMR", timezone: "Asia/Muscat", taxName: "VAT", taxRate: 5 },
  { code: "KW", currency: "KWD", timezone: "Asia/Kuwait", taxName: "VAT", taxRate: 0 },
  { code: "QA", currency: "QAR", timezone: "Asia/Qatar", taxName: "VAT", taxRate: 0 },
  { code: "EG", currency: "EGP", timezone: "Africa/Cairo", taxName: "VAT", taxRate: 14 },
  { code: "JO", currency: "JOD", timezone: "Asia/Amman", taxName: "GST", taxRate: 16 },
  { code: "LB", currency: "LBP", timezone: "Asia/Beirut", taxName: "VAT", taxRate: 11 },
  { code: "MA", currency: "MAD", timezone: "Africa/Casablanca", taxName: "VAT", taxRate: 20 },
  { code: "TN", currency: "TND", timezone: "Africa/Tunis", taxName: "VAT", taxRate: 19 },
  { code: "TR", currency: "TRY", timezone: "Europe/Istanbul", taxName: "VAT", taxRate: 20 },
  // Europe
  { code: "GB", currency: "GBP", timezone: "Europe/London", taxName: "VAT", taxRate: 20 },
  { code: "IE", currency: "EUR", timezone: "Europe/Dublin", taxName: "VAT", taxRate: 23 },
  { code: "DE", currency: "EUR", timezone: "Europe/Berlin", taxName: "VAT", taxRate: 19 },
  { code: "FR", currency: "EUR", timezone: "Europe/Paris", taxName: "VAT", taxRate: 20 },
  { code: "ES", currency: "EUR", timezone: "Europe/Madrid", taxName: "VAT", taxRate: 21 },
  { code: "IT", currency: "EUR", timezone: "Europe/Rome", taxName: "VAT", taxRate: 22 },
  { code: "NL", currency: "EUR", timezone: "Europe/Amsterdam", taxName: "VAT", taxRate: 21 },
  // Americas (US sales tax is set by state and city, so no single rate is suggested)
  { code: "US", currency: "USD", timezone: "America/New_York", taxName: "Sales tax", taxRate: 0 },
  { code: "CA", currency: "CAD", timezone: "America/Toronto", taxName: "GST/HST", taxRate: 5 },
  // Asia-Pacific
  { code: "IN", currency: "INR", timezone: "Asia/Kolkata", taxName: "GST", taxRate: 18 },
  { code: "SG", currency: "SGD", timezone: "Asia/Singapore", taxName: "GST", taxRate: 9 },
  { code: "AU", currency: "AUD", timezone: "Australia/Sydney", taxName: "GST", taxRate: 10 },
  { code: "NZ", currency: "NZD", timezone: "Pacific/Auckland", taxName: "GST", taxRate: 15 },
  // Africa
  { code: "ZA", currency: "ZAR", timezone: "Africa/Johannesburg", taxName: "VAT", taxRate: 15 },
  { code: "NG", currency: "NGN", timezone: "Africa/Lagos", taxName: "VAT", taxRate: 7.5 },
  { code: "KE", currency: "KES", timezone: "Africa/Nairobi", taxName: "VAT", taxRate: 16 },
];

export function getRegionPreset(code: string | null | undefined): RegionPreset | null {
  const normalized = (code ?? "").trim().toUpperCase();
  return REGION_PRESETS.find((r) => r.code === normalized) ?? null;
}

/** A country's display name in the given UI language (browser data, no table to maintain). */
export function countryName(code: string, language: string): string {
  try {
    return new Intl.DisplayNames([language], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function currencyName(code: string, language: string): string {
  try {
    return new Intl.DisplayNames([language], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

const FALLBACK_CURRENCIES = [
  "AED", "AUD", "BHD", "CAD", "EGP", "EUR", "GBP", "INR", "JOD", "KES", "KWD", "LBP", "MAD",
  "NGN", "NZD", "OMR", "QAR", "SAR", "SGD", "TND", "TRY", "USD", "ZAR",
];

type IntlWithSupported = typeof Intl & { supportedValuesOf?: (key: string) => string[] };

function supportedValues(key: "currency" | "timeZone"): string[] | null {
  const fn = (Intl as IntlWithSupported).supportedValuesOf;
  if (typeof fn !== "function") return null;
  try {
    return fn(key);
  } catch {
    return null;
  }
}

/** Every currency the browser knows, with the suggested ones guaranteed present. */
export function listCurrencies(): string[] {
  const all = new Set<string>(supportedValues("currency") ?? FALLBACK_CURRENCIES);
  for (const r of REGION_PRESETS) all.add(r.currency);
  return [...all].sort();
}

export function listTimezones(): string[] {
  const all = new Set<string>(supportedValues("timeZone") ?? REGION_PRESETS.map((r) => r.timezone));
  for (const r of REGION_PRESETS) all.add(r.timezone);
  all.add("UTC");
  return [...all].sort();
}

export function isValidTimezone(value: string): boolean {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function isValidCurrencyCode(value: string): boolean {
  return /^[A-Z]{3}$/.test(value);
}
