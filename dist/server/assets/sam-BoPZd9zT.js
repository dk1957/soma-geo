import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { G as object, H as string, y as createServerFn, ac as SamSessionRepository, R as AppError, ad as ProjectRepository } from "./index-CSpjggkr.js";
import { r as requireProjectContext, a as requireAuthenticatedContext } from "./middleware-CNUfdy2z.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
const projectScopedSchema = object({
  projectId: string().min(1)
});
const listSamSessions_createServerFn_handler = createServerRpc({
  id: "1d147786bb4efc50107e0030500c0d345b524d45211d5b5a8496b06fa13b2b18",
  name: "listSamSessions",
  filename: "src/serverFunctions/sam.ts"
}, (opts) => listSamSessions.__executeServer(opts));
const listSamSessions = createServerFn({
  method: "GET"
}).middleware(requireProjectContext).validator(projectScopedSchema).handler(listSamSessions_createServerFn_handler, async ({
  context
}) => {
  return SamSessionRepository.listSessionsForProject(context.projectId, context.userId);
});
const createSamSession_createServerFn_handler = createServerRpc({
  id: "5508a7b8c2ede1eee34a3696a25fb1813f0d30238ed1d48ca28dfbbbe7f5ac14",
  name: "createSamSession",
  filename: "src/serverFunctions/sam.ts"
}, (opts) => createSamSession.__executeServer(opts));
const createSamSession = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(projectScopedSchema).handler(createSamSession_createServerFn_handler, async ({
  context
}) => {
  const session = await SamSessionRepository.createSession({
    projectId: context.projectId,
    userId: context.userId
  });
  if (!session) {
    throw new AppError("INTERNAL_ERROR", "Failed to create chat session");
  }
  return {
    id: session.id
  };
});
const archiveSchema = object({
  sessionId: string().min(1)
});
const archiveSamSession_createServerFn_handler = createServerRpc({
  id: "273ab5dcd2c400c13c6eaf49ea723e422c6435074e7b455c4fa0d0bd03df362a",
  name: "archiveSamSession",
  filename: "src/serverFunctions/sam.ts"
}, (opts) => archiveSamSession.__executeServer(opts));
const archiveSamSession = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).validator(archiveSchema).handler(archiveSamSession_createServerFn_handler, async ({
  data,
  context
}) => {
  const session = await SamSessionRepository.getActiveSession(data.sessionId, context.userId);
  const project = session ? await ProjectRepository.getProjectForOrganization(session.projectId, context.organizationId) : null;
  if (!session || !project) {
    throw new AppError("NOT_FOUND", "Chat session not found");
  }
  await SamSessionRepository.archiveSession(data.sessionId);
  return {
    ok: true
  };
});
export {
  archiveSamSession_createServerFn_handler,
  createSamSession_createServerFn_handler,
  listSamSessions_createServerFn_handler
};
