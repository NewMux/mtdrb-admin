-- Close a trial-abuse gap in the self-service subscription trigger.
-- ============================================================================
-- enforce_platform_subscription_self_service (see
-- 20260823120000_restrict_platform_subscription_self_service.sql) already
-- stops a tenant admin from self-service-writing status='active' or a
-- nonzero amount. It did not constrain trial_end/current_period_end at
-- all, or plan_tier on update - the client (Subscribe.tsx) computes
-- trial_end itself and sends it directly. Two consequences:
--
--   1. A crafted request can set trial_end far in the future.
--   2. Re-running the same upsert (the app's own request shape, replayed)
--      resets trial_end to "now + 14 days" indefinitely - an unlimited
--      free trial, never actually converting to a paid subscription.
--
-- Fix: trial_end/current_period_end are computed server-side on every
-- self-service write and never taken from the client, and a tenant that
-- already has a trial_end set may not start a fresh self-service trial
-- (their own membership.status flow already never re-invokes this path
-- once a platform_subscriptions row exists - see Subscribe.tsx's
-- `if (subscription) { handleRealCheckout(...); return; }` - so this
-- only blocks a client bypassing that UI to call the upsert directly).

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_platform_subscription_self_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Trusted server-side callers (service role key) are not restricted.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'trialing' THEN
      RAISE EXCEPTION 'Self-service subscription creation may only start a trial';
    END IF;
    IF NEW.amount <> 0 THEN
      RAISE EXCEPTION 'Self-service trial subscriptions may not carry a charge amount';
    END IF;
    NEW.trial_end := now() + interval '14 days';
    NEW.current_period_end := NEW.trial_end;
    RETURN NEW;
  END IF;

  -- TG_OP = 'UPDATE'
  IF NEW.status NOT IN ('trialing', 'cancelled') THEN
    RAISE EXCEPTION 'Self-service updates may only start a trial or cancel a subscription';
  END IF;

  IF NEW.amount <> OLD.amount AND NEW.amount <> 0 THEN
    RAISE EXCEPTION 'Self-service updates may not set a new charge amount';
  END IF;

  IF NEW.status = 'trialing' THEN
    IF OLD.trial_end IS NOT NULL THEN
      RAISE EXCEPTION 'This tenant has already used its self-service trial';
    END IF;
    NEW.trial_end := now() + interval '14 days';
    NEW.current_period_end := NEW.trial_end;
  ELSE
    -- Cancelling: never let a client-supplied value move the period
    -- boundaries, whether starting or ending a trial.
    NEW.trial_end := OLD.trial_end;
    NEW.current_period_end := OLD.current_period_end;
  END IF;

  -- plan_tier is informational for a trial (which plan the tenant is
  -- trying), not itself a grant of paid access - amount stays enforced
  -- at 0 above regardless of which tier is chosen.

  RETURN NEW;
END;
$$;

COMMIT;
