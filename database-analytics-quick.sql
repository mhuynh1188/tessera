-- Quick Analytics Setup for Demo
-- Add organization support and sample data

-- Add organization columns to existing tables if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS org_role TEXT DEFAULT 'member' CHECK (org_role IN ('admin', 'executive', 'hr', 'manager', 'member')),
ADD COLUMN IF NOT EXISTS department TEXT;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'enterprise',
  analytics_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_interactions table for analytics
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID,
  workspace_id UUID REFERENCES workspaces(id),
  hexie_card_id UUID REFERENCES hexie_cards(id),
  session_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  interaction_type TEXT NOT NULL DEFAULT 'view',
  severity_rating INTEGER DEFAULT 3 CHECK (severity_rating BETWEEN 1 AND 5),
  confidence_level INTEGER DEFAULT 3 CHECK (confidence_level BETWEEN 1 AND 5),
  environmental_factors JSONB DEFAULT '[]',
  duration_seconds INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert demo organization
INSERT INTO organizations (id, name, domain, subscription_tier, analytics_enabled) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Demo Enterprise Corp', 'democorp.com', 'enterprise', true)
ON CONFLICT (id) DO NOTHING;

-- Update existing users with organization and roles
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
  END
WHERE organization_id IS NULL;

-- Create sample users if none exist
INSERT INTO users (id, email, organization_id, org_role, department) VALUES
  ('22222222-2222-2222-2222-222222222222', 'ceo@democorp.com', '11111111-1111-1111-1111-111111111111', 'executive', 'Executive'),
  ('33333333-3333-3333-3333-333333333333', 'hr@democorp.com', '11111111-1111-1111-1111-111111111111', 'hr', 'Human Resources'),
  ('44444444-4444-4444-4444-444444444444', 'manager@democorp.com', '11111111-1111-1111-1111-111111111111', 'manager', 'Engineering')
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  org_role = EXCLUDED.org_role,
  department = EXCLUDED.department;

-- Update workspaces with organization
UPDATE workspaces SET organization_id = '11111111-1111-1111-1111-111111111111' WHERE organization_id IS NULL;

-- Generate sample interaction data
DO $$
DECLARE
  demo_org_id UUID := '11111111-1111-1111-1111-111111111111';
  user_ids UUID[];
  hexie_ids UUID[];
  workspace_id UUID;
  session_id UUID;
  i INTEGER;
BEGIN
  -- Get user and hexie IDs
  SELECT array_agg(id) INTO user_ids FROM users WHERE organization_id = demo_org_id LIMIT 10;
  SELECT array_agg(id) INTO hexie_ids FROM hexie_cards WHERE is_active = true LIMIT 10;
  SELECT id INTO workspace_id FROM workspaces WHERE organization_id = demo_org_id LIMIT 1;
  
  -- Only proceed if we have data
  IF array_length(user_ids, 1) > 0 AND array_length(hexie_ids, 1) > 0 AND workspace_id IS NOT NULL THEN
    -- Generate 100 sample interactions
    FOR i IN 1..100 LOOP
      session_id := uuid_generate_v4();
      
      INSERT INTO user_interactions (
        user_id, organization_id, workspace_id, hexie_card_id, session_id,
        interaction_type, severity_rating, confidence_level,
        environmental_factors, duration_seconds, created_at
      ) VALUES (
        user_ids[1 + (i % array_length(user_ids, 1))],
        demo_org_id,
        workspace_id,
        hexie_ids[1 + (i % array_length(hexie_ids, 1))],
        session_id,
        CASE (i % 5) WHEN 0 THEN 'view' WHEN 1 THEN 'select' WHEN 2 THEN 'place' WHEN 3 THEN 'annotate' ELSE 'vote' END,
        1 + (i % 5),
        3 + (i % 3),
        CASE (i % 3) 
          WHEN 0 THEN '["remote_work", "time_pressure"]'::JSONB
          WHEN 1 THEN '["team_conflict", "resource_constraints"]'::JSONB 
          ELSE '["high_workload", "unclear_expectations"]'::JSONB
        END,
        30 + (random() * 300)::INTEGER,
        NOW() - (random() * interval '30 days')
      );
    END LOOP;
  END IF;
END $$;

-- Create the simplified analytics function
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
  result JSONB;
  total_interactions INTEGER;
  unique_users INTEGER;
  avg_severity NUMERIC;
BEGIN
  -- Get user organization and role
  SELECT organization_id, org_role, department 
  INTO user_org_id, user_role, user_dept
  FROM users WHERE id = p_user_id;
  
  IF user_org_id IS NULL THEN
    RETURN '{"error": "User not associated with organization"}'::JSONB;
  END IF;
  
  -- Get basic metrics
  SELECT 
    COUNT(*),
    COUNT(DISTINCT user_id),
    AVG(severity_rating)
  INTO total_interactions, unique_users, avg_severity
  FROM user_interactions 
  WHERE organization_id = user_org_id;
  
  -- Build response
  result := json_build_object(
    'organization_metrics', json_build_object(
      'total_interactions', COALESCE(total_interactions, 0),
      'unique_users', COALESCE(unique_users, 0),
      'avg_severity', COALESCE(avg_severity, 2.5)
    ),
    'user_role', user_role,
    'department', user_dept,
    'organization_id', user_org_id
  );
  
  RETURN result;
END;
$$;

-- Create behavior patterns view
CREATE OR REPLACE VIEW behavior_patterns_realtime AS
SELECT 
  hc.id as hexie_card_id,
  hc.title as pattern_name,
  hc.category,
  hc.subcategory,
  ui.organization_id,
  COUNT(ui.id) as total_interactions,
  COUNT(DISTINCT ui.user_id) as unique_users,
  AVG(ui.severity_rating)::NUMERIC(3,2) as avg_severity,
  AVG(ui.confidence_level)::NUMERIC(3,2) as avg_confidence,
  AVG(ui.duration_seconds)::INTEGER as avg_engagement_time,
  array_agg(
    json_build_object(
      'week', EXTRACT(week FROM ui.created_at),
      'severity', ui.severity_rating
    )
  ) as trend_data,
  MAX(ui.created_at) as last_interaction
FROM hexie_cards hc
JOIN user_interactions ui ON hc.id = ui.hexie_card_id
WHERE ui.created_at >= NOW() - INTERVAL '90 days'
  AND ui.organization_id IS NOT NULL
GROUP BY hc.id, hc.title, hc.category, hc.subcategory, ui.organization_id
HAVING COUNT(DISTINCT ui.user_id) >= 1; -- Relaxed for demo

-- Create organizational health view
CREATE OR REPLACE VIEW organizational_health_metrics AS
SELECT 
  u.organization_id,
  COALESCE(u.department, 'Unknown') as department,
  COUNT(DISTINCT u.id) as total_employees,
  COUNT(DISTINCT ui.user_id) as active_users,
  (COUNT(DISTINCT ui.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT u.id), 0) * 100)::NUMERIC(5,2) as participation_rate,
  COUNT(ui.id) as total_interactions,
  AVG(ui.severity_rating)::NUMERIC(3,2) as avg_severity_score,
  COUNT(DISTINCT ui.session_id) as total_sessions,
  2.8::NUMERIC(3,2) as severity_last_30_days,
  3.1::NUMERIC(3,2) as severity_30_60_days_ago
FROM users u
LEFT JOIN user_interactions ui ON u.id = ui.user_id 
WHERE u.organization_id IS NOT NULL 
GROUP BY u.organization_id, u.department;

-- Grant permissions
GRANT SELECT ON behavior_patterns_realtime TO anon, authenticated;
GRANT SELECT ON organizational_health_metrics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_for_role(UUID, TEXT) TO anon, authenticated;

-- Success message
SELECT 'Analytics setup complete! Test users created with sample data.' as status;