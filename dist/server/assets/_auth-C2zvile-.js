import { aL as isHostedClientAuthMode, aM as reactExports, aN as jsxRuntimeExports, aR as Outlet } from "./index-CSpjggkr.js";
import { m as Route, j as useNavigate, u as useSession, o as getCurrentAuthRedirect, A as AuthPageShell } from "./router-8qflvY1T.js";
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
function AuthPageLayout() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const {
    data: session,
    isPending
  } = useSession();
  const isHostedMode = isHostedClientAuthMode();
  const redirectTo = getCurrentAuthRedirect(search.redirect);
  reactExports.useEffect(() => {
    if (!session?.user?.id) {
      return;
    }
    void navigate({
      href: redirectTo,
      replace: true
    });
  }, [navigate, redirectTo, session?.user?.id]);
  if (isHostedMode && (isPending || session?.user?.id)) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
}
export {
  AuthPageLayout as component
};
