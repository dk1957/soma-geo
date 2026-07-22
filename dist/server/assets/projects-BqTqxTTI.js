import { G as object, H as string, aA as isSupportedLanguageCode, Y as number, af as isSupportedLocationCode } from "./index-CSpjggkr.js";
const projectNameField = string().trim().min(1, "Project name is required").max(120);
const projectDomainField = string().trim().max(255).transform((value) => value || void 0).optional();
const projectLocationCodeField = number().int().refine(isSupportedLocationCode, "Unsupported DataForSEO location code").optional();
const projectLanguageCodeField = string().refine(isSupportedLanguageCode, "Unsupported language code").optional();
const hasLocationForLanguage = (input) => input.locationCode != null || input.languageCode == null;
const marketPairMessage = {
  message: "A language requires a location.",
  path: ["languageCode"]
};
const createProjectSchema = object({
  name: projectNameField,
  domain: projectDomainField,
  locationCode: projectLocationCodeField,
  languageCode: projectLanguageCodeField
}).refine(hasLocationForLanguage, marketPairMessage);
const updateProjectSchema = object({
  projectId: string().min(1),
  name: projectNameField,
  domain: projectDomainField,
  locationCode: projectLocationCodeField,
  languageCode: projectLanguageCodeField
}).refine(hasLocationForLanguage, marketPairMessage);
const setProjectDomainSchema = object({
  projectId: string().min(1),
  domain: string().trim().min(1).max(255)
});
const setProjectMarketSchema = object({
  projectId: string().min(1),
  locationCode: number().int().refine(isSupportedLocationCode, "Unsupported DataForSEO location code"),
  languageCode: string().refine(isSupportedLanguageCode, "Unsupported language code")
});
const archiveProjectSchema = object({
  projectId: string().min(1)
});
const restoreProjectSchema = object({
  archivedProjectId: string().min(1)
});
export {
  setProjectMarketSchema as a,
  archiveProjectSchema as b,
  createProjectSchema as c,
  restoreProjectSchema as r,
  setProjectDomainSchema as s,
  updateProjectSchema as u
};
