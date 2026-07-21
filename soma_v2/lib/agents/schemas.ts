/**
 * Agent Schemas
 * =============
 * Zod schemas for structured output from AI analysis agents.
 * Each schema defines the exact structure that generateObject will enforce.
 */

import { z } from 'zod'

// ─── Brand Detection Schema ────────────────────────────────

export const BrandMentionSchema = z.object({
  brand_name: z.string().describe('Exact brand name as found in text'),
  mentioned: z.boolean().describe('Whether the brand is mentioned'),
  mention_count: z.number().int().describe('Number of times brand appears (0 if not mentioned)'),
  first_position: z.enum(['early', 'middle', 'late']).describe('Where in the text the first mention appears'),
  brand_rank: z.preprocess(
    (val) => (typeof val === 'string' ? null : val),
    z.number().int().nullable()
  ).describe('Ordinal rank (1 = first mentioned). null if not mentioned. NEVER use strings.'),
  is_primary_recommendation: z.boolean().describe('Whether the brand is the primary/top recommendation'),
  recommendation_context: z.string().nullable().describe('Brief quote or context for why brand was recommended (max 100 chars)'),
})

export const BrandDetectionOutputSchema = z.object({
  brands: z.array(BrandMentionSchema).describe('All detected brand mentions (max 25)'),
  competitive_density: z.number().int().describe('Total number of distinct brands mentioned'),
  response_type: z.enum([
    'recommendation_list',
    'comparison',
    'single_brand_focus',
    'general_information',
    'how_to_guide',
    'opinion_editorial',
  ]).describe('Classification of the response type'),
})

export type BrandDetectionOutput = z.infer<typeof BrandDetectionOutputSchema>

// ─── Sentiment Analysis Schema ─────────────────────────────

export const BrandSentimentSchema = z.object({
  brand_name: z.string().describe('Brand name analyzed'),
  raw_sentiment: z.number().min(-1).max(1).describe('Sentiment score from -1.0 (very negative) to 1.0 (very positive)'),
  sentiment_label: z.enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive']).describe('Categorical sentiment label'),
  sentiment_signals: z.array(z.string()).max(5).describe('Top 5 words/phrases driving the sentiment'),
  confidence: z.number().min(0).max(1).describe('Confidence in the sentiment assessment'),
})

export const SentimentOutputSchema = z.object({
  brand_sentiments: z.array(BrandSentimentSchema).describe('Sentiment analysis per brand'),
  overall_tone: z.enum(['promotional', 'neutral', 'critical', 'balanced', 'educational']).describe('Overall tone of the response'),
})

export type SentimentOutput = z.infer<typeof SentimentOutputSchema>

// ─── Citation Extraction Schema ────────────────────────────

export const CitationSchema = z.object({
  url: z.string().nullable().describe('Full URL if present, null for domain-only mentions'),
  domain: z.string().describe('Domain name (e.g., example.com)'),
  page_title: z.string().nullable().describe('Page title or anchor text if available'),
  anchor_text: z.string().nullable().describe('Anchor text used in the link'),
  citation_rank: z.number().int().min(1).describe('Order in which the citation appears'),
  times_referenced: z.number().int().min(1).describe('How many times this source is referenced'),
  source_type: z.enum([
    'owned', 'competitor', 'news', 'research', 'government',
    'academic', 'ugc', 'earned', 'directory', 'social',
  ]).describe('Classification of the source'),
  content_category: z.enum([
    'blog', 'review', 'news', 'product', 'research',
    'social', 'forum', 'directory', 'documentation', 'other',
  ]).nullable().describe('Category of the cited content'),
  benefits_brand: z.string().nullable().describe('Brand name this citation primarily benefits, or null if neutral'),
  is_competitor_source: z.boolean().describe('Whether this source belongs to a competitor'),
})

export const CitationOutputSchema = z.object({
  citations: z.array(CitationSchema).max(10).describe('All UNIQUE extracted citations/sources (max 10, deduplicated by URL)'),
  total_citations: z.number().int().min(0).describe('Total number of unique citations'),
  has_numbered_sources: z.boolean().describe('Whether the response uses numbered source references'),
  has_inline_links: z.boolean().describe('Whether the response contains inline hyperlinks'),
})

export type CitationOutput = z.infer<typeof CitationOutputSchema>

// ─── Topic Extraction Schema ──────────────────────────────

export const TopicSchema = z.object({
  name: z.string().max(120).describe('Topic name (title case, concise)'),
  category: z.enum([
    'pricing', 'features', 'security', 'performance', 'support',
    'market', 'reputation', 'use_case', 'onboarding', 'compliance',
    'integration', 'scalability', 'user_experience', 'other',
  ]).describe('Topic category'),
  relevance: z.number().min(0).max(1).describe('Relevance score 0.0-1.0 (how central to the response)'),
  sentiment: z.number().min(-1).max(1).describe('Sentiment within this topic context -1.0 to 1.0'),
})

export const TopicOutputSchema = z.object({
  topics: z.array(TopicSchema).max(12).describe('Extracted topics, max 12, ordered by relevance. Each must be distinct and actionable.'),
  primary_intent: z.string().max(200).describe('The primary user intent this response addresses'),
})

export type TopicOutput = z.infer<typeof TopicOutputSchema>

// ─── Brand Topic Association Schema ───────────────────────

export const BrandTopicAssociationSchema = z.object({
  brand_name: z.string().describe('Brand name this topic is associated with'),
  topic_name: z.string().max(120).describe('Topic/attribute name (title case, concise)'),
  topic_category: z.enum([
    'pricing', 'features', 'security', 'performance', 'support',
    'market', 'reputation', 'use_case', 'onboarding', 'compliance',
    'integration', 'scalability', 'user_experience', 'other',
  ]).describe('Topic category'),
  sentiment: z.number().min(-1).max(1).describe('Sentiment about this brand regarding this topic (-1.0 to 1.0)'),
  relevance: z.number().min(0).max(1).describe('How relevant this topic is to the discussion of this brand'),
})

export const BrandTopicOutputSchema = z.object({
  topics: z.array(TopicSchema).max(12).describe('Response-level topics, max 12, ordered by relevance. Each must be distinct and actionable.'),
  brand_topic_associations: z.array(BrandTopicAssociationSchema).max(50).describe('Per-brand topic associations — which topics are attributed to which brand, with per-brand sentiment'),
  primary_intent: z.string().max(200).describe('The primary user intent this response addresses'),
})

export type BrandTopicAssociation = z.infer<typeof BrandTopicAssociationSchema>
export type BrandTopicOutput = z.infer<typeof BrandTopicOutputSchema>
