// Integration Tests for Enterprise Analytics Pipeline
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Test framework for complete analytics pipeline validation
describe('Enterprise Analytics Integration Tests', () => {
  let app: any;
  let server: any;
  let baseURL: string;

  beforeAll(async () => {
    // Initialize Next.js app for testing
    app = next({ dev: false });
    const handle = app.getRequestHandler();
    await app.prepare();

    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const port = server.address()?.port;
        baseURL = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('API Endpoint Integration', () => {
    test('Enhanced Enterprise API returns complete analytics data', async () => {
      const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=executive&organizationId=11111111-1111-1111-1111-111111111111`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.version).toBe('2.0');
      
      // Validate structure
      expect(data).toHaveProperty('user_context');
      expect(data).toHaveProperty('analytics_data');
      expect(data).toHaveProperty('behavior_patterns');
      expect(data).toHaveProperty('stakeholder_metrics');
      expect(data).toHaveProperty('organizational_health');
      expect(data).toHaveProperty('heatmap_data');
      expect(data).toHaveProperty('intervention_insights');
      expect(data).toHaveProperty('performance_insights');
      expect(data).toHaveProperty('cache_info');
      expect(data).toHaveProperty('data_sources');

      // Validate user context
      expect(data.user_context.organization_id).toBe('11111111-1111-1111-1111-111111111111');
      expect(data.user_context.role).toBe('executive');
      expect(data.user_context.access_level).toBe('organization_wide');

      // Validate behavior patterns structure
      expect(Array.isArray(data.behavior_patterns)).toBe(true);
      data.behavior_patterns.forEach((pattern: any) => {
        expect(pattern).toHaveProperty('id');
        expect(pattern).toHaveProperty('pattern_type');
        expect(pattern).toHaveProperty('severity_avg');
        expect(pattern).toHaveProperty('frequency');
        expect(pattern).toHaveProperty('category');
        expect(pattern).toHaveProperty('psychological_framework');
        expect(typeof pattern.severity_avg).toBe('number');
        expect(pattern.severity_avg).toBeGreaterThan(0);
        expect(pattern.severity_avg).toBeLessThanOrEqual(5);
      });

      // Validate organizational health
      expect(Array.isArray(data.organizational_health)).toBe(true);
      data.organizational_health.forEach((dept: any) => {
        expect(dept).toHaveProperty('department');
        expect(dept).toHaveProperty('total_employees');
        expect(dept).toHaveProperty('active_users');
        expect(dept).toHaveProperty('participation_rate');
        expect(dept).toHaveProperty('avg_severity_score');
        expect(typeof dept.participation_rate).toBe('number');
        expect(dept.participation_rate).toBeGreaterThan(0);
        expect(dept.participation_rate).toBeLessThanOrEqual(100);
      });

      // Validate stakeholder metrics
      expect(data.stakeholder_metrics.role).toBe('executive');
      expect(typeof data.stakeholder_metrics.total_interactions).toBe('number');
      expect(typeof data.stakeholder_metrics.avg_severity).toBe('number');
      expect(data.stakeholder_metrics).toHaveProperty('organizational_health_score');
      expect(data.stakeholder_metrics).toHaveProperty('strategic_insights_count');
      expect(data.stakeholder_metrics).toHaveProperty('reputation_risk_level');

      console.log('✅ Enhanced Enterprise API integration test passed');
    });

    test('Demo Enterprise API provides realistic test data', async () => {
      const response = await fetch(`${baseURL}/api/analytics/demo-enterprise?role=hr`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data_sources.real_data).toBe(true);
      expect(data.data_sources.privacy_compliant).toBe(true);

      // Validate HR-specific access
      expect(data.user_context.role).toBe('hr');
      expect(data.user_context.access_level).toBe('workforce_analytics');
      expect(data.stakeholder_metrics).toHaveProperty('confidentiality_level');
      expect(data.stakeholder_metrics).toHaveProperty('culture_improvement_score');

      console.log('✅ Demo Enterprise API integration test passed');
    });

    test('Role-based access control works correctly', async () => {
      const roles = ['executive', 'hr', 'manager', 'member'];
      
      for (const role of roles) {
        const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=${role}`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.user_context.role).toBe(role);
        
        // Validate role-specific access levels
        switch (role) {
          case 'executive':
            expect(data.user_context.access_level).toBe('organization_wide');
            expect(data.stakeholder_metrics).toHaveProperty('organizational_health_score');
            break;
          case 'hr':
            expect(data.user_context.access_level).toBe('workforce_analytics');
            expect(data.stakeholder_metrics).toHaveProperty('confidentiality_level');
            break;
          case 'manager':
            expect(data.user_context.access_level).toBe('department_level');
            expect(data.stakeholder_metrics).toHaveProperty('team_guidance_effectiveness');
            break;
          case 'member':
            expect(data.user_context.access_level).toBe('personal_only');
            expect(data.stakeholder_metrics).toHaveProperty('personal_growth_score');
            break;
        }
      }

      console.log('✅ Role-based access control test passed');
    });

    test('Caching system works correctly', async () => {
      // First request (cache miss)
      const startTime1 = Date.now();
      const response1 = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?cache=true&role=executive`);
      const duration1 = Date.now() - startTime1;
      const data1 = await response.json();

      expect(response1.status).toBe(200);

      // Second request (cache hit)
      const startTime2 = Date.now();
      const response2 = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?cache=true&role=executive`);
      const duration2 = Date.now() - startTime2;
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      
      // Cache hit should be faster
      expect(duration2).toBeLessThan(duration1);
      
      // Validate cache info
      expect(data2.cache_info).toHaveProperty('hit_rate');
      expect(data2.cache_info).toHaveProperty('total_hits');
      expect(data2.cache_info).toHaveProperty('total_misses');

      console.log('✅ Caching system test passed');
    });

    test('Error handling works correctly', async () => {
      // Invalid role
      const response1 = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=invalid_role`);
      expect(response1.status).toBe(500);

      // Missing parameters handled gracefully
      const response2 = await fetch(`${baseURL}/api/analytics/enhanced-enterprise`);
      expect(response2.status).toBe(200); // Should fallback to defaults

      console.log('✅ Error handling test passed');
    });
  });

  describe('Data Quality and Privacy Compliance', () => {
    test('K-anonymity thresholds are enforced', async () => {
      const roles = ['executive', 'hr', 'manager', 'member'];
      
      for (const role of roles) {
        const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=${role}`);
        const data = await response.json();

        const minThreshold = data.data_sources.min_anonymity_threshold;
        
        // Validate that all pattern data meets anonymity threshold
        data.behavior_patterns.forEach((pattern: any) => {
          expect(pattern.unique_users).toBeGreaterThanOrEqual(minThreshold);
        });

        // Validate threshold based on role
        switch (role) {
          case 'executive':
          case 'hr':
            expect(minThreshold).toBe(5);
            break;
          case 'manager':
            expect(minThreshold).toBe(3);
            break;
          case 'member':
            expect(minThreshold).toBe(1);
            break;
        }
      }

      console.log('✅ K-anonymity compliance test passed');
    });

    test('Data filtering works for different roles', async () => {
      const executiveResponse = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=executive`);
      const executiveData = await executiveResponse.json();

      const memberResponse = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=member`);
      const memberData = await memberResponse.json();

      // Executive should see more environmental factors
      const execPattern = executiveData.behavior_patterns[0];
      const memberPattern = memberData.behavior_patterns[0];

      expect(execPattern.environmental_factors.length).toBeGreaterThan(memberPattern.environmental_factors.length);
      expect(memberPattern.environmental_factors.length).toBeLessThanOrEqual(2);

      console.log('✅ Data filtering test passed');
    });

    test('Privacy compliance metadata is present', async () => {
      const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=hr`);
      const data = await response.json();

      expect(data.data_sources.privacy_compliant).toBe(true);
      expect(data.data_sources).toHaveProperty('min_anonymity_threshold');
      expect(data.data_sources).toHaveProperty('generated_at');
      expect(typeof data.data_sources.min_anonymity_threshold).toBe('number');

      console.log('✅ Privacy compliance metadata test passed');
    });
  });

  describe('Performance and Monitoring', () => {
    test('Performance monitoring captures metrics', async () => {
      const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=executive`);
      const data = await response.json();

      expect(data.performance_insights).toHaveProperty('api_performance');
      expect(data.performance_insights.api_performance).toHaveProperty('avg_response_time');
      expect(data.performance_insights.api_performance).toHaveProperty('success_rate');
      expect(data.performance_insights.api_performance).toHaveProperty('error_count');
      expect(data.performance_insights.api_performance).toHaveProperty('p95_response_time');

      expect(typeof data.performance_insights.api_performance.avg_response_time).toBe('number');
      expect(typeof data.performance_insights.api_performance.success_rate).toBe('number');

      console.log('✅ Performance monitoring test passed');
    });

    test('Cache statistics are tracked', async () => {
      const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?cache=true`);
      const data = await response.json();

      expect(data.cache_info).toHaveProperty('hit_rate');
      expect(data.cache_info).toHaveProperty('total_hits');
      expect(data.cache_info).toHaveProperty('total_misses');

      expect(typeof data.cache_info.hit_rate).toBe('number');
      expect(typeof data.cache_info.total_hits).toBe('number');
      expect(typeof data.cache_info.total_misses).toBe('number');

      console.log('✅ Cache statistics test passed');
    });

    test('Response times are within acceptable limits', async () => {
      const startTime = Date.now();
      const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=executive`);
      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds

      console.log(`✅ Response time test passed (${responseTime}ms)`);
    });
  });

  describe('Real-time Features', () => {
    test('Real-time configuration is available', async () => {
      const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?realtime=true&role=executive`);
      const data = await response.json();

      expect(data.realtime_info).not.toBeNull();
      expect(data.realtime_info).toHaveProperty('subscriptionEndpoint');
      expect(data.realtime_info).toHaveProperty('websocketEndpoint');
      expect(data.realtime_info).toHaveProperty('updateTypes');

      expect(Array.isArray(data.realtime_info.updateTypes)).toBe(true);
      expect(data.realtime_info.updateTypes.length).toBeGreaterThan(0);

      console.log('✅ Real-time configuration test passed');
    });

    test('Update types are role-specific', async () => {
      const executiveResponse = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?realtime=true&role=executive`);
      const executiveData = await executiveResponse.json();

      const memberResponse = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?realtime=true&role=member`);
      const memberData = await memberResponse.json();

      expect(executiveData.realtime_info.updateTypes.length).toBeGreaterThan(memberData.realtime_info.updateTypes.length);
      expect(executiveData.realtime_info.updateTypes).toContain('behavior_pattern_change');
      expect(executiveData.realtime_info.updateTypes).toContain('intervention_update');

      console.log('✅ Role-specific update types test passed');
    });
  });

  describe('Data Integrity and Validation', () => {
    test('All severity scores are within valid range', async () => {
      const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=executive`);
      const data = await response.json();

      // Check behavior patterns
      data.behavior_patterns.forEach((pattern: any) => {
        expect(pattern.severity_avg).toBeGreaterThan(0);
        expect(pattern.severity_avg).toBeLessThanOrEqual(5);
        expect(typeof pattern.severity_avg).toBe('number');
      });

      // Check organizational health
      data.organizational_health.forEach((dept: any) => {
        expect(dept.avg_severity_score).toBeGreaterThan(0);
        expect(dept.avg_severity_score).toBeLessThanOrEqual(5);
        expect(dept.participation_rate).toBeGreaterThan(0);
        expect(dept.participation_rate).toBeLessThanOrEqual(100);
      });

      // Check heatmap data
      data.heatmap_data.forEach((unit: any) => {
        expect(unit.toxicity_level).toBeGreaterThan(0);
        expect(unit.toxicity_level).toBeLessThanOrEqual(5);
        expect(unit.participation_rate).toBeGreaterThan(0);
        expect(unit.participation_rate).toBeLessThanOrEqual(100);
      });

      console.log('✅ Data integrity validation test passed');
    });

    test('Required fields are present in all data structures', async () => {
      const response = await fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=executive`);
      const data = await response.json();

      // Required top-level fields
      const requiredFields = [
        'success', 'version', 'user_context', 'analytics_data',
        'behavior_patterns', 'stakeholder_metrics', 'organizational_health',
        'heatmap_data', 'intervention_insights', 'performance_insights',
        'cache_info', 'data_sources'
      ];

      requiredFields.forEach(field => {
        expect(data).toHaveProperty(field);
      });

      // Required behavior pattern fields
      const patternRequiredFields = [
        'id', 'pattern_type', 'severity_avg', 'frequency', 'category',
        'psychological_framework', 'unique_users'
      ];

      data.behavior_patterns.forEach((pattern: any) => {
        patternRequiredFields.forEach(field => {
          expect(pattern).toHaveProperty(field);
        });
      });

      console.log('✅ Required fields validation test passed');
    });

    test('Data consistency across multiple requests', async () => {
      const requests = Array(3).fill(null).map(() => 
        fetch(`${baseURL}/api/analytics/enhanced-enterprise?role=executive&cache=false`)
      );

      const responses = await Promise.all(requests);
      const dataArray = await Promise.all(responses.map(r => r.json()));

      // All requests should succeed
      dataArray.forEach(data => {
        expect(data.success).toBe(true);
      });

      // Data structure should be consistent
      const firstData = dataArray[0];
      dataArray.slice(1).forEach(data => {
        expect(data.behavior_patterns.length).toBe(firstData.behavior_patterns.length);
        expect(data.organizational_health.length).toBe(firstData.organizational_health.length);
        expect(data.user_context.role).toBe(firstData.user_context.role);
      });

      console.log('✅ Data consistency test passed');
    });
  });
});

// Helper function to wait for async operations
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock data validation helpers
function validateTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.getTime() > 0;
}

function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export {
  validateTimestamp,
  validateUUID,
  wait
};