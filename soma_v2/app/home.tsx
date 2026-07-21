"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowRight, Search, Pencil, BarChart3, Bot, Zap } from "lucide-react"
import Link from "next/link"
import { DemoRequestForm } from "@/components/marketing/demo-request-form"
import { checkUserStatus, getRedirectDestination, DetailedUserStatus } from "@/lib/utils/user-status-checker"
import { MultiStructuredData, buildHowTo, buildFAQ, buildSiteNavigation, buildWebsiteSchema } from "@/components/marketing/structured-data"
import { SOCIAL_LINKS, ORG_CONTACT } from '@/lib/constants/contact'
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import Image from "next/image"

interface AIPlatform {
  name: string
  logo: string
  textColor?: string
  order: number
}

interface HomePageData {
  hero: {
    aiPlatforms: AIPlatform[]
    secondLine: string
    thirdLine: string
    subtitle?: string
    videoUrl: string
    ctaPrimary?: string
    ctaSecondary?: string
    socialProofText?: string
  }
  stats: {
    sectionTitle?: string
    statistics: Array<{
      value: string
      suffix?: string
      description: string
      source?: string
    }>
    trustIndicators?: string[]
  }
  howItWorks: {
    title: string
    titleHighlight: string
    subtitle?: string
    steps: Array<{
      number: string
      title: string
      description: string
      icon?: string
    }>
  }
  enterprise: {
    sectionLabel?: string
    title: string
    titleHighlight: string
    subtitle?: string
    capabilities: Array<{
      title: string
      description: string
    }>
    ctaText?: string
    ctaLink?: string
  }
  faq: {
    title: string
    questions: Array<{
      question: string
      answer: string
    }>
  }
}

const iconMap: Record<string, any> = {
  Search,
  Pencil,
  BarChart3,
  Bot,
  Zap,
}

function AnimatedAIPlatforms({ platforms }: { platforms: AIPlatform[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Fallback platforms if none configured in Sanity
  const defaultPlatforms: AIPlatform[] = [
    { name: 'ChatGPT', logo: '/models/chatgpt_black.png', textColor: '#10a37f', order: 0 },
    { name: 'Claude', logo: '/models/claude-logo.png', textColor: '#CC785C', order: 1 },
    { name: 'Gemini', logo: '/models/gemini-logo.png', textColor: '#4285F4', order: 2 },
  ]

  const sortedPlatforms = platforms && platforms.length > 0 
    ? [...platforms].sort((a, b) => a.order - b.order)
    : defaultPlatforms

  useEffect(() => {
    if (sortedPlatforms.length === 0) return

    const interval = setInterval(() => {
      setIsVisible(false)
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % sortedPlatforms.length)
        setIsVisible(true)
      }, 300)
      
    }, 2500)

    return () => clearInterval(interval)
  }, [sortedPlatforms.length])

  if (sortedPlatforms.length === 0) {
    return <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">AI</span>
  }

  const currentPlatform = sortedPlatforms[currentIndex]

  return (
    <span 
      className={`inline-flex items-center justify-start gap-2 md:gap-3 transition-all duration-300 whitespace-nowrap ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
      }`}
      style={{ minWidth: '280px', height: '1.2em' }}
    >
      {currentPlatform?.logo && (
        <div className="flex-shrink-0 flex items-center justify-center">
          <Image
            src={currentPlatform.logo}
            alt={currentPlatform.name}
            width={40}
            height={40}
            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 transition-transform duration-300 hover:scale-110 object-contain"
          />
        </div>
      )}
      <span 
        className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-none flex-shrink-0"
        style={{ color: currentPlatform?.textColor || '#000000' }}
      >
        {currentPlatform?.name || 'AI'}
      </span>
    </span>
  )
}

export default function HomePage({ pageData }: { pageData: HomePageData }) {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false)
  const [isProductionSite, setIsProductionSite] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const isProduction = hostname === 'withsoma.ai' || hostname === 'www.withsoma.ai'
      setIsProductionSite(isProduction)
    }
  }, [])

  useEffect(() => {
    // Wait for Clerk to load
    if (!isClerkLoaded) return;
    
    const checkSession = async () => {
      try {
        // If signed in with Clerk, check user status
        if (isSignedIn && clerkUser?.id) {
          // Pass Clerk user ID to checkUserStatus
          const userStatus: DetailedUserStatus = await checkUserStatus(clerkUser.id)
          setUser(userStatus.user || clerkUser)

          if (userStatus.isAuthenticated && userStatus.shouldRedirectTo && userStatus.shouldRedirectTo !== 'signin') {
            const redirectUrl = await getRedirectDestination()
            router.push(redirectUrl)
            return
          }
        }
      } catch (error) {
        console.error('Error during user status check:', error)
        // Fallback: if Clerk says signed in, redirect to onboarding
        if (isSignedIn && clerkUser) {
          setUser(clerkUser)
          router.push('/onboarding')
          return
        }
      }
      
      setLoading(false)
    }
    
    checkSession()
  }, [router, isClerkLoaded, isSignedIn, clerkUser])

  const CTAButton = () => {
    if (loading) {
      return (
        <Button disabled className="bg-gray-400 text-gray-100 px-8 py-4 text-lg h-12 rounded-md">
          Loading...
        </Button>
      )
    }
    
    if (user) {
      return (
        <Button disabled className="bg-gray-400 text-gray-100 px-8 py-4 text-lg h-12 rounded-md">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
          Redirecting...
        </Button>
      )
    }
    
    return (
      <Button asChild className="bg-white text-black hover:bg-gray-200 border-2 border-white transition-all duration-300 px-8 py-6 text-lg h-14 rounded-none font-medium tracking-wide">
        <Link href="/free-audit">
          Get A Free Brand Audit
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    )
  }

  // Build structured data
  const howToSchema = buildHowTo({
    name: `${pageData.howItWorks.title} ${pageData.howItWorks.titleHighlight}`,
    description: pageData.howItWorks.subtitle || '',
    steps: pageData.howItWorks.steps.map(s => ({ name: s.title, text: s.description })),
  })
  const faqSchema = buildFAQ(pageData.faq.questions.map(i => ({ question: i.question, answer: i.answer })), 'Soma AI — Frequently Asked Questions')
  const navSchema = buildSiteNavigation([
    { name: 'How It Works', url: 'https://withsoma.ai/#how-it-works' },
    { name: 'Enterprise', url: 'https://withsoma.ai/#enterprise' },
  ])
  const websiteSchema = buildWebsiteSchema()
  const schemas = [howToSchema, faqSchema, navSchema, websiteSchema]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MultiStructuredData schemas={schemas} />
      
      {/* Header */}
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-24 lg:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <iframe
            src={pageData.hero.videoUrl}
            title="Background Video"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-60"
            style={{
              width: '100vw',
              height: '56.25vw',
              minHeight: '100vh',
              minWidth: '177.77vh',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div className="absolute inset-0 bg-black/90"></div>
          {/* Geometric Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
          {/* Artistic Lines */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-white/10"></div>
          <div className="absolute top-1/3 right-0 w-full h-px bg-white/10"></div>
          <div className="absolute bottom-20 right-1/4 w-64 h-64 border border-white/10 rounded-full opacity-20"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <div className="space-y-8 mb-12">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="w-12 h-px bg-white/60"></div>
              <span className="text-sm text-white/90 font-medium tracking-[0.2em] uppercase">AI Search Optimization</span>
              <div className="w-12 h-px bg-white/60"></div>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95]">
              <span className="block text-white font-extralight mb-2">
                <AnimatedAIPlatforms platforms={pageData.hero.aiPlatforms} />
              </span>
              <span className="block text-white/90 font-light">
                Has Replaced Search.
              </span>
              <span className="block text-white font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                Is Your Brand Included?
              </span>
            </h1>
          </div>
          
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed">
              The window to establish AI authority is closing. 
              Secure your brand's presence in ChatGPT, Claude, and Gemini before your competitors dominate the narrative.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-6">
            <CTAButton />
            {!isProductionSite && (
              <Button asChild className="border-2 border-white/30 bg-white/5 text-white hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm px-8 py-6 text-lg h-14 rounded-none font-light tracking-wide">
                <Link href="#enterprise" className="flex items-center gap-2">
                  <span>Why This Matters Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
          
          {pageData.hero.socialProofText && (
            <div className="text-center">
              <p className="text-sm text-white/70 mb-3">
                {pageData.hero.socialProofText}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
        {/* Geometric Accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-r border-b border-gray-200"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-l border-t border-gray-200"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-black rotate-45"></div>
                <p className="text-xs font-medium text-gray-500 tracking-[0.2em] uppercase">
                  Market Impact
                </p>
                <div className="w-2 h-2 bg-black rotate-45"></div>
              </div>
            </div>
          
          <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100 border border-gray-100 bg-white shadow-sm overflow-hidden relative">
            {/* Corner Accents for Grid */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-black"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-black"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-black"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-black"></div>

            <div className="text-center p-12 group hover:bg-gray-50 transition-colors duration-300">
              <div className="text-6xl md:text-7xl font-extralight text-black leading-none mb-6 group-hover:scale-110 transition-transform duration-500 origin-center">
                25<span className="text-3xl md:text-4xl align-top text-gray-400">%</span>
              </div>
              <p className="text-lg text-gray-600 font-light leading-relaxed mb-4 px-4">
                projected drop in traditional search volume by 2026
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-gray-400 tracking-wide uppercase border-t border-gray-100 pt-4 mt-2">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                Gartner
              </div>
            </div>
            <div className="text-center p-12 group hover:bg-gray-50 transition-colors duration-300">
              <div className="text-6xl md:text-7xl font-extralight text-black leading-none mb-6 group-hover:scale-110 transition-transform duration-500 origin-center">
                $320<span className="text-3xl md:text-4xl align-top text-gray-400">B</span>
              </div>
              <p className="text-lg text-gray-600 font-light leading-relaxed mb-4 px-4">
                economic impact of AI in the Middle East by 2030
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-gray-400 tracking-wide uppercase border-t border-gray-100 pt-4 mt-2">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                PwC
              </div>
            </div>
            <div className="text-center p-12 group hover:bg-gray-50 transition-colors duration-300">
              <div className="text-6xl md:text-7xl font-extralight text-black leading-none mb-6 group-hover:scale-110 transition-transform duration-500 origin-center">
                64<span className="text-3xl md:text-4xl align-top text-gray-400">%</span>
              </div>
              <p className="text-lg text-gray-600 font-light leading-relaxed mb-4 px-4">
                of B2B executives use AI for vendor discovery
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-gray-400 tracking-wide uppercase border-t border-gray-100 pt-4 mt-2">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                McKinsey
              </div>
            </div>
          </div>

          {/* Trust indicators removed as per request */}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-white relative overflow-hidden">
        {/* Geometric Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50 skew-x-12 translate-x-20 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 border-2 border-gray-100 rounded-full -translate-x-1/2 translate-y-1/2 -z-10"></div>
        
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 border-b border-gray-100 pb-12">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-black tracking-tight leading-tight">
                How It Works
              </h2>
              <p className="text-xl text-gray-500 font-light mt-6 max-w-xl">
                Turn AI from a threat into your biggest growth channel.
              </p>
            </div>
            <div className="hidden md:block mb-2">
               <div className="h-px w-32 bg-black"></div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent z-0"></div>

            {[
              {
                number: "01",
                title: "Quantify Presence",
                description: "We analyze thousands of prompts across ChatGPT, Claude, and Gemini to determine exactly how your brand is perceived.",
                visual: (
                  <div className="relative w-full aspect-[4/3] bg-gray-50 border border-gray-100 rounded-lg overflow-hidden p-6 flex flex-col justify-center items-center group-hover:border-gray-300 transition-colors">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]"></div>
                    {/* Abstract Chart */}
                    <div className="flex items-end gap-2 h-24 w-32">
                      <div className="w-8 bg-gray-200 h-[40%] rounded-t-sm"></div>
                      <div className="w-8 bg-gray-300 h-[70%] rounded-t-sm"></div>
                      <div className="w-8 bg-black h-[90%] rounded-t-sm"></div>
                    </div>
                    <div className="mt-4 w-full h-px bg-gray-200"></div>
                    <div className="mt-2 flex justify-between w-full px-4">
                      <div className="h-2 w-8 bg-gray-100 rounded"></div>
                      <div className="h-2 w-8 bg-gray-100 rounded"></div>
                      <div className="h-2 w-8 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                )
              },
              {
                number: "02",
                title: "Control Narrative",
                description: "Optimize your content for AI retrieval and synthesis to ensure your brand is cited as the authoritative source in generated responses.",
                visual: (
                  <div className="relative w-full aspect-[4/3] bg-gray-50 border border-gray-100 rounded-lg overflow-hidden p-6 flex flex-col justify-center items-center group-hover:border-gray-300 transition-colors">
                     {/* Abstract Interface */}
                     <div className="w-full max-w-[180px] space-y-3">
                        <div className="flex gap-2">
                           <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                           <div className="flex-1 bg-white border border-gray-100 p-2 rounded-lg text-[8px] text-gray-400 leading-relaxed shadow-sm">
                              <div className="w-3/4 h-1.5 bg-gray-100 rounded mb-1"></div>
                              <div className="w-1/2 h-1.5 bg-gray-100 rounded"></div>
                           </div>
                        </div>
                        <div className="flex gap-2 flex-row-reverse">
                           <div className="w-8 h-8 rounded-full bg-black flex-shrink-0"></div>
                           <div className="flex-1 bg-black text-white p-2 rounded-lg text-[8px] leading-relaxed shadow-sm">
                              <div className="w-full h-1.5 bg-white/20 rounded mb-1"></div>
                              <div className="w-5/6 h-1.5 bg-white/20 rounded"></div>
                           </div>
                        </div>
                     </div>
                  </div>
                )
              },
              {
                number: "03",
                title: "Dominate Voice",
                description: "Track your visibility against competitors and ensure your brand is the recommended solution for every relevant query.",
                visual: (
                  <div className="relative w-full aspect-[4/3] bg-gray-50 border border-gray-100 rounded-lg overflow-hidden p-6 flex flex-col justify-center items-center group-hover:border-gray-300 transition-colors">
                    {/* Abstract Target/Graph */}
                    <div className="relative w-32 h-32">
                       <div className="absolute inset-0 border-2 border-gray-100 rounded-full"></div>
                       <div className="absolute inset-4 border-2 border-gray-200 rounded-full"></div>
                       <div className="absolute inset-8 border-2 border-gray-300 rounded-full"></div>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full shadow-lg z-10"></div>
                       <div className="absolute top-1/2 left-1/2 w-16 h-0.5 bg-black origin-left -rotate-45"></div>
                    </div>
                  </div>
                )
              }
            ].map((step, idx) => (
              <div key={idx} className="group relative z-10 bg-white p-8 border border-gray-100 hover:border-black transition-all duration-500 shadow-sm hover:shadow-xl rounded-xl">
                <div className="mb-8 flex justify-between items-start">
                   <span className="text-7xl font-extralight text-gray-100 group-hover:text-black transition-colors duration-500 leading-none">{step.number}</span>
                   <div className="transform group-hover:scale-110 transition-transform duration-500">
                      {step.visual}
                   </div>
                </div>
                <h3 className="text-3xl font-light text-black mb-4 group-hover:font-normal transition-all duration-300">{step.title}</h3>
                <p className="text-gray-600 font-light leading-relaxed text-lg group-hover:text-black transition-colors duration-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section id="enterprise" className="py-24 px-6 bg-black text-white relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          {/* Geometric Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20"></div>
          
          {/* Geometric Shapes & Lines */}
          <div className="absolute top-0 left-0 w-full h-px bg-white/10"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-white/10"></div>
          <div className="absolute top-0 left-1/4 w-px h-full bg-white/5"></div>
          <div className="absolute top-0 right-1/4 w-px h-full bg-white/5"></div>
          
          {/* Corner Brackets */}
          <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-white/20"></div>
          <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-white/20"></div>
          <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-white/20"></div>
          <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-white/20"></div>
          
          {/* Crosshairs */}
          <div className="absolute top-1/3 left-10 w-4 h-4 border-l border-t border-white/20"></div>
          <div className="absolute bottom-1/3 right-10 w-4 h-4 border-r border-b border-white/20"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <div className="mb-8 inline-block">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-px bg-white/60"></div>
                 <span className="text-xs font-medium text-white/80 tracking-[0.2em] uppercase">
                   Brand Strategy
                 </span>
                 <div className="w-12 h-px bg-white/60"></div>
              </div>
            </div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-8 tracking-tight leading-[0.95]">
              Protect Your
              <span className="block font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">Brand Equity</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed">
              AI models are defining your brand to millions of users daily. Hallucinations and competitor bias are real risks. 
              Take control of your digital reputation before it's too late.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 border-t border-white/10 pt-16">
            {[
              {
                title: "Brand Protection",
                desc: "Prevent AI hallucinations and ensure accurate representation of your products and services across all major LLMs."
              },
              {
                title: "Competitive Intelligence",
                desc: "Monitor your competitors' AI visibility and identify gaps in their strategy. Know exactly when they outrank you."
              },
              {
                title: "Market Leadership",
                desc: "Establish your brand as the authoritative source in your industry. Be the answer, not just a search result."
              }
            ].map((item, idx) => (
              <div key={idx} className="group relative p-8 border border-white/5 bg-white/5 hover:bg-white/10 transition-colors duration-300 rounded-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                <h3 className="text-2xl font-light text-white mb-4">{item.title}</h3>
                <p className="text-lg text-gray-400 font-light leading-relaxed group-hover:text-gray-300 transition-colors">
                  {item.desc}
                </p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="w-5 h-5 text-white/50" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-20">
            <Button size="lg" asChild className="border border-white/20 bg-white/5 text-white hover:bg-white hover:text-black transition-all duration-300 h-16 px-10 text-xl backdrop-blur-sm group">
              <Link href="/free-audit" className="flex items-center gap-3">
                <span>Secure Your Brand Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white relative overflow-hidden">
        {/* Geometric Accents */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gray-100"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gray-100"></div>
        <div className="absolute left-0 top-0 w-px h-full bg-gray-100"></div>
        <div className="absolute right-0 top-0 w-px h-full bg-gray-100"></div>
        
        {/* Corner Markers */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-black"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-black"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-black"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-black"></div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-black mb-6 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {pageData.faq.questions.slice(0, 8).map((item, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border border-gray-100 rounded-lg px-6 bg-gray-50/50 hover:bg-white transition-colors duration-300">
                <AccordionTrigger className="text-xl font-light text-left py-6 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-lg text-gray-600 leading-relaxed font-light pb-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />

      <DemoRequestForm 
        isOpen={isDemoFormOpen} 
        onClose={() => setIsDemoFormOpen(false)} 
      />
    </div>
  )
}
