/**
 * Brand Knowledge Service
 * =======================
 * CRUD + auto-extraction for the brand_knowledge_facts table.
 * This is the "source of truth" that the strategic insight agent
 * uses to fact-check LLM responses about a brand.
 */

import { createServiceClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────────────────

export type FactCategory =
  | 'identity'
  | 'contact'
  | 'pricing'
  | 'products'
  | 'team'
  | 'locations'
  | 'claims'
  | 'competitors'
  | 'differentiators'
  | 'audience'

export type FactSource = 'manual' | 'website_crawl' | 'llm_extracted' | 'api_import'

export interface BrandFact {
  id: string
  brand_id: string
  account_id: string
  category: FactCategory
  fact_key: string
  fact_value: string
  fact_context: string | null
  source: FactSource
  source_url: string | null
  confidence: number
  verified: boolean
  verified_at: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateFactInput {
  brand_id: string
  account_id: string
  category: FactCategory
  fact_key: string
  fact_value: string
  fact_context?: string
  source?: FactSource
  source_url?: string
  confidence?: number
  verified?: boolean
}

export interface UpdateFactInput {
  fact_value?: string
  fact_context?: string
  confidence?: number
  verified?: boolean
  source?: FactSource
  source_url?: string
}

// ─── Service ────────────────────────────────────────────────────────────────

export class BrandKnowledgeService {
  private supabase = createServiceClient()

  /** Get all facts for a brand, optionally filtered by category */
  async getFacts(brandId: string, category?: FactCategory): Promise<BrandFact[]> {
    let query = this.supabase
      .from('brand_knowledge_facts')
      .select('*')
      .eq('brand_id', brandId)
      .order('category')
      .order('fact_key')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch facts: ${error.message}`)
    return (data || []) as BrandFact[]
  }

  /** Get facts grouped by category (for display) */
  async getFactsByCategory(brandId: string): Promise<Record<FactCategory, BrandFact[]>> {
    const facts = await this.getFacts(brandId)
    const grouped: Record<string, BrandFact[]> = {}
    for (const fact of facts) {
      if (!grouped[fact.category]) grouped[fact.category] = []
      grouped[fact.category].push(fact)
    }
    return grouped as Record<FactCategory, BrandFact[]>
  }

  /** Create a new fact (upserts on brand_id + category + fact_key) */
  async upsertFact(input: CreateFactInput): Promise<BrandFact> {
    const { data, error } = await this.supabase
      .from('brand_knowledge_facts')
      .upsert(
        {
          brand_id: input.brand_id,
          account_id: input.account_id,
          category: input.category,
          fact_key: input.fact_key,
          fact_value: input.fact_value,
          fact_context: input.fact_context || null,
          source: input.source || 'manual',
          source_url: input.source_url || null,
          confidence: input.confidence ?? 1.0,
          verified: input.verified ?? false,
        },
        { onConflict: 'brand_id,category,fact_key' }
      )
      .select()
      .single()

    if (error) throw new Error(`Failed to upsert fact: ${error.message}`)
    return data as BrandFact
  }

  /** Bulk upsert facts */
  async upsertFacts(inputs: CreateFactInput[]): Promise<number> {
    if (inputs.length === 0) return 0

    const rows = inputs.map(input => ({
      brand_id: input.brand_id,
      account_id: input.account_id,
      category: input.category,
      fact_key: input.fact_key,
      fact_value: input.fact_value,
      fact_context: input.fact_context || null,
      source: input.source || 'manual',
      source_url: input.source_url || null,
      confidence: input.confidence ?? 1.0,
      verified: input.verified ?? false,
    }))

    const { error, count } = await this.supabase
      .from('brand_knowledge_facts')
      .upsert(rows, { onConflict: 'brand_id,category,fact_key', count: 'exact' })

    if (error) throw new Error(`Failed to bulk upsert facts: ${error.message}`)
    return count ?? inputs.length
  }

  /** Update an existing fact */
  async updateFact(factId: string, updates: UpdateFactInput): Promise<BrandFact> {
    const { data, error } = await this.supabase
      .from('brand_knowledge_facts')
      .update(updates)
      .eq('id', factId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update fact: ${error.message}`)
    return data as BrandFact
  }

  /** Delete a fact */
  async deleteFact(factId: string): Promise<void> {
    const { error } = await this.supabase
      .from('brand_knowledge_facts')
      .delete()
      .eq('id', factId)

    if (error) throw new Error(`Failed to delete fact: ${error.message}`)
  }

  /** Mark a fact as verified by a user */
  async verifyFact(factId: string, userId: string): Promise<BrandFact> {
    return this.updateFact(factId, {
      verified: true,
    } as any)
  }

  /** Get a compact text representation of all facts (for LLM context) */
  async getFactsAsContext(brandId: string): Promise<string> {
    const facts = await this.getFacts(brandId)
    if (facts.length === 0) return ''

    const grouped: Record<string, BrandFact[]> = {}
    for (const f of facts) {
      if (!grouped[f.category]) grouped[f.category] = []
      grouped[f.category].push(f)
    }

    const lines: string[] = ['VERIFIED BRAND FACTS:']
    for (const [category, catFacts] of Object.entries(grouped)) {
      lines.push(`\n[${category.toUpperCase()}]`)
      for (const f of catFacts) {
        const verifiedTag = f.verified ? ' ✓' : ''
        lines.push(`- ${f.fact_key}: ${f.fact_value}${verifiedTag}`)
      }
    }

    return lines.join('\n')
  }

  /**
   * Auto-extract facts from brand profile data.
   * Called when a brand is created or updated to seed the knowledge base.
   */
  async extractFromBrandProfile(brandId: string, accountId: string): Promise<number> {
    const { data: brand } = await this.supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single()

    if (!brand) return 0

    const facts: CreateFactInput[] = []
    const add = (category: FactCategory, key: string, value: string | null | undefined, source: FactSource = 'api_import') => {
      if (value && value.trim()) {
        facts.push({ brand_id: brandId, account_id: accountId, category, fact_key: key, fact_value: value.trim(), source })
      }
    }

    // Identity — use actual column names from brands table
    add('identity', 'brand_name', brand.name)
    add('identity', 'website', brand.brand_website || brand.primary_domain || brand.company_website)
    add('identity', 'industry', brand.industry)
    add('identity', 'description', brand.description)
    add('identity', 'entity_type', brand.entity_type)
    add('identity', 'business_model', brand.business_model)
    add('identity', 'business_type', brand.business_type)
    add('identity', 'company_name', brand.company_name)

    // Products / Services
    add('products', 'products_services', brand.products_services)
    add('products', 'value_proposition', brand.primary_value)
    add('products', 'brand_category', brand.brand_category)

    // Audience
    add('audience', 'target_audience', brand.target_audience)
    if (brand.target_markets && Array.isArray(brand.target_markets) && brand.target_markets.length > 0) {
      add('audience', 'target_markets', brand.target_markets.join(', '))
    }

    // Location
    add('locations', 'headquarters', brand.company_location)

    // Competitors — pull from the actual competitors table (authoritative source)
    const { data: competitors } = await this.supabase
      .from('competitors')
      .select('competitor_name, competitor_domain, is_direct_competitor, competitive_threat_level, market_position, strengths, weaknesses')
      .eq('brand_id', brandId)

    if (competitors && competitors.length > 0) {
      for (const comp of competitors) {
        const key = `competitor_${comp.competitor_name.toLowerCase().replace(/\s+/g, '_')}`
        const details = [
          comp.competitor_name,
          comp.competitor_domain ? `(${comp.competitor_domain})` : '',
          comp.is_direct_competitor ? 'direct' : 'indirect',
          comp.competitive_threat_level ? `threat:${comp.competitive_threat_level}` : '',
        ].filter(Boolean).join(' ')
        add('competitors', key, details)
      }
    } else if (brand.known_competitors && Array.isArray(brand.known_competitors)) {
      // Fallback to brands.known_competitors if no competitors table entries
      for (const comp of brand.known_competitors) {
        add('competitors', `competitor_${comp.toLowerCase().replace(/\s+/g, '_')}`, comp)
      }
    }

    return this.upsertFacts(facts)
  }
}
