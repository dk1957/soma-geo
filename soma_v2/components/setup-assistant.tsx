"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  ChevronRight, 
  ExternalLink,
  Settings,
  Globe,
  Code,
  BarChart3,
  FileText,
  Zap,
  Target,
  X
} from "lucide-react"
import { useBrand } from "@/lib/contexts/brand-context"
import { getSupabaseClient } from "@/lib/supabase/client"

interface SetupStep {
  id: string
  title: string
  description: string
  icon: any
  status: 'completed' | 'pending' | 'not_started'
  action: {
    label: string
    href?: string
    onClick?: () => void
    external?: boolean
  }
  importance: 'critical' | 'recommended' | 'optional'
  estimatedTime: string
}

interface SetupAssistantProps {
  onClose?: () => void
  compact?: boolean
}

export function SetupAssistant({ onClose, compact = false }: SetupAssistantProps) {
  const router = useRouter()
  const { currentBrand } = useBrand()
  const [steps, setSteps] = useState<SetupStep[]>([])
  const [loading, setLoading] = useState(true)
  const [completionPercentage, setCompletionPercentage] = useState(0)

  useEffect(() => {
    checkSetupStatus()
  }, [currentBrand?.id])

  const checkSetupStatus = async () => {
    if (!currentBrand?.id) return

    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      
      // Check various setup completions
      const [
        { data: brandData },
        { data: visibilityData },
        { data: sourcesData },
        { data: promptsData },
        { data: reportsData },
        { data: websiteData }
      ] = await Promise.all([
        // Check brand setup completion
        supabase
          .from('brands')
          .select('website, category, description, target_markets')
          .eq('id', currentBrand.id)
          .single(),
        
        // Check if visibility tracking is set up
        supabase
          .from('llm_visibility_tracking')
          .select('id')
          .eq('brand_id', currentBrand.id)
          .limit(1),
        
        // Check if content sources are configured
        supabase
          .from('content_docs')
          .select('id')
          .eq('brand_id', currentBrand.id)
          .limit(1),
        
        // Check if prompts/queries are set up
        supabase
          .from('user_prompts')
          .select('id')
          .eq('brand_id', currentBrand.id)
          .limit(1),
        
        // Check if reports have been generated
        supabase
          .from('audit_results')
          .select('id')
          .eq('brand_id', currentBrand.id)
          .limit(1),
        
        // Check website verification/crawling status
        supabase
          .from('sites')
          .select('id, crawl_status')
          .eq('brand_id', currentBrand.id)
          .limit(1)
      ])

      const setupSteps: SetupStep[] = [
        {
          id: 'brand_profile',
          title: 'Complete Brand Profile',
          description: 'Add your website, category, and target markets for better AI understanding',
          icon: Settings,
          status: (brandData?.website && brandData?.category) ? 'completed' : 'pending',
          action: {
            label: 'Complete Profile',
            href: '/dashboard/settings?tab=brand'
          },
          importance: 'critical',
          estimatedTime: '3 min'
        },
        {
          id: 'website_verification',
          title: 'Verify Website',
          description: 'Verify domain ownership and enable content crawling',
          icon: Globe,
          status: websiteData && websiteData.length > 0 && websiteData[0].crawl_status === 'completed' ? 'completed' : 'not_started',
          action: {
            label: 'Verify Website',
            href: '/dashboard/discovering'
          },
          importance: 'critical',
          estimatedTime: '5 min'
        },
        {
          id: 'content_sources',
          title: 'Add Content Sources',
          description: 'Connect your blog, documentation, or other content sources',
          icon: FileText,
          status: sourcesData && sourcesData.length > 0 ? 'completed' : 'not_started',
          action: {
            label: 'Add Sources',
            href: '/dashboard/sources'
          },
          importance: 'recommended',
          estimatedTime: '10 min'
        },
        {
          id: 'tracking_code',
          title: 'Install Tracking Code',
          description: 'Add our tracking snippet to monitor AI crawler visits',
          icon: Code,
          status: 'not_started', // Would need to check if tracking code is installed
          action: {
            label: 'Get Code',
            href: '/dashboard/settings?tab=tracking'
          },
          importance: 'recommended',
          estimatedTime: '5 min'
        },
        {
          id: 'first_visibility_check',
          title: 'Run First Visibility Check',
          description: 'Test how your brand appears in AI responses',
          icon: Target,
          status: visibilityData && visibilityData.length > 0 ? 'completed' : 'not_started',
          action: {
            label: 'Run Check',
            href: '/dashboard/visibility'
          },
          importance: 'critical',
          estimatedTime: '2 min'
        },
        {
          id: 'setup_prompts',
          title: 'Configure Monitoring Queries',
          description: 'Set up queries to track your brand visibility',
          icon: BarChart3,
          status: promptsData && promptsData.length > 0 ? 'completed' : 'not_started',
          action: {
            label: 'Setup Queries',
            href: '/dashboard/prompts'
          },
          importance: 'recommended',
          estimatedTime: '15 min'
        },
        {
          id: 'first_report',
          title: 'Generate First Report',
          description: 'Create your baseline GEO performance report',
          icon: FileText,
          status: reportsData && reportsData.length > 0 ? 'completed' : 'not_started',
          action: {
            label: 'Generate Report',
            href: '/dashboard/reports'
          },
          importance: 'recommended',
          estimatedTime: '5 min'
        }
      ]

      setSteps(setupSteps)
      
      // Calculate completion percentage
      const completed = setupSteps.filter(step => step.status === 'completed').length
      const percentage = Math.round((completed / setupSteps.length) * 100)
      setCompletionPercentage(percentage)

    } catch (error) {
      console.error('Error checking setup status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStepAction = (step: SetupStep) => {
    if (step.action.onClick) {
      step.action.onClick()
    } else if (step.action.href) {
      if (step.action.external) {
        window.open(step.action.href, '_blank')
      } else {
        router.push(step.action.href)
      }
    }
  }

  const criticalSteps = steps.filter(step => step.importance === 'critical')
  const recommendedSteps = steps.filter(step => step.importance === 'recommended')
  const optionalSteps = steps.filter(step => step.importance === 'optional')

  const nextStep = steps.find(step => step.status !== 'completed')

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className="w-full border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">Setup Progress</h3>
              <p className="text-xs text-muted-foreground">{completionPercentage}% complete</p>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Progress value={completionPercentage} className="mb-3" />
          
          {nextStep && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <nextStep.icon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{nextStep.title}</span>
              </div>
              <Button 
                size="sm" 
                variant="default"
                onClick={() => handleStepAction(nextStep)}
              >
                {nextStep.action.label}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                GEO Setup Assistant
              </CardTitle>
              <CardDescription>
                Get your brand ready for AI search engines in just a few steps
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Setup Progress</span>
              <span className="font-medium">{completionPercentage}% complete</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Critical Steps */}
      {criticalSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Critical Setup (Required)
            </CardTitle>
            <CardDescription>
              These steps are essential for basic functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                <step.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{step.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {step.estimatedTime}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                
                <Button
                  variant={step.status === 'completed' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleStepAction(step)}
                  className="flex items-center gap-2"
                >
                  {step.action.label}
                  {step.action.external ? (
                    <ExternalLink className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommended Steps */}
      {recommendedSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Recommended Setup
            </CardTitle>
            <CardDescription>
              Complete these for optimal performance and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendedSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                <step.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{step.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {step.estimatedTime}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                
                <Button
                  variant={step.status === 'completed' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleStepAction(step)}
                  className="flex items-center gap-2"
                >
                  {step.action.label}
                  {step.action.external ? (
                    <ExternalLink className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {completionPercentage === 100 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Setup Complete! 🎉
            </h3>
            <p className="text-green-700 mb-4">
              Your brand is now ready to be discovered by AI search engines. 
              Monitor your progress in the dashboard.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}