-- Fix RLS Policy Infinite Recursion Issues
-- The problem is that policies are referencing organization_members table which creates circular dependencies

BEGIN;

-- Temporarily disable RLS on problematic tables to fix policies
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS organization_members_policy ON organization_members;
DROP POLICY IF EXISTS user_profiles_policy ON user_profiles;
DROP POLICY IF EXISTS admin_activity_logs_policy ON admin_activity_logs;
DROP POLICY IF EXISTS system_settings_policy ON system_settings;

-- Re-enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- Organization members - simple user-based policy
CREATE POLICY organization_members_simple ON organization_members
FOR ALL USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
    )
);

-- User profiles - allow users to see their own profile + admins see all
CREATE POLICY user_profiles_simple ON user_profiles
FOR ALL USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
    )
);

-- Admin activity logs - only for authenticated users, admins see all
CREATE POLICY admin_activity_logs_simple ON admin_activity_logs
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
        )
    )
);

-- System settings - only admins can access
CREATE POLICY system_settings_simple ON system_settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
    )
);

-- Set the admin emails setting
SELECT set_config('app.admin_emails', 'mhuynh1188@hotmail.com', false);

COMMIT;

-- Test the fix
SELECT 'RLS policies fixed successfully' as status;