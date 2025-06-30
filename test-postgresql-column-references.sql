-- TEST PostgreSQL System Catalog Column References
-- Run this first to validate all column names are correct

-- Test 1: Check pg_stat_user_tables columns
SELECT 
  'pg_stat_user_tables test' as test_name,
  schemaname,
  relname,  -- NOT tablename
  seq_scan,
  idx_scan,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  last_analyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
LIMIT 3;

-- Test 2: Check pg_stat_user_indexes columns  
SELECT 
  'pg_stat_user_indexes test' as test_name,
  schemaname,
  relname,        -- NOT tablename
  indexrelname,   -- NOT indexname
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
LIMIT 3;

-- Test 3: Check pg_policies columns
SELECT 
  'pg_policies test' as test_name,
  schemaname,
  tablename,  -- This one DOES use tablename
  policyname,
  cmd,
  substr(qual, 1, 50) as qual_preview
FROM pg_policies 
WHERE schemaname = 'public'
LIMIT 3;

-- Test 4: Check pg_tables columns
SELECT 
  'pg_tables test' as test_name,
  schemaname,
  tablename  -- This one DOES use tablename
FROM pg_tables 
WHERE schemaname = 'public'
LIMIT 3;

-- SUCCESS: If all queries above run without errors, 
-- then the verification script should work correctly!