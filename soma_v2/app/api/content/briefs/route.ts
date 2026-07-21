import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Schema validation for GET requests
const getBriefsSchema = z.object({
  brand: z.string().min(1, 'Brand parameter is required'),
  locale: z.enum(['en-GB', 'en-ZA', 'fr-FR', 'fr-MA', 'de-DE', 'it-IT', 'es-ES', 'nl-NL', 'sv-SE', 'no-NO', 'ar-AE', 'ar-SA', 'he-IL', 'tr-TR', 'en-US']).default('en-GB'),
  content_type: z.enum(['FAQ', 'HowTo', 'Product', 'Article', 'Guide', 'Landing', 'all']).default('all'),
  limit: z.number().min(1).max(50).default(20),
  status: z.enum(['draft', 'published', 'archived', 'all']).default('all')
})

// Schema validation for POST requests
const createBriefSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  locale: z.enum(['en-GB', 'en-ZA', 'fr-FR', 'fr-MA', 'de-DE', 'it-IT', 'es-ES', 'nl-NL', 'sv-SE', 'no-NO', 'ar-AE', 'ar-SA', 'he-IL', 'tr-TR', 'en-US']).default('en-GB'),
  brand: z.string().min(1, 'Brand is required'),
  competitors: z.array(z.string()).default([]),
  content_type: z.enum(['FAQ', 'HowTo', 'Product', 'Article', 'Guide', 'Landing']).default('Article'),
  target_keywords: z.array(z.string()).default([]),
  word_count_target: z.number().min(100).max(5000).default(1000),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly', 'authoritative']).default('professional'),
  include_citations: z.boolean().default(true),
  include_structured_data: z.boolean().default(true),
})

export async function GET(request: Request) {
  const user = await getCurrentUser()
  const supabase = createServiceClient()

  if (!user?.clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    
    const validatedParams = getBriefsSchema.parse({
      brand: searchParams.get('brand'),
      locale: searchParams.get('locale') || 'en-GB',
      content_type: searchParams.get('content_type') || 'all',
      limit: parseInt(searchParams.get('limit') || '20'),
      status: searchParams.get('status') || 'all'
    })

    // Find the brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        industry,
        accounts!inner(
          account_users!inner(user_id, role, is_active)
        )
      `)
      .or(`name.ilike.%${validatedParams.brand}%,slug.ilike.%${validatedParams.brand}%`)
      .eq('accounts.account_users.clerk_id', user.clerkUserId)
      .eq('accounts.account_users.is_active', true)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ 
        error: 'Brand not found or access denied',
        message: `No brand found matching "${validatedParams.brand}" that you have access to`
      }, { status: 404 })
    }

    // Build query for content docs
    let query = supabase
      .from('content_docs')
      .select(`
        id,
        title,
        content_type,
        locale,
        target_keywords,
        status,
        meta_title,
        meta_description,
        created_at,
        updated_at,
        metadata
      `)
      .eq('brand_id', brand.id)
      .eq('locale', validatedParams.locale)

    // Apply filters
    if (validatedParams.content_type !== 'all') {
      query = query.eq('content_type', validatedParams.content_type)
    }

    if (validatedParams.status !== 'all') {
      query = query.eq('status', validatedParams.status)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(validatedParams.limit)

    const { data: contentDocs, error: docsError } = await query

    if (docsError) {
      console.error('Error fetching content docs:', docsError)
      return NextResponse.json({ 
        error: 'Failed to fetch content briefs',
        message: 'Database error occurred while retrieving content'
      }, { status: 500 })
    }

    // Get content performance metrics
    const contentIds = contentDocs?.map(doc => doc.id) || []
    let performanceMetrics: Record<string, {
      ldi_impact: number;
      citation_count: number;
      visibility_score: number;
    }> = {}

    if (contentIds.length > 0) {
      const { data: metrics, error: metricsError } = await supabase
        .from('content_performance')
        .select('content_id, ldi_impact, citation_count, visibility_score')
        .in('content_id', contentIds)

      if (!metricsError && metrics) {
        performanceMetrics = metrics.reduce((acc, metric) => {
          acc[metric.content_id] = {
            ldi_impact: metric.ldi_impact,
            citation_count: metric.citation_count,
            visibility_score: metric.visibility_score
          }
          return acc
        }, {} as Record<string, {
          ldi_impact: number;
          citation_count: number;
          visibility_score: number;
        }>)
      }
    }

    // Get recent LLM query results for content gaps analysis
    const { data: recentQueries, error: queriesError } = await supabase
      .from('llm_query_results')
      .select('query, brand_mentions, created_at')
      .eq('brand_id', brand.id)
      .gte('created_at', new Date(0).toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    // Analyze content gaps
    const contentGaps = analyzeContentGaps(recentQueries || [], contentDocs || [])

    // Format response
    const briefs = contentDocs?.map(doc => ({
      id: doc.id,
      title: doc.title,
      content_type: doc.content_type,
      locale: doc.locale,
      status: doc.status,
      target_keywords: doc.target_keywords,
      meta_title: doc.meta_title,
      meta_description: doc.meta_description,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      performance: performanceMetrics[doc.id] || {
        ldi_impact: 0,
        citation_count: 0,
        visibility_score: 0
      },
      brief_summary: doc.metadata?.brief ? {
        word_count_target: doc.metadata.word_count_target,
        tone: doc.metadata.tone,
        sections_count: doc.metadata.brief.content_structure?.sections?.length || 0,
        competitor_analysis: doc.metadata.brief.competitive_landscape?.main_competitors?.length || 0
      } : null
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        brand_info: {
          id: brand.id,
          name: brand.name,
          industry: brand.industry
        },
        filters: {
          locale: validatedParams.locale,
          content_type: validatedParams.content_type,
          status: validatedParams.status,
          limit: validatedParams.limit
        },
        briefs,
        summary: {
          total_briefs: briefs.length,
          by_status: briefs.reduce((acc, brief) => {
            acc[brief.status] = (acc[brief.status] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          by_content_type: briefs.reduce((acc, brief) => {
            acc[brief.content_type] = (acc[brief.content_type] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          avg_performance: briefs.length > 0 ? {
            avg_ldi_impact: Math.round(briefs.reduce((sum, b) => sum + b.performance.ldi_impact, 0) / briefs.length * 100) / 100,
            total_citations: briefs.reduce((sum, b) => sum + b.performance.citation_count, 0),
            avg_visibility: Math.round(briefs.reduce((sum, b) => sum + b.performance.visibility_score, 0) / briefs.length * 100) / 100
          } : null
        },
        content_opportunities: {
          identified_gaps: contentGaps.slice(0, 5),
          recommended_content_types: getRecommendedContentTypes(contentGaps),
          priority_keywords: extractPriorityKeywords(recentQueries || [])
        }
      }
    })

  } catch (error) {
    console.error('Error in GET content briefs:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: error.errors,
          message: 'Please check your request parameters and try again'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Unable to fetch content briefs at this time'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  const supabase = createServiceClient()

  if (!user?.clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = createBriefSchema.parse(body)

    // Find the brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select(`
        *,
        accounts!inner(
          account_users!inner(user_id, role)
        )
      `)
      .or(`name.ilike.%${validatedData.brand}%,slug.ilike.%${validatedData.brand}%`)
      .eq('accounts.account_users.clerk_id', user.clerkUserId)
      .eq('accounts.account_users.is_active', true)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 })
    }

    // Check user permissions
    const userRole = brand.accounts[0]?.account_users[0]?.role
    if (!['owner', 'admin', 'account_manager', 'member'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get competitor insights for the topic
    const { data: competitorInsights, error: competitorError } = await supabase
      .from('competitors')
      .select('*')
      .eq('account_id', brand.account_id)
      .in('competitor_name', validatedData.competitors)

    if (competitorError) {
      console.error('Error fetching competitor insights:', competitorError)
    }

    // Get related queries from query bank
    const { data: relatedQueries, error: queriesError } = await supabase
      .from('query_bank')
      .select('*')
      .eq('locale', validatedData.locale)
      .ilike('text', `%${validatedData.topic}%`)
      .limit(10)

    if (queriesError) {
      console.error('Error fetching related queries:', queriesError)
    }

    // Get existing content gaps for this topic
    const { data: contentGaps, error: gapsError } = await supabase
      .rpc('identify_content_opportunities', {
        brand_uuid: brand.id,
        locale_param: validatedData.locale,
        limit_param: 5
      })

    if (gapsError) {
      console.error('Error identifying content gaps:', gapsError)
    }

    // Generate content brief structure
    const brief = {
      topic: validatedData.topic,
      brand_context: {
        name: brand.name,
        industry: brand.industry_category,
        target_markets: brand.target_markets,
        locales: brand.locales,
        voice_tone: validatedData.tone,
      },
      content_specifications: {
        type: validatedData.content_type,
        locale: validatedData.locale,
        target_word_count: validatedData.word_count_target,
        target_keywords: validatedData.target_keywords,
        include_citations: validatedData.include_citations,
        include_structured_data: validatedData.include_structured_data,
      },
      competitive_landscape: {
        main_competitors: competitorInsights?.map(c => ({
          name: c.competitor_name,
          domain: c.competitor_domain,
          industry: c.industry,
          competitive_strength: c.competitive_strength,
        })) || [],
        competitor_content_gaps: contentGaps || [],
      },
      research_insights: {
        related_queries: relatedQueries?.map(q => ({
          text: q.text,
          intent_type: q.intent_type,
          weight: q.weight,
          difficulty_score: q.difficulty_score,
        })) || [],
        search_volume_estimates: validatedData.target_keywords.map(keyword => ({
          keyword,
          estimated_volume: null, // Requires integration with search volume API (e.g., SerpAPI, SEMrush)
          competition: null,
        })),
      },
      content_structure: generateContentStructure(validatedData.content_type, validatedData.topic),
      seo_recommendations: {
        title_suggestions: generateTitleSuggestions(validatedData.topic, validatedData.content_type),
        meta_description_template: `Learn about ${validatedData.topic} with our comprehensive ${validatedData.content_type.toLowerCase()} guide. Expert insights and practical tips.`,
        internal_linking_opportunities: [],
        schema_markup_types: validatedData.include_structured_data 
          ? [validatedData.content_type === 'FAQ' ? 'FAQPage' : 'Article'] 
          : [],
      },
      kpis_and_metrics: {
        target_ldi_improvement: 5, // 5 point improvement target
        target_citation_rate: 15, // 15% citation rate target
        tracking_queries: relatedQueries?.slice(0, 5).map(q => q.text) || [],
      },
    }

    // Save the brief to database
    const { data: contentDoc, error: saveError } = await supabase
      .from('content_docs')
      .insert({
        brand_id: brand.id,
        title: `Content Brief: ${validatedData.topic}`,
        content_type: validatedData.content_type,
        locale: validatedData.locale,
        target_keywords: validatedData.target_keywords,
        status: 'draft',
        meta_title: brief.seo_recommendations.title_suggestions[0],
        meta_description: brief.seo_recommendations.meta_description_template,
        created_by: user.clerkUserId,
        metadata: {
          brief,
          word_count_target: validatedData.word_count_target,
          tone: validatedData.tone,
        },
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving content brief:', saveError)
      return NextResponse.json({ error: 'Failed to save content brief' }, { status: 500 })
    }

    return NextResponse.json({
      brief_id: contentDoc.id,
      brief,
      estimated_completion_time: `${Math.ceil(validatedData.word_count_target / 200)} hours`, // Rough estimate
      next_steps: [
        'Review competitive analysis',
        'Conduct keyword research',
        'Create content outline',
        'Begin content creation',
        'Optimize for AEO',
      ],
      created_at: new Date().toISOString(),
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating content brief:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function generateContentStructure(contentType: string, topic: string) {
  const structures: Record<string, any> = {
    'FAQ': {
      sections: [
        { title: 'Introduction', purpose: 'Define the topic and set context' },
        { title: 'Frequently Asked Questions', purpose: 'Address common questions about ' + topic },
        { title: 'Expert Insights', purpose: 'Provide authoritative perspective' },
        { title: 'Conclusion', purpose: 'Summarize key points and next steps' },
      ],
      estimated_questions: 8,
      recommended_format: 'Question and Answer pairs with detailed explanations',
    },
    'HowTo': {
      sections: [
        { title: 'Introduction', purpose: 'Explain what will be accomplished' },
        { title: 'Prerequisites', purpose: 'List required tools, knowledge, or setup' },
        { title: 'Step-by-Step Instructions', purpose: 'Detailed walkthrough' },
        { title: 'Tips and Best Practices', purpose: 'Expert recommendations' },
        { title: 'Troubleshooting', purpose: 'Common issues and solutions' },
        { title: 'Conclusion', purpose: 'Summary and additional resources' },
      ],
      estimated_steps: 6,
      recommended_format: 'Numbered steps with clear instructions and visuals',
    },
    'Article': {
      sections: [
        { title: 'Introduction', purpose: 'Hook reader and introduce topic' },
        { title: 'Background/Context', purpose: 'Provide necessary background on ' + topic },
        { title: 'Main Content', purpose: 'Core information and insights' },
        { title: 'Analysis/Discussion', purpose: 'Expert analysis and implications' },
        { title: 'Conclusion', purpose: 'Key takeaways and future outlook' },
      ],
      recommended_format: 'Long-form article with subheadings and supporting data',
    },
  }

  return structures[contentType] || structures['Article']
}

function generateTitleSuggestions(topic: string, contentType: string): string[] {
  const titleTemplates: Record<string, string[]> = {
    'FAQ': [
      `${topic}: Frequently Asked Questions`,
      `Everything You Need to Know About ${topic}`,
      `${topic} FAQ: Expert Answers to Common Questions`,
    ],
    'HowTo': [
      `How to ${topic}: Complete Guide`,
      `Step-by-Step Guide to ${topic}`,
      `Master ${topic}: Practical How-To Guide`,
    ],
    'Article': [
      `The Complete Guide to ${topic}`,
      `Understanding ${topic}: Comprehensive Analysis`,
      `${topic}: Trends, Insights, and Best Practices`,
    ],
  }

  return titleTemplates[contentType] || titleTemplates['Article']
}

// Helper function to analyze content gaps
function analyzeContentGaps(queries: any[], existingContent: any[]): Array<{
  topic: string
  demand_indicators: number
  suggested_content_type: string
  priority: string
  example_queries: string[]
}> {
  const gaps: Array<{
    topic: string
    demand_indicators: number
    suggested_content_type: string
    priority: string
    example_queries: string[]
  }> = []
  
  const existingTopics = existingContent.map(content => 
    content.title?.toLowerCase() || ''
  )

  // Analyze queries that don't have corresponding content
  const queryTopics = queries
    .filter(q => q.brand_mentions && q.brand_mentions.length === 0) // Not mentioned
    .map(q => q.query.toLowerCase())
    .filter(query => {
      // Check if we have content covering this query
      return !existingTopics.some(topic => 
        topic.includes(query.split(' ')[0]) || query.includes(topic.split(' ')[0])
      )
    })

  // Group similar queries
  const topicGroups = groupSimilarQueries(queryTopics)
  
  topicGroups.forEach((group, index) => {
    if (group.length >= 2) { // At least 2 similar queries indicate demand
      gaps.push({
        topic: group[0],
        demand_indicators: group.length,
        suggested_content_type: suggestContentType(group[0]),
        priority: group.length > 5 ? 'high' : group.length > 3 ? 'medium' : 'low',
        example_queries: group.slice(0, 3)
      })
    }
  })

  return gaps.sort((a, b) => b.demand_indicators - a.demand_indicators)
}

// Helper function to group similar queries
function groupSimilarQueries(queries: string[]): string[][] {
  const groups: string[][] = []
  const used = new Set<string>()

  queries.forEach(query => {
    if (used.has(query)) return

    const group = [query]
    used.add(query)

    const queryWords = query.split(' ')
    
    queries.forEach(otherQuery => {
      if (used.has(otherQuery) || query === otherQuery) return
      
      const otherWords = otherQuery.split(' ')
      const commonWords = queryWords.filter(word => 
        otherWords.includes(word) && word.length > 3
      )
      
      if (commonWords.length >= 2) {
        group.push(otherQuery)
        used.add(otherQuery)
      }
    })

    if (group.length > 1) {
      groups.push(group)
    }
  })

  return groups
}

// Helper function to suggest content type based on query
function suggestContentType(query: string): string {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('how to') || lowerQuery.includes('tutorial')) {
    return 'HowTo'
  }
  if (lowerQuery.includes('what is') || lowerQuery.includes('faq') || lowerQuery.includes('questions')) {
    return 'FAQ'
  }
  if (lowerQuery.includes('guide') || lowerQuery.includes('complete')) {
    return 'Guide'
  }
  if (lowerQuery.includes('product') || lowerQuery.includes('review')) {
    return 'Product'
  }
  
  return 'Article'
}

// Helper function to get recommended content types
function getRecommendedContentTypes(contentGaps: any[]): string[] {
  const typeCount = contentGaps.reduce((acc, gap) => {
    acc[gap.suggested_content_type] = (acc[gap.suggested_content_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(typeCount)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3)
    .map(([type]) => type)
}

// Helper function to extract priority keywords
function extractPriorityKeywords(queries: any[]): string[] {
  const keywordCount = new Map<string, number>()

  queries.forEach(query => {
    const words = query.query
      .toLowerCase()
      .split(' ')
      .filter((word: string) => word.length > 3 && !['what', 'how', 'where', 'when', 'why', 'the', 'and', 'for', 'with'].includes(word))

    words.forEach((word: string) => {
      keywordCount.set(word, (keywordCount.get(word) || 0) + 1)
    })
  })

  return Array.from(keywordCount.entries())
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 10)
    .map(([keyword]) => keyword)
}