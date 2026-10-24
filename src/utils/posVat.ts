import { getCurrencyDecimals, roundMoney } from "./invoiceMath";
import { parseTaxBreakdown, type TaxBreakdownLine } from "./taxMath";

/**
 * Tax on shop (POS) sales and refunds, in the same shape the VAT dashboard
 * already uses for invoices: one signed entry per sale or return, so a return
 * simply reduces the figures in the period it was made. Returns carry the tax
 * they gave back (pos_returns.vat_total / tax_breakdown).
 */
export interface PosSaleTaxRow {
  status?: string | null;
  created_at: string;
  vat_total?: number | string | null;
  tax_breakdown?: unknown;
}

export interface PosReturnTaxRow {
  status?: string | null;
  created_at: string;
  /** The tax this return gave back, and how it splits between the sale's taxes. */
  vat_total?: number | string | null;
  tax_breakdown?: unknown;
}

export interface PosVatDocument {
  date: string;
  breakdown: TaxBreakdownLine[] | null;
  /** Positive for a sale, negative for a return. */
  taxTotal: number;
}

const num = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** A voided sale never happened; a fully returned one stays in and is offset by its return. */
const COUNTED_SALE_STATUSES = new Set(["completed", "partially_returned", "returned"]);

export function posVatDocuments(
  sales: readonly PosSaleTaxRow[],
  returns: readonly PosReturnTaxRow[],
  currency: string | null | undefined,
): PosVatDocument[] {
  const decimals = getCurrencyDecimals(currency);
  const docs: PosVatDocument[] = [];

  for (const sale of sales) {
    if (!COUNTED_SALE_STATUSES.has(sale.status ?? "completed")) continue;
    const vat = num(sale.vat_total);
    if (vat <= 0) continue;
    docs.push({ date: sale.created_at, breakdown: parseTaxBreakdown(sale.tax_breakdown), taxTotal: vat });
  }

  for (const ret of returns) {
    if (ret.status === "cancelled") continue;
    const refunded = roundMoney(num(ret.vat_total), decimals);
    if (refunded <= 0) continue;
    const lines = parseTaxBreakdown(ret.tax_breakdown)?.map((line) => ({ ...line, amount: -line.amount }));
    docs.push({ date: ret.created_at, breakdown: lines && lines.length > 0 ? lines : null, taxTotal: -refunded });
  }

  return docs;
}
