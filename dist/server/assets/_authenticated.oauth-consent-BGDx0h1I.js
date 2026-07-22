import { aM as reactExports, aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { q as createLucideIcon, u as useSession, c as captureClientEvent } from "./router-8qflvY1T.js";
import { U as User } from "./user-C7Ul5Qsq.js";
import { C as Check } from "./check-C_HETtUw.js";
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
const __iconNode$1 = [
  ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
  ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
  ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }]
];
const Database = createLucideIcon("database", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
      key: "1s6t7t"
    }
  ],
  ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" }]
];
const KeyRound = createLucideIcon("key-round", __iconNode);
const SCOPES = [{
  icon: Database,
  label: "Read your OpenSEO data",
  description: "Projects, keyword reports, and audit results."
}, {
  icon: KeyRound,
  label: "Act on your behalf via MCP",
  description: "Run tools and write results back to your workspace."
}];
function OAuthConsentPage() {
  const {
    data: session
  } = useSession();
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const userEmail = session?.user?.email ?? null;
  reactExports.useEffect(() => {
    captureClientEvent("mcp:consent_viewed");
  }, []);
  async function respond(accept) {
    setError(null);
    setIsSubmitting(true);
    if (!accept) {
      captureClientEvent("mcp:consent_denied");
    }
    const response = await fetch("/api/oauth/consent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accept,
        query: window.location.search
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to complete authorization.");
      setIsSubmitting(false);
      return;
    }
    if (data.redirectTo) {
      window.location.assign(data.redirectTo);
      return;
    }
    setError("Authorization response did not include a redirect URL.");
    setIsSubmitting(false);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-8 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/transparent-logo.png", alt: "OpenSEO", className: "size-10 rounded-lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-5 text-xl font-semibold", children: "Authorize MCP access" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-base-content/70", children: "An MCP client is requesting access to your OpenSEO workspace." })
    ] }),
    userEmail ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center gap-3 rounded-lg border border-base-300 bg-base-200/50 px-3 py-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-7 items-center justify-center rounded-full bg-base-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "size-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-base-content/60", children: "Signed in as" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: userEmail })
      ] })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium uppercase tracking-wide text-base-content/60", children: "This will allow it to" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-3", children: SCOPES.map((scope) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mt-0.5 size-4 shrink-0 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: scope.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-base-content/60", children: scope.description })
        ] })
      ] }, scope.label)) })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error", children: error }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-ghost flex-1", disabled: isSubmitting, onClick: () => void respond(false), children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary flex-1", disabled: isSubmitting, onClick: () => void respond(true), children: isSubmitting ? "Authorizing..." : "Authorize" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-center text-xs text-base-content/50", children: "You can revoke access at any time in Settings." })
  ] });
}
export {
  OAuthConsentPage as component
};
