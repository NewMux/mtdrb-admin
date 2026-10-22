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
