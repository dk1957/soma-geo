"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Square, RefreshCw, Loader2, Brain, BarChart3 } from "lucide-react"
import { useBrand } from "@/lib/contexts/brand-context"
import { useAuth } from "@/lib/contexts/auth-context"

interface RunControlProps {
  onDataRefresh?: () => void
}

// Admin users who can manually run runs
const ADMIN_EMAILS = ['dannykofiarmah@gmail.com']

export function RunControl({ onDataRefresh }: RunControlProps) {
  const { currentBrand } = useBrand()
  const { user } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Check if user is admin (allowed to run runs manually)
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email)
  
  // Show run button in local development or for admin users
  const showRunButton = process.env.NODE_ENV === 'development' || isAdmin

  // Run run with selected prompts from the prompts page
  const runRun = async () => {
    if (isRunning || isAnalyzing || !currentBrand) return

    const controller = new AbortController()
    setAbortController(controller)
    setIsRunning(true)
    setProgress(0)
    setStatus('Initializing run...')

    try {
      // Simulate progress during run
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 40) return prev + Math.random() * 5
          if (prev < 60) return prev + Math.random() * 2
          return Math.min(prev + Math.random() * 1, 75)
        })
      }, 500)

      setStatus('Running LLM queries across models...')
      
      // Notify the notification bell that a run has started
      window.dispatchEvent(new CustomEvent('notificationRefresh'))
      
      const response = await fetch('/api/llm-run/dashboard-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: currentBrand.id,
          options: {
            include_longitudinal_analysis: true,
            force_rerun: false
          }
        }),
        signal: controller.signal
      })

      const result = await response.json()
      clearInterval(progressInterval)
      setProgress(80)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start run')
      }

      setStatus('Analyzing responses and calculating trends...')
      setProgress(85)
      setIsRunning(false)
      setIsAnalyzing(true)
      
      // Small delay to show analysis state
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProgress(95)
      
      setStatus(`Run completed! Processed ${result.prompts_count} prompts with longitudinal analysis.`)
      setProgress(100)
      
      // Trigger a global refresh event for dashboard components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dashboardRefresh'))
        window.dispatchEvent(new CustomEvent('notificationRefresh'))
        if (onDataRefresh) {
          onDataRefresh()
        }
        setStatus('')
        setProgress(0)
        setIsRunning(false)
        setIsAnalyzing(false)
        setAbortController(null)
      }, 2000)

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatus('Run cancelled.')
      } else {
        console.error('Run failed:', error)
        setStatus(error instanceof Error ? error.message : 'Run failed. Please try again.')
      }
      
      setTimeout(() => {
        setStatus('')
        setProgress(0)
        setIsRunning(false)
        setIsAnalyzing(false)
        setAbortController(null)
      }, 3000)
    }
  }

  // Stop run
  const stopRun = () => {
    if (abortController) {
      abortController.abort()
      setStatus('Stopping run...')
    }
  }

  if (!currentBrand) return null

  // Don't render if button shouldn't be shown
  if (!showRunButton) return null

  return (
    <div className="flex items-center gap-3">
      {/* Progress Bar */}
      {(isRunning || isAnalyzing) && (
        <div className="flex-1 min-w-[120px]">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round(progress)}% complete
          </div>
        </div>
      )}

      {/* Run Status */}
      {status && (
        <Badge 
          variant="outline"
          className={`text-xs max-w-[300px] ${
            status.includes('completed') || status.includes('Processed') 
              ? 'border-green-600 text-green-700 bg-green-50' 
              : status.includes('failed') || status.includes('error')
              ? 'border-red-600 text-red-700 bg-red-50'
              : status.includes('Analyzing') || status.includes('trends')
              ? 'border-purple-600 text-purple-700 bg-purple-50'
              : 'border-blue-600 text-blue-700 bg-blue-50'
          }`}
        >
          {isAnalyzing && <Brain className="h-3 w-3 mr-1" />}
          {status}
        </Badge>
      )}

      {/* Main Control Button */}
      {isRunning || isAnalyzing ? (
        <Button
          onClick={stopRun}
          size="sm"
          variant="destructive"
          className="h-9"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Brain className="h-3 w-3 mr-2 animate-pulse" />
              Analyzing
            </>
          ) : (
            <>
              <Square className="h-3 w-3 mr-2" />
              Stop
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={runRun}
          size="sm"
          className="h-9 bg-black text-white hover:bg-gray-800"
        >
          <Play className="h-3 w-3 mr-2" />
          Run
        </Button>
      )}
    </div>
  )
}