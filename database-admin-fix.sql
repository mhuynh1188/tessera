-- Fix Admin System for Existing Database
-- This script adds only the missing pieces needed for the admin system

BEGIN;

-- 1. Add missing columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended', 'locked', 'pending_verification'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- 2. Create organization_members table for role management
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- 3. Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    job_title VARCHAR(200),
    department VARCHAR(100),
    phone_number VARCHAR(20),
    profile_image_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create admin_activity_logs table for audit tracking
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create email_queue table for email processing
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'bounced')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add missing columns to existing email_templates table
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'transactional' CHECK (template_type IN ('marketing', 'transactional', 'notification', 'system'));
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived'));
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT FALSE;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 7. Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 8. Create user_two_factor_auth table for 2FA support
CREATE TABLE IF NOT EXISTS user_two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('totp', 'sms', 'email', 'backup_codes')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, method_type)
);

-- 9. Create system_settings table for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, category, setting_key)
);

-- 10. Insert default organization for existing users
INSERT INTO organizations (id, name, subscription_tier, settings) 
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'Demo Organization', 
    'enterprise',
    '{"analytics_enabled": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 11. Update existing users to be part of demo organization
UPDATE users SET 
    organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

-- 12. Insert organization members for existing users
INSERT INTO organization_members (user_id, organization_id, role)
SELECT 
    u.id,
    '11111111-1111-1111-1111-111111111111',
    CASE 
        WHEN u.is_admin = true THEN 'admin'
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role = 'hr' THEN 'admin'
        WHEN u.role = 'executive' THEN 'admin'
        ELSE 'member'
    END
FROM users u
WHERE u.organization_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 13. Create user profiles for existing users
INSERT INTO user_profiles (user_id, first_name, last_name, display_name, organization_id)
SELECT 
    u.id,
    COALESCE(u.first_name, split_part(u.email, '@', 1)),
    COALESCE(u.last_name, ''),
    COALESCE(u.first_name || ' ' || u.last_name, u.email),
    u.organization_id
FROM users u
WHERE u.organization_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 14. Update email templates with organization
UPDATE email_templates SET 
    organization_id = '11111111-1111-1111-1111-111111111111'
WHERE organization_id IS NULL;

-- 15. Insert some sample activity logs
INSERT INTO admin_activity_logs (user_id, organization_id, action, resource_type, details, success)
SELECT 
    u.id,
    u.organization_id,
    'login_success',
    'user',
    'User logged in successfully',
    true
FROM users u
WHERE u.organization_id IS NOT NULL
LIMIT 5
ON CONFLICT DO NOTHING;

-- 16. Insert default system settings
INSERT INTO system_settings (organization_id, category, setting_key, setting_value, description) VALUES
('11111111-1111-1111-1111-111111111111', 'email', 'sender_name', '"Demo Organization"', 'Default sender name for emails'),
('11111111-1111-1111-1111-111111111111', 'email', 'sender_email', '"noreply@demo.com"', 'Default sender email address'),
('11111111-1111-1111-1111-111111111111', 'security', 'password_min_length', '8', 'Minimum password length'),
('11111111-1111-1111-1111-111111111111', 'security', 'max_login_attempts', '5', 'Maximum failed login attempts'),
('11111111-1111-1111-1111-111111111111', 'general', 'company_name', '"Demo Organization"', 'Company name')
ON CONFLICT (organization_id, category, setting_key) DO NOTHING;

-- 17. Create indexes for performance (using correct syntax)
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_user ON admin_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_org ON admin_activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- 18. Enable Row Level Security on new tables
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 19. Create basic RLS policies
CREATE POLICY organization_members_policy ON organization_members
FOR ALL USING (
    user_id = auth.uid() OR 
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
);

CREATE POLICY user_profiles_policy ON user_profiles
FOR ALL USING (
    user_id = auth.uid() OR 
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
);

CREATE POLICY admin_activity_logs_policy ON admin_activity_logs
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
);

CREATE POLICY user_sessions_policy ON user_sessions
FOR ALL USING (user_id = auth.uid());

CREATE POLICY user_two_factor_auth_policy ON user_two_factor_auth
FOR ALL USING (user_id = auth.uid());

CREATE POLICY system_settings_policy ON system_settings
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
);

COMMIT;

-- Success message
SELECT 'Admin system fix applied successfully! All required tables and data are now ready.' as status;