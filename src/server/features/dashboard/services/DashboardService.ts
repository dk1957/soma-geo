import type { BillingCustomerContext } from "@/server/billing/subscription";
import { ActivationRepository } from "@/server/features/activation/repositories/ActivationRepository";
import { AuditRepository } from "@/server/features/audit/repositories/AuditRepository";
import { getIssueTypePageCountsForAudit } from "@/server/features/audit/repositories/auditSummaryQueries";
import { BacklinkSnapshotRepository } from "@/server/features/dashboard/repositories/BacklinkSnapshotRepository";
import { GscConnectionRepository } from "@/server/features/gsc/repositories/GscConnectionRepository";
import { RankTrackingRepository } from "@/server/features/rank-tracking/repositories/RankTrackingRepository";
import { getLatestResults } from "@/server/features/rank-tracking/services/rankTrackingResults";
import {
  createDataforseoClient,
  normalizeBacklinksTarget,
} from "@/server/lib/dataforseo";
import { buildCacheKey, getCached } from "@/server/lib/r2-cache";
import { detectTarget } from "@/shared/targetDetection";
import {
  brandLookupResultSchema,
  type BrandLookupResult,
} from "@/types/schemas/ai-search";
import type { DashboardAiVisibility } from "@/types/schemas/dashboard";

// Daily cadence: fresh numbers each visit without per-visit spend; a dormant
// project costs nothing because refreshes are visit-triggered.
const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// Bounds the per-config result reads on the overview path; projects rarely
// have more than a couple of configs.
const MAX_CONFIGS_FOR_OVERVIEW = 5;

export type DashboardActivation = {
  domain: string | null;
  gsc: { connected: boolean; siteUrl: string | null };
  mcp: {
    authorizedAt: string | null;
    firstToolCallAt: string | null;
    cardDismissedAt: string | null;
  };
  competitorClickedAt: string | null;
  // True once the project domain has a cached AI Visibility (Brand Lookup)
  // result — drives the AEO onboarding step. Derived from a read-only cache
  // peek, so it never triggers a paid call.
  aiVisibilityChecked: boolean;
};

type DashboardRankSummary = {
  trackedKeywords: number;
  improved: number;
  declined: number;
  top10: number;
  lastCheckedAt: string | null;
};

export type DashboardAuditSummary = {
  status: "running" | "completed" | "failed";
  pagesCrawled: number;
  startedAt: string;
  // Top issue types by severity then affected-page count, for the card's list.
  topIssues: {
    issueType: string;
    severity: "critical" | "warning" | "info";
    count: number;
  }[];
  totalIssueTypes: number;
};

export type DashboardBacklinkSummary = {
  domain: string;
  rank: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  newBacklinks: number | null;
  lostBacklinks: number | null;
  newReferringDomains: number | null;
  lostReferringDomains: number | null;
  capturedAt: string;
  stale: boolean;
};

type DashboardOverview = {
  rank: DashboardRankSummary | null;
  audit: DashboardAuditSummary | null;
  backlinks: DashboardBacklinkSummary | null;
};

async function getActivation(input: {
  projectId: string;
  organizationId: string;
  domain: string | null;
}): Promise<DashboardActivation> {
  const [gsc, orgActivation, projectActivation, aiVisibility] =
    await Promise.all([
      GscConnectionRepository.getByProjectId(input.projectId),
      ActivationRepository.getOrganizationActivation(input.organizationId),
      ActivationRepository.getProjectActivation(input.projectId),
      getAiVisibility({
        projectId: input.projectId,
        organizationId: input.organizationId,
        domain: input.domain,
      }),
    ]);

  return {
    domain: input.domain,
    gsc: { connected: gsc !== null, siteUrl: gsc?.siteUrl ?? null },
    mcp: {
      authorizedAt: orgActivation?.firstMcpAuthorizedAt ?? null,
      firstToolCallAt: orgActivation?.firstMcpToolCallAt ?? null,
      cardDismissedAt: projectActivation?.mcpCardDismissedAt ?? null,
    },
    competitorClickedAt: projectActivation?.competitorStepClickedAt ?? null,
    aiVisibilityChecked: aiVisibility.status === "cached",
  };
}

async function getOverview(input: {
  projectId: string;
  domain: string | null;
}): Promise<DashboardOverview> {
  const [rank, audit, backlinks] = await Promise.all([
    getRankSummary(input.projectId),
    getAuditSummary(input.projectId),
    getBacklinkSummary(input.projectId, input.domain),
  ]);
  return { rank, audit, backlinks };
}

async function getRankSummary(
  projectId: string,
): Promise<DashboardRankSummary | null> {
  const configs = await RankTrackingRepository.getConfigsForProject(projectId);
  if (configs.length === 0) return null;

  const results = await Promise.all(
    configs
      .slice(0, MAX_CONFIGS_FOR_OVERVIEW)
      .map((config) => getLatestResults(config.id, projectId, "7d")),
  );

  const summary: DashboardRankSummary = {
    trackedKeywords: 0,
    improved: 0,
    declined: 0,
    top10: 0,
    lastCheckedAt: null,
  };

  for (const result of results) {
    summary.trackedKeywords += result.rows.length;
    if (
      result.run &&
      (!summary.lastCheckedAt ||
        result.run.lastCheckedAt > summary.lastCheckedAt)
    ) {
      summary.lastCheckedAt = result.run.lastCheckedAt;
    }
    for (const row of result.rows) {
      for (const device of ["desktop", "mobile"] as const) {
        const { position, previousPosition } = row[device];
        if (position !== null && position <= 10) summary.top10 += 1;
        if (position === null || previousPosition === null) continue;
        // Lower position number = better ranking.
        if (position < previousPosition) summary.improved += 1;
        else if (position > previousPosition) summary.declined += 1;
      }
    }
  }

  return summary;
}

async function getAuditSummary(
  projectId: string,
): Promise<DashboardAuditSummary | null> {
  const audit = await AuditRepository.getLatestAuditForProject(projectId);
  if (!audit) return null;

  const typeRows = await getIssueTypePageCountsForAudit(audit.id);

  const severityRank = { critical: 0, warning: 1, info: 2 };
  const sorted = typeRows
    .map((row) => ({
      issueType: row.issueType,
      severity: row.severity,
      count: row.pages,
    }))
    .toSorted(
      (a, b) =>
        severityRank[a.severity] - severityRank[b.severity] ||
        b.count - a.count,
    );

  return {
    status: audit.status,
    pagesCrawled: audit.pagesCrawled,
    startedAt: audit.startedAt,
    topIssues: sorted.slice(0, 3),
    totalIssueTypes: sorted.length,
  };
}

function isSnapshotFresh(capturedAt: string): boolean {
  const capturedMs = Date.parse(capturedAt);
  if (Number.isNaN(capturedMs)) return false;
  return Date.now() - capturedMs < SNAPSHOT_MAX_AGE_MS;
}

async function getBacklinkSummary(
  projectId: string,
  domain: string | null,
): Promise<DashboardBacklinkSummary | null> {
  if (!domain) return null;
  const snapshot =
    await BacklinkSnapshotRepository.getLatestForProject(projectId);
  if (!snapshot || snapshot.domain !== domain) return null;
  return {
    domain: snapshot.domain,
    rank: snapshot.rank,
    backlinks: snapshot.backlinks,
    referringDomains: snapshot.referringDomains,
    newBacklinks: snapshot.newBacklinks,
    lostBacklinks: snapshot.lostBacklinks,
    newReferringDomains: snapshot.newReferringDomains,
    lostReferringDomains: snapshot.lostReferringDomains,
    capturedAt: snapshot.capturedAt,
    stale: !isSnapshotFresh(snapshot.capturedAt),
  };
}

/**
 * Visit-triggered snapshot refresh. Fetches only the DataForSEO backlinks
 * summary (not the history endpoint the backlinks page also pays for) and is
 * a no-op while the latest snapshot for the current domain is under a day
 * old. Concurrent loads racing the freshness check can each pay a metered
 * call — every call is metered, so the race duplicates customer spend on
 * identical data but never leaks revenue; accepted for now. On a fetch
 * failure with a stale snapshot in hand, the stale snapshot is returned
 * rather than surfacing an error card.
 */
async function ensureBacklinkSnapshot(input: {
  projectId: string;
  domain: string | null;
  billingCustomer: BillingCustomerContext;
}): Promise<DashboardBacklinkSummary | null> {
  const { projectId, domain } = input;
  if (!domain) return null;

  const latest =
    await BacklinkSnapshotRepository.getLatestForProject(projectId);
  const latestMatchesDomain = latest !== null && latest.domain === domain;
  if (latest && latestMatchesDomain && isSnapshotFresh(latest.capturedAt)) {
    return getBacklinkSummary(projectId, domain);
  }

  const normalized = normalizeBacklinksTarget(domain, { scope: "domain" });
  const dataforseo = createDataforseoClient(input.billingCustomer);

  try {
    const summary = await dataforseo.backlinks.summary({
      target: normalized.apiTarget,
    });
    await BacklinkSnapshotRepository.insert({
      projectId,
      domain,
      rank: summary.rank ?? null,
      backlinks: summary.backlinks ?? null,
      referringDomains: summary.referring_domains ?? null,
      brokenBacklinks: summary.broken_backlinks ?? null,
      newBacklinks: summary.new_backlinks ?? null,
      lostBacklinks: summary.lost_backlinks ?? null,
      newReferringDomains:
        summary.new_referring_domains ?? summary.new_reffering_domains ?? null,
      lostReferringDomains:
        summary.lost_referring_domains ??
        summary.lost_reffering_domains ??
        null,
      capturedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (latestMatchesDomain) {
      console.error("dashboard: backlink snapshot refresh failed", error);
      return getBacklinkSummary(projectId, domain);
    }
    throw error;
  }

  return getBacklinkSummary(projectId, domain);
}

// Brand Lookup's input defaults (see brandLookupInputSchema): a plain
// dashboard peek assumes US/English and no competitor comparison, which is the
// most common lookup a user runs for their own domain. These MUST stay in sync
// with the cache key getBrandLookup builds, or the peek silently never hits.
const AI_VISIBILITY_DEFAULT_LOCATION_CODE = 2840;
const AI_VISIBILITY_DEFAULT_LANGUAGE_CODE = "en";

const EMPTY_AI_VISIBILITY: DashboardAiVisibility = {
  status: "empty",
  resolvedTarget: null,
  fetchedAt: null,
  totalMentions: null,
  totalAiSearchVolume: null,
  perPlatform: [],
  sampleQueries: [],
};

/**
 * Read-only peek at the project's AI answer-engine visibility. Rebuilds the
 * exact R2 cache key {@link getBrandLookup} writes for a no-competitor domain
 * lookup and returns a compact summary if a cached result exists. Never calls
 * DataForSEO, so it is safe on the dashboard for every plan tier — a cache
 * miss just yields the "empty" state and the card prompts the user to run a
 * full lookup.
 */
async function getAiVisibility(input: {
  projectId: string;
  organizationId: string;
  domain: string | null;
}): Promise<DashboardAiVisibility> {
  if (!input.domain) return EMPTY_AI_VISIBILITY;

  const detected = detectTarget(input.domain);
  const cacheKey = await buildCacheKey("ai-search:brand-lookup", {
    organizationId: input.organizationId,
    projectId: input.projectId,
    targetType: detected.type,
    targetValue: detected.value.toLowerCase(),
    competitors: "",
    locationCode: AI_VISIBILITY_DEFAULT_LOCATION_CODE,
    languageCode: AI_VISIBILITY_DEFAULT_LANGUAGE_CODE,
  });

  const parsed = brandLookupResultSchema.safeParse(await getCached(cacheKey));
  if (!parsed.success || !parsed.data.hasData) return EMPTY_AI_VISIBILITY;

  return summarizeAiVisibility(parsed.data);
}

function summarizeAiVisibility(
  result: BrandLookupResult,
): DashboardAiVisibility {
  const sampleQueries = Array.from(
    new Set(
      result.topQueries
        .map((q) => q.question.trim())
        .filter((q) => q.length > 0),
    ),
  ).slice(0, 3);

  return {
    status: "cached",
    resolvedTarget: result.resolvedTarget,
    fetchedAt: result.fetchedAt,
    totalMentions: result.totalMentions,
    totalAiSearchVolume: result.totalAiSearchVolume,
    perPlatform: result.perPlatform.map((p) => ({
      platform: p.platform,
      mentions: p.mentions,
      aiSearchVolume: p.aiSearchVolume,
    })),
    sampleQueries,
  };
}

export const DashboardService = {
  getActivation,
  getOverview,
  getAiVisibility,
  ensureBacklinkSnapshot,
};
