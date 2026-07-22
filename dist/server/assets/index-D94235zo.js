import { aN as jsxRuntimeExports, bV as AUDIT_ISSUE_TYPES, y as createServerFn, aM as reactExports } from "./index-CSpjggkr.js";
import { s as useQuery, L as Link, p as createSsrRpc, I as useQueryClient, J as useMutation, c as captureClientEvent, x as getStandardErrorMessage, j as useNavigate, t as toast, K as ChevronRight, b6 as Route } from "./router-8qflvY1T.js";
import { S as SearchConsoleConnectionCard } from "./SearchConsoleConnectionCard-ILifWYun.js";
import { f as formatCount, a as formatCtr, b as formatPosition, h as getSearchPerformanceReport } from "./searchPerformance-CefLjpzS.js";
import { f as formatCount$1, P as PLATFORM_DOT_CLASS, a as formatPlatformLabel } from "./platformLabels-FqSvM0tp.js";
import { S as Sparkles } from "./sparkles-D0nOSwIL.js";
import { C as Check } from "./check-C_HETtUw.js";
import { C as CopyButton } from "./SetupControls-2EpUugmJ.js";
import { r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import { d as dashboardProjectInputSchema } from "./dashboard-cm9jaQ5H.js";
import { e as setProjectDomain } from "./projects-Ca8yAMNt.js";
import { C as ChevronLeft } from "./chevron-left-D72yujtc.js";
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
import "./lighthouse-BaqnXs-3.js";
import "./lighthouse-CxIZIYPF.js";
import "./startGscLink-DDsqhlAZ.js";
import "./SitePicker-DIx79alw.js";
import "./SafeExternalLink-CzHkCMkV.js";
import "./url-BJJMe9XJ.js";
import "./triangle-alert-CtV7H1mP.js";
import "./search-performance-Cmbby2cq.js";
import "./copy-DgxzPDJt.js";
import "./projects-BqTqxTTI.js";
const STEP_ORDER = [
  "domain",
  "mcp",
  "aeo",
  "gsc",
  "competitor"
];
function isStepDone(activation, step) {
  switch (step) {
    case "domain":
      return activation.domain !== null;
    case "mcp":
      return activation.mcp.authorizedAt !== null || activation.mcp.cardDismissedAt !== null;
    case "aeo":
      return activation.aiVisibilityChecked;
    case "gsc":
      return activation.gsc.connected;
    case "competitor":
      return activation.competitorClickedAt !== null;
  }
}
function computeNextStep(activation) {
  for (const step of STEP_ORDER) {
    if (!isStepDone(activation, step)) return step;
  }
  return null;
}
function CardShell({
  title,
  stamp,
  action,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 px-5 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold leading-tight", children: title }),
      action
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-base-300 p-5", children: [
      children,
      stamp ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-[11px] text-base-content/45", children: stamp }) : null
    ] })
  ] });
}
function EmptyCardBody({
  message,
  cta
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-start gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70", children: message }),
    cta
  ] });
}
function Stat({
  label,
  value,
  tone,
  sub
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "error" ? "text-error" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-base-content/60", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-2xl font-semibold tabular-nums ${toneClass}`, children: value }),
    sub
  ] });
}
function PercentDelta({
  current,
  previous
}) {
  if (previous <= 0) return null;
  const pct = (current - previous) / previous * 100;
  if (!Number.isFinite(pct)) return null;
  const rounded = Math.round(pct);
  const tone = rounded > 0 ? "text-success" : rounded < 0 ? "text-error" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-xs tabular-nums ${tone}`, children: [
    rounded > 0 ? "▲" : rounded < 0 ? "▼" : "",
    " ",
    Math.abs(rounded),
    "%"
  ] });
}
const moreDetailsClass = "btn btn-ghost btn-xs";
function newLost(value) {
  return value === null ? "—" : String(value);
}
function formatDay(timestamp) {
  const ms = Date.parse(
    // SQLite's current_timestamp default has no timezone marker; treat it as
    // UTC rather than letting the browser parse it as local time.
    /^\d{4}-\d{2}-\d{2} /.test(timestamp) ? `${timestamp.replace(" ", "T")}Z` : timestamp
  );
  if (Number.isNaN(ms)) return timestamp;
  return new Date(ms).toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
}
const issueTitles = Object.fromEntries(
  Object.entries(AUDIT_ISSUE_TYPES).map(([key, value]) => [key, value.title])
);
function GscCard({
  projectId,
  connected
}) {
  const reportQuery = useQuery({
    queryKey: ["dashboardGscReport", projectId],
    queryFn: () => getSearchPerformanceReport({
      data: { projectId, dateRange: "last_28_days" }
    }),
    enabled: connected
  });
  if (!connected || reportQuery.data && !reportQuery.data.connected) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "connect-gsc", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SearchConsoleConnectionCard, { projectId }) });
  }
  const report = reportQuery.data;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    CardShell,
    {
      title: "Search performance",
      stamp: "Google Search Console · last 28 days",
      action: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/p/$projectId/search-performance",
          params: { projectId },
          className: moreDetailsClass,
          children: "More details"
        }
      ),
      children: reportQuery.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3", "aria-busy": true, children: Array.from({ length: 4 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-20" }, i)) }) : reportQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/60", children: "Couldn’t load Search Console data. Try again shortly." }) : report?.connected ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Stat,
          {
            label: "Clicks",
            value: formatCount(report.totals.clicks),
            sub: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PercentDelta,
              {
                current: report.totals.clicks,
                previous: report.prevTotals.clicks
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Stat,
          {
            label: "Impressions",
            value: formatCount(report.totals.impressions),
            sub: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PercentDelta,
              {
                current: report.totals.impressions,
                previous: report.prevTotals.impressions
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "CTR", value: formatCtr(report.totals.ctr) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Stat,
          {
            label: "Avg position",
            value: formatPosition(report.totals.position)
          }
        )
      ] }) : null
    }
  );
}
function AuditHealthCard({
  projectId,
  audit
}) {
  if (!audit) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(CardShell, { title: "Site audit", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      EmptyCardBody,
      {
        message: "Crawl your site for broken links, missing tags and indexability problems.",
        cta: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/p/$projectId/audit",
            params: { projectId },
            className: "btn btn-primary btn-sm",
            children: "Run an audit"
          }
        )
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    CardShell,
    {
      title: "Site audit",
      stamp: `Site audit · ${audit.status === "completed" ? `crawled ${audit.pagesCrawled} pages · ${formatDay(audit.startedAt)}` : audit.status === "running" ? "crawl in progress" : "last crawl failed"}`,
      action: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/p/$projectId/audit",
          params: { projectId },
          className: moreDetailsClass,
          children: "More details"
        }
      ),
      children: audit.topIssues.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-base-content/70", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4 text-success" }),
        "No issues found — your site looks healthy."
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2", children: [
        audit.topIssues.map((issue) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "li",
          {
            className: "flex items-center justify-between gap-2 text-sm",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `size-2 shrink-0 rounded-full ${issue.severity === "critical" ? "bg-error" : issue.severity === "warning" ? "bg-warning" : "bg-base-content/30"}`
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: issueTitles[issue.issueType] ?? issue.issueType })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 tabular-nums text-base-content/60", children: [
                issue.count,
                " ",
                issue.count === 1 ? "page" : "pages"
              ] })
            ]
          },
          issue.issueType
        )),
        audit.totalIssueTypes > audit.topIssues.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-xs text-base-content/50", children: [
          "+ ",
          audit.totalIssueTypes - audit.topIssues.length,
          " more issue",
          audit.totalIssueTypes - audit.topIssues.length === 1 ? "" : "s"
        ] }) : null
      ] })
    }
  );
}
function BacklinkPulseCard({
  projectId,
  backlinks,
  refreshing
}) {
  if (!backlinks && refreshing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(CardShell, { title: "Backlink pulse", stamp: "Taking your first snapshot…", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3", "aria-busy": true, children: Array.from({ length: 4 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-20" }, i)) }) });
  }
  if (!backlinks) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(CardShell, { title: "Backlink pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/60", children: "We’ll snapshot who links to your domain — nothing to set up." }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    CardShell,
    {
      title: "Backlink pulse",
      stamp: `Backlinks · snapshot ${formatDay(backlinks.capturedAt)}${refreshing ? " · refreshing…" : ""}`,
      action: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/p/$projectId/backlinks",
          params: { projectId },
          search: { target: backlinks.domain, scope: "domain" },
          className: moreDetailsClass,
          children: "More details"
        }
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Stat,
          {
            label: "Ref. domains",
            value: backlinks.referringDomains === null ? "—" : backlinks.referringDomains.toLocaleString()
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Stat,
          {
            label: "Backlinks",
            value: backlinks.backlinks === null ? "—" : backlinks.backlinks.toLocaleString()
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Stat,
          {
            label: "New links",
            value: `▲ ${newLost(backlinks.newBacklinks)}`,
            tone: backlinks.newBacklinks && backlinks.newBacklinks > 0 ? "success" : void 0
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Stat,
          {
            label: "Lost links",
            value: `▼ ${newLost(backlinks.lostBacklinks)}`,
            tone: backlinks.lostBacklinks && backlinks.lostBacklinks > 0 ? "error" : void 0
          }
        )
      ] })
    }
  );
}
function AiVisibilityCard({
  projectId,
  aiVisibility
}) {
  if (!aiVisibility || aiVisibility.status === "empty") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(CardShell, { title: "AI visibility", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      EmptyCardBody,
      {
        message: "See how often ChatGPT and Google's AI Overview mention and cite your brand — then track your share of voice against competitors.",
        cta: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/p/$projectId/brand-lookup",
            params: { projectId },
            className: "btn btn-primary btn-sm",
            children: "Check AI visibility"
          }
        )
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    CardShell,
    {
      title: "AI visibility",
      stamp: `AI answer engines${aiVisibility.fetchedAt ? ` · updated ${formatDay(aiVisibility.fetchedAt)}` : ""}`,
      action: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/p/$projectId/brand-lookup",
          params: { projectId },
          className: moreDetailsClass,
          children: "More details"
        }
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Stat,
            {
              label: "AI mentions",
              value: formatCount$1(aiVisibility.totalMentions)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Stat,
            {
              label: "AI search volume",
              value: formatCount$1(aiVisibility.totalAiSearchVolume)
            }
          )
        ] }),
        aiVisibility.perPlatform.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-4 space-y-2", children: aiVisibility.perPlatform.map((platform) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "li",
          {
            className: "flex items-center justify-between gap-2 text-sm",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `size-2 shrink-0 rounded-full ${PLATFORM_DOT_CLASS[platform.platform]}`
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: formatPlatformLabel(platform.platform) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 tabular-nums text-base-content/60", children: [
                formatCount$1(platform.mentions),
                " mentions"
              ] })
            ]
          },
          platform.platform
        )) }) : null,
        aiVisibility.sampleQueries.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 border-t border-base-300 pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs uppercase tracking-wide text-base-content/60", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-3.5" }),
            "Prompts you surface for"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 space-y-1", children: aiVisibility.sampleQueries.map((query) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "li",
            {
              className: "truncate text-sm text-base-content/70",
              title: query,
              children: query
            },
            query
          )) })
        ] }) : null
      ]
    }
  );
}
const getDashboardActivation = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(dashboardProjectInputSchema).handler(createSsrRpc("a966ba8dbd2e5e2548b12a6c770c26da924f90ee327285fecd7df1d7afeafe95"));
const getDashboardOverview = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(dashboardProjectInputSchema).handler(createSsrRpc("bf7707a336fe5f1a810d29eb9ddb4ccee4b8a2f0ce88e94d04a295456d7e71d1"));
const getDashboardAiVisibility = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(dashboardProjectInputSchema).handler(createSsrRpc("c46a3f265ccf2f21a035eed3cfad00e4132083fc4ff825657a62dd54ce1e3306"));
const refreshDashboardBacklinkSnapshot = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(dashboardProjectInputSchema).handler(createSsrRpc("d8e8c6a9e4e7768403aa7d208c2346921cf9660a816886bf406dc62cd437a155"));
const markDashboardCompetitorClicked = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(dashboardProjectInputSchema).handler(createSsrRpc("7c953889116b01175d89dce1f11398e791a804844e06a729e8a40679c8e32137"));
const dismissDashboardMcpCard = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(dashboardProjectInputSchema).handler(createSsrRpc("8ea81290b22122bff668b72a4292383130de89933a300adb2f16caed61f53731"));
function firstPrompts(domain) {
  const site = domain ?? "my site";
  return [
    `Review ${site}. Ideas for what keywords we could target? Use OpenSEO`,
    "Research my competitors top pages and keywords and tell me what's working. Use OpenSEO"
  ];
}
function McpConnectCard({
  projectId,
  activation
}) {
  const queryClient = useQueryClient();
  const dismissMutation = useMutation({
    mutationFn: () => dismissDashboardMcpCard({ data: { projectId } }),
    onSuccess: () => void queryClient.invalidateQueries({
      queryKey: ["dashboardActivation", projectId]
    })
  });
  if (activation.mcp.firstToolCallAt || activation.mcp.cardDismissedAt) {
    return null;
  }
  const connected = activation.mcp.authorizedAt !== null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 px-5 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold leading-tight", children: "Connect your AI agent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        connected ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-success badge-outline badge-sm", children: "Connected" }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "btn btn-ghost btn-xs text-base-content/60",
            disabled: dismissMutation.isPending,
            onClick: () => {
              captureClientEvent("dashboard:mcp_already_connected");
              dismissMutation.mutate();
            },
            children: "I already connected"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 border-t border-base-300 p-5", children: connected ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70", children: "Your agent is connected. Try asking it:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: firstPrompts(activation.domain).map((prompt) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "li",
        {
          className: "flex items-center justify-between gap-2 rounded-md border border-base-300 bg-base-200/50 px-3 py-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate text-xs text-base-content/80", children: prompt }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CopyButton,
              {
                value: prompt,
                successMessage: "Prompt copied",
                iconOnly: true,
                onCopy: () => captureClientEvent("dashboard:mcp_prompt_copy")
              }
            )
          ]
        },
        prompt
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-base-content/50", children: "Waiting for your first call — this card disappears once your agent talks to OpenSEO." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm text-base-content/70", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "OpenSEO is designed to give your AI agent the data it needs to build a great SEO strategy and help you execute it." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "This way you aren’t limited on “AI credits”." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "You can work with your agent to figure out what automations make sense for you and it can help you write content too." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/ai",
          className: "link link-primary text-sm font-medium",
          onClick: () => captureClientEvent("dashboard:mcp_setup_open"),
          children: "Set up in AI & MCP →"
        }
      )
    ] }) })
  ] });
}
const HERO_COPY = {
  domain: {
    title: "What site are you working on?",
    body: "Set your project's domain and every card on this page starts working for it — backlinks and audits.",
    cta: "Save"
  },
  mcp: {
    title: "Connect your AI agent",
    body: "OpenSEO is built to be used from agents like Claude. Connect once, then ask it to use OpenSEO to help build your SEO strategy.",
    cta: "Show me how"
  },
  aeo: {
    title: "Check your AI visibility",
    body: "Search is no longer just Google. See how often ChatGPT and Google's AI Overview mention and cite your brand, and where you stand against competitors.",
    cta: "Run a Brand Lookup"
  },
  gsc: {
    title: "Connect Search Console",
    body: "Your real queries and clicks, straight from Google.",
    cta: "Connect"
  },
  competitor: {
    title: "Size up a competitor",
    body: "Paste a competitor's domain to see what they rank for and who links to them.",
    cta: "Open domain lookup"
  }
};
function scrollToCard(id) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}
function normalizeDomainInput(value) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}
function OnboardingChecklist({
  projectId,
  activation
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [domainInput, setDomainInput] = reactExports.useState("");
  const [viewedIndex, setViewedIndex] = reactExports.useState(null);
  const invalidateActivation = () => void queryClient.invalidateQueries({
    queryKey: ["dashboardActivation", projectId]
  });
  const competitorClickMutation = useMutation({
    mutationFn: () => markDashboardCompetitorClicked({ data: { projectId } }),
    onSuccess: invalidateActivation
  });
  const domainMutation = useMutation({
    mutationFn: (domain) => setProjectDomain({ data: { projectId, domain } }),
    onSuccess: () => {
      invalidateActivation();
      void queryClient.invalidateQueries({
        queryKey: ["dashboardOverview", projectId]
      });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => toast.error(
      getStandardErrorMessage(error, "Couldn't save the domain. Try again.")
    )
  });
  const nextStep = computeNextStep(activation);
  if (!nextStep) return null;
  const index = viewedIndex ?? STEP_ORDER.indexOf(nextStep);
  const step = STEP_ORDER[index];
  const copy = HERO_COPY[step];
  const done = isStepDone(activation, step);
  const page = (delta) => setViewedIndex(Math.min(Math.max(index + delta, 0), STEP_ORDER.length - 1));
  const onSubmitDomain = () => {
    const domain = normalizeDomainInput(domainInput);
    if (!domain) return;
    captureClientEvent("dashboard:next_move_click", { step: "domain" });
    domainMutation.mutate(domain);
  };
  const onCta = () => {
    captureClientEvent("dashboard:next_move_click", { step });
    if (step === "gsc") {
      scrollToCard("connect-gsc");
    } else if (step === "competitor") {
      competitorClickMutation.mutate();
      void navigate({ to: "/p/$projectId/domain", params: { projectId } });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-primary/25 bg-primary/5 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 px-5 pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wide text-primary", children: "Onboarding checklist" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `btn btn-ghost btn-xs btn-square ${index === 0 ? "invisible" : ""}`,
            "aria-label": "Previous step",
            disabled: index === 0,
            onClick: () => page(-1),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs tabular-nums text-base-content/60", children: [
          index + 1,
          " / ",
          STEP_ORDER.length
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `btn btn-ghost btn-xs btn-square ${index === STEP_ORDER.length - 1 ? "invisible" : ""}`,
            "aria-label": "Next step",
            disabled: index === STEP_ORDER.length - 1,
            onClick: () => page(1),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-row flex-wrap items-center justify-between gap-4 p-5 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: copy.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 max-w-xl text-sm text-base-content/70", children: copy.body })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex shrink-0 flex-wrap items-center gap-3", children: done ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-sm font-medium text-success", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4" }),
        "Done"
      ] }) : step === "domain" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "form",
        {
          className: "join",
          onSubmit: (event) => {
            event.preventDefault();
            onSubmitDomain();
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered join-item w-52",
                placeholder: "acme.com",
                value: domainInput,
                onChange: (event) => setDomainInput(event.target.value),
                "aria-label": "Your site's domain"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "submit",
                className: "btn btn-primary join-item",
                disabled: domainMutation.isPending || normalizeDomainInput(domainInput) === "",
                children: copy.cta
              }
            )
          ]
        }
      ) : step === "mcp" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/ai",
          className: "link link-primary text-sm font-medium",
          onClick: () => captureClientEvent("dashboard:next_move_click", { step }),
          children: [
            copy.cta,
            " →"
          ]
        }
      ) : step === "aeo" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/p/$projectId/brand-lookup",
          params: { projectId },
          className: "btn btn-primary",
          onClick: () => captureClientEvent("dashboard:next_move_click", { step }),
          children: copy.cta
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: onCta, children: copy.cta }) })
    ] })
  ] });
}
function DashboardPage({ projectId }) {
  const queryClient = useQueryClient();
  const activationQuery = useQuery({
    queryKey: ["dashboardActivation", projectId],
    queryFn: () => getDashboardActivation({ data: { projectId } })
  });
  const overviewQuery = useQuery({
    queryKey: ["dashboardOverview", projectId],
    queryFn: () => getDashboardOverview({ data: { projectId } })
  });
  const aiVisibilityQuery = useQuery({
    queryKey: ["dashboardAiVisibility", projectId],
    queryFn: () => getDashboardAiVisibility({ data: { projectId } })
  });
  const activation = activationQuery.data;
  const overview = overviewQuery.data;
  const aiVisibility = aiVisibilityQuery.data;
  const refreshMutation = useMutation({
    mutationFn: () => refreshDashboardBacklinkSnapshot({ data: { projectId } }),
    onSuccess: () => void queryClient.invalidateQueries({
      queryKey: ["dashboardOverview", projectId]
    })
  });
  const refreshFiredRef = reactExports.useRef(false);
  const needsSnapshot = activation?.domain != null && overview !== void 0 && (overview.backlinks === null || overview.backlinks.stale);
  reactExports.useEffect(() => {
    if (!needsSnapshot || refreshFiredRef.current) return;
    refreshFiredRef.current = true;
    refreshMutation.mutate();
  }, [needsSnapshot, refreshMutation]);
  if (activationQuery.isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-4 md:px-6 md:py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert alert-error", children: getStandardErrorMessage(activationQuery.error) }) });
  }
  if (!activation) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "mx-auto flex max-w-5xl flex-col gap-5 px-4 py-4 md:px-6 md:py-6",
        "aria-busy": true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-8 w-52" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-36" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-44" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-44" })
          ] })
        ]
      }
    );
  }
  const showBacklinks = activation.domain !== null;
  const gscConnected = activation.gsc.connected;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-5xl flex-col gap-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold", children: "Dashboard" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-base-content/60", children: "Your visibility across Google and AI answer engines — SEO and AEO in one place." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OnboardingChecklist, { projectId, activation }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid items-start gap-5 lg:grid-cols-2", children: [
      // Array order is the within-bucket order after the data-first sort:
      // the MCP pitch leads the setup cards.
      ...activation.mcp.firstToolCallAt || activation.mcp.cardDismissedAt ? [] : [
        {
          key: "mcp",
          hasData: false,
          node: /* @__PURE__ */ jsxRuntimeExports.jsx(
            McpConnectCard,
            {
              projectId,
              activation
            }
          )
        }
      ],
      {
        key: "gsc",
        hasData: gscConnected,
        node: /* @__PURE__ */ jsxRuntimeExports.jsx(GscCard, { projectId, connected: gscConnected })
      },
      {
        key: "ai-visibility",
        hasData: aiVisibility?.status === "cached",
        node: /* @__PURE__ */ jsxRuntimeExports.jsx(
          AiVisibilityCard,
          {
            projectId,
            aiVisibility: aiVisibility ?? null
          }
        )
      },
      {
        key: "audit",
        hasData: overview?.audit != null,
        node: /* @__PURE__ */ jsxRuntimeExports.jsx(
          AuditHealthCard,
          {
            projectId,
            audit: overview?.audit ?? null
          }
        )
      },
      ...showBacklinks ? [
        {
          key: "backlinks",
          hasData: overview?.backlinks != null || refreshMutation.isPending,
          node: /* @__PURE__ */ jsxRuntimeExports.jsx(
            BacklinkPulseCard,
            {
              projectId,
              backlinks: overview?.backlinks ?? null,
              refreshing: refreshMutation.isPending
            }
          )
        }
      ] : []
    ].toSorted((a, b) => Number(b.hasData) - Number(a.hasData)).map((card) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: card.node }, card.key)) })
  ] }) });
}
function DashboardRoute() {
  const {
    projectId
  } = Route.useParams();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPage, { projectId });
}
export {
  DashboardRoute as component
};
