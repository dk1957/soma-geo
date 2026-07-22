import { aM as reactExports, bt as LOCATIONS, y as createServerFn, a8 as backlinksRowsPageRequestSchema, a6 as backlinksOverviewInputSchema, a9 as referringDomainsPageRequestSchema, aa as topPagesPageRequestSchema, aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { s as useQuery, c as captureClientEvent, x as getStandardErrorMessage, p as createSsrRpc, b5 as X, a_ as LoaderCircle } from "./router-8qflvY1T.js";
import { p as parseKeywordInput } from "./keywordControllerActions-3CIPXq7E.js";
import { r as researchKeywords } from "./keywords-CJzE_dc4.js";
import { r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import { g as getDomainOverview } from "./domain-BlEbj7dg.js";
const KEYWORD_RESEARCH_STALE_TIME_MS = 24 * 60 * 60 * 1e3;
function buildKeywordResearchRequest(input) {
  const keywords = parseKeywordInput(input.keywordInput);
  const seedKeyword = keywords[0] ?? "";
  if (!seedKeyword) return null;
  return {
    projectId: input.projectId,
    keywords,
    seedKeyword,
    locationCode: input.locationCode,
    resultLimit: input.resultLimit,
    mode: input.mode,
    clickstream: input.clickstream
  };
}
function buildKeywordResearchQueryKey(request) {
  return request ? [
    "keywordResearch",
    request.projectId,
    request.keywords,
    request.locationCode,
    request.resultLimit,
    request.mode,
    request.clickstream
  ] : ["keywordResearch", "idle"];
}
function keywordResearchQueryFn(request) {
  return researchKeywords({
    data: {
      projectId: request.projectId,
      keywords: request.keywords,
      locationCode: request.locationCode,
      resultLimit: request.resultLimit,
      mode: request.mode,
      clickstream: request.clickstream
    }
  });
}
function useKeywordResearchData(input, addSearch) {
  const {
    clickstream,
    displayedLocationCode,
    keywordInput,
    locationCode,
    mode,
    projectId,
    resultLimit
  } = input;
  const request = reactExports.useMemo(
    () => buildKeywordResearchRequest({
      keywordInput,
      locationCode,
      mode,
      projectId,
      resultLimit,
      clickstream
    }),
    [clickstream, keywordInput, locationCode, mode, projectId, resultLimit]
  );
  const queryKey = reactExports.useMemo(
    () => buildKeywordResearchQueryKey(request),
    [request]
  );
  const queryKeyString = JSON.stringify(queryKey);
  const researchQuery = useQuery({
    queryKey,
    queryFn: () => {
      if (!request) {
        throw new Error("Keyword research query ran without request params");
      }
      return keywordResearchQueryFn(request);
    },
    enabled: request !== null,
    staleTime: KEYWORD_RESEARCH_STALE_TIME_MS,
    gcTime: KEYWORD_RESEARCH_STALE_TIME_MS,
    retry: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  });
  const handledSuccessKeyRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!request || !researchQuery.isSuccess || !researchQuery.data) return;
    if (handledSuccessKeyRef.current === queryKeyString) return;
    handledSuccessKeyRef.current = queryKeyString;
    captureClientEvent("keyword_research:search_complete", {
      location_code: displayedLocationCode,
      search_mode: request.mode,
      clickstream: request.clickstream,
      result_count: researchQuery.data.rows.length
    });
    addSearch(
      request.seedKeyword,
      displayedLocationCode,
      LOCATIONS[displayedLocationCode] || "Unknown"
    );
  }, [
    addSearch,
    displayedLocationCode,
    queryKeyString,
    request,
    researchQuery.data,
    researchQuery.isSuccess
  ]);
  const hasSearched = parseKeywordInput(keywordInput).length > 0;
  const rows = hasSearched ? researchQuery.data?.rows ?? [] : [];
  const researchError = hasSearched && researchQuery.isError ? getStandardErrorMessage(researchQuery.error, "Research failed.") : null;
  return {
    rows,
    hasSearched,
    lastSearchError: hasSearched && researchQuery.isError,
    lastResultSource: researchQuery.data?.source ?? "related",
    lastUsedFallback: researchQuery.data?.usedFallback ?? false,
    lastSearchKeyword: request?.seedKeyword ?? "",
    lastSearchLocationCode: displayedLocationCode,
    researchError,
    researchMutationError: researchQuery.error,
    searchedKeyword: request?.seedKeyword ?? "",
    isLoading: hasSearched && researchQuery.isPending,
    researchQuery,
    retryResearch: researchQuery.refetch
  };
}
const getBacklinksOverview = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(backlinksOverviewInputSchema).handler(createSsrRpc("a49c4261f3f65e415401c7162c49edf3e6134bc3554b0b96f1230779dcdebd9b"));
const getBacklinksRows = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(backlinksRowsPageRequestSchema).handler(createSsrRpc("a4a9247a2916093ffa4adf9b4628e1d7f55af8b119ae1f0147a8b5ef5fd08691"));
const getBacklinksReferringDomains = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(referringDomainsPageRequestSchema).handler(createSsrRpc("0c268077775b1f812d23756142e5d64fff541f1240b6328a92da446160513af2"));
const getBacklinksTopPages = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(topPagesPageRequestSchema).handler(createSsrRpc("47f4e168632e9bfd56794677badebb717fc5ce10103810690f0c3bdc5d098227"));
function SearchTabStrip({
  activeTabId,
  projectId,
  tabs,
  onSelect,
  onClose,
  onViewed
}) {
  if (tabs.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-base-300 bg-base-100 p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      role: "tablist",
      "aria-label": "Search tabs",
      className: "flex min-w-0 items-stretch gap-1 overflow-x-auto",
      children: tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-search-tab-id": tab.id,
            className: `group flex shrink-0 items-stretch overflow-hidden rounded-md text-sm transition ${active ? "bg-base-300 text-base-content shadow-sm" : "text-base-content/80 hover:bg-base-200"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  role: "tab",
                  "data-search-tab-id": tab.id,
                  "aria-selected": active,
                  className: "flex min-w-0 items-center gap-1.5 px-2.5 py-1.5 text-left",
                  onClick: () => onSelect(tab),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SearchTabStatus,
                      {
                        tab,
                        projectId,
                        active,
                        onViewed
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: "max-w-[10rem] truncate font-medium",
                        title: tab.label,
                        children: tab.label
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  "data-search-tab-id": tab.id,
                  className: "flex items-center px-1.5 text-base-content/50 opacity-60 transition hover:bg-base-content/10 hover:text-base-content hover:opacity-100 group-hover:opacity-100",
                  onClick: () => onClose(tab.id),
                  "aria-label": `Close ${tab.label} tab`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" })
                }
              )
            ]
          },
          tab.id
        );
      })
    }
  ) });
}
function SearchTabStatus({
  tab,
  projectId,
  active,
  onViewed
}) {
  const config = getSearchTabQueryConfig(projectId, tab);
  const query = useQuery({
    queryKey: config.queryKey,
    queryFn: config.queryFn,
    enabled: false,
    select: () => null,
    notifyOnChangeProps: ["dataUpdatedAt", "fetchStatus", "status"],
    staleTime: config.staleTime,
    gcTime: config.gcTime
  });
  const isLoading = query.fetchStatus === "fetching";
  const hasResult = query.dataUpdatedAt > 0;
  const hasError = query.status === "error";
  const unviewed = !active && hasResult && (tab.viewedAt === null || tab.viewedAt < query.dataUpdatedAt);
  reactExports.useEffect(() => {
    if (!active) return;
    if (!hasResult) return;
    if (tab.viewedAt !== null && tab.viewedAt >= query.dataUpdatedAt) return;
    onViewed(tab.id, query.dataUpdatedAt);
  }, [active, hasResult, onViewed, query.dataUpdatedAt, tab.id, tab.viewedAt]);
  const status = isLoading ? "loading" : hasError ? "error" : unviewed ? "unviewed" : "idle";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SearchTabStatusIndicator, { status });
}
function SearchTabStatusIndicator({
  status
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: "flex w-3.5 shrink-0 items-center justify-center",
      "aria-hidden": true,
      children: status === "loading" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3 animate-spin text-base-content/50" }) : status === "error" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-2 rounded-full bg-error" }) : status === "unviewed" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-2 rounded-full bg-primary" }) : null
    }
  );
}
function getSearchTabQueryConfig(projectId, tab) {
  if (tab.input.type === "backlinks") {
    const input2 = tab.input;
    return {
      queryKey: ["backlinksOverview", projectId, input2.scope, input2.target],
      queryFn: () => getBacklinksOverview({
        data: {
          projectId,
          target: input2.target,
          scope: input2.scope
        }
      })
    };
  }
  if (tab.input.type === "domain") {
    const input2 = tab.input;
    const trimmedDomain = input2.domain.trim();
    return {
      queryKey: [
        "domain-overview",
        projectId,
        trimmedDomain,
        input2.subdomains,
        input2.locationCode
      ],
      queryFn: () => getDomainOverview({
        data: {
          projectId,
          domain: trimmedDomain,
          includeSubdomains: input2.subdomains,
          locationCode: input2.locationCode
        }
      }),
      staleTime: 5 * 6e4
    };
  }
  const input = tab.input;
  const request = buildKeywordResearchRequest({
    projectId,
    keywordInput: input.keyword,
    locationCode: input.locationCode,
    resultLimit: input.resultLimit,
    mode: input.mode,
    clickstream: input.clickstream
  });
  return {
    queryKey: buildKeywordResearchQueryKey(request),
    queryFn: () => {
      if (!request) throw new Error("Tab is missing a research request");
      return keywordResearchQueryFn(request);
    },
    staleTime: KEYWORD_RESEARCH_STALE_TIME_MS,
    gcTime: KEYWORD_RESEARCH_STALE_TIME_MS
  };
}
const EMPTY_STATE = {
  tabs: [],
  activeTabId: null
};
const CHANGE_EVENT = "search-tabs-change";
const stateCache = /* @__PURE__ */ new Map();
const SEARCH_TABS_LIMIT = 8;
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function parseTabInput(value) {
  if (!isRecord(value)) return null;
  if (value.type === "backlinks") {
    if (typeof value.target !== "string" || value.target === "") return null;
    if (value.scope !== "domain" && value.scope !== "page") return null;
    return {
      type: "backlinks",
      target: value.target,
      scope: value.scope
    };
  }
  if (value.type === "domain") {
    if (typeof value.domain !== "string" || value.domain === "") return null;
    if (typeof value.subdomains !== "boolean") return null;
    if (typeof value.locationCode !== "number") return null;
    return {
      type: "domain",
      domain: value.domain,
      subdomains: value.subdomains,
      locationCode: value.locationCode
    };
  }
  if (value.type === "keyword") {
    if (typeof value.keyword !== "string" || value.keyword === "") return null;
    if (typeof value.locationCode !== "number") return null;
    if (value.resultLimit !== 150 && value.resultLimit !== 300 && value.resultLimit !== 500) {
      return null;
    }
    if (value.mode !== "auto" && value.mode !== "related" && value.mode !== "suggestions" && value.mode !== "ideas") {
      return null;
    }
    return {
      type: "keyword",
      keyword: value.keyword,
      locationCode: value.locationCode,
      resultLimit: value.resultLimit,
      mode: value.mode,
      // Tabs persisted before the clickstream toggle existed default to off.
      clickstream: value.clickstream === true
    };
  }
  return null;
}
function storageKey(key) {
  return `search-tabs:${key}`;
}
function tabInputKey$1(value) {
  return JSON.stringify(value);
}
function parseStoredState(value) {
  if (!isRecord(value)) return EMPTY_STATE;
  if (!Array.isArray(value.tabs)) return EMPTY_STATE;
  const tabs = value.tabs.flatMap((tab) => {
    if (!isRecord(tab)) return [];
    if (typeof tab.id !== "string" || tab.id === "") return [];
    if (typeof tab.label !== "string" || tab.label === "") return [];
    if (typeof tab.createdAt !== "number") return [];
    const input = parseTabInput(tab.input);
    if (!input) return [];
    return [
      {
        id: tab.id,
        label: tab.label,
        input,
        createdAt: tab.createdAt,
        viewedAt: tab.viewedAt === null ? null : typeof tab.viewedAt === "number" ? tab.viewedAt : null
      }
    ];
  }).slice(0, SEARCH_TABS_LIMIT);
  const activeTabId = typeof value.activeTabId === "string" && tabs.some((tab) => tab.id === value.activeTabId) ? value.activeTabId : null;
  return { tabs, activeTabId };
}
function loadState(key) {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.sessionStorage.getItem(storageKey(key));
    if (!raw) return EMPTY_STATE;
    return parseStoredState(JSON.parse(raw));
  } catch {
    return EMPTY_STATE;
  }
}
function getSearchTabsSnapshot(key) {
  let state = stateCache.get(key);
  if (!state) {
    state = loadState(key);
    stateCache.set(key, state);
  }
  return state;
}
function persist(key, state) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey(key), JSON.stringify(state));
  } catch {
  }
}
function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
function update(key, updater) {
  const current = getSearchTabsSnapshot(key);
  const next = updater(current);
  if (next === current) return;
  stateCache.set(key, next);
  persist(key, next);
  notify();
}
function subscribe(onChange) {
  if (typeof window === "undefined") return () => {
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}
function generateTabId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function useSearchTabs(key) {
  const state = reactExports.useSyncExternalStore(
    subscribe,
    () => getSearchTabsSnapshot(key),
    () => EMPTY_STATE
  );
  const openTab = reactExports.useCallback(
    ({ label, input }) => {
      let result = null;
      let dropped = false;
      update(key, (current) => {
        const inputKey = tabInputKey$1(input);
        const existing = current.tabs.find(
          (tab) => tabInputKey$1(tab.input) === inputKey
        );
        if (existing) {
          result = existing;
          return { ...current, activeTabId: existing.id };
        }
        if (current.tabs.length >= SEARCH_TABS_LIMIT) {
          dropped = true;
          return current;
        }
        const next = {
          id: generateTabId(),
          label,
          input,
          createdAt: Date.now(),
          viewedAt: null
        };
        result = next;
        return {
          tabs: [...current.tabs, next],
          activeTabId: next.id
        };
      });
      return { tab: result, dropped };
    },
    [key]
  );
  const setActiveTab = reactExports.useCallback(
    (tabId) => {
      update(key, (current) => {
        if (current.activeTabId === tabId) return current;
        if (tabId !== null && !current.tabs.some((tab) => tab.id === tabId)) {
          return current;
        }
        return { ...current, activeTabId: tabId };
      });
    },
    [key]
  );
  const closeTab = reactExports.useCallback(
    (tabId) => {
      let nextActiveTab = null;
      let closedActive = false;
      update(key, (current) => {
        const index = current.tabs.findIndex((tab) => tab.id === tabId);
        if (index === -1) return current;
        const tabs = current.tabs.filter((tab) => tab.id !== tabId);
        let activeTabId = current.activeTabId;
        if (current.activeTabId === tabId) {
          closedActive = true;
          const neighbor = tabs[index] ?? tabs[index - 1] ?? null;
          activeTabId = neighbor?.id ?? null;
          nextActiveTab = neighbor;
        }
        return { tabs, activeTabId };
      });
      return { closedActive, nextActiveTab };
    },
    [key]
  );
  const markTabViewed = reactExports.useCallback(
    (tabId, when = Date.now()) => {
      update(key, (current) => {
        let changed = false;
        const tabs = current.tabs.map((tab) => {
          if (tab.id !== tabId) return tab;
          if (tab.viewedAt !== null && tab.viewedAt >= when) return tab;
          changed = true;
          return { ...tab, viewedAt: when };
        });
        if (!changed) return current;
        return { ...current, tabs };
      });
    },
    [key]
  );
  const findMatchingTab = reactExports.useCallback(
    (input) => {
      const inputKey = tabInputKey$1(input);
      return state.tabs.find((tab) => tabInputKey$1(tab.input) === inputKey) ?? null;
    },
    [state.tabs]
  );
  const canOpenTab = reactExports.useCallback(
    (input) => Boolean(findMatchingTab(input)) || state.tabs.length < SEARCH_TABS_LIMIT,
    [findMatchingTab, state.tabs.length]
  );
  const activeTab = reactExports.useMemo(
    () => state.tabs.find((tab) => tab.id === state.activeTabId) ?? null,
    [state.activeTabId, state.tabs]
  );
  return {
    activeTab,
    activeTabId: state.activeTabId,
    tabs: state.tabs,
    canOpenTab,
    closeTab,
    findMatchingTab,
    limit: SEARCH_TABS_LIMIT,
    markTabViewed,
    openTab,
    setActiveTab
  };
}
function tabInputKey(input) {
  return input ? JSON.stringify(input) : "";
}
function useSearchTabNavigation({
  storageKey: storageKey2,
  urlInput,
  getLabel,
  navigateToInput
}) {
  const closedInputKeysRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const tabs = useSearchTabs(storageKey2);
  const {
    activeTabId,
    closeTab,
    findMatchingTab,
    markTabViewed,
    openTab,
    setActiveTab
  } = tabs;
  reactExports.useEffect(() => {
    const urlKey = tabInputKey(urlInput);
    if (closedInputKeysRef.current.has(urlKey)) {
      return;
    }
    closedInputKeysRef.current.clear();
    if (!urlInput) {
      setActiveTab(null);
      return;
    }
    const existing = findMatchingTab(urlInput);
    if (existing) {
      if (activeTabId !== existing.id) {
        setActiveTab(existing.id);
      }
      return;
    }
    const result = openTab({
      label: getLabel(urlInput),
      input: urlInput
    });
    if (result.dropped) {
      setActiveTab(null);
    }
  }, [activeTabId, findMatchingTab, getLabel, openTab, setActiveTab, urlInput]);
  const selectTab = reactExports.useCallback(
    (tab) => {
      closedInputKeysRef.current.delete(tabInputKey(tab.input));
      setActiveTab(tab.id);
      navigateToInput(tab.input);
    },
    [navigateToInput, setActiveTab]
  );
  const closeSearchTab = reactExports.useCallback(
    (tabId) => {
      const closingTab = tabs.tabs.find((tab) => tab.id === tabId) ?? null;
      if (closingTab) {
        closedInputKeysRef.current.add(tabInputKey(closingTab.input));
      }
      const result = closeTab(tabId);
      if (result.closedActive) {
        navigateToInput(result.nextActiveTab?.input ?? null);
      }
    },
    [closeTab, navigateToInput, tabs.tabs]
  );
  const openSearchTab = reactExports.useCallback(
    (input) => {
      closedInputKeysRef.current.delete(tabInputKey(input));
      return openTab({
        label: getLabel(input),
        input
      });
    },
    [getLabel, openTab]
  );
  const visibleTabs = reactExports.useMemo(
    () => tabs.tabs.filter(
      (tab) => !closedInputKeysRef.current.has(tabInputKey(tab.input))
    ),
    [tabs.tabs]
  );
  return {
    activeTabId: tabs.activeTabId,
    tabs: visibleTabs,
    canOpenTab: tabs.canOpenTab,
    closeTab: closeSearchTab,
    limit: tabs.limit,
    markTabViewed,
    openTab: openSearchTab,
    selectTab,
    setActiveTab
  };
}
export {
  SearchTabStrip as S,
  useSearchTabNavigation as a,
  getBacklinksRows as b,
  getBacklinksReferringDomains as c,
  getBacklinksTopPages as d,
  getBacklinksOverview as g,
  tabInputKey as t,
  useKeywordResearchData as u
};
