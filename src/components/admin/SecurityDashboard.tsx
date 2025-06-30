'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { adminGet, adminPost } from '@/lib/admin-api';

// Import security policy configuration components
import PasswordPolicyConfig from '@/components/admin/security/PasswordPolicyConfig';
import MFAConfig from '@/components/admin/security/MFAConfig';
import SessionManagementConfig from '@/components/admin/security/SessionManagementConfig';
import IPAllowlistConfig from '@/components/admin/security/IPAllowlistConfig';
import DataAccessControlConfig from '@/components/admin/security/DataAccessControlConfig';
import AuditLoggingConfig from '@/components/admin/security/AuditLoggingConfig';
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Key,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  MapPin,
  Activity,
  Settings,
  Download,
  Filter,
  Search,
  RefreshCw,
  Ban,
  Unlock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Wifi,
  Database,
  Server,
  Users
} from 'lucide-react';

// Security Types
interface SecurityEvent {
  id: string;
  type: 'login_success' | 'login_failed' | 'password_change' | 'mfa_enabled' | 'mfa_disabled' | 'suspicious_activity' | 'account_locked' | 'permission_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: string;
  user_email: string;
  ip_address: string;
  location: string;
  device_info: string;
  details: string;
  created_at: string;
}

interface SecurityMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'password' | 'session' | 'access';
  enabled: boolean;
  config: Record<string, any>;
}

interface ActiveSession {
  id: string;
  user_id: string;
  user_email: string;
  ip_address: string;
  location: string;
  device_info: string;
  started_at: string;
  last_activity: string;
  is_current: boolean;
}

// Mock data
const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'login_failed',
    severity: 'medium',
    user_id: 'user-1',
    user_email: 'john.doe@acme.com',
    ip_address: '192.168.1.100',
    location: 'New York, US',
    device_info: 'Chrome on macOS',
    details: 'Multiple failed login attempts',
    created_at: '2024-06-21T10:30:00Z'
  },
  {
    id: '2',
    type: 'suspicious_activity',
    severity: 'high',
    user_id: 'user-2',
    user_email: 'jane.smith@acme.com',
    ip_address: '203.0.113.1',
    location: 'Unknown Location',
    device_info: 'Unknown Browser',
    details: 'Login from unusual location',
    created_at: '2024-06-21T09:15:00Z'
  },
  {
    id: '3',
    type: 'mfa_enabled',
    severity: 'low',
    user_id: 'user-3',
    user_email: 'mike.wilson@acme.com',
    ip_address: '192.168.1.101',
    location: 'Chicago, US',
    device_info: 'Firefox on Windows',
    details: 'Two-factor authentication enabled',
    created_at: '2024-06-21T08:45:00Z'
  },
  {
    id: '4',
    type: 'account_locked',
    severity: 'critical',
    user_id: 'user-4',
    user_email: 'test@hacker.com',
    ip_address: '198.51.100.1',
    location: 'Russia',
    device_info: 'Automated Bot',
    details: 'Account locked due to brute force attempt',
    created_at: '2024-06-21T07:20:00Z'
  }
];

const mockActiveSessions: ActiveSession[] = [
  {
    id: '1',
    user_id: 'user-1',
    user_email: 'john.doe@acme.com',
    ip_address: '192.168.1.100',
    location: 'New York, US',
    device_info: 'Chrome 126.0 on macOS Sonoma',
    started_at: '2024-06-21T09:00:00Z',
    last_activity: '2024-06-21T10:30:00Z',
    is_current: true
  },
  {
    id: '2',
    user_id: 'user-2',
    user_email: 'jane.smith@acme.com',
    ip_address: '192.168.1.101',
    location: 'Los Angeles, US',
    device_info: 'Safari 17.0 on iPhone',
    started_at: '2024-06-21T08:30:00Z',
    last_activity: '2024-06-21T10:25:00Z',
    is_current: false
  }
];

const mockSecurityPolicies: SecurityPolicy[] = [
  {
    id: '1',
    name: 'Password Policy',
    description: 'Enforce strong password requirements',
    category: 'password',
    enabled: true,
    config: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: false,
      password_history: 5,
      expiry_days: 90
    }
  },
  {
    id: '2',
    name: 'Multi-Factor Authentication',
    description: 'Require MFA for all user accounts',
    category: 'authentication',
    enabled: false,
    config: {
      required_for_all: false,
      required_for_admins: true,
      allowed_methods: ['totp', 'sms'],
      backup_codes: 10
    }
  },
  {
    id: '3',
    name: 'Session Management',
    description: 'Control user session behavior',
    category: 'session',
    enabled: true,
    config: {
      timeout_minutes: 30,
      max_concurrent_sessions: 3,
      remember_me_days: 30,
      force_logout_on_password_change: true
    }
  },
  {
    id: '4',
    name: 'Account Lockout',
    description: 'Lock accounts after failed attempts',
    category: 'authentication',
    enabled: true,
    config: {
      max_attempts: 5,
      lockout_duration_minutes: 15,
      reset_attempts_after_minutes: 60
    }
  }
];

export function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [complianceFrameworks, setComplianceFrameworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPolicyType, setSelectedPolicyType] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all security data
  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [eventsRes, sessionsRes, policiesRes, complianceRes] = await Promise.all([
        adminGet('/api/admin/security-events'),
        adminGet('/api/admin/active-sessions'), 
        adminGet('/api/admin/security-policies'),
        adminGet('/api/admin/compliance')
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.success && eventsData.data) {
          setSecurityEvents(eventsData.data.events || eventsData.data || []);
        }
      } else {
        console.warn('Security events API failed:', eventsRes.status);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        if (sessionsData.success && sessionsData.data) {
          setActiveSessions(sessionsData.data.sessions || sessionsData.data || []);
        }
      } else {
        console.warn('Active sessions API failed:', sessionsRes.status);
      }

      if (policiesRes.ok) {
        const policiesData = await policiesRes.json();
        if (policiesData.success && policiesData.data) {
          setSecurityPolicies(policiesData.data.policies || policiesData.data || []);
        }
      } else {
        console.warn('Security policies API failed:', policiesRes.status);
      }

      if (complianceRes.ok) {
        const complianceData = await complianceRes.json();
        if (complianceData.success && complianceData.data) {
          setComplianceFrameworks(complianceData.data.frameworks || complianceData.data || []);
        }
      } else {
        console.warn('Compliance API failed:', complianceRes.status);
      }

    } catch (err) {
      console.error('Error fetching security data:', err);
      setError('Failed to load security data');
      // Fallback to mock data for development
      setSecurityEvents(mockSecurityEvents);
      setActiveSessions(mockActiveSessions);
      setSecurityPolicies(mockSecurityPolicies);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchSecurityData();
    setRefreshing(false);
    toast({ title: "Security data refreshed" });
  };

  // Calculate security metrics - with null safety
  const securityMetrics: SecurityMetric[] = [
    {
      label: 'Active Sessions',
      value: activeSessions?.length || 0,
      change: 12,
      trend: 'up',
      icon: Users
    },
    {
      label: 'Failed Logins (24h)',
      value: securityEvents?.filter(e => e?.type === 'login_failed').length || 0,
      change: -8,
      trend: 'down',
      icon: XCircle
    },
    {
      label: 'Security Alerts',
      value: securityEvents?.filter(e => e?.severity === 'high' || e?.severity === 'critical').length || 0,
      change: 5,
      trend: 'up',
      icon: AlertTriangle
    },
    {
      label: 'MFA Adoption',
      value: 73,
      change: 15,
      trend: 'up',
      icon: Shield
    }
  ];

  // Filter security events - with null safety
  const filteredEvents = securityEvents.filter(event => {
    if (!event) return false;
    
    const matchesSearch = 
      (event.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.ip_address || '').includes(searchQuery);
    
    const matchesSeverity = filterSeverity === 'all' || event.severity === filterSeverity;
    const matchesType = filterType === 'all' || event.type === filterType;
    
    return matchesSearch && matchesSeverity && matchesType;
  });

  // Handle policy toggle
  const handlePolicyToggle = (policyId: string, enabled: boolean) => {
    setSecurityPolicies(policies => 
      policies.map(p => 
        p.id === policyId ? { ...p, enabled } : p
      )
    );
    toast({ 
      title: `Security policy ${enabled ? 'enabled' : 'disabled'}`,
      description: `The policy has been ${enabled ? 'activated' : 'deactivated'} successfully.`
    });
  };

  // Handle session termination
  const handleTerminateSession = async (sessionId: string) => {
    try {
      const response = await adminPost('/api/admin/active-sessions', {
        action: 'terminate',
        session_id: sessionId
      });

      if (response.ok) {
        setActiveSessions(sessions => sessions.filter(s => s.id !== sessionId));
        toast({ title: "Session terminated successfully" });
      } else {
        toast({ title: "Failed to terminate session", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error terminating session", variant: "destructive" });
    }
  };

  // Get severity badge variant
  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  // Get event type icon
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'login_success': return CheckCircle;
      case 'login_failed': return XCircle;
      case 'password_change': return Key;
      case 'mfa_enabled': return Shield;
      case 'mfa_disabled': return Shield;
      case 'suspicious_activity': return AlertTriangle;
      case 'account_locked': return Lock;
      case 'permission_change': return Settings;
      default: return Activity;
    }
  };

  // Render policy configuration component based on selected type
  const renderPolicyConfig = () => {
    if (!selectedPolicyType) return null;
    
    switch (selectedPolicyType) {
      case 'Password Policy':
        return <PasswordPolicyConfig />;
      case 'Multi-Factor Authentication':
        return <MFAConfig />;
      case 'Session Management':
        return <SessionManagementConfig />;
      case 'IP Allowlist':
        return <IPAllowlistConfig />;
      case 'Data Access Control':
        return <DataAccessControlConfig />;
      case 'Audit Logging':
        return <AuditLoggingConfig />;
      default:
        return (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Policy configuration not yet implemented</p>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading security data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor security events, manage policies, and protect your organization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {securityMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}{metric.label === 'MFA Adoption' ? '%' : ''}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  ) : null}
                  <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : ''}>
                    {metric.change > 0 ? '+' : ''}{metric.change}
                  </span>
                  <span className="ml-1">from last week</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Security Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>Latest security-related activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(securityEvents || []).slice(0, 5).map((event) => {
                    const IconComponent = getEventTypeIcon(event.type);
                    return (
                      <div key={event.id} className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          event.severity === 'critical' ? 'bg-red-100 text-red-600' :
                          event.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                          event.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.details}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{event.user_email || 'Unknown User'}</span>
                            <span>•</span>
                            <span>{event.location || 'Unknown Location'}</span>
                            <span>•</span>
                            <span>{event.created_at ? new Date(event.created_at).toLocaleTimeString() : 'Unknown Time'}</span>
                          </div>
                        </div>
                        <Badge variant={getSeverityBadgeVariant(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Security Health Status */}
            <Card>
              <CardHeader>
                <CardTitle>Security Health</CardTitle>
                <CardDescription>Overall security posture assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Password Policy</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Multi-Factor Authentication</span>
                    </div>
                    <Badge variant="secondary">Partial</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Session Management</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">IP Allowlist</span>
                    </div>
                    <Badge variant="outline">Inactive</Badge>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Score</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-sm font-bold text-green-600">75%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Security Actions</CardTitle>
              <CardDescription>Improve your security posture with these suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Enable MFA for All Users</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Only 73% of users have MFA enabled. Increase security by requiring it for all accounts.
                  </p>
                  <Button size="sm" onClick={() => setActiveTab('policies')}>Configure MFA</Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Set Up IP Allowlist</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Restrict access to your application from specific IP addresses or ranges.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('policies')}>Configure IPs</Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Review Audit Logs</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Regularly review security events and user activities to detect anomalies.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('events')}>View Logs</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events, users, or IP addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="login_success">Login Success</SelectItem>
                  <SelectItem value="login_failed">Login Failed</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  <SelectItem value="account_locked">Account Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Security Events Table */}
          <Card>
            <CardHeader>
              <CardTitle>Security Events ({filteredEvents.length})</CardTitle>
              <CardDescription>
                Detailed log of security-related activities and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const IconComponent = getEventTypeIcon(event.type);
                  return (
                    <div key={event.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className={`p-2 rounded-full ${
                        event.severity === 'critical' ? 'bg-red-100 text-red-600' :
                        event.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                        event.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{event.details}</span>
                          <Badge variant={getSeverityBadgeVariant(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{event.user_email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{event.ip_address}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Monitor className="h-3 w-3" />
                            <span>{event.device_info}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(event.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No security events found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || filterSeverity !== 'all' || filterType !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No security events have been recorded yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions ({activeSessions.length})</CardTitle>
              <CardDescription>
                Monitor and manage active user sessions across all devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                        {(session.device_info || '').includes('iPhone') ? (
                          <Smartphone className="h-4 w-4" />
                        ) : (
                          <Monitor className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{session.user_email}</span>
                          {session.is_current && (
                            <Badge variant="default" className="text-xs">Current Session</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{session.ip_address}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{session.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Monitor className="h-3 w-3" />
                            <span>{session.device_info}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Started: {new Date(session.started_at).toLocaleString()} • 
                          Last activity: {new Date(session.last_activity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTerminateSession(session.id)}
                        disabled={session.is_current}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Terminate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          {selectedPolicyType ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedPolicyType(null)}
                  className="flex items-center space-x-2"
                >
                  <span>← Back to Policies</span>
                </Button>
                <h3 className="text-lg font-semibold">{selectedPolicyType} Configuration</h3>
              </div>
              {renderPolicyConfig()}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {securityPolicies.map((policy) => (
                <Card key={policy.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{policy.name}</span>
                          <Badge variant="outline">{policy.category}</Badge>
                        </CardTitle>
                        <CardDescription>{policy.description}</CardDescription>
                      </div>
                      <Switch
                        checked={policy.enabled}
                        onCheckedChange={(checked) => handlePolicyToggle(policy.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(policy.config || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPolicyType(policy.name)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Standards</CardTitle>
                <CardDescription>
                  Track compliance with industry standards and regulations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceFrameworks.length > 0 ? complianceFrameworks.map((standard) => (
                    <div key={standard.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {standard.status === 'compliant' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : standard.status === 'partial' ? (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{standard.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              standard.score >= 90 ? 'bg-green-600' :
                              standard.score >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${standard.score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{standard.score}%</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No compliance frameworks configured</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit & Reporting</CardTitle>
                <CardDescription>
                  Generate compliance reports and audit trails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate SOC 2 Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download Audit Log
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Compliance Review
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}