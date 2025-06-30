# Hex-App Deployment Guide
## Vercel + Supabase + SendGrid Integration

This guide walks you through deploying Hex-App with test and production environments to minimize costs and provide safe development workflows.

## 🏗️ Architecture Overview

### Environments
- **Development**: Local development with optional dev database
- **Test/Staging**: Vercel preview deployments for testing
- **Production**: Live production environment

### Services
- **Vercel**: Hosting and deployment (Free tier: Unlimited personal projects)
- **Supabase**: Database and authentication (Free tier: 2 projects, 500MB database)
- **SendGrid**: Email services (Free tier: 100 emails/day)

## 🔧 Setup Instructions

### 1. Supabase Setup

#### Create Projects
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create **two projects** (recommended):
   - `tessera-dev` (for development/testing)
   - `tessera-prod` (for production)

#### Configure Database
```sql
-- Run these scripts in both Supabase projects
-- Check the /database folder for complete schema
```

#### Get Credentials
From each Supabase project settings:
```
Project URL: https://your-project.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. SendGrid Setup

#### Create Account
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Verify your account and domain
3. Create an API key with "Mail Send" permissions

#### Configure Sender
1. Add your sender email in SendGrid
2. Verify domain ownership
3. Set up SPF/DKIM records

#### Get API Key
```
API Key: SG.your_api_key_here
From Email: noreply@yourdomain.com
```

### 3. Vercel Deployment

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Initial Setup
```bash
# In your project directory
vercel login
vercel link
```

#### Deploy Test Environment
```bash
# Deploy to staging/preview
./scripts/deploy.sh test
```

#### Deploy Production Environment
```bash
# Deploy to production
./scripts/deploy.sh prod
```

## 🌍 Environment Variables

### Vercel Dashboard Configuration

Go to your Vercel project → Settings → Environment Variables:

#### Development Variables
```env
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
MOCK_EMAIL_SENDING=true
```

#### Production Variables
```env
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
MOCK_EMAIL_SENDING=false
```

### Environment-Specific Settings

| Variable | Development | Test | Production |
|----------|-------------|------|------------|
| `MOCK_EMAIL_SENDING` | `true` | `true` | `false` |
| `DEBUG_MODE` | `true` | `true` | `false` |
| Supabase Project | Dev Instance | Dev Instance | Prod Instance |
| Email Rate Limits | Relaxed | Relaxed | Strict |

## 🚀 Deployment Workflow

### Safe Development Process

1. **Local Development**
   ```bash
   npm run dev
   # Uses .env.local with dev database
   ```

2. **Test Deployment**
   ```bash
   git push origin feature-branch
   # Automatically creates Vercel preview
   # Uses test environment variables
   ```

3. **Production Deployment**
   ```bash
   git push origin main
   # Automatically deploys to production
   # Uses production environment variables
   ```

### Branch Strategy
- `main` → Production deployment
- `develop` → Test deployment
- `feature/*` → Preview deployments

## 📧 Email Service Features

### Implemented Email Types
- ✅ **OTP/Verification Codes**
- ✅ **Welcome Emails**
- ✅ **Password Reset**
- ✅ **Collaboration Invites**
- ✅ **System Notifications**

### Email API Endpoints
```typescript
// Send OTP
POST /api/email/send-otp
{
  "email": "user@example.com",
  "otp": "123456",
  "userName": "John Doe"
}

// Send Welcome
POST /api/email/send-welcome
{
  "email": "user@example.com",
  "userName": "John Doe",
  "verificationLink": "https://..."
}
```

### Rate Limiting
- **Development**: 10 emails/minute per IP
- **Production**: 5 emails/minute per IP
- **Daily Limits**: Managed by SendGrid tier

## 💰 Cost Optimization

### Free Tier Limits
- **Vercel**: Unlimited hobby projects
- **Supabase**: 2 projects, 500MB database, 50,000 monthly active users
- **SendGrid**: 100 emails/day forever free

### Scaling Strategy
1. **Start Free**: Use all free tiers initially
2. **Monitor Usage**: Track metrics via dashboards
3. **Upgrade Gradually**: Only upgrade services as needed

### Cost Monitoring
- Vercel: Monitor function executions and bandwidth
- Supabase: Monitor database size and active users
- SendGrid: Monitor email volume and deliverability

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env.local` files
- Use different databases for dev/prod
- Rotate API keys regularly
- Use service role keys only on server-side

### Database Security
- Enable Row Level Security (RLS)
- Use proper user permissions
- Regular backups (auto-enabled in Supabase)
- Monitor access logs

### Email Security
- Verify sender domains
- Use SPF/DKIM authentication
- Monitor bounce rates
- Implement unsubscribe handling

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails**
```bash
# Check build logs
vercel logs your-deployment-url

# Common fixes
npm run build  # Test build locally
npm install    # Update dependencies
```

**Email Not Sending**
```bash
# Check SendGrid activity
# Verify API key permissions
# Check domain verification status
```

**Database Connection**
```bash
# Verify Supabase URLs
# Check RLS policies
# Monitor database logs
```

### Monitoring & Alerts

#### Vercel Analytics
- Function execution times
- Error rates
- Geographic performance

#### Supabase Monitoring
- Database performance
- Real-time connections
- API usage

#### SendGrid Analytics
- Delivery rates
- Open/click rates
- Bounce/spam rates

## 🎯 Production Checklist

### Pre-Launch
- [ ] Domain configured and verified
- [ ] SSL certificates active
- [ ] Database migrations applied
- [ ] Email templates tested
- [ ] Rate limiting configured
- [ ] Error monitoring enabled
- [ ] Backup strategy in place

### Post-Launch
- [ ] Monitor error rates
- [ ] Check email deliverability
- [ ] Review performance metrics
- [ ] Set up alerts for issues
- [ ] Plan scaling thresholds

## 📞 Support Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [SendGrid Docs](https://docs.sendgrid.com/)

### Monitoring Dashboards
- Vercel: https://vercel.com/dashboard
- Supabase: https://app.supabase.com/
- SendGrid: https://app.sendgrid.com/

### Emergency Contacts
- Vercel Support: Enterprise plans only
- Supabase: Pro plan support
- SendGrid: Email/chat support

---

**Ready to deploy?** Start with the test environment and gradually move to production! 🚀