import { describe, it, expect } from "vitest";
import {
  resolveGymConfig,
  taxRateToApply,
  validateGymConfig,
  buildSettingsWrite,
  configToInput,
  applyRegionPreset,
  buildTaxBreakdown,
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
  tax: { enabled: true, components: [{ name: "VAT", rate: 10, compound: false }], number: "220001234500002", pricesIncludeTax: false },
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
    expect(c.tax).toMatchObject({
      enabled: true,
      rate: 10,
      name: "VAT",
      components: [{ name: "VAT", rate: 10, compound: false }],
      number: "",
      pricesIncludeTax: false,
    });
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
      tax: { enabled: true, name: "GST", rate: 7.5, components: [{ name: "GST", rate: 7.5, compound: false }], number: "123", pricesIncludeTax: true },
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
          tax: { enabled: false, components: [], number: "", pricesIncludeTax: false },
          business: { legalName: "", address: "", phone: "", email: "", website: "" },
        }),
      ),
    ).toEqual({});
  });

  it("rejects bad region values", () => {
    const errors = validateGymConfig(input({ currency: "bhd", timezone: "Mars/Base", country: "BAH" }));
    expect(errors).toMatchObject({ currency: "currency_invalid", timezone: "timezone_invalid", country: "country_invalid" });
  });

  const withTax = (components: GymConfigInput["tax"]["components"], over: Partial<GymConfigInput["tax"]> = {}) =>
    input({ tax: { ...input().tax, components, ...over } });
  const one = (rate: number) => [{ name: "VAT", rate, compound: false }];

  it("checks each tax rate against numeric(5,2)", () => {
    const t = (rate: number) => validateGymConfig(withTax(one(rate))).taxRate0;
    expect(t(0)).toBeUndefined();
    expect(t(7.5)).toBeUndefined();
    expect(t(100)).toBeUndefined();
    expect(t(-1)).toBe("tax_rate_invalid");
    expect(t(100.01)).toBe("tax_rate_invalid");
    expect(t(Number.NaN)).toBe("tax_rate_invalid");
    expect(t(7.555)).toBe("tax_rate_precision");
  });

  it("requires a name for every tax only while tax is on, and bounds lengths", () => {
    expect(validateGymConfig(withTax([{ name: "  ", rate: 5, compound: false }])).taxName0).toBe("tax_name_required");
    expect(validateGymConfig(withTax([{ name: "", rate: 0, compound: false }], { enabled: false })).taxName0).toBeUndefined();
    expect(validateGymConfig(withTax([{ name: "x".repeat(25), rate: 5, compound: false }])).taxName0).toBe("tax_name_too_long");
    expect(validateGymConfig(withTax(one(5), { number: "9".repeat(41) })).taxNumber).toBe("tax_number_too_long");
  });

  it("allows up to five taxes and refuses none or six", () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `T${i}`, rate: 1, compound: false }));
    expect(validateGymConfig(withTax(many(5)))).toEqual({});
    expect(validateGymConfig(withTax(many(6))).taxCount).toBe("tax_count");
    expect(validateGymConfig(withTax([])).taxCount).toBe("tax_count");
  });

  it("validates several taxes, reporting the row that is wrong", () => {
    const errors = validateGymConfig(
      withTax([
        { name: "Service", rate: 10, compound: false },
        { name: "", rate: 5, compound: true },
        { name: "VAT", rate: 200, compound: false },
      ]),
    );
    expect(errors).toMatchObject({ taxName1: "tax_name_required", taxRate2: "tax_rate_invalid" });
    expect(errors.taxName0).toBeUndefined();
    expect(errors.taxCombined).toBeUndefined(); // not reported while a rate itself is invalid
  });

  it("rejects taxes that together cannot be stored as a two-decimal rate, or exceed 100%", () => {
    const compoundPair = [
      { name: "A", rate: 7.5, compound: false },
      { name: "B", rate: 8.25, compound: true },
    ];
    expect(validateGymConfig(withTax(compoundPair)).taxCombined).toBe("tax_combined_precision");
    const big = [
      { name: "A", rate: 80, compound: false },
      { name: "B", rate: 50, compound: false },
    ];
    expect(validateGymConfig(withTax(big)).taxCombined).toBe("tax_combined_invalid");
    const ok = [
      { name: "A", rate: 10, compound: false },
      { name: "B", rate: 10, compound: true },
    ];
    expect(validateGymConfig(withTax(ok))).toEqual({});
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
    expect(w.metadata.tax).toEqual({
      name: "VAT",
      components: [{ name: "VAT", rate: 10, compound: false }],
      number: "220001234500002",
      prices_include_tax: false,
    });
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
    expect(configToInput(c)).toEqual({ ...input(), expenseCategories: [] });
    expect(c.configured).toBe(true);
  });

  it("normalises case and whitespace", () => {
    const w = buildSettingsWrite(input({ currency: " bhd ", country: "bh" }), {}, now);
    expect(w.currency).toBe("BHD");
    expect((w.metadata.general as Record<string, string>).country).toBe("BH");
  });
});

describe("applyRegionPreset", () => {
  const owner = input({ tax: { enabled: true, components: [{ name: "VAT", rate: 10, compound: false }], number: "MY-TAX-ID", pricesIncludeTax: true } });

  it("replaces currency, timezone and tax suggestion but keeps the owner's own details", () => {
    const next = applyRegionPreset(owner, getRegionPreset("SA")!);
    expect(next).toMatchObject({ country: "SA", currency: "SAR", timezone: "Asia/Riyadh" });
    expect(next.tax).toEqual({
      enabled: true,
      components: [{ name: "VAT", rate: 15, compound: false }],
      number: "MY-TAX-ID",
      pricesIncludeTax: true,
    });
    expect(next.business).toEqual(owner.business);
  });

  it("turns tax off for a country with no national rate instead of inventing one", () => {
    const next = applyRegionPreset(owner, getRegionPreset("KW")!);
    expect(next.tax).toMatchObject({ enabled: false, components: [{ name: "VAT", rate: 0, compound: false }] });
    expect(next.currency).toBe("KWD");
  });

  it("produces a configuration that validates", () => {
    for (const r of REGION_PRESETS) {
      expect(validateGymConfig(applyRegionPreset(input(), r))).toEqual({});
    }
  });
});

describe("several taxes", () => {
  const now = new Date("2026-10-24T00:00:00Z");
  const two = input({
    tax: {
      enabled: true,
      components: [
        { name: "Service charge", rate: 10, compound: false },
        { name: "VAT", rate: 10, compound: true },
      ],
      number: "",
      pricesIncludeTax: false,
    },
  });

  it("writes the combined rate to the column and the list to metadata", () => {
    const w = buildSettingsWrite(two, {}, now);
    expect(w).toMatchObject({ vat_enabled: true, vat_rate: 21 });
    expect(w.metadata.tax).toMatchObject({
      name: "Service charge + VAT",
      components: [
        { name: "Service charge", rate: 10, compound: false },
        { name: "VAT", rate: 10, compound: true },
      ],
    });
  });

  it("reads them back, with the column as the rate in force", () => {
    const w = buildSettingsWrite(two, {}, now);
    const c = resolveGymConfig(w, defaults);
    expect(c.tax.rate).toBe(21);
    expect(c.tax.name).toBe("Service charge + VAT");
    expect(configToInput(c)).toEqual({ ...two, expenseCategories: [] });
    expect(taxRateToApply(c)).toBe(21);
  });

  it("switching tax off keeps the list but charges nothing", () => {
    const off = { ...two, tax: { ...two.tax, enabled: false } };
    const w = buildSettingsWrite(off, {}, now);
    expect(w).toMatchObject({ vat_enabled: false, vat_rate: 0 });
    const c = resolveGymConfig(w, defaults);
    expect(c.tax.components).toHaveLength(2);
    expect(taxRateToApply(c)).toBe(0);
  });

  it("a gym that configured a single tax before taxes were a list still loads as one tax", () => {
    const c = resolveGymConfig(
      { currency: "BHD", vat_enabled: true, vat_rate: 10, metadata: { tax: { name: "VAT", number: "1" } } },
      defaults,
    );
    expect(c.tax.components).toEqual([{ name: "VAT", rate: 10, compound: false }]);
    expect(c.tax.rate).toBe(10);
  });

  it("drops malformed stored entries instead of crashing", () => {
    const c = resolveGymConfig(
      {
        currency: "USD",
        vat_enabled: true,
        vat_rate: 5,
        metadata: { tax: { components: [null, { name: "", rate: 5 }, { name: "OK", rate: "x" }, { name: "Good", rate: 5 }] } },
      },
      defaults,
    );
    expect(c.tax.components).toEqual([{ name: "Good", rate: 5, compound: false }]);
  });
});

describe("buildTaxBreakdown", () => {
  const two = resolveGymConfig(
    buildSettingsWrite(
      input({
        tax: {
          enabled: true,
          components: [
            { name: "Service", rate: 10, compound: false },
            { name: "VAT", rate: 10, compound: true },
          ],
          number: "",
          pricesIncludeTax: false,
        },
      }),
      {},
      new Date("2026-10-24T00:00:00Z"),
    ),
    defaults,
  );

  it("splits a document charged at the gym's rate between the gym's taxes", () => {
    expect(buildTaxBreakdown(two, 21, 21, "USD")?.map((l) => [l.name, l.amount])).toEqual([
      ["Service", 10],
      ["VAT", 11],
    ]);
  });

  it("puts the whole amount on one line when the user changed the rate", () => {
    expect(buildTaxBreakdown(two, 5, 5, "USD")).toEqual([
      { name: "Service + VAT", rate: 5, compound: false, amount: 5 },
    ]);
  });

  it("is null when no tax was charged", () => {
    expect(buildTaxBreakdown(two, 0, 0, "USD")).toBeNull();
  });
});

describe("expense categories", () => {
  it("are stored under metadata.expenses and read back, keeping other keys", () => {
    const w = buildSettingsWrite(input({ expenseCategories: ["Towels", "Laundry"] }), { expenses: { other: 1 } }, new Date("2026-10-25T00:00:00Z"));
    expect(w.metadata.expenses).toEqual({ other: 1, categories: ["Towels", "Laundry"] });
    expect(resolveGymConfig(w, defaults).expenseCategories).toEqual(["Towels", "Laundry"]);
  });

  it("are left alone when the input does not mention them", () => {
    const w = buildSettingsWrite(input(), { expenses: { categories: ["Towels"] } }, new Date("2026-10-25T00:00:00Z"));
    expect(w.metadata.expenses).toEqual({ categories: ["Towels"] });
  });

  it("are cleaned when read: trimmed, deduplicated, no built-ins, no junk", () => {
    const c = resolveGymConfig(
      { metadata: { expenses: { categories: [" Towels ", "towels", "Rent", "", 5, "x".repeat(41), "Spa  day"] } } },
      defaults,
    );
    expect(c.expenseCategories).toEqual(["Towels", "Spa day"]);
  });

  it("an older gym with none has an empty list", () => {
    expect(resolveGymConfig(null, defaults).expenseCategories).toEqual([]);
  });

  it("are validated before saving", () => {
    expect(validateGymConfig(input({ expenseCategories: ["Towels"] }))).toEqual({});
    expect(validateGymConfig(input({ expenseCategories: ["Rent"] })).expenseCategories).toBe("category_duplicate");
    expect(validateGymConfig(input({ expenseCategories: ["Towels", "towels"] })).expenseCategories).toBe("category_duplicate");
    expect(validateGymConfig(input({ expenseCategories: ["  "] })).expenseCategories).toBe("category_empty");
    expect(validateGymConfig(input({ expenseCategories: ["x".repeat(41)] })).expenseCategories).toBe("category_too_long");
    expect(validateGymConfig(input({ expenseCategories: Array.from({ length: 31 }, (_, i) => `C${i}`) })).expenseCategories).toBe("category_count");
  });
});
