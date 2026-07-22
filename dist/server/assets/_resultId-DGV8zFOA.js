import { y as createServerFn, aM as reactExports, aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { q as createLucideIcon, p as createSsrRpc, S as buildCsv, K as ChevronRight, H as ExternalLink, b2 as Download, G as ChevronDown, s as useQuery, J as useMutation, b9 as CircleAlert, b0 as exportTableToSheets, ba as downloadFile, t as toast, bb as Route, j as useNavigate } from "./router-8qflvY1T.js";
import { r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import { a as lighthouseAuditExportSchema, l as lighthouseAuditIssueSchema } from "./lighthouse-BaqnXs-3.js";
import { T as TriangleAlert } from "./triangle-alert-CtV7H1mP.js";
import { I as Info } from "./info-xwL8JFDq.js";
import { L as LIGHTHOUSE_CATEGORY_TABS } from "./lighthouse-CxIZIYPF.js";
import { S as Sheet } from "./sheet-CetoD1zz.js";
import { C as Copy } from "./copy-DgxzPDJt.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
import "./selfHostedOAuth-CrKFUiz1.js";
import "./ai-search-gke0D25z.js";
import "./keywords-B1vFn2Y-.js";
import "./audit-qXiCYzw5.js";
import "stream";
const __iconNode = [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
const FileWarning = createLucideIcon("file-warning", __iconNode);
const getAuditLighthouseIssues = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(lighthouseAuditIssueSchema).handler(createSsrRpc("955fb22c05a803998669e9e3cb307dc405e545b788cf580fa37af4236d97b07a"));
const exportAuditLighthouseIssues = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(lighthouseAuditExportSchema).handler(createSsrRpc("0400cd589829703979c0d6b38188a846f541034cb534b51326766d1a7f007970"));
const ISSUE_HEADERS = [
  "Category",
  "Severity",
  "Score",
  "Title",
  "Display Value",
  "Description",
  "Impact (ms)",
  "Impact (bytes)",
  "Affected Items"
];
function issuesToRows(issues) {
  return issues.map((issue) => [
    issue.category,
    issue.severity,
    issue.score ?? "",
    issue.title,
    issue.displayValue ?? "",
    issue.description ?? "",
    issue.impactMs ?? "",
    issue.impactBytes ?? "",
    issue.items.length
  ]);
}
function issuesToTable(issues) {
  return { headers: ISSUE_HEADERS, rows: issuesToRows(issues) };
}
function categoryLabel(category) {
  if (category === "best-practices") return "Best practices";
  if (category === "all") return "All";
  return `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
}
function issuesToCsv(issues) {
  return buildCsv(ISSUE_HEADERS, issuesToRows(issues));
}
function LighthouseIssueRow({ issue }) {
  const [open, setOpen] = reactExports.useState(false);
  const hasDetails = !!(issue.description || issue.items.length > 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "tr",
      {
        className: `hover:bg-base-200/50 transition-colors ${hasDetails ? "cursor-pointer" : ""}`,
        onClick: () => hasDetails && setOpen(!open),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pl-4 pr-2", children: hasDetails ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            ChevronRight,
            {
              className: `size-3.5 text-base-content/40 transition-transform ${open ? "rotate-90" : ""}`
            }
          ) : null }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              className: `badge badge-sm border ${severityBadgeClass(issue.severity)} gap-1`,
              children: [
                severityIcon(issue.severity),
                issue.severity
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm leading-snug", children: issue.title }),
            issue.displayValue ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-base-content/50 mt-0.5", children: issue.displayValue }) : null
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-3 hidden sm:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-base-content/50", children: issue.category }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-3 hidden md:table-cell text-right", children: issue.impactMs != null || issue.impactBytes != null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs tabular-nums text-base-content/50", children: [
            issue.impactMs ? formatMs(issue.impactMs) : null,
            issue.impactMs && issue.impactBytes ? " / " : null,
            issue.impactBytes ? formatBytes(issue.impactBytes) : null
          ] }) : null }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-4 text-right", children: issue.score != null ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs tabular-nums text-base-content/50", children: issue.score }) : null })
        ]
      }
    ),
    open ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "!bg-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "pb-4 pt-2 pl-[8.5rem] pr-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      issue.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-base-content/70 leading-relaxed", children: renderInlineMarkdown(issue.description) }) : null,
      issue.items.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "cursor-pointer font-medium text-base-content/60 text-xs", children: [
          "Affected items (",
          issue.items.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 space-y-1.5", children: issue.items.map((item, itemIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "pre",
          {
            className: "bg-base-200/60 p-2 rounded overflow-x-auto text-xs leading-relaxed",
            children: item
          },
          `${issue.auditKey}-${itemIndex}`
        )) })
      ] }) : null
    ] }) }) }) : null
  ] });
}
function formatMs(ms) {
  if (ms >= 1e3) return `${(ms / 1e3).toFixed(1)}s`;
  return `${ms}ms`;
}
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}
function renderInlineMarkdown(markdown) {
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  const nodes = [];
  let cursor = 0;
  let match = linkPattern.exec(markdown);
  while (match) {
    const [raw, label, href] = match;
    const index = match.index;
    if (index > cursor) {
      nodes.push(markdown.slice(cursor, index));
    }
    nodes.push(
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "link link-primary inline-flex items-center gap-1",
          children: [
            label,
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3" })
          ]
        },
        `${href}-${index}`
      )
    );
    cursor = index + raw.length;
    match = linkPattern.exec(markdown);
  }
  if (cursor < markdown.length) {
    nodes.push(markdown.slice(cursor));
  }
  return nodes.length ? nodes : markdown;
}
function severityBadgeClass(severity) {
  if (severity === "critical") {
    return "border-error/30 bg-error/10 text-error/80";
  }
  if (severity === "warning") {
    return "border-warning/35 bg-warning/10 text-warning/80";
  }
  return "border-info/30 bg-info/10 text-info/80";
}
function severityIcon(severity) {
  if (severity === "critical") return /* @__PURE__ */ jsxRuntimeExports.jsx(FileWarning, { className: "size-3" });
  if (severity === "warning") return /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "size-3" });
}
function LighthouseIssuesSummary({
  scores,
  metrics
}) {
  const metricItems = getMetricItems(metrics);
  if (!scores && metricItems.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    scores ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreGauge, { label: "Performance", score: scores.performance }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreGauge, { label: "Accessibility", score: scores.accessibility }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreGauge, { label: "Best Practices", score: scores["best-practices"] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreGauge, { label: "SEO", score: scores.seo })
    ] }) : null,
    metricItems.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 rounded-box border border-base-300 bg-base-200/25 px-4 py-3", children: metricItems.map((metric) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-baseline justify-between gap-2 py-1",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-base-content/50 uppercase tracking-wide", children: metric.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold tabular-nums text-base-content", children: metric.value })
        ]
      },
      metric.label
    )) }) : null
  ] });
}
function scoreColor(score) {
  if (score == null) return "text-base-content/40";
  if (score >= 90) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-error";
}
function scoreStrokeColor(score) {
  if (score == null) return "stroke-base-content/20";
  if (score >= 90) return "stroke-success";
  if (score >= 50) return "stroke-warning";
  return "stroke-error";
}
function ScoreGauge({ label, score }) {
  const displayScore = score ?? 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = displayScore / 100 * circumference;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1.5 py-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative size-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 64 64", className: "size-full -rotate-90", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: "32",
            cy: "32",
            r: radius,
            fill: "none",
            strokeWidth: "4",
            className: "stroke-base-300/60"
          }
        ),
        score != null ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: "32",
            cy: "32",
            r: radius,
            fill: "none",
            strokeWidth: "4",
            strokeLinecap: "round",
            strokeDasharray: `${progress} ${circumference}`,
            className: scoreStrokeColor(score)
          }
        ) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `absolute inset-0 flex items-center justify-center text-lg font-bold ${scoreColor(score)}`,
          children: score ?? "-"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-base-content/55 text-center leading-tight", children: label })
  ] });
}
function getMetricItems(metrics) {
  if (!metrics) return [];
  return [
    { label: "FCP", value: metrics.firstContentfulPaint.displayValue },
    { label: "LCP", value: metrics.largestContentfulPaint.displayValue },
    { label: "TBT", value: metrics.totalBlockingTime.displayValue },
    { label: "SI", value: metrics.speedIndex.displayValue },
    { label: "TTI", value: metrics.timeToInteractive.displayValue },
    { label: "CLS", value: metrics.cumulativeLayoutShift.displayValue },
    { label: "INP", value: metrics.interactionToNextPaint.displayValue },
    { label: "TTFB", value: metrics.serverResponseTime.displayValue }
  ].filter(
    (metric) => metric.value != null
  );
}
const categoryTabs = LIGHTHOUSE_CATEGORY_TABS;
function LighthouseIssuesHeader({
  backLabel,
  onBack,
  scannedAt,
  finalUrl,
  scores,
  metrics,
  severityCounts
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn btn-ghost btn-sm px-2", onClick: onBack, children: [
        "← Back to ",
        backLabel
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-base-content/60", children: scannedAt ? `Scanned ${new Date(scannedAt).toLocaleString()}` : "Reading latest issues..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card bg-base-100 border border-base-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-body py-5 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold", children: "Lighthouse Issues" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70 break-all", children: finalUrl ?? "Loading URL..." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LighthouseIssuesSummary, { scores, metrics }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge border border-error/30 bg-error/10 text-error/80 gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileWarning, { className: "size-3" }),
          "Critical ",
          severityCounts.critical
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge border border-warning/30 bg-warning/10 text-warning/80 gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3" }),
          "Warning ",
          severityCounts.warning
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge border border-info/30 bg-info/10 text-info/80 gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "size-3" }),
          "Info ",
          severityCounts.info
        ] })
      ] })
    ] }) })
  ] });
}
function LighthouseIssuesToolbar({
  category,
  categoryCounts,
  selectedCategoryLabel,
  isBusy,
  visibleIssues,
  allIssues,
  onCategoryChange,
  onCopy,
  onExport,
  onExportCsv,
  onExportSheets
}) {
  const exportCurrentCategory = category === "all" ? { mode: "issues" } : { mode: "category", category };
  const categoryLabelLower = selectedCategoryLabel.toLowerCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-0 z-[2] -mx-2 px-2 py-2 bg-base-100/95 backdrop-blur-sm border-b border-base-300/60", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CategoryTabs,
      {
        category,
        categoryCounts,
        onCategoryChange
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ExportMenu,
      {
        allIssues,
        categoryLabelLower,
        exportCurrentCategory,
        isBusy,
        onCopy,
        onExport,
        onExportCsv,
        onExportSheets,
        visibleIssues
      }
    )
  ] }) });
}
function CategoryTabs({
  category,
  categoryCounts,
  onCategoryChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-4", children: categoryTabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      className: `pb-2 border-b-2 text-sm font-medium transition-colors ${category === tab ? "border-primary text-base-content" : "border-transparent text-base-content/60 hover:text-base-content"}`,
      onClick: () => onCategoryChange(tab),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: categoryLabel(tab) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 text-xs opacity-70", children: [
          "(",
          categoryCounts[tab],
          ")"
        ] })
      ]
    },
    tab
  )) });
}
function ExportMenu({
  allIssues,
  categoryLabelLower,
  exportCurrentCategory,
  isBusy,
  onCopy,
  onExport,
  onExportCsv,
  onExportSheets,
  visibleIssues
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dropdown dropdown-end", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { tabIndex: 0, role: "button", className: "btn btn-sm gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4" }),
      "Export",
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3 opacity-60" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "ul",
      {
        tabIndex: 0,
        className: "dropdown-content z-10 menu p-2 shadow-lg bg-base-100 border border-base-300 rounded-box w-72",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "menu-title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Export to Sheets" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: !visibleIssues.length,
              onClick: () => onExportSheets(visibleIssues, "current"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { className: "size-4" }),
                "Open in Sheets — ",
                categoryLabelLower
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: !allIssues.length,
              onClick: () => onExportSheets(allIssues, "all"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { className: "size-4" }),
                "Open in Sheets — all actionable"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "menu-title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Copy" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: isBusy,
              onClick: () => onCopy(
                exportCurrentCategory,
                `Copied ${categoryLabelLower} issues`
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-4" }),
                "Copy ",
                categoryLabelLower,
                " issues"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: isBusy,
              onClick: () => onCopy({ mode: "issues" }, "Copied all actionable issues"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-4" }),
                "Copy all actionable issues"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: isBusy,
              onClick: () => onCopy({ mode: "full" }, "Copied saved Lighthouse payload"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-4" }),
                "Copy saved Lighthouse payload"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "menu-title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Download JSON" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: isBusy,
              onClick: () => onExport(exportCurrentCategory),
              children: [
                "Download ",
                categoryLabelLower,
                " issues"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              disabled: isBusy,
              onClick: () => onExport({ mode: "issues" }),
              children: "Download all actionable issues"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: isBusy, onClick: () => onExport({ mode: "full" }), children: "Download saved Lighthouse payload" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "menu-title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Download CSV" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: !visibleIssues.length,
              onClick: () => onExportCsv(visibleIssues, "current"),
              children: [
                "Download ",
                categoryLabelLower,
                " issues"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              disabled: !allIssues.length,
              onClick: () => onExportCsv(allIssues, "all"),
              children: "Download all actionable issues"
            }
          ) })
        ]
      }
    )
  ] });
}
function LighthouseIssueList({
  issues,
  isLoading,
  emptyMessage
}) {
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/60", children: "Loading issues..." });
  }
  if (!issues.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/60", children: emptyMessage ?? "No actionable issues for this category." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "table table-sm w-full table-fixed", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("colgroup", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("col", { className: "w-8" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("col", { className: "w-24" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("col", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("col", { className: "w-28 hidden sm:table-column" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("col", { className: "w-28 hidden md:table-column" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("col", { className: "w-14" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-xs text-base-content/50 uppercase tracking-wide border-b border-base-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "font-medium", children: "Severity" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "font-medium", children: "Issue" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "font-medium hidden sm:table-cell", children: "Category" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "font-medium hidden md:table-cell text-right", children: "Impact" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "font-medium text-right", children: "Score" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-base-300/60", children: issues.map((issue, issueIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      LighthouseIssueRow,
      {
        issue
      },
      `${issue.category}-${issue.auditKey}-${issueIndex}`
    )) })
  ] });
}
function LighthouseIssuesScreen(props) {
  const { projectId, resultId, category, backLabel, onBack, onCategoryChange } = props;
  const issuesQuery = useQuery({
    queryKey: ["auditLighthouseIssues", projectId, resultId],
    queryFn: () => getAuditLighthouseIssues({
      data: {
        projectId,
        resultId
      }
    })
  });
  const exportMutation = useMutation({
    mutationFn: (data) => exportAuditLighthouseIssues({
      data: {
        projectId,
        resultId,
        ...data
      }
    })
  });
  const {
    allIssues,
    categoryCounts,
    runCopy,
    runExport,
    runExportCsv,
    runExportSheets,
    selectedCategoryLabel,
    severityCounts,
    visibleIssues
  } = useLighthouseIssuesActions({
    category,
    exportMutation,
    allIssues: issuesQuery.data?.issues ?? []
  });
  const issuesErrorMessage = issuesQuery.error instanceof Error ? issuesQuery.error.message : "Failed to load Lighthouse issues.";
  const showsLegacyPayloadNotice = issuesQuery.data != null && !issuesQuery.data.hasIssueDetails;
  const emptyMessage = showsLegacyPayloadNotice ? "This audit was saved without issue-level Lighthouse details. Re-run the audit to populate this screen." : void 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 md:px-6 md:py-4 pb-24 md:pb-8 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LighthouseIssuesHeader,
      {
        backLabel,
        onBack,
        scannedAt: issuesQuery.data?.createdAt,
        finalUrl: issuesQuery.data?.finalUrl,
        scores: issuesQuery.data?.scores,
        metrics: issuesQuery.data?.metrics,
        severityCounts
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card bg-base-100 border border-base-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-body gap-4", children: [
      issuesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert alert-error", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "size-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: issuesErrorMessage })
      ] }) : null,
      showsLegacyPayloadNotice ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert alert-warning", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "This Lighthouse run was stored before issue details were preserved. Re-run the audit to see category counts and issue cards." })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        LighthouseIssuesToolbar,
        {
          category,
          categoryCounts,
          selectedCategoryLabel,
          isBusy: exportMutation.isPending,
          visibleIssues,
          allIssues,
          onCategoryChange,
          onCopy: (data, message) => {
            void runCopy(data, message);
          },
          onExport: (data) => {
            void runExport(data);
          },
          onExportCsv: runExportCsv,
          onExportSheets: runExportSheets
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        LighthouseIssueList,
        {
          issues: visibleIssues,
          isLoading: issuesQuery.isLoading,
          emptyMessage
        }
      )
    ] }) })
  ] }) });
}
function useLighthouseIssuesActions({
  allIssues,
  category,
  exportMutation
}) {
  const visibleIssues = category === "all" ? allIssues : allIssues.filter((issue) => issue.category === category);
  const selectedCategoryLabel = categoryLabel(category);
  const categoryCounts = getCategoryCounts(allIssues);
  const severityCounts = getSeverityCounts(visibleIssues);
  const runExport = async (data) => {
    try {
      const exported = await exportMutation.mutateAsync(data);
      downloadFile(exported.content, exported.filename, "application/json");
      toast.success("Download started");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export payload";
      toast.error(message);
    }
  };
  const runExportCsv = (rows, variant) => {
    const filename = `lighthouse-${variant}-${category}-issues.csv`;
    downloadFile(issuesToCsv(rows), filename, "text/csv");
    toast.success("CSV download started");
  };
  const runExportSheets = (rows, variant) => {
    const table = issuesToTable(rows);
    void exportTableToSheets({
      headers: table.headers,
      rows: table.rows,
      feature: `lighthouse_issues_${variant}`
    });
  };
  const runCopy = async (data, toastMessage) => {
    try {
      const exported = await exportMutation.mutateAsync(data);
      await navigator.clipboard.writeText(exported.content);
      toast.success(toastMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to copy payload";
      toast.error(message);
    }
  };
  return {
    allIssues,
    categoryCounts,
    runCopy,
    runExport,
    runExportCsv,
    runExportSheets,
    selectedCategoryLabel,
    severityCounts,
    visibleIssues
  };
}
function getCategoryCounts(allIssues) {
  return categoryTabs.reduce(
    (acc, tab) => {
      if (tab === "all") {
        acc[tab] = allIssues.length;
        return acc;
      }
      acc[tab] = allIssues.filter((issue) => issue.category === tab).length;
      return acc;
    },
    {
      all: allIssues.length,
      performance: 0,
      accessibility: 0,
      "best-practices": 0,
      seo: 0
    }
  );
}
function getSeverityCounts(issues) {
  return {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    warning: issues.filter((issue) => issue.severity === "warning").length,
    info: issues.filter((issue) => issue.severity === "info").length
  };
}
function AuditIssuesPage() {
  const {
    projectId,
    resultId
  } = Route.useParams();
  const {
    auditId,
    category
  } = Route.useSearch();
  const navigate = useNavigate({
    from: Route.fullPath
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(LighthouseIssuesScreen, { projectId, resultId, category, backLabel: "Site Audit", onBack: () => void navigate({
    to: "/p/$projectId/audit",
    params: {
      projectId
    },
    search: auditId ? {
      auditId
    } : void 0
  }), onCategoryChange: (next) => void navigate({
    search: (prev) => ({
      ...prev,
      category: next
    }),
    replace: true
  }) });
}
export {
  AuditIssuesPage as component
};
