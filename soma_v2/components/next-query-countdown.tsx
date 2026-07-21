"use client"

import { useState, useEffect } from "react"
import { Clock, Sparkles } from "lucide-react"
import { useBrand } from "@/lib/contexts/brand-context"
import { useAuth } from "@/lib/contexts/auth-context"

interface NextQueryCountdownProps {
  className?: string
  label?: string
}

// Admin users who can manually run runs (same as in run-control)
const ADMIN_EMAILS = ['dannykofiarmah@gmail.com']

export function NextQueryCountdown({ className = "", label = "Next Auto-Run" }: NextQueryCountdownProps) {
  const { currentBrand } = useBrand()
  const { user } = useAuth()
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number
    minutes: number
    seconds: number
  }>({ hours: 0, minutes: 0, seconds: 0 })
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null)

  // Check if user is admin
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email)
  
  // Show countdown for non-admin users in production, or all users in development
  const showCountdown = process.env.NODE_ENV === 'development' || !isAdmin

  // Calculate next run time (daily at 6 AM UTC - matches vercel.json cron schedule)
  useEffect(() => {
    const calculateNextRun = () => {
      const now = new Date()
      const next = new Date()
      
      // Set to 6 AM UTC (matches cron: 0 6 * * *)
      next.setUTCHours(6, 0, 0, 0)
      
      // If we're already past 6 AM UTC today, it's tomorrow
      if (next <= now) {
        next.setUTCDate(next.getUTCDate() + 1)
      }
      
      setNextRunTime(next)
    }

    calculateNextRun()
  }, [currentBrand])

  // Update countdown every second
  useEffect(() => {
    if (!nextRunTime) return

    const updateCountdown = () => {
      const now = new Date()
      const diff = nextRunTime.getTime() - now.getTime()

      if (diff <= 0) {
        // Time's up, recalculate next run
        const next = new Date(nextRunTime)
        next.setUTCDate(next.getUTCDate() + 1)
        setNextRunTime(next)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({ hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [nextRunTime])

  if (!currentBrand) return null
  if (!showCountdown) return null

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 ${className}`}>
      {/* Icon with subtle animation */}
      <div className="relative flex items-center justify-center">
        <Clock className="h-4 w-4 text-gray-700" />
        <Sparkles className="absolute h-2 w-2 text-yellow-500 -top-0.5 -right-0.5 animate-pulse" />
      </div>

      {/* Countdown display */}
      <div className="flex flex-col">
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none mb-0.5">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {/* Hours */}
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-semibold text-black tabular-nums">
              {String(timeRemaining.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">h</span>
          </div>
          
          <span className="text-xs text-gray-300 font-bold">:</span>
          
          {/* Minutes */}
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-semibold text-black tabular-nums">
              {String(timeRemaining.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">m</span>
          </div>
          
          <span className="text-xs text-gray-300 font-bold">:</span>
          
          {/* Seconds */}
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-semibold text-black tabular-nums">
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
