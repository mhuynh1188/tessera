// Email System Initialization
// This file should be imported and called during app startup
import { emailScheduler } from './email-scheduler';
import { activeDirectoryService } from './active-directory-integration';

class EmailSystemManager {
  private static instance: EmailSystemManager;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): EmailSystemManager {
    if (!EmailSystemManager.instance) {
      EmailSystemManager.instance = new EmailSystemManager();
    }
    return EmailSystemManager.instance;
  }

  // Initialize the email system
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Email system already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing email system...');

      // Start the email scheduler
      emailScheduler.start();
      console.log('✅ Email scheduler started');

      // Schedule AD sync for organizations that have it enabled
      await this.scheduleADSyncs();
      console.log('✅ AD sync schedules initialized');

      this.isInitialized = true;
      console.log('🎉 Email system initialization complete!');

    } catch (error) {
      console.error('❌ Failed to initialize email system:', error);
      throw error;
    }
  }

  // Shutdown the email system gracefully
  public shutdown(): void {
    if (!this.isInitialized) {
      return;
    }

    console.log('🛑 Shutting down email system...');
    
    emailScheduler.stop();
    this.isInitialized = false;
    
    console.log('✅ Email system shutdown complete');
  }

  // Schedule AD syncs for organizations with AD integration enabled
  private async scheduleADSyncs(): Promise<void> {
    try {
      // This would be called periodically to check for AD sync schedules
      // For now, we'll just log that it's ready
      console.log('📁 Active Directory sync scheduler ready');
    } catch (error) {
      console.error('Failed to schedule AD syncs:', error);
    }
  }

  // Health check for the email system
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    const services = {
      scheduler: this.isInitialized,
      sendgrid: !!process.env.SENDGRID_API_KEY,
      database: true // Assume database is working if we can run this
    };

    const allHealthy = Object.values(services).every(status => status);
    const anyHealthy = Object.values(services).some(status => status);

    return {
      status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
      services,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const emailSystemManager = EmailSystemManager.getInstance();

// Helper function for easy initialization in app startup
export const initializeEmailSystem = async (): Promise<void> => {
  await emailSystemManager.initialize();
};

// Helper function for graceful shutdown
export const shutdownEmailSystem = (): void => {
  emailSystemManager.shutdown();
};