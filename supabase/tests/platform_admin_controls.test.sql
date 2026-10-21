-- Tests for 20261021150000_platform_admin_gym_and_user_controls.sql.
-- ============================================================================
-- Same setup as platform_admin_console.test.sql: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/platform_admin_controls.test.sql
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
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000b1', 'alpha-admin1@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000b2', 'alpha-admin2@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000b3', 'alpha-staff@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000b4', 'multi@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000c1', 'bravo-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000d1', 'ownergym-staff@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000e1', 'solo-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f1', 'paddle-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f2', 'echo-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f3', 'echo-trainer@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f4', 'noadmin-trainer@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f5', 'noadmin-trainer2@test.dev', now());

INSERT INTO auth.sessions (id, user_id, aal) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000a1', 'aal2'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000a2', 'aal1'),
  ('b1b1b1b1-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'aal1'),
  ('b3b3b3b3-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b3', 'aal2'),
  ('b4b4b4b4-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b4', 'aal1');

INSERT INTO auth.mfa_factors (user_id, friendly_name, factor_type, status) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner phone', 'totp', 'verified'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1 phone', 'totp', 'verified'),
  ('00000000-0000-0000-0000-0000000000b3', 'staff phone', 'totp', 'verified');

INSERT INTO public.platform_admins (user_id, note) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000a2', 'aal1 only');

INSERT INTO public.tenants (id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Alpha Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Bravo Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Owner Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Solo Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Paddle Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'Echo Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'NoAdmin Gym');

-- explicit created_at: "oldest other admin" must be deterministic
INSERT INTO public.memberships (user_id, tenant_id, role, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin',    now() - interval '10 days'),
  ('00000000-0000-0000-0000-0000000000b2', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin',    now() - interval '9 days'),
  ('00000000-0000-0000-0000-0000000000b3', 'aaaaaaaa-0000-0000-0000-000000000001', 'employee', now() - interval '8 days'),
  ('00000000-0000-0000-0000-0000000000b4', 'aaaaaaaa-0000-0000-0000-000000000001', 'employee', now() - interval '7 days'),
  ('00000000-0000-0000-0000-0000000000b4', 'aaaaaaaa-0000-0000-0000-000000000002', 'trainer',  now() - interval '7 days'),
  ('00000000-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-000000000002', 'admin',    now() - interval '6 days'),
  ('00000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000003', 'admin',    now() - interval '5 days'),
  ('00000000-0000-0000-0000-0000000000d1', 'aaaaaaaa-0000-0000-0000-000000000003', 'employee', now() - interval '5 days'),
  ('00000000-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-000000000004', 'admin',    now() - interval '4 days'),
  ('00000000-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-000000000005', 'admin',    now() - interval '4 days'),
  ('00000000-0000-0000-0000-0000000000f2', 'aaaaaaaa-0000-0000-0000-000000000006', 'admin',    now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000f3', 'aaaaaaaa-0000-0000-0000-000000000006', 'trainer',  now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000f4', 'aaaaaaaa-0000-0000-0000-000000000007', 'trainer',  now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000f5', 'aaaaaaaa-0000-0000-0000-000000000007', 'trainer',  now() - interval '3 days');

INSERT INTO public.members (id, tenant_id, first_name, last_name, email, membership_type, join_date, status) VALUES
  ('99999999-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Secret', 'Person', 'secret@member.dev', 'basic', current_date, 'active'),
  ('99999999-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000007', 'Other',  'Person', 'other@member.dev',  'basic', current_date, 'active');

-- Records created by b1 in Alpha: the four tables that block deleting a user.
INSERT INTO public.member_tasks (tenant_id, member_id, title, created_by) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 't1', '00000000-0000-0000-0000-0000000000b1'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 't2', '00000000-0000-0000-0000-0000000000b1'),
  ('aaaaaaaa-0000-0000-0000-000000000007', '99999999-0000-0000-0000-000000000002', 'noadmin task', '00000000-0000-0000-0000-0000000000f4');

INSERT INTO public.pos_products (id, tenant_id, name, sku, price) VALUES
  ('77777777-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Water', 'W1', 2);
INSERT INTO public.pos_stock_movements (tenant_id, product_id, movement_type, quantity_delta, quantity_before, quantity_after, created_by) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'opening', 5, 0, 5, '00000000-0000-0000-0000-0000000000b1');
INSERT INTO public.pos_sales (id, tenant_id, sale_number, cashier_id, subtotal, total, payment_method) VALUES
  ('88888888-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'S-1', '00000000-0000-0000-0000-0000000000b1', 2, 2, 'cash');
INSERT INTO public.pos_sale_items (id, tenant_id, sale_id, product_id, product_name, sku, unit_price, quantity, line_subtotal, line_total) VALUES
  ('88888888-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001',
   '77777777-0000-0000-0000-000000000001', 'Water', 'W1', 2, 1, 2, 2);
INSERT INTO public.pos_returns (id, tenant_id, sale_id, return_number, cashier_id) VALUES
  ('88888888-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', 'R-1', '00000000-0000-0000-0000-0000000000b1');
INSERT INTO public.pos_return_items (tenant_id, return_id, sale_item_id, product_id, quantity, line_total) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000003', '88888888-0000-0000-0000-000000000002',
   '77777777-0000-0000-0000-000000000001', 1, 2);

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000005', 'active', 'pro', 35, 'BHD', 'paddle', 'sub_live', now() + interval '20 days');
SELECT set_config('request.jwt.claims', '', true);

-- --------------------------------------------------------------------------
-- 1. Nobody but a fully verified platform admin can call any of the RPCs
-- --------------------------------------------------------------------------
DO $$
DECLARE
  calls text[] := ARRAY[
    $q$SELECT public.platform_suspend_gym('aaaaaaaa-0000-0000-0000-000000000002', 'because')$q$,
    $q$SELECT public.platform_unsuspend_gym('aaaaaaaa-0000-0000-0000-000000000002', 'because')$q$,
    $q$SELECT public.platform_delete_gym('aaaaaaaa-0000-0000-0000-000000000002', 'Bravo Gym', 'because', true)$q$,
    $q$SELECT public.platform_ban_user('00000000-0000-0000-0000-0000000000c1', 'because')$q$,
    $q$SELECT public.platform_unban_user('00000000-0000-0000-0000-0000000000c1', 'because')$q$,
    $q$SELECT public.platform_reset_user_mfa('00000000-0000-0000-0000-0000000000c1', 'because')$q$,
    $q$SELECT public.platform_change_user_role('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c1', 'trainer', 'because')$q$,
    $q$SELECT public.platform_delete_user('00000000-0000-0000-0000-0000000000c1', 'bravo-admin@test.dev', 'because')$q$
  ];
  c text;
BEGIN
  FOREACH c IN ARRAY calls LOOP
    RESET ROLE;
    PERFORM test.become('00000000-0000-0000-0000-0000000000b1', 'aal2', NULL);   -- tenant admin
    PERFORM test.expect_err(c, '42501', 'forbidden', 'tenant admin refused: ' || left(c, 45));
    RESET ROLE;
    PERFORM test.become('00000000-0000-0000-0000-0000000000a2', 'aal1', '22222222-2222-2222-2222-222222222222'); -- allowlisted, no MFA
    PERFORM test.expect_err(c, '42501', 'forbidden', 'aal1 platform admin refused: ' || left(c, 45));
    RESET ROLE;
    PERFORM test.become_anon();
    PERFORM test.expect_err(c, '42501', NULL, 'anon refused: ' || left(c, 45));
  END LOOP;
  RESET ROLE;
END
$$;

-- None of the refused calls changed anything.
SELECT test.ok((SELECT count(*) FROM public.platform_audit_log) = 0, 'refused calls wrote no audit rows');
SELECT test.ok((SELECT count(*) FROM public.platform_suspensions) = 0, 'refused calls suspended nothing');

-- --------------------------------------------------------------------------
-- 2. Suspend / unsuspend
-- --------------------------------------------------------------------------
-- b3 was banned for an unrelated reason BEFORE the suspension.
UPDATE auth.users SET banned_until = now() + interval '30 days' WHERE id = '00000000-0000-0000-0000-0000000000b3';

SELECT test.owner();
SELECT test.expect_err($q$SELECT public.platform_suspend_gym('aaaaaaaa-0000-0000-0000-000000000001', 'ab')$q$, '22023', 'reason', 'short reason refused');
SELECT test.expect_err($q$SELECT public.platform_suspend_gym('aaaaaaaa-0000-0000-0000-0000000000ff', 'long enough')$q$, 'P0002', 'Tenant not found', 'unknown tenant');
SELECT test.expect_err($q$SELECT public.platform_suspend_gym('aaaaaaaa-0000-0000-0000-000000000003', 'long enough')$q$, '55000', 'platform admin', 'gym containing a platform admin cannot be suspended');

SELECT test.ok((public.platform_suspend_gym('aaaaaaaa-0000-0000-0000-000000000001', 'chargeback dispute') ->> 'banned_users')::int = 2,
               'suspend bans the 2 sole-gym, not-already-banned users (b1, b2)');

RESET ROLE;
SELECT test.ok((SELECT banned_until > now() + interval '90 years' FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b1'), 'b1 banned');
SELECT test.ok((SELECT banned_until > now() + interval '90 years' FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b2'), 'b2 banned');
SELECT test.ok((SELECT banned_until < now() + interval '40 days' FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b3'), 'b3 keeps its earlier, shorter ban');
SELECT test.ok((SELECT banned_until IS NULL FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b4'), 'multi-gym user b4 is NOT banned by suspending one of their gyms');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.sessions WHERE user_id = '00000000-0000-0000-0000-0000000000b1'), 'b1 sessions deleted');
SELECT test.ok(EXISTS (SELECT 1 FROM auth.sessions WHERE user_id = '00000000-0000-0000-0000-0000000000b4'), 'b4 sessions untouched');
SELECT test.ok((SELECT cardinality(banned_user_ids) FROM public.platform_suspensions WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') = 2,
               'suspension remembers exactly the 2 users it banned');
SELECT test.ok((SELECT details ->> 'reason' FROM public.platform_audit_log WHERE action = 'suspend_gym') = 'chargeback dispute', 'audit row written for suspend');

SELECT test.owner();
SELECT test.expect_err($q$SELECT public.platform_suspend_gym('aaaaaaaa-0000-0000-0000-000000000001', 'long enough')$q$, '55000', 'already suspended', 'double suspend refused');

-- the console sees the state
SELECT test.ok((public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000001') -> 'suspension' ->> 'reason') = 'chargeback dispute', 'detail shows the suspension');
SELECT test.ok(public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000002') -> 'suspension' = 'null'::jsonb, 'detail: other gym not suspended');
SELECT test.ok(
  (SELECT bool_and((s ->> 'banned')::boolean) FROM jsonb_array_elements(public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000001') -> 'staff') s
   WHERE s ->> 'email' IN ('alpha-admin1@test.dev', 'alpha-admin2@test.dev')), 'detail flags suspended staff as banned');
SELECT test.ok(
  (SELECT (s ->> 'is_platform_admin')::boolean FROM jsonb_array_elements(public.platform_tenant_detail('aaaaaaaa-0000-0000-0000-000000000003') -> 'staff') s
   WHERE s ->> 'email' = 'owner@test.dev'), 'detail flags the platform admin');
SELECT test.ok((public.platform_list_tenants(NULL, 'suspended') ->> 'total')::int = 1, 'list filter "suspended" finds exactly the suspended gym');
SELECT test.ok(
  (SELECT (r ->> 'suspended')::boolean FROM jsonb_array_elements(public.platform_list_tenants(NULL, 'all') -> 'rows') r
   WHERE r ->> 'name' = 'Alpha Gym'), 'list rows carry suspended = true');
SELECT test.expect_err($q$SELECT public.platform_list_tenants(NULL, 'bogus')$q$, '22023', 'Unknown filter', 'list still rejects unknown filters');

-- unban of a suspended gym's user must go through unsuspend
SELECT test.expect_err($q$SELECT public.platform_unban_user('00000000-0000-0000-0000-0000000000b1', 'long enough')$q$, '55000', 'unsuspend the gym', 'cannot unban around a suspension');

SELECT public.platform_unsuspend_gym('aaaaaaaa-0000-0000-0000-000000000001', 'dispute resolved');
RESET ROLE;
SELECT test.ok((SELECT banned_until IS NULL FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b1'), 'unsuspend lifts b1''s ban');
SELECT test.ok((SELECT banned_until IS NULL FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b2'), 'unsuspend lifts b2''s ban');
SELECT test.ok((SELECT banned_until > now() FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b3'), 'unsuspend does NOT lift a ban it did not place (b3)');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.platform_suspensions), 'suspension row removed');
SELECT test.owner();
SELECT test.expect_err($q$SELECT public.platform_unsuspend_gym('aaaaaaaa-0000-0000-0000-000000000001', 'long enough')$q$, '55000', 'not suspended', 'unsuspend when not suspended refused');

-- --------------------------------------------------------------------------
-- 3. Ban / unban / reset MFA
-- --------------------------------------------------------------------------
SELECT public.platform_ban_user('00000000-0000-0000-0000-0000000000b4', 'abusive behaviour');
RESET ROLE;
SELECT test.ok((SELECT banned_until > now() + interval '90 years' FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b4'), 'ban_user bans');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.sessions WHERE user_id = '00000000-0000-0000-0000-0000000000b4'), 'ban_user ends their sessions');
SELECT test.ok((SELECT tenant_id IS NULL FROM public.platform_audit_log WHERE action = 'ban_user'), 'audit row for a multi-gym user has no single gym');
SELECT test.owner();
SELECT test.expect_err($q$SELECT public.platform_ban_user('00000000-0000-0000-0000-0000000000b4', 'long enough')$q$, '55000', 'already banned', 'double ban refused');
SELECT test.expect_err($q$SELECT public.platform_ban_user('00000000-0000-0000-0000-0000000000a2', 'long enough')$q$, '55000', 'Platform admins', 'cannot ban a platform admin');
SELECT test.expect_err($q$SELECT public.platform_ban_user('00000000-0000-0000-0000-0000000000a1', 'long enough')$q$, '55000', 'your own account', 'cannot ban yourself');
SELECT test.expect_err($q$SELECT public.platform_ban_user('00000000-0000-0000-0000-0000000000ee', 'long enough')$q$, 'P0002', 'User not found', 'unknown user');
SELECT public.platform_unban_user('00000000-0000-0000-0000-0000000000b4', 'apologised');
SELECT public.platform_unban_user('00000000-0000-0000-0000-0000000000b3', 'was a mistake');
RESET ROLE;
SELECT test.ok((SELECT banned_until IS NULL FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b4'), 'unban_user unbans');
SELECT test.owner();
SELECT test.expect_err($q$SELECT public.platform_unban_user('00000000-0000-0000-0000-0000000000b4', 'long enough')$q$, '55000', 'not banned', 'unban of a non-banned user refused');

SELECT test.ok((public.platform_reset_user_mfa('00000000-0000-0000-0000-0000000000b3', 'lost phone') ->> 'factors_removed')::int = 1, 'reset_user_mfa reports 1 factor removed');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.mfa_factors WHERE user_id = '00000000-0000-0000-0000-0000000000b3'), 'factor deleted');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.sessions WHERE user_id = '00000000-0000-0000-0000-0000000000b3'), 'sessions deleted so they must sign in again');
SELECT test.owner();
SELECT test.expect_err($q$SELECT public.platform_reset_user_mfa('00000000-0000-0000-0000-0000000000b3', 'long enough')$q$, '55000', 'no MFA', 'reset with no factors refused');
SELECT test.expect_err($q$SELECT public.platform_reset_user_mfa('00000000-0000-0000-0000-0000000000a2', 'long enough')$q$, '55000', 'Platform admins', 'cannot reset a platform admin''s MFA here');

-- --------------------------------------------------------------------------
-- 4. Role changes
-- --------------------------------------------------------------------------
SELECT public.platform_change_user_role('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b3', 'trainer', 'moved to coaching');
RESET ROLE;
SELECT test.ok((SELECT role FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000b3'
                 AND tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'trainer', 'role changed');
SELECT test.ok((SELECT details ->> 'from' || '>' || (details ->> 'to') FROM public.platform_audit_log WHERE action = 'change_role') = 'employee>trainer', 'audit records from/to');
SELECT test.owner();
SELECT test.expect_err($q$SELECT public.platform_change_user_role('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b3', 'trainer', 'long enough')$q$, '55000', 'already has', 'same role refused');
SELECT test.expect_err($q$SELECT public.platform_change_user_role('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b3', 'superadmin', 'long enough')$q$, '22023', 'Unknown role', 'a platform role can never be assigned through memberships');
SELECT test.expect_err($q$SELECT public.platform_change_user_role('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b3', 'admin', 'long enough')$q$, 'P0002', 'not on this gym', 'user not on that gym');
SELECT test.expect_err($q$SELECT public.platform_change_user_role('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'trainer', 'long enough')$q$, '55000', 'your own account', 'cannot change own role');

SELECT public.platform_change_user_role('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'trainer', 'stepping down');   -- b2 is still admin
SELECT test.expect_err($q$SELECT public.platform_change_user_role('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2', 'employee', 'long enough')$q$, '55000', 'last admin', 'cannot demote the last admin');
SELECT public.platform_change_user_role('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'admin', 'back again');

-- --------------------------------------------------------------------------
-- 5. Delete a user
-- --------------------------------------------------------------------------
SELECT test.expect_err($q$SELECT public.platform_delete_user('00000000-0000-0000-0000-0000000000b1', 'wrong@test.dev', 'long enough')$q$, '22023', 'confirmation email', 'wrong confirmation refused');
SELECT test.expect_err($q$SELECT public.platform_delete_user('00000000-0000-0000-0000-0000000000a2', 'aal1admin@test.dev', 'long enough')$q$, '55000', 'Platform admins', 'cannot delete a platform admin');
SELECT test.expect_err($q$SELECT public.platform_delete_user('00000000-0000-0000-0000-0000000000a1', 'owner@test.dev', 'long enough')$q$, '55000', 'your own account', 'cannot delete yourself');
SELECT test.expect_err($q$SELECT public.platform_delete_user('00000000-0000-0000-0000-0000000000f2', 'echo-admin@test.dev', 'long enough')$q$, '55000', 'only admin', 'cannot delete the only admin of a gym');
SELECT test.expect_err($q$SELECT public.platform_delete_user('00000000-0000-0000-0000-0000000000f4', 'noadmin-trainer@test.dev', 'long enough')$q$, '55000', 'no other admin', 'records in a gym with no admin cannot be handed over');

-- b1 owns 2 tasks, 1 sale, 1 return and 1 stock movement; b2 (oldest OTHER admin) takes them over.
SELECT test.ok((public.platform_delete_user('00000000-0000-0000-0000-0000000000b1', 'ALPHA-ADMIN1@test.dev', 'left the company') ->> 'reassigned')::int = 5,
               'delete_user hands over 5 records (confirmation email is case-insensitive)');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b1'), 'user deleted');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000b1'), 'membership cascaded');
SELECT test.ok((SELECT count(*) FROM public.member_tasks WHERE created_by = '00000000-0000-0000-0000-0000000000b2') = 2, 'tasks now belong to the other admin');
SELECT test.ok((SELECT cashier_id FROM public.pos_sales WHERE sale_number = 'S-1') = '00000000-0000-0000-0000-0000000000b2', 'sale handed over');
SELECT test.ok((SELECT cashier_id FROM public.pos_returns WHERE return_number = 'R-1') = '00000000-0000-0000-0000-0000000000b2', 'return handed over');
SELECT test.ok((SELECT created_by FROM public.pos_stock_movements LIMIT 1) = '00000000-0000-0000-0000-0000000000b2', 'stock movement handed over');
SELECT test.ok((SELECT details ->> 'reassigned_to' FROM public.platform_audit_log WHERE action = 'delete_user') = 'alpha-admin2@test.dev', 'audit names who took over');
SELECT test.ok((SELECT (details -> 'reassigned' ->> 'pos_sales')::int FROM public.platform_audit_log WHERE action = 'delete_user') = 1, 'audit has per-table counts');
SELECT test.ok((SELECT tenant_name FROM public.platform_audit_log WHERE action = 'delete_user') = 'Alpha Gym', 'audit attached to the user''s gym');

SELECT test.owner();
-- a non-admin with no records can go even when the gym has an admin
SELECT public.platform_delete_user('00000000-0000-0000-0000-0000000000f3', 'echo-trainer@test.dev', 'left the company');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000f3'), 'trainer deleted');
-- ...and a non-admin with NO records in an admin-less gym can go too
SELECT test.owner();
SELECT public.platform_delete_user('00000000-0000-0000-0000-0000000000f5', 'noadmin-trainer2@test.dev', 'left the company');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000f5'), 'record-less user in an admin-less gym deleted');

-- --------------------------------------------------------------------------
-- 6. Delete a gym
-- --------------------------------------------------------------------------
SELECT test.owner();
SELECT test.expect_err($q$SELECT public.platform_delete_gym('aaaaaaaa-0000-0000-0000-000000000004', 'solo gym', 'long enough')$q$, '22023', 'confirmation name', 'confirmation is case-sensitive');
SELECT test.expect_err($q$SELECT public.platform_delete_gym('aaaaaaaa-0000-0000-0000-000000000004', NULL, 'long enough')$q$, '22023', 'confirmation name', 'missing confirmation refused');
SELECT test.expect_err($q$SELECT public.platform_delete_gym('aaaaaaaa-0000-0000-0000-000000000003', 'Owner Gym', 'long enough', true)$q$, '55000', 'platform admin', 'a gym with a platform admin cannot be deleted');
SELECT test.expect_err($q$SELECT public.platform_delete_gym('aaaaaaaa-0000-0000-0000-000000000005', 'Paddle Gym', 'long enough', true)$q$, '55000', 'Paddle', 'a live Paddle subscription blocks deletion');
SELECT test.expect_err($q$SELECT public.platform_delete_gym('aaaaaaaa-0000-0000-0000-0000000000ff', 'x', 'long enough')$q$, 'P0002', 'Tenant not found', 'unknown gym');

-- Without p_delete_users the staff keep their accounts.
SELECT test.ok((public.platform_delete_gym('aaaaaaaa-0000-0000-0000-000000000004', 'Solo Gym', 'cleanup') ->> 'deleted_users')::int = 0, 'no users deleted by default');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = 'aaaaaaaa-0000-0000-0000-000000000004'), 'Solo Gym deleted');
SELECT test.ok(EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000e1'), 'its admin keeps their account');

-- Alpha has members, tasks, POS sales + returns (RESTRICT FKs) and a multi-gym user (b4).
SELECT test.owner();
SELECT test.ok((public.platform_delete_gym('aaaaaaaa-0000-0000-0000-000000000001', 'Alpha Gym', 'closing down', true) ->> 'deleted_users')::int = 2,
               'delete gym + users removes b2 and b3 (sole-gym staff), not b4');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Alpha deleted');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.members WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'its members are gone');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.pos_sales WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001')
               AND NOT EXISTS (SELECT 1 FROM public.pos_returns WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'its POS sales and returns are gone');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id IN ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b3')), 'sole-gym staff deleted');
SELECT test.ok(EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b4'), 'multi-gym user kept');
SELECT test.ok(EXISTS (SELECT 1 FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000b4' AND tenant_id = 'aaaaaaaa-0000-0000-0000-000000000002'), 'multi-gym user still belongs to Bravo');
SELECT test.ok(EXISTS (SELECT 1 FROM public.members WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000007'), 'another gym''s data untouched');

-- The audit trail survives the deletion and records counts + emails, not rows.
SELECT test.ok((SELECT (details -> 'usage' ->> 'members')::int FROM public.platform_audit_log WHERE action = 'delete_gym' AND tenant_name = 'Alpha Gym') = 1, 'audit keeps the member COUNT');
SELECT test.ok((SELECT jsonb_array_length(details -> 'deleted_users') FROM public.platform_audit_log WHERE action = 'delete_gym' AND tenant_name = 'Alpha Gym') = 2, 'audit lists deleted accounts');
SELECT test.ok((SELECT (details ->> 'kept_users')::int FROM public.platform_audit_log WHERE action = 'delete_gym' AND tenant_name = 'Alpha Gym') = 1, 'audit counts kept accounts');
SELECT test.ok(NOT (SELECT details::text FROM public.platform_audit_log WHERE action = 'delete_gym' AND tenant_name = 'Alpha Gym') ILIKE '%secret@member.dev%',
               'audit never contains member PII');

-- --------------------------------------------------------------------------
-- 7. The audit log stays append-only and complete
-- --------------------------------------------------------------------------
SELECT test.ok((SELECT count(DISTINCT action) FROM public.platform_audit_log) = 8,
               'all 8 new actions were audited (suspend_gym, unsuspend_gym, delete_gym, ban_user, unban_user, reset_mfa, change_role, delete_user)');
SELECT test.expect_err($q$UPDATE public.platform_audit_log SET action = 'note'$q$, 'P0001', 'append-only', 'audit rows cannot be edited');
SELECT test.expect_err($q$DELETE FROM public.platform_audit_log$q$, 'P0001', 'append-only', 'audit rows cannot be deleted');

-- A signed-in tenant admin cannot read the new table directly.
SELECT test.become('00000000-0000-0000-0000-0000000000c1', 'aal2', NULL);
SELECT test.expect_err('SELECT * FROM public.platform_suspensions', '42501', NULL, 'tenant admin cannot read platform_suspensions');
RESET ROLE;

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
