-- Owner console: show a gym that is inside its payment grace period as such.
-- ============================================================================
-- 20261022150000_past_due_grace.sql lets a gym whose renewal payment failed keep
-- access for a few days. platform_access_state() did not know about that, so the
-- console called such a gym "No access" although it can use the app - and the
-- "grant access" guard, which refuses to overwrite a gym that is billed through
-- Paddle, would have allowed it to be overwritten while its Paddle subscription
-- was still alive (and still retrying the card).
--
-- New access state 'past_due' ("Payment failed"): status past_due AND grace_until
-- in the future. It counts as having access and as Paddle-billed. After the
-- grace date it is 'inactive', as before.
--
-- platform_access_state keeps its original 5-argument form (past_due without a
-- grace date is still 'inactive') and gains a 6-argument form; every caller
-- that has the row now uses the new one.

BEGIN;

CREATE OR REPLACE FUNCTION public.platform_access_state(
  p_has_row boolean,
  p_status text,
  p_provider text,
  p_trial_end timestamptz,
  p_period_end timestamptz,
  p_grace_until timestamptz
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
    WHEN p_status = 'past_due' AND p_grace_until IS NOT NULL AND p_grace_until > now()
      THEN 'past_due'
    ELSE 'inactive'
  END;
$$;

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
  SELECT public.platform_access_state(p_has_row, p_status, p_provider, p_trial_end, p_period_end, NULL);
$$;

-- Default privileges grant to anon/authenticated directly: revoke by name.
REVOKE ALL ON FUNCTION public.platform_access_state(boolean, text, text, timestamptz, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;

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
      ps.id IS NOT NULL, ps.status, ps.payment_provider, ps.trial_end, ps.current_period_end, ps.grace_until
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
                                      v_before.trial_end, v_before.current_period_end, v_before.grace_until)
         IN ('paid', 'trialing', 'past_due') THEN
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
        'past_due', (SELECT count(*) FROM b WHERE b.access_state = 'past_due'),
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
  IF v_filter NOT IN ('all', 'awaiting_activation', 'paid', 'complimentary', 'trialing', 'past_due', 'inactive', 'ending_soon', 'suspended') THEN
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

-- Re-creating a function keeps its grants, but say it again so this file is
-- correct on its own.
REVOKE ALL ON FUNCTION public.platform_tenant_base() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_overview() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.platform_grant_access(uuid, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_grant_access(uuid, text, timestamptz, text) TO authenticated;

COMMIT;
