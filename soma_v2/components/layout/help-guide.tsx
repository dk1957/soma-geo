"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  HelpCircle,
  TrendingUp,
  Target,
  MessageSquare,
  Award,
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  Users,
  Globe,
  Search,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Activity,
  ThumbsUp,
  MapPin,
  FileText,
  Link2,
  Brain,
  Sparkles
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GuideSection {
  id: string
  title: string
  icon: React.ElementType
  badge?: string
  content: {
    description: string
    metrics?: {
      name: string
      formula?: string
      explanation: string
      icon: React.ElementType
    }[]
    tips?: string[]
  }
}

const guideSections: GuideSection[] = [
  {
    id: "overview",
    title: "Platform Overview",
    icon: BookOpen,
    badge: "Start Here",
    content: {
      description: "Soma AI is a Generative Engine Optimization (GEO) platform that helps your brand rank higher in AI-powered search engines like ChatGPT, Gemini, Claude, and Perplexity. We analyze how AI systems discover, mention, and recommend your brand.",
      tips: [
        "Run runs to see how AI engines respond to queries about your industry",
        "Track your brand's visibility across different AI platforms",
        "Optimize your content based on AI-generated insights and recommendations"
      ]
    }
  },
  {
    id: "lvi",
    title: "LVI Score",
    icon: Activity,
    badge: "Core Metric",
    content: {
      description: "The LLM Visibility Index (LVI) is a comprehensive score (0-100) measuring your brand's visibility across AI platforms. It combines multiple factors to give you a single, actionable metric.",
      metrics: [
        {
          name: "Indirect Coverage",
          formula: "25% of LVI",
          explanation: "Percentage of discovery prompts where your brand appears unprompted. This measures organic visibility.",
          icon: Globe
        },
        {
          name: "Position Quality",
          formula: "25% of LVI",
          explanation: "Average placement of your brand in AI responses. Earlier mentions = higher score.",
          icon: MapPin
        },
        {
          name: "Citation Authority",
          formula: "20% of LVI",
          explanation: "Percentage of mentions that include authoritative sources or citations.",
          icon: Link2
        },
        {
          name: "Sentiment Quality",
          formula: "15% of LVI",
          explanation: "Net sentiment of brand mentions, scored from -1 (negative) to +1 (positive).",
          icon: ThumbsUp
        },
        {
          name: "Direct Mentions",
          formula: "10% of LVI",
          explanation: "Percentage of branded queries where your brand is surfaced by AI.",
          icon: Target
        },
        {
          name: "Competitive Position",
          formula: "5% of LVI",
          explanation: "Your brand's rank relative to competitors in the same space.",
          icon: Award
        }
      ],
      tips: [
        "An LVI score above 70 indicates strong AI visibility",
        "Focus on improving your lowest-scoring components first",
        "Consistent monitoring reveals trends and optimization opportunities"
      ]
    }
  },
  {
    id: "mention-rate",
    title: "Mention Rate",
    icon: MessageSquare,
    content: {
      description: "The percentage of AI responses that mention your brand. This metric shows how often your brand appears in AI-generated content across different queries.",
      metrics: [
        {
          name: "Calculation",
          formula: "(Responses with mentions ÷ Total responses) × 100",
          explanation: "A higher mention rate means AI engines are more likely to include your brand in their responses.",
          icon: BarChart3
        }
      ],
      tips: [
        "Target mention rate: 40%+ is good, 60%+ is excellent",
        "Low mention rates suggest opportunities for content optimization",
        "Compare mention rates across different query types"
      ]
    }
  },
  {
    id: "sentiment",
    title: "Sentiment Analysis",
    icon: ThumbsUp,
    content: {
      description: "Sentiment measures the tone and quality of how AI systems describe your brand, scored from -1 (very negative) to +1 (very positive).",
      metrics: [
        {
          name: "Sentiment Score",
          formula: "Range: -1.0 to +1.0",
          explanation: "Positive sentiment (>0.3) indicates favorable AI representation. Negative sentiment (<-0.2) requires immediate attention.",
          icon: TrendingUp
        },
        {
          name: "Sentiment Differential",
          formula: "Your sentiment - Competitor avg sentiment",
          explanation: "Measures how positively you're portrayed compared to competitors.",
          icon: Users
        }
      ],
      tips: [
        "Positive sentiment (>0.5) drives higher conversion rates",
        "Monitor sentiment trends to catch reputation issues early",
        "Address negative sentiment with improved content and citations"
      ]
    }
  },
  {
    id: "competitive",
    title: "Competitive Analysis",
    icon: Users,
    content: {
      description: "Track how your brand performs against competitors in AI search results. Understand your market position and identify opportunities to outrank competition.",
      metrics: [
        {
          name: "Share of Voice (SOV)",
          formula: "Per response: (1 ÷ Total brands mentioned) × 100 if mentioned, 0 if not. Daily SOV = average across all responses.",
          explanation: "Measures your equal share of the conversation in each AI response. If 6 brands are mentioned including yours, your SOV for that response is 16.7% (1/6). This is averaged across all responses — including those where you weren't mentioned — combining both how often you appear and how crowded each response is.",
          icon: PieChart
        },
        {
          name: "Competitive Density",
          formula: "Total distinct brands detected per response",
          explanation: "The number of unique brands the AI mentioned in a single response, including brands you may not be tracking. Higher density means more competition for attention in that response.",
          icon: Users
        },
        {
          name: "Industry Rank",
          formula: "Relative ranking by LVI score",
          explanation: "Your position compared to competitors, based on overall AI visibility.",
          icon: Award
        }
      ],
      tips: [
        "SOV combines visibility (how often you appear) with market density (how many brands compete in each response)",
        "Focus on prompts where competitors dominate but you're absent",
        "Study how top-ranked competitors are mentioned and cited",
        "Target high-opportunity queries where competition is weak"
      ]
    }
  },
  {
    id: "topics",
    title: "Topic Analysis",
    icon: Brain,
    content: {
      description: "Discover which topics and categories AI systems associate with your brand. Identify coverage gaps and expansion opportunities.",
      metrics: [
        {
          name: "Topic Relevance",
          formula: "0 to 1 scale",
          explanation: "How strongly AI associates your brand with specific topics.",
          icon: Target
        },
        {
          name: "Topic Coverage",
          formula: "Number of unique topics",
          explanation: "The breadth of topics where your brand appears in AI responses.",
          icon: Globe
        }
      ],
      tips: [
        "Strengthen associations with high-value topics in your industry",
        "Expand into adjacent topics to increase discoverability",
        "Monitor topic trends to stay ahead of market shifts"
      ]
    }
  },
  {
    id: "citations",
    title: "Citations & Sources",
    icon: Link2,
    content: {
      description: "Track which sources and domains AI systems cite when mentioning your brand. Citations boost authority and credibility.",
      metrics: [
        {
          name: "Citation Rate",
          formula: "(Cited mentions ÷ Total mentions) × 100",
          explanation: "Percentage of brand mentions that include authoritative source citations.",
          icon: FileText
        },
        {
          name: "Domain Authority",
          formula: "Aggregate authority score",
          explanation: "Quality measure of domains citing your brand.",
          icon: Award
        }
      ],
      tips: [
        "Target high-authority domains for backlinks and mentions",
        "Create citation-worthy content (research, data, case studies)",
        "Monitor which competitors get cited most frequently"
      ]
    }
  },
  {
    id: "insights",
    title: "Insights & Recommendations",
    icon: Lightbulb,
    content: {
      description: "AI-powered actionable insights based on your performance data. We analyze your metrics to provide specific recommendations for improvement.",
      metrics: [
        {
          name: "Opportunities",
          formula: "High-value, low-competition",
          explanation: "Prompts where you can gain visibility with focused optimization efforts.",
          icon: Sparkles
        },
        {
          name: "Threats",
          formula: "Negative sentiment or competitor dominance",
          explanation: "Areas requiring immediate attention to protect your brand reputation.",
          icon: Activity
        },
        {
          name: "Strengths",
          formula: "High-performing prompts",
          explanation: "Queries where your brand excels—double down on these strategies.",
          icon: Award
        }
      ],
      tips: [
        "Prioritize opportunities with the highest potential impact",
        "Address threats immediately to prevent reputation damage",
        "Replicate strategies from your strengths across other areas"
      ]
    }
  },
  {
    id: "runs",
    title: "Running Runs",
    icon: Zap,
    content: {
      description: "Runs test how AI engines respond to specific prompts. Run runs to gather fresh data and measure optimization efforts.",
      tips: [
        "Test a mix of branded and unbranded queries",
        "Include competitor names in queries for comparative analysis",
        "Run runs regularly (weekly) to track trends",
        "Use diverse query types: questions, comparisons, recommendations",
        "After content updates, re-run runs to measure impact"
      ]
    }
  },
  {
    id: "optimization",
    title: "Optimization Best Practices",
    icon: TrendingUp,
    content: {
      description: "Proven strategies to improve your AI visibility and rankings across all metrics.",
      tips: [
        "Create authoritative, well-researched content AI systems can cite",
        "Earn backlinks from high-authority domains in your industry",
        "Optimize content structure: clear headings, bullet points, concise answers",
        "Build strong brand associations with relevant topics and keywords",
        "Monitor and respond to negative sentiment in AI responses",
        "Publish regular thought leadership and industry insights",
        "Ensure your content answers common industry questions directly",
        "Maintain consistent brand messaging across all digital properties"
      ]
    }
  }
]

export function HelpGuide() {
  const [selectedSection, setSelectedSection] = useState<string>("overview")
  const currentSection = guideSections.find(s => s.id === selectedSection)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="hidden lg:flex h-9 w-9 rounded-full hover:bg-muted/50 cursor-pointer"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Platform Guide</SheetTitle>
              <SheetDescription>
                Learn how to maximize your AI visibility
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-48 border-r bg-muted/30 overflow-y-auto">
            <nav className="p-3 space-y-1">
              {guideSections.map((section) => {
                const Icon = section.icon
                const isActive = selectedSection === section.id
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium truncate">{section.title}</span>
                    {isActive && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {currentSection && (
                <>
                  {/* Section Header */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = currentSection.icon
                        return <Icon className="h-6 w-6 text-primary" />
                      })()}
                      <h2 className="text-2xl font-semibold">{currentSection.title}</h2>
                      {currentSection.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {currentSection.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentSection.content.description}
                    </p>
                  </div>

                  <Separator />

                  {/* Metrics Section */}
                  {currentSection.content.metrics && currentSection.content.metrics.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Key Metrics
                      </h3>
                      <div className="space-y-3">
                        {currentSection.content.metrics.map((metric, index) => {
                          const MetricIcon = metric.icon
                          return (
                            <div 
                              key={index} 
                              className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 shrink-0">
                                  <MetricIcon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="flex items-baseline gap-2 flex-wrap">
                                    <h4 className="font-semibold text-sm">{metric.name}</h4>
                                    {metric.formula && (
                                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                                        {metric.formula}
                                      </code>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {metric.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tips Section */}
                  {currentSection.content.tips && currentSection.content.tips.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        {currentSection.content.metrics ? 'Pro Tips' : 'Best Practices'}
                      </h3>
                      <div className="space-y-2">
                        {currentSection.content.tips.map((tip, index) => (
                          <div 
                            key={index} 
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                          >
                            <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 shrink-0">
                              <span className="text-xs font-semibold text-primary">
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-xs text-foreground leading-relaxed flex-1">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Reference Card */}
                  {currentSection.id === "lvi" && (
                    <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 shrink-0">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Understanding Your LVI Score</h4>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p><strong className="text-foreground">0-30:</strong> Limited AI visibility - Start with content optimization</p>
                            <p><strong className="text-foreground">31-50:</strong> Emerging visibility - Focus on citations and authority</p>
                            <p><strong className="text-foreground">51-70:</strong> Good visibility - Optimize positioning and sentiment</p>
                            <p><strong className="text-foreground">71-85:</strong> Strong visibility - Maintain and expand coverage</p>
                            <p><strong className="text-foreground">86-100:</strong> Excellent visibility - Industry leader status</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Need more help?</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
              Contact Support
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
