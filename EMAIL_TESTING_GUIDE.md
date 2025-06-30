# Email System Testing & Customization Guide

## 🧪 Testing Your Email System

### Step 1: Basic Health Check

1. **Start your development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Test the API endpoint directly**:
   ```bash
   curl http://localhost:3000/api/email/test
   ```

   **Expected Response**:
   ```json
   {
     "timestamp": "2025-06-21T...",
     "database_connection": "success",
     "tables": {
       "email_templates": "success",
       "email_notifications": "success", 
       "email_preferences": "success"
     },
     "template_counts": {
       "total_templates": 4,
       "system_templates": 4
     },
     "system_templates": [
       {"id": "...", "name": "payment_confirmation"},
       {"id": "...", "name": "account_created"},
       {"id": "...", "name": "login_otp"},
       {"id": "...", "name": "analytics_weekly_report"}
     ],
     "sendgrid_configured": false,
     "environment_variables": {
       "SENDGRID_API_KEY": "missing",
       "SENDGRID_FROM_EMAIL": "missing",
       "SENDGRID_FROM_NAME": "missing"
     }
   }
   ```

### Step 2: Configure SendGrid (Optional for Testing)

1. **Get SendGrid API Key**:
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Create API Key with "Mail Send" permissions
   - Add to your `.env.local`:

   ```bash
   # SendGrid Configuration
   SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=Your Company Name
   ```

2. **Test with SendGrid**:
   ```bash
   curl http://localhost:3000/api/email/test
   ```
   
   Now `sendgrid_configured` should be `true`.

### Step 3: Test Email Queueing

1. **Queue a test email**:
   ```bash
   curl -X POST http://localhost:3000/api/email/test \
     -H "Content-Type: application/json" \
     -d '{
       "action": "queue_test_email",
       "email": "your-email@example.com",
       "name": "Test User"
     }'
   ```

2. **Check queue status**:
   ```bash
   curl -X POST http://localhost:3000/api/email/test \
     -H "Content-Type: application/json" \
     -d '{"action": "check_queue"}'
   ```

### Step 4: Access Admin Interface

1. **Navigate to the admin interface**:
   ```
   http://localhost:3000/hexies-admin/admin/email
   ```

2. **Test the three main sections**:
   - **Email Templates**: Create, edit, and preview templates
   - **Testing & Health**: Monitor system health and send test emails
   - **System Monitoring**: Real-time email system status

## 🎨 Customizing Email Templates

### Method 1: Using the Admin Interface

1. **Navigate to Email Templates tab**
2. **Click "Create Template"**
3. **Fill in the template details**:
   - **Name**: `custom_welcome` (alphanumeric, underscore, hyphen only)
   - **Display Name**: `Custom Welcome Email`
   - **Category**: Select from dropdown
   - **Subject**: `Welcome to {{organization_name}}, {{user_name}}!`
   - **HTML Template**: Full HTML with variables

4. **Use Template Variables**:
   ```html
   <h1>Welcome {{user_name}}!</h1>
   <p>You've joined {{organization_name}}</p>
   <a href="{{dashboard_link}}">Access Dashboard</a>
   ```

5. **Preview and Save**

### Method 2: Using the API

1. **Create a new template**:
   ```bash
   curl -X POST http://localhost:3000/api/email/templates \
     -H "Content-Type: application/json" \
     -d '{
       "name": "custom_notification",
       "display_name": "Custom Notification",
       "description": "Custom notification template",
       "category": "notifications",
       "subject_template": "{{subject}} from {{app_name}}",
       "html_template": "<html><body><h1>{{title}}</h1><p>{{message}}</p></body></html>"
     }'
   ```

2. **Update an existing template**:
   ```bash
   curl -X PUT http://localhost:3000/api/email/templates \
     -H "Content-Type: application/json" \
     -d '{
       "id": "template-id-here",
       "display_name": "Updated Template Name",
       "subject_template": "Updated: {{subject}}",
       "html_template": "<html>Updated content</html>"
     }'
   ```

3. **Preview a template**:
   ```bash
   curl -X POST http://localhost:3000/api/email/templates/preview \
     -H "Content-Type: application/json" \
     -d '{
       "templateId": "template-id-here",
       "variables": {
         "user_name": "John Doe",
         "organization_name": "ACME Corp",
         "subject": "Test Message"
       }
     }'
   ```

## 🔒 Security Features

### Template Security

1. **Name Sanitization**: Template names are sanitized to prevent injection
2. **System Template Protection**: System templates cannot be modified or deleted
3. **Input Validation**: All template fields are validated
4. **XSS Prevention**: HTML content is properly handled in previews

### API Security

1. **CSRF Protection**: Built-in Next.js CSRF protection
2. **Input Validation**: Comprehensive validation on all endpoints
3. **Error Handling**: Secure error messages without sensitive information
4. **Authentication Ready**: Endpoints ready for authentication integration

### Database Security

1. **Row Level Security (RLS)**: Enabled on all email tables
2. **Parameterized Queries**: All database queries use parameters
3. **Soft Deletes**: Templates are deactivated, not deleted
4. **Audit Trail**: Created/updated timestamps on all records

## 🚀 Advanced Usage

### Custom Email Variables

Add dynamic variables to your templates:

```html
<!-- User Info -->
{{user_name}}, {{user_email}}, {{user_role}}

<!-- Organization Info -->
{{organization_name}}, {{organization_domain}}

<!-- System Info -->
{{app_name}}, {{dashboard_link}}, {{current_year}}

<!-- Custom Variables -->
{{custom_field_1}}, {{custom_field_2}}
```

### Conditional Content

Use simple JavaScript-like conditions:

```html
{{#if user_role === 'admin'}}
<p>You have admin privileges!</p>
{{/if}}

{{#if organization_tier === 'premium'}}
<div class="premium-content">Premium features available</div>
{{/if}}
```

### Email Categories

Organize templates by category:

- **auth**: Login, registration, password reset
- **billing**: Payment confirmations, invoices
- **analytics**: Automated reports
- **notifications**: System notifications
- **marketing**: Newsletters, promotions
- **system**: System alerts, maintenance
- **custom**: Your custom templates

### Branding Customization

1. **Logo**: Add your company logo URL
2. **Colors**: Define brand colors in template
3. **Footer**: Customize footer content
4. **Styling**: Full HTML/CSS control

## 📊 Monitoring & Analytics

### Email Queue Monitoring

- **Status Tracking**: pending, sending, sent, failed
- **Error Logging**: Detailed error messages
- **Retry Logic**: Automatic retries for failed emails
- **Performance Metrics**: Send times and success rates

### Template Analytics

- **Usage Tracking**: How often templates are used
- **Performance**: Open rates, click rates (if tracking enabled)
- **A/B Testing**: Compare template variations

## 🔄 Integration Examples

### Payment Confirmation

```javascript
// In your payment success handler
await fetch('/api/email/templates/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateName: 'payment_confirmation',
    recipientEmail: customer.email,
    recipientName: customer.name,
    variables: {
      amount: '$99.00',
      plan_name: 'Premium Plan',
      transaction_id: payment.id,
      payment_date: new Date().toLocaleDateString()
    }
  })
});
```

### Account Creation

```javascript
// In your user registration handler
await fetch('/api/email/templates/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateName: 'account_created',
    recipientEmail: user.email,
    recipientName: user.name,
    variables: {
      user_name: user.name,
      organization_name: organization.name,
      dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    }
  })
});
```

### OTP Login

```javascript
// In your OTP generation handler
await fetch('/api/email/templates/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateName: 'login_otp',
    recipientEmail: user.email,
    recipientName: user.name,
    variables: {
      user_name: user.name,
      otp_code: generateOTP(),
      expiry_minutes: '10'
    }
  })
});
```

## 🐛 Troubleshooting

### Common Issues

1. **"Templates not loading"**
   - Check database migration was successful
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **"SendGrid not configured"**
   - Add SendGrid environment variables
   - Restart development server
   - Verify API key permissions

3. **"Template variables not rendering"**
   - Check variable names match exactly
   - Ensure variables are passed in request
   - Use preview function to test

4. **"Permission denied"**
   - Check if trying to edit system templates
   - Verify user has admin access
   - Check RLS policies in database

### Debug Commands

```bash
# Check database tables
curl http://localhost:3000/api/email/test | jq '.tables'

# Check email queue
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"action": "check_queue"}' | jq '.queue_status'

# List all templates
curl http://localhost:3000/api/email/templates | jq '.templates[].name'

# Preview specific template
curl -X POST http://localhost:3000/api/email/templates/preview \
  -H "Content-Type: application/json" \
  -d '{"templateId": "template-id", "variables": {}}' | jq '.preview'
```

Your email system is now fully customizable, secure, and ready for production! 🎉