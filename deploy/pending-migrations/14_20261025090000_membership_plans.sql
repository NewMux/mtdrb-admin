-- Membership plans that actually drive memberships.
--
-- The Plans page let an owner define plans (name, price, duration in days) but
-- nothing connected a member to one: no way to pick a plan, no expiry derived
-- from its length, a member count nobody updated. This adds:
--   * members.plan_id            - the plan a member is on (nullable; a plan that
--                                  is deleted just leaves the member without one);
--   * assign_member_plan()       - put a member on a plan, or renew them on it;
--   * plan_member_counts()       - how many current members each plan has,
--                                  replacing the never-updated plans.members_count.
--
-- Dates are in the GYM's calendar (gym_settings.metadata.general.timezone). A
-- plan of N days gives exactly N days of access: start .. start + N - 1 (the
-- expiry date is the last day the member may enter, as in attendance_decide_access).
-- A renewal made before expiry continues from the day after it, so no paid day is
-- lost; one made after a lapse starts today.

BEGIN;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_plan_id ON public.members (tenant_id, plan_id) WHERE plan_id IS NOT NULL;

COMMENT ON COLUMN public.members.plan_id IS
  'The membership plan this member is on (plans.id). Set by assign_member_plan(); membership_type holds the plan name at the time.';

-- A member can only be on a plan of their own gym (RLS lets an employee write
-- plan_id directly, and a foreign key alone would accept another gym's plan).
CREATE OR REPLACE FUNCTION public.members_plan_same_tenant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.plan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.plans AS p WHERE p.id = NEW.plan_id AND p.tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Plan does not belong to this organization' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS members_plan_same_tenant ON public.members;
CREATE TRIGGER members_plan_same_tenant
  BEFORE INSERT OR UPDATE OF plan_id ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.members_plan_same_tenant();

CREATE OR REPLACE FUNCTION public.assign_member_plan(
  p_member_id uuid,
  p_plan_id uuid,
  p_renew boolean DEFAULT false,
  p_start date DEFAULT NULL,
  p_price numeric DEFAULT NULL
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

  v_price := COALESCE(p_price, v_plan.price);
  IF v_price < 0 THEN
    RAISE EXCEPTION 'The price cannot be negative' USING ERRCODE = '22023';
  END IF;
  SELECT g.currency INTO v_currency FROM public.gym_settings AS g WHERE g.tenant_id = v_tenant;
  v_decimals := public.currency_decimals(v_currency);
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

  RETURN jsonb_build_object(
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

-- Members currently on each plan: a plan assigned, status active/trial, and not past its expiry.
CREATE OR REPLACE FUNCTION public.plan_member_counts()
RETURNS TABLE (plan_id uuid, members bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
  v_today date;
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'employee') THEN
    RAISE EXCEPTION 'Plan statistics require employee access' USING ERRCODE = '42501';
  END IF;
  v_today := public.attendance_local_date(v_tenant, now());
  RETURN QUERY
    SELECT m.plan_id, count(*)
    FROM public.members AS m
    WHERE m.tenant_id = v_tenant
      AND m.plan_id IS NOT NULL
      AND m.status IN ('active', 'pending')
      AND COALESCE(m.membership_status, 'active') IN ('active', 'trial')
      AND (m.expiry_date IS NULL OR m.expiry_date >= v_today)
    GROUP BY m.plan_id;
END;
$$;

REVOKE ALL ON FUNCTION public.members_plan_same_tenant() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_member_plan(uuid, uuid, boolean, date, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.plan_member_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_member_plan(uuid, uuid, boolean, date, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.plan_member_counts() TO authenticated;

COMMIT;
