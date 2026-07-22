import { aM as reactExports, aN as jsxRuntimeExports, bt as LOCATIONS, bm as formatLocationLabel, bu as devicesLabel, bv as scheduleLabel } from "./index-CSpjggkr.js";
import { I as useQueryClient, s as useQuery, J as useMutation, t as toast, L as Link, K as ChevronRight, a0 as Route, j as useNavigate } from "./router-8qflvY1T.js";
import { E as EMPTY_DOMAIN_LIST_FILTERS, a as applyDomainListFilters, g as getDomainListFilterOptions, c as countActiveDomainListFilters, u as updateRankTrackingConfig, D as DomainListFilterBar, b as getRankTrackingConfigSummaries, R as RankTrackingConfigModal } from "./RankTrackingConfigModal-BDP_1q5T.js";
import { M as Modal } from "./Modal-BjHJzLad.js";
import { P as Plus } from "./plus-ClJgelga.js";
import { G as Globe } from "./globe-xsi-TwrE.js";
import { S as Search } from "./search-D1JnBu8u.js";
import { A as Archive } from "./archive-BFXQyJA4.js";
import { T as TriangleAlert } from "./triangle-alert-CtV7H1mP.js";
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
import "./LocationSelect-COzx0aOt.js";
import "./check-C_HETtUw.js";
import "./useProjectMarket-F4mg8Pyy.js";
import "./projects-Ca8yAMNt.js";
import "./projects-BqTqxTTI.js";
import "./domain-BlEbj7dg.js";
import "./rank-tracking-CcqQFlKD.js";
import "./sparkles-D0nOSwIL.js";
import "./info-xwL8JFDq.js";
const FILTER_BAR_MIN_DOMAINS = 6;
function RankTrackingDomainList({
  projectId,
  onAddDomain
}) {
  const queryClient = useQueryClient();
  const [archiveTarget, setArchiveTarget] = reactExports.useState(
    null
  );
  const [filters, setFilters] = reactExports.useState(
    EMPTY_DOMAIN_LIST_FILTERS
  );
  const { data: summaries } = useQuery({
    queryKey: ["rankTrackingConfigSummaries", projectId],
    queryFn: () => getRankTrackingConfigSummaries({ data: { projectId } })
  });
  const allSummaries = reactExports.useMemo(() => summaries ?? [], [summaries]);
  const filteredSummaries = reactExports.useMemo(
    () => applyDomainListFilters(allSummaries, filters),
    [allSummaries, filters]
  );
  const filterOptions = reactExports.useMemo(
    () => getDomainListFilterOptions(allSummaries),
    [allSummaries]
  );
  const activeFilterCount = countActiveDomainListFilters(filters);
  const archiveMutation = useMutation({
    mutationFn: (configId) => updateRankTrackingConfig({
      data: { projectId, configId, isActive: false }
    }),
    onSuccess: () => {
      setArchiveTarget(null);
      void queryClient.invalidateQueries({
        queryKey: ["rankTrackingConfigSummaries", projectId]
      });
      void queryClient.invalidateQueries({
        queryKey: ["rankTrackingConfigs", projectId]
      });
      toast.success("Domain archived");
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card bg-base-100 border border-base-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-body gap-0 p-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-5 pt-4 pb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: "Tracked Domains" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "btn btn-primary btn-sm gap-1",
            onClick: onAddDomain,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" }),
              "Add Domain"
            ]
          }
        )
      ] }),
      (allSummaries.length >= FILTER_BAR_MIN_DOMAINS || activeFilterCount > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx(
        DomainListFilterBar,
        {
          filters,
          options: filterOptions,
          activeFilterCount,
          onChange: setFilters,
          onReset: () => setFilters(EMPTY_DOMAIN_LIST_FILTERS)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-base-300 border-t border-base-300", children: allSummaries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-10 text-center space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex size-10 items-center justify-center rounded-xl bg-base-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "size-5 text-base-content/40" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-base-content/70", children: "No tracked domains yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-base-content/40", children: "Add a domain to start monitoring keyword rankings over time." })
      ] }) : filteredSummaries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-10 text-center space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex size-10 items-center justify-center rounded-xl bg-base-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-5 text-base-content/40" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-base-content/70", children: "No matching tracked domains" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-base-content/40", children: "Try clearing search or adjusting filters." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "btn btn-ghost btn-xs",
            onClick: () => setFilters(EMPTY_DOMAIN_LIST_FILTERS),
            disabled: activeFilterCount === 0,
            children: "Clear filters"
          }
        )
      ] }) : filteredSummaries.map((summary) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        DomainRow,
        {
          projectId,
          summary,
          onArchive: () => setArchiveTarget(summary)
        },
        summary.id
      )) })
    ] }),
    archiveTarget && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Modal,
      {
        onClose: () => setArchiveTarget(null),
        labelledBy: "archive-domain-title",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { id: "archive-domain-title", className: "text-lg font-semibold", children: [
            "Archive ",
            archiveTarget.domain,
            "?"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70", children: "Scheduled checks will stop and this domain will be hidden from the list. Ranking history is preserved." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "btn btn-ghost btn-sm",
                onClick: () => setArchiveTarget(null),
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "btn btn-error btn-sm gap-1",
                onClick: () => archiveMutation.mutate(archiveTarget.id),
                disabled: archiveMutation.isPending,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, { className: "size-3.5" }),
                  "Archive"
                ]
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function DomainRow({
  projectId,
  summary,
  onArchive
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex w-full items-center gap-4 px-5 py-3.5 transition-colors hover:bg-base-200/50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/p/$projectId/rank-tracking/$configId",
        params: { projectId, configId: summary.id },
        className: "absolute inset-0 z-0",
        "aria-label": `Open ${summary.domain}`
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium truncate", children: summary.domain }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-base-content/60", children: [
        summary.locationName ? formatLocationLabel(summary.locationName, 2) : LOCATIONS[summary.locationCode] ?? "US",
        " ",
        "· ",
        devicesLabel(summary.devices),
        " ·",
        " ",
        scheduleLabel(summary.scheduleInterval),
        summary.lastRunCompletedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          " ",
          "· Last:",
          " ",
          new Date(summary.lastRunCompletedAt).toLocaleDateString()
        ] })
      ] }),
      summary.lastSkipReason === "insufficient_credits" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1 text-xs text-warning", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3" }),
        "Scheduled check skipped — insufficient credits"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:flex items-center gap-6 text-sm pointer-events-none", children: summary.keywordCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-base-content/60", children: "Keywords" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-medium", children: summary.keywordCount })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-xs text-base-content/40 hover:text-error relative z-10",
        title: "Archive domain",
        onClick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          onArchive();
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4 shrink-0 text-base-content/40 pointer-events-none" })
  ] });
}
function RankTrackingIndex() {
  const {
    projectId
  } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfigModal, setShowConfigModal] = reactExports.useState(false);
  const invalidateConfigs = () => {
    void queryClient.invalidateQueries({
      queryKey: ["rankTrackingConfigs", projectId]
    });
    void queryClient.invalidateQueries({
      queryKey: ["rankTrackingConfigSummaries", projectId]
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(RankTrackingDomainList, { projectId, onAddDomain: () => setShowConfigModal(true) }),
    showConfigModal && /* @__PURE__ */ jsxRuntimeExports.jsx(RankTrackingConfigModal, { projectId, existingConfig: null, onClose: () => setShowConfigModal(false), onConfigCreated: invalidateConfigs, onSaved: (createdConfigId) => {
      setShowConfigModal(false);
      invalidateConfigs();
      if (createdConfigId) {
        void navigate({
          to: "/p/$projectId/rank-tracking/$configId",
          params: {
            projectId,
            configId: createdConfigId
          }
        });
      }
    } })
  ] });
}
export {
  RankTrackingIndex as component
};
