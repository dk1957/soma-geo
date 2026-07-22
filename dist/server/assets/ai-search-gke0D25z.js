import { G as object, H as string, au as union, a4 as boolean, a2 as _enum, a3 as array, Y as number, av as discriminatedUnion, a5 as literal } from "./index-CSpjggkr.js";
const BRAND_LOOKUP_MAX_INPUT_LENGTH = 250;
const BRAND_LOOKUP_MAX_COMPETITORS = 5;
function parseCompetitorList(raw) {
  return Array.from(
    new Set(
      raw.split(",").map((part) => part.trim()).filter((part) => part.length > 0)
    )
  ).slice(0, BRAND_LOOKUP_MAX_COMPETITORS);
}
const brandLookupInputSchema = object({
  projectId: string().min(1),
  query: string().trim().min(1).max(BRAND_LOOKUP_MAX_INPUT_LENGTH),
  // Optional competitor brands/domains to compare Share of Voice against.
  // cross_aggregated_metrics caps groups at 10 (target + 9); we cap at 5.
  competitors: array(string().trim().min(1).max(BRAND_LOOKUP_MAX_INPUT_LENGTH)).max(BRAND_LOOKUP_MAX_COMPETITORS).default([]),
  locationCode: number().int().positive().default(2840),
  languageCode: string().min(2).max(8).default("en")
});
const brandPlatformBreakdownSchema = object({
  platform: _enum(["chat_gpt", "google"]),
  status: _enum(["success", "error"]),
  mentions: number().int().nonnegative().nullable(),
  aiSearchVolume: number().int().nonnegative().nullable()
});
const brandShareOfVoiceSchema = object({
  // The platforms whose cross_aggregated call succeeded and are summed into
  // the entries — so the UI can caption a single-platform leaderboard honestly
  // when the other platform's call failed.
  platforms: array(_enum(["chat_gpt", "google"])),
  entries: array(
    object({
      label: string().max(BRAND_LOOKUP_MAX_INPUT_LENGTH),
      isTarget: boolean(),
      mentions: number().int().nonnegative().nullable(),
      sharePct: number().nullable()
    })
  )
});
const brandTopPageKeywordSchema = object({
  question: string().max(500),
  aiSearchVolume: number().int().nonnegative().nullable()
});
const brandTopPageSchema = object({
  url: string().max(2048),
  domain: string().max(253).nullable(),
  platform: _enum(["chat_gpt", "google"]),
  // Page-level citation mentions from DataForSEO top_pages.
  mentions: number().int().nonnegative().nullable(),
  // Page-level AI search volume from DataForSEO top_pages.
  capturedVolume: number().int().nonnegative().nullable(),
  // Example prompts from the fetched mentions sample that cited this page.
  keywords: array(brandTopPageKeywordSchema).max(50)
});
const brandTopQuerySchema = object({
  question: string().max(500),
  platform: _enum(["chat_gpt", "google"]),
  aiSearchVolume: number().int().nonnegative().nullable(),
  firstSeenAt: string().nullable(),
  lastSeenAt: string().nullable(),
  citedSources: array(
    object({
      url: string().max(2048),
      domain: string().max(253).nullable(),
      title: string().max(300).nullable()
    })
  ).max(10),
  brandsMentioned: array(string().max(200)).max(20)
});
const brandMonthlyVolumeSchema = object({
  year: number().int(),
  month: number().int().min(1).max(12),
  volume: number().int().nonnegative().nullable()
});
const brandLookupResultSchema = object({
  query: string(),
  detectedTargetType: _enum(["domain", "keyword"]),
  resolvedTarget: string(),
  fetchedAt: string(),
  hasData: boolean(),
  totalMentions: number().int().nonnegative().nullable(),
  totalAiSearchVolume: number().int().nonnegative().nullable(),
  perPlatform: array(brandPlatformBreakdownSchema),
  // Competitor Share of Voice — null when no competitors were supplied or both
  // cross_aggregated calls failed. No legacy-cache shim: pre-SoV cache entries
  // are unreachable anyway (the cache key's param set changed), see the
  // buildCacheKey comment in brandLookup.ts.
  shareOfVoice: brandShareOfVoiceSchema.nullable(),
  topPages: array(brandTopPageSchema).max(40),
  topQueries: array(brandTopQuerySchema).max(50),
  monthlyVolume: array(brandMonthlyVolumeSchema)
});
const PROMPT_EXPLORER_MAX_PROMPT_LENGTH = 500;
const PROMPT_EXPLORER_MODELS = [
  "chat_gpt",
  "claude",
  "gemini",
  "perplexity"
];
const promptExplorerModelSchema = _enum(PROMPT_EXPLORER_MODELS);
const WEB_SEARCH_COUNTRY_CODES = [
  "US",
  "GB",
  "CA",
  "AU",
  "IE",
  "DE",
  "FR",
  "ES",
  "IT",
  "NL",
  "PT",
  "PL",
  "SE",
  "NO",
  "DK",
  "BR",
  "MX",
  "IN",
  "JP",
  "KR",
  "SG",
  "HK",
  "TW",
  "ZA"
];
const webSearchCountryCodeSchema = _enum(WEB_SEARCH_COUNTRY_CODES);
const promptExplorerInputSchema = object({
  projectId: string().min(1),
  prompt: string().trim().min(1).max(PROMPT_EXPLORER_MAX_PROMPT_LENGTH),
  models: array(promptExplorerModelSchema).min(1).max(4),
  highlightBrand: string().trim().min(1).max(BRAND_LOOKUP_MAX_INPUT_LENGTH).optional(),
  webSearch: boolean().default(true),
  webSearchCountryCode: webSearchCountryCodeSchema.optional()
});
const promptExplorerCitationSchema = object({
  url: string(),
  domain: string().nullable(),
  title: string().nullable(),
  matchedBrand: boolean()
});
const promptExplorerModelResultSchema = discriminatedUnion("status", [
  object({
    status: literal("success"),
    model: promptExplorerModelSchema,
    modelName: string().nullable(),
    text: string(),
    citations: array(promptExplorerCitationSchema),
    fanOutQueries: array(string()),
    brandMentioned: boolean().nullable(),
    outputTokens: number().int().nonnegative().nullable(),
    webSearch: boolean()
  }),
  object({
    status: literal("error"),
    model: promptExplorerModelSchema,
    errorCode: literal("UPSTREAM_ERROR"),
    message: string()
  })
]);
object({
  prompt: string(),
  highlightBrand: string().nullable(),
  fetchedAt: string(),
  results: array(promptExplorerModelResultSchema)
});
const brandLookupSearchSchema = object({
  q: string().optional(),
  c: union([string(), array(string())]).optional().transform(
    (value) => value === void 0 ? void 0 : parseCompetitorList(Array.isArray(value) ? value.join(",") : value)
  )
});
const promptExplorerSearchSchema = object({
  q: string().optional(),
  models: union([promptExplorerModelSchema, array(promptExplorerModelSchema)]).optional().transform(
    (value) => value === void 0 ? void 0 : Array.isArray(value) ? value : [value]
  ),
  web: union([boolean(), _enum(["true", "false"])]).optional().transform(
    (value) => value === void 0 ? void 0 : value === true || value === "true"
  ),
  cc: webSearchCountryCodeSchema.optional(),
  hb: string().optional()
});
export {
  BRAND_LOOKUP_MAX_INPUT_LENGTH as B,
  PROMPT_EXPLORER_MAX_PROMPT_LENGTH as P,
  WEB_SEARCH_COUNTRY_CODES as W,
  brandLookupInputSchema as a,
  brandLookupResultSchema as b,
  promptExplorerModelResultSchema as c,
  PROMPT_EXPLORER_MODELS as d,
  promptExplorerModelSchema as e,
  parseCompetitorList as f,
  promptExplorerSearchSchema as g,
  brandLookupSearchSchema as h,
  promptExplorerInputSchema as p,
  webSearchCountryCodeSchema as w
};
