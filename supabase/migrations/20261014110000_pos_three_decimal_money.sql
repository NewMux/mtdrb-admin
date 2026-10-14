-- POS: three-decimal money storage and exact discount proration
--
-- MUST BE APPLIED TO THE LIVE SUPABASE PROJECT (e.g. `supabase db push`).
-- It was written without database access and has not been run against a
-- real database. Until it is applied, BHD (and other 3-decimal currency)
-- POS sales keep being rounded to 2 decimals by the old functions.
--
-- Why
--   The original POS module (20260820180000_create_pos_module.sql) stored
--   every money column as numeric(12,2) and rounded with round(x, 2). The
--   app's default currency is BHD, which has 3 decimals (fils), so sale,
--   line, VAT and return amounts were rounded to the wrong minor unit and
--   a 1.235 BHD product price could not even be stored. complete_pos_sale
--   also rounded each line's share of the cart discount independently, so
--   the line discounts did not always sum to the sale's discount_total.
--
-- What
--   1. Money columns on pos_products, pos_sales, pos_sale_items,
--      pos_returns and pos_return_items are widened from numeric(12,2) to
--      numeric(13,3). Precision goes to 13, not 12, so no column loses an
--      integer digit (12,3 would drop the maximum from 9,999,999,999.99 to
--      999,999,999.999 and could reject existing rows). Widening is
--      lossless for existing data; CHECK constraints carry over.
--   2. complete_pos_sale and return_pos_sale are redefined, starting from
--      their only previous definitions (in 20260820180000), with the same
--      signatures, grants and validation. Only the money math changes.
--
-- Rounding: per currency, not a flat 3 decimals
--   Both functions know the currency: complete_pos_sale receives
--   p_currency and stores it on pos_sales.currency, and return_pos_sale
--   reads it from the sale. They round to that currency's minor unit
--   through public.pos_currency_decimals(), which mirrors
--   getCurrencyDecimals() in src/utils/invoiceMath.ts (3 for
--   BHD/KWD/OMR/JOD/TND, 0 for JPY/KRW/VND/CLP/ISK/HUF, 2 otherwise).
--   This way the stored sale matches the client-side preview
--   (computePosCartTotals) exactly. Rounding a 2-decimal currency to 3
--   decimals would store fractions of a cent that the customer was never
--   charged and the receipt never showed. numeric(13,3) is the storage
--   precision that fits every supported currency.
--
-- Discount proration: same rule as computePosCartTotals
--   Line subtotals are rounded to the minor unit. The cart discount is
--   clamped to [0, subtotal] and rounded. It is then split across lines
--   in whole minor units by the largest-remainder method: each line gets
--   floor(discount * line / subtotal) minor units, and the units left
--   over go one at a time to the lines with the largest exact integer
--   remainders (ties go to the earlier line). The line shares sum exactly
--   to discount_total, and no line goes below zero. VAT is per line on
--   the discounted line net, and total = Σ(line net - share + line VAT)
--   = net + VAT.
--
-- Returns
--   A partial return refunds round(line_total / quantity * qty) in the
--   sale's currency. The return that brings a line's returned_quantity up
--   to its quantity refunds whatever is left of that line's line_total
--   instead, so a line returned in full refunds exactly what was charged
--   for it, with no rounding drift.

BEGIN;

-- 1. Widen money columns --------------------------------------------------

ALTER TABLE public.pos_products
  ALTER COLUMN price TYPE numeric(13,3),
  ALTER COLUMN cost_price TYPE numeric(13,3);

ALTER TABLE public.pos_sales
  ALTER COLUMN subtotal TYPE numeric(13,3),
  ALTER COLUMN discount_total TYPE numeric(13,3),
  ALTER COLUMN vat_total TYPE numeric(13,3),
  ALTER COLUMN total TYPE numeric(13,3);

ALTER TABLE public.pos_sale_items
  ALTER COLUMN unit_price TYPE numeric(13,3),
  ALTER COLUMN cost_price TYPE numeric(13,3),
  ALTER COLUMN line_subtotal TYPE numeric(13,3),
  ALTER COLUMN line_discount TYPE numeric(13,3),
  ALTER COLUMN line_vat TYPE numeric(13,3),
  ALTER COLUMN line_total TYPE numeric(13,3);

ALTER TABLE public.pos_returns
  ALTER COLUMN total TYPE numeric(13,3);

ALTER TABLE public.pos_return_items
  ALTER COLUMN line_total TYPE numeric(13,3);

-- 2. Currency minor units (mirrors getCurrencyDecimals in invoiceMath.ts) --

CREATE OR REPLACE FUNCTION public.pos_currency_decimals(p_currency text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE upper(coalesce(trim(p_currency), ''))
    WHEN 'BHD' THEN 3 WHEN 'KWD' THEN 3 WHEN 'OMR' THEN 3
    WHEN 'JOD' THEN 3 WHEN 'TND' THEN 3
    WHEN 'JPY' THEN 0 WHEN 'KRW' THEN 0 WHEN 'VND' THEN 0
    WHEN 'CLP' THEN 0 WHEN 'ISK' THEN 0 WHEN 'HUF' THEN 0
    ELSE 2
  END;
$$;

-- 3. complete_pos_sale ------------------------------------------------------

CREATE OR REPLACE FUNCTION public.complete_pos_sale(
  p_member_id uuid,
  p_discount numeric DEFAULT 0,
  p_payment_method text DEFAULT 'cash',
  p_payment_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_currency text DEFAULT 'AED'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_sale_id uuid;
  v_sale_number text;
  v_currency text := coalesce(nullif(trim(p_currency), ''), 'AED');
  v_decimals integer;
  v_factor numeric;
  v_item jsonb;
  v_index bigint;
  v_product record;
  v_line_minor numeric[] := ARRAY[]::numeric[];
  v_share_minor numeric[];
  v_subtotal_minor numeric := 0;
  v_discount_minor numeric;
  v_subtotal numeric;
  v_discount numeric;
  v_vat numeric := 0;
  v_total numeric := 0;
  v_quantity numeric;
  v_line_subtotal numeric;
  v_line_discount numeric;
  v_line_vat numeric;
  v_line_total numeric;
  v_new_stock numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  v_tenant_id := public.get_user_tenant_id();
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'employee') THEN
    RAISE EXCEPTION 'POS checkout requires employee access';
  END IF;
  IF p_payment_method NOT IN ('cash', 'card', 'bank_transfer', 'digital_wallet', 'other') THEN
    RAISE EXCEPTION 'Unsupported payment method';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one product is required';
  END IF;
  IF p_member_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.members AS m
    WHERE m.id = p_member_id AND m.tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'Member does not belong to this organization';
  END IF;

  v_decimals := public.pos_currency_decimals(v_currency);
  v_factor := power(10::numeric, v_decimals);

  -- Pass 1: validate, lock, and collect each line's subtotal in minor units.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_quantity := (v_item ->> 'quantity')::numeric;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid product quantity';
    END;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Product quantity must be greater than zero';
    END IF;
    SELECT p.* INTO v_product
    FROM public.pos_products AS p
    WHERE p.id = (v_item ->> 'product_id')::uuid
      AND p.tenant_id = v_tenant_id
      AND p.is_active = true
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or inactive';
    END IF;
    IF v_product.track_inventory AND v_product.stock_quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_product.name;
    END IF;
    v_line_minor := v_line_minor || (round(v_quantity * v_product.price, v_decimals) * v_factor);
    v_subtotal_minor := v_subtotal_minor + round(v_quantity * v_product.price, v_decimals) * v_factor;
  END LOOP;

  v_discount_minor := least(
    greatest(round(coalesce(p_discount, 0), v_decimals) * v_factor, 0),
    v_subtotal_minor
  );
  v_subtotal := v_subtotal_minor / v_factor;
  v_discount := v_discount_minor / v_factor;

  -- Largest-remainder split of the discount across lines, in minor units.
  SELECT array_agg(c.share ORDER BY c.idx) INTO v_share_minor
  FROM (
    SELECT b.idx,
           b.fl + CASE WHEN b.rn <= v_discount_minor - sum(b.fl) OVER () THEN 1 ELSE 0 END AS share
    FROM (
      SELECT a.idx, a.fl,
             row_number() OVER (ORDER BY a.rem DESC, a.idx) AS rn
      FROM (
        SELECT t.idx,
               CASE WHEN v_subtotal_minor = 0 THEN 0
                    ELSE div(v_discount_minor * t.m, v_subtotal_minor) END AS fl,
               CASE WHEN v_subtotal_minor = 0 THEN 0
                    ELSE mod(v_discount_minor * t.m, v_subtotal_minor) END AS rem
        FROM unnest(v_line_minor) WITH ORDINALITY AS t(m, idx)
      ) AS a
    ) AS b
  ) AS c;

  v_sale_number := 'POS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(extensions.uuid_generate_v4()::text, '-', ''), 1, 8));

  INSERT INTO public.pos_sales (
    tenant_id, sale_number, member_id, cashier_id, subtotal, discount_total,
    vat_total, total, currency, payment_method, payment_reference, notes
  )
  VALUES (
    v_tenant_id, v_sale_number, p_member_id, v_user_id, v_subtotal,
    v_discount, 0, 0, v_currency,
    p_payment_method, nullif(trim(p_payment_reference), ''), nullif(trim(p_notes), '')
  )
  RETURNING id INTO v_sale_id;

  -- Pass 2: write lines with their discount share and per-line VAT.
  FOR v_item, v_index IN SELECT value, ordinality FROM jsonb_array_elements(p_items) WITH ORDINALITY
  LOOP
    v_quantity := (v_item ->> 'quantity')::numeric;
    SELECT p.* INTO v_product
    FROM public.pos_products AS p
    WHERE p.id = (v_item ->> 'product_id')::uuid
      AND p.tenant_id = v_tenant_id
      AND p.is_active = true
    FOR UPDATE;
    v_line_subtotal := v_line_minor[v_index] / v_factor;
    v_line_discount := v_share_minor[v_index] / v_factor;
    v_line_vat := round((v_line_subtotal - v_line_discount) * v_product.vat_rate / 100, v_decimals);
    v_line_total := v_line_subtotal - v_line_discount + v_line_vat;
    v_vat := v_vat + v_line_vat;
    v_total := v_total + v_line_total;

    INSERT INTO public.pos_sale_items (
      tenant_id, sale_id, product_id, product_name, sku, unit_price, cost_price,
      vat_rate, quantity, line_subtotal, line_discount, line_vat, line_total
    )
    VALUES (
      v_tenant_id, v_sale_id, v_product.id, v_product.name, v_product.sku,
      v_product.price, v_product.cost_price, v_product.vat_rate, v_quantity,
      v_line_subtotal, v_line_discount, v_line_vat, v_line_total
    );

    IF v_product.track_inventory THEN
      v_new_stock := v_product.stock_quantity - v_quantity;
      UPDATE public.pos_products
      SET stock_quantity = v_new_stock, updated_at = now()
      WHERE id = v_product.id AND tenant_id = v_tenant_id;
      INSERT INTO public.pos_stock_movements (
        tenant_id, product_id, movement_type, quantity_delta, quantity_before,
        quantity_after, reason, reference_type, reference_id, created_by
      )
      VALUES (
        v_tenant_id, v_product.id, 'sale', -v_quantity, v_product.stock_quantity,
        v_new_stock, 'POS sale', 'pos_sale', v_sale_id, v_user_id
      );
    END IF;
  END LOOP;

  UPDATE public.pos_sales
  SET vat_total = v_vat, total = v_total
  WHERE id = v_sale_id;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'subtotal', v_subtotal,
    'discount_total', v_discount,
    'vat_total', v_vat,
    'total', v_total,
    'currency', v_currency
  );
END;
$$;

-- 4. return_pos_sale --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.return_pos_sale(
  p_sale_id uuid,
  p_items jsonb,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_sale record;
  v_sale_item record;
  v_product record;
  v_return_id uuid;
  v_return_number text;
  v_item jsonb;
  v_decimals integer;
  v_quantity numeric;
  v_line_total numeric;
  v_already_refunded numeric;
  v_return_total numeric := 0;
  v_new_stock numeric;
  v_all_returned boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  v_tenant_id := public.get_user_tenant_id();
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'employee') THEN
    RAISE EXCEPTION 'Returns require employee access';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required for a return';
  END IF;
  SELECT s.* INTO v_sale
  FROM public.pos_sales AS s
  WHERE s.id = p_sale_id AND s.tenant_id = v_tenant_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found'; END IF;
  IF v_sale.status IN ('returned', 'voided') THEN RAISE EXCEPTION 'Sale is already closed'; END IF;

  v_decimals := public.pos_currency_decimals(v_sale.currency);

  v_return_number := 'RET-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(extensions.uuid_generate_v4()::text, '-', ''), 1, 8));
  INSERT INTO public.pos_returns (tenant_id, sale_id, return_number, cashier_id, reason)
  VALUES (v_tenant_id, p_sale_id, v_return_number, v_user_id, nullif(trim(p_reason), ''))
  RETURNING id INTO v_return_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item ->> 'quantity')::numeric;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN RAISE EXCEPTION 'Return quantity must be greater than zero'; END IF;
    SELECT si.* INTO v_sale_item
    FROM public.pos_sale_items AS si
    WHERE si.id = (v_item ->> 'sale_item_id')::uuid
      AND si.sale_id = p_sale_id
      AND si.tenant_id = v_tenant_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sale item not found'; END IF;
    IF v_quantity > v_sale_item.quantity - v_sale_item.returned_quantity THEN
      RAISE EXCEPTION 'Return quantity exceeds the remaining quantity for %', v_sale_item.product_name;
    END IF;

    IF v_sale_item.returned_quantity + v_quantity = v_sale_item.quantity THEN
      -- Final return for this line: refund exactly what is left of it.
      SELECT coalesce(sum(ri.line_total), 0) INTO v_already_refunded
      FROM public.pos_return_items AS ri
      JOIN public.pos_returns AS r ON r.id = ri.return_id
      WHERE ri.sale_item_id = v_sale_item.id
        AND ri.tenant_id = v_tenant_id
        AND r.status = 'completed';
      v_line_total := greatest(v_sale_item.line_total - v_already_refunded, 0);
    ELSE
      v_line_total := round((v_sale_item.line_total / v_sale_item.quantity) * v_quantity, v_decimals);
    END IF;

    v_return_total := v_return_total + v_line_total;
    INSERT INTO public.pos_return_items (
      tenant_id, return_id, sale_item_id, product_id, quantity, line_total
    )
    VALUES (
      v_tenant_id, v_return_id, v_sale_item.id, v_sale_item.product_id, v_quantity, v_line_total
    );
    UPDATE public.pos_sale_items
    SET returned_quantity = returned_quantity + v_quantity
    WHERE id = v_sale_item.id;

    IF v_sale_item.product_id IS NOT NULL THEN
      SELECT p.* INTO v_product
      FROM public.pos_products AS p
      WHERE p.id = v_sale_item.product_id AND p.tenant_id = v_tenant_id
      FOR UPDATE;
      IF FOUND AND v_product.track_inventory THEN
        v_new_stock := v_product.stock_quantity + v_quantity;
        UPDATE public.pos_products
        SET stock_quantity = v_new_stock, updated_at = now()
        WHERE id = v_product.id AND tenant_id = v_tenant_id;
        INSERT INTO public.pos_stock_movements (
          tenant_id, product_id, movement_type, quantity_delta, quantity_before,
          quantity_after, reason, reference_type, reference_id, created_by
        )
        VALUES (
          v_tenant_id, v_product.id, 'return', v_quantity, v_product.stock_quantity,
          v_new_stock, 'POS return', 'pos_return', v_return_id, v_user_id
        );
      END IF;
    END IF;
  END LOOP;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.pos_sale_items AS si
    WHERE si.sale_id = p_sale_id AND si.returned_quantity < si.quantity
  ) INTO v_all_returned;
  UPDATE public.pos_sales
  SET status = CASE WHEN v_all_returned THEN 'returned' ELSE 'partially_returned' END
  WHERE id = p_sale_id;
  UPDATE public.pos_returns SET total = round(v_return_total, v_decimals) WHERE id = v_return_id;

  RETURN jsonb_build_object(
    'return_id', v_return_id,
    'return_number', v_return_number,
    'sale_id', p_sale_id,
    'total', round(v_return_total, v_decimals)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pos_currency_decimals(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_pos_sale(uuid, numeric, text, text, text, jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.return_pos_sale(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pos_currency_decimals(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pos_sale(uuid, numeric, text, text, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_pos_sale(uuid, jsonb, text) TO authenticated;

COMMIT;
