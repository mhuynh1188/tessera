// Active Directory Integration for Email Recipients
import { db } from '@/lib/supabase';

// Microsoft Graph API interfaces
export interface ADUser {
  id: string;
  userPrincipalName: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  businessPhones: string[];
  accountEnabled: boolean;
}

export interface ADGroup {
  id: string;
  displayName: string;
  description?: string;
  mail?: string;
  members?: ADUser[];
}

export interface ADSyncConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  enabled: boolean;
  syncFrequency: 'hourly' | 'daily' | 'weekly';
  lastSync?: Date;
  groupFilters?: string[]; // Only sync users from these groups
  departmentFilters?: string[]; // Only sync users from these departments
}

export class ActiveDirectoryService {
  private static instance: ActiveDirectoryService;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private constructor() {}

  public static getInstance(): ActiveDirectoryService {
    if (!ActiveDirectoryService.instance) {
      ActiveDirectoryService.instance = new ActiveDirectoryService();
    }
    return ActiveDirectoryService.instance;
  }

  // Get access token for Microsoft Graph API
  private async getAccessToken(config: ADSyncConfig): Promise<string> {
    try {
      // Check if current token is still valid
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      // Request new token
      const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: 'https://graph.microsoft.com/.default'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      this.accessToken = tokenData.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 300) * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get AD access token:', error);
      throw error;
    }
  }

  // Fetch users from Active Directory
  async fetchADUsers(config: ADSyncConfig, groupId?: string): Promise<ADUser[]> {
    try {
      const accessToken = await this.getAccessToken(config);
      
      let url = 'https://graph.microsoft.com/v1.0/users';
      
      // If specific group is provided, get group members
      if (groupId) {
        url = `https://graph.microsoft.com/v1.0/groups/${groupId}/members/microsoft.graph.user`;
      }

      // Add query parameters for fields we need
      const selectFields = [
        'id',
        'userPrincipalName',
        'displayName',
        'givenName',
        'surname',
        'mail',
        'jobTitle',
        'department',
        'officeLocation',
        'businessPhones',
        'accountEnabled'
      ].join(',');

      url += `?$select=${selectFields}&$filter=accountEnabled eq true`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AD users: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Failed to fetch AD users:', error);
      throw error;
    }
  }

  // Fetch groups from Active Directory
  async fetchADGroups(config: ADSyncConfig): Promise<ADGroup[]> {
    try {
      const accessToken = await this.getAccessToken(config);
      
      const response = await fetch('https://graph.microsoft.com/v1.0/groups?$select=id,displayName,description,mail', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AD groups: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Failed to fetch AD groups:', error);
      throw error;
    }
  }

  // Sync users from Active Directory to email recipients table
  async syncUsersFromAD(organizationId: string, config: ADSyncConfig): Promise<{
    synced: number;
    updated: number;
    errors: string[];
  }> {
    const results = { synced: 0, updated: 0, errors: [] as string[] };

    try {
      console.log(`Starting AD sync for organization ${organizationId}`);

      let allUsers: ADUser[] = [];

      if (config.groupFilters && config.groupFilters.length > 0) {
        // Sync users from specific groups
        for (const groupId of config.groupFilters) {
          try {
            const groupUsers = await this.fetchADUsers(config, groupId);
            allUsers = allUsers.concat(groupUsers);
          } catch (error) {
            results.errors.push(`Failed to sync group ${groupId}: ${error.message}`);
          }
        }
      } else {
        // Sync all users
        allUsers = await this.fetchADUsers(config);
      }

      // Filter by departments if specified
      if (config.departmentFilters && config.departmentFilters.length > 0) {
        allUsers = allUsers.filter(user => 
          user.department && config.departmentFilters!.includes(user.department)
        );
      }

      // Remove duplicates (in case user is in multiple groups)
      const uniqueUsers = new Map<string, ADUser>();
      allUsers.forEach(user => {
        uniqueUsers.set(user.userPrincipalName, user);
      });

      // Sync each user to the database
      for (const user of uniqueUsers.values()) {
        try {
          await this.syncSingleUser(organizationId, user);
          results.synced++;
        } catch (error) {
          results.errors.push(`Failed to sync user ${user.userPrincipalName}: ${error.message}`);
        }
      }

      // Update sync timestamp
      await this.updateSyncTimestamp(organizationId);

      console.log(`AD sync completed: ${results.synced} users synced, ${results.errors.length} errors`);
      
    } catch (error) {
      console.error('AD sync failed:', error);
      results.errors.push(`AD sync failed: ${error.message}`);
    }

    return results;
  }

  // Sync a single user to the database
  private async syncSingleUser(organizationId: string, adUser: ADUser): Promise<void> {
    try {
      const recipientData = {
        organization_id: organizationId,
        email: adUser.mail || adUser.userPrincipalName,
        first_name: adUser.givenName,
        last_name: adUser.surname,
        display_name: adUser.displayName,
        job_title: adUser.jobTitle,
        department: adUser.department,
        ad_object_id: adUser.id,
        ad_user_principal_name: adUser.userPrincipalName,
        ad_sync_enabled: true,
        ad_last_sync: new Date().toISOString(),
        is_active: adUser.accountEnabled,
        source: 'active_directory',
        updated_at: new Date().toISOString()
      };

      // Check if user already exists
      const { data: existingUser, error: findError } = await db.client
        .from('email_recipients')
        .select('id, ad_object_id')
        .eq('organization_id', organizationId)
        .or(`email.eq.${recipientData.email},ad_object_id.eq.${adUser.id}`)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingUser) {
        // Update existing user
        const { error: updateError } = await db.client
          .from('email_recipients')
          .update(recipientData)
          .eq('id', existingUser.id);

        if (updateError) throw updateError;
      } else {
        // Create new user
        const { error: insertError } = await db.client
          .from('email_recipients')
          .insert(recipientData);

        if (insertError) throw insertError;
      }

      // Check if user should also be in the users table
      await this.syncToUsersTable(organizationId, adUser);

    } catch (error) {
      console.error(`Failed to sync user ${adUser.userPrincipalName}:`, error);
      throw error;
    }
  }

  // Sync AD user to main users table if they should have system access
  private async syncToUsersTable(organizationId: string, adUser: ADUser): Promise<void> {
    try {
      // Check if user should have system access (you can customize this logic)
      const shouldHaveAccess = this.shouldUserHaveSystemAccess(adUser);
      
      if (!shouldHaveAccess) {
        return;
      }

      // Check if user already exists in users table
      const { data: existingUser, error: findError } = await db.client
        .from('users')
        .select('id')
        .eq('email', adUser.mail || adUser.userPrincipalName)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      const userData = {
        email: adUser.mail || adUser.userPrincipalName,
        first_name: adUser.givenName,
        last_name: adUser.surname,
        organization_id: organizationId,
        department: adUser.department,
        job_title: adUser.jobTitle,
        is_active: adUser.accountEnabled,
        org_role: this.determineUserRole(adUser),
        updated_at: new Date().toISOString()
      };

      if (existingUser) {
        // Update existing user
        const { error: updateError } = await db.client
          .from('users')
          .update(userData)
          .eq('id', existingUser.id);

        if (updateError) throw updateError;
      } else {
        // Note: We don't create new users in the users table automatically
        // This would typically be done through invitation or signup process
        console.log(`User ${adUser.userPrincipalName} could be invited to system`);
      }

    } catch (error) {
      console.error(`Failed to sync user to users table:`, error);
      // Don't throw here as this is not critical for email recipient sync
    }
  }

  // Determine if user should have system access (customize this logic)
  private shouldUserHaveSystemAccess(adUser: ADUser): boolean {
    // Example logic - you can customize this based on your needs
    const managerialTitles = ['manager', 'director', 'executive', 'lead', 'supervisor'];
    const hrDepartments = ['human resources', 'hr', 'people'];
    
    if (!adUser.jobTitle || !adUser.department) {
      return false;
    }

    const hasManagerialTitle = managerialTitles.some(title => 
      adUser.jobTitle!.toLowerCase().includes(title)
    );

    const isInHR = hrDepartments.some(dept => 
      adUser.department!.toLowerCase().includes(dept)
    );

    return hasManagerialTitle || isInHR;
  }

  // Determine user role based on AD data
  private determineUserRole(adUser: ADUser): string {
    if (!adUser.jobTitle) return 'member';

    const title = adUser.jobTitle.toLowerCase();
    
    if (title.includes('ceo') || title.includes('chief') || title.includes('president')) {
      return 'executive';
    }
    
    if (title.includes('hr') || adUser.department?.toLowerCase().includes('human resources')) {
      return 'hr';
    }
    
    if (title.includes('manager') || title.includes('director') || title.includes('lead')) {
      return 'manager';
    }
    
    return 'member';
  }

  // Update sync timestamp for organization
  private async updateSyncTimestamp(organizationId: string): Promise<void> {
    try {
      const { error } = await db.client
        .from('email_recipients')
        .update({ ad_last_sync: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('ad_sync_enabled', true);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update sync timestamp:', error);
    }
  }

  // Get AD sync configuration for organization
  async getADSyncConfig(organizationId: string): Promise<ADSyncConfig | null> {
    try {
      const { data, error } = await db.client
        .from('organizations')
        .select('settings')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      const settings = data?.settings || {};
      return settings.active_directory_sync || null;
    } catch (error) {
      console.error('Failed to get AD sync config:', error);
      return null;
    }
  }

  // Update AD sync configuration
  async updateADSyncConfig(organizationId: string, config: Partial<ADSyncConfig>): Promise<boolean> {
    try {
      // Get current settings
      const { data: org, error: fetchError } = await db.client
        .from('organizations')
        .select('settings')
        .eq('id', organizationId)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = org?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        active_directory_sync: {
          ...currentSettings.active_directory_sync,
          ...config
        }
      };

      const { error: updateError } = await db.client
        .from('organizations')
        .update({ 
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error('Failed to update AD sync config:', error);
      return false;
    }
  }

  // Test AD connection
  async testADConnection(config: ADSyncConfig): Promise<{ success: boolean; message: string }> {
    try {
      const accessToken = await this.getAccessToken(config);
      
      // Try to fetch a small number of users to test connection
      const response = await fetch('https://graph.microsoft.com/v1.0/users?$top=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.statusText}`);
      }

      return { success: true, message: 'Active Directory connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Schedule automatic sync (called by scheduler)
  async performScheduledSync(organizationId: string): Promise<void> {
    try {
      const config = await this.getADSyncConfig(organizationId);
      
      if (!config || !config.enabled) {
        return;
      }

      // Check if sync is due based on frequency
      if (config.lastSync) {
        const lastSync = new Date(config.lastSync);
        const now = new Date();
        const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        let syncInterval: number;
        switch (config.syncFrequency) {
          case 'hourly':
            syncInterval = 1;
            break;
          case 'daily':
            syncInterval = 24;
            break;
          case 'weekly':
            syncInterval = 24 * 7;
            break;
          default:
            syncInterval = 24; // Default to daily
        }

        if (hoursSinceLastSync < syncInterval) {
          console.log(`Skipping AD sync - not due yet (${hoursSinceLastSync}h since last sync)`);
          return;
        }
      }

      console.log(`Starting scheduled AD sync for organization ${organizationId}`);
      const results = await this.syncUsersFromAD(organizationId, config);
      
      // Update last sync time
      await this.updateADSyncConfig(organizationId, { lastSync: new Date() });
      
      console.log(`Scheduled AD sync completed:`, results);
      
    } catch (error) {
      console.error(`Scheduled AD sync failed for organization ${organizationId}:`, error);
    }
  }

  // Get email recipients with AD information
  async getEmailRecipients(
    organizationId: string, 
    filters: {
      departments?: string[];
      adSyncOnly?: boolean;
      activeOnly?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      let query = db.client
        .from('email_recipients')
        .select('*')
        .eq('organization_id', organizationId);

      if (filters.departments && filters.departments.length > 0) {
        query = query.in('department', filters.departments);
      }

      if (filters.adSyncOnly) {
        query = query.eq('ad_sync_enabled', true);
      }

      if (filters.activeOnly !== false) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('display_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get email recipients:', error);
      return [];
    }
  }
}

// Export singleton instance
export const activeDirectoryService = ActiveDirectoryService.getInstance();