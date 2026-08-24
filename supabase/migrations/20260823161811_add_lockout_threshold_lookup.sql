-- Pre-auth lookup for a tenant's configured login-lockout threshold
-- ============================================================================
-- The Security tab in Settings lets an admin configure a per-tenant login
-- lockout threshold (gym_settings.metadata.security.lockout_threshold), but
-- the client-side login attempt limiter (useAuthAttemptLimiter.ts) runs
-- before the user is authenticated - at that point the app doesn't know
-- which tenant/gym the email belongs to, since tenant resolution normally
-- goes through the RLS-protected memberships table.
--
-- This function is a narrow, anon-callable lookup: given an email, it
-- returns ONLY an integer threshold (the tenant's configured value, or the
-- platform default of 5 if unset or the email doesn't match any account).
-- It deliberately returns the same shape either way so it can't be used to
-- confirm whether an email has an account (no boolean "exists" signal, no
-- other user/tenant data exposed). It's still an anon-accessible endpoint
-- doing an email lookup, so pair this with Supabase Auth's own rate limiting
-- (dashboard-configured) as the real backstop against abuse, same guidance
-- already noted in useAuthAttemptLimiter.ts for the client-side limiter.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_lockout_threshold(p_email text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
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
