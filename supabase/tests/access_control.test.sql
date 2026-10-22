-- Tests for 20261024150000_access_control.sql.
-- ============================================================================
-- Same setup as the other files here: a database with
-- supabase/tests/support/supabase_shim.sql, supabase/schema.sql and ALL
-- migrations applied, then
--
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/access_control.test.sql
--
-- Everything runs in one transaction that is rolled back. The first failed
-- assertion aborts with "TEST FAILED".

\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA test;
GRANT USAGE ON SCHEMA test TO PUBLIC;
CREATE TABLE test.counter (n integer NOT NULL);
INSERT INTO test.counter VALUES (0);
GRANT ALL ON test.counter TO PUBLIC;

CREATE FUNCTION test.ok(p_cond boolean, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_cond IS NOT TRUE THEN
    RAISE EXCEPTION 'TEST FAILED: %', p_label;
  END IF;
  UPDATE test.counter SET n = n + 1;
END;
$$;

CREATE FUNCTION test.expect_err(p_sql text, p_state text, p_msg text, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION 'TEST FAILED: % (expected error %, got none)', p_label, p_state;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'TEST FAILED:%' THEN
    RAISE;
  END IF;
  IF SQLSTATE <> p_state OR (p_msg IS NOT NULL AND position(p_msg IN SQLERRM) = 0) THEN
    RAISE EXCEPTION 'TEST FAILED: % (expected % "%", got % "%")', p_label, p_state, p_msg, SQLSTATE, SQLERRM;
  END IF;
  UPDATE test.counter SET n = n + 1;
END;
$$;

CREATE FUNCTION test.become(p_user uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', jsonb_build_object(
    'sub', p_user, 'role', 'authenticated', 'aal', 'aal1',
    'email', (SELECT email FROM auth.users WHERE id = p_user)
  )::text, true);
  SET LOCAL ROLE authenticated;
END;
$$;

CREATE FUNCTION test.become_service() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  SET LOCAL ROLE service_role;
END;
$$;

-- --------------------------------------------------------------------------
-- Fixtures
--   T1 "Alpha Gym" (paid, timezone Asia/Bahrain): admin A1, employee E1, members
--      m_ok (active, expires next year), m_exp (expired), m_susp (suspended),
--      m_inact (inactive), m_trial (trial), m_edge (expires on yesterday's UTC date)
--   T2 "Bravo Gym" (paid): admin B1, member b_ok - must never be reachable from T1
--   T3 "Unpaid Gym": employee U1 (no subscription)
-- --------------------------------------------------------------------------
INSERT INTO auth.users (id, email, last_sign_in_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'a1@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'e1@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000b1', 'b1@test.dev', now()),
  ('00000000-0000-0000-0000-0000000000c1', 'u1@test.dev', now());

INSERT INTO public.tenants (id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Alpha Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Bravo Gym'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Unpaid Gym');
INSERT INTO public.memberships (user_id, tenant_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'aaaaaaaa-0000-0000-0000-000000000001', 'employee'),
  ('00000000-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-000000000002', 'admin'),
  ('00000000-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-000000000003', 'employee');

INSERT INTO public.gym_settings (tenant_id, metadata) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '{"general":{"timezone":"Asia/Bahrain"}}');

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
INSERT INTO public.platform_subscriptions (tenant_id, status, plan_tier, amount, currency, payment_provider, payment_reference, current_period_end) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'active', 'starter', 49, 'USD', 'paddle', 'sub_a', now() + interval '20 days'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'active', 'starter', 49, 'USD', 'paddle', 'sub_b', now() + interval '20 days');
RESET ROLE;

INSERT INTO public.members (id, tenant_id, first_name, last_name, email, membership_type, join_date, status, membership_status, expiry_date) VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Ok',     'Member', 'ok@a.dev',     'basic', current_date, 'active', 'active',    current_date + 365),
  ('11111111-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Exp',    'Member', 'exp@a.dev',    'basic', current_date, 'active', 'expired',   current_date - 30),
  ('11111111-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Susp',   'Member', 'susp@a.dev',   'basic', current_date, 'suspended', 'active', current_date + 365),
  ('11111111-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'Inact',  'Member', 'inact@a.dev',  'basic', current_date, 'inactive', 'inactive', NULL),
  ('11111111-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', 'Trial',  'Member', 'trial@a.dev',  'basic', current_date, 'active', 'trial',     NULL),
  ('11111111-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', 'Edge',   'Member', 'edge@a.dev',   'basic', current_date, 'active', 'active',    ((now() AT TIME ZONE 'UTC')::date - 1)),
  ('22222222-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Bravo',  'Member', 'ok@b.dev',     'basic', current_date, 'active', 'active',    current_date + 365);

INSERT INTO public.attendance_devices (id, tenant_id, name, device_type, direction) VALUES
  ('d1d1d1d1-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Entry turnstile', 'terminal', 'check_in'),
  ('d1d1d1d1-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Exit turnstile',  'terminal', 'check_out'),
  ('d1d1d1d1-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Front desk reader', 'qr', 'auto'),
  ('d1d1d1d1-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'Spare reader', 'nfc', 'auto'),
  ('d2d2d2d2-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'Bravo reader', 'nfc', 'auto');

-- Credentials, loaded the way staff would: as a signed-in employee.
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
CREATE TEMP TABLE tok AS
  SELECT public.attendance_issue_credential('11111111-0000-0000-0000-000000000001', 'qr') AS ok,
         public.attendance_issue_credential('11111111-0000-0000-0000-000000000002', 'qr') AS exp,
         public.attendance_issue_credential('11111111-0000-0000-0000-000000000003', 'qr') AS susp,
         public.attendance_issue_credential('11111111-0000-0000-0000-000000000004', 'qr') AS inact,
         public.attendance_issue_credential('11111111-0000-0000-0000-000000000005', 'qr') AS trial,
         public.attendance_issue_credential('11111111-0000-0000-0000-000000000006', 'qr') AS edge;
SELECT public.attendance_issue_credential('11111111-0000-0000-0000-000000000001', 'badge', ' 04a1b2c3 ');
SELECT public.attendance_issue_credential('11111111-0000-0000-0000-000000000001', 'vendor_user_id', '1007');
RESET ROLE;
GRANT SELECT ON tok TO PUBLIC;

-- Device keys, created as the admin.
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
CREATE TEMP TABLE keys AS
  SELECT public.attendance_create_device_key('d1d1d1d1-0000-0000-0000-000000000001') AS entry,
         public.attendance_create_device_key('d1d1d1d1-0000-0000-0000-000000000002') AS exit,
         public.attendance_create_device_key('d1d1d1d1-0000-0000-0000-000000000003') AS desk,
         public.attendance_create_device_key('d1d1d1d1-0000-0000-0000-000000000004') AS spare;
RESET ROLE;
GRANT SELECT ON keys TO PUBLIC;

CREATE FUNCTION test.hash(p text) RETURNS text LANGUAGE sql AS $$ SELECT encode(extensions.digest(p, 'sha256'), 'hex') $$;
CREATE FUNCTION test.scan(p_key text, p_type text, p_cred text, p_dir text DEFAULT NULL, p_id text DEFAULT NULL, p_at timestamptz DEFAULT NULL) RETURNS jsonb
LANGUAGE sql AS $$ SELECT public.attendance_device_scan(test.hash(p_key), p_type, p_cred, p_dir, p_id, p_at) $$;

-- --------------------------------------------------------------------------
-- 1. Privileges
-- --------------------------------------------------------------------------
SELECT test.ok(NOT has_function_privilege('anon', 'public.attendance_device_scan(text, text, text, text, text, timestamptz)', 'EXECUTE'), 'anon cannot post device scans');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.attendance_device_scan(text, text, text, text, text, timestamptz)', 'EXECUTE'), 'a signed-in browser cannot pretend to be a device');
SELECT test.ok(has_function_privilege('service_role', 'public.attendance_device_scan(text, text, text, text, text, timestamptz)', 'EXECUTE'), 'the ingest function (service role) can');
SELECT test.ok(NOT has_function_privilege('authenticated', 'public.attendance_process_scan(uuid, uuid, uuid, uuid, text, text, text, text, timestamptz, text)', 'EXECUTE'), 'the core scan function is internal');
SELECT test.ok(NOT has_function_privilege('anon', 'public.attendance_scan(text, text, text, uuid, text)', 'EXECUTE'), 'anon cannot use the kiosk scan');
SELECT test.ok(NOT has_table_privilege('authenticated', 'public.attendance_device_keys', 'SELECT'), 'nobody can read the key table');
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT test.expect_err($q$SELECT * FROM public.attendance_device_keys$q$, '42501', NULL, 'not even the gym''s admin');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 2. Device keys
-- --------------------------------------------------------------------------
SELECT test.ok((SELECT entry ~ '^mtdrb_dev_[0-9a-f]{48}$' FROM keys), 'a key looks like mtdrb_dev_ + 48 hex');
SELECT test.ok((SELECT count(DISTINCT k) = 4 FROM keys, LATERAL unnest(ARRAY[entry, exit, desk, spare]) AS k), 'every device gets its own key');
SELECT test.ok(EXISTS (SELECT 1 FROM public.attendance_device_keys WHERE device_id = 'd1d1d1d1-0000-0000-0000-000000000001' AND key_hash = test.hash((SELECT entry FROM keys))), 'only the SHA-256 hash is stored');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.attendance_device_keys WHERE key_hash = (SELECT entry FROM keys)), 'never the key itself');
SELECT test.ok((SELECT key_hint FROM public.attendance_devices WHERE id = 'd1d1d1d1-0000-0000-0000-000000000001') = (SELECT left(entry, 14) FROM keys), 'the device shows a short hint of its key');

SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.expect_err($q$SELECT public.attendance_create_device_key('d1d1d1d1-0000-0000-0000-000000000001')$q$, '42501', 'Only an admin', 'an employee cannot create device keys');
SELECT test.expect_err($q$SELECT public.attendance_revoke_device_key('d1d1d1d1-0000-0000-0000-000000000001')$q$, '42501', 'Only an admin', 'nor revoke them');
RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000b1');
SELECT test.expect_err($q$SELECT public.attendance_create_device_key('d1d1d1d1-0000-0000-0000-000000000001')$q$, 'P0002', 'not found', 'another gym''s admin cannot make a key for this device');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 3. Credentials
-- --------------------------------------------------------------------------
SELECT test.ok((SELECT ok ~ '^MTDRB-[0-9A-F]{20}$' FROM tok), 'a QR token looks like MTDRB- + 20 hex');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.attendance_member_identities WHERE external_identifier IN ((SELECT ok FROM tok), '04A1B2C3', ' 04a1b2c3 ')), 'QR tokens and card UIDs are stored hashed, never in the clear');
SELECT test.ok(EXISTS (SELECT 1 FROM public.attendance_member_identities WHERE identity_type = 'badge_uid_hash' AND external_identifier = public.attendance_credential_hash('04A1B2C3')), 'a card matches however it is typed');

SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.expect_err($q$SELECT public.attendance_issue_credential('22222222-0000-0000-0000-000000000001', 'qr')$q$, '42501', 'does not belong', 'staff cannot issue a credential for another gym''s member');
SELECT test.expect_err($q$SELECT public.attendance_issue_credential('11111111-0000-0000-0000-000000000002', 'badge', '04a1b2c3')$q$, '23505', 'already assigned', 'a card already in use cannot be given to a second member');
SELECT test.expect_err($q$SELECT public.attendance_issue_credential('11111111-0000-0000-0000-000000000002', 'badge', '   ')$q$, '22023', NULL, 'a blank card number is refused');
SELECT test.expect_err($q$SELECT public.attendance_issue_credential('11111111-0000-0000-0000-000000000002', 'fingerprint', 'x')$q$, '22023', 'Unsupported', 'an unknown credential type is refused');
RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000c1');
SELECT test.expect_err($q$SELECT public.attendance_issue_credential('11111111-0000-0000-0000-000000000001', 'qr')$q$, '42501', NULL, 'an outsider cannot issue credentials');
RESET ROLE;

-- --------------------------------------------------------------------------
-- 4. A scan at an entry reader and an exit reader
-- --------------------------------------------------------------------------
SELECT test.expect_err(format($q$SELECT test.scan('mtdrb_dev_nope', 'qr', %L)$q$, (SELECT ok FROM tok)), '28000', 'Invalid device key', 'a wrong device key is refused');

CREATE TEMP TABLE s1 AS SELECT test.scan((SELECT entry FROM keys), 'qr', (SELECT ok FROM tok), NULL, 'evt-1') AS r;
SELECT test.ok((SELECT (r ->> 'allowed')::boolean AND r ->> 'reason' = 'ok' AND r ->> 'direction' = 'check_in' AND r -> 'member' ->> 'name' = 'Ok Member' FROM s1), 'an active member is let in at the entry reader, and named');
SELECT test.ok(EXISTS (SELECT 1 FROM public.attendance_events WHERE external_event_id = 'evt-1' AND status = 'accepted' AND direction = 'check_in' AND method = 'qr' AND source_type = 'device' AND device_id = 'd1d1d1d1-0000-0000-0000-000000000001'), 'the event is recorded against the reader');
SELECT test.ok((SELECT last_seen_at IS NOT NULL FROM public.attendance_devices WHERE id = 'd1d1d1d1-0000-0000-0000-000000000001'), 'and the reader is marked as seen');

CREATE TEMP TABLE s2 AS SELECT test.scan((SELECT exit FROM keys), 'qr', (SELECT ok FROM tok), NULL, 'evt-2') AS r;
SELECT test.ok((SELECT r ->> 'direction' = 'check_out' AND (r ->> 'allowed')::boolean FROM s2), 'the exit reader always checks out');
-- A fixed-direction reader cannot be overridden by what the caller claims.
CREATE TEMP TABLE s3 AS SELECT test.scan((SELECT entry FROM keys), 'qr', lower((SELECT ok FROM tok)), 'check_out', 'evt-3', now() + interval '10 seconds') AS r;
SELECT test.ok((SELECT r ->> 'direction' = 'check_in' FROM s3), 'an entry reader ignores a "check_out" in the request, and a QR code matches in any case');

-- A card and a fingerprint terminal's own user id reach the same member.
SELECT test.ok((SELECT r -> 'member' ->> 'name' = 'Ok Member' FROM (SELECT test.scan((SELECT entry FROM keys), 'badge', '04A1B2C3', NULL, 'evt-card', now() + interval '1 minute') AS r) x), 'a card UID resolves to the member');
SELECT test.ok((SELECT r -> 'member' ->> 'name' = 'Ok Member' FROM (SELECT test.scan((SELECT entry FROM keys), 'vendor_user_id', '1007', NULL, 'evt-vendor', now() + interval '2 minutes') AS r) x), 'so does the id a fingerprint/face terminal reports');

-- --------------------------------------------------------------------------
-- 5. Auto readers alternate
-- --------------------------------------------------------------------------
CREATE TEMP TABLE a1 AS SELECT test.scan((SELECT desk FROM keys), 'qr', (SELECT trial FROM tok), NULL, 'auto-1', now() - interval '3 hours') AS r;
CREATE TEMP TABLE a2 AS SELECT test.scan((SELECT desk FROM keys), 'qr', (SELECT trial FROM tok), NULL, 'auto-2', now() - interval '2 hours') AS r;
CREATE TEMP TABLE a3 AS SELECT test.scan((SELECT desk FROM keys), 'qr', (SELECT trial FROM tok), NULL, 'auto-3', now() - interval '1 hour') AS r;
SELECT test.ok((SELECT (a1.r ->> 'direction') || ',' || (a2.r ->> 'direction') || ',' || (a3.r ->> 'direction') = 'check_in,check_out,check_in' FROM a1, a2, a3), 'an auto reader alternates in, out, in; a trial member is allowed');

-- --------------------------------------------------------------------------
-- 6. Who is refused, and why
-- --------------------------------------------------------------------------
SELECT test.ok((SELECT r ->> 'reason' = 'expired' AND NOT (r ->> 'allowed')::boolean FROM (SELECT test.scan((SELECT spare FROM keys), 'qr', (SELECT exp FROM tok), NULL, 'deny-exp') AS r) x), 'an expired member is refused: expired');
SELECT test.ok((SELECT r ->> 'reason' = 'suspended' AND NOT (r ->> 'allowed')::boolean FROM (SELECT test.scan((SELECT spare FROM keys), 'qr', (SELECT susp FROM tok), NULL, 'deny-susp') AS r) x), 'a suspended member is refused: suspended');
SELECT test.ok((SELECT r ->> 'reason' = 'inactive' AND NOT (r ->> 'allowed')::boolean FROM (SELECT test.scan((SELECT spare FROM keys), 'qr', (SELECT inact FROM tok), NULL, 'deny-inact') AS r) x), 'an inactive member is refused: inactive');
SELECT test.ok((SELECT status = 'rejected' AND metadata ->> 'reason' = 'expired' FROM public.attendance_events WHERE external_event_id = 'deny-exp'), 'a refusal is recorded as a rejected event with its reason');
SELECT test.ok((SELECT count(*) FROM public.attendance_events WHERE status = 'accepted' AND member_id IN ('11111111-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004')) = 0, 'a refused member never counts as present');

CREATE TEMP TABLE u1 AS SELECT test.scan((SELECT spare FROM keys), 'qr', 'MTDRB-DOESNOTEXIST', NULL, 'unknown-1') AS r;
SELECT test.ok((SELECT NOT (r ->> 'allowed')::boolean AND r ->> 'reason' = 'unknown_credential' FROM u1), 'an unknown card or QR is refused: unknown_credential');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.attendance_events WHERE external_event_id = 'unknown-1'), 'and nothing is recorded for it');

-- Another gym's member cannot get in through this gym's reader, even with a valid token.
SELECT test.become('00000000-0000-0000-0000-0000000000b1');
CREATE TEMP TABLE btok AS SELECT public.attendance_issue_credential('22222222-0000-0000-0000-000000000001', 'qr') AS t;
RESET ROLE;
GRANT SELECT ON btok TO PUBLIC;
SELECT test.ok((SELECT r ->> 'reason' = 'unknown_credential' FROM (SELECT test.scan((SELECT entry FROM keys), 'qr', (SELECT t FROM btok), NULL, 'cross-1') AS r) x), 'another gym''s QR token means nothing to this gym''s reader');

-- Membership expiry is read in the gym's timezone (Asia/Bahrain, UTC+3). m_edge's
-- last valid day is yesterday's UTC date, D. 22:00 UTC on D is already 01:00 on D+1
-- in Bahrain, so the member is out there although the UTC date is still D; at
-- 12:00 UTC on D (15:00 in Bahrain) they are still in.
SELECT test.ok((SELECT NOT (r ->> 'allowed')::boolean AND r ->> 'reason' = 'expired' FROM (SELECT test.scan((SELECT spare FROM keys), 'qr', (SELECT edge FROM tok), NULL, 'tz-late', (date_trunc('day', now() AT TIME ZONE 'UTC') - interval '2 hours') AT TIME ZONE 'UTC') AS r) x), 'after local midnight the gym''s own date applies: expired on the day after the last valid day');
SELECT test.ok((SELECT (r ->> 'allowed')::boolean FROM (SELECT test.scan((SELECT spare FROM keys), 'qr', (SELECT edge FROM tok), NULL, 'tz-early', (date_trunc('day', now() AT TIME ZONE 'UTC') - interval '12 hours') AT TIME ZONE 'UTC') AS r) x), 'earlier the same UTC day, the last valid day, they are let in');

-- --------------------------------------------------------------------------
-- 7. Retries, double taps and bad timestamps
-- --------------------------------------------------------------------------
CREATE TEMP TABLE retry AS SELECT test.scan((SELECT entry FROM keys), 'qr', (SELECT ok FROM tok), NULL, 'evt-1') AS r;
SELECT test.ok((SELECT (r ->> 'duplicate')::boolean AND (r ->> 'allowed')::boolean AND r ->> 'event_id' = (SELECT s1.r ->> 'event_id' FROM s1) FROM retry), 'the same event id again returns the first answer');
SELECT test.ok((SELECT count(*) FROM public.attendance_events WHERE external_event_id = 'evt-1') = 1, 'and writes nothing');

CREATE TEMP TABLE tap1 AS SELECT test.scan((SELECT entry FROM keys), 'qr', (SELECT ok FROM tok), NULL, 'tap-1', now() - interval '90 minutes') AS r;
CREATE TEMP TABLE tap2 AS SELECT test.scan((SELECT entry FROM keys), 'qr', (SELECT ok FROM tok), NULL, 'tap-2', now() - interval '90 minutes' + interval '2 seconds') AS r;
SELECT test.ok((SELECT NOT (tap1.r ->> 'duplicate')::boolean AND (tap2.r ->> 'duplicate')::boolean AND (tap2.r ->> 'allowed')::boolean FROM tap1, tap2), 'a second tap within 5 seconds at the same reader is a duplicate (still allowed, so the door does not flap)');
SELECT test.ok((SELECT status FROM public.attendance_events WHERE external_event_id = 'tap-2') = 'duplicate', 'and is stored as duplicate');

SELECT test.expect_err(format($q$SELECT test.scan(%L, 'qr', %L, NULL, 'future', now() + interval '1 day')$q$, (SELECT entry FROM keys), (SELECT ok FROM tok)), '22023', 'not in the future', 'an event from the future is refused');
SELECT test.expect_err(format($q$SELECT test.scan(%L, 'qr', %L, NULL, 'ancient', now() - interval '40 days')$q$, (SELECT entry FROM keys), (SELECT ok FROM tok)), '22023', 'last 30 days', 'one older than 30 days is refused');
SELECT test.expect_err(format($q$SELECT test.scan(%L, 'rfid', 'x')$q$, (SELECT entry FROM keys)), '22023', 'Unsupported credential', 'an unknown credential type is refused');
SELECT test.expect_err(format($q$SELECT test.scan(%L, 'qr', %L)$q$, (SELECT entry FROM keys), repeat('x', 201)), '22023', NULL, 'an oversized credential is refused');

-- --------------------------------------------------------------------------
-- 8. Pausing and revoking
-- --------------------------------------------------------------------------
UPDATE public.attendance_devices SET status = 'paused' WHERE id = 'd1d1d1d1-0000-0000-0000-000000000004';
SELECT test.expect_err(format($q$SELECT test.scan(%L, 'qr', %L)$q$, (SELECT spare FROM keys), (SELECT ok FROM tok)), '55000', 'not active', 'a paused device is refused');
UPDATE public.attendance_devices SET status = 'active' WHERE id = 'd1d1d1d1-0000-0000-0000-000000000004';

SELECT test.become('00000000-0000-0000-0000-0000000000a1');
SELECT public.attendance_revoke_device_key('d1d1d1d1-0000-0000-0000-000000000004');
RESET ROLE;
SELECT test.expect_err(format($q$SELECT test.scan(%L, 'qr', %L)$q$, (SELECT spare FROM keys), (SELECT ok FROM tok)), '28000', 'Invalid device key', 'a revoked key stops working at once');
SELECT test.ok((SELECT key_hint IS NULL FROM public.attendance_devices WHERE id = 'd1d1d1d1-0000-0000-0000-000000000004'), 'and the hint is cleared');

-- Rotating replaces the old key.
SELECT test.become('00000000-0000-0000-0000-0000000000a1');
CREATE TEMP TABLE rot AS SELECT public.attendance_create_device_key('d1d1d1d1-0000-0000-0000-000000000003') AS k;
RESET ROLE;
GRANT SELECT ON rot TO PUBLIC;
SELECT test.expect_err(format($q$SELECT test.scan(%L, 'qr', %L)$q$, (SELECT desk FROM keys), (SELECT ok FROM tok)), '28000', 'Invalid device key', 'after a rotation the old key is dead');
SELECT test.ok((SELECT (r ->> 'allowed')::boolean FROM (SELECT test.scan((SELECT k FROM rot), 'qr', (SELECT ok FROM tok), NULL, 'after-rotate') AS r) x), 'and the new one works');

-- Re-issuing a member's QR token revokes the old one.
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
CREATE TEMP TABLE newtok AS SELECT public.attendance_issue_credential('11111111-0000-0000-0000-000000000001', 'qr') AS t;
RESET ROLE;
GRANT SELECT ON newtok TO PUBLIC;
SELECT test.ok((SELECT r ->> 'reason' = 'unknown_credential' FROM (SELECT test.scan((SELECT k FROM rot), 'qr', (SELECT ok FROM tok), NULL, 'old-token') AS r) x), 'an old QR token stops working when a new one is issued');
SELECT test.ok((SELECT (r ->> 'allowed')::boolean FROM (SELECT test.scan((SELECT k FROM rot), 'qr', (SELECT t FROM newtok), NULL, 'new-token', now() + interval '4 minutes') AS r) x), 'and the new one works');

-- --------------------------------------------------------------------------
-- 9. The staff kiosk (signed in, no device key)
-- --------------------------------------------------------------------------
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
CREATE TEMP TABLE k1 AS SELECT public.attendance_scan('qr', (SELECT t FROM newtok), 'check_in', NULL, 'kiosk-1') AS r;
RESET ROLE;
SELECT test.ok((SELECT (r ->> 'allowed')::boolean AND r ->> 'direction' = 'check_in' FROM k1), 'the kiosk lets an active member in');
SELECT test.ok((SELECT source_type = 'web' AND device_id IS NULL FROM public.attendance_events WHERE external_event_id = 'kiosk-1'), 'recorded as a web event, with no device');
SELECT test.become('00000000-0000-0000-0000-0000000000a2');
SELECT test.expect_err($q$SELECT public.attendance_scan('qr', 'x', 'check_in', '99999999-0000-0000-0000-000000000009')$q$, '42501', 'Branch', 'a branch from another gym is refused');
SELECT test.expect_err($q$SELECT public.attendance_scan('qr', 'x', 'sideways')$q$, '22023', 'direction', 'a made-up direction is refused');
RESET ROLE;
SELECT test.become('00000000-0000-0000-0000-0000000000c1');
SELECT test.expect_err($q$SELECT public.attendance_scan('qr', 'x')$q$, '42501', 'subscription', 'a gym without a subscription cannot use the kiosk');
RESET ROLE;

SELECT 'ALL PASSED: ' || n || ' checks' AS result FROM test.counter;
ROLLBACK;
