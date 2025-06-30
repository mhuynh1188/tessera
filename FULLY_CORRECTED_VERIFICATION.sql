-- FULLY CORRECTED SUPABASE PERFORMANCE VERIFICATION SCRIPT
-- All PostgreSQL system catalog column references validated and corrected
-- Use this script to verify the performance optimization results

-- =============================================================================
-- SECTION 1: RLS POLICY ANALYSIS (Uses correct pg_policies columns)
-- =============================================================================

-- 1.1 Check for unoptimized RLS policies
SELECT 
  'RLS_POLICY_CHECK' as check_type,
  schemaname, 
  tablename,  -- pg_policies DOES use tablename
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
  LENGTH(qual) as policy_complexity
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

-- =============================================================================
-- SECTION 2: ACTUAL TABLE DATA ANALYSIS
-- =============================================================================

-- 2.1 Check actual hexie_cards table structure and performance
SELECT 
  'HEXIE_CARDS_ANALYSIS' as check_type,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_active = true) as active_records,
  COUNT(*) FILTER (WHERE is_archived = true) as archived_records,
  COUNT(DISTINCT category) as unique_categories,
  COUNT(DISTINCT subscription_tier_required) as subscription_tiers,
  COUNT(DISTINCT created_by) as unique_creators,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as org_cards,
  ROUND(AVG(severity_rating), 2) as avg_severity_rating
FROM hexie_cards;

-- 2.2 Check hexie_categories table
SELECT 
  'HEXIE_CATEGORIES_ANALYSIS' as check_type,
  COUNT(*) as total_categories,
  COUNT(*) FILTER (WHERE is_active = true) as active_categories,
  COUNT(*) FILTER (WHERE is_archived = true) as archived_categories
FROM hexie_categories;

-- =============================================================================
-- SECTION 3: INDEX ANALYSIS (All column references corrected)
-- =============================================================================

-- 3.1 Check index usage on hexie_cards (FULLY CORRECTED)
SELECT 
  'HEXIE_CARDS_INDEXES' as check_type,
  indexrelname as index_name,  -- CORRECTED: pg_stat_user_indexes uses indexrelname
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
WHERE schemaname = 'public' AND relname = 'hexie_cards'  -- CORRECTED: uses relname
ORDER BY idx_scan DESC;

-- 3.2 Check for missing indexes on actual foreign keys
SELECT 
  'FOREIGN_KEY_INDEXES' as check_type,
  'hexie_cards' as table_name,
  column_name as fk_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes pi 
      WHERE pi.schemaname = 'public' 
      AND pi.tablename = 'hexie_cards'  -- pg_indexes DOES use tablename
      AND (pi.indexdef LIKE '%' || column_name || '%')
    ) THEN '✅ INDEXED'
    ELSE '❌ MISSING_INDEX'
  END as index_status
FROM unnest(ARRAY['created_by', 'category_id', 'archived_by', 'antipattern_type_id']) AS column_name;

-- =============================================================================
-- SECTION 4: PERFORMANCE STATISTICS (All references corrected)
-- =============================================================================

-- 4.1 Table scan vs index usage for actual tables (FULLY CORRECTED)
SELECT 
  'TABLE_PERFORMANCE' as check_type,
  schemaname,
  relname as table_name,  -- CORRECTED: pg_stat_user_tables uses relname
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
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('hexie_cards', 'hexie_categories', 'categories', 'workspaces', 'users', 'workspace_collaborators')
ORDER BY 
  pg_total_relation_size(schemaname||'.'||relname) DESC;

-- =============================================================================
-- SECTION 5: JSON/JSONB INDEX PERFORMANCE (FULLY CORRECTED)
-- =============================================================================

-- 5.1 Check if GIN indexes on JSON columns are being used
SELECT 
  'JSON_INDEX_USAGE' as check_type,
  indexrelname as index_name,  -- CORRECTED: pg_stat_user_indexes uses indexrelname
  schemaname,
  relname as table_name,       -- CORRECTED: pg_stat_user_indexes uses relname
  idx_scan,
  CASE 
    WHEN idx_scan > 0 THEN '✅ BEING_USED'
    ELSE '⚠️ NOT_USED_YET'
  END as usage_status
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND (indexrelname LIKE '%gin%' OR indexrelname LIKE '%json%' OR indexrelname LIKE '%severity%' OR indexrelname LIKE '%tags%')
ORDER BY idx_scan DESC;

-- =============================================================================
-- SECTION 6: OVERALL PERFORMANCE SUMMARY (FULLY CORRECTED)
-- =============================================================================

-- 6.1 Performance summary with corrected joins
WITH performance_metrics AS (
  SELECT 
    COUNT(*) as total_tables,
    SUM(CASE WHEN st.seq_scan + st.idx_scan > 0 THEN 1 ELSE 0 END) as active_tables,
    AVG(CASE 
      WHEN st.seq_scan + st.idx_scan = 0 THEN 0
      ELSE 100.0 * st.idx_scan / (st.seq_scan + st.idx_scan)
    END) as avg_index_usage_ratio
  FROM pg_tables t
  LEFT JOIN pg_stat_user_tables st ON t.tablename = st.relname AND t.schemaname = st.schemaname
  WHERE t.schemaname = 'public'
    AND t.tablename IN ('hexie_cards', 'hexie_categories', 'categories', 'workspaces', 'users')
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
data_metrics AS (
  SELECT 
    (SELECT COUNT(*) FROM hexie_cards) as hexie_cards_count,
    (SELECT COUNT(*) FROM hexie_categories) as categories_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM workspaces) as workspaces_count
)
SELECT 
  'PERFORMANCE_SUMMARY' as check_type,
  pm.total_tables,
  pm.active_tables,
  ROUND(pm.avg_index_usage_ratio, 2) as avg_index_usage_ratio,
  pol.total_policies,
  pol.unoptimized_policies,
  pol.optimized_policies,
  ROUND(100.0 * pol.optimized_policies / NULLIF(pol.total_policies, 0), 2) as policy_optimization_ratio,
  dm.hexie_cards_count,
  dm.categories_count,
  dm.users_count,
  dm.workspaces_count,
  CASE 
    WHEN pol.unoptimized_policies = 0 AND pm.avg_index_usage_ratio > 80
    THEN '✅ EXCELLENT_PERFORMANCE'
    WHEN pol.unoptimized_policies < 3 AND pm.avg_index_usage_ratio > 60
    THEN '🔍 GOOD_PERFORMANCE'
    WHEN pol.unoptimized_policies < 5 AND pm.avg_index_usage_ratio > 40
    THEN '⚠️ NEEDS_IMPROVEMENT'
    ELSE '❌ PERFORMANCE_ISSUES'
  END as overall_status
FROM performance_metrics pm
CROSS JOIN policy_metrics pol
CROSS JOIN data_metrics dm;

-- =============================================================================
-- SECTION 7: FINAL RECOMMENDATIONS
-- =============================================================================

SELECT 
  'FINAL_RECOMMENDATIONS' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%') > 0
    THEN '1. Deploy RLS policy optimization - HIGH PRIORITY'
    ELSE '1. ✅ RLS policies optimized'
  END as rls_recommendation,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM hexie_cards WHERE is_active = true) > 100
    THEN '2. Monitor performance with ' || (SELECT COUNT(*) FROM hexie_cards WHERE is_active = true) || ' active cards'
    ELSE '2. ✅ Card volume manageable'
  END as data_size_recommendation;

-- ✅ VERIFICATION COMPLETED - All PostgreSQL column references corrected!