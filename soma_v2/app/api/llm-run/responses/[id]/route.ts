import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { LLMResponseStorage } from '@/lib/services/llm-response-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    const { id: responseId } = await params

    // Check authentication
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try file-based storage first
    const { data: fileRecord } = await supabase
      .from('llm_response_files')
      .select('id, prompt_text, model_name, model_provider, response_preview, created_at, run_id, response_time_ms, success, cost_estimate, brand_id, account_id, storage_path, meta_storage_path, word_count, token_usage, consumer_behavior')
      .eq('id', responseId)
      .maybeSingle()

    if (fileRecord) {
      // Verify access
      const { data: userAccess, error: accessError } = await supabase
        .from('account_users')
        .select('account_id')
        .eq('account_id', fileRecord.account_id)
        .eq('clerk_id', user.clerkUserId)
        .eq('is_active', true)
        .single()

      if (accessError || !userAccess) {
        return NextResponse.json({ error: 'Access denied to this response' }, { status: 403 })
      }

      // Download full response from Storage
      const fileStorage = new LLMResponseStorage(supabase)
      let rawResponse = fileRecord.response_preview || ''
      try {
        rawResponse = await fileStorage.downloadResponse(fileRecord.storage_path)
      } catch (downloadErr) {
        console.warn('⚠️ File download failed, using preview:', downloadErr)
      }

      return NextResponse.json({
        success: true,
        data: {
          id: fileRecord.id,
          prompt_text: fileRecord.prompt_text,
          model_name: fileRecord.model_name,
          model_provider: fileRecord.model_provider,
          raw_response: rawResponse,
          created_at: fileRecord.created_at,
          run_id: fileRecord.run_id,
          response_time_ms: fileRecord.response_time_ms,
          success: fileRecord.success,
          cost_estimate: fileRecord.cost_estimate,
          brand_id: fileRecord.brand_id,
          account_id: fileRecord.account_id,
          word_count: fileRecord.word_count,
          token_usage: fileRecord.token_usage,
          source: 'file_storage',
        }
      })
    }

    // Response not found in file storage
    return NextResponse.json({ error: 'Response not found' }, { status: 404 })

  } catch (error) {
    console.error('❌ Response API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}