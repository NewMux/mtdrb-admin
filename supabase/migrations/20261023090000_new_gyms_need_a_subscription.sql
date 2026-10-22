-- Self-serve sign-up: a NEW gym with no subscription row is not entitled.
-- ============================================================================
-- is_tenant_entitled() has treated "no platform_subscriptions row" as entitled
-- since 20260909154913, because most gyms that existed when the subscription
-- system arrived have no row and a stricter rule would have locked them out
-- (see that migration). That was safe while sign-up was invite-only. With public
-- self-serve sign-up it is a hole: anyone can create an account and gym, never
-- reach checkout, and - because the browser redirect to /subscribe is only a UI
-- convenience - keep writing members, invoices, expenses and classes straight
-- through the API for free.
--
-- So the old "no row = entitled" rule is narrowed to gyms that actually are
-- legacy: those recorded in legacy_unbilled_tenants. This migration records
-- every gym that exists today, has no subscription row and was created before
-- 2026-09-09 (the day is_tenant_entitled() was introduced and the gyms without a
-- row were counted: 10 of 15). A gym created after that without a row signed up
-- and never paid, so it is not carried over. To grandfather another gym by
-- hand, insert its id into legacy_unbilled_tenants as the service role; to end
-- a grandfathering, delete the row (or give the gym a subscription row).
--
-- The legacy set is a separate table, not a column on tenants, on purpose:
-- tenant admins can update their own tenants row, and a flag they could set
-- themselves would defeat the point. The table has RLS on with no policy and no
-- grants to anon/authenticated; only the SECURITY DEFINER functions below read it.
--
-- tenant_location_limit() follows the same rule: a legacy gym with no row has no
-- location limit (unchanged); any other gym with no row is limited to the one
-- included location until it subscribes.

BEGIN;

CREATE TABLE IF NOT EXISTS public.legacy_unbilled_tenants (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.legacy_unbilled_tenants IS
  'Gyms that predate the subscription system and have no platform_subscriptions row. Only these keep access without a row (see is_tenant_entitled). Service role only.';

ALTER TABLE public.legacy_unbilled_tenants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.legacy_unbilled_tenants FROM PUBLIC, anon, authenticated;

INSERT INTO public.legacy_unbilled_tenants (tenant_id)
SELECT t.id
FROM public.tenants t
WHERE t.created_at < timestamptz '2026-09-09 00:00:00+00'
  AND NOT EXISTS (
    SELECT 1 FROM public.platform_subscriptions s WHERE s.tenant_id = t.id
  )
ON CONFLICT (tenant_id) DO NOTHING;

-- Same body as 20261022150000_past_due_grace.sql except for the no-row branch.
-- Keeps its existing grants (CREATE OR REPLACE).
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

  -- No row: only a gym that predates the subscription system keeps access. A
  -- gym that signed up since has not paid yet.
  IF NOT FOUND THEN
    RETURN EXISTS (
      SELECT 1 FROM public.legacy_unbilled_tenants WHERE tenant_id = p_tenant_id
    );
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

-- Same body as 20261022090000_add_extra_locations.sql except for the no-row branch.
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
    IF EXISTS (SELECT 1 FROM public.legacy_unbilled_tenants WHERE tenant_id = p_tenant_id)
       OR NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
      RETURN NULL; -- legacy gym not tracked by billing (or no such gym): no limit
    END IF;
    RETURN 1; -- new gym that has not subscribed: the one included location
  END IF;

  IF v_sub.payment_provider = 'manual' OR v_sub.plan_tier IN ('enterprise', 'demo') THEN
    RETURN NULL;
  END IF;

  RETURN 1 + v_sub.extra_locations;
END;
$$;

REVOKE ALL ON FUNCTION public.tenant_location_limit(uuid) FROM PUBLIC, anon, authenticated;

COMMIT;
