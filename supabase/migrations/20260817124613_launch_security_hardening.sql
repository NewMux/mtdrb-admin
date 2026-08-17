-- MTDRB FIT launch security hardening
-- Removes the legacy user_metadata-based memberships policy and hardens
-- search_path handling for functions flagged by the Supabase security advisor.

BEGIN;

DROP POLICY IF EXISTS "Users can insert memberships for their tenant"
  ON public.memberships;
DROP POLICY IF EXISTS memberships_insert_admin
  ON public.memberships;

CREATE POLICY memberships_insert_admin
  ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.has_tenant_role(tenant_id, 'admin')
    AND role IN ('admin', 'employee', 'trainer')
  );

ALTER FUNCTION public.update_tasks_updated_at()
  SET search_path = '';
ALTER FUNCTION public.get_analytics_overview()
  SET search_path = '';
ALTER FUNCTION public.get_member_metrics(text)
  SET search_path = '';
ALTER FUNCTION public.get_trainer_metrics(text)
  SET search_path = '';
ALTER FUNCTION public.get_class_metrics(text)
  SET search_path = '';
ALTER FUNCTION public.get_financial_metrics(text)
  SET search_path = '';
ALTER FUNCTION public.calculate_vat_compliance_score(uuid)
  SET search_path = '';
ALTER FUNCTION public.generate_vat_return(uuid, date, date)
  SET search_path = '';

COMMIT;
