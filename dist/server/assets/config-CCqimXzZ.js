import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { env } from "cloudflare:workers";
import { y as createServerFn } from "./index-CSpjggkr.js";
import { a as requireAuthenticatedContext } from "./middleware-CNUfdy2z.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
const getSeoApiKeyStatus_createServerFn_handler = createServerRpc({
  id: "b5858986f4b26fbc7f2cea62479e3b4d97d5c4af0a61b218af88501443a3939c",
  name: "getSeoApiKeyStatus",
  filename: "src/serverFunctions/config.ts"
}, (opts) => getSeoApiKeyStatus.__executeServer(opts));
const getSeoApiKeyStatus = createServerFn({
  method: "GET"
}).middleware(requireAuthenticatedContext).handler(getSeoApiKeyStatus_createServerFn_handler, () => {
  const configured = Boolean(env.DATAFORSEO_API_KEY?.trim());
  return {
    configured
  };
});
export {
  getSeoApiKeyStatus_createServerFn_handler
};
