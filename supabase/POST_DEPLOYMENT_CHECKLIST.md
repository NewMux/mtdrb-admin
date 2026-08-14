# Post-Deployment Checklist

## ✅ Immediate Verification Steps

### 1. Verify Tables Created
Run this query to confirm all 18 tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected:** Should return 18 tables:
- activities
- branches
- class_bookings
- class_waitlist
- classes
- expenses
- gym_settings
- health_check
- invoices
- member_tasks
- members
- memberships
- plans
- subscriptions
- tenants
- trainer_schedule
- trainers
- vat_returns

### 2. Verify RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected:** All 18 tables should have `rowsecurity = true`

### 3. Verify Policies Created
```sql
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Expected:** Should return ~72 policies (4 per table × 18 tables)

### 4. Verify Functions Created
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected:** Should return 12 functions:
- calculate_vat_compliance_score
- create_tenant_with_membership
- generate_vat_return
- get_analytics_overview
- get_class_metrics
- get_financial_metrics
- get_member_full_name
- get_member_metrics
- get_trainer_full_name
- get_trainer_metrics
- get_user_tenant_id
- update_updated_at_column

### 5. Test Helper Functions
```sql
-- This should return NULL if no user is logged in (expected)
SELECT get_user_tenant_id();

-- Test analytics function (will return empty data if no tenant)
SELECT get_analytics_overview();
```

### 6. Verify Indexes Created
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'invoices', 'members', 'classes')
ORDER BY tablename, indexname;
```

**Expected:** Should see indexes including:
- `idx_expenses_created_by` on expenses table
- `idx_invoices_tenant_status_due` on invoices table
- `idx_members_tenant_status_membership` on members table
- `idx_classes_tenant_start_status` on classes table

---

## 🔍 Test Core Functionality

### 7. Test Tenant Creation (Signup Flow)
```sql
-- This simulates the signup process
-- Note: You need to be authenticated to run this
SELECT create_tenant_with_membership(
  'Test Gym',
  'admin',
  '{}'::jsonb
);
```

**Expected:** Should return a UUID (the new tenant_id)

### 8. Test RLS Policies
```sql
-- Try to select from a table (should only see your tenant's data)
SELECT * FROM members LIMIT 5;
SELECT * FROM trainers LIMIT 5;
SELECT * FROM classes LIMIT 5;
```

**Expected:** Should only return rows for your tenant (or empty if no data)

### 9. Verify New Columns Exist
```sql
-- Check expenses table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
  AND column_name IN ('title', 'created_by', 'updated_by', 'recurring', 'country_code')
ORDER BY column_name;
```

**Expected:** All 5 columns should exist

```sql
-- Check members table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' 
  AND column_name IN ('gender', 'date_of_birth', 'national_id', 'profile_picture_url', 'address')
ORDER BY column_name;
```

**Expected:** All 5 columns should exist

```sql
-- Check invoices table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
  AND column_name IN ('invoice_number', 'subtotal', 'discount_total', 'attachments')
ORDER BY column_name;
```

**Expected:** All 4 columns should exist

---

## 🚀 Application Code Updates

### 10. Update TypeScript Types (if needed)
Check if your TypeScript interfaces match the new schema:

- **Members**: Verify `gender`, `date_of_birth`, `national_id`, etc. are in your types
- **Expenses**: Verify `title`, `created_by`, `recurring`, etc. are in your types
- **Invoices**: Verify `invoice_number`, `subtotal`, `discount_total`, `attachments` are in your types

### 11. Test Application Features
Test these features in your application:

- [ ] Member creation with new fields (gender, date_of_birth, etc.)
- [ ] Expense creation with new fields (title, recurring, etc.)
- [ ] Invoice creation with invoice_number
- [ ] Trainer profile with bio and profile_image_url
- [ ] Analytics dashboard (should use new functions)

### 12. Update Supabase Client Types
If you're using Supabase's TypeScript generation:

```bash
# Generate new types from your schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

---

## 📝 Data Migration (if upgrading existing database)

### 13. Migrate Existing Data

If you had existing data, you may need to:

**Expenses:**
```sql
-- If expenses had description but no title, this should already be done
-- But verify:
SELECT COUNT(*) FROM expenses WHERE title IS NULL;
-- Should return 0
```

**Invoices:**
```sql
-- Generate invoice numbers for existing invoices
UPDATE invoices 
SET invoice_number = 'INV-' || tenant_id::text || '-' || LPAD(id::text, 8, '0')
WHERE invoice_number IS NULL;
```

**Members:**
```sql
-- If you had a 'name' field, split it into first_name and last_name
-- (This should be done manually based on your data structure)
```

---

## 🔒 Security Verification

### 14. Test RLS Isolation
```sql
-- Create a test scenario with multiple tenants (if possible)
-- Verify users can only see their own tenant's data
```

### 15. Verify Function Security
```sql
-- Check that functions are SECURITY DEFINER where appropriate
SELECT 
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
```

**Expected:** Analytics functions should be `DEFINER`

---

## 📊 Performance Check

### 16. Verify Indexes are Being Used
```sql
-- Check index usage (after some queries have run)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## ✅ Final Checklist

- [ ] All 18 tables created
- [ ] RLS enabled on all tables
- [ ] All policies created (~72)
- [ ] All functions created (12)
- [ ] New columns exist in expenses, members, invoices
- [ ] Indexes created (especially composite indexes)
- [ ] Triggers working (updated_at fields)
- [ ] Application code updated
- [ ] TypeScript types regenerated
- [ ] Test signup flow works
- [ ] Test CRUD operations work
- [ ] Analytics functions return data

---

## 🐛 Troubleshooting

### If you see errors:

1. **"Column does not exist"**
   - Run the migration block again for that specific table
   - Check if table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'table_name';`

2. **"Policy already exists"**
   - This is fine, the script uses `CREATE POLICY` which will error if exists
   - Use `CREATE POLICY IF NOT EXISTS` or drop first

3. **"Function already exists"**
   - This is fine, functions use `CREATE OR REPLACE`

4. **RLS blocking queries**
   - Verify you're authenticated
   - Check your membership exists: `SELECT * FROM memberships WHERE user_id = auth.uid();`

---

## 📚 Next Steps

1. **Update Application Code**
   - Use new fields in forms
   - Update API calls to include new fields
   - Update TypeScript interfaces

2. **Test End-to-End**
   - Signup flow
   - Member creation
   - Invoice generation
   - Expense tracking
   - Analytics dashboard

3. **Performance Monitoring**
   - Monitor query performance
   - Check index usage
   - Optimize slow queries

4. **Documentation**
   - Update API documentation
   - Document new fields
   - Create migration guide for team

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ All verification queries pass
- ✅ Application can create/read/update/delete records
- ✅ RLS policies prevent cross-tenant data access
- ✅ Analytics functions return correct data
- ✅ No errors in application logs
