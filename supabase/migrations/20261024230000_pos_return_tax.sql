-- POS returns record the tax they give back.
--
-- Until now a return stored only its total; the VAT dashboard had to estimate
-- the tax inside it from the returned quantities. This stores it:
--   * pos_return_items.vat_amount - the tax inside each returned line, pro rata
--     to the quantity, the final return of a line taking exactly what is left;
--   * pos_returns.vat_total       - their sum (the tax refunded);
--   * pos_returns.tax_breakdown   - that tax split between the sale's taxes
--     ([{name, rate, compound, amount}], like pos_sales.tax_breakdown).
-- Returns made before this migration are backfilled with the same pro-rata
-- arithmetic (their per-line remainders were not tracked, so a backfilled
-- figure can differ from the exact one by a fraction of the smallest unit).

BEGIN;

ALTER TABLE public.pos_return_items ADD COLUMN IF NOT EXISTS vat_amount numeric(12,3) NOT NULL DEFAULT 0 CHECK (vat_amount >= 0);
ALTER TABLE public.pos_returns ADD COLUMN IF NOT EXISTS vat_total numeric(12,3) NOT NULL DEFAULT 0 CHECK (vat_total >= 0);
ALTER TABLE public.pos_returns ADD COLUMN IF NOT EXISTS tax_breakdown jsonb;

COMMENT ON COLUMN public.pos_returns.tax_breakdown IS
  'How vat_total splits between the taxes of the original sale: [{name, rate, compound, amount}]. NULL when no tax was refunded.';

-- Backfill earlier returns (cancelled ones refund nothing).
UPDATE public.pos_return_items AS ri
SET vat_amount = least(
      si.line_vat,
      round((si.line_vat / si.quantity) * ri.quantity, public.currency_decimals(s.currency))
    )
FROM public.pos_sale_items AS si
JOIN public.pos_sales AS s ON s.id = si.sale_id
WHERE si.id = ri.sale_item_id AND si.quantity > 0 AND ri.vat_amount = 0 AND si.line_vat > 0;

UPDATE public.pos_returns AS r
SET vat_total = x.vat,
    tax_breakdown = CASE
      WHEN x.vat > 0 AND s.tax_breakdown IS NOT NULL
        THEN public.allocate_tax_breakdown(x.vat, s.tax_breakdown, public.currency_decimals(s.currency))
    END
FROM (
  SELECT ri.return_id, sum(ri.vat_amount) AS vat
  FROM public.pos_return_items AS ri
  GROUP BY ri.return_id
) AS x, public.pos_sales AS s
WHERE x.return_id = r.id AND s.id = r.sale_id AND r.status <> 'cancelled' AND r.vat_total = 0;

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
  v_prev_vat numeric;
  v_line_vat numeric;
  v_return_vat numeric := 0;
  v_breakdown jsonb;
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

    -- The tax inside that refund, the same way: pro rata, and the last return
    -- of a line takes exactly what is left, so the refunds of one sale add up
    -- to the tax it charged.
    SELECT coalesce(sum(ri.vat_amount), 0) INTO v_prev_vat
    FROM public.pos_return_items AS ri
    WHERE ri.sale_item_id = v_sale_item.id AND ri.tenant_id = v_tenant_id;
    IF v_quantity = v_sale_item.quantity - v_sale_item.returned_quantity THEN
      v_line_vat := v_sale_item.line_vat - v_prev_vat;
    ELSE
      v_line_vat := round((v_sale_item.line_vat / v_sale_item.quantity) * v_quantity, v_dec);
    END IF;
    v_line_vat := greatest(0, least(v_line_vat, v_sale_item.line_vat - v_prev_vat));
    v_return_vat := v_return_vat + v_line_vat;

    INSERT INTO public.pos_return_items (
      tenant_id, return_id, sale_item_id, product_id, quantity, line_total, vat_amount
    )
    VALUES (
      v_tenant_id, v_return_id, v_sale_item.id, v_sale_item.product_id, v_quantity, v_line_total, v_line_vat
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
  -- Split the refunded tax between the taxes the sale charged.
  v_return_vat := round(v_return_vat, v_dec);
  IF v_return_vat > 0 AND v_sale.tax_breakdown IS NOT NULL THEN
    v_breakdown := public.allocate_tax_breakdown(v_return_vat, v_sale.tax_breakdown, v_dec);
  END IF;
  UPDATE public.pos_returns
  SET total = round(v_return_total, v_dec), vat_total = v_return_vat, tax_breakdown = v_breakdown
  WHERE id = v_return_id;

  RETURN jsonb_build_object(
    'return_id', v_return_id,
    'return_number', v_return_number,
    'sale_id', p_sale_id,
    'total', round(v_return_total, v_dec),
    'vat_total', v_return_vat,
    'tax_breakdown', v_breakdown
  );
END;
$$;

REVOKE ALL ON FUNCTION public.return_pos_sale(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.return_pos_sale(uuid, jsonb, text) TO authenticated;

COMMIT;
