import { getCurrencyDecimals, roundMoney } from "./invoiceMath";
import { parseTaxBreakdown, type TaxBreakdownLine } from "./taxMath";

/**
 * Tax on shop (POS) sales and refunds, in the same shape the VAT dashboard
 * already uses for invoices: one signed entry per sale or return, so a return
 * simply reduces the figures in the period it was made.
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
  /** The sale the goods came from. */
  pos_sales?: { vat_total?: number | string | null; tax_breakdown?: unknown } | null;
  pos_return_items?: ReadonlyArray<{
    quantity?: number | string | null;
    pos_sale_items?: { line_vat?: number | string | null; quantity?: number | string | null } | null;
  }> | null;
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

    // The tax in the goods handed back: each line's tax pro rata to the quantity returned.
    let returned = 0;
    for (const item of ret.pos_return_items ?? []) {
      const original = item.pos_sale_items;
      const soldQty = num(original?.quantity);
      if (!original || soldQty <= 0) continue;
      returned += (num(original.line_vat) * Math.min(num(item.quantity), soldQty)) / soldQty;
    }
    returned = roundMoney(returned, decimals);

    const saleVat = num(ret.pos_sales?.vat_total);
    if (returned <= 0 || saleVat <= 0) continue;
    returned = Math.min(returned, saleVat);

    // Split that refund between the taxes in the same proportions as the sale.
    const saleBreakdown = parseTaxBreakdown(ret.pos_sales?.tax_breakdown);
    const scaled = saleBreakdown?.map((line) => ({
      ...line,
      amount: -roundMoney((line.amount * returned) / saleVat, decimals),
    }));
    docs.push({ date: ret.created_at, breakdown: scaled && scaled.length > 0 ? scaled : null, taxTotal: -returned });
  }

  return docs;
}
