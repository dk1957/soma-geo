"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, X, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface PilotBookingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PilotBookingModal({ isOpen, onClose }: PilotBookingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    phone: "",
    companySize: "",
    urgency: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/onboarding/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          message: `Pilot Program Request - Discounted Rate Interest\nCompany: ${formData.company}\nPosition: ${formData.position}\nTimeline: ${formData.urgency}`
        }),
      })

      if (response.ok) {
        toast.success("🎉 Great! We'll reach out within 24 hours to discuss your pilot program.")
        setFormData({
          name: "",
          email: "",
          company: "",
          position: "",
          phone: "",
          companySize: "",
          urgency: ""
        })
        onClose()
      } else {
        throw new Error('Failed to submit request')
      }
    } catch (error) {
      toast.error("Failed to submit. Please try again or email us directly.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200 pointer-events-auto animate-in zoom-in-95 fade-in duration-200 bg-white">
          <CardHeader className="relative pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    Limited Time Offer
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Start Your AI Visibility Pilot
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Get started with a 3-month pilot at <span className="font-semibold text-orange-600">30% off</span> our standard rate
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="hover:bg-gray-100 rounded-full h-8 w-8 p-0 flex items-center justify-center -mt-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    className="h-10"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="h-10"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium">Company Name *</Label>
                  <Input
                    id="company"
                    required
                    className="h-10"
                    placeholder="Your Company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium">Job Title *</Label>
                  <Input
                    id="position"
                    required
                    className="h-10"
                    placeholder="Marketing Director"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    className="h-10"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySize" className="text-sm font-medium">Company Size</Label>
                  <Select value={formData.companySize} onValueChange={(value) => setFormData({ ...formData, companySize: value })}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">1-10 employees</SelectItem>
                      <SelectItem value="small">11-50 employees</SelectItem>
                      <SelectItem value="medium">51-200 employees</SelectItem>
                      <SelectItem value="large">201-1000 employees</SelectItem>
                      <SelectItem value="enterprise">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency" className="text-sm font-medium">When would you like to start?</Label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">This week</SelectItem>
                    <SelectItem value="soon">Next 2-4 weeks</SelectItem>
                    <SelectItem value="quarter">This quarter</SelectItem>
                    <SelectItem value="exploring">Just exploring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Benefits */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Pilot Program Includes:</h4>
                <ul className="text-sm text-gray-700 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">✓</span>
                    <span>30% discount on first 3 months</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">✓</span>
                    <span>Priority onboarding and setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">✓</span>
                    <span>Weekly strategy sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">✓</span>
                    <span>Custom AI visibility roadmap</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-11"
                >
                  Maybe Later
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-11 font-semibold"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Book Pilot Program
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2">
                No commitment required • Cancel anytime • Data privacy guaranteed
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
