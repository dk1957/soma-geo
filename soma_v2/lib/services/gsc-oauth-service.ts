/**
 * Google Search Console OAuth Service
 * 
 * Handles OAuth 2.0 flow for Google Search Console integration
 * including token management, refresh, and API calls.
 */

import { createServiceClient } from '@/lib/supabase/server'

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3'

// Required scopes for GSC access
const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ')

export interface GSCTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface GSCSite {
  siteUrl: string
  permissionLevel: string
}

export interface GSCPerformanceData {
  clicks: number
  impressions: number
  ctr: number
  position: number
  date?: string
  query?: string
  page?: string
  country?: string
  device?: string
}

class GSCOAuthService {
  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || ''
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
    this.redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/integrations/gsc/callback`
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(brandId: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: GSC_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ brandId, customState: state })
    })

    return `${GOOGLE_OAUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GSCTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`)
    }

    return response.json()
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`)
    }

    return response.json()
  }

  /**
   * Get user's email from Google
   */
  async getUserEmail(accessToken: string): Promise<string> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    const data = await response.json()
    return data.email
  }

  /**
   * List all sites in GSC
   */
  async listSites(accessToken: string): Promise<GSCSite[]> {
    const response = await fetch(`${GSC_API_BASE}/sites`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to list sites: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.siteEntry || []
  }

  /**
   * Get search analytics for a site
   */
  async getSearchAnalytics(
    accessToken: string,
    siteUrl: string,
    options: {
      startDate: string
      endDate: string
      dimensions?: string[]
      rowLimit?: number
      startRow?: number
      dataState?: string
    }
  ): Promise<GSCPerformanceData[]> {
    const encodedSiteUrl = encodeURIComponent(siteUrl)
    
    const body: any = {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions || ['date'],
      rowLimit: options.rowLimit || 1000,
      startRow: options.startRow || 0,
      dataState: options.dataState || 'all'
    }

    const response = await fetch(
      `${GSC_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Search analytics query failed: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    return (data.rows || []).map((row: any) => ({
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      ...(options.dimensions?.includes('date') && { date: row.keys[0] }),
      ...(options.dimensions?.includes('query') && { query: row.keys[options.dimensions.indexOf('query')] }),
      ...(options.dimensions?.includes('page') && { page: row.keys[options.dimensions.indexOf('page')] }),
      ...(options.dimensions?.includes('country') && { country: row.keys[options.dimensions.indexOf('country')] }),
      ...(options.dimensions?.includes('device') && { device: row.keys[options.dimensions.indexOf('device')] })
    }))
  }

  /**
   * Inspect URL in GSC
   */
  async inspectUrl(
    accessToken: string,
    siteUrl: string,
    inspectionUrl: string
  ): Promise<any> {
    const response = await fetch(
      'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inspectionUrl,
          siteUrl
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`URL inspection failed: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  /**
   * List sitemaps submitted to GSC for a site
   */
  async listSitemaps(accessToken: string, siteUrl: string): Promise<{ path: string; lastSubmitted?: string; isPending: boolean; errors: number; warnings: number }[]> {
    const encodedSiteUrl = encodeURIComponent(siteUrl)
    const response = await fetch(`${GSC_API_BASE}/sites/${encodedSiteUrl}/sitemaps`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!response.ok) {
      console.error('Failed to list sitemaps:', await response.text())
      return []
    }

    const data = await response.json()
    return (data.sitemap || []).map((s: any) => ({
      path: s.path,
      lastSubmitted: s.lastSubmitted,
      isPending: s.isPending ?? false,
      errors: s.errors ?? 0,
      warnings: s.warnings ?? 0,
    }))
  }

  /**
   * Fetch and parse sitemap XML to extract URLs.
   * Handles sitemap index files (which point to other sitemaps).
   */
  async fetchSitemapUrls(siteUrl: string, maxUrls = 200): Promise<string[]> {
    // Derive base URL from GSC site URL
    let baseUrl = siteUrl
    if (baseUrl.startsWith('sc-domain:')) {
      baseUrl = `https://${baseUrl.replace('sc-domain:', '')}`
    }
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`
    }
    baseUrl = baseUrl.replace(/\/$/, '')

    const urls: string[] = []

    const parseSitemap = async (url: string, depth = 0): Promise<void> => {
      if (depth > 2 || urls.length >= maxUrls) return
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'SomaAI-Bot/1.0' },
          signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) return
        const text = await response.text()

        // Check if this is a sitemap index
        if (text.includes('<sitemapindex')) {
          const sitemapLocs = text.match(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)
          if (sitemapLocs) {
            for (const match of sitemapLocs) {
              if (urls.length >= maxUrls) break
              const loc = match.match(/<loc>([^<]+)<\/loc>/)
              if (loc?.[1]) await parseSitemap(loc[1].trim(), depth + 1)
            }
          }
          return
        }

        // Regular sitemap — extract <loc> entries
        const locMatches = text.match(/<loc>([^<]+)<\/loc>/g)
        if (locMatches) {
          for (const match of locMatches) {
            if (urls.length >= maxUrls) break
            const loc = match.match(/<loc>([^<]+)<\/loc>/)
            if (loc?.[1]) urls.push(loc[1].trim())
          }
        }
      } catch {
        // Silently ignore fetch failures
      }
    }

    await parseSitemap(`${baseUrl}/sitemap.xml`)

    // If no sitemap.xml found, try common alternatives
    if (urls.length === 0) {
      for (const alt of ['/sitemap_index.xml', '/sitemap-index.xml', '/sitemap1.xml']) {
        await parseSitemap(`${baseUrl}${alt}`)
        if (urls.length > 0) break
      }
    }

    return urls.slice(0, maxUrls)
  }

  /**
   * Get search analytics by country for a site
   */
  async getCountryBreakdown(
    accessToken: string,
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<{ country: string; clicks: number; impressions: number }[]> {
    try {
      const data = await this.getSearchAnalytics(accessToken, siteUrl, {
        startDate,
        endDate,
        dimensions: ['country'],
        rowLimit: 25
      })
      return data.map(d => ({
        country: d.country || 'Unknown',
        clicks: d.clicks,
        impressions: d.impressions
      })).sort((a, b) => b.clicks - a.clicks)
    } catch {
      return []
    }
  }

  /**
   * Get search analytics by device for a site
   */
  async getDeviceBreakdown(
    accessToken: string,
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<{ device: string; clicks: number; impressions: number; ctr: number; position: number }[]> {
    try {
      const data = await this.getSearchAnalytics(accessToken, siteUrl, {
        startDate,
        endDate,
        dimensions: ['device'],
        rowLimit: 10
      })
      return data.map(d => ({
        device: d.device || 'Unknown',
        clicks: d.clicks,
        impressions: d.impressions,
        ctr: d.ctr,
        position: d.position
      })).sort((a, b) => b.clicks - a.clicks)
    } catch {
      return []
    }
  }

  /**
   * Request URL indexing
   */
  async requestIndexing(accessToken: string, url: string): Promise<void> {
    const response = await fetch(
      'https://indexing.googleapis.com/v3/urlNotifications:publish',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          type: 'URL_UPDATED'
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Indexing request failed: ${error.error?.message || 'Unknown error'}`)
    }
  }

  /**
   * Save GSC connection to database
   */
  async saveConnection(
    brandId: string,
    tokens: GSCTokens,
    selectedSite?: string
  ): Promise<void> {
    const supabase = createServiceClient()

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Keep a single active connection per brand by clearing any previous rows.
    await supabase
      .from('gsc_connections')
      .delete()
      .eq('brand_id', brandId)

    const { error } = await supabase
      .from('gsc_connections')
      .insert({
        brand_id: brandId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        site_url: selectedSite || 'pending_selection',
        is_active: true,
        last_sync_status: 'success',
        sync_error: null,
        scopes: tokens.scope?.split(' ') || [],
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Failed to save GSC connection: ${error.message}`)
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(brandId: string): Promise<string | null> {
    const supabase = createServiceClient()

    const { data: connection, error } = await supabase
      .from('gsc_connections')
      .select('*')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !connection) {
      return null
    }

    // Check if token is expired (with 5 min buffer)
    if (!connection.token_expires_at) {
      return connection.access_token
    }

    const expiresAt = new Date(connection.token_expires_at)
    const now = new Date()
    const bufferMs = 5 * 60 * 1000 // 5 minutes

    if (expiresAt.getTime() - bufferMs > now.getTime()) {
      return connection.access_token
    }

    // Token expired, refresh it
    try {
      const newTokens = await this.refreshAccessToken(connection.refresh_token)
      
      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

      await supabase
        .from('gsc_connections')
        .update({
          access_token: newTokens.access_token,
          token_expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('brand_id', brandId)

      return newTokens.access_token
    } catch (err) {
      console.error('Failed to refresh GSC token:', err)
      
      // Mark connection as inactive
      await supabase
        .from('gsc_connections')
        .update({
          is_active: false,
          last_sync_status: 'failed',
          sync_error: err instanceof Error ? err.message : 'token_refresh_failed',
          updated_at: new Date().toISOString()
        })
        .eq('brand_id', brandId)

      return null
    }
  }

  /**
   * Disconnect GSC for a brand
   */
  async disconnect(brandId: string): Promise<void> {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('gsc_connections')
      .update({
        is_active: false,
        sync_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('brand_id', brandId)

    if (error) {
      throw new Error(`Failed to disconnect GSC: ${error.message}`)
    }
  }

  /**
   * Sync GSC performance data to database
   */
  async fetchAllSearchAnalytics(
    accessToken: string,
    siteUrl: string,
    startDate: string,
    endDate: string,
    dimensions: string[]
  ): Promise<any[]> {
    const rows: any[] = []
    let startRow = 0
    const rowLimit = 5000

    while (true) {
      const batch = await this.getSearchAnalytics(accessToken, siteUrl, {
        startDate,
        endDate,
        dimensions,
        rowLimit,
        startRow
      })

      if (!batch.length) {
        break
      }

      rows.push(...batch)

      if (batch.length < rowLimit) {
        break
      }

      startRow += rowLimit
    }

    return rows
  }

  async syncPerformanceData(brandId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken(brandId)
    if (!accessToken) {
      throw new Error('No valid GSC connection')
    }

    const supabase = createServiceClient()

    // Get connection with site URL and ID
    const { data: connection } = await supabase
      .from('gsc_connections')
      .select('id, site_url')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .single()

    if (!connection?.site_url || connection.site_url === 'pending_selection') {
      throw new Error('No site URL configured - please select a property first')
    }

    // Determine the sync window: incremental after the last synced date, otherwise pull the last 180 days.
    // Always re-fetch at least the last 4 days to capture fresh/preliminary data updates
    // (GSC data has a ~2-3 day lag for finalized data, but fresh data changes frequently)
    const { data: lastRow } = await supabase
      .from('gsc_performance_data')
      .select('date')
      .eq('gsc_connection_id', connection.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const now = new Date()
    const endDate = now.toISOString().split('T')[0]
    const freshWindowStart = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)

    let startDateObj: Date
    if (lastRow?.date) {
      // Incremental: start from last synced date + 1, but always go back at least 4 days
      const incrementalStart = new Date(new Date(lastRow.date).getTime() + 24 * 60 * 60 * 1000)
      startDateObj = incrementalStart < freshWindowStart ? incrementalStart : freshWindowStart
    } else {
      startDateObj = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    }

    const startDate = startDateObj.toISOString().split('T')[0]

    const ranges: Array<{ startDate: string; endDate: string }> = []
    let rangeStart = new Date(startDateObj)
    const maxRangeDays = 90

    while (rangeStart <= now) {
      const rangeEnd = new Date(rangeStart)
      rangeEnd.setDate(rangeStart.getDate() + maxRangeDays - 1)
      if (rangeEnd > now) {
        rangeEnd.setTime(now.getTime())
      }

      ranges.push({
        startDate: rangeStart.toISOString().split('T')[0],
        endDate: rangeEnd.toISOString().split('T')[0]
      })

      rangeStart = new Date(rangeEnd)
      rangeStart.setDate(rangeStart.getDate() + 1)
    }

    // --- 1) Date-level totals: ALWAYS fetch for the full historical range ---
    // This is cheap (one row per day, ~180 rows max) and ensures accurate chart data.
    // We fetch from the earliest existing data (or 180 days) regardless of incremental window.
    const { data: earliestRow } = await supabase
      .from('gsc_performance_data')
      .select('date')
      .eq('gsc_connection_id', connection.id)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()

    const fullStartDate = earliestRow?.date
      ? earliestRow.date
      : new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Build ranges for the full historical period
    const fullRanges: Array<{ startDate: string; endDate: string }> = []
    let fullRangeStart = new Date(fullStartDate)
    while (fullRangeStart <= now) {
      const fullRangeEnd = new Date(fullRangeStart)
      fullRangeEnd.setDate(fullRangeStart.getDate() + maxRangeDays - 1)
      if (fullRangeEnd > now) fullRangeEnd.setTime(now.getTime())
      fullRanges.push({
        startDate: fullRangeStart.toISOString().split('T')[0],
        endDate: fullRangeEnd.toISOString().split('T')[0]
      })
      fullRangeStart = new Date(fullRangeEnd)
      fullRangeStart.setDate(fullRangeStart.getDate() + 1)
    }

    const dateTotalRows: any[] = []
    for (const range of fullRanges) {
      const dateTotals = await this.fetchAllSearchAnalytics(
        accessToken,
        connection.site_url,
        range.startDate,
        range.endDate,
        ['date']
      )
      dateTotalRows.push(...dateTotals)
    }

    // Delete ALL existing date-level aggregate rows and re-insert fresh ones
    await supabase
      .from('gsc_performance_data')
      .delete()
      .eq('gsc_connection_id', connection.id)
      .is('query', null)
      .is('page_url', null)

    // --- 2) Per-query-per-page data: incremental (only recent window) ---
    const allRows: any[] = []
    for (const range of ranges) {
      const rangeRows = await this.fetchAllSearchAnalytics(
        accessToken,
        connection.site_url,
        range.startDate,
        range.endDate,
        ['date', 'query', 'page']
      )
      allRows.push(...rangeRows)
    }

    const startCleanupDate = startDate
    const endCleanupDate = endDate

    // Remove overlapping per-query rows for the incremental window only
    await supabase
      .from('gsc_performance_data')
      .delete()
      .eq('gsc_connection_id', connection.id)
      .not('query', 'is', null)
      .gte('date', startCleanupDate)
      .lte('date', endCleanupDate)

    const records = allRows.map(row => ({
      gsc_connection_id: connection.id,
      brand_id: brandId,
      date: row.date,
      query: row.query || null,
      page_url: row.page || null,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      synced_at: new Date().toISOString()
    }))

    // Date-level aggregate rows (query=null, page_url=null) — accurate totals
    const dateTotalRecords = dateTotalRows.map(row => ({
      gsc_connection_id: connection.id,
      brand_id: brandId,
      date: row.date,
      query: null,
      page_url: null,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      synced_at: new Date().toISOString()
    }))

    // Insert date-level totals first (already cleaned above)
    if (dateTotalRecords.length > 0) {
      for (let i = 0; i < dateTotalRecords.length; i += 500) {
        const batch = dateTotalRecords.slice(i, i + 500)
        const { error } = await supabase.from('gsc_performance_data').insert(batch)
        if (error) {
          console.error('Error inserting GSC date-level batch:', error)
        }
      }
    }

    // Insert per-query rows
    if (records.length > 0) {
      for (let i = 0; i < records.length; i += 500) {
        const batch = records.slice(i, i + 500)
        const { error } = await supabase.from('gsc_performance_data').insert(batch)
        if (error) {
          console.error('Error inserting GSC batch:', error)
        }
      }
    }

    await supabase
      .from('gsc_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        sync_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('brand_id', brandId)
  }
}

export const gscOAuthService = new GSCOAuthService()
