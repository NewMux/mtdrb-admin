-- Tests for 20261022150000_past_due_grace.sql.
-- ============================================================================
-- Same setup as the other files here: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/past_due_grace.test.sql
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
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000d1', 'grace-admin@test.dev', now());

INSERT INTO public.tenants (id, name) VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'Grace Gym'),
  ('dddddddd-0000-0000-0000-000000000002', 'Lapsed Gym'),
  ('dddddddd-0000-0000-0000-000000000003', 'Paid Gym'),
  ('dddddddd-0000-0000-0000-000000000004', 'Cancelled Gym');

INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000d1', 'dddddddd-0000-0000-0000-000000000001', 'admin');

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end, grace_until) VALUES
  -- renewal failed 2 days ago; 5 days of grace left
  ('dddddddd-0000-0000-0000-000000000001', 'past_due', 'starter', 20, 'BHD', 'paddle', 'sub_grace',  now() - interval '2 days', now() + interval '5 days'),
  -- renewal failed 9 days ago; grace ended 2 days ago
  ('dddddddd-0000-0000-0000-000000000002', 'past_due', 'starter', 20, 'BHD', 'paddle', 'sub_lapsed', now() - interval '9 days', now() - interval '2 days'),
  ('dddddddd-0000-0000-0000-000000000003', 'active',   'pro',     35, 'BHD', 'paddle', 'sub_paid',   now() + interval '10 days', NULL),
  ('dddddddd-0000-0000-0000-000000000004', 'cancelled','starter', 20, 'BHD', 'paddle', 'sub_gone',   now() - interval '1 day', NULL);

-- --------------------------------------------------------------------------
-- 1. Who is entitled
-- --------------------------------------------------------------------------
SELECT test.ok(public.is_tenant_entitled('dddddddd-0000-0000-0000-000000000001'), 'past_due inside the grace window keeps access');
SELECT test.ok(NOT public.is_tenant_entitled('dddddddd-0000-0000-0000-000000000002'), 'past_due after the grace window loses access');
SELECT test.ok(public.is_tenant_entitled('dddddddd-0000-0000-0000-000000000003'), 'an active paid subscription is unaffected');
SELECT test.ok(NOT public.is_tenant_entitled('dddddddd-0000-0000-0000-000000000004'), 'a cancelled subscription is unaffected');

-- past_due with NO grace date never grants access (fail closed).
SELECT test.become_service();
UPDATE public.platform_subscriptions SET grace_until = NULL WHERE tenant_id = 'dddddddd-0000-0000-0000-000000000001';
RESET ROLE;
SELECT test.ok(NOT public.is_tenant_entitled('dddddddd-0000-0000-0000-000000000001'), 'past_due without a grace date fails closed');

-- Recovery: the webhook sets status back to active and clears the grace date.
SELECT test.become_service();
UPDATE public.platform_subscriptions
   SET status = 'active', grace_until = NULL, current_period_end = now() + interval '30 days'
 WHERE tenant_id = 'dddddddd-0000-0000-0000-000000000001';
RESET ROLE;
SELECT test.ok(public.is_tenant_entitled('dddddddd-0000-0000-0000-000000000001'), 'a recovered payment restores normal access');

-- The boundary: now() is fixed for the whole transaction, so test the edge
-- directly. Grace that ends exactly now is not access; one second later is.
SELECT test.become_service();
UPDATE public.platform_subscriptions SET status = 'past_due', grace_until = now() + interval '1 second'
 WHERE tenant_id = 'dddddddd-0000-0000-0000-000000000001';
RESET ROLE;
SELECT test.ok(public.is_tenant_entitled('dddddddd-0000-0000-0000-000000000001'), 'one second of grace left is still access');
SELECT test.become_service();
UPDATE public.platform_subscriptions SET grace_until = now() WHERE tenant_id = 'dddddddd-0000-0000-0000-000000000001';
RESET ROLE;
SELECT test.ok(NOT public.is_tenant_entitled('dddddddd-0000-0000-0000-000000000001'), 'grace that ends exactly now is not access');

-- --------------------------------------------------------------------------
-- 2. A tenant cannot extend its own grace
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000d1');
SELECT test.expect_err($q$UPDATE public.platform_subscriptions SET grace_until = now() + interval '3650 days' WHERE tenant_id = 'dddddddd-0000-0000-0000-000000000001'$q$,
                       'P0001', 'through billing', 'a tenant admin cannot move grace_until');
SELECT test.expect_err($q$UPDATE public.platform_subscriptions SET status = 'past_due', grace_until = now() + interval '3650 days' WHERE tenant_id = 'dddddddd-0000-0000-0000-000000000001'$q$,
                       'P0001', 'through billing', 'nor set past_due with a long grace');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 3. The write-gating policies follow the same rule (members is gated on it)
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000d1');
SELECT test.expect_err($q$INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status) VALUES ('dddddddd-0000-0000-0000-000000000001', 'Late', 'Payer', 'late@payer.dev', 'basic', current_date, 'active')$q$,
                       '42501', NULL, 'once grace is over, creating members is refused');
RESET ROLE;
SELECT test.become_service();
UPDATE public.platform_subscriptions SET grace_until = now() + interval '2 days' WHERE tenant_id = 'dddddddd-0000-0000-0000-000000000001';
RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000d1');
INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status)
  VALUES ('dddddddd-0000-0000-0000-000000000001', 'Still', 'Here', 'still@here.dev', 'basic', current_date, 'active');
RESET ROLE;
SELECT test.ok(EXISTS (SELECT 1 FROM public.members WHERE email = 'still@here.dev'), 'inside grace, the gym can keep creating members');

-- --------------------------------------------------------------------------
-- 4. Privileges survived the function replacement
-- --------------------------------------------------------------------------
SELECT test.ok(NOT has_function_privilege('anon', 'public.is_tenant_entitled(uuid)', 'EXECUTE'), 'anon still cannot call is_tenant_entitled');
SELECT test.ok(has_function_privilege('authenticated', 'public.is_tenant_entitled(uuid)', 'EXECUTE'), 'authenticated still can (policies need it)');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
