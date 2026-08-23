-- Revoke direct RPC access to trigger-only functions
-- ============================================================================
-- Postgres grants EXECUTE on new functions to PUBLIC by default, which is
-- why Supabase's security advisor flags
-- public.enforce_platform_subscription_self_service() as callable directly
-- via /rest/v1/rpc/enforce_platform_subscription_self_service by anon and
-- authenticated. It's a BEFORE INSERT/UPDATE trigger function (introduced in
-- 20260823120000_restrict_platform_subscription_self_service.sql) and relies
-- on trigger-only variables (TG_OP, NEW, OLD); calling it outside a trigger
-- context errors out, so this isn't exploitable, but it shouldn't be exposed
-- as a callable endpoint at all. Trigger firing does not depend on the
-- invoking role holding EXECUTE on the function, so revoking this does not
-- affect the trigger itself.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.enforce_platform_subscription_self_service()
  FROM PUBLIC, anon, authenticated;

COMMIT;
