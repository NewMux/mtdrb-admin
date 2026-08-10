# Fix: Members Table Query with user_id Error

## Error
```
GET /rest/v1/members?select=id&user_id=eq.dd8338fe-c2f3-4587-bb78-4527b66f434a 400 (Bad Request)
```

## Problem
The `members` table does **not** have a `user_id` column. This query is invalid and causes a 400 Bad Request error.

## Root Cause
This query pattern is **not found in the codebase**, which suggests it might be:
1. Generated dynamically by some middleware
2. Coming from a Supabase PostgREST internal check
3. From a browser extension or dev tool
4. From cached/stale code

## Solution

### Option 1: Add user_id column to members table (NOT RECOMMENDED)
This would break the data model. The `members` table is for **gym members** (customers), not auth users. Auth users are in the `memberships` table.

### Option 2: Find and fix the source (RECOMMENDED)
1. Check browser network tab to see the full request stack trace
2. Check if any middleware/interceptors are adding this filter
3. Check Supabase PostgREST logs for internal queries
4. Search for any dynamic query generation code

### Option 3: Suppress the error (TEMPORARY)
Add error handling to catch and ignore this specific 400 error if it's not critical.

## Correct Query Pattern

If you need to check if a user is a gym member:
```typescript
// ❌ WRONG - members table doesn't have user_id
supabase.from("members").select("id").eq("user_id", user.id)

// ✅ CORRECT - Query memberships table for auth users
supabase.from("memberships").select("tenant_id").eq("user_id", user.id)

// ✅ CORRECT - Query members table by tenant_id
supabase.from("members").select("id").eq("tenant_id", tenantId)
```

## Next Steps
1. Monitor the error in production to see if it affects functionality
2. Check Supabase logs for more context
3. Use browser DevTools to capture the full stack trace
4. If the error is non-critical, add error handling to suppress it
