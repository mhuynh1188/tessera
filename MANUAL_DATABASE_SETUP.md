# Manual Database Setup for Voting and Contest System

Since the automated migration had API key issues, please run these SQL commands manually in your Supabase dashboard:

## Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to "SQL Editor" 
3. Create a new query
4. Copy and paste the SQL below

## Step 2: Create Tables

```sql
-- Create hexie_votes table
CREATE TABLE IF NOT EXISTS public.hexie_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hexie_instance_id UUID NOT NULL,
    participant_id TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree', 'neutral')),
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate votes from same participant
    UNIQUE(hexie_instance_id, participant_id)
);

-- Create hexie_contests table
CREATE TABLE IF NOT EXISTS public.hexie_contests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hexie_id UUID NOT NULL,
    contest_type TEXT NOT NULL CHECK (contest_type IN ('disagree', 'incorrect', 'suggestions', 'feedback')),
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
    created_by UUID, -- Can be null for anonymous contests
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    admin_notes TEXT
);

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

-- RLS Policies (allow all for demo/testing purposes)
CREATE POLICY "Allow all operations on hexie_votes" ON public.hexie_votes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on hexie_contests" ON public.hexie_contests
    FOR ALL USING (true) WITH CHECK (true);
```

## Step 3: Run the Query
1. Click "Run" to execute the SQL
2. You should see success messages for each table creation

## Step 4: Verify Tables Exist
Go to "Table Editor" in Supabase dashboard and verify you see:
- `hexie_votes` table
- `hexie_contests` table

## Current Feature Settings

The contest system is now configured with these easy toggles in `/src/lib/features.ts`:

```typescript
export const FEATURE_FLAGS = {
  // Contest system
  CONTEST_SYSTEM_ENABLED: true,
  
  // Voting system
  VOTING_SYSTEM_ENABLED: true,
  
  // Contest permissions (EASY TOGGLES!)
  ALLOW_ANONYMOUS_CONTESTS: true,     // ← Set to false to require login
  REQUIRE_LOGIN_FOR_CONTESTS: false, // ← Set to true to block anonymous users
  
  // Other features
  REFERENCES_ENABLED: true,
  WORKSPACE_ENABLED: true,
}
```

## How to Toggle Anonymous Contest Access

### Option 1: Allow All Users to Contest (Current Setting)
```typescript
ALLOW_ANONYMOUS_CONTESTS: true,
REQUIRE_LOGIN_FOR_CONTESTS: false,
```

### Option 2: Require Login for Contests
```typescript
ALLOW_ANONYMOUS_CONTESTS: false,
REQUIRE_LOGIN_FOR_CONTESTS: true,
```

## Testing the Features

After creating the tables:
1. Go to http://localhost:3003/demo
2. Right-click on any hexagon card
3. Try "Contest Card" - should work for anonymous users
4. Try voting with thumbs up/down - should save to database
5. Check Supabase table editor to see the data

## Admin Interface

The admin interface for viewing contests is located at:
- `/Users/michaelhuynh/working/hexies-admin/components/ContestAdminPanel.tsx`

It shows:
- All contested cards
- Contest statistics
- Ability to disable contesting per card
- Unique contester counts