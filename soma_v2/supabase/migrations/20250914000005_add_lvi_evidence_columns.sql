-- Migration: Add LVI Evidence Columns to geo_analyses
-- Date: 2025-09-14
-- Description: Enhance geo_analyses table with comprehensive LVI scoring evidence

BEGIN;

-- ============================================
-- CORE LVI METRICS & EVIDENCE COLUMNS
-- ============================================

-- Add core LVI score and component breakdown
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS lvi_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lvi_components JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lvi_weights JSONB DEFAULT '{"mention_frequency":0.30,"position_quality":0.25,"citation_authority":0.20,"sentiment_quality":0.15,"platform_coverage":0.05,"competitive_position":0.05}';

-- Response structure metrics for normalization
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS total_words INTEGER,
  ADD COLUMN IF NOT EXISTS total_sentences INTEGER,
  ADD COLUMN IF NOT EXISTS total_paragraphs INTEGER,
  ADD COLUMN IF NOT EXISTS total_lists INTEGER DEFAULT 0;

-- ============================================
-- MENTION FREQUENCY EVIDENCE (30% of LVI)
-- ============================================
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS mention_frequency_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mention_frequency_evidence JSONB DEFAULT '{}';

-- Brand mention tracking with positions
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS brand_mentions_raw JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS brand_mention_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brand_word_positions INTEGER[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_sentence_indices INTEGER[] DEFAULT '{}';

-- Expected vs actual mention calculation
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS query_relevance_score DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS query_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS expected_mentions_value DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS actual_vs_expected_ratio DECIMAL(5,2);

-- ============================================
-- POSITION QUALITY EVIDENCE (25% of LVI)
-- ============================================
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS position_quality_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_quality_evidence JSONB DEFAULT '{}';

-- Detailed position tracking
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS first_mention_word_position INTEGER,
  ADD COLUMN IF NOT EXISTS first_mention_sentence INTEGER,
  ADD COLUMN IF NOT EXISTS first_mention_paragraph INTEGER;

-- Section-based mention distribution
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS mentions_by_section JSONB DEFAULT '{"title":0,"introduction":0,"early_body":0,"mid_body":0,"late_body":0,"conclusion":0}';

-- Critical: List/ranking appearances for competitive analysis
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS list_appearances JSONB DEFAULT '[]';

-- ============================================
-- CITATION AUTHORITY EVIDENCE (20% of LVI)
-- ============================================
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS citation_authority_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS citation_authority_evidence JSONB DEFAULT '{}';

-- Detailed citation tracking
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS citations_raw JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS total_citations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brand_citations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS citation_domains TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_citation_domains TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avg_citation_authority DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS brand_citation_authority DECIMAL(5,2);

-- ============================================
-- SENTIMENT QUALITY EVIDENCE (15% of LVI)
-- ============================================
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS sentiment_quality_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sentiment_quality_evidence JSONB DEFAULT '{}';

-- Granular sentiment tracking
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS sentiment_analysis JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_sentiment_scores DECIMAL(3,2)[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avg_brand_sentiment DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS avg_competitor_sentiment DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS sentiment_differential DECIMAL(3,2);

-- ============================================
-- PLATFORM COVERAGE EVIDENCE (5% of LVI)
-- ============================================
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS platform_coverage_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS platform_coverage_evidence JSONB DEFAULT '{}';

-- ============================================
-- COMPETITIVE POSITION EVIDENCE (5% of LVI)
-- ============================================
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS competitive_position_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS competitive_position_evidence JSONB DEFAULT '{}';

-- Comprehensive competitive tracking
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS all_brands_mentioned JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_brand_mentions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_brands_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS competitor_names TEXT[] DEFAULT '{}';

-- Head-to-head comparison tracking
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS competitive_comparisons JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS direct_comparisons_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comparisons_won INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comparisons_lost INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comparisons_tied INTEGER DEFAULT 0;

-- Share of voice metrics
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS brand_mention_percentage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS rank_in_response INTEGER;

-- ============================================
-- ADDITIONAL INSIGHT COLUMNS
-- ============================================

-- Content quality metrics
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS avg_mention_context_length INTEGER,
  ADD COLUMN IF NOT EXISTS feature_mentions_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS use_case_mentions_count INTEGER DEFAULT 0;

-- Response quality indicators
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS response_completeness_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS response_accuracy_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS response_relevance_score DECIMAL(5,2);

-- Discovery and optimization
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS discovered_brands TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS missing_expected_brands TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS needs_improvement BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS improvement_areas TEXT[] DEFAULT '{}';

-- Analysis metadata and quality control
ALTER TABLE geo_analyses 
  ADD COLUMN IF NOT EXISTS analysis_errors JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS analysis_version VARCHAR(20) DEFAULT '2.0.0',
  ADD COLUMN IF NOT EXISTS algorithm_version VARCHAR(20) DEFAULT '2.0.0';

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Core LVI indexes
DROP INDEX IF EXISTS idx_geo_analyses_lvi_score;
CREATE INDEX idx_geo_analyses_lvi_score ON geo_analyses(lvi_score DESC);

-- Component score indexes
DROP INDEX IF EXISTS idx_geo_analyses_mention_freq;
CREATE INDEX idx_geo_analyses_mention_freq ON geo_analyses(mention_frequency_score DESC);

DROP INDEX IF EXISTS idx_geo_analyses_position_qual;
CREATE INDEX idx_geo_analyses_position_qual ON geo_analyses(position_quality_score DESC);

DROP INDEX IF EXISTS idx_geo_analyses_citation_auth;
CREATE INDEX idx_geo_analyses_citation_auth ON geo_analyses(citation_authority_score DESC);

DROP INDEX IF EXISTS idx_geo_analyses_sentiment_qual;
CREATE INDEX idx_geo_analyses_sentiment_qual ON geo_analyses(sentiment_quality_score DESC);

DROP INDEX IF EXISTS idx_geo_analyses_competitive_pos;
CREATE INDEX idx_geo_analyses_competitive_pos ON geo_analyses(competitive_position_score DESC);

-- Brand analysis indexes
DROP INDEX IF EXISTS idx_geo_analyses_brand_mentions;
CREATE INDEX idx_geo_analyses_brand_mentions ON geo_analyses(brand_mention_count DESC);

DROP INDEX IF EXISTS idx_geo_analyses_competitors;
CREATE INDEX idx_geo_analyses_competitors ON geo_analyses USING GIN(competitor_names);

DROP INDEX IF EXISTS idx_geo_analyses_all_brands;
CREATE INDEX idx_geo_analyses_all_brands ON geo_analyses USING GIN(all_brands_mentioned);

-- Evidence search indexes
DROP INDEX IF EXISTS idx_geo_analyses_evidence_gin;
CREATE INDEX idx_geo_analyses_evidence_gin ON geo_analyses USING GIN(
  (mention_frequency_evidence || position_quality_evidence || citation_authority_evidence || sentiment_quality_evidence || competitive_position_evidence)
);

-- Quality and filtering indexes
DROP INDEX IF EXISTS idx_geo_analyses_confidence;
CREATE INDEX idx_geo_analyses_confidence ON geo_analyses(confidence_score DESC);

DROP INDEX IF EXISTS idx_geo_analyses_needs_improvement;
CREATE INDEX idx_geo_analyses_needs_improvement ON geo_analyses(needs_improvement);

-- Query performance indexes
DROP INDEX IF EXISTS idx_geo_analyses_brand_model_score;
CREATE INDEX idx_geo_analyses_brand_model_score ON geo_analyses(brand_id, model_name, lvi_score DESC);

DROP INDEX IF EXISTS idx_geo_analyses_sim_brand_score;
CREATE INDEX idx_geo_analyses_sim_brand_score ON geo_analyses(simulation_id, brand_id, lvi_score DESC);

-- ============================================
-- COLUMN DOCUMENTATION
-- ============================================

-- Core LVI documentation
COMMENT ON COLUMN geo_analyses.lvi_score IS 'Final LLM Visibility Index score (0-100) - weighted combination of all 6 components';
COMMENT ON COLUMN geo_analyses.lvi_components IS 'Breakdown of individual component scores: {mention_frequency, position_quality, citation_authority, sentiment_quality, platform_coverage, competitive_position}';
COMMENT ON COLUMN geo_analyses.lvi_weights IS 'Weights used in LVI calculation for reproducibility and auditability';

-- Mention Frequency documentation
COMMENT ON COLUMN geo_analyses.mention_frequency_score IS 'Mention Frequency component score (30% of LVI) - measures if brand appears when expected';
COMMENT ON COLUMN geo_analyses.mention_frequency_evidence IS 'Complete evidence for mention frequency calculation: {actual_mentions, expected_mentions, calculation, ratio, query_type_multiplier}';
COMMENT ON COLUMN geo_analyses.brand_mentions_raw IS 'Detailed data for each brand mention: [{text, word_position, sentence_index, paragraph_index, character_position, context_before, context_after, in_list, list_position, mention_type}]';

-- Position Quality documentation
COMMENT ON COLUMN geo_analyses.position_quality_score IS 'Position Quality component score (25% of LVI) - earlier positions are more valuable';
COMMENT ON COLUMN geo_analyses.position_quality_evidence IS 'Complete evidence for position calculation: {section_distribution, weighted_position_score, list_bonus, calculation, first_mention_percentile}';
COMMENT ON COLUMN geo_analyses.list_appearances IS 'Critical competitive data - tracks when brands appear in ranked lists: [{list_type, list_topic, our_position, total_items, brands_in_list}]';

-- Citation Authority documentation
COMMENT ON COLUMN geo_analyses.citation_authority_score IS 'Citation Authority component score (20% of LVI) - measures trust through citations';
COMMENT ON COLUMN geo_analyses.citation_authority_evidence IS 'Complete evidence for citation scoring: {brand_citations, total_citations, citation_rate, avg_authority, brand_source_cited, calculation}';
COMMENT ON COLUMN geo_analyses.citations_raw IS 'Detailed citation data: [{url, domain, is_brand_source, authority_score, citation_context, relevance_score}]';

-- Sentiment Quality documentation
COMMENT ON COLUMN geo_analyses.sentiment_quality_score IS 'Sentiment Quality component score (15% of LVI) - quality of brand mentions';
COMMENT ON COLUMN geo_analyses.sentiment_quality_evidence IS 'Complete evidence for sentiment scoring: {avg_sentiment, sentiment_category, base_score, competitive_bonus, calculation}';
COMMENT ON COLUMN geo_analyses.sentiment_analysis IS 'Granular sentiment data: {overall_response_sentiment, brand_mention_sentiments, competitor_sentiments, comparative_sentiment}';

-- Competitive Position documentation
COMMENT ON COLUMN geo_analyses.competitive_position_score IS 'Competitive Position component score (5% of LVI) - win rate in direct comparisons';
COMMENT ON COLUMN geo_analyses.competitive_position_evidence IS 'Complete evidence for competitive scoring: {share_of_voice, rank_in_response, total_brands, win_rate, calculation}';
COMMENT ON COLUMN geo_analyses.all_brands_mentioned IS 'ALL brands detected in response for cross-analysis: {brand_name: {count, positions, list_positions, first_position, sentiment_sum, is_primary/competitor/discovered}}';

-- Platform Coverage documentation
COMMENT ON COLUMN geo_analyses.platform_coverage_score IS 'Platform Coverage component score (5% of LVI) - computed at brand level across models';
COMMENT ON COLUMN geo_analyses.platform_coverage_evidence IS 'Platform presence data: {provider, model_name, platform_presence, simulation_models_count, platform_coverage_score}';

-- Analysis quality documentation
COMMENT ON COLUMN geo_analyses.confidence_score IS 'Confidence in analysis accuracy (0.0-1.0) - flags low-quality extractions';
COMMENT ON COLUMN geo_analyses.analysis_errors IS 'Any errors encountered during analysis for debugging';
COMMENT ON COLUMN geo_analyses.discovered_brands IS 'New brands found that were not in original competitor list';
COMMENT ON COLUMN geo_analyses.needs_improvement IS 'Flag indicating this response shows areas needing optimization';

COMMIT;