import { describe, it, expect } from "vitest";
import {
  resolveGymConfig,
  taxRateToApply,
  validateGymConfig,
  buildSettingsWrite,
  configToInput,
  type GymConfigDefaults,
  type GymConfigInput,
} from "./gymConfig";
import { REGION_PRESETS, getRegionPreset, isValidTimezone, listCurrencies, listTimezones } from "./regions";
import { getCurrencyDecimals } from "../utils/invoiceMath";

const defaults: GymConfigDefaults = { currency: "USD", timezone: "UTC", countryCode: "", vatRate: 0 };

const input = (over: Partial<GymConfigInput> = {}): GymConfigInput => ({
  country: "BH",
  currency: "BHD",
  timezone: "Asia/Bahrain",
  tax: { enabled: true, name: "VAT", rate: 10, number: "220001234500002", pricesIncludeTax: false },
  business: { legalName: "Iron House WLL", address: "Manama", phone: "+973 1700 0000", email: "hi@iron.example", website: "https://iron.example" },
  ...over,
});

describe("region presets", () => {
  it("has unique, well-formed entries with valid zones and rates", () => {
    const codes = REGION_PRESETS.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const r of REGION_PRESETS) {
      expect(r.code).toMatch(/^[A-Z]{2}$/);
      expect(r.currency).toMatch(/^[A-Z]{3}$/);
      expect(isValidTimezone(r.timezone)).toBe(true);
      expect(r.taxRate).toBeGreaterThanOrEqual(0);
      expect(r.taxRate).toBeLessThanOrEqual(100);
      expect(Math.round(r.taxRate * 100) / 100).toBe(r.taxRate);
      expect(r.taxName.length).toBeLessThanOrEqual(24);
    }
  });

  it("looks a country up case-insensitively", () => {
    expect(getRegionPreset("bh")?.currency).toBe("BHD");
    expect(getRegionPreset(" ae ")?.taxRate).toBe(5);
    expect(getRegionPreset("ZZ")).toBeNull();
    expect(getRegionPreset(undefined)).toBeNull();
  });

  it("offers every suggested currency and zone in the pickers", () => {
    const currencies = listCurrencies();
    const zones = listTimezones();
    for (const r of REGION_PRESETS) {
      expect(currencies).toContain(r.currency);
      expect(zones).toContain(r.timezone);
    }
  });

  it("only suggests three-decimal currencies the money code knows about", () => {
    for (const code of ["BHD", "KWD", "OMR", "JOD", "TND"]) {
      expect(getCurrencyDecimals(code)).toBe(3);
    }
  });
});

describe("resolveGymConfig", () => {
  it("falls back to the platform defaults when the gym has no settings row", () => {
    const c = resolveGymConfig(null, { currency: "BHD", timezone: "Asia/Bahrain", countryCode: "bh", vatRate: 10 });
    expect(c.currency).toBe("BHD");
    expect(c.country).toBe("BH");
    expect(c.tax).toMatchObject({ enabled: true, rate: 10, name: "VAT", number: "", pricesIncludeTax: false });
    expect(c.configured).toBe(false);
  });

  it("reads columns and namespaced metadata", () => {
    const c = resolveGymConfig(
      {
        currency: "kwd",
        vat_enabled: true,
        vat_rate: "7.5",
        metadata: {
          general: { country: "kw", timezone: "Asia/Kuwait" },
          tax: { name: "GST", number: " 123 ", prices_include_tax: true },
          business: { legal_name: "X", address: "Y", phone: "1", email: "e@x.co", website: "https://x.co" },
          setup: { configured_at: "2026-10-22T00:00:00Z" },
        },
      },
      defaults,
    );
    expect(c).toMatchObject({
      country: "KW",
      currency: "KWD",
      timezone: "Asia/Kuwait",
      tax: { enabled: true, name: "GST", rate: 7.5, number: "123", pricesIncludeTax: true },
      business: { legalName: "X", address: "Y", phone: "1", email: "e@x.co", website: "https://x.co" },
      configured: true,
    });
  });

  it("tolerates junk metadata", () => {
    const c = resolveGymConfig({ currency: "AED", vat_enabled: false, vat_rate: null, metadata: { general: "x", tax: [], business: 5 } }, defaults);
    expect(c.tax.enabled).toBe(false);
    expect(c.tax.name).toBe("VAT");
    expect(c.business.legalName).toBe("");
  });
});

describe("taxRateToApply", () => {
  it("is zero whenever tax is off, whatever rate is stored", () => {
    const c = resolveGymConfig({ currency: "AED", vat_enabled: false, vat_rate: 5 }, defaults);
    expect(taxRateToApply(c)).toBe(0);
    expect(taxRateToApply({ tax: { ...c.tax, enabled: true } })).toBe(5);
  });
});

describe("validateGymConfig", () => {
  it("accepts a complete valid configuration", () => {
    expect(validateGymConfig(input())).toEqual({});
  });

  it("accepts a gym with tax off and nothing optional filled in", () => {
    expect(
      validateGymConfig(
        input({
          country: "",
          tax: { enabled: false, name: "", rate: 0, number: "", pricesIncludeTax: false },
          business: { legalName: "", address: "", phone: "", email: "", website: "" },
        }),
      ),
    ).toEqual({});
  });

  it("rejects bad region values", () => {
    const errors = validateGymConfig(input({ currency: "bhd", timezone: "Mars/Base", country: "BAH" }));
    expect(errors).toMatchObject({ currency: "currency_invalid", timezone: "timezone_invalid", country: "country_invalid" });
  });

  it("checks the tax rate against numeric(5,2)", () => {
    const t = (rate: number) => validateGymConfig(input({ tax: { ...input().tax, rate } })).taxRate;
    expect(t(0)).toBeUndefined();
    expect(t(7.5)).toBeUndefined();
    expect(t(100)).toBeUndefined();
    expect(t(-1)).toBe("tax_rate_invalid");
    expect(t(100.01)).toBe("tax_rate_invalid");
    expect(t(Number.NaN)).toBe("tax_rate_invalid");
    expect(t(7.555)).toBe("tax_rate_precision");
  });

  it("requires a tax name only while tax is on, and bounds lengths", () => {
    expect(validateGymConfig(input({ tax: { ...input().tax, name: "  " } })).taxName).toBe("tax_name_required");
    expect(validateGymConfig(input({ tax: { ...input().tax, enabled: false, name: "" } })).taxName).toBeUndefined();
    expect(validateGymConfig(input({ tax: { ...input().tax, name: "x".repeat(25) } })).taxName).toBe("tax_name_too_long");
    expect(validateGymConfig(input({ tax: { ...input().tax, number: "9".repeat(41) } })).taxNumber).toBe("tax_number_too_long");
  });

  it("checks email and website shape", () => {
    expect(validateGymConfig(input({ business: { ...input().business, email: "nope" } })).email).toBe("email_invalid");
    expect(validateGymConfig(input({ business: { ...input().business, website: "javascript:alert(1)" } })).website).toBe("website_invalid");
    expect(validateGymConfig(input({ business: { ...input().business, website: "iron.example" } })).website).toBe("website_invalid");
  });
});

describe("buildSettingsWrite", () => {
  const now = new Date("2026-10-22T12:00:00Z");

  it("writes the columns and merges into existing metadata without dropping anything", () => {
    const existing = {
      general: { gym_name: "Iron", language: "ar", dark_mode: true, logo_url: "logos/x.png", country: "AE" },
      security: { session_timeout: 45 },
      dashboardTargets: { revenue: 1000 },
    };
    const w = buildSettingsWrite(input(), existing, now);
    expect(w).toMatchObject({ currency: "BHD", vat_enabled: true, vat_rate: 10 });
    expect(w.metadata.security).toEqual({ session_timeout: 45 });
    expect(w.metadata.dashboardTargets).toEqual({ revenue: 1000 });
    expect(w.metadata.general).toEqual({
      gym_name: "Iron",
      language: "ar",
      dark_mode: true,
      logo_url: "logos/x.png",
      country: "BH",
      timezone: "Asia/Bahrain",
    });
    expect(w.metadata.tax).toEqual({ name: "VAT", number: "220001234500002", prices_include_tax: false });
    expect((w.metadata.business as Record<string, string>).legal_name).toBe("Iron House WLL");
    expect((w.metadata.setup as Record<string, string>).configured_at).toBe(now.toISOString());
  });

  it("stores a zero rate when tax is switched off", () => {
    const w = buildSettingsWrite(input({ tax: { ...input().tax, enabled: false } }), {}, now);
    expect(w).toMatchObject({ vat_enabled: false, vat_rate: 0 });
  });

  it("keeps the first configured_at on later saves", () => {
    const first = buildSettingsWrite(input(), {}, now);
    const later = buildSettingsWrite(input(), first.metadata, new Date("2027-01-01T00:00:00Z"));
    expect((later.metadata.setup as Record<string, string>).configured_at).toBe(now.toISOString());
  });

  it("round-trips through resolveGymConfig", () => {
    const w = buildSettingsWrite(input(), {}, now);
    const c = resolveGymConfig(w, defaults);
    expect(configToInput(c)).toEqual(input());
    expect(c.configured).toBe(true);
  });

  it("normalises case and whitespace", () => {
    const w = buildSettingsWrite(input({ currency: " bhd ", country: "bh" }), {}, now);
    expect(w.currency).toBe("BHD");
    expect((w.metadata.general as Record<string, string>).country).toBe("BH");
  });
});
