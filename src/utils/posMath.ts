// Point-of-sale totals for the cart and checkout preview. This mirrors
// public.complete_pos_sale() (20261022180000_pos_currency_decimals.sql) step for
// step, so the total shown to the cashier is the total the database records:
//
//   1. each line: subtotal = round(quantity x price)
//   2. the sale discount (capped at the sale subtotal) is shared across lines in
//      proportion to line subtotal, each share rounded; the last line WITH A
//      PRICE takes whatever is left, so the shares add up to the discount exactly
//   3. each line: vat = round((subtotal - discount) x vat_rate / 100)
//   4. total = sum of (subtotal - discount + vat) over the lines
//
// "round" is half away from zero at the currency's decimals (BHD has 3, not 2).
// Everything is done in integer minor units (fils / cents) with BigInt: a float
// multiplication such as 1.005 x 100 lands on 100.49999999999999 and would round
// the wrong way.
//
// Keep the golden cases in posMath.test.ts and supabase/tests/pos_currency_
// decimals.test.sql identical - they are what ties the two implementations together.

import { getCurrencyDecimals } from "./invoiceMath";

export interface PosCartLine {
  price: number;
  quantity: number;
  /** VAT rate in percent, e.g. 10 for 10%. */
  vatRate: number;
}

export interface PosLineTotals {
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
}

export interface PosTotals extends PosLineTotals {
  lines: PosLineTotals[];
}

/** Round-half-up of a non-negative rational num/den. */
const divRound = (num: bigint, den: bigint): bigint => (2n * num + den) / (2n * den);

/** Prices, quantities and typed discounts have at most 3 decimals (numeric(12,3)): read them as thousandths. */
const toMilli = (value: number): bigint => {
  if (!Number.isFinite(value) || value <= 0) return 0n;
  return BigInt(Math.round(value * 1000));
};

const fromMinor = (minor: bigint, decimals: number): number => Number(minor) / 10 ** decimals;

export function computePosTotals(
  cart: PosCartLine[],
  discount: number,
  currency: string | null | undefined,
): PosTotals {
  const decimals = getCurrencyDecimals(currency);

  const scale = BigInt(10 ** decimals);

  // line subtotal = round(quantity x price) in the currency's minor unit.
  const lineSubtotals = cart.map((line) =>
    divRound(toMilli(line.quantity) * toMilli(line.price) * scale, 1_000_000n),
  );
  const subtotal = lineSubtotals.reduce((sum, value) => sum + value, 0n);

  // The typed discount is rounded to the currency like the database does,
  // then capped at the sale subtotal.
  let discountMinor = divRound(toMilli(discount) * scale, 1000n);
  if (discountMinor > subtotal) discountMinor = subtotal;

  // A free item must not be the one that absorbs the rounding remainder.
  let lastPriced = -1;
  lineSubtotals.forEach((value, index) => {
    if (value > 0n) lastPriced = index;
  });

  let allocated = 0n;
  const lines: PosLineTotals[] = cart.map((line, index) => {
    const lineSubtotal = lineSubtotals[index];
    const isLast = index === lastPriced;

    let lineDiscount = 0n;
    if (subtotal > 0n) {
      lineDiscount = isLast ? discountMinor - allocated : divRound(discountMinor * lineSubtotal, subtotal);
    }
    if (lineDiscount > lineSubtotal) lineDiscount = lineSubtotal;
    if (lineDiscount < 0n) lineDiscount = 0n;
    allocated += lineDiscount;

    const rateHundredths = BigInt(Math.round(Math.max(0, line.vatRate || 0) * 100));
    const lineVat = divRound((lineSubtotal - lineDiscount) * rateHundredths, 10000n);

    return {
      subtotal: fromMinor(lineSubtotal, decimals),
      discount: fromMinor(lineDiscount, decimals),
      vat: fromMinor(lineVat, decimals),
      total: fromMinor(lineSubtotal - lineDiscount + lineVat, decimals),
    };
  });

  // Header figures are sums of the (already rounded) lines, so they can never
  // disagree with them. Summed in minor units to stay exact.
  const sum = (pick: (line: PosLineTotals) => number) =>
    fromMinor(
      lines.reduce((acc, line) => acc + BigInt(Math.round(pick(line) * 10 ** decimals)), 0n),
      decimals,
    );

  return {
    subtotal: fromMinor(subtotal, decimals),
    discount: sum((line) => line.discount),
    vat: sum((line) => line.vat),
    total: sum((line) => line.total),
    lines,
  };
}

/** The `step` for a money <input> in this currency: 0.001 for BHD, 0.01 for USD, 1 for JPY. */
export function moneyInputStep(currency: string | null | undefined): string {
  const decimals = getCurrencyDecimals(currency);
  return decimals === 0 ? "1" : `0.${"0".repeat(decimals - 1)}1`;
}
