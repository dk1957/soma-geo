import { L as LIGHTHOUSE_CATEGORY_TABS, a as LIGHTHOUSE_CATEGORIES } from "./lighthouse-CxIZIYPF.js";
import { G as object, a2 as _enum, H as string } from "./index-CSpjggkr.js";
const lighthouseAuditIssueSchema = object({
  projectId: string().min(1, "Project id is required"),
  resultId: string().min(1, "Result id is required")
});
const lighthouseAuditExportSchema = object({
  projectId: string().min(1, "Project id is required"),
  resultId: string().min(1, "Result id is required"),
  mode: _enum(["full", "issues", "category"]),
  category: _enum(LIGHTHOUSE_CATEGORIES).optional()
});
const lighthouseIssuesSearchSchema = object({
  auditId: string().optional().catch(void 0),
  category: _enum(LIGHTHOUSE_CATEGORY_TABS).catch("all").default("all")
});
export {
  lighthouseAuditExportSchema as a,
  lighthouseIssuesSearchSchema as b,
  lighthouseAuditIssueSchema as l
};
