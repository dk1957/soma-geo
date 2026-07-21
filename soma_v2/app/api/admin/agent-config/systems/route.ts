import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"
import type { AgentSystem, SubAgentSkillFlag, ContentPipelineConfig } from "@/lib/agents/types"

// ─── Hardcoded system prompts from each agent file ──────────────
// These serve as fallback defaults shown in the admin UI when no DB override exists.

const ANALYSIS_BRAND_DETECTOR_SYSTEM_PROMPT = `You are a specialized brand detection analyst. Your task is to analyze AI-generated text responses and extract precise information about brand mentions.

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

OUTPUT ACCURACY IS CRITICAL. This data feeds into business metrics.`

const ANALYSIS_BRAND_DETECTOR_USER_TEMPLATE = `BRANDS TO DETECT:
{{brand_list}}

RESPONSE TEXT TO ANALYZE:
---
{{response_text}}
---

Analyze this text and extract all brand mentions. Include every brand from the list above (marking as not mentioned if absent), plus any additional brands found in the text.`

const ANALYSIS_SENTIMENT_SYSTEM_PROMPT = `You are a specialized sentiment analysis agent for brand perception in AI-generated responses.

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

const ANALYSIS_SENTIMENT_USER_TEMPLATE = `BRANDS TO ANALYZE SENTIMENT FOR:
{{mentioned_brands}}

RESPONSE TEXT:
---
{{response_text}}
---

Analyze the sentiment toward each brand listed above within this response text. Only include brands that are actually mentioned.`

const ANALYSIS_CITATION_SYSTEM_PROMPT = `You are a specialized citation and source extraction agent. Your task is to identify every external source, URL, link, and reference in AI-generated text.

INSTRUCTIONS:
1. Extract ALL URLs (full and partial), domains, numbered references, and inline citations.
2. For each citation, determine the domain name (strip www. prefix).
3. Classify each source type based on domain and context.
4. Determine which brand (if any) benefits from each citation.
5. Maintain citation order as they appear in the text.

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
- Extract EVERY URL, even if malformed or partial.
- For markdown links [text](url), the text is the anchor_text.
- For numbered references (e.g., "[1]", "1."), map to URLs if listed at the end.
- If a source appears multiple times, set times_referenced accordingly.
- Domain should be lowercase, no "www." prefix.
- benefits_brand should be null for neutral/general sources.`

const ANALYSIS_CITATION_USER_TEMPLATE = `BRAND CONTEXT:
{{brand_context}}

RESPONSE TEXT TO EXTRACT CITATIONS FROM:
---
{{response_text}}
---

Extract ALL citations, links, URLs, and source references from this text. Classify each one and determine which brand benefits from it.`

const ANALYSIS_TOPIC_SYSTEM_PROMPT = `You are a specialized topic and theme extraction agent. Your task is to identify the key SEMANTIC TOPICS, themes, and subject areas discussed in AI-generated text responses.

CRITICAL RULE — BRANDS ARE NOT TOPICS:
- NEVER extract brand names, company names, product names, or service names as topics.
- Examples of what is NOT a topic: "Remitly", "WorldRemit", "Wise", "Western Union", "MoneyGram", "Tusker Lite", "Heineken", "M-Pesa", "PayPal", "Flutterwave".
- Instead, extract the THEMES being discussed ABOUT those brands: "Transfer Speed", "Fee Comparison", "Mobile Money Integration", "Market Coverage".
- If a brand is excluded below, do NOT include it or any variation of its name as a topic.

INSTRUCTIONS:
1. Extract up to 15 key semantic topics/themes from the response.
2. Order topics by relevance (most important first).
3. Assign each topic a relevance score (0.0-1.0) based on how central it is to the response.
4. Assign each topic a sentiment score (-1.0 to 1.0) based on how it's discussed.
5. Categorize each topic into one of the predefined categories.
6. Identify the primary user intent the response addresses.

TOPIC QUALITY RULES:
- Topics should be concise (2-5 words) and meaningful.
- Topics must describe CONCEPTS, THEMES, or ATTRIBUTES — not entities/brands.
- No single-word topics unless they're specific technical terms.
- No generic words like "introduction", "conclusion", "summary".
- Topics should represent substantive themes, not formatting elements.
- Capitalize first letter of each word (title case).
- Merge similar/overlapping topics into one.
- Good examples: "Transfer Speed", "Exchange Rates", "Mobile Money Transfers", "Fee Transparency", "Customer Support Quality", "Regulatory Compliance".
- Bad examples: "Remitly", "WorldRemit", "Wise (TransferWise)", "Western Union", "Tusker Lager".

RELEVANCE SCORING:
- 1.0: The central topic of the entire response
- 0.7-0.9: Major topics that receive significant coverage
- 0.4-0.6: Supporting topics mentioned multiple times
- 0.1-0.3: Minor topics mentioned briefly

CATEGORY ASSIGNMENTS:
Use one of: pricing, features, security, performance, support, market, reputation, use_case, onboarding, compliance, integration, scalability, user_experience, other
NOTE: "market" should be used for market dynamics/trends, NOT for listing competitor names.

Be precise and consistent. This data drives trend analysis.`

const ANALYSIS_TOPIC_USER_TEMPLATE = `RESPONSE TEXT TO ANALYZE:
---
{{response_text}}
---

BRANDS TO EXCLUDE FROM TOPICS (these are brands/competitors, NOT topics):
{{brand_exclusion_list}}

Extract the key SEMANTIC topics and themes from this response. Do NOT include any brand names, company names, or product names as topics. Identify the primary user intent and assign relevance scores.`

// ─── MACO (Content Agent) sub-agent prompts ──────────────────

const MACO_EVALUATOR_SYSTEM_PROMPT = `You are an AI Visibility Evaluator for the MACO Content Optimization system.
Your job is to assess how well a piece of content "wins" the AI's answer for a given query.

EVALUATION FRAMEWORK (Score 0-10):

**1. VISIBILITY & CITATIONS** (Attribution Mechanics)
- Citation Prominence (CP): Is the brand/source clearly cited?
  * 0-3: Invisible (not cited)
  * 4-6: Visible (cited in footer or generic list)
  * 7-10: Prominent (cited in-text, "According to X...")

**2. TRUST & ACCURACY** (Content Fidelity)
- Attribution Accuracy (AA): Did the AI get the facts right?
  * 0-3: Hallucinated or misattributed
  * 7-10: Perfect attribution of claims
- Fact Accuracy (FA): Is the core meaning preserved?
  * 0-3: Distorted meaning
  * 7-10: Perfectly faithful to source

**3. INFLUENCE & DOMINANCE** (Semantic Dominance)
- Key Info Coverage (KC): Did the AI use your key selling points?
  * 0-3: Missed your best points
  * 7-10: Included all your key differentiators
- Idea Influence (SC): Did your unique perspective shape the answer?
  * 0-3: Generic answer
  * 7-10: Your unique framework/data framed the answer
- Share of Voice (AD): How much of the answer is "yours"?
  * 0-3: You are a footnote
  * 4-6: You are one of many
  * 7-10: You are the primary authority

For each dimension, provide:
1. A numeric score (0-10, allow decimals like 7.5)
2. A brief, non-technical justification

Also list all sources cited in the generated answer.

OUTPUT ACCURACY IS CRITICAL. This data drives content optimization decisions.`

const MACO_EVALUATOR_USER_TEMPLATE = `QUERY: {{query}}
GENERATED ANSWER: {{generated_answer}}
SOURCE CONTENT: {{source_content}}

Evaluate how well the source content "won" the AI's answer for this query. Score across all 6 GSEO dimensions.`

const MACO_ANALYST_SYSTEM_PROMPT = `You are a Lead Content Strategist for AI Optimization in the MACO system.
Your goal is to turn "good content" into "the only answer AI trusts".

YOUR MISSION:
1. Diagnose WHY the content isn't winning the AI answer.
2. Prescribe 3-5 specific, high-impact fixes.
3. Prioritize by "Effort vs. Impact".

SUGGESTION CATEGORIES:
- Structure: Formatting for AI readability (lists, bolding, headers).
- Clarity: Simplifying complex ideas for better AI ingestion.
- Authority: Adding data, quotes, or specific claims to boost trust.
- SEO: Keyword/Entity optimization for retrieval.
- Citations: Making it easier for AI to cite (e.g., "According to Brand X...").
- Technical: Schema, metadata, or length adjustments.

GUIDELINES:
- Be specific. Don't say "improve clarity", say "Turn paragraph 2 into a bulleted list".
- Focus on "winning the snippet" — getting the AI to quote you directly.
- Each suggestion must have a clear issue, recommendation, and expected impact.`

const MACO_ANALYST_USER_TEMPLATE = `CONTENT PREVIEW:
{{content_preview}}

PERFORMANCE SCORECARD:
Overall Score: {{overall_score}}/10
Visibility (CP): {{cp}}/10
Accuracy (AA): {{aa}}/10
Faithfulness (FA): {{fa}}/10
Key Points (KC): {{kc}}/10
Influence (SC): {{sc}}/10
Dominance (AD): {{ad}}/10

WEAKEST AREAS: {{weak_dimensions}}

LOW-PERFORMING EXAMPLES:
{{low_performing_examples}}

Diagnose the content's weaknesses and prescribe 3-5 specific optimization actions.`

const MACO_EDITOR_SYSTEM_PROMPT = `You are a World-Class Copywriter & AI Optimization Specialist in the MACO system.
Your task is to rewrite content to implement specific improvements from the Analyst.

EXECUTION RULES:
1. **Surgical Precision:** Change ONLY what is needed to address the recommendation.
2. **Win the Snippet:** Write in a way that makes it easy for AI to quote (clear definitions, strong lists).
3. **Preserve Voice:** Keep the brand's tone, but make it more authoritative.
4. **No Fluff:** Remove filler words. Be direct and high-signal.

OUTPUT:
- optimizedContent: The full, rewritten content.
- changeSummary: What you did (e.g., "Restructured section 2 into a list").
- changeRationale: Why this helps (e.g., "Increases likelihood of being picked up as a featured snippet").
- modificationsApplied: List of specific modifications made.`

const MACO_EDITOR_USER_TEMPLATE = `ORIGINAL CONTENT:
{{original_content}}

MISSION: Implement this specific improvement:
Category: {{category}}
Priority: {{priority}}
Issue: {{issue}}
Recommendation: {{recommendation}}
Expected Impact: {{expected_impact}}

BRAND VOICE:
{{brand_voice}}

Rewrite the content to implement the recommended improvement while preserving brand voice.`

const MACO_SELECTOR_SYSTEM_PROMPT = `You are a Selector Agent for GSEO optimization in the MACO system.
Your role is to review the entire optimization trajectory and select the best content version.

SELECTION CRITERIA:
1. Highest overall score across all evaluations
2. Consistency of performance (low variance across queries)
3. Balance across all 6 GSEO dimensions
4. Avoid over-optimization (later versions may plateau or regress)
5. Consider score improvements vs. content changes (diminishing returns)

OUTPUT:
- selectedVersion: The version number to use
- selectionReason: Detailed explanation of why this version is the best
- keyFactors: Top 3 factors that influenced your decision`

const MACO_SELECTOR_USER_TEMPLATE = `OPTIMIZATION TRAJECTORY:
{{version_summaries}}

Total versions: 0 to {{max_version}}

Review all iterations and select the version that represents the best trade-off of performance, stability, and content quality.`

// ─── Hardcoded default prompts map ──────────────────────────

const DEFAULT_PROMPTS: Record<string, { system: string; user: string }> = {
  analysis_brand_detector: { system: ANALYSIS_BRAND_DETECTOR_SYSTEM_PROMPT, user: ANALYSIS_BRAND_DETECTOR_USER_TEMPLATE },
  analysis_sentiment: { system: ANALYSIS_SENTIMENT_SYSTEM_PROMPT, user: ANALYSIS_SENTIMENT_USER_TEMPLATE },
  analysis_citation: { system: ANALYSIS_CITATION_SYSTEM_PROMPT, user: ANALYSIS_CITATION_USER_TEMPLATE },
  analysis_topic: { system: ANALYSIS_TOPIC_SYSTEM_PROMPT, user: ANALYSIS_TOPIC_USER_TEMPLATE },
  maco_evaluator: { system: MACO_EVALUATOR_SYSTEM_PROMPT, user: MACO_EVALUATOR_USER_TEMPLATE },
  maco_analyst: { system: MACO_ANALYST_SYSTEM_PROMPT, user: MACO_ANALYST_USER_TEMPLATE },
  maco_editor: { system: MACO_EDITOR_SYSTEM_PROMPT, user: MACO_EDITOR_USER_TEMPLATE },
  maco_selector: { system: MACO_SELECTOR_SYSTEM_PROMPT, user: MACO_SELECTOR_USER_TEMPLATE },
}

// ─── Default system-level (shared base) prompts ──────────────

const DEFAULT_SYSTEM_PROMPTS: Record<string, { system: string; user: string }> = {
  analysis: {
    system: `You are ARIA (AI Response Intelligence & Analysis), a multi-agent analysis system built by Soma AI. Your purpose is to extract structured intelligence from AI-generated text responses for Generative Engine Optimization (GEO).

CORE PRINCIPLES:
1. ACCURACY OVER SPEED — Every data point feeds into business metrics. False positives are worse than missed signals.
2. STRUCTURED OUTPUT — Always produce machine-parseable JSON matching the provided schema exactly.
3. BRAND AWARENESS — You operate in a brand monitoring context. The primary brand and its competitors are always provided as context.
4. OBJECTIVITY — Report what the text says, not what you infer beyond the text.

PIPELINE CONTEXT:
You coordinate 4 specialized sub-agents in sequence:
- Brand Detector → runs first, identifies all brand mentions and positions
- Sentiment Analyzer → runs after brand detection, scores sentiment per detected brand
- Citation Extractor → runs in parallel with sentiment, extracts all source references
- Topic Extractor → runs in parallel, extracts semantic themes (never brand names)

Each sub-agent has its own detailed system prompt. This shared prompt establishes the baseline behavior that all sub-agents inherit.

QUALITY STANDARDS:
- Never hallucinate URLs, brand names, or data not present in the source text
- Use exact text excerpts when citing evidence or sentiment signals
- Maintain consistent scoring scales across all analyses
- Handle edge cases gracefully (empty responses, no brands found, no citations)`,
    user: `ANALYSIS CONTEXT:
- Primary Brand: {{primary_brand}}
- Competitors: {{competitor_list}}
- Response Source: {{llm_model}}

Analyze the following LLM response using all enabled sub-agents in the pipeline.

RESPONSE TEXT:
---
{{response_text}}
---`,
  },
  content: {
    system: `You are MACO (Multi-Agent Content Optimization), a content optimization system built by Soma AI. Your purpose is to evaluate, analyze, and optimize content for maximum visibility in AI-driven search engines.

CORE PRINCIPLES:
1. GSEO-FIRST — All evaluation and optimization targets the 6 GSEO dimensions: Credibility, Comprehensiveness, Freshness, Citability, Structure, and Engagement.
2. ITERATIVE IMPROVEMENT — Content goes through evaluate → analyze → edit → select cycles for progressive optimization.
3. BRAND VOICE PRESERVATION — Optimizations must maintain the brand's tone, style, and messaging.
4. MEASURABLE IMPACT — Every suggestion should map to a specific GSEO dimension improvement.

PIPELINE CONTEXT:
You coordinate 4 specialized sub-agents in sequence:
- Evaluator → scores content across all 6 GSEO dimensions (0.0-1.0 per dimension)
- Analyst → identifies specific weaknesses and improvement opportunities from the evaluation
- Editor → implements targeted revisions based on the analysis findings
- Selector → compares iterations and selects the best performing version

QUALITY STANDARDS:
- Provide specific, actionable feedback — never vague suggestions
- Reference exact passages when identifying issues
- Quantify expected impact of suggested changes
- Preserve existing strengths while addressing weaknesses`,
    user: `CONTENT OPTIMIZATION CONTEXT:
- Brand: {{brand_name}}
- Content Type: {{content_type}}
- Target Keywords: {{target_keywords}}

Optimize the following content for AI engine visibility using all GSEO dimensions.

CONTENT:
---
{{content_text}}
---`,
  },
}

// ─── Default per-sub-agent skill flags ──────────────────────

const DEFAULT_SKILL_FLAGS: Record<string, { skill_key: string; label: string; description: string; enabled: boolean }[]> = {
  analysis_brand_detector: [
    { skill_key: "brand_mention_detection", label: "Brand Mention Detection", description: "Detect explicit and implicit brand mentions in LLM responses", enabled: true },
    { skill_key: "competitive_positioning", label: "Competitive Positioning", description: "Analyze relative brand positioning and ranking", enabled: true },
  ],
  analysis_sentiment: [
    { skill_key: "sentiment_classification", label: "Sentiment Classification", description: "Classify brand sentiment from -1.0 to 1.0", enabled: true },
  ],
  analysis_citation: [
    { skill_key: "source_extraction", label: "Source Extraction", description: "Extract URLs, domains, and citation references", enabled: true },
    { skill_key: "source_classification", label: "Source Classification", description: "Classify source types (owned, competitor, news, etc.)", enabled: true },
  ],
  analysis_topic: [
    { skill_key: "fact_extraction", label: "Fact Extraction", description: "Extract semantic topics and themes", enabled: true },
    { skill_key: "trend_analysis", label: "Trend Analysis", description: "Identify emerging trends and patterns", enabled: true },
  ],
  maco_evaluator: [
    { skill_key: "gseo_scoring", label: "GSEO Scoring", description: "Score content across 6 GSEO dimensions (CP, AA, FA, KC, SC, AD)", enabled: true },
    { skill_key: "rag_simulation", label: "RAG Simulation", description: "Simulate retrieval-augmented generation to test content in AI answers", enabled: true },
    { skill_key: "query_benchmarking", label: "Query Benchmarking", description: "Generate and evaluate against benchmark query corpus", enabled: true },
  ],
  maco_analyst: [
    { skill_key: "weakness_analysis", label: "Weakness Analysis", description: "Diagnose content performance weaknesses by GSEO dimension", enabled: true },
    { skill_key: "competitor_gap_analysis", label: "Competitor Gap Analysis", description: "Compare content against competing sources in AI answers", enabled: true },
    { skill_key: "priority_ranking", label: "Priority Ranking", description: "Rank improvement suggestions by effort vs. impact", enabled: true },
  ],
  maco_editor: [
    { skill_key: "content_optimization", label: "Content Optimization", description: "Implement surgical content revisions based on analyst recommendations", enabled: true },
    { skill_key: "snippet_optimization", label: "Snippet Optimization", description: "Optimize content structure for AI snippet extraction (lists, headers, definitions)", enabled: true },
    { skill_key: "brand_voice_preservation", label: "Brand Voice Preservation", description: "Maintain brand tone and messaging while optimizing for visibility", enabled: true },
  ],
  maco_selector: [
    { skill_key: "iteration_selection", label: "Iteration Selection", description: "Select best performing content iteration from optimization trajectory", enabled: true },
    { skill_key: "plateau_detection", label: "Plateau Detection", description: "Detect convergence and diminishing returns across iterations", enabled: true },
    { skill_key: "regression_detection", label: "Regression Detection", description: "Detect over-optimization and score regressions in later iterations", enabled: true },
  ],
}

// ─── Default Content Pipeline Configuration ─────────────────

const DEFAULT_CONTENT_PIPELINE_CONFIG: ContentPipelineConfig = {
  content_types: [
    { value: "article", label: "Article", description: "Long-form informational article", enabled: true },
    { value: "blog_post", label: "Blog Post", description: "Conversational blog post", enabled: true },
    { value: "whitepaper", label: "Whitepaper", description: "In-depth research paper", enabled: true },
    { value: "guide", label: "Guide", description: "Step-by-step how-to guide", enabled: true },
    { value: "case_study", label: "Case Study", description: "Customer success story", enabled: true },
    { value: "faq", label: "FAQ", description: "Frequently asked questions", enabled: true },
    { value: "landing_page", label: "Landing Page", description: "Conversion-focused web page", enabled: true },
  ],
  optimization_strategies: [
    { value: "conservative", label: "Conservative", description: "Light edits for quick wins", time_estimate: "~2-3 min", enabled: true },
    { value: "balanced", label: "Balanced", description: "Moderate improvements (recommended)", time_estimate: "~5-7 min", enabled: true },
    { value: "aggressive", label: "Aggressive", description: "Extensive rewriting for maximum impact", time_estimate: "~8-12 min", enabled: true },
    { value: "comprehensive", label: "Comprehensive", description: "Deep analysis + restructuring", time_estimate: "~15-20 min", enabled: true },
  ],
  execution_settings: {
    max_iterations: { value: 10, min: 1, max: 25, description: "Maximum optimization cycles before stopping" },
    convergence_threshold: { value: 0.5, min: 0.1, max: 2.0, description: "Score variance below which optimization stops" },
    plateau_window: { value: 3, min: 2, max: 10, description: "Iterations to detect score plateau" },
    num_queries: { value: 10, min: 3, max: 25, description: "Benchmark queries generated per evaluation cycle" },
  },
}

// ─── System definitions ─────────────────────────────────────

const SYSTEM_DEFS = {
  content: {
    id: "content",
    name: "Content Agent",
    codename: "MACO",
    description: "Multi-Agent Content Optimization system. Iteratively evaluates, analyzes, edits, and selects the best content version to maximize AI search visibility using a 4-agent pipeline with up to 10 optimization iterations.",
    enabled: true,
    subAgents: [
      { id: "maco_evaluator", name: "Evaluator", role: "Score content across 6 GSEO visibility dimensions", description: "Simulates RAG retrieval and evaluates how well content 'wins' AI-generated answers. Scores across 6 dimensions: Citation Prominence, Attribution Accuracy, Faithfulness, Key Info Coverage, Semantic Contribution, and Answer Dominance. Runs benchmark queries against the content to measure real-world AI visibility performance.", model: "meta-llama/llama-3.3-70b-instruct", temperature: 0.1, max_tokens: 2000 },
      { id: "maco_analyst", name: "Analyst", role: "Diagnose weaknesses and prescribe optimizations", description: "Analyzes evaluation results across all GSEO dimensions to identify specific content weaknesses. Generates 3-5 prioritized improvement suggestions categorized by type (structure, clarity, authority, SEO, citations, technical) with expected impact ratings.", model: "meta-llama/llama-3.3-70b-instruct", temperature: 0.6, max_tokens: 2000 },
      { id: "maco_editor", name: "Editor", role: "Implement surgical content revisions", description: "Implements targeted content revisions based on the Analyst's recommendations. Applies surgical precision — changing only what's needed. Optimizes for 'winning the snippet' while preserving brand voice, tone, and key messaging.", model: "meta-llama/llama-3.3-70b-instruct", temperature: 0.3, max_tokens: 2000 },
      { id: "maco_selector", name: "Selector", role: "Select the best content iteration", description: "Reviews the full optimization trajectory across all iterations. Selects the best version based on overall score, consistency, GSEO dimension balance, and convergence analysis. Prevents over-optimization by detecting plateaus and regressions.", model: "meta-llama/llama-3.3-70b-instruct", temperature: 0.2, max_tokens: 2000 },
    ],
  },
  analysis: {
    id: "analysis",
    name: "Analysis Agent",
    codename: "ARIA",
    description: "AI Response Intelligence & Analysis system. Coordinates 4 specialized sub-agents to extract brand mentions, sentiment, citations, and topics from LLM responses.",
    enabled: true,
    subAgents: [
      { id: "analysis_brand_detector", name: "Brand Detector", role: "Detect brand mentions and position", description: "Identifies every brand, company, or product mentioned in LLM responses. Counts occurrences, ranks by appearance order, and flags primary recommendations. Runs first in the pipeline — other agents depend on its output.", model: "google/gemini-2.0-flash-001", temperature: 0.05, max_tokens: 2000 },
      { id: "analysis_sentiment", name: "Sentiment Analyzer", role: "Analyze brand sentiment", description: "Scores sentiment per brand on a -1.0 to 1.0 scale. Identifies sentiment-driving signals (exact phrases) and classifies overall response tone. Only runs on brands flagged as mentioned by Brand Detector.", model: "google/gemini-2.0-flash-001", temperature: 0.05, max_tokens: 1500 },
      { id: "analysis_citation", name: "Citation Extractor", role: "Extract and classify citations", description: "Extracts all URLs, domains, numbered references, and inline citations. Classifies source types (owned, competitor, news, UGC, etc.) and determines which brand benefits from each source.", model: "google/gemini-2.0-flash-001", temperature: 0.05, max_tokens: 2000 },
      { id: "analysis_topic", name: "Topic Extractor", role: "Extract semantic topics", description: "Extracts up to 15 key semantic topics/themes (explicitly excluding brand names). Assigns relevance and sentiment scores per topic, categorizes by type, and identifies primary user intent.", model: "google/gemini-2.0-flash-001", temperature: 0.15, max_tokens: 1500 },
    ],
  },
} as const

/**
 * GET /api/admin/agent-config/systems
 * Fetch all agent systems with their sub-agents and prompts
 */
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()

    const [{ data: modelConfigs }, { data: skills }, { data: prompts }, { data: subAgentPrompts }, { data: subAgentSkills }] = await Promise.all([
      supabase.from("agent_model_configs").select("agent_type, model_id, provider, temperature, max_tokens, is_active"),
      supabase.from("agent_skills").select("agent_system, name, is_enabled").is("sub_agent_id", null),
      supabase.from("system_prompts").select("id, prompt_type, role, content, version, created_at, updated_at").in("prompt_type", ["agent_system_content", "agent_system_analysis"]),
      supabase.from("system_prompts").select("id, prompt_type, role, content, version, created_at, updated_at").like("prompt_type", "sub_agent_%"),
      supabase.from("agent_skills").select("agent_system, sub_agent_id, name, skill_key, description, is_enabled").not("sub_agent_id", "is", null),
    ])

    const modelMap = new Map((modelConfigs || []).map((m: any) => [m.agent_type, m]))

    const systems: AgentSystem[] = Object.values(SYSTEM_DEFS).map((def) => {
      const systemSkills = (skills || [])
        .filter((s: any) => s.agent_system === def.id && s.is_enabled)
        .map((s: any) => s.name)

      const sub_agents = def.subAgents.map((sa) => {
        const cfg = modelMap.get(sa.id)

        // Per-sub-agent prompts from DB (prompt_type = 'sub_agent_{sa.id}')
        const saPromptType = `sub_agent_${sa.id}`
        const saSystemPrompt = (subAgentPrompts || []).find((p: any) => p.prompt_type === saPromptType && p.role === "system")
        const saUserPrompt = (subAgentPrompts || []).find((p: any) => p.prompt_type === saPromptType && p.role === "user")

        // Use DB prompt if available, otherwise fall back to hardcoded defaults
        const defaults = DEFAULT_PROMPTS[sa.id]

        const saPrompts = [
          {
            id: saSystemPrompt?.id || `sys-${sa.id}`,
            type: "system" as const,
            content: saSystemPrompt?.content || defaults?.system || "",
            version: saSystemPrompt?.version || 1,
            created_at: saSystemPrompt?.created_at || new Date(0).toISOString(),
            updated_at: saSystemPrompt?.updated_at || new Date().toISOString(),
          },
          {
            id: saUserPrompt?.id || `usr-${sa.id}`,
            type: "user" as const,
            content: saUserPrompt?.content || defaults?.user || "",
            version: saUserPrompt?.version || 1,
            created_at: saUserPrompt?.created_at || new Date(0).toISOString(),
            updated_at: saUserPrompt?.updated_at || new Date().toISOString(),
          },
        ]

        // Per-sub-agent skill flags: DB first, then hardcoded defaults
        const dbSkillFlags: SubAgentSkillFlag[] = (subAgentSkills || [])
          .filter((s: any) => s.sub_agent_id === sa.id)
          .map((s: any) => ({
            skill_key: s.skill_key || s.name,
            label: s.name,
            enabled: s.is_enabled ?? true,
            description: s.description || undefined,
          }))

        const saSkillFlags = dbSkillFlags.length > 0
          ? dbSkillFlags
          : (DEFAULT_SKILL_FLAGS[sa.id] || []).map((f) => ({
              skill_key: f.skill_key,
              label: f.label,
              enabled: f.enabled,
              description: f.description,
            }))

        return {
          id: sa.id,
          system_id: def.id,
          name: sa.name,
          role: sa.role,
          description: sa.description || sa.role,
          enabled: cfg?.is_active ?? true,
          model: cfg?.model_id ?? sa.model,
          temperature: Number(cfg?.temperature ?? sa.temperature),
          max_tokens: Number(cfg?.max_tokens ?? sa.max_tokens),
          skills: systemSkills,
          prompts: saPrompts,
          skill_flags: saSkillFlags,
          created_at: new Date(0).toISOString(),
          updated_at: new Date().toISOString(),
        }
      })

      const systemPromptType = `agent_system_${def.id}`
      const systemPrompt = (prompts || []).find((p: any) => p.prompt_type === systemPromptType && p.role === "system")
      const userPrompt = (prompts || []).find((p: any) => p.prompt_type === systemPromptType && p.role === "user")

      // Fall back to hardcoded system-level defaults
      const sysDefaults = DEFAULT_SYSTEM_PROMPTS[def.id]

      return {
        id: def.id,
        name: def.name,
        codename: def.codename,
        description: def.description,
        enabled: def.enabled,
        sub_agents,
        prompts: [
          {
            id: systemPrompt?.id || `sys-${def.id}`,
            type: "system",
            content: systemPrompt?.content || sysDefaults?.system || "",
            version: systemPrompt?.version || 1,
            created_at: systemPrompt?.created_at || new Date(0).toISOString(),
            updated_at: systemPrompt?.updated_at || new Date().toISOString(),
          },
          {
            id: userPrompt?.id || `usr-${def.id}`,
            type: "user",
            content: userPrompt?.content || sysDefaults?.user || "",
            version: userPrompt?.version || 1,
            created_at: userPrompt?.created_at || new Date(0).toISOString(),
            updated_at: userPrompt?.updated_at || new Date().toISOString(),
          },
        ],
        // Attach pipeline config for content system only
        ...(def.id === "content" ? { pipeline_config: DEFAULT_CONTENT_PIPELINE_CONFIG } : {}),
        created_at: new Date(0).toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    return NextResponse.json({ systems })
  } catch (error) {
    console.error("[Agent Config API]", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load agent systems",
      },
      { status: 500 }
    )
  }
}
