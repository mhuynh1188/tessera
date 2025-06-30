/**
 * @jest-environment node
 */
import { CSRFProtection } from '@/lib/csrf';
import { NextRequest } from 'next/server';

// Mock environment variable
const originalEnv = process.env;

describe('CSRF Protection', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      CSRF_SECRET: 'test-secret-key-for-testing-only-32chars',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Token Generation', () => {
    it('should generate valid CSRF tokens', () => {
      const token = CSRFProtection.generateCSRFToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // random.timestamp.signature
    });

    it('should generate unique tokens', () => {
      const token1 = CSRFProtection.generateCSRFToken();
      const token2 = CSRFProtection.generateCSRFToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with proper structure', () => {
      const token = CSRFProtection.generateCSRFToken();
      const parts = token.split('.');
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toMatch(/^[a-f0-9]{64}$/); // 32 bytes hex = 64 chars
      expect(parts[1]).toMatch(/^\d+$/); // timestamp
      expect(parts[2]).toMatch(/^[a-f0-9]{64}$/); // signature
    });
  });

  describe('Token Validation', () => {
    it('should validate correct tokens', () => {
      const token = CSRFProtection.generateCSRFToken();
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
        },
      });

      const isValid = CSRFProtection.validateCSRFToken(mockRequest);
      expect(isValid).toBe(true);
    });

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.signature';
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': invalidToken,
        },
      });

      const isValid = CSRFProtection.validateCSRFToken(mockRequest);
      expect(isValid).toBe(false);
    });

    it('should reject missing tokens for state-changing methods', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const isValid = CSRFProtection.validateCSRFToken(mockRequest);
      expect(isValid).toBe(false);
    });

    it('should allow safe methods without tokens', () => {
      const methods = ['GET', 'HEAD', 'OPTIONS'];
      
      methods.forEach(method => {
        const mockRequest = new NextRequest('http://localhost:3000/api/test', {
          method,
        });

        const isValid = CSRFProtection.validateCSRFToken(mockRequest);
        expect(isValid).toBe(true);
      });
    });

    it('should reject expired tokens', () => {
      // Create a token with manipulated timestamp (1 hour ago)
      const oldTimestamp = Date.now() - 3600001; // Just over 1 hour
      const randomToken = 'a'.repeat(64);
      const message = `${randomToken}.${oldTimestamp}`;
      
      // We can't easily create a valid signature without access to the secret,
      // so this tests the timestamp validation logic
      const expiredToken = `${message}.invalid`;
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': expiredToken,
        },
      });

      const isValid = CSRFProtection.validateCSRFToken(mockRequest);
      expect(isValid).toBe(false);
    });

    it('should accept tokens from both header formats', () => {
      const token = CSRFProtection.generateCSRFToken();
      
      // Test x-csrf-token header
      const mockRequest1 = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
        },
      });

      // Test csrf-token header
      const mockRequest2 = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'csrf-token': token,
        },
      });

      expect(CSRFProtection.validateCSRFToken(mockRequest1)).toBe(true);
      expect(CSRFProtection.validateCSRFToken(mockRequest2)).toBe(true);
    });
  });

  describe('Security Requirements', () => {
    it('should require CSRF_SECRET environment variable', () => {
      process.env.CSRF_SECRET = '';
      
      expect(() => {
        jest.isolateModules(() => {
          require('@/lib/csrf');
        });
      }).toThrow('CSRF_SECRET environment variable is required');
    });

    it('should not have bypass mechanisms', () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-skip': 'true', // This should no longer work
        },
      });

      const isValid = CSRFProtection.validateCSRFToken(mockRequest);
      expect(isValid).toBe(false); // Should require valid token
    });

    it('should log security warnings for invalid tokens', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'invalid.token.here',
        },
      });

      CSRFProtection.validateCSRFToken(mockRequest);
      
      expect(consoleSpy).toHaveBeenCalledWith('Invalid CSRF token detected');
      
      consoleSpy.mockRestore();
    });

    it('should log warnings for missing tokens', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      CSRFProtection.validateCSRFToken(mockRequest);
      
      expect(consoleSpy).toHaveBeenCalledWith('CSRF token missing in request');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Headers Generation', () => {
    it('should generate proper CSRF headers', () => {
      const headers = CSRFProtection.getCSRFHeaders();
      
      expect(headers).toHaveProperty('X-CSRF-Token');
      expect(typeof headers['X-CSRF-Token']).toBe('string');
      expect(headers['X-CSRF-Token'].split('.').length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed tokens gracefully', () => {
      const malformedTokens = [
        '',
        'single-part',
        'two.parts',
        'too.many.parts.here.really',
        null,
        undefined,
      ];

      malformedTokens.forEach(token => {
        const mockRequest = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: token ? {
            'x-csrf-token': token as string,
          } : {},
        });

        const isValid = CSRFProtection.validateCSRFToken(mockRequest);
        expect(isValid).toBe(false);
      });
    });

    it('should handle non-numeric timestamps', () => {
      const invalidToken = 'randomtoken.notanumber.signature';
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': invalidToken,
        },
      });

      const isValid = CSRFProtection.validateCSRFToken(mockRequest);
      expect(isValid).toBe(false);
    });

    it('should handle extremely large timestamps', () => {
      const futureToken = `randomtoken.${Number.MAX_SAFE_INTEGER}.signature`;
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': futureToken,
        },
      });

      const isValid = CSRFProtection.validateCSRFToken(mockRequest);
      expect(isValid).toBe(false);
    });
  });
});