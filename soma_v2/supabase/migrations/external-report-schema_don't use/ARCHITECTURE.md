# External Report Schema - Visual Architecture

## Table Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXISTING RAW DATA LAYER                          │
└─────────────────────────────────────────────────────────────────────────┘

    accounts                    brands                  competitors
    ┌────────┐                 ┌──────┐                ┌───────────┐
    │ id     │◄────────────────┤ id   │◄───────────────┤ id        │
    │ name   │                 │ name │                │ brand_id  │
    └────────┘                 └──────┘                │ name      │
                                   △                   └───────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
        llm_simulation_responses   │   user_prompts
        ┌────────────────────┐     │   ┌──────────┐
        │ id                 │     │   │ id       │
        │ brand_id           │─────┘   │ brand_id │
        │ prompt_id          │─────────┤ text     │
        │ raw_response       │         └──────────┘
        │ model_name         │
        └────────────────────┘
                 │
                 │ (analyzed by)
                 ▼
        ┌─────────────────────────────────────────────┐
        │         response_analysis                    │
        │  ┌────────────────────────────────────────┐ │
        │  │ id                                     │ │
        │  │ response_id (FK)                       │ │
        │  │ brand_id (FK)                          │ │
        │  │ primary_brand_mentions                 │ │
        │  │ primary_brand_sentiment                │ │
        │  │ llm_visibility_index                   │ │
        │  └────────────────────────────────────────┘ │
        │                                              │
        │  competitor_response_analysis                │
        │  ┌────────────────────────────────────────┐ │
        │  │ id                                     │ │
        │  │ response_id (FK)                       │ │
        │  │ competitor_id (FK)                     │ │
        │  │ competitor_mentions                    │ │
        │  │ sentiment                              │ │
        │  └────────────────────────────────────────┘ │
        └─────────────────────────────────────────────┘
                         │
                         │ (aggregated by helper functions)
                         ▼

┌─────────────────────────────────────────────────────────────────────────┐
│                      NEW AGGREGATED METRICS LAYER                        │
└─────────────────────────────────────────────────────────────────────────┘

    brand_performance_metrics (Overall Metrics)
    ┌───────────────────────────────────────────┐
    │ id                                        │
    │ brand_id (FK brands)                      │
    │ competitor_id (FK competitors, nullable)  │
    │ is_primary_brand (boolean)                │
    │ metric_period ('7d', '30d', '90d', 'all') │
    │                                           │
    │ # Core Metrics                            │
    │ mention_rate                              │
    │ avg_sentiment_score                       │
    │ avg_ranking_position                      │
    │ total_citations                           │
    │ lvi_score                                 │
    │ share_of_voice                            │
    │                                           │
    │ # Rankings                                │
    │ industry_rank                             │
    │ rank_change                               │
    │                                           │
    │ # Trends                                  │
    │ mention_rate_change                       │
    │ sentiment_change                          │
    │ lvi_change                                │
    └───────────────────────────────────────────┘
              │
              │ Used for: Stats Cards, Rankings Table
              │
              ▼
    ┌─────────────────────────────────┐
    │     REPORT COMPONENT:           │
    │  • 5 Stats Cards                │
    │  • Industry Rankings Table      │
    └─────────────────────────────────┘


    topic_brand_associations (Topic Heatmap Data)
    ┌───────────────────────────────────────────┐
    │ id                                        │
    │ brand_id (FK brands, nullable)            │
    │ competitor_id (FK competitors, nullable)  │
    │ brand_name                                │
    │ topic_name                                │
    │                                           │
    │ # Association Metrics                     │
    │ mention_count                             │
    │ co_occurrence_rate                        │
    │ relevance_score (0-100)                   │
    │ competitive_advantage_score               │
    │                                           │
    │ # Context                                 │
    │ avg_sentiment_when_mentioned              │
    │ shared_with_competitors[]                 │
    │ sample_contexts (JSONB)                   │
    └───────────────────────────────────────────┘
              │
              │ Used for: Brand-Topic Heatmap
              │
              ▼
    ┌─────────────────────────────────┐
    │     REPORT COMPONENT:           │
    │  • Brand-Topic Heatmap          │
    └─────────────────────────────────┘


    brand_metrics_timeseries (Trend Charts)
    ┌───────────────────────────────────────────┐
    │ id                                        │
    │ brand_id (FK brands)                      │
    │ competitor_id (FK competitors, nullable)  │
    │ snapshot_date (DATE)                      │
    │ time_granularity ('daily', 'hourly')      │
    │                                           │
    │ # Point-in-Time Metrics                   │
    │ lvi_score                                 │
    │ mention_rate                              │
    │ avg_sentiment                             │
    │ avg_ranking                               │
    │                                           │
    │ # Deltas                                  │
    │ lvi_delta                                 │
    │ mention_rate_delta                        │
    │ sentiment_delta                           │
    └───────────────────────────────────────────┘
              │
              │ Used for: Time-Series Charts
              │
              ▼
    ┌─────────────────────────────────┐
    │     REPORT COMPONENT:           │
    │  • LVI Trend Chart              │
    │  • Analytics Chart              │
    └─────────────────────────────────┘


    prompt_performance_analysis (Per-Prompt Analysis)
    ┌───────────────────────────────────────────┐
    │ id                                        │
    │ prompt_id (FK user_prompts)               │
    │ primary_brand_id (FK brands)              │
    │ prompt_text                               │
    │                                           │
    │ # Primary Brand Performance               │
    │ primary_brand_mentioned (boolean)         │
    │ primary_brand_mention_rate                │
    │ primary_brand_avg_position                │
    │ primary_brand_sentiment                   │
    │ primary_brand_lvi                         │
    │                                           │
    │ # Competitive Context                     │
    │ top_competitor_name                       │
    │ top_competitor_mentions                   │
    │ visibility_gap                            │
    │                                           │
    │ # Classification                          │
    │ is_opportunity (boolean)                  │
    │ is_strength (boolean)                     │
    │ is_threat (boolean)                       │
    │ opportunity_score (0-100)                 │
    │                                           │
    │ # Per-Model Breakdown                     │
    │ model_performance (JSONB)                 │
    └───────────────────────────────────────────┘
              │
              │ Used for: Prompt Analysis
              │
              ▼
    ┌─────────────────────────────────┐
    │     REPORT COMPONENT:           │
    │  • Prompt-by-Prompt Analysis    │
    │  • Opportunities/Threats        │
    └─────────────────────────────────┘


    citation_domain_analysis (Sources & Citations)
    ┌───────────────────────────────────────────┐
    │ id                                        │
    │ domain (e.g., 'techcrunch.com')           │
    │ domain_type ('your-brand', 'competitor',  │
    │              'industry', 'news-media')    │
    │                                           │
    │ # Usage Metrics                           │
    │ total_citations                           │
    │ unique_responses_citing                   │
    │ used_percentage                           │
    │ avg_citations_per_response                │
    │                                           │
    │ # Authority                               │
    │ trust_score                               │
    │ is_authoritative                          │
    │                                           │
    │ # Opportunities                           │
    │ is_target_publisher                       │
    │ partnership_opportunity_score             │
    │                                           │
    │ # Context                                 │
    │ associated_topics[]                       │
    │ associated_brands[]                       │
    └───────────────────────────────────────────┘
              │
              │ Used for: Citations Table
              │
              ▼
    ┌─────────────────────────────────┐
    │     REPORT COMPONENT:           │
    │  • Sources & Citations Table    │
    │  • Publisher Opportunities      │
    └─────────────────────────────────┘
```

## Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                   │
└──────────────────────────────────────────────────────────────────────┘

1. SIMULATION EXECUTION
   ┌─────────────┐
   │ User runs   │
   │ simulation  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────────┐
   │ llm_simulation_responses│  (raw responses stored)
   └──────┬──────────────────┘
          │
          │ (trigger/webhook)
          │
          ▼

2. RESPONSE ANALYSIS (Existing)
   ┌──────────────────────┐
   │ Analysis job runs    │
   │ - Extract mentions   │
   │ - Calculate metrics  │
   │ - Identify citations │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ response_analysis                    │
   │ competitor_response_analysis         │
   │ response_citations                   │
   │ topic_insights                       │
   └──────┬───────────────────────────────┘
          │
          │ (scheduled job or on-demand)
          │
          ▼

3. METRICS AGGREGATION (New)
   ┌─────────────────────────────────────┐
   │ refresh_external_report_metrics()   │
   │                                     │
   │ Calls:                              │
   │ • calculate_brand_performance_...() │
   │ • calculate_topic_brand_...()       │
   │ • calculate_prompt_performance()    │
   │ • calculate_citation_domain_...()   │
   └──────┬──────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ brand_performance_metrics            │
   │ topic_brand_associations             │
   │ brand_metrics_timeseries             │
   │ prompt_performance_analysis          │
   │ citation_domain_analysis             │
   └──────┬───────────────────────────────┘
          │
          │ (API query)
          │
          ▼

4. REPORT RENDERING
   ┌─────────────────────────────────────┐
   │ external-brand-visibility-report-   │
   │ v4.tsx                              │
   │                                     │
   │ Components:                          │
   │ • Header & Stats Cards              │
   │ • LVI Trend Chart                   │
   │ • Industry Rankings                 │
   │ • Topic Heatmap                     │
   │ • Prompt Analysis                   │
   │ • Citations Table                   │
   │ • Insights & Recommendations        │
   └─────────────────────────────────────┘
```

## Metric Calculation Flow

```
BRAND PERFORMANCE METRICS CALCULATION
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Input: response_analysis rows for brand                  │
│         competitor_response_analysis rows                 │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ For Primary Brand:                               │    │
│  │ • COUNT responses where brand mentioned          │    │
│  │ • AVG(sentiment)                                 │    │
│  │ • AVG(position)                                  │    │
│  │ • SUM(citations)                                 │    │
│  │ • Calculate LVI components                       │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ For Each Competitor:                             │    │
│  │ • COUNT competitor mentions                      │    │
│  │ • AVG(competitor_sentiment)                      │    │
│  │ • AVG(competitor_position)                       │    │
│  │ • Compare to primary brand                       │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  Output: One row per brand/competitor per period          │
│                                                            │
└────────────────────────────────────────────────────────────┘

TOPIC-BRAND ASSOCIATION CALCULATION
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Input: topic_insights rows                               │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Group by brand_name, topic_name                  │    │
│  │ • COUNT topic occurrences with brand             │    │
│  │ • Calculate co-occurrence rate                   │    │
│  │ • AVG(relevance_score)                           │    │
│  │ • Identify shared vs exclusive topics            │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  Output: Brand × Topic matrix with scores                 │
│                                                            │
└────────────────────────────────────────────────────────────┘

PROMPT PERFORMANCE CALCULATION
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Input: response_analysis + competitor_response_analysis  │
│         grouped by prompt_id                              │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ For each prompt:                                 │    │
│  │ • Did brand get mentioned?                       │    │
│  │ • How many competitors mentioned?                │    │
│  │ • Who ranked highest?                            │    │
│  │ • Calculate opportunity score                    │    │
│  │                                                  │    │
│  │ Classify:                                        │    │
│  │ • Opportunity: competitors yes, brand no         │    │
│  │ • Strength: brand dominates                      │    │
│  │ • Threat: competitors outperform                 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  Output: Per-prompt competitive analysis                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Query Pattern Examples

```
STATS CARDS QUERY PATTERN
┌────────────────────────────────────────────┐
│ SELECT mention_rate, avg_sentiment,       │
│        avg_ranking, total_citations, lvi  │
│ FROM brand_performance_metrics            │
│ WHERE brand_id = ? AND is_primary = true  │
│   AND period = '30d'                      │
└────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────┐
│ Returns single row with 5 metrics         │
└────────────────────────────────────────────┘

INDUSTRY RANKINGS QUERY PATTERN
┌────────────────────────────────────────────┐
│ SELECT brand_name, is_primary_brand,      │
│        industry_rank, mention_rate,       │
│        sentiment                          │
│ FROM brand_performance_metrics            │
│ WHERE account_id = ? AND period = '30d'   │
│ ORDER BY industry_rank                    │
└────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────┐
│ Returns all brands ranked competitively   │
└────────────────────────────────────────────┘

HEATMAP QUERY PATTERN
┌────────────────────────────────────────────┐
│ SELECT brand_name,                        │
│   jsonb_object_agg(topic, score) as topics│
│ FROM topic_brand_associations             │
│ WHERE account_id = ?                      │
│ GROUP BY brand_name                       │
└────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────┐
│ Returns brand × topic matrix             │
│ { "Brand A": {"seo": 85, "ai": 72}, ... }│
└────────────────────────────────────────────┘
```

## Indexing Strategy

```
PRIMARY INDEXES (All Tables)
┌───────────────────────────────────────┐
│ • id (PRIMARY KEY)                    │
│ • account_id (for RLS + filtering)    │
│ • brand_id / competitor_id (FK)       │
│ • simulation_id (FK, nullable)        │
│ • metric_period (for filtering)       │
│ • updated_at (for cache invalidation) │
└───────────────────────────────────────┘

SORT INDEXES (Performance Metrics)
┌───────────────────────────────────────┐
│ • lvi_score DESC                      │
│ • mention_rate DESC                   │
│ • industry_rank ASC                   │
│ • sentiment DESC                      │
└───────────────────────────────────────┘

JSONB INDEXES (GIN for Contains Queries)
┌───────────────────────────────────────┐
│ • model_performance                   │
│ • topic_relevance                     │
│ • sample_contexts                     │
│ • associated_topics                   │
└───────────────────────────────────────┘

COMPOSITE INDEXES (Common Filters)
┌───────────────────────────────────────┐
│ • (account_id, brand_id, period)      │
│ • (brand_id, is_primary_brand)        │
│ • (account_id, metric_period, updated)│
└───────────────────────────────────────┘
```

## Time Dimension Strategy

```
METRIC PERIODS
┌─────────────────────────────────────────────────────┐
│                                                     │
│  '7d'   ←  Last 7 days    (Weekly trends)          │
│  '30d'  ←  Last 30 days   (Monthly reports)  ✓     │
│  '90d'  ←  Last 90 days   (Quarterly analysis)     │
│  'all'  ←  All time       (Historical baseline)    │
│                                                     │
│  Default: '30d' (Most common use case)              │
│                                                     │
└─────────────────────────────────────────────────────┘

TIMESERIES GRANULARITY
┌─────────────────────────────────────────────────────┐
│                                                     │
│  'hourly'  ←  For real-time monitoring             │
│  'daily'   ←  For trend charts            ✓        │
│  'weekly'  ←  For long-term analysis               │
│                                                     │
│  Default: 'daily' (Balance detail vs volume)       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

This visual architecture document provides a clear understanding of how all the tables relate to each other and how data flows through the system.
