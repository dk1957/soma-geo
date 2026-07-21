/**
 * Crawler Analytics Page
 * 
 * Track AI bot visits, analyze robots.txt configuration,
 * and manage crawler access to your site for optimal AI visibility.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useBrand } from "@/lib/contexts/brand-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Bot, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Download,
  Eye,
  Clock,
  TrendingUp,
  Shield,
  Loader2,
  ExternalLink,
  Settings,
  Sparkles,
  ArrowRight,
  Brain,
  Info,
  Zap,
  Globe,
  FileCode
} from "lucide-react"
import { useToast } from "@/components/layout/notification-toast"
import Link from "next/link"

interface CrawlerVisit {
  id: string
  crawler_name: string
  user_agent: string
  url_visited: string
  timestamp: string
  status_code: number
  response_time_ms: number
}

interface RobotsTxtConfig {
  allow_googlebot: boolean
  allow_google_extended: boolean
  allow_gptbot: boolean
  allow_claudebot: boolean
  allow_perplexitybot: boolean
  allow_bingbot: boolean
  sitemap_url: string
  custom_rules: string
}

const AI_CRAWLERS = [
  { 
    name: 'GPTBot', 
    description: 'OpenAI\'s crawler for ChatGPT', 
    color: 'bg-green-500',
    colorText: 'text-green-500',
    colorBg: 'bg-green-500/10',
    importance: 'Critical for ChatGPT visibility',
    userAgent: 'GPTBot'
  },
  { 
    name: 'Claude-Web', 
    description: 'Anthropic\'s crawler for Claude', 
    color: 'bg-purple-500',
    colorText: 'text-purple-500',
    colorBg: 'bg-purple-500/10',
    importance: 'Required for Claude AI responses',
    userAgent: 'Claude-Web'
  },
  { 
    name: 'PerplexityBot', 
    description: 'Perplexity AI\'s crawler', 
    color: 'bg-blue-500',
    colorText: 'text-blue-500',
    colorBg: 'bg-blue-500/10',
    importance: 'Powers Perplexity search results',
    userAgent: 'PerplexityBot'
  },
  { 
    name: 'Google-Extended', 
    description: 'Google\'s AI training crawler', 
    color: 'bg-yellow-500',
    colorText: 'text-yellow-500',
    colorBg: 'bg-yellow-500/10',
    importance: 'Used for Gemini/Bard AI training',
    userAgent: 'Google-Extended'
  },
  { 
    name: 'CCBot', 
    description: 'Common Crawl bot', 
    color: 'bg-gray-500',
    colorText: 'text-gray-500',
    colorBg: 'bg-gray-500/10',
    importance: 'Dataset used by many AI models',
    userAgent: 'CCBot'
  },
  { 
    name: 'Amazonbot', 
    description: 'Amazon\'s crawler', 
    color: 'bg-orange-500',
    colorText: 'text-orange-500',
    colorBg: 'bg-orange-500/10',
    importance: 'Alexa and Amazon AI services',
    userAgent: 'Amazonbot'
  }
]

export default function CrawlerAnalyticsPage() {
  const { currentBrand } = useBrand()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [crawlerVisits, setCrawlerVisits] = useState<CrawlerVisit[]>([])
  const [robotsConfig, setRobotsConfig] = useState<RobotsTxtConfig>({
    allow_googlebot: true,
    allow_google_extended: true,
    allow_gptbot: true,
    allow_claudebot: true,
    allow_perplexitybot: true,
    allow_bingbot: true,
    sitemap_url: '',
    custom_rules: ''
  })
  const [currentRobotsTxt, setCurrentRobotsTxt] = useState<string>('')
  const [generatedRobotsTxt, setGeneratedRobotsTxt] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [robotsAnalysis, setRobotsAnalysis] = useState<any>(null)

  const fetchData = useCallback(async () => {
    if (!currentBrand?.id) return
    setIsLoading(true)
    
    try {
      setCrawlerVisits([])
      
      // Fetch robots.txt analysis if site URL is available
      if (currentBrand.company_website || currentBrand.primary_domain) {
        const siteUrl = currentBrand.company_website || `https://${currentBrand.primary_domain}`
        const response = await fetch('/api/discoverability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze-robots',
            brand_id: currentBrand.id,
            url: siteUrl
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setRobotsAnalysis(data.analysis)
          setCurrentRobotsTxt(data.analysis?.raw_content || '')
          
          // Pre-fill sitemap URL if found
          if (data.analysis?.raw_content?.includes('Sitemap:')) {
            const sitemapMatch = data.analysis.raw_content.match(/Sitemap:\s*(.+)/i)
            if (sitemapMatch) {
              setRobotsConfig(prev => ({ ...prev, sitemap_url: sitemapMatch[1].trim() }))
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching crawler data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentBrand?.id, currentBrand?.company_website, currentBrand?.primary_domain])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const analyzeRobotsTxt = async () => {
    const siteUrl = currentBrand?.company_website || (currentBrand?.primary_domain ? `https://${currentBrand.primary_domain}` : null)
    if (!siteUrl || !currentBrand?.id) {
      addToast({ type: 'error', title: 'Error', message: 'Please set a website URL for this brand first.' })
      return
    }
    
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/discoverability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-robots',
          brand_id: currentBrand.id,
          url: siteUrl
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setRobotsAnalysis(data.analysis)
        setCurrentRobotsTxt(data.analysis?.raw_content || '')
        addToast({ type: 'success', title: 'Analysis Complete', message: 'Your robots.txt has been analyzed.' })
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to analyze robots.txt.' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateRobotsTxt = async () => {
    try {
      const response = await fetch('/api/discoverability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-robots',
          brand_id: currentBrand?.id,
          config: {
            ...robotsConfig,
            sitemap_url: robotsConfig.sitemap_url || undefined
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedRobotsTxt(data.robots_txt)
        addToast({ type: 'success', title: 'Generated!', message: 'Your optimized robots.txt is ready.' })
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to generate robots.txt.' })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast({ type: 'success', title: 'Copied!', message: 'Copied to clipboard.' })
  }

  const getCrawlerStatus = (crawlerName: string): 'allowed' | 'blocked' | 'unknown' => {
    if (!robotsAnalysis?.ai_crawler_rules) return 'unknown'
    const rule = robotsAnalysis.ai_crawler_rules.find((r: any) => 
      r.crawler.toLowerCase() === crawlerName.toLowerCase()
    )
    return rule?.status || 'unknown'
  }

  const allowedCount = robotsAnalysis?.ai_crawler_rules?.filter((r: any) => r.status === 'allowed').length || 0
  const blockedCount = robotsAnalysis?.ai_crawler_rules?.filter((r: any) => r.status === 'blocked').length || 0
  const totalCrawlers = robotsAnalysis?.ai_crawler_rules?.length || AI_CRAWLERS.length

  if (!currentBrand) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Bot className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Brand Selected</h2>
          <p className="text-muted-foreground">Please select a brand to manage crawler access.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your crawler configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Crawler Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Control which AI bots can crawl your site to improve visibility in AI responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/technical-seo">
              <Brain className="h-4 w-4 mr-2" />
              Technical SEO
            </Link>
          </Button>
        </div>
      </div>

      {/* Value Proposition */}
      <Alert className="border-blue-500/20 bg-blue-500/5">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <AlertTitle>Why AI Crawler Access Matters</AlertTitle>
        <AlertDescription>
          AI assistants like ChatGPT, Claude, and Perplexity use web crawlers to learn about brands.
          If you block these crawlers in robots.txt, your brand won't appear in their responses.
          <strong className="text-foreground"> Allow AI crawlers to maximize your visibility.</strong>
        </AlertDescription>
      </Alert>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">robots.txt Status</p>
                <p className="text-2xl font-bold mt-1">
                  {robotsAnalysis?.exists ? 'Found' : 'Not Found'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${robotsAnalysis?.exists ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                {robotsAnalysis?.exists ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Crawlers Allowed</p>
                <p className="text-2xl font-bold mt-1 text-green-500">
                  {allowedCount}/{totalCrawlers}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Crawlers Blocked</p>
                <p className={`text-2xl font-bold mt-1 ${blockedCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {blockedCount}/{totalCrawlers}
                </p>
              </div>
              <div className={`p-3 rounded-full ${blockedCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                {blockedCount > 0 ? (
                  <XCircle className="h-6 w-6 text-red-500" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visibility Score</p>
                <p className={`text-2xl font-bold mt-1 ${
                  allowedCount === totalCrawlers ? 'text-green-500' : 
                  allowedCount >= totalCrawlers / 2 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {Math.round((allowedCount / totalCrawlers) * 100)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-200 h-12 rounded-lg p-1 gap-1 w-full">
          <TabsTrigger value="overview" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">Crawler Status</TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">robots.txt Analysis</TabsTrigger>
          <TabsTrigger value="generator" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">Generate Optimized</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Crawler Access Status</CardTitle>
              <CardDescription>
                Each of these crawlers helps different AI assistants learn about your brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {AI_CRAWLERS.map((crawler) => {
                  const status = getCrawlerStatus(crawler.name)
                  const isAllowed = status === 'allowed' || status === 'unknown'
                  
                  return (
                    <div 
                      key={crawler.name}
                      className={`p-4 rounded-lg border ${
                        isAllowed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${crawler.colorBg}`}>
                            <Bot className={`h-5 w-5 ${crawler.colorText}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{crawler.name}</h4>
                              <Badge variant={isAllowed ? 'default' : 'destructive'} className="text-xs">
                                {isAllowed ? 'Allowed' : 'Blocked'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{crawler.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              <span className="font-medium">Why it matters:</span> {crawler.importance}
                            </p>
                          </div>
                        </div>
                        {isAllowed ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {blockedCount > 0 && (
                <Alert className="mt-6" variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>AI Visibility Issue Detected</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p>
                      You have {blockedCount} AI crawler(s) blocked. This means your brand won't appear 
                      in responses from those AI assistants.
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-3"
                      onClick={() => setActiveTab('generator')}
                    >
                      Generate Optimized robots.txt
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How AI Crawlers Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="p-3 rounded-full bg-blue-500/10 w-fit mx-auto mb-3">
                    <Globe className="h-6 w-6 text-blue-500" />
                  </div>
                  <h4 className="font-semibold mb-2">1. Crawlers Visit Your Site</h4>
                  <p className="text-sm text-muted-foreground">
                    AI companies send bots to read and index your website content, similar to search engines.
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="p-3 rounded-full bg-purple-500/10 w-fit mx-auto mb-3">
                    <Shield className="h-6 w-6 text-purple-500" />
                  </div>
                  <h4 className="font-semibold mb-2">2. robots.txt Controls Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Your robots.txt file tells crawlers what they can and can't access on your site.
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="p-3 rounded-full bg-green-500/10 w-fit mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-green-500" />
                  </div>
                  <h4 className="font-semibold mb-2">3. AI Learns Your Brand</h4>
                  <p className="text-sm text-muted-foreground">
                    When crawlers can access your content, AI assistants can recommend your brand to users.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Current robots.txt Analysis</CardTitle>
                  <CardDescription>
                    {currentBrand.company_website || currentBrand.primary_domain 
                      ? `Analyzing robots.txt for ${currentBrand.company_website || currentBrand.primary_domain}`
                      : 'Set a website URL to analyze your robots.txt'}
                  </CardDescription>
                </div>
                <Button onClick={analyzeRobotsTxt} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {robotsAnalysis ? (
                <>
                  {/* Analysis Summary */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        AI Crawler Rules
                      </h4>
                      <div className="space-y-2">
                        {robotsAnalysis.ai_crawler_rules?.map((rule: any) => (
                          <div key={rule.crawler} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                rule.status === 'allowed' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <span className="text-sm font-medium">{rule.crawler}</span>
                              <span className="text-xs text-muted-foreground">({rule.company})</span>
                            </div>
                            <Badge variant={rule.status === 'allowed' ? 'default' : 'destructive'}>
                              {rule.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Issues & Recommendations
                      </h4>
                      <div className="space-y-2">
                        {robotsAnalysis.issues?.length > 0 ? (
                          robotsAnalysis.issues.map((issue: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{issue}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-start gap-2 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span className="text-sm">No issues found - your robots.txt looks good!</span>
                          </div>
                        )}

                        {robotsAnalysis.recommendations?.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-3 rounded-lg border">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Raw Content */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Raw robots.txt Content</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(currentRobotsTxt)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Textarea
                      value={currentRobotsTxt || '# No robots.txt content found'}
                      readOnly
                      className="font-mono text-sm h-48 bg-muted/30"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Click "Re-analyze" to check your current robots.txt configuration
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Generate AI-Optimized robots.txt
              </CardTitle>
              <CardDescription>
                Create a robots.txt that maximizes your visibility in AI responses while maintaining control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Crawler Controls */}
              <div>
                <h4 className="font-medium mb-4">AI Crawler Access</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Bot className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <Label htmlFor="gptbot" className="font-medium">GPTBot (OpenAI)</Label>
                        <p className="text-xs text-muted-foreground">Required for ChatGPT visibility</p>
                      </div>
                    </div>
                    <Switch
                      id="gptbot"
                      checked={robotsConfig.allow_gptbot}
                      onCheckedChange={(v) => setRobotsConfig({...robotsConfig, allow_gptbot: v})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Bot className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <Label htmlFor="claudebot" className="font-medium">Claude-Web (Anthropic)</Label>
                        <p className="text-xs text-muted-foreground">Required for Claude AI visibility</p>
                      </div>
                    </div>
                    <Switch
                      id="claudebot"
                      checked={robotsConfig.allow_claudebot}
                      onCheckedChange={(v) => setRobotsConfig({...robotsConfig, allow_claudebot: v})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Bot className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <Label htmlFor="perplexitybot" className="font-medium">PerplexityBot</Label>
                        <p className="text-xs text-muted-foreground">Powers Perplexity search</p>
                      </div>
                    </div>
                    <Switch
                      id="perplexitybot"
                      checked={robotsConfig.allow_perplexitybot}
                      onCheckedChange={(v) => setRobotsConfig({...robotsConfig, allow_perplexitybot: v})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/10">
                        <Bot className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div>
                        <Label htmlFor="google_extended" className="font-medium">Google-Extended</Label>
                        <p className="text-xs text-muted-foreground">Used for Gemini AI training</p>
                      </div>
                    </div>
                    <Switch
                      id="google_extended"
                      checked={robotsConfig.allow_google_extended}
                      onCheckedChange={(v) => setRobotsConfig({...robotsConfig, allow_google_extended: v})}
                    />
                  </div>
                </div>
              </div>

              {/* Sitemap URL */}
              <div className="space-y-2">
                <Label htmlFor="sitemap">Sitemap URL (recommended)</Label>
                <Input
                  id="sitemap"
                  placeholder="https://yoursite.com/sitemap.xml"
                  value={robotsConfig.sitemap_url}
                  onChange={(e) => setRobotsConfig({...robotsConfig, sitemap_url: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Helps crawlers discover all your content more efficiently
                </p>
              </div>

              {/* Custom Rules */}
              <div className="space-y-2">
                <Label>Custom Rules (optional)</Label>
                <Textarea
                  placeholder="# Add custom rules here&#10;Disallow: /private/&#10;Disallow: /admin/"
                  className="font-mono text-sm h-24"
                  value={robotsConfig.custom_rules}
                  onChange={(e) => setRobotsConfig({...robotsConfig, custom_rules: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Block specific paths if needed (but avoid blocking AI crawlers completely)
                </p>
              </div>

              <Button onClick={generateRobotsTxt} size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Optimized robots.txt
              </Button>

              {/* Generated Output */}
              {generatedRobotsTxt && (
                <div className="space-y-3 mt-6 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Your Optimized robots.txt
                    </h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedRobotsTxt)}>
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const blob = new Blob([generatedRobotsTxt], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'robots.txt'
                        a.click()
                      }}>
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={generatedRobotsTxt}
                    readOnly
                    className="font-mono text-sm h-64"
                  />
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Next Steps</AlertTitle>
                    <AlertDescription>
                      <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                        <li>Download or copy the generated robots.txt file</li>
                        <li>Replace your current robots.txt in your website's root directory</li>
                        <li>Re-analyze to verify the changes are live</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Improve Your AI Visibility Further</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/dashboard/schema-builder" className="block">
                  <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <FileCode className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Schema Builder</p>
                      <p className="text-sm text-muted-foreground">Add structured data for better AI understanding</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/dashboard/technical-seo" className="block">
                  <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Brain className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Technical SEO</p>
                      <p className="text-sm text-muted-foreground">AEO readiness, crawlers & structured data</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
