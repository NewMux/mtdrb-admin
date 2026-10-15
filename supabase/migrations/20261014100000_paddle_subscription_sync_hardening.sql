-- Harden Paddle subscription sync and fix entitlement edge cases
-- ============================================================================
-- Four problems with the Paddle integration as first shipped:
--
-- 1. Out-of-order / replayed webhooks. Paddle does not guarantee delivery
--    order, and paddle-webhook upserted every event unconditionally, so a
--    late-arriving older event (e.g. a past_due delivered after the
--    renewal's subscription.updated) overwrote newer state. Fix:
--    record_paddle_subscription_event() below stores the event's
--    occurred_at in provider_event_at and ignores anything not newer than
--    what is already applied for that subscription. That also makes a
--    replayed delivery a no-op.
--
-- 2. custom_data.tenant_id is set by the browser at checkout, so anyone
--    could start a Paddle subscription tagged with another tenant's id and
--    then cancel it, overwriting that tenant's real subscription row.
--    Fix: an event for a different Paddle subscription than the one on
--    record may only *activate* the row (a genuine resubscribe), never
--    downgrade it.
--
-- 3. Entitlement edge cases (AUDIT_2026-09.md MEDIUM backlog):
--    - status='active' with a NULL current_period_end was entitled
--      forever. That is still honored for manual/legacy grants
--      (payment_provider <> 'paddle', e.g. invite-only testers), but a
--      Paddle row must carry a real paid-through date -- the webhook
--      always sets one. Active rows also get two days' grace past
--      current_period_end so a renewal webhook arriving a little after the
--      period boundary doesn't lock the tenant out.
--    - a cancelled subscription lost access instantly, even though the
--      customer had paid through current_period_end. Cancelled rows now
--      stay entitled until current_period_end. Clients can no longer
--      write this table at all (point 4), so that date can only come
--      from the webhook or a service-role write.
--
-- 4. CancelSubscriptionModal set status='cancelled' straight from the
--    browser without ever telling Paddle, so Paddle kept charging the
--    customer and the next renewal webhook re-activated the row.
--    Cancellation now goes through the paddle-cancel-subscription Edge
--    Function (service role), so the self-service trigger rejects every
--    non-service-role write.
--
-- Also: amount was NUMERIC(10,2), which cannot hold a 3-decimal currency
-- such as BHD; widened to NUMERIC(12,3).
--
-- Not applied to the live project from the session that wrote this (no
-- database access there). Apply it, then confirm with a sandbox
-- subscription that paddle-webhook still returns 200 and updates the row.

BEGIN;

ALTER TABLE public.platform_subscriptions
  ALTER COLUMN amount TYPE NUMERIC(12, 3);

ALTER TABLE public.platform_subscriptions
  ADD COLUMN IF NOT EXISTS provider_event_at TIMESTAMPTZ;

COMMENT ON COLUMN public.platform_subscriptions.provider_event_at IS
  'occurred_at of the newest payment-provider webhook event applied to this row. Older or repeated events are ignored.';

COMMENT ON COLUMN public.platform_subscriptions.payment_provider IS
  'Which payment provider payment_reference belongs to: ''paddle'' for rows the Paddle webhook manages; anything else (e.g. ''manual'') is a grant made by hand.';

-- ----------------------------------------------------------------------------
-- Webhook write path
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_paddle_subscription_event(
  p_tenant_id uuid,
  p_subscription_id text,
  p_occurred_at timestamptz,
  p_status text,
  p_paddle_status text,
  p_plan_tier text,
  p_amount numeric,
  p_currency text,
  p_current_period_end timestamptz,
  p_trial_end timestamptz,
  p_scheduled_change jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing public.platform_subscriptions%ROWTYPE;
  v_metadata jsonb;
BEGIN
  IF p_tenant_id IS NULL OR p_subscription_id IS NULL OR p_occurred_at IS NULL THEN
    RAISE EXCEPTION 'tenant, subscription id and occurred_at are required';
  END IF;

  SELECT * INTO v_existing
  FROM public.platform_subscriptions
  WHERE tenant_id = p_tenant_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.payment_provider = 'paddle'
       AND v_existing.payment_reference IS NOT NULL
       AND v_existing.payment_reference <> p_subscription_id THEN
      -- A different Paddle subscription than the one on record. Allow it
      -- to take over only when it is live (a real resubscribe); never let
      -- it cancel or lapse the subscription on record.
      IF p_status NOT IN ('active', 'trialing') THEN
        RETURN 'ignored_other_subscription';
      END IF;
    ELSIF v_existing.provider_event_at IS NOT NULL
          AND p_occurred_at <= v_existing.provider_event_at THEN
      RETURN 'stale';
    END IF;

    v_metadata := COALESCE(v_existing.metadata, '{}'::jsonb);
  ELSE
    v_metadata := '{}'::jsonb;
  END IF;

  v_metadata := v_metadata || jsonb_build_object(
    'paddle_subscription_id', p_subscription_id,
    'paddle_status', p_paddle_status,
    'paddle_scheduled_change', p_scheduled_change
  );

  INSERT INTO public.platform_subscriptions AS s (
    tenant_id, status, plan_tier, amount, currency, trial_end,
    current_period_end, payment_provider, payment_reference,
    provider_event_at, metadata, updated_at
  )
  VALUES (
    p_tenant_id,
    p_status,
    COALESCE(p_plan_tier, 'starter'),
    COALESCE(p_amount, 0),
    COALESCE(p_currency, 'USD'),
    p_trial_end,
    p_current_period_end,
    'paddle',
    p_subscription_id,
    p_occurred_at,
    v_metadata,
    now()
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    status = EXCLUDED.status,
    plan_tier = COALESCE(p_plan_tier, s.plan_tier),
    amount = COALESCE(p_amount, s.amount),
    currency = COALESCE(p_currency, s.currency),
    trial_end = EXCLUDED.trial_end,
    current_period_end = EXCLUDED.current_period_end,
    payment_provider = 'paddle',
    payment_reference = EXCLUDED.payment_reference,
    provider_event_at = EXCLUDED.provider_event_at,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.record_paddle_subscription_event(
  uuid, text, timestamptz, text, text, text, numeric, text, timestamptz, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_paddle_subscription_event(
  uuid, text, timestamptz, text, text, text, numeric, text, timestamptz, timestamptz, jsonb
) TO service_role;

-- ----------------------------------------------------------------------------
-- Entitlement (kept identical to src/utils/subscriptionEntitlement.ts)
-- ----------------------------------------------------------------------------
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
  v_payment_provider text;
BEGIN
  SELECT status, trial_end, current_period_end, payment_provider
    INTO v_status, v_trial_end, v_current_period_end, v_payment_provider
  FROM public.platform_subscriptions
  WHERE tenant_id = p_tenant_id;

  -- No row on record: grandfathered/not yet tracked by the subscription
  -- system, not "expired" (see 20260909154913_enforce_entitlement_on_writes.sql).
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  IF v_status = 'active' THEN
    IF v_current_period_end IS NULL THEN
      -- Open-ended manual grant; a Paddle row always has a paid-through date.
      RETURN v_payment_provider IS DISTINCT FROM 'paddle';
    END IF;
    -- Two days' grace: Paddle renews at the period end and the
    -- subscription.updated carrying the next period can land a little
    -- later. A failed renewal flips the status to past_due instead.
    RETURN v_current_period_end + interval '2 days' > now();
  END IF;

  IF v_status = 'trialing' THEN
    RETURN v_trial_end IS NOT NULL AND v_trial_end > now();
  END IF;

  IF v_status = 'cancelled' THEN
    -- Already paid through this date; access ends then, not at cancel time.
    RETURN v_current_period_end IS NOT NULL AND v_current_period_end > now();
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_tenant_entitled(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_entitled(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- No client-side writes at all
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_platform_subscription_self_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Trusted server-side callers (paddle-webhook,
  -- paddle-cancel-subscription) use the service role key.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Self-service subscription creation is not available. Please complete checkout.';
  END IF;

  -- Cancellation used to be a direct client UPDATE, which never reached
  -- Paddle. It now goes through the paddle-cancel-subscription function.
  RAISE EXCEPTION 'Subscription changes must go through billing.';
END;
$$;

COMMIT;
