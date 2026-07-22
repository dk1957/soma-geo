import { r as redditAttributionSchema } from "./reddit-attribution-BMckpR6i.js";
import { p as createSsrRpc } from "./router-8qflvY1T.js";
import { y as createServerFn, G as object, a2 as _enum } from "./index-CSpjggkr.js";
import { a as requireAuthenticatedContext } from "./middleware-CNUfdy2z.js";
const STORAGE_KEY = "openseo:reddit-attribution";
function getStoredRedditAttribution() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = redditAttributionSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
function getBillingRouteState(args) {
  if (args.isSessionPending || !args.hasSession || args.isCustomerLoading) {
    return "loading";
  }
  if (args.isCustomerError) {
    return "error";
  }
  return "ready";
}
function getSubscribeRouteState(args) {
  if (!args.hasSession || args.isCustomerLoading) {
    return "loading";
  }
  if (args.isCustomerError) {
    return "error";
  }
  if (args.planStatus === "paid") {
    return "redirectToApp";
  }
  if (args.hasManagedAccess && !args.isUpgradeFlow) {
    return "redirectToApp";
  }
  if (args.checkoutCompleted) {
    return "finalizing";
  }
  return "showPaywall";
}
const conversionInputSchema = object({
  attribution: redditAttributionSchema,
  eventType: _enum(["SIGN_UP", "PURCHASE"])
});
const captureRedditConversionEvent = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).validator(conversionInputSchema).handler(createSsrRpc("b9d7872b4d5b2bc8034327b3f11e37eb46c7e7ec6bb09b2894b2f9052e3e7ddf"));
export {
  getStoredRedditAttribution as a,
  getBillingRouteState as b,
  captureRedditConversionEvent as c,
  getSubscribeRouteState as g
};
