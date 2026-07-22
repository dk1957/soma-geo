import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { y as createServerFn, ab as ProjectService, R as AppError, G as object, Y as number, H as string, ad as ProjectRepository, af as isSupportedLocationCode, ae as normalizeDomainInput, T as db, ag as projects, ah as getLanguageCode, V as and, W as eq } from "./index-CSpjggkr.js";
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
const getOnboardingChatState_createServerFn_handler = createServerRpc({
  id: "3dbeccce043161813d8711ff4113fda42d161033a0efa91044658e370c98be80",
  name: "getOnboardingChatState",
  filename: "src/serverFunctions/onboardingChat.ts"
}, (opts) => getOnboardingChatState.__executeServer(opts));
const getOnboardingChatState = createServerFn({
  method: "GET"
}).middleware(requireAuthenticatedContext).handler(getOnboardingChatState_createServerFn_handler, async ({
  context
}) => {
  const [project] = await ProjectService.listProjectsEnsuringOne(context.organizationId);
  if (!project) {
    throw new AppError("NOT_FOUND");
  }
  return {
    projectId: project.id,
    domain: project.domain
  };
});
const saveSiteSchema = object({
  projectId: string().min(1),
  domain: string().min(1),
  locationCode: number().int()
});
const saveOnboardingSite_createServerFn_handler = createServerRpc({
  id: "a6e76ddc449222a502da7b7425f361fcfb4df793782aee76909707bf70ee90d4",
  name: "saveOnboardingSite",
  filename: "src/serverFunctions/onboardingChat.ts"
}, (opts) => saveOnboardingSite.__executeServer(opts));
const saveOnboardingSite = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).validator(saveSiteSchema).handler(saveOnboardingSite_createServerFn_handler, async ({
  data,
  context
}) => {
  const project = await ProjectRepository.getProjectForOrganization(data.projectId, context.organizationId);
  if (!project) {
    throw new AppError("NOT_FOUND");
  }
  if (!isSupportedLocationCode(data.locationCode)) {
    throw new AppError("VALIDATION_ERROR", "Unsupported location");
  }
  const newDomain = normalizeDomainInput(data.domain, false);
  await db.update(projects).set({
    domain: newDomain,
    locationCode: data.locationCode,
    languageCode: getLanguageCode(data.locationCode)
  }).where(and(eq(projects.id, data.projectId), eq(projects.organizationId, context.organizationId)));
  return {
    ok: true
  };
});
export {
  getOnboardingChatState_createServerFn_handler,
  saveOnboardingSite_createServerFn_handler
};
