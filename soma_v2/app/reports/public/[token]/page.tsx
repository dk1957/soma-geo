"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { ExternalBrandVisibilityReportV4 } from '@/components/reports/external-brand-visibility-report-v4'
import { EmailCaptureGate } from '@/components/reports/email-capture-gate'
import { PilotBookingModal } from '@/components/external-report/pilot-booking-modal'

// Add logging to track component lifecycle
console.log('🔵 Public report page module loaded')

interface ExternalReportData {
  id: string
  title: string
  brand_name: string
  brand_id?: string
  description?: string
  executive_summary?: string
  key_metrics: {
    overall_score?: number
    visibility_score?: number
    mention_count?: number
    citation_count?: number
    competitor_count?: number
  }
  preview_content: any
  full_content?: any
  metrics_data?: any
  raw_data?: any
  requires_email_capture: boolean
  preview_section_count: number
  created_at: string
}

interface LeadFormData {
  email: string
  phone_number?: string
  full_name?: string
  company_name?: string
  job_title?: string
  company_size?: string
}

export default function PublicReportPage() {
  const params = useParams()
  const router = useRouter()
  const shareToken = params?.token as string

  console.log('🔵 Public report page rendered:', { shareToken, params })
  
  const [reportData, setReportData] = useState<ExternalReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEmailGate, setShowEmailGate] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [showPilotModal, setShowPilotModal] = useState(false)
  const [hasShownModal, setHasShownModal] = useState(false)
  const [timeOnPage, setTimeOnPage] = useState(0)
  const reportEndRef = useRef<HTMLDivElement>(null)
  
  const [visitorId] = useState(() => {
    // Generate a unique visitor ID for tracking
    return 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  })
  const [sessionId] = useState(() => {
    return 'session_' + Math.random().toString(36).substr(2, 9)
  })

  useEffect(() => {
    if (!shareToken) return

    // Check for stored access token (from previous email submission)
    const storedToken = localStorage.getItem(`report_access_${shareToken}`)
    if (storedToken) {
      setAccessToken(storedToken)
    }

    fetchReportData(storedToken)
    trackView('preview')
  }, [shareToken])

  // Time-based trigger for pilot modal (after 3 minutes of reading)
  useEffect(() => {
    if (hasShownModal || showEmailGate || !reportData) return
    
    const timer = setInterval(() => {
      setTimeOnPage(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [hasShownModal, showEmailGate, reportData])

  useEffect(() => {
    // Show modal after 3 minutes (180 seconds) of reading
    if (timeOnPage >= 180 && !hasShownModal && !showEmailGate) {
      const alreadyShown = localStorage.getItem(`pilot_modal_shown_${shareToken}`)
      if (!alreadyShown) {
        setShowPilotModal(true)
        setHasShownModal(true)
        localStorage.setItem(`pilot_modal_shown_${shareToken}`, 'true')
      }
    }
  }, [timeOnPage, hasShownModal, showEmailGate, shareToken])

  // Scroll-based trigger for pilot modal (when user reaches end of report)
  useEffect(() => {
    if (hasShownModal || showEmailGate || !reportData) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const alreadyShown = localStorage.getItem(`pilot_modal_shown_${shareToken}`)
            if (!alreadyShown) {
              // Small delay to ensure they've actually read the end
              setTimeout(() => {
                setShowPilotModal(true)
                setHasShownModal(true)
                localStorage.setItem(`pilot_modal_shown_${shareToken}`, 'true')
              }, 1000)
            }
          }
        })
      },
      { threshold: 0.5 } // Trigger when 50% of the end marker is visible
    )

    if (reportEndRef.current) {
      observer.observe(reportEndRef.current)
    }

    return () => observer.disconnect()
  }, [hasShownModal, showEmailGate, reportData, shareToken])

  const fetchReportData = async (token?: string | null) => {
    console.log('🔵 fetchReportData called for token:', shareToken)
    try {
      setLoading(true)
      
      // Use absolute URL for fetch to avoid issues in production/edge environments
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'https://www.withsoma.ai'
      
      // Add access token as query param if available
      const queryParams = token ? `?access_token=${token}` : ''
      const apiUrl = `${baseUrl}/api/reports/external/public/${shareToken}${queryParams}`
      console.log('🔵 Fetching from API URL:', apiUrl)
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('🔵 API Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status === 403 && errorData.requires_email_capture) {
          // Email capture required - show the gate with preview data if available
          if (errorData.preview_content || errorData.preview_only) {
            // Set preview data for background blur
            setReportData({
              id: errorData.id || '',
              title: errorData.title || 'Brand Visibility Report',
              brand_name: errorData.brand_name || 'Brand',
              brand_id: errorData.brand_id,
              description: errorData.description,
              executive_summary: errorData.executive_summary,
              key_metrics: errorData.key_metrics || {},
              preview_content: errorData.preview_content,
              requires_email_capture: true,
              preview_section_count: errorData.preview_section_count || 0,
              created_at: errorData.created_at || new Date().toISOString()
            })
          }
          setShowEmailGate(true)
          setLoading(false)
          return
        }
        
        if (response.status === 404) {
          setError('Report not found or has expired')
        } else if (response.status === 403) {
          setError('This report is no longer available')
        } else {
          setError('Failed to load report')
        }
        return
      }

      const data = await response.json()
      console.log('✅ Report data fetched successfully:', { id: data.id, title: data.title })
      setReportData(data)
      setShowEmailGate(false)
      
      // If we got full data without needing a token, set a special access token
      // to indicate authenticated access (prevents preview mode)
      if (!token && data.full_content) {
        setAccessToken('authenticated_user')
      }
    } catch (err) {
      console.error('Error fetching report:', err)
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailCaptureSuccess = (token: string) => {
    setAccessToken(token)
    setShowEmailGate(false)
    fetchReportData(token)
  }

  const trackView = async (section: string, duration?: number) => {
    // Only track on client side
    if (typeof window === 'undefined') return
    
    try {
      const baseUrl = window.location.origin 
        
      await fetch(`${baseUrl}/api/reports/external/track-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          share_token: shareToken,
          visitor_id: visitorId,
          session_id: sessionId,
          page_section: section,
          view_duration: duration || 0,
          ip_address: '', // Will be populated server-side
          user_agent: navigator.userAgent,
          referrer_url: document.referrer,
          device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browser: getBrowserName(),
          screen_resolution: `${screen.width}x${screen.height}`
        }),
      })
    } catch (error) {
      console.error('Error tracking view:', error)
      // Silently fail - don't block the user experience
    }
  }

  const handleLeadCapture = async (leadData: LeadFormData) => {
    try {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'https://www.withsoma.ai'
        
      const response = await fetch(`${baseUrl}/api/reports/external/capture-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          external_report_id: reportData?.id,
          share_token: shareToken,
          visitor_id: visitorId,
          session_id: sessionId,
          ...leadData,
          ip_address: '', // Will be populated server-side
          user_agent: navigator.userAgent,
          referrer_url: document.referrer,
          device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browser: getBrowserName(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit lead information')
      }

      // Track conversion
      trackView('lead_form', 0)
      
      return await response.json()
    } catch (error) {
      console.error('Error capturing lead:', error)
      throw error
    }
  }

  const handleViewTracking = (section: string, duration: number) => {
    trackView(section, duration)
  }

  const getBrowserName = (): string => {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Other'
  }

  // Show email gate if required
  if (showEmailGate) {
    return (
      <div className="relative min-h-screen">
        {/* Show actual report with partial visibility */}
        <div className="relative">
          {/* Report content - will be cut off */}
          <div className="relative" style={{ maxHeight: '70vh', overflow: 'hidden' }}>
            {reportData && (
              <ExternalBrandVisibilityReportV4
                report={reportData}
                isPublicView={true}
                // Don't pass publicAccessToken at all - this triggers preview mode
              />
            )}
            
            {/* Gradient fade at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none" />
          </div>
          
          {/* Bottom overlay with email capture */}
          <div className="sticky bottom-0 left-0 right-0 bg-black border-t border-gray-800 shadow-2xl">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <EmailCaptureGate
                reportTitle={reportData?.title || 'Brand Visibility Report'}
                brandName={reportData?.brand_name || 'Brand'}
                shareToken={shareToken}
                onSuccess={handleEmailCaptureSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Report</h2>
          <p className="text-gray-600">Please wait while we prepare your brand visibility analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Unavailable</h2>
            <p className="text-gray-600 mb-4">
              {error || 'The requested report could not be found.'}
            </p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact the person who shared this report with you.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <ExternalBrandVisibilityReportV4
        report={reportData}
        isPublicView={true}
        publicAccessToken={accessToken || undefined}
      />
      
      {/* Invisible marker at the end of the report for scroll detection */}
      <div ref={reportEndRef} className="h-1 w-full" />
      
      {/* Pilot booking modal */}
      <PilotBookingModal 
        isOpen={showPilotModal} 
        onClose={() => setShowPilotModal(false)} 
      />
    </>
  )
}