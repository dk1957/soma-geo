'use client'

import React, { useState, useEffect } from 'react'
import { Brain, CheckCircle, RefreshCw, Cpu, Network, BarChart3 } from "lucide-react"

interface ProgressStep {
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

interface InlineAIProgressProps {
  brandName: string
  targetMarkets: string[]
  runId?: string
  promptCount?: number
  modelCount?: number
  onComplete?: (runResults: any) => void
}

export function InlineAIProgress({ brandName, targetMarkets, runId, promptCount = 2, modelCount = 4, onComplete }: InlineAIProgressProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentInsight, setCurrentInsight] = useState(`Initializing run for ${brandName}...`)
  const [isComplete, setIsComplete] = useState(false)
  const [auditResults, setAuditResults] = useState<any>(null)
  const [startTime] = useState(Date.now()) // Track when component started

  // Real-time insight messages for marketing executives
  const insightMessages = [
    `Initializing run for ${brandName}...`,
    `Processing ${promptCount} high-intent prompts across ${modelCount} AI models...`,
    `ChatGPT analyzing customer queries with live web data...`,
    `Claude 3.5 processing market research scenarios...`,
    `Gemini evaluating competitive landscape...`,
    `Grok analyzing emerging trends and opportunities...`,
    `Generating comprehensive visibility insights...`,
    `Compiling strategic recommendations for ${brandName}...`
  ]

  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'initialization',
      title: 'Run Setup',
      description: `Preparing ${promptCount} prompts for analysis`,
      estimatedTime: 5000,
      status: 'active',
      subSteps: [
        { id: 'auth', name: 'Authenticating & Loading Brand Context', status: 'active' },
        { id: 'prompts', name: 'Validating High-Intent Prompts', status: 'waiting' }
      ]
    },
    {
      id: 'processing',
      title: 'AI Model Processing',
      description: `Running ${promptCount}×${modelCount} runs across top AI platforms`,
      estimatedTime: 45000,
      status: 'waiting',
      subSteps: [
        { id: 'chatgpt', name: 'ChatGPT-5 Mini (Online)', status: 'waiting', detail: 'Processing with live web search' },
        { id: 'claude', name: 'Claude 3.5 Haiku (Online)', status: 'waiting', detail: 'Real-time analysis' },
        { id: 'gemini', name: 'Gemini 2.5 Flash (Online)', status: 'waiting', detail: 'Current data integration' },
        { id: 'grok', name: 'Grok 3 Mini (Online)', status: 'waiting', detail: 'Live trend analysis' }
      ]
    },
    {
      id: 'insights',
      title: 'Strategic Analysis',
      description: 'Generating executive insights and recommendations',
      estimatedTime: 10000,
      status: 'waiting',
      subSteps: [
        { id: 'analysis', name: 'Response Analysis & Brand Detection', status: 'waiting' },
        { id: 'scoring', name: 'Visibility Score Calculation', status: 'waiting' },
        { id: 'report', name: 'Executive Summary Generation', status: 'waiting' }
      ]
    }
  ])

  // Timer-based stage progression (30-40 seconds per stage)
  useEffect(() => {
    if (isComplete) return

    // Update elapsed time every second
    const timer = setInterval(() => {
      const currentElapsed = Date.now() - startTime
      setElapsedTime(currentElapsed)
    }, 1000)

    // Stage progression timers
    const stageTimers: NodeJS.Timeout[] = []

    // Stage 1: Initialization (30 seconds)
    stageTimers.push(setTimeout(() => {
      setCurrentStep(1)
      setSteps(prevSteps => {
        const newSteps = [...prevSteps]
        newSteps[0].status = 'completed'
        newSteps[1].status = 'active'
        return newSteps
      })
      setCurrentInsight(`Processing ${promptCount} prompts across ${modelCount} AI models...`)
    }, 30000))

    // Stage 2: Processing (70 seconds total)
    stageTimers.push(setTimeout(() => {
      setCurrentStep(2)
      setSteps(prevSteps => {
        const newSteps = [...prevSteps]
        newSteps[1].status = 'completed'
        newSteps[2].status = 'active'
        return newSteps
      })
      setCurrentInsight('Generating insights and recommendations...')
    }, 70000))

    // Stage 3: Complete (100 seconds total)
    stageTimers.push(setTimeout(() => {
      setIsComplete(true)
      setSteps(prevSteps => {
        const newSteps = [...prevSteps]
        newSteps[2].status = 'completed'
        return newSteps
      })
      setCurrentInsight('Analysis complete!')

      // Try to fetch results if run ID available
      if (runId) {
        const fetchResults = async () => {
          try {
            const resultsResponse = await fetch(`/api/llm-run?run_id=${runId}`)
            const resultsData = await resultsResponse.json()

            if (resultsData.success && resultsData.responses) {
              setAuditResults(resultsData)
              onComplete?.(resultsData)
            } else {
              onComplete?.(null)
            }
          } catch (error) {
            console.error('Error fetching results:', error)
            onComplete?.(null)
          }
        }
        fetchResults()
      } else {
        onComplete?.(null)
      }
    }, 100000))

    return () => {
      clearInterval(timer)
      stageTimers.forEach(timer => clearTimeout(timer))
    }
  }, [isComplete, startTime, runId, promptCount, modelCount, onComplete])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getStepIcon = (step: ProgressStep) => {
    switch (step.id) {
      case 'initialization': return <Cpu className="h-4 w-4" />
      case 'processing': return <Network className="h-4 w-4" />
      case 'insights': return <BarChart3 className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'active': return <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
      case 'error': return <div className="h-3 w-3 rounded-full bg-red-500" />
      default: return <div className="h-3 w-3 rounded-full bg-gray-300" />
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Minimal Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-black">AI Visibility Run</h2>
            <p className="text-sm text-gray-600 mt-1">
              {brandName} • {promptCount} scenarios • {modelCount} AI models
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-black">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Current Status */}
      {currentInsight && !isComplete && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 bg-black rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-800 font-medium">{currentInsight}</p>
          </div>
        </div>
      )}
      

      {/* Ultra-Minimal Steps */}
      <div className="space-y-1">
        {steps.map((step, index) => (
          <div key={step.id} className={`border rounded-lg p-3 transition-all duration-200 ${
            step.status === 'active' ? 'border-black bg-gray-50' :
            step.status === 'completed' ? 'border-gray-300 bg-white' :
            'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step.status === 'active' ? 'bg-black text-white' :
                step.status === 'completed' ? 'bg-black text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="h-3 w-3" />
                ) : step.status === 'active' ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  getStepIcon(step)
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium text-sm ${
                    step.status === 'active' ? 'text-black' : 'text-gray-700'
                  }`}>{step.title}</h3>
                  {step.status === 'active' && (
                    <span className="text-xs text-gray-500">active</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              </div>
            </div>

            {/* Model Progress for Processing Step */}
            {step.id === 'processing' && step.status !== 'waiting' && step.subSteps && (
              <div className="mt-3 ml-9 grid grid-cols-2 gap-2">
                {step.subSteps.map((subStep) => (
                  <div key={subStep.id} className="flex items-center gap-2">
                    <div className={`h-1 w-1 rounded-full ${
                      subStep.status === 'completed' ? 'bg-black' :
                      subStep.status === 'active' ? 'bg-black animate-pulse' :
                      'bg-gray-300'
                    }`}></div>
                    <span className={`text-xs ${
                      subStep.status === 'completed' ? 'text-gray-600 line-through' :
                      subStep.status === 'active' ? 'text-black font-medium' :
                      'text-gray-500'
                    }`}>
                      {subStep.name.replace(' (Online)', '')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Minimal Completion State */}
      {isComplete && (
        <div className="bg-white border border-black rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-black">Run Complete</h3>
              <p className="text-sm text-gray-600">
                AI visibility analysis finished
                {auditResults && auditResults.responses && (
                  <span className="font-medium text-black"> • {auditResults.responses.length} responses generated</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTime(elapsedTime)} • {promptCount}×{modelCount} runs
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}