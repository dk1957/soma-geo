import { c as createServerRpc } from "./createServerRpc-UQi_Y4oM.js";
import { G as object, H as string, y as createServerFn, J as isHostedServerAuthMode, at as getOptionalEnvValue } from "./index-CSpjggkr.js";
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
const OPENROUTER_KEY_MISSING_MESSAGE = "OPENROUTER_API_KEY is not set for this deployment yet. Add it to your environment, restart OpenSEO, then confirm here.";
const projectScopedSchema = object({
  projectId: string().min(1)
});
const getSamAccessSetupStatus_createServerFn_handler = createServerRpc({
  id: "57eebe4b148ecd8baeab46c7dc1c92b78de5e9a45d9f805e437b74cda250d02e",
  name: "getSamAccessSetupStatus",
  filename: "src/serverFunctions/samAccess.ts"
}, (opts) => getSamAccessSetupStatus.__executeServer(opts));
const getSamAccessSetupStatus = createServerFn({
  method: "GET"
}).middleware(requireProjectContext).validator(projectScopedSchema).handler(getSamAccessSetupStatus_createServerFn_handler, async () => {
  if (await isHostedServerAuthMode()) {
    return {
      enabled: true,
      errorMessage: null
    };
  }
  const enabled = Boolean(await getOptionalEnvValue("OPENROUTER_API_KEY"));
  return {
    enabled,
    errorMessage: enabled ? null : OPENROUTER_KEY_MISSING_MESSAGE
  };
});
export {
  getSamAccessSetupStatus_createServerFn_handler
};
