import { aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { C as ChevronLeft } from "./chevron-left-D72yujtc.js";
import { K as ChevronRight } from "./router-8qflvY1T.js";
function formatRange(page, pageSize, totalCount) {
  const start = (page - 1) * pageSize + 1;
  if (totalCount == null) {
    return `${start.toLocaleString()}–${(start + pageSize - 1).toLocaleString()}`;
  }
  if (totalCount === 0) return "0";
  const end = Math.min(totalCount, start + pageSize - 1);
  return `${start.toLocaleString()}–${end.toLocaleString()} of ${totalCount.toLocaleString()}`;
}
function TablePagination({
  page,
  pageSize,
  pageSizes,
  totalCount,
  hasNextPage,
  isLoading,
  onPageChange,
  onPageSizeChange
}) {
  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;
  const canGoPrev = page > 1;
  const canGoNext = totalPages != null ? page < totalPages : hasNextPage;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-t border-base-300 px-4 py-3 sm:flex-row sm:items-center sm:justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-base-content/70 tabular-nums", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatRange(page, pageSize, totalCount) }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-xs" }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm text-base-content/70", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "whitespace-nowrap", children: "Rows per page" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            className: "select select-bordered select-sm w-20",
            value: pageSize,
            onChange: (event) => onPageSizeChange(Number(event.target.value)),
            children: pageSizes.map((size) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: size, children: size }, size))
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "whitespace-nowrap text-sm tabular-nums text-base-content/70", children: [
          "Page ",
          page.toLocaleString(),
          totalPages != null ? ` of ${totalPages.toLocaleString()}` : ""
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "aria-label": "Previous page",
              className: "btn btn-ghost btn-sm btn-square",
              disabled: !canGoPrev || isLoading,
              onClick: () => onPageChange(page - 1),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "aria-label": "Next page",
              className: "btn btn-ghost btn-sm btn-square",
              disabled: !canGoNext || isLoading,
              onClick: () => onPageChange(page + 1),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4" })
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  TablePagination as T
};
