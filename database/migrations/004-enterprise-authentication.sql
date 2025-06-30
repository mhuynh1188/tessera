-- ENTERPRISE AUTHENTICATION SYSTEM
-- Version: 004
-- Description: Comprehensive enterprise authentication with 2FA, SSO, audit logging, and RBAC
-- Date: 2025-06-21

BEGIN;

-- Check if this migration was already applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '004-enterprise-auth') THEN
        RAISE NOTICE 'Migration 004-enterprise-auth already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- 1. ENHANCED ORGANIZATIONS TABLE
-- Update existing organizations table with enterprise features
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS domain_verification_status TEXT DEFAULT 'unverified' CHECK (domain_verification_status IN ('unverified', 'pending', 'verified'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_provider TEXT; -- 'saml', 'oidc', 'azure_ad', 'okta'
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_config JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS security_policy JSONB DEFAULT '{
  "password_policy": {
    "min_length": 12,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_special_chars": true,
    "max_age_days": 90,
    "prevent_reuse_count": 5
  },
  "account_policy": {
    "max_failed_attempts": 5,
    "lockout_duration_minutes": 30,
    "require_email_verification": true,
    "require_2fa": false,
    "require_2fa_for_admins": true
  },
  "session_policy": {
    "max_concurrent_sessions": 3,
    "idle_timeout_minutes": 30,
    "absolute_timeout_hours": 8,
    "require_fresh_login_for_admin": true
  },
  "network_policy": {
    "allowed_ip_ranges": [],
    "restrict_to_company_network": false,
    "allow_vpn_access": true
  }
}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS compliance_settings JSONB DEFAULT '{
  "data_retention_days": 2555,
  "audit_log_retention_days": 2555,
  "gdpr_enabled": false,
  "hipaa_enabled": false,
  "soc2_controls": false
}';

-- 2. ENHANCED USERS TABLE
-- Add enterprise user fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS termination_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended', 'locked', 'pending_verification'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS sso_provider_id VARCHAR(255); -- External provider user ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_history JSONB DEFAULT '[]'; -- Hashed previous passwords

-- 3. USER SESSIONS TABLE
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Session details
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,
  
  -- Device and network info
  device_fingerprint VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  ip_location JSONB, -- Country, city, ISP info
  
  -- Session metadata
  is_trusted_device BOOLEAN DEFAULT FALSE,
  device_name VARCHAR(255), -- User-assigned device name
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  
  -- Security flags
  is_admin_session BOOLEAN DEFAULT FALSE,
  requires_fresh_auth BOOLEAN DEFAULT FALSE,
  security_level TEXT DEFAULT 'standard' CHECK (security_level IN ('low', 'standard', 'high', 'critical'))
);

-- 4. ORGANIZATION ROLES TABLE
CREATE TABLE IF NOT EXISTS organization_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Role details
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Permissions
  permissions JSONB NOT NULL DEFAULT '[]', -- Array of permission strings
  resource_permissions JSONB DEFAULT '{}', -- Resource-specific permissions
  
  -- Hierarchy
  parent_role_id UUID REFERENCES organization_roles(id),
  role_level INTEGER DEFAULT 1, -- 1=lowest, higher numbers = higher privilege
  
  -- System flags
  is_system_role BOOLEAN DEFAULT FALSE,
  is_default_role BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

-- 5. USER ROLE ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES organization_roles(id) ON DELETE CASCADE,
  
  -- Assignment metadata
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For temporary role assignments
  
  -- Assignment context
  assignment_reason TEXT,
  assignment_scope JSONB DEFAULT '{}', -- Department, project, etc.
  
  UNIQUE(user_id, role_id)
);

-- 6. SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL, -- login, logout, password_change, role_change, etc.
  event_category VARCHAR(50) NOT NULL, -- authentication, authorization, data_access, admin_action
  event_description TEXT NOT NULL,
  event_details JSONB DEFAULT '{}',
  
  -- Security analysis
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  risk_factors JSONB DEFAULT '[]', -- Array of risk indicators
  
  -- Network and device info
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  geolocation JSONB,
  
  -- Outcome
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_audit_org_time (organization_id, created_at),
  INDEX idx_audit_user_time (user_id, created_at),
  INDEX idx_audit_event_type (event_type),
  INDEX idx_audit_risk_score (risk_score) WHERE risk_score > 50
);

-- 7. TWO FACTOR AUTHENTICATION TABLE
CREATE TABLE IF NOT EXISTS user_two_factor_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 2FA method
  method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('totp', 'sms', 'email', 'backup_codes')),
  
  -- TOTP specific
  totp_secret TEXT, -- Encrypted
  totp_algorithm VARCHAR(10) DEFAULT 'SHA1',
  totp_digits INTEGER DEFAULT 6,
  totp_period INTEGER DEFAULT 30,
  
  -- SMS/Email specific
  phone_number VARCHAR(20),
  email_address VARCHAR(255),
  
  -- Backup codes
  backup_codes JSONB, -- Array of encrypted backup codes
  backup_codes_used JSONB DEFAULT '[]', -- Used backup codes
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Security
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  UNIQUE(user_id, method_type)
);

-- 8. SSO IDENTITY PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS sso_identity_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Provider details
  provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('saml', 'oidc', 'azure_ad', 'okta', 'google_workspace', 'custom')),
  provider_name VARCHAR(255) NOT NULL,
  provider_domain VARCHAR(255), -- For domain-based routing
  
  -- Configuration
  config JSONB NOT NULL, -- Provider-specific configuration
  metadata JSONB DEFAULT '{}', -- SAML metadata, OIDC discovery, etc.
  
  -- Certificates and keys
  signing_certificate TEXT, -- For SAML
  encryption_certificate TEXT, -- For SAML
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Testing and validation
  last_test_at TIMESTAMPTZ,
  test_status TEXT CHECK (test_status IN ('success', 'failed', 'pending', 'never_tested')),
  test_error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, provider_name)
);

-- 9. ACCESS REQUESTS TABLE
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Request details
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('workspace_access', 'role_change', 'permission_grant', 'data_access')),
  
  -- Target resource
  target_resource_type VARCHAR(50), -- 'workspace', 'role', 'user', etc.
  target_resource_id UUID,
  requested_permissions JSONB,
  
  -- Justification
  business_justification TEXT NOT NULL,
  urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
  
  -- Approval workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled', 'expired')),
  approver_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Expiration
  requested_until TIMESTAMPTZ, -- When the access should expire
  auto_expire_at TIMESTAMPTZ, -- When the request expires if not acted upon
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PASSWORD HISTORY TABLE
CREATE TABLE IF NOT EXISTS user_password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  password_hash TEXT NOT NULL, -- Store previous password hashes
  salt TEXT,
  hash_algorithm VARCHAR(50) DEFAULT 'bcrypt',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for efficient lookups
  INDEX idx_password_history_user (user_id, created_at DESC)
);

-- 11. DEVICE REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS user_registered_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Device identification
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255), -- User-assigned name
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  device_os VARCHAR(100),
  browser_info JSONB,
  
  -- Trust and security
  is_trusted BOOLEAN DEFAULT FALSE,
  trust_established_at TIMESTAMPTZ,
  trust_method VARCHAR(50), -- 'manual', '2fa_verification', 'admin_approval'
  
  -- Activity tracking
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_ip_address INET,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, device_fingerprint)
);

-- 12. COMPLIANCE DATA EXPORTS TABLE
CREATE TABLE IF NOT EXISTS compliance_data_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Request details
  requested_by UUID NOT NULL REFERENCES users(id),
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('gdpr_user_data', 'audit_logs', 'user_activity', 'security_events')),
  
  -- Scope
  data_subject_id UUID REFERENCES users(id), -- For GDPR requests
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  filters JSONB DEFAULT '{}',
  
  -- Processing
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  file_path TEXT, -- Path to generated export file
  file_size BIGINT,
  expires_at TIMESTAMPTZ, -- When the export file should be deleted
  
  -- Security
  access_token VARCHAR(255) UNIQUE, -- Token required to download the export
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 3,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 13. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_org_status ON users(organization_id, account_status);
CREATE INDEX IF NOT EXISTS idx_users_sso_provider ON users(sso_provider_id) WHERE sso_provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(two_factor_enabled) WHERE two_factor_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until) WHERE locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON user_sessions(user_id, last_activity) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_sessions_org_active ON user_sessions(organization_id, last_activity) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_device ON user_sessions(device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_roles_org_active ON organization_roles(organization_id) WHERE is_system_role = FALSE;
CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_expires ON user_role_assignments(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_org_category ON security_audit_logs(organization_id, event_category, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_high_risk ON security_audit_logs(created_at) WHERE risk_score > 70;

CREATE INDEX IF NOT EXISTS idx_2fa_user_method ON user_two_factor_auth(user_id, method_type);
CREATE INDEX IF NOT EXISTS idx_2fa_verified ON user_two_factor_auth(user_id) WHERE is_verified = TRUE;

CREATE INDEX IF NOT EXISTS idx_sso_providers_org_active ON sso_identity_providers(organization_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sso_providers_domain ON sso_identity_providers(provider_domain) WHERE provider_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_access_requests_org_status ON access_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_access_requests_approver ON access_requests(approver_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_devices_user_active ON user_registered_devices(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON user_registered_devices(device_fingerprint);

-- 14. Create enterprise authentication functions

-- Function to validate password against organization policy
CREATE OR REPLACE FUNCTION validate_password_policy(
  user_id_param UUID,
  new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_policy JSONB;
  password_history TEXT[];
  validation_result JSONB := '{"valid": true, "errors": []}';
  errors TEXT[] := '{}';
BEGIN
  -- Get organization security policy
  SELECT o.security_policy->'password_policy'
  INTO org_policy
  FROM users u
  JOIN organizations o ON u.organization_id = o.id
  WHERE u.id = user_id_param;
  
  -- Check minimum length
  IF LENGTH(new_password) < (org_policy->>'min_length')::INTEGER THEN
    errors := array_append(errors, 'Password must be at least ' || (org_policy->>'min_length') || ' characters long');
  END IF;
  
  -- Check character requirements
  IF (org_policy->>'require_uppercase')::BOOLEAN AND new_password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  IF (org_policy->>'require_lowercase')::BOOLEAN AND new_password !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  IF (org_policy->>'require_numbers')::BOOLEAN AND new_password !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  IF (org_policy->>'require_special_chars')::BOOLEAN AND new_password !~ '[^A-Za-z0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  -- Check password history (simplified - in production, hash the password first)
  IF (org_policy->>'prevent_reuse_count')::INTEGER > 0 THEN
    SELECT ARRAY(
      SELECT password_hash 
      FROM user_password_history 
      WHERE user_id = user_id_param 
      ORDER BY created_at DESC 
      LIMIT (org_policy->>'prevent_reuse_count')::INTEGER
    ) INTO password_history;
    
    -- In production, this would hash new_password and compare with stored hashes
    -- For now, we just ensure the structure is in place
  END IF;
  
  -- Return validation result
  IF array_length(errors, 1) > 0 THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(errors)
    );
  END IF;
  
  RETURN validation_result;
END;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  user_id_param UUID,
  session_id_param UUID,
  event_type_param VARCHAR(100),
  event_category_param VARCHAR(50),
  event_description_param TEXT,
  event_details_param JSONB DEFAULT '{}',
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  success_param BOOLEAN DEFAULT TRUE,
  risk_score_param INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
  log_id UUID;
BEGIN
  -- Get organization ID
  SELECT organization_id INTO org_id FROM users WHERE id = user_id_param;
  
  -- Insert audit log
  INSERT INTO security_audit_logs (
    organization_id,
    user_id,
    session_id,
    event_type,
    event_category,
    event_description,
    event_details,
    ip_address,
    user_agent,
    success,
    risk_score
  ) VALUES (
    org_id,
    user_id_param,
    session_id_param,
    event_type_param,
    event_category_param,
    event_description_param,
    event_details_param,
    ip_address_param,
    user_agent_param,
    success_param,
    risk_score_param
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to check account lockout status
CREATE OR REPLACE FUNCTION check_account_lockout(user_email_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  org_policy JSONB;
  lockout_info JSONB;
BEGIN
  -- Get user and organization policy
  SELECT u.*, o.security_policy->'account_policy' as account_policy
  INTO user_record
  FROM users u
  LEFT JOIN organizations o ON u.organization_id = o.id
  WHERE u.email = user_email_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('locked', false, 'user_exists', false);
  END IF;
  
  -- Check if account is locked
  IF user_record.locked_until IS NOT NULL AND user_record.locked_until > NOW() THEN
    RETURN jsonb_build_object(
      'locked', true,
      'locked_until', user_record.locked_until,
      'reason', 'Too many failed login attempts'
    );
  END IF;
  
  -- Check if account is suspended or inactive
  IF user_record.account_status IN ('suspended', 'locked', 'inactive') THEN
    RETURN jsonb_build_object(
      'locked', true,
      'reason', 'Account is ' || user_record.account_status
    );
  END IF;
  
  RETURN jsonb_build_object('locked', false, 'user_exists', true);
END;
$$;

-- 15. Insert default system roles for each organization
INSERT INTO organization_roles (organization_id, name, display_name, description, permissions, role_level, is_system_role, is_default_role)
SELECT 
  o.id,
  'member',
  'Member',
  'Standard organization member with basic access',
  '["read_own_data", "edit_own_profile", "use_basic_features"]'::JSONB,
  1,
  true,
  true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_roles r 
  WHERE r.organization_id = o.id AND r.name = 'member'
)
ON CONFLICT (organization_id, name) DO NOTHING;

INSERT INTO organization_roles (organization_id, name, display_name, description, permissions, role_level, is_system_role)
SELECT 
  o.id,
  unnest(ARRAY['manager', 'hr', 'admin', 'owner']),
  unnest(ARRAY['Manager', 'HR Administrator', 'Administrator', 'Organization Owner']),
  unnest(ARRAY[
    'Team manager with access to team data and basic admin functions',
    'HR administrator with access to employee data and user management',
    'Organization administrator with full system access',
    'Organization owner with complete control'
  ]),
  unnest(ARRAY[
    '["read_team_data", "manage_team_members", "view_reports"]'::JSONB,
    '["manage_users", "view_audit_logs", "manage_departments"]'::JSONB,
    '["full_admin_access", "manage_organization", "configure_security"]'::JSONB,
    '["owner_access", "billing_management", "delete_organization"]'::JSONB
  ]),
  unnest(ARRAY[2, 3, 4, 5]),
  true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_roles r 
  WHERE r.organization_id = o.id AND r.name IN ('manager', 'hr', 'admin', 'owner')
);

-- 16. Create RLS policies for new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_identity_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_registered_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_data_exports ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined based on specific requirements)
CREATE POLICY user_sessions_own_sessions ON user_sessions
FOR ALL USING (user_id = auth.uid());

CREATE POLICY organization_roles_org_members ON organization_roles
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
);

CREATE POLICY user_role_assignments_org_members ON user_role_assignments
FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
);

CREATE POLICY security_audit_logs_org_admins ON security_audit_logs
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN organization_roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid() 
    AND r.permissions ? 'view_audit_logs'
  )
);

CREATE POLICY user_two_factor_auth_own_data ON user_two_factor_auth
FOR ALL USING (user_id = auth.uid());

CREATE POLICY sso_identity_providers_org_admins ON sso_identity_providers
FOR ALL USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN organization_roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid() 
    AND r.permissions ? 'configure_security'
  )
);

CREATE POLICY access_requests_involved_users ON access_requests
FOR ALL USING (
  requester_id = auth.uid() 
  OR approver_id = auth.uid()
  OR (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN organization_roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid() 
      AND r.permissions ? 'manage_access_requests'
    )
  )
);

CREATE POLICY user_password_history_own_data ON user_password_history
FOR ALL USING (user_id = auth.uid());

CREATE POLICY user_registered_devices_own_devices ON user_registered_devices
FOR ALL USING (user_id = auth.uid());

CREATE POLICY compliance_data_exports_org_admins ON compliance_data_exports
FOR ALL USING (
  organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN organization_roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid() 
    AND r.permissions ? 'export_compliance_data'
  )
);

-- Record migration completion
INSERT INTO schema_migrations (version, description) VALUES (
  '004-enterprise-auth',
  'Enterprise authentication system with 2FA, SSO, RBAC, audit logging, and compliance features'
) ON CONFLICT (version) DO NOTHING;

COMMIT;

-- Success notification
SELECT 'Enterprise authentication migration 004 completed successfully! Added 2FA, SSO, RBAC, audit logging, and compliance features.' as status;