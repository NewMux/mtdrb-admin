-- ============================================================================
-- MIGRATION: Fix Memberships RLS INSERT policy
-- ============================================================================
-- 
-- DESCRIPTION:
-- Replaces the insecure "Users can insert memberships for their tenant" policy.
-- The previous policy allowed ANY authenticated user to insert their own user ID
-- into ANY tenant_id, allowing malicious users to join other organizations and
-- bypass tenant isolation entirely.
--
-- FIX:
-- Restricts self-insertion to ONLY the tenant_id defined in the user's JWT metadata
-- (which is signed and cannot be altered by the client), while still allowing
-- tenant administrators to invite/add new members to their own tenant.
--
-- ============================================================================

-- Drop the old insecure policy
DROP POLICY IF EXISTS "Users can insert memberships for their tenant" ON memberships;

-- Create the new secure policy
CREATE POLICY "Users can insert memberships for their tenant"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Case A: The user is registering their own membership, which must match the tenant_id 
    -- stored in their cryptographically signed Supabase Auth JWT claims (user_metadata)
    (
      user_id = auth.uid() 
      AND 
      tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    )
    OR
    -- Case B: An existing user/administrator of the tenant is adding a membership record
    -- to their own tenant (verified via get_user_tenant_id())
    (
      tenant_id = get_user_tenant_id()
    )
  );

-- Double-check that RLS remains enabled on the memberships table
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
