-- ============================================================================
-- Check Missing Policies
-- ============================================================================
-- Run this to identify which policies are missing

-- Expected policies per table (most tables should have 4: SELECT, INSERT, UPDATE, DELETE)
WITH expected_policies AS (
  SELECT 
    tablename,
    CASE 
      WHEN tablename = 'health_check' THEN 2  -- Special case: SELECT + service_role ALL
      ELSE 4  -- Standard: SELECT, INSERT, UPDATE, DELETE
    END as expected_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
),
actual_policies AS (
  SELECT 
    tablename,
    COUNT(*) as actual_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
  e.tablename,
  e.expected_count,
  COALESCE(a.actual_count, 0) as actual_count,
  e.expected_count - COALESCE(a.actual_count, 0) as missing_count
FROM expected_policies e
LEFT JOIN actual_policies a ON e.tablename = a.tablename
WHERE e.expected_count - COALESCE(a.actual_count, 0) > 0
ORDER BY missing_count DESC, e.tablename;

-- Also show all policies grouped by table
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
