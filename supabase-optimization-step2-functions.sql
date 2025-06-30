-- SUPABASE DATABASE OPTIMIZATION - STEP 2: FUNCTIONS & VIEWS
-- Create materialized views and optimization functions
-- Date: 2025-06-27

BEGIN;

-- =============================================================================
-- SECTION 1: MATERIALIZED VIEW FOR ACTIVE USERS
-- =============================================================================

-- Create materialized view for frequently accessed user data
DROP MATERIALIZED VIEW IF EXISTS mv_active_users_summary;
CREATE MATERIALIZED VIEW mv_active_users_summary AS
SELECT 
  id,
  email,
  is_admin,
  account_status,
  subscription_tier,
  organization_id,
  created_at
FROM users 
WHERE account_status = 'active'
  AND (is_archived IS NULL OR is_archived = false);

-- Add indexes on materialized view (non-concurrent since it's empty initially)
CREATE UNIQUE INDEX idx_mv_active_users_id ON mv_active_users_summary(id);
CREATE INDEX idx_mv_active_users_email ON mv_active_users_summary(email);
CREATE INDEX idx_mv_active_users_admin ON mv_active_users_summary(is_admin) WHERE is_admin = true;

-- Create function to refresh materialized view efficiently
CREATE OR REPLACE FUNCTION refresh_active_users_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_users_summary;
END;
$$;

-- =============================================================================
-- SECTION 2: OPTIMIZED RLS HELPER FUNCTIONS
-- =============================================================================

-- Function to check if user is admin (replaces repeated subqueries)
CREATE OR REPLACE FUNCTION is_user_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM mv_active_users_summary 
    WHERE id = user_id AND is_admin = true
  );
$$;

-- Function to get user's organization (replaces repeated lookups)
CREATE OR REPLACE FUNCTION get_user_organization(user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM mv_active_users_summary WHERE id = user_id;
$$;

-- Function to check workspace access (optimized)
CREATE OR REPLACE FUNCTION has_workspace_access(workspace_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_id 
    AND w.owner_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM workspace_collaborators wc
    WHERE wc.workspace_id = workspace_id 
    AND wc.user_id = user_id 
    AND wc.accepted_at IS NOT NULL
  );
$$;

-- =============================================================================
-- SECTION 3: PERFORMANCE CONFIGURATION
-- =============================================================================

-- Create dedicated connection pool settings table
CREATE TABLE IF NOT EXISTS performance_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Insert recommended connection pool settings
INSERT INTO performance_config (key, value, description) VALUES
('max_connections_recommendation', '100', 'Recommended max connections for current workload'),
('connection_pool_size', '20', 'Recommended connection pool size per client'),
('statement_timeout_recommendation', '30s', 'Recommended statement timeout'),
('idle_in_transaction_timeout', '10s', 'Recommended idle transaction timeout')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value, 
  updated_at = now();

-- =============================================================================
-- SECTION 4: MONITORING FUNCTIONS
-- =============================================================================

-- Create function to monitor query performance
CREATE OR REPLACE FUNCTION get_performance_metrics()
RETURNS TABLE (
  metric_name text,
  current_value numeric,
  recommendation text,
  status text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH cache_hit_ratio AS (
    SELECT 
      'cache_hit_ratio' as metric,
      round(
        sum(heap_blks_hit) * 100.0 / 
        nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0), 
        2
      ) as value
    FROM pg_statio_user_tables
  ),
  index_usage AS (
    SELECT 
      'index_usage_ratio' as metric,
      round(
        sum(idx_scan) * 100.0 / 
        nullif(sum(idx_scan) + sum(seq_scan), 0), 
        2
      ) as value
    FROM pg_stat_user_tables
  ),
  connection_count AS (
    SELECT 
      'active_connections' as metric,
      count(*)::numeric as value
    FROM pg_stat_activity 
    WHERE state = 'active'
  )
  SELECT 
    cache_hit_ratio.metric,
    cache_hit_ratio.value,
    CASE 
      WHEN cache_hit_ratio.value >= 95 THEN 'Excellent'
      WHEN cache_hit_ratio.value >= 90 THEN 'Good' 
      ELSE 'Needs improvement - consider increasing shared_buffers'
    END,
    CASE 
      WHEN cache_hit_ratio.value >= 95 THEN '✅ Optimal'
      WHEN cache_hit_ratio.value >= 90 THEN '⚠️ Good'
      ELSE '❌ Poor'
    END
  FROM cache_hit_ratio
  
  UNION ALL
  
  SELECT 
    index_usage.metric,
    index_usage.value,
    CASE 
      WHEN index_usage.value >= 95 THEN 'Excellent'
      WHEN index_usage.value >= 85 THEN 'Good'
      ELSE 'Consider adding indexes for frequent queries'
    END,
    CASE 
      WHEN index_usage.value >= 95 THEN '✅ Optimal'
      WHEN index_usage.value >= 85 THEN '⚠️ Good'  
      ELSE '❌ Poor'
    END
  FROM index_usage
  
  UNION ALL
  
  SELECT 
    connection_count.metric,
    connection_count.value,
    CASE 
      WHEN connection_count.value <= 20 THEN 'Good connection usage'
      WHEN connection_count.value <= 50 THEN 'Monitor connection pooling'
      ELSE 'Consider connection pooling optimization'
    END,
    CASE 
      WHEN connection_count.value <= 20 THEN '✅ Good'
      WHEN connection_count.value <= 50 THEN '⚠️ Monitor'
      ELSE '❌ High'
    END
  FROM connection_count;
$$;

-- Create automated maintenance task
CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text := '';
BEGIN
  -- Refresh materialized view if data is stale
  IF (SELECT extract(epoch from (now() - max(updated_at))) FROM performance_config) > 3600 THEN
    PERFORM refresh_active_users_summary();
    result := result || 'Refreshed active users summary. ';
  END IF;
  
  -- Update table statistics if needed
  IF (SELECT count(*) FROM pg_stat_user_tables WHERE last_analyze < now() - interval '24 hours') > 0 THEN
    ANALYZE users, user_two_factor_auth, email_queue, workspace_collaborators;
    result := result || 'Updated table statistics. ';
  END IF;
  
  RETURN COALESCE(result, 'No maintenance needed.');
END;
$$;

COMMIT;

-- =============================================================================
-- SECTION 5: UPDATE STATISTICS
-- =============================================================================

-- Update statistics on key tables to help query planner
ANALYZE users;
ANALYZE user_two_factor_auth;
ANALYZE email_queue;
ANALYZE workspace_collaborators;
ANALYZE organization_members;
ANALYZE hexie_cards;
ANALYZE workspaces;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check materialized view
SELECT 'mv_active_users_summary' as view_name, count(*) as row_count 
FROM mv_active_users_summary;

-- Show performance metrics
SELECT * FROM get_performance_metrics();

SELECT 'Functions and views created successfully!' as status;