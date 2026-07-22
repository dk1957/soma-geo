import { bq as autumnSeoDataCreditsToUsd, al as AUTUMN_SEO_DATA_BALANCE_FEATURE_ID, am as AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID, aN as jsxRuntimeExports, aS as SUBSCRIBE_ROUTE, br as BILLING_ROUTE, bs as LOW_CREDITS_THRESHOLD_USD, aM as reactExports, aR as Outlet } from "./index-CSpjggkr.js";
import { u as useSession, z as useCustomer, B as getCustomerPlanStatus, L as Link, X as Route, j as useNavigate, s as useQuery, v as getErrorCode, g as getSignInSearch, k as getCurrentAuthRedirectFromHref } from "./router-8qflvY1T.js";
import { u as useOnboardingRedirect, a as useLocation, A as AuthenticatedAppLayout } from "./useOnboardingRedirect-IbP39rTM.js";
import { s as setLastProjectId } from "./active-project-DUKzBpe_.js";
import { u as useHostedAuthRouteGuard } from "./useHostedAuthRouteGuard-BnC8MNzV.js";
import { b as getProjectAccess } from "./projects-Ca8yAMNt.js";
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
import "./check-C_HETtUw.js";
import "./projects-BqTqxTTI.js";
function FreePlanBanner() {
  const { data: session } = useSession();
  const customerQuery = useCustomer({
    queryOptions: {
      enabled: Boolean(session?.user?.id)
    }
  });
  if (customerQuery.isLoading || !customerQuery.data) {
    return null;
  }
  const planStatus = getCustomerPlanStatus(customerQuery.data);
  const isFreePlan = planStatus === "free";
  const monthlyRemaining = autumnSeoDataCreditsToUsd(
    customerQuery.data.balances?.[AUTUMN_SEO_DATA_BALANCE_FEATURE_ID]?.remaining ?? 0
  );
  const topUpRemaining = autumnSeoDataCreditsToUsd(
    customerQuery.data.balances?.[AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID]?.remaining ?? 0
  );
  const totalRemaining = monthlyRemaining + topUpRemaining;
  const isOutOfCredits = totalRemaining <= 0;
  const isLowCredits = !isOutOfCredits && totalRemaining < LOW_CREDITS_THRESHOLD_USD;
  const creditsActionLink = isFreePlan ? /* @__PURE__ */ jsxRuntimeExports.jsx(
    Link,
    {
      to: SUBSCRIBE_ROUTE,
      search: { upgrade: true },
      className: "link link-primary font-medium",
      children: "Upgrade your plan"
    }
  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: BILLING_ROUTE, className: "link link-primary font-medium", children: "Buy more credits" });
  if (isOutOfCredits) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(BannerShell, { variant: "error", children: [
      "You’ve used all your credits. ",
      creditsActionLink,
      " to continue using OpenSEO."
    ] });
  }
  if (isLowCredits) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(BannerShell, { variant: "warning", children: [
      "You’re running low on credits. ",
      creditsActionLink,
      " to keep using OpenSEO."
    ] });
  }
  if (isFreePlan) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(BannerShell, { variant: "info", children: [
      "We hope you’re enjoying OpenSEO!",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: SUBSCRIBE_ROUTE,
          search: { upgrade: true },
          className: "link link-primary font-medium",
          children: "Upgrade anytime"
        }
      ),
      " ",
      "or",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/support", className: "link link-primary font-medium", children: "reach out with questions" }),
      "."
    ] });
  }
  return null;
}
function BannerShell({
  variant,
  children
}) {
  const alertClass = variant === "error" ? "alert-error" : variant === "warning" ? "alert-warning" : "alert-info";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 px-4 py-2.5 md:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-7xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `alert text-sm ${alertClass}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children }) }) }) });
}
function useProjectAccessRedirect(projectId) {
  const navigate = useNavigate();
  const access = useQuery({
    queryKey: ["projectAccess", projectId],
    queryFn: () => getProjectAccess({
      data: {
        projectId
      }
    }),
    // A failed check redirects away — retrying would just delay it.
    retry: false,
    // One check per project per tab; a revoked project still dead-ends at
    // every data call, so there's nothing to re-validate here.
    staleTime: Infinity
  });
  const error = access.error;
  reactExports.useEffect(() => {
    if (!error) return;
    if (getErrorCode(error) === "UNAUTHENTICATED") {
      void navigate({
        to: "/sign-in",
        search: getSignInSearch(getCurrentAuthRedirectFromHref(window.location.href)),
        replace: true
      });
      return;
    }
    void navigate({
      to: "/",
      replace: true
    });
  }, [error, navigate]);
}
function ProjectLayout() {
  const {
    projectId
  } = Route.useParams();
  const authGate = useHostedAuthRouteGuard();
  useOnboardingRedirect();
  useProjectAccessRedirect(projectId);
  const isSettingsPage = useLocation({
    select: (l) => l.pathname.endsWith("/settings")
  });
  reactExports.useEffect(() => {
    if (isSettingsPage) return;
    setLastProjectId(projectId);
  }, [projectId, isSettingsPage]);
  if (!authGate.canRenderAuthenticatedContent) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthenticatedAppLayout, { projectId, banner: authGate.isHostedMode ? /* @__PURE__ */ jsxRuntimeExports.jsx(FreePlanBanner, {}) : void 0, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
}
export {
  ProjectLayout as component
};
