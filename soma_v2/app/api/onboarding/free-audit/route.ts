import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { applyRedisRateLimit } from '@/lib/rate-limit-redis'
import { z } from 'zod'
import crypto from 'crypto'

/**
 * POST /api/free-audit
 * Creates a new free audit report and starts the audit process.
 * No auth required - this is a public lead-generation endpoint.
 * 
 * Security:
 * - IP + fingerprint rate limiting (3/day)
 * - Input validation via Zod
 * - Honeypot field detection
 * - Request timing check (anti-bot)
 */

const createAuditSchema = z.object({
  brandName: z.string().min(1).max(200).trim(),
  companyName: z.string().max(200).optional().or(z.literal('')),
  brandWebsite: z.string().max(500).optional().or(z.literal('')),
  brandDescription: z.string().max(2000).optional(),
  industry: z.string().max(100).optional(),
  brandCategories: z.array(z.string().max(100)).max(10).optional(),
  targetMarkets: z.array(z.string().max(100)).max(10).optional(),
  competitors: z.array(z.string().max(200)).max(10).optional(),
  keywords: z.array(z.string().max(100)).max(20).optional(),
  email: z.string().email().max(320).optional().or(z.literal('')),
  // User-reviewed prompts from the generate-prompts step
  prompts: z.array(z.object({
    id: z.string(),
    text: z.string().max(500),
    category: z.string().optional(),
    priority: z.number().optional(),
    rationale: z.string().optional(),
    confidence: z.number().optional(),
  }).passthrough()).max(12).optional(),
  // Anti-bot fields
  _hp: z.string().max(0).optional(), // honeypot - must be empty
  _ts: z.number().optional(),        // timestamp - form must take >2s to fill
  fingerprint: z.string().max(128).optional(),
  leadToken: z.string().max(128).optional(),
})

export async function POST(request: NextRequest) {
  const headers = new Headers()
  
  try {
    // 1. Redis rate limit (20 requests per minute per IP, skip in dev)
    const isDev = process.env.NODE_ENV === 'development'
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1'
    if (!isDev) {
      const { response: rateLimited, headers: rlHeaders } = await applyRedisRateLimit(
        request, 'free_audit', { maxRequests: 20, windowSeconds: 60 }
      )
      rlHeaders.forEach((v, k) => headers.set(k, v))
      if (rateLimited) return rateLimited
    }

    // 2. Parse and validate input
    const body = await request.json()
    const parsed = createAuditSchema.safeParse(body)
    
    if (!parsed.success) {
      console.error('Free audit validation errors:', JSON.stringify(parsed.error.flatten().fieldErrors))
      console.error('Free audit body keys:', Object.keys(body))
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers }
      )
    }

    const data = parsed.data

    // 3. Anti-bot checks
    // Honeypot: if filled, it's a bot
    if (data._hp) {
      // Silent success to not reveal detection
      return NextResponse.json({
        success: true,
        auditId: crypto.randomUUID(),
        accessToken: crypto.randomBytes(32).toString('hex'),
      }, { headers })
    }

    // Timing: form submission too fast = bot
    if (data._ts && (Date.now() - data._ts) < 2000) {
      return NextResponse.json({
        success: true,
        auditId: crypto.randomUUID(),
        accessToken: crypto.randomBytes(32).toString('hex'),
      }, { headers })
    }

    // 4. Database rate limit (3 per day per IP/fingerprint, skip in dev)
    const supabase = createServiceClient()
    
    if (!isDev) {
      const { data: allowed, error: rlError } = await supabase.rpc('check_free_audit_rate_limit', {
        p_ip_address: ip,
        p_fingerprint: data.fingerprint || null,
        p_max_per_day: 3,
      })

      // Fail-open: only block if we got a definitive `false` — errors should not block users
      if (rlError) {
        console.error('Rate limit check error (allowing through):', rlError)
      } else if (allowed === false) {
        return NextResponse.json(
          { error: 'Daily audit limit reached. Sign up for unlimited audits.', upgrade: true },
          { status: 429, headers }
        )
      }
    }

    // 5. Sanitize website URL
    let website = data.brandWebsite || ''
    if (website && !website.startsWith('http')) {
      website = `https://${website}`
    }

    // 6. Create audit record
    const accessTokenValue = crypto.randomBytes(32).toString('hex') // 64 hex chars
    const { data: audit, error: insertError } = await supabase
      .from('free_audit_reports')
      .insert({
        brand_name: data.brandName,
        website_url: website || null,
        competitors: data.competitors || [],
        email: data.email || null,
        ip_address: ip,
        fingerprint: data.fingerprint || null,
        access_token: accessTokenValue,
        status: 'pending',
        // Store brand metadata as table columns (also duplicated in audit_results for backward compat)
        brand_industry: data.industry || null,
        brand_categories: data.brandCategories || data.keywords || [],
        keywords: data.keywords || [],
        target_markets: data.targetMarkets || [],
        company_name: data.companyName || data.brandName,
        // Store extra context in audit_results JSON
        audit_results: {
          ...(data.prompts?.length ? { user_prompts: data.prompts.map(p => p.text) } : {}),
          company_name: data.companyName || null,
          brand_industry: data.industry || null,
          brand_description: data.brandDescription || null,
          brand_categories: data.brandCategories || data.keywords || [],
          target_markets: data.targetMarkets || [],
          keywords: data.keywords || [],
          ip_address: ip,
          user_agent: request.headers.get('user-agent')?.substring(0, 500) || null,
          fingerprint: data.fingerprint || null,
        },
      })
      .select('id, access_token')
      .single()

    if (insertError) {
      console.error('Free audit insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create audit. Please try again.' },
        { status: 500, headers }
      )
    }

    // 7. Link lead to audit (non-blocking)
    if (data.leadToken) {
      supabase
        .from('leads')
        .select('id')
        .eq('lead_token', data.leadToken)
        .single()
        .then(({ data: lead }) => {
          if (lead?.id) {
            // Link both directions
            supabase.from('free_audit_reports').update({ lead_id: lead.id }).eq('id', audit.id).then(() => {})
            supabase.from('leads').update({ status: 'audit_started', last_step: 'processing' }).eq('id', lead.id).then(() => {})
          }
        })
        .catch(() => {}) // Non-blocking
    }

    // 8. Kick off audit execution asynchronously
    // Use NEXT_PUBLIC_APP_URL (production) for internal calls to avoid
    // Vercel Deployment Protection gating on preview deployments.
    // VERCEL_PROJECT_PRODUCTION_URL always points to production, even on previews.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'
    
    console.log(`🚀 Triggering audit execution for ${audit.id} via ${appUrl}`)
    fetch(`${appUrl}/api/onboarding/free-audit/execute`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({ auditId: audit.id }),
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error(`❌ Audit execution trigger failed: HTTP ${res.status} - ${text}`)
      } else {
        console.log(`✅ Audit execution triggered successfully for ${audit.id}`)
      }
    }).catch(err => console.error('❌ Failed to trigger audit execution:', err))

    return NextResponse.json({
      success: true,
      auditId: audit.id,
      accessToken: audit.access_token,
    }, { headers })

  } catch (error) {
    console.error('Free audit creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
