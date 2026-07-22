var t = "undefined" != typeof window ? window : void 0, e = "undefined" != typeof globalThis ? globalThis : t;
"undefined" == typeof self && (e.self = e), "undefined" == typeof File && (e.File = function() {
});
var i = null == e ? void 0 : e.navigator, r = null == e ? void 0 : e.document, s = null == e ? void 0 : e.location, n = null == e ? void 0 : e.fetch, o = null != e && e.XMLHttpRequest && "withCredentials" in new e.XMLHttpRequest() ? e.XMLHttpRequest : void 0, a = null == e ? void 0 : e.AbortController, l = null == e ? void 0 : e.CompressionStream, u = null == i ? void 0 : i.userAgent, h = null != t ? t : {}, d = "1.395.0", v = { DEBUG: false, LIB_VERSION: d, LIB_NAME: "web", JS_SDK_VERSION: d };
function c(t2, e2, i2, r2, s2, n2, o2) {
  try {
    var a2 = t2[n2](o2), l2 = a2.value;
  } catch (t3) {
    return void i2(t3);
  }
  a2.done ? e2(l2) : Promise.resolve(l2).then(r2, s2);
}
function p(t2) {
  return function() {
    var e2 = this, i2 = arguments;
    return new Promise((function(r2, s2) {
      var n2 = t2.apply(e2, i2);
      function o2(t3) {
        c(n2, r2, s2, o2, a2, "next", t3);
      }
      function a2(t3) {
        c(n2, r2, s2, o2, a2, "throw", t3);
      }
      o2(void 0);
    }));
  };
}
function f() {
  return f = Object.assign ? Object.assign.bind() : function(t2) {
    for (var e2 = 1; arguments.length > e2; e2++) {
      var i2 = arguments[e2];
      for (var r2 in i2) ({}).hasOwnProperty.call(i2, r2) && (t2[r2] = i2[r2]);
    }
    return t2;
  }, f.apply(null, arguments);
}
function _(t2, e2) {
  if (null == t2) return {};
  var i2 = {};
  for (var r2 in t2) if ({}.hasOwnProperty.call(t2, r2)) {
    if (-1 !== e2.indexOf(r2)) continue;
    i2[r2] = t2[r2];
  }
  return i2;
}
var g = (t2) => {
  if ("string" != typeof t2) return t2;
  try {
    return JSON.parse(t2);
  } catch (e2) {
    return t2;
  }
};
function m(t2) {
  return "string" == typeof t2 || t2;
}
function y(t2) {
  return "string" == typeof t2 ? t2 : void 0;
}
var b, w = (function(t2) {
  return t2.AnonymousId = "anonymous_id", t2.DistinctId = "distinct_id", t2.Props = "props", t2.EnablePersonProcessing = "enable_person_processing", t2.PersonMode = "person_mode", t2.FeatureFlagDetails = "feature_flag_details", t2.FeatureFlags = "feature_flags", t2.FeatureFlagPayloads = "feature_flag_payloads", t2.BootstrapFeatureFlagDetails = "bootstrap_feature_flag_details", t2.BootstrapFeatureFlags = "bootstrap_feature_flags", t2.BootstrapFeatureFlagPayloads = "bootstrap_feature_flag_payloads", t2.OverrideFeatureFlags = "override_feature_flags", t2.Queue = "queue", t2.LogsQueue = "logs_queue", t2.OptedOut = "opted_out", t2.SessionId = "session_id", t2.SessionStartTimestamp = "session_start_timestamp", t2.SessionLastTimestamp = "session_timestamp", t2.PersonProperties = "person_properties", t2.GroupProperties = "group_properties", t2.InstalledAppBuild = "installed_app_build", t2.InstalledAppVersion = "installed_app_version", t2.SessionReplay = "session_replay", t2.SessionReplayEventTriggerActivatedSession = "session_replay_event_trigger_activated_session", t2.SurveyLastSeenDate = "survey_last_seen_date", t2.SurveysSeen = "surveys_seen", t2.Surveys = "surveys", t2.RemoteConfig = "remote_config", t2.FlagsEndpointWasHit = "flags_endpoint_was_hit", t2.DeviceId = "device_id", t2;
})({}), E = (function(t2) {
  return t2.GZipJS = "gzip-js", t2.Base64 = "base64", t2;
})({}), x = ["$snapshot", "$pageview", "$pageleave", "$set", "survey dismissed", "survey sent", "survey shown", "$identify", "$groupidentify", "$create_alias", "$$client_ingestion_warning", "$web_experiment_applied", "$feature_enrollment_update", "$feature_flag_called"], S = ["token"], T = "NativeGzipValidationError", k = (t2) => t2.length >= 2 && 31 === t2[0] && 139 === t2[1], R = (t2) => !(!t2 || "object" != typeof t2) && "NotReadableError" === ("name" in t2 ? String(t2.name) : ""), P = (t2) => {
  var e2 = new Error("Native gzip produced invalid output: " + t2);
  throw e2.name = T, e2;
}, I = (function() {
  var t2 = p((function* (t3, e2) {
    18 > t3.size && P("too-short");
    var i2 = new Uint8Array(yield t3.slice(0, 10).arrayBuffer());
    k(i2) && 8 === i2[2] || P("invalid-header");
    var r2 = new DataView(yield t3.slice(t3.size - 8).arrayBuffer());
    r2.getUint32(0, true) !== ((t4) => {
      for (var e3 = (() => {
        if (b) return b;
        b = [];
        for (var t5 = 0; 256 > t5; t5++) {
          for (var e4 = t5, i4 = 0; 8 > i4; i4++) e4 = 1 & e4 ? 3988292384 ^ e4 >>> 1 : e4 >>> 1;
          b[t5] = e4 >>> 0;
        }
        return b;
      })(), i3 = 4294967295, r3 = 0; t4.length > r3; r3++) i3 = e3[255 & (i3 ^ t4[r3])] ^ i3 >>> 8;
      return (4294967295 ^ i3) >>> 0;
    })(e2) && P("invalid-crc");
    var s2 = e2.length >>> 0;
    r2.getUint32(4, true) !== s2 && P("invalid-size");
  }));
  return function(e2, i2) {
    return t2.apply(this, arguments);
  };
})();
function O() {
  return O = p((function* (t2, e2, i2) {
    void 0 === e2 && (e2 = true);
    try {
      var r2 = new TextEncoder().encode(t2), s2 = new CompressionStream("gzip"), n2 = s2.writable.getWriter(), o2 = n2.write(r2).then((() => n2.close())).catch((function() {
        var t3 = p((function* (t4) {
          try {
            yield n2.abort(t4);
          } catch (t5) {
          }
          throw t4;
        }));
        return function(e3) {
          return t3.apply(this, arguments);
        };
      })()), a2 = new Response(s2.readable).blob(), [l2] = yield Promise.all([a2, o2]);
      return yield I(l2, r2), l2;
    } catch (t3) {
      if (null != i2 && i2.rethrow) throw t3;
      return e2 && console.error("Failed to gzip compress data", t3), null;
    }
  })), O.apply(this, arguments);
}
var C = ["amazonbot", "amazonproductbot", "app.hypefactors.com", "applebot", "archive.org_bot", "awariobot", "backlinksextendedbot", "baiduspider", "bingbot", "bingpreview", "chrome-lighthouse", "dataforseobot", "deepscan", "duckduckbot", "facebookexternal", "facebookcatalog", "http://yandex.com/bots", "hubspot", "ia_archiver", "leikibot", "linkedinbot", "meta-externalagent", "mj12bot", "msnbot", "nessus", "petalbot", "pinterest", "prerender", "rogerbot", "screaming frog", "sebot-wa", "sitebulb", "slackbot", "slurp", "trendictionbot", "turnitin", "twitterbot", "vercel-screenshot", "vercelbot", "yahoo! slurp", "yandexbot", "zoombot", "bot.htm", "bot.php", "(bot;", "bot/", "crawler", "ahrefsbot", "ahrefssiteaudit", "semrushbot", "siteauditbot", "splitsignalbot", "gptbot", "oai-searchbot", "chatgpt-user", "perplexitybot", "better uptime bot", "sentryuptimebot", "uptimerobot", "headlesschrome", "cypress", "google-hoteladsverifier", "adsbot-google", "apis-google", "duplexweb-google", "feedfetcher-google", "google favicon", "google web preview", "google-read-aloud", "googlebot", "googleother", "google-cloudvertexbot", "googleweblight", "mediapartners-google", "storebot-google", "google-inspectiontool", "bytespider"], A = function(t2, e2) {
  if (void 0 === e2 && (e2 = []), !t2) return false;
  var i2 = t2.toLowerCase();
  return C.concat(e2).some(((t3) => {
    var e3 = t3.toLowerCase();
    return -1 !== i2.indexOf(e3);
  }));
};
function F(t2, e2) {
  return -1 !== t2.indexOf(e2);
}
var M = function(t2) {
  return t2.trim();
}, D = function(t2) {
  return t2.replace(/^\$/, "");
}, L = Object.prototype, N = L.hasOwnProperty, U = L.toString, j = Array.isArray || function(t2) {
  return "[object Array]" === U.call(t2);
}, B = (t2) => "function" == typeof t2, z = (t2) => t2 === Object(t2) && !j(t2), H = (t2) => {
  if (z(t2)) {
    for (var e2 in t2) if (N.call(t2, e2)) return false;
    return true;
  }
  return false;
}, q = (t2) => void 0 === t2, V = (t2) => "[object String]" == U.call(t2), G = (t2) => V(t2) && 0 === t2.trim().length, W = (t2) => null === t2, Y = (t2) => q(t2) || W(t2), K = (t2) => "[object Number]" == U.call(t2) && t2 == t2, J = (t2) => K(t2) && t2 > 0, Q = (t2) => "[object Boolean]" === U.call(t2), X = (t2) => t2 instanceof FormData, Z = (t2) => F(x, t2), tt = (t2) => F(S, t2);
function et(t2) {
  return null === t2 || "object" != typeof t2;
}
function it(t2, e2) {
  return {}.toString.call(t2) === "[object " + e2 + "]";
}
function rt(t2) {
  return "undefined" != typeof Event && (function(t3, e2) {
    try {
      return t3 instanceof e2;
    } catch (t4) {
      return false;
    }
  })(t2, Event);
}
var st = [true, "true", 1, "1", "yes"], nt = (t2) => F(st, t2), ot = [false, "false", 0, "0", "no"];
function at(t2, e2, i2, r2, s2) {
  return e2 > i2 && (r2.warn("min cannot be greater than max."), e2 = i2), K(t2) ? t2 > i2 ? (r2.warn(" cannot be  greater than max: " + i2 + ". Using max value instead."), i2) : e2 > t2 ? (r2.warn(" cannot be less than min: " + e2 + ". Using min value instead."), e2) : t2 : (r2.warn(" must be a number. using max or fallback. max: " + i2 + ", fallback: " + s2), at(s2 || i2, e2, i2, r2));
}
class lt {
  constructor(t2) {
    this.Ee = {}, this.Pe = t2.Pe, this.Fe = at(t2.bucketSize, 0, 100, t2.Ae), this.$e = at(t2.refillRate, 0, this.Fe, t2.Ae), this.De = at(t2.refillInterval, 0, 864e5, t2.Ae);
  }
  Ne(t2, e2) {
    var i2 = Math.floor((e2 - t2.lastAccess) / this.De);
    i2 > 0 && (t2.tokens = Math.min(t2.tokens + i2 * this.$e, this.Fe), t2.lastAccess = t2.lastAccess + i2 * this.De);
  }
  consumeRateLimit(t2) {
    var e2, i2 = Date.now(), r2 = String(t2), s2 = this.Ee[r2];
    return s2 ? this.Ne(s2, i2) : this.Ee[r2] = s2 = { tokens: this.Fe, lastAccess: i2 }, 0 === s2.tokens || (s2.tokens--, 0 === s2.tokens && (null == (e2 = this.Pe) || e2.call(this, t2)), 0 === s2.tokens);
  }
  stop() {
    this.Ee = {};
  }
}
var ut = "Mobile", ht = "iOS", dt = "Android", vt = "Tablet", ct = dt + " " + vt, pt = "iPad", ft = "Apple", _t = ft + " Watch", gt = "Safari", mt = "BlackBerry", yt = "Samsung", bt = yt + "Browser", wt = yt + " Internet", Et = "Chrome", xt = Et + " OS", St = Et + " " + ht, Tt = "Internet Explorer", $t = Tt + " " + ut, kt = "Opera", Rt = kt + " Mini", Pt = "Edge", It = "Microsoft " + Pt, Ot = "Firefox", Ct = Ot + " " + ht, At = "Nintendo", Ft = "PlayStation", Mt = "Xbox", Dt = dt + " " + ut, Lt = ut + " " + gt, Nt = "Windows", Ut = Nt + " Phone", jt = "Nokia", Bt = "Ouya", zt = "Generic", Ht = zt + " " + ut.toLowerCase(), qt = zt + " " + vt.toLowerCase(), Vt = "Konqueror", Gt = "Oculus Browser", Wt = "Vivaldi", Yt = "Yandex", Kt = "Whale", Jt = "DuckDuckGo", Qt = "Pale Moon", Xt = "Waterfox", Zt = "Brave", te = "Google Search App", ee = "(\\d+(\\.\\d+)?)", ie = new RegExp("Version/" + ee), re = new RegExp(Mt, "i"), se = new RegExp(Ft + " \\w+", "i"), ne = new RegExp(At + " \\w+", "i"), oe = new RegExp(mt + "|PlayBook|BB10", "i"), ae = { "NT3.51": "NT 3.11", "NT4.0": "NT 4.0", "5.0": "2000", 5.1: "XP", 5.2: "XP", "6.0": "Vista", 6.1: "7", 6.2: "8", 6.3: "8.1", 6.4: "10", "10.0": "10" }, le = function(t2, e2, i2, r2) {
  e2 = e2 || "";
  var s2 = (function(t3) {
    return null != t3 && t3.brave ? Zt : null;
  })(i2);
  return s2 || (null != r2 && r2.detectGoogleSearchApp && F(t2, "GSA/") ? te : F(t2, " OPR/") && F(t2, "Mini") ? Rt : F(t2, " OPR/") ? kt : oe.test(t2) ? mt : F(t2, "IE" + ut) || F(t2, "WPDesktop") ? $t : F(t2, "OculusBrowser") ? Gt : F(t2, bt) ? wt : F(t2, Pt) || F(t2, "Edg/") ? It : F(t2, Wt + "/") ? Wt : F(t2, "YaBrowser/") ? Yt : F(t2, Kt + "/") ? Kt : F(t2, Jt + "/") || F(t2, "Ddg/") ? Jt : F(t2, "FBIOS") ? "Facebook " + ut : F(t2, "UCWEB") || F(t2, "UCBrowser") ? "UC Browser" : F(t2, "CriOS") ? St : F(t2, "CrMo") || F(t2, Et) ? Et : F(t2, dt) && F(t2, gt) ? Dt : F(t2, "FxiOS") ? Ct : F(t2.toLowerCase(), Vt.toLowerCase()) ? Vt : F(t2, Zt + "/") ? Zt : ((t3, e3) => e3 && F(e3, ft) || (function(t4) {
    return F(t4, gt) && !F(t4, Et) && !F(t4, dt);
  })(t3))(t2, e2) ? F(t2, ut) ? Lt : gt : F(t2, "PaleMoon/") ? Qt : F(t2, Xt + "/") ? Xt : F(t2, Ot) ? Ot : F(t2, "MSIE") || F(t2, "Trident/") ? Tt : F(t2, "Gecko") ? Ot : "");
}, ue = { [$t]: [new RegExp("rv:" + ee)], [It]: [new RegExp(Pt + "?\\/" + ee)], [Et]: [new RegExp("(" + Et + "|CrMo)\\/" + ee)], [St]: [new RegExp("CriOS\\/" + ee)], "UC Browser": [new RegExp("(UCBrowser|UCWEB)\\/" + ee)], [gt]: [ie], [Lt]: [ie], [kt]: [new RegExp("(Opera|OPR)\\/" + ee)], [Ot]: [new RegExp(Ot + "\\/" + ee)], [Ct]: [new RegExp("FxiOS\\/" + ee)], [Vt]: [new RegExp("Konqueror[:/]?" + ee, "i")], [mt]: [new RegExp(mt + " " + ee), ie], [Dt]: [new RegExp("android\\s" + ee, "i")], [wt]: [new RegExp(bt + "\\/" + ee)], [Gt]: [new RegExp("OculusBrowser\\/" + ee)], [Wt]: [new RegExp(Wt + "\\/" + ee)], [Yt]: [new RegExp("YaBrowser\\/" + ee)], [Kt]: [new RegExp(Kt + "\\/" + ee)], [Zt]: [new RegExp(Zt + "\\/" + ee)], [Jt]: [new RegExp("(DuckDuckGo|Ddg)\\/" + ee)], [Qt]: [new RegExp("PaleMoon\\/" + ee)], [Xt]: [new RegExp(Xt + "\\/" + ee)], [te]: [new RegExp("GSA\\/" + ee)], [Tt]: [new RegExp("(rv:|MSIE )" + ee)], Mozilla: [new RegExp("rv:" + ee)] }, he = function(t2, e2, i2, r2) {
  var s2 = le(t2, e2, i2, r2), n2 = ue[s2];
  if (q(n2)) return null;
  for (var o2 = 0; n2.length > o2; o2++) {
    var a2 = t2.match(n2[o2]);
    if (a2) return parseFloat(a2[a2.length - 2]);
  }
  return null;
}, de = [[new RegExp(Mt + "; " + Mt + " (.*?)[);]", "i"), (t2) => [Mt, t2 && t2[1] || ""]], [new RegExp(At, "i"), [At, ""]], [new RegExp(Ft, "i"), [Ft, ""]], [oe, [mt, ""]], [new RegExp(Nt, "i"), (t2, e2) => {
  if (/Phone/.test(e2) || /WPDesktop/.test(e2)) return [Ut, ""];
  if (new RegExp(ut).test(e2) && !/IEMobile\b/.test(e2)) return [Nt + " " + ut, ""];
  var i2 = /Windows NT ([0-9.]+)/i.exec(e2);
  if (i2 && i2[1]) {
    var r2 = ae[i2[1]] || "";
    return /arm/i.test(e2) && (r2 = "RT"), [Nt, r2];
  }
  return [Nt, ""];
}], [/((iPhone|iPad|iPod).*?OS (\d+)_(\d+)_?(\d+)?|iPhone)/, (t2) => t2 && t2[3] ? [ht, [t2[3], t2[4], t2[5] || "0"].join(".")] : [ht, ""]], [/(watch.*\/(\d+\.\d+\.\d+)|watch os,(\d+\.\d+),)/i, (t2) => {
  var e2 = "";
  return t2 && t2.length >= 3 && (e2 = q(t2[2]) ? t2[3] : t2[2]), ["watchOS", e2];
}], [new RegExp("(" + dt + " (\\d+)\\.(\\d+)\\.?(\\d+)?|" + dt + ")", "i"), (t2) => t2 && t2[2] ? [dt, [t2[2], t2[3], t2[4] || "0"].join(".")] : [dt, ""]], [/Mac OS X (\d+)[_.](\d+)[_.]?(\d+)?/i, (t2) => {
  var e2 = ["Mac OS X", ""];
  return t2 && t2[1] && (e2[1] = [t2[1], t2[2], t2[3] || "0"].join(".")), e2;
}], [/Mac/i, ["Mac OS X", ""]], [/CrOS/, [xt, ""]], [/Linux|debian/i, ["Linux", ""]]], ve = function(t2) {
  return ne.test(t2) ? At : se.test(t2) ? Ft : re.test(t2) ? Mt : new RegExp(Bt, "i").test(t2) ? Bt : new RegExp("(" + Ut + "|WPDesktop)", "i").test(t2) ? Ut : /iPad/.test(t2) ? pt : /iPod/.test(t2) ? "iPod Touch" : /iPhone/.test(t2) ? "iPhone" : /(watch)(?: ?os[,/]|\d,\d\/)[\d.]+/i.test(t2) ? _t : oe.test(t2) ? mt : /(kobo)\s(ereader|touch)/i.test(t2) ? "Kobo" : new RegExp(jt, "i").test(t2) ? jt : /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i.test(t2) || /(kf[a-z]+)( bui|\)).+silk\//i.test(t2) ? "Kindle Fire" : /(Android|ZTE)/i.test(t2) ? new RegExp(ut).test(t2) && !/(9138B|TB782B|Nexus [97]|pixel c|HUAWEISHT|BTV|noble nook|smart ultra 6)/i.test(t2) || /pixel[\daxl ]{1,6}/i.test(t2) && !/pixel c/i.test(t2) || /(huaweimed-al00|tah-|APA|SM-G92|i980|zte|U304AA)/i.test(t2) || /lmy47v/i.test(t2) && !/QTAQZ3/i.test(t2) ? dt : ct : new RegExp("(pda|" + ut + ")", "i").test(t2) ? Ht : new RegExp(vt, "i").test(t2) && !new RegExp(vt + " pc", "i").test(t2) ? qt : "";
}, ce = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function pe(t2, e2) {
  return "string" == typeof (i2 = t2) && ce.test(i2) ? t2 : e2();
  var i2;
}
function fe(t2) {
  return t2 ? t2.split("#")[0] : t2;
}
function _e(t2, e2) {
  var i2 = setTimeout(t2, e2);
  return (null == i2 ? void 0 : i2.unref) && (null == i2 || i2.unref()), i2;
}
var ge = (t2) => t2 instanceof Error, me = { trace: { text: "TRACE", number: 1 }, debug: { text: "DEBUG", number: 5 }, info: { text: "INFO", number: 9 }, warn: { text: "WARN", number: 13 }, error: { text: "ERROR", number: 17 }, fatal: { text: "FATAL", number: 21 } }, ye = me.info;
function be(t2) {
  if (Q(t2)) return { boolValue: t2 };
  if ("number" == typeof t2) return Number.isFinite(t2) ? Number.isInteger(t2) ? { intValue: t2 } : { doubleValue: t2 } : { stringValue: String(t2) };
  if ("string" == typeof t2) return { stringValue: t2 };
  if (j(t2)) return { arrayValue: { values: t2.map(((t3) => be(t3))) } };
  try {
    return { stringValue: JSON.stringify(t2) };
  } catch (e2) {
    return { stringValue: String(t2) };
  }
}
function we(t2) {
  var e2 = [];
  for (var i2 in t2) {
    var r2 = t2[i2];
    W(r2) || q(r2) || e2.push({ key: i2, value: be(r2) });
  }
  return e2;
}
function Ee(t2, e2) {
  var i2 = t2.level || "info", { text: r2, number: s2 } = me[i2] || ye, n2 = String(Date.now()) + "000000", o2 = {};
  e2.distinctId && (o2.posthogDistinctId = e2.distinctId), e2.sessionId && (o2.sessionId = e2.sessionId), e2.windowId && (o2["window.id"] = e2.windowId), Y(e2.sessionStartTimestamp) || (o2.sessionStartTimestamp = String(e2.sessionStartTimestamp)), Y(e2.lastActivityTimestamp) || (o2.lastActivityTimestamp = String(e2.lastActivityTimestamp)), e2.currentUrl && (o2["url.full"] = e2.currentUrl), e2.screenName && (o2["screen.name"] = e2.screenName), e2.appState && (o2["app.state"] = e2.appState), e2.activeFeatureFlags && e2.activeFeatureFlags.length > 0 && (o2.feature_flags = e2.activeFeatureFlags);
  var a2 = f({}, o2, t2.attributes || {}), l2 = { timeUnixNano: n2, observedTimeUnixNano: n2, severityNumber: s2, severityText: r2, body: { stringValue: t2.body }, attributes: we(a2) };
  return t2.trace_id && (l2.traceId = t2.trace_id), t2.span_id && (l2.spanId = t2.span_id), q(t2.trace_flags) || (l2.flags = t2.trace_flags), l2;
}
function xe(t2, e2, i2) {
  return f({}, t2.resourceAttributes, { "service.name": t2.serviceName || "unknown_service" }, t2.environment && { "deployment.environment": t2.environment }, t2.serviceVersion && { "service.version": t2.serviceVersion }, { "telemetry.sdk.name": e2, "telemetry.sdk.version": i2 });
}
function Se(t2, e2, i2, r2) {
  return { resourceLogs: [{ resource: { attributes: we(e2) }, scopeLogs: [{ scope: { name: i2, version: r2 }, logRecords: t2 }] }] };
}
let Te = class {
  constructor(t2, e2, i2, r2, s2, n2, o2) {
    var a2;
    void 0 === n2 && (n2 = () => Promise.resolve()), this._instance = t2, this.Se = e2, this.Ae = i2, this.qe = r2, this.je = s2, this.Be = n2, this.He = o2, this.Ue = null, this.ze = 0, this.Ve = 0, this.We = 0, this.Ge = 0, this.Ze = false, this.Qe = e2.maxBufferSize, this.Je = Math.max(null !== (a2 = e2.maxQueueSize) && void 0 !== a2 ? a2 : e2.maxBufferSize, e2.maxBufferSize), this.Ye = e2.flushIntervalMs, this.Ke = e2.maxBatchRecordsPerPost, this.Xe = e2.rateCapWindowMs, this.et = e2.maxLogsPerInterval;
  }
  reset() {
    this.tt(), this.Ue = null, this.We = 0, this.Ge = 0, this.Ze = false, this.ze = 0, this.Ve = 0, this.Ke = this.Se.maxBatchRecordsPerPost;
  }
  onReconnect() {
    this.Ve = 0, this.rt();
  }
  captureLog(t2) {
    if (!this._instance.isDisabled && !this._instance.optedOut && null != t2 && t2.body) {
      var e2 = this.it(t2);
      if (null !== e2) if (e2.body) {
        if (this.nt()) {
          var i2 = { record: Ee(e2, this.qe()) };
          this.je((() => this.st(i2)));
        }
      } else this.Ae.info("Log was rejected in beforeSend function");
    }
  }
  it(t2) {
    var e2 = this.Se.beforeSend;
    if (!e2) return t2;
    var i2 = j(e2) ? e2 : [e2], r2 = t2;
    for (var s2 of i2) try {
      var n2 = s2(r2);
      if (!n2) return this.Ae.info("Log was rejected in beforeSend function"), null;
      r2 = n2;
    } catch (t3) {
      return this.Ae.error("Error in beforeSend function for log:", t3), null;
    }
    return r2;
  }
  nt() {
    if (void 0 === this.et) return true;
    var t2 = Date.now(), e2 = t2 - this.We;
    return this.Xe > e2 && e2 >= 0 || (this.We = t2, this.Ge = 0, this.Ze = false), this.et > this.Ge ? (this.Ge++, true) : (this.Ze || (this.Ae.warn("captureLog dropping logs: exceeded " + this.et + " logs per " + this.Xe + "ms"), this.Ze = true), false);
  }
  flush() {
    var t2 = this;
    return p((function* () {
      if (!t2._instance.isDisabled) return t2.Ue || (t2.Ue = t2.ot().finally((() => {
        t2.Ue = null;
      }))), t2.Ue;
    }))();
  }
  ot() {
    var t2 = this;
    return p((function* () {
      var e2;
      t2.tt();
      var i2 = null !== (e2 = t2._instance.getPersistedProperty(w.LogsQueue)) && void 0 !== e2 ? e2 : [];
      if (0 !== i2.length) for (var r2 = i2.length, s2 = 0; i2.length > 0 && r2 > s2; ) {
        var n2, o2;
        t2.ze = 0;
        var a2 = Math.min(i2.length, t2.Ke), l2 = i2.slice(0, a2), u2 = Se(l2.map(((t3) => t3.record)), t2.ut(), null !== (n2 = t2.He) && void 0 !== n2 ? n2 : t2._instance.getLibraryId(), t2._instance.getLibraryVersion()), h2 = yield t2._instance.ht(u2);
        if ("too-large" === h2.kind && l2.length > 1) t2.Ke = Math.max(1, Math.floor(l2.length / 2)), t2.Ae.warn("Received 413 when sending logs batch of size " + l2.length + ", reducing batch size to " + t2.Ke);
        else {
          if ("retry-later" === h2.kind) throw h2.error;
          if ("too-large" === h2.kind ? t2.Ae.warn("Dropping a single log record after 413 with batch size 1 — the record is larger than the server cap and cannot be split further.") : "ok" === h2.kind && t2.Se.maxBatchRecordsPerPost > t2.Ke && (t2.Ke = Math.min(t2.Se.maxBatchRecordsPerPost, t2.Ke + 1)), yield t2.dt(l2.length), i2 = null !== (o2 = t2._instance.getPersistedProperty(w.LogsQueue)) && void 0 !== o2 ? o2 : [], s2 += l2.length, "fatal" === h2.kind) throw h2.error;
        }
      }
    }))();
  }
  dt(t2) {
    var e2 = this;
    return p((function* () {
      var i2, r2 = Math.max(0, t2 - e2.ze), s2 = null !== (i2 = e2._instance.getPersistedProperty(w.LogsQueue)) && void 0 !== i2 ? i2 : [];
      e2._instance.setPersistedProperty(w.LogsQueue, s2.slice(r2)), yield e2.Be();
    }))();
  }
  ut() {
    return xe(this.Se, this._instance.getLibraryId(), this._instance.getLibraryVersion());
  }
  st(t2) {
    var e2;
    if (!this._instance.optedOut) {
      var i2 = null !== (e2 = this._instance.getPersistedProperty(w.LogsQueue)) && void 0 !== e2 ? e2 : [];
      this.Je > i2.length || (i2.shift(), this.ze++, this.Ae.info("Logs queue is full, dropping oldest record.")), i2.push(t2), this._instance.setPersistedProperty(w.LogsQueue, i2), this.Qe > i2.length ? this.ct() : this.rt();
    }
  }
  ct(t2) {
    void 0 === t2 && (t2 = this.Ye), this.vt || (this.vt = _e((() => {
      this.vt = void 0, this.rt();
    }), t2));
  }
  ft() {
    var t2 = Math.min(Math.max(0, this.Ve - 1), 6);
    return this.Ye * Math.pow(2, t2);
  }
  yt() {
    var t2 = this._instance.getPersistedProperty(w.LogsQueue);
    return !!t2 && t2.length > 0;
  }
  shutdown(t2) {
    var e2 = this;
    return p((function* () {
      e2.tt();
      var i2 = e2.flush().catch((() => {
      }));
      void 0 !== t2 ? yield Promise.race([i2, new Promise(((e3) => _e(e3, t2)))]) : yield i2;
    }))();
  }
  flushWithTimeout(t2) {
    var e2 = this;
    return p((function* () {
      var i2 = false, r2 = e2.flush(), s2 = new Promise(((e3) => _e((() => {
        i2 = true, e3();
      }), t2)));
      try {
        yield Promise.race([r2, s2]);
      } finally {
        i2 && r2.catch((() => {
        }));
      }
    }))();
  }
  rt() {
    this.flush().then((() => {
      this.Ve = 0;
    }), ((t2) => {
      this.Ve++, this.Ae.error("PostHog logs flush failed:", t2);
    })).finally((() => {
      !this._instance.isDisabled && this.yt() && this.ct(this.ft());
    }));
  }
  tt() {
    this.vt && (clearTimeout(this.vt), this.vt = void 0);
  }
};
var $e, ke, Re;
function Pe(t2) {
  var e2 = globalThis._posthogChunkIds;
  if (e2) {
    var i2 = Object.keys(e2);
    return Re && i2.length === ke || (ke = i2.length, Re = i2.reduce(((i3, r2) => {
      $e || ($e = {});
      var s2 = $e[r2];
      if (s2) i3[s2[0]] = s2[1];
      else for (var n2 = t2(r2), o2 = n2.length - 1; o2 >= 0; o2--) {
        var a2 = n2[o2], l2 = null == a2 ? void 0 : a2.filename, u2 = e2[r2];
        if (l2 && u2) {
          i3[l2] = u2, $e[r2] = [l2, u2];
          break;
        }
      }
      return i3;
    }), {})), Re;
  }
}
class Ie {
  constructor(t2, e2, i2) {
    void 0 === i2 && (i2 = []), this.coercers = t2, this.stackParser = e2, this.modifiers = i2;
  }
  buildFromUnknown(t2, e2) {
    void 0 === e2 && (e2 = {});
    var i2 = e2 && e2.mechanism || { handled: true, type: "generic" }, r2 = this.buildCoercingContext(i2, e2, 0).apply(t2), s2 = this.buildParsingContext(e2), n2 = this.parseStacktrace(r2, s2);
    return { $exception_list: this.convertToExceptionList(n2, i2), $exception_level: "error" };
  }
  modifyFrames(t2) {
    var e2 = this;
    return p((function* () {
      for (var i2 of t2) i2.stacktrace && i2.stacktrace.frames && j(i2.stacktrace.frames) && (i2.stacktrace.frames = yield e2.applyModifiers(i2.stacktrace.frames));
      return t2;
    }))();
  }
  coerceFallback(t2) {
    var e2;
    return { type: "Error", value: "Unknown error", stack: null == (e2 = t2.syntheticException) ? void 0 : e2.stack, synthetic: true };
  }
  parseStacktrace(t2, e2) {
    var i2, r2;
    return null != t2.cause && (i2 = this.parseStacktrace(t2.cause, e2)), "" != t2.stack && null != t2.stack && (r2 = this.applyChunkIds(this.stackParser(t2.stack, t2.synthetic ? e2.skipFirstLines : 0), e2.chunkIdMap)), f({}, t2, { cause: i2, stack: r2 });
  }
  applyChunkIds(t2, e2) {
    return t2.map(((t3) => (t3.filename && e2 && (t3.chunk_id = e2[t3.filename]), t3)));
  }
  applyCoercers(t2, e2) {
    for (var i2 of this.coercers) if (i2.match(t2)) return i2.coerce(t2, e2);
    return this.coerceFallback(e2);
  }
  applyModifiers(t2) {
    var e2 = this;
    return p((function* () {
      var i2 = t2;
      for (var r2 of e2.modifiers) i2 = yield r2(i2);
      return i2;
    }))();
  }
  convertToExceptionList(t2, e2) {
    var i2, r2, s2, n2 = { type: t2.type, value: t2.value, mechanism: { type: null !== (i2 = e2.type) && void 0 !== i2 ? i2 : "generic", handled: null === (r2 = e2.handled) || void 0 === r2 || r2, synthetic: null !== (s2 = t2.synthetic) && void 0 !== s2 && s2 } };
    t2.stack && (n2.stacktrace = { type: "raw", frames: t2.stack });
    var o2 = [n2];
    return null != t2.cause && o2.push(...this.convertToExceptionList(t2.cause, f({}, e2, { handled: true }))), o2;
  }
  buildParsingContext(t2) {
    var e2;
    return { chunkIdMap: Pe(this.stackParser), skipFirstLines: null !== (e2 = t2.skipFirstLines) && void 0 !== e2 ? e2 : 1 };
  }
  buildCoercingContext(t2, e2, i2) {
    void 0 === i2 && (i2 = 0);
    var r2 = (i3, r3) => {
      if (4 >= r3) {
        var s2 = this.buildCoercingContext(t2, e2, r3);
        return this.applyCoercers(i3, s2);
      }
    };
    return f({}, e2, { syntheticException: 0 == i2 ? e2.syntheticException : void 0, mechanism: t2, apply: (t3) => r2(t3, i2), next: (t3) => r2(t3, i2 + 1) });
  }
}
var Oe = "?";
function Ce(t2, e2, i2, r2, s2) {
  var n2 = { platform: t2, filename: e2, function: "<anonymous>" === i2 ? Oe : i2, in_app: true };
  return q(r2) || (n2.lineno = r2), q(s2) || (n2.colno = s2), n2;
}
var Ae = (t2, e2) => {
  var i2 = -1 !== t2.indexOf("safari-extension"), r2 = -1 !== t2.indexOf("safari-web-extension");
  return i2 || r2 ? [-1 !== t2.indexOf("@") ? t2.split("@")[0] : Oe, i2 ? "safari-extension:" + e2 : "safari-web-extension:" + e2] : [t2, e2];
}, Fe = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i, Me = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i, De = /\((\S*)(?::(\d+))(?::(\d+))\)/, Le = (t2, e2) => {
  var i2 = Fe.exec(t2);
  if (i2) {
    var [, r2, s2, n2] = i2;
    return Ce(e2, r2, Oe, +s2, +n2);
  }
  var o2 = Me.exec(t2);
  if (o2) {
    if (o2[2] && 0 === o2[2].indexOf("eval")) {
      var a2 = De.exec(o2[2]);
      a2 && (o2[2] = a2[1], o2[3] = a2[2], o2[4] = a2[3]);
    }
    var [l2, u2] = Ae(o2[1] || Oe, o2[2]);
    return Ce(e2, u2, l2, o2[3] ? +o2[3] : void 0, o2[4] ? +o2[4] : void 0);
  }
}, Ne = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i, Ue = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i, je = (t2, e2) => {
  var i2 = Ne.exec(t2);
  if (i2) {
    if (i2[3] && i2[3].indexOf(" > eval") > -1) {
      var r2 = Ue.exec(i2[3]);
      r2 && (i2[1] = i2[1] || "eval", i2[3] = r2[1], i2[4] = r2[2], i2[5] = "");
    }
    var s2 = i2[3], n2 = i2[1] || Oe;
    return [n2, s2] = Ae(n2, s2), Ce(e2, s2, n2, i2[4] ? +i2[4] : void 0, i2[5] ? +i2[5] : void 0);
  }
}, Be = /\(error: (.*)\)/;
class ze {
  match(t2) {
    return this.isDOMException(t2) || this.isDOMError(t2);
  }
  coerce(t2, e2) {
    var i2 = V(t2.stack);
    return { type: this.getType(t2), value: this.getValue(t2), stack: i2 ? t2.stack : void 0, cause: t2.cause ? e2.next(t2.cause) : void 0, synthetic: false };
  }
  getType(t2) {
    return this.isDOMError(t2) ? "DOMError" : "DOMException";
  }
  getValue(t2) {
    var e2 = t2.name || (this.isDOMError(t2) ? "DOMError" : "DOMException");
    return t2.message ? e2 + ": " + t2.message : e2;
  }
  isDOMException(t2) {
    return it(t2, "DOMException");
  }
  isDOMError(t2) {
    return it(t2, "DOMError");
  }
}
class He {
  match(t2) {
    return ((t3) => t3 instanceof Error)(t2);
  }
  coerce(t2, e2) {
    return { type: this.getType(t2), value: this.getMessage(t2, e2), stack: this.getStack(t2), cause: t2.cause ? e2.next(t2.cause) : void 0, synthetic: false };
  }
  getType(t2) {
    return t2.name || t2.constructor.name;
  }
  getMessage(t2, e2) {
    var i2 = t2.message;
    return String(i2.error && "string" == typeof i2.error.message ? i2.error.message : i2);
  }
  getStack(t2) {
    return t2.stacktrace || t2.stack || void 0;
  }
}
class qe {
  constructor() {
  }
  match(t2) {
    return it(t2, "ErrorEvent") && null != t2.error;
  }
  coerce(t2, e2) {
    var i2;
    return e2.apply(t2.error) || { type: "ErrorEvent", value: t2.message, stack: null == (i2 = e2.syntheticException) ? void 0 : i2.stack, synthetic: true };
  }
}
var Ve = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/i;
class Ge {
  match(t2) {
    return "string" == typeof t2;
  }
  coerce(t2, e2) {
    var i2, [r2, s2] = this.getInfos(t2);
    return { type: null != r2 ? r2 : "Error", value: null != s2 ? s2 : t2, stack: null == (i2 = e2.syntheticException) ? void 0 : i2.stack, synthetic: true };
  }
  getInfos(t2) {
    var e2 = "Error", i2 = t2, r2 = t2.match(Ve);
    return r2 && (e2 = r2[1], i2 = r2[2]), [e2, i2];
  }
}
var We = ["fatal", "error", "warning", "log", "info", "debug"];
function Ye(t2, e2) {
  void 0 === e2 && (e2 = 40);
  var i2 = Object.keys(t2);
  if (i2.sort(), !i2.length) return "[object has no keys]";
  for (var r2 = i2.length; r2 > 0; r2--) {
    var s2 = i2.slice(0, r2).join(", ");
    if (e2 >= s2.length) return r2 === i2.length ? s2 : s2.length > e2 ? s2.slice(0, e2) + "..." : s2;
  }
  return "";
}
class Ke {
  match(t2) {
    return "object" == typeof t2 && null !== t2;
  }
  coerce(t2, e2) {
    var i2, r2 = this.getErrorPropertyFromObject(t2);
    return r2 ? e2.apply(r2) : { type: this.getType(t2), value: this.getValue(t2), stack: null == (i2 = e2.syntheticException) ? void 0 : i2.stack, level: this.isSeverityLevel(t2.level) ? t2.level : "error", synthetic: true };
  }
  getType(t2) {
    return rt(t2) ? t2.constructor.name : "Error";
  }
  getValue(t2) {
    if ("name" in t2 && "string" == typeof t2.name) {
      var e2 = "'" + t2.name + "' captured as exception";
      return "message" in t2 && "string" == typeof t2.message && (e2 += " with message: '" + t2.message + "'"), e2;
    }
    if ("message" in t2 && "string" == typeof t2.message) return t2.message;
    var i2 = this.getObjectClassName(t2);
    return (i2 && "Object" !== i2 ? "'" + i2 + "'" : "Object") + " captured as exception with keys: " + Ye(t2);
  }
  isSeverityLevel(t2) {
    return V(t2) && !G(t2) && We.indexOf(t2) >= 0;
  }
  getErrorPropertyFromObject(t2) {
    for (var e2 in t2) if ({}.hasOwnProperty.call(t2, e2)) {
      var i2 = t2[e2];
      if (ge(i2)) return i2;
    }
  }
  getObjectClassName(t2) {
    try {
      var e2 = Object.getPrototypeOf(t2);
      return e2 ? e2.constructor.name : void 0;
    } catch (t3) {
      return;
    }
  }
}
class Je {
  match(t2) {
    return rt(t2);
  }
  coerce(t2, e2) {
    var i2, r2 = t2.constructor.name;
    return { type: r2, value: r2 + " captured as exception with keys: " + Ye(t2), stack: null == (i2 = e2.syntheticException) ? void 0 : i2.stack, synthetic: true };
  }
}
class Qe {
  match(t2) {
    return et(t2);
  }
  coerce(t2, e2) {
    var i2;
    return { type: "Error", value: "Primitive value captured as exception: " + String(t2), stack: null == (i2 = e2.syntheticException) ? void 0 : i2.stack, synthetic: true };
  }
}
class Xe {
  match(t2) {
    return it(t2, "PromiseRejectionEvent") || this.isCustomEventWrappingRejection(t2);
  }
  isCustomEventWrappingRejection(t2) {
    if (!rt(t2)) return false;
    try {
      var e2 = t2.detail;
      return null != e2 && "object" == typeof e2 && "reason" in e2;
    } catch (t3) {
      return false;
    }
  }
  coerce(t2, e2) {
    var i2, r2 = this.getUnhandledRejectionReason(t2);
    return et(r2) ? { type: "UnhandledRejection", value: "Non-Error promise rejection captured with value: " + String(r2), stack: null == (i2 = e2.syntheticException) ? void 0 : i2.stack, synthetic: true } : e2.apply(r2);
  }
  getUnhandledRejectionReason(t2) {
    try {
      if ("reason" in t2) return t2.reason;
      if ("detail" in t2 && null != t2.detail && "object" == typeof t2.detail && "reason" in t2.detail) return t2.detail.reason;
    } catch (t3) {
    }
    return t2;
  }
}
var Ze = "$message", ti = "$timestamp", ei = /* @__PURE__ */ new Set([Ze, ti]), ii = { enabled: true, max_bytes: 32768 };
function ri(t2) {
  var e2;
  return t2 ? { enabled: null !== (e2 = t2.enabled) && void 0 !== e2 ? e2 : ii.enabled, max_bytes: ni(t2.max_bytes, ii.max_bytes) } : f({}, ii);
}
class si {
  constructor(t2) {
    this.bt = [], this._t = 0, this.Se = ri(t2);
  }
  setConfig(t2) {
    this.Se = ri(t2), this.wt();
  }
  add(t2) {
    var e2 = (function(t3) {
      var e3 = (function(t4) {
        var e4 = /* @__PURE__ */ new WeakSet();
        try {
          return JSON.stringify(t4, ((t5, i4) => {
            if ("bigint" == typeof i4) return i4.toString();
            if ("function" != typeof i4 && "symbol" != typeof i4) {
              if (i4 instanceof Date) return i4.toISOString();
              if (i4 instanceof Error) return { name: i4.name, message: i4.message, stack: i4.stack };
              if (i4 && "object" == typeof i4) {
                if (e4.has(i4)) return "[Circular]";
                e4.add(i4);
              }
              return i4;
            }
          }));
        } catch (t5) {
          return;
        }
      })(t3);
      if (e3) try {
        var i3 = JSON.parse(e3);
        if (!z(i3)) return;
        var r2 = i3, s2 = r2[Ze], n2 = r2[ti];
        if (!V(s2) || 0 === s2.trim().length) return;
        if (!V(n2) && !K(n2)) return;
        return { step: r2, json: e3 };
      } catch (t4) {
        return;
      }
    })(t2);
    if (e2) {
      var i2 = (function(t3) {
        if ("undefined" != typeof TextEncoder) return new TextEncoder().encode(t3).length;
        for (var e3 = encodeURIComponent(t3), i3 = 0, r2 = 0; e3.length > r2; r2++) "%" === e3[r2] ? (i3 += 1, r2 += 2) : i3 += 1;
        return i3;
      })(e2.json);
      i2 > this.Se.max_bytes || (this.bt.push({ step: e2.step, bytes: i2 }), this._t += i2, this.wt());
    }
  }
  getAttachable() {
    return this.bt.map(((t2) => t2.step));
  }
  clear() {
    this.bt = [], this._t = 0;
  }
  size() {
    return this.bt.length;
  }
  wt() {
    for (; this._t > this.Se.max_bytes && this.bt.length > 0; ) {
      var t2 = this.bt.shift();
      t2 && (this._t -= t2.bytes);
    }
  }
}
function ni(t2, e2) {
  if (!K(t2) || t2 === 1 / 0 || t2 === -1 / 0) return e2;
  var i2 = Math.floor(t2);
  return 0 > i2 ? e2 : i2;
}
var oi = function(e2, i2) {
  var { debugEnabled: r2 } = void 0 === i2 ? {} : i2, s2 = { k(i3) {
    if (t && (v.DEBUG || h.POSTHOG_DEBUG || r2) && !q(t.console) && t.console) {
      for (var s3 = ("__rrweb_original__" in t.console[i3]) ? t.console[i3].__rrweb_original__ : t.console[i3], n2 = arguments.length, o2 = new Array(n2 > 1 ? n2 - 1 : 0), a2 = 1; n2 > a2; a2++) o2[a2 - 1] = arguments[a2];
      s3(e2, ...o2);
    }
  }, debug() {
    for (var t2 = arguments.length, e3 = new Array(t2), i3 = 0; t2 > i3; i3++) e3[i3] = arguments[i3];
    s2.k("debug", ...e3);
  }, info() {
    for (var t2 = arguments.length, e3 = new Array(t2), i3 = 0; t2 > i3; i3++) e3[i3] = arguments[i3];
    s2.k("log", ...e3);
  }, warn() {
    for (var t2 = arguments.length, e3 = new Array(t2), i3 = 0; t2 > i3; i3++) e3[i3] = arguments[i3];
    s2.k("warn", ...e3);
  }, error() {
    for (var t2 = arguments.length, e3 = new Array(t2), i3 = 0; t2 > i3; i3++) e3[i3] = arguments[i3];
    s2.k("error", ...e3);
  }, critical() {
    for (var t2 = arguments.length, i3 = new Array(t2), r3 = 0; t2 > r3; r3++) i3[r3] = arguments[r3];
    console.error(e2, ...i3);
  }, uninitializedWarning(t2) {
    s2.error("You must initialize PostHog before calling " + t2);
  }, createLogger: (t2, i3) => oi(e2 + " " + t2, i3) };
  return s2;
}, ai = oi("[PostHog.js]"), li = ai.createLogger, ui = li("[ExternalScriptsLoader]"), hi = (t2, e2, i2) => {
  if (t2.config.disable_external_dependency_loading) return ui.warn(e2 + " was requested but loading of external scripts is disabled."), i2("Loading of external scripts is disabled");
  var s2 = null == r ? void 0 : r.querySelectorAll("script");
  if (s2) {
    for (var n2, o2 = function() {
      if (s2[a2].src === e2) {
        var t3 = s2[a2];
        return t3.__posthog_loading_callback_fired ? { v: i2() } : (t3.addEventListener("load", ((e3) => {
          t3.__posthog_loading_callback_fired = true, i2(void 0, e3);
        })), t3.onerror = (t4) => i2(t4), { v: void 0 });
      }
    }, a2 = 0; s2.length > a2; a2++) if (n2 = o2()) return n2.v;
  }
  var l2 = () => {
    if (!r) return i2("document not found");
    var s3 = r.createElement("script");
    if (s3.type = "text/javascript", s3.crossOrigin = "anonymous", s3.src = e2, s3.onload = (t3) => {
      s3.__posthog_loading_callback_fired = true, i2(void 0, t3);
    }, s3.onerror = (t3) => i2(t3), t2.config.prepare_external_dependency_script && (s3 = t2.config.prepare_external_dependency_script(s3)), !s3) return i2("prepare_external_dependency_script returned null");
    if ("head" === t2.config.external_scripts_inject_target) r.head.appendChild(s3);
    else {
      var n3, o3 = r.querySelectorAll("body > script");
      o3.length > 0 ? null == (n3 = o3[0].parentNode) || n3.insertBefore(s3, o3[0]) : r.body.appendChild(s3);
    }
  };
  null != r && r.body ? l2() : null == r || r.addEventListener("DOMContentLoaded", l2);
};
h.__PosthogExtensions__ = h.__PosthogExtensions__ || {}, h.__PosthogExtensions__.loadExternalDependency = (t2, e2, i2) => {
  if ("remote-config" !== e2) {
    var r2;
    if (t2.config.strict_script_versioning) r2 = t2.requestRouter.endpointFor("assets", "/static/" + t2.version + "/" + e2 + ".js");
    else {
      var s2 = "/static/" + e2 + ".js?v=" + t2.version;
      if ("toolbar" === e2) {
        var n2 = 3e5;
        s2 = s2 + "&t=" + Math.floor(Date.now() / n2) * n2;
      }
      r2 = t2.requestRouter.endpointFor("assets", s2);
    }
    hi(t2, r2, i2);
  } else {
    var o2 = t2.requestRouter.endpointFor("assets", "/array/" + t2.config.token + "/config.js");
    hi(t2, o2, i2);
  }
}, h.__PosthogExtensions__.loadSiteApp = (t2, e2, i2) => {
  var r2 = t2.requestRouter.endpointFor("api", e2);
  hi(t2, r2, i2);
};
var di = "$people_distinct_id", vi = "$device_id", ci = "$device_model", pi = "__alias", fi = "__timers", _i = "$autocapture_disabled_server_side", gi = "$heatmaps_enabled_server_side", mi = "$exception_capture_enabled_server_side", yi = "$error_tracking_suppression_rules", bi = "$error_tracking_capture_extension_exceptions", wi = "$web_vitals_enabled_server_side", Ei = "$dead_clicks_enabled_server_side", xi = "$product_tours_enabled_server_side", Si = "$web_vitals_allowed_metrics", Ti = "$session_recording_remote_config", $i = "$replay_sample_rate", ki = "$replay_override_sampling", Ri = "$replay_override_linked_flag", Pi = "$replay_override_url_trigger", Ii = "$replay_override_event_trigger", Oi = "$sesid", Ci = "$session_is_sampled", Ai = "$enabled_feature_flags", Fi = "$active_feature_flags", Mi = "$early_access_features", Di = "$feature_flag_details", Li = "$feature_flag_payloads", Ni = "$feature_flag_request_id", Ui = "$override_feature_flags", ji = "$override_feature_flag_payloads", Bi = "$stored_person_properties", zi = "$stored_group_properties", Hi = "$surveys", qi = "$surveys_loaded_at", Vi = "$surveys_activated", Gi = "ph_product_tours", Wi = "$flag_call_reported", Yi = "$flag_call_reported_session_id", Ki = "$feature_flag_errors", Ji = "$feature_flag_evaluated_at", Qi = "$user_state", Xi = "$client_session_props", Zi = "$capture_rate_limit", tr = "$initial_campaign_params", er = "$initial_referrer_info", ir = "$initial_person_info", rr = "$epp", sr = "__POSTHOG_TOOLBAR__", nr = "$posthog_cookieless", or = "$sdk_debug_extensions_init_method", ar = "$sdk_debug_extensions_init_time_ms", lr = "$sdk_debug_recording_script_not_loaded", ur = "PostHog loadExternalDependency extension not found.", hr = "on_reject", dr = "always", vr = "anonymous", cr = "identified", pr = "identified_only", fr = "visibilitychange", _r = "beforeunload", gr = "$pageview", mr = "$pageleave", yr = "$identify", br = "$groupidentify";
function wr(t2, e2) {
  j(t2) && t2.forEach(e2);
}
function Er(t2, e2) {
  if (!Y(t2)) if (j(t2)) t2.forEach(e2);
  else if (X(t2)) t2.forEach(((t3, i3) => e2(t3, i3)));
  else for (var i2 in t2) N.call(t2, i2) && e2(t2[i2], i2);
}
var xr = function(t2) {
  for (var e2 = arguments.length, i2 = new Array(e2 > 1 ? e2 - 1 : 0), r2 = 1; e2 > r2; r2++) i2[r2 - 1] = arguments[r2];
  for (var s2 of i2) for (var n2 in s2) void 0 !== s2[n2] && (t2[n2] = s2[n2]);
  return t2;
};
function Sr(t2) {
  for (var e2 = Object.keys(t2), i2 = e2.length, r2 = new Array(i2); i2--; ) r2[i2] = [e2[i2], t2[e2[i2]]];
  return r2;
}
var Tr = function(t2) {
  try {
    return t2();
  } catch (t3) {
    return;
  }
}, $r = function(t2) {
  return function() {
    try {
      for (var e2 = arguments.length, i2 = new Array(e2), r2 = 0; e2 > r2; r2++) i2[r2] = arguments[r2];
      return t2.apply(this, i2);
    } catch (t3) {
      ai.critical("Implementation error. Please turn on debug mode and open a ticket on https://app.posthog.com/home#panel=support%3Asupport%3A."), ai.critical(t3);
    }
  };
}, kr = function(t2) {
  var e2 = {};
  return Er(t2, (function(t3, i2) {
    (V(t3) && t3.length > 0 || K(t3)) && (e2[i2] = t3);
  })), e2;
};
var Rr = ["herokuapp.com", "vercel.app", "netlify.app"];
function Pr(t2) {
  var e2 = null == t2 ? void 0 : t2.hostname;
  if (!V(e2)) return false;
  var i2 = e2.split(".").slice(-2).join(".");
  for (var r2 of Rr) if (i2 === r2) return false;
  return true;
}
function Ir(t2, e2, i2, r2) {
  var { capture: s2 = false, passive: n2 = true } = null != r2 ? r2 : {};
  null == t2 || t2.addEventListener(e2, i2, { capture: s2, passive: n2 });
}
function Or(t2) {
  return "ph_toolbar_internal" === t2.name;
}
Math.trunc || (Math.trunc = function(t2) {
  return 0 > t2 ? Math.ceil(t2) : Math.floor(t2);
}), Number.isInteger || (Number.isInteger = function(t2) {
  return K(t2) && isFinite(t2) && Math.floor(t2) === t2;
});
class Cr {
  constructor(t2) {
    if (this.bytes = t2, 16 !== t2.length) throw new TypeError("not 128-bit length");
  }
  static fromFieldsV7(t2, e2, i2, r2) {
    if (!Number.isInteger(t2) || !Number.isInteger(e2) || !Number.isInteger(i2) || !Number.isInteger(r2) || 0 > t2 || 0 > e2 || 0 > i2 || 0 > r2 || t2 > 281474976710655 || e2 > 4095 || i2 > 1073741823 || r2 > 4294967295) throw new RangeError("invalid field value");
    var s2 = new Uint8Array(16);
    return s2[0] = t2 / Math.pow(2, 40), s2[1] = t2 / Math.pow(2, 32), s2[2] = t2 / Math.pow(2, 24), s2[3] = t2 / Math.pow(2, 16), s2[4] = t2 / Math.pow(2, 8), s2[5] = t2, s2[6] = 112 | e2 >>> 8, s2[7] = e2, s2[8] = 128 | i2 >>> 24, s2[9] = i2 >>> 16, s2[10] = i2 >>> 8, s2[11] = i2, s2[12] = r2 >>> 24, s2[13] = r2 >>> 16, s2[14] = r2 >>> 8, s2[15] = r2, new Cr(s2);
  }
  toString() {
    for (var t2 = "", e2 = 0; this.bytes.length > e2; e2++) t2 = t2 + (this.bytes[e2] >>> 4).toString(16) + (15 & this.bytes[e2]).toString(16), 3 !== e2 && 5 !== e2 && 7 !== e2 && 9 !== e2 || (t2 += "-");
    if (36 !== t2.length) throw new Error("Invalid UUIDv7 was generated");
    return t2;
  }
  clone() {
    return new Cr(this.bytes.slice(0));
  }
  equals(t2) {
    return 0 === this.compareTo(t2);
  }
  compareTo(t2) {
    for (var e2 = 0; 16 > e2; e2++) {
      var i2 = this.bytes[e2] - t2.bytes[e2];
      if (0 !== i2) return Math.sign(i2);
    }
    return 0;
  }
}
class Ar {
  constructor() {
    this.S = 0, this.C = 0, this.I = new Dr();
  }
  generate() {
    var t2 = this.generateOrAbort();
    if (q(t2)) {
      this.S = 0;
      var e2 = this.generateOrAbort();
      if (q(e2)) throw new Error("Could not generate UUID after timestamp reset");
      return e2;
    }
    return t2;
  }
  generateOrAbort() {
    var t2 = Date.now();
    if (t2 > this.S) this.S = t2, this.M();
    else {
      if (this.S >= t2 + 1e4) return;
      this.C++, this.C > 4398046511103 && (this.S++, this.M());
    }
    return Cr.fromFieldsV7(this.S, Math.trunc(this.C / Math.pow(2, 30)), this.C & Math.pow(2, 30) - 1, this.I.nextUint32());
  }
  M() {
    this.C = 1024 * this.I.nextUint32() + (1023 & this.I.nextUint32());
  }
}
var Fr, Mr = (t2) => {
  if ("undefined" != typeof UUIDV7_DENY_WEAK_RNG && UUIDV7_DENY_WEAK_RNG) throw new Error("no cryptographically strong RNG available");
  for (var e2 = 0; t2.length > e2; e2++) t2[e2] = 65536 * Math.trunc(65536 * Math.random()) + Math.trunc(65536 * Math.random());
  return t2;
};
t && !q(t.crypto) && crypto.getRandomValues && (Mr = (t2) => crypto.getRandomValues(t2));
class Dr {
  constructor() {
    this.R = new Uint32Array(8), this.O = 1 / 0;
  }
  nextUint32() {
    return this.R.length > this.O || (Mr(this.R), this.O = 0), this.R[this.O++];
  }
}
var Lr = () => Nr().toString(), Nr = () => (Fr || (Fr = new Ar())).generate(), Ur = "", jr = /[a-z0-9][a-z0-9-]+\.[a-z]{2,}$/i;
var Br = { N: () => !!r, D(t2) {
  ai.error("cookieStore error: " + t2);
}, P(t2) {
  if (r) {
    try {
      for (var e2 = t2 + "=", i2 = r.cookie.split(";").filter(((t3) => t3.length)), s2 = 0; i2.length > s2; s2++) {
        for (var n2 = i2[s2]; " " == n2.charAt(0); ) n2 = n2.substring(1, n2.length);
        if (0 === n2.indexOf(e2)) return decodeURIComponent(n2.substring(e2.length, n2.length));
      }
    } catch (t3) {
    }
    return null;
  }
}, F(t2) {
  var e2;
  try {
    e2 = JSON.parse(Br.P(t2)) || {};
  } catch (t3) {
  }
  return e2;
}, q(t2, e2, i2, s2, n2) {
  if (!r) return false;
  try {
    var o2 = "", a2 = "", l2 = (function(t3, e3) {
      if (e3) {
        var i3 = (function(t4, e4) {
          if (void 0 === e4 && (e4 = r), Ur) return Ur;
          if (!e4) return "";
          if (["localhost", "127.0.0.1"].includes(t4)) return "";
          for (var i4 = t4.split("."), s4 = Math.min(i4.length, 8), n3 = "dmn_chk_" + Lr(); !Ur && s4--; ) {
            var o3 = i4.slice(s4).join("."), a3 = n3 + "=1;domain=." + o3 + ";path=/";
            e4.cookie = a3 + ";max-age=3", e4.cookie.includes(n3) && (e4.cookie = a3 + ";max-age=0", Ur = o3);
          }
          return Ur;
        })(t3);
        if (!i3) {
          var s3 = ((t4) => {
            var e4 = t4.match(jr);
            return e4 ? e4[0] : "";
          })(t3);
          s3 !== i3 && ai.info("Warning: cookie subdomain discovery mismatch", s3, i3), i3 = s3;
        }
        return i3 ? "; domain=." + i3 : "";
      }
      return "";
    })(r.location.hostname, s2);
    if (i2) {
      var u2 = /* @__PURE__ */ new Date();
      u2.setTime(u2.getTime() + 864e5 * i2), o2 = "; expires=" + u2.toUTCString();
    }
    n2 && (a2 = "; secure");
    var h2 = t2 + "=" + encodeURIComponent(JSON.stringify(e2)) + o2 + "; SameSite=Lax; path=/" + l2 + a2;
    return h2.length > 3686.4 && ai.warn("cookieStore warning: large cookie, len=" + h2.length), r.cookie = h2, true;
  } catch (t3) {
    return false;
  }
}, A(t2, e2) {
  if (null != r && r.cookie) try {
    Br.q(t2, "", -1, e2);
  } catch (t3) {
    return;
  }
} }, zr = null, Hr = { N() {
  if (!W(zr)) return zr;
  var e2 = true;
  if (q(t)) e2 = false;
  else try {
    var i2 = "__mplssupport__";
    Hr.q(i2, "xyz"), '"xyz"' !== Hr.P(i2) && (e2 = false), Hr.A(i2);
  } catch (t2) {
    e2 = false;
  }
  return e2 || ai.error("localStorage unsupported; falling back to cookie store"), zr = e2, e2;
}, D(t2) {
  ai.error("localStorage error: " + t2);
}, P(e2) {
  try {
    return null == t ? void 0 : t.localStorage.getItem(e2);
  } catch (t2) {
    Hr.D(t2);
  }
  return null;
}, F(t2) {
  try {
    return JSON.parse(Hr.P(t2)) || {};
  } catch (t3) {
  }
  return null;
}, q(e2, i2) {
  try {
    return null == t || t.localStorage.setItem(e2, JSON.stringify(i2)), true;
  } catch (t2) {
    Hr.D(t2);
  }
  return false;
}, A(e2) {
  try {
    null == t || t.localStorage.removeItem(e2);
  } catch (t2) {
    Hr.D(t2);
  }
} }, qr = [vi, "distinct_id", Oi, Ci, rr, ir, Qi], Vr = {}, Gr = { N: () => true, D(t2) {
  ai.error("memoryStorage error: " + t2);
}, P: (t2) => Vr[t2] || null, F: (t2) => Vr[t2] || null, q: (t2, e2) => (Vr[t2] = e2, true), A(t2) {
  delete Vr[t2];
} }, Wr = null, Yr = { N() {
  if (!W(Wr)) return Wr;
  if (Wr = true, q(t)) Wr = false;
  else try {
    var e2 = "__support__";
    Yr.q(e2, "xyz"), '"xyz"' !== Yr.P(e2) && (Wr = false), Yr.A(e2);
  } catch (t2) {
    Wr = false;
  }
  return Wr;
}, D(t2) {
  ai.error("sessionStorage error: ", t2);
}, P(e2) {
  try {
    return null == t ? void 0 : t.sessionStorage.getItem(e2);
  } catch (t2) {
    Yr.D(t2);
  }
  return null;
}, F(t2) {
  try {
    return JSON.parse(Yr.P(t2)) || null;
  } catch (t3) {
  }
  return null;
}, q(e2, i2) {
  try {
    return null == t || t.sessionStorage.setItem(e2, JSON.stringify(i2)), true;
  } catch (t2) {
    Yr.D(t2);
  }
  return false;
}, A(e2) {
  try {
    null == t || t.sessionStorage.removeItem(e2);
  } catch (t2) {
    Yr.D(t2);
  }
} };
class Kr {
  constructor(t2) {
    this._instance = t2;
  }
  get Se() {
    return this._instance.config;
  }
  get consent() {
    return this.kt() ? 0 : this.St;
  }
  isOptedOut() {
    return this.Se.cookieless_mode === dr || this.isRejected() || -1 === this.consent && this.Se.cookieless_mode === hr;
  }
  isOptedIn() {
    return !this.isOptedOut();
  }
  isExplicitlyOptedOut() {
    return 0 === this.consent;
  }
  isRejected() {
    return 0 === this.consent || -1 === this.consent && this.Se.opt_out_capturing_by_default;
  }
  optInOut(t2) {
    this.Ct.q(this.It, t2 ? 1 : 0, this.Se.cookie_expiration, this.Se.cross_subdomain_cookie, this.Se.secure_cookie);
  }
  reset() {
    this.Ct.A(this.It, this.Se.cross_subdomain_cookie);
  }
  get It() {
    var { token: t2, opt_out_capturing_cookie_prefix: e2, consent_persistence_name: i2 } = this._instance.config;
    return i2 || (e2 ? e2 + t2 : "__ph_opt_in_out_" + t2);
  }
  get St() {
    var t2 = this.Ct.P(this.It);
    return nt(t2) ? 1 : F(ot, t2) ? 0 : -1;
  }
  get Ct() {
    var t2 = this.Se.opt_out_capturing_persistence_type, e2 = "localStorage" === t2 ? Hr : Br;
    if (!this.Tt || this.Tt !== e2) {
      this.Tt = e2;
      var i2 = "localStorage" === t2 ? Br : Hr;
      i2.P(this.It) && (this.Tt.P(this.It) || this.optInOut(nt(i2.P(this.It))), i2.A(this.It, this.Se.cross_subdomain_cookie));
    }
    return this.Tt;
  }
  kt() {
    return !!this.Se.respect_dnt && [null == i ? void 0 : i.doNotTrack, null == i ? void 0 : i.msDoNotTrack, h.doNotTrack].some(((t2) => nt(t2)));
  }
}
var Jr = 1, Qr = 3, Xr = 11;
function Zr(t2) {
  return t2 instanceof Element && (t2.id === sr || !(null == t2.closest || !t2.closest(".toolbar-global-fade-container")));
}
function ts(t2) {
  return !!t2 && t2.nodeType === Jr;
}
function es(t2, e2) {
  return !!t2 && !!t2.tagName && t2.tagName.toLowerCase() === e2.toLowerCase();
}
function is(t2) {
  return !!t2 && t2.nodeType === Qr;
}
function rs(t2) {
  return !!t2 && t2.nodeType === Xr && ts(t2.host);
}
function ss(t2) {
  return t2 ? M(t2).split(/\s+/) : [];
}
function ns(e2) {
  var i2 = null == t ? void 0 : t.location.href;
  return !!(i2 && e2 && e2.some(((t2) => i2.match(t2))));
}
function os(t2) {
  var e2 = "";
  switch (typeof t2.className) {
    case "string":
      e2 = t2.className;
      break;
    case "object":
      e2 = (t2.className && "baseVal" in t2.className ? t2.className.baseVal : null) || t2.getAttribute("class") || "";
      break;
    default:
      e2 = "";
  }
  return ss(e2);
}
function as(t2) {
  return Y(t2) ? null : M(t2).split(/(\s+)/).filter(((t3) => Is(t3))).join("").replace(/[\r\n]/g, " ").replace(/[ ]+/g, " ").substring(0, 255);
}
function ls(t2) {
  var e2 = "";
  return Es(t2) && !xs(t2) && t2.childNodes && t2.childNodes.length && Er(t2.childNodes, (function(t3) {
    var i2;
    is(t3) && t3.textContent && (e2 += null !== (i2 = as(t3.textContent)) && void 0 !== i2 ? i2 : "");
  })), M(e2);
}
function us(t2) {
  return q(t2.target) ? t2.srcElement || null : null != (e2 = t2.target) && e2.shadowRoot ? t2.composedPath()[0] || null : t2.target || null;
  var e2;
}
var hs = ["a", "button", "form", "input", "select", "textarea", "label"];
function ds(t2, e2) {
  if (q(e2)) return true;
  var i2, r2 = function(t3) {
    if (e2.some(((e3) => (function(t4, e4) {
      var i3 = t4.matches || t4.matchesSelector || t4.msMatchesSelector || t4.mozMatchesSelector || t4.webkitMatchesSelector || t4.oMatchesSelector;
      try {
        return !!i3 && i3.call(t4, e4);
      } catch (t5) {
        return false;
      }
    })(t3, e3)))) return { v: true };
  };
  for (var s2 of t2) if (i2 = r2(s2)) return i2.v;
  return false;
}
function vs(t2) {
  var e2 = t2.parentNode;
  return !(!e2 || !ts(e2)) && e2;
}
var cs = [".ph-no-autocapture", "[data-ph-no-autocapture]"], ps = ["next", "previous", "prev", ">", "<"], fs = [...ps, "+", "-", "−", "–"], _s = (t2, e2) => /[a-z0-9]/i.test(e2) ? t2.includes(e2) : t2 === e2, gs = [".ph-no-rageclick", ".ph-no-capture"], ms = ["", "text", "search", "email", "password", "url", "tel", "number"];
function ys(e2, i2) {
  if (!t || bs(e2)) return false;
  var r2, s2, n2, o2, a2;
  if (Q(i2) ? (r2 = !!i2 && gs, s2 = void 0, n2 = false) : (r2 = null !== (o2 = null == i2 ? void 0 : i2.css_selector_ignorelist) && void 0 !== o2 ? o2 : gs, s2 = null == i2 ? void 0 : i2.content_ignorelist, n2 = null !== (a2 = null == i2 ? void 0 : i2.ignore_text_selection) && void 0 !== a2 && a2), false === r2) return false;
  if (n2 && (function(t2) {
    return !(!t2 || !ts(t2)) && (!!es(t2, "textarea") || (es(t2, "input") ? F(ms, (t2.getAttribute("type") || "").toLowerCase()) : (function(t3) {
      if (t3.isContentEditable) return true;
      var e3 = null == t3.getAttribute ? void 0 : t3.getAttribute("contenteditable");
      return "true" === e3 || "" === e3;
    })(t2)));
  })(e2)) return false;
  var { targetElementList: l2 } = ws(e2, false);
  return !(function(t2, e3) {
    if (false === t2 || q(t2)) return false;
    var i3;
    if (true === t2) i3 = ps;
    else {
      if (!j(t2)) return false;
      if (t2.length > 10) return ai.error("[PostHog] content_ignorelist array cannot exceed 10 items. Use css_selector_ignorelist for more complex matching."), false;
      i3 = t2.map(((t3) => t3.toLowerCase()));
    }
    return e3.some(((t3) => {
      var { safeText: e4, ariaLabel: r3 } = t3;
      return i3.some(((t4) => _s(e4, t4) || _s(r3, t4)));
    }));
  })(s2, l2.map(((t2) => {
    var e3;
    return { safeText: ls(t2).toLowerCase(), ariaLabel: (null == (e3 = t2.getAttribute("aria-label")) ? void 0 : e3.toLowerCase().trim()) || "" };
  }))) && !ds(l2, r2);
}
var bs = (t2) => !t2 || es(t2, "html") || !ts(t2), ws = (e2, i2) => {
  if (!t || bs(e2)) return { parentIsUsefulElement: false, targetElementList: [] };
  for (var r2 = false, s2 = [e2], n2 = e2; n2.parentNode && !es(n2, "body"); ) if (rs(n2.parentNode)) s2.push(n2.parentNode.host), n2 = n2.parentNode.host;
  else {
    var o2 = vs(n2);
    if (!o2) break;
    if (i2 || hs.indexOf(o2.tagName.toLowerCase()) > -1) r2 = true;
    else {
      var a2 = t.getComputedStyle(o2);
      a2 && "pointer" === a2.getPropertyValue("cursor") && (r2 = true);
    }
    s2.push(o2), n2 = o2;
  }
  return { parentIsUsefulElement: r2, targetElementList: s2 };
};
function Es(t2) {
  for (var e2 = t2; e2.parentNode && !es(e2, "body"); e2 = e2.parentNode) {
    var i2 = os(e2);
    if (F(i2, "ph-sensitive") || F(i2, "ph-no-capture")) return false;
  }
  if (F(os(t2), "ph-include")) return true;
  var r2 = t2.type || "";
  if (V(r2)) switch (r2.toLowerCase()) {
    case "hidden":
    case "password":
      return false;
  }
  var s2 = t2.name || t2.id || "";
  return !V(s2) || !/^cc|cardnum|ccnum|creditcard|csc|cvc|cvv|exp|pass|pwd|routing|seccode|securitycode|securitynum|socialsec|socsec|ssn/i.test(s2.replace(/[^a-zA-Z0-9]/g, ""));
}
function xs(t2) {
  return !!(es(t2, "input") && !["button", "checkbox", "submit", "reset"].includes(t2.type) || es(t2, "select") || es(t2, "textarea") || "true" === t2.getAttribute("contenteditable"));
}
var Ss = "(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11})", Ts = new RegExp("^(?:" + Ss + ")$"), $s = new RegExp(Ss), ks = "\\d{3}-?\\d{2}-?\\d{4}", Rs = new RegExp("^(" + ks + ")$"), Ps = new RegExp("(" + ks + ")");
function Is(t2, e2) {
  if (void 0 === e2 && (e2 = true), Y(t2)) return false;
  if (V(t2)) {
    if (t2 = M(t2), (e2 ? Ts : $s).test((t2 || "").replace(/[- ]/g, ""))) return false;
    if ((e2 ? Rs : Ps).test(t2)) return false;
  }
  return true;
}
function Os(t2) {
  var e2 = ls(t2);
  return Is(e2 = (e2 + " " + Cs(t2)).trim()) ? e2 : "";
}
function Cs(t2) {
  var e2 = "";
  return t2 && t2.childNodes && t2.childNodes.length && Er(t2.childNodes, (function(t3) {
    var i2;
    if (t3 && "span" === (null == (i2 = t3.tagName) ? void 0 : i2.toLowerCase())) try {
      var r2 = ls(t3);
      e2 = (e2 + " " + r2).trim(), t3.childNodes && t3.childNodes.length && (e2 = (e2 + " " + Cs(t3)).trim());
    } catch (t4) {
      ai.error("[AutoCapture]", t4);
    }
  })), e2;
}
function As(t2) {
  return t2.replace(/"|\\"/g, '\\"');
}
function Fs(t2) {
  var e2 = t2.attr__class;
  return e2 ? j(e2) ? e2 : ss(e2) : void 0;
}
var Ms = li("[Dead Clicks]"), Ds = () => true, Ls = (t2) => {
  var e2, i2 = !(null == (e2 = t2.instance.persistence) || !e2.get_property(Ei)), r2 = t2.instance.config.capture_dead_clicks;
  return Q(r2) ? r2 : !!z(r2) || i2;
};
class Ns {
  get lazyLoadedDeadClicksAutocapture() {
    return this.Et;
  }
  constructor(t2, e2, i2) {
    this.instance = t2, this.isEnabled = e2, this.onCapture = i2, this.startIfEnabledOrStop();
  }
  onRemoteConfig(t2) {
    "captureDeadClicks" in t2 && (this.instance.persistence && this.instance.persistence.register({ [Ei]: t2.captureDeadClicks }), this.startIfEnabledOrStop());
  }
  startIfEnabledOrStop() {
    this.isEnabled(this) ? this.Mt((() => {
      this.Pt();
    })) : this.stop();
  }
  Mt(t2) {
    var e2, i2;
    null != (e2 = h.__PosthogExtensions__) && e2.initDeadClicksAutocapture ? t2() : null == (i2 = h.__PosthogExtensions__) || null == i2.loadExternalDependency || i2.loadExternalDependency(this.instance, "dead-clicks-autocapture", ((e3) => {
      e3 ? Ms.error("failed to load script", e3) : t2();
    }));
  }
  Pt() {
    var t2;
    if (r) {
      if (!this.Et && null != (t2 = h.__PosthogExtensions__) && t2.initDeadClicksAutocapture) {
        var e2 = z(this.instance.config.capture_dead_clicks) ? this.instance.config.capture_dead_clicks : {};
        e2.__onCapture = this.onCapture, this.Et = h.__PosthogExtensions__.initDeadClicksAutocapture(this.instance, e2), this.Et.start(r), Ms.info("starting...");
      }
    } else Ms.error("`document` not found. Cannot start.");
  }
  stop() {
    this.Et && (this.Et.stop(), this.Et = void 0, Ms.info("stopping..."));
  }
}
var Us = li("[SegmentIntegration]");
var js = "posthog-js";
function Bs(t2, e2) {
  var { organization: i2, projectId: r2, prefix: s2, severityAllowList: n2 = ["error"], sendExceptionsToPostHog: o2 = true } = void 0 === e2 ? {} : e2;
  return (e3) => {
    var a2, l2, u2, h2, d2;
    if ("*" !== n2 && !n2.includes(e3.level) || !t2.__loaded) return e3;
    e3.tags || (e3.tags = {});
    var v2 = t2.requestRouter.endpointFor("ui", "/project/" + t2.config.token + "/person/" + t2.get_distinct_id());
    e3.tags["PostHog Person URL"] = v2, t2.sessionRecordingStarted() && (e3.tags["PostHog Recording URL"] = t2.get_session_replay_url({ withTimestamp: true }));
    var c2, p2 = (null == (a2 = e3.exception) ? void 0 : a2.values) || [], _2 = p2.map(((t3) => f({}, t3, { stacktrace: t3.stacktrace ? f({}, t3.stacktrace, { type: "raw", frames: (t3.stacktrace.frames || []).map(((t4) => f({}, t4, { platform: "web:javascript" }))) }) : void 0 }))), g2 = { $exception_message: (null == (l2 = p2[0]) ? void 0 : l2.value) || e3.message, $exception_type: null == (u2 = p2[0]) ? void 0 : u2.type, $exception_level: e3.level, $exception_list: _2, $sentry_event_id: e3.event_id, $sentry_exception: e3.exception, $sentry_exception_message: (null == (h2 = p2[0]) ? void 0 : h2.value) || e3.message, $sentry_exception_type: null == (d2 = p2[0]) ? void 0 : d2.type, $sentry_tags: e3.tags };
    return i2 && r2 && (g2.$sentry_url = (s2 || "https://sentry.io/organizations/") + i2 + "/issues/?project=" + r2 + "&query=" + e3.event_id), o2 && (null == (c2 = t2.exceptions) || c2.sendExceptionEvent(g2)), e3;
  };
}
class zs {
  constructor(t2, e2, i2, r2, s2, n2) {
    this.name = js, this.setupOnce = function(o2) {
      o2(Bs(t2, { organization: e2, projectId: i2, prefix: r2, severityAllowList: s2, sendExceptionsToPostHog: null == n2 || n2 }));
    };
  }
}
class Hs {
  constructor(t2) {
    this.Rt = (t3, e2, i2) => {
      i2 && (i2.noSessionId || i2.activityTimeout || i2.sessionPastMaximumLength || i2.crossTabAdoption) && (ai.info("[PageViewManager] Session rotated, clearing pageview state", { sessionId: t3, changeReason: i2 }), this.Ot = void 0, this._instance.scrollManager.resetContext());
    }, this._instance = t2, this.Lt();
  }
  Lt() {
    var t2;
    this.Ft = null == (t2 = this._instance.sessionManager) ? void 0 : t2.onSessionId(this.Rt);
  }
  destroy() {
    var t2;
    null == (t2 = this.Ft) || t2.call(this), this.Ft = void 0;
  }
  doPageView(e2, i2) {
    var r2, s2 = this.At(e2, i2);
    return this.Ot = { pathname: null !== (r2 = null == t ? void 0 : t.location.pathname) && void 0 !== r2 ? r2 : "", pageViewId: i2, timestamp: e2 }, this._instance.scrollManager.resetContext(), s2;
  }
  doPageLeave(t2) {
    var e2;
    return this.At(t2, null == (e2 = this.Ot) ? void 0 : e2.pageViewId);
  }
  doEvent() {
    var t2;
    return { $pageview_id: null == (t2 = this.Ot) ? void 0 : t2.pageViewId };
  }
  At(t2, e2) {
    var i2 = this.Ot;
    if (!i2) return { $pageview_id: e2 };
    var r2 = { $pageview_id: e2, $prev_pageview_id: i2.pageViewId }, s2 = this._instance.scrollManager.getContext();
    if (s2 && !this._instance.config.disable_scroll_properties) {
      var { maxScrollHeight: n2, lastScrollY: o2, maxScrollY: a2, maxContentHeight: l2, lastContentY: u2, maxContentY: h2 } = s2;
      if (!(q(n2) || q(o2) || q(a2) || q(l2) || q(u2) || q(h2))) {
        n2 = Math.ceil(n2), o2 = Math.ceil(o2), a2 = Math.ceil(a2), l2 = Math.ceil(l2), u2 = Math.ceil(u2), h2 = Math.ceil(h2);
        var d2 = n2 > 1 ? at(o2 / n2, 0, 1, ai) : 1, v2 = n2 > 1 ? at(a2 / n2, 0, 1, ai) : 1, c2 = l2 > 1 ? at(u2 / l2, 0, 1, ai) : 1, p2 = l2 > 1 ? at(h2 / l2, 0, 1, ai) : 1;
        r2 = xr(r2, { $prev_pageview_last_scroll: o2, $prev_pageview_last_scroll_percentage: d2, $prev_pageview_max_scroll: a2, $prev_pageview_max_scroll_percentage: v2, $prev_pageview_last_content: u2, $prev_pageview_last_content_percentage: c2, $prev_pageview_max_content: h2, $prev_pageview_max_content_percentage: p2 });
      }
    }
    return i2.pathname && (r2.$prev_pageview_pathname = i2.pathname), i2.timestamp && (r2.$prev_pageview_duration = (t2.getTime() - i2.timestamp.getTime()) / 1e3), r2;
  }
}
var qs = ["flags", "surveys"], Vs = { [di]: { exposure: "hidden" }, [pi]: { exposure: "hidden" }, __cmpns: { exposure: "hidden" }, [fi]: { exposure: "hidden" }, [_i]: { exposure: "event" }, [gi]: { exposure: "hidden" }, [mi]: { exposure: "event" }, [yi]: { exposure: "hidden" }, [bi]: { exposure: "event" }, [wi]: { exposure: "event" }, [Ei]: { exposure: "event" }, [xi]: { exposure: "hidden" }, [Si]: { exposure: "event" }, [Ti]: { exposure: "hidden" }, $session_recording_enabled_server_side: { exposure: "hidden" }, [Oi]: { exposure: "hidden" }, [Ci]: { exposure: "event" }, [$i]: { exposure: "event", shouldSkipFromEventProperties: (t2) => W(t2) }, $session_past_minimum_duration: { exposure: "event" }, $session_recording_url_trigger_activated_session: { exposure: "event" }, $session_recording_event_trigger_activated_session: { exposure: "event" }, $debug_first_full_snapshot_timestamp: { exposure: "event" }, $sess_rec_flush_size: { exposure: "hidden" }, [Ai]: { exposure: "derived", storageGroup: "flags", shouldSkipFromEventProperties: (t2, e2) => e2(), transformToEventProperties(t2) {
  if (!z(t2)) return {};
  for (var e2 = {}, i2 = Object.keys(t2), r2 = 0; i2.length > r2; r2++) e2["$feature/" + i2[r2]] = t2[i2[r2]];
  return e2;
} }, [Fi]: { exposure: "event", storageGroup: "flags" }, [Mi]: { exposure: "hidden" }, [Di]: { exposure: "hidden", storageGroup: "flags" }, [Li]: { exposure: "event", storageGroup: "flags" }, [Ni]: { exposure: "event", storageGroup: "flags", volatile: true }, [Ui]: { exposure: "event" }, [ji]: { exposure: "hidden" }, [Bi]: { exposure: "hidden" }, [zi]: { exposure: "hidden" }, [Hi]: { exposure: "hidden", storageGroup: "surveys" }, [qi]: { exposure: "hidden", storageGroup: "surveys", volatile: true }, [Vi]: { exposure: "event" }, [Gi]: { exposure: "hidden" }, $product_tours_activated: { exposure: "hidden" }, $conversations_widget_session_id: { exposure: "event" }, $conversations_ticket_id: { exposure: "event" }, $conversations_widget_state: { exposure: "event" }, $conversations_user_traits: { exposure: "event" }, [Wi]: { exposure: "hidden" }, [Yi]: { exposure: "hidden" }, [Ki]: { exposure: "hidden" }, [Ji]: { exposure: "hidden", storageGroup: "flags", volatile: true }, [Qi]: { exposure: "hidden" }, [Xi]: { exposure: "hidden" }, [Zi]: { exposure: "hidden" }, [tr]: { exposure: "hidden" }, [er]: { exposure: "hidden" }, [ir]: { exposure: "hidden" }, [rr]: { exposure: "hidden" }, [ki]: { exposure: "event" }, [Ri]: { exposure: "event" }, [Pi]: { exposure: "event" }, [Ii]: { exposure: "event" }, [or]: { exposure: "event" }, [ar]: { exposure: "event" }, [lr]: { exposure: "event" }, $sdk_debug_replay_event_trigger_status: { exposure: "event" }, $sdk_debug_replay_linked_flag_trigger_status: { exposure: "event" }, $sdk_debug_replay_matched_recording_trigger_groups: { exposure: "event" }, $sdk_debug_replay_remote_trigger_matching_config: { exposure: "event" }, $sdk_debug_replay_trigger_groups_count: { exposure: "event" }, $sdk_debug_replay_url_trigger_status: { exposure: "event" }, $session_recording_start_reason: { exposure: "event" } }, Gs = [["$posthog_sr_group_event_trigger_", { exposure: "hidden" }], ["$posthog_sr_group_url_trigger_", { exposure: "hidden" }], ["$posthog_sr_group_sampling_", { exposure: "hidden" }]], Ws = (t2) => {
  var e2 = Vs[t2];
  if (e2) return e2;
  for (var [i2, r2] of Gs) if (0 === t2.indexOf(i2)) return r2;
}, Ys = (t2) => {
  var e2 = null == r ? void 0 : r.createElement("a");
  return q(e2) ? null : (e2.href = t2, e2);
}, Ks = function(t2, e2) {
  for (var i2, r2 = ((t2.split("#")[0] || "").split(/\?(.*)/)[1] || "").replace(/^\?+/g, "").split("&"), s2 = 0; r2.length > s2; s2++) {
    var n2 = r2[s2].split("=");
    if (n2[0] === e2) {
      i2 = n2;
      break;
    }
  }
  if (!j(i2) || 2 > i2.length) return "";
  var o2 = i2[1];
  try {
    o2 = decodeURIComponent(o2);
  } catch (t3) {
    ai.error("Skipping decoding for malformed query param: " + o2);
  }
  return o2.replace(/\+/g, " ");
}, Js = function(t2, e2, i2) {
  if (!t2 || !e2 || !e2.length) return t2;
  for (var r2 = t2.split("#"), s2 = r2[1], n2 = (r2[0] || "").split("?"), o2 = n2[1], a2 = n2[0], l2 = (o2 || "").split("&"), u2 = [], h2 = 0; l2.length > h2; h2++) {
    var d2 = l2[h2].split("=");
    j(d2) && (e2.includes(d2[0]) ? u2.push(d2[0] + "=" + i2) : u2.push(l2[h2]));
  }
  var v2 = a2;
  return null != o2 && (v2 += "?" + u2.join("&")), null != s2 && (v2 += "#" + s2), v2;
}, Qs = function(t2, e2) {
  var i2 = t2.match(new RegExp(e2 + "=([^&]*)"));
  return i2 ? i2[1] : null;
}, Xs = "https?://(.*)", Zs = ["gclid", "gclsrc", "dclid", "gbraid", "wbraid", "fbclid", "msclkid", "twclid", "li_fat_id", "igshid", "ttclid", "rdt_cid", "epik", "qclid", "sccid", "irclid", "_kx"], tn = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gad_source", "mc_cid", ...Zs], en = "<masked>", rn = ["li_fat_id"];
function sn(t2, e2, i2) {
  if (!r) return {};
  var s2, n2 = e2 ? [...Zs, ...i2 || []] : [], o2 = nn(Js(r.URL, n2, en), t2), a2 = (s2 = {}, Er(rn, (function(t3) {
    var e3 = Br.P(t3);
    s2[t3] = e3 || null;
  })), s2);
  return xr(a2, o2);
}
function nn(t2, e2) {
  var i2 = tn.concat(e2 || []), r2 = {};
  return Er(i2, (function(e3) {
    var i3 = Ks(t2, e3);
    r2[e3] = i3 || null;
  })), r2;
}
function on(t2) {
  var e2 = (function(t3) {
    return t3 ? 0 === t3.search(Xs + "google.([^/?]*)") ? "google" : 0 === t3.search(Xs + "bing.com") ? "bing" : 0 === t3.search(Xs + "yahoo.com") ? "yahoo" : 0 === t3.search(Xs + "duckduckgo.com") ? "duckduckgo" : null : null;
  })(t2), i2 = "yahoo" != e2 ? "q" : "p", s2 = {};
  if (!W(e2)) {
    s2.$search_engine = e2;
    var n2 = r ? Ks(r.referrer, i2) : "";
    n2.length && (s2.ph_keyword = n2);
  }
  return s2;
}
function an() {
  return navigator.language || navigator.userLanguage;
}
var ln = "$direct";
function un() {
  return (null == r ? void 0 : r.referrer) || ln;
}
function hn(t2, e2, i2) {
  void 0 === i2 && (i2 = false);
  var r2 = t2 ? [...Zs, ...e2 || []] : [], n2 = i2 ? fe(null == s ? void 0 : s.href) : null == s ? void 0 : s.href, o2 = null == n2 ? void 0 : n2.substring(0, 1e3);
  return { r: un().substring(0, 1e3), u: o2 ? Js(o2, r2, en) : void 0 };
}
function dn(t2, e2) {
  var i2;
  void 0 === e2 && (e2 = false);
  var { r: r2, u: s2 } = t2, n2 = e2 ? fe(s2) : s2, o2 = { $referrer: r2, $referring_domain: null == r2 ? void 0 : r2 == ln ? ln : null == (i2 = Ys(r2)) ? void 0 : i2.host };
  if (n2) {
    o2.$current_url = n2;
    var a2 = Ys(n2);
    o2.$host = null == a2 ? void 0 : a2.host, o2.$pathname = null == a2 ? void 0 : a2.pathname;
    var l2 = nn(n2);
    xr(o2, l2);
  }
  if (r2) {
    var u2 = on(r2);
    xr(o2, u2);
  }
  return o2;
}
function vn() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (t2) {
    return;
  }
}
function cn() {
  try {
    return (/* @__PURE__ */ new Date()).getTimezoneOffset();
  } catch (t2) {
    return;
  }
}
var pn = { flags: Ji, surveys: qi }, fn = ["cookie", "localstorage", "localstorage+cookie", "sessionstorage", "memory"], _n = "main";
class gn {
  constructor(e2, i2, r2) {
    if (void 0 === r2 && (r2 = true), this.$t = {}, this.Dt = false, this.Nt = false, this.Se = e2, this.qt = r2, this.props = {}, this.jt = false, this.Bt = ((t2) => {
      var e3 = "";
      return t2.token && (e3 = t2.token.replace(/\+/g, "PL").replace(/\//g, "SL").replace(/=/g, "EQ")), t2.persistence_name ? "ph_" + t2.persistence_name : "ph_" + e3 + "_posthog";
    })(e2), this.Ct = this.Ht(e2), this.Nt = this.Ut(e2), this.load(), e2.debug && ai.info("Persistence loaded", e2.persistence, f({}, this.props)), this.update_config(e2, e2, i2), this.save(), t) {
      var s2 = () => this.flush();
      Ir(t, "beforeunload", s2, { capture: false }), Ir(t, "pagehide", s2, { capture: false });
    }
  }
  zt() {
    var t2, e2 = null == (t2 = this.Se) ? void 0 : t2.persistence_save_debounce_ms;
    return K(e2) && e2 > 0 ? e2 : 0;
  }
  isDisabled() {
    return !!this.Vt;
  }
  Ht(e2) {
    -1 === fn.indexOf(e2.persistence.toLowerCase()) && (ai.critical("Unknown persistence type " + e2.persistence + "; falling back to localStorage+cookie"), e2.persistence = "localStorage+cookie");
    var i2, r2 = (function(e3, i3) {
      void 0 === e3 && (e3 = []), void 0 === i3 && (i3 = false);
      var r3 = [...qr, ...e3];
      return f({}, Hr, { F(t2) {
        try {
          var e4 = {};
          try {
            e4 = Br.F(t2) || {};
          } catch (t3) {
          }
          var r4, s3 = JSON.parse(Hr.P(t2) || "{}");
          if (i3) {
            var n3 = {};
            for (var o2 in e4) {
              var a2 = e4[o2];
              W(a2) || "" === a2 || (n3[o2] = a2);
            }
            r4 = xr(s3, n3);
          } else r4 = xr(e4, s3);
          return Hr.q(t2, r4), r4;
        } catch (t3) {
        }
        return null;
      }, q(t2, e4, i4, s3, n3, o2) {
        var a2 = Hr.q(t2, e4, void 0, void 0, o2);
        try {
          var l2 = {};
          r3.forEach(((t3) => {
            e4[t3] && (l2[t3] = e4[t3]);
          })), Object.keys(l2).length && Br.q(t2, l2, i4, s3, n3, o2);
        } catch (t3) {
          Hr.D(t3);
        }
        return a2;
      }, A(e4, i4) {
        try {
          null == t || t.localStorage.removeItem(e4), Br.A(e4, i4);
        } catch (t2) {
          Hr.D(t2);
        }
      } });
    })(e2.cookie_persisted_properties || [], e2.__preview_cookie_wins_on_conflict || false), s2 = false, n2 = e2.persistence.toLowerCase();
    return "localstorage" === n2 && Hr.N() ? (i2 = Hr, s2 = true) : "localstorage+cookie" === n2 && r2.N() ? (i2 = r2, s2 = true) : "sessionstorage" === n2 && Yr.N() ? i2 = Yr : "memory" === n2 ? i2 = Gr : "cookie" === n2 ? i2 = Br : r2.N() ? (i2 = r2, s2 = true) : i2 = Br, this.Dt = s2, i2;
  }
  Wt(t2) {
    return this.Bt + "__" + t2;
  }
  Ut(t2) {
    return this.Dt && !!t2.split_storage;
  }
  Gt(t2) {
    var e2 = null != t2 ? t2 : this.Se.feature_flag_cache_ttl_ms;
    if (!e2 || 0 >= e2) return false;
    var i2 = this.props[Ji];
    return !i2 || "number" != typeof i2 || Date.now() - i2 > e2;
  }
  properties() {
    var t2 = {};
    return Er(this.props, ((e2, i2) => {
      var r2 = Ws(i2);
      if ("derived" === (null == r2 ? void 0 : r2.exposure)) {
        if (null != r2.shouldSkipFromEventProperties && r2.shouldSkipFromEventProperties(e2, i2 === Ai ? () => this.Gt() : () => false)) return;
        r2.transformToEventProperties && xr(t2, r2.transformToEventProperties(e2));
      } else if (!r2 || "event" === r2.exposure) {
        if (null != r2 && null != r2.shouldSkipFromEventProperties && r2.shouldSkipFromEventProperties(e2, (() => false))) return;
        t2[i2] = e2;
      }
    })), t2;
  }
  load() {
    if (!this.Vt) {
      var t2 = this.Ct.F(this.Bt);
      t2 && (this.props = xr({}, t2)), this.Nt && this.Zt();
    }
  }
  Zt() {
    for (var t2 of qs) {
      var e2 = Hr.F(this.Wt(t2));
      if (e2 && !H(e2)) {
        var i2 = this.Qt(t2);
        i2.persisted = true, this.Jt(t2) || (i2.fingerprint = this.Yt(e2, t2)), this.Kt(t2, e2) || xr(this.props, e2);
      }
    }
  }
  Jt(t2) {
    return Object.keys(this.props).some(((e2) => {
      var i2;
      return (null == (i2 = Ws(e2)) ? void 0 : i2.storageGroup) === t2;
    }));
  }
  Kt(t2, e2) {
    var i2 = pn[t2];
    if (!i2) return false;
    var r2 = e2[i2], s2 = this.props[i2];
    return K(r2) && K(s2) && s2 > r2;
  }
  refreshKey(t2) {
    var e2;
    if (!this.Vt) {
      var i2 = this.Nt ? null == (e2 = Ws(t2)) ? void 0 : e2.storageGroup : void 0, r2 = i2 ? Hr.F(this.Wt(i2)) : this.Ct.F(this.Bt);
      if (r2 && t2 in r2) this.Xt(t2, r2[t2]);
      else {
        if (i2) {
          var s2 = this.Ct.F(this.Bt);
          if (s2 && t2 in s2) return void this.Xt(t2, s2[t2]);
        }
        this.er(t2);
      }
    }
  }
  save() {
    if (!this.Vt) {
      var t2 = this.zt();
      t2 > 0 ? q(this.tr) && (this.tr = setTimeout((() => {
        this.tr = void 0, this.rr();
      }), t2)) : this.rr();
    }
  }
  flush() {
    q(this.tr) || (clearTimeout(this.tr), this.tr = void 0, this.rr());
  }
  rr() {
    this.Vt || (this.Nt ? this.ir() : this.nr(this.Ct, this.Bt, this.props, _n));
  }
  ir() {
    var { main: t2, groups: e2 } = this.sr();
    for (var i2 of (this.nr(this.Ct, this.Bt, t2, _n), qs)) {
      var r2, s2 = e2[i2];
      (!H(s2) || null != (r2 = this.$t[i2]) && r2.persisted) && this.nr(Hr, this.Wt(i2), s2, i2);
    }
  }
  sr() {
    var t2 = {}, e2 = {};
    for (var i2 of qs) e2[i2] = {};
    return Er(this.props, ((i3, r2) => {
      var s2, n2 = null == (s2 = Ws(r2)) ? void 0 : s2.storageGroup;
      n2 ? e2[n2][r2] = i3 : t2[r2] = i3;
    })), { main: t2, groups: e2 };
  }
  Yt(t2, e2) {
    if (e2 === _n) return JSON.stringify(t2) + "|" + this.ar + "|" + this.lr + "|" + this.ur;
    var i2 = {};
    return Er(t2, ((t3, e3) => {
      var r2;
      i2[e3] = null != (r2 = Ws(e3)) && r2.volatile ? "__volatile__" : t3;
    })), JSON.stringify(i2);
  }
  nr(t2, e2, i2, r2) {
    var s2 = this.Qt(r2);
    if (r2 === _n || s2.dirty || q(s2.fingerprint)) {
      var n2;
      try {
        if ((n2 = this.Yt(i2, r2)) === s2.fingerprint) return void (s2.dirty = false);
      } catch (t3) {
        n2 = void 0;
      }
      t2.q(e2, i2, this.ar, this.lr, this.ur, this.Se.debug) ? (s2.dirty = false, r2 !== _n && (s2.persisted = true), q(n2) || (s2.fingerprint = n2)) : this.Se.debug && ai.warn('failed to persist storage entry "' + e2 + '"; will retry on next save');
    }
  }
  remove(t2) {
    var { keepGroupEntries: e2 = false } = void 0 === t2 ? {} : t2;
    if (q(this.tr) || (clearTimeout(this.tr), this.tr = void 0), this.Ct.A(this.Bt, false), this.Ct.A(this.Bt, true), !e2 && this.qt) for (var i2 of qs) Hr.A(this.Wt(i2));
    e2 ? delete this.$t[_n] : this.$t = {};
  }
  clear() {
    this.remove(), this.props = {};
  }
  register_once(t2, e2, i2) {
    if (z(t2)) {
      q(e2) && (e2 = "None"), this.ar = q(i2) ? this.hr : i2;
      var r2 = false;
      if (Er(t2, ((t3, i3) => {
        this.props.hasOwnProperty(i3) && this.props[i3] !== e2 || (this.Xt(i3, t3), r2 = true);
      })), r2) return this.save(), true;
    }
    return false;
  }
  register(t2, e2) {
    if (z(t2)) {
      this.ar = q(e2) ? this.hr : e2;
      var i2 = false;
      if (Er(t2, ((e3, r2) => {
        t2.hasOwnProperty(r2) && this.props[r2] !== e3 && (this.Xt(r2, e3), i2 = true);
      })), i2) return this.save(), true;
    }
    return false;
  }
  unregister(t2) {
    t2 in this.props && (this.er(t2), this.save());
  }
  update_campaign_params() {
    if (!this.jt) {
      var t2 = sn(this.Se.custom_campaign_params, this.Se.mask_personal_data_properties, this.Se.custom_personal_data_properties);
      H(kr(t2)) || this.register(t2), this.jt = true;
    }
  }
  update_search_keyword() {
    var t2;
    this.register((t2 = null == r ? void 0 : r.referrer) ? on(t2) : {});
  }
  update_referrer_info() {
    var t2;
    this.register_once({ $referrer: un(), $referring_domain: null != r && r.referrer && (null == (t2 = Ys(r.referrer)) ? void 0 : t2.host) || ln }, void 0);
  }
  set_initial_person_info() {
    this.props[tr] || this.props[er] || this.register_once({ [ir]: hn(this.Se.mask_personal_data_properties, this.Se.custom_personal_data_properties, this.Se.disable_capture_url_hashes) }, void 0);
  }
  get_initial_props() {
    var t2 = {};
    Er([er, tr], ((e3) => {
      var i3 = this.props[e3];
      i3 && Er(i3, (function(e4, i4) {
        t2["$initial_" + D(i4)] = e4;
      }));
    }));
    var e2 = this.props[ir];
    if (e2) {
      var i2 = (function(t3, e3) {
        void 0 === e3 && (e3 = false);
        var i3 = dn(t3, e3), r2 = {};
        return Er(i3, (function(t4, e4) {
          r2["$initial_" + D(e4)] = t4;
        })), r2;
      })(e2, this.Se.disable_capture_url_hashes);
      xr(t2, i2);
    }
    return t2;
  }
  safe_merge(t2) {
    return Er(this.props, (function(e2, i2) {
      i2 in t2 || (t2[i2] = e2);
    })), t2;
  }
  update_config(t2, e2, i2) {
    this.hr = this.ar = t2.cookie_expiration, this.set_disabled(t2.disable_persistence || !!i2), this.set_cross_subdomain(t2.cross_subdomain_cookie), this.set_secure(t2.secure_cookie);
    var r2 = t2.persistence !== e2.persistence || !((t3, e3) => {
      if (t3.length !== e3.length) return false;
      var i3 = [...t3].sort(), r3 = [...e3].sort();
      return i3.every(((t4, e4) => t4 === r3[e4]));
    })(t2.cookie_persisted_properties || [], e2.cookie_persisted_properties || []), s2 = r2 ? this.Ht(t2) : this.Ct, n2 = this.Ut(t2);
    if (r2 || n2 !== this.Nt) {
      var o2 = this.props;
      this.clear(), this.Ct = s2, this.Nt = n2, this.props = o2, this.save();
    }
  }
  set_disabled(t2) {
    this.Vt = t2, this.Vt ? this.remove() : this.save();
  }
  set_cross_subdomain(t2) {
    t2 !== this.lr && (this.lr = t2, this.remove({ keepGroupEntries: true }), this.save());
  }
  set_secure(t2) {
    t2 !== this.ur && (this.ur = t2, this.remove({ keepGroupEntries: true }), this.save());
  }
  set_event_timer(t2, e2) {
    var i2 = this.props[fi] || {};
    i2[t2] = e2, this.Xt(fi, i2), this.save();
  }
  remove_event_timer(t2) {
    var e2 = this.props[fi] || {}, i2 = e2[t2];
    return q(i2) || (delete e2[t2], this.Xt(fi, e2), this.save()), i2;
  }
  get_property(t2) {
    return this.props[t2];
  }
  set_property(t2, e2) {
    this.Xt(t2, e2), this.save();
  }
  Xt(t2, e2) {
    var i2;
    this.props[t2] = e2, null != (i2 = Ws(t2)) && i2.volatile || this.dr(t2);
  }
  er(t2) {
    delete this.props[t2], this.dr(t2);
  }
  dr(t2) {
    var e2, i2 = null == (e2 = Ws(t2)) ? void 0 : e2.storageGroup;
    i2 && (this.Qt(i2).dirty = true);
  }
  Qt(t2) {
    return this.$t[t2] || (this.$t[t2] = {});
  }
}
var mn = { Activation: "events", Cancellation: "cancelEvents" }, En = { Popover: "popover", API: "api", Widget: "widget" }, Tn = { Always: "always" }, $n = { SHOWN: "survey shown", DISMISSED: "survey dismissed", SENT: "survey sent" }, kn = { SURVEY_ID: "$survey_id", SURVEY_ITERATION: "$survey_iteration", SURVEY_LAST_SEEN_DATE: "$survey_last_seen_date" }, Rn = { Popover: "popover", Inline: "inline" }, In = { SHOWN: "product tour shown" }, On = { TOUR_LAST_SEEN_DATE: "$product_tour_last_seen_date", TOUR_TYPE: "$product_tour_type" }, Cn = li("[RateLimiter]");
class An {
  constructor(t2) {
    this.serverLimits = {}, this.lastEventRateLimited = false, this.checkForLimiting = (t3) => {
      var e2 = t3.text;
      if (e2 && e2.length) try {
        (JSON.parse(e2).quota_limited || []).forEach(((t4) => {
          Cn.info((t4 || "events") + " is quota limited."), this.serverLimits[t4] = (/* @__PURE__ */ new Date()).getTime() + 6e4;
        }));
      } catch (t4) {
        return void Cn.warn('could not rate limit - continuing. Error: "' + (null == t4 ? void 0 : t4.message) + '"', { text: e2 });
      }
    }, this.instance = t2, this.lastEventRateLimited = this.clientRateLimitContext(true).isRateLimited;
  }
  get captureEventsPerSecond() {
    var t2;
    return (null == (t2 = this.instance.config.rate_limiting) ? void 0 : t2.events_per_second) || 10;
  }
  get captureEventsBurstLimit() {
    var t2;
    return Math.max((null == (t2 = this.instance.config.rate_limiting) ? void 0 : t2.events_burst_limit) || 10 * this.captureEventsPerSecond, this.captureEventsPerSecond);
  }
  clientRateLimitContext(t2) {
    var e2, i2, r2;
    void 0 === t2 && (t2 = false);
    var { captureEventsBurstLimit: s2, captureEventsPerSecond: n2 } = this, o2 = (/* @__PURE__ */ new Date()).getTime(), a2 = null !== (e2 = null == (i2 = this.instance.persistence) ? void 0 : i2.get_property(Zi)) && void 0 !== e2 ? e2 : { tokens: s2, last: o2 };
    a2.tokens += (o2 - a2.last) / 1e3 * n2, a2.last = o2, a2.tokens > s2 && (a2.tokens = s2);
    var l2 = 1 > a2.tokens;
    return l2 || t2 || (a2.tokens = Math.max(0, a2.tokens - 1)), !l2 || this.lastEventRateLimited || t2 || this.instance.capture("$$client_ingestion_warning", { $$client_ingestion_warning_message: "posthog-js client rate limited. Config is set to " + n2 + " events per second and " + s2 + " events burst limit." }, { skip_client_rate_limiting: true }), this.lastEventRateLimited = l2, null == (r2 = this.instance.persistence) || r2.set_property(Zi, a2), { isRateLimited: l2, remainingTokens: a2.tokens };
  }
  isServerRateLimited(t2) {
    var e2 = this.serverLimits[t2 || "events"] || false;
    return false !== e2 && (/* @__PURE__ */ new Date()).getTime() < e2;
  }
}
var Fn = li("[RemoteConfig]");
class Mn {
  constructor(t2) {
    this._instance = t2;
  }
  get remoteConfig() {
    var t2;
    return null == (t2 = h._POSTHOG_REMOTE_CONFIG) || null == (t2 = t2[this._instance.config.token]) ? void 0 : t2.config;
  }
  cr(t2) {
    var e2, i2;
    null != (e2 = h.__PosthogExtensions__) && e2.loadExternalDependency ? null == (i2 = h.__PosthogExtensions__) || null == i2.loadExternalDependency || i2.loadExternalDependency(this._instance, "remote-config", (() => t2(this.remoteConfig))) : t2();
  }
  vr(t2) {
    this._instance._send_request({ method: "GET", url: this._instance.requestRouter.endpointFor("assets", "/array/" + this._instance.config.token + "/config"), callback(e2) {
      t2(e2.json);
    } });
  }
  load() {
    try {
      if (this.remoteConfig) return Fn.info("Using preloaded remote config", this.remoteConfig), this.pr(this.remoteConfig), void this.gr();
      if (this._instance.mr()) return void Fn.warn("Remote config is disabled. Falling back to local config.");
      this.cr(((t2) => {
        if (!t2) return Fn.info("No config found after loading remote JS config. Falling back to JSON."), void this.vr(((t3) => {
          this.pr(t3), this.gr();
        }));
        this.pr(t2), this.gr();
      }));
    } catch (t2) {
      Fn.error("Error loading remote config", t2);
    }
  }
  stop() {
    this.yr && (clearInterval(this.yr), this.yr = void 0);
  }
  refresh() {
    !this._instance.mr() && r && "hidden" !== r.visibilityState && this._instance.reloadFeatureFlags();
  }
  gr() {
    var t2;
    if (!this.yr) {
      var e2 = null !== (t2 = this._instance.config.remote_config_refresh_interval_ms) && void 0 !== t2 ? t2 : 3e5;
      0 !== e2 && (this.yr = setInterval((() => {
        this.refresh();
      }), e2));
    }
  }
  pr(t2) {
    var e2;
    t2 || Fn.error("Failed to fetch remote config from PostHog."), this._instance.pr(null != t2 ? t2 : {}), false !== (null == t2 ? void 0 : t2.hasFeatureFlags) && (this._instance.config.advanced_disable_feature_flags_on_first_load || null == (e2 = this._instance.featureFlags) || e2.ensureFlagsLoaded());
  }
}
var Ln = { GZipJS: "gzip-js", Base64: "base64" }, Nn = Uint8Array, Un = Uint16Array, jn = Uint32Array, Bn = new Nn([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]), zn = new Nn([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]), Hn = new Nn([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), qn = function(t2, e2) {
  for (var i2 = new Un(31), r2 = 0; 31 > r2; ++r2) i2[r2] = e2 += 1 << t2[r2 - 1];
  var s2 = new jn(i2[30]);
  for (r2 = 1; 30 > r2; ++r2) for (var n2 = i2[r2]; i2[r2 + 1] > n2; ++n2) s2[n2] = n2 - i2[r2] << 5 | r2;
  return [i2, s2];
}, Vn = qn(Bn, 2), Gn = Vn[1];
Vn[0][28] = 258, Gn[258] = 28;
for (var Wn = qn(zn, 0)[1], Yn = new Un(32768), Kn = 0; 32768 > Kn; ++Kn) {
  var Jn = (43690 & Kn) >>> 1 | (21845 & Kn) << 1;
  Yn[Kn] = ((65280 & (Jn = (61680 & (Jn = (52428 & Jn) >>> 2 | (13107 & Jn) << 2)) >>> 4 | (3855 & Jn) << 4)) >>> 8 | (255 & Jn) << 8) >>> 1;
}
var Qn = function(t2, e2, i2) {
  for (var r2 = t2.length, s2 = 0, n2 = new Un(e2); r2 > s2; ++s2) ++n2[t2[s2] - 1];
  var o2, a2 = new Un(e2);
  for (s2 = 0; e2 > s2; ++s2) a2[s2] = a2[s2 - 1] + n2[s2 - 1] << 1;
  for (o2 = new Un(r2), s2 = 0; r2 > s2; ++s2) o2[s2] = Yn[a2[t2[s2] - 1]++] >>> 15 - t2[s2];
  return o2;
}, Xn = new Nn(288);
for (Kn = 0; 144 > Kn; ++Kn) Xn[Kn] = 8;
for (Kn = 144; 256 > Kn; ++Kn) Xn[Kn] = 9;
for (Kn = 256; 280 > Kn; ++Kn) Xn[Kn] = 7;
for (Kn = 280; 288 > Kn; ++Kn) Xn[Kn] = 8;
var Zn = new Nn(32);
for (Kn = 0; 32 > Kn; ++Kn) Zn[Kn] = 5;
var to = Qn(Xn, 9), eo = Qn(Zn, 5), io = function(t2) {
  return (t2 / 8 >> 0) + (7 & t2 && 1);
}, ro = function(t2, e2, i2) {
  (null == i2 || i2 > t2.length) && (i2 = t2.length);
  var r2 = new (t2 instanceof Un ? Un : t2 instanceof jn ? jn : Nn)(i2 - e2);
  return r2.set(t2.subarray(e2, i2)), r2;
}, so = function(t2, e2, i2) {
  var r2 = e2 / 8 >> 0;
  t2[r2] |= i2 <<= 7 & e2, t2[r2 + 1] |= i2 >>> 8;
}, no = function(t2, e2, i2) {
  var r2 = e2 / 8 >> 0;
  t2[r2] |= i2 <<= 7 & e2, t2[r2 + 1] |= i2 >>> 8, t2[r2 + 2] |= i2 >>> 16;
}, oo = function(t2, e2) {
  for (var i2 = [], r2 = 0; t2.length > r2; ++r2) t2[r2] && i2.push({ s: r2, f: t2[r2] });
  var s2 = i2.length, n2 = i2.slice();
  if (!s2) return [new Nn(0), 0];
  if (1 == s2) {
    var o2 = new Nn(i2[0].s + 1);
    return o2[i2[0].s] = 1, [o2, 1];
  }
  i2.sort((function(t3, e3) {
    return t3.f - e3.f;
  })), i2.push({ s: -1, f: 25001 });
  var a2 = i2[0], l2 = i2[1], u2 = 0, h2 = 1, d2 = 2;
  for (i2[0] = { s: -1, f: a2.f + l2.f, l: a2, r: l2 }; h2 != s2 - 1; ) a2 = i2[i2[d2].f > i2[u2].f ? u2++ : d2++], l2 = i2[u2 != h2 && i2[d2].f > i2[u2].f ? u2++ : d2++], i2[h2++] = { s: -1, f: a2.f + l2.f, l: a2, r: l2 };
  var v2 = n2[0].s;
  for (r2 = 1; s2 > r2; ++r2) n2[r2].s > v2 && (v2 = n2[r2].s);
  var c2 = new Un(v2 + 1), p2 = ao(i2[h2 - 1], c2, 0);
  if (p2 > e2) {
    r2 = 0;
    var f2 = 0, _2 = p2 - e2, g2 = 1 << _2;
    for (n2.sort((function(t3, e3) {
      return c2[e3.s] - c2[t3.s] || t3.f - e3.f;
    })); s2 > r2; ++r2) {
      var m2 = n2[r2].s;
      if (e2 >= c2[m2]) break;
      f2 += g2 - (1 << p2 - c2[m2]), c2[m2] = e2;
    }
    for (f2 >>>= _2; f2 > 0; ) {
      var y2 = n2[r2].s;
      e2 > c2[y2] ? f2 -= 1 << e2 - c2[y2]++ - 1 : ++r2;
    }
    for (; r2 >= 0 && f2; --r2) {
      var b2 = n2[r2].s;
      c2[b2] == e2 && (--c2[b2], ++f2);
    }
    p2 = e2;
  }
  return [new Nn(c2), p2];
}, ao = function(t2, e2, i2) {
  return -1 == t2.s ? Math.max(ao(t2.l, e2, i2 + 1), ao(t2.r, e2, i2 + 1)) : e2[t2.s] = i2;
}, lo = function(t2) {
  for (var e2 = t2.length; e2 && !t2[--e2]; ) ;
  for (var i2 = new Un(++e2), r2 = 0, s2 = t2[0], n2 = 1, o2 = function(t3) {
    i2[r2++] = t3;
  }, a2 = 1; e2 >= a2; ++a2) if (t2[a2] == s2 && a2 != e2) ++n2;
  else {
    if (!s2 && n2 > 2) {
      for (; n2 > 138; n2 -= 138) o2(32754);
      n2 > 2 && (o2(n2 > 10 ? n2 - 11 << 5 | 28690 : n2 - 3 << 5 | 12305), n2 = 0);
    } else if (n2 > 3) {
      for (o2(s2), --n2; n2 > 6; n2 -= 6) o2(8304);
      n2 > 2 && (o2(n2 - 3 << 5 | 8208), n2 = 0);
    }
    for (; n2--; ) o2(s2);
    n2 = 1, s2 = t2[a2];
  }
  return [i2.subarray(0, r2), e2];
}, uo = function(t2, e2) {
  for (var i2 = 0, r2 = 0; e2.length > r2; ++r2) i2 += t2[r2] * e2[r2];
  return i2;
}, ho = function(t2, e2, i2) {
  var r2 = i2.length, s2 = io(e2 + 2);
  t2[s2] = 255 & r2, t2[s2 + 1] = r2 >>> 8, t2[s2 + 2] = 255 ^ t2[s2], t2[s2 + 3] = 255 ^ t2[s2 + 1];
  for (var n2 = 0; r2 > n2; ++n2) t2[s2 + n2 + 4] = i2[n2];
  return 8 * (s2 + 4 + r2);
}, vo = function(t2, e2, i2, r2, s2, n2, o2, a2, l2, u2, h2) {
  so(e2, h2++, i2), ++s2[256];
  for (var d2 = oo(s2, 15), v2 = d2[0], c2 = d2[1], p2 = oo(n2, 15), f2 = p2[0], _2 = p2[1], g2 = lo(v2), m2 = g2[0], y2 = g2[1], b2 = lo(f2), w2 = b2[0], E2 = b2[1], x2 = new Un(19), S2 = 0; m2.length > S2; ++S2) x2[31 & m2[S2]]++;
  for (S2 = 0; w2.length > S2; ++S2) x2[31 & w2[S2]]++;
  for (var T2 = oo(x2, 7), k2 = T2[0], R2 = T2[1], P2 = 19; P2 > 4 && !k2[Hn[P2 - 1]]; --P2) ;
  var I2, O2, C2, A2, F2 = u2 + 5 << 3, M2 = uo(s2, Xn) + uo(n2, Zn) + o2, D2 = uo(s2, v2) + uo(n2, f2) + o2 + 14 + 3 * P2 + uo(x2, k2) + (2 * x2[16] + 3 * x2[17] + 7 * x2[18]);
  if (M2 >= F2 && D2 >= F2) return ho(e2, h2, t2.subarray(l2, l2 + u2));
  if (so(e2, h2, 1 + (M2 > D2)), h2 += 2, M2 > D2) {
    I2 = Qn(v2, c2), O2 = v2, C2 = Qn(f2, _2), A2 = f2;
    var L2 = Qn(k2, R2);
    for (so(e2, h2, y2 - 257), so(e2, h2 + 5, E2 - 1), so(e2, h2 + 10, P2 - 4), h2 += 14, S2 = 0; P2 > S2; ++S2) so(e2, h2 + 3 * S2, k2[Hn[S2]]);
    h2 += 3 * P2;
    for (var N2 = [m2, w2], U2 = 0; 2 > U2; ++U2) {
      var j2 = N2[U2];
      for (S2 = 0; j2.length > S2; ++S2) so(e2, h2, L2[B2 = 31 & j2[S2]]), h2 += k2[B2], B2 > 15 && (so(e2, h2, j2[S2] >>> 5 & 127), h2 += j2[S2] >>> 12);
    }
  } else I2 = to, O2 = Xn, C2 = eo, A2 = Zn;
  for (S2 = 0; a2 > S2; ++S2) if (r2[S2] > 255) {
    var B2;
    no(e2, h2, I2[257 + (B2 = r2[S2] >>> 18 & 31)]), h2 += O2[B2 + 257], B2 > 7 && (so(e2, h2, r2[S2] >>> 23 & 31), h2 += Bn[B2]);
    var z2 = 31 & r2[S2];
    no(e2, h2, C2[z2]), h2 += A2[z2], z2 > 3 && (no(e2, h2, r2[S2] >>> 5 & 8191), h2 += zn[z2]);
  } else no(e2, h2, I2[r2[S2]]), h2 += O2[r2[S2]];
  return no(e2, h2, I2[256]), h2 + O2[256];
}, co = new jn([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]), po = (function() {
  for (var t2 = new jn(256), e2 = 0; 256 > e2; ++e2) {
    for (var i2 = e2, r2 = 9; --r2; ) i2 = (1 & i2 && 3988292384) ^ i2 >>> 1;
    t2[e2] = i2;
  }
  return t2;
})(), fo = function(t2, e2, i2) {
  for (; i2; ++e2) t2[e2] = i2, i2 >>>= 8;
};
function _o(t2, e2) {
  void 0 === e2 && (e2 = {});
  var i2 = /* @__PURE__ */ (function() {
    var t3 = 4294967295;
    return { p(e3) {
      for (var i3 = t3, r3 = 0; e3.length > r3; ++r3) i3 = po[255 & i3 ^ e3[r3]] ^ i3 >>> 8;
      t3 = i3;
    }, d() {
      return 4294967295 ^ t3;
    } };
  })(), r2 = t2.length;
  i2.p(t2);
  var s2, n2, o2, a2, l2, u2 = (a2 = 10 + ((s2 = e2).filename && s2.filename.length + 1 || 0), l2 = 8, (function(t3, e3, i3, r3, s3, n3) {
    var o3 = t3.length, a3 = new Nn(r3 + o3 + 5 * (1 + Math.floor(o3 / 7e3)) + s3), l3 = a3.subarray(r3, a3.length - s3), u3 = 0;
    if (!e3 || 8 > o3) for (var h3 = 0; o3 >= h3; h3 += 65535) {
      var d2 = h3 + 65535;
      o3 > d2 ? u3 = ho(l3, u3, t3.subarray(h3, d2)) : (l3[h3] = true, u3 = ho(l3, u3, t3.subarray(h3, o3)));
    }
    else {
      for (var v2 = co[e3 - 1], c2 = v2 >>> 13, p2 = 8191 & v2, f2 = (1 << i3) - 1, _2 = new Un(32768), g2 = new Un(f2 + 1), m2 = Math.ceil(i3 / 3), y2 = 2 * m2, b2 = function(e4) {
        return (t3[e4] ^ t3[e4 + 1] << m2 ^ t3[e4 + 2] << y2) & f2;
      }, w2 = new jn(25e3), E2 = new Un(288), x2 = new Un(32), S2 = 0, T2 = 0, k2 = (h3 = 0, 0), R2 = 0, P2 = 0; o3 > h3; ++h3) {
        var I2 = b2(h3), O2 = 32767 & h3, C2 = g2[I2];
        if (_2[O2] = C2, g2[I2] = O2, h3 >= R2) {
          var A2 = o3 - h3;
          if ((S2 > 7e3 || k2 > 24576) && A2 > 423) {
            u3 = vo(t3, l3, 0, w2, E2, x2, T2, k2, P2, h3 - P2, u3), k2 = S2 = T2 = 0, P2 = h3;
            for (var F2 = 0; 286 > F2; ++F2) E2[F2] = 0;
            for (F2 = 0; 30 > F2; ++F2) x2[F2] = 0;
          }
          var M2 = 2, D2 = 0, L2 = p2, N2 = O2 - C2 & 32767;
          if (A2 > 2 && I2 == b2(h3 - N2)) for (var U2 = Math.min(c2, A2) - 1, j2 = Math.min(32767, h3), B2 = Math.min(258, A2); j2 >= N2 && --L2 && O2 != C2; ) {
            if (t3[h3 + M2] == t3[h3 + M2 - N2]) {
              for (var z2 = 0; B2 > z2 && t3[h3 + z2] == t3[h3 + z2 - N2]; ++z2) ;
              if (z2 > M2) {
                if (M2 = z2, D2 = N2, z2 > U2) break;
                var H2 = Math.min(N2, z2 - 2), q2 = 0;
                for (F2 = 0; H2 > F2; ++F2) {
                  var V2 = h3 - N2 + F2 + 32768 & 32767, G2 = V2 - _2[V2] + 32768 & 32767;
                  G2 > q2 && (q2 = G2, C2 = V2);
                }
              }
            }
            N2 += (O2 = C2) - (C2 = _2[O2]) + 32768 & 32767;
          }
          if (D2) {
            w2[k2++] = 268435456 | Gn[M2] << 18 | Wn[D2];
            var W2 = 31 & Gn[M2], Y2 = 31 & Wn[D2];
            T2 += Bn[W2] + zn[Y2], ++E2[257 + W2], ++x2[Y2], R2 = h3 + M2, ++S2;
          } else w2[k2++] = t3[h3], ++E2[t3[h3]];
        }
      }
      u3 = vo(t3, l3, true, w2, E2, x2, T2, k2, P2, h3 - P2, u3);
    }
    return ro(a3, 0, r3 + io(u3) + s3);
  })(n2 = t2, null == (o2 = e2).level ? 6 : o2.level, null == o2.mem ? Math.ceil(1.5 * Math.max(8, Math.min(13, Math.log(n2.length)))) : 12 + o2.mem, a2, l2)), h2 = u2.length;
  return (function(t3, e3) {
    var i3 = e3.filename;
    if (t3[0] = 31, t3[1] = 139, t3[2] = 8, t3[8] = 2 > e3.level ? 4 : 9 == e3.level ? 2 : 0, t3[9] = 3, 0 != e3.mtime && fo(t3, 4, Math.floor(new Date(e3.mtime || Date.now()) / 1e3)), i3) {
      t3[3] = 8;
      for (var r3 = 0; i3.length >= r3; ++r3) t3[r3 + 10] = i3.charCodeAt(r3);
    }
  })(u2, e2), fo(u2, h2 - 8, i2.d()), fo(u2, h2 - 4, r2), u2;
}
var go = !!o || !!n, mo = "text/plain", yo = false, bo = (t2, e2) => {
  var [i2, r2] = t2.split("#"), [s2, n2] = i2.split("?");
  if (!n2) return t2;
  var o2 = n2.split("&").filter(((t3) => t3.split("=")[0] !== e2)).join("&");
  return s2 + (o2 ? "?" + o2 : "") + (r2 ? "#" + r2 : "");
}, wo = function(t2, e2, i2) {
  var r2;
  void 0 === i2 && (i2 = true);
  var [s2, n2] = t2.split("?"), o2 = f({}, e2), a2 = null !== (r2 = null == n2 ? void 0 : n2.split("&").map(((t3) => {
    var e3, [r3, s3] = t3.split("="), n3 = i2 && null !== (e3 = o2[r3]) && void 0 !== e3 ? e3 : s3;
    return delete o2[r3], r3 + "=" + n3;
  }))) && void 0 !== r2 ? r2 : [], l2 = (function(t3, e3) {
    var i3, r3;
    void 0 === e3 && (e3 = "&");
    var s3 = [];
    return Er(t3, (function(t4, e4) {
      q(t4) || q(e4) || "undefined" === e4 || (i3 = encodeURIComponent(((t5) => t5 instanceof File)(t4) ? t4.name : t4.toString()), r3 = encodeURIComponent(e4), s3[s3.length] = r3 + "=" + i3);
    })), s3.join(e3);
  })(o2);
  return l2 && a2.push(l2), s2 + "?" + a2.join("&");
}, Eo = (t2, e2) => JSON.stringify(t2, ((t3, e3) => "bigint" == typeof e3 ? e3.toString() : e3), e2), xo = (t2) => {
  if (t2.xt) return t2.xt;
  var { data: e2, compression: i2 } = t2;
  if (e2) {
    if (i2 === Ln.GZipJS) {
      var r2 = _o((function(t3, e3) {
        var i3 = t3.length;
        if ("undefined" != typeof TextEncoder) return new TextEncoder().encode(t3);
        for (var r3 = new Nn(t3.length + (t3.length >>> 1)), s3 = 0, n3 = function(t4) {
          r3[s3++] = t4;
        }, o3 = 0; i3 > o3; ++o3) {
          if (s3 + 5 > r3.length) {
            var a2 = new Nn(s3 + 8 + (i3 - o3 << 1));
            a2.set(r3), r3 = a2;
          }
          var l2 = t3.charCodeAt(o3);
          128 > l2 ? n3(l2) : 2048 > l2 ? (n3(192 | l2 >>> 6), n3(128 | 63 & l2)) : l2 > 55295 && 57344 > l2 ? (n3(240 | (l2 = 65536 + (1047552 & l2) | 1023 & t3.charCodeAt(++o3)) >>> 18), n3(128 | l2 >>> 12 & 63), n3(128 | l2 >>> 6 & 63), n3(128 | 63 & l2)) : (n3(224 | l2 >>> 12), n3(128 | l2 >>> 6 & 63), n3(128 | 63 & l2));
        }
        return ro(r3, 0, s3);
      })(Eo(e2)), { mtime: 0 });
      return { contentType: mo, body: r2.buffer.slice(r2.byteOffset, r2.byteOffset + r2.byteLength), estimatedSize: r2.byteLength };
    }
    if (i2 === Ln.Base64) {
      var s2 = (function(t3) {
        return t3 ? btoa(encodeURIComponent(t3).replace(/%([0-9A-F]{2})/g, ((t4, e3) => String.fromCharCode(parseInt(e3, 16))))) : t3;
      })(Eo(e2)), n2 = ((t3) => "data=" + encodeURIComponent("string" == typeof t3 ? t3 : Eo(t3)))(s2);
      return { contentType: "application/x-www-form-urlencoded", body: n2, estimatedSize: new Blob([n2]).size };
    }
    var o2 = Eo(e2);
    return { contentType: "application/json", body: o2, estimatedSize: new Blob([o2]).size };
  }
}, So = (t2) => {
  var e2, i2, r2, s2 = xo(t2);
  return !s2 || (i2 = t2.compression, r2 = Ks(t2.url, "compression"), i2 !== E.GZipJS && r2 !== E.GZipJS && "gzip" !== r2) || ((e2 = s2.body) instanceof ArrayBuffer ? k(new Uint8Array(e2)) : ArrayBuffer.isView(e2) && k(new Uint8Array(e2.buffer, e2.byteOffset, e2.byteLength))) ? { url: t2.url, encodedBody: s2 } : (yo = true, { url: bo(t2.url, "compression"), encodedBody: xo(f({}, t2, { compression: void 0, xt: void 0 })) });
}, To = (t2) => {
  try {
    return So(t2);
  } catch (e2) {
    return ai.error(e2), void (null == t2.callback || t2.callback({ statusCode: 0, error: e2 }));
  }
}, $o = (function() {
  var t2 = p((function* (t3) {
    var e2 = Eo(t3.data), i2 = yield (function(t4, e3, i3) {
      return O.apply(this, arguments);
    })(e2, v.DEBUG, { rethrow: true });
    if (!i2) return t3;
    var r2 = yield i2.arrayBuffer();
    return f({}, t3, { xt: { contentType: mo, body: r2, estimatedSize: r2.byteLength } });
  }));
  return function(e2) {
    return t2.apply(this, arguments);
  };
})(), ko = (t2, e2) => wo(t2, { _: (/* @__PURE__ */ new Date()).getTime().toString(), ver: v.JS_SDK_VERSION, compression: e2 }), Ro = [];
n && Ro.push({ transport: "fetch", method(t2) {
  var e2, i2 = To(t2);
  if (i2) {
    var { url: r2, encodedBody: s2 } = i2, { contentType: o2, body: l2, estimatedSize: u2 } = null != s2 ? s2 : {}, h2 = new Headers();
    Er(t2.headers, (function(t3, e3) {
      h2.append(e3, t3);
    })), o2 && h2.append("Content-Type", o2);
    var d2 = null, v2 = null;
    if (a) {
      var c2 = new a();
      d2 = { signal: c2.signal, timeout: setTimeout((() => {
        var e3, i3;
        e3 = t2.timeout, (i3 = new Error("PostHog request timed out" + (e3 ? " after " + e3 + "ms" : ""))).name = "AbortError", c2.abort(v2 = i3);
      }), t2.timeout) };
    }
    n(r2, f({ method: (null == t2 ? void 0 : t2.method) || "GET", headers: h2, keepalive: "POST" === t2.method && 52428.8 > (u2 || 0), body: l2, signal: null == (e2 = d2) ? void 0 : e2.signal }, t2.fetchOptions)).then(((e3) => e3.text().then(((i3) => {
      var r3 = { statusCode: e3.status, text: i3 };
      if (200 === e3.status) try {
        r3.json = JSON.parse(i3);
      } catch (t3) {
        ai.error(t3);
      }
      null == t2.callback || t2.callback(r3);
    })))).catch(((e3) => {
      e3 === v2 ? ai.warn(e3) : ai.error(e3), null == t2.callback || t2.callback({ statusCode: 0, error: e3 });
    })).finally((() => d2 ? clearTimeout(d2.timeout) : null));
  }
} }), o && Ro.push({ transport: "XHR", method(t2) {
  var e2 = To(t2);
  if (e2) {
    var i2 = new o(), { url: r2, encodedBody: s2 } = e2;
    i2.open(t2.method || "GET", r2, true);
    var { contentType: n2, body: a2 } = null != s2 ? s2 : {};
    Er(t2.headers, (function(t3, e3) {
      i2.setRequestHeader(e3, t3);
    })), n2 && i2.setRequestHeader("Content-Type", n2), t2.timeout && (i2.timeout = t2.timeout), i2.onreadystatechange = () => {
      if (4 === i2.readyState) {
        var e3 = { statusCode: i2.status, text: i2.responseText };
        if (200 === i2.status) try {
          e3.json = JSON.parse(i2.responseText);
        } catch (t3) {
        }
        null == t2.callback || t2.callback(e3);
      }
    }, i2.send(a2);
  }
} }), null != i && i.sendBeacon && Ro.push({ transport: "sendBeacon", method(t2) {
  try {
    var { url: e2, encodedBody: r2 } = So(t2), { contentType: s2, body: n2 } = null != r2 ? r2 : {};
    if (!n2) return;
    var o2 = n2 instanceof Blob ? n2 : new Blob([n2], { type: s2 });
    i.sendBeacon(e2, o2);
  } catch (t3) {
  }
} });
var Po = 3e3;
class Io {
  constructor(t2, e2) {
    this.br = true, this._r = [], this.wr = at((null == e2 ? void 0 : e2.flush_interval_ms) || Po, 250, 5e3, ai.createLogger("flush interval"), Po), this.kr = t2;
  }
  enqueue(t2) {
    this._r.push(t2), this.Sr || this.Cr();
  }
  unload() {
    this.Ir();
    var t2 = this._r.length > 0 ? this.Tr() : {}, e2 = Object.values(t2);
    [...e2.filter(((t3) => 0 === t3.url.indexOf("/e"))), ...e2.filter(((t3) => 0 !== t3.url.indexOf("/e")))].map(((t3) => {
      this.Er(f({}, t3, { transport: "sendBeacon" }));
    }));
  }
  enable() {
    this.br = false, this.Cr();
  }
  Cr() {
    var t2 = this;
    this.br || (this.Sr = setTimeout((() => {
      if (this.Ir(), this._r.length > 0) {
        var e2 = this.Tr(), i2 = function() {
          var i3 = e2[r2], s2 = (/* @__PURE__ */ new Date()).getTime();
          i3.data && j(i3.data) && Er(i3.data, ((t3) => {
            t3.offset = Math.abs(t3.timestamp - s2), delete t3.timestamp;
          })), t2.Er(i3);
        };
        for (var r2 in e2) i2();
      }
    }), this.wr));
  }
  Er(t2) {
    try {
      this.kr(t2);
    } catch (t3) {
      ai.error(t3);
    }
  }
  Ir() {
    clearTimeout(this.Sr), this.Sr = void 0;
  }
  Tr() {
    var t2 = {};
    return Er(this._r, ((e2) => {
      var i2, r2 = e2, s2 = (r2 ? r2.batchKey : null) || r2.url;
      q(t2[s2]) && (t2[s2] = f({}, r2, { data: [] })), null == (i2 = t2[s2].data) || i2.push(r2.data);
    })), this._r = [], t2;
  }
}
var Oo = ["retriesPerformedSoFar"];
class Co {
  constructor(e2) {
    this.Mr = false, this.Pr = 3e3, this._r = [], this._instance = e2, this._r = [], this.Rr = true, !q(t) && "onLine" in t.navigator && (this.Rr = t.navigator.onLine, this.Or = () => {
      this.Rr = true, this.Lr();
    }, this.Fr = () => {
      this.Rr = false;
    }, Ir(t, "online", this.Or), Ir(t, "offline", this.Fr));
  }
  get length() {
    return this._r.length;
  }
  retriableRequest(t2) {
    var { retriesPerformedSoFar: e2 } = t2, i2 = _(t2, Oo);
    J(e2) && (i2.url = wo(i2.url, { retry_count: e2 })), this._instance._send_request(f({}, i2, { callback: (t3) => {
      if (200 !== t3.statusCode && (400 > t3.statusCode || t3.statusCode >= 500)) {
        if ((0 === t3.statusCode ? 3 : 10) > (null != e2 ? e2 : 0)) return void this.st(f({ retriesPerformedSoFar: e2 }, i2));
        0 === t3.statusCode && ai.warn("Request failed before receiving an HTTP response; this can happen due to network issues, CORS, browser blocking, or ad blockers. Stopped retrying after " + (null != e2 ? e2 : 0) + " retries.");
      }
      null == i2.callback || i2.callback(t3);
    } }));
  }
  st(t2) {
    var e2 = t2.retriesPerformedSoFar || 0;
    t2.retriesPerformedSoFar = e2 + 1;
    var i2 = (function(t3) {
      var e3 = 3e3 * Math.pow(2, t3), i3 = e3 / 2, r3 = Math.min(18e5, e3), s3 = Math.random() - 0.5;
      return Math.ceil(r3 + s3 * (r3 - i3));
    })(e2), r2 = Date.now() + i2;
    this._r.push({ retryAt: r2, requestOptions: t2 });
    var s2 = "Enqueued failed request for retry in " + i2;
    navigator.onLine || (s2 += " (Browser is offline)"), ai.warn(s2), this.Mr || (this.Mr = true, this.Ar());
  }
  Ar() {
    if (this.$r && clearTimeout(this.$r), 0 === this._r.length) return this.Mr = false, void (this.$r = void 0);
    this.$r = setTimeout((() => {
      this.Rr && this._r.length > 0 && this.Lr(), this.Ar();
    }), this.Pr);
  }
  Lr() {
    var t2 = Date.now(), e2 = [], i2 = this._r.filter(((i3) => t2 > i3.retryAt || (e2.push(i3), false)));
    if (this._r = e2, i2.length > 0) for (var { requestOptions: r2 } of i2) this.retriableRequest(r2);
  }
  unload() {
    for (var { requestOptions: e2 } of (this.$r && (clearTimeout(this.$r), this.$r = void 0), this.Mr = false, q(t) || (this.Or && (t.removeEventListener("online", this.Or), this.Or = void 0), this.Fr && (t.removeEventListener("offline", this.Fr), this.Fr = void 0)), this._r)) try {
      this._instance._send_request(f({}, e2, { transport: "sendBeacon" }));
    } catch (t2) {
      ai.error(t2);
    }
    this._r = [];
  }
}
class Ao {
  constructor(t2) {
    this.Dr = () => {
      var t3, e2, i2, r2;
      this.Nr || (this.Nr = {});
      var s2 = this.scrollElement(), n2 = this.scrollY(), o2 = s2 ? Math.max(0, s2.scrollHeight - s2.clientHeight) : 0, a2 = n2 + ((null == s2 ? void 0 : s2.clientHeight) || 0), l2 = (null == s2 ? void 0 : s2.scrollHeight) || 0;
      this.Nr.lastScrollY = Math.ceil(n2), this.Nr.maxScrollY = Math.max(n2, null !== (t3 = this.Nr.maxScrollY) && void 0 !== t3 ? t3 : 0), this.Nr.maxScrollHeight = Math.max(o2, null !== (e2 = this.Nr.maxScrollHeight) && void 0 !== e2 ? e2 : 0), this.Nr.lastContentY = a2, this.Nr.maxContentY = Math.max(a2, null !== (i2 = this.Nr.maxContentY) && void 0 !== i2 ? i2 : 0), this.Nr.maxContentHeight = Math.max(l2, null !== (r2 = this.Nr.maxContentHeight) && void 0 !== r2 ? r2 : 0);
    }, this._instance = t2;
  }
  get qr() {
    return this._instance.config.scroll_root_selector;
  }
  getContext() {
    return this.Nr;
  }
  resetContext() {
    var t2 = this.Nr;
    return setTimeout(this.Dr, 0), t2;
  }
  startMeasuringScrollPosition() {
    Ir(t, "scroll", this.Dr, { capture: true }), Ir(t, "scrollend", this.Dr, { capture: true }), Ir(t, "resize", this.Dr);
  }
  scrollElement() {
    if (!this.qr) return null == t ? void 0 : t.document.documentElement;
    var e2 = j(this.qr) ? this.qr : [this.qr];
    for (var i2 of e2) {
      var r2 = null == t ? void 0 : t.document.querySelector(i2);
      if (r2) return r2;
    }
  }
  jr(e2) {
    var i2 = "y" === e2 ? "scrollTop" : "scrollLeft";
    if (this.qr) {
      var r2 = this.scrollElement();
      return r2 && r2[i2] || 0;
    }
    return t ? "y" === e2 ? t.scrollY || t.pageYOffset || t.document.documentElement.scrollTop || 0 : t.scrollX || t.pageXOffset || t.document.documentElement.scrollLeft || 0 : 0;
  }
  scrollY() {
    return this.jr("y");
  }
  scrollX() {
    return this.jr("x");
  }
}
var Fo = (t2) => hn(null == t2 ? void 0 : t2.config.mask_personal_data_properties, null == t2 ? void 0 : t2.config.custom_personal_data_properties, null == t2 ? void 0 : t2.config.disable_capture_url_hashes);
class Mo {
  constructor(t2, e2, i2, r2) {
    this.Br = (t3) => {
      var e3 = this.Hr();
      if (!e3 || e3.sessionId !== t3) {
        var i3 = { sessionId: t3, props: this.Ur(this._instance) };
        this.zr.register({ [Xi]: i3 });
      }
    }, this._instance = t2, this.Vr = e2, this.zr = i2, this.Ur = r2 || Fo, this.Vr.onSessionId(this.Br);
  }
  Hr() {
    return this.zr.props[Xi];
  }
  getSetOnceProps() {
    var t2, e2 = null == (t2 = this.Hr()) ? void 0 : t2.props;
    return e2 ? "r" in e2 ? dn(e2, this._instance.config.disable_capture_url_hashes) : { $referring_domain: e2.referringDomain, $pathname: e2.initialPathName, utm_source: e2.utm_source, utm_campaign: e2.utm_campaign, utm_medium: e2.utm_medium, utm_content: e2.utm_content, utm_term: e2.utm_term } : {};
  }
  getSessionProps() {
    var t2 = {};
    return Er(kr(this.getSetOnceProps()), ((e2, i2) => {
      "$current_url" === i2 && (i2 = "url"), t2["$session_entry_" + D(i2)] = e2;
    })), t2;
  }
}
class Do {
  constructor() {
    this.Wr = {};
  }
  on(t2, e2) {
    return this.Wr[t2] || (this.Wr[t2] = []), this.Wr[t2].push(e2), () => {
      this.Wr[t2] = this.Wr[t2].filter(((t3) => t3 !== e2));
    };
  }
  emit(t2, e2) {
    for (var i2 of this.Wr[t2] || []) i2(e2);
    for (var r2 of this.Wr["*"] || []) r2(t2, e2);
  }
}
var Lo = li("[SessionId]");
class No {
  on(t2, e2) {
    return this.Gr.on(t2, e2);
  }
  constructor(t2, e2, i2) {
    var r2;
    if (this.Zr = null, this.Qr = [], this.Jr = void 0, this.Yr = false, this.Gr = new Do(), this.Kr = (t3, e3) => !(!J(t3) || !J(e3)) && Math.abs(t3 - e3) > this.sessionTimeoutMs, !t2.persistence) throw new Error("SessionIdManager requires a PostHogPersistence instance");
    if (t2.config.cookieless_mode === dr) throw new Error('SessionIdManager cannot be used with cookieless_mode="always"');
    this.Se = t2.config, this.zr = t2.persistence, this.Xr = void 0, this.ei = void 0, this._sessionStartTimestamp = null, this._sessionActivityTimestamp = null, this.ti = e2 || Lr, this.ri = i2 || Lr;
    var s2 = this.Se.persistence_name || this.Se.token;
    if (this._sessionTimeoutMs = 1e3 * at(this.Se.session_idle_timeout_seconds || 1800, 60, 36e3, Lo.createLogger("session_idle_timeout_seconds"), 1800), t2.register({ $configured_session_timeout_ms: this._sessionTimeoutMs }), this.ii(), this.ni = "ph_" + s2 + "_window_id", this.si = "ph_" + s2 + "_primary_window_exists", this.oi()) {
      var n2 = Yr.F(this.ni), o2 = Yr.F(this.si);
      n2 && !o2 ? this.Xr = n2 : Yr.A(this.ni), Yr.q(this.si, true);
    }
    if (null != (r2 = this.Se.bootstrap) && r2.sessionID) try {
      var a2 = ((t3) => {
        var e3 = this.Se.bootstrap.sessionID.replace(/-/g, "");
        if (32 !== e3.length) throw new Error("Not a valid UUID");
        if ("7" !== e3[12]) throw new Error("Not a UUIDv7");
        return parseInt(e3.substring(0, 12), 16);
      })();
      this.ai(this.Se.bootstrap.sessionID, (/* @__PURE__ */ new Date()).getTime(), a2);
    } catch (t3) {
      Lo.error("Invalid sessionID in bootstrap", t3);
    }
    this.li();
  }
  get sessionTimeoutMs() {
    return this._sessionTimeoutMs;
  }
  onSessionId(t2) {
    return q(this.Qr) && (this.Qr = []), this.Qr.push(t2), this.ei && t2(this.ei, this.Xr), () => {
      this.Qr = this.Qr.filter(((e2) => e2 !== t2));
    };
  }
  oi() {
    return "memory" !== this.Se.persistence && !this.zr.Vt && Yr.N();
  }
  ui(t2) {
    t2 !== this.Xr && (this.Xr = t2, this.oi() && Yr.q(this.ni, t2));
  }
  hi() {
    return this.Xr ? this.Xr : this.oi() ? Yr.F(this.ni) : null;
  }
  di(t2) {
    var e2 = this.Zr;
    return !W(e2) && !W(t2) && 5e3 > Math.abs(t2 - e2);
  }
  ai(t2, e2, i2) {
    var r2 = e2 !== this._sessionActivityTimestamp, s2 = !(t2 !== this.ei || i2 !== this._sessionStartTimestamp);
    this._sessionStartTimestamp = i2, this._sessionActivityTimestamp = e2, this.ei = t2, s2 && !r2 || s2 && this.di(e2) || (this.Zr = e2, this.zr.register({ [Oi]: [e2, t2, i2] }));
  }
  ci() {
    var t2, e2 = null == (t2 = this.Se) ? void 0 : t2.persistence_save_debounce_ms;
    return J(e2) && e2 > 0;
  }
  vi() {
    this.ci() ? this.zr.refreshKey(Oi) : (this.zr.flush(), this.zr.load());
  }
  fi() {
    var t2;
    if (!W(this._sessionActivityTimestamp) && this._sessionActivityTimestamp !== this.Zr) {
      this.vi();
      var [, e2, i2] = this.pi();
      e2 === this.ei && i2 === this._sessionStartTimestamp && (this.Zr = this._sessionActivityTimestamp, this.zr.register({ [Oi]: [this._sessionActivityTimestamp, null !== (t2 = this.ei) && void 0 !== t2 ? t2 : null, this._sessionStartTimestamp] }), this.zr.flush());
    }
  }
  gi() {
    var [t2] = this.pi(), e2 = J(t2) ? t2 : 0, i2 = J(this._sessionActivityTimestamp) ? this._sessionActivityTimestamp : 0;
    return Math.max(e2, i2);
  }
  mi(t2) {
    return this.vi(), this.Kr(t2, this.gi());
  }
  pi() {
    var t2 = this.zr.props[Oi];
    return j(t2) && 2 === t2.length && t2.push(t2[0]), t2 || [0, null, 0];
  }
  resetSessionId() {
    this.Zr = null, clearTimeout(this.yi), this.yi = void 0, this.ai(null, null, null);
  }
  destroy() {
    this.Yr = true, this.fi(), clearTimeout(this.yi), this.yi = void 0, this.Jr && t && (t.removeEventListener(_r, this.Jr, { capture: false }), this.Jr = void 0), this.Qr = [];
  }
  li() {
    this.Jr = () => {
      this.fi(), this.oi() && Yr.A(this.si);
    }, Ir(t, _r, this.Jr, { capture: false });
  }
  checkAndGetSessionAndWindowId(t2, e2) {
    if (void 0 === t2 && (t2 = false), void 0 === e2 && (e2 = null), this.Se.cookieless_mode === dr) throw new Error('checkAndGetSessionAndWindowId should not be called with cookieless_mode="always"');
    var i2 = e2 || (/* @__PURE__ */ new Date()).getTime(), [, r2, s2] = this.pi(), n2 = this.gi(), o2 = this.hi(), a2 = J(s2) && Math.abs(i2 - s2) > 864e5, l2 = false, u2 = false, h2 = !r2, d2 = r2, v2 = !h2 && !t2 && this.Kr(i2, n2);
    v2 && ((v2 = this.mi(i2)) || Lo.info("cross-tab refresh kept the session alive", { sessionId: r2 }), [, r2, s2] = this.pi()), h2 || v2 || a2 ? (r2 = this.ti(), o2 = this.ri(), Lo.info("new session ID generated", { sessionId: r2, windowId: o2, changeReason: { noSessionId: h2, activityTimeout: v2, sessionPastMaximumLength: a2 } }), s2 = i2, l2 = true) : (o2 || (o2 = this.ri(), l2 = true), (u2 = r2 !== d2) && (Lo.info("adopted cross-tab session id", { sessionId: r2, windowId: o2 }), l2 = true));
    var c2 = J(n2) && t2 && !a2 ? n2 : i2, p2 = J(s2) ? s2 : (/* @__PURE__ */ new Date()).getTime();
    this.ui(o2), this.ai(r2, c2, p2), t2 || this.ii();
    var f2 = { noSessionId: h2, activityTimeout: v2, sessionPastMaximumLength: a2, crossTabAdoption: u2 };
    return l2 && this.Qr.forEach(((t3) => t3(r2, o2, f2))), { sessionId: r2, windowId: o2, sessionStartTimestamp: p2, changeReason: l2 ? f2 : void 0, lastActivityTimestamp: n2 };
  }
  ii() {
    this.Yr || (clearTimeout(this.yi), this.yi = setTimeout((() => {
      if (!this.Yr) if (this.mi((/* @__PURE__ */ new Date()).getTime())) {
        var t2 = this.ei;
        this.resetSessionId(), this.Gr.emit("forcedIdleReset", { idleSessionId: t2 });
      } else this.ii();
    }), 1.1 * this.sessionTimeoutMs));
  }
}
var Uo = function(t2, e2) {
  if (!t2) return false;
  var i2 = t2.userAgent;
  if (i2 && A(i2, e2)) return true;
  try {
    var r2 = null == t2 ? void 0 : t2.userAgentData;
    if (null != r2 && r2.brands && r2.brands.some(((t3) => A(null == t3 ? void 0 : t3.brand, e2)))) return true;
  } catch (t3) {
  }
  return !!t2.webdriver;
};
function jo() {
  return (jo = p((function* () {
    var t2 = null == i ? void 0 : i.userAgentData;
    if (null != t2 && t2.getHighEntropyValues) try {
      var e2 = yield t2.getHighEntropyValues(["model"]), r2 = null == e2 ? void 0 : e2.model;
      return V(r2) && r2.length > 0 ? r2 : void 0;
    } catch (t3) {
      return void ai.info("Unable to resolve $device_model from userAgentData.getHighEntropyValues", t3);
    }
  }))).apply(this, arguments);
}
var Bo = function(t2, e2) {
  if (!(function(t3) {
    try {
      new RegExp(t3);
    } catch (t4) {
      return false;
    }
    return true;
  })(e2)) return false;
  try {
    return new RegExp(e2).test(t2);
  } catch (t3) {
    return false;
  }
};
function zo(t2, e2, i2) {
  return Eo({ distinct_id: t2, userPropertiesToSet: e2, userPropertiesToSetOnce: i2 });
}
var Ho = { exact: (t2, e2) => e2.some(((e3) => t2.some(((t3) => e3 === t3)))), is_not: (t2, e2) => e2.every(((e3) => t2.every(((t3) => e3 !== t3)))), regex: (t2, e2) => e2.some(((e3) => t2.some(((t3) => Bo(e3, t3))))), not_regex: (t2, e2) => e2.every(((e3) => t2.every(((t3) => !Bo(e3, t3))))), icontains: (t2, e2) => e2.map(qo).some(((e3) => t2.map(qo).some(((t3) => e3.includes(t3))))), not_icontains: (t2, e2) => e2.map(qo).every(((e3) => t2.map(qo).every(((t3) => !e3.includes(t3))))), gt: (t2, e2) => e2.some(((e3) => {
  var i2 = parseFloat(e3);
  return !isNaN(i2) && t2.some(((t3) => i2 > parseFloat(t3)));
})), lt: (t2, e2) => e2.some(((e3) => {
  var i2 = parseFloat(e3);
  return !isNaN(i2) && t2.some(((t3) => i2 < parseFloat(t3)));
})) }, qo = (t2) => t2.toLowerCase();
function Vo(t2, e2) {
  return !t2 || Object.entries(t2).every(((t3) => {
    var [i2, r2] = t3, s2 = null == e2 ? void 0 : e2[i2];
    if (q(s2) || W(s2)) return false;
    var n2 = [String(s2)], o2 = Ho[r2.operator];
    return !!o2 && o2(r2.values, n2);
  }));
}
var Go = "custom", Wo = "i.posthog.com", Yo = /^\/static\//;
class Ko {
  constructor(t2) {
    this.bi = {}, this.instance = t2;
  }
  get apiHost() {
    var t2 = this.instance.config.api_host.trim().replace(/\/$/, "");
    return "https://app.posthog.com" === t2 ? "https://us.i.posthog.com" : t2;
  }
  get flagsApiHost() {
    var t2 = this.instance.config.flags_api_host;
    return t2 ? t2.trim().replace(/\/$/, "") : this.apiHost;
  }
  get uiHost() {
    var t2, e2 = null == (t2 = this.instance.config.ui_host) ? void 0 : t2.replace(/\/$/, "");
    return e2 || (e2 = this.apiHost.replace("." + Wo, ".posthog.com")), "https://app.posthog.com" === e2 ? "https://us.posthog.com" : e2;
  }
  get region() {
    return this.bi[this.apiHost] || (this.bi[this.apiHost] = /https:\/\/(app|us|us-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? "us" : /https:\/\/(eu|eu-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? "eu" : Go), this.bi[this.apiHost];
  }
  wi(t2) {
    if (Yo.test(t2)) {
      var e2 = this.instance.config.asset_host;
      if ("string" == typeof e2) return e2.trim().replace(/\/$/, "") || void 0;
    }
  }
  endpointFor(t2, e2) {
    if (void 0 === e2 && (e2 = ""), e2 && (e2 = "/" === e2[0] ? e2 : "/" + e2), "ui" === t2) return this.uiHost + e2;
    if ("flags" === t2) return this.flagsApiHost + e2;
    if ("assets" === t2) {
      var i2 = this.wi(e2);
      if (i2) return "" + i2 + e2;
    }
    if (this.region === Go) return this.apiHost + e2;
    var r2 = Wo + e2;
    switch (t2) {
      case "assets":
        return "https://" + this.region + "-assets." + r2;
      case "api":
        return "https://" + this.region + "." + r2;
    }
  }
}
var Jo = li("[Surveys]"), Qo = "seenSurvey_", Xo = [En.Popover, En.Widget, En.API], Zo = { ignoreConditions: false, ignoreDelay: false, displayType: Rn.Popover }, ta = li("[PostHog ExternalIntegrations]"), ea = { intercom: "intercom-integration", crispChat: "crisp-chat-integration" };
class ia {
  constructor(t2) {
    this._instance = t2;
  }
  Mt(t2, e2) {
    var i2;
    null == (i2 = h.__PosthogExtensions__) || null == i2.loadExternalDependency || i2.loadExternalDependency(this._instance, t2, ((t3) => {
      if (t3) return ta.error("failed to load script", t3);
      e2();
    }));
  }
  startIfEnabledOrStop() {
    var t2 = this, e2 = function(e3) {
      var i3, s3, n2;
      !r2 || null != (i3 = h.__PosthogExtensions__) && null != (i3 = i3.integrations) && i3[e3] || t2.Mt(ea[e3], (() => {
        var i4;
        null == (i4 = h.__PosthogExtensions__) || null == (i4 = i4.integrations) || null == (i4 = i4[e3]) || i4.start(t2._instance);
      })), !r2 && null != (s3 = h.__PosthogExtensions__) && null != (s3 = s3.integrations) && s3[e3] && (null == (n2 = h.__PosthogExtensions__) || null == (n2 = n2.integrations) || null == (n2 = n2[e3]) || n2.stop());
    };
    for (var [i2, r2] of Object.entries(null !== (s2 = this._instance.config.integrations) && void 0 !== s2 ? s2 : {})) {
      var s2;
      e2(i2);
    }
  }
}
var ra, sa = {}, na = 0, oa = () => {
}, aa = 'Consent opt in/out is not valid with cookieless_mode="always" and will be ignored', la = "Surveys module not available", ua = "sanitize_properties is deprecated. Use before_send instead", ha = "Invalid value for property_denylist config: ", da = "posthog", va = !go && -1 === (null == u ? void 0 : u.indexOf("MSIE")) && -1 === (null == u ? void 0 : u.indexOf("Mozilla")), ca = (e2) => {
  var i2;
  return f({ api_host: "https://us.i.posthog.com", flags_api_host: null, ui_host: null, asset_host: null, token: "", autocapture: true, cross_subdomain_cookie: Pr(null == r ? void 0 : r.location), persistence: "localStorage+cookie", persistence_name: "", cookie_persisted_properties: [], loaded: oa, save_campaign_params: true, custom_campaign_params: [], custom_blocked_useragents: [], save_referrer: true, capture_pageleave: "if_capture_pageview", defaults: null != e2 ? e2 : "unset", __preview_deferred_init_extensions: false, __preview_external_dependency_versioned_paths: false, __preview_cookie_wins_on_conflict: false, debug: s && V(null == s ? void 0 : s.search) && -1 !== s.search.indexOf("__posthog_debug=true") || false, cookie_expiration: 365, upgrade: false, disable_session_recording: false, disable_persistence: false, disable_web_experiments: true, disable_surveys: false, disable_surveys_automatic_display: false, disable_conversations: false, disable_product_tours: false, disableDeviceModel: false, disable_external_dependency_loading: false, strict_script_versioning: false, enable_recording_console_log: void 0, secure_cookie: "https:" === (null == t || null == (i2 = t.location) ? void 0 : i2.protocol), ip: false, opt_out_capturing_by_default: false, opt_out_persistence_by_default: false, opt_out_useragent_filter: false, opt_out_capturing_persistence_type: "localStorage", consent_persistence_name: null, opt_out_capturing_cookie_prefix: null, opt_in_site_apps: false, property_denylist: [], respect_dnt: false, sanitize_properties: null, request_headers: {}, request_batching: true, properties_string_max_length: 65535, mask_all_element_attributes: false, mask_all_text: false, mask_personal_data_properties: false, custom_personal_data_properties: [], advanced_disable_flags: false, advanced_disable_decide: false, advanced_disable_feature_flags: false, advanced_disable_feature_flags_on_first_load: false, advanced_only_evaluate_survey_feature_flags: false, advanced_feature_flags_dedup_per_session: false, advanced_enable_surveys: false, advanced_disable_toolbar_metrics: false, feature_flag_request_timeout_ms: 3e3, surveys_request_timeout_ms: 1e4, on_request_error(t2) {
    ai.error("Bad HTTP status: " + t2.statusCode + " " + t2.text);
  }, get_device_id: (t2) => t2, capture_performance: void 0, name: "posthog", bootstrap: {}, disable_compression: false, session_idle_timeout_seconds: 1800, person_profiles: pr, before_send: void 0, request_queue_config: { flush_interval_ms: Po }, error_tracking: {}, _onCapture: oa }, ((t2) => ({ rageclick: t2 && t2 >= "2026-05-30" ? { content_ignorelist: fs, ignore_text_selection: true } : !t2 || "2025-11-30" > t2 || { content_ignorelist: true }, capture_pageview: !t2 || "2025-05-24" > t2 || "history_change", session_recording: t2 && t2 >= "2026-06-25" ? { strictMinimumDuration: true, canvasCapture: { resolutionScale: 0.6 }, streamNetworkBody: true } : t2 && t2 >= "2026-05-30" ? { strictMinimumDuration: true, canvasCapture: { resolutionScale: 0.6 } } : t2 && t2 >= "2025-11-30" ? { strictMinimumDuration: true } : {}, external_scripts_inject_target: t2 && t2 >= "2026-01-30" ? "head" : "body", internal_or_test_user_hostname: t2 && t2 >= "2026-01-30" ? /^(localhost|127\.0\.0\.1)$/ : void 0, persistence_save_debounce_ms: t2 && t2 >= "2026-05-30" ? 250 : 0, split_storage: !(!t2 || "2026-05-30" > t2), detect_google_search_app: !(!t2 || "2026-05-30" > t2), disable_capture_url_hashes: !(!t2 || "2026-06-25" > t2) }))(e2));
}, pa = [["process_person", "person_profiles"], ["xhr_headers", "request_headers"], ["cookie_name", "persistence_name"], ["disable_cookie", "disable_persistence"], ["__preview_disable_beacon", "disable_beacon"], ["store_google", "save_campaign_params"], ["verbose", "debug"]], fa = (t2) => {
  var e2 = {};
  for (var [i2, r2] of pa) q(t2[i2]) || (e2[r2] = t2[i2]);
  var s2 = xr({}, e2, t2), n2 = t2.__preview_external_dependency_versioned_paths;
  return q(n2) || (q(t2.strict_script_versioning) && (s2.strict_script_versioning = !!n2), V(n2) && q(t2.asset_host) && (s2.asset_host = n2)), j(t2.property_blacklist) && (q(t2.property_denylist) ? s2.property_denylist = t2.property_blacklist : j(t2.property_denylist) ? s2.property_denylist = [...t2.property_blacklist, ...t2.property_denylist] : ai.error(ha + t2.property_denylist)), s2;
};
class _a {
  constructor() {
    this.__forceAllowLocalhost = false;
  }
  get xi() {
    return this.__forceAllowLocalhost;
  }
  set xi(t2) {
    ai.error("WebPerformanceObserver is deprecated and has no impact on network capture. Use `_forceAllowLocalhostNetworkCapture` on `posthog.sessionRecording`"), this.__forceAllowLocalhost = t2;
  }
}
class ga {
  ki(t2, e2) {
    if (t2) {
      var i2 = this.Si.indexOf(t2);
      -1 !== i2 && this.Si.splice(i2, 1);
    }
    return this.Si.push(e2), null == e2.initialize || e2.initialize(), e2;
  }
  Ci() {
    return this.config.cookieless_mode === dr || this.config.cookieless_mode === hr && this.consent.isRejected();
  }
  get decideEndpointWasHit() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this.featureFlags) ? void 0 : e2.hasLoadedFlags) && void 0 !== t2 && t2;
  }
  get flagsEndpointWasHit() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this.featureFlags) ? void 0 : e2.hasLoadedFlags) && void 0 !== t2 && t2;
  }
  constructor() {
    var t2;
    this.webPerformance = new _a(), this.Ii = false, this.version = v.LIB_VERSION, this.Ti = new Do(), this.Si = [], this._calculate_event_properties = this.calculateEventProperties.bind(this), this.config = ca(), this.SentryIntegration = zs, this.sentryIntegration = (t3) => (function(t4, e3) {
      var i2 = Bs(t4, e3);
      return { name: js, processEvent: (t5) => i2(t5) };
    })(this, t3), this.__request_queue = [], this.__loaded = false, this.analyticsDefaultEndpoint = "/e/", this.Ei = false, this.Mi = null, this.Pi = null, this.Ri = null, this.scrollManager = new Ao(this), this.pageViewManager = new Hs(this), this.rateLimiter = new An(this), this.requestRouter = new Ko(this), this.consent = new Kr(this), this.externalIntegrations = new ia(this);
    var e2 = null !== (t2 = ga.__defaultExtensionClasses) && void 0 !== t2 ? t2 : {};
    this.featureFlags = e2.featureFlags && new e2.featureFlags(this), this.toolbar = e2.toolbar && new e2.toolbar(this), this.surveys = e2.surveys && new e2.surveys(this), this.conversations = e2.conversations && new e2.conversations(this), this.logs = e2.logs && new e2.logs(this), this.experiments = e2.experiments && new e2.experiments(this), this.exceptions = e2.exceptions && new e2.exceptions(this), this.people = { set: (t3, e3, i2) => {
      var r2 = V(t3) ? { [t3]: e3 } : t3;
      this.setPersonProperties(r2), null == i2 || i2({});
    }, set_once: (t3, e3, i2) => {
      var r2 = V(t3) ? { [t3]: e3 } : t3;
      this.setPersonProperties(void 0, r2), null == i2 || i2({});
    } }, this.on("eventCaptured", ((t3) => ai.info('send "' + (null == t3 ? void 0 : t3.event) + '"', t3)));
  }
  init(t2, e2, i2) {
    if (i2 && i2 !== da) {
      var r2, s2 = null !== (r2 = sa[i2]) && void 0 !== r2 ? r2 : new ga();
      return s2._init(t2, e2, i2), sa[i2] = s2, sa[da][i2] = s2, s2;
    }
    return this._init(t2, e2, i2);
  }
  _init(e2, i2, r2) {
    var s2, n2;
    void 0 === i2 && (i2 = {});
    var o2 = V(e2) ? e2.trim() : "";
    if (!o2) return ai.critical("PostHog was initialized without a token. This likely indicates a misconfiguration. Please check the first argument passed to posthog.init()"), this;
    if (this.__loaded) return console.warn("[PostHog.js]", "You have already initialized PostHog! Re-initializing is a no-op"), this;
    this.__loaded = true, this.config = {}, i2.debug = this.Oi(i2.debug), this.Li = i2, this.Fi = [], i2.person_profiles ? this.Pi = i2.person_profiles : i2.process_person && (this.Pi = i2.process_person);
    var a2 = ca(i2.defaults), l2 = fa(i2), u2 = xr({}, a2, l2, { name: r2, token: o2 });
    z(a2.rageclick) && z(l2.rageclick) && (u2.rageclick = xr({}, a2.rageclick, l2.rageclick)), z(a2.session_recording) && z(l2.session_recording) && (u2.session_recording = xr({}, a2.session_recording, l2.session_recording)), this.set_config(u2), this.config.on_xhr_error && ai.error("on_xhr_error is deprecated. Use on_request_error instead"), this.compression = i2.disable_compression ? void 0 : Ln.GZipJS;
    var h2 = this.Ai();
    this.persistence = new gn(this.config, h2), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new gn(f({}, this.config, { persistence: "sessionStorage" }), h2, false);
    var d2 = f({}, this.persistence.props), c2 = f({}, this.sessionPersistence.props);
    this.register({ $initialization_time: (/* @__PURE__ */ new Date()).toISOString() }), this.$i = new Io(((t2) => this.Di(t2)), this.config.request_queue_config), this.Ni = new Co(this), this.__request_queue = [];
    var p2 = this.Ci();
    if (p2 || (this.sessionManager = new No(this), this.sessionPropsManager = new Mo(this, this.sessionManager, this.persistence)), this.config.__preview_deferred_init_extensions ? (ai.info("Deferring extension initialization to improve startup performance"), setTimeout((() => {
      this.qi(p2);
    }), 0)) : (ai.info("Initializing extensions synchronously"), this.qi(p2)), v.DEBUG = v.DEBUG || this.config.debug, v.DEBUG && ai.info("Starting in debug mode", { this: this, config: i2, thisC: f({}, this.config), p: d2, s: c2 }), !this.config.identity_distinct_id || null != (s2 = i2.bootstrap) && s2.distinctID || (i2.bootstrap = f({}, i2.bootstrap, { distinctID: this.config.identity_distinct_id, isIdentifiedID: true })), void 0 !== (null == (n2 = i2.bootstrap) ? void 0 : n2.distinctID)) {
      var _2 = i2.bootstrap.distinctID, g2 = this.get_distinct_id(), m2 = this.persistence.get_property(Qi);
      if (i2.bootstrap.isIdentifiedID && null != g2 && g2 !== _2 && m2 === vr) this.identify(_2);
      else if (i2.bootstrap.isIdentifiedID && null != g2 && g2 !== _2 && m2 === cr) ai.warn("Bootstrap distinctID differs from an already-identified user. The existing identity is preserved. Call reset() before reinitializing if you intend to switch users.");
      else {
        var y2 = this.config.get_device_id(Lr()), b2 = i2.bootstrap.isIdentifiedID ? y2 : _2;
        this.persistence.set_property(Qi, i2.bootstrap.isIdentifiedID ? cr : vr), this.register({ distinct_id: _2, $device_id: b2 });
      }
    }
    if (p2) this.register_once({ distinct_id: nr, $device_id: null }, "");
    else if (!this.get_distinct_id()) {
      var w2 = this.config.get_device_id(Lr());
      this.register_once({ distinct_id: w2, $device_id: w2 }, ""), this.persistence.set_property(Qi, vr);
    }
    return Ir(t, "onpagehide" in self ? "pagehide" : "unload", this._handle_unload.bind(this), { passive: false }), i2.segment ? (function(t2, e3) {
      var i3 = t2.config.segment;
      if (!i3) return e3();
      !(function(t3, e4) {
        var i4 = t3.config.segment;
        if (!i4) return e4();
        var r3 = (i5) => {
          var r4 = () => i5.anonymousId() || Lr();
          t3.config.get_device_id = r4, i5.id() && (t3.register({ distinct_id: i5.id(), $device_id: r4() }), t3.persistence.set_property(Qi, cr)), e4();
        }, s3 = i4.user();
        "then" in s3 && B(s3.then) ? s3.then(r3) : r3(s3);
      })(t2, (() => {
        i3.register(((t3) => {
          Promise && Promise.resolve || Us.warn("This browser does not have Promise support, and can not use the segment integration");
          var e4 = (e5, i4) => {
            if (!i4) return e5;
            e5.event.userId || e5.event.anonymousId === t3.get_distinct_id() || (Us.info("No userId set, resetting PostHog"), t3.reset()), e5.event.userId && e5.event.userId !== t3.get_distinct_id() && (Us.info("UserId set, identifying with PostHog"), t3.identify(e5.event.userId));
            var r3 = t3.calculateEventProperties(i4, e5.event.properties);
            return e5.event.properties = Object.assign({}, r3, e5.event.properties), e5;
          };
          return { name: "PostHog JS", type: "enrichment", version: "1.0.0", isLoaded: () => true, load: () => Promise.resolve(), track: (t4) => e4(t4, t4.event.event), page: (t4) => e4(t4, gr), identify: (t4) => e4(t4, yr), screen: (t4) => e4(t4, "$screen") };
        })(t2)).then((() => {
          e3();
        }));
      }));
    })(this, (() => this.ji())) : this.ji(), B(this.config._onCapture) && this.config._onCapture !== oa && (ai.warn("onCapture is deprecated. Please use `before_send` instead"), this.on("eventCaptured", ((t2) => this.config._onCapture(t2.event, t2)))), this.config.ip && ai.warn('The `ip` config option has NO EFFECT AT ALL and has been deprecated. Use a custom transformation or "Discard IP data" project setting instead. See https://posthog.com/tutorials/web-redact-properties#hiding-customer-ip-address for more information.'), this.config.disableDeviceModel || (function() {
      return jo.apply(this, arguments);
    })().then(((t2) => {
      t2 && this.register({ [ci]: t2 });
    })).catch(oa), this;
  }
  qi(t2) {
    var e2, i2, r2, s2, n2, o2, a2, l2 = performance.now(), u2 = f({}, ga.__defaultExtensionClasses, this.config.__extensionClasses), h2 = [];
    u2.featureFlags && this.Si.push(this.featureFlags = null !== (e2 = this.featureFlags) && void 0 !== e2 ? e2 : new u2.featureFlags(this)), u2.exceptions && this.Si.push(this.exceptions = null !== (i2 = this.exceptions) && void 0 !== i2 ? i2 : new u2.exceptions(this)), u2.historyAutocapture && this.Si.push(this.historyAutocapture = new u2.historyAutocapture(this)), u2.tracingHeaders && this.Si.push(this.tracingHeaders = new u2.tracingHeaders(this)), u2.siteApps && this.Si.push(this.siteApps = new u2.siteApps(this)), u2.sessionRecording && !t2 && this.Si.push(this.sessionRecording = new u2.sessionRecording(this)), this.config.disable_scroll_properties || h2.push((() => {
      this.scrollManager.startMeasuringScrollPosition();
    })), u2.autocapture && this.Si.push(this.autocapture = new u2.autocapture(this)), u2.surveys && this.Si.push(this.surveys = null !== (r2 = this.surveys) && void 0 !== r2 ? r2 : new u2.surveys(this)), u2.logs && this.Si.push(this.logs = null !== (s2 = this.logs) && void 0 !== s2 ? s2 : new u2.logs(this)), u2.conversations && this.Si.push(this.conversations = null !== (n2 = this.conversations) && void 0 !== n2 ? n2 : new u2.conversations(this)), u2.productTours && this.Si.push(this.productTours = new u2.productTours(this)), u2.heatmaps && this.Si.push(this.heatmaps = new u2.heatmaps(this)), u2.webVitalsAutocapture && this.Si.push(this.webVitalsAutocapture = new u2.webVitalsAutocapture(this)), u2.exceptionObserver && this.Si.push(this.exceptionObserver = new u2.exceptionObserver(this)), u2.deadClicksAutocapture && this.Si.push(this.deadClicksAutocapture = new u2.deadClicksAutocapture(this, Ls)), u2.toolbar && this.Si.push(this.toolbar = null !== (o2 = this.toolbar) && void 0 !== o2 ? o2 : new u2.toolbar(this)), u2.experiments && this.Si.push(this.experiments = null !== (a2 = this.experiments) && void 0 !== a2 ? a2 : new u2.experiments(this)), this.Si.forEach(((t3) => {
      t3.initialize && h2.push((() => {
        null == t3.initialize || t3.initialize();
      }));
    })), h2.push((() => {
      if (this.Bi) {
        var t3 = this.Bi;
        this.Bi = void 0, this.pr(t3);
      }
    })), this.Hi(h2, l2);
  }
  Hi(t2, e2) {
    for (; t2.length > 0; ) {
      if (this.config.__preview_deferred_init_extensions && performance.now() - e2 >= 30 && t2.length > 0) return void setTimeout((() => {
        this.Hi(t2, e2);
      }), 0);
      var i2 = t2.shift();
      if (i2) try {
        i2();
      } catch (t3) {
        ai.error("Error initializing extension:", t3);
      }
    }
    var r2 = Math.round(performance.now() - e2);
    this.register_for_session({ [or]: this.config.__preview_deferred_init_extensions ? "deferred" : "synchronous", [ar]: r2 }), this.config.__preview_deferred_init_extensions && ai.info("PostHog extensions initialized (" + r2 + "ms)");
  }
  pr(t2) {
    var e2;
    if (!r || !r.body) return ai.info("document not ready yet, trying again in 500 milliseconds..."), void setTimeout((() => {
      this.pr(t2);
    }), 500);
    this.config.__preview_deferred_init_extensions && (this.Bi = t2), this.Ui = t2, this.compression = void 0, t2.supportedCompression && !this.config.disable_compression && (this.compression = F(t2.supportedCompression, Ln.GZipJS) ? Ln.GZipJS : F(t2.supportedCompression, Ln.Base64) ? Ln.Base64 : void 0), null != (e2 = t2.analytics) && e2.endpoint && (this.analyticsDefaultEndpoint = t2.analytics.endpoint), this.set_config({ person_profiles: this.Pi ? this.Pi : pr }), this.Si.forEach(((e3) => null == e3.onRemoteConfig ? void 0 : e3.onRemoteConfig(t2)));
  }
  ji() {
    try {
      this.config.loaded(this);
    } catch (t3) {
      ai.critical("`loaded` function failed", t3);
    }
    if (this.zi(), this.config.internal_or_test_user_hostname && null != s && s.hostname) {
      var t2 = s.hostname, e2 = this.config.internal_or_test_user_hostname;
      ("string" == typeof e2 ? t2 === e2 : e2.test(t2)) && this.setInternalOrTestUser();
    }
    this.config.capture_pageview && setTimeout((() => {
      (this.consent.isOptedIn() || this.Ci()) && this.Vi();
    }), 1), this.Wi = new Mn(this), this.Wi.load();
  }
  zi() {
    var t2;
    this.is_capturing() && this.config.request_batching && (null == (t2 = this.$i) || t2.enable());
  }
  _dom_loaded() {
    this.is_capturing() && wr(this.__request_queue, ((t2) => this.Di(t2))), this.__request_queue = [], this.zi();
  }
  _handle_unload() {
    var t2, e2, i2, r2;
    null == (t2 = this.surveys) || null == t2.handlePageUnload || t2.handlePageUnload(), this.config.request_batching ? (this.Gi() && this.capture(mr), null == (e2 = this.logs) || e2.flushLogs("sendBeacon"), null == (i2 = this.$i) || i2.unload(), null == (r2 = this.Ni) || r2.unload()) : this.Gi() && this.capture(mr, null, { transport: "sendBeacon" });
  }
  _send_request(t2) {
    this.__loaded ? va ? this.__request_queue.push(t2) : this.rateLimiter.isServerRateLimited(t2.batchKey) ? t2.fireCallbackOnDrop && (null == t2.callback || t2.callback({ statusCode: 429 })) : (t2.transport = t2.transport || this.config.api_transport, t2.headers = f({}, this.config.request_headers, t2.headers), t2.compression = "best-available" === t2.compression ? this.compression : t2.compression, (q(this.config.disable_beacon) ? this.config.__preview_disable_beacon : this.config.disable_beacon) && (t2.disableTransport = ["sendBeacon"]), t2.fetchOptions = t2.fetchOptions || this.config.fetch_options, ((t3) => {
      var e2, i2, r2, s2 = f({}, t3);
      s2.timeout = s2.timeout || 6e4, s2.url = ko(s2.url, s2.compression);
      var n2 = null !== (e2 = s2.transport) && void 0 !== e2 ? e2 : "fetch", o2 = Ro.filter(((t4) => !s2.disableTransport || !t4.transport || !s2.disableTransport.includes(t4.transport))), a2 = null !== (i2 = null == (r2 = (function(t4, e3) {
        for (var i3 = 0; t4.length > i3; i3++) if (t4[i3].transport === n2) return t4[i3];
      })(o2)) ? void 0 : r2.method) && void 0 !== i2 ? i2 : o2[0].method;
      if (!a2) throw new Error("No available transport method");
      "sendBeacon" !== n2 && s2.data && s2.compression === Ln.GZipJS && l && !yo ? $o(s2).then(((t4) => {
        a2(t4);
      })).catch(((e3) => {
        if (R(e3)) return yo = true, void a2(f({}, s2, { compression: void 0, url: ko(t3.url, void 0) }));
        ((t4) => {
          if (!t4 || "object" != typeof t4) return false;
          var e4 = "name" in t4 ? String(t4.name) : "";
          return R(t4) || e4 === T;
        })(e3) && (yo = true), a2(s2);
      })) : a2(s2);
    })(f({}, t2, { callback: (e2) => {
      var i2, r2;
      this.rateLimiter.checkForLimiting(e2), 400 > e2.statusCode || null == (i2 = (r2 = this.config).on_request_error) || i2.call(r2, e2), null == t2.callback || t2.callback(e2);
    } }))) : t2.fireCallbackOnDrop && (null == t2.callback || t2.callback({ statusCode: 0 }));
  }
  Di(t2) {
    this.Ni ? this.Ni.retriableRequest(t2) : this._send_request(t2);
  }
  _execute_array(t2) {
    na++;
    try {
      var e2, i2 = [], r2 = [], s2 = [];
      wr(t2, ((t3) => {
        if (t3) if (j(e2 = t3[0])) s2.push(t3);
        else if (B(t3)) try {
          t3.call(this);
        } catch (e3) {
          ai.error("Error executing queued PostHog call", t3, e3);
        }
        else j(t3) && "alias" === e2 ? i2.push(t3) : j(t3) && -1 !== e2.indexOf("capture") && B(this[e2]) ? s2.push(t3) : r2.push(t3);
      }));
      var n2 = function(t3, e3) {
        wr(t3, (function(t4) {
          try {
            if (j(t4[0])) {
              var i3 = e3;
              Er(t4, (function(t5) {
                i3 = i3[t5[0]].apply(i3, t5.slice(1));
              }));
            } else e3[t4[0]].apply(e3, t4.slice(1));
          } catch (e4) {
            ai.error("Error executing queued PostHog call", t4, e4);
          }
        }));
      };
      n2(i2, this), n2(r2, this), n2(s2, this);
    } finally {
      na--;
    }
  }
  push(t2) {
    if (na > 0 && j(t2) && V(t2[0])) {
      var e2 = ga.prototype[t2[0]];
      B(e2) && e2.apply(this, t2.slice(1));
    } else this._execute_array([t2]);
  }
  capture(t2, e2, i2) {
    var r2, s2, n2, o2, a2;
    if (this.__loaded && this.persistence && this.sessionPersistence && this.$i) {
      if (this.is_capturing()) if (!q(t2) && V(t2)) {
        var l2 = !this.config.opt_out_useragent_filter && this._is_bot();
        if (!l2 || this.config.__preview_capture_bot_pageviews) {
          var u2 = null != i2 && i2.skip_client_rate_limiting ? void 0 : this.rateLimiter.clientRateLimitContext();
          if (null == u2 || !u2.isRateLimited) {
            null != e2 && e2.$current_url && !V(null == e2 ? void 0 : e2.$current_url) && (ai.error("Invalid `$current_url` property provided to `posthog.capture`. Input must be a string. Ignoring provided value."), null == e2 || delete e2.$current_url), "$exception" !== t2 || null != i2 && i2.Zi || ai.warn("Using `posthog.capture('$exception')` is unreliable because it does not attach required metadata. Use `posthog.captureException(error)` instead, which attaches required metadata automatically."), this.sessionPersistence.update_search_keyword(), this.config.save_campaign_params && this.sessionPersistence.update_campaign_params(), this.config.save_referrer && this.sessionPersistence.update_referrer_info(), (this.config.save_campaign_params || this.config.save_referrer) && this.persistence.set_initial_person_info();
            var h2 = /* @__PURE__ */ new Date(), d2 = (null == i2 ? void 0 : i2.timestamp) || h2, v2 = pe(null == i2 ? void 0 : i2.uuid, Lr), c2 = { uuid: v2, event: t2, properties: this.calculateEventProperties(t2, e2 || {}, d2, v2) };
            t2 === gr && this.config.__preview_capture_bot_pageviews && l2 && (c2.event = "$bot_pageview", c2.properties.$browser_type = "bot"), u2 && (c2.properties.$lib_rate_limit_remaining_tokens = u2.remainingTokens), (null == i2 ? void 0 : i2.$set) && (c2.$set = null == i2 ? void 0 : i2.$set);
            var p2 = null == i2 ? void 0 : i2.$unset;
            p2 && (c2.$unset = p2);
            var _2, g2, m2, y2 = this.Qi(null == i2 ? void 0 : i2.$set_once, t2 !== br, t2 === yr);
            if (y2 && (c2.$set_once = y2), null != i2 && i2._noTruncate || (s2 = this.config.properties_string_max_length, n2 = c2, o2 = (t3) => V(t3) ? t3.slice(0, s2) : t3, a2 = /* @__PURE__ */ new Set(), c2 = (function t3(e3, i3) {
              return e3 !== Object(e3) ? o2 ? o2(e3) : e3 : a2.has(e3) ? void 0 : (a2.add(e3), j(e3) ? (r3 = [], wr(e3, ((e4) => {
                r3.push(t3(e4));
              }))) : (r3 = {}, Er(e3, ((e4, i4) => {
                a2.has(e4) || (r3[i4] = t3(e4));
              }))), r3);
              var r3;
            })(n2)), c2.timestamp = d2, q(null == i2 ? void 0 : i2.timestamp) || (c2.properties.$event_time_override_provided = true, c2.properties.$event_time_override_system_time = h2), t2 === $n.DISMISSED || t2 === $n.SENT) {
              var b2 = null == e2 ? void 0 : e2[kn.SURVEY_ID], w2 = null == e2 ? void 0 : e2[kn.SURVEY_ITERATION];
              ((t3) => {
                try {
                  var e3 = ((t4) => ((t5, e4) => {
                    var i3 = "" + Qo + e4.id;
                    return e4.current_iteration && e4.current_iteration > 0 && (i3 = "" + Qo + e4.id + "_" + e4.current_iteration), i3;
                  })(0, t4))(t3);
                  if (localStorage.getItem(e3)) return;
                  localStorage.setItem(e3, "true");
                } catch (t4) {
                  Jo.error("Failed to persist survey seen state", t4);
                }
              })({ id: b2, current_iteration: w2 }), c2.$set = f({}, c2.$set, { [(_2 = { id: b2, current_iteration: w2 }, g2 = t2 === $n.SENT ? "responded" : "dismissed", m2 = "$survey_" + g2 + "/" + _2.id, _2.current_iteration && _2.current_iteration > 0 && (m2 = "$survey_" + g2 + "/" + _2.id + "/" + _2.current_iteration), m2)]: true });
            } else t2 === $n.SHOWN && (c2.$set = f({}, c2.$set, { [kn.SURVEY_LAST_SEEN_DATE]: (/* @__PURE__ */ new Date()).toISOString() }));
            if (t2 === In.SHOWN) {
              var E2 = null == e2 ? void 0 : e2[On.TOUR_TYPE];
              E2 && (c2.$set = f({}, c2.$set, { [On.TOUR_LAST_SEEN_DATE + "/" + E2]: (/* @__PURE__ */ new Date()).toISOString() }));
            }
            var x2 = f({}, c2.properties.$set, c2.$set);
            if (H(x2) || this.setPersonPropertiesForFlags(x2), !Y(this.config.before_send)) {
              var S2 = this.it(c2);
              if (!S2) return;
              (c2 = S2).uuid = pe(c2.uuid, Lr);
            }
            this.Ti.emit("eventCaptured", c2);
            var T2 = { method: "POST", url: null !== (r2 = null == i2 ? void 0 : i2._url) && void 0 !== r2 ? r2 : this.requestRouter.endpointFor("api", this.analyticsDefaultEndpoint), data: c2, compression: "best-available", batchKey: null == i2 ? void 0 : i2._batchKey, transport: null == i2 ? void 0 : i2.transport };
            return !this.config.request_batching || i2 && (null == i2 || !i2._batchKey) || null != i2 && i2.send_instantly ? this.Di(T2) : this.$i.enqueue(T2), c2;
          }
          ai.critical("This capture call is ignored due to client rate limiting.");
        }
      } else ai.error("No event name provided to posthog.capture");
    } else ai.uninitializedWarning("posthog.capture");
  }
  _addCaptureHook(t2) {
    return this.on("eventCaptured", ((e2) => t2(e2.event, e2)));
  }
  calculateEventProperties(e2, i2, n2, o2, a2) {
    if (n2 = n2 || /* @__PURE__ */ new Date(), !this.persistence || !this.sessionPersistence) return i2;
    var l2 = a2 ? void 0 : this.persistence.remove_event_timer(e2), h2 = f({}, i2);
    if (h2.token = this.config.token, h2.$config_defaults = this.config.defaults, this.Ci() && (h2.$cookieless_mode = true), "$snapshot" === e2) {
      var d2 = f({}, this.persistence.properties(), this.sessionPersistence.properties());
      return h2.distinct_id = d2.distinct_id, (!V(h2.distinct_id) && !K(h2.distinct_id) || G(h2.distinct_id)) && ai.error("Invalid distinct_id for replay event. This indicates a bug in your implementation"), h2;
    }
    var c2, p2 = (function(e3, i3, r2, n3) {
      var o3, a3, l3, h3;
      if (void 0 === n3 && (n3 = false), !u) return {};
      var d3, c3, p3, f2, _3, g3, m3, y3, b3, w3 = e3 ? [...Zs, ...i3 || []] : [], [E2, x2] = (function(t2) {
        for (var e4 = 0; de.length > e4; e4++) {
          var [i4, r3] = de[e4], s2 = i4.exec(t2), n4 = s2 && (B(r3) ? r3(s2, t2) : r3);
          if (n4) return n4;
        }
        return ["", ""];
      })(u), S2 = null != (d3 = "undefined" != typeof navigator ? navigator : void 0) && d3.brave ? { brave: true } : {}, T2 = { detectGoogleSearchApp: r2 }, k2 = xr(kr({ $os: E2, $os_version: x2, $browser: le(u, navigator.vendor, S2, T2), $device: ve(u), $device_type: (p3 = u, f2 = { userAgentDataPlatform: null == (o3 = navigator) || null == (o3 = o3.userAgentData) ? void 0 : o3.platform, maxTouchPoints: null == (a3 = navigator) ? void 0 : a3.maxTouchPoints, screenWidth: null == t || null == (l3 = t.screen) ? void 0 : l3.width, screenHeight: null == t || null == (h3 = t.screen) ? void 0 : h3.height, devicePixelRatio: null == t ? void 0 : t.devicePixelRatio }, b3 = ve(p3), b3 === pt || b3 === ct || "Kobo" === b3 || "Kindle Fire" === b3 || b3 === qt ? vt : b3 === At || b3 === Mt || b3 === Ft || b3 === Bt ? "Console" : b3 === _t ? "Wearable" : b3 ? ut : "Android" === (null == f2 ? void 0 : f2.userAgentDataPlatform) && (null !== (_3 = null == f2 ? void 0 : f2.maxTouchPoints) && void 0 !== _3 ? _3 : 0) > 0 ? 600 > Math.min(null !== (g3 = null == f2 ? void 0 : f2.screenWidth) && void 0 !== g3 ? g3 : 0, null !== (m3 = null == f2 ? void 0 : f2.screenHeight) && void 0 !== m3 ? m3 : 0) / (null !== (y3 = null == f2 ? void 0 : f2.devicePixelRatio) && void 0 !== y3 ? y3 : 1) ? ut : vt : "Desktop"), $timezone: vn(), $timezone_offset: cn() }), { $current_url: Js(n3 ? fe(null == s ? void 0 : s.href) : null == s ? void 0 : s.href, w3, en), $host: null == s ? void 0 : s.host, $pathname: null == s ? void 0 : s.pathname, $raw_user_agent: u.length > 1e3 ? u.substring(0, 997) + "..." : u, $browser_version: he(u, navigator.vendor, S2, T2), $browser_language: an(), $browser_language_prefix: (c3 = an(), "string" == typeof c3 ? c3.split("-")[0] : void 0), $screen_height: null == t ? void 0 : t.screen.height, $screen_width: null == t ? void 0 : t.screen.width, $viewport_height: null == t ? void 0 : t.innerHeight, $viewport_width: null == t ? void 0 : t.innerWidth, $lib: v.LIB_NAME, $lib_version: v.LIB_VERSION, $insert_id: Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10), $time: Date.now() / 1e3 });
      return v.SDK_DIST_CHANNEL && (k2.$sdk_dist_channel = v.SDK_DIST_CHANNEL), k2;
    })(this.config.mask_personal_data_properties, this.config.custom_personal_data_properties, this.config.detect_google_search_app, this.config.disable_capture_url_hashes);
    if (this.sessionManager) {
      var { sessionId: _2, windowId: g2 } = this.sessionManager.checkAndGetSessionAndWindowId(a2, n2.getTime());
      h2.$session_id = _2, h2.$window_id = g2;
    }
    this.sessionPropsManager && xr(h2, this.sessionPropsManager.getSessionProps());
    try {
      var m2;
      this.sessionRecording && xr(h2, this.sessionRecording.sdkDebugProperties), h2.$sdk_debug_retry_queue_size = null == (m2 = this.Ni) ? void 0 : m2.length;
    } catch (t2) {
      h2.$sdk_debug_error_capturing_properties = String(t2);
    }
    if (this.requestRouter.region === Go && (h2.$lib_custom_api_host = this.config.api_host), c2 = e2 !== gr || a2 ? e2 !== mr || a2 ? this.pageViewManager.doEvent() : this.pageViewManager.doPageLeave(n2) : this.pageViewManager.doPageView(n2, o2), h2 = xr(h2, c2), e2 === gr && r && (h2.title = r.title), !q(l2)) {
      var y2 = n2.getTime() - l2;
      h2.$duration = parseFloat((y2 / 1e3).toFixed(3));
    }
    u && this.config.opt_out_useragent_filter && (h2.$browser_type = this._is_bot() ? "bot" : "browser"), (h2 = xr({}, p2, this.persistence.properties(), this.sessionPersistence.properties(), h2)).$is_identified = this._isIdentified(), j(this.config.property_denylist) ? Er(this.config.property_denylist, (function(t2) {
      delete h2[t2];
    })) : ai.error(ha + this.config.property_denylist + " or property_blacklist config: " + this.config.property_blacklist);
    var b2 = this.config.sanitize_properties;
    b2 && (ai.error(ua), h2 = b2(h2, e2));
    var w2 = this.Ji();
    return h2.$process_person_profile = w2, w2 && !a2 && this.Yi("_calculate_event_properties"), h2;
  }
  Qi(t2, e2, i2) {
    var r2;
    if (void 0 === e2 && (e2 = true), void 0 === i2 && (i2 = false), !this.persistence || !this.Ji()) return t2;
    if (this.Ii && !i2) return t2;
    var s2 = this.persistence.get_initial_props(), n2 = null == (r2 = this.sessionPropsManager) ? void 0 : r2.getSetOnceProps(), o2 = xr({}, s2, n2 || {}, t2 || {}), a2 = this.config.sanitize_properties;
    return a2 && (ai.error(ua), o2 = a2(o2, "$set_once")), e2 && (this.Ii = true), H(o2) ? void 0 : o2;
  }
  register(t2, e2) {
    var i2;
    null == (i2 = this.persistence) || i2.register(t2, e2);
  }
  register_once(t2, e2, i2) {
    var r2;
    null == (r2 = this.persistence) || r2.register_once(t2, e2, i2);
  }
  register_for_session(t2) {
    var e2;
    null == (e2 = this.sessionPersistence) || e2.register(t2);
  }
  unregister(t2) {
    var e2;
    null == (e2 = this.persistence) || e2.unregister(t2);
  }
  unregister_for_session(t2) {
    var e2;
    null == (e2 = this.sessionPersistence) || e2.unregister(t2);
  }
  Ki(t2, e2) {
    this.register({ [t2]: e2 });
  }
  getFeatureFlag(t2, e2) {
    var i2;
    return null == (i2 = this.featureFlags) ? void 0 : i2.getFeatureFlag(t2, e2);
  }
  getFeatureFlagPayload(t2) {
    var e2;
    return null == (e2 = this.featureFlags) ? void 0 : e2.getFeatureFlagPayload(t2);
  }
  getFeatureFlagResult(t2, e2) {
    var i2;
    return null == (i2 = this.featureFlags) ? void 0 : i2.getFeatureFlagResult(t2, e2);
  }
  getAllFeatureFlags() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this.featureFlags) ? void 0 : e2.getAllFeatureFlags()) && void 0 !== t2 ? t2 : [];
  }
  isFeatureEnabled(t2, e2) {
    var i2;
    return null == (i2 = this.featureFlags) ? void 0 : i2.isFeatureEnabled(t2, e2);
  }
  reloadFeatureFlags() {
    var t2;
    null == (t2 = this.featureFlags) || t2.reloadFeatureFlags();
  }
  updateFlags(t2, e2, i2) {
    var r2;
    null == (r2 = this.featureFlags) || r2.updateFlags(t2, e2, i2);
  }
  updateEarlyAccessFeatureEnrollment(t2, e2, i2) {
    var r2;
    null == (r2 = this.featureFlags) || r2.updateEarlyAccessFeatureEnrollment(t2, e2, i2);
  }
  getEarlyAccessFeatures(t2, e2, i2) {
    var r2;
    return void 0 === e2 && (e2 = false), null == (r2 = this.featureFlags) ? void 0 : r2.getEarlyAccessFeatures(t2, e2, i2);
  }
  on(t2, e2) {
    return this.Ti.on(t2, e2);
  }
  onFeatureFlags(t2) {
    return this.featureFlags ? this.featureFlags.onFeatureFlags(t2) : (t2([], {}, { errorsLoading: true }), () => {
    });
  }
  onSurveysLoaded(t2) {
    return this.surveys ? this.surveys.onSurveysLoaded(t2) : (t2([], { isLoaded: false, error: la }), () => {
    });
  }
  onSessionId(t2) {
    var e2, i2;
    return null !== (e2 = null == (i2 = this.sessionManager) ? void 0 : i2.onSessionId(t2)) && void 0 !== e2 ? e2 : () => {
    };
  }
  getSurveys(t2, e2) {
    void 0 === e2 && (e2 = false), this.surveys ? this.surveys.getSurveys(t2, e2) : t2([], { isLoaded: false, error: la });
  }
  getActiveMatchingSurveys(t2, e2) {
    void 0 === e2 && (e2 = false), this.surveys ? this.surveys.getActiveMatchingSurveys(t2, e2) : t2([], { isLoaded: false, error: la });
  }
  renderSurvey(t2, e2) {
    var i2;
    null == (i2 = this.surveys) || i2.renderSurvey(t2, e2);
  }
  displaySurvey(t2, e2) {
    var i2;
    void 0 === e2 && (e2 = Zo), null == (i2 = this.surveys) || i2.displaySurvey(t2, e2);
  }
  cancelPendingSurvey(t2) {
    var e2;
    null == (e2 = this.surveys) || e2.cancelPendingSurvey(t2);
  }
  canRenderSurvey(t2) {
    var e2, i2;
    return null !== (e2 = null == (i2 = this.surveys) ? void 0 : i2.canRenderSurvey(t2)) && void 0 !== e2 ? e2 : { visible: false, disabledReason: la };
  }
  canRenderSurveyAsync(t2, e2) {
    var i2, r2;
    return void 0 === e2 && (e2 = false), null !== (i2 = null == (r2 = this.surveys) ? void 0 : r2.canRenderSurveyAsync(t2, e2)) && void 0 !== i2 ? i2 : Promise.resolve({ visible: false, disabledReason: la });
  }
  Xi(t2) {
    return !t2 || G(t2) ? (ai.critical("Unique user id has not been set in posthog.identify"), false) : t2 === nr ? (ai.critical('The string "' + t2 + '" was set in posthog.identify which indicates an error. This ID is only used as a sentinel value.'), false) : !["distinct_id", "distinctid"].includes(t2.toLowerCase()) && !["undefined", "null"].includes(t2.toLowerCase()) || (ai.critical('The string "' + t2 + '" was set in posthog.identify which indicates an error. This ID should be unique to the user and not a hardcoded string.'), false);
  }
  identify(t2, e2, i2) {
    if (!this.__loaded || !this.persistence) return ai.uninitializedWarning("posthog.identify");
    if (K(t2) && (t2 = t2.toString(), ai.warn("The first argument to posthog.identify was a number, but it should be a string. It has been converted to a string.")), this.Xi(t2) && this.Yi("posthog.identify")) {
      var r2 = this.get_distinct_id();
      this.register({ $user_id: t2 }), this.get_property(vi) || this.register_once({ $had_persisted_distinct_id: true, $device_id: r2 }, ""), t2 !== r2 && t2 !== this.get_property(pi) && (this.unregister(pi), this.register({ distinct_id: t2 }));
      var s2, n2 = (this.persistence.get_property(Qi) || vr) === vr;
      t2 !== r2 && n2 ? (this.persistence.set_property(Qi, cr), this.setPersonPropertiesForFlags({ $set: e2 || {}, $set_once: i2 || {} }, false), this.capture(yr, { distinct_id: t2, $anon_distinct_id: r2 }, { $set: e2 || {}, $set_once: i2 || {} }), this.Ri = zo(t2, e2, i2), null == (s2 = this.featureFlags) || s2.setAnonymousDistinctId(r2)) : (e2 || i2) && this.setPersonProperties(e2, i2), t2 !== r2 && (this.reloadFeatureFlags(), this.unregister(Wi));
    }
  }
  setPersonProperties(t2, e2) {
    if ((t2 || e2) && this.Yi("posthog.setPersonProperties")) {
      var i2 = zo(this.get_distinct_id(), t2, e2);
      this.Ri !== i2 ? (this.setPersonPropertiesForFlags({ $set: t2 || {}, $set_once: e2 || {} }, true), this.capture("$set", { $set: t2 || {}, $set_once: e2 || {} }), this.Ri = i2) : ai.info("A duplicate setPersonProperties call was made with the same properties. It has been ignored.");
    }
  }
  unsetPersonProperties(t2) {
    var e2, i2 = (j(t2) ? t2 : [t2]).filter(((t3) => V(t3) && t3.length > 0));
    0 !== i2.length && this.Yi("posthog.unsetPersonProperties") && (null == (e2 = this.featureFlags) || e2.unsetPersonPropertiesForFlags(i2, true), this.capture("$set", { $unset: i2 }), this.Ri = null);
  }
  group(t2, e2, i2) {
    if (t2 && e2) {
      var r2 = this.getGroups(), s2 = r2[t2] !== e2;
      if (s2 && this.resetGroupPropertiesForFlags(t2), this.register({ $groups: f({}, r2, { [t2]: e2 }) }), s2 || i2) {
        var n2 = { $group_type: t2, $group_key: e2 };
        i2 && (n2.$group_set = i2), this.capture(br, n2);
      }
      i2 && this.setGroupPropertiesForFlags({ [t2]: i2 }), s2 && !i2 && this.reloadFeatureFlags();
    } else ai.error("posthog.group requires a group type and group key");
  }
  resetGroups() {
    this.register({ $groups: {} }), this.resetGroupPropertiesForFlags(), this.reloadFeatureFlags();
  }
  setPersonPropertiesForFlags(t2, e2) {
    var i2;
    void 0 === e2 && (e2 = true), null == (i2 = this.featureFlags) || i2.setPersonPropertiesForFlags(t2, e2);
  }
  resetPersonPropertiesForFlags(t2) {
    var e2;
    void 0 === t2 && (t2 = true), null == (e2 = this.featureFlags) || e2.resetPersonPropertiesForFlags(t2);
  }
  setGroupPropertiesForFlags(t2, e2) {
    var i2;
    void 0 === e2 && (e2 = true), this.Yi("posthog.setGroupPropertiesForFlags") && (null == (i2 = this.featureFlags) || i2.setGroupPropertiesForFlags(t2, e2));
  }
  resetGroupPropertiesForFlags(t2) {
    var e2;
    null == (e2 = this.featureFlags) || e2.resetGroupPropertiesForFlags(t2);
  }
  reset(t2) {
    var e2, i2, r2, s2, n2, o2, a2, l2, u2;
    if (ai.info("reset"), !this.__loaded) return ai.uninitializedWarning("posthog.reset");
    var h2, d2 = this.get_property(vi), v2 = this.get_property(ci), c2 = this.get_property(Ti);
    if (this.consent.reset(), null == (e2 = this.persistence) || e2.clear(), null == (i2 = this.sessionPersistence) || i2.clear(), q(c2) || null == (h2 = this.persistence) || h2.register({ [Ti]: c2 }), null == (r2 = this.surveys) || r2.reset(), null == (s2 = this.Wi) || s2.stop(), null == (n2 = this.featureFlags) || n2.reset(), null == (o2 = this.conversations) || o2.reset(), null == (a2 = this.logs) || a2.reset(), null == (l2 = this.persistence) || l2.set_property(Qi, vr), null == (u2 = this.sessionManager) || u2.resetSessionId(), this.Ri = null, this.config.cookieless_mode === dr) this.register_once({ distinct_id: nr, $device_id: null }, "");
    else {
      var p2 = this.config.get_device_id(Lr());
      this.register_once({ distinct_id: p2, $device_id: t2 ? p2 : d2 }, ""), t2 || q(v2) || this.register({ [ci]: v2 });
    }
    this.register({ $last_posthog_reset: (/* @__PURE__ */ new Date()).toISOString() }, 1), delete this.config.identity_distinct_id, delete this.config.identity_hash, this.reloadFeatureFlags();
  }
  setIdentity(t2, e2) {
    var i2;
    this.config.identity_distinct_id = t2, this.config.identity_hash = e2, this.alias(t2), null == (i2 = this.conversations) || i2.en();
  }
  clearIdentity() {
    var t2;
    delete this.config.identity_distinct_id, delete this.config.identity_hash, null == (t2 = this.conversations) || t2.tn();
  }
  get_distinct_id() {
    return this.get_property("distinct_id");
  }
  getGroups() {
    return this.get_property("$groups") || {};
  }
  get_session_id() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this.sessionManager) ? void 0 : e2.checkAndGetSessionAndWindowId(true).sessionId) && void 0 !== t2 ? t2 : "";
  }
  get_session_replay_url(t2) {
    if (!this.sessionManager) return "";
    var { sessionId: e2, sessionStartTimestamp: i2 } = this.sessionManager.checkAndGetSessionAndWindowId(true), r2 = this.requestRouter.endpointFor("ui", "/project/" + this.config.token + "/replay/" + e2);
    if (null != t2 && t2.withTimestamp && i2) {
      var s2, n2 = null !== (s2 = t2.timestampLookBack) && void 0 !== s2 ? s2 : 10;
      if (!i2) return r2;
      r2 += "?t=" + Math.max(Math.floor(((/* @__PURE__ */ new Date()).getTime() - i2) / 1e3) - n2, 0);
    }
    return r2;
  }
  alias(t2, e2) {
    return t2 === this.get_property(di) ? (ai.critical("Attempting to create alias for existing People user - aborting."), -2) : this.Yi("posthog.alias") ? (q(e2) && (e2 = this.get_distinct_id()), t2 !== e2 ? (this.Ki(pi, t2), this.capture("$create_alias", { alias: t2, distinct_id: e2 })) : (ai.warn("alias matches current distinct_id - skipping api call."), this.identify(t2), -1)) : void 0;
  }
  set_config(t2) {
    var e2 = f({}, this.config);
    if (z(t2)) {
      var i2, r2, s2, n2, o2, a2, l2, u2, h2, d2, c2;
      xr(this.config, fa(t2));
      var p2 = this.Ai();
      null == (i2 = this.persistence) || i2.update_config(this.config, e2, p2), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new gn(f({}, this.config, { persistence: "sessionStorage" }), p2, false);
      var _2 = this.Oi(this.config.debug);
      Q(_2) && (this.config.debug = _2), Q(this.config.debug) && (this.config.debug ? (v.DEBUG = true, Hr.N() && Hr.q("ph_debug", true), ai.info("set_config", { config: t2, oldConfig: e2, newConfig: f({}, this.config) })) : (v.DEBUG = false, Hr.N() && Hr.A("ph_debug"))), null == (r2 = this.exceptionObserver) || r2.onConfigChange(), null == (s2 = this.exceptions) || s2.onConfigChange(), null == (n2 = this.sessionRecording) || n2.startIfEnabledOrStop(), null == (o2 = this.tracingHeaders) || o2.startIfEnabledOrStop(), null == (a2 = this.autocapture) || a2.startIfEnabled(), null == (l2 = this.heatmaps) || l2.startIfEnabled(), null == (u2 = this.exceptionObserver) || u2.startIfEnabledOrStop(), null == (h2 = this.deadClicksAutocapture) || h2.startIfEnabledOrStop(), null == (d2 = this.surveys) || d2.loadIfEnabled(), this.rn(), null == (c2 = this.externalIntegrations) || c2.startIfEnabledOrStop();
    }
  }
  _overrideSDKInfo(t2, e2) {
    v.LIB_NAME = t2, v.LIB_VERSION = e2;
  }
  startSessionRecording(t2) {
    var e2, i2, r2, s2, n2, o2 = true === t2, a2 = { sampling: o2 || !(null == t2 || !t2.sampling), linked_flag: o2 || !(null == t2 || !t2.linked_flag), url_trigger: o2 || !(null == t2 || !t2.url_trigger), event_trigger: o2 || !(null == t2 || !t2.event_trigger) };
    Object.values(a2).some(Boolean) && (null == (e2 = this.sessionManager) || e2.checkAndGetSessionAndWindowId(), a2.sampling && (null == (i2 = this.sessionRecording) || i2.overrideSampling()), a2.linked_flag && (null == (r2 = this.sessionRecording) || r2.overrideLinkedFlag()), a2.url_trigger && (null == (s2 = this.sessionRecording) || s2.overrideTrigger("url")), a2.event_trigger && (null == (n2 = this.sessionRecording) || n2.overrideTrigger("event")));
    this.set_config({ disable_session_recording: false });
  }
  stopSessionRecording() {
    this.set_config({ disable_session_recording: true });
  }
  sessionRecordingStarted() {
    var t2;
    return !(null == (t2 = this.sessionRecording) || !t2.started);
  }
  captureException(t2, e2) {
    if (this.exceptions) {
      var i2 = new Error("PostHog syntheticException"), r2 = this.exceptions.buildProperties(t2, { handled: true, syntheticException: i2 });
      return this.exceptions.sendExceptionEvent(f({}, r2, e2));
    }
  }
  addExceptionStep(t2, e2) {
    var i2;
    null == (i2 = this.exceptions) || i2.addExceptionStep(t2, e2);
  }
  captureLog(t2) {
    var e2;
    null == (e2 = this.logs) || e2.captureLog(t2);
  }
  get logger() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this.logs) ? void 0 : e2.logger) && void 0 !== t2 ? t2 : ga.nn;
  }
  startExceptionAutocapture(t2) {
    this.set_config({ capture_exceptions: null == t2 || t2 });
  }
  stopExceptionAutocapture() {
    this.set_config({ capture_exceptions: false });
  }
  loadToolbar(t2) {
    var e2, i2;
    return null !== (e2 = null == (i2 = this.toolbar) ? void 0 : i2.loadToolbar(t2)) && void 0 !== e2 && e2;
  }
  get_property(t2) {
    var e2;
    return null == (e2 = this.persistence) ? void 0 : e2.props[t2];
  }
  getSessionProperty(t2) {
    var e2;
    return null == (e2 = this.sessionPersistence) ? void 0 : e2.props[t2];
  }
  toString() {
    var t2, e2 = null !== (t2 = this.config.name) && void 0 !== t2 ? t2 : da;
    return e2 !== da && (e2 = da + "." + e2), e2;
  }
  _isIdentified() {
    var t2, e2;
    return (null == (t2 = this.persistence) ? void 0 : t2.get_property(Qi)) === cr || (null == (e2 = this.sessionPersistence) ? void 0 : e2.get_property(Qi)) === cr;
  }
  Ji() {
    var t2, e2;
    return !("never" === this.config.person_profiles || this.config.person_profiles === pr && !this._isIdentified() && H(this.getGroups()) && (null == (t2 = this.persistence) || null == (t2 = t2.props) || !t2[pi]) && (null == (e2 = this.persistence) || null == (e2 = e2.props) || !e2[rr]));
  }
  Gi() {
    return true === this.config.capture_pageleave || "if_capture_pageview" === this.config.capture_pageleave && (true === this.config.capture_pageview || "history_change" === this.config.capture_pageview);
  }
  createPersonProfile() {
    this.Ji() || this.Yi("posthog.createPersonProfile") && this.setPersonProperties({}, {});
  }
  setInternalOrTestUser() {
    this.Yi("posthog.setInternalOrTestUser") && this.setPersonProperties({ $internal_or_test_user: true });
  }
  Yi(t2) {
    return "never" === this.config.person_profiles ? (ai.error(t2 + ' was called, but process_person is set to "never". This call will be ignored.'), false) : (this.Ki(rr, true), true);
  }
  Ai() {
    if ("always" === this.config.cookieless_mode) return true;
    var t2 = this.consent.isOptedOut();
    return this.config.disable_persistence || t2 && !(!this.config.opt_out_persistence_by_default && this.config.cookieless_mode !== hr);
  }
  rn() {
    var t2, e2, i2, r2, s2 = this.Ai();
    return (null == (t2 = this.persistence) ? void 0 : t2.Vt) !== s2 && (null == (i2 = this.persistence) || i2.set_disabled(s2)), (null == (e2 = this.sessionPersistence) ? void 0 : e2.Vt) !== s2 && (null == (r2 = this.sessionPersistence) || r2.set_disabled(s2)), s2;
  }
  opt_in_capturing(t2) {
    var e2;
    if (this.config.cookieless_mode !== dr) {
      if (this.Ci()) {
        var i2, r2, s2, n2, o2;
        this.reset(true), null == (i2 = this.sessionManager) || i2.destroy(), null == (r2 = this.pageViewManager) || r2.destroy(), this.sessionManager = new No(this), this.pageViewManager = new Hs(this), this.persistence && (this.sessionPropsManager = new Mo(this, this.sessionManager, this.persistence));
        var a2, l2 = null !== (s2 = null == (n2 = this.config.__extensionClasses) ? void 0 : n2.sessionRecording) && void 0 !== s2 ? s2 : null == (o2 = ga.__defaultExtensionClasses) ? void 0 : o2.sessionRecording;
        l2 && (this.sessionRecording = this.ki(this.sessionRecording, new l2(this)), this.Ui && (null == (a2 = this.sessionRecording) || null == a2.onRemoteConfig || a2.onRemoteConfig(this.Ui)));
      }
      var u2, h2;
      this.consent.optInOut(true), this.rn(), this.zi(), null == (e2 = this.sessionRecording) || e2.startIfEnabledOrStop(), this.config.cookieless_mode == hr && (null == (u2 = this.surveys) || u2.loadIfEnabled()), (q(null == t2 ? void 0 : t2.captureEventName) || null != t2 && t2.captureEventName) && this.capture(null !== (h2 = null == t2 ? void 0 : t2.captureEventName) && void 0 !== h2 ? h2 : "$opt_in", null == t2 ? void 0 : t2.captureProperties, { send_instantly: true }), this.config.capture_pageview && this.Vi();
    } else ai.warn(aa);
  }
  opt_out_capturing() {
    var t2, e2, i2;
    this.config.cookieless_mode !== dr ? (this.config.cookieless_mode === hr && this.consent.isOptedIn() && this.reset(true), this.consent.optInOut(false), this.rn(), this.config.cookieless_mode === hr && (this.register({ distinct_id: nr, $device_id: null }), null == (t2 = this.sessionRecording) || t2.stopRecording(), this.sessionRecording = void 0, null == (e2 = this.sessionManager) || e2.destroy(), null == (i2 = this.pageViewManager) || i2.destroy(), this.sessionManager = void 0, this.sessionPropsManager = void 0, this.config.capture_pageview && this.Vi(), this.zi())) : ai.warn(aa);
  }
  has_opted_in_capturing() {
    return this.consent.isOptedIn();
  }
  has_opted_out_capturing() {
    return this.consent.isOptedOut();
  }
  get_explicit_consent_status() {
    var t2 = this.consent.consent;
    return 1 === t2 ? "granted" : 0 === t2 ? "denied" : "pending";
  }
  is_capturing() {
    return this.config.cookieless_mode === dr || (this.config.cookieless_mode === hr ? this.consent.isRejected() || this.consent.isOptedIn() : !this.has_opted_out_capturing());
  }
  clear_opt_in_out_capturing() {
    this.consent.reset(), this.rn();
  }
  _is_bot() {
    return i ? Uo(i, this.config.custom_blocked_useragents) : void 0;
  }
  Vi() {
    r && ("visible" === r.visibilityState ? this.Ei || (this.Ei = true, this.capture(gr, { title: r.title }, { send_instantly: true }), this.Mi && (r.removeEventListener(fr, this.Mi), this.Mi = null)) : this.Mi || (this.Mi = this.Vi.bind(this), Ir(r, fr, this.Mi)));
  }
  debug(e2) {
    false === e2 ? (null == t || t.console.log("You've disabled debug mode."), this.set_config({ debug: false })) : (null == t || t.console.log("You're now in debug mode. All calls to PostHog will be logged in your console.\nYou can disable this with `posthog.debug(false)`."), this.set_config({ debug: true }));
  }
  mr() {
    var t2, e2, i2, r2, s2, n2, o2 = this.Li || {};
    return "advanced_disable_flags" in o2 ? !!o2.advanced_disable_flags : false !== this.config.advanced_disable_flags ? !!this.config.advanced_disable_flags : true === this.config.advanced_disable_decide ? (ai.warn("Config field 'advanced_disable_decide' is deprecated. Please use 'advanced_disable_flags' instead. The old field will be removed in a future major version."), true) : (i2 = "advanced_disable_decide", r2 = ai, s2 = (e2 = "advanced_disable_flags") in (t2 = o2) && !Y(t2[e2]), n2 = i2 in t2 && !Y(t2[i2]), s2 ? t2[e2] : !!n2 && (r2 && r2.warn("Config field '" + i2 + "' is deprecated. Please use '" + e2 + "' instead. The old field will be removed in a future major version."), t2[i2]));
  }
  it(t2) {
    var e2;
    if (Y(this.config.before_send)) return t2;
    var i2 = Object.keys(null !== (e2 = t2.properties) && void 0 !== e2 ? e2 : {}).filter(tt), r2 = j(this.config.before_send) ? this.config.before_send : [this.config.before_send], s2 = t2;
    for (var n2 of r2) {
      if (s2 = n2(s2), Y(s2)) {
        var o2 = "Event '" + t2.event + "' was rejected in beforeSend function";
        return Z(t2.event) ? ai.warn(o2 + ". This can cause unexpected behavior.") : ai.info(o2), null;
      }
      s2.properties && !H(s2.properties) || ai.warn("Event '" + t2.event + "' has no properties after beforeSend function, this is likely an error.");
    }
    for (var a2 of i2) if (s2.properties && Y(s2.properties[a2])) return ai.warn("Event '" + t2.event + "' had its '" + a2 + "' property removed in a beforeSend function. This property is required for ingestion, so the event will be dropped."), null;
    return s2;
  }
  getPageViewId() {
    var t2;
    return null == (t2 = this.pageViewManager.Ot) ? void 0 : t2.pageViewId;
  }
  captureTraceFeedback(t2, e2) {
    this.capture("$ai_feedback", { $ai_trace_id: String(t2), $ai_feedback_text: e2 });
  }
  captureTraceMetric(t2, e2, i2) {
    this.capture("$ai_metric", { $ai_trace_id: String(t2), $ai_metric_name: e2, $ai_metric_value: String(i2) });
  }
  Oi(t2) {
    var e2 = Q(t2) && !t2, i2 = Hr.N() && "true" === Hr.P("ph_debug");
    return !e2 && (!!i2 || t2);
  }
}
ga.__defaultExtensionClasses = {}, ga.nn = { trace: ra = () => {
}, debug: ra, info: ra, warn: ra, error: ra, fatal: ra }, (function(t2, e2) {
  for (var i2 = 0; e2.length > i2; i2++) t2.prototype[e2[i2]] = $r(t2.prototype[e2[i2]]);
})(ga, ["identify"]);
class ma {
  constructor(t2) {
    this.disabled = false === t2;
    var e2 = z(t2) ? t2 : {};
    this.thresholdPx = e2.threshold_px || 30, this.timeoutMs = e2.timeout_ms || 1e3, this.clickCount = e2.click_count || 3, this.clicks = [];
  }
  isRageClick(t2, e2, i2) {
    if (this.disabled) return false;
    var r2 = this.clicks[this.clicks.length - 1];
    if (r2 && Math.abs(t2 - r2.x) + Math.abs(e2 - r2.y) < this.thresholdPx && this.timeoutMs > i2 - r2.timestamp) {
      if (this.clicks.push({ x: t2, y: e2, timestamp: i2 }), this.clicks.length === this.clickCount) return true;
    } else this.clicks = [{ x: t2, y: e2, timestamp: i2 }];
    return false;
  }
}
var ya = "$copy_autocapture", ba = li("[AutoCapture]");
function wa(t2, e2) {
  return e2.length > t2 ? e2.slice(0, t2) + "..." : e2;
}
function Ea(t2) {
  if (t2.previousElementSibling) return t2.previousElementSibling;
  var e2 = t2;
  do {
    e2 = e2.previousSibling;
  } while (e2 && !ts(e2));
  return e2;
}
function xa(e2, i2) {
  var r2, s2, { e: n2, maskAllElementAttributes: o2, maskAllText: a2, elementAttributeIgnoreList: l2, elementsChainAsString: u2, disableCaptureUrlHashes: h2 } = i2;
  if (!ts(e2)) return { props: {} };
  for (var d2 = [e2], v2 = e2; v2.parentNode && !es(v2, "body"); ) if (rs(v2.parentNode)) d2.push(v2.parentNode.host), v2 = v2.parentNode.host;
  else {
    if (!ts(v2.parentNode)) break;
    d2.push(v2.parentNode), v2 = v2.parentNode;
  }
  var c2, p2, _2 = [], g2 = {}, m2 = false, y2 = false;
  if (Er(d2, ((t2) => {
    var e3 = Es(t2);
    if (es(t2, "a")) {
      var i3 = t2.getAttribute("href");
      m2 = !!(e3 && i3 && Is(i3)) && (h2 ? fe(i3) : i3);
    }
    F(os(t2), "ph-no-capture") && (y2 = true), _2.push((function(t3, e4, i4, r4, s3) {
      void 0 === s3 && (s3 = false);
      var n3 = t3.tagName.toLowerCase(), o3 = { tag_name: n3 };
      hs.indexOf(n3) > -1 && !i4 && (o3.$el_text = "a" === n3.toLowerCase() || "button" === n3.toLowerCase() ? wa(1024, Os(t3)) : wa(1024, ls(t3)));
      var a3 = os(t3);
      a3.length > 0 && (o3.classes = a3.filter((function(t4) {
        return "" !== t4;
      }))), Er(t3.attributes, (function(i5) {
        var n4;
        if ((!xs(t3) || -1 !== ["name", "id", "class", "aria-label"].indexOf(i5.name)) && (null == r4 || !r4.includes(i5.name)) && !e4 && Is(i5.value) && (!V(n4 = i5.name) || "_ngcontent" !== n4.substring(0, 10) && "_nghost" !== n4.substring(0, 7))) {
          var a4 = i5.value;
          "class" === i5.name && (a4 = ss(a4).join(" ")), o3["attr__" + i5.name] = wa(1024, "href" === i5.name && s3 ? fe(a4) : a4);
        }
      }));
      for (var l3 = 1, u3 = 1, h3 = t3; h3 = Ea(h3); ) l3++, h3.tagName === t3.tagName && u3++;
      return o3.nth_child = l3, o3.nth_of_type = u3, o3;
    })(t2, o2, a2, l2, h2));
    var r3 = (function(t3) {
      if (!Es(t3)) return {};
      var e4 = {};
      return Er(t3.attributes, (function(t4) {
        if (t4.name && 0 === t4.name.indexOf("data-ph-capture-attribute")) {
          var i4 = t4.name.replace("data-ph-capture-attribute-", ""), r4 = t4.value;
          i4 && r4 && Is(r4) && (e4[i4] = r4);
        }
      })), e4;
    })(t2);
    xr(g2, r3);
  })), y2) return { props: {}, explicitNoCapture: y2 };
  if (a2 || (_2[0].$el_text = es(e2, "a") || es(e2, "button") ? Os(e2) : ls(e2)), m2) {
    var b2, w2;
    _2[0].attr__href = m2;
    var E2 = null == (b2 = Ys(m2)) ? void 0 : b2.host, x2 = null == t || null == (w2 = t.location) ? void 0 : w2.host;
    E2 && x2 && E2 !== x2 && (c2 = m2);
  }
  return { props: xr({ $event_type: n2.type, $ce_version: 1 }, u2 ? {} : { $elements: _2 }, { $elements_chain: (p2 = _2, (function(t2) {
    return t2.map(((t3) => {
      var e3, i3, r3 = "";
      if (t3.tag_name && (r3 += t3.tag_name), t3.attr_class) for (var s3 of (t3.attr_class.sort(), t3.attr_class)) r3 += "." + s3.replace(/"/g, "");
      var n3 = f({}, t3.text ? { text: t3.text } : {}, { "nth-child": null !== (e3 = t3.nth_child) && void 0 !== e3 ? e3 : 0, "nth-of-type": null !== (i3 = t3.nth_of_type) && void 0 !== i3 ? i3 : 0 }, t3.href ? { href: t3.href } : {}, t3.attr_id ? { attr_id: t3.attr_id } : {}, t3.attributes), o3 = {};
      return Sr(n3).sort(((t4, e4) => {
        var [i4] = t4, [r4] = e4;
        return i4.localeCompare(r4);
      })).forEach(((t4) => {
        var [e4, i4] = t4;
        return o3[As(e4.toString())] = As(i4.toString());
      })), (r3 += ":") + Sr(o3).map(((t4) => {
        var [e4, i4] = t4;
        return e4 + '="' + i4 + '"';
      })).join("");
    })).join(";");
  })((function(t2) {
    return t2.map(((t3) => {
      var e3, i3, r3 = { text: null == (e3 = t3.$el_text) ? void 0 : e3.slice(0, 400), tag_name: t3.tag_name, href: null == (i3 = t3.attr__href) ? void 0 : i3.slice(0, 2048), attr_class: Fs(t3), attr_id: t3.attr__id, nth_child: t3.nth_child, nth_of_type: t3.nth_of_type, attributes: {} };
      return Sr(t3).filter(((t4) => {
        var [e4] = t4;
        return 0 === e4.indexOf("attr__");
      })).forEach(((t4) => {
        var [e4, i4] = t4;
        return r3.attributes[e4] = i4;
      })), r3;
    }));
  })(p2))) }, null != (r2 = _2[0]) && r2.$el_text ? { $el_text: null == (s2 = _2[0]) ? void 0 : s2.$el_text } : {}, c2 && "click" === n2.type ? { $external_click_url: c2 } : {}, g2) };
}
var Sa = li("[ExceptionAutocapture]"), Ta = li("[TracingHeaders]"), $a = li("[Web Vitals]"), ka = 9e5, Ra = "disabled", Pa = "lazy_loading", Ia = "awaiting_config", Oa = "missing_config";
li("[SessionRecording]"), li("[SessionRecording]");
var Ca = "[SessionRecording]", Aa = li(Ca), Fa = li("[Heatmaps]");
function Ma(t2) {
  return z(t2) && "clientX" in t2 && "clientY" in t2 && K(t2.clientX) && K(t2.clientY);
}
var Da = li("[Product Tours]"), La = (t2) => {
  var e2;
  return !t2.config.disable_product_tours && !(null == (e2 = t2.persistence) || !e2.get_property(xi));
}, Na = ["$set_once", "$set"], Ua = li("[SiteApps]"), ja = "Error while initializing PostHog app with config id ";
function Ba(t2, e2, i2) {
  if (Y(t2)) return false;
  switch (i2) {
    case "exact":
      return t2 === e2;
    case "contains":
      var r2 = e2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/_/g, ".").replace(/%/g, ".*");
      return new RegExp(r2, "i").test(t2);
    case "regex":
      try {
        return new RegExp(e2).test(t2);
      } catch (t3) {
        return false;
      }
    default:
      return false;
  }
}
class za {
  constructor(t2) {
    this.sn = new Do(), this.an = (t3, e2) => this.ln(t3, e2) && this.un(t3, e2) && this.hn(t3, e2) && this.dn(t3, e2), this.ln = (t3, e2) => null == e2 || !e2.event || (null == t3 ? void 0 : t3.event) === (null == e2 ? void 0 : e2.event), this._instance = t2, this.cn = /* @__PURE__ */ new Set(), this.vn = /* @__PURE__ */ new Set();
  }
  init() {
    var t2, e2;
    q(null == (t2 = this._instance) ? void 0 : t2._addCaptureHook) || (null == (e2 = this._instance) || e2._addCaptureHook(((t3, e3) => {
      this.on(t3, e3);
    })));
  }
  register(t2) {
    var e2, i2;
    if (!q(null == (e2 = this._instance) ? void 0 : e2._addCaptureHook) && (t2.forEach(((t3) => {
      var e3, i3;
      null == (e3 = this.vn) || e3.add(t3), null == (i3 = t3.steps) || i3.forEach(((t4) => {
        var e4;
        null == (e4 = this.cn) || e4.add((null == t4 ? void 0 : t4.event) || "");
      }));
    })), null != (i2 = this._instance) && i2.autocapture)) {
      var r2, s2 = /* @__PURE__ */ new Set();
      t2.forEach(((t3) => {
        var e3;
        null == (e3 = t3.steps) || e3.forEach(((t4) => {
          null != t4 && t4.selector && s2.add(null == t4 ? void 0 : t4.selector);
        }));
      })), null == (r2 = this._instance) || r2.autocapture.setElementSelectors(s2);
    }
  }
  on(t2, e2) {
    var i2;
    null != e2 && 0 != t2.length && (this.cn.has(t2) || this.cn.has(null == e2 ? void 0 : e2.event)) && this.vn && (null == (i2 = this.vn) ? void 0 : i2.size) > 0 && this.vn.forEach(((t3) => {
      this.fn(e2, t3) && this.sn.emit("actionCaptured", t3.name);
    }));
  }
  pn(t2) {
    this.onAction("actionCaptured", ((e2) => t2(e2)));
  }
  fn(t2, e2) {
    if (null == (null == e2 ? void 0 : e2.steps)) return false;
    for (var i2 of e2.steps) if (this.an(t2, i2)) return true;
    return false;
  }
  onAction(t2, e2) {
    return this.sn.on(t2, e2);
  }
  un(t2, e2) {
    if (null != e2 && e2.url) {
      var i2, r2 = null == t2 || null == (i2 = t2.properties) ? void 0 : i2.$current_url;
      if (!r2 || "string" != typeof r2) return false;
      if (!Ba(r2, e2.url, e2.url_matching || "contains")) return false;
    }
    return true;
  }
  hn(t2, e2) {
    return !!this.gn(t2, e2) && !!this.mn(t2, e2) && !!this.yn(t2, e2);
  }
  gn(t2, e2) {
    var i2;
    if (null == e2 || !e2.href) return true;
    var r2 = this.bn(t2);
    if (r2.length > 0) return r2.some(((t3) => Ba(t3.href, e2.href, e2.href_matching || "exact")));
    var s2, n2 = (null == t2 || null == (i2 = t2.properties) ? void 0 : i2.$elements_chain) || "";
    return !!n2 && Ba((s2 = n2.match(/(?::|")href="(.*?)"/)) ? s2[1] : "", e2.href, e2.href_matching || "exact");
  }
  mn(t2, e2) {
    var i2;
    if (null == e2 || !e2.text) return true;
    var r2 = this.bn(t2);
    if (r2.length > 0) return r2.some(((t3) => Ba(t3.text, e2.text, e2.text_matching || "exact") || Ba(t3.$el_text, e2.text, e2.text_matching || "exact")));
    var s2, n2, o2, a2 = (null == t2 || null == (i2 = t2.properties) ? void 0 : i2.$elements_chain) || "";
    return !!a2 && (s2 = (function(t3) {
      for (var e3, i3 = [], r3 = /(?::|")text="(.*?)"/g; !Y(e3 = r3.exec(t3)); ) i3.includes(e3[1]) || i3.push(e3[1]);
      return i3;
    })(a2), n2 = e2.text, o2 = e2.text_matching || "exact", s2.some(((t3) => Ba(t3, n2, o2))));
  }
  yn(t2, e2) {
    var i2, r2;
    if (null == e2 || !e2.selector) return true;
    var s2 = null == t2 || null == (i2 = t2.properties) ? void 0 : i2.$element_selectors;
    if (null != s2 && s2.includes(e2.selector)) return true;
    var n2 = (null == t2 || null == (r2 = t2.properties) ? void 0 : r2.$elements_chain) || "";
    if (e2.selector_regex && n2) try {
      return new RegExp(e2.selector_regex).test(n2);
    } catch (t3) {
      return false;
    }
    return false;
  }
  bn(t2) {
    var e2;
    return null == (null == t2 || null == (e2 = t2.properties) ? void 0 : e2.$elements) ? [] : null == t2 ? void 0 : t2.properties.$elements;
  }
  dn(t2, e2) {
    return null == e2 || !e2.properties || 0 === e2.properties.length || Vo(e2.properties.reduce(((t3, e3) => {
      var i2 = j(e3.value) ? e3.value.map(String) : null != e3.value ? [String(e3.value)] : [];
      return t3[e3.key] = { values: i2, operator: e3.operator || "exact" }, t3;
    }), {}), null == t2 ? void 0 : t2.properties);
  }
}
class Ha {
  constructor(t2) {
    this._n = [], this._instance = t2, this.wn = /* @__PURE__ */ new Map(), this.xn = /* @__PURE__ */ new Map(), this.kn = /* @__PURE__ */ new Map();
  }
  Sn(t2, e2) {
    return !!t2 && Vo(t2.propertyFilters, null == e2 ? void 0 : e2.properties);
  }
  Cn(t2, e2) {
    var i2 = /* @__PURE__ */ new Map();
    return t2.forEach(((t3) => {
      var r2;
      null == (r2 = t3.conditions) || null == (r2 = r2[e2]) || null == (r2 = r2.values) || r2.forEach(((e3) => {
        if (null != e3 && e3.name) {
          var r3 = i2.get(e3.name) || [];
          r3.push(t3.id), i2.set(e3.name, r3);
        }
      }));
    })), i2;
  }
  In(t2, e2, i2) {
    var r2 = (i2 === mn.Activation ? this.wn : this.xn).get(t2), s2 = [];
    return this.Tn(((t3) => {
      s2 = t3.filter(((t4) => null == r2 ? void 0 : r2.includes(t4.id)));
    })), s2.filter(((r3) => {
      var s3, n2 = null == (s3 = r3.conditions) || null == (s3 = s3[i2]) || null == (s3 = s3.values) ? void 0 : s3.find(((e3) => e3.name === t2));
      return this.Sn(n2, e2);
    }));
  }
  register(t2) {
    var e2;
    q(null == (e2 = this._instance) ? void 0 : e2._addCaptureHook) || (this.En(t2), this.Mn(t2));
  }
  Mn(t2) {
    var e2 = t2.filter(((t3) => {
      var e3, i2;
      return (null == (e3 = t3.conditions) ? void 0 : e3.actions) && (null == (i2 = t3.conditions) || null == (i2 = i2.actions) || null == (i2 = i2.values) ? void 0 : i2.length) > 0;
    }));
    0 !== e2.length && (null == this.Pn && (this.Pn = new za(this._instance), this.Pn.init(), this.Pn.pn(((t3) => {
      this.onAction(t3);
    }))), e2.forEach(((t3) => {
      var e3, i2, r2, s2, n2;
      t3.conditions && null != (e3 = t3.conditions) && e3.actions && null != (i2 = t3.conditions) && null != (i2 = i2.actions) && i2.values && (null == (r2 = t3.conditions) || null == (r2 = r2.actions) || null == (r2 = r2.values) ? void 0 : r2.length) > 0 && (null == (s2 = this.Pn) || s2.register(t3.conditions.actions.values), null == (n2 = t3.conditions) || null == (n2 = n2.actions) || null == (n2 = n2.values) || n2.forEach(((e4) => {
        if (e4 && e4.name) {
          var i3 = this.kn.get(e4.name);
          i3 && i3.push(t3.id), this.kn.set(e4.name, i3 || [t3.id]);
        }
      })));
    })));
  }
  En(t2) {
    var e2, i2 = t2.filter(((t3) => {
      var e3, i3;
      return (null == (e3 = t3.conditions) ? void 0 : e3.events) && (null == (i3 = t3.conditions) || null == (i3 = i3.events) || null == (i3 = i3.values) ? void 0 : i3.length) > 0;
    })), r2 = t2.filter(((t3) => {
      var e3, i3;
      return (null == (e3 = t3.conditions) ? void 0 : e3.cancelEvents) && (null == (i3 = t3.conditions) || null == (i3 = i3.cancelEvents) || null == (i3 = i3.values) ? void 0 : i3.length) > 0;
    }));
    0 === i2.length && 0 === r2.length || (null == (e2 = this._instance) || e2._addCaptureHook(((t3, e3) => {
      this.onEvent(t3, e3);
    })), this.wn = this.Cn(t2, mn.Activation), this.xn = this.Cn(t2, mn.Cancellation));
  }
  onEvent(t2, e2) {
    var i2, r2, s2 = this.Rn(), n2 = (null == e2 || null == (i2 = e2.properties) ? void 0 : i2.$survey_id) || (null == e2 || null == (r2 = e2.properties) ? void 0 : r2.$product_tour_id);
    if (n2 && this.getActivatedIds().includes(n2)) {
      var o2 = this.On(t2, n2);
      if ("consume" === o2) return s2.info("event consumed activated item, removing it", { event: t2, itemId: n2 }), void this.Ln([n2]);
      if ("persist" === o2) return s2.info("shown item promoted to persisted activation", { event: t2, itemId: n2 }), void this.Fn(n2);
    }
    if (this.xn.has(t2)) {
      var a2 = this.In(t2, e2, mn.Cancellation);
      a2.length > 0 && (s2.info("cancel event matched, cancelling items", { event: t2, itemsToCancel: a2.map(((t3) => t3.id)) }), this.Ln(a2.map(((t3) => t3.id))), a2.forEach(((t3) => this.An(t3.id))));
    }
    if (this.wn.has(t2)) {
      s2.info("event name matched", { event: t2, eventPayload: e2, items: this.wn.get(t2) });
      var l2 = this.In(t2, e2, mn.Activation);
      this.$n(l2.map(((t3) => t3.id)));
    }
  }
  onAction(t2) {
    this.kn.has(t2) && this.$n(this.kn.get(t2) || []);
  }
  $n(t2) {
    0 !== t2.length && (this._n = [.../* @__PURE__ */ new Set([...this._n, ...t2])], this.Rn().info("updating activated items", { activatedItems: this.getActivatedIds() }));
  }
  Fn(t2) {
    this._n = this._n.filter(((e3) => e3 !== t2));
    var e2 = this.Dn();
    e2.includes(t2) || this.Nn([...e2, t2]);
  }
  Ln(t2) {
    var e2 = new Set(t2);
    this._n = this._n.filter(((t3) => !e2.has(t3)));
    var i2 = this.Dn(), r2 = i2.filter(((t3) => !e2.has(t3)));
    r2.length !== i2.length && this.Nn(r2);
  }
  Dn() {
    var t2, e2 = this.qn();
    return (null == (t2 = this._instance) || null == (t2 = t2.persistence) ? void 0 : t2.props[e2]) || [];
  }
  getActivatedIds() {
    return [.../* @__PURE__ */ new Set([...this.Dn(), ...this._n])].filter(((t2) => !this.jn(t2)));
  }
  reset() {
    this._n = [], this.Dn().length > 0 && this.Nn([]);
  }
  getEventToItemsMap() {
    return this.wn;
  }
  Bn() {
    return this.Pn;
  }
}
class qa extends Ha {
  constructor(t2) {
    super(t2);
  }
  qn() {
    return Vi;
  }
  Hn() {
    return $n.SHOWN;
  }
  Tn(t2) {
    var e2;
    null == (e2 = this._instance) || e2.getSurveys(t2);
  }
  An(t2) {
    var e2;
    null == (e2 = this._instance) || e2.cancelPendingSurvey(t2);
  }
  Rn() {
    return Jo;
  }
  Nn(t2) {
    var e2;
    null == (e2 = this._instance) || null == (e2 = e2.persistence) || e2.register({ [Vi]: t2 });
  }
  jn() {
    return false;
  }
  On(t2, e2) {
    var i2;
    this.Tn(((t3) => {
      i2 = t3.find(((t4) => t4.id === e2));
    }));
    var r2 = !i2 || (function(t3) {
      var e3, i3, r3, s2 = (null !== (e3 = null == (i3 = t3.conditions) || null == (i3 = i3.events) || null == (i3 = i3.values) ? void 0 : i3.length) && void 0 !== e3 ? e3 : 0) > 0;
      return t3.schedule === Tn.Always || !(null == (r3 = t3.conditions) || null == (r3 = r3.events) || !r3.repeatedActivation || !s2);
    })(i2);
    return r2 ? t2 === $n.SHOWN ? "consume" : "ignore" : t2 === $n.SHOWN ? "persist" : t2 === $n.DISMISSED || t2 === $n.SENT ? "consume" : "ignore";
  }
  getSurveys() {
    return this.getActivatedIds();
  }
  getEventToSurveys() {
    return this.getEventToItemsMap();
  }
}
var Va = "SDK is not enabled or survey functionality is not yet loaded", Ga = "Disabled. Not loading surveys.", Wa = null != t && t.location ? Qs(t.location.hash, "__posthog") || Qs(location.hash, "state") : null, Ya = "_postHogToolbarParams", Ka = li("[Toolbar]"), Ja = li("[FeatureFlags]"), Qa = li("[FeatureFlags]", { debugEnabled: true }), Xa = `" failed. Feature flags didn't load in time.`, Za = (t2) => {
  for (var e2 = {}, i2 = 0; t2.length > i2; i2++) e2[t2[i2]] = true;
  return e2;
}, tl = (t2) => {
  var e2 = {};
  for (var [i2, r2] of Sr(t2 || {})) r2 && (e2[i2] = r2);
  return e2;
}, el = li("[Error tracking]"), il = "Refusing to render web experiment since the viewer is a likely bot", rl = { icontains: (e2, i2) => !!t && i2.href.toLowerCase().indexOf(e2.toLowerCase()) > -1, not_icontains: (e2, i2) => !!t && -1 === i2.href.toLowerCase().indexOf(e2.toLowerCase()), regex: (e2, i2) => !!t && Bo(i2.href, e2), not_regex: (e2, i2) => !!t && !Bo(i2.href, e2), exact: (t2, e2) => e2.href === t2, is_not: (t2, e2) => e2.href !== t2 };
class sl {
  get Se() {
    return this._instance.config;
  }
  constructor(t2) {
    var e2 = this;
    this.getWebExperimentsAndEvaluateDisplayLogic = function(t3) {
      void 0 === t3 && (t3 = false), e2.getWebExperiments(((t4) => {
        sl.Un("retrieved web experiments from the server"), e2.zn = /* @__PURE__ */ new Map(), t4.forEach(((t5) => {
          if (t5.feature_flag_key) {
            var i2;
            e2.zn && (sl.Un("setting flag key ", t5.feature_flag_key, " to web experiment ", t5), null == (i2 = e2.zn) || i2.set(t5.feature_flag_key, t5));
            var r2 = e2._instance.getFeatureFlag(t5.feature_flag_key);
            V(r2) && t5.variants[r2] && e2.Vn(t5.name, r2, t5.variants[r2].transforms);
          } else if (t5.variants) for (var s2 in t5.variants) {
            var n2 = t5.variants[s2];
            sl.Wn(n2) && e2.Vn(t5.name, s2, n2.transforms);
          }
        }));
      }), t3);
    }, this._instance = t2, this._instance.onFeatureFlags(((t3) => {
      this.onFeatureFlags(t3);
    }));
  }
  initialize() {
  }
  onFeatureFlags(t2) {
    if (this._is_bot()) sl.Un(il);
    else if (!this.Se.disable_web_experiments) {
      if (Y(this.zn)) return this.zn = /* @__PURE__ */ new Map(), this.loadIfEnabled(), void this.previewWebExperiment();
      sl.Un("applying feature flags", t2), t2.forEach(((t3) => {
        var e2;
        if (this.zn && null != (e2 = this.zn) && e2.has(t3)) {
          var i2, r2 = this._instance.getFeatureFlag(t3), s2 = null == (i2 = this.zn) ? void 0 : i2.get(t3);
          r2 && null != s2 && s2.variants[r2] && this.Vn(s2.name, r2, s2.variants[r2].transforms);
        }
      }));
    }
  }
  previewWebExperiment() {
    var t2 = sl.getWindowLocation();
    if (null != t2 && t2.search) {
      var e2 = Ks(null == t2 ? void 0 : t2.search, "__experiment_id"), i2 = Ks(null == t2 ? void 0 : t2.search, "__experiment_variant");
      e2 && i2 && (sl.Un("previewing web experiments " + e2 + " && " + i2), this.getWebExperiments(((t3) => {
        this.Gn(parseInt(e2), i2, t3);
      }), false, true));
    }
  }
  loadIfEnabled() {
    this.Se.disable_web_experiments || this.getWebExperimentsAndEvaluateDisplayLogic();
  }
  getWebExperiments(t2, e2, i2) {
    if (this.Se.disable_web_experiments && !i2) return t2([]);
    var r2 = this._instance.get_property("$web_experiments");
    if (r2 && !e2) return t2(r2);
    this._instance._send_request({ url: this._instance.requestRouter.endpointFor("api", "/api/web_experiments/?token=" + this.Se.token), method: "GET", callback: (e3) => t2(200 === e3.statusCode && e3.json && e3.json.experiments || []) });
  }
  Gn(t2, e2, i2) {
    var r2 = i2.filter(((e3) => e3.id === t2));
    r2 && r2.length > 0 && (sl.Un("Previewing web experiment [" + r2[0].name + "] with variant [" + e2 + "]"), this.Vn(r2[0].name, e2, r2[0].variants[e2].transforms));
  }
  static Wn(t2) {
    return !Y(t2.conditions) && sl.Zn(t2) && sl.Qn(t2);
  }
  static Zn(t2) {
    var e2;
    if (Y(t2.conditions) || Y(null == (e2 = t2.conditions) ? void 0 : e2.url)) return true;
    var i2, r2, s2, n2 = sl.getWindowLocation();
    return !!n2 && (null == (i2 = t2.conditions) || !i2.url || rl[null !== (r2 = null == (s2 = t2.conditions) ? void 0 : s2.urlMatchType) && void 0 !== r2 ? r2 : "icontains"](t2.conditions.url, n2));
  }
  static getWindowLocation() {
    return null == t ? void 0 : t.location;
  }
  static Qn(t2) {
    var e2;
    if (Y(t2.conditions) || Y(null == (e2 = t2.conditions) ? void 0 : e2.utm)) return true;
    var i2 = sn();
    if (i2.utm_source) {
      var r2, s2, n2, o2, a2, l2, u2, h2, d2 = null == (r2 = t2.conditions) || null == (r2 = r2.utm) || !r2.utm_campaign || (null == (s2 = t2.conditions) || null == (s2 = s2.utm) ? void 0 : s2.utm_campaign) == i2.utm_campaign, v2 = null == (n2 = t2.conditions) || null == (n2 = n2.utm) || !n2.utm_source || (null == (o2 = t2.conditions) || null == (o2 = o2.utm) ? void 0 : o2.utm_source) == i2.utm_source, c2 = null == (a2 = t2.conditions) || null == (a2 = a2.utm) || !a2.utm_medium || (null == (l2 = t2.conditions) || null == (l2 = l2.utm) ? void 0 : l2.utm_medium) == i2.utm_medium, p2 = null == (u2 = t2.conditions) || null == (u2 = u2.utm) || !u2.utm_term || (null == (h2 = t2.conditions) || null == (h2 = h2.utm) ? void 0 : h2.utm_term) == i2.utm_term;
      return d2 && c2 && p2 && v2;
    }
    return false;
  }
  static Un(t2) {
    for (var e2 = arguments.length, i2 = new Array(e2 > 1 ? e2 - 1 : 0), r2 = 1; e2 > r2; r2++) i2[r2 - 1] = arguments[r2];
    ai.info("[WebExperiments] " + t2, i2);
  }
  Vn(t2, e2, i2) {
    this._is_bot() ? sl.Un(il) : "control" !== e2 ? i2.forEach(((i3) => {
      if (i3.selector) {
        var r2;
        sl.Un("applying transform of variant " + e2 + " for experiment " + t2 + " ", i3);
        var s2 = null == (r2 = document) ? void 0 : r2.querySelectorAll(i3.selector);
        null == s2 || s2.forEach(((t3) => {
          var e3 = t3;
          i3.html && (e3.innerHTML = i3.html), i3.css && e3.setAttribute("style", i3.css);
        }));
      }
    })) : sl.Un("Control variants leave the page unmodified.");
  }
  _is_bot() {
    return i && this._instance ? Uo(i, this.Se.custom_blocked_useragents) : void 0;
  }
}
var nl = li("[Conversations]"), ol = "Conversations not available yet.", al = "console", ll = { featureFlags: class {
  constructor(t2) {
    this.Jn = false, this.Yn = false, this.Kn = false, this.Xn = false, this.es = false, this.ts = false, this.rs = false, this.ns = false, this._instance = t2, this.featureFlagEventHandlers = [];
  }
  get Se() {
    return this._instance.config;
  }
  get zr() {
    return this._instance.persistence;
  }
  ss(t2) {
    return this._instance.get_property(t2);
  }
  os() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this.zr) ? void 0 : e2.Gt(this.Se.feature_flag_cache_ttl_ms)) && void 0 !== t2 && t2;
  }
  ls() {
    return !!this.os() && (this.ns || this.Kn || (this.ns = true, Ja.warn("Feature flag cache is stale, triggering refresh..."), this.reloadFeatureFlags()), true);
  }
  us() {
    var t2, e2 = null !== (t2 = this.Se.evaluation_contexts) && void 0 !== t2 ? t2 : this.Se.evaluation_environments;
    return !this.Se.evaluation_environments || this.Se.evaluation_contexts || this.rs || (Ja.warn("evaluation_environments is deprecated. Use evaluation_contexts instead. evaluation_environments will be removed in a future version."), this.rs = true), null != e2 && e2.length ? e2.filter(((t3) => {
      var e3 = t3 && "string" == typeof t3 && t3.trim().length > 0;
      return e3 || Ja.error("Invalid evaluation context found:", t3, "Expected non-empty string"), e3;
    })) : [];
  }
  hs() {
    return this.us().length > 0;
  }
  ds() {
    var t2 = this.Se.flag_keys;
    if (!q(t2)) {
      if (j(t2)) return t2.filter(((t3) => {
        var e2 = t3 && "string" == typeof t3 && t3.trim().length > 0;
        return e2 || Ja.error("Invalid flag key found:", t3, "Expected non-empty string"), e2;
      }));
      Ja.error("Invalid flag_keys found:", t2, "Expected array of non-empty strings");
    }
  }
  initialize() {
    var t2, e2, { config: i2 } = this._instance, r2 = null !== (t2 = null == (e2 = i2.bootstrap) ? void 0 : e2.featureFlags) && void 0 !== t2 ? t2 : {};
    if (Object.keys(r2).length) {
      var s2, n2, o2 = null !== (s2 = null == (n2 = i2.bootstrap) ? void 0 : n2.featureFlagPayloads) && void 0 !== s2 ? s2 : {}, a2 = Object.keys(r2).filter(((t3) => !!r2[t3])).reduce(((t3, e3) => (t3[e3] = r2[e3] || false, t3)), {}), l2 = Object.keys(o2).filter(((t3) => a2[t3])).reduce(((t3, e3) => (o2[e3] && (t3[e3] = o2[e3]), t3)), {});
      this.receivedFeatureFlags({ featureFlags: a2, featureFlagPayloads: l2 });
    }
  }
  updateFlags(t2, e2, i2) {
    var r2, s2, n2 = null != i2 && i2.merge && null !== (r2 = this.ss(Ai)) && void 0 !== r2 ? r2 : {}, o2 = null != i2 && i2.merge && null !== (s2 = this.ss(Li)) && void 0 !== s2 ? s2 : {}, a2 = f({}, n2, t2), l2 = f({}, o2, e2), u2 = {};
    for (var [h2, d2] of Object.entries(a2)) u2[h2] = { key: h2, enabled: m(d2), variant: y(d2), reason: void 0, metadata: q(null == l2 ? void 0 : l2[h2]) ? void 0 : { id: 0, version: void 0, description: void 0, payload: l2[h2] } };
    this.receivedFeatureFlags({ flags: u2 });
  }
  get hasLoadedFlags() {
    return this.Yn;
  }
  getFlags() {
    return Object.keys(this.getFlagVariants());
  }
  getFlagsWithDetails() {
    var t2 = this.ss(Di), e2 = this.ss(Ui), i2 = this.ss(ji);
    if (!i2 && !e2) return t2 || {};
    var r2 = xr({}, t2 || {}), s2 = [.../* @__PURE__ */ new Set([...Object.keys(i2 || {}), ...Object.keys(e2 || {})])];
    for (var n2 of s2) {
      var o2, a2, l2 = r2[n2], u2 = null == e2 ? void 0 : e2[n2], h2 = q(u2) ? null !== (o2 = null == l2 ? void 0 : l2.enabled) && void 0 !== o2 && o2 : !!u2, d2 = q(u2) ? l2.variant : "string" == typeof u2 ? u2 : void 0, v2 = null == i2 ? void 0 : i2[n2], c2 = f({}, l2, { enabled: h2, variant: h2 ? null != d2 ? d2 : null == l2 ? void 0 : l2.variant : void 0 });
      h2 !== (null == l2 ? void 0 : l2.enabled) && (c2.original_enabled = null == l2 ? void 0 : l2.enabled), d2 !== (null == l2 ? void 0 : l2.variant) && (c2.original_variant = null == l2 ? void 0 : l2.variant), v2 && (c2.metadata = f({}, null == l2 ? void 0 : l2.metadata, { payload: v2, original_payload: null == l2 || null == (a2 = l2.metadata) ? void 0 : a2.payload })), r2[n2] = c2;
    }
    return this.Jn || (Ja.warn(" Overriding feature flag details!", { flagDetails: t2, overriddenPayloads: i2, finalDetails: r2 }), this.Jn = true), r2;
  }
  getAllFeatureFlags() {
    var t2 = this.getFlagVariants(), e2 = this.getFlagPayloads();
    return Object.keys(t2).map(((i2) => {
      var r2 = t2[i2];
      return { key: i2, enabled: m(r2), variant: y(r2), payload: g(e2[i2]) };
    }));
  }
  getFlagVariants() {
    var t2 = this.ss(Ai), e2 = this.ss(Ui);
    if (!e2) return t2 || {};
    for (var i2 = xr({}, t2), r2 = Object.keys(e2), s2 = 0; r2.length > s2; s2++) i2[r2[s2]] = e2[r2[s2]];
    return this.Jn || (Ja.warn(" Overriding feature flags!", { enabledFlags: t2, overriddenFlags: e2, finalFlags: i2 }), this.Jn = true), i2;
  }
  getFlagPayloads() {
    var t2 = this.ss(Li), e2 = this.ss(ji);
    if (!e2) return t2 || {};
    for (var i2 = xr({}, t2 || {}), r2 = Object.keys(e2), s2 = 0; r2.length > s2; s2++) i2[r2[s2]] = e2[r2[s2]];
    return this.Jn || (Ja.warn(" Overriding feature flag payloads!", { flagPayloads: t2, overriddenPayloads: e2, finalPayloads: i2 }), this.Jn = true), i2;
  }
  reloadFeatureFlags() {
    this.Xn || this.Se.advanced_disable_feature_flags || this.cs || (this._instance.Ti.emit("featureFlagsReloading", true), this.cs = setTimeout((() => {
      this.vs();
    }), 5));
  }
  fs() {
    clearTimeout(this.cs), this.cs = void 0;
  }
  ensureFlagsLoaded() {
    this.Yn || this.Kn || this.cs || this.reloadFeatureFlags();
  }
  setAnonymousDistinctId(t2) {
    this.$anon_distinct_id = t2;
  }
  setReloadingPaused(t2) {
    this.Xn = t2;
  }
  vs(t2) {
    var e2;
    if (this.fs(), !this._instance.mr()) if (this.Kn) this.es = true;
    else {
      var i2 = this.Se.token, r2 = this.ss(vi), s2 = { token: i2, distinct_id: this._instance.get_distinct_id(), groups: this._instance.getGroups(), $anon_distinct_id: this.$anon_distinct_id, person_properties: f({}, (null == (e2 = this.zr) ? void 0 : e2.get_initial_props()) || {}, this.ss(Bi) || {}), group_properties: this.ss(zi), timezone: vn() };
      W(r2) || q(r2) || (s2.$device_id = r2), (null != t2 && t2.disableFlags || this.Se.advanced_disable_feature_flags) && (s2.disable_flags = true), this.hs() && (s2.evaluation_contexts = this.us());
      var n2 = this.ds();
      q(n2) || (s2.flag_keys = n2);
      var o2 = !!this.Se.advanced_only_evaluate_survey_feature_flags, a2 = this._instance.requestRouter.endpointFor("flags", "/flags/?v=2" + (this.Se.advanced_only_evaluate_survey_feature_flags ? "&only_evaluate_survey_feature_flags=true" : ""));
      this.Kn = true, this._instance._send_request({ method: "POST", url: a2, data: s2, compression: this.Se.disable_compression ? void 0 : Ln.Base64, timeout: this.Se.feature_flag_request_timeout_ms, callback: (t3) => {
        var e3, i3, r3, n3 = true;
        if (200 === t3.statusCode && (this.es || (this.$anon_distinct_id = void 0), n3 = false), this.Kn = false, !s2.disable_flags || this.es) {
          this.ts = !n3;
          var a3 = [];
          t3.error ? t3.error instanceof Error ? a3.push("AbortError" === t3.error.name ? "timeout" : "connection_error") : a3.push("unknown_error") : 200 !== t3.statusCode && a3.push("api_error_" + t3.statusCode), null != (e3 = t3.json) && e3.errorsWhileComputingFlags && a3.push("errors_while_computing_flags");
          var l2, u2 = !(null == (i3 = t3.json) || null == (i3 = i3.quotaLimited) || !i3.includes("feature_flags"));
          if (u2 && a3.push("quota_limited"), null == (r3 = this.zr) || r3.register({ [Ki]: a3 }), u2) Ja.warn("You have hit your feature flags quota limit, and will not be able to load feature flags until the quota is reset.  Please visit https://posthog.com/docs/billing/limits-alerts to learn more.");
          else s2.disable_flags || this.receivedFeatureFlags(null !== (l2 = t3.json) && void 0 !== l2 ? l2 : {}, n3, { partialResponse: o2 }), this.es && (this.es = false, this.vs());
        }
      } });
    }
  }
  getFeatureFlag(t2, e2) {
    var i2;
    if (void 0 === e2 && (e2 = {}), !e2.fresh || this.ts) if (this.Yn || this.getFlags() && this.getFlags().length > 0) {
      if (!this.ls()) {
        var r2 = this.getFeatureFlagResult(t2, e2);
        return null !== (i2 = null == r2 ? void 0 : r2.variant) && void 0 !== i2 ? i2 : null == r2 ? void 0 : r2.enabled;
      }
    } else Ja.warn('getFeatureFlag for key "' + t2 + Xa);
  }
  getFeatureFlagDetails(t2) {
    return this.getFlagsWithDetails()[t2];
  }
  getFeatureFlagPayload(t2) {
    var e2 = this.getFeatureFlagResult(t2, { send_event: false });
    return null == e2 ? void 0 : e2.payload;
  }
  getFeatureFlagResult(t2, e2) {
    if (void 0 === e2 && (e2 = {}), !e2.fresh || this.ts) if (this.Yn || this.getFlags() && this.getFlags().length > 0) {
      if (!this.ls()) {
        var i2 = this.getFlagVariants(), r2 = t2 in i2, s2 = i2[t2], n2 = this.getFlagPayloads()[t2], o2 = String(s2), a2 = this.ss(Ni) || void 0, l2 = this.ss(Ji) || void 0, u2 = this.ss(Wi) || {};
        if (this.Se.advanced_feature_flags_dedup_per_session) {
          var h2, d2 = this._instance.get_session_id(), v2 = this.ss(Yi);
          d2 && d2 !== v2 && (u2 = {}, null == (h2 = this.zr) || h2.register({ [Wi]: u2, [Yi]: d2 }));
        }
        if ((e2.send_event || !("send_event" in e2)) && (!(t2 in u2) || !u2[t2].includes(o2))) {
          var c2, p2, f2, _2, m2, y2, b2, w2, E2, x2;
          j(u2[t2]) ? u2[t2].push(o2) : u2[t2] = [o2], null == (c2 = this.zr) || c2.register({ [Wi]: u2 });
          var S2 = this.getFeatureFlagDetails(t2), T2 = [...null !== (p2 = this.ss(Ki)) && void 0 !== p2 ? p2 : []];
          q(s2) && T2.push("flag_missing");
          var k2 = { $feature_flag: t2, $feature_flag_response: s2, $feature_flag_payload: n2 || null, $feature_flag_request_id: a2, $feature_flag_evaluated_at: l2, $feature_flag_bootstrapped_response: (null == (f2 = this.Se.bootstrap) || null == (f2 = f2.featureFlags) ? void 0 : f2[t2]) || null, $feature_flag_bootstrapped_payload: (null == (_2 = this.Se.bootstrap) || null == (_2 = _2.featureFlagPayloads) ? void 0 : _2[t2]) || null, $used_bootstrap_value: !this.ts };
          q(null == S2 || null == (m2 = S2.metadata) ? void 0 : m2.version) || (k2.$feature_flag_version = S2.metadata.version);
          var R2, P2 = null !== (y2 = null == S2 || null == (b2 = S2.reason) ? void 0 : b2.description) && void 0 !== y2 ? y2 : null == S2 || null == (w2 = S2.reason) ? void 0 : w2.code;
          P2 && (k2.$feature_flag_reason = P2), null != S2 && null != (E2 = S2.metadata) && E2.id && (k2.$feature_flag_id = S2.metadata.id), q(null == S2 ? void 0 : S2.original_variant) && q(null == S2 ? void 0 : S2.original_enabled) || (k2.$feature_flag_original_response = q(S2.original_variant) ? S2.original_enabled : S2.original_variant), null != S2 && null != (x2 = S2.metadata) && x2.original_payload && (k2.$feature_flag_original_payload = null == S2 || null == (R2 = S2.metadata) ? void 0 : R2.original_payload), T2.length && (k2.$feature_flag_error = T2.join(",")), this._instance.capture("$feature_flag_called", k2);
        }
        if (r2) return { key: t2, enabled: !!s2, variant: "string" == typeof s2 ? s2 : void 0, payload: g(n2) };
      }
    } else Ja.warn('getFeatureFlagResult for key "' + t2 + Xa);
  }
  getRemoteConfigPayload(t2, e2) {
    var i2 = this.Se.token, r2 = { distinct_id: this._instance.get_distinct_id(), token: i2 };
    this.hs() && (r2.evaluation_contexts = this.us());
    var s2 = this.ds();
    q(s2) || (r2.flag_keys = s2), this._instance._send_request({ method: "POST", url: this._instance.requestRouter.endpointFor("flags", "/flags/?v=2"), data: r2, compression: this.Se.disable_compression ? void 0 : Ln.Base64, timeout: this.Se.feature_flag_request_timeout_ms, callback(i3) {
      var r3, s3 = null == (r3 = i3.json) ? void 0 : r3.featureFlagPayloads;
      e2((null == s3 ? void 0 : s3[t2]) || void 0);
    } });
  }
  isFeatureEnabled(t2, e2) {
    if (void 0 === e2 && (e2 = {}), !e2.fresh || this.ts) {
      if (this.Yn || this.getFlags() && this.getFlags().length > 0) {
        var i2 = this.getFeatureFlag(t2, e2);
        return q(i2) ? void 0 : !!i2;
      }
      Ja.warn('isFeatureEnabled for key "' + t2 + Xa);
    }
  }
  addFeatureFlagsHandler(t2) {
    this.featureFlagEventHandlers.push(t2);
  }
  removeFeatureFlagsHandler(t2) {
    this.featureFlagEventHandlers = this.featureFlagEventHandlers.filter(((e2) => e2 !== t2));
  }
  receivedFeatureFlags(t2, e2, i2) {
    if (this.zr) {
      this.Yn = true;
      var r2 = this.getFlagVariants(), s2 = this.getFlagPayloads(), n2 = this.getFlagsWithDetails();
      !(function(t3, e3, i3, r3, s3, n3) {
        void 0 === i3 && (i3 = {}), void 0 === r3 && (r3 = {}), void 0 === s3 && (s3 = {});
        var o2 = ((t4) => {
          var e4 = t4.flags;
          return e4 ? (t4.featureFlags = Object.fromEntries(Object.keys(e4).map(((t5) => {
            var i4;
            return [t5, null !== (i4 = e4[t5].variant) && void 0 !== i4 ? i4 : e4[t5].enabled];
          }))), t4.featureFlagPayloads = Object.fromEntries(Object.keys(e4).filter(((t5) => e4[t5].enabled)).filter(((t5) => {
            var i4;
            return null == (i4 = e4[t5].metadata) ? void 0 : i4.payload;
          })).map(((t5) => {
            var i4;
            return [t5, null == (i4 = e4[t5].metadata) ? void 0 : i4.payload];
          })))) : t4.featureFlags && Ja.warn("Using an older version of the feature flags endpoint. Please upgrade your PostHog server to the latest version"), t4;
        })(t3), a2 = o2.flags, l2 = o2.featureFlags, u2 = o2.featureFlagPayloads;
        if (l2) {
          var h2 = t3.requestId, d2 = t3.evaluatedAt;
          if (j(l2)) {
            Ja.warn("v1 of the feature flags endpoint is deprecated. Please use the latest version.");
            var v2 = {};
            if (l2) for (var c2 = 0; l2.length > c2; c2++) v2[l2[c2]] = true;
            e3 && e3.register({ [Fi]: l2, [Ai]: v2 });
          } else {
            var p2 = l2, _2 = u2, g2 = a2;
            if (null != n3 && n3.partialResponse) p2 = f({}, i3, p2), _2 = f({}, r3, _2), g2 = f({}, s3, g2);
            else if (t3.errorsWhileComputingFlags) if (a2) {
              var m2 = new Set(Object.keys(a2).filter(((t4) => {
                var e4;
                return !(null != (e4 = a2[t4]) && e4.failed);
              })));
              p2 = f({}, i3, Object.fromEntries(Object.entries(p2).filter(((t4) => {
                var [e4] = t4;
                return m2.has(e4);
              })))), _2 = f({}, r3, Object.fromEntries(Object.entries(_2 || {}).filter(((t4) => {
                var [e4] = t4;
                return m2.has(e4);
              })))), g2 = f({}, s3, Object.fromEntries(Object.entries(g2 || {}).filter(((t4) => {
                var [e4] = t4;
                return m2.has(e4);
              }))));
            } else p2 = f({}, i3, p2), _2 = f({}, r3, _2), g2 = f({}, s3, g2);
            e3 && e3.register(f({ [Fi]: Object.keys(tl(p2)), [Ai]: p2 || {}, [Li]: _2 || {}, [Di]: g2 || {} }, h2 ? { [Ni]: h2 } : {}, d2 ? { [Ji]: d2 } : {}));
          }
        }
      })(t2, this.zr, r2, s2, n2, i2), e2 || (this.ns = false), this.ps(e2);
    }
  }
  override(t2, e2) {
    void 0 === e2 && (e2 = false), Ja.warn("override is deprecated. Please use overrideFeatureFlags instead."), this.overrideFeatureFlags({ flags: t2, suppressWarning: e2 });
  }
  overrideFeatureFlags(t2) {
    if (!this._instance.__loaded || !this.zr) return Ja.uninitializedWarning("posthog.featureFlags.overrideFeatureFlags");
    if (false === t2) return this.zr.unregister(Ui), this.zr.unregister(ji), this.ps(), Qa.info("All overrides cleared");
    if (j(t2)) {
      var e2 = Za(t2);
      return this.zr.register({ [Ui]: e2 }), this.ps(), Qa.info("Flag overrides set", { flags: t2 });
    }
    if (t2 && "object" == typeof t2 && ("flags" in t2 || "payloads" in t2)) {
      var i2, r2 = t2;
      if (this.Jn = Boolean(null !== (i2 = r2.suppressWarning) && void 0 !== i2 && i2), "flags" in r2) {
        if (false === r2.flags) this.zr.unregister(Ui), Qa.info("Flag overrides cleared");
        else if (r2.flags) {
          if (j(r2.flags)) {
            var s2 = Za(r2.flags);
            this.zr.register({ [Ui]: s2 });
          } else this.zr.register({ [Ui]: r2.flags });
          Qa.info("Flag overrides set", { flags: r2.flags });
        }
      }
      return "payloads" in r2 && (false === r2.payloads ? (this.zr.unregister(ji), Qa.info("Payload overrides cleared")) : r2.payloads && (this.zr.register({ [ji]: r2.payloads }), Qa.info("Payload overrides set", { payloads: r2.payloads }))), void this.ps();
    }
    if (t2 && "object" == typeof t2) return this.zr.register({ [Ui]: t2 }), this.ps(), Qa.info("Flag overrides set", { flags: t2 });
    Ja.warn("Invalid overrideOptions provided to overrideFeatureFlags", { overrideOptions: t2 });
  }
  onFeatureFlags(t2) {
    if (this.addFeatureFlagsHandler(t2), this.Yn) {
      var { flags: e2, flagVariants: i2 } = this.gs();
      t2(e2, i2);
    }
    return () => this.removeFeatureFlagsHandler(t2);
  }
  updateEarlyAccessFeatureEnrollment(t2, e2, i2) {
    var r2, s2 = (this.ss(Mi) || []).find(((e3) => e3.flagKey === t2)), n2 = { ["$feature_enrollment/" + t2]: e2 }, o2 = { $feature_flag: t2, $feature_enrollment: e2, $set: n2 };
    s2 && (o2.$early_access_feature_name = s2.name), i2 && (o2.$feature_enrollment_stage = i2), this._instance.capture("$feature_enrollment_update", o2), this.setPersonPropertiesForFlags(n2, false);
    var a2 = f({}, this.getFlagVariants(), { [t2]: e2 });
    null == (r2 = this.zr) || r2.register({ [Fi]: Object.keys(tl(a2)), [Ai]: a2 }), this.ps();
  }
  getEarlyAccessFeatures(t2, e2, i2) {
    void 0 === e2 && (e2 = false);
    var r2 = this.ss(Mi), s2 = i2 ? "&" + i2.map(((t3) => "stage=" + t3)).join("&") : "";
    if (r2 && !e2) return t2(r2);
    this._instance._send_request({ url: this._instance.requestRouter.endpointFor("api", "/api/early_access_features/?token=" + this.Se.token + s2), method: "GET", callback: (e3) => {
      var i3, r3;
      if (e3.json) {
        var s3 = e3.json.earlyAccessFeatures;
        return null == (i3 = this.zr) || i3.unregister(Mi), null == (r3 = this.zr) || r3.register({ [Mi]: s3 }), t2(s3);
      }
    } });
  }
  gs() {
    var t2 = this.getFlags(), e2 = this.getFlagVariants();
    return { flags: t2.filter(((t3) => e2[t3])), flagVariants: Object.keys(e2).filter(((t3) => e2[t3])).reduce(((t3, i2) => (t3[i2] = e2[i2], t3)), {}) };
  }
  ps(t2) {
    var { flags: e2, flagVariants: i2 } = this.gs();
    this.featureFlagEventHandlers.forEach(((r2) => r2(e2, i2, { errorsLoading: t2 })));
  }
  setPersonPropertiesForFlags(t2, e2) {
    void 0 === e2 && (e2 = true);
    var i2 = this.ss(Bi) || {}, r2 = (null == t2 ? void 0 : t2.$set) || (null != t2 && t2.$set_once ? {} : t2), s2 = null == t2 ? void 0 : t2.$set_once, n2 = {};
    if (s2) for (var o2 in s2) ({}).hasOwnProperty.call(s2, o2) && (o2 in i2 || (n2[o2] = s2[o2]));
    this._instance.register({ [Bi]: f({}, i2, n2, r2) }), e2 && this._instance.reloadFeatureFlags();
  }
  unsetPersonPropertiesForFlags(t2, e2) {
    void 0 === e2 && (e2 = true);
    var i2 = f({}, this.ss(Bi) || {});
    t2.forEach(((t3) => {
      delete i2[t3];
    })), this._instance.register({ [Bi]: i2 }), e2 && this._instance.reloadFeatureFlags();
  }
  resetPersonPropertiesForFlags(t2) {
    void 0 === t2 && (t2 = true), this._instance.unregister(Bi), t2 && this._instance.reloadFeatureFlags();
  }
  setGroupPropertiesForFlags(t2, e2) {
    void 0 === e2 && (e2 = true);
    var i2 = this.ss(zi) || {};
    0 !== Object.keys(i2).length && Object.keys(i2).forEach(((e3) => {
      i2[e3] = f({}, i2[e3], t2[e3]), delete t2[e3];
    })), this._instance.register({ [zi]: f({}, i2, t2) }), e2 && this._instance.reloadFeatureFlags();
  }
  resetGroupPropertiesForFlags(t2) {
    if (t2) {
      var e2 = this.ss(zi) || {};
      this._instance.register({ [zi]: f({}, e2, { [t2]: {} }) });
    } else this._instance.unregister(zi);
  }
  reset() {
    this.Yn = false, this.Kn = false, this.Xn = false, this.es = false, this.ts = false, this.$anon_distinct_id = void 0, this.fs(), this.Jn = false;
  }
} }, ul = { sessionRecording: class {
  get Se() {
    return this._instance.config;
  }
  get zr() {
    return this._instance.persistence;
  }
  get started() {
    var t2;
    return !(null == (t2 = this.ys) || !t2.isStarted);
  }
  get status() {
    var t2, e2;
    return this.bs === Ia || this.bs === Oa ? this.bs : null !== (t2 = null == (e2 = this.ys) ? void 0 : e2.status) && void 0 !== t2 ? t2 : this.bs;
  }
  constructor(t2) {
    if (this._forceAllowLocalhostNetworkCapture = false, this.bs = Ra, this._s = void 0, this._instance = t2, !this._instance.sessionManager) throw Aa.error("started without valid sessionManager"), new Error(Ca + " started without valid sessionManager. This is a bug.");
    if (this.Se.cookieless_mode === dr) throw new Error(Ca + ' cannot be used with cookieless_mode="always"');
  }
  initialize() {
    this.startIfEnabledOrStop();
  }
  get ws() {
    var e2, i2 = !(null == (e2 = this._instance.get_property(Ti)) || !e2.enabled), r2 = !this.Se.disable_session_recording, s2 = this.Se.disable_session_recording || this._instance.consent.isOptedOut();
    return t && i2 && r2 && !s2;
  }
  startIfEnabledOrStop(t2) {
    var e2;
    if (!this.ws || null == (e2 = this.ys) || !e2.isStarted) {
      var i2 = !q(Object.assign) && !q(Array.from);
      this.ws && i2 ? (this.xs(t2), Aa.info("starting")) : (this.bs = Ra, this.stopRecording());
    }
  }
  xs(t2) {
    var e2, i2, r2;
    this.ws && (this.bs !== Ia && this.bs !== Oa && (this.bs = Pa), null != h && null != (e2 = h.__PosthogExtensions__) && null != (e2 = e2.rrweb) && e2.record && null != (i2 = h.__PosthogExtensions__) && i2.initSessionRecording ? this.ks(t2) : null == (r2 = h.__PosthogExtensions__) || null == r2.loadExternalDependency || r2.loadExternalDependency(this._instance, this.Ss, ((e3) => {
      if (e3) return Aa.error("could not load recorder", e3);
      this.ks(t2);
    })));
  }
  stopRecording() {
    var t2, e2;
    null == (t2 = this._s) || t2.call(this), this._s = void 0, null == (e2 = this.ys) || e2.stop();
  }
  Cs() {
    var t2, e2;
    null == (t2 = this._s) || t2.call(this), this._s = void 0, null == (e2 = this.ys) || e2.discard();
  }
  Is() {
    var t2, e2;
    null == (t2 = this.zr) || t2.unregister(Ci), null == (e2 = this.zr) || e2.unregister($i);
  }
  Ts(t2, e2) {
    if (Y(t2)) return null;
    var i2, r2 = K(t2) ? t2 : parseFloat(t2);
    return "number" != typeof (i2 = r2) || !Number.isFinite(i2) || 0 > i2 || i2 > 1 ? (Aa.warn(e2 + " must be between 0 and 1. Ignoring invalid value:", t2), null) : r2;
  }
  Es(t2) {
    if (this.zr) {
      var e2, i2, r2 = this.zr, s2 = () => {
        var e3, i3 = false === t2.sessionRecording ? void 0 : t2.sessionRecording, s3 = this.Ts(null == (e3 = this.Se.session_recording) ? void 0 : e3.sampleRate, "session_recording.sampleRate"), n2 = this.Ts(null == i3 ? void 0 : i3.sampleRate, "remote config sampleRate"), o2 = null != s3 ? s3 : n2;
        Y(o2) && this.Is();
        var a2 = null == i3 ? void 0 : i3.minimumDurationMilliseconds;
        r2.register({ [Ti]: f({ cache_timestamp: Date.now(), enabled: !!i3 }, i3, { networkPayloadCapture: f({ capturePerformance: t2.capturePerformance }, null == i3 ? void 0 : i3.networkPayloadCapture), canvasRecording: { enabled: null == i3 ? void 0 : i3.recordCanvas, fps: null == i3 ? void 0 : i3.canvasFps, quality: null == i3 ? void 0 : i3.canvasQuality }, sampleRate: o2, minimumDurationMilliseconds: q(a2) ? null : a2, endpoint: null == i3 ? void 0 : i3.endpoint, triggerMatchType: null == i3 ? void 0 : i3.triggerMatchType, masking: null == i3 ? void 0 : i3.masking, urlTriggers: null == i3 ? void 0 : i3.urlTriggers, version: null == i3 ? void 0 : i3.version, triggerGroups: null == i3 ? void 0 : i3.triggerGroups }) });
      };
      s2(), null == (e2 = this._s) || e2.call(this), this._s = null == (i2 = this._instance.sessionManager) ? void 0 : i2.onSessionId(s2);
    }
  }
  onRemoteConfig(t2) {
    return "sessionRecording" in t2 ? false === t2.sessionRecording ? (this.Es(t2), void this.Cs()) : (this.Es(t2), void this.startIfEnabledOrStop()) : (this.bs === Ia && (this.bs = Oa, Aa.warn("config refresh failed, recording will not start until page reload")), void this.startIfEnabledOrStop());
  }
  log(t2, e2) {
    var i2;
    void 0 === e2 && (e2 = "log"), null != (i2 = this.ys) && i2.log ? this.ys.log(t2, e2) : Aa.warn("log called before recorder was ready");
  }
  get Ss() {
    var t2, e2, i2 = null == (t2 = this._instance) || null == (t2 = t2.persistence) ? void 0 : t2.get_property(Ti);
    return (null == i2 || null == (e2 = i2.scriptConfig) ? void 0 : e2.script) || "lazy-recorder";
  }
  Ms() {
    var t2, e2, i2 = this._instance.get_property(Ti);
    if (!i2) return false;
    try {
      e2 = "object" == typeof i2 ? i2 : JSON.parse(i2);
    } catch (t3) {
      return Aa.warn("persisted remote config for session recording is invalid and will be ignored", t3), false;
    }
    var r2 = null !== (t2 = e2.cache_timestamp) && void 0 !== t2 ? t2 : Date.now();
    return 36e5 >= Date.now() - r2;
  }
  ks(t2) {
    var e2, i2;
    if (null == (e2 = h.__PosthogExtensions__) || !e2.initSessionRecording) return Aa.warn("Called on script loaded before session recording is available. This can be caused by adblockers."), void this._instance.register_for_session({ [lr]: true });
    if (this.ys || (this.ys = null == (i2 = h.__PosthogExtensions__) ? void 0 : i2.initSessionRecording(this._instance), this.ys._forceAllowLocalhostNetworkCapture = this._forceAllowLocalhostNetworkCapture), !this.Ms()) {
      if (this.bs === Oa || this.bs === Ia) return;
      return this.bs = Ia, Aa.info("persisted remote config is stale, requesting fresh config before starting"), void new Mn(this._instance).load();
    }
    this.bs = Pa, this.ys.start(t2);
  }
  onRRwebEmit(t2) {
    var e2;
    null == (e2 = this.ys) || null == e2.onRRwebEmit || e2.onRRwebEmit(t2);
  }
  overrideLinkedFlag() {
    var t2, e2;
    this.ys || null == (e2 = this.zr) || e2.register({ [Ri]: true }), null == (t2 = this.ys) || t2.overrideLinkedFlag();
  }
  overrideSampling() {
    var t2, e2;
    this.ys || null == (e2 = this.zr) || e2.register({ [ki]: true }), null == (t2 = this.ys) || t2.overrideSampling();
  }
  overrideTrigger(t2) {
    var e2, i2;
    this.ys || null == (i2 = this.zr) || i2.register({ ["url" === t2 ? Pi : Ii]: true }), null == (e2 = this.ys) || e2.overrideTrigger(t2);
  }
  get sdkDebugProperties() {
    var t2;
    return (null == (t2 = this.ys) ? void 0 : t2.sdkDebugProperties) || { $recording_status: this.status };
  }
  tryAddCustomEvent(t2, e2) {
    var i2;
    return !(null == (i2 = this.ys) || !i2.tryAddCustomEvent(t2, e2));
  }
} }, hl = { autocapture: class {
  constructor(t2) {
    this.Ps = false, this.Rs = null, this.Os = false, this.instance = t2, this.rageclicks = new ma(t2.config.rageclick), this.Ls = null;
  }
  initialize() {
    this.startIfEnabled();
  }
  get Se() {
    var t2, e2, i2 = z(this.instance.config.autocapture) ? this.instance.config.autocapture : {};
    return i2.url_allowlist = null == (t2 = i2.url_allowlist) ? void 0 : t2.map(((t3) => new RegExp(t3))), i2.url_ignorelist = null == (e2 = i2.url_ignorelist) ? void 0 : e2.map(((t3) => new RegExp(t3))), i2;
  }
  Fs() {
    if (this.isBrowserSupported()) {
      if (t && r) {
        var e2 = (e3) => {
          e3 = e3 || (null == t ? void 0 : t.event);
          try {
            this.As(e3);
          } catch (t2) {
            ba.error("Failed to capture event", t2);
          }
        };
        if (Ir(r, "submit", e2, { capture: true }), Ir(r, "change", e2, { capture: true }), Ir(r, "click", e2, { capture: true }), this.Se.capture_copied_text) {
          var i2 = (e3) => {
            e3 = e3 || (null == t ? void 0 : t.event);
            try {
              this.As(e3, ya);
            } catch (t2) {
              ba.error("Failed to capture copy/cut event", t2);
            }
          };
          Ir(r, "copy", i2, { capture: true }), Ir(r, "cut", i2, { capture: true });
        }
      }
    } else ba.info("Disabling Automatic Event Collection because this browser is not supported");
  }
  startIfEnabled() {
    this.isEnabled && !this.Ps && (this.Fs(), this.Ps = true);
  }
  onRemoteConfig(t2) {
    t2.elementsChainAsString && (this.Os = t2.elementsChainAsString), this.instance.persistence && this.instance.persistence.register({ [_i]: !!t2.autocapture_opt_out }), this.Rs = !!t2.autocapture_opt_out, this.startIfEnabled();
  }
  setElementSelectors(t2) {
    this.Ls = t2;
  }
  getElementSelectors(t2) {
    var e2, i2 = [];
    return null == (e2 = this.Ls) || e2.forEach(((e3) => {
      var s2 = null == r ? void 0 : r.querySelectorAll(e3);
      null == s2 || s2.forEach(((r2) => {
        t2 === r2 && i2.push(e3);
      }));
    })), i2;
  }
  get isEnabled() {
    var t2, e2, i2 = null == (t2 = this.instance.persistence) ? void 0 : t2.props[_i];
    if (W(this.Rs) && !Q(i2) && !this.instance.mr()) return false;
    var r2 = null !== (e2 = this.Rs) && void 0 !== e2 ? e2 : !!i2;
    return !!this.instance.config.autocapture && !r2;
  }
  As(e2, i2) {
    if (void 0 === i2 && (i2 = "$autocapture"), this.isEnabled) {
      var r2, s2 = us(e2);
      is(s2) && (s2 = s2.parentNode || null), "$autocapture" === i2 && "click" === e2.type && e2 instanceof MouseEvent && this.instance.config.rageclick && null != (r2 = this.rageclicks) && r2.isRageClick(e2.clientX, e2.clientY, e2.timeStamp || (/* @__PURE__ */ new Date()).getTime()) && ys(s2, this.instance.config.rageclick) && this.As(e2, "$rageclick");
      var n2 = i2 === ya;
      if (s2 && (function(e3, i3, r3, s3, n3) {
        var o3, a3, l3, u3, h3, d3;
        if (void 0 === r3 && (r3 = void 0), !t || bs(e3)) return false;
        if (null != (o3 = r3) && o3.url_allowlist && !ns(r3.url_allowlist)) return false;
        if (null != (a3 = r3) && a3.url_ignorelist && ns(r3.url_ignorelist)) return false;
        if (null != (l3 = r3) && l3.dom_event_allowlist) {
          var v2 = r3.dom_event_allowlist;
          if (v2 && !v2.some(((t2) => i3.type === t2))) return false;
        }
        var { parentIsUsefulElement: c2, targetElementList: p2 } = ws(e3, s3);
        if (!(function(t2, e4) {
          var i4 = null == e4 ? void 0 : e4.element_allowlist;
          if (q(i4)) return true;
          var r4, s4 = function(t3) {
            if (i4.some(((e5) => t3.tagName.toLowerCase() === e5))) return { v: true };
          };
          for (var n4 of t2) if (r4 = s4(n4)) return r4.v;
          return false;
        })(p2, r3)) return false;
        if (!ds(p2, null == (u3 = r3) ? void 0 : u3.css_selector_allowlist)) return false;
        if (ds(p2, null !== (h3 = null == (d3 = r3) ? void 0 : d3.css_selector_ignorelist) && void 0 !== h3 ? h3 : cs)) return false;
        var f2 = t.getComputedStyle(e3);
        if (f2 && "pointer" === f2.getPropertyValue("cursor") && "click" === i3.type) return true;
        var _2 = e3.tagName.toLowerCase();
        switch (_2) {
          case "html":
            return false;
          case "form":
            return (n3 || ["submit"]).indexOf(i3.type) >= 0;
          case "input":
          case "select":
          case "textarea":
            return (n3 || ["change", "click"]).indexOf(i3.type) >= 0;
          default:
            return c2 ? (n3 || ["click"]).indexOf(i3.type) >= 0 : (n3 || ["click"]).indexOf(i3.type) >= 0 && (hs.indexOf(_2) > -1 || "true" === e3.getAttribute("contenteditable"));
        }
      })(s2, e2, this.Se, n2, n2 ? ["copy", "cut"] : void 0)) {
        var { props: o2, explicitNoCapture: a2 } = xa(s2, { e: e2, maskAllElementAttributes: this.instance.config.mask_all_element_attributes, maskAllText: this.instance.config.mask_all_text, elementAttributeIgnoreList: this.Se.element_attribute_ignorelist, elementsChainAsString: this.Os, disableCaptureUrlHashes: this.instance.config.disable_capture_url_hashes });
        if (a2) return false;
        var l2 = this.getElementSelectors(s2);
        if (l2 && l2.length > 0 && (o2.$element_selectors = l2), i2 === ya) {
          var u2, h2 = as(null == t || null == (u2 = t.getSelection()) ? void 0 : u2.toString()), d2 = e2.type || "clipboard";
          if (!h2) return false;
          o2.$selected_content = h2, o2.$copy_type = d2;
        }
        return this.instance.capture(i2, o2), true;
      }
    }
  }
  isBrowserSupported() {
    return B(null == r ? void 0 : r.querySelectorAll);
  }
}, historyAutocapture: class {
  constructor(e2) {
    var i2;
    this._instance = e2, this.$s = (null == t || null == (i2 = t.location) ? void 0 : i2.pathname) || "";
  }
  initialize() {
    this.startIfEnabled();
  }
  get isEnabled() {
    return "history_change" === this._instance.config.capture_pageview;
  }
  startIfEnabled() {
    this.isEnabled && (ai.info("History API monitoring enabled, starting..."), this.monitorHistoryChanges());
  }
  stop() {
    this.Ds && this.Ds(), this.Ds = void 0, ai.info("History API monitoring stopped");
  }
  monitorHistoryChanges() {
    t && t.history && (this.Ns("pushState"), this.Ns("replaceState"), this.qs());
  }
  Ns(e2) {
    var i2;
    if (t && (null == (i2 = t.history[e2]) || !i2.__posthog_wrapped__)) {
      var r2 = this;
      !(function(t2, e3, i3) {
        try {
          if (!(e3 in t2)) return () => {
          };
          var r3 = t2[e3], s2 = i3(r3);
          return B(s2) && (s2.prototype = s2.prototype || {}, Object.defineProperties(s2, { __posthog_wrapped__: { enumerable: false, value: true } })), t2[e3] = s2, () => {
            t2[e3] === s2 && (t2[e3] = r3);
          };
        } catch (t3) {
          return () => {
          };
        }
      })(t.history, e2, ((t2) => function(i3, s2, n2) {
        t2.call(this, i3, s2, n2), r2.js(e2);
      }));
    }
  }
  js(e2) {
    try {
      var i2, r2 = null == t || null == (i2 = t.location) ? void 0 : i2.pathname;
      if (!r2) return;
      r2 !== this.$s && this.isEnabled && this._instance.capture(gr, { navigation_type: e2 }), this.$s = r2;
    } catch (t2) {
      ai.error("Error capturing " + e2 + " pageview", t2);
    }
  }
  qs() {
    if (!this.Ds) {
      var e2 = () => {
        this.js("popstate");
      };
      Ir(t, "popstate", e2), this.Ds = () => {
        t && t.removeEventListener("popstate", e2);
      };
    }
  }
}, heatmaps: class {
  get Se() {
    return this.instance.config;
  }
  constructor(t2) {
    var e2;
    this.Bs = false, this.Ps = false, this.Hs = null, this.instance = t2, this.Bs = !(null == (e2 = this.instance.persistence) || !e2.props[gi]), this.rageclicks = new ma(t2.config.rageclick);
  }
  initialize() {
    this.startIfEnabled();
  }
  get flushIntervalMilliseconds() {
    var t2 = 5e3;
    return z(this.Se.capture_heatmaps) && this.Se.capture_heatmaps.flush_interval_milliseconds && (t2 = this.Se.capture_heatmaps.flush_interval_milliseconds), t2;
  }
  get isEnabled() {
    return Y(this.Se.capture_heatmaps) ? Y(this.Se.enable_heatmaps) ? this.Bs : this.Se.enable_heatmaps : false !== this.Se.capture_heatmaps;
  }
  startIfEnabled() {
    if (this.isEnabled) {
      if (this.Ps) return;
      Fa.info("starting..."), this.Us(), this.ke();
    } else {
      var t2;
      clearInterval(null !== (t2 = this.Hs) && void 0 !== t2 ? t2 : void 0), this.zs(), this.getAndClearBuffer();
    }
  }
  onRemoteConfig(t2) {
    if ("heatmaps" in t2) {
      var e2 = !!t2.heatmaps;
      this.instance.persistence && this.instance.persistence.register({ [gi]: e2 }), this.Bs = e2, this.startIfEnabled();
    }
  }
  getAndClearBuffer() {
    var t2 = this.R;
    return this.R = void 0, t2;
  }
  Vs(t2) {
    this.fe(t2.originalEvent, "deadclick");
  }
  ke() {
    this.Hs && clearInterval(this.Hs), this.Hs = "visible" === (null == r ? void 0 : r.visibilityState) ? setInterval(this.Lr.bind(this), this.flushIntervalMilliseconds) : null;
  }
  Us() {
    t && r && (this.Ws = this.Lr.bind(this), Ir(t, _r, this.Ws), this.Gs = (e2) => this.fe(e2 || (null == t ? void 0 : t.event)), Ir(r, "click", this.Gs, { capture: true }), this.Zs = (e2) => this.Qs(e2 || (null == t ? void 0 : t.event)), Ir(r, "mousemove", this.Zs, { capture: true }), this.Js = new Ns(this.instance, Ds, this.Vs.bind(this)), this.Js.startIfEnabledOrStop(), this.Ys = this.ke.bind(this), Ir(r, fr, this.Ys), this.Ps = true);
  }
  zs() {
    var e2;
    t && r && (this.Ws && t.removeEventListener(_r, this.Ws), this.Gs && r.removeEventListener("click", this.Gs, { capture: true }), this.Zs && r.removeEventListener("mousemove", this.Zs, { capture: true }), this.Ys && r.removeEventListener(fr, this.Ys), clearTimeout(this.Ks), null == (e2 = this.Js) || e2.stop(), this.Ps = false);
  }
  Xs(e2, i2) {
    var r2 = this.instance.scrollManager.scrollY(), s2 = this.instance.scrollManager.scrollX(), n2 = this.instance.scrollManager.scrollElement(), o2 = (function(e3, i3, r3) {
      for (var s3 = e3; s3 && ts(s3) && !es(s3, "body"); ) {
        if (s3 === r3) return false;
        if (F(i3, null == t ? void 0 : t.getComputedStyle(s3).position)) return true;
        s3 = vs(s3);
      }
      return false;
    })(us(e2), ["fixed", "sticky"], n2);
    return { x: e2.clientX + (o2 ? 0 : s2), y: e2.clientY + (o2 ? 0 : r2), target_fixed: o2, type: i2 };
  }
  fe(t2, e2) {
    var i2;
    if (void 0 === e2 && (e2 = "click"), !Zr(t2.target) && Ma(t2)) {
      var r2 = this.Xs(t2, e2);
      null != (i2 = this.rageclicks) && i2.isRageClick(t2.clientX, t2.clientY, (/* @__PURE__ */ new Date()).getTime()) && ys(us(t2), this.instance.config.rageclick) && this.eo(f({}, r2, { type: "rageclick" })), this.eo(r2);
    }
  }
  Qs(t2) {
    !Zr(t2.target) && Ma(t2) && (clearTimeout(this.Ks), this.Ks = setTimeout((() => {
      this.eo(this.Xs(t2, "mousemove"));
    }), 500));
  }
  eo(e2) {
    if (t) {
      var i2 = this.Se.disable_capture_url_hashes ? fe(t.location.href) : t.location.href, r2 = this.Se.custom_personal_data_properties, s2 = this.Se.mask_personal_data_properties ? [...Zs, ...r2 || []] : [], n2 = Js(i2, s2, en);
      this.R = this.R || {}, this.R[n2] || (this.R[n2] = []), this.R[n2].push(e2);
    }
  }
  Lr() {
    this.R && !H(this.R) && this.instance.capture("$$heatmap", { $heatmap_data: this.getAndClearBuffer() });
  }
}, deadClicksAutocapture: Ns, webVitalsAutocapture: class {
  constructor(t2) {
    var e2;
    this.Bs = false, this.Ps = false, this.R = { url: void 0, metrics: [], firstMetricTimestamp: void 0 }, this.ro = () => {
      clearTimeout(this.io), 0 !== this.R.metrics.length && (this._instance.capture("$web_vitals", this.R.metrics.reduce(((t3, e3) => f({}, t3, { ["$web_vitals_" + e3.name + "_event"]: f({}, e3), ["$web_vitals_" + e3.name + "_value"]: e3.value })), {})), this.R = { url: void 0, metrics: [], firstMetricTimestamp: void 0 });
    }, this.no = (t3) => {
      var e3;
      this.R = this.R || { url: void 0, metrics: [], firstMetricTimestamp: void 0 };
      var i2 = this.so();
      if (!q(i2)) if (Y(null == t3 ? void 0 : t3.name) || Y(null == t3 ? void 0 : t3.value)) $a.error("Invalid metric received", t3);
      else if (!this.oo || this.oo > t3.value) {
        this.R.url !== i2 && (this.ro(), this.io = setTimeout(this.ro, this.flushToCaptureTimeoutMs)), q(this.R.url) && (this.R.url = i2), this.R.firstMetricTimestamp = q(this.R.firstMetricTimestamp) ? Date.now() : this.R.firstMetricTimestamp, t3.attribution && t3.attribution.interactionTargetElement && (t3.attribution.interactionTargetElement = void 0);
        var r2 = null == (e3 = this._instance.sessionManager) ? void 0 : e3.checkAndGetSessionAndWindowId(true), s2 = f({}, t3, { $current_url: i2, timestamp: Date.now() });
        q(r2) || (s2.$session_id = r2.sessionId, s2.$window_id = r2.windowId), this.R.metrics.push(s2), this.R.metrics.length === this.allowedMetrics.length && this.ro();
      } else $a.error("Ignoring metric with value >= " + this.oo, t3);
    }, this.ao = () => {
      if (!this.Ps) {
        var t3, e3, i2, r2, s2 = h.__PosthogExtensions__;
        q(s2) || q(s2.postHogWebVitalsCallbacks) || ({ onLCP: t3, onCLS: e3, onFCP: i2, onINP: r2 } = s2.postHogWebVitalsCallbacks), t3 && e3 && i2 && r2 ? (this.allowedMetrics.indexOf("LCP") > -1 && t3(this.no.bind(this)), this.allowedMetrics.indexOf("CLS") > -1 && e3(this.no.bind(this)), this.allowedMetrics.indexOf("FCP") > -1 && i2(this.no.bind(this)), this.allowedMetrics.indexOf("INP") > -1 && r2(this.no.bind(this)), this.Ps = true) : $a.error("web vitals callbacks not loaded - not starting");
      }
    }, this._instance = t2, this.Bs = !(null == (e2 = this._instance.persistence) || !e2.props[wi]), this.startIfEnabled();
  }
  get lo() {
    return this._instance.config.capture_performance;
  }
  get allowedMetrics() {
    var t2, e2, i2 = z(this.lo) ? null == (t2 = this.lo) ? void 0 : t2.web_vitals_allowed_metrics : void 0;
    return Y(i2) ? (null == (e2 = this._instance.persistence) ? void 0 : e2.props[Si]) || ["CLS", "FCP", "INP", "LCP"] : i2;
  }
  get flushToCaptureTimeoutMs() {
    return (z(this.lo) ? this.lo.web_vitals_delayed_flush_ms : void 0) || 5e3;
  }
  get useAttribution() {
    var t2 = z(this.lo) ? this.lo.web_vitals_attribution : void 0;
    return null != t2 && t2;
  }
  get oo() {
    var t2 = z(this.lo) && K(this.lo.__web_vitals_max_value) ? this.lo.__web_vitals_max_value : ka;
    return t2 > 0 && 6e4 >= t2 ? ka : t2;
  }
  get isEnabled() {
    var t2 = null == s ? void 0 : s.protocol;
    if ("http:" !== t2 && "https:" !== t2) return $a.info("Web Vitals are disabled on non-http/https protocols"), false;
    var e2 = z(this.lo) ? this.lo.web_vitals : Q(this.lo) ? this.lo : void 0;
    return Q(e2) ? e2 : this.Bs;
  }
  startIfEnabled() {
    this.isEnabled && !this.Ps && ($a.info("enabled, starting..."), this.Mt(this.ao));
  }
  onRemoteConfig(t2) {
    if ("capturePerformance" in t2) {
      var e2 = z(t2.capturePerformance) && !!t2.capturePerformance.web_vitals, i2 = z(t2.capturePerformance) ? t2.capturePerformance.web_vitals_allowed_metrics : void 0;
      this._instance.persistence && (this._instance.persistence.register({ [wi]: e2 }), this._instance.persistence.register({ [Si]: i2 })), this.Bs = e2, this.startIfEnabled();
    }
  }
  Mt(t2) {
    var e2, i2;
    null != (e2 = h.__PosthogExtensions__) && e2.postHogWebVitalsCallbacks ? t2() : null == (i2 = h.__PosthogExtensions__) || null == i2.loadExternalDependency || i2.loadExternalDependency(this._instance, this.useAttribution ? "web-vitals-with-attribution" : "web-vitals", ((e3) => {
      e3 ? $a.error("failed to load script", e3) : t2();
    }));
  }
  so() {
    var e2 = t ? this._instance.config.disable_capture_url_hashes ? fe(t.location.href) : t.location.href : void 0;
    if (e2) {
      var i2 = this._instance.config.custom_personal_data_properties, r2 = this._instance.config.mask_personal_data_properties ? [...Zs, ...i2 || []] : [];
      return Js(e2, r2, en);
    }
    $a.error("Could not determine current URL");
  }
} }, dl = { exceptionObserver: class {
  constructor(e2) {
    var i2, r2, s2;
    this.ao = () => {
      var e3;
      if (t && this.isEnabled && null != (e3 = h.__PosthogExtensions__) && e3.errorWrappingFunctions) {
        var i3 = h.__PosthogExtensions__.errorWrappingFunctions.wrapOnError, r3 = h.__PosthogExtensions__.errorWrappingFunctions.wrapUnhandledRejection, s3 = h.__PosthogExtensions__.errorWrappingFunctions.wrapConsoleError;
        try {
          !this.uo && this.Se.capture_unhandled_errors && (this.uo = i3(this.captureException.bind(this))), !this.ho && this.Se.capture_unhandled_rejections && (this.ho = r3(this.captureException.bind(this))), !this.do && this.Se.capture_console_errors && (this.do = s3(this.captureException.bind(this)));
        } catch (t2) {
          Sa.error("failed to start", t2), this.co();
        }
      }
    }, this._instance = e2, this.vo = !(null == (i2 = this._instance.persistence) || !i2.props[mi]), this.fo = new lt({ refillRate: null !== (r2 = this._instance.config.error_tracking.__exceptionRateLimiterRefillRate) && void 0 !== r2 ? r2 : 1, bucketSize: null !== (s2 = this._instance.config.error_tracking.__exceptionRateLimiterBucketSize) && void 0 !== s2 ? s2 : 10, refillInterval: 1e4, Ae: Sa }), this.Se = this.po(), this.startIfEnabledOrStop();
  }
  po() {
    var t2 = this._instance.config.capture_exceptions, e2 = { capture_unhandled_errors: false, capture_unhandled_rejections: false, capture_console_errors: false };
    return z(t2) ? e2 = f({}, e2, t2) : (q(t2) ? this.vo : t2) && (e2 = f({}, e2, { capture_unhandled_errors: true, capture_unhandled_rejections: true })), e2;
  }
  get isEnabled() {
    return this.Se.capture_console_errors || this.Se.capture_unhandled_errors || this.Se.capture_unhandled_rejections;
  }
  startIfEnabledOrStop() {
    this.isEnabled ? (Sa.info("enabled"), this.co(), this.Mt(this.ao)) : this.co();
  }
  Mt(t2) {
    var e2, i2;
    null != (e2 = h.__PosthogExtensions__) && e2.errorWrappingFunctions ? t2() : null == (i2 = h.__PosthogExtensions__) || null == i2.loadExternalDependency || i2.loadExternalDependency(this._instance, "exception-autocapture", ((e3) => {
      if (e3) return Sa.error("failed to load script", e3);
      t2();
    }));
  }
  co() {
    var t2, e2, i2;
    null == (t2 = this.uo) || t2.call(this), this.uo = void 0, null == (e2 = this.ho) || e2.call(this), this.ho = void 0, null == (i2 = this.do) || i2.call(this), this.do = void 0;
  }
  onRemoteConfig(t2) {
    "autocaptureExceptions" in t2 && (this.vo = !!t2.autocaptureExceptions || false, this._instance.persistence && this._instance.persistence.register({ [mi]: this.vo }), this.Se = this.po(), this.startIfEnabledOrStop());
  }
  onConfigChange() {
    this.Se = this.po();
  }
  captureException(t2) {
    var e2, i2, r2, s2 = null !== (e2 = null == t2 || null == (i2 = t2.$exception_list) || null == (i2 = i2[0]) ? void 0 : i2.type) && void 0 !== e2 ? e2 : "Exception";
    this.fo.consumeRateLimit(s2) ? Sa.info("Skipping exception capture because of client rate limiting.", { exception: s2 }) : null == (r2 = this._instance.exceptions) || r2.sendExceptionEvent(t2);
  }
}, exceptions: class {
  constructor(t2) {
    var e2, i2;
    this.mo = [], this.yo = new Ie([new ze(), new Xe(), new qe(), new He(), new Je(), new Ke(), new Ge(), new Qe()], (function(t3) {
      for (var e3 = arguments.length, i3 = new Array(e3 > 1 ? e3 - 1 : 0), r2 = 1; e3 > r2; r2++) i3[r2 - 1] = arguments[r2];
      return function(e4, r3) {
        void 0 === r3 && (r3 = 0);
        for (var s2 = [], n2 = e4.split("\n"), o2 = r3; n2.length > o2; o2++) {
          var a2 = n2[o2];
          if (1024 >= a2.length) {
            var l2 = Be.test(a2) ? a2.replace(Be, "$1") : a2;
            if (!l2.match(/\S*Error: /)) {
              for (var u2 of i3) {
                var h2 = u2(l2, t3);
                if (h2) {
                  s2.push(h2);
                  break;
                }
              }
              if (s2.length >= 50) break;
            }
          }
        }
        return (function(t4) {
          if (!t4.length) return [];
          var e5 = Array.from(t4);
          return e5.reverse(), e5.slice(0, 50).map(((t5) => {
            return f({}, t5, { filename: t5.filename || (i4 = e5, i4[i4.length - 1] || {}).filename, function: t5.function || Oe });
            var i4;
          }));
        })(s2);
      };
    })("web:javascript", Le, je)), this._instance = t2, this.mo = null !== (e2 = null == (i2 = this._instance.persistence) ? void 0 : i2.get_property(yi)) && void 0 !== e2 ? e2 : [], this.bo = ri(this._o()), this.wo = new si(this.bo);
  }
  onConfigChange() {
    this.bo = ri(this._o()), this.wo.setConfig(this.bo);
  }
  onRemoteConfig(t2) {
    var e2, i2, r2;
    if ("errorTracking" in t2) {
      var s2 = null !== (e2 = null == (i2 = t2.errorTracking) ? void 0 : i2.suppressionRules) && void 0 !== e2 ? e2 : [], n2 = null == (r2 = t2.errorTracking) ? void 0 : r2.captureExtensionExceptions;
      this.mo = s2, this._instance.persistence && this._instance.persistence.register({ [yi]: this.mo, [bi]: n2 });
    }
  }
  get xo() {
    var t2, e2 = !!this._instance.get_property(bi), i2 = this._instance.config.error_tracking.captureExtensionExceptions;
    return null !== (t2 = null != i2 ? i2 : e2) && void 0 !== t2 && t2;
  }
  buildProperties(t2, e2) {
    return this.yo.buildFromUnknown(t2, { syntheticException: null == e2 ? void 0 : e2.syntheticException, mechanism: { handled: null == e2 ? void 0 : e2.handled } });
  }
  addExceptionStep(t2, e2) {
    if (this.bo.enabled) try {
      if (!V(t2) || 0 === t2.trim().length) return void el.warn("Ignoring exception step because message must be a non-empty string");
      var i2 = this.ko(e2), { sanitizedProperties: r2, droppedKeys: s2 } = (function(t3) {
        if (!t3) return { sanitizedProperties: {}, droppedKeys: [] };
        var e3 = [];
        return { sanitizedProperties: Object.keys(t3).reduce(((i3, r3) => ei.has(r3) ? (e3.push(r3), i3) : (i3[r3] = t3[r3], i3)), {}), droppedKeys: e3 };
      })(i2);
      s2.length > 0 && el.warn("Ignoring reserved exception step fields", { droppedKeys: s2 }), this.wo.add(f({ [Ze]: t2, [ti]: (/* @__PURE__ */ new Date()).toISOString() }, r2));
    } catch (t3) {
      el.error("Failed to add exception step. Ignoring breadcrumb.", t3);
    }
  }
  sendExceptionEvent(t2) {
    try {
      var e2 = t2.$exception_list;
      if (this.So(e2)) {
        if (this.Co(e2)) return this.Io("Exception dropped: matched a suppression rule"), void el.info("Skipping exception capture because a suppression rule matched");
        if (!this.xo && this.To(e2)) return this.Io("Exception dropped: thrown by a browser extension"), void el.info("Skipping exception capture because it was thrown by an extension");
        if (!this._instance.config.error_tracking.__capturePostHogExceptions && this.Eo(e2)) return this.Io("Exception dropped: thrown by the PostHog SDK"), void el.info("Skipping exception capture because it was thrown by the PostHog SDK");
      }
      var i2 = this.bo.enabled && Y(t2.$exception_steps) ? this.Mo(t2) : t2;
      try {
        var r2 = this._instance.capture("$exception", i2, { _noTruncate: true, _batchKey: "exceptionEvent", Zi: true });
        return r2 && this.wo.clear(), r2;
      } catch (t3) {
        return el.error("Failed to capture exception event. Dropping this exception.", t3), void this.wo.clear();
      }
    } catch (t3) {
      return void el.error("Failed to process exception event. Ignoring this exception.", t3);
    }
  }
  Mo(t2) {
    try {
      var e2 = this.wo.getAttachable();
      return 0 === e2.length ? t2 : f({}, t2, { $exception_steps: e2 });
    } catch (e3) {
      return el.error("Failed to read buffered exception steps. Capturing exception without steps.", e3), t2;
    }
  }
  Io(t2) {
    this.bo.enabled && this.wo.add({ [Ze]: t2, [ti]: (/* @__PURE__ */ new Date()).toISOString() });
  }
  ko(t2) {
    return z(t2) ? f({}, t2) : {};
  }
  _o() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this._instance.config.error_tracking) ? void 0 : e2.exception_steps) && void 0 !== t2 ? t2 : {};
  }
  Co(t2) {
    if (0 === t2.length) return false;
    var e2 = t2.reduce(((t3, e3) => {
      var { type: i2, value: r2 } = e3;
      return V(i2) && i2.length > 0 && t3.$exception_types.push(i2), V(r2) && r2.length > 0 && t3.$exception_values.push(r2), t3;
    }), { $exception_types: [], $exception_values: [] });
    return this.mo.some(((t3) => {
      var i2 = t3.values.map(((t4) => {
        var i3, r2 = Ho[t4.operator], s2 = j(t4.value) ? t4.value : [t4.value], n2 = null !== (i3 = e2[t4.key]) && void 0 !== i3 ? i3 : [];
        return s2.length > 0 && r2(s2, n2);
      }));
      return "OR" === t3.type ? i2.some(Boolean) : i2.every(Boolean);
    }));
  }
  To(t2) {
    return t2.flatMap(((t3) => {
      var e2, i2;
      return null !== (e2 = null == (i2 = t3.stacktrace) ? void 0 : i2.frames) && void 0 !== e2 ? e2 : [];
    })).some(((t3) => t3.filename && t3.filename.startsWith("chrome-extension://")));
  }
  Eo(t2) {
    if (t2.length > 0) {
      var e2, i2, r2, s2, n2 = null !== (e2 = null == (i2 = t2[0].stacktrace) ? void 0 : i2.frames) && void 0 !== e2 ? e2 : [], o2 = n2[n2.length - 1];
      return null !== (r2 = null == o2 || null == (s2 = o2.filename) ? void 0 : s2.includes("posthog.com/static")) && void 0 !== r2 && r2;
    }
    return false;
  }
  So(t2) {
    return !Y(t2) && j(t2);
  }
} }, vl = f({ productTours: class {
  get zr() {
    return this._instance.persistence;
  }
  constructor(t2) {
    this.Po = null, this.Ro = null, this._instance = t2;
  }
  initialize() {
    this.loadIfEnabled();
  }
  onRemoteConfig(t2) {
    if ("productTours" in t2) {
      var e2, i2;
      if (this.zr && this.zr.register({ [xi]: !!t2.productTours }), !La(this._instance)) return !this.Po && Y(null == (e2 = this.zr) ? void 0 : e2.props[Gi]) || Da.info("product tours disabled; stopping and clearing cached tours"), null == (i2 = this.Po) || i2.stop(), this.Po = null, void this.clearCache();
      this.loadIfEnabled();
    }
  }
  loadIfEnabled() {
    !this.Po && La(this._instance) && this.Mt((() => this.Oo()));
  }
  Mt(t2) {
    var e2, i2;
    null != (e2 = h.__PosthogExtensions__) && e2.generateProductTours ? t2() : null == (i2 = h.__PosthogExtensions__) || null == i2.loadExternalDependency || i2.loadExternalDependency(this._instance, "product-tours", ((e3) => {
      e3 ? Da.error("Could not load product tours script", e3) : t2();
    }));
  }
  Oo() {
    var t2;
    !this.Po && null != (t2 = h.__PosthogExtensions__) && t2.generateProductTours && (this.Po = h.__PosthogExtensions__.generateProductTours(this._instance, true));
  }
  getProductTours(t2, e2) {
    if (void 0 === e2 && (e2 = false), !j(this.Ro) || e2) {
      var i2 = this.zr;
      if (i2) {
        var r2 = i2.props[Gi];
        if (j(r2) && !e2) return this.Ro = r2, void t2(r2, { isLoaded: true });
      }
      this._instance._send_request({ url: this._instance.requestRouter.endpointFor("api", "/api/product_tours/?token=" + this._instance.config.token), method: "GET", callback: (e3) => {
        if (La(this._instance)) {
          var r3 = e3.statusCode;
          if (200 !== r3 || !e3.json) {
            var s2 = "Product Tours API could not be loaded, status: " + r3;
            return Da.error(s2), void t2([], { isLoaded: false, error: s2 });
          }
          var n2 = j(e3.json.product_tours) ? e3.json.product_tours : [];
          this.Ro = n2, i2 && i2.register({ [Gi]: n2 }), t2(n2, { isLoaded: true });
        } else t2([], { isLoaded: true });
      } });
    } else t2(this.Ro, { isLoaded: true });
  }
  getActiveProductTours(t2) {
    Y(this.Po) ? t2([], { isLoaded: false, error: "Product tours not loaded" }) : this.Po.getActiveProductTours(t2);
  }
  showProductTour(t2) {
    var e2;
    null == (e2 = this.Po) || e2.showTourById(t2);
  }
  previewTour(t2) {
    this.Po ? this.Po.previewTour(t2) : this.Mt((() => {
      var e2;
      this.Oo(), null == (e2 = this.Po) || e2.previewTour(t2);
    }));
  }
  dismissProductTour() {
    var t2;
    null == (t2 = this.Po) || t2.dismissTour("user_clicked_skip");
  }
  nextStep() {
    var t2;
    null == (t2 = this.Po) || t2.nextStep();
  }
  previousStep() {
    var t2;
    null == (t2 = this.Po) || t2.previousStep();
  }
  clearCache() {
    var t2;
    this.Ro = null, null == (t2 = this.zr) || t2.unregister(Gi);
  }
  resetTour(t2) {
    var e2;
    null == (e2 = this.Po) || e2.resetTour(t2);
  }
  resetAllTours() {
    var t2;
    null == (t2 = this.Po) || t2.resetAllTours();
  }
  cancelPendingTour(t2) {
    var e2;
    null == (e2 = this.Po) || e2.cancelPendingTour(t2);
  }
} }, ll), cl = { siteApps: class {
  constructor(t2) {
    this.Lo = 0, this._instance = t2, this.Fo = [], this.apps = {};
  }
  get isEnabled() {
    return !!this._instance.config.opt_in_site_apps;
  }
  Ao(t2, e2) {
    if (e2) {
      var i2 = this.globalsForEvent(e2);
      this.Fo.push(i2), this.Fo.length > 1e3 && (this.Fo = this.Fo.slice(10));
    }
  }
  get siteAppLoaders() {
    var t2;
    return null == (t2 = h._POSTHOG_REMOTE_CONFIG) || null == (t2 = t2[this._instance.config.token]) ? void 0 : t2.siteApps;
  }
  initialize() {
    if (this.isEnabled) {
      var t2 = this._instance._addCaptureHook(this.Ao.bind(this));
      this.$o = () => {
        t2(), this.Fo = [], this.$o = void 0;
      };
    }
  }
  globalsForEvent(t2) {
    var e2, i2, r2, s2, n2, o2, a2;
    if (!t2) throw new Error("Event payload is required");
    var l2 = {}, u2 = this._instance.get_property("$groups") || [], h2 = this._instance.get_property("$stored_group_properties") || {};
    for (var [d2, v2] of Object.entries(h2)) l2[d2] = { id: u2[d2], type: d2, properties: v2 };
    var { $set_once: c2, $set: p2 } = t2;
    return { event: f({}, _(t2, Na), { properties: f({}, t2.properties, p2 ? { $set: f({}, null !== (e2 = null == (i2 = t2.properties) ? void 0 : i2.$set) && void 0 !== e2 ? e2 : {}, p2) } : {}, c2 ? { $set_once: f({}, null !== (r2 = null == (s2 = t2.properties) ? void 0 : s2.$set_once) && void 0 !== r2 ? r2 : {}, c2) } : {}), elements_chain: null !== (n2 = null == (o2 = t2.properties) ? void 0 : o2.$elements_chain) && void 0 !== n2 ? n2 : "", distinct_id: null == (a2 = t2.properties) ? void 0 : a2.distinct_id }), person: { properties: this._instance.get_property("$stored_person_properties") }, groups: l2 };
  }
  Do(t2) {
    var e2, i2 = null == (e2 = t2.tagName) ? void 0 : e2.toLowerCase();
    return "style" === i2 && this._instance.config.prepare_external_dependency_stylesheet ? this._instance.config.prepare_external_dependency_stylesheet(t2) || (Ua.error("prepare_external_dependency_stylesheet returned null"), null) : "script" === i2 && this._instance.config.prepare_external_dependency_script ? this._instance.config.prepare_external_dependency_script(t2) || (Ua.error("prepare_external_dependency_script returned null"), null) : t2;
  }
  No() {
    var t2, e2, i2, s2, n2, o2, a2, l2;
    if (!this._instance.config.prepare_external_dependency_stylesheet && !this._instance.config.prepare_external_dependency_script) return () => {
    };
    var u2 = null == r ? void 0 : r.defaultView, h2 = null == u2 || null == (t2 = u2.Node) ? void 0 : t2.prototype;
    if (!u2 || !h2) return () => {
    };
    if (this.Lo++, this.qo) return this.jo();
    var d2 = [], v2 = this, c2 = /* @__PURE__ */ new WeakSet(), p2 = (t3, e3, i3) => {
      if (null != t3 && t3[e3]) {
        var r2 = t3[e3];
        t3[e3] = i3(r2), d2.push((() => {
          t3[e3] = r2;
        }));
      }
    }, f2 = (t3) => {
      if (c2.has(t3)) return t3;
      var e3 = v2.Do(t3);
      return e3 && c2.add(e3), e3;
    }, _2 = (t3) => t3.map(((t4) => "string" == typeof t4 ? t4 : f2(t4))).filter(((t4) => !W(t4)));
    return p2(h2, "appendChild", ((t3) => function(e3) {
      var i3 = f2(e3);
      return i3 ? t3.call(this, i3) : e3;
    })), p2(h2, "insertBefore", ((t3) => function(e3, i3) {
      var r2 = f2(e3);
      return r2 ? t3.call(this, r2, i3) : e3;
    })), p2(h2, "replaceChild", ((t3) => function(e3, i3) {
      var r2 = f2(e3);
      return r2 ? t3.call(this, r2, i3) : i3;
    })), [null == (e2 = u2.Element) ? void 0 : e2.prototype, null == (i2 = u2.Document) ? void 0 : i2.prototype, null == (s2 = u2.DocumentFragment) ? void 0 : s2.prototype].forEach(((t3) => {
      p2(t3, "append", ((t4) => function() {
        for (var e3 = arguments.length, i3 = new Array(e3), r2 = 0; e3 > r2; r2++) i3[r2] = arguments[r2];
        return t4.apply(this, _2(i3));
      })), p2(t3, "prepend", ((t4) => function() {
        for (var e3 = arguments.length, i3 = new Array(e3), r2 = 0; e3 > r2; r2++) i3[r2] = arguments[r2];
        return t4.apply(this, _2(i3));
      }));
    })), [null == (n2 = u2.Element) ? void 0 : n2.prototype, null == (o2 = u2.CharacterData) ? void 0 : o2.prototype, null == (a2 = u2.DocumentType) ? void 0 : a2.prototype].forEach(((t3) => {
      p2(t3, "before", ((t4) => function() {
        for (var e3 = arguments.length, i3 = new Array(e3), r2 = 0; e3 > r2; r2++) i3[r2] = arguments[r2];
        return t4.apply(this, _2(i3));
      })), p2(t3, "after", ((t4) => function() {
        for (var e3 = arguments.length, i3 = new Array(e3), r2 = 0; e3 > r2; r2++) i3[r2] = arguments[r2];
        return t4.apply(this, _2(i3));
      })), p2(t3, "replaceWith", ((t4) => function() {
        for (var e3 = arguments.length, i3 = new Array(e3), r2 = 0; e3 > r2; r2++) i3[r2] = arguments[r2];
        var s3 = _2(i3);
        return i3.length && !s3.length ? void 0 : t4.apply(this, s3);
      }));
    })), p2(null == (l2 = u2.Element) ? void 0 : l2.prototype, "insertAdjacentElement", ((t3) => function(e3, i3) {
      var r2 = f2(i3);
      return r2 ? t3.call(this, e3, r2) : null;
    })), this.qo = () => {
      d2.forEach(((t3) => t3())), this.qo = void 0;
    }, this.jo();
  }
  jo() {
    var t2 = false;
    return () => {
      var e2;
      t2 || (t2 = true, this.Lo--, 0 === this.Lo && (null == (e2 = this.qo) || e2.call(this)));
    };
  }
  Bo(t2, e2) {
    void 0 === e2 && (e2 = true);
    var i2 = this.No();
    try {
      var r2 = t2(i2);
      return e2 && i2(), r2;
    } catch (t3) {
      throw i2(), t3;
    }
  }
  setupSiteApp(t2) {
    var e2 = this.apps[t2.id], i2 = () => {
      var i3;
      !e2.errored && this.Fo.length && (Ua.info("Processing " + this.Fo.length + " events for site app with id " + t2.id), this.Fo.forEach(((t3) => this.Bo((() => null == e2.processEvent ? void 0 : e2.processEvent(t3))))), e2.processedBuffer = true), Object.values(this.apps).every(((t3) => t3.processedBuffer || t3.errored)) && (null == (i3 = this.$o) || i3.call(this));
    }, r2 = false, s2 = (s3) => {
      e2.errored = !s3, e2.loaded = true, Ua.info("Site app with id " + t2.id + " " + (s3 ? "loaded" : "errored")), r2 && i2();
    };
    try {
      var { processEvent: n2 } = this.Bo(((e3) => t2.init({ posthog: this._instance, callback(t3) {
        e3(), s2(t3);
      } })), false);
      n2 && (e2.processEvent = n2), r2 = true;
    } catch (e3) {
      Ua.error(ja + t2.id, e3), s2(false);
    }
    if (r2 && e2.loaded) try {
      i2();
    } catch (i3) {
      Ua.error("Error while processing buffered events PostHog app with config id " + t2.id, i3), e2.errored = true;
    }
  }
  Ho() {
    var t2 = this.siteAppLoaders || [];
    for (var e2 of t2) this.apps[e2.id] = { id: e2.id, loaded: false, errored: false, processedBuffer: false };
    for (var i2 of t2) this.setupSiteApp(i2);
  }
  Uo(t2) {
    var e2 = this;
    if (0 !== Object.keys(this.apps).length) {
      var i2 = this.globalsForEvent(t2), r2 = function(r3) {
        try {
          e2.Bo((() => null == r3.processEvent ? void 0 : r3.processEvent(i2)));
        } catch (e3) {
          Ua.error("Error while processing event " + t2.event + " for site app " + r3.id, e3);
        }
      };
      for (var s2 of Object.values(this.apps)) r2(s2);
    }
  }
  onRemoteConfig(t2) {
    var e2, i2, r2, s2 = this;
    if (null != (e2 = this.siteAppLoaders) && e2.length) return this.isEnabled ? (this.Ho(), void this._instance.on("eventCaptured", ((t3) => this.Uo(t3)))) : void Ua.error('PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.');
    if (null == (i2 = this.$o) || i2.call(this), null != (r2 = t2.siteApps) && r2.length) if (this.isEnabled) {
      var n2 = function(t3) {
        var e3;
        h["__$$ph_site_app_" + t3] = s2._instance, null == (e3 = h.__PosthogExtensions__) || null == e3.loadSiteApp || e3.loadSiteApp(s2._instance, a2, ((e4) => {
          if (e4) return Ua.error(ja + t3, e4);
        }));
      };
      for (var { id: o2, url: a2 } of t2.siteApps) n2(o2);
    } else Ua.error('PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.');
  }
} }, pl = { tracingHeaders: class {
  constructor(t2) {
    this.zo = void 0, this.Vo = void 0, this.Wo = void 0, this.ao = () => {
      var t3, e2, i2 = this.Go();
      i2 ? (q(this.zo) && (this.zo = null == (t3 = h.__PosthogExtensions__) || null == (t3 = t3.tracingHeadersPatchFns) ? void 0 : t3._patchXHR(i2, (() => this._instance.get_distinct_id()), this._instance.sessionManager)), q(this.Vo) && (this.Vo = null == (e2 = h.__PosthogExtensions__) || null == (e2 = e2.tracingHeadersPatchFns) ? void 0 : e2._patchFetch(i2, (() => this._instance.get_distinct_id()), this._instance.sessionManager))) : this.co();
    }, this._instance = t2;
  }
  initialize() {
    this.startIfEnabledOrStop();
  }
  Mt(t2) {
    var e2, i2;
    null != (e2 = h.__PosthogExtensions__) && e2.tracingHeadersPatchFns ? t2() : null == (i2 = h.__PosthogExtensions__) || null == i2.loadExternalDependency || i2.loadExternalDependency(this._instance, "tracing-headers", ((e3) => {
      if (e3) return Ta.error("failed to load script", e3);
      t2();
    }));
  }
  Zo() {
    var t2, e2;
    return null !== (t2 = null !== (e2 = this._instance.config.tracing_headers) && void 0 !== e2 ? e2 : this._instance.config.addTracingHeaders) && void 0 !== t2 ? t2 : this._instance.config.__add_tracing_headers;
  }
  Go() {
    var t2 = this.Zo();
    return j(t2) ? (j(this.Wo) ? this.Wo.splice(0, this.Wo.length, ...t2) : this.Wo = [...t2], t2.length > 0 ? this.Wo : void 0) : (j(this.Wo) && this.Wo.splice(0), this.Wo = t2 || void 0, this.Wo);
  }
  co() {
    var t2, e2;
    null == (t2 = this.zo) || t2.call(this), null == (e2 = this.Vo) || e2.call(this), this.zo = void 0, this.Vo = void 0;
  }
  startIfEnabledOrStop() {
    this.Go() ? this.Mt(this.ao) : this.co();
  }
} }, fl = f({ surveys: class {
  get Se() {
    return this._instance.config;
  }
  constructor(t2) {
    this.Qo = void 0, this._surveyManager = null, this.Jo = false, this.Yo = [], this.Ko = null, this._instance = t2, this._surveyEventReceiver = null;
  }
  initialize() {
    this.loadIfEnabled();
  }
  onRemoteConfig(t2) {
    if (!this.Se.disable_surveys) {
      var e2 = t2.surveys;
      if (Y(e2)) return Jo.warn("Flags not loaded yet. Not loading surveys.");
      var i2 = j(e2);
      this.Qo = i2 ? e2.length > 0 : e2, Jo.info("flags response received, isSurveysEnabled: " + this.Qo), this.loadIfEnabled();
    }
  }
  reset() {
    try {
      var t2;
      null == (t2 = this._surveyEventReceiver) || t2.reset(), localStorage.removeItem("lastSeenSurveyDate");
      for (var e2 = [], i2 = 0; i2 < localStorage.length; i2++) {
        var r2 = localStorage.key(i2);
        (null != r2 && r2.startsWith(Qo) || null != r2 && r2.startsWith("inProgressSurvey_")) && e2.push(r2);
      }
      e2.forEach(((t3) => localStorage.removeItem(t3)));
    } catch (t3) {
    }
  }
  loadIfEnabled() {
    if (!this._surveyManager) if (this.Jo) Jo.info("Already initializing surveys, skipping...");
    else if (this.Se.disable_surveys) Jo.info(Ga);
    else if (this.Se.cookieless_mode && this._instance.consent.isOptedOut()) Jo.info("Not loading surveys in cookieless mode without consent.");
    else {
      var t2 = null == h ? void 0 : h.__PosthogExtensions__;
      if (t2) {
        if (!q(this.Qo) || this.Se.advanced_enable_surveys) {
          var e2 = this.Qo || this.Se.advanced_enable_surveys;
          this.Jo = true;
          try {
            var i2 = t2.generateSurveys;
            if (i2) return void this.Xo(i2, e2);
            var r2 = t2.loadExternalDependency;
            if (!r2) return void this.ea(ur);
            r2(this._instance, "surveys", ((i3) => {
              i3 || !t2.generateSurveys ? this.ea("Could not load surveys script", i3) : this.Xo(t2.generateSurveys, e2);
            }));
          } catch (t3) {
            throw this.ea("Error initializing surveys", t3), t3;
          } finally {
            this.Jo = false;
          }
        }
      } else Jo.error("PostHog Extensions not found.");
    }
  }
  Xo(t2, e2) {
    this._surveyManager = t2(this._instance, e2), this._surveyEventReceiver = new qa(this._instance), Jo.info("Surveys loaded successfully"), this.ta({ isLoaded: true });
  }
  ea(t2, e2) {
    Jo.error(t2, e2), this.ta({ isLoaded: false, error: t2 });
  }
  onSurveysLoaded(t2) {
    return this.Yo.push(t2), this._surveyManager && this.ta({ isLoaded: true }), () => {
      this.Yo = this.Yo.filter(((e2) => e2 !== t2));
    };
  }
  getSurveys(t2, e2) {
    if (void 0 === e2 && (e2 = false), this.Se.disable_surveys) return Jo.info(Ga), t2([]);
    var i2, r2 = this._instance.get_property(Hi);
    if (r2 && !e2) return t2(r2, { isLoaded: true });
    "undefined" != typeof Promise && this.Ko ? this.Ko.then(((e3) => {
      var { surveys: i3, context: r3 } = e3;
      return t2(i3, r3);
    })) : ("undefined" != typeof Promise && (this.Ko = new Promise(((t3) => {
      i2 = t3;
    }))), this._instance._send_request({ url: this._instance.requestRouter.endpointFor("api", "/api/surveys/?token=" + this.Se.token), method: "GET", timeout: this.Se.surveys_request_timeout_ms, callback: (e3) => {
      var r3;
      this.Ko = null;
      var s2 = e3.statusCode;
      if (200 !== s2 || !e3.json) {
        var n2 = "Surveys API could not be loaded, status: " + s2;
        Jo.error(n2);
        var o2 = { isLoaded: false, error: n2 };
        return t2([], o2), void (null == i2 || i2({ surveys: [], context: o2 }));
      }
      var a2, l2 = e3.json.surveys || [], u2 = l2.filter(((t3) => (function(t4) {
        return !(!t4.start_date || t4.end_date);
      })(t3) && ((function(t4) {
        var e4;
        return !(null == (e4 = t4.conditions) || null == (e4 = e4.events) || null == (e4 = e4.values) || !e4.length);
      })(t3) || (function(t4) {
        var e4;
        return !(null == (e4 = t4.conditions) || null == (e4 = e4.actions) || null == (e4 = e4.values) || !e4.length);
      })(t3))));
      u2.length > 0 && (null == (a2 = this._surveyEventReceiver) || a2.register(u2)), null == (r3 = this._instance.persistence) || r3.register({ [Hi]: l2, [qi]: Date.now() });
      var h2 = { isLoaded: true };
      t2(l2, h2), null == i2 || i2({ surveys: l2, context: h2 });
    } }));
  }
  ta(t2) {
    for (var e2 of this.Yo) try {
      if (!t2.isLoaded) return e2([], t2);
      this.getSurveys(e2);
    } catch (t3) {
      Jo.error("Error in survey callback", t3);
    }
  }
  getActiveMatchingSurveys(t2, e2) {
    if (void 0 === e2 && (e2 = false), !Y(this._surveyManager)) return this._surveyManager.getActiveMatchingSurveys(t2, e2);
    Jo.warn("init was not called");
  }
  ra(t2) {
    var e2 = null;
    return this.getSurveys(((i2) => {
      var r2;
      e2 = null !== (r2 = i2.find(((e3) => e3.id === t2))) && void 0 !== r2 ? r2 : null;
    })), e2;
  }
  ia(t2) {
    if (Y(this._surveyManager)) return { eligible: false, reason: Va };
    var e2 = "string" == typeof t2 ? this.ra(t2) : t2;
    return e2 ? this._surveyManager.checkSurveyEligibility(e2) : { eligible: false, reason: "Survey not found" };
  }
  canRenderSurvey(t2) {
    if (Y(this._surveyManager)) return Jo.warn("init was not called"), { visible: false, disabledReason: Va };
    var e2 = this.ia(t2);
    return { visible: e2.eligible, disabledReason: e2.reason };
  }
  canRenderSurveyAsync(t2, e2) {
    return Y(this._surveyManager) ? (Jo.warn("init was not called"), Promise.resolve({ visible: false, disabledReason: Va })) : new Promise(((i2) => {
      this.getSurveys(((e3) => {
        var r2, s2 = null !== (r2 = e3.find(((e4) => e4.id === t2))) && void 0 !== r2 ? r2 : null;
        if (s2) {
          var n2 = this.ia(s2);
          i2({ visible: n2.eligible, disabledReason: n2.reason });
        } else i2({ visible: false, disabledReason: "Survey not found" });
      }), e2);
    }));
  }
  renderSurvey(t2, e2, i2) {
    var s2;
    if (Y(this._surveyManager)) Jo.warn("init was not called");
    else {
      var n2 = "string" == typeof t2 ? this.ra(t2) : t2;
      if (null != n2 && n2.id) if (Xo.includes(n2.type)) {
        var o2 = null == r ? void 0 : r.querySelector(e2);
        if (o2) return null != (s2 = n2.appearance) && s2.surveyPopupDelaySeconds ? (Jo.info("Rendering survey " + n2.id + " with delay of " + n2.appearance.surveyPopupDelaySeconds + " seconds"), void setTimeout((() => {
          var t3, e3;
          Jo.info("Rendering survey " + n2.id + " with delay of " + (null == (t3 = n2.appearance) ? void 0 : t3.surveyPopupDelaySeconds) + " seconds"), null == (e3 = this._surveyManager) || e3.renderSurvey(n2, o2, i2), Jo.info("Survey " + n2.id + " rendered");
        }), 1e3 * n2.appearance.surveyPopupDelaySeconds)) : void this._surveyManager.renderSurvey(n2, o2, i2);
        Jo.warn("Survey element not found");
      } else Jo.warn("Surveys of type " + n2.type + " cannot be rendered in the app");
      else Jo.warn("Survey not found");
    }
  }
  displaySurvey(t2, e2) {
    var i2;
    if (Y(this._surveyManager)) Jo.warn("init was not called");
    else {
      var r2 = this.ra(t2);
      if (r2) {
        var s2 = r2;
        if (null != (i2 = r2.appearance) && i2.surveyPopupDelaySeconds && e2.ignoreDelay && (s2 = f({}, r2, { appearance: f({}, r2.appearance, { surveyPopupDelaySeconds: 0 }) })), e2.displayType !== Rn.Popover && e2.initialResponses && Jo.warn("initialResponses is only supported for popover surveys. prefill will not be applied."), false === e2.ignoreConditions) {
          var n2 = this.canRenderSurvey(r2);
          if (!n2.visible) return void Jo.warn("Survey is not eligible to be displayed: ", n2.disabledReason);
        }
        e2.displayType !== Rn.Inline ? this._surveyManager.handlePopoverSurvey(s2, e2) : this.renderSurvey(s2, e2.selector, e2.properties);
      } else Jo.warn("Survey not found");
    }
  }
  cancelPendingSurvey(t2) {
    Y(this._surveyManager) ? Jo.warn("init was not called") : this._surveyManager.cancelSurvey(t2);
  }
  handlePageUnload() {
    var t2;
    null == (t2 = this._surveyManager) || t2.handlePageUnload();
  }
} }, ll), _l = { toolbar: class {
  constructor(t2) {
    this.instance = t2;
  }
  na(t2) {
    h.ph_toolbar_state = t2;
  }
  sa() {
    var t2;
    return null !== (t2 = h.ph_toolbar_state) && void 0 !== t2 ? t2 : 0;
  }
  initialize() {
    return this.maybeLoadToolbar();
  }
  maybeLoadToolbar(e2, i2, s2) {
    if (void 0 === e2 && (e2 = void 0), void 0 === i2 && (i2 = void 0), void 0 === s2 && (s2 = void 0), Or(this.instance.config)) return false;
    if (!t || !r) return false;
    e2 = null != e2 ? e2 : t.location, s2 = null != s2 ? s2 : t.history;
    try {
      if (!i2) {
        try {
          t.localStorage.setItem("test", "test"), t.localStorage.removeItem("test");
        } catch (t2) {
          return false;
        }
        i2 = null == t ? void 0 : t.localStorage;
      }
      var n2, o2 = Wa || Qs(e2.hash, "__posthog") || Qs(e2.hash, "state"), a2 = o2 ? Tr((() => JSON.parse(atob(decodeURIComponent(o2))))) || Tr((() => JSON.parse(decodeURIComponent(o2)))) : null;
      return a2 && "ph_authorize" === a2.action ? ((n2 = a2).source = "url", n2 && Object.keys(n2).length > 0 && (a2.desiredHash ? e2.hash = a2.desiredHash : s2 ? s2.replaceState(s2.state, "", e2.pathname + e2.search) : e2.hash = "")) : ((n2 = JSON.parse(i2.getItem(Ya) || "{}")).source = "localstorage", delete n2.userIntent), !(!n2.token || this.instance.config.token !== n2.token || (this.loadToolbar(n2), 0));
    } catch (t2) {
      return false;
    }
  }
  oa(t2) {
    var e2 = h.ph_load_toolbar || h.ph_load_editor;
    !Y(e2) && B(e2) ? e2(t2, this.instance) : Ka.warn("No toolbar load function found");
  }
  loadToolbar(e2) {
    var i2 = !(null == r || !r.getElementById(sr));
    if (!t || i2) return false;
    var s2 = "custom" === this.instance.requestRouter.region && this.instance.config.advanced_disable_toolbar_metrics, n2 = f({ token: this.instance.config.token }, e2, { apiURL: this.instance.requestRouter.endpointFor("ui") }, s2 ? { instrument: false } : {});
    if (t.localStorage.setItem(Ya, JSON.stringify(f({}, n2, { source: void 0 }))), 2 === this.sa()) this.oa(n2);
    else if (0 === this.sa()) {
      var o2;
      this.na(1), null == (o2 = h.__PosthogExtensions__) || null == o2.loadExternalDependency || o2.loadExternalDependency(this.instance, "toolbar", ((t2) => {
        if (t2) return Ka.error("[Toolbar] Failed to load", t2), void this.na(0);
        this.na(2), this.oa(n2);
      })), Ir(t, "turbolinks:load", (() => {
        this.na(0), this.loadToolbar(n2);
      }));
    }
    return true;
  }
  aa(t2) {
    return this.loadToolbar(t2);
  }
  maybeLoadEditor(t2, e2, i2) {
    return void 0 === t2 && (t2 = void 0), void 0 === e2 && (e2 = void 0), void 0 === i2 && (i2 = void 0), this.maybeLoadToolbar(t2, e2, i2);
  }
} }, gl = f({ experiments: sl }, ll), ml = f({}, ll, ul, hl, dl, vl, cl, fl, pl, _l, gl, { conversations: class {
  constructor(t2) {
    this.la = void 0, this._conversationsManager = null, this.ua = false, this.ha = null, this._instance = t2;
  }
  initialize() {
    this.loadIfEnabled();
  }
  onRemoteConfig(t2) {
    if (!this._instance.config.disable_conversations) {
      var e2 = t2.conversations;
      Y(e2) || (Q(e2) ? this.la = e2 : (this.la = e2.enabled, this.ha = e2), this.loadIfEnabled());
    }
  }
  reset() {
    var t2;
    null == (t2 = this._conversationsManager) || t2.reset(), this._conversationsManager = null, this.la = void 0, this.ha = null;
  }
  loadIfEnabled() {
    if (!(this._conversationsManager || this.ua || this._instance.config.disable_conversations || Or(this._instance.config) || this._instance.config.cookieless_mode && this._instance.consent.isOptedOut())) {
      var t2 = null == h ? void 0 : h.__PosthogExtensions__;
      if (t2 && !q(this.la) && this.la) if (this.ha && this.ha.token) {
        this.ua = true;
        try {
          var e2 = t2.initConversations;
          if (e2) return this.da(e2), void (this.ua = false);
          var i2 = t2.loadExternalDependency;
          if (!i2) return void this.ca(ur);
          i2(this._instance, "conversations", ((e3) => {
            e3 || !t2.initConversations ? this.ca("Could not load conversations script", e3) : this.da(t2.initConversations), this.ua = false;
          }));
        } catch (t3) {
          this.ca("Error initializing conversations", t3), this.ua = false;
        }
      } else nl.error("Conversations enabled but missing token in remote config.");
    }
  }
  da(t2) {
    if (this.ha) try {
      this._conversationsManager = t2(this.ha, this._instance), nl.info("Conversations loaded successfully");
    } catch (t3) {
      this.ca("Error completing conversations initialization", t3);
    }
    else nl.error("Cannot complete initialization: remote config is null");
  }
  ca(t2, e2) {
    nl.error(t2, e2), this._conversationsManager = null, this.ua = false;
  }
  show() {
    this._conversationsManager ? this._conversationsManager.show() : nl.warn("Conversations not loaded yet.");
  }
  hide() {
    this._conversationsManager && this._conversationsManager.hide();
  }
  isAvailable() {
    return true === this.la && !W(this._conversationsManager);
  }
  isVisible() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this._conversationsManager) ? void 0 : e2.isVisible()) && void 0 !== t2 && t2;
  }
  sendMessage(t2, e2, i2) {
    var r2 = this;
    return p((function* () {
      return r2._conversationsManager ? r2._conversationsManager.sendMessage(t2, e2, i2) : (nl.warn(ol), null);
    }))();
  }
  getMessages(t2, e2) {
    var i2 = this;
    return p((function* () {
      return i2._conversationsManager ? i2._conversationsManager.getMessages(t2, e2) : (nl.warn(ol), null);
    }))();
  }
  markAsRead(t2) {
    var e2 = this;
    return p((function* () {
      return e2._conversationsManager ? e2._conversationsManager.markAsRead(t2) : (nl.warn(ol), null);
    }))();
  }
  getTickets(t2) {
    var e2 = this;
    return p((function* () {
      return e2._conversationsManager ? e2._conversationsManager.getTickets(t2) : (nl.warn(ol), null);
    }))();
  }
  requestRestoreLink(t2) {
    var e2 = this;
    return p((function* () {
      return e2._conversationsManager ? e2._conversationsManager.requestRestoreLink(t2) : (nl.warn(ol), null);
    }))();
  }
  restoreFromToken(t2) {
    var e2 = this;
    return p((function* () {
      return e2._conversationsManager ? e2._conversationsManager.restoreFromToken(t2) : (nl.warn(ol), null);
    }))();
  }
  restoreFromUrlToken() {
    var t2 = this;
    return p((function* () {
      return t2._conversationsManager ? t2._conversationsManager.restoreFromUrlToken() : (nl.warn(ol), null);
    }))();
  }
  getCurrentTicketId() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this._conversationsManager) ? void 0 : e2.getCurrentTicketId()) && void 0 !== t2 ? t2 : null;
  }
  getWidgetSessionId() {
    var t2, e2;
    return null !== (t2 = null == (e2 = this._conversationsManager) ? void 0 : e2.getWidgetSessionId()) && void 0 !== t2 ? t2 : null;
  }
  en() {
    var t2;
    null == (t2 = this._conversationsManager) || t2.setIdentity();
  }
  tn() {
    var t2;
    null == (t2 = this._conversationsManager) || t2.clearIdentity();
  }
} }, { logs: class {
  constructor(e2) {
    var i2;
    this.va = false, this.fa = false, this.Ae = li("[logs]"), this._r = [], this.pa = [], this.ga = () => {
      var t2, e3;
      null == (t2 = this.ma) || t2.onReconnect(), null == (e3 = this.ya) || e3.onReconnect();
    }, this._instance = e2, this._instance && null != (i2 = this._instance.config.logs) && i2.captureConsoleLogs && (this.va = true), t && Ir(t, "online", this.ga);
  }
  ba(t2, e2, i2, r2) {
    var s2, n2 = (function(t3, e3) {
      var i3, r3, s3, n3, o2, a2, l2, u2 = null !== (i3 = null == t3 ? void 0 : t3.flushIntervalMs) && void 0 !== i3 ? i3 : 3e3, h2 = null !== (r3 = null == t3 ? void 0 : t3.maxBufferSize) && void 0 !== r3 ? r3 : 100, d2 = null != e3 && e3.consoleCapture ? void 0 : null !== (s3 = null == t3 ? void 0 : t3.maxLogsPerInterval) && void 0 !== s3 ? s3 : 1e3, v2 = q(d2) ? Math.max(h2, 2048) : Math.max(h2, d2), c2 = null == t3 ? void 0 : t3.resourceAttributes;
      return { serviceName: null !== (n3 = null !== (o2 = null == c2 ? void 0 : c2["service.name"]) && void 0 !== o2 ? o2 : null == t3 ? void 0 : t3.serviceName) && void 0 !== n3 ? n3 : null == e3 ? void 0 : e3.serviceNameDefault, serviceVersion: null !== (a2 = null == c2 ? void 0 : c2["service.version"]) && void 0 !== a2 ? a2 : null == t3 ? void 0 : t3.serviceVersion, environment: null !== (l2 = null == c2 ? void 0 : c2["deployment.environment"]) && void 0 !== l2 ? l2 : null == t3 ? void 0 : t3.environment, resourceAttributes: c2, beforeSend: null == t3 ? void 0 : t3.beforeSend, flushIntervalMs: u2, maxBufferSize: h2, maxQueueSize: v2, maxBatchRecordsPerPost: 100, rateCapWindowMs: u2, maxLogsPerInterval: d2, backgroundFlushBudgetMs: 0, terminationFlushBudgetMs: 0 };
    })(null == (s2 = this._instance) || null == (s2 = s2.config) ? void 0 : s2.logs, i2);
    return [new Te(this._a(t2, e2), n2, this.Ae, (() => this.wa()), ((t3) => t3()), void 0, r2), n2];
  }
  xa() {
    var t2, e2, i2 = null == (t2 = this._instance) || null == (t2 = t2.config) ? void 0 : t2.logs;
    return this.ma && this.ka === i2 || (null == (e2 = this.ma) || e2.reset(), this.ka = i2, [this.ma, this.Sa] = this.ba((() => this._r), ((t3) => {
      this._r = t3;
    }))), this.ma;
  }
  Ca() {
    var t2, e2, i2 = null == (t2 = this._instance) || null == (t2 = t2.config) ? void 0 : t2.logs;
    return this.ya && this.Ia === i2 || (null == (e2 = this.ya) || e2.reset(), this.Ia = i2, [this.ya, this.Ta] = this.ba((() => this.pa), ((t3) => {
      this.pa = t3;
    }), { serviceNameDefault: "posthog-browser-logs", consoleCapture: true }, al)), this.ya;
  }
  initialize() {
    this.loadIfEnabled();
  }
  onRemoteConfig(t2) {
    var e2, i2 = null == (e2 = t2.logs) ? void 0 : e2.captureConsoleLogs;
    !Y(i2) && i2 && (this.va = true, this.loadIfEnabled());
  }
  reset() {
    var t2, e2;
    this._r = [], null == (t2 = this.ma) || t2.reset(), this.pa = [], null == (e2 = this.ya) || e2.reset();
  }
  captureLog(t2) {
    this.xa().captureLog(t2);
  }
  le(t2) {
    this.Ca().captureLog(t2);
  }
  get logger() {
    return this.Ea || (this.Ea = { trace: (t2, e2) => this.captureLog({ body: t2, level: "trace", attributes: e2 }), debug: (t2, e2) => this.captureLog({ body: t2, level: "debug", attributes: e2 }), info: (t2, e2) => this.captureLog({ body: t2, level: "info", attributes: e2 }), warn: (t2, e2) => this.captureLog({ body: t2, level: "warn", attributes: e2 }), error: (t2, e2) => this.captureLog({ body: t2, level: "error", attributes: e2 }), fatal: (t2, e2) => this.captureLog({ body: t2, level: "fatal", attributes: e2 }) }), this.Ea;
  }
  flushLogs(t2) {
    t2 ? this.Ma(t2) : (this.ma && this.ma.flush().catch(((t3) => this.Ae.error("PostHog logs flush failed:", t3))), this.ya && this.ya.flush().catch(((t3) => this.Ae.error("PostHog logs flush failed:", t3))));
  }
  loadIfEnabled() {
    if (this.va && !this.fa) {
      var t2 = null == h ? void 0 : h.__PosthogExtensions__;
      if (t2) {
        var e2 = t2.loadExternalDependency;
        e2 ? e2(this._instance, "logs", ((e3) => {
          var i2;
          e3 || null == (i2 = t2.logs) || !i2.initializeLogs ? this.Ae.error("Could not load logs script", e3) : (t2.logs.initializeLogs(this._instance), this.fa = true);
        })) : this.Ae.error(ur);
      } else this.Ae.error("PostHog Extensions not found.");
    }
  }
  _a(t2, e2) {
    var i2 = this._instance;
    return { get isDisabled() {
      return false;
    }, get optedOut() {
      return !i2.is_capturing();
    }, getPersistedProperty: (e3) => e3 === w.LogsQueue ? t2() : void 0, setPersistedProperty(t3, i3) {
      var r2;
      t3 === w.LogsQueue && e2(null !== (r2 = i3) && void 0 !== r2 ? r2 : []);
    }, ht: (t3) => this.ht(t3), getLibraryId: () => v.LIB_NAME, getLibraryVersion: () => v.LIB_VERSION };
  }
  ht(t2) {
    return new Promise(((e2) => {
      var i2 = false, r2 = (t3) => {
        i2 || (i2 = true, clearTimeout(s2), e2(t3));
      }, s2 = setTimeout((() => r2({ kind: "retry-later", error: new Error("logs request timed out") })), 9e4);
      this._instance._send_request({ method: "POST", url: this.Pa(), data: t2, compression: "best-available", batchKey: "logs", fireCallbackOnDrop: true, callback(t3) {
        var e3 = t3.statusCode;
        if (e3 >= 200 && 300 > e3) r2({ kind: "ok" });
        else if (413 === e3) r2({ kind: "too-large" });
        else if (0 !== e3 && 429 !== e3 && 500 > e3) r2({ kind: "fatal", error: new Error("logs request failed with status " + e3) });
        else {
          var i3;
          r2({ kind: "retry-later", error: null !== (i3 = t3.error) && void 0 !== i3 ? i3 : new Error("logs request failed with status " + e3) });
        }
      } });
    }));
  }
  Ma(t2) {
    this._r.length > 0 && this.Ra(t2, this._r, this.Sa, v.LIB_NAME, ((t3) => {
      this._r = t3;
    })), this.pa.length > 0 && this.Ra(t2, this.pa, this.Ta, al, ((t3) => {
      this.pa = t3;
    }));
  }
  Ra(t2, e2, i2, r2, s2) {
    if (0 !== e2.length) {
      var n2 = e2.map(((t3) => t3.record));
      s2([]);
      var o2 = Se(n2, xe(i2, v.LIB_NAME, v.LIB_VERSION), r2, v.LIB_VERSION);
      this._instance._send_request({ method: "POST", url: this.Pa(), data: o2, compression: "best-available", batchKey: "logs", transport: t2 });
    }
  }
  Pa() {
    return this._instance.requestRouter.endpointFor("api", "/i/v1/logs") + "?token=" + encodeURIComponent(this._instance.config.token);
  }
  wa() {
    var t2, e2 = {};
    if (e2.distinctId = this._instance.get_distinct_id(), this._instance.sessionManager) {
      var { sessionId: i2, windowId: r2, sessionStartTimestamp: s2, lastActivityTimestamp: n2 } = this._instance.sessionManager.checkAndGetSessionAndWindowId(true);
      e2.sessionId = i2, e2.windowId = r2, Y(s2) || (e2.sessionStartTimestamp = s2), Y(n2) || (e2.lastActivityTimestamp = n2);
    }
    if (null != h && null != (t2 = h.location) && t2.href && (e2.currentUrl = this._instance.config.disable_capture_url_hashes ? fe(h.location.href) : h.location.href), this._instance.featureFlags) {
      var o2 = this._instance.featureFlags.getFlags();
      o2 && o2.length > 0 && (e2.activeFeatureFlags = o2);
    }
    return e2;
  }
} });
ga.__defaultExtensionClasses = f({}, ml);
var yl = (function() {
  v.SDK_DIST_CHANNEL = "npm";
  var e2 = sa[da] = new ga();
  return (function() {
    function e3() {
      e3.done || (e3.done = true, va = false, Er(sa, (function(t2) {
        t2._dom_loaded();
      })));
    }
    null != r && r.addEventListener ? "complete" === r.readyState ? e3() : Ir(r, "DOMContentLoaded", e3, { capture: false }) : t && ai.error("Browser doesn't support `document.addEventListener` so PostHog couldn't be initialized");
  })(), e2;
})();
export {
  Ln as Compression,
  Rn as DisplaySurveyType,
  ga as PostHog,
  In as ProductTourEventName,
  On as ProductTourEventProperties,
  $n as SurveyEventName,
  kn as SurveyEventProperties,
  mn as SurveyEventType,
  Tn as SurveySchedule,
  En as SurveyType,
  yl as default,
  yl as posthog
};
