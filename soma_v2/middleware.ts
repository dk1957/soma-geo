// Clerk-based middleware with AI crawler detection
// This middleware handles auth via Clerk and optimizes content for AI crawlers

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { detectAICrawler, logAICrawlerVisit } from '@/lib/ai-crawler/detection'
import { shouldPreventCaching, noCacheMiddleware } from '@/lib/middleware/no-cache'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rate-limit'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/signin(.*)',
  '/signup(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
  '/reset-password(.*)',
  '/about(.*)',
  '/pricing(.*)',
  '/blog(.*)',
  '/contact(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/faq(.*)',
  '/help(.*)',
  '/resources(.*)',
  '/case-studies(.*)',
  '/solutions(.*)',
  '/competitive(.*)',
  '/reports/(.*)', // Public external reports
  '/presentation(.*)',
  '/invite/(.*)', // Invitation links
  '/welcome(.*)',
  '/api/webhooks(.*)', // Webhook endpoints
  '/api/external(.*)', // External API endpoints
  '/api/reports(.*)', // Public report API endpoints (share tokens handled in route handlers)
  '/api/admin/health(.*)',,
  '/api/admin/cron(.*)',,
  '/free-audit(.*)', // Free audit landing + report pages
  '/api/onboarding/free-audit(.*)', // Free audit API endpoints
  '/api/content/prompts/generate', // Prompt generation (free-audit mode handled in route)
  '/api/leads', // Lead tracking for pre-auth users
  // Country pages
  '/germany(.*)',
  '/ghana(.*)',
  '/kenya(.*)',
  '/nigeria(.*)',
  '/saudi-arabia(.*)',
  '/south-africa(.*)',
  '/uae(.*)',
  '/united-kingdom(.*)',
  '/united-states(.*)',
  // Static files
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/site.webmanifest',
])

// Define routes that should redirect to the dashboard if the user is logged in
const publicOnlyRoutes = ['/signin', '/signup', '/sign-in', '/sign-up']

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const { pathname } = request.nextUrl

  // Handle static files early
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Global rate limiting for API routes (DDoS protection)
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'
    const result = checkRateLimit(`global:api:${ip}`, { maxRequests: 120, windowSeconds: 60 })

    if (!result.allowed) {
      const headers = new Headers({ 'Content-Type': 'application/json' })
      addRateLimitHeaders(headers, result)
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: `Global rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        }),
        { status: 429, headers }
      )
    }
  }

  if (userId) {
    // --- USER IS AUTHENTICATED ---
    let hasCompletedOnboarding = false
    
    try {
      const supabase = createServiceClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_status')
        .eq('clerk_id', userId)
        .maybeSingle()

      // Profile exists and onboarding is completed
      if (!error && profile?.onboarding_status === 'completed') {
        hasCompletedOnboarding = true
      }
    } catch (error) {
      // If profile lookup fails, treat as not onboarded
      // Profile lookup failed - treat as not onboarded
    }

    // 1. If user is on a public-only route (e.g., /signin), redirect them
    if (publicOnlyRoutes.some((route) => pathname.startsWith(route))) {
      const redirectUrl = hasCompletedOnboarding ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // 2. If onboarding is complete but user is on onboarding page, redirect to dashboard
    if (hasCompletedOnboarding && pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 3. If onboarding is not complete, redirect to onboarding from any other protected page
    // But allow access to the dashboard if profile doesn't exist yet (new user flow)
    const isOnboardingPage = pathname.startsWith('/onboarding')
    const isApiRoute = pathname.startsWith('/api/')
    const isDashboard = pathname.startsWith('/dashboard')
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
    
    // Admin routes: Ensure no caching and add security headers.
    // Actual email-based access check happens in admin layout.tsx & requireAdmin() guard.
    if (isAdminRoute) {
      const res = NextResponse.next({ request: { headers: request.headers } })
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.headers.set('Pragma', 'no-cache')
      res.headers.set('X-Content-Type-Options', 'nosniff')
      res.headers.set('X-Frame-Options', 'DENY')
      res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      return res
    }

    // Only redirect to onboarding if NOT already on onboarding, NOT an API route,
    // NOT admin (admin handles its own auth), and trying to access protected routes other than dashboard
    if (!hasCompletedOnboarding && !isPublicRoute(request) && !isOnboardingPage && !isApiRoute && !isDashboard) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  } else {
    // --- USER IS NOT AUTHENTICATED ---
    // Protect routes that are not public
    if (!isPublicRoute(request)) {
      // For API routes, return 401 instead of redirecting
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 },
        )
      }

      // For page routes, redirect to signin and preserve the intended URL
      const signInUrl = new URL('/signin', request.url)
      signInUrl.searchParams.set('redirect_url', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  // --- COMMON LOGIC for all requests that pass through ---

  // Create base response to add headers to
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Apply no-cache headers for sensitive routes
  if (shouldPreventCaching(pathname)) {
    response = noCacheMiddleware(request)
  }

  // Detect AI crawlers for all routes
  const crawlerDetection = detectAICrawler(request)

  if (crawlerDetection.detected) {
    console.log('🤖 AI Crawler detected:', {
      crawler: crawlerDetection.crawler,
      provider: crawlerDetection.provider,
      path: pathname,
    })

    logAICrawlerVisit(crawlerDetection, pathname)

    // Add headers for AI crawler identification
    response.headers.set('X-AI-Crawler-Detected', crawlerDetection.crawler || 'unknown')
    response.headers.set('X-AI-Provider', crawlerDetection.provider || 'unknown')
    response.headers.set('X-Content-Optimized', 'true')
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    response.headers.set('X-Crawler-Friendly', 'true')
    response.headers.set('X-Structured-Data', 'available')
    response.headers.set('X-Content-Type', 'ai-optimized')
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}