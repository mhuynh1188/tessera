'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminGet, adminPost } from '@/lib/admin-api';
import { Globe, Shield, Plus, Trash2, AlertCircle, CheckCircle, MapPin, Wifi, Ban } from 'lucide-react';

interface IPAllowlistConfig {
  enabled: boolean;
  allowed_ips: string[];
  allowed_ip_ranges: string[];
  block_unknown_ips: boolean;
  alert_on_new_ip: boolean;
  whitelist_mode: boolean;
}

interface IPAllowlistPolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  policy_config: IPAllowlistConfig;
  is_enabled: boolean;
  enforcement_level: string;
}

export default function IPAllowlistConfig() {
  const [policy, setPolicy] = useState<IPAllowlistPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newIPRange, setNewIPRange] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchIPPolicy();
  }, []);

  const fetchIPPolicy = async () => {
    try {
      setLoading(true);
      const response = await adminGet('/admin/security-policies/ip_allowlist');
      if (response.success) {
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error fetching IP allowlist policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load IP allowlist policy',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof IPAllowlistConfig, value: any) => {
    if (!policy) return;
    
    setPolicy({
      ...policy,
      policy_config: {
        ...policy.policy_config,
        [key]: value
      }
    });
  };

  const handleAddIP = () => {
    if (!newIP.trim() || !policy) return;
    
    if (!isValidIP(newIP.trim())) {
      toast({
        title: 'Invalid IP Address',
        description: 'Please enter a valid IPv4 address',
        variant: 'destructive'
      });
      return;
    }

    const updatedIPs = [...policy.policy_config.allowed_ips, newIP.trim()];
    handleConfigChange('allowed_ips', updatedIPs);
    setNewIP('');
  };

  const handleRemoveIP = (ipToRemove: string) => {
    if (!policy) return;
    
    const updatedIPs = policy.policy_config.allowed_ips.filter(ip => ip !== ipToRemove);
    handleConfigChange('allowed_ips', updatedIPs);
  };

  const handleAddIPRange = () => {
    if (!newIPRange.trim() || !policy) return;
    
    if (!isValidIPRange(newIPRange.trim())) {
      toast({
        title: 'Invalid IP Range',
        description: 'Please enter a valid CIDR range (e.g., 192.168.1.0/24)',
        variant: 'destructive'
      });
      return;
    }

    const updatedRanges = [...policy.policy_config.allowed_ip_ranges, newIPRange.trim()];
    handleConfigChange('allowed_ip_ranges', updatedRanges);
    setNewIPRange('');
  };

  const handleRemoveIPRange = (rangeToRemove: string) => {
    if (!policy) return;
    
    const updatedRanges = policy.policy_config.allowed_ip_ranges.filter(range => range !== rangeToRemove);
    handleConfigChange('allowed_ip_ranges', updatedRanges);
  };

  const isValidIP = (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const isValidIPRange = (range: string): boolean => {
    const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
    return cidrRegex.test(range);
  };

  const handleSavePolicy = async () => {
    if (!policy) return;

    try {
      setSaving(true);
      const response = await adminPost('/admin/security-policies/ip_allowlist', {
        policy_config: policy.policy_config,
        is_enabled: policy.is_enabled,
        enforcement_level: policy.enforcement_level
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'IP allowlist policy updated successfully'
        });
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error saving IP allowlist policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save IP allowlist policy',
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
    
    if (config.enabled) score += 40;
    if (config.allowed_ips.length > 0 || config.allowed_ip_ranges.length > 0) score += 30;
    if (config.block_unknown_ips) score += 20;
    if (config.alert_on_new_ip) score += 10;
    
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
          <p className="text-muted-foreground">Failed to load IP allowlist policy</p>
          <Button onClick={fetchIPPolicy} className="mt-4">
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
            <Globe className="h-6 w-6" />
            <span>IP Allowlist</span>
          </h2>
          <p className="text-muted-foreground">Control access based on IP addresses and ranges</p>
        </div>
        <div className="flex items-center space-x-4">
          <Switch
            checked={policy.is_enabled}
            onCheckedChange={(checked) => setPolicy({ ...policy, is_enabled: checked })}
          />
          <Label>IP Policy Enabled</Label>
        </div>
      </div>

      {/* Security Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Access Control Level</span>
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
                {securityLevel >= 80 ? 'Highly Restricted' : 
                 securityLevel >= 60 ? 'Moderately Restricted' : 'Open Access'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="h-5 w-5" />
              <span>Access Control Settings</span>
            </CardTitle>
            <CardDescription>Configure basic IP access control behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable IP Filtering</Label>
                <p className="text-sm text-muted-foreground">
                  Activate IP-based access restrictions
                </p>
              </div>
              <Switch
                checked={policy.policy_config.enabled}
                onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Block Unknown IPs</Label>
                <p className="text-sm text-muted-foreground">
                  Deny access from unlisted IP addresses
                </p>
              </div>
              <Switch
                checked={policy.policy_config.block_unknown_ips}
                onCheckedChange={(checked) => handleConfigChange('block_unknown_ips', checked)}
                disabled={!policy.policy_config.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Alert on New IP</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications for first-time IP addresses
                </p>
              </div>
              <Switch
                checked={policy.policy_config.alert_on_new_ip}
                onCheckedChange={(checked) => handleConfigChange('alert_on_new_ip', checked)}
                disabled={!policy.policy_config.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Whitelist Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Only allow listed IPs (deny all others)
                </p>
              </div>
              <Switch
                checked={policy.policy_config.whitelist_mode}
                onCheckedChange={(checked) => handleConfigChange('whitelist_mode', checked)}
                disabled={!policy.policy_config.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enforcement Level */}
        <Card>
          <CardHeader>
            <CardTitle>Enforcement Level</CardTitle>
            <CardDescription>How strictly should IP restrictions be enforced</CardDescription>
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
                    <Ban className="h-4 w-4 text-red-600" />
                    <span>Strict - Block unauthorized IPs</span>
                  </div>
                </SelectItem>
                <SelectItem value="recommended">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>Monitor - Log and alert only</span>
                  </div>
                </SelectItem>
                <SelectItem value="optional">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Advisory - Track for reporting</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Allowed IP Addresses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Allowed IP Addresses</span>
            </CardTitle>
            <CardDescription>Individual IP addresses that are allowed access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="192.168.1.100"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddIP()}
              />
              <Button onClick={handleAddIP} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {policy.policy_config.allowed_ips.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No IP addresses configured
                </p>
              ) : (
                policy.policy_config.allowed_ips.map((ip, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <Badge variant="outline" className="font-mono">
                      {ip}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIP(ip)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Allowed IP Ranges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Allowed IP Ranges</span>
            </CardTitle>
            <CardDescription>CIDR notation ranges that are allowed access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="192.168.1.0/24"
                value={newIPRange}
                onChange={(e) => setNewIPRange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddIPRange()}
              />
              <Button onClick={handleAddIPRange} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {policy.policy_config.allowed_ip_ranges.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No IP ranges configured
                </p>
              ) : (
                policy.policy_config.allowed_ip_ranges.map((range, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <Badge variant="outline" className="font-mono">
                      {range}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIPRange(range)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Access Control Summary</CardTitle>
            <CardDescription>Current IP allowlist configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.enabled ? 'Active' : 'Disabled'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {policy.policy_config.enabled ? 'Filtering enabled' : 'No restrictions'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Allowed IPs</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.allowed_ips.length}
                </div>
                <div className="text-sm text-muted-foreground">individual addresses</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">IP Ranges</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.allowed_ip_ranges.length}
                </div>
                <div className="text-sm text-muted-foreground">CIDR blocks</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mode</Label>
                <div className="text-2xl font-bold">
                  {policy.policy_config.whitelist_mode ? 'Whitelist' : 'Blacklist'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {policy.policy_config.whitelist_mode ? 'Only allow listed' : 'Block unlisted'}
                </div>
              </div>
            </div>

            {/* Status indicators */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Block unknown IPs:</span>
                <div className="flex items-center space-x-1">
                  {policy.policy_config.block_unknown_ips ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span>{policy.policy_config.block_unknown_ips ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Alert on new IP:</span>
                <div className="flex items-center space-x-1">
                  {policy.policy_config.alert_on_new_ip ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span>{policy.policy_config.alert_on_new_ip ? 'Enabled' : 'Disabled'}</span>
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