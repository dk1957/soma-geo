import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getNoCacheHeaders } from '@/lib/utils/cache-cleanup'

/**
 * Middleware to prevent caching on sensitive pages
 * This helps prevent cross-user data leakage through browser cache
 */
export function noCacheMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add no-cache headers to prevent browser caching
  const noCacheHeaders = getNoCacheHeaders()
  Object.entries(noCacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add additional security headers for sensitive pages
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'no-referrer')
  
  return response
}

/**
 * Check if a path should have no-cache headers
 */
export function shouldPreventCaching(pathname: string): boolean {
  const sensitiveRoutes = [
    '/dashboard',
    '/api/accounts',
    '/api/analytics',
    '/auth',
    '/signin',
    '/signup',
    '/onboarding',
    '/reports'
  ]
  
  return sensitiveRoutes.some(route => pathname.startsWith(route))
}