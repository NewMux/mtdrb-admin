-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
-- Stores user notifications for the admin panel

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  body TEXT, -- Alternative field name (for compatibility)
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
  read_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created ON notifications(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Users can only see notifications for their tenant
DROP POLICY IF EXISTS "Users can view notifications for their tenant" ON notifications;
CREATE POLICY "Users can view notifications for their tenant"
  ON notifications
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert notifications for their tenant
DROP POLICY IF EXISTS "Users can insert notifications for their tenant" ON notifications;
CREATE POLICY "Users can insert notifications for their tenant"
  ON notifications
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Users can update notifications for their tenant
DROP POLICY IF EXISTS "Users can update notifications for their tenant" ON notifications;
CREATE POLICY "Users can update notifications for their tenant"
  ON notifications
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM memberships
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Users can delete notifications for their tenant
DROP POLICY IF EXISTS "Users can delete notifications for their tenant" ON notifications;
CREATE POLICY "Users can delete notifications for their tenant"
  ON notifications
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();
