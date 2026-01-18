# 🔧 Fix "Unable to create your organization" Error

## Problem

The error occurs when a new user tries to sign up. The RLS (Row Level Security) policies are blocking the creation of a tenant because:

1. New users don't have a `tenant_id` yet
2. The `get_user_tenant_id()` function returns NULL for new users
3. The memberships insert policy might be too restrictive

## ✅ Solution: Run This SQL Fix

**Go to Supabase SQL Editor and run this:**

```sql
-- ============================================================================
-- FIX: Signup RLS Policy for Tenants and Memberships
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
```

## 🔍 Verify the Fix

After running the SQL, verify the policies exist:

```sql
-- Check tenants policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'tenants' AND schemaname = 'public';

-- Check memberships policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'memberships' AND schemaname = 'public';
```

You should see:
- `"Authenticated users can create tenants"` with `cmd = 'INSERT'` and `with_check = 'true'`
- `"Users can insert memberships for their tenant"` with `cmd = 'INSERT'`

## 🚀 After Running the Fix

1. **Clear browser cache/cookies** (or use incognito)
2. **Try signing up again**
3. **The organization should be created successfully**

## 📝 Alternative: Full Schema Deployment

If you haven't deployed the full schema yet, run the complete schema:

1. Open `supabase/complete_schema.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"

This will set up everything including the correct RLS policies.

---

**Status:** Ready to fix - Just run the SQL above in Supabase!
