'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [devModeBypass, setDevModeBypass] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check if dev mode bypass is enabled in localStorage
    const bypassEnabled = localStorage.getItem('admin_dev_bypass') === 'true';
    if (bypassEnabled) {
      setDevModeBypass(true);
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Check if user has admin permissions
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (orgMember && ['admin', 'owner'].includes(orgMember.role)) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Check admin permissions after login
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (orgMember && ['admin', 'owner'].includes(orgMember.role)) {
          setIsAuthenticated(true);
        } else {
          setError('Access denied. Admin privileges required.');
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>
              Sign in with admin credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoggingIn}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoggingIn}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            {/* Development bypass - remove in production */}
            <div className="mt-6 pt-6 border-t">
              <div className="text-center text-sm text-gray-500 mb-2">
                Development Mode
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  localStorage.setItem('admin_dev_bypass', 'true');
                  setDevModeBypass(true);
                  setIsAuthenticated(true);
                }}
              >
                Bypass Auth (Dev Only)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">Admin Dashboard</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}