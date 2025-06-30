'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminGet, adminPost } from '@/lib/admin-api';
import { Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface PasswordPolicyConfig {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  max_age_days: number;
  password_history: number;
  prevent_common_passwords: boolean;
  prevent_personal_info: boolean;
}

interface PasswordPolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  policy_config: PasswordPolicyConfig;
  is_enabled: boolean;
  enforcement_level: string;
}

export default function PasswordPolicyConfig() {
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPasswordPolicy();
  }, []);

  const fetchPasswordPolicy = async () => {
    try {
      setLoading(true);
      const response = await adminGet('/admin/security-policies/password');
      if (response.success) {
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error fetching password policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load password policy configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof PasswordPolicyConfig, value: any) => {
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
      const response = await adminPost('/admin/security-policies/password', {
        policy_config: policy.policy_config,
        is_enabled: policy.is_enabled,
        enforcement_level: policy.enforcement_level
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Password policy updated successfully'
        });
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error saving password policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save password policy',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrengthIndicator = () => {
    if (!policy) return 0;
    
    let score = 0;
    const config = policy.policy_config;
    
    if (config.min_length >= 12) score += 20;
    else if (config.min_length >= 8) score += 10;
    
    if (config.require_uppercase) score += 15;
    if (config.require_lowercase) score += 15;
    if (config.require_numbers) score += 15;
    if (config.require_symbols) score += 20;
    if (config.prevent_common_passwords) score += 10;
    if (config.prevent_personal_info) score += 5;
    
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
          <p className="text-muted-foreground">Failed to load password policy</p>
          <Button onClick={fetchPasswordPolicy} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const strengthScore = getPasswordStrengthIndicator();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Lock className="h-6 w-6" />
            <span>Password Policy</span>
          </h2>
          <p className="text-muted-foreground">Configure password requirements and security rules</p>
        </div>
        <div className="flex items-center space-x-4">
          <Switch
            checked={policy.is_enabled}
            onCheckedChange={(checked) => setPolicy({ ...policy, is_enabled: checked })}
          />
          <Label>Policy Enabled</Label>
        </div>
      </div>

      {/* Password Strength Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Password Strength Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    strengthScore >= 80 ? 'bg-green-600' :
                    strengthScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${strengthScore}%` }}
                ></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{strengthScore}%</div>
              <div className="text-sm text-muted-foreground">
                {strengthScore >= 80 ? 'Strong' : strengthScore >= 60 ? 'Medium' : 'Weak'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Requirements</CardTitle>
            <CardDescription>Set minimum password criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Minimum Length</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.min_length]}
                  onValueChange={(value) => handleConfigChange('min_length', value[0])}
                  max={20}
                  min={4}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.min_length}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Require Uppercase Letters</Label>
                <Switch
                  checked={policy.policy_config.require_uppercase}
                  onCheckedChange={(checked) => handleConfigChange('require_uppercase', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Lowercase Letters</Label>
                <Switch
                  checked={policy.policy_config.require_lowercase}
                  onCheckedChange={(checked) => handleConfigChange('require_lowercase', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Numbers</Label>
                <Switch
                  checked={policy.policy_config.require_numbers}
                  onCheckedChange={(checked) => handleConfigChange('require_numbers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Special Characters</Label>
                <Switch
                  checked={policy.policy_config.require_symbols}
                  onCheckedChange={(checked) => handleConfigChange('require_symbols', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Configure additional security measures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Password Expiry (Days)</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.max_age_days]}
                  onValueChange={(value) => handleConfigChange('max_age_days', value[0])}
                  max={365}
                  min={30}
                  step={30}
                  className="flex-1"
                />
                <span className="w-16 text-center font-medium">
                  {policy.policy_config.max_age_days}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password History</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.password_history]}
                  onValueChange={(value) => handleConfigChange('password_history', value[0])}
                  max={20}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.password_history}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Prevent reusing the last {policy.policy_config.password_history} passwords
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Prevent Common Passwords</Label>
                  <p className="text-sm text-muted-foreground">Block commonly used passwords</p>
                </div>
                <Switch
                  checked={policy.policy_config.prevent_common_passwords}
                  onCheckedChange={(checked) => handleConfigChange('prevent_common_passwords', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Prevent Personal Information</Label>
                  <p className="text-sm text-muted-foreground">Block passwords containing user data</p>
                </div>
                <Switch
                  checked={policy.policy_config.prevent_personal_info}
                  onCheckedChange={(checked) => handleConfigChange('prevent_personal_info', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enforcement Level */}
        <Card>
          <CardHeader>
            <CardTitle>Enforcement Level</CardTitle>
            <CardDescription>How strictly should this policy be enforced</CardDescription>
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
                    <span>Required - Strictly enforced</span>
                  </div>
                </SelectItem>
                <SelectItem value="recommended">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>Recommended - Show warnings</span>
                  </div>
                </SelectItem>
                <SelectItem value="optional">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span>Optional - Advisory only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Password Requirements Preview</CardTitle>
            <CardDescription>How users will see the requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Minimum {policy.policy_config.min_length} characters</span>
              </div>
              {policy.policy_config.require_uppercase && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>At least one uppercase letter</span>
                </div>
              )}
              {policy.policy_config.require_lowercase && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>At least one lowercase letter</span>
                </div>
              )}
              {policy.policy_config.require_numbers && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>At least one number</span>
                </div>
              )}
              {policy.policy_config.require_symbols && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>At least one special character</span>
                </div>
              )}
              {policy.policy_config.max_age_days < 365 && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Must be changed every {policy.policy_config.max_age_days} days</span>
                </div>
              )}
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