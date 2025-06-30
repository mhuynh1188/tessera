-- Simplified Supabase Database Schema for Hex App
-- Compatible with all PostgreSQL versions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hexie cards table
CREATE TABLE IF NOT EXISTS hexie_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  category TEXT,
  subscription_tier_required TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier_required IN ('free', 'basic', 'premium')),
  icon_name TEXT,
  icon_svg TEXT,
  color_scheme JSONB DEFAULT '{"primary": "#3b82f6", "secondary": "#1e40af", "text": "#ffffff"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  is_public BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT '{}'
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{"theme": "light", "grid_size": 50, "snap_to_grid": true, "auto_save": true, "collaboration_enabled": false, "max_hexies": 10}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace collaborators table
CREATE TABLE IF NOT EXISTS workspace_collaborators (
  workspace_id UUID,
  user_id UUID,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{"can_edit": false, "can_delete": false, "can_invite": false, "can_export": true}',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  PRIMARY KEY (workspace_id, user_id)
);

-- Hexie instances table (hexies placed in workspaces)
CREATE TABLE IF NOT EXISTS hexie_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  hexie_card_id UUID NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  rotation FLOAT DEFAULT 0,
  scale FLOAT DEFAULT 1,
  is_flipped BOOLEAN DEFAULT FALSE,
  z_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL
);

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