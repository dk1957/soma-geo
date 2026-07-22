import { aM as reactExports, bq as autumnSeoDataCreditsToUsd, al as AUTUMN_SEO_DATA_BALANCE_FEATURE_ID, am as AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID, aN as jsxRuntimeExports, G as object, Y as number, y as createServerFn, ci as mapDataforseoPathToCreditFeature, cj as creditFeatureLabel, bs as LOW_CREDITS_THRESHOLD_USD, aU as AUTUMN_PAID_PLAN_ID, ck as AUTUMN_SEO_DATA_CREDITS_PER_USD, cl as AUTUMN_SEO_DATA_TOP_UP_PLAN_ID } from "./index-CSpjggkr.js";
import { bq as useAutumnClient, br as useQuery, bs as useAppDispatch, bt as setActiveMouseOverItemIndex, bu as mouseLeaveItem, bv as setActiveClickItemIndex, bw as isStacked, aK as isNullish, bx as getPercentValue, by as isWellBehavedNumber, bz as getStackSeriesIdentifier, bj as isNumber, af as createSelector, bA as selectChartOffsetInternal, bB as selectAxisViewBox, ag as selectChartLayout, bC as selectChartDataWithIndexesIfNotInPanoramaPosition3, bD as selectXAxisIdFromGraphicalItemId, ai as selectAxisWithScale, bE as selectYAxisIdFromGraphicalItemId, aj as selectTicksOfGraphicalItem, am as getBandSizeOfAxis, ak as selectUnfilteredCartesianItems, bF as selectRootMaxBarSize, bG as selectBarGap, bH as selectBarCategoryGap, bI as selectStackGroups, bJ as selectRootBarSize, bK as selectCartesianAxisSize, bL as getNormalizedStackId, aF as Layer, an as propsAreEqual, ao as resolveDefaultProps, ap as DefaultZIndexes, aq as useIsPanorama, ar as RegisterGraphicalItemId, as as SetLegendPayload, at as SetCartesianGraphicalItem, aE as ZIndexLayer, au as getTooltipNameProp, av as SetTooltipEntrySettings, aw as noop, ax as useNeedsClip, az as useChartLayout, bM as findAllByType, aA as useAppSelector, aI as getValueByDataKey, aB as clsx, aG as GraphicalItemClipPath, bN as getBaseValueOfBar, bO as truncateByDomain, bP as getCateCoordinateOfBar, bQ as selectActiveTooltipIndex, bR as svgPropertiesNoEventsFromUnknown, bS as adaptEventsOfChild, aL as useAnimationId, aM as JavascriptAnimate, aN as interpolate, aO as LabelListFromLabelProp, aP as CartesianLabelListContextProvider, aR as svgPropertiesNoEvents, bT as selectActiveTooltipDataKey, bU as isNan, bV as mathSign, aT as CartesianChart, aU as arrayTooltipSearcher, bW as CartesianGrid, bX as XAxis, bY as YAxis, bZ as Tooltip, p as createSsrRpc, s as useQuery$1, u as useSession, z as useCustomer, B as getCustomerPlanStatus, x as getStandardErrorMessage } from "./router-8qflvY1T.js";
import { b as getBillingRouteState, a as getStoredRedditAttribution, c as captureRedditConversionEvent } from "./redditConversions-CQtLmZwg.js";
import { a as Shape, S as SetErrorBarContext } from "./ErrorBarContext-Bz51l0Tj.js";
import { a as requireAuthenticatedContext } from "./middleware-CNUfdy2z.js";
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
import "./reddit-attribution-BMckpR6i.js";
var useAggregateEvents = (params) => {
  const client = useAutumnClient({ caller: "useAggregateEvents" });
  const { queryOptions, customRange, ...restParams } = params;
  const startDate = customRange?.start ? new Date(customRange.start).toISOString().slice(0, 13) : void 0;
  const endDate = customRange?.end ? new Date(customRange.end).toISOString().slice(0, 13) : void 0;
  const query = useQuery({
    queryKey: [
      "autumn",
      "events",
      "aggregate",
      restParams.featureId,
      restParams.groupBy,
      restParams.range,
      restParams.binSize,
      startDate,
      endDate
    ],
    queryFn: () => client.aggregateEvents({
      ...restParams,
      customRange
    }),
    ...queryOptions
  });
  return reactExports.useMemo(
    () => ({
      ...query,
      list: query.data?.list,
      total: query.data?.total
    }),
    [query]
  );
};
var Cell = (_props) => null;
Cell.displayName = "Cell";
var useMouseEnterItemDispatch = (onMouseEnterFromProps, dataKey, graphicalItemId) => {
  var dispatch = useAppDispatch();
  return (data, index) => (event) => {
    onMouseEnterFromProps === null || onMouseEnterFromProps === void 0 || onMouseEnterFromProps(data, index, event);
    dispatch(setActiveMouseOverItemIndex({
      activeIndex: String(index),
      activeDataKey: dataKey,
      activeCoordinate: data.tooltipPosition,
      activeGraphicalItemId: graphicalItemId
    }));
  };
};
var useMouseLeaveItemDispatch = (onMouseLeaveFromProps) => {
  var dispatch = useAppDispatch();
  return (data, index) => (event) => {
    onMouseLeaveFromProps === null || onMouseLeaveFromProps === void 0 || onMouseLeaveFromProps(data, index, event);
    dispatch(mouseLeaveItem());
  };
};
var useMouseClickItemDispatch = (onMouseClickFromProps, dataKey, graphicalItemId) => {
  var dispatch = useAppDispatch();
  return (data, index) => (event) => {
    onMouseClickFromProps === null || onMouseClickFromProps === void 0 || onMouseClickFromProps(data, index, event);
    dispatch(setActiveClickItemIndex({
      activeIndex: String(index),
      activeDataKey: dataKey,
      activeCoordinate: data.tooltipPosition,
      activeGraphicalItemId: graphicalItemId
    }));
  };
};
var getBarSize = (globalSize, totalSize, selfSize) => {
  var barSize = selfSize !== null && selfSize !== void 0 ? selfSize : globalSize;
  if (isNullish(barSize)) {
    return void 0;
  }
  return getPercentValue(barSize, totalSize, 0);
};
var combineBarSizeList = (allBars, globalSize, totalSize) => {
  var initialValue = {};
  var stackedBars = allBars.filter(isStacked);
  var unstackedBars = allBars.filter((b) => b.stackId == null);
  var groupByStack = stackedBars.reduce((acc, bar) => {
    var s = acc[bar.stackId];
    if (s == null) {
      s = [];
    }
    s.push(bar);
    acc[bar.stackId] = s;
    return acc;
  }, initialValue);
  var stackedSizeList = Object.entries(groupByStack).map((_ref) => {
    var _bars$;
    var [stackId, bars] = _ref;
    var dataKeys = bars.map((b) => b.dataKey);
    var barSize = getBarSize(globalSize, totalSize, (_bars$ = bars[0]) === null || _bars$ === void 0 ? void 0 : _bars$.barSize);
    return {
      stackId,
      dataKeys,
      barSize
    };
  });
  var unstackedSizeList = unstackedBars.map((b) => {
    var dataKeys = [b.dataKey].filter((dk) => dk != null);
    var barSize = getBarSize(globalSize, totalSize, b.barSize);
    return {
      stackId: void 0,
      dataKeys,
      barSize
    };
  });
  return [...stackedSizeList, ...unstackedSizeList];
};
function ownKeys$1(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$1(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$1(Object(t), true).forEach(function(r2) {
      _defineProperty$1(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$1(e, r, t) {
  return (r = _toPropertyKey$1(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$1(t) {
  var i = _toPrimitive$1(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$1(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function getBarPositions(barGap, barCategoryGap, bandSize, sizeList, maxBarSize) {
  var _sizeList$;
  var len = sizeList.length;
  if (len < 1) {
    return void 0;
  }
  var realBarGap = getPercentValue(barGap, bandSize, 0, true);
  var result;
  var initialValue = [];
  if (isWellBehavedNumber((_sizeList$ = sizeList[0]) === null || _sizeList$ === void 0 ? void 0 : _sizeList$.barSize)) {
    var useFull = false;
    var fullBarSize = bandSize / len;
    var sum = sizeList.reduce((res, entry) => res + (entry.barSize || 0), 0);
    sum += (len - 1) * realBarGap;
    if (sum >= bandSize) {
      sum -= (len - 1) * realBarGap;
      realBarGap = 0;
    }
    if (sum >= bandSize && fullBarSize > 0) {
      useFull = true;
      fullBarSize *= 0.9;
      sum = len * fullBarSize;
    }
    var offset = (bandSize - sum) / 2 >> 0;
    var prev = {
      offset: offset - realBarGap,
      size: 0
    };
    result = sizeList.reduce((res, entry) => {
      var _entry$barSize;
      var newPosition = {
        stackId: entry.stackId,
        dataKeys: entry.dataKeys,
        position: {
          offset: prev.offset + prev.size + realBarGap,
          size: useFull ? fullBarSize : (_entry$barSize = entry.barSize) !== null && _entry$barSize !== void 0 ? _entry$barSize : 0
        }
      };
      var newRes = [...res, newPosition];
      prev = newPosition.position;
      return newRes;
    }, initialValue);
  } else {
    var _offset = getPercentValue(barCategoryGap, bandSize, 0, true);
    if (bandSize - 2 * _offset - (len - 1) * realBarGap <= 0) {
      realBarGap = 0;
    }
    var originalSize = (bandSize - 2 * _offset - (len - 1) * realBarGap) / len;
    if (originalSize > 1) {
      originalSize >>= 0;
    }
    var size = isWellBehavedNumber(maxBarSize) ? Math.min(originalSize, maxBarSize) : originalSize;
    result = sizeList.reduce((res, entry, i) => [...res, {
      stackId: entry.stackId,
      dataKeys: entry.dataKeys,
      position: {
        offset: _offset + (originalSize + realBarGap) * i + (originalSize - size) / 2,
        size
      }
    }], initialValue);
  }
  return result;
}
var combineAllBarPositions = (sizeList, globalMaxBarSize, barGap, barCategoryGap, barBandSize, bandSize, childMaxBarSize) => {
  var maxBarSize = isNullish(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize;
  var allBarPositions = getBarPositions(barGap, barCategoryGap, barBandSize !== bandSize ? barBandSize : bandSize, sizeList, maxBarSize);
  if (barBandSize !== bandSize && allBarPositions != null) {
    allBarPositions = allBarPositions.map((pos) => _objectSpread$1(_objectSpread$1({}, pos), {}, {
      position: _objectSpread$1(_objectSpread$1({}, pos.position), {}, {
        offset: pos.position.offset - barBandSize / 2
      })
    }));
  }
  return allBarPositions;
};
var combineStackedData = (stackGroups, barSettings) => {
  var stackSeriesIdentifier = getStackSeriesIdentifier(barSettings);
  if (!stackGroups || stackSeriesIdentifier == null || barSettings == null) {
    return void 0;
  }
  var {
    stackId
  } = barSettings;
  if (stackId == null) {
    return void 0;
  }
  var stackGroup = stackGroups[stackId];
  if (!stackGroup) {
    return void 0;
  }
  var {
    stackedData
  } = stackGroup;
  if (!stackedData) {
    return void 0;
  }
  return stackedData.find((sd) => sd.key === stackSeriesIdentifier);
};
var combineBarPosition = (allBarPositions, barSettings) => {
  if (allBarPositions == null || barSettings == null) {
    return void 0;
  }
  var position = allBarPositions.find((p) => p.stackId === barSettings.stackId && barSettings.dataKey != null && p.dataKeys.includes(barSettings.dataKey));
  if (position == null) {
    return void 0;
  }
  return position.position;
};
function getZIndexFromUnknown(input, defaultZIndex) {
  if (input && typeof input === "object" && "zIndex" in input && typeof input.zIndex === "number" && isWellBehavedNumber(input.zIndex)) {
    return input.zIndex;
  }
  return defaultZIndex;
}
var prefix = "Invariant failed";
function invariant(condition, message) {
  {
    throw new Error(prefix);
  }
}
function _extends$2() {
  return _extends$2 = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$2.apply(null, arguments);
}
function BarRectangle(props) {
  return /* @__PURE__ */ reactExports.createElement(Shape, _extends$2({
    shapeType: "rectangle",
    activeClassName: "recharts-active-bar"
  }, props));
}
var minPointSizeCallback = function minPointSizeCallback2(minPointSize) {
  var defaultValue = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
  return (value, index) => {
    if (isNumber(minPointSize)) return minPointSize;
    var isValueNumberOrNil = isNumber(value) || isNullish(value);
    if (isValueNumberOrNil) {
      return minPointSize(value, index);
    }
    !isValueNumberOrNil ? invariant() : void 0;
    return defaultValue;
  };
};
var pickIsPanorama = (_state, _id, isPanorama) => isPanorama;
var pickBarId = (_state, id) => id;
var selectSynchronisedBarSettings = createSelector([selectUnfilteredCartesianItems, pickBarId], (graphicalItems, id) => graphicalItems.filter((item) => item.type === "bar").find((item) => item.id === id));
var selectMaxBarSize = createSelector([selectSynchronisedBarSettings], (barSettings) => barSettings === null || barSettings === void 0 ? void 0 : barSettings.maxBarSize);
var pickCells = (_state, _id, _isPanorama, cells) => cells;
var selectAllVisibleBars = createSelector([selectChartLayout, selectUnfilteredCartesianItems, selectXAxisIdFromGraphicalItemId, selectYAxisIdFromGraphicalItemId, pickIsPanorama], (layout, allItems, xAxisId, yAxisId, isPanorama) => allItems.filter((i) => {
  if (layout === "horizontal") {
    return i.xAxisId === xAxisId;
  }
  return i.yAxisId === yAxisId;
}).filter((i) => i.isPanorama === isPanorama).filter((i) => i.hide === false).filter((i) => i.type === "bar"));
var selectBarStackGroups = (state, id, isPanorama) => {
  var layout = selectChartLayout(state);
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null || yAxisId == null) {
    return void 0;
  }
  if (layout === "horizontal") {
    return selectStackGroups(state, "yAxis", yAxisId, isPanorama);
  }
  return selectStackGroups(state, "xAxis", xAxisId, isPanorama);
};
var selectBarCartesianAxisSize = (state, id) => {
  var layout = selectChartLayout(state);
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null || yAxisId == null) {
    return void 0;
  }
  if (layout === "horizontal") {
    return selectCartesianAxisSize(state, "xAxis", xAxisId);
  }
  return selectCartesianAxisSize(state, "yAxis", yAxisId);
};
var selectBarSizeList = createSelector([selectAllVisibleBars, selectRootBarSize, selectBarCartesianAxisSize], combineBarSizeList);
var selectBarBandSize = (state, id, isPanorama) => {
  var _ref, _getBandSizeOfAxis;
  var barSettings = selectSynchronisedBarSettings(state, id);
  if (barSettings == null) {
    return 0;
  }
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null || yAxisId == null) {
    return 0;
  }
  var layout = selectChartLayout(state);
  var globalMaxBarSize = selectRootMaxBarSize(state);
  var {
    maxBarSize: childMaxBarSize
  } = barSettings;
  var maxBarSize = isNullish(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize;
  var axis, ticks;
  if (layout === "horizontal") {
    axis = selectAxisWithScale(state, "xAxis", xAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, "xAxis", xAxisId, isPanorama);
  } else {
    axis = selectAxisWithScale(state, "yAxis", yAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, "yAxis", yAxisId, isPanorama);
  }
  return (_ref = (_getBandSizeOfAxis = getBandSizeOfAxis(axis, ticks, true)) !== null && _getBandSizeOfAxis !== void 0 ? _getBandSizeOfAxis : maxBarSize) !== null && _ref !== void 0 ? _ref : 0;
};
var selectAxisBandSize = (state, id, isPanorama) => {
  var layout = selectChartLayout(state);
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null || yAxisId == null) {
    return void 0;
  }
  var axis, ticks;
  if (layout === "horizontal") {
    axis = selectAxisWithScale(state, "xAxis", xAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, "xAxis", xAxisId, isPanorama);
  } else {
    axis = selectAxisWithScale(state, "yAxis", yAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, "yAxis", yAxisId, isPanorama);
  }
  return getBandSizeOfAxis(axis, ticks);
};
var selectAllBarPositions = createSelector([selectBarSizeList, selectRootMaxBarSize, selectBarGap, selectBarCategoryGap, selectBarBandSize, selectAxisBandSize, selectMaxBarSize], combineAllBarPositions);
var selectXAxisWithScale = (state, id, isPanorama) => {
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null) {
    return void 0;
  }
  return selectAxisWithScale(state, "xAxis", xAxisId, isPanorama);
};
var selectYAxisWithScale = (state, id, isPanorama) => {
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (yAxisId == null) {
    return void 0;
  }
  return selectAxisWithScale(state, "yAxis", yAxisId, isPanorama);
};
var selectXAxisTicks = (state, id, isPanorama) => {
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null) {
    return void 0;
  }
  return selectTicksOfGraphicalItem(state, "xAxis", xAxisId, isPanorama);
};
var selectYAxisTicks = (state, id, isPanorama) => {
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (yAxisId == null) {
    return void 0;
  }
  return selectTicksOfGraphicalItem(state, "yAxis", yAxisId, isPanorama);
};
var selectBarPosition = createSelector([selectAllBarPositions, selectSynchronisedBarSettings], combineBarPosition);
var selectStackedDataOfItem = createSelector([selectBarStackGroups, selectSynchronisedBarSettings], combineStackedData);
var selectBarRectangles = createSelector([selectChartOffsetInternal, selectAxisViewBox, selectXAxisWithScale, selectYAxisWithScale, selectXAxisTicks, selectYAxisTicks, selectBarPosition, selectChartLayout, selectChartDataWithIndexesIfNotInPanoramaPosition3, selectAxisBandSize, selectStackedDataOfItem, selectSynchronisedBarSettings, pickCells], (offset, axisViewBox, xAxis, yAxis, xAxisTicks, yAxisTicks, pos, layout, _ref2, bandSize, stackedData, barSettings, cells) => {
  var {
    chartData,
    dataStartIndex,
    dataEndIndex
  } = _ref2;
  if (barSettings == null || pos == null || axisViewBox == null || layout !== "horizontal" && layout !== "vertical" || xAxis == null || yAxis == null || xAxisTicks == null || yAxisTicks == null || bandSize == null) {
    return void 0;
  }
  var {
    data
  } = barSettings;
  var displayedData;
  if (data != null && data.length > 0) {
    displayedData = data;
  } else {
    displayedData = chartData === null || chartData === void 0 ? void 0 : chartData.slice(dataStartIndex, dataEndIndex + 1);
  }
  if (displayedData == null) {
    return void 0;
  }
  return computeBarRectangles({
    layout,
    barSettings,
    pos,
    parentViewBox: axisViewBox,
    bandSize,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    stackedData,
    displayedData,
    offset,
    cells,
    dataStartIndex
  });
});
var _excluded$1 = ["index"];
function _extends$1() {
  return _extends$1 = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$1.apply(null, arguments);
}
function _objectWithoutProperties$1(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose$1(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose$1(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
var BarStackContext = /* @__PURE__ */ reactExports.createContext(void 0);
var useStackId = (childStackId) => {
  var stackSettings = reactExports.useContext(BarStackContext);
  if (stackSettings != null) {
    return stackSettings.stackId;
  }
  if (childStackId == null) {
    return void 0;
  }
  return getNormalizedStackId(childStackId);
};
var getClipPathId = (stackId, index) => {
  return "recharts-bar-stack-clip-path-".concat(stackId, "-").concat(index);
};
var useBarStackClipPathUrl = (index) => {
  var barStackContext = reactExports.useContext(BarStackContext);
  if (barStackContext == null) {
    return void 0;
  }
  var {
    stackId
  } = barStackContext;
  return "url(#".concat(getClipPathId(stackId, index), ")");
};
var BarStackClipLayer = (_ref) => {
  var {
    index
  } = _ref, rest = _objectWithoutProperties$1(_ref, _excluded$1);
  var clipPathUrl = useBarStackClipPathUrl(index);
  return /* @__PURE__ */ reactExports.createElement(Layer, _extends$1({
    className: "recharts-bar-stack-layer",
    clipPath: clipPathUrl
  }, rest));
};
var _excluded = ["onMouseEnter", "onMouseLeave", "onClick"], _excluded2 = ["value", "background", "tooltipPosition"], _excluded3 = ["id"], _excluded4 = ["onMouseEnter", "onClick", "onMouseLeave"];
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
var computeLegendPayloadFromBarData = (props) => {
  var {
    dataKey,
    name,
    fill,
    legendType,
    hide
  } = props;
  return [{
    inactive: hide,
    dataKey,
    type: legendType,
    color: fill,
    value: getTooltipNameProp(name, dataKey),
    payload: props
  }];
};
var SetBarTooltipEntrySettings = /* @__PURE__ */ reactExports.memo((_ref) => {
  var {
    dataKey,
    stroke,
    strokeWidth,
    fill,
    name,
    hide,
    unit,
    tooltipType,
    id
  } = _ref;
  var tooltipEntrySettings = {
    dataDefinedOnItem: void 0,
    getPosition: noop,
    settings: {
      stroke,
      strokeWidth,
      fill,
      dataKey,
      nameKey: void 0,
      name: getTooltipNameProp(name, dataKey),
      hide,
      type: tooltipType,
      color: fill,
      unit,
      graphicalItemId: id
    }
  };
  return /* @__PURE__ */ reactExports.createElement(SetTooltipEntrySettings, {
    tooltipEntrySettings
  });
});
function BarBackground(props) {
  var activeIndex = useAppSelector(selectActiveTooltipIndex);
  var {
    data,
    dataKey,
    background: backgroundFromProps,
    allOtherBarProps
  } = props;
  var {
    onMouseEnter: onMouseEnterFromProps,
    onMouseLeave: onMouseLeaveFromProps,
    onClick: onItemClickFromProps
  } = allOtherBarProps, restOfAllOtherProps = _objectWithoutProperties(allOtherBarProps, _excluded);
  var onMouseEnterFromContext = useMouseEnterItemDispatch(onMouseEnterFromProps, dataKey, allOtherBarProps.id);
  var onMouseLeaveFromContext = useMouseLeaveItemDispatch(onMouseLeaveFromProps);
  var onClickFromContext = useMouseClickItemDispatch(onItemClickFromProps, dataKey, allOtherBarProps.id);
  if (!backgroundFromProps || data == null) {
    return null;
  }
  var backgroundProps = svgPropertiesNoEventsFromUnknown(backgroundFromProps);
  return /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
    zIndex: getZIndexFromUnknown(backgroundFromProps, DefaultZIndexes.barBackground)
  }, data.map((entry, i) => {
    var {
      value,
      background: backgroundFromDataEntry,
      tooltipPosition
    } = entry, rest = _objectWithoutProperties(entry, _excluded2);
    if (!backgroundFromDataEntry) {
      return null;
    }
    var onMouseEnter = onMouseEnterFromContext(entry, i);
    var onMouseLeave = onMouseLeaveFromContext(entry, i);
    var onClick = onClickFromContext(entry, i);
    var barRectangleProps = _objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread({
      option: backgroundFromProps,
      isActive: String(i) === activeIndex
    }, rest), {}, {
      // @ts-expect-error backgroundProps is contributing unknown props
      fill: "#eee"
    }, backgroundFromDataEntry), backgroundProps), adaptEventsOfChild(restOfAllOtherProps, entry, i)), {}, {
      onMouseEnter,
      onMouseLeave,
      onClick,
      dataKey,
      index: i,
      className: "recharts-bar-background-rectangle"
    });
    return /* @__PURE__ */ reactExports.createElement(BarRectangle, _extends({
      key: "background-bar-".concat(i)
    }, barRectangleProps));
  }));
}
function BarLabelListProvider(_ref2) {
  var {
    showLabels,
    children,
    rects
  } = _ref2;
  var labelListEntries = rects === null || rects === void 0 ? void 0 : rects.map((entry) => {
    var viewBox = {
      x: entry.x,
      y: entry.y,
      width: entry.width,
      lowerWidth: entry.width,
      upperWidth: entry.width,
      height: entry.height
    };
    return _objectSpread(_objectSpread({}, viewBox), {}, {
      value: entry.value,
      payload: entry.payload,
      parentViewBox: entry.parentViewBox,
      viewBox,
      fill: entry.fill
    });
  });
  return /* @__PURE__ */ reactExports.createElement(CartesianLabelListContextProvider, {
    value: showLabels ? labelListEntries : void 0
  }, children);
}
function BarRectangleWithActiveState(props) {
  var {
    shape,
    activeBar,
    baseProps,
    entry,
    index,
    dataKey
  } = props;
  var activeIndex = useAppSelector(selectActiveTooltipIndex);
  var activeDataKey = useAppSelector(selectActiveTooltipDataKey);
  var isActive = activeBar && String(index) === activeIndex && (activeDataKey == null || dataKey === activeDataKey);
  var option = isActive ? activeBar : shape;
  if (isActive) {
    return /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
      zIndex: DefaultZIndexes.activeBar
    }, /* @__PURE__ */ reactExports.createElement(BarStackClipLayer, {
      index
    }, /* @__PURE__ */ reactExports.createElement(BarRectangle, _extends({}, baseProps, {
      name: String(baseProps.name)
    }, entry, {
      isActive,
      option,
      index,
      dataKey
    }))));
  }
  return /* @__PURE__ */ reactExports.createElement(BarRectangle, _extends({}, baseProps, {
    name: String(baseProps.name)
  }, entry, {
    isActive,
    option,
    index,
    dataKey
  }));
}
function BarRectangleNeverActive(props) {
  var {
    shape,
    baseProps,
    entry,
    index,
    dataKey
  } = props;
  return /* @__PURE__ */ reactExports.createElement(BarRectangle, _extends({}, baseProps, {
    name: String(baseProps.name)
  }, entry, {
    isActive: false,
    option: shape,
    index,
    dataKey
  }));
}
function BarRectangles(_ref3) {
  var _svgPropertiesNoEvent;
  var {
    data,
    props
  } = _ref3;
  var _ref4 = (_svgPropertiesNoEvent = svgPropertiesNoEvents(props)) !== null && _svgPropertiesNoEvent !== void 0 ? _svgPropertiesNoEvent : {}, {
    id
  } = _ref4, baseProps = _objectWithoutProperties(_ref4, _excluded3);
  var {
    shape,
    dataKey,
    activeBar
  } = props;
  var {
    onMouseEnter: onMouseEnterFromProps,
    onClick: onItemClickFromProps,
    onMouseLeave: onMouseLeaveFromProps
  } = props, restOfAllOtherProps = _objectWithoutProperties(props, _excluded4);
  var onMouseEnterFromContext = useMouseEnterItemDispatch(onMouseEnterFromProps, dataKey, id);
  var onMouseLeaveFromContext = useMouseLeaveItemDispatch(onMouseLeaveFromProps);
  var onClickFromContext = useMouseClickItemDispatch(onItemClickFromProps, dataKey, id);
  if (!data) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, data.map((entry, i) => {
    return /* @__PURE__ */ reactExports.createElement(BarStackClipLayer, _extends({
      index: i,
      key: "rectangle-".concat(entry === null || entry === void 0 ? void 0 : entry.x, "-").concat(entry === null || entry === void 0 ? void 0 : entry.y, "-").concat(entry === null || entry === void 0 ? void 0 : entry.value, "-").concat(i),
      className: "recharts-bar-rectangle"
    }, adaptEventsOfChild(restOfAllOtherProps, entry, i), {
      // @ts-expect-error BarRectangleItem type definition says it's missing properties, but I can see them present in debugger!
      onMouseEnter: onMouseEnterFromContext(entry, i),
      onMouseLeave: onMouseLeaveFromContext(entry, i),
      onClick: onClickFromContext(entry, i)
    }), activeBar ? /* @__PURE__ */ reactExports.createElement(BarRectangleWithActiveState, {
      shape,
      activeBar,
      baseProps,
      entry,
      index: i,
      dataKey
    }) : (
      /*
       * If the `activeBar` prop is falsy, then let's call the variant without hooks.
       * Using the `selectActiveTooltipIndex` selector is usually fast
       * but in charts with large-ish amount of data even the few nanoseconds add up to a noticeable jank.
       * If the activeBar is false then we don't need to know which index is active - because we won't use it anyway.
       * So let's just skip the hooks altogether. That way, React can skip rendering the component,
       * and can skip the tree reconciliation for its children too.
       * Because we can't call hooks conditionally, we need to have a separate component for that.
       */
      /* @__PURE__ */ reactExports.createElement(BarRectangleNeverActive, {
        shape,
        baseProps,
        entry,
        index: i,
        dataKey
      })
    ));
  }));
}
function RectanglesWithAnimation(_ref5) {
  var {
    props,
    previousRectanglesRef
  } = _ref5;
  var {
    data,
    layout,
    isAnimationActive,
    animationBegin,
    animationDuration,
    animationEasing,
    onAnimationEnd,
    onAnimationStart
  } = props;
  var prevData = previousRectanglesRef.current;
  var animationId = useAnimationId(props, "recharts-bar-");
  var [isAnimating, setIsAnimating] = reactExports.useState(false);
  var showLabels = !isAnimating;
  var handleAnimationEnd = reactExports.useCallback(() => {
    if (typeof onAnimationEnd === "function") {
      onAnimationEnd();
    }
    setIsAnimating(false);
  }, [onAnimationEnd]);
  var handleAnimationStart = reactExports.useCallback(() => {
    if (typeof onAnimationStart === "function") {
      onAnimationStart();
    }
    setIsAnimating(true);
  }, [onAnimationStart]);
  return /* @__PURE__ */ reactExports.createElement(BarLabelListProvider, {
    showLabels,
    rects: data
  }, /* @__PURE__ */ reactExports.createElement(JavascriptAnimate, {
    animationId,
    begin: animationBegin,
    duration: animationDuration,
    isActive: isAnimationActive,
    easing: animationEasing,
    onAnimationEnd: handleAnimationEnd,
    onAnimationStart: handleAnimationStart,
    key: animationId
  }, (t) => {
    var stepData = t === 1 ? data : data === null || data === void 0 ? void 0 : data.map((entry, index) => {
      var prev = prevData && prevData[index];
      if (prev) {
        return _objectSpread(_objectSpread({}, entry), {}, {
          x: interpolate(prev.x, entry.x, t),
          y: interpolate(prev.y, entry.y, t),
          width: interpolate(prev.width, entry.width, t),
          height: interpolate(prev.height, entry.height, t)
        });
      }
      if (layout === "horizontal") {
        var height = interpolate(0, entry.height, t);
        var y = interpolate(entry.stackedBarStart, entry.y, t);
        return _objectSpread(_objectSpread({}, entry), {}, {
          y,
          height
        });
      }
      var w = interpolate(0, entry.width, t);
      var x = interpolate(entry.stackedBarStart, entry.x, t);
      return _objectSpread(_objectSpread({}, entry), {}, {
        width: w,
        x
      });
    });
    if (t > 0) {
      previousRectanglesRef.current = stepData !== null && stepData !== void 0 ? stepData : null;
    }
    if (stepData == null) {
      return null;
    }
    return /* @__PURE__ */ reactExports.createElement(Layer, null, /* @__PURE__ */ reactExports.createElement(BarRectangles, {
      props,
      data: stepData
    }));
  }), /* @__PURE__ */ reactExports.createElement(LabelListFromLabelProp, {
    label: props.label
  }), props.children);
}
function RenderRectangles(props) {
  var previousRectanglesRef = reactExports.useRef(null);
  return /* @__PURE__ */ reactExports.createElement(RectanglesWithAnimation, {
    previousRectanglesRef,
    props
  });
}
var defaultMinPointSize = 0;
var errorBarDataPointFormatter = (dataPoint, dataKey) => {
  var value = Array.isArray(dataPoint.value) ? dataPoint.value[1] : dataPoint.value;
  return {
    x: dataPoint.x,
    y: dataPoint.y,
    value,
    // @ts-expect-error getValueByDataKey does not validate the output type
    errorVal: getValueByDataKey(dataPoint, dataKey)
  };
};
class BarWithState extends reactExports.PureComponent {
  render() {
    var {
      hide,
      data,
      dataKey,
      className,
      xAxisId,
      yAxisId,
      needClip,
      background,
      id
    } = this.props;
    if (hide || data == null) {
      return null;
    }
    var layerClass = clsx("recharts-bar", className);
    var clipPathId = id;
    return /* @__PURE__ */ reactExports.createElement(Layer, {
      className: layerClass,
      id
    }, needClip && /* @__PURE__ */ reactExports.createElement("defs", null, /* @__PURE__ */ reactExports.createElement(GraphicalItemClipPath, {
      clipPathId,
      xAxisId,
      yAxisId
    })), /* @__PURE__ */ reactExports.createElement(Layer, {
      className: "recharts-bar-rectangles",
      clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : void 0
    }, /* @__PURE__ */ reactExports.createElement(BarBackground, {
      data,
      dataKey,
      background,
      allOtherBarProps: this.props
    }), /* @__PURE__ */ reactExports.createElement(RenderRectangles, this.props)));
  }
}
var defaultBarProps = {
  activeBar: false,
  animationBegin: 0,
  animationDuration: 400,
  animationEasing: "ease",
  background: false,
  hide: false,
  isAnimationActive: "auto",
  label: false,
  legendType: "rect",
  minPointSize: defaultMinPointSize,
  xAxisId: 0,
  yAxisId: 0,
  zIndex: DefaultZIndexes.bar
};
function BarImpl(props) {
  var {
    xAxisId,
    yAxisId,
    hide,
    legendType,
    minPointSize,
    activeBar,
    animationBegin,
    animationDuration,
    animationEasing,
    isAnimationActive
  } = props;
  var {
    needClip
  } = useNeedsClip(xAxisId, yAxisId);
  var layout = useChartLayout();
  var isPanorama = useIsPanorama();
  var cells = findAllByType(props.children, Cell);
  var rects = useAppSelector((state) => selectBarRectangles(state, props.id, isPanorama, cells));
  if (layout !== "vertical" && layout !== "horizontal") {
    return null;
  }
  var errorBarOffset;
  var firstDataPoint = rects === null || rects === void 0 ? void 0 : rects[0];
  if (firstDataPoint == null || firstDataPoint.height == null || firstDataPoint.width == null) {
    errorBarOffset = 0;
  } else {
    errorBarOffset = layout === "vertical" ? firstDataPoint.height / 2 : firstDataPoint.width / 2;
  }
  return /* @__PURE__ */ reactExports.createElement(SetErrorBarContext, {
    xAxisId,
    yAxisId,
    data: rects,
    dataPointFormatter: errorBarDataPointFormatter,
    errorBarOffset
  }, /* @__PURE__ */ reactExports.createElement(BarWithState, _extends({}, props, {
    layout,
    needClip,
    data: rects,
    xAxisId,
    yAxisId,
    hide,
    legendType,
    minPointSize,
    activeBar,
    animationBegin,
    animationDuration,
    animationEasing,
    isAnimationActive
  })));
}
function computeBarRectangles(_ref6) {
  var {
    layout,
    barSettings: {
      dataKey,
      minPointSize: minPointSizeProp
    },
    pos,
    bandSize,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    stackedData,
    displayedData,
    offset,
    cells,
    parentViewBox,
    dataStartIndex
  } = _ref6;
  var numericAxis = layout === "horizontal" ? yAxis : xAxis;
  var stackedDomain = stackedData ? numericAxis.scale.domain() : null;
  var baseValue = getBaseValueOfBar({
    numericAxis
  });
  var stackedBarStart = numericAxis.scale.map(baseValue);
  return displayedData.map((entry, index) => {
    var value, x, y, width, height, background;
    if (stackedData) {
      var untruncatedValue = stackedData[index + dataStartIndex];
      if (untruncatedValue == null) {
        return null;
      }
      value = truncateByDomain(untruncatedValue, stackedDomain);
    } else {
      value = getValueByDataKey(entry, dataKey);
      if (!Array.isArray(value)) {
        value = [baseValue, value];
      }
    }
    var minPointSize = minPointSizeCallback(minPointSizeProp, defaultMinPointSize)(value[1], index);
    if (layout === "horizontal") {
      var _ref7;
      var baseValueScale = yAxis.scale.map(value[0]);
      var currentValueScale = yAxis.scale.map(value[1]);
      if (baseValueScale == null || currentValueScale == null) {
        return null;
      }
      x = getCateCoordinateOfBar({
        axis: xAxis,
        ticks: xAxisTicks,
        bandSize,
        offset: pos.offset,
        entry,
        index
      });
      y = (_ref7 = currentValueScale !== null && currentValueScale !== void 0 ? currentValueScale : baseValueScale) !== null && _ref7 !== void 0 ? _ref7 : void 0;
      width = pos.size;
      var computedHeight = baseValueScale - currentValueScale;
      height = isNan(computedHeight) ? 0 : computedHeight;
      background = {
        x,
        y: offset.top,
        width,
        height: offset.height
      };
      if (Math.abs(minPointSize) > 0 && Math.abs(height) < Math.abs(minPointSize)) {
        var delta = mathSign(height || minPointSize) * (Math.abs(minPointSize) - Math.abs(height));
        y -= delta;
        height += delta;
      }
    } else {
      var _baseValueScale = xAxis.scale.map(value[0]);
      var _currentValueScale = xAxis.scale.map(value[1]);
      if (_baseValueScale == null || _currentValueScale == null) {
        return null;
      }
      x = _baseValueScale;
      y = getCateCoordinateOfBar({
        axis: yAxis,
        ticks: yAxisTicks,
        bandSize,
        offset: pos.offset,
        entry,
        index
      });
      width = _currentValueScale - _baseValueScale;
      height = pos.size;
      background = {
        x: offset.left,
        y,
        width: offset.width,
        height
      };
      if (Math.abs(minPointSize) > 0 && Math.abs(width) < Math.abs(minPointSize)) {
        var _delta = mathSign(width || minPointSize) * (Math.abs(minPointSize) - Math.abs(width));
        width += _delta;
      }
    }
    if (x == null || y == null || width == null || height == null) {
      return null;
    }
    var barRectangleItem = _objectSpread(_objectSpread({}, entry), {}, {
      stackedBarStart,
      x,
      y,
      width,
      height,
      value: stackedData ? value : value[1],
      payload: entry,
      background,
      tooltipPosition: {
        x: x + width / 2,
        y: y + height / 2
      },
      parentViewBox
    }, cells && cells[index] && cells[index].props);
    return barRectangleItem;
  }).filter(Boolean);
}
function BarFn(outsideProps) {
  var props = resolveDefaultProps(outsideProps, defaultBarProps);
  var stackId = useStackId(props.stackId);
  var isPanorama = useIsPanorama();
  return /* @__PURE__ */ reactExports.createElement(RegisterGraphicalItemId, {
    id: props.id,
    type: "bar"
  }, (id) => /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(SetLegendPayload, {
    legendPayload: computeLegendPayloadFromBarData(props)
  }), /* @__PURE__ */ reactExports.createElement(SetBarTooltipEntrySettings, {
    dataKey: props.dataKey,
    stroke: props.stroke,
    strokeWidth: props.strokeWidth,
    fill: props.fill,
    name: props.name,
    hide: props.hide,
    unit: props.unit,
    tooltipType: props.tooltipType,
    id
  }), /* @__PURE__ */ reactExports.createElement(SetCartesianGraphicalItem, {
    type: "bar",
    id,
    data: void 0,
    xAxisId: props.xAxisId,
    yAxisId: props.yAxisId,
    zAxisId: 0,
    dataKey: props.dataKey,
    stackId,
    hide: props.hide,
    barSize: props.barSize,
    minPointSize: props.minPointSize,
    maxBarSize: props.maxBarSize,
    isPanorama
  }), /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
    zIndex: props.zIndex
  }, /* @__PURE__ */ reactExports.createElement(BarImpl, _extends({}, props, {
    id
  })))));
}
var Bar = /* @__PURE__ */ reactExports.memo(BarFn, propsAreEqual);
Bar.displayName = "Bar";
var allowedTooltipTypes = ["axis", "item"];
var BarChart = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  return /* @__PURE__ */ reactExports.createElement(CartesianChart, {
    chartName: "BarChart",
    defaultTooltipEventType: "axis",
    validateTooltipEventTypes: allowedTooltipTypes,
    tooltipPayloadSearcher: arrayTooltipSearcher,
    categoricalChartProps: props,
    ref
  });
});
const BILLING_USAGE_FEATURE_IDS$1 = [
  AUTUMN_SEO_DATA_BALANCE_FEATURE_ID,
  AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID
];
function BillingUsageChart() {
  const containerRef = reactExports.useRef(null);
  const [chartWidth, setChartWidth] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setChartWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const eventsQuery = useAggregateEvents({
    featureId: BILLING_USAGE_FEATURE_IDS$1,
    range: "30d",
    binSize: "day"
  });
  const chartData = (eventsQuery.list ?? []).map((row) => ({
    date: row.period,
    credits: autumnSeoDataCreditsToUsd(
      BILLING_USAGE_FEATURE_IDS$1.reduce(
        (sum, featureId) => sum + (row.values?.[featureId] ?? 0),
        0
      )
    )
  }));
  const totalSpend = chartData.reduce((sum, d) => sum + d.credits, 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-base-300 bg-base-100 p-4 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Usage" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-base-content/50", children: "Last 30 days" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-semibold tabular-nums", children: [
      "$",
      totalSpend.toFixed(2)
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: containerRef, className: "w-full h-32 min-w-0", children: eventsQuery.isLoading ? null : chartData.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-base-content/40", children: "No usage recorded yet" }) }) : chartWidth > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      BarChart,
      {
        width: chartWidth,
        height: 128,
        data: chartData,
        margin: { top: 4, right: 0, bottom: 0, left: 0 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CartesianGrid,
            {
              strokeDasharray: "3 3",
              stroke: "currentColor",
              opacity: 0.06,
              vertical: false
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            XAxis,
            {
              dataKey: "date",
              tickFormatter: formatShortDate,
              tick: { fontSize: 10, fill: "#888" },
              tickLine: false,
              axisLine: false,
              minTickGap: 40
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            YAxis,
            {
              tickFormatter: formatUsdAxis,
              tick: { fontSize: 10, fill: "#888" },
              tickLine: false,
              axisLine: false,
              width: 44
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              content: /* @__PURE__ */ jsxRuntimeExports.jsx(UsageTooltip, {}),
              cursor: { fill: "rgba(150,150,150,0.1)" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Bar,
            {
              dataKey: "credits",
              fill: "#7c3aed",
              radius: [2, 2, 0, 0],
              maxBarSize: 12
            }
          )
        ]
      }
    ) : null })
  ] });
}
function UsageTooltip({
  active,
  payload,
  label
}) {
  if (!active || !payload?.length || label == null) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-base-300 bg-base-100 px-3 py-2 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-base-content/60", children: new Date(label).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium tabular-nums", children: [
      "$",
      payload[0].value.toFixed(2)
    ] })
  ] });
}
function formatShortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}
function formatUsdAxis(value) {
  return `$${value % 1 === 0 ? value : value.toFixed(2)}`;
}
const billingUsageRangeSchema = object({
  start: number(),
  end: number()
});
const getBillingUsageEvents = createServerFn({
  method: "POST"
}).middleware(requireAuthenticatedContext).validator(billingUsageRangeSchema).handler(createSsrRpc("4f6a59af64bb95847828f645f342cfbb203858ef0caca7ddb96adebcce44b7a0"));
const BILLING_USAGE_FEATURE_IDS = [
  AUTUMN_SEO_DATA_BALANCE_FEATURE_ID,
  AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID
];
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1e3;
function getLast30DayUsageRange() {
  const end = Date.now();
  return {
    start: end - THIRTY_DAYS_MS,
    end
  };
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function getPathSegmentsFromProperties(properties) {
  const paths = properties.paths ?? properties.path;
  if (Array.isArray(paths)) {
    const stringPaths = paths.filter(
      (value) => typeof value === "string"
    );
    if (stringPaths.length > 1 && stringPaths.every((segment) => !segment.includes("/"))) {
      return stringPaths;
    }
    const path = stringPaths[0];
    if (!path) return null;
    const parsedPath2 = parseJsonEncodedPath(path);
    return parsedPath2 ?? path.split("/").filter(Boolean);
  }
  if (typeof paths !== "string") return null;
  const parsedPath = parseJsonEncodedPath(paths);
  return parsedPath ?? paths.split("/").filter(Boolean);
}
function parseJsonEncodedPath(path) {
  if (!path.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(path);
    if (!Array.isArray(parsed)) return null;
    const stringPaths = parsed.filter(
      (value) => typeof value === "string"
    );
    if (stringPaths.length > 1 && stringPaths.every((segment) => !segment.includes("/"))) {
      return stringPaths;
    }
    const firstPath = stringPaths[0];
    return firstPath ? firstPath.split("/").filter(Boolean) : null;
  } catch {
    return null;
  }
}
function getCreditFeatureFromUsageEvent(event) {
  const properties = isRecord(event.properties) ? event.properties : {};
  const explicitFeature = properties.creditFeature ?? properties.credit_feature;
  if (typeof explicitFeature === "string" && explicitFeature.length > 0) {
    return explicitFeature;
  }
  const path = getPathSegmentsFromProperties(properties);
  return path ? mapDataforseoPathToCreditFeature(path) : null;
}
function getBillingFeatureBreakdownRows(events) {
  const creditsByLabel = /* @__PURE__ */ new Map();
  for (const event of events) {
    const feature = getCreditFeatureFromUsageEvent(event);
    const label = feature ? creditFeatureLabel(feature) : "Other";
    creditsByLabel.set(label, (creditsByLabel.get(label) ?? 0) + event.value);
  }
  return [...creditsByLabel.entries()].map(([label, credits]) => ({
    label,
    usd: autumnSeoDataCreditsToUsd(credits)
  })).filter((row) => row.usd > 0).toSorted((a, b) => b.usd - a.usd);
}
function BillingFeatureBreakdown() {
  const eventsQuery = useQuery$1({
    queryKey: ["billing", "usage-events", BILLING_USAGE_FEATURE_IDS, "30d"],
    queryFn: () => getBillingUsageEvents({ data: getLast30DayUsageRange() }),
    staleTime: 6e4
  });
  const rows = getBillingFeatureBreakdownRows(eventsQuery.data ?? []);
  const total = rows.reduce((sum, row) => sum + row.usd, 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-base-300 bg-base-100 p-4 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Usage by feature" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-base-content/50", children: "Last 30 days" })
    ] }),
    eventsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-4 w-full" }, i)) }) : rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-base-content/40", children: "No usage recorded yet" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2.5", children: rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: row.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "tabular-nums text-base-content/70", children: [
          "$",
          row.usd.toFixed(2)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-full overflow-hidden rounded-full bg-base-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full rounded-full bg-[#7c3aed]",
          style: { width: `${row.usd / total * 100}%` }
        }
      ) })
    ] }, row.label)) })
  ] });
}
function parseTopUpAmount(value) {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return {
      isValid: false,
      parsed: 20
    };
  }
  const parsed = Number(trimmed);
  const isValid = Number.isInteger(parsed) && parsed >= 10 && parsed <= 99;
  return {
    isValid,
    parsed: isValid ? parsed : 20
  };
}
function BillingPage() {
  const {
    data: session,
    isPending: isSessionPending
  } = useSession();
  const [topUpAmount, setTopUpAmount] = reactExports.useState("20");
  const [isPending, setIsPending] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const customerQuery = useCustomer({
    queryOptions: {
      enabled: Boolean(session?.user?.id)
    }
  });
  const planStatus = getCustomerPlanStatus(customerQuery.data);
  const isFreePlan = planStatus === "free";
  const billingRouteState = getBillingRouteState({
    hasSession: Boolean(session?.user?.id),
    isSessionPending,
    isCustomerLoading: customerQuery.isLoading,
    isCustomerError: customerQuery.isError
  });
  const monthlyRemaining = autumnSeoDataCreditsToUsd(customerQuery.data?.balances?.[AUTUMN_SEO_DATA_BALANCE_FEATURE_ID]?.remaining ?? 0);
  const topUpRemaining = autumnSeoDataCreditsToUsd(customerQuery.data?.balances?.[AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID]?.remaining ?? 0);
  const totalRemaining = monthlyRemaining + topUpRemaining;
  const {
    isValid: isValidTopUp,
    parsed: parsedTopUpAmount
  } = parseTopUpAmount(topUpAmount);
  const checkoutCompleted = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("checkout") === "success";
  reactExports.useEffect(() => {
    if (!checkoutCompleted || billingRouteState !== "ready") return;
    const attribution = getStoredRedditAttribution();
    if (!attribution) return;
    void captureRedditConversionEvent({
      data: {
        attribution,
        eventType: "PURCHASE"
      }
    });
  }, [billingRouteState, checkoutCompleted]);
  if (billingRouteState === "loading") {
    return null;
  }
  if (billingRouteState === "error") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-2xl space-y-4 p-4 py-10 md:p-6 md:py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: "Billing unavailable" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/70", children: getStandardErrorMessage(customerQuery.error, "We couldn't load your billing details right now. Please try again.") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-soft btn-sm", onClick: () => {
        void customerQuery.refetch();
      }, children: "Try again" })
    ] });
  }
  async function runAction(callback, fallbackMessage) {
    setError(null);
    setIsPending(true);
    try {
      await callback();
      await customerQuery.refetch();
    } catch (err) {
      setError(getStandardErrorMessage(err, fallbackMessage));
    } finally {
      setIsPending(false);
    }
  }
  if (isPending) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-base-content/50", children: "Redirecting to Stripe..." }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-2xl space-y-5 p-4 py-10 md:p-6 md:py-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: "Billing" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between rounded-lg border border-base-300 bg-base-100 p-4 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-semibold tabular-nums", children: [
            "$",
            totalRemaining.toFixed(2),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-normal text-base-content/50", children: "remaining" })
          ] }),
          !isFreePlan ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex gap-3 text-xs text-base-content/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "tabular-nums", children: [
              "Monthly $",
              monthlyRemaining.toFixed(2)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "·" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "tabular-nums", children: [
              "Top-ups $",
              topUpRemaining.toFixed(2)
            ] })
          ] }) : null,
          totalRemaining <= 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-error", children: [
            "You’ve used all your credits.",
            " ",
            isFreePlan ? "Upgrade your plan to continue." : "Buy more credits below to continue."
          ] }) : totalRemaining < LOW_CREDITS_THRESHOLD_USD ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-amber-600", children: [
            "You’re running low on credits.",
            " ",
            isFreePlan ? "Upgrade to get $10/month." : "Buy more credits below."
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Plan" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base-content/50", children: isFreePlan ? "Free Plan" : "Base Plan" })
        ] }),
        isFreePlan ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 border-t border-base-300 pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Base Plan" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium tabular-nums", children: "$10/month" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: ["Access to all OpenSEO features", "Includes $10.00 of Usage Credits each month"].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2 text-xs text-base-content/60", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base-content/30 mt-[1px] shrink-0", children: "—" }),
            item
          ] }, item)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-soft btn-sm w-full", disabled: isPending, onClick: () => void runAction(() => customerQuery.attach({
            planId: AUTUMN_PAID_PLAN_ID,
            redirectMode: "always",
            successUrl: `${window.location.origin}${window.location.pathname}?checkout=success`
          }), "We couldn't start the checkout. Please try again."), children: "Upgrade Plan" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-soft btn-sm w-full", disabled: isPending, onClick: () => void runAction(() => customerQuery.openCustomerPortal({
          returnUrl: window.location.href
        }), "We couldn't open the billing portal. Please try again."), children: "Manage subscription" })
      ] }),
      !isFreePlan ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-base-300 bg-base-100 p-4 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Buy credits" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-base-content/60", children: "Top-up credits never expire and are used after your monthly credits." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-base-content/60", children: "$" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 10, max: 99, step: 1, inputMode: "numeric", className: "input input-bordered input-sm w-full", value: topUpAmount, onChange: (e) => setTopUpAmount(e.target.value) })
          ] }),
          topUpAmount.trim() !== "" && !isValidTopUp ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-error", children: "Enter between $10–$99." }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-soft btn-sm w-full", disabled: isPending || !isValidTopUp, onClick: () => void runAction(() => customerQuery.attach({
          planId: AUTUMN_SEO_DATA_TOP_UP_PLAN_ID,
          redirectMode: "always",
          successUrl: window.location.href,
          featureQuantities: [{
            featureId: AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID,
            quantity: Math.round(parsedTopUpAmount * AUTUMN_SEO_DATA_CREDITS_PER_USD)
          }]
        }), "We couldn't start the checkout. Please try again."), children: "Buy credits" })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BillingUsageChart, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BillingFeatureBreakdown, {}),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: error }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-base-content/40", children: "Billing is powered by Stripe." })
  ] });
}
export {
  BillingPage as component
};
