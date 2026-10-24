-- Applying a membership plan records the sale.
--
-- assign_member_plan() (20261025090000) changed the member but left no invoice, so
-- revenue and VAT reports - which count invoices - missed every renewal. It now
-- also inserts a paid 'membership' invoice, in the same transaction, using the
-- gym's own tax settings (price inclusive of tax or tax added on top, taxes split
-- per tax in tax_breakdown). p_invoice = false skips it (a comped member); a plan
-- price of 0 never makes an invoice. The old 5-argument version is dropped: keeping
-- both would make short calls ambiguous.

BEGIN;

DROP FUNCTION IF EXISTS public.assign_member_plan(uuid, uuid, boolean, date, numeric);

CREATE OR REPLACE FUNCTION public.assign_member_plan(
  p_member_id uuid,
  p_plan_id uuid,
  p_renew boolean DEFAULT false,
  p_start date DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_invoice boolean DEFAULT true,
  p_payment_method text DEFAULT 'cash'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
  v_member public.members;
  v_plan public.plans;
  v_today date;
  v_start date;
  v_end date;
  v_price numeric;
  v_decimals integer;
  v_currency text;
  v_settings public.gym_settings;
  v_rate numeric := 0;
  v_inclusive boolean := false;
  v_net numeric;
  v_vat numeric;
  v_gross numeric;
  v_invoice_id uuid;
  v_invoice_number text;
  v_breakdown jsonb;
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'employee') THEN
    RAISE EXCEPTION 'Changing a membership requires employee access' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_member FROM public.members AS m
  WHERE m.id = p_member_id AND m.tenant_id = v_tenant
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_plan FROM public.plans AS p WHERE p.id = p_plan_id AND p.tenant_id = v_tenant;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_plan.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'This plan is not active' USING ERRCODE = '55000';
  END IF;
  IF v_plan.duration IS NULL OR v_plan.duration < 1 THEN
    RAISE EXCEPTION 'This plan has no valid duration' USING ERRCODE = '22023';
  END IF;

  IF p_payment_method IS NULL OR p_payment_method NOT IN ('cash', 'card', 'bank_transfer', 'online', 'other') THEN
    RAISE EXCEPTION 'Unsupported payment method' USING ERRCODE = '22023';
  END IF;

  v_price := COALESCE(p_price, v_plan.price);
  IF v_price < 0 THEN
    RAISE EXCEPTION 'The price cannot be negative' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_settings FROM public.gym_settings AS g WHERE g.tenant_id = v_tenant;
  v_currency := COALESCE(v_settings.currency, 'AED');
  v_decimals := public.currency_decimals(v_currency);
  IF v_settings.vat_enabled IS TRUE THEN v_rate := COALESCE(v_settings.vat_rate, 0); END IF;
  v_inclusive := COALESCE((v_settings.metadata -> 'tax' ->> 'prices_include_tax')::boolean, false);
  v_price := round(v_price, v_decimals);

  v_today := public.attendance_local_date(v_tenant, now());
  IF p_start IS NOT NULL THEN
    v_start := p_start;
  ELSIF p_renew AND v_member.expiry_date IS NOT NULL AND v_member.expiry_date >= v_today THEN
    v_start := v_member.expiry_date + 1;     -- continue straight after the paid period
  ELSE
    v_start := v_today;
  END IF;
  v_end := v_start + (v_plan.duration - 1);

  UPDATE public.members
  SET plan_id = v_plan.id,
      membership_type = v_plan.name,
      expiry_date = v_end,
      membership_status = CASE WHEN membership_status IN ('inactive', 'expired') THEN 'active' ELSE membership_status END,
      status = CASE WHEN status IN ('inactive', 'pending') THEN 'active' ELSE status END,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'membership_price', v_price,
        'plan_start', v_start
      )
  WHERE id = v_member.id;

  -- The sale, recorded with the plan change so one cannot happen without the
  -- other. Nothing to record for a free plan. Tax follows the gym's settings: the
  -- price is either already inclusive of it or has it added, as on any invoice.
  IF p_invoice AND v_price > 0 THEN
    IF v_inclusive THEN
      v_gross := v_price;
      v_net := round(v_price / (1 + v_rate / 100), v_decimals);
      v_vat := v_gross - v_net;
    ELSE
      v_net := v_price;
      v_vat := round(v_price * v_rate / 100, v_decimals);
      v_gross := v_net + v_vat;
    END IF;
    IF v_vat > 0 THEN
      v_breakdown := public.allocate_tax_breakdown(v_vat, public.tenant_tax_components(v_tenant), v_decimals);
    END IF;
    v_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(extensions.uuid_generate_v4()::text, '-', ''), 1, 8));
    INSERT INTO public.invoices (
      tenant_id, member_id, type, status, issue_date, due_date, paid_date, payment_method,
      amount, total, paid_amount, vat_total, tax_breakdown, currency, line_items, metadata
    )
    VALUES (
      v_tenant, v_member.id, 'membership', 'paid', v_today, v_today, v_today, p_payment_method,
      v_net, v_gross, v_gross, v_vat, v_breakdown, v_currency,
      jsonb_build_array(jsonb_build_object(
        'id', '1',
        'description', v_plan.name || ' (' || v_start || ' to ' || v_end || ')',
        'quantity', 1,
        'unit_price', v_net,
        'vat_rate', v_rate,
        'discount_percentage', 0,
        'total', v_gross
      )),
      jsonb_build_object(
        'invoice_number', v_invoice_number,
        'source', 'membership_plan',
        'plan_id', v_plan.id,
        'plan_name', v_plan.name,
        'created_by', auth.uid(),
        'country_code', v_settings.metadata -> 'general' ->> 'country'
      )
    )
    RETURNING id INTO v_invoice_id;
  END IF;

  RETURN jsonb_build_object(
    'invoice_id', v_invoice_id,
    'member_id', v_member.id,
    'plan_id', v_plan.id,
    'plan_name', v_plan.name,
    'start_date', v_start,
    'expiry_date', v_end,
    'price', v_price,
    'renewed', p_renew
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_member_plan(uuid, uuid, boolean, date, numeric, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_member_plan(uuid, uuid, boolean, date, numeric, boolean, text) TO authenticated;

COMMIT;
