-- Create missing security tables for admin system
BEGIN;

-- 1. Create security_policies table
CREATE TABLE IF NOT EXISTS security_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    policy_name VARCHAR(200) NOT NULL,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('password', 'mfa', 'session', 'ip_allowlist', 'login_attempts', 'data_retention')),
    policy_config JSONB NOT NULL DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT true,
    enforcement_level VARCHAR(20) DEFAULT 'required' CHECK (enforcement_level IN ('optional', 'recommended', 'required', 'strict')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, policy_name)
);

-- 2. Create ip_allowlist table
CREATE TABLE IF NOT EXISTS ip_allowlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    ip_address INET,
    ip_range CIDR,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT ip_or_range_required CHECK (ip_address IS NOT NULL OR ip_range IS NOT NULL)
);

-- 3. Create mfa_settings table
CREATE TABLE IF NOT EXISTS mfa_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    require_all_users_mfa BOOLEAN DEFAULT false,
    allowed_methods TEXT[] DEFAULT ARRAY['totp', 'sms', 'email'],
    backup_codes_enabled BOOLEAN DEFAULT true,
    session_timeout_minutes INTEGER DEFAULT 480,
    remember_device_days INTEGER DEFAULT 30,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- 4. Create compliance_framework table
CREATE TABLE IF NOT EXISTS compliance_framework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    framework_name VARCHAR(100) NOT NULL,
    framework_type VARCHAR(50) NOT NULL CHECK (framework_type IN ('SOC2', 'GDPR', 'HIPAA', 'PCI_DSS', 'ISO27001', 'CUSTOM')),
    requirements JSONB NOT NULL DEFAULT '[]',
    compliance_status VARCHAR(20) DEFAULT 'in_progress' CHECK (compliance_status IN ('not_started', 'in_progress', 'compliant', 'non_compliant', 'under_review')),
    last_audit_date DATE,
    next_audit_date DATE,
    responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert default security policies for demo organization
INSERT INTO security_policies (organization_id, policy_name, policy_type, policy_config, is_enabled) VALUES
('11111111-1111-1111-1111-111111111111', 'Password Policy', 'password', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_symbols": false, "max_age_days": 90}', true),
('11111111-1111-1111-1111-111111111111', 'Multi-Factor Authentication', 'mfa', '{"required_for_all": false, "allowed_methods": ["totp", "sms"], "backup_codes": true}', true),
('11111111-1111-1111-1111-111111111111', 'Session Management', 'session', '{"max_session_duration": 480, "idle_timeout": 30, "concurrent_sessions": 3}', true),
('11111111-1111-1111-1111-111111111111', 'Login Attempts', 'login_attempts', '{"max_attempts": 5, "lockout_duration": 15, "reset_after": 60}', true)
ON CONFLICT (organization_id, policy_name) DO NOTHING;

-- 6. Insert default MFA settings
INSERT INTO mfa_settings (organization_id, require_all_users_mfa, allowed_methods) VALUES
('11111111-1111-1111-1111-111111111111', false, ARRAY['totp', 'sms', 'email'])
ON CONFLICT (organization_id) DO NOTHING;

-- 7. Insert default compliance frameworks
INSERT INTO compliance_framework (organization_id, framework_name, framework_type, requirements, compliance_status) VALUES
('11111111-1111-1111-1111-111111111111', 'SOC 2 Type II', 'SOC2', '[
    {"control": "CC6.1", "description": "Logical and physical access controls", "status": "in_progress"},
    {"control": "CC6.2", "description": "User access management", "status": "compliant"},
    {"control": "CC6.3", "description": "Network security", "status": "in_progress"},
    {"control": "CC7.1", "description": "System monitoring", "status": "not_started"}
]', 'in_progress'),
('11111111-1111-1111-1111-111111111111', 'GDPR Compliance', 'GDPR', '[
    {"article": "Article 25", "description": "Data protection by design", "status": "in_progress"},
    {"article": "Article 32", "description": "Security of processing", "status": "in_progress"},
    {"article": "Article 33", "description": "Breach notification", "status": "compliant"}
]', 'in_progress')
ON CONFLICT DO NOTHING;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_policies_org ON security_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_org ON ip_allowlist(organization_id);
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_active ON ip_allowlist(is_active);
CREATE INDEX IF NOT EXISTS idx_mfa_settings_org ON mfa_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_framework_org ON compliance_framework(organization_id);

-- 9. Enable RLS on new tables
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_framework ENABLE ROW LEVEL SECURITY;

-- 10. Create simple RLS policies
CREATE POLICY security_policies_simple ON security_policies
FOR ALL USING (true); -- Allow all access for now

CREATE POLICY ip_allowlist_simple ON ip_allowlist
FOR ALL USING (true); -- Allow all access for now

CREATE POLICY mfa_settings_simple ON mfa_settings
FOR ALL USING (true); -- Allow all access for now

CREATE POLICY compliance_framework_simple ON compliance_framework
FOR ALL USING (true); -- Allow all access for now

COMMIT;

SELECT 'Security tables created successfully!' as status;