import { aL as isHostedClientAuthMode, aM as reactExports, aN as jsxRuntimeExports, aV as version } from "./index-CSpjggkr.js";
import { r as useThemePreference, u as useSession, b as authClient, t as toast } from "./router-8qflvY1T.js";
import { M as Monitor } from "./monitor-DC1ylG5-.js";
import { S as Sun, M as Moon } from "./sun-DMRQvIlV.js";
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
const THEME_OPTIONS = [{
  value: "system",
  label: "System",
  icon: Monitor
}, {
  value: "light",
  label: "Light",
  icon: Sun
}, {
  value: "dark",
  label: "Dark",
  icon: Moon
}];
function SettingsPage() {
  const isHosted = isHostedClientAuthMode();
  const {
    themePreference,
    setThemePreference
  } = useThemePreference();
  const {
    data: session,
    isPending: isSessionPending
  } = useSession();
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const analyticsEnabled = session?.user?.analyticsOptedOut !== true;
  async function updateAnalyticsPreference(enabled) {
    setIsSaving(true);
    try {
      const result = await authClient.updateUser({
        analyticsOptedOut: !enabled
      });
      if (result.error) {
        toast.error("We couldn't update your analytics setting.");
      } else {
        toast.success(enabled ? "Analytics enabled" : "Analytics disabled");
      }
    } catch {
      toast.error("We couldn't update your analytics setting.");
    } finally {
      setIsSaving(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full overflow-auto bg-base-100 px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-xl space-y-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Settings" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-medium text-base-content/50", children: "Appearance" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Theme" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "radiogroup", "aria-label": "Theme preference", className: "flex gap-0.5 rounded-lg bg-base-200 p-0.5", children: THEME_OPTIONS.map((option) => {
          const isActive = option.value === themePreference;
          const Icon = option.icon;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "radio", "aria-checked": isActive, "aria-label": option.label, className: `flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 transition-colors ${isActive ? "bg-base-100 text-base-content shadow-sm" : "text-base-content/50 hover:text-base-content/80"}`, onClick: () => setThemePreference(option.value), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4" }) }, option.value);
        }) })
      ] })
    ] }),
    isHosted ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-medium text-base-content/50", children: "Analytics" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Help improve OpenSEO" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-base-content/60", children: "Share analytics and usage data." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "toggle toggle-primary", checked: analyticsEnabled, disabled: isSessionPending || isSaving || !session?.user, onChange: (event) => {
          void updateAnalyticsPreference(event.currentTarget.checked);
        }, "aria-label": "Enable product analytics" })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-medium text-base-content/50", children: "About" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Version" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-sm text-base-content/60", children: [
          "v",
          version
        ] })
      ] })
    ] })
  ] }) });
}
export {
  SettingsPage as component
};
