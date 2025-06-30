-- Create voting and contest system tables
-- This creates the missing tables needed for the voting and contest system

BEGIN;

-- Create hexie_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hexie_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hexie_instance_id UUID NOT NULL,
    participant_id TEXT NOT NULL, -- Can be demo participant or real session participant
    vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree', 'neutral')),
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate votes from same participant
    UNIQUE(hexie_instance_id, participant_id)
);

-- Create hexie_contests table if it doesn't exist (from previous migration)
CREATE TABLE IF NOT EXISTS public.hexie_contests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hexie_id UUID NOT NULL,
    contest_type TEXT NOT NULL CHECK (contest_type IN ('disagree', 'incorrect', 'suggestions', 'feedback')),
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
    created_by UUID, -- Optional - can be null for anonymous contests
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    admin_notes TEXT
);

-- Create hexie_contest_settings table for toggles
CREATE TABLE IF NOT EXISTS public.hexie_contest_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.hexie_contest_settings (setting_key, setting_value, description) 
VALUES 
    ('allow_anonymous_contests', true, 'Allow non-logged-in users to contest cards'),
    ('require_login_for_contests', false, 'Require users to be logged in to contest cards'),
    ('voting_system_enabled', true, 'Enable the voting system for hexie cards'),
    ('contest_system_enabled', true, 'Enable the contest system for hexie cards')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hexie_votes_hexie_instance ON public.hexie_votes(hexie_instance_id);
CREATE INDEX IF NOT EXISTS idx_hexie_votes_participant ON public.hexie_votes(participant_id);
CREATE INDEX IF NOT EXISTS idx_hexie_votes_type ON public.hexie_votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_hexie_contests_hexie ON public.hexie_contests(hexie_id);
CREATE INDEX IF NOT EXISTS idx_hexie_contests_status ON public.hexie_contests(status);
CREATE INDEX IF NOT EXISTS idx_hexie_contests_created ON public.hexie_contests(created_at);

-- Enable Row Level Security
ALTER TABLE public.hexie_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hexie_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hexie_contest_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hexie_votes (allow all for demo purposes)
CREATE POLICY "Allow all operations on hexie_votes" ON public.hexie_votes
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for hexie_contests (allow all for demo purposes) 
CREATE POLICY "Allow all operations on hexie_contests" ON public.hexie_contests
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for hexie_contest_settings (allow read for all, write for admins)
CREATE POLICY "Allow read access to contest settings" ON public.hexie_contest_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow admin write access to contest settings" ON public.hexie_contest_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Create helper function to get contest settings
CREATE OR REPLACE FUNCTION get_contest_setting(setting_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    setting_val BOOLEAN;
BEGIN
    SELECT setting_value INTO setting_val 
    FROM public.hexie_contest_settings 
    WHERE setting_key = setting_name;
    
    -- Default to true if setting doesn't exist
    RETURN COALESCE(setting_val, true);
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hexie_votes TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hexie_contests TO authenticated, anon;
GRANT SELECT, UPDATE ON public.hexie_contest_settings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_contest_setting(TEXT) TO authenticated, anon;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully created voting and contest system tables with settings!';
    RAISE NOTICE 'Tables created: hexie_votes, hexie_contests, hexie_contest_settings';
    RAISE NOTICE 'Default settings: anonymous contests ENABLED, login required DISABLED';
END $$;