// Client side of the paid-extra-locations feature (supabase/migrations/
// 20261022090000_add_extra_locations.sql, supabase/functions/
// paddle-manage-locations). A plan includes ONE location; each extra branch is
// a billed add-on. The database enforces the limit - everything here only
// explains it and starts the purchase.

import { supabase } from "../supabaseClient";
import { PRO_EXTRA_LOCATION_PRICE, STARTER_EXTRA_LOCATION_PRICE } from "../config/runtimeConfig";

/** Locations every plan includes before any extra is bought. */
export const INCLUDED_LOCATIONS = 1;

/** Most extra locations one gym can buy here. Keep in step with MAX_EXTRA_LOCATIONS in paddle-manage-locations and the CHECK on platform_subscriptions.extra_locations. */
export const MAX_EXTRA_LOCATIONS = 50;

export interface LocationUsage {
  tenantId: string;
  /** Branches that exist now. */
  used: number;
  /** null = no limit (no subscription on record, a manual grant, or enterprise). */
  limit: number | null;
  extraLocations: number;
  planTier: string | null;
  status: string | null;
  billingProvider: string | null;
  isAdmin: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asCount = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;

const asText = (value: unknown): string | null => (typeof value === "string" ? value : null);

/**
 * Validates the get_location_usage() payload. Returns null for anything else:
 * the dev mock backend answers unknown RPCs with unrelated demo data, and a
 * misread number here would show a wrong limit.
 */
export function parseLocationUsage(raw: unknown): LocationUsage | null {
  if (!isRecord(raw)) return null;
  const used = asCount(raw.used);
  const extraLocations = asCount(raw.extra_locations);
  const tenantId = asText(raw.tenant_id);
  if (used === null || extraLocations === null || !tenantId) return null;
  if (typeof raw.is_admin !== "boolean") return null;
  if (!("limit" in raw)) return null;

  const limit = raw.limit === null ? null : asCount(raw.limit);
  if (raw.limit !== null && limit === null) return null;

  return {
    tenantId,
    used,
    limit,
    extraLocations,
    planTier: asText(raw.plan_tier),
    status: asText(raw.status),
    billingProvider: asText(raw.billing_provider),
    isAdmin: raw.is_admin,
  };
}

/** Where the signed-in user's gym stands. null if it cannot be determined (the database still enforces the limit). */
export async function fetchLocationUsage(): Promise<LocationUsage | null> {
  const { data, error } = await supabase.rpc("get_location_usage");
  if (error) return null;
  return parseLocationUsage(data);
}

/** True when creating one more branch would be refused. */
export function atLocationLimit(usage: LocationUsage): boolean {
  return usage.limit !== null && usage.used >= usage.limit;
}

/** Whether an extra location can be bought here (an active Paddle subscription on a plan with an add-on). */
export function canBuyExtraLocation(usage: LocationUsage): boolean {
  return (
    usage.billingProvider === "paddle" &&
    usage.status === "active" &&
    (usage.planTier === "starter" || usage.planTier === "pro")
  );
}

/** Paid extra locations beyond what the existing branches need. */
export function unusedExtraLocations(usage: LocationUsage): number {
  return Math.max(0, usage.extraLocations - Math.max(0, usage.used - INCLUDED_LOCATIONS));
}

/**
 * Monthly price of one extra location on this plan, for display only: the
 * amount actually charged is the Paddle add-on price (keep them in sync, see
 * scripts/seed-paddle-catalog.mjs).
 */
export function extraLocationPrice(planTier: string | null): number | null {
  if (planTier === "starter") return STARTER_EXTRA_LOCATION_PRICE;
  if (planTier === "pro") return PRO_EXTRA_LOCATION_PRICE;
  return null;
}

/** The database refuses a branch insert past the limit with SQLSTATE LC001. */
export function isLocationLimitError(error: unknown): boolean {
  if (!isRecord(error)) return false;
  return error.code === "LC001" || (typeof error.message === "string" && error.message.includes("location_limit_reached"));
}

export interface ExtraLocationsResult {
  extraLocations: number;
  limit: number;
  /** false if billing changed but our own record has not caught up yet (the webhook will). */
  synced: boolean;
}

export class LocationBillingError extends Error {}

type FunctionsClient = {
  functions: {
    invoke: (name: string, options: { body: unknown }) => Promise<{ data: unknown; error: unknown }>;
  };
};

async function functionErrorMessage(error: unknown): Promise<string> {
  const ctx = (error as { context?: { status?: number; json?: () => Promise<unknown> } } | null)?.context;
  if (ctx?.json) {
    try {
      const body = await ctx.json();
      if (isRecord(body) && typeof body.error === "string") return body.error;
    } catch {
      // fall through to the generic messages
    }
  }
  if (ctx?.status === 404) return "Adding locations isn't available yet.";
  return "Could not reach billing. Try again.";
}

/** Sets how many extra locations the gym pays for (an absolute number, never a delta). */
export async function setExtraLocations(extraLocations: number): Promise<ExtraLocationsResult> {
  const { data, error } = await (supabase as unknown as FunctionsClient).functions.invoke(
    "paddle-manage-locations",
    { body: { extra_locations: extraLocations } },
  );
  if (error) throw new LocationBillingError(await functionErrorMessage(error));

  const confirmed = isRecord(data) ? asCount(data.extra_locations) : null;
  const limit = isRecord(data) ? asCount(data.limit) : null;
  if (confirmed === null || limit === null) {
    throw new LocationBillingError("Billing returned an unexpected answer. Refresh to see your current plan.");
  }
  return { extraLocations: confirmed, limit, synced: isRecord(data) && data.synced !== false };
}
