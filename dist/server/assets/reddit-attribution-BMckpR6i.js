import { G as object, H as string } from "./index-CSpjggkr.js";
const redditAttributionSchema = object({
  clickId: string().trim().min(1).max(256).optional(),
  uuid: string().trim().min(1).max(256).optional(),
  landingPage: string().trim().min(1).max(2048).optional(),
  referrer: string().trim().max(2048).optional(),
  utmSource: string().trim().min(1).max(256).optional(),
  utmMedium: string().trim().min(1).max(256).optional(),
  utmCampaign: string().trim().min(1).max(256).optional(),
  utmTerm: string().trim().min(1).max(256).optional(),
  utmContent: string().trim().min(1).max(256).optional()
});
function hasRedditAttribution(input) {
  return Boolean(
    input.clickId || input.uuid || input.utmSource?.toLowerCase() === "reddit" || input.referrer?.toLowerCase().includes("reddit.")
  );
}
export {
  hasRedditAttribution as h,
  redditAttributionSchema as r
};
