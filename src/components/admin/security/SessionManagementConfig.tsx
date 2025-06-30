'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminGet, adminPost } from '@/lib/admin-api';
import { Clock, Monitor, Shield, AlertCircle, CheckCircle, LogOut, Lock } from 'lucide-react';

interface SessionConfig {
  max_concurrent_sessions: number;
  idle_timeout_minutes: number;
  absolute_timeout_hours: number;
  require_reauthentication_for_sensitive: boolean;
  terminate_on_password_change: boolean;
  secure_cookie_only: boolean;
}

interface SessionPolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  policy_config: SessionConfig;
  is_enabled: boolean;
  enforcement_level: string;
}

export default function SessionManagementConfig() {
  const [policy, setPolicy] = useState<SessionPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessionPolicy();
  }, []);

  const fetchSessionPolicy = async () => {
    try {
      setLoading(true);
      const response = await adminGet('/admin/security-policies/session');
      if (response.success) {
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error fetching session policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load session management policy',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof SessionConfig, value: any) => {
    if (!policy) return;
    
    setPolicy({
      ...policy,
      policy_config: {
        ...policy.policy_config,
        [key]: value
      }
    });
  };

  const handleSavePolicy = async () => {
    if (!policy) return;

    try {
      setSaving(true);
      const response = await adminPost('/admin/security-policies/session', {
        policy_config: policy.policy_config,
        is_enabled: policy.is_enabled,
        enforcement_level: policy.enforcement_level
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Session management policy updated successfully'
        });
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error saving session policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save session management policy',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getSecurityScore = () => {
    if (!policy) return 0;
    
    let score = 0;
    const config = policy.policy_config;
    
    // Scoring based on security best practices
    if (config.max_concurrent_sessions <= 3) score += 20;
    if (config.idle_timeout_minutes <= 30) score += 25;
    if (config.absolute_timeout_hours <= 8) score += 20;
    if (config.require_reauthentication_for_sensitive) score += 15;
    if (config.terminate_on_password_change) score += 10;
    if (config.secure_cookie_only) score += 10;
    
    return Math.min(score, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!policy) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Failed to load session management policy</p>
          <Button onClick={fetchSessionPolicy} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Clock className="h-6 w-6" />
            <span>Session Management</span>
          </h2>
          <p className="text-muted-foreground">Configure user session timeouts and security settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <Switch
            checked={policy.is_enabled}
            onCheckedChange={(checked) => setPolicy({ ...policy, is_enabled: checked })}
          />
          <Label>Session Policy Enabled</Label>
        </div>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Session Security Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    securityScore >= 80 ? 'bg-green-600' :
                    securityScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${securityScore}%` }}
                ></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{securityScore}%</div>
              <div className="text-sm text-muted-foreground">
                {securityScore >= 80 ? 'Secure' : securityScore >= 60 ? 'Moderate' : 'Needs Improvement'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>Session Limits</span>
            </CardTitle>
            <CardDescription>Control how many sessions users can have</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Maximum Concurrent Sessions</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.max_concurrent_sessions]}
                  onValueChange={(value) => handleConfigChange('max_concurrent_sessions', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.max_concurrent_sessions}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum number of active sessions per user across all devices
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timeout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Timeout Settings</span>
            </CardTitle>
            <CardDescription>Configure automatic session expiration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Idle Timeout (Minutes)</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.idle_timeout_minutes]}
                  onValueChange={(value) => handleConfigChange('idle_timeout_minutes', value[0])}
                  max={120}
                  min={5}
                  step={5}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.idle_timeout_minutes}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Time before inactive sessions are automatically logged out
              </p>
            </div>

            <div className="space-y-2">
              <Label>Absolute Timeout (Hours)</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.absolute_timeout_hours]}
                  onValueChange={(value) => handleConfigChange('absolute_timeout_hours', value[0])}
                  max={24}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.absolute_timeout_hours}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum session duration regardless of activity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Security Features</span>
            </CardTitle>
            <CardDescription>Additional session security measures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Re-authentication for Sensitive Actions</Label>
                <p className="text-sm text-muted-foreground">
                  Ask for password again for critical operations
                </p>
              </div>
              <Switch
                checked={policy.policy_config.require_reauthentication_for_sensitive}
                onCheckedChange={(checked) => handleConfigChange('require_reauthentication_for_sensitive', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Terminate Sessions on Password Change</Label>
                <p className="text-sm text-muted-foreground">
                  Log out all other sessions when password is changed
                </p>
              </div>
              <Switch
                checked={policy.policy_config.terminate_on_password_change}
                onCheckedChange={(checked) => handleConfigChange('terminate_on_password_change', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Secure Cookies Only</Label>
                <p className="text-sm text-muted-foreground">
                  Only send session cookies over HTTPS connections
                </p>
              </div>
              <Switch
                checked={policy.policy_config.secure_cookie_only}
                onCheckedChange={(checked) => handleConfigChange('secure_cookie_only', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enforcement Level */}
        <Card>
          <CardHeader>
            <CardTitle>Enforcement Level</CardTitle>
            <CardDescription>How strictly should session limits be enforced</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={policy.enforcement_level} 
              onValueChange={(value) => setPolicy({ ...policy, enforcement_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="required">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Strict - Enforce all limits</span>
                  </div>
                </SelectItem>
                <SelectItem value="recommended">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>Flexible - Allow some exceptions</span>
                  </div>
                </SelectItem>
                <SelectItem value="optional">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span>Advisory - Guidelines only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Session Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LogOut className="h-5 w-5" />
              <span>Session Configuration Summary</span>
            </CardTitle>
            <CardDescription>Current session management settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Sessions</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.max_concurrent_sessions}
                </div>
                <div className="text-sm text-muted-foreground">per user</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Idle Timeout</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.idle_timeout_minutes}m
                </div>
                <div className="text-sm text-muted-foreground">inactivity limit</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Duration</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.absolute_timeout_hours}h
                </div>
                <div className="text-sm text-muted-foreground">absolute limit</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Security Features</Label>
                <div className="text-2xl font-bold">
                  {[
                    policy.policy_config.require_reauthentication_for_sensitive,
                    policy.policy_config.terminate_on_password_change,
                    policy.policy_config.secure_cookie_only
                  ].filter(Boolean).length}/3
                </div>
                <div className="text-sm text-muted-foreground">enabled</div>
              </div>
            </div>

            {/* Visual indicators */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Re-authentication for sensitive actions:</span>
                <div className="flex items-center space-x-1">
                  {policy.policy_config.require_reauthentication_for_sensitive ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{policy.policy_config.require_reauthentication_for_sensitive ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Terminate sessions on password change:</span>
                <div className="flex items-center space-x-1">
                  {policy.policy_config.terminate_on_password_change ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{policy.policy_config.terminate_on_password_change ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Secure cookies only:</span>
                <div className="flex items-center space-x-1">
                  {policy.policy_config.secure_cookie_only ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{policy.policy_config.secure_cookie_only ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSavePolicy} 
          disabled={saving}
          className="min-w-32"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : null}
          {saving ? 'Saving...' : 'Save Policy'}
        </Button>
      </div>
    </div>
  );
}