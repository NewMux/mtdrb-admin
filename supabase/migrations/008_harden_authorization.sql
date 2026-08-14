-- ============================================================================
-- MTDRB SECURITY MIGRATION 008
-- Harden tenant isolation, role enforcement, and security-definer functions.
--
-- Run after complete_schema_v2.sql and migrations/006_create_tasks_table.sql.
-- This migration intentionally removes direct client-side tenant creation and
-- membership grants. New organizations must be created through the RPC below.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Trusted authorization helpers
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.tenant_id
  FROM public.memberships AS m
  WHERE m.user_id = (SELECT auth.uid())
  ORDER BY m.created_at ASC, m.id ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(
  p_tenant_id uuid,
  p_required_role text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text;
  v_required_rank integer;
  v_role_rank integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR p_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  v_required_rank := CASE p_required_role
    WHEN 'trainer' THEN 1
    WHEN 'employee' THEN 2
    WHEN 'admin' THEN 3
    ELSE 99
  END;

  SELECT m.role
  INTO v_role
  FROM public.memberships AS m
  WHERE m.user_id = (SELECT auth.uid())
    AND m.tenant_id = p_tenant_id
  LIMIT 1;

  v_role_rank := CASE v_role
    WHEN 'trainer' THEN 1
    WHEN 'employee' THEN 2
    WHEN 'admin' THEN 3
    ELSE 0
  END;

  RETURN v_role_rank >= v_required_rank;
END;
$$;

-- A browser may create only its own first organization. The caller-supplied
-- role is retained for backwards-compatible RPC signatures but is ignored.
CREATE OR REPLACE FUNCTION public.create_tenant_with_membership(
  p_tenant_name text,
  p_user_role text DEFAULT 'admin',
  p_tenant_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid := (SELECT auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.memberships AS m
    WHERE m.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  IF p_tenant_name IS NULL OR length(trim(p_tenant_name)) = 0 OR length(p_tenant_name) > 160 THEN
    RAISE EXCEPTION 'A valid organization name is required';
  END IF;

  INSERT INTO public.tenants (name, metadata)
  VALUES (trim(p_tenant_name), COALESCE(p_tenant_metadata, '{}'::jsonb))
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.memberships (user_id, tenant_id, role)
  VALUES (v_user_id, v_tenant_id, 'admin');

  RETURN v_tenant_id;
END;
$$;

-- The full-name helpers are tenant-scoped before returning data.
CREATE OR REPLACE FUNCTION public.get_member_full_name(p_member_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT concat(m.first_name, ' ', m.last_name)
  FROM public.members AS m
  WHERE m.id = p_member_id
    AND m.tenant_id = public.get_user_tenant_id();
$$;

CREATE OR REPLACE FUNCTION public.get_trainer_full_name(p_trainer_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT concat(t.first_name, ' ', t.last_name)
  FROM public.trainers AS t
  WHERE t.id = p_trainer_id
    AND t.tenant_id = public.get_user_tenant_id();
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------------
-- Role-aware RLS policies
-- --------------------------------------------------------------------------

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

-- Drop the old permissive policies before recreating the complete policy set.
DO $$
DECLARE
  v_table text;
  v_policy record;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'tenants', 'memberships', 'gym_settings', 'branches', 'members',
    'trainers', 'plans', 'subscriptions', 'classes', 'trainer_schedule',
    'class_bookings', 'class_waitlist', 'invoices', 'expenses',
    'vat_returns', 'member_tasks', 'activities', 'health_check'
  ] LOOP
    FOR v_policy IN
      SELECT pol.polname
      FROM pg_policy AS pol
      JOIN pg_class AS cls ON cls.oid = pol.polrelid
      JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
      WHERE ns.nspname = 'public'
        AND cls.relname = v_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy.polname, v_table);
    END LOOP;
  END LOOP;
END;
$$;

-- Tenants are created only by create_tenant_with_membership().
CREATE POLICY tenants_select_same_tenant
  ON public.tenants FOR SELECT TO authenticated
  USING (id = public.get_user_tenant_id());

CREATE POLICY tenants_update_admin
  ON public.tenants FOR UPDATE TO authenticated
  USING (id = public.get_user_tenant_id() AND public.has_tenant_role(id, 'admin'))
  WITH CHECK (id = public.get_user_tenant_id() AND public.has_tenant_role(id, 'admin'));

-- Membership administration is admin-only and cannot grant a role above the
-- caller's own role. This prevents employee/trainer self-escalation.
CREATE POLICY memberships_select_same_tenant
  ON public.memberships FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY memberships_insert_admin
  ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'admin')
    AND role IN ('admin', 'employee', 'trainer')
  );

CREATE POLICY memberships_update_admin
  ON public.memberships FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'admin')
    AND role IN ('admin', 'employee', 'trainer')
  );

CREATE POLICY memberships_delete_admin
  ON public.memberships FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

-- Read access is tenant-scoped. Write access follows the UI's minimum role.
CREATE POLICY gym_settings_select_same_tenant
  ON public.gym_settings FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY gym_settings_insert_admin
  ON public.gym_settings FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));
CREATE POLICY gym_settings_update_admin
  ON public.gym_settings FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));
CREATE POLICY gym_settings_delete_admin
  ON public.gym_settings FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY branches_select_same_tenant
  ON public.branches FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY branches_insert_admin
  ON public.branches FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));
CREATE POLICY branches_update_admin
  ON public.branches FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));
CREATE POLICY branches_delete_admin
  ON public.branches FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY members_select_same_tenant
  ON public.members FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY members_insert_employee
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY members_update_employee
  ON public.members FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY members_delete_employee
  ON public.members FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

CREATE POLICY trainers_select_same_tenant
  ON public.trainers FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY trainers_insert_employee
  ON public.trainers FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY trainers_update_employee
  ON public.trainers FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY trainers_delete_employee
  ON public.trainers FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

CREATE POLICY plans_select_same_tenant
  ON public.plans FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY plans_insert_admin
  ON public.plans FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));
CREATE POLICY plans_update_admin
  ON public.plans FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));
CREATE POLICY plans_delete_admin
  ON public.plans FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY subscriptions_select_same_tenant
  ON public.subscriptions FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY subscriptions_insert_employee
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY subscriptions_update_employee
  ON public.subscriptions FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY subscriptions_delete_employee
  ON public.subscriptions FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

CREATE POLICY classes_select_same_tenant
  ON public.classes FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY classes_insert_trainer
  ON public.classes FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY classes_update_trainer
  ON public.classes FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY classes_delete_trainer
  ON public.classes FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));

CREATE POLICY trainer_schedule_select_same_tenant
  ON public.trainer_schedule FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY trainer_schedule_insert_trainer
  ON public.trainer_schedule FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY trainer_schedule_update_trainer
  ON public.trainer_schedule FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY trainer_schedule_delete_trainer
  ON public.trainer_schedule FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));

CREATE POLICY class_bookings_select_same_tenant
  ON public.class_bookings FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY class_bookings_insert_trainer
  ON public.class_bookings FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY class_bookings_update_trainer
  ON public.class_bookings FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY class_bookings_delete_trainer
  ON public.class_bookings FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));

CREATE POLICY class_waitlist_select_same_tenant
  ON public.class_waitlist FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY class_waitlist_insert_trainer
  ON public.class_waitlist FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY class_waitlist_update_trainer
  ON public.class_waitlist FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY class_waitlist_delete_trainer
  ON public.class_waitlist FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));

CREATE POLICY invoices_select_same_tenant
  ON public.invoices FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY invoices_insert_employee
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY invoices_update_employee
  ON public.invoices FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY invoices_delete_employee
  ON public.invoices FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

CREATE POLICY expenses_select_same_tenant
  ON public.expenses FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY expenses_insert_employee
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY expenses_update_employee
  ON public.expenses FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY expenses_delete_employee
  ON public.expenses FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

CREATE POLICY vat_returns_select_same_tenant
  ON public.vat_returns FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY vat_returns_insert_employee
  ON public.vat_returns FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY vat_returns_update_employee
  ON public.vat_returns FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY vat_returns_delete_employee
  ON public.vat_returns FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

CREATE POLICY member_tasks_select_same_tenant
  ON public.member_tasks FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY member_tasks_insert_trainer
  ON public.member_tasks FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY member_tasks_update_trainer
  ON public.member_tasks FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));
CREATE POLICY member_tasks_delete_trainer
  ON public.member_tasks FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'trainer'));

CREATE POLICY activities_select_same_tenant
  ON public.activities FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY activities_insert_same_tenant
  ON public.activities FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY health_check_select_authenticated
  ON public.health_check FOR SELECT TO authenticated
  USING (true);
CREATE POLICY health_check_service_role
  ON public.health_check FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- Tenant-safe RPCs
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_analytics_overview()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.get_user_tenant_id();
BEGIN
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'trainer') THEN
    RAISE EXCEPTION 'Tenant access denied';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_members', (SELECT count(*) FROM public.members WHERE tenant_id = v_tenant_id),
      'active_members', (SELECT count(*) FROM public.members WHERE tenant_id = v_tenant_id AND status = 'active'),
      'total_classes', (SELECT count(*) FROM public.classes WHERE tenant_id = v_tenant_id),
      'total_trainers', (SELECT count(*) FROM public.trainers WHERE tenant_id = v_tenant_id AND status = 'active'),
      'total_revenue', coalesce((SELECT sum(amount) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('paid', 'Paid')), 0),
      'pending_invoices', (SELECT count(*) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('pending', 'Unpaid', 'Partial'))
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_member_metrics(p_period text DEFAULT 'month')
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.get_user_tenant_id();
  v_start_date date;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'trainer') THEN
    RAISE EXCEPTION 'Tenant access denied';
  END IF;

  v_start_date := CASE p_period
    WHEN 'week' THEN current_date - interval '7 days'
    WHEN 'month' THEN current_date - interval '30 days'
    WHEN 'quarter' THEN current_date - interval '90 days'
    WHEN 'year' THEN current_date - interval '365 days'
    ELSE current_date - interval '30 days'
  END;

  RETURN (
    SELECT json_build_object(
      'total', (SELECT count(*) FROM public.members WHERE tenant_id = v_tenant_id),
      'new', (SELECT count(*) FROM public.members WHERE tenant_id = v_tenant_id AND created_at >= v_start_date),
      'active', (SELECT count(*) FROM public.members WHERE tenant_id = v_tenant_id AND status = 'active'),
      'inactive', (SELECT count(*) FROM public.members WHERE tenant_id = v_tenant_id AND status = 'inactive'),
      'growth_rate', 0
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_trainer_metrics(p_period text DEFAULT 'month')
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.get_user_tenant_id();
BEGIN
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'trainer') THEN
    RAISE EXCEPTION 'Tenant access denied';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total', (SELECT count(*) FROM public.trainers WHERE tenant_id = v_tenant_id),
      'active', (SELECT count(*) FROM public.trainers WHERE tenant_id = v_tenant_id AND status = 'active'),
      'avg_rating', coalesce((SELECT avg(rating) FROM public.trainers WHERE tenant_id = v_tenant_id AND rating IS NOT NULL), 0),
      'total_classes', (SELECT count(*) FROM public.classes WHERE tenant_id = v_tenant_id)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_class_metrics(p_period text DEFAULT 'month')
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.get_user_tenant_id();
  v_start_date date;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'trainer') THEN
    RAISE EXCEPTION 'Tenant access denied';
  END IF;

  v_start_date := CASE p_period
    WHEN 'week' THEN current_date - interval '7 days'
    WHEN 'month' THEN current_date - interval '30 days'
    WHEN 'quarter' THEN current_date - interval '90 days'
    WHEN 'year' THEN current_date - interval '365 days'
    ELSE current_date - interval '30 days'
  END;

  RETURN (
    SELECT json_build_object(
      'total', (SELECT count(*) FROM public.classes WHERE tenant_id = v_tenant_id),
      'upcoming', (SELECT count(*) FROM public.classes WHERE tenant_id = v_tenant_id AND start_time > now()),
      'completed', (SELECT count(*) FROM public.classes WHERE tenant_id = v_tenant_id AND end_time < now()),
      'total_bookings', (SELECT count(*) FROM public.class_bookings WHERE tenant_id = v_tenant_id AND created_at >= v_start_date),
      'avg_attendance', 0
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_financial_metrics(p_period text DEFAULT 'month')
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.get_user_tenant_id();
  v_start_date date;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'employee') THEN
    RAISE EXCEPTION 'Tenant access denied';
  END IF;

  v_start_date := CASE p_period
    WHEN 'week' THEN current_date - interval '7 days'
    WHEN 'month' THEN current_date - interval '30 days'
    WHEN 'quarter' THEN current_date - interval '90 days'
    WHEN 'year' THEN current_date - interval '365 days'
    ELSE current_date - interval '30 days'
  END;

  RETURN (
    SELECT json_build_object(
      'total_revenue', coalesce((SELECT sum(amount) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('paid', 'Paid') AND created_at >= v_start_date), 0),
      'total_expenses', coalesce((SELECT sum(amount) FROM public.expenses WHERE tenant_id = v_tenant_id AND status = 'approved' AND date >= v_start_date), 0),
      'pending_payments', coalesce((SELECT sum(amount) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('pending', 'Unpaid', 'Partial')), 0),
      'vat_collected', coalesce((SELECT sum(vat_total) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('paid', 'Paid') AND created_at >= v_start_date), 0),
      'vat_paid', coalesce((SELECT sum(vat_amount) FROM public.expenses WHERE tenant_id = v_tenant_id AND status = 'approved' AND date >= v_start_date), 0)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_vat_compliance_score(p_tenant_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_score numeric := 100;
  v_overdue_returns integer;
  v_missing_receipts integer;
BEGIN
  IF p_tenant_id IS NULL OR NOT public.has_tenant_role(p_tenant_id, 'employee') THEN
    RAISE EXCEPTION 'Tenant access denied';
  END IF;

  SELECT count(*) INTO v_overdue_returns
  FROM public.vat_returns
  WHERE tenant_id = p_tenant_id
    AND status = 'draft'
    AND filing_deadline < current_date;

  SELECT count(*) INTO v_missing_receipts
  FROM public.expenses
  WHERE tenant_id = p_tenant_id
    AND receipt_url IS NULL
    AND amount > 100;

  v_score := greatest(0, v_score - (v_overdue_returns * 10) - (v_missing_receipts * 2));
  RETURN v_score;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_vat_return(
  p_tenant_id uuid,
  p_period_start date,
  p_period_end date
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_vat_collected numeric;
  v_vat_paid numeric;
BEGIN
  IF p_tenant_id IS NULL
     OR p_period_start IS NULL
     OR p_period_end IS NULL
     OR p_period_end < p_period_start
     OR NOT public.has_tenant_role(p_tenant_id, 'employee') THEN
    RAISE EXCEPTION 'Invalid VAT request or tenant access denied';
  END IF;

  SELECT coalesce(sum(vat_total), 0) INTO v_vat_collected
  FROM public.invoices
  WHERE tenant_id = p_tenant_id
    AND status IN ('paid', 'Paid')
    AND created_at::date BETWEEN p_period_start AND p_period_end;

  SELECT coalesce(sum(vat_amount), 0) INTO v_vat_paid
  FROM public.expenses
  WHERE tenant_id = p_tenant_id
    AND status = 'approved'
    AND date BETWEEN p_period_start AND p_period_end;

  RETURN json_build_object(
    'period_start', p_period_start,
    'period_end', p_period_end,
    'vat_collected', v_vat_collected,
    'vat_paid', v_vat_paid,
    'net_vat_payable', v_vat_collected - v_vat_paid,
    'status', 'draft'
  );
END;
$$;

-- Only authenticated users may call application RPCs. Anonymous callers have
-- no access to tenant-derived helpers or financial functions.
REVOKE ALL ON FUNCTION public.get_user_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_tenant_with_membership(text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_member_full_name(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_trainer_full_name(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_analytics_overview() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_member_metrics(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_trainer_metrics(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_class_metrics(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_financial_metrics(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.calculate_vat_compliance_score(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_vat_return(uuid, date, date) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_with_membership(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_full_name(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trainer_full_name(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_metrics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trainer_metrics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_metrics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_metrics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_vat_compliance_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_vat_return(uuid, date, date) TO authenticated;

COMMIT;
