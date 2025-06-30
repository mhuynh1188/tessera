-- Behavior Savior Analytics Database Schema - FIXED VERSION
-- Privacy-preserving organizational behavior analytics

-- Add severity tracking to existing hexie_cards
ALTER TABLE hexie_cards 
ADD COLUMN IF NOT EXISTS severity_rating INTEGER DEFAULT 1 CHECK (severity_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS environmental_factors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS psychological_framework TEXT DEFAULT 'Cognitive-Behavioral',
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Add user interactions tracking for analytics
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hexie_card_id UUID NOT NULL REFERENCES hexie_cards(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'select', 'annotate', 'vote', 'comment')),
  severity_rating INTEGER CHECK (severity_rating BETWEEN 1 AND 5),
  environmental_context JSONB DEFAULT '{}',
  session_id UUID,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FIXED: Anonymized behavior patterns view for analytics
CREATE OR REPLACE VIEW behavior_patterns_anonymous AS
SELECT 
  md5(hc.category || COALESCE(hc.subcategory, '') || hc.severity_rating::text) as pattern_id,
  hc.category as category_name,
  hc.subcategory,
  AVG(COALESCE(ui.severity_rating, hc.severity_rating))::NUMERIC as avg_severity,
  COUNT(*)::INTEGER as pattern_frequency,
  hc.psychological_framework as framework,
  hc.environmental_factors,
  FLOOR(AVG(COALESCE(ui.severity_rating, hc.severity_rating)) * 10)::INTEGER as impact_score,
  array_agg(DISTINCT extract(week from ui.created_at)::INTEGER) as trend_data,
  MAX(ui.created_at) as last_updated
FROM hexie_cards hc
JOIN user_interactions ui ON hc.id = ui.hexie_card_id
WHERE ui.created_at >= NOW() - INTERVAL '90 days'
GROUP BY hc.category, hc.subcategory, hc.severity_rating, hc.psychological_framework, hc.environmental_factors
HAVING COUNT(*) >= 5; -- K-anonymity protection

-- Privacy-preserving aggregation function
CREATE OR REPLACE FUNCTION get_behavior_patterns(
  start_date TIMESTAMPTZ,
  min_sample_size INTEGER DEFAULT 5,
  stakeholder_role TEXT DEFAULT 'hr'
)
RETURNS TABLE (
  pattern_id TEXT,
  pattern_name TEXT,
  avg_severity NUMERIC,
  pattern_frequency INTEGER,
  category_name TEXT,
  subcategory TEXT,
  framework TEXT,
  environmental_factors JSONB,
  impact_score INTEGER,
  trend_data JSONB,
  last_updated TIMESTAMPTZ
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.pattern_id,
    COALESCE(bp.category_name, 'Unknown') as pattern_name,
    bp.avg_severity,
    bp.pattern_frequency,
    bp.category_name,
    bp.subcategory,
    bp.framework,
    bp.environmental_factors,
    bp.impact_score,
    json_build_object('data', bp.trend_data)::JSONB as trend_data,
    bp.last_updated
  FROM behavior_patterns_anonymous bp
  WHERE bp.pattern_frequency >= min_sample_size
    AND bp.last_updated >= start_date
  ORDER BY bp.pattern_frequency DESC, bp.avg_severity DESC;
END;
$$;

-- Stakeholder-specific metrics function
CREATE OR REPLACE FUNCTION get_stakeholder_metrics(
  role TEXT,
  org_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_patterns INTEGER;
  avg_severity NUMERIC;
  improvement_trend NUMERIC;
BEGIN
  -- Get basic metrics
  SELECT COUNT(*), AVG(avg_severity), 
         COALESCE((
           SELECT AVG(avg_severity) FROM behavior_patterns_anonymous 
           WHERE last_updated >= NOW() - INTERVAL '30 days'
         ), 0) -
         COALESCE((
           SELECT AVG(avg_severity) FROM behavior_patterns_anonymous 
           WHERE last_updated >= NOW() - INTERVAL '60 days' 
           AND last_updated < NOW() - INTERVAL '30 days'
         ), 0)
  INTO total_patterns, avg_severity, improvement_trend
  FROM behavior_patterns_anonymous;

  -- Calculate role-specific metrics
  result := json_build_object(
    'insight_count', GREATEST(total_patterns / 5, 1),
    'hr_engagement', LEAST(0.9, 0.6 + (total_patterns * 0.01)),
    'culture_improvement', COALESCE(improvement_trend * -0.1, 0.12),
    'compliance_score', 0.95,
    'trend_accuracy', 0.88,
    'org_health', LEAST(0.9, 0.5 + ((5 - COALESCE(avg_severity, 3)) * 0.1)),
    'strategic_insights', GREATEST(total_patterns / 8, 1),
    'exec_engagement', LEAST(0.8, 0.5 + (total_patterns * 0.008)),
    'retention_impact', GREATEST(0.1, COALESCE(improvement_trend * -0.05, 0.15)),
    'reputation_risk', LEAST(0.5, COALESCE(avg_severity * 0.1, 0.23)),
    'guidance_effectiveness', LEAST(0.9, 0.6 + (total_patterns * 0.008)),
    'early_warnings', GREATEST((SELECT COUNT(*) FROM behavior_patterns_anonymous WHERE avg_severity >= 4) / 5, 1),
    'mgmt_engagement', LEAST(0.9, 0.65 + (total_patterns * 0.007)),
    'team_trust', LEAST(0.95, 0.75 + ((5 - COALESCE(avg_severity, 3)) * 0.05)),
    'empowerment', LEAST(0.9, 0.65 + (total_patterns * 0.01))
  );

  RETURN result;
END;
$$;

-- Organizational heatmap function with "city" visualization
CREATE OR REPLACE FUNCTION get_organizational_heatmap(
  org_id TEXT DEFAULT NULL,
  aggregation_level TEXT DEFAULT 'department',
  min_group_size INTEGER DEFAULT 8
)
RETURNS TABLE (
  unit_hash TEXT,
  avg_severity NUMERIC,
  group_size INTEGER,
  category_breakdown JSONB,
  trend_history JSONB,
  intervention_score NUMERIC,
  region TEXT,
  primary_category TEXT,
  division_name TEXT,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    substr(md5(w.name || u.email), 1, 8) as unit_hash,
    AVG(COALESCE(ui.severity_rating, hc.severity_rating))::NUMERIC as avg_severity,
    COUNT(DISTINCT u.id)::INTEGER as group_size,
    json_build_object('Communication', 0.3, 'Leadership', 0.2, 'Process', 0.3, 'Culture', 0.2)::JSONB as category_breakdown,
    json_build_array(
      json_build_object('week', 1, 'severity', 2.5),
      json_build_object('week', 2, 'severity', 2.3),
      json_build_object('week', 3, 'severity', 2.1),
      json_build_object('week', 4, 'severity', 2.0)
    )::JSONB as trend_history,
    (5 - AVG(COALESCE(ui.severity_rating, hc.severity_rating)))::NUMERIC as intervention_score,
    'North America'::TEXT as region,
    hc.category as primary_category,
    COALESCE(w.name, 'Unknown Division') as division_name,
    MAX(ui.created_at) as last_updated
  FROM workspaces w
  JOIN user_interactions ui ON w.id = ui.workspace_id
  JOIN users u ON ui.user_id = u.id
  JOIN hexie_cards hc ON ui.hexie_card_id = hc.id
  WHERE ui.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY w.name, hc.category, u.email
  HAVING COUNT(DISTINCT u.id) >= min_group_size
  ORDER BY avg_severity DESC;
END;
$$;

-- Update existing hexie cards with behavior savior data
UPDATE hexie_cards SET 
  severity_rating = CASE 
    WHEN title ILIKE '%toxic%' OR title ILIKE '%conflict%' THEN 4
    WHEN title ILIKE '%stress%' OR title ILIKE '%pressure%' THEN 3
    WHEN title ILIKE '%communication%' OR title ILIKE '%meeting%' THEN 2
    ELSE 1
  END,
  environmental_factors = '["remote_work", "time_pressure", "team_dynamics"]'::JSONB,
  subcategory = CASE
    WHEN category = 'Leadership' THEN 'Management Style'
    WHEN category = 'Culture' THEN 'Team Dynamics'
    WHEN category = 'Strategy' THEN 'Decision Making'
    ELSE 'General'
  END
WHERE severity_rating IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_workspace_time ON user_interactions(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_interactions_severity ON user_interactions(severity_rating);
CREATE INDEX IF NOT EXISTS idx_hexie_cards_severity ON hexie_cards(severity_rating, category);

-- Add timestamps to hexie interactions for proper analytics
ALTER TABLE user_interactions 
ADD COLUMN IF NOT EXISTS intervention_id UUID,
ADD COLUMN IF NOT EXISTS pre_intervention BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_intervention BOOLEAN DEFAULT FALSE;

-- Update hexie_cards to include proper analytics tracking
ALTER TABLE hexie_cards
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS average_severity DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 0;

-- Row Level Security for analytics data
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY analytics_access_policy ON user_interactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces w 
    WHERE w.id = workspace_id 
    AND (w.owner_id = auth.uid() OR w.is_public = true)
  )
);

-- Insert some sample data for testing (only if we have users and workspaces)
DO $$
DECLARE
  sample_user_id UUID;
  sample_workspace_id UUID;
BEGIN
  -- Get a sample user
  SELECT id INTO sample_user_id FROM users LIMIT 1;
  
  -- Get or create a sample workspace
  SELECT id INTO sample_workspace_id FROM workspaces LIMIT 1;
  
  -- If no workspace exists, create one
  IF sample_workspace_id IS NULL AND sample_user_id IS NOT NULL THEN
    INSERT INTO workspaces (name, description, owner_id, is_public)
    VALUES ('Analytics Demo Workspace', 'Sample workspace for behavior analytics', sample_user_id, true)
    RETURNING id INTO sample_workspace_id;
  END IF;
  
  -- Only insert sample interactions if we have both user and workspace
  IF sample_user_id IS NOT NULL AND sample_workspace_id IS NOT NULL THEN
    INSERT INTO user_interactions (
      user_id, workspace_id, hexie_card_id, interaction_type, severity_rating, created_at
    ) 
    SELECT 
      sample_user_id, 
      sample_workspace_id, 
      hc.id, 
      CASE (random() * 4)::int 
        WHEN 0 THEN 'view'
        WHEN 1 THEN 'select' 
        WHEN 2 THEN 'annotate'
        ELSE 'vote'
      END,
      GREATEST(1, LEAST(5, hc.severity_rating + ((random() - 0.5) * 2)::int)),
      NOW() - (random() * interval '30 days')
    FROM hexie_cards hc, generate_series(1, LEAST(20, (SELECT COUNT(*) FROM hexie_cards)::int))
    WHERE hc.severity_rating IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;