-- Restrict self-service writes to platform_subscriptions
-- ============================================================================
-- The existing "Tenant admins can insert/update platform subscriptions"
-- policies let any tenant admin write ANY status/plan_tier/amount to their own
-- row via the normal client (anon/authenticated key), including "active" with
-- a paid plan_tier -- effectively granting themselves paid access without a
-- real charge ever happening. The RLS policies alone can't express "only allow
-- flipping between trial and cancelled, and never let amount become a client-
-- chosen nonzero value" because WITH CHECK cannot compare against the
-- pre-update row. A BEFORE INSERT/UPDATE trigger is used instead.
--
-- Server-side writes (a future payment webhook running with the service role
-- key) are trusted and bypass this trigger entirely, since only the service
-- role should ever be able to set status to 'active'/'past_due'/'failed' or
-- record a real charged amount.

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
    RETURN NEW;
  END IF;

  -- TG_OP = 'UPDATE'
  IF NEW.status NOT IN ('trialing', 'cancelled') THEN
    RAISE EXCEPTION 'Self-service updates may only start a trial or cancel a subscription';
  END IF;

  IF NEW.amount <> OLD.amount AND NEW.amount <> 0 THEN
    RAISE EXCEPTION 'Self-service updates may not set a new charge amount';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_subscriptions_self_service_guard ON public.platform_subscriptions;
CREATE TRIGGER platform_subscriptions_self_service_guard
  BEFORE INSERT OR UPDATE ON public.platform_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_platform_subscription_self_service();

COMMIT;
