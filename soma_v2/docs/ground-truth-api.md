# Ground Truth API Documentation

## Overview
The Ground Truth API provides pure online research capabilities for collecting real-world user queries about brands, products, services, and competitors. This API performs **NO LLM processing** - it only collects and structures data for subsequent AI processing.

## Endpoints

### POST `/api/ground-truth`
Collect ground truth questions and insights for a brand.

#### Request Body
```json
{
  "brandName": "string",           // Required: Brand name to research
  "businessCategory": "string",    // Required: Business category (e.g., "coffee", "CRM software")
  "markets": ["string"],           // Required: Markets to research (e.g., ["Uganda", "Kenya"])
  "productsServices": "string",    // Optional: Products/services description
  "competitors": ["string"],       // Optional: Known competitors
  "website": "string",            // Optional: Brand website
  "quick": boolean                // Optional: Quick collection vs comprehensive (default: false)
}
```

#### Response - Quick Collection (`quick: true`)
```json
{
  "success": true,
  "type": "quick",
  "brandName": "string",
  "markets": ["string"],
  "questions": [
    {
      "text": "string",
      "source": "PAA|Autocomplete|Reddit|Quora|SerpAPI|Forums",
      "volume": number,
      "timestamp": "string",
      "relevanceScore": number,
      "intentCategory": "transactional_direct|transactional_local|commercial_product|commercial_solution|navigational_branded",
      "market": "string",
      "rawData": object
    }
  ],
  "totalQuestions": number,
  "message": "string"
}
```

#### Response - Comprehensive Collection (`quick: false`)
```json
{
  "success": true,
  "type": "comprehensive",
  "brandName": "string",
  "markets": ["string"],
  "result": {
    "brandContext": {
      "brandName": "string",
      "markets": ["string"],
      "businessCategory": "string",
      "productsServices": "string",
      "competitors": ["string"],
      "website": "string"
    },
    "questions": [/* GroundTruthQuestion array */],
    "totalQuestions": number,
    "highIntentQuestions": number,
    "marketBreakdown": {
      "Uganda": 15,
      "Kenya": 12
    },
    "intentBreakdown": {
      "transactional_direct": 8,
      "commercial_product": 12,
      "commercial_solution": 7
    },
    "topSources": ["PAA", "Reddit", "Quora"],
    "collectionTimestamp": "string",
    "qualityScore": number
  },
  "summary": {
    "totalQuestions": number,
    "highIntentQuestions": number,
    "qualityScore": number,
    "topSources": ["string"],
    "intentBreakdown": object
  },
  "message": "string"
}
```

### GET `/api/ground-truth`
Retrieve stored ground truth collections for the authenticated user.

#### Query Parameters
- `brandName` (optional): Filter by brand name
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

#### Response
```json
{
  "success": true,
  "collections": [
    {
      "id": "string",
      "brandName": "string",
      "businessCategory": "string",
      "markets": ["string"],
      "totalQuestions": number,
      "highIntentQuestions": number,
      "qualityScore": number,
      "topSources": ["string"],
      "intentBreakdown": object,
      "marketBreakdown": object,
      "createdAt": "string",
      "sampleQuestions": [/* First 5 questions */]
    }
  ],
  "hasMore": boolean,
  "total": number
}
```

### DELETE `/api/ground-truth?id={collectionId}`
Delete a specific ground truth collection.

#### Response
```json
{
  "success": true,
  "message": "Ground truth collection deleted successfully"
}
```

## Intent Categories (Ranked by Commercial Value)

| Rank | Intent Category | Description | Key Modifiers | Business Focus |
|------|----------------|-------------|---------------|----------------|
| 1 | `transactional_direct` | Ready to buy/purchase | buy, purchase, order, coupon, discount, deal, sale, price, cost | E-commerce, conversions |
| 2 | `transactional_local` | Local purchase intent | near me, close by, open now, location, address | Local business, maps |
| 3 | `commercial_product` | Product comparison/evaluation | vs, compare, review, best, top, affordable, cheapest, which | Product pages, reviews |
| 4 | `commercial_solution` | Solution-seeking behavior | for, with, that, to, how, what, why, when | Solution pages, guides |
| 5 | `navigational_branded` | Brand-specific searches | [Brand Name] + terms | Brand pages, support |

## Data Sources

| Source | Description | API Used | Rate Limits |
|--------|-------------|----------|-------------|
| **PAA** | Google People Also Ask | SERP API | 1 request/second |
| **Autocomplete** | Google autocomplete suggestions | SERP API | 1 request/second |
| **Reddit** | Reddit discussions and questions | Tavily API | 2 requests/second |
| **Quora** | Quora questions and answers | Tavily API | 2 requests/second |
| **Forums** | General forum discussions | Tavily API | 2 requests/second |

## Quality Scoring

### Relevance Score Calculation
- **Brand mention**: +50 points
- **Category mention**: +30 points
- **Product/service terms**: +20 points
- **Competitor mention**: +15 points
- **Source quality**: +5-15 points (PAA highest, Forums lowest)
- **Search volume**: +0-20 points (scaled)
- **Intent category**: +25-50 points (transactional highest)
- **Question quality**: +10 points (well-formed questions)

### Quality Score (0-100%)
Based on percentage of high-intent questions (transactional + commercial with score >30):
- **90-100%**: Excellent data quality
- **70-89%**: Good data quality  
- **50-69%**: Average data quality
- **Below 50%**: Poor data quality

## Usage Examples

### Onboarding Integration
```javascript
// Quick collection during onboarding
const response = await fetch('/api/ground-truth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brandName: "Coffee Roasters Ltd",
    businessCategory: "coffee roasting",
    markets: ["Uganda", "Kenya"],
    productsServices: "premium coffee beans and roasting services",
    quick: true
  })
});

const { questions } = await response.json();
// Use questions for immediate prompt generation
```

### Dashboard Integration
```javascript
// Comprehensive research for dashboard
const response = await fetch('/api/ground-truth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brandName: "TechCorp",
    businessCategory: "software",
    markets: ["United States", "Canada"],
    competitors: ["Microsoft", "Google", "Apple"],
    quick: false
  })
});

const { result } = await response.json();
// Use comprehensive result for detailed analysis
```

### Retrieve Historical Data
```javascript
// Get previous collections
const response = await fetch('/api/ground-truth?brandName=TechCorp&limit=5');
const { collections } = await response.json();
// Display historical ground truth data
```

## Database Schema

The API stores comprehensive results in the `ground_truth_collections` table:

```sql
CREATE TABLE ground_truth_collections (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  brand_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  markets TEXT[] NOT NULL,
  total_questions INTEGER NOT NULL,
  high_intent_questions INTEGER NOT NULL,
  quality_score INTEGER NOT NULL,
  market_breakdown JSONB NOT NULL,
  intent_breakdown JSONB NOT NULL,
  top_sources TEXT[] NOT NULL,
  questions_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE" // Optional
}
```

Common HTTP status codes:
- `400`: Bad Request (missing required fields)
- `401`: Unauthorized (no valid session)
- `500`: Internal Server Error (API failures)

## Performance Notes

- **Quick collection**: ~5-15 seconds, returns top 10 questions
- **Comprehensive collection**: ~30-60 seconds, returns up to 50 questions
- **Caching**: Results are stored in database for future reference
- **Rate limiting**: Built-in delays to respect API limits
- **Deduplication**: Automatic removal of duplicate questions

---

**Note**: This API is designed for pure data collection. For AI-powered prompt generation and analysis, use the collected data with the `/api/research` endpoint or other LLM services.