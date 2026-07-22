import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { y as createServerFn, A as domainOverviewSchema, B as resolveLabsMarket, D as DomainService, C as domainKeywordSuggestionsSchema, E as domainKeywordsPageRequestSchema, F as domainPagesPageRequestSchema } from "./index-CSpjggkr.js";
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
const getDomainOverview_createServerFn_handler = createServerRpc({
  id: "046776517b68d488e3ee09004a9f31a90f45c35a2b32b60dc538eaaf00a36b9c",
  name: "getDomainOverview",
  filename: "src/serverFunctions/domain.ts"
}, (opts) => getDomainOverview.__executeServer(opts));
const getDomainOverview = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(domainOverviewSchema).handler(getDomainOverview_createServerFn_handler, async ({
  data,
  context
}) => {
  const input = {
    ...data,
    ...resolveLabsMarket(data, context.project),
    projectId: context.projectId
  };
  return DomainService.getOverview(input, context);
});
const getDomainKeywordSuggestions_createServerFn_handler = createServerRpc({
  id: "0c8bc9b67b0ea0a9717a6cab4355542e7c451887732f6d9ee99a8f0ed33cf5de",
  name: "getDomainKeywordSuggestions",
  filename: "src/serverFunctions/domain.ts"
}, (opts) => getDomainKeywordSuggestions.__executeServer(opts));
const getDomainKeywordSuggestions = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(domainKeywordSuggestionsSchema).handler(getDomainKeywordSuggestions_createServerFn_handler, async ({
  data,
  context
}) => DomainService.getSuggestedKeywords({
  ...data,
  ...resolveLabsMarket(data, context.project),
  organizationId: context.organizationId,
  projectId: context.projectId
}, context));
const getDomainKeywordsPage_createServerFn_handler = createServerRpc({
  id: "048f26ede391a38ee6e00487163fdc66dd0897e3a1cc488354a840bbf9b0b9cf",
  name: "getDomainKeywordsPage",
  filename: "src/serverFunctions/domain.ts"
}, (opts) => getDomainKeywordsPage.__executeServer(opts));
const getDomainKeywordsPage = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(domainKeywordsPageRequestSchema).handler(getDomainKeywordsPage_createServerFn_handler, async ({
  data,
  context
}) => {
  const input = {
    ...data,
    ...resolveLabsMarket(data, context.project),
    projectId: context.projectId
  };
  return DomainService.getKeywordsPage(input, context);
});
const getDomainPagesPage_createServerFn_handler = createServerRpc({
  id: "02829e30c3478ce6fa128dba7467f3adc8a4086892ed668b6f9ca56a3b1c0c8b",
  name: "getDomainPagesPage",
  filename: "src/serverFunctions/domain.ts"
}, (opts) => getDomainPagesPage.__executeServer(opts));
const getDomainPagesPage = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(domainPagesPageRequestSchema).handler(getDomainPagesPage_createServerFn_handler, async ({
  data,
  context
}) => {
  const input = {
    ...data,
    ...resolveLabsMarket(data, context.project),
    projectId: context.projectId
  };
  return DomainService.getPagesPage(input, context);
});
export {
  getDomainKeywordSuggestions_createServerFn_handler,
  getDomainKeywordsPage_createServerFn_handler,
  getDomainOverview_createServerFn_handler,
  getDomainPagesPage_createServerFn_handler
};
