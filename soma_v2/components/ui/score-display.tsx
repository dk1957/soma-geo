import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ScoreGaugeProps {
  score: number
  dimension: string
  className?: string
}

export function ScoreGauge({ score, dimension, className = '' }: ScoreGaugeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getStrokeColor = (score: number) => {
    if (score >= 80) return '#16a34a' // green-600
    if (score >= 60) return '#ca8a04' // yellow-600
    return '#ea580c' // orange-600
  }

  // Scores are out of 10, so multiply by 10 to get percentage
  const percentage = Math.min(100, Math.max(0, score * 10))
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Circular gauge */}
      <div className="relative">
        <svg className="w-20 h-20 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={getStrokeColor(score * 10)}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        {/* Score in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${getColor(score * 10)}`}>{score.toFixed(1)}</span>
        </div>
      </div>
      {/* Label */}
      <span className="text-xs font-medium text-gray-600 text-center leading-tight max-w-[90px]">{dimension}</span>
    </div>
  )
}

interface OverallScoreProps {
  score: number
  status: string
  className?: string
}

export function OverallScore({ score, status, className = '' }: OverallScoreProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getBackgroundColor = (score: number) => {
    if (score >= 80) return 'bg-green-50'
    if (score >= 60) return 'bg-yellow-50'
    return 'bg-orange-50'
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-8 h-8 text-green-600" />
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-600" />
      case 'pending':
        return <Clock className="w-8 h-8 text-gray-400" />
      case 'in_progress':
        return <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Optimized'
      case 'failed':
        return 'Failed'
      case 'pending':
        return 'Pending'
      case 'in_progress':
        return 'Optimizing...'
      default:
        return status
    }
  }

  const percentage = Math.min(100, Math.max(0, score))
  const circumference = 2 * Math.PI * 70 // radius = 70
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card className={`${getBackgroundColor(score)} border-2 ${className}`}>
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          {/* Score Circle */}
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className={getColor(score)}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${getColor(score)}`}>{score}</span>
              <span className="text-sm text-gray-500 mt-1">Overall Score</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col items-end gap-3">
            {getStatusIcon()}
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <p className="text-lg font-semibold">{getStatusText()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
