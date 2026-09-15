-- Testing round 1 feedback (6.1): POS should default to BHD, not AED/USD.
-- Client always passes an explicit currency, so this only affects the
-- fallback used when a caller omits it.

BEGIN;

ALTER TABLE public.pos_sales ALTER COLUMN currency SET DEFAULT 'BHD';

CREATE OR REPLACE FUNCTION public.complete_pos_sale(
  p_member_id uuid,
  p_discount numeric DEFAULT 0,
  p_payment_method text DEFAULT 'cash',
  p_payment_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_currency text DEFAULT 'BHD'
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
    v_subtotal := v_subtotal + (v_quantity * v_product.price);
  END LOOP;

  v_discount := round(least(v_discount, v_subtotal), 2);
  v_sale_number := 'POS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(extensions.uuid_generate_v4()::text, '-', ''), 1, 8));

  INSERT INTO public.pos_sales (
    tenant_id, sale_number, member_id, cashier_id, subtotal, discount_total,
    vat_total, total, currency, payment_method, payment_reference, notes
  )
  VALUES (
    v_tenant_id, v_sale_number, p_member_id, v_user_id, round(v_subtotal, 2),
    v_discount, 0, 0, coalesce(nullif(trim(p_currency), ''), 'BHD'),
    p_payment_method, nullif(trim(p_payment_reference), ''), nullif(trim(p_notes), '')
  )
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item ->> 'quantity')::numeric;
    SELECT p.* INTO v_product
    FROM public.pos_products AS p
    WHERE p.id = (v_item ->> 'product_id')::uuid
      AND p.tenant_id = v_tenant_id
      AND p.is_active = true
    FOR UPDATE;
    v_line_subtotal := round(v_quantity * v_product.price, 2);
    v_line_discount := CASE WHEN v_subtotal = 0 THEN 0 ELSE round(v_discount * v_line_subtotal / v_subtotal, 2) END;
    v_line_vat := round((v_line_subtotal - v_line_discount) * v_product.vat_rate / 100, 2);
    v_line_total := round(v_line_subtotal - v_line_discount + v_line_vat, 2);
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
  SET vat_total = round(v_vat, 2), total = round(v_total, 2)
  WHERE id = v_sale_id;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'subtotal', round(v_subtotal, 2),
    'discount_total', v_discount,
    'vat_total', round(v_vat, 2),
    'total', round(v_total, 2),
    'currency', coalesce(nullif(trim(p_currency), ''), 'BHD')
  );
END;
$$;

COMMIT;
