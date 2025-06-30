-- SUPABASE DATABASE OPTIMIZATION - STEP 1: INDEXES
-- Create indexes concurrently (run outside transaction)
-- Date: 2025-06-27

-- =============================================================================
-- CONCURRENT INDEX CREATION - Run these one by one outside transactions
-- =============================================================================

-- Users table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_pagination 
ON users(account_status, created_at DESC, id) 
WHERE account_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_admin_lookup 
ON users(is_admin, id) 
WHERE is_admin = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users(email, account_status) 
WHERE account_status = 'active';

-- User 2FA table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_2fa_verified 
ON user_two_factor_auth(is_verified, user_id) 
WHERE is_verified = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_2fa_user_verified 
ON user_two_factor_auth(user_id, is_verified);

-- Email queue optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_processing 
ON email_queue(status, created_at DESC, id) 
WHERE status IN ('pending', 'processing');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_pagination 
ON email_queue(created_at DESC, id);

-- Workspace collaboration optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_collab_user_active 
ON workspace_collaborators(user_id, workspace_id, accepted_at) 
WHERE accepted_at IS NOT NULL;

-- Organization members optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_user_role 
ON organization_members(user_id, organization_id, role);

-- Hexie cards optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hexie_cards_active_user 
ON hexie_cards(created_by, is_active, is_archived, created_at DESC) 
WHERE is_active = true AND is_archived = false;

-- Check index creation progress
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
  AND indexname IN (
    'idx_users_active_pagination',
    'idx_users_admin_lookup', 
    'idx_user_2fa_verified',
    'idx_email_queue_processing',
    'idx_workspace_collab_user_active',
    'idx_org_members_user_role',
    'idx_hexie_cards_active_user'
  )
ORDER BY tablename, indexname;