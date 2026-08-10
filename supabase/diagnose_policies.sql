-- ============================================================================
-- Diagnose Missing Policies
-- ============================================================================
-- Run this to see exactly which policies are missing

-- Show policy count per table
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(cmd::text, ', ' ORDER BY cmd) as operations,
  CASE 
    WHEN tablename = 'health_check' THEN 2
    ELSE 4
  END as expected_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY 
  CASE 
    WHEN COUNT(*) < CASE WHEN tablename = 'health_check' THEN 2 ELSE 4 END THEN 0
    ELSE 1
  END,
  tablename;

-- Show detailed breakdown
SELECT 
  tablename,
  cmd as operation,
  policyname,
  CASE 
    WHEN cmd = 'SELECT' THEN '✓'
    WHEN cmd = 'INSERT' THEN '✓'
    WHEN cmd = 'UPDATE' THEN '✓'
    WHEN cmd = 'DELETE' THEN '✓'
    WHEN cmd = 'ALL' THEN '✓'
    ELSE '?'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Find tables missing specific operations
WITH table_ops AS (
  SELECT 
    t.tablename,
    'SELECT' as required_op
  FROM pg_tables t
  WHERE t.schemaname = 'public' 
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename != 'health_check'
  
  UNION ALL
  
  SELECT 
    t.tablename,
    'INSERT' as required_op
  FROM pg_tables t
  WHERE t.schemaname = 'public' 
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename != 'health_check'
  
  UNION ALL
  
  SELECT 
    t.tablename,
    'UPDATE' as required_op
  FROM pg_tables t
  WHERE t.schemaname = 'public' 
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename != 'health_check'
  
  UNION ALL
  
  SELECT 
    t.tablename,
    'DELETE' as required_op
  FROM pg_tables t
  WHERE t.schemaname = 'public' 
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename != 'health_check'
)
SELECT 
  to_ops.tablename,
  to_ops.required_op as missing_operation
FROM table_ops to_ops
LEFT JOIN pg_policies p 
  ON p.schemaname = 'public' 
  AND p.tablename = to_ops.tablename 
  AND p.cmd::text = to_ops.required_op
WHERE p.policyname IS NULL
ORDER BY to_ops.tablename, to_ops.required_op;
