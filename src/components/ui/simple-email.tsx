'use client';

import React, { useState, useEffect } from 'react';

export function SimpleEmailInterface() {
  const [emailHealth, setEmailHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testName, setTestName] = useState('Test User');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkEmailHealth();
  }, []);

  const checkEmailHealth = async () => {
    try {
      const response = await fetch('/api/email/test');
      const data = await response.json();
      setEmailHealth(data);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
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
        alert('Test email queued successfully!');
      } else {
        alert('Failed to queue test email: ' + data.message);
      }
    } catch (error) {
      alert('Error sending test email: ' + error);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading email system...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Email System Management</h1>
        <p className="text-gray-600">
          Test and monitor your email system functionality
        </p>
      </div>

      {/* System Health */}
      <div className="bg-white border border-gray-200 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">System Health</h3>
        </div>
        <div className="p-6">
          {emailHealth ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="font-medium">Database Connection</div>
                <div className={`text-sm mt-1 ${emailHealth.database_connection === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {emailHealth.database_connection === 'success' ? '✅ Connected' : '❌ Failed'}
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="font-medium">SendGrid Configuration</div>
                <div className={`text-sm mt-1 ${emailHealth.sendgrid_configured ? 'text-green-600' : 'text-yellow-600'}`}>
                  {emailHealth.sendgrid_configured ? '✅ Configured' : '⚠️ Not configured'}
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="font-medium">Email Templates</div>
                <div className="text-sm mt-1 text-blue-600">
                  📧 {emailHealth.template_counts?.total_templates || 0} templates available
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-600">Unable to load health status</div>
          )}
        </div>
      </div>

      {/* Test Email */}
      <div className="bg-white border border-gray-200 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Send Test Email</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Test User"
              />
            </div>
          </div>
          
          <button
            onClick={sendTestEmail}
            disabled={testing || !testEmail}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>📧</span>
                <span>Send Test Email</span>
              </>
            )}
          </button>
          
          {emailHealth && !emailHealth.sendgrid_configured && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="text-yellow-800 text-sm">
                ⚠️ SendGrid not configured - emails will be queued but not sent. Add SENDGRID_API_KEY to your .env.local file.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-white border border-gray-200 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Environment Configuration</h3>
        </div>
        <div className="p-6">
          {emailHealth?.environment_variables && (
            <div className="space-y-2">
              {Object.entries(emailHealth.environment_variables).map(([key, status]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="font-mono text-sm">{key}</span>
                  <span className={`text-sm ${status === 'configured' ? 'text-green-600' : 'text-red-600'}`}>
                    {status === 'configured' ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="text-sm text-gray-700">
              <strong>To configure SendGrid:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Sign up at <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sendgrid.com</a></li>
                <li>Create an API key with "Mail Send" permissions</li>
                <li>Add to your .env.local file:</li>
              </ol>
              <pre className="mt-2 p-2 bg-gray-800 text-green-400 text-xs rounded font-mono">
{`SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your Company Name`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Available Templates */}
      {emailHealth?.system_templates && (
        <div className="bg-white border border-gray-200 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Available Email Templates</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {emailHealth.system_templates.map((template: any) => (
                <div key={template.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ID: {template.id.slice(0, 8)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}