// Canonical invoice status values, matching the live database's hard CHECK
// constraint exactly (`invoices_status_check`): status must be one of these
// five lowercase strings, or Postgres rejects the write outright. There is
// no "unpaid" value in the database - an invoice that hasn't been paid is
// "pending".
export const INVOICE_STATUSES = [
  "draft",
  "pending",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type CanonicalInvoiceStatus = (typeof INVOICE_STATUSES)[number];

const STATUS_SET: ReadonlySet<string> = new Set(INVOICE_STATUSES);

// Aliases seen in older code/data that never matched the DB constraint.
// "Unpaid"/"Paid"/... (Title Case) fail the CHECK constraint on write, so
// they can only appear here as legacy in-memory values, not DB rows -
// mapping them defensively costs nothing and avoids a class of bugs if
// that data model assumption ever turns out to be wrong.
const ALIASES: Record<string, CanonicalInvoiceStatus> = {
  unpaid: "pending",
  completed: "paid",
  complete: "paid",
};

/**
 * Normalize an invoice status value for comparisons and for writing back
 * to the database. Trims, lowercases, and maps known aliases. Falls back
 * to "pending" for anything unrecognized rather than throwing, since this
 * is used in read paths (dashboards, filters) that must not crash on
 * unexpected data.
 */
export function normalizeInvoiceStatus(
  status: string | null | undefined,
): CanonicalInvoiceStatus {
  const key = (status || "").trim().toLowerCase();
  if (STATUS_SET.has(key)) {
    return key as CanonicalInvoiceStatus;
  }
  return ALIASES[key] ?? "pending";
}

export function isPaidStatus(status: string | null | undefined): boolean {
  return normalizeInvoiceStatus(status) === "paid";
}

// For Supabase .in("status", PAID_STATUSES) filters - kept as an array
// (rather than just comparing the normalized value) so a query can match
// paid invoices server-side without fetching every row first.
export const PAID_STATUSES: CanonicalInvoiceStatus[] = ["paid"];
