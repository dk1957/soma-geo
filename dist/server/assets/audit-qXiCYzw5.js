import { G as object, a2 as _enum, H as string, Y as number, aq as MIN_AUDIT_PAGES, ar as PAID_MAX_AUDIT_PAGES, as as DEFAULT_AUDIT_PAGES } from "./index-CSpjggkr.js";
const startAuditSchema = object({
  projectId: string().min(1),
  startUrl: string().min(1, "URL is required").max(2048),
  maxPages: number().int().min(MIN_AUDIT_PAGES).max(PAID_MAX_AUDIT_PAGES).optional().default(DEFAULT_AUDIT_PAGES),
  lighthouseStrategy: _enum(["auto", "none"]).optional().default("auto")
});
const getAuditStatusSchema = object({
  projectId: string().min(1),
  auditId: string().min(1)
});
const getAuditResultsSchema = object({
  projectId: string().min(1),
  auditId: string().min(1)
});
const getAuditHistorySchema = object({
  projectId: string().min(1)
});
const deleteAuditSchema = object({
  projectId: string().min(1),
  auditId: string().min(1)
});
const getCrawlProgressSchema = object({
  projectId: string().min(1),
  auditId: string().min(1)
});
const auditTabs = ["issues", "pages", "performance"];
const auditSearchSchema = object({
  auditId: string().optional().catch(void 0),
  tab: _enum(auditTabs).catch("issues").default("issues")
});
export {
  getAuditResultsSchema as a,
  getAuditHistorySchema as b,
  getCrawlProgressSchema as c,
  deleteAuditSchema as d,
  auditSearchSchema as e,
  getAuditStatusSchema as g,
  startAuditSchema as s
};
