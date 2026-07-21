import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const source = url.searchParams.get('source')
    const days = parseInt(url.searchParams.get('days') || '30', 10)

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Fetch leads
    let query = supabase
      .from('leads')
      .select('id, lead_token, email, brand_name, brand_website, source, status, last_step, steps_completed, ip_address, fingerprint, utm_source, utm_medium, utm_campaign, account_id, clerk_id, converted_at, created_at, updated_at, last_activity_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500)

    if (status && status !== 'all') query = query.eq('status', status)
    if (source && source !== 'all') query = query.eq('source', source)

    const { data: leads, error } = await query

    if (error) {
      console.error('Admin leads fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    // Fetch linked free audit reports for leads that have associated audits
    const leadIds = (leads || []).map(l => l.id)
    let auditMap = new Map<string, { status: string; brand_name: string }>()
    if (leadIds.length > 0) {
      const { data: audits } = await supabase
        .from('free_audit_reports')
        .select('lead_id, status, brand_name')
        .in('lead_id', leadIds)
      if (audits) {
        for (const a of audits) {
          if (a.lead_id) auditMap.set(a.lead_id, { status: a.status, brand_name: a.brand_name })
        }
      }
    }

    // Summary stats
    const allLeads = leads || []
    const stats = {
      total: allLeads.length,
      new: allLeads.filter(l => l.status === 'new').length,
      engaged: allLeads.filter(l => l.status === 'engaged').length,
      audit_started: allLeads.filter(l => l.status === 'audit_started').length,
      audit_completed: allLeads.filter(l => l.status === 'audit_completed').length,
      converted: allLeads.filter(l => l.status === 'converted').length,
      with_email: allLeads.filter(l => l.email).length,
      conversion_rate: allLeads.length > 0 
        ? Math.round((allLeads.filter(l => l.status === 'converted').length / allLeads.length) * 100) 
        : 0,
    }

    const enrichedLeads = allLeads.map(l => ({
      ...l,
      audit: auditMap.get(l.id) || null,
    }))

    return NextResponse.json({ leads: enrichedLeads, stats })
  } catch (error) {
    console.error('Admin leads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
