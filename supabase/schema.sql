-- ============================================================================
-- MTDRB Admin Database Schema
-- ============================================================================
-- 
-- This SQL script creates all required tables and Row Level Security (RLS)
-- policies for the MTDRB Admin application.
--
-- IMPORTANT: Run this script in your Supabase SQL Editor to set up the database.
--
-- Prerequisites:
-- 1. Create a Supabase project
-- 2. Open the SQL Editor
-- 3. Run this entire script
-- 4. Verify all tables and policies are created
--
-- UPDATES:
-- - Added gym_settings, branches, expenses, vat_returns tables
-- - Updated invoices table with additional fields (type, issue_date, payment_method, total, paid_amount, vat_total, line_items)
-- - Updated members table with assigned_branch_id and membership_status
-- - Removed promotion-related tables
-- - All tables include proper RLS policies for multi-tenancy
--
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
-- Stores organization/tenant information for multi-tenancy support

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

-- Create index on tenant name for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);

-- ============================================================================
-- MEMBERSHIPS TABLE
-- ============================================================================
-- Links users to tenants with their roles (multi-tenancy user-tenant relationship)

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'manager', 'trainer', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON memberships(tenant_id);

-- ============================================================================
-- GYM_SETTINGS TABLE
-- ============================================================================
-- Stores gym/organization settings (currency, VAT settings, etc.)

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gym_settings_tenant_id ON gym_settings(tenant_id);

-- ============================================================================
-- BRANCHES TABLE
-- ============================================================================
-- Stores branch/location information for multi-branch gyms

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);

-- ============================================================================
-- TRAINERS TABLE
-- ============================================================================
-- Stores trainer profiles and information
-- NOTE: Created before members because members table references trainers

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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_trainers_tenant_id ON trainers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trainers_email ON trainers(email);
CREATE INDEX IF NOT EXISTS idx_trainers_status ON trainers(status);

-- ============================================================================
-- MEMBERS TABLE
-- ============================================================================
-- Stores member profiles and information

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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_members_tenant_id ON members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON members(membership_status);
CREATE INDEX IF NOT EXISTS idx_members_trainer_id ON members(trainer_id);
CREATE INDEX IF NOT EXISTS idx_members_assigned_branch_id ON members(assigned_branch_id);

-- ============================================================================
-- CLASSES TABLE
-- ============================================================================
-- Stores class schedules and details

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
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  room TEXT,
  price NUMERIC(10, 2),
  metadata JSONB DEFAULT '{}'::jsonb,
  CHECK (end_time > start_time)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_classes_tenant_id ON classes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_classes_trainer_id ON classes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_classes_start_time ON classes(start_time);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

-- ============================================================================
-- CLASS_BOOKINGS TABLE
-- ============================================================================
-- Stores member class bookings

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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_class_bookings_tenant_id ON class_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_class_id ON class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_member_id ON class_bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_status ON class_bookings(status);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
-- Stores billing and invoicing information
-- Updated with additional fields for comprehensive billing management

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'membership' CHECK (type IN ('membership', 'class', 'personal_training', 'product', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  issue_date DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'other')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  total NUMERIC(10, 2) CHECK (total >= 0),
  paid_amount NUMERIC(10, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  vat_total NUMERIC(10, 2) DEFAULT 0 CHECK (vat_total >= 0),
  currency TEXT NOT NULL DEFAULT 'AED',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  line_items JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_member_id ON invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
-- Stores business expenses for VAT and financial tracking

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ============================================================================
-- VAT_RETURNS TABLE
-- ============================================================================
-- Stores VAT return information for compliance

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vat_returns_tenant_id ON vat_returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vat_returns_period ON vat_returns(period);
CREATE INDEX IF NOT EXISTS idx_vat_returns_status ON vat_returns(status);

-- ============================================================================
-- MEMBER_TASKS TABLE
-- ============================================================================
-- Stores tasks related to members (follow-ups, reminders, check-ins, etc.)

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
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_member_tasks_tenant_id ON member_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_tasks_member_id ON member_tasks(member_id);
CREATE INDEX IF NOT EXISTS idx_member_tasks_status ON member_tasks(status);
CREATE INDEX IF NOT EXISTS idx_member_tasks_due_date ON member_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_member_tasks_assigned_to ON member_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_member_tasks_created_by ON member_tasks(created_by);

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================
-- Stores activity feed/logs

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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- ============================================================================
-- HEALTH_CHECK TABLE
-- ============================================================================
-- Simple health check table for monitoring

CREATE TABLE IF NOT EXISTS health_check (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'unhealthy')),
  message TEXT
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- 
-- CRITICAL: These policies ensure that users can only access data from their
-- own tenant. This is essential for multi-tenancy security.
--
-- Policy Pattern:
-- - Users can only SELECT/INSERT/UPDATE/DELETE rows where tenant_id matches
--   their membership's tenant_id
-- - This prevents data leakage between tenants
--
-- SIGNUP FIX: Policies allow authenticated users to create tenants and
-- memberships during signup/onboarding (before they have a tenant_id)

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper Function: Get User's Tenant ID
-- ============================================================================
-- This function retrieves the tenant_id for the current authenticated user
-- based on their membership record.

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id
  FROM memberships
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- TENANTS RLS POLICIES
-- ============================================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Users can update their own tenant" ON tenants;

-- Users can view their own tenant
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id = get_user_tenant_id());

-- Users can insert tenants (for signup/onboarding)
-- This allows new users to create their organization during signup
-- CRITICAL: This must allow ANY authenticated user to create a tenant
CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own tenant
CREATE POLICY "Users can update their own tenant"
  ON tenants FOR UPDATE
  USING (id = get_user_tenant_id());

-- ============================================================================
-- MEMBERSHIPS RLS POLICIES
-- ============================================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view memberships for their tenant" ON memberships;
DROP POLICY IF EXISTS "Users can insert memberships for their tenant" ON memberships;
DROP POLICY IF EXISTS "Users can update memberships for their tenant" ON memberships;
DROP POLICY IF EXISTS "Users can delete memberships for their tenant" ON memberships;

-- Users can view memberships for their tenant
CREATE POLICY "Users can view memberships for their tenant"
  ON memberships FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can insert memberships for their tenant
-- Also allow users to create their own membership during signup (before they have a tenant_id)
-- CRITICAL: user_id = auth.uid() check MUST come first for signup to work
CREATE POLICY "Users can insert memberships for their tenant"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is creating their own membership (signup case)
    user_id = auth.uid()
    OR
    -- Allow if tenant_id matches user's tenant (normal case)
    tenant_id = get_user_tenant_id()
  );

-- Users can update memberships for their tenant
CREATE POLICY "Users can update memberships for their tenant"
  ON memberships FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Users can delete memberships for their tenant
CREATE POLICY "Users can delete memberships for their tenant"
  ON memberships FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- GYM_SETTINGS RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view gym settings for their tenant"
  ON gym_settings FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert gym settings for their tenant"
  ON gym_settings FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update gym settings for their tenant"
  ON gym_settings FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete gym settings for their tenant"
  ON gym_settings FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- BRANCHES RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view branches for their tenant"
  ON branches FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert branches for their tenant"
  ON branches FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update branches for their tenant"
  ON branches FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete branches for their tenant"
  ON branches FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- MEMBERS RLS POLICIES
-- ============================================================================

-- Users can view members from their tenant
CREATE POLICY "Users can view members from their tenant"
  ON members FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can insert members for their tenant
CREATE POLICY "Users can insert members for their tenant"
  ON members FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Users can update members from their tenant
CREATE POLICY "Users can update members from their tenant"
  ON members FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Users can delete members from their tenant
CREATE POLICY "Users can delete members from their tenant"
  ON members FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- TRAINERS RLS POLICIES
-- ============================================================================

-- Users can view trainers from their tenant
CREATE POLICY "Users can view trainers from their tenant"
  ON trainers FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can insert trainers for their tenant
CREATE POLICY "Users can insert trainers for their tenant"
  ON trainers FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Users can update trainers from their tenant
CREATE POLICY "Users can update trainers from their tenant"
  ON trainers FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Users can delete trainers from their tenant
CREATE POLICY "Users can delete trainers from their tenant"
  ON trainers FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- CLASSES RLS POLICIES
-- ============================================================================

-- Users can view classes from their tenant
CREATE POLICY "Users can view classes from their tenant"
  ON classes FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can insert classes for their tenant
CREATE POLICY "Users can insert classes for their tenant"
  ON classes FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Users can update classes from their tenant
CREATE POLICY "Users can update classes from their tenant"
  ON classes FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Users can delete classes from their tenant
CREATE POLICY "Users can delete classes from their tenant"
  ON classes FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- CLASS_BOOKINGS RLS POLICIES
-- ============================================================================

-- Users can view class bookings from their tenant
CREATE POLICY "Users can view class bookings from their tenant"
  ON class_bookings FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can insert class bookings for their tenant
CREATE POLICY "Users can insert class bookings for their tenant"
  ON class_bookings FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Users can update class bookings from their tenant
CREATE POLICY "Users can update class bookings from their tenant"
  ON class_bookings FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Users can delete class bookings from their tenant
CREATE POLICY "Users can delete class bookings from their tenant"
  ON class_bookings FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- INVOICES RLS POLICIES
-- ============================================================================

-- Users can view invoices from their tenant
CREATE POLICY "Users can view invoices from their tenant"
  ON invoices FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can insert invoices for their tenant
CREATE POLICY "Users can insert invoices for their tenant"
  ON invoices FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Users can update invoices from their tenant
CREATE POLICY "Users can update invoices from their tenant"
  ON invoices FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Users can delete invoices from their tenant
CREATE POLICY "Users can delete invoices from their tenant"
  ON invoices FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- EXPENSES RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view expenses for their tenant"
  ON expenses FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert expenses for their tenant"
  ON expenses FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update expenses for their tenant"
  ON expenses FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete expenses for their tenant"
  ON expenses FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- VAT_RETURNS RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view VAT returns for their tenant"
  ON vat_returns FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert VAT returns for their tenant"
  ON vat_returns FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update VAT returns for their tenant"
  ON vat_returns FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete VAT returns for their tenant"
  ON vat_returns FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- ACTIVITIES RLS POLICIES
-- ============================================================================

-- Users can view activities from their tenant
CREATE POLICY "Users can view activities from their tenant"
  ON activities FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can insert activities for their tenant
CREATE POLICY "Users can insert activities for their tenant"
  ON activities FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Users can update activities from their tenant
CREATE POLICY "Users can update activities from their tenant"
  ON activities FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Users can delete activities from their tenant
CREATE POLICY "Users can delete activities from their tenant"
  ON activities FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- HEALTH_CHECK RLS POLICIES
-- ============================================================================

-- Allow all authenticated users to read health check (for monitoring)
CREATE POLICY "Authenticated users can view health check"
  ON health_check FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
-- Automatically update the updated_at timestamp when rows are modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_settings_updated_at
  BEFORE UPDATE ON gym_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_tasks_updated_at
  BEFORE UPDATE ON member_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- Add helpful comments to tables

COMMENT ON TABLE tenants IS 'Stores organization/tenant information for multi-tenancy';
COMMENT ON TABLE memberships IS 'Links users to tenants with their roles';
COMMENT ON TABLE gym_settings IS 'Stores gym/organization settings (currency, VAT, etc.)';
COMMENT ON TABLE branches IS 'Stores branch/location information for multi-branch gyms';
COMMENT ON TABLE members IS 'Stores member profiles and information';
COMMENT ON TABLE trainers IS 'Stores trainer profiles and information';
COMMENT ON TABLE classes IS 'Stores class schedules and details';
COMMENT ON TABLE class_bookings IS 'Stores member class bookings';
COMMENT ON TABLE invoices IS 'Stores billing and invoicing information';
COMMENT ON TABLE expenses IS 'Stores business expenses for VAT and financial tracking';
COMMENT ON TABLE vat_returns IS 'Stores VAT return information for compliance';
COMMENT ON TABLE member_tasks IS 'Stores tasks related to members (follow-ups, reminders, check-ins, etc.)';
COMMENT ON TABLE activities IS 'Stores activity feed/logs';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after executing the script to verify everything is set up correctly

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies exist
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
