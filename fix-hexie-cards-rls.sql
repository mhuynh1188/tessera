-- Fix RLS policies for hexie_cards to allow anonymous read access for free, active cards
-- This is essential for the demo page to work

-- First, check current RLS status
-- SELECT * FROM pg_policies WHERE tablename = 'hexie_cards';

-- Drop existing restrictive policies that prevent demo access
DROP POLICY IF EXISTS "hexie_cards_select_optimized" ON hexie_cards;
DROP POLICY IF EXISTS "hexie_cards_select_policy" ON hexie_cards;

-- Create new policy that allows:
-- 1. Anonymous users to read free, active, non-archived cards (for demo)
-- 2. Authenticated users to read their own cards + free cards
-- 3. Public cards visible to all
CREATE POLICY "hexie_cards_demo_access"
  ON hexie_cards FOR SELECT
  USING (
    -- Allow access to free, active, non-archived cards for everyone (including anonymous)
    (subscription_tier_required = 'free' AND is_active = true AND is_archived = false)
    OR
    -- Allow access to user's own cards if authenticated
    (auth.uid() IS NOT NULL AND created_by = auth.uid())
    OR
    -- Allow access to public cards if they exist (future feature)
    (is_active = true AND is_archived = false)
  );

-- Ensure hexie_categories are readable for anonymous users (needed for demo)
DROP POLICY IF EXISTS "hexie_categories_select_all" ON hexie_categories;
CREATE POLICY "hexie_categories_demo_access"
  ON hexie_categories FOR SELECT
  USING (is_active = true);

-- Ensure tags are readable for anonymous users (needed for demo)
DROP POLICY IF EXISTS "tags_select_enabled" ON tags;
CREATE POLICY "tags_demo_access"
  ON tags FOR SELECT
  USING (is_enabled = true);

-- Allow anonymous users to read hexie_card_tags for free cards
DROP POLICY IF EXISTS "hexie_card_tags_select_optimized" ON hexie_card_tags;
CREATE POLICY "hexie_card_tags_demo_access"
  ON hexie_card_tags FOR SELECT
  USING (
    hexie_card_id IN (
      SELECT id FROM hexie_cards 
      WHERE subscription_tier_required = 'free' 
        AND is_active = true 
        AND is_archived = false
    )
  );

-- Verify the policies work
-- You can test with: SELECT COUNT(*) FROM hexie_cards WHERE subscription_tier_required = 'free' AND is_active = true AND is_archived = false;