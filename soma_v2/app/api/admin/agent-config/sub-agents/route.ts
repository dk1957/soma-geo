import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"
import type { SubAgent } from "@/lib/agents/types"

/**
 * PUT /api/admin/agent-config/sub-agents
 * Update a sub-agent configuration including model, prompts, and skill flags
 */
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    const body = await request.json()
    const { systemId, subAgent } = body as {
      systemId: string
      subAgent: SubAgent
    }

    if (!systemId || !subAgent) {
      return NextResponse.json(
        { error: "Missing systemId or subAgent" },
        { status: 400 }
      )
    }

    // 1. Persist sub-agent model settings into agent_model_configs table
    const { error: modelError } = await supabase
      .from("agent_model_configs")
      .upsert(
        {
          agent_type: subAgent.id,
          model_id: subAgent.model,
          provider: "openrouter",
          temperature: subAgent.temperature,
          max_tokens: subAgent.max_tokens,
          is_active: subAgent.enabled,
        },
        { onConflict: "agent_type" }
      )

    if (modelError) throw modelError

    // 2. Save per-sub-agent prompts (system + user)
    if (subAgent.prompts && subAgent.prompts.length > 0) {
      const promptType = `sub_agent_${subAgent.id}`

      for (const prompt of subAgent.prompts) {
        if (!prompt.content && !prompt.content?.trim()) continue

        // Check if prompt exists
        const { data: existing } = await supabase
          .from("system_prompts")
          .select("id, version")
          .eq("prompt_type", promptType)
          .eq("role", prompt.type)
          .maybeSingle()

        if (existing) {
          await supabase
            .from("system_prompts")
            .update({
              content: prompt.content,
              version: (existing.version || 1) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
        } else if (prompt.content.trim()) {
          await supabase.from("system_prompts").insert({
            prompt_type: promptType,
            role: prompt.type,
            name: `${subAgent.name} ${prompt.type} prompt`,
            description: `Per-sub-agent prompt for ${subAgent.id}`,
            content: prompt.content,
            variables: [],
            is_active: true,
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      }
    }

    // 3. Save per-sub-agent skill flags
    if (subAgent.skill_flags && subAgent.skill_flags.length > 0) {
      for (const flag of subAgent.skill_flags) {
        await supabase
          .from("agent_skills")
          .update({ is_enabled: flag.enabled })
          .eq("sub_agent_id", subAgent.id)
          .eq("skill_key", flag.skill_key)
      }
    }

    return NextResponse.json({
      success: true,
      subAgent,
    })
  } catch (error) {
    console.error("[Agent Config Sub-Agents API]", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update sub-agent",
      },
      { status: 500 }
    )
  }
}
