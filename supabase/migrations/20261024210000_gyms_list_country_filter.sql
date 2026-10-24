-- Owner console: filter the gyms list by country and show each gym's country.
--
-- Adds an optional p_country argument (an ISO code, or 'none' for gyms that
-- haven't chosen one) and a 'country' field on each row. The old 5-argument
-- version is dropped first: keeping both would make short calls ambiguous.
-- Same authorisation as every platform_* RPC (require_platform_admin()).

BEGIN;

DROP FUNCTION IF EXISTS public.platform_list_tenants(text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.platform_list_tenants(
  p_search text DEFAULT NULL,
  p_filter text DEFAULT 'all',
  p_sort text DEFAULT 'created_desc',
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0,
  p_country text DEFAULT NULL
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
  -- NULL/blank = every country, 'none' = gyms with no country yet, else an ISO code
  v_country text := NULLIF(upper(btrim(COALESCE(p_country, ''))), '');
  v_result jsonb;
BEGIN
  PERFORM public.require_platform_admin();

  IF v_search IS NOT NULL AND length(v_search) > 100 THEN
    RAISE EXCEPTION 'Search text is too long' USING ERRCODE = '22023';
  END IF;
  IF v_filter NOT IN ('all', 'awaiting_activation', 'paid', 'complimentary', 'trialing', 'past_due', 'inactive', 'ending_soon', 'suspended') THEN
    RAISE EXCEPTION 'Unknown filter' USING ERRCODE = '22023';
  END IF;
  IF v_country IS NOT NULL AND v_country <> 'NONE' AND v_country !~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'Unknown country' USING ERRCODE = '22023';
  END IF;
  IF v_sort NOT IN ('created_desc', 'created_asc', 'name_asc', 'period_end_asc') THEN
    RAISE EXCEPTION 'Unknown sort' USING ERRCODE = '22023';
  END IF;

  WITH f AS (
    SELECT b.*, c.country
    FROM public.platform_tenant_base() AS b
    LEFT JOIN LATERAL (
      SELECT CASE
        WHEN upper(btrim(gs.metadata -> 'general' ->> 'country')) ~ '^[A-Z]{2}$'
          THEN upper(btrim(gs.metadata -> 'general' ->> 'country'))
      END AS country
      FROM public.gym_settings AS gs
      WHERE gs.tenant_id = b.id
      LIMIT 1
    ) AS c ON true
    WHERE (
        v_country IS NULL
        OR (v_country = 'NONE' AND c.country IS NULL)
        OR c.country = v_country
      )
      AND (
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
          'country', p.country,
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

REVOKE ALL ON FUNCTION public.platform_list_tenants(text, text, text, integer, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_list_tenants(text, text, text, integer, integer, text) TO authenticated;

COMMIT;
