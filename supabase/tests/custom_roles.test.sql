-- Tests for 20261026090000_custom_roles.sql.
-- Same setup as the other files here (shim + schema + ALL migrations), then
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/custom_roles.test.sql
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

CREATE FUNCTION test.become(p_user uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
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
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  SET LOCAL ROLE anon;
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

CREATE TABLE test.ids (k text, v uuid);
GRANT ALL ON test.ids TO PUBLIC;

-- How many rows an authenticated user can see / whether a statement is refused by RLS.
CREATE FUNCTION test.rls_refused(p_sql text) RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RETURN false;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN true;
END;
$$;

-- --------------------------------------------------------------------------
-- Fixtures
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'admin@a.dev', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'employee@a.dev', now()),
  ('00000000-0000-0000-0000-0000000000a3', 'front@a.dev', now()),
  ('00000000-0000-0000-0000-0000000000a4', 'acct@a.dev', now()),
  ('00000000-0000-0000-0000-0000000000a5', 'coach@a.dev', now()),
  ('00000000-0000-0000-0000-0000000000b1', 'admin@b.dev', now()),
  ('00000000-0000-0000-0000-0000000000c1', 'new1@x.dev', NULL),
  ('00000000-0000-0000-0000-0000000000c2', 'new2@x.dev', NULL);
INSERT INTO public.tenants (id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Alpha Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Bravo Gym');
INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'aaaaaaaa-0000-0000-0000-000000000001', 'employee'),
  ('00000000-0000-0000-0000-0000000000a3', 'aaaaaaaa-0000-0000-0000-000000000001', 'employee'),
  ('00000000-0000-0000-0000-0000000000a4', 'aaaaaaaa-0000-0000-0000-000000000001', 'employee'),
  ('00000000-0000-0000-0000-0000000000a5', 'aaaaaaaa-0000-0000-0000-000000000001', 'trainer'),
  ('00000000-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-000000000002', 'admin');
INSERT INTO public.gym_settings (tenant_id, currency, vat_rate) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'BHD', 5),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'BHD', 5);

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'active', 'starter', 49, 'USD', 'paddle', 'sub_a', now() + interval '20 days'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'active', 'starter', 49, 'USD', 'paddle', 'sub_b', now() + interval '20 days');
RESET ROLE;

INSERT INTO public.members (id, tenant_id, first_name, last_name, email, membership_type, join_date, status, membership_status) VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'M', 'One', 'm1@a.dev', 'basic', current_date, 'active', 'active');
INSERT INTO public.plans (id, tenant_id, name, price, duration, status) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Monthly', 20, 30, 'active');
INSERT INTO public.pos_products (id, tenant_id, name, sku, price, vat_rate, track_inventory) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Water', 'W', 1, 5, false);
INSERT INTO public.trainers (id, tenant_id, first_name, last_name, email) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Tr', 'One', 'tr@a.dev');
INSERT INTO public.invoices (id, tenant_id, member_id, due_date, amount, total, vat_total, status, currency)
VALUES ('f0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', current_date, 100, 105, 5, 'paid', 'BHD');
INSERT INTO public.expenses (tenant_id, description, amount, date, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Rent', 500, current_date, 'approved');

-- --------------------------------------------------------------------------
-- 1. Roles: who may manage them, and what a valid role is
-- --------------------------------------------------------------------------
SELECT test.ok(array_length(public.staff_permission_catalog(), 1) = 8, 'the catalogue has 8 permissions');

SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.expect_err($q$SELECT public.staff_role_save(NULL, 'Hacker', 'employee', ARRAY['members.manage'])$q$, '42501', 'admin access', 'an employee cannot create roles');
SELECT test.expect_err($q$SELECT public.tenant_staff()$q$, '42501', 'admin access', 'an employee cannot list the team');
SELECT test.expect_err($q$SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a3', 'admin', NULL)$q$, '42501', 'admin access', 'an employee cannot promote anyone');
SELECT test.expect_err($q$SELECT public.staff_remove('00000000-0000-0000-0000-0000000000a3')$q$, '42501', 'admin access', 'an employee cannot remove anyone');
SELECT test.expect_err($q$INSERT INTO public.tenant_roles (tenant_id, name, base_role) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Direct', 'employee')$q$, '42501', NULL, 'the browser cannot write the roles table directly');
SELECT test.become_anon();
SELECT test.expect_err($q$SELECT public.staff_role_save(NULL, 'Anon', 'employee', '{}')$q$, '42501', NULL, 'anon cannot create roles');
SELECT test.expect_err($q$SELECT public.has_permission('aaaaaaaa-0000-0000-0000-000000000001', 'billing.view')$q$, '42501', NULL, 'anon cannot even call has_permission');

SELECT test.become('00000000-0000-0000-0000-0000000000a1');
CREATE TEMP TABLE r_front AS SELECT public.staff_role_save(NULL, '  Front   desk ', 'employee', ARRAY['members.manage','attendance.manage','pos.use','members.manage']) AS r;
CREATE TEMP TABLE r_acct  AS SELECT public.staff_role_save(NULL, 'Accountant', 'employee', ARRAY['billing.manage']) AS r;
CREATE TEMP TABLE r_coach AS SELECT public.staff_role_save(NULL, 'Coach', 'trainer', ARRAY['classes.manage']) AS r;
INSERT INTO test.ids SELECT 'front', (r->>'id')::uuid FROM r_front;
SELECT test.ok((SELECT r->>'name' = 'Front desk' FROM r_front), 'names are tidied');
SELECT test.ok((SELECT r->'permissions' = '["attendance.manage","members.manage","pos.use"]'::jsonb FROM r_front), 'permissions are de-duplicated and sorted');
SELECT test.ok((SELECT r->'permissions' = '["billing.manage","billing.view"]'::jsonb FROM r_acct), 'billing.manage implies billing.view');
SELECT test.expect_err($q$SELECT public.staff_role_save(NULL, 'front DESK', 'employee', '{}')$q$, '23505', 'already exists', 'role names are unique per gym, case-insensitively');
SELECT test.expect_err($q$SELECT public.staff_role_save(NULL, 'Bad', 'employee', ARRAY['superuser'])$q$, '22023', 'Unknown permission', 'an unknown permission is refused');
SELECT test.expect_err($q$SELECT public.staff_role_save(NULL, 'Bad', 'admin', '{}')$q$, '22023', 'employee or trainer', 'a custom role cannot be built on admin');
SELECT test.expect_err($q$SELECT public.staff_role_save(NULL, '   ', 'employee', '{}')$q$, '22023', '1 to 40', 'a blank name is refused');
SELECT test.expect_err(format($q$SELECT public.staff_role_save(NULL, %L, 'employee', '{}')$q$, repeat('x', 41)), '22023', '1 to 40', 'a long name is refused');
SELECT test.expect_err($q$SELECT public.staff_role_save(NULL, 'Bad coach', 'trainer', ARRAY['members.manage'])$q$, '22023', 'trainer-level', 'a trainer-tier role cannot hold employee-only permissions');
SELECT test.expect_err($q$SELECT public.staff_role_save('00000000-0000-0000-0000-00000000dead', 'Ghost', 'employee', '{}')$q$, 'P0002', 'Role not found', 'updating a role that does not exist');

-- Assign
SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a3', 'employee', (SELECT (r->>'id')::uuid FROM r_front));
SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a4', 'employee', (SELECT (r->>'id')::uuid FROM r_acct));
SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a5', 'trainer', (SELECT (r->>'id')::uuid FROM r_coach));
RESET ROLE;
SELECT test.ok((SELECT role = 'employee' AND custom_role_id IS NOT NULL FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a3'), 'the person now holds the custom role on the employee tier');

-- --------------------------------------------------------------------------
-- 2. has_permission
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.ok(public.has_permission('aaaaaaaa-0000-0000-0000-000000000001', 'billing.manage'), 'a built-in employee passes every permission (their tier decides)');
SELECT test.ok(NOT public.has_permission('aaaaaaaa-0000-0000-0000-000000000002', 'billing.manage'), 'but not in another gym');
SELECT test.become('00000000-0000-0000-0000-0000000000a3');
SELECT test.ok(public.has_permission('aaaaaaaa-0000-0000-0000-000000000001', 'members.manage'), 'front desk: members.manage');
SELECT test.ok(NOT public.has_permission('aaaaaaaa-0000-0000-0000-000000000001', 'billing.view'), 'front desk: no billing.view');
SELECT test.ok(NOT public.has_permission('aaaaaaaa-0000-0000-0000-000000000001', 'nonsense'), 'an unknown permission is never granted');
SELECT test.ok((public.my_staff_access() ->> 'custom_role_name') = 'Front desk' AND (public.my_staff_access() -> 'permissions') @> '["pos.use"]'::jsonb, 'my_staff_access reports the role and its permissions');
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.ok((public.my_staff_access() -> 'permissions') = 'null'::jsonb AND (public.my_staff_access() ->> 'role') = 'employee', 'a built-in role reports permissions = null');

-- --------------------------------------------------------------------------
-- 3. Built-in roles are unchanged (regression)
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'E', 'Mp', 'e@a.dev', 'basic', current_date);
INSERT INTO public.invoices (tenant_id, member_id, due_date, amount, total, status) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', current_date, 10, 10, 'pending');
SELECT test.ok((SELECT count(*) FROM public.invoices) = 2, 'a built-in employee still sees and writes invoices');
SELECT test.ok((public.complete_pos_sale(NULL, 0, 'cash', NULL, NULL, '[{"product_id":"e0000000-0000-0000-0000-000000000001","quantity":1}]', 'BHD') ->> 'total')::numeric = 1.05, 'and still sells');

-- --------------------------------------------------------------------------
-- 4. Front desk: members, attendance and the till - not money
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a3');
INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'F', 'D', 'fd@a.dev', 'basic', current_date);
UPDATE public.members SET phone = '123' WHERE id = '11111111-0000-0000-0000-000000000001';
SELECT test.ok((SELECT phone FROM public.members WHERE id = '11111111-0000-0000-0000-000000000001') = '123', 'front desk edits members');
SELECT test.ok((SELECT count(*) FROM public.invoices) = 0, 'front desk sees no invoices');
SELECT test.ok((SELECT count(*) FROM public.expenses) = 0, 'front desk sees no expenses');
SELECT test.ok(test.rls_refused($q$INSERT INTO public.invoices (tenant_id, member_id, due_date, amount, total, status) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', current_date, 1, 1, 'paid')$q$), 'front desk cannot create invoices');
SELECT test.ok(test.rls_refused($q$INSERT INTO public.expenses (tenant_id, description, amount, date) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 1, current_date)$q$), 'front desk cannot create expenses');
SELECT test.ok(test.rls_refused($q$INSERT INTO public.pos_products (tenant_id, name, sku, price) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'X', 1)$q$), 'front desk cannot add products');
SELECT test.ok(test.rls_refused($q$INSERT INTO public.classes (tenant_id, name, trainer_id, start_time, end_time, capacity) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'd0000000-0000-0000-0000-000000000001', now(), now() + interval '1 hour', 5)$q$), 'front desk cannot schedule classes');
SELECT test.ok(test.rls_refused($q$INSERT INTO public.trainers (tenant_id, first_name, last_name, email) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'y', 'x@y.dev')$q$), 'front desk cannot add trainers');
SELECT test.ok((public.complete_pos_sale(NULL, 0, 'cash', NULL, NULL, '[{"product_id":"e0000000-0000-0000-0000-000000000001","quantity":2}]', 'BHD') ->> 'total')::numeric = 2.10, 'front desk (pos.use) sells');
SELECT test.ok((SELECT count(*) FROM public.pos_sales) >= 1, 'and sees sales');
SELECT test.expect_err($q$SELECT public.adjust_pos_inventory('e0000000-0000-0000-0000-000000000001', 5, 'x')$q$, 'P0001', 'employee access', 'but cannot adjust stock (pos.manage)');
SELECT test.expect_err($q$SELECT public.get_financial_metrics('month')$q$, 'P0001', 'denied', 'front desk cannot read financial metrics');
SELECT test.expect_err($q$SELECT public.generate_vat_return('aaaaaaaa-0000-0000-0000-000000000001', current_date - 1, current_date)$q$, 'P0001', 'denied', 'front desk cannot generate VAT returns');
SELECT test.ok((public.get_analytics_overview() ->> 'total_revenue')::numeric = 0 AND (public.get_analytics_overview() ->> 'total_members')::int >= 1, 'the overview hides revenue but keeps member counts');
-- Plans: members.manage but not billing.manage.
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001')$q$, '42501', 'billing access', 'putting a member on a plan records a payment, which needs billing');
SELECT test.ok((public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', false, NULL, NULL, false) ->> 'invoice_id') IS NULL, 'without recording a payment it works');

-- The front desk books members into classes (members.manage), though it cannot schedule them.
RESET ROLE;
INSERT INTO public.classes (id, tenant_id, name, trainer_id, start_time, end_time, capacity) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Yoga', 'd0000000-0000-0000-0000-000000000001', now(), now() + interval '1 hour', 10);
SELECT test.become('00000000-0000-0000-0000-0000000000a3');
INSERT INTO public.class_bookings (tenant_id, class_id, member_id) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001');
SELECT test.ok((SELECT count(*) FROM public.class_bookings) = 1, 'front desk books a member into a class');

-- --------------------------------------------------------------------------
-- 5. Accountant: money, read-only everywhere else
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a4');
SELECT test.ok((SELECT count(*) FROM public.invoices) = 2, 'accountant sees invoices');
SELECT test.ok((SELECT count(*) FROM public.expenses) = 1, 'and expenses');
INSERT INTO public.expenses (tenant_id, description, amount, date) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Water bill', 20, current_date);
UPDATE public.invoices SET status = 'paid' WHERE id = 'f0000000-0000-0000-0000-000000000001';
SELECT test.ok((get_cm.v)::text IS NOT NULL, 'accountant reads financial metrics') FROM (SELECT public.get_financial_metrics('month') AS v) get_cm;
SELECT test.ok((public.get_analytics_overview() ->> 'total_revenue')::numeric > 0, 'and sees revenue');
SELECT test.ok(test.rls_refused($q$INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'A', 'B', 'ab@a.dev', 'basic', current_date)$q$), 'accountant cannot add members');
SELECT test.ok((SELECT count(*) FROM public.members) >= 1, 'but can see them (reads stay open)');
SELECT test.expect_err($q$SELECT public.complete_pos_sale(NULL, 0, 'cash', NULL, NULL, '[{"product_id":"e0000000-0000-0000-0000-000000000001","quantity":1}]', 'BHD')$q$, 'P0001', 'employee access', 'accountant cannot sell');
SELECT test.ok((SELECT count(*) FROM public.pos_sales) = 0, 'accountant cannot see sales');
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001')$q$, '42501', 'employee access', 'accountant cannot change memberships');

-- --------------------------------------------------------------------------
-- 6. Coach (trainer tier): classes only
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a5');
INSERT INTO public.classes (tenant_id, name, trainer_id, start_time, end_time, capacity) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Spin', 'd0000000-0000-0000-0000-000000000001', now(), now() + interval '1 hour', 10);
SELECT test.ok((SELECT count(*) FROM public.classes WHERE name = 'Spin') = 1, 'coach schedules classes');
SELECT test.ok(test.rls_refused($q$INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'A', 'B', 'ab2@a.dev', 'basic', current_date)$q$), 'coach cannot add members');
SELECT test.ok((SELECT count(*) FROM public.invoices) = 0, 'coach has no billing.view, so sees no invoices');

-- --------------------------------------------------------------------------
-- 7. Escalation attempts
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a3');
SELECT test.ok(test.rls_refused($q$UPDATE public.memberships SET custom_role_id = NULL WHERE user_id = '00000000-0000-0000-0000-0000000000a3'$q$) OR (SELECT custom_role_id IS NOT NULL FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a3'), 'front desk cannot drop their own custom role');
SELECT test.ok((SELECT count(*) FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a3' AND role = 'admin') = 0, 'and is still not an admin');
SELECT test.ok(test.rls_refused($q$UPDATE public.tenant_roles SET permissions = ARRAY['billing.manage']$q$), 'nobody but the functions can edit a role');
SELECT test.ok(test.rls_refused($q$DELETE FROM public.tenant_roles$q$), 'nor delete one');
SELECT test.expect_err($q$SELECT public.staff_role_save('00000000-0000-0000-0000-000000000000', 'x', 'employee', '{}')$q$, '42501', 'admin access', 'nor through the function');
SELECT test.ok((SELECT count(*) FROM public.tenant_roles) = 3, 'a gym sees its own roles');

SELECT test.become('00000000-0000-0000-0000-0000000000b1');
SELECT test.ok((SELECT count(*) FROM public.tenant_roles) = 0, 'another gym sees none of them');
SELECT test.expect_err(format($q$SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000b1', 'employee', %L)$q$, (SELECT r->>'id' FROM r_front)), '55000', 'your own role', 'cannot change own role');
SELECT test.expect_err(format($q$SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a3', 'employee', %L)$q$, (SELECT r->>'id' FROM r_front)), 'P0002', 'not on your team', 'another gym''s admin cannot touch this person');
SELECT test.expect_err(format($q$SELECT public.staff_role_delete(%L)$q$, (SELECT r->>'id' FROM r_front)), 'P0002', 'Role not found', 'or delete its roles');
SELECT test.expect_err(format($q$UPDATE public.memberships SET custom_role_id = %L WHERE user_id = '00000000-0000-0000-0000-0000000000b1'$q$, (SELECT r->>'id' FROM r_front)), '42501', 'does not belong', 'an admin cannot attach another gym''s role to a membership');
SELECT test.ok((SELECT jsonb_array_length(public.tenant_staff())) = 1, 'a gym lists only its own team');

-- --------------------------------------------------------------------------
-- 8. Team management rules
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT test.ok((SELECT jsonb_array_length(public.tenant_staff())) = 5, 'the admin lists the whole team');
SELECT test.ok((SELECT public.tenant_staff() -> 0 ->> 'role') = 'admin', 'admins come first');
SELECT test.ok((SELECT x ->> 'custom_role_name' FROM jsonb_array_elements(public.tenant_staff()) x WHERE x ->> 'email' = 'front@a.dev') = 'Front desk', 'with their role names');
SELECT test.expect_err($q$SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a1', 'employee', NULL)$q$, '55000', 'your own role', 'an admin cannot demote themselves');
SELECT test.expect_err($q$SELECT public.staff_remove('00000000-0000-0000-0000-0000000000a1')$q$, '55000', 'yourself', 'or remove themselves');
SELECT test.expect_err($q$SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a3', 'root', NULL)$q$, '22023', 'Unknown role', 'an unknown built-in role');
SELECT test.expect_err(format($q$SELECT public.staff_role_delete(%L)$q$, (SELECT r->>'id' FROM r_front)), '55000', 'Move the people', 'a role in use cannot be deleted');

-- Changing a role's tier moves its people; picking a built-in role replaces the custom one.
SELECT public.staff_role_save((SELECT (r->>'id')::uuid FROM r_coach), 'Coach', 'trainer', ARRAY['classes.manage','billing.view']);
SELECT test.ok((SELECT permissions = ARRAY['billing.view','classes.manage'] FROM public.tenant_roles WHERE name = 'Coach'), 'a role can be edited');
CREATE TEMP TABLE r_lead AS SELECT public.staff_role_save(NULL, 'Lead', 'employee', ARRAY['classes.manage']) AS r;
SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a5', 'trainer', (SELECT (r->>'id')::uuid FROM r_lead));
RESET ROLE;
SELECT test.ok((SELECT role = 'employee' FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a5'), 'moving to an employee-tier role raises the stored tier');
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT public.staff_role_save((SELECT (r->>'id')::uuid FROM r_lead), 'Lead', 'trainer', ARRAY['classes.manage']);
RESET ROLE;
SELECT test.ok((SELECT role = 'trainer' AND custom_role_id IS NOT NULL FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a5'), 'changing the role''s tier moves its people with it');
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a5', 'trainer', NULL);
RESET ROLE;
SELECT test.ok((SELECT role = 'trainer' AND custom_role_id IS NULL FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a5'), 'picking a built-in role clears the custom one');
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT public.staff_role_delete((SELECT (r->>'id')::uuid FROM r_lead));
SELECT test.ok((SELECT count(*) FROM public.tenant_roles WHERE name = 'Lead') = 0, 'an unused role can be deleted');

-- An admin never holds a custom role.
SELECT public.staff_set_role('00000000-0000-0000-0000-0000000000a3', 'admin', NULL);
RESET ROLE;
SELECT test.ok((SELECT role = 'admin' AND custom_role_id IS NULL FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a3'), 'promoting someone to admin clears their custom role');
SELECT test.become('00000000-0000-0000-0000-0000000000a3');
SELECT test.ok((SELECT count(*) FROM public.invoices) = 2, 'and they see everything again');
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT public.staff_remove('00000000-0000-0000-0000-0000000000a4');
RESET ROLE;
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a4'), 'removing someone ends their membership');
SELECT test.ok(EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000a4'), 'but not their login');

-- --------------------------------------------------------------------------
-- 9. Inviting
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.expect_err($q$SELECT public.staff_invite_context()$q$, '42501', 'admin access', 'only an admin gets an invite context');
SELECT test.expect_err($q$SELECT public.staff_provision('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 'employee', NULL)$q$, '42501', NULL, 'the browser cannot call staff_provision');
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT test.ok((public.staff_invite_context() ->> 'tenant_id') = 'aaaaaaaa-0000-0000-0000-000000000001', 'the admin''s invite context names their gym');
SELECT test.become_service();
SELECT public.staff_provision('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 'trainer', NULL);
SELECT public.staff_provision('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c2', 'employee', (SELECT v FROM test.ids WHERE k = 'front'));
SELECT test.expect_err($q$SELECT public.staff_provision('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 'employee', NULL)$q$, '55000', 'already belongs', 'a person already in a gym cannot be added again');
SELECT test.expect_err($q$SELECT public.staff_provision('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a2', 'employee', NULL)$q$, '55000', 'already belongs', 'nor moved to another gym');
SELECT test.expect_err($q$SELECT public.staff_provision('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000dead', 'employee', NULL)$q$, 'P0002', 'User not found', 'an unknown user');
RESET ROLE;
SELECT test.ok((SELECT role FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000c1') = 'trainer', 'a provisioned trainer');
SELECT test.ok((SELECT role = 'employee' AND custom_role_id IS NOT NULL FROM public.memberships WHERE user_id = '00000000-0000-0000-0000-0000000000c2'), 'a provisioned custom-role employee');
SELECT test.ok((SELECT x ->> 'pending_invite' FROM jsonb_array_elements((SELECT public.tenant_staff() FROM (SELECT test.become('00000000-0000-0000-0000-0000000000a1')) s)) x WHERE x ->> 'email' = 'new1@x.dev') = 'true', 'the team list marks people who have not signed in yet');
RESET ROLE;

-- Admin is not a role an invitation can hand out.
SELECT test.become_service();
SELECT test.expect_err($q$SELECT public.staff_provision('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c1', 'admin', NULL)$q$, '55000', 'already belongs', 'checked in order (membership first)');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 9b. Files: invoices and receipts follow billing, trainer documents follow trainers
-- --------------------------------------------------------------------------
-- (The storage path helper only accepts real v4-style tenant ids, so this uses its own gym.)
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000d1', 'd1@d.dev', now()),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@d.dev', now());
INSERT INTO public.tenants (id, name) VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Delta Gym');
INSERT INTO public.tenant_roles (id, tenant_id, name, base_role, permissions) VALUES
  ('dd000000-0000-4000-8000-000000000001', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'FD', 'employee', ARRAY['members.manage']);
INSERT INTO public.memberships (user_id, tenant_id, role, custom_role_id) VALUES
  ('00000000-0000-0000-0000-0000000000d1', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'employee', NULL),
  ('00000000-0000-0000-0000-0000000000d2', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'employee', 'dd000000-0000-4000-8000-000000000001');
SELECT test.become('00000000-0000-0000-0000-0000000000d2');
SELECT test.ok(test.rls_refused($q$INSERT INTO storage.objects (bucket_id, name) VALUES ('invoice-files', 'invoices/dddddddd-dddd-4ddd-8ddd-dddddddddddd/x.pdf')$q$), 'a custom role without billing cannot upload an invoice file');
SELECT test.ok(test.rls_refused($q$INSERT INTO storage.objects (bucket_id, name) VALUES ('expense-receipts', 'receipts/dddddddd-dddd-4ddd-8ddd-dddddddddddd/x.pdf')$q$), 'nor an expense receipt');
SELECT test.become('00000000-0000-0000-0000-0000000000d1');   -- a built-in employee
INSERT INTO storage.objects (bucket_id, name) VALUES ('invoice-files', 'invoices/dddddddd-dddd-4ddd-8ddd-dddddddddddd/y.pdf');
INSERT INTO storage.objects (bucket_id, name) VALUES ('expense-receipts', 'receipts/dddddddd-dddd-4ddd-8ddd-dddddddddddd/y.pdf');
SELECT test.ok((SELECT count(*) FROM storage.objects WHERE bucket_id IN ('invoice-files', 'expense-receipts')) = 2, 'a built-in employee still uploads and reads them');
SELECT test.become('00000000-0000-0000-0000-0000000000d2');
SELECT test.ok((SELECT count(*) FROM storage.objects WHERE bucket_id IN ('invoice-files', 'expense-receipts')) = 0, 'the custom role cannot read them either');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 9c. Deleting a whole gym works even while people hold its custom roles
-- --------------------------------------------------------------------------
SELECT test.expect_err($q$DELETE FROM public.tenant_roles WHERE id = 'dd000000-0000-4000-8000-000000000001'$q$, '23503', NULL, 'a role someone holds cannot be deleted directly');
DELETE FROM public.tenants WHERE id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.tenant_roles WHERE tenant_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd')
           AND NOT EXISTS (SELECT 1 FROM public.memberships WHERE tenant_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), 'deleting the gym removes its roles and memberships together');

-- --------------------------------------------------------------------------
-- 10. Privileges
-- --------------------------------------------------------------------------
SELECT test.ok(NOT has_function_privilege('anon', 'public.has_permission(uuid, text)', 'EXECUTE'), 'has_permission: not for anon');
SELECT test.ok(has_function_privilege('authenticated', 'public.has_permission(uuid, text)', 'EXECUTE'), 'has_permission: authenticated (policies call it)');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.staff_provision(uuid, uuid, text, uuid)', 'EXECUTE')
           AND has_function_privilege('service_role', 'public.staff_provision(uuid, uuid, text, uuid)', 'EXECUTE'), 'staff_provision: service role only');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.tenant_roles_guard()', 'EXECUTE')
           AND NOT has_function_privilege('authenticated', 'public.memberships_custom_role_guard()', 'EXECUTE')
           AND NOT has_function_privilege('authenticated', 'public.tenant_roles_follow_tier()', 'EXECUTE'), 'the trigger functions are internal');
SELECT test.ok(NOT has_table_privilege('anon', 'public.tenant_roles', 'SELECT')
           AND NOT has_table_privilege('authenticated', 'public.tenant_roles', 'INSERT,UPDATE,DELETE')
           AND has_table_privilege('authenticated', 'public.tenant_roles', 'SELECT'), 'tenant_roles: read-only for the browser');
SELECT test.ok((SELECT count(*) FROM pg_policies WHERE policyname LIKE '%\_perm\_%' AND permissive = 'RESTRICTIVE') = 56, 'the restrictive overlay is in place');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
