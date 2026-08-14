-- ============================================================================
-- Migration: Update Schema for MTDRB Admin
-- ============================================================================
-- 
-- This migration script updates an existing database to match the new schema.
-- Run this AFTER running the main schema.sql if you have an existing database.
--
-- Changes:
-- 1. Add new tables: gym_settings, branches, expenses, vat_returns
-- 2. Update invoices table with additional fields
-- 3. Update members table with assigned_branch_id and membership_status
-- 4. Add RLS policies for new tables
-- 5. Add indexes for new fields
--
-- ============================================================================

-- ============================================================================
-- ADD NEW TABLES
-- ============================================================================

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

-- ============================================================================
-- UPDATE EXISTING TABLES
-- ============================================================================

-- Update MEMBERS table
DO $$ 
BEGIN
  -- Add membership_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'members' AND column_name = 'membership_status') THEN
    ALTER TABLE members ADD COLUMN membership_status TEXT DEFAULT 'active' 
      CHECK (membership_status IN ('active', 'inactive', 'trial', 'expired', 'suspended'));
  END IF;

  -- Add assigned_branch_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'members' AND column_name = 'assigned_branch_id') THEN
    ALTER TABLE members ADD COLUMN assigned_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for new member columns
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON members(membership_status);
CREATE INDEX IF NOT EXISTS idx_members_assigned_branch_id ON members(assigned_branch_id);

-- Update INVOICES table
DO $$ 
BEGIN
  -- Add type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'type') THEN
    ALTER TABLE invoices ADD COLUMN type TEXT DEFAULT 'membership' 
      CHECK (type IN ('membership', 'class', 'personal_training', 'product', 'other'));
  END IF;

  -- Add issue_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'issue_date') THEN
    ALTER TABLE invoices ADD COLUMN issue_date DATE;
  END IF;

  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'payment_method') THEN
    ALTER TABLE invoices ADD COLUMN payment_method TEXT 
      CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'other'));
  END IF;

  -- Add total column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'total') THEN
    ALTER TABLE invoices ADD COLUMN total NUMERIC(10, 2) CHECK (total >= 0);
  END IF;

  -- Add paid_amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'paid_amount') THEN
    ALTER TABLE invoices ADD COLUMN paid_amount NUMERIC(10, 2) DEFAULT 0 CHECK (paid_amount >= 0);
  END IF;

  -- Add vat_total column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'vat_total') THEN
    ALTER TABLE invoices ADD COLUMN vat_total NUMERIC(10, 2) DEFAULT 0 CHECK (vat_total >= 0);
  END IF;

  -- Add line_items column if it doesn't exist (items already exists, but add line_items as alias)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'line_items') THEN
    ALTER TABLE invoices ADD COLUMN line_items JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for new invoice columns
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);

-- ============================================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_returns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ADD RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- GYM_SETTINGS POLICIES
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gym_settings' AND policyname = 'Users can view gym settings for their tenant') THEN
    CREATE POLICY "Users can view gym settings for their tenant"
      ON gym_settings FOR SELECT
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gym_settings' AND policyname = 'Users can insert gym settings for their tenant') THEN
    CREATE POLICY "Users can insert gym settings for their tenant"
      ON gym_settings FOR INSERT
      WITH CHECK (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gym_settings' AND policyname = 'Users can update gym settings for their tenant') THEN
    CREATE POLICY "Users can update gym settings for their tenant"
      ON gym_settings FOR UPDATE
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gym_settings' AND policyname = 'Users can delete gym settings for their tenant') THEN
    CREATE POLICY "Users can delete gym settings for their tenant"
      ON gym_settings FOR DELETE
      USING (tenant_id = get_user_tenant_id());
  END IF;
END $$;

-- BRANCHES POLICIES
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'Users can view branches for their tenant') THEN
    CREATE POLICY "Users can view branches for their tenant"
      ON branches FOR SELECT
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'Users can insert branches for their tenant') THEN
    CREATE POLICY "Users can insert branches for their tenant"
      ON branches FOR INSERT
      WITH CHECK (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'Users can update branches for their tenant') THEN
    CREATE POLICY "Users can update branches for their tenant"
      ON branches FOR UPDATE
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'Users can delete branches for their tenant') THEN
    CREATE POLICY "Users can delete branches for their tenant"
      ON branches FOR DELETE
      USING (tenant_id = get_user_tenant_id());
  END IF;
END $$;

-- EXPENSES POLICIES
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can view expenses for their tenant') THEN
    CREATE POLICY "Users can view expenses for their tenant"
      ON expenses FOR SELECT
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can insert expenses for their tenant') THEN
    CREATE POLICY "Users can insert expenses for their tenant"
      ON expenses FOR INSERT
      WITH CHECK (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can update expenses for their tenant') THEN
    CREATE POLICY "Users can update expenses for their tenant"
      ON expenses FOR UPDATE
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can delete expenses for their tenant') THEN
    CREATE POLICY "Users can delete expenses for their tenant"
      ON expenses FOR DELETE
      USING (tenant_id = get_user_tenant_id());
  END IF;
END $$;

-- VAT_RETURNS POLICIES
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vat_returns' AND policyname = 'Users can view VAT returns for their tenant') THEN
    CREATE POLICY "Users can view VAT returns for their tenant"
      ON vat_returns FOR SELECT
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vat_returns' AND policyname = 'Users can insert VAT returns for their tenant') THEN
    CREATE POLICY "Users can insert VAT returns for their tenant"
      ON vat_returns FOR INSERT
      WITH CHECK (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vat_returns' AND policyname = 'Users can update VAT returns for their tenant') THEN
    CREATE POLICY "Users can update VAT returns for their tenant"
      ON vat_returns FOR UPDATE
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vat_returns' AND policyname = 'Users can delete VAT returns for their tenant') THEN
    CREATE POLICY "Users can delete VAT returns for their tenant"
      ON vat_returns FOR DELETE
      USING (tenant_id = get_user_tenant_id());
  END IF;
END $$;

-- ============================================================================
-- ADD TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers if they don't exist
DROP TRIGGER IF EXISTS update_gym_settings_updated_at ON gym_settings;
CREATE TRIGGER update_gym_settings_updated_at
  BEFORE UPDATE ON gym_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ADD MEMBER_TASKS TABLE
-- ============================================================================

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

-- Enable RLS
ALTER TABLE member_tasks ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_tasks' AND policyname = 'Users can view member tasks from their tenant') THEN
    CREATE POLICY "Users can view member tasks from their tenant"
      ON member_tasks FOR SELECT
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_tasks' AND policyname = 'Users can insert member tasks for their tenant') THEN
    CREATE POLICY "Users can insert member tasks for their tenant"
      ON member_tasks FOR INSERT
      WITH CHECK (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_tasks' AND policyname = 'Users can update member tasks from their tenant') THEN
    CREATE POLICY "Users can update member tasks from their tenant"
      ON member_tasks FOR UPDATE
      USING (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_tasks' AND policyname = 'Users can delete member tasks from their tenant') THEN
    CREATE POLICY "Users can delete member tasks from their tenant"
      ON member_tasks FOR DELETE
      USING (tenant_id = get_user_tenant_id());
  END IF;
END $$;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_member_tasks_updated_at ON member_tasks;
CREATE TRIGGER update_member_tasks_updated_at
  BEFORE UPDATE ON member_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
