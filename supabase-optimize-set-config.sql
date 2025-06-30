-- OPTIMIZE SET_CONFIG PERFORMANCE BOTTLENECK
-- Address 81% performance impact from set_config() calls in RLS policies
-- Date: 2025-06-27

-- =============================================================================
-- OPTIMIZE RLS POLICIES TO REDUCE SET_CONFIG CALLS
-- =============================================================================

-- Create optimized function to cache auth context
CREATE OR REPLACE FUNCTION get_auth_context()
RETURNS TABLE(
    user_id UUID,
    organization_id UUID,
    user_role TEXT,
    is_admin BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cached_user_id UUID;
    cached_org_id UUID;
    cached_role TEXT;
    cached_is_admin BOOLEAN;
BEGIN
    -- Get current user ID once
    cached_user_id := (SELECT auth.uid());
    
    IF cached_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get user context in single query
    SELECT 
        u.organization_id,
        u.org_role,
        CASE 
            WHEN u.org_role IN ('admin', 'owner', 'executive') THEN true
            ELSE false
        END
    INTO cached_org_id, cached_role, cached_is_admin
    FROM users u
    WHERE u.id = cached_user_id;
    
    RETURN QUERY SELECT 
        cached_user_id,
        cached_org_id,
        cached_role,
        cached_is_admin;
END;
$$;

-- =============================================================================
-- REPLACE INEFFICIENT RLS POLICIES
-- =============================================================================

-- Drop existing policies that use multiple auth.uid() calls
DROP POLICY IF EXISTS "Users can manage their own ratings" ON scenario_ratings;
DROP POLICY IF EXISTS "Users can manage workspace scenarios" ON workspace_scenarios;
DROP POLICY IF EXISTS "Users can manage their own custom scenarios" ON custom_scenarios;
DROP POLICY IF EXISTS "Authenticated users can manage workspace scenarios" ON workspace_scenarios;

-- Create optimized policies using cached auth context
CREATE POLICY "Users can manage their own ratings" ON scenario_ratings
FOR ALL USING (
    user_id = (SELECT user_id FROM get_auth_context() LIMIT 1)
);

CREATE POLICY "Users can manage workspace scenarios" ON workspace_scenarios
FOR ALL USING (
    created_by = (SELECT user_id FROM get_auth_context() LIMIT 1)
);

CREATE POLICY "Users can manage their own custom scenarios" ON custom_scenarios
FOR ALL USING (
    created_by = (SELECT user_id FROM get_auth_context() LIMIT 1)
);

-- =============================================================================
-- OPTIMIZE EMAIL SYSTEM RLS POLICIES
-- =============================================================================

-- Drop existing email policies
DROP POLICY IF EXISTS "email_notifications_own_data" ON email_notifications;
DROP POLICY IF EXISTS "email_preferences_own_data" ON email_preferences;

-- Create optimized email policies
CREATE POLICY "email_notifications_own_data" ON email_notifications
FOR ALL USING (
    user_id = (SELECT user_id FROM get_auth_context() LIMIT 1)
);

CREATE POLICY "email_preferences_own_data" ON email_preferences
FOR ALL USING (
    user_id = (SELECT user_id FROM get_auth_context() LIMIT 1)
);

-- =============================================================================
-- OPTIMIZE AUTHENTICATION SYSTEM RLS POLICIES
-- =============================================================================

-- Drop existing auth policies that call auth.uid() multiple times
DROP POLICY IF EXISTS "user_sessions_own_sessions" ON user_sessions;
DROP POLICY IF EXISTS "user_two_factor_auth_own_data" ON user_two_factor_auth;
-- DROP POLICY IF EXISTS "user_password_history_own_data" ON user_password_history; -- table doesn't exist
DROP POLICY IF EXISTS "user_registered_devices_own_devices" ON user_registered_devices;

-- Create optimized auth policies
CREATE POLICY "user_sessions_own_sessions" ON user_sessions
FOR ALL USING (
    user_id = (SELECT user_id FROM get_auth_context() LIMIT 1)
);

CREATE POLICY "user_two_factor_auth_own_data" ON user_two_factor_auth
FOR ALL USING (
    user_id = (SELECT user_id FROM get_auth_context() LIMIT 1)
);

-- CREATE POLICY "user_password_history_own_data" ON user_password_history
-- FOR ALL USING (
--     user_id = (SELECT user_id FROM get_auth_context() LIMIT 1)
-- ); -- table doesn't exist

CREATE POLICY "user_registered_devices_own_devices" ON user_registered_devices
FOR ALL USING (
    user_id = (SELECT user_id FROM get_auth_context() LIMIT 1)
);

-- =============================================================================
-- OPTIMIZE ORGANIZATION-BASED POLICIES
-- =============================================================================

-- Drop existing org policies
DROP POLICY IF EXISTS "organization_roles_org_members" ON organization_roles;
DROP POLICY IF EXISTS "user_role_assignments_org_members" ON user_role_assignments;

-- Create optimized org policies using cached context
CREATE POLICY "organization_roles_org_members" ON organization_roles
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM get_auth_context() LIMIT 1)
);

CREATE POLICY "user_role_assignments_org_members" ON user_role_assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users u, get_auth_context() ctx
        WHERE u.id = user_role_assignments.user_id
        AND u.organization_id = ctx.organization_id
    )
);

-- =============================================================================
-- CREATE PERFORMANCE MONITORING
-- =============================================================================

-- Function to monitor set_config performance
CREATE OR REPLACE FUNCTION monitor_set_config_performance()
RETURNS TABLE(
    query_text TEXT,
    calls BIGINT,
    total_time_ms NUMERIC,
    avg_time_ms NUMERIC,
    set_config_impact NUMERIC
)
LANGUAGE sql
AS $$
    SELECT 
        LEFT(query, 100) as query_text,
        calls,
        ROUND(total_exec_time::numeric, 2) as total_time_ms,
        ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
        ROUND((total_exec_time / (SELECT SUM(total_exec_time) FROM pg_stat_statements) * 100)::numeric, 2) as set_config_impact
    FROM pg_stat_statements 
    WHERE query ILIKE '%set_config%' 
       OR query ILIKE '%auth.uid%'
    ORDER BY total_exec_time DESC
    LIMIT 10;
$$;

-- =============================================================================
-- VERIFY OPTIMIZATION
-- =============================================================================

-- Check current set_config usage
SELECT 
    'SET_CONFIG OPTIMIZATION VERIFICATION' as section,
    COUNT(*) as total_queries_with_set_config,
    SUM(calls) as total_calls,
    ROUND(SUM(total_exec_time)::numeric, 2) as total_time_ms
FROM pg_stat_statements 
WHERE query ILIKE '%set_config%';

-- Success message
SELECT 'Set_config optimization completed! RLS policies optimized to reduce auth.uid() calls and use cached auth context.' as status;