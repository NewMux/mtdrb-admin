// Reads a Paddle subscription's line items into what platform_subscriptions
// stores: which plan the tenant is on, how many extra locations they pay for,
// and the total recurring amount.
//
// A subscription has one BASE item (the Starter or Pro price, quantity 1) and,
// once the tenant has added branches, one EXTRA-LOCATION item (the add-on
// price for that plan, quantity = number of extra locations). Items are
// matched by price ID, never by position: Paddle does not promise an order.
//
// Shapes follow Paddle Billing's published subscription entity
// (items[].price.id, items[].quantity, items[].price.unit_price.{amount,
// currency_code}, items[].status). The paddle-docs MCP server was not
// connected when this was written, so verify against a real sandbox
// subscription webhook before relying on it for live traffic.

import { paddleAmountToMajor } from "./money.ts";

export type PlanTier = "starter" | "pro";

export interface PriceConfig {
  starterPriceId?: string;
  proPriceId?: string;
  starterExtraPriceId?: string;
  proExtraPriceId?: string;
}

export function readPriceConfig(getEnv: (key: string) => string | undefined): PriceConfig {
  const read = (key: string) => getEnv(key)?.trim() || undefined;
  return {
    starterPriceId: read("PADDLE_STARTER_PRICE_ID"),
    proPriceId: read("PADDLE_PRO_PRICE_ID"),
    starterExtraPriceId: read("PADDLE_STARTER_EXTRA_LOCATION_PRICE_ID"),
    proExtraPriceId: read("PADDLE_PRO_EXTRA_LOCATION_PRICE_ID"),
  };
}

export function extraPriceIdFor(plan: PlanTier, cfg: PriceConfig): string | undefined {
  return plan === "starter" ? cfg.starterExtraPriceId : cfg.proExtraPriceId;
}

export function planForPriceId(priceId: string | undefined, cfg: PriceConfig): PlanTier | undefined {
  if (!priceId) return undefined;
  if (priceId === cfg.starterPriceId) return "starter";
  if (priceId === cfg.proPriceId) return "pro";
  return undefined;
}

export interface SubscriptionBreakdown {
  planTier?: PlanTier;
  /**
   * Paid extra locations, or null when it cannot be known (no extra-location
   * price IDs configured). null means "leave the stored value alone" - writing
   * 0 there would silently strip a customer's paid locations.
   */
  extraLocations: number | null;
  /** Total recurring amount (base + extras) in major units, or null if unreadable. */
  amount: number | null;
  currencyCode?: string;
}

interface ParsedItem {
  priceId?: string;
  /** null when Paddle's quantity is missing or not a non-negative integer. */
  quantity: number | null;
  unitMinor: string | null;
  currency?: string;
}

function parseItem(raw: unknown): ParsedItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  // A removed item stays in the entity as "inactive"; it is no longer billed.
  if (item.status === "inactive") return null;

  const price = (item.price ?? {}) as Record<string, unknown>;
  const unitPrice = (price.unit_price ?? {}) as Record<string, unknown>;
  const quantity = typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity >= 0 ? item.quantity : null;

  return {
    priceId: typeof price.id === "string" ? price.id : undefined,
    quantity,
    unitMinor: typeof unitPrice.amount === "string" && /^\d+$/.test(unitPrice.amount) ? unitPrice.amount : null,
    currency: typeof unitPrice.currency_code === "string" ? unitPrice.currency_code : undefined,
  };
}

export function breakdownItems(rawItems: unknown, cfg: PriceConfig): SubscriptionBreakdown {
  const items = (Array.isArray(rawItems) ? rawItems : []).map(parseItem).filter((i): i is ParsedItem => i !== null);
  const isExtra = (i: ParsedItem) =>
    i.priceId !== undefined && (i.priceId === cfg.starterExtraPriceId || i.priceId === cfg.proExtraPriceId);

  const extraItems = items.filter(isExtra);
  const baseItems = items.filter((i) => !isExtra(i));

  // Prefer the item that matches a known plan; otherwise fall back to the
  // first non-extra item so the amount is still recorded for an unrecognised price.
  const base = baseItems.find((i) => planForPriceId(i.priceId, cfg)) ?? baseItems[0];
  const planTier = planForPriceId(base?.priceId, cfg);

  const extrasConfigured = Boolean(cfg.starterExtraPriceId || cfg.proExtraPriceId);
  // An add-on with an unreadable quantity counts as none: never grant paid
  // locations from data we cannot interpret.
  const extraLocations = extrasConfigured ? extraItems.reduce((sum, i) => sum + (i.quantity ?? 0), 0) : null;

  // Total = base + extras, summed in minor units so no float drift, and only
  // when every contributing item is in the same currency.
  const billed = base ? [base, ...extraItems] : [];
  const currencies = new Set(billed.map((i) => i.currency));
  let amount: number | null = null;
  let currencyCode: string | undefined;
  if (billed.length > 0 && currencies.size === 1 && billed.every((i) => i.unitMinor !== null)) {
    currencyCode = billed[0].currency;
    // The base plan is quantity 1 by definition; extras use their own quantity.
    const totalMinor = billed.reduce(
      (sum, i) => sum + Number(i.unitMinor) * (i === base ? 1 : (i.quantity ?? 0)),
      0,
    );
    amount = paddleAmountToMajor(String(totalMinor), currencyCode);
  } else if (base) {
    currencyCode = base.currency;
  }

  return { planTier, extraLocations, amount, currencyCode };
}
