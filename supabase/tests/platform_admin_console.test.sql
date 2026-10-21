-- Tests for 20261019090000_create_platform_admin_console.sql.
-- ============================================================================
-- Run against a database that has supabase/tests/support/supabase_shim.sql,
-- supabase/schema.sql and ALL migrations applied (or a local Supabase stack):
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/platform_admin_console.test.sql
--
-- Everything runs inside one transaction that is rolled back, so the database
-- is left untouched. The first failed assertion aborts with "TEST FAILED".
-- Callers are impersonated exactly as PostgREST does it: SET LOCAL ROLE plus
-- request.jwt.claims (sub, role, aal, session_id).

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

-- Runs p_sql and requires it to fail with p_state (and, if given, a message
-- containing p_msg).
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

-- --------------------------------------------------------------------------
-- Fixtures (as superuser; subscription inserts need the service-role claim
-- because the self-service trigger forbids anything else)
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.dev',  now() - interval '1 hour'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1@test.dev',   now()),
  ('00000000-0000-0000-0000-0000000000a3', 'nofactor@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a4', 'deadsess@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000b1', 'admin-a@test.dev', now() - interval '2 days'),
  ('00000000-0000-0000-0000-0000000000b2', 'admin-b@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000c1', 'outsider@test.dev', now());

INSERT INTO auth.sessions (id, user_id, aal) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000a1', 'aal2'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000a2', 'aal1'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-0000000000a3', 'aal2');

INSERT INTO auth.mfa_factors (user_id, friendly_name, factor_type, status) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner phone', 'totp', 'verified'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1 phone',  'totp', 'verified'),
  ('00000000-0000-0000-0000-0000000000a3', 'half enrolled', 'totp', 'unverified'),
  ('00000000-0000-0000-0000-0000000000a4', 'dead phone',  'totp', 'verified');

INSERT INTO public.platform_admins (user_id, note) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1 only'),
  ('00000000-0000-0000-0000-0000000000a3', 'no verified factor'),
  ('00000000-0000-0000-0000-0000000000a4', 'dead session');

INSERT INTO public.tenants (id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Alpha Gym (awaiting)'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Bravo Gym (paddle live)'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Charlie Gym (paddle cancelled)'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Delta Gym (comp)'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Echo Gym (paddle lapsed)');

INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000b2', 'aaaaaaaa-0000-0000-0000-000000000002', 'admin'),
  -- the owner also runs gym Delta, so a flagless direct write can pass RLS
  ('00000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000004', 'admin');

INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Secret', 'Person', 'secret@member.dev', 'basic', current_date, 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Other',  'Person', 'other@member.dev',  'basic', current_date, 'inactive');

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions
  (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'active',    'pro',     130, 'USD', 'paddle', 'sub_live',   now() + interval '20 days'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'cancelled', 'starter',  80, 'USD', 'paddle', 'sub_old',    now() - interval '5 days'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'active',    'pro',       0, 'AED', 'manual', NULL,         now() + interval '7 days'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'active',    'starter',  80, 'USD', 'paddle', 'sub_lapsed', now() - interval '3 days');
SELECT set_config('request.jwt.claims', '', true);

-- --------------------------------------------------------------------------
-- 1. Gate: platform_admin_status() for every kind of caller
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000c1', 'aal2', NULL);
SELECT test.ok(public.platform_admin_status() = 'not_admin', 'outsider (not allowlisted) => not_admin');

RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000b1', 'aal2', NULL);
SELECT test.ok(public.platform_admin_status() = 'not_admin', 'tenant admin => not_admin');

RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000a2', 'aal1', '22222222-2222-2222-2222-222222222222');
SELECT test.ok(public.platform_admin_status() = 'mfa_required', 'allowlisted but aal1 => mfa_required');

RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000a3', 'aal2', '33333333-3333-3333-3333-333333333333');
SELECT test.ok(public.platform_admin_status() = 'mfa_required', 'aal2 claim but no VERIFIED factor => mfa_required');

RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000a4', 'aal2', '44444444-4444-4444-4444-444444444444');
SELECT test.ok(public.platform_admin_status() = 'mfa_required', 'aal2 claim but session row gone (signed out) => mfa_required');

RESET ROLE;
SELECT set_config('request.jwt.claims', jsonb_build_object(
  'sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated', 'aal', 'aal2', 'session_id', 'not-a-uuid')::text, true);
SET LOCAL ROLE authenticated;
SELECT test.ok(public.platform_admin_status() = 'mfa_required', 'malformed session_id claim => mfa_required, no exception');

RESET ROLE;
SELECT set_config('request.jwt.claims', jsonb_build_object(
  'sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated', 'aal', 'aal2')::text, true);
SET LOCAL ROLE authenticated;
SELECT test.ok(public.platform_admin_status() = 'mfa_required', 'missing session_id claim => mfa_required');

RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');
SELECT test.ok(public.platform_admin_status() = 'ok', 'owner with aal2 + verified factor + live session => ok');

-- A session that exists but is only aal1 must not pass even with an aal2 claim.
RESET ROLE;
UPDATE auth.sessions SET aal = 'aal1' WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');
SELECT test.ok(public.platform_admin_status() = 'mfa_required', 'session row downgraded to aal1 => mfa_required');
RESET ROLE;
UPDATE auth.sessions SET aal = 'aal2' WHERE id = '11111111-1111-1111-1111-111111111111';

-- Service role / SQL editor have no auth.uid(), so they are not admins either.
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SELECT test.ok(public.platform_admin_status() = 'not_admin', 'service role (no uid) => not_admin');
SELECT set_config('request.jwt.claims', '', true);

-- --------------------------------------------------------------------------
-- 2. Every RPC is denied with the SAME error to every non-admin kind of caller
-- --------------------------------------------------------------------------
CREATE TEMP TABLE rpc_calls (sql text);
INSERT INTO rpc_calls VALUES
  ('SELECT public.platform_overview()'),
  ('SELECT public.platform_list_tenants()'),
  ('SELECT public.platform_tenant_detail(''aaaaaaaa-0000-0000-0000-000000000001'')'),
  ('SELECT public.platform_list_audit_log()'),
  ('SELECT public.platform_grant_access(''aaaaaaaa-0000-0000-0000-000000000001'', ''pro'', NULL, ''should not work'')'),
  ('SELECT public.platform_revoke_access(''aaaaaaaa-0000-0000-0000-000000000004'', ''should not work'')'),
  ('SELECT public.platform_add_note(''aaaaaaaa-0000-0000-0000-000000000001'', ''should not work'')');
GRANT SELECT ON rpc_calls TO PUBLIC;

DO $$
DECLARE
  r record;
  c record;
BEGIN
  FOR c IN
    SELECT * FROM (VALUES
      ('outsider',      '00000000-0000-0000-0000-0000000000c1', 'aal2', NULL),
      ('tenant admin',  '00000000-0000-0000-0000-0000000000b1', 'aal2', NULL),
      ('allowlisted aal1', '00000000-0000-0000-0000-0000000000a2', 'aal1', '22222222-2222-2222-2222-222222222222'),
      ('no verified factor', '00000000-0000-0000-0000-0000000000a3', 'aal2', '33333333-3333-3333-3333-333333333333'),
      ('dead session',  '00000000-0000-0000-0000-0000000000a4', 'aal2', '44444444-4444-4444-4444-444444444444')
    ) AS v(label, uid, aal, sid)
  LOOP
    FOR r IN SELECT sql FROM rpc_calls LOOP
      PERFORM set_config('request.jwt.claims', jsonb_build_object(
        'sub', c.uid, 'role', 'authenticated', 'aal', c.aal, 'session_id', c.sid)::text, true);
      EXECUTE 'SET LOCAL ROLE authenticated';
      PERFORM test.expect_err(r.sql, '42501', 'forbidden', c.label || ' denied: ' || r.sql);
      EXECUTE 'RESET ROLE';
    END LOOP;
  END LOOP;

  -- anon cannot even execute them (EXECUTE revoked), regardless of claims
  FOR r IN SELECT sql FROM rpc_calls LOOP
    PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
    EXECUTE 'SET LOCAL ROLE anon';
    PERFORM test.expect_err(r.sql, '42501', NULL, 'anon denied: ' || r.sql);
    EXECUTE 'RESET ROLE';
  END LOOP;
END
$$;

-- --------------------------------------------------------------------------
-- 3. Privilege matrix (catches any future platform_* function that slips
--    through Supabase's default grants)
-- --------------------------------------------------------------------------
DO $$
DECLARE
  f record;
  client_rpcs text[] := ARRAY[
    'platform_admin_status', 'platform_overview', 'platform_list_tenants',
    'platform_tenant_detail', 'platform_list_audit_log', 'platform_grant_access',
    'platform_revoke_access', 'platform_add_note'
  ];
  seen integer := 0;
BEGIN
  FOR f IN
    SELECT p.oid, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND (p.proname LIKE 'platform\_%' OR p.proname = 'require_platform_admin')
  LOOP
    seen := seen + 1;
    PERFORM test.ok(NOT has_function_privilege('anon', f.oid, 'EXECUTE'), f.proname || ': anon must not execute');
    PERFORM test.ok(has_function_privilege('authenticated', f.oid, 'EXECUTE') = (f.proname = ANY (client_rpcs)),
                    f.proname || ': authenticated EXECUTE only on the client RPCs');
  END LOOP;
  PERFORM test.ok(seen >= 13, 'privilege loop saw the expected number of platform functions (' || seen || ')');

  PERFORM test.ok(NOT has_function_privilege('anon', 'public.enforce_platform_subscription_self_service()'::regprocedure, 'EXECUTE'),
                  'trigger function: anon cannot execute');
  PERFORM test.ok(NOT has_function_privilege('authenticated', 'public.enforce_platform_subscription_self_service()'::regprocedure, 'EXECUTE'),
                  'trigger function: authenticated cannot execute');

  FOR f IN SELECT unnest(ARRAY['platform_admins', 'platform_audit_log']) AS t LOOP
    PERFORM test.ok(NOT has_table_privilege('anon', 'public.' || f.t, 'SELECT,INSERT,UPDATE,DELETE'), f.t || ': anon has no table privileges');
    PERFORM test.ok(NOT has_table_privilege('authenticated', 'public.' || f.t, 'SELECT'), f.t || ': authenticated cannot SELECT');
    PERFORM test.ok(NOT has_table_privilege('authenticated', 'public.' || f.t, 'INSERT'), f.t || ': authenticated cannot INSERT');
    PERFORM test.ok((SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || f.t)::regclass), f.t || ': RLS enabled');
  END LOOP;
  PERFORM test.ok(NOT has_sequence_privilege('authenticated', 'public.platform_audit_log_id_seq', 'USAGE'),
                  'audit sequence: authenticated has no USAGE');
END
$$;

-- direct table access from a client role is refused outright
SELECT test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');
SELECT test.expect_err('SELECT * FROM public.platform_admins', '42501', NULL, 'owner cannot read platform_admins directly');
SELECT test.expect_err('SELECT * FROM public.platform_audit_log', '42501', NULL, 'owner cannot read audit log directly');
SELECT test.expect_err('INSERT INTO public.platform_admins (user_id) VALUES (''00000000-0000-0000-0000-0000000000c1'')',
                       '42501', NULL, 'owner cannot self-extend the allowlist');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 4. Reads as the real owner
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');

SELECT test.ok((public.platform_overview() #>> '{totals,tenants}')::int = 5, 'overview: 5 tenants');
SELECT test.ok((public.platform_overview() #>> '{by_state,awaiting_activation}')::int = 1, 'overview: 1 awaiting activation');
SELECT test.ok((public.platform_overview() #>> '{by_state,paid}')::int = 1, 'overview: 1 paid');
SELECT test.ok((public.platform_overview() #>> '{by_state,complimentary}')::int = 1, 'overview: 1 complimentary');
SELECT test.ok((public.platform_overview() #>> '{by_state,inactive}')::int = 2, 'overview: 2 inactive (cancelled + lapsed paddle)');
SELECT test.ok((public.platform_overview() #>> '{by_state,trialing}')::int = 0, 'overview: 0 trialing');
SELECT test.ok(jsonb_array_length(public.platform_overview() -> 'ending_soon') = 1, 'overview: the comp ending in 7 days is listed');
SELECT test.ok((public.platform_overview() #>> '{awaiting_activation,0,members}')::int = 2, 'overview: awaiting queue carries member COUNT');
SELECT test.ok((public.platform_overview() #>> '{awaiting_activation,0,admin_email}') = 'admin-a@test.dev', 'overview: awaiting queue shows the admin email');
SELECT test.ok(public.platform_overview()::text NOT LIKE '%secret@member.dev%' AND public.platform_overview()::text NOT LIKE '%Secret%',
               'overview never exposes member PII');

SELECT test.ok((public.platform_list_tenants() ->> 'total')::int = 5, 'list: total 5');
SELECT test.ok(jsonb_array_length(public.platform_list_tenants() -> 'rows') = 5, 'list: 5 rows');
SELECT test.ok((public.platform_list_tenants(NULL, 'awaiting_activation') ->> 'total')::int = 1, 'list: awaiting filter = tenants with NO row only');
SELECT test.ok((public.platform_list_tenants(NULL, 'awaiting_activation') #>> '{rows,0,name}') = 'Alpha Gym (awaiting)', 'list: awaiting row is Alpha');
SELECT test.ok((public.platform_list_tenants(NULL, 'inactive') ->> 'total')::int = 2, 'list: inactive filter');
SELECT test.ok((public.platform_list_tenants(NULL, 'ending_soon') ->> 'total')::int = 1, 'list: ending_soon filter');
SELECT test.ok((public.platform_list_tenants('BRAVO') ->> 'total')::int = 1, 'list: search is case-insensitive on name');
SELECT test.ok((public.platform_list_tenants('admin-b@') ->> 'total')::int = 1, 'list: search matches admin email');
SELECT test.ok((public.platform_list_tenants('%') ->> 'total')::int = 0, 'list: % is a literal, not a wildcard');
SELECT test.ok((public.platform_list_tenants('_') ->> 'total')::int = 0, 'list: _ is a literal, not a wildcard');
SELECT test.ok((public.platform_list_tenants(NULL, 'all', 'name_asc') #>> '{rows,0,name}') = 'Alpha Gym (awaiting)', 'list: name_asc sort');
SELECT test.ok((public.platform_list_tenants(NULL, 'all', 'created_asc', 1000, 0) -> 'rows') IS NOT NULL, 'list: limit 1000 accepted (clamped)');
SELECT test.ok(jsonb_array_length(public.platform_list_tenants(NULL, 'all', 'created_asc', 0, 0) -> 'rows') = 1, 'list: limit 0 clamps to 1');
SELECT test.ok(jsonb_array_length(public.platform_list_tenants(NULL, 'all', 'created_asc', 25, -5) -> 'rows') = 5, 'list: negative offset clamps to 0');
SELECT test.ok(jsonb_array_length(public.platform_list_tenants(NULL, 'all', 'created_asc', 25, 99) -> 'rows') = 0
               AND (public.platform_list_tenants(NULL, 'all', 'created_asc', 25, 99) ->> 'total')::int = 5,
               'list: offset past the end => no rows but the true total');
SELECT test.ok((public.platform_list_tenants() #>> '{rows,0,members}') IS NOT NULL, 'list: usage counts present');
SELECT test.expect_err('SELECT public.platform_list_tenants(NULL, ''bogus'')', '22023', 'filter', 'list: unknown filter rejected');
SELECT test.expect_err('SELECT public.platform_list_tenants(NULL, ''all'', ''id; drop table x'')', '22023', 'sort', 'list: unknown sort rejected');
SELECT test.expect_err('SELECT public.platform_list_tenants(repeat(''x'', 101))', '22023', 'too long', 'list: oversized search rejected');

SELECT test.ok((public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000001') #>> '{staff,0,email}') = 'admin-a@test.dev', 'detail: staff listed');
SELECT test.ok((public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000001') #>> '{usage,members}')::int = 2, 'detail: member count');
SELECT test.ok((public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000001') #>> '{usage,active_members}')::int = 1, 'detail: active member count');
SELECT test.ok((public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000001') ->> 'access_state') = 'awaiting_activation', 'detail: access state');
SELECT test.ok((public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000002') #>> '{subscription,payment_reference}') = 'sub_live', 'detail: paddle id visible');
SELECT test.ok(public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000001')::text NOT LIKE '%secret@member.dev%',
               'detail never exposes member PII');
SELECT test.expect_err('SELECT public.platform_tenant_detail(gen_random_uuid())', 'P0002', 'not found', 'detail: unknown tenant');

-- --------------------------------------------------------------------------
-- 5. Writes: grant / revoke / note
-- --------------------------------------------------------------------------
-- validation
SELECT test.expect_err('SELECT public.platform_grant_access(''aaaaaaaa-0000-0000-0000-000000000001'', ''pro'', now() - interval ''1 day'', ''past date'')', '22023', 'future', 'grant: past end date rejected');
SELECT test.expect_err('SELECT public.platform_grant_access(''aaaaaaaa-0000-0000-0000-000000000001'', ''pro'', now() + interval ''6 years'', ''too far'')', '22023', '5 years', 'grant: >5 years rejected');
SELECT test.expect_err('SELECT public.platform_grant_access(''aaaaaaaa-0000-0000-0000-000000000001'', ''pro'', NULL, ''x'')', '22023', 'reason', 'grant: short reason rejected');
SELECT test.expect_err('SELECT public.platform_grant_access(''aaaaaaaa-0000-0000-0000-000000000001'', ''pro'', NULL, repeat(''x'', 501))', '22023', 'reason', 'grant: long reason rejected');
SELECT test.expect_err('SELECT public.platform_grant_access(''aaaaaaaa-0000-0000-0000-000000000001'', ''platinum'', NULL, ''bad tier'')', '22023', 'plan tier', 'grant: unknown tier rejected');
SELECT test.expect_err('SELECT public.platform_grant_access(gen_random_uuid(), ''pro'', NULL, ''no such tenant'')', 'P0002', 'not found', 'grant: unknown tenant');
RESET ROLE;
SELECT test.ok((SELECT count(*) FROM public.platform_audit_log) = 0, 'refused grants leave no audit rows');
SELECT test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');

-- Paddle-managed live subscription is refused
SELECT test.expect_err('SELECT public.platform_grant_access(''aaaaaaaa-0000-0000-0000-000000000002'', ''pro'', NULL, ''try to override paddle'')', '55000', 'Paddle', 'grant: live Paddle subscription refused');

-- happy path: activate the awaiting tenant for 30 days
SELECT test.ok((public.platform_grant_access('aaaaaaaa-0000-0000-0000-000000000001', 'pro', now() + interval '30 days', 'Founding customer, 30-day pilot') ->> 'access_state') = 'complimentary',
               'grant: awaiting tenant becomes complimentary');
RESET ROLE;
SELECT test.ok((SELECT status = 'active' AND plan_tier = 'pro' AND payment_provider = 'manual' AND amount = 0
                       AND payment_reference IS NULL AND trial_end IS NULL AND current_period_end > now() + interval '29 days'
                FROM public.platform_subscriptions WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
               'grant: row is active/manual/amount 0/no trial/period set');
SELECT test.ok((SELECT count(*) FROM public.platform_audit_log WHERE action = 'grant_access' AND tenant_name = 'Alpha Gym (awaiting)'
                       AND actor_email = 'owner@test.dev' AND details ->> 'reason' = 'Founding customer, 30-day pilot'
                       AND details -> 'before' = 'null'::jsonb AND details #>> '{after,status}' = 'active') = 1,
               'grant: audit row has actor, reason, before (null) and after');
SELECT test.ok(COALESCE(current_setting('app.platform_admin_write', true), 'off') = 'off', 'grant: bypass flag reset after the write');
SELECT test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');

-- re-grant with no expiry over a manual row; before-snapshot is recorded
SELECT public.platform_grant_access('aaaaaaaa-0000-0000-0000-000000000001', 'enterprise', NULL, 'Upgraded to partner, no expiry');
RESET ROLE;
SELECT test.ok((SELECT current_period_end IS NULL AND plan_tier = 'enterprise' FROM public.platform_subscriptions WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
               'grant: no-expiry grant stores NULL period end');
SELECT test.ok((SELECT details #>> '{before,plan_tier}' = 'pro' FROM public.platform_audit_log
                WHERE action = 'grant_access' ORDER BY id DESC LIMIT 1), 'grant: second audit row records the previous tier');
SELECT test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');

-- cancelled Paddle row and lapsed-active Paddle row may be granted
SELECT test.ok((public.platform_grant_access('aaaaaaaa-0000-0000-0000-000000000003', 'starter', now() + interval '10 days', 'Win-back') ->> 'access_state') = 'complimentary',
               'grant: cancelled Paddle row can be granted');
SELECT test.ok((public.platform_grant_access('aaaaaaaa-0000-0000-0000-000000000005', 'pro', now() + interval '10 days', 'Missed renewal, grace') ->> 'access_state') = 'complimentary',
               'grant: lapsed-active Paddle row can be granted');

-- revoke
SELECT test.expect_err('SELECT public.platform_revoke_access(''aaaaaaaa-0000-0000-0000-000000000002'', ''paddle is not mine'')', '55000', 'manually granted', 'revoke: Paddle row refused');
SELECT test.ok((public.platform_revoke_access('aaaaaaaa-0000-0000-0000-000000000004', 'Pilot over') ->> 'access_state') = 'inactive', 'revoke: manual grant becomes inactive');
RESET ROLE;
SELECT test.ok((SELECT status = 'cancelled' AND current_period_end <= now() FROM public.platform_subscriptions WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000004'),
               'revoke: row cancelled and period ended');
SELECT test.ok((SELECT count(*) FROM public.platform_audit_log WHERE action = 'revoke_access' AND details ->> 'reason' = 'Pilot over') = 1, 'revoke: audited');
SELECT test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');

-- notes
SELECT public.platform_add_note('aaaaaaaa-0000-0000-0000-000000000001', 'Spoke to the owner, wants Arabic invoices');
SELECT test.expect_err('SELECT public.platform_add_note(''aaaaaaaa-0000-0000-0000-000000000001'', ''   '')', '22023', 'note', 'note: blank rejected');
SELECT test.expect_err('SELECT public.platform_add_note(''aaaaaaaa-0000-0000-0000-000000000001'', repeat(''n'', 2001))', '22023', 'note', 'note: 2001 chars rejected');
SELECT test.ok((public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000001') #>> '{audit,0,action}') = 'note', 'detail: newest audit row is the note');
SELECT test.ok((public.platform_list_audit_log('aaaaaaaa-0000-0000-0000-000000000001') ->> 'total')::int = 3, 'audit list: per-tenant total (2 grants + 1 note)');
SELECT test.ok((public.platform_list_audit_log(NULL, 2, 0) ->> 'total')::int >= 6 AND jsonb_array_length(public.platform_list_audit_log(NULL, 2, 0) -> 'rows') = 2,
               'audit list: global total with limit applied');
SELECT test.ok((public.platform_overview() #>> '{recent_changes,0}') IS NOT NULL, 'overview: recent changes populated');

-- --------------------------------------------------------------------------
-- 6. The self-service trigger still binds everybody who is NOT the audited path
-- --------------------------------------------------------------------------
RESET ROLE;
-- Tenant admin of Alpha (now has a manual active row): cannot self-upgrade or fake a charge
SELECT test.become('00000000-0000-0000-0000-0000000000b1', 'aal2', NULL);
SELECT test.expect_err('UPDATE public.platform_subscriptions SET status = ''active'', amount = 999 WHERE tenant_id = ''aaaaaaaa-0000-0000-0000-000000000001''',
                       'P0001', 'only cancel', 'trigger: tenant admin still cannot write status=active');
SELECT test.expect_err('INSERT INTO public.platform_subscriptions (tenant_id, status) VALUES (''aaaaaaaa-0000-0000-0000-000000000001'', ''active'')',
                       'P0001', NULL, 'trigger: tenant admin still cannot insert');
RESET ROLE;

-- The owner (also admin of gym Delta) gets NO bypass on a direct, flagless write
SELECT test.become('00000000-0000-0000-0000-0000000000a1', 'aal2', '11111111-1111-1111-1111-111111111111');
SELECT test.expect_err('UPDATE public.platform_subscriptions SET status = ''active'', amount = 5 WHERE tenant_id = ''aaaaaaaa-0000-0000-0000-000000000004''',
                       'P0001', 'only cancel', 'trigger: owner direct write (no RPC flag) is blocked');
-- ...and the flag alone is not enough without being a valid admin
RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000b1', 'aal2', NULL);
SELECT set_config('app.platform_admin_write', 'on', true);
SELECT test.expect_err('UPDATE public.platform_subscriptions SET status = ''active'', amount = 5 WHERE tenant_id = ''aaaaaaaa-0000-0000-0000-000000000001''',
                       'P0001', 'only cancel', 'trigger: a forged flag does not help a non-admin');
SELECT set_config('app.platform_admin_write', 'off', true);

-- Cancelling remains the one allowed self-service action
UPDATE public.platform_subscriptions SET status = 'cancelled' WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';
RESET ROLE;
SELECT test.ok((SELECT status = 'cancelled' FROM public.platform_subscriptions WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
               'trigger: tenant admin can still cancel');

-- --------------------------------------------------------------------------
-- 7. Audit log is append-only (even for the table owner)
-- --------------------------------------------------------------------------
SELECT test.expect_err('UPDATE public.platform_audit_log SET action = ''note''', 'P0001', 'append-only', 'audit: UPDATE blocked');
SELECT test.expect_err('DELETE FROM public.platform_audit_log', 'P0001', 'append-only', 'audit: DELETE blocked');
SELECT test.expect_err('TRUNCATE public.platform_audit_log', 'P0001', 'append-only', 'audit: TRUNCATE blocked');
SELECT test.expect_err('INSERT INTO public.platform_audit_log (actor_id, action) VALUES (gen_random_uuid(), ''hack'')', '23514', NULL, 'audit: action CHECK enforced');

-- Cross-tenant deletion keeps history (no FK)
DELETE FROM public.tenants WHERE id = 'aaaaaaaa-0000-0000-0000-000000000005';
SELECT test.ok((SELECT count(*) FROM public.platform_audit_log WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000005') = 1,
               'audit: history survives tenant deletion');

-- list RPC carries its statement timeout
SELECT test.ok((SELECT 'statement_timeout=5s' = ANY (proconfig) FROM pg_proc WHERE proname = 'platform_list_tenants'), 'list RPC has a 5s statement_timeout');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;

ROLLBACK;
