"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MessageSquare,
  ExternalLink,
  Shield,
  AlertTriangle,
  Target,
  Star,
  Globe,
  BarChart3,
  ArrowRight,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ResultsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Mock data - in real app this would come from search results
  const brandName = "TechFlow Solutions"
  const location = "South Africa"

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const mockResults = {
    overallScore: 78,
    totalMentions: 247,
    visibility: 68,
    sentiment: "positive",
    topSources: [
      { domain: "youtube.com", mentions: 45, icon: "🎥" },
      { domain: "techcrunch.com", mentions: 32, icon: "📰" },
      { domain: "github.com", mentions: 28, icon: "💻" },
      { domain: "stackoverflow.com", mentions: 24, icon: "💡" },
      { domain: "medium.com", mentions: 19, icon: "📝" },
    ],
    llmBreakdown: [
      { name: "ChatGPT", mentions: 89, sentiment: "positive", ranking: 2, citations: 34 },
      { name: "Claude", mentions: 67, sentiment: "positive", ranking: 3, citations: 28 },
      { name: "Gemini", mentions: 91, sentiment: "neutral", ranking: 1, citations: 41 },
      { name: "Perplexity", mentions: 43, sentiment: "positive", ranking: 4, citations: 22 },
      { name: "Grok", mentions: 31, sentiment: "neutral", ranking: 5, citations: 15 },
      { name: "DeepSeek", mentions: 26, sentiment: "positive", ranking: 6, citations: 12 },
    ],
    recentChats: [
      {
        query: "Best project management tools for South African startups",
        mentions: 3,
        context: "Recommended as top choice for agile teams in Cape Town and Johannesburg",
        llm: "ChatGPT",
      },
      {
        query: "TechFlow Solutions vs competitors pricing comparison",
        mentions: 2,
        context: "Mentioned alongside Asana and Monday.com with competitive pricing",
        llm: "Claude",
      },
      {
        query: "South African tech companies to watch in 2024",
        mentions: 4,
        context: "Featured in list of emerging SaaS companies from Africa",
        llm: "Gemini",
      },
      {
        query: "Remote work collaboration tools for African businesses",
        mentions: 2,
        context: "Highlighted for strong mobile app and offline capabilities",
        llm: "Perplexity",
      },
    ],
    competitorRanking: [
      { rank: 1, name: "TechFlow Solutions", visibility: 68, trend: "up" },
      { rank: 2, name: "Asana", visibility: 45, trend: "down" },
      { rank: 3, name: "Monday.com", visibility: 42, trend: "stable" },
      { rank: 4, name: "Trello", visibility: 38, trend: "down" },
      { rank: 5, name: "Notion", visibility: 35, trend: "up" },
    ],
    opportunities: [
      "Increase presence in developer communities (GitHub, Stack Overflow)",
      "Target 'remote work Africa' keyword cluster - high search volume, low competition",
      "Leverage positive sentiment in mobile app discussions",
      "Expand content marketing in project management comparison articles",
    ],
    threats: [
      "Asana increasing marketing spend in African markets",
      "Limited mentions in enterprise software discussions",
      "Competitors dominating 'best of' listicles",
      "Weak presence in LinkedIn professional discussions",
    ],
    strengths: [
      "Strong mobile app reputation across all LLMs",
      "Consistent positive sentiment (87% positive mentions)",
      "High relevance in South African business context",
      "Good technical documentation coverage",
    ],
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Analyzing your brand across AI models...</h2>
          <p className="text-muted-foreground">This may take a few moments</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">S</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-foreground">Soma AI</span>
                  <span className="text-xs text-muted-foreground/80 font-medium tracking-wider">GEO PLATFORM</span>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Account Type</span>
              <span>→</span>
              <span>Details</span>
              <span>→</span>
              <span>Workspace</span>
              <span>→</span>
              <span>Review Prompts</span>
              <span>→</span>
              <span className="text-foreground font-medium">Results</span>
              <span>→</span>
              <span>Plan</span>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => router.push("/dashboard")} size="sm">
                Go to Dashboard
              </Button>
              <Button onClick={() => router.push("/pricing")} size="sm">
                View Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <BarChart3 className="h-4 w-4" />
            <span>Analysis Complete</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Your AI Search Analytics for <span className="text-primary">{brandName}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive analysis of how your brand appears across 6 major AI models, with actionable insights to
            dominate AI-driven search results.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                  <p className="text-3xl font-bold text-primary">{mockResults.overallScore}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Progress value={mockResults.overallScore} className="mt-3" />
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Mentions</p>
                  <p className="text-3xl font-bold">{mockResults.totalMentions}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Across 6 AI models</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Visibility Score</p>
                  <p className="text-3xl font-bold">{mockResults.visibility}%</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Badge variant="secondary" className="mt-2">
                Above Average
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sentiment</p>
                  <p className="text-3xl font-bold text-green-600">87%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Positive mentions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Top Sources */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Top Sources</span>
              </CardTitle>
              <CardDescription>Websites most frequently cited in AI responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground border-b border-border pb-2">
                  <span>Domain</span>
                  <span>Mentions</span>
                </div>
                {mockResults.topSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{source.icon}</span>
                      <span className="font-medium">{source.domain}</span>
                    </div>
                    <Badge variant="outline">{source.mentions}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => router.push("/pricing")}>
                <Lock className="mr-2 h-4 w-4" />
                See detailed source analysis
              </Button>
            </CardContent>
          </Card>

          {/* Recent Chats */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Recent Chats</span>
              </CardTitle>
              <CardDescription>Chats that mentioned {brandName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockResults.recentChats.map((chat, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm leading-tight">{chat.query}</h4>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {chat.mentions}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{chat.context}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {chat.llm}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => router.push("/pricing")}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => router.push("/pricing")}>
                <Lock className="mr-2 h-4 w-4" />
                See all mentions & contexts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* LLM Breakdown */}
        <Card className="border-border mb-12">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>AI Model Performance</span>
            </CardTitle>
            <CardDescription>How your brand performs across different AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockResults.llmBreakdown.map((llm, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{llm.name}</h4>
                    <Badge variant={llm.ranking <= 2 ? "default" : "secondary"}>#{llm.ranking}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mentions</span>
                      <span className="font-medium">{llm.mentions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Citations</span>
                      <span className="font-medium">{llm.citations}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sentiment</span>
                      <Badge variant={llm.sentiment === "positive" ? "default" : "secondary"} className="text-xs">
                        {llm.sentiment}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industry Ranking */}
        <Card className="border-border mb-12">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Industry Ranking</span>
            </CardTitle>
            <CardDescription>Your position against key competitors in AI visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b border-border pb-2">
                <span>Rank</span>
                <span>Brand</span>
                <span>Visibility</span>
                <span>Trend</span>
              </div>
              {mockResults.competitorRanking.map((competitor) => (
                <div key={competitor.rank} className="grid grid-cols-4 gap-4 items-center">
                  <span className="font-medium">#{competitor.rank}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                      <span className="text-primary text-xs font-medium">{competitor.name.charAt(0)}</span>
                    </div>
                    <span className={competitor.rank === 1 ? "font-semibold text-primary" : ""}>{competitor.name}</span>
                  </div>
                  <span className={competitor.rank === 1 ? "font-semibold text-primary" : ""}>
                    {competitor.visibility}%
                  </span>
                  <div className="flex items-center">
                    {competitor.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {competitor.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                    {competitor.trend === "stable" && <div className="w-4 h-0.5 bg-muted-foreground" />}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => router.push("/pricing")}>
              <Lock className="mr-2 h-4 w-4" />
              Get detailed competitor analysis
            </Button>
          </CardContent>
        </Card>

        {/* Strategic Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <Shield className="h-5 w-5" />
                <span>Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mockResults.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => router.push("/pricing")}>
                <Lock className="mr-2 h-4 w-4" />
                Detailed strength analysis
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-primary">
                <Target className="h-5 w-5" />
                <span>Opportunities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mockResults.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{opportunity}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => router.push("/pricing")}>
                <Lock className="mr-2 h-4 w-4" />
                Get opportunity roadmap
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Threats</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mockResults.threats.map((threat, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{threat}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => router.push("/pricing")}>
                <Lock className="mr-2 h-4 w-4" />
                Threat mitigation plan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to dominate AI search results?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              This is just a preview of what Soma can do for your brand. Get full access to detailed analytics,
              competitor intelligence, and AI optimization tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => router.push("/pricing")}>
                View Pricing Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.push("/signup")}>
                Start Free Trial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
