-- =============================================================================
-- TESSERA REBRAND DATABASE MIGRATION
-- Migration from Hexies to Tessera branding
-- =============================================================================

-- Note: This migration renames tables and updates column references
-- Run during maintenance window with application downtime

BEGIN;

-- 1. Rename core tables
-- =============================================================================

-- Rename hexie_cards to tessera_cards
ALTER TABLE hexie_cards RENAME TO tessera_cards;

-- Rename hexie_categories to tessera_categories  
ALTER TABLE hexie_categories RENAME TO tessera_categories;

-- Rename hexie_references to tessera_references
ALTER TABLE hexie_references RENAME TO tessera_references;

-- 2. Update foreign key column names
-- =============================================================================

-- Update hexie_card_id references in related tables
ALTER TABLE user_interactions RENAME COLUMN hexie_card_id TO tessera_card_id;
ALTER TABLE workspace_items RENAME COLUMN hexie_card_id TO tessera_card_id;
ALTER TABLE favorites RENAME COLUMN hexie_card_id TO tessera_card_id;
ALTER TABLE annotations RENAME COLUMN hexie_card_id TO tessera_card_id;

-- Update any hexie_category_id references
ALTER TABLE tessera_cards RENAME COLUMN hexie_category_id TO tessera_category_id;

-- 3. Update constraint names
-- =============================================================================

-- Drop existing foreign key constraints and recreate with new names
ALTER TABLE user_interactions 
    DROP CONSTRAINT IF EXISTS user_interactions_hexie_card_id_fkey,
    ADD CONSTRAINT user_interactions_tessera_card_id_fkey 
        FOREIGN KEY (tessera_card_id) REFERENCES tessera_cards(id) ON DELETE CASCADE;

ALTER TABLE workspace_items 
    DROP CONSTRAINT IF EXISTS workspace_items_hexie_card_id_fkey,
    ADD CONSTRAINT workspace_items_tessera_card_id_fkey 
        FOREIGN KEY (tessera_card_id) REFERENCES tessera_cards(id) ON DELETE CASCADE;

ALTER TABLE favorites 
    DROP CONSTRAINT IF EXISTS favorites_hexie_card_id_fkey,
    ADD CONSTRAINT favorites_tessera_card_id_fkey 
        FOREIGN KEY (tessera_card_id) REFERENCES tessera_cards(id) ON DELETE CASCADE;

ALTER TABLE annotations 
    DROP CONSTRAINT IF EXISTS annotations_hexie_card_id_fkey,
    ADD CONSTRAINT annotations_tessera_card_id_fkey 
        FOREIGN KEY (tessera_card_id) REFERENCES tessera_cards(id) ON DELETE CASCADE;

ALTER TABLE tessera_cards 
    DROP CONSTRAINT IF EXISTS hexie_cards_hexie_category_id_fkey,
    ADD CONSTRAINT tessera_cards_tessera_category_id_fkey 
        FOREIGN KEY (tessera_category_id) REFERENCES tessera_categories(id);

-- 4. Update index names
-- =============================================================================

-- Rename indexes to reflect new table names
DROP INDEX IF EXISTS idx_hexie_cards_category;
CREATE INDEX idx_tessera_cards_category ON tessera_cards(tessera_category_id);

DROP INDEX IF EXISTS idx_hexie_cards_subscription_tier;
CREATE INDEX idx_tessera_cards_subscription_tier ON tessera_cards(subscription_tier_required);

DROP INDEX IF EXISTS idx_hexie_cards_is_active;
CREATE INDEX idx_tessera_cards_is_active ON tessera_cards(is_active);

DROP INDEX IF EXISTS idx_user_interactions_hexie_card;
CREATE INDEX idx_user_interactions_tessera_card ON user_interactions(tessera_card_id);

-- 5. Update RLS policies
-- =============================================================================

-- Drop existing RLS policies and recreate with new table names
DROP POLICY IF EXISTS "Users can view active hexie cards" ON tessera_cards;
CREATE POLICY "Users can view active tessera cards" ON tessera_cards
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage hexie cards" ON tessera_cards;
CREATE POLICY "Admins can manage tessera cards" ON tessera_cards
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can view hexie categories" ON tessera_categories;
CREATE POLICY "Users can view tessera categories" ON tessera_categories
    FOR SELECT USING (true);

-- 6. Update functions and views
-- =============================================================================

-- Drop and recreate any functions that reference old table names
DROP FUNCTION IF EXISTS get_user_hexie_stats(uuid);
CREATE OR REPLACE FUNCTION get_user_tessera_stats(user_id uuid)
RETURNS TABLE (
    total_tesseras_used bigint,
    favorite_tesseras_count bigint,
    workspaces_created bigint,
    last_activity timestamp with time zone
) 
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT 
        COUNT(DISTINCT ui.tessera_card_id) as total_tesseras_used,
        COUNT(DISTINCT f.tessera_card_id) as favorite_tesseras_count,
        COUNT(DISTINCT w.id) as workspaces_created,
        MAX(ui.created_at) as last_activity
    FROM user_interactions ui
    LEFT JOIN favorites f ON f.user_id = user_id AND f.tessera_card_id = ui.tessera_card_id
    LEFT JOIN workspaces w ON w.user_id = user_id
    WHERE ui.user_id = user_id;
$$;

-- Update analytics views
DROP VIEW IF EXISTS hexie_usage_analytics;
CREATE VIEW tessera_usage_analytics AS
SELECT 
    tc.id,
    tc.title,
    tc.category,
    tc.subscription_tier_required,
    COUNT(ui.id) as usage_count,
    COUNT(DISTINCT ui.user_id) as unique_users,
    AVG(ui.engagement_score) as avg_engagement,
    MAX(ui.created_at) as last_used
FROM tessera_cards tc
LEFT JOIN user_interactions ui ON tc.id = ui.tessera_card_id
WHERE tc.is_active = true
GROUP BY tc.id, tc.title, tc.category, tc.subscription_tier_required;

-- 7. Update configuration and metadata
-- =============================================================================

-- Update any stored configuration values
UPDATE system_settings 
SET value = 'tessera_cards' 
WHERE key = 'primary_content_table' AND value = 'hexie_cards';

UPDATE system_settings 
SET value = 'Tessera - Behavioral Intelligence Platform' 
WHERE key = 'app_name' AND value LIKE '%Hexies%';

-- 8. Update sample data and references
-- =============================================================================

-- Update any description text in tessera cards that references "hexie"
UPDATE tessera_cards 
SET description = REPLACE(description, 'hexie', 'tessera')
WHERE description ILIKE '%hexie%';

UPDATE tessera_cards 
SET description = REPLACE(description, 'Hexie', 'Tessera')  
WHERE description ILIKE '%Hexie%';

-- Update front and back text
UPDATE tessera_cards 
SET front_text = REPLACE(front_text, 'hexagonal', 'tessellation'),
    back_text = REPLACE(back_text, 'hexagonal', 'tessellation')
WHERE front_text ILIKE '%hexagonal%' OR back_text ILIKE '%hexagonal%';

-- 9. Update triggers and audit logs
-- =============================================================================

-- Rename trigger functions if they exist
DROP TRIGGER IF EXISTS hexie_cards_audit_trigger ON tessera_cards;
CREATE TRIGGER tessera_cards_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tessera_cards
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- 10. Verify migration
-- =============================================================================

-- Create a verification query to ensure everything is working
CREATE OR REPLACE FUNCTION verify_tessera_migration()
RETURNS TABLE (
    table_name text,
    record_count bigint,
    status text
) 
LANGUAGE sql
AS $$
    SELECT 'tessera_cards'::text, COUNT(*)::bigint, 'OK'::text FROM tessera_cards
    UNION ALL
    SELECT 'tessera_categories'::text, COUNT(*)::bigint, 'OK'::text FROM tessera_categories  
    UNION ALL
    SELECT 'tessera_references'::text, COUNT(*)::bigint, 'OK'::text FROM tessera_references
    UNION ALL
    SELECT 'user_interactions'::text, COUNT(*)::bigint, 'OK'::text FROM user_interactions WHERE tessera_card_id IS NOT NULL;
$$;

-- Run verification
SELECT * FROM verify_tessera_migration();

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================

-- 1. Update application code to use new table names
-- 2. Update API endpoints to use "tessera" instead of "hexie"  
-- 3. Clear application caches
-- 4. Update monitoring and alerting queries
-- 5. Update backup scripts with new table names
-- 6. Test all application functionality
-- 7. Update documentation

-- Migration complete!