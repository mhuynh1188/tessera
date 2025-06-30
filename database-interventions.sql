-- Interventions Database Schema
-- Complete intervention tracking and management system

-- Organizations table for multi-tenancy
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'hr', 'executive', 'middle_management', 'member'));

-- Interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_pattern TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'paused', 'cancelled')),
  effectiveness_score DECIMAL(3,2) DEFAULT 0.0 CHECK (effectiveness_score >= 0.0 AND effectiveness_score <= 5.0),
  start_date DATE NOT NULL,
  end_date DATE,
  target_metrics JSONB NOT NULL DEFAULT '{"severity_reduction": 0, "frequency_reduction": 0}',
  actual_metrics JSONB DEFAULT '{"severity_reduction": 0, "frequency_reduction": 0}',
  stakeholder_role TEXT NOT NULL CHECK (stakeholder_role IN ('hr', 'executive', 'middle_management')),
  category TEXT NOT NULL,
  participants_count INTEGER DEFAULT 0,
  budget_allocated DECIMAL(10,2) DEFAULT 0.0,
  budget_spent DECIMAL(10,2) DEFAULT 0.0,
  roi_estimate DECIMAL(4,2),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intervention participants tracking
CREATE TABLE IF NOT EXISTS intervention_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  participant_role TEXT DEFAULT 'participant' CHECK (participant_role IN ('facilitator', 'participant', 'observer')),
  attendance_score DECIMAL(3,2) DEFAULT 0.0,
  feedback_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intervention progress tracking
CREATE TABLE IF NOT EXISTS intervention_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_description TEXT,
  target_date DATE,
  completion_date DATE,
  completion_percentage DECIMAL(5,2) DEFAULT 0.0 CHECK (completion_percentage >= 0.0 AND completion_percentage <= 100.0),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add timestamps to hexie interactions for proper analytics
ALTER TABLE user_interactions 
ADD COLUMN IF NOT EXISTS intervention_id UUID REFERENCES interventions(id),
ADD COLUMN IF NOT EXISTS pre_intervention BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_intervention BOOLEAN DEFAULT FALSE;

-- Update hexie_cards to include proper analytics tracking
ALTER TABLE hexie_cards
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS average_severity DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interventions_org_status ON interventions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_interventions_stakeholder ON interventions(stakeholder_role, status);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamps ON user_interactions(created_at, intervention_id);
CREATE INDEX IF NOT EXISTS idx_hexie_cards_analytics ON hexie_cards(organization_id, created_at, average_severity);

-- Function to create a new intervention
CREATE OR REPLACE FUNCTION create_intervention(
  p_organization_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_target_pattern TEXT,
  p_category TEXT,
  p_stakeholder_role TEXT,
  p_start_date DATE,
  p_target_severity_reduction INTEGER,
  p_target_frequency_reduction INTEGER,
  p_participants_count INTEGER,
  p_budget_allocated DECIMAL,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  intervention_id UUID;
BEGIN
  INSERT INTO interventions (
    organization_id,
    title,
    description,
    target_pattern,
    category,
    stakeholder_role,
    start_date,
    target_metrics,
    participants_count,
    budget_allocated,
    created_by
  ) VALUES (
    p_organization_id,
    p_title,
    p_description,
    p_target_pattern,
    p_category,
    p_stakeholder_role,
    p_start_date,
    json_build_object(
      'severity_reduction', p_target_severity_reduction,
      'frequency_reduction', p_target_frequency_reduction
    ),
    p_participants_count,
    p_budget_allocated,
    p_created_by
  ) RETURNING id INTO intervention_id;
  
  RETURN intervention_id;
END;
$$;

-- Function to get interventions by organization and role
CREATE OR REPLACE FUNCTION get_interventions_by_role(
  p_organization_id UUID,
  p_stakeholder_role TEXT,
  p_status_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  target_pattern TEXT,
  status TEXT,
  effectiveness_score DECIMAL,
  start_date DATE,
  end_date DATE,
  target_metrics JSONB,
  actual_metrics JSONB,
  participants_count INTEGER,
  budget_allocated DECIMAL,
  roi_estimate DECIMAL,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.description,
    i.target_pattern,
    i.status,
    i.effectiveness_score,
    i.start_date,
    i.end_date,
    i.target_metrics,
    i.actual_metrics,
    i.participants_count,
    i.budget_allocated,
    i.roi_estimate,
    i.created_at
  FROM interventions i
  WHERE i.organization_id = p_organization_id
    AND (p_stakeholder_role = 'admin' OR i.stakeholder_role = p_stakeholder_role)
    AND (p_status_filter = 'all' OR i.status = p_status_filter)
  ORDER BY i.created_at DESC;
END;
$$;

-- Row Level Security policies
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_progress ENABLE ROW LEVEL SECURITY;

-- RLS policy for interventions
CREATE POLICY interventions_access_policy ON interventions
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- RLS policy for intervention participants
CREATE POLICY intervention_participants_access_policy ON intervention_participants
FOR ALL
USING (
  intervention_id IN (
    SELECT id FROM interventions WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  )
);

-- Sample organization and data
INSERT INTO organizations (id, name, subscription_tier) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Organization', 'premium')
ON CONFLICT (id) DO NOTHING;

-- Update users to have organization and roles
UPDATE users SET 
  organization_id = '00000000-0000-0000-0000-000000000001',
  role = 'hr'
WHERE organization_id IS NULL;