-- Tests for 20261024090000_self_service_account_deletion.sql.
-- ============================================================================
-- Same setup as the other files here: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/account_deletion.test.sql
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
--   T1 "Alpha Gym":  admin A1, employee S1, paddle subscription (active)
--   T2 "Bravo Gym":  admin B1 (must be untouched by everything below)
--   T3 "Charlie Gym": admins C1 and C2, employee C3 (who leaves)
--   N1: an account that never created a gym
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000f1', 'a1@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f2', 's1@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f3', 'b1@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f4', 'c1@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f5', 'c2@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f6', 'c3@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000f7', 'n1@test.dev', now());

INSERT INTO public.tenants (id, name) VALUES
  ('ffffffff-0000-0000-0000-000000000001', 'Alpha Gym'),
  ('ffffffff-0000-0000-0000-000000000002', 'Bravo Gym'),
  ('ffffffff-0000-0000-0000-000000000003', 'Charlie Gym');

INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000f1', 'ffffffff-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000f2', 'ffffffff-0000-0000-0000-000000000001', 'employee'),
  ('00000000-0000-0000-0000-0000000000f3', 'ffffffff-0000-0000-0000-000000000002', 'admin'),
  ('00000000-0000-0000-0000-0000000000f4', 'ffffffff-0000-0000-0000-000000000003', 'admin'),
  ('00000000-0000-0000-0000-0000000000f5', 'ffffffff-0000-0000-0000-000000000003', 'admin'),
  ('00000000-0000-0000-0000-0000000000f6', 'ffffffff-0000-0000-0000-000000000003', 'employee');

INSERT INTO public.members (id, tenant_id, first_name, last_name, email, membership_type, join_date, status) VALUES
  ('eeeeeeee-0000-0000-0000-0000000000a1', 'ffffffff-0000-0000-0000-000000000001', 'Ann', 'One', 'ann@one.dev', 'basic', current_date, 'active'),
  ('eeeeeeee-0000-0000-0000-0000000000b1', 'ffffffff-0000-0000-0000-000000000002', 'Bob', 'Two', 'bob@two.dev', 'basic', current_date, 'active'),
  ('eeeeeeee-0000-0000-0000-0000000000c1', 'ffffffff-0000-0000-0000-000000000003', 'Cat', 'Three', 'cat@three.dev', 'basic', current_date, 'active');

INSERT INTO public.invoices (tenant_id, member_id, due_date, amount) VALUES
  ('ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-0000000000a1', current_date, 10),
  ('ffffffff-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-0000000000b1', current_date, 20);

-- A POS sale with a return, rung up by the employee (RESTRICT foreign keys).
INSERT INTO public.pos_sales (id, tenant_id, sale_number, cashier_id, subtotal, total, payment_method) VALUES
  ('dddddddd-0000-0000-0000-0000000000a1', 'ffffffff-0000-0000-0000-000000000001', 'S-1', '00000000-0000-0000-0000-0000000000f2', 5, 5, 'cash'),
  ('dddddddd-0000-0000-0000-0000000000c1', 'ffffffff-0000-0000-0000-000000000003', 'S-1', '00000000-0000-0000-0000-0000000000f6', 5, 5, 'cash');
INSERT INTO public.pos_sale_items (id, tenant_id, sale_id, product_name, sku, unit_price, quantity, line_subtotal, line_total) VALUES
  ('cccccccc-0000-0000-0000-0000000000a1', 'ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-0000000000a1', 'Water', 'W1', 5, 1, 5, 5);
INSERT INTO public.pos_returns (id, tenant_id, sale_id, return_number, cashier_id, total) VALUES
  ('bbbbbbbb-0000-0000-0000-0000000000a1', 'ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-0000000000a1', 'R-1', '00000000-0000-0000-0000-0000000000f2', 5);
INSERT INTO public.pos_return_items (tenant_id, return_id, sale_item_id, quantity, line_total) VALUES
  ('ffffffff-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-0000000000a1', 'cccccccc-0000-0000-0000-0000000000a1', 1, 5);

INSERT INTO public.member_tasks (tenant_id, member_id, title, created_by) VALUES
  ('ffffffff-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-0000000000c1', 'Call Cat', '00000000-0000-0000-0000-0000000000f6');

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end) VALUES
  ('ffffffff-0000-0000-0000-000000000001', 'active', 'starter', 20, 'BHD', 'paddle', 'sub_alpha', now() + interval '10 days');

-- --------------------------------------------------------------------------
-- 1. Nobody but the service role can call these
-- --------------------------------------------------------------------------
SELECT test.ok(NOT has_function_privilege('anon', 'public.account_delete_gym(uuid, text, boolean)', 'EXECUTE'), 'anon cannot delete a gym');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.account_delete_gym(uuid, text, boolean)', 'EXECUTE'), 'authenticated cannot call it directly (only the Edge Function can)');
SELECT test.ok(NOT has_function_privilege('anon', 'public.account_delete_user(uuid, text)', 'EXECUTE'), 'anon cannot delete a user');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.account_delete_user(uuid, text)', 'EXECUTE'), 'authenticated cannot call it directly either');
SELECT test.ok(has_function_privilege('service_role', 'public.account_delete_gym(uuid, text, boolean)', 'EXECUTE'), 'service_role can');
SELECT test.become('00000000-0000-0000-0000-0000000000f1');
SELECT test.expect_err($q$SELECT public.account_delete_gym('00000000-0000-0000-0000-0000000000f1', 'Alpha Gym', true)$q$,
                       '42501', NULL, 'a signed-in admin cannot call it from the browser');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 2. Deleting a gym: the guards
-- --------------------------------------------------------------------------
SELECT test.become_service();
SELECT test.expect_err($q$SELECT public.account_delete_gym('00000000-0000-0000-0000-0000000000f2', 'Alpha Gym', true)$q$,
                       '42501', 'Only a gym admin', 'an employee cannot delete the gym');
SELECT test.expect_err($q$SELECT public.account_delete_gym('00000000-0000-0000-0000-0000000000f7', 'Alpha Gym', true)$q$,
                       '42501', 'Only a gym admin', 'an account with no gym cannot either');
SELECT test.expect_err($q$SELECT public.account_delete_gym('00000000-0000-0000-0000-0000000000f1', 'alpha', true)$q$,
                       '22023', 'does not match', 'the gym name must be typed exactly');
SELECT test.expect_err($q$SELECT public.account_delete_gym('00000000-0000-0000-0000-0000000000f1', 'Alpha Gym', false)$q$,
                       '55000', 'Cancel this gym', 'a live Paddle subscription must be cancelled first');
RESET ROLE;
SELECT test.ok(EXISTS (SELECT 1 FROM public.tenants WHERE id = 'ffffffff-0000-0000-0000-000000000001'), 'the refused attempts deleted nothing');

-- A gym that contains a platform admin is protected.
INSERT INTO public.platform_admins (user_id) VALUES ('00000000-0000-0000-0000-0000000000f5');
SELECT test.become_service();
SELECT test.expect_err($q$SELECT public.account_delete_gym('00000000-0000-0000-0000-0000000000f4', 'Charlie Gym', true)$q$,
                       '55000', 'platform admin', 'a gym with a platform admin cannot be deleted this way');
RESET ROLE;
DELETE FROM public.platform_admins WHERE user_id = '00000000-0000-0000-0000-0000000000f5';

-- --------------------------------------------------------------------------
-- 3. Deleting a gym: the effect
-- --------------------------------------------------------------------------
SELECT test.become_service();
SELECT public.account_delete_gym('00000000-0000-0000-0000-0000000000f1', 'Alpha Gym', true);
RESET ROLE;

SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = 'ffffffff-0000-0000-0000-000000000001'), 'the gym is gone');
CREATE FUNCTION test.rows_left(p_tenant uuid) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  r record;
  n integer;
  total integer := 0;
BEGIN
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN pg_class k ON k.relname = c.table_name AND k.relnamespace = 'public'::regnamespace AND k.relkind = 'r'
    WHERE c.table_schema = 'public' AND c.column_name = 'tenant_id' AND c.table_name <> 'platform_audit_log'
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE tenant_id = $1', r.table_name) INTO n USING p_tenant;
    total := total + n;
  END LOOP;
  RETURN total;
END;
$$;
SELECT test.ok(test.rows_left('ffffffff-0000-0000-0000-000000000001') = 0, 'no table still holds a row for the deleted gym');
SELECT test.ok(test.rows_left('ffffffff-0000-0000-0000-000000000002') > 0, 'while another gym''s rows are all still there');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id IN ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2')), 'the admin and the staff who had no other gym lost their accounts');
SELECT test.ok(EXISTS (SELECT 1 FROM public.tenants WHERE id = 'ffffffff-0000-0000-0000-000000000002'), 'another gym is untouched');
SELECT test.ok(EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000f3'), 'and so is its admin');
SELECT test.ok((SELECT count(*) FROM public.invoices WHERE tenant_id = 'ffffffff-0000-0000-0000-000000000002') = 1, 'and its invoices');

-- The audit trail keeps ids and counts, not who or what.
SELECT test.ok((SELECT count(*) FROM public.platform_audit_log WHERE action = 'self_delete_gym' AND tenant_id = 'ffffffff-0000-0000-0000-000000000001') = 1, 'one audit row records the deletion');
SELECT test.ok((SELECT actor_email IS NULL AND tenant_name IS NULL FROM public.platform_audit_log WHERE action = 'self_delete_gym'), 'it holds no email and no gym name');
SELECT test.ok((SELECT (details -> 'usage' ->> 'members')::int = 1 FROM public.platform_audit_log WHERE action = 'self_delete_gym'), 'only counts of what was removed');

-- --------------------------------------------------------------------------
-- 4. Leaving as staff
-- --------------------------------------------------------------------------
SELECT test.become_service();
SELECT test.expect_err($q$SELECT public.account_delete_user('00000000-0000-0000-0000-0000000000f6', 'someone@else.dev')$q$,
                       '22023', 'does not match', 'the account email must be typed');
SELECT test.expect_err($q$SELECT public.account_delete_user('00000000-0000-0000-0000-0000000000f3', 'b1@test.dev')$q$,
                       '55000', 'only admin', 'the only admin of a gym cannot just leave');
SELECT public.account_delete_user('00000000-0000-0000-0000-0000000000f6', 'C3@Test.dev');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000f6'), 'the employee''s account is deleted (email match ignores case)');
SELECT test.ok((SELECT cashier_id FROM public.pos_sales WHERE id = 'dddddddd-0000-0000-0000-0000000000c1') IN ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000f5'), 'the sale they rang up now belongs to one of the gym''s other admins');
SELECT test.ok((SELECT created_by FROM public.member_tasks WHERE tenant_id = 'ffffffff-0000-0000-0000-000000000003') IN ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000f5'), 'and so does their task');
SELECT test.ok(EXISTS (SELECT 1 FROM public.tenants WHERE id = 'ffffffff-0000-0000-0000-000000000003'), 'the gym they left is intact');

-- A second admin may leave (the gym keeps an admin).
SELECT test.become_service();
SELECT public.account_delete_user('00000000-0000-0000-0000-0000000000f5', 'c2@test.dev');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000f5'), 'an admin can leave when another admin remains');

-- --------------------------------------------------------------------------
-- 5. An account that never created a gym
-- --------------------------------------------------------------------------
SELECT test.become_service();
SELECT public.account_delete_user('00000000-0000-0000-0000-0000000000f7', 'n1@test.dev');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000f7'), 'an account with no gym can be deleted');
SELECT test.ok((SELECT count(*) FROM public.platform_audit_log WHERE action = 'self_delete_user') = 3, 'each leaving is recorded');

-- --------------------------------------------------------------------------
-- 6. Structural: a future table cannot silently survive a gym's deletion
-- --------------------------------------------------------------------------
SELECT test.ok(NOT EXISTS (
  SELECT c.table_name
  FROM information_schema.columns c
  JOIN pg_class k ON k.relname = c.table_name AND k.relnamespace = 'public'::regnamespace AND k.relkind = 'r'
  WHERE c.table_schema = 'public' AND c.column_name = 'tenant_id'
    AND c.table_name <> 'platform_audit_log'
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint con
      WHERE con.conrelid = k.oid AND con.contype = 'f' AND con.confrelid = 'public.tenants'::regclass AND con.confdeltype = 'c'
    )
), 'every table with a tenant_id cascades from tenants (platform_audit_log is the one deliberate exception: it keeps anonymised counts)');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
