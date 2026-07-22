import { aM as reactExports, bo as DEFAULT_LOCATION_CODE, ah as getLanguageCode, aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { j as useNavigate, I as useQueryClient, J as useMutation, t as toast, x as getStandardErrorMessage, s as useQuery, L as Link, K as ChevronRight } from "./router-8qflvY1T.js";
import { c as createProject, r as restoreProject, g as getProjects, a as getArchivedProjects } from "./projects-Ca8yAMNt.js";
import { s as setLastProjectId, g as getLastProjectId } from "./active-project-DUKzBpe_.js";
import { M as Modal } from "./Modal-BjHJzLad.js";
import { P as ProjectMarketFields } from "./ProjectMarketFields-BiZL6rWu.js";
import { P as Plus } from "./plus-ClJgelga.js";
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
import "./projects-BqTqxTTI.js";
import "./LocationSelect-COzx0aOt.js";
import "./search-D1JnBu8u.js";
import "./check-C_HETtUw.js";
function CreateProjectModal({ onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = reactExports.useState("");
  const [domain, setDomain] = reactExports.useState("");
  const [market, setMarket] = reactExports.useState({
    locationCode: DEFAULT_LOCATION_CODE,
    languageCode: getLanguageCode(DEFAULT_LOCATION_CODE)
  });
  const createMutation = useMutation({
    mutationFn: () => createProject({
      data: {
        name: name.trim(),
        domain: domain.trim() || void 0,
        ...market
      }
    }),
    onSuccess: async (created) => {
      setLastProjectId(created.id);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
      toast.success("Project created");
      void navigate({
        to: "/p/$projectId/settings",
        params: { projectId: created.id }
      });
    },
    onError: (error) => toast.error(getStandardErrorMessage(error, "Failed to create project"))
  });
  const isPending = createMutation.isPending;
  const handleSubmit = (event) => {
    event.preventDefault();
    if (isPending) return;
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    createMutation.mutate();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      maxWidth: "max-w-md",
      onClose: isPending ? void 0 : onClose,
      labelledBy: "create-project-title",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "create-project-title", className: "text-lg font-semibold", children: "New project" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: name,
              onChange: (event) => setName(event.target.value),
              placeholder: "Acme Inc.",
              maxLength: 120,
              autoFocus: true,
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
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-base-content/50", children: "You can connect Search Console and set up rank tracking after creating the project." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectMarketFields, { value: market, onChange: setMarket }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-base-content/50", children: "Keyword, SERP, and domain data uses this country and language unless a call asks for a different one. Change it later in project settings." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "btn btn-ghost btn-sm",
              onClick: onClose,
              disabled: isPending,
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "submit",
              className: "btn btn-primary btn-sm",
              disabled: isPending,
              children: "Create project"
            }
          )
        ] })
      ] })
    }
  );
}
function ProjectsPage() {
  const [creating, setCreating] = reactExports.useState(false);
  const [currentProjectId, setCurrentProjectId] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setCurrentProjectId(getLastProjectId());
  }, []);
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects()
  });
  const projects = projectsQuery.data ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full overflow-auto bg-base-100 px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Projects" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-base-content/60", children: "Each project is a separate workspace with its own Search Console, rank tracking, and audits." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "btn btn-primary btn-sm shrink-0", onClick: () => setCreating(true), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
          "New project"
        ] })
      ] }),
      projectsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-md" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-base-300 overflow-hidden rounded-lg border border-base-300", children: projects.map((project) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/p/$projectId/settings", params: {
        projectId: project.id
      }, className: "flex items-center justify-between gap-3 p-3 transition-colors hover:bg-base-200/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-medium", children: project.name }),
            project.id === currentProjectId ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 rounded-full bg-base-300/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-base-content/60", children: "Current" }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs text-base-content/50", children: project.domain ?? "No domain set" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4 shrink-0 text-base-content/40" })
      ] }) }, project.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArchivedProjects, {})
    ] }),
    creating ? /* @__PURE__ */ jsxRuntimeExports.jsx(CreateProjectModal, { onClose: () => setCreating(false) }) : null
  ] });
}
function ArchivedProjects() {
  const queryClient = useQueryClient();
  const archivedQuery = useQuery({
    queryKey: ["projects", "archived"],
    queryFn: () => getArchivedProjects()
  });
  const archived = archivedQuery.data ?? [];
  const restoreMutation = useMutation({
    mutationFn: (projectId) => restoreProject({
      data: {
        archivedProjectId: projectId
      }
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["projects"]
      });
      toast.success("Project restored");
    },
    onError: (error) => toast.error(getStandardErrorMessage(error, "Failed to restore project"))
  });
  if (archived.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-medium text-base-content/50", children: "Archived" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-base-300 overflow-hidden rounded-lg border border-base-300", children: archived.map((project) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between gap-3 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-medium text-base-content/70", children: project.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs text-base-content/50", children: project.domain ?? "No domain set" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-ghost btn-sm shrink-0", onClick: () => restoreMutation.mutate(project.id), disabled: restoreMutation.isPending, children: "Restore" })
    ] }, project.id)) })
  ] });
}
export {
  ProjectsPage as component
};
