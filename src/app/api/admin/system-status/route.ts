import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user, organizationId } = authResult;
    const supabase = createClient();

    const services = [];
    const startTime = Date.now();

    // Test Database Connection
    try {
      const dbStart = Date.now();
      const { error: dbError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      const dbResponse = Date.now() - dbStart;
      
      services.push({
        name: 'Database',
        status: dbError ? 'degraded' : 'operational',
        response: `${dbResponse}ms`,
        details: dbError ? dbError.message : 'Connection successful'
      });
    } catch (error) {
      services.push({
        name: 'Database',
        status: 'outage',
        response: 'timeout',
        details: 'Database connection failed'
      });
    }

    // Test Email Service (check if email_queue table is accessible)
    try {
      const emailStart = Date.now();
      const { error: emailError } = await supabase
        .from('email_queue')
        .select('id')
        .limit(1);
      
      const emailResponse = Date.now() - emailStart;
      
      services.push({
        name: 'Email Service',
        status: emailError ? 'degraded' : 'operational',
        response: `${emailResponse}ms`,
        details: emailError ? 'Email queue not accessible' : 'Email system operational'
      });
    } catch (error) {
      services.push({
        name: 'Email Service',
        status: 'degraded',
        response: 'N/A',
        details: 'Email service check failed'
      });
    }

    // Test Authentication Service
    try {
      const authStart = Date.now();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authResponse = Date.now() - authStart;
      
      services.push({
        name: 'Auth Service',
        status: authError ? 'degraded' : 'operational',
        response: `${authResponse}ms`,
        details: authError ? 'Authentication issues detected' : 'Authentication working'
      });
    } catch (error) {
      services.push({
        name: 'Auth Service',
        status: 'outage',
        response: 'timeout',
        details: 'Authentication service unavailable'
      });
    }

    // Test API Server (this endpoint itself)
    const apiResponse = Date.now() - startTime;
    services.push({
      name: 'API Server',
      status: 'operational',
      response: `${apiResponse}ms`,
      details: 'API server responding normally'
    });

    // Calculate overall system health
    const operationalCount = services.filter(s => s.status === 'operational').length;
    const totalServices = services.length;
    const healthPercentage = Math.round((operationalCount / totalServices) * 100);
    
    let overallStatus = 'operational';
    if (healthPercentage < 50) {
      overallStatus = 'outage';
    } else if (healthPercentage < 100) {
      overallStatus = 'degraded';
    }

    // Get system uptime (simplified calculation based on service status)
    const uptimePercentage = healthPercentage >= 75 ? 99.9 : healthPercentage >= 50 ? 98.5 : 95.0;

    return NextResponse.json({
      success: true,
      data: {
        services,
        overall: {
          status: overallStatus,
          health_percentage: healthPercentage,
          uptime: `${uptimePercentage}%`,
          response_time: `${apiResponse}ms`,
          last_updated: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error checking system status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check system status',
      data: {
        services: [
          {
            name: 'API Server',
            status: 'outage',
            response: 'error',
            details: 'System status check failed'
          }
        ],
        overall: {
          status: 'outage',
          health_percentage: 0,
          uptime: '0%',
          response_time: 'error',
          last_updated: new Date().toISOString()
        }
      }
    }, { status: 500 });
  }
}