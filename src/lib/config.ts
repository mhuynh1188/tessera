// Application configuration

export const config = {
  // App metadata
  app: {
    name: 'Tessera',
    description: 'Enterprise behavioral intelligence through pattern tessellation',
    version: '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Database configuration (Supabase)
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Authentication configuration
  auth: {
    jwt: {
      secret: (() => {
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
          if (process.env.NODE_ENV === 'production') {
            console.warn('⚠️  NEXTAUTH_SECRET is missing in production. Using fallback secret.');
            return 'production-fallback-secret-V+O4G8BcqUTed/2gLowHpsCG5aY6FDn5c4EY1wIuMkLTmWc0TyOKRsILVducFyE7dFoezvsS6Lf89zgmVd5j4A==';
          }
          console.warn('⚠️  Using development secret. Set NEXTAUTH_SECRET for production!');
          return 'development-secret-key-please-change-in-production';
        }
        if (secret.length < 32) {
          console.warn('NEXTAUTH_SECRET is too short, using fallback');
          return 'production-fallback-secret-V+O4G8BcqUTed/2gLowHpsCG5aY6FDn5c4EY1wIuMkLTmWc0TyOKRsILVducFyE7dFoezvsS6Lf89zgmVd5j4A==';
        }
        return secret;
      })(),
      expiresIn: '7d',
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
    },
    session: {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      updateAge: 24 * 60 * 60, // 24 hours
    },
    twoFactor: {
      issuer: 'Tessera',
      serviceName: 'Tessera Workspace',
    },
  },

  // Rate limiting - Strengthened security
  rateLimit: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // Reduced from 100 to 50 requests per window
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 3, // Reduced from 5 to 3 auth attempts per window
      progressiveDelay: true, // Add progressive delays
    },
    contact: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit each IP to 3 contact form submissions per hour
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // Limit registrations per IP per hour
    },
  },

  // File upload limits
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
    maxFiles: 10,
  },

  // Workspace limits by subscription tier
  limits: {
    free: {
      workspaces: 1,
      tesserasPerWorkspace: 10,
      collaborators: 2,
      storage: 100 * 1024 * 1024, // 100MB
    },
    basic: {
      workspaces: 5,
      tesserasPerWorkspace: 50,
      collaborators: 10,
      storage: 1024 * 1024 * 1024, // 1GB
    },
    premium: {
      workspaces: -1, // unlimited
      tesserasPerWorkspace: -1, // unlimited
      collaborators: -1, // unlimited
      storage: 10 * 1024 * 1024 * 1024, // 10GB
    },
  },

  // Email configuration
  email: {
    from: process.env.EMAIL_FROM || 'noreply@tessera.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },

  // Analytics and monitoring
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    trackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
  },

  // Security headers
  security: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.googletagmanager.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.github.com', 'https://*.supabase.co', 'https://*.liveblocks.io', 'wss://*.liveblocks.io'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
  },

  // Feature flags
  features: {
    realTimeCollaboration: process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false', // Easy disable via env
    liveblocks: process.env.NEXT_PUBLIC_ENABLE_LIVEBLOCKS !== 'false', // Easy disable Liveblocks specifically  
    workplaceAnalytics: false, // Future feature
    aiSuggestions: false, // Future feature
    exportToPdf: true,
    darkMode: true,
    mobileApp: false, // Future feature
  },

  // External services
  services: {
    liveblocks: {
      publicKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
      secretKey: process.env.LIVEBLOCKS_SECRET_KEY,
    },
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    sentry: {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
    },
  },
} as const;

// Type-safe config access
export type Config = typeof config;

// Validation helpers
export const validateConfig = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXTAUTH_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
};

// Development helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';