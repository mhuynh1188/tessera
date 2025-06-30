'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Settings, 
  Camera, 
  Save, 
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Bell,
  Palette,
  CreditCard,
  Trash2,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { getCurrentUser, updateUser, changePassword } from '@/lib/auth';
import { validateInput, signUpSchema } from '@/lib/validation';
import { z } from 'zod';

// Profile update schema
const profileUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .transform((name) => name.trim()),
  email: z.string()
    .email('Invalid email address')
    .transform((email) => email.toLowerCase().trim()),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]).{8,}$/, 
      'Password must contain at least one lowercase letter, uppercase letter, number, and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  subscription_status: 'active' | 'inactive' | 'trial' | 'past_due';
  two_factor_enabled: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    browser: boolean;
    workspace_invites: boolean;
    collaboration_updates: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'private';
    activity_tracking: boolean;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'auto',
    notifications: {
      email: true,
      browser: true,
      workspace_invites: true,
      collaboration_updates: true,
    },
    privacy: {
      profile_visibility: 'private',
      activity_tracking: true,
    },
  });

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        setUser(currentUser);
        setProfileForm({
          name: currentUser.name || '',
          email: currentUser.email,
        });

        // Load user preferences from localStorage as fallback
        const savedPrefs = localStorage.getItem(`user-preferences-${currentUser.id}`);
        if (savedPrefs) {
          setPreferences(JSON.parse(savedPrefs));
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  // Save profile changes
  const handleProfileSave = async () => {
    if (!user) return;

    const validation = validateInput(profileUpdateSchema, profileForm);
    if (!validation.success) {
      toast.error(validation.error);
      return;
    }

    setSaving(true);
    try {
      await updateUser(user.id, validation.data);
      setUser({ ...user, ...validation.data });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handlePasswordChange = async () => {
    const validation = validateInput(passwordChangeSchema, passwordForm);
    if (!validation.success) {
      toast.error(validation.error);
      return;
    }

    setSaving(true);
    try {
      await changePassword(validation.data.currentPassword, validation.data.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Password change failed:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Save preferences
  const handlePreferencesSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Save to localStorage for now (could be extended to database)
      localStorage.setItem(`user-preferences-${user.id}`, JSON.stringify(preferences));
      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-yellow-100 text-yellow-800';
      case 'past_due': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
                    <Camera className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Unnamed User'}</h1>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTierBadgeColor(user.subscription_tier)}`}>
                      {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.subscription_status)}`}>
                      {user.subscription_status.charAt(0).toUpperCase() + user.subscription_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/workspace')}
                variant="outline"
              >
                Back to Workspace
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', name: 'Profile', icon: User },
              { id: 'security', name: 'Security', icon: Shield },
              { id: 'preferences', name: 'Preferences', icon: Settings },
              { id: 'subscription', name: 'Subscription', icon: CreditCard },
            ].map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={saving}>
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View your account details and membership information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Member Since</p>
                    <p className="text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Login</p>
                    <p className="text-sm text-gray-900">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Change Password</span>
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handlePasswordChange} disabled={saving}>
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Two-Factor Authentication</span>
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Authenticator App</h4>
                    <p className="text-sm text-gray-500">
                      {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    {user.two_factor_enabled ? 'Disable' : 'Setup'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Two-factor authentication setup is coming soon.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Theme & Appearance</span>
                </CardTitle>
                <CardDescription>
                  Customize how Hexies looks and feels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', name: 'Light', desc: 'Clean and bright' },
                      { id: 'dark', name: 'Dark', desc: 'Easy on the eyes' },
                      { id: 'auto', name: 'Auto', desc: 'Follows system' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setPreferences({ ...preferences, theme: theme.id as any })}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          preferences.theme === theme.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{theme.name}</div>
                        <div className="text-xs text-gray-500">{theme.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription>
                  Choose what notifications you'd like to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'browser', label: 'Browser Notifications', desc: 'Show notifications in your browser' },
                  { key: 'workspace_invites', label: 'Workspace Invites', desc: 'Get notified of workspace invitations' },
                  { key: 'collaboration_updates', label: 'Collaboration Updates', desc: 'Updates when others edit your workspace' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{label}</h4>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifications[key as keyof typeof preferences.notifications]}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        notifications: {
                          ...preferences.notifications,
                          [key]: e.target.checked,
                        },
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handlePreferencesSave} disabled={saving}>
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Current Plan</span>
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold capitalize">{user.subscription_tier} Plan</h3>
                    <p className="text-sm text-gray-600">
                      Status: <span className="capitalize">{user.subscription_status}</span>
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Upgrade Plan
                  </Button>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Plan Features</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {user.subscription_tier === 'free' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>1 workspace</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>10 hexies maximum</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>2 collaborators</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>100MB storage</span>
                        </div>
                      </>
                    )}
                    {user.subscription_tier === 'basic' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>5 workspaces</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>50 hexies per workspace</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>10 collaborators</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>1GB storage</span>
                        </div>
                      </>
                    )}
                    {user.subscription_tier === 'premium' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Unlimited workspaces</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Unlimited hexies</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Unlimited collaborators</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>10GB storage</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-4">
                  Subscription management and billing features are coming soon.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Account</span>
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">This action cannot be undone</h4>
                      <p className="text-sm text-red-700 mt-1">
                        This will permanently delete your account, workspaces, and all associated data.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" disabled>
                    Delete Account
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Account deletion is currently disabled. Contact support for assistance.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}