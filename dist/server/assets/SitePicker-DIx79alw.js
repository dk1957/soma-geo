import { aN as jsxRuntimeExports, bp as GSC_SELF_HOSTED_SETUP_DOCS_URL } from "./index-CSpjggkr.js";
import { S as SafeExternalLink } from "./SafeExternalLink-CzHkCMkV.js";
import { T as TriangleAlert } from "./triangle-alert-CtV7H1mP.js";
import { G as GoogleGlyph, a as startGscLink } from "./startGscLink-DDsqhlAZ.js";
function SelfHostedSetupWarning() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert alert-warning items-start text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "mt-0.5 size-4 shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Google OAuth client not configured" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base-content/70", children: "Add your Google client ID and secret to this OpenSEO deployment before connecting Search Console." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SafeExternalLink,
        {
          url: GSC_SELF_HOSTED_SETUP_DOCS_URL,
          label: "Open setup guide",
          className: "inline-flex items-center gap-1 font-medium underline underline-offset-2"
        }
      )
    ] })
  ] });
}
function SitePicker({
  loading,
  error,
  accounts,
  selection,
  onSelect,
  onSave,
  saving,
  onRetry,
  onReconnect,
  secondaryAction
}) {
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-base-content/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-sm" }),
      "Loading properties…"
    ] });
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: "Couldn't load your Search Console properties." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "btn btn-ghost btn-sm",
          onClick: onRetry,
          children: "Try again"
        }
      )
    ] });
  }
  const allAccountsRequireReconnect = accounts.length > 0 && accounts.every((account) => account.requiresReconnect);
  if (allAccountsRequireReconnect) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: "Connection expired. Reconnect to continue." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onReconnect,
          className: "inline-flex items-center gap-2.5 rounded-lg border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-base-200",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleGlyph, { className: "size-[18px]" }),
            "Reconnect with Google"
          ]
        }
      )
    ] });
  }
  const healthyAccounts = accounts.filter(
    (account) => !account.requiresReconnect
  );
  const options = healthyAccounts.flatMap(
    (account) => account.sites.map((site) => ({
      accountId: account.accountId,
      siteUrl: site.siteUrl
    }))
  );
  const selectedIndex = selection ? options.findIndex(
    (option) => option.accountId === selection.accountId && option.siteUrl === selection.siteUrl
  ) : -1;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-sm font-medium text-base-content/80", children: "Property" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          className: "select select-bordered w-full max-w-md",
          value: selectedIndex >= 0 ? String(selectedIndex) : "",
          onChange: (event) => {
            const option = options[Number(event.target.value)];
            if (option) onSelect(option);
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: "Select a property…" }),
            healthyAccounts.map((account) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "optgroup",
              {
                label: account.email ?? "Google account",
                children: account.sites.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("option", { disabled: true, children: "No properties" }) : account.sites.map((site) => {
                  const index = options.findIndex(
                    (option) => option.accountId === account.accountId && option.siteUrl === site.siteUrl
                  );
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "option",
                    {
                      value: index,
                      disabled: !site.selectable,
                      children: [
                        site.siteUrl,
                        site.selectable ? "" : "  (no access)"
                      ]
                    },
                    site.siteUrl
                  );
                })
              },
              account.accountId
            ))
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "btn btn-primary btn-sm",
          onClick: onSave,
          disabled: selectedIndex < 0 || saving,
          children: saving ? "Saving…" : "Save property"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "btn btn-ghost btn-sm",
          onClick: () => void startGscLink(window.location.href),
          children: "Connect another Google account"
        }
      ),
      secondaryAction ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: [
            "btn btn-ghost btn-sm",
            secondaryAction.destructive ? "text-error hover:bg-error/10" : ""
          ].join(" "),
          onClick: secondaryAction.onClick,
          disabled: secondaryAction.disabled,
          children: secondaryAction.label
        }
      ) : null
    ] })
  ] });
}
export {
  SelfHostedSetupWarning as S,
  SitePicker as a
};
