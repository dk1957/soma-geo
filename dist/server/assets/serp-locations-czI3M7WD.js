import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { G as object, H as string, Y as number, a3 as array, bl as assertOk, bm as formatLocationLabel, y as createServerFn } from "./index-CSpjggkr.js";
import { a as requireAuthenticatedContext } from "./middleware-CNUfdy2z.js";
import { env } from "cloudflare:workers";
import { s as serpApi } from "./core-BTSo2kpy.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
const INCLUDED_LOCATION_TYPES = /* @__PURE__ */ new Set([
  "City",
  "County",
  "Municipality",
  "DMA Region",
  "Region"
]);
const locationItemSchema = object({
  location_code: number(),
  location_name: string(),
  location_type: string().nullable().optional()
});
const cachedLocationsSchema = array(
  object({
    locationCode: number(),
    locationName: string(),
    locationType: string(),
    displayLabel: string()
  })
);
const KV_TTL_SECONDS = 30 * 24 * 60 * 60;
const KV_HOT_READ_TTL_SECONDS = 24 * 60 * 60;
function cacheKey(iso) {
  return `serp-locations:${iso}`;
}
async function fetchSerpLocationsForCountry(countryCode) {
  const iso = countryCode.toLowerCase();
  const cached = await env.KV.get(cacheKey(iso), {
    type: "json",
    cacheTtl: KV_HOT_READ_TTL_SECONDS
  });
  const hit = cachedLocationsSchema.safeParse(cached);
  if (hit.success) return hit.data;
  return fillFromOrigin(iso);
}
const inflightFills = /* @__PURE__ */ new Map();
function fillFromOrigin(iso) {
  const inflight = inflightFills.get(iso);
  if (inflight) return inflight;
  const fill = fetchFromDataforseo(iso).then(async (fresh) => {
    await env.KV.put(cacheKey(iso), JSON.stringify(fresh), {
      expirationTtl: KV_TTL_SECONDS
    });
    return fresh;
  }).finally(() => inflightFills.delete(iso));
  inflightFills.set(iso, fill);
  return fill;
}
async function fetchFromDataforseo(iso) {
  const response = await serpApi().googleLocationsCountry(iso);
  const task = assertOk(response);
  return (task.result ?? []).map((item) => locationItemSchema.safeParse(item)).flatMap((parsed) => parsed.success ? [parsed.data] : []).filter((item) => INCLUDED_LOCATION_TYPES.has(item.location_type ?? "")).map((item) => ({
    locationCode: item.location_code,
    locationName: item.location_name,
    displayLabel: formatLocationLabel(item.location_name),
    locationType: item.location_type ?? ""
  }));
}
const countryCodeField = string().regex(/^[a-z]{2}$/i);
const searchSerpLocationsSchema = object({
  query: string().min(1).max(100),
  countryCode: countryCodeField
});
const searchSerpLocations_createServerFn_handler = createServerRpc({
  id: "16b95567643a21275b38fde625b8e1428bd2aeaff2440637c2a21009637d64d9",
  name: "searchSerpLocations",
  filename: "src/serverFunctions/serp-locations.ts"
}, (opts) => searchSerpLocations.__executeServer(opts));
const searchSerpLocations = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).validator(searchSerpLocationsSchema).handler(searchSerpLocations_createServerFn_handler, async ({
  data
}) => {
  const all = await fetchSerpLocationsForCountry(data.countryCode);
  const needle = data.query.trim().toLowerCase();
  return all.filter((loc) => loc.displayLabel.toLowerCase().includes(needle)).slice(0, 10);
});
const prewarmSerpLocations_createServerFn_handler = createServerRpc({
  id: "364efb68f010cdd93e01da48b22253ac6e745a792ce18710f489a70100cde203",
  name: "prewarmSerpLocations",
  filename: "src/serverFunctions/serp-locations.ts"
}, (opts) => prewarmSerpLocations.__executeServer(opts));
const prewarmSerpLocations = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).validator(object({
  countryCode: countryCodeField
})).handler(prewarmSerpLocations_createServerFn_handler, async ({
  data
}) => {
  await fetchSerpLocationsForCountry(data.countryCode);
  return {
    warmed: true
  };
});
export {
  prewarmSerpLocations_createServerFn_handler,
  searchSerpLocations_createServerFn_handler
};
