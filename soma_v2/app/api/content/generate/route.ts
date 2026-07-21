import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
})

interface GenerationRequest {
  mode: 'generate' | 'rewrite'
  type: 'title' | 'content'
  input: string
  instructions?: string
  contentType: string
  targetAudience?: string
  contentGoals?: string[]
  keywords?: string[]
  tone: string
  length?: string
}

/**
 * POST /api/v1/content/generate
 * Generate AI-optimized content using MACO system principles
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limit AI content generation
    const limited = applyRateLimit(request, 'content:generate', RATE_LIMITS.ai, user.clerkUserId)
    if (limited) return limited

    const body: GenerationRequest = await request.json()
    const { mode, type, input, instructions, contentType, targetAudience, contentGoals, keywords, tone, length } = body

    if (!input || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build context for GSEO optimization
    const context = {
      contentType,
      targetAudience: targetAudience || 'general audience',
      contentGoals: contentGoals && contentGoals.length > 0 ? contentGoals.join(', ') : '',
      keywords: keywords && keywords.length > 0 ? keywords.join(', ') : 'none specified',
      tone
    }

    let prompt = ''

    if (type === 'title') {
      if (mode === 'generate') {
        prompt = `You are a GSEO (Generative Search Engine Optimization) expert. Generate an optimized ${contentType} title based on the following:

Topic/Keywords: ${input}

Requirements:
- Length: 30-60 characters
- Style: ${tone}
- Target audience: ${context.targetAudience}
- Keywords to incorporate: ${context.keywords}

GSEO Optimization Guidelines:
1. Make it clear and descriptive for AI search engines
2. Include primary keywords naturally
3. Create curiosity while being informative
4. Optimize for citation prominence (clear value proposition)
5. Ensure it answers a potential search query

Generate ONE optimized title. Output ONLY the title text, no quotes or explanations.`
      } else {
        prompt = `You are a GSEO (Generative Search Engine Optimization) expert. Rewrite and improve the following ${contentType} title:

Current Title: ${input}

${instructions ? `Specific Instructions: ${instructions}\n` : ''}
Requirements:
- Length: 30-60 characters
- Style: ${tone}
- Target audience: ${context.targetAudience}
- Keywords to incorporate: ${context.keywords}

GSEO Optimization Guidelines:
1. Improve clarity and descriptiveness for AI search engines
2. Integrate keywords more naturally
3. Enhance citation prominence
4. Make it more likely to be cited by AI engines
5. Maintain brand voice while improving discoverability

Generate ONE improved title. Output ONLY the title text, no quotes or explanations.`
      }
    } else {
      // Content generation
      const lengthGuide = {
        short: '~200 words',
        medium: '~500 words',
        long: '~1000 words',
        comprehensive: '~2000+ words'
      }[length || 'medium']

      console.log('\n========== CONTENT GENERATION REQUEST ==========')
      console.log('Mode:', mode)
      console.log('Content Type:', contentType)
      console.log('Target Audience:', context.targetAudience)
      console.log('Content Goals:', context.contentGoals || 'None')
      console.log('Keywords:', context.keywords)
      console.log('Length:', length, '→', lengthGuide)
      console.log('Input length:', input.length, 'characters')
      console.log('Input preview:', input.substring(0, 200) + '...')
      console.log('===============================================\n')

      if (mode === 'generate') {
        prompt = `You are a GSEO (Generative Search Engine Optimization) expert using the MACO system. Generate optimized ${contentType} content based on:

Key Points/Topics: ${input}

Requirements:
- Length: ${lengthGuide}
- Style: ${tone}
- Content type: ${contentType}
- Target audience: ${context.targetAudience}
${context.contentGoals ? `- Content goals: ${context.contentGoals}` : ''}
- Keywords to incorporate: ${context.keywords}

IMPORTANT: Do NOT return the original input text. Create a completely NEW ${contentType} that TRANSFORMS and EXPANDS on the provided information.

MACO System Optimization (6 Dimensions):
1. Citation Prominence: Make content highly citable with clear facts and statistics
2. Attribution Accuracy: Include verifiable claims and credible sources
3. Faithfulness: Ensure factual accuracy and consistency
4. Key Info Coverage: Cover all essential information comprehensively
5. Semantic Contribution: Provide unique insights and valuable information
6. Answer Dominance: Directly answer potential search queries

Content Structure for ${contentType}:
- Start with an engaging introduction that hooks the reader
- Use clear, descriptive headings and subheadings
- Include specific data points, examples, and case studies
- Add relevant statistics and research findings
- End with actionable takeaways or conclusions
- Format for readability (short paragraphs, bullet points, numbered lists)

Generate a COMPLETE, WELL-STRUCTURED ${contentType} in HTML format. 

CRITICAL FORMATTING RULES:
- Use ONLY content HTML tags: <h2>, <h3>, <h4>, <p>, <ul>, <li>, <ol>, <strong>, <em>, <blockquote>
- DO NOT include: <!DOCTYPE>, <html>, <head>, <body>, <article>, <title> tags
- DO NOT wrap in markdown code blocks (no \`\`\`html)
- Start directly with your first heading (e.g., <h2>Title</h2>)
- Output only the article content that goes inside a rich text editor

Do NOT include any prefixes like "Write an article form the content below:" - generate the actual ${contentType} content directly.`
      } else {
        prompt = `You are a GSEO (Generative Search Engine Optimization) expert using the MACO system. Transform and rewrite the following content into a professional ${contentType}:

Source Material: ${input}

${instructions ? `Specific Instructions: ${instructions}\n` : ''}
Requirements:
- Target length: ${lengthGuide}
- Style: ${tone}
- Content type: ${contentType}
- Target audience: ${context.targetAudience}
${context.contentGoals ? `- Content goals: ${context.contentGoals}` : ''}
- Keywords to incorporate: ${context.keywords}

CRITICAL: Do NOT copy the source material verbatim. TRANSFORM it into a complete, professional ${contentType}. If the source says "Write an article about X", create the actual article - don't include that instruction in your output.

MACO System Optimization (6 Dimensions):
1. Citation Prominence: Enhance citability with clear facts and statistics
2. Attribution Accuracy: Add verifiable claims and credible sources
3. Faithfulness: Ensure factual accuracy and consistency
4. Key Info Coverage: Expand essential information coverage
5. Semantic Contribution: Add unique insights and valuable information
6. Answer Dominance: Better address potential search queries

Transformation Requirements:
- Create a completely new ${contentType} structure with proper introduction, body, and conclusion
- Expand abbreviated concepts into full explanations
- Add context, examples, and real-world applications
- Transform academic/technical language into engaging, accessible content
- Add compelling headings that structure the narrative
- Include actionable insights for the target audience
- Format professionally with proper HTML structure

Generate a COMPLETE, PROFESSIONALLY WRITTEN ${contentType} in HTML format.

CRITICAL FORMATTING RULES:
- Use ONLY content HTML tags: <h2>, <h3>, <h4>, <p>, <ul>, <li>, <ol>, <strong>, <em>, <blockquote>
- DO NOT include: <!DOCTYPE>, <html>, <head>, <body>, <article>, <title> tags
- DO NOT wrap in markdown code blocks (no \`\`\`html)
- Start directly with your first heading (e.g., <h2>Title</h2>)
- Output only the article content that goes inside a rich text editor

Output ONLY the finished ${contentType} - no meta-commentary or instructions.`
      }
    }

    // Call OpenRouter API
    console.log('\n========== SENDING TO AI ==========')
    console.log('Model: openai/gpt-4o-mini')
    console.log('Temperature: 0.7')
    console.log('Max Tokens:', type === 'title' ? 100 : 4000)
    console.log('Prompt length:', prompt.length, 'characters')
    console.log('===================================\n')

    const startTime = Date.now()
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a GSEO expert specializing in optimizing content for AI search engines using the MACO system. You create complete, professional content pieces - never return instructions or meta-commentary. Generate high-quality, citation-worthy content that ranks well in AI-powered search results.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: type === 'title' ? 100 : 4000
    })
    const endTime = Date.now()

    console.log('\n========== AI RESPONSE RECEIVED ==========')
    console.log('Response time:', (endTime - startTime) / 1000, 'seconds')
    console.log('Completion object:', JSON.stringify(completion, null, 2))
    console.log('=========================================\n')

    let result = completion.choices[0]?.message?.content?.trim() || ''

    console.log('\n========== EXTRACTED RESULT (RAW) ==========')
    console.log('Result exists:', !!result)
    console.log('Result length:', result.length, 'characters')
    if (result.length > 0) {
      console.log('Word count:', result.split(/\s+/).length, 'words')
      console.log('First 500 chars:', result.substring(0, 500))
      console.log('\n...\n')
      console.log('Last 500 chars:', result.substring(Math.max(0, result.length - 500)))
    }
    console.log('=====================================\n')

    if (!result) {
      console.error('❌ ERROR: No result generated from AI')
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

    // Clean up result
    let cleanedResult = result
    
    if (type === 'title') {
      // Remove quotes for titles
      cleanedResult = result.replace(/^["']|["']$/g, '').trim()
    } else {
      // For content, remove markdown code blocks and full HTML document wrappers
      console.log('🧹 Cleaning HTML response...')
      
      // Remove markdown code blocks (```html ... ``` or ```...```)
      cleanedResult = cleanedResult.replace(/^```html?\n?/i, '').replace(/\n?```$/, '').trim()
      
      // Remove <!DOCTYPE>, <html>, <head>, <body> wrappers if present
      // Extract only the content inside <body> or <article>
      const bodyMatch = cleanedResult.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) {
        cleanedResult = bodyMatch[1].trim()
      }
      
      // If still has <article> wrapper, extract its content
      const articleMatch = cleanedResult.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
      if (articleMatch) {
        cleanedResult = articleMatch[1].trim()
      }
      
      // Remove any remaining <html>, <head>, or <!DOCTYPE> tags
      cleanedResult = cleanedResult
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<\/?html[^>]*>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<\/?body[^>]*>/gi, '')
        .trim()
      
      console.log('✅ Cleaned result length:', cleanedResult.length, 'characters')
      console.log('First 300 chars after cleaning:', cleanedResult.substring(0, 300))
    }

    return NextResponse.json({
      success: true,
      result: cleanedResult,
      mode,
      type
    })

  } catch (error) {
    console.error('\n❌ ========== GENERATION ERROR ==========')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', JSON.stringify(error, null, 2))
    console.error('=======================================\n')
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
