-- ============================================================================
-- PLANS TABLE
-- ============================================================================
-- Membership plan definitions (name, price, duration, features), as used by
-- src/pages/Plans.tsx. Extracted from complete_schema_v2.sql as a standalone
-- migration rather than running that full 48KB schema file, since only this
-- one table was actually missing from the live database.

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 30,
  features JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  members_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_plans_tenant_id ON plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plans for their tenant"
  ON plans FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert plans for their tenant"
  ON plans FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update plans for their tenant"
  ON plans FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete plans for their tenant"
  ON plans FOR DELETE
  USING (tenant_id = get_user_tenant_id());

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
