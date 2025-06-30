import { supabase, supabaseAdmin } from './supabase';
import { User, AuthFormData } from '@/types';
import { config } from './config';

export class AuthService {
  // Sign up new user
  async signUp(userData: AuthFormData) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password!,
      options: {
        data: {
          name: userData.name,
        },
        emailRedirectTo: undefined, // Disable email confirmation for development
      },
    });

    if (error) throw error;

    // Auto-confirm user ONLY in development environment (bypass email verification)
    if (data.user && !data.user.email_confirmed_at && supabaseAdmin && process.env.NODE_ENV === 'development') {
      try {
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
          email_confirm: true
        });
        console.log('Development mode: Auto-confirmed user email');
      } catch (confirmError) {
        console.warn('Could not auto-confirm user:', confirmError);
      }
    }

    // Create user profile in our custom users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: userData.name,
            subscription_tier: 'free',
            subscription_status: 'trial',
            two_factor_enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
        console.error('Profile creation error:', profileError);
      }
    }

    return data;
  }

  // Sign in user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Update last login
    if (data.user) {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return data;
  }

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Get current session
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  // Get current user with profile
  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.app.url}/auth/reset-password`,
    });

    if (error) throw error;
  }

  // Update password
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
  }

  // OAuth sign in
  async signInWithProvider(provider: 'google' | 'github') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${config.app.url}/auth/callback`,
      },
    });

    if (error) throw error;
  }

  // Check if user has access to subscription tier
  hasSubscriptionAccess(userTier: string, requiredTier: string): boolean {
    const tierHierarchy = { free: 0, basic: 1, premium: 2 };
    return tierHierarchy[userTier as keyof typeof tierHierarchy] >= 
           tierHierarchy[requiredTier as keyof typeof tierHierarchy];
  }

  // Get subscription limits for user
  getSubscriptionLimits(tier: 'free' | 'basic' | 'premium') {
    return config.limits[tier];
  }

  // Validate session and get user
  async validateSession() {
    try {
      const session = await this.getSession();
      if (!session) return null;

      const user = await this.getCurrentUser();
      return { session, user };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  // Check if email exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      if (!supabaseAdmin) return false;
      
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      
      return data.users.some(user => user.email === email);
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  }

  // Admin functions
  async createUserAsAdmin(userData: {
    email: string;
    password: string;
    name: string;
    subscription_tier: 'free' | 'basic' | 'premium';
  }) {
    if (!supabaseAdmin) throw new Error('Admin client not available');

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        name: userData.name,
      },
      email_confirm: true,
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: userData.name,
            subscription_tier: userData.subscription_tier,
            subscription_status: 'active',
            two_factor_enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return data;
  }
}

export const authService = new AuthService();

// Exported convenience functions for use in components
export const signUp = (userData: any) => authService.signUp(userData);
export const signIn = (email: string, password: string) => authService.signIn(email, password);
export const signOut = () => authService.signOut();
export const getCurrentUser = () => authService.getCurrentUser();
export const getSession = () => authService.getSession();

// Update user profile
export const updateUser = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Change password
export const changePassword = async (currentPassword: string, newPassword: string) => {
  // First verify current password by attempting to sign in
  const session = await getSession();
  if (!session?.user?.email) {
    throw new Error('No active session');
  }

  // Verify current password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: session.user.email,
    password: currentPassword,
  });

  if (verifyError) {
    throw new Error('Current password is incorrect');
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return true;
};