-- Normalize get_lockout_threshold's search_path to match every other
-- SECURITY DEFINER function in the schema (SET search_path = ''), for
-- consistency and defense in depth. All object references inside the
-- function body are already schema-qualified (auth.users, public.memberships,
-- public.gym_settings), so this is a no-op behavior change.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_lockout_threshold(p_email text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT (gs.metadata -> 'security' ->> 'lockout_threshold')::integer
      FROM auth.users u
      JOIN public.memberships m ON m.user_id = u.id
      JOIN public.gym_settings gs ON gs.tenant_id = m.tenant_id
      WHERE lower(u.email) = lower(p_email)
      ORDER BY m.created_at ASC
      LIMIT 1
    ),
    5
  );
$$;

REVOKE ALL ON FUNCTION public.get_lockout_threshold(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lockout_threshold(text) TO anon, authenticated;

COMMIT;
