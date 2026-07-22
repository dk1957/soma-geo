import { G as object, a4 as boolean, Y as number, H as string, aB as domainField, a2 as _enum, aC as rankTrackingConfigs, a3 as array, aD as MAX_TRACKED_KEYWORD_LENGTH } from "./index-CSpjggkr.js";
const devicesEnum = _enum(rankTrackingConfigs.devices.enumValues);
const scheduleEnum = _enum(rankTrackingConfigs.scheduleInterval.enumValues);
const getConfigsSchema = object({
  projectId: string().uuid()
});
const createConfigSchema = object({
  projectId: string().uuid(),
  domain: domainField,
  locationCode: number().int().positive().optional(),
  languageCode: string().max(10).optional(),
  locationName: string().min(1).max(200).optional(),
  devices: devicesEnum.optional(),
  serpDepth: number().int().min(10).max(100).multipleOf(10),
  scheduleInterval: scheduleEnum.optional()
});
const updateConfigSchema = object({
  projectId: string().uuid(),
  configId: string().uuid(),
  domain: domainField.optional(),
  locationCode: number().int().positive().optional(),
  languageCode: string().max(10).optional(),
  locationName: string().min(1).max(200).nullable().optional(),
  devices: devicesEnum.optional(),
  serpDepth: number().int().min(10).max(100).multipleOf(10).optional(),
  scheduleInterval: scheduleEnum.optional(),
  isActive: boolean().optional()
});
const triggerCheckSchema = object({
  projectId: string().uuid(),
  configId: string().uuid(),
  keywordIds: array(string().uuid()).max(2e3).optional()
});
const comparePeriodSchema = _enum(["1d", "7d", "30d", "90d"]);
const getLatestResultsSchema = object({
  projectId: string().uuid(),
  configId: string().uuid(),
  comparePeriod: comparePeriodSchema.optional()
});
const getLatestRunSchema = object({
  projectId: string().uuid(),
  configId: string().uuid()
});
const estimateCostSchema = object({
  projectId: string().uuid(),
  configId: string().uuid()
});
const addKeywordsSchema = object({
  projectId: string().uuid(),
  configId: string().uuid(),
  keywords: array(string().min(1).max(MAX_TRACKED_KEYWORD_LENGTH)).min(1).max(2e3)
});
const removeKeywordsSchema = object({
  projectId: string().uuid(),
  configId: string().uuid(),
  keywordIds: array(string().uuid()).min(1).max(2e3)
});
const refreshMetricsSchema = object({
  projectId: string().uuid(),
  configId: string().uuid()
});
const deviceEnum = _enum(["desktop", "mobile"]);
const sinceDaysField = number().int().positive().max(730).default(365);
const getKeywordHistorySchema = object({
  projectId: string().uuid(),
  configId: string().uuid(),
  trackingKeywordId: string().uuid(),
  sinceDays: sinceDaysField
});
const getConfigTrendSchema = object({
  projectId: string().uuid(),
  configId: string().uuid(),
  device: deviceEnum,
  sinceDays: sinceDaysField
});
const getPositionMatrixSchema = object({
  projectId: string().uuid(),
  configId: string().uuid(),
  device: deviceEnum,
  runLimit: number().int().positive().max(26).default(12)
});
export {
  getLatestResultsSchema as a,
  getLatestRunSchema as b,
  createConfigSchema as c,
  addKeywordsSchema as d,
  estimateCostSchema as e,
  refreshMetricsSchema as f,
  getConfigsSchema as g,
  getKeywordHistorySchema as h,
  getConfigTrendSchema as i,
  getPositionMatrixSchema as j,
  removeKeywordsSchema as r,
  triggerCheckSchema as t,
  updateConfigSchema as u
};
