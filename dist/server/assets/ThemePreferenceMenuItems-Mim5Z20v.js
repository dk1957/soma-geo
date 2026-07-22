import { aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { r as useThemePreference } from "./router-8qflvY1T.js";
import { M as Monitor } from "./monitor-DC1ylG5-.js";
import { S as Sun, M as Moon } from "./sun-DMRQvIlV.js";
const THEME_OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon }
];
function ThemePreferenceMenuItems() {
  const { themePreference, setThemePreference } = useThemePreference();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "menu-title pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Theme" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        role: "radiogroup",
        "aria-label": "Theme preference",
        className: "flex gap-0.5 rounded-lg bg-base-200 p-0.5",
        children: THEME_OPTIONS.map((option) => {
          const isActive = option.value === themePreference;
          const Icon = option.icon;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "tooltip tooltip-bottom flex flex-1 before:whitespace-nowrap",
              "data-tip": option.label,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  role: "radio",
                  "aria-checked": isActive,
                  "aria-label": option.label,
                  className: `flex flex-1 cursor-pointer items-center justify-center rounded-md px-2.5 py-1.5 transition-colors ${isActive ? "bg-base-100 text-base-content shadow-sm" : "text-base-content/50 hover:text-base-content/80"}`,
                  onClick: () => setThemePreference(option.value),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4" })
                }
              )
            },
            option.value
          );
        })
      }
    ) })
  ] });
}
export {
  ThemePreferenceMenuItems as T
};
