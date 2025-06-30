// CSRF Protection utility
import { randomBytes, createHmac } from 'crypto';
import { NextRequest } from 'next/server';

const CSRF_SECRET = process.env.CSRF_SECRET;

if (!CSRF_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('CSRF_SECRET environment variable is required in production');
}

// Use a development fallback secret if not set
const SECRET = CSRF_SECRET || 'dev-secret-not-for-production-use-' + Date.now();

export class CSRFProtection {
  private static generateToken(): string {
    const randomToken = randomBytes(32).toString('hex');
    const timestamp = Date.now().toString();
    const message = `${randomToken}.${timestamp}`;
    const signature = createHmac('sha256', SECRET)
      .update(message)
      .digest('hex');
    
    return `${message}.${signature}`;
  }

  private static verifyToken(token: string, maxAge: number = 3600000): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const [randomToken, timestamp, signature] = parts;
      const message = `${randomToken}.${timestamp}`;
      
      // Verify signature
      const expectedSignature = createHmac('sha256', SECRET)
        .update(message)
        .digest('hex');
      
      if (signature !== expectedSignature) return false;

      // Check timestamp
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      
      return (now - tokenTime) <= maxAge;
    } catch {
      return false;
    }
  }

  static generateCSRFToken(): string {
    return this.generateToken();
  }

  static validateCSRFToken(request: NextRequest): boolean {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // SECURITY: CSRF bypass removed - all state-changing requests require valid tokens

    const token = request.headers.get('x-csrf-token') || 
                  request.headers.get('csrf-token');

    if (!token) {
      console.warn('CSRF token missing in request');
      return false;
    }

    const isValid = this.verifyToken(token);
    if (!isValid) {
      console.warn('Invalid CSRF token detected');
    }

    return isValid;
  }

  static getCSRFHeaders() {
    return {
      'X-CSRF-Token': this.generateToken(),
    };
  }
}

// Middleware helper
export function withCSRFProtection(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    if (!CSRFProtection.validateCSRFToken(request)) {
      return new Response('Invalid CSRF token', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    return handler(request, ...args);
  };
}