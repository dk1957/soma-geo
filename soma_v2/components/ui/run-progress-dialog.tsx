"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, CheckCircle2, X } from "lucide-react"

interface RunProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  estimatedTimeMinutes?: number
  brandId?: string
}

export function RunProgressDialog({
  open,
  onOpenChange,
  estimatedTimeMinutes = 5,
  brandId,
}: RunProgressDialogProps) {
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(estimatedTimeMinutes * 60)
  const [isPolling, setIsPolling] = useState(true)
  const [actualProgress, setActualProgress] = useState<number | null>(null)

  // Poll for actual run progress if brandId is provided
  useEffect(() => {
    if (!open || !brandId || !isPolling) return

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/llm-run/status?brand_id=${brandId}`)
        if (response.ok) {
          const data = await response.json()
          
          if (data.run) {
            const completedJobs = data.run.completed_jobs || 0
            const totalJobs = data.run.total_jobs || 1
            const calculatedProgress = (completedJobs / totalJobs) * 100
            
            setActualProgress(calculatedProgress)
            
            // If run is complete, stop polling
            if (calculatedProgress >= 100 || data.run.status === 'completed') {
              setIsPolling(false)
              setProgress(100)
            } else {
              setProgress(calculatedProgress)
            }
          }
        }
      } catch (error) {
        console.error('Failed to poll run progress:', error)
      }
    }

    // Initial poll
    pollProgress()

    // Poll every 3 seconds
    const pollInterval = setInterval(pollProgress, 3000)

    return () => clearInterval(pollInterval)
  }, [open, brandId, isPolling])

  // Fallback progress run if no brandId or polling fails
  useEffect(() => {
    if (!open || actualProgress !== null) return

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 2
        return next >= 95 ? 95 : next
      })
    }, 1000)

    return () => clearInterval(progressInterval)
  }, [open, actualProgress])

  // Timer countdown
  useEffect(() => {
    if (!open) return

    const timerInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [open])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  {progress >= 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-center text-xl">
            {progress >= 100 ? "Analysis Complete!" : "Analyzing Your Brand's AI Visibility"}
          </DialogTitle>
          
          <DialogDescription className="text-center space-y-4">
            <p className="text-base">
              {progress >= 100 
                ? "Your first visibility report is ready! Refresh the page to see your results."
                : "We're running your brand through multiple AI models to generate your first visibility report."
              }
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {progress < 100 && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground">Estimated time remaining:</span>
                <Badge variant="secondary" className="font-mono">
                  {formatTime(timeRemaining)}
                </Badge>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4 border-t">
          <div className="text-sm text-muted-foreground text-center font-medium mb-3">
            {progress >= 100 ? "What we analyzed:" : "What's happening now:"}
          </div>
          
          <div className="space-y-2">
            <div className={`flex items-start gap-3 p-3 rounded-lg ${
              progress >= 30 ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                progress >= 30 
                  ? 'bg-primary' 
                  : 'border-2 border-muted-foreground/30'
              }`}>
                {progress >= 30 ? (
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                ) : progress >= 10 ? (
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Querying AI Models</p>
                <p className="text-xs text-muted-foreground">
                  Testing ChatGPT, Gemini, Claude, and other models
                </p>
              </div>
            </div>

            <div className={`flex items-start gap-3 p-3 rounded-lg ${
              progress >= 70 ? 'bg-muted/50' : progress >= 30 ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                progress >= 70 
                  ? 'bg-primary' 
                  : progress >= 30 
                    ? 'border-2 border-primary' 
                    : 'border-2 border-muted-foreground/30'
              }`}>
                {progress >= 70 ? (
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                ) : progress >= 30 ? (
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Analyzing Responses</p>
                <p className="text-xs text-muted-foreground">
                  Measuring visibility, citations, and sentiment
                </p>
              </div>
            </div>

            <div className={`flex items-start gap-3 p-3 rounded-lg ${
              progress >= 100 ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                progress >= 100 
                  ? 'bg-primary' 
                  : progress >= 70 
                    ? 'border-2 border-primary' 
                    : 'border-2 border-muted-foreground/30'
              }`}>
                {progress >= 100 ? (
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                ) : progress >= 70 ? (
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Generating Report</p>
                <p className="text-xs text-muted-foreground">
                  Creating your personalized insights dashboard
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-3">
          {progress >= 100 ? (
            <Button 
              onClick={handleClose}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              View Dashboard
            </Button>
          ) : (
            <>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">You can close this and come back later</p>
                <p className="text-xs text-muted-foreground">
                  Analysis continues in the background. Check back in {estimatedTimeMinutes} minutes.
                </p>
              </div>
              <Button 
                onClick={handleClose}
                variant="outline"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Close and Check Later
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
