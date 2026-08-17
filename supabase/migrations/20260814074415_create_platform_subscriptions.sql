-- ============================================================================
-- PLATFORM SUBSCRIPTIONS TABLE
-- ============================================================================
-- Tracks platform-level subscriptions for each tenant (gym workspace)

CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'failed', 'cancelled', 'expired', 'trialing', 'past_due')),
  plan_tier TEXT NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'enterprise', 'demo')),
  tap_subscription_id TEXT,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AED',
  trial_end TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_tenant_id ON platform_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_status ON platform_subscriptions(status);

-- Enable RLS
ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can select platform_subscriptions for their tenant
CREATE POLICY "Users can view platform subscriptions for their tenant"
  ON platform_subscriptions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Tenant admins can insert platform subscriptions
CREATE POLICY "Tenant admins can insert platform subscriptions"
  ON platform_subscriptions
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Tenant admins can update platform subscriptions
CREATE POLICY "Tenant admins can update platform subscriptions"
  ON platform_subscriptions
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_subscriptions_updated_at
  BEFORE UPDATE ON platform_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_subscriptions_updated_at();
