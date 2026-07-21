/**
 * Citation Extraction Agent
 * =========================
 * Extracts and classifies all citations, URLs, and source references
 * from AI-generated response text.
 *
 * Maps to agent_skills: source_extraction
 */

import { executeAgent } from '../core'
import { CitationOutputSchema, type CitationOutput } from '../schemas'
import type { AgentBrandContext, AgentResult } from '../types'

const SYSTEM_PROMPT = `You are a specialized citation and source extraction agent. Your task is to identify every UNIQUE external source, URL, link, and reference in AI-generated text.

CRITICAL RULE — DEDUPLICATION:
- Each unique URL or domain must appear ONLY ONCE in your output.
- If the same URL/domain appears multiple times in the text, output it as a SINGLE entry with times_referenced set to the total count.
- NEVER output duplicate citations. Merge all occurrences into one entry.
- Output at most 10 unique citations. If more than 10 are found, keep the 10 most prominent.
- STOP generating after 10 entries. Exceeding 10 will cause errors.

INSTRUCTIONS:
1. Extract ALL unique URLs (full and partial), domains, numbered references, and inline citations.
2. For each citation, determine the domain name (strip www. prefix).
3. Classify each source type based on domain and context.
4. Determine which brand (if any) benefits from each citation.
5. Maintain citation order by first appearance in the text.
6. If the same source appears multiple times, increment times_referenced — do NOT add a new entry.

SOURCE TYPE CLASSIFICATION:
- "owned": The primary brand's own website/property
- "competitor": A competitor's website/property
- "news": Major news outlets (reuters, bbc, cnn, techcrunch, etc.)
- "research": Academic/research (arxiv, scholar.google, nature.com, etc.)
- "government": Government sites (.gov domains)
- "academic": Academic institutions (.edu, .ac. domains)
- "ugc": User-generated content (reddit, quora, stackoverflow, etc.)
- "earned": Third-party mentions, blogs, review sites not owned by any tracked brand
- "directory": Business directories (g2, capterra, yelp, etc.)
- "social": Social media platforms (twitter, linkedin, facebook)

CONTENT CATEGORY:
- Classify based on URL path and context (blog, review, news, product, research, social, forum, directory, documentation, other)

RULES:
- Extract EVERY unique URL, even if malformed or partial.
- For markdown links [text](url), the text is the anchor_text.
- For numbered references (e.g., "[1]", "1."), map to URLs if listed at the end.
- MERGE duplicate URLs — set times_referenced to the total count. NEVER repeat the same URL.
- Domain should be lowercase, no "www." prefix.
- benefits_brand should be null for neutral/general sources.
- HARD LIMIT: Maximum 10 unique citations. Stop after 10.`

function buildUserPrompt(
  responseText: string,
  brandContext: AgentBrandContext,
): string {
  const brandInfo = [
    `PRIMARY BRAND: "${brandContext.primaryBrand.name}" (domain: ${brandContext.primaryBrand.domain || 'unknown'})`,
    ...brandContext.competitors.map(c =>
      `COMPETITOR: "${c.name}" (domain: ${c.domain || 'unknown'})`
    ),
  ].join('\n')

  return `BRAND CONTEXT:
${brandInfo}

RESPONSE TEXT TO EXTRACT CITATIONS FROM:
---
${responseText}
---

Extract ALL citations, links, URLs, and source references from this text. Classify each one and determine which brand benefits from it.`
}

export async function runCitationAgent(
  responseText: string,
  brandContext: AgentBrandContext,
  responseId: string,
): Promise<AgentResult<CitationOutput>> {
  const prompt = buildUserPrompt(responseText, brandContext)

  return executeAgent(
    'analysis_citation',
    CitationOutputSchema,
    SYSTEM_PROMPT,
    prompt,
    responseId,
  )
}
