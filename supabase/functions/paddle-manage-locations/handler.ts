// Request handling for paddle-manage-locations, kept free of Deno and Supabase
// imports so every branch can be unit-tested (see handler.test.ts). index.ts
// wires the real clients into `ManageDeps`.
//
// A tenant admin sets how many EXTRA locations (beyond the one their plan
// includes) they pay for. This changes the quantity of the extra-location line
// item on their Paddle subscription, then records the result in
// platform_subscriptions.extra_locations - which the database trigger on
// `branches` enforces (20261022090000_add_extra_locations.sql).
//
// Flow, in this order (the order is the security model):
//   1. CORS / method / bearer token checks.
//   2. The caller's own JWT resolves THEIR tenant and says whether they are its
//      admin (get_location_usage). The tenant is never taken from the request.
//   3. Validate the requested number; rate-limit per tenant.
//   4. Load the stored subscription (service role). Only an active Paddle
//      subscription can be changed.
//   5. Read the subscription's current items from Paddle, replace ONLY the
//      extra-location item, and PATCH. The request carries an absolute
//      quantity, so a retry cannot charge twice.
//   6. Store what Paddle reports back. The paddle-webhook also does this from
//      its subscription.updated event; the two agree because both derive the
//      number from the same items.
//
// The Paddle request shapes (GET/PATCH /subscriptions/{id}, `items`,
// `proration_billing_mode`) follow Paddle Billing API v2's published
// reference. The paddle-docs MCP server was not connected when this was
// written, so confirm them against the sandbox before relying on this.

import { bearerToken, corsHeaders, reply, type HttpResponse } from "../_shared/http.ts";
import { breakdownItems, extraPriceIdFor, type PlanTier, type PriceConfig } from "../_shared/paddle-items.ts";

export interface ManageRequest {
  method: string;
  origin: string | null;
  authorization: string | null;
  bodyText: string;
}

export type ManageResponse = HttpResponse;

/** What get_location_usage() returns for the signed-in caller. */
export interface LocationUsage {
  tenant_id: string;
  used: number;
  limit: number | null;
  extra_locations: number;
  is_admin: boolean;
}

/** The platform_subscriptions columns this function needs. */
export interface StoredSubscription {
  plan_tier: string | null;
  status: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  extra_locations: number;
}

export interface PaddleItem {
  price_id: string;
  quantity: number;
}

export type ProrationMode = "prorated_immediately" | "prorated_next_billing_period";

export type PaddleResult = { ok: true; items: unknown[] } | { ok: false; status: number; detail: string };

export interface ManageDeps {
  allowedOrigins: string[];
  /** Highest number of extra locations a tenant may buy. */
  maxExtra: number;
  prices: PriceConfig;
  /** false when PADDLE_API_KEY is not set. */
  paddleConfigured: boolean;
  getUsage(token: string): Promise<LocationUsage | null>;
  loadSubscription(tenantId: string): Promise<StoredSubscription | null>;
  /** true = under the limit. */
  rateLimit(key: string): Promise<boolean>;
  getPaddleItems(subscriptionId: string): Promise<PaddleResult>;
  updatePaddleItems(subscriptionId: string, items: PaddleItem[], mode: ProrationMode): Promise<PaddleResult>;
  saveExtraLocations(tenantId: string, extraLocations: number): Promise<void>;
  log(message: string, detail?: unknown): void;
}

const MAX_BODY_BYTES = 2_000;

export function parseInput(raw: unknown, maxExtra: number): { ok: true; extraLocations: number } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Send a JSON object." };
  }
  const value = (raw as Record<string, unknown>).extra_locations;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > maxExtra) {
    return { ok: false, error: `Choose between 0 and ${maxExtra} extra locations.` };
  }
  return { ok: true, extraLocations: value };
}

const isPlan = (value: string | null): value is PlanTier => value === "starter" || value === "pro";

/** The items of a Paddle subscription that are NOT the extra-location add-on, ready to send back. */
function keepBaseItems(rawItems: unknown[], extraPriceIds: string[]): PaddleItem[] {
  const kept: PaddleItem[] = [];
  for (const raw of rawItems) {
    if (typeof raw !== "object" || raw === null) continue;
    const item = raw as Record<string, unknown>;
    if (item.status === "inactive") continue;
    const priceId = (item.price as Record<string, unknown> | undefined)?.id;
    if (typeof priceId !== "string" || extraPriceIds.includes(priceId)) continue;
    const quantity = typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1;
    kept.push({ price_id: priceId, quantity });
  }
  return kept;
}

export async function handleManageLocations(req: ManageRequest, deps: ManageDeps): Promise<ManageResponse> {
  const cors = corsHeaders(req.origin, deps.allowedOrigins);

  if (req.method === "OPTIONS") return reply(204, cors);
  if (req.method !== "POST") return reply(405, cors, { error: "Method not allowed." });

  const token = bearerToken(req.authorization);
  if (!token) return reply(401, cors, { error: "Sign in again." });

  // 2. Who is this, which gym, and are they its admin?
  let usage: LocationUsage | null;
  try {
    usage = await deps.getUsage(token);
  } catch (err) {
    deps.log("get_location_usage failed", err);
    return reply(401, cors, { error: "Sign in again." });
  }
  if (!usage) return reply(401, cors, { error: "Sign in again." });
  if (!usage.is_admin) return reply(403, cors, { error: "Only a workspace admin can change billing." });

  // 3. Input + rate limit (a quantity change can charge the customer).
  if (req.bodyText.length > MAX_BODY_BYTES) return reply(413, cors, { error: "Request too large." });
  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return reply(400, cors, { error: "Send a JSON object." });
  }
  const parsed = parseInput(raw, deps.maxExtra);
  if (!parsed.ok) return reply(400, cors, { error: parsed.error });
  const target = parsed.extraLocations;

  try {
    if (!(await deps.rateLimit(`paddle-manage-locations:${usage.tenant_id}`))) {
      return reply(429, cors, { error: "Too many changes. Try again in a few minutes." });
    }
  } catch (err) {
    // A broken limiter must not block a verified admin.
    deps.log("rate limit check failed", err);
  }

  // You cannot pay for fewer locations than you are using.
  const minimum = Math.max(0, usage.used - 1);
  if (target < minimum) {
    return reply(409, cors, {
      error: `You have ${usage.used} locations in use. Delete a branch before reducing below ${minimum} extra.`,
    });
  }

  // 4. Only an active Paddle subscription has a line item to change.
  let sub: StoredSubscription | null;
  try {
    sub = await deps.loadSubscription(usage.tenant_id);
  } catch (err) {
    deps.log("loadSubscription failed", err);
    return reply(500, cors, { error: "Could not load your subscription. Nothing was changed." });
  }
  if (!sub || sub.payment_provider !== "paddle" || !sub.payment_reference) {
    return reply(409, cors, { error: "Your plan's locations are not billed through a subscription, so there is nothing to change here." });
  }
  if (sub.status !== "active") {
    return reply(409, cors, { error: "Your subscription is not active. Renew it before adding locations." });
  }
  if (!isPlan(sub.plan_tier)) {
    return reply(409, cors, { error: "Your plan does not support extra locations." });
  }

  const extraPriceId = extraPriceIdFor(sub.plan_tier, deps.prices);
  if (!deps.paddleConfigured || !extraPriceId) {
    deps.log("extra-location billing is not configured (PADDLE_API_KEY / *_EXTRA_LOCATION_PRICE_ID)");
    return reply(503, cors, { error: "Adding locations is not available yet." });
  }
  const allExtraPriceIds = [deps.prices.starterExtraPriceId, deps.prices.proExtraPriceId].filter((id): id is string => Boolean(id));

  // 5. Current state according to Paddle (the source of truth for what is billed).
  const current = await deps.getPaddleItems(sub.payment_reference);
  if (!current.ok) {
    deps.log("could not read the Paddle subscription", current);
    return reply(502, cors, { error: "Could not reach billing. Nothing was changed." });
  }
  const paddleExtra = breakdownItems(current.items, deps.prices).extraLocations ?? 0;

  let reported = paddleExtra;
  if (target !== paddleExtra) {
    const base = keepBaseItems(current.items, allExtraPriceIds);
    if (base.length === 0) {
      // Sending only the add-on would replace the customer's plan with it.
      deps.log("Paddle subscription has no base item; refusing to PATCH", sub.payment_reference);
      return reply(502, cors, { error: "Could not read your plan from billing. Nothing was changed." });
    }
    const items: PaddleItem[] = target > 0 ? [...base, { price_id: extraPriceId, quantity: target }] : base;
    // Adding charges the prorated amount now; removing takes effect at renewal.
    const mode: ProrationMode = target > paddleExtra ? "prorated_immediately" : "prorated_next_billing_period";

    const updated = await deps.updatePaddleItems(sub.payment_reference, items, mode);
    if (!updated.ok) {
      deps.log("Paddle rejected the quantity change", updated);
      return reply(502, cors, {
        error: "Billing could not make that change, so nothing was charged and your plan is unchanged. Check your payment method and try again.",
      });
    }
    reported = breakdownItems(updated.items, deps.prices).extraLocations ?? target;
    if (reported !== target) deps.log(`Paddle reports ${reported} extra locations after a request for ${target}`);
  }

  // 6. Record it. If this fails the money has already moved, so say so and
  // let the webhook reconcile rather than telling the customer it failed.
  let synced = true;
  try {
    await deps.saveExtraLocations(usage.tenant_id, reported);
  } catch (err) {
    synced = false;
    deps.log(`saved to Paddle but not to the database for tenant ${usage.tenant_id}`, err);
  }

  return reply(200, cors, { extra_locations: reported, limit: 1 + reported, synced });
}
