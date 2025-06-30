// Email Scheduling and Automation System
import { enhancedEmailService } from './enhanced-email-service';
import { db } from '@/lib/supabase';

export interface ScheduledEmailJob {
  id: string;
  type: 'analytics_report' | 'campaign' | 'reminder' | 'notification';
  organizationId: string;
  scheduledAt: Date;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface CronPattern {
  minute?: string; // 0-59
  hour?: string; // 0-23
  dayOfMonth?: string; // 1-31
  month?: string; // 1-12
  dayOfWeek?: string; // 0-6 (0 = Sunday)
}

export class EmailScheduler {
  private static instance: EmailScheduler;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): EmailScheduler {
    if (!EmailScheduler.instance) {
      EmailScheduler.instance = new EmailScheduler();
    }
    return EmailScheduler.instance;
  }

  // Start the email scheduler (call this in your app startup)
  public start(): void {
    if (this.isRunning) {
      console.log('Email scheduler is already running');
      return;
    }

    console.log('Starting email scheduler...');
    this.isRunning = true;

    // Check for scheduled emails every minute
    this.intervalId = setInterval(() => {
      this.processScheduledEmails();
    }, 60000); // 60 seconds

    // Process analytics reports
    this.processAnalyticsReports();
  }

  // Stop the email scheduler
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping email scheduler...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Process scheduled emails
  private async processScheduledEmails(): Promise<void> {
    try {
      // Process pending email notifications
      await enhancedEmailService.processPendingEmails();

      // Process scheduled campaigns
      await this.processScheduledCampaigns();

      // Process analytics reports
      await this.processAnalyticsReports();

    } catch (error) {
      console.error('Error processing scheduled emails:', error);
    }
  }

  // Process scheduled email campaigns
  private async processScheduledCampaigns(): Promise<void> {
    try {
      const { data: campaigns, error } = await db.client
        .from('email_campaigns')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString());

      if (error) throw error;

      for (const campaign of campaigns || []) {
        await this.executeCampaign(campaign);
      }
    } catch (error) {
      console.error('Error processing scheduled campaigns:', error);
    }
  }

  // Execute a single email campaign
  private async executeCampaign(campaign: any): Promise<void> {
    try {
      console.log(`Executing campaign: ${campaign.name}`);

      // Update campaign status to sending
      await db.client
        .from('email_campaigns')
        .update({ 
          status: 'sending',
          started_at: new Date().toISOString()
        })
        .eq('id', campaign.id);

      // Get recipients based on target criteria
      const recipients = await this.getRecipients(campaign.target_criteria, campaign.organization_id);

      // Update recipient count
      await db.client
        .from('email_campaigns')
        .update({ recipient_count: recipients.length })
        .eq('id', campaign.id);

      // Send emails to all recipients
      let sentCount = 0;
      for (const recipient of recipients) {
        const success = await this.sendCampaignEmail(campaign, recipient);
        if (success) sentCount++;
      }

      // Update campaign completion status
      await db.client
        .from('email_campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          sent_count: sentCount
        })
        .eq('id', campaign.id);

      // Schedule next run if recurring
      if (campaign.schedule_type === 'recurring' && campaign.recurrence_pattern) {
        await this.scheduleRecurringCampaign(campaign);
      }

    } catch (error) {
      console.error(`Failed to execute campaign ${campaign.id}:`, error);
      
      await db.client
        .from('email_campaigns')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaign.id);
    }
  }

  // Send individual campaign email
  private async sendCampaignEmail(campaign: any, recipient: any): Promise<boolean> {
    try {
      // Get template
      const { data: template, error: templateError } = await db.client
        .from('email_templates')
        .select('*')
        .eq('id', campaign.template_id)
        .single();

      if (templateError) throw templateError;

      // Prepare template variables
      const templateVariables = {
        recipient_name: recipient.display_name || recipient.first_name || 'User',
        recipient_email: recipient.email,
        organization_name: campaign.organization?.name || 'Your Organization',
        campaign_name: campaign.name,
        unsubscribe_link: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${recipient.unsubscribe_token}`,
        ...campaign.template_variables
      };

      // Queue the email
      const emailId = await enhancedEmailService.queueEmail(
        template.name,
        recipient.email,
        recipient.display_name || recipient.first_name || 'User',
        this.substituteVariables(campaign.subject, templateVariables),
        templateVariables,
        {
          organizationId: campaign.organization_id,
          priority: 5
        }
      );

      return !!emailId;
    } catch (error) {
      console.error(`Failed to send campaign email to ${recipient.email}:`, error);
      return false;
    }
  }

  // Process analytics reports
  private async processAnalyticsReports(): Promise<void> {
    try {
      const now = new Date();
      
      const { data: reports, error } = await db.client
        .from('email_analytics_reports')
        .select('*')
        .eq('is_enabled', true)
        .lte('next_run_at', now.toISOString());

      if (error) throw error;

      for (const report of reports || []) {
        await this.executeAnalyticsReport(report);
      }
    } catch (error) {
      console.error('Error processing analytics reports:', error);
    }
  }

  // Execute analytics report
  private async executeAnalyticsReport(report: any): Promise<void> {
    try {
      console.log(`Executing analytics report: ${report.name}`);

      // Update last run time
      await db.client
        .from('email_analytics_reports')
        .update({ 
          last_run_at: new Date().toISOString(),
          run_count: report.run_count + 1
        })
        .eq('id', report.id);

      // Generate report data
      const reportData = await this.generateReportData(report);

      // Send report to all recipients
      for (const email of report.recipient_emails) {
        await enhancedEmailService.sendAnalyticsReport(
          email,
          reportData,
          reportData.organizationName || 'Your Organization',
          this.getReportPeriod(report.date_range_value)
        );
      }

      // Schedule next run
      await this.scheduleNextReportRun(report);

      // Update success timestamp
      await db.client
        .from('email_analytics_reports')
        .update({ last_success_at: new Date().toISOString() })
        .eq('id', report.id);

    } catch (error) {
      console.error(`Failed to execute analytics report ${report.id}:`, error);
      
      await db.client
        .from('email_analytics_reports')
        .update({ last_error: error.message })
        .eq('id', report.id);
    }
  }

  // Generate report data based on report configuration
  private async generateReportData(report: any): Promise<Record<string, any>> {
    try {
      // Calculate date range
      const dateRange = this.calculateDateRange(report.date_range_type, report.date_range_value);

      // Get analytics data based on report type
      switch (report.report_type) {
        case 'organizational_health':
          return await this.getOrganizationalHealthData(report.organization_id, dateRange, report.custom_filters);
        
        case 'department_metrics':
          return await this.getDepartmentMetricsData(report.organization_id, dateRange, report.custom_filters);
        
        case 'user_engagement':
          return await this.getUserEngagementData(report.organization_id, dateRange, report.custom_filters);
        
        case 'pattern_analysis':
          return await this.getPatternAnalysisData(report.organization_id, dateRange, report.custom_filters);
        
        case 'intervention_effectiveness':
          return await this.getInterventionEffectivenessData(report.organization_id, dateRange, report.custom_filters);
        
        default:
          throw new Error(`Unknown report type: ${report.report_type}`);
      }
    } catch (error) {
      console.error('Failed to generate report data:', error);
      return { error: error.message };
    }
  }

  // Get organizational health data
  private async getOrganizationalHealthData(organizationId: string, dateRange: any, filters: any): Promise<Record<string, any>> {
    const { data, error } = await db.client
      .from('organizational_health_view')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;

    // Calculate summary metrics
    const totalEmployees = data?.reduce((sum, dept) => sum + dept.total_employees, 0) || 0;
    const activeUsers = data?.reduce((sum, dept) => sum + dept.active_users, 0) || 0;
    const avgSeverity = data?.reduce((sum, dept) => sum + (dept.avg_severity_score || 0), 0) / (data?.length || 1);

    return {
      organizationName: 'Organization', // You might want to fetch this
      activeUsers,
      totalEmployees,
      participationRate: totalEmployees > 0 ? ((activeUsers / totalEmployees) * 100).toFixed(1) + '%' : '0%',
      avgSeverity: avgSeverity.toFixed(1),
      departmentMetrics: data?.map(dept => ({
        department: dept.department,
        participationRate: dept.participation_rate + '%',
        avgSeverity: dept.avg_severity_score?.toFixed(1) || '0.0',
        sessionCount: dept.total_sessions,
        totalEmployees: dept.total_employees,
        activeUsers: dept.active_users
      })) || [],
      insights: [
        totalEmployees > 0 && activeUsers / totalEmployees < 0.5 ? 'Low participation rate detected - consider engagement initiatives' : null,
        avgSeverity > 3 ? 'High average severity scores indicate potential areas of concern' : null,
        'Regular patterns emerging in communication and leadership categories'
      ].filter(Boolean)
    };
  }

  // Get department metrics data
  private async getDepartmentMetricsData(organizationId: string, dateRange: any, filters: any): Promise<Record<string, any>> {
    // Implementation for department-specific metrics
    return this.getOrganizationalHealthData(organizationId, dateRange, filters);
  }

  // Get user engagement data
  private async getUserEngagementData(organizationId: string, dateRange: any, filters: any): Promise<Record<string, any>> {
    const { data, error } = await db.client
      .from('user_interactions')
      .select(`
        user_id,
        interaction_type,
        severity_rating,
        duration_seconds,
        created_at,
        users!inner(first_name, last_name, department)
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (error) throw error;

    // Process engagement metrics
    const uniqueUsers = new Set(data?.map(i => i.user_id)).size || 0;
    const totalInteractions = data?.length || 0;
    const avgDuration = data?.reduce((sum, i) => sum + (i.duration_seconds || 0), 0) / totalInteractions || 0;

    return {
      uniqueUsers,
      totalInteractions,
      avgDuration: Math.round(avgDuration),
      engagementTrend: 'Stable', // You could calculate this based on historical data
      topEngagedUsers: [] // Process top users by interaction count
    };
  }

  // Get pattern analysis data
  private async getPatternAnalysisData(organizationId: string, dateRange: any, filters: any): Promise<Record<string, any>> {
    const { data, error } = await db.client
      .from('behavior_patterns_view')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;

    return {
      topPatterns: data?.slice(0, 10) || [],
      totalPatterns: data?.length || 0,
      avgSeverity: data?.reduce((sum, p) => sum + (p.avg_severity || 0), 0) / (data?.length || 1) || 0,
      trendingPatterns: data?.filter(p => p.total_interactions > 10) || []
    };
  }

  // Get intervention effectiveness data
  private async getInterventionEffectivenessData(organizationId: string, dateRange: any, filters: any): Promise<Record<string, any>> {
    const { data, error } = await db.client
      .from('interventions')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (error) throw error;

    const totalInterventions = data?.length || 0;
    const completedInterventions = data?.filter(i => i.status === 'completed').length || 0;
    const avgEffectiveness = data?.reduce((sum, i) => sum + (i.effectiveness_score || 0), 0) / totalInterventions || 0;

    return {
      totalInterventions,
      completedInterventions,
      completionRate: totalInterventions > 0 ? ((completedInterventions / totalInterventions) * 100).toFixed(1) + '%' : '0%',
      avgEffectiveness: avgEffectiveness.toFixed(1),
      activeInterventions: data?.filter(i => i.status === 'in_progress').length || 0
    };
  }

  // Calculate date range based on type and value
  private calculateDateRange(type: string, value: string): { start: string; end: string } {
    const now = new Date();
    const end = now.toISOString();
    let start: Date;

    if (type === 'relative') {
      switch (value) {
        case 'last_7_days':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_30_days':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last_quarter':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default fallback
    }

    return {
      start: start.toISOString(),
      end
    };
  }

  // Get recipients based on target criteria
  private async getRecipients(criteria: any, organizationId: string): Promise<any[]> {
    try {
      let query = db.client
        .from('email_recipients')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('opted_out', false);

      // Apply filters based on criteria
      if (criteria.departments && criteria.departments.length > 0) {
        query = query.in('department', criteria.departments);
      }

      if (criteria.roles && criteria.roles.length > 0) {
        // This would need to be joined with users table for role filtering
        // For now, we'll skip role filtering
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get recipients:', error);
      return [];
    }
  }

  // Schedule next run for recurring campaign
  private async scheduleRecurringCampaign(campaign: any): Promise<void> {
    try {
      const nextRun = this.calculateNextRun(campaign.recurrence_pattern);
      
      await db.client
        .from('email_campaigns')
        .update({
          status: 'scheduled',
          scheduled_at: nextRun.toISOString()
        })
        .eq('id', campaign.id);
    } catch (error) {
      console.error('Failed to schedule recurring campaign:', error);
    }
  }

  // Schedule next analytics report run
  private async scheduleNextReportRun(report: any): Promise<void> {
    try {
      await db.client.rpc('schedule_next_analytics_report', { p_report_id: report.id });
    } catch (error) {
      console.error('Failed to schedule next report run:', error);
    }
  }

  // Calculate next run time based on recurrence pattern
  private calculateNextRun(pattern: CronPattern): Date {
    const now = new Date();
    
    // Simple implementation - you might want to use a proper cron library
    if (pattern.dayOfWeek !== undefined) {
      // Weekly recurrence
      const targetDay = parseInt(pattern.dayOfWeek);
      const currentDay = now.getDay();
      const daysUntilNext = (targetDay - currentDay + 7) % 7 || 7;
      
      const nextRun = new Date(now);
      nextRun.setDate(now.getDate() + daysUntilNext);
      nextRun.setHours(parseInt(pattern.hour || '9'), parseInt(pattern.minute || '0'), 0, 0);
      
      return nextRun;
    }
    
    // Default to daily
    const nextRun = new Date(now);
    nextRun.setDate(now.getDate() + 1);
    nextRun.setHours(parseInt(pattern.hour || '9'), parseInt(pattern.minute || '0'), 0, 0);
    
    return nextRun;
  }

  // Get report period string
  private getReportPeriod(dateRangeValue: string): string {
    const now = new Date();
    
    switch (dateRangeValue) {
      case 'last_7_days':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return `${weekAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
      case 'last_30_days':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return `${monthAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
      default:
        return now.toLocaleDateString();
    }
  }

  // Substitute template variables in text
  private substituteVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }
}

// Export singleton instance
export const emailScheduler = EmailScheduler.getInstance();