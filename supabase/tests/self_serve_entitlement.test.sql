-- Tests for 20261023090000_new_gyms_need_a_subscription.sql.
-- ============================================================================
-- Same setup as the other files here: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/self_serve_entitlement.test.sql
--
-- Everything runs in one transaction that is rolled back. The first failed
-- assertion aborts with "TEST FAILED".

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
  IF p_cond IS NOT TRUE THEN
    RAISE EXCEPTION 'TEST FAILED: %', p_label;
  END IF;
  UPDATE test.counter SET n = n + 1;
END;
$$;

CREATE FUNCTION test.expect_err(p_sql text, p_state text, p_msg text, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION 'TEST FAILED: % (expected error %, got none)', p_label, p_state;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'TEST FAILED:%' THEN
    RAISE;
  END IF;
  IF SQLSTATE <> p_state OR (p_msg IS NOT NULL AND position(p_msg IN SQLERRM) = 0) THEN
    RAISE EXCEPTION 'TEST FAILED: % (expected % "%", got % "%")', p_label, p_state, p_msg, SQLSTATE, SQLERRM;
  END IF;
  UPDATE test.counter SET n = n + 1;
END;
$$;

CREATE FUNCTION test.become(p_user uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', jsonb_build_object(
    'sub', p_user, 'role', 'authenticated', 'aal', 'aal1',
    'email', (SELECT email FROM auth.users WHERE id = p_user)
  )::text, true);
  SET LOCAL ROLE authenticated;
END;
$$;

CREATE FUNCTION test.become_service() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  SET LOCAL ROLE service_role;
END;
$$;

-- --------------------------------------------------------------------------
-- Fixtures
--   1  new gym (self-serve sign-up), never paid, no subscription row
--   2  legacy gym: no row, listed in legacy_unbilled_tenants
--   3  new gym that paid
--   4  another new gym, never paid (for the cross-tenant checks)
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'new-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000e2', 'legacy-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000e3', 'paid-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000e4', 'other-admin@test.dev', now());

INSERT INTO public.tenants (id, name, created_at) VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', 'New Unpaid Gym', now()),
  ('eeeeeeee-0000-0000-0000-000000000002', 'Legacy Gym', timestamptz '2026-05-01 00:00:00+00'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'New Paid Gym', now()),
  ('eeeeeeee-0000-0000-0000-000000000004', 'Other Unpaid Gym', now());

INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'eeeeeeee-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000e2', 'eeeeeeee-0000-0000-0000-000000000002', 'admin'),
  ('00000000-0000-0000-0000-0000000000e3', 'eeeeeeee-0000-0000-0000-000000000003', 'admin'),
  ('00000000-0000-0000-0000-0000000000e4', 'eeeeeeee-0000-0000-0000-000000000004', 'admin');

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.legacy_unbilled_tenants (tenant_id) VALUES ('eeeeeeee-0000-0000-0000-000000000002');
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end) VALUES
  ('eeeeeeee-0000-0000-0000-000000000003', 'active', 'starter', 20, 'BHD', 'paddle', 'sub_new_paid', now() + interval '20 days');

-- --------------------------------------------------------------------------
-- 1. Entitlement with no subscription row
-- --------------------------------------------------------------------------
SELECT test.ok(NOT public.is_tenant_entitled('eeeeeeee-0000-0000-0000-000000000001'), 'a new gym with no subscription is NOT entitled');
SELECT test.ok(public.is_tenant_entitled('eeeeeeee-0000-0000-0000-000000000002'), 'a legacy gym with no subscription keeps access');
SELECT test.ok(public.is_tenant_entitled('eeeeeeee-0000-0000-0000-000000000003'), 'a new gym that paid has access');
SELECT test.ok(NOT public.is_tenant_entitled('99999999-0000-0000-0000-000000000009'), 'an unknown gym is not entitled');

-- --------------------------------------------------------------------------
-- 2. The database refuses writes from an unpaid new gym, even straight through the API
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000e1');
SELECT test.expect_err($q$INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status) VALUES ('eeeeeeee-0000-0000-0000-000000000001', 'Free', 'Rider', 'free@rider.dev', 'basic', current_date, 'active')$q$,
                       '42501', NULL, 'an unpaid new gym cannot create members');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.members WHERE email = 'free@rider.dev'), 'and no row was written');

SELECT test.become('00000000-0000-0000-0000-0000000000e2');
INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status)
  VALUES ('eeeeeeee-0000-0000-0000-000000000002', 'Old', 'Timer', 'old@timer.dev', 'basic', current_date, 'active');
RESET ROLE;
SELECT test.ok(EXISTS (SELECT 1 FROM public.members WHERE email = 'old@timer.dev'), 'a legacy gym can still create members');

SELECT test.become('00000000-0000-0000-0000-0000000000e3');
INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status)
  VALUES ('eeeeeeee-0000-0000-0000-000000000003', 'Paying', 'Customer', 'paying@customer.dev', 'basic', current_date, 'active');
RESET ROLE;
SELECT test.ok(EXISTS (SELECT 1 FROM public.members WHERE email = 'paying@customer.dev'), 'a new gym that paid can create members');

-- Paying later flips the unpaid gym on without anything else changing.
SELECT test.become_service();
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end)
  VALUES ('eeeeeeee-0000-0000-0000-000000000001', 'active', 'starter', 20, 'BHD', 'paddle', 'sub_now_paid', now() + interval '30 days');
RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000e1');
INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status)
  VALUES ('eeeeeeee-0000-0000-0000-000000000001', 'Now', 'Paid', 'now@paid.dev', 'basic', current_date, 'active');
RESET ROLE;
SELECT test.ok(EXISTS (SELECT 1 FROM public.members WHERE email = 'now@paid.dev'), 'once its subscription row exists the gym can write');

-- --------------------------------------------------------------------------
-- 3. A tenant admin cannot grandfather themselves (the table is closed)
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000e4');
SELECT test.expect_err($q$INSERT INTO public.legacy_unbilled_tenants (tenant_id) VALUES ('eeeeeeee-0000-0000-0000-000000000004')$q$,
                       '42501', NULL, 'a tenant admin cannot add their gym to the legacy list');
SELECT test.expect_err($q$SELECT * FROM public.legacy_unbilled_tenants$q$,
                       '42501', NULL, 'nor read it');
-- Backdating the gym (if the tenants policy even allows it) must not help: the
-- legacy list is fixed, not derived from created_at.
UPDATE public.tenants SET created_at = timestamptz '2020-01-01' WHERE id = 'eeeeeeee-0000-0000-0000-000000000004';
RESET ROLE;
SELECT test.ok(NOT public.is_tenant_entitled('eeeeeeee-0000-0000-0000-000000000004'), 'so the other unpaid gym is still not entitled, backdated or not');

-- --------------------------------------------------------------------------
-- 4. Location limit follows the same rule
-- --------------------------------------------------------------------------
SELECT test.ok(public.tenant_location_limit('eeeeeeee-0000-0000-0000-000000000004') = 1, 'an unpaid new gym is limited to the one included location');
SELECT test.ok(public.tenant_location_limit('eeeeeeee-0000-0000-0000-000000000002') IS NULL, 'a legacy gym still has no limit');
SELECT test.ok(public.tenant_location_limit('99999999-0000-0000-0000-000000000009') IS NULL, 'an unknown gym has nothing to enforce');

-- --------------------------------------------------------------------------
-- 5. Privileges
-- --------------------------------------------------------------------------
SELECT test.ok(NOT has_table_privilege('anon', 'public.legacy_unbilled_tenants', 'SELECT, INSERT, UPDATE, DELETE'), 'anon has no access to the legacy list');
SELECT test.ok(NOT has_table_privilege('authenticated', 'public.legacy_unbilled_tenants', 'SELECT, INSERT, UPDATE, DELETE'), 'authenticated has no access to the legacy list');
SELECT test.ok(NOT has_function_privilege('anon', 'public.is_tenant_entitled(uuid)', 'EXECUTE'), 'anon still cannot call is_tenant_entitled');
SELECT test.ok(has_function_privilege('authenticated', 'public.is_tenant_entitled(uuid)', 'EXECUTE'), 'authenticated still can (policies need it)');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.tenant_location_limit(uuid)', 'EXECUTE'), 'tenant_location_limit stays internal');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
