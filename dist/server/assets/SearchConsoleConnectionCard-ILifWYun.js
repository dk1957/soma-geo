import { aL as isHostedClientAuthMode, aM as reactExports, aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { I as useQueryClient, s as useQuery, J as useMutation, t as toast, x as getStandardErrorMessage, c as captureClientEvent } from "./router-8qflvY1T.js";
import { s as setGscSite, d as disconnectGsc, G as GoogleGlyph, a as startGscLink, g as getGscConnection, l as listGscSites } from "./startGscLink-DDsqhlAZ.js";
import { S as SelfHostedSetupWarning, a as SitePicker } from "./SitePicker-DIx79alw.js";
const GRANT_STATUS_KEY = ["gscGrantStatus"];
function SearchConsoleConnectionCard({
  projectId
}) {
  const hosted = isHostedClientAuthMode();
  const queryClient = useQueryClient();
  const [picking, setPicking] = reactExports.useState(false);
  const [selection, setSelection] = reactExports.useState(
    null
  );
  const connectionKey = ["gscConnection", projectId];
  const connectionQuery = useQuery({
    queryKey: connectionKey,
    queryFn: () => getGscConnection({ data: { projectId } })
  });
  const connection = connectionQuery.data;
  const connected = Boolean(connection?.connected);
  const selfHostedNeedsSetup = !hosted && connectionQuery.isSuccess && !connection?.googleOAuthConfigured;
  const showPicker = picking || connection?.currentUserHasGrant && !connected;
  const sitesQuery = useQuery({
    queryKey: ["gscSites", projectId],
    queryFn: () => listGscSites({ data: { projectId } }),
    enabled: Boolean(showPicker && !selfHostedNeedsSetup)
  });
  const accounts = reactExports.useMemo(
    () => sitesQuery.data?.accounts ?? [],
    [sitesQuery.data?.accounts]
  );
  const requiresReconnect = accounts.some(
    (account) => account.requiresReconnect
  );
  reactExports.useEffect(() => {
    if (!requiresReconnect) return;
    void queryClient.invalidateQueries({
      queryKey: ["gscConnection", projectId]
    });
    void queryClient.invalidateQueries({ queryKey: GRANT_STATUS_KEY });
  }, [requiresReconnect, queryClient, projectId]);
  reactExports.useEffect(() => {
    if (selection) return;
    for (const account of accounts) {
      const selectedSite = account.sites.find((site) => site.isSelected);
      if (selectedSite) {
        setSelection({
          accountId: account.accountId,
          siteUrl: selectedSite.siteUrl
        });
        return;
      }
    }
  }, [accounts, selection]);
  const setSiteMutation = useMutation({
    mutationFn: (selected) => setGscSite({ data: { projectId, ...selected } }),
    onSuccess: () => {
      captureClientEvent("gsc:property_select");
      toast.success("Search Console connected");
      setPicking(false);
      void queryClient.invalidateQueries({ queryKey: connectionKey });
      void queryClient.invalidateQueries({ queryKey: GRANT_STATUS_KEY });
      void queryClient.invalidateQueries({
        queryKey: ["searchPerformance", projectId]
      });
      void queryClient.invalidateQueries({
        queryKey: ["searchPerformanceTable", projectId]
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboardActivation", projectId]
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboardGscReport", projectId]
      });
    },
    onError: (error) => toast.error(getStandardErrorMessage(error))
  });
  const disconnectMutation = useMutation({
    mutationFn: () => disconnectGsc({ data: { projectId } }),
    onSuccess: () => {
      toast.success("Search Console disconnected");
      setPicking(false);
      setSelection(null);
      void queryClient.invalidateQueries({ queryKey: connectionKey });
      void queryClient.invalidateQueries({ queryKey: GRANT_STATUS_KEY });
      void queryClient.invalidateQueries({
        queryKey: ["searchPerformance", projectId]
      });
      void queryClient.invalidateQueries({
        queryKey: ["searchPerformanceTable", projectId]
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboardActivation", projectId]
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboardGscReport", projectId]
      });
    },
    onError: (error) => toast.error(getStandardErrorMessage(error))
  });
  const handleConnect = () => void startGscLink(window.location.href);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    IntegrationCard,
    {
      status: connectionQuery.isLoading ? void 0 : selfHostedNeedsSetup ? "setup_required" : connected ? "connected" : "disconnected",
      children: connectionQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-base-content/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-sm" }),
        "Checking…"
      ] }) : selfHostedNeedsSetup ? /* @__PURE__ */ jsxRuntimeExports.jsx(SelfHostedSetupWarning, {}) : connected && !picking ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        ConnectedState,
        {
          siteUrl: connection?.siteUrl ?? "",
          connectedByEmail: connection?.connectedByEmail ?? null,
          onChange: () => {
            setSelection(null);
            setPicking(true);
          },
          onDisconnect: () => disconnectMutation.mutate(),
          disconnecting: disconnectMutation.isPending
        }
      ) : showPicker ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        SitePicker,
        {
          loading: sitesQuery.isLoading,
          error: sitesQuery.isError,
          accounts,
          selection,
          onSelect: setSelection,
          onSave: () => selection && setSiteMutation.mutate(selection),
          saving: setSiteMutation.isPending,
          onRetry: () => void sitesQuery.refetch(),
          onReconnect: handleConnect,
          secondaryAction: connected ? { label: "Cancel", onClick: () => setPicking(false) } : {
            label: "Disconnect",
            destructive: true,
            disabled: disconnectMutation.isPending,
            onClick: () => disconnectMutation.mutate()
          }
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70", children: "Connect GSC to see how your website is actually performing in Google Search." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: handleConnect,
            className: "inline-flex items-center gap-2.5 rounded-lg border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold text-base-content shadow-sm transition hover:bg-base-200 hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleGlyph, { className: "size-[18px]" }),
              "Connect with Google"
            ]
          }
        )
      ] })
    }
  );
}
function IntegrationCard({
  status,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 p-5 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold leading-tight", children: "Google Search Console" }),
      status ? /* @__PURE__ */ jsxRuntimeExports.jsx(StatusPill, { status }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-base-300 p-5 sm:p-6", children })
  ] });
}
function StatusPill({
  status
}) {
  const connected = status === "connected";
  const setupRequired = status === "setup_required";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: [
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        connected ? "border-success/30 bg-success/10 text-success" : setupRequired ? "border-warning/30 bg-warning/10 text-warning" : "border-base-300 bg-base-200 text-base-content/60"
      ].join(" "),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: [
              "size-1.5 rounded-full",
              connected ? "bg-success" : setupRequired ? "bg-warning" : "bg-base-content/40"
            ].join(" ")
          }
        ),
        connected ? "Connected" : setupRequired ? "Setup required" : "Not connected"
      ]
    }
  );
}
function ConnectedState({
  siteUrl,
  connectedByEmail,
  onChange,
  onDisconnect,
  disconnecting
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-base-300 bg-base-200/40 p-3.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid size-9 shrink-0 place-items-center rounded-md border border-base-300 bg-base-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleGlyph, { className: "size-[18px]" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-mono text-sm", children: siteUrl }),
        connectedByEmail ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "truncate text-xs text-base-content/55", children: [
          "Connected by ",
          connectedByEmail
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "btn btn-ghost btn-sm",
          onClick: onChange,
          children: "Change property"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "btn btn-ghost btn-sm text-error hover:bg-error/10",
          onClick: onDisconnect,
          disabled: disconnecting,
          children: "Disconnect"
        }
      )
    ] })
  ] });
}
export {
  SearchConsoleConnectionCard as S
};
