import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { G as object, H as string, y as createServerFn, I as GscService, J as isHostedServerAuthMode, L as hasSelfHostedGscConfig, M as captureServerEvent, O as getPublicOrigin, P as getRequest } from "./index-CSpjggkr.js";
import { waitUntil } from "cloudflare:workers";
import { c as createSelfHostedGscAuthorizationUrl } from "./selfHostedOAuth-CrKFUiz1.js";
import { a as requireAuthenticatedContext, r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
const projectScopedSchema = object({
  projectId: string().min(1)
});
const setSiteSchema = projectScopedSchema.extend({
  accountId: string().min(1),
  siteUrl: string().min(1)
});
const startSelfHostedLinkSchema = object({
  callbackURL: string().min(1)
});
const getGscGrantStatus_createServerFn_handler = createServerRpc({
  id: "b55a517c6ff4161ff3bcf8bfa47562d71dd21f63950855318e723829d164b395",
  name: "getGscGrantStatus",
  filename: "src/serverFunctions/gsc.ts"
}, (opts) => getGscGrantStatus.__executeServer(opts));
const getGscGrantStatus = createServerFn({
  method: "GET"
}).middleware(requireAuthenticatedContext).handler(getGscGrantStatus_createServerFn_handler, async ({
  context
}) => {
  return {
    connected: await GscService.userHasGrant(context.userId)
  };
});
const getGscConnection_createServerFn_handler = createServerRpc({
  id: "0a4a16ebe522d754ddd99b702cf7418577545e6ce062ede31ea16bc201d64943",
  name: "getGscConnection",
  filename: "src/serverFunctions/gsc.ts"
}, (opts) => getGscConnection.__executeServer(opts));
const getGscConnection = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(projectScopedSchema).handler(getGscConnection_createServerFn_handler, async ({
  context
}) => {
  const [connection, currentUserHasGrant, hosted, gscConfigured] = await Promise.all([GscService.getConnection(context.projectId), GscService.userHasGrant(context.userId), isHostedServerAuthMode(), hasSelfHostedGscConfig()]);
  return {
    connected: Boolean(connection),
    currentUserHasGrant,
    googleOAuthConfigured: hosted || gscConfigured,
    siteUrl: connection?.siteUrl ?? null,
    connectedByEmail: connection?.connectedAccountEmail ?? null,
    connectedAt: connection?.createdAt ?? null
  };
});
const listGscSites_createServerFn_handler = createServerRpc({
  id: "956a5e2004016739fc80341f1095d7bd8a96655c6c9fe7ba4126d97f40498e2a",
  name: "listGscSites",
  filename: "src/serverFunctions/gsc.ts"
}, (opts) => listGscSites.__executeServer(opts));
const listGscSites = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(projectScopedSchema).handler(listGscSites_createServerFn_handler, async ({
  context
}) => {
  const [siteList, connection] = await Promise.all([GscService.listSitesForUserWithGrantStatus(context.userId), GscService.getConnection(context.projectId)]);
  let legacySelectionMatched = false;
  return {
    accounts: siteList.accounts.map((grant) => ({
      accountId: grant.accountId,
      email: grant.email,
      requiresReconnect: grant.requiresReconnect,
      sites: grant.sites.map((site) => {
        const isSelected = connection?.gscAccountId ? connection.gscAccountId === grant.accountId && connection.siteUrl === site.siteUrl : !legacySelectionMatched && connection?.siteUrl === site.siteUrl;
        if (!connection?.gscAccountId && isSelected) {
          legacySelectionMatched = true;
        }
        return {
          siteUrl: site.siteUrl,
          permissionLevel: site.permissionLevel,
          selectable: site.permissionLevel !== "siteUnverifiedUser",
          isSelected
        };
      })
    }))
  };
});
const setGscSite_createServerFn_handler = createServerRpc({
  id: "ee56593aa127e081b934d6fec3a8bc310d3d98cbb59dd0947c77be7c85514de4",
  name: "setGscSite",
  filename: "src/serverFunctions/gsc.ts"
}, (opts) => setGscSite.__executeServer(opts));
const setGscSite = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(setSiteSchema).handler(setGscSite_createServerFn_handler, async ({
  data,
  context
}) => {
  const connection = await GscService.setSite({
    projectId: context.projectId,
    organizationId: context.organizationId,
    accountId: data.accountId,
    siteUrl: data.siteUrl,
    userId: context.userId
  });
  waitUntil(captureServerEvent({
    distinctId: context.userId,
    event: "gsc:property_select",
    organizationId: context.organizationId,
    properties: {
      project_id: context.projectId,
      site_url: data.siteUrl
    }
  }));
  return {
    connected: true,
    siteUrl: connection.siteUrl
  };
});
const disconnectGsc_createServerFn_handler = createServerRpc({
  id: "02a3f23c7994a670645e4ace9876310700d9e054aab37095332d1846e11ec462",
  name: "disconnectGsc",
  filename: "src/serverFunctions/gsc.ts"
}, (opts) => disconnectGsc.__executeServer(opts));
const disconnectGsc = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(projectScopedSchema).handler(disconnectGsc_createServerFn_handler, async ({
  context
}) => {
  await GscService.disconnect({
    projectId: context.projectId,
    userId: context.userId
  });
  waitUntil(captureServerEvent({
    distinctId: context.userId,
    event: "gsc:disconnect",
    organizationId: context.organizationId,
    properties: {
      project_id: context.projectId
    }
  }));
  return {
    connected: false
  };
});
const startSelfHostedGscLink_createServerFn_handler = createServerRpc({
  id: "40b504d5f882e6201483a0134c8f88c5b566a334664337c847b00819ab66c6cd",
  name: "startSelfHostedGscLink",
  filename: "src/serverFunctions/gsc.ts"
}, (opts) => startSelfHostedGscLink.__executeServer(opts));
const startSelfHostedGscLink = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).validator(startSelfHostedLinkSchema).handler(startSelfHostedGscLink_createServerFn_handler, async ({
  data,
  context
}) => {
  const publicOrigin = getPublicOrigin(getRequest());
  const url = await createSelfHostedGscAuthorizationUrl({
    user: {
      userId: context.userId,
      userEmail: context.userEmail
    },
    callbackURL: data.callbackURL,
    publicOrigin
  });
  return {
    url
  };
});
export {
  disconnectGsc_createServerFn_handler,
  getGscConnection_createServerFn_handler,
  getGscGrantStatus_createServerFn_handler,
  listGscSites_createServerFn_handler,
  setGscSite_createServerFn_handler,
  startSelfHostedGscLink_createServerFn_handler
};
