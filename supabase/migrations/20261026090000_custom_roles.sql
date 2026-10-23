-- Custom staff roles with database-enforced permissions.
--
-- Until now a gym's staff were admin / employee / trainer and nothing else. An
-- owner can now define roles of their own ("Front desk", "Accountant", "Coach")
-- and choose what each may do. The rules that keep it safe:
--
--   * A custom role sits on top of a built-in TIER (employee or trainer) and can
--     only NARROW it. All existing row level security stays exactly as it was;
--     RESTRICTIVE policies below are ANDed with it, so a custom role can never be
--     allowed something its tier does not already allow. A member with no custom
--     role (everyone today) is not affected by any of this: has_permission()
--     says "yes" and the old policies decide.
--   * Only a gym admin can create, change or delete roles and assign them. The
--     tables are written through SECURITY DEFINER functions that check that; the
--     role tables have no write privileges for the browser.
--   * An admin never holds a custom role (the guard trigger clears it), so the
--     owner can't be locked out by a mis-set role.
--   * SECURITY DEFINER functions that read finance or member data as the table
--     owner (and so bypass RLS) check the permission themselves.
--
-- Permissions (staff_permission_catalog):
--   members.manage     add/change/remove members, subscriptions; put them on plans
--   billing.view       see invoices, expenses, VAT, revenue figures and their files
--   billing.manage     create/change them (implies billing.view)
--   pos.use            ring up sales and returns, see sales
--   pos.manage         products, categories, stock
--   classes.manage     classes, bookings, schedules (members.manage may also book members in)
--   trainers.manage    trainer records and documents
--   attendance.manage  check-ins, scanning, member credentials
--
-- Also here: the staff list/role/removal functions and staff_provision(), which
-- the invite-staff Edge Function (service role) uses to add an invited person.

BEGIN;

CREATE OR REPLACE FUNCTION public.staff_permission_catalog()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT ARRAY[
    'members.manage', 'billing.view', 'billing.manage', 'pos.use', 'pos.manage',
    'classes.manage', 'trainers.manage', 'attendance.manage'
  ]::text[];
$$;

-- --------------------------------------------------------------------------
-- Roles
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_roles (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_role text NOT NULL CHECK (base_role IN ('employee', 'trainer')),
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_roles_name_unique
  ON public.tenant_roles (tenant_id, lower(name));

ALTER TABLE public.tenant_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tenant_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.tenant_roles TO authenticated;

DROP POLICY IF EXISTS tenant_roles_select_same_tenant ON public.tenant_roles;
CREATE POLICY tenant_roles_select_same_tenant ON public.tenant_roles FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE OR REPLACE FUNCTION public.tenant_roles_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_catalog text[] := public.staff_permission_catalog();
  v_allowed text[];
  v_perms text[];
BEGIN
  NEW.name := btrim(regexp_replace(NEW.name, '\s+', ' ', 'g'));
  IF NEW.name = '' OR char_length(NEW.name) > 40 THEN
    RAISE EXCEPTION 'A role name must be 1 to 40 characters' USING ERRCODE = '22023';
  END IF;

  -- billing.manage implies billing.view; no repeats; nothing outside the catalogue.
  v_perms := ARRAY(
    SELECT DISTINCT p FROM unnest(
      CASE WHEN 'billing.manage' = ANY (COALESCE(NEW.permissions, '{}'))
           THEN COALESCE(NEW.permissions, '{}') || ARRAY['billing.view']
           ELSE COALESCE(NEW.permissions, '{}') END
    ) AS p ORDER BY p
  );
  IF EXISTS (SELECT 1 FROM unnest(v_perms) AS p WHERE NOT (p = ANY (v_catalog))) THEN
    RAISE EXCEPTION 'Unknown permission' USING ERRCODE = '22023';
  END IF;

  -- A trainer-tier role can't be given what its tier can't do anyway; refusing is
  -- clearer than saving a role whose permissions silently do nothing.
  IF NEW.base_role = 'trainer' THEN
    v_allowed := ARRAY['classes.manage', 'billing.view'];
    IF EXISTS (SELECT 1 FROM unnest(v_perms) AS p WHERE NOT (p = ANY (v_allowed))) THEN
      RAISE EXCEPTION 'A trainer-level role can only manage classes or view billing' USING ERRCODE = '22023';
    END IF;
  END IF;
  NEW.permissions := v_perms;

  IF TG_OP = 'INSERT' AND (SELECT count(*) FROM public.tenant_roles WHERE tenant_id = NEW.tenant_id) >= 20 THEN
    RAISE EXCEPTION 'A gym can have at most 20 custom roles' USING ERRCODE = '54000';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenant_roles_guard ON public.tenant_roles;
CREATE TRIGGER tenant_roles_guard
  BEFORE INSERT OR UPDATE ON public.tenant_roles
  FOR EACH ROW EXECUTE FUNCTION public.tenant_roles_guard();

-- --------------------------------------------------------------------------
-- A membership may hold a custom role
-- --------------------------------------------------------------------------
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS custom_role_id uuid REFERENCES public.tenant_roles(id);   -- NO ACTION: a role in use cannot be deleted, but deleting a whole gym (which removes both) still works

CREATE INDEX IF NOT EXISTS idx_memberships_custom_role ON public.memberships (custom_role_id) WHERE custom_role_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.memberships_custom_role_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role public.tenant_roles;
BEGIN
  IF NEW.custom_role_id IS NOT NULL THEN
    SELECT * INTO v_role FROM public.tenant_roles AS r WHERE r.id = NEW.custom_role_id;
    IF NOT FOUND OR v_role.tenant_id <> NEW.tenant_id THEN
      RAISE EXCEPTION 'That role does not belong to this organization' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE'
       AND NEW.custom_role_id IS NOT DISTINCT FROM OLD.custom_role_id
       AND NEW.role IS DISTINCT FROM OLD.role
       AND NEW.role <> v_role.base_role THEN
      -- A built-in role was picked directly: that replaces the custom one.
      NEW.custom_role_id := NULL;
    ELSE
      -- The stored tier always follows the custom role's tier.
      NEW.role := v_role.base_role;
    END IF;
  END IF;
  -- An admin never holds a custom role.
  IF NEW.role = 'admin' THEN
    NEW.custom_role_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS memberships_custom_role_guard ON public.memberships;
CREATE TRIGGER memberships_custom_role_guard
  BEFORE INSERT OR UPDATE OF role, custom_role_id ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.memberships_custom_role_guard();

-- Changing a role's tier moves everyone who holds it.
CREATE OR REPLACE FUNCTION public.tenant_roles_follow_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.base_role IS DISTINCT FROM OLD.base_role THEN
    UPDATE public.memberships SET role = NEW.base_role WHERE custom_role_id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tenant_roles_follow_tier ON public.tenant_roles;
CREATE TRIGGER tenant_roles_follow_tier
  AFTER UPDATE OF base_role ON public.tenant_roles
  FOR EACH ROW EXECUTE FUNCTION public.tenant_roles_follow_tier();

-- --------------------------------------------------------------------------
-- The check everything else uses
-- --------------------------------------------------------------------------
-- No custom role = a built-in tier = "yes" (the tier's own policies decide).
-- A custom role = only what it lists, in the caller's own gym.
CREATE OR REPLACE FUNCTION public.has_permission(p_tenant_id uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_id uuid;
  v_ok boolean;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR p_tenant_id IS NULL OR p_permission IS NULL THEN
    RETURN false;
  END IF;
  SELECT m.custom_role_id INTO v_role_id
  FROM public.memberships AS m
  WHERE m.user_id = (SELECT auth.uid()) AND m.tenant_id = p_tenant_id
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF v_role_id IS NULL THEN
    RETURN true;
  END IF;
  SELECT p_permission = ANY (r.permissions) INTO v_ok
  FROM public.tenant_roles AS r
  WHERE r.id = v_role_id AND r.tenant_id = p_tenant_id;
  RETURN COALESCE(v_ok, false);
END;
$$;

-- What the signed-in user may do, for the app to show or hide things.
-- permissions = NULL means a built-in role (everything its tier allows).
CREATE OR REPLACE FUNCTION public.my_staff_access()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
  v_m public.memberships;
  v_role public.tenant_roles;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR v_tenant IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_m FROM public.memberships AS m
  WHERE m.user_id = (SELECT auth.uid()) AND m.tenant_id = v_tenant LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_m.custom_role_id IS NOT NULL THEN
    SELECT * INTO v_role FROM public.tenant_roles AS r WHERE r.id = v_m.custom_role_id;
  END IF;
  RETURN jsonb_build_object(
    'role', v_m.role,
    'custom_role_id', v_m.custom_role_id,
    'custom_role_name', v_role.name,
    'permissions', CASE WHEN v_m.custom_role_id IS NULL THEN NULL ELSE to_jsonb(COALESCE(v_role.permissions, '{}'::text[])) END
  );
END;
$$;


-- --------------------------------------------------------------------------
-- Row level security overlay (RESTRICTIVE: it can only narrow what a gym
-- member's built-in tier already allows, never widen it)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS members_perm_ins ON public.members;
CREATE POLICY members_perm_ins ON public.members AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS members_perm_upd ON public.members;
CREATE POLICY members_perm_upd ON public.members AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS members_perm_del ON public.members;
CREATE POLICY members_perm_del ON public.members AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS subscriptions_perm_ins ON public.subscriptions;
CREATE POLICY subscriptions_perm_ins ON public.subscriptions AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS subscriptions_perm_upd ON public.subscriptions;
CREATE POLICY subscriptions_perm_upd ON public.subscriptions AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS subscriptions_perm_del ON public.subscriptions;
CREATE POLICY subscriptions_perm_del ON public.subscriptions AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS attendance_member_identities_perm_ins ON public.attendance_member_identities;
CREATE POLICY attendance_member_identities_perm_ins ON public.attendance_member_identities AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'attendance.manage')));
DROP POLICY IF EXISTS attendance_member_identities_perm_upd ON public.attendance_member_identities;
CREATE POLICY attendance_member_identities_perm_upd ON public.attendance_member_identities AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'attendance.manage')));
DROP POLICY IF EXISTS attendance_member_identities_perm_del ON public.attendance_member_identities;
CREATE POLICY attendance_member_identities_perm_del ON public.attendance_member_identities AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'attendance.manage')));
DROP POLICY IF EXISTS attendance_events_perm_ins ON public.attendance_events;
CREATE POLICY attendance_events_perm_ins ON public.attendance_events AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'attendance.manage')));
DROP POLICY IF EXISTS attendance_events_perm_upd ON public.attendance_events;
CREATE POLICY attendance_events_perm_upd ON public.attendance_events AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'attendance.manage')));
DROP POLICY IF EXISTS invoices_perm_sel ON public.invoices;
CREATE POLICY invoices_perm_sel ON public.invoices AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.view') OR public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS expenses_perm_sel ON public.expenses;
CREATE POLICY expenses_perm_sel ON public.expenses AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.view') OR public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS vat_returns_perm_sel ON public.vat_returns;
CREATE POLICY vat_returns_perm_sel ON public.vat_returns AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.view') OR public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS invoices_perm_ins ON public.invoices;
CREATE POLICY invoices_perm_ins ON public.invoices AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS invoices_perm_upd ON public.invoices;
CREATE POLICY invoices_perm_upd ON public.invoices AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS invoices_perm_del ON public.invoices;
CREATE POLICY invoices_perm_del ON public.invoices AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS expenses_perm_ins ON public.expenses;
CREATE POLICY expenses_perm_ins ON public.expenses AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS expenses_perm_upd ON public.expenses;
CREATE POLICY expenses_perm_upd ON public.expenses AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS expenses_perm_del ON public.expenses;
CREATE POLICY expenses_perm_del ON public.expenses AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS vat_returns_perm_ins ON public.vat_returns;
CREATE POLICY vat_returns_perm_ins ON public.vat_returns AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS vat_returns_perm_upd ON public.vat_returns;
CREATE POLICY vat_returns_perm_upd ON public.vat_returns AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS vat_returns_perm_del ON public.vat_returns;
CREATE POLICY vat_returns_perm_del ON public.vat_returns AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage')));
DROP POLICY IF EXISTS pos_sales_perm_sel ON public.pos_sales;
CREATE POLICY pos_sales_perm_sel ON public.pos_sales AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.use') OR public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_sale_items_perm_sel ON public.pos_sale_items;
CREATE POLICY pos_sale_items_perm_sel ON public.pos_sale_items AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.use') OR public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_returns_perm_sel ON public.pos_returns;
CREATE POLICY pos_returns_perm_sel ON public.pos_returns AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.use') OR public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_return_items_perm_sel ON public.pos_return_items;
CREATE POLICY pos_return_items_perm_sel ON public.pos_return_items AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.use') OR public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_stock_movements_perm_sel ON public.pos_stock_movements;
CREATE POLICY pos_stock_movements_perm_sel ON public.pos_stock_movements AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.use') OR public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_products_perm_ins ON public.pos_products;
CREATE POLICY pos_products_perm_ins ON public.pos_products AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_products_perm_upd ON public.pos_products;
CREATE POLICY pos_products_perm_upd ON public.pos_products AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_products_perm_del ON public.pos_products;
CREATE POLICY pos_products_perm_del ON public.pos_products AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_categories_perm_ins ON public.pos_categories;
CREATE POLICY pos_categories_perm_ins ON public.pos_categories AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_categories_perm_upd ON public.pos_categories;
CREATE POLICY pos_categories_perm_upd ON public.pos_categories AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS pos_categories_perm_del ON public.pos_categories;
CREATE POLICY pos_categories_perm_del ON public.pos_categories AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'pos.manage')));
DROP POLICY IF EXISTS classes_perm_ins ON public.classes;
CREATE POLICY classes_perm_ins ON public.classes AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage')));
DROP POLICY IF EXISTS classes_perm_upd ON public.classes;
CREATE POLICY classes_perm_upd ON public.classes AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage')));
DROP POLICY IF EXISTS classes_perm_del ON public.classes;
CREATE POLICY classes_perm_del ON public.classes AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage')));
DROP POLICY IF EXISTS class_bookings_perm_ins ON public.class_bookings;
CREATE POLICY class_bookings_perm_ins ON public.class_bookings AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage') OR public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS class_bookings_perm_upd ON public.class_bookings;
CREATE POLICY class_bookings_perm_upd ON public.class_bookings AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage') OR public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS class_bookings_perm_del ON public.class_bookings;
CREATE POLICY class_bookings_perm_del ON public.class_bookings AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage') OR public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS class_waitlist_perm_ins ON public.class_waitlist;
CREATE POLICY class_waitlist_perm_ins ON public.class_waitlist AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage') OR public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS class_waitlist_perm_upd ON public.class_waitlist;
CREATE POLICY class_waitlist_perm_upd ON public.class_waitlist AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage') OR public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS class_waitlist_perm_del ON public.class_waitlist;
CREATE POLICY class_waitlist_perm_del ON public.class_waitlist AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage') OR public.has_permission(public.get_user_tenant_id(), 'members.manage')));
DROP POLICY IF EXISTS trainer_schedule_perm_ins ON public.trainer_schedule;
CREATE POLICY trainer_schedule_perm_ins ON public.trainer_schedule AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage')));
DROP POLICY IF EXISTS trainer_schedule_perm_upd ON public.trainer_schedule;
CREATE POLICY trainer_schedule_perm_upd ON public.trainer_schedule AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage')));
DROP POLICY IF EXISTS trainer_schedule_perm_del ON public.trainer_schedule;
CREATE POLICY trainer_schedule_perm_del ON public.trainer_schedule AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'classes.manage')));
DROP POLICY IF EXISTS trainers_perm_ins ON public.trainers;
CREATE POLICY trainers_perm_ins ON public.trainers AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_permission(public.get_user_tenant_id(), 'trainers.manage')));
DROP POLICY IF EXISTS trainers_perm_upd ON public.trainers;
CREATE POLICY trainers_perm_upd ON public.trainers AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'trainers.manage')));
DROP POLICY IF EXISTS trainers_perm_del ON public.trainers;
CREATE POLICY trainers_perm_del ON public.trainers AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((SELECT public.has_permission(public.get_user_tenant_id(), 'trainers.manage')));
DROP POLICY IF EXISTS objects_perm_fin_sel ON storage.objects;
CREATE POLICY objects_perm_fin_sel ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((bucket_id NOT IN ('invoice-files', 'expense-receipts') OR (SELECT public.has_permission(public.get_user_tenant_id(), 'billing.view') OR public.has_permission(public.get_user_tenant_id(), 'billing.manage'))));
DROP POLICY IF EXISTS objects_perm_fin_ins ON storage.objects;
CREATE POLICY objects_perm_fin_ins ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((bucket_id NOT IN ('invoice-files', 'expense-receipts') OR (SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage'))));
DROP POLICY IF EXISTS objects_perm_fin_upd ON storage.objects;
CREATE POLICY objects_perm_fin_upd ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((bucket_id NOT IN ('invoice-files', 'expense-receipts') OR (SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage'))));
DROP POLICY IF EXISTS objects_perm_fin_del ON storage.objects;
CREATE POLICY objects_perm_fin_del ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((bucket_id NOT IN ('invoice-files', 'expense-receipts') OR (SELECT public.has_permission(public.get_user_tenant_id(), 'billing.manage'))));
DROP POLICY IF EXISTS objects_perm_trainerdocs_ins ON storage.objects;
CREATE POLICY objects_perm_trainerdocs_ins ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK ((bucket_id NOT IN ('trainer-documents') OR (SELECT public.has_permission(public.get_user_tenant_id(), 'trainers.manage'))));
DROP POLICY IF EXISTS objects_perm_trainerdocs_upd ON storage.objects;
CREATE POLICY objects_perm_trainerdocs_upd ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING ((bucket_id NOT IN ('trainer-documents') OR (SELECT public.has_permission(public.get_user_tenant_id(), 'trainers.manage'))));
DROP POLICY IF EXISTS objects_perm_trainerdocs_del ON storage.objects;
CREATE POLICY objects_perm_trainerdocs_del ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING ((bucket_id NOT IN ('trainer-documents') OR (SELECT public.has_permission(public.get_user_tenant_id(), 'trainers.manage'))));

-- --------------------------------------------------------------------------
-- Functions that read or write financial / member data as the table owner
-- (they bypass RLS), so they check the permission themselves
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
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'employee') OR NOT public.has_permission(v_tenant_id, 'pos.use') THEN
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
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'employee') OR NOT public.has_permission(v_tenant_id, 'pos.use') THEN
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
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'employee') OR NOT public.has_permission(v_tenant_id, 'pos.manage') THEN
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

CREATE OR REPLACE FUNCTION public.attendance_scan(
  p_credential_type text,
  p_credential text,
  p_direction text DEFAULT 'auto',
  p_branch_id uuid DEFAULT NULL,
  p_external_event_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'employee') OR NOT public.has_permission(v_tenant, 'attendance.manage') THEN
    RAISE EXCEPTION 'Check-in requires employee access' USING ERRCODE = '42501';
  END IF;
  IF p_branch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.branches AS b WHERE b.id = p_branch_id AND b.tenant_id = v_tenant
  ) THEN
    RAISE EXCEPTION 'Branch does not belong to this organization' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_tenant_entitled(v_tenant) THEN
    RAISE EXCEPTION 'The subscription is not active' USING ERRCODE = '42501';
  END IF;

  RETURN public.attendance_process_scan(
    v_tenant, p_branch_id, NULL, NULL, p_credential_type, p_credential,
    p_direction, p_external_event_id, NULL, 'web'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.attendance_issue_credential(
  p_member_id uuid,
  p_type text,
  p_value text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
  v_token text;
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'employee') OR NOT public.has_permission(v_tenant, 'attendance.manage') THEN
    RAISE EXCEPTION 'Managing credentials requires employee access' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.members AS m WHERE m.id = p_member_id AND m.tenant_id = v_tenant) THEN
    RAISE EXCEPTION 'Member does not belong to this organization' USING ERRCODE = '42501';
  END IF;

  IF p_type = 'qr' THEN
    UPDATE public.attendance_member_identities
       SET status = 'revoked'
     WHERE tenant_id = v_tenant AND member_id = p_member_id
       AND identity_type = 'qr_token_hash' AND status = 'active';
    v_token := 'MTDRB-' || upper(encode(extensions.gen_random_bytes(10), 'hex'));
    INSERT INTO public.attendance_member_identities (tenant_id, member_id, identity_type, external_identifier)
    VALUES (v_tenant, p_member_id, 'qr_token_hash', public.attendance_credential_hash(v_token));
    RETURN v_token;
  ELSIF p_type IN ('badge', 'vendor_user_id') THEN
    IF p_value IS NULL OR btrim(p_value) = '' OR length(p_value) > 200 THEN
      RAISE EXCEPTION 'A card number or user id is required' USING ERRCODE = '22023';
    END IF;
    BEGIN
      INSERT INTO public.attendance_member_identities (tenant_id, member_id, identity_type, external_identifier)
      VALUES (
        v_tenant, p_member_id,
        CASE p_type WHEN 'badge' THEN 'badge_uid_hash' ELSE 'vendor_user_id' END,
        CASE p_type WHEN 'badge' THEN public.attendance_credential_hash(p_value) ELSE btrim(p_value) END
      );
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'That card or user id is already assigned to a member' USING ERRCODE = '23505';
    END;
    RETURN NULL;
  END IF;

  RAISE EXCEPTION 'Unsupported credential type' USING ERRCODE = '22023';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_financial_metrics(p_period text DEFAULT 'month')
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.get_user_tenant_id();
  v_start_date date;
BEGIN
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'employee') OR NOT public.has_permission(v_tenant_id, 'billing.view') THEN
    RAISE EXCEPTION 'Tenant access denied';
  END IF;

  v_start_date := CASE p_period
    WHEN 'week' THEN current_date - interval '7 days'
    WHEN 'month' THEN current_date - interval '30 days'
    WHEN 'quarter' THEN current_date - interval '90 days'
    WHEN 'year' THEN current_date - interval '365 days'
    ELSE current_date - interval '30 days'
  END;

  RETURN (
    SELECT json_build_object(
      'total_revenue', coalesce((SELECT sum(amount) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('paid', 'Paid') AND created_at >= v_start_date), 0),
      'total_expenses', coalesce((SELECT sum(amount) FROM public.expenses WHERE tenant_id = v_tenant_id AND status = 'approved' AND date >= v_start_date), 0),
      'pending_payments', coalesce((SELECT sum(amount) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('pending', 'Unpaid', 'Partial')), 0),
      'vat_collected', coalesce((SELECT sum(vat_total) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('paid', 'Paid') AND created_at >= v_start_date), 0),
      'vat_paid', coalesce((SELECT sum(vat_amount) FROM public.expenses WHERE tenant_id = v_tenant_id AND status = 'approved' AND date >= v_start_date), 0)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_vat_compliance_score(p_tenant_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_score numeric := 100;
  v_overdue_returns integer;
  v_missing_receipts integer;
BEGIN
  IF p_tenant_id IS NULL OR NOT public.has_tenant_role(p_tenant_id, 'employee') OR NOT public.has_permission(p_tenant_id, 'billing.view') THEN
    RAISE EXCEPTION 'Tenant access denied';
  END IF;

  SELECT count(*) INTO v_overdue_returns
  FROM public.vat_returns
  WHERE tenant_id = p_tenant_id
    AND status = 'draft'
    AND filing_deadline < current_date;

  SELECT count(*) INTO v_missing_receipts
  FROM public.expenses
  WHERE tenant_id = p_tenant_id
    AND receipt_url IS NULL
    AND amount > 100;

  v_score := greatest(0, v_score - (v_overdue_returns * 10) - (v_missing_receipts * 2));
  RETURN v_score;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_vat_return(
  p_tenant_id uuid,
  p_period_start date,
  p_period_end date
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_vat_collected numeric;
  v_vat_paid numeric;
BEGIN
  IF p_tenant_id IS NULL
     OR p_period_start IS NULL
     OR p_period_end IS NULL
     OR p_period_end < p_period_start
     OR NOT public.has_tenant_role(p_tenant_id, 'employee') OR NOT public.has_permission(p_tenant_id, 'billing.view') THEN
    RAISE EXCEPTION 'Invalid VAT request or tenant access denied';
  END IF;

  SELECT coalesce(sum(vat_total), 0) INTO v_vat_collected
  FROM public.invoices
  WHERE tenant_id = p_tenant_id
    AND status IN ('paid', 'Paid')
    AND created_at::date BETWEEN p_period_start AND p_period_end;

  SELECT coalesce(sum(vat_amount), 0) INTO v_vat_paid
  FROM public.expenses
  WHERE tenant_id = p_tenant_id
    AND status = 'approved'
    AND date BETWEEN p_period_start AND p_period_end;

  RETURN json_build_object(
    'period_start', p_period_start,
    'period_end', p_period_end,
    'vat_collected', v_vat_collected,
    'vat_paid', v_vat_paid,
    'net_vat_payable', v_vat_collected - v_vat_paid,
    'status', 'draft'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_overview()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid := public.get_user_tenant_id();
BEGIN
  IF v_tenant_id IS NULL OR NOT public.has_tenant_role(v_tenant_id, 'trainer') THEN
    RAISE EXCEPTION 'Tenant access denied';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_members', (SELECT count(*) FROM public.members WHERE tenant_id = v_tenant_id),
      'active_members', (SELECT count(*) FROM public.members WHERE tenant_id = v_tenant_id AND status = 'active'),
      'total_classes', (SELECT count(*) FROM public.classes WHERE tenant_id = v_tenant_id),
      'total_trainers', (SELECT count(*) FROM public.trainers WHERE tenant_id = v_tenant_id AND status = 'active'),
      'total_revenue', CASE WHEN public.has_permission(v_tenant_id, 'billing.view') THEN coalesce((SELECT sum(amount) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('paid', 'Paid')), 0) ELSE 0 END,
      'pending_invoices', CASE WHEN public.has_permission(v_tenant_id, 'billing.view') THEN (SELECT count(*) FROM public.invoices WHERE tenant_id = v_tenant_id AND status IN ('pending', 'Unpaid', 'Partial')) ELSE 0 END
    )
  );
END;
$$;

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
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'employee')
     OR NOT public.has_permission(v_tenant, 'members.manage') THEN
    RAISE EXCEPTION 'Changing a membership requires employee access' USING ERRCODE = '42501';
  END IF;
  IF p_invoice AND NOT public.has_permission(v_tenant, 'billing.manage') THEN
    RAISE EXCEPTION 'Recording a payment requires billing access' USING ERRCODE = '42501';
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

-- --------------------------------------------------------------------------
-- Managing roles and staff (gym admins only)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_role_save(
  p_id uuid,
  p_name text,
  p_base_role text,
  p_permissions text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
  v_row public.tenant_roles;
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'admin') THEN
    RAISE EXCEPTION 'Managing roles requires admin access' USING ERRCODE = '42501';
  END IF;
  IF p_base_role IS NULL OR p_base_role NOT IN ('employee', 'trainer') THEN
    RAISE EXCEPTION 'A custom role is built on the employee or trainer level' USING ERRCODE = '22023';
  END IF;

  BEGIN
    IF p_id IS NULL THEN
      INSERT INTO public.tenant_roles (tenant_id, name, base_role, permissions)
      VALUES (v_tenant, COALESCE(p_name, ''), p_base_role, COALESCE(p_permissions, '{}'))
      RETURNING * INTO v_row;
    ELSE
      UPDATE public.tenant_roles
      SET name = COALESCE(p_name, ''), base_role = p_base_role, permissions = COALESCE(p_permissions, '{}')
      WHERE id = p_id AND tenant_id = v_tenant
      RETURNING * INTO v_row;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Role not found' USING ERRCODE = 'P0002';
      END IF;
    END IF;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'A role with that name already exists' USING ERRCODE = '23505';
  END;

  RETURN jsonb_build_object(
    'id', v_row.id, 'name', v_row.name, 'base_role', v_row.base_role, 'permissions', to_jsonb(v_row.permissions)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_role_delete(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'admin') THEN
    RAISE EXCEPTION 'Managing roles requires admin access' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tenant_roles WHERE id = p_id AND tenant_id = v_tenant) THEN
    RAISE EXCEPTION 'Role not found' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (SELECT 1 FROM public.memberships WHERE custom_role_id = p_id) THEN
    RAISE EXCEPTION 'Move the people on this role to another role first' USING ERRCODE = '55000';
  END IF;
  DELETE FROM public.tenant_roles WHERE id = p_id AND tenant_id = v_tenant;
END;
$$;

CREATE OR REPLACE FUNCTION public.tenant_staff()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'admin') THEN
    RAISE EXCEPTION 'Viewing the team requires admin access' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'user_id', m.user_id,
      'email', u.email,
      'name', NULLIF(btrim(COALESCE(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', '')), ''),
      'role', m.role,
      'custom_role_id', m.custom_role_id,
      'custom_role_name', r.name,
      'joined_at', m.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'pending_invite', (u.last_sign_in_at IS NULL)
    ) ORDER BY (m.role = 'admin') DESC, m.created_at, m.id)
    FROM public.memberships AS m
    JOIN auth.users AS u ON u.id = m.user_id
    LEFT JOIN public.tenant_roles AS r ON r.id = m.custom_role_id
    WHERE m.tenant_id = v_tenant
  ), '[]'::jsonb);
END;
$$;

-- Put someone on a built-in role (p_custom_role_id NULL) or a custom one.
CREATE OR REPLACE FUNCTION public.staff_set_role(
  p_user_id uuid,
  p_role text,
  p_custom_role_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
  v_target public.memberships;
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'admin') THEN
    RAISE EXCEPTION 'Managing the team requires admin access' USING ERRCODE = '42501';
  END IF;
  IF p_user_id = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'You cannot change your own role' USING ERRCODE = '55000';
  END IF;
  SELECT * INTO v_target FROM public.memberships AS m
  WHERE m.user_id = p_user_id AND m.tenant_id = v_tenant FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That person is not on your team' USING ERRCODE = 'P0002';
  END IF;

  IF p_custom_role_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.tenant_roles WHERE id = p_custom_role_id AND tenant_id = v_tenant) THEN
      RAISE EXCEPTION 'Role not found' USING ERRCODE = 'P0002';
    END IF;
    -- the guard trigger sets the tier from the role
    UPDATE public.memberships SET custom_role_id = p_custom_role_id WHERE id = v_target.id;
  ELSE
    IF p_role IS NULL OR p_role NOT IN ('admin', 'employee', 'trainer') THEN
      RAISE EXCEPTION 'Unknown role' USING ERRCODE = '22023';
    END IF;
    UPDATE public.memberships SET custom_role_id = NULL, role = p_role WHERE id = v_target.id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_remove(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
  v_target public.memberships;
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'admin') THEN
    RAISE EXCEPTION 'Managing the team requires admin access' USING ERRCODE = '42501';
  END IF;
  IF p_user_id = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'You cannot remove yourself' USING ERRCODE = '55000';
  END IF;
  SELECT * INTO v_target FROM public.memberships AS m
  WHERE m.user_id = p_user_id AND m.tenant_id = v_tenant FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That person is not on your team' USING ERRCODE = 'P0002';
  END IF;
  DELETE FROM public.memberships WHERE id = v_target.id;
END;
$$;

-- Used by the invite-staff Edge Function with the CALLER's token: proves the
-- caller is a gym admin and tells the function which gym and how big its team is.
CREATE OR REPLACE FUNCTION public.staff_invite_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'admin') THEN
    RAISE EXCEPTION 'Managing the team requires admin access' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'tenant_id', v_tenant,
    'staff_count', (SELECT count(*) FROM public.memberships WHERE tenant_id = v_tenant)
  );
END;
$$;

-- Adds a freshly invited person to a gym. Service role only (the Edge Function
-- has already verified the caller is that gym's admin).
CREATE OR REPLACE FUNCTION public.staff_provision(
  p_tenant_id uuid,
  p_user_id uuid,
  p_role text,
  p_custom_role_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role public.tenant_roles;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Gym not found' USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;
  -- One gym per login: the app opens a person's oldest membership, so a second
  -- one would be unreachable.
  IF EXISTS (SELECT 1 FROM public.memberships WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'That person already belongs to a gym' USING ERRCODE = '55000';
  END IF;
  IF (SELECT count(*) FROM public.memberships WHERE tenant_id = p_tenant_id) >= 50 THEN
    RAISE EXCEPTION 'A gym can have at most 50 staff accounts' USING ERRCODE = '54000';
  END IF;

  IF p_custom_role_id IS NOT NULL THEN
    SELECT * INTO v_role FROM public.tenant_roles WHERE id = p_custom_role_id AND tenant_id = p_tenant_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Role not found' USING ERRCODE = 'P0002';
    END IF;
    INSERT INTO public.memberships (user_id, tenant_id, role, custom_role_id)
    VALUES (p_user_id, p_tenant_id, v_role.base_role, p_custom_role_id);
  ELSE
    IF p_role IS NULL OR p_role NOT IN ('employee', 'trainer') THEN
      RAISE EXCEPTION 'Invited staff start as employee or trainer' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.memberships (user_id, tenant_id, role) VALUES (p_user_id, p_tenant_id, p_role);
  END IF;
  RETURN jsonb_build_object('tenant_id', p_tenant_id, 'user_id', p_user_id);
END;
$$;

-- --------------------------------------------------------------------------
-- Privileges. Supabase's default privileges grant new functions to anon and
-- authenticated directly, so revoke by name, then grant narrowly.
-- --------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.staff_permission_catalog() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tenant_roles_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.memberships_custom_role_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tenant_roles_follow_tier() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_staff_access() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_role_save(uuid, text, text, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_role_delete(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tenant_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_set_role(uuid, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_remove(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_invite_context() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_provision(uuid, uuid, text, uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.staff_permission_catalog() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_staff_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_role_save(uuid, text, text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_role_delete(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_set_role(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_remove(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_invite_context() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_provision(uuid, uuid, text, uuid) TO service_role;

COMMIT;
