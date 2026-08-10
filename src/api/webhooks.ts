import { supabase } from "../supabaseClient";

export interface TapWebhookEvent {
  id: string;
  event: string;
  created: number;
  data: {
    id: string;
    status: string;
    term?: string;
    amount: number;
    currency: string;
    metadata: {
      tenant_id: string;
      plan_tier?: string;
      [key: string]: any;
    };
    charge?: {
      status: string;
      error?: {
        code: string;
        message: string;
      };
    };
    current_period_end?: number; // epoch timestamp
  };
}

/**
 * Handles incoming Tap Payments webhook events to synchronize platform-level subscriptions.
 * Using database state as the source of truth instead of client-side assumptions.
 */
export const handleTapWebhookEvent = async (payload: TapWebhookEvent) => {
  const { event, data } = payload;
  const tenantId = data.metadata?.tenant_id;

  if (!tenantId) {
    return { success: false, message: "No tenant_id specified in event metadata" };
  }

  // Fetch current platform subscription if it exists
  const { data: currentSub } = await supabase
    .from("platform_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const now = new Date().toISOString();
  let targetStatus = "active";
  const targetTier = data.metadata?.plan_tier || currentSub?.plan_tier || "starter";
  const targetAmount = data.amount;
  const targetPeriodEnd = data.current_period_end 
    ? new Date(data.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days

  switch (event) {
    case "charge.failed":
    case "subscription.charge_failed":
    case "subscription.failed": {
      // Failed payment retries check (Max 3 retries)
      const retryCount = (currentSub?.metadata?.retry_count || 0) + 1;
      const isLapsed = retryCount >= 3;
      targetStatus = isLapsed ? "failed" : "past_due";
      
      const { data: updatedSubFailed, error: errorFailed } = await supabase
        .from("platform_subscriptions")
        .upsert({
          tenant_id: tenantId,
          status: targetStatus,
          plan_tier: targetTier,
          amount: targetAmount,
          currency: data.currency || "AED",
          metadata: {
            ...currentSub?.metadata,
            last_failed_at: now,
            retry_count: retryCount,
            failure_reason: data.charge?.error?.message || "Payment declined",
            last_event: event
          },
          updated_at: now
        }, {
          onConflict: "tenant_id"
        })
        .select()
        .single();

      if (errorFailed) throw errorFailed;

      // Log subscription activity
      await logPlatformActivity(
        tenantId,
        "subscription",
        isLapsed ? "Subscription Lapsed" : "Payment Retry Failed",
        isLapsed 
          ? `Subscription payment failed after ${retryCount} attempts. Access revoked.`
          : `Subscription renewal payment failed (Attempt #${retryCount}). Retrying.`,
        "failed",
        { event, payload }
      );

      return { success: true, message: `Failed payment logged. Status: ${targetStatus}`, data: updatedSubFailed };
    }

    case "charge.succeeded":
    case "subscription.charge_succeeded": {
      // Reset retry count on success
      const { data: updatedSubSuccess, error: errorSuccess } = await supabase
        .from("platform_subscriptions")
        .upsert({
          tenant_id: tenantId,
          status: "active",
          plan_tier: targetTier,
          amount: targetAmount,
          currency: data.currency || "AED",
          current_period_end: targetPeriodEnd,
          metadata: {
            ...currentSub?.metadata,
            retry_count: 0,
            last_success_at: now,
            last_event: event
          },
          updated_at: now
        }, {
          onConflict: "tenant_id"
        })
        .select()
        .single();

      if (errorSuccess) throw errorSuccess;

      // Log subscription activity
      await logPlatformActivity(
        tenantId,
        "subscription",
        "Subscription Active",
        `Payment of ${targetAmount} ${data.currency} received successfully. Plan tier: ${targetTier}.`,
        "success",
        { event, payload }
      );

      return { success: true, message: "Payment succeeded logged.", data: updatedSubSuccess };
    }

    case "subscription.updated": {
      // Plan upgrade / downgrade proration handling
      const oldTier = currentSub?.plan_tier;
      const newTier = data.metadata?.plan_tier || targetTier;
      
      const upgradeMsg = oldTier && oldTier !== newTier
        ? `Subscription plan modified from ${oldTier} to ${newTier}. Prorated amount: ${targetAmount} ${data.currency}.`
        : `Subscription updated. Billing amount: ${targetAmount} ${data.currency}.`;

      const { data: updatedSubUpdate, error: errorUpdate } = await supabase
        .from("platform_subscriptions")
        .upsert({
          tenant_id: tenantId,
          status: data.status?.toLowerCase() === "active" || data.status?.toLowerCase() === "trial" ? "active" : "trialing",
          plan_tier: newTier,
          amount: targetAmount,
          currency: data.currency || "AED",
          current_period_end: targetPeriodEnd,
          metadata: {
            ...currentSub?.metadata,
            old_plan_tier: oldTier,
            proration_details: {
              amount: targetAmount,
              date: now
            },
            last_event: event
          },
          updated_at: now
        }, {
          onConflict: "tenant_id"
        })
        .select()
        .single();

      if (errorUpdate) throw errorUpdate;

      await logPlatformActivity(
        tenantId,
        "subscription",
        "Subscription Updated",
        upgradeMsg,
        "success",
        { event, oldTier, newTier, payload }
      );

      return { success: true, message: "Subscription update logged.", data: updatedSubUpdate };
    }

    case "subscription.cancelled":
    case "subscription.expired": {
      const targetStatusVal = event === "subscription.cancelled" ? "cancelled" : "expired";
      const { data: updatedSubCancel, error: errorCancel } = await supabase
        .from("platform_subscriptions")
        .upsert({
          tenant_id: tenantId,
          status: targetStatusVal,
          metadata: {
            ...currentSub?.metadata,
            cancelled_at: now,
            last_event: event
          },
          updated_at: now
        }, {
          onConflict: "tenant_id"
        })
        .select()
        .single();

      if (errorCancel) throw errorCancel;

      await logPlatformActivity(
        tenantId,
        "subscription",
        event === "subscription.cancelled" ? "Subscription Cancelled" : "Subscription Expired",
        "Subscription cancelled or expired. Access revoked.",
        "warning",
        { event, payload }
      );

      return { success: true, message: `Subscription ${targetStatusVal} logged.`, data: updatedSubCancel };
    }

    default:
      return { success: false, message: `Unhandled event type: ${event}` };
  }
};

const logPlatformActivity = async (
  tenantId: string,
  type: string,
  title: string,
  description: string,
  status: "success" | "pending" | "failed" | "warning",
  metadata?: any
) => {
  try {
    await supabase.from("activities").insert({
      tenant_id: tenantId,
      type,
      title,
      description,
      status: status === "warning" ? "pending" : status,
      metadata
    });
  } catch (err) {
    console.error("Failed to log platform activity:", err);
  }
};
