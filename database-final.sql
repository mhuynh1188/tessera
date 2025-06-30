-- Ultra-Simple Database Schema - Works with ALL PostgreSQL versions
-- Steve Jobs would say: "Simplicity is the ultimate sophistication"

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - The foundation of everything
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'past_due')),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table - Organization is key
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hexie cards table - The core content
CREATE TABLE IF NOT EXISTS hexie_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  category TEXT,
  subscription_tier_required TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier_required IN ('free', 'basic', 'premium')),
  color_scheme JSONB DEFAULT '{"primary": "#3b82f6", "secondary": "#1e40af", "text": "#ffffff"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  is_public BOOLEAN DEFAULT TRUE
);

-- Workspaces table - Where the magic happens
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{"theme": "light", "grid_size": 50, "snap_to_grid": true, "auto_save": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hexie instances table - Placed hexies in workspaces
CREATE TABLE IF NOT EXISTS hexie_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  hexie_card_id UUID NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  rotation FLOAT DEFAULT 0,
  scale FLOAT DEFAULT 1,
  z_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Insert amazing categories that Steve Jobs would approve
INSERT INTO categories (name, color, description, sort_order) VALUES
  ('Strategy', '#007AFF', 'Strategic thinking and planning - Think Different', 1),
  ('Innovation', '#AF52DE', 'Revolutionary ideas that change the world', 2),
  ('Leadership', '#FF9500', 'Lead from the front, inspire others', 3),
  ('Design', '#FF2D92', 'Design is how it works, not just how it looks', 4),
  ('Execution', '#30D158', 'Great ideas need flawless execution', 5),
  ('Culture', '#FF3B30', 'Culture eats strategy for breakfast', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert world-class hexie cards
INSERT INTO hexie_cards (title, front_text, back_text, category, subscription_tier_required, color_scheme) VALUES
  ('Think Different', 'Challenge the status quo', 'The people who think they are crazy enough to change the world are the ones who do. - Steve Jobs', 'Innovation', 'free', '{"primary": "#007AFF", "secondary": "#0051D5", "text": "#ffffff"}'),
  
  ('10x Thinking', 'Aim for 10x improvement, not 10%', 'Most people think 1 to 1. Great innovators think 1 to 10x. True revolutionaries think 1 to 10x. - Elon Musk', 'Innovation', 'free', '{"primary": "#AF52DE", "secondary": "#8E44AD", "text": "#ffffff"}'),
  
  ('Customer Obsession', 'Start with the customer and work backwards', 'We are not competitor obsessed, we are customer obsessed. We start with what the customer needs. - Jeff Bezos', 'Strategy', 'free', '{"primary": "#FF9500", "secondary": "#E68900", "text": "#ffffff"}'),
  
  ('Fail Fast, Learn Faster', 'Rapid experimentation beats planning', 'If you are not embarrassed by the first version, you have launched too late. Move fast and break things. - Mark Zuckerberg', 'Execution', 'basic', '{"primary": "#30D158", "secondary": "#28CD4C", "text": "#ffffff"}'),
  
  ('First Principles', 'Break down to fundamental truths', 'I think it is important to reason from first principles rather than by analogy. Boil things down to fundamental truths. - Elon Musk', 'Strategy', 'basic', '{"primary": "#FF2D92", "secondary": "#E91E63", "text": "#ffffff"}'),
  
  ('Simplicity is Sophistication', 'Eliminate the unnecessary', 'Simplicity is the ultimate sophistication. It takes a lot of hard work to make something simple. - Steve Jobs', 'Design', 'premium', '{"primary": "#007AFF", "secondary": "#0051D5", "text": "#ffffff"}')
ON CONFLICT DO NOTHING;