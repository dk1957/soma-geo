import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"
import type { AgentPrompt } from "@/lib/agents/types"

/**
 * POST /api/admin/agent-config/prompts
 * Create or update an agent prompt
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    const body = await request.json()
    const { systemId, type, content } = body as {
      systemId: string
      type: "system" | "user"
      content: string
    }

    if (!systemId || !type || !content) {
      return NextResponse.json(
        { error: "Missing systemId, type, or content" },
        { status: 400 }
      )
    }

    const promptType = `agent_system_${systemId}`

    // Check if prompt already exists for this system and type
    const { data: existingPrompt } = await supabase
      .from("system_prompts")
      .select("id, version")
      .eq("prompt_type", promptType)
      .eq("role", type)
      .maybeSingle()

    let version = 1
    if (existingPrompt) {
      version = (existingPrompt.version || 1) + 1
      // Update existing prompt
      const { error } = await supabase
        .from("system_prompts")
        .update({
          content,
          version,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPrompt.id)

      if (error) throw error
    } else {
      // Create new prompt
      const { error } = await supabase.from("system_prompts").insert({
        prompt_type: promptType,
        role: type,
        name: `${systemId} ${type} prompt`,
        description: `Managed via Agent Config for ${systemId}`,
        content,
        variables: [],
        is_active: true,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      version,
    })
  } catch (error) {
    console.error("[Agent Config Prompts API]", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save prompt",
      },
      { status: 500 }
    )
  }
}
