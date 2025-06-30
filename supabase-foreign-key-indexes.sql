-- FOREIGN KEY INDEXES FOR SUPABASE PERFORMANCE OPTIMIZATION
-- Based on actual schema analysis and performance recommendations
-- Date: 2025-06-27

-- =============================================================================
-- EMAIL SYSTEM FOREIGN KEY INDEXES
-- =============================================================================

-- Email notifications table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_notifications_user_id 
ON email_notifications(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_template_id 
ON email_campaigns(template_id);

-- =============================================================================
-- ENTERPRISE AUTHENTICATION FOREIGN KEY INDEXES  
-- =============================================================================

-- Users table foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_organization_id 
ON users(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_manager_id 
ON users(manager_id);

-- User sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id 
ON user_sessions(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_organization_id 
ON user_sessions(organization_id);

-- Organization roles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_roles_organization_id 
ON organization_roles(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_roles_parent_role_id 
ON organization_roles(parent_role_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_roles_created_by 
ON organization_roles(created_by);

-- User role assignments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_assignments_user_id 
ON user_role_assignments(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_assignments_role_id 
ON user_role_assignments(role_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_assignments_assigned_by 
ON user_role_assignments(assigned_by);

-- Security audit logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_logs_organization_id 
ON security_audit_logs(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_logs_user_id 
ON security_audit_logs(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_logs_session_id 
ON security_audit_logs(session_id);

-- Two factor auth
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_two_factor_auth_user_id 
ON user_two_factor_auth(user_id);

-- SSO identity providers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sso_identity_providers_organization_id 
ON sso_identity_providers(organization_id);

-- Access requests
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_access_requests_organization_id 
ON access_requests(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_access_requests_requester_id 
ON access_requests(requester_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_access_requests_approver_id 
ON access_requests(approver_id);

-- Password history (table doesn't exist - skipping)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_password_history_user_id 
-- ON user_password_history(user_id);

-- Registered devices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_registered_devices_user_id 
ON user_registered_devices(user_id);

-- Compliance data exports
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_data_exports_organization_id 
ON compliance_data_exports(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_data_exports_requested_by 
ON compliance_data_exports(requested_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_data_exports_data_subject_id 
ON compliance_data_exports(data_subject_id);

-- =============================================================================
-- SCENARIO SYSTEM FOREIGN KEY INDEXES
-- =============================================================================

-- Scenario categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenario_categories_created_by 
ON scenario_categories(created_by);

-- Scenarios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_category_id 
ON scenarios(category_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_created_by 
ON scenarios(created_by);

-- Scenario ratings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenario_ratings_scenario_id 
ON scenario_ratings(scenario_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenario_ratings_user_id 
ON scenario_ratings(user_id);

-- Workspace scenarios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_scenarios_scenario_id 
ON workspace_scenarios(scenario_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_scenarios_created_by 
ON workspace_scenarios(created_by);

-- Custom scenarios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_custom_scenarios_created_by 
ON custom_scenarios(created_by);

-- =============================================================================
-- ANALYTICS SYSTEM FOREIGN KEY INDEXES
-- =============================================================================

-- User interactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_user_id 
ON user_interactions(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_organization_id 
ON user_interactions(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_workspace_id 
ON user_interactions(workspace_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_hexie_card_id 
ON user_interactions(hexie_card_id);

-- Workspace sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_sessions_workspace_id 
ON workspace_sessions(workspace_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_sessions_organization_id 
ON workspace_sessions(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_sessions_facilitator_id 
ON workspace_sessions(facilitator_id);

-- Interventions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interventions_organization_id 
ON interventions(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interventions_created_by 
ON interventions(created_by);

-- Hexie cards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hexie_cards_organization_id 
ON hexie_cards(organization_id);

-- Organizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_billing_contact_id 
ON organizations(billing_contact_id);

-- Workspaces  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_organization_id 
ON workspaces(organization_id);

-- Success message
SELECT 'Foreign key indexes creation completed! Created indexes for all identified foreign key relationships.' as status;