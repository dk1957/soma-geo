import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/reporting/[id]/export
 * Export a report in various formats (PDF, HTML, DOCX, JSON)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()
    const { id } = await params
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')

    // For service client, we use brand-based access control
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    const { 
      format = 'pdf', 
      include_charts = true, 
      include_raw_data = false, 
      custom_branding = false 
    } = body

    // Validate format
    if (!['pdf', 'html', 'docx', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
    }

    // Get the report with all sections, filtering by brand_id for access control
    const { data: report, error: fetchError } = await supabase
      .from('brand_reports')
      .select(`
        *,
        brands!inner(id, name, logo_url)
      `)
      .eq('id', id)
      .eq('brand_id', brandId)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Separately fetch report sections (optional)
    let reportSections: any[] = []
    try {
      const { data: sections } = await supabase
        .from('report_sections')
        .select(`
          id,
          section_type,
          section_order,
          title,
          content,
          charts_data,
          tables_data,
          insights,
          is_visible
        `)
        .eq('report_id', id)
        .order('section_order')
      
      reportSections = sections || []
    } catch (sectionsError) {
      console.warn('Could not fetch report sections for export:', sectionsError)
      // Continue without sections
    }

    // Add sections to the report object
    const reportWithSections = {
      ...report,
      report_sections: reportSections
    }

    // Create export record (without user_id since we're using service client)
    const { data: exportRecord, error: exportError } = await supabase
      .from('report_exports')
      .insert({
        report_id: id,
        export_format: format,
        include_charts,
        include_raw_data,
        custom_branding,
        status: 'processing'
      })
      .select()
      .single()

    if (exportError) {
      console.error('Error creating export record:', exportError)
      return NextResponse.json({ error: 'Failed to create export' }, { status: 500 })
    }

    try {
      let exportedData: any
      let contentType: string
      let filename: string

      switch (format) {
        case 'json':
          exportedData = {
            report: {
              ...reportWithSections,
              export_metadata: {
                exported_at: new Date().toISOString(),
                export_id: exportRecord.id,
                include_charts,
                include_raw_data,
                custom_branding
              }
            }
          }
          contentType = 'application/json'
          filename = `${reportWithSections.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
          break

        case 'html':
          exportedData = generateHTMLReport(reportWithSections, { include_charts, include_raw_data, custom_branding })
          contentType = 'text/html'
          filename = `${reportWithSections.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.html`
          break

        case 'pdf':
          // For now, return HTML that can be converted to PDF on the client side
          exportedData = generateHTMLReport(reportWithSections, { include_charts, include_raw_data, custom_branding, forPDF: true })
          contentType = 'text/html'
          filename = `${reportWithSections.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.html`
          break

        case 'docx':
          // For now, return structured data that can be converted to DOCX
          exportedData = generateDocxData(reportWithSections, { include_charts, include_raw_data, custom_branding })
          contentType = 'application/json'
          filename = `${reportWithSections.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
          break

        default:
          throw new Error('Unsupported format')
      }

      // Update export record with success
      await supabase
        .from('report_exports')
        .update({
          status: 'completed',
          file_size: JSON.stringify(exportedData).length
        })
        .eq('id', exportRecord.id)

      // Update report export count
      await supabase
        .from('brand_reports')
        .update({
          export_count: (report.export_count || 0) + 1
        })
        .eq('id', id)

      // Return the exported data
      return new NextResponse(
        format === 'json' ? JSON.stringify(exportedData, null, 2) : exportedData,
        {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Export-ID': exportRecord.id
          }
        }
      )

    } catch (exportProcessingError) {
      console.error('Export processing error:', exportProcessingError)
      
      // Update export record with error
      await supabase
        .from('report_exports')
        .update({
          status: 'failed',
          error_message: exportProcessingError instanceof Error ? exportProcessingError.message : 'Unknown error'
        })
        .eq('id', exportRecord.id)

      return NextResponse.json({ error: 'Export processing failed' }, { status: 500 })
    }

  } catch (error) {
    console.error('Export report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateHTMLReport(report: any, options: { include_charts: boolean, include_raw_data: boolean, custom_branding: boolean, forPDF?: boolean }) {
  const { include_charts, include_raw_data, custom_branding, forPDF = false } = options
  
  const styles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
      .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
      .title { color: #1f2937; font-size: 2.5em; margin: 0; }
      .subtitle { color: #6b7280; font-size: 1.2em; margin: 10px 0 0 0; }
      .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
      .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
      .metric-value { font-size: 2em; font-weight: bold; color: #3b82f6; }
      .metric-label { color: #64748b; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.05em; }
      .section { margin: 40px 0; }
      .section-title { color: #1f2937; font-size: 1.5em; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
      .insight-item { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0; }
      .recommendation { background: #fefce8; border-left: 4px solid #eab308; padding: 15px; margin: 15px 0; border-radius: 4px; }
      .recommendation-title { font-weight: bold; color: #92400e; margin-bottom: 8px; }
      .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.9em; }
      .brand-score { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
      @media print { body { margin: 0; padding: 15px; } .metric-grid { grid-template-columns: repeat(2, 1fr); } }
    </style>
  `

  const formatScore = (score: number | undefined) => score ? score.toFixed(1) : 'N/A'
  
  const sectionsHTML = report.report_sections
    ?.filter((section: any) => section.is_visible)
    ?.sort((a: any, b: any) => a.section_order - b.section_order)
    ?.map((section: any) => `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div>
          ${section.content?.content ? `<p>${section.content.content}</p>` : ''}
          ${include_raw_data && section.content?.data ? `<pre style="background: #f1f5f9; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 0.85em;">${JSON.stringify(section.content.data, null, 2)}</pre>` : ''}
        </div>
      </div>
    `).join('') || ''

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${report.title} - AI Discoverability Report</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1 class="title">${report.title}</h1>
        <p class="subtitle">${report.brand_name} • ${new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${report.ldi_score ? `<div style="margin-top: 15px;"><span class="brand-score">LDI Score: ${formatScore(report.ldi_score)}/100</span></div>` : ''}
      </div>

      ${report.executive_summary ? `
        <div class="section">
          <h2 class="section-title">Executive Summary</h2>
          <p style="font-size: 1.1em; line-height: 1.8;">${report.executive_summary}</p>
        </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">Key Performance Metrics</h2>
        <div class="metric-grid">
          ${report.ldi_score ? `
            <div class="metric-card">
              <div class="metric-label">LDI Score</div>
              <div class="metric-value">${formatScore(report.ldi_score)}/100</div>
            </div>
          ` : ''}
          ${report.visibility_score ? `
            <div class="metric-card">
              <div class="metric-label">Visibility Score</div>
              <div class="metric-value">${formatScore(report.visibility_score)}/100</div>
            </div>
          ` : ''}
          ${report.mention_rate !== undefined ? `
            <div class="metric-card">
              <div class="metric-label">Mention Rate</div>
              <div class="metric-value">${formatScore(report.mention_rate)}%</div>
            </div>
          ` : ''}
          <div class="metric-card">
            <div class="metric-label">Citations Found</div>
            <div class="metric-value">${report.citation_count || 0}</div>
          </div>
        </div>
      </div>

      ${report.key_findings && report.key_findings.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Key Findings</h2>
          ${report.key_findings.map((finding: string) => `<div class="insight-item">✓ ${finding}</div>`).join('')}
        </div>
      ` : ''}

      ${report.recommendations && report.recommendations.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Strategic Recommendations</h2>
          ${report.recommendations.map((rec: any) => `
            <div class="recommendation">
              <div class="recommendation-title">${rec.title} (${rec.priority?.toUpperCase()} PRIORITY)</div>
              <div>${rec.description}</div>
              ${rec.impact && rec.effort ? `<div style="margin-top: 8px; font-size: 0.9em; color: #6b7280;">Impact: ${rec.impact} • Effort: ${rec.effort}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${sectionsHTML}

      <div class="footer">
        <p><strong>Report Generated by Soma AI Discoverability Platform</strong></p>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US')}</p>
        ${custom_branding ? '<p>Custom branding and analysis by your marketing team</p>' : ''}
      </div>
    </body>
    </html>
  `
}

function generateDocxData(report: any, options: any) {
  // Return structured data that can be used to generate a DOCX file
  return {
    title: report.title,
    brand_name: report.brand_name,
    created_at: report.created_at,
    executive_summary: report.executive_summary,
    metrics: {
      ldi_score: report.ldi_score,
      visibility_score: report.visibility_score,
      mention_rate: report.mention_rate,
      citation_count: report.citation_count
    },
    key_findings: report.key_findings || [],
    recommendations: report.recommendations || [],
    sections: report.report_sections || [],
    export_options: options
  }
}