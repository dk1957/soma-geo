import { aW as getLanguageOptions, aN as jsxRuntimeExports, ah as getLanguageCode } from "./index-CSpjggkr.js";
import { L as LocationSelect } from "./LocationSelect-COzx0aOt.js";
function ProjectMarketFields({
  value,
  onChange,
  hideLanguageOnMobile = false
}) {
  const languageOptions = getLanguageOptions(value.locationCode);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Country" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        LocationSelect,
        {
          value: value.locationCode,
          onChange: (locationCode) => onChange({
            locationCode,
            languageCode: getLanguageCode(locationCode)
          })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "label",
      {
        className: `${hideLanguageOnMobile ? "hidden sm:flex" : "flex"} flex-col gap-1.5 text-sm`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Language" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: value.languageCode,
              onChange: (event) => onChange({ ...value, languageCode: event.target.value }),
              disabled: languageOptions.length <= 1,
              className: "select select-bordered w-full",
              children: languageOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.code, children: option.label }, option.code))
            }
          )
        ]
      }
    )
  ] });
}
export {
  ProjectMarketFields as P
};
