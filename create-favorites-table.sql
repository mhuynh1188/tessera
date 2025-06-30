-- Create favorites/bookmarks table for tessera cards
-- This allows users to bookmark their favorite tessera cards

BEGIN;

-- Create favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tessera_card_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate bookmarks
    UNIQUE(user_id, tessera_card_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_tessera_card_id ON public.favorites(tessera_card_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see and manage their own bookmarks
CREATE POLICY "Users can manage their own bookmarks" ON public.favorites
    FOR ALL USING (
        auth.uid()::text = user_id::text
    );

-- Allow public read access for authenticated users (optional - adjust based on your needs)
CREATE POLICY "Authenticated users can view bookmarks" ON public.favorites
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create helper function to get user's bookmarked cards
CREATE OR REPLACE FUNCTION get_user_bookmarks(p_user_id UUID)
RETURNS TABLE (
    tessera_card_id UUID,
    title TEXT,
    category TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.tessera_card_id,
        tc.title,
        tc.category,
        f.created_at
    FROM public.favorites f
    JOIN public.tessera_cards tc ON f.tessera_card_id = tc.id
    WHERE f.user_id = p_user_id
      AND tc.is_active = true
    ORDER BY f.created_at DESC;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_bookmarks(UUID) TO authenticated;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully created favorites table and related functions!';
    RAISE NOTICE 'Users can now bookmark tessera cards and the data is protected by RLS.';
END $$;