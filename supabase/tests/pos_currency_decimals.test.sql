-- Tests for 20261022180000_pos_currency_decimals.sql.
-- ============================================================================
-- Same setup as the other files here: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/pos_currency_decimals.test.sql
--
-- Everything runs in one transaction that is rolled back. The first failed
-- assertion aborts with "TEST FAILED".
--
-- The GOLDEN cases (A-H) repeat, with the same numbers, the cases in
-- src/utils/posMath.test.ts: the TypeScript cart preview and complete_pos_sale()
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


-- Sells the given products (id, qty) as the signed-in cashier and returns the receipt.
CREATE FUNCTION test.sell(p_items jsonb, p_discount numeric, p_currency text) RETURNS jsonb
LANGUAGE sql AS $$
  SELECT public.complete_pos_sale(NULL, p_discount, 'cash', NULL, NULL, p_items, p_currency);
$$;

-- --------------------------------------------------------------------------
-- Fixtures
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'cashier@test.dev', now());
INSERT INTO public.tenants (id, name) VALUES ('eeeeeeee-0000-0000-0000-000000000001', 'Pos Gym');
INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'eeeeeeee-0000-0000-0000-000000000001', 'employee');

-- (sku, price, vat_rate)
INSERT INTO public.pos_products (id, tenant_id, name, sku, price, vat_rate, track_inventory) VALUES
  ('e0000000-0000-0000-0000-00000000000a', 'eeeeeeee-0000-0000-0000-000000000001', 'P1250', 'P1250', 1.250, 10, false),
  ('e0000000-0000-0000-0000-00000000000b', 'eeeeeeee-0000-0000-0000-000000000001', 'P0999', 'P0999', 0.999, 10, false),
  ('e0000000-0000-0000-0000-00000000000c', 'eeeeeeee-0000-0000-0000-000000000001', 'P1000-10', 'P1000-10', 1.000, 10, false),
  ('e0000000-0000-0000-0000-00000000000d', 'eeeeeeee-0000-0000-0000-000000000001', 'P0050-5', 'P0050-5', 0.050, 5, false),
  ('e0000000-0000-0000-0000-00000000000e', 'eeeeeeee-0000-0000-0000-000000000001', 'P0400', 'P0400', 0.400, 10, false),
  ('e0000000-0000-0000-0000-00000000000f', 'eeeeeeee-0000-0000-0000-000000000001', 'P2500', 'P2500', 2.500, 0, false),
  ('e0000000-0000-0000-0000-000000000010', 'eeeeeeee-0000-0000-0000-000000000001', 'P1000-0', 'P1000-0', 1.000, 0, false),
  ('e0000000-0000-0000-0000-000000000011', 'eeeeeeee-0000-0000-0000-000000000001', 'FREE', 'FREE', 0.000, 0, false),
  ('e0000000-0000-0000-0000-000000000012', 'eeeeeeee-0000-0000-0000-000000000001', 'P3333', 'P3333', 3.333, 10, false);

SELECT test.become('00000000-0000-0000-0000-0000000000e1');

-- --------------------------------------------------------------------------
-- Golden cases
-- --------------------------------------------------------------------------
-- A: BHD keeps fils. VAT of 10% on 1.250 is 0.125, not 0.13.
CREATE TEMP TABLE r_a AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-00000000000a","quantity":1}]', 0, 'BHD') AS r;
SELECT test.ok((SELECT (r->>'subtotal')::numeric = 1.250 AND (r->>'vat_total')::numeric = 0.125 AND (r->>'total')::numeric = 1.375 FROM r_a), 'A: BHD 1.250 + 10% VAT = 1.375');

-- B: discount then VAT, rounded to fils.
CREATE TEMP TABLE r_b AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-00000000000b","quantity":3}]', 0.5, 'BHD') AS r;
SELECT test.ok((SELECT (r->>'subtotal')::numeric = 2.997 AND (r->>'discount_total')::numeric = 0.500 AND (r->>'vat_total')::numeric = 0.250 AND (r->>'total')::numeric = 2.747 FROM r_b), 'B: 2.997 - 0.500 + 0.250 = 2.747');

-- C: the discount shares add up to the discount exactly.
CREATE TEMP TABLE r_c AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-00000000000c","quantity":1},{"product_id":"e0000000-0000-0000-0000-00000000000c","quantity":1},{"product_id":"e0000000-0000-0000-0000-00000000000c","quantity":1}]', 0.1, 'BHD') AS r;
SELECT test.ok((SELECT (r->>'discount_total')::numeric = 0.100 AND (r->>'vat_total')::numeric = 0.291 AND (r->>'total')::numeric = 3.191 FROM r_c), 'C: 3.000 - 0.100 + 0.291 = 3.191');
SELECT test.ok((SELECT array_agg(i.line_discount ORDER BY i.line_discount) FROM public.pos_sale_items i WHERE i.sale_id = (SELECT (r->>'sale_id')::uuid FROM r_c)) = ARRAY[0.033, 0.033, 0.034]::numeric[], 'C: line discounts are 0.033, 0.033, 0.034');

-- D: 2-decimal currencies still round half up.
CREATE TEMP TABLE r_d1 AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-00000000000a","quantity":1}]', 0, 'USD') AS r;
SELECT test.ok((SELECT (r->>'vat_total')::numeric = 0.13 AND (r->>'total')::numeric = 1.38 FROM r_d1), 'D: USD 1.25 + 10% = 1.38 (0.125 rounds up to 0.13)');
CREATE TEMP TABLE r_d2 AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-00000000000d","quantity":1}]', 0, 'USD') AS r;
SELECT test.ok((SELECT (r->>'vat_total')::numeric = 0 AND (r->>'total')::numeric = 0.05 FROM r_d2), 'D: 0.05 + 5% VAT: 0.0025 rounds to 0.00');

-- E: a sale under 1 currency unit shares its discount correctly.
CREATE TEMP TABLE r_e AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-00000000000e","quantity":1}]', 0.2, 'BHD') AS r;
SELECT test.ok((SELECT (r->>'discount_total')::numeric = 0.200 AND (r->>'vat_total')::numeric = 0.020 AND (r->>'total')::numeric = 0.220 FROM r_e), 'E: 0.400 - 0.200 + 0.020 = 0.220');

-- F: a discount larger than the sale is capped.
CREATE TEMP TABLE r_f AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-000000000010","quantity":1}]', 5, 'BHD') AS r;
SELECT test.ok((SELECT (r->>'discount_total')::numeric = 1.000 AND (r->>'total')::numeric = 0 FROM r_f), 'F: discount is capped at the subtotal');

-- G: fractional quantities round at the line.
CREATE TEMP TABLE r_g AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-00000000000f","quantity":0.333}]', 0, 'BHD') AS r;
SELECT test.ok((SELECT (r->>'subtotal')::numeric = 0.833 AND (r->>'total')::numeric = 0.833 FROM r_g), 'G: 2.500 x 0.333 = 0.8325 -> 0.833');

-- H: a free item never absorbs the rounding remainder.
CREATE TEMP TABLE r_h AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-000000000010","quantity":1},{"product_id":"e0000000-0000-0000-0000-000000000010","quantity":1},{"product_id":"e0000000-0000-0000-0000-000000000011","quantity":1}]', 0.101, 'BHD') AS r;
SELECT test.ok((SELECT (r->>'discount_total')::numeric = 0.101 FROM r_h), 'H: all of 0.101 is applied');
SELECT test.ok((SELECT string_agg(i.line_discount::text, ',' ORDER BY i.created_at, i.product_name) FROM public.pos_sale_items i WHERE i.sale_id = (SELECT (r->>'sale_id')::uuid FROM r_h) AND i.product_name = 'FREE') = '0.000', 'H: the free line takes no discount');
SELECT test.ok((SELECT sum(i.line_discount) FROM public.pos_sale_items i WHERE i.sale_id = (SELECT (r->>'sale_id')::uuid FROM r_h)) = 0.101, 'H: the line discounts add up to 0.101');

-- --------------------------------------------------------------------------
-- Header = sum of the lines, for every sale above
-- --------------------------------------------------------------------------
SELECT test.ok(NOT EXISTS (
  SELECT 1 FROM public.pos_sales s
  JOIN (
    SELECT sale_id, sum(line_subtotal) st, sum(line_discount) dt, sum(line_vat) vt, sum(line_total) tt
    FROM public.pos_sale_items GROUP BY sale_id
  ) l ON l.sale_id = s.id
  WHERE s.subtotal <> l.st OR s.discount_total <> l.dt OR s.vat_total <> l.vt OR s.total <> l.tt
), 'every sale header equals the sum of its lines');
SELECT test.ok(NOT EXISTS (
  SELECT 1 FROM public.pos_sale_items i WHERE i.line_total <> i.line_subtotal - i.line_discount + i.line_vat
), 'every line is subtotal - discount + vat');

-- --------------------------------------------------------------------------
-- Returns refund exactly what was paid
-- --------------------------------------------------------------------------
-- 3 x 3.333 BHD at 10% VAT: subtotal 9.999, VAT 1.000, total 10.999.
CREATE TEMP TABLE r_j AS SELECT test.sell('[{"product_id":"e0000000-0000-0000-0000-000000000012","quantity":3}]', 0, 'BHD') AS r;
SELECT test.ok((SELECT (r->>'total')::numeric = 10.999 FROM r_j), 'J: 3 x 3.333 + VAT = 10.999');

CREATE TEMP TABLE j_item AS SELECT id FROM public.pos_sale_items WHERE sale_id = (SELECT (r->>'sale_id')::uuid FROM r_j);
CREATE TEMP TABLE j_ret1 AS SELECT public.return_pos_sale((SELECT (r->>'sale_id')::uuid FROM r_j), (SELECT jsonb_build_array(jsonb_build_object('sale_item_id', id, 'quantity', 1)) FROM j_item), 'one') AS r;
CREATE TEMP TABLE j_ret2 AS SELECT public.return_pos_sale((SELECT (r->>'sale_id')::uuid FROM r_j), (SELECT jsonb_build_array(jsonb_build_object('sale_item_id', id, 'quantity', 1)) FROM j_item), 'two') AS r;
CREATE TEMP TABLE j_ret3 AS SELECT public.return_pos_sale((SELECT (r->>'sale_id')::uuid FROM r_j), (SELECT jsonb_build_array(jsonb_build_object('sale_item_id', id, 'quantity', 1)) FROM j_item), 'three') AS r;
SELECT test.ok((SELECT (r->>'total')::numeric = 3.666 FROM j_ret1), 'J: first partial return refunds 3.666 (pro rata, to fils)');
SELECT test.ok((SELECT (r->>'total')::numeric = 3.666 FROM j_ret2), 'J: second partial return refunds 3.666');
SELECT test.ok((SELECT (r->>'total')::numeric = 3.667 FROM j_ret3), 'J: the final return refunds exactly what is left (3.667)');
SELECT test.ok((SELECT sum(total) FROM public.pos_returns WHERE sale_id = (SELECT (r->>'sale_id')::uuid FROM r_j)) = 10.999, 'J: refunds add up to exactly what was paid');
SELECT test.ok((SELECT status FROM public.pos_sales WHERE id = (SELECT (r->>'sale_id')::uuid FROM r_j)) = 'returned', 'J: the sale is closed once everything is returned');
SELECT test.expect_err($q$SELECT public.return_pos_sale((SELECT (r->>'sale_id')::uuid FROM r_j), (SELECT jsonb_build_array(jsonb_build_object('sale_item_id', id, 'quantity', 1)) FROM j_item), 'again')$q$,
                       'P0001', 'already closed', 'J: a closed sale cannot be returned again');

-- --------------------------------------------------------------------------
-- Storage and privileges
-- --------------------------------------------------------------------------
RESET ROLE;
SELECT test.ok(public.currency_decimals('BHD') = 3 AND public.currency_decimals('kwd') = 3 AND public.currency_decimals(' omr ') = 3, 'currency_decimals: 3-decimal currencies');
SELECT test.ok(public.currency_decimals('JPY') = 0 AND public.currency_decimals('AED') = 2 AND public.currency_decimals('USD') = 2 AND public.currency_decimals(NULL) = 2 AND public.currency_decimals('') = 2, 'currency_decimals: 0- and 2-decimal currencies and blanks');
SELECT test.ok(NOT has_function_privilege('anon', 'public.currency_decimals(text)', 'EXECUTE')
           AND NOT has_function_privilege('authenticated', 'public.currency_decimals(text)', 'EXECUTE'), 'currency_decimals is internal');
SELECT test.ok(has_function_privilege('authenticated', 'public.complete_pos_sale(uuid, numeric, text, text, text, jsonb, text)', 'EXECUTE')
           AND NOT has_function_privilege('anon', 'public.complete_pos_sale(uuid, numeric, text, text, text, jsonb, text)', 'EXECUTE'), 'complete_pos_sale keeps its grants');
SELECT test.ok(NOT has_function_privilege('anon', 'public.return_pos_sale(uuid, jsonb, text)', 'EXECUTE'), 'return_pos_sale stays closed to anon');
SELECT test.ok((SELECT numeric_scale FROM information_schema.columns WHERE table_name = 'pos_products' AND column_name = 'price') = 3, 'prices are stored to 3 decimals');
INSERT INTO public.pos_products (tenant_id, name, sku, price, track_inventory) VALUES ('eeeeeeee-0000-0000-0000-000000000001', 'tiny', 'TINY', 0.001, false);
SELECT test.ok((SELECT price FROM public.pos_products WHERE sku = 'TINY') = 0.001, 'a 0.001 price is kept, not rounded to 0.00');

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
