/**
 * Tessera Brand System
 * Enterprise Behavioral Intelligence Through Pattern Tessellation
 */

export const tessera = {
  name: 'Tessera',
  tagline: 'Enterprise Behavioral Intelligence Through Pattern Tessellation',
  description: 'Revolutionary platform that transforms workplace behavior patterns into actionable organizational insights through advanced tessellation analysis.',
  
  // Core Brand Values
  values: {
    precision: 'Mathematical precision in behavioral analysis',
    insight: 'Deep organizational intelligence',
    transformation: 'Catalyzing positive workplace change',
    enterprise: 'Built for scale and sophistication'
  },

  // Color Palette
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main brand blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    
    // Secondary Purple
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff', 
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7', // Main brand purple
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764'
    },
    
    // Accent Cyan
    accent: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4', // Main accent cyan
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344'
    },
    
    // Neutral Grays
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },
    
    // Status Colors
    success: '#10b981',
    warning: '#f59e0b', 
    error: '#ef4444',
    info: '#3b82f6'
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'monospace'],
      display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif']
    },
    
    fontSize: {
      hero: '4.5rem', // 72px
      display: '3.75rem', // 60px  
      h1: '3rem', // 48px
      h2: '2.25rem', // 36px
      h3: '1.875rem', // 30px
      h4: '1.5rem', // 24px
      h5: '1.25rem', // 20px
      h6: '1.125rem', // 18px
      body: '1rem', // 16px
      small: '0.875rem', // 14px
      xs: '0.75rem' // 12px
    }
  },

  // Logo & Icon System
  logo: {
    // Tessera Icon - Mathematical tessellation pattern
    icon: {
      concept: 'Interlocking squares creating mosaic patterns',
      symbolism: 'Individual patterns forming greater insights',
      usage: 'App icons, favicons, small spaces'
    },
    
    // Full Logo
    wordmark: {
      concept: 'Tessera logotype with icon',
      symbolism: 'Professional, enterprise-ready',
      usage: 'Headers, marketing, documentation'
    },

    // Spacing & Sizing
    clearSpace: '0.5x logo height on all sides',
    minSize: {
      digital: '24px height',
      print: '0.5 inch height'
    }
  },

  // Brand Voice & Messaging
  voice: {
    tone: 'Professional, Intelligent, Transformative',
    personality: [
      'Sophisticated yet approachable',
      'Data-driven and analytical', 
      'Empowering and actionable',
      'Enterprise-focused'
    ],
    
    messaging: {
      primary: 'Transform workplace behavior into organizational intelligence',
      secondary: 'Every pattern tells a story. Every insight drives change.',
      cta: 'Discover your organization\'s behavioral intelligence'
    }
  },

  // Visual Elements
  patterns: {
    tessellation: {
      concept: 'Repeating geometric patterns that create larger compositions',
      usage: 'Backgrounds, dividers, decorative elements',
      meaning: 'Individual behaviors forming organizational patterns'
    },
    
    gradients: {
      primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
      secondary: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      accent: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
    }
  },

  // Animation & Motion
  motion: {
    timing: {
      fast: '150ms',
      normal: '300ms', 
      slow: '500ms'
    },
    
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)'
    }
  },

  // Marketing & Product Positioning
  positioning: {
    category: 'Enterprise Behavioral Analytics Platform',
    target: 'HR Leaders, Organizational Development, Executive Teams',
    
    differentiators: [
      'Privacy-preserving behavioral analysis',
      'Real-time organizational intelligence', 
      'Scientifically-backed intervention recommendations',
      'Enterprise-grade security and compliance'
    ],
    
    benefits: [
      'Reduce toxic behaviors by up to 40%',
      'Increase psychological safety scores',
      'Accelerate positive culture change',
      'Data-driven people decisions'
    ]
  }
};

// Export individual elements for easier imports
export const {
  colors,
  typography,
  logo,
  voice,
  patterns,
  motion,
  positioning
} = tessera;

export default tessera;