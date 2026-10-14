-- Three-decimal money storage for invoices, expenses, VAT returns and prices
--
-- MUST BE APPLIED TO THE LIVE SUPABASE PROJECT (e.g. `supabase db push`).
-- It was written without database access. It was tested only against
-- PGlite (Postgres 16 in WASM) with the repo's schema.sql/migration table
-- definitions, not against the live database.
--
-- Why
--   The default currency is BHD, which has 3 decimals (fils). The app
--   rounds money to the currency's minor unit before writing it
--   (toPersistedMoney in src/utils/invoiceMath.ts), but these columns are
--   NUMERIC(10,2) (schema.sql, 001_update_schema.sql, 002_..., 007_...).
--   Postgres therefore silently re-rounds every BHD value to 2 decimals
--   on write: a 10.125 BHD invoice is stored as 10.13.
--
-- What
--   Every money column the app writes gym-currency amounts to is widened
--   to NUMERIC(13,3):
--     invoices      amount, total, paid_amount, vat_total
--     expenses      amount, vat_amount
--     vat_returns   vat_collected, vat_paid, net_vat_payable
--     plans         price
--     classes       price
--     trainers      hourly_rate
--     subscriptions amount   (member subscriptions, from 002)
--   Moving from (10,2) to (13,3) gives 10 integer digits instead of 8, so
--   no existing value is narrowed. If the live column is already wider,
--   precision becomes max(13, integer digits + 3), so the maximum value is
--   never reduced. Widening a numeric is lossless, and CHECK constraints,
--   defaults and indexes carry over.
--
--   Not covered here:
--   - Invoice line items are not a table. They live in the invoices.items
--     / invoices.line_items JSONB columns, which store numbers at full
--     JSON precision, so there is no column type to change.
--   - POS tables are widened in 20261014110000_pos_three_decimal_money.sql.
--   - platform_subscriptions.amount (Paddle billing, in the platform
--     currency) is widened in 20261014100000_paddle_subscription_sync_hardening.sql.
--   - gym_settings.vat_rate and the other *_rate columns are percentages,
--     not money.
--
-- Robustness against schema drift
--   The live project was built from a mix of schema.sql and the
--   migrations, so a column is altered only if it exists and is a numeric
--   with fewer than 3 decimals. Anything else (missing table or column,
--   already 3+ decimals, or a non-numeric type) is skipped with a NOTICE.
--   Running the migration twice is a no-op.
--
-- Dependent views, rules and policies
--   ALTER COLUMN ... TYPE fails if a view, rule or policy references the
--   column. No such object exists in this repo (no CREATE VIEW anywhere in
--   schema.sql or supabase/migrations, and no RLS policy references these
--   columns). The live database could still have one created by hand, for
--   example from the dashboard. Rather than drop and recreate an object
--   whose definition, grants and options the repo doesn't know, the guard
--   below checks pg_depend first. If anything depends on a target column,
--   it raises one error naming every such object, and the whole
--   transaction rolls back with nothing changed. The fix is then to drop
--   those objects, apply this migration, and recreate them.

BEGIN;

DO $$
DECLARE
  v_targets text[][] := ARRAY[
    ARRAY['invoices', 'amount'],
    ARRAY['invoices', 'total'],
    ARRAY['invoices', 'paid_amount'],
    ARRAY['invoices', 'vat_total'],
    ARRAY['expenses', 'amount'],
    ARRAY['expenses', 'vat_amount'],
    ARRAY['vat_returns', 'vat_collected'],
    ARRAY['vat_returns', 'vat_paid'],
    ARRAY['vat_returns', 'net_vat_payable'],
    ARRAY['plans', 'price'],
    ARRAY['classes', 'price'],
    ARRAY['trainers', 'hourly_rate'],
    ARRAY['subscriptions', 'amount']
  ];
  v_i integer;
  v_table text;
  v_column text;
  v_col record;
  v_new_precision integer;
  v_dependents text;
BEGIN
  -- Guard: refuse (atomically) if any view/rule/policy depends on a target.
  SELECT string_agg(DISTINCT format('%s on %I.%I', d.kind, t.table_name, t.column_name), ', ')
  INTO v_dependents
  FROM (
    SELECT v_targets[i][1] AS table_name, v_targets[i][2] AS column_name
    FROM generate_subscripts(v_targets, 1) AS i
  ) AS t
  JOIN pg_catalog.pg_attribute AS a
    ON a.attrelid = to_regclass(format('public.%I', t.table_name))
   AND a.attname = t.column_name
   AND NOT a.attisdropped
  JOIN LATERAL (
    SELECT format('view/rule %s', r.ev_class::regclass) AS kind
    FROM pg_catalog.pg_depend AS dep
    JOIN pg_catalog.pg_rewrite AS r ON r.oid = dep.objid
    WHERE dep.classid = 'pg_catalog.pg_rewrite'::regclass
      AND dep.refobjid = a.attrelid AND dep.refobjsubid = a.attnum
      AND r.ev_class <> a.attrelid
    UNION ALL
    SELECT format('policy %I', p.polname)
    FROM pg_catalog.pg_depend AS dep
    JOIN pg_catalog.pg_policy AS p ON p.oid = dep.objid
    WHERE dep.classid = 'pg_catalog.pg_policy'::regclass
      AND dep.refobjid = a.attrelid AND dep.refobjsubid = a.attnum
  ) AS d ON true;

  IF v_dependents IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot widen money columns: dependent objects exist (%). Drop them, apply this migration, then recreate them.', v_dependents;
  END IF;

  FOR v_i IN 1 .. array_length(v_targets, 1) LOOP
    v_table := v_targets[v_i][1];
    v_column := v_targets[v_i][2];

    SELECT c.data_type, c.numeric_precision, c.numeric_scale
    INTO v_col
    FROM information_schema.columns AS c
    WHERE c.table_schema = 'public' AND c.table_name = v_table AND c.column_name = v_column;

    IF NOT FOUND THEN
      RAISE NOTICE 'Skipping public.%.%: column does not exist', v_table, v_column;
      CONTINUE;
    END IF;
    IF v_col.data_type <> 'numeric' THEN
      RAISE NOTICE 'Skipping public.%.%: type is %, not numeric', v_table, v_column, v_col.data_type;
      CONTINUE;
    END IF;
    IF v_col.numeric_scale IS NULL OR v_col.numeric_scale >= 3 THEN
      -- Unconstrained numeric or already 3+ decimals: nothing to widen.
      RAISE NOTICE 'Skipping public.%.%: already stores 3+ decimals', v_table, v_column;
      CONTINUE;
    END IF;

    v_new_precision := greatest(13, (v_col.numeric_precision - v_col.numeric_scale) + 3);
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I TYPE numeric(%s,3)',
      v_table, v_column, v_new_precision
    );
  END LOOP;
END;
$$;

COMMIT;
