/**
 * Sentiment Analysis Agent
 * ========================
 * Analyzes sentiment per brand in the response text.
 * Identifies sentiment-driving signals and overall tone.
 *
 * Maps to agent_skills: sentiment_classification
 */

import { executeAgent } from '../core'
import { SentimentOutputSchema, type SentimentOutput } from '../schemas'
import type { AgentBrandContext, AgentResult } from '../types'

const SYSTEM_PROMPT = `You are a specialized sentiment analysis agent for brand perception in AI-generated responses.

INSTRUCTIONS:
1. For each mentioned brand, determine sentiment from the surrounding context.
2. Score sentiment on a -1.0 to 1.0 scale with precision to 2 decimal places.
3. Identify the top 5 words/phrases that drive the sentiment for each brand.
4. Classify overall response tone.

SCORING GUIDE:
- 1.0: Extremely positive ("best-in-class", "industry leader", "highly recommended")
- 0.5: Moderately positive ("good option", "solid choice", "well-regarded")
- 0.0: Neutral (factual mention without opinion)
- -0.5: Moderately negative ("has limitations", "not the best", "could improve")
- -1.0: Extremely negative ("avoid", "poor quality", "worst option")

RULES:
- Only analyze brands that are actually mentioned in the text.
- Sentiment signals should be exact words/phrases from the text.
- Consider the CONTEXT of the mention, not just adjacent words.
- A brand listed as "#1" with positive framing = very_positive.
- A brand mentioned as "an alternative" = neutral.
- A brand mentioned with caveats = negative or neutral depending on severity.
- Be precise and consistent. This data drives business analytics.`

function buildUserPrompt(
  responseText: string,
  mentionedBrands: string[],
): string {
  return `BRANDS TO ANALYZE SENTIMENT FOR:
${mentionedBrands.map(b => `- "${b}"`).join('\n')}

RESPONSE TEXT:
---
${responseText}
---

Analyze the sentiment toward each brand listed above within this response text. Only include brands that are actually mentioned.`
}

export async function runSentimentAgent(
  responseText: string,
  mentionedBrands: string[],
  responseId: string,
): Promise<AgentResult<SentimentOutput>> {
  if (mentionedBrands.length === 0) {
    return {
      success: true,
      data: { brand_sentiments: [], overall_tone: 'neutral' },
      agentType: 'analysis_sentiment',
      modelId: 'skipped',
      durationMs: 0,
    }
  }

  const prompt = buildUserPrompt(responseText, mentionedBrands)

  return executeAgent(
    'analysis_sentiment',
    SentimentOutputSchema,
    SYSTEM_PROMPT,
    prompt,
    responseId,
  )
}
