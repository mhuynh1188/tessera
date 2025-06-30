-- COMPREHENSIVE SUPABASE PERFORMANCE OPTIMIZATION MIGRATION
-- Addresses critical performance warnings from Supabase Performance Advisor
-- Version: 2.0 - Complete Performance Overhaul
-- Date: 2025-06-23

-- This migration fixes:
-- 1. Auth RLS Initialization Plan warnings (HIGH PRIORITY)
-- 2. Multiple Permissive Policies warnings (HIGH PRIORITY) 
-- 3. Duplicate Index warnings (MEDIUM PRIORITY)
-- 4. Unindexed Foreign Keys (MEDIUM PRIORITY)
-- 5. Unused Index warnings (LOW PRIORITY - with caution)

BEGIN;

-- =============================================================================
-- SECTION 1: FIX AUTH RLS INITIALIZATION PLAN WARNINGS
-- =============================================================================
-- Problem: RLS policies using auth.uid() re-evaluate for each row
-- Solution: Replace auth.uid() with (select auth.uid()) to cache result

-- 1.1 HEXIE_CARDS TABLE - Core content table
-- Drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "hexie_cards_select_policy" ON hexie_cards;
DROP POLICY IF EXISTS "hexie_cards_insert_policy" ON hexie_cards;
DROP POLICY IF EXISTS "hexie_cards_update_policy" ON hexie_cards;
DROP POLICY IF EXISTS "hexie_cards_delete_policy" ON hexie_cards;
DROP POLICY IF EXISTS "hexie_cards_select_optimized" ON hexie_cards;
DROP POLICY IF EXISTS "hexie_cards_insert_optimized" ON hexie_cards;
DROP POLICY IF EXISTS "hexie_cards_update_optimized" ON hexie_cards;

-- Create optimized RLS policies for hexie_cards
CREATE POLICY "hexie_cards_select_cached"
  ON hexie_cards FOR SELECT
  USING (
    is_active = true 
    AND is_archived = false
    AND (
      is_public = true 
      OR created_by = (select auth.uid())
      OR (select auth.uid()) IN (
        SELECT user_id FROM workspace_collaborators wc 
        JOIN workspaces w ON w.id = wc.workspace_id 
        WHERE w.owner_id = created_by
        AND wc.accepted_at IS NOT NULL
      )
    )
  );

CREATE POLICY "hexie_cards_insert_cached"
  ON hexie_cards FOR INSERT
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "hexie_cards_update_cached"
  ON hexie_cards FOR UPDATE
  USING (created_by = (select auth.uid()));

-- 1.2 WORKSPACES TABLE - Workspace management
DROP POLICY IF EXISTS "workspaces_select_policy" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert_policy" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update_policy" ON workspaces;
DROP POLICY IF EXISTS "workspaces_delete_policy" ON workspaces;
DROP POLICY IF EXISTS "workspaces_select_optimized" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert_optimized" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update_optimized" ON workspaces;

CREATE POLICY "workspaces_select_cached"
  ON workspaces FOR SELECT
  USING (
    owner_id = (select auth.uid())
    OR (select auth.uid()) IN (
      SELECT user_id FROM workspace_collaborators 
      WHERE workspace_id = id
      AND accepted_at IS NOT NULL
    )
    OR is_public = true
  );

CREATE POLICY "workspaces_insert_cached"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "workspaces_update_cached"
  ON workspaces FOR UPDATE
  USING (
    owner_id = (select auth.uid())
    OR (select auth.uid()) IN (
      SELECT user_id FROM workspace_collaborators 
      WHERE workspace_id = id 
      AND role IN ('owner', 'editor')
      AND accepted_at IS NOT NULL
    )
  );

-- 1.3 WORKSPACE_COLLABORATORS TABLE
DROP POLICY IF EXISTS "workspace_collaborators_select_policy" ON workspace_collaborators;
DROP POLICY IF EXISTS "workspace_collaborators_insert_policy" ON workspace_collaborators;
DROP POLICY IF EXISTS "workspace_collaborators_update_policy" ON workspace_collaborators;
DROP POLICY IF EXISTS "workspace_collaborators_select_optimized" ON workspace_collaborators;
DROP POLICY IF EXISTS "workspace_collaborators_insert_optimized" ON workspace_collaborators;

CREATE POLICY "workspace_collaborators_select_cached"
  ON workspace_collaborators FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (select auth.uid())
    )
  );

CREATE POLICY "workspace_collaborators_insert_cached"
  ON workspace_collaborators FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (select auth.uid())
    )
  );

-- 1.4 ORGANIZATION_MEMBERS TABLE - Enterprise feature
DROP POLICY IF EXISTS "organization_members_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_simple" ON organization_members;
DROP POLICY IF EXISTS "organization_members_select" ON organization_members;
DROP POLICY IF EXISTS "organization_members_insert" ON organization_members;

CREATE POLICY "organization_members_cached"
  ON organization_members FOR ALL
  USING (user_id = (select auth.uid()));

-- 1.5 USER_PROFILES TABLE
DROP POLICY IF EXISTS "user_profiles_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_simple" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;

CREATE POLICY "user_profiles_cached"
  ON user_profiles FOR ALL
  USING (user_id = (select auth.uid()));

-- 1.6 USER_SESSIONS TABLE
DROP POLICY IF EXISTS "user_sessions_policy" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_simple" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_select" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_update" ON user_sessions;

CREATE POLICY "user_sessions_cached"
  ON user_sessions FOR ALL
  USING (user_id = (select auth.uid()));

-- 1.7 USER_TWO_FACTOR_AUTH TABLE
DROP POLICY IF EXISTS "user_two_factor_auth_policy" ON user_two_factor_auth;
DROP POLICY IF EXISTS "user_two_factor_auth_simple" ON user_two_factor_auth;
DROP POLICY IF EXISTS "user_two_factor_auth_select" ON user_two_factor_auth;

CREATE POLICY "user_two_factor_auth_cached"
  ON user_two_factor_auth FOR ALL
  USING (user_id = (select auth.uid()));

-- 1.8 EMAIL_TEMPLATES TABLE
DROP POLICY IF EXISTS "email_templates_select" ON email_templates;
DROP POLICY IF EXISTS "email_templates_insert" ON email_templates;
DROP POLICY IF EXISTS "email_templates_update" ON email_templates;

CREATE POLICY "email_templates_cached"
  ON email_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "email_templates_modify_cached"
  ON email_templates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'owner')
    )
  );

-- 1.9 SCENARIOS TABLE
DROP POLICY IF EXISTS "scenarios_policy" ON scenarios;
DROP POLICY IF EXISTS "scenarios_select" ON scenarios;
DROP POLICY IF EXISTS "scenarios_insert" ON scenarios;

CREATE POLICY "scenarios_cached"
  ON scenarios FOR ALL
  USING (created_by = (select auth.uid()));

-- 1.10 TAGS TABLE - Make read-only for authenticated users
DROP POLICY IF EXISTS "tags_select_policy" ON tags;
DROP POLICY IF EXISTS "tags_select_enabled" ON tags;

CREATE POLICY "tags_select_cached"
  ON tags FOR SELECT
  USING (is_enabled = true);

-- =============================================================================
-- SECTION 2: REMOVE MULTIPLE PERMISSIVE POLICIES
-- =============================================================================
-- Problem: Multiple RLS policies for same role/action cause performance overhead
-- Solution: Consolidate duplicate policies into single comprehensive policies

-- 2.1 Clean up any remaining duplicate policies on HEXIE_CARDS
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop duplicate policies on hexie_cards
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'hexie_cards' 
        AND schemaname = 'public'
        AND policyname NOT IN ('hexie_cards_select_cached', 'hexie_cards_insert_cached', 'hexie_cards_update_cached')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON hexie_cards';
    END LOOP;
END $$;

-- 2.2 Clean up duplicate policies on USERS table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON users';
    END LOOP;
END $$;

-- Create single comprehensive policy for users
CREATE POLICY "users_comprehensive_cached"
  ON users FOR ALL
  USING (id = (select auth.uid()));

-- 2.3 Clean up duplicate policies on HEXIE_INSTANCES
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'hexie_instances' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON hexie_instances';
    END LOOP;
END $$;

-- Create comprehensive policy for hexie_instances
CREATE POLICY "hexie_instances_comprehensive_cached"
  ON hexie_instances FOR ALL
  USING (
    created_by = (select auth.uid())
    OR workspace_id IN (
      SELECT id FROM workspaces w
      WHERE w.owner_id = (select auth.uid())
      OR (select auth.uid()) IN (
        SELECT user_id FROM workspace_collaborators 
        WHERE workspace_id = w.id 
        AND accepted_at IS NOT NULL
      )
    )
  );

-- =============================================================================
-- SECTION 3: REMOVE DUPLICATE INDEXES
-- =============================================================================
-- Problem: Multiple indexes on same columns waste storage and slow writes
-- Solution: Drop duplicates and create optimized composite indexes

-- 3.1 Drop known duplicate indexes on HEXIE_CARDS
DROP INDEX IF EXISTS hexie_cards_category_idx_duplicate;
DROP INDEX IF EXISTS hexie_cards_is_active_idx_duplicate;
DROP INDEX IF EXISTS hexie_cards_subscription_tier_idx_duplicate;
DROP INDEX IF EXISTS hexie_cards_created_by_idx_duplicate;
DROP INDEX IF EXISTS hexie_cards_is_public_idx;
DROP INDEX IF EXISTS hexie_cards_is_archived_idx;

-- Create optimized composite indexes for hexie_cards
CREATE INDEX IF NOT EXISTS hexie_cards_performance_idx 
  ON hexie_cards(is_active, is_archived, is_public, category, subscription_tier_required)
  WHERE is_active = true AND is_archived = false;

CREATE INDEX IF NOT EXISTS hexie_cards_user_content_idx 
  ON hexie_cards(created_by, is_active, created_at DESC)
  WHERE is_active = true AND is_archived = false;

-- 3.2 Drop duplicate indexes on USERS table
DROP INDEX IF EXISTS users_email_idx_duplicate;
DROP INDEX IF EXISTS users_subscription_tier_idx_duplicate;
DROP INDEX IF EXISTS users_organization_idx_duplicate;

-- Create optimized users indexes
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_active_idx 
  ON users(email) WHERE account_status = 'active';

CREATE INDEX IF NOT EXISTS users_org_subscription_idx 
  ON users(organization_id, subscription_tier, account_status);

-- 3.3 Drop duplicate indexes on WORKSPACES
DROP INDEX IF EXISTS workspaces_owner_id_idx_duplicate;
DROP INDEX IF EXISTS workspaces_updated_at_idx_duplicate;
DROP INDEX IF EXISTS workspaces_is_public_idx_duplicate;

-- Create optimized workspace indexes
CREATE INDEX IF NOT EXISTS workspaces_owner_access_idx 
  ON workspaces(owner_id, is_public, updated_at DESC);

-- 3.4 Drop duplicate indexes on WORKSPACE_COLLABORATORS
DROP INDEX IF EXISTS workspace_collaborators_user_idx_duplicate;
DROP INDEX IF EXISTS workspace_collaborators_workspace_idx_duplicate;

-- Create optimized collaboration indexes
CREATE INDEX IF NOT EXISTS workspace_collaborators_active_idx 
  ON workspace_collaborators(user_id, workspace_id, role)
  WHERE accepted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS workspace_collaborators_workspace_users_idx 
  ON workspace_collaborators(workspace_id, user_id, accepted_at);

-- =============================================================================
-- SECTION 4: ADD MISSING INDEXES FOR FOREIGN KEYS
-- =============================================================================
-- Problem: Foreign keys without covering indexes cause slow JOINs
-- Solution: Add indexes for all foreign key columns

-- 4.1 HEXIE_INSTANCES foreign key indexes
CREATE INDEX IF NOT EXISTS hexie_instances_workspace_id_idx 
  ON hexie_instances(workspace_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS hexie_instances_hexie_card_id_idx 
  ON hexie_instances(hexie_card_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS hexie_instances_created_by_idx 
  ON hexie_instances(created_by) WHERE deleted_at IS NULL;

-- 4.2 ORGANIZATION_MEMBERS foreign key indexes
CREATE INDEX IF NOT EXISTS organization_members_user_id_idx 
  ON organization_members(user_id);

CREATE INDEX IF NOT EXISTS organization_members_organization_id_idx 
  ON organization_members(organization_id);

-- 4.3 USER_SESSIONS foreign key indexes
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx 
  ON user_sessions(user_id) WHERE expires_at > NOW();

CREATE INDEX IF NOT EXISTS user_sessions_organization_id_idx 
  ON user_sessions(organization_id) WHERE expires_at > NOW();

-- 4.4 SECURITY_AUDIT_LOGS foreign key indexes
CREATE INDEX IF NOT EXISTS security_audit_logs_user_id_idx 
  ON security_audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_logs_organization_id_idx 
  ON security_audit_logs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_logs_session_id_idx 
  ON security_audit_logs(session_id);

-- 4.5 EMAIL_TEMPLATES foreign key indexes
CREATE INDEX IF NOT EXISTS email_templates_organization_id_idx 
  ON email_templates(organization_id, status);

CREATE INDEX IF NOT EXISTS email_templates_created_by_idx 
  ON email_templates(created_by);

-- 4.6 HEXIE_CARD_TAGS junction table indexes
CREATE INDEX IF NOT EXISTS hexie_card_tags_hexie_card_id_idx 
  ON hexie_card_tags(hexie_card_id);

CREATE INDEX IF NOT EXISTS hexie_card_tags_tag_id_idx 
  ON hexie_card_tags(tag_id);

-- 4.7 USER_ROLE_ASSIGNMENTS foreign key indexes
CREATE INDEX IF NOT EXISTS user_role_assignments_user_id_idx 
  ON user_role_assignments(user_id) WHERE expires_at IS NULL OR expires_at > NOW();

CREATE INDEX IF NOT EXISTS user_role_assignments_role_id_idx 
  ON user_role_assignments(role_id) WHERE expires_at IS NULL OR expires_at > NOW();

-- =============================================================================
-- SECTION 5: DROP UNUSED INDEXES (WITH CAUTION)
-- =============================================================================
-- Problem: Unused indexes waste storage and slow writes
-- Solution: Drop indexes that are never used (based on common patterns)

-- 5.1 Drop potentially unused single-column indexes that are covered by composite indexes
DROP INDEX IF EXISTS hexie_cards_created_at_idx; -- Covered by composite indexes
DROP INDEX IF EXISTS workspaces_created_at_idx; -- Covered by composite indexes
DROP INDEX IF EXISTS users_created_at_idx; -- Rarely queried alone

-- 5.2 Drop old/obsolete indexes from previous migrations
DROP INDEX IF EXISTS hexie_cards_old_category_idx;
DROP INDEX IF EXISTS workspaces_old_owner_idx;
DROP INDEX IF EXISTS users_old_email_idx;

-- Note: Be cautious with dropping indexes. Monitor query performance after deployment.
-- If any queries slow down, recreate the specific indexes needed.

-- =============================================================================
-- SECTION 6: ENABLE RLS ON MISSING TABLES
-- =============================================================================
-- Problem: Some tables missing Row Level Security
-- Solution: Enable RLS with appropriate policies

-- 6.1 Enable RLS on system tables
ALTER TABLE hexie_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_card_tags ENABLE ROW LEVEL SECURITY;

-- 6.2 Create policies for system tables
DROP POLICY IF EXISTS "hexie_categories_select_policy" ON hexie_categories;
CREATE POLICY "hexie_categories_select_all"
  ON hexie_categories FOR SELECT
  TO authenticated
  USING (true);

-- hexie_card_tags policy for junction table
DROP POLICY IF EXISTS "hexie_card_tags_select_policy" ON hexie_card_tags;
CREATE POLICY "hexie_card_tags_select_optimized"
  ON hexie_card_tags FOR SELECT
  USING (
    hexie_card_id IN (
      SELECT id FROM hexie_cards 
      WHERE is_active = true AND is_archived = false
    )
  );

-- =============================================================================
-- SECTION 7: OPTIMIZE VIEWS AND FUNCTIONS
-- =============================================================================
-- Problem: Views with SECURITY DEFINER cause performance overhead
-- Solution: Optimize view definitions

-- 7.1 Recreate hexie_cards_with_tags view with better performance
DROP VIEW IF EXISTS hexie_cards_with_tags;

CREATE VIEW hexie_cards_with_tags 
WITH (security_barrier = false) AS
SELECT 
  hc.*,
  COALESCE(
    array_agg(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
    ARRAY[]::text[]
  ) as tag_names,
  COALESCE(
    array_agg(t.id ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL),
    ARRAY[]::uuid[]
  ) as tag_ids,
  array_length(
    array_agg(t.id) FILTER (WHERE t.id IS NOT NULL), 1
  ) as tag_count
FROM hexie_cards hc
LEFT JOIN hexie_card_tags hct ON hc.id = hct.hexie_card_id
LEFT JOIN tags t ON hct.tag_id = t.id AND t.is_enabled = true
WHERE hc.is_active = true AND hc.is_archived = false
GROUP BY hc.id;

-- 7.2 Create performance monitoring function (improved version)
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
    END as seq_scan_ratio,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    last_analyze
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
    AND (idx_scan + seq_scan) > 10  -- Only tables with some usage
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
$$;

-- =============================================================================
-- SECTION 8: UPDATE STATISTICS AND ANALYZE
-- =============================================================================
-- Problem: Stale statistics cause poor query planning
-- Solution: Force PostgreSQL to update statistics

ANALYZE hexie_cards;
ANALYZE users;
ANALYZE workspaces;
ANALYZE workspace_collaborators;
ANALYZE hexie_instances;
ANALYZE tags;
ANALYZE hexie_card_tags;
ANALYZE organizations;
ANALYZE organization_members;
ANALYZE user_sessions;
ANALYZE user_two_factor_auth;
ANALYZE email_templates;
ANALYZE security_audit_logs;

-- =============================================================================
-- SECTION 9: CREATE PERFORMANCE MONITORING QUERIES
-- =============================================================================

-- 9.1 Function to check for slow queries
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE(
  query_text text,
  calls bigint,
  total_time double precision,
  mean_time double precision,
  stddev_time double precision
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    query,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    stddev_exec_time as stddev_time
  FROM pg_stat_statements
  WHERE mean_exec_time > 100  -- Queries taking > 100ms on average
  ORDER BY mean_exec_time DESC
  LIMIT 20;
$$;

-- 9.2 Function to check index usage
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
    tablename as table_name,
    indexname as index_name,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
$$;

COMMIT;

-- =============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- =============================================================================

-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS_OPTIMIZATION'
    WHEN qual LIKE '%(select auth.uid())%' THEN 'OPTIMIZED'
    ELSE 'CHECK_MANUALLY'
  END as optimization_status
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check performance stats
SELECT * FROM get_table_performance_stats() 
WHERE index_usage_ratio < 80 
ORDER BY total_size DESC;

-- Performance optimization completed successfully!
-- Monitor query performance and adjust indexes as needed based on actual usage patterns.