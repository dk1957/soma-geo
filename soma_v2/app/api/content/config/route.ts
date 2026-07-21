/**
 * Content Pipeline Config API
 * GET /api/content/config
 * 
 * Returns content pipeline configuration (content types, strategies, execution settings).
 * These are served from the admin-managed config so the dashboard stays in sync.
 */

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import type { ContentPipelineConfig } from "@/lib/agents/types"

// Default config (mirrors the admin defaults — single source of truth is the admin API)
const DEFAULT_CONFIG: ContentPipelineConfig = {
  content_types: [
    { value: "article", label: "Article", description: "Long-form informational article", enabled: true },
    { value: "blog_post", label: "Blog Post", description: "Conversational blog post", enabled: true },
    { value: "whitepaper", label: "Whitepaper", description: "In-depth research paper", enabled: true },
    { value: "guide", label: "Guide", description: "Step-by-step how-to guide", enabled: true },
    { value: "case_study", label: "Case Study", description: "Customer success story", enabled: true },
    { value: "faq", label: "FAQ", description: "Frequently asked questions", enabled: true },
    { value: "landing_page", label: "Landing Page", description: "Conversion-focused web page", enabled: true },
  ],
  optimization_strategies: [
    { value: "conservative", label: "Conservative", description: "Light edits for quick wins", time_estimate: "~2-3 min", enabled: true },
    { value: "balanced", label: "Balanced", description: "Moderate improvements (recommended)", time_estimate: "~5-7 min", enabled: true },
    { value: "aggressive", label: "Aggressive", description: "Extensive rewriting for maximum impact", time_estimate: "~8-12 min", enabled: true },
    { value: "comprehensive", label: "Comprehensive", description: "Deep analysis + restructuring", time_estimate: "~15-20 min", enabled: true },
  ],
  execution_settings: {
    max_iterations: { value: 10, min: 1, max: 25, description: "Maximum optimization cycles before stopping" },
    convergence_threshold: { value: 0.5, min: 0.1, max: 2.0, description: "Score variance below which optimization stops" },
    plateau_window: { value: 3, min: 2, max: 10, description: "Iterations to detect score plateau" },
    num_queries: { value: 10, min: 3, max: 25, description: "Benchmark queries generated per evaluation cycle" },
  },
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Static config — no DB overrides needed yet
    return NextResponse.json({ success: true, config: DEFAULT_CONFIG })
  } catch (error) {
    console.error("Error fetching content config:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
