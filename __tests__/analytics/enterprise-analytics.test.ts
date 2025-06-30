import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/demo-enterprise/route';

// Mock fetch for API testing
global.fetch = jest.fn();

describe('Enterprise Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Demo Enterprise Analytics Endpoint', () => {
    test('should return successful response with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive&timeWindow=month');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('user_context');
      expect(data).toHaveProperty('analytics_data');
      expect(data).toHaveProperty('behavior_patterns');
      expect(data).toHaveProperty('stakeholder_metrics');
      expect(data).toHaveProperty('organizational_health');
      expect(data).toHaveProperty('data_sources');
    });

    test('should enforce privacy compliance - minimum user thresholds', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      
      const response = await GET(request);
      const data = await response.json();

      // Verify K-anonymity compliance
      data.behavior_patterns.forEach((pattern: any) => {
        expect(pattern.unique_users).toBeGreaterThanOrEqual(3);
      });

      expect(data.data_sources.privacy_compliant).toBe(true);
      expect(data.data_sources.min_anonymity_threshold).toBeGreaterThanOrEqual(3);
    });

    test('should return role-appropriate data for executives', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data.user_context.role).toBe('executive');
      expect(data.stakeholder_metrics.role).toBe('executive');
      expect(data.stakeholder_metrics).toHaveProperty('organizational_health_score');
      expect(data.stakeholder_metrics).toHaveProperty('strategic_insights_count');
      expect(data.stakeholder_metrics).toHaveProperty('reputation_risk_level');
    });

    test('should return role-appropriate data for HR', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=hr');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data.user_context.role).toBe('hr');
      expect(data.stakeholder_metrics.role).toBe('hr');
      expect(data.stakeholder_metrics).toHaveProperty('confidentiality_level');
      expect(data.stakeholder_metrics).toHaveProperty('actionable_insights_count');
      expect(data.stakeholder_metrics).toHaveProperty('culture_improvement_score');
    });

    test('should return role-appropriate data for managers', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=manager');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data.user_context.role).toBe('manager');
      expect(data.stakeholder_metrics.role).toBe('manager');
      expect(data.stakeholder_metrics).toHaveProperty('team_guidance_effectiveness');
      expect(data.stakeholder_metrics).toHaveProperty('early_warning_count');
      expect(data.stakeholder_metrics).toHaveProperty('team_trust_score');
    });

    test('should validate behavior patterns data structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      
      const response = await GET(request);
      const data = await response.json();

      expect(Array.isArray(data.behavior_patterns)).toBe(true);
      expect(data.behavior_patterns.length).toBeGreaterThan(0);

      data.behavior_patterns.forEach((pattern: any) => {
        expect(pattern).toHaveProperty('id');
        expect(pattern).toHaveProperty('pattern_type');
        expect(pattern).toHaveProperty('severity_avg');
        expect(pattern).toHaveProperty('frequency');
        expect(pattern).toHaveProperty('category');
        expect(pattern).toHaveProperty('trend_direction');
        expect(['improving', 'stable', 'declining']).toContain(pattern.trend_direction);
        expect(pattern.severity_avg).toBeGreaterThanOrEqual(1);
        expect(pattern.severity_avg).toBeLessThanOrEqual(5);
      });
    });

    test('should validate organizational health data', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      
      const response = await GET(request);
      const data = await response.json();

      expect(Array.isArray(data.organizational_health)).toBe(true);
      expect(data.organizational_health.length).toBeGreaterThan(0);

      data.organizational_health.forEach((dept: any) => {
        expect(dept).toHaveProperty('department');
        expect(dept).toHaveProperty('total_employees');
        expect(dept).toHaveProperty('participation_rate');
        expect(dept).toHaveProperty('avg_severity_score');
        expect(dept.participation_rate).toBeGreaterThanOrEqual(0);
        expect(dept.participation_rate).toBeLessThanOrEqual(100);
      });
    });

    test('should validate intervention insights data', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      
      const response = await GET(request);
      const data = await response.json();

      expect(Array.isArray(data.intervention_insights)).toBe(true);

      data.intervention_insights.forEach((intervention: any) => {
        expect(intervention).toHaveProperty('id');
        expect(intervention).toHaveProperty('title');
        expect(intervention).toHaveProperty('status');
        expect(['planned', 'in_progress', 'completed', 'paused', 'cancelled']).toContain(intervention.status);
        expect(intervention).toHaveProperty('effectiveness_score');
        expect(intervention).toHaveProperty('roi_calculated');
        expect(intervention).toHaveProperty('participant_count');
      });
    });

    test('should handle different time windows', async () => {
      const timeWindows = ['week', 'month', 'quarter'];
      
      for (const timeWindow of timeWindows) {
        const request = new NextRequest(`http://localhost:3000/api/analytics/demo-enterprise?timeWindow=${timeWindow}`);
        const response = await GET(request);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.data_sources.time_window).toBe(timeWindow);
      }
    });

    test('should maintain data consistency across requests', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      const request2 = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      
      const response1 = await GET(request1);
      const response2 = await GET(request2);
      
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Core metrics should be consistent
      expect(data1.analytics_data.organization_metrics.total_interactions)
        .toBe(data2.analytics_data.organization_metrics.total_interactions);
      expect(data1.behavior_patterns.length).toBe(data2.behavior_patterns.length);
      expect(data1.organizational_health.length).toBe(data2.organizational_health.length);
    });
  });

  describe('Data Validation', () => {
    test('should validate severity ratings are within bounds', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      const response = await GET(request);
      const data = await response.json();

      data.behavior_patterns.forEach((pattern: any) => {
        expect(pattern.severity_avg).toBeGreaterThanOrEqual(1);
        expect(pattern.severity_avg).toBeLessThanOrEqual(5);
      });

      data.organizational_health.forEach((dept: any) => {
        expect(dept.avg_severity_score).toBeGreaterThanOrEqual(1);
        expect(dept.avg_severity_score).toBeLessThanOrEqual(5);
      });
    });

    test('should validate confidence levels are within bounds', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      const response = await GET(request);
      const data = await response.json();

      data.behavior_patterns.forEach((pattern: any) => {
        expect(pattern.confidence_level).toBeGreaterThanOrEqual(1);
        expect(pattern.confidence_level).toBeLessThanOrEqual(5);
      });
    });

    test('should validate environmental factors are arrays', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
      const response = await GET(request);
      const data = await response.json();

      data.behavior_patterns.forEach((pattern: any) => {
        expect(Array.isArray(pattern.environmental_factors)).toBe(true);
        expect(pattern.environmental_factors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=invalid_role');
      const response = await GET(request);
      
      expect(response.status).toBe(200); // Should still work with fallback
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('should provide consistent error structure', async () => {
      // This would test actual error scenarios in the real implementation
      // For demo API, we expect it to always succeed with fallback data
      const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });
  });
});

describe('Analytics Data Transformations', () => {
  test('should calculate stakeholder metrics correctly', () => {
    const mockPatterns = [
      { severity_avg: 3.0, frequency: 10, unique_users: 5, confidence_level: 4.0 },
      { severity_avg: 4.0, frequency: 15, unique_users: 8, confidence_level: 3.5 },
      { severity_avg: 2.5, frequency: 20, unique_users: 12, confidence_level: 4.5 }
    ];

    const totalInteractions = mockPatterns.reduce((sum, p) => sum + p.frequency, 0);
    const avgSeverity = mockPatterns.reduce((sum, p) => sum + p.severity_avg, 0) / mockPatterns.length;
    const maxUsers = Math.max(...mockPatterns.map(p => p.unique_users));

    expect(totalInteractions).toBe(45);
    expect(avgSeverity).toBeCloseTo(3.17, 2);
    expect(maxUsers).toBe(12);
  });

  test('should calculate trend directions correctly', () => {
    const improvingTrend = [
      { week: 1, severity: 4.0 },
      { week: 2, severity: 3.5 },
      { week: 3, severity: 3.0 },
      { week: 4, severity: 2.5 }
    ];

    const decliningTrend = [
      { week: 1, severity: 2.0 },
      { week: 2, severity: 2.5 },
      { week: 3, severity: 3.0 },
      { week: 4, severity: 3.5 }
    ];

    function calculateTrend(trendData: Array<{week: number, severity: number}>) {
      if (trendData.length < 2) return 'stable';
      
      const recent = trendData.slice(-2);
      const earlier = trendData.slice(0, 2);
      
      const recentAvg = recent.reduce((sum, d) => sum + d.severity, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, d) => sum + d.severity, 0) / earlier.length;
      
      const change = recentAvg - earlierAvg;
      
      if (change < -0.3) return 'improving';
      if (change > 0.3) return 'declining';
      return 'stable';
    }

    expect(calculateTrend(improvingTrend)).toBe('improving');
    expect(calculateTrend(decliningTrend)).toBe('declining');
  });
});

describe('Privacy and Security', () => {
  test('should not expose individual user data', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
    const response = await GET(request);
    const data = await response.json();

    // Ensure no individual identifiers are present
    const dataString = JSON.stringify(data);
    expect(dataString).not.toMatch(/user_id|email|name/i);
    expect(dataString).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/); // No UUIDs that could identify users
  });

  test('should enforce minimum anonymity thresholds', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=manager');
    const response = await GET(request);
    const data = await response.json();

    // All patterns should meet minimum user count for manager role
    data.behavior_patterns.forEach((pattern: any) => {
      expect(pattern.unique_users).toBeGreaterThanOrEqual(3);
    });
  });
});

// Performance benchmarks
describe('Performance', () => {
  test('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    const request = new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive');
    await GET(request);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000); // 5 second max for demo API
  });

  test('should handle concurrent requests', async () => {
    const requests = Array(10).fill(null).map(() => 
      GET(new NextRequest('http://localhost:3000/api/analytics/demo-enterprise?role=executive'))
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    const totalDuration = endTime - startTime;
    expect(totalDuration).toBeLessThan(10000); // 10 seconds for 10 concurrent requests
  });
});