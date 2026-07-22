import { cn as useRouter, aN as jsxRuntimeExports, aM as reactExports, aL as isHostedClientAuthMode, br as BILLING_ROUTE, y as createServerFn, aO as isEmailVerificationBypassed } from "./index-CSpjggkr.js";
import { q as createLucideIcon, c8 as linkOptions, j as useNavigate, s as useQuery, J as useMutation, a_ as LoaderCircle, b5 as X, L as Link, u as useSession, C as signOutAndRedirect, H as ExternalLink, I as useQueryClient, a8 as onboardingAnswersQueryOptions, c9 as dismissGscNudge, c as captureClientEvent, p as createSsrRpc } from "./router-8qflvY1T.js";
import { b as GoogleGlyphMuted, G as GoogleGlyph, a as startGscLink, c as getGscGrantStatus } from "./startGscLink-DDsqhlAZ.js";
import { S as Search } from "./search-D1JnBu8u.js";
import { T as TrendingUp } from "./trending-up-X-1NsOJn.js";
import { G as Globe } from "./globe-xsi-TwrE.js";
import { L as Link2 } from "./link-2-DINJs8Ac.js";
import { S as Sparkles } from "./sparkles-D0nOSwIL.js";
import { M as MessageSquare } from "./message-square-CT-tSvNg.js";
import { i as invalidateSamSessions, c as createSamSession, a as archiveSamSession, s as samSessionsQueryOptions } from "./samQueries-cDPgZMT_.js";
import { P as Plus } from "./plus-ClJgelga.js";
import { A as Archive } from "./archive-BFXQyJA4.js";
import { T as ThemePreferenceMenuItems } from "./ThemePreferenceMenuItems-Mim5Z20v.js";
import { U as User } from "./user-C7Ul5Qsq.js";
import { S as Settings } from "./settings-CYIgHtaE.js";
import { T as TriangleAlert } from "./triangle-alert-CtV7H1mP.js";
import { M as Modal } from "./Modal-BjHJzLad.js";
import { g as getProjects } from "./projects-Ca8yAMNt.js";
import { s as setLastProjectId, g as getLastProjectId } from "./active-project-DUKzBpe_.js";
import { C as Check } from "./check-C_HETtUw.js";
import { a as requireAuthenticatedContext } from "./middleware-CNUfdy2z.js";
function useLocation(opts) {
  const router = useRouter();
  {
    const location = router.stores.location.get();
    return opts?.select ? opts.select(location) : location;
  }
}
const __iconNode$b = [
  ["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z", key: "1fy3hk" }]
];
const Bookmark = createLucideIcon("bookmark", __iconNode$b);
const __iconNode$a = [
  ["path", { d: "M12 8V4H8", key: "hb8ula" }],
  ["rect", { width: "16", height: "12", x: "4", y: "8", rx: "2", key: "enze0r" }],
  ["path", { d: "M2 14h2", key: "vft8re" }],
  ["path", { d: "M20 14h2", key: "4cs60a" }],
  ["path", { d: "M15 13v2", key: "1xurst" }],
  ["path", { d: "M9 13v2", key: "rq6x2g" }]
];
const Bot = createLucideIcon("bot", __iconNode$a);
const __iconNode$9 = [
  ["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
  ["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }]
];
const ChevronsUpDown = createLucideIcon("chevrons-up-down", __iconNode$9);
const __iconNode$8 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", key: "1u773s" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
const CircleQuestionMark = createLucideIcon("circle-question-mark", __iconNode$8);
const __iconNode$7 = [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" }],
  [
    "path",
    {
      d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
      key: "116196"
    }
  ],
  ["path", { d: "m9 14 2 2 4-4", key: "df797q" }]
];
const ClipboardCheck = createLucideIcon("clipboard-check", __iconNode$7);
const __iconNode$6 = [
  ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "ynyp8z" }],
  ["line", { x1: "2", x2: "22", y1: "10", y2: "10", key: "1b3vmo" }]
];
const CreditCard = createLucideIcon("credit-card", __iconNode$6);
const __iconNode$5 = [
  [
    "path",
    {
      d: "M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.98a2 2 0 0 1 1.69.9l.66 1.2A2 2 0 0 0 12 6h8a2 2 0 0 1 2 2v3.3",
      key: "128dxu"
    }
  ],
  ["path", { d: "m14.305 19.53.923-.382", key: "3m78fa" }],
  ["path", { d: "m15.228 16.852-.923-.383", key: "npixar" }],
  ["path", { d: "m16.852 15.228-.383-.923", key: "5xggr7" }],
  ["path", { d: "m16.852 20.772-.383.924", key: "dpfhf9" }],
  ["path", { d: "m19.148 15.228.383-.923", key: "1reyyz" }],
  ["path", { d: "m19.53 21.696-.382-.924", key: "1goivc" }],
  ["path", { d: "m20.772 16.852.924-.383", key: "htqkph" }],
  ["path", { d: "m20.772 19.148.924.383", key: "9w9pjp" }],
  ["circle", { cx: "18", cy: "18", r: "3", key: "1xkwt0" }]
];
const FolderCog = createLucideIcon("folder-cog", __iconNode$5);
const __iconNode$4 = [
  ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
  ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" }],
  ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" }],
  ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" }]
];
const LayoutDashboard = createLucideIcon("layout-dashboard", __iconNode$4);
const __iconNode$3 = [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "1g98yp" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }],
  ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1", key: "nxv5o0" }],
  ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1", key: "1bb6yr" }]
];
const LayoutGrid = createLucideIcon("layout-grid", __iconNode$3);
const __iconNode$2 = [
  ["path", { d: "m16 17 5-5-5-5", key: "1bji2h" }],
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }]
];
const LogOut = createLucideIcon("log-out", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M4 12h16", key: "1lakjw" }],
  ["path", { d: "M4 18h16", key: "19g7jn" }],
  ["path", { d: "M4 6h16", key: "1o0s65" }]
];
const Menu = createLucideIcon("menu", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
      key: "1sd12s"
    }
  ]
];
const MessageCircle = createLucideIcon("message-circle", __iconNode);
const projectNavItems = [
  {
    to: "/p/$projectId",
    label: "Dashboard",
    icon: LayoutDashboard,
    // Without exact matching, the index path is a prefix of every project
    // route and the Dashboard item would render active everywhere.
    activeOptions: { exact: true, includeSearch: false }
  },
  {
    to: "/p/$projectId/keywords",
    label: "Keyword Research",
    icon: Search
  },
  {
    to: "/p/$projectId/saved",
    label: "Saved Keywords",
    icon: Bookmark
  },
  {
    to: "/p/$projectId/rank-tracking",
    label: "Rank Tracking",
    icon: TrendingUp
  },
  {
    to: "/p/$projectId/search-performance",
    label: "GSC Insights",
    icon: GoogleGlyphMuted
  },
  {
    to: "/p/$projectId/domain",
    label: "Domain Overview",
    icon: Globe
  },
  {
    to: "/p/$projectId/backlinks",
    label: "Backlinks",
    icon: Link2
  },
  {
    to: "/p/$projectId/audit",
    label: "Site Audit",
    icon: ClipboardCheck
  },
  {
    to: "/p/$projectId/brand-lookup",
    label: "Brand Lookup",
    icon: Sparkles
  },
  {
    to: "/p/$projectId/prompt-explorer",
    label: "Prompt Explorer",
    icon: MessageSquare
  }
];
const aiNavItem = linkOptions({
  to: "/ai",
  label: "AI & MCP",
  icon: Bot
});
const connectNavGroup = {
  label: "Connect",
  items: [aiNavItem]
};
function getProjectNavItems(projectId) {
  return linkOptions(
    projectNavItems.map((item) => ({
      ...item,
      params: { projectId },
      search: {}
    }))
  );
}
function getProjectNavGroups(projectId) {
  const all = getProjectNavItems(projectId);
  const byPath = (path) => all.find((i) => i.to === path);
  return [
    {
      label: "Overview",
      items: [byPath("/p/$projectId")]
    },
    {
      label: "AI Visibility",
      items: [
        byPath("/p/$projectId/brand-lookup"),
        byPath("/p/$projectId/prompt-explorer")
      ]
    },
    {
      label: "SEO Research",
      items: [
        byPath("/p/$projectId/keywords"),
        byPath("/p/$projectId/domain"),
        byPath("/p/$projectId/backlinks")
      ]
    },
    {
      label: "My Site",
      items: [
        byPath("/p/$projectId/search-performance"),
        byPath("/p/$projectId/rank-tracking"),
        byPath("/p/$projectId/saved"),
        byPath("/p/$projectId/audit")
      ]
    }
  ];
}
const dataforseoHelpLinkOptions = linkOptions({
  to: "/help/dataforseo-api-key"
});
const BETA_NOTICE_DISMISSED_KEY = "sam-beta-notice-dismissed";
function BetaNotice() {
  const [dismissed, setDismissed] = reactExports.useState(true);
  reactExports.useEffect(() => {
    setDismissed(localStorage.getItem(BETA_NOTICE_DISMISSED_KEY) === "1");
  }, []);
  if (dismissed) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-2 mb-2 rounded-lg border border-base-300 bg-base-100 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-primary badge-sm", children: "Beta" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          "aria-label": "Dismiss",
          className: "btn btn-ghost btn-xs btn-square text-base-content/40",
          onClick: () => {
            localStorage.setItem(BETA_NOTICE_DISMISSED_KEY, "1");
            setDismissed(true);
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs text-base-content/70", children: "For more powerful AI workflows, use the OpenSEO MCP with your own agent like Claude Code or Hermes." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/ai", className: "link link-primary mt-1.5 inline-block text-xs", children: "Set up the MCP →" })
  ] });
}
function ageLabel(timestamp) {
  const iso = timestamp.includes("T") ? timestamp : `${timestamp}Z`;
  const then = new Date(iso.replace(" ", "T")).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - then) / 6e4));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
function SamSidebarPanel({
  projectId,
  onNavigate
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeSessionId = location.search.s;
  const sessionsQuery = useQuery(samSessionsQueryOptions(projectId));
  const sessions = sessionsQuery.data ?? [];
  const goToSession = (sessionId) => {
    void navigate({
      to: "/p/$projectId/sam",
      params: { projectId },
      search: sessionId ? { s: sessionId } : {}
    });
    onNavigate?.();
  };
  const createSession = useMutation({
    mutationFn: () => createSamSession({ data: { projectId } }),
    onSuccess: ({ id }) => {
      invalidateSamSessions(projectId);
      goToSession(id);
    }
  });
  const archiveSession = useMutation({
    mutationFn: (sessionId) => archiveSamSession({ data: { sessionId } }),
    onSuccess: (_result, sessionId) => {
      invalidateSamSessions(projectId);
      if (sessionId === activeSessionId) {
        goToSession(sessions.find((s) => s.id !== sessionId)?.id);
      }
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 pb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm btn-block justify-start gap-2 font-normal text-base-content/70 hover:text-base-content",
        disabled: createSession.isPending,
        onClick: () => createSession.mutate(),
        children: [
          createSession.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
          "New chat"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-y-auto px-2 py-1", children: sessionsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-6 text-base-content/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }) }) : sessions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-2 py-6 text-center text-xs text-base-content/50", children: "No chats yet. Start a new one." }) : sessions.map((session) => {
      const isActive = session.id === activeSessionId;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `group flex items-center gap-1 rounded-md px-1 ${isActive ? "bg-base-300/50" : "hover:bg-base-300/40"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => goToSession(session.id),
                className: "min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm text-base-content/80",
                children: session.title
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-xs text-base-content/40 group-hover:hidden", children: ageLabel(session.updatedAt) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                "aria-label": "Archive chat",
                className: "btn btn-ghost btn-xs btn-square hidden group-hover:inline-flex",
                disabled: archiveSession.isPending,
                onClick: () => archiveSession.mutate(session.id),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, { className: "size-3.5 text-base-content/50" })
              }
            )
          ]
        },
        session.id
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BetaNotice, {})
  ] });
}
function closeDropdown() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
const navItemBaseClass = "relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-base-content/70";
const navItemClass = `${navItemBaseClass} transition-colors hover:bg-base-300/30 hover:text-base-content`;
const navItemActiveProps = {
  // Keep the active tint on hover so the active item does not fall back to the
  // lighter hover background of navItemClass.
  className: "bg-base-300/50 hover:bg-base-300/50 font-medium text-base-content"
};
function SidebarNavLink({
  icon: Icon,
  label,
  onNavigate,
  linkProps
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Link,
    {
      onClick: onNavigate,
      activeOptions: { exact: false, includeSearch: false },
      ...linkProps,
      className: navItemClass,
      activeProps: navItemActiveProps,
      children: ({ isActive }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        isActive ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-primary" }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: label })
      ] })
    }
  );
}
function Sidebar({ projectId, onNavigate, onClose }) {
  const navGroups = [
    ...projectId ? getProjectNavGroups(projectId) : [],
    connectNavGroup
  ];
  const navigate = useNavigate();
  const location = useLocation();
  const onSamRoute = location.pathname.includes("/sam");
  const [view, setView] = reactExports.useState(
    onSamRoute ? "chat" : "browse"
  );
  reactExports.useEffect(() => {
    setView(onSamRoute ? "chat" : "browse");
  }, [onSamRoute]);
  const openChat = () => {
    setView("chat");
    if (!projectId) return;
    if (!onSamRoute) {
      void navigate({
        to: "/p/$projectId/sam",
        params: { projectId },
        search: {}
      });
      onNavigate?.();
    }
  };
  const openBrowse = () => {
    setView("browse");
    if (!projectId || !onSamRoute) return;
    void navigate({ to: "/p/$projectId", params: { projectId } });
    onNavigate?.();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full w-60 flex-col bg-base-200", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 pb-2 pt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/",
          onClick: onNavigate,
          className: "text-base font-semibold text-base-content",
          children: "OpenSEO"
        }
      ),
      onClose ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "btn btn-ghost btn-sm btn-circle",
          "aria-label": "Close sidebar",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
        }
      ) : null
    ] }),
    projectId ? (
      // Same underline tab idiom as the in-page tab strips (e.g. Domain
      // Overview's Top Keywords / Top Pages).
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "tablist", className: "tabs tabs-border w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SidebarViewTab,
          {
            icon: LayoutGrid,
            label: "Browse",
            active: view === "browse",
            onClick: openBrowse
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SidebarViewTab,
          {
            icon: MessageCircle,
            label: "Chat",
            active: view === "chat",
            onClick: openChat
          }
        )
      ] }) })
    ) : null,
    view === "chat" && projectId ? /* @__PURE__ */ jsxRuntimeExports.jsx(SamSidebarPanel, { projectId, onNavigate }) : /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "min-h-0 flex-1 overflow-y-auto px-2 py-2", children: navGroups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-base-content/40", children: group.label }),
      group.items.map((item) => {
        const { icon, label, ...linkProps } = item;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          SidebarNavLink,
          {
            icon,
            label,
            onNavigate,
            linkProps
          },
          linkProps.to
        );
      })
    ] }, group.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SidebarFooter, { onNavigate })
  ] });
}
function SidebarViewTab({
  icon: Icon,
  label,
  active,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": active,
      onClick,
      className: `tab flex-1 gap-1.5 ${active ? "tab-active" : ""}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4" }),
        label
      ]
    }
  );
}
function SidebarFooter({ onNavigate }) {
  const { data: session } = useSession();
  const isHostedMode = isHostedClientAuthMode();
  const email = session?.user?.email;
  const closeMenu = () => {
    closeDropdown();
    onNavigate?.();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 border-t border-base-300 px-2 py-2 pb-safe", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SidebarNavLink,
      {
        icon: CircleQuestionMark,
        label: "Help & Community",
        onNavigate,
        linkProps: { to: "/support" }
      }
    ),
    email ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dropdown dropdown-top w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          tabIndex: 0,
          className: `${navItemClass} w-full`,
          "aria-label": "Open account menu",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", "data-ph-mask": true, children: email })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "ul",
        {
          tabIndex: 0,
          className: "dropdown-content z-30 menu mb-1 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/settings", onClick: closeMenu, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4" }),
              "Settings"
            ] }) }),
            isHostedMode ? /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: BILLING_ROUTE, onClick: closeMenu, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-4 w-4" }),
              "Billing"
            ] }) }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx(ThemePreferenceMenuItems, {}),
            isHostedMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "li",
                {
                  "aria-hidden": true,
                  className: "pointer-events-none my-1 h-px bg-base-300 p-0"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  className: "text-error",
                  onClick: () => signOutAndRedirect(),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
                    "Sign out"
                  ]
                }
              ) })
            ] }) : null
          ]
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      SidebarNavLink,
      {
        icon: Settings,
        label: "Settings",
        onNavigate,
        linkProps: { to: "/settings" }
      }
    )
  ] });
}
function SeoApiStatusBanners({
  shouldShowSeoApiWarning,
  seoApiKeyStatusError
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    shouldShowSeoApiWarning ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 px-4 py-2.5 md:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-7xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert alert-warning", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
        "Setup needed: add your DataForSEO API key to use OpenSEO features. See the quick steps on the",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            ...dataforseoHelpLinkOptions,
            className: "link link-primary font-medium",
            children: "help page"
          }
        ),
        "."
      ] })
    ] }) }) }) : null,
    seoApiKeyStatusError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 px-4 py-2.5 md:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-7xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert alert-info", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
        "We could not verify your DataForSEO setup. If features are not working, check the setup steps on the",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            ...dataforseoHelpLinkOptions,
            className: "link link-primary font-medium",
            children: "help page"
          }
        ),
        "."
      ] })
    ] }) }) }) : null
  ] });
}
function MobileSidebarDrawer({
  open,
  projectId,
  onClose
}) {
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 md:hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        "aria-label": "Close sidebar",
        className: "absolute inset-0 bg-black/45",
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 top-0 h-full shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, { projectId, onNavigate: onClose, onClose }) })
  ] });
}
const MissingSeoSetupModal = reactExports.forwardRef(({ isOpen, onClose }, ref) => {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "dataforseo-setup-title",
      "aria-describedby": "dataforseo-setup-description",
      tabIndex: -1,
      className: "w-full max-w-lg rounded-xl border border-base-300 bg-base-100 p-5 shadow-2xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-warning/20 p-2 text-warning", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "h2",
              {
                id: "dataforseo-setup-title",
                className: "text-lg font-semibold text-base-content",
                children: "One quick setup step"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                id: "dataforseo-setup-description",
                className: "text-sm text-base-content/75",
                children: "Add your DataForSEO API key to start using OpenSEO."
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-ghost", onClick: onClose, children: "Dismiss" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              ...dataforseoHelpLinkOptions,
              className: "btn btn-primary",
              onClick: onClose,
              children: [
                "Open setup guide",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-4" })
              ]
            }
          )
        ] })
      ]
    }
  ) });
});
MissingSeoSetupModal.displayName = "MissingSeoSetupModal";
function GscReEngagementModal({
  projectId,
  suppressed
}) {
  const hosted = isHostedClientAuthMode();
  const queryClient = useQueryClient();
  const [closed, setClosed] = reactExports.useState(false);
  const shownRef = reactExports.useRef(false);
  const onboardingQuery = useQuery({
    ...onboardingAnswersQueryOptions(),
    enabled: hosted
  });
  const grantQuery = useQuery({
    queryKey: ["gscGrantStatus"],
    queryFn: () => getGscGrantStatus(),
    enabled: hosted
  });
  const dismissMutation = useMutation({
    mutationFn: () => dismissGscNudge(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["onboardingAnswers"] });
    }
  });
  const eligible = hosted && !suppressed && !closed && onboardingQuery.isSuccess && grantQuery.isSuccess && Boolean(onboardingQuery.data?.completedAt) && !onboardingQuery.data?.gscNudgeDismissedAt && !grantQuery.data?.connected;
  reactExports.useEffect(() => {
    if (eligible && !shownRef.current) {
      shownRef.current = true;
      captureClientEvent("gsc:nudge_shown");
    }
  }, [eligible]);
  if (!eligible) return null;
  function persistDismiss() {
    setClosed(true);
    dismissMutation.mutate();
  }
  function handleDismiss() {
    captureClientEvent("gsc:nudge_dismissed");
    persistDismiss();
  }
  function handleConnect() {
    captureClientEvent("gsc:nudge_connect_clicked");
    persistDismiss();
    const callbackURL = projectId ? `${window.location.origin}/p/${projectId}/settings#search-console` : window.location.href;
    void startGscLink(callbackURL);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Modal,
    {
      maxWidth: "max-w-lg",
      onClose: handleDismiss,
      labelledBy: "gsc-nudge-title",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "gsc-nudge-title", className: "text-lg font-semibold", children: "New: Connect Google Search Console" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70", children: "Bring your real clicks, impressions, and rankings into OpenSEO and query them from Claude or Codex over MCP. It never uses credits." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-ghost", onClick: handleDismiss, children: "Maybe later" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: handleConnect,
              className: "inline-flex items-center justify-center gap-2.5 rounded-lg border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold text-base-content shadow-sm transition hover:bg-base-200 hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleGlyph, { className: "size-[18px]" }),
                "Connect with Google"
              ]
            }
          )
        ] })
      ]
    }
  );
}
function ProjectSwitcher({
  activeProjectId,
  onCloseDrawer,
  align = "start"
}) {
  const navigate = useNavigate();
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects()
  });
  const projects = projectsQuery.data ?? [];
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;
  const handleSelect = (project) => {
    closeDropdown();
    onCloseDrawer?.();
    if (project.id === activeProjectId) return;
    setLastProjectId(project.id);
    void navigate({
      to: "/p/$projectId",
      params: { projectId: project.id }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `dropdown w-full ${align === "end" ? "dropdown-end" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        tabIndex: 0,
        "aria-label": "Switch project",
        className: "flex w-full items-center justify-between gap-2 rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-left transition-colors hover:border-base-content/25",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium text-base-content", children: activeProject?.name ?? "Select project" }),
            activeProject?.domain ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs font-normal text-base-content/50", children: activeProject.domain }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsUpDown, { className: "size-3.5 shrink-0 text-base-content/40" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "ul",
      {
        tabIndex: 0,
        className: "dropdown-content z-30 menu w-full rounded-box border border-base-300 bg-base-100 p-2 shadow-lg",
        children: [
          projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleSelect(project),
                className: isActive ? "active" : "",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-1 flex-col", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: project.name }),
                    project.domain ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs text-base-content/50", children: project.domain }) : null
                  ] }),
                  isActive ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4 shrink-0 text-primary" }) : null
                ]
              }
            ) }, project.id);
          }),
          projects.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "li",
            {
              "aria-hidden": "true",
              className: "pointer-events-none my-1 h-px bg-base-300 p-0"
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/projects",
              onClick: () => {
                closeDropdown();
                onCloseDrawer?.();
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FolderCog, { className: "size-4" }),
                "Manage projects"
              ]
            }
          ) })
        ]
      }
    )
  ] });
}
const getSeoApiKeyStatus = createServerFn({
  method: "GET"
}).middleware(requireAuthenticatedContext).handler(createSsrRpc("b5858986f4b26fbc7f2cea62479e3b4d97d5c4af0a61b218af88501443a3939c"));
const DATAFORSEO_HELP_PATH = "/help/dataforseo-api-key";
function AuthenticatedAppLayout({
  children,
  projectId,
  banner
}) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = reactExports.useState(false);
  const setupModalRef = reactExports.useRef(null);
  const [showMissingSeoApiKeyModal, setShowMissingSeoApiKeyModal] = reactExports.useState(false);
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
    enabled: !projectId
  });
  const [rememberedProjectId] = reactExports.useState(
    () => getLastProjectId()
  );
  const fallbackProjects = projectsQuery.data ?? [];
  const fallbackProjectId = fallbackProjects.find((project) => project.id === rememberedProjectId)?.id ?? fallbackProjects[0]?.id ?? null;
  const sidebarProjectId = projectId ?? fallbackProjectId ?? rememberedProjectId;
  const shouldCheckSeoApiKeyStatus = location.pathname !== BILLING_ROUTE;
  const seoApiKeyStatusQuery = useQuery({
    queryKey: ["seoApiKeyStatus"],
    queryFn: () => getSeoApiKeyStatus(),
    enabled: shouldCheckSeoApiKeyStatus
  });
  const isSeoApiKeyConfigured = shouldCheckSeoApiKeyStatus ? seoApiKeyStatusQuery.data?.configured ?? null : null;
  const seoApiKeyStatusError = shouldCheckSeoApiKeyStatus && seoApiKeyStatusQuery.isError;
  reactExports.useEffect(() => {
    if (!shouldCheckSeoApiKeyStatus) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }
    if (seoApiKeyStatusQuery.isError) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }
    if (!seoApiKeyStatusQuery.isSuccess) return;
    setShowMissingSeoApiKeyModal(!seoApiKeyStatusQuery.data.configured);
  }, [
    location.pathname,
    seoApiKeyStatusQuery.data,
    seoApiKeyStatusQuery.isError,
    seoApiKeyStatusQuery.isSuccess,
    shouldCheckSeoApiKeyStatus
  ]);
  const shouldShowMissingSeoApiKeyModal = showMissingSeoApiKeyModal && location.pathname !== DATAFORSEO_HELP_PATH;
  const shouldShowSeoApiWarning = !seoApiKeyStatusError && isSeoApiKeyConfigured === false && !shouldShowMissingSeoApiKeyModal;
  reactExports.useEffect(() => {
    if (!shouldShowMissingSeoApiKeyModal) return;
    setupModalRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowMissingSeoApiKeyModal(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [shouldShowMissingSeoApiKeyModal]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[100dvh] bg-base-200", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden shrink-0 md:block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, { projectId: sidebarProjectId }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MobileTopBar,
        {
          drawerOpen,
          onOpenDrawer: () => setDrawerOpen(true),
          projectId: sidebarProjectId
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-0 flex-1 flex-col md:pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden bg-base-100 md:rounded-tl-lg md:border-l md:border-t md:border-base-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DesktopTopBar, { projectId: sidebarProjectId }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SeoApiStatusBanners,
          {
            shouldShowSeoApiWarning,
            seoApiKeyStatusError
          }
        ),
        banner,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-auto", children })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MobileSidebarDrawer,
      {
        open: drawerOpen,
        projectId: sidebarProjectId,
        onClose: () => setDrawerOpen(false)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MissingSeoSetupModal,
      {
        ref: setupModalRef,
        isOpen: shouldShowMissingSeoApiKeyModal,
        onClose: () => setShowMissingSeoApiKeyModal(false)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GscReEngagementModal,
      {
        projectId: sidebarProjectId,
        suppressed: shouldShowMissingSeoApiKeyModal
      }
    )
  ] });
}
function DesktopTopBar({ projectId }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden shrink-0 items-center justify-end gap-2 border-b border-base-300 bg-base-100 px-4 py-2 md:flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectSwitcher, { activeProjectId: projectId, align: "end" }) }) });
}
function MobileTopBar({
  drawerOpen,
  onOpenDrawer,
  projectId
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-1 border-b border-base-300 bg-base-100 px-2 py-1.5 md:hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "btn btn-square btn-ghost btn-sm",
        "aria-label": "Toggle sidebar",
        "aria-expanded": drawerOpen,
        onClick: onOpenDrawer,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "h-5 w-5" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "ml-1 font-semibold text-base-content", children: "OpenSEO" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto w-44 max-w-[55%]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectSwitcher, { activeProjectId: projectId, align: "end" }) })
  ] });
}
function useOnboardingRedirect() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const isHostedMode = isHostedClientAuthMode();
  const isEmailVerified = session?.user?.emailVerified === true || isEmailVerificationBypassed();
  const onboardingQuery = useQuery({
    ...onboardingAnswersQueryOptions(),
    enabled: isHostedMode && Boolean(session?.user?.id) && isEmailVerified
  });
  reactExports.useEffect(() => {
    if (!isHostedMode || !session?.user?.id || !isEmailVerified || onboardingQuery.isLoading || onboardingQuery.isError || onboardingQuery.data?.completedAt || window.location.pathname === "/onboarding") {
      return;
    }
    void navigate({ to: "/onboarding", search: { step: 0 }, replace: true });
  }, [
    isHostedMode,
    navigate,
    onboardingQuery.data?.completedAt,
    onboardingQuery.isError,
    onboardingQuery.isLoading,
    isEmailVerified,
    session?.user?.id
  ]);
}
export {
  AuthenticatedAppLayout as A,
  useLocation as a,
  useOnboardingRedirect as u
};
