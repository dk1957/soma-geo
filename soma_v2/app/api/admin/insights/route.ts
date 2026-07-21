/**
 * Admin Insight Agent API
 *
 * GET  /api/admin/insights — Get agent status, recent history, and knowledge base stats
 * POST /api/admin/insights — Trigger test generation for a brand
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { StrategicInsightAgent } from '@/lib/services/strategic-insight-agent'

export async function GET(request: NextRequest) {
  const supabase = createServiceClient()

  try {
    // Parallel: recent analyses, knowledge stats, active brands
    const [historyRes, knowledgeRes, brandsRes, modelsRes] = await Promise.all([
      supabase
        .from('strategic_insights')
        .select('id, brand_id, generation_type, trigger_source, model_used, confidence_score, data_sources, prompt_tokens, completion_tokens, created_at, analysis')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('brand_knowledge_facts')
        .select('brand_id, category, verified'),
      supabase
        .from('brands')
        .select('id, name, industry, is_active')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('llm_models')
        .select('id, name, openrouter_id, purpose, is_active')
        .in('purpose', ['insights', 'content'])
        .eq('is_active', true),
    ])

    // Build history summaries
    const history = (historyRes.data || []).map(row => {
      const brand = brandsRes.data?.find(b => b.id === row.brand_id)
      return {
        id: row.id,
        brand_id: row.brand_id,
        brand_name: brand?.name || 'Unknown',
        generation_type: row.generation_type,
        trigger_source: row.trigger_source,
        model_used: row.model_used,
        confidence_score: row.confidence_score,
        data_sources: row.data_sources,
        tokens: (row.prompt_tokens || 0) + (row.completion_tokens || 0),
        created_at: row.created_at,
        executive_summary: (row.analysis as any)?.executive_summary?.substring(0, 200) || '',
        counts: {
          findings: (row.analysis as any)?.key_findings?.length || 0,
          opportunities: (row.analysis as any)?.opportunities?.length || 0,
          threats: (row.analysis as any)?.threats?.length || 0,
          content_recs: (row.analysis as any)?.content_strategy?.length || 0,
        },
      }
    })

    // Build knowledge stats by brand
    const knowledgeByBrand: Record<string, { total: number; verified: number; categories: Set<string> }> = {}
    for (const fact of (knowledgeRes.data || [])) {
      if (!knowledgeByBrand[fact.brand_id]) {
        knowledgeByBrand[fact.brand_id] = { total: 0, verified: 0, categories: new Set() }
      }
      knowledgeByBrand[fact.brand_id].total++
      if (fact.verified) knowledgeByBrand[fact.brand_id].verified++
      knowledgeByBrand[fact.brand_id].categories.add(fact.category)
    }

    const knowledgeStats = Object.entries(knowledgeByBrand).map(([brandId, stats]) => {
      const brand = brandsRes.data?.find(b => b.id === brandId)
      return {
        brand_id: brandId,
        brand_name: brand?.name || 'Unknown',
        total_facts: stats.total,
        verified_facts: stats.verified,
        categories: stats.categories.size,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        history,
        knowledge_stats: knowledgeStats,
        brands: (brandsRes.data || []).map(b => ({ id: b.id, name: b.name, industry: b.industry })),
        active_models: {
          insight: (modelsRes.data || []).filter(m => m.purpose === 'insights'),
          content: (modelsRes.data || []).filter(m => m.purpose === 'content'),
        },
        total_analyses: history.length,
        total_facts: knowledgeRes.data?.length || 0,
      },
    })
  } catch (error) {
    console.error('[Admin Insights GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load insights data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brand_id, action } = body

    if (!brand_id) {
      return NextResponse.json({ success: false, error: 'brand_id is required' }, { status: 400 })
    }

    if (action === 'generate') {
      const agent = new StrategicInsightAgent()
      const result = await agent.generateAnalysis(brand_id, {
        forceRefresh: true,
        triggerSource: 'manual',
      })

      return NextResponse.json({
        success: true,
        data: {
          id: result.id,
          executive_summary: result.executive_summary,
          created_at: result.created_at,
          cached: result.cached,
          counts: {
            findings: result.key_findings.length,
            opportunities: result.opportunities.length,
            threats: result.threats.length,
            content_recs: result.content_strategy.length,
            fact_checks: result.fact_verification.length,
          },
        },
      })
    }

    if (action === 'extract_knowledge') {
      const { BrandKnowledgeService } = await import('@/lib/services/brand-knowledge-service')
      const supabase = createServiceClient()
      const { data: brand } = await supabase
        .from('brands')
        .select('account_id')
        .eq('id', brand_id)
        .single()

      if (!brand) {
        return NextResponse.json({ success: false, error: 'Brand not found' }, { status: 404 })
      }

      const service = new BrandKnowledgeService()
      const count = await service.extractFromBrandProfile(brand_id, brand.account_id)

      return NextResponse.json({
        success: true,
        data: { facts_created: count },
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Admin Insights POST] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Action failed' },
      { status: 500 }
    )
  }
}
