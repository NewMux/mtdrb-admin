/** "$21.50" in the reader's language; "USD 21.5" if the browser does not know the currency code. */
export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
