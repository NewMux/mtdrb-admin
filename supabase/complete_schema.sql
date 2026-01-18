-- ============================================================================
-- MTDRB Admin - Complete Database Schema
-- ============================================================================
-- 
-- This is a COMPLETE SQL script that sets up the entire database.
-- Run this single file in your Supabase SQL Editor.
--
-- Includes:
-- - All tables (tenants, memberships, members, trainers, classes, etc.)
-- - Plans, subscriptions, trainer_schedule, class_waitlist tables
-- - All RLS policies for multi-tenancy security
-- - All RPC functions for analytics and reporting
-- - All triggers and indexes
--
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP EXISTING OBJECTS (for clean reinstall)
-- ============================================================================

-- Drop policies first (they depend on tables)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS get_analytics_overview() CASCADE;
DROP FUNCTION IF EXISTS get_member_metrics(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_trainer_metrics(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_class_metrics(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_financial_metrics(TEXT) CASCADE;
DROP FUNCTION IF EXISTS calculate_vat_compliance_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_vat_return(UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  has_plans BOOLEAN DEFAULT false,
  has_trainers BOOLEAN DEFAULT false,
  has_classes BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);

-- MEMBERSHIPS TABLE (user-tenant relationship)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'manager', 'trainer', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON memberships(tenant_id);

-- GYM_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS gym_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'AED',
  vat_rate NUMERIC(5, 2) DEFAULT 5.00,
  vat_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_settings_tenant_id ON gym_settings(tenant_id);

-- BRANCHES TABLE
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);

-- TRAINERS TABLE
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating NUMERIC(3, 2) CHECK (rating >= 0 AND rating <= 5),
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_trainers_tenant_id ON trainers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trainers_email ON trainers(email);
CREATE INDEX IF NOT EXISTS idx_trainers_status ON trainers(status);

-- MEMBERS TABLE
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  membership_type TEXT NOT NULL,
  membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'trial', 'expired', 'suspended')),
  join_date DATE NOT NULL,
  expiry_date DATE,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  assigned_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_members_tenant_id ON members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON members(membership_status);
CREATE INDEX IF NOT EXISTS idx_members_trainer_id ON members(trainer_id);

-- PLANS TABLE (membership plans)
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

-- SUBSCRIPTIONS TABLE
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

-- CLASSES TABLE
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  current_bookings INTEGER DEFAULT 0 CHECK (current_bookings >= 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'active')),
  room TEXT,
  location TEXT, -- Used in some components, can be same as room
  price NUMERIC(10, 2),
  type TEXT,
  recurrence_rule TEXT,
  color TEXT,
  attachment_url TEXT,
  reminders TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_classes_tenant_id ON classes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_classes_trainer_id ON classes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_classes_start_time ON classes(start_time);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

-- TRAINER_SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS trainer_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  specific_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_trainer_schedule_tenant_id ON trainer_schedule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trainer_schedule_trainer_id ON trainer_schedule(trainer_id);

-- CLASS_BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS class_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'checked_in', 'completed', 'cancelled', 'no_show')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(class_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_class_bookings_tenant_id ON class_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_class_id ON class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_member_id ON class_bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_status ON class_bookings(status);

-- CLASS_WAITLIST TABLE
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

-- INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'membership' CHECK (type IN ('membership', 'class', 'personal_training', 'product', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'Paid', 'Unpaid', 'Partial')),
  issue_date DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'other')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  total NUMERIC(10, 2) CHECK (total >= 0),
  paid_amount NUMERIC(10, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  vat_total NUMERIC(10, 2) DEFAULT 0 CHECK (vat_total >= 0),
  currency TEXT NOT NULL DEFAULT 'AED',
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  line_items JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_member_id ON invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  vat_amount NUMERIC(10, 2) DEFAULT 0 CHECK (vat_amount >= 0),
  category TEXT,
  date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  payment_method TEXT,
  vendor TEXT,
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- VAT_RETURNS TABLE
CREATE TABLE IF NOT EXISTS vat_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  vat_collected NUMERIC(10, 2) DEFAULT 0,
  vat_paid NUMERIC(10, 2) DEFAULT 0,
  net_vat_payable NUMERIC(10, 2) DEFAULT 0,
  due_date DATE,
  filing_deadline DATE,
  filed_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_vat_returns_tenant_id ON vat_returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vat_returns_period ON vat_returns(period);
CREATE INDEX IF NOT EXISTS idx_vat_returns_status ON vat_returns(status);

-- MEMBER_TASKS TABLE
CREATE TABLE IF NOT EXISTS member_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('follow_up', 'payment_reminder', 'renewal', 'check_in', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_member_tasks_tenant_id ON member_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_tasks_member_id ON member_tasks(member_id);
CREATE INDEX IF NOT EXISTS idx_member_tasks_status ON member_tasks(status);
CREATE INDEX IF NOT EXISTS idx_member_tasks_due_date ON member_tasks(due_date);

-- ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('member', 'payment', 'class', 'signup', 'renewal', 'booking')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "user" TEXT,
  amount TEXT,
  status TEXT CHECK (status IN ('success', 'pending', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- HEALTH_CHECK TABLE
CREATE TABLE IF NOT EXISTS health_check (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'unhealthy')),
  message TEXT
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's tenant ID
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id
  FROM memberships
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- TENANTS
CREATE POLICY "Users can view their own tenant" ON tenants FOR SELECT
  USING (id = get_user_tenant_id());

CREATE POLICY "Authenticated users can create tenants" ON tenants FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own tenant" ON tenants FOR UPDATE
  USING (id = get_user_tenant_id());

-- MEMBERSHIPS
CREATE POLICY "Users can view memberships for their tenant" ON memberships FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert memberships for their tenant" ON memberships FOR INSERT
  TO authenticated WITH CHECK (
    -- Allow if user is creating their own membership (signup case - no tenant yet)
    user_id = auth.uid()
    OR
    -- Allow if tenant_id matches user's existing tenant (normal case)
    tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Users can update memberships for their tenant" ON memberships FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete memberships for their tenant" ON memberships FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- GYM_SETTINGS
CREATE POLICY "Users can view gym settings for their tenant" ON gym_settings FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert gym settings for their tenant" ON gym_settings FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update gym settings for their tenant" ON gym_settings FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete gym settings for their tenant" ON gym_settings FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- BRANCHES
CREATE POLICY "Users can view branches for their tenant" ON branches FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert branches for their tenant" ON branches FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update branches for their tenant" ON branches FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete branches for their tenant" ON branches FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- MEMBERS
CREATE POLICY "Users can view members from their tenant" ON members FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert members for their tenant" ON members FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update members from their tenant" ON members FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete members from their tenant" ON members FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- TRAINERS
CREATE POLICY "Users can view trainers from their tenant" ON trainers FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert trainers for their tenant" ON trainers FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update trainers from their tenant" ON trainers FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete trainers from their tenant" ON trainers FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- PLANS
CREATE POLICY "Users can view plans for their tenant" ON plans FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert plans for their tenant" ON plans FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update plans for their tenant" ON plans FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete plans for their tenant" ON plans FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- SUBSCRIPTIONS
CREATE POLICY "Users can view subscriptions for their tenant" ON subscriptions FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert subscriptions for their tenant" ON subscriptions FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update subscriptions for their tenant" ON subscriptions FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete subscriptions for their tenant" ON subscriptions FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- CLASSES
CREATE POLICY "Users can view classes from their tenant" ON classes FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert classes for their tenant" ON classes FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update classes from their tenant" ON classes FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete classes from their tenant" ON classes FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- TRAINER_SCHEDULE
CREATE POLICY "Users can view trainer_schedule for their tenant" ON trainer_schedule FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert trainer_schedule for their tenant" ON trainer_schedule FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update trainer_schedule for their tenant" ON trainer_schedule FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete trainer_schedule for their tenant" ON trainer_schedule FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- CLASS_BOOKINGS
CREATE POLICY "Users can view class bookings from their tenant" ON class_bookings FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert class bookings for their tenant" ON class_bookings FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update class bookings from their tenant" ON class_bookings FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete class bookings from their tenant" ON class_bookings FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- CLASS_WAITLIST
CREATE POLICY "Users can view class_waitlist for their tenant" ON class_waitlist FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert class_waitlist for their tenant" ON class_waitlist FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update class_waitlist for their tenant" ON class_waitlist FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete class_waitlist for their tenant" ON class_waitlist FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- INVOICES
CREATE POLICY "Users can view invoices from their tenant" ON invoices FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert invoices for their tenant" ON invoices FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update invoices from their tenant" ON invoices FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete invoices from their tenant" ON invoices FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- EXPENSES
CREATE POLICY "Users can view expenses for their tenant" ON expenses FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert expenses for their tenant" ON expenses FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update expenses for their tenant" ON expenses FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete expenses for their tenant" ON expenses FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- VAT_RETURNS
CREATE POLICY "Users can view VAT returns for their tenant" ON vat_returns FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert VAT returns for their tenant" ON vat_returns FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update VAT returns for their tenant" ON vat_returns FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete VAT returns for their tenant" ON vat_returns FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- MEMBER_TASKS
CREATE POLICY "Users can view member tasks from their tenant" ON member_tasks FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert member tasks for their tenant" ON member_tasks FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update member tasks from their tenant" ON member_tasks FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete member tasks from their tenant" ON member_tasks FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ACTIVITIES
CREATE POLICY "Users can view activities from their tenant" ON activities FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert activities for their tenant" ON activities FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update activities from their tenant" ON activities FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete activities from their tenant" ON activities FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- HEALTH_CHECK
CREATE POLICY "Authenticated users can view health check" ON health_check FOR SELECT
  TO authenticated USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gym_settings_updated_at ON gym_settings;
CREATE TRIGGER update_gym_settings_updated_at BEFORE UPDATE ON gym_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trainer_schedule_updated_at ON trainer_schedule;
CREATE TRIGGER update_trainer_schedule_updated_at BEFORE UPDATE ON trainer_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_waitlist_updated_at ON class_waitlist;
CREATE TRIGGER update_class_waitlist_updated_at BEFORE UPDATE ON class_waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_tasks_updated_at ON member_tasks;
CREATE TRIGGER update_member_tasks_updated_at BEFORE UPDATE ON member_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RPC FUNCTIONS (Analytics & Reporting)
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
    'total_revenue', COALESCE((SELECT SUM(amount) FROM invoices WHERE tenant_id = user_tenant_id AND status IN ('paid', 'Paid')), 0),
    'pending_invoices', (SELECT COUNT(*) FROM invoices WHERE tenant_id = user_tenant_id AND status IN ('pending', 'Unpaid', 'Partial'))
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
    'growth_rate', 0
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
    'avg_attendance', 0
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
    'total_revenue', COALESCE((SELECT SUM(amount) FROM invoices WHERE tenant_id = user_tenant_id AND status IN ('paid', 'Paid') AND created_at >= start_date), 0),
    'total_expenses', COALESCE((SELECT SUM(amount) FROM expenses WHERE tenant_id = user_tenant_id AND status = 'approved' AND date >= start_date), 0),
    'pending_payments', COALESCE((SELECT SUM(amount) FROM invoices WHERE tenant_id = user_tenant_id AND status IN ('pending', 'Unpaid', 'Partial')), 0),
    'vat_collected', COALESCE((SELECT SUM(vat_total) FROM invoices WHERE tenant_id = user_tenant_id AND status IN ('paid', 'Paid') AND created_at >= start_date), 0),
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
  SELECT COUNT(*) INTO overdue_returns
  FROM vat_returns
  WHERE tenant_id = p_tenant_id
    AND status = 'draft'
    AND filing_deadline < CURRENT_DATE;
  
  score := score - (overdue_returns * 10);
  
  SELECT COUNT(*) INTO missing_receipts
  FROM expenses
  WHERE tenant_id = p_tenant_id
    AND receipt_url IS NULL
    AND amount > 100;
  
  score := score - (missing_receipts * 2);
  
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
  SELECT COALESCE(SUM(vat_total), 0) INTO v_vat_collected
  FROM invoices
  WHERE tenant_id = p_tenant_id
    AND status IN ('paid', 'Paid')
    AND created_at >= p_period_start
    AND created_at <= p_period_end;
  
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

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trainer_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_vat_compliance_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_vat_return(UUID, DATE, DATE) TO authenticated;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE tenants IS 'Stores organization/tenant information for multi-tenancy';
COMMENT ON TABLE memberships IS 'Links users to tenants with their roles';
COMMENT ON TABLE gym_settings IS 'Stores gym/organization settings';
COMMENT ON TABLE branches IS 'Stores branch/location information';
COMMENT ON TABLE members IS 'Stores member profiles and information';
COMMENT ON TABLE trainers IS 'Stores trainer profiles and information';
COMMENT ON TABLE plans IS 'Stores membership plan definitions';
COMMENT ON TABLE subscriptions IS 'Stores member subscriptions to plans';
COMMENT ON TABLE classes IS 'Stores class schedules and details';
COMMENT ON TABLE trainer_schedule IS 'Stores trainer availability and schedules';
COMMENT ON TABLE class_bookings IS 'Stores member class bookings';
COMMENT ON TABLE class_waitlist IS 'Stores class waitlist entries';
COMMENT ON TABLE invoices IS 'Stores billing and invoicing information';
COMMENT ON TABLE expenses IS 'Stores business expenses';
COMMENT ON TABLE vat_returns IS 'Stores VAT return information';
COMMENT ON TABLE member_tasks IS 'Stores tasks related to members';
COMMENT ON TABLE activities IS 'Stores activity feed/logs';

-- ============================================================================
-- VERIFICATION (run these after to verify setup)
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- ============================================================================
-- END OF COMPLETE SCHEMA
-- ============================================================================
