import { aN as jsxRuntimeExports, aM as reactExports } from "./index-CSpjggkr.js";
import { s as useQuery, L as Link, I as useQueryClient, J as useMutation, t as toast, x as getStandardErrorMessage, j as useNavigate, $ as Route } from "./router-8qflvY1T.js";
import { S as SearchConsoleConnectionCard } from "./SearchConsoleConnectionCard-ILifWYun.js";
import { P as ProjectMarketFields } from "./ProjectMarketFields-BiZL6rWu.js";
import { g as getLastProjectId, c as clearLastProjectId } from "./active-project-DUKzBpe_.js";
import { u as updateProject, d as archiveProject, g as getProjects } from "./projects-Ca8yAMNt.js";
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
import "./middleware-CNUfdy2z.js";
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
import "./LocationSelect-COzx0aOt.js";
import "./search-D1JnBu8u.js";
import "./check-C_HETtUw.js";
import "./projects-BqTqxTTI.js";
function ProjectSettings({ projectId }) {
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects()
  });
  const projects = projectsQuery.data ?? [];
  const project = projects.find((entry) => entry.id === projectId) ?? null;
  if (!project) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-md" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-2xl space-y-8 p-4 py-8 sm:p-6 md:py-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/projects",
          className: "inline-flex items-center gap-1 text-sm text-base-content/60 transition-colors hover:text-base-content",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4" }),
            "Projects"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Project settings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/60", children: project.name })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GeneralSection, { project }, project.id),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "search-console", className: "space-y-3 scroll-mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-medium text-base-content/50", children: "Search Console" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SearchConsoleConnectionCard, { projectId })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DangerSection, { project, canArchive: projects.length > 1 })
  ] });
}
function GeneralSection({ project }) {
  const queryClient = useQueryClient();
  const [name, setName] = reactExports.useState(project.name);
  const [domain, setDomain] = reactExports.useState(project.domain ?? "");
  const [market, setMarket] = reactExports.useState({
    locationCode: project.locationCode,
    languageCode: project.languageCode
  });
  const updateMutation = useMutation({
    mutationFn: () => updateProject({
      data: {
        projectId: project.id,
        name: name.trim(),
        domain: domain.trim() || void 0,
        ...market
      }
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
    },
    onError: (error) => toast.error(getStandardErrorMessage(error, "Failed to update project"))
  });
  const isDirty = name.trim() !== project.name || (domain.trim() || "") !== (project.domain ?? "") || market.locationCode !== project.locationCode || market.languageCode !== project.languageCode;
  const handleSubmit = (event) => {
    event.preventDefault();
    if (updateMutation.isPending) return;
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    updateMutation.mutate();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-medium text-base-content/50", children: "General" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: name,
            onChange: (event) => setName(event.target.value),
            maxLength: 120,
            className: "input input-bordered w-full"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
          "Domain ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base-content/50", children: "(optional)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: domain,
            onChange: (event) => setDomain(event.target.value),
            placeholder: "example.com",
            maxLength: 255,
            className: "input input-bordered w-full"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectMarketFields, { value: market, onChange: setMarket }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-base-content/50", children: "Keyword, SERP, and domain data uses this country and language unless a call asks for a different one." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "submit",
          className: "btn btn-primary btn-sm",
          disabled: updateMutation.isPending || !isDirty,
          children: "Save changes"
        }
      ) })
    ] })
  ] });
}
function DangerSection({
  project,
  canArchive
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = reactExports.useState(false);
  const archiveMutation = useMutation({
    mutationFn: () => archiveProject({ data: { projectId: project.id } }),
    onSuccess: async () => {
      if (getLastProjectId() === project.id) clearLastProjectId();
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project archived");
      void navigate({ to: "/" });
    },
    onError: (error) => toast.error(getStandardErrorMessage(error, "Failed to archive project"))
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3 border-t border-base-300 pt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-medium text-base-content/50", children: "Archive project" }),
    confirming ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-base-content/70", children: [
        "Archiving",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-base-content", children: project.name }),
        " ",
        "removes it from your workspace and stops its scheduled rank tracking. You can restore it later from the Projects page."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "btn btn-error btn-sm",
            onClick: () => archiveMutation.mutate(),
            disabled: archiveMutation.isPending,
            children: "Yes, archive project"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "btn btn-ghost btn-sm",
            onClick: () => setConfirming(false),
            disabled: archiveMutation.isPending,
            children: "Cancel"
          }
        )
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/60", children: canArchive ? "Archive this project to remove it from your workspace." : "You can't archive your only project." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "btn btn-outline btn-error btn-sm shrink-0",
          onClick: () => setConfirming(true),
          disabled: !canArchive,
          children: "Archive project"
        }
      )
    ] })
  ] });
}
function ProjectSettingsRoute() {
  const {
    projectId
  } = Route.useParams();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full overflow-auto bg-base-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectSettings, { projectId }) });
}
export {
  ProjectSettingsRoute as component
};
