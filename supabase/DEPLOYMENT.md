# Database Deployment Guide

## Quick Deploy

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run Complete Schema**
   - Open `complete_schema.sql`
   - Copy the entire file contents
   - Paste into SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

3. **Verify Deployment**
   Run these queries to verify everything was created:

```sql
-- Check all tables exist (should return 18 tables)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check RLS is enabled (should return 18 rows with rowsecurity = true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policies exist (should return ~70+ policies)
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check RPC functions exist (should return 8 functions)
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND routine_name LIKE 'get_%' OR routine_name LIKE 'calculate_%' OR routine_name LIKE 'generate_%'
ORDER BY routine_name;
```

## What Gets Created

### Tables (18)
- `tenants` - Organization/tenant information
- `memberships` - User-tenant relationships
- `gym_settings` - Gym configuration
- `branches` - Branch/location data
- `trainers` - Trainer profiles
- `members` - Member profiles
- `plans` - Membership plans
- `subscriptions` - Member subscriptions
- `classes` - Class schedules
- `trainer_schedule` - Trainer availability
- `class_bookings` - Class enrollments
- `class_waitlist` - Waitlist entries
- `invoices` - Billing invoices
- `expenses` - Business expenses
- `vat_returns` - VAT return records
- `member_tasks` - Task management
- `activities` - Activity feed
- `health_check` - Health monitoring

### RPC Functions (8)
- `get_user_tenant_id()` - Get current user's tenant
- `get_analytics_overview()` - Dashboard analytics
- `get_member_metrics(period)` - Member statistics
- `get_trainer_metrics(period)` - Trainer statistics
- `get_class_metrics(period)` - Class statistics
- `get_financial_metrics(period)` - Financial statistics
- `calculate_vat_compliance_score(tenant_id)` - VAT compliance
- `generate_vat_return(tenant_id, start, end)` - VAT return generation

### Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Multi-tenant isolation policies
- ✅ Signup-friendly policies (allows tenant/membership creation)
- ✅ All functions use `SECURITY DEFINER` for proper access

## Important Notes

⚠️ **This script will:**
- Drop existing policies (to avoid conflicts)
- Drop existing functions (to recreate them)
- Create all tables if they don't exist
- **NOT** drop existing tables (safe to run multiple times)

⚠️ **If you have existing data:**
- The script uses `CREATE TABLE IF NOT EXISTS` - safe for existing tables
- Policies are dropped and recreated - this is safe
- Functions are replaced - this is safe
- **Your data will NOT be deleted**

## Troubleshooting

### Error: "relation already exists"
- This is normal - the script uses `IF NOT EXISTS`
- Continue execution

### Error: "policy already exists"
- The script drops policies first, so this shouldn't happen
- If it does, manually drop the policy and rerun

### Error: "function already exists"
- The script uses `CREATE OR REPLACE FUNCTION` - should work
- If issues persist, manually drop the function first

### RLS blocking queries
- Verify `get_user_tenant_id()` function exists
- Check that user has a membership record
- Ensure policies were created successfully

## Post-Deployment Checklist

- [ ] All 18 tables created
- [ ] RLS enabled on all tables
- [ ] All policies created (~70+)
- [ ] All 8 RPC functions created
- [ ] Test signup flow (create tenant + membership)
- [ ] Test member creation
- [ ] Test class creation
- [ ] Test invoice creation
- [ ] Verify analytics functions return data

## Rollback

If you need to rollback:
1. Drop policies: See the DROP section at the top of `complete_schema.sql`
2. Drop functions: See the DROP section
3. **DO NOT** drop tables if you have data - instead, just recreate policies/functions
