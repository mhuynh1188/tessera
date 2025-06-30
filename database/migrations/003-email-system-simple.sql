-- EMAIL SYSTEM MIGRATION - SIMPLE AND CLEAN
-- Version: 003
-- Description: Create email system tables that work with existing schema
-- Date: 2025-06-21

-- Start transaction
BEGIN;

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    rollback_sql TEXT
);

-- Check if this migration was already applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '003-email-system') THEN
        RAISE NOTICE 'Migration 003-email-system already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- 1. EMAIL NOTIFICATIONS TABLE (simplified)
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    
    -- Email details
    template_name VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    
    -- Template variables
    template_variables JSONB DEFAULT '{}',
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    
    -- Delivery tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    email_provider VARCHAR(50) DEFAULT 'sendgrid',
    provider_message_id VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EMAIL TEMPLATES TABLE (simplified)
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template details
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    
    -- Template content
    subject_template VARCHAR(500) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    
    -- Template metadata
    variables JSONB DEFAULT '[]',
    default_variables JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false,
    
    -- Analytics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EMAIL PREFERENCES TABLE (simplified)
CREATE TABLE IF NOT EXISTS email_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    
    -- General preferences
    email_enabled BOOLEAN DEFAULT true,
    frequency_preference VARCHAR(50) DEFAULT 'immediate' CHECK (frequency_preference IN ('immediate', 'hourly', 'daily', 'weekly', 'monthly', 'never')),
    
    -- Notification types
    auth_notifications BOOLEAN DEFAULT true,
    account_notifications BOOLEAN DEFAULT true,
    analytics_reports BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Analytics report preferences
    analytics_frequency VARCHAR(50) DEFAULT 'weekly' CHECK (analytics_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'never')),
    analytics_day_of_week INTEGER DEFAULT 1 CHECK (analytics_day_of_week BETWEEN 0 AND 6),
    analytics_hour INTEGER DEFAULT 9 CHECK (analytics_hour BETWEEN 0 AND 23),
    analytics_timezone VARCHAR(100) DEFAULT 'UTC',
    
    -- Custom preferences
    custom_settings JSONB DEFAULT '{}',
    unsubscribe_token VARCHAR(255) UNIQUE DEFAULT gen_random_uuid(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EMAIL CAMPAIGNS TABLE (simplified)
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campaign details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(100) DEFAULT 'manual' CHECK (campaign_type IN ('manual', 'automated', 'analytics_report', 'system_notification')),
    
    -- Template and content
    template_id UUID,
    subject VARCHAR(500) NOT NULL,
    
    -- Targeting
    target_criteria JSONB DEFAULT '{}',
    recipient_count INTEGER DEFAULT 0,
    
    -- Scheduling
    schedule_type VARCHAR(50) DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
    scheduled_at TIMESTAMPTZ,
    timezone VARCHAR(100) DEFAULT 'UTC',
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'completed')),
    
    -- Analytics
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EMAIL RECIPIENTS TABLE (simplified)
CREATE TABLE IF NOT EXISTS email_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Recipient details
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    display_name VARCHAR(255),
    job_title VARCHAR(255),
    department VARCHAR(255),
    
    -- Active Directory integration
    ad_object_id VARCHAR(255),
    ad_user_principal_name VARCHAR(255),
    ad_sync_enabled BOOLEAN DEFAULT false,
    ad_last_sync TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    opted_out BOOLEAN DEFAULT false,
    
    -- Metadata
    source VARCHAR(100) DEFAULT 'manual',
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EMAIL ANALYTICS REPORTS TABLE (simplified)
CREATE TABLE IF NOT EXISTS email_analytics_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Report configuration
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(100) NOT NULL CHECK (report_type IN ('organizational_health', 'department_metrics', 'user_engagement', 'pattern_analysis', 'intervention_effectiveness', 'custom')),
    
    -- Recipients
    recipient_emails TEXT[] NOT NULL,
    recipient_groups JSONB DEFAULT '[]',
    
    -- Report settings
    date_range_type VARCHAR(50) DEFAULT 'relative' CHECK (date_range_type IN ('relative', 'fixed')),
    date_range_value VARCHAR(100) DEFAULT 'last_30_days',
    date_range_start DATE,
    date_range_end DATE,
    
    -- Filters
    department_filter TEXT[],
    role_filter TEXT[],
    custom_filters JSONB DEFAULT '{}',
    
    -- Scheduling
    is_enabled BOOLEAN DEFAULT true,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    hour_of_day INTEGER DEFAULT 9 CHECK (hour_of_day BETWEEN 0 AND 23),
    timezone VARCHAR(100) DEFAULT 'UTC',
    
    -- Report format
    format VARCHAR(50) DEFAULT 'html' CHECK (format IN ('html', 'pdf', 'both')),
    include_charts BOOLEAN DEFAULT true,
    include_raw_data BOOLEAN DEFAULT false,
    
    -- Status
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error TEXT,
    run_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EMAIL DELIVERABILITY TABLE (simplified)
CREATE TABLE IF NOT EXISTS email_deliverability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Date and metrics
    report_date DATE NOT NULL UNIQUE,
    
    -- Sending metrics
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    emails_blocked INTEGER DEFAULT 0,
    
    -- Engagement metrics
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    unsubscribes INTEGER DEFAULT 0,
    spam_reports INTEGER DEFAULT 0,
    
    -- Calculated rates
    delivery_rate DECIMAL(5,2) DEFAULT 0.00,
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    open_rate DECIMAL(5,2) DEFAULT 0.00,
    click_rate DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_status_scheduled ON email_notifications(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_template ON email_notifications(template_name);

CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);

CREATE INDEX IF NOT EXISTS idx_email_preferences_user ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_analytics ON email_preferences(analytics_frequency, analytics_day_of_week);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_email_recipients_active ON email_recipients(is_active);
CREATE INDEX IF NOT EXISTS idx_email_recipients_email ON email_recipients(email);

CREATE INDEX IF NOT EXISTS idx_email_analytics_reports_next_run ON email_analytics_reports(next_run_at) WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS idx_email_deliverability_date ON email_deliverability(report_date);

-- 9. Insert default email templates
INSERT INTO email_templates (id, name, display_name, description, category, subject_template, html_template, is_system_template, is_active) VALUES
-- Payment Confirmation Template
(
    '22222222-2222-2222-2222-222222222222',
    'payment_confirmation',
    'Payment Confirmation',
    'Confirmation email sent after successful payment',
    'billing',
    'Payment Confirmation - {{amount}} for {{plan_name}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Payment Confirmed</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px;">Thank you for your payment!</p>
        
        <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <p><strong>Amount:</strong> {{amount}}</p>
            <p><strong>Plan:</strong> {{plan_name}}</p>
            <p><strong>Payment Date:</strong> {{payment_date}}</p>
            <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboard_link}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;">
                Access Your Account
            </a>
        </div>
    </div>
</body>
</html>',
    true,
    true
),
-- Account Creation Template
(
    '33333333-3333-3333-3333-333333333333',
    'account_created',
    'Account Created',
    'Welcome email sent after account creation',
    'auth',
    'Welcome to {{organization_name}} - Account Created',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎉 Welcome!</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px;">Hi {{user_name}},</p>
        <p>Your account has been successfully created!</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboard_link}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;">
                Access Your Dashboard
            </a>
        </div>
    </div>
</body>
</html>',
    true,
    true
),
-- Login OTP Template
(
    '44444444-4444-4444-4444-444444444444',
    'login_otp',
    'Login Verification Code',
    'OTP code for secure login',
    'auth',
    'Your login verification code',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Login Verification</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔐 Login Verification</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px;">Use this code to complete your login:</p>
        
        <div style="background: white; border: 2px solid #007bff; border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center;">
            <h2 style="font-size: 36px; margin: 0; color: #007bff; letter-spacing: 8px;">{{otp_code}}</h2>
            <p style="margin: 10px 0 0 0; color: #6c757d;">This code expires in {{expiry_minutes}} minutes</p>
        </div>
    </div>
</body>
</html>',
    true,
    true
),
-- Analytics Report Template
(
    '11111111-1111-1111-1111-111111111111',
    'analytics_weekly_report',
    'Weekly Analytics Report',
    'Automated weekly analytics report',
    'analytics',
    'Weekly Analytics Report - {{report_period}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Weekly Analytics Report</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📊 Weekly Analytics Report</h1>
        <p style="color: white; margin: 10px 0 0 0;">{{report_period}}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #333; margin-top: 0;">Summary</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                <h3 style="margin: 0; color: #28a745;">Active Users</h3>
                <p style="font-size: 24px; margin: 10px 0; font-weight: bold;">{{active_users}}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
                <h3 style="margin: 0; color: #007bff;">Total Sessions</h3>
                <p style="font-size: 24px; margin: 10px 0; font-weight: bold;">{{total_sessions}}</p>
            </div>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
            <a href="{{dashboard_link}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Full Dashboard
            </a>
        </div>
    </div>
</body>
</html>',
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 10. Create email processing function
CREATE OR REPLACE FUNCTION queue_email(
    p_template_name VARCHAR,
    p_recipient_email VARCHAR,
    p_recipient_name VARCHAR,
    p_subject VARCHAR,
    p_template_variables JSONB DEFAULT '{}',
    p_user_id UUID DEFAULT NULL,
    p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO email_notifications (
        template_name,
        recipient_email,
        recipient_name,
        subject,
        template_variables,
        user_id,
        scheduled_for
    ) VALUES (
        p_template_name,
        p_recipient_email,
        p_recipient_name,
        p_subject,
        p_template_variables,
        p_user_id,
        p_scheduled_for
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Record migration completion
INSERT INTO schema_migrations (version, description) VALUES (
    '003-email-system',
    'Created simplified email system with 7 tables and default templates'
) ON CONFLICT (version) DO NOTHING;

COMMIT;

-- Success notification
SELECT 'Email system migration 003 completed successfully! 7 tables created with default templates.' as status;