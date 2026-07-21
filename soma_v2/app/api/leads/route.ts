import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { applyRedisRateLimit } from '@/lib/rate-limit-redis'
import { z } from 'zod'

/**
 * POST /api/leads — Create or restore a lead (idempotent by fingerprint)
 * PATCH /api/leads — Progressively enrich a lead with form data
 *
 * Public endpoints — no Clerk auth required.
 * Rate-limited per IP (POST) and per token (PATCH).
 */

const createLeadSchema = z.object({
  fingerprint: z.string().max(32).optional(),
  device_info: z.record(z.any()).optional(),
  source: z.string().max(50).default('free_audit'),
  landing_page: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
})

const updateLeadSchema = z.object({
  brand_name: z.string().max(200).optional(),
  brand_website: z.string().max(500).optional(),
  email: z.string().email().max(320).optional(),
  form_data: z.record(z.any()).optional(),
  last_step: z.string().max(50).optional(),
  status: z.enum(['engaged', 'audit_started', 'audit_completed']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      const { response: rateLimited } = await applyRedisRateLimit(
        request, 'lead_create', { maxRequests: 10, windowSeconds: 60 }
      )
      if (rateLimited) return rateLimited
    }

    const body = await request.json()
    const parsed = createLeadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const data = parsed.data
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1'
    const userAgent = request.headers.get('user-agent')?.substring(0, 500) || null

    const supabase = createServiceClient()

    // Deduplicate by fingerprint — return existing lead if found
    if (data.fingerprint) {
      const { data: existing } = await supabase
        .from('leads')
        .select('lead_token')
        .eq('fingerprint', data.fingerprint)
        .gt('expires_at', new Date().toISOString())
        .neq('status', 'expired')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        await supabase.from('leads')
          .update({ ip_address: ip, user_agent: userAgent })
          .eq('lead_token', existing.lead_token)

        return NextResponse.json({ success: true, leadToken: existing.lead_token, restored: true })
      }
    }

    // Create new lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        ip_address: ip,
        user_agent: userAgent,
        fingerprint: data.fingerprint || null,
        device_info: data.device_info || {},
        source: data.source,
        landing_page: data.landing_page || null,
        referrer: data.referrer || null,
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_term: data.utm_term || null,
        utm_content: data.utm_content || null,
        status: 'new',
        last_step: 'brand-setup',
        steps_completed: ['brand-setup'],
      })
      .select('lead_token')
      .single()

    if (error || !lead) {
      console.error('[leads] Creation error:', error)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    console.log(`[leads] New lead created (fingerprint: ${data.fingerprint?.slice(0, 8) || 'none'})`)
    return NextResponse.json({ success: true, leadToken: lead.lead_token, restored: false })
  } catch (error) {
    console.error('[leads] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const leadToken = request.headers.get('x-lead-token')
    if (!leadToken || leadToken.length > 128) {
      return NextResponse.json({ error: 'Missing or invalid lead token' }, { status: 401 })
    }

    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      const { response: rateLimited } = await applyRedisRateLimit(
        request, `lead_update:${leadToken.slice(0, 16)}`, { maxRequests: 30, windowSeconds: 60 }
      )
      if (rateLimited) return rateLimited
    }

    const body = await request.json()
    const parsed = updateLeadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const data = parsed.data
    const supabase = createServiceClient()

    // Read current state for merge operations
    const { data: current } = await supabase
      .from('leads')
      .select('form_data, steps_completed')
      .eq('lead_token', leadToken)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Lead not found or expired' }, { status: 404 })
    }

    // Build update — only set provided fields
    const updates: Record<string, any> = {}
    if (data.brand_name !== undefined) updates.brand_name = data.brand_name
    if (data.brand_website !== undefined) updates.brand_website = data.brand_website
    if (data.email !== undefined) updates.email = data.email
    if (data.last_step) updates.last_step = data.last_step
    if (data.status) updates.status = data.status

    // Merge form_data (shallow merge — preserves previous step data)
    if (data.form_data && Object.keys(data.form_data).length > 0) {
      updates.form_data = { ...(current.form_data || {}), ...data.form_data }
    }

    // Append to steps_completed (dedup)
    if (data.last_step) {
      const steps = (current.steps_completed || []) as string[]
      if (!steps.includes(data.last_step)) {
        updates.steps_completed = [...steps, data.last_step]
      }
    }

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('lead_token', leadToken)

    if (error) {
      console.error('[leads] Update error:', error)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[leads] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
