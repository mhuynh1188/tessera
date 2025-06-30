-- Tags Extension for Hex App Database Schema
-- Adds proper tag management with admin controls

-- Tags table for centralized tag management
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_enabled BOOLEAN DEFAULT TRUE,
  created_by UUID,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for many-to-many relationship between hexie_cards and tags
CREATE TABLE IF NOT EXISTS hexie_card_tags (
  hexie_card_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (hexie_card_id, tag_id),
  FOREIGN KEY (hexie_card_id) REFERENCES hexie_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_enabled ON tags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_hexie_card_tags_hexie ON hexie_card_tags(hexie_card_id);
CREATE INDEX IF NOT EXISTS idx_hexie_card_tags_tag ON hexie_card_tags(tag_id);

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count(tag_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tags 
  SET usage_count = (
    SELECT COUNT(*) 
    FROM hexie_card_tags 
    WHERE tag_id = tag_uuid
  ),
  updated_at = NOW()
  WHERE id = tag_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update usage count when hexie_card_tags changes
CREATE OR REPLACE FUNCTION trigger_update_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_tag_usage_count(NEW.tag_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_tag_usage_count(OLD.tag_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_tag_usage_trigger ON hexie_card_tags;
CREATE TRIGGER update_tag_usage_trigger
  AFTER INSERT OR DELETE ON hexie_card_tags
  FOR EACH ROW EXECUTE FUNCTION trigger_update_tag_usage();

-- Function to get tags for a hexie card (for backwards compatibility with tags[] column)
CREATE OR REPLACE FUNCTION get_hexie_tags(hexie_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT t.name
    FROM tags t
    JOIN hexie_card_tags hct ON t.id = hct.tag_id
    WHERE hct.hexie_card_id = hexie_id
    AND t.is_enabled = true
    ORDER BY t.name
  );
END;
$$ LANGUAGE plpgsql;

-- Insert default tags for common workplace patterns
INSERT INTO tags (name, description, color, is_enabled, created_by, usage_count) VALUES
  ('communication', 'Communication-related patterns and solutions', '#22c55e', true, NULL, 0),
  ('meetings', 'Meeting-related problems and solutions', '#f97316', true, NULL, 0),
  ('leadership', 'Leadership and management antipatterns', '#8b5cf6', true, NULL, 0),
  ('team-dynamics', 'Team interaction and collaboration issues', '#ec4899', true, NULL, 0),
  ('productivity', 'Productivity and efficiency patterns', '#22c55e', true, NULL, 0),
  ('decision-making', 'Decision-making processes and patterns', '#eab308', true, NULL, 0),
  ('problem-solving', 'Techniques and methods for solving workplace problems', '#3b82f6', true, NULL, 0),
  ('culture', 'Workplace culture and environment issues', '#06b6d4', true, NULL, 0),
  ('time-management', 'Time and schedule management issues', '#84cc16', true, NULL, 0),
  ('information-sharing', 'Knowledge and information flow problems', '#f59e0b', true, NULL, 0),
  ('psychological-safety', 'Psychological safety and trust issues', '#ef4444', true, NULL, 0),
  ('management', 'Management styles and approaches', '#8b5cf6', true, NULL, 0),
  ('trust', 'Trust-building and relationship issues', '#10b981', true, NULL, 0)
ON CONFLICT (name) DO NOTHING;

-- View to easily get hexie cards with their tags
CREATE OR REPLACE VIEW hexie_cards_with_tags AS
SELECT 
  hc.*,
  ARRAY_AGG(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'id', t.id,
      'name', t.name,
      'color', t.color,
      'description', t.description
    ) ORDER BY t.name
  ) FILTER (WHERE t.id IS NOT NULL) as tag_objects
FROM hexie_cards hc
LEFT JOIN hexie_card_tags hct ON hc.id = hct.hexie_card_id
LEFT JOIN tags t ON hct.tag_id = t.id AND t.is_enabled = true
GROUP BY hc.id;

-- Function to search hexies by tags
CREATE OR REPLACE FUNCTION search_hexies_by_tags(tag_names TEXT[])
RETURNS TABLE(
  hexie_id UUID,
  title TEXT,
  front_text TEXT,
  back_text TEXT,
  category TEXT,
  matching_tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hc.id,
    hc.title,
    hc.front_text,
    hc.back_text,
    hc.category,
    ARRAY_AGG(t.name) FILTER (WHERE t.name = ANY(tag_names))
  FROM hexie_cards hc
  JOIN hexie_card_tags hct ON hc.id = hct.hexie_card_id
  JOIN tags t ON hct.tag_id = t.id
  WHERE t.name = ANY(tag_names) AND t.is_enabled = true
  GROUP BY hc.id, hc.title, hc.front_text, hc.back_text, hc.category
  HAVING COUNT(DISTINCT t.name) > 0;
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies for tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE hexie_card_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read enabled tags
CREATE POLICY "Anyone can read enabled tags" ON tags
  FOR SELECT USING (is_enabled = true);

-- Policy: Authenticated users can read all tags
CREATE POLICY "Authenticated users can read all tags" ON tags
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only admins can manage tags
CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND subscription_tier = 'premium'
    )
  );

-- Policy: Users can read tag associations
CREATE POLICY "Users can read tag associations" ON hexie_card_tags
  FOR SELECT USING (true);

-- Policy: Users can manage their own hexie tag associations
CREATE POLICY "Users can manage their hexie tag associations" ON hexie_card_tags
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM hexie_cards 
      WHERE id = hexie_card_id 
      AND created_by = auth.uid()
    )
  );