-- Enforce subscription entitlement server-side on writes to the
-- revenue-generating tables.
-- ============================================================================
-- Until now, `platform_subscriptions.status` was never referenced by any
-- RLS policy. The only thing stopping an expired or cancelled tenant from
-- continuing to read/write members, invoices, expenses, and classes was a
-- client-side redirect to /subscribe in AuthProvider.tsx - trivially
-- bypassed with a valid JWT and a direct PostgREST request.
--
-- This adds public.is_tenant_entitled(), mirroring the exact logic already
-- used client-side (src/utils/subscriptionEntitlement.ts) so the two never
-- disagree, and requires it on INSERT/UPDATE for the tables that actually
-- generate revenue or hold data a paid plan gates. SELECT is left alone
-- deliberately: a lapsed tenant should stay able to see their own
-- historical data (export it, hand it to a new provider, etc.), just not
-- keep operating for free.
--
-- IMPORTANT, verified directly against the live project before writing
-- this: 10 of 15 existing tenants have NO platform_subscriptions row at
-- all (the subscription system is newer than the tenant base and was
-- never backfilled). A naive "no row = not entitled" would have locked
-- most of the live tenant base out of creating or updating their own
-- members/invoices/expenses/classes the moment this migration applied -
-- a severe regression, not a fix. is_tenant_entitled() below therefore
-- treats "no subscription row" as entitled (grandfathered/not yet
-- tracked) and only denies a tenant that has a row on record showing
-- its trial or paid period has actually lapsed. This closes the real
-- gap (an expired/cancelled tenant keeps writing indefinitely) without
-- touching tenants the subscription system was never wired up for.

BEGIN;

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
BEGIN
  SELECT status, trial_end, current_period_end
    INTO v_status, v_trial_end, v_current_period_end
  FROM public.platform_subscriptions
  WHERE tenant_id = p_tenant_id;

  -- No row on record: grandfathered/not yet tracked by the subscription
  -- system, not "expired". See the migration header for why this must
  -- not default to false.
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  IF v_status = 'active' THEN
    RETURN v_current_period_end IS NULL OR v_current_period_end > now();
  END IF;

  IF v_status = 'trialing' THEN
    RETURN v_trial_end IS NOT NULL AND v_trial_end > now();
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_tenant_entitled(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_entitled(uuid) TO authenticated;

-- members
DROP POLICY IF EXISTS members_insert_employee ON public.members;
CREATE POLICY members_insert_employee
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'employee')
    AND public.is_tenant_entitled(tenant_id)
  );

DROP POLICY IF EXISTS members_update_employee ON public.members;
CREATE POLICY members_update_employee
  ON public.members FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'employee')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'employee')
    AND public.is_tenant_entitled(tenant_id)
  );

-- invoices
DROP POLICY IF EXISTS invoices_insert_employee ON public.invoices;
CREATE POLICY invoices_insert_employee
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'employee')
    AND public.is_tenant_entitled(tenant_id)
  );

DROP POLICY IF EXISTS invoices_update_employee ON public.invoices;
CREATE POLICY invoices_update_employee
  ON public.invoices FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'employee')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'employee')
    AND public.is_tenant_entitled(tenant_id)
  );

-- expenses
DROP POLICY IF EXISTS expenses_insert_employee ON public.expenses;
CREATE POLICY expenses_insert_employee
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'employee')
    AND public.is_tenant_entitled(tenant_id)
  );

DROP POLICY IF EXISTS expenses_update_employee ON public.expenses;
CREATE POLICY expenses_update_employee
  ON public.expenses FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'employee')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'employee')
    AND public.is_tenant_entitled(tenant_id)
  );

-- classes
DROP POLICY IF EXISTS classes_insert_trainer ON public.classes;
CREATE POLICY classes_insert_trainer
  ON public.classes FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'trainer')
    AND public.is_tenant_entitled(tenant_id)
  );

DROP POLICY IF EXISTS classes_update_trainer ON public.classes;
CREATE POLICY classes_update_trainer
  ON public.classes FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'trainer')
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'trainer')
    AND public.is_tenant_entitled(tenant_id)
  );

COMMIT;
