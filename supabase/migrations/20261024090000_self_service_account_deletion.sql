-- Self-service account and gym deletion (right to erasure).
-- ============================================================================
-- Until now only the platform owner could delete a gym or a user (the
-- platform_delete_* functions in 20261021150000). A gym in the EU or UK has a
-- legal right to have its account erased on request, so an admin can now do it
-- themselves, through the delete-account Edge Function:
--
--   account_delete_gym(user, confirm_name, billing_cancelled)
--       The caller is a gym ADMIN. Deletes the gym and everything in it, and the
--       accounts of staff who belong to no other gym. Refused while a Paddle
--       subscription is still live unless the function says it cancelled it
--       (otherwise the gym would keep being billed for something that no longer
--       exists).
--   account_delete_user(user, confirm_email)
--       Anyone else (staff leaving, or an account that never created a gym).
--       Their records are handed to the gym's longest-standing other admin.
--       A gym's only admin cannot leave this way; they delete the gym.
--
-- Both are callable by the service role ONLY: the Edge Function has already
-- resolved who the caller is from their JWT. Nothing here trusts a client value.
-- Neither is exposed to anon or authenticated (Supabase's default privileges
-- grant to them directly, so they are revoked by name).
--
-- The audit row recorded for the deletion keeps only internal ids, the date and
-- counts - no email and no gym name - so the log does not defeat the erasure.

BEGIN;

ALTER TABLE public.platform_audit_log DROP CONSTRAINT IF EXISTS platform_audit_log_action_check;
ALTER TABLE public.platform_audit_log ADD CONSTRAINT platform_audit_log_action_check
  CHECK (action IN (
    'grant_access', 'revoke_access', 'note',
    'suspend_gym', 'unsuspend_gym', 'delete_gym',
    'ban_user', 'unban_user', 'reset_mfa', 'change_role', 'delete_user',
    'create_gym',
    'self_delete_gym', 'self_delete_user'
  ));

CREATE OR REPLACE FUNCTION public.account_delete_gym(
  p_user_id uuid,
  p_confirm_name text,
  p_billing_cancelled boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid;
  v_name text;
  v_usage jsonb;
  v_user_ids uuid[];
BEGIN
  SELECT m.tenant_id INTO v_tenant
  FROM public.memberships AS m
  WHERE m.user_id = p_user_id AND m.role = 'admin'
  ORDER BY m.created_at ASC, m.id ASC
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only a gym admin can delete the gym' USING ERRCODE = '42501';
  END IF;

  SELECT t.name INTO v_name FROM public.tenants AS t WHERE t.id = v_tenant FOR UPDATE;

  IF p_confirm_name IS NULL OR btrim(p_confirm_name) <> v_name THEN
    RAISE EXCEPTION 'The confirmation name does not match this gym' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.memberships AS m
    JOIN public.platform_admins AS pa ON pa.user_id = m.user_id
    WHERE m.tenant_id = v_tenant
  ) THEN
    RAISE EXCEPTION 'A gym that contains a platform admin cannot be deleted' USING ERRCODE = '55000';
  END IF;

  IF NOT COALESCE(p_billing_cancelled, false) AND EXISTS (
    SELECT 1 FROM public.platform_subscriptions AS ps
    WHERE ps.tenant_id = v_tenant
      AND ps.payment_provider = 'paddle'
      AND ps.status IN ('active', 'trialing', 'past_due')
  ) THEN
    RAISE EXCEPTION 'Cancel this gym''s subscription before deleting it' USING ERRCODE = '55000';
  END IF;

  -- Counts only, for the audit row.
  v_usage := jsonb_build_object(
    'staff', (SELECT count(*) FROM public.memberships AS m WHERE m.tenant_id = v_tenant),
    'members', (SELECT count(*) FROM public.members AS m WHERE m.tenant_id = v_tenant),
    'invoices', (SELECT count(*) FROM public.invoices AS i WHERE i.tenant_id = v_tenant)
  );

  -- Staff who belong to no other gym lose their account with the gym.
  v_user_ids := ARRAY(
    SELECT m.user_id FROM public.memberships AS m
    WHERE m.tenant_id = v_tenant
      AND NOT EXISTS (
        SELECT 1 FROM public.memberships AS m2
        WHERE m2.user_id = m.user_id AND m2.tenant_id <> v_tenant
      )
  );

  -- pos_returns / pos_return_items reference sales and sale items with
  -- ON DELETE RESTRICT; remove them first so the delete never depends on the
  -- order Postgres happens to cascade in.
  DELETE FROM public.pos_return_items WHERE tenant_id = v_tenant;
  DELETE FROM public.pos_returns WHERE tenant_id = v_tenant;

  DELETE FROM public.tenants WHERE id = v_tenant;
  DELETE FROM auth.users WHERE id = ANY (v_user_ids);

  INSERT INTO public.platform_audit_log (actor_id, actor_email, action, tenant_id, tenant_name, details)
  VALUES (
    p_user_id, NULL, 'self_delete_gym', v_tenant, NULL,
    jsonb_build_object('usage', v_usage, 'deleted_users', COALESCE(cardinality(v_user_ids), 0))
  );

  RETURN jsonb_build_object(
    'tenant_id', v_tenant,
    'deleted', true,
    'deleted_users', COALESCE(cardinality(v_user_ids), 0),
    'deleted_user_ids', to_jsonb(v_user_ids)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.account_delete_user(
  p_user_id uuid,
  p_confirm_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text;
  r record;
  v_repl uuid;
  v_tenant uuid;
  v_blocking integer;
  v_reassigned integer := 0;
  n integer;
BEGIN
  SELECT u.email::text INTO v_email FROM auth.users AS u WHERE u.id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_confirm_email IS NULL OR lower(btrim(p_confirm_email)) <> lower(v_email) THEN
    RAISE EXCEPTION 'The confirmation email does not match this account' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.platform_admins AS pa WHERE pa.user_id = p_user_id) THEN
    RAISE EXCEPTION 'A platform admin account cannot be deleted here' USING ERRCODE = '55000';
  END IF;

  FOR r IN
    SELECT m.tenant_id, m.role FROM public.memberships AS m WHERE m.user_id = p_user_id
  LOOP
    v_tenant := r.tenant_id;

    SELECT m2.user_id INTO v_repl
    FROM public.memberships AS m2
    WHERE m2.tenant_id = r.tenant_id AND m2.role = 'admin' AND m2.user_id <> p_user_id
    ORDER BY m2.created_at ASC, m2.id ASC
    LIMIT 1;

    IF v_repl IS NULL THEN
      IF r.role = 'admin' THEN
        RAISE EXCEPTION 'You are the only admin of this gym. Delete the gym instead, or make someone else an admin first'
          USING ERRCODE = '55000';
      END IF;

      SELECT (SELECT count(*) FROM public.member_tasks WHERE tenant_id = r.tenant_id AND created_by = p_user_id)
           + (SELECT count(*) FROM public.pos_sales WHERE tenant_id = r.tenant_id AND cashier_id = p_user_id)
           + (SELECT count(*) FROM public.pos_returns WHERE tenant_id = r.tenant_id AND cashier_id = p_user_id)
           + (SELECT count(*) FROM public.pos_stock_movements WHERE tenant_id = r.tenant_id AND created_by = p_user_id)
        INTO v_blocking;
      IF v_blocking > 0 THEN
        RAISE EXCEPTION 'This account has records in a gym with no other admin to take them over'
          USING ERRCODE = '55000';
      END IF;
      CONTINUE;
    END IF;

    UPDATE public.member_tasks SET created_by = v_repl WHERE tenant_id = r.tenant_id AND created_by = p_user_id;
    GET DIAGNOSTICS n = ROW_COUNT; v_reassigned := v_reassigned + n;
    UPDATE public.pos_sales SET cashier_id = v_repl WHERE tenant_id = r.tenant_id AND cashier_id = p_user_id;
    GET DIAGNOSTICS n = ROW_COUNT; v_reassigned := v_reassigned + n;
    UPDATE public.pos_returns SET cashier_id = v_repl WHERE tenant_id = r.tenant_id AND cashier_id = p_user_id;
    GET DIAGNOSTICS n = ROW_COUNT; v_reassigned := v_reassigned + n;
    UPDATE public.pos_stock_movements SET created_by = v_repl WHERE tenant_id = r.tenant_id AND created_by = p_user_id;
    GET DIAGNOSTICS n = ROW_COUNT; v_reassigned := v_reassigned + n;
  END LOOP;

  DELETE FROM auth.users WHERE id = p_user_id;

  INSERT INTO public.platform_audit_log (actor_id, actor_email, action, tenant_id, tenant_name, details)
  VALUES (
    p_user_id, NULL, 'self_delete_user', v_tenant, NULL,
    jsonb_build_object('reassigned', v_reassigned)
  );

  RETURN jsonb_build_object('user_id', p_user_id, 'deleted', true, 'reassigned', v_reassigned);
END;
$$;

REVOKE ALL ON FUNCTION public.account_delete_gym(uuid, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.account_delete_user(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_delete_gym(uuid, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.account_delete_user(uuid, text) TO service_role;

COMMIT;
