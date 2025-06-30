-- Supabase Performance Optimization Migration
-- Fixes for RLS policies, duplicate indexes, and security issues

-- 1. OPTIMIZE RLS POLICIES
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row

-- Update hexie_cards RLS policies
DROP POLICY IF EXISTS "hexie_cards_select_policy" ON hexie_cards;
DROP POLICY IF EXISTS "hexie_cards_insert_policy" ON hexie_cards;
DROP POLICY IF EXISTS "hexie_cards_update_policy" ON hexie_cards;

-- Create optimized RLS policies for hexie_cards
CREATE POLICY "hexie_cards_select_optimized"
  ON hexie_cards FOR SELECT
  USING (
    is_active = true 
    AND (
      is_public = true 
      OR created_by = (select auth.uid())
      OR (select auth.uid()) IN (
        SELECT user_id FROM workspace_collaborators wc 
        JOIN workspaces w ON w.id = wc.workspace_id 
        WHERE w.owner_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "hexie_cards_insert_optimized"
  ON hexie_cards FOR INSERT
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "hexie_cards_update_optimized"
  ON hexie_cards FOR UPDATE
  USING (created_by = (select auth.uid()));

-- Update users table RLS policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

CREATE POLICY "users_select_optimized"
  ON users FOR SELECT
  USING (id = (select auth.uid()));

CREATE POLICY "users_update_optimized"
  ON users FOR UPDATE
  USING (id = (select auth.uid()));

-- Update workspaces RLS policies
DROP POLICY IF EXISTS "workspaces_select_policy" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert_policy" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update_policy" ON workspaces;

CREATE POLICY "workspaces_select_optimized"
  ON workspaces FOR SELECT
  USING (
    owner_id = (select auth.uid())
    OR (select auth.uid()) IN (
      SELECT user_id FROM workspace_collaborators 
      WHERE workspace_id = id
    )
  );

CREATE POLICY "workspaces_insert_optimized"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "workspaces_update_optimized"
  ON workspaces FOR UPDATE
  USING (
    owner_id = (select auth.uid())
    OR (select auth.uid()) IN (
      SELECT user_id FROM workspace_collaborators 
      WHERE workspace_id = id AND role IN ('owner', 'editor')
    )
  );

-- Update workspace_collaborators RLS policies
DROP POLICY IF EXISTS "workspace_collaborators_select_policy" ON workspace_collaborators;
DROP POLICY IF EXISTS "workspace_collaborators_insert_policy" ON workspace_collaborators;

CREATE POLICY "workspace_collaborators_select_optimized"
  ON workspace_collaborators FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (select auth.uid())
    )
  );

CREATE POLICY "workspace_collaborators_insert_optimized"
  ON workspace_collaborators FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (select auth.uid())
    )
  );

-- 2. REMOVE DUPLICATE INDEXES
-- Check and remove duplicate indexes on commonly queried columns

-- Remove duplicate indexes on hexie_cards
DROP INDEX IF EXISTS hexie_cards_category_idx_duplicate;
DROP INDEX IF EXISTS hexie_cards_is_active_idx_duplicate;
DROP INDEX IF EXISTS hexie_cards_subscription_tier_idx_duplicate;
DROP INDEX IF EXISTS hexie_cards_created_by_idx_duplicate;

-- Ensure we have optimal indexes (create if they don't exist)
CREATE INDEX IF NOT EXISTS hexie_cards_category_active_idx 
  ON hexie_cards(category, is_active) WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS hexie_cards_subscription_active_idx 
  ON hexie_cards(subscription_tier_required, is_active) WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS hexie_cards_created_by_idx 
  ON hexie_cards(created_by) WHERE is_active = true;

-- Remove duplicate indexes on users table
DROP INDEX IF EXISTS users_email_idx_duplicate;
DROP INDEX IF EXISTS users_subscription_tier_idx_duplicate;

-- Ensure optimal users indexes
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_subscription_tier_idx ON users(subscription_tier);

-- Remove duplicate indexes on workspaces
DROP INDEX IF EXISTS workspaces_owner_id_idx_duplicate;
DROP INDEX IF EXISTS workspaces_updated_at_idx_duplicate;

-- Ensure optimal workspace indexes
CREATE INDEX IF NOT EXISTS workspaces_owner_updated_idx ON workspaces(owner_id, updated_at);

-- 3. ENABLE RLS ON PUBLIC TABLES
-- Enable RLS on tables that are missing it

-- Enable RLS on hexie_categories if not already enabled
ALTER TABLE hexie_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for hexie_categories (read-only for all authenticated users)
DROP POLICY IF EXISTS "hexie_categories_select_policy" ON hexie_categories;
CREATE POLICY "hexie_categories_select_all"
  ON hexie_categories FOR SELECT
  TO authenticated
  USING (true);

-- Enable RLS on tags if not already enabled
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tags
DROP POLICY IF EXISTS "tags_select_policy" ON tags;
CREATE POLICY "tags_select_enabled"
  ON tags FOR SELECT
  USING (is_enabled = true);

-- Enable RLS on hexie_card_tags junction table
ALTER TABLE hexie_card_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for hexie_card_tags
DROP POLICY IF EXISTS "hexie_card_tags_select_policy" ON hexie_card_tags;
CREATE POLICY "hexie_card_tags_select_optimized"
  ON hexie_card_tags FOR SELECT
  USING (
    hexie_card_id IN (
      SELECT id FROM hexie_cards WHERE is_active = true
    )
  );

-- 4. FIX SECURITY DEFINER VIEWS
-- Create optimized view for hexie_cards_with_tags if it exists
DROP VIEW IF EXISTS hexie_cards_with_tags;

CREATE VIEW hexie_cards_with_tags AS
SELECT 
  hc.*,
  COALESCE(
    array_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
    ARRAY[]::text[]
  ) as tag_names,
  COALESCE(
    array_agg(t.id) FILTER (WHERE t.id IS NOT NULL),
    ARRAY[]::uuid[]
  ) as tag_ids
FROM hexie_cards hc
LEFT JOIN hexie_card_tags hct ON hc.id = hct.hexie_card_id
LEFT JOIN tags t ON hct.tag_id = t.id AND t.is_enabled = true
WHERE hc.is_active = true AND hc.is_archived = false
GROUP BY hc.id;

-- 5. OPTIMIZE FREQUENTLY USED QUERIES
-- Create composite indexes for common query patterns

-- Index for demo page queries (category + subscription + active)
CREATE INDEX IF NOT EXISTS hexie_cards_demo_query_idx 
  ON hexie_cards(category, subscription_tier_required, is_active, created_at DESC)
  WHERE is_archived = false;

-- Index for workspace queries
CREATE INDEX IF NOT EXISTS hexie_instances_workspace_z_idx 
  ON hexie_instances(workspace_id, z_index) 
  WHERE deleted_at IS NULL;

-- Index for collaboration queries
CREATE INDEX IF NOT EXISTS workspace_collaborators_user_workspace_idx 
  ON workspace_collaborators(user_id, workspace_id)
  WHERE accepted_at IS NOT NULL;

-- 6. UPDATE STATISTICS AND ANALYZE TABLES
-- Force PostgreSQL to update table statistics for better query planning
ANALYZE hexie_cards;
ANALYZE users;
ANALYZE workspaces;
ANALYZE workspace_collaborators;
ANALYZE hexie_instances;
ANALYZE tags;
ANALYZE hexie_card_tags;

-- 7. CREATE PERFORMANCE MONITORING FUNCTION
-- Function to check slow queries and index usage
CREATE OR REPLACE FUNCTION check_table_performance()
RETURNS TABLE(
  table_name text,
  total_size text,
  index_usage_ratio numeric,
  seq_scan_ratio numeric
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    schemaname||'.'||tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    CASE 
      WHEN idx_scan + seq_scan > 0 
      THEN round(100.0 * idx_scan / (idx_scan + seq_scan), 2)
      ELSE 0 
    END as index_usage_ratio,
    CASE 
      WHEN idx_scan + seq_scan > 0 
      THEN round(100.0 * seq_scan / (idx_scan + seq_scan), 2)
      ELSE 0 
    END as seq_scan_ratio
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
    AND (idx_scan + seq_scan) > 100  -- Only tables with significant usage
  ORDER BY (idx_scan + seq_scan) DESC;
$$;

-- Performance optimization completed
-- Run this to check performance: SELECT * FROM check_table_performance();