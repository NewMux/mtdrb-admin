# 🔧 Fix Deployment Errors

## Error Analysis

Your deployment is showing these errors:

1. **406 (Not Acceptable)** - Missing `Accept` header
2. **403 (Forbidden)** - RLS policies blocking access  
3. **400 (Bad Request)** - Invalid query parameter (`user_id` on `members` table)

---

## ✅ Fix 1: Added Missing Headers

I've updated `src/supabaseClient.ts` to include required headers:
- `Accept: application/json`
- `Content-Type: application/json`
- `Prefer: return=representation`

**Status:** ✅ Fixed in code

---

## ⚠️ Fix 2: Database Schema & RLS Policies

### Critical: Deploy Database Schema

The 403 and 400 errors suggest the database schema isn't fully deployed or RLS policies are missing.

**Steps:**

1. **Go to Supabase SQL Editor:**
   - https://app.supabase.com → Your Project → SQL Editor

2. **Run the complete schema:**
   - Open `supabase/complete_schema.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify RLS is enabled:**
   ```sql
   -- Check if RLS is enabled on key tables
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('members', 'memberships', 'tenants');
   ```

4. **Verify RLS policies exist:**
   ```sql
   -- Check policies
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE schemaname = 'public'
   AND tablename IN ('members', 'memberships', 'tenants');
   ```

---

## 🔍 Fix 3: Check Query Issues

The error shows a query like:
```
/members?select=id&user_id=eq.ed4c32d2-2be1-411f-8548-2148542620c3
```

**Problem:** The `members` table doesn't have a `user_id` column. This query is invalid.

**Solution:** Find where this query is being made and fix it. It should probably be:
- Filtering by `tenant_id` instead
- Or querying a different table (like `memberships` which has `user_id`)

---

## 🚀 Redeploy After Fixes

1. **Commit the header fix:**
   ```bash
   git add src/supabaseClient.ts
   git commit -m "Fix: Add required Supabase API headers"
   git push
   ```

2. **Redeploy to Vercel:**
   ```bash
   vercel --prod
   ```

   Or it will auto-redeploy on push if connected to Git.

---

## ✅ Verification Steps

After deploying database schema and redeploying app:

1. **Check browser console** - Should see fewer errors
2. **Test signup/login** - Should work now
3. **Test main features** - Members, Classes, etc.
4. **Check Supabase logs** - Monitor for any remaining issues

---

## 🆘 If Errors Persist

### Check Environment Variables
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Make sure they're set for Production in Vercel

### Check Database
- Verify all tables exist
- Verify RLS policies are active
- Check Supabase logs for detailed errors

### Check Query Logic
- Find queries using `user_id` on `members` table
- Fix to use correct column (`tenant_id` or query `memberships` instead)

---

## 📝 Next Steps

1. ✅ Code fix applied (headers)
2. ⚠️ Deploy database schema (CRITICAL)
3. ⚠️ Find and fix `user_id` query on members table
4. ⚠️ Redeploy application
5. ⚠️ Test and verify

---

**Status:** Code fix ready, database schema deployment required
