-- Tests for 20261024120000_multiple_taxes.sql.
-- ============================================================================
-- Same setup as the other files here: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/multiple_taxes.test.sql
--
-- Everything runs in one transaction that is rolled back. The first failed
-- assertion aborts with "TEST FAILED".
--
-- The golden cases in section 1 repeat, with the same numbers, the cases in
-- src/utils/taxMath.test.ts: the TypeScript split and allocate_tax_breakdown()
-- must always agree.

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



-- Compares the amounts of a breakdown with an expected list.
CREATE FUNCTION test.amounts(p_breakdown jsonb) RETURNS numeric[]
LANGUAGE sql AS $$
  SELECT array_agg((e ->> 'amount')::numeric ORDER BY ord) FROM jsonb_array_elements(p_breakdown) WITH ORDINALITY AS x(e, ord);
$$;

CREATE FUNCTION test.comps(VARIADIC p_rates text[]) RETURNS jsonb
LANGUAGE sql AS $$
  -- 'name:rate' or 'name:rate:c' (compound)
  SELECT jsonb_agg(jsonb_build_object(
    'name', split_part(r, ':', 1),
    'rate', split_part(r, ':', 2)::numeric,
    'compound', split_part(r, ':', 3) = 'c'
  ) ORDER BY ord) FROM unnest(p_rates) WITH ORDINALITY AS x(r, ord);
$$;

-- --------------------------------------------------------------------------
-- 1. allocate_tax_breakdown: the golden cases of src/utils/taxMath.test.ts
-- --------------------------------------------------------------------------
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(12.5, test.comps('VAT:10'), 2)) = ARRAY[12.5]::numeric[], 'one tax takes all of it');
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(20, test.comps('Service:10', 'VAT:10'), 2)) = ARRAY[10, 10]::numeric[], '10% + 10% on net 100: 10 + 10');
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(20, test.comps('A:5', 'B:15'), 2)) = ARRAY[5, 15]::numeric[], '5% + 15%: 5 + 15');
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(21, test.comps('Service:10', 'VAT:10:c'), 2)) = ARRAY[10, 11]::numeric[], 'compounded 10% then 10%: 10 + 11');
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(0.01, test.comps('Service:10', 'VAT:10'), 2)) = ARRAY[0.01, 0]::numeric[], 'one cent between two equal taxes goes to the earlier');
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(0.10, test.comps('A:5', 'B:5', 'C:5'), 2)) = ARRAY[0.04, 0.03, 0.03]::numeric[], '0.10 across three equal taxes: 0.04 / 0.03 / 0.03');
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(1.001, test.comps('Service:10', 'VAT:10'), 3)) = ARRAY[0.501, 0.5]::numeric[], 'BHD keeps fils');
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(7, test.comps('Service:10', 'VAT:10'), 0)) = ARRAY[4, 3]::numeric[], 'JPY has no decimals');
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(5, test.comps('A:0', 'B:0'), 2)) = ARRAY[0, 0]::numeric[], 'zero rates split nothing');
SELECT test.ok(public.allocate_tax_breakdown(5, '[]'::jsonb, 2) = '[]'::jsonb, 'no taxes, no lines');
SELECT test.ok(public.allocate_tax_breakdown(5, NULL, 2) = '[]'::jsonb, 'null components are safe');
SELECT test.ok(test.amounts(public.allocate_tax_breakdown(-5, test.comps('VAT:10'), 2)) = ARRAY[0]::numeric[], 'a negative total is treated as zero');
SELECT test.ok(public.allocate_tax_breakdown(21, test.comps('Service:10', 'VAT:10:c'), 2) -> 1 ->> 'name' = 'VAT', 'names and flags are carried through');
SELECT test.ok((public.allocate_tax_breakdown(21, test.comps('Service:10', 'VAT:10:c'), 2) -> 1 ->> 'compound')::boolean, 'including compound');

-- Whatever the amounts, they always add up to the tax.
SELECT test.ok((
  SELECT bool_and((SELECT sum((e ->> 'amount')::numeric) FROM jsonb_array_elements(public.allocate_tax_breakdown(t, test.comps('A:7.5', 'B:8.25', 'C:2:c'), 3)) AS e) = t)
  FROM unnest(ARRAY[0.001, 0.002, 0.007, 1.234, 99.999, 12345.678]::numeric[]) AS t
), 'the amounts always sum to the tax total');

-- --------------------------------------------------------------------------
-- 2. The gym's taxes, and what a POS sale records
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'multi@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000e2', 'legacy@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000e3', 'notax@test.dev', now());
INSERT INTO public.tenants (id, name) VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', 'Multi Gym'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'Legacy Gym'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'No Tax Gym');
INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'eeeeeeee-0000-0000-0000-000000000001', 'employee'),
  ('00000000-0000-0000-0000-0000000000e2', 'eeeeeeee-0000-0000-0000-000000000002', 'employee'),
  ('00000000-0000-0000-0000-0000000000e3', 'eeeeeeee-0000-0000-0000-000000000003', 'employee');

-- Multi Gym: service charge 10% then VAT 10% compounded = 21% combined.
-- Legacy Gym: configured before taxes were a list (name in metadata, rate in the column).
INSERT INTO public.gym_settings (tenant_id, currency, vat_enabled, vat_rate, metadata) VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', 'USD', true, 21,
   '{"tax":{"name":"Service charge + VAT","components":[{"name":"Service charge","rate":10,"compound":false},{"name":"VAT","rate":10,"compound":true}]}}'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'USD', true, 10, '{"tax":{"name":"GST"}}'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'USD', false, 0, '{}');

SELECT test.ok(public.tenant_tax_components('eeeeeeee-0000-0000-0000-000000000001') -> 1 ->> 'name' = 'VAT', 'the stored list is returned as is');
SELECT test.ok(public.tenant_tax_components('eeeeeeee-0000-0000-0000-000000000002') = '[{"name":"GST","rate":10,"compound":false}]'::jsonb, 'a legacy gym becomes one tax named from its metadata');
SELECT test.ok(public.tenant_tax_components('eeeeeeee-0000-0000-0000-000000000003') -> 0 ->> 'name' = 'VAT', 'with nothing stored the name defaults to VAT');
SELECT test.ok(public.tenant_tax_components('99999999-0000-0000-0000-000000000009') -> 0 ->> 'rate' = '0', 'an unknown gym has a zero-rate tax');

INSERT INTO public.pos_products (id, tenant_id, name, sku, price, vat_rate, track_inventory) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'Shake', 'SHAKE', 100.00, 21, false),
  ('e0000000-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', 'Shake', 'SHAKE', 100.00, 10, false),
  ('e0000000-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000003', 'Shake', 'SHAKE', 100.00, 0, false);

CREATE FUNCTION test.sell(p_product uuid) RETURNS jsonb
LANGUAGE sql AS $$
  SELECT public.complete_pos_sale(NULL, 0, 'cash', NULL, NULL, jsonb_build_array(jsonb_build_object('product_id', p_product, 'quantity', 1)), 'USD');
$$;

-- Multi Gym: 100.00 at the combined 21% = 21.00 tax -> 10.00 service charge + 11.00 VAT.
SELECT test.become('00000000-0000-0000-0000-0000000000e1');
CREATE TEMP TABLE r_multi AS SELECT test.sell('e0000000-0000-0000-0000-000000000001') AS r;
RESET ROLE;
SELECT test.ok((SELECT (r ->> 'vat_total')::numeric = 21 AND (r ->> 'total')::numeric = 121 FROM r_multi), 'the sale maths is unchanged: 100 + 21% = 121');
SELECT test.ok((SELECT test.amounts(r -> 'tax_breakdown') = ARRAY[10, 11]::numeric[] FROM r_multi), 'the receipt shows 10.00 service charge + 11.00 VAT');
SELECT test.ok((SELECT test.amounts(s.tax_breakdown) = ARRAY[10, 11]::numeric[] FROM public.pos_sales s WHERE s.id = (SELECT (r ->> 'sale_id')::uuid FROM r_multi)), 'and the same is stored on the sale');

-- Changing the gym's taxes later does not rewrite the old sale.
UPDATE public.gym_settings SET metadata = '{"tax":{"components":[{"name":"VAT","rate":21,"compound":false}]}}' WHERE tenant_id = 'eeeeeeee-0000-0000-0000-000000000001';
SELECT test.ok((SELECT test.amounts(s.tax_breakdown) = ARRAY[10, 11]::numeric[] FROM public.pos_sales s WHERE s.id = (SELECT (r ->> 'sale_id')::uuid FROM r_multi)), 'a later change to the gym''s taxes leaves the stored breakdown alone');

-- Legacy Gym: one tax, all of it.
SELECT test.become('00000000-0000-0000-0000-0000000000e2');
CREATE TEMP TABLE r_legacy AS SELECT test.sell('e0000000-0000-0000-0000-000000000002') AS r;
RESET ROLE;
SELECT test.ok((SELECT (r ->> 'vat_total')::numeric = 10 FROM r_legacy), 'legacy gym: 100 + 10% = 10 tax');
SELECT test.ok((SELECT r -> 'tax_breakdown' = '[{"name":"GST","rate":10,"compound":false,"amount":10}]'::jsonb FROM r_legacy), 'legacy gym: one line, named from its settings');

-- No tax: nothing to split.
SELECT test.become('00000000-0000-0000-0000-0000000000e3');
CREATE TEMP TABLE r_none AS SELECT test.sell('e0000000-0000-0000-0000-000000000003') AS r;
RESET ROLE;
SELECT test.ok((SELECT (r ->> 'vat_total')::numeric = 0 AND (r -> 'tax_breakdown') = 'null'::jsonb FROM r_none), 'no tax charged: no breakdown');
SELECT test.ok((SELECT s.tax_breakdown IS NULL FROM public.pos_sales s WHERE s.id = (SELECT (r ->> 'sale_id')::uuid FROM r_none)), 'stored as NULL');

-- --------------------------------------------------------------------------
-- 3. Privileges
-- --------------------------------------------------------------------------
SELECT test.ok(NOT has_function_privilege('anon', 'public.allocate_tax_breakdown(numeric, jsonb, integer)', 'EXECUTE'), 'anon cannot call the splitter');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.allocate_tax_breakdown(numeric, jsonb, integer)', 'EXECUTE'), 'authenticated cannot either (it is internal)');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.tenant_tax_components(uuid)', 'EXECUTE'), 'nor read another gym''s tax settings through the helper');
SELECT test.ok(has_function_privilege('authenticated', 'public.complete_pos_sale(uuid, numeric, text, text, text, jsonb, text)', 'EXECUTE'), 'checkout is still callable');
SELECT test.ok(NOT has_function_privilege('anon', 'public.complete_pos_sale(uuid, numeric, text, text, text, jsonb, text)', 'EXECUTE'), 'and still not by anon');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
