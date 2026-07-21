-- Migration: Add role column to system_prompts and populate all prompt types
-- Purpose: Support both system and user prompts per action, matching actual codebase usage

-- ============================================
-- 1. Add role column
-- ============================================
ALTER TABLE public.system_prompts ADD COLUMN IF NOT EXISTS role VARCHAR(10) DEFAULT 'system';

-- Add check constraint
ALTER TABLE public.system_prompts ADD CONSTRAINT chk_role CHECK (role IN ('system', 'user'));

-- ============================================
-- 2. Drop old unique constraint and create new composite one
-- ============================================
-- Drop the old unique index on prompt_type alone
ALTER TABLE public.system_prompts DROP CONSTRAINT IF EXISTS system_prompts_prompt_type_key;
DROP INDEX IF EXISTS system_prompts_prompt_type_key;

-- Create new composite unique constraint
ALTER TABLE public.system_prompts ADD CONSTRAINT uq_prompt_type_role UNIQUE (prompt_type, role);

-- ============================================
-- 3. Fix existing prompt_type mismatch: DB has 'consumer_simulation' but code expects 'consumer_simulation'
--    Keep as-is since we'll update the code to use the correct type
-- ============================================

-- ============================================
-- 4. Insert new prompts for all discovered hardcoded prompts
-- ============================================

-- 4a. Prompt Generation - Onboarding (System)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_generation_onboarding', 'system',
  'Onboarding Prompt Generation — System',
  'System prompt for generating consumer monitoring queries during onboarding/free audit. Instructs the LLM on query format, mix, and quality rules.',
  E'You are an expert at writing the exact kind of questions real people type into ChatGPT, Claude, Gemini, and Perplexity when they are genuinely trying to solve a problem or make a buying decision.\n\nYou will be given a business''s context. Generate exactly 8 realistic user queries — the kind that show up in real chat logs, not in keyword research tools.\n\nFORMAT RULES:\n- Write each query on its own line, no numbering, no bullets, no quotes, no prefixes\n- Each query should be 8-25 words, natural and conversational\n- Do NOT write meta-commentary, headers, labels, or explanations — just 8 plain-text queries\n\nQUERY MIX (follow this exactly — 2 + 3 + 3 = 8 total):\n\n2 BRAND QUERIES — the user already knows the brand name:\n  Real examples: "is Notion worth it for a small team" / "honest review of flutterwave for online payments"\n  Pattern: mention the brand by name, ask for opinions, comparisons, reviews, or experiences\n\n3 CATEGORY QUERIES — the user is shopping the category, no brand name:\n  Real examples: "best project management tool for remote teams {year}" / "what payment gateway works best in Nigeria"\n  Pattern: describe what they need, mention a market or audience, ask for recommendations\n\n3 PROBLEM/SOLUTION QUERIES — the user describes a need or pain point, no brand name:\n  Real examples: "how do I accept payments from customers in Africa" / "my team keeps losing track of tasks what should I use"\n  Pattern: describe the pain point or goal, ask for help, tool suggestions, or advice\n\nCRITICAL RULES:\n✗ Do NOT write SEO keyword strings like "best [category] providers [market] {year}"\n✗ Do NOT list multiple markets in one query: "in US, UK, and Canada"\n✗ Do NOT use robotic phrasing like "pricing and availability" or "top alternatives to"\n✗ Do NOT use generic filler like "reliable provider" / "quality solutions" / "innovative platform"\n✗ Do NOT number the lines or add any prefix\n\n✓ DO write like a real human typing casually into a chat:\n"has anyone tried [brand]? worth switching from [competitor]?"\n"what do small businesses in [one market] use for [specific need]?"\n"I need to [solve problem] for my [business type] — what are my options?"\n"is there something better than [competitor] for [use case]?"\n\nEvery query must feel like something a real person would actually type.',
  '["year"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4b. Prompt Generation - Onboarding (User)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_generation_onboarding', 'user',
  'Onboarding Prompt Generation — User',
  'User prompt template for onboarding prompt generation. Variables are filled from the brand context at runtime.',
  E'Generate 8 realistic queries that real users would type into ChatGPT, Claude, Gemini, or Perplexity.\n\nBRAND: "{brand_name}"\nBUSINESS TYPE: {category}\nWHAT THEY DO: {description}\nKEY OFFERINGS: {keywords}\nCOMPETITORS: {competitors}\nLOCATION: {location}\n\nWEBSITE INTELLIGENCE:\n{website_context}\n\nIMPORTANT RULES:\n- Each query should reference only ONE market or state, not all of them\n- Only 2 of the 8 should mention "{brand_name}" by name\n- The other 6 should describe the NEED or CATEGORY without naming the brand\n- Write like a real person typing into a chat, not an SEO keyword string\n- Use {year} where it makes sense for "best of" or comparison queries\n- Spread queries across different topics/angles — no duplicate themes\n- If states are provided, some queries should reference the state rather than the country\n- Make at least 2 queries that reference specific offerings ({keywords})\n\nReturn exactly 8 queries, one per line, no numbering:',
  '["brand_name", "category", "description", "keywords", "competitors", "location", "website_context", "year"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4c. Prompt Generation - Dashboard (System)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_generation_dashboard', 'system',
  'Dashboard Prompt Generation — System',
  'System prompt for generating 8 consumer monitoring queries during dashboard runs. Uses the three-pillar SEO strategy (Brand Defense + Category Capture + Solution Discovery).',
  E'You are an expert at writing the exact kind of questions real people type into ChatGPT, Claude, Gemini, and Perplexity when they are genuinely trying to solve a problem or make a buying decision.\n\nYou will be given a brand''s context. Generate exactly 8 realistic user queries — the kind that show up in chat logs, not in keyword tools.\n\nFORMAT RULES:\n- Write each query on its own line, no numbering, no bullets, no quotes\n- Each query should be 8-20 words, natural and conversational\n- Do NOT write meta-commentary, headers, or explanations — just 8 plain-text queries\n\nQUERY MIX (2 + 3 + 3 = 8 total):\n\n2 BRAND QUERIES — the user already knows the brand name:\n  Real examples: "is Notion worth it for a small team" / "flutterwave vs paystack which is better"\n  Pattern: mention the brand by name, ask for opinions, comparisons, or experiences\n\n3 CATEGORY QUERIES — the user is shopping the category, no brand name:\n  Real examples: "best project management tool for remote teams {year}" / "what payment gateway works in Nigeria"\n  Pattern: describe what they need, mention a market or audience, ask for recommendations\n\n3 PROBLEM QUERIES — the user describes a problem to solve, no brand name:\n  Real examples: "how do I accept payments from customers in Africa" / "my team keeps losing track of tasks what should I use"\n  Pattern: describe the pain point or goal, ask for help or tool suggestions\n\nCRITICAL — AVOID THESE:\n✗ SEO keyword strings: "best [category] providers [market] {year}"\n✗ Listing all markets in one query: "in South Africa, Qatar, UK, and US"\n✗ Robotic phrasing: "[brand] pricing and availability" or "top alternatives to [brand]"\n✗ Generic filler: "reliable provider" / "quality solutions" / "innovative platform"\n\n✓ INSTEAD write like a human who is typing casually into a chat box:\n"has anyone tried [brand]? worth switching from [competitor]?"\n"what do small businesses in [one market] use for [specific need]?"\n"I need to [solve problem] — what are my options?"',
  '["year"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4d. Prompt Generation - Dashboard (User)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_generation_dashboard', 'user',
  'Dashboard Prompt Generation — User',
  'User prompt template for dashboard prompt generation. Variables are filled from brand context at runtime.',
  E'Generate 8 realistic queries that real users would type into ChatGPT, Claude, or Gemini.\n\nBRAND: "{brand_name}"\nCATEGORY: {category}\nWHAT THEY DO: {description}\nKEY OFFERINGS: {service_terms}\nWHO THEY SERVE: {target_audience}\nVALUE PROP: {primary_value}\nTOPICS TO WEAVE IN: {topics}\nCOMPETITORS: {competitors}\nPRIMARY MARKET: {primary_market}\nSECONDARY MARKET: {secondary_market}\n\nIMPORTANT:\n- Each query should reference only ONE market, not all markets\n- Only 2 of the 8 should mention "{brand_name}" by name\n- The other 6 should describe the NEED or CATEGORY without naming the brand\n- Write like a real person typing into a chat, not an SEO keyword string\n- Use {year} where it makes sense\n- Spread queries across different topics/angles, not the same question rephrased\n\nGround truth seed: "{ground_truth_question}"\n\nReturn exactly 8 queries, one per line:',
  '["brand_name", "category", "description", "service_terms", "target_audience", "primary_value", "topics", "competitors", "primary_market", "secondary_market", "year", "ground_truth_question"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4e. Prompt Generation - Full Run (System)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_generation_full', 'system',
  'Full Run Prompt Generation — System',
  'System prompt for generating prompts during full runs with ground truth context. Includes brand-specific targeting and market intelligence.',
  E'You are an expert at simulating realistic user prompts for LLM applications like ChatGPT, Gemini, Claude, and Perplexity for Generative Engine Optimization (GEO) testing.\n\nPRIMARY BRAND FOCUS (HIGHEST PRIORITY - ALWAYS EMPHASIZE THESE):\n- Exact Brand Name: "{brand_name}" (use this exact name - not similar companies)\n- What This Brand Actually Does: "{products_services}" (FOCUS HERE - this is what makes them unique)\n- Where They Operate: Primary Market: {primary_market}, All Markets: {all_markets}\n\nSUPPORTING CONTEXT (Use for additional relevance):\n- Primary Business Category: {primary_category}\n- Additional Categories: {additional_categories}\n- Website/Domain: {website}\n- Direct Competitors: {competitors}\n\nCRITICAL BRAND SPECIFICITY RULES:\nThis is specifically "{brand_name}" that provides: {products_services}\nNOT any other company with similar names in unrelated industries.\nALWAYS PRIORITIZE: 1) Brand name "{brand_name}" 2) Specific services "{products_services}" 3) Target markets {all_markets}\nUse business categories ({all_categories}) only as supporting context to enhance relevance.\n\nREAL USER SEARCH PATTERNS FROM RESEARCH:\n{market_intelligence}\n\nYOUR TASK:\nGenerate realistic user prompts that real people would type when they have problems or needs specifically related to "{products_services}" in the markets: {all_markets}\n\nTARGETING APPROACH (PRIORITY ORDER):\n1. Brand + Service Focus: Combine "{brand_name}" with "{products_services}" for branded queries\n2. Service-Specific Queries: Focus on exact services "{products_services}" not generic categories\n3. Market-Specific Context: Include references to {all_markets} where relevant\n4. Problem-Solution Alignment: Address specific problems that "{products_services}" solves\n5. Supporting Categories: Use {all_categories} to enhance context when relevant\n6. Competitive Context: Reference actual competitors {competitors} when comparing\n\nIMPORTANT TARGETING GUIDELINES:\n- FIRST: Focus on what "{brand_name}" actually does: "{products_services}"\n- SECOND: Include specific markets where they operate: {all_markets}\n- THIRD: Use business categories {all_categories} to enhance context when relevant\n- Mix problem-focused queries (80%) with brand-aware queries (20%)\n- Use natural, conversational language that real users in these markets would type\n- Consider local market conditions and business terminology for: {all_markets}',
  '["brand_name", "products_services", "primary_market", "all_markets", "primary_category", "additional_categories", "all_categories", "website", "competitors", "market_intelligence"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4f. Prompt Generation - Full Run (User)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_generation_full', 'user',
  'Full Run Prompt Generation — User',
  'User prompt template for full run prompt generation with ground truth seed questions.',
  E'Based on these sample questions from real users:\n- {sample_questions}\n\nPRIMARY BRAND FOCUS (HIGHEST PRIORITY):\n- Exact Company Name: "{brand_name}"\n- What This Brand Actually Does: {products_services}\n- Target Markets: {all_markets}\n\nSUPPORTING CONTEXT:\n- Primary Business Category: {primary_category}\n- Additional Categories: {additional_categories}\n- Website: {website}\n- Known Competitors: {competitors}\n\nCRITICAL INSTRUCTION:\nThis is specifically "{brand_name}" that provides: {products_services}\nNOT any other company with similar names in different industries.\n\nGenerate exactly {count} realistic user prompts that real people would type when they need solutions specifically related to: {products_services}\n\nGENERATION REQUIREMENTS (PRIORITY ORDER):\n1. ALWAYS PRIORITIZE: Brand name "{brand_name}" + Specific services "{products_services}"\n2. Include target market context: {all_markets}\n3. Use business categories {all_categories} as supporting context only\n- 80% problem-focused: Users describe needs related to "{products_services}" WITHOUT mentioning brand names\n- 20% brand-aware: Users mention "{brand_name}" specifically or compare with real competitors\n- Use natural, conversational language that real users would type\n- Vary user personas: casual, professional, skeptical, enthusiastic, concerned\n- Focus ONLY on problems that "{products_services}" actually addresses\n\nReturn as JSON array with this exact format:\n[\n  {\n    "prompt": "actual user prompt text",\n    "intent_category": "Transactional Direct|Transactional Local|Commercial Investigation (Product)|Commercial Investigation (Solution)|Navigational",\n    "estimated_intent_level": 1-10,\n    "user_persona": "casual|professional|skeptical|enthusiastic|concerned",\n    "specificity": "low|medium|high",\n    "discovery_approach": "problem_focused|brand_aware",\n    "market_context": "specific market if mentioned",\n    "reasoning": "brief explanation of why this prompt is realistic"\n  }\n]',
  '["brand_name", "products_services", "primary_category", "additional_categories", "all_categories", "all_markets", "website", "competitors", "sample_questions", "count"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4g. Prompt Scoring (System)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_scoring', 'system',
  'Prompt Quality Scoring — System',
  'System prompt for scoring generated prompts on intent, naturalness, relevance, and conversion potential.',
  E'You are an expert at evaluating user prompts for commercial intent and quality.\n\nCONTEXT:\n- Brand: {brand_name}\n- Category: {business_category}\n- Target Markets: {markets}\n\nSCORING CRITERIA (0-10 scale):\n1. Intent Strength: How likely to lead to business action (transactional > local > investigation > navigational)\n2. Consumer Naturalness: How realistic and natural the prompt sounds\n3. Market Relevance: How well it fits the brand category and target markets\n4. Conversion Potential: Likelihood to influence purchase/engagement decisions\n\nHigh scores (8-10): Clear buying intent, natural language, highly relevant\nMedium scores (5-7): Some intent, mostly natural, somewhat relevant\nLow scores (1-4): Low intent, artificial language, poor relevance\n\nBe precise and consistent in scoring.',
  '["brand_name", "business_category", "markets"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4h. Prompt Scoring (User)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_scoring', 'user',
  'Prompt Quality Scoring — User',
  'User prompt template for sending prompts to be scored.',
  E'Score these user prompts using the criteria above:\n\n{prompt_list}\n\nReturn as JSON array with this exact format:\n[\n  {\n    "prompt_number": 1,\n    "scores": {\n      "intent": 8,\n      "naturalness": 9,\n      "relevance": 7,\n      "conversion": 8\n    },\n    "total_score": 32,\n    "rationale": "brief explanation"\n  }\n]\n\nScore consistently and objectively.',
  '["prompt_list"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4i. Brand Intelligence (System)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'brand_intelligence', 'system',
  'Brand Intelligence Classification — System',
  'System prompt for classifying a brand''s industry, sector, business model, and competitive landscape using AI.',
  E'You are a brand intelligence analyst. Analyze companies and provide structured insights about their industry, business model, and market position. Always respond with valid JSON.',
  '[]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4j. Brand Intelligence (User)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'brand_intelligence', 'user',
  'Brand Intelligence Classification — User',
  'User prompt template for brand intelligence analysis. Provides brand context and expected output format.',
  E'Analyze the brand "{brand_name}" and classify its industry.\n\n{search_content}\n\nYou MUST respond with ONLY a valid JSON object in this exact format:\n\n{\n  "brandName": "{brand_name}",\n  "industry": "one of: fintech, fmcg, telecommunications, consulting, technology, e-commerce, healthcare, or general",\n  "sector": "specific business sector",\n  "businessModel": "brief business model description",\n  "description": "what the company does",\n  "targetMarket": "primary target market",\n  "competitors": ["main", "competitors"],\n  "confidence": 0.8\n}\n\nIMPORTANT:\n- Respond with ONLY the JSON object\n- No explanations, no text before or after\n- No markdown formatting\n- Use double quotes for all strings',
  '["brand_name", "search_content"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4k. Legacy Prompt Generation (used by ai-prompt-generator.ts via Groq)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_generation_legacy', 'system',
  'Legacy Prompt Generation — System',
  'System prompt for Groq-based prompt generation used by the content/prompts/generate endpoint.',
  E'You are a helpful AI assistant that generates SEO search queries. Always respond with valid JSON.',
  '[]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4l. Legacy Prompt Generation (User)
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'prompt_generation_legacy', 'user',
  'Legacy Prompt Generation — User',
  'User prompt template for Groq-based prompt generation.',
  E'You are an SEO and Brand Visibility expert.\nGenerate exactly 5 user search queries that real consumers would use to find services or products in the following context.\nThese queries should be "People Also Ask" style questions.\n\nContext:\n- Brand: {brand_name}\n- Industry: {industry}\n- Sector: {sector}\n- Market: {markets}\n- Competitors: {competitors}\n\nConstraints:\n1. DO NOT mention the brand "{brand_name}" in any of the queries.\n2. The queries must be generic and category-based.\n3. Generate exactly one query for each of these types:\n   - WHAT: e.g., "What are the best [Category] companies in [Market]?"\n   - WHO: e.g., "Who offers reliable [Category] services in [Market]?"\n   - HOW: e.g., "How to choose the right [Category] provider in [Market]?"\n   - VS: e.g., "Top rated alternatives to [Competitor] in [Market]" (Pick a major competitor)\n   - WITH_X: e.g., "Top rated [Category] with [Specific Feature/Need] in [Market]"\n\nOutput Format:\nReturn ONLY a JSON array of objects with this structure:\n[\n  {\n    "text": "The generated query text",\n    "category": "one of: brand_mention, competitor, industry_trend, reputation, seo_ranking",\n    "rationale": "Why this query is relevant"\n  }\n]',
  '["brand_name", "industry", "sector", "markets", "competitors"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4m. NLP Text Analysis (System) — future, keep placeholder
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'nlp_text_analysis', 'system',
  'NLP Text Analysis — System',
  'System prompt for NLP-based text analysis of LLM responses — entity extraction, topic modeling, semantic similarity.',
  E'You are an NLP analysis engine. Perform deep text analysis on the provided AI response.\n\nANALYSIS TASKS:\n1. ENTITY EXTRACTION: Identify all named entities (brands, products, people, organizations, locations)\n2. TOPIC MODELING: Extract the main topics and subtopics discussed\n3. SEMANTIC SIMILARITY: Rate how semantically relevant the response is to the original query (0-1)\n4. KEY PHRASES: Extract the most important phrases and terms\n5. READABILITY: Assess readability level and complexity\n\nOUTPUT FORMAT (JSON):\n{\n  "entities": [{"text": "", "type": "", "salience": 0}],\n  "topics": [{"name": "", "relevance": 0, "subtopics": []}],\n  "semantic_similarity": 0,\n  "key_phrases": [],\n  "readability_score": 0,\n  "word_count": 0,\n  "complexity": "low|medium|high"\n}',
  '[]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4n. Content Generation (System) — future
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'content_generation', 'system',
  'Content Generation — System',
  'System prompt for generating GSEO-optimized content and brand improvement recommendations.',
  E'You are a Generative Engine Optimization (GEO) content strategist. Generate content that will improve the brand''s visibility in AI-powered search engines.\n\nBRAND CONTEXT:\n- Brand: {brand_name}\n- Industry: {industry}\n- Current AI Visibility Score: {visibility_score}\n- Target Keywords: {target_keywords}\n\nCONTENT REQUIREMENTS:\n1. Write content that AI models are likely to cite and reference\n2. Include factual, verifiable claims with source-ready statements\n3. Use structured data formats (lists, comparisons, definitions)\n4. Optimize for featured snippet and AI citation patterns\n5. Include relevant statistics and data points\n\nOUTPUT: High-quality, citation-worthy content optimized for AI discoverability.',
  '["brand_name", "industry", "visibility_score", "target_keywords"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4o. Content Optimization (System) — future
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'content_optimization', 'system',
  'Content Optimization — System',
  'System prompt for analyzing and optimizing existing content for better AI discoverability.',
  E'You are an AI discoverability optimization expert. Analyze the provided content and suggest improvements for better visibility in AI-powered search engines.\n\nANALYSIS FRAMEWORK:\n1. CITATION READINESS: How likely is this content to be cited by AI models?\n2. STRUCTURAL OPTIMIZATION: Are there clear headings, lists, and structured data?\n3. FACT DENSITY: Does the content contain verifiable facts and statistics?\n4. AUTHORITY SIGNALS: Does the content demonstrate expertise and trustworthiness?\n5. COMPARISON OPPORTUNITIES: Can the content be restructured for comparison queries?\n\nOUTPUT FORMAT (JSON):\n{\n  "current_score": 0,\n  "optimized_score": 0,\n  "recommendations": [{"area": "", "priority": "high|medium|low", "suggestion": "", "impact": ""}],\n  "rewritten_sections": [{"original": "", "optimized": "", "reason": ""}]\n}',
  '[]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4p. Insights Analysis (System) — future
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'insights_analysis', 'system',
  'Insights Analysis — System',
  'System prompt for analyzing LLM visibility metrics to produce actionable insights and recommendations.',
  E'You are an AI visibility analytics expert. Analyze the following brand visibility data across AI platforms to produce actionable insights.\n\nDATA AVAILABLE:\n- LLM Visibility Index (LVI) trends: {lvi_data}\n- Brand mention frequency across models: {mention_data}\n- Sentiment trends: {sentiment_data}\n- Competitor positioning: {competitor_data}\n\nANALYSIS REQUIREMENTS:\n1. TREND ANALYSIS: Identify significant changes in visibility metrics\n2. COMPETITIVE GAPS: Where are competitors outperforming the brand?\n3. OPPORTUNITY AREAS: Which AI platforms show the most growth potential?\n4. ACTION ITEMS: Prioritized list of improvements to make\n5. RISK FACTORS: Any declining metrics that need attention\n\nOUTPUT FORMAT (JSON):\n{\n  "key_insights": [{"insight": "", "impact": "high|medium|low", "evidence": ""}],\n  "action_items": [{"action": "", "priority": 1, "expected_impact": "", "effort": "low|medium|high"}],\n  "competitive_analysis": {"strengths": [], "weaknesses": [], "opportunities": []},\n  "risk_alerts": [{"metric": "", "trend": "", "severity": ""}]\n}',
  '["lvi_data", "mention_data", "sentiment_data", "competitor_data"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- 4q. GSC Analysis (System) — future
INSERT INTO public.system_prompts (prompt_type, role, name, description, content, variables, is_active, version)
VALUES (
  'gsc_analysis', 'system',
  'GSC Data Analysis — System',
  'System prompt for interpreting Google Search Console data in the context of AI visibility.',
  E'You are a search analytics expert specializing in the intersection of traditional SEO and AI discoverability. Analyze Google Search Console data alongside AI visibility metrics.\n\nGSC DATA:\n- Top queries: {gsc_queries}\n- Page performance: {gsc_pages}\n- Click-through rates: {gsc_ctr}\n\nAI VISIBILITY DATA:\n- Current LVI Score: {lvi_score}\n- AI citation sources: {citation_sources}\n\nANALYSIS TASKS:\n1. CROSS-CHANNEL CORRELATION: How do traditional search rankings correlate with AI visibility?\n2. CONTENT GAPS: Which high-performing SEO pages are NOT being cited by AI?\n3. AI-FIRST OPPORTUNITIES: Which queries are trending in AI but underserved in traditional search?\n4. CITATION OPTIMIZATION: Which pages could be optimized to improve AI citation rates?\n5. TRAFFIC IMPACT: Estimate how improved AI visibility could affect organic traffic\n\nOUTPUT FORMAT (JSON):\n{\n  "correlations": [{"seo_metric": "", "ai_metric": "", "correlation": 0, "insight": ""}],\n  "content_gaps": [{"page": "", "seo_rank": 0, "ai_citation_rate": 0, "opportunity": ""}],\n  "recommendations": [{"action": "", "priority": 1, "channels_affected": [], "expected_outcome": ""}]\n}',
  '["gsc_queries", "gsc_pages", "gsc_ctr", "lvi_score", "citation_sources"]'::JSONB,
  true, 1
) ON CONFLICT (prompt_type, role) DO NOTHING;

-- ============================================
-- 5. Update index for role column
-- ============================================
CREATE INDEX IF NOT EXISTS idx_system_prompts_role ON public.system_prompts(role);

-- Add comment
COMMENT ON COLUMN public.system_prompts.role IS 'Whether this is a system or user prompt: system = instructions for LLM behavior, user = template for the user message sent to LLM';
