-- Enhanced Supabase Database Schema for Hex App
-- This extends the existing hexies-admin database with workspace functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (enhanced from existing)
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

-- Categories table (enhanced)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hexie cards table (enhanced)
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

-- Workspaces table
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

-- Workspace collaborators table
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

-- Hexie instances table (hexies placed in workspaces)
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

-- Hexie groups table (grouping functionality)
CREATE TABLE IF NOT EXISTS hexie_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  hexie_instances UUID[] DEFAULT '{}',
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Research references table (renamed from 'references' to avoid reserved keyword)
CREATE TABLE IF NOT EXISTS hexie_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hexie_card_id UUID NOT NULL REFERENCES hexie_cards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  authors TEXT,
  publication TEXT,
  year INTEGER,
  url TEXT,
  doi TEXT,
  reference_type TEXT DEFAULT 'article' CHECK (reference_type IN ('article', 'book', 'website', 'report', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Future: Workplace behavior analytics tables
CREATE TABLE IF NOT EXISTS behavior_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('communication', 'management', 'collaboration', 'culture', 'workload', 'environment')),
  description TEXT NOT NULL,
  severity_weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS behavior_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  behavior_type_id UUID NOT NULL REFERENCES behavior_types(id),
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'rarely', 'sometimes', 'often', 'always')),
  impact_level INTEGER CHECK (impact_level BETWEEN 1 AND 5),
  department TEXT,
  team_size TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_visualizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('heatmap', 'timeline', 'network', 'distribution', 'trend')),
  data_source TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_hexie_cards_category ON hexie_cards(category);
CREATE INDEX IF NOT EXISTS idx_hexie_cards_tier ON hexie_cards(subscription_tier_required);
CREATE INDEX IF NOT EXISTS idx_hexie_cards_search ON hexie_cards USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_hexie_cards_tags ON hexie_cards USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_collaborators_user ON workspace_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_hexie_instances_workspace ON hexie_instances(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hexie_instances_card ON hexie_instances(hexie_card_id);
CREATE INDEX IF NOT EXISTS idx_hexie_instances_z_index ON hexie_instances(workspace_id, z_index);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_reports_workspace ON behavior_reports(workspace_id, created_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hexie_cards_updated_at BEFORE UPDATE ON hexie_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hexie_instances_updated_at BEFORE UPDATE ON hexie_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_reports ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Workspace access policies
CREATE POLICY "Users can read their own workspaces" ON workspaces
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id IN (
      SELECT workspace_id FROM workspace_collaborators 
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their workspaces" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces" ON workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- Workspace collaborators policies
CREATE POLICY "Users can read workspace collaborators" ON workspace_collaborators
  FOR SELECT USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Hexie instances policies
CREATE POLICY "Users can read hexie instances in accessible workspaces" ON hexie_instances
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

CREATE POLICY "Users can create hexie instances in accessible workspaces" ON hexie_instances
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE owner_id = auth.uid() OR 
      id IN (
        SELECT workspace_id FROM workspace_collaborators 
        WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
        AND (permissions->>'can_edit')::boolean = true
      )
    )
  );

-- Public access to hexie cards
CREATE POLICY "Anyone can read public hexie cards" ON hexie_cards
  FOR SELECT USING (is_public = true);

-- Insert default categories
INSERT INTO categories (name, color, description, sort_order) VALUES
  ('Strategy', '#3b82f6', 'Strategic thinking and planning hexies', 1),
  ('Innovation', '#8b5cf6', 'Creative and innovative thinking tools', 2),
  ('Leadership', '#f59e0b', 'Leadership and management techniques', 3),
  ('Communication', '#10b981', 'Communication and collaboration tools', 4),
  ('Problem Solving', '#ef4444', 'Problem analysis and solution frameworks', 5),
  ('Team Building', '#06b6d4', 'Team dynamics and building exercises', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert sample hexie cards
INSERT INTO hexie_cards (title, front_text, back_text, category, subscription_tier_required, color_scheme, tags) VALUES
  ('SWOT Analysis', 'Strengths, Weaknesses, Opportunities, Threats', 'A strategic planning technique to evaluate these four elements of a project or business.', 'Strategy', 'free', '{"primary": "#3b82f6", "secondary": "#1e40af", "text": "#ffffff"}', ARRAY['analysis', 'strategy', 'planning']),
  ('5 Whys', 'Ask "Why?" five times to get to root cause', 'A iterative interrogative technique used to explore cause-and-effect relationships.', 'Problem Solving', 'free', '{"primary": "#ef4444", "secondary": "#dc2626", "text": "#ffffff"}', ARRAY['root cause', 'analysis', 'debugging']),
  ('Design Thinking', 'Empathize, Define, Ideate, Prototype, Test', 'A human-centered approach to innovation that integrates people, technology, and business.', 'Innovation', 'basic', '{"primary": "#8b5cf6", "secondary": "#7c3aed", "text": "#ffffff"}', ARRAY['design', 'innovation', 'user-centered']),
  ('OKRs', 'Objectives and Key Results framework', 'A goal-setting framework that helps organizations implement and execute strategy.', 'Strategy', 'basic', '{"primary": "#3b82f6", "secondary": "#1e40af", "text": "#ffffff"}', ARRAY['goals', 'objectives', 'measurement']),
  ('Lean Canvas', '9-block business model visualization', 'A one-page business plan template that deconstructs your idea into its key assumptions.', 'Strategy', 'premium', '{"primary": "#f59e0b", "secondary": "#d97706", "text": "#ffffff"}', ARRAY['business model', 'startup', 'planning'])
ON CONFLICT DO NOTHING;

-- Insert sample behavior types for future analytics
INSERT INTO behavior_types (name, category, description, severity_weight) VALUES
  ('Micromanagement', 'management', 'Excessive control over employee tasks and decisions', 2.5),
  ('Poor Communication', 'communication', 'Unclear or infrequent communication from leadership', 2.0),
  ('Exclusion from Meetings', 'collaboration', 'Being left out of relevant meetings or decisions', 2.2),
  ('Toxic Culture', 'culture', 'Negative workplace environment affecting morale', 3.0),
  ('Unrealistic Deadlines', 'workload', 'Consistently impossible timelines and expectations', 2.8),
  ('Lack of Resources', 'environment', 'Insufficient tools or support to complete work effectively', 2.3)
ON CONFLICT (name) DO NOTHING;