/**
 * Content Suggestions API
 * GET /api/content/suggestions?brand_id=xxx
 * 
 * Generates content creation suggestions based on:
 * 1. Brand visibility insights (opportunity prompts, weak topics)
 * 2. Competitor gap analysis
 * 3. Low-performing content areas
 * 
 * These suggestions help users create content that will move visibility up.
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase/server"

interface ContentSuggestion {
  id: string
  type: "opportunity" | "gap" | "improve" | "trending"
  title: string
  description: string
  suggested_content_type: string
  suggested_keywords: string[]
  priority: "high" | "medium" | "low"
  source: string
  estimated_impact: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const brandId = request.nextUrl.searchParams.get("brand_id")
    if (!brandId) {
      return NextResponse.json({ error: "brand_id required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify brand access
    const { data: brand } = await supabase
      .from("brands")
      .select("id, name, account_id, accounts!inner(account_users!inner(clerk_id))")
      .eq("id", brandId)
      .single()

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    const hasAccess = (brand as any).accounts.account_users.some(
      (au: any) => au.clerk_id === user.clerkUserId
    )
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch data in parallel for suggestion generation
    const [
      { data: recentResponses },
      { data: existingContent },
      { data: brandCompetitors },
    ] = await Promise.all([
      // Get recent LLM responses to find opportunity prompts (not mentioning brand)
      supabase
        .from("llm_simulation_responses")
        .select("prompt_text, model_name, response_text, brand_mentioned, brand_sentiment_label")
        .eq("brand_id", brandId)
        .eq("brand_mentioned", false)
        .order("created_at", { ascending: false })
        .limit(20),
      // Get existing content to avoid duplicates
      supabase
        .from("gseo_content")
        .select("title, target_keywords, content_type, status")
        .eq("brand_id", brandId)
        .limit(50),
      // Get competitors
      supabase
        .from("brand_competitors")
        .select("competitor_name")
        .eq("brand_id", brandId)
        .limit(10),
    ])

    const suggestions: ContentSuggestion[] = []
    const existingKeywords = new Set(
      (existingContent || []).flatMap((c: any) => c.target_keywords || []).map((k: string) => k.toLowerCase())
    )

    // 1. Opportunity suggestions — prompts where brand is NOT mentioned
    const opportunityPrompts = (recentResponses || []).slice(0, 5)
    for (let i = 0; i < opportunityPrompts.length; i++) {
      const prompt = opportunityPrompts[i]
      const keywords = extractKeywords(prompt.prompt_text)
      const uniqueKeywords = keywords.filter(k => !existingKeywords.has(k.toLowerCase()))

      if (uniqueKeywords.length === 0) continue

      suggestions.push({
        id: `opp-${i}`,
        type: "opportunity",
        title: truncateToTitle(prompt.prompt_text),
        description: `AI models answer "${prompt.prompt_text.substring(0, 100)}..." without mentioning your brand. Create optimized content to capture this query.`,
        suggested_content_type: "article",
        suggested_keywords: uniqueKeywords.slice(0, 5),
        priority: "high",
        source: `${prompt.model_name} response`,
        estimated_impact: "Could add brand visibility for this query across AI platforms",
      })
    }

    // 2. Competitor gap suggestions
    const competitorNames = (brandCompetitors || []).map((c: any) => c.competitor_name)
    if (competitorNames.length > 0) {
      // Find prompts where competitors are mentioned but brand isn't
      const { data: competitorMentions } = await supabase
        .from("llm_simulation_responses")
        .select("prompt_text, model_name, response_text")
        .eq("brand_id", brandId)
        .eq("brand_mentioned", false)
        .order("created_at", { ascending: false })
        .limit(10)

      const competitorGaps = (competitorMentions || []).filter((r: any) => {
        const text = r.response_text?.toLowerCase() || ""
        return competitorNames.some((c: string) => text.includes(c.toLowerCase()))
      })

      for (let i = 0; i < Math.min(competitorGaps.length, 3); i++) {
        const gap = competitorGaps[i]
        const mentionedCompetitors = competitorNames.filter((c: string) =>
          gap.response_text?.toLowerCase().includes(c.toLowerCase())
        )
        suggestions.push({
          id: `gap-${i}`,
          type: "gap",
          title: `Beat ${mentionedCompetitors[0] || "competitor"}: ${truncateToTitle(gap.prompt_text)}`,
          description: `Competitors (${mentionedCompetitors.join(", ")}) are mentioned in AI answers for this query but your brand isn't. Create content to compete.`,
          suggested_content_type: "article",
          suggested_keywords: extractKeywords(gap.prompt_text).slice(0, 5),
          priority: "high",
          source: "Competitor gap analysis",
          estimated_impact: `Displace ${mentionedCompetitors[0] || "competitors"} in AI responses`,
        })
      }
    }

    // 3. Improve existing low-scoring content
    const { data: lowScoringContent } = await supabase
      .from("gseo_content")
      .select("id, title, target_keywords, status, optimization_version")
      .eq("brand_id", brandId)
      .in("status", ["draft", "reviewing"])
      .order("created_at", { ascending: true })
      .limit(3)

    for (let i = 0; i < (lowScoringContent || []).length; i++) {
      const content = lowScoringContent![i]
      suggestions.push({
        id: `improve-${content.id}`,
        type: "improve",
        title: `Re-optimize: ${content.title}`,
        description: `"${content.title}" is in ${content.status} status. Re-run optimization to improve its GSEO scores.`,
        suggested_content_type: "article",
        suggested_keywords: content.target_keywords || [],
        priority: "medium",
        source: "Existing content audit",
        estimated_impact: "Improve existing content visibility scores",
      })
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, 10),
      metadata: {
        total_opportunities: opportunityPrompts.length,
        total_existing: (existingContent || []).length,
        competitors_tracked: competitorNames?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error generating content suggestions:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}

/** Extract key phrases from a prompt for keyword suggestions */
function extractKeywords(text: string): string[] {
  if (!text) return []
  // Remove common question words and stopwords
  const stopwords = new Set([
    "what", "which", "who", "how", "why", "when", "where", "is", "are", "was",
    "were", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "that", "this", "it", "its", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "can", "may", "might", "shall", "must", "need", "about", "into",
    "through", "during", "before", "after", "above", "below", "between", "under",
    "again", "further", "then", "once", "there", "here", "most", "some", "such",
    "only", "very", "just", "also", "more", "other", "than", "if", "not", "no",
    "all", "any", "each", "every", "both", "few", "many", "much", "own", "same",
    "so", "up", "out", "me", "my", "i", "you", "your", "best", "top",
  ])

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w))

  // Return unique words as keywords
  return [...new Set(words)].slice(0, 10)
}

/** Truncate a prompt text to a reasonable title */
function truncateToTitle(text: string): string {
  if (!text) return "Untitled"
  const cleaned = text.replace(/[?!.]+$/, "").trim()
  if (cleaned.length <= 60) return cleaned
  return cleaned.substring(0, 57) + "..."
}
