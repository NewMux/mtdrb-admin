// Demo-mode stand-ins for the platform plan: which plan the demo gym is on, the
// platform_subscriptions row Settings reads, and the paddle-change-plan Edge
// Function (Starter -> Pro). Only the dev mock backend imports this; the app's
// SubscriptionContext reads the same sessionStorage key on its own so no mock
// code reaches the production bundle (scripts/check-dist-no-mock.mjs).

import { PLATFORM_CURRENCY, SUBSCRIPTION_PLANS } from "../config/runtimeConfig";
import { DEMO_TENANT_ID } from "./demoData";

/** sessionStorage key shared with SubscriptionContext and the e2e helpers. */
export const DEMO_PLAN_KEY = "mtdrb.demoPlan";

const priceOf = (id: "starter" | "pro") => SUBSCRIPTION_PLANS.find((p) => p.id === id)?.price ?? 0;
const STARTER_PRICE = priceOf("starter");
const PRO_PRICE = priceOf("pro");

export function readDemoPlan(): string | null {
  try {
    return window.sessionStorage.getItem(DEMO_PLAN_KEY);
  } catch {
    return null;
  }
}

function writeDemoPlan(tier: string): void {
  try {
    window.sessionStorage.setItem(DEMO_PLAN_KEY, tier);
  } catch {
    // storage unavailable: the upgrade just won't stick across reloads
  }
}

/**
 * The gym's platform_subscriptions row, but only when a test (or you) picked a
 * self-service plan: with nothing set the demo gym has no row, as before.
 */
export function demoSubscriptionRows(): Record<string, unknown>[] {
  const tier = readDemoPlan();
  if (tier !== "starter" && tier !== "pro") return [];
  const created = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: "demo-platform-subscription",
      tenant_id: DEMO_TENANT_ID,
      status: "active",
      plan_tier: tier,
      amount: tier === "pro" ? PRO_PRICE : STARTER_PRICE,
      currency: PLATFORM_CURRENCY,
      created_at: created,
      trial_end: null,
      current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at: null,
      payment_provider: "paddle",
      extra_locations: 0,
    },
  ];
}

/** What paddle-change-plan answers, with a made-up but plausible proration. */
export function mockChangePlan(body: unknown): { data: unknown; error: unknown } {
  const action = typeof body === "object" && body !== null ? (body as { action?: unknown }).action : undefined;
  if (action !== "preview" && action !== "upgrade") return { data: null, error: new Error("Choose preview or upgrade.") };

  const tier = readDemoPlan();
  if (tier === "pro") return { data: { already: true, plan_tier: "pro", extra_locations: 0, synced: true }, error: null };
  if (tier !== "starter") return { data: null, error: new Error("The demo gym's plan is not billed through a subscription.") };

  if (action === "upgrade") {
    writeDemoPlan("pro");
    return { data: { plan_tier: "pro", extra_locations: 0, synced: true }, error: null };
  }
  return {
    data: {
      plan_tier: "pro",
      extra_locations: 0,
      // Half the period is left: half of the difference, as billing would prorate it.
      charge_now: { amount: (PRO_PRICE - STARTER_PRICE) / 2, currency: PLATFORM_CURRENCY },
      recurring: { amount: PRO_PRICE, currency: PLATFORM_CURRENCY },
      next_billed_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    error: null,
  };
}
