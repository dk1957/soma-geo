import { kv } from '@vercel/kv'

export interface ProgressStep {
  id: string
  title: string
  description: string
  estimatedTime: number
  status: 'waiting' | 'active' | 'completed' | 'error'
  subSteps?: {
    id: string
    name: string
    status: 'waiting' | 'active' | 'completed' | 'error'
    detail?: string
  }[]
}

export interface ProgressUpdate {
  step: string
  stepIndex: number
  totalSteps: number
  status: 'waiting' | 'active' | 'completed' | 'error'
  message: string
  detail?: string
  progress: number
  elapsedTime: number
  estimatedTimeRemaining: number
  timestamp: string
  subStep?: {
    name: string
    status: 'waiting' | 'active' | 'completed' | 'error'
    detail?: string
  }
}

export class ProgressTracker {
  private auditId: string
  private steps: ProgressStep[]
  private startTime: number
  private currentStepIndex: number = 0

  constructor(auditId: string) {
    this.auditId = auditId
    this.startTime = Date.now()
    this.steps = [
      {
        id: 'preparation',
        title: 'Analysis Preparation',
        description: 'Loading cached prompts and gathering brand context',
        estimatedTime: 8000, // Reduced since prompts may be cached
        status: 'waiting',
        subSteps: [
          { id: 'cache-check', name: 'Checking Cached Prompts', status: 'waiting' },
          { id: 'load-queries', name: 'Loading Brand Monitoring Queries', status: 'waiting' },
          { id: 'brand-context', name: 'Gathering Brand Context', status: 'waiting' }
        ]
      },
      {
        id: 'testing',
        title: 'AI Assistant Testing',
        description: 'Testing your brand visibility across major AI platforms',
        estimatedTime: 45000,
        status: 'waiting',
        subSteps: [
          { id: 'platform-prep', name: 'Preparing Platform Tests', status: 'waiting' },
          { id: 'gpt4', name: 'ChatGPT Analysis', status: 'waiting', detail: 'Testing across GPT-4' },
          { id: 'claude', name: 'Claude Analysis', status: 'waiting', detail: 'Testing with Anthropic Claude' },
          { id: 'gemini', name: 'Gemini Analysis', status: 'waiting', detail: 'Testing Google Gemini' },
          { id: 'perplexity', name: 'Perplexity Analysis', status: 'waiting', detail: 'Testing Perplexity AI' },
          { id: 'response-collection', name: 'Collecting Responses', status: 'waiting' }
        ]
      },
      {
        id: 'analysis',
        title: 'Report Generation',
        description: 'Analyzing results and generating comprehensive reports',
        estimatedTime: 12000, // Increased to account for unified engines
        status: 'waiting',
        subSteps: [
          { id: 'unified-analysis', name: 'Processing with Analysis Engine', status: 'waiting' },
          { id: 'data-processing', name: 'Data Processing', status: 'waiting' },
          { id: 'insight-generation', name: 'Insight Generation', status: 'waiting' },
          { id: 'report-generation', name: 'Generating Comprehensive Report', status: 'waiting' },
          { id: 'scoring', name: 'LDI Score Calculation', status: 'waiting' },
          { id: 'recommendations', name: 'Strategic Recommendations', status: 'waiting' }
        ]
      }
    ]
  }

  private async updateProgress(
    stepIndex: number,
    status: 'waiting' | 'active' | 'completed' | 'error',
    message: string,
    detail?: string,
    subStepIndex?: number,
    subStepStatus?: 'waiting' | 'active' | 'completed' | 'error'
  ): Promise<void> {
    const currentStep = this.steps[stepIndex]
    if (!currentStep) return

    const elapsedTime = Date.now() - this.startTime
    
    // FIXED: Calculate progress based on completed steps, not time
    const totalSteps = this.steps.length
    const completedSteps = this.steps.filter(s => s.status === 'completed').length
    const currentStepProgress = status === 'completed' ? 1 : 
                               status === 'active' ? 0.5 : 0  // 50% for active step
    const overallProgress = Math.min(((completedSteps + currentStepProgress) / totalSteps) * 100, 100)
    
    // Estimate remaining time based on steps left and average time per step
    const avgTimePerStep = elapsedTime / Math.max(completedSteps + (status === 'active' ? 0.5 : 0), 0.1)
    const stepsRemaining = totalSteps - completedSteps - (status === 'active' ? 0.5 : 0)
    const estimatedTimeRemaining = Math.max(stepsRemaining * avgTimePerStep, 0)

    // Update step status
    currentStep.status = status
    if (subStepIndex !== undefined && currentStep.subSteps) {
      const subStep = currentStep.subSteps[subStepIndex]
      if (subStep && subStepStatus) {
        subStep.status = subStepStatus
      }
    }

    const progressUpdate: ProgressUpdate = {
      step: currentStep.id,
      stepIndex,
      totalSteps: this.steps.length,
      status,
      message,
      detail,
      progress: overallProgress,
      elapsedTime,
      estimatedTimeRemaining,
      timestamp: new Date().toISOString(),
      subStep: subStepIndex !== undefined && currentStep.subSteps ? 
        currentStep.subSteps[subStepIndex] : undefined
    }

    // Store in Redis with better error handling
    const progressKey = `audit_progress:${this.auditId}`
    try {
      await kv.setex(progressKey, 3600, progressUpdate) // 1 hour TTL
    } catch (error) {
      console.error('🚨 KV Storage Failed - Progress not saved:', error)
      // Continue execution even if storage fails
    }
  }

  async startStep(stepIndex: number, message?: string): Promise<void> {
    this.currentStepIndex = stepIndex
    const step = this.steps[stepIndex]
    if (!step) return

    // Mark previous steps as completed
    for (let i = 0; i < stepIndex; i++) {
      this.steps[i].status = 'completed'
      if (this.steps[i].subSteps) {
        this.steps[i].subSteps!.forEach(subStep => {
          subStep.status = 'completed'
        })
      }
    }

    await this.updateProgress(
      stepIndex,
      'active',
      message || `Starting ${step.title}...`,
      step.description
    )
  }

  async updateSubStep(subStepIndex: number, status: 'active' | 'completed', detail?: string): Promise<void> {
    const currentStep = this.steps[this.currentStepIndex]
    if (!currentStep?.subSteps || !currentStep.subSteps[subStepIndex]) return

    const subStep = currentStep.subSteps[subStepIndex]
    
    // Mark previous substeps as completed
    if (status === 'active' || status === 'completed') {
      for (let i = 0; i < subStepIndex; i++) {
        if (currentStep.subSteps[i]) {
          currentStep.subSteps[i].status = 'completed'
        }
      }
    }

    await this.updateProgress(
      this.currentStepIndex,
      'active',
      `${subStep.name}${detail ? `: ${detail}` : ''}`,
      currentStep.description,
      subStepIndex,
      status
    )
  }

  async completeStep(stepIndex: number, message?: string): Promise<void> {
    const step = this.steps[stepIndex]
    if (!step) return

    // Mark all substeps as completed
    if (step.subSteps) {
      step.subSteps.forEach(subStep => {
        subStep.status = 'completed'
      })
    }

    await this.updateProgress(
      stepIndex,
      'completed',
      message || `${step.title} completed`,
      step.description
    )
  }

  async complete(message: string = 'Analysis complete!'): Promise<void> {
    // Mark all steps as completed
    this.steps.forEach(step => {
      step.status = 'completed'
      if (step.subSteps) {
        step.subSteps.forEach(subStep => {
          subStep.status = 'completed'
        })
      }
    })

    await this.updateProgress(
      this.steps.length - 1,
      'completed',
      message,
      'Your comprehensive brand visibility report is ready',
      undefined,
      undefined
    )
  }

  async error(stepIndex: number, errorMessage: string): Promise<void> {
    await this.updateProgress(
      stepIndex,
      'error',
      `Error in ${this.steps[stepIndex]?.title}: ${errorMessage}`,
      'Please try again or contact support'
    )
  }

  // Cleanup progress data
  async cleanup(): Promise<void> {
    const progressKey = `audit_progress:${this.auditId}`
    try {
      await kv.del(progressKey)
    } catch (error) {
      console.warn('Failed to cleanup progress data:', error)
    }
  }
}