-- CHECK WHICH TABLES EXIST BEFORE CREATING INDEXES
-- This must be run FIRST to verify table existence
-- Date: 2025-06-27

-- =============================================================================
-- VERIFY TABLE EXISTENCE
-- =============================================================================

SELECT 
    'TABLE EXISTENCE CHECK' as section,
    expected.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('users'),
        ('organizations'),
        ('workspaces'),
        ('hexie_cards'),
        ('email_notifications'),
        ('email_campaigns'),
        ('email_templates'),
        ('email_preferences'),
        ('user_sessions'),
        ('organization_roles'),
        ('user_role_assignments'),
        ('security_audit_logs'),
        ('user_two_factor_auth'),
        ('sso_identity_providers'),
        ('access_requests'),
        ('user_registered_devices'),
        ('compliance_data_exports'),
        ('scenario_categories'),
        ('scenarios'),
        ('scenario_ratings'),
        ('workspace_scenarios'),
        ('custom_scenarios'),
        ('user_interactions'),
        ('workspace_sessions'),
        ('interventions')
) expected(table_name)
LEFT JOIN information_schema.tables t ON t.table_name = expected.table_name 
    AND t.table_schema = 'public'
ORDER BY expected.table_name;

-- =============================================================================
-- CHECK FOREIGN KEY COLUMNS
-- =============================================================================

SELECT 
    'FOREIGN KEY COLUMNS CHECK' as section,
    expected.table_name,
    expected.column_name,
    c.data_type,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('users', 'organization_id'),
        ('users', 'manager_id'),
        ('email_notifications', 'user_id'),
        ('email_campaigns', 'template_id'),
        ('user_sessions', 'user_id'),
        ('user_sessions', 'organization_id'),
        ('organization_roles', 'organization_id'),
        ('organization_roles', 'parent_role_id'),
        ('organization_roles', 'created_by'),
        ('user_role_assignments', 'user_id'),
        ('user_role_assignments', 'role_id'),
        ('user_role_assignments', 'assigned_by'),
        ('scenarios', 'category_id'),
        ('scenarios', 'created_by'),
        ('scenario_ratings', 'scenario_id'),
        ('scenario_ratings', 'user_id'),
        ('workspace_scenarios', 'scenario_id'),
        ('workspace_scenarios', 'created_by'),
        ('user_interactions', 'user_id'),
        ('user_interactions', 'organization_id'),
        ('user_interactions', 'workspace_id'),
        ('user_interactions', 'hexie_card_id')
) expected(table_name, column_name)
LEFT JOIN information_schema.columns c ON c.table_name = expected.table_name 
    AND c.column_name = expected.column_name
    AND c.table_schema = 'public'
ORDER BY expected.table_name, expected.column_name;

-- =============================================================================
-- CHECK EXISTING INDEXES
-- =============================================================================

SELECT 
    'EXISTING INDEXES CHECK' as section,
    schemaname,
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE 'idx_%' THEN '📊 Custom Index'
        WHEN indexname LIKE '%_pkey' THEN '🔑 Primary Key'
        WHEN indexname LIKE '%_key' THEN '🔒 Unique Key'
        ELSE '📝 Other'
    END as index_type
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

SELECT 'Run this script first to verify your database structure before creating any indexes!' as instruction;