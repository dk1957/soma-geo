import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { G as object, a4 as boolean, a2 as _enum, H as string, a3 as array, y as createServerFn, T as db, W as eq, an as userOnboardingAnswers, ao as user } from "./index-CSpjggkr.js";
import { a as requireAuthenticatedContext } from "./middleware-CNUfdy2z.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
const onboardingAnswersSchema = object({
  interestedFeatures: array(string()).optional(),
  workFor: string().optional(),
  clientWebsiteCount: string().optional(),
  foundVia: string().optional(),
  mcpSetupIntent: _enum(["yes", "no"]).optional(),
  completed: boolean().optional()
});
const getOnboardingAnswers_createServerFn_handler = createServerRpc({
  id: "f3ccdf1c5f7849adbe55a38000c0c568b1f72b75fea6deea496f965b8c7ab155",
  name: "getOnboardingAnswers",
  filename: "src/serverFunctions/onboarding.ts"
}, (opts) => getOnboardingAnswers.__executeServer(opts));
const getOnboardingAnswers = createServerFn({
  method: "GET"
}).middleware(requireAuthenticatedContext).handler(getOnboardingAnswers_createServerFn_handler, async ({
  context
}) => {
  const answers = await db.query.userOnboardingAnswers.findFirst({
    columns: {
      completedAt: true,
      gscNudgeDismissedAt: true,
      interestedFeatures: true,
      workFor: true,
      clientWebsiteCount: true,
      foundVia: true,
      mcpSetupIntent: true
    },
    where: eq(userOnboardingAnswers.userId, context.userId)
  });
  const userRecord = await db.query.user.findFirst({
    columns: {
      createdAt: true
    },
    where: eq(user.id, context.userId)
  });
  let interestedFeatures = [];
  if (answers?.interestedFeatures) {
    try {
      const parsed = JSON.parse(answers.interestedFeatures);
      if (Array.isArray(parsed)) {
        interestedFeatures = parsed.filter((value) => typeof value === "string");
      }
    } catch {
      interestedFeatures = [];
    }
  }
  return {
    completedAt: answers?.completedAt ?? null,
    gscNudgeDismissedAt: answers?.gscNudgeDismissedAt ?? null,
    userCreatedAt: userRecord?.createdAt?.toISOString() ?? null,
    answers: {
      interestedFeatures,
      workFor: answers?.workFor ?? null,
      clientWebsiteCount: answers?.clientWebsiteCount ?? null,
      foundVia: answers?.foundVia ?? null,
      mcpSetupIntent: answers?.mcpSetupIntent ?? null
    }
  };
});
const saveOnboardingAnswers_createServerFn_handler = createServerRpc({
  id: "9059a6b8babf4dd972195adcbd6d5b0a44a9abda3a66071b8b90e201141c10d5",
  name: "saveOnboardingAnswers",
  filename: "src/serverFunctions/onboarding.ts"
}, (opts) => saveOnboardingAnswers.__executeServer(opts));
const saveOnboardingAnswers = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).validator(onboardingAnswersSchema).handler(saveOnboardingAnswers_createServerFn_handler, async ({
  data,
  context
}) => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const completedAt = data.completed ? now : void 0;
  const set = {
    ...data.interestedFeatures ? {
      interestedFeatures: JSON.stringify(data.interestedFeatures)
    } : {},
    ...data.workFor !== void 0 ? {
      workFor: data.workFor
    } : {},
    ...data.clientWebsiteCount !== void 0 ? {
      clientWebsiteCount: data.clientWebsiteCount
    } : {},
    ...data.foundVia !== void 0 ? {
      foundVia: data.foundVia
    } : {},
    ...data.mcpSetupIntent !== void 0 ? {
      mcpSetupIntent: data.mcpSetupIntent
    } : {},
    // Completing onboarding means the user passed the Search Console step, so
    // resolve the GSC prompt — the legacy re-engagement nudge must not fire
    // for anyone who already saw that step.
    ...completedAt !== void 0 ? {
      completedAt,
      gscNudgeDismissedAt: completedAt
    } : {},
    updatedAt: now
  };
  await db.insert(userOnboardingAnswers).values({
    userId: context.userId,
    organizationId: context.organizationId,
    interestedFeatures: JSON.stringify(data.interestedFeatures ?? []),
    workFor: data.workFor,
    clientWebsiteCount: data.clientWebsiteCount,
    foundVia: data.foundVia,
    mcpSetupIntent: data.mcpSetupIntent,
    completedAt,
    gscNudgeDismissedAt: completedAt,
    updatedAt: now
  }).onConflictDoUpdate({
    target: userOnboardingAnswers.userId,
    set
  });
  return {
    ok: true
  };
});
const dismissGscNudge_createServerFn_handler = createServerRpc({
  id: "5036bfbbb0648430f1305a7b8a9540118bd537d96bd6f393c94d703319ee3282",
  name: "dismissGscNudge",
  filename: "src/serverFunctions/onboarding.ts"
}, (opts) => dismissGscNudge.__executeServer(opts));
const dismissGscNudge = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).handler(dismissGscNudge_createServerFn_handler, async ({
  context
}) => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.insert(userOnboardingAnswers).values({
    userId: context.userId,
    organizationId: context.organizationId,
    gscNudgeDismissedAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: userOnboardingAnswers.userId,
    set: {
      gscNudgeDismissedAt: now,
      updatedAt: now
    }
  });
  return {
    ok: true
  };
});
export {
  dismissGscNudge_createServerFn_handler,
  getOnboardingAnswers_createServerFn_handler,
  saveOnboardingAnswers_createServerFn_handler
};
