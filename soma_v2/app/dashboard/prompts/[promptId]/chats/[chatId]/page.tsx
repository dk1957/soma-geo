"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Clock, LinkIcon, CheckCircle2, AlertCircle, ArrowRightLeft, Eye, EyeOff, TrendingUp, MessageSquare, Target, BarChart3, Users, Star, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useBrand } from '@/lib/contexts/brand-context'

interface Citation {
  url: string
  domain?: string
  authority_score?: number
  title?: string
}

interface AnalysisData {
  brand_mentioned: boolean
  brand_cited: boolean
  brand_mention_count: number
  brand_citation_count: number
  brand_sentiment: number
  sentiment_category: string
  brand_avg_position: number
  brand_first_position: number
  total_brands_mentioned: number
  competitors_mentioned: string[]
  share_of_voice: number
  competitive_positioning: string
  response_word_count: number
  analysis_confidence: number
  topics_covered: string[]
}

interface ChatResponse {
  id: string
  prompt: string
  prompt_text?: string
  raw_response: string
  model_name: string
  created_at: string
  response_time_ms?: number
  citations?: Citation[]
  analysis?: AnalysisData | null
  metadata?: any
  brand_id?: string
  brand_name?: string
}

interface PromptData {
  id: string
  prompt_text: string
  created_at: string
}

// Map model names to their logo files
const modelLogos: { [key: string]: string } = {
  'chatgpt': '/models/chatgpt-logo.png',
  'gpt-4': '/models/chatgpt-logo.png',
  'gpt-4o': '/models/chatgpt-logo.png',
  'gpt-4o-mini': '/models/chatgpt-logo.png',
  'gpt-3.5': '/models/chatgpt-logo.png',
  'gpt-5': '/models/chatgpt-logo.png',
  'openai': '/models/chatgpt-logo.png',
  'claude': '/models/claude-logo.png',
  'claude-3': '/models/claude-logo.png',
  'claude-3.5': '/models/claude-logo.png',
  'anthropic': '/models/claude-logo.png',
  'gemini': '/models/gemini-logo.png',
  'gemini-pro': '/models/gemini-logo.png',
  'google': '/models/gemini-logo.png',
  'grok': '/models/grok-logo.png',
  'grok-4': '/models/grok-logo.png',
  'perplexity': '/models/perplexity-logo.png',
  'sonar': '/models/perplexity-logo.png',
  'llama': '/models/meta-logo.svg',
  'meta': '/models/meta-logo.svg',
}

/**
 * Strip citation/source sections from the response body so they don't render
 * as messy markdown. These get displayed separately in the structured card UI.
 * Also returns parsed citations from the stripped text for fallback use.
 */
function stripAndParseCitations(text: string): {
  cleanedText: string
  parsedCitations: { url: string; domain: string; title: string; usedFor?: string }[]
} {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  const parsedCitations: { url: string; domain: string; title: string; usedFor?: string }[] = []

  let inSourceBlock = false
  let currentTitle = ''
  let currentUrl = ''
  let currentUsedFor = ''

  const sourceHeaderPattern = /^#{0,4}\s*(?:sources?\s+(?:used|cited|referenced|considered)|additional\s+sources|citations?,?\s*(?:urls?)?(?:\s*,?\s*and\s+sources)?|references?|urls?\s+(?:used|cited|referenced)).*[:]/i
  const sectionBreakPattern = /^#{1,4}\s+(?!Citations|Sources|Additional|References|URLs)/i

  const flushCitation = () => {
    if (currentUrl) {
      let domain = ''
      try { domain = new URL(currentUrl).hostname.replace('www.', '') } catch {}
      parsedCitations.push({
        url: currentUrl,
        domain,
        title: currentTitle || domain,
        usedFor: currentUsedFor || undefined,
      })
    }
    currentTitle = ''
    currentUrl = ''
    currentUsedFor = ''
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (sourceHeaderPattern.test(trimmed)) {
      flushCitation()
      inSourceBlock = true
      continue
    }

    if (inSourceBlock && sectionBreakPattern.test(trimmed)) {
      flushCitation()
      inSourceBlock = false
      output.push(line)
      continue
    }

    if (!inSourceBlock) {
      output.push(line)
      continue
    }

    // Inside source block — parse but don't output
    if (trimmed === '') continue

    const urlMatch = trimmed.match(/^URL\s*:\s*(https?:\/\/[^\s]+)/i)
    if (urlMatch) {
      currentUrl = urlMatch[1].replace(/[.,;:!?\]]+$/, '')
      continue
    }

    const usedForMatch = trimmed.match(/^(?:Used for|Reason)\s*:\s*(.*)/i)
    if (usedForMatch) {
      currentUsedFor = usedForMatch[1].trim()
      continue
    }

    // New citation item (numbered or title)
    const numbered = trimmed.match(/^(?:\[(\d+)\]|⁽(\d+)⁾)\s+(.+)/)
    if (numbered) {
      flushCitation()
      currentTitle = numbered[3].trim()
      continue
    }

    // Unnumbered title line
    if (/^[A-Z]/.test(trimmed) && trimmed.length > 15 && !trimmed.match(/^(URL|Used for|Source|Domain|Title|Reason|Additional|Sources|Citations)/i)) {
      flushCitation()
      currentTitle = trimmed
      continue
    }
  }

  flushCitation()

  // Clean trailing whitespace
  while (output.length > 0 && output[output.length - 1].trim() === '') {
    output.pop()
  }

  return { cleanedText: output.join('\n'), parsedCitations }
}

function preprocessMarkdown(text: string): string {
  let result = text
  result = result.replace(/\[(\d{1,3})\]/g, '⁽$1⁾')
  result = result.replace(/^[\s]*[•●◦▪▸]\s+/gm, '- ')
  return result
}

const getModelLogo = (modelName: string): string => {
  const lowerName = modelName?.toLowerCase() || ''
  for (const [key, logo] of Object.entries(modelLogos)) {
    if (lowerName.includes(key)) return logo
  }
  return '/models/chatgpt-logo.png'
}

const getModelDisplayName = (modelName: string): string => {
  if (!modelName) return 'Unknown Model'
  // Format: "provider/model-name" → "Provider / Model Name"
  if (modelName.includes('/')) {
    const [provider, model] = modelName.split('/')
    const fmtProvider = provider.charAt(0).toUpperCase() + provider.slice(1)
    const fmtModel = model.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return `${fmtProvider} / ${fmtModel}`
  }
  return modelName
}

function SentimentIndicator({ value, category }: { value: number; category?: string }) {
  const label = category || (value > 0.3 ? 'Positive' : value < -0.3 ? 'Negative' : 'Neutral')
  const color = value > 0.3 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : value < -0.3 ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-700 bg-gray-50 border-gray-200'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color} capitalize`}>
      {label}
    </span>
  )
}

export default function ChatDetailPage() {
  const params = useParams()
  const promptId = params?.promptId
  const chatId = params?.chatId
  const { currentBrand, isLoading: isBrandLoading, switchBrand } = useBrand()
  const [isLoading, setIsLoading] = useState(true)
  const [response, setResponse] = useState<ChatResponse | null>(null)
  const [promptData, setPromptData] = useState<PromptData | null>(null)
  const [brandMismatch, setBrandMismatch] = useState<{ brandId: string; brandName: string } | null>(null)
  const [isSwitching, setIsSwitching] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(true)
  const [citationsExpanded, setCitationsExpanded] = useState(false)

  useEffect(() => {
    if (!chatId || !currentBrand) return

    const load = async () => {
      setIsLoading(true)
      try {
        const brandId = currentBrand.id
        if (!brandId) { setResponse(null); return }

        const [resResponse, resPrompt] = await Promise.all([
          fetch(`/api/llm-run/responses?response_id=${encodeURIComponent(String(chatId))}`),
          fetch(`/api/content/prompts?brand_id=${encodeURIComponent(brandId)}`)
        ])

        if (!resResponse.ok) {
          console.error('Responses API error:', resResponse.status)
          setResponse(null)
          return
        }
        
        const responseJson = await resResponse.json()
        const responseData = responseJson.data || null
        
        if (responseData?.brand_id && currentBrand?.id && responseData.brand_id !== currentBrand.id) {
          setBrandMismatch({ brandId: responseData.brand_id, brandName: responseData.brand_name || 'another brand' })
          setResponse(null)
          return
        }
        
        setResponse(responseData)
        
        if (resPrompt.ok && promptId) {
          const promptJson = await resPrompt.json()
          const foundPrompt = (promptJson.data || []).find((p: any) => String(p.id) === String(promptId))
          setPromptData(foundPrompt || null)
        }
      } catch (err) {
        console.error('Failed to load chat:', err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [chatId, currentBrand, promptId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!response) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Response not found</h3>
            <p className="text-sm text-gray-500 mt-2">This response may have been removed or is no longer available.</p>
            <div className="mt-6">
              <Link href={`/dashboard/prompts/${promptId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Prompt
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!brandMismatch} onOpenChange={(open) => { if (!open) setBrandMismatch(null) }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-orange-500" />
                Different Brand
              </DialogTitle>
              <DialogDescription className="text-left">
                This response belongs to <strong className="text-gray-900">{brandMismatch?.brandName}</strong>. Switch brands to view it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setBrandMismatch(null)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!brandMismatch) return
                  setIsSwitching(true)
                  try { await switchBrand(brandMismatch.brandId); setBrandMismatch(null) }
                  catch (err) { console.error('Failed to switch brand:', err) }
                  finally { setIsSwitching(false) }
                }}
                disabled={isSwitching}
                className="gap-2"
              >
                {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                Switch to {brandMismatch?.brandName}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const analysis = response.analysis

  // Strip citation sections from body and parse them for the card UI
  const { cleanedText, parsedCitations } = stripAndParseCitations(response.raw_response || '')

  // Merge: prefer API-provided citations, fallback to text-parsed ones
  const apiCitations = response.citations && response.citations.length > 0 ? response.citations : []
  const allCitations = apiCitations.length > 0
    ? apiCitations
    : parsedCitations.map(c => ({ url: c.url, domain: c.domain, title: c.title, authority_score: 0 }))
  const hasCitations = allCitations.length > 0

  return (
    <>
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[90rem] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/prompts/${promptId}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back</span>
              </Link>
              <div className="h-5 w-px bg-gray-200" />
              <div className="flex items-center gap-2.5">
                <div className="relative h-7 w-7 rounded-full overflow-hidden border border-gray-200">
                  <Image src={getModelLogo(response.model_name)} alt={response.model_name} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{getModelDisplayName(response.model_name)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analysis && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  onClick={() => setShowAnalysis(s => !s)}
                >
                  {showAnalysis ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showAnalysis ? 'Hide' : 'Show'} Analysis
                </Button>
              )}
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {response.response_time_ms ? `${Math.round(response.response_time_ms)}ms` : 'N/A'}
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(response.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-6 py-6">
        <div className={`flex gap-6 ${showAnalysis && analysis ? '' : 'justify-center'}`}>
          {/* Main content — chat thread */}
          <div className={`flex-1 ${showAnalysis && analysis ? 'max-w-[calc(100%-320px)]' : 'max-w-4xl'}`}>
            {/* ── User prompt bubble ── */}
            <div className="flex justify-end mb-8">
              <div className="max-w-[85%]">
                <div className="flex items-center gap-2 justify-end mb-1.5">
                  <span className="text-xs font-medium text-gray-400">You</span>
                  <div className="h-6 w-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    S
                  </div>
                </div>
                <div className="bg-gray-900 text-white rounded-2xl rounded-tr-sm px-5 py-3.5">
                  <p className="text-[0.9375rem] leading-relaxed">
                    {promptData?.prompt_text || response?.prompt_text || response?.prompt || "Loading prompt..."}
                  </p>
                </div>
              </div>
            </div>

            {/* ── AI response bubble ── */}
            <div className="flex items-start gap-3 mb-6">
              <div className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 mt-1">
                <Image src={getModelLogo(response.model_name)} alt={response.model_name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-gray-900">{getModelDisplayName(response.model_name)}</span>
                  {analysis?.response_word_count && (
                    <span className="text-xs text-gray-400">{analysis.response_word_count.toLocaleString()} words</span>
                  )}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-6 py-5">
                  {/* Markdown response body */}
                  <div className="prose prose-gray max-w-none text-[0.9375rem] leading-[1.8] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-200 first:mt-0">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold text-gray-900 mt-7 mb-2.5">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold text-gray-900 mt-6 mb-2">{children}</h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-sm font-semibold text-gray-800 mt-5 mb-1.5">{children}</h4>
                        ),
                        p: ({ children }) => (
                          <p className="text-gray-700 leading-[1.8] mb-4">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="my-4 ml-0 space-y-1.5 list-none">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="my-4 ml-0 space-y-1.5 list-none counter-reset-item [counter-reset:item]">{children}</ol>
                        ),
                        li: ({ children, ...props }) => {
                          const isOrdered = (props as any).ordered
                          return isOrdered ? (
                            <li className="text-gray-700 leading-[1.75] pl-7 relative before:content-[counter(item)_'.'] before:absolute before:left-0 before:text-gray-400 before:font-medium before:text-sm [counter-increment:item]">
                              {children}
                            </li>
                          ) : (
                            <li className="text-gray-700 leading-[1.75] pl-7 relative before:content-[''] before:absolute before:left-2.5 before:top-[0.6875rem] before:h-1.5 before:w-1.5 before:rounded-full before:bg-gray-400">
                              {children}
                            </li>
                          )
                        },
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-[3px] border-gray-300 pl-4 py-1 my-5 text-gray-600 italic [&>p]:mb-2 [&>p:last-child]:mb-0">{children}</blockquote>
                        ),
                        code: ({ className, children, ...props }: any) => {
                          const inline = !className?.includes('language-')
                          return inline ? (
                            <code className="bg-white/80 text-gray-800 px-1.5 py-0.5 rounded text-[0.8125rem] font-mono border border-gray-200" {...props}>{children}</code>
                          ) : (
                            <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm" {...props}>{children}</code>
                          )
                        },
                        pre: ({ children }) => (
                          <pre className="overflow-x-auto my-5 rounded-lg">{children}</pre>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-5 rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-white">{children}</thead>
                        ),
                        tbody: ({ children }) => (
                          <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>
                        ),
                        tr: ({ children }) => (
                          <tr className="hover:bg-gray-50/50 transition-colors">{children}</tr>
                        ),
                        th: ({ children }) => (
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{children}</th>
                        ),
                        td: ({ children }) => (
                          <td className="px-4 py-2.5 text-sm text-gray-700">{children}</td>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline underline-offset-2 decoration-blue-200 hover:decoration-blue-500 transition-colors">{children}</a>
                        ),
                        hr: () => (
                          <hr className="my-6 border-gray-200" />
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-gray-600">{children}</em>
                        ),
                      }}
                    >
                      {preprocessMarkdown(cleanedText)}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* ── Sources / Citations ── */}
                {hasCitations && (
                  <div className="mt-3 ml-0">
                    <button
                      onClick={() => setCitationsExpanded(e => !e)}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors mb-2 group"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>{allCitations.length} source{allCitations.length !== 1 ? 's' : ''}</span>
                      {citationsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {citationsExpanded && (
                      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                        <div className="divide-y divide-gray-100">
                          {allCitations.map((citation, index) => {
                            let hostname = citation.domain || ''
                            if (!hostname && citation.url) { try { hostname = new URL(citation.url).hostname.replace('www.', '') } catch {} }
                            return (
                              <a
                                key={`${citation.url}-${index}`}
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                              >
                                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors leading-snug">
                                    {citation.title || hostname || 'Source'}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate leading-snug mt-0.5">{hostname}</p>
                                </div>
                                {citation.authority_score != null && (
                                  <span className="flex-shrink-0 text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
                                    {Math.round(citation.authority_score)}
                                  </span>
                                )}
                                <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata footer */}
                <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px] text-gray-400 ml-0.5">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {response.response_time_ms ? `${Math.round(response.response_time_ms)}ms` : 'N/A'}</span>
                  <span className="text-gray-300">·</span>
                  <span>{response.model_name}</span>
                  <span className="text-gray-300">·</span>
                  <span>{new Date(response.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {analysis?.analysis_confidence != null && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span>Confidence {Math.round(analysis.analysis_confidence * 100)}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis sidebar */}
          {showAnalysis && analysis && (
            <div className="w-[300px] flex-shrink-0 space-y-3">
              {/* Brand Visibility */}
              <Card className="border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Brand Visibility
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Mentioned</span>
                      <Badge variant={analysis.brand_mentioned ? 'default' : 'secondary'} className={`text-xs ${analysis.brand_mentioned ? 'bg-emerald-600' : ''}`}>
                        {analysis.brand_mentioned ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {analysis.brand_mentioned && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Mentions</span>
                          <span className="text-sm font-semibold text-gray-900">{analysis.brand_mention_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Position</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {analysis.brand_first_position ? `#${analysis.brand_first_position}` : analysis.brand_avg_position ? `~#${Math.round(analysis.brand_avg_position)}` : '—'}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cited</span>
                      <Badge variant={analysis.brand_cited ? 'default' : 'secondary'} className={`text-xs ${analysis.brand_cited ? 'bg-blue-600' : ''}`}>
                        {analysis.brand_cited ? `Yes (${analysis.brand_citation_count || 1})` : 'No'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sentiment */}
              <Card className="border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" /> Sentiment
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Score</span>
                      <span className="text-sm font-semibold text-gray-900">{analysis.brand_sentiment != null ? analysis.brand_sentiment.toFixed(2) : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Category</span>
                      <SentimentIndicator value={analysis.brand_sentiment || 0} category={analysis.sentiment_category} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competitive */}
              <Card className="border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Competitive
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Share of Voice</span>
                      <span className="text-sm font-semibold text-gray-900">{analysis.share_of_voice != null ? `${Math.round(analysis.share_of_voice)}%` : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Positioning</span>
                      <Badge variant="outline" className="text-xs capitalize">{analysis.competitive_positioning || '—'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Brands in response</span>
                      <span className="text-sm font-semibold text-gray-900">{analysis.total_brands_mentioned || 0}</span>
                    </div>
                    {analysis.competitors_mentioned && analysis.competitors_mentioned.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Competitors mentioned</p>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.competitors_mentioned.filter((c: string) => typeof c === 'string').slice(0, 8).map((competitor: string) => (
                            <Badge key={competitor} variant="secondary" className="text-xs font-normal">{competitor}</Badge>
                          ))}
                          {analysis.competitors_mentioned.length > 8 && (
                            <Badge variant="secondary" className="text-xs font-normal">+{analysis.competitors_mentioned.length - 8}</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Topics */}
              {analysis.topics_covered && analysis.topics_covered.length > 0 && (
                <Card className="border border-gray-200 bg-white">
                  <CardContent className="p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Topics
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.topics_covered.filter((t: string) => typeof t === 'string').slice(0, 10).map((topic: string) => (
                        <Badge key={topic} variant="outline" className="text-xs font-normal">{topic}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
