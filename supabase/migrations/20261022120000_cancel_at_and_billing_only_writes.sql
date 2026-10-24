-- Cancel at the end of the billing period, through Paddle only.
-- ============================================================================
-- Until now "Cancel subscription" in Settings wrote status = 'cancelled'
-- straight to platform_subscriptions. That never told Paddle: the customer
-- kept being billed, the next Paddle webhook flipped the row back to 'active',
-- and meanwhile access was cut immediately because 'cancelled' is not
-- entitled - contradicting the modal's own "your access will continue until
-- the end of your current billing period".
--
-- The fix has two halves:
--   * platform_subscriptions.cancel_at: when a cancellation Paddle has
--     scheduled takes effect. The row stays status = 'active' (so access
--     continues, via is_tenant_entitled / current_period_end) until Paddle
--     sends subscription.canceled at that moment. Written only by the
--     service role: paddle-cancel-subscription and paddle-webhook.
--   * the self-service guard no longer lets a tenant admin write the row at
--     all. A client-side status flip can only ever desynchronise us from
--     Paddle, so cancellation goes through the Edge Function instead.
--     Server-side callers (service role) and the audited platform-owner RPCs
--     are unchanged.

BEGIN;

ALTER TABLE public.platform_subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at timestamptz;

COMMENT ON COLUMN public.platform_subscriptions.cancel_at IS
  'When a cancellation already scheduled in Paddle takes effect (end of the paid period). NULL = not cancelling. Access continues until then. Service-role writes only.';

-- Same shape as 20261022090000_add_extra_locations.sql, minus the
-- self-service cancel branch.
CREATE OR REPLACE FUNCTION public.enforce_platform_subscription_self_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Trusted server-side callers (service role key: paddle-webhook,
  -- paddle-manage-locations, paddle-cancel-subscription) are not restricted.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Audited platform-owner RPCs (platform_grant_access / platform_revoke_access).
  IF COALESCE(current_setting('app.platform_admin_write', true), '') = 'on'
     AND public.platform_admin_status() = 'ok' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Self-service subscription creation is not available. Please complete checkout.';
  END IF;

  RAISE EXCEPTION 'Subscription changes are made through billing, not by editing the plan directly. Use Cancel subscription in Settings.';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_platform_subscription_self_service() FROM PUBLIC, anon, authenticated;

COMMIT;
