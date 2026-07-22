import { aN as jsxRuntimeExports, aR as Outlet } from "./index-CSpjggkr.js";
import { u as useHostedAuthRouteGuard } from "./useHostedAuthRouteGuard-BnC8MNzV.js";
import { u as useOnboardingRedirect, A as AuthenticatedAppLayout } from "./useOnboardingRedirect-IbP39rTM.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
import "./router-8qflvY1T.js";
import "./middleware-CNUfdy2z.js";
import "./selfHostedOAuth-CrKFUiz1.js";
import "./ai-search-gke0D25z.js";
import "./keywords-B1vFn2Y-.js";
import "./audit-qXiCYzw5.js";
import "stream";
import "./lighthouse-BaqnXs-3.js";
import "./lighthouse-CxIZIYPF.js";
import "./startGscLink-DDsqhlAZ.js";
import "./search-D1JnBu8u.js";
import "./trending-up-X-1NsOJn.js";
import "./globe-xsi-TwrE.js";
import "./link-2-DINJs8Ac.js";
import "./sparkles-D0nOSwIL.js";
import "./message-square-CT-tSvNg.js";
import "./samQueries-cDPgZMT_.js";
import "./plus-ClJgelga.js";
import "./archive-BFXQyJA4.js";
import "./ThemePreferenceMenuItems-Mim5Z20v.js";
import "./monitor-DC1ylG5-.js";
import "./sun-DMRQvIlV.js";
import "./user-C7Ul5Qsq.js";
import "./settings-CYIgHtaE.js";
import "./triangle-alert-CtV7H1mP.js";
import "./Modal-BjHJzLad.js";
import "./projects-Ca8yAMNt.js";
import "./projects-BqTqxTTI.js";
import "./active-project-DUKzBpe_.js";
import "./check-C_HETtUw.js";
function AppRouteLayout() {
  const authGate = useHostedAuthRouteGuard();
  useOnboardingRedirect();
  if (!authGate.canRenderAuthenticatedContent) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthenticatedAppLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
}
export {
  AppRouteLayout as component
};
