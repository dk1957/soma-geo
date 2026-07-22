import { aM as reactExports, aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
function Modal({
  maxWidth = "max-w-sm",
  children,
  onClose,
  labelledBy
}) {
  reactExports.useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": labelledBy,
      className: `card bg-base-100 border border-base-300 w-full ${maxWidth} shadow-xl`,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-body gap-4", children })
    }
  ) });
}
export {
  Modal as M
};
