// Analytics Caching Layer for Performance
import { analyticsMonitoring } from './monitoring';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

export class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, hitRate: 0 };
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize = 1000, defaultTtl = 300000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    
    console.log(`🎯 Cache hit: ${key}`);
    return entry.data;
  }

  async set<T>(key: string, data: T, ttl = this.defaultTtl): Promise<void> {
    // Enforce cache size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    });

    console.log(`💾 Cache set: ${key} (TTL: ${ttl}ms)`);
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = this.defaultTtl
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch and store
    console.log(`🔄 Cache miss, fetching: ${key}`);
    const data = await analyticsMonitoring.trackOperation(
      `cache_fetch_${key}`,
      fetcher
    );
    
    await this.set(key, data, ttl);
    return data;
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️  Cache invalidated: ${keysToDelete.length} keys matching ${pattern}`);
  }

  async invalidateOrganization(orgId: string): Promise<void> {
    await this.invalidate(`org:${orgId}:`);
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.invalidate(`user:${userId}:`);
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      console.log(`🧹 Cache evicted oldest: ${oldestKey}`);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧼 Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, hitRate: 0 };
    console.log('🧽 Cache cleared');
  }
}

// Redis-based cache for production environments
export class RedisAnalyticsCache extends AnalyticsCache {
  private redis: any = null;

  constructor() {
    super();
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    if (process.env.REDIS_URL) {
      try {
        // Dynamic import to avoid issues in environments without Redis
        const Redis = (await import('ioredis')).default;
        this.redis = new Redis(process.env.REDIS_URL);
        console.log('✅ Redis cache initialized');
      } catch (error) {
        console.warn('⚠️  Redis not available, falling back to memory cache:', error);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      return super.get(key);
    }

    try {
      const cached = await this.redis.get(`analytics:${key}`);
      if (cached) {
        this.stats.hits++;
        this.updateHitRate();
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis get error:', error);
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  async set<T>(key: string, data: T, ttl = this.defaultTtl): Promise<void> {
    if (!this.redis) {
      return super.set(key, data, ttl);
    }

    try {
      await this.redis.setex(
        `analytics:${key}`,
        Math.floor(ttl / 1000), // Redis uses seconds
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Redis set error:', error);
      // Fallback to memory cache
      return super.set(key, data, ttl);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.redis) {
      return super.invalidate(pattern);
    }

    try {
      const keys = await this.redis.keys(`analytics:*${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🗑️  Redis cache invalidated: ${keys.length} keys`);
      }
    } catch (error) {
      console.error('Redis invalidate error:', error);
    }
  }
}

// Cache key generators for different analytics data types
export class CacheKeyGenerator {
  static behaviorPatterns(orgId: string, timeWindow: string, role: string): string {
    return `org:${orgId}:patterns:${timeWindow}:${role}`;
  }

  static organizationalHealth(orgId: string, timeWindow: string): string {
    return `org:${orgId}:health:${timeWindow}`;
  }

  static interventions(orgId: string, status?: string): string {
    return `org:${orgId}:interventions${status ? `:${status}` : ''}`;
  }

  static userAnalytics(userId: string, timeWindow: string): string {
    return `user:${userId}:analytics:${timeWindow}`;
  }

  static departmentMetrics(orgId: string, department: string, timeWindow: string): string {
    return `org:${orgId}:dept:${department}:${timeWindow}`;
  }

  static aggregatedMetrics(orgId: string, metric: string, timeWindow: string): string {
    return `org:${orgId}:agg:${metric}:${timeWindow}`;
  }
}

// Precomputed analytics materialized views
export class MaterializedViewManager {
  private cache: AnalyticsCache;

  constructor(cache: AnalyticsCache) {
    this.cache = cache;
  }

  async getBehaviorPatternsAggregated(orgId: string, timeWindow: string) {
    const key = CacheKeyGenerator.behaviorPatterns(orgId, timeWindow, 'aggregated');
    
    return this.cache.getOrSet(key, async () => {
      // This would call the database to compute aggregated patterns
      console.log(`🔢 Computing aggregated behavior patterns for org ${orgId}`);
      
      // Mock implementation - replace with actual database query
      return {
        totalPatterns: 5,
        avgSeverity: 3.4,
        trendDirection: 'improving',
        topCategories: ['Communication', 'Leadership', 'Process'],
        computedAt: new Date().toISOString()
      };
    }, 300000); // 5 minute TTL
  }

  async getDepartmentHealthScores(orgId: string) {
    const key = CacheKeyGenerator.aggregatedMetrics(orgId, 'dept_health', 'daily');
    
    return this.cache.getOrSet(key, async () => {
      console.log(`🏢 Computing department health scores for org ${orgId}`);
      
      // Mock implementation - replace with actual computation
      return {
        departments: [
          { name: 'Engineering', healthScore: 7.2, trend: 'improving' },
          { name: 'Marketing', healthScore: 8.1, trend: 'stable' },
          { name: 'HR', healthScore: 8.8, trend: 'improving' },
          { name: 'Executive', healthScore: 6.4, trend: 'declining' }
        ],
        organizationAverage: 7.6,
        computedAt: new Date().toISOString()
      };
    }, 86400000); // 24 hour TTL for daily aggregates
  }

  async getInterventionEffectiveness(orgId: string) {
    const key = CacheKeyGenerator.aggregatedMetrics(orgId, 'intervention_effectiveness', 'weekly');
    
    return this.cache.getOrSet(key, async () => {
      console.log(`📊 Computing intervention effectiveness for org ${orgId}`);
      
      return {
        totalInterventions: 12,
        completedInterventions: 8,
        avgEffectivenessScore: 3.7,
        totalROI: 45000,
        topPerformingInterventions: [
          { title: 'Communication Workshop', effectiveness: 4.2, roi: 18750 },
          { title: 'Leadership Coaching', effectiveness: 4.0, roi: 15500 }
        ],
        computedAt: new Date().toISOString()
      };
    }, 604800000); // 7 day TTL for weekly aggregates
  }

  // Proactively refresh cache for frequently accessed data
  async warmCache(orgId: string): Promise<void> {
    console.log(`🔥 Warming cache for organization ${orgId}`);
    
    const timeWindows = ['week', 'month', 'quarter'];
    
    // Warm up critical analytics data
    await Promise.all([
      ...timeWindows.map(window => this.getBehaviorPatternsAggregated(orgId, window)),
      this.getDepartmentHealthScores(orgId),
      this.getInterventionEffectiveness(orgId)
    ]);
    
    console.log(`✅ Cache warmed for organization ${orgId}`);
  }
}

// Global cache instances
export const analyticsCache = process.env.REDIS_URL 
  ? new RedisAnalyticsCache() 
  : new AnalyticsCache();

export const materializedViews = new MaterializedViewManager(analyticsCache);

// Cache warming on startup for demo organization
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    materializedViews.warmCache('11111111-1111-1111-1111-111111111111').catch(console.error);
  }, 5000);
}