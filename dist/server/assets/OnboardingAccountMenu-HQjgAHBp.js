import { aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { T as ThemePreferenceMenuItems } from "./ThemePreferenceMenuItems-Mim5Z20v.js";
import { C as signOutAndRedirect } from "./router-8qflvY1T.js";
import { U as User } from "./user-C7Ul5Qsq.js";
import { S as Settings } from "./settings-CYIgHtaE.js";
function OnboardingAccountMenu({
  email
}) {
  if (!email) return null;
  const handleSignOut = () => signOutAndRedirect();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed top-4 right-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dropdown dropdown-end", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        tabIndex: 0,
        className: "btn btn-ghost btn-circle",
        "aria-label": "Open account menu",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "ul",
      {
        tabIndex: 0,
        className: "dropdown-content z-20 menu mt-3 min-w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "menu-title max-w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-base-content", "data-ph-mask": true, children: email }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/settings", className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4" }),
            "Settings"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ThemePreferenceMenuItems, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleSignOut, children: "Sign out" }) })
        ]
      }
    )
  ] }) });
}
export {
  OnboardingAccountMenu as O
};
