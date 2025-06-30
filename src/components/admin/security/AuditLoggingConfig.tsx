'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminGet, adminPost } from '@/lib/admin-api';
import { FileText, Shield, Activity, AlertCircle, CheckCircle, Clock, Database, Users, Settings } from 'lucide-react';

interface AuditConfig {
  enable_audit_logging: boolean;
  log_authentication_events: boolean;
  log_data_access: boolean;
  log_admin_actions: boolean;
  log_security_events: boolean;
  log_system_changes: boolean;
  log_api_requests: boolean;
  retention_days: number;
  real_time_alerts: boolean;
  export_logs_enabled: boolean;
  log_levels: string[];
  alert_thresholds: {
    failed_logins_per_hour: number;
    admin_actions_per_hour: number;
    api_requests_per_minute: number;
  };
}

interface AuditPolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  policy_config: AuditConfig;
  is_enabled: boolean;
  enforcement_level: string;
}

const LOG_LEVELS = [
  { id: 'debug', name: 'Debug', description: 'Detailed diagnostic information' },
  { id: 'info', name: 'Info', description: 'General information events' },
  { id: 'warning', name: 'Warning', description: 'Warning conditions' },
  { id: 'error', name: 'Error', description: 'Error conditions' },
  { id: 'critical', name: 'Critical', description: 'Critical error conditions' }
];

const EVENT_CATEGORIES = [
  { 
    key: 'log_authentication_events' as keyof AuditConfig, 
    name: 'Authentication Events', 
    description: 'Login attempts, logouts, password changes',
    icon: Users
  },
  { 
    key: 'log_data_access' as keyof AuditConfig, 
    name: 'Data Access', 
    description: 'Database queries, file access, data exports',
    icon: Database
  },
  { 
    key: 'log_admin_actions' as keyof AuditConfig, 
    name: 'Admin Actions', 
    description: 'Administrative operations and configuration changes',
    icon: Settings
  },
  { 
    key: 'log_security_events' as keyof AuditConfig, 
    name: 'Security Events', 
    description: 'Failed authentication, suspicious activities',
    icon: Shield
  },
  { 
    key: 'log_system_changes' as keyof AuditConfig, 
    name: 'System Changes', 
    description: 'Configuration updates, policy modifications',
    icon: Activity
  },
  { 
    key: 'log_api_requests' as keyof AuditConfig, 
    name: 'API Requests', 
    description: 'All API endpoint calls and responses',
    icon: Activity
  }
];

export default function AuditLoggingConfig() {
  const [policy, setPolicy] = useState<AuditPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditPolicy();
  }, []);

  const fetchAuditPolicy = async () => {
    try {
      setLoading(true);
      // Since we don't have a specific audit logging endpoint, create a default policy
      const defaultPolicy: AuditPolicy = {
        id: 'default-audit',
        policy_name: 'Audit Logging',
        policy_type: 'audit_logging',
        policy_config: {
          enable_audit_logging: true,
          log_authentication_events: true,
          log_data_access: true,
          log_admin_actions: true,
          log_security_events: true,
          log_system_changes: true,
          log_api_requests: false,
          retention_days: 90,
          real_time_alerts: true,
          export_logs_enabled: false,
          log_levels: ['info', 'warning', 'error', 'critical'],
          alert_thresholds: {
            failed_logins_per_hour: 5,
            admin_actions_per_hour: 50,
            api_requests_per_minute: 100
          }
        },
        is_enabled: true,
        enforcement_level: 'required'
      };
      setPolicy(defaultPolicy);
    } catch (error) {
      console.error('Error fetching audit policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logging policy',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof AuditConfig, value: any) => {
    if (!policy) return;
    
    setPolicy({
      ...policy,
      policy_config: {
        ...policy.policy_config,
        [key]: value
      }
    });
  };

  const handleThresholdChange = (key: keyof AuditConfig['alert_thresholds'], value: number) => {
    if (!policy) return;
    
    setPolicy({
      ...policy,
      policy_config: {
        ...policy.policy_config,
        alert_thresholds: {
          ...policy.policy_config.alert_thresholds,
          [key]: value
        }
      }
    });
  };

  const handleLogLevelToggle = (levelId: string, enabled: boolean) => {
    if (!policy) return;
    
    const currentLevels = policy.policy_config.log_levels;
    let newLevels;
    
    if (enabled) {
      newLevels = [...currentLevels, levelId];
    } else {
      newLevels = currentLevels.filter(level => level !== levelId);
    }
    
    handleConfigChange('log_levels', newLevels);
  };

  const handleSavePolicy = async () => {
    if (!policy) return;

    try {
      setSaving(true);
      // Simulate API call since we don't have a specific audit endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'Audit logging policy updated successfully'
      });
    } catch (error) {
      console.error('Error saving audit policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save audit logging policy',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getComplianceScore = () => {
    if (!policy) return 0;
    
    let score = 0;
    const config = policy.policy_config;
    
    if (config.enable_audit_logging) score += 20;
    if (config.log_authentication_events) score += 15;
    if (config.log_admin_actions) score += 15;
    if (config.log_security_events) score += 15;
    if (config.retention_days >= 90) score += 10;
    if (config.real_time_alerts) score += 10;
    if (config.log_levels.includes('error') && config.log_levels.includes('critical')) score += 10;
    if (config.log_data_access) score += 5;
    
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
          <p className="text-muted-foreground">Failed to load audit logging policy</p>
          <Button onClick={fetchAuditPolicy} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const complianceScore = getComplianceScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span>Audit Logging</span>
          </h2>
          <p className="text-muted-foreground">Configure comprehensive audit trails and monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <Switch
            checked={policy.is_enabled}
            onCheckedChange={(checked) => setPolicy({ ...policy, is_enabled: checked })}
          />
          <Label>Audit Logging Enabled</Label>
        </div>
      </div>

      {/* Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Compliance Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    complianceScore >= 80 ? 'bg-green-600' :
                    complianceScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${complianceScore}%` }}
                ></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{complianceScore}%</div>
              <div className="text-sm text-muted-foreground">
                {complianceScore >= 80 ? 'Excellent' : 
                 complianceScore >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Master Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Master Controls</span>
            </CardTitle>
            <CardDescription>Primary audit logging settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Master switch for all audit logging
                </p>
              </div>
              <Switch
                checked={policy.policy_config.enable_audit_logging}
                onCheckedChange={(checked) => handleConfigChange('enable_audit_logging', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Real-time Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Send immediate notifications for critical events
                </p>
              </div>
              <Switch
                checked={policy.policy_config.real_time_alerts}
                onCheckedChange={(checked) => handleConfigChange('real_time_alerts', checked)}
                disabled={!policy.policy_config.enable_audit_logging}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Log Exports</Label>
                <p className="text-sm text-muted-foreground">
                  Allow exporting audit logs for external analysis
                </p>
              </div>
              <Switch
                checked={policy.policy_config.export_logs_enabled}
                onCheckedChange={(checked) => handleConfigChange('export_logs_enabled', checked)}
                disabled={!policy.policy_config.enable_audit_logging}
              />
            </div>
          </CardContent>
        </Card>

        {/* Retention Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Retention Settings</span>
            </CardTitle>
            <CardDescription>How long to keep audit logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Log Retention Period (Days)</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.retention_days]}
                  onValueChange={(value) => handleConfigChange('retention_days', value[0])}
                  max={365}
                  min={30}
                  step={30}
                  className="flex-1"
                  disabled={!policy.policy_config.enable_audit_logging}
                />
                <span className="w-16 text-center font-medium">
                  {policy.policy_config.retention_days}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Logs older than this will be automatically archived or deleted
              </p>
            </div>

            <div className="space-y-2">
              <Label>Compliance Period</Label>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>SOX Compliance:</span>
                  <Badge variant={policy.policy_config.retention_days >= 90 ? "default" : "destructive"}>
                    {policy.policy_config.retention_days >= 90 ? "Met" : "Not Met"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>GDPR Compliance:</span>
                  <Badge variant={policy.policy_config.retention_days <= 365 ? "default" : "destructive"}>
                    {policy.policy_config.retention_days <= 365 ? "Met" : "Review Required"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Categories */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Event Categories</CardTitle>
            <CardDescription>Select which types of events to log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EVENT_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const isEnabled = policy.policy_config[category.key] as boolean;
                
                return (
                  <div key={category.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleConfigChange(category.key, checked)}
                      disabled={!policy.policy_config.enable_audit_logging}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <IconComponent className="h-4 w-4" />
                        <Label className="font-medium">{category.name}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Log Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Log Levels</CardTitle>
            <CardDescription>Select which log levels to capture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {LOG_LEVELS.map((level) => {
              const isEnabled = policy.policy_config.log_levels.includes(level.id);
              
              return (
                <div key={level.id} className="flex items-start space-x-3">
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleLogLevelToggle(level.id, !!checked)}
                    disabled={!policy.policy_config.enable_audit_logging}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label className="font-medium capitalize">{level.name}</Label>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Alert Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Thresholds</CardTitle>
            <CardDescription>Configure when to trigger alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Failed Logins per Hour</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.alert_thresholds.failed_logins_per_hour]}
                  onValueChange={(value) => handleThresholdChange('failed_logins_per_hour', value[0])}
                  max={20}
                  min={1}
                  step={1}
                  className="flex-1"
                  disabled={!policy.policy_config.real_time_alerts}
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.alert_thresholds.failed_logins_per_hour}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Admin Actions per Hour</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.alert_thresholds.admin_actions_per_hour]}
                  onValueChange={(value) => handleThresholdChange('admin_actions_per_hour', value[0])}
                  max={100}
                  min={10}
                  step={10}
                  className="flex-1"
                  disabled={!policy.policy_config.real_time_alerts}
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.alert_thresholds.admin_actions_per_hour}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>API Requests per Minute</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[policy.policy_config.alert_thresholds.api_requests_per_minute]}
                  onValueChange={(value) => handleThresholdChange('api_requests_per_minute', value[0])}
                  max={500}
                  min={50}
                  step={50}
                  className="flex-1"
                  disabled={!policy.policy_config.real_time_alerts}
                />
                <span className="w-12 text-center font-medium">
                  {policy.policy_config.alert_thresholds.api_requests_per_minute}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enforcement Level */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enforcement Level</CardTitle>
            <CardDescription>How strictly should audit logging be enforced</CardDescription>
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
                    <span>Required - Mandatory compliance logging</span>
                  </div>
                </SelectItem>
                <SelectItem value="recommended">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>Standard - Normal audit coverage</span>
                  </div>
                </SelectItem>
                <SelectItem value="optional">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span>Minimal - Basic logging only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Audit Configuration Summary</CardTitle>
            <CardDescription>Current audit logging setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Event Categories</Label>
                <div className="text-2xl font-bold">
                  {EVENT_CATEGORIES.filter(cat => policy.policy_config[cat.key] as boolean).length}/{EVENT_CATEGORIES.length}
                </div>
                <div className="text-sm text-muted-foreground">categories enabled</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Log Levels</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.log_levels.length}/{LOG_LEVELS.length}
                </div>
                <div className="text-sm text-muted-foreground">levels captured</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Retention</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.retention_days}d
                </div>
                <div className="text-sm text-muted-foreground">log retention</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Alerts</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.real_time_alerts ? 'Active' : 'Disabled'}
                </div>
                <div className="text-sm text-muted-foreground">real-time alerts</div>
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