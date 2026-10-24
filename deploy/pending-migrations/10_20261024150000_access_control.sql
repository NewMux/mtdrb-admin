-- Door / reader integration, hardware-neutral.
-- ============================================================================
-- The attendance tables (20260817150000) can hold devices, member credentials and
-- check-in events, but nothing let a real reader, turnstile controller or gateway
-- feed them, and a check-in never asked whether the member should be let in.
-- This adds the universal layer; vendor-specific adapters sit on top of it.
--
--   * Devices get a direction (entry reader / exit reader / auto) and a secret API
--     key. Only a hash of the key is stored (attendance_device_keys, which no
--     browser role can read); the plaintext is shown once, when it is created.
--   * A scan is: a credential (card UID, member QR token, or the vendor's own user
--     id) from a device -> the member -> an allow/deny decision -> an event.
--     Card UIDs and QR tokens are stored as SHA-256 hashes, like the identity
--     table already expects. No biometric data ever reaches this database: a
--     fingerprint/face terminal matches on the device and reports only its user id.
--   * The decision (attendance_decide_access) allows a member whose status is
--     active or trial and whose expiry date has not passed in the GYM's timezone.
--   * attendance_device_scan() is for the attendance-ingest Edge Function (service
--     role); attendance_scan() is for a signed-in staff tablet (the kiosk page).
--     Both go through attendance_process_scan(), so a door and the kiosk behave the
--     same. Retries with the same event id are safe.
--   * Staff issue QR tokens / assign cards with attendance_issue_credential().
--
-- Unknown credentials are answered "deny" but not stored (an event needs a member).

BEGIN;

ALTER TABLE public.attendance_devices
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'auto'
    CHECK (direction IN ('check_in', 'check_out', 'auto')),
  ADD COLUMN IF NOT EXISTS key_hint text;

COMMENT ON COLUMN public.attendance_devices.direction IS
  'check_in = an entry reader, check_out = an exit reader, auto = alternate by the member''s last event.';
COMMENT ON COLUMN public.attendance_devices.key_hint IS
  'First characters of the device key, so an admin can tell which key a device uses. Not secret.';

CREATE TABLE IF NOT EXISTS public.attendance_device_keys (
  device_id uuid PRIMARY KEY REFERENCES public.attendance_devices(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No policy and no grants: only SECURITY DEFINER functions touch it.
ALTER TABLE public.attendance_device_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.attendance_device_keys FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------------
-- Helpers
-- --------------------------------------------------------------------------
-- Card UIDs and QR tokens are compared case-insensitively and trimmed.
CREATE OR REPLACE FUNCTION public.attendance_credential_hash(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT encode(extensions.digest(upper(btrim(p_value)), 'sha256'), 'hex');
$$;

-- The gym's own calendar date for an instant (membership expiry is a date, so it
-- must be read in the gym's timezone, not the server's).
CREATE OR REPLACE FUNCTION public.attendance_local_date(p_tenant uuid, p_at timestamptz)
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_tz text;
BEGIN
  SELECT g.metadata -> 'general' ->> 'timezone' INTO v_tz
  FROM public.gym_settings AS g WHERE g.tenant_id = p_tenant;
  IF v_tz IS NULL OR NOT EXISTS (SELECT 1 FROM pg_timezone_names AS z WHERE z.name = v_tz) THEN
    v_tz := 'UTC';
  END IF;
  RETURN (p_at AT TIME ZONE v_tz)::date;
END;
$$;

CREATE OR REPLACE FUNCTION public.attendance_decide_access(
  p_tenant uuid,
  p_member uuid,
  p_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_member public.members;
  v_effective text;
BEGIN
  SELECT * INTO v_member FROM public.members AS m WHERE m.id = p_member AND m.tenant_id = p_tenant;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unknown_member');
  END IF;

  v_effective := lower(coalesce(v_member.membership_status, v_member.status, 'active'));

  IF v_member.status = 'suspended' OR v_effective = 'suspended' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'suspended');
  END IF;
  IF v_effective = 'expired' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'expired');
  END IF;
  IF v_member.status = 'inactive' OR v_effective = 'inactive' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'inactive');
  END IF;
  IF v_effective NOT IN ('active', 'trial') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'not_active');
  END IF;
  IF v_member.expiry_date IS NOT NULL AND v_member.expiry_date < public.attendance_local_date(p_tenant, p_at) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'expired');
  END IF;

  RETURN jsonb_build_object('allowed', true, 'reason', 'ok');
END;
$$;

-- --------------------------------------------------------------------------
-- The scan
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attendance_process_scan(
  p_tenant uuid,
  p_branch uuid,
  p_device uuid,
  p_connector uuid,
  p_credential_type text,
  p_credential text,
  p_direction text,
  p_external_event_id text,
  p_occurred_at timestamptz,
  p_source text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := now();
  v_at timestamptz := coalesce(p_occurred_at, now());
  v_event_id text := coalesce(nullif(btrim(p_external_event_id), ''), 'scan-' || extensions.uuid_generate_v4()::text);
  v_identity_type text;
  v_identifier text;
  v_member_id uuid;
  v_identity_id uuid;
  v_member public.members;
  v_decision jsonb;
  v_direction text;
  v_last public.attendance_events;
  v_status text;
  v_event public.attendance_events;
  v_existing public.attendance_events;
  v_branch uuid := p_branch;
BEGIN
  IF p_credential_type NOT IN ('badge', 'qr', 'vendor_user_id') THEN
    RAISE EXCEPTION 'Unsupported credential type' USING ERRCODE = '22023';
  END IF;
  IF p_credential IS NULL OR btrim(p_credential) = '' OR length(p_credential) > 200 THEN
    RAISE EXCEPTION 'A credential of 1 to 200 characters is required' USING ERRCODE = '22023';
  END IF;
  IF p_direction IS NOT NULL AND p_direction NOT IN ('check_in', 'check_out', 'auto') THEN
    RAISE EXCEPTION 'Unsupported direction' USING ERRCODE = '22023';
  END IF;
  IF length(v_event_id) > 200 THEN
    RAISE EXCEPTION 'The event id is too long' USING ERRCODE = '22023';
  END IF;
  -- A gateway may deliver old logs after being offline, but not from the future.
  IF v_at > v_now + interval '5 minutes' OR v_at < v_now - interval '30 days' THEN
    RAISE EXCEPTION 'occurred_at must be within the last 30 days and not in the future' USING ERRCODE = '22023';
  END IF;

  -- A retry with the same event id gets the same answer and writes nothing.
  SELECT * INTO v_existing FROM public.attendance_events AS e
  WHERE e.tenant_id = p_tenant AND e.external_event_id = v_event_id;
  IF FOUND THEN
    SELECT * INTO v_member FROM public.members AS m WHERE m.id = v_existing.member_id;
    RETURN jsonb_build_object(
      'allowed', v_existing.status IN ('accepted', 'duplicate'),
      'reason', coalesce(v_existing.metadata ->> 'reason', 'ok'),
      'duplicate', true,
      'direction', v_existing.direction,
      'event_id', v_existing.id,
      'member', jsonb_build_object(
        'id', v_member.id,
        'name', btrim(v_member.first_name || ' ' || v_member.last_name),
        'expiry_date', v_member.expiry_date
      )
    );
  END IF;

  IF p_credential_type = 'badge' THEN
    v_identity_type := 'badge_uid_hash';
    v_identifier := public.attendance_credential_hash(p_credential);
  ELSIF p_credential_type = 'qr' THEN
    v_identity_type := 'qr_token_hash';
    v_identifier := public.attendance_credential_hash(p_credential);
  ELSE
    v_identity_type := 'vendor_user_id';
    v_identifier := btrim(p_credential);
  END IF;

  SELECT i.id, i.member_id INTO v_identity_id, v_member_id
  FROM public.attendance_member_identities AS i
  WHERE i.tenant_id = p_tenant
    AND i.status = 'active'
    AND i.identity_type = v_identity_type
    AND i.external_identifier = v_identifier
    AND (i.connector_id IS NULL OR i.connector_id IS NOT DISTINCT FROM p_connector);

  IF p_device IS NOT NULL THEN
    UPDATE public.attendance_devices SET last_seen_at = v_now WHERE id = p_device;
  END IF;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unknown_credential', 'duplicate', false);
  END IF;

  SELECT * INTO v_member FROM public.members AS m WHERE m.id = v_member_id AND m.tenant_id = p_tenant;
  v_decision := public.attendance_decide_access(p_tenant, v_member_id, v_at);

  -- Entry readers always check in, exit readers always check out; otherwise
  -- alternate by what the member last did (within the last 16 hours).
  SELECT * INTO v_last FROM public.attendance_events AS e
  WHERE e.tenant_id = p_tenant AND e.member_id = v_member_id AND e.status = 'accepted'
    AND e.occurred_at <= v_at AND e.occurred_at > v_at - interval '16 hours'
  ORDER BY e.occurred_at DESC LIMIT 1;

  IF p_direction IN ('check_in', 'check_out') THEN
    v_direction := p_direction;
  ELSIF FOUND AND v_last.direction = 'check_in' THEN
    v_direction := 'check_out';
  ELSE
    v_direction := 'check_in';
  END IF;

  IF NOT (v_decision ->> 'allowed')::boolean THEN
    v_status := 'rejected';
  ELSIF FOUND AND v_last.direction = v_direction AND v_last.device_id IS NOT DISTINCT FROM p_device
        AND abs(extract(epoch FROM (v_at - v_last.occurred_at))) < 5 THEN
    -- The same reader seeing the same card twice in a moment (a double tap).
    v_status := 'duplicate';
  ELSE
    v_status := 'accepted';
  END IF;

  IF v_branch IS NULL THEN
    v_branch := v_member.assigned_branch_id;
  END IF;

  BEGIN
    INSERT INTO public.attendance_events (
      tenant_id, branch_id, member_id, connector_id, device_id, external_event_id,
      occurred_at, direction, method, source_type, status, metadata
    )
    VALUES (
      p_tenant, v_branch, v_member_id, p_connector, p_device, v_event_id,
      v_at, v_direction,
      CASE p_credential_type WHEN 'qr' THEN 'qr' WHEN 'badge' THEN 'nfc' ELSE 'vendor_biometric' END,
      p_source, v_status,
      jsonb_build_object('reason', v_decision ->> 'reason')
    )
    RETURNING * INTO v_event;
  EXCEPTION WHEN unique_violation THEN
    -- Two copies of the same event arrived together; answer from the winner.
    SELECT * INTO v_existing FROM public.attendance_events AS e
    WHERE e.tenant_id = p_tenant AND e.external_event_id = v_event_id;
    RETURN jsonb_build_object(
      'allowed', v_existing.status IN ('accepted', 'duplicate'),
      'reason', coalesce(v_existing.metadata ->> 'reason', 'ok'),
      'duplicate', true,
      'direction', v_existing.direction,
      'event_id', v_existing.id,
      'member', jsonb_build_object(
        'id', v_member.id,
        'name', btrim(v_member.first_name || ' ' || v_member.last_name),
        'expiry_date', v_member.expiry_date
      )
    );
  END;

  UPDATE public.attendance_member_identities SET last_used_at = v_now WHERE id = v_identity_id;

  RETURN jsonb_build_object(
    'allowed', (v_decision ->> 'allowed')::boolean,
    'reason', v_decision ->> 'reason',
    'duplicate', v_status = 'duplicate',
    'direction', v_direction,
    'event_id', v_event.id,
    'member', jsonb_build_object(
      'id', v_member.id,
      'name', btrim(v_member.first_name || ' ' || v_member.last_name),
      'expiry_date', v_member.expiry_date
    )
  );
END;
$$;

-- --------------------------------------------------------------------------
-- Entry points
-- --------------------------------------------------------------------------
-- A reader or gateway, authenticated by its device key (called by the
-- attendance-ingest Edge Function with the service role; the function hashes the
-- key it was given and passes the hash).
CREATE OR REPLACE FUNCTION public.attendance_device_scan(
  p_key_hash text,
  p_credential_type text,
  p_credential text,
  p_direction text DEFAULT NULL,
  p_external_event_id text DEFAULT NULL,
  p_occurred_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_device public.attendance_devices;
BEGIN
  SELECT d.* INTO v_device
  FROM public.attendance_device_keys AS k
  JOIN public.attendance_devices AS d ON d.id = k.device_id
  WHERE k.key_hash = p_key_hash;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid device key' USING ERRCODE = '28000';
  END IF;
  IF v_device.status <> 'active' THEN
    RAISE EXCEPTION 'This device is not active' USING ERRCODE = '55000';
  END IF;

  RETURN public.attendance_process_scan(
    v_device.tenant_id,
    v_device.branch_id,
    v_device.id,
    v_device.connector_id,
    p_credential_type,
    p_credential,
    -- A fixed-direction reader decides; an "auto" one may be told or work it out.
    CASE WHEN v_device.direction <> 'auto' THEN v_device.direction ELSE p_direction END,
    p_external_event_id,
    p_occurred_at,
    'device'
  );
END;
$$;

-- A signed-in member of staff (the front-desk tablet / kiosk page).
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
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'employee') THEN
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

-- --------------------------------------------------------------------------
-- Credentials
-- --------------------------------------------------------------------------
-- 'qr': makes a new member QR token (revoking the old one) and returns it ONCE.
-- 'badge': assigns a card by its UID. 'vendor_user_id': links the id a
-- fingerprint/face terminal reports for this person.
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
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'employee') THEN
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

-- --------------------------------------------------------------------------
-- Device keys (admins)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attendance_create_device_key(p_device_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
  v_key text;
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'admin') THEN
    RAISE EXCEPTION 'Only an admin can create device keys' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.attendance_devices AS d
    WHERE d.id = p_device_id AND d.tenant_id = v_tenant AND d.status <> 'revoked'
  ) THEN
    RAISE EXCEPTION 'Device not found' USING ERRCODE = 'P0002';
  END IF;

  v_key := 'mtdrb_dev_' || encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.attendance_device_keys (device_id, tenant_id, key_hash)
  VALUES (p_device_id, v_tenant, encode(extensions.digest(v_key, 'sha256'), 'hex'))
  ON CONFLICT (device_id) DO UPDATE
    SET key_hash = excluded.key_hash, created_at = now();
  UPDATE public.attendance_devices SET key_hint = left(v_key, 14) WHERE id = p_device_id;
  RETURN v_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.attendance_revoke_device_key(p_device_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant uuid := public.get_user_tenant_id();
BEGIN
  IF v_tenant IS NULL OR NOT public.has_tenant_role(v_tenant, 'admin') THEN
    RAISE EXCEPTION 'Only an admin can revoke device keys' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.attendance_device_keys WHERE device_id = p_device_id AND tenant_id = v_tenant;
  UPDATE public.attendance_devices SET key_hint = NULL WHERE id = p_device_id AND tenant_id = v_tenant;
END;
$$;

-- --------------------------------------------------------------------------
-- Privileges. Default privileges grant to anon/authenticated directly, so revoke
-- by name, then grant back only what each caller may use.
-- --------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.attendance_credential_hash(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attendance_local_date(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attendance_decide_access(uuid, uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attendance_process_scan(uuid, uuid, uuid, uuid, text, text, text, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attendance_device_scan(text, text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attendance_scan(text, text, text, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.attendance_issue_credential(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.attendance_create_device_key(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.attendance_revoke_device_key(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.attendance_device_scan(text, text, text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.attendance_scan(text, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attendance_issue_credential(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attendance_create_device_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attendance_revoke_device_key(uuid) TO authenticated;

COMMIT;
