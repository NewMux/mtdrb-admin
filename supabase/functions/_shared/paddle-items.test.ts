import { describe, expect, it } from "vitest";
import { breakdownItems, extraPriceIdFor, planForPriceId, readPriceConfig, type PriceConfig } from "./paddle-items";

const cfg: PriceConfig = {
  starterPriceId: "pri_starter",
  proPriceId: "pri_pro",
  starterExtraPriceId: "pri_starter_extra",
  proExtraPriceId: "pri_pro_extra",
};

const item = (priceId: string, amount: string, quantity = 1, currency = "BHD", extra: Record<string, unknown> = {}) => ({
  status: "active",
  quantity,
  price: { id: priceId, unit_price: { amount, currency_code: currency } },
  ...extra,
});

describe("readPriceConfig", () => {
  it("reads the four price IDs and trims them", () => {
    const env: Record<string, string> = {
      PADDLE_STARTER_PRICE_ID: " pri_s ",
      PADDLE_PRO_PRICE_ID: "pri_p",
      PADDLE_STARTER_EXTRA_LOCATION_PRICE_ID: "pri_se",
      PADDLE_PRO_EXTRA_LOCATION_PRICE_ID: "",
    };
    expect(readPriceConfig((k) => env[k])).toEqual({
      starterPriceId: "pri_s",
      proPriceId: "pri_p",
      starterExtraPriceId: "pri_se",
      proExtraPriceId: undefined,
    });
  });
});

describe("planForPriceId / extraPriceIdFor", () => {
  it("maps base price IDs to a plan and ignores everything else", () => {
    expect(planForPriceId("pri_starter", cfg)).toBe("starter");
    expect(planForPriceId("pri_pro", cfg)).toBe("pro");
    expect(planForPriceId("pri_starter_extra", cfg)).toBeUndefined();
    expect(planForPriceId(undefined, cfg)).toBeUndefined();
  });

  it("an unset price ID never matches an undefined one", () => {
    expect(planForPriceId(undefined, {})).toBeUndefined();
  });

  it("picks the add-on price for the plan", () => {
    expect(extraPriceIdFor("starter", cfg)).toBe("pri_starter_extra");
    expect(extraPriceIdFor("pro", cfg)).toBe("pri_pro_extra");
  });
});

describe("breakdownItems", () => {
  it("base only: plan, zero extras, base amount", () => {
    expect(breakdownItems([item("pri_starter", "20000")], cfg)).toEqual({
      planTier: "starter",
      extraLocations: 0,
      amount: 20,
      currencyCode: "BHD",
    });
  });

  it("base + extras: counts the quantity and totals the recurring amount (BHD has 3 decimals)", () => {
    const out = breakdownItems([item("pri_starter", "20000"), item("pri_starter_extra", "10000", 2)], cfg);
    expect(out).toEqual({ planTier: "starter", extraLocations: 2, amount: 40, currencyCode: "BHD" });
  });

  it("does not depend on item order", () => {
    const out = breakdownItems([item("pri_pro_extra", "15000", 3), item("pri_pro", "35000")], cfg);
    expect(out).toEqual({ planTier: "pro", extraLocations: 3, amount: 80, currencyCode: "BHD" });
  });

  it("sums in minor units, so fractional prices do not drift", () => {
    const out = breakdownItems([item("pri_starter", "20500"), item("pri_starter_extra", "10250", 3)], cfg);
    expect(out.amount).toBe(51.25);
  });

  it("ignores items Paddle marks inactive (removed add-on)", () => {
    const out = breakdownItems(
      [item("pri_starter", "20000"), item("pri_starter_extra", "10000", 2, "BHD", { status: "inactive" })],
      cfg,
    );
    expect(out.extraLocations).toBe(0);
    expect(out.amount).toBe(20);
  });

  it("returns null extras (leave stored value alone) when no add-on price IDs are configured", () => {
    const noExtras: PriceConfig = { starterPriceId: "pri_starter", proPriceId: "pri_pro" };
    const out = breakdownItems([item("pri_starter", "20000"), item("pri_starter_extra", "10000", 2)], noExtras);
    expect(out.extraLocations).toBeNull();
    expect(out.planTier).toBe("starter");
  });

  it("an unrecognised base price still reports its amount but no plan", () => {
    const out = breakdownItems([item("pri_unknown", "99000")], cfg);
    expect(out).toEqual({ planTier: undefined, extraLocations: 0, amount: 99, currencyCode: "BHD" });
  });

  it("refuses to total mixed currencies", () => {
    const out = breakdownItems([item("pri_starter", "20000", 1, "BHD"), item("pri_starter_extra", "1000", 1, "USD")], cfg);
    expect(out.amount).toBeNull();
    expect(out.extraLocations).toBe(1);
  });

  it("refuses to total when an amount is not an integer string", () => {
    expect(breakdownItems([item("pri_starter", "20.00")], cfg).amount).toBeNull();
    expect(breakdownItems([{ quantity: 1, price: { id: "pri_starter", unit_price: { currency_code: "BHD" } } }], cfg).amount).toBeNull();
  });

  it("never grants paid locations from an unreadable quantity", () => {
    const out = breakdownItems([item("pri_starter", "20000", 1), item("pri_starter_extra", "10000", -4)], cfg);
    expect(out.extraLocations).toBe(0);
    expect(out.amount).toBe(20);
    const fractional = breakdownItems([item("pri_starter", "20000"), item("pri_starter_extra", "10000", 1.5)], cfg);
    expect(fractional.extraLocations).toBe(0);
  });

  it("the base plan counts once whatever quantity Paddle reports", () => {
    expect(breakdownItems([item("pri_starter", "20000", 3)], cfg).amount).toBe(20);
  });

  it("copes with empty, missing and malformed items", () => {
    expect(breakdownItems(undefined, cfg)).toEqual({ planTier: undefined, extraLocations: 0, amount: null, currencyCode: undefined });
    expect(breakdownItems([], cfg).amount).toBeNull();
    expect(breakdownItems([null, "x", 7], cfg).planTier).toBeUndefined();
  });
});
