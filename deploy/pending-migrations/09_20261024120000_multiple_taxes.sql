-- Several taxes per gym: how a sale's tax splits between them.
-- ============================================================================
-- A gym may charge more than one tax (a service charge and VAT; GST and a
-- provincial tax). The rest of the system still works with ONE combined rate per
-- line - gym_settings.vat_rate, invoices, pos_products.vat_rate, the line maths
-- in complete_pos_sale() - so none of that changes. What is new:
--
--   * invoices.tax_breakdown and pos_sales.tax_breakdown: a snapshot, taken when
--     the document is created, of how its tax total splits between the gym's
--     taxes: [{name, rate, compound, amount}, ...] whose amounts add up to the tax
--     total exactly. NULL on older documents and when no tax was charged. A
--     later change to the gym's taxes never rewrites it.
--   * allocate_tax_breakdown(): the split itself. It mirrors src/utils/taxMath.ts
--     (allocateTax) step for step: components apply in order, a "compound" one is
--     charged on net + the tax of those before it, and the largest-remainder rule
--     (ties to the earlier tax) makes the amounts sum exactly. The golden cases in
--     supabase/tests/multiple_taxes.test.sql and src/utils/taxMath.test.ts are
--     identical.
--   * tenant_tax_components(): the gym's taxes as stored in gym_settings, or the
--     single tax implied by vat_rate for a gym configured before taxes were a list.
--   * complete_pos_sale() records the breakdown. Same body as
--     20261022180000_pos_currency_decimals.sql plus the lines marked in the
--     function; the money maths is untouched.

BEGIN;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_breakdown jsonb;
ALTER TABLE public.pos_sales ADD COLUMN IF NOT EXISTS tax_breakdown jsonb;

COMMENT ON COLUMN public.invoices.tax_breakdown IS
  'Snapshot of how vat_total splits between the gym''s taxes when the invoice was created: [{name, rate, compound, amount}]. NULL on older invoices.';
COMMENT ON COLUMN public.pos_sales.tax_breakdown IS
  'Snapshot of how vat_total splits between the gym''s taxes when the sale was made: [{name, rate, compound, amount}]. NULL when no tax was charged.';

-- --------------------------------------------------------------------------
-- The split
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.allocate_tax_breakdown(
  p_tax numeric,
  p_components jsonb,
  p_decimals integer
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  n integer;
  i integer;
  v_scale numeric;
  v_base numeric;
  v_earlier numeric := 0;
  v_total numeric;
  v_weight_sum numeric := 0;
  v_leftover numeric;
  v_factor numeric := power(10::numeric, p_decimals);
  t numeric[] := '{}';
  shares numeric[] := '{}';
  rems numeric[] := '{}';
  v_comp jsonb;
  v_out jsonb := '[]'::jsonb;
BEGIN
  IF p_components IS NULL OR jsonb_typeof(p_components) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;
  n := jsonb_array_length(p_components);
  IF n = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  v_scale := power(10000::numeric, n);
  v_total := round(greatest(0, coalesce(p_tax, 0)) * v_factor);

  -- Each tax on a net of 1, as integers over v_scale (exact; see taxMath.ts).
  FOR i IN 1..n LOOP
    v_comp := p_components -> (i - 1);
    v_base := v_scale + CASE WHEN i > 1 AND coalesce((v_comp ->> 'compound')::boolean, false) THEN v_earlier ELSE 0 END;
    t[i] := div(round(greatest(0, coalesce((v_comp ->> 'rate')::numeric, 0)) * 100) * v_base, 10000::numeric);
    v_earlier := v_earlier + t[i];
    v_weight_sum := v_weight_sum + t[i];
  END LOOP;

  IF v_weight_sum = 0 THEN
    FOR i IN 1..n LOOP shares[i] := 0; END LOOP;
  ELSE
    v_leftover := v_total;
    FOR i IN 1..n LOOP
      shares[i] := div(v_total * t[i], v_weight_sum);
      rems[i] := mod(v_total * t[i], v_weight_sum);
      v_leftover := v_leftover - shares[i];
    END LOOP;
    -- Largest remainder first, ties to the earlier tax.
    FOR i IN
      SELECT o.idx FROM generate_series(1, n) AS o(idx)
      ORDER BY rems[o.idx] DESC, o.idx ASC
      LIMIT v_leftover::integer
    LOOP
      shares[i] := shares[i] + 1;
    END LOOP;
  END IF;

  FOR i IN 1..n LOOP
    v_comp := p_components -> (i - 1);
    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'name', v_comp ->> 'name',
      'rate', (v_comp ->> 'rate')::numeric,
      'compound', coalesce((v_comp ->> 'compound')::boolean, false),
      'amount', shares[i] / v_factor
    ));
  END LOOP;
  RETURN v_out;
END;
$$;

-- --------------------------------------------------------------------------
-- The gym's taxes
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tenant_tax_components(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_settings public.gym_settings;
  v_components jsonb;
BEGIN
  SELECT * INTO v_settings FROM public.gym_settings AS g WHERE g.tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_array(jsonb_build_object('name', 'VAT', 'rate', 0, 'compound', false));
  END IF;

  v_components := v_settings.metadata -> 'tax' -> 'components';
  IF v_components IS NOT NULL AND jsonb_typeof(v_components) = 'array' AND jsonb_array_length(v_components) > 0 THEN
    RETURN v_components;
  END IF;

  -- A gym configured before taxes were a list: one tax at the stored rate.
  RETURN jsonb_build_array(jsonb_build_object(
    'name', coalesce(nullif(btrim(v_settings.metadata -> 'tax' ->> 'name'), ''), 'VAT'),
    'rate', coalesce(v_settings.vat_rate, 0),
    'compound', false
  ));
END;
$$;

-- Internal helpers: complete_pos_sale() (SECURITY DEFINER) calls them. Default
-- privileges grant to anon/authenticated directly, so revoke them by name.
REVOKE ALL ON FUNCTION public.allocate_tax_breakdown(numeric, jsonb, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tenant_tax_components(uuid) FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------------
-- POS checkout: same as before, plus the breakdown
-- --------------------------------------------------------------------------
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
  v_breakdown jsonb;
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

  -- How the tax splits between the gym's taxes, frozen now so a later change to
  -- the gym's tax settings never rewrites an old sale. NULL when no tax was charged.
  IF round(v_vat, v_dec) > 0 THEN
    v_breakdown := public.allocate_tax_breakdown(
      round(v_vat, v_dec), public.tenant_tax_components(v_tenant_id), v_dec
    );
  END IF;

  -- discount_total is the sum of the line discounts actually applied.
  UPDATE public.pos_sales
  SET discount_total = v_allocated, vat_total = round(v_vat, v_dec), total = round(v_total, v_dec),
      tax_breakdown = v_breakdown
  WHERE id = v_sale_id;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'subtotal', round(v_subtotal, v_dec),
    'discount_total', v_allocated,
    'vat_total', round(v_vat, v_dec),
    'total', round(v_total, v_dec),
    'currency', v_currency,
    'tax_breakdown', v_breakdown
  );
END;
$$;

COMMIT;
