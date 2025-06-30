-- Complete Database Schema for Hex App
-- Builds on existing hexies-admin schema and adds collaboration features

-- First, create the missing core workspace tables that should exist
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace collaborators table (this was missing)
CREATE TABLE IF NOT EXISTS workspace_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{"can_edit": true, "can_delete": false, "can_invite": false, "can_export": true}',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Hexie instances (hexies placed in workspaces) - enhanced for tessellation
CREATE TABLE IF NOT EXISTS hexie_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hexie_card_id UUID NOT NULL REFERENCES hexie_cards(id) ON DELETE CASCADE,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  rotation NUMERIC DEFAULT 0,
  scale NUMERIC DEFAULT 1.0,
  z_index INTEGER DEFAULT 0,
  tessellation_edges JSONB DEFAULT '[]',
  is_snapped BOOLEAN DEFAULT FALSE,
  snapped_to UUID REFERENCES hexie_instances(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session sharing table for 24-hour links
CREATE TABLE IF NOT EXISTS workspace_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  permissions JSONB DEFAULT '{"can_view": true, "can_vote": true, "can_comment": false}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session participants (for anonymous users with shared links)
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL DEFAULT 'Anonymous User',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  share_token TEXT REFERENCES workspace_shares(share_token),
  cursor_position JSONB DEFAULT '{"x": 0, "y": 0}',
  is_active BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hexie groups/themes table
CREATE TABLE IF NOT EXISTS hexie_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  size JSONB NOT NULL DEFAULT '{"width": 200, "height": 200}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hexie group members (which hexies belong to which groups)
CREATE TABLE IF NOT EXISTS hexie_group_members (
  group_id UUID REFERENCES hexie_groups(id) ON DELETE CASCADE,
  hexie_instance_id UUID REFERENCES hexie_instances(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, hexie_instance_id)
);

-- Voting system
CREATE TABLE IF NOT EXISTS hexie_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hexie_instance_id UUID REFERENCES hexie_instances(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES session_participants(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree', 'neutral')),
  severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hexie_instance_id, participant_id)
);

-- Session timers
CREATE TABLE IF NOT EXISTS workspace_timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Session Timer',
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_collaborators_workspace ON workspace_collaborators(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_collaborators_user ON workspace_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_hexie_instances_workspace ON hexie_instances(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hexie_instances_card ON hexie_instances(hexie_card_id);
CREATE INDEX IF NOT EXISTS idx_workspace_shares_token ON workspace_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_workspace_shares_expires ON workspace_shares(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_session_participants_workspace ON session_participants(workspace_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_active ON session_participants(workspace_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hexie_votes_instance ON hexie_votes(hexie_instance_id);
CREATE INDEX IF NOT EXISTS idx_hexie_groups_workspace ON hexie_groups(workspace_id);

-- RLS Policies for all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_timers ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY "Users can view their own workspaces" ON workspaces
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id IN (SELECT workspace_id FROM workspace_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update their workspaces" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Workspace collaborators policies
CREATE POLICY "Users can view collaborators in accessible workspaces" ON workspace_collaborators
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE owner_id = auth.uid() OR 
      id IN (SELECT workspace_id FROM workspace_collaborators WHERE user_id = auth.uid())
    )
  );

-- Hexie instances policies
CREATE POLICY "Users can manage hexies in accessible workspaces" ON hexie_instances
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE owner_id = auth.uid() OR 
      id IN (SELECT workspace_id FROM workspace_collaborators WHERE user_id = auth.uid())
    )
  );

-- Workspace shares policies
CREATE POLICY "Users can create shares for their workspaces" ON workspace_shares
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can view shares for accessible workspaces" ON workspace_shares
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE owner_id = auth.uid() OR 
      id IN (SELECT workspace_id FROM workspace_collaborators WHERE user_id = auth.uid())
    )
  );

-- Session participants can be viewed by workspace members or via valid share token
CREATE POLICY "Workspace members can view participants" ON session_participants
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE owner_id = auth.uid() OR 
      id IN (SELECT workspace_id FROM workspace_collaborators WHERE user_id = auth.uid())
    ) OR
    share_token IN (SELECT share_token FROM workspace_shares WHERE is_active = true AND expires_at > NOW())
  );

-- Hexie groups policies
CREATE POLICY "Users can manage groups in accessible workspaces" ON hexie_groups
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE owner_id = auth.uid() OR 
      id IN (SELECT workspace_id FROM workspace_collaborators WHERE user_id = auth.uid())
    )
  );

-- Insert sample workspace for testing
INSERT INTO workspaces (name, description, owner_id) 
SELECT 'Demo Workspace', 'A sample workspace for testing', id 
FROM auth.users 
WHERE email = 'admin@hexies.app' 
ON CONFLICT DO NOTHING;