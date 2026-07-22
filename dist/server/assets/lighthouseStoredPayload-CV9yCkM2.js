import { a as LIGHTHOUSE_CATEGORIES } from "./lighthouse-CxIZIYPF.js";
import { G as object, Y as number, H as string, a3 as array, a2 as _enum, a4 as boolean, a5 as literal } from "./index-CSpjggkr.js";
const storedLighthouseMetricSchema = object({
  score: number().nullable(),
  displayValue: string().nullable(),
  numericValue: number().nullable()
});
const storedLighthouseMetricsSchema = object({
  firstContentfulPaint: storedLighthouseMetricSchema,
  largestContentfulPaint: storedLighthouseMetricSchema,
  totalBlockingTime: storedLighthouseMetricSchema,
  cumulativeLayoutShift: storedLighthouseMetricSchema,
  speedIndex: storedLighthouseMetricSchema,
  timeToInteractive: storedLighthouseMetricSchema,
  interactionToNextPaint: storedLighthouseMetricSchema,
  serverResponseTime: storedLighthouseMetricSchema
});
const storedLighthouseIssueSchema = object({
  category: _enum(LIGHTHOUSE_CATEGORIES),
  auditKey: string(),
  title: string(),
  description: string(),
  score: number().nullable(),
  scoreDisplayMode: string().nullable(),
  displayValue: string().nullable(),
  impactMs: number().nullable(),
  impactBytes: number().nullable(),
  severity: _enum(["critical", "warning", "info"]),
  items: array(string())
});
const storedLighthousePayloadSchema = object({
  version: literal(2),
  source: literal("dataforseo-lighthouse"),
  hasIssueDetails: boolean(),
  metadata: object({
    requestedUrl: string(),
    finalUrl: string(),
    strategy: _enum(["mobile", "desktop"]),
    fetchedAt: string(),
    lighthouseVersion: string().nullable(),
    taskId: string().nullable(),
    cost: number().nullable()
  }),
  scores: object({
    performance: number().nullable(),
    accessibility: number().nullable(),
    "best-practices": number().nullable(),
    seo: number().nullable()
  }),
  metrics: storedLighthouseMetricsSchema,
  issues: array(storedLighthouseIssueSchema)
});
function scoreToPercent(score) {
  if (score == null || Number.isNaN(score)) return null;
  return Math.round(score * 100);
}
function buildStoredMetric(audit) {
  return {
    score: scoreToPercent(audit?.score),
    displayValue: audit?.displayValue ?? null,
    numericValue: typeof audit?.numericValue === "number" ? audit.numericValue : null
  };
}
const DIAGNOSTIC_AUDIT_KEYS = /* @__PURE__ */ new Set([
  "largest-contentful-paint-element",
  "layout-shifts",
  "diagnostics",
  "metrics",
  "network-requests",
  "network-rtt",
  "network-server-latency",
  "main-thread-tasks",
  "screenshot-thumbnails",
  "final-screenshot",
  "script-treemap-data",
  "resource-summary"
]);
function compactItem(item) {
  const preferredKeys = [
    "url",
    "source",
    "nodeLabel",
    "snippet",
    "totalBytes",
    "wastedBytes",
    "wastedMs",
    "label",
    "value"
  ];
  const output = {};
  for (const key of preferredKeys) {
    if (item[key] != null) {
      output[key] = item[key];
    }
  }
  if (Object.keys(output).length === 0) {
    for (const [key, value] of Object.entries(item).slice(0, 6)) {
      output[key] = value;
    }
  }
  return JSON.stringify(output);
}
function getSeverity(input) {
  if ((input.impactMs ?? 0) >= 300 || (input.impactBytes ?? 0) >= 15e4) {
    return "critical";
  }
  if (input.score != null && input.score < 50) {
    return "critical";
  }
  if ((input.impactMs ?? 0) >= 100 || (input.impactBytes ?? 0) >= 5e4) {
    return "warning";
  }
  if (input.score != null && input.score < 90) {
    return "warning";
  }
  return "info";
}
function buildStoredLighthouseIssues(input) {
  const hasIssueDetails = LIGHTHOUSE_CATEGORIES.some(
    (category) => (input.categories[category]?.auditRefs?.length ?? 0) > 0
  );
  const issues = [];
  for (const category of LIGHTHOUSE_CATEGORIES) {
    const refs = input.categories[category]?.auditRefs ?? [];
    for (const ref of refs) {
      const auditKey = ref.id;
      if (!auditKey) continue;
      const audit = input.audits[auditKey];
      if (!audit) continue;
      const score = scoreToPercent(audit.score);
      const scoreDisplayMode = audit.scoreDisplayMode ?? null;
      if (scoreDisplayMode === "numeric") continue;
      if (DIAGNOSTIC_AUDIT_KEYS.has(auditKey)) continue;
      const isPass = score == null || score >= 90 || scoreDisplayMode === "notApplicable" || scoreDisplayMode === "informative" || scoreDisplayMode === "manual" || scoreDisplayMode === "error";
      if (isPass) continue;
      const impactMs = typeof audit.details?.overallSavingsMs === "number" ? audit.details.overallSavingsMs : null;
      const impactBytes = typeof audit.details?.overallSavingsBytes === "number" ? audit.details.overallSavingsBytes : null;
      const items = Array.isArray(audit.details?.items) ? audit.details.items.slice(0, 10).map(compactItem) : [];
      issues.push({
        category,
        auditKey,
        title: audit.title ?? auditKey,
        description: audit.description ?? "",
        score,
        scoreDisplayMode,
        displayValue: audit.displayValue ?? null,
        impactMs,
        impactBytes,
        severity: getSeverity({ score, impactMs, impactBytes }),
        items
      });
    }
  }
  return {
    hasIssueDetails,
    issues
  };
}
function buildStoredLighthouseMetrics(input) {
  return {
    firstContentfulPaint: buildStoredMetric(
      input.audits["first-contentful-paint"]
    ),
    largestContentfulPaint: buildStoredMetric(
      input.audits["largest-contentful-paint"]
    ),
    totalBlockingTime: buildStoredMetric(input.audits["total-blocking-time"]),
    cumulativeLayoutShift: buildStoredMetric(
      input.audits["cumulative-layout-shift"]
    ),
    speedIndex: buildStoredMetric(input.audits["speed-index"]),
    timeToInteractive: buildStoredMetric(input.audits.interactive),
    interactionToNextPaint: buildStoredMetric(
      input.audits["interaction-to-next-paint"]
    ),
    serverResponseTime: buildStoredMetric(input.audits["server-response-time"])
  };
}
export {
  buildStoredLighthouseMetrics as a,
  buildStoredLighthouseIssues as b,
  scoreToPercent as c,
  storedLighthousePayloadSchema as s
};
