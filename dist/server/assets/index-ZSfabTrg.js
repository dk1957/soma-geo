import { aM as reactExports, aS as SUBSCRIBE_ROUTE, aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { j as useNavigate, s as useQuery, v as getErrorCode, w as AuthConfigErrorCard, x as getStandardErrorMessage, U as UnauthenticatedErrorCard } from "./router-8qflvY1T.js";
import { g as getProjects } from "./projects-Ca8yAMNt.js";
import { g as getLastProjectId, c as clearLastProjectId } from "./active-project-DUKzBpe_.js";
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
function IndexRedirect() {
  const navigate = useNavigate();
  const {
    data,
    error,
    isError,
    refetch
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
    retry: false
  });
  reactExports.useEffect(() => {
    if (!data || data.length === 0) return;
    const lastProjectId = getLastProjectId();
    const target = data.find((project) => project.id === lastProjectId);
    if (lastProjectId && !target) {
      clearLastProjectId();
    }
    void navigate({
      to: "/p/$projectId",
      params: {
        projectId: (target ?? data[0]).id
      }
    });
  }, [data, navigate]);
  reactExports.useEffect(() => {
    if (getErrorCode(error) !== "PAYMENT_REQUIRED") {
      return;
    }
    void navigate({
      href: SUBSCRIBE_ROUTE
    });
  }, [error, navigate]);
  if (isError) {
    const errorCode = getErrorCode(error);
    if (errorCode === "AUTH_CONFIG_MISSING") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuthConfigErrorCard, { message: getStandardErrorMessage(error, "An unexpected error occurred. Please check server logs."), onRetry: () => {
        void refetch();
      } }) });
    }
    if (errorCode === "UNAUTHENTICATED") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UnauthenticatedErrorCard, { message: "Please sign in to access your OpenSEO workspace.", onRetry: () => {
        void refetch();
      } }) });
    }
    if (errorCode === "PAYMENT_REQUIRED") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col items-center gap-3 max-w-xl text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base-content/80", children: "Redirecting you to billing so you can start a hosted subscription." }) }) });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col items-center gap-3 max-w-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-error text-center", children: getStandardErrorMessage(error, "An unexpected error occurred. Please check server logs.") }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-md" }) });
}
export {
  IndexRedirect as component
};
