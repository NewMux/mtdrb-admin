// Client side of cancelling / keeping the platform subscription
// (supabase/functions/paddle-cancel-subscription). Cancelling is scheduled in
// Paddle for the end of the period already paid for; the gym keeps access until
// then. The Edge Function is the only thing that may change the subscription:
// the database rejects direct writes from the browser.

import { supabase } from "../supabaseClient";
import { functionErrorMessage } from "../utils/functionError";

export interface CancellationResult {
  /** When the cancellation takes effect (end of the paid period), or null if not cancelling / not known yet. */
  cancelAt: string | null;
  /** false if billing changed but our own record has not caught up yet (the webhook will). */
  synced: boolean;
}

export class BillingError extends Error {}

type FunctionsClient = {
  functions: {
    invoke: (name: string, options: { body: unknown }) => Promise<{ data: unknown; error: unknown }>;
  };
};

async function callCancelFunction(action: "cancel" | "resume"): Promise<CancellationResult> {
  const { data, error } = await (supabase as unknown as FunctionsClient).functions.invoke(
    "paddle-cancel-subscription",
    { body: { action } },
  );
  if (error) {
    throw new BillingError(
      await functionErrorMessage(error, {
        notDeployed: "Cancellation isn't available yet. Contact support.",
        unreachable: "Could not reach billing. Try again.",
      }),
    );
  }

  const body = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
  const cancelAt = body?.cancel_at;
  if (!body || !("cancel_at" in body) || (cancelAt !== null && typeof cancelAt !== "string")) {
    throw new BillingError("Billing returned an unexpected answer. Refresh to see your current plan.");
  }
  return { cancelAt: cancelAt as string | null, synced: body.synced !== false };
}

/** Schedules cancellation for the end of the paid period. Access continues until then. */
export const cancelSubscription = () => callCancelFunction("cancel");

/** Removes a scheduled cancellation ("keep my subscription"). */
export const resumeSubscription = () => callCancelFunction("resume");

// --- Moving from Starter to Pro (supabase/functions/paddle-change-plan) ------
// The gym keeps its subscription: billing swaps the plan on it and charges the
// prorated difference to the card on file straight away. The Edge Function
// decides everything (who may, which price, how much); nothing here is trusted.

export interface Money {
  amount: number;
  currency: string;
}

export interface UpgradePreview {
  /** Paid extra locations that move over to Pro unchanged. */
  extraLocations: number;
  /** Charged to the card today (prorated), or null if billing could not say. */
  chargeNow: Money | null;
  /** The new recurring price including extra locations (before tax), or null if unknown. */
  recurring: Money | null;
  nextBilledAt: string | null;
  /** Billing already has the gym on Pro: nothing to pay. */
  alreadyOnPro: boolean;
}

export interface UpgradeResult {
  extraLocations: number;
  /** false if billing changed but our own record has not caught up yet (the webhook will). */
  synced: boolean;
  alreadyOnPro: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readMoney(value: unknown): Money | null {
  if (!isRecord(value)) return null;
  const { amount, currency } = value;
  return typeof amount === "number" && Number.isFinite(amount) && amount >= 0 && typeof currency === "string"
    ? { amount, currency }
    : null;
}

async function callChangePlan(action: "preview" | "upgrade"): Promise<Record<string, unknown>> {
  const { data, error } = await (supabase as unknown as FunctionsClient).functions.invoke("paddle-change-plan", {
    body: { action },
  });
  if (error) {
    throw new BillingError(
      await functionErrorMessage(error, {
        notDeployed: "Upgrading isn't available yet. Contact support.",
        unreachable: "Could not reach billing. Try again.",
      }),
    );
  }
  const extraLocations = isRecord(data) ? data.extra_locations : null;
  if (!isRecord(data) || data.plan_tier !== "pro" || typeof extraLocations !== "number" || !Number.isInteger(extraLocations)) {
    throw new BillingError("Billing returned an unexpected answer. Refresh to see your current plan.");
  }
  return data;
}

/** What moving to Pro would cost, without changing or charging anything. */
export async function previewUpgradeToPro(): Promise<UpgradePreview> {
  const data = await callChangePlan("preview");
  return {
    extraLocations: data.extra_locations as number,
    chargeNow: readMoney(data.charge_now),
    recurring: readMoney(data.recurring),
    nextBilledAt: typeof data.next_billed_at === "string" ? data.next_billed_at : null,
    alreadyOnPro: data.already === true,
  };
}

/** Moves the gym to Pro and charges the prorated difference now. A declined card changes nothing. */
export async function upgradeToPro(): Promise<UpgradeResult> {
  const data = await callChangePlan("upgrade");
  return {
    extraLocations: data.extra_locations as number,
    synced: data.synced !== false,
    alreadyOnPro: data.already === true,
  };
}
