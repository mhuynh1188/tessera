-- SUPABASE PERFORMANCE VERIFICATION SCRIPT
-- Use this script to verify the performance optimization results
-- Run BEFORE and AFTER applying the comprehensive performance fixes

-- =============================================================================
-- SECTION 1: RLS POLICY ANALYSIS
-- =============================================================================

-- 1.1 Check for unoptimized RLS policies (should show auth.uid() vs cached version)
SELECT 
  'RLS_POLICY_CHECK' as check_type,
  schemaname, 
  tablename, 
  policyname,
  cmd as policy_command,
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' 
    THEN '❌ UNOPTIMIZED - Uses auth.uid()'
    WHEN qual LIKE '%(select auth.uid())%' 
    THEN '✅ OPTIMIZED - Uses cached auth.uid()'
    WHEN qual IS NULL OR qual = ''
    THEN '⚠️ NO_CONDITION - Check manually'
    ELSE '🔍 OTHER - Review manually'
  END as optimization_status,
  LENGTH(qual) as policy_complexity,
  qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY 
  CASE WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' THEN 1 ELSE 2 END,
  tablename, 
  policyname;

-- 1.2 Count policies by optimization status
SELECT 
  'POLICY_SUMMARY' as check_type,
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' 
    THEN 'UNOPTIMIZED'
    WHEN qual LIKE '%(select auth.uid())%' 
    THEN 'OPTIMIZED'
    ELSE 'OTHER'
  END as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY 
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' 
    THEN 'UNOPTIMIZED'
    WHEN qual LIKE '%(select auth.uid())%' 
    THEN 'OPTIMIZED'
    ELSE 'OTHER'
  END
ORDER BY policy_count DESC;

-- 1.3 Check for multiple policies on same table/command (duplicate policies)
SELECT 
  'DUPLICATE_POLICIES' as check_type,
  tablename,
  cmd,
  COUNT(*) as policy_count,
  array_agg(policyname) as policy_names,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ MULTIPLE_POLICIES'
    ELSE '✅ SINGLE_POLICY'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, tablename;

-- =============================================================================
-- SECTION 2: INDEX ANALYSIS
-- =============================================================================

-- 2.1 Check for duplicate indexes (same columns, different names)
WITH index_columns AS (
  SELECT 
    schemaname,
    tablename,
    indexname,
    array_agg(attname ORDER BY attnum) as columns
  FROM pg_indexes pi
  JOIN pg_class c ON c.relname = pi.indexname
  JOIN pg_index i ON i.indexrelid = c.oid
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE schemaname = 'public'
  GROUP BY schemaname, tablename, indexname
)
SELECT 
  'DUPLICATE_INDEXES' as check_type,
  tablename,
  columns,
  array_agg(indexname) as index_names,
  COUNT(*) as duplicate_count,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ DUPLICATES_FOUND'
    ELSE '✅ NO_DUPLICATES'
  END as status
FROM index_columns
GROUP BY tablename, columns
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, tablename;

-- 2.2 Check index usage statistics
SELECT 
  'INDEX_USAGE' as check_type,
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  CASE 
    WHEN idx_scan = 0 THEN '❌ NEVER_USED'
    WHEN idx_scan < 10 THEN '⚠️ RARELY_USED'
    WHEN idx_scan < 100 THEN '🔍 OCCASIONALLY_USED'
    ELSE '✅ FREQUENTLY_USED'
  END as usage_status
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- 2.3 Check for missing indexes on foreign keys
SELECT 
  'FOREIGN_KEY_INDEXES' as check_type,
  t.table_name,
  kcu.column_name as fk_column,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes pi 
      WHERE pi.schemaname = 'public' 
      AND pi.tablename = t.table_name 
      AND (pi.indexdef LIKE '%' || kcu.column_name || '%')
    ) THEN '✅ INDEXED'
    ELSE '❌ MISSING_INDEX'
  END as index_status
FROM information_schema.table_constraints t
JOIN information_schema.key_column_usage kcu 
  ON t.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = t.constraint_name
WHERE t.constraint_type = 'FOREIGN KEY'
  AND t.table_schema = 'public'
ORDER BY 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes pi 
    WHERE pi.schemaname = 'public' 
    AND pi.tablename = t.table_name 
    AND (pi.indexdef LIKE '%' || kcu.column_name || '%')
  ) THEN 2 ELSE 1 END,
  t.table_name;

-- =============================================================================
-- SECTION 3: TABLE PERFORMANCE STATISTICS
-- =============================================================================

-- 3.1 Table scan vs index usage ratios
SELECT 
  'TABLE_PERFORMANCE' as check_type,
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as seq_tuples_read,
  idx_scan as index_scans,
  idx_tup_fetch as idx_tuples_fetched,
  CASE 
    WHEN seq_scan + idx_scan = 0 THEN 0
    ELSE ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2)
  END as index_usage_ratio,
  CASE 
    WHEN seq_scan + idx_scan = 0 THEN 0
    ELSE ROUND(100.0 * seq_scan / (seq_scan + idx_scan), 2)
  END as seq_scan_ratio,
  CASE 
    WHEN seq_scan + idx_scan = 0 THEN '⚠️ NO_USAGE'
    WHEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2) > 80 THEN '✅ GOOD_INDEX_USAGE'
    WHEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2) > 60 THEN '🔍 MODERATE_INDEX_USAGE'
    ELSE '❌ POOR_INDEX_USAGE'
  END as performance_status,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN seq_scan + idx_scan = 0 THEN 3
    WHEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2) > 60 THEN 2
    ELSE 1
  END,
  pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3.2 Table modification statistics
SELECT 
  'TABLE_MODIFICATIONS' as check_type,
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_tup_hot_upd as hot_updates,
  CASE 
    WHEN n_tup_upd > 0 THEN ROUND(100.0 * n_tup_hot_upd / n_tup_upd, 2)
    ELSE 0
  END as hot_update_ratio,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- =============================================================================
-- SECTION 4: SLOW QUERY ANALYSIS (requires pg_stat_statements)
-- =============================================================================

-- 4.1 Check if pg_stat_statements extension is available
SELECT 
  'EXTENSION_CHECK' as check_type,
  name,
  installed_version,
  CASE 
    WHEN installed_version IS NOT NULL THEN '✅ AVAILABLE'
    ELSE '❌ NOT_INSTALLED'
  END as status
FROM pg_available_extensions 
WHERE name = 'pg_stat_statements';

-- 4.2 Top slow queries (if pg_stat_statements is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    RAISE NOTICE 'pg_stat_statements is available - running slow query analysis';
  ELSE
    RAISE NOTICE 'pg_stat_statements not available - skipping slow query analysis';
  END IF;
END $$;

-- Run this separately if pg_stat_statements is available:
/*
SELECT 
  'SLOW_QUERIES' as check_type,
  LEFT(query, 100) as query_sample,
  calls,
  ROUND(total_exec_time::numeric, 2) as total_time_ms,
  ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
  ROUND(max_exec_time::numeric, 2) as max_time_ms,
  CASE 
    WHEN mean_exec_time > 1000 THEN '❌ VERY_SLOW'
    WHEN mean_exec_time > 500 THEN '⚠️ SLOW'
    WHEN mean_exec_time > 100 THEN '🔍 MODERATE'
    ELSE '✅ FAST'
  END as performance_status
FROM pg_stat_statements
WHERE calls > 10  -- Only queries called more than 10 times
ORDER BY mean_exec_time DESC
LIMIT 20;
*/

-- =============================================================================
-- SECTION 5: SECURITY AND RLS STATUS
-- =============================================================================

-- 5.1 Check RLS status on all tables
SELECT 
  'RLS_STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS_ENABLED'
    ELSE '❌ RLS_DISABLED'
  END as security_status,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY 
  CASE WHEN rowsecurity THEN 2 ELSE 1 END,
  tablename;

-- =============================================================================
-- SECTION 6: PERFORMANCE SUMMARY REPORT
-- =============================================================================

-- 6.1 Overall performance summary
WITH performance_metrics AS (
  SELECT 
    COUNT(*) as total_tables,
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as rls_enabled_tables,
    AVG(CASE 
      WHEN st.seq_scan + st.idx_scan = 0 THEN 0
      ELSE 100.0 * st.idx_scan / (st.seq_scan + st.idx_scan)
    END) as avg_index_usage_ratio
  FROM pg_tables t
  LEFT JOIN pg_stat_user_tables st ON t.tablename = st.tablename AND t.schemaname = st.schemaname
  WHERE t.schemaname = 'public'
),
policy_metrics AS (
  SELECT 
    COUNT(*) as total_policies,
    SUM(CASE 
      WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' 
      THEN 1 ELSE 0 
    END) as unoptimized_policies,
    SUM(CASE 
      WHEN qual LIKE '%(select auth.uid())%' 
      THEN 1 ELSE 0 
    END) as optimized_policies
  FROM pg_policies 
  WHERE schemaname = 'public'
),
index_metrics AS (
  SELECT 
    COUNT(*) as total_indexes,
    SUM(CASE WHEN idx_scan = 0 THEN 1 ELSE 0 END) as unused_indexes,
    AVG(idx_scan) as avg_index_scans
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
)
SELECT 
  'PERFORMANCE_SUMMARY' as check_type,
  pm.total_tables,
  pm.rls_enabled_tables,
  ROUND(pm.avg_index_usage_ratio, 2) as avg_index_usage_ratio,
  pol.total_policies,
  pol.unoptimized_policies,
  pol.optimized_policies,
  ROUND(100.0 * pol.optimized_policies / NULLIF(pol.total_policies, 0), 2) as policy_optimization_ratio,
  im.total_indexes,
  im.unused_indexes,
  ROUND(im.avg_index_scans, 2) as avg_index_scans,
  CASE 
    WHEN pol.unoptimized_policies = 0 AND pm.avg_index_usage_ratio > 80 AND im.unused_indexes < 5
    THEN '✅ EXCELLENT_PERFORMANCE'
    WHEN pol.unoptimized_policies < 3 AND pm.avg_index_usage_ratio > 60 AND im.unused_indexes < 10
    THEN '🔍 GOOD_PERFORMANCE'
    WHEN pol.unoptimized_policies < 5 AND pm.avg_index_usage_ratio > 40
    THEN '⚠️ NEEDS_IMPROVEMENT'
    ELSE '❌ PERFORMANCE_ISSUES'
  END as overall_status
FROM performance_metrics pm
CROSS JOIN policy_metrics pol
CROSS JOIN index_metrics im;

-- =============================================================================
-- FINAL RECOMMENDATIONS
-- =============================================================================

SELECT 
  'RECOMMENDATIONS' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%') > 0
    THEN '1. Fix RLS policies using auth.uid() - HIGH PRIORITY'
    ELSE '1. ✅ RLS policies optimized'
  END as rls_recommendation,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM (
      SELECT tablename, cmd, COUNT(*) 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      GROUP BY tablename, cmd 
      HAVING COUNT(*) > 1
    ) dup) > 0
    THEN '2. Consolidate duplicate RLS policies - HIGH PRIORITY'
    ELSE '2. ✅ No duplicate policies found'
  END as duplicate_policy_recommendation,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_stat_user_indexes WHERE schemaname = 'public' AND idx_scan = 0) > 5
    THEN '3. Consider dropping unused indexes - MEDIUM PRIORITY'
    ELSE '3. ✅ Index usage looks good'
  END as index_recommendation,
  
  CASE 
    WHEN (SELECT AVG(CASE WHEN seq_scan + idx_scan = 0 THEN 0 ELSE 100.0 * idx_scan / (seq_scan + idx_scan) END) 
          FROM pg_stat_user_tables WHERE schemaname = 'public') < 70
    THEN '4. Add missing indexes for better performance - MEDIUM PRIORITY'
    ELSE '4. ✅ Index usage ratios are healthy'
  END as missing_index_recommendation;

-- Performance verification completed!
-- Review the results above to understand your current database performance status.