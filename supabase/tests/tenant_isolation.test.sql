-- Cross-tenant isolation: a signed-in user of gym A cannot read, change or
-- escalate into gym B's data.
-- ============================================================================
-- This is the check the September audit listed as never performed ("confirm from
-- a second tenant's JWT that the newly policied tables and buckets refuse
-- cross-tenant reads/writes"). It runs the full schema + every migration on a
-- plain Postgres and attacks as real, RLS-bound roles - it proves the SCHEMA, not
-- your hosted project. Run the same file against a Supabase branch to prove that.
--
-- Same setup as the other files here: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/tenant_isolation.test.sql
--
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


CREATE FUNCTION test.become_anon() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  SET LOCAL ROLE anon;
END;
$$;

-- How many rows of a table the current role can see for a tenant (-1 = no
-- privilege at all, which is also isolation).
CREATE FUNCTION test.visible(p_table text, p_tenant uuid) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  EXECUTE format('SELECT count(*) FROM public.%I WHERE tenant_id = $1', p_table) INTO n USING p_tenant;
  RETURN n;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN -1;
END;
$$;

-- Runs a write and returns how many rows it touched (0 = RLS filtered everything).
CREATE FUNCTION test.touched(p_sql text) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  RETURN 0;
END;
$$;

-- --------------------------------------------------------------------------
-- Fixtures: two gyms with real data in the core tables
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'a-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'a-employee@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a3', 'a-trainer@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000b1', 'b-admin@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000c1', 'newcomer@test.dev', now());

INSERT INTO public.tenants (id, name) VALUES
  ('aaaaaaaa-1111-0000-0000-000000000001', 'Gym A'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'Gym B');

INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-1111-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'aaaaaaaa-1111-0000-0000-000000000001', 'employee'),
  ('00000000-0000-0000-0000-0000000000a3', 'aaaaaaaa-1111-0000-0000-000000000001', 'trainer'),
  ('00000000-0000-0000-0000-0000000000b1', 'bbbbbbbb-1111-0000-0000-000000000001', 'admin');

INSERT INTO public.members (id, tenant_id, first_name, last_name, email, membership_type, join_date, status) VALUES
  ('a0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-1111-0000-0000-000000000001', 'Amal',  'A', 'amal@a.dev',  'basic', current_date, 'active'),
  ('b0000000-0000-0000-0000-00000000000b', 'bbbbbbbb-1111-0000-0000-000000000001', 'Basim', 'B', 'basim@b.dev', 'basic', current_date, 'active');
INSERT INTO public.trainers (id, tenant_id, first_name, last_name, email) VALUES
  ('a0000000-0000-0000-0000-0000000000f1', 'aaaaaaaa-1111-0000-0000-000000000001', 'Tariq', 'A', 'tariq@a.dev'),
  ('b0000000-0000-0000-0000-0000000000f1', 'bbbbbbbb-1111-0000-0000-000000000001', 'Tala',  'B', 'tala@b.dev');
INSERT INTO public.classes (id, tenant_id, name, trainer_id, start_time, end_time, capacity) VALUES
  ('a0000000-0000-0000-0000-0000000000c1', 'aaaaaaaa-1111-0000-0000-000000000001', 'Spin A', 'a0000000-0000-0000-0000-0000000000f1', now(), now() + interval '1 hour', 10),
  ('b0000000-0000-0000-0000-0000000000c1', 'bbbbbbbb-1111-0000-0000-000000000001', 'Spin B', 'b0000000-0000-0000-0000-0000000000f1', now(), now() + interval '1 hour', 10);
INSERT INTO public.class_bookings (tenant_id, class_id, member_id) VALUES
  ('bbbbbbbb-1111-0000-0000-000000000001', 'b0000000-0000-0000-0000-0000000000c1', 'b0000000-0000-0000-0000-00000000000b');
INSERT INTO public.invoices (id, tenant_id, member_id, due_date, amount) VALUES
  ('a0000000-0000-0000-0000-0000000000d1', 'aaaaaaaa-1111-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', current_date, 20),
  ('b0000000-0000-0000-0000-0000000000d1', 'bbbbbbbb-1111-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', current_date, 35);
INSERT INTO public.expenses (id, tenant_id, description, amount, date) VALUES
  ('a0000000-0000-0000-0000-0000000000e1', 'aaaaaaaa-1111-0000-0000-000000000001', 'A rent', 100, current_date),
  ('b0000000-0000-0000-0000-0000000000e1', 'bbbbbbbb-1111-0000-0000-000000000001', 'B rent', 200, current_date);
INSERT INTO public.branches (id, tenant_id, name) VALUES
  ('a0000000-0000-0000-0000-0000000000b1', 'aaaaaaaa-1111-0000-0000-000000000001', 'A main'),
  ('b0000000-0000-0000-0000-0000000000b1', 'bbbbbbbb-1111-0000-0000-000000000001', 'B main');
INSERT INTO public.member_tasks (tenant_id, member_id, title, created_by) VALUES
  ('bbbbbbbb-1111-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', 'Call Basim', '00000000-0000-0000-0000-0000000000b1');
INSERT INTO public.pos_products (id, tenant_id, name, sku, price, vat_rate, track_inventory) VALUES
  ('b0000000-0000-0000-0000-0000000000a1', 'bbbbbbbb-1111-0000-0000-000000000001', 'B water', 'B-WATER', 1.000, 10, false);
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end) VALUES
  ('aaaaaaaa-1111-0000-0000-000000000001', 'active', 'starter', 20, 'BHD', 'paddle', 'sub_a', now() + interval '10 days'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'active', 'pro',     35, 'BHD', 'paddle', 'sub_b', now() + interval '10 days');
RESET ROLE;

-- Gym B completes a real POS sale (so there is a sale to attack).
SELECT test.become('00000000-0000-0000-0000-0000000000b1');
CREATE TEMP TABLE b_sale AS
  SELECT public.complete_pos_sale(NULL, 0, 'cash', NULL, NULL,
    '[{"product_id":"b0000000-0000-0000-0000-0000000000a1","quantity":1}]', 'BHD') AS r;
GRANT SELECT ON b_sale TO PUBLIC;
RESET ROLE;

-- --------------------------------------------------------------------------
-- 1. Catalog: every tenant table is under row level security
-- --------------------------------------------------------------------------
SELECT test.ok((SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'tenant_id') >= 20,
               'sanity: the schema has plenty of tenant_id tables to check');

SELECT test.ok(NOT EXISTS (
  SELECT 1 FROM information_schema.columns c
  JOIN pg_class k ON k.relname = c.table_name AND k.relnamespace = 'public'::regnamespace AND k.relkind = 'r'
  WHERE c.table_schema = 'public' AND c.column_name = 'tenant_id' AND NOT k.relrowsecurity
), 'every table with a tenant_id has row level security ENABLED');

-- A tenant table with RLS on and NO policy is either closed on purpose (the
-- platform console's own tables: every privilege revoked from anon and
-- authenticated, reachable only through platform_* functions) or a table nobody
-- remembered to write rules for. Only the first is acceptable.
SELECT test.ok(NOT EXISTS (
  SELECT 1 FROM information_schema.columns c
  JOIN pg_class k ON k.relname = c.table_name AND k.relnamespace = 'public'::regnamespace AND k.relkind = 'r'
  WHERE c.table_schema = 'public' AND c.column_name = 'tenant_id'
    AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.table_name)
    AND (has_table_privilege('anon', k.oid, 'SELECT, INSERT, UPDATE, DELETE')
      OR has_table_privilege('authenticated', k.oid, 'SELECT, INSERT, UPDATE, DELETE'))
), 'every tenant table with no policy is fully closed to anon and authenticated');

SELECT test.ok((SELECT array_agg(c.table_name::text ORDER BY c.table_name::text)
                FROM information_schema.columns c
                JOIN pg_class k ON k.relname = c.table_name AND k.relnamespace = 'public'::regnamespace AND k.relkind = 'r'
                WHERE c.table_schema = 'public' AND c.column_name = 'tenant_id'
                  AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.table_name))
               = ARRAY['platform_audit_log', 'platform_suspensions']::text[],
               'the only closed-by-design tables are the platform console''s own (a new one needs a decision, not an accident)');

SELECT test.ok(NOT EXISTS (
  SELECT 1 FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = p.tablename AND c.column_name = 'tenant_id')
    AND p.cmd IN ('SELECT', 'ALL')
    AND p.roles && ARRAY['public', 'anon', 'authenticated']::name[]
    AND btrim(coalesce(p.qual, ''), '()') = 'true'
), 'no policy on a tenant table lets everyone read everything (USING true)');

-- --------------------------------------------------------------------------
-- 2. Reads: gym A's admin sees none of gym B, on EVERY tenant table
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
DO $$
DECLARE r record; leaked text := '';
BEGIN
  FOR r IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    JOIN pg_class k ON k.relname = c.table_name AND k.relnamespace = 'public'::regnamespace AND k.relkind = 'r'
    WHERE c.table_schema = 'public' AND c.column_name = 'tenant_id'
  LOOP
    IF test.visible(r.table_name, 'bbbbbbbb-1111-0000-0000-000000000001') > 0 THEN
      leaked := leaked || ' ' || r.table_name;
    END IF;
  END LOOP;
  IF leaked <> '' THEN
    RAISE EXCEPTION 'TEST FAILED: gym A can read gym B rows in:%', leaked;
  END IF;
  UPDATE test.counter SET n = n + 1;
END;
$$;

-- ...and the same tables really do hold gym B data (the checks above are not vacuous)
RESET ROLE;
SELECT test.ok((SELECT count(*) FROM public.members WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001') = 1
           AND (SELECT count(*) FROM public.invoices WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001') = 1
           AND (SELECT count(*) FROM public.expenses WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001') = 1
           AND (SELECT count(*) FROM public.classes WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001') = 1
           AND (SELECT count(*) FROM public.branches WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001') = 1
           AND (SELECT count(*) FROM public.pos_sales WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001') = 1
           AND (SELECT count(*) FROM public.member_tasks WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001') = 1,
           'gym B really has data in members, invoices, expenses, classes, branches, POS and tasks');

-- Gym A still sees its own.
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT test.ok(test.visible('members', 'aaaaaaaa-1111-0000-0000-000000000001') = 1
           AND test.visible('invoices', 'aaaaaaaa-1111-0000-0000-000000000001') = 1
           AND test.visible('branches', 'aaaaaaaa-1111-0000-0000-000000000001') = 1, 'gym A sees its own rows');
SELECT test.ok((SELECT count(*) FROM public.tenants) = 1 AND (SELECT id FROM public.tenants) = 'aaaaaaaa-1111-0000-0000-000000000001', 'gym A sees only its own tenant row');
SELECT test.ok((SELECT count(*) FROM public.platform_subscriptions) = 1, 'gym A sees only its own subscription');
SELECT test.ok((SELECT count(*) FROM public.memberships WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001') = 0, 'gym A cannot list gym B''s staff');
RESET ROLE;

-- Direct lookups by id do not leak either
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.members WHERE id = 'b0000000-0000-0000-0000-00000000000b'), 'gym B''s member cannot be fetched by id');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.invoices WHERE id = 'b0000000-0000-0000-0000-0000000000d1'), 'gym B''s invoice cannot be fetched by id');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 3. Writes: A cannot insert into, change, move or delete B's rows
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT test.expect_err($q$INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status) VALUES ('bbbbbbbb-1111-0000-0000-000000000001', 'Evil', 'A', 'evil@a.dev', 'basic', current_date, 'active')$q$, '42501', NULL, 'cannot insert a member into gym B');
SELECT test.expect_err($q$INSERT INTO public.expenses (tenant_id, description, amount, date) VALUES ('bbbbbbbb-1111-0000-0000-000000000001', 'fake', 1, current_date)$q$, '42501', NULL, 'cannot insert an expense into gym B');
SELECT test.expect_err($q$INSERT INTO public.invoices (tenant_id, member_id, due_date, amount) VALUES ('bbbbbbbb-1111-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', current_date, 1)$q$, '42501', NULL, 'cannot invoice gym B''s member');
SELECT test.expect_err($q$INSERT INTO public.branches (tenant_id, name) VALUES ('bbbbbbbb-1111-0000-0000-000000000001', 'Evil branch')$q$, '42501', NULL, 'cannot insert a branch into gym B');

SELECT test.ok(test.touched($q$UPDATE public.members SET first_name = 'Hacked' WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001'$q$) = 0, 'UPDATE of gym B members touches nothing');
SELECT test.ok(test.touched($q$UPDATE public.invoices SET amount = 0 WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001'$q$) = 0, 'UPDATE of gym B invoices touches nothing');
SELECT test.ok(test.touched($q$UPDATE public.expenses SET amount = 0 WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001'$q$) = 0, 'UPDATE of gym B expenses touches nothing');
SELECT test.ok(test.touched($q$UPDATE public.tenants SET name = 'Hacked' WHERE id = 'bbbbbbbb-1111-0000-0000-000000000001'$q$) = 0, 'cannot rename gym B');
SELECT test.ok(test.touched($q$DELETE FROM public.members WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001'$q$) = 0, 'DELETE of gym B members touches nothing');
SELECT test.ok(test.touched($q$DELETE FROM public.invoices WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001'$q$) = 0, 'DELETE of gym B invoices touches nothing');
SELECT test.ok(test.touched($q$DELETE FROM public.branches WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001'$q$) = 0, 'DELETE of gym B branches touches nothing');

-- Pushing one of A's own rows into B (or pulling B's into A) must fail as well.
SELECT test.ok(test.touched($q$UPDATE public.members SET tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001' WHERE id = 'a0000000-0000-0000-0000-00000000000a'$q$) = 0, 'cannot move A''s member into gym B');
SELECT test.ok(test.touched($q$UPDATE public.expenses SET tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001' WHERE id = 'a0000000-0000-0000-0000-0000000000e1'$q$) = 0, 'cannot move A''s expense into gym B');
SELECT test.ok(test.touched($q$UPDATE public.branches SET tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001' WHERE id = 'a0000000-0000-0000-0000-0000000000b1'$q$) = 0, 'cannot move A''s branch into gym B');
RESET ROLE;

SELECT test.ok((SELECT first_name FROM public.members WHERE id = 'b0000000-0000-0000-0000-00000000000b') = 'Basim'
           AND (SELECT amount FROM public.invoices WHERE id = 'b0000000-0000-0000-0000-0000000000d1') = 35
           AND (SELECT name FROM public.tenants WHERE id = 'bbbbbbbb-1111-0000-0000-000000000001') = 'Gym B'
           AND (SELECT count(*) FROM public.branches WHERE tenant_id = 'bbbbbbbb-1111-0000-0000-000000000001') = 1,
           'after every attack, gym B''s data is exactly as it was');
SELECT test.ok((SELECT tenant_id FROM public.members WHERE id = 'a0000000-0000-0000-0000-00000000000a') = 'aaaaaaaa-1111-0000-0000-000000000001', 'and gym A''s member is still in gym A');

-- --------------------------------------------------------------------------
-- 4. Privilege escalation through memberships
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a2');  -- A's employee
SELECT test.expect_err($q$INSERT INTO public.memberships (user_id, tenant_id, role) VALUES ('00000000-0000-0000-0000-0000000000a2', 'bbbbbbbb-1111-0000-0000-000000000001', 'admin')$q$, '42501', NULL, 'an employee cannot add themselves to gym B as admin');
SELECT test.expect_err($q$INSERT INTO public.memberships (user_id, tenant_id, role) VALUES ('00000000-0000-0000-0000-0000000000a2', 'aaaaaaaa-1111-0000-0000-000000000001', 'admin')$q$, '42501', NULL, 'an employee cannot add a second, admin membership in their own gym');
SELECT test.ok(test.touched($q$UPDATE public.memberships SET role = 'admin' WHERE user_id = '00000000-0000-0000-0000-0000000000a2'$q$) = 0, 'an employee cannot promote themselves');
RESET ROLE;
SELECT test.ok((SELECT role FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a2') = 'employee', 'the employee is still an employee');

SELECT test.become('00000000-0000-0000-0000-0000000000a3');  -- A's trainer
SELECT test.ok(test.touched($q$UPDATE public.memberships SET role = 'admin' WHERE user_id = '00000000-0000-0000-0000-0000000000a3'$q$) = 0, 'a trainer cannot promote themselves');
RESET ROLE;
SELECT test.ok((SELECT role FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a3') = 'trainer', 'the trainer is still a trainer');

SELECT test.become('00000000-0000-0000-0000-0000000000a1');  -- A's admin
SELECT test.expect_err($q$INSERT INTO public.memberships (user_id, tenant_id, role) VALUES ('00000000-0000-0000-0000-0000000000c1', 'bbbbbbbb-1111-0000-0000-000000000001', 'admin')$q$, '42501', NULL, 'gym A''s admin cannot add anyone to gym B');
RESET ROLE;

-- A user with no membership at all can do nothing
SELECT test.become('00000000-0000-0000-0000-0000000000c1');
SELECT test.ok(test.visible('members', 'aaaaaaaa-1111-0000-0000-000000000001') = 0 AND test.visible('members', 'bbbbbbbb-1111-0000-0000-000000000001') = 0, 'a signed-in user with no gym sees no members');
SELECT test.expect_err($q$INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status) VALUES ('aaaaaaaa-1111-0000-0000-000000000001', 'X', 'Y', 'x@y.dev', 'basic', current_date, 'active')$q$, '42501', NULL, 'and cannot create members in any gym');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 5. Anonymous visitors
-- --------------------------------------------------------------------------
SELECT test.become_anon();
SELECT test.ok(test.visible('members', 'aaaaaaaa-1111-0000-0000-000000000001') <= 0
           AND test.visible('invoices', 'bbbbbbbb-1111-0000-0000-000000000001') <= 0
           AND test.visible('pos_sales', 'bbbbbbbb-1111-0000-0000-000000000001') <= 0
           AND test.visible('platform_subscriptions', 'aaaaaaaa-1111-0000-0000-000000000001') <= 0, 'anon sees no members, invoices, sales or subscriptions');
SELECT test.expect_err($q$INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, status) VALUES ('aaaaaaaa-1111-0000-0000-000000000001', 'X', 'Y', 'x@y.dev', 'basic', current_date, 'active')$q$, '42501', NULL, 'anon cannot insert members');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 6. Money RPCs (SECURITY DEFINER) do not trust the ids they are given
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT test.expect_err($q$SELECT public.complete_pos_sale('b0000000-0000-0000-0000-00000000000b', 0, 'cash', NULL, NULL, '[]', 'BHD')$q$, 'P0001', NULL, 'POS sale needs at least one product');
SELECT test.expect_err($q$SELECT public.complete_pos_sale('b0000000-0000-0000-0000-00000000000b', 0, 'cash', NULL, NULL, '[{"product_id":"b0000000-0000-0000-0000-0000000000a1","quantity":1}]', 'BHD')$q$, 'P0001', 'Member does not belong', 'cannot sell to gym B''s member');
SELECT test.expect_err($q$SELECT public.complete_pos_sale(NULL, 0, 'cash', NULL, NULL, '[{"product_id":"b0000000-0000-0000-0000-0000000000a1","quantity":1}]', 'BHD')$q$, 'P0001', 'Product not found', 'cannot sell gym B''s product');
SELECT test.expect_err($q$SELECT public.return_pos_sale((SELECT (r->>'sale_id')::uuid FROM b_sale), '[{"sale_item_id":"00000000-0000-0000-0000-000000000000","quantity":1}]', 'refund')$q$, 'P0001', 'Sale not found', 'cannot return gym B''s sale');
SELECT test.ok(public.get_location_usage() ->> 'tenant_id' = 'aaaaaaaa-1111-0000-0000-000000000001', 'get_location_usage reports the caller''s own gym');
RESET ROLE;
SELECT test.ok((SELECT status FROM public.pos_sales WHERE id = (SELECT (r->>'sale_id')::uuid FROM b_sale)) = 'completed', 'gym B''s sale is untouched');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
