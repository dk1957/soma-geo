import { aM as reactExports, aL as isHostedClientAuthMode, aT as AUTUMN_MANAGED_ACCESS_FEATURE_ID, aN as jsxRuntimeExports, aU as AUTUMN_PAID_PLAN_ID } from "./index-CSpjggkr.js";
import { j as useNavigate, y as Route, u as useSession, z as useCustomer, B as getCustomerPlanStatus, c as captureClientEvent, x as getStandardErrorMessage, L as Link, C as signOutAndRedirect } from "./router-8qflvY1T.js";
import { T as ThemePreferenceMenuItems } from "./ThemePreferenceMenuItems-Mim5Z20v.js";
import { g as getSubscribeRouteState, a as getStoredRedditAttribution, c as captureRedditConversionEvent } from "./redditConversions-CQtLmZwg.js";
import { A as ArrowRight } from "./arrow-right-m9BKobJ5.js";
import { U as User } from "./user-C7Ul5Qsq.js";
import { S as Settings } from "./settings-CYIgHtaE.js";
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
import "./monitor-DC1ylG5-.js";
import "./sun-DMRQvIlV.js";
import "./reddit-attribution-BMckpR6i.js";
const SUPPORT_EMAIL = "ben@openseo.so";
const PLAN_FEATURES = ["Keyword research, backlinks, rank tracking, and site audits", "MCP server and agent skills for Claude, Cursor, and ChatGPT", "Google Search Console Integration", "Includes $10.00 of Usage Credits each month"];
function SubscribePage() {
  const navigate = useNavigate();
  const {
    upgrade: isUpgradeFlow,
    redirect
  } = Route.useSearch();
  const {
    data: session
  } = useSession();
  const [isAttaching, setIsAttaching] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const checkoutCompleted = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("checkout") === "success";
  const hasSession = Boolean(session?.user?.id);
  const customerQuery = useCustomer({
    queryOptions: {
      enabled: hasSession
    }
  });
  const hasManagedAccess = isHostedClientAuthMode() ? customerQuery.check({
    featureId: AUTUMN_MANAGED_ACCESS_FEATURE_ID
  }).allowed : true;
  const planStatus = getCustomerPlanStatus(customerQuery.data);
  const subscribeRouteState = getSubscribeRouteState({
    hasSession,
    isCustomerLoading: customerQuery.isLoading,
    isCustomerError: customerQuery.isError,
    hasManagedAccess,
    planStatus,
    isUpgradeFlow: isUpgradeFlow === true,
    checkoutCompleted
  });
  const isFinalizing = subscribeRouteState === "finalizing";
  reactExports.useEffect(() => {
    if (!isFinalizing) return;
    const interval = setInterval(() => {
      void customerQuery.refetch();
    }, 2e3);
    return () => clearInterval(interval);
  }, [customerQuery, isFinalizing]);
  reactExports.useEffect(() => {
    if (subscribeRouteState === "redirectToApp") {
      const destination = redirect ?? "/";
      const [destinationPath, destinationQuery] = destination.split("?");
      const destinationSearch = destinationQuery ? Object.fromEntries(new URLSearchParams(destinationQuery)) : {};
      const goToApp = () => void navigate({
        to: destinationPath,
        search: destinationSearch,
        replace: true
      });
      if (checkoutCompleted) {
        captureClientEvent("billing:checkout_success");
        const attribution = getStoredRedditAttribution();
        if (attribution) {
          void captureRedditConversionEvent({
            data: {
              attribution,
              eventType: "PURCHASE"
            }
          }).finally(goToApp);
          return;
        }
      }
      goToApp();
    }
  }, [checkoutCompleted, navigate, redirect, subscribeRouteState]);
  reactExports.useEffect(() => {
    if (subscribeRouteState === "showPaywall" && !isUpgradeFlow) {
      captureClientEvent("billing:paywall_viewed");
    }
  }, [isUpgradeFlow, subscribeRouteState]);
  if (subscribeRouteState === "loading" || subscribeRouteState === "redirectToApp") {
    return null;
  }
  if (subscribeRouteState === "finalizing") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-xs space-y-4 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/transparent-logo.png", alt: "OpenSEO", className: "mx-auto size-10 rounded-lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: "Finalizing your subscription…" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-md" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/60", children: "This usually takes a few seconds." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-base-content/50", children: [
        "Taking longer?",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "link", href: `mailto:${SUPPORT_EMAIL}`, children: [
          "Email ",
          SUPPORT_EMAIL
        ] }),
        "."
      ] })
    ] });
  }
  if (subscribeRouteState === "error") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-xs space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/transparent-logo.png", alt: "OpenSEO", className: "mx-auto size-10 rounded-lg" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: "Billing unavailable" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-center text-base-content/70", children: getStandardErrorMessage(customerQuery.error, "We couldn't verify your billing status right now. Please try again.") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-soft w-full", onClick: () => {
        void customerQuery.refetch();
      }, children: "Try again" })
    ] });
  }
  async function handleSubscribe() {
    setError(null);
    setIsAttaching(true);
    try {
      captureClientEvent("billing:checkout_start");
      const successUrl = new URL(window.location.href);
      successUrl.searchParams.set("checkout", "success");
      await customerQuery.attach({
        planId: AUTUMN_PAID_PLAN_ID,
        redirectMode: "always",
        successUrl: successUrl.toString()
      });
    } catch (err) {
      setError(getStandardErrorMessage(err, "We couldn't start the checkout. Please try again."));
      setIsAttaching(false);
    }
  }
  const firstName = session?.user?.name?.split(" ")[0] || "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SubscribePageAccountMenu, { email: session?.user?.email }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/transparent-logo.png", alt: "OpenSEO", className: "mx-auto size-10 rounded-lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: isUpgradeFlow ? "Upgrade your plan" : firstName ? `Welcome to OpenSEO, ${firstName}!` : "Welcome to OpenSEO!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/60", children: "SEO on your terms. All your SEO tools in one place at a fair price." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-base-300 p-5 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Base Plan" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-semibold tabular-nums", children: "$10/month" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2", children: [
        PLAN_FEATURES.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2.5 text-sm text-base-content/70", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base-content/40 mt-[2px] shrink-0", children: "—" }),
          item
        ] }, item)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "-mt-1 pl-6 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "text-base-content/60 underline decoration-base-content/40 decoration-dotted underline-offset-4 transition-colors hover:text-base-content", href: "https://openseo.so/pricing", target: "_blank", rel: "noreferrer", onClick: () => captureClientEvent("billing:pricing_estimator_click"), children: [
          "How far do usage credits go?",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "↗" })
        ] }) })
      ] }),
      error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: error }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-soft w-full", disabled: isAttaching, onClick: () => void handleSubscribe(), children: isAttaching ? "Redirecting..." : "Subscribe" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-xs text-base-content/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tooltip before:max-w-60 before:whitespace-normal", "data-tip": `Not for you yet? Email ${SUPPORT_EMAIL} within 30 days of your charge and we'll refund your subscription.`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-help underline decoration-dotted", children: "30-day money-back guarantee" }) }),
        ". Cancel anytime. Powered by Stripe."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-base-content/60", children: [
        "Questions? Email ",
        SUPPORT_EMAIL,
        "."
      ] }),
      isUpgradeFlow ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-base-content/70 hover:text-base-content transition-colors", onClick: () => void navigate({
        to: "/",
        replace: true
      }), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "size-3.5 rotate-180" }),
        "Back to app"
      ] }) : null
    ] })
  ] });
}
function SubscribePageAccountMenu({
  email
}) {
  if (!email) return null;
  const handleSignOut = () => signOutAndRedirect();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed top-4 right-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dropdown dropdown-end", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", tabIndex: 0, className: "btn btn-ghost btn-circle", "aria-label": "Open account menu", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { tabIndex: 0, className: "dropdown-content z-20 menu mt-3 min-w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "menu-title max-w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-base-content", "data-ph-mask": true, children: email }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/settings", className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4" }),
        "Settings"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ThemePreferenceMenuItems, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-error", onClick: handleSignOut, children: "Sign out" }) })
    ] })
  ] }) });
}
export {
  SubscribePage as component
};
