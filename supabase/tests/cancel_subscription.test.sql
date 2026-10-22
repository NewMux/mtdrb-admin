-- Tests for 20261022120000_cancel_at_and_billing_only_writes.sql.
-- ============================================================================
-- Same setup as the other files here: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/cancel_subscription.test.sql
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
  ('00000000-0000-0000-0000-0000000000c1', 'alpha-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000c2', 'bravo-admin@test.dev', now());

INSERT INTO public.tenants (id, name) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'Alpha Gym'),
  ('cccccccc-0000-0000-0000-000000000002', 'Bravo Gym');

INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000c1', 'cccccccc-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000c2', 'cccccccc-0000-0000-0000-000000000002', 'admin');

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'active', 'starter', 20, 'BHD', 'paddle', 'sub_alpha', now() + interval '12 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'active', 'pro', 35, 'BHD', 'paddle', 'sub_bravo', now() + interval '12 days');

-- --------------------------------------------------------------------------
-- 1. The service role records a scheduled cancellation; access continues
-- --------------------------------------------------------------------------
SELECT test.ok((SELECT cancel_at FROM public.platform_subscriptions WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001') IS NULL,
               'a new subscription is not cancelling');

SELECT test.become_service();
UPDATE public.platform_subscriptions SET cancel_at = now() + interval '12 days' WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001';
RESET ROLE;

SELECT test.ok((SELECT cancel_at IS NOT NULL FROM public.platform_subscriptions WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001'),
               'service role can schedule a cancellation');
SELECT test.ok((SELECT status FROM public.platform_subscriptions WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001') = 'active',
               'a scheduled cancellation leaves the row active');
SELECT test.ok(public.is_tenant_entitled('cccccccc-0000-0000-0000-000000000001'),
               'the gym keeps access while the paid period runs');

-- ...and loses it when the period is over, even if the final webhook never arrived.
SELECT test.become_service();
UPDATE public.platform_subscriptions SET current_period_end = now() - interval '1 minute' WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001';
RESET ROLE;
SELECT test.ok(NOT public.is_tenant_entitled('cccccccc-0000-0000-0000-000000000001'),
               'access ends at the period end even if the cancelled event is missed');

-- Resuming clears it.
SELECT test.become_service();
UPDATE public.platform_subscriptions SET cancel_at = NULL, current_period_end = now() + interval '30 days' WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001';
RESET ROLE;
SELECT test.ok((SELECT cancel_at IS NULL FROM public.platform_subscriptions WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001'),
               'service role can clear a scheduled cancellation');

-- --------------------------------------------------------------------------
-- 2. A tenant admin can no longer write the row at all
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000c1');
SELECT test.expect_err($q$UPDATE public.platform_subscriptions SET status = 'cancelled' WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001'$q$,
                       'P0001', 'through billing', 'the old client-side cancel is rejected');
SELECT test.expect_err($q$UPDATE public.platform_subscriptions SET cancel_at = now() + interval '1 day' WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001'$q$,
                       'P0001', 'through billing', 'a tenant admin cannot schedule a cancellation');
SELECT test.expect_err($q$UPDATE public.platform_subscriptions SET cancel_at = NULL WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001'$q$,
                       'P0001', 'through billing', 'a tenant admin cannot clear one either');
SELECT test.expect_err($q$UPDATE public.platform_subscriptions SET metadata = '{}'::jsonb WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001'$q$,
                       'P0001', 'through billing', 'not even harmless-looking columns');
SELECT test.expect_err($q$INSERT INTO public.platform_subscriptions (tenant_id, status) VALUES ('cccccccc-0000-0000-0000-000000000001', 'active')$q$,
                       'P0001', NULL, 'and cannot insert');
RESET ROLE;
SELECT test.ok((SELECT status FROM public.platform_subscriptions WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001') = 'active',
               'the rejected writes changed nothing');

-- --------------------------------------------------------------------------
-- 3. A tenant can still READ its own row (including cancel_at), and only its own
-- --------------------------------------------------------------------------
SELECT test.become_service();
UPDATE public.platform_subscriptions SET cancel_at = now() + interval '5 days' WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000002';
RESET ROLE;

SELECT test.become('00000000-0000-0000-0000-0000000000c2');
SELECT test.ok((SELECT count(*) FROM public.platform_subscriptions) = 1, 'a tenant sees exactly one subscription row');
SELECT test.ok((SELECT cancel_at IS NOT NULL FROM public.platform_subscriptions), 'and can read its own cancel_at');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.platform_subscriptions WHERE tenant_id = 'cccccccc-0000-0000-0000-000000000001'),
               'but not another gym''s row');
RESET ROLE;

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
