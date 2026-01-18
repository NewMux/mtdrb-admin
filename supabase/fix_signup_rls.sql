-- ============================================================================
-- FIX: Signup RLS Policy for Tenants and Memberships
-- ============================================================================
-- 
-- Run this SQL in your Supabase SQL Editor to fix the signup flow.
-- This ensures new users can create their organization during signup.
--
-- ============================================================================

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Users can insert memberships for their tenant" ON memberships;

-- ============================================================================
-- TENANTS INSERT POLICY
-- ============================================================================
-- Allow ANY authenticated user to create a tenant
-- This is required for new users who don't have a tenant yet

CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- MEMBERSHIPS INSERT POLICY  
-- ============================================================================
-- Allow users to create their own membership OR memberships for their tenant
-- The first condition handles the signup case (user creating their first membership)
-- The second condition handles normal case (admin adding members to their tenant)

CREATE POLICY "Users can insert memberships for their tenant"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is creating their own membership (signup case)
    user_id = auth.uid()
    OR
    -- Allow if tenant_id matches user's existing tenant (normal case)
    tenant_id = get_user_tenant_id()
  );

-- ============================================================================
-- VERIFY POLICIES EXIST
-- ============================================================================
-- Run this query to verify the policies were created:
-- SELECT schemaname, tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('tenants', 'memberships') AND policyname LIKE '%insert%';

-- ============================================================================
-- END OF FIX
-- ============================================================================
