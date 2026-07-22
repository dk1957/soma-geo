import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { b3 as jsonCodec, b4 as t, y as createServerFn, b5 as AuditRepository, R as AppError, b6 as getJsonFromR2 } from "./index-CSpjggkr.js";
import { s as storedLighthousePayloadSchema } from "./lighthouseStoredPayload-CV9yCkM2.js";
import { r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import { l as lighthouseAuditIssueSchema, a as lighthouseAuditExportSchema } from "./lighthouse-BaqnXs-3.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
import "./lighthouse-CxIZIYPF.js";
const storedPayloadCodec = jsonCodec(storedLighthousePayloadSchema);
function sortIssues(issues) {
  return t(
    issues,
    [
      (issue) => (issue.impactMs ?? 0) * 1e3 + (issue.impactBytes ?? 0),
      "desc"
    ],
    [(issue) => issue.score ?? 100, "asc"]
  );
}
function parseStoredLighthousePayload(payloadJson) {
  const storedPayload = storedPayloadCodec.safeParse(payloadJson);
  if (storedPayload.success) {
    return storedPayload.data;
  }
  try {
    JSON.parse(payloadJson);
  } catch {
    throw new Error("Invalid Lighthouse payload JSON");
  }
  return null;
}
function buildLighthouseIssueReport(storedPayload, categoryFilter) {
  if (!storedPayload) {
    return {
      hasIssueDetails: false,
      issues: []
    };
  }
  const filteredIssues = categoryFilter ? storedPayload.issues.filter((issue) => issue.category === categoryFilter) : storedPayload.issues;
  return {
    hasIssueDetails: storedPayload.hasIssueDetails,
    issues: sortIssues(filteredIssues)
  };
}
function readStoredLighthousePayload(payloadJson, categoryFilter) {
  const storedPayload = parseStoredLighthousePayload(payloadJson);
  return {
    storedPayload,
    report: buildLighthouseIssueReport(storedPayload, categoryFilter)
  };
}
function buildLighthouseExportFile(input) {
  const safeDate = input.createdAt.replace(/[:.]/g, "-");
  const baseName = `lighthouse-${input.strategy}-${safeDate}`;
  if (input.mode === "full") {
    return {
      filename: `${baseName}-payload.json`,
      content: input.payloadJson
    };
  }
  const { report } = readStoredLighthousePayload(
    input.payloadJson,
    input.category
  );
  return {
    filename: input.mode === "category" && input.category ? `${baseName}-${input.category}-issues.json` : `${baseName}-issues.json`,
    content: JSON.stringify(
      {
        [input.idField]: input.idValue,
        finalUrl: input.finalUrl,
        strategy: input.strategy,
        createdAt: input.createdAt,
        category: input.category ?? "all",
        issues: report.issues
      },
      null,
      2
    )
  };
}
async function getAuditLighthouseData(input) {
  const site = await AuditRepository.getLighthouseResultById({
    lighthouseResultId: input.resultId,
    projectId: input.projectId
  });
  if (!site) {
    throw new AppError("NOT_FOUND");
  }
  const r2Key = site.lighthouse.r2Key;
  if (!r2Key) {
    throw new AppError("NOT_FOUND");
  }
  const payloadJson = await getJsonFromR2(r2Key);
  const payload = readStoredLighthousePayload(payloadJson);
  return {
    id: site.lighthouse.id,
    strategy: site.lighthouse.strategy,
    finalUrl: site.page?.url ?? "",
    createdAt: site.audit.startedAt,
    payloadJson,
    payload
  };
}
const getAuditLighthouseIssues_createServerFn_handler = createServerRpc({
  id: "955fb22c05a803998669e9e3cb307dc405e545b788cf580fa37af4236d97b07a",
  name: "getAuditLighthouseIssues",
  filename: "src/serverFunctions/lighthouse.ts"
}, (opts) => getAuditLighthouseIssues.__executeServer(opts));
const getAuditLighthouseIssues = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(lighthouseAuditIssueSchema).handler(getAuditLighthouseIssues_createServerFn_handler, async ({
  data,
  context
}) => {
  const lighthouse = await getAuditLighthouseData({
    projectId: context.projectId,
    resultId: data.resultId
  });
  return {
    id: lighthouse.id,
    finalUrl: lighthouse.payload.storedPayload?.metadata.finalUrl ?? lighthouse.finalUrl,
    strategy: lighthouse.strategy,
    createdAt: lighthouse.createdAt,
    hasIssueDetails: lighthouse.payload.report.hasIssueDetails,
    scores: lighthouse.payload.storedPayload?.scores ?? null,
    metrics: lighthouse.payload.storedPayload?.metrics ?? null,
    issues: lighthouse.payload.report.issues
  };
});
const exportAuditLighthouseIssues_createServerFn_handler = createServerRpc({
  id: "0400cd589829703979c0d6b38188a846f541034cb534b51326766d1a7f007970",
  name: "exportAuditLighthouseIssues",
  filename: "src/serverFunctions/lighthouse.ts"
}, (opts) => exportAuditLighthouseIssues.__executeServer(opts));
const exportAuditLighthouseIssues = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(lighthouseAuditExportSchema).handler(exportAuditLighthouseIssues_createServerFn_handler, async ({
  data,
  context
}) => {
  const lighthouse = await getAuditLighthouseData({
    projectId: context.projectId,
    resultId: data.resultId
  });
  return buildLighthouseExportFile({
    idField: "resultId",
    idValue: lighthouse.id,
    finalUrl: lighthouse.finalUrl,
    strategy: lighthouse.strategy,
    createdAt: lighthouse.createdAt,
    payloadJson: lighthouse.payloadJson,
    mode: data.mode,
    category: data.mode === "category" ? data.category : void 0
  });
});
export {
  exportAuditLighthouseIssues_createServerFn_handler,
  getAuditLighthouseIssues_createServerFn_handler
};
