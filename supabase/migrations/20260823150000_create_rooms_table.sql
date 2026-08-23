-- Create a real rooms table
-- ============================================================================
-- The class-scheduling UI (AddClassModal's "Room" dropdown, useSmartClassModal
-- SmartRoom type) has always expected a rooms table with capacity/equipment,
-- but fetchRooms() only ever returned an empty array with a "when rooms table
-- is available" comment - the dropdown has been permanently empty. This adds
-- the table it was waiting for, following the same tenant-scoped RLS shape as
-- the existing branches table (any tenant member can view; only admins manage).

BEGIN;

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  equipment TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_rooms_tenant_id ON public.rooms(tenant_id);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY rooms_select_same_tenant ON public.rooms FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY rooms_insert_admin ON public.rooms FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY rooms_update_admin ON public.rooms FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY rooms_delete_admin ON public.rooms FOR DELETE
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
