import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config as appConfig } from './lib/config'
import { isValidIP } from './lib/validation'

// Security headers configuration
const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.github.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(appConfig.isProduction ? ["upgrade-insecure-requests"] : [])
  ].join('; '),
  
  // HSTS (only in production)
  ...(appConfig.isProduction && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  })
}

// Suspicious patterns to block
const SUSPICIOUS_PATTERNS = [
  // SQL injection attempts
  /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b|\bUPDATE\b).*(\bFROM\b|\bWHERE\b)/i,
  
  // XSS attempts
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/i,
  /on\w+\s*=/i,
  
  // Path traversal
  /\.\.\//,
  /\.\.\\/, 
  
  // Common attack vectors
  /wp-admin/i,
  /phpmyadmin/i,
  /\.php$/i,
  /\.asp$/i,
  /\.jsp$/i,
  
  // Shell injection
  /\b(bash|sh|cmd|powershell|exec|system)\b/i,
  
  // File inclusion
  /\b(include|require|eval)\s*\(/i,
]

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

// Rate limiting function
const checkRateLimit = (
  ip: string, 
  endpoint: string, 
  limit: number, 
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } => {
  const key = `${ip}:${endpoint}`
  const now = Date.now()
  const resetTime = now + windowMs
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }
  
  if (current.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }
  
  // Increment counter
  current.count++
  rateLimitStore.set(key, current)
  
  return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime }
}

// Get client IP address
const getClientIP = (request: NextRequest): string => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const connectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    for (const ip of ips) {
      if (isValidIP(ip) && !ip.startsWith('10.') && !ip.startsWith('192.168.') && !ip.startsWith('172.')) {
        return ip
      }
    }
  }
  
  if (realIP && isValidIP(realIP)) return realIP
  if (connectingIP && isValidIP(connectingIP)) return connectingIP
  
  return request.ip || '127.0.0.1'
}

// Check for suspicious requests
const isSuspiciousRequest = (request: NextRequest): string | null => {
  const url = request.url.toLowerCase()
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  
  // Check URL patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url) || pattern.test(userAgent) || pattern.test(referer)) {
      return `Suspicious pattern detected: ${pattern.source}`
    }
  }
  
  // Check for suspicious user agents
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /nessus/i,
    /openvas/i,
    /w3af/i,
    /acunetix/i,
    /appscan/i,
    /burp/i,
  ]
  
  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      return `Suspicious user agent: ${userAgent}`
    }
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-originating-ip', 'x-forwarded-host', 'x-remote-ip']
  for (const header of suspiciousHeaders) {
    if (request.headers.has(header)) {
      return `Suspicious header: ${header}`
    }
  }
  
  return null
}

// Determine rate limit based on endpoint
const getRateLimitForEndpoint = (pathname: string): { limit: number; windowMs: number } => {
  if (pathname.startsWith('/api/auth/')) {
    return appConfig.rateLimit.auth
  }
  
  if (pathname.startsWith('/api/contact')) {
    return appConfig.rateLimit.contact
  }
  
  if (pathname.startsWith('/api/')) {
    return appConfig.rateLimit.api
  }
  
  // Default rate limit for pages
  return { limit: 100, windowMs: 15 * 60 * 1000 }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname
  const ip = getClientIP(request)
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Check for suspicious requests (disabled in development)
  if (appConfig.isProduction) {
    const suspiciousReason = isSuspiciousRequest(request)
    if (suspiciousReason) {
      console.warn(`Blocked suspicious request from ${ip}: ${suspiciousReason}`)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  
  // Apply rate limiting (relaxed in development)
  if (appConfig.isProduction) {
    const { limit, windowMs } = getRateLimitForEndpoint(pathname)
    const { allowed, remaining, resetTime } = checkRateLimit(ip, pathname, limit, windowMs)
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())
    
    if (!allowed) {
      console.warn(`Rate limit exceeded for ${ip} on ${pathname}`)
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
          ...Object.fromEntries(response.headers.entries())
        }
      })
    }
  }
  
  // Enhanced auth protection for sensitive routes
  if (pathname.startsWith('/workspace') || pathname.startsWith('/api/workspace')) {
    const supabase = createClient(
      appConfig.database.url,
      appConfig.database.anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('supabase-auth-token')?.value
    
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse('Unauthorized', { status: 401 })
      }
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        if (pathname.startsWith('/api/')) {
          return new NextResponse('Unauthorized', { status: 401 })
        }
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      
      // Add user info to request headers for API routes
      if (pathname.startsWith('/api/')) {
        response.headers.set('X-User-ID', user.id)
        response.headers.set('X-User-Email', user.email || '')
      }
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      if (pathname.startsWith('/api/')) {
        return new NextResponse('Internal Server Error', { status: 500 })
      }
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  
  // CORS handling for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = appConfig.isProduction 
      ? [appConfig.app.url] 
      : ['http://localhost:3000', 'http://127.0.0.1:3000']
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }
  }
  
  // Add request ID for tracking
  response.headers.set('X-Request-ID', crypto.randomUUID())
  
  // Log request (in production, send to monitoring service)
  if (appConfig.isDevelopment) {
    console.log(`${request.method} ${pathname} - ${ip} - ${request.headers.get('user-agent')}`)
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}