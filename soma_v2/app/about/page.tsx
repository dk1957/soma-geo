// About Soma AI - Comprehensive Information Page for AI Crawlers
// This page provides detailed information optimized for LLM understanding

import type { Metadata } from "next"
import { ORG_CONTACT } from '@/lib/constants/contact'
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { StructuredData, MultiStructuredData, buildBreadcrumb } from "@/components/marketing/structured-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Building, Users, Globe, Shield, Award } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About Soma AI — The GEO Platform for Brands That Want AI to Recommend Them",
  description: "Soma AI monitors how ChatGPT, Claude, Gemini, and Perplexity talk about your brand — and shows you how to improve. Learn about the team building the standard for Generative Engine Optimization.",
  keywords: [
    "Soma AI company",
    "about Soma AI",
    "Generative Engine Optimization platform",
    "GEO platform",
    "AI search optimization company",
    "AI brand monitoring tool",
    "LLM visibility scoring",
    "GEO for agencies",
    "GEO Africa",
    "GEO Europe"
  ],
  openGraph: {
    title: "About Soma AI — The GEO Platform That Shows You What AI Says About Your Brand",
    description: "We built Soma AI because brands had no way to see what AI models were saying about them. Now they can monitor, measure, and improve their AI visibility.",
    type: "website",
    url: "https://withsoma.ai/about"
  }
}

export default function AboutPage() {
  const organizationData = {
    name: "Soma AI",
    description: "Soma AI is the leading Generative Engine Optimization (GEO) platform that helps brands achieve higher visibility and better rankings in AI-driven search engines including ChatGPT, Claude, Gemini, and Perplexity.",
    foundingDate: ORG_CONTACT.foundingDate,
    numberOfEmployees: "10-50",
    industry: "AI Marketing Technology",
    contactPoint: {
      "@type": "ContactPoint",
      email: ORG_CONTACT.email,
      contactType: "customer service"
    }
  }

  return (
    <>
      <StructuredData type="Organization" data={organizationData} />
      <MultiStructuredData schemas={[
        buildBreadcrumb([
          { name: 'Home', url: 'https://withsoma.ai' },
          { name: 'About', url: 'https://withsoma.ai/about' },
        ]),
      ]} />
      
      <div className="min-h-screen flex flex-col bg-white">
        <SiteHeader />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 px-6 bg-gray-50">
            <div className="container mx-auto max-w-6xl">
              <div className="max-w-4xl">
                <div className="flex items-center gap-2 mb-6">
                  <Badge variant="outline" className="border-black text-black">About Soma AI</Badge>
                  <Badge variant="outline" className="border-black text-black">Founded {ORG_CONTACT.foundingDate}</Badge>
                  <Badge variant="outline" className="border-black text-black">Global</Badge>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black leading-tight">
                  We Built This Because Nobody Could Tell You What AI Was Saying About Your Brand
                </h1>
                
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  <strong>Soma AI</strong> is a Generative Engine Optimization platform. We monitor how 
                  ChatGPT, Claude, Gemini, and Perplexity mention your brand, score your 
                  visibility with the LLM Visibility Index, and show you exactly what to change 
                  to get recommended more often.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="bg-black text-white hover:bg-gray-800">
                    <Link href="/signup">
                      Get Started Today
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="border-black text-black hover:bg-black hover:text-white">
                    <Link href="/contact">
                      Contact Us
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Company Overview */}
          <section className="py-20 px-6 bg-white">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
                Why We Exist
              </h2>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-black">The Problem</h3>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    Hundreds of millions of people now ask AI for recommendations instead of 
                    scrolling search results. When someone asks ChatGPT &quot;What is the best CRM 
                    for small businesses?&quot;, the model names a few tools. If your brand is not 
                    in that answer, you are invisible. There is no page two.
                  </p>
                  
                  <h3 className="text-2xl font-bold mb-4 text-black">What We Do About It</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Soma AI makes AI search visible and actionable. We run the prompts 
                    your customers are asking, capture every response, score your visibility, 
                    and give you specific recommendations for improving your position.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <Card className="border-gray-200">
                    <CardHeader>
                      <Globe className="h-8 w-8 text-black mb-2" />
                      <CardTitle className="text-black">Global Reach</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Serving clients across 8+ countries with specialized focus on African markets
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-gray-200">
                    <CardHeader>
                      <Award className="h-8 w-8 text-black mb-2" />
                      <CardTitle className="text-black">Industry Leadership</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Pioneering the GEO industry with innovative methodologies and proven results
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
          {/* Platform Capabilities */}
          <section className="py-20 px-6 bg-gray-50">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
                What the Platform Does
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="border-gray-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-black text-lg">LLM Discoverability Audit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Comprehensive analysis of brand visibility across major AI platforms, identifying optimization opportunities and competitive gaps.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-black text-lg">Real-Time AI Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Continuous tracking of brand mentions, sentiment, and positioning across ChatGPT, Claude, Gemini, and Perplexity responses.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-black text-lg">Content Optimization Engine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      AI-powered content analysis and optimization recommendations specifically designed for LLM understanding and preference.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-black text-lg">Competitive Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Advanced competitive analysis showing how your brand performs relative to competitors in AI-generated recommendations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section id="team" className="py-20 px-6 bg-white">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
                Our Team
              </h2>
              
              <div className="max-w-3xl mx-auto text-center">
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Soma AI is built by a passionate team of AI specialists, marketing strategists, 
                  and engineers dedicated to helping brands thrive in the age of AI-powered search.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="bg-black text-white hover:bg-gray-800">
                    <Link href="/contact">
                      Get In Touch
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Industry Expertise */}
          <section className="py-20 px-6 bg-gray-50">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
                Industry Expertise
              </h2>
              <p className="text-lg text-center mb-12 text-gray-600 max-w-3xl mx-auto">
                Soma AI serves clients across diverse industries, with specialized expertise in sectors where AI-driven 
                customer discovery is particularly impactful.
              </p>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
                <Card className="border-gray-200 bg-white text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-3">💳</div>
                    <h4 className="font-semibold text-black mb-2">Fintech</h4>
                    <p className="text-xs text-gray-600">Banking, payments, lending platforms</p>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-white text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-3">💻</div>
                    <h4 className="font-semibold text-black mb-2">SaaS</h4>
                    <p className="text-xs text-gray-600">Software platforms, dev tools</p>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-white text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-3">🛒</div>
                    <h4 className="font-semibold text-black mb-2">E-commerce</h4>
                    <p className="text-xs text-gray-600">Consumer brands, marketplaces</p>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-white text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-3">📈</div>
                    <h4 className="font-semibold text-black mb-2">Agencies</h4>
                    <p className="text-xs text-gray-600">Digital marketing agencies</p>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-white text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-3">🏥</div>
                    <h4 className="font-semibold text-black mb-2">HealthTech</h4>
                    <p className="text-xs text-gray-600">Health tech, telemedicine</p>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200 bg-white text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-3">📚</div>
                    <h4 className="font-semibold text-black mb-2">EdTech</h4>
                    <p className="text-xs text-gray-600">Education technology</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Global Presence */}
          <section className="py-20 px-6 bg-white">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
                Global Presence
              </h2>
              <p className="text-lg text-center mb-12 text-gray-600 max-w-3xl mx-auto">
                Soma AI serves clients globally with particular 
                strength across African, Middle Eastern, and European markets.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { country: "Nigeria", flag: "🇳🇬", status: "Major Market", href: "/nigeria" },
                  { country: "South Africa", flag: "🇿🇦", status: "Regional Hub", href: "/south-africa" },
                  { country: "Ghana", flag: "🇬🇭", status: "Growing Market", href: "/ghana" },
                  { country: "UAE", flag: "🇦🇪", status: "Middle East Hub", href: "/uae" },
                  { country: "Saudi Arabia", flag: "🇸🇦", status: "Growing Market", href: "/saudi-arabia" },
                  { country: "United Kingdom", flag: "🇬🇧", status: "European Base", href: "/united-kingdom" },
                  { country: "Kenya", flag: "🇰🇪", status: "Growing Market", href: "/kenya" },
                  { country: "Germany", flag: "🇩🇪", status: "European Market", href: "/germany" }
                ].map((location) => (
                  <Link key={location.country} href={location.href}>
                    <Card className="border-gray-200 text-center hover:border-black hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="text-2xl mb-2">{location.flag}</div>
                        <h4 className="font-semibold text-black">{location.country}</h4>
                        <p className="text-xs text-gray-600">{location.status}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Security & Data Handling */}
          <section className="py-20 px-6 bg-gray-50">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
                Security &amp; Data Handling
              </h2>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-lg mb-8 text-gray-600 leading-relaxed">
                    GEO works with publicly available data — your website content, third-party 
                    reviews, and published media coverage. We do not require access to your 
                    internal systems or customer databases.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-green-600" />
                      <span className="text-gray-700"><strong>GDPR Compliant</strong> — European data protection standards</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-green-600" />
                      <span className="text-gray-700"><strong>Encrypted at rest and in transit</strong> — brand data and monitoring results</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-green-600" />
                      <span className="text-gray-700"><strong>Role-based access</strong> — team and client permission controls</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-green-600" />
                      <span className="text-gray-700"><strong>Multi-tenant isolation</strong> — brand data is fully separated between accounts</span>
                    </div>
                  </div>
                </div>
                
                <Card className="border-gray-200 bg-white">
                  <CardHeader>
                    <Shield className="h-12 w-12 text-black mb-4" />
                    <CardTitle className="text-black">No Tracking, No Cookies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      GEO optimization analyzes public content — not user behavior. 
                      We do not install trackers on your site, set third-party cookies, 
                      or collect personally identifiable information from your visitors.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• No tracking pixels required</li>
                      <li>• No JavaScript tags on your site</li>
                      <li>• Works entirely with public data</li>
                      <li>• Transparent methodology</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-20 px-6 bg-white">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
                Connect With Soma AI
              </h2>
              
              <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-black">Business Inquiries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">General:</span>
                        <a href={`mailto:${ORG_CONTACT.email}`} className="text-black hover:underline">
                          {ORG_CONTACT.email}
                        </a>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">Sales:</span>
                        <a href="mailto:sales@withsoma.ai" className="text-black hover:underline">
                          sales@withsoma.ai
                        </a>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">Support:</span>
                        <a href="mailto:support@withsoma.ai" className="text-black hover:underline">
                          support@withsoma.ai
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-black">Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Link href="/blog" className="block text-black hover:underline">
                        → GEO Insights Blog
                      </Link>
                      <Link href="/case-studies" className="block text-black hover:underline">
                        → Client Success Stories
                      </Link>
                      <Link href="/docs" className="block text-black hover:underline">
                        → Platform Documentation
                      </Link>
                      <Link href="/api-docs" className="block text-black hover:underline">
                        → API Documentation
                      </Link>
                      <Link href="/contact" className="block text-black hover:underline">
                        → Contact Us
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-6 bg-black text-white">
            <div className="container mx-auto max-w-4xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Find Out What AI Is Saying About Your Brand
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Run a free audit in under 5 minutes. See which AI models mention you, 
                which mention your competitors, and what to do about it.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-white text-black hover:bg-gray-200">
                  <Link href="/free-audit">
                    Start Free AI Audit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" asChild className="border border-white bg-transparent text-white hover:bg-white hover:text-black">
                  <Link href="/contact">
                    Contact Our Team
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
        
        <SiteFooter />
      </div>
    </>
  )
}