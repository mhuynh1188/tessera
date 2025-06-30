-- Sample data for testing gamified workspace features
-- Run this after the main database schema has been created

-- Insert sample categories if they don't exist
INSERT INTO categories (name, color, description, icon) 
VALUES 
  ('Communication', '#3b82f6', 'Communication related challenges', 'MessageSquare'),
  ('Meetings', '#ef4444', 'Meeting antipatterns and issues', 'Calendar'),
  ('Leadership', '#10b981', 'Leadership and management patterns', 'Crown')
ON CONFLICT (name) DO NOTHING;

-- Insert sample hexie cards
INSERT INTO hexie_cards (title, front_text, back_text, category, subscription_tier_required, color_scheme)
VALUES 
  (
    'Silent Participants',
    'Team members who never speak up in meetings',
    'Strategies: Direct questions, breakout rooms, anonymous input tools',
    'Meetings',
    'free',
    '{"primary": "#ef4444", "secondary": "#dc2626", "text": "#ffffff"}'
  ),
  (
    'Information Hoarding',
    'Key information is held by single individuals',
    'Solutions: Knowledge sharing sessions, documentation requirements, redundancy planning',
    'Communication', 
    'free',
    '{"primary": "#f59e0b", "secondary": "#d97706", "text": "#ffffff"}'
  ),
  (
    'Micromanagement',
    'Leaders who control every detail and decision',
    'Approaches: Trust-building exercises, delegation frameworks, regular check-ins',
    'Leadership',
    'basic',
    '{"primary": "#8b5cf6", "secondary": "#7c3aed", "text": "#ffffff"}'
  ),
  (
    'Meeting Overload',
    'Too many meetings with unclear purposes',
    'Solutions: Meeting audits, standing agenda templates, time blocking',
    'Meetings',
    'free', 
    '{"primary": "#ef4444", "secondary": "#dc2626", "text": "#ffffff"}'
  )
ON CONFLICT DO NOTHING;

-- Insert sample antipattern types
INSERT INTO antipattern_types (name, category, base_severity, psychological_framework, description)
VALUES
  ('Communication Breakdown', 'Communication', 2.5, 'CBT', 'When information flow breaks down between team members'),
  ('Meeting Dysfunction', 'Meetings', 3.0, 'Systems Thinking', 'Patterns that make meetings ineffective or harmful'),
  ('Leadership Issues', 'Leadership', 3.5, 'Positive Psychology', 'Problems with leadership approach or style'),
  ('Cultural Problems', 'Communication', 4.0, 'Mindfulness', 'Deep-rooted cultural and behavioral issues')
ON CONFLICT (name) DO NOTHING;

-- Insert sample workspace board
INSERT INTO workspace_boards (
  name, 
  description, 
  session_id, 
  game_settings, 
  access_level, 
  max_hexies, 
  max_annotations
) VALUES (
  'Sample Workspace',
  'A test workspace for exploring antipatterns',
  'demo-session-' || gen_random_uuid()::text,
  '{
    "difficulty_level": "beginner",
    "safety_level": "high", 
    "intervention_mode": "individual",
    "progress_tracking": true,
    "anonymous_mode": false
  }',
  'free',
  15,
  3
) ON CONFLICT DO NOTHING;

-- Insert sample user competency (for testing)
-- Note: You'll need to replace 'your-user-id' with an actual user ID from your auth system
INSERT INTO user_competencies (
  user_id,
  primary_role,
  competency_scores,
  total_experience,
  current_level,
  badges_earned
) VALUES (
  (SELECT id FROM users LIMIT 1), -- Gets first user, replace with actual logic
  'explorer',
  '{
    "pattern_recognition": 2.5,
    "emotional_intelligence": 3.0,
    "systems_thinking": 1.5,
    "intervention_design": 1.0,
    "psychological_safety": 4.0,
    "group_facilitation": 2.0
  }',
  150,
  2,
  '["first_annotation", "pattern_spotter", "safety_advocate"]'
) ON CONFLICT (user_id) DO UPDATE SET
  competency_scores = EXCLUDED.competency_scores,
  total_experience = EXCLUDED.total_experience,
  current_level = EXCLUDED.current_level,
  badges_earned = EXCLUDED.badges_earned;

-- Insert sample support resources  
INSERT INTO support_resources (name, resource_type, content, framework, difficulty_level)
VALUES
  (
    '4-7-8 Breathing', 
    'breathing_exercise',
    '{"instructions": "Breathe in for 4, hold for 7, exhale for 8", "duration": 300}',
    'Mindfulness',
    'beginner'
  ),
  (
    '5-4-3-2-1 Grounding',
    'grounding_technique', 
    '{"instructions": "Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste", "duration": 180}',
    'CBT',
    'beginner'
  ),
  (
    'Perspective Shift',
    'cognitive_reframe',
    '{"instructions": "Ask: How will this matter in 5 years? What would I tell a friend in this situation?", "duration": 120}',
    'CBT', 
    'intermediate'
  )
ON CONFLICT (name) DO NOTHING;

-- Create a test user if needed (optional - only run if you don't have users yet)
-- INSERT INTO users (email, name, subscription_tier, subscription_status)
-- VALUES ('test@example.com', 'Test User', 'free', 'active')
-- ON CONFLICT (email) DO NOTHING;