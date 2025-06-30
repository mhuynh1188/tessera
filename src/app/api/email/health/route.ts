// Email system health check endpoint
import { NextRequest, NextResponse } from 'next/server';
import { emailSystemManager } from '@/lib/email/email-system-init';

export async function GET(request: NextRequest) {
  try {
    const health = await emailSystemManager.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 206 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}