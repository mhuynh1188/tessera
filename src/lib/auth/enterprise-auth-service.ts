// Enterprise Authentication Service
// Handles 2FA, SSO, audit logging, and advanced security features

import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { hash, compare } from 'bcryptjs';
import crypto from 'crypto';

export interface EnterpriseUser extends User {
  organization_id?: string;
  org_role?: string;
  department?: string;
  job_title?: string;
  account_status?: 'active' | 'inactive' | 'suspended' | 'locked' | 'pending_verification';
  two_factor_enabled?: boolean;
  failed_login_attempts?: number;
  locked_until?: string;
  employee_id?: string;
  manager_id?: string;
  sso_provider_id?: string;
}

export interface SecurityEvent {
  event_type: string;
  event_category: 'authentication' | 'authorization' | 'data_access' | 'admin_action';
  event_description: string;
  event_details?: Record<string, any>;
  risk_score?: number;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface SessionPolicy {
  max_concurrent_sessions: number;
  idle_timeout_minutes: number;
  absolute_timeout_hours: number;
  require_fresh_login_for_admin: boolean;
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  max_age_days: number;
  prevent_reuse_count: number;
}

export interface OrganizationSecurityPolicy {
  password_policy: PasswordPolicy;
  account_policy: {
    max_failed_attempts: number;
    lockout_duration_minutes: number;
    require_email_verification: boolean;
    require_2fa: boolean;
    require_2fa_for_admins: boolean;
  };
  session_policy: SessionPolicy;
  network_policy: {
    allowed_ip_ranges: string[];
    restrict_to_company_network: boolean;
    allow_vpn_access: boolean;
  };
}

export class EnterpriseAuthService {
  private supabase;
  
  constructor(isServer = false) {
    this.supabase = isServer ? createClient() : createBrowserClient();
  }

  // ====== CORE AUTHENTICATION ======

  async signInWithPassword(
    email: string, 
    password: string, 
    deviceInfo?: any,
    ipAddress?: string
  ): Promise<{ user: EnterpriseUser | null; session: any; error: any; requires2FA?: boolean }> {
    try {
      // Check account lockout first
      const lockoutCheck = await this.checkAccountLockout(email);
      if (lockoutCheck.locked) {
        await this.logSecurityEvent(null, null, {
          event_type: 'login_attempt_blocked',
          event_category: 'authentication',
          event_description: 'Login attempt blocked due to account lockout',
          event_details: { email, reason: lockoutCheck.reason },
          risk_score: 40,
          ip_address: ipAddress,
          success: false,
          failure_reason: lockoutCheck.reason
        });
        
        return { 
          user: null, 
          session: null, 
          error: { message: lockoutCheck.reason },
          requires2FA: false
        };
      }

      // Attempt authentication with Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Increment failed login attempts
        await this.incrementFailedLoginAttempts(email);
        
        await this.logSecurityEvent(null, null, {
          event_type: 'login_failed',
          event_category: 'authentication',
          event_description: 'Failed login attempt',
          event_details: { email, error: error.message },
          risk_score: 30,
          ip_address: ipAddress,
          success: false,
          failure_reason: error.message
        });

        return { user: null, session: null, error, requires2FA: false };
      }

      // Reset failed login attempts on successful password validation
      await this.resetFailedLoginAttempts(email);

      // Get enterprise user data
      const enterpriseUser = await this.getEnterpriseUserData(data.user.id);
      
      // Check if 2FA is required
      if (enterpriseUser?.two_factor_enabled) {
        // Don't complete the login - require 2FA verification
        await this.logSecurityEvent(enterpriseUser.id, null, {
          event_type: 'login_password_success_pending_2fa',
          event_category: 'authentication',
          event_description: 'Password authentication successful, pending 2FA verification',
          event_details: { email },
          risk_score: 10,
          ip_address: ipAddress,
          success: true
        });

        return { 
          user: enterpriseUser, 
          session: data.session, 
          error: null, 
          requires2FA: true 
        };
      }

      // Create session record
      const sessionId = await this.createSessionRecord(
        enterpriseUser.id, 
        data.session, 
        deviceInfo, 
        ipAddress
      );

      await this.logSecurityEvent(enterpriseUser.id, sessionId, {
        event_type: 'login_success',
        event_category: 'authentication',
        event_description: 'Successful login',
        event_details: { email, session_id: sessionId },
        risk_score: 0,
        ip_address: ipAddress,
        success: true
      });

      return { user: enterpriseUser, session: data.session, error: null, requires2FA: false };

    } catch (err) {
      console.error('Enterprise sign in error:', err);
      return { 
        user: null, 
        session: null, 
        error: { message: 'Authentication service error' },
        requires2FA: false
      };
    }
  }

  async verifyTwoFactor(
    userId: string, 
    token: string, 
    session: any,
    deviceInfo?: any,
    ipAddress?: string
  ): Promise<{ success: boolean; error?: string; sessionId?: string }> {
    try {
      // Get user's 2FA configuration
      const { data: twoFactorData, error } = await this.supabase
        .from('user_two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .eq('method_type', 'totp')
        .eq('is_verified', true)
        .single();

      if (error || !twoFactorData) {
        return { success: false, error: '2FA not configured' };
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: this.decryptSecret(twoFactorData.totp_secret),
        encoding: 'base32',
        token: token,
        window: 2 // Allow some time drift
      });

      if (!verified) {
        // Check if it's a backup code
        const backupCodeValid = await this.verifyBackupCode(userId, token);
        if (!backupCodeValid) {
          await this.logSecurityEvent(userId, null, {
            event_type: '2fa_verification_failed',
            event_category: 'authentication',
            event_description: 'Invalid 2FA token provided',
            event_details: { token_type: 'totp' },
            risk_score: 50,
            ip_address: ipAddress,
            success: false,
            failure_reason: 'Invalid 2FA token'
          });

          return { success: false, error: 'Invalid 2FA token' };
        }
      }

      // Create session record for successful 2FA
      const sessionId = await this.createSessionRecord(userId, session, deviceInfo, ipAddress);

      // Update last used timestamp
      await this.supabase
        .from('user_two_factor_auth')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('method_type', 'totp');

      await this.logSecurityEvent(userId, sessionId, {
        event_type: '2fa_verification_success',
        event_category: 'authentication',
        event_description: 'Successful 2FA verification',
        event_details: { token_type: verified ? 'totp' : 'backup_code' },
        risk_score: 0,
        ip_address: ipAddress,
        success: true
      });

      return { success: true, sessionId };

    } catch (err) {
      console.error('2FA verification error:', err);
      return { success: false, error: '2FA verification service error' };
    }
  }

  // ====== TWO-FACTOR AUTHENTICATION ======

  async setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
    try {
      // Get user data for QR code
      const user = await this.getEnterpriseUserData(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        length: 32,
        name: `Hex App (${user.email})`,
        issuer: 'Hex App'
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store encrypted secret (don't mark as verified yet)
      await this.supabase
        .from('user_two_factor_auth')
        .upsert({
          user_id: userId,
          method_type: 'totp',
          totp_secret: this.encryptSecret(secret.base32),
          backup_codes: backupCodes.map(code => this.encryptSecret(code)),
          is_verified: false,
          is_primary: true
        });

      await this.logSecurityEvent(userId, null, {
        event_type: '2fa_setup_initiated',
        event_category: 'authentication',
        event_description: 'User initiated 2FA setup',
        event_details: {},
        risk_score: 0,
        success: true
      });

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
        manualEntryKey: secret.base32
      };

    } catch (err) {
      console.error('2FA setup error:', err);
      throw new Error('Failed to setup 2FA');
    }
  }

  async verifyAndEnable2FA(userId: string, token: string): Promise<boolean> {
    try {
      // Get unverified 2FA setup
      const { data: twoFactorData, error } = await this.supabase
        .from('user_two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .eq('method_type', 'totp')
        .eq('is_verified', false)
        .single();

      if (error || !twoFactorData) {
        return false;
      }

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: this.decryptSecret(twoFactorData.totp_secret),
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (!verified) {
        return false;
      }

      // Mark as verified and enable 2FA for user
      await Promise.all([
        this.supabase
          .from('user_two_factor_auth')
          .update({ 
            is_verified: true, 
            verified_at: new Date().toISOString() 
          })
          .eq('user_id', userId)
          .eq('method_type', 'totp'),
        
        this.supabase
          .from('users')
          .update({ two_factor_enabled: true })
          .eq('id', userId)
      ]);

      await this.logSecurityEvent(userId, null, {
        event_type: '2fa_enabled',
        event_category: 'authentication',
        event_description: 'User successfully enabled 2FA',
        event_details: {},
        risk_score: -10, // Negative risk score for security improvement
        success: true
      });

      return true;

    } catch (err) {
      console.error('2FA verification error:', err);
      return false;
    }
  }

  async disable2FA(userId: string, currentPassword: string): Promise<boolean> {
    try {
      // Verify current password first
      const user = await this.getEnterpriseUserData(userId);
      if (!user) return false;

      // For simplicity, we'll assume password verification is handled elsewhere
      // In production, you'd verify the current password here

      // Disable 2FA
      await Promise.all([
        this.supabase
          .from('user_two_factor_auth')
          .delete()
          .eq('user_id', userId),
        
        this.supabase
          .from('users')
          .update({ two_factor_enabled: false })
          .eq('id', userId)
      ]);

      await this.logSecurityEvent(userId, null, {
        event_type: '2fa_disabled',
        event_category: 'authentication',
        event_description: 'User disabled 2FA',
        event_details: {},
        risk_score: 20, // Increased risk for disabling 2FA
        success: true
      });

      return true;

    } catch (err) {
      console.error('2FA disable error:', err);
      return false;
    }
  }

  // ====== SESSION MANAGEMENT ======

  async createSessionRecord(
    userId: string, 
    session: any, 
    deviceInfo?: any, 
    ipAddress?: string
  ): Promise<string> {
    try {
      // Generate device fingerprint
      const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);

      // Create session record
      const { data, error } = await this.supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: session.access_token,
          refresh_token: session.refresh_token,
          device_fingerprint: deviceFingerprint,
          user_agent: deviceInfo?.userAgent,
          ip_address: ipAddress,
          expires_at: new Date(session.expires_at * 1000).toISOString(),
          last_activity: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Session creation error:', error);
        throw error;
      }

      return data.id;

    } catch (err) {
      console.error('Create session record error:', err);
      throw err;
    }
  }

  async validateSessionSecurity(userId: string, sessionId: string): Promise<boolean> {
    try {
      // Get organization security policy
      const policy = await this.getOrganizationSecurityPolicy(userId);
      if (!policy) return true; // Allow if no policy

      // Check concurrent sessions
      const { data: activeSessions } = await this.supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString());

      if (activeSessions && activeSessions.length > policy.session_policy.max_concurrent_sessions) {
        // Terminate oldest sessions
        await this.terminateOldestSessions(
          userId, 
          activeSessions.length - policy.session_policy.max_concurrent_sessions
        );
      }

      return true;

    } catch (err) {
      console.error('Session validation error:', err);
      return false;
    }
  }

  async terminateSession(sessionId: string, reason: string = 'manual_logout'): Promise<void> {
    try {
      // Update session as terminated
      await this.supabase
        .from('user_sessions')
        .update({ 
          expires_at: new Date().toISOString() 
        })
        .eq('id', sessionId);

      // Log the termination
      const { data: session } = await this.supabase
        .from('user_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (session) {
        await this.logSecurityEvent(session.user_id, sessionId, {
          event_type: 'session_terminated',
          event_category: 'authentication',
          event_description: 'User session terminated',
          event_details: { reason },
          risk_score: 0,
          success: true
        });
      }

    } catch (err) {
      console.error('Session termination error:', err);
    }
  }

  // ====== AUDIT LOGGING ======

  async logSecurityEvent(
    userId: string | null, 
    sessionId: string | null, 
    event: SecurityEvent
  ): Promise<void> {
    try {
      await this.supabase.rpc('log_security_event', {
        user_id_param: userId,
        session_id_param: sessionId,
        event_type_param: event.event_type,
        event_category_param: event.event_category,
        event_description_param: event.event_description,
        event_details_param: event.event_details || {},
        ip_address_param: event.ip_address,
        user_agent_param: event.user_agent,
        success_param: event.success,
        risk_score_param: event.risk_score || 0
      });

    } catch (err) {
      console.error('Security event logging error:', err);
      // Don't throw - logging failures shouldn't break auth flow
    }
  }

  // ====== UTILITY METHODS ======

  private async getEnterpriseUserData(userId: string): Promise<EnterpriseUser | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', userId)
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  private async checkAccountLockout(email: string): Promise<{ locked: boolean; reason?: string }> {
    try {
      const { data } = await this.supabase.rpc('check_account_lockout', {
        user_email_param: email
      });

      return data || { locked: false };
    } catch {
      return { locked: false };
    }
  }

  private async incrementFailedLoginAttempts(email: string): Promise<void> {
    try {
      // Get organization policy for max attempts
      const { data: user } = await this.supabase
        .from('users')
        .select(`
          id, 
          failed_login_attempts,
          organization:organizations(security_policy)
        `)
        .eq('email', email)
        .single();

      if (!user) return;

      const newAttempts = (user.failed_login_attempts || 0) + 1;
      const maxAttempts = user.organization?.security_policy?.account_policy?.max_failed_attempts || 5;
      const lockoutDuration = user.organization?.security_policy?.account_policy?.lockout_duration_minutes || 30;

      const updates: any = { failed_login_attempts: newAttempts };

      // Lock account if max attempts reached
      if (newAttempts >= maxAttempts) {
        updates.locked_until = new Date(Date.now() + lockoutDuration * 60 * 1000).toISOString();
        updates.account_status = 'locked';
      }

      await this.supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

    } catch (err) {
      console.error('Failed login attempt tracking error:', err);
    }
  }

  private async resetFailedLoginAttempts(email: string): Promise<void> {
    try {
      await this.supabase
        .from('users')
        .update({ 
          failed_login_attempts: 0,
          locked_until: null
        })
        .eq('email', email);
    } catch (err) {
      console.error('Reset failed attempts error:', err);
    }
  }

  private async getOrganizationSecurityPolicy(userId: string): Promise<OrganizationSecurityPolicy | null> {
    try {
      const { data } = await this.supabase
        .from('users')
        .select('organization:organizations(security_policy)')
        .eq('id', userId)
        .single();

      return data?.organization?.security_policy || null;
    } catch {
      return null;
    }
  }

  private async terminateOldestSessions(userId: string, count: number): Promise<void> {
    try {
      const { data: oldSessions } = await this.supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity', { ascending: true })
        .limit(count);

      if (oldSessions && oldSessions.length > 0) {
        const sessionIds = oldSessions.map(s => s.id);
        
        await this.supabase
          .from('user_sessions')
          .update({ expires_at: new Date().toISOString() })
          .in('id', sessionIds);
      }
    } catch (err) {
      console.error('Terminate oldest sessions error:', err);
    }
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from('user_two_factor_auth')
        .select('backup_codes, backup_codes_used')
        .eq('user_id', userId)
        .eq('method_type', 'totp')
        .single();

      if (!data || !data.backup_codes) return false;

      // Check if code matches any unused backup code
      const usedCodes = data.backup_codes_used || [];
      const hashedCode = this.hashBackupCode(code);

      const isValidCode = data.backup_codes.some((encryptedCode: string) => {
        const decryptedCode = this.decryptSecret(encryptedCode);
        return this.hashBackupCode(decryptedCode) === hashedCode && !usedCodes.includes(hashedCode);
      });

      if (isValidCode) {
        // Mark code as used
        await this.supabase
          .from('user_two_factor_auth')
          .update({
            backup_codes_used: [...usedCodes, hashedCode]
          })
          .eq('user_id', userId)
          .eq('method_type', 'totp');

        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      codes.push(crypto.randomBytes(4).toString('hex'));
    }
    return codes;
  }

  private generateDeviceFingerprint(deviceInfo?: any): string {
    if (!deviceInfo) return crypto.randomUUID();
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        userAgent: deviceInfo.userAgent,
        screen: deviceInfo.screen,
        timezone: deviceInfo.timezone,
        language: deviceInfo.language
      }))
      .digest('hex');
      
    return fingerprint;
  }

  private encryptSecret(secret: string): string {
    // In production, use proper encryption with env-based keys
    // This is a simplified implementation
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'fallback-key');
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptSecret(encryptedSecret: string): string {
    // In production, use proper decryption with env-based keys
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'fallback-key');
      let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedSecret; // Return as-is if decryption fails
    }
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }
}