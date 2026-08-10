-- ============================================================================
-- Fix Missing Policies
-- ============================================================================
-- Run this to add any missing policies

-- First, let's see what we have
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(cmd::text, ', ' ORDER BY cmd) as operations
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Add missing policies (these use IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
  -- HEALTH_CHECK policies (if missing)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'health_check' 
      AND policyname = 'Authenticated users can view health check'
  ) THEN
    CREATE POLICY "Authenticated users can view health check" ON health_check FOR SELECT
      TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'health_check' 
      AND policyname = 'Service role can manage health check'
  ) THEN
    CREATE POLICY "Service role can manage health check" ON health_check FOR ALL
      TO service_role USING (true);
  END IF;

  -- Check for any table missing standard policies
  -- This will identify tables that don't have all 4 standard policies
  FOR rec IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT IN ('health_check')
      AND tablename NOT LIKE 'pg_%'
  LOOP
    -- Check SELECT policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = rec.tablename 
        AND cmd = 'SELECT'
    ) THEN
      RAISE NOTICE 'Missing SELECT policy for table: %', rec.tablename;
    END IF;

    -- Check INSERT policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = rec.tablename 
        AND cmd = 'INSERT'
    ) THEN
      RAISE NOTICE 'Missing INSERT policy for table: %', rec.tablename;
    END IF;

    -- Check UPDATE policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = rec.tablename 
        AND cmd = 'UPDATE'
    ) THEN
      RAISE NOTICE 'Missing UPDATE policy for table: %', rec.tablename;
    END IF;

    -- Check DELETE policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = rec.tablename 
        AND cmd = 'DELETE'
    ) THEN
      RAISE NOTICE 'Missing DELETE policy for table: %', rec.tablename;
    END IF;
  END LOOP;
END $$;

-- After running, check again
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
