-- ENTERPRISE ANALYTICS DATABASE SCHEMA
-- Real data-driven organizational behavior analytics with multi-tenancy
-- Created: June 20, 2025

-- ========================================
-- ORGANIZATIONS & ENTERPRISE MANAGEMENT
-- ========================================

-- Organizations table for enterprise multi-tenancy
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE, -- company domain for email-based organization assignment
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

-- Enhanced users table with proper org roles
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS org_role TEXT DEFAULT 'member' CHECK (org_role IN ('admin', 'executive', 'hr', 'manager', 'member')),
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Workspaces belong to organizations
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'department' CHECK (access_level IN ('private', 'department', 'organization', 'public'));

-- ========================================
-- REAL DATA COLLECTION & TRACKING
-- ========================================

-- Enhanced user interactions for comprehensive analytics
DROP TABLE IF EXISTS user_interactions CASCADE;
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hexie_card_id UUID NOT NULL REFERENCES hexie_cards(id) ON DELETE CASCADE,
  session_id UUID NOT NULL, -- Groups interactions in same session
  
  -- Interaction details
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'select', 'place', 'move', 'annotate', 'vote', 'comment', 'group', 'export')),
  severity_rating INTEGER CHECK (severity_rating BETWEEN 1 AND 5),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5) DEFAULT 3,
  
  -- Context data
  workspace_context JSONB DEFAULT '{}', -- Number of participants, session type, etc.
  environmental_factors JSONB DEFAULT '[]', -- ["remote_work", "high_pressure", "team_conflict"]
  intervention_context JSONB DEFAULT '{}', -- If part of intervention
  
  -- Timing
  duration_seconds INTEGER DEFAULT 0,
  sequence_number INTEGER DEFAULT 1, -- Order within session
  
  -- Analytics metadata
  user_agent TEXT,
  ip_address_hash TEXT, -- Hashed for privacy
  device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace sessions for analytics grouping
CREATE TABLE IF NOT EXISTS workspace_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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

-- Enhanced hexie cards with organizational context
ALTER TABLE hexie_cards
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS avg_severity_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS department_usage JSONB DEFAULT '{}'; -- Track which departments use this card

-- ========================================
-- INTERVENTIONS & ACTION TRACKING
-- ========================================

-- Enhanced interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Intervention details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_patterns TEXT[] NOT NULL, -- Array of hexie card IDs or pattern names
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

-- ========================================
-- REAL-TIME ANALYTICS VIEWS & FUNCTIONS
-- ========================================

-- Real-time behavior patterns aggregation
CREATE OR REPLACE VIEW behavior_patterns_realtime AS
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
  MODE() WITHIN GROUP (ORDER BY ui.severity_rating) as most_common_severity,
  
  -- Confidence and engagement
  AVG(ui.confidence_level)::NUMERIC(3,2) as avg_confidence,
  AVG(ui.duration_seconds)::INTEGER as avg_engagement_time,
  
  -- Frequency analysis
  COUNT(ui.id)::DECIMAL / NULLIF(COUNT(DISTINCT DATE(ui.created_at)), 0) as daily_frequency,
  
  -- Trend data (last 4 weeks)
  json_agg(
    json_build_object(
      'week', EXTRACT(week FROM ui.created_at),
      'severity', AVG(ui.severity_rating),
      'frequency', COUNT(ui.id)
    ) ORDER BY EXTRACT(week FROM ui.created_at)
  ) as trend_data,
  
  -- Environmental context
  (
    SELECT json_agg(DISTINCT factor)
    FROM (
      SELECT jsonb_array_elements_text(ui.environmental_factors) as factor
    ) factors
  ) as common_environmental_factors,
  
  -- Last updated
  MAX(ui.created_at) as last_interaction,
  NOW() as calculated_at

FROM hexie_cards hc
JOIN user_interactions ui ON hc.id = ui.hexie_card_id
WHERE ui.created_at >= NOW() - INTERVAL '90 days'
  AND ui.organization_id IS NOT NULL
GROUP BY hc.id, hc.title, hc.category, hc.subcategory, ui.organization_id
HAVING COUNT(DISTINCT ui.user_id) >= 3; -- Privacy: minimum 3 users

-- Organizational health metrics by department
CREATE OR REPLACE VIEW organizational_health_metrics AS
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
  (COUNT(ui.id)::DECIMAL / NULLIF(COUNT(DISTINCT ui.session_id), 0))::NUMERIC(5,2) as interactions_per_session,
  
  -- Health indicators
  AVG(ui.severity_rating)::NUMERIC(3,2) as avg_severity_score,
  COUNT(CASE WHEN ui.severity_rating >= 4 THEN 1 END)::DECIMAL / NULLIF(COUNT(ui.id), 0) * 100 as high_severity_percentage,
  
  -- Top patterns for this department
  array_agg(DISTINCT hc.title ORDER BY COUNT(ui.id) DESC)[1:5] as top_behavior_patterns,
  
  -- Improvement tracking
  (
    SELECT AVG(severity_rating) 
    FROM user_interactions ui2 
    WHERE ui2.organization_id = u.organization_id 
      AND COALESCE(
        (SELECT department FROM users WHERE id = ui2.user_id), 
        'Unknown'
      ) = COALESCE(u.department, 'Unknown')
      AND ui2.created_at >= NOW() - INTERVAL '30 days'
  )::NUMERIC(3,2) as severity_last_30_days,
  
  (
    SELECT AVG(severity_rating) 
    FROM user_interactions ui3 
    WHERE ui3.organization_id = u.organization_id 
      AND COALESCE(
        (SELECT department FROM users WHERE id = ui3.user_id), 
        'Unknown'
      ) = COALESCE(u.department, 'Unknown')
      AND ui3.created_at >= NOW() - INTERVAL '60 days'
      AND ui3.created_at < NOW() - INTERVAL '30 days'
  )::NUMERIC(3,2) as severity_30_60_days_ago,
  
  NOW() as calculated_at

FROM users u
LEFT JOIN user_interactions ui ON u.id = ui.user_id 
  AND ui.created_at >= NOW() - INTERVAL '90 days'
LEFT JOIN hexie_cards hc ON ui.hexie_card_id = hc.id
WHERE u.organization_id IS NOT NULL 
  AND u.is_active = true
GROUP BY u.organization_id, u.department
HAVING COUNT(DISTINCT u.id) >= 3; -- Privacy: minimum 3 users per department

-- Function to get role-based analytics data
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
    SELECT json_build_object(
      'organization_metrics', (
        SELECT json_build_object(
          'total_users', COUNT(DISTINCT u.id),
          'active_users', COUNT(DISTINCT ui.user_id),
          'total_sessions', COUNT(DISTINCT ui.session_id),
          'avg_severity', AVG(ui.severity_rating),
          'improvement_trend', (
            SELECT (old_avg - new_avg) FROM (
              SELECT AVG(severity_rating) as old_avg FROM user_interactions 
              WHERE organization_id = user_org_id 
                AND created_at >= time_filter - INTERVAL '30 days'
                AND created_at < time_filter
            ) old, (
              SELECT AVG(severity_rating) as new_avg FROM user_interactions 
              WHERE organization_id = user_org_id 
                AND created_at >= time_filter
            ) new
          )
        )
        FROM users u
        LEFT JOIN user_interactions ui ON u.id = ui.user_id 
          AND ui.created_at >= time_filter
        WHERE u.organization_id = user_org_id
      ),
      'department_breakdown', (
        SELECT json_agg(
          json_build_object(
            'department', department,
            'participation_rate', participation_rate,
            'avg_severity', avg_severity_score,
            'total_sessions', total_sessions
          )
        )
        FROM organizational_health_metrics 
        WHERE organization_id = user_org_id
      ),
      'top_patterns', (
        SELECT json_agg(
          json_build_object(
            'pattern_name', pattern_name,
            'category', category,
            'avg_severity', avg_severity,
            'frequency', total_interactions
          ) ORDER BY total_interactions DESC
        )
        FROM behavior_patterns_realtime 
        WHERE organization_id = user_org_id
        LIMIT 10
      )
    ) INTO result;
    
  ELSIF user_role = 'hr' THEN
    -- HR view: people analytics and interventions
    SELECT json_build_object(
      'workforce_analytics', (
        SELECT json_build_object(
          'total_employees', COUNT(DISTINCT u.id),
          'departments', COUNT(DISTINCT u.department),
          'participation_by_dept', json_agg(
            json_build_object(
              'department', department,
              'participation_rate', participation_rate,
              'avg_severity', avg_severity_score
            )
          )
        )
        FROM organizational_health_metrics 
        WHERE organization_id = user_org_id
      ),
      'intervention_effectiveness', (
        SELECT json_agg(
          json_build_object(
            'title', title,
            'status', status,
            'effectiveness_score', effectiveness_score,
            'participant_count', participant_count,
            'roi', roi_calculated
          )
        )
        FROM interventions 
        WHERE organization_id = user_org_id
          AND created_at >= time_filter
        ORDER BY created_at DESC
        LIMIT 5
      )
    ) INTO result;
    
  ELSIF user_role = 'manager' THEN
    -- Manager view: team-specific metrics
    SELECT json_build_object(
      'team_metrics', (
        SELECT json_build_object(
          'department', user_dept,
          'team_size', total_employees,
          'participation_rate', participation_rate,
          'avg_severity', avg_severity_score,
          'total_sessions', total_sessions,
          'improvement_trend', (severity_30_60_days_ago - severity_last_30_days)
        )
        FROM organizational_health_metrics 
        WHERE organization_id = user_org_id 
          AND department = user_dept
      ),
      'team_patterns', (
        SELECT json_agg(
          json_build_object(
            'pattern_name', bp.pattern_name,
            'avg_severity', bp.avg_severity,
            'frequency', bp.total_interactions
          )
        )
        FROM behavior_patterns_realtime bp
        JOIN user_interactions ui ON bp.hexie_card_id = ui.hexie_card_id
        JOIN users u ON ui.user_id = u.id
        WHERE bp.organization_id = user_org_id
          AND u.department = user_dept
          AND ui.created_at >= time_filter
        GROUP BY bp.hexie_card_id, bp.pattern_name, bp.avg_severity, bp.total_interactions
        ORDER BY bp.total_interactions DESC
        LIMIT 10
      )
    ) INTO result;
    
  ELSE
    -- Member view: personal analytics only
    SELECT json_build_object(
      'personal_metrics', (
        SELECT json_build_object(
          'total_sessions', COUNT(DISTINCT session_id),
          'total_interactions', COUNT(*),
          'avg_severity', AVG(severity_rating),
          'engagement_time', SUM(duration_seconds),
          'patterns_explored', COUNT(DISTINCT hexie_card_id)
        )
        FROM user_interactions 
        WHERE user_id = p_user_id 
          AND created_at >= time_filter
      )
    ) INTO result;
  END IF;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;

-- ========================================
-- SAMPLE DATA FOR TESTING
-- ========================================

-- Insert sample organization
INSERT INTO organizations (id, name, domain, subscription_tier, analytics_enabled) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Demo Enterprise Corp', 'democorp.com', 'enterprise', true)
ON CONFLICT (id) DO UPDATE SET 
  analytics_enabled = true,
  subscription_tier = 'enterprise';

-- Update existing users or create sample users
DO $$
DECLARE
  demo_org_id UUID := '11111111-1111-1111-1111-111111111111';
  exec_user_id UUID;
  hr_user_id UUID;
  mgr_user_id UUID;
  member_user_id UUID;
BEGIN
  -- Create or update sample users
  INSERT INTO users (id, email, organization_id, org_role, department, job_title, is_active) VALUES
    ('22222222-2222-2222-2222-222222222222', 'ceo@democorp.com', demo_org_id, 'executive', 'Executive', 'Chief Executive Officer', true),
    ('33333333-3333-3333-3333-333333333333', 'hr@democorp.com', demo_org_id, 'hr', 'Human Resources', 'HR Director', true),
    ('44444444-4444-4444-4444-444444444444', 'manager@democorp.com', demo_org_id, 'manager', 'Engineering', 'Engineering Manager', true),
    ('55555555-5555-5555-5555-555555555555', 'employee@democorp.com', demo_org_id, 'member', 'Engineering', 'Software Engineer', true),
    ('66666666-6666-6666-6666-666666666666', 'analyst@democorp.com', demo_org_id, 'member', 'Marketing', 'Data Analyst', true)
  ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    org_role = EXCLUDED.org_role,
    department = EXCLUDED.department,
    job_title = EXCLUDED.job_title,
    is_active = EXCLUDED.is_active;
    
  -- Update existing users without organization
  UPDATE users SET 
    organization_id = demo_org_id,
    org_role = 'member',
    department = 'General',
    is_active = true
  WHERE organization_id IS NULL;
END $$;

-- Create sample workspace with organization
INSERT INTO workspaces (id, name, description, organization_id, department, access_level, is_public, owner_id) 
SELECT 
  '77777777-7777-7777-7777-777777777777',
  'Enterprise Analytics Demo Workspace',
  'Sample workspace for testing enterprise analytics',
  '11111111-1111-1111-1111-111111111111',
  'Engineering',
  'department',
  true,
  id
FROM users WHERE org_role = 'executive' LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  department = EXCLUDED.department;

-- Insert comprehensive sample interaction data
DO $$
DECLARE
  demo_org_id UUID := '11111111-1111-1111-1111-111111111111';
  demo_workspace_id UUID := '77777777-7777-7777-7777-777777777777';
  user_ids UUID[];
  hexie_ids UUID[];
  session_id UUID;
  i INTEGER;
BEGIN
  -- Get user and hexie IDs
  SELECT array_agg(id) INTO user_ids FROM users WHERE organization_id = demo_org_id;
  SELECT array_agg(id) INTO hexie_ids FROM hexie_cards WHERE is_active = true LIMIT 10;
  
  -- Generate sample sessions and interactions
  FOR i IN 1..50 LOOP
    session_id := uuid_generate_v4();
    
    -- Insert session
    INSERT INTO workspace_sessions (
      id, workspace_id, organization_id, facilitator_id, session_type, session_name,
      participant_count, department, started_at, ended_at, satisfaction_score
    ) VALUES (
      session_id,
      demo_workspace_id,
      demo_org_id,
      user_ids[1 + (i % array_length(user_ids, 1))],
      CASE (i % 4) WHEN 0 THEN 'workshop' WHEN 1 THEN 'team_meeting' WHEN 2 THEN 'training' ELSE 'assessment' END,
      'Session ' || i,
      3 + (i % 8),
      CASE (i % 3) WHEN 0 THEN 'Engineering' WHEN 1 THEN 'Marketing' ELSE 'Human Resources' END,
      NOW() - (random() * interval '60 days'),
      NOW() - (random() * interval '60 days') + interval '2 hours',
      3.0 + (random() * 2.0)
    );
    
    -- Insert multiple interactions per session
    FOR j IN 1..(3 + (i % 7)) LOOP
      INSERT INTO user_interactions (
        user_id, organization_id, workspace_id, hexie_card_id, session_id,
        interaction_type, severity_rating, confidence_level,
        environmental_factors, duration_seconds, sequence_number, created_at
      ) VALUES (
        user_ids[1 + (j % array_length(user_ids, 1))],
        demo_org_id,
        demo_workspace_id,
        hexie_ids[1 + (j % array_length(hexie_ids, 1))],
        session_id,
        CASE (j % 5) WHEN 0 THEN 'view' WHEN 1 THEN 'select' WHEN 2 THEN 'place' WHEN 3 THEN 'annotate' ELSE 'vote' END,
        1 + (j % 5),
        3 + (j % 3),
        CASE (j % 3) 
          WHEN 0 THEN '["remote_work", "time_pressure"]'::JSONB
          WHEN 1 THEN '["team_conflict", "resource_constraints"]'::JSONB 
          ELSE '["high_workload", "unclear_expectations"]'::JSONB
        END,
        30 + (random() * 300)::INTEGER,
        j,
        NOW() - (random() * interval '60 days')
      );
    END LOOP;
  END LOOP;
END $$;

-- Update hexie_cards with organization and usage stats
UPDATE hexie_cards SET
  organization_id = '11111111-1111-1111-1111-111111111111',
  usage_count = (
    SELECT COUNT(*) FROM user_interactions ui 
    WHERE ui.hexie_card_id = hexie_cards.id
  ),
  avg_severity_rating = (
    SELECT AVG(severity_rating) FROM user_interactions ui 
    WHERE ui.hexie_card_id = hexie_cards.id
  ),
  total_interactions = (
    SELECT COUNT(*) FROM user_interactions ui 
    WHERE ui.hexie_card_id = hexie_cards.id
  ),
  last_used_at = (
    SELECT MAX(created_at) FROM user_interactions ui 
    WHERE ui.hexie_card_id = hexie_cards.id
  )
WHERE EXISTS (
  SELECT 1 FROM user_interactions ui WHERE ui.hexie_card_id = hexie_cards.id
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_org_time ON user_interactions(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_session ON user_interactions(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_hexie_severity ON user_interactions(hexie_card_id, severity_rating);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, org_role);
CREATE INDEX IF NOT EXISTS idx_workspaces_org_dept ON workspaces(organization_id, department);

-- Row Level Security policies
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access data from their organization
CREATE POLICY user_interactions_org_policy ON user_interactions
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY organizations_member_policy ON organizations
FOR SELECT USING (
  id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Grant permissions to authenticated users
GRANT SELECT ON behavior_patterns_realtime TO authenticated;
GRANT SELECT ON organizational_health_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_for_role(UUID, TEXT) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Enterprise Analytics Database Schema created successfully!';
  RAISE NOTICE 'Sample data inserted for organization: Demo Enterprise Corp';
  RAISE NOTICE 'Test the analytics with: SELECT get_analytics_for_role(user_id, ''month'');';
END $$;