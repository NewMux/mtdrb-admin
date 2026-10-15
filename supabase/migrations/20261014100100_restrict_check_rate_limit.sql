-- check_rate_limit() kept Postgres's default EXECUTE grant to PUBLIC, so
-- anyone holding the public anon key could call it with any key -- e.g.
-- 'paddle-webhook:<Paddle source IP>' -- and use up that limit, making
-- paddle-webhook answer Paddle's real deliveries with 429. Only trusted
-- callers need it: paddle-webhook (service role) and
-- get_lockout_threshold(), which is SECURITY DEFINER and so runs it as its
-- owner, unaffected by this revoke.
--
-- Not applied to the live project from the session that wrote this.

BEGIN;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

COMMIT;
