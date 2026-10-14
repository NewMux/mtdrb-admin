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

/**
 * Round a computed money value to the currency's minor unit right before
 * it's written to a NUMERIC column, so a float artifact like
 * 10.450000000000001 (or an unrounded 1.2345 BHD VAT) never reaches the
 * database. Use this at every persistence site that writes computed money.
 */
export function toPersistedMoney(
  value: number | string | null | undefined,
  currencyCode: string | null | undefined,
): number {
  const parsed = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return roundMoney(parsed, getCurrencyDecimals(currencyCode));
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

export interface PosCartLineInput {
  quantity: number;
  unitPrice: number;
  vatRatePercent: number;
}

export interface PosCartLineTotals {
  // quantity x unit price, before the cart discount.
  lineNet: number;
  // This line's share of the cart-level discount.
  discount: number;
  // lineNet - discount: the base VAT is computed on.
  discountedNet: number;
  vat: number;
  gross: number;
}

export interface PosCartTotals {
  subtotal: number;
  discount: number;
  // subtotal - discount
  net: number;
  vat: number;
  // net + vat, what the customer pays
  gross: number;
  lines: PosCartLineTotals[];
}

/**
 * POS cart totals under the same money contract as invoices: the cart-level
 * (absolute) discount is prorated across lines by each line's share of the
 * subtotal, VAT is computed per line on its discounted net, and
 * total = net + VAT.
 *
 * Proration is done in integer minor units with the largest-remainder
 * method, so the line discounts always sum exactly to the cart discount and
 * no line is ever discounted below zero - including when the subtotal is
 * below 1.000 currency unit (the old `Math.max(subtotal, 1)` divisor
 * under-allocated the discount there and overcharged VAT). The
 * server-side complete_pos_sale (migration 20261014110000) applies the same
 * rule, so the preview matches the stored sale.
 */
export function computePosCartTotals(
  lines: PosCartLineInput[],
  discount: number,
  currencyCode?: string | null,
): PosCartTotals {
  const decimals = getCurrencyDecimals(currencyCode);
  const factor = 10 ** decimals;
  const toMinor = (value: number) => Math.round(roundMoney(value, decimals) * factor);
  const fromMinor = (minor: number) => roundMoney(minor / factor, decimals);

  const lineNetMinor = lines.map((line) =>
    Math.max(0, toMinor((line.quantity || 0) * (line.unitPrice || 0))),
  );
  const subtotalMinor = lineNetMinor.reduce((sum, value) => sum + value, 0);
  const safeDiscount = Number.isFinite(discount) ? discount : 0;
  const discountMinor = Math.min(Math.max(toMinor(safeDiscount), 0), subtotalMinor);

  // Largest-remainder allocation of discountMinor across lines.
  const allocations = lineNetMinor.map((netMinor, index) => {
    // Integer floor and remainder (not a float fraction), so ties break
    // exactly like the server-side complete_pos_sale (div/mod on numeric).
    if (subtotalMinor === 0) return { index, floor: 0, remainder: 0 };
    const product = discountMinor * netMinor;
    const remainder = product % subtotalMinor;
    return { index, floor: (product - remainder) / subtotalMinor, remainder };
  });
  let leftover = discountMinor - allocations.reduce((sum, a) => sum + a.floor, 0);
  const lineDiscountMinor = allocations.map((a) => a.floor);
  [...allocations]
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .forEach((a) => {
      if (leftover > 0 && lineDiscountMinor[a.index] < lineNetMinor[a.index]) {
        lineDiscountMinor[a.index] += 1;
        leftover -= 1;
      }
    });

  const lineTotals = lines.map((line, index) => {
    const discountedNet = fromMinor(lineNetMinor[index] - lineDiscountMinor[index]);
    const split = splitVat(discountedNet, line.vatRatePercent, false, currencyCode);
    return {
      lineNet: fromMinor(lineNetMinor[index]),
      discount: fromMinor(lineDiscountMinor[index]),
      discountedNet,
      vat: split.vat,
      gross: split.gross,
    };
  });

  const vatMinor = lineTotals.reduce((sum, line) => sum + toMinor(line.vat), 0);
  const netMinor = subtotalMinor - discountMinor;
  return {
    subtotal: fromMinor(subtotalMinor),
    discount: fromMinor(discountMinor),
    net: fromMinor(netMinor),
    vat: fromMinor(vatMinor),
    gross: fromMinor(netMinor + vatMinor),
    lines: lineTotals,
  };
}
