"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Shield, Lock } from 'lucide-react'

interface EmailCaptureGateProps {
  reportTitle: string
  brandName: string
  shareToken: string
  onSuccess: (accessToken: string) => void
}

export function EmailCaptureGate({ 
  reportTitle, 
  brandName, 
  shareToken, 
  onSuccess 
}: EmailCaptureGateProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/reports/external/public/${shareToken}/capture-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          company: company.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      // Store access token in localStorage
      localStorage.setItem(`report_access_${shareToken}`, data.access_token)
      
      // Call success callback
      onSuccess(data.access_token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = email.trim().length > 0

  return (
    <div className="bg-black rounded-lg p-8">
      {/* Top section with CTA */}
      <div className="border-b border-white/20 pb-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Lock className="h-5 w-5 text-black" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              Unlock Full Report
            </h3>
            <p className="text-sm text-gray-300">
              Enter your details to access the complete analysis for <span className="font-semibold text-white">{brandName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Form - Compact horizontal layout */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email field */}
          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className="block text-xs font-semibold text-white uppercase tracking-wide"
            >
              Work Email *
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              autoFocus
              className={`h-11 text-base bg-white text-black border-2 transition-all duration-200 ${
                focusedField === 'email' 
                  ? 'border-white shadow-sm ring-2 ring-white/20' 
                  : 'border-white/30 hover:border-white/50'
              } focus:border-white focus:ring-2 focus:ring-white/20 rounded-lg placeholder:text-gray-400`}
            />
          </div>

          {/* Name field */}
          <div className="space-y-2">
            <label 
              htmlFor="name" 
              className="block text-xs font-semibold text-white uppercase tracking-wide"
            >
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              className={`h-11 text-base bg-white text-black border-2 transition-all duration-200 ${
                focusedField === 'name' 
                  ? 'border-white shadow-sm ring-2 ring-white/20' 
                  : 'border-white/30 hover:border-white/50'
              } focus:border-white focus:ring-2 focus:ring-white/20 rounded-lg placeholder:text-gray-400`}
            />
          </div>

          {/* Company field */}
          <div className="space-y-2">
            <label 
              htmlFor="company" 
              className="block text-xs font-semibold text-white uppercase tracking-wide"
            >
              Company
            </label>
            <Input
              id="company"
              type="text"
              placeholder="Acme Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onFocus={() => setFocusedField('company')}
              onBlur={() => setFocusedField(null)}
              className={`h-11 text-base bg-white text-black border-2 transition-all duration-200 ${
                focusedField === 'company' 
                  ? 'border-white shadow-sm ring-2 ring-white/20' 
                  : 'border-white/30 hover:border-white/50'
              } focus:border-white focus:ring-2 focus:ring-white/20 rounded-lg placeholder:text-gray-400`}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-500/50">
            <svg className="h-4 w-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* Submit button and trust indicators */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="w-full sm:w-auto h-11 px-8 bg-white hover:bg-gray-100 text-black font-semibold text-base rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <span className="flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  View Complete Report
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </span>
          </Button>
          
          {/* Trust indicators */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure</span>
            </div>
            <div className="w-px h-3 bg-gray-600" />
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No spam</span>
            </div>
            <div className="w-px h-3 bg-gray-600" />
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
