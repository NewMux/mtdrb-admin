// Point-in-time member activity, used to build honest period-over-period
// comparisons (e.g. "active members vs last month").
//
// The `members` table has no history table - only a live `status` /
// `membership_status` plus `join_date` / `expiry_date`. So "how many
// members were active as of the end of last month" cannot be read back
// exactly; a manual status override before expiry (e.g. an early
// cancellation) is invisible to this approximation. What it fixes is a
// much worse bug: comparing "every member active right now" against
// "members who signed up last month" - two unrelated populations whose
// ratio produces triple-digit percentage swings with no meaning at all.
// This at least compares "active as of today" against "would have been
// counted active as of a past date, by the same rule."

export interface MemberActivityRow {
  join_date?: string | null;
  created_at?: string | null;
  expiry_date?: string | null;
  status?: string | null;
}

const ACTIVE_STATUSES = new Set(["active"]);

/**
 * Whether a member's membership was active as of `asOf`, approximated from
 * join/expiry dates: joined on or before `asOf`, and either no expiry date
 * or an expiry on/after `asOf`. Falls back to the member's current status
 * for `asOf` values at or after today, since the approximation only
 * applies to reconstructing the past.
 */
export function wasMemberActiveAsOf(member: MemberActivityRow, asOf: Date): boolean {
  const joinDateRaw = member.join_date || member.created_at;
  if (!joinDateRaw) return false;
  const joinDate = new Date(joinDateRaw);
  if (Number.isNaN(joinDate.getTime()) || joinDate > asOf) return false;

  if (member.expiry_date) {
    const expiryDate = new Date(member.expiry_date);
    if (!Number.isNaN(expiryDate.getTime()) && expiryDate < asOf) return false;
  }

  return true;
}

export function countMembersActiveAsOf(
  members: MemberActivityRow[],
  asOf: Date,
): number {
  return members.filter((m) => wasMemberActiveAsOf(m, asOf)).length;
}

export function isMemberCurrentlyActive(member: { status?: string | null }): boolean {
  return ACTIVE_STATUSES.has((member.status || "").toLowerCase());
}
