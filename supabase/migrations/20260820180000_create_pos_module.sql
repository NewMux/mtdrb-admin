-- MTDRB POS and inventory module
-- Tenant-scoped catalog, stock ledger, sales, returns, RLS, and atomic RPCs.

BEGIN;

CREATE TABLE IF NOT EXISTS public.pos_categories (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  color text NOT NULL DEFAULT '#0ea5e9',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS public.pos_products (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.pos_categories(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
  sku text NOT NULL CHECK (length(trim(sku)) BETWEEN 1 AND 80),
  barcode text,
  description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  cost_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  vat_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (vat_rate >= 0 AND vat_rate <= 100),
  stock_quantity numeric(12,3) NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reorder_level numeric(12,3) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  track_inventory boolean NOT NULL DEFAULT true,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku),
  UNIQUE (tenant_id, barcode)
);

CREATE TABLE IF NOT EXISTS public.pos_stock_movements (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.pos_products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('opening', 'purchase', 'sale', 'return', 'adjustment', 'damage')),
  quantity_delta numeric(12,3) NOT NULL CHECK (quantity_delta <> 0),
  quantity_before numeric(12,3) NOT NULL CHECK (quantity_before >= 0),
  quantity_after numeric(12,3) NOT NULL CHECK (quantity_after >= 0),
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pos_sales (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_number text NOT NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  cashier_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'partially_returned', 'returned', 'voided')),
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  discount_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  vat_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (vat_total >= 0),
  total numeric(12,2) NOT NULL CHECK (total >= 0),
  currency text NOT NULL DEFAULT 'AED',
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'digital_wallet', 'other')),
  payment_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sale_number)
);

CREATE TABLE IF NOT EXISTS public.pos_sale_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.pos_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  sku text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  cost_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  vat_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (vat_rate >= 0 AND vat_rate <= 100),
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  returned_quantity numeric(12,3) NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0),
  line_subtotal numeric(12,2) NOT NULL CHECK (line_subtotal >= 0),
  line_discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (line_discount >= 0),
  line_vat numeric(12,2) NOT NULL DEFAULT 0 CHECK (line_vat >= 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pos_returns (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.pos_sales(id) ON DELETE RESTRICT,
  return_number text NOT NULL,
  cashier_id uuid NOT NULL REFERENCES auth.users(id),
  reason text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  total numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, return_number)
);

CREATE TABLE IF NOT EXISTS public.pos_return_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  return_id uuid NOT NULL REFERENCES public.pos_returns(id) ON DELETE CASCADE,
  sale_item_id uuid NOT NULL REFERENCES public.pos_sale_items(id) ON DELETE RESTRICT,
  product_id uuid REFERENCES public.pos_products(id) ON DELETE SET NULL,
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_categories_tenant ON public.pos_categories(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pos_products_tenant_active ON public.pos_products(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pos_products_tenant_barcode ON public.pos_products(tenant_id, barcode);
CREATE INDEX IF NOT EXISTS idx_pos_products_low_stock ON public.pos_products(tenant_id, stock_quantity, reorder_level);
CREATE INDEX IF NOT EXISTS idx_pos_stock_movements_product ON public.pos_stock_movements(tenant_id, product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sales_tenant_created ON public.pos_sales(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sale_items_sale ON public.pos_sale_items(tenant_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_pos_returns_sale ON public.pos_returns(tenant_id, sale_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_pos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_categories_updated_at ON public.pos_categories;
CREATE TRIGGER pos_categories_updated_at
  BEFORE UPDATE ON public.pos_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_pos_updated_at();

DROP TRIGGER IF EXISTS pos_products_updated_at ON public.pos_products;
CREATE TRIGGER pos_products_updated_at
  BEFORE UPDATE ON public.pos_products
  FOR EACH ROW EXECUTE FUNCTION public.update_pos_updated_at();

ALTER TABLE public.pos_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_return_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_categories_select_same_tenant ON public.pos_categories;
CREATE POLICY pos_categories_select_same_tenant
  ON public.pos_categories FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS pos_categories_manage_employee ON public.pos_categories;
CREATE POLICY pos_categories_manage_employee
  ON public.pos_categories FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

DROP POLICY IF EXISTS pos_products_select_same_tenant ON public.pos_products;
CREATE POLICY pos_products_select_same_tenant
  ON public.pos_products FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS pos_products_manage_employee ON public.pos_products;
CREATE POLICY pos_products_manage_employee
  ON public.pos_products FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

DROP POLICY IF EXISTS pos_stock_movements_select_employee ON public.pos_stock_movements;
CREATE POLICY pos_stock_movements_select_employee
  ON public.pos_stock_movements FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

DROP POLICY IF EXISTS pos_sales_select_employee ON public.pos_sales;
CREATE POLICY pos_sales_select_employee
  ON public.pos_sales FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

DROP POLICY IF EXISTS pos_sale_items_select_employee ON public.pos_sale_items;
CREATE POLICY pos_sale_items_select_employee
  ON public.pos_sale_items FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

DROP POLICY IF EXISTS pos_returns_select_employee ON public.pos_returns;
CREATE POLICY pos_returns_select_employee
  ON public.pos_returns FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

DROP POLICY IF EXISTS pos_return_items_select_employee ON public.pos_return_items;
CREATE POLICY pos_return_items_select_employee
  ON public.pos_return_items FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

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
    v_discount, 0, 0, coalesce(nullif(trim(p_currency), ''), 'AED'),
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
    'currency', coalesce(nullif(trim(p_currency), ''), 'AED')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_pos_inventory(
  p_product_id uuid,
  p_quantity_delta numeric,
  p_movement_type text DEFAULT 'adjustment',
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
  v_product record;
  v_after numeric;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  v_tenant_id := public.get_user_tenant_id();
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'employee') THEN
    RAISE EXCEPTION 'Inventory management requires employee access';
  END IF;
  IF p_quantity_delta IS NULL OR p_quantity_delta = 0 THEN
    RAISE EXCEPTION 'Inventory change cannot be zero';
  END IF;
  IF p_movement_type NOT IN ('opening', 'purchase', 'adjustment', 'damage') THEN
    RAISE EXCEPTION 'Unsupported inventory movement type';
  END IF;
  SELECT p.* INTO v_product
  FROM public.pos_products AS p
  WHERE p.id = p_product_id AND p.tenant_id = v_tenant_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
  v_after := v_product.stock_quantity + p_quantity_delta;
  IF v_after < 0 THEN RAISE EXCEPTION 'Inventory cannot become negative'; END IF;
  UPDATE public.pos_products
  SET stock_quantity = v_after, updated_at = now()
  WHERE id = p_product_id AND tenant_id = v_tenant_id;
  INSERT INTO public.pos_stock_movements (
    tenant_id, product_id, movement_type, quantity_delta, quantity_before,
    quantity_after, reason, created_by
  )
  VALUES (
    v_tenant_id, p_product_id, p_movement_type, p_quantity_delta,
    v_product.stock_quantity, v_after, nullif(trim(p_reason), ''), v_user_id
  );
  RETURN jsonb_build_object('product_id', p_product_id, 'stock_quantity', v_after);
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
    v_line_total := round((v_sale_item.line_total / v_sale_item.quantity) * v_quantity, 2);
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
  UPDATE public.pos_returns SET total = round(v_return_total, 2) WHERE id = v_return_id;

  RETURN jsonb_build_object(
    'return_id', v_return_id,
    'return_number', v_return_number,
    'sale_id', p_sale_id,
    'total', round(v_return_total, 2)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_pos_sale(uuid, numeric, text, text, text, jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.adjust_pos_inventory(uuid, numeric, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.return_pos_sale(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_pos_sale(uuid, numeric, text, text, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_pos_inventory(uuid, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_pos_sale(uuid, jsonb, text) TO authenticated;

COMMIT;
