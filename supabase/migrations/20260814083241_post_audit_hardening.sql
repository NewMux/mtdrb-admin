-- Post-audit hardening
-- Restores task policies in environments where the tasks table exists but its
-- original migration policies were not applied, and fixes mutable search paths
-- on application trigger functions.

BEGIN;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks for their tenant" ON public.tasks;
CREATE POLICY "Users can view tasks for their tenant"
  ON public.tasks FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert tasks for their tenant" ON public.tasks;
CREATE POLICY "Users can insert tasks for their tenant"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Users can update tasks for their tenant" ON public.tasks;
CREATE POLICY "Users can update tasks for their tenant"
  ON public.tasks FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "Users can delete tasks for their tenant" ON public.tasks;
CREATE POLICY "Users can delete tasks for their tenant"
  ON public.tasks FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tasks_updated_at();

CREATE OR REPLACE FUNCTION public.update_platform_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_subscriptions_updated_at ON public.platform_subscriptions;
CREATE TRIGGER platform_subscriptions_updated_at
  BEFORE UPDATE ON public.platform_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_subscriptions_updated_at();

COMMIT;
