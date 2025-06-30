'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SecurityDashboard } from './SecurityDashboard';
import { RolesPermissionsManager } from './RolesPermissionsManager';
import { adminGet, adminPost } from '@/lib/admin-api';
import {
  Users,
  User,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  Lock,
  Unlock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  MoreVertical,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

// User Management Types
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  job_title: string;
  department: string;
  phone_number: string;
  profile_image_url: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  timezone: string;
  locale: string;
  login_count: number;
  failed_login_attempts: number;
  organization_id: string;
}

interface UserActivity {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  timestamp: string;
  action_category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
}

interface Organization {
  id: string;
  name: string;
  domain: string;
  user_count: number;
  subscription_tier: string;
}


export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch users and activity from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch users and activity in parallel
        const [usersResponse, activityResponse] = await Promise.all([
          adminGet('/api/admin/users'),
          adminGet('/api/admin/activity-logs')
        ]);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.success) {
            setUsers(usersData.data);
          } else {
            setError('Failed to load users');
          }
        } else {
          setError('Failed to fetch users');
        }

        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          if (activityData.success && activityData.data) {
            // Transform the API response to match our interface
            const transformedActivity = (activityData.data.logs || []).map((log: any) => ({
              id: log.id,
              user_id: log.user_id,
              user_email: log.user_email || 'Unknown User',
              user_name: log.user_name || log.user_email || 'Unknown User',
              action: log.action,
              resource_type: log.resource_type,
              resource_id: log.resource_id,
              details: log.details || 'No details available',
              ip_address: log.ip_address,
              user_agent: log.user_agent,
              success: log.success !== false,
              timestamp: log.timestamp || log.created_at,
              action_category: log.action_category || 'System',
              severity: log.severity || 'medium'
            }));
            setActivity(transformedActivity);
          } else {
            console.warn('Activity logs API returned no data:', activityData);
          }
        } else {
          console.warn('Failed to fetch activity logs:', activityResponse.status);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique departments for filter
  const departments = [...new Set(users.map(u => u.department).filter(Boolean))];

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.job_title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment;
    
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  // Handle user status changes
  const handleStatusChange = async (userId: string, newStatus: User['status']) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, status: newStatus, updated_at: new Date().toISOString() }
            : u
        ));
        toast({ title: `User ${newStatus} successfully` });
      } else {
        toast({ title: "Error updating user status", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error updating user status", variant: "destructive" });
    }
  };

  // Handle role changes
  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: userId, 
          new_role: newRole 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(users.map(u => 
            u.id === userId 
              ? { ...u, role: newRole, updated_at: new Date().toISOString() }
              : u
          ));
          toast({ title: "User role updated successfully" });
        } else {
          toast({ title: "Error updating user role", variant: "destructive" });
        }
      } else {
        toast({ title: "Error updating user role", variant: "destructive" });
      }
    } catch (error) {
      console.error('Role change error:', error);
      toast({ title: "Error updating user role", variant: "destructive" });
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        toast({ title: "User deleted successfully" });
      } else {
        toast({ title: "Error deleting user", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error deleting user", variant: "destructive" });
    }
  };

  // Handle role configuration
  const handleRoleConfiguration = (role: string) => {
    toast({ 
      title: "Role Configuration", 
      description: `Role configuration for ${role} will be available soon.`
    });
  };

  // Handle security settings
  const handleSecuritySetting = async (setting: string) => {
    try {
      switch (setting) {
        case 'require_mfa':
          const mfaResponse = await adminPost('/api/admin/mfa-management', {
            action: 'update_settings',
            settings: { require_all_users_mfa: true }
          });
          if (mfaResponse.ok) {
            toast({ title: "MFA Enabled", description: "Two-factor authentication is now required for all users." });
          } else {
            toast({ title: "Error", description: "Failed to enable MFA requirement.", variant: "destructive" });
          }
          break;
        
        case 'ip_allowlist':
          // Navigate to security tab to configure IP allowlist
          setActiveTab('security');
          toast({ title: "IP Allowlist", description: "Configure IP allowlist in the Security tab." });
          break;
        
        case 'session_timeout':
          const sessionResponse = await adminPost('/api/admin/security-policies', {
            name: 'Session Timeout Policy',
            policy_type: 'session',
            rules: { timeout_minutes: 30, idle_timeout: 15 },
            status: 'active'
          });
          if (sessionResponse.ok) {
            toast({ title: "Session Timeout", description: "Session timeout policies have been configured." });
          } else {
            toast({ title: "Error", description: "Failed to configure session timeout.", variant: "destructive" });
          }
          break;
        
        default:
          toast({ title: "Feature Coming Soon", description: `${setting.replace('_', ' ')} configuration will be available soon.` });
      }
    } catch (error) {
      console.error('Error configuring security setting:', error);
      toast({ title: "Error", description: "Failed to configure security setting.", variant: "destructive" });
    }
  };

  // Handle onboarding settings
  const handleOnboardingSetting = (setting: string) => {
    toast({ 
      title: "Onboarding Settings", 
      description: `${setting.replace('_', ' ')} configuration will be available soon.`
    });
  };

  // Calculate metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingUsers = users.filter(u => u.status === 'pending').length;
  const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'owner').length;

  // Get role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'manager': return 'outline';
      default: return 'outline';
    }
  };

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'inactive': return 'outline';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for your organization
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedUser(null);
            setIsEditing(true);
          }}
          className="flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(totalUsers * 0.15)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((activeUsers / totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Admin & owner roles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              ) : null}
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={user.profile_image_url} alt={user.display_name} />
                        <AvatarFallback>
                          {user.first_name[0]}{user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{user.display_name}</h4>
                          {user.role === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                          {user.two_factor_enabled && <Shield className="h-4 w-4 text-green-500" />}
                          {!user.email_verified && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{user.job_title}</span>
                          <span>•</span>
                          <span>{user.department}</span>
                          {user.last_login_at && (
                            <>
                              <span>•</span>
                              <span>Last login: {new Date(user.last_login_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="min-w-[100px]">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole as User['role'])}
                          disabled={user.role === 'owner'}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">
                              <span className="flex items-center space-x-2">
                                <Eye className="h-3 w-3" />
                                <span>Viewer</span>
                              </span>
                            </SelectItem>
                            <SelectItem value="member">
                              <span className="flex items-center space-x-2">
                                <User className="h-3 w-3" />
                                <span>Member</span>
                              </span>
                            </SelectItem>
                            <SelectItem value="manager">
                              <span className="flex items-center space-x-2">
                                <Users className="h-3 w-3" />
                                <span>Manager</span>
                              </span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center space-x-2">
                                <Shield className="h-3 w-3" />
                                <span>Admin</span>
                              </span>
                            </SelectItem>
                            <SelectItem value="owner" disabled>
                              <span className="flex items-center space-x-2">
                                <Crown className="h-3 w-3" />
                                <span>Owner</span>
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditing(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {user.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'inactive')}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'active')}
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {user.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 w-48 bg-gray-200 rounded animate-pulse mb-1"></div>
                          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No users found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Add your first user to get started'}
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedUser(null);
                      setIsEditing(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <RolesPermissionsManager />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent user activity and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activity.length > 0 ? (
                  <div className="space-y-4">
                    {activity.map((log) => {
                      return (
                        <div key={log.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {log.user_name ? log.user_name.split(' ').map(n => n[0]).join('') : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{log.user_name || 'Unknown User'}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.action_category}
                              </Badge>
                              <Badge variant={log.severity === 'high' || log.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                                {log.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{log.details}</p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>{log.ip_address || 'Unknown IP'}</span>
                              <span>•</span>
                              <span>{log.user_agent ? log.user_agent.slice(0, 50) + '...' : 'Unknown Device'}</span>
                              <span>•</span>
                              <span>{new Date(log.timestamp || log.created_at || new Date()).toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
                              {log.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  }</div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure organization-wide security policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Require Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Force all users to enable 2FA</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleSecuritySetting('require_mfa')}>
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Password Policy</h4>
                    <p className="text-sm text-muted-foreground">Set minimum password requirements</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleSecuritySetting('password_policy')}>
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Session Management</h4>
                    <p className="text-sm text-muted-foreground">Configure session timeouts and limits</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleSecuritySetting('session_management')}>
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Failed Login Protection</h4>
                    <p className="text-sm text-muted-foreground">Account lockout after failed attempts</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleSecuritySetting('failed_login_protection')}>
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Onboarding</CardTitle>
                <CardDescription>
                  Configure how new users are invited and onboarded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Invitations</h4>
                    <p className="text-sm text-muted-foreground">Customize invitation email templates</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOnboardingSetting('email_invitations')}>
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Welcome Flow</h4>
                    <p className="text-sm text-muted-foreground">Set up onboarding steps for new users</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOnboardingSetting('welcome_flow')}>
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Default Permissions</h4>
                    <p className="text-sm text-muted-foreground">Set default role for new users</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOnboardingSetting('default_permissions')}>
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Organization Settings</h4>
                    <p className="text-sm text-muted-foreground">General organization configuration</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOnboardingSetting('organization_settings')}>
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Editor Modal */}
      {isEditing && (
        <UserEditor
          user={selectedUser}
          onSave={async (userData) => {
            try {
              if (selectedUser) {
                // Update existing user
                const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(userData),
                });

                if (response.ok) {
                  setUsers(users.map(u => 
                    u.id === selectedUser.id 
                      ? { ...u, ...userData, updated_at: new Date().toISOString() }
                      : u
                  ));
                  toast({ title: "User updated successfully" });
                } else {
                  toast({ title: "Error updating user", variant: "destructive" });
                  return;
                }
              } else {
                // Create new user
                const response = await fetch('/api/admin/users', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(userData),
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.data) {
                    // Add the new user to the local state immediately
                    const newUser = {
                      ...userData,
                      id: data.data.id || `temp-${Date.now()}`,
                      status: data.data.status || 'pending',
                      created_at: data.data.created_at || new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      email_verified: false,
                      two_factor_enabled: false,
                      last_login_at: null,
                      login_count: 0,
                      failed_login_attempts: 0,
                      profile_image_url: '',
                      organization_id: ''
                    };
                    
                    setUsers([...users, newUser]);
                    toast({ title: "User created successfully" });
                    
                    // Also refresh the list in the background to sync with server
                    setTimeout(async () => {
                      try {
                        const usersResponse = await fetch('/api/admin/users');
                        if (usersResponse.ok) {
                          const usersData = await usersResponse.json();
                          if (usersData.success && usersData.data) {
                            setUsers(usersData.data);
                          }
                        }
                      } catch (error) {
                        console.warn('Background refresh failed:', error);
                      }
                    }, 1000);
                  } else {
                    toast({ title: "Error creating user", variant: "destructive" });
                    return;
                  }
                } else {
                  const errorData = await response.json().catch(() => ({}));
                  console.error('User creation failed:', response.status, errorData);
                  toast({ 
                    title: "Error creating user", 
                    description: errorData.error || `Server error: ${response.status}`,
                    variant: "destructive" 
                  });
                  return;
                }
              }
            } catch (error) {
              toast({ title: "Error saving user", variant: "destructive" });
              return;
            }
            setIsEditing(false);
            setSelectedUser(null);
          }}
          onCancel={() => {
            setIsEditing(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

// User Editor Component
interface UserEditorProps {
  user: User | null;
  onSave: (user: Partial<User>) => void;
  onCancel: () => void;
}

function UserEditor({ user, onSave, onCancel }: UserEditorProps) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    job_title: user?.job_title || '',
    department: user?.department || '',
    phone_number: user?.phone_number || '',
    role: user?.role || 'member',
    timezone: user?.timezone || 'America/New_York',
    locale: user?.locale || 'en-US'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      display_name: `${formData.first_name} ${formData.last_name}`,
      email_verified: !user ? false : user.email_verified,
      two_factor_enabled: !user ? false : user.two_factor_enabled,
      last_login_at: user?.last_login_at || null,
      profile_image_url: user?.profile_image_url || ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {user ? 'Edit User' : 'Add New User'}
          </h3>
          <Button variant="ghost" onClick={onCancel}>✕</Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as User['role'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {user ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}