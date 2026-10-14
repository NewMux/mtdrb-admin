import { describe, it, expect } from "vitest";
import { computePosCartTotals, toPersistedMoney } from "./invoiceMath";

describe("computePosCartTotals", () => {
  it("applies discount to net, VAT on the discounted net, total = net + VAT", () => {
    const totals = computePosCartTotals(
      [
        { quantity: 2, unitPrice: 5, vatRatePercent: 10 },
        { quantity: 1, unitPrice: 10, vatRatePercent: 10 },
      ],
      4,
      "BHD",
    );
    expect(totals.subtotal).toBe(20);
    expect(totals.discount).toBe(4);
    expect(totals.net).toBe(16);
    expect(totals.vat).toBe(1.6);
    expect(totals.gross).toBe(17.6);
    expect(totals.lines.map((l) => l.discount)).toEqual([2, 2]);
  });

  it("prorates the full discount when the subtotal is below 1.000", () => {
    // Old code divided by Math.max(subtotal, 1) = 1, so each line's share
    // was discount * lineNet (0.250 * 0.400 = 0.100 instead of 0.200), and
    // VAT was charged on discount that was never paid.
    const totals = computePosCartTotals(
      [
        { quantity: 1, unitPrice: 0.4, vatRatePercent: 10 },
        { quantity: 1, unitPrice: 0.1, vatRatePercent: 10 },
      ],
      0.25,
      "BHD",
    );
    expect(totals.subtotal).toBe(0.5);
    expect(totals.discount).toBe(0.25);
    expect(totals.lines.map((l) => l.discount)).toEqual([0.2, 0.05]);
    expect(totals.net).toBe(0.25);
    expect(totals.vat).toBe(0.025);
    expect(totals.gross).toBe(0.275);
  });

  it("zeroes VAT when a sub-1.000 cart is fully discounted", () => {
    const totals = computePosCartTotals(
      [{ quantity: 1, unitPrice: 0.5, vatRatePercent: 10 }],
      0.5,
      "BHD",
    );
    expect(totals.net).toBe(0);
    expect(totals.vat).toBe(0);
    expect(totals.gross).toBe(0);
  });

  it("rounds BHD to 3 decimals, not 2", () => {
    const totals = computePosCartTotals(
      [{ quantity: 3, unitPrice: 1.235, vatRatePercent: 5 }],
      0,
      "BHD",
    );
    expect(totals.subtotal).toBe(3.705);
    // 3.705 * 5% = 0.18525 -> 0.185 (would be 0.19 at 2 decimals)
    expect(totals.vat).toBe(0.185);
    expect(totals.gross).toBe(3.89);
  });

  it("rounds 2-decimal currencies to 2 decimals", () => {
    const totals = computePosCartTotals(
      [{ quantity: 3, unitPrice: 1.235, vatRatePercent: 5 }],
      0,
      "AED",
    );
    expect(totals.subtotal).toBe(3.71);
    expect(totals.vat).toBe(0.19);
    expect(totals.gross).toBe(3.9);
  });

  it("line discounts always sum exactly to the cart discount", () => {
    const totals = computePosCartTotals(
      [
        { quantity: 1, unitPrice: 1, vatRatePercent: 10 },
        { quantity: 1, unitPrice: 1, vatRatePercent: 10 },
        { quantity: 1, unitPrice: 1, vatRatePercent: 10 },
      ],
      0.001,
      "BHD",
    );
    const sum = totals.lines.reduce((s, l) => s + l.discount, 0);
    expect(toPersistedMoney(sum, "BHD")).toBe(0.001);
    expect(totals.lines.every((l) => l.discountedNet >= 0)).toBe(true);
    // Header VAT equals the sum of line VATs.
    const lineVat = totals.lines.reduce((s, l) => s + l.vat, 0);
    expect(toPersistedMoney(lineVat, "BHD")).toBe(totals.vat);
  });

  it("clamps the discount to [0, subtotal]", () => {
    const lines = [{ quantity: 1, unitPrice: 2, vatRatePercent: 10 }];
    expect(computePosCartTotals(lines, 5, "BHD").discount).toBe(2);
    expect(computePosCartTotals(lines, -1, "BHD").discount).toBe(0);
    expect(computePosCartTotals(lines, Number.NaN, "BHD").discount).toBe(0);
  });

  it("handles an empty cart", () => {
    const totals = computePosCartTotals([], 1, "BHD");
    expect(totals).toEqual({ subtotal: 0, discount: 0, net: 0, vat: 0, gross: 0, lines: [] });
  });
});

describe("toPersistedMoney", () => {
  it("rounds to the currency's minor unit", () => {
    expect(toPersistedMoney(1.23456, "BHD")).toBe(1.235);
    expect(toPersistedMoney(1.23456, "AED")).toBe(1.23);
    expect(toPersistedMoney(0.1 + 0.2, "BHD")).toBe(0.3);
    expect(toPersistedMoney(1234.5, "JPY")).toBe(1235);
  });

  it("accepts strings and nullish values", () => {
    expect(toPersistedMoney("2.0005", "BHD")).toBe(2.001);
    expect(toPersistedMoney(null, "BHD")).toBe(0);
    expect(toPersistedMoney(undefined, "BHD")).toBe(0);
    expect(toPersistedMoney("abc", "BHD")).toBe(0);
  });
});
