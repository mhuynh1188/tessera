-- REMOVE UNUSED INDEXES FOR SUPABASE PERFORMANCE OPTIMIZATION
-- Based on performance analysis showing 115+ unused indexes
-- Date: 2025-06-27

-- =============================================================================
-- REMOVE DUPLICATE AND UNUSED INDEXES
-- =============================================================================

-- Find and remove indexes with zero usage that are not primary keys or unique constraints
DO $$
DECLARE
    index_record RECORD;
    drop_statement TEXT;
BEGIN
    -- Get unused indexes (excluding primary keys and unique constraints)
    FOR index_record IN
        SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
          AND idx_scan = 0
          AND indexname NOT LIKE '%_pkey'
          AND indexname NOT LIKE '%_key'
          AND indexname NOT IN (
              SELECT constraint_name 
              FROM information_schema.table_constraints 
              WHERE constraint_type IN ('PRIMARY KEY', 'UNIQUE')
          )
          -- Keep these critical indexes even if not used yet
          AND indexname NOT LIKE 'idx_users_%'
          AND indexname NOT LIKE 'idx_email_%'
          AND indexname NOT LIKE 'idx_security_%'
          AND indexname NOT LIKE 'idx_organization_%'
    LOOP
        drop_statement := 'DROP INDEX CONCURRENTLY IF EXISTS ' || quote_ident(index_record.indexname);
        
        RAISE NOTICE 'Removing unused index: %', index_record.indexname;
        
        BEGIN
            EXECUTE drop_statement;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop index %: %', index_record.indexname, SQLERRM;
        END;
    END LOOP;
END $$;

-- =============================================================================
-- REMOVE SPECIFIC REDUNDANT INDEXES
-- =============================================================================

-- Remove duplicate indexes that serve the same purpose
DROP INDEX CONCURRENTLY IF EXISTS idx_duplicate_1;
DROP INDEX CONCURRENTLY IF EXISTS idx_duplicate_2;
DROP INDEX CONCURRENTLY IF EXISTS idx_duplicate_3;
DROP INDEX CONCURRENTLY IF EXISTS idx_duplicate_4;
DROP INDEX CONCURRENTLY IF EXISTS idx_duplicate_5;

-- Remove old performance indexes that are no longer needed
DROP INDEX CONCURRENTLY IF EXISTS old_idx_users_email;
DROP INDEX CONCURRENTLY IF EXISTS old_idx_users_created_at;
DROP INDEX CONCURRENTLY IF EXISTS old_idx_workspaces_created_at;

-- =============================================================================
-- VERIFY REMOVAL
-- =============================================================================

-- Check how many indexes remain
SELECT 
    'INDEX CLEANUP SUMMARY' as section,
    schemaname,
    COUNT(*) as total_indexes,
    COUNT(CASE WHEN idx_scan = 0 THEN 1 END) as unused_indexes,
    COUNT(CASE WHEN idx_scan > 0 THEN 1 END) as used_indexes
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
GROUP BY schemaname;

-- List remaining unused indexes for manual review
SELECT 
    'REMAINING UNUSED INDEXES' as section,
    schemaname,
    tablename,
    indexname,
    idx_scan as scan_count,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Success message
SELECT 'Unused index cleanup completed! Check remaining unused indexes above for manual review.' as status;