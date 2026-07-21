/**
 * Brand Detection Agent
 * =====================
 * Detects brand mentions, ranks them by appearance order,
 * counts occurrences, and identifies primary recommendations.
 *
 * Maps to agent_skills: brand_mention_detection, competitive_positioning
 */

import { executeAgent } from '../core'
import { BrandDetectionOutputSchema, type BrandDetectionOutput } from '../schemas'
import type { AgentBrandContext, AgentResult } from '../types'

const SYSTEM_PROMPT = `You are a specialized brand detection analyst. Your task is to analyze AI-generated text responses and extract precise information about brand mentions.

INSTRUCTIONS:
1. Identify EVERY brand, company, or product name mentioned in the text.
2. For each brand, count exact mentions (including variations and abbreviations).
3. Rank brands by their order of first appearance (1 = first mentioned).
4. Determine if a brand is the primary/top recommendation.
5. Classify the overall response type.

RULES:
- Be case-insensitive but report exact capitalization from the text.
- Count each distinct mention separately (e.g., "Slack" and "Slack's" = 2 mentions).
- A brand is "primary recommendation" if it's presented as the top choice, #1 pick, or most recommended option.
- For "first_position": early = first third of text, middle = second third, late = final third.
- Include ALL brands from the provided brand list that are mentioned, plus any additional brands found.
- If a brand from the list is NOT mentioned, still include it with mentioned=false.
- brand_rank MUST be an integer or null. For unmentioned brands, use null (JSON literal null). NEVER use the string "N/A".

OUTPUT ACCURACY IS CRITICAL. This data feeds into business metrics.`

function buildUserPrompt(responseText: string, brandContext: AgentBrandContext): string {
  const brandList = [
    `PRIMARY BRAND: "${brandContext.primaryBrand.name}"${brandContext.primaryBrand.aliases.length ? ` (aliases: ${brandContext.primaryBrand.aliases.join(', ')})` : ''}`,
    ...brandContext.competitors.map(c => `COMPETITOR: "${c.name}"${c.domain ? ` (domain: ${c.domain})` : ''}`),
  ].join('\n')

  return `BRANDS TO DETECT:
${brandList}

RESPONSE TEXT TO ANALYZE:
---
${responseText}
---

Analyze this text and extract all brand mentions. Include every brand from the list above (marking as not mentioned if absent), plus any additional brands found in the text.`
}

export async function runBrandDetectionAgent(
  responseText: string,
  brandContext: AgentBrandContext,
  responseId: string,
): Promise<AgentResult<BrandDetectionOutput>> {
  const prompt = buildUserPrompt(responseText, brandContext)

  return executeAgent(
    'analysis_brand_detector',
    BrandDetectionOutputSchema,
    SYSTEM_PROMPT,
    prompt,
    responseId,
  )
}
