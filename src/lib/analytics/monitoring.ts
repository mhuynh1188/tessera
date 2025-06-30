// Analytics Performance Monitoring and Error Handling
import { performance } from 'perf_hooks';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AnalyticsMonitoring {
  private metrics: PerformanceMetric[] = [];
  private alertThresholds: AlertThreshold[] = [
    { metric: 'query_duration', threshold: 5000, severity: 'high' },
    { metric: 'api_response_time', threshold: 3000, severity: 'medium' },
    { metric: 'cache_miss_rate', threshold: 0.8, severity: 'medium' },
    { metric: 'error_rate', threshold: 0.05, severity: 'critical' }
  ];

  async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const timestamp = Date.now();
    
    try {
      console.log(`🔍 Starting operation: ${operationName}`, metadata);
      
      const result = await operation();
      const duration = performance.now() - startTime;
      
      // Record successful metric
      this.recordMetric({
        operation: operationName,
        duration,
        timestamp,
        success: true,
        metadata
      });

      // Check performance thresholds
      await this.checkThresholds(operationName, duration);
      
      console.log(`✅ Completed operation: ${operationName} in ${duration.toFixed(2)}ms`);
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Record failed metric
      this.recordMetric({
        operation: operationName,
        duration,
        timestamp,
        success: false,
        error: errorMessage,
        metadata
      });

      // Alert on error
      await this.sendAlert('error_occurred', {
        operation: operationName,
        error: errorMessage,
        duration,
        metadata
      });

      console.error(`❌ Failed operation: ${operationName} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    // Send to external monitoring if configured
    if (process.env.MONITORING_ENDPOINT) {
      this.sendToExternalMonitoring(metric).catch(console.error);
    }
  }

  private async checkThresholds(operation: string, duration: number): Promise<void> {
    const queryThreshold = this.alertThresholds.find(t => t.metric === 'query_duration');
    
    if (queryThreshold && duration > queryThreshold.threshold) {
      await this.sendAlert('slow_query', {
        operation,
        duration,
        threshold: queryThreshold.threshold,
        severity: queryThreshold.severity
      });
    }
  }

  async sendAlert(type: string, details: Record<string, any>): Promise<void> {
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      details,
      environment: process.env.NODE_ENV || 'development'
    };

    console.warn(`🚨 Alert: ${type}`, alert);

    // Send to monitoring service
    if (process.env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      } catch (error) {
        console.error('Failed to send alert to webhook:', error);
      }
    }

    // Log to database for audit trail
    if (process.env.DATABASE_URL) {
      try {
        await this.logAlertToDatabase(alert);
      } catch (error) {
        console.error('Failed to log alert to database:', error);
      }
    }
  }

  private async sendToExternalMonitoring(metric: PerformanceMetric): Promise<void> {
    try {
      await fetch(process.env.MONITORING_ENDPOINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'hex-app-analytics',
          metric: metric.operation,
          value: metric.duration,
          timestamp: metric.timestamp,
          success: metric.success,
          tags: {
            environment: process.env.NODE_ENV,
            ...metric.metadata
          }
        })
      });
    } catch (error) {
      console.error('Failed to send metric to external monitoring:', error);
    }
  }

  private async logAlertToDatabase(alert: any): Promise<void> {
    // This would integrate with your database logging
    // For now, just console log in structured format
    console.log('DB_ALERT_LOG:', JSON.stringify(alert));
  }

  getMetrics(timeWindow: number = 3600000): PerformanceMetric[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  getPerformanceStats(operation?: string): {
    count: number;
    avgDuration: number;
    successRate: number;
    p95Duration: number;
    errorCount: number;
  } {
    const filteredMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return { count: 0, avgDuration: 0, successRate: 0, p95Duration: 0, errorCount: 0 };
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successCount = filteredMetrics.filter(m => m.success).length;
    const errorCount = filteredMetrics.length - successCount;

    return {
      count: filteredMetrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      successRate: successCount / filteredMetrics.length,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      errorCount
    };
  }
}

// Enhanced error handling for analytics operations
export class AnalyticsErrorHandler {
  static async handleDatabaseError(error: any, context: string): Promise<never> {
    const enhancedError = new AnalyticsError(
      `Database operation failed in ${context}`,
      'DATABASE_ERROR',
      error,
      {
        context,
        timestamp: new Date().toISOString(),
        severity: 'high'
      }
    );

    // Log structured error
    console.error('Analytics Database Error:', {
      context,
      originalError: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    throw enhancedError;
  }

  static async handlePrivacyViolation(details: string, context: string): Promise<never> {
    const enhancedError = new AnalyticsError(
      `Privacy violation detected: ${details}`,
      'PRIVACY_VIOLATION',
      null,
      {
        context,
        details,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      }
    );

    // Log privacy violation for audit
    console.error('Privacy Violation Alert:', {
      context,
      details,
      timestamp: new Date().toISOString(),
      requires_audit: true
    });

    throw enhancedError;
  }

  static async handleRoleAccessDenied(userId: string, role: string, resource: string): Promise<never> {
    const enhancedError = new AnalyticsError(
      `Access denied for role ${role} to resource ${resource}`,
      'ACCESS_DENIED',
      null,
      {
        userId,
        role,
        resource,
        timestamp: new Date().toISOString(),
        severity: 'medium'
      }
    );

    // Log access attempt for security audit
    console.warn('Access Denied:', {
      userId,
      role,
      resource,
      timestamp: new Date().toISOString(),
      requires_security_review: true
    });

    throw enhancedError;
  }
}

export class AnalyticsError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      timestamp: new Date().toISOString()
    };
  }
}

// Circuit breaker for external dependencies
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private maxFailures: number = 5,
    private resetTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.maxFailures) {
      this.state = 'open';
    }
  }
}

// Global monitoring instance
export const analyticsMonitoring = new AnalyticsMonitoring();

// Performance tracking decorator
export function trackPerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return analyticsMonitoring.trackOperation(
        `${target.constructor.name}.${operationName}`,
        () => method.apply(this, args),
        { args: args.length }
      );
    };
  };
}

// Usage example:
/*
export class AnalyticsService {
  @trackPerformance('getBehaviorPatterns')
  async getBehaviorPatterns(orgId: string) {
    // Implementation here
  }
}
*/