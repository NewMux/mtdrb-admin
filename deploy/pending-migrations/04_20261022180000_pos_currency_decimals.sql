-- POS money: round to the sale's currency, not always 2 decimals.
-- ============================================================================
-- complete_pos_sale() and return_pos_sale() rounded every amount to 2 decimals
-- and the money columns were numeric(12,2). Bahraini dinar has 3 (1 BHD = 1000
-- fils) and VAT there is 10%, so VAT on a 1.250 BHD item (0.125) was stored as
-- 0.13 - a systematic overcharge - and prices such as 0.750 or 1.125 could not
-- even be saved faithfully. This:
--   * adds public.currency_decimals() (3 for BHD/KWD/OMR/JOD/TND, 0 for JPY and
--     friends, else 2 - the same table as src/utils/invoiceMath.ts);
--   * widens the POS money columns to numeric(12,3) (lossless: existing 2dp
--     values are unchanged);
--   * rounds each line to the sale's currency, then makes the header the SUM of
--     the lines, so header and lines can no longer disagree;
--   * gives the discount remainder to the last priced line, so the line
--     discounts add up to the discount exactly (they could be a few units off);
--   * on a return of a line's whole remaining quantity, refunds exactly what is
--     left of that line, so partial returns never drift from what was paid.
-- src/utils/posMath.ts mirrors complete_pos_sale() step for step for the cart
-- preview; the golden cases in both test files must stay identical.

BEGIN;

CREATE OR REPLACE FUNCTION public.currency_decimals(p_currency text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN upper(coalesce(trim(p_currency), '')) IN ('BHD', 'KWD', 'OMR', 'JOD', 'TND') THEN 3
    WHEN upper(coalesce(trim(p_currency), '')) IN ('JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF') THEN 0
    ELSE 2
  END;
$$;

-- Internal helper for the SECURITY DEFINER functions below. Default privileges
-- grant to anon/authenticated directly, so revoke them by name.
REVOKE ALL ON FUNCTION public.currency_decimals(text) FROM PUBLIC, anon, authenticated;

ALTER TABLE public.pos_products
  ALTER COLUMN price TYPE numeric(12,3),
  ALTER COLUMN cost_price TYPE numeric(12,3);

ALTER TABLE public.pos_sales
  ALTER COLUMN subtotal TYPE numeric(12,3),
  ALTER COLUMN discount_total TYPE numeric(12,3),
  ALTER COLUMN vat_total TYPE numeric(12,3),
  ALTER COLUMN total TYPE numeric(12,3);

ALTER TABLE public.pos_sale_items
  ALTER COLUMN unit_price TYPE numeric(12,3),
  ALTER COLUMN cost_price TYPE numeric(12,3),
  ALTER COLUMN line_subtotal TYPE numeric(12,3),
  ALTER COLUMN line_discount TYPE numeric(12,3),
  ALTER COLUMN line_vat TYPE numeric(12,3),
  ALTER COLUMN line_total TYPE numeric(12,3);

ALTER TABLE public.pos_returns
  ALTER COLUMN total TYPE numeric(12,3);

ALTER TABLE public.pos_return_items
  ALTER COLUMN line_total TYPE numeric(12,3);

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
  v_item jsonb;
  v_product record;
  v_subtotal numeric := 0;
  v_discount numeric := greatest(0, coalesce(p_discount, 0));
  v_vat numeric := 0;
  v_total numeric := 0;
  v_quantity numeric;
  v_line_subtotal numeric;
  v_line_discount numeric;
  v_line_vat numeric;
  v_line_total numeric;
  v_new_stock numeric;
  v_currency text;
  v_dec integer;
  v_idx integer;
  v_last_idx integer := 0;
  v_allocated numeric := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  v_tenant_id := public.get_user_tenant_id();
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'employee') THEN
    RAISE EXCEPTION 'POS checkout requires employee access';
  END IF;
  v_currency := coalesce(nullif(trim(p_currency), ''), 'AED');
  v_dec := public.currency_decimals(v_currency);
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

  FOR v_item, v_idx IN
    SELECT t.value, t.ordinality::integer FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(value, ordinality)
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
    -- Round each line to the currency first, then add: the header is the sum of
    -- the lines, so the two can never disagree (BHD has 3 decimals, not 2).
    v_line_subtotal := round(v_quantity * v_product.price, v_dec);
    v_subtotal := v_subtotal + v_line_subtotal;
    -- A free item must not be the one that absorbs the discount remainder.
    IF v_line_subtotal > 0 THEN v_last_idx := v_idx; END IF;
  END LOOP;

  v_discount := round(least(v_discount, v_subtotal), v_dec);
  v_sale_number := 'POS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(extensions.uuid_generate_v4()::text, '-', ''), 1, 8));

  INSERT INTO public.pos_sales (
    tenant_id, sale_number, member_id, cashier_id, subtotal, discount_total,
    vat_total, total, currency, payment_method, payment_reference, notes
  )
  VALUES (
    v_tenant_id, v_sale_number, p_member_id, v_user_id, round(v_subtotal, v_dec),
    v_discount, 0, 0, v_currency,
    p_payment_method, nullif(trim(p_payment_reference), ''), nullif(trim(p_notes), '')
  )
  RETURNING id INTO v_sale_id;

  FOR v_item, v_idx IN
    SELECT t.value, t.ordinality::integer FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(value, ordinality)
  LOOP
    v_quantity := (v_item ->> 'quantity')::numeric;
    SELECT p.* INTO v_product
    FROM public.pos_products AS p
    WHERE p.id = (v_item ->> 'product_id')::uuid
      AND p.tenant_id = v_tenant_id
      AND p.is_active = true
    FOR UPDATE;
    v_line_subtotal := round(v_quantity * v_product.price, v_dec);
    -- Share the discount by line subtotal; the last priced line takes what is
    -- left so the shares add up to the discount exactly.
    IF v_subtotal = 0 THEN
      v_line_discount := 0;
    ELSIF v_idx = v_last_idx THEN
      v_line_discount := v_discount - v_allocated;
    ELSE
      v_line_discount := round(v_discount * v_line_subtotal / v_subtotal, v_dec);
    END IF;
    v_line_discount := greatest(0, least(v_line_discount, v_line_subtotal));
    v_allocated := v_allocated + v_line_discount;
    v_line_vat := round((v_line_subtotal - v_line_discount) * v_product.vat_rate / 100, v_dec);
    v_line_total := round(v_line_subtotal - v_line_discount + v_line_vat, v_dec);
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

  -- discount_total is the sum of the line discounts actually applied.
  UPDATE public.pos_sales
  SET discount_total = v_allocated, vat_total = round(v_vat, v_dec), total = round(v_total, v_dec)
  WHERE id = v_sale_id;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'subtotal', round(v_subtotal, v_dec),
    'discount_total', v_allocated,
    'vat_total', round(v_vat, v_dec),
    'total', round(v_total, v_dec),
    'currency', v_currency
  );
END;
$$;

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
  v_quantity numeric;
  v_line_total numeric;
  v_return_total numeric := 0;
  v_new_stock numeric;
  v_all_returned boolean;
  v_dec integer;
  v_prev_refunded numeric;
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
  v_dec := public.currency_decimals(v_sale.currency);

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
    -- What this line has already refunded. Returning the whole remainder refunds
    -- exactly what is left, so several partial returns can never drift from what
    -- the customer paid by a few fils; a partial return is pro rata.
    SELECT coalesce(sum(ri.line_total), 0) INTO v_prev_refunded
    FROM public.pos_return_items AS ri
    WHERE ri.sale_item_id = v_sale_item.id AND ri.tenant_id = v_tenant_id;
    IF v_quantity = v_sale_item.quantity - v_sale_item.returned_quantity THEN
      v_line_total := v_sale_item.line_total - v_prev_refunded;
    ELSE
      v_line_total := round((v_sale_item.line_total / v_sale_item.quantity) * v_quantity, v_dec);
    END IF;
    v_line_total := greatest(0, least(v_line_total, v_sale_item.line_total - v_prev_refunded));
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
  UPDATE public.pos_returns SET total = round(v_return_total, v_dec) WHERE id = v_return_id;

  RETURN jsonb_build_object(
    'return_id', v_return_id,
    'return_number', v_return_number,
    'sale_id', p_sale_id,
    'total', round(v_return_total, v_dec)
  );
END;
$$;

COMMIT;
