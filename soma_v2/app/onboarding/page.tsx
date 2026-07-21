"use client"

import { useState, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { OnboardingInput, OnboardingTextarea, OnboardingSelect, OnboardingDropdownTrigger } from "@/components/ui/onboarding-form-fields"
import { useToast } from "@/components/layout/notification-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import { promptCache } from "@/lib/cache"
import { OnboardingStateCache } from "@/lib/utils/storage-cache"
import { CacheManager } from "@/lib/utils/cache-manager"
import {
  getUserOnboardingState,
  updateOnboardingStep,
  startOnboarding,
  completeOnboarding,
  getUserJourneyState,
  getCurrentUserId,
  OnboardingStatus
} from "@/lib/utils/onboarding"
import { Building, Building2, User, ArrowRight, ArrowLeft, Search, X, Plus, LogOut, ChevronDown, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import BrandVisibilityAuditReport, { OnboardingReportPreview } from "@/components/reports/brand-visibility-audit-report"
import { useCountries } from "@/lib/hooks/use-countries"
import LLMRunClient from "@/lib/services/llm-run-client"
import { cleanResponseForReport } from "@/lib/utils/text-cleanup"
import RawResultsTable from "@/components/ui/raw-results-table"
import { InlineAIProgress } from "@/components/ui/inline-ai-progress"
import {
  UserTypeSelection,
  OrganizationDetailsStep,
  BrandCompanyDetailsStep,
  BrandSetupStep,
  BusinessContextStep
} from "@/components/auth/onboarding"

type UserType = "agency" | "inhouse" | null
type Step = "user-type" | "organization-details" | "brand-company-details" | "brand-setup" | "business-context" | "prompts"

interface ValidationError {
  field: string
  message: string
}

// Form data validation function
const validateFormData = (formData: any, userType: UserType, step?: Step): ValidationError[] => {
  const errors: ValidationError[] = []

  // Required fields based on user type and step
  if (step === 'organization-details') {
    if (!formData.organizationName?.trim()) {
      errors.push({ field: 'organizationName', message: userType === 'agency' ? 'Agency name is required' : 'Company name is required' })
    }
    if (formData.organizationWebsite && formData.organizationWebsite.trim()) {
      const urlRegex = /^https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:\/.*)?$/
      if (!urlRegex.test(formData.organizationWebsite)) {
        errors.push({ field: 'organizationWebsite', message: 'Please enter a valid website URL (include http:// or https://)' })
      }
    }
  } else if (step === 'brand-company-details') {
    if (!formData.brandCompanyName?.trim()) {
      errors.push({ field: 'brandCompanyName', message: 'Brand company name is required' })
    }
    if (formData.brandCompanyWebsite && formData.brandCompanyWebsite.trim()) {
      const urlRegex = /^https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:\/.*)?$/
      if (!urlRegex.test(formData.brandCompanyWebsite)) {
        errors.push({ field: 'brandCompanyWebsite', message: 'Please enter a valid website URL (include http:// or https://)' })
      }
    }
  } else if (step === 'brand-setup') {
    if (!formData.brandName?.trim()) {
      errors.push({ field: 'brandName', message: 'Brand name is required' })
    }
    if (!formData.brandCategories || formData.brandCategories.length === 0) {
      errors.push({ field: 'brandCategories', message: 'Pick at least one category that describes your brand' })
    }
    if (formData.brandWebsite && formData.brandWebsite.trim()) {
      const urlRegex = /^https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:\/.*)?$/
      if (!urlRegex.test(formData.brandWebsite)) {
        errors.push({ field: 'brandWebsite', message: 'Please enter a valid website URL (include http:// or https://)' })
      }
    }
  } else if (step === 'business-context') {
    if (!formData.brandKeywords || formData.brandKeywords.length === 0) {
      errors.push({ field: 'productsServices', message: 'Add at least one topic so we know what to track' })
    }
    if (!formData.targetMarkets || formData.targetMarkets.length === 0) {
      errors.push({ field: 'targetMarkets', message: 'Select at least one market where your customers are' })
    }
    // Note: Most fields are now optional - AI will infer from website and description
  }

  return errors
}

// Custom styling for onboarding form fields to match dropdown styling

export default function OnboardingPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser()
  const { signOut: clerkSignOut } = useClerk()
  const [step, setStep] = useState<Step>("user-type")
  const [userType, setUserType] = useState<UserType>(null)
  const [user, setUser] = useState<any>(null)
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('never_started')
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isFormLocked, setIsFormLocked] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agencyEnabled, setAgencyEnabled] = useState<boolean | null>(null)
  const [isRunningSearch, setIsRunningSearch] = useState(false)
  const [searchResults] = useState<any>(null)
  const [auditResults, setAuditResults] = useState<any>(null)
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null)
  const [isNavigatingToReport, setIsNavigatingToReport] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [isPolishingPrompt, setIsPolishingPrompt] = useState(false)

  // Fetch feature flags to determine agency mode
  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const response = await fetch('/api/admin/feature-flags')
        const data = await response.json()
        const enabled = data.flags?.agency_mode?.enabled ?? true
        setAgencyEnabled(enabled)
      } catch {
        // Default to enabled on error
        setAgencyEnabled(true)
      }
    }
    fetchFeatureFlags()
  }, [])

  // Auto-skip user-type selection when agency mode is disabled
  useEffect(() => {
    if (agencyEnabled === false && step === 'user-type' && !userType) {
      handleUserTypeSelect('inhouse')
    }
  }, [agencyEnabled, step, userType])

  // Reset polishing state when customPrompt is cleared or component unmounts
  useEffect(() => {
    if (!customPrompt.trim()) {
      setIsPolishingPrompt(false)
    }
  }, [customPrompt])

  // Cleanup polishing state on unmount
  useEffect(() => {
    return () => {
      setIsPolishingPrompt(false)
    }
  }, [])

  // Reset polishing state when customPrompt is cleared or component unmounts
  useEffect(() => {
    if (!customPrompt.trim()) {
      setIsPolishingPrompt(false)
    }
  }, [customPrompt])

  // Cleanup polishing state on unmount
  useEffect(() => {
    return () => {
      setIsPolishingPrompt(false)
    }
  }, [])
  const [aiGeneratedPrompts, setAiGeneratedPrompts] = useState<any[]>([])
  const [promptRunResult, setPromptRunResult] = useState<any>(null) // Store full PromptRunResult
  const [runId, setRunId] = useState<string | null>(null)
  const [runProgress, setRunProgress] = useState<any>(null)
  const [runClient] = useState(() => new LLMRunClient())
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false)
  const [promptGenerationProgress, setPromptGenerationProgress] = useState("")
  const [promptTestingStatus, setPromptTestingStatus] = useState<Record<string, {
    status: 'waiting' | 'testing' | 'completed' | 'failed'
    context: string
    currentModel?: string
  }>>({})
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [restoredFromCache, setRestoredFromCache] = useState(false)
  const { addToast, ToastContainer } = useToast()
  const router = useRouter()

  // Helper function to automatically generate brand report from audit results
  const generateBrandReportFromAudit = async (auditData: any, brandName: string, brandId: string, workspaceId?: string) => {
    try {
      console.log('📊 Auto-generating brand report from audit results...')

      if (!user?.id) {
        console.warn('⚠️ No user ID available for report generation')
        return null
      }

      // Get the current session for authentication
      const supabase = getSupabaseClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.warn('⚠️ No valid session for report generation')
        return null
      }

      // **ENHANCED**: Use our brand reporting service with GEO analysis integration
      try {
        console.log('🚀 Generating enhanced report using brand reporting service...')

        // Import client-safe brand reporting service
        const { ClientBrandReportingService } = await import('@/lib/services/client-brand-reporting-service')
        const reportingService = new ClientBrandReportingService()

        // Get the run ID from the current run
        const currentRunId = runId || 'latest' // Will be populated when run completes

        // Generate enhanced report with GEO analysis integration
        const enhancedReport = await reportingService.generateReportFromRun(
          currentRunId,
          brandId,
          {
            includeCompetitorAnalysis: true,
            includeBrandMentions: true,
            includeEnhancedMetrics: true,
            brandContext: {
              brandName: brandName,
              brandWebsite: formData.brandWebsite,
              brandCategories: formData.brandCategories,
              targetMarkets: formData.targetMarkets,
              competitors: formData.knownCompetitors || []
            }
          }
        )

        if (enhancedReport) {
          console.log('✅ Enhanced report generated successfully:', enhancedReport.id)
          setGeneratedReportId(enhancedReport.id)
          console.log('📋 Stored enhanced report ID in state:', enhancedReport.id)
          return enhancedReport
        }
      } catch (enhancedError) {
        console.warn('⚠️ Enhanced report generation failed, falling back to legacy method:', enhancedError)
        // Fall back to legacy report generation
      }

      // **LEGACY FALLBACK**: Extract detailed metrics from audit data
      const testResults = auditData.test_results || []
      const brandResearch = auditData.brand_research || {}
      const auditSummary = auditData.audit_summary || {}

      // GEO analysis data removed - tables dropped for rebuild

      // Calculate platform performance with enhanced data
      const platformMetrics: Record<string, any> = {}
      const platformCounts: Record<string, any> = {}

      testResults.forEach((result: any) => {
        const platform = result.platform || result.llm_name || 'unknown'
        if (!platformMetrics[platform]) {
          platformMetrics[platform] = {
            total_mentions: 0,
            mentioned_count: 0,
            total_tests: 0,
            avg_position: 0,
            avg_sentiment: 0,
            citations: 0,
            competitors_mentioned: 0,
            // Enhanced metrics from GEO analysis
            high_threat_competitors: 0,
            brand_mention_quality: 0,
            competitive_pressure: 0
          }
        }

        const metrics = platformMetrics[platform]
        metrics.total_tests++
        metrics.total_mentions += result.brand_mention_count || 0
        if (result.brand_mentioned) metrics.mentioned_count++
        if (result.mention_position) metrics.avg_position += result.mention_position
        if (result.sentiment_score) metrics.avg_sentiment += result.sentiment_score
        if (result.citations_count) metrics.citations += result.citations_count
        if (result.competitors_mentioned) metrics.competitors_mentioned += result.competitors_mentioned.length || 0
      })

      // Calculate averages and format platform data with enhanced metrics
      const platformsData = Object.entries(platformMetrics).map(([platform, metrics]: [string, any]) => {
        const mentionRate = metrics.total_tests > 0 ? (metrics.mentioned_count / metrics.total_tests) * 100 : 0
        const avgPosition = metrics.mentioned_count > 0 ? metrics.avg_position / metrics.mentioned_count : 0
        const avgSentiment = metrics.mentioned_count > 0 ? metrics.avg_sentiment / metrics.mentioned_count : 0
        const threatPressure = metrics.high_threat_competitors || 0
        const qualityScore = metrics.brand_mention_quality || 0

        return {
          name: platform,
          mentions: metrics.total_mentions,
          mention_rate: Math.round(mentionRate),
          ranking_position: Math.round(avgPosition) || null,
          visibility_score: Math.round(
            mentionRate * 0.6 +
            (avgSentiment > 0 ? avgSentiment * 15 : 0) +
            (qualityScore * 10) -
            (threatPressure * 3)
          ),
          sentiment_score: avgSentiment,
          citations: metrics.citations,
          competitors_mentioned: metrics.competitors_mentioned,
          // Enhanced metrics
          high_threat_competitors: threatPressure,
          brand_mention_quality: Math.round(qualityScore * 100),
          competitive_pressure: threatPressure > 3 ? 'high' : threatPressure > 1 ? 'medium' : 'low'
        }
      })

      // Basic competitor analysis from test results
      const competitorAnalysis: Record<string, any> = {}
      testResults.forEach((result: any) => {
        if (result.competitors_mentioned) {
          result.competitors_mentioned.forEach((comp: string) => {
            if (!competitorAnalysis[comp]) {
              competitorAnalysis[comp] = { mentions: 0, platforms: new Set(), threat_level: 'unknown' }
            }
            competitorAnalysis[comp].mentions++
            competitorAnalysis[comp].platforms.add(result.platform || result.llm_name)
          })
        }
      })

      const topCompetitors = Object.entries(competitorAnalysis)
        .map(([name, data]: [string, any]) => ({
          name,
          mentions: data.mentions,
          platforms: Array.from(data.platforms),
          threat_level: data.threat_level,
          market_position: 'unknown',
          competitive_advantage: 'Not assessed',
          market_overlap_score: 0
        }))
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 10)

      // Extract sentiment analysis
      const sentimentAnalysis = brandResearch.brand_analysis?.sentiment_distribution || {
        positive: 70,
        neutral: 20,
        negative: 10
      }

      // **ENHANCED**: Extract key insights from test results with GEO data
      const topPerformingQueries = testResults
        .filter((r: any) => r.brand_mentioned && r.mention_position <= 3)
        .map((r: any) => ({
          query: r.question || r.prompt,
          platform: r.platform || r.llm_name,
          position: r.mention_position,
          sentiment: r.overall_sentiment,
          confidence: r.confidence_score || 0.7
        }))
        .slice(0, 5)

      const response = await fetch('/api/reports/brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          brand_id: brandId,
          workspace_id: workspaceId,
          title: `${brandName} - Enhanced AI Discoverability Analysis`,
          description: `Comprehensive AI visibility audit with competitor intelligence generated on ${new Date().toLocaleDateString()}`,
          report_type: 'enhanced_brand_audit',
          auto_generated: true,
          source: 'onboarding_audit_enhanced',
          // Enhanced metrics data with GEO analysis integration
          metrics_data: {
            platforms: platformsData,
            analysis_type: 'enhanced_geo_audit',
            generated_date: new Date().toISOString(),
            total_queries_tested: testResults.length,
            models_tested: auditSummary.models_tested || [],
            sentiment_analysis: sentimentAnalysis,
            performance_summary: {
              mention_rate: brandResearch.brand_analysis?.brand_mention_rate || 0,
              avg_sentiment: brandResearch.brand_analysis?.average_sentiment_score || 0,
              total_citations: testResults.reduce((sum: number, r: any) => sum + (r.citations_count || 0), 0),
              unique_platforms: Object.keys(platformMetrics).length,
              // Enhanced metrics from GEO analysis
              total_competitors_detected: topCompetitors.length,
              high_threat_competitors: topCompetitors.filter(c => c.threat_level === 'high').length,
              competitive_pressure_score: Math.round(
                platformsData.reduce((sum, p) => sum + (p.high_threat_competitors || 0), 0) /
                Math.max(platformsData.length, 1)
              ),
              brand_mention_quality_avg: Math.round(
                platformsData.reduce((sum, p) => sum + (p.brand_mention_quality || 0), 0) /
                Math.max(platformsData.length, 1)
              )
            },
            // Enhanced competitor intelligence
            competitor_intelligence: {
              market_leaders: topCompetitors.filter(c => c.market_position === 'market_leader'),
              emerging_threats: topCompetitors.filter(c => c.threat_level === 'high' && c.market_position !== 'market_leader'),
              market_overlap_scores: topCompetitors.map(c => ({
                competitor: c.name,
                overlap_score: c.market_overlap_score,
                threat_level: c.threat_level
              }))
            }
          },
          // Enhanced charts data for advanced visualizations
          charts_data: {
            platform_performance: platformsData.map(p => ({
              platform: p.name,
              visibility: p.visibility_score,
              mentions: p.mentions,
              sentiment: p.sentiment_score,
              brand_quality: p.brand_mention_quality,
              competitive_pressure: p.competitive_pressure,
              high_threat_competitors: p.high_threat_competitors
            })),
            sentiment_distribution: Object.entries(sentimentAnalysis).map(([sentiment, value]) => ({
              sentiment,
              percentage: value
            })),
            competitor_landscape: topCompetitors.map(c => ({
              competitor: c.name,
              mentions: c.mentions,
              platforms: c.platforms.length,
              threat_level: c.threat_level,
              market_position: c.market_position,
              market_overlap_score: c.market_overlap_score
            })),
            top_performing_queries: topPerformingQueries,
            threat_analysis: {
              high_threat: topCompetitors.filter(c => c.threat_level === 'high').length,
              medium_threat: topCompetitors.filter(c => c.threat_level === 'medium').length,
              low_threat: topCompetitors.filter(c => c.threat_level === 'low').length,
              unknown_threat: topCompetitors.filter(c => c.threat_level === 'unknown').length
            }
          },
          // Enhanced key findings with competitive intelligence
          key_findings: {
            top_platforms: platformsData
              .sort((a, b) => b.visibility_score - a.visibility_score)
              .slice(0, 3)
              .map(p => p.name),
            strongest_performance: platformsData.length > 0
              ? platformsData.reduce((best, current) =>
                current.visibility_score > best.visibility_score ? current : best
              ).name
              : "Needs assessment",
            competitive_threats: topCompetitors.filter(c => c.threat_level === 'high').map(c => c.name),
            market_leaders: topCompetitors.filter(c => c.market_position === 'market_leader').map(c => c.name),
            improvement_areas: [
              platformsData.some(p => p.mention_rate < 30) ? "Increase brand mention frequency" : null,
              sentimentAnalysis.negative > 20 ? "Address negative sentiment" : null,
              topCompetitors.filter(c => c.threat_level === 'high').length > 0 ? "Counter high-threat competitors" : null,
              platformsData.some(p => (p.ranking_position ?? 0) > 5) ? "Improve ranking positions" : null,
              platformsData.some(p => p.competitive_pressure === 'high') ? "Reduce competitive pressure" : null
            ].filter(Boolean),
            opportunities: [
              platformsData.some(p => p.mention_rate > 60) ? `Leverage strong performance on ${platformsData.find(p => p.mention_rate > 60)?.name}` : null,
              sentimentAnalysis.positive > 60 ? "Capitalize on positive brand sentiment" : null,
              topPerformingQueries.length > 0 ? "Optimize for high-performing query patterns" : null,
              platformsData.some(p => p.brand_mention_quality > 80) ? "Scale high-quality mention strategies" : null
            ].filter(Boolean)
          },
          // Enhanced recommendations with competitive strategy
          recommendations: [
            platformsData.some(p => p.visibility_score < 50)
              ? `Focus on improving visibility on ${platformsData.filter(p => p.visibility_score < 50).map(p => p.name).join(", ")}`
              : "Maintain strong multi-platform presence",
            sentimentAnalysis.negative > 15
              ? "Implement reputation management strategies to address negative sentiment"
              : "Leverage positive sentiment in marketing materials",
            topCompetitors.filter(c => c.threat_level === 'high').length > 0
              ? `Counter high-threat competitors: ${topCompetitors.filter(c => c.threat_level === 'high').map(c => c.name).join(", ")}`
              : topCompetitors.length > 0
                ? `Monitor competitive landscape: ${topCompetitors.slice(0, 3).map(c => c.name).join(", ")}`
                : "Monitor competitive landscape for new entrants",
            topPerformingQueries.length > 0
              ? "Create content optimized for high-performing query patterns"
              : "Develop diverse content strategy for better query coverage",
            platformsData.some(p => p.brand_mention_quality < 60)
              ? "Improve brand mention quality through targeted content optimization"
              : "Maintain high brand mention quality standards"
          ],
          // Include raw audit data for detailed analysis
          raw_data: auditData,
          overall_score: auditSummary.overall_ldi_score || 0,
          visibility_score: brandResearch.brand_analysis?.brand_mention_rate || 0,
          discoverability_score: platformsData.length > 0
            ? Math.round(platformsData.reduce((sum, p) => sum + p.visibility_score, 0) / platformsData.length)
            : 0,
          mention_count: brandResearch.brand_analysis?.total_brand_mentions || testResults.reduce((sum: number, r: any) => sum + (r.brand_mention_count || 0), 0),
          citation_count: testResults.reduce((sum: number, r: any) => sum + (r.citations_count || 0), 0),
          competitor_count: topCompetitors.length
        }),
      })

      if (response.ok) {
        const reportData = await response.json()
        console.log('✅ Brand report auto-generated:', reportData.data?.id)

        // Store the generated report ID for navigation
        if (reportData.data?.id) {
          setGeneratedReportId(reportData.data.id)
          console.log('📋 Stored legacy report ID in state:', reportData.data.id)
        } else {
          console.warn('⚠️ Legacy report generated but no ID found in response')
        }

        return reportData.data
      } else {
        const errorText = await response.text()
        console.warn('⚠️ Failed to auto-generate brand report:', errorText)
      }
    } catch (error) {
      console.error('❌ Error auto-generating brand report:', error)
    }

    return null
  }

  const [formData, setFormData] = useState({
    // Account/Organization Details (this is the account - agency or company name)
    organizationName: "", // This will be the account name
    organizationWebsite: "",

    // Brand Company/Organization Details (the company that owns the brand)
    brandCompanyName: "",
    brandCompanyWebsite: "",
    brandCompanyLocation: "", // No default - let user choose

    // Brand Details (the actual brand being managed)
    brandName: "",
    brandDescription: "", // Rich description of what the brand does
    brandCategory: "", // Primary category for backward compatibility
    brandCategories: [] as string[], // Changed to array for multi-select
    brandWebsite: "",
    
    // Entity Type - determines language in reports (company, product, personality, etc.)
    entityType: "company" as "company" | "product" | "service" | "personality" | "organization" | "government" | "campaign" | "location",

    // Markets and Location
    targetMarkets: [] as string[], // Let user add markets manually
    location: "", // No default - let user choose

    // Business Context for AI Research
    businessCategory: "", // What industry/category (e.g., "retail", "saas", "healthcare")
    businessType: "brand" as "brand" | "business" | "product" | "organization",
    brandKeywords: [] as string[], // Brand topics - key areas AI should know about
    productsServices: "", // Legacy field - use brandKeywords instead
    businessModel: "" as "b2b" | "b2c" | "b2b2c" | "marketplace" | "other" | "",
    targetAudience: "", // Who are their customers
    primaryValue: "", // Main value proposition
    businessStage: "" as "startup" | "growth" | "established" | "enterprise" | "",
    knownCompetitors: [] as string[], // Competitors they're aware of
  })

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showValidation, setShowValidation] = useState(false)
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false)
  const [marketSearchTerm, setMarketSearchTerm] = useState("")
  const [competitorInputValue, setCompetitorInputValue] = useState("")
  const [currentAccount, setCurrentAccount] = useState<any>(null)
  const [currentBrand, setCurrentBrand] = useState<any>(null)

  // Get countries data from database
  const { countryOptions, getCountryNames } = useCountries()

  // Check for existing audit results to restore report on page refresh
  const checkForExistingAuditResults = async (accountId: string, userId: string) => {
    try {
      const supabase = getSupabaseClient()
      console.log('🔍 checkForExistingAuditResults called with:', { accountId, userId })

      // Look for recent completed free audit reports for this account
      const { data: auditResults, error } = await supabase
        .from('free_audit_reports')
        .select('id, brand_name, audit_results, created_at')
        .eq('account_id', accountId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)

      console.log('🔍 Supabase query result:', { auditResults, error })

      if (error) {
        console.warn('Error checking for existing audit results:', error)
        return
      }

      if (auditResults && auditResults.length > 0) {
        const latestAudit = auditResults[0]
        console.log('🔍 Found audit result:', latestAudit)

        // Check if the audit was created recently (within last 24 hours)
        const auditAge = Date.now() - new Date(latestAudit.created_at).getTime()
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours

        console.log('🔍 Audit age check:', { auditAge, maxAge, isRecent: auditAge < maxAge })

        if (auditAge < maxAge) {
          console.log('✅ Found recent audit results, restoring report...')

          // Parse the stored results
          const auditData = latestAudit.audit_results || {}
          console.log('🔍 Parsed audit data:', auditData)

          // Restore form data if available
          if (latestAudit.brand_name) {
            setFormData(prev => ({
              ...prev,
              brandName: latestAudit.brand_name,
              targetMarkets: auditData.target_markets || prev.targetMarkets,
              productsServices: auditData.products_services || prev.productsServices
            }))
          }

          // Restore audit results and go to report step
          console.log('🔍 Setting audit results to:', auditData)
          setAuditResults(auditData)
          setStep('ai-report')

          return true
        }
      }
    } catch (error) {
      console.warn('Error checking for existing audit results:', error)
    }

    return false
  }

  // Ensure profile exists in Supabase (webhook race condition workaround)
  // Calls the server-side API which uses the service role client to bypass RLS
  const ensureProfileExists = async (clerkId: string, email: string, fullName: string | null, avatarUrl: string | null): Promise<boolean> => {
    const MAX_RETRIES = 6
    const RETRY_DELAY = 1500 // 1.5 seconds

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch('/api/accounts/profile/me')
        const data = await res.json()
        
        if (res.ok && data?.success && data?.profile?.clerk_id) {
          console.log(`✅ Profile found/created for ${clerkId} (attempt ${attempt + 1})`)
          return true
        }
        
        console.warn(`⏳ Profile check attempt ${attempt + 1}/${MAX_RETRIES}:`, 
          res.status, data?.error || 'profile not ready')
      } catch (err) {
        console.warn(`⏳ Profile check attempt ${attempt + 1}/${MAX_RETRIES} network error:`, err)
      }

      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      }
    }

    console.error('❌ Failed to ensure profile after all retries for', clerkId)
    return false
  }

  // Check authentication and existing setup
  useEffect(() => {
    const checkAuth = async () => {
      // Wait for Clerk to load
      if (!isClerkLoaded) return

      // Check if user is signed in via Clerk
      if (!isSignedIn || !clerkUser) {
        router.push('/signin')
        return
      }

      // Set user with Clerk data
      const userObj = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        user_metadata: {
          full_name: clerkUser.fullName,
          avatar_url: clerkUser.imageUrl
        }
      }
      setUser(userObj)

      const supabase = getSupabaseClient()

      // Ensure the profile exists before proceeding (handles webhook race condition)
      const profileReady = await ensureProfileExists(
        clerkUser.id,
        clerkUser.emailAddresses[0]?.emailAddress || '',
        clerkUser.fullName,
        clerkUser.imageUrl
      )
      if (!profileReady) {
        console.error('❌ Could not ensure profile exists — proceeding anyway')
      }

      // Check if user is a member of any organization (invited user)
      // This includes both explicitly invited users and those added through other means
      const { data: accountUsers, error: accountUsersError } = await supabase
        .from('account_users')
        .select('account_id, role, is_active, invited_by')
        .eq('clerk_id', clerkUser.id)
        .eq('is_active', true)
        .limit(1)

      // If user is a member of any organization, skip onboarding and go to dashboard
      // Members don't need to complete onboarding - they join existing organizations
      if (!accountUsersError && accountUsers && accountUsers.length > 0) {
        console.log('🎯 Organization member detected - skipping onboarding, redirecting to dashboard:', {
          accountId: accountUsers[0].account_id,
          role: accountUsers[0].role,
          wasInvited: !!accountUsers[0].invited_by
        })

        // Also ensure their profile is marked as completed
        await supabase
          .from('profiles')
          .update({
            onboarding_status: 'completed',
            onboarding_completed_at: new Date().toISOString(),
            onboarding_step: 6
          })
          .eq('clerk_id', clerkUser.id)
          .or('onboarding_completed_at.is.null,onboarding_step.is.null,onboarding_step.lt.6')

        router.push(`/dashboard?account=${accountUsers[0].account_id}`)
        return
      }

      // Track onboarding page visit
      try { } catch (error) {
        console.warn('Failed to track onboarding page visit:', error)
      }

      // Get comprehensive onboarding status from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed_at, onboarding_status, onboarding_step')
        .eq('clerk_id', clerkUser.id)
        .maybeSingle()

      // Check if user has generated reports (via free_audit_reports matching by email)
      const clerkEmail = clerkUser.emailAddresses?.[0]?.emailAddress
      let hasGeneratedReport = false
      if (clerkEmail) {
        const { data: auditResults, error: auditError } = await supabase
          .from('free_audit_reports')
          .select('id')
          .eq('email', clerkEmail.toLowerCase())
          .eq('status', 'completed')
          .limit(1)
        hasGeneratedReport = !auditError && !!auditResults && auditResults.length > 0
      }

      // Onboarding completion is based on report generation, not just account+brand setup
      const hasCompletedStatus = profile?.onboarding_status === 'completed'
      const hasCompletedTimestamp = profile?.onboarding_completed_at !== null
      const isActuallyCompleted = hasCompletedStatus && hasCompletedTimestamp

      console.log('🔍 Onboarding page initial status check:', {
        clerkId: clerkUser.id,
        profile,
        hasCompletedStatus,
        hasCompletedTimestamp,
        hasGeneratedReport,
        isActuallyCompleted,
        decision: isActuallyCompleted ? 'COMPLETED (has report)' : 'INCOMPLETE (needs report or setup)'
      })

      // SIMPLIFIED: Check basic setup and redirect if complete
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('owner_clerk_id', clerkUser.id)
        .maybeSingle()

      setCurrentAccount(account)

      if (account) {
        const { data: brands } = await supabase
          .from('brands')
          .select('id')
          .eq('account_id', account.id)
          .limit(1)

        // Check URL params for special cases
        const urlParams = new URLSearchParams(window.location.search);
        const viewReport = urlParams.get('view_report') === 'true';
        const hasResults = urlParams.get('has_results') === 'true';
        const isRequired = urlParams.get('required') === 'true';

        // Only redirect to dashboard if user has ACTUALLY completed onboarding (generated report)
        // Having account+brands is not enough - they need to generate their first report
        if (brands && brands.length > 0 && !viewReport && !hasResults && !isRequired && isActuallyCompleted) {
          console.log('✅ Onboarding: User has setup AND completed onboarding (generated report), redirecting to dashboard')
          router.push('/dashboard')
          return
        } else if (brands && brands.length > 0 && !viewReport && !hasResults && !isRequired && !isActuallyCompleted) {
          console.log('📝 Onboarding: User has setup but needs to generate first report - staying on onboarding')
          // Don't redirect - let them complete onboarding by generating report
        }
      }

      // Get onboarding state from the unified check
      const onboardingState = await getUserOnboardingState(clerkUser.id)

      if (onboardingState) {
        setOnboardingStatus(onboardingState.onboarding_status)
        setCurrentStep(onboardingState.onboarding_step)
        // Only lock form if ACTUALLY completed (both status and timestamp)
        setIsFormLocked(isActuallyCompleted)
      }

      // Check for existing audit results from free audit reports
      const existingClerkEmail = clerkUser.emailAddresses?.[0]?.emailAddress
      let existingAuditResults: { id: string; audit_results: any; brand_name: string; created_at: string } | null = null
      if (existingClerkEmail) {
        const { data } = await supabase
          .from('free_audit_reports')
          .select('id, audit_results, brand_name, created_at')
          .eq('email', existingClerkEmail.toLowerCase())
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        existingAuditResults = data
      }

      setCurrentAccount(account)

      let brands = null
      if (account?.id) {
        const { data: brandsData } = await supabase
          .from('brands')
          .select(`
            id,
            name,
            workspaces(id)
          `)
          .eq('account_id', account.id)
          .limit(1)
        brands = brandsData

        if (brands && brands.length > 0) {
          // Include workspace_id for report generation
          const brandWithWorkspace = {
            ...brands[0],
            workspace_id: brands[0].workspaces?.[0]?.id
          }
          setCurrentBrand(brandWithWorkspace)
        }
      }

      const hasAccount = !!account
      const hasBrands = brands && brands.length > 0
      // Use unified completion check
      const hasCompletedOnboarding = isActuallyCompleted
      const hasExistingResults = !!existingAuditResults

      console.log('🔍 Onboarding page detailed status check:', {
        clerkId: clerkUser.id,
        hasAccount,
        hasBrands,
        hasCompletedOnboarding,
        hasExistingResults,
        unifiedCompletionCheck: isActuallyCompleted,
        profileStatus: profile?.onboarding_status,
        profileCompletedAt: profile?.onboarding_completed_at,
        brands: brands?.length || 0
      })

      // Check URL params for special cases
      const urlParams = new URLSearchParams(window.location.search)
      const hasResults = urlParams.get('has_results') === 'true'

      // ── AUTO-CLAIM: User has a completed free audit but no account ──
      // This handles the case where the user signed up from the email link
      // but claim-and-setup didn't run (e.g. redirect was missed, or first deploy).
      if (hasExistingResults && !hasAccount) {
        console.log('🔄 Auto-claiming free audit for user without account...')
        
        // Retrieve token from storage if available (same-device flow)
        const storedToken =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('free_audit_token') ||
              sessionStorage.getItem('free_audit_claim_token') ||
              localStorage.getItem('soma_audit_token')
            : null

        try {
          const claimRes = await fetch('/api/onboarding/free-audit/claim-and-setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: storedToken || null, reportId: existingAuditResults?.id || null }),
          })

          if (claimRes.ok) {
            const claimData = await claimRes.json()
            console.log('✅ Auto-claim successful:', claimData)

            // Clean up stored tokens
            try { sessionStorage.removeItem('free_audit_token') } catch {}
            try { sessionStorage.removeItem('free_audit_claim_token') } catch {}
            try { localStorage.removeItem('soma_audit_token') } catch {}

            // Clear onboarding cache
            OnboardingStateCache.clearState()

            // Redirect to dashboard with brand context
            const brandId = claimData.brand?.id
            const redirectUrl = brandId
              ? `/dashboard?brand=${brandId}&claimed_audit=true`
              : '/dashboard?claimed_audit=true'
            router.push(redirectUrl)
            return
          } else {
            const errorData = await claimRes.json().catch(() => ({}))
            console.warn('⚠️ Auto-claim failed:', claimRes.status, errorData)
            // Fall through to show results on onboarding page
          }
        } catch (claimErr) {
          console.error('⚠️ Auto-claim error:', claimErr)
          // Fall through to show results on onboarding page
        }
      }

      // If user has existing audit results but incomplete setup, show them the results
      if (hasExistingResults && (!hasAccount || !hasBrands || !hasCompletedOnboarding)) {
        console.log('User has existing audit results, restoring...')
        setAuditResults(existingAuditResults.audit_results)
        setStep("ai-report")

        // Only update onboarding status if not already completed
        if (!isActuallyCompleted) {
          if (onboardingState?.onboarding_status === 'never_started') {
            await startOnboarding(clerkUser.id, { restored_from_cache: true })
            setOnboardingStatus('in_progress')
          }
        } else {
          // Preserve completed status
          setOnboardingStatus('completed')
        }

        return
      }

      // If user has completed onboarding AND has results AND wants to view report, show it
      if (hasExistingResults && isActuallyCompleted) {
        const urlParams = new URLSearchParams(window.location.search);
        const viewReport = urlParams.get('view_report') === 'true';
        const hasResults = urlParams.get('has_results') === 'true';

        if (viewReport || hasResults) {
          console.log('Completed user viewing their report...')
          setAuditResults(existingAuditResults.audit_results)
          setStep("ai-report")
          setOnboardingStatus('completed')
          return
        }
      }

      if (hasAccount && hasBrands && hasCompletedOnboarding) {
        // User has completed full onboarding setup
        // Check if they came here from auth callback or direct navigation
        const urlParams = new URLSearchParams(window.location.search)
        const fromAuth = urlParams.get('from') === 'auth'
        const isRequired = urlParams.get('required') === 'true'
        const hasError = urlParams.get('error') === 'check_failed'

        if (fromAuth) {
          // This might be a browser navigation issue or OAuth redirect loop
          console.warn('User redirected to onboarding from auth but setup already complete')
        }

        if (isRequired) {
          console.log('User was redirected to onboarding because dashboard detected incomplete setup')
          // Don't redirect back to dashboard if we just came from there due to required=true
          // This prevents redirect loops - allow them to view onboarding/report instead

          // Check if they have audit results to show
          if (existingAuditResults) {
            console.log('Showing existing audit results instead of redirecting')
            setAuditResults(existingAuditResults.audit_results)
            setStep("ai-report")
            setOnboardingStatus('completed')
            return
          }

          // Don't redirect back to dashboard, let them stay on onboarding
          setOnboardingStatus('completed')
          return
        } else if (hasError) {
          console.warn('User redirected to onboarding due to system error')
        } else {
          console.log('User has completed onboarding, redirecting to dashboard')
        }

        // Ensure onboarding status is consistent but don't auto-complete
        if (onboardingState?.onboarding_status !== 'completed') {
          // Don't automatically mark as complete - user must complete the full flow including report generation
          console.log('User has account/brands but onboarding not marked complete - keeping current status')
        }

        // Clear cache since onboarding is already complete
        OnboardingStateCache.clearState()

        // Only redirect to dashboard if NOT coming from required=true (to prevent loops)
        if (!isRequired) {
          router.push('/dashboard?setup_complete=true')
          return
        }
      }

      // Check for existing audit results first (for report persistence)
      if (account?.id) {
        await checkForExistingAuditResults(account.id, clerkUser.id)
      }
    }

    checkAuth()
  }, [router, isClerkLoaded, isSignedIn, clerkUser])

  // Separate effect to restore from cache after user is authenticated
  useEffect(() => {
    if (user && !restoredFromCache) {
      // Give a small delay to ensure all state is initialized
      const timeoutId = setTimeout(async () => {
        // Check if user is invited before attempting to restore cache
        const supabase = getSupabaseClient()
        const { data: accountUsers } = await supabase
          .from('account_users')
          .select('invited_by')
          .eq('clerk_id', user.id)
          .not('invited_by', 'is', null)
          .limit(1)

        // Skip cache restoration for invited users - they should redirect to dashboard
        if (accountUsers && accountUsers.length > 0) {
          console.log('🎯 Skipping cache restoration for invited user')
          return
        }

        console.log('🔄 Attempting to restore from cache...')
        await restoreFromCache()
      }, 200)

      return () => clearTimeout(timeoutId)
    }
  }, [user, restoredFromCache])

  // Restore onboarding state from cache
  const restoreFromCache = async () => {
    const cachedState = OnboardingStateCache.loadState()

    if (cachedState) {
      console.log('Restoring onboarding state from cache:', cachedState)

      // Restore state, but skip "progress" step if it was cached
      let restoredStep = cachedState.step === "progress" ? "prompts" : cachedState.step
      let restoredUserType = cachedState.userType

      // When agency mode is explicitly disabled, skip user-type step and force inhouse
      if (agencyEnabled === false && (restoredStep === 'user-type' || !restoredUserType)) {
        restoredStep = restoredStep === 'user-type' ? 'organization-details' : restoredStep
        restoredUserType = 'inhouse'
      }

      setStep(restoredStep)
      setUserType(restoredUserType)

      // Restore form data - completely replace instead of merging
      console.log('Restoring form data:', cachedState.formData)
      const restoredFormData = {
        ...cachedState.formData,
        // Ensure brandCategories is always an array
        brandCategories: cachedState.formData?.brandCategories || []
      }
      setFormData(restoredFormData as any)

      // Filter out canned fallback prompts from cache (they contain raw template tokens)
      const cachedPrompts = cachedState.aiGeneratedPrompts || []
      const isCannedPrompt = (p: any) => {
        const text = p?.text || ''
        return /\b(digital_products|Brand-context fallback)\b/.test(text + (p?.rationale || ''))
      }
      const cleanPrompts = cachedPrompts.filter((p: any) => !isCannedPrompt(p))
      setAiGeneratedPrompts(cleanPrompts)
      setPromptRunResult(cachedState.promptRunResult || null)
      setRunId(cachedState.runId || null)
      setRunProgress(cachedState.runProgress || null)
      setCustomPrompt(cachedState.customPrompt || "")
      setAuditResults(cachedState.auditResults || null)  // Restore audit results
      setRestoredFromCache(true)

      // Update onboarding tracking with step progress
      if (user?.id) {
        const stepToNumber = {
          "user-type": 1,
          "organization-details": 2,
          "brand-company-details": 3,
          "brand-setup": 4,
          "business-context": 5,
          "prompts": 6,
          "progress": 7,
          "ai-report": 8
        }
        const stepNumber = stepToNumber[restoredStep as keyof typeof stepToNumber] || 1
        await updateOnboardingStep(user.id, stepNumber, {
          restored_from_cache: true,
          preserve_completed_status: true
        })
        setCurrentStep(stepNumber)
      }
    } else if (user?.id && onboardingStatus === 'never_started') {
      // No cached state and user hasn't started - initialize onboarding
      await startOnboarding(user.id, { started_from: 'onboarding_page' })
      setOnboardingStatus('in_progress')
      setCurrentStep(1)
    } else if (user?.id && onboardingStatus === 'completed') {
      // User has completed onboarding - preserve their status
      setOnboardingStatus('completed')
    }
  }

  // Debug: Log form data changes
  useEffect(() => {
    console.log('📝 FormData updated:', formData)
  }, [formData])

  // Auto-save onboarding state to cache whenever it changes
  useEffect(() => {
    // Only auto-save if we have a user and we're not in the initial loading state
    if (user && (restoredFromCache || step !== "user-type" || userType !== null)) {
      const saved = OnboardingStateCache.saveState(
        step,
        userType,
        formData,
        aiGeneratedPrompts,
        promptRunResult,
        customPrompt,
        auditResults,  // Include audit results in cache
        runId || undefined,
        runProgress
      )

      if (!saved) {
        console.warn('Failed to auto-save onboarding progress')
      }
    }
  }, [step, userType, formData, aiGeneratedPrompts, promptRunResult, customPrompt, auditResults, runId, runProgress, user, restoredFromCache])  // Add all run state to dependencies

  // Close market dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.market-dropdown-container')) {
        setIsMarketDropdownOpen(false)
      }
    }

    if (isMarketDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMarketDropdownOpen])

  // Helper function to get error message for a field
  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message
  }

  // Helper function to get input className with validation styling (unused but kept for future use)
  // const getInputClassName = (fieldName: string): string => {
  //   const hasError = showValidation && getFieldError(fieldName)
  //   return hasError 
  //     ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/50' 
  //     : ''
  // }

  const brandCategories = [
    // Core Business Types
    { value: "technology_software", label: "Technology & Software" },
    { value: "finance_fintech", label: "Finance & Fintech" },
    { value: "retail_ecommerce", label: "Retail & E-commerce" },
    { value: "health_medical", label: "Health & Medical" },
    { value: "education_training", label: "Education & Training" },

    // Marketing & Growth
    { value: "marketing_advertising", label: "Marketing & Advertising" },
    { value: "digital_marketing", label: "Digital Marketing & SEO" },
    { value: "content_creation", label: "Content Creation & Media" },
    { value: "analytics_data", label: "Analytics & Data" },
    { value: "ai_optimization", label: "AI Optimization & GEO" },

    // Consumer Goods
    { value: "food_beverage", label: "Food & Beverage" },
    { value: "fashion_apparel", label: "Fashion & Apparel" },
    { value: "beauty_personal_care", label: "Beauty & Personal Care" },
    { value: "home_living", label: "Home & Living" },
    { value: "electronics_gadgets", label: "Electronics & Gadgets" },

    // Services
    { value: "professional_services", label: "Professional Services" },
    { value: "consulting", label: "Consulting" },
    { value: "legal_services", label: "Legal Services" },
    { value: "accounting_finance", label: "Accounting & Finance" },
    { value: "real_estate", label: "Real Estate" },
    { value: "construction", label: "Construction" },

    // Lifestyle & Entertainment
    { value: "media_entertainment", label: "Media & Entertainment" },
    { value: "music_arts", label: "Music & Arts" },
    { value: "sports_fitness", label: "Sports & Fitness" },
    { value: "hospitality_travel", label: "Hospitality & Travel" },
    { value: "events_nightlife", label: "Events & Nightlife" },

    // Specialized
    { value: "agriculture_agribusiness", label: "Agriculture & Agribusiness" },
    { value: "nonprofit_social_impact", label: "Nonprofit & Social Impact" },
    { value: "destination_tourism", label: "Destination & Tourism" },
    { value: "cultural_heritage", label: "Cultural Heritage" },
    { value: "local_business", label: "Local Business" },
    { value: "regional_brand", label: "Regional Brand" },
    { value: "other", label: "Other" }
  ]

  // Countries are now loaded dynamically from database via useCountries hook

  const handleSignOut = async () => {
    try {
      // IMMEDIATE USER FEEDBACK - Clear client data
      CacheManager.clearAllClientData()

      // Use Clerk signOut
      await clerkSignOut()

      // Redirect to signin
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if error, clear local data and redirect
      CacheManager.clearAllClientData()
      router.push('/signin')
    }
  }

  const handleStartOver = () => {
    // Clear cache and reset to beginning
    OnboardingStateCache.clearState()

    // Reset all state
    setStep("user-type")
    setUserType(null)
    setFormData({
      organizationName: "",
      organizationWebsite: "",
      brandCompanyName: "",
      brandCompanyWebsite: "",
      brandCompanyLocation: "",
      brandName: "",
      brandCategory: "",
      brandCategories: [],
      brandWebsite: "",
      targetMarkets: [],
      location: "",
      businessCategory: "",
      businessType: "brand",
      brandKeywords: [], // Brand topics - key areas AI should know about
      productsServices: "", // Legacy field
      businessModel: "",
      targetAudience: "",
      primaryValue: "",
      businessStage: "",
      knownCompetitors: [],
    })
    setAiGeneratedPrompts([])
    setCustomPrompt("")
    setAuditResults(null)
    setValidationErrors([])
    setShowValidation(false)
    setRestoredFromCache(false)
    setCompetitorInputValue("")
  }

  const generateAIPrompts = async (explicitAccountId?: string, explicitBrandId?: string) => {
    setIsGeneratingPrompts(true)
    setPromptGenerationProgress("🧠 Analyzing your market niche & building monitoring prompts...")

    try {
      // Use the new modular services for prompt generation
      const brandName = formData.brandName
      const website = formData.brandWebsite
      const markets = formData.targetMarkets // Use all selected markets
      const location = markets[0] // Use first market for backwards compatibility with location field

      // Create comprehensive request data with business context
      const requestData = {
        brandName,
        location,
        website,
        industry: formData.brandCategories[0] || formData.businessCategory || 'general',
        accountType: userType,
        markets: markets,
        // Company Context (agency/company that owns the brand)
        companyName: formData.organizationName,
        companyWebsite: formData.organizationWebsite,
        companyLocation: formData.location,
        // Business Context for better AI prompts
        businessType: formData.businessType,
        businessCategory: formData.brandCategories[0] || formData.businessCategory || 'general',
        brandTopics: formData.brandKeywords || [], // Brand topics - key areas AI should know about
        productsServices: (formData.brandKeywords || []).join(', ') || formData.productsServices, // Legacy support
        businessModel: formData.businessModel,
        targetAudience: formData.targetAudience,
        primaryValue: formData.primaryValue,
        businessStage: formData.businessStage,
        knownCompetitors: formData.knownCompetitors
      }

      // Check cache first
      const cachedResult = promptCache.get(requestData)
      if (cachedResult) {
        console.log('Using cached AI prompts')
        setPromptGenerationProgress("✅ Loading your monitoring prompts...")
        setAiGeneratedPrompts(cachedResult.prompts)
        if (cachedResult.promptRunResult) {
          setPromptRunResult(cachedResult.promptRunResult)
        }
        return
      }

      // SKIP PAA RESEARCH - Go directly to prompt generation
      console.log('🚀 Skipping PAA research, generating prompts directly from brand context')

      // Step 1: Generate prompts using simple API endpoint with brand context
      const promptResponse = await fetch('/api/content/prompts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: explicitBrandId || currentBrand?.id || null,
          brandContext: {
            brandName: formData.brandName,
            businessCategory: formData.brandCategories[0] || formData.businessCategory || 'general',
            markets: formData.targetMarkets || [],
            topics: formData.brandKeywords || [],
            productsServices: (formData.brandKeywords || []).join(', ') || formData.brandCategories[0] || 'services',
            competitors: formData.knownCompetitors || [],
            website: formData.brandWebsite,
            description: formData.brandDescription || '',
            targetAudience: formData.targetAudience || '',
            primaryValue: formData.primaryValue || '',
            businessModel: formData.businessModel || '',
            businessType: formData.businessType || ''
          },
          questions: [],
        }),
      })

      if (!promptResponse.ok) {
        throw new Error('Failed to generate prompts')
      }

      const runResult = await promptResponse.json()

      if (!runResult.success) {
        throw new Error(runResult.error || 'Failed to generate prompts')
      }

      if (runResult.prompts && runResult.prompts.length > 0) {
        // Store the prompt data for enhanced submission
        setPromptRunResult({ simulatedPrompts: runResult.prompts })

        // Convert to the expected format for UI display
        const formattedPrompts = runResult.prompts.map((prompt: any, index: number) => ({
          id: prompt.id || `prompt_${index}`,
          text: prompt.text,
          category: prompt.category || 'general',
          priority: index + 1,
          rationale: prompt.rationale || 'Generated from brand context'
        }))

        // Cache the successful result for 5 minutes
        promptCache.set(requestData, {
          prompts: formattedPrompts,
          promptRunResult: { simulatedPrompts: runResult.prompts }
        }, 5 * 60 * 1000)

        setPromptGenerationProgress("✅ Your monitoring prompts are ready")
        setAiGeneratedPrompts(formattedPrompts)
      } else {
        throw new Error('No prompts were generated')
      }
    } catch (error) {
      console.error('Error generating AI prompts:', error)
      // Don't generate canned fallback prompts — let the empty state UI
      // prompt the user to add their own queries
      setAiGeneratedPrompts([])
    } finally {
      setIsGeneratingPrompts(false)
      setPromptGenerationProgress("")
    }
  }

  const generateBrandPrompts = (brandName: string, markets: string[]) => {
    if (!brandName || !markets || markets.length === 0) return []

    const marketNames = getCountryNames(markets)
    const primaryMarket = marketNames[0] || 'my region'
    const category = (formData.brandCategories[0] || formData.businessCategory || '')
      .replace(/_/g, ' ').replace(/&/g, 'and')
    const topics = formData.brandKeywords || []
    const competitors = formData.knownCompetitors || []
    const description = formData.brandDescription || ''
    const audience = formData.targetAudience || ''
    const year = new Date().getFullYear()

    // Derive a natural service/product term from context
    const serviceTerm = topics.length > 0
      ? topics[0].toLowerCase()
      : category || 'services'

    const prompts: string[] = []

    // PILLAR 1 — Brand Defense (2 prompts): user already knows the brand
    prompts.push(`Has anyone used ${brandName}? Is it actually worth it in ${primaryMarket}?`)
    if (competitors.length > 0) {
      prompts.push(`How does ${brandName} compare to ${competitors[0]}? Looking for honest opinions`)
    } else {
      prompts.push(`What do people think about ${brandName}? Any real experiences?`)
    }

    // PILLAR 2 — Category Capture (3 prompts): user comparing options, NO brand name
    if (category) {
      prompts.push(`What are the best ${category} options in ${primaryMarket} for ${year}?`)
    } else {
      prompts.push(`What are the best ${serviceTerm} options in ${primaryMarket} for ${year}?`)
    }
    if (topics.length >= 2) {
      prompts.push(`I need help with ${topics[0].toLowerCase()} and ${topics[1].toLowerCase()} — what do people recommend?`)
    } else {
      prompts.push(`Who are the top ${serviceTerm} providers ${audience ? `for ${audience.toLowerCase()}` : `in ${primaryMarket}`}?`)
    }
    if (marketNames.length > 1) {
      prompts.push(`Best ${serviceTerm} in ${marketNames[1]} — what should I consider?`)
    } else {
      prompts.push(`Top rated ${serviceTerm} — honest reviews and comparisons ${year}`)
    }

    // PILLAR 3 — Solution Discovery (3 prompts): user has a problem, NO brand name
    if (description) {
      const snippet = description.toLowerCase().split(/[.!?]/)[0].trim().slice(0, 80)
      prompts.push(`How do I ${snippet.startsWith('we ') ? snippet.slice(3) : snippet}? Any recommendations?`)
    } else {
      prompts.push(`How do I choose the right ${serviceTerm}? What should I look for?`)
    }
    if (topics.length >= 3) {
      prompts.push(`What ${serviceTerm} handles ${topics[2].toLowerCase()} well? Need something reliable`)
    } else {
      prompts.push(`What do ${audience ? audience.toLowerCase() : 'businesses'} in ${primaryMarket} use for ${serviceTerm}?`)
    }
    if (competitors.length >= 2) {
      prompts.push(`${competitors[0]} vs ${competitors[1]} — which one is better and are there other options?`)
    } else {
      prompts.push(`Looking for ${serviceTerm} recommendations — what are my options in ${primaryMarket}?`)
    }

    return prompts
  }

  const runSearchRun = async () => {
    // Prevent duplicate execution
    if (isRunningSearch) {
      console.log('Run already in progress')
      return
    }

    console.log('🚀 Starting background LLM run:', {
      aiGeneratedPromptsLength: aiGeneratedPrompts.length,
      brandName: formData.brandName
    })

    setIsRunningSearch(true)

    try {
      // CRITICAL: Ensure account and brand exist before starting run
      let accountId = currentAccount?.id
      let brandId = currentBrand?.id

      if (!accountId || !brandId) {
        console.log('🏢 No account/brand found - creating them before run...')
        const setupResult = await handleCompleteSetup(false) // Create account/brand without redirecting
        console.log('✅ Account/brand setup completed for run, result:', setupResult)

        // Use the result directly from handleCompleteSetup
        if (setupResult?.account?.id) {
          accountId = setupResult.account.id
          setCurrentAccount(setupResult.account)
          console.log('✅ Got account from setup result:', accountId)
        }
        if (setupResult?.brand?.id) {
          brandId = setupResult.brand.id
          const brandWithWorkspace = {
            ...setupResult.brand,
            workspace_id: setupResult.workspace?.id
          }
          setCurrentBrand(brandWithWorkspace)
          console.log('✅ Got brand from setup result:', brandId)
        }

        // If still missing, fetch directly from database as fallback
        if (!accountId || !brandId) {
          console.log('🔄 Fetching account and brand data from database as fallback...')
          const supabase = getSupabaseClient()

          if (clerkUser) {
            // Get account
            const { data: accountData, error: accountError } = await supabase
              .from('accounts')
              .select('*')
              .eq('owner_clerk_id', clerkUser.id)
              .single()

            if (accountError) {
              console.error('❌ Failed to fetch account:', accountError)
            }

            if (accountData) {
              accountId = accountData.id
              setCurrentAccount(accountData)
              console.log('✅ Retrieved account from DB:', accountData.id)

              // Get brand
              const { data: brandData, error: brandError } = await supabase
                .from('brands')
                .select(`
                  *,
                  workspaces(id)
                `)
                .eq('account_id', accountData.id)
                .single()

              if (brandError) {
                console.error('❌ Failed to fetch brand:', brandError)
              }

              if (brandData) {
                brandId = brandData.id
                const brandWithWorkspace = {
                  ...brandData,
                  workspace_id: brandData.workspaces?.[0]?.id
                }
                setCurrentBrand(brandWithWorkspace)
                console.log('✅ Retrieved brand from DB:', brandData.id)
              }
            }
          } else {
            console.error('❌ No clerkUser available for database lookup')
          }
        }
      }

      // Final verification
      if (!accountId || !brandId) {
        console.error('❌ Still missing required data:', { accountId, brandId })
        throw new Error('Failed to create account and brand - cannot start run')
      }

      console.log('✅ Verified account and brand exist:', { accountId, brandId })

      // Start background run - this will run in the background and create notifications
      console.log('🚀 Starting background run...')

      // FIRE AND FORGET: Don't await the fetch, just trigger it
      fetch('/api/llm-run/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: aiGeneratedPrompts,
          brandName: formData.brandName,
          brandId,
          accountId,
          isOnboarding: true, // Flag to indicate this is an onboarding run - report will be generated
          brandData: {
            knownCompetitors: formData.knownCompetitors || [],
            brandCategory: formData.brandCategories?.[0] || 'other',
            targetMarkets: formData.targetMarkets || []
          },
          formData: {
            brandWebsite: formData.brandWebsite,
            brandCategories: formData.brandCategories,
            targetMarkets: formData.targetMarkets,
            brandKeywords: formData.brandKeywords,
            productsServices: formData.productsServices,
            knownCompetitors: formData.knownCompetitors
          }
        })
      }).catch(err => console.error('Background run trigger error (non-critical):', err))

      // Mark onboarding as complete immediately
      if (user?.id) {
        try {
          console.log('🔄 Marking onboarding as complete...')
          // Fire and forget onboarding completion too
          completeOnboarding(user.id, {
            completed_via: 'background_run_started',
            final_step: 'run_started',
            run_id: `sim_${Date.now()}`, // Placeholder ID
            completed_at: new Date().toISOString()
          }).catch(err => console.error('Onboarding completion error:', err))

          setOnboardingStatus('completed')
        } catch (onboardingError) {
          console.error('❌ Failed to mark onboarding as complete:', onboardingError)
        }
      }

      // Show success toast
      addToast({
        type: 'success',
        title: 'Run Started',
        message: 'Your AI visibility analysis is running in the background. Taking you to your dashboard...',
        duration: 3000
      })

      // IMMEDIATE REDIRECT with run_started flag - Don't wait for anything
      console.log('🚀 Redirecting to dashboard immediately...')
      router.push(`/dashboard?brand=${brandId}&run_started=true`)

    } catch (error) {
      console.error('❌ Failed to start run:', error)
      addToast({
        type: 'error',
        title: 'Run Failed',
        message: error instanceof Error ? error.message : 'Failed to start run. Please try again.',
        duration: 5000
      })
      setIsRunningSearch(false)
    }
  }

  const addCustomPrompt = () => {
    if (customPrompt.trim()) {
      const customPromptId = `custom_${Date.now()}`
      const newPrompt = {
        id: customPromptId,
        text: customPrompt.trim(),
        category: 'custom',
        priority: aiGeneratedPrompts.length + 1,
        rationale: 'User-defined custom prompt'
      }

      setAiGeneratedPrompts((prev) => [...prev, newPrompt])
      setCustomPrompt("")
    }
  }

  const removePrompt = (promptId: string) => {
    setAiGeneratedPrompts((prev) => prev.filter((p) => p.id !== promptId))
  }

  const handleUserTypeSelect = async (type: UserType) => {
    setUserType(type)
    setStep("organization-details")
    await trackStepChange("organization-details")

    // Track user type selection
    try { } catch (error) {
      console.warn('Failed to track user type selection:', error)
    }
  }

  // Helper function to track onboarding step changes
  const trackStepChange = async (newStep: Step) => {
    if (user?.id) {
      const stepToNumber = {
        "user-type": 1,
        "organization-details": 2,
        "brand-company-details": 3,
        "brand-setup": 4,
        "business-context": 5,
        "prompts": 6,
        "progress": 7,
        "ai-report": 8,
        "results": 9
      }
      const stepNumber = stepToNumber[newStep] || 1


      // If onboarding is completed, only update the step without changing status
      if (onboardingStatus === 'completed') {
        await updateOnboardingStep(user.id, stepNumber, {
          step_name: newStep,
          timestamp: new Date().toISOString(),
          preserve_completed_status: true
        })
      } else if (onboardingStatus === 'in_progress') {
        await updateOnboardingStep(user.id, stepNumber, {
          step_name: newStep,
          timestamp: new Date().toISOString()
        })
      }
      setCurrentStep(stepNumber)
    }
  }

  const handleNext = async () => {
    if (step === "organization-details") {
      // Validate form data before proceeding
      const errors = validateFormData(formData, userType, step)
      setValidationErrors(errors)
      setShowValidation(true)

      if (errors.length > 0) {

        const fieldNames = errors.map(error => {
          const fieldMap: Record<string, string> = {
            'organizationName': userType === 'agency' ? 'Agency name' : 'Company name',
            'organizationWebsite': userType === 'agency' ? 'Agency website' : 'Company website'
          }
          return fieldMap[error.field] || error.field
        })

        return
      }

      // For agency, go to brand company details; for in-house, go directly to brand setup
      const nextStep = userType === "agency" ? "brand-company-details" : "brand-setup"
      setStep(nextStep)
      await trackStepChange(nextStep)
    } else if (step === "brand-company-details") {
      // Validate brand company data
      const errors = validateFormData(formData, userType, step)
      setValidationErrors(errors)
      setShowValidation(true)

      if (errors.length > 0) {
        const fieldNames = errors.map(error => {
          const fieldMap: Record<string, string> = {
            'brandCompanyName': 'Brand company name',
            'brandCompanyWebsite': 'Brand company website'
          }
          return fieldMap[error.field] || error.field
        })

        return
      }

      setStep("brand-setup")
      await trackStepChange("brand-setup")
    } else if (step === "brand-setup") {
      // Validate brand setup data
      const errors = validateFormData(formData, userType, step)
      setValidationErrors(errors)
      setShowValidation(true)

      if (errors.length > 0) {
        const fieldNames = errors.map(error => {
          const fieldMap: Record<string, string> = {
            'brandName': 'Brand name',
            'brandCategory': 'Brand category',
            'brandWebsite': 'Brand website',
            'targetMarkets': 'Target markets'
          }
          return fieldMap[error.field] || error.field
        })

        return
      }

      setStep("business-context")
      await trackStepChange("business-context")
    } else if (step === "business-context") {
      // Validate business context before proceeding
      const errors = validateFormData(formData, userType, step)
      setValidationErrors(errors)
      setShowValidation(true)

      if (errors.length > 0) {
        const fieldNames = errors.map(error => error.message)

        return
      }

      setIsLoading(true)
      setIsGeneratingPrompts(true)

      try {
        // Create account and brand before generating prompts so run API works
        console.log('🏢 Creating account and brand before prompts...')
        const setupResult = await handleCompleteSetup(false) // false = don't redirect to dashboard

        // Extract account and brand IDs from setup result for immediate use
        const accountId = setupResult?.account?.id || currentAccount?.id
        const brandId = setupResult?.brand?.id || currentBrand?.id

        console.log('Setup complete, using IDs:', { accountId, brandId })

        // Start AI research and prompt generation with explicit IDs
        await generateAIPrompts(accountId, brandId)
        setStep("prompts")
        await trackStepChange("prompts")
      } catch (error) {
        console.error('Failed to setup account before run:', error)
        // Continue anyway - pass whatever IDs we have, orchestrator will create prompts during run
        try {
          const fallbackAccountId = currentAccount?.id
          const fallbackBrandId = currentBrand?.id
          console.log('Setup failed, generating prompts with fallback IDs:', { fallbackAccountId, fallbackBrandId })
          await generateAIPrompts(fallbackAccountId, fallbackBrandId)
          setStep("prompts")
          await trackStepChange("prompts")
        } catch (promptError) {
          console.error('Failed to generate prompts:', promptError)
        }
      } finally {
        setIsLoading(false)
        setIsGeneratingPrompts(false)
      }
    }
  }

  const handleBack = async () => {
    let targetStep: Step;

    if (step === "results" || step === "ai-report") {
      targetStep = "prompts";
    } else if (step === "prompts") {
      targetStep = "business-context";
    } else if (step === "business-context") {
      targetStep = "brand-setup";
    } else if (step === "brand-setup") {
      // Go back to brand company details for agency, organization details for in-house
      targetStep = userType === "agency" ? "brand-company-details" : "organization-details";
    } else if (step === "brand-company-details") {
      targetStep = "organization-details";
    } else if (step === "organization-details") {
      // Don't go back to user-type if agency mode is disabled (no choice to make)
      if (!agencyEnabled) return;
      targetStep = "user-type";
    } else {
      return; // No valid step to go back to
    }

    setStep(targetStep);
    await trackStepChange(targetStep);
  }

  const handleCompleteSetup = async (redirectToDashboard = true) => {
    const supabase = getSupabaseClient()
    // Only validate required fields for final submission
    const errors: ValidationError[] = []

    // Basic required fields for completion
    if (!formData.organizationName?.trim()) {
      errors.push({ field: 'organizationName', message: userType === 'agency' ? 'Agency name is required' : 'Company name is required' })
    }
    if (!formData.brandName?.trim()) {
      errors.push({ field: 'brandName', message: 'Brand name is required' })
    }
    if (!formData.brandKeywords || formData.brandKeywords.length === 0) {
      errors.push({ field: 'productsServices', message: 'Add at least one topic so we know what to track' })
    }

    // Only set validation errors and show validation if there are actual errors
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowValidation(true)

      const fieldNames = errors.map(error => {
        const fieldMap: Record<string, string> = {
          'organizationName': userType === 'agency' ? 'Agency name' : 'Company name',
          'brandName': 'Brand name',
          'productsServices': 'Brand topics' // Field name updated for new Brand Topics field
        }
        return fieldMap[error.field] || error.field
      })

      throw new Error('Validation failed')
    }

    setIsLoading(true)

    try {
      const locationData = countryOptions.find(loc => loc.value === formData.location)
      const regionMapping: Record<string, string> = {
        'Africa': 'africa',
        'Middle East': 'middle_east',
        'Europe': 'europe',
        'Americas': 'north_america',
        'Oceania': 'asia_pacific',
        'Asia': 'asia_pacific'
      }

      const setupData = {
        company_name: formData.organizationName, // Use organization name for account
        company_website: formData.organizationWebsite, // Company website
        company_location: formData.location, // Company location
        account_type: userType === "agency" ? "agency" : "in_house",
        brand_name: formData.brandName, // Use brand name for the brand
        brand_category: formData.brandCategories[0] || 'other',
        brand_website: formData.brandWebsite,
        website: formData.brandWebsite, // Keep for backward compatibility
        // Brand company information (for agencies)
        brand_company_name: formData.brandCompanyName,
        brand_company_website: formData.brandCompanyWebsite,
        brand_company_location: formData.brandCompanyLocation,
        target_markets: formData.targetMarkets,
        brand_topics: formData.brandKeywords || [], // Brand topics - key areas AI should know about
        products_services: (formData.brandKeywords || []).join(', ') || formData.productsServices, // Legacy support
        business_type: formData.businessType,
        entity_type: formData.entityType, // Entity type for report language (company, personality, etc.)
        business_model: formData.businessModel,
        target_audience: formData.targetAudience,
        primary_value: formData.primaryValue,
        business_stage: formData.businessStage,
        known_competitors: formData.knownCompetitors,
        region: regionMapping[locationData?.region || 'Americas'] || 'africa',
        industry: 'other',
        company_size: 'small',
      }

      const response = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setupData),
      })

      const result = await response.json()

      if (!response.ok) {
        // If company already exists, that's okay - we can proceed
        if (result.error && (result.error.includes('Company already set up') || result.error.includes('already exists'))) {
          console.log('Company already exists, proceeding...')
          // Try to get existing account and brand data
          if (result.account || result.existing) {
            const existingAccount = result.account || result.existing?.account
            const existingBrand = result.brand || result.existing?.brand
            const existingWorkspace = result.workspace || result.existing?.workspace

            setCurrentAccount(existingAccount)

            // Ensure brand has workspace_id for report generation
            if (existingBrand && existingWorkspace) {
              setCurrentBrand({
                ...existingBrand,
                workspace_id: existingWorkspace.id
              })
            } else {
              setCurrentBrand(existingBrand)
            }

            // Return normalized result for use in runSearchRun
            return {
              account: existingAccount,
              brand: existingBrand,
              workspace: existingWorkspace,
              existing: true
            }
          }
        } else {
          throw new Error(result.error || 'Setup failed')
        }
      } else {
        // Update current account and brand state if setup was successful
        if (result.account) {
          setCurrentAccount(result.account)
          console.log('Updated currentAccount:', result.account)
        }
        if (result.brand) {
          // Include workspace_id in the brand object for report generation
          const brandWithWorkspace = {
            ...result.brand,
            workspace_id: result.workspace?.id
          }
          setCurrentBrand(brandWithWorkspace)
          console.log('Updated currentBrand with workspace:', brandWithWorkspace)
        }
      }

      // Remove non-critical toast notification for company setup complete

      // Only mark onboarding as complete if this is the final step (redirect to dashboard)
      if (redirectToDashboard) {
        try {
          // Don't mark onboarding as complete here anymore - only when report is generated
          // await completeOnboarding(user?.id!, { 
          //   completed_via: 'setup_completion',
          //   final_step: 'account_setup',
          //   form_data: formData 
          // })

          // Don't call legacy function either - onboarding only complete after report generation
          // await supabase.rpc('complete_user_onboarding', { user_uuid: user?.id })
          console.log('Account setup complete, onboarding will complete after report generation')

          // Clear the onboarding cache since we've completed successfully
          OnboardingStateCache.clearState()
          console.log('Onboarding cache cleared after completion')
        } catch (onboardingError) {
          console.warn('Failed to mark onboarding as complete:', onboardingError)
          // Don't fail the whole process for this
        }

        // Add success flag to indicate onboarding completion
        setTimeout(() => {
          router.push("/dashboard?onboarding_complete=true")
        }, 1000)
      } else {
        console.log('Account/brand setup complete, continuing onboarding flow...')
      }

      // Return the result for use in onboarding flow
      return result

    } catch (error) {
      console.error('Setup error:', error)
      // Only show error if it's not about company already existing
      if (!(error instanceof Error && error.message.includes('Company already set up'))) {
        throw error
      }
      // Return whatever state we have so callers get account/brand IDs
      if (currentAccount?.id || currentBrand?.id) {
        return {
          account: currentAccount ? { id: currentAccount.id, name: currentAccount.name } : undefined,
          brand: currentBrand ? { id: currentBrand.id, name: currentBrand.name } : undefined,
          existing: true
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const NavigationHeader = () => {
    // Function to determine if a step is accessible/clickable
    const isStepAccessible = (targetStep: Step): boolean => {
      // Define step order and dependencies
      const stepOrder: Step[] = [
        "user-type",
        "organization-details",
        "brand-company-details",
        "brand-setup",
        "business-context",
        "prompts"
      ]

      const currentStepIndex = stepOrder.indexOf(step)
      const targetStepIndex = stepOrder.indexOf(targetStep)

      // User can always go back to previous steps
      if (targetStepIndex <= currentStepIndex) {
        return true
      }

      // For forward navigation, check if requirements are met
      if (targetStep === "organization-details") {
        return userType !== null
      }

      if (targetStep === "brand-company-details") {
        return userType === "agency" && !!formData.organizationName?.trim()
      }

      if (targetStep === "brand-setup") {
        return userType === "inhouse" ? !!formData.organizationName?.trim() :
          !!formData.organizationName?.trim() && !!formData.brandCompanyName?.trim()
      }

      if (targetStep === "business-context") {
        return !!formData.brandName?.trim()
      }

      if (targetStep === "prompts") {
        return !!formData.businessCategory?.trim() && (formData.brandKeywords || []).length > 0
      }

      return false
    }

    // Function to handle step navigation
    const handleStepClick = async (targetStep: Step) => {
      if (isStepAccessible(targetStep)) {
        setStep(targetStep)
        await trackStepChange(targetStep)
      }
    }

    return (
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold">Soma</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-3 text-base text-muted-foreground">
              {agencyEnabled && (
                <>
                  <button
                    onClick={() => handleStepClick("user-type")}
                    className={`transition-colors hover:text-foreground ${step === "user-type" ? "text-foreground font-medium" : ""
                      } ${isStepAccessible("user-type") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                  >
                    Account Type
                  </button>
                  <span>→</span>
                </>
              )}
              <button
                onClick={() => handleStepClick("organization-details")}
                className={`transition-colors hover:text-foreground ${step === "organization-details" ? "text-foreground font-medium" : ""
                  } ${isStepAccessible("organization-details") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
              >
                {userType === "agency" ? "Agency Details" : "Company Details"}
              </button>
              <span>→</span>
              <button
                onClick={() => handleStepClick(userType === "agency" ? "brand-company-details" : "brand-setup")}
                className={`transition-colors hover:text-foreground ${step === "brand-company-details" || step === "brand-setup" || step === "business-context" ? "text-foreground font-medium" : ""
                  } ${isStepAccessible(userType === "agency" ? "brand-company-details" : "brand-setup") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
              >
                  Brand Setup
              </button>
              <span>→</span>
              <button
                onClick={() => handleStepClick("prompts")}
                className={`transition-colors hover:text-foreground ${step === "prompts" ? "text-foreground font-medium" : ""
                  } ${isStepAccessible("prompts") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
              >
                Prompts
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>

              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer />
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8">
        <div className={`mx-auto ${step === "ai-report" ? "max-w-6xl" : step === "prompts" ? "max-w-6xl" : "max-w-4xl"}`}>

          {/* User Type Selection Step */}
          {step === "user-type" && (
            agencyEnabled === null ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
              </div>
            ) : (
              <UserTypeSelection onSelect={handleUserTypeSelect} agencyEnabled={agencyEnabled} />
            )
          )}

          {/* Organization Details Step */}
          {step === "organization-details" && (
            <OrganizationDetailsStep
              formData={formData}
              onFormDataChange={setFormData}
              onNext={handleNext}
              onBack={agencyEnabled ? handleBack : undefined}
              validationErrors={validationErrors}
              showValidation={showValidation}
              isFormLocked={isFormLocked}
              userType={userType}
              countryOptions={countryOptions}
            />
          )}

          {/* Brand Company Details Step (Agency only) */}
          {step === "brand-company-details" && (
            <BrandCompanyDetailsStep
              formData={formData}
              onFormDataChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              validationErrors={validationErrors}
              showValidation={showValidation}
              isFormLocked={isFormLocked}
              countryOptions={countryOptions}
            />
          )}

          {/* Brand Setup Step */}
          {step === "brand-setup" && (
            <BrandSetupStep
              formData={formData}
              onFormDataChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              validationErrors={validationErrors}
              showValidation={showValidation}
              isFormLocked={isFormLocked}
              userType={userType}
            />
          )}

          {/* Business Context Step */}
          {step === "business-context" && (
            <BusinessContextStep
              formData={formData}
              onFormDataChange={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              validationErrors={validationErrors}
              showValidation={showValidation}
              isFormLocked={isFormLocked}
              isGeneratingPrompts={isGeneratingPrompts}
              countryOptions={countryOptions}
            />
          )}

          {/* Prompts Step */}
          {step === "prompts" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2 text-foreground">Your Monitoring Prompts</h1>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  These are the questions real people ask ChatGPT, Gemini, and Claude. We&apos;ll check every response to see if <span className="font-medium text-foreground">{formData.brandName}</span> gets recommended — and where you rank against competitors.
                </p>
              </div>

              <div className="bg-background border-2 border-border rounded-2xl p-6">
                <button
                  onClick={handleBack}
                  className="flex items-center text-muted-foreground hover:text-black mb-6 font-medium transition-colors text-base"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to visibility niche
                </button>

                <div className="mb-4">
                  <h2 className="text-base font-bold text-foreground mb-1">Prompts to track</h2>
                  <p className="text-xs text-muted-foreground">These prompts define your visibility niche. Remove any that aren&apos;t relevant, or add your own below.</p>
                </div>

                <div className="space-y-4">
                  {aiGeneratedPrompts.length === 0 && !isGeneratingPrompts ? (
                    <div className="space-y-6">
                      {/* Header Section */}
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Plus className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Add Your Monitoring Prompts</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            We couldn&apos;t auto-generate prompts this time. Add the questions you want to track — these are what people ask AI when looking for a brand like yours.
                          </p>
                        </div>
                      </div>

                      {/* Input Section */}
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <Label className="text-sm font-medium text-foreground mb-3 block">
                          Add a prompt
                        </Label>
                        <div className="space-y-3">
                          <div className="relative">
                            <Textarea
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              placeholder="e.g., 'What are the best digital marketing agencies in Kenya?' or 'Top fintech companies for small businesses'"
                              className="min-h-[100px] resize-none text-sm border-gray-300 focus:border-primary focus:ring-primary"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault()
                                  addCustomPrompt()
                                }
                              }}
                            />
                          </div>

                          {/* Action Buttons - consistent positioning */}
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={async () => {
                                if (!customPrompt.trim()) return
                                setIsPolishingPrompt(true)
                                try {
                                  const response = await fetch('/api/content/prompts/enhance', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      prompt: customPrompt,
                                      brandContext: {
                                        brandName: formData.brandName,
                                        businessCategory: formData.businessCategory,
                                        markets: formData.targetMarkets
                                      }
                                    })
                                  })
                                  const data = await response.json()
                                  if (data.success) {
                                    setCustomPrompt(data.enhancedPrompt)
                                  }
                                } catch (error) {
                                  console.error('Failed to enhance prompt:', error)
                                } finally {
                                  // Always reset loading state with a small delay to ensure UI updates
                                  setTimeout(() => setIsPolishingPrompt(false), 100)
                                }
                              }}
                              disabled={!customPrompt.trim() || isPolishingPrompt}
                              variant="outline"
                              size="sm"
                              className="h-9 px-4 text-sm"
                              title="Enhance your prompt with AI"
                            >
                              {isPolishingPrompt ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                                  Polishing...
                                </>
                              ) : (
                                <>
                                  ✨ AI Polish
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={addCustomPrompt}
                              disabled={!customPrompt.trim()}
                              size="sm"
                              className="h-9 px-4 text-sm"
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Add Prompt
                            </Button>
                          </div>

                          {/* Prompt Tips */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <p className="text-xs text-blue-700 font-medium mb-1">💡 Tip: Write prompts the way a real person would ask AI</p>
                            <p className="text-xs text-blue-600">e.g., &quot;What are the best [your category] in [your market]?&quot; or &quot;Who should I hire for [your service]?&quot;</p>
                          </div>
                        </div>
                      </div>

                      {/* Generated Prompts Display */}
                      {aiGeneratedPrompts.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-foreground text-sm flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Your Monitoring Prompts ({aiGeneratedPrompts.length})
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {aiGeneratedPrompts.map((prompt, index) => (
                              <div key={prompt.id} className="group flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-medium text-primary">{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground leading-relaxed">
                                    {prompt.prompt || prompt.text}
                                  </p>
                                </div>
                                <button
                                  onClick={() => removePrompt(prompt.id)}
                                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all duration-200"
                                  title="Remove this prompt"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isGeneratingPrompts ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                        <p className="text-muted-foreground text-sm font-medium">
                          🎯 Building your monitoring prompts from search intelligence...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Research → Search Data → High-Intent Prompts → Ranking for {formData.targetMarkets.map((marketCode, index) => {
                            const market = countryOptions.find(opt => opt.value === marketCode)
                            const marketName = market?.label.split(" ").slice(1).join(" ") || marketCode
                            if (index === formData.targetMarkets.length - 1 && formData.targetMarkets.length > 1) {
                              return `and ${marketName}`
                            } else if (index === formData.targetMarkets.length - 2 && formData.targetMarkets.length > 2) {
                              return `${marketName}, `
                            } else if (index < formData.targetMarkets.length - 1) {
                              return `${marketName}, `
                            }
                            return marketName
                          }).join("")} • Target: Under 40 seconds
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {aiGeneratedPrompts.map((prompt) => (
                          <div
                            key={prompt.id}
                            className="group flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 hover:shadow-sm"
                          >
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 leading-relaxed">{prompt.text}</p>

                              {/* Show testing status and context */}
                              {promptTestingStatus[prompt.id] && (
                                <div className="mt-2 flex items-center gap-2">
                                  {promptTestingStatus[prompt.id].status === 'testing' && (
                                    <div className="flex items-center gap-2 text-xs text-blue-600">
                                      <div className="w-3 h-3 rounded-full bg-blue-200 animate-pulse"></div>
                                      <span>Testing with {promptTestingStatus[prompt.id].currentModel}...</span>
                                    </div>
                                  )}
                                  {promptTestingStatus[prompt.id].status === 'completed' && (
                                    <div className="flex items-center gap-2 text-xs text-green-600">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <span>Analysis complete</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-slate-500">
                                    {promptTestingStatus[prompt.id].context}
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => removePrompt(prompt.id)}
                              className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all duration-200 group-hover:opacity-100 opacity-60"
                              title="Remove this prompt"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add your own prompt - only show after prompts are generated */}
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-medium text-foreground text-sm mb-3">Add your own prompt</h4>
                        <div className="space-y-3">
                          <Textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g., Best marketing agencies for SaaS companies in the US"
                            className="min-h-[60px] resize-none text-sm border-gray-300 focus:border-primary focus:ring-primary"
                            disabled={isFormLocked}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                addCustomPrompt()
                              }
                            }}
                          />

                          {/* Action Buttons - consistent positioning */}
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={async () => {
                                if (!customPrompt.trim()) return
                                setIsPolishingPrompt(true)
                                try {
                                  const response = await fetch('/api/content/prompts/enhance', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      prompt: customPrompt,
                                      brandContext: {
                                        brandName: formData.brandName,
                                        businessCategory: formData.businessCategory,
                                        markets: formData.targetMarkets
                                      }
                                    })
                                  })
                                  const data = await response.json()
                                  if (data.success) {
                                    setCustomPrompt(data.enhancedPrompt)
                                  }
                                } catch (error) {
                                  console.error('Failed to enhance prompt:', error)
                                } finally {
                                  // Always reset loading state with a small delay to ensure UI updates
                                  setTimeout(() => setIsPolishingPrompt(false), 100)
                                }
                              }}
                              disabled={!customPrompt.trim() || isFormLocked || isPolishingPrompt}
                              variant="outline"
                              size="sm"
                              className="h-9 px-4 text-sm"
                              title="Enhance your prompt with AI"
                            >
                              {isPolishingPrompt ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                                  Polishing...
                                </>
                              ) : (
                                <>
                                  ✨ AI Polish
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={addCustomPrompt}
                              disabled={!customPrompt.trim() || isFormLocked}
                              size="sm"
                              className="h-9 px-4 text-sm"
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Add Prompt
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-foreground">Ready to analyze:</span>
                          <div className="flex gap-1">
                            {formData.targetMarkets.slice(0, 2).map((marketCode) => {
                              const market = countryOptions.find(opt => opt.value === marketCode)
                              return (
                                <span key={marketCode} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                                  {market?.label}
                                </span>
                              )
                            })}
                            {formData.targetMarkets.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{formData.targetMarkets.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => {
                          console.log('🔄 Create Account button clicked!', {
                            isRunningSearch,
                            aiGeneratedPromptsLength: aiGeneratedPrompts.length,
                            buttonDisabled: isRunningSearch || aiGeneratedPrompts.length === 0
                          })
                          // Start run in background and redirect to dashboard (skip progress step)
                          runSearchRun()
                        }}
                        disabled={isRunningSearch || aiGeneratedPrompts.length === 0 || isFormLocked}
                        className="flex-1 h-10 text-sm font-medium"
                      >
                        {isRunningSearch ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Starting analysis...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Launch AI Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Progress Step */}
          {step === "progress" && (
            <div className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-black">
                  AI Visibility Analysis in Progress
                </h2>
                <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Querying {aiGeneratedPrompts.length} prompts across {formData.targetMarkets?.length || 1} market{(formData.targetMarkets?.length || 1) > 1 ? 's' : ''} on ChatGPT, Gemini, Claude, and Perplexity.
                </p>
              </div>

              <InlineAIProgress
                brandName={formData.brandName || 'Your Brand'}
                targetMarkets={formData.targetMarkets || []}
                runId={runId || undefined}
                promptCount={aiGeneratedPrompts.length}
                modelCount={4}
                onComplete={async (results) => {
                  console.log('✅ Run complete via InlineAIProgress')

                  // Mark onboarding as complete
                  if (user?.id) {
                    try {
                      console.log('🔄 Marking onboarding as complete...')
                      await completeOnboarding(user.id, {
                        completed_via: 'run_complete',
                        final_step: 'ai_run_completed',
                        completed_at: new Date().toISOString()
                      })
                      console.log('✅ Onboarding marked as complete')
                    } catch (error) {
                      console.error('❌ Failed to mark onboarding complete:', error)
                    }
                  }

                  // Skip report generation and go directly to dashboard
                  console.log('🎯 Redirecting to dashboard...')
                  router.push('/dashboard?onboarding_complete=true')
                }}
              />

              <div className="flex justify-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep("prompts")}
                  className="min-w-[120px]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Results Step */}
          {step === "results" && auditResults && (
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-4 text-foreground">
                  Your AI Visibility Report
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  See how your brand performs across leading AI models and discover optimization opportunities
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg mb-8">
                  <button
                    onClick={async () => {
                      setStep("ai-report")
                      await trackStepChange("ai-report")
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    📊 Executive Summary
                  </button>
                  <button
                    className="flex-1 px-4 py-2 text-sm font-medium bg-background text-foreground rounded-md shadow-sm"
                  >
                    🔍 Raw Results (Diagnostic)
                  </button>
                  {/* Always show dashboard button when audit results exist */}
                  {auditResults && (
                    <button
                      onClick={() => {
                        console.log('Dashboard button clicked from results page, redirecting...')
                        window.location.href = '/dashboard'
                      }}
                      className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                    >
                      Go to Dashboard →
                    </button>
                  )}
                  {/* Debug: Show status when no audit results */}
                  {!auditResults && (
                    <div className="px-4 py-2 text-xs text-muted-foreground border rounded">
                      Generate your AI audit report to access the dashboard
                    </div>
                  )}
                </div>

                {/* Raw Results Table */}
                <RawResultsTable auditResults={auditResults} />
              </div>
            </div>
          )}

          {/* AI Report Step */}
          {step === "ai-report" && auditResults && (
            <div className="space-y-8">
              <OnboardingReportPreview
                auditResults={auditResults}
                brandName={formData.brandName}
                brandId={currentBrand?.id}
                isNavigatingToReport={isNavigatingToReport}
                onSeeFullReport={async () => {
                  if (currentBrand?.id) {
                    setIsNavigatingToReport(true)
                    try {
                      // If we have a generated report ID, navigate directly to it
                      if (generatedReportId) {
                        console.log('✅ Navigating to generated report:', generatedReportId)
                        router.push(`/dashboard/reports/${generatedReportId}`)
                      } else {
                        console.log('⚠️ No generated report ID found, fetching latest report for brand:', currentBrand.id)

                        // Try to fetch the latest report for this brand
                        try {
                          const response = await fetch(`/api/reports?brandId=${currentBrand.id}&limit=1&orderBy=created_at&order=desc`)
                          if (response.ok) {
                            const data = await response.json()
                            if (data.reports && data.reports.length > 0) {
                              const latestReportId = data.reports[0].id
                              console.log('✅ Found latest report, navigating to:', latestReportId)
                              router.push(`/dashboard/reports/${latestReportId}`)
                              return
                            }
                          }
                        } catch (error) {
                          console.error('❌ Failed to fetch latest report:', error)
                        }

                        // Final fallback to the reports list page
                        console.log('📋 No reports found, navigating to reports list page')
                        router.push(`/dashboard/reports?brandId=${currentBrand.id}`)
                      }
                    } finally {
                      // Reset loading state after navigation (may not execute if page changes)
                      setTimeout(() => setIsNavigatingToReport(false), 2000)
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Note: Old modal progress component removed - now using inline progress */}
    </div>
  )
}