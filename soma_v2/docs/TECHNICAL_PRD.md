# Soma GEO Platform - Technical PRD

## Overview

Soma is a Generative Engine Optimization (GEO) platform that helps brands optimize their visibility across AI language models. The platform uses multiple LLMs through Groq's API, with a multi-tenant architecture built on Next.js 15 and Supabase.

## Core Metrics

### LLM Visibility Index (LVI)
Weighted formula for measuring brand visibility:
```typescript
LVI = (indirect_coverage * 0.25) +     // Discovery performance
      (position_quality * 0.25) +      // Placement quality  
      (citation_authority * 0.20) +    // Source authority
      (sentiment_quality * 0.15) +     // Brand sentiment
      (direct_mentions * 0.10) +       // Branded performance
      (competitive_position * 0.05)    // Competitive ranking
```

### Key Components

1. **Ground Truth Collection**
- No LLM processing at this stage
- Collects real-world user queries 
- Sources: Google PAA, Reddit, Quora, Forums
- Quality scoring based on relevance criteria

2. **Query Classification** 
Intent categories ranked by commercial value:
| Rank | Category | Description | Key Indicators |
|------|-----------|-------------|----------------|
| 1 | transactional_direct | Purchase intent | buy, price, cost |
| 2 | transactional_local | Local intent | near me, location |
| 3 | commercial_product | Product research | vs, compare, review |
| 4 | commercial_solution | Problem-solving | how to, what is |
| 5 | navigational_branded | Brand-specific | [brand name] |

3. **LLM Testing Architecture**
- Multiple Groq models tested in parallel
- Intelligent model fallback with exponential backoff
- Rate limiting and cooling periods
- Response analysis and citation tracking

## System Architecture

### Data Flow
```
User Input → Ground Truth Collection → LLM Testing → Analysis → Database → Dashboard
```

### Core Services

1. **Ground Truth Service**
- Pure research without LLM processing
- Query collection and categorization
- Source validation and quality scoring
- Research metadata enrichment

2. **LLM Submission Service**  
- Multi-model testing via Groq API
- Smart fallback and rate limiting
- Search grounding with external data
- Response analysis and storage

3. **Analytics Service**
- LVI calculation and tracking
- Share of voice analysis
- Citation and source tracking
- Competitive intelligence

### Database Schema

```sql
-- Core Tables
brands (
  id UUID PRIMARY KEY,
  name TEXT,
  domain TEXT,
  business_category TEXT,
  metadata JSONB
)

geo_analyses (
  id UUID PRIMARY KEY,
  brand_id UUID,
  query_text TEXT,
  model_name TEXT,
  response TEXT,
  brand_mention_count INT,
  citation_sources JSONB[],
  lvi_score DECIMAL,
  component_scores JSONB,
  analyzed_at TIMESTAMP
)

citations (
  id UUID PRIMARY KEY,
  analysis_id UUID,
  url TEXT,
  domain TEXT, 
  authority_score DECIMAL,
  relevance_score DECIMAL
)

competitor_mentions (
  id UUID PRIMARY KEY,
  analysis_id UUID,
  competitor_name TEXT,
  mention_position INT,
  sentiment_score DECIMAL
)
```

## Core Algorithms

### 1. Query Expansion
```typescript
async function expandQueries(brandProfile: BrandProfile): Promise<string[]> {
  // Use Groq LLM for query expansion
  const expandedQueries = await llm.complete(`
    Brand: ${brandProfile.name}
    Industry: ${brandProfile.category}
    
    Generate diverse, high-intent queries that potential customers 
    might ask AI assistants about this brand or its solutions.
    
    Focus on:
    1. Problem-solving queries
    2. Comparison queries
    3. Research queries
    4. Purchase-intent queries
    
    Return 12-15 natural, conversational queries.
  `)
  
  return filterAndValidateQueries(expandedQueries)
}
```

### 2. Citation Analysis
```typescript
function analyzeCitations(response: string, brand: Brand): Citation[] {
  return {
    is_cited: checkBrandMention(response, brand),
    citation_position: findFirstMention(response, brand),
    citation_context: extractContext(response, brand),
    sentiment: analyzeSentiment(response, brand),
    confidence_score: calculateConfidence(response, brand),
    key_phrases: extractKeyPhrases(response)
  }
}
```

### 3. LVI Calculation
```typescript
function calculateLVI(metrics: AnalysisMetrics): number {
  const weights = {
    indirect_coverage: 0.25,
    position_quality: 0.25,
    citation_authority: 0.20,
    sentiment_quality: 0.15,
    direct_mentions: 0.10,
    competitive_position: 0.05
  }

  return Object.entries(weights).reduce((lvi, [component, weight]) => {
    return lvi + (metrics[component] * weight)
  }, 0)
}
```

## System Prompts

### 1. Query Generation Prompt
```typescript
const queryGenerationPrompt = `
You are a Generative Engine Optimization (GEO) expert.

CONTEXT:
Brand: {brand_name}
Industry: {industry}
Products/Services: {products_services}

TASK:
Generate diverse, high-intent search queries that potential customers might ask AI assistants.

REQUIREMENTS:
1. Include different query types:
   - Problem-solving ("How can I...")
   - Comparison ("Which is better...")
   - Research ("What are the best...")
   - Purchase-intent ("Where to buy...")
   
2. Make queries natural and conversational
3. Include both branded and unbranded queries
4. Consider regional context and language patterns

FORMAT:
Return an array of strings, each being a complete question.
`
```

### 2. Citation Analysis Prompt
```typescript
const citationAnalysisPrompt = `
Analyze this AI response for brand mentions and citations:

BRAND: {brand_name}
WEBSITE: {website}
RESPONSE: {response_text}

ANALYZE:
1. Is the brand explicitly mentioned? (true/false)
2. If mentioned, at what position? (sentence number)
3. What is the context of mention? (recommendation, comparison, etc.)
4. What is the sentiment? (positive, neutral, negative)
5. Confidence in analysis? (0-1)
6. Key phrases that triggered the mention

Return structured JSON with all components.
`
```

## API Endpoints

### 1. Ground Truth API
```typescript
POST /api/ground-truth
Body: {
  brandName: string
  businessCategory: string
  markets: string[]
  productsServices?: string
  competitors?: string[]
  website?: string
  quick?: boolean
}
```

### 2. LLM Testing API
```typescript
POST /api/llm/submit
Body: {
  brandId: string
  prompts: string[]
  models?: string[]
  options?: {
    includeGroundedSearch: boolean
    maxRetries: number
    timeout: number
  }
}
```

### 3. Analytics API
```typescript
GET /api/brand-analytics
Query: {
  brandId: string
  startDate?: string
  endDate?: string
  includeCompetitors?: boolean
}
```

## Performance Requirements

1. **Response Times**
- Ground Truth Collection: < 30s
- LLM Testing: < 60s per batch
- Analytics Generation: < 5s

2. **Rate Limits**
- Ground Truth API: 2 req/sec
- LLM Testing: 5 req/sec per model
- Analytics API: 10 req/sec

3. **Availability**
- 99.9% uptime
- Automatic failover
- Rate limit recovery

4. **Data Retention**
- Raw responses: 30 days
- Analyzed data: 1 year
- Aggregated metrics: Indefinite

## Security & Privacy

1. **Authentication**
- Supabase Auth with JWT
- Row Level Security
- Role-based access

2. **Data Isolation**
- Multi-tenant architecture
- Workspace separation
- Audit logging

3. **API Security**
- Rate limiting
- Request validation
- Error handling

## Monitoring & Analytics

1. **System Metrics**
- API response times
- Error rates
- Cache hit rates
- Queue lengths

2. **Business Metrics**
- LVI scores
- Citation rates
- Response quality
- Customer engagement

3. **Usage Metrics**
- API calls per tenant
- Storage utilization
- Model usage distribution
- Cost per analysis

## System Integrations

### Redis/Upstash Integration

1. **Cache Layers**
- L1: In-memory cache (short-lived)
- L2: Redis cache (shared across instances)
- L3: Database (persistent storage)

**Cache Strategy:**
```typescript
interface CacheConfig {
  memory: { ttl: 300 },    // 5 minutes
  redis: { ttl: 3600 },    // 1 hour
  database: { ttl: 86400 } // 1 day
}
```

2. **Queue Management**
- Job queues for LLM processing
- Rate limit tracking
- Model cooldown periods

3. **Real-time Metrics**
- Response time tracking
- Error rate monitoring
- Cache hit rates

### Groq Integration

1. **Model Selection**
```typescript
const MODEL_TIERS = {
  premium: ['llama3-70b-8192'],
  standard: ['llama3-8b-8192', 'mixtral-8x7b-32768'],
  fallback: ['llama3-small']
}
```

2. **Failover Strategy**
```typescript
async function getWorkingModel(): Promise<string> {
  for (const tier of Object.keys(MODEL_TIERS)) {
    for (const model of MODEL_TIERS[tier]) {
      if (await checkModelAvailability(model)) {
        return model
      }
    }
  }
  throw new Error('No available models')
}
```

### Supabase Integration

1. **Row Level Security (RLS)**
```sql
-- Brand access policy
CREATE POLICY "brand_access_policy" ON brands
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM workspace_members
      WHERE workspace_id IN (
        SELECT id FROM workspaces 
        WHERE brand_id = brands.id
      )
    )
  );
```

2. **Real-time Subscriptions**
```typescript
const subscription = supabase
  .channel('geo_analyses')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'geo_analyses',
    filter: `brand_id=eq.${brandId}`
  })
  .subscribe()
```

## Advanced Features

### A/B Testing System

1. **Test Configuration**
```typescript
interface ABTestConfig {
  testId: string
  brandId: string
  variants: {
    control: string[]      // Control prompts
    treatment: string[]    // Test prompts
  }
  metrics: {
    primary: 'lvi_score'   // Primary success metric
    secondary: string[]    // Additional metrics
  }
  duration: number        // Test duration in hours
  sampleSize: number     // Responses per variant
}
```

2. **Statistical Analysis**
```typescript
function analyzeTestResults(testId: string): TestAnalysis {
  return {
    confidence: calculateConfidence(),
    lift: calculateLift(),
    significance: runTTest(),
    recommendations: generateRecommendations()
  }
}
```

### Competitive Intelligence

1. **Market Position Analysis**
```typescript
interface MarketPosition {
  brand_id: string
  direct_competitors: Competitor[]
  indirect_competitors: Competitor[]
  market_share: number
  visibility_rank: number
  threat_analysis: {
    emerging_competitors: string[]
    declining_competitors: string[]
    opportunity_gaps: string[]
  }
}
```

2. **Share of Voice Tracking**
```typescript
interface ShareOfVoice {
  brand_mentions: number
  competitor_mentions: Record<string, number>
  total_mentions: number
  share_percentage: number
  trend: 'increasing' | 'stable' | 'decreasing'
}
```

### Content Optimization Engine

1. **Optimization Workflow**
```typescript
interface OptimizationWorkflow {
  content_audit: {
    missing_elements: string[]
    improvement_areas: string[]
    citation_opportunities: string[]
  }
  recommendations: {
    high_priority: string[]
    medium_priority: string[]
    low_priority: string[]
  }
  expected_impact: {
    lvi_lift: number
    confidence: number
  }
}
```

2. **Content Scoring**
```typescript
interface ContentScore {
  authority_signals: number    // 0-100
  technical_accuracy: number   // 0-100
  completeness: number        // 0-100
  ai_friendliness: number     // 0-100
  overall_score: number       // Weighted average
}
```

## Deployment Architecture

### Infrastructure

1. **Production Environment**
```yaml
services:
  web:
    runtime: 'nodejs18'
    memory: 1024MB
    instances: 'auto'
    
  worker:
    runtime: 'nodejs18'
    memory: 2048MB
    instances: 2
    
  redis:
    service: 'upstash'
    plan: 'dedicated'
    
  database:
    service: 'supabase'
    plan: 'pro'
```

2. **Scaling Rules**
```typescript
const SCALING_THRESHOLDS = {
  cpu_utilization: 70,    // Scale at 70% CPU
  memory_usage: 80,       // Scale at 80% memory
  request_rate: 100,      // Requests per second
  error_rate: 5          // Errors per minute
}
```

### Disaster Recovery

1. **Backup Strategy**
```yaml
backups:
  database:
    frequency: 'daily'
    retention: 30
    type: 'point-in-time'
    
  redis:
    frequency: 'hourly'
    retention: 24
    type: 'snapshot'
```

2. **Recovery Procedures**
```typescript
interface RecoveryPlan {
  priority: 'critical' | 'high' | 'medium' | 'low'
  rto: number           // Recovery Time Objective (minutes)
  rpo: number           // Recovery Point Objective (minutes)
  steps: string[]       // Recovery steps
  verification: string[] // Verification checks
}
```

## Development Workflow

### Testing Strategy

1. **Test Categories**
```typescript
interface TestSuite {
  unit: {
    coverage: 80,        // Minimum coverage %
    critical_paths: string[]
  }
  integration: {
    api_coverage: 90,    // API test coverage %
    scenarios: string[]
  }
  e2e: {
    critical_flows: string[]
    browsers: string[]
  }
}
```

2. **Quality Gates**
```yaml
quality_gates:
  test_coverage: 80%
  code_duplication: 5%
  technical_debt: 'low'
  security_vulnerabilities: 0
  performance_regression: 'none'
```

### Release Process

1. **Deployment Stages**
```typescript
const DEPLOYMENT_STAGES = {
  development: {
    automatic: true,
    verification: ['tests', 'lint']
  },
  staging: {
    automatic: true,
    verification: ['e2e', 'performance']
  },
  production: {
    automatic: false,
    verification: ['manual', 'compliance']
  }
}
```

2. **Rollback Procedures**
```typescript
interface RollbackPlan {
  triggers: string[]     // Conditions requiring rollback
  procedures: string[]   // Step-by-step rollback process
  validation: string[]   // Post-rollback checks
  notification: string[] // Stakeholder communication
}
```

## Comprehensive Metrics & Calculations

### 1. Brand Visibility Metrics

#### LLM Visibility Index (LVI) Components
```typescript
interface LVIComponents {
  indirect_coverage: {
    weight: 0.25,
    calculation: (discoveryMentions / totalQueries) * 100,
    subcomponents: {
      discoveryMentions: 'Count of brand mentions in non-branded queries',
      totalQueries: 'Total number of relevant queries tested'
    }
  },
  position_quality: {
    weight: 0.25,
    calculation: (positions) => {
      const scores = positions.map(pos => Math.max(0, 100 - (pos - 1) * 15))
      return scores.reduce((sum, score) => sum + score, 0) / positions.length
    },
    scoring: {
      position_1: 100,
      position_2: 85,
      position_3: 70,
      position_4: 55,
      position_5_plus: 40,
      not_mentioned: 0
    }
  },
  citation_authority: {
    weight: 0.20,
    calculation: (citations) => {
      return citations.reduce((sum, citation) => {
        return sum + (citation.authority_score * citation.relevance_score)
      }, 0) / citations.length
    },
    authorityScoring: {
      high_authority: { score: 1.0, threshold: 8.0 },
      medium_authority: { score: 0.7, threshold: 5.0 },
      low_authority: { score: 0.4, threshold: 0.0 }
    }
  },
  sentiment_quality: {
    weight: 0.15,
    calculation: (sentiments) => {
      return sentiments.reduce((sum, sentiment) => {
        return sum + mapSentimentToScore(sentiment)
      }, 0) / sentiments.length
    },
    sentimentScoring: {
      very_positive: 1.0,
      positive: 0.75,
      neutral: 0.5,
      negative: 0.25,
      very_negative: 0.0
    }
  },
  direct_mentions: {
    weight: 0.10,
    calculation: (brandedMentions / totalBrandedQueries) * 100,
    subcomponents: {
      brandedMentions: 'Count of brand mentions in branded queries',
      totalBrandedQueries: 'Total number of branded queries tested'
    }
  },
  competitive_position: {
    weight: 0.05,
    calculation: (brandMentions / (brandMentions + competitorMentions)) * 100,
    subcomponents: {
      brandMentions: 'Total brand mentions across all queries',
      competitorMentions: 'Total competitor mentions across all queries'
    }
  }
}
```

### 2. Content Quality Metrics

#### Authority Score Calculation
```typescript
interface AuthorityMetrics {
  domain_authority: {
    weight: 0.35,
    factors: {
      domain_age: { weight: 0.2, scale: 0-10 },
      backlink_profile: { weight: 0.4, scale: 0-10 },
      industry_relevance: { weight: 0.4, scale: 0-10 }
    }
  },
  content_authority: {
    weight: 0.35,
    factors: {
      expert_citations: { weight: 0.3, scale: 0-10 },
      data_freshness: { weight: 0.3, scale: 0-10 },
      source_diversity: { weight: 0.4, scale: 0-10 }
    }
  },
  technical_authority: {
    weight: 0.30,
    factors: {
      schema_markup: { weight: 0.4, scale: 0-10 },
      content_structure: { weight: 0.3, scale: 0-10 },
      technical_accuracy: { weight: 0.3, scale: 0-10 }
    }
  }
}
```

### 3. Engagement Metrics

#### Response Quality Score
```typescript
interface ResponseQualityMetrics {
  completeness: {
    weight: 0.30,
    factors: {
      query_coverage: 'Percentage of query points addressed',
      detail_level: 'Word count relative to ideal range',
      supporting_elements: 'Presence of examples, data, citations'
    },
    calculation: (factors) => weightedAverage(factors, weights)
  },
  accuracy: {
    weight: 0.35,
    factors: {
      factual_correctness: 'Verified facts / total factual claims',
      technical_precision: 'Accuracy of technical details',
      source_reliability: 'Authority score of cited sources'
    }
  },
  relevance: {
    weight: 0.35,
    factors: {
      query_alignment: 'Direct answer to query intent',
      context_appropriateness: 'Industry/market relevance',
      user_intent_match: 'Matches search intent category'
    }
  }
}
```

### 4. Competitive Analysis Metrics

#### Market Position Score
```typescript
interface CompetitiveMetrics {
  share_of_voice: {
    calculation: (brandMentions / totalIndustryMentions) * 100,
    components: {
      direct_share: 'Brand mentions / (Brand + Direct competitor mentions)',
      category_share: 'Brand mentions / All industry mentions',
      trending_share: 'Current share / Previous period share'
    }
  },
  competitive_advantage: {
    calculation: (metrics) => {
      return {
        citation_advantage: brandCitations / avgCompetitorCitations,
        sentiment_advantage: brandSentiment / avgCompetitorSentiment,
        position_advantage: avgCompetitorPosition / brandPosition
      }
    }
  },
  threat_level: {
    calculation: (competitor) => {
      return {
        mention_velocity: 'Change in mention rate over time',
        citation_quality: 'Authority of citing sources',
        market_overlap: 'Shared query coverage percentage'
      }
    },
    scoring: {
      high: { threshold: 0.8, score: 3 },
      medium: { threshold: 0.5, score: 2 },
      low: { threshold: 0.0, score: 1 }
    }
  }
}
```

### 5. Trend Analysis Metrics

#### Historical Performance
```typescript
interface TrendMetrics {
  visibility_trend: {
    calculation: (current, previous) => {
      return {
        absolute_change: current.lvi - previous.lvi,
        percentage_change: ((current.lvi - previous.lvi) / previous.lvi) * 100,
        velocity: absolute_change / daysBetween
      }
    },
    periods: {
      short_term: '7 days',
      medium_term: '30 days',
      long_term: '90 days'
    }
  },
  momentum_score: {
    calculation: (metrics) => {
      return {
        mention_momentum: calculateMomentum(metrics.mentions),
        sentiment_momentum: calculateMomentum(metrics.sentiment),
        citation_momentum: calculateMomentum(metrics.citations)
      }
    },
    scoring: {
      strong_positive: { threshold: 15, score: 100 },
      positive: { threshold: 5, score: 75 },
      neutral: { threshold: -5, score: 50 },
      negative: { threshold: -15, score: 25 },
      strong_negative: { score: 0 }
    }
  }
}
```

### 6. ROI & Business Impact Metrics

#### Value Metrics
```typescript
interface BusinessMetrics {
  visibility_roi: {
    calculation: (metrics) => {
      return {
        cost_per_mention: totalCost / totalMentions,
        cost_per_citation: totalCost / totalCitations,
        impact_score: (visibilityLift * conversionValue) / totalCost
      }
    }
  },
  optimization_impact: {
    calculation: (before, after) => {
      return {
        lvi_lift: ((after.lvi - before.lvi) / before.lvi) * 100,
        mention_lift: ((after.mentions - before.mentions) / before.mentions) * 100,
        citation_lift: ((after.citations - before.citations) / before.citations) * 100
      }
    }
  }
}
```

This concludes the technical PRD with comprehensive implementation details for the Soma GEO platform.
