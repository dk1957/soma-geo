"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Zap, 
  Globe, 
  Cpu, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  DollarSign,
  CheckCircle,
  XCircle,
  Sparkles,
  Brain,
  MessageSquare,
  Users,
  Award,
  Rocket
} from "lucide-react"

export default function CompetitiveShowcaseDashboard() {
  const [activeComparison, setActiveComparison] = useState("features")

  const competitors = [
    { name: "BrightEdge", price: "$4000+", setup: "3-6 months", aiTesting: false, geoOptimization: false, ldiScoring: false, autoReports: false },
    { name: "SEMrush", price: "$119", setup: "2-4 weeks", aiTesting: false, geoOptimization: false, ldiScoring: false, autoReports: false },
    { name: "Ahrefs", price: "$99", setup: "1-2 weeks", aiTesting: false, geoOptimization: false, ldiScoring: false, autoReports: false },
    { name: "SimilarWeb", price: "$199", setup: "2-3 weeks", aiTesting: false, geoOptimization: false, ldiScoring: false, autoReports: false },
    { name: "Moz", price: "$99", setup: "1-2 weeks", aiTesting: false, geoOptimization: false, ldiScoring: false, autoReports: false },
    { name: "SOMA-GEO", price: "$29", setup: "5 minutes", aiTesting: true, geoOptimization: true, ldiScoring: true, autoReports: true }
  ]

  const uniqueFeatures = [
    {
      icon: <Cpu className="h-6 w-6 text-black" />,
      title: "Live AI Response Testing",
      description: "Real-time testing across ChatGPT-4, Claude Sonnet, Gemini Pro, and Perplexity",
      competitor: "No competitor has this",
      advantage: "10X"
    },
    {
      icon: <Globe className="h-6 w-6 text-black" />,
      title: "Geo-Cultural Optimization",
      description: "Local language and cultural context analysis for regional AI responses",
      competitor: "Generic global-only insights",
      advantage: "First to Market"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-black" />,
      title: "Language Discoverability Index (LDI)",
      description: "Proprietary scoring system specifically for AI platform visibility",
      competitor: "Traditional metrics only",
      advantage: "Unique IP"
    },
    {
      icon: <Sparkles className="h-6 w-6 text-black" />,
      title: "Auto-Generated Reports",
      description: "Professional brand reports generated automatically from audit data",
      competitor: "Manual templates only",
      advantage: "100% Automated"
    }
  ]

  const successMetrics = [
    { metric: "Setup Speed", us: "5 minutes", competitors: "3-6 months", improvement: "36000%" },
    { metric: "Cost Efficiency", us: "$29/mo", competitors: "$99-4000/mo", improvement: "4000%" },
    { metric: "AI Platform Coverage", us: "4 platforms", competitors: "0 platforms", improvement: "∞" },
    { metric: "Cultural Context", us: "Native support", competitors: "Generic only", improvement: "Unique" },
    { metric: "Report Generation", us: "Instant", competitors: "Manual", improvement: "Automated" }
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center mb-4 bg-white rounded-full px-6 py-2 border border-gray-300 shadow-sm">
          <Award className="h-5 w-5 text-black mr-2" />
          <span className="text-sm font-semibold text-black">World's First AI-First SEO Platform</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-black">
          🎯 SOMA-GEO vs The Competition
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Delivering <span className="font-bold text-black">10X more value</span> than BrightEdge, SEMrush, and Ahrefs 
          through revolutionary AI-first optimization with <span className="font-bold text-black">40X lower costs</span>
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <Card className="text-center border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-black mb-2">10X</div>
            <div className="text-sm text-gray-700">More Valuable</div>
          </CardContent>
        </Card>
        <Card className="text-center border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-black mb-2">40X</div>
            <div className="text-sm text-gray-700">Lower Cost</div>
          </CardContent>
        </Card>
        <Card className="text-center border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-black mb-2">4</div>
            <div className="text-sm text-gray-700">AI Platforms</div>
          </CardContent>
        </Card>
        <Card className="text-center border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-black mb-2">5min</div>
            <div className="text-sm text-gray-700">Setup Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Comparisons */}
      <Tabs value={activeComparison} onValueChange={setActiveComparison} className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="features">Unique Features</TabsTrigger>
          <TabsTrigger value="comparison">Head-to-Head</TabsTrigger>
          <TabsTrigger value="success">Success Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {uniqueFeatures.map((feature, index) => (
              <Card key={index} className="border-l-4 border-l-black">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {feature.icon}
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    <Badge className="bg-black hover:bg-gray-800 text-white">
                      {feature.advantage}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{feature.description}</p>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-800">Competitors:</div>
                    <div className="text-sm text-gray-700">{feature.competitor}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison Matrix</CardTitle>
              <CardDescription>How we stack up against industry leaders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Platform</th>
                      <th className="text-center p-3">Monthly Cost</th>
                      <th className="text-center p-3">Setup Time</th>
                      <th className="text-center p-3">AI Testing</th>
                      <th className="text-center p-3">Geo-Cultural</th>
                      <th className="text-center p-3">LDI Scoring</th>
                      <th className="text-center p-3">Auto Reports</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((comp, index) => (
                      <tr key={index} className={`border-b ${comp.name === 'SOMA-GEO' ? 'bg-blue-50 font-semibold' : ''}`}>
                        <td className="p-3">
                          {comp.name === 'SOMA-GEO' && <Rocket className="inline h-4 w-4 mr-2 text-blue-500" />}
                          {comp.name}
                        </td>
                        <td className="text-center p-3">{comp.price}</td>
                        <td className="text-center p-3">{comp.setup}</td>
                        <td className="text-center p-3">
                          {comp.aiTesting ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-500 mx-auto" />}
                        </td>
                        <td className="text-center p-3">
                          {comp.geoOptimization ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-500 mx-auto" />}
                        </td>
                        <td className="text-center p-3">
                          {comp.ldiScoring ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-500 mx-auto" />}
                        </td>
                        <td className="text-center p-3">
                          {comp.autoReports ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-500 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="success" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {successMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{metric.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-black">SOMA-GEO</span>
                        <span className="font-bold text-black">{metric.us}</span>
                      </div>
                      <Progress value={100} className="h-2 bg-gray-100" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Competitors</span>
                        <span className="text-gray-800">{metric.competitors}</span>
                      </div>
                      <Progress value={20} className="h-2 bg-gray-100" />
                    </div>
                    <div className="text-center">
                      <Badge className="bg-black hover:bg-gray-800 text-white">
                        {metric.improvement} Better
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-black text-white">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">🚀 Ready to Experience the 10X Difference?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Join the revolution in AI-first SEO optimization. Get comprehensive insights that no competitor can provide, 
              at a fraction of their cost, with instant setup.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-black hover:bg-gray-100">
              <Zap className="mr-2 h-5 w-5" />
              Start Free Audit
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-black hover:text-white">
              <MessageSquare className="mr-2 h-5 w-5" />
              Schedule Demo
            </Button>
          </div>
          <div className="mt-6 text-center">
            <div className="inline-flex items-center bg-gray-800 border border-gray-600 rounded-full px-4 py-2">
              <Sparkles className="h-4 w-4 text-gray-300 mr-2" />
              <span className="text-sm font-medium text-gray-200">
                No setup fees • No long-term contracts • Instant results
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}