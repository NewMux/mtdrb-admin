-- Tests for 20261025090000_membership_plans.sql.
-- Same setup as the other files here (shim + schema + ALL migrations), then
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/membership_plans.test.sql
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

-- The gym's (Asia/Bahrain) calendar date, to compute expectations.
CREATE FUNCTION test.today() RETURNS date LANGUAGE sql AS $$ SELECT (now() AT TIME ZONE 'Asia/Bahrain')::date $$;

-- --------------------------------------------------------------------------
-- Fixtures
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'admin@a.dev'),
  ('00000000-0000-0000-0000-0000000000a2', 'employee@a.dev'),
  ('00000000-0000-0000-0000-0000000000a3', 'trainer@a.dev'),
  ('00000000-0000-0000-0000-0000000000b1', 'admin@b.dev');
INSERT INTO public.tenants (id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Alpha Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Bravo Gym');
INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'aaaaaaaa-0000-0000-0000-000000000001', 'employee'),
  ('00000000-0000-0000-0000-0000000000a3', 'aaaaaaaa-0000-0000-0000-000000000001', 'trainer'),
  ('00000000-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-000000000002', 'admin');
INSERT INTO public.gym_settings (tenant_id, currency, metadata) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'BHD', '{"general":{"timezone":"Asia/Bahrain"}}');

INSERT INTO public.plans (id, tenant_id, name, price, duration, status) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Monthly', 20.500, 30, 'active'),
  ('b0000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Yearly',  200,   365, 'active'),
  ('b0000000-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Retired', 10,    30, 'inactive'),
  ('b0000000-0000-0000-0000-000000000009', 'aaaaaaaa-0000-0000-0000-000000000002', 'Bravo plan', 10, 30, 'active');

INSERT INTO public.members (id, tenant_id, first_name, last_name, email, membership_type, join_date, status, membership_status, expiry_date) VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'New',    'Member', 'new@a.dev',    'Standard', current_date, 'active',    'active',   NULL),
  ('11111111-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Paid',   'Member', 'paid@a.dev',   'Standard', current_date, 'active',    'active',   test.today() + 10),
  ('11111111-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Lapsed', 'Member', 'lapsed@a.dev', 'Standard', current_date, 'inactive',  'expired',  test.today() - 40),
  ('11111111-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'Susp',   'Member', 'susp@a.dev',   'Standard', current_date, 'suspended', 'suspended', test.today() - 5),
  ('22222222-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Bravo',  'Member', 'b@b.dev',      'Standard', current_date, 'active',    'active',   NULL);

-- --------------------------------------------------------------------------
-- 1. Who may call it
-- --------------------------------------------------------------------------
SELECT test.become_anon();
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001')$q$, '42501', NULL, 'anon refused');
SELECT test.expect_err($q$SELECT * FROM public.plan_member_counts()$q$, '42501', NULL, 'anon cannot read plan counts');
SELECT test.become('00000000-0000-0000-0000-0000000000a3');
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001')$q$, '42501', 'employee access', 'a trainer cannot change memberships');
SELECT test.expect_err($q$SELECT * FROM public.plan_member_counts()$q$, '42501', 'employee access', 'a trainer cannot read plan counts');
SELECT test.become('00000000-0000-0000-0000-0000000000b1');
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001')$q$, 'P0002', 'Member not found', 'another gym''s admin cannot touch this member');
SELECT test.expect_err($q$SELECT public.assign_member_plan('22222222-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001')$q$, 'P0002', 'Plan not found', 'and cannot use another gym''s plan');

-- --------------------------------------------------------------------------
-- 2. Assigning
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
CREATE TEMP TABLE a1 AS SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001') AS r;
RESET ROLE;
SELECT test.ok((SELECT (r->>'start_date')::date = test.today() AND (r->>'expiry_date')::date = test.today() + 29 FROM a1), 'a 30-day plan from today ends 29 days later (30 days of access)');
SELECT test.ok((SELECT m.plan_id = 'b0000000-0000-0000-0000-000000000001' AND m.membership_type = 'Monthly' AND m.expiry_date = test.today() + 29 FROM public.members m WHERE m.id = '11111111-0000-0000-0000-000000000001'), 'the member row carries plan, type name and expiry');
SELECT test.ok((SELECT (m.metadata->>'membership_price')::numeric = 20.500 FROM public.members m WHERE m.id = '11111111-0000-0000-0000-000000000001'), 'the plan price is recorded (BHD keeps fils)');

-- The sale is recorded with it: the gym charges 5% on top, BHD keeps its fils.
SELECT test.ok((SELECT count(*) FROM public.invoices WHERE member_id = '11111111-0000-0000-0000-000000000001') = 1, 'one invoice was recorded for the plan');
SELECT test.ok((SELECT i.amount = 20.500 AND i.vat_total = 1.025 AND i.total = 21.525 AND i.paid_amount = 21.525 AND i.status = 'paid' AND i.type = 'membership' AND i.payment_method = 'cash' AND i.currency = 'BHD' FROM public.invoices i WHERE i.member_id = '11111111-0000-0000-0000-000000000001'), 'invoice: net 20.500 + VAT 1.025 = 21.525, paid in cash, in the gym''s currency, to the fil');
SELECT test.ok((SELECT i.issue_date = test.today() AND i.paid_date = test.today() FROM public.invoices i WHERE i.member_id = '11111111-0000-0000-0000-000000000001'), 'invoice: dated in the gym''s calendar');
SELECT test.ok((SELECT i.metadata->>'plan_name' = 'Monthly' AND i.metadata->>'source' = 'membership_plan' AND i.metadata->>'invoice_number' LIKE 'INV-%' FROM public.invoices i WHERE i.member_id = '11111111-0000-0000-0000-000000000001'), 'invoice: carries the plan and a number');
SELECT test.ok((SELECT coalesce(sum((l->>'amount')::numeric), 0) = 1.025 FROM public.invoices i, jsonb_array_elements(i.tax_breakdown) l WHERE i.member_id = '11111111-0000-0000-0000-000000000001'), 'invoice: the per-tax split adds up to the VAT');
SELECT test.ok((SELECT (i.line_items->0->>'total')::numeric = i.total FROM public.invoices i WHERE i.member_id = '11111111-0000-0000-0000-000000000001'), 'invoice: the line matches the total');

SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.ok((public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', false, test.today() + 5, 150.5555) ->> 'price')::numeric = 150.556, 'a custom price is rounded to the currency''s decimals');
SELECT test.ok((SELECT (r->>'expiry_date')::date = test.today() + 5 + 364 FROM (SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', false, test.today() + 5, 0) AS r) x), 'an explicit start date is honoured; a free price (0) is allowed');
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', false, NULL, -1)$q$, '22023', 'negative', 'a negative price is refused');
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003')$q$, '55000', 'not active', 'an inactive plan cannot be assigned');
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000009')$q$, 'P0002', 'Plan not found', 'another gym''s plan cannot be assigned');
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000dead')$q$, 'P0002', 'Plan not found', 'an unknown plan');
SELECT test.expect_err($q$SELECT public.assign_member_plan('00000000-0000-0000-0000-00000000dead', 'b0000000-0000-0000-0000-000000000001')$q$, 'P0002', 'Member not found', 'an unknown member');

-- --------------------------------------------------------------------------
-- 3. Renewing
-- --------------------------------------------------------------------------
-- Still paid for 10 more days: the renewal continues straight after them.
SELECT test.ok((public.assign_member_plan('11111111-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', true) ->> 'start_date')::date = test.today() + 11, 'renewing before expiry starts the day after the paid period');
RESET ROLE;
SELECT test.ok((SELECT expiry_date = test.today() + 10 + 30 FROM public.members WHERE id = '11111111-0000-0000-0000-000000000002'), 'so no paid day is lost: old expiry + 30');
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
-- Lapsed 40 days ago: starts today and is reactivated.
SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', true);
RESET ROLE;
SELECT test.ok((SELECT expiry_date = test.today() + 29 AND status = 'active' AND membership_status = 'active' FROM public.members WHERE id = '11111111-0000-0000-0000-000000000003'), 'renewing a lapsed member starts today and reactivates them');
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
-- A suspended member is renewed but stays suspended.
SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', true);
RESET ROLE;
SELECT test.ok((SELECT status = 'suspended' AND membership_status = 'suspended' AND plan_id IS NOT NULL FROM public.members WHERE id = '11111111-0000-0000-0000-000000000004'), 'a suspended member keeps their suspension');

-- --------------------------------------------------------------------------
-- 4. Counts
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.ok((SELECT members FROM public.plan_member_counts() WHERE plan_id = 'b0000000-0000-0000-0000-000000000001') = 2, 'Monthly: the paid member and the reactivated one (the suspended one is not counted)');
SELECT test.ok((SELECT members FROM public.plan_member_counts() WHERE plan_id = 'b0000000-0000-0000-0000-000000000002') = 1, 'Yearly: one member');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.plan_member_counts() WHERE plan_id = 'b0000000-0000-0000-0000-000000000009'), 'another gym''s plan never appears');
RESET ROLE;
UPDATE public.members SET expiry_date = test.today() - 1 WHERE id = '11111111-0000-0000-0000-000000000003';
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.ok((SELECT members FROM public.plan_member_counts() WHERE plan_id = 'b0000000-0000-0000-0000-000000000001') = 1, 'a member past their expiry stops counting');

-- --------------------------------------------------------------------------
-- 5. A member can only be on their own gym's plan, even by a direct write
-- --------------------------------------------------------------------------
SELECT test.expect_err($q$UPDATE public.members SET plan_id = 'b0000000-0000-0000-0000-000000000009' WHERE id = '11111111-0000-0000-0000-000000000001'$q$, '42501', 'does not belong', 'direct update to another gym''s plan is refused');
SELECT test.expect_err($q$INSERT INTO public.members (tenant_id, first_name, last_name, email, membership_type, join_date, plan_id) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'X', 'Y', 'x@a.dev', 'Standard', current_date, 'b0000000-0000-0000-0000-000000000009')$q$, '42501', 'does not belong', 'direct insert with another gym''s plan is refused');
RESET ROLE;

-- Deleting a plan leaves the member without one (and keeps their type name).
DELETE FROM public.plans WHERE id = 'b0000000-0000-0000-0000-000000000002';
SELECT test.ok((SELECT plan_id IS NULL AND membership_type = 'Yearly' FROM public.members WHERE id = '11111111-0000-0000-0000-000000000001'), 'deleting a plan unlinks its members but keeps the type name');

-- --------------------------------------------------------------------------
-- 6. Invoice options
-- --------------------------------------------------------------------------
RESET ROLE;
CREATE TEMP TABLE inv_before AS SELECT count(*) AS n FROM public.invoices;
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', false, NULL, NULL, false);
SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', false, NULL, 0);
RESET ROLE;
SELECT test.ok((SELECT count(*) FROM public.invoices) = (SELECT n FROM inv_before), 'no invoice when it is switched off or the price is 0');
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.expect_err($q$SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', false, NULL, NULL, true, 'bitcoin')$q$, '22023', 'payment method', 'an unknown payment method is refused');
RESET ROLE;
SELECT test.ok((SELECT count(*) FROM public.invoices) = (SELECT n FROM inv_before), 'and a refused call changed nothing');

-- Prices that already include tax: the price is what the member pays.
UPDATE public.gym_settings SET metadata = metadata || '{"tax":{"prices_include_tax":true}}' WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', false, NULL, 22, true, 'card');
RESET ROLE;
SELECT test.ok(EXISTS (SELECT 1 FROM public.invoices i WHERE i.member_id = '11111111-0000-0000-0000-000000000004' AND i.total = 22.000 AND i.amount = 20.952 AND i.vat_total = 1.048 AND i.payment_method = 'card'), 'tax-inclusive price: 22.000 = 20.952 + 1.048 VAT');
-- Tax switched off: no VAT line at all.
UPDATE public.gym_settings SET vat_enabled = false WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT public.assign_member_plan('11111111-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001');
RESET ROLE;
SELECT test.ok(EXISTS (SELECT 1 FROM public.invoices i WHERE i.member_id = '11111111-0000-0000-0000-000000000003' AND i.total = 20.500 AND i.vat_total = 0 AND i.tax_breakdown IS NULL), 'tax off: no VAT and no breakdown');
-- The invoices are the gym's own.
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.invoices WHERE tenant_id <> 'aaaaaaaa-0000-0000-0000-000000000001'), 'no invoice leaked into another gym');

-- --------------------------------------------------------------------------
-- 7. Privileges
-- --------------------------------------------------------------------------
SELECT test.ok(has_function_privilege('authenticated', 'public.assign_member_plan(uuid, uuid, boolean, date, numeric, boolean, text)', 'EXECUTE')
           AND NOT has_function_privilege('anon', 'public.assign_member_plan(uuid, uuid, boolean, date, numeric, boolean, text)', 'EXECUTE'), 'assign_member_plan: authenticated only');
SELECT test.ok(has_function_privilege('authenticated', 'public.plan_member_counts()', 'EXECUTE')
           AND NOT has_function_privilege('anon', 'public.plan_member_counts()', 'EXECUTE'), 'plan_member_counts: authenticated only');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.members_plan_same_tenant()', 'EXECUTE')
           AND NOT has_function_privilege('anon', 'public.members_plan_same_tenant()', 'EXECUTE'), 'the trigger function is internal');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
