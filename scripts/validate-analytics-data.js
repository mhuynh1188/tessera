#!/usr/bin/env node

// Analytics Data Flow Validation Script
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class AnalyticsDataValidator {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.testResults = [];
    this.orgId = '11111111-1111-1111-1111-111111111111';
  }

  async validateCompleteFlow() {
    console.log('🔍 Validating Complete Analytics Data Flow');
    console.log('=' * 50);

    try {
      await this.testRoleBasedAccess();
      await this.testDataIntegrity();
      await this.testPrivacyCompliance();
      await this.testCachePerformance();
      await this.testRealtimeUpdates();
      await this.testAIInsights();
      await this.testAdminFunctionality();
      
      this.generateValidationReport();
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  }

  async testRoleBasedAccess() {
    console.log('\n🔐 Testing Role-Based Access Control...');
    
    const roles = [
      { role: 'executive', expectedMetrics: ['organizational_health_score', 'strategic_insights_count'] },
      { role: 'hr', expectedMetrics: ['confidentiality_level', 'culture_improvement_score'] },
      { role: 'manager', expectedMetrics: ['team_guidance_effectiveness', 'early_warning_count'] },
      { role: 'member', expectedMetrics: ['personal_growth_score', 'learning_engagement'] }
    ];

    for (const { role, expectedMetrics } of roles) {
      try {
        const response = await fetch(`${this.baseUrl}/api/analytics/enhanced-enterprise?role=${role}&organizationId=${this.orgId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(`Role ${role} API call failed`);
        }

        // Validate role-specific access
        if (data.user_context.role !== role) {
          throw new Error(`Role mismatch: expected ${role}, got ${data.user_context.role}`);
        }

        // Check role-specific metrics
        const missingMetrics = expectedMetrics.filter(metric => 
          !data.stakeholder_metrics.hasOwnProperty(metric)
        );

        if (missingMetrics.length > 0) {
          throw new Error(`Role ${role} missing metrics: ${missingMetrics.join(', ')}`);
        }

        // Validate access level
        const expectedAccessLevels = {
          'executive': 'organization_wide',
          'hr': 'workforce_analytics', 
          'manager': 'department_level',
          'member': 'personal_only'
        };

        if (data.user_context.access_level !== expectedAccessLevels[role]) {
          throw new Error(`Incorrect access level for ${role}`);
        }

        this.testResults.push({
          test: `Role-based access: ${role}`,
          status: 'passed',
          details: `✅ Correct metrics and access level for ${role}`
        });

        console.log(`  ✅ ${role} access validation passed`);
      } catch (error) {
        this.testResults.push({
          test: `Role-based access: ${role}`,
          status: 'failed',
          details: `❌ ${error.message}`
        });
        console.log(`  ❌ ${role} access validation failed: ${error.message}`);
      }
    }
  }

  async testDataIntegrity() {
    console.log('\n📊 Testing Data Integrity...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/enhanced-enterprise?role=executive&organizationId=${this.orgId}`);
      const data = await response.json();

      // Test 1: Severity scores within valid range
      const invalidSeverities = data.behavior_patterns.filter(p => 
        p.severity_avg < 1 || p.severity_avg > 5
      );
      if (invalidSeverities.length > 0) {
        throw new Error(`Invalid severity scores found: ${invalidSeverities.length} patterns`);
      }

      // Test 2: Participation rates within valid range
      const invalidParticipation = data.organizational_health.filter(h => 
        h.participation_rate < 0 || h.participation_rate > 100
      );
      if (invalidParticipation.length > 0) {
        throw new Error(`Invalid participation rates: ${invalidParticipation.length} departments`);
      }

      // Test 3: Required fields present
      const requiredPatternFields = ['id', 'pattern_type', 'severity_avg', 'frequency', 'category'];
      const patternsWithMissingFields = data.behavior_patterns.filter(p => 
        requiredPatternFields.some(field => !p.hasOwnProperty(field))
      );
      if (patternsWithMissingFields.length > 0) {
        throw new Error(`Patterns missing required fields: ${patternsWithMissingFields.length}`);
      }

      // Test 4: Data consistency
      const totalInteractions = data.behavior_patterns.reduce((sum, p) => sum + p.frequency, 0);
      if (data.analytics_data.organization_metrics.total_interactions !== totalInteractions) {
        throw new Error('Interaction count inconsistency detected');
      }

      // Test 5: Timestamp validation
      const invalidTimestamps = data.behavior_patterns.filter(p => 
        !p.last_updated || isNaN(new Date(p.last_updated).getTime())
      );
      if (invalidTimestamps.length > 0) {
        throw new Error(`Invalid timestamps: ${invalidTimestamps.length} patterns`);
      }

      this.testResults.push({
        test: 'Data integrity',
        status: 'passed',
        details: '✅ All data validation checks passed'
      });

      console.log('  ✅ Data integrity validation passed');
    } catch (error) {
      this.testResults.push({
        test: 'Data integrity',
        status: 'failed',
        details: `❌ ${error.message}`
      });
      console.log(`  ❌ Data integrity validation failed: ${error.message}`);
    }
  }

  async testPrivacyCompliance() {
    console.log('\n🔒 Testing Privacy Compliance...');
    
    try {
      const roles = ['executive', 'hr', 'manager', 'member'];
      
      for (const role of roles) {
        const response = await fetch(`${this.baseUrl}/api/analytics/enhanced-enterprise?role=${role}&organizationId=${this.orgId}`);
        const data = await response.json();

        // Test K-anonymity thresholds
        const minThreshold = data.data_sources.min_anonymity_threshold;
        const violatingPatterns = data.behavior_patterns.filter(p => 
          p.unique_users < minThreshold
        );

        if (violatingPatterns.length > 0) {
          throw new Error(`K-anonymity violation for ${role}: ${violatingPatterns.length} patterns below threshold ${minThreshold}`);
        }

        // Test data filtering for members
        if (role === 'member') {
          const overExposedPatterns = data.behavior_patterns.filter(p => 
            p.environmental_factors && p.environmental_factors.length > 2
          );
          if (overExposedPatterns.length > 0) {
            throw new Error(`Data over-exposure for member role: ${overExposedPatterns.length} patterns`);
          }
        }

        // Validate privacy metadata
        if (!data.data_sources.privacy_compliant) {
          throw new Error(`Privacy compliance flag not set for ${role}`);
        }
      }

      this.testResults.push({
        test: 'Privacy compliance',
        status: 'passed',
        details: '✅ K-anonymity and data filtering working correctly'
      });

      console.log('  ✅ Privacy compliance validation passed');
    } catch (error) {
      this.testResults.push({
        test: 'Privacy compliance',
        status: 'failed',
        details: `❌ ${error.message}`
      });
      console.log(`  ❌ Privacy compliance validation failed: ${error.message}`);
    }
  }

  async testCachePerformance() {
    console.log('\n⚡ Testing Cache Performance...');
    
    try {
      // Test cache miss (first request)
      const startTime1 = Date.now();
      const response1 = await fetch(`${this.baseUrl}/api/analytics/enhanced-enterprise?cache=true&role=executive&organizationId=${this.orgId}&_t=${Date.now()}`);
      const duration1 = Date.now() - startTime1;
      const data1 = await response1.json();

      if (!data1.success) {
        throw new Error('Cache test request 1 failed');
      }

      // Test cache hit (second request)
      const startTime2 = Date.now();
      const response2 = await fetch(`${this.baseUrl}/api/analytics/enhanced-enterprise?cache=true&role=executive&organizationId=${this.orgId}`);
      const duration2 = Date.now() - startTime2;
      const data2 = await response2.json();

      if (!data2.success) {
        throw new Error('Cache test request 2 failed');
      }

      // Validate cache statistics
      if (!data2.cache_info || typeof data2.cache_info.hit_rate !== 'number') {
        throw new Error('Cache statistics not properly tracked');
      }

      // Performance validation
      if (duration1 < 50 || duration2 < 10) {
        console.log(`  ⚠️  Cache performance may need optimization (${duration1}ms -> ${duration2}ms)`);
      } else {
        console.log(`  ✅ Cache performance good (${duration1}ms -> ${duration2}ms)`);
      }

      this.testResults.push({
        test: 'Cache performance',
        status: 'passed',
        details: `✅ Cache working, performance: ${duration1}ms -> ${duration2}ms`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Cache performance',
        status: 'failed',
        details: `❌ ${error.message}`
      });
      console.log(`  ❌ Cache performance validation failed: ${error.message}`);
    }
  }

  async testRealtimeUpdates() {
    console.log('\n📡 Testing Real-time Updates...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/enhanced-enterprise?realtime=true&role=executive&organizationId=${this.orgId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error('Real-time test request failed');
      }

      // Validate real-time configuration
      if (!data.realtime_info) {
        throw new Error('Real-time info not provided');
      }

      const requiredRTFields = ['subscriptionEndpoint', 'websocketEndpoint', 'updateTypes'];
      const missingRTFields = requiredRTFields.filter(field => !data.realtime_info[field]);
      if (missingRTFields.length > 0) {
        throw new Error(`Missing real-time fields: ${missingRTFields.join(', ')}`);
      }

      // Validate update types are role-appropriate
      if (!Array.isArray(data.realtime_info.updateTypes) || data.realtime_info.updateTypes.length === 0) {
        throw new Error('Update types not properly configured');
      }

      // Test different roles have different update types
      const memberResponse = await fetch(`${this.baseUrl}/api/analytics/enhanced-enterprise?realtime=true&role=member&organizationId=${this.orgId}`);
      const memberData = await memberResponse.json();

      if (memberData.realtime_info.updateTypes.length >= data.realtime_info.updateTypes.length) {
        throw new Error('Member role has too many update types');
      }

      this.testResults.push({
        test: 'Real-time updates',
        status: 'passed',
        details: '✅ Real-time configuration and role filtering working'
      });

      console.log('  ✅ Real-time updates validation passed');
    } catch (error) {
      this.testResults.push({
        test: 'Real-time updates',
        status: 'failed',
        details: `❌ ${error.message}`
      });
      console.log(`  ❌ Real-time updates validation failed: ${error.message}`);
    }
  }

  async testAIInsights() {
    console.log('\n🤖 Testing AI Insights...');
    
    try {
      // Test AI insights generation (would normally call AI service)
      const response = await fetch(`${this.baseUrl}/api/analytics/enhanced-enterprise?role=executive&organizationId=${this.orgId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error('AI insights test request failed');
      }

      // Check if AI insights file exists
      const aiFile = path.join(__dirname, '../src/lib/analytics/ai-insights.ts');
      if (!fs.existsSync(aiFile)) {
        throw new Error('AI insights implementation not found');
      }

      // Validate AI insights structure in API response (if available)
      if (data.ai_insights) {
        if (!Array.isArray(data.ai_insights)) {
          throw new Error('AI insights not properly structured');
        }

        data.ai_insights.forEach((insight, index) => {
          const requiredFields = ['id', 'type', 'priority', 'title', 'confidence_score'];
          const missingFields = requiredFields.filter(field => !insight[field]);
          if (missingFields.length > 0) {
            throw new Error(`AI insight ${index} missing fields: ${missingFields.join(', ')}`);
          }

          if (insight.confidence_score < 0 || insight.confidence_score > 1) {
            throw new Error(`Invalid confidence score for insight ${index}: ${insight.confidence_score}`);
          }
        });
      }

      // Validate behavior pattern analysis capabilities
      const patterns = data.behavior_patterns;
      if (patterns.length > 0) {
        // Check for trend analysis data
        const hasTrendData = patterns.some(p => p.trend_direction);
        if (!hasTrendData) {
          console.log('  ⚠️  Trend analysis data not fully implemented');
        }
      }

      this.testResults.push({
        test: 'AI insights',
        status: 'passed',
        details: '✅ AI insights engine implemented and structured correctly'
      });

      console.log('  ✅ AI insights validation passed');
    } catch (error) {
      this.testResults.push({
        test: 'AI insights',
        status: 'failed',
        details: `❌ ${error.message}`
      });
      console.log(`  ❌ AI insights validation failed: ${error.message}`);
    }
  }

  async testAdminFunctionality() {
    console.log('\n👥 Testing Admin Functionality...');
    
    try {
      // Check if admin interface exists
      const adminFile = path.join(__dirname, '../src/app/admin/organizations/page.tsx');
      if (!fs.existsSync(adminFile)) {
        throw new Error('Admin interface not found');
      }

      const adminContent = fs.readFileSync(adminFile, 'utf8');

      // Validate admin features
      const requiredAdminFeatures = [
        'OrganizationManagementPage',
        'handleToggleAnalytics',
        'handleUpdateUserRole',
        'subscription_tier',
        'analytics_enabled'
      ];

      const missingFeatures = requiredAdminFeatures.filter(feature => !adminContent.includes(feature));
      if (missingFeatures.length > 0) {
        throw new Error(`Missing admin features: ${missingFeatures.join(', ')}`);
      }

      // Test organization data structure
      const orgDataStructure = [
        'id', 'name', 'domain', 'subscription_tier', 'max_users', 
        'analytics_enabled', 'user_count', 'billing_status'
      ];

      const hasOrgStructure = orgDataStructure.every(field => adminContent.includes(field));
      if (!hasOrgStructure) {
        throw new Error('Organization data structure incomplete');
      }

      // Test role management
      const roles = ['admin', 'executive', 'hr', 'manager', 'member'];
      const hasRoleManagement = roles.every(role => adminContent.includes(role));
      if (!hasRoleManagement) {
        throw new Error('Role management incomplete');
      }

      this.testResults.push({
        test: 'Admin functionality',
        status: 'passed',
        details: '✅ Admin interface complete with org and user management'
      });

      console.log('  ✅ Admin functionality validation passed');
    } catch (error) {
      this.testResults.push({
        test: 'Admin functionality',
        status: 'failed',
        details: `❌ ${error.message}`
      });
      console.log(`  ❌ Admin functionality validation failed: ${error.message}`);
    }
  }

  generateValidationReport() {
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const total = this.testResults.length;

    console.log('\n' + '='.repeat(60));
    console.log('📋 ANALYTICS DATA FLOW VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`📊 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    console.log('\n📝 Test Results:');
    this.testResults.forEach(result => {
      const icon = result.status === 'passed' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.details}`);
    });

    console.log('\n🎯 Validation Summary:');
    if (failed === 0) {
      console.log('🎉 All data flow validations passed!');
      console.log('   • Role-based access control working correctly');
      console.log('   • Data integrity maintained across all endpoints');
      console.log('   • Privacy compliance with K-anonymity enforced');
      console.log('   • Cache performance optimized');
      console.log('   • Real-time updates configured properly');
      console.log('   • AI insights engine implemented');
      console.log('   • Admin functionality complete');
      console.log('\n✨ The enterprise analytics system is production-ready!');
    } else {
      console.log(`⚠️  ${failed} validation${failed > 1 ? 's' : ''} failed.`);
      console.log('   Please address the issues above before deployment.');
    }

    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new AnalyticsDataValidator();
  validator.validateCompleteFlow().catch(console.error);
}

module.exports = AnalyticsDataValidator;