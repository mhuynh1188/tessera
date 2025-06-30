'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  Settings,
  Activity,
  UserPlus,
  UserX,
  Key,
  Clock,
  Globe,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Eye,
  Lock,
  Unlock,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnterpriseUser {
  id: string;
  email: string;
  name?: string;
  org_role: string;
  department?: string;
  job_title?: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'locked';
  two_factor_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  failed_login_attempts: number;
}

interface SecurityEvent {
  id: string;
  user_id?: string;
  user_email?: string;
  event_type: string;
  event_category: string;
  event_description: string;
  risk_score: number;
  ip_address?: string;
  success: boolean;
  created_at: string;
}

interface OrganizationStats {
  total_users: number;
  active_users: number;
  users_with_2fa: number;
  locked_accounts: number;
  recent_logins: number;
  failed_logins_today: number;
}

export function EnterpriseAdminDashboard() {
  const [users, setUsers] = useState<EnterpriseUser[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<EnterpriseUser | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, these would be separate API calls
      // For now, we'll use mock data to demonstrate the interface
      
      // Mock user data
      const mockUsers: EnterpriseUser[] = [
        {
          id: '1',
          email: 'john.doe@company.com',
          name: 'John Doe',
          org_role: 'admin',
          department: 'Engineering',
          job_title: 'Senior Developer',
          account_status: 'active',
          two_factor_enabled: true,
          last_login_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          failed_login_attempts: 0
        },
        {
          id: '2',
          email: 'jane.smith@company.com',
          name: 'Jane Smith',
          org_role: 'manager',
          department: 'Marketing',
          job_title: 'Marketing Manager',
          account_status: 'active',
          two_factor_enabled: false,
          last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
          failed_login_attempts: 0
        },
        {
          id: '3',
          email: 'bob.wilson@company.com',
          name: 'Bob Wilson',
          org_role: 'member',
          department: 'Sales',
          job_title: 'Sales Representative',
          account_status: 'locked',
          two_factor_enabled: false,
          last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
          failed_login_attempts: 5
        }
      ];

      // Mock security events
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          user_id: '1',
          user_email: 'john.doe@company.com',
          event_type: 'login_success',
          event_category: 'authentication',
          event_description: 'Successful login',
          risk_score: 0,
          ip_address: '192.168.1.100',
          success: true,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: '2',
          user_id: '3',
          user_email: 'bob.wilson@company.com',
          event_type: 'login_failed',
          event_category: 'authentication',
          event_description: 'Failed login attempt - invalid password',
          risk_score: 40,
          ip_address: '203.0.113.15',
          success: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          id: '3',
          user_id: '2',
          user_email: 'jane.smith@company.com',
          event_type: '2fa_setup_initiated',
          event_category: 'authentication',
          event_description: 'User initiated 2FA setup',
          risk_score: -5,
          success: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
        }
      ];

      // Mock stats
      const mockStats: OrganizationStats = {
        total_users: 3,
        active_users: 2,
        users_with_2fa: 1,
        locked_accounts: 1,
        recent_logins: 2,
        failed_logins_today: 3
      };

      setUsers(mockUsers);
      setSecurityEvents(mockEvents);
      setStats(mockStats);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      // In a real implementation, this would call the appropriate API
      console.log(`${action} user ${userId}`);
      
      toast({
        title: "Success",
        description: `User ${action} successfully`
      });
      
      // Refresh data
      await fetchDashboardData();
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} user`,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'locked':
        return <Badge variant="destructive">Locked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (score: number) => {
    if (score <= 10) return <Badge variant="default" className="bg-green-500">Low</Badge>;
    if (score <= 50) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="destructive">High</Badge>;
  };

  const filteredUsers = users.filter(user => {
    if (userFilter === 'all') return true;
    if (userFilter === 'active') return user.account_status === 'active';
    if (userFilter === 'locked') return user.account_status === 'locked';
    if (userFilter === 'no_2fa') return !user.two_factor_enabled;
    return true;
  });

  const filteredEvents = securityEvents.filter(event => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'failed') return !event.success;
    if (eventFilter === 'high_risk') return event.risk_score > 50;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Admin</h1>
          <p className="text-muted-foreground">
            Manage users, monitor security, and configure organization settings
          </p>
        </div>
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_users}</p>
                </div>
                <Activity className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With 2FA</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.users_with_2fa}</p>
                </div>
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Locked</p>
                  <p className="text-2xl font-bold text-red-600">{stats.locked_accounts}</p>
                </div>
                <Lock className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recent Logins</p>
                  <p className="text-2xl font-bold">{stats.recent_logins}</p>
                </div>
                <Clock className="h-6 w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed Today</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.failed_logins_today}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="settings">Organization Settings</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="locked">Locked Accounts</SelectItem>
                  <SelectItem value="no_2fa">Without 2FA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{user.name || user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} • {user.department} • {user.job_title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(user.account_status)}
                          <Badge variant="outline">{user.org_role}</Badge>
                          {user.two_factor_enabled && (
                            <Badge variant="default" className="bg-blue-500">
                              <Shield className="h-3 w-3 mr-1" />
                              2FA
                            </Badge>
                          )}
                          {user.failed_login_attempts > 0 && (
                            <Badge variant="destructive">
                              {user.failed_login_attempts} failed attempts
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Last login:</div>
                        <div>
                          {user.last_login_at ? 
                            new Date(user.last_login_at).toLocaleDateString() : 
                            'Never'
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {user.account_status === 'locked' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'unlock')}
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'lock')}
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="failed">Failed Only</SelectItem>
                  <SelectItem value="high_risk">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Logs
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Security Events ({filteredEvents.length})</CardTitle>
              <CardDescription>
                Monitor authentication events and security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.event_description}</span>
                        {getRiskBadge(event.risk_score)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>{event.user_email || 'Unknown user'}</span>
                        {event.ip_address && <span> • {event.ip_address}</span>}
                        <span> • {new Date(event.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={event.success ? "default" : "destructive"}>
                        {event.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Policy
                </CardTitle>
                <CardDescription>
                  Configure organization-wide security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Password Requirements</Label>
                  <div className="text-sm text-muted-foreground">
                    • Minimum 12 characters<br/>
                    • Uppercase, lowercase, numbers, symbols<br/>
                    • No reuse of last 5 passwords
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Two-Factor Authentication</Label>
                  <div className="text-sm text-muted-foreground">
                    • Required for administrators<br/>
                    • Optional for regular users
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Session Management</Label>
                  <div className="text-sm text-muted-foreground">
                    • Maximum 3 concurrent sessions<br/>
                    • 30 minute idle timeout<br/>
                    • 8 hour absolute timeout
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  Configure Security Policy
                </Button>
              </CardContent>
            </Card>

            {/* SSO Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Single Sign-On
                </CardTitle>
                <CardDescription>
                  Configure enterprise identity providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No SSO providers configured</p>
                  <p className="text-sm">Connect your organization's identity provider</p>
                </div>
                
                <Button variant="outline" className="w-full">
                  Configure SSO
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user account information
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <div className="font-medium">{selectedUser.name || 'Not provided'}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="font-medium">{selectedUser.email}</div>
                </div>
                <div>
                  <Label>Department</Label>
                  <div className="font-medium">{selectedUser.department || 'Not assigned'}</div>
                </div>
                <div>
                  <Label>Job Title</Label>
                  <div className="font-medium">{selectedUser.job_title || 'Not provided'}</div>
                </div>
                <div>
                  <Label>Role</Label>
                  <Badge variant="outline">{selectedUser.org_role}</Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  {getStatusBadge(selectedUser.account_status)}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline">Edit User</Button>
                <Button variant="outline">Reset Password</Button>
                <Button variant="outline">View Activity</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}