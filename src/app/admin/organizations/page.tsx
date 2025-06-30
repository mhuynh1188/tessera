'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Settings, 
  Plus,
  Search,
  Edit,
  Trash2,
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Organization {
  id: string;
  name: string;
  domain: string;
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  max_users: number;
  max_workspaces: number;
  analytics_enabled: boolean;
  user_count: number;
  workspace_count: number;
  last_activity: string;
  created_at: string;
  billing_status: 'active' | 'overdue' | 'suspended';
  settings: {
    analytics_retention_days: number;
    privacy_level: string;
    role_permissions: Record<string, string[]>;
  };
}

interface User {
  id: string;
  email: string;
  org_role: 'admin' | 'executive' | 'hr' | 'manager' | 'member';
  department: string;
  job_title: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
}

export default function OrganizationManagementPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockOrganizations: Organization[] = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Demo Enterprise Corp',
          domain: 'democorp.com',
          subscription_tier: 'enterprise',
          max_users: 500,
          max_workspaces: 50,
          analytics_enabled: true,
          user_count: 145,
          workspace_count: 12,
          last_activity: '2025-06-20T10:30:00Z',
          created_at: '2025-01-15T09:00:00Z',
          billing_status: 'active',
          settings: {
            analytics_retention_days: 365,
            privacy_level: 'enhanced',
            role_permissions: {
              executive: ['view_all_analytics', 'export_data', 'manage_users'],
              hr: ['view_hr_analytics', 'manage_interventions'],
              manager: ['view_team_analytics'],
              member: ['view_personal_analytics']
            }
          }
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'TechStart Inc',
          domain: 'techstart.io',
          subscription_tier: 'premium',
          max_users: 100,
          max_workspaces: 20,
          analytics_enabled: true,
          user_count: 78,
          workspace_count: 8,
          last_activity: '2025-06-19T16:45:00Z',
          created_at: '2025-03-10T14:30:00Z',
          billing_status: 'active',
          settings: {
            analytics_retention_days: 180,
            privacy_level: 'standard',
            role_permissions: {
              executive: ['view_all_analytics', 'export_data'],
              hr: ['view_hr_analytics'],
              manager: ['view_team_analytics'],
              member: ['view_personal_analytics']
            }
          }
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'SmallBiz Solutions',
          domain: 'smallbiz.com',
          subscription_tier: 'basic',
          max_users: 25,
          max_workspaces: 5,
          analytics_enabled: false,
          user_count: 12,
          workspace_count: 3,
          last_activity: '2025-06-18T11:20:00Z',
          created_at: '2025-05-01T10:00:00Z',
          billing_status: 'overdue',
          settings: {
            analytics_retention_days: 90,
            privacy_level: 'basic',
            role_permissions: {
              executive: ['view_all_analytics'],
              manager: ['view_team_analytics'],
              member: ['view_personal_analytics']
            }
          }
        }
      ];

      setOrganizations(mockOrganizations);
      toast.success(`Loaded ${mockOrganizations.length} organizations`);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationUsers = async (orgId: string) => {
    try {
      // Mock user data
      const mockUsers: User[] = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          email: 'ceo@democorp.com',
          org_role: 'executive',
          department: 'Executive',
          job_title: 'Chief Executive Officer',
          is_active: true,
          last_login_at: '2025-06-20T09:30:00Z',
          created_at: '2025-01-15T09:00:00Z'
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          email: 'hr@democorp.com',
          org_role: 'hr',
          department: 'Human Resources',
          job_title: 'HR Director',
          is_active: true,
          last_login_at: '2025-06-19T17:45:00Z',
          created_at: '2025-01-15T09:15:00Z'
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          email: 'manager@democorp.com',
          org_role: 'manager',
          department: 'Engineering',
          job_title: 'Engineering Manager',
          is_active: true,
          last_login_at: '2025-06-20T08:15:00Z',
          created_at: '2025-01-16T10:00:00Z'
        }
      ];

      setOrgUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load organization users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleSelectOrganization = (org: Organization) => {
    setSelectedOrg(org);
    loadOrganizationUsers(org.id);
  };

  const handleToggleAnalytics = async (orgId: string, enabled: boolean) => {
    try {
      // Update organization analytics setting
      setOrganizations(prev => 
        prev.map(org => 
          org.id === orgId 
            ? { ...org, analytics_enabled: enabled }
            : org
        )
      );

      toast.success(`Analytics ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Failed to toggle analytics:', error);
      toast.error('Failed to update analytics setting');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      setOrgUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, org_role: newRole as User['org_role'] }
            : user
        )
      );

      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || org.subscription_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const getSubscriptionBadgeColor = (tier: string) => {
    const colors = {
      'free': 'bg-gray-100 text-gray-800',
      'basic': 'bg-blue-100 text-blue-800',
      'premium': 'bg-purple-100 text-purple-800',
      'enterprise': 'bg-green-100 text-green-800'
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const getBillingStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'suspended': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Loading Organizations</h2>
          <p className="text-gray-600">Fetching organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
            <p className="text-gray-600">Manage enterprise customers and their analytics access</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Organization
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters and Search */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organizations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Organizations ({filteredOrganizations.length})</span>
                  <Building2 className="h-5 w-5 text-gray-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {filteredOrganizations.map((org) => (
                    <div
                      key={org.id}
                      onClick={() => handleSelectOrganization(org)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedOrg?.id === org.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{org.name}</h3>
                        {getBillingStatusIcon(org.billing_status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{org.domain}</p>
                      <div className="flex items-center justify-between">
                        <Badge className={getSubscriptionBadgeColor(org.subscription_tier)}>
                          {org.subscription_tier}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {org.user_count} users
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organization Details */}
          <div className="lg:col-span-2">
            {selectedOrg ? (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Users & Roles</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{selectedOrg.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSubscriptionBadgeColor(selectedOrg.subscription_tier)}>
                            {selectedOrg.subscription_tier}
                          </Badge>
                          {getBillingStatusIcon(selectedOrg.billing_status)}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-600">Users</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedOrg.user_count}
                          </p>
                          <p className="text-xs text-gray-500">
                            of {selectedOrg.max_users} max
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600">Workspaces</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedOrg.workspace_count}
                          </p>
                          <p className="text-xs text-gray-500">
                            of {selectedOrg.max_workspaces} max
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-4 w-4 text-purple-500" />
                            <span className="text-sm text-gray-600">Analytics</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedOrg.analytics_enabled ? 'ON' : 'OFF'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedOrg.settings.analytics_retention_days}d retention
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-gray-600">Activity</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(selectedOrg.last_activity).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">Last activity</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={() => handleToggleAnalytics(selectedOrg.id, !selectedOrg.analytics_enabled)}
                            variant={selectedOrg.analytics_enabled ? "destructive" : "default"}
                            size="sm"
                          >
                            {selectedOrg.analytics_enabled ? 'Disable' : 'Enable'} Analytics
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Organization
                          </Button>
                          <Button variant="outline" size="sm">
                            View Analytics Dashboard
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Users & Role Management</CardTitle>
                      <p className="text-sm text-gray-600">
                        Manage user roles and permissions for {selectedOrg.name}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orgUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <p className="font-medium text-gray-900">{user.email}</p>
                                  <p className="text-sm text-gray-600">{user.job_title} • {user.department}</p>
                                </div>
                                <Badge variant={user.is_active ? "default" : "secondary"}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <select
                                value={user.org_role}
                                onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="member">Member</option>
                                <option value="manager">Manager</option>
                                <option value="hr">HR</option>
                                <option value="executive">Executive</option>
                                <option value="admin">Admin</option>
                              </select>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Analytics Enabled</h4>
                            <p className="text-sm text-gray-600">Allow this organization to access behavioral analytics</p>
                          </div>
                          <button
                            onClick={() => handleToggleAnalytics(selectedOrg.id, !selectedOrg.analytics_enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              selectedOrg.analytics_enabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                selectedOrg.analytics_enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Data Retention</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Analytics data is retained for {selectedOrg.settings.analytics_retention_days} days
                          </p>
                          <select className="px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="90">90 days</option>
                            <option value="180">180 days</option>
                            <option value="365">1 year</option>
                            <option value="730">2 years</option>
                          </select>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Privacy Level</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Current level: {selectedOrg.settings.privacy_level}
                          </p>
                          <select className="px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="basic">Basic (K=3)</option>
                            <option value="standard">Standard (K=5)</option>
                            <option value="enhanced">Enhanced (K=8)</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Organization Name
                          </label>
                          <input
                            type="text"
                            value={selectedOrg.name}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Domain
                          </label>
                          <input
                            type="text"
                            value={selectedOrg.domain}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subscription Tier
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-4">
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Save Changes
                          </Button>
                          <Button variant="outline">
                            Reset to Defaults
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Organization Selected</h3>
                    <p className="text-gray-600">Select an organization from the list to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}