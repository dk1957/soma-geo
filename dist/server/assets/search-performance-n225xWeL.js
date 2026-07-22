import { aN as jsxRuntimeExports, aM as reactExports } from "./index-CSpjggkr.js";
import { I as useQueryClient, aV as useSelectionAnchor, aW as useAppTable, J as useMutation, t as toast, x as getStandardErrorMessage, c as captureClientEvent, aX as AppDataTable, aY as TableBulkActionBar, aZ as TableBulkActionButton, a_ as LoaderCircle, a$ as normalizeExportValue, Q as downloadCsv, S as buildCsv, b0 as exportTableToSheets, s as useQuery, L as Link, b1 as TableExportMenu, b2 as Download, V as queryOptions, b3 as keepPreviousData, b4 as Route } from "./router-8qflvY1T.js";
import { T as TablePagination } from "./TablePagination-ke6LLGtA.js";
import { S as SearchConsoleConnectionCard } from "./SearchConsoleConnectionCard-ILifWYun.js";
import { f as formatCount, a as formatCtr, b as formatPosition, c as buildStrikingColumns, d as buildDimensionColumns, g as getSearchPerformanceTable, e as exportSearchPerformanceTable, h as getSearchPerformanceReport } from "./searchPerformance-CefLjpzS.js";
import { S as SEARCH_PERFORMANCE_PAGE_SIZES, c as SEARCH_PERFORMANCE_DEFAULT_PAGE_SIZE, G as GSC_DEVICES, d as SEARCH_PERFORMANCE_RANGES } from "./search-performance-Cmbby2cq.js";
import { s as saveKeywords } from "./keywords-CJzE_dc4.js";
import { C as Copy } from "./copy-DgxzPDJt.js";
import { S as Save } from "./save-AGGWa3Di.js";
import { S as Sheet } from "./sheet-CetoD1zz.js";
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
import "./chevron-left-D72yujtc.js";
import "./startGscLink-DDsqhlAZ.js";
import "./SitePicker-DIx79alw.js";
import "./SafeExternalLink-CzHkCMkV.js";
import "./url-BJJMe9XJ.js";
import "./triangle-alert-CtV7H1mP.js";
function SearchPerformanceLoadingState() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", "aria-busy": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "rounded-lg border border-base-300 bg-base-100 p-4 space-y-2",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-3 w-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-7 w-24" })
        ]
      },
      index
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-base-300 bg-base-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-b border-base-300 px-4 py-3 lg:flex-row lg:items-center lg:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-8 w-40" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-8 w-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-8 w-16" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-8 w-36" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-8 w-36" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-8 w-36" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 p-4", children: Array.from({ length: 8 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-5 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton col-span-2 h-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-4" })
      ] }, index)) })
    ] })
  ] });
}
function strikingExportTable(report) {
  const stamp = `${report.range.startDate}-to-${report.range.endDate}`;
  return {
    filename: `search-performance-striking-distance-${stamp}.csv`,
    headers: ["Query", "Page", "Impressions", "Clicks", "Position"],
    rows: report.strikingDistance.map((row) => [
      row.query,
      row.page,
      row.impressions,
      row.clicks,
      row.position
    ])
  };
}
function dimensionExportTable(dimension, rows, stamp) {
  const isPage = dimension === "page";
  return {
    filename: `search-performance-${isPage ? "pages" : "queries"}-${stamp}.csv`,
    headers: [
      isPage ? "Page" : "Query",
      "Clicks",
      "Impressions",
      "CTR",
      "Position"
    ],
    rows: rows.map((row) => [
      row.key,
      row.clicks,
      row.impressions,
      row.ctr,
      row.position
    ])
  };
}
function runExport(table, target) {
  if (target === "csv") {
    downloadCsv(table.filename, buildCsv(table.headers, table.rows));
    captureClientEvent("data:export", {
      source_feature: "search_performance",
      result_count: table.rows.length
    });
    return;
  }
  void exportTableToSheets({
    headers: table.headers,
    rows: table.rows,
    feature: "search_performance"
  });
}
function exportStriking(report, target) {
  runExport(strikingExportTable(report), target);
}
function exportDimensionRows(dimension, rows, range, target) {
  const stamp = `${range.startDate}-to-${range.endDate}`;
  runExport(dimensionExportTable(dimension, rows, stamp), target);
}
function TabButton({
  active,
  onClick,
  label
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": active,
      className: `tab ${active ? "tab-active" : ""}`,
      onClick,
      children: label
    }
  );
}
function percentDelta(current, previous) {
  if (previous <= 0) return null;
  const change = (current - previous) / previous;
  const pct = (change * 100).toFixed(1);
  return { text: `${change >= 0 ? "+" : ""}${pct}%`, improved: change >= 0 };
}
function positionDelta(current, previous) {
  if (previous <= 0 || current <= 0) return null;
  const change = previous - current;
  return {
    text: `${change >= 0 ? "+" : ""}${change.toFixed(1)}`,
    improved: change >= 0
  };
}
function TotalsCards({ report }) {
  const { totals, prevTotals, range } = report;
  const deltaTitle = `vs ${range.prevStartDate} to ${range.prevEndDate}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TotalCard,
      {
        label: "Clicks",
        value: formatCount(totals.clicks),
        delta: percentDelta(totals.clicks, prevTotals.clicks),
        deltaTitle
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TotalCard,
      {
        label: "Impressions",
        value: formatCount(totals.impressions),
        delta: percentDelta(totals.impressions, prevTotals.impressions),
        deltaTitle
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TotalCard,
      {
        label: "CTR",
        value: formatCtr(totals.ctr),
        delta: percentDelta(totals.ctr, prevTotals.ctr),
        deltaTitle
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TotalCard,
      {
        label: "Avg position",
        value: formatPosition(totals.position),
        delta: positionDelta(totals.position, prevTotals.position),
        deltaTitle
      }
    )
  ] });
}
function TotalCard({
  label,
  value,
  delta,
  deltaTitle
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-base-300 bg-base-100 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wide text-base-content/60", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-baseline gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-semibold", children: value }),
      delta ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `text-xs ${delta.improved ? "text-success" : "text-error"}`,
          title: deltaTitle,
          children: delta.text
        }
      ) : null
    ] })
  ] });
}
function DimensionTable({
  rows,
  keyLabel
}) {
  const columns = reactExports.useMemo(() => buildDimensionColumns(keyLabel), [keyLabel]);
  const table = useAppTable({
    data: rows,
    columns,
    withSorting: true,
    initialState: { sorting: [{ id: "clicks", desc: true }] }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    AppDataTable,
    {
      table,
      className: "table table-zebra table-sm",
      wrapperClassName: "overflow-x-auto",
      empty: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-6 text-sm text-base-content/60", children: "No data for this period yet. Search Console data trails by a few days." })
    }
  );
}
function StrikingDistanceTable({
  projectId,
  rows
}) {
  const queryClient = useQueryClient();
  const anchorRef = useSelectionAnchor();
  const [rowSelection, setRowSelection] = reactExports.useState({});
  const columns = reactExports.useMemo(() => buildStrikingColumns(anchorRef), [anchorRef]);
  const table = useAppTable({
    data: rows,
    columns,
    withSorting: true,
    withPagination: true,
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => `${row.query}::${row.page}`,
    initialState: {
      sorting: [{ id: "impressions", desc: true }],
      // All rows are already loaded; paginate client-side to keep the table
      // short. 50/page by default.
      pagination: { pageIndex: 0, pageSize: 50 }
    }
  });
  const pagination = table.getState().pagination;
  const selectedQueries = Array.from(
    new Set(table.getSelectedRowModel().rows.map((row) => row.original.query))
  );
  const copyKeywords = async () => {
    try {
      const text = selectedQueries.map((query) => normalizeExportValue(query)).join("\n");
      await navigator.clipboard.writeText(text);
      toast.success(
        `Copied ${selectedQueries.length} ${selectedQueries.length === 1 ? "keyword" : "keywords"}`
      );
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };
  const save = useMutation({
    mutationFn: (keywords) => saveKeywords({ data: { projectId, keywords } }),
    onSuccess: (_result, keywords) => {
      captureClientEvent("keyword:save", {
        source_feature: "search_performance",
        keyword_count: keywords.length
      });
      void queryClient.invalidateQueries({
        queryKey: ["savedKeywords", projectId]
      });
      toast.success(
        `Saved ${keywords.length} ${keywords.length === 1 ? "keyword" : "keywords"}`
      );
      setRowSelection({});
    },
    onError: (error) => {
      toast.error(getStandardErrorMessage(error, "Could not save keywords"));
    }
  });
  if (rows.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-6 text-sm text-base-content/60", children: "No striking-distance queries in this period. These are queries ranking at positions 5 to 20, where an improvement is most likely to move traffic." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-sm text-base-content/60", children: "Queries ranking at positions 5 to 20, sorted by impressions. Improve the listed page to move them into the top results." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AppDataTable,
        {
          table,
          className: "table table-zebra table-sm",
          wrapperClassName: "overflow-x-auto"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TablePagination,
      {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        pageSizes: SEARCH_PERFORMANCE_PAGE_SIZES,
        totalCount: rows.length,
        hasNextPage: table.getCanNextPage(),
        isLoading: false,
        onPageChange: (nextPage) => table.setPageIndex(nextPage - 1),
        onPageSizeChange: (nextSize) => table.setPageSize(nextSize)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TableBulkActionBar,
      {
        selectedCount: selectedQueries.length,
        selectedLabel: selectedQueries.length === 1 ? "query" : "queries",
        onClear: () => setRowSelection({}),
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 px-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TableBulkActionButton,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-3.5" }),
              onClick: () => void copyKeywords(),
              children: "Copy keywords"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TableBulkActionButton,
            {
              icon: save.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-3.5" }),
              onClick: () => save.mutate(selectedQueries),
              disabled: save.isPending,
              children: "Save as keywords"
            }
          )
        ] })
      }
    )
  ] });
}
const RANGE_LABELS = {
  last_7_days: "Last 7 days",
  last_28_days: "Last 28 days",
  last_3_months: "Last 3 months"
};
const RANGE_OPTIONS = SEARCH_PERFORMANCE_RANGES.map((value) => ({
  value,
  label: RANGE_LABELS[value]
}));
const DEVICE_LABELS = {
  DESKTOP: "Desktop",
  MOBILE: "Mobile",
  TABLET: "Tablet"
};
const DEVICE_OPTIONS = GSC_DEVICES.map((value) => ({
  value,
  label: DEVICE_LABELS[value]
}));
const ALL = "ALL";
function isDateRange(value) {
  return SEARCH_PERFORMANCE_RANGES.some((option) => option === value);
}
function isDevice(value) {
  return GSC_DEVICES.some((option) => option === value);
}
function tabDimension(tab) {
  return tab === "pages" ? "page" : "query";
}
function buildFilterInput(range, device, country) {
  return {
    dateRange: range,
    ...device === ALL ? {} : { device },
    ...country === ALL ? {} : { country }
  };
}
function tableQueryOptions(projectId, dimension, page, pageSize, filterInput) {
  return queryOptions({
    queryKey: [
      "searchPerformanceTable",
      projectId,
      dimension,
      page,
      pageSize,
      filterInput
    ],
    queryFn: () => getSearchPerformanceTable({
      data: { projectId, dimension, page, pageSize, ...filterInput }
    })
  });
}
function SearchPerformancePage({ projectId }) {
  const queryClient = useQueryClient();
  const [range, setRange] = reactExports.useState("last_28_days");
  const [device, setDevice] = reactExports.useState(
    ALL
  );
  const [country, setCountry] = reactExports.useState(ALL);
  const [tab, setTab] = reactExports.useState("striking");
  const [page, setPage] = reactExports.useState(1);
  const [pageSize, setPageSize] = reactExports.useState(
    SEARCH_PERFORMANCE_DEFAULT_PAGE_SIZE
  );
  reactExports.useEffect(() => {
    setPage(1);
  }, [tab, range, device, country, pageSize]);
  const filterInput = buildFilterInput(range, device, country);
  const reportQuery = useQuery({
    queryKey: ["searchPerformance", projectId, range, device, country],
    queryFn: () => getSearchPerformanceReport({ data: { projectId, ...filterInput } }),
    placeholderData: keepPreviousData
  });
  const report = reportQuery.data;
  const isTableTab = tab === "queries" || tab === "pages";
  const dimension = tabDimension(tab);
  const tableQuery = useQuery({
    ...tableQueryOptions(projectId, dimension, page, pageSize, filterInput),
    enabled: report?.connected === true && isTableTab,
    placeholderData: keepPreviousData
  });
  const tableData = tableQuery.data;
  const tableRows = tableData?.connected ? tableData.rows : [];
  const hasNextPage = tableData?.connected ? tableData.hasNextPage : false;
  reactExports.useEffect(() => {
    if (report?.connected !== true) return;
    void queryClient.prefetchQuery(
      tableQueryOptions(
        projectId,
        "query",
        1,
        SEARCH_PERFORMANCE_DEFAULT_PAGE_SIZE,
        buildFilterInput(range, device, country)
      )
    );
  }, [report?.connected, projectId, range, device, country, queryClient]);
  const handleExport = async (target) => {
    if (!report?.connected) return;
    try {
      if (tab === "striking") {
        exportStriking(report, target);
        return;
      }
      const data = await exportSearchPerformanceTable({
        data: { projectId, dimension, ...filterInput }
      });
      exportDimensionRows(dimension, data.rows, report.range, target);
    } catch (error) {
      toast.error(getStandardErrorMessage(error, "Export failed"));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-4 pb-24 overflow-auto md:px-6 md:py-6 md:pb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold", children: "Search Performance" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70", children: "See your site's clicks, impressions, CTR, and position from Google Search Console." })
      ] }),
      report?.connected ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/p/$projectId/settings",
          params: { projectId },
          hash: "search-console",
          className: "link link-hover shrink-0 self-start text-sm font-medium text-base-content/60 transition-colors hover:text-base-content sm:mt-1",
          children: "Change property"
        }
      ) : null
    ] }),
    reportQuery.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(SearchPerformanceLoadingState, {}) : reportQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert alert-error", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: getStandardErrorMessage(reportQuery.error) }) }) : !report?.connected ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SearchConsoleConnectionCard, { projectId }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TotalsCards, { report }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-base-300 bg-base-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-b border-base-300 px-4 py-3 lg:flex-row lg:items-center lg:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "tablist", className: "tabs tabs-border w-fit", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TabButton,
              {
                active: tab === "striking",
                onClick: () => setTab("striking"),
                label: `Striking distance (${report.strikingDistance.length})`
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TabButton,
              {
                active: tab === "queries",
                onClick: () => setTab("queries"),
                label: "Queries"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TabButton,
              {
                active: tab === "pages",
                onClick: () => setTab("pages"),
                label: "Pages"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            reportQuery.isFetching && !reportQuery.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin text-base-content/40" }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                className: "select select-bordered select-sm w-36",
                value: device,
                onChange: (event) => {
                  setDevice(
                    isDevice(event.target.value) ? event.target.value : ALL
                  );
                },
                "aria-label": "Device filter",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: ALL, children: "All devices" }),
                  DEVICE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value))
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                className: "select select-bordered select-sm w-36",
                value: country,
                onChange: (event) => setCountry(event.target.value),
                "aria-label": "Country filter",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: ALL, children: "All countries" }),
                  report.countries.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: row.key, children: row.key.toUpperCase() }, row.key))
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                className: "select select-bordered select-sm w-36",
                value: range,
                onChange: (event) => {
                  if (isDateRange(event.target.value)) {
                    setRange(event.target.value);
                  }
                },
                "aria-label": "Date range",
                children: RANGE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value))
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TableExportMenu,
              {
                buttonClassName: "btn btn-ghost btn-sm gap-1",
                actions: [
                  {
                    label: "Export to Sheets",
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { className: "size-4" }),
                    onClick: () => void handleExport("sheets")
                  },
                  {
                    label: "Download CSV",
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4" }),
                    onClick: () => void handleExport("csv")
                  }
                ]
              }
            )
          ] })
        ] }),
        tab === "striking" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          StrikingDistanceTable,
          {
            projectId,
            rows: report.strikingDistance
          }
        ) : tableQuery.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-8 text-sm text-base-content/60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }),
          " Loading…"
        ] }) : tableQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert alert-error", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: getStandardErrorMessage(tableQuery.error) }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            DimensionTable,
            {
              rows: tableRows,
              keyLabel: tab === "queries" ? "Query" : "Page"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TablePagination,
            {
              page,
              pageSize,
              pageSizes: SEARCH_PERFORMANCE_PAGE_SIZES,
              totalCount: null,
              hasNextPage,
              isLoading: tableQuery.isFetching,
              onPageChange: setPage,
              onPageSizeChange: setPageSize
            }
          )
        ] })
      ] })
    ] })
  ] }) });
}
function SearchPerformanceRoute() {
  const {
    projectId
  } = Route.useParams();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SearchPerformancePage, { projectId });
}
export {
  SearchPerformanceRoute as component
};
