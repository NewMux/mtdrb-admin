-- is_tenant_entitled() was still callable by the anonymous role after
-- migration enforce_entitlement_on_writes, despite its
-- `REVOKE ALL ... FROM PUBLIC`. Confirmed via pg_default_acl on the live
-- project: it has ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA
-- public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated,
-- service_role, which grants EXECUTE directly to each role (not via the
-- PUBLIC pseudo-role) at CREATE FUNCTION time - a REVOKE ... FROM PUBLIC
-- never touches a direct per-role grant like that. Caught immediately
-- via get_advisors and information_schema.routine_privileges after
-- applying the previous migration; this closes the gap it left open.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.is_tenant_entitled(uuid) FROM anon;

COMMIT;
