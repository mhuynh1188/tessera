// Email System Status Component - for admin dashboard
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  Server, 
  Database,
  RefreshCw,
  Settings
} from 'lucide-react';

interface EmailSystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    scheduler: boolean;
    sendgrid: boolean;
    database: boolean;
  };
  timestamp: string;
}

interface EmailStats {
  queueStatus: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    sent_count: number;
    delivered_count: number;
    opened_count: number;
  }>;
  analyticsReports: Array<{
    id: string;
    name: string;
    frequency: string;
    last_run_at: string;
    is_enabled: boolean;
  }>;
}

export function EmailSystemStatus() {
  const [health, setHealth] = useState<EmailSystemHealth | null>(null);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/email/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch email health:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // This would need to be implemented as an API endpoint
      // For now, we'll use placeholder data
      setStats({
        queueStatus: {
          pending: 12,
          sending: 3,
          sent: 1847,
          failed: 2
        },
        recentCampaigns: [
          {
            id: '1',
            name: 'Weekly Newsletter',
            status: 'completed',
            sent_count: 150,
            delivered_count: 148,
            opened_count: 72
          }
        ],
        analyticsReports: [
          {
            id: '1',
            name: 'Weekly Health Report',
            frequency: 'weekly',
            last_run_at: new Date().toISOString(),
            is_enabled: true
          }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch email stats:', error);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchHealthStatus(), fetchStats()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchHealthStatus(), fetchStats()]);
      setLoading(false);
    };

    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'healthy' ? 'default' : 
                   status === 'degraded' ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading email system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email System Health</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {health && getStatusBadge(health.status)}
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            Overall status of the email delivery system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {health && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {health.services.scheduler ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="font-medium">Email Scheduler</div>
                  <div className="text-sm text-gray-500">
                    {health.services.scheduler ? 'Running' : 'Stopped'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {health.services.sendgrid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="font-medium">SendGrid</div>
                  <div className="text-sm text-gray-500">
                    {health.services.sendgrid ? 'Connected' : 'Not configured'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {health.services.database ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="font-medium">Database</div>
                  <div className="text-sm text-gray-500">
                    {health.services.database ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Queue Status */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Email Queue Status
            </CardTitle>
            <CardDescription>
              Current email processing queue status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {stats.queueStatus.pending}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.queueStatus.sending}
                </div>
                <div className="text-sm text-gray-500">Sending</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.queueStatus.sent}
                </div>
                <div className="text-sm text-gray-500">Sent</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {stats.queueStatus.failed}
                </div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Campaigns */}
      {stats && stats.recentCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>
              Latest email campaign performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-sm text-gray-500">
                      Status: {campaign.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {campaign.delivered_count}/{campaign.sent_count} delivered
                    </div>
                    <div className="text-sm text-gray-500">
                      {campaign.opened_count} opened (
                      {Math.round((campaign.opened_count / campaign.delivered_count) * 100)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Reports */}
      {stats && stats.analyticsReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics Reports</CardTitle>
            <CardDescription>
              Automated analytics report status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.analyticsReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-gray-500">
                      Frequency: {report.frequency}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.is_enabled ? 'default' : 'secondary'}>
                      {report.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      {report.last_run_at ? 
                        new Date(report.last_run_at).toLocaleDateString() : 
                        'Never run'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}