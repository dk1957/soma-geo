"use client"

import { useState, useEffect } from "react"
import { useBrand } from "@/lib/contexts/brand-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  Clock,
  Settings,
  DollarSign,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Bot,
  Search,
  Users,
  MessageSquare,
  Zap,
  Calendar,
  TrendingUp
} from "lucide-react"

interface CronConfig {
  ai_monitoring: {
    enabled: boolean
    frequency: string
    max_queries_per_run: number
    platforms: string[]
  }
  content_optimization: {
    enabled: boolean
    frequency: string
    max_pages_per_run: number
    depth: string
  }
  competitor_analysis: {
    enabled: boolean
    frequency: string
    max_competitors: number
    include_new_competitor_discovery: boolean
  }
  mentions_tracking: {
    enabled: boolean
    frequency: string
    sentiment_analysis: boolean
    alert_on_negative: boolean
  }
}

export default function AutomationSettingsPage() {
  const { currentBrand, currentWorkspace } = useBrand()
  const [config, setConfig] = useState<CronConfig | null>(null)
  const [costEstimate, setCostEstimate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('custom')

  useEffect(() => {
    if (currentBrand && currentWorkspace) {
      fetchConfiguration()
    }
  }, [currentBrand, currentWorkspace])

  const fetchConfiguration = async () => {
    if (!currentBrand || !currentWorkspace) return
    
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/cron/config?brand_id=${currentBrand.id}&workspace_id=${currentWorkspace.id}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setConfig(data.configuration)
        setCostEstimate(data.cost_estimate)
        setLastUpdated(data.last_updated)
      } else {
        console.error('Failed to fetch configuration')
      }
    } catch (error) {
      console.error('Error fetching configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async () => {
    if (!currentBrand || !currentWorkspace || !config) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/cron/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          workspace_id: currentWorkspace.id,
          config
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCostEstimate(data.cost_estimate)
        setLastUpdated(new Date().toISOString())
        // Show success message
      } else {
        console.error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const applyPreset = (presetName: string, presetConfig: any) => {
    setSelectedPreset(presetName)
    setConfig(presetConfig)
  }

  const updateConfig = (section: keyof CronConfig, field: string, value: any) => {
    if (!config) return
    
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    })
    setSelectedPreset('custom')
  }

  const getCostLevel = (cost: number) => {
    if (cost <= 15) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-50' }
    if (cost <= 35) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-50' }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Automation Settings</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-3 text-lg">Loading automation settings...</span>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Automation Settings</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">Configuration Error</h3>
            <p className="text-muted-foreground mb-4">Unable to load automation settings.</p>
            <Button onClick={fetchConfiguration}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const costLevel = costEstimate ? getCostLevel(costEstimate.estimated_monthly_cost) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-bold">Automation Settings</h1>
            <p className="text-muted-foreground">Configure automated brand monitoring and analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {costEstimate && (
            <Card className={`p-3 ${costLevel?.bg}`}>
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${costLevel?.color}`} />
                <div>
                  <div className="text-sm font-medium">Monthly Cost</div>
                  <div className={`text-lg font-bold ${costLevel?.color}`}>
                    ${costEstimate.estimated_monthly_cost}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {costLevel?.level}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          <Button onClick={saveConfiguration} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preset Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Setup Presets
          </CardTitle>
          <CardDescription>
            Choose a pre-configured automation level that fits your needs and budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`cursor-pointer border-2 ${selectedPreset === 'conservative' ? 'border-primary' : 'border-border'} hover:border-primary/50 transition-colors`}
                  onClick={() => applyPreset('conservative', {
                    ai_monitoring: { enabled: true, frequency: 'weekly', max_queries_per_run: 5, platforms: ['chatgpt'] },
                    content_optimization: { enabled: false, frequency: 'monthly', max_pages_per_run: 10, depth: 'surface' },
                    competitor_analysis: { enabled: true, frequency: 'monthly', max_competitors: 3, include_new_competitor_discovery: false },
                    mentions_tracking: { enabled: true, frequency: 'weekly', sentiment_analysis: false, alert_on_negative: true }
                  })}>
              <CardContent className="p-4 text-center">
                <Badge className="bg-green-100 text-green-700 mb-2">$5-10/month</Badge>
                <h3 className="font-semibold mb-2">Conservative</h3>
                <p className="text-sm text-muted-foreground">Minimal monitoring to control costs</p>
              </CardContent>
            </Card>
            
            <Card className={`cursor-pointer border-2 ${selectedPreset === 'balanced' ? 'border-primary' : 'border-border'} hover:border-primary/50 transition-colors`}
                  onClick={() => applyPreset('balanced', {
                    ai_monitoring: { enabled: true, frequency: 'daily', max_queries_per_run: 10, platforms: ['chatgpt', 'claude'] },
                    content_optimization: { enabled: true, frequency: 'weekly', max_pages_per_run: 20, depth: 'surface' },
                    competitor_analysis: { enabled: true, frequency: 'weekly', max_competitors: 5, include_new_competitor_discovery: false },
                    mentions_tracking: { enabled: true, frequency: 'daily', sentiment_analysis: true, alert_on_negative: true }
                  })}>
              <CardContent className="p-4 text-center">
                <Badge className="bg-blue-100 text-blue-700 mb-2">$15-25/month</Badge>
                <h3 className="font-semibold mb-2">Balanced</h3>
                <p className="text-sm text-muted-foreground">Regular monitoring with good coverage</p>
              </CardContent>
            </Card>
            
            <Card className={`cursor-pointer border-2 ${selectedPreset === 'comprehensive' ? 'border-primary' : 'border-border'} hover:border-primary/50 transition-colors`}
                  onClick={() => applyPreset('comprehensive', {
                    ai_monitoring: { enabled: true, frequency: 'daily', max_queries_per_run: 20, platforms: ['chatgpt', 'claude', 'gemini', 'perplexity'] },
                    content_optimization: { enabled: true, frequency: 'daily', max_pages_per_run: 30, depth: 'deep' },
                    competitor_analysis: { enabled: true, frequency: 'daily', max_competitors: 10, include_new_competitor_discovery: true },
                    mentions_tracking: { enabled: true, frequency: 'hourly', sentiment_analysis: true, alert_on_negative: true }
                  })}>
              <CardContent className="p-4 text-center">
                <Badge className="bg-purple-100 text-purple-700 mb-2">$40-60/month</Badge>
                <h3 className="font-semibold mb-2">Comprehensive</h3>
                <p className="text-sm text-muted-foreground">Maximum monitoring for complete insights</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Platform Monitoring
            </CardTitle>
            <CardDescription>
              Track your brand mentions across AI platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-monitoring-enabled">Enable AI Monitoring</Label>
              <Switch
                id="ai-monitoring-enabled"
                checked={config.ai_monitoring.enabled}
                onCheckedChange={(enabled) => updateConfig('ai_monitoring', 'enabled', enabled)}
              />
            </div>
            
            {config.ai_monitoring.enabled && (
              <>
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={config.ai_monitoring.frequency}
                    onValueChange={(value) => updateConfig('ai_monitoring', 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly (24x/day)</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Max Queries per Run</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={config.ai_monitoring.max_queries_per_run}
                    onChange={(e) => updateConfig('ai_monitoring', 'max_queries_per_run', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values = more comprehensive monitoring but higher costs
                  </p>
                </div>
                
                <div>
                  <Label>Platforms</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['chatgpt', 'claude', 'gemini', 'perplexity', 'copilot'].map(platform => (
                      <Badge
                        key={platform}
                        variant={config.ai_monitoring.platforms.includes(platform) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const platforms = config.ai_monitoring.platforms.includes(platform)
                            ? config.ai_monitoring.platforms.filter(p => p !== platform)
                            : [...config.ai_monitoring.platforms, platform]
                          updateConfig('ai_monitoring', 'platforms', platforms)
                        }}
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                {costEstimate && (
                  <div className="text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Estimated cost: ${costEstimate.breakdown.ai_monitoring}/month
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Content Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Content Optimization
            </CardTitle>
            <CardDescription>
              Automated content analysis and optimization suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="content-enabled">Enable Content Optimization</Label>
              <Switch
                id="content-enabled"
                checked={config.content_optimization.enabled}
                onCheckedChange={(enabled) => updateConfig('content_optimization', 'enabled', enabled)}
              />
            </div>
            
            {config.content_optimization.enabled && (
              <>
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={config.content_optimization.frequency}
                    onValueChange={(value) => updateConfig('content_optimization', 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Pages per Run</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={config.content_optimization.max_pages_per_run}
                    onChange={(e) => updateConfig('content_optimization', 'max_pages_per_run', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label>Analysis Depth</Label>
                  <Select
                    value={config.content_optimization.depth}
                    onValueChange={(value) => updateConfig('content_optimization', 'depth', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="surface">Surface (faster, lower cost)</SelectItem>
                      <SelectItem value="deep">Deep (comprehensive, higher cost)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {costEstimate && (
                  <div className="text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Estimated cost: ${costEstimate.breakdown.content_optimization}/month
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Competitor Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Competitor Analysis
            </CardTitle>
            <CardDescription>
              Monitor competitor performance and identify opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="competitor-enabled">Enable Competitor Analysis</Label>
              <Switch
                id="competitor-enabled"
                checked={config.competitor_analysis.enabled}
                onCheckedChange={(enabled) => updateConfig('competitor_analysis', 'enabled', enabled)}
              />
            </div>
            
            {config.competitor_analysis.enabled && (
              <>
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={config.competitor_analysis.frequency}
                    onValueChange={(value) => updateConfig('competitor_analysis', 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Max Competitors to Track</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={config.competitor_analysis.max_competitors}
                    onChange={(e) => updateConfig('competitor_analysis', 'max_competitors', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-competitor-discovery">Discover New Competitors</Label>
                  <Switch
                    id="new-competitor-discovery"
                    checked={config.competitor_analysis.include_new_competitor_discovery}
                    onCheckedChange={(enabled) => updateConfig('competitor_analysis', 'include_new_competitor_discovery', enabled)}
                  />
                </div>

                {costEstimate && (
                  <div className="text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Estimated cost: ${costEstimate.breakdown.competitor_analysis}/month
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Mentions Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mentions Tracking
            </CardTitle>
            <CardDescription>
              Track brand mentions and sentiment across platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="mentions-enabled">Enable Mentions Tracking</Label>
              <Switch
                id="mentions-enabled"
                checked={config.mentions_tracking.enabled}
                onCheckedChange={(enabled) => updateConfig('mentions_tracking', 'enabled', enabled)}
              />
            </div>
            
            {config.mentions_tracking.enabled && (
              <>
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={config.mentions_tracking.frequency}
                    onValueChange={(value) => updateConfig('mentions_tracking', 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sentiment-analysis">Sentiment Analysis</Label>
                  <Switch
                    id="sentiment-analysis"
                    checked={config.mentions_tracking.sentiment_analysis}
                    onCheckedChange={(enabled) => updateConfig('mentions_tracking', 'sentiment_analysis', enabled)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="negative-alerts">Alert on Negative Mentions</Label>
                  <Switch
                    id="negative-alerts"
                    checked={config.mentions_tracking.alert_on_negative}
                    onCheckedChange={(enabled) => updateConfig('mentions_tracking', 'alert_on_negative', enabled)}
                  />
                </div>

                {costEstimate && (
                  <div className="text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Estimated cost: ${costEstimate.breakdown.mentions_tracking}/month
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      {lastUpdated && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Settings last updated: {new Date(lastUpdated).toLocaleString()}</span>
              </div>
              {costEstimate && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Total estimated monthly cost: ${costEstimate.estimated_monthly_cost}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}