// Paddle returns monetary amounts as strings in the currency's smallest
// unit (e.g. "2000" = 20.00 USD). How many decimal places that is depends
// on the currency: 2 for USD, 3 for BHD/KWD/OMR (1 BHD = 1000 fils), 0 for
// JPY/KRW. Dividing everything by 100 stores a BHD price 10x too high.
//
// The exponent comes from ISO 4217 via Intl, which assumes Paddle follows
// the same convention for its "lowest denomination" -- confirm against a
// real BHD price in Paddle's sandbox before relying on it.

export function minorUnitDigits(currencyCode: string): number {
  try {
    return (
      new Intl.NumberFormat("en", { style: "currency", currency: currencyCode }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

// Returns null rather than guessing when the amount can't be interpreted
// (non-integer string, or no currency to derive the exponent from).
export function paddleAmountToMajor(
  amount: unknown,
  currencyCode: string | undefined,
): number | null {
  if (typeof amount !== "string" || !/^\d+$/.test(amount) || !currencyCode) return null;
  const digits = minorUnitDigits(currencyCode);
  return Number((Number(amount) / 10 ** digits).toFixed(digits));
}
