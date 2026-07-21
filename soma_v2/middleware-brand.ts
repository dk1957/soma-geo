import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply middleware to dashboard routes
  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  
  // Get brand context from URL params or headers
  const brandId = request.nextUrl.searchParams.get('brand')
  const workspaceId = request.nextUrl.searchParams.get('workspace')
  
  // If brand context is provided in URL, persist it in secure cookies
  if (brandId) {
    response.cookies.set('selected-brand-id', brandId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
  }
  
  if (workspaceId) {
    response.cookies.set('selected-workspace-id', workspaceId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all dashboard routes except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/dashboard/:path*'
  ]
}