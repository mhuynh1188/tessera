// AI-Powered Predictive Analytics and Insights Generation
import { analyticsMonitoring } from './monitoring';

interface PredictiveInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'recommendation' | 'forecast';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  suggested_actions: string[];
  confidence_score: number; // 0-1
  predicted_impact: {
    severity_change: number;
    affected_users: number;
    time_horizon_days: number;
    business_impact: 'low' | 'medium' | 'high';
  };
  expires_at: string;
  created_at: string;
}

interface TrendAnalysis {
  pattern_id: string;
  pattern_name: string;
  current_severity: number;
  trend_direction: 'improving' | 'stable' | 'declining' | 'volatile';
  velocity: number; // Rate of change
  predicted_severity_30_days: number;
  predicted_severity_90_days: number;
  confidence_level: number;
  contributing_factors: string[];
  seasonality_detected: boolean;
  anomalies: Array<{
    date: string;
    severity: number;
    deviation_score: number;
  }>;
}

interface InterventionRecommendation {
  pattern_id: string;
  intervention_type: 'workshop' | 'coaching' | 'policy_change' | 'training' | 'structural';
  title: string;
  description: string;
  estimated_effectiveness: number; // 0-1
  estimated_cost: number;
  estimated_roi: number;
  implementation_complexity: 'low' | 'medium' | 'high';
  time_to_impact_days: number;
  target_departments: string[];
  success_metrics: string[];
  similar_case_studies: Array<{
    organization_type: string;
    effectiveness_achieved: number;
    duration_days: number;
  }>;
}

export class AIInsightsEngine {
  private insights: Map<string, PredictiveInsight[]> = new Map();
  private models = {
    trendPredictor: new TrendPredictor(),
    anomalyDetector: new AnomalyDetector(),
    interventionOptimizer: new InterventionOptimizer(),
    riskAssessment: new RiskAssessment()
  };

  async generateInsights(
    organizationId: string,
    behaviorPatterns: any[],
    organizationalHealth: any[],
    interventionHistory: any[]
  ): Promise<PredictiveInsight[]> {
    return analyticsMonitoring.trackOperation('ai_insights_generation', async () => {
      console.log(`🤖 Generating AI insights for organization ${organizationId}`);

      const insights: PredictiveInsight[] = [];

      // 1. Trend Analysis and Predictions
      const trendInsights = await this.generateTrendInsights(behaviorPatterns);
      insights.push(...trendInsights);

      // 2. Anomaly Detection
      const anomalyInsights = await this.detectAnomalies(behaviorPatterns, organizationalHealth);
      insights.push(...anomalyInsights);

      // 3. Risk Assessment
      const riskInsights = await this.assessRisks(behaviorPatterns, organizationalHealth);
      insights.push(...riskInsights);

      // 4. Intervention Recommendations
      const interventionInsights = await this.recommendInterventions(
        behaviorPatterns, interventionHistory
      );
      insights.push(...interventionInsights);

      // 5. Opportunity Identification
      const opportunityInsights = await this.identifyOpportunities(
        behaviorPatterns, organizationalHealth
      );
      insights.push(...opportunityInsights);

      // Sort by priority and confidence
      const sortedInsights = insights.sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityWeight[a.priority];
        const bPriority = priorityWeight[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return b.confidence_score - a.confidence_score;
      });

      // Cache insights
      this.insights.set(organizationId, sortedInsights);

      console.log(`✅ Generated ${sortedInsights.length} AI insights`);
      return sortedInsights;
    });
  }

  private async generateTrendInsights(patterns: any[]): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    for (const pattern of patterns) {
      const trendAnalysis = await this.models.trendPredictor.analyzeTrend(pattern);
      
      if (trendAnalysis.trend_direction === 'declining' && trendAnalysis.velocity > 0.2) {
        insights.push({
          id: `trend_${pattern.id}_${Date.now()}`,
          type: 'alert',
          priority: trendAnalysis.predicted_severity_30_days > 4.0 ? 'critical' : 'high',
          title: `Escalating Pattern: ${pattern.pattern_type}`,
          description: `${pattern.pattern_type} is showing concerning deterioration trends with ${(trendAnalysis.velocity * 100).toFixed(1)}% monthly increase in severity.`,
          evidence: [
            `Current severity: ${pattern.severity_avg.toFixed(1)}/5.0`,
            `Predicted severity in 30 days: ${trendAnalysis.predicted_severity_30_days.toFixed(1)}/5.0`,
            `Trend velocity: ${(trendAnalysis.velocity * 100).toFixed(1)}% increase per month`,
            `Confidence level: ${(trendAnalysis.confidence_level * 100).toFixed(0)}%`
          ],
          suggested_actions: [
            'Schedule immediate intervention planning session',
            'Increase monitoring frequency for affected departments',
            'Consider temporary policy adjustments',
            'Engage external consultants if pattern persists'
          ],
          confidence_score: trendAnalysis.confidence_level,
          predicted_impact: {
            severity_change: trendAnalysis.predicted_severity_30_days - pattern.severity_avg,
            affected_users: Math.ceil(pattern.unique_users * 1.3),
            time_horizon_days: 30,
            business_impact: trendAnalysis.predicted_severity_30_days > 4.0 ? 'high' : 'medium'
          },
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        });
      }

      if (trendAnalysis.trend_direction === 'improving' && trendAnalysis.velocity < -0.15) {
        insights.push({
          id: `improvement_${pattern.id}_${Date.now()}`,
          type: 'opportunity',
          priority: 'medium',
          title: `Positive Trend: ${pattern.pattern_type}`,
          description: `${pattern.pattern_type} is showing significant improvement. This success could be replicated in other areas.`,
          evidence: [
            `Severity decreased by ${(Math.abs(trendAnalysis.velocity) * 100).toFixed(1)}% this month`,
            `Predicted continued improvement over next 30 days`,
            `High confidence in trend sustainability: ${(trendAnalysis.confidence_level * 100).toFixed(0)}%`
          ],
          suggested_actions: [
            'Document successful intervention strategies',
            'Share best practices with other departments',
            'Consider scaling successful approaches',
            'Maintain current intervention momentum'
          ],
          confidence_score: trendAnalysis.confidence_level,
          predicted_impact: {
            severity_change: trendAnalysis.predicted_severity_30_days - pattern.severity_avg,
            affected_users: pattern.unique_users,
            time_horizon_days: 30,
            business_impact: 'medium'
          },
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  private async detectAnomalies(
    patterns: any[], 
    health: any[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    
    for (const pattern of patterns) {
      const anomalies = await this.models.anomalyDetector.detectAnomalies(pattern);
      
      if (anomalies.length > 0) {
        const recentAnomalies = anomalies.filter(a => 
          new Date(a.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        
        if (recentAnomalies.length > 0) {
          insights.push({
            id: `anomaly_${pattern.id}_${Date.now()}`,
            type: 'alert',
            priority: 'high',
            title: `Anomaly Detected: ${pattern.pattern_type}`,
            description: `Unusual spike detected in ${pattern.pattern_type}. Pattern deviates significantly from normal behavior.`,
            evidence: [
              `${recentAnomalies.length} anomalous data points in past week`,
              `Maximum deviation: ${Math.max(...recentAnomalies.map(a => a.deviation_score)).toFixed(2)} standard deviations`,
              `Pattern typically ranges 2.0-3.5, recent readings: ${recentAnomalies.map(a => a.severity.toFixed(1)).join(', ')}`
            ],
            suggested_actions: [
              'Investigate root cause of sudden change',
              'Interview affected team members',
              'Review recent organizational changes',
              'Consider immediate targeted intervention'
            ],
            confidence_score: 0.85,
            predicted_impact: {
              severity_change: Math.max(...recentAnomalies.map(a => a.severity)) - pattern.severity_avg,
              affected_users: Math.ceil(pattern.unique_users * 1.5),
              time_horizon_days: 14,
              business_impact: 'high'
            },
            expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          });
        }
      }
    }

    return insights;
  }

  private async assessRisks(
    patterns: any[], 
    health: any[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    
    // Calculate organizational risk score
    const riskScore = await this.models.riskAssessment.calculateRisk(patterns, health);
    
    if (riskScore.overall_risk > 0.7) {
      insights.push({
        id: `risk_overall_${Date.now()}`,
        type: 'alert',
        priority: 'critical',
        title: 'High Organizational Risk Detected',
        description: `Organization-wide risk assessment indicates elevated concern levels across multiple behavioral patterns.`,
        evidence: [
          `Overall risk score: ${(riskScore.overall_risk * 100).toFixed(0)}%`,
          `${riskScore.high_risk_patterns.length} patterns flagged as high-risk`,
          `${riskScore.affected_departments.length} departments showing concerning trends`,
          `Estimated impact on retention: ${(riskScore.retention_risk * 100).toFixed(0)}%`
        ],
        suggested_actions: [
          'Convene emergency leadership meeting',
          'Implement organization-wide culture assessment',
          'Fast-track highest-priority interventions',
          'Consider external organizational development support'
        ],
        confidence_score: riskScore.confidence,
        predicted_impact: {
          severity_change: 0.8,
          affected_users: riskScore.total_affected_users,
          time_horizon_days: 60,
          business_impact: 'high'
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });
    }

    return insights;
  }

  private async recommendInterventions(
    patterns: any[], 
    history: any[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    
    for (const pattern of patterns) {
      if (pattern.severity_avg > 3.5) {
        const recommendation = await this.models.interventionOptimizer.recommend(pattern, history);
        
        insights.push({
          id: `intervention_${pattern.id}_${Date.now()}`,
          type: 'recommendation',
          priority: 'medium',
          title: `Intervention Recommended: ${recommendation.title}`,
          description: `Based on pattern analysis and historical data, ${recommendation.intervention_type} intervention shows highest success probability for ${pattern.pattern_type}.`,
          evidence: [
            `Estimated effectiveness: ${(recommendation.estimated_effectiveness * 100).toFixed(0)}%`,
            `Projected ROI: ${recommendation.estimated_roi}x`,
            `Implementation complexity: ${recommendation.implementation_complexity}`,
            `Time to impact: ${recommendation.time_to_impact_days} days`
          ],
          suggested_actions: [
            'Schedule intervention planning workshop',
            'Allocate budget for recommended approach',
            'Identify internal champions and facilitators',
            'Set up success metrics tracking'
          ],
          confidence_score: recommendation.estimated_effectiveness,
          predicted_impact: {
            severity_change: -1.2,
            affected_users: pattern.unique_users,
            time_horizon_days: recommendation.time_to_impact_days,
            business_impact: 'medium'
          },
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  private async identifyOpportunities(
    patterns: any[], 
    health: any[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    
    // Identify departments with strong performance
    const strongDepartments = health.filter(dept => 
      dept.avg_severity_score < 2.5 && dept.participation_rate > 80
    );
    
    for (const dept of strongDepartments) {
      insights.push({
        id: `opportunity_${dept.department}_${Date.now()}`,
        type: 'opportunity',
        priority: 'low',
        title: `Excellence Opportunity: ${dept.department} Best Practices`,
        description: `${dept.department} demonstrates exceptional performance. Consider leveraging their practices organization-wide.`,
        evidence: [
          `Low severity score: ${dept.avg_severity_score.toFixed(1)}/5.0`,
          `High participation: ${dept.participation_rate.toFixed(1)}%`,
          `Consistent improvement trend`,
          `Strong employee engagement indicators`
        ],
        suggested_actions: [
          'Document successful practices and policies',
          'Conduct knowledge transfer sessions',
          'Create mentorship programs with other departments',
          'Develop case study for external sharing'
        ],
        confidence_score: 0.8,
        predicted_impact: {
          severity_change: -0.5,
          affected_users: 100,
          time_horizon_days: 90,
          business_impact: 'medium'
        },
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });
    }

    return insights;
  }

  // Get cached insights for an organization
  getInsights(organizationId: string): PredictiveInsight[] {
    return this.insights.get(organizationId) || [];
  }

  // Clear expired insights
  clearExpiredInsights(): void {
    const now = new Date();
    
    for (const [orgId, insights] of this.insights.entries()) {
      const activeInsights = insights.filter(insight => 
        new Date(insight.expires_at) > now
      );
      this.insights.set(orgId, activeInsights);
    }
  }
}

// Individual AI model classes
class TrendPredictor {
  async analyzeTrend(pattern: any): Promise<TrendAnalysis> {
    // Simple linear regression on trend data
    const trendData = pattern.trend_data || [];
    
    if (trendData.length < 3) {
      return this.createDefaultTrend(pattern);
    }

    const n = trendData.length;
    const sumX = trendData.reduce((sum, _, i) => sum + i, 0);
    const sumY = trendData.reduce((sum, d) => sum + d.severity, 0);
    const sumXY = trendData.reduce((sum, d, i) => sum + i * d.severity, 0);
    const sumX2 = trendData.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predicted30 = intercept + slope * (n + 4); // 4 weeks ahead
    const predicted90 = intercept + slope * (n + 12); // 12 weeks ahead

    return {
      pattern_id: pattern.id,
      pattern_name: pattern.pattern_type,
      current_severity: pattern.severity_avg,
      trend_direction: slope > 0.1 ? 'declining' : slope < -0.1 ? 'improving' : 'stable',
      velocity: slope,
      predicted_severity_30_days: Math.max(1, Math.min(5, predicted30)),
      predicted_severity_90_days: Math.max(1, Math.min(5, predicted90)),
      confidence_level: Math.min(0.9, 0.5 + (n * 0.1)),
      contributing_factors: pattern.environmental_factors || [],
      seasonality_detected: false,
      anomalies: []
    };
  }

  private createDefaultTrend(pattern: any): TrendAnalysis {
    return {
      pattern_id: pattern.id,
      pattern_name: pattern.pattern_type,
      current_severity: pattern.severity_avg,
      trend_direction: 'stable',
      velocity: 0,
      predicted_severity_30_days: pattern.severity_avg,
      predicted_severity_90_days: pattern.severity_avg,
      confidence_level: 0.3,
      contributing_factors: [],
      seasonality_detected: false,
      anomalies: []
    };
  }
}

class AnomalyDetector {
  async detectAnomalies(pattern: any): Promise<Array<{date: string, severity: number, deviation_score: number}>> {
    const trendData = pattern.trend_data || [];
    
    if (trendData.length < 5) return [];

    const severities = trendData.map(d => d.severity);
    const mean = severities.reduce((a, b) => a + b, 0) / severities.length;
    const stdDev = Math.sqrt(severities.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / severities.length);

    return trendData
      .map(d => ({
        date: new Date(Date.now() - (trendData.length - d.week) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        severity: d.severity,
        deviation_score: Math.abs(d.severity - mean) / stdDev
      }))
      .filter(d => d.deviation_score > 2); // 2 standard deviations
  }
}

class InterventionOptimizer {
  async recommend(pattern: any, history: any[]): Promise<InterventionRecommendation> {
    // Simple rule-based recommendation engine
    const interventionMap = {
      'Communication': {
        type: 'workshop' as const,
        title: 'Communication Excellence Workshop',
        effectiveness: 0.75,
        cost: 5000,
        complexity: 'medium' as const,
        duration: 30
      },
      'Leadership': {
        type: 'coaching' as const,
        title: 'Leadership Development Program',
        effectiveness: 0.80,
        cost: 15000,
        complexity: 'high' as const,
        duration: 60
      },
      'Process': {
        type: 'training' as const,
        title: 'Process Optimization Training',
        effectiveness: 0.70,
        cost: 3000,
        complexity: 'low' as const,
        duration: 21
      },
      'Culture': {
        type: 'structural' as const,
        title: 'Culture Transformation Initiative',
        effectiveness: 0.85,
        cost: 25000,
        complexity: 'high' as const,
        duration: 90
      }
    };

    const rec = interventionMap[pattern.category] || interventionMap['Process'];

    return {
      pattern_id: pattern.id,
      intervention_type: rec.type,
      title: rec.title,
      description: `Targeted ${rec.type} intervention designed to address ${pattern.pattern_type} patterns`,
      estimated_effectiveness: rec.effectiveness,
      estimated_cost: rec.cost,
      estimated_roi: (rec.effectiveness * 50000) / rec.cost, // Simplified ROI calculation
      implementation_complexity: rec.complexity,
      time_to_impact_days: rec.duration,
      target_departments: [pattern.department || 'All'],
      success_metrics: [
        'Severity reduction by 1.0+ points',
        'Increased confidence ratings',
        'Reduced environmental stress factors'
      ],
      similar_case_studies: [
        {
          organization_type: 'Technology Company',
          effectiveness_achieved: rec.effectiveness - 0.1,
          duration_days: rec.duration + 10
        }
      ]
    };
  }
}

class RiskAssessment {
  async calculateRisk(patterns: any[], health: any[]): Promise<{
    overall_risk: number;
    high_risk_patterns: string[];
    affected_departments: string[];
    retention_risk: number;
    confidence: number;
    total_affected_users: number;
  }> {
    const highRiskPatterns = patterns.filter(p => p.severity_avg > 3.5);
    const concerningDepartments = health.filter(h => h.avg_severity_score > 3.0);
    
    const overallRisk = Math.min(1.0, 
      (highRiskPatterns.length / Math.max(patterns.length, 1)) * 0.6 +
      (concerningDepartments.length / Math.max(health.length, 1)) * 0.4
    );

    return {
      overall_risk: overallRisk,
      high_risk_patterns: highRiskPatterns.map(p => p.pattern_type),
      affected_departments: concerningDepartments.map(d => d.department),
      retention_risk: overallRisk * 0.3, // Simplified correlation
      confidence: 0.75,
      total_affected_users: patterns.reduce((sum, p) => sum + p.unique_users, 0)
    };
  }
}

// Global AI insights engine
export const aiInsightsEngine = new AIInsightsEngine();

// Cleanup expired insights every hour
setInterval(() => {
  aiInsightsEngine.clearExpiredInsights();
}, 60 * 60 * 1000);