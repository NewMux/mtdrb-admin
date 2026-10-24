import { describe, expect, it } from "vitest";
import { computePosTotals, moneyInputStep } from "./posMath";

// The GOLDEN cases below are repeated, with the same numbers, in
// supabase/tests/pos_currency_decimals.test.sql against complete_pos_sale().
// If you change one, change the other: they are what keeps the preview and the
// recorded sale identical.
const line = (price: number, quantity: number, vatRate: number) => ({ price, quantity, vatRate });

describe("computePosTotals - golden cases", () => {
  it("A: BHD keeps fils - VAT of 10% on 1.250 is 0.125, not 0.13", () => {
    const t = computePosTotals([line(1.25, 1, 10)], 0, "BHD");
    expect(t).toMatchObject({ subtotal: 1.25, discount: 0, vat: 0.125, total: 1.375 });
  });

  it("B: discount then VAT, rounded to fils", () => {
    const t = computePosTotals([line(0.999, 3, 10)], 0.5, "BHD");
    expect(t).toMatchObject({ subtotal: 2.997, discount: 0.5, vat: 0.25, total: 2.747 });
  });

  it("C: the discount shares add up to the discount exactly (last line takes the remainder)", () => {
    const t = computePosTotals([line(1, 1, 10), line(1, 1, 10), line(1, 1, 10)], 0.1, "BHD");
    expect(t.lines.map((l) => l.discount)).toEqual([0.033, 0.033, 0.034]);
    expect(t).toMatchObject({ subtotal: 3, discount: 0.1, vat: 0.291, total: 3.191 });
  });

  it("D: 2-decimal currencies still round half up (0.125 -> 0.13)", () => {
    expect(computePosTotals([line(1.25, 1, 10)], 0, "USD")).toMatchObject({ vat: 0.13, total: 1.38 });
    expect(computePosTotals([line(0.05, 1, 5)], 0, "USD")).toMatchObject({ vat: 0, total: 0.05 });
  });

  it("E: a sale under 1 currency unit shares the discount correctly (the old Math.max(subtotal, 1) did not)", () => {
    const t = computePosTotals([line(0.4, 1, 10)], 0.2, "BHD");
    expect(t).toMatchObject({ subtotal: 0.4, discount: 0.2, vat: 0.02, total: 0.22 });
  });

  it("F: a discount larger than the sale is capped at the subtotal", () => {
    expect(computePosTotals([line(1, 1, 10)], 5, "BHD")).toMatchObject({ discount: 1, vat: 0, total: 0 });
  });

  it("G: fractional quantities round at the line (2.500 x 0.333 = 0.8325 -> 0.833)", () => {
    expect(computePosTotals([line(2.5, 0.333, 0)], 0, "BHD")).toMatchObject({ subtotal: 0.833, total: 0.833 });
  });

  it("H: a free item never absorbs the rounding remainder", () => {
    const t = computePosTotals([line(1, 1, 0), line(1, 1, 0), line(0, 1, 0)], 0.101, "BHD");
    expect(t.lines.map((l) => l.discount)).toEqual([0.051, 0.05, 0]);
    expect(t.discount).toBe(0.101);
  });
});

describe("computePosTotals - properties", () => {
  it("header figures always equal the sum of the lines", () => {
    const cart = [line(3.333, 3, 10), line(0.125, 7, 5), line(19.999, 1, 0), line(0.001, 999, 10)];
    for (const discount of [0, 0.001, 0.5, 7.777, 1000]) {
      for (const currency of ["BHD", "USD", "JPY"]) {
        const t = computePosTotals(cart, discount, currency);
        const decimals = currency === "BHD" ? 3 : currency === "JPY" ? 0 : 2;
        const minor = (n: number) => Math.round(n * 10 ** decimals);
        expect(minor(t.discount)).toBe(t.lines.reduce((s, l) => s + minor(l.discount), 0));
        expect(minor(t.vat)).toBe(t.lines.reduce((s, l) => s + minor(l.vat), 0));
        expect(minor(t.total)).toBe(t.lines.reduce((s, l) => s + minor(l.total), 0));
        t.lines.forEach((l) => expect(minor(l.total)).toBe(minor(l.subtotal) - minor(l.discount) + minor(l.vat)));
      }
    }
  });

  it("never discounts more than the sale or goes negative", () => {
    const t = computePosTotals([line(2, 1, 10), line(3, 2, 10)], 999, "BHD");
    expect(t.discount).toBe(t.subtotal);
    expect(t.total).toBe(0);
    t.lines.forEach((l) => {
      expect(l.discount).toBeLessThanOrEqual(l.subtotal);
      expect(l.total).toBeGreaterThanOrEqual(0);
    });
  });

  it("an empty cart, junk inputs and negative numbers are all zero", () => {
    expect(computePosTotals([], 5, "BHD")).toMatchObject({ subtotal: 0, discount: 0, vat: 0, total: 0, lines: [] });
    const junk = computePosTotals([line(NaN, 2, 10), line(-5, 1, 10), line(2, -1, 10)], -3, "BHD");
    expect(junk).toMatchObject({ subtotal: 0, discount: 0, vat: 0, total: 0 });
  });

  it("is exact where floats are not (1.005 x 100 sits just under the tie)", () => {
    // 100 x 1.005 USD: the line is 100.50 exactly; with floats 1.005 * 100 = 100.49999999999999.
    expect(computePosTotals([line(1.005, 100, 0)], 0, "BHD").subtotal).toBe(100.5);
    expect(computePosTotals([line(1.005, 1, 0)], 0, "USD").subtotal).toBe(1.01);
  });
});

describe("moneyInputStep", () => {
  it("follows the currency's decimals", () => {
    expect(moneyInputStep("BHD")).toBe("0.001");
    expect(moneyInputStep("USD")).toBe("0.01");
    expect(moneyInputStep("AED")).toBe("0.01");
    expect(moneyInputStep("JPY")).toBe("1");
    expect(moneyInputStep(undefined)).toBe("0.01");
  });
});
