import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rate-limit'

/**
 * GET /api/free-audit/lookup?fingerprint=<hash>
 * Find the most recent completed report for a browser fingerprint.
 * Returns a minimal payload (access_token + brand_name) — NOT the full report.
 * The client then uses the existing /api/free-audit/[token] route to load it.
 */
export async function GET(request: NextRequest) {
  const headers = new Headers()

  try {
    const fingerprint = request.nextUrl.searchParams.get('fingerprint')

    if (!fingerprint || !/^[a-f0-9]{6,16}$/.test(fingerprint)) {
      return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 })
    }

    // Rate limit per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1'

    const rl = checkRateLimit(`audit_lookup:${ip}`, { maxRequests: 10, windowSeconds: 60 })
    addRateLimitHeaders(headers, rl)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
    }

    const supabase = createServiceClient()

    const { data: audit, error } = await supabase
      .from('free_audit_reports')
      .select('access_token, brand_name, status, created_at, expires_at')
      .eq('fingerprint', fingerprint)
      .eq('is_active', true)
      .in('status', ['completed', 'running', 'pending'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !audit) {
      return NextResponse.json({ found: false }, { headers })
    }

    return NextResponse.json({
      found: true,
      accessToken: audit.access_token,
      brandName: audit.brand_name,
      status: audit.status,
      createdAt: audit.created_at,
    }, { headers })

  } catch (error) {
    console.error('Audit lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
