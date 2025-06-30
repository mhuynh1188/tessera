-- Quick test to check if the gamified workspace database is set up correctly

-- Check if all the required tables exist
SELECT 
  schemaname,
  tablename 
FROM pg_tables 
WHERE tablename IN (
  'hexie_cards', 
  'categories', 
  'workspace_boards', 
  'hexie_annotations', 
  'antipattern_types',
  'user_competencies',
  'game_sessions',
  'hexie_combinations',
  'safety_monitoring',
  'support_resources'
) 
ORDER BY tablename;

-- Check if we have any hexie cards
SELECT COUNT(*) as hexie_card_count FROM hexie_cards;

-- Check if we have any categories  
SELECT COUNT(*) as category_count FROM categories;

-- Check if we have any users
SELECT COUNT(*) as user_count FROM users;

-- List available hexie cards for testing
SELECT id, title, category, subscription_tier_required 
FROM hexie_cards 
LIMIT 5;