import { G as object, H as string, a2 as _enum, a_ as booleanSearchParamSchema, au as union, a5 as literal, a$ as number, a3 as array, Y as number$1, a4 as boolean } from "./index-CSpjggkr.js";
const TAG_COLOR_KEYS = [
  "slate",
  "rose",
  "amber",
  "lime",
  "emerald",
  "sky",
  "violet",
  "fuchsia"
];
function isTagColorKey(value) {
  return typeof value === "string" && TAG_COLOR_KEYS.includes(value);
}
function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = hash * 31 + value.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
}
function resolveTagColor(tag) {
  if (isTagColorKey(tag.color)) return tag.color;
  return TAG_COLOR_KEYS[hashString(tag.id) % TAG_COLOR_KEYS.length];
}
const COLOR_CLASS = {
  slate: "bg-slate-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  lime: "bg-lime-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500"
};
function tagChipClass(color) {
  return `tag-chip-${color} ring-1 ring-inset`;
}
function tagDotClass(color) {
  return COLOR_CLASS[color];
}
function tagSwatchClass(color) {
  return COLOR_CLASS[color];
}
const savedKeywordTagSchema = string().trim().min(1).max(64);
const tagColorSchema = _enum(TAG_COLOR_KEYS);
const savedKeywordSortFields = [
  "createdAt",
  "keyword",
  "searchVolume",
  "cpc",
  "competition",
  "keywordDifficulty",
  "fetchedAt"
];
const sortDirs = ["asc", "desc"];
const researchKeywordsSchema = object({
  projectId: string().min(1),
  keywords: array(string().min(1)).min(1).max(200),
  locationCode: number$1().int().positive().optional(),
  languageCode: string().min(2).max(8).optional(),
  resultLimit: union([literal(150), literal(300), literal(500)]).default(150),
  mode: _enum(["auto", "related", "suggestions", "ideas"]).optional().default("auto"),
  // Clickstream-refined volumes double the DataForSEO request cost; opt-in.
  clickstream: boolean().optional().default(false)
});
const saveKeywordsSchema = object({
  projectId: string().min(1),
  keywords: array(string().min(1)).min(1).max(500),
  locationCode: number$1().int().positive().optional(),
  languageCode: string().min(2).max(8).optional(),
  tags: array(savedKeywordTagSchema).max(20).optional(),
  tagMode: _enum(["append", "replace"]).optional(),
  metrics: array(
    object({
      keyword: string().min(1),
      searchVolume: number$1().int().nonnegative().nullable().optional(),
      cpc: number$1().nonnegative().nullable().optional(),
      competition: number$1().min(0).max(1).nullable().optional(),
      keywordDifficulty: number$1().int().min(0).max(100).nullable().optional(),
      intent: _enum([
        "informational",
        "commercial",
        "transactional",
        "navigational",
        "unknown"
      ]).nullable().optional(),
      monthlySearches: array(
        object({
          year: number$1().int().positive(),
          month: number$1().int().min(1).max(12),
          searchVolume: number$1().int().nonnegative()
        })
      ).optional()
    })
  ).max(500).optional()
}).refine(
  (value) => value.tagMode !== "replace" || (value.tags?.length ?? 0) > 0,
  "Replacement tags are required when tagMode is replace."
);
const removeSavedKeywordsSchema = object({
  projectId: string().min(1),
  savedKeywordIds: array(string().min(1)).min(1).max(2e3)
});
const getSavedKeywordsSchema = object({
  projectId: string().min(1),
  search: string().trim().max(200).optional(),
  includeTerms: array(string().trim().min(1)).max(20).optional(),
  excludeTerms: array(string().trim().min(1)).max(20).optional(),
  minVolume: number$1().int().nonnegative().nullable().optional(),
  maxVolume: number$1().int().nonnegative().nullable().optional(),
  minCpc: number$1().nonnegative().nullable().optional(),
  maxCpc: number$1().nonnegative().nullable().optional(),
  minDifficulty: number$1().int().min(0).max(100).nullable().optional(),
  maxDifficulty: number$1().int().min(0).max(100).nullable().optional(),
  tagIds: array(string().min(1)).max(50).optional(),
  tagNames: array(savedKeywordTagSchema).max(50).optional(),
  page: number$1().int().positive().default(1),
  pageSize: union([literal(50), literal(100), literal(250)]).default(50),
  sort: _enum(savedKeywordSortFields).default("createdAt"),
  order: _enum(sortDirs).default("desc")
});
const exportSavedKeywordsSchema = getSavedKeywordsSchema.omit({
  page: true,
  pageSize: true
});
const updateSavedKeywordTagsSchema = object({
  projectId: string().min(1),
  savedKeywordIds: array(string().min(1)).min(1).max(2e3),
  addTags: array(savedKeywordTagSchema).max(20).optional(),
  removeTagIds: array(string().min(1)).max(50).optional()
}).refine(
  (value) => (value.addTags?.length ?? 0) > 0 || (value.removeTagIds?.length ?? 0) > 0,
  "Add or remove at least one tag."
);
const updateSavedKeywordTagSchema = object({
  projectId: string().min(1),
  tagId: string().min(1),
  name: savedKeywordTagSchema.optional(),
  color: tagColorSchema.nullable().optional()
}).refine(
  (value) => value.name !== void 0 || value.color !== void 0,
  "Provide a name or color to update."
);
const deleteSavedKeywordTagSchema = object({
  projectId: string().min(1),
  tagId: string().min(1)
});
const refreshSavedKeywordMetricsSchema = object({
  projectId: string().min(1)
});
const serpAnalysisSchema = object({
  projectId: string().min(1),
  keyword: string().min(1),
  locationCode: number$1().int().positive().optional(),
  languageCode: string().min(2).max(8).optional()
});
const keywordSortFields = [
  "keyword",
  "searchVolume",
  "cpc",
  "competition",
  "keywordDifficulty"
];
const keywordModes = ["auto", "related", "suggestions", "ideas"];
const keywordsSearchSchema = object({
  q: string().optional(),
  loc: number().int().positive().optional(),
  kLimit: union([literal(150), literal(300), literal(500)]).optional(),
  mode: _enum(keywordModes).optional(),
  cs: booleanSearchParamSchema.optional(),
  sort: _enum(keywordSortFields).optional(),
  order: _enum(sortDirs).optional(),
  minVol: string().optional(),
  maxVol: string().optional(),
  minCpc: string().optional(),
  maxCpc: string().optional(),
  minKd: string().optional(),
  maxKd: string().optional(),
  include: string().optional(),
  exclude: string().optional()
});
export {
  TAG_COLOR_KEYS as T,
  updateSavedKeywordTagSchema as a,
  removeSavedKeywordsSchema as b,
  refreshSavedKeywordMetricsSchema as c,
  deleteSavedKeywordTagSchema as d,
  exportSavedKeywordsSchema as e,
  serpAnalysisSchema as f,
  getSavedKeywordsSchema as g,
  resolveTagColor as h,
  tagChipClass as i,
  tagSwatchClass as j,
  keywordsSearchSchema as k,
  researchKeywordsSchema as r,
  saveKeywordsSchema as s,
  tagDotClass as t,
  updateSavedKeywordTagsSchema as u
};
