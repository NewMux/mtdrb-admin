-- Grace period for a failed renewal payment.
-- ============================================================================
-- A card that fails once is usually an expired or declined card, not a gym
-- that wants to leave: Paddle emails the customer and retries the charge for a
-- while (subscription status "past_due"). The webhook used to map past_due to
-- 'cancelled', so a single failed charge locked the gym out at once.
--
-- Now a past_due subscription keeps access until platform_subscriptions
-- .grace_until, a date the webhook sets when the subscription FIRST goes
-- past_due (now + 7 days) and keeps unchanged while it stays past_due. If the
-- payment recovers the status goes back to 'active' and grace_until is cleared;
-- if Paddle gives up it cancels the subscription, or the grace date passes -
-- either way access ends.
--
-- grace_until is service-role-only like every other column of this table (the
-- self-service guard rejects every browser write). The owner console's
-- platform_access_state() is unchanged: a gym inside its grace period shows
-- there as "inactive" even though it still has access.

BEGIN;

ALTER TABLE public.platform_subscriptions
  ADD COLUMN IF NOT EXISTS grace_until timestamptz;

COMMENT ON COLUMN public.platform_subscriptions.grace_until IS
  'While status = ''past_due'': access continues until this time. Set by paddle-webhook when a renewal payment first fails; NULL otherwise. Service-role writes only.';

-- Same body as 20260909154913_enforce_entitlement_on_writes.sql plus the
-- past_due branch. Keeps its existing grants (CREATE OR REPLACE).
CREATE OR REPLACE FUNCTION public.is_tenant_entitled(p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_status text;
  v_trial_end timestamptz;
  v_current_period_end timestamptz;
  v_grace_until timestamptz;
BEGIN
  SELECT status, trial_end, current_period_end, grace_until
    INTO v_status, v_trial_end, v_current_period_end, v_grace_until
  FROM public.platform_subscriptions
  WHERE tenant_id = p_tenant_id;

  -- No row on record: grandfathered/not yet tracked by the subscription
  -- system, not "expired" (see 20260909154913_enforce_entitlement_on_writes.sql).
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  IF v_status = 'active' THEN
    RETURN v_current_period_end IS NULL OR v_current_period_end > now();
  END IF;

  IF v_status = 'trialing' THEN
    RETURN v_trial_end IS NOT NULL AND v_trial_end > now();
  END IF;

  -- A failed renewal: keep access only inside the grace window.
  IF v_status = 'past_due' THEN
    RETURN v_grace_until IS NOT NULL AND v_grace_until > now();
  END IF;

  RETURN false;
END;
$$;

COMMIT;
