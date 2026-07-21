import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Client-safe version of BrandReportingService for use in browser/client components
 * This version uses the client-side Supabase instance and API calls
 */
export class ClientBrandReportingService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Generate report from run using client-safe API calls
   */
  async generateReportFromRun(runId: string, brandId: string, options: any = {}) {
    try {
      console.log('🚀 Generating report via client API...')
      
      const reportResponse = await fetch('/api/reports/generate/from-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          runId: runId,
          brandId: brandId,
          options: options
        })
      })

      if (!reportResponse.ok) {
        throw new Error(`Report generation failed: ${reportResponse.status}`)
      }

      const result = await reportResponse.json()
      return result.data

    } catch (error) {
      console.error('❌ Client report generation failed:', error)
      throw error
    }
  }

  /**
   * Generate brand visibility report using client API
   */
  async generateBrandVisibilityReport(brandId: string, userId: string, filters: any = {}) {
    try {
      const reportResponse = await fetch('/api/reports/generate/brand-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: brandId,
          userId: userId,
          filters: filters
        })
      })

      if (!reportResponse.ok) {
        throw new Error(`Visibility report failed: ${reportResponse.status}`)
      }

      const result = await reportResponse.json()
      return result.data

    } catch (error) {
      console.error('❌ Client visibility report failed:', error)
      throw error
    }
  }
}