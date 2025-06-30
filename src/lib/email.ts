// Email service using SendGrid
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface OTPEmailData {
  email: string;
  otp: string;
  userName?: string;
  expiryMinutes?: number;
}

export interface WelcomeEmailData {
  email: string;
  userName: string;
  verificationLink?: string;
}

export interface PasswordResetData {
  email: string;
  userName: string;
  resetLink: string;
  expiryHours?: number;
}

export interface CollaborationInviteData {
  email: string;
  inviterName: string;
  workspaceName: string;
  inviteLink: string;
}

export class EmailService {
  private static instance: EmailService;
  private fromEmail: string;
  private fromName: string;

  private constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@tessera.app';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Tessera Team';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

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
        text: template.text || template.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      await sgMail.send(msg);
      console.log(`📧 Email sent successfully to ${template.to}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  // OTP Email for authentication
  async sendOTPEmail(data: OTPEmailData): Promise<boolean> {
    const { email, otp, userName = 'User', expiryMinutes = 10 } = data;
    
    const template: EmailTemplate = {
      to: email,
      subject: 'Your Tessera Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tessera Verification Code</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Verification Code</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              Here's your verification code for Tessera:
            </p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 20px;">
              ⏰ This code expires in ${expiryMinutes} minutes
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>Security tip:</strong> Never share this code with anyone. Tessera will never ask for your verification code via email or phone.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 0;">
              If you didn't request this code, please ignore this email or contact support.
            </p>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  // Welcome email for new users
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const { email, userName, verificationLink } = data;
    
    const template: EmailTemplate = {
      to: email,
      subject: 'Welcome to Tessera! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Tessera</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome to Tessera!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              Welcome to Tessera! We're excited to have you join our community of pattern recognition experts and facilitators.
            </p>
            
            <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #667eea;">🚀 Get Started:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Explore the interactive hexagon workspace</li>
                <li>Try our scenario-based learning modules</li>
                <li>Create custom tessera patterns</li>
                <li>Collaborate with your team in real-time</li>
              </ul>
            </div>
            
            ${verificationLink ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Verify Your Account
              </a>
            </div>
            ` : ''}
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 0;">
              Need help? Reply to this email or contact our support team.
            </p>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  // Password reset email
  async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    const { email, userName, resetLink, expiryHours = 24 } = data;
    
    const template: EmailTemplate = {
      to: email,
      subject: 'Reset Your Tessera Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Password Reset</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              We received a request to reset your Tessera password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 20px;">
              ⏰ This link expires in ${expiryHours} hours
            </p>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #721c24;">
                <strong>Security note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 0;">
              Need help? Contact our support team for assistance.
            </p>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  // Collaboration invite email
  async sendCollaborationInvite(data: CollaborationInviteData): Promise<boolean> {
    const { email, inviterName, workspaceName, inviteLink } = data;
    
    const template: EmailTemplate = {
      to: email,
      subject: `${inviterName} invited you to collaborate on Tessera`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Collaboration Invite</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🤝 Collaboration Invite</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="font-size: 18px; margin-bottom: 20px;">You're Invited!</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              <strong>${inviterName}</strong> has invited you to collaborate on the workspace <strong>"${workspaceName}"</strong> in Tessera.
            </p>
            
            <div style="background: white; border-left: 4px solid #4facfe; padding: 20px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #4facfe;">🎯 What you can do:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Collaborate in real-time on hexagon patterns</li>
                <li>Share insights and annotations</li>
                <li>Participate in scenario-based sessions</li>
                <li>Contribute to pattern recognition activities</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background: #4facfe; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Join Workspace
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 0;">
              New to Tessera? No problem! You'll be guided through the setup process.
            </p>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  // Generic notification email
  async sendNotification(to: string, subject: string, message: string): Promise<boolean> {
    const template: EmailTemplate = {
      to,
      subject: `Tessera: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${subject}</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <div style="font-size: 16px;">
              ${message}
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 0;">
              This is an automated message from Tessera.
            </p>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();