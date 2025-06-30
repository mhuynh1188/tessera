'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { adminGet, adminPost } from '@/lib/admin-api';
import { Database, Shield, Lock, Eye, AlertCircle, CheckCircle, FileText, Users, Clock } from 'lucide-react';

interface DataAccessConfig {
  enable_row_level_security: boolean;
  data_classification_enabled: boolean;
  encryption_at_rest: boolean;
  encryption_in_transit: boolean;
  data_retention_days: number;
  audit_data_access: boolean;
  require_approval_for_exports: boolean;
  mask_sensitive_data: boolean;
  allowed_export_formats: string[];
  restrict_api_access: boolean;
}

interface DataAccessPolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  policy_config: DataAccessConfig;
  is_enabled: boolean;
  enforcement_level: string;
}

const EXPORT_FORMATS = [
  { id: 'csv', name: 'CSV Files', description: 'Comma-separated values' },
  { id: 'json', name: 'JSON Files', description: 'JavaScript Object Notation' },
  { id: 'xlsx', name: 'Excel Files', description: 'Microsoft Excel format' },
  { id: 'pdf', name: 'PDF Reports', description: 'Portable Document Format' },
  { id: 'xml', name: 'XML Files', description: 'Extensible Markup Language' }
];

export default function DataAccessControlConfig() {
  const [policy, setPolicy] = useState<DataAccessPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDataAccessPolicy();
  }, []);

  const fetchDataAccessPolicy = async () => {
    try {
      setLoading(true);
      const response = await adminGet('/admin/security-policies/data_retention');
      if (response.success) {
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error fetching data access policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data access control policy',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof DataAccessConfig, value: any) => {
    if (!policy) return;
    
    setPolicy({
      ...policy,
      policy_config: {
        ...policy.policy_config,
        [key]: value
      }
    });
  };

  const handleExportFormatToggle = (formatId: string, enabled: boolean) => {
    if (!policy) return;
    
    const currentFormats = policy.policy_config.allowed_export_formats || [];
    let newFormats;
    
    if (enabled) {
      newFormats = [...currentFormats, formatId];
    } else {
      newFormats = currentFormats.filter(format => format !== formatId);
    }
    
    handleConfigChange('allowed_export_formats', newFormats);
  };

  const handleSavePolicy = async () => {
    if (!policy) return;

    try {
      setSaving(true);
      const response = await adminPost('/admin/security-policies/data_retention', {
        policy_config: policy.policy_config,
        is_enabled: policy.is_enabled,
        enforcement_level: policy.enforcement_level
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Data access control policy updated successfully'
        });
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error saving data access policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save data access control policy',
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
    
    if (config.enable_row_level_security) score += 20;
    if (config.encryption_at_rest) score += 15;
    if (config.encryption_in_transit) score += 15;
    if (config.audit_data_access) score += 15;
    if (config.require_approval_for_exports) score += 10;
    if (config.mask_sensitive_data) score += 10;
    if (config.data_classification_enabled) score += 10;
    if (config.restrict_api_access) score += 5;
    
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
    // Create default policy structure
    const defaultPolicy: DataAccessPolicy = {
      id: 'default-data-access',
      policy_name: 'Data Access Control',
      policy_type: 'data_retention',
      policy_config: {
        enable_row_level_security: true,
        data_classification_enabled: false,
        encryption_at_rest: true,
        encryption_in_transit: true,
        data_retention_days: 365,
        audit_data_access: true,
        require_approval_for_exports: false,
        mask_sensitive_data: false,
        allowed_export_formats: ['csv', 'json'],
        restrict_api_access: false
      },
      is_enabled: true,
      enforcement_level: 'required'
    };
    setPolicy(defaultPolicy);
  }

  if (!policy) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Failed to load data access control policy</p>
          <Button onClick={fetchDataAccessPolicy} className="mt-4">
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
            <Database className="h-6 w-6" />
            <span>Data Access Control</span>
          </h2>
          <p className="text-muted-foreground">Configure data protection and access restrictions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Switch
            checked={policy.is_enabled}
            onCheckedChange={(checked) => setPolicy({ ...policy, is_enabled: checked })}
          />
          <Label>Data Protection Enabled</Label>
        </div>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Data Protection Score</span>
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
                {securityScore >= 80 ? 'High Protection' : 
                 securityScore >= 60 ? 'Medium Protection' : 'Basic Protection'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Database Security</span>
            </CardTitle>
            <CardDescription>Core database protection mechanisms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Row Level Security (RLS)</Label>
                <p className="text-sm text-muted-foreground">
                  Restrict data access at the row level
                </p>
              </div>
              <Switch
                checked={policy.policy_config.enable_row_level_security}
                onCheckedChange={(checked) => handleConfigChange('enable_row_level_security', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Encryption at Rest</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt stored data on disk
                </p>
              </div>
              <Switch
                checked={policy.policy_config.encryption_at_rest}
                onCheckedChange={(checked) => handleConfigChange('encryption_at_rest', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Encryption in Transit</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt data during transmission
                </p>
              </div>
              <Switch
                checked={policy.policy_config.encryption_in_transit}
                onCheckedChange={(checked) => handleConfigChange('encryption_in_transit', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Data Classification</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically classify sensitive data
                </p>
              </div>
              <Switch
                checked={policy.policy_config.data_classification_enabled}
                onCheckedChange={(checked) => handleConfigChange('data_classification_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Access Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Access Controls</span>
            </CardTitle>
            <CardDescription>User access and monitoring controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Audit Data Access</Label>
                <p className="text-sm text-muted-foreground">
                  Log all data access activities
                </p>
              </div>
              <Switch
                checked={policy.policy_config.audit_data_access}
                onCheckedChange={(checked) => handleConfigChange('audit_data_access', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Require Export Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Admin approval required for data exports
                </p>
              </div>
              <Switch
                checked={policy.policy_config.require_approval_for_exports}
                onCheckedChange={(checked) => handleConfigChange('require_approval_for_exports', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Mask Sensitive Data</Label>
                <p className="text-sm text-muted-foreground">
                  Hide sensitive information in UI
                </p>
              </div>
              <Switch
                checked={policy.policy_config.mask_sensitive_data}
                onCheckedChange={(checked) => handleConfigChange('mask_sensitive_data', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Restrict API Access</Label>
                <p className="text-sm text-muted-foreground">
                  Additional restrictions on API endpoints
                </p>
              </div>
              <Switch
                checked={policy.policy_config.restrict_api_access}
                onCheckedChange={(checked) => handleConfigChange('restrict_api_access', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Data Retention</span>
            </CardTitle>
            <CardDescription>Configure how long data is kept</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Data Retention Period (Days)</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.data_retention_days]}
                  onValueChange={(value) => handleConfigChange('data_retention_days', value[0])}
                  max={2555} // ~7 years
                  min={30}
                  step={30}
                  className="flex-1"
                />
                <span className="w-16 text-center font-medium">
                  {policy.policy_config.data_retention_days}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically delete data older than this period
                {policy.policy_config.data_retention_days >= 365 && 
                  ` (${Math.round(policy.policy_config.data_retention_days / 365)} years)`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Export Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Export Controls</span>
            </CardTitle>
            <CardDescription>Allowed data export formats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {EXPORT_FORMATS.map((format) => {
              const isEnabled = policy.policy_config.allowed_export_formats?.includes(format.id) || false;
              
              return (
                <div key={format.id} className="flex items-start space-x-3">
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleExportFormatToggle(format.id, !!checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label className="font-medium">{format.name}</Label>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Enforcement Level */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enforcement Level</CardTitle>
            <CardDescription>How strictly should data access controls be enforced</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={policy.enforcement_level} 
              onValueChange={(value) => setPolicy({ ...policy, enforcement_level: value })}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="required">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Strict - Enforce all controls</span>
                  </div>
                </SelectItem>
                <SelectItem value="recommended">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>Balanced - Core protections with flexibility</span>
                  </div>
                </SelectItem>
                <SelectItem value="optional">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span>Monitor - Track access patterns only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Data Protection Summary</CardTitle>
            <CardDescription>Current data access control configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Database Security</Label>
                <div className="text-2xl font-bold">
                  {[
                    policy.policy_config.enable_row_level_security,
                    policy.policy_config.encryption_at_rest,
                    policy.policy_config.encryption_in_transit
                  ].filter(Boolean).length}/3
                </div>
                <div className="text-sm text-muted-foreground">core protections</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Access Controls</Label>
                <div className="text-2xl font-bold">
                  {[
                    policy.policy_config.audit_data_access,
                    policy.policy_config.require_approval_for_exports,
                    policy.policy_config.mask_sensitive_data
                  ].filter(Boolean).length}/3
                </div>
                <div className="text-sm text-muted-foreground">controls active</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Export Formats</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.allowed_export_formats?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">formats allowed</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Retention</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.data_retention_days >= 365 ? 
                    `${Math.round(policy.policy_config.data_retention_days / 365)}y` :
                    `${policy.policy_config.data_retention_days}d`}
                </div>
                <div className="text-sm text-muted-foreground">retention period</div>
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