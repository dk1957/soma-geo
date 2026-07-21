"use client"

/**
 * Charts Component
 * 
 * Displays BarChart (Mention Rate) and DonutChart (Sentiment Distribution)
 * Using Tremor charts with gray color scheme
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, DonutChart } from "@tremor/react"
import { BarChart3, PieChart } from "lucide-react"

// Format model names to be user-friendly
const formatModelName = (model: string): string => {
  const modelMap: Record<string, string> = {
    'gpt-4': 'ChatGPT 4',
    'gpt-4-turbo': 'ChatGPT 4 Turbo',
    'gpt-3.5-turbo': 'ChatGPT 3.5',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku',
    'claude-2': 'Claude 2',
    'gemini-pro': 'Gemini Pro',
    'gemini-ultra': 'Gemini Ultra',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'perplexity': 'Perplexity',
    'grok-1': 'Grok',
    'grok-2': 'Grok 2',
  }
  
  // Try exact match first
  if (modelMap[model.toLowerCase()]) {
    return modelMap[model.toLowerCase()]
  }
  
  // Try partial matches
  const lowerModel = model.toLowerCase()
  if (lowerModel.includes('gpt-4')) return 'ChatGPT 4'
  if (lowerModel.includes('gpt-3.5')) return 'ChatGPT 3.5'
  if (lowerModel.includes('gpt')) return 'ChatGPT'
  if (lowerModel.includes('claude-3-opus')) return 'Claude 3 Opus'
  if (lowerModel.includes('claude-3-sonnet')) return 'Claude 3 Sonnet'
  if (lowerModel.includes('claude-3-haiku')) return 'Claude 3 Haiku'
  if (lowerModel.includes('claude')) return 'Claude'
  if (lowerModel.includes('gemini')) return 'Gemini'
  if (lowerModel.includes('perplexity')) return 'Perplexity'
  if (lowerModel.includes('grok')) return 'Grok'
  
  // Return original if no match found, but capitalize first letter
  return model.charAt(0).toUpperCase() + model.slice(1)
}

interface ChartsProps {
  mentionRateData: Array<{
    model: string
    "Mention Rate": number
  }>
  sentimentData: Array<{
    name: string
    value: number
  }>
}

export function Charts({ mentionRateData, sentimentData }: ChartsProps) {
  // Format model names for display
  const formattedMentionRateData = mentionRateData.map(item => ({
    ...item,
    model: formatModelName(item.model)
  }))
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Mention Rate Chart */}
      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            Mention Rate by Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mentionRateData.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No mention rate data available
            </div>
          ) : (
            <BarChart
              data={formattedMentionRateData}
              index="model"
              categories={["Mention Rate"]}
              colors={["gray"]}
              valueFormatter={(value) => `${value.toFixed(1)}%`}
              yAxisWidth={48}
              className="h-72"
            />
          )}
        </CardContent>
      </Card>

      {/* Sentiment Distribution Chart */}
      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <PieChart className="h-5 w-5 text-gray-600" />
            Sentiment Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sentimentData.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No sentiment data available
            </div>
          ) : (
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-300"></div>
                  <span className="text-sm text-gray-700">Positive ({sentimentData.find(d => d.name === 'Positive')?.value || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-300"></div>
                  <span className="text-sm text-gray-700">Neutral ({sentimentData.find(d => d.name === 'Neutral')?.value || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300"></div>
                  <span className="text-sm text-gray-700">Negative ({sentimentData.find(d => d.name === 'Negative')?.value || 0})</span>
                </div>
              </div>
              
              {/* Chart with custom color override */}
              <style jsx>{`
                :global(.sentiment-chart .fill-slate-500) { fill: #111827 !important; }
                :global(.sentiment-chart .dark\\:fill-slate-500) { fill: #111827 !important; }
                :global(.sentiment-chart .fill-gray-500) { fill: #9ca3af !important; }
                :global(.sentiment-chart .dark\\:fill-gray-500) { fill: #9ca3af !important; }
                :global(.sentiment-chart .fill-zinc-500) { fill: #f3f4f6 !important; }
                :global(.sentiment-chart .dark\\:fill-zinc-500) { fill: #f3f4f6 !important; }
              `}</style>
              
              <div className="sentiment-chart">
                <DonutChart
                  data={sentimentData}
                  category="value"
                  index="name"
                  colors={["slate", "gray", "zinc"]}
                  valueFormatter={(value) => `${value} responses`}
                  className="h-64"
                  showTooltip={true}
                  customTooltip={(props: any) => {
                    if (!props.active || !props.payload?.[0]) return null
                    const data = props.payload[0]
                    
                    // Define distinct grayscale colors for each sentiment
                    const colorMap: Record<string, string> = {
                      'Positive': '#111827',  // gray-900 - darkest
                      'Neutral': '#9ca3af',   // gray-400 - medium
                      'Negative': '#f3f4f6',  // gray-100 - lightest
                    }
                    
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full border border-gray-300" 
                            style={{ backgroundColor: colorMap[data.name] || data.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{data.name}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {data.value} responses
                        </p>
                      </div>
                    )
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
