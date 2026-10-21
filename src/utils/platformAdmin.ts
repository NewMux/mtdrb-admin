import type {
  AccessState,
  PlanTier,
  PlatformAdminStatus,
  PlatformAuditEntry,
  SubscriptionSummary,
  TenantFilter,
  TenantSort,
} from "../types/platformAdmin";

/**
 * Pure helpers for the platform-owner console. Authorisation is enforced in the
 * database (platform_admin_status / require_platform_admin); nothing here is a
 * security boundary.
 */

/**
 * True for /superadmin and anything below it, on a path-segment boundary so
 * look-alikes such as /superadminfoo do not match.
 */
export function isPlatformAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/superadmin" || pathname.startsWith("/superadmin/");
}

/**
 * Strictly parses the RPC result. Only the two documented non-denied values
 * pass through; anything else (including the mock client's fallback object)
 * is treated as not_admin.
 */
export function parsePlatformAdminStatus(raw: unknown): PlatformAdminStatus {
  if (raw === "ok") return "ok";
  if (raw === "mfa_required") return "mfa_required";
  return "not_admin";
}

export const ACCESS_STATE_LABEL: Record<AccessState, string> = {
  awaiting_activation: "Awaiting activation",
  paid: "Paid (Paddle)",
  complimentary: "Complimentary",
  trialing: "Trial",
  inactive: "No access",
};

export const ACCESS_STATE_TONE: Record<AccessState, string> = {
  awaiting_activation:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  complimentary: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  trialing: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  inactive: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

export const TENANT_FILTERS: Array<{ value: TenantFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "awaiting_activation", label: "Awaiting activation" },
  { value: "paid", label: "Paid" },
  { value: "complimentary", label: "Complimentary" },
  { value: "trialing", label: "Trial" },
  { value: "inactive", label: "No access" },
  { value: "ending_soon", label: "Ending soon" },
  { value: "suspended", label: "Suspended" },
];

export const TENANT_SORTS: Array<{ value: TenantSort; label: string }> = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "period_end_asc", label: "Access ends soonest" },
];

export const PLAN_TIER_OPTIONS: Array<{
  value: PlanTier;
  label: string;
  proFeatures: boolean;
}> = [
  { value: "pro", label: "Pro", proFeatures: true },
  { value: "enterprise", label: "Enterprise", proFeatures: true },
  { value: "starter", label: "Starter", proFeatures: false },
  { value: "demo", label: "Demo", proFeatures: false },
];

/** Only pro and enterprise unlock the app's Pro features (SubscriptionContext). */
export function isProTier(tier: string | null | undefined): boolean {
  return tier === "pro" || tier === "enterprise";
}

export const GRANT_DURATIONS = [
  { key: "14d", label: "14 days", days: 14 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "1y", label: "1 year", days: 365 },
  { key: "custom", label: "Until a date…", days: null },
  { key: "none", label: "No expiry", days: null },
] as const;

export type GrantDurationKey = (typeof GRANT_DURATIONS)[number]["key"];

const MAX_GRANT_DAYS = 365 * 5;
const DAY_MS = 86_400_000;

export interface GrantInput {
  durationKey: GrantDurationKey;
  /** yyyy-mm-dd, used when durationKey is "custom". */
  customDate: string;
  reason: string;
  /** Typed confirmation, required for "No expiry". */
  confirmName: string;
  tenantName: string;
}

export type GrantErrors = Partial<
  Record<"duration" | "reason" | "confirmName", string>
>;

/**
 * Resolves the chosen duration to the ISO timestamp the RPC expects, or null
 * for no expiry. Custom dates run to the end of the chosen local day.
 */
export function computeGrantUntil(
  durationKey: GrantDurationKey,
  customDate: string,
  now: Date = new Date(),
): { until: string | null; error?: string } {
  if (durationKey === "none") return { until: null };

  if (durationKey === "custom") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
      return { until: null, error: "Choose an end date." };
    }
    const [y, m, d] = customDate.split("-").map(Number);
    const end = new Date(y, m - 1, d, 23, 59, 59, 0);
    if (Number.isNaN(end.getTime()) || end.getMonth() !== m - 1) {
      return { until: null, error: "That is not a valid date." };
    }
    if (end.getTime() <= now.getTime()) {
      return { until: null, error: "The end date must be in the future." };
    }
    if (end.getTime() - now.getTime() > MAX_GRANT_DAYS * DAY_MS) {
      return {
        until: null,
        error: "The end date must be within 5 years. Use “No expiry” instead.",
      };
    }
    return { until: end.toISOString() };
  }

  const preset = GRANT_DURATIONS.find((d) => d.key === durationKey);
  const days = preset && preset.days ? preset.days : 0;
  return { until: new Date(now.getTime() + days * DAY_MS).toISOString() };
}

export function validateGrantInput(
  input: GrantInput,
  now: Date = new Date(),
): GrantErrors {
  const errors: GrantErrors = {};

  const reason = input.reason.trim();
  if (reason.length < 3) errors.reason = "Give a short reason (at least 3 characters).";
  else if (reason.length > 500) errors.reason = "Keep the reason under 500 characters.";

  const { error } = computeGrantUntil(input.durationKey, input.customDate, now);
  if (error) errors.duration = error;

  if (
    input.durationKey === "none" &&
    input.confirmName.trim().toLowerCase() !== input.tenantName.trim().toLowerCase()
  ) {
    errors.confirmName = "Type the gym name to confirm access with no end date.";
  }

  return errors;
}

/** "Paddle", "Manual", or the raw provider name. */
export function describeSource(provider: string | null | undefined): string {
  if (!provider) return "—";
  if (provider === "paddle") return "Paddle";
  if (provider === "manual") return "Manual";
  return provider;
}

/**
 * A gym whose access is currently provided by Paddle. The console must not
 * override it - the owner changes or cancels it in Paddle instead.
 */
export function isPaddleManaged(
  subscription: SubscriptionSummary | null | undefined,
  accessState: AccessState,
): boolean {
  return (
    subscription?.payment_provider === "paddle" &&
    (accessState === "paid" || accessState === "trialing")
  );
}

/** Any Paddle subscription record, current or not (a late event could overwrite a grant). */
export function hasPaddleHistory(
  subscription: SubscriptionSummary | null | undefined,
): boolean {
  return subscription?.payment_provider === "paddle";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "today", "in 5 days", "3 days ago". */
export function formatRelativeDays(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const days = Math.round((t - now.getTime()) / DAY_MS);
  if (days === 0) return "today";
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  const ago = Math.abs(days);
  return `${ago} day${ago === 1 ? "" : "s"} ago`;
}

export const TENANT_PAGE_SIZE = 25;

export interface TenantListQuery {
  q: string;
  filter: TenantFilter;
  sort: TenantSort;
  page: number;
}

const FILTER_VALUES = TENANT_FILTERS.map((f) => f.value);
const SORT_VALUES = TENANT_SORTS.map((s) => s.value);

/** Reads (and sanitises) the Tenants list state from the URL query string. */
export function parseTenantListQuery(search: URLSearchParams): TenantListQuery {
  const filter = search.get("filter") as TenantFilter | null;
  const sort = search.get("sort") as TenantSort | null;
  const page = Number.parseInt(search.get("page") ?? "1", 10);
  return {
    q: (search.get("q") ?? "").slice(0, 100),
    filter: filter && FILTER_VALUES.includes(filter) ? filter : "all",
    sort: sort && SORT_VALUES.includes(sort) ? sort : "created_desc",
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  };
}

/** Writes the list state back to a query string, omitting defaults. */
export function serializeTenantListQuery(query: TenantListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.filter !== "all") params.set("filter", query.filter);
  if (query.sort !== "created_desc") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return params;
}

const TIER_LABEL: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
  demo: "Demo",
};

export function tierLabel(tier: string | null | undefined): string {
  if (!tier) return "—";
  return TIER_LABEL[tier] ?? tier;
}

/** One-line human summary of an audit row, plus the owner's reason/note. */
export function describeAuditEntry(entry: PlatformAuditEntry): {
  title: string;
  detail: string | null;
} {
  const details = entry.details ?? {};
  switch (entry.action) {
    case "grant_access": {
      const tier = tierLabel(details.after?.plan_tier);
      const end = details.after?.current_period_end;
      return {
        title: end
          ? `Granted ${tier} access until ${formatDate(end)}`
          : `Granted ${tier} access with no expiry`,
        detail: details.reason ?? null,
      };
    }
    case "revoke_access":
      return { title: "Revoked manual access", detail: details.reason ?? null };
    case "note":
      return { title: "Note", detail: details.note ?? null };
    case "suspend_gym":
      return {
        title: `Suspended gym (${details.banned_users ?? 0} sign-in${details.banned_users === 1 ? "" : "s"} blocked)`,
        detail: details.reason ?? null,
      };
    case "unsuspend_gym":
      return {
        title: `Lifted suspension (${details.unbanned_users ?? 0} sign-in${details.unbanned_users === 1 ? "" : "s"} restored)`,
        detail: details.reason ?? null,
      };
    case "delete_gym": {
      const deleted = details.deleted_users?.length ?? 0;
      return {
        title: deleted > 0 ? `Deleted gym and ${deleted} account${deleted === 1 ? "" : "s"}` : "Deleted gym",
        detail: details.reason ?? null,
      };
    }
    case "create_gym":
      return {
        title: `Created gym and invited ${details.admin_email ?? "an admin"}`,
        detail: details.reason ?? null,
      };
    case "ban_user":
      return { title: `Banned ${details.email ?? "a user"}`, detail: details.reason ?? null };
    case "unban_user":
      return { title: `Unbanned ${details.email ?? "a user"}`, detail: details.reason ?? null };
    case "reset_mfa":
      return { title: `Reset MFA for ${details.email ?? "a user"}`, detail: details.reason ?? null };
    case "change_role":
      return {
        title: `Changed ${details.email ?? "a user"} from ${details.from ?? "?"} to ${details.to ?? "?"}`,
        detail: details.reason ?? null,
      };
    case "delete_user": {
      const moved = Object.values(details.reassigned ?? {}).reduce((a, b) => a + b, 0);
      return {
        title: `Deleted ${details.email ?? "a user"}`,
        detail:
          moved > 0 && details.reassigned_to
            ? `${details.reason ?? ""}${details.reason ? "\n" : ""}${moved} record${moved === 1 ? "" : "s"} handed to ${details.reassigned_to}`
            : (details.reason ?? null),
      };
    }
    default:
      return { title: String(entry.action), detail: null };
  }
}
