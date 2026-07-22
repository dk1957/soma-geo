import { aM as reactExports, aN as jsxRuntimeExports, y as createServerFn, G as object, a3 as array, H as string, cu as BACKLINKS_PAGE_SIZES, cv as backlinksRowsSortFieldSchema, cw as referringDomainsSortFieldSchema, cx as topPagesSortFieldSchema, cy as BACKLINKS_DEFAULT_SORT, bB as MAX_DATAFORSEO_FILTER_CONDITIONS, b3 as jsonCodec, Y as number, a2 as _enum, cz as DEFAULT_BACKLINKS_PAGE_SIZE } from "./index-CSpjggkr.js";
import { q as createLucideIcon, cw as Subscribable, cx as notifyManager, cy as shallowEqualObjects, cz as replaceEqualDeep, cA as QueryObserver, I as useQueryClient, cB as useIsRestoring, cC as useQueryErrorResetBoundary, cD as ensureSuspenseTimers, cE as ensurePreventErrorBoundaryRetry, cF as useClearResetErrorBoundary, cG as noop, cH as shouldSuspend, cI as fetchOptimistic, cJ as getHasError, ao as resolveDefaultProps, aB as clsx, bS as adaptEventsOfChild, cK as Surface, aA as useAppSelector, cL as selectLegendPayload, cM as useLegendPortal, cN as useMargin, cO as useElementOffset, cP as useChartWidth$1, cQ as useChartHeight, O as reactDomExports, bs as useAppDispatch, cR as setLegendSettings, cS as setLegendSize, cT as getUniqPayload, e as useForm, cm as shouldValidateFieldOnChange, h as getFieldError, f as getFormError, cn as createFormValidationErrors, bW as CartesianGrid, bX as XAxis, bY as YAxis, bZ as Tooltip, L as Link, b$ as HeaderHelpLabel, Z as SortableHeader, K as ChevronRight, aW as useAppTable, aX as AppDataTable, _ as createColumnHelper, Q as downloadCsv, S as buildCsv, b2 as Download, G as ChevronDown, c6 as Ellipsis, b0 as exportTableToSheets, p as createSsrRpc, t as toast, x as getStandardErrorMessage, c2 as SlidersHorizontal, b7 as ShieldAlert, b5 as X, s as useQuery, v as getErrorCode, cU as Route, j as useNavigate } from "./router-8qflvY1T.js";
import { S as Search } from "./search-D1JnBu8u.js";
import { L as LineChart, a as Line } from "./LineChart-C7T9wcS3.js";
import { b as Symbols } from "./ErrorBarContext-Bz51l0Tj.js";
import { A as ArrowLeft } from "./arrow-left-BM28E2gf.js";
import { D as DomainFilterPanel } from "./DomainFilterPanel-CaTxgQZp.js";
import { S as SafeExternalLink } from "./SafeExternalLink-CzHkCMkV.js";
import { S as Sheet } from "./sheet-CetoD1zz.js";
import { t as t$3 } from "./chunk-DhtMgbSE.js";
import { r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import { T as TablePagination } from "./TablePagination-ke6LLGtA.js";
import { L as Link2 } from "./link-2-DINJs8Ac.js";
import { H as History, C as Clock, u as useLocalHistoryStore } from "./useLocalHistoryStore-fJV0OLr-.js";
import { S as SearchTabStrip, g as getBacklinksOverview, b as getBacklinksRows, c as getBacklinksReferringDomains, d as getBacklinksTopPages, a as useSearchTabNavigation } from "./useSearchTabNavigation-Belxoeoh.js";
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
import "./triangle-alert-CtV7H1mP.js";
import "./url-BJJMe9XJ.js";
import "./chevron-left-D72yujtc.js";
import "./keywordControllerActions-3CIPXq7E.js";
import "./keywords-CJzE_dc4.js";
import "./domain-BlEbj7dg.js";
const t$2 = { done: false, hasNext: false };
function t$1(e, ...t2) {
  let a = e, o = t2.map((e2) => `lazy` in e2 ? r$1(e2) : void 0), s = 0;
  for (; s < t2.length; ) {
    if (o[s] === void 0 || !i(a)) {
      let e3 = t2[s];
      a = e3(a), s += 1;
      continue;
    }
    let e2 = [];
    for (let n2 = s; n2 < t2.length; n2++) {
      let t3 = o[n2];
      if (t3 === void 0 || (e2.push(t3), t3.isSingle)) break;
    }
    let r2 = [];
    for (let t3 of a) if (n$1(t3, r2, e2)) break;
    let { isSingle: c } = e2.at(-1);
    a = c ? r2[0] : r2, s += e2.length;
  }
  return a;
}
function n$1(t2, r2, i2) {
  if (i2.length === 0) return r2.push(t2), false;
  let a = t2, o = t$2, s = false;
  for (let [e, t3] of i2.entries()) {
    let { index: c, items: l } = t3;
    if (l.push(a), o = t3(a, c, l), t3.index += 1, o.hasNext) {
      if (o.hasMany ?? false) {
        for (let t4 of o.next) if (n$1(t4, r2, i2.slice(e + 1))) return true;
        return s;
      }
      a = o.next;
    }
    if (!o.hasNext) break;
    o.done && (s = true);
  }
  return o.hasNext && r2.push(a), s;
}
function r$1(e) {
  let { lazy: t2, lazyArgs: n2 } = e, r2 = t2(...n2);
  return Object.assign(r2, { isSingle: t2.single ?? false, index: 0, items: [] });
}
function i(e) {
  return typeof e == `string` || typeof e == `object` && !!e && Symbol.iterator in e;
}
function t(t2, n2) {
  let r2 = n2.length - t2.length;
  if (r2 === 1) {
    let [r3, ...i2] = n2;
    return t$1(r3, { lazy: t2, lazyArgs: i2 });
  }
  if (r2 === 0) {
    let r3 = { lazy: t2, lazyArgs: n2 };
    return Object.assign((t3) => t$1(t3, r3), r3);
  }
  throw Error(`Wrong number of arguments`);
}
function n(...e) {
  return t(r, e);
}
function r() {
  let t2 = /* @__PURE__ */ new Set();
  return (n2) => t2.has(n2) ? t$2 : (t2.add(n2), { done: false, hasNext: true, next: n2 });
}
const __iconNode = [
  ["path", { d: "m12 14 4-4", key: "9kzdfg" }],
  ["path", { d: "M3.34 19a10 10 0 1 1 17.32 0", key: "19p75a" }]
];
const Gauge = createLucideIcon("gauge", __iconNode);
function difference(array1, array2) {
  const excludeSet = new Set(array2);
  return array1.filter((x) => !excludeSet.has(x));
}
function replaceAt(array2, index, value) {
  const copy = array2.slice(0);
  copy[index] = value;
  return copy;
}
var QueriesObserver = class extends Subscribable {
  #client;
  #result;
  #queries;
  #options;
  #observers;
  #combinedResult;
  #lastCombine;
  #lastResult;
  #lastQueryHashes;
  #observerMatches = [];
  constructor(client, queries, options) {
    super();
    this.#client = client;
    this.#options = options;
    this.#queries = [];
    this.#observers = [];
    this.#result = [];
    this.setQueries(queries);
  }
  onSubscribe() {
    if (this.listeners.size === 1) {
      this.#observers.forEach((observer) => {
        observer.subscribe((result) => {
          this.#onUpdate(observer, result);
        });
      });
    }
  }
  onUnsubscribe() {
    if (!this.listeners.size) {
      this.destroy();
    }
  }
  destroy() {
    this.listeners = /* @__PURE__ */ new Set();
    this.#observers.forEach((observer) => {
      observer.destroy();
    });
  }
  setQueries(queries, options) {
    this.#queries = queries;
    this.#options = options;
    notifyManager.batch(() => {
      const prevObservers = this.#observers;
      const newObserverMatches = this.#findMatchingObservers(this.#queries);
      newObserverMatches.forEach(
        (match) => match.observer.setOptions(match.defaultedQueryOptions)
      );
      const newObservers = newObserverMatches.map((match) => match.observer);
      const newResult = newObservers.map(
        (observer) => observer.getCurrentResult()
      );
      const hasLengthChange = prevObservers.length !== newObservers.length;
      const hasIndexChange = newObservers.some(
        (observer, index) => observer !== prevObservers[index]
      );
      const hasStructuralChange = hasLengthChange || hasIndexChange;
      const hasResultChange = hasStructuralChange ? true : newResult.some((result, index) => {
        const prev = this.#result[index];
        return !prev || !shallowEqualObjects(result, prev);
      });
      if (!hasStructuralChange && !hasResultChange) return;
      if (hasStructuralChange) {
        this.#observerMatches = newObserverMatches;
        this.#observers = newObservers;
      }
      this.#result = newResult;
      if (!this.hasListeners()) return;
      if (hasStructuralChange) {
        difference(prevObservers, newObservers).forEach((observer) => {
          observer.destroy();
        });
        difference(newObservers, prevObservers).forEach((observer) => {
          observer.subscribe((result) => {
            this.#onUpdate(observer, result);
          });
        });
      }
      this.#notify();
    });
  }
  getCurrentResult() {
    return this.#result;
  }
  getQueries() {
    return this.#observers.map((observer) => observer.getCurrentQuery());
  }
  getObservers() {
    return this.#observers;
  }
  getOptimisticResult(queries, combine) {
    const matches = this.#findMatchingObservers(queries);
    const result = matches.map(
      (match) => match.observer.getOptimisticResult(match.defaultedQueryOptions)
    );
    const queryHashes = matches.map(
      (match) => match.defaultedQueryOptions.queryHash
    );
    return [
      result,
      (r2) => {
        return this.#combineResult(r2 ?? result, combine, queryHashes);
      },
      () => {
        return this.#trackResult(result, matches);
      }
    ];
  }
  #trackResult(result, matches) {
    return matches.map((match, index) => {
      const observerResult = result[index];
      return !match.defaultedQueryOptions.notifyOnChangeProps ? match.observer.trackResult(observerResult, (accessedProp) => {
        matches.forEach((m) => {
          m.observer.trackProp(accessedProp);
        });
      }) : observerResult;
    });
  }
  #combineResult(input, combine, queryHashes) {
    if (combine) {
      const lastHashes = this.#lastQueryHashes;
      const queryHashesChanged = queryHashes !== void 0 && lastHashes !== void 0 && (lastHashes.length !== queryHashes.length || queryHashes.some((hash, i2) => hash !== lastHashes[i2]));
      if (!this.#combinedResult || this.#result !== this.#lastResult || queryHashesChanged || combine !== this.#lastCombine) {
        this.#lastCombine = combine;
        this.#lastResult = this.#result;
        if (queryHashes !== void 0) {
          this.#lastQueryHashes = queryHashes;
        }
        this.#combinedResult = replaceEqualDeep(
          this.#combinedResult,
          combine(input)
        );
      }
      return this.#combinedResult;
    }
    return input;
  }
  #shouldSkipCombine() {
    return this.#options?.combine !== void 0 && this.#observers.some((observer, index) => {
      return observer.options.suspense && this.#result[index]?.data === void 0;
    });
  }
  #findMatchingObservers(queries) {
    const prevObserversMap = /* @__PURE__ */ new Map();
    this.#observers.forEach((observer) => {
      const key = observer.options.queryHash;
      if (!key) return;
      const previousObservers = prevObserversMap.get(key);
      if (previousObservers) {
        previousObservers.push(observer);
      } else {
        prevObserversMap.set(key, [observer]);
      }
    });
    const observers = [];
    queries.forEach((options) => {
      const defaultedOptions = this.#client.defaultQueryOptions(options);
      const match = prevObserversMap.get(defaultedOptions.queryHash)?.shift();
      const observer = match ?? new QueryObserver(this.#client, defaultedOptions);
      observers.push({
        defaultedQueryOptions: defaultedOptions,
        observer
      });
    });
    return observers;
  }
  #onUpdate(observer, result) {
    const index = this.#observers.indexOf(observer);
    if (index !== -1) {
      this.#result = replaceAt(this.#result, index, result);
      this.#notify();
    }
  }
  #notify() {
    if (this.hasListeners()) {
      const newTracked = this.#trackResult(this.#result, this.#observerMatches);
      const shouldSkipCombine = this.#shouldSkipCombine();
      const previousResult = this.#combinedResult;
      const newResult = shouldSkipCombine ? previousResult : this.#combineResult(newTracked, this.#options?.combine);
      if (shouldSkipCombine || previousResult !== newResult) {
        notifyManager.batch(() => {
          this.listeners.forEach((listener) => {
            listener(this.#result);
          });
        });
      }
    }
  }
};
function useQueries({
  queries,
  ...options
}, queryClient) {
  const client = useQueryClient();
  const isRestoring = useIsRestoring();
  const errorResetBoundary = useQueryErrorResetBoundary();
  const defaultedQueries = reactExports.useMemo(
    () => queries.map((opts) => {
      const defaultedOptions = client.defaultQueryOptions(
        opts
      );
      defaultedOptions._optimisticResults = isRestoring ? "isRestoring" : "optimistic";
      return defaultedOptions;
    }),
    [queries, client, isRestoring]
  );
  defaultedQueries.forEach((queryOptions) => {
    ensureSuspenseTimers(queryOptions);
    const query = client.getQueryCache().get(queryOptions.queryHash);
    ensurePreventErrorBoundaryRetry(queryOptions, errorResetBoundary, query);
  });
  useClearResetErrorBoundary(errorResetBoundary);
  const [observer] = reactExports.useState(
    () => new QueriesObserver(
      client,
      defaultedQueries,
      options
    )
  );
  const [optimisticResult, getCombinedResult, trackResult] = observer.getOptimisticResult(
    defaultedQueries,
    options.combine
  );
  const shouldSubscribe = !isRestoring && options.subscribed !== false;
  reactExports.useSyncExternalStore(
    reactExports.useCallback(
      (onStoreChange) => shouldSubscribe ? observer.subscribe(notifyManager.batchCalls(onStoreChange)) : noop,
      [observer, shouldSubscribe]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  reactExports.useEffect(() => {
    observer.setQueries(
      defaultedQueries,
      options
    );
  }, [defaultedQueries, options, observer]);
  const shouldAtLeastOneSuspend = optimisticResult.some(
    (result, index) => shouldSuspend(defaultedQueries[index], result)
  );
  const suspensePromises = shouldAtLeastOneSuspend ? optimisticResult.flatMap((result, index) => {
    const opts = defaultedQueries[index];
    if (opts && shouldSuspend(opts, result)) {
      const queryObserver = new QueryObserver(client, opts);
      return fetchOptimistic(opts, queryObserver, errorResetBoundary);
    }
    return [];
  }) : [];
  if (suspensePromises.length > 0) {
    throw Promise.all(suspensePromises);
  }
  const firstSingleResultWhichShouldThrow = optimisticResult.find(
    (result, index) => {
      const query = defaultedQueries[index];
      return query && getHasError({
        result,
        errorResetBoundary,
        throwOnError: query.throwOnError,
        query: client.getQueryCache().get(query.queryHash),
        suspense: query.suspense
      });
    }
  );
  if (firstSingleResultWhichShouldThrow?.error) {
    throw firstSingleResultWhichShouldThrow.error;
  }
  return getCombinedResult(trackResult());
}
function _extends$1() {
  return _extends$1 = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e = 1; e < arguments.length; e++) {
      var t2 = arguments[e];
      for (var r2 in t2) ({}).hasOwnProperty.call(t2, r2) && (n2[r2] = t2[r2]);
    }
    return n2;
  }, _extends$1.apply(null, arguments);
}
function ownKeys$1(e, r2) {
  var t2 = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r2 && (o = o.filter(function(r3) {
      return Object.getOwnPropertyDescriptor(e, r3).enumerable;
    })), t2.push.apply(t2, o);
  }
  return t2;
}
function _objectSpread$1(e) {
  for (var r2 = 1; r2 < arguments.length; r2++) {
    var t2 = null != arguments[r2] ? arguments[r2] : {};
    r2 % 2 ? ownKeys$1(Object(t2), true).forEach(function(r3) {
      _defineProperty$1(e, r3, t2[r3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t2)) : ownKeys$1(Object(t2)).forEach(function(r3) {
      Object.defineProperty(e, r3, Object.getOwnPropertyDescriptor(t2, r3));
    });
  }
  return e;
}
function _defineProperty$1(e, r2, t2) {
  return (r2 = _toPropertyKey$1(r2)) in e ? Object.defineProperty(e, r2, { value: t2, enumerable: true, configurable: true, writable: true }) : e[r2] = t2, e;
}
function _toPropertyKey$1(t2) {
  var i2 = _toPrimitive$1(t2, "string");
  return "symbol" == typeof i2 ? i2 : i2 + "";
}
function _toPrimitive$1(t2, r2) {
  if ("object" != typeof t2 || !t2) return t2;
  var e = t2[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i2 = e.call(t2, r2);
    if ("object" != typeof i2) return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r2 ? String : Number)(t2);
}
var SIZE = 32;
var defaultLegendContentDefaultProps = {
  align: "center",
  iconSize: 14,
  inactiveColor: "#ccc",
  layout: "horizontal",
  verticalAlign: "middle"
};
function Icon(_ref) {
  var {
    data,
    iconType,
    inactiveColor
  } = _ref;
  var halfSize = SIZE / 2;
  var sixthSize = SIZE / 6;
  var thirdSize = SIZE / 3;
  var color = data.inactive ? inactiveColor : data.color;
  var preferredIcon = iconType !== null && iconType !== void 0 ? iconType : data.type;
  if (preferredIcon === "none") {
    return null;
  }
  if (preferredIcon === "plainline") {
    var _data$payload;
    return /* @__PURE__ */ reactExports.createElement("line", {
      strokeWidth: 4,
      fill: "none",
      stroke: color,
      strokeDasharray: (_data$payload = data.payload) === null || _data$payload === void 0 ? void 0 : _data$payload.strokeDasharray,
      x1: 0,
      y1: halfSize,
      x2: SIZE,
      y2: halfSize,
      className: "recharts-legend-icon"
    });
  }
  if (preferredIcon === "line") {
    return /* @__PURE__ */ reactExports.createElement("path", {
      strokeWidth: 4,
      fill: "none",
      stroke: color,
      d: "M0,".concat(halfSize, "h").concat(thirdSize, "\n            A").concat(sixthSize, ",").concat(sixthSize, ",0,1,1,").concat(2 * thirdSize, ",").concat(halfSize, "\n            H").concat(SIZE, "M").concat(2 * thirdSize, ",").concat(halfSize, "\n            A").concat(sixthSize, ",").concat(sixthSize, ",0,1,1,").concat(thirdSize, ",").concat(halfSize),
      className: "recharts-legend-icon"
    });
  }
  if (preferredIcon === "rect") {
    return /* @__PURE__ */ reactExports.createElement("path", {
      stroke: "none",
      fill: color,
      d: "M0,".concat(SIZE / 8, "h").concat(SIZE, "v").concat(SIZE * 3 / 4, "h").concat(-SIZE, "z"),
      className: "recharts-legend-icon"
    });
  }
  if (/* @__PURE__ */ reactExports.isValidElement(data.legendIcon)) {
    var iconProps = _objectSpread$1({}, data);
    delete iconProps.legendIcon;
    return /* @__PURE__ */ reactExports.cloneElement(data.legendIcon, iconProps);
  }
  return /* @__PURE__ */ reactExports.createElement(Symbols, {
    fill: color,
    cx: halfSize,
    cy: halfSize,
    size: SIZE,
    sizeType: "diameter",
    type: preferredIcon
  });
}
function Items(props) {
  var {
    payload,
    iconSize,
    layout,
    formatter,
    inactiveColor,
    iconType
  } = props;
  var viewBox = {
    x: 0,
    y: 0,
    width: SIZE,
    height: SIZE
  };
  var itemStyle = {
    display: layout === "horizontal" ? "inline-block" : "block",
    marginRight: 10
  };
  var svgStyle = {
    display: "inline-block",
    verticalAlign: "middle",
    marginRight: 4
  };
  return payload.map((entry, i2) => {
    var finalFormatter = entry.formatter || formatter;
    var className = clsx({
      "recharts-legend-item": true,
      ["legend-item-".concat(i2)]: true,
      inactive: entry.inactive
    });
    if (entry.type === "none") {
      return null;
    }
    var color = entry.inactive ? inactiveColor : entry.color;
    var finalValue = finalFormatter ? finalFormatter(entry.value, entry, i2) : entry.value;
    return /* @__PURE__ */ reactExports.createElement("li", _extends$1({
      className,
      style: itemStyle,
      key: "legend-item-".concat(i2)
    }, adaptEventsOfChild(props, entry, i2)), /* @__PURE__ */ reactExports.createElement(Surface, {
      width: iconSize,
      height: iconSize,
      viewBox,
      style: svgStyle,
      "aria-label": "".concat(finalValue, " legend icon")
    }, /* @__PURE__ */ reactExports.createElement(Icon, {
      data: entry,
      iconType,
      inactiveColor
    })), /* @__PURE__ */ reactExports.createElement("span", {
      className: "recharts-legend-item-text",
      style: {
        color
      }
    }, finalValue));
  });
}
var DefaultLegendContent = (outsideProps) => {
  var props = resolveDefaultProps(outsideProps, defaultLegendContentDefaultProps);
  var {
    payload,
    layout,
    align
  } = props;
  if (!payload || !payload.length) {
    return null;
  }
  var finalStyle = {
    padding: 0,
    margin: 0,
    textAlign: layout === "horizontal" ? align : "left"
  };
  return /* @__PURE__ */ reactExports.createElement("ul", {
    className: "recharts-default-legend",
    style: finalStyle
  }, /* @__PURE__ */ reactExports.createElement(Items, _extends$1({}, props, {
    payload
  })));
};
function useLegendPayload() {
  return useAppSelector(selectLegendPayload);
}
var _excluded = ["contextPayload"];
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e = 1; e < arguments.length; e++) {
      var t2 = arguments[e];
      for (var r2 in t2) ({}).hasOwnProperty.call(t2, r2) && (n2[r2] = t2[r2]);
    }
    return n2;
  }, _extends.apply(null, arguments);
}
function ownKeys(e, r2) {
  var t2 = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r2 && (o = o.filter(function(r3) {
      return Object.getOwnPropertyDescriptor(e, r3).enumerable;
    })), t2.push.apply(t2, o);
  }
  return t2;
}
function _objectSpread(e) {
  for (var r2 = 1; r2 < arguments.length; r2++) {
    var t2 = null != arguments[r2] ? arguments[r2] : {};
    r2 % 2 ? ownKeys(Object(t2), true).forEach(function(r3) {
      _defineProperty(e, r3, t2[r3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t2)) : ownKeys(Object(t2)).forEach(function(r3) {
      Object.defineProperty(e, r3, Object.getOwnPropertyDescriptor(t2, r3));
    });
  }
  return e;
}
function _defineProperty(e, r2, t2) {
  return (r2 = _toPropertyKey(r2)) in e ? Object.defineProperty(e, r2, { value: t2, enumerable: true, configurable: true, writable: true }) : e[r2] = t2, e;
}
function _toPropertyKey(t2) {
  var i2 = _toPrimitive(t2, "string");
  return "symbol" == typeof i2 ? i2 : i2 + "";
}
function _toPrimitive(t2, r2) {
  if ("object" != typeof t2 || !t2) return t2;
  var e = t2[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i2 = e.call(t2, r2);
    if ("object" != typeof i2) return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r2 ? String : Number)(t2);
}
function _objectWithoutProperties(e, t2) {
  if (null == e) return {};
  var o, r2, i2 = _objectWithoutPropertiesLoose(e, t2);
  if (Object.getOwnPropertySymbols) {
    var n2 = Object.getOwnPropertySymbols(e);
    for (r2 = 0; r2 < n2.length; r2++) o = n2[r2], -1 === t2.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i2[o] = e[o]);
  }
  return i2;
}
function _objectWithoutPropertiesLoose(r2, e) {
  if (null == r2) return {};
  var t2 = {};
  for (var n2 in r2) if ({}.hasOwnProperty.call(r2, n2)) {
    if (-1 !== e.indexOf(n2)) continue;
    t2[n2] = r2[n2];
  }
  return t2;
}
function defaultUniqBy(entry) {
  return entry.value;
}
function LegendContent(props) {
  var {
    contextPayload
  } = props, otherProps = _objectWithoutProperties(props, _excluded);
  var finalPayload = getUniqPayload(contextPayload, props.payloadUniqBy, defaultUniqBy);
  var contentProps = _objectSpread(_objectSpread({}, otherProps), {}, {
    payload: finalPayload
  });
  if (/* @__PURE__ */ reactExports.isValidElement(props.content)) {
    return /* @__PURE__ */ reactExports.cloneElement(props.content, contentProps);
  }
  if (typeof props.content === "function") {
    return /* @__PURE__ */ reactExports.createElement(props.content, contentProps);
  }
  return /* @__PURE__ */ reactExports.createElement(DefaultLegendContent, contentProps);
}
function getDefaultPosition(style, props, margin, chartWidth, chartHeight, box) {
  var {
    layout,
    align,
    verticalAlign
  } = props;
  var hPos, vPos;
  if (!style || (style.left === void 0 || style.left === null) && (style.right === void 0 || style.right === null)) {
    if (align === "center" && layout === "vertical") {
      hPos = {
        left: ((chartWidth || 0) - box.width) / 2
      };
    } else {
      hPos = align === "right" ? {
        right: margin && margin.right || 0
      } : {
        left: margin && margin.left || 0
      };
    }
  }
  if (!style || (style.top === void 0 || style.top === null) && (style.bottom === void 0 || style.bottom === null)) {
    if (verticalAlign === "middle") {
      vPos = {
        top: ((chartHeight || 0) - box.height) / 2
      };
    } else {
      vPos = verticalAlign === "bottom" ? {
        bottom: margin && margin.bottom || 0
      } : {
        top: margin && margin.top || 0
      };
    }
  }
  return _objectSpread(_objectSpread({}, hPos), vPos);
}
function LegendSettingsDispatcher(props) {
  var dispatch = useAppDispatch();
  reactExports.useEffect(() => {
    dispatch(setLegendSettings(props));
  }, [dispatch, props]);
  return null;
}
function LegendSizeDispatcher(props) {
  var dispatch = useAppDispatch();
  reactExports.useEffect(() => {
    dispatch(setLegendSize(props));
    return () => {
      dispatch(setLegendSize({
        width: 0,
        height: 0
      }));
    };
  }, [dispatch, props]);
  return null;
}
function getWidthOrHeight(layout, height, width, maxWidth) {
  if (layout === "vertical" && height != null) {
    return {
      height
    };
  }
  if (layout === "horizontal") {
    return {
      width: width || maxWidth
    };
  }
  return null;
}
var legendDefaultProps = {
  align: "center",
  iconSize: 14,
  inactiveColor: "#ccc",
  itemSorter: "value",
  layout: "horizontal",
  verticalAlign: "bottom"
};
function Legend(outsideProps) {
  var props = resolveDefaultProps(outsideProps, legendDefaultProps);
  var contextPayload = useLegendPayload();
  var legendPortalFromContext = useLegendPortal();
  var margin = useMargin();
  var {
    width: widthFromProps,
    height: heightFromProps,
    wrapperStyle,
    portal: portalFromProps
  } = props;
  var [lastBoundingBox, updateBoundingBox] = useElementOffset([contextPayload]);
  var chartWidth = useChartWidth$1();
  var chartHeight = useChartHeight();
  if (chartWidth == null || chartHeight == null) {
    return null;
  }
  var maxWidth = chartWidth - ((margin === null || margin === void 0 ? void 0 : margin.left) || 0) - ((margin === null || margin === void 0 ? void 0 : margin.right) || 0);
  var widthOrHeight = getWidthOrHeight(props.layout, heightFromProps, widthFromProps, maxWidth);
  var outerStyle = portalFromProps ? wrapperStyle : _objectSpread(_objectSpread({
    position: "absolute",
    width: (widthOrHeight === null || widthOrHeight === void 0 ? void 0 : widthOrHeight.width) || widthFromProps || "auto",
    height: (widthOrHeight === null || widthOrHeight === void 0 ? void 0 : widthOrHeight.height) || heightFromProps || "auto"
  }, getDefaultPosition(wrapperStyle, props, margin, chartWidth, chartHeight, lastBoundingBox)), wrapperStyle);
  var legendPortal = portalFromProps !== null && portalFromProps !== void 0 ? portalFromProps : legendPortalFromContext;
  if (legendPortal == null || contextPayload == null) {
    return null;
  }
  var legendElement = /* @__PURE__ */ reactExports.createElement("div", {
    className: "recharts-legend-wrapper",
    style: outerStyle,
    ref: updateBoundingBox
  }, /* @__PURE__ */ reactExports.createElement(LegendSettingsDispatcher, {
    layout: props.layout,
    align: props.align,
    verticalAlign: props.verticalAlign,
    itemSorter: props.itemSorter
  }), !portalFromProps && /* @__PURE__ */ reactExports.createElement(LegendSizeDispatcher, {
    width: lastBoundingBox.width,
    height: lastBoundingBox.height
  }), /* @__PURE__ */ reactExports.createElement(LegendContent, _extends({}, props, widthOrHeight, {
    margin,
    chartWidth,
    chartHeight,
    contextPayload
  })));
  return /* @__PURE__ */ reactDomExports.createPortal(legendElement, legendPortal);
}
Legend.displayName = "Legend";
function inferBacklinksSearchScopeFromTarget(target) {
  const trimmed = target.trim();
  if (!trimmed) {
    return "domain";
  }
  const hasExplicitProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed);
  try {
    const parsed = new URL(
      hasExplicitProtocol ? trimmed : `https://${trimmed}`
    );
    return parsed.pathname !== "/" ? "page" : "domain";
  } catch {
    return "domain";
  }
}
function resolveBacklinksSearchScope({
  target,
  selectedScope,
  userSelectedScope
}) {
  if (userSelectedScope) {
    return selectedScope;
  }
  return inferBacklinksSearchScopeFromTarget(target);
}
function getPersistedBacklinksSearchScope(target, scope) {
  return scope === inferBacklinksSearchScopeFromTarget(target) ? void 0 : scope;
}
function getBacklinksValidationErrors(value, shouldValidateUntouchedField, canOpenSearch, tabLimit) {
  if (!value.target.trim()) {
    if (!shouldValidateUntouchedField) {
      return null;
    }
    return createFormValidationErrors({
      fields: {
        target: "Enter a domain or URL to analyze."
      }
    });
  }
  const normalizedValue = {
    ...value,
    target: value.target.trim()
  };
  if (canOpenSearch && !canOpenSearch(normalizedValue)) {
    return createFormValidationErrors({
      fields: {
        target: `Close a tab to open more searches (max ${tabLimit ?? 8}).`
      }
    });
  }
  return null;
}
function BacklinksSearchCard({
  canOpenSearch,
  errorMessage,
  initialValues,
  onSubmit,
  tabLimit
}) {
  const [userSelectedScope, setUserSelectedScope] = reactExports.useState(false);
  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onChange: ({ formApi, value }) => getBacklinksValidationErrors(
        value,
        shouldValidateFieldOnChange(formApi, "target"),
        canOpenSearch,
        tabLimit
      ),
      onSubmit: ({ value }) => getBacklinksValidationErrors(value, true, canOpenSearch, tabLimit)
    },
    onSubmit: ({ value }) => {
      const target = value.target.trim();
      const scope = resolveBacklinksSearchScope({
        target,
        selectedScope: value.scope,
        userSelectedScope
      });
      onSubmit({
        ...value,
        target,
        scope
      });
    }
  });
  reactExports.useEffect(() => {
    form.reset(initialValues);
    setUserSelectedScope(false);
  }, [form, initialValues]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card bg-base-100 border border-base-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-body gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "form",
      {
        className: "space-y-3",
        onSubmit: (event) => {
          event.preventDefault();
          void form.handleSubmit();
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:flex-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "target", children: (field) => {
              const targetError = getFieldError(field.state.meta.errors);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  className: `input input-bordered flex flex-1 items-center gap-2 ${targetError ? "input-error" : ""}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4 text-base-content/60" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        placeholder: "Enter a domain or URL",
                        value: field.state.value,
                        onChange: (event) => {
                          const nextTarget = event.target.value;
                          field.handleChange(nextTarget);
                          if (!userSelectedScope) {
                            form.setFieldValue(
                              "scope",
                              inferBacklinksSearchScopeFromTarget(nextTarget)
                            );
                          }
                        }
                      }
                    )
                  ]
                }
              );
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(form.Subscribe, { selector: (state) => state.isSubmitting, children: (isSubmitting) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "submit",
                className: "btn btn-primary shrink-0 px-6",
                disabled: isSubmitting,
                children: isSubmitting ? "Loading..." : "Search"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "target", children: (field) => {
            const targetError = getFieldError(field.state.meta.errors);
            return targetError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: targetError }) : null;
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(form.Subscribe, { selector: (state) => state.errorMap.onSubmit, children: (submitError) => {
            const formError = getFormError(submitError);
            return formError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: formError }) : null;
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "scope", children: (field) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: `btn btn-xs ${field.state.value === "domain" ? "btn-soft" : "btn-ghost"}`,
                onClick: () => {
                  setUserSelectedScope(true);
                  field.handleChange("domain");
                },
                children: "Site-wide"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: `btn btn-xs ${field.state.value === "page" ? "btn-soft" : "btn-ghost"}`,
                onClick: () => {
                  setUserSelectedScope(true);
                  field.handleChange("page");
                },
                children: "Exact page"
              }
            )
          ] }) }) })
        ] })
      }
    ),
    errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error", children: errorMessage }) : null
  ] }) });
}
const TAB_DESCRIPTIONS = {
  backlinks: "See the individual links pointing to your target, including source page, anchor text, and link quality signals.",
  domains: "View the unique domains linking to your target, grouped at the site level instead of by individual link.",
  pages: "See which pages on the target site attract the most backlinks and referring domains."
};
function buildSummaryStats(data) {
  if (!data) return [];
  return [
    {
      label: "Backlinks",
      value: formatNumber(data.summary.backlinks),
      description: "Total links pointing to this site or page."
    },
    {
      label: "Referring Domains",
      value: formatNumber(data.summary.referringDomains),
      description: "Unique domains linking to this site or page."
    },
    {
      label: "Referring Pages",
      value: formatNumber(data.summary.referringPages),
      description: "Unique pages linking to this site or page."
    },
    {
      label: "Rank",
      value: formatNumber(data.summary.rank),
      description: "DataForSEO's 0-100 authority score."
    },
    {
      label: "Backlink Spam Score",
      value: formatDecimal(data.summary.backlinksSpamScore),
      description: "Estimated spam risk of links pointing here."
    },
    {
      label: "Broken Backlinks",
      value: formatNumber(data.summary.brokenBacklinks),
      description: "Links pointing to broken pages here."
    },
    {
      label: "Broken Pages",
      value: formatNumber(data.summary.brokenPages),
      description: "Broken pages here that still have backlinks."
    },
    {
      label: "Target Spam Score",
      value: formatDecimal(data.summary.targetSpamScore),
      description: "Estimated spam risk of this site or page."
    }
  ];
}
function formatNumber(value) {
  if (value == null) return "-";
  return new Intl.NumberFormat().format(Math.round(value));
}
function formatDecimal(value) {
  if (value == null) return "-";
  return value.toFixed(value >= 100 ? 0 : 1);
}
function formatTooltipValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "string") return value;
  return "-";
}
function formatCompactDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function formatMonthLabel(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(void 0, {
    month: "short",
    year: "2-digit"
  });
}
function formatRelativeTimestamp(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "recently";
  return parsed.toLocaleString(void 0, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
function extractUrlPath(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return url;
  }
}
function truncateMiddle(value, maxLength) {
  if (value.length <= maxLength) return value;
  const sideLength = Math.floor((maxLength - 1) / 2);
  return `${value.slice(0, sideLength)}...${value.slice(-sideLength)}`;
}
function BacklinksTrendChart({
  data
}) {
  const { containerRef, chartWidth } = useChartWidth();
  if (data.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyChartState, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: containerRef,
      className: "h-56 min-w-0",
      "aria-label": "Backlink trend chart",
      children: chartWidth > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        LineChart,
        {
          width: chartWidth,
          height: 224,
          data,
          margin: { left: 8, right: 8, top: 8, bottom: 0 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CartesianGrid,
              {
                strokeDasharray: "3 3",
                stroke: "currentColor",
                opacity: 0.12
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              XAxis,
              {
                dataKey: "date",
                tickFormatter: formatChartTick,
                minTickGap: 24
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { yAxisId: "left", tickFormatter: formatAxisValue, width: 60 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              YAxis,
              {
                yAxisId: "right",
                orientation: "right",
                tickFormatter: formatAxisValue,
                width: 60
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                formatter: formatTooltipValue,
                labelFormatter: formatChartLabel
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Line,
              {
                yAxisId: "left",
                type: "monotone",
                dataKey: "backlinks",
                stroke: "#2563eb",
                strokeWidth: 2,
                dot: false,
                name: "Backlinks"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Line,
              {
                yAxisId: "right",
                type: "monotone",
                dataKey: "referringDomains",
                stroke: "#14b8a6",
                strokeWidth: 2,
                dot: false,
                name: "Referring domains"
              }
            )
          ]
        }
      ) : null
    }
  );
}
function BacklinksNewLostChart({
  data
}) {
  const { containerRef, chartWidth } = useChartWidth();
  if (data.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyChartState, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: containerRef,
      className: "h-56 min-w-0",
      "aria-label": "New and lost backlinks chart",
      children: chartWidth > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        LineChart,
        {
          width: chartWidth,
          height: 224,
          data,
          margin: { left: 8, right: 8, top: 8, bottom: 0 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CartesianGrid,
              {
                strokeDasharray: "3 3",
                stroke: "currentColor",
                opacity: 0.12
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              XAxis,
              {
                dataKey: "date",
                tickFormatter: formatChartTick,
                minTickGap: 24
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tickFormatter: formatAxisValue, width: 60 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                formatter: formatTooltipValue,
                labelFormatter: formatChartLabel
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Line,
              {
                type: "monotone",
                dataKey: "lostBacklinks",
                stroke: "#ef4444",
                strokeWidth: 2,
                dot: false,
                name: "Lost backlinks"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Line,
              {
                type: "monotone",
                dataKey: "newBacklinks",
                stroke: "#16a34a",
                strokeWidth: 2,
                dot: false,
                name: "New backlinks"
              }
            )
          ]
        }
      ) : null
    }
  );
}
function useChartWidth() {
  const containerRef = reactExports.useRef(null);
  const [chartWidth, setChartWidth] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const updateWidth = () => {
      setChartWidth(container.clientWidth);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { containerRef, chartWidth };
}
function EmptyChartState() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-56 items-center justify-center rounded-xl border border-dashed border-base-300 text-sm text-base-content/55", children: "Not enough historical data yet." });
}
function formatAxisValue(value) {
  if (typeof value !== "number") return "";
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return String(value);
}
function formatChartTick(value) {
  return typeof value === "string" ? formatMonthLabel(value) : "";
}
function formatChartLabel(value) {
  return typeof value === "string" ? formatCompactDate(value) : "";
}
function BacklinksOverviewPanels({
  projectId,
  data,
  summaryStats
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to: "/p/$projectId/backlinks",
        params: { projectId },
        search: {
          target: void 0,
          scope: void 0,
          tab: void 0,
          page: void 0,
          size: void 0,
          sort: void 0,
          order: void 0
        },
        replace: true,
        className: "btn btn-ghost btn-sm gap-2 px-0 text-base-content/70 hover:bg-transparent",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4" }),
          "Recent searches"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 text-sm text-base-content/65", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-outline", children: data.scope }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Target: ",
        data.displayTarget
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "-" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Updated ",
        formatRelativeTimestamp(data.fetchedAt)
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OverviewGrid, { data, summaryStats }),
    data.scope === "page" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert alert-info", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Showing backlinks for this exact page. Enter a bare domain for site-wide results. Trend charts are only shown for domain-level lookups." }) }) : null
  ] });
}
function OverviewGrid({
  data,
  summaryStats
}) {
  const domainScope = data.scope === "domain";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `grid grid-cols-1 gap-3 ${domainScope ? "md:grid-cols-2 xl:grid-cols-3" : ""}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryStatsGrid, { data, summaryStats }),
        domainScope ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendPanels, { data }) : null
      ]
    }
  );
}
function SummaryStatsGrid({
  data,
  summaryStats
}) {
  const cardClassName = `card bg-base-100 border border-base-300 ${data.scope === "domain" ? "md:col-span-2 xl:col-span-1" : ""}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardClassName, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-body p-4 xl:h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-x-6 gap-y-5 xl:gap-y-6", children: summaryStats.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wide text-base-content/55", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      HeaderHelpLabel,
      {
        label: item.label,
        helpText: item.description
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-semibold", children: item.value })
  ] }, item.label)) }) }) });
}
function TrendPanels({ data }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TrendCard,
      {
        title: "Backlink growth",
        description: "Backlinks and referring domains over the last year",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(BacklinksTrendChart, { data: data.trends })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TrendCard,
      {
        title: "New vs lost",
        description: "Backlink acquisition and attrition",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(BacklinksNewLostChart, { data: data.newLostTrends })
      }
    )
  ] });
}
function TrendCard({
  children,
  description,
  title
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card bg-base-100 border border-base-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-body gap-2 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-medium", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-base-content/55", children: description })
    ] }),
    children
  ] }) });
}
const EMPTY_BACKLINKS_FILTERS = {
  include: "",
  exclude: "",
  minDomainRank: "",
  maxDomainRank: "",
  minLinkAuthority: "",
  maxLinkAuthority: "",
  minSpamScore: "",
  maxSpamScore: "",
  linkType: "",
  hideLost: "",
  hideBroken: ""
};
const EMPTY_REFERRING_DOMAINS_FILTERS = {
  include: "",
  exclude: "",
  minBacklinks: "",
  maxBacklinks: "",
  minRank: "",
  maxRank: "",
  minSpamScore: "",
  maxSpamScore: ""
};
const EMPTY_TOP_PAGES_FILTERS = {
  include: "",
  exclude: "",
  minBacklinks: "",
  maxBacklinks: "",
  minReferringDomains: "",
  maxReferringDomains: "",
  minRank: "",
  maxRank: ""
};
const BACKLINKS_FILTER_FIELDS = [
  "include",
  "exclude",
  "minDomainRank",
  "maxDomainRank",
  "minLinkAuthority",
  "maxLinkAuthority",
  "minSpamScore",
  "maxSpamScore",
  "linkType",
  "hideLost",
  "hideBroken"
];
const REFERRING_DOMAINS_FILTER_FIELDS = [
  "include",
  "exclude",
  "minBacklinks",
  "maxBacklinks",
  "minRank",
  "maxRank",
  "minSpamScore",
  "maxSpamScore"
];
const TOP_PAGES_FILTER_FIELDS = [
  "include",
  "exclude",
  "minBacklinks",
  "maxBacklinks",
  "minReferringDomains",
  "maxReferringDomains",
  "minRank",
  "maxRank"
];
function countActiveFilters(values) {
  return Object.values(values).filter((v) => v.trim() !== "").length;
}
function countFilterConditions(values) {
  let n2 = 0;
  for (const [key, value] of Object.entries(values)) {
    if (key === "include" || key === "exclude") {
      for (const term of value.split(/[,+]/)) if (term.trim()) n2 += 1;
      continue;
    }
    if (value.trim() !== "") n2 += 1;
  }
  return n2;
}
function toNumberOrUndefined(value) {
  const trimmed = value.trim();
  if (trimmed === "") return void 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : void 0;
}
function toBacklinksFiltersPayload(values) {
  return {
    include: values.include.trim() || void 0,
    exclude: values.exclude.trim() || void 0,
    minDomainRank: toNumberOrUndefined(values.minDomainRank),
    maxDomainRank: toNumberOrUndefined(values.maxDomainRank),
    minLinkAuthority: toNumberOrUndefined(values.minLinkAuthority),
    maxLinkAuthority: toNumberOrUndefined(values.maxLinkAuthority),
    minSpamScore: toNumberOrUndefined(values.minSpamScore),
    maxSpamScore: toNumberOrUndefined(values.maxSpamScore),
    linkType: values.linkType === "dofollow" || values.linkType === "nofollow" ? values.linkType : void 0,
    hideLost: values.hideLost === "true" ? true : void 0,
    hideBroken: values.hideBroken === "true" ? true : void 0
  };
}
function toReferringDomainsFiltersPayload(values) {
  return {
    include: values.include.trim() || void 0,
    exclude: values.exclude.trim() || void 0,
    minBacklinks: toNumberOrUndefined(values.minBacklinks),
    maxBacklinks: toNumberOrUndefined(values.maxBacklinks),
    minRank: toNumberOrUndefined(values.minRank),
    maxRank: toNumberOrUndefined(values.maxRank),
    minSpamScore: toNumberOrUndefined(values.minSpamScore),
    maxSpamScore: toNumberOrUndefined(values.maxSpamScore)
  };
}
function toTopPagesFiltersPayload(values) {
  return {
    include: values.include.trim() || void 0,
    exclude: values.exclude.trim() || void 0,
    minBacklinks: toNumberOrUndefined(values.minBacklinks),
    maxBacklinks: toNumberOrUndefined(values.maxBacklinks),
    minReferringDomains: toNumberOrUndefined(values.minReferringDomains),
    maxReferringDomains: toNumberOrUndefined(values.maxReferringDomains),
    minRank: toNumberOrUndefined(values.minRank),
    maxRank: toNumberOrUndefined(values.maxRank)
  };
}
function BacklinksFilterPanel({
  activeTab,
  filters,
  onApplied
}) {
  if (activeTab === "backlinks") {
    const state2 = filters.backlinks;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DomainFilterPanel,
      {
        debugName: "BacklinksFilterPanel",
        appliedFilters: state2.values,
        fields: BACKLINKS_FILTER_FIELDS,
        activeFilterCount: state2.activeFilterCount,
        countConditions: countFilterConditions,
        textFields: [
          {
            key: "include",
            label: "Source URL Contains",
            placeholder: "example.com, blog"
          },
          {
            key: "exclude",
            label: "Source URL Excludes",
            placeholder: "spam, forum"
          }
        ],
        rangeFields: [
          {
            title: "Domain Authority",
            minKey: "minDomainRank",
            maxKey: "maxDomainRank"
          },
          {
            title: "Link Authority",
            minKey: "minLinkAuthority",
            maxKey: "maxLinkAuthority"
          },
          {
            title: "Spam Score",
            minKey: "minSpamScore",
            maxKey: "maxSpamScore",
            step: "0.1"
          }
        ],
        onApply: (values) => {
          state2.apply(values);
          onApplied();
        },
        onClear: () => {
          state2.reset();
          onApplied();
        },
        renderExtra: (draft, setValue) => /* @__PURE__ */ jsxRuntimeExports.jsx(BacklinksToggleControls, { draft, setValue })
      },
      "backlinks"
    );
  }
  if (activeTab === "domains") {
    const state2 = filters.domains;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      DomainFilterPanel,
      {
        debugName: "ReferringDomainsFilterPanel",
        appliedFilters: state2.values,
        fields: REFERRING_DOMAINS_FILTER_FIELDS,
        activeFilterCount: state2.activeFilterCount,
        countConditions: countFilterConditions,
        textFields: [
          {
            key: "include",
            label: "Domain Contains",
            placeholder: "example.com, blog"
          },
          {
            key: "exclude",
            label: "Domain Excludes",
            placeholder: "spam, forum"
          }
        ],
        rangeFields: [
          {
            title: "Backlinks",
            minKey: "minBacklinks",
            maxKey: "maxBacklinks"
          },
          { title: "Rank", minKey: "minRank", maxKey: "maxRank" },
          {
            title: "Spam Score",
            minKey: "minSpamScore",
            maxKey: "maxSpamScore",
            step: "0.1"
          }
        ],
        onApply: (values) => {
          state2.apply(values);
          onApplied();
        },
        onClear: () => {
          state2.reset();
          onApplied();
        }
      },
      "domains"
    );
  }
  const state = filters.pages;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    DomainFilterPanel,
    {
      debugName: "TopPagesFilterPanel",
      appliedFilters: state.values,
      fields: TOP_PAGES_FILTER_FIELDS,
      activeFilterCount: state.activeFilterCount,
      countConditions: countFilterConditions,
      textFields: [
        {
          key: "include",
          label: "Page URL Contains",
          placeholder: "/blog, /products"
        },
        {
          key: "exclude",
          label: "Page URL Excludes",
          placeholder: "/tag, /author"
        }
      ],
      rangeFields: [
        { title: "Backlinks", minKey: "minBacklinks", maxKey: "maxBacklinks" },
        {
          title: "Referring Domains",
          minKey: "minReferringDomains",
          maxKey: "maxReferringDomains"
        },
        { title: "Rank", minKey: "minRank", maxKey: "maxRank" }
      ],
      onApply: (values) => {
        state.apply(values);
        onApplied();
      },
      onClear: () => {
        state.reset();
        onApplied();
      }
    },
    "pages"
  );
}
function BacklinksToggleControls({
  draft,
  setValue
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-base-content/60", children: "Link Type" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1", children: ["", "dofollow", "nofollow"].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `btn btn-xs ${draft.linkType === value ? "btn-soft" : "btn-ghost"}`,
          onClick: () => setValue("linkType", value),
          children: value === "" ? "All" : value === "dofollow" ? "Dofollow" : "Nofollow"
        },
        value || "all"
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-base-content/60", children: "Visibility" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              className: "checkbox checkbox-xs",
              checked: draft.hideLost === "true",
              onChange: (event) => setValue("hideLost", event.target.checked ? "true" : "")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "Hide lost" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              className: "checkbox checkbox-xs",
              checked: draft.hideBroken === "true",
              onChange: (event) => setValue("hideBroken", event.target.checked ? "true" : "")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "Hide broken" })
        ] })
      ] })
    ] })
  ] });
}
function EmptyTableState({ label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-base-300 p-10 text-center text-sm text-base-content/55", children: label });
}
function BacklinksSourceLink({
  url,
  maxLength,
  muted = false
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SafeExternalLink,
    {
      url,
      label: truncateMiddle(extractUrlPath(url), maxLength),
      className: `link link-hover break-all inline-flex items-center gap-1 ${muted ? "text-xs text-base-content/55" : "text-sm"}`
    }
  );
}
function BacklinkFlags({ row }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1", children: [
    row.isLost ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-sm badge-error badge-outline", children: "Lost" }) : null,
    row.isBroken ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-sm badge-warning badge-outline", children: "Broken" }) : null,
    row.isDofollow === false ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-sm badge-outline", children: "Nofollow" }) : null,
    row.linksCount != null && row.linksCount > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge badge-sm badge-outline min-w-fit whitespace-nowrap", children: [
      row.linksCount,
      " links"
    ] }) : null
  ] });
}
function StatusCell({ status }) {
  if (status === "loading") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2 pl-6 text-sm text-base-content/60", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-xs" }),
      "Loading links…"
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pl-6 text-sm text-base-content/60", children: status === "error" ? "Couldn't load this domain's links." : "No other links from this domain." });
}
function SourceCell({
  displayRow,
  onToggleDomain
}) {
  if (displayRow.kind === "status") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(StatusCell, { status: displayRow.status });
  }
  const { row, depth, expandable, expanded } = displayRow;
  if (depth > 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "break-all pl-6", children: row.urlFrom ? /* @__PURE__ */ jsxRuntimeExports.jsx(BacklinksSourceLink, { url: row.urlFrom, maxLength: 48, muted: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base-content/55", children: "-" }) });
  }
  const domainLabel = row.domainFrom?.replace(/^www\./, "") ?? "-";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1.5 break-all", children: [
    expandable && row.domainFrom && onToggleDomain ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-xs btn-square shrink-0 -ml-1",
        "aria-label": `${expanded ? "Hide" : "Show"} all links from ${domainLabel}`,
        "aria-expanded": expanded,
        onClick: () => onToggleDomain(row.domainFrom ?? ""),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ChevronRight,
          {
            className: `size-4 transition-transform ${expanded ? "rotate-90" : ""}`
          }
        )
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: domainLabel }),
      row.urlFrom ? /* @__PURE__ */ jsxRuntimeExports.jsx(BacklinksSourceLink, { url: row.urlFrom, maxLength: 48, muted: true }) : null
    ] })
  ] });
}
function linkCell(render) {
  return ({ row }) => row.original.kind === "link" ? render(row.original.row) : null;
}
function buildBaseColumns(onToggleDomain) {
  return [
    {
      id: "source",
      enableSorting: false,
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx(HeaderHelpLabel, { label: "Source", helpText: "Page linking to you" }),
      size: 250,
      minSize: 180,
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx(SourceCell, { displayRow: row.original, onToggleDomain })
    },
    {
      id: "target",
      enableSorting: false,
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx(HeaderHelpLabel, { label: "Target", helpText: "Destination on your site" }),
      size: 220,
      minSize: 150,
      cell: linkCell((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "break-all", children: row.urlTo ? /* @__PURE__ */ jsxRuntimeExports.jsx(BacklinksSourceLink, { url: row.urlTo, maxLength: 40 }) : "-" }))
    },
    {
      id: "anchor",
      enableSorting: false,
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx(HeaderHelpLabel, { label: "Anchor", helpText: "Text or format of the link" }),
      size: 150,
      minSize: 100,
      cell: linkCell((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5 break-words", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: row.anchor || "No anchor text" }),
        row.itemType ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-base-content/55", children: row.itemType }) : null
      ] }))
    },
    {
      id: "flags",
      enableSorting: false,
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
        HeaderHelpLabel,
        {
          label: "Flags",
          helpText: "Special backlink attributes, such as lost, broken, nofollow, or multiple links from the same source."
        }
      ),
      size: 130,
      minSize: 80,
      cell: linkCell((row) => /* @__PURE__ */ jsxRuntimeExports.jsx(BacklinkFlags, { row }))
    },
    {
      id: "rank",
      accessorFn: (displayRow) => displayRow.kind === "link" ? displayRow.row.rank : null,
      header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHeader,
        {
          column,
          label: "Link",
          helpText: "Authority of the linking page",
          align: "right"
        }
      ),
      size: 70,
      minSize: 50,
      sortDescFirst: true,
      cell: linkCell((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right tabular-nums text-sm", children: formatNumber(row.rank) }))
    },
    {
      id: "domainRank",
      accessorFn: (displayRow) => displayRow.kind === "link" ? displayRow.row.domainFromRank : null,
      header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHeader,
        {
          column,
          label: "DA",
          helpText: "Authority of the linking domain",
          align: "right"
        }
      ),
      size: 70,
      minSize: 50,
      sortDescFirst: true,
      cell: linkCell((row) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right tabular-nums text-sm", children: formatNumber(row.domainFromRank) }))
    },
    {
      id: "spamScore",
      accessorFn: (displayRow) => displayRow.kind === "link" ? displayRow.row.spamScore : null,
      header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHeader,
        {
          column,
          label: "Spam",
          helpText: "Estimated spam risk for this backlink. Higher scores are more likely to be manipulative or low quality.",
          align: "right"
        }
      ),
      size: 70,
      minSize: 50,
      sortDescFirst: true,
      cell: linkCell((row) => {
        const value = row.spamScore;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right tabular-nums text-sm", children: value != null && value > 0 ? Math.round(value) : null });
      })
    },
    {
      id: "firstSeen",
      accessorFn: (displayRow) => displayRow.kind === "link" ? displayRow.row.firstSeen : null,
      header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHeader,
        {
          column,
          label: "First Seen",
          helpText: "When this link was first discovered by the crawler"
        }
      ),
      size: 110,
      minSize: 80,
      sortDescFirst: true,
      cell: linkCell((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "whitespace-nowrap text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: formatCompactDate(row.firstSeen) }),
        row.lastSeen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-base-content/55", children: [
          "Last ",
          formatCompactDate(row.lastSeen)
        ] }) : null
      ] }))
    }
  ];
}
function buildBacklinksColumns(domainRatings, onToggleDomain) {
  const baseColumns2 = buildBaseColumns(onToggleDomain);
  if (!domainRatings) return baseColumns2;
  const ratings = domainRatings;
  const drColumn = {
    id: "ahrefsDr",
    enableSorting: false,
    header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex w-full justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      HeaderHelpLabel,
      {
        label: "Ahrefs DR",
        helpText: "Ahrefs Domain Rating (0-100) for the linking domain."
      }
    ) }),
    size: 90,
    minSize: 70,
    cell: linkCell((row) => {
      const domain = row.domainFrom?.replace(/^www\./, "");
      const dr = domain ? ratings[domain] ?? null : null;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right tabular-nums text-sm", children: dr == null ? "—" : formatDecimal(dr) });
    })
  };
  const insertAt = baseColumns2.findIndex((column) => column.id === "domainRank") + 1;
  return [
    ...baseColumns2.slice(0, insertAt),
    drColumn,
    ...baseColumns2.slice(insertAt)
  ];
}
function buildDisplayRows(rows, expansion) {
  if (!expansion) {
    return rows.map((row) => ({
      kind: "link",
      row,
      depth: 0,
      expandable: false,
      expanded: false
    }));
  }
  const out = [];
  for (const row of rows) {
    const domain = row.domainFrom;
    const expanded = Boolean(domain && expansion.expandedDomains.has(domain));
    out.push({
      kind: "link",
      row,
      depth: 0,
      expandable: Boolean(domain),
      expanded
    });
    if (!expanded || !domain) continue;
    const entry = expansion.entriesByDomain[domain];
    if (!entry || entry.status === "loading") {
      out.push({ kind: "status", domain, status: "loading" });
    } else if (entry.status === "error") {
      out.push({ kind: "status", domain, status: "error" });
    } else {
      const children = entry.rows.filter(
        (child) => !(child.urlFrom === row.urlFrom && child.urlTo === row.urlTo && child.anchor === row.anchor)
      );
      if (children.length === 0) {
        out.push({ kind: "status", domain, status: "empty" });
      } else {
        for (const child of children) {
          out.push({
            kind: "link",
            row: child,
            depth: 1,
            expandable: false,
            expanded: false
          });
        }
      }
    }
  }
  return out;
}
function BacklinksTable({
  rows,
  domainRatings,
  sorting,
  onSortingChange,
  expansion
}) {
  const columns2 = reactExports.useMemo(
    () => buildBacklinksColumns(domainRatings, expansion?.toggleDomain),
    [domainRatings, expansion?.toggleDomain]
  );
  const displayRows = reactExports.useMemo(
    () => buildDisplayRows(rows, expansion),
    [rows, expansion]
  );
  const table = useAppTable({
    data: displayRows,
    columns: columns2,
    state: { sorting },
    onSortingChange,
    manualSorting: true
  });
  if (rows.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyTableState, { label: "No backlinks match this filter." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    AppDataTable,
    {
      table,
      fixedLayout: true,
      getRowClassName: (row) => row.original.kind !== "link" || row.original.depth > 0 ? "bg-base-200/30" : void 0
    }
  );
}
const columnHelper$1 = createColumnHelper();
const baseColumns = [
  columnHelper$1.accessor("domain", {
    id: "domain",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Domain",
        helpText: "The referring site linking to your target."
      }
    ),
    cell: ({ getValue }) => {
      const domain = getValue();
      if (!domain) return "-";
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        SafeExternalLink,
        {
          url: getDomainWebsiteHref(domain),
          label: domain,
          className: "link link-primary link-hover break-all inline-flex items-center gap-1"
        }
      );
    }
  }),
  columnHelper$1.accessor("backlinks", {
    id: "backlinks",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Backlinks",
        helpText: "Total backlinks found from this domain."
      }
    ),
    cell: ({ getValue }) => formatNumber(getValue()),
    sortDescFirst: true
  }),
  columnHelper$1.accessor("referringPages", {
    id: "referringPages",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Referring Pages",
        helpText: "Unique pages on this domain that link to your target."
      }
    ),
    cell: ({ getValue }) => formatNumber(getValue()),
    sortDescFirst: true
  }),
  columnHelper$1.accessor("rank", {
    id: "rank",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Rank",
        helpText: "Authority score for the referring domain."
      }
    ),
    cell: ({ getValue }) => formatNumber(getValue()),
    sortDescFirst: true
  }),
  columnHelper$1.accessor("spamScore", {
    id: "spamScore",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Spam",
        helpText: "Spam risk score for this referring domain."
      }
    ),
    cell: ({ getValue }) => formatDecimal(getValue()),
    sortDescFirst: true
  }),
  columnHelper$1.accessor("firstSeen", {
    id: "firstSeen",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "First Seen",
        helpText: "When this domain was first discovered linking to your target."
      }
    ),
    cell: ({ getValue }) => formatCompactDate(getValue()),
    sortDescFirst: true
  }),
  columnHelper$1.accessor("brokenBacklinks", {
    id: "brokenBacklinks",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Issues",
        helpText: "Broken link and broken page counts tied to this domain."
      }
    ),
    cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "Broken links: ",
        formatNumber(row.original.brokenBacklinks)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-base-content/55", children: [
        "Broken pages: ",
        formatNumber(row.original.brokenPages)
      ] })
    ] }),
    sortDescFirst: true
  })
];
function buildReferringDomainColumns(domainRatings) {
  if (!domainRatings) return baseColumns;
  const ratings = domainRatings;
  const drColumn = columnHelper$1.display({
    id: "ahrefsDr",
    header: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
      HeaderHelpLabel,
      {
        label: "Ahrefs DR",
        helpText: "Ahrefs Domain Rating (0-100) for this referring domain."
      }
    ),
    cell: ({ row }) => {
      const domain = row.original.domain;
      const dr = domain ? ratings[domain] ?? null : null;
      return dr == null ? "—" : formatDecimal(dr);
    }
  });
  const insertAt = baseColumns.findIndex((column) => column.id === "rank") + 1;
  return [
    ...baseColumns.slice(0, insertAt),
    drColumn,
    ...baseColumns.slice(insertAt)
  ];
}
function getDomainWebsiteHref(domain) {
  try {
    return new URL(domain).toString();
  } catch {
    return `https://${domain}`;
  }
}
function ReferringDomainsTable({
  rows,
  domainRatings,
  sorting,
  onSortingChange
}) {
  const columns2 = reactExports.useMemo(
    () => buildReferringDomainColumns(domainRatings),
    [domainRatings]
  );
  const table = useAppTable({
    data: rows,
    columns: columns2,
    state: { sorting },
    onSortingChange,
    manualSorting: true
  });
  if (rows.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyTableState, { label: "No referring domains match this filter." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    AppDataTable,
    {
      table,
      getCellClassName: (_, columnId) => columnId === "domain" ? "font-medium break-all" : void 0
    }
  );
}
const columnHelper = createColumnHelper();
const columns = [
  columnHelper.accessor("page", {
    id: "page",
    enableSorting: false,
    header: () => /* @__PURE__ */ jsxRuntimeExports.jsx(
      HeaderHelpLabel,
      {
        label: "Page",
        helpText: "Page on the target site receiving backlinks."
      }
    ),
    cell: ({ getValue }) => {
      const page = getValue();
      return page ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        SafeExternalLink,
        {
          url: page,
          label: page,
          className: "link link-hover break-all inline-flex items-center gap-1"
        }
      ) : "-";
    }
  }),
  columnHelper.accessor("backlinks", {
    id: "backlinks",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Backlinks",
        helpText: "Total backlinks pointing to this page."
      }
    ),
    cell: ({ getValue }) => formatNumber(getValue()),
    sortDescFirst: true
  }),
  columnHelper.accessor("referringDomains", {
    id: "referringDomains",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Referring Domains",
        helpText: "Unique domains linking to this page."
      }
    ),
    cell: ({ getValue }) => formatNumber(getValue()),
    sortDescFirst: true
  }),
  columnHelper.accessor("rank", {
    id: "rank",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Rank",
        helpText: "Authority score for this target page."
      }
    ),
    cell: ({ getValue }) => formatNumber(getValue()),
    sortDescFirst: true
  }),
  columnHelper.accessor("brokenBacklinks", {
    id: "brokenBacklinks",
    header: ({ column }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      SortableHeader,
      {
        column,
        label: "Broken Backlinks",
        helpText: "Backlinks pointing here that are currently broken."
      }
    ),
    cell: ({ getValue }) => formatNumber(getValue()),
    sortDescFirst: true
  })
];
function TopPagesTable({
  rows,
  sorting,
  onSortingChange
}) {
  const table = useAppTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true
  });
  if (rows.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyTableState, { label: "No top pages match this filter." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    AppDataTable,
    {
      table,
      getCellClassName: (_, columnId) => columnId === "page" ? "min-w-80" : void 0
    }
  );
}
function buildBacklinksTabExport(args) {
  const { tab, rows, domainRatings } = args;
  const ratingFor = (domain) => {
    if (!domainRatings || !domain) return null;
    return domainRatings[domain.replace(/^www\./, "")] ?? null;
  };
  if (tab === "backlinks") {
    return {
      headers: [
        "Domain",
        "Source URL",
        "Target URL",
        "Anchor",
        "Type",
        "Dofollow",
        "Rel Attributes",
        "Domain Rank",
        ...domainRatings ? ["Ahrefs DR"] : [],
        "Source Page Rank",
        "Target Rank",
        "Spam Score",
        "First Seen",
        "Last Seen",
        "Lost",
        "Broken",
        "Links Count"
      ],
      rows: rows.backlinks.map((row) => [
        row.domainFrom,
        row.urlFrom,
        row.urlTo,
        row.anchor,
        row.itemType,
        row.isDofollow,
        row.relAttributes.join(", "),
        row.domainFromRank,
        ...domainRatings ? [ratingFor(row.domainFrom)] : [],
        row.pageFromRank,
        row.rank,
        row.spamScore,
        row.firstSeen,
        row.lastSeen,
        row.isLost,
        row.isBroken,
        row.linksCount
      ])
    };
  }
  if (tab === "domains") {
    return {
      headers: [
        "Domain",
        "Backlinks",
        "Referring Pages",
        "Rank",
        ...domainRatings ? ["Ahrefs DR"] : [],
        "Spam Score",
        "First Seen",
        "Broken Backlinks",
        "Broken Pages"
      ],
      rows: rows.referringDomains.map((row) => [
        row.domain,
        row.backlinks,
        row.referringPages,
        row.rank,
        ...domainRatings ? [ratingFor(row.domain)] : [],
        row.spamScore,
        row.firstSeen,
        row.brokenBacklinks,
        row.brokenPages
      ])
    };
  }
  return {
    headers: [
      "Page",
      "Backlinks",
      "Referring Domains",
      "Rank",
      "Broken Backlinks"
    ],
    rows: rows.topPages.map((row) => [
      row.page,
      row.backlinks,
      row.referringDomains,
      row.rank,
      row.brokenBacklinks
    ])
  };
}
function exportBacklinksTabCsv(args) {
  downloadCsv(
    buildBacklinksTabCsvFilename(args.tab, args.target),
    buildCsv(args.headers, args.rows)
  );
}
function buildBacklinksTabCsvFilename(tab, target) {
  const tabPrefix = tab === "backlinks" ? "backlinks" : tab === "domains" ? "referring-domains" : "top-pages";
  const normalizedTarget = target.toLowerCase().trim().replace(/https?:\/\//g, "").replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return `backlinks-${tabPrefix}${normalizedTarget ? `-${normalizedTarget}` : ""}.csv`;
}
function BacklinksExportMenu({
  activeTab,
  exportTarget,
  headers,
  rows
}) {
  const [isExportingSheets, setIsExportingSheets] = reactExports.useState(false);
  const canExport = rows.length > 0 && !isExportingSheets;
  const handleExportToSheets = async () => {
    if (!canExport) return;
    setIsExportingSheets(true);
    try {
      await exportTableToSheets({
        headers,
        rows,
        feature: `backlinks_${activeTab}`
      });
    } finally {
      setIsExportingSheets(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dropdown dropdown-end", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        tabIndex: 0,
        role: "button",
        className: `btn btn-sm btn-ghost gap-1 ${rows.length === 0 ? "btn-disabled" : ""}`,
        "aria-label": "Export backlinks table",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4" }),
          "Export",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3 opacity-60" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "ul",
      {
        tabIndex: 0,
        role: "menu",
        className: "dropdown-content z-10 menu p-2 shadow-lg bg-base-100 border border-base-300 rounded-box w-56",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => void handleExportToSheets(),
              disabled: !canExport,
              children: [
                isExportingSheets ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-xs" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { className: "size-4" }),
                "Export to Sheets"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => exportBacklinksTabCsv({
                tab: activeTab,
                target: exportTarget,
                headers,
                rows
              }),
              disabled: rows.length === 0,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4" }),
                "Export CSV"
              ]
            }
          ) })
        ]
      }
    )
  ] });
}
function BacklinksActionsMenu({
  isLoadingRatings,
  loadRatings,
  ratableDomains
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dropdown dropdown-end", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        tabIndex: 0,
        role: "button",
        className: "btn btn-sm btn-ghost btn-square",
        "aria-label": "Backlinks table actions",
        title: "Backlinks table actions",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "ul",
      {
        tabIndex: 0,
        role: "menu",
        className: "dropdown-content z-10 menu p-2 shadow-lg bg-base-100 border border-base-300 rounded-box w-52",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => void loadRatings(ratableDomains),
            disabled: isLoadingRatings,
            title: "Look up Ahrefs Domain Rating for each domain in the table",
            children: [
              isLoadingRatings ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-xs" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "size-4" }),
              "Ahrefs DR"
            ]
          }
        ) })
      }
    )
  ] });
}
const MAX_DOMAINS_PER_CALL = 100;
const domainRatingsInputSchema = object({
  projectId: string().min(1),
  domains: array(string().trim().min(1).max(253)).max(MAX_DOMAINS_PER_CALL)
});
const getAhrefsDomainRatings = createServerFn({
  method: "POST"
}).middleware(requireProjectContext).validator(domainRatingsInputSchema).handler(createSsrRpc("319d82ec75b2b49399d07e97a0efffd36bd56066017d95b692e7074cae6b1272"));
const DOMAINS_PER_REQUEST = 100;
function useAhrefsDomainRatings(projectId) {
  const [ratings, setRatings] = reactExports.useState(null);
  const ratingsRef = reactExports.useRef(null);
  const pendingDomainsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const [activeLoadCount, setActiveLoadCount] = reactExports.useState(0);
  reactExports.useEffect(() => {
    ratingsRef.current = ratings;
  }, [ratings]);
  const loadRatings = reactExports.useCallback(
    async (domains) => {
      const currentRatings = ratingsRef.current;
      const pendingDomains = pendingDomainsRef.current;
      const targets = n(domains.filter(Boolean)).filter(
        (domain) => !Object.hasOwn(currentRatings ?? {}, domain) && !pendingDomains.has(domain)
      );
      if (targets.length === 0) return;
      for (const domain of targets) pendingDomains.add(domain);
      setActiveLoadCount((count) => count + 1);
      const fetched = {};
      try {
        for (const batch of t$3(targets, DOMAINS_PER_REQUEST)) {
          Object.assign(
            fetched,
            await getAhrefsDomainRatings({
              data: { projectId, domains: batch }
            })
          );
        }
      } catch (error) {
        toast.error(
          getStandardErrorMessage(error, "Could not load Ahrefs DR.")
        );
      } finally {
        if (Object.keys(fetched).length > 0) {
          const nextRatings = { ...ratingsRef.current, ...fetched };
          ratingsRef.current = nextRatings;
          setRatings(nextRatings);
        }
        for (const domain of targets) pendingDomains.delete(domain);
        setActiveLoadCount((count) => Math.max(0, count - 1));
      }
    },
    [projectId]
  );
  return { ratings, isLoading: activeLoadCount > 0, loadRatings };
}
const BACKLINKS_RESULTS_TABS = [
  { tab: "backlinks", label: "Backlinks" },
  { tab: "domains", label: "Referring Domains" },
  { tab: "pages", label: "Top Pages" }
];
function BacklinksResultsCard({
  projectId,
  activeTab,
  tabRows,
  filters,
  sorting,
  view,
  domainExpansion,
  isTabLoading,
  tabErrorMessage,
  exportTarget,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  onTabChange,
  onViewChange
}) {
  const {
    ratings: domainRatings,
    isLoading: isLoadingRatings,
    loadRatings
  } = useAhrefsDomainRatings(projectId);
  const activeFilterCount = filters[activeTab].activeFilterCount;
  const exportTable = reactExports.useMemo(
    () => buildBacklinksTabExport({ tab: activeTab, rows: tabRows, domainRatings }),
    [activeTab, domainRatings, tabRows]
  );
  const ratableDomains = reactExports.useMemo(
    () => collectRatableDomains(tabRows),
    [tabRows]
  );
  reactExports.useEffect(() => {
    if (!domainRatings) return;
    const missing = ratableDomains.filter(
      (domain) => !Object.hasOwn(domainRatings, domain)
    );
    if (missing.length > 0) void loadRatings(missing);
  }, [domainRatings, ratableDomains, loadRatings]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-base-300 rounded-xl bg-base-100 overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 py-3 border-b border-base-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "tablist", className: "tabs tabs-border w-fit", children: BACKLINKS_RESULTS_TABS.map(({ label, tab }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabLink,
          {
            activeTab,
            label,
            onSelect: onTabChange,
            tab
          },
          tab
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xl text-sm text-base-content/60", children: TAB_DESCRIPTIONS[activeTab] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          BacklinksExportMenu,
          {
            activeTab,
            exportTarget,
            headers: exportTable.headers,
            rows: exportTable.rows
          }
        ),
        activeTab !== "pages" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          BacklinksActionsMenu,
          {
            isLoadingRatings,
            loadRatings,
            ratableDomains
          }
        ) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 px-4 py-2 border-b border-base-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: `btn btn-ghost btn-sm gap-1.5 ${filters.showFilters ? "btn-active" : ""}`,
          onClick: () => filters.setShowFilters((current) => !current),
          title: "Toggle table filters",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "size-3.5" }),
            "Filters",
            activeFilterCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-xs badge-primary border-0 text-primary-content", children: activeFilterCount }) : null
          ]
        }
      ),
      activeTab === "backlinks" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          role: "tablist",
          "aria-label": "Backlinks view",
          className: "ml-auto tabs tabs-border tabs-xs w-fit",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                role: "tab",
                "aria-selected": view !== "all",
                className: `tab ${view !== "all" ? "tab-active" : ""}`,
                title: "Show each referring domain's strongest link; expand a row for the rest",
                onClick: () => onViewChange(void 0),
                children: "One per domain"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                role: "tab",
                "aria-selected": view === "all",
                className: `tab ${view === "all" ? "tab-active" : ""}`,
                title: "List every individual backlink",
                onClick: () => onViewChange("all"),
                children: "All links"
              }
            )
          ]
        }
      ) : null
    ] }),
    filters.showFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      BacklinksFilterPanel,
      {
        activeTab,
        filters,
        onApplied: () => onPageChange(1)
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
      tabErrorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert alert-error mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tabErrorMessage }) }) : null,
      isTabLoading && !tabErrorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx(TabLoadingState, { label: TAB_LOADING_LABELS[activeTab] }) : null,
      !isTabLoading && !tabErrorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        activeTab === "backlinks" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          BacklinksTable,
          {
            rows: tabRows.backlinks,
            domainRatings,
            sorting,
            onSortingChange,
            expansion: view === "all" ? null : domainExpansion
          }
        ) : null,
        activeTab === "domains" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          ReferringDomainsTable,
          {
            rows: tabRows.referringDomains,
            domainRatings,
            sorting,
            onSortingChange
          }
        ) : null,
        activeTab === "pages" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          TopPagesTable,
          {
            rows: tabRows.topPages,
            sorting,
            onSortingChange
          }
        ) : null
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TablePagination,
      {
        page: pagination.page,
        pageSize: pagination.pageSize,
        pageSizes: BACKLINKS_PAGE_SIZES,
        totalCount: pagination.totalCount,
        hasNextPage: pagination.hasNextPage,
        isLoading: pagination.isFetching,
        onPageChange,
        onPageSizeChange
      }
    )
  ] });
}
const TAB_LOADING_LABELS = {
  backlinks: "Loading backlinks",
  domains: "Loading referring domains",
  pages: "Loading top pages"
};
function collectRatableDomains(tabRows) {
  const domains = [
    ...tabRows.backlinks.map((row) => row.domainFrom?.replace(/^www\./, "")),
    ...tabRows.referringDomains.map((row) => row.domain)
  ];
  return [
    ...new Set(domains.filter((domain) => Boolean(domain)))
  ];
}
function TabLink({
  activeTab,
  label,
  onSelect,
  tab
}) {
  const isActive = activeTab === tab;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": isActive,
      className: `tab ${isActive ? "tab-active" : ""}`,
      onClick: () => onSelect(tab),
      children: label
    }
  );
}
function TabLoadingState({ label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 py-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-base-content/60", children: [
      label,
      "..."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-10 w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-10 w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-10 w-full" })
  ] });
}
function BacklinksLoadingState() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4", children: Array.from({ length: 8 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card bg-base-100 border border-base-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-body gap-3 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-3 w-24" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-8 w-28" })
    ] }) }, index)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 xl:grid-cols-2", children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card bg-base-100 border border-base-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-body gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-4 w-32" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-64 w-full" })
    ] }) }, index)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card bg-base-100 border border-base-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-body gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-8 w-60" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-80 w-full" })
    ] }) })
  ] });
}
function BacklinksErrorState({
  errorMessage,
  onRetry
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-error/30 bg-error/5 p-6 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl bg-error/10 p-2.5 text-error shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "size-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "Could not load backlinks" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70", children: errorMessage ?? "Please try again in a moment." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-sm", onClick: onRetry, children: "Retry" })
  ] });
}
function BacklinksHistorySection({
  projectId,
  history,
  historyLoaded,
  onRemoveHistoryItem
}) {
  if (!historyLoaded) {
    return null;
  }
  if (history.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-dashed border-base-300 bg-base-100/70 p-6 text-center text-base-content/55 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "size-9 mx-auto opacity-35" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-medium text-base-content/80", children: "Enter a domain or URL to get started" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-base-300 bg-base-100 p-5 md:p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "size-4 text-base-content/45" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-base-content/60", children: [
        history.length,
        " recent search",
        history.length !== 1 ? "es" : ""
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2", children: history.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "group flex items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-2",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/p/$projectId/backlinks",
              params: { projectId },
              search: (prev) => ({
                ...prev,
                target: item.target,
                scope: item.scope,
                tab: void 0,
                page: void 0,
                sort: void 0,
                order: void 0
              }),
              replace: true,
              className: "flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1 text-left transition-colors hover:bg-base-200",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-4 text-base-content/40 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-base-content truncate", children: item.target }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/60 truncate", children: item.scope === "domain" ? "Site-wide" : "Exact page" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-base-content/40", children: new Date(item.timestamp).toLocaleDateString(void 0, {
              month: "short",
              day: "numeric"
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 p-1",
                onClick: () => onRemoveHistoryItem(item.timestamp),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3" })
              }
            )
          ] })
        ]
      },
      item.timestamp
    )) })
  ] });
}
function BacklinksBody({
  projectId,
  history,
  historyLoaded,
  overviewData,
  overviewError,
  overviewLoading,
  backlinksRowsPage,
  referringDomainsPage,
  topPagesPage,
  searchState,
  filters,
  sorting,
  domainExpansion,
  tabErrorMessage,
  tabLoading,
  tabFetching,
  onPageChange,
  onPageSizeChange,
  onRemoveHistoryItem,
  onRetryOverview,
  onSortingChange,
  onTabChange,
  onViewChange,
  searchTabs
}) {
  const tabRows = reactExports.useMemo(
    () => ({
      backlinks: backlinksRowsPage?.rows ?? [],
      referringDomains: referringDomainsPage?.rows ?? [],
      topPages: topPagesPage?.rows ?? []
    }),
    [backlinksRowsPage, referringDomainsPage, topPagesPage]
  );
  const activeTabPage = searchState.tab === "backlinks" ? backlinksRowsPage : searchState.tab === "domains" ? referringDomainsPage : topPagesPage;
  const summaryStats = reactExports.useMemo(
    () => buildSummaryStats(overviewData),
    [overviewData]
  );
  const tabStrip = searchTabs ? /* @__PURE__ */ jsxRuntimeExports.jsx(
    SearchTabStrip,
    {
      projectId,
      activeTabId: searchTabs.activeTabId,
      tabs: searchTabs.tabs,
      onSelect: searchTabs.onSelect,
      onClose: searchTabs.onClose,
      onViewed: searchTabs.onViewed
    }
  ) : null;
  if (!searchState.target) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      BacklinksHistorySection,
      {
        projectId,
        history,
        historyLoaded,
        onRemoveHistoryItem
      }
    );
  }
  if (overviewLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      tabStrip,
      /* @__PURE__ */ jsxRuntimeExports.jsx(BacklinksLoadingState, {})
    ] });
  }
  if (!overviewData) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      tabStrip,
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        BacklinksErrorState,
        {
          errorMessage: overviewError,
          onRetry: onRetryOverview
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    tabStrip,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BacklinksOverviewPanels,
      {
        projectId,
        data: overviewData,
        summaryStats
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BacklinksResultsCard,
      {
        projectId,
        activeTab: searchState.tab,
        tabRows,
        filters,
        sorting,
        view: searchState.view,
        domainExpansion,
        isTabLoading: tabLoading,
        tabErrorMessage,
        exportTarget: overviewData.displayTarget || searchState.target,
        pagination: {
          page: searchState.page,
          pageSize: searchState.pageSize,
          totalCount: activeTabPage?.totalCount ?? null,
          hasNextPage: activeTabPage?.hasMore ?? false,
          isFetching: tabFetching
        },
        onPageChange,
        onPageSizeChange,
        onSortingChange,
        onTabChange,
        onViewChange
      }
    )
  ] });
}
const BACKLINKS_QUERY_STALE_TIME_MS = 5 * 60 * 1e3;
function getBacklinksErrorMessage(error, fallback) {
  if (!error) return null;
  if (getErrorCode(error) === "VALIDATION_ERROR") {
    return "Enter a valid domain or page URL.";
  }
  return getStandardErrorMessage(error, fallback);
}
function toSort(sortParam, orderParam, allowedFields, fallback) {
  const field = sortParam ? allowedFields.find((candidate) => candidate === sortParam) : void 0;
  if (!field) return fallback;
  return { field, order: orderParam ?? "desc" };
}
function useBacklinksPageData({
  projectId,
  searchState,
  filters
}) {
  const searchCardInitialValues = reactExports.useMemo(
    () => ({
      target: searchState.target,
      scope: searchState.scope
    }),
    [searchState.scope, searchState.target]
  );
  const { target, scope, tab, page, pageSize, sort, order, view } = searchState;
  const rowsMode = view === "all" ? "as_is" : "one_per_domain";
  const targetReady = Boolean(target);
  const baseQueryKeyParts = [projectId, scope, target];
  const pageInputBase = { projectId, target, scope, page, pageSize };
  const overviewQuery = useQuery({
    queryKey: ["backlinksOverview", ...baseQueryKeyParts],
    enabled: targetReady,
    staleTime: BACKLINKS_QUERY_STALE_TIME_MS,
    queryFn: () => getBacklinksOverview({ data: { projectId, target, scope } })
  });
  const rowsSort = toSort(
    sort,
    order,
    backlinksRowsSortFieldSchema.options,
    BACKLINKS_DEFAULT_SORT.backlinks
  );
  const rowsFilters = reactExports.useMemo(
    () => toBacklinksFiltersPayload(filters.backlinks.values),
    [filters.backlinks.values]
  );
  const rowsQuery = useQuery({
    queryKey: [
      "backlinksRows",
      ...baseQueryKeyParts,
      page,
      pageSize,
      rowsSort.field,
      rowsSort.order,
      rowsFilters,
      rowsMode
    ],
    enabled: targetReady && tab === "backlinks",
    staleTime: BACKLINKS_QUERY_STALE_TIME_MS,
    queryFn: () => getBacklinksRows({
      data: {
        ...pageInputBase,
        sortField: rowsSort.field,
        sortOrder: rowsSort.order,
        filters: rowsFilters,
        mode: rowsMode
      }
    })
  });
  const domainsSort = toSort(
    sort,
    order,
    referringDomainsSortFieldSchema.options,
    BACKLINKS_DEFAULT_SORT.domains
  );
  const domainsFilters = reactExports.useMemo(
    () => toReferringDomainsFiltersPayload(filters.domains.values),
    [filters.domains.values]
  );
  const referringDomainsQuery = useQuery({
    queryKey: [
      "backlinksReferringDomains",
      ...baseQueryKeyParts,
      page,
      pageSize,
      domainsSort.field,
      domainsSort.order,
      domainsFilters
    ],
    enabled: targetReady && tab === "domains",
    staleTime: BACKLINKS_QUERY_STALE_TIME_MS,
    queryFn: () => getBacklinksReferringDomains({
      data: {
        ...pageInputBase,
        sortField: domainsSort.field,
        sortOrder: domainsSort.order,
        filters: domainsFilters
      }
    })
  });
  const pagesSort = toSort(
    sort,
    order,
    topPagesSortFieldSchema.options,
    BACKLINKS_DEFAULT_SORT.pages
  );
  const pagesFilters = reactExports.useMemo(
    () => toTopPagesFiltersPayload(filters.pages.values),
    [filters.pages.values]
  );
  const topPagesQuery = useQuery({
    queryKey: [
      "backlinksTopPages",
      ...baseQueryKeyParts,
      page,
      pageSize,
      pagesSort.field,
      pagesSort.order,
      pagesFilters
    ],
    enabled: targetReady && tab === "pages",
    staleTime: BACKLINKS_QUERY_STALE_TIME_MS,
    queryFn: () => getBacklinksTopPages({
      data: {
        ...pageInputBase,
        sortField: pagesSort.field,
        sortOrder: pagesSort.order,
        filters: pagesFilters
      }
    })
  });
  const overviewErrorMessage = getBacklinksErrorMessage(
    overviewQuery.error,
    "Could not load backlinks data."
  );
  const activeTabQuery = tab === "backlinks" ? rowsQuery : tab === "domains" ? referringDomainsQuery : topPagesQuery;
  const activeTabErrorMessage = getBacklinksErrorMessage(
    activeTabQuery.error,
    "Could not load this tab."
  );
  return {
    activeTabErrorMessage,
    activeTabQuery,
    overviewErrorMessage,
    overviewQuery,
    referringDomainsQuery,
    rowsQuery,
    searchCardInitialValues,
    topPagesQuery
  };
}
function navigateToBacklinksSearch(navigate, values) {
  navigate({
    search: (prev) => ({
      ...prev,
      target: values.target,
      scope: getPersistedBacklinksSearchScope(values.target, values.scope),
      tab: void 0,
      page: void 0,
      sort: void 0,
      order: void 0
    }),
    replace: true
  });
}
const DOMAIN_LINKS_PAGE_SIZE = 100;
const DOMAIN_LINKS_STALE_TIME_MS = 5 * 60 * 1e3;
function useBacklinksDomainExpansion({
  projectId,
  searchState
}) {
  const { target, scope } = searchState;
  const [expanded, setExpanded] = reactExports.useState([]);
  reactExports.useEffect(() => {
    setExpanded([]);
  }, [projectId, target, scope]);
  const queries = useQueries({
    queries: expanded.map((domain) => ({
      queryKey: [
        "backlinksDomainLinks",
        projectId,
        scope,
        target,
        domain
      ],
      staleTime: DOMAIN_LINKS_STALE_TIME_MS,
      queryFn: () => getBacklinksRows({
        data: {
          projectId,
          target,
          scope,
          page: 1,
          pageSize: DOMAIN_LINKS_PAGE_SIZE,
          sortField: "rank",
          sortOrder: "desc",
          filters: { domainFrom: domain },
          mode: "as_is"
        }
      })
    }))
  });
  const entriesByDomain = reactExports.useMemo(() => {
    const map = {};
    expanded.forEach((domain, index) => {
      const query = queries[index];
      if (!query) return;
      map[domain] = query.data ? { status: "ready", rows: query.data.rows } : query.error ? { status: "error" } : { status: "loading" };
    });
    return map;
  }, [expanded, queries]);
  const expandedDomains = reactExports.useMemo(() => new Set(expanded), [expanded]);
  const toggleDomain = reactExports.useCallback((domain) => {
    setExpanded(
      (current) => current.includes(domain) ? current.filter((entry) => entry !== domain) : [...current, domain]
    );
  }, []);
  return { expandedDomains, entriesByDomain, toggleDomain };
}
const STORAGE_KEY_PREFIX = "backlinks-filters:";
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function loadFromStorage(tab, fallback) {
  const fallbackClone = { ...fallback };
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tab}`);
    if (!raw) return fallbackClone;
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return fallbackClone;
    const result = { ...fallbackClone };
    for (const key in fallback) {
      const value = parsed[key];
      if (typeof value === "string") {
        Object.assign(result, { [key]: value });
      }
    }
    if (countFilterConditions(result) > MAX_DATAFORSEO_FILTER_CONDITIONS) {
      return fallbackClone;
    }
    return result;
  } catch {
    return fallbackClone;
  }
}
function saveToStorage(tab, values) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${tab}`, JSON.stringify(values));
  } catch {
  }
}
function useTabFilters(tab, emptyValues) {
  const [values, setValues] = reactExports.useState(
    () => loadFromStorage(tab, { ...emptyValues })
  );
  const apply = reactExports.useCallback(
    (next) => {
      setValues(next);
      saveToStorage(tab, next);
    },
    [tab]
  );
  const reset = reactExports.useCallback(() => {
    apply({ ...emptyValues });
  }, [apply, emptyValues]);
  return {
    values,
    apply,
    reset,
    activeFilterCount: countActiveFilters(values)
  };
}
function useBacklinksFilters() {
  const [showFilters, setShowFilters] = reactExports.useState(false);
  const backlinks = useTabFilters(
    "backlinks",
    EMPTY_BACKLINKS_FILTERS
  );
  const domains = useTabFilters(
    "domains",
    EMPTY_REFERRING_DOMAINS_FILTERS
  );
  const pages = useTabFilters(
    "pages",
    EMPTY_TOP_PAGES_FILTERS
  );
  return {
    backlinks,
    domains,
    pages,
    showFilters,
    setShowFilters
  };
}
const MAX_HISTORY = 20;
const backlinksSearchHistoryItemSchema = object({
  target: string(),
  scope: _enum(["domain", "page"]),
  timestamp: number()
});
const backlinksSearchHistorySchema = array(backlinksSearchHistoryItemSchema);
const backlinksSearchHistoryCodec = jsonCodec(backlinksSearchHistorySchema);
function isSameSearch(a, b) {
  return a.target === b.target && a.scope === b.scope;
}
function useBacklinksSearchHistory(projectId) {
  const { history, isLoaded, addItem, removeItem } = useLocalHistoryStore({
    storageKey: `backlinks-search-history:${projectId}`,
    maxItems: MAX_HISTORY,
    parse: (raw) => {
      const parsed = backlinksSearchHistoryCodec.safeParse(raw);
      return parsed.success ? parsed.data : null;
    },
    isSameItem: isSameSearch,
    createItem: (item) => ({
      ...item,
      timestamp: Date.now()
    }),
    getItemKey: (item) => item.timestamp
  });
  return {
    history,
    isLoaded,
    addSearch: addItem,
    removeHistoryItem: removeItem
  };
}
function BacklinksPage({
  projectId,
  searchState,
  navigate
}) {
  const filters = useBacklinksFilters();
  const sorting = reactExports.useMemo(() => {
    const fallback = BACKLINKS_DEFAULT_SORT[searchState.tab];
    const field = searchState.sort ?? fallback.field;
    const order = searchState.order ?? (searchState.sort ? "desc" : fallback.order);
    return [{ id: field, desc: order === "desc" }];
  }, [searchState.order, searchState.sort, searchState.tab]);
  const handleSortingChange = reactExports.useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      navigate({
        search: (prev) => ({
          ...prev,
          sort: first?.id,
          order: first ? first.desc ? "desc" : "asc" : void 0,
          page: void 0
        }),
        replace: true
      });
    },
    [navigate, sorting]
  );
  const handlePageChange = reactExports.useCallback(
    (nextPage) => {
      navigate({
        search: (prev) => ({
          ...prev,
          page: nextPage === 1 ? void 0 : nextPage
        }),
        replace: true
      });
    },
    [navigate]
  );
  const handlePageSizeChange = reactExports.useCallback(
    (nextPageSize) => {
      navigate({
        search: (prev) => ({
          ...prev,
          size: nextPageSize === DEFAULT_BACKLINKS_PAGE_SIZE ? void 0 : nextPageSize,
          page: void 0
        }),
        replace: true
      });
    },
    [navigate]
  );
  const handleViewChange = reactExports.useCallback(
    (nextView) => {
      navigate({
        search: (prev) => ({ ...prev, view: nextView, page: void 0 }),
        replace: true
      });
    },
    [navigate]
  );
  const domainExpansion = useBacklinksDomainExpansion({
    projectId,
    searchState
  });
  const {
    activeTabErrorMessage,
    activeTabQuery,
    overviewErrorMessage,
    overviewQuery,
    referringDomainsQuery,
    rowsQuery,
    searchCardInitialValues,
    topPagesQuery
  } = useBacklinksPageData({
    projectId,
    searchState,
    filters
  });
  const {
    history,
    isLoaded: historyLoaded,
    addSearch,
    removeHistoryItem
  } = useBacklinksSearchHistory(projectId);
  const urlTabInput = reactExports.useMemo(() => {
    if (searchState.target.trim() === "") return null;
    return {
      type: "backlinks",
      target: searchState.target,
      scope: searchState.scope
    };
  }, [searchState.scope, searchState.target]);
  const navigateToTab = reactExports.useCallback(
    (input) => {
      if (input?.type !== "backlinks") {
        navigate({
          search: () => ({}),
          replace: true
        });
        return;
      }
      navigateToBacklinksSearch(navigate, {
        target: input.target,
        scope: input.scope
      });
    },
    [navigate]
  );
  const handleResultTabChange = reactExports.useCallback(
    (tab) => {
      navigate({
        search: (prev) => ({
          ...prev,
          tab: tab === "backlinks" ? void 0 : tab,
          page: void 0,
          sort: void 0,
          order: void 0
        }),
        replace: true
      });
    },
    [navigate]
  );
  const searchTabs = useSearchTabNavigation({
    storageKey: `backlinks:${projectId}`,
    urlInput: urlTabInput,
    getLabel: reactExports.useCallback(
      (input) => input.type === "backlinks" ? input.target : "",
      []
    ),
    navigateToInput: navigateToTab
  });
  const toBacklinksTabInput = reactExports.useCallback(
    (values) => ({
      type: "backlinks",
      target: values.target,
      scope: values.scope
    }),
    []
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-4 pb-24 overflow-auto md:px-6 md:py-6 md:pb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold", children: "Backlinks" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70", children: "Understand who links to a site, what changed recently, and which pages attract links." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BacklinksSearchCard,
      {
        errorMessage: overviewErrorMessage,
        initialValues: searchCardInitialValues,
        canOpenSearch: (values) => searchTabs.canOpenTab(toBacklinksTabInput(values)),
        tabLimit: searchTabs.limit,
        onSubmit: (values) => {
          searchTabs.openTab(toBacklinksTabInput(values));
          navigateToBacklinksSearch(navigate, values);
          addSearch({ target: values.target, scope: values.scope });
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BacklinksBody,
      {
        projectId,
        history,
        historyLoaded,
        overviewData: overviewQuery.data,
        overviewError: overviewErrorMessage,
        overviewLoading: overviewQuery.isLoading,
        backlinksRowsPage: rowsQuery.data,
        referringDomainsPage: referringDomainsQuery.data,
        topPagesPage: topPagesQuery.data,
        searchState,
        filters,
        sorting,
        domainExpansion,
        tabErrorMessage: activeTabErrorMessage,
        tabLoading: activeTabQuery.isLoading,
        tabFetching: activeTabQuery.isFetching,
        onPageChange: handlePageChange,
        onPageSizeChange: handlePageSizeChange,
        onRemoveHistoryItem: removeHistoryItem,
        onRetryOverview: () => void overviewQuery.refetch(),
        onSortingChange: handleSortingChange,
        onTabChange: handleResultTabChange,
        onViewChange: handleViewChange,
        searchTabs: searchState.target ? {
          activeTabId: searchTabs.activeTabId,
          tabs: searchTabs.tabs,
          onSelect: searchTabs.selectTab,
          onClose: searchTabs.closeTab,
          onViewed: searchTabs.markTabViewed
        } : null
      }
    )
  ] }) });
}
function BacklinksRoute() {
  const {
    projectId
  } = Route.useParams();
  const navigate = useNavigate({
    from: Route.fullPath
  });
  const {
    target = "",
    scope: rawScope,
    tab = "backlinks",
    page = 1,
    size = DEFAULT_BACKLINKS_PAGE_SIZE,
    sort,
    order,
    view
  } = Route.useSearch();
  const scope = rawScope ?? inferBacklinksSearchScopeFromTarget(target);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(BacklinksPage, { projectId, navigate, searchState: {
    target,
    scope,
    tab,
    page,
    pageSize: size,
    sort,
    order,
    view
  } });
}
export {
  BacklinksRoute as component
};
