import { aN as jsxRuntimeExports, aR as Outlet } from "./index-CSpjggkr.js";
import { A as AuthPageShell } from "./router-8qflvY1T.js";
import { u as useHostedAuthRouteGuard } from "./useHostedAuthRouteGuard-BnC8MNzV.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
import "./middleware-CNUfdy2z.js";
import "./selfHostedOAuth-CrKFUiz1.js";
import "./ai-search-gke0D25z.js";
import "./keywords-B1vFn2Y-.js";
import "./audit-qXiCYzw5.js";
import "stream";
import "./lighthouse-BaqnXs-3.js";
import "./lighthouse-CxIZIYPF.js";
function AuthenticatedShellLayout() {
  const authGate = useHostedAuthRouteGuard();
  if (!authGate.isHostedMode || !authGate.canRenderAuthenticatedContent) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
}
export {
  AuthenticatedShellLayout as component
};
