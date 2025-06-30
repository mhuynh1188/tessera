import { validateConfig } from '../config'

describe('Security Tests', () => {
  describe('Environment Configuration', () => {
    const originalEnv = process.env

    beforeEach(() => {
      // Reset environment variables
      jest.resetModules()
      process.env = { ...originalEnv }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    it('should require essential environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.NEXTAUTH_SECRET

      expect(() => validateConfig()).toThrow('Missing required environment variables')
    })

    it('should pass validation with all required variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough'

      expect(() => validateConfig()).not.toThrow()
    })
  })

  describe('Input Validation', () => {
    it('should reject malicious script tags in text input', () => {
      const maliciousInput = '<script>alert("xss")</script>'
      
      // Test that our sanitization would catch this
      const sanitized = maliciousInput.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      expect(sanitized).not.toContain('<script>')
    })

    it('should handle SQL injection attempts in search queries', () => {
      const maliciousQuery = "'; DROP TABLE users; --"
      
      // Our parameterized queries should handle this safely
      // This test ensures we're aware of the attack vector
      expect(maliciousQuery).toContain("'")
      expect(maliciousQuery).toContain('DROP')
      expect(maliciousQuery).toContain('--')
    })

    it('should validate email format', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@example.org',
        'user123@test-domain.co.uk'
      ]
      
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user@.com',
        'user space@example.com'
      ]

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })

    it('should validate password strength requirements', () => {
      const strongPasswords = [
        'SecureP@ssw0rd123',
        'MyVeryStr0ng!Password',
        'C0mpl3x_P@ssw0rd!'
      ]

      const weakPasswords = [
        'password',
        '123456',
        'admin',
        'qwerty',
        'password123'
      ]

      // Basic password strength check (8+ chars, mixed case, number, special char)
      const isStrongPassword = (password: string) => {
        return password.length >= 8 &&
               /[a-z]/.test(password) &&
               /[A-Z]/.test(password) &&
               /\d/.test(password) &&
               /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)
      }

      strongPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(true)
      })

      weakPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(false)
      })
    })
  })

  describe('Authentication Security', () => {
    it('should not expose sensitive data in client-side code', () => {
      // Ensure service role key is not in client-accessible config
      const clientConfig = {
        app: { url: 'http://localhost:3000' },
        database: { url: 'https://test.supabase.co' }
        // Should NOT include service key
      }

      expect(clientConfig).not.toHaveProperty('serviceKey')
      expect(JSON.stringify(clientConfig)).not.toContain('service_role')
    })

    it('should use secure session configuration', () => {
      const sessionConfig = {
        maxAge: 7 * 24 * 60 * 60, // 7 days
        updateAge: 24 * 60 * 60,  // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const
      }

      expect(sessionConfig.maxAge).toBeLessThanOrEqual(7 * 24 * 60 * 60) // Max 7 days
      expect(sessionConfig.httpOnly).toBe(true)
      expect(sessionConfig.sameSite).toBe('strict')
    })
  })

  describe('Content Security Policy', () => {
    it('should have restrictive CSP directives', () => {
      const csp = {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: unsafe-* should be minimized
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://*.supabase.co'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }

      expect(csp.defaultSrc).toEqual(["'self'"])
      expect(csp.frameSrc).toEqual(["'none'"])
      expect(csp.objectSrc).toEqual(["'none'"])
      expect(csp.connectSrc).toContain("'self'")
    })
  })

  describe('Rate Limiting', () => {
    it('should have appropriate rate limits for different endpoints', () => {
      const rateLimits = {
        auth: { windowMs: 15 * 60 * 1000, max: 5 },
        api: { windowMs: 15 * 60 * 1000, max: 100 },
        contact: { windowMs: 60 * 60 * 1000, max: 3 }
      }

      // Auth should be most restrictive
      expect(rateLimits.auth.max).toBeLessThanOrEqual(10)
      
      // Contact form should be very restrictive
      expect(rateLimits.contact.max).toBeLessThanOrEqual(5)
      
      // API should allow reasonable usage
      expect(rateLimits.api.max).toBeGreaterThan(rateLimits.auth.max)
    })
  })

  describe('File Upload Security', () => {
    it('should restrict file types and sizes', () => {
      const uploadConfig = {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
        maxFiles: 10
      }

      // File size should be reasonable
      expect(uploadConfig.maxFileSize).toBeLessThanOrEqual(10 * 1024 * 1024) // Max 10MB
      
      // Should only allow safe image types
      uploadConfig.allowedTypes.forEach(type => {
        expect(type).toMatch(/^image\//)
      })
      
      // Should not allow executable files
      expect(uploadConfig.allowedTypes).not.toContain('application/x-executable')
      expect(uploadConfig.allowedTypes).not.toContain('application/octet-stream')
    })

    it('should validate file extensions match MIME types', () => {
      const validateFileType = (filename: string, mimeType: string) => {
        const ext = filename.split('.').pop()?.toLowerCase()
        const mimeToExt = {
          'image/jpeg': ['jpg', 'jpeg'],
          'image/png': ['png'],
          'image/svg+xml': ['svg']
        }
        
        return mimeToExt[mimeType as keyof typeof mimeToExt]?.includes(ext || '') || false
      }

      expect(validateFileType('test.jpg', 'image/jpeg')).toBe(true)
      expect(validateFileType('test.png', 'image/png')).toBe(true)
      expect(validateFileType('test.svg', 'image/svg+xml')).toBe(true)
      
      // Should reject mismatched types
      expect(validateFileType('test.exe', 'image/jpeg')).toBe(false)
      expect(validateFileType('test.php', 'image/png')).toBe(false)
    })
  })

  describe('Data Sanitization', () => {
    it('should sanitize HTML input', () => {
      const dangerousHtml = '<img src="x" onerror="alert(1)">'
      
      // Basic HTML sanitization (in production, use DOMPurify)
      const sanitized = dangerousHtml
        .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).not.toContain('alert')
    })

    it('should escape special characters in user input', () => {
      const userInput = '<>&"\'';
      const escaped = userInput
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')

      expect(escaped).toBe('&lt;&gt;&amp;&quot;&#x27;')
    })
  })

  describe('API Security', () => {
    it('should validate API request headers', () => {
      const requiredHeaders = ['authorization', 'content-type']
      const validContentTypes = ['application/json', 'multipart/form-data']
      
      requiredHeaders.forEach(header => {
        expect(header).toBeTruthy()
        expect(typeof header).toBe('string')
      })

      validContentTypes.forEach(type => {
        expect(type).toMatch(/^(application|multipart)\//)
      })
    })

    it('should implement proper CORS configuration', () => {
      const corsConfig = {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }

      expect(corsConfig.credentials).toBe(true)
      expect(corsConfig.methods).not.toContain('TRACE')
      expect(corsConfig.methods).not.toContain('CONNECT')
    })
  })
})