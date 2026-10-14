import { describe, it, expect } from "vitest";
import {
  splitVat,
  computeLineTotals,
  computeInvoiceTotals,
  getCurrencyDecimals,
  roundMoney,
  resolveInvoiceGrossAmount,
  computeExpenseAmounts,
  inferVatRatePercent,
} from "./invoiceMath";

describe("getCurrencyDecimals", () => {
  it("returns 3 for three-decimal currencies", () => {
    expect(getCurrencyDecimals("BHD")).toBe(3);
    expect(getCurrencyDecimals("KWD")).toBe(3);
    expect(getCurrencyDecimals("bhd")).toBe(3);
  });

  it("returns 0 for zero-decimal currencies", () => {
    expect(getCurrencyDecimals("JPY")).toBe(0);
  });

  it("defaults to 2 for everything else", () => {
    expect(getCurrencyDecimals("AED")).toBe(2);
    expect(getCurrencyDecimals("USD")).toBe(2);
    expect(getCurrencyDecimals(undefined)).toBe(2);
    expect(getCurrencyDecimals(null)).toBe(2);
  });
});

describe("splitVat", () => {
  it("extracts VAT correctly when the amount is inclusive", () => {
    // 100 AED at 10% inclusive: net = 100/1.1 = 90.909..., vat = 9.09...
    const { net, vat, gross } = splitVat(100, 10, true, "AED");
    expect(net).toBeCloseTo(90.91, 2);
    expect(vat).toBeCloseTo(9.09, 2);
    expect(gross).toBe(100);
    // net + vat must reconstruct the original gross amount.
    expect(roundMoney(net + vat, 2)).toBe(100);
  });

  it("does NOT simply apply amount * rate/100 for an inclusive amount (the historical bug)", () => {
    const { vat } = splitVat(100, 10, true, "AED");
    // The buggy implementation computed 100 * 10/100 = 10; the correct
    // extracted VAT is 9.09, materially less.
    expect(vat).not.toBeCloseTo(10, 2);
  });

  it("adds VAT on top when the amount is exclusive", () => {
    const { net, vat, gross } = splitVat(100, 10, false, "AED");
    expect(net).toBe(100);
    expect(vat).toBe(10);
    expect(gross).toBe(110);
  });

  it("charges zero VAT at a 0% rate either way", () => {
    expect(splitVat(100, 0, true, "AED")).toEqual({ net: 100, vat: 0, gross: 100 });
    expect(splitVat(100, 0, false, "AED")).toEqual({ net: 100, vat: 0, gross: 100 });
  });

  it("rounds to the currency's minor unit (3 decimals for BHD)", () => {
    const { net, vat } = splitVat(100, 10, true, "BHD");
    expect(net).toBe(90.909);
    expect(vat).toBe(9.091);
  });

  it("treats a non-finite amount as zero rather than propagating NaN", () => {
    expect(splitVat(NaN, 10, false, "AED")).toEqual({ net: 0, vat: 0, gross: 0 });
  });
});

describe("computeLineTotals", () => {
  it("applies the discount to the net before computing VAT (matches the header total)", () => {
    // 1 x 100 AED, 5% VAT, 10% discount:
    // discounted net = 90, vat = 90 * 0.05 = 4.5, gross = 94.5
    const totals = computeLineTotals(
      { quantity: 1, unitPrice: 100, discountPercent: 10, vatRatePercent: 5 },
      "AED",
    );
    expect(totals.discountedNet).toBe(90);
    expect(totals.vat).toBe(4.5);
    expect(totals.gross).toBe(94.5);
  });

  it("does not charge VAT on the pre-discount base (the historical bug)", () => {
    const totals = computeLineTotals(
      { quantity: 1, unitPrice: 100, discountPercent: 10, vatRatePercent: 5 },
      "AED",
    );
    // The buggy implementation computed vat = 100 * 0.05 = 5 (ignoring the
    // discount); the correct VAT on the discounted 90 base is 4.5.
    expect(totals.vat).not.toBe(5);
  });

  it("multiplies quantity through correctly", () => {
    const totals = computeLineTotals(
      { quantity: 3, unitPrice: 50, discountPercent: 0, vatRatePercent: 5 },
      "AED",
    );
    expect(totals.net).toBe(150);
    expect(totals.vat).toBe(7.5);
    expect(totals.gross).toBe(157.5);
  });
});

describe("computeInvoiceTotals", () => {
  it("sums line items so the header total always equals the sum of line grosses", () => {
    const lines = [
      { quantity: 1, unitPrice: 100, discountPercent: 10, vatRatePercent: 5 },
      { quantity: 2, unitPrice: 25, discountPercent: 0, vatRatePercent: 10 },
    ];
    const header = computeInvoiceTotals(lines, "AED");
    const lineGrossSum = lines.reduce(
      (sum, line) => sum + computeLineTotals(line, "AED").gross,
      0,
    );
    expect(header.gross).toBeCloseTo(lineGrossSum, 2);
  });

  it("returns zeroed totals for an empty invoice", () => {
    expect(computeInvoiceTotals([], "AED")).toEqual({ net: 0, vat: 0, gross: 0 });
  });

  it("handles a multi-line, mixed VAT-rate, mixed-discount invoice correctly", () => {
    const lines = [
      { quantity: 2, unitPrice: 50, discountPercent: 0, vatRatePercent: 5 }, // net 100, vat 5, gross 105
      { quantity: 1, unitPrice: 200, discountPercent: 25, vatRatePercent: 15 }, // net 150, vat 22.5, gross 172.5
      { quantity: 4, unitPrice: 10, discountPercent: 50, vatRatePercent: 0 }, // net 20, vat 0, gross 20
    ];
    const header = computeInvoiceTotals(lines, "AED");
    expect(header.net).toBeCloseTo(270, 2);
    expect(header.vat).toBeCloseTo(27.5, 2);
    expect(header.gross).toBeCloseTo(297.5, 2);
  });
});

describe("resolveInvoiceGrossAmount", () => {
  it("prefers total over amount", () => {
    expect(resolveInvoiceGrossAmount({ total: 100, amount: 50 })).toBe(100);
  });

  it("does not fall through when total is legitimately zero", () => {
    expect(resolveInvoiceGrossAmount({ total: 0, amount: 50 })).toBe(0);
  });

  it("falls back to amount when total is null/undefined", () => {
    expect(resolveInvoiceGrossAmount({ total: null, amount: 50 })).toBe(50);
    expect(resolveInvoiceGrossAmount({ amount: 50 })).toBe(50);
  });

  it("returns 0 when neither field is present", () => {
    expect(resolveInvoiceGrossAmount({})).toBe(0);
  });

  it("parses string amounts", () => {
    expect(resolveInvoiceGrossAmount({ total: "42.5" })).toBe(42.5);
  });
});

describe("roundMoney", () => {
  it("rounds to the given number of decimals", () => {
    expect(roundMoney(1.005, 2)).toBe(1.01);
    expect(roundMoney(9.0909090909, 2)).toBe(9.09);
  });

  it("returns 0 for non-finite input", () => {
    expect(roundMoney(NaN, 2)).toBe(0);
    expect(roundMoney(Infinity, 2)).toBe(0);
  });
});

describe("computeExpenseAmounts", () => {
  it("extracts VAT from a VAT-inclusive amount and stores the gross", () => {
    // 11.000 BHD receipt at 10% inclusive: net 10.000, VAT 1.000
    expect(computeExpenseAmounts(11, 10, true, "BHD")).toEqual({ amount: 11, net: 10, vat: 1 });
  });

  it("adds VAT on top of a VAT-exclusive amount and stores the gross", () => {
    expect(computeExpenseAmounts(10, 10, false, "BHD")).toEqual({ amount: 11, net: 10, vat: 1 });
  });

  it("keeps an explicit 0% rate at 0 (no 15% fallback)", () => {
    expect(computeExpenseAmounts(10, 0, true, "BHD")).toEqual({ amount: 10, net: 10, vat: 0 });
    expect(computeExpenseAmounts(10, 0, false, "BHD")).toEqual({ amount: 10, net: 10, vat: 0 });
  });

  it("rounds to 3 decimals for BHD and keeps amount = net + vat", () => {
    const { amount, net, vat } = computeExpenseAmounts(1.234, 5, true, "BHD");
    expect(vat).toBe(0.059);
    expect(net).toBe(1.175);
    expect(amount).toBe(1.234);
    expect(roundMoney(net + vat, 3)).toBe(amount);
  });
});

describe("inferVatRatePercent", () => {
  const rates = [0, 5, 10, 15];

  it("recovers the rate from a stored gross amount and VAT", () => {
    expect(inferVatRatePercent(11, 1, rates)).toBe(10);
    expect(inferVatRatePercent(10.5, 0.5, rates)).toBe(5);
  });

  it("snaps rows saved by the old modal (net stored, VAT on top) to the picked rate", () => {
    // Old modal: amount 100 stored as-is, VAT 15 added on top -> 15/85 = 17.6%
    expect(inferVatRatePercent(100, 15, rates)).toBe(15);
    expect(inferVatRatePercent(100, 10, rates)).toBe(10);
  });

  it("returns 0 when there is no VAT", () => {
    expect(inferVatRatePercent(100, 0, rates)).toBe(0);
    expect(inferVatRatePercent(0, 0, rates)).toBe(0);
  });
});
