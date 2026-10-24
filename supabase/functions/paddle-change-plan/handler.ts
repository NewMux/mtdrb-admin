// Request handling for paddle-change-plan, kept free of Deno and Supabase
// imports so every branch can be unit-tested (see handler.test.ts). index.ts
// wires the real clients into `ChangePlanDeps`.
//
// A tenant admin moves their gym from Starter to Pro on the subscription they
// already have. Two actions:
//   "preview"  asks Paddle what the change would cost (the prorated amount
//              charged today and the new recurring price) without applying it.
//   "upgrade"  applies it: Paddle swaps the base-plan item, moves any paid extra
//              locations onto the Pro add-on price (same quantity), and charges
//              the prorated difference to the card on file immediately.
//
// Flow, in this order (the order is the security model):
//   1. CORS / method / bearer token checks.
//   2. The caller's own JWT resolves THEIR tenant and says whether they are its
//      admin. The tenant is never taken from the request.
//   3. Validate the action; rate-limit per tenant.
//   4. Load the stored subscription (service role). Only an active, not-ending
//      Paddle subscription on Starter can be upgraded.
//   5. Read the subscription from Paddle (the source of truth for what is
//      billed) and build the complete new item list from it.
//   6. Preview, or apply. The request carries the whole final item list, so a
//      retry cannot charge twice: a second call finds the plan already on Pro.
//   7. Store what Paddle reports back. paddle-webhook does the same from its
//      subscription.updated event; both derive the plan from the same items.
//
// Only Starter -> Pro is offered. Downgrades and annual/monthly switches are not
// handled here (the price IDs for those are not configured), so they are refused
// rather than guessed.
//
// Request shapes (PATCH /subscriptions/{id} and PATCH /subscriptions/{id}/preview
// with the full `items` list, `proration_billing_mode`, `on_payment_failure`)
// were checked against Paddle's API reference through the Paddle MCP server's
// method search. Response fields that are read defensively (update_summary,
// immediate_transaction totals) should still be confirmed against a real
// sandbox subscription before relying on the amounts shown.

import { bearerToken, corsHeaders, reply, type HttpResponse } from "../_shared/http.ts";
import { paddleAmountToMajor } from "../_shared/money.ts";
import { breakdownItems, type PriceConfig } from "../_shared/paddle-items.ts";

export interface ChangePlanRequest {
  method: string;
  origin: string | null;
  authorization: string | null;
  bodyText: string;
}

export type ChangePlanResponse = HttpResponse;

/** Who is calling, from the database's point of view. */
export interface Caller {
  tenant_id: string;
  is_admin: boolean;
}

/** The platform_subscriptions columns this function needs. */
export interface StoredSubscription {
  plan_tier: string | null;
  status: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  cancel_at: string | null;
  extra_locations: number;
}

export interface PaddleItem {
  price_id: string;
  quantity: number;
}

export type PaddleResult = { ok: true; subscription: Record<string, unknown> } | { ok: false; status: number; detail: string };

/** What gets stored once Paddle has accepted the upgrade. */
export interface SavedUpgrade {
  planTier: "pro";
  amount: number | null;
  currency: string | undefined;
  /** null = unknown, leave the stored value alone. */
  extraLocations: number | null;
}

export interface ChangePlanDeps {
  allowedOrigins: string[];
  prices: PriceConfig;
  /** false when PADDLE_API_KEY is not set. */
  paddleConfigured: boolean;
  getCaller(token: string): Promise<Caller | null>;
  loadSubscription(tenantId: string): Promise<StoredSubscription | null>;
  /** true = under the limit. */
  rateLimit(key: string, max: number): Promise<boolean>;
  getPaddleSubscription(subscriptionId: string): Promise<PaddleResult>;
  /** Paddle's "preview an update": nothing is applied or charged. */
  previewUpdate(subscriptionId: string, items: PaddleItem[]): Promise<PaddleResult>;
  /** Applies the change and bills the prorated difference now. */
  applyUpdate(subscriptionId: string, items: PaddleItem[]): Promise<PaddleResult>;
  saveUpgrade(tenantId: string, upgrade: SavedUpgrade): Promise<void>;
  log(message: string, detail?: unknown): void;
}

const MAX_BODY_BYTES = 1_000;

export function parseAction(raw: unknown): "preview" | "upgrade" | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const action = (raw as Record<string, unknown>).action;
  return action === "preview" || action === "upgrade" ? action : null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asIso = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
};

export interface Money {
  amount: number;
  currency: string;
}

/**
 * What the card will be charged today for a previewed change. Prefers the
 * immediate transaction's grand total (tax included, net of credit); falls back
 * to the update summary. null when neither can be read - the screen then says
 * the amount is prorated instead of showing a number it does not have.
 */
export function readChargeNow(preview: Record<string, unknown>): Money | null {
  const txn = preview.immediate_transaction;
  if (isRecord(txn) && isRecord(txn.details) && isRecord(txn.details.totals)) {
    const totals = txn.details.totals;
    const currency = typeof totals.currency_code === "string" ? totals.currency_code : undefined;
    for (const key of ["grand_total", "total"]) {
      const amount = paddleAmountToMajor(totals[key], currency);
      if (amount !== null && currency) return { amount, currency };
    }
  }

  const summary = preview.update_summary;
  if (isRecord(summary) && isRecord(summary.result)) {
    const currency = typeof summary.result.currency_code === "string" ? summary.result.currency_code : undefined;
    // A credit goes to the customer's balance: nothing is charged today.
    if (summary.result.action === "credit" && currency) return { amount: 0, currency };
    if (summary.result.action === "charge") {
      const amount = paddleAmountToMajor(summary.result.amount, currency);
      if (amount !== null && currency) return { amount, currency };
    }
  }
  return null;
}

/**
 * The complete item list after the upgrade: every active item that is not the
 * Starter plan or an extra-location add-on is kept as it is, then the Pro plan
 * (quantity 1) and, if the gym pays for extra locations, the Pro add-on at the
 * same quantity. Paddle replaces the whole list, so leaving something out would
 * remove it from the customer's bill.
 */
export function buildProItems(rawItems: unknown[], prices: PriceConfig, extraLocations: number): PaddleItem[] {
  const planAndAddOnIds = [prices.starterPriceId, prices.proPriceId, prices.starterExtraPriceId, prices.proExtraPriceId];
  const items: PaddleItem[] = [];
  for (const raw of rawItems) {
    if (!isRecord(raw) || raw.status === "inactive") continue;
    const priceId = isRecord(raw.price) ? raw.price.id : undefined;
    if (typeof priceId !== "string" || planAndAddOnIds.includes(priceId)) continue;
    const quantity = typeof raw.quantity === "number" && Number.isInteger(raw.quantity) && raw.quantity > 0 ? raw.quantity : 1;
    items.push({ price_id: priceId, quantity });
  }
  items.push({ price_id: prices.proPriceId!, quantity: 1 });
  if (extraLocations > 0) items.push({ price_id: prices.proExtraPriceId!, quantity: extraLocations });
  return items;
}

function itemsOf(subscription: Record<string, unknown>): unknown[] {
  return Array.isArray(subscription.items) ? subscription.items : [];
}

export async function handleChangePlan(req: ChangePlanRequest, deps: ChangePlanDeps): Promise<ChangePlanResponse> {
  const cors = corsHeaders(req.origin, deps.allowedOrigins);

  if (req.method === "OPTIONS") return reply(204, cors);
  if (req.method !== "POST") return reply(405, cors, { error: "Method not allowed." });

  const token = bearerToken(req.authorization);
  if (!token) return reply(401, cors, { error: "Sign in again." });

  // 2. Who is this, which gym, and are they its admin?
  let caller: Caller | null;
  try {
    caller = await deps.getCaller(token);
  } catch (err) {
    deps.log("could not resolve the caller", err);
    return reply(401, cors, { error: "Sign in again." });
  }
  if (!caller) return reply(401, cors, { error: "Sign in again." });
  if (!caller.is_admin) return reply(403, cors, { error: "Only a workspace admin can change billing." });

  // 3. Input + rate limit. Previews are free and read-only, so they get a
  // roomier limit than the action that charges.
  if (req.bodyText.length > MAX_BODY_BYTES) return reply(413, cors, { error: "Request too large." });
  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return reply(400, cors, { error: "Send a JSON object." });
  }
  const action = parseAction(raw);
  if (!action) return reply(400, cors, { error: "Choose preview or upgrade." });

  try {
    const allowed = await deps.rateLimit(`paddle-change-plan:${action}:${caller.tenant_id}`, action === "preview" ? 30 : 10);
    if (!allowed) return reply(429, cors, { error: "Too many changes. Try again in a few minutes." });
  } catch (err) {
    // A broken limiter must not block a verified admin.
    deps.log("rate limit check failed", err);
  }

  // 4. Only an active Paddle subscription on Starter can be upgraded here.
  let sub: StoredSubscription | null;
  try {
    sub = await deps.loadSubscription(caller.tenant_id);
  } catch (err) {
    deps.log("loadSubscription failed", err);
    return reply(500, cors, { error: "Could not load your subscription. Nothing was changed." });
  }
  if (!sub || sub.payment_provider !== "paddle" || !sub.payment_reference) {
    return reply(409, cors, {
      error: "Your plan is not billed through a subscription, so it cannot be changed here. Contact support to change it.",
    });
  }
  if (sub.status === "past_due") {
    return reply(409, cors, { error: "Your last payment failed. Update your payment method before changing plan." });
  }
  if (sub.status !== "active") {
    return reply(409, cors, { error: "Your subscription is not active. Subscribe again to continue." });
  }
  if (sub.cancel_at) {
    return reply(409, cors, { error: "Your subscription is set to end. Keep your subscription first, then upgrade." });
  }
  if (sub.plan_tier !== "starter" && sub.plan_tier !== "pro") {
    return reply(409, cors, { error: "Your plan cannot be changed here. Contact support." });
  }

  const { prices } = deps;
  if (!deps.paddleConfigured || !prices.starterPriceId || !prices.proPriceId) {
    deps.log("plan changes are not configured (PADDLE_API_KEY / PADDLE_STARTER_PRICE_ID / PADDLE_PRO_PRICE_ID)");
    return reply(503, cors, { error: "Upgrading is not available yet. Contact support." });
  }

  // 5. Current state according to Paddle.
  const current = await deps.getPaddleSubscription(sub.payment_reference);
  if (!current.ok) {
    deps.log("could not read the Paddle subscription", current);
    return reply(502, cors, { error: "Could not reach billing. Nothing was changed." });
  }
  const now = breakdownItems(itemsOf(current.subscription), prices);

  // Already on Pro in billing (a double click, a retry, or an upgrade whose
  // record never caught up): make our record agree and report success. No charge.
  if (now.planTier === "pro") {
    const synced = await store(deps, caller.tenant_id, now);
    return reply(200, cors, { already: true, plan_tier: "pro", extra_locations: now.extraLocations ?? sub.extra_locations, synced });
  }
  if (now.planTier !== "starter") {
    // Annual price, or one this deployment is not configured for.
    deps.log("subscription is not on the configured Starter price", sub.payment_reference);
    return reply(409, cors, { error: "Your plan cannot be changed here. Contact support." });
  }

  const extras = now.extraLocations ?? sub.extra_locations;
  if (extras > 0 && !prices.proExtraPriceId) {
    // Without the Pro add-on price the gym's paid locations could not move over.
    deps.log("PADDLE_PRO_EXTRA_LOCATION_PRICE_ID is not set; cannot carry extra locations to Pro");
    return reply(503, cors, { error: "Upgrading is not available yet. Contact support." });
  }

  const items = buildProItems(itemsOf(current.subscription), prices, extras);

  // 6a. Preview: nothing is applied.
  if (action === "preview") {
    const preview = await deps.previewUpdate(sub.payment_reference, items);
    if (!preview.ok) {
      deps.log("Paddle rejected the preview", preview);
      return reply(502, cors, { error: "Could not work out the price of the upgrade. Nothing was changed. Try again." });
    }
    const recurring = breakdownItems(itemsOf(preview.subscription), prices);
    return reply(200, cors, {
      plan_tier: "pro",
      extra_locations: extras,
      charge_now: readChargeNow(preview.subscription),
      recurring:
        recurring.amount !== null && recurring.currencyCode ? { amount: recurring.amount, currency: recurring.currencyCode } : null,
      next_billed_at: asIso(preview.subscription.next_billed_at),
    });
  }

  // 6b. Upgrade: Paddle charges the prorated difference now. If the card is
  // declined the change is not applied (on_payment_failure: prevent_change).
  const updated = await deps.applyUpdate(sub.payment_reference, items);
  if (!updated.ok) {
    deps.log("Paddle rejected the upgrade", updated);
    return reply(502, cors, {
      error: "Billing could not complete the upgrade, so you were not charged and your plan is unchanged. Check your payment method and try again.",
    });
  }

  // 7. Record it. If this fails the change has already happened in billing, so
  // say so and let the webhook reconcile rather than telling the customer it failed.
  const result = breakdownItems(itemsOf(updated.subscription), prices);
  if (result.planTier !== "pro") deps.log(`Paddle reports plan ${result.planTier ?? "unknown"} after an upgrade to pro`);
  const synced = result.planTier === "pro" ? await store(deps, caller.tenant_id, result) : false;

  return reply(200, cors, { plan_tier: "pro", extra_locations: result.extraLocations ?? extras, synced });
}

async function store(
  deps: ChangePlanDeps,
  tenantId: string,
  breakdown: ReturnType<typeof breakdownItems>,
): Promise<boolean> {
  try {
    await deps.saveUpgrade(tenantId, {
      planTier: "pro",
      amount: breakdown.amount,
      currency: breakdown.currencyCode,
      extraLocations: breakdown.extraLocations,
    });
    return true;
  } catch (err) {
    deps.log(`changed in Paddle but not recorded for tenant ${tenantId}`, err);
    return false;
  }
}
