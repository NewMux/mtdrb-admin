-- ============================================================================
-- Create member_tasks Table
-- ============================================================================
-- Run this script in your Supabase SQL Editor to create the member_tasks table
-- This table stores tasks related to members (follow-ups, reminders, check-ins, etc.)

-- Create the member_tasks table
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

-- Enable Row Level Security
ALTER TABLE member_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with existence checks)
DO $$ 
BEGIN
  -- Users can view member tasks from their tenant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_tasks' AND policyname = 'Users can view member tasks from their tenant') THEN
    CREATE POLICY "Users can view member tasks from their tenant"
      ON member_tasks FOR SELECT
      USING (tenant_id = get_user_tenant_id());
  END IF;

  -- Users can insert member tasks for their tenant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_tasks' AND policyname = 'Users can insert member tasks for their tenant') THEN
    CREATE POLICY "Users can insert member tasks for their tenant"
      ON member_tasks FOR INSERT
      WITH CHECK (tenant_id = get_user_tenant_id());
  END IF;

  -- Users can update member tasks from their tenant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_tasks' AND policyname = 'Users can update member tasks from their tenant') THEN
    CREATE POLICY "Users can update member tasks from their tenant"
      ON member_tasks FOR UPDATE
      USING (tenant_id = get_user_tenant_id());
  END IF;

  -- Users can delete member tasks from their tenant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_tasks' AND policyname = 'Users can delete member tasks from their tenant') THEN
    CREATE POLICY "Users can delete member tasks from their tenant"
      ON member_tasks FOR DELETE
      USING (tenant_id = get_user_tenant_id());
  END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_member_tasks_updated_at ON member_tasks;
CREATE TRIGGER update_member_tasks_updated_at
  BEFORE UPDATE ON member_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE member_tasks IS 'Stores tasks related to members (follow-ups, reminders, check-ins, etc.)';

-- ============================================================================
-- Verification
-- ============================================================================
-- Run this to verify the table was created:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'member_tasks';
-- 
-- Run this to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'member_tasks';
-- 
-- Run this to verify policies exist:
-- SELECT policyname FROM pg_policies WHERE tablename = 'member_tasks';
