-- SAFE ENTERPRISE ANALYTICS MIGRATION
-- Version: 001
-- Description: Add enterprise analytics capabilities with zero downtime
-- Date: 2025-06-20

-- Migration versioning table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  rollback_sql TEXT
);

-- Check if migration already applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001-enterprise-analytics') THEN
    RAISE NOTICE 'Migration 001-enterprise-analytics already applied, skipping...';
    RETURN;
  END IF;
END $$;

-- Begin safe migration
BEGIN;

-- Step 1: Add organization support (backwards compatible)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
  max_users INTEGER DEFAULT 5,
  max_workspaces INTEGER DEFAULT 1,
  analytics_enabled BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{
    "analytics_retention_days": 90,
    "privacy_level": "standard",
    "role_permissions": {
      "executive": ["view_all_analytics", "export_data", "manage_users"],
      "hr": ["view_hr_analytics", "manage_interventions", "view_compliance"],
      "manager": ["view_team_analytics", "create_interventions"],
      "member": ["view_personal_analytics"]
    }
  }',
  billing_contact_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Safely add columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS org_role TEXT DEFAULT 'member' CHECK (org_role IN ('admin', 'executive', 'hr', 'manager', 'member')),
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Step 3: Safely add columns to workspaces table
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'department' CHECK (access_level IN ('private', 'department', 'organization', 'public'));

-- Step 4: Create user interactions table for analytics
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  hexie_card_id UUID REFERENCES hexie_cards(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  
  -- Interaction details
  interaction_type TEXT NOT NULL DEFAULT 'view' CHECK (interaction_type IN ('view', 'select', 'place', 'move', 'annotate', 'vote', 'comment', 'group', 'export')),
  severity_rating INTEGER CHECK (severity_rating BETWEEN 1 AND 5),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5) DEFAULT 3,
  
  -- Context data
  workspace_context JSONB DEFAULT '{}',
  environmental_factors JSONB DEFAULT '[]',
  intervention_context JSONB DEFAULT '{}',
  
  -- Timing and metadata
  duration_seconds INTEGER DEFAULT 0,
  sequence_number INTEGER DEFAULT 1,
  user_agent TEXT,
  ip_address_hash TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create workspace sessions table
CREATE TABLE IF NOT EXISTS workspace_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  facilitator_id UUID REFERENCES users(id),
  
  session_type TEXT NOT NULL CHECK (session_type IN ('workshop', 'team_meeting', 'training', 'assessment', 'intervention', 'retrospective')),
  session_name TEXT NOT NULL,
  participant_count INTEGER DEFAULT 1,
  department TEXT,
  
  -- Session outcomes
  identified_patterns JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  satisfaction_score DECIMAL(3,2),
  effectiveness_score DECIMAL(3,2),
  
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Safely add analytics columns to hexie_cards
ALTER TABLE hexie_cards
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS avg_severity_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS department_usage JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS severity_rating INTEGER DEFAULT 1 CHECK (severity_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS environmental_factors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS psychological_framework TEXT DEFAULT 'Cognitive-Behavioral',
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Step 7: Create interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Intervention details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_patterns TEXT[] NOT NULL,
  target_departments TEXT[],
  
  -- Status and timeline
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'paused', 'cancelled')),
  priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  start_date DATE NOT NULL,
  target_end_date DATE,
  actual_end_date DATE,
  
  -- Metrics and goals
  baseline_metrics JSONB NOT NULL DEFAULT '{}',
  target_metrics JSONB NOT NULL DEFAULT '{}',
  current_metrics JSONB DEFAULT '{}',
  final_metrics JSONB DEFAULT '{}',
  
  -- Resources
  budget_allocated DECIMAL(10,2) DEFAULT 0.0,
  budget_spent DECIMAL(10,2) DEFAULT 0.0,
  facilitator_ids UUID[] DEFAULT '{}',
  participant_count INTEGER DEFAULT 0,
  
  -- Results
  effectiveness_score DECIMAL(3,2),
  roi_calculated DECIMAL(8,2),
  participant_satisfaction DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_org_time ON user_interactions(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_session ON user_interactions(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_hexie_severity ON user_interactions(hexie_card_id, severity_rating);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, org_role);
CREATE INDEX IF NOT EXISTS idx_workspaces_org_dept ON workspaces(organization_id, department);
CREATE INDEX IF NOT EXISTS idx_interventions_org_status ON interventions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_sessions_org_time ON workspace_sessions(organization_id, started_at);

-- Step 9: Create privacy-compliant analytics views
CREATE OR REPLACE VIEW behavior_patterns_view AS
SELECT 
  hc.id as hexie_card_id,
  hc.title as pattern_name,
  hc.category,
  hc.subcategory,
  ui.organization_id,
  
  -- Aggregated metrics
  COUNT(ui.id) as total_interactions,
  COUNT(DISTINCT ui.user_id) as unique_users,
  COUNT(DISTINCT ui.workspace_id) as unique_workspaces,
  COUNT(DISTINCT ui.session_id) as unique_sessions,
  
  -- Severity analysis
  AVG(ui.severity_rating)::NUMERIC(3,2) as avg_severity,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ui.severity_rating) as median_severity,
  
  -- Confidence and engagement
  AVG(ui.confidence_level)::NUMERIC(3,2) as avg_confidence,
  AVG(ui.duration_seconds)::INTEGER as avg_engagement_time,
  
  -- Trend data
  json_agg(
    json_build_object(
      'week', EXTRACT(week FROM ui.created_at),
      'severity', AVG(ui.severity_rating)
    ) ORDER BY EXTRACT(week FROM ui.created_at)
  ) as trend_data,
  
  -- Environmental factors
  (
    SELECT json_agg(DISTINCT factor)
    FROM (
      SELECT jsonb_array_elements_text(ui.environmental_factors) as factor
    ) factors
  ) as common_environmental_factors,
  
  MAX(ui.created_at) as last_interaction

FROM hexie_cards hc
JOIN user_interactions ui ON hc.id = ui.hexie_card_id
WHERE ui.created_at >= NOW() - INTERVAL '90 days'
  AND ui.organization_id IS NOT NULL
GROUP BY hc.id, hc.title, hc.category, hc.subcategory, ui.organization_id
HAVING COUNT(DISTINCT ui.user_id) >= 3; -- Privacy: minimum 3 users

-- Step 10: Create organizational health metrics view
CREATE OR REPLACE VIEW organizational_health_view AS
SELECT 
  u.organization_id,
  COALESCE(u.department, 'Unknown') as department,
  
  -- Participation metrics
  COUNT(DISTINCT u.id) as total_employees,
  COUNT(DISTINCT ui.user_id) as active_users,
  (COUNT(DISTINCT ui.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT u.id), 0) * 100)::NUMERIC(5,2) as participation_rate,
  
  -- Engagement metrics
  COUNT(ui.id) as total_interactions,
  AVG(ui.duration_seconds)::INTEGER as avg_session_duration,
  COUNT(DISTINCT ui.session_id) as total_sessions,
  
  -- Health indicators
  AVG(ui.severity_rating)::NUMERIC(3,2) as avg_severity_score,
  COUNT(CASE WHEN ui.severity_rating >= 4 THEN 1 END)::DECIMAL / NULLIF(COUNT(ui.id), 0) * 100 as high_severity_percentage,
  
  -- Improvement tracking
  (
    SELECT AVG(severity_rating)::NUMERIC(3,2)
    FROM user_interactions ui2 
    WHERE ui2.organization_id = u.organization_id 
      AND COALESCE((SELECT department FROM users WHERE id = ui2.user_id), 'Unknown') = COALESCE(u.department, 'Unknown')
      AND ui2.created_at >= NOW() - INTERVAL '30 days'
  ) as severity_last_30_days,
  
  (
    SELECT AVG(severity_rating)::NUMERIC(3,2)
    FROM user_interactions ui3 
    WHERE ui3.organization_id = u.organization_id 
      AND COALESCE((SELECT department FROM users WHERE id = ui3.user_id), 'Unknown') = COALESCE(u.department, 'Unknown')
      AND ui3.created_at >= NOW() - INTERVAL '60 days'
      AND ui3.created_at < NOW() - INTERVAL '30 days'
  ) as severity_30_60_days_ago

FROM users u
LEFT JOIN user_interactions ui ON u.id = ui.user_id 
  AND ui.created_at >= NOW() - INTERVAL '90 days'
WHERE u.organization_id IS NOT NULL 
  AND u.is_active = true
GROUP BY u.organization_id, u.department
HAVING COUNT(DISTINCT u.id) >= 3; -- Privacy: minimum 3 users per department

-- Step 11: Create role-based analytics function
CREATE OR REPLACE FUNCTION get_analytics_for_role(
  p_user_id UUID,
  p_time_window TEXT DEFAULT 'month'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_org_id UUID;
  user_role TEXT;
  user_dept TEXT;
  time_filter TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Get user organization and role
  SELECT organization_id, org_role, department 
  INTO user_org_id, user_role, user_dept
  FROM users WHERE id = p_user_id;
  
  IF user_org_id IS NULL THEN
    RETURN '{"error": "User not associated with organization"}'::JSONB;
  END IF;
  
  -- Set time filter
  time_filter := CASE p_time_window
    WHEN 'week' THEN NOW() - INTERVAL '7 days'
    WHEN 'month' THEN NOW() - INTERVAL '30 days'
    WHEN 'quarter' THEN NOW() - INTERVAL '90 days'
    ELSE NOW() - INTERVAL '30 days'
  END;
  
  -- Build role-specific response
  IF user_role IN ('admin', 'executive') THEN
    -- Executive view: organization-wide metrics
    result := json_build_object(
      'organization_metrics', (
        SELECT json_build_object(
          'total_users', COUNT(DISTINCT u.id),
          'active_users', COUNT(DISTINCT ui.user_id),
          'total_sessions', COUNT(DISTINCT ui.session_id),
          'avg_severity', AVG(ui.severity_rating),
          'departments', COUNT(DISTINCT u.department)
        )
        FROM users u
        LEFT JOIN user_interactions ui ON u.id = ui.user_id 
          AND ui.created_at >= time_filter
        WHERE u.organization_id = user_org_id
      )
    );
    
  ELSIF user_role = 'hr' THEN
    -- HR view: people analytics
    result := json_build_object(
      'workforce_analytics', (
        SELECT json_build_object(
          'total_employees', COUNT(DISTINCT u.id),
          'departments', COUNT(DISTINCT u.department),
          'avg_participation', AVG(ohm.participation_rate)
        )
        FROM users u
        LEFT JOIN organizational_health_metrics ohm ON u.organization_id = ohm.organization_id
        WHERE u.organization_id = user_org_id
      )
    );
    
  ELSIF user_role = 'manager' THEN
    -- Manager view: team-specific metrics
    result := json_build_object(
      'team_metrics', (
        SELECT json_build_object(
          'department', user_dept,
          'team_size', COUNT(DISTINCT u.id),
          'avg_severity', AVG(ui.severity_rating)
        )
        FROM users u
        LEFT JOIN user_interactions ui ON u.id = ui.user_id
        WHERE u.organization_id = user_org_id 
          AND u.department = user_dept
      )
    );
    
  ELSE
    -- Member view: personal analytics only
    result := json_build_object(
      'personal_metrics', (
        SELECT json_build_object(
          'total_sessions', COUNT(DISTINCT session_id),
          'total_interactions', COUNT(*),
          'avg_severity', AVG(severity_rating)
        )
        FROM user_interactions 
        WHERE user_id = p_user_id 
          AND created_at >= time_filter
      )
    );
  END IF;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;

-- Step 12: Set up Row Level Security
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY user_interactions_org_policy ON user_interactions
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY workspace_sessions_org_policy ON workspace_sessions
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY interventions_org_policy ON interventions
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Step 13: Grant appropriate permissions
GRANT SELECT ON behavior_patterns_realtime TO authenticated, anon;
GRANT SELECT ON organizational_health_metrics TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_analytics_for_role(UUID, TEXT) TO authenticated, anon;

-- Step 14: Insert default organization and sample data
INSERT INTO organizations (id, name, domain, subscription_tier, analytics_enabled) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Demo Enterprise Corp', 'democorp.com', 'enterprise', true)
ON CONFLICT (id) DO UPDATE SET 
  analytics_enabled = true,
  subscription_tier = 'enterprise';

-- Update existing users to be part of demo organization
UPDATE users SET 
  organization_id = '11111111-1111-1111-1111-111111111111',
  org_role = CASE 
    WHEN email LIKE '%ceo%' OR email LIKE '%executive%' THEN 'executive'
    WHEN email LIKE '%hr%' THEN 'hr'
    WHEN email LIKE '%manager%' THEN 'manager'
    ELSE 'member'
  END,
  department = CASE 
    WHEN email LIKE '%ceo%' OR email LIKE '%executive%' THEN 'Executive'
    WHEN email LIKE '%hr%' THEN 'Human Resources'
    WHEN email LIKE '%eng%' OR email LIKE '%tech%' THEN 'Engineering'
    WHEN email LIKE '%market%' THEN 'Marketing'
    ELSE 'General'
  END,
  is_active = true
WHERE organization_id IS NULL;

-- Create sample users if none exist
INSERT INTO users (id, email, organization_id, org_role, department, job_title, is_active) VALUES
  ('22222222-2222-2222-2222-222222222222', 'ceo@democorp.com', '11111111-1111-1111-1111-111111111111', 'executive', 'Executive', 'Chief Executive Officer', true),
  ('33333333-3333-3333-3333-333333333333', 'hr@democorp.com', '11111111-1111-1111-1111-111111111111', 'hr', 'Human Resources', 'HR Director', true),
  ('44444444-4444-4444-4444-444444444444', 'manager@democorp.com', '11111111-1111-1111-1111-111111111111', 'manager', 'Engineering', 'Engineering Manager', true),
  ('55555555-5555-5555-5555-555555555555', 'employee@democorp.com', '11111111-1111-1111-1111-111111111111', 'member', 'Engineering', 'Software Engineer', true)
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  org_role = EXCLUDED.org_role,
  department = EXCLUDED.department,
  job_title = EXCLUDED.job_title,
  is_active = EXCLUDED.is_active;

-- Update workspaces with organization
UPDATE workspaces SET 
  organization_id = '11111111-1111-1111-1111-111111111111',
  department = 'General',
  access_level = 'organization'
WHERE organization_id IS NULL;

-- Update hexie_cards with demo organization
UPDATE hexie_cards SET
  organization_id = '11111111-1111-1111-1111-111111111111',
  severity_rating = CASE 
    WHEN title ILIKE '%toxic%' OR title ILIKE '%conflict%' OR title ILIKE '%blame%' THEN 4
    WHEN title ILIKE '%stress%' OR title ILIKE '%pressure%' OR title ILIKE '%micro%' THEN 3
    WHEN title ILIKE '%communication%' OR title ILIKE '%meeting%' THEN 2
    ELSE 1
  END,
  environmental_factors = CASE
    WHEN category = 'Leadership' THEN '["pressure_from_above", "lack_of_trust", "perfectionism"]'::JSONB
    WHEN category = 'Communication' THEN '["remote_work", "time_pressure", "unclear_expectations"]'::JSONB
    WHEN category = 'Process' THEN '["poor_planning", "information_overload", "resource_constraints"]'::JSONB
    ELSE '["general_stress", "workload", "change_management"]'::JSONB
  END,
  subcategory = CASE
    WHEN category = 'Leadership' THEN 'Management Style'
    WHEN category = 'Culture' THEN 'Team Dynamics'
    WHEN category = 'Strategy' THEN 'Decision Making'
    WHEN category = 'Communication' THEN 'Information Flow'
    WHEN category = 'Process' THEN 'Time Management'
    ELSE 'General'
  END
WHERE organization_id IS NULL;

-- Record migration completion
INSERT INTO schema_migrations (version, description, rollback_sql) VALUES (
  '001-enterprise-analytics',
  'Add enterprise analytics capabilities with organizations, user interactions, and role-based access',
  '-- Rollback commands would go here'
) ON CONFLICT (version) DO NOTHING;

COMMIT;

-- Success notification
SELECT 'Migration 001-enterprise-analytics completed successfully!' as status;