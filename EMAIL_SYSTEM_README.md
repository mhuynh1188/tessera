# Comprehensive Email System for Hex-App & Hexies-Admin

This document provides a complete guide to the comprehensive email system that has been implemented for both the hex-app and hexies-admin applications.

## 🎯 Overview

The email system provides:
- **Transactional Emails**: Authentication, payment confirmations, account creation
- **Analytics Reports**: Automated scheduled reports with configurable frequency
- **Email Campaigns**: Bulk email campaigns with targeting capabilities
- **Active Directory Integration**: Sync recipients from your organization's AD
- **Email Templates**: Dynamic template management with variables
- **Email Scheduling**: Automated scheduling and queue processing
- **Deliverability Tracking**: Monitor email performance and reputation

## 📋 Features Implemented

### ✅ Core Email Capabilities
- [x] **Enhanced Email Service** with SendGrid integration
- [x] **Payment Confirmation Emails** with detailed transaction info
- [x] **Account Creation Notifications** with activation links
- [x] **Login Notifications** with device and location tracking
- [x] **OTP Verification Emails** (existing functionality enhanced)
- [x] **Password Reset Emails** (existing functionality enhanced)

### ✅ Analytics Email Reports
- [x] **Automated Weekly/Monthly Reports** with organizational metrics
- [x] **Configurable Report Frequency** (daily, weekly, monthly, quarterly)
- [x] **Multiple Report Types**:
  - Organizational Health
  - Department Metrics
  - User Engagement
  - Pattern Analysis
  - Intervention Effectiveness
- [x] **Custom Date Ranges** and filtering options
- [x] **HTML and PDF Format Support**

### ✅ Email Campaign Management
- [x] **Bulk Email Campaigns** with targeting
- [x] **Scheduled Campaigns** with recurring options
- [x] **Recipient Management** with filtering
- [x] **Campaign Analytics** (sent, delivered, opened, clicked)
- [x] **Template-based Campaigns**

### ✅ Active Directory Integration
- [x] **Microsoft Graph API Integration** for user sync
- [x] **Automatic Recipient Sync** from AD groups
- [x] **Department and Role Filtering**
- [x] **Configurable Sync Frequency** (hourly, daily, weekly)
- [x] **Connection Testing** and status monitoring

### ✅ Database Schema
- [x] **email_notifications** - Queue and tracking table
- [x] **email_templates** - Dynamic template management
- [x] **email_preferences** - User notification preferences
- [x] **email_campaigns** - Campaign management
- [x] **email_recipients** - Recipient list with AD integration
- [x] **email_analytics_reports** - Report configuration
- [x] **email_deliverability** - Performance tracking

### ✅ API Endpoints
- [x] **`/api/email/campaigns`** - Campaign CRUD operations
- [x] **`/api/email/analytics-reports`** - Report management
- [x] **`/api/email/send-payment-confirmation`** - Payment notifications
- [x] **`/api/email/send-account-created`** - Account creation emails
- [x] **`/api/email/active-directory`** - AD integration management
- [x] **`/api/email/scheduler/start`** - Scheduler control

## 🚀 Getting Started

### 1. Environment Configuration

Add these environment variables to your `.env.local`:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your App Name

# Active Directory (Optional)
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
```

### 2. Database Migration

Apply the email system migration:

```bash
# Run the migration in your Supabase SQL Editor
# File: database/migrations/002-comprehensive-email-system.sql
```

### 3. Initialize Email Scheduler

Start the email scheduler in your application:

```typescript
import { emailScheduler } from '@/lib/email/email-scheduler';

// In your app startup (e.g., pages/_app.tsx or app/layout.tsx)
useEffect(() => {
  emailScheduler.start();
  
  return () => {
    emailScheduler.stop();
  };
}, []);
```

## 📧 Usage Examples

### Send Payment Confirmation

```typescript
import { enhancedEmailService } from '@/lib/email/enhanced-email-service';

await enhancedEmailService.sendPaymentConfirmation({
  email: 'user@example.com',
  userName: 'John Doe',
  amount: '$99.00',
  planName: 'Premium Plan',
  transactionId: 'TXN123456',
  paymentDate: '2025-06-21',
  nextBillingDate: '2025-07-21'
});
```

### Create Analytics Report

```typescript
const reportId = await enhancedEmailService.createAnalyticsReport({
  name: 'Weekly Team Health Report',
  reportType: 'organizational_health',
  recipientEmails: ['manager@company.com', 'hr@company.com'],
  frequency: 'weekly',
  dateRangeType: 'relative',
  dateRangeValue: 'last_7_days',
  includeCharts: true,
  format: 'html'
}, organizationId, userId);
```

### Sync Active Directory Users

```typescript
import { activeDirectoryService } from '@/lib/email/active-directory-integration';

const results = await activeDirectoryService.syncUsersFromAD(organizationId, {
  tenantId: 'your-tenant-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  enabled: true,
  syncFrequency: 'daily',
  groupFilters: ['group-id-1', 'group-id-2']
});
```

## 🔧 Configuration Options

### Email Preferences

Users can configure their email preferences:

```typescript
await enhancedEmailService.updateEmailPreferences(userId, {
  email_enabled: true,
  analytics_reports: true,
  analytics_frequency: 'weekly',
  collaboration_notifications: true,
  marketing_emails: false
});
```

### Active Directory Sync

Configure AD sync for your organization:

```typescript
await activeDirectoryService.updateADSyncConfig(organizationId, {
  enabled: true,
  syncFrequency: 'daily',
  groupFilters: ['sales-team', 'management'],
  departmentFilters: ['Sales', 'Marketing', 'Engineering']
});
```

### Analytics Report Types

Available report types:
- **`organizational_health`** - Overall organization metrics
- **`department_metrics`** - Department-specific analytics
- **`user_engagement`** - User activity and engagement
- **`pattern_analysis`** - Behavioral pattern insights
- **`intervention_effectiveness`** - Intervention success metrics
- **`custom`** - Custom report with flexible criteria

### Email Templates

Create custom email templates:

```sql
INSERT INTO email_templates (name, display_name, subject_template, html_template, organization_id)
VALUES (
  'custom_notification',
  'Custom Notification',
  'Important Update: {{subject}}',
  '<html>...</html>',
  'org-id'
);
```

## 📊 Monitoring & Analytics

### Email Deliverability

Track email performance:
- Delivery rates
- Bounce rates
- Open rates
- Click rates
- Spam reports
- Unsubscribe rates

### Campaign Analytics

Monitor campaign performance:
- Recipients count
- Sent/delivered/opened/clicked metrics
- Conversion tracking
- A/B testing results

### System Health

Monitor the email system:
- Queue processing times
- Failed email retry counts
- Template usage statistics
- API endpoint performance

## 🔒 Security & Privacy

### Data Protection
- **Row Level Security (RLS)** on all email tables
- **Encrypted sensitive data** (API keys, secrets)
- **Audit logging** for all email activities
- **GDPR compliance** with unsubscribe tokens

### Active Directory Security
- **OAuth 2.0** authentication with Microsoft Graph
- **Scoped permissions** for minimal access
- **Secure token storage** with automatic refresh
- **Connection testing** without storing credentials

## 🐛 Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SendGrid API key configuration
   - Verify domain authentication in SendGrid
   - Check email queue status: `SELECT * FROM email_notifications WHERE status = 'failed'`

2. **Analytics reports not generating**
   - Verify scheduler is running: `emailScheduler.start()`
   - Check report configuration: `SELECT * FROM email_analytics_reports WHERE is_enabled = true`
   - Review error logs in `last_error` field

3. **Active Directory sync failing**
   - Test AD connection: Use `/api/email/active-directory` with `action=test_connection`
   - Verify Azure app permissions: `User.Read.All`, `Group.Read.All`
   - Check tenant ID and client credentials

### Debug Mode

Enable debug logging:

```typescript
process.env.DEBUG_EMAIL = 'true';
```

### Database Queries for Debugging

```sql
-- Check email queue status
SELECT status, COUNT(*) FROM email_notifications GROUP BY status;

-- Check recent analytics reports
SELECT * FROM email_analytics_reports WHERE last_run_at >= NOW() - INTERVAL '24 hours';

-- Check AD sync status
SELECT ad_sync_enabled, COUNT(*) FROM email_recipients GROUP BY ad_sync_enabled;

-- Check email campaign performance
SELECT name, status, sent_count, delivered_count, opened_count 
FROM email_campaigns 
WHERE created_at >= NOW() - INTERVAL '30 days';
```

## 🔄 Maintenance

### Regular Tasks

1. **Clean old email notifications** (older than 30 days)
2. **Update email deliverability metrics** (daily)
3. **Monitor bounce rates** and update recipient status
4. **Review and optimize email templates** based on performance
5. **Update Active Directory sync schedules** as needed

### Performance Optimization

1. **Index optimization** for email tables
2. **Queue processing** optimization for high-volume sending
3. **Template caching** for frequently used templates
4. **Database cleanup** of old email logs

## 📚 API Reference

### Email Service Methods

- `sendPaymentConfirmation(data)` - Send payment confirmation
- `sendAccountCreated(data)` - Send account creation notification  
- `sendLoginNotification(data)` - Send login notification
- `sendAnalyticsReport(email, data, org, period)` - Send analytics report
- `queueEmail(template, email, name, subject, vars, options)` - Queue email for sending
- `createCampaign(campaign, orgId, userId)` - Create email campaign
- `createAnalyticsReport(config, orgId, userId)` - Create analytics report
- `updateEmailPreferences(userId, prefs)` - Update user email preferences

### Active Directory Service Methods

- `syncUsersFromAD(orgId, config)` - Sync users from Active Directory
- `testADConnection(config)` - Test AD connection
- `fetchADUsers(config, groupId?)` - Fetch users from AD
- `fetchADGroups(config)` - Fetch groups from AD
- `getEmailRecipients(orgId, filters)` - Get email recipients with filters

### Email Scheduler Methods

- `start()` - Start the email scheduler
- `stop()` - Stop the email scheduler
- `processScheduledEmails()` - Process pending emails (called automatically)

This comprehensive email system provides everything needed for professional email communications, automated reporting, and efficient recipient management across both hex-app and hexies-admin applications.