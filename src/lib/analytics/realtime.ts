// Real-Time Analytics Updates via WebSocket and Server-Sent Events
import { analyticsCache, CacheKeyGenerator } from './cache';
import { analyticsMonitoring } from './monitoring';

interface AnalyticsUpdate {
  type: 'behavior_pattern_change' | 'intervention_update' | 'new_interaction' | 'health_score_change';
  organizationId: string;
  data: any;
  timestamp: string;
  affectedUsers?: string[];
  metadata?: Record<string, any>;
}

interface Subscription {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  filters: string[];
  callback?: (update: AnalyticsUpdate) => void;
  websocket?: WebSocket;
  lastPing?: number;
}

export class RealTimeAnalytics {
  private subscriptions = new Map<string, Subscription>();
  private updateQueue: AnalyticsUpdate[] = [];
  private processing = false;

  constructor() {
    // Process update queue every 2 seconds
    setInterval(() => this.processUpdateQueue(), 2000);
    
    // Cleanup stale subscriptions every 30 seconds
    setInterval(() => this.cleanupSubscriptions(), 30000);
  }

  // Subscribe to real-time analytics updates
  subscribe(subscription: Subscription): string {
    const subscriptionId = `${subscription.organizationId}_${subscription.userId}_${Date.now()}`;
    
    this.subscriptions.set(subscriptionId, {
      ...subscription,
      id: subscriptionId,
      lastPing: Date.now()
    });

    console.log(`📡 New analytics subscription: ${subscriptionId} for org ${subscription.organizationId}`);
    
    // Send initial data
    this.sendInitialData(subscriptionId);
    
    return subscriptionId;
  }

  // Unsubscribe from updates
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      console.log(`📴 Unsubscribed: ${subscriptionId}`);
    }
  }

  // Broadcast update to relevant subscribers
  async broadcastUpdate(update: AnalyticsUpdate): Promise<void> {
    this.updateQueue.push(update);
    
    // Invalidate relevant cache entries
    await this.invalidateCache(update);
    
    console.log(`📢 Queued update: ${update.type} for org ${update.organizationId}`);
  }

  private async processUpdateQueue(): Promise<void> {
    if (this.processing || this.updateQueue.length === 0) return;
    
    this.processing = true;
    
    try {
      const updates = [...this.updateQueue];
      this.updateQueue = [];
      
      for (const update of updates) {
        await this.processUpdate(update);
      }
    } catch (error) {
      console.error('Error processing update queue:', error);
    } finally {
      this.processing = false;
    }
  }

  private async processUpdate(update: AnalyticsUpdate): Promise<void> {
    const relevantSubscriptions = this.getRelevantSubscriptions(update);
    
    for (const subscription of relevantSubscriptions) {
      try {
        await this.sendUpdateToSubscription(subscription, update);
      } catch (error) {
        console.error(`Failed to send update to subscription ${subscription.id}:`, error);
        // Remove failed subscription
        this.subscriptions.delete(subscription.id);
      }
    }
  }

  private getRelevantSubscriptions(update: AnalyticsUpdate): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => {
      // Organization must match
      if (sub.organizationId !== update.organizationId) return false;
      
      // Check role-based access
      if (!this.hasAccess(sub.role, update.type)) return false;
      
      // Check filters
      if (sub.filters.length > 0 && !sub.filters.includes(update.type)) return false;
      
      return true;
    });
  }

  private hasAccess(role: string, updateType: string): boolean {
    const permissions = {
      executive: ['behavior_pattern_change', 'intervention_update', 'new_interaction', 'health_score_change'],
      hr: ['behavior_pattern_change', 'intervention_update', 'health_score_change'],
      manager: ['behavior_pattern_change', 'health_score_change'],
      member: ['new_interaction'] // Only their own interactions
    };

    return permissions[role as keyof typeof permissions]?.includes(updateType) || false;
  }

  private async sendUpdateToSubscription(subscription: Subscription, update: AnalyticsUpdate): Promise<void> {
    // Filter update data based on role
    const filteredUpdate = this.filterUpdateForRole(update, subscription.role);
    
    if (subscription.callback) {
      // Direct callback (for server-side subscriptions)
      subscription.callback(filteredUpdate);
    } else if (subscription.websocket) {
      // WebSocket connection
      subscription.websocket.send(JSON.stringify({
        type: 'analytics_update',
        data: filteredUpdate
      }));
    }
    
    subscription.lastPing = Date.now();
  }

  private filterUpdateForRole(update: AnalyticsUpdate, role: string): AnalyticsUpdate {
    const filtered = { ...update };
    
    // Remove sensitive data based on role
    if (role === 'manager') {
      // Managers only see department-level data
      delete filtered.affectedUsers;
    } else if (role === 'member') {
      // Members only see anonymized data
      delete filtered.affectedUsers;
      delete filtered.metadata;
    }
    
    return filtered;
  }

  private async sendInitialData(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    try {
      // Send current analytics snapshot
      const initialData: AnalyticsUpdate = {
        type: 'behavior_pattern_change',
        organizationId: subscription.organizationId,
        data: {
          type: 'initial_snapshot',
          message: 'Connected to real-time analytics',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      await this.sendUpdateToSubscription(subscription, initialData);
    } catch (error) {
      console.error(`Failed to send initial data to ${subscriptionId}:`, error);
    }
  }

  private async invalidateCache(update: AnalyticsUpdate): Promise<void> {
    const orgId = update.organizationId;
    
    switch (update.type) {
      case 'behavior_pattern_change':
        await analyticsCache.invalidate(`org:${orgId}:patterns:`);
        break;
      case 'intervention_update':
        await analyticsCache.invalidate(`org:${orgId}:interventions`);
        break;
      case 'health_score_change':
        await analyticsCache.invalidate(`org:${orgId}:health:`);
        break;
      case 'new_interaction':
        await analyticsCache.invalidate(`org:${orgId}:`);
        break;
    }
  }

  private cleanupSubscriptions(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [id, subscription] of this.subscriptions) {
      if (subscription.lastPing && now - subscription.lastPing > staleThreshold) {
        this.subscriptions.delete(id);
        console.log(`🧹 Cleaned up stale subscription: ${id}`);
      }
    }
  }

  // Simulate analytics updates for demo purposes
  startDemoUpdates(organizationId: string): void {
    setInterval(() => {
      this.generateDemoUpdate(organizationId);
    }, 30000); // Every 30 seconds
  }

  private generateDemoUpdate(organizationId: string): void {
    const updateTypes: AnalyticsUpdate['type'][] = [
      'behavior_pattern_change',
      'intervention_update', 
      'new_interaction',
      'health_score_change'
    ];

    const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
    const demoData = this.generateDemoData(randomType);

    this.broadcastUpdate({
      type: randomType,
      organizationId,
      data: demoData,
      timestamp: new Date().toISOString(),
      metadata: { source: 'demo_generator' }
    });
  }

  private generateDemoData(type: AnalyticsUpdate['type']): any {
    switch (type) {
      case 'behavior_pattern_change':
        return {
          pattern: 'Communication Breakdowns',
          oldSeverity: 3.2,
          newSeverity: 3.4,
          change: '+0.2',
          affectedDepartments: ['Engineering', 'Marketing']
        };

      case 'intervention_update':
        return {
          interventionId: 'int-123',
          title: 'Communication Workshop Series',
          status: 'in_progress',
          progress: Math.floor(Math.random() * 100),
          effectivenessScore: (3 + Math.random() * 2).toFixed(1)
        };

      case 'new_interaction':
        return {
          interactionType: 'vote',
          pattern: 'Meeting Overload',
          severity: Math.floor(Math.random() * 5) + 1,
          department: 'Engineering'
        };

      case 'health_score_change':
        return {
          department: 'Marketing',
          oldScore: 7.8,
          newScore: 8.1,
          change: '+0.3',
          trend: 'improving'
        };

      default:
        return { message: 'Unknown update type' };
    }
  }

  getSubscriptionStats(): {
    totalSubscriptions: number;
    subscriptionsByOrg: Record<string, number>;
    subscriptionsByRole: Record<string, number>;
  } {
    const stats = {
      totalSubscriptions: this.subscriptions.size,
      subscriptionsByOrg: {} as Record<string, number>,
      subscriptionsByRole: {} as Record<string, number>
    };

    for (const subscription of this.subscriptions.values()) {
      // Count by organization
      stats.subscriptionsByOrg[subscription.organizationId] = 
        (stats.subscriptionsByOrg[subscription.organizationId] || 0) + 1;
      
      // Count by role
      stats.subscriptionsByRole[subscription.role] = 
        (stats.subscriptionsByRole[subscription.role] || 0) + 1;
    }

    return stats;
  }

  // Enhanced subscription method for role-based filtering
  subscribeToUpdates(
    organizationId: string, 
    userId: string, 
    role: string, 
    callback: (update: AnalyticsUpdate) => void
  ): () => void {
    const subscriptionId = this.subscribe({
      id: '',
      organizationId,
      userId,
      role,
      filters: [],
      callback: (update) => {
        // Filter updates based on user role
        if (this.hasAccess(role, update.type)) {
          callback(update);
        }
      }
    });

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  // Create Server-Sent Events connection
  createSSEConnection(organizationId: string, userId: string, role: string): EventSource {
    const url = `/api/analytics/realtime/sse?orgId=${organizationId}&userId=${userId}&role=${role}`;
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const update: AnalyticsUpdate = JSON.parse(event.data);
        this.broadcastUpdate(update);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Auto-reconnect logic could go here
    };
    
    return eventSource;
  }

  // Enhanced WebSocket connection with role-based filtering
  createWebSocketConnection(organizationId: string, userId: string, role: string): WebSocket {
    const wsUrl = `ws://localhost:3000/api/analytics/ws?orgId=${organizationId}&userId=${userId}&role=${role}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('📡 WebSocket connection established');
      // Send authentication message
      ws.send(JSON.stringify({
        type: 'auth',
        organizationId,
        userId,
        role,
        timestamp: new Date().toISOString()
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const update: AnalyticsUpdate = JSON.parse(event.data);
        this.broadcastUpdate(update);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('📡 WebSocket connection closed');
      // Auto-reconnect logic could go here
    };
    
    return ws;
  }
}

// Server-Sent Events implementation for browser clients
export class AnalyticsSSE {
  private realtime: RealTimeAnalytics;

  constructor(realtime: RealTimeAnalytics) {
    this.realtime = realtime;
  }

  createEventStream(req: Request, organizationId: string, userId: string, role: string): Response {
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString()
        })}\n\n`);

        // Subscribe to updates
        const subscriptionId = this.realtime.subscribe({
          id: '',
          organizationId,
          userId,
          role,
          filters: [],
          callback: (update) => {
            controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
          }
        });

        // Cleanup on close
        req.signal?.addEventListener('abort', () => {
          this.realtime.unsubscribe(subscriptionId);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });
  }
}

// WebSocket handler for Next.js API routes
export class AnalyticsWebSocket {
  private realtime: RealTimeAnalytics;

  constructor(realtime: RealTimeAnalytics) {
    this.realtime = realtime;
  }

  handleConnection(ws: WebSocket, organizationId: string, userId: string, role: string): void {
    console.log(`🔌 WebSocket connected: ${userId} (${role}) in org ${organizationId}`);

    const subscriptionId = this.realtime.subscribe({
      id: '',
      organizationId,
      userId,
      role,
      filters: [],
      websocket: ws
    });

    ws.addEventListener('close', () => {
      this.realtime.unsubscribe(subscriptionId);
      console.log(`🔌 WebSocket disconnected: ${subscriptionId}`);
    });

    ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data as string);
        this.handleMessage(subscriptionId, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });
  }

  private handleMessage(subscriptionId: string, message: any): void {
    switch (message.type) {
      case 'ping':
        const subscription = this.realtime['subscriptions'].get(subscriptionId);
        if (subscription?.websocket) {
          subscription.websocket.send(JSON.stringify({ type: 'pong' }));
          subscription.lastPing = Date.now();
        }
        break;
      
      case 'subscribe_filter':
        // Update subscription filters
        const sub = this.realtime['subscriptions'].get(subscriptionId);
        if (sub) {
          sub.filters = message.filters || [];
        }
        break;
    }
  }

  // Enhanced subscription method for role-based filtering
  subscribeToUpdates(
    organizationId: string, 
    userId: string, 
    role: string, 
    callback: (update: AnalyticsUpdate) => void
  ): () => void {
    const subscriptionId = this.subscribe({
      id: '',
      organizationId,
      userId,
      role,
      filters: [],
      callback: (update) => {
        // Filter updates based on user role
        if (this.hasAccess(role, update.type)) {
          callback(update);
        }
      }
    });

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  // Create Server-Sent Events connection
  createSSEConnection(organizationId: string, userId: string, role: string): EventSource {
    const url = `/api/analytics/realtime/sse?orgId=${organizationId}&userId=${userId}&role=${role}`;
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const update: AnalyticsUpdate = JSON.parse(event.data);
        this.broadcastUpdate(update);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Auto-reconnect logic could go here
    };
    
    return eventSource;
  }

  // Enhanced WebSocket connection with role-based filtering
  createWebSocketConnection(organizationId: string, userId: string, role: string): WebSocket {
    const wsUrl = `ws://localhost:3000/api/analytics/ws?orgId=${organizationId}&userId=${userId}&role=${role}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('📡 WebSocket connection established');
      // Send authentication message
      ws.send(JSON.stringify({
        type: 'auth',
        organizationId,
        userId,
        role,
        timestamp: new Date().toISOString()
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const update: AnalyticsUpdate = JSON.parse(event.data);
        this.broadcastUpdate(update);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('📡 WebSocket connection closed');
      // Auto-reconnect logic could go here
    };
    
    return ws;
  }
}

// Global real-time analytics instance
export const realTimeAnalytics = new RealTimeAnalytics();

// Start demo updates for development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    realTimeAnalytics.startDemoUpdates('11111111-1111-1111-1111-111111111111');
  }, 10000);
}