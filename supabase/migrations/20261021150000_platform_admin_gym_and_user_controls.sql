-- Platform-owner controls: suspend / delete gyms and manage their users.
-- ============================================================================
-- Extends 20261019090000_create_platform_admin_console.sql. Same rules apply
-- (see the header there) and are not weakened:
--   * Every RPC starts with require_platform_admin() (allowlist + aal2 + a
--     verified factor + a live aal2 session). Authorisation lives HERE.
--   * Account-level only: nothing here reads member, invoice or financial
--     rows. Usage COUNTS are recorded in the audit log, never row contents.
--   * Every mutation writes platform_audit_log in the same transaction.
--   * Supabase default privileges grant EXECUTE on new public functions and
--     privileges on new tables directly to anon/authenticated, so every new
--     object is revoked explicitly before any intended grant.
--
-- Guard rails shared by the user/gym actions:
--   * A platform admin can never be banned, deleted, MFA-reset or re-roled
--     through these RPCs, and nobody can act on their own account. (Lost owner
--     authenticator: use the SQL recovery in DEPLOYMENT.md.)
--   * Destructive actions need a reason and a typed confirmation that the
--     database itself checks (gym name / user email), not just the UI.
--
-- Known limit: banning a user stops sign-in and refresh immediately (their
-- sessions are deleted), but an access token already issued stays valid until
-- it expires (Supabase default: 1 hour). Suspension is therefore "effective
-- within the JWT lifetime", not instantaneous.

BEGIN;

-- --------------------------------------------------------------------------
-- 1. New audit actions
-- --------------------------------------------------------------------------
ALTER TABLE public.platform_audit_log DROP CONSTRAINT IF EXISTS platform_audit_log_action_check;
ALTER TABLE public.platform_audit_log ADD CONSTRAINT platform_audit_log_action_check
  CHECK (action IN (
    'grant_access', 'revoke_access', 'note',
    'suspend_gym', 'unsuspend_gym', 'delete_gym',
    'ban_user', 'unban_user', 'reset_mfa', 'change_role', 'delete_user'
  ));

-- --------------------------------------------------------------------------
-- 2. Suspension state
-- --------------------------------------------------------------------------
-- Its own table (never platform_subscriptions.metadata: the Paddle webhook
-- replaces that object on every event). banned_user_ids remembers exactly who
-- THIS suspension banned, so unsuspending never lifts a ban placed for some
-- other reason.
CREATE TABLE IF NOT EXISTS public.platform_suspensions (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  suspended_at timestamptz NOT NULL DEFAULT now(),
  suspended_by uuid NOT NULL,
  reason text NOT NULL,
  banned_user_ids uuid[] NOT NULL DEFAULT '{}'
);
ALTER TABLE public.platform_suspensions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_suspensions FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------------
-- 3. Internal helpers (no client grants)
-- --------------------------------------------------------------------------
-- Returns the user's email, or raises. Refuses platform admins and the caller.
CREATE OR REPLACE FUNCTION public.platform_assert_manageable_user(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT u.email::text INTO v_email FROM auth.users AS u WHERE u.id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;
  IF p_user_id = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'You cannot change your own account here' USING ERRCODE = '55000';
  END IF;
  IF EXISTS (SELECT 1 FROM public.platform_admins AS pa WHERE pa.user_id = p_user_id) THEN
    RAISE EXCEPTION 'Platform admins cannot be changed here' USING ERRCODE = '55000';
  END IF;
  RETURN v_email;
END;
$$;

-- The user's only gym, or NULL if they have none or several (used to attach
-- the audit row to a gym).
CREATE OR REPLACE FUNCTION public.platform_user_single_tenant(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE WHEN count(*) = 1 THEN (array_agg(m.tenant_id))[1] END
  FROM public.memberships AS m
  WHERE m.user_id = p_user_id;
$$;

-- --------------------------------------------------------------------------
-- 4. Gym RPCs
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.platform_suspend_gym(p_tenant_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_name text;
  v_staff integer;
  v_ids uuid[];
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;

  SELECT t.name INTO v_name FROM public.tenants AS t WHERE t.id = p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (SELECT 1 FROM public.platform_suspensions AS s WHERE s.tenant_id = p_tenant_id) THEN
    RAISE EXCEPTION 'This gym is already suspended' USING ERRCODE = '55000';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.memberships AS m
    JOIN public.platform_admins AS pa ON pa.user_id = m.user_id
    WHERE m.tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'A gym that contains a platform admin cannot be suspended' USING ERRCODE = '55000';
  END IF;

  SELECT count(*) INTO v_staff FROM public.memberships AS m WHERE m.tenant_id = p_tenant_id;

  -- Ban only people who belong to no other gym and are not already banned.
  v_ids := ARRAY(
    SELECT m.user_id
    FROM public.memberships AS m
    JOIN auth.users AS u ON u.id = m.user_id
    WHERE m.tenant_id = p_tenant_id
      AND NOT EXISTS (
        SELECT 1 FROM public.memberships AS m2
        WHERE m2.user_id = m.user_id AND m2.tenant_id <> p_tenant_id
      )
      AND (u.banned_until IS NULL OR u.banned_until <= now())
  );

  UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id = ANY (v_ids);
  DELETE FROM auth.sessions WHERE user_id = ANY (v_ids);

  INSERT INTO public.platform_suspensions (tenant_id, suspended_by, reason, banned_user_ids)
  VALUES (p_tenant_id, (SELECT auth.uid()), v_reason, v_ids);

  PERFORM public.platform_write_audit(
    'suspend_gym', p_tenant_id, v_name,
    jsonb_build_object(
      'reason', v_reason,
      'staff', v_staff,
      'banned_users', COALESCE(cardinality(v_ids), 0),
      'not_banned_users', v_staff - COALESCE(cardinality(v_ids), 0)
    )
  );

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'suspended', true,
    'staff', v_staff,
    'banned_users', COALESCE(cardinality(v_ids), 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_unsuspend_gym(p_tenant_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_name text;
  v_susp public.platform_suspensions;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;

  SELECT t.name INTO v_name FROM public.tenants AS t WHERE t.id = p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_susp FROM public.platform_suspensions AS s WHERE s.tenant_id = p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This gym is not suspended' USING ERRCODE = '55000';
  END IF;

  UPDATE auth.users SET banned_until = NULL WHERE id = ANY (v_susp.banned_user_ids);
  DELETE FROM public.platform_suspensions WHERE tenant_id = p_tenant_id;

  PERFORM public.platform_write_audit(
    'unsuspend_gym', p_tenant_id, v_name,
    jsonb_build_object(
      'reason', v_reason,
      'unbanned_users', COALESCE(cardinality(v_susp.banned_user_ids), 0),
      'suspended_since', v_susp.suspended_at
    )
  );

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'suspended', false,
    'unbanned_users', COALESCE(cardinality(v_susp.banned_user_ids), 0)
  );
END;
$$;

-- Permanent. The caller must type the gym's exact name. Staff who belong to no
-- other gym are deleted only when p_delete_users is true; everyone else keeps
-- their account (they simply lose this gym).
CREATE OR REPLACE FUNCTION public.platform_delete_gym(
  p_tenant_id uuid,
  p_confirm_name text,
  p_reason text,
  p_delete_users boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_name text;
  v_usage jsonb;
  v_user_ids uuid[];
  v_emails text[];
  v_deleted_emails text[] := '{}';
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;

  SELECT t.name INTO v_name FROM public.tenants AS t WHERE t.id = p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_confirm_name IS NULL OR btrim(p_confirm_name) <> v_name THEN
    RAISE EXCEPTION 'The confirmation name does not match this gym' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.memberships AS m
    JOIN public.platform_admins AS pa ON pa.user_id = m.user_id
    WHERE m.tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'A gym that contains a platform admin cannot be deleted' USING ERRCODE = '55000';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.platform_subscriptions AS ps
    WHERE ps.tenant_id = p_tenant_id
      AND ps.payment_provider = 'paddle'
      AND ps.status IN ('active', 'trialing', 'past_due')
  ) THEN
    RAISE EXCEPTION 'Cancel this gym''s Paddle subscription before deleting it' USING ERRCODE = '55000';
  END IF;

  -- Counts only (account-level), recorded in the audit log.
  v_usage := jsonb_build_object(
    'staff', (SELECT count(*) FROM public.memberships AS m WHERE m.tenant_id = p_tenant_id),
    'members', (SELECT count(*) FROM public.members AS m WHERE m.tenant_id = p_tenant_id),
    'trainers', (SELECT count(*) FROM public.trainers AS tr WHERE tr.tenant_id = p_tenant_id),
    'branches', (SELECT count(*) FROM public.branches AS br WHERE br.tenant_id = p_tenant_id),
    'classes', (SELECT count(*) FROM public.classes AS c WHERE c.tenant_id = p_tenant_id)
  );

  -- Staff who belong to no other gym (candidates for deletion).
  v_user_ids := ARRAY(
    SELECT m.user_id FROM public.memberships AS m
    WHERE m.tenant_id = p_tenant_id
      AND NOT EXISTS (
        SELECT 1 FROM public.memberships AS m2
        WHERE m2.user_id = m.user_id AND m2.tenant_id <> p_tenant_id
      )
  );
  v_emails := ARRAY(
    SELECT u.email::text FROM auth.users AS u WHERE u.id = ANY (v_user_ids) ORDER BY u.email
  );

  -- pos_returns / pos_return_items reference sales and sale items with
  -- ON DELETE RESTRICT; remove them first so the delete never depends on the
  -- order Postgres happens to cascade in.
  DELETE FROM public.pos_return_items WHERE tenant_id = p_tenant_id;
  DELETE FROM public.pos_returns WHERE tenant_id = p_tenant_id;

  DELETE FROM public.tenants WHERE id = p_tenant_id;

  IF p_delete_users AND COALESCE(cardinality(v_user_ids), 0) > 0 THEN
    DELETE FROM auth.users WHERE id = ANY (v_user_ids);
    v_deleted_emails := v_emails;
  END IF;

  PERFORM public.platform_write_audit(
    'delete_gym', p_tenant_id, v_name,
    jsonb_build_object(
      'reason', v_reason,
      'usage', v_usage,
      'deleted_users', to_jsonb(v_deleted_emails),
      'kept_users', (v_usage ->> 'staff')::integer - COALESCE(cardinality(v_deleted_emails), 0)
    )
  );

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'deleted', true,
    'deleted_users', COALESCE(cardinality(v_deleted_emails), 0)
  );
END;
$$;

-- --------------------------------------------------------------------------
-- 5. User RPCs
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.platform_ban_user(p_user_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_email text;
  v_tenant uuid;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;

  v_email := public.platform_assert_manageable_user(p_user_id);

  IF EXISTS (SELECT 1 FROM auth.users AS u WHERE u.id = p_user_id AND u.banned_until > now()) THEN
    RAISE EXCEPTION 'This user is already banned' USING ERRCODE = '55000';
  END IF;

  UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id = p_user_id;
  DELETE FROM auth.sessions WHERE user_id = p_user_id;

  v_tenant := public.platform_user_single_tenant(p_user_id);
  PERFORM public.platform_write_audit(
    'ban_user', v_tenant, (SELECT t.name FROM public.tenants AS t WHERE t.id = v_tenant),
    jsonb_build_object('reason', v_reason, 'user_id', p_user_id, 'email', v_email)
  );

  RETURN jsonb_build_object('user_id', p_user_id, 'banned', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_unban_user(p_user_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_email text;
  v_tenant uuid;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;

  v_email := public.platform_assert_manageable_user(p_user_id);

  IF NOT EXISTS (SELECT 1 FROM auth.users AS u WHERE u.id = p_user_id AND u.banned_until > now()) THEN
    RAISE EXCEPTION 'This user is not banned' USING ERRCODE = '55000';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.memberships AS m
    JOIN public.platform_suspensions AS s ON s.tenant_id = m.tenant_id
    WHERE m.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'This user''s gym is suspended; unsuspend the gym instead' USING ERRCODE = '55000';
  END IF;

  UPDATE auth.users SET banned_until = NULL WHERE id = p_user_id;

  v_tenant := public.platform_user_single_tenant(p_user_id);
  PERFORM public.platform_write_audit(
    'unban_user', v_tenant, (SELECT t.name FROM public.tenants AS t WHERE t.id = v_tenant),
    jsonb_build_object('reason', v_reason, 'user_id', p_user_id, 'email', v_email)
  );

  RETURN jsonb_build_object('user_id', p_user_id, 'banned', false);
END;
$$;

-- Removes every MFA factor and signs the user out everywhere, so they must
-- sign in again and enrol a new authenticator. For a lost phone.
CREATE OR REPLACE FUNCTION public.platform_reset_user_mfa(p_user_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_email text;
  v_tenant uuid;
  v_factors integer;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;

  v_email := public.platform_assert_manageable_user(p_user_id);

  SELECT count(*) INTO v_factors FROM auth.mfa_factors AS f WHERE f.user_id = p_user_id;
  IF v_factors = 0 THEN
    RAISE EXCEPTION 'This user has no MFA factors to reset' USING ERRCODE = '55000';
  END IF;

  DELETE FROM auth.mfa_factors WHERE user_id = p_user_id;
  DELETE FROM auth.sessions WHERE user_id = p_user_id;

  v_tenant := public.platform_user_single_tenant(p_user_id);
  PERFORM public.platform_write_audit(
    'reset_mfa', v_tenant, (SELECT t.name FROM public.tenants AS t WHERE t.id = v_tenant),
    jsonb_build_object('reason', v_reason, 'user_id', p_user_id, 'email', v_email, 'factors_removed', v_factors)
  );

  RETURN jsonb_build_object('user_id', p_user_id, 'factors_removed', v_factors);
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_change_user_role(
  p_tenant_id uuid,
  p_user_id uuid,
  p_role text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_email text;
  v_name text;
  v_old text;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('admin', 'employee', 'trainer') THEN
    RAISE EXCEPTION 'Unknown role' USING ERRCODE = '22023';
  END IF;

  v_email := public.platform_assert_manageable_user(p_user_id);

  SELECT t.name INTO v_name FROM public.tenants AS t WHERE t.id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT m.role INTO v_old
  FROM public.memberships AS m
  WHERE m.tenant_id = p_tenant_id AND m.user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This user is not on this gym''s staff' USING ERRCODE = 'P0002';
  END IF;

  IF v_old = p_role THEN
    RAISE EXCEPTION 'This user already has that role' USING ERRCODE = '55000';
  END IF;

  IF v_old = 'admin' AND NOT EXISTS (
    SELECT 1 FROM public.memberships AS m
    WHERE m.tenant_id = p_tenant_id AND m.role = 'admin' AND m.user_id <> p_user_id
  ) THEN
    RAISE EXCEPTION 'Cannot demote the last admin of a gym' USING ERRCODE = '55000';
  END IF;

  UPDATE public.memberships AS m
  SET role = p_role, updated_at = now()
  WHERE m.tenant_id = p_tenant_id AND m.user_id = p_user_id;

  PERFORM public.platform_write_audit(
    'change_role', p_tenant_id, v_name,
    jsonb_build_object('reason', v_reason, 'user_id', p_user_id, 'email', v_email, 'from', v_old, 'to', p_role)
  );

  RETURN jsonb_build_object('user_id', p_user_id, 'tenant_id', p_tenant_id, 'role', p_role);
END;
$$;

-- Permanent. The caller must type the user's exact email. POS records, tasks
-- and stock movements they created are handed to the gym's longest-standing
-- OTHER admin first (those columns have no ON DELETE rule and would otherwise
-- block the delete). A user who is the only admin of a gym cannot be deleted:
-- promote someone else, or delete the gym.
CREATE OR REPLACE FUNCTION public.platform_delete_user(
  p_user_id uuid,
  p_confirm_email text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_email text;
  v_tenant uuid;
  v_tenant_name text;
  r record;
  v_repl uuid;
  v_repl_email text;
  n integer;
  v_tasks integer := 0;
  v_sales integer := 0;
  v_returns integer := 0;
  v_moves integer := 0;
  v_blocking integer;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;

  v_email := public.platform_assert_manageable_user(p_user_id);

  IF p_confirm_email IS NULL OR lower(btrim(p_confirm_email)) <> lower(v_email) THEN
    RAISE EXCEPTION 'The confirmation email does not match this user' USING ERRCODE = '22023';
  END IF;

  v_tenant := public.platform_user_single_tenant(p_user_id);
  v_tenant_name := (SELECT t.name FROM public.tenants AS t WHERE t.id = v_tenant);

  FOR r IN
    SELECT m.tenant_id, m.role FROM public.memberships AS m WHERE m.user_id = p_user_id
  LOOP
    SELECT m2.user_id INTO v_repl
    FROM public.memberships AS m2
    WHERE m2.tenant_id = r.tenant_id AND m2.role = 'admin' AND m2.user_id <> p_user_id
    ORDER BY m2.created_at ASC, m2.id ASC
    LIMIT 1;

    IF v_repl IS NULL THEN
      IF r.role = 'admin' THEN
        RAISE EXCEPTION 'This user is the only admin of a gym. Promote another user first, or delete the gym'
          USING ERRCODE = '55000';
      END IF;

      SELECT (SELECT count(*) FROM public.member_tasks WHERE tenant_id = r.tenant_id AND created_by = p_user_id)
           + (SELECT count(*) FROM public.pos_sales WHERE tenant_id = r.tenant_id AND cashier_id = p_user_id)
           + (SELECT count(*) FROM public.pos_returns WHERE tenant_id = r.tenant_id AND cashier_id = p_user_id)
           + (SELECT count(*) FROM public.pos_stock_movements WHERE tenant_id = r.tenant_id AND created_by = p_user_id)
        INTO v_blocking;
      IF v_blocking > 0 THEN
        RAISE EXCEPTION 'This user has records in a gym with no other admin to take them over'
          USING ERRCODE = '55000';
      END IF;
      CONTINUE;
    END IF;

    UPDATE public.member_tasks SET created_by = v_repl WHERE tenant_id = r.tenant_id AND created_by = p_user_id;
    GET DIAGNOSTICS n = ROW_COUNT; v_tasks := v_tasks + n;
    UPDATE public.pos_sales SET cashier_id = v_repl WHERE tenant_id = r.tenant_id AND cashier_id = p_user_id;
    GET DIAGNOSTICS n = ROW_COUNT; v_sales := v_sales + n;
    UPDATE public.pos_returns SET cashier_id = v_repl WHERE tenant_id = r.tenant_id AND cashier_id = p_user_id;
    GET DIAGNOSTICS n = ROW_COUNT; v_returns := v_returns + n;
    UPDATE public.pos_stock_movements SET created_by = v_repl WHERE tenant_id = r.tenant_id AND created_by = p_user_id;
    GET DIAGNOSTICS n = ROW_COUNT; v_moves := v_moves + n;

    v_repl_email := (SELECT u.email::text FROM auth.users AS u WHERE u.id = v_repl);
  END LOOP;

  DELETE FROM auth.users WHERE id = p_user_id;

  PERFORM public.platform_write_audit(
    'delete_user', v_tenant, v_tenant_name,
    jsonb_build_object(
      'reason', v_reason,
      'user_id', p_user_id,
      'email', v_email,
      'reassigned_to', v_repl_email,
      'reassigned', jsonb_build_object(
        'member_tasks', v_tasks, 'pos_sales', v_sales, 'pos_returns', v_returns, 'pos_stock_movements', v_moves
      )
    )
  );

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'deleted', true,
    'reassigned', v_tasks + v_sales + v_returns + v_moves
  );
END;
$$;

-- --------------------------------------------------------------------------
-- 6. List / detail: expose suspension state and the ids the console acts on
-- --------------------------------------------------------------------------
-- platform_list_tenants: + 'suspended' per row, + 'suspended' filter.
CREATE OR REPLACE FUNCTION public.platform_list_tenants(
  p_search text DEFAULT NULL,
  p_filter text DEFAULT 'all',
  p_sort text DEFAULT 'created_desc',
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
SET statement_timeout = '5s'
AS $$
DECLARE
  v_search text := NULLIF(lower(btrim(COALESCE(p_search, ''))), '');
  v_filter text := COALESCE(p_filter, 'all');
  v_sort text := COALESCE(p_sort, 'created_desc');
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_result jsonb;
BEGIN
  PERFORM public.require_platform_admin();

  IF v_search IS NOT NULL AND length(v_search) > 100 THEN
    RAISE EXCEPTION 'Search text is too long' USING ERRCODE = '22023';
  END IF;
  IF v_filter NOT IN ('all', 'awaiting_activation', 'paid', 'complimentary', 'trialing', 'inactive', 'ending_soon', 'suspended') THEN
    RAISE EXCEPTION 'Unknown filter' USING ERRCODE = '22023';
  END IF;
  IF v_sort NOT IN ('created_desc', 'created_asc', 'name_asc', 'period_end_asc') THEN
    RAISE EXCEPTION 'Unknown sort' USING ERRCODE = '22023';
  END IF;

  WITH f AS (
    SELECT b.*
    FROM public.platform_tenant_base() AS b
    WHERE (
        v_search IS NULL
        OR strpos(lower(b.name), v_search) > 0
        OR strpos(lower(COALESCE(b.admin_email, '')), v_search) > 0
      )
      AND (
        v_filter = 'all'
        OR (v_filter = 'ending_soon'
            AND b.access_state IN ('paid', 'complimentary')
            AND b.current_period_end IS NOT NULL
            AND b.current_period_end <= now() + interval '14 days')
        OR (v_filter = 'suspended'
            AND EXISTS (SELECT 1 FROM public.platform_suspensions AS s WHERE s.tenant_id = b.id))
        OR b.access_state = v_filter
      )
  ),
  ranked AS (
    SELECT
      f.*,
      row_number() OVER (
        ORDER BY
          CASE WHEN v_sort = 'created_desc' THEN f.created_at END DESC NULLS LAST,
          CASE WHEN v_sort = 'created_asc' THEN f.created_at END ASC NULLS LAST,
          CASE WHEN v_sort = 'name_asc' THEN lower(f.name) END ASC NULLS LAST,
          CASE WHEN v_sort = 'period_end_asc' THEN f.current_period_end END ASC NULLS LAST,
          f.id
      ) AS ord
    FROM f
  ),
  page AS (
    SELECT * FROM ranked ORDER BY ord LIMIT v_limit OFFSET v_offset
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM f),
    'rows', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'created_at', p.created_at,
          'admin_email', p.admin_email,
          'admin_last_sign_in', p.admin_last_sign_in,
          'access_state', p.access_state,
          'suspended', EXISTS (SELECT 1 FROM public.platform_suspensions AS s WHERE s.tenant_id = p.id),
          'subscription', CASE WHEN p.sub_id IS NULL THEN NULL ELSE jsonb_build_object(
            'status', p.status,
            'plan_tier', p.plan_tier,
            'payment_provider', p.payment_provider,
            'trial_end', p.trial_end,
            'current_period_end', p.current_period_end
          ) END,
          'members', (SELECT count(*) FROM public.members AS m WHERE m.tenant_id = p.id),
          'trainers', (SELECT count(*) FROM public.trainers AS tr WHERE tr.tenant_id = p.id),
          'branches', (SELECT count(*) FROM public.branches AS br WHERE br.tenant_id = p.id),
          'classes', (SELECT count(*) FROM public.classes AS c WHERE c.tenant_id = p.id)
        )
        ORDER BY p.ord
      )
      FROM page AS p
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- platform_tenant_detail: + 'suspension', and per staff member their user_id,
-- banned flag and whether they are a platform admin (so the console never
-- offers actions the database will refuse).
CREATE OR REPLACE FUNCTION public.platform_tenant_detail(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_base record;
BEGIN
  PERFORM public.require_platform_admin();

  SELECT * INTO v_base FROM public.platform_tenant_base() AS b WHERE b.id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'tenant', jsonb_build_object('id', v_base.id, 'name', v_base.name, 'created_at', v_base.created_at),
    'access_state', v_base.access_state,
    'suspension', (
      SELECT jsonb_build_object('suspended_at', s.suspended_at, 'reason', s.reason)
      FROM public.platform_suspensions AS s WHERE s.tenant_id = p_tenant_id
    ),
    'subscription', CASE WHEN v_base.sub_id IS NULL THEN NULL ELSE jsonb_build_object(
      'status', v_base.status,
      'plan_tier', v_base.plan_tier,
      'payment_provider', v_base.payment_provider,
      'payment_reference', v_base.payment_reference,
      'amount', v_base.amount,
      'currency', v_base.currency,
      'trial_end', v_base.trial_end,
      'current_period_end', v_base.current_period_end
    ) END,
    'staff', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', u.id,
          'email', u.email::text,
          'role', m.role,
          'joined_at', m.created_at,
          'last_sign_in_at', u.last_sign_in_at,
          'banned', (u.banned_until IS NOT NULL AND u.banned_until > now()),
          'is_platform_admin', EXISTS (SELECT 1 FROM public.platform_admins AS pa WHERE pa.user_id = u.id)
        )
        ORDER BY m.created_at ASC, m.id ASC
      )
      FROM public.memberships AS m
      JOIN auth.users AS u ON u.id = m.user_id
      WHERE m.tenant_id = p_tenant_id
    ), '[]'::jsonb),
    'usage', jsonb_build_object(
      'members', (SELECT count(*) FROM public.members AS m WHERE m.tenant_id = p_tenant_id),
      'active_members', (SELECT count(*) FROM public.members AS m WHERE m.tenant_id = p_tenant_id AND m.status = 'active'),
      'trainers', (SELECT count(*) FROM public.trainers AS tr WHERE tr.tenant_id = p_tenant_id),
      'branches', (SELECT count(*) FROM public.branches AS br WHERE br.tenant_id = p_tenant_id),
      'classes', (SELECT count(*) FROM public.classes AS c WHERE c.tenant_id = p_tenant_id),
      'last_activity_at', (SELECT max(a.created_at) FROM public.activities AS a WHERE a.tenant_id = p_tenant_id)
    ),
    'audit', COALESCE((
      SELECT jsonb_agg(z ORDER BY z.created_at DESC, z.id DESC)
      FROM (
        SELECT l.id, l.created_at, l.actor_email, l.action, l.tenant_id, l.tenant_name, l.details
        FROM public.platform_audit_log AS l
        WHERE l.tenant_id = p_tenant_id
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT 20
      ) AS z
    ), '[]'::jsonb)
  );
END;
$$;

-- --------------------------------------------------------------------------
-- 7. Grants: revoke everything, then grant only the client RPCs
-- --------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.platform_assert_manageable_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_user_single_tenant(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_suspend_gym(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_unsuspend_gym(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_delete_gym(uuid, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_ban_user(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_unban_user(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_reset_user_mfa(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_change_user_role(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_delete_user(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_list_tenants(text, text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_tenant_detail(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.platform_suspend_gym(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_unsuspend_gym(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_delete_gym(uuid, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_ban_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_unban_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_reset_user_mfa(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_change_user_role(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_delete_user(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_list_tenants(text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_tenant_detail(uuid) TO authenticated;

COMMIT;
