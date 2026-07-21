import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rate-limit'

/**
 * GET /api/free-audit/[token]
 * Retrieve a free audit report by its access token.
 * Public endpoint with rate limiting.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const headers = new Headers()
  
  try {
    const { token } = await params

    // Validate token format (hex string, 64 chars)
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Rate limit per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || '127.0.0.1'
    
    const rl = checkRateLimit(`free_audit_read:${ip}`, { maxRequests: 30, windowSeconds: 60 })
    addRateLimitHeaders(headers, rl)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers }
      )
    }

    const supabase = createServiceClient()

    const { data: audit, error } = await supabase
      .from('free_audit_reports')
      .select('id, brand_name, website_url, status, audit_results, created_at, claimed_at, provisional_brand_id')
      .eq('access_token', token)
      .eq('is_active', true)
      .single()

    if (error || !audit) {
      return NextResponse.json({ error: 'Report not found or expired' }, { status: 404, headers })
    }

    return NextResponse.json({
      success: true,
      report: {
        id: audit.id,
        brandName: audit.brand_name,
        brandWebsite: audit.website_url,
        industry: audit.audit_results?.brand_industry || null,
        status: audit.status,
        results: audit.audit_results,
        createdAt: audit.created_at,
        isClaimed: !!audit.claimed_at,
        brandId: audit.provisional_brand_id || null,
      },
    }, { headers })

  } catch (error) {
    console.error('Free audit retrieval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
