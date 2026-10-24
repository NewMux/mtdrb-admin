-- Owner console: where in the world are the gyms?
--
-- Each gym's country is chosen in its own setup (gym_settings.metadata.general
-- .country, an ISO 3166-1 alpha-2 code). This adds one read-only report over it.
-- Like every platform_* RPC it starts with require_platform_admin(); nothing is
-- readable cross-tenant any other way. Gyms that never finished setup (or hold
-- an unusable value) are grouped under a NULL country so totals still add up.

BEGIN;

CREATE OR REPLACE FUNCTION public.platform_gyms_by_country()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.require_platform_admin();

  RETURN (
    WITH g AS (
      SELECT
        b.id,
        b.access_state,
        CASE
          WHEN upper(btrim(gs.metadata -> 'general' ->> 'country')) ~ '^[A-Z]{2}$'
            THEN upper(btrim(gs.metadata -> 'general' ->> 'country'))
        END AS country,
        (SELECT count(*) FROM public.members AS m WHERE m.tenant_id = b.id) AS members
      FROM public.platform_tenant_base() AS b
      LEFT JOIN public.gym_settings AS gs ON gs.tenant_id = b.id
    ),
    r AS (
      SELECT
        country,
        count(*) AS gyms,
        count(*) FILTER (WHERE access_state = 'paid') AS paid,
        count(*) FILTER (WHERE access_state = 'trialing') AS trialing,
        sum(members) AS members
      FROM g
      GROUP BY country
    )
    SELECT jsonb_build_object(
      'generated_at', now(),
      'total', (SELECT count(*) FROM g),
      'countries', (SELECT count(*) FROM r WHERE country IS NOT NULL),
      'rows', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'country', r.country, 'gyms', r.gyms, 'paid', r.paid,
            'trialing', r.trialing, 'members', r.members
          )
          ORDER BY r.country IS NULL, r.gyms DESC, r.country
        )
        FROM r
      ), '[]'::jsonb)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.platform_gyms_by_country() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_gyms_by_country() TO authenticated;

COMMIT;
