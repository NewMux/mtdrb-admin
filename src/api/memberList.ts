// The members list for gyms of any size: one page at a time, searched and
// filtered in the database. (The page used to download every member and filter in
// the browser, which stops being reasonable somewhere in the tens of thousands.)

import { supabase } from "../supabaseClient";
import { fetchAllRows } from "../utils/fetchAllRows";
import { toTableMember, type MemberRow, type TableMember } from "../utils/memberTableRow";

export const MEMBER_PAGE_SIZES = [10, 25, 50, 100] as const;
export const MAX_SEARCH_WORDS = 5;
export const MAX_SEARCH_LENGTH = 100;

export type MemberFilter = "all" | "active" | "inactive" | "new";

export class MemberListError extends Error {}

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
};

/**
 * One filter expression per word the person typed; PostgREST ANDs repeated `or`
 * parameters, so "ahmed mans" finds Ahmed Al-Mansoori, and each word may match the
 * first name, last name, email or phone.
 *
 * `,` `(` `)` `"` `\` `:` and the wildcards `%` `*` would change the meaning of the
 * expression (or let someone inject another condition), so they are removed rather
 * than escaped; names, emails and phone numbers do not need them.
 */
export function memberSearchClauses(term: string): string[] {
  const words = term
    .slice(0, MAX_SEARCH_LENGTH)
    .replace(/[,()"\\:%*]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_SEARCH_WORDS);
  return words.map((word) => {
    const pattern = `%${word}%`;
    return `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`;
  });
}

/** "Joined in the last month": join_date, or created_at for members without one. */
const joinedSince = (date: string, iso: string) => `join_date.gte.${date},and(join_date.is.null,created_at.gte.${iso})`;
const joinedUntil = (date: string, iso: string) => `join_date.lte.${date},and(join_date.is.null,created_at.lte.${iso})`;

export interface MemberPageParams {
  tenantId: string;
  /** 1-based */
  page: number;
  pageSize: number;
  search: string;
  filter: MemberFilter;
  /** The start of "new this month": a calendar date and the same instant. */
  newSince: { date: string; iso: string };
}

export interface MemberPage {
  rows: TableMember[];
  total: number;
}

export async function fetchMemberPage(params: MemberPageParams): Promise<MemberPage> {
  const pageSize = Math.min(Math.max(Math.floor(params.pageSize) || 10, 1), 200);
  const page = Math.max(Math.floor(params.page) || 1, 1);
  const from = (page - 1) * pageSize;

  let query = supabase.from("members").select("*", { count: "exact" }).eq("tenant_id", params.tenantId);
  for (const clause of memberSearchClauses(params.search)) query = query.or(clause);
  if (params.filter === "active") query = query.eq("status", "active");
  if (params.filter === "inactive") query = query.eq("status", "inactive");
  if (params.filter === "new") query = query.or(joinedSince(params.newSince.date, params.newSince.iso));

  const { data, error, count } = await query
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + pageSize - 1);
  if (error) throw new MemberListError(errorMessage(error));
  return { rows: (data ?? []).map((row) => toTableMember(row as MemberRow)), total: count ?? 0 };
}

/** The newest members, for the dashboard tab. */
export async function fetchRecentMembers(tenantId: string, limit = 5): Promise<TableMember[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);
  if (error) throw new MemberListError(errorMessage(error));
  return (data ?? []).map((row) => toTableMember(row as MemberRow));
}

export interface MemberCounts {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  /** Members who had joined by the end of last month. */
  previousTotal: number;
  /** ...and whose plan had not run out by then (see utils/memberActivity.ts). */
  previousActive: number;
}

export interface MemberCountParams {
  tenantId: string;
  newSince: { date: string; iso: string };
  /** The last instant of last month in the gym's timezone. */
  previousMonthEnd: Date;
}

/**
 * Head-only counts, so nothing is downloaded however many members there are. The
 * "last month" figures follow wasMemberActiveAsOf(): joined on or before that
 * instant, and no expiry before it. A date at UTC midnight is on or before an
 * instant exactly when the date is on or before the instant's UTC date, which is
 * why the comparisons below use that date.
 */
export async function fetchMemberCounts(params: MemberCountParams): Promise<MemberCounts> {
  const asOfIso = params.previousMonthEnd.toISOString();
  const asOfDate = asOfIso.slice(0, 10);

  const base = () => supabase.from("members").select("id", { count: "exact", head: true }).eq("tenant_id", params.tenantId);
  const results = await Promise.all([
    base(),
    base().eq("status", "active"),
    base().eq("status", "inactive"),
    base().or(joinedSince(params.newSince.date, params.newSince.iso)),
    base().or(joinedUntil(asOfDate, asOfIso)),
    base().or(joinedUntil(asOfDate, asOfIso)).or(`expiry_date.is.null,expiry_date.gt.${asOfDate}`),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new MemberListError(errorMessage(failed.error));
  const [total, active, inactive, fresh, previousTotal, previousActive] = results.map((r) => r.count ?? 0);
  return { total, active, inactive, newThisMonth: fresh, previousTotal, previousActive };
}

/** Every member, for the CSV export: paged so a big gym is not cut off at 1,000 rows. */
export async function fetchAllMembersForExport(tenantId: string): Promise<MemberRow[]> {
  return fetchAllRows((from, to) =>
    supabase
      .from("members")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to),
  ) as Promise<MemberRow[]>;
}
