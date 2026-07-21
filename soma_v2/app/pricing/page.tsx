// Contact Page - Get in touch with Soma AI team

'use client'

import { useState } from "react"
import { ORG_CONTACT } from '@/lib/constants/contact'
import Link from "next/link"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, Clock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"

export default function ContactPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    message: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send message')
      }

      setFormState('success')
      setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', role: '', message: '' })
    } catch (err: any) {
      setFormState('error')
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
      <div className="min-h-screen flex flex-col bg-white">
        <SiteHeader />
        
        <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-12 px-6 bg-gray-50">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black leading-tight">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions about AI search visibility? We&apos;d love to hear from you.
            </p>
          </div>

        </section>

        {/* Contact Form & Info Section */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="border-gray-200 p-8">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-2xl text-black mb-2">Send Us a Message</CardTitle>
                    <p className="text-gray-600">
                      Tell us about your goals and we&apos;ll get back to you within 2 hours.
                    </p>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    {formState === 'success' ? (
                      <div className="text-center py-12">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-black mb-2">Message Sent!</h3>
                        <p className="text-gray-600 mb-6">
                          We&apos;ll get back to you within 2 hours during business hours.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setFormState('idle')}
                          className="border-black text-black hover:bg-black hover:text-white"
                        >
                          Send Another Message
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                              First Name *
                            </label>
                            <Input
                              id="firstName"
                              type="text"
                              required
                              value={formData.firstName}
                              onChange={e => handleChange('firstName', e.target.value)}
                              className="w-full"
                              placeholder="First name"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <Input
                              id="lastName"
                              type="text"
                              value={formData.lastName}
                              onChange={e => handleChange('lastName', e.target.value)}
                              className="w-full"
                              placeholder="Last name"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address *
                            </label>
                            <Input
                              id="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={e => handleChange('email', e.target.value)}
                              className="w-full"
                              placeholder="you@company.com"
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={e => handleChange('phone', e.target.value)}
                              className="w-full"
                              placeholder="+1 910 519 9239"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                              Company *
                            </label>
                            <Input
                              id="company"
                              type="text"
                              required
                              value={formData.company}
                              onChange={e => handleChange('company', e.target.value)}
                              className="w-full"
                              placeholder="Company name"
                            />
                          </div>
                          <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                              Your Role
                            </label>
                            <Select onValueChange={v => handleChange('role', v)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CEO / Founder">CEO / Founder</SelectItem>
                                <SelectItem value="CMO / VP Marketing">CMO / VP Marketing</SelectItem>
                                <SelectItem value="Marketing Director">Marketing Director</SelectItem>
                                <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                                <SelectItem value="Head of Growth">Head of Growth</SelectItem>
                                <SelectItem value="SEO Specialist">SEO Specialist</SelectItem>
                                <SelectItem value="Agency Owner">Agency Owner</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                            Message *
                          </label>
                          <Textarea
                            id="message"
                            required
                            rows={5}
                            value={formData.message}
                            onChange={e => handleChange('message', e.target.value)}
                            className="w-full"
                            placeholder="Tell us about your AI search challenges or what you'd like to achieve..."
                          />
                        </div>

                        {formState === 'error' && (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {errorMessage}
                          </div>
                        )}

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full bg-black text-white hover:bg-gray-800"
                          disabled={formState === 'submitting'}
                        >
                          {formState === 'submitting' ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Message
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>

                        <p className="text-sm text-gray-500 text-center">
                          By submitting, you agree to our{" "}
                          <Link href="/privacy" className="underline hover:text-black">
                            Privacy Policy
                          </Link>{" "}
                          and{" "}
                          <Link href="/terms" className="underline hover:text-black">
                            Terms of Service
                          </Link>.
                        </p>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <Card className="border-gray-200 p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl text-black mb-4">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 space-y-6">
                    <div className="flex items-start gap-4">
                      <Mail className="h-6 w-6 text-black mt-1" />
                      <div>
                        <h4 className="font-semibold text-black">Email</h4>
                        <a href={`mailto:${ORG_CONTACT.email}`} className="text-gray-600 hover:text-black hover:underline">
                          {ORG_CONTACT.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-black mt-1" />
                      <div>
                        <h4 className="font-semibold text-black">Phone</h4>
                        <a href="tel:+19105199239" className="text-gray-600 hover:text-black hover:underline">
                          +1 (910) 519-9239
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Clock className="h-6 w-6 text-black mt-1" />
                      <div>
                        <h4 className="font-semibold text-black">Response Time</h4>
                        <p className="text-gray-600">Within 2 hours</p>
                        <p className="text-sm text-gray-500">During business hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl text-black mb-4">Office Hours</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Monday – Friday</span>
                      <span className="text-gray-600">9:00 AM – 6:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Saturday</span>
                      <span className="text-gray-600">10:00 AM – 2:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Sunday</span>
                      <span className="text-gray-600">Closed</span>
                    </div>
                    <hr className="my-4" />
                    <p className="text-sm text-gray-500">
                      24/7 support available for Enterprise clients
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 p-6 bg-gray-50">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl text-black mb-4">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 space-y-3">
                    <Link href="/free-audit" className="block text-black hover:underline">
                      → Start Free AI Audit
                    </Link>
                    <Link href="/about" className="block text-black hover:underline">
                      → About Soma AI
                    </Link>
                    <Link href="/faq" className="block text-black hover:underline">
                      → Frequently Asked Questions
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 bg-black text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to see how AI search engines perceive your brand?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Get a free AI visibility audit in under 2 minutes.
            </p>
            <Link href="/free-audit">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 transition-colors">
                Get A Free Audit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
