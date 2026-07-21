/**
 * LLM Response File Storage Service
 * ----------------------------------
 * Manages LLM response files in Supabase Storage with a structured folder hierarchy:
 *
 *   llm-responses/{account_id}/{brand_id}/{run_id}/{model_name}/{prompt_id}.md
 *   llm-responses/{account_id}/{brand_id}/{run_id}/{model_name}/{prompt_id}.meta.json
 *   llm-responses/{account_id}/{brand_id}/{run_id}/_manifest.json
 *
 * The metadata table `llm_response_files` holds lightweight queryable fields
 * (previews, metrics, hashes) while the full response text lives in Storage.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { LLMResponse } from './llm-run-orchestrator'

const BUCKET = 'llm-responses'
const PREVIEW_LENGTH = 500
const BATCH_SIZE = 20 // Storage uploads per batch

export interface StoredResponseMeta {
  token_usage: LLMResponse['token_usage']
  cost_estimate: number
  response_time_ms: number
  consumer_behavior?: string
  system_prompt?: string
  processing_metadata?: LLMResponse['processing_metadata']
  extracted_citations?: LLMResponse['extracted_citations']
  model_provider: string
  created_at: string
}

export interface ManifestEntry {
  run_id: string
  brand_id: string
  account_id: string
  models: string[]
  prompt_count: number
  response_count: number
  total_cost: number
  created_at: string
  completed_at: string
}

export interface ResponseFileRecord {
  id?: string
  run_id: string
  prompt_id: string | null
  profile_id: string
  account_id: string
  brand_id: string
  model_name: string
  model_provider: string
  storage_path: string
  meta_storage_path: string | null
  file_size_bytes: number
  content_hash: string
  prompt_text: string
  response_preview: string
  word_count: number
  response_time_ms: number | null
  token_usage: LLMResponse['token_usage']
  cost_estimate: number
  success: boolean
  error_message: string | null
  retry_count: number
  consumer_behavior: string | null
  created_at: string
}

export class LLMResponseStorage {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  // ── Path builders ─────────────────────────────────────────

  /**
   * Sanitise a single path segment — strip anything that could
   * enable directory traversal or break the folder hierarchy.
   */
  private sanitizePathSegment(segment: string): string {
    // Remove path separators, null bytes, .. traversal, and special chars
    return segment
      .replace(/[\x00-\x1f]/g, '') // control chars
      .replace(/\.\.+/g, '_')      // .. traversal
      .replace(/[\/\\:*?"<>|]/g, '_') // filesystem-unsafe chars
      .replace(/^\s+|\s+$/g, '')     // trim whitespace
      .slice(0, 255)                 // sane length limit
  }

  /**
   * Build the storage path for a response file.
   * All segments are sanitised to prevent path traversal.
   */
  buildResponsePath(
    accountId: string,
    brandId: string,
    runId: string,
    modelName: string,
    promptId: string
  ): string {
    const safeAccount = this.sanitizePathSegment(accountId)
    const safeBrand = this.sanitizePathSegment(brandId)
    const safeSim = this.sanitizePathSegment(runId)
    const safeModel = this.sanitizePathSegment(modelName)
    const safePrompt = this.sanitizePathSegment(promptId)
    return `${safeAccount}/${safeBrand}/${safeSim}/${safeModel}/${safePrompt}.md`
  }

  buildMetaPath(
    accountId: string,
    brandId: string,
    runId: string,
    modelName: string,
    promptId: string
  ): string {
    const safeAccount = this.sanitizePathSegment(accountId)
    const safeBrand = this.sanitizePathSegment(brandId)
    const safeSim = this.sanitizePathSegment(runId)
    const safeModel = this.sanitizePathSegment(modelName)
    const safePrompt = this.sanitizePathSegment(promptId)
    return `${safeAccount}/${safeBrand}/${safeSim}/${safeModel}/${safePrompt}.meta.json`
  }

  buildManifestPath(
    accountId: string,
    brandId: string,
    runId: string
  ): string {
    const safeAccount = this.sanitizePathSegment(accountId)
    const safeBrand = this.sanitizePathSegment(brandId)
    const safeSim = this.sanitizePathSegment(runId)
    return `${safeAccount}/${safeBrand}/${safeSim}/_manifest.json`
  }

  // ── Single-file operations ────────────────────────────────

  /**
   * Upload a single LLM response and its metadata to Storage,
   * then insert a row into `llm_response_files`.
   */
  async storeResponse(response: LLMResponse): Promise<ResponseFileRecord> {
    const content = response.raw_response
    const storagePath = this.buildResponsePath(
      response.account_id,
      response.brand_id,
      response.run_id,
      response.model_name,
      response.prompt_id
    )
    const metaPath = this.buildMetaPath(
      response.account_id,
      response.brand_id,
      response.run_id,
      response.model_name,
      response.prompt_id
    )

    // Upload response markdown
    const { error: uploadError } = await this.supabase.storage
      .from(BUCKET)
      .upload(storagePath, content, {
        contentType: 'text/markdown',
        upsert: true,
      })
    if (uploadError) {
      console.error(`❌ Storage upload failed for ${storagePath}:`, uploadError)
      throw uploadError
    }

    // Upload metadata JSON
    const meta: StoredResponseMeta = {
      token_usage: response.token_usage,
      cost_estimate: response.cost_estimate ?? 0,
      response_time_ms: response.response_time_ms ?? 0,
      consumer_behavior: response.consumer_behavior,
      system_prompt: response.system_prompt,
      processing_metadata: response.processing_metadata,
      extracted_citations: response.extracted_citations,
      model_provider: response.model_provider,
      created_at: response.created_at,
    }
    const { error: metaUploadError } = await this.supabase.storage
      .from(BUCKET)
      .upload(metaPath, JSON.stringify(meta, null, 2), {
        contentType: 'application/json',
        upsert: true,
      })
    if (metaUploadError) {
      console.warn(`⚠️ Meta upload failed for ${metaPath}:`, metaUploadError)
      // Non-fatal — the response file is the important one
    }

    const contentBytes = new TextEncoder().encode(content).length
    const contentHash = await this.hashContent(content)
    const wordCount = content.split(/\s+/).filter(Boolean).length

    const record: ResponseFileRecord = {
      run_id: response.run_id,
      prompt_id: response.prompt_id || null,
      profile_id: response.profile_id,
      account_id: response.account_id,
      brand_id: response.brand_id,
      model_name: response.model_name,
      model_provider: response.model_provider,
      storage_path: storagePath,
      meta_storage_path: metaUploadError ? null : metaPath,
      file_size_bytes: contentBytes,
      content_hash: contentHash,
      prompt_text: response.prompt_text,
      response_preview: content.slice(0, PREVIEW_LENGTH),
      word_count: wordCount,
      response_time_ms: response.response_time_ms ?? null,
      token_usage: response.token_usage ?? undefined,
      cost_estimate: response.cost_estimate ?? 0,
      success: response.success,
      error_message: response.error_message ?? null,
      retry_count: response.retry_count,
      consumer_behavior: response.consumer_behavior ?? null,
      created_at: response.created_at,
    }

    const { data, error: insertError } = await this.supabase
      .from('llm_response_files')
      .insert(record)
      .select('id')
      .single()

    if (insertError) {
      console.error(`❌ DB insert failed for ${storagePath}:`, insertError)
      throw insertError
    }

    record.id = data.id
    return record
  }

  // ── Batch operations ──────────────────────────────────────

  /**
   * Store multiple responses in parallel batches.
   * Returns the count of successfully stored responses.
   */
  async batchStoreResponses(responses: LLMResponse[]): Promise<{
    stored: number
    failed: number
    records: ResponseFileRecord[]
  }> {
    let stored = 0
    let failed = 0
    const records: ResponseFileRecord[] = []

    for (let i = 0; i < responses.length; i += BATCH_SIZE) {
      const batch = responses.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(r => this.storeResponse(r))
      )
      for (const result of results) {
        if (result.status === 'fulfilled') {
          stored++
          records.push(result.value)
        } else {
          failed++
          console.error('❌ Batch store item failed:', result.reason)
        }
      }
    }

    console.log(`💾 File storage: ${stored} stored, ${failed} failed`)
    return { stored, failed, records }
  }

  // ── Read operations ───────────────────────────────────────

  /**
   * Download the full response text for a single record.
   */
  async downloadResponse(storagePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .download(storagePath)
    if (error) {
      throw new Error(`Failed to download ${storagePath}: ${error.message}`)
    }
    return await data.text()
  }

  /**
   * Download the metadata JSON for a single record.
   */
  async downloadMeta(metaPath: string): Promise<StoredResponseMeta> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .download(metaPath)
    if (error) {
      throw new Error(`Failed to download meta ${metaPath}: ${error.message}`)
    }
    return JSON.parse(await data.text())
  }

  /**
   * Batch download response contents by storage paths.
   * Returns a Map of path → content.
   */
  async downloadBatch(storagePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>()
    for (let i = 0; i < storagePaths.length; i += BATCH_SIZE) {
      const batch = storagePaths.slice(i, i + BATCH_SIZE)
      const downloads = await Promise.allSettled(
        batch.map(async path => {
          const content = await this.downloadResponse(path)
          return { path, content }
        })
      )
      for (const result of downloads) {
        if (result.status === 'fulfilled') {
          results.set(result.value.path, result.value.content)
        }
      }
    }
    return results
  }

  /**
   * Get unanalysed response file records for the analysis engine.
   * Returns metadata rows — caller downloads content via downloadBatch.
   */
  async getUnanalysedResponses(
    brandId: string,
    accountId: string,
    limit = 50
  ): Promise<ResponseFileRecord[]> {
    const { data, error } = await this.supabase
      .from('llm_response_files')
      .select('*')
      .eq('brand_id', brandId)
      .eq('account_id', accountId)
      .eq('success', true)
      .is('last_analysed', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as ResponseFileRecord[]
  }

  /**
   * Mark responses as analysed after the analysis engine processes them.
   */
  async markAnalysed(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const { error } = await this.supabase
      .from('llm_response_files')
      .update({ last_analysed: new Date().toISOString() })
      .in('id', ids)
    if (error) {
      console.error('❌ Failed to mark responses as analysed:', error)
    }
  }

  // ── Manifest ──────────────────────────────────────────────

  /**
   * Generate and upload a manifest for a completed run run.
   */
  async writeManifest(
    accountId: string,
    brandId: string,
    runId: string,
    records: ResponseFileRecord[]
  ): Promise<void> {
    const models = [...new Set(records.map(r => r.model_name))]
    const prompts = [...new Set(records.map(r => r.prompt_text))]
    const totalCost = records.reduce((s, r) => s + (r.cost_estimate ?? 0), 0)

    const manifest: ManifestEntry = {
      run_id: runId,
      brand_id: brandId,
      account_id: accountId,
      models,
      prompt_count: prompts.length,
      response_count: records.length,
      total_cost: totalCost,
      created_at: records[0]?.created_at ?? new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }

    const path = this.buildManifestPath(accountId, brandId, runId)
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(path, JSON.stringify(manifest, null, 2), {
        contentType: 'application/json',
        upsert: true,
      })
    if (error) {
      console.warn(`⚠️ Manifest upload failed for ${path}:`, error)
    }
  }

  // ── Deduplication ─────────────────────────────────────────

  /**
   * Check for duplicate responses using content hash.
   * Returns IDs of existing records that match.
   */
  async findDuplicates(
    accountId: string,
    brandId: string,
    contentHashes: string[]
  ): Promise<Set<string>> {
    if (contentHashes.length === 0) return new Set()
    const { data } = await this.supabase
      .from('llm_response_files')
      .select('content_hash')
      .eq('account_id', accountId)
      .eq('brand_id', brandId)
      .in('content_hash', contentHashes)

    return new Set((data ?? []).map(r => r.content_hash))
  }

  // ── Listing / querying ────────────────────────────────────

  /**
   * List response file metadata for a brand (paginated).
   */
  async listByBrand(
    brandId: string,
    options?: { limit?: number; offset?: number; runId?: string }
  ): Promise<ResponseFileRecord[]> {
    let query = this.supabase
      .from('llm_response_files')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .range(
        options?.offset ?? 0,
        (options?.offset ?? 0) + (options?.limit ?? 50) - 1
      )
    if (options?.runId) {
      query = query.eq('run_id', options.runId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as ResponseFileRecord[]
  }

  /**
   * List response files by run (for the dashboard detail view).
   */
  async listByRun(runId: string): Promise<ResponseFileRecord[]> {
    const { data, error } = await this.supabase
      .from('llm_response_files')
      .select('*')
      .eq('run_id', runId)
      .order('model_name')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as ResponseFileRecord[]
  }

  // ── Cleanup ───────────────────────────────────────────────

  /**
   * Delete all files and metadata for a run.
   */
  async deleteRun(runId: string): Promise<void> {
    // Get all paths first
    const { data: records } = await this.supabase
      .from('llm_response_files')
      .select('storage_path, meta_storage_path')
      .eq('run_id', runId)

    if (records && records.length > 0) {
      const paths = records.flatMap(r =>
        [r.storage_path, r.meta_storage_path].filter(Boolean) as string[]
      )
      // Storage bulk delete
      if (paths.length > 0) {
        const { error } = await this.supabase.storage
          .from(BUCKET)
          .remove(paths)
        if (error) {
          console.error('❌ Storage delete failed:', error)
        }
      }
    }

    // Delete DB rows
    const { error } = await this.supabase
      .from('llm_response_files')
      .delete()
      .eq('run_id', runId)
    if (error) {
      console.error('❌ DB delete failed:', error)
    }
  }

  // ── Utilities ─────────────────────────────────────────────

  /**
   * SHA-256 hash of content string. Works in both Node.js and Edge runtimes.
   */
  private async hashContent(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}
