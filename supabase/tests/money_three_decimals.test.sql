-- Tests for 20261025100000_money_columns_three_decimals.sql.
-- Same setup as the other files here (shim + schema + ALL migrations), then
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/money_three_decimals.test.sql
-- Everything runs in one transaction that is rolled back.

\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA test;
CREATE TABLE test.counter (n integer NOT NULL);
INSERT INTO test.counter VALUES (0);
CREATE FUNCTION test.ok(p_cond boolean, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_cond IS NOT TRUE THEN RAISE EXCEPTION 'TEST FAILED: %', p_label; END IF;
  UPDATE test.counter SET n = n + 1;
END;
$$;

-- Every money column the app writes in the gym's currency must keep 3 decimals.
SELECT test.ok((
  SELECT count(*) FROM information_schema.columns
  WHERE table_schema = 'public' AND numeric_scale = 3
    AND (table_name, column_name) IN (
      ('invoices','amount'), ('invoices','total'), ('invoices','paid_amount'), ('invoices','vat_total'),
      ('expenses','amount'), ('expenses','vat_amount'),
      ('plans','price'), ('classes','price'), ('trainers','hourly_rate'), ('subscriptions','amount'),
      ('vat_returns','vat_collected'), ('vat_returns','vat_paid'), ('vat_returns','net_vat_payable'),
      ('pos_sales','total'), ('pos_sale_items','line_total'), ('pos_returns','total'), ('pos_products','price')
    )
) = 17, 'all 17 money columns store 3 decimals');

INSERT INTO public.tenants (id, name) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Alpha Gym');
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000a1', 'a@a.dev');
INSERT INTO public.members (id, tenant_id, first_name, last_name, email, membership_type, join_date)
VALUES ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'M', 'M', 'm@a.dev', 'basic', current_date);

INSERT INTO public.invoices (tenant_id, member_id, due_date, amount, total, paid_amount, vat_total, currency)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', current_date, 20.505, 21.530, 21.530, 1.025, 'BHD');
SELECT test.ok((SELECT amount = 20.505 AND total = 21.530 AND vat_total = 1.025 AND paid_amount = 21.530 FROM public.invoices), 'an invoice keeps its fils');

INSERT INTO public.expenses (tenant_id, description, amount, vat_amount, date, category, status)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Chairs', 100.125, 10.012, current_date, 'Equipment', 'approved');
SELECT test.ok((SELECT amount = 100.125 AND vat_amount = 10.012 FROM public.expenses), 'an expense keeps its fils');

INSERT INTO public.plans (tenant_id, name, price, duration) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'P', 19.995, 30);
SELECT test.ok((SELECT price = 19.995 FROM public.plans), 'a plan price keeps its fils');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
