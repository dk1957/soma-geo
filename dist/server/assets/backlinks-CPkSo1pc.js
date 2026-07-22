import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { y as createServerFn, a6 as backlinksOverviewInputSchema, a7 as BacklinksService, a8 as backlinksRowsPageRequestSchema, a9 as referringDomainsPageRequestSchema, aa as topPagesPageRequestSchema } from "./index-CSpjggkr.js";
import { r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
const WEB_SPAM_OPTIONS = {
  hideSpam: false
};
const getBacklinksOverview_createServerFn_handler = createServerRpc({
  id: "a49c4261f3f65e415401c7162c49edf3e6134bc3554b0b96f1230779dcdebd9b",
  name: "getBacklinksOverview",
  filename: "src/serverFunctions/backlinks.ts"
}, (opts) => getBacklinksOverview.__executeServer(opts));
const getBacklinksOverview = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(backlinksOverviewInputSchema).handler(getBacklinksOverview_createServerFn_handler, async ({
  data,
  context
}) => {
  const profile = await BacklinksService.profileOverview({
    target: data.target,
    scope: data.scope
  }, context);
  return profile.overview;
});
const getBacklinksRows_createServerFn_handler = createServerRpc({
  id: "a4a9247a2916093ffa4adf9b4628e1d7f55af8b119ae1f0147a8b5ef5fd08691",
  name: "getBacklinksRows",
  filename: "src/serverFunctions/backlinks.ts"
}, (opts) => getBacklinksRows.__executeServer(opts));
const getBacklinksRows = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(backlinksRowsPageRequestSchema).handler(getBacklinksRows_createServerFn_handler, ({
  data,
  context
}) => BacklinksService.profileBacklinksPage(data, context, WEB_SPAM_OPTIONS));
const getBacklinksReferringDomains_createServerFn_handler = createServerRpc({
  id: "0c268077775b1f812d23756142e5d64fff541f1240b6328a92da446160513af2",
  name: "getBacklinksReferringDomains",
  filename: "src/serverFunctions/backlinks.ts"
}, (opts) => getBacklinksReferringDomains.__executeServer(opts));
const getBacklinksReferringDomains = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(referringDomainsPageRequestSchema).handler(getBacklinksReferringDomains_createServerFn_handler, ({
  data,
  context
}) => BacklinksService.profileReferringDomainsPage(data, context, WEB_SPAM_OPTIONS));
const getBacklinksTopPages_createServerFn_handler = createServerRpc({
  id: "47f4e168632e9bfd56794677badebb717fc5ce10103810690f0c3bdc5d098227",
  name: "getBacklinksTopPages",
  filename: "src/serverFunctions/backlinks.ts"
}, (opts) => getBacklinksTopPages.__executeServer(opts));
const getBacklinksTopPages = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(topPagesPageRequestSchema).handler(getBacklinksTopPages_createServerFn_handler, ({
  data,
  context
}) => BacklinksService.profileTopPagesPage(data, context));
export {
  getBacklinksOverview_createServerFn_handler,
  getBacklinksReferringDomains_createServerFn_handler,
  getBacklinksRows_createServerFn_handler,
  getBacklinksTopPages_createServerFn_handler
};
