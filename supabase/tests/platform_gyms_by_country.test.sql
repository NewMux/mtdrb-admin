-- Tests for 20261024180000_platform_gyms_by_country.sql.
-- Same setup as the other platform tests (shim + schema + ALL migrations), then
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/platform_gyms_by_country.test.sql
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
-- Fixtures: 3 gyms in 2 countries, 1 with no setup, 1 with a junk value
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.dev'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1admin@test.dev'),
  ('00000000-0000-0000-0000-0000000000b1', 'tenant-admin@test.dev');
INSERT INTO auth.sessions (id, user_id, aal) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000a1', 'aal2'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000a2', 'aal1');
INSERT INTO auth.mfa_factors (user_id, friendly_name, factor_type, status) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner phone', 'totp', 'verified'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1 phone',  'totp', 'verified');
INSERT INTO public.platform_admins (user_id, note) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1 only');

INSERT INTO public.tenants (id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Bahrain 1'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Bahrain 2'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Germany 1'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'No setup'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Junk value');
INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin');
INSERT INTO public.gym_settings (tenant_id, metadata) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '{"general":{"country":"bh"}}'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '{"general":{"country":" BH "}}'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '{"general":{"country":"DE"}}'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '{"general":{"country":"Bahrain"}}');
INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'M', '1', 'm1@test.dev', 'basic', current_date),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'M', '2', 'm2@test.dev', 'basic', current_date),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'M', '3', 'm3@test.dev', 'basic', current_date);

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions
  (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end, trial_end) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'active',   'pro', 49, 'USD', 'paddle', 'sub_live',  now() + interval '20 days', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'trialing', 'pro', 49, 'USD', 'paddle', 'sub_trial', now() + interval '5 days', now() + interval '5 days');
SELECT set_config('request.jwt.claims', '', true);

-- 1. Only a fully verified platform admin
DO $$
DECLARE c text := 'SELECT public.platform_gyms_by_country()';
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

-- 2. The report
SELECT test.owner();
SELECT test.ok((public.platform_gyms_by_country() ->> 'total')::int = 5, 'every gym is counted exactly once');
SELECT test.ok((public.platform_gyms_by_country() ->> 'countries')::int = 2, 'two real countries');
SELECT test.ok((public.platform_gyms_by_country() #>> '{rows,0,country}') = 'BH', 'biggest country first, codes normalised');
SELECT test.ok((public.platform_gyms_by_country() #>> '{rows,0,gyms}')::int = 2, 'both Bahrain spellings land together');
SELECT test.ok((public.platform_gyms_by_country() #>> '{rows,0,paid}')::int = 1, 'paid count per country');
SELECT test.ok((public.platform_gyms_by_country() #>> '{rows,0,members}')::int = 3, 'member count per country');
SELECT test.ok((public.platform_gyms_by_country() #>> '{rows,1,country}') = 'DE', 'second country');
SELECT test.ok((public.platform_gyms_by_country() #>> '{rows,1,trialing}')::int = 1, 'trial count per country');
SELECT test.ok((public.platform_gyms_by_country() #>> '{rows,2,country}') IS NULL
               AND (public.platform_gyms_by_country() #>> '{rows,2,gyms}')::int = 2, 'no setup and a junk value are grouped as unknown, last');
RESET ROLE;

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
