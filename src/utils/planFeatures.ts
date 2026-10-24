/**
 * What each platform plan includes beyond the basics. Kept in one place so the
 * sidebar, the route guard, the in-page tabs and the tests agree.
 *
 * Starter does not include Analytics. Every other plan does: Pro, Enterprise,
 * demo gyms, and gyms the platform owner granted access to by hand (manual
 * grants carry whichever tier the owner picked). A gym with no plan on record is
 * not locked here: gyms without any subscription are already blocked from writing
 * by the database (see 20261023090000_new_gyms_need_a_subscription.sql).
 *
 * This only shapes what the app shows. The aggregate data behind the Analytics
 * screens comes from tables the gym can read anyway (members, invoices, classes),
 * so it is a plan boundary, not a security boundary.
 */
export function planIncludesAnalytics(tier: string | null | undefined): boolean {
  return (tier ?? "").trim().toLowerCase() !== "starter";
}
