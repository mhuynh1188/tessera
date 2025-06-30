-- CORRECTED SUPABASE PERFORMANCE VERIFICATION SCRIPT
-- Based on ACTUAL database schema analysis
-- Use this script to verify the corrected performance optimization results

-- =============================================================================
-- SECTION 1: RLS POLICY ANALYSIS (Corrected for actual schema)
-- =============================================================================

-- 1.1 Check for unoptimized RLS policies
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
  substr(qual, 1, 100) as policy_condition_preview
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
-- SECTION 2: ACTUAL TABLE ANALYSIS
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
  AVG(severity_rating) as avg_severity_rating
FROM hexie_cards;

-- 2.2 Check hexie_categories table
SELECT 
  'HEXIE_CATEGORIES_ANALYSIS' as check_type,
  COUNT(*) as total_categories,
  COUNT(*) FILTER (WHERE is_active = true) as active_categories,
  COUNT(*) FILTER (WHERE is_archived = true) as archived_categories,
  array_agg(name ORDER BY sort_order) as category_names
FROM hexie_categories;

-- 2.3 Check workspaces table status
SELECT 
  'WORKSPACES_ANALYSIS' as check_type,
  COUNT(*) as total_workspaces,
  COUNT(*) FILTER (WHERE is_public = true) as public_workspaces,
  COUNT(DISTINCT owner_id) as unique_owners
FROM workspaces;

-- 2.4 Check users table status
SELECT 
  'USERS_ANALYSIS' as check_type,
  COUNT(*) as total_users,
  COUNT(DISTINCT subscription_tier) as subscription_tiers,
  COUNT(*) FILTER (WHERE two_factor_enabled = true) as users_with_2fa
FROM users;

-- =============================================================================
-- SECTION 3: INDEX ANALYSIS (Based on actual schema)
-- =============================================================================

-- 3.1 Check index usage on hexie_cards (most important table) (CORRECTED)
SELECT 
  'HEXIE_CARDS_INDEXES' as check_type,
  indexrelname as indexname,
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
WHERE schemaname = 'public' AND relname = 'hexie_cards'
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
      AND pi.tablename = 'hexie_cards' 
      AND (pi.indexdef LIKE '%' || column_name || '%')
    ) THEN '✅ INDEXED'
    ELSE '❌ MISSING_INDEX'
  END as index_status
FROM unnest(ARRAY['created_by', 'category_id', 'archived_by', 'antipattern_type_id']) AS column_name
ORDER BY 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes pi 
    WHERE pi.schemaname = 'public' 
    AND pi.tablename = 'hexie_cards' 
    AND (pi.indexdef LIKE '%' || column_name || '%')
  ) THEN 2 ELSE 1 END;

-- =============================================================================
-- SECTION 4: PERFORMANCE STATISTICS (Real tables only)
-- =============================================================================

-- 4.1 Table scan vs index usage for actual tables with data (CORRECTED)
SELECT 
  'TABLE_PERFORMANCE' as check_type,
  schemaname,
  relname as tablename,
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
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
  n_tup_ins + n_tup_upd + n_tup_del as total_modifications
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('hexie_cards', 'hexie_categories', 'categories', 'workspaces', 'users', 'workspace_collaborators')
ORDER BY 
  pg_total_relation_size(schemaname||'.'||relname) DESC;

-- =============================================================================
-- SECTION 5: ORGANIZATION_MEMBERS RECURSION CHECK
-- =============================================================================

-- 5.1 Check if organization_members recursion issue is fixed
SELECT 
  'ORGANIZATION_MEMBERS_CHECK' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members') 
    THEN 'TABLE_EXISTS'
    ELSE 'TABLE_NOT_FOUND'
  END as table_status;

-- Try to query organization_members safely
DO $$
BEGIN
  BEGIN
    PERFORM COUNT(*) FROM organization_members LIMIT 1;
    RAISE NOTICE 'organization_members table accessible - recursion fixed!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'organization_members still has issues: %', SQLERRM;
  END;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'organization_members table does not exist';
END $$;

-- =============================================================================
-- SECTION 6: JSON/JSONB INDEX PERFORMANCE
-- =============================================================================

-- 6.1 Check if GIN indexes on JSON columns are being used (CORRECTED)
SELECT 
  'JSON_INDEX_USAGE' as check_type,
  indexrelname as indexname,
  schemaname,
  relname as tablename,
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
-- SECTION 7: OVERALL PERFORMANCE SUMMARY
-- =============================================================================

-- 7.1 Performance summary for actual database
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
-- SECTION 8: CORRECTED RECOMMENDATIONS
-- =============================================================================

SELECT 
  'CORRECTED_RECOMMENDATIONS' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%') > 0
    THEN '1. Deploy corrected RLS policy optimization - HIGH PRIORITY'
    ELSE '1. ✅ RLS policies optimized correctly'
  END as rls_recommendation,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM hexie_cards WHERE is_active = true) > 100
    THEN '2. Monitor hexie_cards performance with ' || (SELECT COUNT(*) FROM hexie_cards WHERE is_active = true) || ' active records'
    ELSE '2. ✅ hexie_cards table size is manageable'
  END as data_size_recommendation,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM users) = 0
    THEN '3. Consider populating users table for realistic testing'
    ELSE '3. ✅ Users table has data'
  END as test_data_recommendation,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM workspaces) = 0
    THEN '4. Consider creating test workspaces for collaboration features'
    ELSE '4. ✅ Workspaces table has data'
  END as workspace_recommendation;

-- Verification completed for ACTUAL database schema!
-- All recommendations are based on real table structures and data.