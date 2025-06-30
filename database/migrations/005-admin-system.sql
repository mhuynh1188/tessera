-- Admin System Database Schema
-- Comprehensive email template management, user management, and security settings

-- Email Templates System
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('marketing', 'transactional', 'notification', 'system')),
    category VARCHAR(100) DEFAULT 'general',
    
    -- Template Content
    html_content TEXT NOT NULL,
    text_content TEXT,
    template_variables JSONB DEFAULT '{}', -- Variables that can be used in template
    default_values JSONB DEFAULT '{}', -- Default values for variables
    
    -- Design and Layout
    design_config JSONB DEFAULT '{}', -- WYSIWYG editor configuration
    layout_structure JSONB DEFAULT '{}', -- Template structure for editor
    preview_image_url TEXT,
    
    -- Status and Metadata
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    is_system_template BOOLEAN DEFAULT FALSE, -- System templates cannot be deleted
    tags TEXT[] DEFAULT '{}',
    
    -- Organization and Permissions
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    
    -- Analytics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, name),
    CHECK (length(name) >= 3),
    CHECK (length(subject) >= 5)
);

-- Email Template Versions (for tracking changes)
CREATE TABLE IF NOT EXISTS email_template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Version Content
    html_content TEXT NOT NULL,
    text_content TEXT,
    subject VARCHAR(500) NOT NULL,
    template_variables JSONB DEFAULT '{}',
    design_config JSONB DEFAULT '{}',
    
    -- Version Metadata
    changelog TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(template_id, version_number)
);

-- Email Campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES email_templates(id) ON DELETE RESTRICT,
    
    -- Campaign Configuration
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    reply_to_email VARCHAR(255),
    
    -- Targeting
    target_audience JSONB DEFAULT '{}', -- Criteria for targeting
    recipient_lists TEXT[] DEFAULT '{}',
    
    -- Scheduling
    send_type VARCHAR(20) DEFAULT 'immediate' CHECK (send_type IN ('immediate', 'scheduled', 'triggered')),
    scheduled_at TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    
    -- Analytics
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    
    -- Organization and Permissions
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- Email Queue for Processing
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
    
    -- Recipient Information
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_data JSONB DEFAULT '{}', -- For personalization
    
    -- Email Content (after variable substitution)
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Processing Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'bounced')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Delivery Information
    message_id VARCHAR(255), -- External email service message ID
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Tracking
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    tracking_pixel_url TEXT,
    click_tracking_enabled BOOLEAN DEFAULT TRUE,
    
    -- Organization
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_email_queue_status (status),
    INDEX idx_email_queue_created_at (created_at),
    INDEX idx_email_queue_recipient (recipient_email)
);

-- User Management Enhancements
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    job_title VARCHAR(200),
    department VARCHAR(100),
    phone_number VARCHAR(20),
    profile_image_url TEXT,
    bio TEXT,
    
    -- Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    theme_preference VARCHAR(20) DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    
    -- Organization Association
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Activity Logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Activity Details
    action VARCHAR(100) NOT NULL, -- e.g., 'template_created', 'user_updated', 'campaign_sent'
    resource_type VARCHAR(50) NOT NULL, -- e.g., 'email_template', 'user', 'campaign'
    resource_id UUID,
    
    -- Activity Context
    details JSONB DEFAULT '{}', -- Additional context about the action
    changes JSONB DEFAULT '{}', -- What was changed (before/after)
    
    -- Request Context
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    
    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_admin_activity_user (user_id),
    INDEX idx_admin_activity_action (action),
    INDEX idx_admin_activity_created (created_at),
    INDEX idx_admin_activity_resource (resource_type, resource_id)
);

-- System Settings for Admin
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Setting Details
    category VARCHAR(50) NOT NULL, -- e.g., 'email', 'security', 'general'
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
    
    -- Metadata
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE, -- Can be accessed by non-admin users
    
    -- Validation
    validation_rules JSONB DEFAULT '{}', -- Rules for validating the setting value
    default_value JSONB,
    
    -- Permissions
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, category, setting_key)
);

-- Email Analytics and Reporting
CREATE TABLE IF NOT EXISTS email_analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_queue_id UUID REFERENCES email_queue(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam', 'unsubscribed')),
    event_data JSONB DEFAULT '{}', -- Additional event-specific data
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    location_data JSONB DEFAULT '{}', -- Geolocation if available
    
    -- External Service Data
    external_message_id VARCHAR(255),
    external_event_id VARCHAR(255),
    
    -- Organization
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_email_analytics_event_type (event_type),
    INDEX idx_email_analytics_campaign (campaign_id),
    INDEX idx_email_analytics_created (created_at)
);

-- Admin Dashboard Widgets Configuration
CREATE TABLE IF NOT EXISTS admin_dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Widget Configuration
    widget_type VARCHAR(50) NOT NULL, -- e.g., 'email_stats', 'user_activity', 'system_health'
    widget_config JSONB DEFAULT '{}',
    
    -- Layout
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 2,
    height INTEGER DEFAULT 2,
    
    -- Visibility
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, widget_type)
);

-- Row Level Security Policies

-- Email Templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_templates_org_access ON email_templates
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Email Campaigns
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_campaigns_org_access ON email_campaigns
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_own_access ON user_profiles
    FOR ALL USING (
        user_id = auth.uid() OR 
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Admin Activity Logs
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_activity_logs_admin_access ON admin_activity_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- System Settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_admin_access ON system_settings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Functions for Email Template Management

-- Function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE email_templates 
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create template version
CREATE OR REPLACE FUNCTION create_template_version(
    p_template_id UUID,
    p_changelog TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_template_record email_templates%ROWTYPE;
    v_version_id UUID;
    v_next_version INTEGER;
BEGIN
    -- Get current template
    SELECT * INTO v_template_record 
    FROM email_templates 
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO v_next_version
    FROM email_template_versions 
    WHERE template_id = p_template_id;
    
    -- Create version record
    INSERT INTO email_template_versions (
        template_id,
        version_number,
        html_content,
        text_content,
        subject,
        template_variables,
        design_config,
        changelog,
        created_by
    ) VALUES (
        p_template_id,
        v_next_version,
        v_template_record.html_content,
        v_template_record.text_content,
        v_template_record.subject,
        v_template_record.template_variables,
        v_template_record.design_config,
        p_changelog,
        auth.uid()
    ) RETURNING id INTO v_version_id;
    
    -- Update template version
    UPDATE email_templates 
    SET version = v_next_version,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = p_template_id;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_email_templates_org_status ON email_templates(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_usage ON email_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_org_status ON email_campaigns(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);

-- Insert Default System Templates
INSERT INTO email_templates (
    name, subject, template_type, html_content, text_content, 
    is_system_template, template_variables, status
) VALUES 
(
    'Welcome Email',
    'Welcome to {{company_name}}!',
    'system',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to {{company_name}}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">Welcome to {{company_name}}!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p>Hi {{user_name}},</p>
            
            <p>Welcome to our platform! We''re excited to have you on board.</p>
            
            <p>Here''s what you can do to get started:</p>
            <ul>
                <li>Complete your profile setup</li>
                <li>Explore our features</li>
                <li>Connect with your team</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboard_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Get Started
                </a>
            </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Need help? <a href="{{support_url}}" style="color: #2563eb;">Contact our support team</a></p>
            <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
        </div>
    </body>
    </html>',
    'Welcome to {{company_name}}!

Hi {{user_name}},

Welcome to our platform! We''re excited to have you on board.

Here''s what you can do to get started:
- Complete your profile setup
- Explore our features  
- Connect with your team

Get started: {{dashboard_url}}

Need help? Contact our support team: {{support_url}}

© {{current_year}} {{company_name}}. All rights reserved.',
    TRUE,
    '{"company_name": {"type": "string", "description": "Company name"}, "user_name": {"type": "string", "description": "User full name"}, "dashboard_url": {"type": "url", "description": "Dashboard URL"}, "support_url": {"type": "url", "description": "Support URL"}, "current_year": {"type": "number", "description": "Current year"}}',
    'active'
),
(
    'Password Reset',
    'Reset your password for {{company_name}}',
    'system',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626;">Password Reset Request</h1>
        </div>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p>Hi {{user_name}},</p>
            
            <p>We received a request to reset your password for your {{company_name}} account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Reset Password
                </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">This link will expire in {{expiry_hours}} hours.</p>
            
            <p style="font-size: 14px; color: #666;">
                If you didn''t request this password reset, please ignore this email or contact support if you have concerns.
            </p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Need help? <a href="{{support_url}}" style="color: #2563eb;">Contact our support team</a></p>
            <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
        </div>
    </body>
    </html>',
    'Password Reset Request

Hi {{user_name}},

We received a request to reset your password for your {{company_name}} account.

Click this link to reset your password: {{reset_url}}

This link will expire in {{expiry_hours}} hours.

If you didn''t request this password reset, please ignore this email or contact support if you have concerns.

Need help? Contact our support team: {{support_url}}

© {{current_year}} {{company_name}}. All rights reserved.',
    TRUE,
    '{"company_name": {"type": "string", "description": "Company name"}, "user_name": {"type": "string", "description": "User full name"}, "reset_url": {"type": "url", "description": "Password reset URL"}, "expiry_hours": {"type": "number", "description": "Hours until link expires"}, "support_url": {"type": "url", "description": "Support URL"}, "current_year": {"type": "number", "description": "Current year"}}',
    'active'
),
(
    '2FA Setup',
    'Secure your {{company_name}} account with two-factor authentication',
    'system',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Enable Two-Factor Authentication</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669;">🔐 Secure Your Account</h1>
        </div>
        
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p>Hi {{user_name}},</p>
            
            <p>Two-factor authentication (2FA) has been enabled for your {{company_name}} account to provide an extra layer of security.</p>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                <p><strong>Your backup codes:</strong></p>
                <code style="background: #f3f4f6; padding: 10px; display: block; font-family: monospace;">
                    {{backup_codes}}
                </code>
                <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{account_url}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Manage Account Security
                </a>
            </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Need help? <a href="{{support_url}}" style="color: #2563eb;">Contact our support team</a></p>
            <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
        </div>
    </body>
    </html>',
    '🔐 Secure Your Account

Hi {{user_name}},

Two-factor authentication (2FA) has been enabled for your {{company_name}} account to provide an extra layer of security.

Your backup codes:
{{backup_codes}}

Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.

Manage your account security: {{account_url}}

Need help? Contact our support team: {{support_url}}

© {{current_year}} {{company_name}}. All rights reserved.',
    TRUE,
    '{"company_name": {"type": "string", "description": "Company name"}, "user_name": {"type": "string", "description": "User full name"}, "backup_codes": {"type": "string", "description": "2FA backup codes"}, "account_url": {"type": "url", "description": "Account settings URL"}, "support_url": {"type": "url", "description": "Support URL"}, "current_year": {"type": "number", "description": "Current year"}}',
    'active'
);

-- Insert Default System Settings
INSERT INTO system_settings (category, setting_key, setting_value, data_type, description, is_public) VALUES
('email', 'smtp_host', '""', 'string', 'SMTP server hostname', FALSE),
('email', 'smtp_port', '587', 'number', 'SMTP server port', FALSE),
('email', 'smtp_secure', 'true', 'boolean', 'Use TLS/SSL for SMTP', FALSE),
('email', 'sender_name', '"Your Company"', 'string', 'Default sender name for emails', TRUE),
('email', 'sender_email', '"noreply@yourcompany.com"', 'string', 'Default sender email address', TRUE),
('email', 'max_send_rate', '100', 'number', 'Maximum emails per minute', FALSE),
('security', 'password_min_length', '8', 'number', 'Minimum password length', TRUE),
('security', 'password_require_uppercase', 'true', 'boolean', 'Require uppercase letters in passwords', TRUE),
('security', 'password_require_numbers', 'true', 'boolean', 'Require numbers in passwords', TRUE),
('security', 'password_require_symbols', 'false', 'boolean', 'Require symbols in passwords', TRUE),
('security', 'session_timeout_minutes', '60', 'number', 'Session timeout in minutes', TRUE),
('security', 'max_login_attempts', '5', 'number', 'Maximum failed login attempts before lockout', TRUE),
('general', 'company_name', '"Your Company"', 'string', 'Company name', TRUE),
('general', 'support_email', '"support@yourcompany.com"', 'string', 'Support email address', TRUE),
('general', 'dashboard_url', '"https://yourcompany.com/dashboard"', 'string', 'Dashboard URL', TRUE);