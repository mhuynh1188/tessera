'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  LogOut, 
  Crown, 
  ChevronDown,
  Briefcase,
  CreditCard
} from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/auth';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  subscription_status: 'active' | 'inactive' | 'trial' | 'past_due';
}

export default function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium': return <Crown className="w-3 h-3" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Link 
          href="/auth/login"
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/auth/register"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        
        {/* User Info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {user.name || 'Unnamed User'}
          </p>
          <div className="flex items-center space-x-1">
            <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${getTierBadgeColor(user.subscription_tier)}`}>
              {getTierIcon(user.subscription_tier)}
              <span className="ml-1">{user.subscription_tier}</span>
            </span>
          </div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTierBadgeColor(user.subscription_tier)}`}>
                  {getTierIcon(user.subscription_tier)}
                  <span className="ml-1">{user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)}</span>
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                  user.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {user.subscription_status.charAt(0).toUpperCase() + user.subscription_status.slice(1)}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/workspace"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Briefcase className="w-4 h-4" />
                <span>My Workspace</span>
              </Link>

              <Link
                href="/profile"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                <span>Profile Settings</span>
              </Link>

              {user.subscription_tier === 'free' && (
                <Link
                  href="/profile?tab=subscription"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade Plan</span>
                </Link>
              )}

              <Link
                href="/profile?tab=subscription"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="w-4 h-4" />
                <span>Billing</span>
              </Link>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}