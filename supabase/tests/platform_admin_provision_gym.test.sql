-- Tests for 20261021170000_platform_admin_provision_gym.sql.
-- Same setup as the other platform tests (shim + schema + ALL migrations), then
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/platform_admin_provision_gym.test.sql
-- Everything runs in one transaction that is rolled back.

\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA test;
GRANT USAGE ON SCHEMA test TO PUBLIC;
CREATE TABLE test.counter (n integer NOT NULL);
INSERT INTO test.counter VALUES (0);
GRANT ALL ON test.counter TO PUBLIC;

CREATE FUNCTION test.ok(p_cond boolean, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_cond IS NOT TRUE THEN RAISE EXCEPTION 'TEST FAILED: %', p_label; END IF;
  UPDATE test.counter SET n = n + 1;
END;
$$;

CREATE FUNCTION test.expect_err(p_sql text, p_state text, p_msg text, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION 'TEST FAILED: % (expected error %, got none)', p_label, p_state;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'TEST FAILED:%' THEN RAISE; END IF;
  IF SQLSTATE <> p_state OR (p_msg IS NOT NULL AND position(p_msg IN SQLERRM) = 0) THEN
    RAISE EXCEPTION 'TEST FAILED: % (expected % "%", got % "%")', p_label, p_state, p_msg, SQLSTATE, SQLERRM;
  END IF;
  UPDATE test.counter SET n = n + 1;
END;
$$;

CREATE FUNCTION test.become(p_user uuid, p_aal text, p_session uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', jsonb_build_object(
    'sub', p_user, 'role', 'authenticated', 'aal', p_aal, 'session_id', p_session,
    'email', (SELECT email FROM auth.users WHERE id = p_user)
  )::text, true);
  SET LOCAL ROLE authenticated;
END;
$$;

CREATE FUNCTION test.become_anon() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  SET LOCAL ROLE anon;
END;
$$;

CREATE FUNCTION test.owner() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');
END;
$$;

-- --------------------------------------------------------------------------
-- Fixtures
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at, invited_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.dev',         now(),  NULL),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1admin@test.dev',     now(),  NULL),
  ('00000000-0000-0000-0000-0000000000b1', 'tenant-admin@test.dev',  now(),  NULL),
  ('00000000-0000-0000-0000-0000000000c1', 'invited1@test.dev',      NULL,   now()),   -- pending invitation
  ('00000000-0000-0000-0000-0000000000c2', 'invited2@test.dev',      NULL,   now()),
  ('00000000-0000-0000-0000-0000000000c3', 'invited3@test.dev',      NULL,   now()),
  ('00000000-0000-0000-0000-0000000000c4', 'accepted@test.dev',      now(),  now()),   -- invited, but already signed in
  ('00000000-0000-0000-0000-0000000000c5', 'signedup@test.dev',      NULL,   NULL),    -- self-signup, never invited
  ('00000000-0000-0000-0000-0000000000c6', 'hasgym@test.dev',        NULL,   now()),   -- invited but already in a gym
  ('00000000-0000-0000-0000-0000000000c7', 'invited-admin@test.dev', NULL,   now());   -- a platform admin who is also "invited"

INSERT INTO auth.sessions (id, user_id, aal) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000a1', 'aal2'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000a2', 'aal1');
INSERT INTO auth.mfa_factors (user_id, friendly_name, factor_type, status) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner phone', 'totp', 'verified'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1 phone',  'totp', 'verified');
INSERT INTO public.platform_admins (user_id, note) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1 only'),
  ('00000000-0000-0000-0000-0000000000c7', 'weird');

INSERT INTO public.tenants (id, name) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Existing Gym');
INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000c6', 'aaaaaaaa-0000-0000-0000-000000000001', 'employee');

-- --------------------------------------------------------------------------
-- 1. Only a fully verified platform admin can call it
-- --------------------------------------------------------------------------
DO $$
DECLARE
  c text := $q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c1', 'Nope Gym', 'pro', NULL, 'because')$q$;
BEGIN
  PERFORM test.become('00000000-0000-0000-0000-0000000000b1', 'aal2', NULL);
  PERFORM test.expect_err(c, '42501', 'forbidden', 'tenant admin refused');
  RESET ROLE;
  PERFORM test.become('00000000-0000-0000-0000-0000000000a2', 'aal1', '22222222-2222-2222-2222-222222222222');
  PERFORM test.expect_err(c, '42501', 'forbidden', 'aal1 platform admin refused');
  RESET ROLE;
  PERFORM test.become_anon();
  PERFORM test.expect_err(c, '42501', NULL, 'anon refused');
  RESET ROLE;
END
$$;
SELECT test.ok((SELECT count(*) FROM public.tenants) = 1, 'refused calls created no gym');

-- --------------------------------------------------------------------------
-- 2. It only ever works on a pending invitation
-- --------------------------------------------------------------------------
SELECT test.owner();
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c4', 'G', 'pro', NULL, 'long enough')$q$, '55000', 'pending invitation', 'an account that already signed in is refused');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c5', 'G', 'pro', NULL, 'long enough')$q$, '55000', 'pending invitation', 'a self-signup (never invited) is refused');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000b1', 'G', 'pro', NULL, 'long enough')$q$, '55000', 'pending invitation', 'an existing tenant admin is refused');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c6', 'G', 'pro', NULL, 'long enough')$q$, '55000', 'already belongs', 'an invited user who already has a gym is refused');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000a1', 'G', 'pro', NULL, 'long enough')$q$, '55000', 'your own account', 'cannot provision for yourself');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c7', 'G', 'pro', NULL, 'long enough')$q$, '55000', 'Platform admins', 'cannot provision for a platform admin');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000ee', 'G', 'pro', NULL, 'long enough')$q$, 'P0002', 'User not found', 'unknown user');

-- --------------------------------------------------------------------------
-- 3. Input validation, and a failure leaves nothing behind
-- --------------------------------------------------------------------------
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c1', 'G', 'pro', NULL, 'ab')$q$, '22023', 'reason', 'short reason');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c1', '   ', 'pro', NULL, 'long enough')$q$, '22023', 'gym name', 'blank gym name');
SELECT test.expect_err(format($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c1', %L, 'pro', NULL, 'long enough')$q$, repeat('x', 161)), '22023', 'gym name', 'over-long gym name');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c1', 'G', 'platinum', NULL, 'long enough')$q$, '22023', 'Unknown plan tier', 'unknown tier');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c1', 'G', 'pro', now() - interval '1 day', 'long enough')$q$, '22023', 'future', 'past end date');
RESET ROLE;
SELECT test.ok((SELECT count(*) FROM public.tenants) = 1, 'every failure rolled back: no gym left behind');
SELECT test.ok((SELECT count(*) FROM public.memberships) = 2, 'every failure rolled back: no membership left behind');
SELECT test.ok((SELECT count(*) FROM public.platform_audit_log) = 0, 'every failure rolled back: no audit rows');

-- --------------------------------------------------------------------------
-- 4. The happy path
-- --------------------------------------------------------------------------
SELECT test.owner();
SELECT test.ok(
  (public.platform_provision_gym('00000000-0000-0000-0000-0000000000c1', '  Iron Temple  ', 'pro', now() + interval '30 days', 'founding customer') ->> 'admin_email') = 'invited1@test.dev',
  'provisioning returns the admin email');
RESET ROLE;
SELECT test.ok((SELECT count(*) FROM public.tenants WHERE name = 'Iron Temple') = 1, 'gym created with a trimmed name');
SELECT test.ok((SELECT metadata ->> 'has_plans' FROM public.tenants WHERE name = 'Iron Temple') = 'false', 'same starting metadata as a normal signup');
SELECT test.ok((SELECT m.role FROM public.memberships m JOIN public.tenants t ON t.id = m.tenant_id
                 WHERE t.name = 'Iron Temple' AND m.user_id = '00000000-0000-0000-0000-0000000000c1') = 'admin', 'the invited user is the gym''s admin');
SELECT test.ok((SELECT ps.status || '/' || ps.payment_provider || '/' || ps.plan_tier FROM public.platform_subscriptions ps
                 JOIN public.tenants t ON t.id = ps.tenant_id WHERE t.name = 'Iron Temple') = 'active/manual/pro', 'complimentary pro access granted automatically');
SELECT test.ok((SELECT ps.current_period_end > now() + interval '29 days' FROM public.platform_subscriptions ps
                 JOIN public.tenants t ON t.id = ps.tenant_id WHERE t.name = 'Iron Temple'), 'access ends where the owner chose');
SELECT test.ok((SELECT count(*) FROM public.platform_audit_log WHERE action = 'grant_access') = 1, 'the grant is audited');
SELECT test.ok((SELECT details ->> 'admin_email' FROM public.platform_audit_log WHERE action = 'create_gym') = 'invited1@test.dev', 'create_gym audit names the invited admin');
SELECT test.ok((SELECT actor_email FROM public.platform_audit_log WHERE action = 'create_gym') = 'owner@test.dev', 'audited as the calling owner, not a service role');

-- (look the id up as superuser: row-level security hides other gyms from the owner's own role)
RESET ROLE;
SELECT id AS iron_id FROM public.tenants WHERE name = 'Iron Temple' \gset
SELECT test.owner();
SELECT test.ok((public.platform_tenant_detail(:'iron_id') ->> 'access_state') = 'complimentary', 'the console shows it as complimentary');

-- no-expiry is allowed here (same rule as a manual grant) and a second call for the same user is refused
SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c2', 'Forever Gym', 'enterprise', NULL, 'partner');
SELECT test.expect_err($q$SELECT public.platform_provision_gym('00000000-0000-0000-0000-0000000000c2', 'Again', 'pro', NULL, 'long enough')$q$, '55000', 'already belongs', 'the same invitation cannot be provisioned twice');
RESET ROLE;
SELECT test.ok((SELECT ps.current_period_end IS NULL FROM public.platform_subscriptions ps JOIN public.tenants t ON t.id = ps.tenant_id WHERE t.name = 'Forever Gym'), 'no-expiry grant stores a null end');

-- A regular tenant admin sees none of it.
SELECT test.become('00000000-0000-0000-0000-0000000000b1', 'aal2', NULL);
SELECT test.ok((SELECT count(*) FROM public.tenants) = 1, 'a tenant admin can only see their own gym');
RESET ROLE;

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
