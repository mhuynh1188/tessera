-- FIXED PERFORMANCE MONITORING FUNCTIONS
-- Corrected PostgreSQL system catalog column references

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_table_performance_stats();
DROP FUNCTION IF EXISTS get_index_usage();

-- Function to check table performance stats (CORRECTED)
CREATE OR REPLACE FUNCTION get_table_performance_stats()
RETURNS TABLE(
  table_name text,
  total_size text,
  index_usage_ratio numeric,
  seq_scan_ratio numeric,
  n_tup_ins bigint,
  n_tup_upd bigint,
  n_tup_del bigint,
  last_analyze timestamptz
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    schemaname||'.'||relname as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
    CASE 
      WHEN idx_scan + seq_scan > 0 
      THEN round(100.0 * idx_scan / (idx_scan + seq_scan), 2)
      ELSE 0 
    END as index_usage_ratio,
    CASE 
      WHEN idx_scan + seq_scan > 0 
      THEN round(100.0 * seq_scan / (idx_scan + seq_scan), 2)
      ELSE 0 
    END as seq_scan_ratio,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    last_analyze
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
    AND (idx_scan + seq_scan) > 0  -- Only tables with some usage
  ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;
$$;

-- Function to check index usage (CORRECTED)
CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE(
  schema_name name,
  table_name name,
  index_name name,
  index_scans bigint,
  tuples_read bigint,
  tuples_fetched bigint
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    schemaname as schema_name,
    relname as table_name,
    indexrelname as index_name,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
$$;

-- Test the corrected functions
SELECT 'Testing get_table_performance_stats()...' as test;
SELECT * FROM get_table_performance_stats() LIMIT 5;

SELECT 'Testing get_index_usage()...' as test;
SELECT * FROM get_index_usage() LIMIT 5;