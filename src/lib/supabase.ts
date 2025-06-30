// Supabase client configuration and utilities

import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Create Supabase client with error handling
const createSupabaseClient = () => {
  const url = config.database.url;
  const key = config.database.anonKey;
  
  if (!url || !key) {
    console.warn('⚠️  Supabase configuration missing. Some features will be unavailable.');
    // Return a mock client for development
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            order: () => Promise.resolve({ data: [], error: null }),
            limit: () => Promise.resolve({ data: [], error: null }),
            in: () => Promise.resolve({ data: [], error: null }),
            contains: () => Promise.resolve({ data: [], error: null }),
            range: () => Promise.resolve({ data: [], error: null }),
            gt: () => Promise.resolve({ data: [], error: null })
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          }),
          or: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          }),
          then: (resolve: Function) => resolve({ data: [], error: null })
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
            })
          })
        }),
        delete: () => ({
          eq: () => Promise.resolve({ error: new Error('Supabase not configured') })
        }),
        upsert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        })
      }),
    } as any;
  }
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

export const supabase = createSupabaseClient();

// Admin client for server-side operations
export const supabaseAdmin = (config.database.serviceKey && config.database.url)
  ? createClient(config.database.url, config.database.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Database table names
export const tables = {
  users: 'users',
  hexie_cards: 'hexie_cards',
  categories: 'hexie_categories',
  tags: 'tags',
  hexie_card_tags: 'hexie_card_tags',
  workspaces: 'workspaces',
  workspace_collaborators: 'workspace_collaborators',
  hexie_instances: 'hexie_instances',
  hexie_groups: 'hexie_groups',
  references: 'references',
  security_logs: 'security_logs',
  behavior_reports: 'behavior_reports', // Future feature
  behavior_types: 'behavior_types', // Future feature
  analytics_visualizations: 'analytics_visualizations', // Future feature
  hexie_contests: 'hexie_contests',
} as const;

// Type-safe database operations
export class DatabaseService {
  private client = supabase;

  // User operations
  async getUser(id: string) {
    const { data, error } = await this.client
      .from(tables.users)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUser(id: string, updates: Partial<any>) {
    const { data, error } = await this.client
      .from(tables.users)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Hexie card operations - Load from existing hexies-admin database
  async getHexieCards(filters: {
    category?: string;
    subscription_tier?: string;
    is_active?: boolean;
    created_by?: string;
  } = {}) {
    // Optimized query - only select needed fields for better performance
    let query = this.client
      .from(tables.hexie_cards)
      .select(`
        id,
        title,
        front_text,
        back_text,
        category,
        subcategory,
        color_scheme,
        icon_svg,
        subscription_tier_required,
        is_active,
        created_by,
        created_at,
        updated_at,
        references,
        card_references,
        tags,
        severity_rating,
        psychological_framework
      `);

    // Filter by subscription tier access with proper indexing
    if (filters.subscription_tier) {
      const tierHierarchy = { free: 0, basic: 1, premium: 2 };
      const userTierLevel = tierHierarchy[filters.subscription_tier as keyof typeof tierHierarchy] || 0;
      
      if (userTierLevel === 0) {
        query = query.eq('subscription_tier_required', 'free');
      } else if (userTierLevel === 1) {
        query = query.in('subscription_tier_required', ['free', 'basic']);
      }
      // Premium users get everything (no filter)
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Use is_active filter with proper index
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    } else {
      // Default to only active cards
      query = query.eq('is_active', true);
    }

    // Filter out archived cards for performance
    query = query.eq('is_archived', false);

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    // Order and limit for performance
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100); // Limit to prevent large data fetches

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    // Transform data to match expected TesseraCard interface
    const transformedData = (data || []).map((card: any) => ({
      id: card.id,
      title: card.title,
      front_text: card.front_text,
      back_text: card.back_text,
      category: card.category,
      subcategory: card.subcategory,
      subscription_tier_required: card.subscription_tier_required,
      color_scheme: card.color_scheme || {
        primary: '#3b82f6',
        secondary: '#1e40af',
        text: '#ffffff'
      },
      icon_svg: card.icon_svg,
      created_at: card.created_at,
      updated_at: card.updated_at,
      created_by: card.created_by,
      is_active: card.is_active,
      tags: card.tags || [],
      references: card.references || card.card_references || [],
      card_references: card.card_references || card.references || [],
      severity_rating: card.severity_rating,
      psychological_framework: card.psychological_framework
    }));

    return transformedData;
  }

  async createHexieCard(card: Partial<any>) {
    const { data, error } = await this.client
      .from(tables.hexie_cards)
      .insert([{
        ...card,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Alias methods for backward compatibility with rebrand
  async getTesseraCards(filters: {
    category?: string;
    subscription_tier?: string;
    is_active?: boolean;
    created_by?: string;
  } = {}) {
    return this.getHexieCards(filters);
  }

  async createTesseraCard(card: Partial<any>) {
    return this.createHexieCard(card);
  }

  // Workspace operations
  async getWorkspaces(userId: string) {
    const { data, error } = await this.client
      .from(tables.workspaces)
      .select(`
        *,
        workspace_collaborators!inner(*)
      `)
      .or(`owner_id.eq.${userId},workspace_collaborators.user_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createWorkspace(workspace: Partial<any>, userId: string) {
    const { data, error } = await this.client
      .from(tables.workspaces)
      .insert([{
        ...workspace,
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Add owner as collaborator
    await this.client
      .from(tables.workspace_collaborators)
      .insert([{
        workspace_id: data.id,
        user_id: userId,
        role: 'owner',
        permissions: {
          can_edit: true,
          can_delete: true,
          can_invite: true,
          can_export: true,
        },
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      }]);

    return data;
  }

  // Hexie instance operations (hexies placed in workspaces)
  async getHexieInstances(workspaceId: string) {
    const { data, error } = await this.client
      .from(tables.hexie_instances)
      .select(`
        *,
        hexie_cards(*)
      `)
      .eq('workspace_id', workspaceId)
      .order('z_index', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createHexieInstance(instance: Partial<any>) {
    const { data, error } = await this.client
      .from(tables.hexie_instances)
      .insert([{
        ...instance,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateHexieInstance(id: string, updates: Partial<any>) {
    const { data, error } = await this.client
      .from(tables.hexie_instances)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteHexieInstance(id: string) {
    const { error } = await this.client
      .from(tables.hexie_instances)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Categories operations
  async getCategories() {
    const { data, error } = await this.client
      .from(tables.categories)
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Security logging
  async logSecurityEvent(log: {
    user_id: string;
    action: string;
    resource: string;
    ip_address: string;
    user_agent: string;
    metadata?: Record<string, any>;
  }) {
    const { error } = await this.client
      .from(tables.security_logs)
      .insert([{
        ...log,
        created_at: new Date().toISOString(),
      }]);

    if (error) console.error('Failed to log security event:', error);
  }

  // Real-time subscriptions
  subscribeToWorkspace(workspaceId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`workspace:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tables.hexie_instances,
          filter: `workspace_id=eq.${workspaceId}`,
        },
        callback
      )
      .subscribe();
  }

  subscribeToWorkspaceCollaborators(workspaceId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`workspace_collaborators:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tables.workspace_collaborators,
          filter: `workspace_id=eq.${workspaceId}`,
        },
        callback
      )
      .subscribe();
  }

  // Collaboration features
  async createWorkspaceShare(workspaceId: string, userId: string, expiresInHours: number = 24) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { data, error } = await this.client
      .from('workspace_shares')
      .insert([{
        workspace_id: workspaceId,
        share_token: crypto.randomUUID().replace(/-/g, ''),
        created_by: userId,
        expires_at: expiresAt.toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getWorkspaceByShareToken(shareToken: string) {
    const { data, error } = await this.client
      .from('workspace_shares')
      .select(`
        *,
        workspaces(*)
      `)
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) throw error;
    return data;
  }

  async joinSession(workspaceId: string, sessionName: string, shareToken?: string, userId?: string) {
    const { data, error } = await this.client
      .from('session_participants')
      .insert([{
        workspace_id: workspaceId,
        session_name: sessionName,
        user_id: userId || null,
        share_token: shareToken || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCursorPosition(participantId: string, x: number, y: number) {
    const { error } = await this.client
      .from('session_participants')
      .update({ 
        cursor_position: { x, y },
        last_seen: new Date().toISOString()
      })
      .eq('id', participantId);

    if (error) throw error;
  }

  async getActiveParticipants(workspaceId: string) {
    const { data, error } = await this.client
      .from('session_participants')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .gt('last_seen', new Date(Date.now() - 30000).toISOString()); // Active in last 30 seconds

    if (error) throw error;
    return data || [];
  }

  // Tessellation and snapping
  async updateHexieWithTessellation(instanceId: string, updates: any) {
    const { data, error } = await this.client
      .from(tables.hexie_instances)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Hexie groups
  async createHexieGroup(workspaceId: string, name: string, color: string, userId: string) {
    const { data, error } = await this.client
      .from('hexie_groups')
      .insert([{
        workspace_id: workspaceId,
        name,
        color,
        created_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addHexieToGroup(groupId: string, hexieInstanceId: string) {
    const { error } = await this.client
      .from('hexie_group_members')
      .insert([{
        group_id: groupId,
        hexie_instance_id: hexieInstanceId,
      }]);

    if (error) throw error;
  }

  async getWorkspaceGroups(workspaceId: string) {
    const { data, error } = await this.client
      .from('hexie_groups')
      .select(`
        *,
        hexie_group_members(
          hexie_instance_id,
          hexie_instances(*)
        )
      `)
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data || [];
  }

  // Voting system
  async castVote(hexieInstanceId: string, participantId: string, voteType: string, severityLevel?: number) {
    const { data, error } = await this.client
      .from('hexie_votes')
      .upsert([{
        hexie_instance_id: hexieInstanceId,
        participant_id: participantId,
        vote_type: voteType,
        severity_level: severityLevel,
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getHexieVotes(hexieInstanceId: string) {
    const { data, error } = await this.client
      .from('hexie_votes')
      .select('*')  // Remove session_participants join since it doesn't exist
      .eq('hexie_instance_id', hexieInstanceId);

    if (error) throw error;
    return data || [];
  }

  // Timer functionality
  async createTimer(workspaceId: string, name: string, durationMinutes: number, userId: string) {
    const { data, error } = await this.client
      .from('workspace_timers')
      .insert([{
        workspace_id: workspaceId,
        name,
        duration_minutes: durationMinutes,
        created_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async startTimer(timerId: string) {
    const now = new Date();
    const { data: timer } = await this.client
      .from('workspace_timers')
      .select('duration_minutes')
      .eq('id', timerId)
      .single();

    if (!timer) throw new Error('Timer not found');

    const endsAt = new Date(now.getTime() + timer.duration_minutes * 60000);

    const { data, error } = await this.client
      .from('workspace_timers')
      .update({
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        is_active: true,
      })
      .eq('id', timerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getActiveTimer(workspaceId: string) {
    const { data, error } = await this.client
      .from('workspace_timers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .gt('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  // Real-time subscriptions for collaboration
  subscribeToParticipants(workspaceId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`participants:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        callback
      )
      .subscribe();
  }

  subscribeToVotes(workspaceId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`votes:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hexie_votes',
        },
        callback
      )
      .subscribe();
  }

  subscribeToTimer(workspaceId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`timer:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_timers',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        callback
      )
      .subscribe();
  }

  // Scenario management functions
  async getScenarioCategories() {
    try {
      console.log('Attempting to fetch scenario categories from database...');
      const { data, error } = await this.client
        .from('scenario_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Database error fetching scenario categories:', error);
        throw error;
      }
      
      console.log('Successfully fetched scenario categories:', data?.length || 0);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getScenarioCategories:', error);
      return { data: null, error };
    }
  }

  async getScenarios(categoryId?: string, options?: {
    difficulty_level?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      console.log('Attempting to fetch scenarios from database for category:', categoryId);
      let query = this.client
        .from('scenarios')
        .select(`
          *,
          scenario_categories(name)
        `)
        .eq('is_active', true);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (options?.difficulty_level) {
        query = query.eq('difficulty_level', options.difficulty_level);
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,situation.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('Database error fetching scenarios:', error);
        throw error;
      }
      
      console.log('Successfully fetched scenarios:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getScenarios:', error);
      throw error;
    }
  }

  async getScenario(id: string) {
    const { data, error } = await this.client
      .from('scenarios')
      .select(`
        *,
        scenario_categories(name)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  async rateScenario(scenarioId: string, userId: string, rating: number, feedback?: string) {
    const { data, error } = await this.client
      .from('scenario_ratings')
      .upsert([{
        scenario_id: scenarioId,
        user_id: userId,
        rating,
        feedback,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async startWorkspaceScenario(workspaceId: string, scenarioId: string, userId: string) {
    const { data, error } = await this.client
      .from('workspace_scenarios')
      .insert([{
        workspace_id: workspaceId,
        scenario_id: scenarioId,
        created_by: userId,
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async completeWorkspaceScenario(
    workspaceScenarioId: string, 
    facilitorNotes?: string, 
    outcomeSummary?: string,
    hexiesUsed?: any[],
    insightsCaptured?: string[]
  ) {
    const { data, error } = await this.client
      .from('workspace_scenarios')
      .update({
        completed_at: new Date().toISOString(),
        facilitator_notes: facilitorNotes,
        outcome_summary: outcomeSummary,
        hexies_used: hexiesUsed,
        insights_captured: insightsCaptured
      })
      .eq('id', workspaceScenarioId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createCustomScenario(workspaceId: string, userId: string, scenario: {
    title: string;
    description: string;
    context?: string;
    characters?: any[];
    challenge: string;
    is_private?: boolean;
  }) {
    const { data, error } = await this.client
      .from('custom_scenarios')
      .insert([{
        workspace_id: workspaceId,
        created_by: userId,
        ...scenario,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getWorkspaceScenarios(workspaceId: string) {
    const { data, error } = await this.client
      .from('workspace_scenarios')
      .select(`
        *,
        scenarios(title, difficulty_level, estimated_time_minutes)
      `)
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Tag management functions
  async getTags(options?: {
    enabled_only?: boolean;
    order_by?: 'name' | 'usage_count' | 'created_at';
    limit?: number;
  }) {
    let query = this.client.from(tables.tags).select('*');
    
    if (options?.enabled_only) {
      query = query.eq('is_enabled', true);
    }
    
    if (options?.order_by) {
      const ascending = options.order_by !== 'usage_count';
      query = query.order(options.order_by, { ascending });
    } else {
      query = query.order('usage_count', { ascending: false });
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createTag(tag: {
    name: string;
    description?: string;
    color?: string;
    created_by?: string;
  }) {
    const { data, error } = await this.client
      .from(tables.tags)
      .insert([{
        name: tag.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: tag.description,
        color: tag.color || '#6b7280',
        is_enabled: true,
        created_by: tag.created_by,
        usage_count: 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTag(id: string, updates: {
    name?: string;
    description?: string;
    color?: string;
    is_enabled?: boolean;
  }) {
    const { data, error } = await this.client
      .from(tables.tags)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTag(id: string) {
    // First remove all associations
    await this.client
      .from(tables.hexie_card_tags)
      .delete()
      .eq('tag_id', id);

    // Then delete the tag
    const { error } = await this.client
      .from(tables.tags)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getHexieCardTags(hexieCardId: string) {
    const { data, error } = await this.client
      .from(tables.hexie_card_tags)
      .select(`
        *,
        tags (
          id,
          name,
          description,
          color,
          is_enabled
        )
      `)
      .eq('hexie_card_id', hexieCardId);

    if (error) throw error;
    return data || [];
  }

  async addTagToHexieCard(hexieCardId: string, tagId: string) {
    const { data, error } = await this.client
      .from(tables.hexie_card_tags)
      .insert([{
        hexie_card_id: hexieCardId,
        tag_id: tagId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeTagFromHexieCard(hexieCardId: string, tagId: string) {
    const { error } = await this.client
      .from(tables.hexie_card_tags)
      .delete()
      .eq('hexie_card_id', hexieCardId)
      .eq('tag_id', tagId);

    if (error) throw error;
  }

  async setHexieCardTags(hexieCardId: string, tagIds: string[]) {
    // Remove existing associations
    await this.client
      .from(tables.hexie_card_tags)
      .delete()
      .eq('hexie_card_id', hexieCardId);

    // Add new associations
    if (tagIds.length > 0) {
      const { error } = await this.client
        .from(tables.hexie_card_tags)
        .insert(
          tagIds.map(tagId => ({
            hexie_card_id: hexieCardId,
            tag_id: tagId,
          }))
        );

      if (error) throw error;
    }
  }

  async searchHexiesByTags(tagNames: string[]) {
    const { data, error } = await this.client
      .rpc('search_hexies_by_tags', {
        tag_names: tagNames
      });

    if (error) throw error;
    return data || [];
  }

  async getHexieCardsWithTags(options?: {
    subscription_tier?: string;
    category?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    let query = this.client.from('hexie_cards_with_tags').select('*');
    
    if (options?.subscription_tier) {
      query = query.eq('subscription_tier_required', options.subscription_tier);
    }
    
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    
    if (options?.tags && options.tags.length > 0) {
      query = query.contains('tag_names', options.tags);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Utility functions
export const getSupabaseSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getSupabaseUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};