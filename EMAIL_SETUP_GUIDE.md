# Email System Setup Guide

This guide will walk you through setting up the comprehensive email system in your hex-app and hexies-admin applications.

## 🔧 Step-by-Step Setup

### Step 1: Apply Database Migration

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `database/migrations/002-email-system-simple.sql`**
4. **Click "Run"**

This will create all the necessary tables for the email system.

### Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# SendGrid Configuration (Required)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your Company Name

# Active Directory Integration (Optional)
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Initialize Email System in Your App

Add this to your main app file (e.g., `src/app/layout.tsx` or `pages/_app.tsx`):

```typescript
'use client';

import { useEffect } from 'react';
import { initializeEmailSystem, shutdownEmailSystem } from '@/lib/email/email-system-init';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize email system on app startup
    initializeEmailSystem().catch(console.error);

    // Cleanup on app shutdown
    return () => {
      shutdownEmailSystem();
    };
  }, []);

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

### Step 4: SendGrid Setup

1. **Create SendGrid Account**: Go to [sendgrid.com](https://sendgrid.com)
2. **Generate API Key**: 
   - Go to Settings → API Keys
   - Create API Key with "Full Access" or "Mail Send" permissions
3. **Verify Domain** (Recommended):
   - Go to Settings → Sender Authentication
   - Verify your domain for better deliverability
4. **Add API Key** to your `.env.local` file

### Step 5: Test Email System

```bash
# Test the email system health
curl http://localhost:3000/api/email/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "scheduler": true,
    "sendgrid": true,
    "database": true
  },
  "timestamp": "2025-06-21T..."
}
```

## 📧 Usage Examples

### Send Payment Confirmation

```typescript
// In your payment success handler
await fetch('/api/email/send-payment-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    userName: 'John Doe',
    amount: '$99.00',
    planName: 'Premium Plan',
    transactionId: 'TXN123456',
    paymentDate: new Date().toLocaleDateString(),
    nextBillingDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()
  })
});
```

### Send Account Creation Email

```typescript
// In your user registration handler
await fetch('/api/email/send-account-created', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    userName: 'Jane Smith',
    organizationName: 'ACME Corp',
    activationLink: 'https://yourapp.com/activate?token=...',
    temporaryPassword: 'TempPass123' // Optional
  })
});
```

### Create Analytics Report

```typescript
// Create a weekly analytics report
const response = await fetch('/api/email/analytics-reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Weekly Team Health Report',
    reportType: 'organizational_health',
    recipientEmails: ['manager@company.com', 'hr@company.com'],
    organizationId: 'your-org-id',
    userId: 'current-user-id',
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    hourOfDay: 9, // 9 AM
    timezone: 'America/New_York',
    dateRangeType: 'relative',
    dateRangeValue: 'last_7_days',
    includeCharts: true,
    format: 'html'
  })
});
```

### Setup Active Directory Sync

```typescript
// Configure AD sync for your organization
const response = await fetch('/api/email/active-directory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update_config',
    organizationId: 'your-org-id',
    config: {
      tenantId: 'your-tenant-id',
      clientId: 'your-client-id', 
      clientSecret: 'your-client-secret',
      enabled: true,
      syncFrequency: 'daily',
      groupFilters: ['sales-team-id', 'management-id'], // Optional
      departmentFilters: ['Sales', 'Marketing'] // Optional
    }
  })
});

// Test the connection
const testResponse = await fetch('/api/email/active-directory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'test_connection',
    organizationId: 'your-org-id',
    config: {
      tenantId: 'your-tenant-id',
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret'
    }
  })
});

// Trigger immediate sync
const syncResponse = await fetch('/api/email/active-directory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'sync_now',
    organizationId: 'your-org-id'
  })
});
```

## 🔧 Configuration Options

### Email Frequencies
- `daily` - Every day at specified hour
- `weekly` - Every week on specified day and hour
- `monthly` - Every month on specified day and hour  
- `quarterly` - Every quarter at specified hour

### Report Types
- `organizational_health` - Overall organization metrics
- `department_metrics` - Department-specific analytics
- `user_engagement` - User activity and engagement
- `pattern_analysis` - Behavioral pattern insights
- `intervention_effectiveness` - Intervention success metrics
- `custom` - Custom report with flexible criteria

### Active Directory Sync Options
- `hourly` - Sync every hour
- `daily` - Sync once per day
- `weekly` - Sync once per week
- Group filtering by AD group IDs
- Department filtering by department names

## 🐛 Troubleshooting

### Email Not Sending

1. **Check API Key**: Verify SENDGRID_API_KEY is correct
2. **Check Domain**: Ensure sender domain is verified in SendGrid
3. **Check Logs**: Look at email_notifications table for failed emails
4. **Test Connection**: Use health endpoint to verify system status

```sql
-- Check failed emails
SELECT * FROM email_notifications 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Analytics Reports Not Working

1. **Check Scheduler**: Ensure email scheduler is running
2. **Check Reports**: Verify report configuration
3. **Check Data**: Ensure analytics data exists

```sql
-- Check scheduled reports
SELECT * FROM email_analytics_reports 
WHERE is_enabled = true 
AND next_run_at <= NOW();

-- Check recent report runs
SELECT name, last_run_at, last_success_at, last_error 
FROM email_analytics_reports 
ORDER BY last_run_at DESC;
```

### Active Directory Sync Issues

1. **Test Connection**: Use test_connection API endpoint
2. **Check Permissions**: Verify Azure app has correct permissions
3. **Check Credentials**: Verify tenant ID, client ID, and secret

```sql
-- Check AD sync status
SELECT 
  COUNT(*) as total_recipients,
  COUNT(*) FILTER (WHERE ad_sync_enabled = true) as ad_synced,
  MAX(ad_last_sync) as last_sync
FROM email_recipients 
WHERE organization_id = 'your-org-id';
```

## 📊 Monitoring

### Health Check Endpoint
`GET /api/email/health` - Check system health

### Database Monitoring

```sql
-- Email queue status
SELECT status, COUNT(*) 
FROM email_notifications 
GROUP BY status;

-- Campaign performance
SELECT 
  name,
  status,
  sent_count,
  delivered_count,
  opened_count,
  ROUND(opened_count::decimal / NULLIF(delivered_count, 0) * 100, 2) as open_rate
FROM email_campaigns
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Recent analytics reports
SELECT name, frequency, last_run_at, last_success_at
FROM email_analytics_reports
WHERE is_enabled = true
ORDER BY last_run_at DESC;
```

## 🔒 Security Best Practices

1. **Environment Variables**: Keep API keys secure in environment variables
2. **RLS Policies**: All tables have Row Level Security enabled
3. **Token Management**: Unsubscribe tokens are automatically generated
4. **Data Encryption**: Sensitive data should be encrypted at rest
5. **Access Control**: Use proper authentication for admin endpoints

## 🚀 Production Deployment

### Environment Variables for Production
```bash
# Production SendGrid
SENDGRID_API_KEY=SG.production_key_here
SENDGRID_FROM_EMAIL=noreply@yourcompany.com
SENDGRID_FROM_NAME=Your Company

# Production URLs
NEXT_PUBLIC_APP_URL=https://yourapp.com

# Production AD (if using)
AZURE_TENANT_ID=prod-tenant-id
AZURE_CLIENT_ID=prod-client-id
AZURE_CLIENT_SECRET=prod-client-secret
```

### Monitoring Setup
1. Set up alerts for failed emails
2. Monitor deliverability rates
3. Track campaign performance
4. Monitor AD sync health

### Performance Optimization
1. Configure email queue processing for high volume
2. Set up email template caching
3. Optimize database queries with proper indexing
4. Use connection pooling for high-traffic scenarios

Your email system is now ready for production use! 🎉