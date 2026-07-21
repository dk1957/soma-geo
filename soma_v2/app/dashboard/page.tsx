"use client"

// Force dynamic rendering to prevent SSR issues with client-side auth
export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo, useCallback } from "react"
import { useBrand } from "@/lib/contexts/brand-context"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { useReportData } from "@/lib/hooks/useReportData"
import { useDashboardRefresh } from "@/lib/hooks/useDashboardRefresh"
import { useActiveRun } from "@/lib/hooks/useActiveRun"
import { useUser } from "@clerk/nextjs"
import { 
  AnalyticsChartDashboard,
  IndustryRanking,
  RecentBrandMentions,
  SourcesUsage,
  BrandTopicHeatmap,
  StrategicInsights,
} from "@/components/dashboard/overview"
import { AlertTriangle } from "lucide-react"
import { WelcomePopup } from "@/components/layout/welcome-popup"
import { RunProgressDialog } from "@/components/ui/run-progress-dialog"
import { type FilterOptions } from "@/components/dashboard/overview/analytics-filters"

export default function DashboardPage() {
  const { currentBrand, currentWorkspace, isLoading: brandLoading, userBrands } = useBrand()
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showRunDialog, setShowRunDialog] = useState(false)
  
  // Dashboard-wide filter state (lifted from AnalyticsChartDashboard)
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
      to: new Date().toLocaleDateString('en-CA') // local timezone YYYY-MM-DD
    },
    promptType: 'all',
    aiPlatforms: [],
    competitorBenchmark: false,
    selectedCompetitors: [],
    selectedModel: undefined
  })
  
  // Convert date range to period for API
  const period = useMemo((): '7d' | '30d' | '90d' | 'all' => {
    if (!filters.dateRange.from || !filters.dateRange.to) return '30d'
    const from = new Date(filters.dateRange.from)
    const to = new Date(filters.dateRange.to)
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) return '7d'
    if (diffDays <= 30) return '30d'
    if (diffDays <= 90) return '90d'
    return 'all'
  }, [filters.dateRange])
  
  // Get selected models for API filtering
  const selectedModels = useMemo(() => {
    return filters.aiPlatforms.length > 0 ? filters.aiPlatforms : undefined
  }, [filters.aiPlatforms])
  
  // Reset filters when brand changes
  useEffect(() => {
    setFilters({
      dateRange: {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
        to: new Date().toLocaleDateString('en-CA') // local timezone YYYY-MM-DD
      },
      promptType: 'all',
      aiPlatforms: [],
      competitorBenchmark: false,
      selectedCompetitors: [],
      selectedModel: undefined
    })
  }, [currentBrand?.id])
  
  // Use the same data hook as external report with filter parameters
  const { data: reportData, isLoading: dataLoading, error: dataError } = useReportData({
    reportId: currentBrand?.id || '',
    period,
    modelNames: selectedModels,
    includeCompetitors: true,
    autoRefresh: false
  })

  // Auto-refresh dashboard when pipeline completes (extraction + aggregation)
  useDashboardRefresh(currentBrand?.id)

  // Detect if an LLM run is in progress for this brand
  const isAnalyzing = useActiveRun(currentBrand?.id)

  // Check user authentication with Clerk - redirect if not signed in
  useEffect(() => {
    if (clerkLoaded && !isSignedIn) {
      router.push('/signin')
    }
  }, [clerkLoaded, isSignedIn, router])

  // Check for first-time user and show welcome popup + run dialog
  useEffect(() => {
    // Check URL parameter for onboarding completion
    const onboardingComplete = searchParams.get('onboarding_complete')
    const runStarted = searchParams.get('run_started')
    
    if (onboardingComplete === 'true') {
      // Check if we've shown the welcome popup before
      const hasSeenWelcome = localStorage.getItem('soma_welcome_shown')
      
      if (!hasSeenWelcome) {
        setShowWelcomePopup(true)
        localStorage.setItem('soma_welcome_shown', 'true')
        
        // Clean up URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
    
    // Show run dialog if run just started
    if (runStarted === 'true') {
      const hasSeenRun = sessionStorage.getItem('soma_run_dialog_shown')
      
      if (!hasSeenRun) {
        setShowRunDialog(true)
        sessionStorage.setItem('soma_run_dialog_shown', 'true')
        
        // Clean up URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
        
        // Refresh notification bell after a short delay to pick up the "running" notification
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('notificationRefresh'))
        }, 3000)
      }
    }
  }, [searchParams])

  // Loading state
  if (brandLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-6">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-sm font-medium">Loading your AI visibility insights...</p>
        </div>
      </div>
    )
  }

  // No brand selected state - only check for brand, not workspace
  if (!currentBrand) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-6 max-w-md">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-black">No Brand Selected</h2>
          <p className="text-gray-600">Please create or select a brand to view analytics and insights.</p>
          <Button 
            onClick={() => router.push('/onboarding')} 
            className="mt-6 bg-black text-white hover:bg-gray-800 border-0"
          >
            Get Started
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Welcome Popup for First-Time Users */}
      <WelcomePopup 
        open={showWelcomePopup}
        onClose={() => setShowWelcomePopup(false)}
        brandName={currentBrand?.name}
      />
      
      {/* Run Progress Dialog for New Users */}
      <RunProgressDialog 
        open={showRunDialog}
        onOpenChange={setShowRunDialog}
        estimatedTimeMinutes={5}
        brandId={currentBrand?.id}
      />
      
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Main Analytics Chart with Filters */}
          <AnalyticsChartDashboard 
            brandId={currentBrand.id} 
            dateRange={period}
            reportData={reportData}
            isLoading={dataLoading || isAnalyzing}
            error={dataError}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* AI Strategic Insights — right after the chart */}
          <StrategicInsights brandId={currentBrand.id} isAnalyzing={isAnalyzing} />

          {/* Industry Ranking */}
          <IndustryRanking 
            brandId={currentBrand.id}
            reportData={reportData}
            isAnalyzing={isAnalyzing}
          />

          {/* Recent Brand Mentions */}
          <RecentBrandMentions 
            brandId={currentBrand.id}
            reportData={reportData}
            filters={filters}
            isAnalyzing={isAnalyzing}
          />

          {/* Sources Usage */}
          <SourcesUsage brandId={currentBrand.id} reportData={reportData} isAnalyzing={isAnalyzing} />

          {/* Brand-Topic Heatmap */}
          <BrandTopicHeatmap 
            brandId={currentBrand.id}
            reportData={reportData}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </div>
    </>
  )
}
