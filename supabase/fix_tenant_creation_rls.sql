-- ============================================================================
-- FIX: Tenant Creation RLS Policy Issue
-- ============================================================================
-- 
-- This script adds a SECURITY DEFINER function to create tenants and memberships
-- in a single transaction, bypassing RLS policies. This is the recommended
-- pattern for initial organization setup during signup/onboarding.
--
-- Run this in your Supabase SQL Editor if you're experiencing RLS policy
-- violations when creating organizations.
-- ============================================================================

-- Create tenant with initial membership (for signup/onboarding)
-- This function bypasses RLS and is used during initial organization setup
CREATE OR REPLACE FUNCTION create_tenant_with_membership(
  p_tenant_name TEXT,
  p_user_role TEXT DEFAULT 'admin',
  p_tenant_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Create the tenant
  INSERT INTO tenants (name, metadata)
  VALUES (p_tenant_name, p_tenant_metadata)
  RETURNING id INTO v_tenant_id;
  
  -- Create the membership linking user to tenant
  INSERT INTO memberships (user_id, tenant_id, role)
  VALUES (v_user_id, v_tenant_id, p_user_role);
  
  RETURN v_tenant_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_tenant_with_membership(TEXT, TEXT, JSONB) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Test the function (replace with actual values):
-- SELECT create_tenant_with_membership('Test Gym', 'admin', '{}'::jsonb);
-- ============================================================================
