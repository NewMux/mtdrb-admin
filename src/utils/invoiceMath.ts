// Shared money/VAT contract for invoices, used by every writer and reader
// so a "total" and a "vat_total" always mean the same thing everywhere:
//
//   net   (a.k.a. `amount` in the invoices table) - the pre-VAT base amount
//   vat   (`vat_total`)                            - the VAT/tax component
//   gross (`total`)                                - net + vat, what the
//                                                     customer actually pays
//
// Discount, where one applies, is taken off the net amount BEFORE VAT is
// computed on it - VAT is never charged on a discount that isn't being
// paid for.

// ISO 4217 currencies whose minor unit has 3 decimal digits instead of the
// usual 2 (Bahraini dinar, Kuwaiti dinar, Omani rial, Jordanian dinar,
// Tunisian dinar). Anything not listed here defaults to 2.
const THREE_DECIMAL_CURRENCIES = new Set(["BHD", "KWD", "OMR", "JOD", "TND"]);
const ZERO_DECIMAL_CURRENCIES = new Set([
  "JPY",
  "KRW",
  "VND",
  "CLP",
  "ISK",
  "HUF",
]);

export function getCurrencyDecimals(currencyCode: string | null | undefined): number {
  const code = (currencyCode || "").toUpperCase();
  if (THREE_DECIMAL_CURRENCIES.has(code)) return 3;
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return 0;
  return 2;
}

export function roundMoney(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export interface VatSplit {
  net: number;
  vat: number;
  gross: number;
}

/**
 * Split an amount into net/vat/gross, given a VAT rate in percent (e.g. 5
 * for 5%) and whether the amount as entered already includes VAT.
 *
 * - Inclusive (amount is what the customer pays, VAT already in it):
 *   net = amount / (1 + rate/100), vat = amount - net.
 * - Exclusive (amount is the pre-VAT base, VAT is added on top):
 *   vat = amount * rate/100, gross = amount + vat.
 */
export function splitVat(
  amount: number,
  vatRatePercent: number,
  isInclusive: boolean,
  currencyCode?: string | null,
): VatSplit {
  const decimals = getCurrencyDecimals(currencyCode);
  const rate = (vatRatePercent || 0) / 100;
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  if (isInclusive) {
    const net = rate === 0 ? safeAmount : safeAmount / (1 + rate);
    const vat = safeAmount - net;
    return {
      net: roundMoney(net, decimals),
      vat: roundMoney(vat, decimals),
      gross: roundMoney(safeAmount, decimals),
    };
  }

  const vat = safeAmount * rate;
  return {
    net: roundMoney(safeAmount, decimals),
    vat: roundMoney(vat, decimals),
    gross: roundMoney(safeAmount + vat, decimals),
  };
}

export interface InvoiceLineInput {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  vatRatePercent: number;
}

export interface InvoiceLineTotals extends VatSplit {
  // The discounted net before VAT - exposed for line-item display.
  discountedNet: number;
}

/**
 * Compute one line item's totals: discount is applied to the line's net
 * (quantity x unit price) first, then VAT is computed on the discounted
 * net. This keeps a line's own net+vat=gross identity intact, and keeps
 * Sigma(line totals) equal to the invoice header total when the header is
 * computed the same way (see computeInvoiceTotals below).
 */
export function computeLineTotals(
  line: InvoiceLineInput,
  currencyCode?: string | null,
): InvoiceLineTotals {
  const decimals = getCurrencyDecimals(currencyCode);
  const rawNet = (line.quantity || 0) * (line.unitPrice || 0);
  const discountFraction = (line.discountPercent || 0) / 100;
  const discountedNet = rawNet * (1 - discountFraction);
  const split = splitVat(discountedNet, line.vatRatePercent, false, currencyCode);
  return {
    ...split,
    discountedNet: roundMoney(discountedNet, decimals),
  };
}

/**
 * Sum an invoice's line items into header totals. Header total is always
 * the sum of each line's gross, so it never disagrees with the line items
 * it's built from.
 */
export function computeInvoiceTotals(
  lines: InvoiceLineInput[],
  currencyCode?: string | null,
): VatSplit {
  const decimals = getCurrencyDecimals(currencyCode);
  const totals = lines.reduce(
    (acc, line) => {
      const lineTotals = computeLineTotals(line, currencyCode);
      return {
        net: acc.net + lineTotals.net,
        vat: acc.vat + lineTotals.vat,
        gross: acc.gross + lineTotals.gross,
      };
    },
    { net: 0, vat: 0, gross: 0 },
  );
  return {
    net: roundMoney(totals.net, decimals),
    vat: roundMoney(totals.vat, decimals),
    gross: roundMoney(totals.gross, decimals),
  };
}

/**
 * Resolve an invoice's displayable/revenue amount from a row that may
 * have been written by either invoice modal - never falsy-chain these
 * (a legitimately-zero `total` must not fall through to `paid_amount`).
 */
export function resolveInvoiceGrossAmount(invoice: {
  total?: number | string | null;
  amount?: number | string | null;
}): number {
  const total = invoice.total;
  if (total !== null && total !== undefined && total !== "") {
    const parsed = typeof total === "string" ? parseFloat(total) : total;
    if (Number.isFinite(parsed)) return parsed;
  }
  const amount = invoice.amount;
  if (amount !== null && amount !== undefined && amount !== "") {
    const parsed = typeof amount === "string" ? parseFloat(amount) : amount;
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}
