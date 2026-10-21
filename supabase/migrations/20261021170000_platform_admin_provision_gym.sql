-- Platform-owner: provision a gym for an invited admin.
-- ============================================================================
-- Used by the platform-invite-gym Edge Function (supabase/functions/
-- platform-invite-gym). The Edge Function does the one thing SQL cannot -
-- send the Supabase Auth invitation email, which creates the (unconfirmed)
-- account - and then calls this RPC with the CALLER'S OWN JWT. So the real
-- authorisation stays here, in Postgres, exactly like every other platform_*
-- RPC: require_platform_admin() (allowlist + aal2 + verified factor + live
-- session), the audit row uses the caller's identity, and nothing here is
-- reachable with the service-role key alone.
--
-- What it does, atomically (any failure rolls the whole thing back, and the
-- Edge Function then deletes the invited account again):
--   1. checks the account is a PENDING INVITATION: invited, never signed in,
--      belongs to no gym, is not the caller and not a platform admin - so this
--      RPC can never be pointed at someone's existing account;
--   2. creates the gym (same starting metadata as a normal signup) and makes
--      the invited user its admin;
--   3. grants complimentary access via platform_grant_access() (which writes
--      its own 'grant_access' audit row), then writes a 'create_gym' row.

BEGIN;

ALTER TABLE public.platform_audit_log DROP CONSTRAINT IF EXISTS platform_audit_log_action_check;
ALTER TABLE public.platform_audit_log ADD CONSTRAINT platform_audit_log_action_check
  CHECK (action IN (
    'grant_access', 'revoke_access', 'note',
    'suspend_gym', 'unsuspend_gym', 'delete_gym',
    'ban_user', 'unban_user', 'reset_mfa', 'change_role', 'delete_user',
    'create_gym'
  ));

CREATE OR REPLACE FUNCTION public.platform_provision_gym(
  p_user_id uuid,
  p_gym_name text,
  p_plan_tier text,
  p_until timestamptz,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_name text := btrim(COALESCE(p_gym_name, ''));
  v_email text;
  v_tenant uuid;
BEGIN
  PERFORM public.require_platform_admin();

  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 3 to 500 characters is required' USING ERRCODE = '22023';
  END IF;
  IF length(v_name) < 1 OR length(v_name) > 160 THEN
    RAISE EXCEPTION 'A gym name of 1 to 160 characters is required' USING ERRCODE = '22023';
  END IF;

  -- Not found / the caller / a platform admin.
  v_email := public.platform_assert_manageable_user(p_user_id);

  IF NOT EXISTS (
    SELECT 1 FROM auth.users AS u
    WHERE u.id = p_user_id AND u.invited_at IS NOT NULL AND u.last_sign_in_at IS NULL
  ) THEN
    RAISE EXCEPTION 'This account is not a pending invitation' USING ERRCODE = '55000';
  END IF;

  IF EXISTS (SELECT 1 FROM public.memberships AS m WHERE m.user_id = p_user_id) THEN
    RAISE EXCEPTION 'This user already belongs to a gym' USING ERRCODE = '55000';
  END IF;

  INSERT INTO public.tenants (name, metadata)
  VALUES (v_name, jsonb_build_object('has_plans', false, 'has_trainers', false, 'has_classes', false))
  RETURNING id INTO v_tenant;

  INSERT INTO public.memberships (user_id, tenant_id, role)
  VALUES (p_user_id, v_tenant, 'admin');

  -- Validates the tier and end date, writes the subscription and its own audit row.
  PERFORM public.platform_grant_access(v_tenant, p_plan_tier, p_until, v_reason);

  PERFORM public.platform_write_audit(
    'create_gym', v_tenant, v_name,
    jsonb_build_object(
      'reason', v_reason,
      'admin_email', v_email,
      'plan_tier', p_plan_tier,
      'until', p_until
    )
  );

  RETURN jsonb_build_object('tenant_id', v_tenant, 'user_id', p_user_id, 'admin_email', v_email);
END;
$$;

REVOKE ALL ON FUNCTION public.platform_provision_gym(uuid, text, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_provision_gym(uuid, text, text, timestamptz, text) TO authenticated;

COMMIT;
