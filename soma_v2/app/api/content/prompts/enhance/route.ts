import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit prompt enhancement
    const limited = applyRateLimit(request, 'prompts:enhance', RATE_LIMITS.ai)
    if (limited) return limited

    const { prompt, brandContext } = await request.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    // Use confirmed free models with immediate fallback on rate limits
    const freeModels = [
      'deepseek/deepseek-chat-v3.1:free',
      'deepseek/deepseek-chat-v3-0324:free',
      'deepseek/deepseek-r1-0528:free',
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-4-maverick:free',
      'nvidia/nemotron-nano-9b-v2:free'
    ]

    const systemPrompt = `You are an expert at creating high-quality, natural search queries for AI platforms like ChatGPT, Claude, and Gemini. 

Your task is to enhance user-provided prompts to make them:
1. More natural and conversational
2. Likely to get comprehensive, useful responses from AI models
3. Relevant to the brand context provided
4. Clear and specific enough to get actionable insights

IMPORTANT: Return ONLY ONE SENTENCE. Make it concise, natural, and effective. Do not add multiple sentences or explanations.`

    const userPrompt = `Brand Context:
- Brand Name: ${brandContext?.brandName || 'N/A'}
- Business Category: ${brandContext?.businessCategory || 'N/A'}
- Markets: ${brandContext?.markets?.join(', ') || 'N/A'}

Original prompt to enhance: "${prompt}"

Please enhance this prompt to be more natural, conversational, and likely to get useful responses from AI platforms.`

    // Try each model once until one succeeds
    for (let i = 0; i < freeModels.length; i++) {
      const model = freeModels[i]
      try {
        console.log(`Trying model: ${model} (${i + 1}/${freeModels.length})`)
        
        // Small delay between models to be respectful
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'https://soma.ai',
            'X-Title': 'Soma AI - Prompt Enhancement'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 200,
            temperature: 0.7,
            stream: false
          })
        })

        if (response.ok) {
          const data = await response.json()
          const enhancedPrompt = data.choices?.[0]?.message?.content?.trim()

          if (enhancedPrompt) {
            console.log(`Successfully enhanced prompt with model: ${model}`)
            return NextResponse.json({
              success: true,
              enhancedPrompt: enhancedPrompt
            })
          }
        } else if (response.status === 429) {
          console.log(`Rate limited on ${model}, trying next model...`)
          continue // Try next model immediately
        } else if (response.status === 404) {
          console.log(`Model ${model} not found (404), trying next...`)
          continue
        } else {
          console.log(`Model ${model} failed with status ${response.status}, trying next...`)
          const errorText = await response.text()
          console.log(`Error details:`, errorText)
          continue
        }
      } catch (modelError) {
        console.log(`Model ${model} error:`, modelError)
        continue // Try next model
      }
    }

    // If all models failed, return graceful fallback
    return NextResponse.json({
      success: false,
      error: 'AI enhancement temporarily unavailable. Please try again in a moment.',
      fallbackPrompt: prompt // Return original prompt as fallback
    }, { status: 503 })

  } catch (error) {
    console.error('Error enhancing prompt:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to enhance prompt. Please try again.' 
      }, 
      { status: 500 }
    )
  }
}