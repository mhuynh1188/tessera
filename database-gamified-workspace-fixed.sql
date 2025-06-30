-- Enhanced Gamified Workspace Schema for Hexies - FIXED VERSION
-- This adds the gamification features to your existing database

-- ============================================================================
-- ENSURE BASE TABLES EXIST FIRST
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (ensure it exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'past_due')),
  miro_user_id TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table (ensure it exists)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hexie cards table (ensure it exists)
CREATE TABLE IF NOT EXISTS hexie_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  category TEXT REFERENCES categories(name) ON UPDATE CASCADE,
  subscription_tier_required TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier_required IN ('free', 'basic', 'premium')),
  icon_name TEXT,
  icon_svg TEXT,
  color_scheme JSONB DEFAULT '{"primary": "#3b82f6", "secondary": "#1e40af", "text": "#ffffff"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT '{}',
  
  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || front_text || ' ' || back_text || ' ' || COALESCE(array_to_string(tags, ' '), ''))
  ) STORED
);

-- Workspaces table (ensure it exists)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{
    "theme": "light",
    "grid_size": 50,
    "snap_to_grid": true,
    "auto_save": true,
    "collaboration_enabled": false,
    "max_hexies": 10
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_settings CHECK (
    settings ? 'theme' AND 
    settings ? 'grid_size' AND 
    settings ? 'snap_to_grid' AND 
    settings ? 'auto_save'
  )
);

-- Workspace collaborators table (ensure it exists)
CREATE TABLE IF NOT EXISTS workspace_collaborators (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{
    "can_edit": false,
    "can_delete": false,
    "can_invite": false,
    "can_export": true
  }',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  PRIMARY KEY (workspace_id, user_id)
);

-- Hexie instances table (ensure it exists)
CREATE TABLE IF NOT EXISTS hexie_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hexie_card_id UUID NOT NULL REFERENCES hexie_cards(id) ON DELETE CASCADE,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  rotation FLOAT DEFAULT 0,
  scale FLOAT DEFAULT 1,
  is_flipped BOOLEAN DEFAULT FALSE,
  z_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  CONSTRAINT valid_position CHECK (
    position ? 'x' AND position ? 'y'
  ),
  CONSTRAINT valid_scale CHECK (scale > 0 AND scale <= 5),
  CONSTRAINT valid_rotation CHECK (rotation >= 0 AND rotation < 360)
);

-- ============================================================================
-- NEW GAMIFICATION TABLES
-- ============================================================================

-- Antipattern types with severity and psychological frameworks
CREATE TABLE IF NOT EXISTS antipattern_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'communication', 'management', 'collaboration', 'culture', 
    'workload', 'environment', 'cognitive', 'emotional', 'behavioral'
  )),
  description TEXT NOT NULL,
  
  -- Severity system (inspired by psychological assessment scales)
  base_severity INTEGER NOT NULL CHECK (base_severity BETWEEN 1 AND 5),
  severity_factors JSONB DEFAULT '{
    "frequency_multiplier": 1.0,
    "impact_multiplier": 1.0,
    "context_factors": []
  }',
  
  -- Psychological framework integration
  psychological_framework TEXT CHECK (psychological_framework IN (
    'cognitive_behavioral', 'positive_psychology', 'mindfulness', 
    'acceptance_commitment', 'dialectical_behavioral', 'solution_focused'
  )),
  intervention_methods JSONB DEFAULT '[]',
  
  -- Jordan Peterson-style hierarchical competence
  competency_hierarchy JSONB DEFAULT '{
    "foundational": [],
    "intermediate": [], 
    "advanced": [],
    "mastery": []
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add antipattern linking to existing hexie cards table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hexie_cards' AND column_name = 'antipattern_type_id'
  ) THEN
    ALTER TABLE hexie_cards ADD COLUMN antipattern_type_id UUID REFERENCES antipattern_types(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hexie_cards' AND column_name = 'severity_indicators'
  ) THEN
    ALTER TABLE hexie_cards ADD COLUMN severity_indicators JSONB DEFAULT '{
      "individual": 1,
      "team": 1, 
      "organizational": 1
    }';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hexie_cards' AND column_name = 'intervention_strategies'
  ) THEN
    ALTER TABLE hexie_cards ADD COLUMN intervention_strategies JSONB DEFAULT '[]';
  END IF;
END $$;

-- Enhanced workspace boards (multiple boards per workspace)
CREATE TABLE IF NOT EXISTS workspace_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  board_type TEXT DEFAULT 'general' CHECK (board_type IN (
    'general', 'antipattern_analysis', 'intervention_planning', 
    'competency_development', 'psychological_safety'
  )),
  
  -- Session management
  session_id TEXT UNIQUE,
  session_expires_at TIMESTAMPTZ,
  
  -- Gamification settings
  game_settings JSONB DEFAULT '{
    "difficulty_level": "beginner",
    "safety_level": "high",
    "intervention_mode": "collaborative",
    "progress_tracking": true,
    "anonymous_mode": false
  }',
  
  -- Board-specific restrictions based on subscription
  access_level TEXT DEFAULT 'free' CHECK (access_level IN ('free', 'basic', 'premium')),
  max_hexies INTEGER DEFAULT 10,
  max_annotations INTEGER DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Text annotations on hexie instances
CREATE TABLE IF NOT EXISTS hexie_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hexie_instance_id UUID NOT NULL REFERENCES hexie_instances(id) ON DELETE CASCADE,
  
  -- Annotation content
  content TEXT NOT NULL,
  annotation_type TEXT DEFAULT 'note' CHECK (annotation_type IN (
    'note', 'question', 'insight', 'concern', 'solution', 'reflection'
  )),
  
  -- Visual positioning on the hexie
  position JSONB DEFAULT '{"x": 0.5, "y": 0.5}', -- Relative position (0-1)
  style JSONB DEFAULT '{
    "color": "#fbbf24",
    "fontSize": 14,
    "opacity": 0.9,
    "background": "rgba(0,0,0,0.8)"
  }',
  
  -- Privacy and psychological safety
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  safety_level TEXT DEFAULT 'safe' CHECK (safety_level IN ('safe', 'sensitive', 'private')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- User roles and competencies (Jordan Peterson competence hierarchy)
CREATE TABLE IF NOT EXISTS user_competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role-based system
  primary_role TEXT DEFAULT 'explorer' CHECK (primary_role IN (
    'explorer',      -- Beginner: discovering patterns
    'analyst',       -- Intermediate: identifying antipatterns  
    'facilitator',   -- Advanced: guiding others
    'architect',     -- Expert: designing interventions
    'mentor'         -- Master: teaching and healing
  )),
  
  -- Competency levels (inspired by psychological development)
  competency_scores JSONB DEFAULT '{
    "pattern_recognition": 0,
    "emotional_intelligence": 0,
    "systems_thinking": 0,
    "intervention_design": 0,
    "psychological_safety": 0,
    "group_facilitation": 0
  }',
  
  -- Experience points and progression
  total_experience INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  badges_earned JSONB DEFAULT '[]',
  
  -- Psychological preferences (for safety and engagement)
  interaction_preferences JSONB DEFAULT '{
    "anonymous_mode": false,
    "feedback_style": "collaborative",
    "challenge_level": "moderate",
    "support_level": "standard"
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one competency record per user
  UNIQUE(user_id)
);

-- Game sessions and progress tracking
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES workspace_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session mechanics
  session_type TEXT DEFAULT 'individual' CHECK (session_type IN (
    'individual', 'collaborative', 'guided', 'therapeutic'
  )),
  current_phase TEXT DEFAULT 'exploration' CHECK (current_phase IN (
    'exploration', 'identification', 'analysis', 'intervention', 'reflection'
  )),
  
  -- Progress and safety tracking
  progress_data JSONB DEFAULT '{
    "hexies_placed": 0,
    "patterns_identified": 0,
    "interventions_created": 0,
    "insights_shared": 0
  }',
  
  psychological_state JSONB DEFAULT '{
    "comfort_level": 5,
    "engagement_level": 5,
    "safety_score": 5,
    "stress_indicators": []
  }',
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  session_duration_minutes INTEGER DEFAULT 0
);

-- Hexie combinations for creating novel solutions
CREATE TABLE IF NOT EXISTS hexie_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES workspace_boards(id) ON DELETE CASCADE,
  
  -- Combination metadata
  name TEXT NOT NULL,
  description TEXT,
  combination_type TEXT DEFAULT 'intervention' CHECK (combination_type IN (
    'intervention', 'framework', 'process', 'insight', 'solution'
  )),
  
  -- Component hexies
  hexie_instances UUID[] NOT NULL, -- Array of hexie_instance IDs
  connection_strength FLOAT DEFAULT 1.0 CHECK (connection_strength BETWEEN 0.1 AND 3.0),
  
  -- Effectiveness and validation
  effectiveness_score FLOAT DEFAULT 0.0 CHECK (effectiveness_score BETWEEN 0.0 AND 5.0),
  validation_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  
  -- Psychological framework alignment
  therapeutic_approach TEXT[],
  safety_considerations JSONB DEFAULT '[]',
  contraindications JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Combination ratings and feedback
CREATE TABLE IF NOT EXISTS combination_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combination_id UUID NOT NULL REFERENCES hexie_combinations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT DEFAULT 'effectiveness' CHECK (feedback_type IN (
    'effectiveness', 'safety', 'clarity', 'applicability', 'innovation'
  )),
  
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  context JSONB DEFAULT '{}', -- Situation where it was used
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety monitoring and alerts
CREATE TABLE IF NOT EXISTS safety_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  
  -- Safety indicators
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'stress_pattern', 'negative_spiral', 'isolation_behavior', 
    'overwhelming_content', 'rapid_exit', 'help_request'
  )),
  
  severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 3), -- 1=low, 2=moderate, 3=high
  automated_detection BOOLEAN DEFAULT TRUE,
  
  -- Response and support
  intervention_triggered BOOLEAN DEFAULT FALSE,
  support_provided JSONB DEFAULT '{}',
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Support resources and interventions
CREATE TABLE IF NOT EXISTS support_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'breathing_exercise', 'grounding_technique', 'reframe_prompt',
    'break_suggestion', 'peer_support', 'professional_referral'
  )),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Targeting and personalization
  trigger_conditions JSONB DEFAULT '[]',
  personality_match JSONB DEFAULT '{}', -- Big Five, etc.
  effectiveness_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Subscription feature matrix
CREATE TABLE IF NOT EXISTS subscription_features (
  tier TEXT PRIMARY KEY CHECK (tier IN ('free', 'basic', 'premium')),
  max_boards INTEGER NOT NULL,
  max_hexies_per_board INTEGER NOT NULL,
  max_annotations_per_hexie INTEGER NOT NULL,
  max_combinations INTEGER NOT NULL,
  
  -- Advanced features
  can_use_therapeutic_mode BOOLEAN DEFAULT FALSE,
  can_access_all_frameworks BOOLEAN DEFAULT FALSE,
  can_create_custom_antipatterns BOOLEAN DEFAULT FALSE,
  can_export_interventions BOOLEAN DEFAULT FALSE,
  
  -- Support features  
  priority_support BOOLEAN DEFAULT FALSE,
  safety_monitoring_level TEXT DEFAULT 'basic' CHECK (safety_monitoring_level IN ('basic', 'enhanced', 'clinical')),
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES AND PERFORMANCE OPTIMIZATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workspace_boards_session ON workspace_boards(session_id);
CREATE INDEX IF NOT EXISTS idx_workspace_boards_workspace ON workspace_boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hexie_annotations_instance ON hexie_annotations(hexie_instance_id);
CREATE INDEX IF NOT EXISTS idx_hexie_annotations_visibility ON hexie_annotations(visibility, safety_level);
CREATE INDEX IF NOT EXISTS idx_user_competencies_user ON user_competencies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_competencies_role ON user_competencies(primary_role);
CREATE INDEX IF NOT EXISTS idx_game_sessions_board ON game_sessions(board_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_hexie_combinations_board ON hexie_combinations(board_id);
CREATE INDEX IF NOT EXISTS idx_combination_feedback_combination ON combination_feedback(combination_id);
CREATE INDEX IF NOT EXISTS idx_safety_monitoring_user ON safety_monitoring(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_safety_monitoring_severity ON safety_monitoring(severity_level, resolved_at);

-- Full-text search for annotations
CREATE INDEX IF NOT EXISTS idx_hexie_annotations_content ON hexie_annotations USING gin(to_tsvector('english', content));

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to calculate dynamic severity based on context
CREATE OR REPLACE FUNCTION calculate_dynamic_severity(
  base_severity INTEGER,
  frequency_score INTEGER,
  impact_score INTEGER,
  context_factors JSONB
) RETURNS FLOAT AS $$
DECLARE
  dynamic_severity FLOAT;
  frequency_multiplier FLOAT;
  impact_multiplier FLOAT;
BEGIN
  -- Base calculation
  frequency_multiplier := CASE frequency_score
    WHEN 1 THEN 0.5  -- Rarely
    WHEN 2 THEN 0.8  -- Sometimes  
    WHEN 3 THEN 1.0  -- Often
    WHEN 4 THEN 1.5  -- Frequently
    WHEN 5 THEN 2.0  -- Always
    ELSE 1.0
  END;
  
  impact_multiplier := CASE impact_score
    WHEN 1 THEN 0.6  -- Low impact
    WHEN 2 THEN 0.8  -- Moderate impact
    WHEN 3 THEN 1.0  -- Significant impact
    WHEN 4 THEN 1.3  -- High impact  
    WHEN 5 THEN 1.6  -- Severe impact
    ELSE 1.0
  END;
  
  dynamic_severity := base_severity * frequency_multiplier * impact_multiplier;
  
  -- Cap at 5.0 for UI consistency
  RETURN LEAST(dynamic_severity, 5.0);
END;
$$ LANGUAGE plpgsql;

-- Function to update user competency scores
CREATE OR REPLACE FUNCTION update_competency_score(
  p_user_id UUID,
  p_competency TEXT,
  p_points INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_competencies (user_id, competency_scores)
  VALUES (p_user_id, jsonb_build_object(p_competency, p_points))
  ON CONFLICT (user_id) DO UPDATE SET
    competency_scores = user_competencies.competency_scores || 
      jsonb_build_object(p_competency, 
        COALESCE((user_competencies.competency_scores->>p_competency)::INTEGER, 0) + p_points
      ),
    total_experience = total_experience + p_points,
    current_level = GREATEST(1, (total_experience + p_points) / 100),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function for timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at timestamps
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_workspace_boards_updated_at') THEN
    CREATE TRIGGER update_workspace_boards_updated_at 
      BEFORE UPDATE ON workspace_boards
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_hexie_annotations_updated_at') THEN
    CREATE TRIGGER update_hexie_annotations_updated_at 
      BEFORE UPDATE ON hexie_annotations  
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_user_competencies_updated_at') THEN
    CREATE TRIGGER update_user_competencies_updated_at 
      BEFORE UPDATE ON user_competencies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE workspace_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_monitoring ENABLE ROW LEVEL SECURITY;

-- Workspace boards security
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_boards' AND policyname = 'Users can access boards in their workspaces') THEN
    CREATE POLICY "Users can access boards in their workspaces" ON workspace_boards
      FOR SELECT USING (
        workspace_id IN (
          SELECT id FROM workspaces 
          WHERE owner_id = auth.uid() OR 
          id IN (
            SELECT workspace_id FROM workspace_collaborators 
            WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
          )
        )
      );
  END IF;
END $$;

-- Annotations security (respecting psychological safety)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hexie_annotations' AND policyname = 'Users can read appropriate annotations') THEN
    CREATE POLICY "Users can read appropriate annotations" ON hexie_annotations
      FOR SELECT USING (
        CASE 
          WHEN visibility = 'private' THEN created_by = auth.uid()
          WHEN visibility = 'team' THEN hexie_instance_id IN (
            SELECT hi.id FROM hexie_instances hi
            JOIN workspaces w ON hi.workspace_id = w.id
            WHERE w.owner_id = auth.uid() OR w.id IN (
              SELECT workspace_id FROM workspace_collaborators 
              WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
            )
          )
          ELSE visibility = 'public'
        END
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hexie_annotations' AND policyname = 'Users can create annotations') THEN
    CREATE POLICY "Users can create annotations" ON hexie_annotations
      FOR INSERT WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hexie_annotations' AND policyname = 'Users can update their own annotations') THEN
    CREATE POLICY "Users can update their own annotations" ON hexie_annotations
      FOR UPDATE USING (created_by = auth.uid());
  END IF;
END $$;

-- Safety monitoring (only users can see their own data)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'safety_monitoring' AND policyname = 'Users can only see their own safety data') THEN
    CREATE POLICY "Users can only see their own safety data" ON safety_monitoring
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- User competencies (users can only see/edit their own)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_competencies' AND policyname = 'Users can manage their own competencies') THEN
    CREATE POLICY "Users can manage their own competencies" ON user_competencies
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default subscription tiers
INSERT INTO subscription_features VALUES 
('free', 3, 15, 3, 5, FALSE, FALSE, FALSE, FALSE, FALSE, 'basic'),
('basic', 10, 50, 10, 20, TRUE, FALSE, TRUE, TRUE, FALSE, 'enhanced'),  
('premium', 100, 200, 50, 100, TRUE, TRUE, TRUE, TRUE, TRUE, 'clinical')
ON CONFLICT (tier) DO UPDATE SET 
  max_boards = EXCLUDED.max_boards,
  max_hexies_per_board = EXCLUDED.max_hexies_per_board,
  max_annotations_per_hexie = EXCLUDED.max_annotations_per_hexie,
  max_combinations = EXCLUDED.max_combinations,
  updated_at = NOW();

-- Insert sample antipattern types
INSERT INTO antipattern_types (name, category, description, base_severity, psychological_framework, intervention_methods) VALUES
('Micromanagement', 'management', 'Excessive control that undermines autonomy and competence', 3, 'cognitive_behavioral', '["autonomy_building", "trust_exercises", "gradual_delegation"]'),
('Impostor Syndrome', 'cognitive', 'Persistent feeling of being a fraud despite evidence of competence', 2, 'positive_psychology', '["competence_mapping", "achievement_recognition", "peer_validation"]'),
('Toxic Perfectionism', 'behavioral', 'Paralyzing pursuit of flawlessness that prevents progress', 3, 'acceptance_commitment', '["progress_over_perfection", "value_clarification", "mindful_acceptance"]'),
('Learned Helplessness', 'emotional', 'Belief that one cannot change their situation despite having control', 4, 'cognitive_behavioral', '["agency_restoration", "small_wins", "empowerment_exercises"]'),
('Meeting Fatigue', 'environment', 'Exhaustion from excessive or ineffective meetings', 2, 'solution_focused', '["meeting_audit", "purpose_clarification", "time_boundaries"]'),
('Communication Breakdown', 'communication', 'Systematic failure in information exchange leading to misunderstandings', 3, 'solution_focused', '["active_listening", "feedback_loops", "clarity_protocols"]'),
('Burnout Spiral', 'emotional', 'Progressive exhaustion leading to cynicism and reduced effectiveness', 4, 'mindfulness', '["stress_management", "boundary_setting", "self_compassion"]'),
('Decision Paralysis', 'cognitive', 'Inability to make decisions due to overthinking or fear of consequences', 3, 'cognitive_behavioral', '["decision_frameworks", "risk_assessment", "bias_awareness"]')
ON CONFLICT (name) DO NOTHING;

-- Insert sample support resources
INSERT INTO support_resources (resource_type, title, content, trigger_conditions) VALUES
('breathing_exercise', '4-7-8 Breathing', 'Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 3 times. This activates your parasympathetic nervous system.', '["stress_pattern", "overwhelming_content"]'),
('grounding_technique', '5-4-3-2-1 Grounding', 'Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. This brings you into the present moment.', '["negative_spiral", "isolation_behavior"]'),
('reframe_prompt', 'Perspective Shift', 'What would you tell a friend in this situation? How might this challenge help you grow?', '["negative_spiral", "stress_pattern"]'),
('break_suggestion', 'Mindful Break', 'Take 5 minutes away from the screen. Step outside or move your body gently.', '["overwhelming_content", "rapid_exit"]'),
('peer_support', 'Connect with Support', 'Consider reaching out to a trusted colleague or friend. Sometimes talking helps.', '["isolation_behavior", "help_request"]')
ON CONFLICT DO NOTHING;

-- Insert default categories if they don't exist
INSERT INTO categories (name, color, description, sort_order) VALUES
  ('Strategy', '#3b82f6', 'Strategic thinking and planning hexies', 1),
  ('Innovation', '#8b5cf6', 'Creative and innovative thinking tools', 2),
  ('Leadership', '#f59e0b', 'Leadership and management techniques', 3),
  ('Communication', '#10b981', 'Communication and collaboration tools', 4),
  ('Problem Solving', '#ef4444', 'Problem analysis and solution frameworks', 5),
  ('Team Building', '#06b6d4', 'Team dynamics and building exercises', 6)
ON CONFLICT (name) DO NOTHING;