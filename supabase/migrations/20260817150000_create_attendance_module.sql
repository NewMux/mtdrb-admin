-- MTDRB FIT device-agnostic attendance module
-- Stores normalized check-in events without storing raw biometric data.

BEGIN;

CREATE TABLE IF NOT EXISTS public.attendance_connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'mtdrb',
  connection_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (connection_type IN ('webhook', 'cloud_api', 'local_gateway', 'csv', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'error', 'revoked')),
  credentials_ref TEXT,
  last_sync_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  connector_id UUID REFERENCES public.attendance_connectors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'kiosk'
    CHECK (device_type IN ('kiosk', 'terminal', 'gateway', 'qr', 'nfc', 'manual')),
  external_device_id TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'revoked')),
  last_seen_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_member_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  connector_id UUID REFERENCES public.attendance_connectors(id) ON DELETE CASCADE,
  identity_type TEXT NOT NULL
    CHECK (identity_type IN ('vendor_user_id', 'badge_uid_hash', 'qr_token_hash', 'passkey_credential')),
  external_identifier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked', 'pending')),
  last_used_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, identity_type, external_identifier)
);

CREATE TABLE IF NOT EXISTS public.attendance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  connector_id UUID REFERENCES public.attendance_connectors(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.attendance_devices(id) ON DELETE SET NULL,
  external_event_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  direction TEXT NOT NULL DEFAULT 'check_in'
    CHECK (direction IN ('check_in', 'check_out', 'access')),
  method TEXT NOT NULL DEFAULT 'staff'
    CHECK (method IN ('qr', 'pin', 'passkey', 'nfc', 'vendor_biometric', 'staff')),
  source_type TEXT NOT NULL DEFAULT 'web'
    CHECK (source_type IN ('web', 'device', 'gateway', 'vendor_cloud', 'import')),
  status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('accepted', 'duplicate', 'unresolved', 'rejected', 'review')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_connectors_tenant
  ON public.attendance_connectors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_devices_tenant_branch
  ON public.attendance_devices(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_identities_member
  ON public.attendance_member_identities(tenant_id, member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_events_tenant_time
  ON public.attendance_events(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_events_member_time
  ON public.attendance_events(tenant_id, member_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_events_branch_time
  ON public.attendance_events(tenant_id, branch_id, occurred_at DESC);

ALTER TABLE public.attendance_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_member_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendance_connectors_select_same_tenant
  ON public.attendance_connectors FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY attendance_connectors_manage_admin
  ON public.attendance_connectors FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY attendance_devices_select_same_tenant
  ON public.attendance_devices FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY attendance_devices_manage_admin
  ON public.attendance_devices FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY attendance_identities_select_same_tenant
  ON public.attendance_member_identities FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY attendance_identities_manage_employee
  ON public.attendance_member_identities FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

CREATE POLICY attendance_events_select_same_tenant
  ON public.attendance_events FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY attendance_events_insert_employee
  ON public.attendance_events FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));
CREATE POLICY attendance_events_update_employee
  ON public.attendance_events FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'employee'));

COMMIT;
