// Enhanced Email Service with comprehensive email capabilities
import sgMail from '@sendgrid/mail';
import { db } from '@/lib/supabase';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email interfaces
export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
  priority?: number;
  scheduledFor?: Date;
  templateVariables?: Record<string, any>;
}

export interface EmailCampaign {
  name: string;
  templateId: string;
  targetCriteria: Record<string, any>;
  scheduledAt?: Date;
  isRecurring?: boolean;
  recurrencePattern?: Record<string, any>;
}

export interface AnalyticsReportConfig {
  name: string;
  reportType: 'organizational_health' | 'department_metrics' | 'user_engagement' | 'pattern_analysis' | 'intervention_effectiveness' | 'custom';
  recipientEmails: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dateRangeType: 'relative' | 'fixed';
  dateRangeValue?: string;
  filters?: Record<string, any>;
  includeCharts?: boolean;
  format?: 'html' | 'pdf' | 'both';
}

export interface PaymentNotificationData {
  email: string;
  userName: string;
  amount: string;
  planName: string;
  transactionId: string;
  paymentDate: string;
  nextBillingDate: string;
}

export interface AccountCreationData {
  email: string;
  userName: string;
  organizationName?: string;
  activationLink?: string;
  temporaryPassword?: string;
}

export interface LoginNotificationData {
  email: string;
  userName: string;
  loginTime: string;
  ipAddress: string;
  deviceInfo: string;
  location?: string;
}

export class EnhancedEmailService {
  private static instance: EnhancedEmailService;
  private fromEmail: string;
  private fromName: string;

  private constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@tessera.app';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Tessera Team';
  }

  public static getInstance(): EnhancedEmailService {
    if (!EnhancedEmailService.instance) {
      EnhancedEmailService.instance = new EnhancedEmailService();
    }
    return EnhancedEmailService.instance;
  }

  // Core email sending method
  private async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('📧 [DEV MODE] Email would be sent:', template);
        return true;
      }

      const msg = {
        to: template.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: template.subject,
        html: template.html,
        text: template.text || template.html.replace(/<[^>]*>/g, ''),
      };

      await sgMail.send(msg);
      console.log(`📧 Email sent successfully to ${template.to}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  // Queue email for later processing
  async queueEmail(
    templateName: string,
    recipientEmail: string,
    recipientName: string,
    subject: string,
    templateVariables: Record<string, any> = {},
    options: {
      userId?: string;
      organizationId?: string;
      priority?: number;
      scheduledFor?: Date;
    } = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await db.client
        .rpc('queue_email', {
          p_template_name: templateName,
          p_recipient_email: recipientEmail,
          p_recipient_name: recipientName,
          p_subject: subject,
          p_template_variables: templateVariables,
          p_user_id: options.userId,
          p_organization_id: options.organizationId,
          p_priority: options.priority || 5,
          p_scheduled_for: options.scheduledFor?.toISOString() || new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to queue email:', error);
      return null;
    }
  }

  // Payment confirmation email
  async sendPaymentConfirmation(data: PaymentNotificationData): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.email,
      subject: `Payment Confirmation - ${data.amount} for ${data.planName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Confirmation</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Payment Confirmed</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${data.userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              Thank you for your payment! Your subscription has been successfully updated.
            </p>
            
            <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 25px; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #28a745;">💳 Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 10px 0; font-weight: bold;">Amount:</td>
                  <td style="padding: 10px 0; text-align: right;">${data.amount}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 10px 0; font-weight: bold;">Plan:</td>
                  <td style="padding: 10px 0; text-align: right;">${data.planName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 10px 0; font-weight: bold;">Payment Date:</td>
                  <td style="padding: 10px 0; text-align: right;">${data.paymentDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 10px 0; font-weight: bold;">Transaction ID:</td>
                  <td style="padding: 10px 0; text-align: right; font-family: monospace;">${data.transactionId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold;">Next Billing:</td>
                  <td style="padding: 10px 0; text-align: right;">${data.nextBillingDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #155724;">
                <strong>🎉 Account Updated:</strong> You now have access to all ${data.planName} features including advanced analytics, unlimited workspaces, and priority support.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Access Your Account
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 0;">
              Questions about your billing? Reply to this email or contact our support team.
            </p>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  // Account creation notification
  async sendAccountCreated(data: AccountCreationData): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.email,
      subject: 'Welcome to Tessera - Account Created Successfully',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Account Created</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome to Tessera!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${data.userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              Your Tessera account has been successfully created! ${data.organizationName ? `You've been added to the ${data.organizationName} organization.` : 'You can now start exploring behavioral pattern analysis.'}
            </p>
            
            ${data.temporaryPassword ? `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #856404;">🔑 Temporary Login Credentials</h3>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${data.temporaryPassword}</code></p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
                <strong>Important:</strong> Please change your password after your first login for security.
              </p>
            </div>
            ` : ''}
            
            <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #667eea;">🚀 What's Next:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Complete your profile setup</li>
                <li>Explore the interactive hexagon workspace</li>
                <li>Try scenario-based learning modules</li>
                <li>Invite your team members to collaborate</li>
                ${data.organizationName ? '<li>Access your organization\'s analytics dashboard</li>' : ''}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              ${data.activationLink ? `
              <a href="${data.activationLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
                Activate Account
              </a>
              ` : ''}
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Login to Tessera
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 0;">
              Need help getting started? Reply to this email or check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/help" style="color: #667eea;">help center</a>.
            </p>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  // Login notification with OTP
  async sendLoginNotification(data: LoginNotificationData): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.email,
      subject: 'New Login to Your Tessera Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Login Notification</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Account Login</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${data.userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              We detected a new login to your Tessera account. Here are the details:
            </p>
            
            <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #17a2b8;">📊 Login Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 8px 0; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0;">${data.loginTime}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 8px 0; font-weight: bold;">IP Address:</td>
                  <td style="padding: 8px 0; font-family: monospace;">${data.ipAddress}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 8px 0; font-weight: bold;">Device:</td>
                  <td style="padding: 8px 0;">${data.deviceInfo}</td>
                </tr>
                ${data.location ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0;">${data.location}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #0c5460;">
                <strong>Security Check:</strong> If this was you, no action is needed. If you don't recognize this login, please secure your account immediately.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/security" style="background: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
                Secure Account
              </a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #17a2b8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 0;">
              This is an automated security notification. If you have concerns, contact our support team.
            </p>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  // Analytics report email
  async sendAnalyticsReport(
    recipientEmail: string,
    reportData: Record<string, any>,
    organizationName: string,
    reportPeriod: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: recipientEmail,
      subject: `Weekly Analytics Report - ${organizationName} (${reportPeriod})`,
      html: this.generateAnalyticsReportHTML(reportData, organizationName, reportPeriod)
    };

    return this.sendEmail(template);
  }

  // Generate analytics report HTML
  private generateAnalyticsReportHTML(
    data: Record<string, any>,
    organizationName: string,
    reportPeriod: string
  ): string {
    const departmentMetricsHTML = data.departmentMetrics ? 
      data.departmentMetrics.map((dept: any) => `
        <div style="border-bottom: 1px solid #e9ecef; padding: 15px 0;">
          <h4 style="margin: 0; color: #333;">${dept.department}</h4>
          <p style="margin: 5px 0; color: #6c757d;">
            Participation: ${dept.participationRate}% | 
            Avg Severity: ${dept.avgSeverity} | 
            Sessions: ${dept.sessionCount}
          </p>
        </div>
      `).join('') : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Analytics Report</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">📊 Weekly Analytics Report</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">${organizationName} - ${reportPeriod}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">📈 Executive Summary</h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
            <div style="background: white; padding: 25px; border-radius: 12px; border-left: 4px solid #28a745; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="margin: 0; color: #28a745; font-size: 16px;">👥 Active Users</h3>
              <p style="font-size: 28px; margin: 10px 0; font-weight: bold; color: #333;">${data.activeUsers || 0}</p>
              <p style="margin: 0; color: #6c757d; font-size: 14px;">${data.activeUsersChange || '+0%'} from last week</p>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; border-left: 4px solid #007bff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="margin: 0; color: #007bff; font-size: 16px;">🎯 Total Sessions</h3>
              <p style="font-size: 28px; margin: 10px 0; font-weight: bold; color: #333;">${data.totalSessions || 0}</p>
              <p style="margin: 0; color: #6c757d; font-size: 14px;">${data.sessionsChange || '+0%'} from last week</p>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; border-left: 4px solid #ffc107; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="margin: 0; color: #e07c00; font-size: 16px;">⚠️ Avg Severity</h3>
              <p style="font-size: 28px; margin: 10px 0; font-weight: bold; color: #333;">${data.avgSeverity || '0.0'}</p>
              <p style="margin: 0; color: #6c757d; font-size: 14px;">${data.severityChange || '+0%'} from last week</p>
            </div>
          </div>
          
          ${departmentMetricsHTML ? `
          <h2 style="color: #333; margin-top: 40px;">🏢 Department Breakdown</h2>
          <div style="background: white; padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${departmentMetricsHTML}
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 30px 0; border-radius: 6px;">
            <h3 style="margin-top: 0; color: #1976d2;">💡 Key Insights</h3>
            <ul style="margin: 0; color: #333;">
              ${data.insights ? data.insights.map((insight: string) => `<li style="margin: 8px 0;">${insight}</li>`).join('') : '<li>No specific insights to report this week.</li>'}
            </ul>
          </div>
          
          <div style="margin: 40px 0; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/analytics" style="background: #667eea; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              📊 View Full Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 0;">
            This report was automatically generated. To modify your email preferences, 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences" style="color: #667eea;">click here</a>.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Create email campaign
  async createCampaign(campaign: EmailCampaign, organizationId: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await db.client
        .from('email_campaigns')
        .insert({
          organization_id: organizationId,
          created_by: userId,
          name: campaign.name,
          template_id: campaign.templateId,
          target_criteria: campaign.targetCriteria,
          scheduled_at: campaign.scheduledAt?.toISOString(),
          recurrence_pattern: campaign.recurrencePattern || {},
          schedule_type: campaign.scheduledAt ? 'scheduled' : 'immediate',
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to create email campaign:', error);
      return null;
    }
  }

  // Create analytics report configuration
  async createAnalyticsReport(config: AnalyticsReportConfig, organizationId: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await db.client
        .from('email_analytics_reports')
        .insert({
          organization_id: organizationId,
          created_by: userId,
          name: config.name,
          report_type: config.reportType,
          recipient_emails: config.recipientEmails,
          frequency: config.frequency,
          date_range_type: config.dateRangeType,
          date_range_value: config.dateRangeValue,
          custom_filters: config.filters || {},
          include_charts: config.includeCharts ?? true,
          format: config.format || 'html',
          is_enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule the first run
      await db.client.rpc('schedule_next_analytics_report', { p_report_id: data.id });

      return data.id;
    } catch (error) {
      console.error('Failed to create analytics report:', error);
      return null;
    }
  }

  // Get user email preferences
  async getUserEmailPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await db.client
        .from('email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Failed to get email preferences:', error);
      return null;
    }
  }

  // Update user email preferences
  async updateEmailPreferences(userId: string, preferences: Partial<any>): Promise<boolean> {
    try {
      const { error } = await db.client
        .from('email_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update email preferences:', error);
      return false;
    }
  }

  // Process pending emails (to be called by a cron job)
  async processPendingEmails(): Promise<void> {
    try {
      const { data: pendingEmails, error } = await db.client
        .from('email_notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      for (const email of pendingEmails || []) {
        await this.processQueuedEmail(email);
      }
    } catch (error) {
      console.error('Failed to process pending emails:', error);
    }
  }

  // Process a single queued email
  private async processQueuedEmail(queuedEmail: any): Promise<void> {
    try {
      // Update status to sending
      await db.client
        .from('email_notifications')
        .update({ status: 'sending' })
        .eq('id', queuedEmail.id);

      // Get template if specified
      let emailHTML = queuedEmail.body_html;
      if (!emailHTML && queuedEmail.template_name) {
        emailHTML = await this.getTemplateHTML(queuedEmail.template_name, queuedEmail.template_variables);
      }

      const template: EmailTemplate = {
        to: queuedEmail.recipient_email,
        subject: queuedEmail.subject,
        html: emailHTML || '',
        text: queuedEmail.body_text
      };

      const success = await this.sendEmail(template);

      // Update status based on result
      await db.client
        .from('email_notifications')
        .update({
          status: success ? 'sent' : 'failed',
          sent_at: success ? new Date().toISOString() : null,
          error_message: success ? null : 'Failed to send email',
          retry_count: success ? queuedEmail.retry_count : queuedEmail.retry_count + 1
        })
        .eq('id', queuedEmail.id);

    } catch (error) {
      console.error(`Failed to process queued email ${queuedEmail.id}:`, error);
      
      await db.client
        .from('email_notifications')
        .update({
          status: 'failed',
          error_message: error.message,
          retry_count: queuedEmail.retry_count + 1
        })
        .eq('id', queuedEmail.id);
    }
  }

  // Get template HTML with variable substitution
  private async getTemplateHTML(templateName: string, variables: Record<string, any>): Promise<string> {
    try {
      const { data: template, error } = await db.client
        .from('email_templates')
        .select('html_template, variables')
        .eq('name', templateName)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      let html = template.html_template;

      // Simple variable substitution
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, String(value));
      }

      return html;
    } catch (error) {
      console.error(`Failed to get template ${templateName}:`, error);
      return '';
    }
  }
}

// Export singleton instance
export const enhancedEmailService = EnhancedEmailService.getInstance();