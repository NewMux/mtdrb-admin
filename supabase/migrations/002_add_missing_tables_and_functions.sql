-- ============================================================================
-- Migration: Add Missing Tables and RPC Functions
-- ============================================================================
-- This migration adds tables and functions that are referenced in the codebase
-- but were missing from the schema.
-- ============================================================================

-- ============================================================================
-- PLANS TABLE
-- ============================================================================
-- Stores membership plan definitions

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 30, -- Duration in days
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

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Stores member subscriptions to plans

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  payment_method TEXT,
  amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subscriptions for their tenant"
  ON subscriptions FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert subscriptions for their tenant"
  ON subscriptions FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update subscriptions for their tenant"
  ON subscriptions FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete subscriptions for their tenant"
  ON subscriptions FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- TRAINER_SCHEDULE TABLE
-- ============================================================================
-- Stores trainer availability and schedule

CREATE TABLE IF NOT EXISTS trainer_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  specific_date DATE, -- For specific date overrides
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_trainer_schedule_tenant_id ON trainer_schedule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trainer_schedule_trainer_id ON trainer_schedule(trainer_id);

ALTER TABLE trainer_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trainer_schedule for their tenant"
  ON trainer_schedule FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert trainer_schedule for their tenant"
  ON trainer_schedule FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update trainer_schedule for their tenant"
  ON trainer_schedule FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete trainer_schedule for their tenant"
  ON trainer_schedule FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- CLASS_WAITLIST TABLE
-- ============================================================================
-- Stores members waiting for class availability

CREATE TABLE IF NOT EXISTS class_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'enrolled', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(class_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_class_waitlist_tenant_id ON class_waitlist(tenant_id);
CREATE INDEX IF NOT EXISTS idx_class_waitlist_class_id ON class_waitlist(class_id);
CREATE INDEX IF NOT EXISTS idx_class_waitlist_member_id ON class_waitlist(member_id);

ALTER TABLE class_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view class_waitlist for their tenant"
  ON class_waitlist FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert class_waitlist for their tenant"
  ON class_waitlist FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update class_waitlist for their tenant"
  ON class_waitlist FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete class_waitlist for their tenant"
  ON class_waitlist FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Get Analytics Overview
CREATE OR REPLACE FUNCTION get_analytics_overview()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_tenant_id UUID;
BEGIN
  user_tenant_id := get_user_tenant_id();
  
  SELECT json_build_object(
    'total_members', (SELECT COUNT(*) FROM members WHERE tenant_id = user_tenant_id),
    'active_members', (SELECT COUNT(*) FROM members WHERE tenant_id = user_tenant_id AND status = 'active'),
    'total_classes', (SELECT COUNT(*) FROM classes WHERE tenant_id = user_tenant_id),
    'total_trainers', (SELECT COUNT(*) FROM trainers WHERE tenant_id = user_tenant_id AND status = 'active'),
    'total_revenue', COALESCE((SELECT SUM(amount) FROM invoices WHERE tenant_id = user_tenant_id AND status = 'Paid'), 0),
    'pending_invoices', (SELECT COUNT(*) FROM invoices WHERE tenant_id = user_tenant_id AND status IN ('Unpaid', 'Partial'))
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Get Member Metrics
CREATE OR REPLACE FUNCTION get_member_metrics(p_period TEXT DEFAULT 'month')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_tenant_id UUID;
  start_date DATE;
BEGIN
  user_tenant_id := get_user_tenant_id();
  
  start_date := CASE p_period
    WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
    WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
    WHEN 'quarter' THEN CURRENT_DATE - INTERVAL '90 days'
    WHEN 'year' THEN CURRENT_DATE - INTERVAL '365 days'
    ELSE CURRENT_DATE - INTERVAL '30 days'
  END;
  
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM members WHERE tenant_id = user_tenant_id),
    'new', (SELECT COUNT(*) FROM members WHERE tenant_id = user_tenant_id AND created_at >= start_date),
    'active', (SELECT COUNT(*) FROM members WHERE tenant_id = user_tenant_id AND status = 'active'),
    'inactive', (SELECT COUNT(*) FROM members WHERE tenant_id = user_tenant_id AND status = 'inactive'),
    'growth_rate', 0 -- Would calculate based on previous period
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Get Trainer Metrics
CREATE OR REPLACE FUNCTION get_trainer_metrics(p_period TEXT DEFAULT 'month')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_tenant_id UUID;
BEGIN
  user_tenant_id := get_user_tenant_id();
  
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM trainers WHERE tenant_id = user_tenant_id),
    'active', (SELECT COUNT(*) FROM trainers WHERE tenant_id = user_tenant_id AND status = 'active'),
    'avg_rating', COALESCE((SELECT AVG(rating) FROM trainers WHERE tenant_id = user_tenant_id AND rating IS NOT NULL), 0),
    'total_classes', (SELECT COUNT(*) FROM classes WHERE tenant_id = user_tenant_id)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Get Class Metrics
CREATE OR REPLACE FUNCTION get_class_metrics(p_period TEXT DEFAULT 'month')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_tenant_id UUID;
  start_date DATE;
BEGIN
  user_tenant_id := get_user_tenant_id();
  
  start_date := CASE p_period
    WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
    WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
    WHEN 'quarter' THEN CURRENT_DATE - INTERVAL '90 days'
    WHEN 'year' THEN CURRENT_DATE - INTERVAL '365 days'
    ELSE CURRENT_DATE - INTERVAL '30 days'
  END;
  
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM classes WHERE tenant_id = user_tenant_id),
    'upcoming', (SELECT COUNT(*) FROM classes WHERE tenant_id = user_tenant_id AND start_time > NOW()),
    'completed', (SELECT COUNT(*) FROM classes WHERE tenant_id = user_tenant_id AND end_time < NOW()),
    'total_bookings', (SELECT COUNT(*) FROM class_bookings WHERE tenant_id = user_tenant_id AND created_at >= start_date),
    'avg_attendance', 0 -- Would calculate based on booking data
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Get Financial Metrics
CREATE OR REPLACE FUNCTION get_financial_metrics(p_period TEXT DEFAULT 'month')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_tenant_id UUID;
  start_date DATE;
BEGIN
  user_tenant_id := get_user_tenant_id();
  
  start_date := CASE p_period
    WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
    WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
    WHEN 'quarter' THEN CURRENT_DATE - INTERVAL '90 days'
    WHEN 'year' THEN CURRENT_DATE - INTERVAL '365 days'
    ELSE CURRENT_DATE - INTERVAL '30 days'
  END;
  
  SELECT json_build_object(
    'total_revenue', COALESCE((SELECT SUM(amount) FROM invoices WHERE tenant_id = user_tenant_id AND status = 'Paid' AND created_at >= start_date), 0),
    'total_expenses', COALESCE((SELECT SUM(amount) FROM expenses WHERE tenant_id = user_tenant_id AND status = 'approved' AND date >= start_date), 0),
    'pending_payments', COALESCE((SELECT SUM(amount) FROM invoices WHERE tenant_id = user_tenant_id AND status IN ('Unpaid', 'Partial')), 0),
    'vat_collected', COALESCE((SELECT SUM(vat_total) FROM invoices WHERE tenant_id = user_tenant_id AND status = 'Paid' AND created_at >= start_date), 0),
    'vat_paid', COALESCE((SELECT SUM(vat_amount) FROM expenses WHERE tenant_id = user_tenant_id AND status = 'approved' AND date >= start_date), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Calculate VAT Compliance Score
CREATE OR REPLACE FUNCTION calculate_vat_compliance_score(p_tenant_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score NUMERIC := 100;
  overdue_returns INTEGER;
  missing_receipts INTEGER;
BEGIN
  -- Check for overdue VAT returns
  SELECT COUNT(*) INTO overdue_returns
  FROM vat_returns
  WHERE tenant_id = p_tenant_id
    AND status = 'draft'
    AND filing_deadline < CURRENT_DATE;
  
  -- Deduct points for overdue returns
  score := score - (overdue_returns * 10);
  
  -- Check for expenses without receipts
  SELECT COUNT(*) INTO missing_receipts
  FROM expenses
  WHERE tenant_id = p_tenant_id
    AND receipt_url IS NULL
    AND amount > 100;
  
  -- Deduct points for missing receipts
  score := score - (missing_receipts * 2);
  
  -- Ensure score doesn't go below 0
  IF score < 0 THEN
    score := 0;
  END IF;
  
  RETURN score;
END;
$$;

-- Generate VAT Return
CREATE OR REPLACE FUNCTION generate_vat_return(
  p_tenant_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_vat_collected NUMERIC;
  v_vat_paid NUMERIC;
  v_net_vat NUMERIC;
BEGIN
  -- Calculate VAT collected from invoices
  SELECT COALESCE(SUM(vat_total), 0) INTO v_vat_collected
  FROM invoices
  WHERE tenant_id = p_tenant_id
    AND status = 'Paid'
    AND created_at >= p_period_start
    AND created_at <= p_period_end;
  
  -- Calculate VAT paid on expenses
  SELECT COALESCE(SUM(vat_amount), 0) INTO v_vat_paid
  FROM expenses
  WHERE tenant_id = p_tenant_id
    AND status = 'approved'
    AND date >= p_period_start
    AND date <= p_period_end;
  
  v_net_vat := v_vat_collected - v_vat_paid;
  
  SELECT json_build_object(
    'period_start', p_period_start,
    'period_end', p_period_end,
    'vat_collected', v_vat_collected,
    'vat_paid', v_vat_paid,
    'net_vat_payable', v_net_vat,
    'status', 'draft'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_analytics_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trainer_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_vat_compliance_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_vat_return(UUID, DATE, DATE) TO authenticated;
