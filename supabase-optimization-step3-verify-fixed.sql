-- SUPABASE DATABASE OPTIMIZATION - STEP 3: VERIFICATION (FIXED)
-- Check optimization results and monitor performance  
-- Date: 2025-06-27

-- =============================================================================
-- VERIFY INDEX CREATION
-- =============================================================================

SELECT 
  'INDEX VERIFICATION' as check_type,
  schemaname,
  tablename,
  indexname,
  CASE 
    WHEN indexname IS NOT NULL THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM (
  VALUES 
    ('idx_users_active_pagination'),
    ('idx_users_admin_lookup'),
    ('idx_users_email_active'),
    ('idx_user_2fa_verified'),
    ('idx_user_2fa_user_verified'),
    ('idx_email_queue_processing'),
    ('idx_email_queue_pagination'),
    ('idx_workspace_collab_user_active'),
    ('idx_org_members_user_role'),
    ('idx_hexie_cards_active_user')
) expected(index_name)
LEFT JOIN pg_indexes ON indexname = expected.index_name AND schemaname = 'public'
ORDER BY expected.index_name;

-- =============================================================================
-- VERIFY FUNCTIONS AND VIEWS
-- =============================================================================

SELECT 
  'FUNCTION VERIFICATION' as check_type,
  routine_name,
  routine_type,
  '✅ Created' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'is_user_admin',
    'get_user_organization', 
    'has_workspace_access',
    'get_performance_metrics',
    'perform_maintenance',
    'refresh_active_users_summary'
  )
ORDER BY routine_name;

-- Check materialized view
SELECT 
  'VIEW VERIFICATION' as check_type,
  'mv_active_users_summary' as view_name,
  count(*) as row_count,
  '✅ Created' as status
FROM mv_active_users_summary;

-- =============================================================================
-- PERFORMANCE METRICS
-- =============================================================================

SELECT 'CURRENT PERFORMANCE METRICS' as section;
SELECT * FROM get_performance_metrics();

-- =============================================================================
-- INDEX USAGE ANALYSIS (FIXED)
-- =============================================================================

SELECT 
  'INDEX USAGE ANALYSIS' as section,
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE 
    WHEN idx_scan > 0 THEN '✅ Used'
    ELSE '⚠️ Not used yet'
  END as usage_status
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND indexrelname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- =============================================================================
-- QUERY PERFORMANCE COMPARISON
-- =============================================================================

-- Show current slowest queries
SELECT 
  'CURRENT SLOW QUERIES' as section,
  left(query, 100) as query_preview,
  calls,
  round(total_exec_time::numeric, 2) as total_time_ms,
  round(mean_exec_time::numeric, 2) as avg_time_ms
FROM pg_stat_statements 
WHERE calls > 5
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- =============================================================================
-- TABLE SIZE ANALYSIS
-- =============================================================================

-- Check table sizes for potential partitioning
SELECT 
  'LARGE TABLE CHECK' as check_type,
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  CASE 
    WHEN pg_total_relation_size(schemaname||'.'||tablename) > 1073741824 THEN '⚠️ Consider partitioning (>1GB)'
    WHEN pg_total_relation_size(schemaname||'.'||tablename) > 104857600 THEN '💡 Monitor growth (>100MB)'
    ELSE '✅ Good size'
  END as recommendation
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- =============================================================================
-- OPTIMIZATION SUMMARY
-- =============================================================================

SELECT 'OPTIMIZATION SUMMARY' as section;

SELECT 
  'Performance Improvements' as category,
  'Users table queries optimized with pagination index' as improvement
UNION ALL
SELECT 'Performance Improvements', '2FA queries optimized with verification index'
UNION ALL  
SELECT 'Performance Improvements', 'Email queue optimized with processing status index'
UNION ALL
SELECT 'Performance Improvements', 'RLS policies optimized with cached functions'
UNION ALL
SELECT 'Performance Improvements', 'Materialized view created for fast user lookups'
UNION ALL
SELECT 'Next Steps', 'Monitor performance with: SELECT * FROM get_performance_metrics()'
UNION ALL
SELECT 'Next Steps', 'Run daily maintenance with: SELECT perform_maintenance()'
UNION ALL
SELECT 'Next Steps', 'Refresh user cache with: SELECT refresh_active_users_summary()'
ORDER BY category, improvement;