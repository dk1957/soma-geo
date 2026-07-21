/**
 * Unified Content Pipeline API
 * POST /api/content/pipeline
 * 
 * Single-call endpoint that creates content AND starts optimization.
 * This is faster than the two-step create→optimize flow because:
 * 1. Single network round-trip instead of two
 * 2. No client-side delay between create and optimize
 * 3. Returns the content ID immediately so client can redirect to status page
 */

import { getCurrentUser } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { getMACOSystem } from "@/lib/services/maco-system"
import { gseoBaselineOptimizer, BaselineMethod } from "@/lib/services/gseo-baseline-strategies"
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

const PipelineRequestSchema = z.object({
  // Content fields
  brand_id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(10),
  content_type: z.enum(["article", "blog_post", "whitepaper", "guide", "case_study", "faq", "landing_page"]),
  source_type: z.enum(["manual", "upload", "url", "generated"]).optional(),
  source_url: z.string().url().optional(),
  source_file_name: z.string().optional(),
  source_materials: z.array(z.any()).optional(),
  target_audience: z.string().optional(),
  content_goals: z.array(z.string()).optional(),
  brand_voice: z
    .object({
      tone: z.string(),
      style_guidelines: z.array(z.string()),
      key_messages: z.array(z.string()),
      avoid_terms: z.array(z.string()).optional(),
    })
    .optional(),
  target_keywords: z.array(z.string()).optional(),
  target_platforms: z.array(z.string()).optional(),

  // Optimization fields
  optimization_strategy: z.enum(["conservative", "balanced", "aggressive", "comprehensive"]).default("balanced"),
  max_iterations: z.number().min(1).max(25).default(3),
  num_benchmark_queries: z.number().min(3).max(25).default(5),
  use_baseline_method: z
    .enum([
      "fluent", "simple_language", "technical_terms", "authoritative",
      "more_quotes", "citing_sources", "statistics", "unique_words", "keyword_stuffing",
    ])
    .optional(),
  run_mode: z.boolean().optional().default(false),

  // Pipeline options
  auto_optimize: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user?.clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = applyRateLimit(request, "content:pipeline", RATE_LIMITS.ai, user.clerkUserId)
  if (limited) return limited

  try {
    const body = await request.json()
    const data = PipelineRequestSchema.parse(body)

    const supabase = createServiceClient()

    // Verify brand access
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("account_id")
      .eq("id", data.brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Check user access
    const { data: accountUser } = await supabase
      .from("account_users")
      .select("clerk_id")
      .eq("account_id", brand.account_id)
      .eq("clerk_id", user.clerkUserId)
      .eq("is_active", true)
      .single()

    if (!accountUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Step 1: Create content record
    const { data: content, error: createError } = await supabase
      .from("gseo_content")
      .insert({
        clerk_id: user.clerkUserId,
        account_id: brand.account_id,
        brand_id: data.brand_id,
        title: data.title,
        content_type: data.content_type,
        original_content: data.content,
        original_format: "markdown",
        source_type: data.source_type || "manual",
        source_url: data.source_url,
        source_file_name: data.source_file_name,
        source_materials: data.source_materials || [],
        target_audience: data.target_audience,
        content_goals: data.content_goals || [],
        brand_voice: data.brand_voice || {},
        target_keywords: data.target_keywords || [],
        target_platforms: data.target_platforms || ["chatgpt", "claude", "gemini", "perplexity"],
        status: data.auto_optimize ? "optimizing" : "draft",
      })
      .select()
      .single()

    if (createError) {
      console.error("Pipeline: Error creating content:", createError)
      return NextResponse.json({ error: "Failed to create content" }, { status: 500 })
    }

    // Step 2: Start optimization immediately if auto_optimize is true
    let session = null
    if (data.auto_optimize) {
      const { data: sessionData } = await supabase
        .from("gseo_optimization_sessions")
        .insert({
          content_id: content.id,
          session_status: "active",
          current_iteration: 0,
          max_iterations: data.max_iterations,
        })
        .select()
        .single()

      session = sessionData

      // Start optimization in background
      setImmediate(async () => {
        try {
          if (data.run_mode) {
            await runSimulatedOptimization(content.id, data.max_iterations, session!.id)
          } else {
            await runMACOOptimization(content.id, data, session!.id)
          }
        } catch (error) {
          console.error("Pipeline: Background optimization error:", error)
          const svc = createServiceClient()
          await svc.from("gseo_content").update({ status: "draft" }).eq("id", content.id)
          if (session) {
            await svc.from("gseo_optimization_sessions").update({ session_status: "failed" }).eq("id", session.id)
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      content_id: content.id,
      status: data.auto_optimize ? "optimizing" : "draft",
      session_id: session?.id || null,
      message: data.auto_optimize
        ? "Content created and optimization started"
        : "Content created as draft",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Pipeline API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// ─── Background Optimization Runners ───────────────────────

async function runMACOOptimization(
  contentId: string,
  data: z.infer<typeof PipelineRequestSchema>,
  sessionId: string
) {
  const supabase = createServiceClient()

  const { data: content } = await supabase
    .from("gseo_content")
    .select("*")
    .eq("id", contentId)
    .single()

  if (!content) throw new Error("Content not found for optimization")

  const maco = getMACOSystem({
    maxIterations: data.max_iterations,
    convergenceThreshold: 0.5,
    plateauDetectionWindow: 3,
    numBenchmarkQueries: data.num_benchmark_queries,
  })

  const result = await maco.optimize({
    brand_name: "",
    original_content: content.original_content,
    content_type: content.content_type,
    target_audience: content.target_audience || "General audience",
    content_goals: content.content_goals || [],
    brand_voice: content.brand_voice || {},
    target_keywords: content.target_keywords || [],
    target_platforms: content.target_platforms || ["chatgpt", "claude", "gemini", "perplexity"],
    onIterationComplete: async (iteration: number, scores: any[], currentContent: string) => {
      await supabase
        .from("gseo_optimization_sessions")
        .update({
          current_iteration: iteration,
          current_scores: scores,
        })
        .eq("id", sessionId)

      if (iteration > 0) {
        await supabase.from("gseo_content_versions").insert({
          content_id: contentId,
          version_number: iteration,
          content: currentContent,
          scores,
        })
      }
    },
  })

  // Save final result
  await supabase
    .from("gseo_content")
    .update({
      optimized_content: result.finalContent,
      current_scores: result.scores,
      optimization_version: result.iterations,
      status: "reviewing",
    })
    .eq("id", contentId)

  await supabase
    .from("gseo_optimization_sessions")
    .update({
      session_status: "completed",
      current_iteration: result.iterations,
      final_scores: result.scores,
    })
    .eq("id", sessionId)
}

async function runSimulatedOptimization(
  contentId: string,
  maxIterations: number,
  sessionId: string
) {
  const supabase = createServiceClient()

  for (let i = 1; i <= maxIterations; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const simulatedScores = Array.from({ length: 6 }, () => ({
      dimension: "",
      score: Math.min(10, 3 + i * 1.2 + Math.random() * 0.5),
    }))

    await supabase
      .from("gseo_optimization_sessions")
      .update({
        current_iteration: i,
        current_scores: simulatedScores,
      })
      .eq("id", sessionId)
  }

  await supabase
    .from("gseo_content")
    .update({ status: "reviewing" })
    .eq("id", contentId)

  await supabase
    .from("gseo_optimization_sessions")
    .update({
      session_status: "completed",
      current_iteration: maxIterations,
    })
    .eq("id", sessionId)
}
