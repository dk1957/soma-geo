"use client"

/**
 * External Report Header Component
 * 
 * Sticky header matching prompt detail page design with:
 * - Back button navigation
 * - Report title and metadata
 * - Engagement metrics (shares, views)
 * - Classification and timestamp badges
 * 
 * Styling: White bg, border-b, gray-600 links with hover:gray-900
 */

import { ArrowLeft, Clock, Users, Eye, Link2, Copy, Check, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import ShareReportDialog from "@/components/reports/share-report-dialog"

interface HeaderProps {
  reportId: string
  title: string
  description?: string
  classification?: string
  generatedAt: string
  shares?: number
  views?: number
  uniqueViews?: number
  emailCaptures?: number
  conversionRate?: number
  shareUrl?: string
  brandName?: string
  brandLogo?: string  // URL to brand logo
  onShareCreated?: () => void
  isPublicView?: boolean  // true for public shared reports, false for dashboard view
}

export function Header({
  reportId,
  title,
  description,
  classification,
  generatedAt,
  shares = 0,
  views = 0,
  uniqueViews,
  emailCaptures,
  conversionRate,
  shareUrl,
  brandName = 'Brand',
  brandLogo,
  onShareCreated,
  isPublicView = false,
}: HeaderProps) {
  const [copied, setCopied] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const copyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Format timestamp - show relative time for recent reports
  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 24) {
      if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60))
        return minutes < 1 ? 'Just now' : `${minutes}m ago`
      }
      return `${hours}h ago`
    }
    
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Get brand initials for typographic logo
  const getBrandInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Public View - Executive-style header with dark gradient
  if (isPublicView) {
    return (
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-6 py-5">
          {/* Brand/Report Title Section */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              {/* Brand Logo - Use actual logo or typographic fallback */}
              {brandLogo && !logoError ? (
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-10 w-10 rounded-lg object-cover shadow-lg bg-white"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-gray-900">
                    {getBrandInitials(brandName)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {title}
                </h1>
                {description && (
                  <p className="text-gray-300 text-xs mt-0.5">{description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Bar */}
          <div className="flex items-center justify-between border-t border-gray-700 pt-3">
            <div className="flex items-center gap-4">
              {/* Timestamp */}
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Generated {formatTime(generatedAt)}</span>
              </div>

              {/* Classification */}
              {classification && (
                <>
                  <div className="h-4 w-px bg-gray-600" />
                  <Badge variant="outline" className="capitalize border-gray-600 text-gray-200">
                    {classification}
                  </Badge>
                </>
              )}
            </div>

            {/* Executive Information */}
            <div className="flex items-center gap-4">
              {/* Brand Name */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300">Prepared for</span>
                <span className="text-sm font-semibold text-white">{brandName}</span>
              </div>

              <div className="h-4 w-px bg-gray-600" />

              {/* Report Type */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">AI Visibility Analysis powered by</span>
                <span className="text-sm font-semibold text-orange-400"> <a href="https://withsoma.ai" target="_blank" rel="noopener noreferrer">Soma AI</a> </span>
              </div>

              {/* Share Link - Show when available */}
              {shareUrl && (
                <>
                  <div className="h-4 w-px bg-gray-600" />
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <Link2 className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-mono text-orange-200 max-w-[180px] truncate">
                      {shareUrl.replace(/^https?:\/\//, '')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-orange-500/20"
                      onClick={copyShareLink}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-orange-300" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard View - Simple header similar to prompt details page
  return (
    <>
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/reports"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Back to Reports</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center shadow-sm">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[50vw]">{title}</p>
                    {classification && (
                      <Badge className="bg-gray-100 text-gray-800 capitalize">
                        {classification}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Brand Visibility Report • {formatTime(generatedAt)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1.5">
                <Eye className="h-3 w-3" />
                {views.toLocaleString()} {views === 1 ? 'view' : 'views'}
              </Badge>
              {uniqueViews !== undefined && (
                <Badge variant="outline" className="gap-1.5">
                  <Users className="h-3 w-3" />
                  {uniqueViews.toLocaleString()} unique
                </Badge>
              )}
              {emailCaptures !== undefined && emailCaptures > 0 && (
                <Badge variant="outline" className="gap-1.5 text-green-700 border-green-300 bg-green-50">
                  <Users className="h-3 w-3" />
                  {emailCaptures.toLocaleString()} leads
                </Badge>
              )}
              {conversionRate !== undefined && conversionRate > 0 && (
                <Badge variant="outline" className="gap-1.5 text-blue-700 border-blue-300 bg-blue-50">
                  {conversionRate.toFixed(1)}% conv.
                </Badge>
              )}
              <ShareReportDialog
                reportId={reportId}
                reportTitle={title}
                brandName={brandName}
                onExternalReportsChange={onShareCreated}
                trigger={
                  <Button 
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Report
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
