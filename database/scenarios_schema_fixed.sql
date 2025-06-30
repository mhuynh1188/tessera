-- Scenario Library Database Schema - PostgreSQL Compatible
-- This creates the tables needed for the scenario-based learning system

-- Workplace categories/industries
CREATE TABLE IF NOT EXISTS scenario_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- Icon identifier for UI
  color VARCHAR(7), -- Hex color code
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Individual scenarios/stories (simplified - removed story_type_id dependency)
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES scenario_categories(id) ON DELETE CASCADE,
  
  -- Story metadata
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(300),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5), -- 1=beginner, 5=expert
  estimated_time_minutes INTEGER DEFAULT 30,
  
  -- Story content
  setting TEXT NOT NULL, -- The workplace context/environment
  characters JSONB NOT NULL, -- Array of character objects with roles, personalities
  situation TEXT NOT NULL, -- The main problem/challenge description
  background_context TEXT, -- Additional context that led to this situation
  underlying_tensions TEXT, -- Hidden conflicts or systemic issues
  
  -- Learning objectives
  learning_objectives TEXT[], -- What participants should learn
  key_antipatterns TEXT[], -- Main antipatterns this scenario demonstrates
  suggested_hexies TEXT[], -- Recommended hexie IDs for this scenario
  
  -- Facilitation aids
  discussion_prompts TEXT[], -- Questions to guide reflection
  intervention_hints TEXT[], -- Subtle guidance for solutions
  success_indicators TEXT[], -- What good outcomes look like
  
  -- Metadata
  complexity_tags TEXT[], -- e.g., "interpersonal", "systemic", "cultural"
  industry_specific_elements TEXT[], -- Elements specific to the industry
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
  -- Admin fields
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- User ratings and feedback on scenarios
CREATE TABLE IF NOT EXISTS scenario_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  difficulty_experienced INTEGER CHECK (difficulty_experienced BETWEEN 1 AND 5),
  time_spent_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scenario_id, user_id)
);

-- Scenario usage in workspaces
CREATE TABLE IF NOT EXISTS workspace_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id VARCHAR(100), -- Allow string workspace IDs for demo workspaces
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  facilitator_notes TEXT,
  outcome_summary TEXT,
  hexies_used JSONB, -- Track which hexies were actually used
  insights_captured TEXT[],
  created_by UUID REFERENCES auth.users(id)
);

-- Custom scenarios created by users
CREATE TABLE IF NOT EXISTS custom_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id VARCHAR(100), -- Allow string workspace IDs
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Story content (simplified version of scenarios table)
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  context TEXT,
  characters JSONB,
  challenge TEXT NOT NULL,
  
  -- Metadata
  is_private BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false, -- Can this be used as a template by others?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenarios_category ON scenarios(category_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_active ON scenarios(is_active);
CREATE INDEX IF NOT EXISTS idx_scenarios_featured ON scenarios(is_featured);
CREATE INDEX IF NOT EXISTS idx_scenarios_difficulty ON scenarios(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_scenario_ratings_scenario ON scenario_ratings(scenario_id);
CREATE INDEX IF NOT EXISTS idx_workspace_scenarios_workspace ON workspace_scenarios(workspace_id);

-- Row Level Security policies
ALTER TABLE scenario_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_scenarios ENABLE ROW LEVEL SECURITY;

-- Basic read access for active scenarios
CREATE POLICY "Anyone can view active scenario categories" ON scenario_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active scenarios" ON scenarios
  FOR SELECT USING (is_active = true);

-- Users can rate scenarios they have access to
CREATE POLICY "Users can manage their own ratings" ON scenario_ratings
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage workspace scenarios
CREATE POLICY "Users can manage workspace scenarios" ON workspace_scenarios
  FOR ALL USING (auth.uid() = created_by);

-- Users can manage their own custom scenarios
CREATE POLICY "Users can manage their own custom scenarios" ON custom_scenarios
  FOR ALL USING (auth.uid() = created_by);

-- Admin policies (users with admin role can manage everything)
CREATE POLICY "Admins can manage scenario categories" ON scenario_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage scenarios" ON scenarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );