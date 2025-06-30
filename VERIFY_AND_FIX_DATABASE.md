# ✅ Database Verification and Fix Guide

## 🎯 **Current Status**
- ✅ All required tables exist (`hexie_votes`, `hexie_contests`, `hexie_contest_settings`)
- ✅ RLS policies are already in place
- ❌ Some 400/404 errors suggest data or permission issues

## 🔧 **Verification Steps**

### Step 1: Check Table Schemas
Run this in Supabase SQL Editor to verify the exact schema:

```sql
-- Check hexie_votes schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'hexie_votes';

-- Check hexie_contests schema  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'hexie_contests';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('hexie_votes', 'hexie_contests');
```

### Step 2: Test Data Insert (If Needed)
If the schema looks wrong, run these **ONLY IF NEEDED**:

```sql
-- Only run if hexie_votes has wrong schema
ALTER TABLE hexie_votes 
ADD COLUMN IF NOT EXISTS vote_type TEXT CHECK (vote_type IN ('agree', 'disagree', 'neutral'));

-- Only run if hexie_contests has wrong schema  
ALTER TABLE hexie_contests
ADD COLUMN IF NOT EXISTS contest_type TEXT CHECK (contest_type IN ('disagree', 'incorrect', 'suggestions', 'feedback'));
```

### Step 3: Ensure Permissive Policies (For Testing)
**Only if you're getting permission errors**:

```sql
-- Make sure policies allow testing
DROP POLICY IF EXISTS "Allow all operations on hexie_votes" ON hexie_votes;
CREATE POLICY "Allow all operations on hexie_votes" ON hexie_votes
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on hexie_contests" ON hexie_contests;  
CREATE POLICY "Allow all operations on hexie_contests" ON hexie_contests
    FOR ALL USING (true) WITH CHECK (true);
```

## 🧪 **Test the Fixed System**

1. **Go to**: http://localhost:3003/demo
2. **Add hexagon cards** to workspace (now generates proper UUIDs)
3. **Right-click a card** → Try voting (should work with proper UUIDs)
4. **Right-click a card** → Try "Contest Card" (should work with anonymous users)

## 🎛️ **Contest Permission Toggle**

The contest system is already set to allow anonymous users. To change this:

**File**: `/src/lib/features.ts`
```typescript
// Current (allow all users):
ALLOW_ANONYMOUS_CONTESTS: true,
REQUIRE_LOGIN_FOR_CONTESTS: false,

// To require login:
ALLOW_ANONYMOUS_CONTESTS: false,
REQUIRE_LOGIN_FOR_CONTESTS: true,
```

## 🚨 **If You Still Get Errors**

1. **Run Step 1** above to see exact schema
2. **Share the output** so I can provide specific fixes
3. **Check browser console** for specific error messages
4. **Test with new demo instances** (they now use proper UUIDs)

## 📋 **Expected Behavior After Fix**

- ✅ Voting should save to `hexie_votes` table
- ✅ Contest submissions should save to `hexie_contests` table  
- ✅ Anonymous users can contest cards
- ✅ No more UUID-related 400 errors
- ✅ Easy toggle between anonymous/login-required contest modes

**The database schema is correct - we just need to verify the specific configuration and test with the UUID fixes!**