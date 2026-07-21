"use client"

/**
 * Key Insights Component
 * 
 * Displays actionable insights and high-impact recommendations
 * Data-driven strategic guidance based on all report sections
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Award, Target, Lightbulb, CheckCircle2, AlertCircle, Zap, ArrowRight, Trophy, FileText, Globe } from "lucide-react"

interface Insight {
  category: 'performance' | 'competitive' | 'content' | 'opportunity' | 'topic' | 'perception'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  metric?: string
  metricValue?: string | number
  dataSource?: string // What data this insight is based on
}

interface Recommendation {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  actions: string[]
  dataSource?: string // What data this recommendation is based on
}

interface InsightsProps {
  insights: Insight[]
  recommendations: Recommendation[]
}

const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
  switch (impact) {
    case 'high': return 'text-green-700 bg-green-50 border-green-200'
    case 'medium': return 'text-orange-700 bg-orange-50 border-orange-200'
    case 'low': return 'text-gray-700 bg-gray-50 border-gray-200'
  }
}

const getEffortColor = (effort: 'low' | 'medium' | 'high') => {
  switch (effort) {
    case 'low': return 'text-green-700 bg-green-50'
    case 'medium': return 'text-orange-700 bg-orange-50'
    case 'high': return 'text-red-700 bg-red-50'
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'performance': return BarChart3
    case 'competitive': return Trophy
    case 'content': return FileText
    case 'opportunity': return Zap
    case 'topic': return Target
    case 'perception': return TrendingUp
    default: return Target
  }
}

export function Insights({ insights, recommendations }: InsightsProps) {
  const highImpactRecs = recommendations.filter(r => r.impact === 'high')
  const otherRecs = recommendations.filter(r => r.impact !== 'high')

  return (
    <div className="space-y-6">
      {/* Act on Insights Section */}
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <Lightbulb className="h-5 w-5 text-white" />
            Act on Insights
          </CardTitle>
          <CardDescription className="text-gray-200 text-sm font-light">
            Key findings from your AI visibility analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, idx) => {
              const Icon = getCategoryIcon(insight.category)
              
              return (
                <div 
                  key={idx}
                  className={`rounded-lg p-5 border-2 transition-all duration-150 ${
                    insight.impact === 'high' 
                      ? 'border-gray-900 bg-gray-50 hover:bg-gray-100' 
                      : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        insight.impact === 'high' ? 'bg-gray-900' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          insight.impact === 'high' ? 'text-white' : 'text-gray-700'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-gray-900 mb-1">
                          {insight.title}
                        </h3>
                        {insight.metricValue && (
                          <div className="text-2xl font-bold text-gray-900 mb-2">
                            {insight.metricValue}
                            {insight.metric && (
                              <span className="text-sm font-normal text-gray-600 ml-2">
                                {insight.metric}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-semibold ${getImpactColor(insight.impact)}`}
                    >
                      {insight.impact.toUpperCase()} IMPACT
                    </Badge>
                  </div>
                  <p className="text-[15px] text-gray-700 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.dataSource && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      Based on {insight.dataSource}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <Zap className="h-5 w-5 text-white" />
            High-Impact Opportunities
          </CardTitle>
          <CardDescription className="text-gray-200 text-sm font-light">
            Strategic actions to increase your AI visibility and rankings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* High Impact Recommendations - Compact Grid */}
          {highImpactRecs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {highImpactRecs.map((rec, idx) => (
                <div 
                  key={idx}
                  className="rounded-lg p-4 border-2 border-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors duration-150"
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-gray-900 text-white text-xs font-semibold">
                        HIGH PRIORITY
                      </Badge>
                      <Badge variant="outline" className={`text-xs font-semibold ${getEffortColor(rec.effort)}`}>
                        {rec.effort} effort
                      </Badge>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-2">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-gray-700 leading-snug">
                      {rec.description}
                    </p>
                  </div>
                  
                  {/* Compact Action Steps */}
                  <div className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gray-900" />
                      <span className="text-xs font-semibold text-gray-900">Key Actions:</span>
                    </div>
                    <ul className="space-y-1.5">
                      {rec.actions.slice(0, 3).map((action, actionIdx) => (
                        <li key={actionIdx} className="flex items-start gap-2 text-xs text-gray-700">
                          <ArrowRight className="h-3.5 w-3.5 text-gray-900 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{action}</span>
                        </li>
                      ))}
                      {rec.actions.length > 3 && (
                        <li className="text-xs text-gray-500 italic ml-5">
                          +{rec.actions.length - 3} more action{rec.actions.length - 3 !== 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                    {rec.dataSource && (
                      <p className="text-[10px] text-gray-400 mt-2 italic">
                        Based on {rec.dataSource}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other Recommendations - More Compact */}
          {otherRecs.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Additional Opportunities
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {otherRecs.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="rounded-md p-3 border border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors duration-150 cursor-default"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] font-semibold ${getImpactColor(rec.impact)}`}
                      >
                        {rec.impact}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] font-semibold ${getEffortColor(rec.effort)}`}>
                        {rec.effort} effort
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1.5 leading-snug">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-snug">
                      {rec.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
