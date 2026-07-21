"use client"

import { useEffect, useState } from "react"
import { CheckCircle, AlertTriangle, Info, X, ShieldAlert, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  type: "success" | "warning" | "info" | "error"
  title: string
  message: string
  details?: string
  actionText?: string
  onAction?: () => void
  duration?: number
  onClose?: () => void
}

export function Toast({ 
  type, 
  title, 
  message, 
  details, 
  actionText, 
  onAction, 
  duration = 7000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Extend duration for error messages
  const effectiveDuration = type === 'error' ? Math.max(duration, 8000) : duration

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }, effectiveDuration)

    return () => clearTimeout(timer)
  }, [effectiveDuration, onClose])

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
    error: ShieldAlert,
  }

  const colors = {
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-orange-200 bg-orange-50 text-orange-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    error: "border-red-300 bg-red-50 text-red-900",
  }

  const iconColors = {
    success: "text-green-600",
    warning: "text-orange-600",
    info: "text-blue-600",
    error: "text-red-600",
  }

  const Icon = icons[type]

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-96 rounded-xl border-2 p-5 shadow-sm transition-all duration-300 backdrop-blur-sm",
        colors[type],
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95",
      )}
    >
      <div className="flex items-start space-x-4">
        <div className={cn("flex-shrink-0 rounded-full p-1", iconColors[type])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-base leading-tight">{title}</h4>
              <p className="text-sm mt-1.5 leading-relaxed opacity-90">{message}</p>
              
              {details && (
                <div className={cn(
                  "mt-2 transition-all duration-200",
                  isExpanded ? "block" : "hidden"
                )}>
                  <div className="text-xs opacity-75 bg-white/40 rounded-md p-2 border border-current/10">
                    {details}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                {details && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-medium hover:underline opacity-75 hover:opacity-100"
                  >
                    {isExpanded ? 'Hide details' : 'Show details'}
                  </button>
                )}
                
                {actionText && onAction && (
                  <button
                    onClick={onAction}
                    className="text-xs font-medium px-3 py-1 rounded-md bg-current/10 hover:bg-current/20 transition-colors"
                  >
                    {actionText}
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(() => onClose?.(), 300)
              }}
              className="flex-shrink-0 ml-2 opacity-60 hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-current/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced error helper functions
export const getAuthErrorDetails = (error: string): { title: string; message: string; details?: string; actionText?: string } => {
  const normalizedError = error.toLowerCase()
  
  if (normalizedError.includes('invalid login credentials') || normalizedError.includes('invalid email or password')) {
    return {
      title: "Authentication Failed",
      message: "The email or password you entered is incorrect.",
      details: "Double-check your credentials and try again. If you've forgotten your password, you can reset it.",
      actionText: "Reset Password"
    }
  }
  
  if (normalizedError.includes('email not confirmed') || normalizedError.includes('email_not_confirmed')) {
    return {
      title: "Email Not Verified",
      message: "Please check your email and click the verification link.",
      details: "We sent a verification email when you signed up. Check your spam folder if you don't see it.",
      actionText: "Resend Email"
    }
  }
  
  if (normalizedError.includes('user not found') || normalizedError.includes('user_not_found')) {
    return {
      title: "Account Not Found",
      message: "No account exists with this email address.",
      details: "You may need to create an account first, or try a different email address.",
      actionText: "Sign Up"
    }
  }
  
  if (normalizedError.includes('too many requests') || normalizedError.includes('rate limit')) {
    return {
      title: "Too Many Attempts",
      message: "Please wait a moment before trying again.",
      details: "For security reasons, we've temporarily limited sign-in attempts. Try again in a few minutes."
    }
  }
  
  if (normalizedError.includes('network') || normalizedError.includes('connection') || normalizedError.includes('timeout')) {
    return {
      title: "Connection Problem",
      message: "Unable to connect to our servers.",
      details: "Check your internet connection and try again. If the problem persists, our servers may be temporarily unavailable.",
      actionText: "Retry"
    }
  }
  
  if (normalizedError.includes('password') && normalizedError.includes('weak')) {
    return {
      title: "Password Too Weak",
      message: "Please choose a stronger password.",
      details: "Your password should be at least 6 characters long and include a mix of letters and numbers."
    }
  }
  
  if (normalizedError.includes('email') && normalizedError.includes('invalid')) {
    return {
      title: "Invalid Email",
      message: "Please enter a valid email address.",
      details: "Make sure your email follows the format: example@domain.com"
    }
  }
  
  // Generic fallback
  return {
    title: "Something Went Wrong",
    message: error || "An unexpected error occurred.",
    details: "Please try again. If the problem continues, contact our support team.",
    actionText: "Try Again"
  }
}

// Toast manager hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])

  const addToast = (toast: Omit<ToastProps, "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id, onClose: () => removeToast(id) }])
  }
  
  const addAuthErrorToast = (error: string, onAction?: () => void) => {
    const errorDetails = getAuthErrorDetails(error)
    addToast({
      type: "error",
      ...errorDetails,
      onAction: onAction || undefined
    })
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )

  return { addToast, addAuthErrorToast, ToastContainer }
}
