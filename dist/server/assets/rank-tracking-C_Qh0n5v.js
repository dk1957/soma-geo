import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { z as resolveMarket, b7 as isScheduledRankTrackingInterval, b8 as computeNextCheckAt, b9 as RankTrackingRepository, R as AppError, ba as MAX_CONFIGS_PER_PROJECT, bb as fetchKeywordMetricsForList, bc as estimateRankCheckCredits, bd as devicesCount, be as reconcileActiveRankCheckRun, bf as beginRankCheckRun, bg as MAX_KEYWORDS_PER_CONFIG, bh as createDataforseoClient, y as createServerFn, M as captureServerEvent, J as isHostedServerAuthMode, bi as customerHasPaidPlan, bj as getLatestResults, bk as asAppError } from "./index-CSpjggkr.js";
import { env, waitUntil } from "cloudflare:workers";
import { r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import { g as getConfigsSchema, c as createConfigSchema, u as updateConfigSchema, t as triggerCheckSchema, a as getLatestResultsSchema, b as getLatestRunSchema, e as estimateCostSchema, d as addKeywordsSchema, r as removeKeywordsSchema, f as refreshMetricsSchema, h as getKeywordHistorySchema, i as getConfigTrendSchema, j as getPositionMatrixSchema } from "./rank-tracking-CcqQFlKD.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
async function createConfig(input) {
  const normalizedDomain = normalizeDomain(input.domain);
  const { locationCode, languageCode } = resolveMarket(
    input,
    input.projectMarket
  );
  const scheduleInterval = input.scheduleInterval ?? "weekly";
  const nextCheckAt = isScheduledRankTrackingInterval(scheduleInterval) ? computeNextCheckAt(scheduleInterval) : null;
  const locationName = input.locationName ?? null;
  const existing = await RankTrackingRepository.getConfigByProjectDomainLocation(
    input.projectId,
    normalizedDomain,
    locationCode,
    locationName
  );
  if (existing?.isActive) {
    throw new AppError(
      "VALIDATION_ERROR",
      locationName ? "This domain + city combination is already being tracked" : "This domain + country combination is already being tracked"
    );
  }
  const allConfigs = await RankTrackingRepository.getConfigsForProject(
    input.projectId
  );
  if (allConfigs.length >= MAX_CONFIGS_PER_PROJECT) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Maximum ${MAX_CONFIGS_PER_PROJECT} tracked domains per project`
    );
  }
  if (existing) {
    await RankTrackingRepository.updateConfig(existing.id, input.projectId, {
      isActive: true,
      languageCode,
      devices: input.devices ?? "both",
      serpDepth: input.serpDepth,
      scheduleInterval,
      nextCheckAt,
      // Drop any stale skip reason from before it was archived so the
      // re-added domain doesn't surface an outdated warning.
      lastSkipReason: null
    });
    return { configId: existing.id };
  }
  const configId = crypto.randomUUID();
  await RankTrackingRepository.createConfig({
    id: configId,
    projectId: input.projectId,
    domain: normalizedDomain,
    locationCode,
    languageCode,
    locationName,
    devices: input.devices ?? "both",
    serpDepth: input.serpDepth,
    scheduleInterval,
    nextCheckAt
  });
  return { configId };
}
async function updateConfig(configId, projectId, input) {
  const updates = {};
  if (input.domain !== void 0)
    updates.domain = normalizeDomain(input.domain);
  if (input.locationCode !== void 0)
    updates.locationCode = input.locationCode;
  if (input.languageCode !== void 0)
    updates.languageCode = input.languageCode;
  if (input.locationName !== void 0)
    updates.locationName = input.locationName;
  if (input.devices !== void 0) updates.devices = input.devices;
  if (input.serpDepth !== void 0) updates.serpDepth = input.serpDepth;
  if (input.isActive !== void 0) updates.isActive = input.isActive;
  if (input.scheduleInterval !== void 0) {
    updates.scheduleInterval = input.scheduleInterval;
    if (input.scheduleInterval === "manual") {
      updates.nextCheckAt = null;
    } else {
      updates.nextCheckAt = computeNextCheckAt(input.scheduleInterval);
    }
  }
  await RankTrackingRepository.updateConfig(configId, projectId, updates);
}
async function addKeywords(configId, projectId, keywords) {
  await getValidatedConfig(configId, projectId);
  const existing = await RankTrackingRepository.getKeywordsForConfig(configId);
  if (existing.length >= MAX_KEYWORDS_PER_CONFIG) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Maximum ${MAX_KEYWORDS_PER_CONFIG} keywords per domain. Currently tracking ${existing.length}.`
    );
  }
  const existingKeywords = new Set(existing.map((kw) => kw.keyword));
  const available = MAX_KEYWORDS_PER_CONFIG - existing.length;
  const seen = /* @__PURE__ */ new Set();
  const rows = [];
  for (const raw of keywords) {
    if (rows.length >= available) break;
    const normalized = raw.trim().toLowerCase();
    if (normalized && !seen.has(normalized) && !existingKeywords.has(normalized)) {
      seen.add(normalized);
      rows.push({ id: crypto.randomUUID(), configId, keyword: normalized });
    }
  }
  if (rows.length > 0) {
    await RankTrackingRepository.addKeywordsToConfig(rows);
  }
  return { added: rows.length, addedIds: rows.map((r) => r.id) };
}
async function removeKeywords(configId, projectId, keywordIds) {
  await getValidatedConfig(configId, projectId);
  await RankTrackingRepository.removeKeywordsFromConfig(keywordIds, configId);
}
async function triggerCheck(input) {
  const config = await getValidatedConfig(input.configId, input.projectId);
  const keywords = await RankTrackingRepository.getKeywordsForConfig(config.id);
  if (keywords.length === 0) {
    throw new AppError(
      "INTERNAL_ERROR",
      "No keywords to track. Add keywords to this domain first."
    );
  }
  return beginRankCheckRun({
    workflow: env.RANK_CHECK_WORKFLOW,
    config,
    projectId: input.projectId,
    billingCustomer: {
      userId: input.billingCustomer.userId,
      userEmail: input.billingCustomer.userEmail,
      organizationId: input.billingCustomer.organizationId,
      projectId: input.billingCustomer.projectId
    },
    keywordsTotal: input.keywordIds ? input.keywordIds.length : keywords.length,
    keywordIds: input.keywordIds,
    trigger: "manual",
    workflowStartErrorMessage: "Failed to start rank check workflow"
  });
}
async function getLatestRun(configId, projectId) {
  await getValidatedConfig(configId, projectId);
  const run = await RankTrackingRepository.getLatestRunForConfig(configId);
  if (!run) return null;
  const reconciliation = await reconcileActiveRankCheckRun(run);
  if (reconciliation) {
    return formatRun(run, {
      maybeStale: true,
      staleReason: reconciliation.errorMessage
    });
  }
  return formatRun(run);
}
async function refreshKeywordMetrics(configId, projectId, billingCustomer) {
  const [config, keywords] = await Promise.all([
    getValidatedConfig(configId, projectId),
    RankTrackingRepository.getKeywordsForConfig(configId)
  ]);
  if (keywords.length === 0) return { updated: 0 };
  const client = createDataforseoClient(billingCustomer);
  const metrics = await fetchKeywordMetricsForList(client, {
    keywords: keywords.map((kw) => kw.keyword),
    locationCode: config.locationCode,
    languageCode: config.languageCode,
    // Local configs get volume/CPC scoped to the tracked city; national
    // numbers can overstate local demand by orders of magnitude.
    locationName: config.locationName ?? void 0,
    creditFeature: "rank_tracking"
  });
  const byKeyword = new Map(
    metrics.map((metric) => [metric.keyword.toLowerCase(), metric])
  );
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updates = keywords.map((kw) => {
    const metric = byKeyword.get(kw.keyword.toLowerCase());
    if (!metric) return null;
    return {
      id: kw.id,
      searchVolume: metric.searchVolume,
      keywordDifficulty: metric.keywordDifficulty,
      cpc: metric.cpc,
      metricsFetchedAt: now
    };
  }).filter((u) => u !== null);
  if (updates.length === 0) return { updated: 0 };
  await RankTrackingRepository.updateKeywordMetrics(updates);
  return { updated: updates.length };
}
async function estimateCost(configId, projectId) {
  const config = await getValidatedConfig(configId, projectId);
  const keywordCount = await RankTrackingRepository.getKeywordCountForConfig(configId);
  const { costUsd, costCredits } = estimateRankCheckCredits(
    keywordCount,
    config.devices,
    config.serpDepth,
    "live"
  );
  return {
    costUsd,
    costCredits,
    keywordCount,
    devicesCount: devicesCount(config.devices)
  };
}
async function getValidatedConfig(configId, projectId) {
  const config = await RankTrackingRepository.getConfigById({
    configId,
    projectId
  });
  if (!config) {
    throw new AppError("INTERNAL_ERROR", "Rank tracking config not found");
  }
  return config;
}
function normalizeDomain(domain) {
  let d = domain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/[/?#].*$/, "");
  d = d.replace(/\/+$/, "");
  d = d.replace(/^www\./, "");
  if (!d) {
    throw new AppError("INTERNAL_ERROR", "Invalid domain");
  }
  return d;
}
function formatRun(run, stale) {
  return {
    id: run.id,
    status: run.status,
    keywordsTotal: run.keywordsTotal,
    keywordsChecked: run.keywordsChecked,
    isSubsetRun: run.isSubsetRun,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    maybeStale: stale?.maybeStale ?? false,
    staleReason: stale?.staleReason ?? null
  };
}
const RankTrackingService = {
  createConfig,
  updateConfig,
  addKeywords,
  removeKeywords,
  triggerCheck,
  getLatestRun,
  estimateCost,
  refreshKeywordMetrics
};
async function requireConfig(configId, projectId) {
  const config = await RankTrackingRepository.getConfigById({
    configId,
    projectId
  });
  if (!config) {
    throw new AppError("INTERNAL_ERROR", "Rank tracking config not found");
  }
  return config;
}
const getRankTrackingConfigs_createServerFn_handler = createServerRpc({
  id: "2498dc9ae1c9692a93484405a16016aa8af2296e6a6ac6c892aeff22c4154f17",
  name: "getRankTrackingConfigs",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => getRankTrackingConfigs.__executeServer(opts));
const getRankTrackingConfigs = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(getConfigsSchema).handler(getRankTrackingConfigs_createServerFn_handler, async ({
  context
}) => {
  return RankTrackingRepository.getConfigsForProject(context.projectId);
});
const getRankTrackingConfigSummaries_createServerFn_handler = createServerRpc({
  id: "bb79e98e928653ebc50e8c4bfd905ed74cfd81dc4ad11c40a96e517c7a538648",
  name: "getRankTrackingConfigSummaries",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => getRankTrackingConfigSummaries.__executeServer(opts));
const getRankTrackingConfigSummaries = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(getConfigsSchema).handler(getRankTrackingConfigSummaries_createServerFn_handler, async ({
  context
}) => {
  return RankTrackingRepository.getConfigSummaries(context.projectId);
});
const createRankTrackingConfig_createServerFn_handler = createServerRpc({
  id: "258d28f360a42fb9dc6a60c60b05f23782f2fe2bf58c46d6e683b5d80693aadf",
  name: "createRankTrackingConfig",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => createRankTrackingConfig.__executeServer(opts));
const createRankTrackingConfig = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(createConfigSchema).handler(createRankTrackingConfig_createServerFn_handler, async ({
  data,
  context
}) => {
  const result = await RankTrackingService.createConfig({
    projectId: context.projectId,
    projectMarket: context.project,
    domain: data.domain,
    locationCode: data.locationCode,
    languageCode: data.languageCode,
    locationName: data.locationName,
    devices: data.devices,
    serpDepth: data.serpDepth,
    scheduleInterval: data.scheduleInterval
  });
  waitUntil(captureServerEvent({
    distinctId: context.userId,
    event: "rank_tracking:config_create",
    organizationId: context.organizationId,
    properties: {
      project_id: context.projectId,
      domain: data.domain,
      devices: data.devices ?? "both",
      schedule: data.scheduleInterval ?? "weekly"
    }
  }));
  return result;
});
const updateRankTrackingConfig_createServerFn_handler = createServerRpc({
  id: "16b8b61d3cfc645bc36be38a136d9d7ad7096edf8550536a9b522e2833bd5c45",
  name: "updateRankTrackingConfig",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => updateRankTrackingConfig.__executeServer(opts));
const updateRankTrackingConfig = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(updateConfigSchema).handler(updateRankTrackingConfig_createServerFn_handler, async ({
  data,
  context
}) => {
  await RankTrackingService.updateConfig(data.configId, context.projectId, {
    domain: data.domain,
    locationCode: data.locationCode,
    languageCode: data.languageCode,
    locationName: data.locationName,
    devices: data.devices,
    serpDepth: data.serpDepth,
    scheduleInterval: data.scheduleInterval,
    isActive: data.isActive
  });
  return {
    success: true
  };
});
const triggerRankCheck_createServerFn_handler = createServerRpc({
  id: "0e2299d91fe830180a5418ad53dd35b4fca59a0bcbd2727c9f3eff6680a88592",
  name: "triggerRankCheck",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => triggerRankCheck.__executeServer(opts));
const triggerRankCheck = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(triggerCheckSchema).handler(triggerRankCheck_createServerFn_handler, async ({
  data,
  context
}) => {
  const isHosted = await isHostedServerAuthMode();
  if (isHosted && !await customerHasPaidPlan(context.organizationId)) {
    throw new AppError("PAYMENT_REQUIRED", "Upgrade to the paid plan to run rank checks");
  }
  const result = await RankTrackingService.triggerCheck({
    configId: data.configId,
    projectId: context.projectId,
    billingCustomer: context,
    keywordIds: data.keywordIds
  });
  if (result.ok) {
    waitUntil(captureServerEvent({
      distinctId: context.userId,
      event: "rank_tracking:check_trigger",
      organizationId: context.organizationId,
      properties: {
        project_id: context.projectId,
        config_id: data.configId,
        run_id: result.runId
      }
    }));
  }
  return result;
});
const getLatestRankResults_createServerFn_handler = createServerRpc({
  id: "ddd165935e6b49d3557cb04d17f77f9775c81fbb0c0f735387a032421a266542",
  name: "getLatestRankResults",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => getLatestRankResults.__executeServer(opts));
const getLatestRankResults = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(getLatestResultsSchema).handler(getLatestRankResults_createServerFn_handler, async ({
  data,
  context
}) => {
  return getLatestResults(data.configId, context.projectId, data.comparePeriod);
});
const getLatestRankRun_createServerFn_handler = createServerRpc({
  id: "e07b0dfacb31a403133cc5bf5e671e8b7735dd63c2c993749b4ecd399e779acb",
  name: "getLatestRankRun",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => getLatestRankRun.__executeServer(opts));
const getLatestRankRun = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(getLatestRunSchema).handler(getLatestRankRun_createServerFn_handler, async ({
  data,
  context
}) => {
  return RankTrackingService.getLatestRun(data.configId, context.projectId);
});
const estimateRankCheckCost_createServerFn_handler = createServerRpc({
  id: "1e3e63b95fa90f1fafbcda79f9999a31747ab722474f0eae185243ffdd1b06ab",
  name: "estimateRankCheckCost",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => estimateRankCheckCost.__executeServer(opts));
const estimateRankCheckCost = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(estimateCostSchema).handler(estimateRankCheckCost_createServerFn_handler, async ({
  data,
  context
}) => {
  return RankTrackingService.estimateCost(data.configId, context.projectId);
});
const addTrackingKeywords_createServerFn_handler = createServerRpc({
  id: "9632bd92f3de61b172319c2b693ceaafbbc52f214ba2a4fb93531fefa5b96d74",
  name: "addTrackingKeywords",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => addTrackingKeywords.__executeServer(opts));
const addTrackingKeywords = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(addKeywordsSchema).handler(addTrackingKeywords_createServerFn_handler, async ({
  data,
  context
}) => {
  const result = await RankTrackingService.addKeywords(data.configId, context.projectId, data.keywords);
  let checkTriggered = false;
  if (result.addedIds.length > 0) {
    const isHosted = await isHostedServerAuthMode();
    const hasPaidPlan = !isHosted || await customerHasPaidPlan(context.organizationId);
    if (hasPaidPlan) {
      try {
        const triggerResult = await RankTrackingService.triggerCheck({
          configId: data.configId,
          projectId: context.projectId,
          billingCustomer: context,
          keywordIds: result.addedIds
        });
        checkTriggered = triggerResult.ok;
        if (!triggerResult.ok) {
          console.info("[rank-tracking] auto-check skipped: %s", triggerResult.reason);
        }
      } catch (err) {
        const appErr = asAppError(err);
        if (appErr?.code === "INSUFFICIENT_CREDITS") {
          console.info("[rank-tracking] auto-check skipped: insufficient credits");
        } else {
          console.error("[rank-tracking] auto-check after keyword add failed:", err);
        }
      }
    }
  }
  if (result.added > 0) {
    try {
      await RankTrackingService.refreshKeywordMetrics(data.configId, context.projectId, context);
    } catch (err) {
      const appErr = asAppError(err);
      if (appErr?.code === "INSUFFICIENT_CREDITS") {
        console.info("[rank-tracking] auto-metrics-refresh skipped: insufficient credits");
      } else {
        console.error("[rank-tracking] auto-metrics-refresh failed:", err);
      }
    }
  }
  return {
    ...result,
    checkTriggered
  };
});
const removeTrackingKeywords_createServerFn_handler = createServerRpc({
  id: "d034f8888a5e1014831023cf2a868291cfd466101140d59d1f4251fd53203037",
  name: "removeTrackingKeywords",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => removeTrackingKeywords.__executeServer(opts));
const removeTrackingKeywords = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(removeKeywordsSchema).handler(removeTrackingKeywords_createServerFn_handler, async ({
  data,
  context
}) => {
  await RankTrackingService.removeKeywords(data.configId, context.projectId, data.keywordIds);
  return {
    removed: data.keywordIds.length
  };
});
const refreshTrackingKeywordMetrics_createServerFn_handler = createServerRpc({
  id: "17c1167140bde128372935a660b28fd6e0e183774ca3f90271799ba787ecb243",
  name: "refreshTrackingKeywordMetrics",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => refreshTrackingKeywordMetrics.__executeServer(opts));
const refreshTrackingKeywordMetrics = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(refreshMetricsSchema).handler(refreshTrackingKeywordMetrics_createServerFn_handler, async ({
  data,
  context
}) => {
  const result = await RankTrackingService.refreshKeywordMetrics(data.configId, context.projectId, context);
  waitUntil(captureServerEvent({
    distinctId: context.userId,
    event: "rank_tracking:metrics_refresh",
    organizationId: context.organizationId,
    properties: {
      project_id: context.projectId,
      config_id: data.configId,
      updated: result.updated
    }
  }));
  return result;
});
const getRankKeywordHistory_createServerFn_handler = createServerRpc({
  id: "e808431fe24faa5cddaa82ff3cee05037bdd2ddd1ba1ceef693aac01ca8e68bc",
  name: "getRankKeywordHistory",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => getRankKeywordHistory.__executeServer(opts));
const getRankKeywordHistory = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(getKeywordHistorySchema).handler(getRankKeywordHistory_createServerFn_handler, async ({
  data,
  context
}) => {
  await requireConfig(data.configId, context.projectId);
  return RankTrackingRepository.getKeywordHistory(data.configId, data.trackingKeywordId, data.sinceDays);
});
const getRankConfigTrend_createServerFn_handler = createServerRpc({
  id: "9da63329d53b960da32b79472469175d63f38b5e71bcef0cacabb66cba684931",
  name: "getRankConfigTrend",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => getRankConfigTrend.__executeServer(opts));
const getRankConfigTrend = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(getConfigTrendSchema).handler(getRankConfigTrend_createServerFn_handler, async ({
  data,
  context
}) => {
  await requireConfig(data.configId, context.projectId);
  const rows = await RankTrackingRepository.getConfigTrend(data.configId, data.device, data.sinceDays);
  return rows.map((row) => {
    const top3 = Number(row.top3) || 0;
    const top4to10 = Number(row.top4to10) || 0;
    const top11to20 = Number(row.top11to20) || 0;
    const total = Number(row.total) || 0;
    return {
      runId: row.runId,
      checkedAt: row.checkedAt,
      top3,
      top4to10,
      top11to20,
      notRanking: Math.max(0, total - top3 - top4to10 - top11to20)
    };
  });
});
const getRankPositionMatrix_createServerFn_handler = createServerRpc({
  id: "c6715a7072113d7f7ea076796cf28e47be1bab5e1dfd14502e72467efab53306",
  name: "getRankPositionMatrix",
  filename: "src/serverFunctions/rank-tracking.ts"
}, (opts) => getRankPositionMatrix.__executeServer(opts));
const getRankPositionMatrix = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(getPositionMatrixSchema).handler(getRankPositionMatrix_createServerFn_handler, async ({
  data,
  context
}) => {
  await requireConfig(data.configId, context.projectId);
  return RankTrackingRepository.getPositionMatrix(data.configId, data.device, data.runLimit);
});
export {
  addTrackingKeywords_createServerFn_handler,
  createRankTrackingConfig_createServerFn_handler,
  estimateRankCheckCost_createServerFn_handler,
  getLatestRankResults_createServerFn_handler,
  getLatestRankRun_createServerFn_handler,
  getRankConfigTrend_createServerFn_handler,
  getRankKeywordHistory_createServerFn_handler,
  getRankPositionMatrix_createServerFn_handler,
  getRankTrackingConfigSummaries_createServerFn_handler,
  getRankTrackingConfigs_createServerFn_handler,
  refreshTrackingKeywordMetrics_createServerFn_handler,
  removeTrackingKeywords_createServerFn_handler,
  triggerRankCheck_createServerFn_handler,
  updateRankTrackingConfig_createServerFn_handler
};
