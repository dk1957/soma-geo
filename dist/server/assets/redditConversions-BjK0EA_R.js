import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { T as db, W as eq, bn as redditAttributions, G as object, a2 as _enum, y as createServerFn } from "./index-CSpjggkr.js";
import { env } from "cloudflare:workers";
import { h as hasRedditAttribution, r as redditAttributionSchema } from "./reddit-attribution-BMckpR6i.js";
import { a as requireAuthenticatedContext } from "./middleware-CNUfdy2z.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
function getEnv(name) {
  const value = Reflect.get(env, name);
  return typeof value === "string" ? value.trim() : "";
}
async function sha256(value) {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function getRedditConfig() {
  const pixelId = getEnv("REDDIT_PIXEL_ID");
  const accessToken = getEnv("REDDIT_CONVERSIONS_ACCESS_TOKEN");
  if (!pixelId || !accessToken) return null;
  return { accessToken, pixelId };
}
async function upsertAttribution(args) {
  const existing = await db.query.redditAttributions.findFirst({
    where: eq(redditAttributions.userId, args.userId)
  });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (existing) {
    await db.update(redditAttributions).set({
      clickId: existing.clickId ?? args.attribution.clickId,
      uuid: existing.uuid ?? args.attribution.uuid,
      landingPage: existing.landingPage ?? args.attribution.landingPage,
      referrer: existing.referrer ?? args.attribution.referrer,
      utmSource: existing.utmSource ?? args.attribution.utmSource,
      utmMedium: existing.utmMedium ?? args.attribution.utmMedium,
      utmCampaign: existing.utmCampaign ?? args.attribution.utmCampaign,
      utmTerm: existing.utmTerm ?? args.attribution.utmTerm,
      utmContent: existing.utmContent ?? args.attribution.utmContent,
      updatedAt: now
    }).where(eq(redditAttributions.userId, args.userId));
  } else {
    await db.insert(redditAttributions).values({
      id: crypto.randomUUID(),
      userId: args.userId,
      organizationId: args.organizationId,
      clickId: args.attribution.clickId,
      uuid: args.attribution.uuid,
      landingPage: args.attribution.landingPage,
      referrer: args.attribution.referrer,
      utmSource: args.attribution.utmSource,
      utmMedium: args.attribution.utmMedium,
      utmCampaign: args.attribution.utmCampaign,
      utmTerm: args.attribution.utmTerm,
      utmContent: args.attribution.utmContent,
      createdAt: now,
      updatedAt: now
    });
  }
  return args.eventType === "SIGN_UP" ? Boolean(existing?.signupSentAt) : Boolean(existing?.purchaseSentAt);
}
async function markConversionSent(args) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const sentColumn = args.eventType === "SIGN_UP" ? "signupSentAt" : "purchaseSentAt";
  await db.update(redditAttributions).set({
    [sentColumn]: now,
    updatedAt: now
  }).where(eq(redditAttributions.userId, args.userId));
}
async function captureRedditConversion(args) {
  if (!hasRedditAttribution(args.attribution)) return "skipped";
  const alreadySent = await upsertAttribution(args);
  if (alreadySent) return "already_sent";
  const config = getRedditConfig();
  if (!config) return "stored";
  const metadata = {
    conversion_id: args.conversionId
  };
  if (args.valueDecimal !== void 0) {
    metadata.currency = args.currency ?? "USD";
    metadata.item_count = 1;
    metadata.value = args.valueDecimal;
  }
  const payload = {
    data: {
      events: [
        {
          action_source: "WEBSITE",
          click_id: args.attribution.clickId,
          event_at: Date.now(),
          metadata,
          type: {
            tracking_type: args.eventType
          },
          user: {
            email: await sha256(args.email),
            external_id: await sha256(args.userId),
            uuid: args.attribution.uuid
          }
        }
      ]
    }
  };
  const response = await fetch(
    `https://ads-api.reddit.com/api/v3/pixels/${config.pixelId}/conversion_events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );
  if (!response.ok) {
    console.error("reddit conversion capture failed", {
      status: response.status,
      eventType: args.eventType,
      userId: args.userId
    });
    return "failed";
  }
  await markConversionSent(args);
  return "sent";
}
const conversionInputSchema = object({
  attribution: redditAttributionSchema,
  eventType: _enum(["SIGN_UP", "PURCHASE"])
});
const captureRedditConversionEvent_createServerFn_handler = createServerRpc({
  id: "b9d7872b4d5b2bc8034327b3f11e37eb46c7e7ec6bb09b2894b2f9052e3e7ddf",
  name: "captureRedditConversionEvent",
  filename: "src/serverFunctions/redditConversions.ts"
}, (opts) => captureRedditConversionEvent.__executeServer(opts));
const captureRedditConversionEvent = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).validator(conversionInputSchema).handler(captureRedditConversionEvent_createServerFn_handler, async ({
  data,
  context
}) => {
  const status = await captureRedditConversion({
    attribution: data.attribution,
    conversionId: `${data.eventType === "SIGN_UP" ? "signup" : "purchase"}:${context.userId}`,
    email: context.userEmail,
    eventType: data.eventType,
    organizationId: context.organizationId,
    userId: context.userId,
    valueDecimal: data.eventType === "PURCHASE" ? 10 : void 0,
    currency: data.eventType === "PURCHASE" ? "USD" : void 0
  });
  return {
    status
  };
});
export {
  captureRedditConversionEvent_createServerFn_handler
};
