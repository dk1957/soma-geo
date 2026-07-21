# Soma AI Platform - API Architecture

## Overview

The Soma AI platform uses **Next.js App Router** API routes organized by domain. All routes are consumed exclusively by the Next.js frontend — there are no external API consumers.

**Auth**: Clerk (PKCE) → Supabase profile resolution  
**Database**: Supabase/PostgreSQL with service client (bypasses RLS)  
**AI/LLM**: OpenRouter (multi-model), OpenAI  
**Cache**: Upstash Redis  

---

## API Directory Structure

```
app/api/
├── accounts/               # Account CRUD, members, organization, tokens, access checks
│   └── check-access/       # Dashboard access verification
├── admin/                  # Admin config, model management, debugging
├── analytics/              # ALL analytics, metrics & intelligence
│   ├── brand/              # Brand visibility metrics & competitive analysis
│   ├── historical/         # Historical trend data & KPI aggregation
│   ├── intelligence/       # Multi-provider brand intelligence queries
│   │   └── multi-provider/ # Run queries across OpenAI/Groq/etc
│   ├── kpi/                # Dashboard KPI metrics (MetricsCalculator)
│   ├── mentions/           # Brand mentions by platform/sentiment
│   ├── metrics/            # Brand metrics & model comparison
│   │   ├── route.ts        # Full dashboard metrics (daily/weekly/monthly)
│   │   ├── models/         # Model comparison metrics
│   │   └── timeseries/     # Time series metrics
│   ├── overview/           # Enhanced dashboard metrics (overview)
│   ├── rankings/           # Rankings, export, industry benchmarks
│   └── sources/            # Source citation analysis
│       ├── route.ts        # RPC-based source citations
│       └── detailed/       # Detailed source analytics with filtering
├── auth/                   # Clerk webhook, OAuth callbacks
├── brands/                 # Brand CRUD, competitors, products, settings
├── content/                # Content management (GSEO, generation, publishing)
│   ├── briefs/             # Content briefs generation
│   ├── extract-url/        # URL content extraction
│   ├── generate/           # AI content generation
│   ├── gseo/               # Full GSEO content system (MACO)
│   ├── parse-file/         # File content parsing
│   └── publishing/         # Content publishing workflow
├── countries/              # Country & locale data
├── cron/                   # Scheduled jobs (cron-secret protected)
├── demo-request/           # Demo request form
├── discoverability/        # ALL discoverability & SEO features
│   ├── route.ts            # Technical SEO tools (robots.txt, schema.org)
│   ├── ai/                 # AI discoverability metrics
│   │   ├── crawler-activity/ # AI crawler activity tracking
│   │   ├── ldi/            # LLM Discoverability Index scoring
│   │   ├── opportunities/  # Content optimization opportunities
│   │   └── track/          # Visibility alerts & competitor benchmarks
│   └── indexing/           # Indexing audit
│       └── audit/          # Brand indexing audit (technical SEO)
├── feature-flags/          # Feature flag management
├── free-audit/             # Public audit funnel
│   ├── claim-and-setup/    # Account+brand setup for conversion
│   └── execute/            # Audit execution
├── health/                 # System health check
├── images/                 # Image services (unsplash)
├── integrations/           # Third-party integrations
│   └── gsc/                # Google Search Console (OAuth, sync, data)
├── jobs/                   # All job management (unified)
│   ├── route.ts            # Job CRUD (GET/POST)
│   ├── [jobId]/            # Single job (GET/PATCH/DELETE + progress)
│   ├── prompt-generation/  # Job-based prompt generation
│   ├── prompts/            # Prompt job triggers
│   ├── research/           # Research job triggers
│   └── run/         # Run job triggers
├── llm-run/         # LLM run pipeline
│   ├── background/         # Background run trigger
│   ├── dashboard-trigger/  # Manual dashboard trigger
│   ├── responses/          # Run response retrieval
│   └── store/              # Response storage
├── onboarding/             # Onboarding flow
│   ├── setup/              # Company+brand setup (from sign-up)
│   └── status/             # Onboarding status (GET/POST)
├── profile/                # User profile CRUD
├── prompt-management/      # Prompt CRUD, bulk, generate, simulate, enhance
│   ├── analytics/          # Prompt performance analytics
│   ├── enhance/            # AI prompt enhancement (OpenRouter)
│   ├── suggestions/        # AI-generated prompt suggestions
│   └── topics/             # Prompt topic organization
├── reports/                # All report management
│   ├── route.ts            # External brand reports CRUD
│   ├── brand/              # Brand reports CRUD (brand_reports)
│   │   └── [id]/           # Single brand report + export + share
│   ├── external/           # Public report sharing + lead capture
│   ├── generate/           # Report generation by type
│   ├── store/              # Report storage
│   └── [id]/               # Report sub-data (stats, citations, etc.)
├── subscriptions/          # Subscription management
├── teams/                  # Team management (invitations, members, roles)
├── user-notifications/     # User notification management
└── webhooks/               # External webhooks (Clerk)
```

**Total: 25 top-level directories, 182 routes** (down from 57 → 31 → 25)

---

## Service Layer

```
lib/services/
├── insights-service.ts                # Cross-domain insights generation
├── llm-run-orchestrator.ts     # Core run orchestration
├── response-analysis-engine/          # Response analysis pipeline
│   ├── engine.ts                      # Main analysis engine
│   ├── llm-analyzer.ts               # LLM-based analysis
│   ├── nlp-analyzer.ts               # NLP-based analysis
│   └── types.ts                       # Type definitions
├── lvi-calculation.service.ts         # LVI score calculation
├── brand-reporting.ts                 # Brand report generation
├── external-report-analytics.ts       # Report analytics queries
├── gsc-oauth-service.ts              # Google Search Console integration
├── subscription-service.ts            # Subscription management
├── config-service.ts                  # App configuration
├── metrics-calculator.ts             # Metrics computation
├── vector-analytics-service.ts        # Vector/embedding analytics
├── content-publishing-service.ts      # Content publishing
├── embedding-service.ts              # Embedding generation
└── ... (52 files total, down from 65+)
```

---

## API Client

All frontend code should use the centralized API client:

```typescript
import { api } from '@/lib/api/client'

// Namespaced methods
const brand = await api.brands.get(brandId)
const sims = await api.runs.getResponses({ brand_id })
const analytics = await api.brands.getAnalytics({ brandId })
```

**Available namespaces**: `runs`, `brands`, `prompts`, `reports`, `accounts`, `team`, `profile`, `notifications`, `content`, `discoverability`, `integrations.gsc`, `dashboard`, `freeAudit`, `onboarding`, `featureFlags`, `images`, `countries`, `health`

---

## API Middleware

Centralized utilities in `lib/api/middleware.ts`:

```typescript
import { getAuthContext, errorResponse, successResponse, validateBrandAccess } from '@/lib/api'

export async function GET(request: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return errorResponse('Unauthorized', 401)
  
  await validateBrandAccess(auth.profileId, brandId)
  
  return successResponse(data)
}
```

---

## Key Domain Flows

### Run Pipeline
```
Trigger → llm-run/background or dashboard-trigger
  → llm-run-orchestrator.ts
  → OpenRouter API (multi-model)
  → llm-run/store (persist responses)
  → response-analysis-engine (analyze)
  → analytics/analysis/webhook (post-processing)
```

### Report Pipeline
```
POST /api/reports/brand (create brand report)
  → brand-reporting.ts (generation)
  → reports/brand/[id]/export (PDF/HTML/DOCX)
  → reports/brand/[id]/share (public sharing)

POST /api/reports/generate/{type} (generate report content)
  → brand-audit, brand-visibility, from-run, etc.

GET /api/reports/[id]/data (external report data)
  → external-report-analytics.ts (queries)
  → Sub-endpoints: stats, citations, prompts, rankings, topics, lvi, timeseries

GET /api/reports/external/public/{token} (public report access)
  → Email capture gate → lead capture
  → View tracking
```

---

## Changes Log (This Session)

### Session 1: Dead Code Removal (16 API directories removed)
- `test-parse/`, `debug-classification/`, `brand-metrics/`
- `team-management/` (→ merged into `teams/`)
- `auth/signin`, `auth/signup`, `auth/signout` (deprecated Supabase auth)
- `notifications/` (→ `user-notifications/` is canonical)
- `analytics/dashboard/` (duplicate), `analytics/export/` (unused)
- `paa-online-research/`, `sync-onboarding/`, `schema-templates/`
- `sources-usage/`, `recent-mentions/`, `dynamic-content/`
- `scheduled-jobs/`, `optimize/`, `signup/`, `audits/`
- `competitors/` (→ `brands/[id]/competitors` is canonical)
- `run/`, `dashboard-run/` (→ merged into `llm-run/`)

### Session 2: Consolidation (57 → 31 directories)
- `prompt-analytics/`, `prompt-suggestions/`, `prompt-topics/` → merged into `prompt-management/`
- `brand-management/` → merged into `brands/`
- `account-management/` + `organization/` → merged into `accounts/`
- `industry-rankings/` → merged into `rankings/industry/`
- `reporting/` (16 routes) → merged into `reports/brand/` and `reports/generate/`
- `raw-responses/` → removed (dead code, zero frontend callers)
- `ai/` → removed (dead code, zero frontend callers)
- `insights/` → removed (dead code, only in API client wrapper, no UI calls)
- `analytics-dashboard/`, `brand-analytics/` (→ merged into `analytics/`)
- `workspace-management/` (zero frontend references)

### Removed (15 service files)
- `research-automation-agent.ts`, `content-fingerprinting.ts`
- `crawler-detection.ts`, `automation-workflows.ts`
- `brand-research-orchestrator.ts`, `bot-detection-service.ts`
- `publishing-service.ts`, `llm-run-cache.ts`
- `llm-run-report.ts`, `llm-response-validator.ts`
- `llm-orchestration.ts`, `contextual-brand-analyzer.ts`
- `consumer-response-processor.ts`, `discoverability-audit-service.ts`
- `daily-metrics-service.ts`

### Created
- `lib/api/middleware.ts` — Centralized API middleware
- `lib/api/client.ts` — Frontend API client with typed methods
- `lib/api/index.ts` — Module exports
- `lib/services/insights-service.ts` — Cross-domain insights engine
- `app/api/insights/route.ts` — Insights API endpoint
- `app/api/analytics/brand/route.ts` — Consolidated from brand-analytics
- `app/api/analytics/dashboard/route.ts` — Consolidated from analytics-dashboard

### Consolidated Routes
| Old Path | New Path | Frontend refs updated |
|----------|----------|----------------------|
| `/api/team-management/*` | `/api/teams/*` | 4 files |
| `/api/run/background` | `/api/llm-run/background` | 1 file |
| `/api/dashboard-run` | `/api/llm-run/dashboard-trigger` | 1 file |
| `/api/analytics-dashboard` | `/api/analytics/dashboard` | 1 file |
| `/api/brand-analytics` | `/api/analytics/brand` | 5 files |

### Session 3: Deep Consolidation (31 → 31 directories, internal restructuring)

**Merged & Moved:**
| Old Path | New Path | Refs Updated |
|----------|----------|-------------|
| `/api/company/setup` | `/api/onboarding/setup` | 3 files |
| `/api/dashboard/jobs/*` | `/api/jobs/*` | 3 files |
| `/api/external-reports/*` | `/api/reports/external/*` | 17 refs across 5 files |
| `/api/rankings/*` | `/api/analytics/rankings/*` | 4 refs across 2 files |
| `/api/sources-citations` | `/api/analytics/sources` | 2 refs across 2 files |
| `/api/dashboard/subscriptions/*` | `/api/subscriptions/*` | 20+ refs across 10 files |
| `/api/dashboard/analytics` | `/api/analytics/metrics` | 1 file |
| `/api/dashboard/sources` | `/api/analytics/detailed-sources` | 1 file |
| `/api/dashboard/mentions-data` | `/api/analytics/mentions` | 1 file |
| `/api/dashboard/metrics` | `/api/analytics/dashboard-metrics` | 1 file |
| `/api/dashboard/prompts` | `/api/jobs/prompt-generation` | 1 file |
| `/api/v1/content/*` | `/api/content/*` | 70+ refs across 15 files |
| `/api/v1/discoverability/*` | `/api/discoverability/ai/*` | 8 files |
| `/api/v1/brand-intelligence/*` | `/api/brand-intelligence/*` | 2 files |
| `/api/v1/indexing/*` | `/api/indexing/*` | 2 files |
| `/api/v1/metrics/*` | `/api/metrics/*` | 2 files |

**Deleted (dead code, zero frontend callers):**
- `company/` — merged into onboarding
- `external-reports/` — merged into reports/external
- `sources-citations/` — merged into analytics/sources
- `rankings/` — merged into analytics/rankings
- `v1/` — entire namespace flattened (14 dead routes removed, 15 promoted)
- `dashboard/ldi-analytics` — dead
- `dashboard/onboarding-data` — dead
- `dashboard/realtime-metrics` — dead
- `dashboard/research` — dead
- `v1/analytics/` (3 routes) — dead
- `v1/brands/` (7 routes) — dead
- `v1/notifications/` — dead
- `v1/source-authority/` — dead
- `v1/content/gseo/fix-stuck` — dead
- `v1/metrics/summary` — dead

**Proxy routes eliminated:**
- `onboarding/store-prompts` (proxy → prompt-management) — deleted, client calls directly
- `onboarding/jobs/research` (proxy → jobs/research) — deleted
- `onboarding/jobs/prompts` (proxy → jobs/prompts) — deleted

### Session 4: Domain Consolidation (31 → 25 top-level directories)

**Merged into `analytics/`:**
| Old Path | New Path |
|----------|----------|
| `analysis/analyze` | `analytics/analysis/analyze` |
| `analysis/response-analysis/upsert` | `analytics/analysis/upsert` |
| `analysis/webhook` | `analytics/analysis/webhook` |
| `metrics/*` | `analytics/metrics/*` |
| `brand-intelligence/multi-provider` | `analytics/intelligence/multi-provider` |
| `analytics/dashboard` | `analytics/historical` (renamed for clarity) |
| `analytics/dashboard-metrics` | `analytics/kpi` (renamed for clarity) |
| `analytics/detailed-sources` | `analytics/sources/detailed` (nested under sources) |
| `analytics/metrics` (old) | `analytics/overview` (renamed to avoid conflict) |

**Merged into `discoverability/`:**
| Old Path | New Path |
|----------|----------|
| `indexing/audit` | `discoverability/indexing/audit` |

**Merged into `prompt-management/`:**
| Old Path | New Path |
|----------|----------|
| `openrouter/enhance-prompt` | `prompt-management/enhance` |

**Merged into `accounts/`:**
| Old Path | New Path |
|----------|----------|
| `dashboard/check-access` | `accounts/check-access` |

**Directories removed:** `analysis/`, `metrics/`, `brand-intelligence/`, `indexing/`, `openrouter/`, `dashboard/`

**Dead API client methods removed:** `rankings`, `industryRankings`, `sourcesCitations`, `metrics` (0 frontend callers each — functionality available via `dashboard` namespace)

**Frontend files updated:** lib/api/client.ts, components/brand-intelligence-dashboard.tsx, app/dashboard/technical-seo/page.tsx, app/onboarding/page.tsx, app/free-audit/page.tsx, app/dashboard/layout.tsx, components/external-report/analytics-chart.tsx, app/dashboard/sources/page.tsx, lib/middleware/no-cache.ts, middleware.ts
