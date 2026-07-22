import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { G as object, a3 as array, H as string, Y as number, y as createServerFn, ae as normalizeDomainInput } from "./index-CSpjggkr.js";
import { env } from "cloudflare:workers";
import { t } from "./chunk-DhtMgbSE.js";
import { r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
const AHREFS_DR_ENDPOINT = "https://api.ahrefs.com/v3/public/domain-rating-free";
const CACHE_PREFIX = "ahrefs-dr:";
const CACHE_TTL_SECONDS = 86400;
const FETCH_TIMEOUT_MS = 5e3;
const FETCH_BATCH_SIZE = 20;
const MAX_DOMAINS_PER_CALL = 100;
const domainRatingsInputSchema = object({
  projectId: string().min(1),
  domains: array(string().trim().min(1).max(253)).max(MAX_DOMAINS_PER_CALL)
});
const ahrefsResponseSchema = object({
  domain_rating: object({
    domain_rating: number().min(0).max(100)
  })
});
const getAhrefsDomainRatings_createServerFn_handler = createServerRpc({
  id: "319d82ec75b2b49399d07e97a0efffd36bd56066017d95b692e7074cae6b1272",
  name: "getAhrefsDomainRatings",
  filename: "src/serverFunctions/ahrefs.ts"
}, (opts) => getAhrefsDomainRatings.__executeServer(opts));
const getAhrefsDomainRatings = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(domainRatingsInputSchema).handler(getAhrefsDomainRatings_createServerFn_handler, async ({
  data
}) => {
  const result = {};
  const originalsByDomain = /* @__PURE__ */ new Map();
  for (const original of data.domains) {
    const domain = normalizeDomainInput(original, true);
    const existing = originalsByDomain.get(domain);
    if (existing) existing.push(original);
    else originalsByDomain.set(domain, [original]);
  }
  const ratings = /* @__PURE__ */ new Map();
  for (const batch of t([...originalsByDomain.keys()], FETCH_BATCH_SIZE)) {
    const resolved = await Promise.all(batch.map(async (domain) => {
      try {
        return [domain, await resolveDomainRating(domain)];
      } catch {
        return [domain, null];
      }
    }));
    for (const [domain, dr] of resolved) ratings.set(domain, dr);
  }
  for (const [domain, originals] of originalsByDomain) {
    const dr = ratings.get(domain) ?? null;
    for (const original of originals) result[original] = dr;
  }
  return result;
});
async function resolveDomainRating(domain) {
  const cacheKey = `${CACHE_PREFIX}${domain}`;
  const cached = await env.KV.get(cacheKey);
  if (cached !== null) return parseCachedRating(cached);
  const dr = await fetchDomainRating(domain);
  await env.KV.put(cacheKey, JSON.stringify(dr), {
    expirationTtl: CACHE_TTL_SECONDS
  });
  return dr;
}
async function fetchDomainRating(domain) {
  const response = await fetch(`${AHREFS_DR_ENDPOINT}?target=${encodeURIComponent(domain)}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) {
    throw new Error(`Ahrefs DR lookup failed with status ${response.status}`);
  }
  const parsed = ahrefsResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Ahrefs DR lookup returned an unexpected response");
  }
  const dr = parsed.data.domain_rating.domain_rating;
  return dr > 0 ? dr : null;
}
function parseCachedRating(raw) {
  try {
    const value = JSON.parse(raw);
    return typeof value === "number" && value > 0 ? value : null;
  } catch {
    return null;
  }
}
export {
  getAhrefsDomainRatings_createServerFn_handler
};
