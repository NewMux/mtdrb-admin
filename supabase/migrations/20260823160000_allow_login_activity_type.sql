-- Allow a 'login' activity type
-- ============================================================================
-- Settings > Security > "Login History" has always been a fake toast (no
-- backend, TODO comment) because there was nowhere to record sign-in events:
-- Supabase Auth's own sign-in history isn't readable from the client (that's
-- an Admin API / service-role-only endpoint), and the activities table's
-- type CHECK constraint didn't allow a 'login' row. This widens it so the
-- app can log its own sign-in events client-side going forward.

BEGIN;

ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE public.activities ADD CONSTRAINT activities_type_check
  CHECK (type IN ('member', 'payment', 'class', 'signup', 'renewal', 'booking', 'login'));

COMMIT;
