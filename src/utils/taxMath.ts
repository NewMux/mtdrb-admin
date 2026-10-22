// A gym can charge more than one tax on a sale (for example a service charge
// and VAT, or GST plus a provincial tax). The rest of the app keeps working with
// ONE combined rate per line - that is what invoices, POS products and the
// database store and multiply by - and this module is the single place that
//   * works out the combined rate from the components, and
//   * splits a sale's tax amount back into one amount per tax for display and
//     for the tax report.
//
// Components apply in order. A component marked `compound` is charged on the
// net amount PLUS the tax of every component before it; otherwise on the net
// amount alone. So for net 1: tax_i = rate_i x (1 + sum of earlier taxes, if
// compound). The combined rate is the sum of all tax_i.
//
// The split is exact: the amounts always add up to the tax total, using the
// largest-remainder rule (ties go to the earlier component). Everything is
// integer arithmetic (BigInt), never floating point.
//
// public.allocate_tax_breakdown() (20261024120000_multiple_taxes.sql) does the
// same in SQL for POS sales. The golden cases in taxMath.test.ts and
// supabase/tests/multiple_taxes.test.sql are identical - they tie the two together.

import { getCurrencyDecimals } from "./invoiceMath";

export interface TaxComponent {
  name: string;
  /** Percent, at most two decimals (7.5, 10, 0.25) */
  rate: number;
  /** Charged on net + the tax of the components before it */
  compound: boolean;
}

export const MAX_TAX_COMPONENTS = 5;

export interface TaxBreakdownLine {
  name: string;
  rate: number;
  compound: boolean;
  /** In currency units, rounded to the currency's decimals */
  amount: number;
}

/** A rate in percent as an integer number of hundredths of a percent (7.5 -> 750). */
const rateHundredths = (rate: number): bigint => BigInt(Math.round((Number.isFinite(rate) ? Math.max(0, rate) : 0) * 100));

/**
 * Each component's tax on a net of 1, as integers over a common denominator.
 * Returns the numerators and the denominator (10000^n).
 */
function weights(components: readonly TaxComponent[]): { tax: bigint[]; scale: bigint } {
  const n = components.length;
  const scale = 10_000n ** BigInt(n);
  const tax: bigint[] = [];
  let earlier = 0n;
  for (let i = 0; i < n; i += 1) {
    const base = scale + (i > 0 && components[i].compound ? earlier : 0n);
    // Exact: scale carries 10000^(n-i), and each step divides by 10000 once.
    const t = (rateHundredths(components[i].rate) * base) / 10_000n;
    tax.push(t);
    earlier += t;
  }
  return { tax, scale };
}

/**
 * The single rate (percent) equivalent to charging every component, or null if
 * it cannot be written with two decimals (gym_settings.vat_rate and every rate
 * column in the database are numeric(5,2)).
 */
export function combinedRate(components: readonly TaxComponent[]): number | null {
  if (components.length === 0) return 0;
  const { tax, scale } = weights(components);
  const sum = tax.reduce((a, b) => a + b, 0n);
  // percent x 100 = 10000 x sum / scale
  const numerator = sum * 10_000n;
  if (numerator % scale !== 0n) return null;
  return Number(numerator / scale) / 100;
}

/**
 * Splits `taxAmount` between the components. `decimals` is the currency's
 * minor-unit digits (BHD 3, USD 2, JPY 0). The amounts sum to taxAmount exactly.
 */
export function allocateTax(
  taxAmount: number,
  components: readonly TaxComponent[],
  currency: string | null | undefined,
): TaxBreakdownLine[] {
  if (components.length === 0) return [];
  const decimals = getCurrencyDecimals(currency);
  const factor = 10 ** decimals;
  const total = BigInt(Math.round((Number.isFinite(taxAmount) ? Math.max(0, taxAmount) : 0) * factor));

  const { tax } = weights(components);
  const weightSum = tax.reduce((a, b) => a + b, 0n);

  let shares: bigint[];
  if (weightSum === 0n) {
    // Every rate is zero: there is no tax to split.
    shares = components.map(() => 0n);
  } else {
    shares = tax.map((w) => (total * w) / weightSum);
    let leftover = total - shares.reduce((a, b) => a + b, 0n);
    const order = tax
      .map((w, index) => ({ index, remainder: (total * w) % weightSum }))
      .sort((a, b) => (a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1));
    for (const { index } of order) {
      if (leftover === 0n) break;
      shares[index] += 1n;
      leftover -= 1n;
    }
  }

  return components.map((c, i) => ({
    name: c.name,
    rate: c.rate,
    compound: c.compound,
    amount: Number(shares[i]) / factor,
  }));
}

/** The names of the taxes joined for a heading: "VAT", "Service charge + VAT". */
export function taxLabel(components: readonly Pick<TaxComponent, "name">[]): string {
  const names = components.map((c) => c.name.trim()).filter(Boolean);
  return names.length > 0 ? names.join(" + ") : "VAT";
}

/** Reads a stored tax_breakdown column; anything malformed (or empty) is null. */
export function parseTaxBreakdown(value: unknown): TaxBreakdownLine[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const lines: TaxBreakdownLine[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const { name, rate, compound, amount } = item as Record<string, unknown>;
    const parsedRate = Number(rate);
    const parsedAmount = Number(amount);
    if (typeof name !== "string" || !name || !Number.isFinite(parsedRate) || !Number.isFinite(parsedAmount)) return null;
    lines.push({ name, rate: parsedRate, compound: compound === true, amount: parsedAmount });
  }
  return lines;
}

export interface TaxTotalLine {
  name: string;
  amount: number;
}

/**
 * Adds up what was collected per tax across many documents. A document without
 * a stored breakdown (older ones, or one made before the gym had several taxes)
 * counts its whole tax under `fallbackName`, so the total is always complete.
 */
export function aggregateTaxBreakdowns(
  documents: ReadonlyArray<{ breakdown: TaxBreakdownLine[] | null; taxTotal: number }>,
  fallbackName: string,
  currency: string | null | undefined,
): TaxTotalLine[] {
  const decimals = getCurrencyDecimals(currency);
  const factor = 10 ** decimals;
  const totals = new Map<string, bigint>();
  const toMinor = (value: number) => BigInt(Math.round((Number.isFinite(value) ? value : 0) * factor));

  for (const doc of documents) {
    if (doc.breakdown && doc.breakdown.length > 0) {
      for (const line of doc.breakdown) totals.set(line.name, (totals.get(line.name) ?? 0n) + toMinor(line.amount));
    } else if (doc.taxTotal) {
      totals.set(fallbackName, (totals.get(fallbackName) ?? 0n) + toMinor(doc.taxTotal));
    }
  }
  return [...totals.entries()]
    .map(([name, minor]) => ({ name, amount: Number(minor) / factor }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}
