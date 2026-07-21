import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// POST /api/admin/crm/outreach - Generate AI-powered outreach message
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await request.json()
    const {
      channel = 'email',
      style = 'roi',
      contactName,
      companyName,
      companyDomain,
      jobTitle,
      industry,
      painPoints,
      notes,
      customInstructions,
    } = body

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY
    if (!openrouterKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    const firstName = contactName?.split(' ')[0] || 'there'

    const channelConstraints: Record<string, string> = {
      email: 'Write a professional outreach email. Include a subject line on the first line prefixed with "Subject: ". Keep it under 200 words. Use line breaks between paragraphs.',
      sms: 'Write a concise SMS message. Keep it under 160 characters. Be direct and conversational. No greeting formalities. Include a clear CTA.',
      linkedin: 'Write a LinkedIn connection request message or InMail. Keep it under 300 characters for connection requests, or under 150 words for InMail. Be professional but conversational. Reference something specific about them or their company.',
    }

    const styleGuidance: Record<string, string> = {
      roi: 'Focus on measurable business outcomes and ROI. Lead with data-driven value proposition. Mention specific growth metrics or revenue impact.',
      pain: 'Lead with the most pressing pain points you can identify. Show empathy and understanding. Connect each pain point to a concrete solution.',
      visibility: 'Focus on competitive visibility gaps in AI search engines. Show how competitors may be getting ahead. Create urgency around the AI search shift.',
    }

    const contextParts = [
      `Contact: ${contactName || 'Unknown'}`,
      `Company: ${companyName}`,
      companyDomain ? `Website: ${companyDomain}` : null,
      jobTitle ? `Title: ${jobTitle}` : null,
      industry ? `Industry: ${industry}` : null,
      painPoints?.length ? `Known pain points: ${painPoints.join(', ')}` : null,
      notes ? `Notes/context: ${notes}` : null,
    ].filter(Boolean).join('\n')

    const systemPrompt = `You are an expert B2B sales copywriter for Soma AI, a Generative Engine Optimization (GEO) platform that helps brands rank higher in AI-driven search engines like ChatGPT, Gemini, Claude, and Perplexity.

Your job is to write highly personalized, compelling outreach messages that feel human-written, not templated.

Rules:
- Never use generic filler or buzzwords
- Reference specific details about the prospect when available
- Keep the tone confident but not pushy
- Sign off as "Soma AI Team" for emails, no sign off for SMS/LinkedIn
- ${channelConstraints[channel] || channelConstraints.email}
- ${styleGuidance[style] || styleGuidance.roi}
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}`

    const userPrompt = `Generate a ${channel} outreach message for this prospect using the "${style}" approach:\n\n${contextParts}\n\nWrite the message now.`

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    })

    if (!res.ok) {
      console.error('OpenRouter outreach error:', res.status, await res.text())
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    }

    const data = await res.json()
    const message = data.choices?.[0]?.message?.content?.trim() || ''

    if (!message) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 })
    }

    return NextResponse.json({ success: true, message, channel, style })
  } catch (error) {
    console.error('Error in POST /api/admin/crm/outreach:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
