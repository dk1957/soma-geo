"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, X } from "lucide-react"
import { toast } from "sonner"

interface DemoRequestFormProps {
  isOpen: boolean
  onClose: () => void
}

export function DemoRequestForm({ isOpen, onClose }: DemoRequestFormProps) {
  // Modal-specific styles to override global CSS reset
  const modalStyles = `
    .demo-form-modal * {
      margin: initial;
      padding: initial;
    }
    .demo-form-modal .card-padding {
      padding: 1.5rem;
    }
    .demo-form-modal input,
    .demo-form-modal textarea,
    .demo-form-modal [data-radix-select-trigger] {
      padding: 0.75rem 1rem;
      margin: 0.5rem 0;
    }
    .demo-form-modal button {
      padding: 0.75rem 1.5rem;
    }
    .demo-form-modal label {
      margin-bottom: 0.5rem;
      display: block;
    }
    /* Dropdown specific styling */
    .select-content-container {
      padding: 12px !important;
      margin: 6px 0 !important;
      background-color: white !important;
      border-radius: 8px !important;
      border: 1px solid #e5e7eb !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    }
    .dark .select-content-container {
      background-color: #09090b !important;
      border-color: #27272a !important;
    }
    .select-item {
      padding: 10px 12px !important;
      margin: 2px 0 !important;
      border-radius: 6px !important;
      font-size: 1rem !important;
      transition: background-color 0.2s ease !important;
    }
    .select-item:hover {
      background-color: #f3f4f6 !important;
    }
    .dark .select-item:hover {
      background-color: #27272a !important;
    }
    @media (min-width: 640px) {
      .demo-form-modal .card-padding {
        padding: 2rem;
      }
    }
  `

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    phone: "",
    companySize: "",
    industry: "",
    message: "",
    urgency: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/onboarding/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Demo request submitted successfully! We'll be in touch within 24 hours.")
        setFormData({
          name: "",
          email: "",
          company: "",
          position: "",
          phone: "",
          companySize: "",
          industry: "",
          message: "",
          urgency: ""
        })
        onClose()
      } else {
        throw new Error('Failed to submit demo request')
      }
    } catch (error) {
      toast.error("Failed to submit demo request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="demo-form-modal fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8">
      <style dangerouslySetInnerHTML={{ __html: modalStyles }} />
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-800 mx-4 my-8 rounded-xl">
        <CardHeader className="card-padding flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-2xl font-semibold">Request Executive Demo</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full h-9 w-9 p-0 flex items-center justify-center">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="card-padding">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-base font-medium">Full Name *</Label>
                <Input
                  id="name"
                  required
                  className="h-11 px-4"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-base font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="h-11 px-4"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="company" className="text-base font-medium">Company Name *</Label>
                <Input
                  id="company"
                  required
                  className="h-11 px-4"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="position" className="text-base font-medium">Job Title *</Label>
                <Input
                  id="position"
                  required
                  className="h-11 px-4"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  className="h-11 px-4"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="companySize" className="text-base font-medium">Company Size</Label>
                <Select value={formData.companySize} onValueChange={(value) => setFormData({ ...formData, companySize: value })}>
                  <SelectTrigger className="h-11 px-4">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent className="select-content-container">
                    <SelectItem className="select-item" value="startup">Startup (1-10 employees)</SelectItem>
                    <SelectItem className="select-item" value="small">Small (11-50 employees)</SelectItem>
                    <SelectItem className="select-item" value="medium">Medium (51-200 employees)</SelectItem>
                    <SelectItem className="select-item" value="large">Large (201-1000 employees)</SelectItem>
                    <SelectItem className="select-item" value="enterprise">Enterprise (1000+ employees)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="industry" className="text-base font-medium">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                  <SelectTrigger className="h-11 px-4">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="select-content-container">
                    <SelectItem className="select-item" value="fintech">Financial Technology</SelectItem>
                    <SelectItem className="select-item" value="healthcare">Healthcare</SelectItem>
                    <SelectItem className="select-item" value="education">Education</SelectItem>
                    <SelectItem className="select-item" value="retail">Retail & E-commerce</SelectItem>
                    <SelectItem className="select-item" value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem className="select-item" value="government">Government & Public Sector</SelectItem>
                    <SelectItem className="select-item" value="consulting">Consulting</SelectItem>
                    <SelectItem className="select-item" value="technology">Technology</SelectItem>
                    <SelectItem className="select-item" value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="urgency" className="text-base font-medium">Timeline</Label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                  <SelectTrigger className="h-11 px-4">
                    <SelectValue placeholder="When do you need this?" />
                  </SelectTrigger>
                  <SelectContent className="select-content-container">
                    <SelectItem className="select-item" value="immediate">Immediate (This week)</SelectItem>
                    <SelectItem className="select-item" value="soon">Soon (Next 2-4 weeks)</SelectItem>
                    <SelectItem className="select-item" value="quarter">This quarter</SelectItem>
                    <SelectItem className="select-item" value="exploring">Just exploring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2.5 mt-8 mb-6">
              <Label htmlFor="message" className="text-base font-medium">Tell us about your AI visibility goals</Label>
              <Textarea
                id="message"
                rows={4}
                className="min-h-[120px] text-base p-4"
                placeholder="What markets do you serve? What are your main challenges with AI visibility? Any specific competitors you're concerned about?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-gray-800 mt-10 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 text-base font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-black text-white hover:bg-gray-800 h-12 text-base font-medium"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Request Demo
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}