"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useBrand } from "@/lib/contexts/brand-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus,
  FileText,
  Eye,
  Search,
  BarChart3,
  Users,
  Quote,
  Loader2,
  ArrowLeft,
  CheckCircle
} from "lucide-react"

interface ReportType {
  value: string
  label: string
  description: string
  icon: any
  color: string
  badge?: string
}

const REPORT_TYPES: ReportType[] = [
  { 
    value: 'brand_visibility', 
    label: 'Brand Visibility', 
    description: 'Track how often your brand appears in AI responses across platforms',
    icon: Eye,
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  { 
    value: 'visibility_report_external', 
    label: 'Visibility Report (External)', 
    description: 'Comprehensive shareable brand visibility report with AI Visibility metrics and platform intelligence',
    icon: Eye,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    badge: 'Shareable'
  },
  { 
    value: 'brand_discoverability', 
    label: 'Brand Discoverability', 
    description: 'Analyze how discoverable your brand is across AI platforms and search queries',
    icon: Search,
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  { 
    value: 'brand_audit', 
    label: 'Brand Audit', 
    description: 'Comprehensive analysis of brand performance and competitive positioning',
    icon: FileText,
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  { 
    value: 'brand_mentions', 
    label: 'Brand Mentions', 
    description: 'Track and analyze brand mentions across AI conversations with sentiment analysis',
    icon: Quote,
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  { 
    value: 'brand_competitors', 
    label: 'Brand Competitors', 
    description: 'Compare your brand against key competitors in AI search results',
    icon: Users,
    color: 'bg-red-50 border-red-200 text-red-800'
  },
  { 
    value: 'sources_citations', 
    label: 'Sources & Citations', 
    description: 'Analyze citation sources, authority scores, and content attribution',
    icon: BarChart3,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  }
]

const PLATFORMS = [
  { value: 'chatgpt', label: 'ChatGPT', description: 'OpenAI\'s conversational AI' },
  { value: 'claude', label: 'Claude', description: 'Anthropic\'s AI assistant' },
  { value: 'gemini', label: 'Gemini', description: 'Google\'s AI platform' },
  { value: 'perplexity', label: 'Perplexity', description: 'AI-powered search engine' },
  { value: 'copilot', label: 'Microsoft Copilot', description: 'Microsoft\'s AI assistant' }
]

export default function CreateReportPage() {
  const { currentBrand } = useBrand()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    report_type: '',
    dateRangeStart: '',
    dateRangeEnd: '',
    platforms: [] as string[],
    includeCompetitors: true,
    includeSentiment: true,
    includeSources: true
  })

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      platforms: checked 
        ? [...prev.platforms, platform]
        : prev.platforms.filter(p => p !== platform)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentBrand || !formData.report_type) {
      setError('Please select a brand and report type')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Clerk handles authentication server-side; no client Supabase session required

      // First create the report entry
      console.log('🚀 Creating report with data:', {
        brand_id: currentBrand.id,
        title: formData.title || `${REPORT_TYPES.find(t => t.value === formData.report_type)?.label} Report`,
        report_type: formData.report_type,
      })

      const createResponse = await fetch('/api/reports/brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          title: formData.title || `${REPORT_TYPES.find(t => t.value === formData.report_type)?.label} Report`,
          description: formData.description,
          report_type: formData.report_type,
          date_range_start: formData.dateRangeStart || null,
          date_range_end: formData.dateRangeEnd || null,
          platforms_filter: formData.platforms.length > 0 ? formData.platforms : null,
          include_competitors: formData.includeCompetitors,
          include_sentiment: formData.includeSentiment,
          include_sources: formData.includeSources
        }),
      })

      console.log('📡 Response status:', createResponse.status, createResponse.statusText)

      // Get response text first to debug
      const responseText = await createResponse.text()
      console.log('📄 Response body:', responseText)

      if (!createResponse.ok) {
        let errorMessage = 'Failed to create report'
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
          console.error('❌ Error from API:', errorData)
        } catch (jsonError) {
          errorMessage = responseText || createResponse.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      let createResult
      try {
        createResult = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Failed to parse response:', responseText)
        throw new Error('Invalid response from server')
      }

      console.log('✅ Parsed response:', createResult)

      // Handle both response formats: { data: report } or report directly
      const report = createResult.data || createResult
      console.log('📊 Report type from API:', report.report_type)
      console.log('📊 Full report object:', report)
      const reportId = report.id

      if (!reportId) {
        console.error('❌ No report ID in response:', createResult)
        throw new Error('No report ID returned from server')
      }

      console.log('🎉 Report created successfully with ID:', reportId)

      // The report is already generated by the service if auto_generate=true (default)
      // No need for a second API call
      
      // Navigate to the report details page
      router.push(`/dashboard/reports/${reportId}`)

    } catch (error: any) {
      console.error('Error creating report:', error)
      setError(error.message || 'Failed to create report')
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedReportType = REPORT_TYPES.find(t => t.value === formData.report_type)

  if (!currentBrand) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Brand Selected</h3>
          <p className="text-gray-500">Please select a brand to create a report.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/reports')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Report</h1>
          <p className="text-gray-600 mt-1">
            Generate a comprehensive brand report for {currentBrand.name}
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-sm font-medium">Error:</span>
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
          {/* Report Type Selection */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Choose Report Type</CardTitle>
              <CardDescription>
                Select the type of analysis you want to generate for {currentBrand.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REPORT_TYPES.map((type) => {
                  const Icon = type.icon
                  const isSelected = formData.report_type === type.value
                  return (
                    <div
                      key={type.value}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, report_type: type.value }))}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${type.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{type.label}</h3>
                            {type.badge && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                {type.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Report Details</CardTitle>
              <CardDescription>
                Configure the basic information for your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Report Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder={selectedReportType ? `${selectedReportType.label} Report - ${currentBrand.name}` : "Enter report title"}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for this report..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Filters and Options */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Report Configuration</CardTitle>
              <CardDescription>
                Customize the scope and filters for your analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div>
                <Label className="text-base font-medium text-gray-900">Date Range (Optional)</Label>
                <p className="text-sm text-gray-600 mb-3">Limit analysis to a specific time period</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateStart" className="text-sm text-gray-700">Start Date</Label>
                    <Input
                      id="dateStart"
                      type="date"
                      value={formData.dateRangeStart}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateRangeStart: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateEnd" className="text-sm text-gray-700">End Date</Label>
                    <Input
                      id="dateEnd"
                      type="date"
                      value={formData.dateRangeEnd}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateRangeEnd: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Platform Selection */}
              <div>
                <Label className="text-base font-medium text-gray-900">AI Platforms (Optional)</Label>
                <p className="text-sm text-gray-600 mb-3">Select specific platforms to analyze</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PLATFORMS.map((platform) => (
                    <div key={platform.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={platform.value}
                        checked={formData.platforms.includes(platform.value)}
                        onCheckedChange={(checked) => 
                          handlePlatformToggle(platform.value, checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor={platform.value} className="text-sm font-medium cursor-pointer">
                          {platform.label}
                        </Label>
                        <p className="text-xs text-gray-500">{platform.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.platforms.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">All platforms will be included in the analysis</p>
                )}
              </div>

              <Separator />

              {/* Additional Options */}
              <div>
                <Label className="text-base font-medium text-gray-900">Analysis Options</Label>
                <p className="text-sm text-gray-600 mb-3">Choose what to include in your report</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id="competitors"
                      checked={formData.includeCompetitors}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, includeCompetitors: checked as boolean }))
                      }
                    />
                    <div>
                      <Label htmlFor="competitors" className="text-sm font-medium cursor-pointer">
                        Competitor Analysis
                      </Label>
                      <p className="text-xs text-gray-500">Include analysis of competitor mentions and positioning</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id="sentiment"
                      checked={formData.includeSentiment}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, includeSentiment: checked as boolean }))
                      }
                    />
                    <div>
                      <Label htmlFor="sentiment" className="text-sm font-medium cursor-pointer">
                        Sentiment Analysis
                      </Label>
                      <p className="text-xs text-gray-500">Analyze positive, negative, and neutral sentiment in mentions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id="sources"
                      checked={formData.includeSources}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, includeSources: checked as boolean }))
                      }
                    />
                    <div>
                      <Label htmlFor="sources" className="text-sm font-medium cursor-pointer">
                        Source Citations
                      </Label>
                      <p className="text-xs text-gray-500">Include detailed analysis of citation sources and authority</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Ready to Generate Report?</h3>
                  <p className="text-sm text-gray-600">
                    {selectedReportType 
                      ? `Create a ${selectedReportType.label.toLowerCase()} report for ${currentBrand.name}`
                      : 'Please select a report type to continue'
                    }
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/reports')}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!formData.report_type || isGenerating}
                    className="flex items-center gap-2 min-w-[140px]"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}