import { aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { g as getSafeExternalUrl } from "./url-BJJMe9XJ.js";
import { H as ExternalLink } from "./router-8qflvY1T.js";
function SafeExternalLink({
  url,
  label,
  className
}) {
  const safeUrl = getSafeExternalUrl(url);
  if (!safeUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className, children: label });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className, href: safeUrl, target: "_blank", rel: "noreferrer", children: [
    label,
    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3 shrink-0" })
  ] });
}
export {
  SafeExternalLink as S
};
