'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { adminGet, adminPost } from '@/lib/admin-api';
import { Shield, Smartphone, Mail, Key, AlertCircle, CheckCircle, Users, Clock } from 'lucide-react';

interface MFAConfig {
  required_for_admins: boolean;
  required_for_all_users: boolean;
  allowed_methods: string[];
  backup_codes_enabled: boolean;
  grace_period_days: number;
  remember_device_days: number;
}

interface MFAPolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  policy_config: MFAConfig;
  is_enabled: boolean;
  enforcement_level: string;
}

const MFA_METHODS = [
  { id: 'totp', name: 'Authenticator App (TOTP)', icon: Smartphone, description: 'Google Authenticator, Authy, etc.' },
  { id: 'sms', name: 'SMS Text Message', icon: Smartphone, description: 'Text message to phone number' },
  { id: 'email', name: 'Email Code', icon: Mail, description: 'Code sent to email address' },
  { id: 'hardware', name: 'Hardware Token', icon: Key, description: 'Physical security keys (YubiKey, etc.)' }
];

export default function MFAConfig() {
  const [policy, setPolicy] = useState<MFAPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMFAPolicy();
  }, []);

  const fetchMFAPolicy = async () => {
    try {
      setLoading(true);
      const response = await adminGet('/admin/security-policies/mfa');
      if (response.success) {
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error fetching MFA policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load MFA policy configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof MFAConfig, value: any) => {
    if (!policy) return;
    
    setPolicy({
      ...policy,
      policy_config: {
        ...policy.policy_config,
        [key]: value
      }
    });
  };

  const handleMethodToggle = (methodId: string, enabled: boolean) => {
    if (!policy) return;
    
    const currentMethods = policy.policy_config.allowed_methods;
    let newMethods;
    
    if (enabled) {
      newMethods = [...currentMethods, methodId];
    } else {
      newMethods = currentMethods.filter(method => method !== methodId);
    }
    
    handleConfigChange('allowed_methods', newMethods);
  };

  const handleSavePolicy = async () => {
    if (!policy) return;

    try {
      setSaving(true);
      const response = await adminPost('/admin/security-policies/mfa', {
        policy_config: policy.policy_config,
        is_enabled: policy.is_enabled,
        enforcement_level: policy.enforcement_level
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'MFA policy updated successfully'
        });
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error saving MFA policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save MFA policy',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getSecurityLevel = () => {
    if (!policy) return 0;
    
    let score = 0;
    const config = policy.policy_config;
    
    if (config.required_for_admins) score += 30;
    if (config.required_for_all_users) score += 40;
    if (config.allowed_methods.length >= 2) score += 20;
    if (config.backup_codes_enabled) score += 10;
    
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
          <p className="text-muted-foreground">Failed to load MFA policy</p>
          <Button onClick={fetchMFAPolicy} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const securityLevel = getSecurityLevel();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Multi-Factor Authentication</span>
          </h2>
          <p className="text-muted-foreground">Configure MFA requirements and available methods</p>
        </div>
        <div className="flex items-center space-x-4">
          <Switch
            checked={policy.is_enabled}
            onCheckedChange={(checked) => setPolicy({ ...policy, is_enabled: checked })}
          />
          <Label>MFA Policy Enabled</Label>
        </div>
      </div>

      {/* Security Level Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Level</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    securityLevel >= 80 ? 'bg-green-600' :
                    securityLevel >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${securityLevel}%` }}
                ></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{securityLevel}%</div>
              <div className="text-sm text-muted-foreground">
                {securityLevel >= 80 ? 'High Security' : securityLevel >= 60 ? 'Medium Security' : 'Basic Security'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Requirements</span>
            </CardTitle>
            <CardDescription>Define who must use MFA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Required for Administrators</Label>
                <p className="text-sm text-muted-foreground">All admin users must enable MFA</p>
              </div>
              <Switch
                checked={policy.policy_config.required_for_admins}
                onCheckedChange={(checked) => handleConfigChange('required_for_admins', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Required for All Users</Label>
                <p className="text-sm text-muted-foreground">All users must enable MFA</p>
              </div>
              <Switch
                checked={policy.policy_config.required_for_all_users}
                onCheckedChange={(checked) => handleConfigChange('required_for_all_users', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Grace Period (Days)</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.grace_period_days]}
                  onValueChange={(value) => handleConfigChange('grace_period_days', value[0])}
                  max={30}
                  min={0}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.grace_period_days}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Days users have to set up MFA after requirement is enabled
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Available Methods</CardTitle>
            <CardDescription>Select which MFA methods users can use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MFA_METHODS.map((method) => {
              const IconComponent = method.icon;
              const isEnabled = policy.policy_config.allowed_methods.includes(method.id);
              
              return (
                <div key={method.id} className="flex items-start space-x-3">
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleMethodToggle(method.id, !!checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <Label className="font-medium">{method.name}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Session Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Session Settings</span>
            </CardTitle>
            <CardDescription>Configure device trust and session behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Remember Device (Days)</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.remember_device_days]}
                  onValueChange={(value) => handleConfigChange('remember_device_days', value[0])}
                  max={90}
                  min={0}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.remember_device_days}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                How long to trust a device before requiring MFA again (0 = always require)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Backup Codes</Label>
                <p className="text-sm text-muted-foreground">Allow users to generate backup codes</p>
              </div>
              <Switch
                checked={policy.policy_config.backup_codes_enabled}
                onCheckedChange={(checked) => handleConfigChange('backup_codes_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enforcement Level */}
        <Card>
          <CardHeader>
            <CardTitle>Enforcement Level</CardTitle>
            <CardDescription>How strictly should MFA be enforced</CardDescription>
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
                    <span>Required - Block access without MFA</span>
                  </div>
                </SelectItem>
                <SelectItem value="recommended">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>Recommended - Show reminders</span>
                  </div>
                </SelectItem>
                <SelectItem value="optional">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span>Optional - Available but not required</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration Summary</CardTitle>
            <CardDescription>Overview of current MFA settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">User Coverage</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.required_for_all_users ? 'All Users' : 
                   policy.policy_config.required_for_admins ? 'Admins Only' : 'Optional'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Methods</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.allowed_methods.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {policy.policy_config.allowed_methods.join(', ')}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Device Trust</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.remember_device_days === 0 ? 'Always Verify' : 
                   `${policy.policy_config.remember_device_days} Days`}
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