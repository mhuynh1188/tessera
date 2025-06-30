-- Enhanced Database Schema for Real-time Collaboration
-- Building on existing hexies-admin data

-- Add collaboration tables to existing schema

-- Session sharing table
CREATE TABLE IF NOT EXISTS workspace_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
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
  created_by UUID NOT NULL,
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
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update hexie_instances to support tessellation
ALTER TABLE hexie_instances 
ADD COLUMN IF NOT EXISTS tessellation_edges JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_snapped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS snapped_to UUID REFERENCES hexie_instances(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_shares_token ON workspace_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_workspace_shares_expires ON workspace_shares(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_session_participants_workspace ON session_participants(workspace_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_active ON session_participants(workspace_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hexie_votes_instance ON hexie_votes(hexie_instance_id);
CREATE INDEX IF NOT EXISTS idx_hexie_groups_workspace ON hexie_groups(workspace_id);

-- Function to generate secure share tokens
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares() RETURNS void AS $$
BEGIN
  UPDATE workspace_shares 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
  
  -- Also deactivate participants using expired tokens
  UPDATE session_participants 
  SET is_active = false 
  WHERE share_token IN (
    SELECT share_token FROM workspace_shares WHERE is_active = false
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for new tables
ALTER TABLE workspace_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_timers ENABLE ROW LEVEL SECURITY;

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

-- Insert sample data for testing
INSERT INTO behavior_types (name, category, description, severity_weight) VALUES
  ('Brilliant Innovation', 'collaboration', 'Exceptional creative breakthrough that transforms thinking', 5.0),
  ('Strong Agreement', 'collaboration', 'Clear consensus and alignment on direction', 4.0),
  ('Partial Agreement', 'collaboration', 'Some alignment with minor reservations', 3.0),
  ('Neutral/Unclear', 'collaboration', 'Unclear position or need more information', 2.0),
  ('Disagreement', 'collaboration', 'Different perspective or approach preferred', 1.0)
ON CONFLICT (name) DO NOTHING;