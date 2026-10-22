-- Tests for 20261022090000_add_extra_locations.sql.
-- ============================================================================
-- Same setup as the other files here: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/extra_locations.test.sql
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

CREATE FUNCTION test.become_anon() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  SET LOCAL ROLE anon;
END;
$$;

-- Acts as the service role (what paddle-webhook / paddle-manage-locations use).
CREATE FUNCTION test.become_service() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  SET LOCAL ROLE service_role;
END;
$$;

CREATE FUNCTION test.add_branch(p_tenant uuid, p_name text) RETURNS void
LANGUAGE sql AS $$
  INSERT INTO public.branches (tenant_id, name) VALUES (p_tenant, p_name);
$$;

-- --------------------------------------------------------------------------
-- Fixtures (set up as the superuser, so triggers' service-role rules aside,
-- RLS is not in play until a test calls test.become)
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'grandfathered-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'paid-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a3', 'paid-trainer@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a4', 'manual-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a5', 'enterprise-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a6', 'other-paid-admin@test.dev', now());

INSERT INTO public.tenants (id, name) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Grandfathered Gym'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Paid Gym'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Manual Gym'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Enterprise Gym'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'Other Paid Gym');

INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'bbbbbbbb-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'bbbbbbbb-0000-0000-0000-000000000002', 'admin'),
  ('00000000-0000-0000-0000-0000000000a3', 'bbbbbbbb-0000-0000-0000-000000000002', 'trainer'),
  ('00000000-0000-0000-0000-0000000000a4', 'bbbbbbbb-0000-0000-0000-000000000003', 'admin'),
  ('00000000-0000-0000-0000-0000000000a5', 'bbbbbbbb-0000-0000-0000-000000000004', 'admin'),
  ('00000000-0000-0000-0000-0000000000a6', 'bbbbbbbb-0000-0000-0000-000000000005', 'admin');

-- Gym 1 has NO subscription row at all (grandfathered). Subscription rows are
-- service-role-only writes, so seed them as the service role.
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000002', 'active', 'starter', 20, 'BHD', 'paddle', 'sub_paid', now() + interval '20 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'active', 'pro', 0, 'BHD', 'manual', NULL, now() + interval '20 days'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'active', 'enterprise', 0, 'BHD', 'paddle', 'sub_ent', now() + interval '20 days'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'active', 'pro', 35, 'BHD', 'paddle', 'sub_other', now() + interval '20 days');

-- --------------------------------------------------------------------------
-- 1. tenant_location_limit(): who has a limit
-- --------------------------------------------------------------------------
SELECT test.ok(public.tenant_location_limit('bbbbbbbb-0000-0000-0000-000000000001') IS NULL, 'no subscription row => no limit (grandfathered)');
SELECT test.ok(public.tenant_location_limit('bbbbbbbb-0000-0000-0000-000000000002') = 1, 'paid plan with no extras => 1 location');
SELECT test.ok(public.tenant_location_limit('bbbbbbbb-0000-0000-0000-000000000003') IS NULL, 'manual grant => no limit');
SELECT test.ok(public.tenant_location_limit('bbbbbbbb-0000-0000-0000-000000000004') IS NULL, 'enterprise tier => no limit');
SELECT test.ok(public.tenant_location_limit('bbbbbbbb-0000-0000-0000-00000000ffff') IS NULL, 'unknown tenant => no limit (nothing to enforce)');

-- --------------------------------------------------------------------------
-- 2. The trigger on branches
-- --------------------------------------------------------------------------
-- Grandfathered / manual / enterprise tenants can create as many as they like.
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000001', 'G1');
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000001', 'G2');
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000001', 'G3');
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000003', 'M1');
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000003', 'M2');
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000004', 'E1');
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000004', 'E2');
SELECT test.ok((SELECT count(*) FROM public.branches WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000001') = 3, 'grandfathered gym created 3 branches');

-- A paid gym with no extras gets exactly one.
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000002', 'Main');
SELECT test.expect_err($q$SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000002', 'Second')$q$,
                       'LC001', 'location_limit_reached', 'second branch is refused without an extra location');
SELECT test.ok((SELECT count(*) FROM public.branches WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 1, 'the refused insert left no row');

-- Buying two extras (service role, as the webhook does) allows exactly two more.
SELECT test.become_service();
UPDATE public.platform_subscriptions SET extra_locations = 2 WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002';
RESET ROLE;
SELECT test.ok(public.tenant_location_limit('bbbbbbbb-0000-0000-0000-000000000002') = 3, 'two extras => limit 3');
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000002', 'Second');
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000002', 'Third');
SELECT test.expect_err($q$SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000002', 'Fourth')$q$,
                       'LC001', 'location_limit_reached', 'fourth branch is refused with two extras');

-- Another paid tenant's branches do not count against this one.
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000005', 'Other main');
SELECT test.ok((SELECT count(*) FROM public.branches WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000005') = 1, 'limits are per tenant');

-- Lowering extras below what is in use removes nothing, but blocks more inserts.
SELECT test.become_service();
UPDATE public.platform_subscriptions SET extra_locations = 0 WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002';
RESET ROLE;
SELECT test.ok((SELECT count(*) FROM public.branches WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 3, 'existing branches survive a downgrade');
SELECT test.expect_err($q$SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000002', 'Again')$q$,
                       'LC001', 'location_limit_reached', 'over-limit tenant cannot add more');
-- Deleting one of the three frees nothing yet (2 left > limit 1) ...
DELETE FROM public.branches WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002' AND name = 'Third';
SELECT test.expect_err($q$SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000002', 'Again')$q$,
                       'LC001', 'location_limit_reached', 'still over limit after deleting one');
-- ... but down to one it is still full, and down to zero a slot opens.
DELETE FROM public.branches WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002';
SELECT test.add_branch('bbbbbbbb-0000-0000-0000-000000000002', 'Fresh main');

-- The limit also applies through RLS as the signed-in admin (the real path).
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.expect_err($q$INSERT INTO public.branches (tenant_id, name) VALUES ('bbbbbbbb-0000-0000-0000-000000000002', 'Via REST')$q$,
                       'LC001', 'location_limit_reached', 'tenant admin insert is limited too');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 3. extra_locations cannot be set by a tenant admin
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.expect_err($q$UPDATE public.platform_subscriptions SET extra_locations = 10 WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002'$q$,
                       'P0001', 'may only cancel', 'plain self-service raise is rejected');
-- The sneaky version: cancel AND raise in one update. The raise must be dropped.
UPDATE public.platform_subscriptions SET status = 'cancelled', extra_locations = 10 WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002';
RESET ROLE;
SELECT test.ok((SELECT extra_locations FROM public.platform_subscriptions WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 0,
               'cancel + raise: extra_locations is pinned to its old value');
SELECT test.ok((SELECT status FROM public.platform_subscriptions WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 'cancelled',
               'cancel + raise: the cancellation itself still applied');
SELECT test.ok(public.tenant_location_limit('bbbbbbbb-0000-0000-0000-000000000002') = 1,
               'a cancelled tenant keeps the base limit and gains nothing');

-- --------------------------------------------------------------------------
-- 4. Range constraint
-- --------------------------------------------------------------------------
SELECT test.become_service();
SELECT test.expect_err($q$UPDATE public.platform_subscriptions SET extra_locations = -1 WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000005'$q$,
                       '23514', NULL, 'negative extras rejected');
SELECT test.expect_err($q$UPDATE public.platform_subscriptions SET extra_locations = 51 WHERE tenant_id = 'bbbbbbbb-0000-0000-0000-000000000005'$q$,
                       '23514', NULL, 'more than 50 extras rejected');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 5. get_location_usage()
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.ok((public.get_location_usage() ->> 'tenant_id') = 'bbbbbbbb-0000-0000-0000-000000000002', 'usage is for the caller''s own gym');
SELECT test.ok((public.get_location_usage() ->> 'used')::int = 1, 'usage counts branches');
SELECT test.ok((public.get_location_usage() ->> 'limit')::int = 1, 'usage reports the limit');
SELECT test.ok((public.get_location_usage() ->> 'is_admin')::boolean, 'admin is flagged as admin');
SELECT test.ok((public.get_location_usage() ->> 'billing_provider') = 'paddle', 'usage reports the billing provider');
RESET ROLE;

SELECT test.become('00000000-0000-0000-0000-0000000000a3');
SELECT test.ok(NOT (public.get_location_usage() ->> 'is_admin')::boolean, 'trainer is not flagged as admin');
RESET ROLE;

SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT test.ok((public.get_location_usage() -> 'limit') = 'null'::jsonb, 'grandfathered gym: limit is null (unlimited)');
SELECT test.ok((public.get_location_usage() ->> 'used')::int = 3, 'grandfathered gym: usage still counted');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 6. Privileges
-- --------------------------------------------------------------------------
SELECT test.become_anon();
SELECT test.expect_err('SELECT public.get_location_usage()', '42501', NULL, 'anon cannot call get_location_usage');
RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.expect_err($q$SELECT public.tenant_location_limit('bbbbbbbb-0000-0000-0000-000000000002')$q$, '42501', NULL, 'authenticated cannot call tenant_location_limit');
SELECT test.expect_err('SELECT public.enforce_branch_limit()', '42501', NULL, 'authenticated cannot call the trigger function');
RESET ROLE;
SELECT test.become_anon();
SELECT test.expect_err($q$SELECT public.tenant_location_limit('bbbbbbbb-0000-0000-0000-000000000002')$q$, '42501', NULL, 'anon cannot call tenant_location_limit');
RESET ROLE;

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
