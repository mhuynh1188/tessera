// Simple in-memory rate limiter for email services
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();

  async check(key: string, identifier: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const rateLimitKey = `${key}:${identifier}`;
    
    const entry = this.store.get(rateLimitKey);
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(rateLimitKey, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (entry.count >= maxRequests) {
      return false;
    }
    
    // Increment count
    entry.count++;
    this.store.set(rateLimitKey, entry);
    
    return true;
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}