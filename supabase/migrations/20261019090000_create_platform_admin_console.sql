-- Platform-owner (superadmin) console: database layer.
-- ============================================================================
-- Until now nothing let the SaaS owner see or manage tenants: every RLS policy
-- is scoped to the caller's own tenant (get_user_tenant_id()), and activating
-- a signup meant hand-writing a platform_subscriptions row with the service
-- role. This migration adds the server-side half of an owner-only console.
--
-- Design rules (do not weaken them):
--   * Authorisation lives HERE, not in the UI. Every platform_* RPC starts with
--     require_platform_admin(), which needs ALL of: an allowlist row in
--     platform_admins, an aal2 (TOTP) JWT, a verified MFA factor, and a live
--     aal2 row in auth.sessions for the JWT's session_id. The last two make
--     sign-out and factor removal effective immediately instead of waiting out
--     the access token.
--   * There is deliberately NO cross-tenant RLS bypass: most client code omits
--     tenant filters and relies on RLS, so a broad policy would leak every
--     tenant's rows into the normal pages. Cross-tenant reads happen only via
--     the SECURITY DEFINER RPCs below, which return account-level data only
--     (names, admin emails, access state, usage COUNTS) - never member PII,
--     invoices or health/financial rows.
--   * Platform state is NOT stored in platform_subscriptions.metadata: the
--     paddle-webhook replaces that object wholesale on every event. Manual
--     grants are rows with payment_provider = 'manual', so a real Paddle
--     subscription later supersedes them cleanly. Caveat: if a tenant ever had
--     a Paddle subscription, a late/retried Paddle event can overwrite a
--     manual grant - cancel it in Paddle first.
--   * Every mutation writes platform_audit_log in the same transaction.
--     Refused attempts roll back and therefore leave no audit row.
--   * Supabase default privileges grant EXECUTE on new public functions (and
--     table/sequence privileges) directly to anon/authenticated/service_role,
--     which REVOKE ... FROM PUBLIC does not remove (see
--     20260909155023_revoke_anon_execute_on_is_tenant_entitled.sql). Every
--     object here is therefore revoked explicitly before any intended grant.
--
-- Bootstrap (run once in the SQL editor; see DEPLOYMENT.md):
--   insert into public.platform_admins (user_id, note)
--   select id, 'owner' from auth.users where email = '<owner-email>';

BEGIN;

-- --------------------------------------------------------------------------
-- Allowlist
-- --------------------------------------------------------------------------
-- RLS enabled with zero policies = deny-all to anon/authenticated, as in
-- rate_limits. Only the SQL editor / service role ever writes it.
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_admins FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------------
-- Audit log (append-only)
-- --------------------------------------------------------------------------
-- tenant_id / actor_id intentionally have no foreign keys: history must
-- survive tenant or user deletion, and a SET NULL cascade would trip the
-- append-only trigger.
CREATE TABLE IF NOT EXISTS public.platform_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid NOT NULL,
  actor_email text,
  action text NOT NULL CHECK (action IN ('grant_access', 'revoke_access', 'note')),
  tenant_id uuid,
  tenant_name text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_log_created_at
  ON public.platform_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_tenant
  ON public.platform_audit_log (tenant_id, created_at DESC);

ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_audit_log FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.platform_audit_log_id_seq FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.platform_audit_log_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'platform_audit_log is append-only';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.platform_audit_log_immutable() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS platform_audit_log_no_change ON public.platform_audit_log;
CREATE TRIGGER platform_audit_log_no_change
  BEFORE UPDATE OR DELETE ON public.platform_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.platform_audit_log_immutable();

DROP TRIGGER IF EXISTS platform_audit_log_no_truncate ON public.platform_audit_log;
CREATE TRIGGER platform_audit_log_no_truncate
  BEFORE TRUNCATE ON public.platform_audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION public.platform_audit_log_immutable();

-- --------------------------------------------------------------------------
-- The gate
-- --------------------------------------------------------------------------
-- 'not_admin'    : not on the allowlist (or not signed in)
-- 'mfa_required' : on the allowlist but the session is not a live aal2 session
--                  backed by a verified MFA factor
-- 'ok'           : allowed
-- Evaluated in order so non-admins stop at the first check and never touch
-- auth.* tables. The session_id cast is regex-guarded so a malformed claim
-- yields 'mfa_required' rather than an exception that differs per caller.
CREATE OR REPLACE FUNCTION public.platform_admin_status()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_claims jsonb := (SELECT auth.jwt());
  v_session text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 'not_admin';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.platform_admins AS pa WHERE pa.user_id = v_uid) THEN
    RETURN 'not_admin';
  END IF;

  IF COALESCE(v_claims ->> 'aal', '') <> 'aal2' THEN
    RETURN 'mfa_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.mfa_factors AS f
    WHERE f.user_id = v_uid AND f.status = 'verified'
  ) THEN
    RETURN 'mfa_required';
  END IF;

  v_session := v_claims ->> 'session_id';
  IF v_session IS NULL
     OR v_session !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN 'mfa_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.sessions AS s
    WHERE s.id = v_session::uuid AND s.user_id = v_uid AND s.aal = 'aal2'
  ) THEN
    RETURN 'mfa_required';
  END IF;

  RETURN 'ok';
END;
$$;

-- Internal: one generic error for every denial reason, so RPC responses never
-- reveal why (or whether) a caller is on the allowlist.
CREATE OR REPLACE FUNCTION public.require_platform_admin()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.platform_admin_status() <> 'ok' THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- --------------------------------------------------------------------------
-- Internal helpers (no client grants)
-- --------------------------------------------------------------------------
-- Single definition of "what access does this tenant have", used by every RPC.
--   awaiting_activation : no subscription row (signed up, never activated)
--   paid                : active, non-manual, period open
--   complimentary       : active, payment_provider = 'manual', period open
--   trialing            : trialing with a future trial_end
--   inactive            : a row exists but grants no current access
--                         (cancelled/failed/expired/past_due, an active row
--                         whose period ended, or a trial without a future end)
CREATE OR REPLACE FUNCTION public.platform_access_state(
  p_has_row boolean,
  p_status text,
  p_provider text,
  p_trial_end timestamptz,
  p_period_end timestamptz
)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN NOT COALESCE(p_has_row, false) THEN 'awaiting_activation'
    WHEN p_status = 'active' AND (p_period_end IS NULL OR p_period_end > now())
      THEN CASE WHEN p_provider = 'manual' THEN 'complimentary' ELSE 'paid' END
    WHEN p_status = 'trialing' AND p_trial_end IS NOT NULL AND p_trial_end > now()
      THEN 'trialing'
    ELSE 'inactive'
  END;
$$;

-- One row per tenant with its subscription and primary admin contact.
CREATE OR REPLACE FUNCTION public.platform_tenant_base()
RETURNS TABLE (
  id uuid,
  name text,
  created_at timestamptz,
  sub_id uuid,
  status text,
  plan_tier text,
  payment_provider text,
  payment_reference text,
  amount numeric,
  currency text,
  trial_end timestamptz,
  current_period_end timestamptz,
  access_state text,
  admin_email text,
  admin_last_sign_in timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    t.id,
    t.name,
    t.created_at,
    ps.id,
    ps.status,
    ps.plan_tier,
    ps.payment_provider,
    ps.payment_reference,
    ps.amount,
    ps.currency,
    ps.trial_end,
    ps.current_period_end,
    public.platform_access_state(
      ps.id IS NOT NULL, ps.status, ps.payment_provider, ps.trial_end, ps.current_period_end
    ),
    adm.email,
    adm.last_sign_in_at
  FROM public.tenants AS t
  LEFT JOIN public.platform_subscriptions AS ps ON ps.tenant_id = t.id
  LEFT JOIN LATERAL (
    SELECT u.email::text AS email, u.last_sign_in_at
    FROM public.memberships AS m
    JOIN auth.users AS u ON u.id = m.user_id
    WHERE m.tenant_id = t.id AND m.role = 'admin'
    ORDER BY m.created_at ASC, m.id ASC
    LIMIT 1
  ) AS adm ON true;
$$;

CREATE OR REPLACE FUNCTION public.platform_subscription_snapshot(p_sub public.platform_subscriptions)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE WHEN p_sub.id IS NULL THEN NULL ELSE jsonb_build_object(
    'status', p_sub.status,
    'plan_tier', p_sub.plan_tier,
    'payment_provider', p_sub.payment_provider,
    'trial_end', p_sub.trial_end,
    'current_period_end', p_sub.current_period_end
  ) END;
$$;

CREATE OR REPLACE FUNCTION public.platform_write_audit(
  p_action text,
  p_tenant_id uuid,
  p_tenant_name text,
  p_details jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  INSERT INTO public.platform_audit_log (actor_id, actor_email, action, tenant_id, tenant_name, details)
  VALUES (
    v_uid,
    COALESCE(
      (SELECT auth.jwt()) ->> 'email',
      (SELECT u.email::text FROM auth.users AS u WHERE u.id = v_uid)
    ),
    p_action,
    p_tenant_id,
    p_tenant_name,
    COALESCE(p_details, '{}'::jsonb)
  );
END;
$$;

-- --------------------------------------------------------------------------
-- RPCs (client-callable; each starts with require_platform_admin())
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.platform_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.require_platform_admin();

  RETURN (
    WITH b AS (SELECT * FROM public.platform_tenant_base())
    SELECT jsonb_build_object(
      'generated_at', now(),
      'totals', jsonb_build_object(
        'tenants', (SELECT count(*) FROM b),
        'new_7d', (SELECT count(*) FROM b WHERE b.created_at >= now() - interval '7 days'),
        'new_30d', (SELECT count(*) FROM b WHERE b.created_at >= now() - interval '30 days')
      ),
      'by_state', jsonb_build_object(
        'awaiting_activation', (SELECT count(*) FROM b WHERE b.access_state = 'awaiting_activation'),
        'paid', (SELECT count(*) FROM b WHERE b.access_state = 'paid'),
        'complimentary', (SELECT count(*) FROM b WHERE b.access_state = 'complimentary'),
        'trialing', (SELECT count(*) FROM b WHERE b.access_state = 'trialing'),
        'inactive', (SELECT count(*) FROM b WHERE b.access_state = 'inactive')
      ),
      'no_expiry_comps', (
        SELECT count(*) FROM b
        WHERE b.access_state = 'complimentary' AND b.current_period_end IS NULL
      ),
      'awaiting_activation', COALESCE((
        SELECT jsonb_agg(x ORDER BY x.created_at DESC)
        FROM (
          SELECT
            b.id, b.name, b.created_at, b.admin_email, b.admin_last_sign_in,
            (SELECT count(*) FROM public.members AS m WHERE m.tenant_id = b.id) AS members
          FROM b
          WHERE b.access_state = 'awaiting_activation'
          ORDER BY b.created_at DESC
          LIMIT 10
        ) AS x
      ), '[]'::jsonb),
      'ending_soon', COALESCE((
        SELECT jsonb_agg(y ORDER BY y.current_period_end ASC)
        FROM (
          SELECT b.id, b.name, b.plan_tier, b.access_state, b.current_period_end
          FROM b
          WHERE b.access_state IN ('paid', 'complimentary')
            AND b.current_period_end IS NOT NULL
            AND b.current_period_end <= now() + interval '14 days'
          ORDER BY b.current_period_end ASC
          LIMIT 10
        ) AS y
      ), '[]'::jsonb),
      'recent_changes', COALESCE((
        SELECT jsonb_agg(z ORDER BY z.created_at DESC, z.id DESC)
        FROM (
          SELECT l.id, l.created_at, l.actor_email, l.action, l.tenant_id, l.tenant_name, l.details
          FROM public.platform_audit_log AS l
          ORDER BY l.created_at DESC, l.id DESC
          LIMIT 10
        ) AS z
      ), '[]'::jsonb)
    )
  );
END;
$$;

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
  IF v_filter NOT IN ('all', 'awaiting_activation', 'paid', 'complimentary', 'trialing', 'inactive', 'ending_soon') THEN
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
          'email', u.email::text,
          'role', m.role,
          'joined_at', m.created_at,
          'last_sign_in_at', u.last_sign_in_at
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

CREATE OR REPLACE FUNCTION public.platform_list_audit_log(
  p_tenant_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  PERFORM public.require_platform_admin();

  RETURN jsonb_build_object(
    'total', (
      SELECT count(*) FROM public.platform_audit_log AS l
      WHERE p_tenant_id IS NULL OR l.tenant_id = p_tenant_id
    ),
    'rows', COALESCE((
      SELECT jsonb_agg(z ORDER BY z.created_at DESC, z.id DESC)
      FROM (
        SELECT l.id, l.created_at, l.actor_email, l.action, l.tenant_id, l.tenant_name, l.details
        FROM public.platform_audit_log AS l
        WHERE p_tenant_id IS NULL OR l.tenant_id = p_tenant_id
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT v_limit OFFSET v_offset
      ) AS z
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_grant_access(
  p_tenant_id uuid,
  p_plan_tier text,
  p_until timestamptz,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_name text;
  v_before public.platform_subscriptions;
  v_after public.platform_subscriptions;
  v_had_row boolean;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;
  IF p_plan_tier IS NULL OR p_plan_tier NOT IN ('starter', 'pro', 'enterprise', 'demo') THEN
    RAISE EXCEPTION 'Unknown plan tier' USING ERRCODE = '22023';
  END IF;
  IF p_until IS NOT NULL AND (p_until <= now() OR p_until > now() + interval '5 years') THEN
    RAISE EXCEPTION 'The end date must be in the future and within 5 years (leave it empty for no expiry)'
      USING ERRCODE = '22023';
  END IF;

  SELECT t.name INTO v_name FROM public.tenants AS t WHERE t.id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_before
  FROM public.platform_subscriptions AS ps
  WHERE ps.tenant_id = p_tenant_id
  FOR UPDATE;
  v_had_row := FOUND;

  IF v_had_row
     AND v_before.payment_provider = 'paddle'
     AND public.platform_access_state(true, v_before.status, v_before.payment_provider,
                                      v_before.trial_end, v_before.current_period_end)
         IN ('paid', 'trialing') THEN
    RAISE EXCEPTION 'This gym is billed through Paddle. Change or cancel its subscription in Paddle instead.'
      USING ERRCODE = '55000';
  END IF;

  PERFORM set_config('app.platform_admin_write', 'on', true);

  INSERT INTO public.platform_subscriptions AS ps (
    tenant_id, status, plan_tier, amount, trial_end, current_period_end,
    payment_provider, payment_reference
  )
  VALUES (p_tenant_id, 'active', p_plan_tier, 0, NULL, p_until, 'manual', NULL)
  ON CONFLICT (tenant_id) DO UPDATE SET
    status = 'active',
    plan_tier = EXCLUDED.plan_tier,
    amount = 0,
    trial_end = NULL,
    current_period_end = EXCLUDED.current_period_end,
    payment_provider = 'manual',
    payment_reference = NULL
  RETURNING ps.* INTO v_after;

  PERFORM set_config('app.platform_admin_write', 'off', true);

  PERFORM public.platform_write_audit(
    'grant_access', p_tenant_id, v_name,
    jsonb_build_object(
      'reason', v_reason,
      'before', CASE WHEN v_had_row THEN public.platform_subscription_snapshot(v_before) END,
      'after', public.platform_subscription_snapshot(v_after)
    )
  );

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'access_state', public.platform_access_state(true, v_after.status, v_after.payment_provider,
                                                 v_after.trial_end, v_after.current_period_end)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_revoke_access(p_tenant_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_name text;
  v_before public.platform_subscriptions;
  v_after public.platform_subscriptions;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;

  SELECT t.name INTO v_name FROM public.tenants AS t WHERE t.id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_before
  FROM public.platform_subscriptions AS ps
  WHERE ps.tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND OR v_before.payment_provider <> 'manual' THEN
    RAISE EXCEPTION 'Only manually granted access can be revoked here' USING ERRCODE = '55000';
  END IF;

  PERFORM set_config('app.platform_admin_write', 'on', true);

  UPDATE public.platform_subscriptions AS ps
  SET status = 'cancelled', current_period_end = now()
  WHERE ps.tenant_id = p_tenant_id
  RETURNING ps.* INTO v_after;

  PERFORM set_config('app.platform_admin_write', 'off', true);

  PERFORM public.platform_write_audit(
    'revoke_access', p_tenant_id, v_name,
    jsonb_build_object(
      'reason', v_reason,
      'before', public.platform_subscription_snapshot(v_before),
      'after', public.platform_subscription_snapshot(v_after)
    )
  );

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'access_state', public.platform_access_state(true, v_after.status, v_after.payment_provider,
                                                 v_after.trial_end, v_after.current_period_end)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_add_note(p_tenant_id uuid, p_note text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_note text := btrim(COALESCE(p_note, ''));
  v_name text;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_note) < 1 OR length(v_note) > 2000 THEN
    RAISE EXCEPTION 'A note of 1 to 2000 characters is required' USING ERRCODE = '22023';
  END IF;

  SELECT t.name INTO v_name FROM public.tenants AS t WHERE t.id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public.platform_write_audit('note', p_tenant_id, v_name, jsonb_build_object('note', v_note));

  RETURN jsonb_build_object('tenant_id', p_tenant_id);
END;
$$;

-- --------------------------------------------------------------------------
-- Allow the audited RPCs (and only them) through the self-service guard
-- --------------------------------------------------------------------------
-- enforce_platform_subscription_self_service() only trusts auth.role() =
-- 'service_role'. A SECURITY DEFINER RPC called by a signed-in owner still has
-- role 'authenticated', so without this the trigger would reject every grant.
-- The body below is the latest one (20260909162346_revoke_self_service_trial_
-- creation.sql) plus ONE early return, which requires BOTH the transaction-
-- local flag the grant/revoke RPCs set around their write AND a fully valid
-- platform admin. A direct REST write by the owner does not set the flag, and
-- tenant admins are unaffected.
CREATE OR REPLACE FUNCTION public.enforce_platform_subscription_self_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Trusted server-side callers (service role key, used by
  -- credimax-checkout and credimax-webhook) are not restricted.
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

  RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------------
-- Privileges
-- --------------------------------------------------------------------------
-- Everything is revoked from PUBLIC, anon AND authenticated first (default
-- privileges grant to the roles directly). Only the RPCs the console calls
-- are then granted back to authenticated; their own gate does the rest.
REVOKE ALL ON FUNCTION public.platform_admin_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.require_platform_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_access_state(boolean, text, text, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_tenant_base() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_subscription_snapshot(public.platform_subscriptions) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_write_audit(text, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_overview() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_list_tenants(text, text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_tenant_detail(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_list_audit_log(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_grant_access(uuid, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_revoke_access(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_add_note(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_platform_subscription_self_service() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.platform_admin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_list_tenants(text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_tenant_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_list_audit_log(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_grant_access(uuid, text, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_revoke_access(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_add_note(uuid, text) TO authenticated;

COMMIT;
