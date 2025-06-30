'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  Server, 
  Database,
  RefreshCw,
  Send,
  Loader2,
  Eye,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailSystemHealth {
  timestamp: string;
  database_connection: string;
  tables: Record<string, string>;
  template_counts: {
    total_templates: number;
    system_templates: number;
  };
  system_templates: Array<{
    id: string;
    name: string;
  }>;
  sendgrid_configured: boolean;
  environment_variables: Record<string, string>;
}

interface QueuedEmail {
  id: string;
  status: string;
  template_name: string;
  recipient_email: string;
  created_at: string;
  sent_at?: string;
  error_message?: string;
}

export function EmailTestingPanel() {
  const [health, setHealth] = useState<EmailSystemHealth | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueuedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Test email form
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testName, setTestName] = useState('Test User');
  
  const { toast } = useToast();

  useEffect(() => {
    checkEmailSystemHealth();
    checkEmailQueue();
  }, []);

  const checkEmailSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/test');
      const data = await response.json();
      
      if (response.ok) {
        setHealth(data);
      } else {
        throw new Error(data.message || 'Health check failed');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: "Error",
        description: "Failed to check email system health",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEmailQueue = async () => {
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_queue' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQueueStatus(data.queue_status || []);
      }
    } catch (error) {
      console.error('Failed to check email queue:', error);
    }
  };

  const sendTestEmail = async () => {
    try {
      setTesting(true);
      
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'queue_test_email',
          email: testEmail,
          name: testName
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Test email queued successfully!"
        });
        
        // Refresh queue status
        await checkEmailQueue();
      } else {
        throw new Error(data.message || 'Failed to queue test email');
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send test email',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([checkEmailSystemHealth(), checkEmailQueue()]);
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'configured':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success' || status === 'configured') {
      return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
    }
    if (status === 'error' || status === 'missing') {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="secondary">Warning</Badge>;
  };

  const getEmailStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-500">Sent</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'sending':
        return <Badge variant="default" className="bg-blue-500">Sending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Checking email system health...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email System Testing</h2>
          <p className="text-muted-foreground">
            Monitor email system health and test email functionality
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="test">Send Test Email</TabsTrigger>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          {health && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Health */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Database Health
                    </CardTitle>
                    {getStatusBadge(health.database_connection)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Connection</span>
                      {getStatusIcon(health.database_connection)}
                    </div>
                    
                    {Object.entries(health.tables).map(([table, status]) => (
                      <div key={table} className="flex items-center justify-between">
                        <span className="text-sm">{table}</span>
                        {getStatusIcon(status)}
                      </div>
                    ))}

                    <div className="pt-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        <div>Total Templates: {health.template_counts.total_templates}</div>
                        <div>System Templates: {health.template_counts.system_templates}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SendGrid Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      SendGrid Configuration
                    </CardTitle>
                    {getStatusBadge(health.sendgrid_configured ? 'configured' : 'missing')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(health.environment_variables).map(([variable, status]) => (
                      <div key={variable} className="flex items-center justify-between">
                        <span className="text-sm">{variable}</span>
                        {getStatusIcon(status)}
                      </div>
                    ))}

                    {!health.sendgrid_configured && (
                      <div className="pt-3 border-t">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Missing environment variables:</div>
                          <div className="font-mono text-xs bg-muted p-2 rounded">
                            SENDGRID_API_KEY=your_api_key<br/>
                            SENDGRID_FROM_EMAIL=noreply@yourdomain.com<br/>
                            SENDGRID_FROM_NAME=Your Company
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Templates */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Available System Templates</CardTitle>
                  <CardDescription>
                    Default email templates provided by the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {health.system_templates.map((template) => (
                      <div key={template.id} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {template.id.slice(0, 8)}...</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Test Email
              </CardTitle>
              <CardDescription>
                Queue a test email to verify the system is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-name">Test User Name</Label>
                  <Input
                    id="test-name"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Test User"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={sendTestEmail} 
                  disabled={testing || !testEmail}
                  className="flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
                
                {health && !health.sendgrid_configured && (
                  <div className="text-sm text-muted-foreground">
                    ⚠️ SendGrid not configured - emails will be queued but not sent
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                This will queue a test email using the "account_created" template. 
                Check the Email Queue tab to see the status.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Email Queue Status
                  </CardTitle>
                  <CardDescription>
                    Recent emails in the processing queue
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={checkEmailQueue}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Queue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {queueStatus.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No emails in queue
                </div>
              ) : (
                <div className="space-y-3">
                  {queueStatus.map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{email.template_name}</div>
                        <div className="text-sm text-muted-foreground">
                          To: {email.recipient_email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(email.created_at).toLocaleString()}
                          {email.sent_at && (
                            <span> • Sent: {new Date(email.sent_at).toLocaleString()}</span>
                          )}
                        </div>
                        {email.error_message && (
                          <div className="text-xs text-red-500 mt-1">
                            Error: {email.error_message}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getEmailStatusBadge(email.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}