-- Paid extra locations: the plan includes ONE location; each additional
-- branch is a billed add-on (Paddle line item, quantity = extra_locations).
-- ============================================================================
-- Until now "+N BHD per extra location" was marketing copy only: nothing
-- billed it and nothing stopped a tenant from creating any number of rows in
-- `branches`. This adds
--   * platform_subscriptions.extra_locations - how many extra locations the
--     tenant pays for. Written ONLY by the service role (paddle-webhook and
--     paddle-manage-locations); a tenant admin cannot raise it themselves.
--   * tenant_location_limit() - included (1) + extra_locations, or NULL for
--     "no limit".
--   * a BEFORE INSERT trigger on branches enforcing that limit in the
--     database, so a direct PostgREST insert cannot bypass the UI.
--   * get_location_usage() - what the Branches page needs to explain the
--     limit, callable by the signed-in tenant member.
--
-- "No limit" (NULL) deliberately covers, mirroring how is_tenant_entitled()
-- grandfathers tenants with no subscription row (verified live in the
-- September audit: most tenants have none, and a "no row = limit 1" rule
-- would have frozen branch creation for the existing tenant base):
--   * no platform_subscriptions row at all,
--   * payment_provider = 'manual' (access granted by the platform owner from
--     /superadmin - there is no Paddle subscription to add a line item to),
--   * plan_tier 'enterprise' or 'demo'.
-- Existing branches are never removed or blocked: the trigger only gates
-- INSERT, so a tenant already over its limit simply cannot add more.

BEGIN;

ALTER TABLE public.platform_subscriptions
  ADD COLUMN IF NOT EXISTS extra_locations integer NOT NULL DEFAULT 0;

ALTER TABLE public.platform_subscriptions
  DROP CONSTRAINT IF EXISTS platform_subscriptions_extra_locations_range;
ALTER TABLE public.platform_subscriptions
  ADD CONSTRAINT platform_subscriptions_extra_locations_range
  CHECK (extra_locations BETWEEN 0 AND 50);

COMMENT ON COLUMN public.platform_subscriptions.extra_locations IS
  'Number of paid extra locations (beyond the one the plan includes). Mirrors the quantity of the extra-location line item on the Paddle subscription. Service-role writes only.';

-- --------------------------------------------------------------------------
-- Self-service guard: tenant admins may still cancel their own row, but must
-- not be able to ride that update to change extra_locations. This is the body
-- from 20261019090000_create_platform_admin_console.sql plus ONE line.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_platform_subscription_self_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Trusted server-side callers (service role key: paddle-webhook,
  -- paddle-manage-locations) are not restricted.
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
  NEW.extra_locations := OLD.extra_locations;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_platform_subscription_self_service() FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------------
-- The limit
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tenant_location_limit(p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sub public.platform_subscriptions;
BEGIN
  SELECT * INTO v_sub
  FROM public.platform_subscriptions
  WHERE tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN NULL; -- grandfathered / not tracked: no limit
  END IF;

  IF v_sub.payment_provider = 'manual' OR v_sub.plan_tier IN ('enterprise', 'demo') THEN
    RETURN NULL;
  END IF;

  RETURN 1 + v_sub.extra_locations;
END;
$$;

-- Internal: only the trigger and get_location_usage() (both SECURITY DEFINER)
-- call it. Default privileges grant to anon/authenticated directly, so revoke
-- them by name.
REVOKE ALL ON FUNCTION public.tenant_location_limit(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_branch_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_limit integer;
  v_used integer;
BEGIN
  v_limit := public.tenant_location_limit(NEW.tenant_id);
  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;

  -- Serialise concurrent inserts for the same tenant, otherwise two requests
  -- can both read "one slot left" and both succeed.
  PERFORM pg_advisory_xact_lock(hashtextextended('branch_limit:' || NEW.tenant_id::text, 0));

  SELECT count(*) INTO v_used FROM public.branches WHERE tenant_id = NEW.tenant_id;
  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'location_limit_reached'
      USING ERRCODE = 'LC001',
            DETAIL = format('used=%s limit=%s', v_used, v_limit),
            HINT = 'Add an extra location to your plan before creating another branch.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_branch_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS branches_enforce_limit ON public.branches;
CREATE TRIGGER branches_enforce_limit
  BEFORE INSERT ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_branch_limit();

-- --------------------------------------------------------------------------
-- What the Branches page and paddle-manage-locations read
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_location_usage()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
  v_sub public.platform_subscriptions;
BEGIN
  IF v_tenant IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_sub FROM public.platform_subscriptions WHERE tenant_id = v_tenant;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant,
    'used', (SELECT count(*) FROM public.branches WHERE tenant_id = v_tenant),
    'limit', public.tenant_location_limit(v_tenant),
    'extra_locations', COALESCE(v_sub.extra_locations, 0),
    'plan_tier', v_sub.plan_tier,
    'status', v_sub.status,
    'billing_provider', v_sub.payment_provider,
    'is_admin', public.has_tenant_role(v_tenant, 'admin')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_location_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_location_usage() TO authenticated;

COMMIT;
