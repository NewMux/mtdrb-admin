-- Remove the free trial. The self-service trigger
-- (enforce_platform_subscription_self_service, most recently revised in
-- 20260909154849_prevent_trial_reset_abuse.sql) previously let a client
-- INSERT a status='trialing', amount=0 row directly. Subscribe.tsx no
-- longer does this -- every subscription, first one or a renewal, now
-- goes through the credimax-checkout Edge Function, which writes with
-- the service_role key.
--
-- This closes the same path at the database layer rather than relying
-- on the client change alone: a client can no longer INSERT a
-- platform_subscriptions row at all (any status), only cancel an
-- existing one via UPDATE. Everything else -- SELECT policies, the
-- INSERT/UPDATE RLS policies requiring an admin membership, the
-- Edge Functions' own service_role writes -- is untouched.
--
-- Tenants already mid-trial (status='trialing' with a trial_end in the
-- future) are not affected: is_tenant_entitled() and
-- isSubscriptionEntitled() both still honor an existing trialing row
-- until it expires. This migration only stops new trial rows from
-- being created; it does not retroactively cancel anyone.

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_platform_subscription_self_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Trusted server-side callers (service role key, used by
  -- credimax-checkout and credimax-webhook) are not restricted.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Self-service subscription creation is not available. Please complete checkout.';
  END IF;

  -- TG_OP = 'UPDATE': the only self-service action left is cancellation.
  IF NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Self-service updates may only cancel a subscription';
  END IF;

  IF NEW.amount <> OLD.amount THEN
    RAISE EXCEPTION 'Self-service updates may not change the charge amount';
  END IF;

  -- Never let a client-supplied value move these boundaries on cancel;
  -- access continues through the already-set current_period_end.
  NEW.trial_end := OLD.trial_end;
  NEW.current_period_end := OLD.current_period_end;
  NEW.plan_tier := OLD.plan_tier;

  RETURN NEW;
END;
$$;

COMMIT;
