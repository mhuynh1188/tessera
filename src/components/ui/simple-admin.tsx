'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmailTemplateManager } from '@/components/admin/EmailTemplateManager';
import { UserManager } from '@/components/admin/UserManager';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';
import { adminGet } from '@/lib/admin-api';
import {
  BarChart3,
  Users,
  Mail,
  Shield,
  Activity,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Server,
  Database,
  Wifi
} from 'lucide-react';

// Real data interfaces
interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  emailsSentToday: number;
  totalEmailsToday: number;
  securityScore: number;
  uptime: string;
  healthStatus: string;
  activeSessions: number;
  failedLogins: number;
  mfaAdoptionRate: number;
  userGrowthRate: number;
  trends: {
    users: 'up' | 'down' | 'stable';
    emails: 'up' | 'down' | 'stable';
    security: 'up' | 'down' | 'stable';
  };
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  user: string;
  timestamp: string;
  severity: string;
  success: boolean;
}

interface SystemService {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  response: string;
  details: string;
}

export function SimpleAdminInterface() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [statsResponse, activityResponse, statusResponse] = await Promise.all([
          adminGet('/api/admin/stats'),
          adminGet('/api/admin/activity'),
          adminGet('/api/admin/system-status')
        ]);

        // Handle stats
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success) {
            setDashboardMetrics(statsData.data);
          }
        }

        // Handle activity
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          if (activityData.success) {
            setRecentActivity(activityData.data);
          }
        }

        // Handle system status
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.success) {
            setSystemStatus(statusData.data.services);
          }
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: string, severity: string) => {
    switch (type) {
      case 'user_login':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'security':
        return severity === 'warning' ? 
          <AlertTriangle className="h-4 w-4 text-orange-600" /> :
          <Shield className="h-4 w-4 text-green-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge variant="default" className="bg-green-100 text-green-800">Operational</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'outage':
        return <Badge variant="destructive">Outage</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive administration dashboard for managing your platform
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Metrics */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          ) : dashboardMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics.userGrowthRate > 0 ? '+' : ''}{dashboardMetrics.userGrowthRate}% this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics.totalUsers > 0 
                      ? ((dashboardMetrics.activeUsers / dashboardMetrics.totalUsers) * 100).toFixed(1)
                      : 0}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Emails Today</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics.emailsSentToday.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics.totalEmailsToday} total queued
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    dashboardMetrics.securityScore > 80 ? 'text-green-600' :
                    dashboardMetrics.securityScore > 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {dashboardMetrics.securityScore}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics.securityScore > 80 ? 'Excellent' :
                     dashboardMetrics.securityScore > 60 ? 'Good' : 'Needs attention'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{dashboardMetrics.uptime}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    dashboardMetrics.healthStatus === 'excellent' ? 'text-green-600' :
                    dashboardMetrics.healthStatus === 'good' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {dashboardMetrics.healthStatus === 'excellent' ? 'Excellent' :
                     dashboardMetrics.healthStatus === 'good' ? 'Good' : 'Poor'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {systemStatus.filter(s => s.status === 'operational').length} of {systemStatus.length} services up
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('email')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>Email Management</span>
                </CardTitle>
                <CardDescription>
                  Create and manage email templates, campaigns, and testing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email templates & campaigns</span>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('users')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {dashboardMetrics ? `${dashboardMetrics.totalUsers} total users` : 'Loading...'}
                  </span>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('security')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>
                  Monitor security events and configure policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {dashboardMetrics ? `Score: ${dashboardMetrics.securityScore}%` : 'Loading...'}
                  </span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and user activities</CardDescription>
              </CardHeader>
              <CardContent>
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
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type, activity.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {activity.message}
                          </p>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{activity.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Real-time status of all services</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {systemStatus.map((service) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {service.name === 'API Server' && <Server className="h-4 w-4 text-muted-foreground" />}
                          {service.name === 'Database' && <Database className="h-4 w-4 text-muted-foreground" />}
                          {service.name === 'Email Service' && <Mail className="h-4 w-4 text-muted-foreground" />}
                          {service.name === 'Auth Service' && <Shield className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{service.response}</span>
                          {getStatusBadge(service.status)}
                        </div>
                      </div>
                    ))}
                    {systemStatus.length === 0 && !loading && (
                      <div className="text-center py-8">
                        <Server className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">No system status available</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManager />
        </TabsContent>

        <TabsContent value="email">
          <EmailTemplateManager />
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}