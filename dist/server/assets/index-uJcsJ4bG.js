import { o as object, a as optional, p as pipe, _ as _default, b as parse, c as array, $ as $ZodError, t as transform, d as boolean, e as _lazy, r as record, n as number, s as string, i as int, f as nullable$1, l as literal, g as prettifyError, N as NEVER, u as unknown, h as union, j as _enum, k as any, m as _null, q as _undefined, v as catchall, w as custom, x as date } from "./index-CSpjggkr.js";
import { b as boolean$1 } from "./coerce-C6yuHux9.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), member.set(obj, value), value);
var hasOwn = Object.prototype.hasOwnProperty;
function pathToFunc(pathPattern, options) {
  const paramRE = /\{([a-zA-Z0-9_][a-zA-Z0-9_-]*?)\}/g;
  return function buildURLPath(params = {}) {
    return pathPattern.replace(paramRE, function(_, placeholder) {
      if (!hasOwn.call(params, placeholder)) {
        throw new Error(`Parameter '${placeholder}' is required`);
      }
      const value = params[placeholder];
      if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(
          `Parameter '${placeholder}' must be a string or number`
        );
      }
      return `${value}`;
    }).replace(/^\/+/, "");
  };
}
var ServerList = [
  /**
   * Production server
   */
  "https://api.useautumn.com"
];
function serverURLFromOptions(options) {
  let serverURL = options.serverURL;
  const params = {};
  if (!serverURL) {
    const serverIdx = options.serverIdx ?? 0;
    if (serverIdx < 0 || serverIdx >= ServerList.length) {
      throw new Error(`Invalid server index ${serverIdx}`);
    }
    serverURL = ServerList[serverIdx] || "";
  }
  const u = pathToFunc(serverURL)(params);
  return new URL(u);
}
var SDK_METADATA = {
  userAgent: "speakeasy-sdk/typescript 0.10.17 2.882.0 2.3.0 @useautumn/sdk"
};
var files_exports = {};
__export(files_exports, {
  bytesToBlob: () => bytesToBlob,
  getContentTypeFromFileName: () => getContentTypeFromFileName,
  readableStreamToArrayBuffer: () => readableStreamToArrayBuffer
});
async function readableStreamToArrayBuffer(readable) {
  const reader = readable.getReader();
  const chunks = [];
  let totalLength = 0;
  let done = false;
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    if (doneReading) {
      done = true;
    } else {
      chunks.push(value);
      totalLength += value.length;
    }
  }
  const concatenatedChunks = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    concatenatedChunks.set(chunk, offset);
    offset += chunk.length;
  }
  return concatenatedChunks.buffer;
}
function getContentTypeFromFileName(fileName) {
  if (!fileName) return null;
  const ext = fileName.toLowerCase().split(".").pop();
  if (!ext) return null;
  const mimeTypes = {
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    htm: "text/html",
    txt: "text/plain",
    csv: "text/csv",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    js: "application/javascript",
    css: "text/css",
    zip: "application/zip",
    tar: "application/x-tar",
    gz: "application/gzip",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf"
  };
  return mimeTypes[ext] || null;
}
function bytesToBlob(content, contentType) {
  if (content instanceof Uint8Array) {
    return new Blob([new Uint8Array(content)], { type: contentType });
  }
  return new Blob([content], { type: contentType });
}
var DEFAULT_FETCHER = (input, init) => {
  if (init == null) {
    return fetch(input);
  } else {
    return fetch(input, init);
  }
};
var HTTPClient = class _HTTPClient {
  constructor(options = {}) {
    this.options = options;
    __publicField(this, "fetcher");
    __publicField(this, "requestHooks", []);
    __publicField(this, "requestErrorHooks", []);
    __publicField(this, "responseHooks", []);
    this.fetcher = options.fetcher || DEFAULT_FETCHER;
  }
  async request(request) {
    let req = request;
    for (const hook of this.requestHooks) {
      const nextRequest = await hook(req);
      if (nextRequest) {
        req = nextRequest;
      }
    }
    try {
      const res = await this.fetcher(req);
      for (const hook of this.responseHooks) {
        await hook(res, req);
      }
      return res;
    } catch (err) {
      for (const hook of this.requestErrorHooks) {
        await hook(err, req);
      }
      throw err;
    }
  }
  addHook(...args) {
    if (args[0] === "beforeRequest") {
      this.requestHooks.push(args[1]);
    } else if (args[0] === "requestError") {
      this.requestErrorHooks.push(args[1]);
    } else if (args[0] === "response") {
      this.responseHooks.push(args[1]);
    } else {
      throw new Error(`Invalid hook type: ${args[0]}`);
    }
    return this;
  }
  removeHook(...args) {
    let target;
    if (args[0] === "beforeRequest") {
      target = this.requestHooks;
    } else if (args[0] === "requestError") {
      target = this.requestErrorHooks;
    } else if (args[0] === "response") {
      target = this.responseHooks;
    } else {
      throw new Error(`Invalid hook type: ${args[0]}`);
    }
    const index = target.findIndex((v) => v === args[1]);
    if (index >= 0) {
      target.splice(index, 1);
    }
    return this;
  }
  clone() {
    const child = new _HTTPClient(this.options);
    child.requestHooks = this.requestHooks.slice();
    child.requestErrorHooks = this.requestErrorHooks.slice();
    child.responseHooks = this.responseHooks.slice();
    return child;
  }
};
var mediaParamSeparator = /\s*;\s*/g;
function matchContentType(response, pattern) {
  if (pattern === "*") {
    return true;
  }
  let contentType = response.headers.get("content-type")?.trim() || "application/octet-stream";
  contentType = contentType.toLowerCase();
  const wantParts = pattern.toLowerCase().trim().split(mediaParamSeparator);
  const [wantType = "", ...wantParams] = wantParts;
  if (wantType.split("/").length !== 2) {
    return false;
  }
  const gotParts = contentType.split(mediaParamSeparator);
  const [gotType = "", ...gotParams] = gotParts;
  const [type = "", subtype = ""] = gotType.split("/");
  if (!type || !subtype) {
    return false;
  }
  if (wantType !== "*/*" && gotType !== wantType && `${type}/*` !== wantType && `*/${subtype}` !== wantType) {
    return false;
  }
  if (gotParams.length < wantParams.length) {
    return false;
  }
  const params = new Set(gotParams);
  for (const wantParam of wantParams) {
    if (!params.has(wantParam)) {
      return false;
    }
  }
  return true;
}
var codeRangeRE = new RegExp("^[0-9]xx$", "i");
function matchStatusCode(response, codes) {
  const actual = `${response.status}`;
  const expectedCodes = Array.isArray(codes) ? codes : [codes];
  if (!expectedCodes.length) {
    return false;
  }
  return expectedCodes.some((ec) => {
    const code = `${ec}`;
    if (code === "default") {
      return true;
    }
    if (!codeRangeRE.test(`${code}`)) {
      return code === actual;
    }
    const expectFamily = code.charAt(0);
    if (!expectFamily) {
      throw new Error("Invalid status code range");
    }
    const actualFamily = actual.charAt(0);
    if (!actualFamily) {
      throw new Error(`Invalid response status code: ${actual}`);
    }
    return actualFamily === expectFamily;
  });
}
function matchResponse(response, code, contentTypePattern) {
  return matchStatusCode(response, code) && matchContentType(response, contentTypePattern);
}
function isConnectionError(err) {
  if (typeof err !== "object" || err == null) {
    return false;
  }
  const isBrowserErr = err instanceof TypeError && err.message.toLowerCase().startsWith("failed to fetch");
  const isNodeErr = err instanceof TypeError && err.message.toLowerCase().startsWith("fetch failed");
  const isBunErr = "name" in err && err.name === "ConnectionError";
  const isGenericErr = "code" in err && typeof err.code === "string" && err.code.toLowerCase() === "econnreset";
  return isBrowserErr || isNodeErr || isGenericErr || isBunErr;
}
function isTimeoutError(err) {
  if (typeof err !== "object" || err == null) {
    return false;
  }
  const isNative = "name" in err && err.name === "TimeoutError";
  const isLegacyNative = "code" in err && err.code === 23;
  const isGenericErr = "code" in err && typeof err.code === "string" && err.code.toLowerCase() === "econnaborted";
  return isNative || isLegacyNative || isGenericErr;
}
function isAbortError(err) {
  if (typeof err !== "object" || err == null) {
    return false;
  }
  const isNative = "name" in err && err.name === "AbortError";
  const isLegacyNative = "code" in err && err.code === 20;
  const isGenericErr = "code" in err && typeof err.code === "string" && err.code.toLowerCase() === "econnaborted";
  return isNative || isLegacyNative || isGenericErr;
}
function bytesToBase64(u8arr) {
  return btoa(String.fromCodePoint(...u8arr));
}
function stringToBytes(str) {
  return new TextEncoder().encode(str);
}
function stringToBase64(str) {
  return bytesToBase64(stringToBytes(str));
}
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}
function formEncoder(sep) {
  return (key, value, options) => {
    let out = "";
    const pairs = options?.explode ? explode(key, value) : [[key, value]];
    if (pairs.every(([_, v]) => v == null)) {
      return;
    }
    const encodeString = (v) => {
      return options?.charEncoding === "percent" ? encodeURIComponent(v) : v;
    };
    const encodeValue = (v) => encodeString(serializeValue(v));
    const encodedSep = encodeString(sep);
    pairs.forEach(([pk, pv]) => {
      let tmp = "";
      let encValue = null;
      if (pv == null) {
        return;
      } else if (Array.isArray(pv)) {
        encValue = mapDefined(pv, (v) => `${encodeValue(v)}`)?.join(encodedSep);
      } else if (isPlainObject(pv)) {
        encValue = mapDefinedEntries(Object.entries(pv), ([k, v]) => {
          return `${encodeString(k)}${encodedSep}${encodeValue(v)}`;
        })?.join(encodedSep);
      } else {
        encValue = `${encodeValue(pv)}`;
      }
      if (encValue == null) {
        return;
      }
      tmp = `${encodeString(pk)}=${encValue}`;
      if (!tmp || tmp === "=") {
        return;
      }
      out += `&${tmp}`;
    });
    return out.slice(1);
  };
}
var encodeForm = formEncoder(",");
function encodeJSON(key, value, options) {
  if (typeof value === "undefined") {
    return;
  }
  const encodeString = (v) => {
    return options?.charEncoding === "percent" ? encodeURIComponent(v) : v;
  };
  const encVal = encodeString(JSON.stringify(value, jsonReplacer));
  return options?.explode ? encVal : `${encodeString(key)}=${encVal}`;
}
var encodeSimple = (key, value, options) => {
  let out = "";
  const pairs = options?.explode ? explode(key, value) : [[key, value]];
  if (pairs.every(([_, v]) => v == null)) {
    return;
  }
  const encodeString = (v) => {
    return options?.charEncoding === "percent" ? encodeURIComponent(v) : v;
  };
  const encodeValue = (v) => encodeString(serializeValue(v));
  pairs.forEach(([pk, pv]) => {
    let tmp = "";
    if (pv == null) {
      return;
    } else if (Array.isArray(pv)) {
      tmp = mapDefined(pv, (v) => `${encodeValue(v)}`)?.join(",");
    } else if (isPlainObject(pv)) {
      const mapped = mapDefinedEntries(Object.entries(pv), ([k, v]) => {
        return `,${encodeString(k)},${encodeValue(v)}`;
      });
      tmp = mapped?.join("").slice(1);
    } else {
      const k = options?.explode && isPlainObject(value) ? `${pk}=` : "";
      tmp = `${k}${encodeValue(pv)}`;
    }
    out += tmp ? `,${tmp}` : "";
  });
  return out.slice(1);
};
function explode(key, value) {
  if (Array.isArray(value)) {
    return value.map((v) => [key, v]);
  } else if (isPlainObject(value)) {
    const o = value ?? {};
    return Object.entries(o).map(([k, v]) => [k, v]);
  } else {
    return [[key, value]];
  }
}
function serializeValue(value) {
  if (value == null) {
    return "";
  } else if (value instanceof Date) {
    return value.toISOString();
  } else if (value instanceof Uint8Array) {
    return bytesToBase64(value);
  } else if (typeof value === "object") {
    return JSON.stringify(value, jsonReplacer);
  }
  return `${value}`;
}
function jsonReplacer(_, value) {
  if (value instanceof Uint8Array) {
    return bytesToBase64(value);
  } else {
    return value;
  }
}
function mapDefined(inp, mapper) {
  const res = inp.reduce((acc, v) => {
    if (v == null) {
      return acc;
    }
    const m = mapper(v);
    if (m == null) {
      return acc;
    }
    acc.push(m);
    return acc;
  }, []);
  return res.length ? res : null;
}
function mapDefinedEntries(inp, mapper) {
  const acc = [];
  for (const [k, v] of inp) {
    if (v == null) {
      continue;
    }
    const m = mapper([k, v]);
    if (m == null) {
      continue;
    }
    acc.push(m);
  }
  return acc.length ? acc : null;
}
var AutumnError = class extends Error {
  constructor(message, httpMeta) {
    super(message);
    __publicField(this, "statusCode");
    __publicField(this, "body");
    __publicField(this, "headers");
    __publicField(this, "contentType");
    __publicField(this, "rawResponse");
    this.statusCode = httpMeta.response.status;
    this.body = httpMeta.body;
    this.headers = httpMeta.response.headers;
    this.contentType = httpMeta.response.headers.get("content-type") || "";
    this.rawResponse = httpMeta.response;
    this.name = "AutumnError";
  }
};
var AutumnDefaultError = class extends AutumnError {
  constructor(message, httpMeta) {
    if (message) {
      message += `: `;
    }
    message += `Status ${httpMeta.response.status}`;
    const contentType = httpMeta.response.headers.get("content-type") || `""`;
    if (contentType !== "application/json") {
      message += ` Content-Type ${contentType.includes(" ") ? `"${contentType}"` : contentType}`;
    }
    const body = httpMeta.body || `""`;
    message += body.length > 100 ? "\n" : ". ";
    let bodyDisplay = body;
    if (body.length > 1e4) {
      const truncated = body.substring(0, 1e4);
      const remaining = body.length - 1e4;
      bodyDisplay = `${truncated}...and ${remaining} more chars`;
    }
    message += `Body: ${bodyDisplay}`;
    message = message.trim();
    super(message, httpMeta);
    this.name = "AutumnDefaultError";
  }
};
var SDKValidationError = class extends Error {
  constructor(message, cause, rawValue) {
    super(`${message}: ${cause}`);
    __publicField(this, "rawValue");
    __publicField(this, "rawMessage");
    this.name = "SDKValidationError";
    this.cause = cause;
    this.rawValue = rawValue;
    this.rawMessage = message;
  }
  // Allows for backwards compatibility for `instanceof` checks of `ResponseValidationError`
  static [Symbol.hasInstance](instance) {
    if (!(instance instanceof Error)) return false;
    if (!("rawValue" in instance)) return false;
    if (!("rawMessage" in instance)) return false;
    if (!("pretty" in instance)) return false;
    if (typeof instance.pretty !== "function") return false;
    return true;
  }
  /**
   * Return a pretty-formatted error message if the underlying validation error
   * is a ZodError or some other recognized error type, otherwise return the
   * default error message.
   */
  pretty() {
    if (this.cause instanceof $ZodError) {
      return `${this.rawMessage}
${formatZodError(this.cause)}`;
    } else {
      return this.toString();
    }
  }
};
function formatZodError(err) {
  return prettifyError(err);
}
var ResponseValidationError = class extends AutumnError {
  constructor(message, extra) {
    super(message, extra);
    __publicField(this, "rawValue");
    __publicField(this, "rawMessage");
    this.name = "ResponseValidationError";
    this.cause = extra.cause;
    this.rawValue = extra.rawValue;
    this.rawMessage = extra.rawMessage;
  }
  /**
   * Return a pretty-formatted error message if the underlying validation error
   * is a ZodError or some other recognized error type, otherwise return the
   * default error message.
   */
  pretty() {
    if (this.cause instanceof $ZodError) {
      return `${this.rawMessage}
${formatZodError(this.cause)}`;
    } else {
      return this.toString();
    }
  }
};
function OK(value) {
  return { ok: true, value };
}
function ERR(error) {
  return { ok: false, error };
}
async function unwrapAsync(pr) {
  const r = await pr;
  if (!r.ok) {
    throw r.error;
  }
  return r.value;
}
var DEFAULT_CONTENT_TYPES = {
  jsonl: "application/jsonl",
  json: "application/json",
  text: "text/plain",
  bytes: "application/octet-stream",
  stream: "application/octet-stream",
  sse: "text/event-stream",
  nil: "*",
  fail: "*"
};
function json(codes, schema, options) {
  return { ...options, enc: "json", codes, schema };
}
function fail(codes) {
  return { enc: "fail", codes };
}
function match(...matchers) {
  return async function matchFunc(response, request, options) {
    let raw;
    let matcher;
    for (const match2 of matchers) {
      const { codes } = match2;
      const ctpattern = "ctype" in match2 ? match2.ctype : DEFAULT_CONTENT_TYPES[match2.enc];
      if (ctpattern && matchResponse(response, codes, ctpattern)) {
        matcher = match2;
        break;
      } else if (!ctpattern && matchStatusCode(response, codes)) {
        matcher = match2;
        break;
      }
    }
    if (!matcher) {
      return [{
        ok: false,
        error: new AutumnDefaultError("Unexpected Status or Content-Type", {
          response,
          request,
          body: await response.text().catch(() => "")
        })
      }, raw];
    }
    const encoding = matcher.enc;
    let body = "";
    switch (encoding) {
      case "json":
        body = await response.text();
        raw = JSON.parse(body);
        break;
      case "jsonl":
        raw = response.body;
        break;
      case "bytes":
        raw = new Uint8Array(await response.arrayBuffer());
        break;
      case "stream":
        raw = response.body;
        break;
      case "text":
        body = await response.text();
        raw = body;
        break;
      case "sse":
        raw = response.body;
        break;
      case "nil":
        body = await response.text();
        raw = void 0;
        break;
      case "fail":
        body = await response.text();
        raw = body;
        break;
      default:
        throw new Error(
          `Unsupported response type: ${encoding}`
        );
    }
    if (matcher.enc === "fail") {
      return [{
        ok: false,
        error: new AutumnDefaultError("API error occurred", {
          request,
          response,
          body
        })
      }, raw];
    }
    const resultKey = matcher.key || options?.resultKey;
    let data;
    if ("err" in matcher) {
      data = {
        ...options?.extraFields,
        ...matcher.hdrs ? { Headers: unpackHeaders(response.headers) } : null,
        ...isPlainObject(raw) ? raw : null,
        request$: request,
        response$: response,
        body$: body
      };
    } else if (resultKey) {
      data = {
        ...options?.extraFields,
        ...matcher.hdrs ? { Headers: unpackHeaders(response.headers) } : null,
        [resultKey]: raw
      };
    } else if (matcher.hdrs) {
      data = {
        ...options?.extraFields,
        ...matcher.hdrs ? { Headers: unpackHeaders(response.headers) } : null,
        ...isPlainObject(raw) ? raw : null
      };
    } else {
      data = raw;
    }
    if ("err" in matcher) {
      const result = safeParseResponse(
        data,
        (v) => matcher.schema.parse(v),
        "Response validation failed",
        { request, response, body }
      );
      return [result.ok ? { ok: false, error: result.value } : result, raw];
    } else {
      return [
        safeParseResponse(
          data,
          (v) => matcher.schema.parse(v),
          "Response validation failed",
          { request, response, body }
        ),
        raw
      ];
    }
  };
}
var headerValRE = /, */;
function unpackHeaders(headers) {
  const out = {};
  for (const [k, v] of headers.entries()) {
    out[k] = v.split(headerValRE);
  }
  return out;
}
function safeParseResponse(rawValue, fn, errorMessage, httpMeta) {
  try {
    return OK(fn(rawValue));
  } catch (err) {
    return ERR(
      new ResponseValidationError(errorMessage, {
        cause: err,
        rawValue,
        rawMessage: errorMessage,
        ...httpMeta
      })
    );
  }
}
function remap(inp, mappings) {
  let out = {};
  if (!Object.keys(mappings).length) {
    out = inp;
    return out;
  }
  for (const [k, v] of Object.entries(inp)) {
    const j = mappings[k];
    if (j === null) {
      continue;
    }
    out[j ?? k] = v;
  }
  return out;
}
function compactMap(values) {
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    if (typeof v !== "undefined") {
      out[k] = v;
    }
  }
  return out;
}
function safeParse(rawValue, fn, errorMessage) {
  try {
    return OK(fn(rawValue));
  } catch (err) {
    return ERR(new SDKValidationError(errorMessage, err, rawValue));
  }
}
function dlv(obj, key, def, p, undef) {
  key = Array.isArray(key) ? key : key.split(".");
  for (p = 0; p < key.length; p++) {
    const k = key[p];
    obj = k != null && obj ? obj[k] : undef;
  }
  return obj === undef ? def : obj;
}
var envSchema = object({
  AUTUMN_SECRET_KEY: optional(string()),
  AUTUMN_X_API_VERSION: _default(string(), "2.3.0"),
  AUTUMN_FAIL_OPEN: pipe(
    _default(_enum(["true", "false"]), "true"),
    transform((v) => v === "true")
  ),
  AUTUMN_DEBUG: optional(boolean$1())
});
function isDeno() {
  if ("Deno" in globalThis) {
    return true;
  }
  return false;
}
var envMemo = void 0;
function env() {
  if (envMemo) {
    return envMemo;
  }
  let envObject = {};
  if (isDeno()) {
    envObject = globalThis.Deno?.env?.toObject?.() ?? {};
  } else {
    envObject = dlv(globalThis, "process.env") ?? {};
  }
  envMemo = envSchema.parse(envObject);
  return envMemo;
}
function fillGlobals(options) {
  const clone = { ...options };
  const envVars = env();
  if (typeof envVars.AUTUMN_X_API_VERSION !== "undefined") {
    clone.xApiVersion ?? (clone.xApiVersion = envVars.AUTUMN_X_API_VERSION);
  }
  if (typeof envVars.AUTUMN_FAIL_OPEN !== "undefined") {
    clone.failOpen ?? (clone.failOpen = envVars.AUTUMN_FAIL_OPEN);
  }
  return clone;
}
var SecurityError = class _SecurityError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "SecurityError";
  }
  static incomplete() {
    return new _SecurityError(
      "incomplete",
      "Security requirements not met in order to perform the operation"
    );
  }
  static unrecognizedType(type) {
    return new _SecurityError(
      "unrecognized_security_type",
      `Unrecognised security type: ${type}`
    );
  }
};
function resolveSecurity(...options) {
  const state = {
    basic: {},
    headers: {},
    queryParams: {},
    cookies: {},
    oauth2: { type: "none" }
  };
  const option = options.find((opts) => {
    return opts.every((o) => {
      if (o.value == null) {
        return false;
      } else if (o.type === "http:basic") {
        return o.value.username != null || o.value.password != null;
      } else if (o.type === "http:custom") {
        return null;
      } else if (o.type === "oauth2:password") {
        return typeof o.value === "string" && !!o.value;
      } else if (o.type === "oauth2:client_credentials") {
        if (typeof o.value == "string") {
          return !!o.value;
        }
        return o.value.clientID != null || o.value.clientSecret != null;
      } else if (typeof o.value === "string") {
        return !!o.value;
      } else {
        throw new Error(
          `Unrecognized security type: ${o.type} (value type: ${typeof o.value})`
        );
      }
    });
  });
  if (option == null) {
    return null;
  }
  option.forEach((spec) => {
    if (spec.value == null) {
      return;
    }
    const { type } = spec;
    switch (type) {
      case "apiKey:header":
        state.headers[spec.fieldName] = spec.value;
        break;
      case "apiKey:query":
        state.queryParams[spec.fieldName] = spec.value;
        break;
      case "apiKey:cookie":
        state.cookies[spec.fieldName] = spec.value;
        break;
      case "http:basic":
        applyBasic(state, spec);
        break;
      case "http:custom":
        break;
      case "http:bearer":
        applyBearer(state, spec);
        break;
      case "oauth2":
        applyBearer(state, spec);
        break;
      case "oauth2:password":
        applyBearer(state, spec);
        break;
      case "oauth2:client_credentials":
        break;
      case "openIdConnect":
        applyBearer(state, spec);
        break;
      default:
        throw SecurityError.unrecognizedType(type);
    }
  });
  return state;
}
function applyBasic(state, spec) {
  if (spec.value == null) {
    return;
  }
  state.basic = spec.value;
}
function applyBearer(state, spec) {
  if (typeof spec.value !== "string" || !spec.value) {
    return;
  }
  let value = spec.value;
  if (value.slice(0, 7).toLowerCase() !== "bearer ") {
    value = `Bearer ${value}`;
  }
  if (spec.fieldName !== void 0) {
    state.headers[spec.fieldName] = value;
  }
}
function resolveGlobalSecurity(security, allowedFields) {
  let inputs = [
    [
      {
        fieldName: "Authorization",
        type: "http:bearer",
        value: security?.secretKey ?? env().AUTUMN_SECRET_KEY
      }
    ]
  ];
  return resolveSecurity(...inputs);
}
async function extractSecurity(sec) {
  if (sec == null) {
    return;
  }
  return typeof sec === "function" ? sec() : sec;
}
function unrecognized(value) {
  globalCount++;
  return value;
}
var globalCount = 0;
var refCount = 0;
function startCountingUnrecognized() {
  refCount++;
  const start = globalCount;
  return {
    /**
     * Ends counting and returns the delta.
     * @param delta - If provided, only this amount is added to the parent counter
     *   (used for nested unions where we only want to record the winning option's count).
     *   If not provided, records all counts since start().
     */
    end: (delta) => {
      const count = globalCount - start;
      globalCount = start + (delta ?? count);
      if (--refCount === 0) globalCount = 0;
      return count;
    }
  };
}
var globalCount2 = 0;
var refCount2 = 0;
function defaultToZeroValue(value) {
  globalCount2++;
  return unrecognized(value);
}
function startCountingDefaultToZeroValue() {
  refCount2++;
  const start = globalCount2;
  return {
    /**
     * Ends counting and returns the delta.
     * @param delta - If provided, only this amount is added to the parent counter
     *   (used for nested unions where we only want to record the winning option's count).
     *   If not provided, records all counts since start().
     */
    end: (delta) => {
      const count = globalCount2 - start;
      globalCount2 = start + (delta ?? count);
      if (--refCount2 === 0) globalCount2 = 0;
      return count;
    }
  };
}
function string4() {
  return union([
    string(),
    // Null or undefined -> ""
    zodDefaultToZeroValue(""),
    // Any other value -> String(x)
    pipe(any(), transform((x) => unrecognized(JSON.stringify(x))))
  ]);
}
function boolean2() {
  return union([
    boolean(),
    // String "true" (case insensitive) -> true, "false" -> false
    pipe(
      string(),
      transform((x, ctx) => {
        const lower = x.toLowerCase();
        if (lower === "true") return unrecognized(true);
        if (lower === "false") return unrecognized(false);
        ctx.issues.push({
          input: x,
          code: "invalid_type",
          expected: "boolean",
          received: "string"
        });
        return NEVER;
      })
    ),
    zodDefaultToZeroValue(false)
  ]);
}
function number2() {
  return union([
    number(),
    // String -> Number
    pipe(
      string(),
      transform((x, ctx) => {
        const num = Number(x);
        if (isNaN(num)) {
          ctx.issues.push({
            input: x,
            code: "invalid_type",
            expected: "number",
            received: "string"
          });
          return NEVER;
        }
        return unrecognized(num);
      })
    ),
    // Null or undefined -> 0
    zodDefaultToZeroValue(0)
  ]);
}
function bigint() {
  return union([
    pipe(
      string(),
      transform((x, ctx) => {
        try {
          return BigInt(x);
        } catch (error) {
          ctx.issues.push({
            input: x,
            code: "invalid_type",
            expected: "bigint",
            received: "string"
          });
          return NEVER;
        }
      })
    ),
    zodDefaultToZeroValue(0n)
  ]);
}
function date2() {
  return union([
    pipe(
      pipe(
        union([string(), zodDefaultToZeroValue(0)]),
        transform((x) => new Date(x))
      ),
      date()
    ),
    pipe(
      number(),
      transform((x, ctx) => {
        const date3 = new Date(x);
        if (isNaN(date3.getTime())) {
          ctx.issues.push({
            input: x,
            code: "invalid_type",
            expected: "date",
            received: "number"
          });
          return NEVER;
        }
        return unrecognized(date3);
      })
    )
  ]);
}
function literal2(value) {
  return union([literal(value), zodDefaultToZeroValue(value)]);
}
function literalBigInt(value) {
  return pipe(literal(String(value)), transform((x) => BigInt(x)));
}
function optional3(t) {
  return optional(union([
    // Null -> undefined
    pipe(_null(), transform(() => unrecognized(void 0))),
    t
  ]));
}
function nullable(t) {
  return union([
    _null(),
    // Undefined -> null
    pipe(_undefined(), transform(() => defaultToZeroValue(null))),
    t
  ]);
}
function zodDefaultToZeroValue(value) {
  return pipe(
    any(),
    transform((input, ctx) => {
      if (input === void 0) return defaultToZeroValue(value);
      if (input === null) return defaultToZeroValue(value);
      ctx.issues.push({
        input,
        code: "invalid_type",
        expected: "undefined",
        received: "unknown"
      });
      return NEVER;
    })
  );
}
var dateRE = /^\d{4}-\d{2}-\d{2}$/;
var RFCDate = class _RFCDate {
  /**
   * Creates a new RFCDate instance using the provided input.
   * If a string is used then in must be in the format YYYY-MM-DD.
   *
   * @param date A Date object or a date string in YYYY-MM-DD format
   * @example
   * new RFCDate("2022-01-01")
   * @example
   * new RFCDate(new Date())
   */
  constructor(date3) {
    __publicField(this, "serialized");
    if (typeof date3 === "string" && !dateRE.test(date3)) {
      throw new RangeError(
        "RFCDate: date strings must be in the format YYYY-MM-DD: " + date3
      );
    }
    const value = new Date(date3);
    if (isNaN(+value)) {
      throw new RangeError("RFCDate: invalid date provided: " + date3);
    }
    this.serialized = value.toISOString().slice(0, "YYYY-MM-DD".length);
    if (!dateRE.test(this.serialized)) {
      throw new TypeError(
        `RFCDate: failed to build valid date with given value: ${date3} serialized to ${this.serialized}`
      );
    }
  }
  /**
   * Creates a new RFCDate instance using today's date.
   */
  static today() {
    return new _RFCDate(/* @__PURE__ */ new Date());
  }
  toJSON() {
    return this.toString();
  }
  toString() {
    return this.serialized;
  }
};
function smartUnion(options) {
  return pipe(
    unknown(),
    transform((input, ctx) => {
      const candidates = [];
      const errors = options.map(() => []);
      const parentUnrecognizedCtr = startCountingUnrecognized();
      const parentZeroDefaultCtr = startCountingDefaultToZeroValue();
      for (const [i, option] of options.entries()) {
        const unrecognizedCtr = startCountingUnrecognized();
        const zeroDefaultCtr = startCountingDefaultToZeroValue();
        const result = option.safeParse(input);
        const inexactCount = unrecognizedCtr.end();
        const zeroDefaultCount = zeroDefaultCtr.end();
        if (result.success) {
          candidates.push({
            data: result.data,
            inexactCount,
            zeroDefaultCount,
            fieldCount: -1
            // We'll count this later if needed
          });
          continue;
        }
        errors[i].push(...result.error.issues);
      }
      if (candidates.length === 0) {
        parentUnrecognizedCtr.end(0);
        parentZeroDefaultCtr.end(0);
        ctx.issues.push({
          input,
          code: "invalid_union",
          errors
        });
        return NEVER;
      }
      let best = candidates[0];
      for (const candidate of candidates) {
        if (candidates.length > 1) {
          candidate.fieldCount = countFieldsRecursive(candidate.data);
        }
        best = better(candidate, best);
      }
      parentUnrecognizedCtr.end(best.inexactCount);
      parentZeroDefaultCtr.end(best.zeroDefaultCount);
      return best.data;
    })
  );
}
function better(a, b) {
  const aIsExact = a.inexactCount === 0;
  const bIsExact = b.inexactCount === 0;
  if (aIsExact !== bIsExact) {
    return aIsExact ? a : b;
  }
  const actualFieldCountA = a.fieldCount - a.zeroDefaultCount;
  const actualFieldCountB = b.fieldCount - b.zeroDefaultCount;
  if (actualFieldCountA !== actualFieldCountB) {
    return actualFieldCountA > actualFieldCountB ? a : b;
  }
  return a.inexactCount < b.inexactCount ? a : b;
}
function countFieldsRecursive(parsed) {
  let fieldCount = 0;
  const queue = [parsed];
  let index = 0;
  while (index < queue.length) {
    const value = queue[index++];
    if (value === void 0) {
      continue;
    }
    const type = typeof value;
    if (value === null || type === "number" || type === "string" || type === "boolean" || type === "bigint" || value instanceof Date || value instanceof RFCDate) {
      fieldCount++;
      continue;
    }
    if (Array.isArray(value)) {
      queue.push(...value);
      continue;
    }
    if (type === "object") {
      queue.push(...Object.values(value));
    }
  }
  return fieldCount;
}
var Range = {
  TwentyFourh: "24h",
  Sevend: "7d",
  Thirtyd: "30d",
  Ninetyd: "90d",
  LastCycle: "last_cycle",
  Onebc: "1bc",
  Threebc: "3bc"
};
var BinSize = {
  Day: "day",
  Hour: "hour",
  Week: "week",
  Month: "month"
};
var Range$outboundSchema = _enum(Range);
var BinSize$outboundSchema = _enum(
  BinSize
);
var AggregateEventsCustomRange$outboundSchema = object({
  start: number(),
  end: number()
});
var EventsAggregateParams$outboundSchema = pipe(
  object({
    customerId: optional(string()),
    entityId: optional(string()),
    featureId: smartUnion([string(), array(string())]),
    groupBy: optional(string()),
    range: optional(Range$outboundSchema),
    binSize: _default(BinSize$outboundSchema, "day"),
    customRange: optional(
      _lazy(() => AggregateEventsCustomRange$outboundSchema)
    ),
    filterBy: optional(record(string(), string())),
    maxGroups: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      featureId: "feature_id",
      groupBy: "group_by",
      binSize: "bin_size",
      customRange: "custom_range",
      filterBy: "filter_by",
      maxGroups: "max_groups"
    });
  })
);
var AggregateEventsList$inboundSchema = pipe(
  object({
    period: number2(),
    values: record(string(), number2()),
    grouped_values: optional3(
      record(string(), record(string(), number2()))
    )
  }),
  transform((v) => {
    return remap(v, {
      "grouped_values": "groupedValues"
    });
  })
);
var Total$inboundSchema = object({
  count: number2(),
  sum: number2()
});
var AggregateEventsResponse$inboundSchema = object({
  list: array(_lazy(() => AggregateEventsList$inboundSchema)),
  total: record(string(), _lazy(() => Total$inboundSchema))
});
function inboundSchema(enumObj) {
  const options = Object.values(enumObj);
  return union([
    ...options.map((x) => literal(x)),
    pipe(string(), transform((x) => unrecognized(x)))
  ]);
}
var AttachPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var AttachItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var AttachItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var AttachItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var AttachItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var AttachItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var AttachItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var AttachItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var AttachAddItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var AttachAddItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var AttachAddItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var AttachAddItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var AttachAddItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var AttachAddItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var AttachAddItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var AttachRemoveItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var AttachIntervalRemoveItemEnum2 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var AttachIntervalRemoveItemEnum1 = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var AttachDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var AttachOnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var AttachPurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var AttachLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var AttachUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var AttachThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var AttachProrationBehavior = {
  ProrateImmediately: "prorate_immediately",
  None: "none"
};
var AttachRedirectMode = {
  Always: "always",
  IfRequired: "if_required",
  Never: "never"
};
var AttachPlanSchedule = {
  Immediate: "immediate",
  EndOfCycle: "end_of_cycle"
};
var AttachCode = {
  ThreedsRequired: "3ds_required",
  PaymentMethodRequired: "payment_method_required",
  PaymentFailed: "payment_failed"
};
var AttachFeatureQuantity$outboundSchema = pipe(
  object({
    featureId: string(),
    quantity: optional(number()),
    adjustable: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var AttachPriceInterval$outboundSchema = _enum(AttachPriceInterval);
var AttachBasePrice$outboundSchema = pipe(
  object({
    amount: number(),
    interval: AttachPriceInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var AttachItemResetInterval$outboundSchema = _enum(AttachItemResetInterval);
var AttachItemReset$outboundSchema = pipe(
  object({
    interval: AttachItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var AttachItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var AttachItemTierBehavior$outboundSchema = _enum(AttachItemTierBehavior);
var AttachItemPriceInterval$outboundSchema = _enum(AttachItemPriceInterval);
var AttachItemBillingMethod$outboundSchema = _enum(AttachItemBillingMethod);
var AttachItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(array(_lazy(() => AttachItemTier$outboundSchema))),
    tierBehavior: optional(AttachItemTierBehavior$outboundSchema),
    interval: AttachItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: AttachItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var AttachItemOnIncrease$outboundSchema = _enum(AttachItemOnIncrease);
var AttachItemOnDecrease$outboundSchema = _enum(AttachItemOnDecrease);
var AttachItemProration$outboundSchema = pipe(
  object({
    onIncrease: AttachItemOnIncrease$outboundSchema,
    onDecrease: AttachItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var AttachItemExpiryDurationType$outboundSchema = _enum(AttachItemExpiryDurationType);
var AttachItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: AttachItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var AttachItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => AttachItemReset$outboundSchema)),
    price: optional(_lazy(() => AttachItemPrice$outboundSchema)),
    proration: optional(_lazy(() => AttachItemProration$outboundSchema)),
    rollover: optional(_lazy(() => AttachItemRollover$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var AttachAddItemResetInterval$outboundSchema = _enum(AttachAddItemResetInterval);
var AttachAddItemReset$outboundSchema = pipe(
  object({
    interval: AttachAddItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var AttachAddItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var AttachAddItemTierBehavior$outboundSchema = _enum(AttachAddItemTierBehavior);
var AttachAddItemPriceInterval$outboundSchema = _enum(AttachAddItemPriceInterval);
var AttachAddItemBillingMethod$outboundSchema = _enum(AttachAddItemBillingMethod);
var AttachAddItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(array(_lazy(() => AttachAddItemTier$outboundSchema))),
    tierBehavior: optional(AttachAddItemTierBehavior$outboundSchema),
    interval: AttachAddItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: AttachAddItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var AttachAddItemOnIncrease$outboundSchema = _enum(AttachAddItemOnIncrease);
var AttachAddItemOnDecrease$outboundSchema = _enum(AttachAddItemOnDecrease);
var AttachAddItemProration$outboundSchema = pipe(
  object({
    onIncrease: AttachAddItemOnIncrease$outboundSchema,
    onDecrease: AttachAddItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var AttachAddItemExpiryDurationType$outboundSchema = _enum(AttachAddItemExpiryDurationType);
var AttachAddItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: AttachAddItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var AttachAddItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => AttachAddItemReset$outboundSchema)),
    price: optional(_lazy(() => AttachAddItemPrice$outboundSchema)),
    proration: optional(_lazy(() => AttachAddItemProration$outboundSchema)),
    rollover: optional(_lazy(() => AttachAddItemRollover$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var AttachRemoveItemBillingMethod$outboundSchema = _enum(AttachRemoveItemBillingMethod);
var AttachIntervalRemoveItemEnum2$outboundSchema = _enum(AttachIntervalRemoveItemEnum2);
var AttachIntervalRemoveItemEnum1$outboundSchema = _enum(AttachIntervalRemoveItemEnum1);
var AttachPlanItemFilter$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    billingMethod: optional(AttachRemoveItemBillingMethod$outboundSchema),
    interval: optional(
      smartUnion([
        AttachIntervalRemoveItemEnum1$outboundSchema,
        AttachIntervalRemoveItemEnum2$outboundSchema
      ])
    ),
    intervalCount: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      billingMethod: "billing_method",
      intervalCount: "interval_count"
    });
  })
);
var AttachDurationType$outboundSchema = _enum(AttachDurationType);
var AttachOnEnd$outboundSchema = _enum(AttachOnEnd);
var AttachFreeTrialParams$outboundSchema = pipe(
  object({
    durationLength: number(),
    durationType: _default(AttachDurationType$outboundSchema, "month"),
    cardRequired: _default(boolean(), true),
    onEnd: optional(AttachOnEnd$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      durationLength: "duration_length",
      durationType: "duration_type",
      cardRequired: "card_required",
      onEnd: "on_end"
    });
  })
);
var AttachPurchaseLimitInterval$outboundSchema = _enum(AttachPurchaseLimitInterval);
var AttachPurchaseLimit$outboundSchema = pipe(
  object({
    interval: AttachPurchaseLimitInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var AttachAutoTopup$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(_lazy(() => AttachPurchaseLimit$outboundSchema)),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var AttachLimitType$outboundSchema = _enum(AttachLimitType);
var AttachSpendLimit$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(AttachLimitType$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var AttachUsageLimitInterval$outboundSchema = _enum(AttachUsageLimitInterval);
var AttachUsageLimit$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: AttachUsageLimitInterval$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var AttachThresholdType$outboundSchema = _enum(AttachThresholdType);
var AttachUsageAlert$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: AttachThresholdType$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var AttachOverageAllowed$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var AttachBillingControls$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => AttachAutoTopup$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => AttachSpendLimit$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => AttachUsageLimit$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => AttachUsageAlert$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => AttachOverageAllowed$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var AttachCustomize$outboundSchema = pipe(
  object({
    price: optional(nullable$1(_lazy(() => AttachBasePrice$outboundSchema))),
    items: optional(array(_lazy(() => AttachItemPlanItem$outboundSchema))),
    addItems: optional(
      array(_lazy(() => AttachAddItemPlanItem$outboundSchema))
    ),
    removeItems: optional(
      array(_lazy(() => AttachPlanItemFilter$outboundSchema))
    ),
    freeTrial: optional(
      nullable$1(_lazy(() => AttachFreeTrialParams$outboundSchema))
    ),
    billingControls: optional(
      _lazy(() => AttachBillingControls$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      addItems: "add_items",
      removeItems: "remove_items",
      freeTrial: "free_trial",
      billingControls: "billing_controls"
    });
  })
);
var AttachInvoiceMode$outboundSchema = pipe(
  object({
    enabled: boolean(),
    enablePlanImmediately: _default(boolean(), false),
    finalize: _default(boolean(), true),
    invoiceTemplateId: optional(string()),
    netTermsDays: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      enablePlanImmediately: "enable_plan_immediately",
      invoiceTemplateId: "invoice_template_id",
      netTermsDays: "net_terms_days"
    });
  })
);
var AttachProrationBehavior$outboundSchema = _enum(AttachProrationBehavior);
var AttachRedirectMode$outboundSchema = _enum(AttachRedirectMode);
var AttachAttachDiscount$outboundSchema = pipe(
  object({
    rewardId: optional(string()),
    promotionCode: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      rewardId: "reward_id",
      promotionCode: "promotion_code"
    });
  })
);
var AttachPlanSchedule$outboundSchema = _enum(AttachPlanSchedule);
var AttachCustomLineItem$outboundSchema = object({
  amount: number(),
  description: string()
});
var AttachCarryOverBalances$outboundSchema = pipe(
  object({
    enabled: boolean(),
    featureIds: optional(array(string()))
  }),
  transform((v) => {
    return remap(v, {
      featureIds: "feature_ids"
    });
  })
);
var AttachCarryOverUsages$outboundSchema = pipe(
  object({
    enabled: boolean(),
    featureIds: optional(array(string()))
  }),
  transform((v) => {
    return remap(v, {
      featureIds: "feature_ids"
    });
  })
);
var AttachParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    planId: string(),
    featureQuantities: optional(
      array(_lazy(() => AttachFeatureQuantity$outboundSchema))
    ),
    version: optional(number()),
    customize: optional(_lazy(() => AttachCustomize$outboundSchema)),
    invoiceMode: optional(_lazy(() => AttachInvoiceMode$outboundSchema)),
    prorationBehavior: optional(AttachProrationBehavior$outboundSchema),
    redirectMode: _default(AttachRedirectMode$outboundSchema, "if_required"),
    subscriptionId: optional(string()),
    discounts: optional(
      array(_lazy(() => AttachAttachDiscount$outboundSchema))
    ),
    successUrl: optional(string()),
    newBillingSubscription: optional(boolean()),
    billingCycleAnchor: optional(literal("now")),
    planSchedule: optional(AttachPlanSchedule$outboundSchema),
    startsAt: optional(int()),
    endsAt: optional(int()),
    checkoutSessionParams: optional(record(string(), any())),
    longLivedCheckout: optional(boolean()),
    customLineItems: optional(
      array(_lazy(() => AttachCustomLineItem$outboundSchema))
    ),
    processorSubscriptionId: optional(string()),
    carryOverBalances: optional(
      _lazy(() => AttachCarryOverBalances$outboundSchema)
    ),
    carryOverUsages: optional(
      _lazy(() => AttachCarryOverUsages$outboundSchema)
    ),
    metadata: optional(record(string(), string())),
    noBillingChanges: optional(boolean()),
    enablePlanImmediately: optional(boolean()),
    taxRateId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      planId: "plan_id",
      featureQuantities: "feature_quantities",
      invoiceMode: "invoice_mode",
      prorationBehavior: "proration_behavior",
      redirectMode: "redirect_mode",
      subscriptionId: "subscription_id",
      successUrl: "success_url",
      newBillingSubscription: "new_billing_subscription",
      billingCycleAnchor: "billing_cycle_anchor",
      planSchedule: "plan_schedule",
      startsAt: "starts_at",
      endsAt: "ends_at",
      checkoutSessionParams: "checkout_session_params",
      longLivedCheckout: "long_lived_checkout",
      customLineItems: "custom_line_items",
      processorSubscriptionId: "processor_subscription_id",
      carryOverBalances: "carry_over_balances",
      carryOverUsages: "carry_over_usages",
      noBillingChanges: "no_billing_changes",
      enablePlanImmediately: "enable_plan_immediately",
      taxRateId: "tax_rate_id"
    });
  })
);
var AttachInvoice$inboundSchema = pipe(
  object({
    status: nullable(string4()),
    stripe_id: string4(),
    total: number2(),
    currency: string4(),
    hosted_invoice_url: nullable(string4())
  }),
  transform((v) => {
    return remap(v, {
      "stripe_id": "stripeId",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var AttachCode$inboundSchema = inboundSchema(AttachCode);
var AttachRequiredAction$inboundSchema = object({
  code: AttachCode$inboundSchema,
  reason: string4()
});
var AttachResponse$inboundSchema = pipe(
  object({
    customer_id: string4(),
    entity_id: optional3(string4()),
    invoice: optional3(_lazy(() => AttachInvoice$inboundSchema)),
    payment_url: nullable(string4()),
    required_action: optional3(
      _lazy(() => AttachRequiredAction$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "payment_url": "paymentUrl",
      "required_action": "requiredAction"
    });
  })
);
var BalanceType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var BalanceIntervalEnum = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var BalanceTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var BalanceBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var BalanceType$inboundSchema = inboundSchema(BalanceType);
var BalanceCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var BalanceModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var BalanceProviderMarkups$inboundSchema = object({
  markup: number2()
});
var BalanceDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var BalanceFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: BalanceType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => BalanceCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => BalanceModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => BalanceProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => BalanceDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var BalanceIntervalEnum$inboundSchema = inboundSchema(BalanceIntervalEnum);
var BalanceReset$inboundSchema = pipe(
  object({
    interval: smartUnion([BalanceIntervalEnum$inboundSchema, string4()]),
    interval_count: optional3(number2()),
    resets_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "resets_at": "resetsAt"
    });
  })
);
var BalanceTier$inboundSchema = pipe(
  object({
    to: smartUnion([number2(), string4()]),
    amount: number2(),
    flat_amount: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "flat_amount": "flatAmount"
    });
  })
);
var BalanceTierBehavior$inboundSchema = inboundSchema(BalanceTierBehavior);
var BalanceBillingMethod$inboundSchema = inboundSchema(BalanceBillingMethod);
var BalancePrice$inboundSchema = pipe(
  object({
    amount: optional3(number2()),
    tiers: optional3(array(_lazy(() => BalanceTier$inboundSchema))),
    tier_behavior: optional3(BalanceTierBehavior$inboundSchema),
    billing_units: number2(),
    billing_method: BalanceBillingMethod$inboundSchema,
    max_purchase: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "tier_behavior": "tierBehavior",
      "billing_units": "billingUnits",
      "billing_method": "billingMethod",
      "max_purchase": "maxPurchase"
    });
  })
);
var Breakdown$inboundSchema = pipe(
  object({
    id: _default(string4(), ""),
    plan_id: nullable(string4()),
    included_grant: number2(),
    prepaid_grant: number2(),
    remaining: number2(),
    usage: number2(),
    unlimited: boolean2(),
    reset: nullable(_lazy(() => BalanceReset$inboundSchema)),
    price: nullable(_lazy(() => BalancePrice$inboundSchema)),
    expires_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "included_grant": "includedGrant",
      "prepaid_grant": "prepaidGrant",
      "expires_at": "expiresAt"
    });
  })
);
var BalanceRollover$inboundSchema = pipe(
  object({
    balance: number2(),
    expires_at: number2()
  }),
  transform((v) => {
    return remap(v, {
      "expires_at": "expiresAt"
    });
  })
);
var Balance$inboundSchema = pipe(
  object({
    feature_id: string4(),
    feature: optional3(_lazy(() => BalanceFeature$inboundSchema)),
    granted: number2(),
    remaining: number2(),
    usage: number2(),
    unlimited: boolean2(),
    overage_allowed: boolean2(),
    max_purchase: nullable(number2()),
    next_reset_at: nullable(number2()),
    breakdown: optional3(array(_lazy(() => Breakdown$inboundSchema))),
    rollovers: optional3(array(_lazy(
      () => BalanceRollover$inboundSchema
    )))
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "overage_allowed": "overageAllowed",
      "max_purchase": "maxPurchase",
      "next_reset_at": "nextResetAt"
    });
  })
);
var BatchTrackLock$outboundSchema = pipe(
  object({
    lockId: string(),
    enabled: literal(true),
    expiresAt: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      lockId: "lock_id",
      expiresAt: "expires_at"
    });
  })
);
var RequestBody$outboundSchema = pipe(
  object({
    customerId: string(),
    featureId: optional(string()),
    entityId: optional(string()),
    eventName: optional(string()),
    value: optional(number()),
    properties: optional(record(string(), any())),
    timestamp: optional(int()),
    async: optional(boolean()),
    lock: optional(_lazy(() => BatchTrackLock$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      featureId: "feature_id",
      entityId: "entity_id",
      eventName: "event_name"
    });
  })
);
var BatchTrackResponse$inboundSchema = object({
  success: literal2(true)
});
var BillingUpdatePriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var BillingUpdateItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var BillingUpdateItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var BillingUpdateItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var BillingUpdateItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var BillingUpdateItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var BillingUpdateItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var BillingUpdateItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var BillingUpdateAddItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var BillingUpdateAddItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var BillingUpdateAddItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var BillingUpdateAddItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var BillingUpdateAddItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var BillingUpdateAddItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var BillingUpdateAddItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var BillingUpdateRemoveItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var BillingUpdateIntervalRemoveItemEnum2 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var BillingUpdateIntervalRemoveItemEnum1 = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var BillingUpdateDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var BillingUpdateOnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var BillingUpdatePurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var BillingUpdateLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var BillingUpdateUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var BillingUpdateThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var BillingUpdateProrationBehavior = {
  ProrateImmediately: "prorate_immediately",
  None: "none"
};
var BillingUpdateRedirectMode = {
  Always: "always",
  IfRequired: "if_required",
  Never: "never"
};
var BillingUpdateCancelAction = {
  CancelImmediately: "cancel_immediately",
  CancelEndOfCycle: "cancel_end_of_cycle",
  Uncancel: "uncancel"
};
var BillingUpdateCode = {
  ThreedsRequired: "3ds_required",
  PaymentMethodRequired: "payment_method_required",
  PaymentFailed: "payment_failed"
};
var BillingUpdateFeatureQuantity$outboundSchema = pipe(
  object({
    featureId: string(),
    quantity: optional(number()),
    adjustable: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var BillingUpdatePriceInterval$outboundSchema = _enum(BillingUpdatePriceInterval);
var BillingUpdateBasePrice$outboundSchema = pipe(
  object({
    amount: number(),
    interval: BillingUpdatePriceInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var BillingUpdateItemResetInterval$outboundSchema = _enum(BillingUpdateItemResetInterval);
var BillingUpdateItemReset$outboundSchema = pipe(
  object({
    interval: BillingUpdateItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var BillingUpdateItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var BillingUpdateItemTierBehavior$outboundSchema = _enum(BillingUpdateItemTierBehavior);
var BillingUpdateItemPriceInterval$outboundSchema = _enum(BillingUpdateItemPriceInterval);
var BillingUpdateItemBillingMethod$outboundSchema = _enum(BillingUpdateItemBillingMethod);
var BillingUpdateItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => BillingUpdateItemTier$outboundSchema))
    ),
    tierBehavior: optional(BillingUpdateItemTierBehavior$outboundSchema),
    interval: BillingUpdateItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: BillingUpdateItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var BillingUpdateItemOnIncrease$outboundSchema = _enum(BillingUpdateItemOnIncrease);
var BillingUpdateItemOnDecrease$outboundSchema = _enum(BillingUpdateItemOnDecrease);
var BillingUpdateItemProration$outboundSchema = pipe(
  object({
    onIncrease: BillingUpdateItemOnIncrease$outboundSchema,
    onDecrease: BillingUpdateItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var BillingUpdateItemExpiryDurationType$outboundSchema = _enum(BillingUpdateItemExpiryDurationType);
var BillingUpdateItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: BillingUpdateItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var BillingUpdateItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => BillingUpdateItemReset$outboundSchema)),
    price: optional(_lazy(() => BillingUpdateItemPrice$outboundSchema)),
    proration: optional(
      _lazy(() => BillingUpdateItemProration$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => BillingUpdateItemRollover$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var BillingUpdateAddItemResetInterval$outboundSchema = _enum(BillingUpdateAddItemResetInterval);
var BillingUpdateAddItemReset$outboundSchema = pipe(
  object({
    interval: BillingUpdateAddItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var BillingUpdateAddItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var BillingUpdateAddItemTierBehavior$outboundSchema = _enum(BillingUpdateAddItemTierBehavior);
var BillingUpdateAddItemPriceInterval$outboundSchema = _enum(BillingUpdateAddItemPriceInterval);
var BillingUpdateAddItemBillingMethod$outboundSchema = _enum(BillingUpdateAddItemBillingMethod);
var BillingUpdateAddItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => BillingUpdateAddItemTier$outboundSchema))
    ),
    tierBehavior: optional(BillingUpdateAddItemTierBehavior$outboundSchema),
    interval: BillingUpdateAddItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: BillingUpdateAddItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var BillingUpdateAddItemOnIncrease$outboundSchema = _enum(BillingUpdateAddItemOnIncrease);
var BillingUpdateAddItemOnDecrease$outboundSchema = _enum(BillingUpdateAddItemOnDecrease);
var BillingUpdateAddItemProration$outboundSchema = pipe(
  object({
    onIncrease: BillingUpdateAddItemOnIncrease$outboundSchema,
    onDecrease: BillingUpdateAddItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var BillingUpdateAddItemExpiryDurationType$outboundSchema = _enum(
  BillingUpdateAddItemExpiryDurationType
);
var BillingUpdateAddItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: BillingUpdateAddItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var BillingUpdateAddItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => BillingUpdateAddItemReset$outboundSchema)),
    price: optional(_lazy(() => BillingUpdateAddItemPrice$outboundSchema)),
    proration: optional(
      _lazy(() => BillingUpdateAddItemProration$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => BillingUpdateAddItemRollover$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var BillingUpdateRemoveItemBillingMethod$outboundSchema = _enum(BillingUpdateRemoveItemBillingMethod);
var BillingUpdateIntervalRemoveItemEnum2$outboundSchema = _enum(BillingUpdateIntervalRemoveItemEnum2);
var BillingUpdateIntervalRemoveItemEnum1$outboundSchema = _enum(BillingUpdateIntervalRemoveItemEnum1);
var BillingUpdatePlanItemFilter$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    billingMethod: optional(
      BillingUpdateRemoveItemBillingMethod$outboundSchema
    ),
    interval: optional(
      smartUnion([
        BillingUpdateIntervalRemoveItemEnum1$outboundSchema,
        BillingUpdateIntervalRemoveItemEnum2$outboundSchema
      ])
    ),
    intervalCount: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      billingMethod: "billing_method",
      intervalCount: "interval_count"
    });
  })
);
var BillingUpdateDurationType$outboundSchema = _enum(BillingUpdateDurationType);
var BillingUpdateOnEnd$outboundSchema = _enum(BillingUpdateOnEnd);
var BillingUpdateFreeTrialParams$outboundSchema = pipe(
  object({
    durationLength: number(),
    durationType: _default(BillingUpdateDurationType$outboundSchema, "month"),
    cardRequired: _default(boolean(), true),
    onEnd: optional(BillingUpdateOnEnd$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      durationLength: "duration_length",
      durationType: "duration_type",
      cardRequired: "card_required",
      onEnd: "on_end"
    });
  })
);
var BillingUpdatePurchaseLimitInterval$outboundSchema = _enum(BillingUpdatePurchaseLimitInterval);
var BillingUpdatePurchaseLimit$outboundSchema = pipe(
  object({
    interval: BillingUpdatePurchaseLimitInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var BillingUpdateAutoTopup$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => BillingUpdatePurchaseLimit$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var BillingUpdateLimitType$outboundSchema = _enum(BillingUpdateLimitType);
var BillingUpdateSpendLimit$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(BillingUpdateLimitType$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var BillingUpdateUsageLimitInterval$outboundSchema = _enum(BillingUpdateUsageLimitInterval);
var BillingUpdateUsageLimit$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: BillingUpdateUsageLimitInterval$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var BillingUpdateThresholdType$outboundSchema = _enum(BillingUpdateThresholdType);
var BillingUpdateUsageAlert$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: BillingUpdateThresholdType$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var BillingUpdateOverageAllowed$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var BillingUpdateBillingControls$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => BillingUpdateAutoTopup$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => BillingUpdateSpendLimit$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => BillingUpdateUsageLimit$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => BillingUpdateUsageAlert$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => BillingUpdateOverageAllowed$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var BillingUpdateCustomize$outboundSchema = pipe(
  object({
    price: optional(
      nullable$1(_lazy(() => BillingUpdateBasePrice$outboundSchema))
    ),
    items: optional(
      array(_lazy(() => BillingUpdateItemPlanItem$outboundSchema))
    ),
    addItems: optional(
      array(_lazy(() => BillingUpdateAddItemPlanItem$outboundSchema))
    ),
    removeItems: optional(
      array(_lazy(() => BillingUpdatePlanItemFilter$outboundSchema))
    ),
    freeTrial: optional(
      nullable$1(_lazy(() => BillingUpdateFreeTrialParams$outboundSchema))
    ),
    billingControls: optional(
      _lazy(() => BillingUpdateBillingControls$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      addItems: "add_items",
      removeItems: "remove_items",
      freeTrial: "free_trial",
      billingControls: "billing_controls"
    });
  })
);
var BillingUpdateInvoiceMode$outboundSchema = pipe(
  object({
    enabled: boolean(),
    enablePlanImmediately: _default(boolean(), false),
    finalize: _default(boolean(), true),
    invoiceTemplateId: optional(string()),
    netTermsDays: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      enablePlanImmediately: "enable_plan_immediately",
      invoiceTemplateId: "invoice_template_id",
      netTermsDays: "net_terms_days"
    });
  })
);
var BillingUpdateProrationBehavior$outboundSchema = _enum(BillingUpdateProrationBehavior);
var BillingUpdateRedirectMode$outboundSchema = _enum(BillingUpdateRedirectMode);
var BillingUpdateAttachDiscount$outboundSchema = pipe(
  object({
    rewardId: optional(string()),
    promotionCode: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      rewardId: "reward_id",
      promotionCode: "promotion_code"
    });
  })
);
var BillingUpdateCancelAction$outboundSchema = _enum(BillingUpdateCancelAction);
var BillingUpdateRecalculateBalances$outboundSchema = object({
  enabled: boolean()
});
var BillingUpdateCarryOverUsages$outboundSchema = pipe(
  object({
    enabled: boolean(),
    featureIds: optional(array(string()))
  }),
  transform((v) => {
    return remap(v, {
      featureIds: "feature_ids"
    });
  })
);
var UpdateSubscriptionParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    planId: optional(string()),
    featureQuantities: optional(
      array(_lazy(() => BillingUpdateFeatureQuantity$outboundSchema))
    ),
    version: optional(number()),
    customize: optional(_lazy(() => BillingUpdateCustomize$outboundSchema)),
    invoiceMode: optional(
      _lazy(() => BillingUpdateInvoiceMode$outboundSchema)
    ),
    prorationBehavior: optional(
      BillingUpdateProrationBehavior$outboundSchema
    ),
    redirectMode: _default(
      BillingUpdateRedirectMode$outboundSchema,
      "if_required"
    ),
    subscriptionId: optional(string()),
    discounts: optional(
      array(_lazy(() => BillingUpdateAttachDiscount$outboundSchema))
    ),
    cancelAction: optional(BillingUpdateCancelAction$outboundSchema),
    billingCycleAnchor: optional(literal("now")),
    noBillingChanges: optional(boolean()),
    recalculateBalances: optional(
      _lazy(() => BillingUpdateRecalculateBalances$outboundSchema)
    ),
    carryOverUsages: optional(
      _lazy(() => BillingUpdateCarryOverUsages$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      planId: "plan_id",
      featureQuantities: "feature_quantities",
      invoiceMode: "invoice_mode",
      prorationBehavior: "proration_behavior",
      redirectMode: "redirect_mode",
      subscriptionId: "subscription_id",
      cancelAction: "cancel_action",
      billingCycleAnchor: "billing_cycle_anchor",
      noBillingChanges: "no_billing_changes",
      recalculateBalances: "recalculate_balances",
      carryOverUsages: "carry_over_usages"
    });
  })
);
var BillingUpdateInvoice$inboundSchema = pipe(
  object({
    status: nullable(string4()),
    stripe_id: string4(),
    total: number2(),
    currency: string4(),
    hosted_invoice_url: nullable(string4())
  }),
  transform((v) => {
    return remap(v, {
      "stripe_id": "stripeId",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var BillingUpdateCode$inboundSchema = inboundSchema(BillingUpdateCode);
var BillingUpdateRequiredAction$inboundSchema = object({
  code: BillingUpdateCode$inboundSchema,
  reason: string4()
});
var BillingUpdateResponse$inboundSchema = pipe(
  object({
    customer_id: string4(),
    entity_id: optional3(string4()),
    invoice: optional3(_lazy(() => BillingUpdateInvoice$inboundSchema)),
    payment_url: nullable(string4()),
    required_action: optional3(
      _lazy(() => BillingUpdateRequiredAction$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "payment_url": "paymentUrl",
      "required_action": "requiredAction"
    });
  })
);
var FlagType2 = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var Scenario2 = {
  UsageLimit: "usage_limit",
  FeatureFlag: "feature_flag"
};
var CheckEnv2 = {
  Sandbox: "sandbox",
  Live: "live"
};
var ProductType2 = {
  Feature: "feature",
  PricedFeature: "priced_feature",
  Price: "price"
};
var FeatureType2 = {
  SingleUse: "single_use",
  ContinuousUse: "continuous_use",
  Boolean: "boolean",
  Static: "static"
};
var CheckItemInterval2 = {
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CheckTierBehavior2 = {
  Graduated: "graduated",
  Volume: "volume"
};
var UsageModel2 = {
  Prepaid: "prepaid",
  PayPerUse: "pay_per_use"
};
var ConfigDuration2 = {
  Month: "month",
  Forever: "forever"
};
var CheckOnIncrease2 = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var CheckOnDecrease2 = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var FreeTrialDuration2 = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var CheckOnEnd2 = {
  Bill: "bill",
  Revert: "revert"
};
var CheckPurchaseLimitInterval2 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var CheckLimitType2 = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var CheckUsageLimitInterval2 = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var CheckThresholdType2 = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var ProductScenario2 = {
  Scheduled: "scheduled",
  Active: "active",
  New: "new",
  Renew: "renew",
  Upgrade: "upgrade",
  UpdatePrepaidQuantity: "update_prepaid_quantity",
  Downgrade: "downgrade",
  Cancel: "cancel",
  Expired: "expired",
  PastDue: "past_due"
};
var FlagType1 = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var Scenario1 = {
  UsageLimit: "usage_limit",
  FeatureFlag: "feature_flag"
};
var CheckEnv1 = {
  Sandbox: "sandbox",
  Live: "live"
};
var ProductType1 = {
  Feature: "feature",
  PricedFeature: "priced_feature",
  Price: "price"
};
var FeatureType1 = {
  SingleUse: "single_use",
  ContinuousUse: "continuous_use",
  Boolean: "boolean",
  Static: "static"
};
var CheckItemInterval1 = {
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CheckTierBehavior1 = {
  Graduated: "graduated",
  Volume: "volume"
};
var UsageModel1 = {
  Prepaid: "prepaid",
  PayPerUse: "pay_per_use"
};
var ConfigDuration1 = {
  Month: "month",
  Forever: "forever"
};
var CheckOnIncrease1 = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var CheckOnDecrease1 = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var FreeTrialDuration1 = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var CheckOnEnd1 = {
  Bill: "bill",
  Revert: "revert"
};
var CheckPurchaseLimitInterval1 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var CheckLimitType1 = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var CheckUsageLimitInterval1 = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var CheckThresholdType1 = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var ProductScenario1 = {
  Scheduled: "scheduled",
  Active: "active",
  New: "new",
  Renew: "renew",
  Upgrade: "upgrade",
  UpdatePrepaidQuantity: "update_prepaid_quantity",
  Downgrade: "downgrade",
  Cancel: "cancel",
  Expired: "expired",
  PastDue: "past_due"
};
var CheckLock$outboundSchema = pipe(
  object({
    lockId: string(),
    enabled: literal(true),
    expiresAt: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      lockId: "lock_id",
      expiresAt: "expires_at"
    });
  })
);
var CheckParams$outboundSchema = pipe(
  object({
    customerId: string(),
    featureId: string(),
    entityId: optional(string()),
    requiredBalance: optional(number()),
    properties: optional(record(string(), any())),
    sendEvent: optional(boolean()),
    lock: optional(_lazy(() => CheckLock$outboundSchema)),
    withPreview: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      featureId: "feature_id",
      entityId: "entity_id",
      requiredBalance: "required_balance",
      sendEvent: "send_event",
      withPreview: "with_preview"
    });
  })
);
var FlagType2$inboundSchema = inboundSchema(FlagType2);
var CheckCreditSchema2$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var CheckModelMarkups2$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var CheckProviderMarkups2$inboundSchema = object({
  markup: number2()
});
var FlagDisplay2$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var CheckFeature2$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: FlagType2$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => CheckCreditSchema2$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CheckModelMarkups2$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CheckProviderMarkups2$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => FlagDisplay2$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var Flag2$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => CheckFeature2$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var Scenario2$inboundSchema = inboundSchema(Scenario2);
var CheckEnv2$inboundSchema = inboundSchema(CheckEnv2);
var ProductType2$inboundSchema = inboundSchema(ProductType2);
var FeatureType2$inboundSchema = inboundSchema(FeatureType2);
var CheckItemInterval2$inboundSchema = inboundSchema(CheckItemInterval2);
var CheckTierBehavior2$inboundSchema = inboundSchema(CheckTierBehavior2);
var UsageModel2$inboundSchema = inboundSchema(UsageModel2);
var ProductDisplay2$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var ConfigDuration2$inboundSchema = inboundSchema(ConfigDuration2);
var CheckRollover2$inboundSchema = pipe(
  object({
    max: optional(nullable$1(number2())),
    max_percentage: optional(nullable$1(number2())),
    duration: _default(ConfigDuration2$inboundSchema, "month"),
    length: number2()
  }),
  transform((v) => {
    return remap(v, {
      "max_percentage": "maxPercentage"
    });
  })
);
var CheckOnIncrease2$inboundSchema = inboundSchema(CheckOnIncrease2);
var CheckOnDecrease2$inboundSchema = inboundSchema(CheckOnDecrease2);
var CheckConfig2$inboundSchema = pipe(
  object({
    rollover: optional(
      nullable$1(_lazy(() => CheckRollover2$inboundSchema))
    ),
    on_increase: optional(nullable$1(CheckOnIncrease2$inboundSchema)),
    on_decrease: optional(nullable$1(CheckOnDecrease2$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "on_increase": "onIncrease",
      "on_decrease": "onDecrease"
    });
  })
);
var CheckItem2$inboundSchema = pipe(
  object({
    type: optional(nullable$1(ProductType2$inboundSchema)),
    feature_id: optional(nullable$1(string4())),
    feature_type: optional(nullable$1(FeatureType2$inboundSchema)),
    included_usage: optional(
      nullable$1(smartUnion([number2(), string4()]))
    ),
    interval: optional(nullable$1(CheckItemInterval2$inboundSchema)),
    interval_count: optional(nullable$1(number2())),
    price: optional(nullable$1(number2())),
    tiers: optional(nullable$1(array(nullable(any())))),
    tier_behavior: optional(nullable$1(CheckTierBehavior2$inboundSchema)),
    usage_model: optional(nullable$1(UsageModel2$inboundSchema)),
    billing_units: optional(nullable$1(number2())),
    reset_usage_when_enabled: optional(nullable$1(boolean2())),
    entity_feature_id: optional(nullable$1(string4())),
    display: optional(
      nullable$1(_lazy(() => ProductDisplay2$inboundSchema))
    ),
    quantity: optional(nullable$1(number2())),
    next_cycle_quantity: optional(nullable$1(number2())),
    config: optional(nullable$1(_lazy(() => CheckConfig2$inboundSchema)))
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "feature_type": "featureType",
      "included_usage": "includedUsage",
      "interval_count": "intervalCount",
      "tier_behavior": "tierBehavior",
      "usage_model": "usageModel",
      "billing_units": "billingUnits",
      "reset_usage_when_enabled": "resetUsageWhenEnabled",
      "entity_feature_id": "entityFeatureId",
      "next_cycle_quantity": "nextCycleQuantity"
    });
  })
);
var FreeTrialDuration2$inboundSchema = inboundSchema(FreeTrialDuration2);
var CheckOnEnd2$inboundSchema = inboundSchema(CheckOnEnd2);
var CheckFreeTrial2$inboundSchema = pipe(
  object({
    duration: FreeTrialDuration2$inboundSchema,
    length: number2(),
    unique_fingerprint: boolean2(),
    card_required: boolean2(),
    on_end: optional(nullable$1(CheckOnEnd2$inboundSchema)),
    trial_available: nullable$1(_default(boolean2(), true))
  }),
  transform((v) => {
    return remap(v, {
      "unique_fingerprint": "uniqueFingerprint",
      "card_required": "cardRequired",
      "on_end": "onEnd",
      "trial_available": "trialAvailable"
    });
  })
);
var CheckPurchaseLimitInterval2$inboundSchema = inboundSchema(CheckPurchaseLimitInterval2);
var CheckPurchaseLimit2$inboundSchema = pipe(
  object({
    interval: CheckPurchaseLimitInterval2$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var CheckAutoTopup2$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(
      _lazy(() => CheckPurchaseLimit2$inboundSchema)
    ),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var CheckLimitType2$inboundSchema = inboundSchema(CheckLimitType2);
var CheckSpendLimit2$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(CheckLimitType2$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var CheckUsageLimitInterval2$inboundSchema = inboundSchema(CheckUsageLimitInterval2);
var CheckUsageLimit2$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: CheckUsageLimitInterval2$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CheckThresholdType2$inboundSchema = inboundSchema(CheckThresholdType2);
var CheckUsageAlert2$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: CheckThresholdType2$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var CheckOverageAllowed2$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CheckBillingControls2$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => CheckAutoTopup2$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => CheckSpendLimit2$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => CheckUsageLimit2$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => CheckUsageAlert2$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => CheckOverageAllowed2$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var ProductScenario2$inboundSchema = inboundSchema(ProductScenario2);
var Properties2$inboundSchema = pipe(
  object({
    is_free: boolean2(),
    is_one_off: boolean2(),
    interval_group: optional(nullable$1(string4())),
    has_trial: optional(nullable$1(boolean2())),
    updateable: optional(nullable$1(boolean2()))
  }),
  transform((v) => {
    return remap(v, {
      "is_free": "isFree",
      "is_one_off": "isOneOff",
      "interval_group": "intervalGroup",
      "has_trial": "hasTrial"
    });
  })
);
var CheckProduct2$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    group: nullable(string4()),
    env: CheckEnv2$inboundSchema,
    is_add_on: boolean2(),
    is_default: boolean2(),
    archived: boolean2(),
    version: number2(),
    created_at: number2(),
    items: array(_lazy(() => CheckItem2$inboundSchema)),
    free_trial: nullable(_lazy(() => CheckFreeTrial2$inboundSchema)),
    base_variant_id: nullable(string4()),
    billing_controls: optional3(
      _lazy(() => CheckBillingControls2$inboundSchema)
    ),
    scenario: optional3(ProductScenario2$inboundSchema),
    properties: optional3(_lazy(() => Properties2$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "is_add_on": "isAddOn",
      "is_default": "isDefault",
      "created_at": "createdAt",
      "free_trial": "freeTrial",
      "base_variant_id": "baseVariantId",
      "billing_controls": "billingControls"
    });
  })
);
var Preview2$inboundSchema = pipe(
  object({
    scenario: Scenario2$inboundSchema,
    title: string4(),
    message: string4(),
    feature_id: string4(),
    feature_name: string4(),
    products: array(_lazy(() => CheckProduct2$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "feature_name": "featureName"
    });
  })
);
var CheckResponseBody2$inboundSchema = pipe(
  object({
    allowed: boolean2(),
    customer_id: string4(),
    entity_id: optional(nullable$1(string4())),
    required_balance: optional3(number2()),
    balance: nullable(Balance$inboundSchema),
    balances: optional3(
      record(string(), nullable(Balance$inboundSchema))
    ),
    flag: nullable(_lazy(() => Flag2$inboundSchema)),
    preview: optional3(_lazy(() => Preview2$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "required_balance": "requiredBalance"
    });
  })
);
var FlagType1$inboundSchema = inboundSchema(FlagType1);
var CheckCreditSchema1$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var CheckModelMarkups1$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var CheckProviderMarkups1$inboundSchema = object({
  markup: number2()
});
var FlagDisplay1$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var CheckFeature1$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: FlagType1$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => CheckCreditSchema1$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CheckModelMarkups1$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CheckProviderMarkups1$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => FlagDisplay1$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var Flag1$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => CheckFeature1$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var Scenario1$inboundSchema = inboundSchema(Scenario1);
var CheckEnv1$inboundSchema = inboundSchema(CheckEnv1);
var ProductType1$inboundSchema = inboundSchema(ProductType1);
var FeatureType1$inboundSchema = inboundSchema(FeatureType1);
var CheckItemInterval1$inboundSchema = inboundSchema(CheckItemInterval1);
var CheckTierBehavior1$inboundSchema = inboundSchema(CheckTierBehavior1);
var UsageModel1$inboundSchema = inboundSchema(UsageModel1);
var ProductDisplay1$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var ConfigDuration1$inboundSchema = inboundSchema(ConfigDuration1);
var CheckRollover1$inboundSchema = pipe(
  object({
    max: optional(nullable$1(number2())),
    max_percentage: optional(nullable$1(number2())),
    duration: _default(ConfigDuration1$inboundSchema, "month"),
    length: number2()
  }),
  transform((v) => {
    return remap(v, {
      "max_percentage": "maxPercentage"
    });
  })
);
var CheckOnIncrease1$inboundSchema = inboundSchema(CheckOnIncrease1);
var CheckOnDecrease1$inboundSchema = inboundSchema(CheckOnDecrease1);
var CheckConfig1$inboundSchema = pipe(
  object({
    rollover: optional(
      nullable$1(_lazy(() => CheckRollover1$inboundSchema))
    ),
    on_increase: optional(nullable$1(CheckOnIncrease1$inboundSchema)),
    on_decrease: optional(nullable$1(CheckOnDecrease1$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "on_increase": "onIncrease",
      "on_decrease": "onDecrease"
    });
  })
);
var CheckItem1$inboundSchema = pipe(
  object({
    type: optional(nullable$1(ProductType1$inboundSchema)),
    feature_id: optional(nullable$1(string4())),
    feature_type: optional(nullable$1(FeatureType1$inboundSchema)),
    included_usage: optional(
      nullable$1(smartUnion([number2(), string4()]))
    ),
    interval: optional(nullable$1(CheckItemInterval1$inboundSchema)),
    interval_count: optional(nullable$1(number2())),
    price: optional(nullable$1(number2())),
    tiers: optional(nullable$1(array(nullable(any())))),
    tier_behavior: optional(nullable$1(CheckTierBehavior1$inboundSchema)),
    usage_model: optional(nullable$1(UsageModel1$inboundSchema)),
    billing_units: optional(nullable$1(number2())),
    reset_usage_when_enabled: optional(nullable$1(boolean2())),
    entity_feature_id: optional(nullable$1(string4())),
    display: optional(
      nullable$1(_lazy(() => ProductDisplay1$inboundSchema))
    ),
    quantity: optional(nullable$1(number2())),
    next_cycle_quantity: optional(nullable$1(number2())),
    config: optional(nullable$1(_lazy(() => CheckConfig1$inboundSchema)))
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "feature_type": "featureType",
      "included_usage": "includedUsage",
      "interval_count": "intervalCount",
      "tier_behavior": "tierBehavior",
      "usage_model": "usageModel",
      "billing_units": "billingUnits",
      "reset_usage_when_enabled": "resetUsageWhenEnabled",
      "entity_feature_id": "entityFeatureId",
      "next_cycle_quantity": "nextCycleQuantity"
    });
  })
);
var FreeTrialDuration1$inboundSchema = inboundSchema(FreeTrialDuration1);
var CheckOnEnd1$inboundSchema = inboundSchema(CheckOnEnd1);
var CheckFreeTrial1$inboundSchema = pipe(
  object({
    duration: FreeTrialDuration1$inboundSchema,
    length: number2(),
    unique_fingerprint: boolean2(),
    card_required: boolean2(),
    on_end: optional(nullable$1(CheckOnEnd1$inboundSchema)),
    trial_available: nullable$1(_default(boolean2(), true))
  }),
  transform((v) => {
    return remap(v, {
      "unique_fingerprint": "uniqueFingerprint",
      "card_required": "cardRequired",
      "on_end": "onEnd",
      "trial_available": "trialAvailable"
    });
  })
);
var CheckPurchaseLimitInterval1$inboundSchema = inboundSchema(CheckPurchaseLimitInterval1);
var CheckPurchaseLimit1$inboundSchema = pipe(
  object({
    interval: CheckPurchaseLimitInterval1$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var CheckAutoTopup1$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(
      _lazy(() => CheckPurchaseLimit1$inboundSchema)
    ),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var CheckLimitType1$inboundSchema = inboundSchema(CheckLimitType1);
var CheckSpendLimit1$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(CheckLimitType1$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var CheckUsageLimitInterval1$inboundSchema = inboundSchema(CheckUsageLimitInterval1);
var CheckUsageLimit1$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: CheckUsageLimitInterval1$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CheckThresholdType1$inboundSchema = inboundSchema(CheckThresholdType1);
var CheckUsageAlert1$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: CheckThresholdType1$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var CheckOverageAllowed1$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CheckBillingControls1$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => CheckAutoTopup1$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => CheckSpendLimit1$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => CheckUsageLimit1$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => CheckUsageAlert1$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => CheckOverageAllowed1$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var ProductScenario1$inboundSchema = inboundSchema(ProductScenario1);
var Properties1$inboundSchema = pipe(
  object({
    is_free: boolean2(),
    is_one_off: boolean2(),
    interval_group: optional(nullable$1(string4())),
    has_trial: optional(nullable$1(boolean2())),
    updateable: optional(nullable$1(boolean2()))
  }),
  transform((v) => {
    return remap(v, {
      "is_free": "isFree",
      "is_one_off": "isOneOff",
      "interval_group": "intervalGroup",
      "has_trial": "hasTrial"
    });
  })
);
var CheckProduct1$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    group: nullable(string4()),
    env: CheckEnv1$inboundSchema,
    is_add_on: boolean2(),
    is_default: boolean2(),
    archived: boolean2(),
    version: number2(),
    created_at: number2(),
    items: array(_lazy(() => CheckItem1$inboundSchema)),
    free_trial: nullable(_lazy(() => CheckFreeTrial1$inboundSchema)),
    base_variant_id: nullable(string4()),
    billing_controls: optional3(
      _lazy(() => CheckBillingControls1$inboundSchema)
    ),
    scenario: optional3(ProductScenario1$inboundSchema),
    properties: optional3(_lazy(() => Properties1$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "is_add_on": "isAddOn",
      "is_default": "isDefault",
      "created_at": "createdAt",
      "free_trial": "freeTrial",
      "base_variant_id": "baseVariantId",
      "billing_controls": "billingControls"
    });
  })
);
var Preview1$inboundSchema = pipe(
  object({
    scenario: Scenario1$inboundSchema,
    title: string4(),
    message: string4(),
    feature_id: string4(),
    feature_name: string4(),
    products: array(_lazy(() => CheckProduct1$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "feature_name": "featureName"
    });
  })
);
var CheckResponseBody1$inboundSchema = pipe(
  object({
    allowed: boolean2(),
    customer_id: string4(),
    entity_id: optional(nullable$1(string4())),
    required_balance: optional3(number2()),
    balance: nullable(Balance$inboundSchema),
    balances: optional3(
      record(string(), nullable(Balance$inboundSchema))
    ),
    flag: nullable(_lazy(() => Flag1$inboundSchema)),
    preview: optional3(_lazy(() => Preview1$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "required_balance": "requiredBalance"
    });
  })
);
var CheckResponse$inboundSchema = smartUnion([
  _lazy(() => CheckResponseBody1$inboundSchema),
  _lazy(() => CheckResponseBody2$inboundSchema)
]);
var CreateBalanceInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreateBalanceDuration = {
  Month: "month",
  Forever: "forever"
};
var CreateBalanceInterval$outboundSchema = _enum(CreateBalanceInterval);
var CreateBalanceReset$outboundSchema = pipe(
  object({
    interval: CreateBalanceInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var CreateBalanceDuration$outboundSchema = _enum(CreateBalanceDuration);
var CreateBalanceRollover$outboundSchema = pipe(
  object({
    max: optional(nullable$1(number())),
    maxPercentage: optional(nullable$1(number())),
    duration: _default(CreateBalanceDuration$outboundSchema, "month"),
    length: number()
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage"
    });
  })
);
var CreateBalanceParams$outboundSchema = pipe(
  object({
    customerId: string(),
    featureId: string(),
    entityId: optional(string()),
    includedGrant: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => CreateBalanceReset$outboundSchema)),
    rollover: optional(_lazy(() => CreateBalanceRollover$outboundSchema)),
    expiresAt: optional(number()),
    nextResetAt: optional(number()),
    balanceId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      featureId: "feature_id",
      entityId: "entity_id",
      includedGrant: "included_grant",
      expiresAt: "expires_at",
      nextResetAt: "next_reset_at",
      balanceId: "balance_id"
    });
  })
);
var CreateBalanceResponse$inboundSchema = object({
  success: boolean2()
});
var CustomerDataPurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var CustomerDataLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var CustomerDataUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var CustomerDataThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var CustomerDataPurchaseLimitInterval$outboundSchema = _enum(CustomerDataPurchaseLimitInterval);
var CustomerDataPurchaseLimit$outboundSchema = pipe(
  object({
    interval: CustomerDataPurchaseLimitInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var CustomerDataAutoTopup$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => CustomerDataPurchaseLimit$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var CustomerDataLimitType$outboundSchema = _enum(CustomerDataLimitType);
var CustomerDataSpendLimit$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(CustomerDataLimitType$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var CustomerDataUsageLimitInterval$outboundSchema = _enum(CustomerDataUsageLimitInterval);
var CustomerDataUsageLimit$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: CustomerDataUsageLimitInterval$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CustomerDataThresholdType$outboundSchema = _enum(CustomerDataThresholdType);
var CustomerDataUsageAlert$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: CustomerDataThresholdType$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var CustomerDataOverageAllowed$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CustomerDataBillingControls$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => CustomerDataAutoTopup$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => CustomerDataSpendLimit$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => CustomerDataUsageLimit$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => CustomerDataUsageAlert$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => CustomerDataOverageAllowed$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var CustomerDataConfig$outboundSchema = pipe(
  object({
    disablePooledBalance: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      disablePooledBalance: "disable_pooled_balance"
    });
  })
);
var CustomerData$outboundSchema = pipe(
  object({
    name: optional(nullable$1(string())),
    email: optional(nullable$1(string())),
    fingerprint: optional(nullable$1(string())),
    metadata: optional(nullable$1(record(string(), any()))),
    stripeId: optional(nullable$1(string())),
    createInStripe: optional(boolean()),
    autoEnablePlanId: optional(string()),
    sendEmailReceipts: optional(boolean()),
    billingControls: optional(
      _lazy(() => CustomerDataBillingControls$outboundSchema)
    ),
    config: optional(_lazy(() => CustomerDataConfig$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      stripeId: "stripe_id",
      createInStripe: "create_in_stripe",
      autoEnablePlanId: "auto_enable_plan_id",
      sendEmailReceipts: "send_email_receipts",
      billingControls: "billing_controls"
    });
  })
);
var PlanPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PlanType = {
  Static: "static",
  Boolean: "boolean",
  SingleUse: "single_use",
  ContinuousUse: "continuous_use",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var PlanResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PlanTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var PlanPriceItemInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PlanBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var ExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var PlanDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var OnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var PlanEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var PlanPurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var PlanLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var PlanUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var PlanThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var PlanStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var AttachAction = {
  Activate: "activate",
  Upgrade: "upgrade",
  Downgrade: "downgrade",
  None: "none",
  Purchase: "purchase"
};
var PlanPriceInterval$inboundSchema = inboundSchema(PlanPriceInterval);
var PlanPriceDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var PlanPrice$inboundSchema = pipe(
  object({
    amount: number2(),
    interval: PlanPriceInterval$inboundSchema,
    interval_count: optional3(number2()),
    display: optional3(_lazy(() => PlanPriceDisplay$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var PlanType$inboundSchema = inboundSchema(PlanType);
var PlanFeatureDisplay$inboundSchema = object({
  singular: string4(),
  plural: string4()
});
var PlanCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var PlanFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: optional(nullable$1(string4())),
    type: PlanType$inboundSchema,
    display: optional(
      nullable$1(_lazy(() => PlanFeatureDisplay$inboundSchema))
    ),
    credit_schema: optional(
      nullable$1(array(_lazy(() => PlanCreditSchema$inboundSchema)))
    ),
    archived: optional(nullable$1(boolean2()))
  }),
  transform((v) => {
    return remap(v, {
      "credit_schema": "creditSchema"
    });
  })
);
var PlanResetInterval$inboundSchema = inboundSchema(PlanResetInterval);
var PlanReset$inboundSchema = pipe(
  object({
    interval: PlanResetInterval$inboundSchema,
    interval_count: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var PlanTier$inboundSchema = pipe(
  object({
    to: smartUnion([number2(), string4()]),
    amount: number2(),
    flat_amount: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "flat_amount": "flatAmount"
    });
  })
);
var PlanTierBehavior$inboundSchema = inboundSchema(PlanTierBehavior);
var PlanPriceItemInterval$inboundSchema = inboundSchema(PlanPriceItemInterval);
var PlanBillingMethod$inboundSchema = inboundSchema(PlanBillingMethod);
var PlanItemPrice$inboundSchema = pipe(
  object({
    amount: optional3(number2()),
    tiers: optional3(array(_lazy(() => PlanTier$inboundSchema))),
    tier_behavior: optional3(PlanTierBehavior$inboundSchema),
    interval: PlanPriceItemInterval$inboundSchema,
    interval_count: optional3(number2()),
    billing_units: number2(),
    billing_method: PlanBillingMethod$inboundSchema,
    max_purchase: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "tier_behavior": "tierBehavior",
      "interval_count": "intervalCount",
      "billing_units": "billingUnits",
      "billing_method": "billingMethod",
      "max_purchase": "maxPurchase"
    });
  })
);
var PlanItemDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var ExpiryDurationType$inboundSchema = inboundSchema(ExpiryDurationType);
var PlanRollover$inboundSchema = pipe(
  object({
    max: nullable(number2()),
    max_percentage: optional(nullable$1(number2())),
    expiry_duration_type: ExpiryDurationType$inboundSchema,
    expiry_duration_length: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "max_percentage": "maxPercentage",
      "expiry_duration_type": "expiryDurationType",
      "expiry_duration_length": "expiryDurationLength"
    });
  })
);
var Item$inboundSchema = pipe(
  object({
    feature_id: string4(),
    feature: optional3(_lazy(() => PlanFeature$inboundSchema)),
    included: number2(),
    unlimited: boolean2(),
    reset: nullable(_lazy(() => PlanReset$inboundSchema)),
    price: nullable(_lazy(() => PlanItemPrice$inboundSchema)),
    display: optional3(_lazy(() => PlanItemDisplay$inboundSchema)),
    rollover: optional3(_lazy(() => PlanRollover$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var PlanDurationType$inboundSchema = inboundSchema(PlanDurationType);
var OnEnd$inboundSchema = inboundSchema(OnEnd);
var FreeTrial$inboundSchema = pipe(
  object({
    duration_length: number2(),
    duration_type: PlanDurationType$inboundSchema,
    card_required: boolean2(),
    on_end: optional(nullable$1(OnEnd$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "duration_length": "durationLength",
      "duration_type": "durationType",
      "card_required": "cardRequired",
      "on_end": "onEnd"
    });
  })
);
var PlanEnv$inboundSchema = inboundSchema(PlanEnv);
var PlanConfig$inboundSchema = pipe(
  object({
    ignore_past_due: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "ignore_past_due": "ignorePastDue"
    });
  })
);
var PlanPurchaseLimitInterval$inboundSchema = inboundSchema(PlanPurchaseLimitInterval);
var PlanPurchaseLimit$inboundSchema = pipe(
  object({
    interval: PlanPurchaseLimitInterval$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var PlanAutoTopup$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(
      _lazy(() => PlanPurchaseLimit$inboundSchema)
    ),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var PlanLimitType$inboundSchema = inboundSchema(PlanLimitType);
var PlanSpendLimit$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(PlanLimitType$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var PlanUsageLimitInterval$inboundSchema = inboundSchema(PlanUsageLimitInterval);
var PlanUsageLimit$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: PlanUsageLimitInterval$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var PlanThresholdType$inboundSchema = inboundSchema(PlanThresholdType);
var PlanUsageAlert$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: PlanThresholdType$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var PlanOverageAllowed$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var PlanBillingControls$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => PlanAutoTopup$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => PlanSpendLimit$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => PlanUsageLimit$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => PlanUsageAlert$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => PlanOverageAllowed$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var PlanStatus$inboundSchema = inboundSchema(PlanStatus);
var AttachAction$inboundSchema = inboundSchema(AttachAction);
var CustomerEligibility$inboundSchema = pipe(
  object({
    trial_available: optional3(boolean2()),
    status: optional3(PlanStatus$inboundSchema),
    canceling: optional3(boolean2()),
    trialing: optional3(boolean2()),
    attach_action: AttachAction$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "trial_available": "trialAvailable",
      "attach_action": "attachAction"
    });
  })
);
var Plan$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    description: nullable(string4()),
    group: nullable(string4()),
    version: number2(),
    add_on: boolean2(),
    auto_enable: boolean2(),
    price: nullable(_lazy(() => PlanPrice$inboundSchema)),
    items: array(_lazy(() => Item$inboundSchema)),
    free_trial: optional3(_lazy(() => FreeTrial$inboundSchema)),
    created_at: number2(),
    env: PlanEnv$inboundSchema,
    archived: boolean2(),
    base_variant_id: nullable(string4()),
    config: _lazy(() => PlanConfig$inboundSchema),
    billing_controls: optional3(_lazy(
      () => PlanBillingControls$inboundSchema
    )),
    metadata: record(string(), any()),
    customer_eligibility: optional3(_lazy(
      () => CustomerEligibility$inboundSchema
    ))
  }),
  transform((v) => {
    return remap(v, {
      "add_on": "addOn",
      "auto_enable": "autoEnable",
      "free_trial": "freeTrial",
      "created_at": "createdAt",
      "base_variant_id": "baseVariantId",
      "billing_controls": "billingControls",
      "customer_eligibility": "customerEligibility"
    });
  })
);
var CreateEntityLimitTypeRequestBody = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var CreateEntityIntervalRequestBody = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var CreateEntityThresholdTypeRequestBody = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var CreateEntityEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var CreateEntityStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var CreateEntitySubscriptionScope = {
  Customer: "customer",
  Entity: "entity"
};
var CreateEntityPurchaseScope = {
  Customer: "customer",
  Entity: "entity"
};
var CreateEntityType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var CreateEntityLimitTypeResponse = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var CreateEntityIntervalResponse = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var CreateEntityThresholdTypeResponse = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var CreateEntityProcessorType = {
  Stripe: "stripe",
  Revenuecat: "revenuecat"
};
var CreateEntityLimitTypeRequestBody$outboundSchema = _enum(CreateEntityLimitTypeRequestBody);
var CreateEntitySpendLimitRequest$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(CreateEntityLimitTypeRequestBody$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var CreateEntityIntervalRequestBody$outboundSchema = _enum(CreateEntityIntervalRequestBody);
var CreateEntityUsageLimitRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: CreateEntityIntervalRequestBody$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreateEntityThresholdTypeRequestBody$outboundSchema = _enum(CreateEntityThresholdTypeRequestBody);
var CreateEntityUsageAlertRequestBody$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: CreateEntityThresholdTypeRequestBody$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var CreateEntityOverageAllowedRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreateEntityBillingControlsRequest$outboundSchema = pipe(
  object({
    spendLimits: optional(
      array(_lazy(() => CreateEntitySpendLimitRequest$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => CreateEntityUsageLimitRequest$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => CreateEntityUsageAlertRequestBody$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => CreateEntityOverageAllowedRequest$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var CreateEntityParams$outboundSchema = pipe(
  object({
    name: optional(nullable$1(string())),
    featureId: string(),
    billingControls: optional(
      _lazy(() => CreateEntityBillingControlsRequest$outboundSchema)
    ),
    customerData: optional(CustomerData$outboundSchema),
    customerId: string(),
    entityId: string()
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      billingControls: "billing_controls",
      customerData: "customer_data",
      customerId: "customer_id",
      entityId: "entity_id"
    });
  })
);
var CreateEntityEnv$inboundSchema = inboundSchema(CreateEntityEnv);
var CreateEntityStatus$inboundSchema = inboundSchema(CreateEntityStatus);
var CreateEntitySubscriptionScope$inboundSchema = inboundSchema(CreateEntitySubscriptionScope);
var CreateEntitySubscription$inboundSchema = pipe(
  object({
    id: string4(),
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    auto_enable: boolean2(),
    add_on: boolean2(),
    status: CreateEntityStatus$inboundSchema,
    past_due: boolean2(),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2()),
    trial_ends_at: nullable(number2()),
    started_at: number2(),
    current_period_start: nullable(number2()),
    current_period_end: nullable(number2()),
    quantity: number2(),
    scope: optional3(CreateEntitySubscriptionScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "auto_enable": "autoEnable",
      "add_on": "addOn",
      "past_due": "pastDue",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt",
      "trial_ends_at": "trialEndsAt",
      "started_at": "startedAt",
      "current_period_start": "currentPeriodStart",
      "current_period_end": "currentPeriodEnd"
    });
  })
);
var CreateEntityPurchaseScope$inboundSchema = inboundSchema(CreateEntityPurchaseScope);
var CreateEntityPurchase$inboundSchema = pipe(
  object({
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    expires_at: nullable(number2()),
    started_at: number2(),
    quantity: number2(),
    scope: optional3(CreateEntityPurchaseScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "started_at": "startedAt"
    });
  })
);
var CreateEntityType$inboundSchema = inboundSchema(CreateEntityType);
var CreateEntityCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var CreateEntityModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var CreateEntityProviderMarkups$inboundSchema = object({
  markup: number2()
});
var CreateEntityDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var CreateEntityFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: CreateEntityType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => CreateEntityCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CreateEntityModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CreateEntityProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => CreateEntityDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var CreateEntityFlags$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => CreateEntityFeature$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var CreateEntityLimitTypeResponse$inboundSchema = inboundSchema(CreateEntityLimitTypeResponse);
var CreateEntitySpendLimitResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(CreateEntityLimitTypeResponse$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var CreateEntityIntervalResponse$inboundSchema = inboundSchema(CreateEntityIntervalResponse);
var CreateEntityUsageLimitResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: CreateEntityIntervalResponse$inboundSchema,
    usage: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CreateEntityThresholdTypeResponse$inboundSchema = inboundSchema(CreateEntityThresholdTypeResponse);
var CreateEntityUsageAlertResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: CreateEntityThresholdTypeResponse$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var CreateEntityOverageAllowedResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CreateEntityBillingControlsResponse$inboundSchema = pipe(
  object({
    spend_limits: optional3(
      array(_lazy(() => CreateEntitySpendLimitResponse$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => CreateEntityUsageLimitResponse$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => CreateEntityUsageAlertResponse$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => CreateEntityOverageAllowedResponse$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var CreateEntityProcessorType$inboundSchema = inboundSchema(CreateEntityProcessorType);
var CreateEntityInvoice$inboundSchema = pipe(
  object({
    plan_ids: array(string4()),
    stripe_id: string4(),
    processor_type: _default(
      CreateEntityProcessorType$inboundSchema,
      "stripe"
    ),
    status: string4(),
    total: number2(),
    currency: string4(),
    created_at: number2(),
    hosted_invoice_url: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "plan_ids": "planIds",
      "stripe_id": "stripeId",
      "processor_type": "processorType",
      "created_at": "createdAt",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var CreateEntityResponse$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    customer_id: optional(nullable$1(string4())),
    feature_id: optional(nullable$1(string4())),
    created_at: number2(),
    env: CreateEntityEnv$inboundSchema,
    subscriptions: array(
      _lazy(() => CreateEntitySubscription$inboundSchema)
    ),
    purchases: array(_lazy(() => CreateEntityPurchase$inboundSchema)),
    balances: record(string(), Balance$inboundSchema),
    flags: record(string(), _lazy(() => CreateEntityFlags$inboundSchema)),
    billing_controls: optional3(
      _lazy(() => CreateEntityBillingControlsResponse$inboundSchema)
    ),
    invoices: optional3(
      array(_lazy(() => CreateEntityInvoice$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "feature_id": "featureId",
      "created_at": "createdAt",
      "billing_controls": "billingControls"
    });
  })
);
var CreateFeatureTypeRequestBody = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var CreateFeatureTypeResponse = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var CreateFeatureTypeRequestBody$outboundSchema = _enum(CreateFeatureTypeRequestBody);
var CreateFeatureDisplayRequestBody$outboundSchema = object({
  singular: string(),
  plural: string()
});
var CreateFeatureCreditSchemaRequestBody$outboundSchema = pipe(
  object({
    meteredFeatureId: string(),
    creditCost: number()
  }),
  transform((v) => {
    return remap(v, {
      meteredFeatureId: "metered_feature_id",
      creditCost: "credit_cost"
    });
  })
);
var CreateFeatureModelMarkupsRequest$outboundSchema = pipe(
  object({
    markup: optional(number()),
    inputCost: optional(number()),
    outputCost: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      inputCost: "input_cost",
      outputCost: "output_cost"
    });
  })
);
var CreateFeatureProviderMarkupsRequest$outboundSchema = object({
  markup: number()
});
var CreateFeatureParams$outboundSchema = pipe(
  object({
    name: string(),
    type: CreateFeatureTypeRequestBody$outboundSchema,
    consumable: optional(boolean()),
    display: optional(
      _lazy(() => CreateFeatureDisplayRequestBody$outboundSchema)
    ),
    creditSchema: optional(
      array(
        _lazy(() => CreateFeatureCreditSchemaRequestBody$outboundSchema)
      )
    ),
    modelMarkups: optional(
      nullable$1(record(
        string(),
        _lazy(() => CreateFeatureModelMarkupsRequest$outboundSchema)
      ))
    ),
    defaultMarkup: optional(number()),
    providerMarkups: optional(
      nullable$1(record(
        string(),
        _lazy(() => CreateFeatureProviderMarkupsRequest$outboundSchema)
      ))
    ),
    eventNames: optional(array(string())),
    featureId: string()
  }),
  transform((v) => {
    return remap(v, {
      creditSchema: "credit_schema",
      modelMarkups: "model_markups",
      defaultMarkup: "default_markup",
      providerMarkups: "provider_markups",
      eventNames: "event_names",
      featureId: "feature_id"
    });
  })
);
var CreateFeatureTypeResponse$inboundSchema = inboundSchema(CreateFeatureTypeResponse);
var CreateFeatureCreditSchemaResponse$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var CreateFeatureModelMarkupsResponse$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var CreateFeatureProviderMarkupsResponse$inboundSchema = object({
  markup: number2()
});
var CreateFeatureDisplayResponse$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var CreateFeatureResponse$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: CreateFeatureTypeResponse$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => CreateFeatureCreditSchemaResponse$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CreateFeatureModelMarkupsResponse$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CreateFeatureProviderMarkupsResponse$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => CreateFeatureDisplayResponse$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var CreatePlanPriceIntervalRequestBody = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreatePlanResetIntervalRequestBody = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreatePlanTierBehaviorRequestBody = {
  Graduated: "graduated",
  Volume: "volume"
};
var CreatePlanItemPriceIntervalRequestBody = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreatePlanBillingMethodRequestBody = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var CreatePlanOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var CreatePlanOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var CreatePlanExpiryDurationTypeRequestBody = {
  Month: "month",
  Forever: "forever"
};
var CreatePlanDurationTypeRequest = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var CreatePlanOnEndRequest = {
  Bill: "bill",
  Revert: "revert"
};
var CreatePlanPurchaseLimitIntervalRequestBody = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var CreatePlanLimitTypeRequestBody = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var CreatePlanUsageLimitIntervalRequestBody = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var CreatePlanThresholdTypeRequestBody = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var CreatePlanPriceIntervalResponse = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreatePlanType = {
  Static: "static",
  Boolean: "boolean",
  SingleUse: "single_use",
  ContinuousUse: "continuous_use",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var CreatePlanResetIntervalResponse = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreatePlanTierBehaviorResponse = {
  Graduated: "graduated",
  Volume: "volume"
};
var CreatePlanPriceItemIntervalResponse = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreatePlanBillingMethodResponse = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var CreatePlanExpiryDurationTypeResponse = {
  Month: "month",
  Forever: "forever"
};
var CreatePlanDurationTypeResponse = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var CreatePlanOnEndResponse = {
  Bill: "bill",
  Revert: "revert"
};
var CreatePlanEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var CreatePlanPurchaseLimitIntervalResponse = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var CreatePlanLimitTypeResponse = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var CreatePlanUsageLimitIntervalResponse = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var CreatePlanThresholdTypeResponse = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var CreatePlanStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var CreatePlanAttachAction = {
  Activate: "activate",
  Upgrade: "upgrade",
  Downgrade: "downgrade",
  None: "none",
  Purchase: "purchase"
};
var CreatePlanPriceIntervalRequestBody$outboundSchema = _enum(CreatePlanPriceIntervalRequestBody);
var CreatePlanPriceRequestBody$outboundSchema = pipe(
  object({
    amount: number(),
    interval: CreatePlanPriceIntervalRequestBody$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var CreatePlanResetIntervalRequestBody$outboundSchema = _enum(CreatePlanResetIntervalRequestBody);
var CreatePlanResetRequestBody$outboundSchema = pipe(
  object({
    interval: CreatePlanResetIntervalRequestBody$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var CreatePlanTierRequestBody$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var CreatePlanTierBehaviorRequestBody$outboundSchema = _enum(CreatePlanTierBehaviorRequestBody);
var CreatePlanItemPriceIntervalRequestBody$outboundSchema = _enum(
  CreatePlanItemPriceIntervalRequestBody
);
var CreatePlanBillingMethodRequestBody$outboundSchema = _enum(CreatePlanBillingMethodRequestBody);
var CreatePlanItemPriceRequestBody$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => CreatePlanTierRequestBody$outboundSchema))
    ),
    tierBehavior: optional(CreatePlanTierBehaviorRequestBody$outboundSchema),
    interval: CreatePlanItemPriceIntervalRequestBody$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: CreatePlanBillingMethodRequestBody$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var CreatePlanOnIncrease$outboundSchema = _enum(CreatePlanOnIncrease);
var CreatePlanOnDecrease$outboundSchema = _enum(CreatePlanOnDecrease);
var CreatePlanProration$outboundSchema = pipe(
  object({
    onIncrease: CreatePlanOnIncrease$outboundSchema,
    onDecrease: CreatePlanOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var CreatePlanExpiryDurationTypeRequestBody$outboundSchema = _enum(
  CreatePlanExpiryDurationTypeRequestBody
);
var CreatePlanRolloverRequestBody$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: CreatePlanExpiryDurationTypeRequestBody$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var CreatePlanPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => CreatePlanResetRequestBody$outboundSchema)),
    price: optional(
      _lazy(() => CreatePlanItemPriceRequestBody$outboundSchema)
    ),
    proration: optional(_lazy(() => CreatePlanProration$outboundSchema)),
    rollover: optional(
      _lazy(() => CreatePlanRolloverRequestBody$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreatePlanDurationTypeRequest$outboundSchema = _enum(CreatePlanDurationTypeRequest);
var CreatePlanOnEndRequest$outboundSchema = _enum(CreatePlanOnEndRequest);
var FreeTrialRequest$outboundSchema = pipe(
  object({
    durationLength: number(),
    durationType: _default(
      CreatePlanDurationTypeRequest$outboundSchema,
      "month"
    ),
    cardRequired: _default(boolean(), true),
    onEnd: optional(CreatePlanOnEndRequest$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      durationLength: "duration_length",
      durationType: "duration_type",
      cardRequired: "card_required",
      onEnd: "on_end"
    });
  })
);
var CreatePlanConfigRequest$outboundSchema = pipe(
  object({
    ignorePastDue: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      ignorePastDue: "ignore_past_due"
    });
  })
);
var CreatePlanPurchaseLimitIntervalRequestBody$outboundSchema = _enum(
  CreatePlanPurchaseLimitIntervalRequestBody
);
var CreatePlanPurchaseLimitRequest$outboundSchema = pipe(
  object({
    interval: CreatePlanPurchaseLimitIntervalRequestBody$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var CreatePlanAutoTopupRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => CreatePlanPurchaseLimitRequest$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var CreatePlanLimitTypeRequestBody$outboundSchema = _enum(CreatePlanLimitTypeRequestBody);
var CreatePlanSpendLimitRequest$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(CreatePlanLimitTypeRequestBody$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var CreatePlanUsageLimitIntervalRequestBody$outboundSchema = _enum(
  CreatePlanUsageLimitIntervalRequestBody
);
var CreatePlanUsageLimitRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: CreatePlanUsageLimitIntervalRequestBody$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreatePlanThresholdTypeRequestBody$outboundSchema = _enum(CreatePlanThresholdTypeRequestBody);
var CreatePlanUsageAlertRequestBody$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: CreatePlanThresholdTypeRequestBody$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var CreatePlanOverageAllowedRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreatePlanBillingControlsRequest$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => CreatePlanAutoTopupRequest$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => CreatePlanSpendLimitRequest$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => CreatePlanUsageLimitRequest$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => CreatePlanUsageAlertRequestBody$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => CreatePlanOverageAllowedRequest$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var CreatePlanParams$outboundSchema = pipe(
  object({
    planId: string(),
    group: _default(string(), ""),
    name: string(),
    description: optional(nullable$1(string())),
    addOn: _default(boolean(), false),
    autoEnable: _default(boolean(), false),
    price: optional(_lazy(() => CreatePlanPriceRequestBody$outboundSchema)),
    items: optional(array(_lazy(() => CreatePlanPlanItem$outboundSchema))),
    freeTrial: optional(_lazy(() => FreeTrialRequest$outboundSchema)),
    config: optional(_lazy(() => CreatePlanConfigRequest$outboundSchema)),
    billingControls: optional(
      _lazy(() => CreatePlanBillingControlsRequest$outboundSchema)
    ),
    metadata: optional(record(string(), any())),
    createInStripe: _default(boolean(), true)
  }),
  transform((v) => {
    return remap(v, {
      planId: "plan_id",
      addOn: "add_on",
      autoEnable: "auto_enable",
      freeTrial: "free_trial",
      billingControls: "billing_controls",
      createInStripe: "create_in_stripe"
    });
  })
);
var CreatePlanPriceIntervalResponse$inboundSchema = inboundSchema(CreatePlanPriceIntervalResponse);
var CreatePlanPriceDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var CreatePlanPriceResponse$inboundSchema = pipe(
  object({
    amount: number2(),
    interval: CreatePlanPriceIntervalResponse$inboundSchema,
    interval_count: optional3(number2()),
    display: optional3(_lazy(() => CreatePlanPriceDisplay$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var CreatePlanType$inboundSchema = inboundSchema(CreatePlanType);
var CreatePlanFeatureDisplay$inboundSchema = object({
  singular: string4(),
  plural: string4()
});
var CreatePlanCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var CreatePlanFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: optional(nullable$1(string4())),
    type: CreatePlanType$inboundSchema,
    display: optional(
      nullable$1(_lazy(() => CreatePlanFeatureDisplay$inboundSchema))
    ),
    credit_schema: optional(
      nullable$1(array(_lazy(() => CreatePlanCreditSchema$inboundSchema)))
    ),
    archived: optional(nullable$1(boolean2()))
  }),
  transform((v) => {
    return remap(v, {
      "credit_schema": "creditSchema"
    });
  })
);
var CreatePlanResetIntervalResponse$inboundSchema = inboundSchema(CreatePlanResetIntervalResponse);
var CreatePlanResetResponse$inboundSchema = pipe(
  object({
    interval: CreatePlanResetIntervalResponse$inboundSchema,
    interval_count: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var CreatePlanTierResponse$inboundSchema = pipe(
  object({
    to: smartUnion([number2(), string4()]),
    amount: number2(),
    flat_amount: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "flat_amount": "flatAmount"
    });
  })
);
var CreatePlanTierBehaviorResponse$inboundSchema = inboundSchema(CreatePlanTierBehaviorResponse);
var CreatePlanPriceItemIntervalResponse$inboundSchema = inboundSchema(CreatePlanPriceItemIntervalResponse);
var CreatePlanBillingMethodResponse$inboundSchema = inboundSchema(CreatePlanBillingMethodResponse);
var CreatePlanItemPriceResponse$inboundSchema = pipe(
  object({
    amount: optional3(number2()),
    tiers: optional3(
      array(_lazy(() => CreatePlanTierResponse$inboundSchema))
    ),
    tier_behavior: optional3(CreatePlanTierBehaviorResponse$inboundSchema),
    interval: CreatePlanPriceItemIntervalResponse$inboundSchema,
    interval_count: optional3(number2()),
    billing_units: number2(),
    billing_method: CreatePlanBillingMethodResponse$inboundSchema,
    max_purchase: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "tier_behavior": "tierBehavior",
      "interval_count": "intervalCount",
      "billing_units": "billingUnits",
      "billing_method": "billingMethod",
      "max_purchase": "maxPurchase"
    });
  })
);
var CreatePlanItemDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var CreatePlanExpiryDurationTypeResponse$inboundSchema = inboundSchema(CreatePlanExpiryDurationTypeResponse);
var CreatePlanRolloverResponse$inboundSchema = pipe(
  object({
    max: nullable(number2()),
    max_percentage: optional(nullable$1(number2())),
    expiry_duration_type: CreatePlanExpiryDurationTypeResponse$inboundSchema,
    expiry_duration_length: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "max_percentage": "maxPercentage",
      "expiry_duration_type": "expiryDurationType",
      "expiry_duration_length": "expiryDurationLength"
    });
  })
);
var CreatePlanItem$inboundSchema = pipe(
  object({
    feature_id: string4(),
    feature: optional3(_lazy(() => CreatePlanFeature$inboundSchema)),
    included: number2(),
    unlimited: boolean2(),
    reset: nullable(_lazy(() => CreatePlanResetResponse$inboundSchema)),
    price: nullable(
      _lazy(() => CreatePlanItemPriceResponse$inboundSchema)
    ),
    display: optional3(_lazy(() => CreatePlanItemDisplay$inboundSchema)),
    rollover: optional3(
      _lazy(() => CreatePlanRolloverResponse$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CreatePlanDurationTypeResponse$inboundSchema = inboundSchema(CreatePlanDurationTypeResponse);
var CreatePlanOnEndResponse$inboundSchema = inboundSchema(CreatePlanOnEndResponse);
var CreatePlanFreeTrialResponse$inboundSchema = pipe(
  object({
    duration_length: number2(),
    duration_type: CreatePlanDurationTypeResponse$inboundSchema,
    card_required: boolean2(),
    on_end: optional(nullable$1(CreatePlanOnEndResponse$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "duration_length": "durationLength",
      "duration_type": "durationType",
      "card_required": "cardRequired",
      "on_end": "onEnd"
    });
  })
);
var CreatePlanEnv$inboundSchema = inboundSchema(CreatePlanEnv);
var CreatePlanConfigResponse$inboundSchema = pipe(
  object({
    ignore_past_due: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "ignore_past_due": "ignorePastDue"
    });
  })
);
var CreatePlanPurchaseLimitIntervalResponse$inboundSchema = inboundSchema(CreatePlanPurchaseLimitIntervalResponse);
var CreatePlanPurchaseLimitResponse$inboundSchema = pipe(
  object({
    interval: CreatePlanPurchaseLimitIntervalResponse$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var CreatePlanAutoTopupResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(
      _lazy(() => CreatePlanPurchaseLimitResponse$inboundSchema)
    ),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var CreatePlanLimitTypeResponse$inboundSchema = inboundSchema(CreatePlanLimitTypeResponse);
var CreatePlanSpendLimitResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(CreatePlanLimitTypeResponse$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var CreatePlanUsageLimitIntervalResponse$inboundSchema = inboundSchema(CreatePlanUsageLimitIntervalResponse);
var CreatePlanUsageLimitResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: CreatePlanUsageLimitIntervalResponse$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CreatePlanThresholdTypeResponse$inboundSchema = inboundSchema(CreatePlanThresholdTypeResponse);
var CreatePlanUsageAlertResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: CreatePlanThresholdTypeResponse$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var CreatePlanOverageAllowedResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CreatePlanBillingControlsResponse$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => CreatePlanAutoTopupResponse$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => CreatePlanSpendLimitResponse$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => CreatePlanUsageLimitResponse$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => CreatePlanUsageAlertResponse$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => CreatePlanOverageAllowedResponse$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var CreatePlanStatus$inboundSchema = inboundSchema(CreatePlanStatus);
var CreatePlanAttachAction$inboundSchema = inboundSchema(CreatePlanAttachAction);
var CreatePlanCustomerEligibility$inboundSchema = pipe(
  object({
    trial_available: optional3(boolean2()),
    status: optional3(CreatePlanStatus$inboundSchema),
    canceling: optional3(boolean2()),
    trialing: optional3(boolean2()),
    attach_action: CreatePlanAttachAction$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "trial_available": "trialAvailable",
      "attach_action": "attachAction"
    });
  })
);
var CreatePlanResponse$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    description: nullable(string4()),
    group: nullable(string4()),
    version: number2(),
    add_on: boolean2(),
    auto_enable: boolean2(),
    price: nullable(_lazy(() => CreatePlanPriceResponse$inboundSchema)),
    items: array(_lazy(() => CreatePlanItem$inboundSchema)),
    free_trial: optional3(
      _lazy(() => CreatePlanFreeTrialResponse$inboundSchema)
    ),
    created_at: number2(),
    env: CreatePlanEnv$inboundSchema,
    archived: boolean2(),
    base_variant_id: nullable(string4()),
    config: _lazy(() => CreatePlanConfigResponse$inboundSchema),
    billing_controls: optional3(
      _lazy(() => CreatePlanBillingControlsResponse$inboundSchema)
    ),
    metadata: record(string(), any()),
    customer_eligibility: optional3(
      _lazy(() => CreatePlanCustomerEligibility$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "add_on": "addOn",
      "auto_enable": "autoEnable",
      "free_trial": "freeTrial",
      "created_at": "createdAt",
      "base_variant_id": "baseVariantId",
      "billing_controls": "billingControls",
      "customer_eligibility": "customerEligibility"
    });
  })
);
var CreateReferralCodeParams$outboundSchema = pipe(
  object({
    customerId: string(),
    programId: string()
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      programId: "program_id"
    });
  })
);
var CreateReferralCodeResponse$inboundSchema = pipe(
  object({
    code: string4(),
    customer_id: string4(),
    created_at: number2()
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "created_at": "createdAt"
    });
  })
);
var CreateScheduleRedirectMode = {
  Always: "always",
  IfRequired: "if_required",
  Never: "never"
};
var BillingBehavior = {
  ProrateImmediately: "prorate_immediately",
  None: "none"
};
var CreateScheduleDurationType2 = {
  Month: "month",
  Year: "year"
};
var CreateSchedulePriceInterval2 = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreateScheduleItemResetInterval2 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreateScheduleItemTierBehavior2 = {
  Graduated: "graduated",
  Volume: "volume"
};
var CreateScheduleItemPriceInterval2 = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreateScheduleItemBillingMethod2 = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var CreateScheduleItemOnIncrease2 = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var CreateScheduleItemOnDecrease2 = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var CreateScheduleItemExpiryDurationType2 = {
  Month: "month",
  Forever: "forever"
};
var CreateScheduleAddItemResetInterval2 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreateScheduleAddItemTierBehavior2 = {
  Graduated: "graduated",
  Volume: "volume"
};
var CreateScheduleAddItemPriceInterval2 = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreateScheduleAddItemBillingMethod2 = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var CreateScheduleAddItemOnIncrease2 = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var CreateScheduleAddItemOnDecrease2 = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var CreateScheduleAddItemExpiryDurationType2 = {
  Month: "month",
  Forever: "forever"
};
var CreateScheduleRemoveItemBillingMethod2 = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var CreateScheduleIntervalRemoveItemEnum4 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreateScheduleIntervalRemoveItemEnum3 = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var CreateSchedulePurchaseLimitInterval2 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var CreateScheduleLimitType2 = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var CreateScheduleUsageLimitInterval2 = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var CreateScheduleThresholdType2 = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var CreateScheduleStatus = {
  Created: "created",
  PendingPayment: "pending_payment"
};
var CreateScheduleCode = {
  ThreedsRequired: "3ds_required",
  PaymentMethodRequired: "payment_method_required",
  PaymentFailed: "payment_failed"
};
var CreateScheduleInvoiceMode$outboundSchema = pipe(
  object({
    enabled: boolean(),
    enablePlanImmediately: _default(boolean(), false),
    finalize: _default(boolean(), true),
    invoiceTemplateId: optional(string()),
    netTermsDays: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      enablePlanImmediately: "enable_plan_immediately",
      invoiceTemplateId: "invoice_template_id",
      netTermsDays: "net_terms_days"
    });
  })
);
var CreateScheduleAttachDiscount$outboundSchema = pipe(
  object({
    rewardId: optional(string()),
    promotionCode: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      rewardId: "reward_id",
      promotionCode: "promotion_code"
    });
  })
);
var CreateScheduleRedirectMode$outboundSchema = _enum(CreateScheduleRedirectMode);
var BillingBehavior$outboundSchema = _enum(BillingBehavior);
var CreateScheduleDurationType2$outboundSchema = _enum(CreateScheduleDurationType2);
var StartingAfter2$outboundSchema = pipe(
  object({
    durationType: CreateScheduleDurationType2$outboundSchema,
    durationCount: int()
  }),
  transform((v) => {
    return remap(v, {
      durationType: "duration_type",
      durationCount: "duration_count"
    });
  })
);
var CreateScheduleFeatureQuantity2$outboundSchema = pipe(
  object({
    featureId: string(),
    quantity: optional(number()),
    adjustable: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreateSchedulePriceInterval2$outboundSchema = _enum(CreateSchedulePriceInterval2);
var CreateScheduleBasePrice2$outboundSchema = pipe(
  object({
    amount: number(),
    interval: CreateSchedulePriceInterval2$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var CreateScheduleItemResetInterval2$outboundSchema = _enum(CreateScheduleItemResetInterval2);
var CreateScheduleItemReset2$outboundSchema = pipe(
  object({
    interval: CreateScheduleItemResetInterval2$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var CreateScheduleItemTier2$outboundSchema = pipe(
  object({
    to: optional(any()),
    amount: optional(any()),
    flatAmount: optional(any())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var CreateScheduleItemTierBehavior2$outboundSchema = _enum(CreateScheduleItemTierBehavior2);
var CreateScheduleItemPriceInterval2$outboundSchema = _enum(CreateScheduleItemPriceInterval2);
var CreateScheduleItemBillingMethod2$outboundSchema = _enum(CreateScheduleItemBillingMethod2);
var CreateScheduleItemPrice2$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => CreateScheduleItemTier2$outboundSchema))
    ),
    tierBehavior: optional(CreateScheduleItemTierBehavior2$outboundSchema),
    interval: CreateScheduleItemPriceInterval2$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: CreateScheduleItemBillingMethod2$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var CreateScheduleItemOnIncrease2$outboundSchema = _enum(CreateScheduleItemOnIncrease2);
var CreateScheduleItemOnDecrease2$outboundSchema = _enum(CreateScheduleItemOnDecrease2);
var CreateScheduleItemProration2$outboundSchema = pipe(
  object({
    onIncrease: CreateScheduleItemOnIncrease2$outboundSchema,
    onDecrease: CreateScheduleItemOnDecrease2$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var CreateScheduleItemExpiryDurationType2$outboundSchema = _enum(
  CreateScheduleItemExpiryDurationType2
);
var CreateScheduleItemRollover2$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: CreateScheduleItemExpiryDurationType2$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var CreateScheduleItemPlanItem2$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => CreateScheduleItemReset2$outboundSchema)),
    price: optional(_lazy(() => CreateScheduleItemPrice2$outboundSchema)),
    proration: optional(
      _lazy(() => CreateScheduleItemProration2$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => CreateScheduleItemRollover2$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreateScheduleAddItemResetInterval2$outboundSchema = _enum(CreateScheduleAddItemResetInterval2);
var CreateScheduleAddItemReset2$outboundSchema = pipe(
  object({
    interval: CreateScheduleAddItemResetInterval2$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var CreateScheduleAddItemTier2$outboundSchema = pipe(
  object({
    to: optional(any()),
    amount: optional(any()),
    flatAmount: optional(any())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var CreateScheduleAddItemTierBehavior2$outboundSchema = _enum(CreateScheduleAddItemTierBehavior2);
var CreateScheduleAddItemPriceInterval2$outboundSchema = _enum(CreateScheduleAddItemPriceInterval2);
var CreateScheduleAddItemBillingMethod2$outboundSchema = _enum(CreateScheduleAddItemBillingMethod2);
var CreateScheduleAddItemPrice2$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => CreateScheduleAddItemTier2$outboundSchema))
    ),
    tierBehavior: optional(CreateScheduleAddItemTierBehavior2$outboundSchema),
    interval: CreateScheduleAddItemPriceInterval2$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: CreateScheduleAddItemBillingMethod2$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var CreateScheduleAddItemOnIncrease2$outboundSchema = _enum(CreateScheduleAddItemOnIncrease2);
var CreateScheduleAddItemOnDecrease2$outboundSchema = _enum(CreateScheduleAddItemOnDecrease2);
var CreateScheduleAddItemProration2$outboundSchema = pipe(
  object({
    onIncrease: CreateScheduleAddItemOnIncrease2$outboundSchema,
    onDecrease: CreateScheduleAddItemOnDecrease2$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var CreateScheduleAddItemExpiryDurationType2$outboundSchema = _enum(
  CreateScheduleAddItemExpiryDurationType2
);
var CreateScheduleAddItemRollover2$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: CreateScheduleAddItemExpiryDurationType2$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var CreateScheduleAddItemPlanItem2$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => CreateScheduleAddItemReset2$outboundSchema)),
    price: optional(_lazy(() => CreateScheduleAddItemPrice2$outboundSchema)),
    proration: optional(
      _lazy(() => CreateScheduleAddItemProration2$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => CreateScheduleAddItemRollover2$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreateScheduleRemoveItemBillingMethod2$outboundSchema = _enum(
  CreateScheduleRemoveItemBillingMethod2
);
var CreateScheduleIntervalRemoveItemEnum4$outboundSchema = _enum(
  CreateScheduleIntervalRemoveItemEnum4
);
var CreateScheduleIntervalRemoveItemEnum3$outboundSchema = _enum(
  CreateScheduleIntervalRemoveItemEnum3
);
var CreateSchedulePlanItemFilter2$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    billingMethod: optional(
      CreateScheduleRemoveItemBillingMethod2$outboundSchema
    ),
    interval: optional(
      smartUnion([
        CreateScheduleIntervalRemoveItemEnum3$outboundSchema,
        CreateScheduleIntervalRemoveItemEnum4$outboundSchema
      ])
    ),
    intervalCount: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      billingMethod: "billing_method",
      intervalCount: "interval_count"
    });
  })
);
var CreateSchedulePurchaseLimitInterval2$outboundSchema = _enum(CreateSchedulePurchaseLimitInterval2);
var CreateSchedulePurchaseLimit2$outboundSchema = pipe(
  object({
    interval: CreateSchedulePurchaseLimitInterval2$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var CreateScheduleAutoTopup2$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => CreateSchedulePurchaseLimit2$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var CreateScheduleLimitType2$outboundSchema = _enum(CreateScheduleLimitType2);
var CreateScheduleSpendLimit2$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(CreateScheduleLimitType2$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var CreateScheduleUsageLimitInterval2$outboundSchema = _enum(CreateScheduleUsageLimitInterval2);
var CreateScheduleUsageLimit2$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: CreateScheduleUsageLimitInterval2$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreateScheduleThresholdType2$outboundSchema = _enum(CreateScheduleThresholdType2);
var CreateScheduleUsageAlert2$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: CreateScheduleThresholdType2$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var CreateScheduleOverageAllowed2$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var CreateScheduleBillingControls2$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => CreateScheduleAutoTopup2$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => CreateScheduleSpendLimit2$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => CreateScheduleUsageLimit2$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => CreateScheduleUsageAlert2$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => CreateScheduleOverageAllowed2$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var CreateScheduleCustomize2$outboundSchema = pipe(
  object({
    price: optional(
      nullable$1(_lazy(() => CreateScheduleBasePrice2$outboundSchema))
    ),
    items: optional(
      array(_lazy(() => CreateScheduleItemPlanItem2$outboundSchema))
    ),
    addItems: optional(
      array(_lazy(() => CreateScheduleAddItemPlanItem2$outboundSchema))
    ),
    removeItems: optional(
      array(_lazy(() => CreateSchedulePlanItemFilter2$outboundSchema))
    ),
    billingControls: optional(
      _lazy(() => CreateScheduleBillingControls2$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      addItems: "add_items",
      removeItems: "remove_items",
      billingControls: "billing_controls"
    });
  })
);
var CreateSchedulePlan2$outboundSchema = pipe(
  object({
    planId: string(),
    featureQuantities: optional(
      array(_lazy(() => CreateScheduleFeatureQuantity2$outboundSchema))
    ),
    version: optional(number()),
    customize: optional(
      _lazy(() => CreateScheduleCustomize2$outboundSchema)
    ),
    subscriptionId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      planId: "plan_id",
      featureQuantities: "feature_quantities",
      subscriptionId: "subscription_id"
    });
  })
);
var PhaseRequest2$outboundSchema = pipe(
  object({
    startsAt: optional(smartUnion([number(), string()])),
    startingAfter: optional(_lazy(() => StartingAfter2$outboundSchema)),
    plans: array(_lazy(() => CreateSchedulePlan2$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      startsAt: "starts_at",
      startingAfter: "starting_after"
    });
  })
);
var CreateScheduleParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    invoiceMode: optional(
      _lazy(() => CreateScheduleInvoiceMode$outboundSchema)
    ),
    discounts: optional(
      array(_lazy(() => CreateScheduleAttachDiscount$outboundSchema))
    ),
    successUrl: optional(string()),
    checkoutSessionParams: optional(record(string(), any())),
    redirectMode: _default(
      CreateScheduleRedirectMode$outboundSchema,
      "if_required"
    ),
    billingBehavior: optional(BillingBehavior$outboundSchema),
    billingCycleAnchor: optional(literal("now")),
    enablePlanImmediately: optional(boolean()),
    phases: array(_lazy(() => PhaseRequest2$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      invoiceMode: "invoice_mode",
      successUrl: "success_url",
      checkoutSessionParams: "checkout_session_params",
      redirectMode: "redirect_mode",
      billingBehavior: "billing_behavior",
      billingCycleAnchor: "billing_cycle_anchor",
      enablePlanImmediately: "enable_plan_immediately"
    });
  })
);
var CreateScheduleStatus$inboundSchema = inboundSchema(CreateScheduleStatus);
var PhaseResponse$inboundSchema = pipe(
  object({
    phase_id: string4(),
    starts_at: number2(),
    customer_product_ids: array(string4())
  }),
  transform((v) => {
    return remap(v, {
      "phase_id": "phaseId",
      "starts_at": "startsAt",
      "customer_product_ids": "customerProductIds"
    });
  })
);
var CreateScheduleInvoice$inboundSchema = pipe(
  object({
    status: nullable(string4()),
    stripe_id: string4(),
    total: number2(),
    currency: string4(),
    hosted_invoice_url: nullable(string4())
  }),
  transform((v) => {
    return remap(v, {
      "stripe_id": "stripeId",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var CreateScheduleCode$inboundSchema = inboundSchema(CreateScheduleCode);
var CreateScheduleRequiredAction$inboundSchema = object({
  code: CreateScheduleCode$inboundSchema,
  reason: string4()
});
var CreateScheduleResponse$inboundSchema = pipe(
  object({
    customer_id: string4(),
    entity_id: nullable(string4()),
    status: CreateScheduleStatus$inboundSchema,
    schedule_id: nullable(string4()),
    phases: array(_lazy(() => PhaseResponse$inboundSchema)),
    invoice: optional3(_lazy(() => CreateScheduleInvoice$inboundSchema)),
    payment_url: nullable(string4()),
    required_action: optional3(
      _lazy(() => CreateScheduleRequiredAction$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "schedule_id": "scheduleId",
      "payment_url": "paymentUrl",
      "required_action": "requiredAction"
    });
  })
);
var CustomerExpand = {
  Invoices: "invoices",
  TrialsUsed: "trials_used",
  Rewards: "rewards",
  Entities: "entities",
  Referrals: "referrals",
  PaymentMethod: "payment_method",
  SubscriptionsPlan: "subscriptions.plan",
  PurchasesPlan: "purchases.plan",
  BalancesFeature: "balances.feature",
  FlagsFeature: "flags.feature",
  BillingControlsAutoTopupsPurchaseLimit: "billing_controls.auto_topups.purchase_limit"
};
var CustomerExpand$outboundSchema = _enum(CustomerExpand);
var CustomerEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var CustomerPurchaseLimitInterval2 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var CustomerPurchaseLimitInterval1 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var CustomerLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var CustomerUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var CustomerThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var CustomerStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var SubscriptionScope = {
  Customer: "customer",
  Entity: "entity"
};
var PurchaseScope = {
  Customer: "customer",
  Entity: "entity"
};
var CustomerFlagsType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var ProcessorType = {
  Stripe: "stripe",
  Revenuecat: "revenuecat"
};
var CustomerEntityEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var CustomerRewardsType = {
  PercentageDiscount: "percentage_discount",
  FixedDiscount: "fixed_discount",
  FreeProduct: "free_product",
  InvoiceCredits: "invoice_credits",
  FeatureGrant: "feature_grant"
};
var CustomerDurationType = {
  OneOff: "one_off",
  Months: "months",
  Forever: "forever"
};
var CustomerEnv$inboundSchema = inboundSchema(CustomerEnv);
var CustomerPurchaseLimitInterval2$inboundSchema = inboundSchema(CustomerPurchaseLimitInterval2);
var CustomerPurchaseLimit2$inboundSchema = pipe(
  object({
    interval: nullable(CustomerPurchaseLimitInterval2$inboundSchema),
    interval_count: nullable(number2()),
    limit: nullable(number2()),
    count: number2(),
    next_reset_at: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "next_reset_at": "nextResetAt"
    });
  })
);
var CustomerPurchaseLimitInterval1$inboundSchema = inboundSchema(CustomerPurchaseLimitInterval1);
var CustomerPurchaseLimit1$inboundSchema = pipe(
  object({
    interval: CustomerPurchaseLimitInterval1$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var CustomerAutoTopup$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(smartUnion([
      _lazy(() => CustomerPurchaseLimit2$inboundSchema),
      _lazy(() => CustomerPurchaseLimit1$inboundSchema)
    ])),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var CustomerLimitType$inboundSchema = inboundSchema(CustomerLimitType);
var CustomerSpendLimit$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(CustomerLimitType$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var CustomerUsageLimitInterval$inboundSchema = inboundSchema(CustomerUsageLimitInterval);
var CustomerUsageLimit$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: CustomerUsageLimitInterval$inboundSchema,
    usage: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CustomerThresholdType$inboundSchema = inboundSchema(CustomerThresholdType);
var CustomerUsageAlert$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: CustomerThresholdType$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var CustomerOverageAllowed$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var CustomerBillingControls$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => CustomerAutoTopup$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => CustomerSpendLimit$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => CustomerUsageLimit$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => CustomerUsageAlert$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => CustomerOverageAllowed$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var CustomerStatus$inboundSchema = inboundSchema(CustomerStatus);
var SubscriptionScope$inboundSchema = inboundSchema(SubscriptionScope);
var Subscription$inboundSchema = pipe(
  object({
    id: string4(),
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    auto_enable: boolean2(),
    add_on: boolean2(),
    status: CustomerStatus$inboundSchema,
    past_due: boolean2(),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2()),
    trial_ends_at: nullable(number2()),
    started_at: number2(),
    current_period_start: nullable(number2()),
    current_period_end: nullable(number2()),
    quantity: number2(),
    scope: optional3(SubscriptionScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "auto_enable": "autoEnable",
      "add_on": "addOn",
      "past_due": "pastDue",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt",
      "trial_ends_at": "trialEndsAt",
      "started_at": "startedAt",
      "current_period_start": "currentPeriodStart",
      "current_period_end": "currentPeriodEnd"
    });
  })
);
var PurchaseScope$inboundSchema = inboundSchema(PurchaseScope);
var Purchase$inboundSchema = pipe(
  object({
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    expires_at: nullable(number2()),
    started_at: number2(),
    quantity: number2(),
    scope: optional3(PurchaseScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "started_at": "startedAt"
    });
  })
);
var CustomerFlagsType$inboundSchema = inboundSchema(CustomerFlagsType);
var CustomerCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var CustomerModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var CustomerProviderMarkups$inboundSchema = object({
  markup: number2()
});
var CustomerDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var CustomerFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: CustomerFlagsType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => CustomerCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CustomerModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => CustomerProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => CustomerDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var Flags$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => CustomerFeature$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var CustomerConfig$inboundSchema = pipe(
  object({
    disable_pooled_balance: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "disable_pooled_balance": "disablePooledBalance"
    });
  })
);
var Stripe$inboundSchema = object({
  id: string4()
});
var Vercel$inboundSchema = pipe(
  object({
    installation_id: string4(),
    account_id: string4()
  }),
  transform((v) => {
    return remap(v, {
      "installation_id": "installationId",
      "account_id": "accountId"
    });
  })
);
var Revenuecat$inboundSchema = object({
  id: nullable(string4())
});
var Processors$inboundSchema = object({
  stripe: optional3(_lazy(() => Stripe$inboundSchema)),
  vercel: optional3(_lazy(() => Vercel$inboundSchema)),
  revenuecat: optional3(_lazy(() => Revenuecat$inboundSchema))
});
var ProcessorType$inboundSchema = inboundSchema(ProcessorType);
var Invoice$inboundSchema = pipe(
  object({
    plan_ids: array(string4()),
    stripe_id: string4(),
    processor_type: _default(ProcessorType$inboundSchema, "stripe"),
    status: string4(),
    total: number2(),
    currency: string4(),
    created_at: number2(),
    hosted_invoice_url: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "plan_ids": "planIds",
      "stripe_id": "stripeId",
      "processor_type": "processorType",
      "created_at": "createdAt",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var CustomerEntityEnv$inboundSchema = inboundSchema(CustomerEntityEnv);
var Entity$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    customer_id: optional(nullable$1(string4())),
    feature_id: optional(nullable$1(string4())),
    created_at: number2(),
    env: CustomerEntityEnv$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "feature_id": "featureId",
      "created_at": "createdAt"
    });
  })
);
var TrialsUsed$inboundSchema = pipe(
  object({
    plan_id: string4(),
    customer_id: string4(),
    fingerprint: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "customer_id": "customerId"
    });
  })
);
var CustomerRewardsType$inboundSchema = inboundSchema(CustomerRewardsType);
var CustomerDurationType$inboundSchema = inboundSchema(CustomerDurationType);
var Discount$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: CustomerRewardsType$inboundSchema,
    discount_value: number2(),
    duration_type: CustomerDurationType$inboundSchema,
    duration_value: optional(nullable$1(number2())),
    currency: optional(nullable$1(string4())),
    start: optional(nullable$1(number2())),
    end: optional(nullable$1(number2())),
    subscription_id: optional(nullable$1(string4())),
    total_discount_amount: optional(nullable$1(number2()))
  }),
  transform((v) => {
    return remap(v, {
      "discount_value": "discountValue",
      "duration_type": "durationType",
      "duration_value": "durationValue",
      "subscription_id": "subscriptionId",
      "total_discount_amount": "totalDiscountAmount"
    });
  })
);
var Rewards$inboundSchema = object({
  discounts: array(_lazy(() => Discount$inboundSchema))
});
var ReferralCustomer$inboundSchema = object({
  id: string4(),
  name: optional(nullable$1(string4())),
  email: optional(nullable$1(string4()))
});
var Referral$inboundSchema = pipe(
  object({
    program_id: string4(),
    customer: _lazy(() => ReferralCustomer$inboundSchema),
    reward_applied: boolean2(),
    created_at: number2()
  }),
  transform((v) => {
    return remap(v, {
      "program_id": "programId",
      "reward_applied": "rewardApplied",
      "created_at": "createdAt"
    });
  })
);
var Customer$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    email: nullable(string4()),
    created_at: number2(),
    fingerprint: nullable(string4()),
    stripe_id: nullable(string4()),
    env: CustomerEnv$inboundSchema,
    metadata: record(string(), any()),
    send_email_receipts: boolean2(),
    billing_controls: _lazy(() => CustomerBillingControls$inboundSchema),
    subscriptions: array(_lazy(() => Subscription$inboundSchema)),
    purchases: array(_lazy(() => Purchase$inboundSchema)),
    balances: record(string(), Balance$inboundSchema),
    flags: record(string(), _lazy(() => Flags$inboundSchema)),
    config: optional3(_lazy(() => CustomerConfig$inboundSchema)),
    processors: optional3(_lazy(() => Processors$inboundSchema)),
    invoices: optional3(array(_lazy(() => Invoice$inboundSchema))),
    entities: optional3(array(_lazy(() => Entity$inboundSchema))),
    trials_used: optional3(
      array(_lazy(() => TrialsUsed$inboundSchema))
    ),
    rewards: optional(nullable$1(_lazy(() => Rewards$inboundSchema))),
    referrals: optional3(array(_lazy(() => Referral$inboundSchema))),
    payment_method: optional(nullable$1(any()))
  }),
  transform((v) => {
    return remap(v, {
      "created_at": "createdAt",
      "stripe_id": "stripeId",
      "send_email_receipts": "sendEmailReceipts",
      "billing_controls": "billingControls",
      "trials_used": "trialsUsed",
      "payment_method": "paymentMethod"
    });
  })
);
var DeleteBalanceInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var DeleteBalanceInterval$outboundSchema = _enum(DeleteBalanceInterval);
var DeleteBalanceParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    featureId: optional(string()),
    balanceId: optional(string()),
    recalculateBalances: optional(boolean()),
    interval: optional(DeleteBalanceInterval$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      featureId: "feature_id",
      balanceId: "balance_id",
      recalculateBalances: "recalculate_balances"
    });
  })
);
var DeleteBalanceResponse$inboundSchema = object({
  success: boolean2()
});
var DeleteCustomerParams$outboundSchema = pipe(
  object({
    customerId: string(),
    deleteInStripe: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      deleteInStripe: "delete_in_stripe"
    });
  })
);
var DeleteCustomerResponse$inboundSchema = object({
  success: boolean2()
});
var DeleteEntityParams$outboundSchema = pipe(
  object({
    customerId: optional(string()),
    entityId: string()
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id"
    });
  })
);
var DeleteEntityResponse$inboundSchema = object({
  success: boolean2()
});
var DeleteFeatureParams$outboundSchema = pipe(
  object({
    featureId: string()
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var DeleteFeatureResponse$inboundSchema = object({
  success: boolean2()
});
var DeletePlanParams$outboundSchema = pipe(
  object({
    planId: string(),
    allVersions: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      planId: "plan_id",
      allVersions: "all_versions"
    });
  })
);
var DeletePlanResponse$inboundSchema = object({
  success: boolean2()
});
var FinalizeLockAction = {
  Confirm: "confirm",
  Release: "release"
};
var FinalizeLockAction$outboundSchema = _enum(FinalizeLockAction);
var FinalizeBalanceParams$outboundSchema = pipe(
  object({
    lockId: string(),
    action: FinalizeLockAction$outboundSchema,
    overrideValue: optional(number()),
    properties: optional(record(string(), any()))
  }),
  transform((v) => {
    return remap(v, {
      lockId: "lock_id",
      overrideValue: "override_value"
    });
  })
);
var FinalizeLockResponseBody2$inboundSchema = object({
  success: boolean2()
});
var FinalizeLockResponseBody1$inboundSchema = object({
  success: boolean2()
});
var FinalizeLockResponse$inboundSchema = smartUnion([
  _lazy(() => FinalizeLockResponseBody1$inboundSchema),
  _lazy(() => FinalizeLockResponseBody2$inboundSchema)
]);
var GetCustomerEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var GetCustomerPurchaseLimitInterval2 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var GetCustomerPurchaseLimitInterval1 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var GetCustomerLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var GetCustomerUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var GetCustomerThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var GetCustomerStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var GetCustomerSubscriptionScope = {
  Customer: "customer",
  Entity: "entity"
};
var GetCustomerPurchaseScope = {
  Customer: "customer",
  Entity: "entity"
};
var GetCustomerFlagsType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var GetCustomerProcessorType = {
  Stripe: "stripe",
  Revenuecat: "revenuecat"
};
var GetCustomerEntityEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var GetCustomerRewardsType = {
  PercentageDiscount: "percentage_discount",
  FixedDiscount: "fixed_discount",
  FreeProduct: "free_product",
  InvoiceCredits: "invoice_credits",
  FeatureGrant: "feature_grant"
};
var GetCustomerDurationType = {
  OneOff: "one_off",
  Months: "months",
  Forever: "forever"
};
var GetCustomerParams$outboundSchema = pipe(
  object({
    customerId: string(),
    expand: optional(array(CustomerExpand$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id"
    });
  })
);
var GetCustomerEnv$inboundSchema = inboundSchema(GetCustomerEnv);
var GetCustomerPurchaseLimitInterval2$inboundSchema = inboundSchema(GetCustomerPurchaseLimitInterval2);
var GetCustomerPurchaseLimit2$inboundSchema = pipe(
  object({
    interval: nullable(GetCustomerPurchaseLimitInterval2$inboundSchema),
    interval_count: nullable(number2()),
    limit: nullable(number2()),
    count: number2(),
    next_reset_at: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "next_reset_at": "nextResetAt"
    });
  })
);
var GetCustomerPurchaseLimitInterval1$inboundSchema = inboundSchema(GetCustomerPurchaseLimitInterval1);
var GetCustomerPurchaseLimit1$inboundSchema = pipe(
  object({
    interval: GetCustomerPurchaseLimitInterval1$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var GetCustomerAutoTopup$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(smartUnion([
      _lazy(() => GetCustomerPurchaseLimit2$inboundSchema),
      _lazy(() => GetCustomerPurchaseLimit1$inboundSchema)
    ])),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var GetCustomerLimitType$inboundSchema = inboundSchema(GetCustomerLimitType);
var GetCustomerSpendLimit$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(GetCustomerLimitType$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var GetCustomerUsageLimitInterval$inboundSchema = inboundSchema(GetCustomerUsageLimitInterval);
var GetCustomerUsageLimit$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: GetCustomerUsageLimitInterval$inboundSchema,
    usage: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var GetCustomerThresholdType$inboundSchema = inboundSchema(GetCustomerThresholdType);
var GetCustomerUsageAlert$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: GetCustomerThresholdType$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var GetCustomerOverageAllowed$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var GetCustomerBillingControls$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => GetCustomerAutoTopup$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => GetCustomerSpendLimit$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => GetCustomerUsageLimit$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => GetCustomerUsageAlert$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => GetCustomerOverageAllowed$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var GetCustomerStatus$inboundSchema = inboundSchema(GetCustomerStatus);
var GetCustomerSubscriptionScope$inboundSchema = inboundSchema(GetCustomerSubscriptionScope);
var GetCustomerSubscription$inboundSchema = pipe(
  object({
    id: string4(),
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    auto_enable: boolean2(),
    add_on: boolean2(),
    status: GetCustomerStatus$inboundSchema,
    past_due: boolean2(),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2()),
    trial_ends_at: nullable(number2()),
    started_at: number2(),
    current_period_start: nullable(number2()),
    current_period_end: nullable(number2()),
    quantity: number2(),
    scope: optional3(GetCustomerSubscriptionScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "auto_enable": "autoEnable",
      "add_on": "addOn",
      "past_due": "pastDue",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt",
      "trial_ends_at": "trialEndsAt",
      "started_at": "startedAt",
      "current_period_start": "currentPeriodStart",
      "current_period_end": "currentPeriodEnd"
    });
  })
);
var GetCustomerPurchaseScope$inboundSchema = inboundSchema(GetCustomerPurchaseScope);
var GetCustomerPurchase$inboundSchema = pipe(
  object({
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    expires_at: nullable(number2()),
    started_at: number2(),
    quantity: number2(),
    scope: optional3(GetCustomerPurchaseScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "started_at": "startedAt"
    });
  })
);
var GetCustomerFlagsType$inboundSchema = inboundSchema(GetCustomerFlagsType);
var GetCustomerCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var GetCustomerModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var GetCustomerProviderMarkups$inboundSchema = object({
  markup: number2()
});
var GetCustomerDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var GetCustomerFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: GetCustomerFlagsType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => GetCustomerCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => GetCustomerModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => GetCustomerProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => GetCustomerDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var GetCustomerFlags$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => GetCustomerFeature$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var GetCustomerConfig$inboundSchema = pipe(
  object({
    disable_pooled_balance: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "disable_pooled_balance": "disablePooledBalance"
    });
  })
);
var GetCustomerStripe$inboundSchema = object({
  id: string4()
});
var GetCustomerVercel$inboundSchema = pipe(
  object({
    installation_id: string4(),
    account_id: string4()
  }),
  transform((v) => {
    return remap(v, {
      "installation_id": "installationId",
      "account_id": "accountId"
    });
  })
);
var GetCustomerRevenuecat$inboundSchema = object({
  id: nullable(string4())
});
var GetCustomerProcessors$inboundSchema = object({
  stripe: optional3(_lazy(() => GetCustomerStripe$inboundSchema)),
  vercel: optional3(_lazy(() => GetCustomerVercel$inboundSchema)),
  revenuecat: optional3(_lazy(() => GetCustomerRevenuecat$inboundSchema))
});
var GetCustomerProcessorType$inboundSchema = inboundSchema(GetCustomerProcessorType);
var GetCustomerInvoice$inboundSchema = pipe(
  object({
    plan_ids: array(string4()),
    stripe_id: string4(),
    processor_type: _default(
      GetCustomerProcessorType$inboundSchema,
      "stripe"
    ),
    status: string4(),
    total: number2(),
    currency: string4(),
    created_at: number2(),
    hosted_invoice_url: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "plan_ids": "planIds",
      "stripe_id": "stripeId",
      "processor_type": "processorType",
      "created_at": "createdAt",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var GetCustomerEntityEnv$inboundSchema = inboundSchema(GetCustomerEntityEnv);
var GetCustomerEntity$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    customer_id: optional(nullable$1(string4())),
    feature_id: optional(nullable$1(string4())),
    created_at: number2(),
    env: GetCustomerEntityEnv$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "feature_id": "featureId",
      "created_at": "createdAt"
    });
  })
);
var GetCustomerTrialsUsed$inboundSchema = pipe(
  object({
    plan_id: string4(),
    customer_id: string4(),
    fingerprint: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "customer_id": "customerId"
    });
  })
);
var GetCustomerRewardsType$inboundSchema = inboundSchema(GetCustomerRewardsType);
var GetCustomerDurationType$inboundSchema = inboundSchema(GetCustomerDurationType);
var GetCustomerDiscount$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: GetCustomerRewardsType$inboundSchema,
    discount_value: number2(),
    duration_type: GetCustomerDurationType$inboundSchema,
    duration_value: optional(nullable$1(number2())),
    currency: optional(nullable$1(string4())),
    start: optional(nullable$1(number2())),
    end: optional(nullable$1(number2())),
    subscription_id: optional(nullable$1(string4())),
    total_discount_amount: optional(nullable$1(number2()))
  }),
  transform((v) => {
    return remap(v, {
      "discount_value": "discountValue",
      "duration_type": "durationType",
      "duration_value": "durationValue",
      "subscription_id": "subscriptionId",
      "total_discount_amount": "totalDiscountAmount"
    });
  })
);
var GetCustomerRewards$inboundSchema = object({
  discounts: array(_lazy(() => GetCustomerDiscount$inboundSchema))
});
var GetCustomerCustomer$inboundSchema = object({
  id: string4(),
  name: optional(nullable$1(string4())),
  email: optional(nullable$1(string4()))
});
var GetCustomerReferral$inboundSchema = pipe(
  object({
    program_id: string4(),
    customer: _lazy(() => GetCustomerCustomer$inboundSchema),
    reward_applied: boolean2(),
    created_at: number2()
  }),
  transform((v) => {
    return remap(v, {
      "program_id": "programId",
      "reward_applied": "rewardApplied",
      "created_at": "createdAt"
    });
  })
);
var GetCustomerResponse$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    email: nullable(string4()),
    created_at: number2(),
    fingerprint: nullable(string4()),
    stripe_id: nullable(string4()),
    env: GetCustomerEnv$inboundSchema,
    metadata: record(string(), any()),
    send_email_receipts: boolean2(),
    billing_controls: _lazy(() => GetCustomerBillingControls$inboundSchema),
    subscriptions: array(_lazy(() => GetCustomerSubscription$inboundSchema)),
    purchases: array(_lazy(() => GetCustomerPurchase$inboundSchema)),
    balances: record(string(), Balance$inboundSchema),
    flags: record(string(), _lazy(() => GetCustomerFlags$inboundSchema)),
    config: optional3(_lazy(() => GetCustomerConfig$inboundSchema)),
    processors: optional3(
      _lazy(() => GetCustomerProcessors$inboundSchema)
    ),
    invoices: optional3(
      array(_lazy(() => GetCustomerInvoice$inboundSchema))
    ),
    entities: optional3(
      array(_lazy(() => GetCustomerEntity$inboundSchema))
    ),
    trials_used: optional3(
      array(_lazy(() => GetCustomerTrialsUsed$inboundSchema))
    ),
    rewards: optional(
      nullable$1(_lazy(() => GetCustomerRewards$inboundSchema))
    ),
    referrals: optional3(
      array(_lazy(() => GetCustomerReferral$inboundSchema))
    ),
    payment_method: optional(nullable$1(any()))
  }),
  transform((v) => {
    return remap(v, {
      "created_at": "createdAt",
      "stripe_id": "stripeId",
      "send_email_receipts": "sendEmailReceipts",
      "billing_controls": "billingControls",
      "trials_used": "trialsUsed",
      "payment_method": "paymentMethod"
    });
  })
);
var GetEntityEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var GetEntityStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var GetEntitySubscriptionScope = {
  Customer: "customer",
  Entity: "entity"
};
var GetEntityPurchaseScope = {
  Customer: "customer",
  Entity: "entity"
};
var GetEntityType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var GetEntityLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var GetEntityInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var GetEntityThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var GetEntityProcessorType = {
  Stripe: "stripe",
  Revenuecat: "revenuecat"
};
var GetEntityParams$outboundSchema = pipe(
  object({
    customerId: optional(string()),
    entityId: string()
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id"
    });
  })
);
var GetEntityEnv$inboundSchema = inboundSchema(GetEntityEnv);
var GetEntityStatus$inboundSchema = inboundSchema(GetEntityStatus);
var GetEntitySubscriptionScope$inboundSchema = inboundSchema(GetEntitySubscriptionScope);
var GetEntitySubscription$inboundSchema = pipe(
  object({
    id: string4(),
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    auto_enable: boolean2(),
    add_on: boolean2(),
    status: GetEntityStatus$inboundSchema,
    past_due: boolean2(),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2()),
    trial_ends_at: nullable(number2()),
    started_at: number2(),
    current_period_start: nullable(number2()),
    current_period_end: nullable(number2()),
    quantity: number2(),
    scope: optional3(GetEntitySubscriptionScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "auto_enable": "autoEnable",
      "add_on": "addOn",
      "past_due": "pastDue",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt",
      "trial_ends_at": "trialEndsAt",
      "started_at": "startedAt",
      "current_period_start": "currentPeriodStart",
      "current_period_end": "currentPeriodEnd"
    });
  })
);
var GetEntityPurchaseScope$inboundSchema = inboundSchema(GetEntityPurchaseScope);
var GetEntityPurchase$inboundSchema = pipe(
  object({
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    expires_at: nullable(number2()),
    started_at: number2(),
    quantity: number2(),
    scope: optional3(GetEntityPurchaseScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "started_at": "startedAt"
    });
  })
);
var GetEntityType$inboundSchema = inboundSchema(GetEntityType);
var GetEntityCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var GetEntityModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var GetEntityProviderMarkups$inboundSchema = object({
  markup: number2()
});
var GetEntityDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var GetEntityFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: GetEntityType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => GetEntityCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => GetEntityModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => GetEntityProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => GetEntityDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var GetEntityFlags$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => GetEntityFeature$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var GetEntityLimitType$inboundSchema = inboundSchema(GetEntityLimitType);
var GetEntitySpendLimit$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(GetEntityLimitType$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var GetEntityInterval$inboundSchema = inboundSchema(GetEntityInterval);
var GetEntityUsageLimit$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: GetEntityInterval$inboundSchema,
    usage: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var GetEntityThresholdType$inboundSchema = inboundSchema(GetEntityThresholdType);
var GetEntityUsageAlert$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: GetEntityThresholdType$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var GetEntityOverageAllowed$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var GetEntityBillingControls$inboundSchema = pipe(
  object({
    spend_limits: optional3(
      array(_lazy(() => GetEntitySpendLimit$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => GetEntityUsageLimit$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => GetEntityUsageAlert$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => GetEntityOverageAllowed$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var GetEntityProcessorType$inboundSchema = inboundSchema(GetEntityProcessorType);
var GetEntityInvoice$inboundSchema = pipe(
  object({
    plan_ids: array(string4()),
    stripe_id: string4(),
    processor_type: _default(GetEntityProcessorType$inboundSchema, "stripe"),
    status: string4(),
    total: number2(),
    currency: string4(),
    created_at: number2(),
    hosted_invoice_url: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "plan_ids": "planIds",
      "stripe_id": "stripeId",
      "processor_type": "processorType",
      "created_at": "createdAt",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var GetEntityResponse$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    customer_id: optional(nullable$1(string4())),
    feature_id: optional(nullable$1(string4())),
    created_at: number2(),
    env: GetEntityEnv$inboundSchema,
    subscriptions: array(_lazy(() => GetEntitySubscription$inboundSchema)),
    purchases: array(_lazy(() => GetEntityPurchase$inboundSchema)),
    balances: record(string(), Balance$inboundSchema),
    flags: record(string(), _lazy(() => GetEntityFlags$inboundSchema)),
    billing_controls: optional3(
      _lazy(() => GetEntityBillingControls$inboundSchema)
    ),
    invoices: optional3(
      array(_lazy(() => GetEntityInvoice$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "feature_id": "featureId",
      "created_at": "createdAt",
      "billing_controls": "billingControls"
    });
  })
);
var GetFeatureType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var GetFeatureParams$outboundSchema = pipe(
  object({
    featureId: string()
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var GetFeatureType$inboundSchema = inboundSchema(GetFeatureType);
var GetFeatureCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var GetFeatureModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var GetFeatureProviderMarkups$inboundSchema = object({
  markup: number2()
});
var GetFeatureDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var GetFeatureResponse$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: GetFeatureType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => GetFeatureCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => GetFeatureModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => GetFeatureProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => GetFeatureDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var GetOrCreateCustomerPurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var GetOrCreateCustomerLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var GetOrCreateCustomerUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var GetOrCreateCustomerThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var GetOrCreateCustomerPurchaseLimitInterval$outboundSchema = _enum(
  GetOrCreateCustomerPurchaseLimitInterval
);
var GetOrCreateCustomerPurchaseLimit$outboundSchema = pipe(
  object({
    interval: GetOrCreateCustomerPurchaseLimitInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var GetOrCreateCustomerAutoTopup$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => GetOrCreateCustomerPurchaseLimit$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var GetOrCreateCustomerLimitType$outboundSchema = _enum(GetOrCreateCustomerLimitType);
var GetOrCreateCustomerSpendLimit$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(GetOrCreateCustomerLimitType$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var GetOrCreateCustomerUsageLimitInterval$outboundSchema = _enum(
  GetOrCreateCustomerUsageLimitInterval
);
var GetOrCreateCustomerUsageLimit$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: GetOrCreateCustomerUsageLimitInterval$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var GetOrCreateCustomerThresholdType$outboundSchema = _enum(GetOrCreateCustomerThresholdType);
var GetOrCreateCustomerUsageAlert$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: GetOrCreateCustomerThresholdType$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var GetOrCreateCustomerOverageAllowed$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var GetOrCreateCustomerBillingControls$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => GetOrCreateCustomerAutoTopup$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => GetOrCreateCustomerSpendLimit$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => GetOrCreateCustomerUsageLimit$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => GetOrCreateCustomerUsageAlert$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => GetOrCreateCustomerOverageAllowed$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var GetOrCreateCustomerConfig$outboundSchema = pipe(
  object({
    disablePooledBalance: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      disablePooledBalance: "disable_pooled_balance"
    });
  })
);
var GetOrCreateCustomerParams$outboundSchema = pipe(
  object({
    customerId: nullable$1(string()),
    name: optional(nullable$1(string())),
    email: optional(nullable$1(string())),
    fingerprint: optional(nullable$1(string())),
    metadata: optional(nullable$1(record(string(), any()))),
    stripeId: optional(nullable$1(string())),
    createInStripe: optional(boolean()),
    autoEnablePlanId: optional(string()),
    sendEmailReceipts: optional(boolean()),
    billingControls: optional(
      _lazy(() => GetOrCreateCustomerBillingControls$outboundSchema)
    ),
    config: optional(_lazy(() => GetOrCreateCustomerConfig$outboundSchema)),
    expand: optional(array(CustomerExpand$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      stripeId: "stripe_id",
      createInStripe: "create_in_stripe",
      autoEnablePlanId: "auto_enable_plan_id",
      sendEmailReceipts: "send_email_receipts",
      billingControls: "billing_controls"
    });
  })
);
var GetPlanPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var GetPlanType = {
  Static: "static",
  Boolean: "boolean",
  SingleUse: "single_use",
  ContinuousUse: "continuous_use",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var GetPlanResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var GetPlanTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var GetPlanPriceItemInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var GetPlanBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var GetPlanExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var GetPlanDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var GetPlanOnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var GetPlanEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var GetPlanPurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var GetPlanLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var GetPlanUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var GetPlanThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var GetPlanStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var GetPlanAttachAction = {
  Activate: "activate",
  Upgrade: "upgrade",
  Downgrade: "downgrade",
  None: "none",
  Purchase: "purchase"
};
var GetPlanParams$outboundSchema = pipe(
  object({
    planId: string(),
    version: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      planId: "plan_id"
    });
  })
);
var GetPlanPriceInterval$inboundSchema = inboundSchema(GetPlanPriceInterval);
var GetPlanPriceDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var GetPlanPrice$inboundSchema = pipe(
  object({
    amount: number2(),
    interval: GetPlanPriceInterval$inboundSchema,
    interval_count: optional3(number2()),
    display: optional3(_lazy(() => GetPlanPriceDisplay$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var GetPlanType$inboundSchema = inboundSchema(GetPlanType);
var GetPlanFeatureDisplay$inboundSchema = object({
  singular: string4(),
  plural: string4()
});
var GetPlanCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var GetPlanFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: optional(nullable$1(string4())),
    type: GetPlanType$inboundSchema,
    display: optional(
      nullable$1(_lazy(() => GetPlanFeatureDisplay$inboundSchema))
    ),
    credit_schema: optional(
      nullable$1(array(_lazy(() => GetPlanCreditSchema$inboundSchema)))
    ),
    archived: optional(nullable$1(boolean2()))
  }),
  transform((v) => {
    return remap(v, {
      "credit_schema": "creditSchema"
    });
  })
);
var GetPlanResetInterval$inboundSchema = inboundSchema(GetPlanResetInterval);
var GetPlanReset$inboundSchema = pipe(
  object({
    interval: GetPlanResetInterval$inboundSchema,
    interval_count: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var GetPlanTier$inboundSchema = pipe(
  object({
    to: smartUnion([number2(), string4()]),
    amount: number2(),
    flat_amount: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "flat_amount": "flatAmount"
    });
  })
);
var GetPlanTierBehavior$inboundSchema = inboundSchema(GetPlanTierBehavior);
var GetPlanPriceItemInterval$inboundSchema = inboundSchema(GetPlanPriceItemInterval);
var GetPlanBillingMethod$inboundSchema = inboundSchema(GetPlanBillingMethod);
var GetPlanItemPrice$inboundSchema = pipe(
  object({
    amount: optional3(number2()),
    tiers: optional3(array(_lazy(() => GetPlanTier$inboundSchema))),
    tier_behavior: optional3(GetPlanTierBehavior$inboundSchema),
    interval: GetPlanPriceItemInterval$inboundSchema,
    interval_count: optional3(number2()),
    billing_units: number2(),
    billing_method: GetPlanBillingMethod$inboundSchema,
    max_purchase: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "tier_behavior": "tierBehavior",
      "interval_count": "intervalCount",
      "billing_units": "billingUnits",
      "billing_method": "billingMethod",
      "max_purchase": "maxPurchase"
    });
  })
);
var GetPlanItemDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var GetPlanExpiryDurationType$inboundSchema = inboundSchema(GetPlanExpiryDurationType);
var GetPlanRollover$inboundSchema = pipe(
  object({
    max: nullable(number2()),
    max_percentage: optional(nullable$1(number2())),
    expiry_duration_type: GetPlanExpiryDurationType$inboundSchema,
    expiry_duration_length: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "max_percentage": "maxPercentage",
      "expiry_duration_type": "expiryDurationType",
      "expiry_duration_length": "expiryDurationLength"
    });
  })
);
var GetPlanItem$inboundSchema = pipe(
  object({
    feature_id: string4(),
    feature: optional3(_lazy(() => GetPlanFeature$inboundSchema)),
    included: number2(),
    unlimited: boolean2(),
    reset: nullable(_lazy(() => GetPlanReset$inboundSchema)),
    price: nullable(_lazy(() => GetPlanItemPrice$inboundSchema)),
    display: optional3(_lazy(() => GetPlanItemDisplay$inboundSchema)),
    rollover: optional3(_lazy(() => GetPlanRollover$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var GetPlanDurationType$inboundSchema = inboundSchema(GetPlanDurationType);
var GetPlanOnEnd$inboundSchema = inboundSchema(GetPlanOnEnd);
var GetPlanFreeTrial$inboundSchema = pipe(
  object({
    duration_length: number2(),
    duration_type: GetPlanDurationType$inboundSchema,
    card_required: boolean2(),
    on_end: optional(nullable$1(GetPlanOnEnd$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "duration_length": "durationLength",
      "duration_type": "durationType",
      "card_required": "cardRequired",
      "on_end": "onEnd"
    });
  })
);
var GetPlanEnv$inboundSchema = inboundSchema(GetPlanEnv);
var GetPlanConfig$inboundSchema = pipe(
  object({
    ignore_past_due: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "ignore_past_due": "ignorePastDue"
    });
  })
);
var GetPlanPurchaseLimitInterval$inboundSchema = inboundSchema(GetPlanPurchaseLimitInterval);
var GetPlanPurchaseLimit$inboundSchema = pipe(
  object({
    interval: GetPlanPurchaseLimitInterval$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var GetPlanAutoTopup$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(
      _lazy(() => GetPlanPurchaseLimit$inboundSchema)
    ),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var GetPlanLimitType$inboundSchema = inboundSchema(GetPlanLimitType);
var GetPlanSpendLimit$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(GetPlanLimitType$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var GetPlanUsageLimitInterval$inboundSchema = inboundSchema(GetPlanUsageLimitInterval);
var GetPlanUsageLimit$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: GetPlanUsageLimitInterval$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var GetPlanThresholdType$inboundSchema = inboundSchema(GetPlanThresholdType);
var GetPlanUsageAlert$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: GetPlanThresholdType$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var GetPlanOverageAllowed$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var GetPlanBillingControls$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => GetPlanAutoTopup$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => GetPlanSpendLimit$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => GetPlanUsageLimit$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => GetPlanUsageAlert$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => GetPlanOverageAllowed$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var GetPlanStatus$inboundSchema = inboundSchema(GetPlanStatus);
var GetPlanAttachAction$inboundSchema = inboundSchema(GetPlanAttachAction);
var GetPlanCustomerEligibility$inboundSchema = pipe(
  object({
    trial_available: optional3(boolean2()),
    status: optional3(GetPlanStatus$inboundSchema),
    canceling: optional3(boolean2()),
    trialing: optional3(boolean2()),
    attach_action: GetPlanAttachAction$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "trial_available": "trialAvailable",
      "attach_action": "attachAction"
    });
  })
);
var GetPlanResponse$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    description: nullable(string4()),
    group: nullable(string4()),
    version: number2(),
    add_on: boolean2(),
    auto_enable: boolean2(),
    price: nullable(_lazy(() => GetPlanPrice$inboundSchema)),
    items: array(_lazy(() => GetPlanItem$inboundSchema)),
    free_trial: optional3(_lazy(() => GetPlanFreeTrial$inboundSchema)),
    created_at: number2(),
    env: GetPlanEnv$inboundSchema,
    archived: boolean2(),
    base_variant_id: nullable(string4()),
    config: _lazy(() => GetPlanConfig$inboundSchema),
    billing_controls: optional3(
      _lazy(() => GetPlanBillingControls$inboundSchema)
    ),
    metadata: record(string(), any()),
    customer_eligibility: optional3(
      _lazy(() => GetPlanCustomerEligibility$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "add_on": "addOn",
      "auto_enable": "autoEnable",
      "free_trial": "freeTrial",
      "created_at": "createdAt",
      "base_variant_id": "baseVariantId",
      "billing_controls": "billingControls",
      "customer_eligibility": "customerEligibility"
    });
  })
);
var GetRevenueCatKeysEnv = {
  Test: "test",
  Sandbox: "sandbox",
  Live: "live"
};
var GetRevenueCatKeysEnv$outboundSchema = _enum(GetRevenueCatKeysEnv);
var GetRevenueCatKeysParams$outboundSchema = pipe(
  object({
    organizationSlug: string(),
    env: GetRevenueCatKeysEnv$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      organizationSlug: "organization_slug"
    });
  })
);
var ApiKey$inboundSchema = pipe(
  catchall(
    object({
      id: string4(),
      key: string4(),
      environment: optional(nullable$1(string4())),
      app_id: optional(nullable$1(string4())),
      created_at: optional3(number2())
    }),
    any()
  ),
  transform((v) => {
    return remap(v, {
      "app_id": "appId",
      "created_at": "createdAt"
    });
  })
);
var GetRevenueCatKeysApp$inboundSchema = pipe(
  object({
    app_id: string4(),
    app_type: string4(),
    name: string4(),
    api_keys: array(_lazy(() => ApiKey$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "app_id": "appId",
      "app_type": "appType",
      "api_keys": "apiKeys"
    });
  })
);
var GetRevenueCatKeysResponse$inboundSchema = pipe(
  object({
    apps: array(_lazy(() => GetRevenueCatKeysApp$inboundSchema)),
    oauth_access_token: nullable(string4())
  }),
  transform((v) => {
    return remap(v, {
      "oauth_access_token": "oauthAccessToken"
    });
  })
);
var HTTPClientError = class extends Error {
  constructor(message, opts) {
    let msg = message;
    if (opts?.cause) {
      msg += `: ${opts.cause}`;
    }
    super(msg, opts);
    __publicField(this, "cause");
    __publicField(this, "name", "HTTPClientError");
    if (typeof this.cause === "undefined") {
      this.cause = opts?.cause;
    }
  }
};
var UnexpectedClientError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "UnexpectedClientError");
  }
};
var InvalidRequestError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "InvalidRequestError");
  }
};
var RequestAbortedError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "RequestAbortedError");
  }
};
var RequestTimeoutError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "RequestTimeoutError");
  }
};
var ConnectionError = class extends HTTPClientError {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "ConnectionError");
  }
};
var LinkRevenueCatEnv = {
  Test: "test",
  Live: "live"
};
var LinkRevenueCatEnv$outboundSchema = _enum(LinkRevenueCatEnv);
var LinkRevenueCatParams$outboundSchema = pipe(
  object({
    organizationSlug: string(),
    env: LinkRevenueCatEnv$outboundSchema,
    projectName: string(),
    redirectUrl: string()
  }),
  transform((v) => {
    return remap(v, {
      organizationSlug: "organization_slug",
      projectName: "project_name",
      redirectUrl: "redirect_url"
    });
  })
);
var LinkRevenueCatResponse$inboundSchema = pipe(
  object({
    oauth_url: string4()
  }),
  transform((v) => {
    return remap(v, {
      "oauth_url": "oauthUrl"
    });
  })
);
var ListCustomersSubscriptionStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var ListCustomersProcessor = {
  Stripe: "stripe",
  Revenuecat: "revenuecat",
  Vercel: "vercel"
};
var ListCustomersEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var ListCustomersPurchaseLimitInterval2 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var ListCustomersPurchaseLimitInterval1 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var ListCustomersLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var ListCustomersUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var ListCustomersThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var ListCustomersStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var ListCustomersSubscriptionScope = {
  Customer: "customer",
  Entity: "entity"
};
var ListCustomersPurchaseScope = {
  Customer: "customer",
  Entity: "entity"
};
var ListCustomersType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var ListCustomersPlan$outboundSchema = object({
  id: string(),
  versions: optional(array(number()))
});
var ListCustomersSubscriptionStatus$outboundSchema = _enum(ListCustomersSubscriptionStatus);
var ListCustomersProcessor$outboundSchema = _enum(ListCustomersProcessor);
var ListCustomersParams$outboundSchema = pipe(
  object({
    startCursor: _default(string(), ""),
    limit: _default(int(), 50),
    plans: optional(array(_lazy(() => ListCustomersPlan$outboundSchema))),
    subscriptionStatus: optional(
      ListCustomersSubscriptionStatus$outboundSchema
    ),
    search: optional(string()),
    processors: optional(array(ListCustomersProcessor$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      startCursor: "start_cursor",
      subscriptionStatus: "subscription_status"
    });
  })
);
var ListCustomersEnv$inboundSchema = inboundSchema(ListCustomersEnv);
var ListCustomersPurchaseLimitInterval2$inboundSchema = inboundSchema(ListCustomersPurchaseLimitInterval2);
var ListCustomersPurchaseLimit2$inboundSchema = pipe(
  object({
    interval: nullable(ListCustomersPurchaseLimitInterval2$inboundSchema),
    interval_count: nullable(number2()),
    limit: nullable(number2()),
    count: number2(),
    next_reset_at: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "next_reset_at": "nextResetAt"
    });
  })
);
var ListCustomersPurchaseLimitInterval1$inboundSchema = inboundSchema(ListCustomersPurchaseLimitInterval1);
var ListCustomersPurchaseLimit1$inboundSchema = pipe(
  object({
    interval: ListCustomersPurchaseLimitInterval1$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var ListCustomersAutoTopup$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(smartUnion([
      _lazy(() => ListCustomersPurchaseLimit2$inboundSchema),
      _lazy(() => ListCustomersPurchaseLimit1$inboundSchema)
    ])),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var ListCustomersLimitType$inboundSchema = inboundSchema(ListCustomersLimitType);
var ListCustomersSpendLimit$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(ListCustomersLimitType$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var ListCustomersUsageLimitInterval$inboundSchema = inboundSchema(ListCustomersUsageLimitInterval);
var ListCustomersUsageLimit$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: ListCustomersUsageLimitInterval$inboundSchema,
    usage: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var ListCustomersThresholdType$inboundSchema = inboundSchema(ListCustomersThresholdType);
var ListCustomersUsageAlert$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: ListCustomersThresholdType$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var ListCustomersOverageAllowed$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var ListCustomersBillingControls$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => ListCustomersAutoTopup$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => ListCustomersSpendLimit$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => ListCustomersUsageLimit$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => ListCustomersUsageAlert$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => ListCustomersOverageAllowed$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var ListCustomersStatus$inboundSchema = inboundSchema(ListCustomersStatus);
var ListCustomersSubscriptionScope$inboundSchema = inboundSchema(ListCustomersSubscriptionScope);
var ListCustomersSubscription$inboundSchema = pipe(
  object({
    id: string4(),
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    auto_enable: boolean2(),
    add_on: boolean2(),
    status: ListCustomersStatus$inboundSchema,
    past_due: boolean2(),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2()),
    trial_ends_at: nullable(number2()),
    started_at: number2(),
    current_period_start: nullable(number2()),
    current_period_end: nullable(number2()),
    quantity: number2(),
    scope: optional3(ListCustomersSubscriptionScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "auto_enable": "autoEnable",
      "add_on": "addOn",
      "past_due": "pastDue",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt",
      "trial_ends_at": "trialEndsAt",
      "started_at": "startedAt",
      "current_period_start": "currentPeriodStart",
      "current_period_end": "currentPeriodEnd"
    });
  })
);
var ListCustomersPurchaseScope$inboundSchema = inboundSchema(ListCustomersPurchaseScope);
var ListCustomersPurchase$inboundSchema = pipe(
  object({
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    expires_at: nullable(number2()),
    started_at: number2(),
    quantity: number2(),
    scope: optional3(ListCustomersPurchaseScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "started_at": "startedAt"
    });
  })
);
var ListCustomersType$inboundSchema = inboundSchema(ListCustomersType);
var ListCustomersCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var ListCustomersModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var ListCustomersProviderMarkups$inboundSchema = object({
  markup: number2()
});
var ListCustomersDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var ListCustomersFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: ListCustomersType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => ListCustomersCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => ListCustomersModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => ListCustomersProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => ListCustomersDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var ListCustomersFlags$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => ListCustomersFeature$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var ListCustomersConfig$inboundSchema = pipe(
  object({
    disable_pooled_balance: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "disable_pooled_balance": "disablePooledBalance"
    });
  })
);
var ListCustomersStripe$inboundSchema = object({
  id: string4()
});
var ListCustomersVercel$inboundSchema = pipe(
  object({
    installation_id: string4(),
    account_id: string4()
  }),
  transform((v) => {
    return remap(v, {
      "installation_id": "installationId",
      "account_id": "accountId"
    });
  })
);
var ListCustomersRevenuecat$inboundSchema = object({
  id: nullable(string4())
});
var ListCustomersProcessors$inboundSchema = object({
  stripe: optional3(_lazy(() => ListCustomersStripe$inboundSchema)),
  vercel: optional3(_lazy(() => ListCustomersVercel$inboundSchema)),
  revenuecat: optional3(
    _lazy(() => ListCustomersRevenuecat$inboundSchema)
  )
});
var ListCustomersList$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    email: nullable(string4()),
    created_at: number2(),
    fingerprint: nullable(string4()),
    stripe_id: nullable(string4()),
    env: ListCustomersEnv$inboundSchema,
    metadata: record(string(), any()),
    send_email_receipts: boolean2(),
    billing_controls: _lazy(() => ListCustomersBillingControls$inboundSchema),
    subscriptions: array(
      _lazy(() => ListCustomersSubscription$inboundSchema)
    ),
    purchases: array(_lazy(() => ListCustomersPurchase$inboundSchema)),
    balances: record(string(), Balance$inboundSchema),
    flags: record(string(), _lazy(() => ListCustomersFlags$inboundSchema)),
    config: optional3(_lazy(() => ListCustomersConfig$inboundSchema)),
    processors: optional3(
      _lazy(() => ListCustomersProcessors$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "created_at": "createdAt",
      "stripe_id": "stripeId",
      "send_email_receipts": "sendEmailReceipts",
      "billing_controls": "billingControls"
    });
  })
);
var ListCustomersResponse$inboundSchema = pipe(
  object({
    list: array(_lazy(() => ListCustomersList$inboundSchema)),
    next_cursor: nullable(string4())
  }),
  transform((v) => {
    return remap(v, {
      "next_cursor": "nextCursor"
    });
  })
);
var ListEntitiesSubscriptionStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var ListEntitiesProcessor = {
  Stripe: "stripe",
  Revenuecat: "revenuecat",
  Vercel: "vercel"
};
var ListEntitiesEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var ListEntitiesStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var ListEntitiesSubscriptionScope = {
  Customer: "customer",
  Entity: "entity"
};
var ListEntitiesPurchaseScope = {
  Customer: "customer",
  Entity: "entity"
};
var ListEntitiesType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var ListEntitiesLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var ListEntitiesInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var ListEntitiesThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var ListEntitiesProcessorType = {
  Stripe: "stripe",
  Revenuecat: "revenuecat"
};
var ListEntitiesPlan$outboundSchema = object({
  id: string(),
  versions: optional(array(number()))
});
var ListEntitiesSubscriptionStatus$outboundSchema = _enum(ListEntitiesSubscriptionStatus);
var ListEntitiesProcessor$outboundSchema = _enum(ListEntitiesProcessor);
var ListEntitiesParams$outboundSchema = pipe(
  object({
    startCursor: _default(string(), ""),
    limit: _default(int(), 50),
    plans: optional(array(_lazy(() => ListEntitiesPlan$outboundSchema))),
    subscriptionStatus: optional(
      ListEntitiesSubscriptionStatus$outboundSchema
    ),
    search: optional(string()),
    processors: optional(array(ListEntitiesProcessor$outboundSchema)),
    customerId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      startCursor: "start_cursor",
      subscriptionStatus: "subscription_status",
      customerId: "customer_id"
    });
  })
);
var ListEntitiesEnv$inboundSchema = inboundSchema(ListEntitiesEnv);
var ListEntitiesStatus$inboundSchema = inboundSchema(ListEntitiesStatus);
var ListEntitiesSubscriptionScope$inboundSchema = inboundSchema(ListEntitiesSubscriptionScope);
var ListEntitiesSubscription$inboundSchema = pipe(
  object({
    id: string4(),
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    auto_enable: boolean2(),
    add_on: boolean2(),
    status: ListEntitiesStatus$inboundSchema,
    past_due: boolean2(),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2()),
    trial_ends_at: nullable(number2()),
    started_at: number2(),
    current_period_start: nullable(number2()),
    current_period_end: nullable(number2()),
    quantity: number2(),
    scope: optional3(ListEntitiesSubscriptionScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "auto_enable": "autoEnable",
      "add_on": "addOn",
      "past_due": "pastDue",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt",
      "trial_ends_at": "trialEndsAt",
      "started_at": "startedAt",
      "current_period_start": "currentPeriodStart",
      "current_period_end": "currentPeriodEnd"
    });
  })
);
var ListEntitiesPurchaseScope$inboundSchema = inboundSchema(ListEntitiesPurchaseScope);
var ListEntitiesPurchase$inboundSchema = pipe(
  object({
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    expires_at: nullable(number2()),
    started_at: number2(),
    quantity: number2(),
    scope: optional3(ListEntitiesPurchaseScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "started_at": "startedAt"
    });
  })
);
var ListEntitiesType$inboundSchema = inboundSchema(ListEntitiesType);
var ListEntitiesCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var ListEntitiesModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var ListEntitiesProviderMarkups$inboundSchema = object({
  markup: number2()
});
var ListEntitiesDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var ListEntitiesFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: ListEntitiesType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => ListEntitiesCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => ListEntitiesModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => ListEntitiesProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => ListEntitiesDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var ListEntitiesFlags$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => ListEntitiesFeature$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var ListEntitiesLimitType$inboundSchema = inboundSchema(ListEntitiesLimitType);
var ListEntitiesSpendLimit$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(ListEntitiesLimitType$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var ListEntitiesInterval$inboundSchema = inboundSchema(ListEntitiesInterval);
var ListEntitiesUsageLimit$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: ListEntitiesInterval$inboundSchema,
    usage: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var ListEntitiesThresholdType$inboundSchema = inboundSchema(ListEntitiesThresholdType);
var ListEntitiesUsageAlert$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: ListEntitiesThresholdType$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var ListEntitiesOverageAllowed$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var ListEntitiesBillingControls$inboundSchema = pipe(
  object({
    spend_limits: optional3(
      array(_lazy(() => ListEntitiesSpendLimit$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => ListEntitiesUsageLimit$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => ListEntitiesUsageAlert$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => ListEntitiesOverageAllowed$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var ListEntitiesProcessorType$inboundSchema = inboundSchema(ListEntitiesProcessorType);
var ListEntitiesInvoice$inboundSchema = pipe(
  object({
    plan_ids: array(string4()),
    stripe_id: string4(),
    processor_type: _default(
      ListEntitiesProcessorType$inboundSchema,
      "stripe"
    ),
    status: string4(),
    total: number2(),
    currency: string4(),
    created_at: number2(),
    hosted_invoice_url: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "plan_ids": "planIds",
      "stripe_id": "stripeId",
      "processor_type": "processorType",
      "created_at": "createdAt",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var ListEntitiesList$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    customer_id: optional(nullable$1(string4())),
    feature_id: optional(nullable$1(string4())),
    created_at: number2(),
    env: ListEntitiesEnv$inboundSchema,
    subscriptions: array(
      _lazy(() => ListEntitiesSubscription$inboundSchema)
    ),
    purchases: array(_lazy(() => ListEntitiesPurchase$inboundSchema)),
    balances: record(string(), Balance$inboundSchema),
    flags: record(string(), _lazy(() => ListEntitiesFlags$inboundSchema)),
    billing_controls: optional3(
      _lazy(() => ListEntitiesBillingControls$inboundSchema)
    ),
    invoices: optional3(
      array(_lazy(() => ListEntitiesInvoice$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "feature_id": "featureId",
      "created_at": "createdAt",
      "billing_controls": "billingControls"
    });
  })
);
var ListEntitiesResponse$inboundSchema = pipe(
  object({
    list: array(_lazy(() => ListEntitiesList$inboundSchema)),
    next_cursor: nullable(string4())
  }),
  transform((v) => {
    return remap(v, {
      "next_cursor": "nextCursor"
    });
  })
);
var ListEventsIntervalEnum = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var ListEventsCustomRange$outboundSchema = object({
  start: optional(number()),
  end: optional(number())
});
var EventsListParams$outboundSchema = pipe(
  object({
    startCursor: _default(string(), ""),
    limit: _default(int(), 50),
    customerId: optional(string()),
    entityId: optional(string()),
    featureId: optional(smartUnion([string(), array(string())])),
    customRange: optional(_lazy(() => ListEventsCustomRange$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      startCursor: "start_cursor",
      customerId: "customer_id",
      entityId: "entity_id",
      featureId: "feature_id",
      customRange: "custom_range"
    });
  })
);
var ListEventsIntervalEnum$inboundSchema = inboundSchema(ListEventsIntervalEnum);
var ListEventsReset$inboundSchema = pipe(
  object({
    interval: smartUnion([
      ListEventsIntervalEnum$inboundSchema,
      string4()
    ]),
    interval_count: optional3(number2()),
    resets_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "resets_at": "resetsAt"
    });
  })
);
var Deductions$inboundSchema = pipe(
  object({
    balance_id: string4(),
    feature_id: string4(),
    plan_id: nullable(string4()),
    reset: nullable(_lazy(() => ListEventsReset$inboundSchema)),
    value: number2()
  }),
  transform((v) => {
    return remap(v, {
      "balance_id": "balanceId",
      "feature_id": "featureId",
      "plan_id": "planId"
    });
  })
);
var ListEventsList$inboundSchema = pipe(
  object({
    id: string4(),
    timestamp: number2(),
    feature_id: string4(),
    customer_id: string4(),
    value: number2(),
    properties: record(string(), any()),
    deductions: nullable(array(_lazy(() => Deductions$inboundSchema)))
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "customer_id": "customerId"
    });
  })
);
var ListEventsResponse$inboundSchema = pipe(
  object({
    list: array(_lazy(() => ListEventsList$inboundSchema)),
    next_cursor: nullable(string4())
  }),
  transform((v) => {
    return remap(v, {
      "next_cursor": "nextCursor"
    });
  })
);
var ListFeaturesType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var ListFeaturesType$inboundSchema = inboundSchema(ListFeaturesType);
var ListFeaturesCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var ListFeaturesModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var ListFeaturesProviderMarkups$inboundSchema = object({
  markup: number2()
});
var ListFeaturesDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var ListFeaturesList$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: ListFeaturesType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => ListFeaturesCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => ListFeaturesModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => ListFeaturesProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => ListFeaturesDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var ListFeaturesResponse$inboundSchema = object({
  list: array(_lazy(() => ListFeaturesList$inboundSchema))
});
var ListPlansPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var ListPlansType = {
  Static: "static",
  Boolean: "boolean",
  SingleUse: "single_use",
  ContinuousUse: "continuous_use",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var ListPlansResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var ListPlansTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var ListPlansPriceItemInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var ListPlansBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var ListPlansExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var ListPlansDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var ListPlansOnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var ListPlansEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var ListPlansPurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var ListPlansLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var ListPlansUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var ListPlansThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var ListPlansStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var ListPlansAttachAction = {
  Activate: "activate",
  Upgrade: "upgrade",
  Downgrade: "downgrade",
  None: "none",
  Purchase: "purchase"
};
var ListPlansParams$outboundSchema = pipe(
  object({
    customerId: optional(string()),
    entityId: optional(string()),
    includeArchived: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      includeArchived: "include_archived"
    });
  })
);
var ListPlansPriceInterval$inboundSchema = inboundSchema(ListPlansPriceInterval);
var ListPlansPriceDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var ListPlansPrice$inboundSchema = pipe(
  object({
    amount: number2(),
    interval: ListPlansPriceInterval$inboundSchema,
    interval_count: optional3(number2()),
    display: optional3(_lazy(() => ListPlansPriceDisplay$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var ListPlansType$inboundSchema = inboundSchema(ListPlansType);
var ListPlansFeatureDisplay$inboundSchema = object({
  singular: string4(),
  plural: string4()
});
var ListPlansCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var ListPlansFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: optional(nullable$1(string4())),
    type: ListPlansType$inboundSchema,
    display: optional(
      nullable$1(_lazy(() => ListPlansFeatureDisplay$inboundSchema))
    ),
    credit_schema: optional(
      nullable$1(array(_lazy(() => ListPlansCreditSchema$inboundSchema)))
    ),
    archived: optional(nullable$1(boolean2()))
  }),
  transform((v) => {
    return remap(v, {
      "credit_schema": "creditSchema"
    });
  })
);
var ListPlansResetInterval$inboundSchema = inboundSchema(ListPlansResetInterval);
var ListPlansReset$inboundSchema = pipe(
  object({
    interval: ListPlansResetInterval$inboundSchema,
    interval_count: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var ListPlansTier$inboundSchema = pipe(
  object({
    to: smartUnion([number2(), string4()]),
    amount: number2(),
    flat_amount: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "flat_amount": "flatAmount"
    });
  })
);
var ListPlansTierBehavior$inboundSchema = inboundSchema(ListPlansTierBehavior);
var ListPlansPriceItemInterval$inboundSchema = inboundSchema(ListPlansPriceItemInterval);
var ListPlansBillingMethod$inboundSchema = inboundSchema(ListPlansBillingMethod);
var ListPlansItemPrice$inboundSchema = pipe(
  object({
    amount: optional3(number2()),
    tiers: optional3(array(_lazy(() => ListPlansTier$inboundSchema))),
    tier_behavior: optional3(ListPlansTierBehavior$inboundSchema),
    interval: ListPlansPriceItemInterval$inboundSchema,
    interval_count: optional3(number2()),
    billing_units: number2(),
    billing_method: ListPlansBillingMethod$inboundSchema,
    max_purchase: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "tier_behavior": "tierBehavior",
      "interval_count": "intervalCount",
      "billing_units": "billingUnits",
      "billing_method": "billingMethod",
      "max_purchase": "maxPurchase"
    });
  })
);
var ListPlansItemDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var ListPlansExpiryDurationType$inboundSchema = inboundSchema(ListPlansExpiryDurationType);
var ListPlansRollover$inboundSchema = pipe(
  object({
    max: nullable(number2()),
    max_percentage: optional(nullable$1(number2())),
    expiry_duration_type: ListPlansExpiryDurationType$inboundSchema,
    expiry_duration_length: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "max_percentage": "maxPercentage",
      "expiry_duration_type": "expiryDurationType",
      "expiry_duration_length": "expiryDurationLength"
    });
  })
);
var ListPlansItem$inboundSchema = pipe(
  object({
    feature_id: string4(),
    feature: optional3(_lazy(() => ListPlansFeature$inboundSchema)),
    included: number2(),
    unlimited: boolean2(),
    reset: nullable(_lazy(() => ListPlansReset$inboundSchema)),
    price: nullable(_lazy(() => ListPlansItemPrice$inboundSchema)),
    display: optional3(_lazy(() => ListPlansItemDisplay$inboundSchema)),
    rollover: optional3(_lazy(() => ListPlansRollover$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var ListPlansDurationType$inboundSchema = inboundSchema(ListPlansDurationType);
var ListPlansOnEnd$inboundSchema = inboundSchema(ListPlansOnEnd);
var ListPlansFreeTrial$inboundSchema = pipe(
  object({
    duration_length: number2(),
    duration_type: ListPlansDurationType$inboundSchema,
    card_required: boolean2(),
    on_end: optional(nullable$1(ListPlansOnEnd$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "duration_length": "durationLength",
      "duration_type": "durationType",
      "card_required": "cardRequired",
      "on_end": "onEnd"
    });
  })
);
var ListPlansEnv$inboundSchema = inboundSchema(ListPlansEnv);
var ListPlansConfig$inboundSchema = pipe(
  object({
    ignore_past_due: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "ignore_past_due": "ignorePastDue"
    });
  })
);
var ListPlansPurchaseLimitInterval$inboundSchema = inboundSchema(ListPlansPurchaseLimitInterval);
var ListPlansPurchaseLimit$inboundSchema = pipe(
  object({
    interval: ListPlansPurchaseLimitInterval$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var ListPlansAutoTopup$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(
      _lazy(() => ListPlansPurchaseLimit$inboundSchema)
    ),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var ListPlansLimitType$inboundSchema = inboundSchema(ListPlansLimitType);
var ListPlansSpendLimit$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(ListPlansLimitType$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var ListPlansUsageLimitInterval$inboundSchema = inboundSchema(ListPlansUsageLimitInterval);
var ListPlansUsageLimit$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: ListPlansUsageLimitInterval$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var ListPlansThresholdType$inboundSchema = inboundSchema(ListPlansThresholdType);
var ListPlansUsageAlert$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: ListPlansThresholdType$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var ListPlansOverageAllowed$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var ListPlansBillingControls$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => ListPlansAutoTopup$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => ListPlansSpendLimit$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => ListPlansUsageLimit$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => ListPlansUsageAlert$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => ListPlansOverageAllowed$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var ListPlansStatus$inboundSchema = inboundSchema(ListPlansStatus);
var ListPlansAttachAction$inboundSchema = inboundSchema(ListPlansAttachAction);
var ListPlansCustomerEligibility$inboundSchema = pipe(
  object({
    trial_available: optional3(boolean2()),
    status: optional3(ListPlansStatus$inboundSchema),
    canceling: optional3(boolean2()),
    trialing: optional3(boolean2()),
    attach_action: ListPlansAttachAction$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "trial_available": "trialAvailable",
      "attach_action": "attachAction"
    });
  })
);
var ListPlansList$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    description: nullable(string4()),
    group: nullable(string4()),
    version: number2(),
    add_on: boolean2(),
    auto_enable: boolean2(),
    price: nullable(_lazy(() => ListPlansPrice$inboundSchema)),
    items: array(_lazy(() => ListPlansItem$inboundSchema)),
    free_trial: optional3(_lazy(() => ListPlansFreeTrial$inboundSchema)),
    created_at: number2(),
    env: ListPlansEnv$inboundSchema,
    archived: boolean2(),
    base_variant_id: nullable(string4()),
    config: _lazy(() => ListPlansConfig$inboundSchema),
    billing_controls: optional3(
      _lazy(() => ListPlansBillingControls$inboundSchema)
    ),
    metadata: record(string(), any()),
    customer_eligibility: optional3(
      _lazy(() => ListPlansCustomerEligibility$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "add_on": "addOn",
      "auto_enable": "autoEnable",
      "free_trial": "freeTrial",
      "created_at": "createdAt",
      "base_variant_id": "baseVariantId",
      "billing_controls": "billingControls",
      "customer_eligibility": "customerEligibility"
    });
  })
);
var ListPlansResponse$inboundSchema = object({
  list: array(_lazy(() => ListPlansList$inboundSchema))
});
var MintKeyParams$outboundSchema = pipe(
  object({
    customerId: string(),
    indefinite: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id"
    });
  })
);
var MintKeyResponse$inboundSchema = pipe(
  object({
    access_token: string4(),
    refresh_token: optional3(string4()),
    expires_at: nullable(number2()),
    refresh_expires_at: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "access_token": "accessToken",
      "refresh_token": "refreshToken",
      "expires_at": "expiresAt",
      "refresh_expires_at": "refreshExpiresAt"
    });
  })
);
var MultiAttachPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var MultiAttachResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var MultiAttachTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var MultiAttachItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var MultiAttachBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var MultiAttachOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var MultiAttachOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var MultiAttachExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var MultiAttachDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var MultiAttachOnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var MultiAttachRedirectMode = {
  Always: "always",
  IfRequired: "if_required",
  Never: "never"
};
var MultiAttachLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var MultiAttachEntityDataInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var MultiAttachThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var MultiAttachCode = {
  ThreedsRequired: "3ds_required",
  PaymentMethodRequired: "payment_method_required",
  PaymentFailed: "payment_failed"
};
var MultiAttachPriceInterval$outboundSchema = _enum(MultiAttachPriceInterval);
var MultiAttachBasePrice$outboundSchema = pipe(
  object({
    amount: number(),
    interval: MultiAttachPriceInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var MultiAttachResetInterval$outboundSchema = _enum(MultiAttachResetInterval);
var MultiAttachReset$outboundSchema = pipe(
  object({
    interval: MultiAttachResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var MultiAttachTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var MultiAttachTierBehavior$outboundSchema = _enum(MultiAttachTierBehavior);
var MultiAttachItemPriceInterval$outboundSchema = _enum(MultiAttachItemPriceInterval);
var MultiAttachBillingMethod$outboundSchema = _enum(MultiAttachBillingMethod);
var MultiAttachPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(array(_lazy(() => MultiAttachTier$outboundSchema))),
    tierBehavior: optional(MultiAttachTierBehavior$outboundSchema),
    interval: MultiAttachItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: MultiAttachBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var MultiAttachOnIncrease$outboundSchema = _enum(MultiAttachOnIncrease);
var MultiAttachOnDecrease$outboundSchema = _enum(MultiAttachOnDecrease);
var MultiAttachProration$outboundSchema = pipe(
  object({
    onIncrease: MultiAttachOnIncrease$outboundSchema,
    onDecrease: MultiAttachOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var MultiAttachExpiryDurationType$outboundSchema = _enum(MultiAttachExpiryDurationType);
var MultiAttachRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: MultiAttachExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var MultiAttachPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => MultiAttachReset$outboundSchema)),
    price: optional(_lazy(() => MultiAttachPrice$outboundSchema)),
    proration: optional(_lazy(() => MultiAttachProration$outboundSchema)),
    rollover: optional(_lazy(() => MultiAttachRollover$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var MultiAttachCustomize$outboundSchema = object({
  price: optional(
    nullable$1(_lazy(() => MultiAttachBasePrice$outboundSchema))
  ),
  items: optional(array(_lazy(() => MultiAttachPlanItem$outboundSchema)))
});
var MultiAttachFeatureQuantity$outboundSchema = pipe(
  object({
    featureId: string(),
    quantity: optional(number()),
    adjustable: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var MultiAttachPlan$outboundSchema = pipe(
  object({
    planId: string(),
    customize: optional(_lazy(() => MultiAttachCustomize$outboundSchema)),
    featureQuantities: optional(
      array(_lazy(() => MultiAttachFeatureQuantity$outboundSchema))
    ),
    version: optional(number()),
    subscriptionId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      planId: "plan_id",
      featureQuantities: "feature_quantities",
      subscriptionId: "subscription_id"
    });
  })
);
var MultiAttachDurationType$outboundSchema = _enum(MultiAttachDurationType);
var MultiAttachOnEnd$outboundSchema = _enum(MultiAttachOnEnd);
var MultiAttachFreeTrialParams$outboundSchema = pipe(
  object({
    durationLength: number(),
    durationType: _default(MultiAttachDurationType$outboundSchema, "month"),
    cardRequired: _default(boolean(), true),
    onEnd: optional(MultiAttachOnEnd$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      durationLength: "duration_length",
      durationType: "duration_type",
      cardRequired: "card_required",
      onEnd: "on_end"
    });
  })
);
var MultiAttachInvoiceMode$outboundSchema = pipe(
  object({
    enabled: boolean(),
    enablePlanImmediately: _default(boolean(), false),
    finalize: _default(boolean(), true),
    invoiceTemplateId: optional(string()),
    netTermsDays: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      enablePlanImmediately: "enable_plan_immediately",
      invoiceTemplateId: "invoice_template_id",
      netTermsDays: "net_terms_days"
    });
  })
);
var MultiAttachAttachDiscount$outboundSchema = pipe(
  object({
    rewardId: optional(string()),
    promotionCode: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      rewardId: "reward_id",
      promotionCode: "promotion_code"
    });
  })
);
var MultiAttachRedirectMode$outboundSchema = _enum(MultiAttachRedirectMode);
var MultiAttachLimitType$outboundSchema = _enum(MultiAttachLimitType);
var MultiAttachSpendLimit$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(MultiAttachLimitType$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var MultiAttachEntityDataInterval$outboundSchema = _enum(MultiAttachEntityDataInterval);
var MultiAttachUsageLimit$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: MultiAttachEntityDataInterval$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var MultiAttachThresholdType$outboundSchema = _enum(MultiAttachThresholdType);
var MultiAttachUsageAlert$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: MultiAttachThresholdType$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var MultiAttachOverageAllowed$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var MultiAttachBillingControls$outboundSchema = pipe(
  object({
    spendLimits: optional(
      array(_lazy(() => MultiAttachSpendLimit$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => MultiAttachUsageLimit$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => MultiAttachUsageAlert$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => MultiAttachOverageAllowed$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var MultiAttachEntityData$outboundSchema = pipe(
  object({
    featureId: string(),
    name: optional(string()),
    billingControls: optional(
      _lazy(() => MultiAttachBillingControls$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      billingControls: "billing_controls"
    });
  })
);
var MultiAttachParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    plans: array(_lazy(() => MultiAttachPlan$outboundSchema)),
    freeTrial: optional(
      nullable$1(_lazy(() => MultiAttachFreeTrialParams$outboundSchema))
    ),
    invoiceMode: optional(
      _lazy(() => MultiAttachInvoiceMode$outboundSchema)
    ),
    discounts: optional(
      array(_lazy(() => MultiAttachAttachDiscount$outboundSchema))
    ),
    successUrl: optional(string()),
    checkoutSessionParams: optional(record(string(), any())),
    redirectMode: _default(
      MultiAttachRedirectMode$outboundSchema,
      "if_required"
    ),
    newBillingSubscription: optional(boolean()),
    enablePlanImmediately: optional(boolean()),
    customerData: optional(CustomerData$outboundSchema),
    entityData: optional(_lazy(() => MultiAttachEntityData$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      freeTrial: "free_trial",
      invoiceMode: "invoice_mode",
      successUrl: "success_url",
      checkoutSessionParams: "checkout_session_params",
      redirectMode: "redirect_mode",
      newBillingSubscription: "new_billing_subscription",
      enablePlanImmediately: "enable_plan_immediately",
      customerData: "customer_data",
      entityData: "entity_data"
    });
  })
);
var MultiAttachInvoice$inboundSchema = pipe(
  object({
    status: nullable(string4()),
    stripe_id: string4(),
    total: number2(),
    currency: string4(),
    hosted_invoice_url: nullable(string4())
  }),
  transform((v) => {
    return remap(v, {
      "stripe_id": "stripeId",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var MultiAttachCode$inboundSchema = inboundSchema(MultiAttachCode);
var MultiAttachRequiredAction$inboundSchema = object({
  code: MultiAttachCode$inboundSchema,
  reason: string4()
});
var MultiAttachResponse$inboundSchema = pipe(
  object({
    customer_id: string4(),
    entity_id: optional3(string4()),
    invoice: optional3(_lazy(() => MultiAttachInvoice$inboundSchema)),
    payment_url: nullable(string4()),
    required_action: optional3(
      _lazy(() => MultiAttachRequiredAction$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "payment_url": "paymentUrl",
      "required_action": "requiredAction"
    });
  })
);
var OpenCustomerPortalParams$outboundSchema = pipe(
  object({
    customerId: string(),
    configurationId: optional(string()),
    returnUrl: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      configurationId: "configuration_id",
      returnUrl: "return_url"
    });
  })
);
var OpenCustomerPortalResponse$inboundSchema = pipe(
  object({
    customer_id: string4(),
    url: string4()
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId"
    });
  })
);
var PreviewAttachPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewAttachItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewAttachItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var PreviewAttachItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewAttachItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var PreviewAttachItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var PreviewAttachItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var PreviewAttachItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var PreviewAttachAddItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewAttachAddItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var PreviewAttachAddItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewAttachAddItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var PreviewAttachAddItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var PreviewAttachAddItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var PreviewAttachAddItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var PreviewAttachRemoveItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var PreviewAttachIntervalRemoveItemEnum2 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewAttachIntervalRemoveItemEnum1 = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewAttachDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var PreviewAttachOnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var PreviewAttachPurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var PreviewAttachLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var PreviewAttachUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var PreviewAttachThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var PreviewAttachProrationBehavior = {
  ProrateImmediately: "prorate_immediately",
  None: "none"
};
var PreviewAttachRedirectMode = {
  Always: "always",
  IfRequired: "if_required",
  Never: "never"
};
var PreviewAttachPlanSchedule = {
  Immediate: "immediate",
  EndOfCycle: "end_of_cycle"
};
var PreviewAttachCheckoutType = {
  StripeCheckout: "stripe_checkout",
  AutumnCheckout: "autumn_checkout"
};
var PreviewAttachStatus = {
  Complete: "complete",
  Incomplete: "incomplete"
};
var PreviewAttachFeatureQuantityRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    quantity: optional(number()),
    adjustable: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewAttachPriceInterval$outboundSchema = _enum(PreviewAttachPriceInterval);
var PreviewAttachBasePrice$outboundSchema = pipe(
  object({
    amount: number(),
    interval: PreviewAttachPriceInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewAttachItemResetInterval$outboundSchema = _enum(PreviewAttachItemResetInterval);
var PreviewAttachItemReset$outboundSchema = pipe(
  object({
    interval: PreviewAttachItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewAttachItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var PreviewAttachItemTierBehavior$outboundSchema = _enum(PreviewAttachItemTierBehavior);
var PreviewAttachItemPriceInterval$outboundSchema = _enum(PreviewAttachItemPriceInterval);
var PreviewAttachItemBillingMethod$outboundSchema = _enum(PreviewAttachItemBillingMethod);
var PreviewAttachItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => PreviewAttachItemTier$outboundSchema))
    ),
    tierBehavior: optional(PreviewAttachItemTierBehavior$outboundSchema),
    interval: PreviewAttachItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: PreviewAttachItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var PreviewAttachItemOnIncrease$outboundSchema = _enum(PreviewAttachItemOnIncrease);
var PreviewAttachItemOnDecrease$outboundSchema = _enum(PreviewAttachItemOnDecrease);
var PreviewAttachItemProration$outboundSchema = pipe(
  object({
    onIncrease: PreviewAttachItemOnIncrease$outboundSchema,
    onDecrease: PreviewAttachItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var PreviewAttachItemExpiryDurationType$outboundSchema = _enum(PreviewAttachItemExpiryDurationType);
var PreviewAttachItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: PreviewAttachItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var PreviewAttachItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => PreviewAttachItemReset$outboundSchema)),
    price: optional(_lazy(() => PreviewAttachItemPrice$outboundSchema)),
    proration: optional(
      _lazy(() => PreviewAttachItemProration$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => PreviewAttachItemRollover$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewAttachAddItemResetInterval$outboundSchema = _enum(PreviewAttachAddItemResetInterval);
var PreviewAttachAddItemReset$outboundSchema = pipe(
  object({
    interval: PreviewAttachAddItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewAttachAddItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var PreviewAttachAddItemTierBehavior$outboundSchema = _enum(PreviewAttachAddItemTierBehavior);
var PreviewAttachAddItemPriceInterval$outboundSchema = _enum(PreviewAttachAddItemPriceInterval);
var PreviewAttachAddItemBillingMethod$outboundSchema = _enum(PreviewAttachAddItemBillingMethod);
var PreviewAttachAddItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => PreviewAttachAddItemTier$outboundSchema))
    ),
    tierBehavior: optional(PreviewAttachAddItemTierBehavior$outboundSchema),
    interval: PreviewAttachAddItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: PreviewAttachAddItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var PreviewAttachAddItemOnIncrease$outboundSchema = _enum(PreviewAttachAddItemOnIncrease);
var PreviewAttachAddItemOnDecrease$outboundSchema = _enum(PreviewAttachAddItemOnDecrease);
var PreviewAttachAddItemProration$outboundSchema = pipe(
  object({
    onIncrease: PreviewAttachAddItemOnIncrease$outboundSchema,
    onDecrease: PreviewAttachAddItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var PreviewAttachAddItemExpiryDurationType$outboundSchema = _enum(
  PreviewAttachAddItemExpiryDurationType
);
var PreviewAttachAddItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: PreviewAttachAddItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var PreviewAttachAddItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => PreviewAttachAddItemReset$outboundSchema)),
    price: optional(_lazy(() => PreviewAttachAddItemPrice$outboundSchema)),
    proration: optional(
      _lazy(() => PreviewAttachAddItemProration$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => PreviewAttachAddItemRollover$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewAttachRemoveItemBillingMethod$outboundSchema = _enum(PreviewAttachRemoveItemBillingMethod);
var PreviewAttachIntervalRemoveItemEnum2$outboundSchema = _enum(PreviewAttachIntervalRemoveItemEnum2);
var PreviewAttachIntervalRemoveItemEnum1$outboundSchema = _enum(PreviewAttachIntervalRemoveItemEnum1);
var PreviewAttachPlanItemFilter$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    billingMethod: optional(
      PreviewAttachRemoveItemBillingMethod$outboundSchema
    ),
    interval: optional(
      smartUnion([
        PreviewAttachIntervalRemoveItemEnum1$outboundSchema,
        PreviewAttachIntervalRemoveItemEnum2$outboundSchema
      ])
    ),
    intervalCount: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      billingMethod: "billing_method",
      intervalCount: "interval_count"
    });
  })
);
var PreviewAttachDurationType$outboundSchema = _enum(PreviewAttachDurationType);
var PreviewAttachOnEnd$outboundSchema = _enum(PreviewAttachOnEnd);
var PreviewAttachFreeTrialParams$outboundSchema = pipe(
  object({
    durationLength: number(),
    durationType: _default(PreviewAttachDurationType$outboundSchema, "month"),
    cardRequired: _default(boolean(), true),
    onEnd: optional(PreviewAttachOnEnd$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      durationLength: "duration_length",
      durationType: "duration_type",
      cardRequired: "card_required",
      onEnd: "on_end"
    });
  })
);
var PreviewAttachPurchaseLimitInterval$outboundSchema = _enum(PreviewAttachPurchaseLimitInterval);
var PreviewAttachPurchaseLimit$outboundSchema = pipe(
  object({
    interval: PreviewAttachPurchaseLimitInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewAttachAutoTopup$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => PreviewAttachPurchaseLimit$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var PreviewAttachLimitType$outboundSchema = _enum(PreviewAttachLimitType);
var PreviewAttachSpendLimit$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(PreviewAttachLimitType$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var PreviewAttachUsageLimitInterval$outboundSchema = _enum(PreviewAttachUsageLimitInterval);
var PreviewAttachUsageLimit$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: PreviewAttachUsageLimitInterval$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewAttachThresholdType$outboundSchema = _enum(PreviewAttachThresholdType);
var PreviewAttachUsageAlert$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: PreviewAttachThresholdType$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var PreviewAttachOverageAllowed$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewAttachBillingControls$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => PreviewAttachAutoTopup$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => PreviewAttachSpendLimit$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => PreviewAttachUsageLimit$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => PreviewAttachUsageAlert$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => PreviewAttachOverageAllowed$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var PreviewAttachCustomize$outboundSchema = pipe(
  object({
    price: optional(
      nullable$1(_lazy(() => PreviewAttachBasePrice$outboundSchema))
    ),
    items: optional(
      array(_lazy(() => PreviewAttachItemPlanItem$outboundSchema))
    ),
    addItems: optional(
      array(_lazy(() => PreviewAttachAddItemPlanItem$outboundSchema))
    ),
    removeItems: optional(
      array(_lazy(() => PreviewAttachPlanItemFilter$outboundSchema))
    ),
    freeTrial: optional(
      nullable$1(_lazy(() => PreviewAttachFreeTrialParams$outboundSchema))
    ),
    billingControls: optional(
      _lazy(() => PreviewAttachBillingControls$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      addItems: "add_items",
      removeItems: "remove_items",
      freeTrial: "free_trial",
      billingControls: "billing_controls"
    });
  })
);
var PreviewAttachInvoiceMode$outboundSchema = pipe(
  object({
    enabled: boolean(),
    enablePlanImmediately: _default(boolean(), false),
    finalize: _default(boolean(), true),
    invoiceTemplateId: optional(string()),
    netTermsDays: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      enablePlanImmediately: "enable_plan_immediately",
      invoiceTemplateId: "invoice_template_id",
      netTermsDays: "net_terms_days"
    });
  })
);
var PreviewAttachProrationBehavior$outboundSchema = _enum(PreviewAttachProrationBehavior);
var PreviewAttachRedirectMode$outboundSchema = _enum(PreviewAttachRedirectMode);
var PreviewAttachAttachDiscount$outboundSchema = pipe(
  object({
    rewardId: optional(string()),
    promotionCode: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      rewardId: "reward_id",
      promotionCode: "promotion_code"
    });
  })
);
var PreviewAttachPlanSchedule$outboundSchema = _enum(PreviewAttachPlanSchedule);
var PreviewAttachCustomLineItem$outboundSchema = object({
  amount: number(),
  description: string()
});
var PreviewAttachCarryOverBalances$outboundSchema = pipe(
  object({
    enabled: boolean(),
    featureIds: optional(array(string()))
  }),
  transform((v) => {
    return remap(v, {
      featureIds: "feature_ids"
    });
  })
);
var PreviewAttachCarryOverUsages$outboundSchema = pipe(
  object({
    enabled: boolean(),
    featureIds: optional(array(string()))
  }),
  transform((v) => {
    return remap(v, {
      featureIds: "feature_ids"
    });
  })
);
var PreviewAttachParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    planId: string(),
    featureQuantities: optional(
      array(_lazy(() => PreviewAttachFeatureQuantityRequest$outboundSchema))
    ),
    version: optional(number()),
    customize: optional(_lazy(() => PreviewAttachCustomize$outboundSchema)),
    invoiceMode: optional(
      _lazy(() => PreviewAttachInvoiceMode$outboundSchema)
    ),
    prorationBehavior: optional(
      PreviewAttachProrationBehavior$outboundSchema
    ),
    redirectMode: _default(
      PreviewAttachRedirectMode$outboundSchema,
      "if_required"
    ),
    subscriptionId: optional(string()),
    discounts: optional(
      array(_lazy(() => PreviewAttachAttachDiscount$outboundSchema))
    ),
    successUrl: optional(string()),
    newBillingSubscription: optional(boolean()),
    billingCycleAnchor: optional(literal("now")),
    planSchedule: optional(PreviewAttachPlanSchedule$outboundSchema),
    startsAt: optional(int()),
    endsAt: optional(int()),
    checkoutSessionParams: optional(record(string(), any())),
    longLivedCheckout: optional(boolean()),
    customLineItems: optional(
      array(_lazy(() => PreviewAttachCustomLineItem$outboundSchema))
    ),
    processorSubscriptionId: optional(string()),
    carryOverBalances: optional(
      _lazy(() => PreviewAttachCarryOverBalances$outboundSchema)
    ),
    carryOverUsages: optional(
      _lazy(() => PreviewAttachCarryOverUsages$outboundSchema)
    ),
    metadata: optional(record(string(), string())),
    noBillingChanges: optional(boolean()),
    enablePlanImmediately: optional(boolean()),
    taxRateId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      planId: "plan_id",
      featureQuantities: "feature_quantities",
      invoiceMode: "invoice_mode",
      prorationBehavior: "proration_behavior",
      redirectMode: "redirect_mode",
      subscriptionId: "subscription_id",
      successUrl: "success_url",
      newBillingSubscription: "new_billing_subscription",
      billingCycleAnchor: "billing_cycle_anchor",
      planSchedule: "plan_schedule",
      startsAt: "starts_at",
      endsAt: "ends_at",
      checkoutSessionParams: "checkout_session_params",
      longLivedCheckout: "long_lived_checkout",
      customLineItems: "custom_line_items",
      processorSubscriptionId: "processor_subscription_id",
      carryOverBalances: "carry_over_balances",
      carryOverUsages: "carry_over_usages",
      noBillingChanges: "no_billing_changes",
      enablePlanImmediately: "enable_plan_immediately",
      taxRateId: "tax_rate_id"
    });
  })
);
var PreviewAttachDiscount$inboundSchema = pipe(
  object({
    amount_off: number2(),
    percent_off: optional3(number2()),
    reward_id: optional3(string4()),
    reward_name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "amount_off": "amountOff",
      "percent_off": "percentOff",
      "reward_id": "rewardId",
      "reward_name": "rewardName"
    });
  })
);
var PreviewAttachLineItemPeriod$inboundSchema = object({
  start: number2(),
  end: number2()
});
var PreviewAttachLineItem$inboundSchema = pipe(
  object({
    display_name: string4(),
    description: string4(),
    subtotal: number2(),
    total: number2(),
    discounts: optional3(
      array(_lazy(() => PreviewAttachDiscount$inboundSchema))
    ),
    plan_id: string4(),
    feature_id: nullable(string4()),
    period: optional3(
      _lazy(() => PreviewAttachLineItemPeriod$inboundSchema)
    ),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "display_name": "displayName",
      "plan_id": "planId",
      "feature_id": "featureId"
    });
  })
);
var PreviewAttachNextCycleDiscount$inboundSchema = pipe(
  object({
    amount_off: number2(),
    percent_off: optional3(number2()),
    reward_id: optional3(string4()),
    reward_name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "amount_off": "amountOff",
      "percent_off": "percentOff",
      "reward_id": "rewardId",
      "reward_name": "rewardName"
    });
  })
);
var PreviewAttachNextCycleLineItemPeriod$inboundSchema = object({
  start: number2(),
  end: number2()
});
var PreviewAttachNextCycleLineItem$inboundSchema = pipe(
  object({
    display_name: string4(),
    description: string4(),
    subtotal: number2(),
    total: number2(),
    discounts: optional3(
      array(_lazy(() => PreviewAttachNextCycleDiscount$inboundSchema))
    ),
    plan_id: string4(),
    feature_id: nullable(string4()),
    period: optional3(
      _lazy(() => PreviewAttachNextCycleLineItemPeriod$inboundSchema)
    ),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "display_name": "displayName",
      "plan_id": "planId",
      "feature_id": "featureId"
    });
  })
);
var PreviewAttachUsageLineItemPeriod$inboundSchema = object({
  start: number2(),
  end: number2()
});
var PreviewAttachUsageLineItem$inboundSchema = pipe(
  object({
    display_name: string4(),
    plan_id: string4(),
    feature_id: nullable(string4()),
    period: optional3(
      _lazy(() => PreviewAttachUsageLineItemPeriod$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "display_name": "displayName",
      "plan_id": "planId",
      "feature_id": "featureId"
    });
  })
);
var PreviewAttachNextCycle$inboundSchema = pipe(
  object({
    starts_at: number2(),
    subtotal: number2(),
    total: number2(),
    line_items: array(
      _lazy(() => PreviewAttachNextCycleLineItem$inboundSchema)
    ),
    usage_line_items: array(
      _lazy(() => PreviewAttachUsageLineItem$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "starts_at": "startsAt",
      "line_items": "lineItems",
      "usage_line_items": "usageLineItems"
    });
  })
);
var PreviewAttachIncomingFeatureQuantity$inboundSchema = pipe(
  object({
    feature_id: string4(),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var PreviewAttachIncoming$inboundSchema = pipe(
  object({
    plan_id: string4(),
    plan: optional3(Plan$inboundSchema),
    feature_quantities: array(
      _lazy(() => PreviewAttachIncomingFeatureQuantity$inboundSchema)
    ),
    effective_at: nullable(number2()),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "feature_quantities": "featureQuantities",
      "effective_at": "effectiveAt",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt"
    });
  })
);
var PreviewAttachOutgoingFeatureQuantity$inboundSchema = pipe(
  object({
    feature_id: string4(),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var PreviewAttachOutgoing$inboundSchema = pipe(
  object({
    plan_id: string4(),
    plan: optional3(Plan$inboundSchema),
    feature_quantities: array(
      _lazy(() => PreviewAttachOutgoingFeatureQuantity$inboundSchema)
    ),
    effective_at: nullable(number2()),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "feature_quantities": "featureQuantities",
      "effective_at": "effectiveAt",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt"
    });
  })
);
var PreviewAttachCheckoutType$inboundSchema = inboundSchema(PreviewAttachCheckoutType);
var PreviewAttachStatus$inboundSchema = inboundSchema(PreviewAttachStatus);
var PreviewAttachTax$inboundSchema = pipe(
  object({
    total: number2(),
    amount_inclusive: number2(),
    amount_exclusive: number2(),
    currency: string4(),
    status: PreviewAttachStatus$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "amount_inclusive": "amountInclusive",
      "amount_exclusive": "amountExclusive"
    });
  })
);
var PreviewAttachInvoiceCredits$inboundSchema = object({
  balance: number2(),
  currency: string4()
});
var PreviewAttachResponse$inboundSchema = pipe(
  object({
    customer_id: string4(),
    line_items: array(_lazy(() => PreviewAttachLineItem$inboundSchema)),
    subtotal: number2(),
    total: number2(),
    currency: string4(),
    next_cycle: optional3(
      _lazy(() => PreviewAttachNextCycle$inboundSchema)
    ),
    expand: optional3(array(string4())),
    incoming: array(_lazy(() => PreviewAttachIncoming$inboundSchema)),
    outgoing: array(_lazy(() => PreviewAttachOutgoing$inboundSchema)),
    redirect_to_checkout: boolean2(),
    checkout_type: nullable(PreviewAttachCheckoutType$inboundSchema),
    tax: optional3(_lazy(() => PreviewAttachTax$inboundSchema)),
    invoice_credits: optional3(
      _lazy(() => PreviewAttachInvoiceCredits$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "line_items": "lineItems",
      "next_cycle": "nextCycle",
      "redirect_to_checkout": "redirectToCheckout",
      "checkout_type": "checkoutType",
      "invoice_credits": "invoiceCredits"
    });
  })
);
var PreviewMultiAttachPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewMultiAttachResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewMultiAttachTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var PreviewMultiAttachItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewMultiAttachBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var PreviewMultiAttachOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var PreviewMultiAttachOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var PreviewMultiAttachExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var PreviewMultiAttachDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var PreviewMultiAttachOnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var PreviewMultiAttachRedirectMode = {
  Always: "always",
  IfRequired: "if_required",
  Never: "never"
};
var PreviewMultiAttachLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var PreviewMultiAttachEntityDataInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var PreviewMultiAttachThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var PreviewMultiAttachCheckoutType = {
  StripeCheckout: "stripe_checkout",
  AutumnCheckout: "autumn_checkout"
};
var PreviewMultiAttachStatus = {
  Complete: "complete",
  Incomplete: "incomplete"
};
var PreviewMultiAttachPriceInterval$outboundSchema = _enum(PreviewMultiAttachPriceInterval);
var PreviewMultiAttachBasePrice$outboundSchema = pipe(
  object({
    amount: number(),
    interval: PreviewMultiAttachPriceInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewMultiAttachResetInterval$outboundSchema = _enum(PreviewMultiAttachResetInterval);
var PreviewMultiAttachReset$outboundSchema = pipe(
  object({
    interval: PreviewMultiAttachResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewMultiAttachTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var PreviewMultiAttachTierBehavior$outboundSchema = _enum(PreviewMultiAttachTierBehavior);
var PreviewMultiAttachItemPriceInterval$outboundSchema = _enum(PreviewMultiAttachItemPriceInterval);
var PreviewMultiAttachBillingMethod$outboundSchema = _enum(PreviewMultiAttachBillingMethod);
var PreviewMultiAttachPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => PreviewMultiAttachTier$outboundSchema))
    ),
    tierBehavior: optional(PreviewMultiAttachTierBehavior$outboundSchema),
    interval: PreviewMultiAttachItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: PreviewMultiAttachBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var PreviewMultiAttachOnIncrease$outboundSchema = _enum(PreviewMultiAttachOnIncrease);
var PreviewMultiAttachOnDecrease$outboundSchema = _enum(PreviewMultiAttachOnDecrease);
var PreviewMultiAttachProration$outboundSchema = pipe(
  object({
    onIncrease: PreviewMultiAttachOnIncrease$outboundSchema,
    onDecrease: PreviewMultiAttachOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var PreviewMultiAttachExpiryDurationType$outboundSchema = _enum(PreviewMultiAttachExpiryDurationType);
var PreviewMultiAttachRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: PreviewMultiAttachExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var PreviewMultiAttachPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => PreviewMultiAttachReset$outboundSchema)),
    price: optional(_lazy(() => PreviewMultiAttachPrice$outboundSchema)),
    proration: optional(
      _lazy(() => PreviewMultiAttachProration$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => PreviewMultiAttachRollover$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewMultiAttachCustomize$outboundSchema = object({
  price: optional(
    nullable$1(_lazy(() => PreviewMultiAttachBasePrice$outboundSchema))
  ),
  items: optional(
    array(_lazy(() => PreviewMultiAttachPlanItem$outboundSchema))
  )
});
var PreviewMultiAttachPlanFeatureQuantity$outboundSchema = pipe(
  object({
    featureId: string(),
    quantity: optional(number()),
    adjustable: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewMultiAttachPlan$outboundSchema = pipe(
  object({
    planId: string(),
    customize: optional(
      _lazy(() => PreviewMultiAttachCustomize$outboundSchema)
    ),
    featureQuantities: optional(
      array(
        _lazy(() => PreviewMultiAttachPlanFeatureQuantity$outboundSchema)
      )
    ),
    version: optional(number()),
    subscriptionId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      planId: "plan_id",
      featureQuantities: "feature_quantities",
      subscriptionId: "subscription_id"
    });
  })
);
var PreviewMultiAttachDurationType$outboundSchema = _enum(PreviewMultiAttachDurationType);
var PreviewMultiAttachOnEnd$outboundSchema = _enum(PreviewMultiAttachOnEnd);
var PreviewMultiAttachFreeTrialParams$outboundSchema = pipe(
  object({
    durationLength: number(),
    durationType: _default(
      PreviewMultiAttachDurationType$outboundSchema,
      "month"
    ),
    cardRequired: _default(boolean(), true),
    onEnd: optional(PreviewMultiAttachOnEnd$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      durationLength: "duration_length",
      durationType: "duration_type",
      cardRequired: "card_required",
      onEnd: "on_end"
    });
  })
);
var PreviewMultiAttachInvoiceMode$outboundSchema = pipe(
  object({
    enabled: boolean(),
    enablePlanImmediately: _default(boolean(), false),
    finalize: _default(boolean(), true),
    invoiceTemplateId: optional(string()),
    netTermsDays: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      enablePlanImmediately: "enable_plan_immediately",
      invoiceTemplateId: "invoice_template_id",
      netTermsDays: "net_terms_days"
    });
  })
);
var PreviewMultiAttachAttachDiscount$outboundSchema = pipe(
  object({
    rewardId: optional(string()),
    promotionCode: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      rewardId: "reward_id",
      promotionCode: "promotion_code"
    });
  })
);
var PreviewMultiAttachRedirectMode$outboundSchema = _enum(PreviewMultiAttachRedirectMode);
var PreviewMultiAttachLimitType$outboundSchema = _enum(PreviewMultiAttachLimitType);
var PreviewMultiAttachSpendLimit$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(PreviewMultiAttachLimitType$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var PreviewMultiAttachEntityDataInterval$outboundSchema = _enum(PreviewMultiAttachEntityDataInterval);
var PreviewMultiAttachUsageLimit$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: PreviewMultiAttachEntityDataInterval$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewMultiAttachThresholdType$outboundSchema = _enum(PreviewMultiAttachThresholdType);
var PreviewMultiAttachUsageAlert$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: PreviewMultiAttachThresholdType$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var PreviewMultiAttachOverageAllowed$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewMultiAttachBillingControls$outboundSchema = pipe(
  object({
    spendLimits: optional(
      array(_lazy(() => PreviewMultiAttachSpendLimit$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => PreviewMultiAttachUsageLimit$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => PreviewMultiAttachUsageAlert$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => PreviewMultiAttachOverageAllowed$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var PreviewMultiAttachEntityData$outboundSchema = pipe(
  object({
    featureId: string(),
    name: optional(string()),
    billingControls: optional(
      _lazy(() => PreviewMultiAttachBillingControls$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      billingControls: "billing_controls"
    });
  })
);
var PreviewMultiAttachParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    plans: array(_lazy(() => PreviewMultiAttachPlan$outboundSchema)),
    freeTrial: optional(
      nullable$1(
        _lazy(() => PreviewMultiAttachFreeTrialParams$outboundSchema)
      )
    ),
    invoiceMode: optional(
      _lazy(() => PreviewMultiAttachInvoiceMode$outboundSchema)
    ),
    discounts: optional(
      array(_lazy(() => PreviewMultiAttachAttachDiscount$outboundSchema))
    ),
    successUrl: optional(string()),
    checkoutSessionParams: optional(record(string(), any())),
    redirectMode: _default(
      PreviewMultiAttachRedirectMode$outboundSchema,
      "if_required"
    ),
    newBillingSubscription: optional(boolean()),
    enablePlanImmediately: optional(boolean()),
    customerData: optional(CustomerData$outboundSchema),
    entityData: optional(
      _lazy(() => PreviewMultiAttachEntityData$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      freeTrial: "free_trial",
      invoiceMode: "invoice_mode",
      successUrl: "success_url",
      checkoutSessionParams: "checkout_session_params",
      redirectMode: "redirect_mode",
      newBillingSubscription: "new_billing_subscription",
      enablePlanImmediately: "enable_plan_immediately",
      customerData: "customer_data",
      entityData: "entity_data"
    });
  })
);
var PreviewMultiAttachDiscount$inboundSchema = pipe(
  object({
    amount_off: number2(),
    percent_off: optional3(number2()),
    reward_id: optional3(string4()),
    reward_name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "amount_off": "amountOff",
      "percent_off": "percentOff",
      "reward_id": "rewardId",
      "reward_name": "rewardName"
    });
  })
);
var PreviewMultiAttachLineItemPeriod$inboundSchema = object({
  start: number2(),
  end: number2()
});
var PreviewMultiAttachLineItem$inboundSchema = pipe(
  object({
    display_name: string4(),
    description: string4(),
    subtotal: number2(),
    total: number2(),
    discounts: optional3(
      array(_lazy(() => PreviewMultiAttachDiscount$inboundSchema))
    ),
    plan_id: string4(),
    feature_id: nullable(string4()),
    period: optional3(
      _lazy(() => PreviewMultiAttachLineItemPeriod$inboundSchema)
    ),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "display_name": "displayName",
      "plan_id": "planId",
      "feature_id": "featureId"
    });
  })
);
var PreviewMultiAttachNextCycleDiscount$inboundSchema = pipe(
  object({
    amount_off: number2(),
    percent_off: optional3(number2()),
    reward_id: optional3(string4()),
    reward_name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "amount_off": "amountOff",
      "percent_off": "percentOff",
      "reward_id": "rewardId",
      "reward_name": "rewardName"
    });
  })
);
var PreviewMultiAttachNextCycleLineItemPeriod$inboundSchema = object({
  start: number2(),
  end: number2()
});
var PreviewMultiAttachNextCycleLineItem$inboundSchema = pipe(
  object({
    display_name: string4(),
    description: string4(),
    subtotal: number2(),
    total: number2(),
    discounts: optional3(
      array(_lazy(() => PreviewMultiAttachNextCycleDiscount$inboundSchema))
    ),
    plan_id: string4(),
    feature_id: nullable(string4()),
    period: optional3(
      _lazy(() => PreviewMultiAttachNextCycleLineItemPeriod$inboundSchema)
    ),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "display_name": "displayName",
      "plan_id": "planId",
      "feature_id": "featureId"
    });
  })
);
var PreviewMultiAttachUsageLineItemPeriod$inboundSchema = object({
  start: number2(),
  end: number2()
});
var PreviewMultiAttachUsageLineItem$inboundSchema = pipe(
  object({
    display_name: string4(),
    plan_id: string4(),
    feature_id: nullable(string4()),
    period: optional3(
      _lazy(() => PreviewMultiAttachUsageLineItemPeriod$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "display_name": "displayName",
      "plan_id": "planId",
      "feature_id": "featureId"
    });
  })
);
var PreviewMultiAttachNextCycle$inboundSchema = pipe(
  object({
    starts_at: number2(),
    subtotal: number2(),
    total: number2(),
    line_items: array(
      _lazy(() => PreviewMultiAttachNextCycleLineItem$inboundSchema)
    ),
    usage_line_items: array(
      _lazy(() => PreviewMultiAttachUsageLineItem$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "starts_at": "startsAt",
      "line_items": "lineItems",
      "usage_line_items": "usageLineItems"
    });
  })
);
var PreviewMultiAttachIncomingFeatureQuantity$inboundSchema = pipe(
  object({
    feature_id: string4(),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var PreviewMultiAttachIncoming$inboundSchema = pipe(
  object({
    plan_id: string4(),
    plan: optional3(Plan$inboundSchema),
    feature_quantities: array(
      _lazy(() => PreviewMultiAttachIncomingFeatureQuantity$inboundSchema)
    ),
    effective_at: nullable(number2()),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "feature_quantities": "featureQuantities",
      "effective_at": "effectiveAt",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt"
    });
  })
);
var PreviewMultiAttachOutgoingFeatureQuantity$inboundSchema = pipe(
  object({
    feature_id: string4(),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var PreviewMultiAttachOutgoing$inboundSchema = pipe(
  object({
    plan_id: string4(),
    plan: optional3(Plan$inboundSchema),
    feature_quantities: array(
      _lazy(() => PreviewMultiAttachOutgoingFeatureQuantity$inboundSchema)
    ),
    effective_at: nullable(number2()),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "feature_quantities": "featureQuantities",
      "effective_at": "effectiveAt",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt"
    });
  })
);
var PreviewMultiAttachCheckoutType$inboundSchema = inboundSchema(PreviewMultiAttachCheckoutType);
var PreviewMultiAttachStatus$inboundSchema = inboundSchema(PreviewMultiAttachStatus);
var PreviewMultiAttachTax$inboundSchema = pipe(
  object({
    total: number2(),
    amount_inclusive: number2(),
    amount_exclusive: number2(),
    currency: string4(),
    status: PreviewMultiAttachStatus$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "amount_inclusive": "amountInclusive",
      "amount_exclusive": "amountExclusive"
    });
  })
);
var PreviewMultiAttachInvoiceCredits$inboundSchema = object({
  balance: number2(),
  currency: string4()
});
var PreviewMultiAttachResponse$inboundSchema = pipe(
  object({
    customer_id: string4(),
    line_items: array(_lazy(() => PreviewMultiAttachLineItem$inboundSchema)),
    subtotal: number2(),
    total: number2(),
    currency: string4(),
    next_cycle: optional3(
      _lazy(() => PreviewMultiAttachNextCycle$inboundSchema)
    ),
    expand: optional3(array(string4())),
    incoming: array(_lazy(() => PreviewMultiAttachIncoming$inboundSchema)),
    outgoing: array(_lazy(() => PreviewMultiAttachOutgoing$inboundSchema)),
    redirect_to_checkout: boolean2(),
    checkout_type: nullable(PreviewMultiAttachCheckoutType$inboundSchema),
    tax: optional3(_lazy(() => PreviewMultiAttachTax$inboundSchema)),
    invoice_credits: optional3(
      _lazy(() => PreviewMultiAttachInvoiceCredits$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "line_items": "lineItems",
      "next_cycle": "nextCycle",
      "redirect_to_checkout": "redirectToCheckout",
      "checkout_type": "checkoutType",
      "invoice_credits": "invoiceCredits"
    });
  })
);
var PreviewUpdatePriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewUpdateItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewUpdateItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var PreviewUpdateItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewUpdateItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var PreviewUpdateItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var PreviewUpdateItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var PreviewUpdateItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var PreviewUpdateAddItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewUpdateAddItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var PreviewUpdateAddItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewUpdateAddItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var PreviewUpdateAddItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var PreviewUpdateAddItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var PreviewUpdateAddItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var PreviewUpdateRemoveItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var PreviewUpdateIntervalRemoveItemEnum2 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewUpdateIntervalRemoveItemEnum1 = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var PreviewUpdateDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var PreviewUpdateOnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var PreviewUpdatePurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var PreviewUpdateLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var PreviewUpdateUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var PreviewUpdateThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var PreviewUpdateProrationBehavior = {
  ProrateImmediately: "prorate_immediately",
  None: "none"
};
var PreviewUpdateRedirectMode = {
  Always: "always",
  IfRequired: "if_required",
  Never: "never"
};
var PreviewUpdateCancelAction = {
  CancelImmediately: "cancel_immediately",
  CancelEndOfCycle: "cancel_end_of_cycle",
  Uncancel: "uncancel"
};
var Intent = {
  UpdatePlan: "update_plan",
  UpdateQuantity: "update_quantity",
  CancelImmediately: "cancel_immediately",
  CancelEndOfCycle: "cancel_end_of_cycle",
  Uncancel: "uncancel",
  None: "none"
};
var PreviewUpdateStatus = {
  Complete: "complete",
  Incomplete: "incomplete"
};
var PreviewUpdateFeatureQuantityRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    quantity: optional(number()),
    adjustable: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewUpdatePriceInterval$outboundSchema = _enum(PreviewUpdatePriceInterval);
var PreviewUpdateBasePrice$outboundSchema = pipe(
  object({
    amount: number(),
    interval: PreviewUpdatePriceInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewUpdateItemResetInterval$outboundSchema = _enum(PreviewUpdateItemResetInterval);
var PreviewUpdateItemReset$outboundSchema = pipe(
  object({
    interval: PreviewUpdateItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewUpdateItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var PreviewUpdateItemTierBehavior$outboundSchema = _enum(PreviewUpdateItemTierBehavior);
var PreviewUpdateItemPriceInterval$outboundSchema = _enum(PreviewUpdateItemPriceInterval);
var PreviewUpdateItemBillingMethod$outboundSchema = _enum(PreviewUpdateItemBillingMethod);
var PreviewUpdateItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => PreviewUpdateItemTier$outboundSchema))
    ),
    tierBehavior: optional(PreviewUpdateItemTierBehavior$outboundSchema),
    interval: PreviewUpdateItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: PreviewUpdateItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var PreviewUpdateItemOnIncrease$outboundSchema = _enum(PreviewUpdateItemOnIncrease);
var PreviewUpdateItemOnDecrease$outboundSchema = _enum(PreviewUpdateItemOnDecrease);
var PreviewUpdateItemProration$outboundSchema = pipe(
  object({
    onIncrease: PreviewUpdateItemOnIncrease$outboundSchema,
    onDecrease: PreviewUpdateItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var PreviewUpdateItemExpiryDurationType$outboundSchema = _enum(PreviewUpdateItemExpiryDurationType);
var PreviewUpdateItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: PreviewUpdateItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var PreviewUpdateItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => PreviewUpdateItemReset$outboundSchema)),
    price: optional(_lazy(() => PreviewUpdateItemPrice$outboundSchema)),
    proration: optional(
      _lazy(() => PreviewUpdateItemProration$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => PreviewUpdateItemRollover$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewUpdateAddItemResetInterval$outboundSchema = _enum(PreviewUpdateAddItemResetInterval);
var PreviewUpdateAddItemReset$outboundSchema = pipe(
  object({
    interval: PreviewUpdateAddItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewUpdateAddItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var PreviewUpdateAddItemTierBehavior$outboundSchema = _enum(PreviewUpdateAddItemTierBehavior);
var PreviewUpdateAddItemPriceInterval$outboundSchema = _enum(PreviewUpdateAddItemPriceInterval);
var PreviewUpdateAddItemBillingMethod$outboundSchema = _enum(PreviewUpdateAddItemBillingMethod);
var PreviewUpdateAddItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => PreviewUpdateAddItemTier$outboundSchema))
    ),
    tierBehavior: optional(PreviewUpdateAddItemTierBehavior$outboundSchema),
    interval: PreviewUpdateAddItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: PreviewUpdateAddItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var PreviewUpdateAddItemOnIncrease$outboundSchema = _enum(PreviewUpdateAddItemOnIncrease);
var PreviewUpdateAddItemOnDecrease$outboundSchema = _enum(PreviewUpdateAddItemOnDecrease);
var PreviewUpdateAddItemProration$outboundSchema = pipe(
  object({
    onIncrease: PreviewUpdateAddItemOnIncrease$outboundSchema,
    onDecrease: PreviewUpdateAddItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var PreviewUpdateAddItemExpiryDurationType$outboundSchema = _enum(
  PreviewUpdateAddItemExpiryDurationType
);
var PreviewUpdateAddItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: PreviewUpdateAddItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var PreviewUpdateAddItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => PreviewUpdateAddItemReset$outboundSchema)),
    price: optional(_lazy(() => PreviewUpdateAddItemPrice$outboundSchema)),
    proration: optional(
      _lazy(() => PreviewUpdateAddItemProration$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => PreviewUpdateAddItemRollover$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewUpdateRemoveItemBillingMethod$outboundSchema = _enum(PreviewUpdateRemoveItemBillingMethod);
var PreviewUpdateIntervalRemoveItemEnum2$outboundSchema = _enum(PreviewUpdateIntervalRemoveItemEnum2);
var PreviewUpdateIntervalRemoveItemEnum1$outboundSchema = _enum(PreviewUpdateIntervalRemoveItemEnum1);
var PreviewUpdatePlanItemFilter$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    billingMethod: optional(
      PreviewUpdateRemoveItemBillingMethod$outboundSchema
    ),
    interval: optional(
      smartUnion([
        PreviewUpdateIntervalRemoveItemEnum1$outboundSchema,
        PreviewUpdateIntervalRemoveItemEnum2$outboundSchema
      ])
    ),
    intervalCount: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      billingMethod: "billing_method",
      intervalCount: "interval_count"
    });
  })
);
var PreviewUpdateDurationType$outboundSchema = _enum(PreviewUpdateDurationType);
var PreviewUpdateOnEnd$outboundSchema = _enum(PreviewUpdateOnEnd);
var PreviewUpdateFreeTrialParams$outboundSchema = pipe(
  object({
    durationLength: number(),
    durationType: _default(PreviewUpdateDurationType$outboundSchema, "month"),
    cardRequired: _default(boolean(), true),
    onEnd: optional(PreviewUpdateOnEnd$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      durationLength: "duration_length",
      durationType: "duration_type",
      cardRequired: "card_required",
      onEnd: "on_end"
    });
  })
);
var PreviewUpdatePurchaseLimitInterval$outboundSchema = _enum(PreviewUpdatePurchaseLimitInterval);
var PreviewUpdatePurchaseLimit$outboundSchema = pipe(
  object({
    interval: PreviewUpdatePurchaseLimitInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var PreviewUpdateAutoTopup$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => PreviewUpdatePurchaseLimit$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var PreviewUpdateLimitType$outboundSchema = _enum(PreviewUpdateLimitType);
var PreviewUpdateSpendLimit$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(PreviewUpdateLimitType$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var PreviewUpdateUsageLimitInterval$outboundSchema = _enum(PreviewUpdateUsageLimitInterval);
var PreviewUpdateUsageLimit$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: PreviewUpdateUsageLimitInterval$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewUpdateThresholdType$outboundSchema = _enum(PreviewUpdateThresholdType);
var PreviewUpdateUsageAlert$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: PreviewUpdateThresholdType$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var PreviewUpdateOverageAllowed$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var PreviewUpdateBillingControls$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => PreviewUpdateAutoTopup$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => PreviewUpdateSpendLimit$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => PreviewUpdateUsageLimit$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => PreviewUpdateUsageAlert$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => PreviewUpdateOverageAllowed$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var PreviewUpdateCustomize$outboundSchema = pipe(
  object({
    price: optional(
      nullable$1(_lazy(() => PreviewUpdateBasePrice$outboundSchema))
    ),
    items: optional(
      array(_lazy(() => PreviewUpdateItemPlanItem$outboundSchema))
    ),
    addItems: optional(
      array(_lazy(() => PreviewUpdateAddItemPlanItem$outboundSchema))
    ),
    removeItems: optional(
      array(_lazy(() => PreviewUpdatePlanItemFilter$outboundSchema))
    ),
    freeTrial: optional(
      nullable$1(_lazy(() => PreviewUpdateFreeTrialParams$outboundSchema))
    ),
    billingControls: optional(
      _lazy(() => PreviewUpdateBillingControls$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      addItems: "add_items",
      removeItems: "remove_items",
      freeTrial: "free_trial",
      billingControls: "billing_controls"
    });
  })
);
var PreviewUpdateInvoiceMode$outboundSchema = pipe(
  object({
    enabled: boolean(),
    enablePlanImmediately: _default(boolean(), false),
    finalize: _default(boolean(), true),
    invoiceTemplateId: optional(string()),
    netTermsDays: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      enablePlanImmediately: "enable_plan_immediately",
      invoiceTemplateId: "invoice_template_id",
      netTermsDays: "net_terms_days"
    });
  })
);
var PreviewUpdateProrationBehavior$outboundSchema = _enum(PreviewUpdateProrationBehavior);
var PreviewUpdateRedirectMode$outboundSchema = _enum(PreviewUpdateRedirectMode);
var PreviewUpdateAttachDiscount$outboundSchema = pipe(
  object({
    rewardId: optional(string()),
    promotionCode: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      rewardId: "reward_id",
      promotionCode: "promotion_code"
    });
  })
);
var PreviewUpdateCancelAction$outboundSchema = _enum(PreviewUpdateCancelAction);
var PreviewUpdateRecalculateBalances$outboundSchema = object({
  enabled: boolean()
});
var PreviewUpdateCarryOverUsages$outboundSchema = pipe(
  object({
    enabled: boolean(),
    featureIds: optional(array(string()))
  }),
  transform((v) => {
    return remap(v, {
      featureIds: "feature_ids"
    });
  })
);
var PreviewUpdateParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    planId: optional(string()),
    featureQuantities: optional(
      array(_lazy(() => PreviewUpdateFeatureQuantityRequest$outboundSchema))
    ),
    version: optional(number()),
    customize: optional(_lazy(() => PreviewUpdateCustomize$outboundSchema)),
    invoiceMode: optional(
      _lazy(() => PreviewUpdateInvoiceMode$outboundSchema)
    ),
    prorationBehavior: optional(
      PreviewUpdateProrationBehavior$outboundSchema
    ),
    redirectMode: _default(
      PreviewUpdateRedirectMode$outboundSchema,
      "if_required"
    ),
    subscriptionId: optional(string()),
    discounts: optional(
      array(_lazy(() => PreviewUpdateAttachDiscount$outboundSchema))
    ),
    cancelAction: optional(PreviewUpdateCancelAction$outboundSchema),
    billingCycleAnchor: optional(literal("now")),
    noBillingChanges: optional(boolean()),
    recalculateBalances: optional(
      _lazy(() => PreviewUpdateRecalculateBalances$outboundSchema)
    ),
    carryOverUsages: optional(
      _lazy(() => PreviewUpdateCarryOverUsages$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      planId: "plan_id",
      featureQuantities: "feature_quantities",
      invoiceMode: "invoice_mode",
      prorationBehavior: "proration_behavior",
      redirectMode: "redirect_mode",
      subscriptionId: "subscription_id",
      cancelAction: "cancel_action",
      billingCycleAnchor: "billing_cycle_anchor",
      noBillingChanges: "no_billing_changes",
      recalculateBalances: "recalculate_balances",
      carryOverUsages: "carry_over_usages"
    });
  })
);
var PreviewUpdateDiscount$inboundSchema = pipe(
  object({
    amount_off: number2(),
    percent_off: optional3(number2()),
    reward_id: optional3(string4()),
    reward_name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "amount_off": "amountOff",
      "percent_off": "percentOff",
      "reward_id": "rewardId",
      "reward_name": "rewardName"
    });
  })
);
var PreviewUpdateLineItemPeriod$inboundSchema = object({
  start: number2(),
  end: number2()
});
var PreviewUpdateLineItem$inboundSchema = pipe(
  object({
    display_name: string4(),
    description: string4(),
    subtotal: number2(),
    total: number2(),
    discounts: optional3(
      array(_lazy(() => PreviewUpdateDiscount$inboundSchema))
    ),
    plan_id: string4(),
    feature_id: nullable(string4()),
    period: optional3(
      _lazy(() => PreviewUpdateLineItemPeriod$inboundSchema)
    ),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "display_name": "displayName",
      "plan_id": "planId",
      "feature_id": "featureId"
    });
  })
);
var PreviewUpdateNextCycleDiscount$inboundSchema = pipe(
  object({
    amount_off: number2(),
    percent_off: optional3(number2()),
    reward_id: optional3(string4()),
    reward_name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "amount_off": "amountOff",
      "percent_off": "percentOff",
      "reward_id": "rewardId",
      "reward_name": "rewardName"
    });
  })
);
var PreviewUpdateNextCycleLineItemPeriod$inboundSchema = object({
  start: number2(),
  end: number2()
});
var PreviewUpdateNextCycleLineItem$inboundSchema = pipe(
  object({
    display_name: string4(),
    description: string4(),
    subtotal: number2(),
    total: number2(),
    discounts: optional3(
      array(_lazy(() => PreviewUpdateNextCycleDiscount$inboundSchema))
    ),
    plan_id: string4(),
    feature_id: nullable(string4()),
    period: optional3(
      _lazy(() => PreviewUpdateNextCycleLineItemPeriod$inboundSchema)
    ),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "display_name": "displayName",
      "plan_id": "planId",
      "feature_id": "featureId"
    });
  })
);
var PreviewUpdateUsageLineItemPeriod$inboundSchema = object({
  start: number2(),
  end: number2()
});
var PreviewUpdateUsageLineItem$inboundSchema = pipe(
  object({
    display_name: string4(),
    plan_id: string4(),
    feature_id: nullable(string4()),
    period: optional3(
      _lazy(() => PreviewUpdateUsageLineItemPeriod$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "display_name": "displayName",
      "plan_id": "planId",
      "feature_id": "featureId"
    });
  })
);
var PreviewUpdateNextCycle$inboundSchema = pipe(
  object({
    starts_at: number2(),
    subtotal: number2(),
    total: number2(),
    line_items: array(
      _lazy(() => PreviewUpdateNextCycleLineItem$inboundSchema)
    ),
    usage_line_items: array(
      _lazy(() => PreviewUpdateUsageLineItem$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "starts_at": "startsAt",
      "line_items": "lineItems",
      "usage_line_items": "usageLineItems"
    });
  })
);
var PreviewUpdateIncomingFeatureQuantity$inboundSchema = pipe(
  object({
    feature_id: string4(),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var PreviewUpdateIncoming$inboundSchema = pipe(
  object({
    plan_id: string4(),
    plan: optional3(Plan$inboundSchema),
    feature_quantities: array(
      _lazy(() => PreviewUpdateIncomingFeatureQuantity$inboundSchema)
    ),
    effective_at: nullable(number2()),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "feature_quantities": "featureQuantities",
      "effective_at": "effectiveAt",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt"
    });
  })
);
var PreviewUpdateOutgoingFeatureQuantity$inboundSchema = pipe(
  object({
    feature_id: string4(),
    quantity: number2()
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var PreviewUpdateOutgoing$inboundSchema = pipe(
  object({
    plan_id: string4(),
    plan: optional3(Plan$inboundSchema),
    feature_quantities: array(
      _lazy(() => PreviewUpdateOutgoingFeatureQuantity$inboundSchema)
    ),
    effective_at: nullable(number2()),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "feature_quantities": "featureQuantities",
      "effective_at": "effectiveAt",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt"
    });
  })
);
var Intent$inboundSchema = inboundSchema(Intent);
var PreviewUpdateStatus$inboundSchema = inboundSchema(PreviewUpdateStatus);
var PreviewUpdateTax$inboundSchema = pipe(
  object({
    total: number2(),
    amount_inclusive: number2(),
    amount_exclusive: number2(),
    currency: string4(),
    status: PreviewUpdateStatus$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "amount_inclusive": "amountInclusive",
      "amount_exclusive": "amountExclusive"
    });
  })
);
var PreviewUpdateInvoiceCredits$inboundSchema = object({
  balance: number2(),
  currency: string4()
});
var PreviewUpdateResponse$inboundSchema = pipe(
  object({
    customer_id: string4(),
    line_items: array(_lazy(() => PreviewUpdateLineItem$inboundSchema)),
    subtotal: number2(),
    total: number2(),
    currency: string4(),
    next_cycle: optional3(
      _lazy(() => PreviewUpdateNextCycle$inboundSchema)
    ),
    expand: optional3(array(string4())),
    incoming: array(_lazy(() => PreviewUpdateIncoming$inboundSchema)),
    outgoing: array(_lazy(() => PreviewUpdateOutgoing$inboundSchema)),
    intent: Intent$inboundSchema,
    tax: optional3(_lazy(() => PreviewUpdateTax$inboundSchema)),
    invoice_credits: optional3(
      _lazy(() => PreviewUpdateInvoiceCredits$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "line_items": "lineItems",
      "next_cycle": "nextCycle",
      "invoice_credits": "invoiceCredits"
    });
  })
);
var RedeemReferralCodeParams$outboundSchema = pipe(
  object({
    code: string(),
    customerId: string()
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id"
    });
  })
);
var RedeemReferralCodeResponse$inboundSchema = pipe(
  object({
    id: string4(),
    customer_id: string4(),
    reward_id: string4()
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "reward_id": "rewardId"
    });
  })
);
var RedeemRewardCodeParams$outboundSchema = pipe(
  object({
    code: string(),
    customerId: string()
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id"
    });
  })
);
var EntitlementsGranted$inboundSchema = pipe(
  object({
    feature_id: string4(),
    balance: number2()
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var RedeemRewardCodeResponse$inboundSchema = pipe(
  object({
    reward_id: string4(),
    entitlements_granted: array(
      _lazy(() => EntitlementsGranted$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "reward_id": "rewardId",
      "entitlements_granted": "entitlementsGranted"
    });
  })
);
var RefreshKeyResponse$inboundSchema = pipe(
  object({
    access_token: string4(),
    refresh_token: optional3(string4()),
    expires_at: nullable(number2()),
    refresh_expires_at: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "access_token": "accessToken",
      "refresh_token": "refreshToken",
      "expires_at": "expiresAt",
      "refresh_expires_at": "refreshExpiresAt"
    });
  })
);
var RevokeKeyParams$outboundSchema = pipe(
  object({
    customerId: string()
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id"
    });
  })
);
var RevokeKeyResponse$inboundSchema = object({
  revoked: literal2(true)
});
var SetupPaymentPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var SetupPaymentItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var SetupPaymentItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var SetupPaymentItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var SetupPaymentItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var SetupPaymentItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var SetupPaymentItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var SetupPaymentItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var SetupPaymentAddItemResetInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var SetupPaymentAddItemTierBehavior = {
  Graduated: "graduated",
  Volume: "volume"
};
var SetupPaymentAddItemPriceInterval = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var SetupPaymentAddItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var SetupPaymentAddItemOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var SetupPaymentAddItemOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var SetupPaymentAddItemExpiryDurationType = {
  Month: "month",
  Forever: "forever"
};
var SetupPaymentRemoveItemBillingMethod = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var SetupPaymentIntervalRemoveItemEnum2 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var SetupPaymentIntervalRemoveItemEnum1 = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var SetupPaymentDurationType = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var SetupPaymentOnEnd = {
  Bill: "bill",
  Revert: "revert"
};
var SetupPaymentPurchaseLimitInterval = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var SetupPaymentLimitType = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var SetupPaymentUsageLimitInterval = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var SetupPaymentThresholdType = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var SetupPaymentProrationBehavior = {
  ProrateImmediately: "prorate_immediately",
  None: "none"
};
var SetupPaymentFeatureQuantity$outboundSchema = pipe(
  object({
    featureId: string(),
    quantity: optional(number()),
    adjustable: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var SetupPaymentPriceInterval$outboundSchema = _enum(SetupPaymentPriceInterval);
var SetupPaymentBasePrice$outboundSchema = pipe(
  object({
    amount: number(),
    interval: SetupPaymentPriceInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var SetupPaymentItemResetInterval$outboundSchema = _enum(SetupPaymentItemResetInterval);
var SetupPaymentItemReset$outboundSchema = pipe(
  object({
    interval: SetupPaymentItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var SetupPaymentItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var SetupPaymentItemTierBehavior$outboundSchema = _enum(SetupPaymentItemTierBehavior);
var SetupPaymentItemPriceInterval$outboundSchema = _enum(SetupPaymentItemPriceInterval);
var SetupPaymentItemBillingMethod$outboundSchema = _enum(SetupPaymentItemBillingMethod);
var SetupPaymentItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => SetupPaymentItemTier$outboundSchema))
    ),
    tierBehavior: optional(SetupPaymentItemTierBehavior$outboundSchema),
    interval: SetupPaymentItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: SetupPaymentItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var SetupPaymentItemOnIncrease$outboundSchema = _enum(SetupPaymentItemOnIncrease);
var SetupPaymentItemOnDecrease$outboundSchema = _enum(SetupPaymentItemOnDecrease);
var SetupPaymentItemProration$outboundSchema = pipe(
  object({
    onIncrease: SetupPaymentItemOnIncrease$outboundSchema,
    onDecrease: SetupPaymentItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var SetupPaymentItemExpiryDurationType$outboundSchema = _enum(SetupPaymentItemExpiryDurationType);
var SetupPaymentItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: SetupPaymentItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var SetupPaymentItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => SetupPaymentItemReset$outboundSchema)),
    price: optional(_lazy(() => SetupPaymentItemPrice$outboundSchema)),
    proration: optional(
      _lazy(() => SetupPaymentItemProration$outboundSchema)
    ),
    rollover: optional(_lazy(() => SetupPaymentItemRollover$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var SetupPaymentAddItemResetInterval$outboundSchema = _enum(SetupPaymentAddItemResetInterval);
var SetupPaymentAddItemReset$outboundSchema = pipe(
  object({
    interval: SetupPaymentAddItemResetInterval$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var SetupPaymentAddItemTier$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var SetupPaymentAddItemTierBehavior$outboundSchema = _enum(SetupPaymentAddItemTierBehavior);
var SetupPaymentAddItemPriceInterval$outboundSchema = _enum(SetupPaymentAddItemPriceInterval);
var SetupPaymentAddItemBillingMethod$outboundSchema = _enum(SetupPaymentAddItemBillingMethod);
var SetupPaymentAddItemPrice$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => SetupPaymentAddItemTier$outboundSchema))
    ),
    tierBehavior: optional(SetupPaymentAddItemTierBehavior$outboundSchema),
    interval: SetupPaymentAddItemPriceInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: SetupPaymentAddItemBillingMethod$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var SetupPaymentAddItemOnIncrease$outboundSchema = _enum(SetupPaymentAddItemOnIncrease);
var SetupPaymentAddItemOnDecrease$outboundSchema = _enum(SetupPaymentAddItemOnDecrease);
var SetupPaymentAddItemProration$outboundSchema = pipe(
  object({
    onIncrease: SetupPaymentAddItemOnIncrease$outboundSchema,
    onDecrease: SetupPaymentAddItemOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var SetupPaymentAddItemExpiryDurationType$outboundSchema = _enum(
  SetupPaymentAddItemExpiryDurationType
);
var SetupPaymentAddItemRollover$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: SetupPaymentAddItemExpiryDurationType$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var SetupPaymentAddItemPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => SetupPaymentAddItemReset$outboundSchema)),
    price: optional(_lazy(() => SetupPaymentAddItemPrice$outboundSchema)),
    proration: optional(
      _lazy(() => SetupPaymentAddItemProration$outboundSchema)
    ),
    rollover: optional(
      _lazy(() => SetupPaymentAddItemRollover$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var SetupPaymentRemoveItemBillingMethod$outboundSchema = _enum(SetupPaymentRemoveItemBillingMethod);
var SetupPaymentIntervalRemoveItemEnum2$outboundSchema = _enum(SetupPaymentIntervalRemoveItemEnum2);
var SetupPaymentIntervalRemoveItemEnum1$outboundSchema = _enum(SetupPaymentIntervalRemoveItemEnum1);
var SetupPaymentPlanItemFilter$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    billingMethod: optional(
      SetupPaymentRemoveItemBillingMethod$outboundSchema
    ),
    interval: optional(
      smartUnion([
        SetupPaymentIntervalRemoveItemEnum1$outboundSchema,
        SetupPaymentIntervalRemoveItemEnum2$outboundSchema
      ])
    ),
    intervalCount: optional(int())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      billingMethod: "billing_method",
      intervalCount: "interval_count"
    });
  })
);
var SetupPaymentDurationType$outboundSchema = _enum(SetupPaymentDurationType);
var SetupPaymentOnEnd$outboundSchema = _enum(SetupPaymentOnEnd);
var SetupPaymentFreeTrialParams$outboundSchema = pipe(
  object({
    durationLength: number(),
    durationType: _default(SetupPaymentDurationType$outboundSchema, "month"),
    cardRequired: _default(boolean(), true),
    onEnd: optional(SetupPaymentOnEnd$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      durationLength: "duration_length",
      durationType: "duration_type",
      cardRequired: "card_required",
      onEnd: "on_end"
    });
  })
);
var SetupPaymentPurchaseLimitInterval$outboundSchema = _enum(SetupPaymentPurchaseLimitInterval);
var SetupPaymentPurchaseLimit$outboundSchema = pipe(
  object({
    interval: SetupPaymentPurchaseLimitInterval$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var SetupPaymentAutoTopup$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => SetupPaymentPurchaseLimit$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var SetupPaymentLimitType$outboundSchema = _enum(SetupPaymentLimitType);
var SetupPaymentSpendLimit$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(SetupPaymentLimitType$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var SetupPaymentUsageLimitInterval$outboundSchema = _enum(SetupPaymentUsageLimitInterval);
var SetupPaymentUsageLimit$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: SetupPaymentUsageLimitInterval$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var SetupPaymentThresholdType$outboundSchema = _enum(SetupPaymentThresholdType);
var SetupPaymentUsageAlert$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: SetupPaymentThresholdType$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var SetupPaymentOverageAllowed$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var SetupPaymentBillingControls$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => SetupPaymentAutoTopup$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => SetupPaymentSpendLimit$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => SetupPaymentUsageLimit$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => SetupPaymentUsageAlert$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => SetupPaymentOverageAllowed$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var SetupPaymentCustomize$outboundSchema = pipe(
  object({
    price: optional(
      nullable$1(_lazy(() => SetupPaymentBasePrice$outboundSchema))
    ),
    items: optional(
      array(_lazy(() => SetupPaymentItemPlanItem$outboundSchema))
    ),
    addItems: optional(
      array(_lazy(() => SetupPaymentAddItemPlanItem$outboundSchema))
    ),
    removeItems: optional(
      array(_lazy(() => SetupPaymentPlanItemFilter$outboundSchema))
    ),
    freeTrial: optional(
      nullable$1(_lazy(() => SetupPaymentFreeTrialParams$outboundSchema))
    ),
    billingControls: optional(
      _lazy(() => SetupPaymentBillingControls$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      addItems: "add_items",
      removeItems: "remove_items",
      freeTrial: "free_trial",
      billingControls: "billing_controls"
    });
  })
);
var SetupPaymentProrationBehavior$outboundSchema = _enum(SetupPaymentProrationBehavior);
var SetupPaymentAttachDiscount$outboundSchema = pipe(
  object({
    rewardId: optional(string()),
    promotionCode: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      rewardId: "reward_id",
      promotionCode: "promotion_code"
    });
  })
);
var SetupPaymentCustomLineItem$outboundSchema = object({
  amount: number(),
  description: string()
});
var SetupPaymentCarryOverBalances$outboundSchema = pipe(
  object({
    enabled: boolean(),
    featureIds: optional(array(string()))
  }),
  transform((v) => {
    return remap(v, {
      featureIds: "feature_ids"
    });
  })
);
var SetupPaymentCarryOverUsages$outboundSchema = pipe(
  object({
    enabled: boolean(),
    featureIds: optional(array(string()))
  }),
  transform((v) => {
    return remap(v, {
      featureIds: "feature_ids"
    });
  })
);
var SetupPaymentParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    planId: optional(string()),
    featureQuantities: optional(
      array(_lazy(() => SetupPaymentFeatureQuantity$outboundSchema))
    ),
    version: optional(number()),
    customize: optional(_lazy(() => SetupPaymentCustomize$outboundSchema)),
    prorationBehavior: optional(SetupPaymentProrationBehavior$outboundSchema),
    subscriptionId: optional(string()),
    discounts: optional(
      array(_lazy(() => SetupPaymentAttachDiscount$outboundSchema))
    ),
    successUrl: optional(string()),
    billingCycleAnchor: optional(literal("now")),
    startsAt: optional(int()),
    endsAt: optional(int()),
    checkoutSessionParams: optional(record(string(), any())),
    customLineItems: optional(
      array(_lazy(() => SetupPaymentCustomLineItem$outboundSchema))
    ),
    processorSubscriptionId: optional(string()),
    carryOverBalances: optional(
      _lazy(() => SetupPaymentCarryOverBalances$outboundSchema)
    ),
    carryOverUsages: optional(
      _lazy(() => SetupPaymentCarryOverUsages$outboundSchema)
    ),
    metadata: optional(record(string(), string())),
    noBillingChanges: optional(boolean()),
    enablePlanImmediately: optional(boolean()),
    taxRateId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      planId: "plan_id",
      featureQuantities: "feature_quantities",
      prorationBehavior: "proration_behavior",
      subscriptionId: "subscription_id",
      successUrl: "success_url",
      billingCycleAnchor: "billing_cycle_anchor",
      startsAt: "starts_at",
      endsAt: "ends_at",
      checkoutSessionParams: "checkout_session_params",
      customLineItems: "custom_line_items",
      processorSubscriptionId: "processor_subscription_id",
      carryOverBalances: "carry_over_balances",
      carryOverUsages: "carry_over_usages",
      noBillingChanges: "no_billing_changes",
      enablePlanImmediately: "enable_plan_immediately",
      taxRateId: "tax_rate_id"
    });
  })
);
var SetupPaymentResponse$inboundSchema = pipe(
  object({
    customer_id: string4(),
    entity_id: optional3(string4()),
    url: string4()
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId"
    });
  })
);
var SyncRevenueCatEnv = {
  Test: "test",
  Sandbox: "sandbox",
  Live: "live"
};
var SyncRevenueCatStatus = {
  Synced: "synced",
  Skipped: "skipped",
  Error: "error"
};
var SyncRevenueCatProduct = {
  Created: "created",
  Updated: "updated",
  Exists: "exists"
};
var StorePush = {
  Pushed: "pushed",
  Failed: "failed",
  Skipped: "skipped"
};
var SyncRevenueCatPrice = {
  Set: "set",
  Skipped: "skipped",
  Failed: "failed"
};
var SyncRevenueCatEnv$outboundSchema = _enum(SyncRevenueCatEnv);
var SyncRevenueCatParams$outboundSchema = pipe(
  object({
    organizationSlug: string(),
    env: SyncRevenueCatEnv$outboundSchema,
    productIds: optional(array(string()))
  }),
  transform((v) => {
    return remap(v, {
      organizationSlug: "organization_slug",
      productIds: "product_ids"
    });
  })
);
var SyncRevenueCatStatus$inboundSchema = inboundSchema(SyncRevenueCatStatus);
var SyncRevenueCatProduct$inboundSchema = inboundSchema(SyncRevenueCatProduct);
var StorePush$inboundSchema = inboundSchema(StorePush);
var SyncRevenueCatPrice$inboundSchema = inboundSchema(SyncRevenueCatPrice);
var SyncRevenueCatApp$inboundSchema = pipe(
  object({
    app_id: string4(),
    app_type: string4(),
    product: SyncRevenueCatProduct$inboundSchema,
    store_push: optional3(StorePush$inboundSchema),
    price: optional3(SyncRevenueCatPrice$inboundSchema),
    message: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "app_id": "appId",
      "app_type": "appType",
      "store_push": "storePush"
    });
  })
);
var Result$inboundSchema = pipe(
  object({
    plan_id: string4(),
    status: SyncRevenueCatStatus$inboundSchema,
    store_identifier: optional3(string4()),
    apps: optional3(
      array(_lazy(() => SyncRevenueCatApp$inboundSchema))
    ),
    message: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "store_identifier": "storeIdentifier"
    });
  })
);
var SyncRevenueCatResponse$inboundSchema = object({
  results: array(_lazy(() => Result$inboundSchema))
});
var TrackIntervalEnum2 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var TrackIntervalEnum1 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var TrackLock$outboundSchema = pipe(
  object({
    lockId: string(),
    enabled: literal(true),
    expiresAt: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      lockId: "lock_id",
      expiresAt: "expires_at"
    });
  })
);
var TrackParams$outboundSchema = pipe(
  object({
    customerId: string(),
    featureId: optional(string()),
    entityId: optional(string()),
    eventName: optional(string()),
    value: optional(number()),
    properties: optional(record(string(), any())),
    timestamp: optional(int()),
    async: optional(boolean()),
    lock: optional(_lazy(() => TrackLock$outboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      featureId: "feature_id",
      entityId: "entity_id",
      eventName: "event_name"
    });
  })
);
var TrackIntervalEnum2$inboundSchema = inboundSchema(TrackIntervalEnum2);
var TrackReset2$inboundSchema = pipe(
  object({
    interval: smartUnion([TrackIntervalEnum2$inboundSchema, string4()]),
    interval_count: optional3(number2()),
    resets_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "resets_at": "resetsAt"
    });
  })
);
var TrackDeduction2$inboundSchema = pipe(
  object({
    balance_id: string4(),
    feature_id: string4(),
    plan_id: nullable(string4()),
    reset: nullable(_lazy(() => TrackReset2$inboundSchema)),
    value: number2()
  }),
  transform((v) => {
    return remap(v, {
      "balance_id": "balanceId",
      "feature_id": "featureId",
      "plan_id": "planId"
    });
  })
);
var TrackResponseBody2$inboundSchema = pipe(
  object({
    customer_id: string4(),
    entity_id: optional3(string4()),
    event_name: optional3(string4()),
    value: number2(),
    balance: nullable(Balance$inboundSchema),
    balances: optional3(
      record(string(), nullable(Balance$inboundSchema))
    ),
    deductions: optional3(
      array(_lazy(() => TrackDeduction2$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "event_name": "eventName"
    });
  })
);
var TrackIntervalEnum1$inboundSchema = inboundSchema(TrackIntervalEnum1);
var TrackReset1$inboundSchema = pipe(
  object({
    interval: smartUnion([TrackIntervalEnum1$inboundSchema, string4()]),
    interval_count: optional3(number2()),
    resets_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "resets_at": "resetsAt"
    });
  })
);
var TrackDeduction1$inboundSchema = pipe(
  object({
    balance_id: string4(),
    feature_id: string4(),
    plan_id: nullable(string4()),
    reset: nullable(_lazy(() => TrackReset1$inboundSchema)),
    value: number2()
  }),
  transform((v) => {
    return remap(v, {
      "balance_id": "balanceId",
      "feature_id": "featureId",
      "plan_id": "planId"
    });
  })
);
var TrackResponseBody1$inboundSchema = pipe(
  object({
    customer_id: string4(),
    entity_id: optional3(string4()),
    event_name: optional3(string4()),
    value: number2(),
    balance: nullable(Balance$inboundSchema),
    balances: optional3(
      record(string(), nullable(Balance$inboundSchema))
    ),
    deductions: optional3(
      array(_lazy(() => TrackDeduction1$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "event_name": "eventName"
    });
  })
);
var TrackResponse$inboundSchema = smartUnion([
  _lazy(() => TrackResponseBody1$inboundSchema),
  _lazy(() => TrackResponseBody2$inboundSchema)
]);
var TrackTokensIntervalEnum2 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var TrackTokensIntervalEnum1 = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var TrackTokensParams$outboundSchema = pipe(
  object({
    customerId: string(),
    entityId: optional(string()),
    featureId: optional(string()),
    modelId: string(),
    inputTokens: int(),
    outputTokens: int(),
    cacheReadTokens: optional(int()),
    cacheWriteTokens: optional(int()),
    audioInputTokens: optional(int()),
    audioOutputTokens: optional(int()),
    reasoningTokens: optional(int()),
    properties: optional(record(string(), any())),
    timestamp: optional(int()),
    async: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      featureId: "feature_id",
      modelId: "model_id",
      inputTokens: "input_tokens",
      outputTokens: "output_tokens",
      cacheReadTokens: "cache_read_tokens",
      cacheWriteTokens: "cache_write_tokens",
      audioInputTokens: "audio_input_tokens",
      audioOutputTokens: "audio_output_tokens",
      reasoningTokens: "reasoning_tokens"
    });
  })
);
var TrackTokensIntervalEnum2$inboundSchema = inboundSchema(TrackTokensIntervalEnum2);
var TrackTokensReset2$inboundSchema = pipe(
  object({
    interval: smartUnion([
      TrackTokensIntervalEnum2$inboundSchema,
      string4()
    ]),
    interval_count: optional3(number2()),
    resets_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "resets_at": "resetsAt"
    });
  })
);
var TrackTokensDeduction2$inboundSchema = pipe(
  object({
    balance_id: string4(),
    feature_id: string4(),
    plan_id: nullable(string4()),
    reset: nullable(_lazy(() => TrackTokensReset2$inboundSchema)),
    value: number2()
  }),
  transform((v) => {
    return remap(v, {
      "balance_id": "balanceId",
      "feature_id": "featureId",
      "plan_id": "planId"
    });
  })
);
var TrackTokensResponseBody2$inboundSchema = pipe(
  object({
    customer_id: string4(),
    entity_id: optional3(string4()),
    event_name: optional3(string4()),
    value: number2(),
    balance: nullable(Balance$inboundSchema),
    balances: optional3(
      record(string(), nullable(Balance$inboundSchema))
    ),
    deductions: optional3(
      array(_lazy(() => TrackTokensDeduction2$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "event_name": "eventName"
    });
  })
);
var TrackTokensIntervalEnum1$inboundSchema = inboundSchema(TrackTokensIntervalEnum1);
var TrackTokensReset1$inboundSchema = pipe(
  object({
    interval: smartUnion([
      TrackTokensIntervalEnum1$inboundSchema,
      string4()
    ]),
    interval_count: optional3(number2()),
    resets_at: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "resets_at": "resetsAt"
    });
  })
);
var TrackTokensDeduction1$inboundSchema = pipe(
  object({
    balance_id: string4(),
    feature_id: string4(),
    plan_id: nullable(string4()),
    reset: nullable(_lazy(() => TrackTokensReset1$inboundSchema)),
    value: number2()
  }),
  transform((v) => {
    return remap(v, {
      "balance_id": "balanceId",
      "feature_id": "featureId",
      "plan_id": "planId"
    });
  })
);
var TrackTokensResponseBody1$inboundSchema = pipe(
  object({
    customer_id: string4(),
    entity_id: optional3(string4()),
    event_name: optional3(string4()),
    value: number2(),
    balance: nullable(Balance$inboundSchema),
    balances: optional3(
      record(string(), nullable(Balance$inboundSchema))
    ),
    deductions: optional3(
      array(_lazy(() => TrackTokensDeduction1$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "entity_id": "entityId",
      "event_name": "eventName"
    });
  })
);
var TrackTokensResponse$inboundSchema = smartUnion([
  _lazy(() => TrackTokensResponseBody1$inboundSchema),
  _lazy(() => TrackTokensResponseBody2$inboundSchema)
]);
var UpdateBalanceInterval = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var UpdateBalanceInterval$outboundSchema = _enum(UpdateBalanceInterval);
var UpdateBalanceParams$outboundSchema = pipe(
  object({
    customerId: string(),
    featureId: string(),
    entityId: optional(string()),
    remaining: optional(number()),
    addToBalance: optional(number()),
    usage: optional(number()),
    interval: optional(UpdateBalanceInterval$outboundSchema),
    includedGrant: optional(number()),
    balanceId: optional(string()),
    nextResetAt: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      featureId: "feature_id",
      entityId: "entity_id",
      addToBalance: "add_to_balance",
      includedGrant: "included_grant",
      balanceId: "balance_id",
      nextResetAt: "next_reset_at"
    });
  })
);
var UpdateBalanceResponse$inboundSchema = object({
  success: boolean2()
});
var UpdateCustomerPurchaseLimitIntervalRequestBody = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var UpdateCustomerLimitTypeRequestBody = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var UpdateCustomerUsageLimitIntervalRequestBody = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var UpdateCustomerThresholdTypeRequestBody = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var UpdateCustomerEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var UpdateCustomerPurchaseLimitIntervalResponse2 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var UpdateCustomerPurchaseLimitIntervalResponse1 = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var UpdateCustomerLimitTypeResponse = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var UpdateCustomerUsageLimitIntervalResponse = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var UpdateCustomerThresholdTypeResponse = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var UpdateCustomerStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var UpdateCustomerSubscriptionScope = {
  Customer: "customer",
  Entity: "entity"
};
var UpdateCustomerPurchaseScope = {
  Customer: "customer",
  Entity: "entity"
};
var UpdateCustomerType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var UpdateCustomerPurchaseLimitIntervalRequestBody$outboundSchema = _enum(
  UpdateCustomerPurchaseLimitIntervalRequestBody
);
var UpdateCustomerPurchaseLimitRequest$outboundSchema = pipe(
  object({
    interval: UpdateCustomerPurchaseLimitIntervalRequestBody$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var UpdateCustomerAutoTopupRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => UpdateCustomerPurchaseLimitRequest$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var UpdateCustomerLimitTypeRequestBody$outboundSchema = _enum(UpdateCustomerLimitTypeRequestBody);
var UpdateCustomerSpendLimitRequest$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(UpdateCustomerLimitTypeRequestBody$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var UpdateCustomerUsageLimitIntervalRequestBody$outboundSchema = _enum(
  UpdateCustomerUsageLimitIntervalRequestBody
);
var UpdateCustomerUsageLimitRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: UpdateCustomerUsageLimitIntervalRequestBody$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var UpdateCustomerThresholdTypeRequestBody$outboundSchema = _enum(
  UpdateCustomerThresholdTypeRequestBody
);
var UpdateCustomerUsageAlertRequestBody$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: UpdateCustomerThresholdTypeRequestBody$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var UpdateCustomerOverageAllowedRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var UpdateCustomerBillingControlsRequest$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => UpdateCustomerAutoTopupRequest$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => UpdateCustomerSpendLimitRequest$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => UpdateCustomerUsageLimitRequest$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => UpdateCustomerUsageAlertRequestBody$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => UpdateCustomerOverageAllowedRequest$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var UpdateCustomerConfigRequest$outboundSchema = pipe(
  object({
    disablePooledBalance: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      disablePooledBalance: "disable_pooled_balance"
    });
  })
);
var UpdateCustomerParams$outboundSchema = pipe(
  object({
    customerId: string(),
    name: optional(nullable$1(string())),
    email: optional(nullable$1(string())),
    fingerprint: optional(nullable$1(string())),
    metadata: optional(nullable$1(record(string(), any()))),
    stripeId: optional(nullable$1(string())),
    sendEmailReceipts: optional(boolean()),
    billingControls: optional(
      _lazy(() => UpdateCustomerBillingControlsRequest$outboundSchema)
    ),
    config: optional(
      _lazy(() => UpdateCustomerConfigRequest$outboundSchema)
    ),
    newCustomerId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      stripeId: "stripe_id",
      sendEmailReceipts: "send_email_receipts",
      billingControls: "billing_controls",
      newCustomerId: "new_customer_id"
    });
  })
);
var UpdateCustomerEnv$inboundSchema = inboundSchema(UpdateCustomerEnv);
var UpdateCustomerPurchaseLimitIntervalResponse2$inboundSchema = inboundSchema(UpdateCustomerPurchaseLimitIntervalResponse2);
var UpdateCustomerPurchaseLimitResponse2$inboundSchema = pipe(
  object({
    interval: nullable(
      UpdateCustomerPurchaseLimitIntervalResponse2$inboundSchema
    ),
    interval_count: nullable(number2()),
    limit: nullable(number2()),
    count: number2(),
    next_reset_at: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount",
      "next_reset_at": "nextResetAt"
    });
  })
);
var UpdateCustomerPurchaseLimitIntervalResponse1$inboundSchema = inboundSchema(UpdateCustomerPurchaseLimitIntervalResponse1);
var UpdateCustomerPurchaseLimitResponse1$inboundSchema = pipe(
  object({
    interval: UpdateCustomerPurchaseLimitIntervalResponse1$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var UpdateCustomerAutoTopupResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(smartUnion([
      _lazy(() => UpdateCustomerPurchaseLimitResponse2$inboundSchema),
      _lazy(() => UpdateCustomerPurchaseLimitResponse1$inboundSchema)
    ])),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var UpdateCustomerLimitTypeResponse$inboundSchema = inboundSchema(UpdateCustomerLimitTypeResponse);
var UpdateCustomerSpendLimitResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(UpdateCustomerLimitTypeResponse$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var UpdateCustomerUsageLimitIntervalResponse$inboundSchema = inboundSchema(UpdateCustomerUsageLimitIntervalResponse);
var UpdateCustomerUsageLimitResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: UpdateCustomerUsageLimitIntervalResponse$inboundSchema,
    usage: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var UpdateCustomerThresholdTypeResponse$inboundSchema = inboundSchema(UpdateCustomerThresholdTypeResponse);
var UpdateCustomerUsageAlertResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: UpdateCustomerThresholdTypeResponse$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var UpdateCustomerOverageAllowedResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var UpdateCustomerBillingControlsResponse$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => UpdateCustomerAutoTopupResponse$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => UpdateCustomerSpendLimitResponse$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => UpdateCustomerUsageLimitResponse$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => UpdateCustomerUsageAlertResponse$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => UpdateCustomerOverageAllowedResponse$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var UpdateCustomerStatus$inboundSchema = inboundSchema(UpdateCustomerStatus);
var UpdateCustomerSubscriptionScope$inboundSchema = inboundSchema(UpdateCustomerSubscriptionScope);
var UpdateCustomerSubscription$inboundSchema = pipe(
  object({
    id: string4(),
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    auto_enable: boolean2(),
    add_on: boolean2(),
    status: UpdateCustomerStatus$inboundSchema,
    past_due: boolean2(),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2()),
    trial_ends_at: nullable(number2()),
    started_at: number2(),
    current_period_start: nullable(number2()),
    current_period_end: nullable(number2()),
    quantity: number2(),
    scope: optional3(UpdateCustomerSubscriptionScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "auto_enable": "autoEnable",
      "add_on": "addOn",
      "past_due": "pastDue",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt",
      "trial_ends_at": "trialEndsAt",
      "started_at": "startedAt",
      "current_period_start": "currentPeriodStart",
      "current_period_end": "currentPeriodEnd"
    });
  })
);
var UpdateCustomerPurchaseScope$inboundSchema = inboundSchema(UpdateCustomerPurchaseScope);
var UpdateCustomerPurchase$inboundSchema = pipe(
  object({
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    expires_at: nullable(number2()),
    started_at: number2(),
    quantity: number2(),
    scope: optional3(UpdateCustomerPurchaseScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "started_at": "startedAt"
    });
  })
);
var UpdateCustomerType$inboundSchema = inboundSchema(UpdateCustomerType);
var UpdateCustomerCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var UpdateCustomerModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var UpdateCustomerProviderMarkups$inboundSchema = object({
  markup: number2()
});
var UpdateCustomerDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var UpdateCustomerFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: UpdateCustomerType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => UpdateCustomerCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => UpdateCustomerModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => UpdateCustomerProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => UpdateCustomerDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var UpdateCustomerFlags$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => UpdateCustomerFeature$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var UpdateCustomerConfigResponse$inboundSchema = pipe(
  object({
    disable_pooled_balance: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "disable_pooled_balance": "disablePooledBalance"
    });
  })
);
var UpdateCustomerStripe$inboundSchema = object({
  id: string4()
});
var UpdateCustomerVercel$inboundSchema = pipe(
  object({
    installation_id: string4(),
    account_id: string4()
  }),
  transform((v) => {
    return remap(v, {
      "installation_id": "installationId",
      "account_id": "accountId"
    });
  })
);
var UpdateCustomerRevenuecat$inboundSchema = object({
  id: nullable(string4())
});
var UpdateCustomerProcessors$inboundSchema = object({
  stripe: optional3(_lazy(() => UpdateCustomerStripe$inboundSchema)),
  vercel: optional3(_lazy(() => UpdateCustomerVercel$inboundSchema)),
  revenuecat: optional3(
    _lazy(() => UpdateCustomerRevenuecat$inboundSchema)
  )
});
var UpdateCustomerResponse$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    email: nullable(string4()),
    created_at: number2(),
    fingerprint: nullable(string4()),
    stripe_id: nullable(string4()),
    env: UpdateCustomerEnv$inboundSchema,
    metadata: record(string(), any()),
    send_email_receipts: boolean2(),
    billing_controls: _lazy(
      () => UpdateCustomerBillingControlsResponse$inboundSchema
    ),
    subscriptions: array(
      _lazy(() => UpdateCustomerSubscription$inboundSchema)
    ),
    purchases: array(_lazy(() => UpdateCustomerPurchase$inboundSchema)),
    balances: record(string(), Balance$inboundSchema),
    flags: record(
      string(),
      _lazy(() => UpdateCustomerFlags$inboundSchema)
    ),
    config: optional3(
      _lazy(() => UpdateCustomerConfigResponse$inboundSchema)
    ),
    processors: optional3(
      _lazy(() => UpdateCustomerProcessors$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "created_at": "createdAt",
      "stripe_id": "stripeId",
      "send_email_receipts": "sendEmailReceipts",
      "billing_controls": "billingControls"
    });
  })
);
var UpdateEntityLimitTypeRequestBody = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var UpdateEntityIntervalRequestBody = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var UpdateEntityThresholdTypeRequestBody = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var UpdateEntityEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var UpdateEntityStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var UpdateEntitySubscriptionScope = {
  Customer: "customer",
  Entity: "entity"
};
var UpdateEntityPurchaseScope = {
  Customer: "customer",
  Entity: "entity"
};
var UpdateEntityType = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var UpdateEntityLimitTypeResponse = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var UpdateEntityIntervalResponse = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var UpdateEntityThresholdTypeResponse = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var UpdateEntityProcessorType = {
  Stripe: "stripe",
  Revenuecat: "revenuecat"
};
var UpdateEntityLimitTypeRequestBody$outboundSchema = _enum(UpdateEntityLimitTypeRequestBody);
var UpdateEntitySpendLimitRequest$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(UpdateEntityLimitTypeRequestBody$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var UpdateEntityIntervalRequestBody$outboundSchema = _enum(UpdateEntityIntervalRequestBody);
var UpdateEntityUsageLimitRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: UpdateEntityIntervalRequestBody$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var UpdateEntityThresholdTypeRequestBody$outboundSchema = _enum(UpdateEntityThresholdTypeRequestBody);
var UpdateEntityUsageAlertRequestBody$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: UpdateEntityThresholdTypeRequestBody$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var UpdateEntityOverageAllowedRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var UpdateEntityBillingControlsRequest$outboundSchema = pipe(
  object({
    spendLimits: optional(
      array(_lazy(() => UpdateEntitySpendLimitRequest$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => UpdateEntityUsageLimitRequest$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => UpdateEntityUsageAlertRequestBody$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => UpdateEntityOverageAllowedRequest$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var UpdateEntityParams$outboundSchema = pipe(
  object({
    customerId: optional(string()),
    entityId: string(),
    billingControls: optional(
      _lazy(() => UpdateEntityBillingControlsRequest$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      customerId: "customer_id",
      entityId: "entity_id",
      billingControls: "billing_controls"
    });
  })
);
var UpdateEntityEnv$inboundSchema = inboundSchema(UpdateEntityEnv);
var UpdateEntityStatus$inboundSchema = inboundSchema(UpdateEntityStatus);
var UpdateEntitySubscriptionScope$inboundSchema = inboundSchema(UpdateEntitySubscriptionScope);
var UpdateEntitySubscription$inboundSchema = pipe(
  object({
    id: string4(),
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    auto_enable: boolean2(),
    add_on: boolean2(),
    status: UpdateEntityStatus$inboundSchema,
    past_due: boolean2(),
    canceled_at: nullable(number2()),
    expires_at: nullable(number2()),
    trial_ends_at: nullable(number2()),
    started_at: number2(),
    current_period_start: nullable(number2()),
    current_period_end: nullable(number2()),
    quantity: number2(),
    scope: optional3(UpdateEntitySubscriptionScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "auto_enable": "autoEnable",
      "add_on": "addOn",
      "past_due": "pastDue",
      "canceled_at": "canceledAt",
      "expires_at": "expiresAt",
      "trial_ends_at": "trialEndsAt",
      "started_at": "startedAt",
      "current_period_start": "currentPeriodStart",
      "current_period_end": "currentPeriodEnd"
    });
  })
);
var UpdateEntityPurchaseScope$inboundSchema = inboundSchema(UpdateEntityPurchaseScope);
var UpdateEntityPurchase$inboundSchema = pipe(
  object({
    plan: optional3(Plan$inboundSchema),
    plan_id: string4(),
    expires_at: nullable(number2()),
    started_at: number2(),
    quantity: number2(),
    scope: optional3(UpdateEntityPurchaseScope$inboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "started_at": "startedAt"
    });
  })
);
var UpdateEntityType$inboundSchema = inboundSchema(UpdateEntityType);
var UpdateEntityCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var UpdateEntityModelMarkups$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var UpdateEntityProviderMarkups$inboundSchema = object({
  markup: number2()
});
var UpdateEntityDisplay$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var UpdateEntityFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: UpdateEntityType$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => UpdateEntityCreditSchema$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => UpdateEntityModelMarkups$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => UpdateEntityProviderMarkups$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => UpdateEntityDisplay$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var UpdateEntityFlags$inboundSchema = pipe(
  object({
    id: string4(),
    plan_id: nullable(string4()),
    expires_at: nullable(number2()),
    feature_id: string4(),
    feature: optional3(_lazy(() => UpdateEntityFeature$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "plan_id": "planId",
      "expires_at": "expiresAt",
      "feature_id": "featureId"
    });
  })
);
var UpdateEntityLimitTypeResponse$inboundSchema = inboundSchema(UpdateEntityLimitTypeResponse);
var UpdateEntitySpendLimitResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(UpdateEntityLimitTypeResponse$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var UpdateEntityIntervalResponse$inboundSchema = inboundSchema(UpdateEntityIntervalResponse);
var UpdateEntityUsageLimitResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: UpdateEntityIntervalResponse$inboundSchema,
    usage: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var UpdateEntityThresholdTypeResponse$inboundSchema = inboundSchema(UpdateEntityThresholdTypeResponse);
var UpdateEntityUsageAlertResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: UpdateEntityThresholdTypeResponse$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var UpdateEntityOverageAllowedResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var UpdateEntityBillingControlsResponse$inboundSchema = pipe(
  object({
    spend_limits: optional3(
      array(_lazy(() => UpdateEntitySpendLimitResponse$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => UpdateEntityUsageLimitResponse$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => UpdateEntityUsageAlertResponse$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => UpdateEntityOverageAllowedResponse$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var UpdateEntityProcessorType$inboundSchema = inboundSchema(UpdateEntityProcessorType);
var UpdateEntityInvoice$inboundSchema = pipe(
  object({
    plan_ids: array(string4()),
    stripe_id: string4(),
    processor_type: _default(
      UpdateEntityProcessorType$inboundSchema,
      "stripe"
    ),
    status: string4(),
    total: number2(),
    currency: string4(),
    created_at: number2(),
    hosted_invoice_url: optional(nullable$1(string4()))
  }),
  transform((v) => {
    return remap(v, {
      "plan_ids": "planIds",
      "stripe_id": "stripeId",
      "processor_type": "processorType",
      "created_at": "createdAt",
      "hosted_invoice_url": "hostedInvoiceUrl"
    });
  })
);
var UpdateEntityResponse$inboundSchema = pipe(
  object({
    id: nullable(string4()),
    name: nullable(string4()),
    customer_id: optional(nullable$1(string4())),
    feature_id: optional(nullable$1(string4())),
    created_at: number2(),
    env: UpdateEntityEnv$inboundSchema,
    subscriptions: array(
      _lazy(() => UpdateEntitySubscription$inboundSchema)
    ),
    purchases: array(_lazy(() => UpdateEntityPurchase$inboundSchema)),
    balances: record(string(), Balance$inboundSchema),
    flags: record(string(), _lazy(() => UpdateEntityFlags$inboundSchema)),
    billing_controls: optional3(
      _lazy(() => UpdateEntityBillingControlsResponse$inboundSchema)
    ),
    invoices: optional3(
      array(_lazy(() => UpdateEntityInvoice$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "customer_id": "customerId",
      "feature_id": "featureId",
      "created_at": "createdAt",
      "billing_controls": "billingControls"
    });
  })
);
var UpdateFeatureTypeRequestBody = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var UpdateFeatureTypeResponse = {
  Boolean: "boolean",
  Metered: "metered",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var UpdateFeatureTypeRequestBody$outboundSchema = _enum(UpdateFeatureTypeRequestBody);
var UpdateFeatureDisplayRequestBody$outboundSchema = object({
  singular: string(),
  plural: string()
});
var UpdateFeatureCreditSchemaRequestBody$outboundSchema = pipe(
  object({
    meteredFeatureId: string(),
    creditCost: number()
  }),
  transform((v) => {
    return remap(v, {
      meteredFeatureId: "metered_feature_id",
      creditCost: "credit_cost"
    });
  })
);
var UpdateFeatureModelMarkupsRequest$outboundSchema = pipe(
  object({
    markup: optional(number()),
    inputCost: optional(number()),
    outputCost: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      inputCost: "input_cost",
      outputCost: "output_cost"
    });
  })
);
var UpdateFeatureProviderMarkupsRequest$outboundSchema = object({
  markup: number()
});
var UpdateFeatureParams$outboundSchema = pipe(
  object({
    name: optional(string()),
    type: optional(UpdateFeatureTypeRequestBody$outboundSchema),
    consumable: optional(boolean()),
    display: optional(
      _lazy(() => UpdateFeatureDisplayRequestBody$outboundSchema)
    ),
    creditSchema: optional(
      array(
        _lazy(() => UpdateFeatureCreditSchemaRequestBody$outboundSchema)
      )
    ),
    modelMarkups: optional(
      nullable$1(record(
        string(),
        _lazy(() => UpdateFeatureModelMarkupsRequest$outboundSchema)
      ))
    ),
    defaultMarkup: optional(number()),
    providerMarkups: optional(
      nullable$1(record(
        string(),
        _lazy(() => UpdateFeatureProviderMarkupsRequest$outboundSchema)
      ))
    ),
    eventNames: optional(array(string())),
    archived: optional(boolean()),
    featureId: string(),
    newFeatureId: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      creditSchema: "credit_schema",
      modelMarkups: "model_markups",
      defaultMarkup: "default_markup",
      providerMarkups: "provider_markups",
      eventNames: "event_names",
      featureId: "feature_id",
      newFeatureId: "new_feature_id"
    });
  })
);
var UpdateFeatureTypeResponse$inboundSchema = inboundSchema(UpdateFeatureTypeResponse);
var UpdateFeatureCreditSchemaResponse$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var UpdateFeatureModelMarkupsResponse$inboundSchema = pipe(
  object({
    markup: optional3(number2()),
    input_cost: optional3(number2()),
    output_cost: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "input_cost": "inputCost",
      "output_cost": "outputCost"
    });
  })
);
var UpdateFeatureProviderMarkupsResponse$inboundSchema = object({
  markup: number2()
});
var UpdateFeatureDisplayResponse$inboundSchema = object({
  singular: optional(nullable$1(string4())),
  plural: optional(nullable$1(string4()))
});
var UpdateFeatureResponse$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    type: UpdateFeatureTypeResponse$inboundSchema,
    consumable: boolean2(),
    event_names: optional3(array(string4())),
    credit_schema: optional3(
      array(_lazy(() => UpdateFeatureCreditSchemaResponse$inboundSchema))
    ),
    model_markups: optional(nullable$1(record(
      string(),
      _lazy(() => UpdateFeatureModelMarkupsResponse$inboundSchema)
    ))),
    default_markup: optional3(number2()),
    provider_markups: optional(nullable$1(record(
      string(),
      _lazy(() => UpdateFeatureProviderMarkupsResponse$inboundSchema)
    ))),
    display: optional3(_lazy(
      () => UpdateFeatureDisplayResponse$inboundSchema
    )),
    archived: boolean2()
  }),
  transform((v) => {
    return remap(v, {
      "event_names": "eventNames",
      "credit_schema": "creditSchema",
      "model_markups": "modelMarkups",
      "default_markup": "defaultMarkup",
      "provider_markups": "providerMarkups"
    });
  })
);
var UpdatePlanPriceIntervalRequestBody = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var UpdatePlanResetIntervalRequestBody = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var UpdatePlanTierBehaviorRequestBody = {
  Graduated: "graduated",
  Volume: "volume"
};
var UpdatePlanItemPriceIntervalRequestBody = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var UpdatePlanBillingMethodRequestBody = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var UpdatePlanOnIncrease = {
  BillImmediately: "bill_immediately",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  BillNextCycle: "bill_next_cycle"
};
var UpdatePlanOnDecrease = {
  Prorate: "prorate",
  ProrateImmediately: "prorate_immediately",
  ProrateNextCycle: "prorate_next_cycle",
  None: "none",
  NoProrations: "no_prorations"
};
var UpdatePlanExpiryDurationTypeRequestBody = {
  Month: "month",
  Forever: "forever"
};
var UpdatePlanDurationTypeRequest = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var UpdatePlanOnEndRequest = {
  Bill: "bill",
  Revert: "revert"
};
var UpdatePlanPurchaseLimitIntervalRequestBody = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var UpdatePlanLimitTypeRequestBody = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var UpdatePlanUsageLimitIntervalRequestBody = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var UpdatePlanThresholdTypeRequestBody = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var UpdatePlanPriceIntervalResponse = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var UpdatePlanType = {
  Static: "static",
  Boolean: "boolean",
  SingleUse: "single_use",
  ContinuousUse: "continuous_use",
  CreditSystem: "credit_system",
  AiCreditSystem: "ai_credit_system"
};
var UpdatePlanResetIntervalResponse = {
  OneOff: "one_off",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var UpdatePlanTierBehaviorResponse = {
  Graduated: "graduated",
  Volume: "volume"
};
var UpdatePlanPriceItemIntervalResponse = {
  OneOff: "one_off",
  Week: "week",
  Month: "month",
  Quarter: "quarter",
  SemiAnnual: "semi_annual",
  Year: "year"
};
var UpdatePlanBillingMethodResponse = {
  Prepaid: "prepaid",
  UsageBased: "usage_based"
};
var UpdatePlanExpiryDurationTypeResponse = {
  Month: "month",
  Forever: "forever"
};
var UpdatePlanDurationTypeResponse = {
  Day: "day",
  Month: "month",
  Year: "year"
};
var UpdatePlanOnEndResponse = {
  Bill: "bill",
  Revert: "revert"
};
var UpdatePlanEnv = {
  Sandbox: "sandbox",
  Live: "live"
};
var UpdatePlanPurchaseLimitIntervalResponse = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month"
};
var UpdatePlanLimitTypeResponse = {
  Absolute: "absolute",
  UsagePercentage: "usage_percentage"
};
var UpdatePlanUsageLimitIntervalResponse = {
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year"
};
var UpdatePlanThresholdTypeResponse = {
  Usage: "usage",
  UsagePercentage: "usage_percentage",
  Remaining: "remaining",
  RemainingPercentage: "remaining_percentage"
};
var UpdatePlanStatus = {
  Active: "active",
  Scheduled: "scheduled"
};
var UpdatePlanAttachAction = {
  Activate: "activate",
  Upgrade: "upgrade",
  Downgrade: "downgrade",
  None: "none",
  Purchase: "purchase"
};
var UpdatePlanPriceIntervalRequestBody$outboundSchema = _enum(UpdatePlanPriceIntervalRequestBody);
var UpdatePlanBasePrice$outboundSchema = pipe(
  object({
    amount: number(),
    interval: UpdatePlanPriceIntervalRequestBody$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var UpdatePlanResetIntervalRequestBody$outboundSchema = _enum(UpdatePlanResetIntervalRequestBody);
var UpdatePlanResetRequestBody$outboundSchema = pipe(
  object({
    interval: UpdatePlanResetIntervalRequestBody$outboundSchema,
    intervalCount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var UpdatePlanTierRequestBody$outboundSchema = pipe(
  object({
    to: smartUnion([number(), string()]),
    amount: optional(number()),
    flatAmount: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      flatAmount: "flat_amount"
    });
  })
);
var UpdatePlanTierBehaviorRequestBody$outboundSchema = _enum(UpdatePlanTierBehaviorRequestBody);
var UpdatePlanItemPriceIntervalRequestBody$outboundSchema = _enum(
  UpdatePlanItemPriceIntervalRequestBody
);
var UpdatePlanBillingMethodRequestBody$outboundSchema = _enum(UpdatePlanBillingMethodRequestBody);
var UpdatePlanPriceRequestBody$outboundSchema = pipe(
  object({
    amount: optional(number()),
    tiers: optional(
      array(_lazy(() => UpdatePlanTierRequestBody$outboundSchema))
    ),
    tierBehavior: optional(UpdatePlanTierBehaviorRequestBody$outboundSchema),
    interval: UpdatePlanItemPriceIntervalRequestBody$outboundSchema,
    intervalCount: _default(number(), 1),
    billingUnits: _default(number(), 1),
    billingMethod: UpdatePlanBillingMethodRequestBody$outboundSchema,
    maxPurchase: optional(nullable$1(number()))
  }),
  transform((v) => {
    return remap(v, {
      tierBehavior: "tier_behavior",
      intervalCount: "interval_count",
      billingUnits: "billing_units",
      billingMethod: "billing_method",
      maxPurchase: "max_purchase"
    });
  })
);
var UpdatePlanOnIncrease$outboundSchema = _enum(UpdatePlanOnIncrease);
var UpdatePlanOnDecrease$outboundSchema = _enum(UpdatePlanOnDecrease);
var UpdatePlanProration$outboundSchema = pipe(
  object({
    onIncrease: UpdatePlanOnIncrease$outboundSchema,
    onDecrease: UpdatePlanOnDecrease$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      onIncrease: "on_increase",
      onDecrease: "on_decrease"
    });
  })
);
var UpdatePlanExpiryDurationTypeRequestBody$outboundSchema = _enum(
  UpdatePlanExpiryDurationTypeRequestBody
);
var UpdatePlanRolloverRequestBody$outboundSchema = pipe(
  object({
    max: optional(number()),
    maxPercentage: optional(number()),
    expiryDurationType: UpdatePlanExpiryDurationTypeRequestBody$outboundSchema,
    expiryDurationLength: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      maxPercentage: "max_percentage",
      expiryDurationType: "expiry_duration_type",
      expiryDurationLength: "expiry_duration_length"
    });
  })
);
var UpdatePlanPlanItem$outboundSchema = pipe(
  object({
    featureId: string(),
    included: optional(number()),
    unlimited: optional(boolean()),
    reset: optional(_lazy(() => UpdatePlanResetRequestBody$outboundSchema)),
    price: optional(_lazy(() => UpdatePlanPriceRequestBody$outboundSchema)),
    proration: optional(_lazy(() => UpdatePlanProration$outboundSchema)),
    rollover: optional(
      _lazy(() => UpdatePlanRolloverRequestBody$outboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var UpdatePlanDurationTypeRequest$outboundSchema = _enum(UpdatePlanDurationTypeRequest);
var UpdatePlanOnEndRequest$outboundSchema = _enum(UpdatePlanOnEndRequest);
var UpdatePlanFreeTrialParams$outboundSchema = pipe(
  object({
    durationLength: number(),
    durationType: _default(
      UpdatePlanDurationTypeRequest$outboundSchema,
      "month"
    ),
    cardRequired: _default(boolean(), true),
    onEnd: optional(UpdatePlanOnEndRequest$outboundSchema)
  }),
  transform((v) => {
    return remap(v, {
      durationLength: "duration_length",
      durationType: "duration_type",
      cardRequired: "card_required",
      onEnd: "on_end"
    });
  })
);
var UpdatePlanConfigRequest$outboundSchema = pipe(
  object({
    ignorePastDue: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      ignorePastDue: "ignore_past_due"
    });
  })
);
var UpdatePlanPurchaseLimitIntervalRequestBody$outboundSchema = _enum(
  UpdatePlanPurchaseLimitIntervalRequestBody
);
var UpdatePlanPurchaseLimitRequest$outboundSchema = pipe(
  object({
    interval: UpdatePlanPurchaseLimitIntervalRequestBody$outboundSchema,
    intervalCount: _default(number(), 1),
    limit: number()
  }),
  transform((v) => {
    return remap(v, {
      intervalCount: "interval_count"
    });
  })
);
var UpdatePlanAutoTopupRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false),
    threshold: number(),
    quantity: number(),
    purchaseLimit: optional(
      _lazy(() => UpdatePlanPurchaseLimitRequest$outboundSchema)
    ),
    invoiceMode: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      purchaseLimit: "purchase_limit",
      invoiceMode: "invoice_mode"
    });
  })
);
var UpdatePlanLimitTypeRequestBody$outboundSchema = _enum(UpdatePlanLimitTypeRequestBody);
var UpdatePlanSpendLimitRequest$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), false),
    limitType: optional(UpdatePlanLimitTypeRequestBody$outboundSchema),
    overageLimit: optional(number())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      limitType: "limit_type",
      overageLimit: "overage_limit"
    });
  })
);
var UpdatePlanUsageLimitIntervalRequestBody$outboundSchema = _enum(
  UpdatePlanUsageLimitIntervalRequestBody
);
var UpdatePlanUsageLimitRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), true),
    limit: number(),
    interval: UpdatePlanUsageLimitIntervalRequestBody$outboundSchema
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var UpdatePlanThresholdTypeRequestBody$outboundSchema = _enum(UpdatePlanThresholdTypeRequestBody);
var UpdatePlanUsageAlertRequestBody$outboundSchema = pipe(
  object({
    featureId: optional(string()),
    enabled: _default(boolean(), true),
    threshold: number(),
    thresholdType: UpdatePlanThresholdTypeRequestBody$outboundSchema,
    name: optional(string())
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id",
      thresholdType: "threshold_type"
    });
  })
);
var UpdatePlanOverageAllowedRequest$outboundSchema = pipe(
  object({
    featureId: string(),
    enabled: _default(boolean(), false)
  }),
  transform((v) => {
    return remap(v, {
      featureId: "feature_id"
    });
  })
);
var UpdatePlanBillingControlsRequest$outboundSchema = pipe(
  object({
    autoTopups: optional(
      array(_lazy(() => UpdatePlanAutoTopupRequest$outboundSchema))
    ),
    spendLimits: optional(
      array(_lazy(() => UpdatePlanSpendLimitRequest$outboundSchema))
    ),
    usageLimits: optional(
      array(_lazy(() => UpdatePlanUsageLimitRequest$outboundSchema))
    ),
    usageAlerts: optional(
      array(_lazy(() => UpdatePlanUsageAlertRequestBody$outboundSchema))
    ),
    overageAllowed: optional(
      array(_lazy(() => UpdatePlanOverageAllowedRequest$outboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      autoTopups: "auto_topups",
      spendLimits: "spend_limits",
      usageLimits: "usage_limits",
      usageAlerts: "usage_alerts",
      overageAllowed: "overage_allowed"
    });
  })
);
var UpdatePlanParams$outboundSchema = pipe(
  object({
    planId: string(),
    group: _default(string(), ""),
    name: optional(string()),
    description: optional(string()),
    addOn: optional(boolean()),
    autoEnable: optional(boolean()),
    price: optional(
      nullable$1(_lazy(() => UpdatePlanBasePrice$outboundSchema))
    ),
    items: optional(array(_lazy(() => UpdatePlanPlanItem$outboundSchema))),
    freeTrial: optional(
      nullable$1(_lazy(() => UpdatePlanFreeTrialParams$outboundSchema))
    ),
    config: optional(_lazy(() => UpdatePlanConfigRequest$outboundSchema)),
    billingControls: optional(
      _lazy(() => UpdatePlanBillingControlsRequest$outboundSchema)
    ),
    metadata: optional(record(string(), any())),
    createInStripe: _default(boolean(), true),
    version: optional(number()),
    archived: _default(boolean(), false),
    newPlanId: optional(string()),
    disableVersion: optional(boolean())
  }),
  transform((v) => {
    return remap(v, {
      planId: "plan_id",
      addOn: "add_on",
      autoEnable: "auto_enable",
      freeTrial: "free_trial",
      billingControls: "billing_controls",
      createInStripe: "create_in_stripe",
      newPlanId: "new_plan_id",
      disableVersion: "disable_version"
    });
  })
);
var UpdatePlanPriceIntervalResponse$inboundSchema = inboundSchema(UpdatePlanPriceIntervalResponse);
var UpdatePlanPriceDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var UpdatePlanPriceResponse$inboundSchema = pipe(
  object({
    amount: number2(),
    interval: UpdatePlanPriceIntervalResponse$inboundSchema,
    interval_count: optional3(number2()),
    display: optional3(_lazy(() => UpdatePlanPriceDisplay$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var UpdatePlanType$inboundSchema = inboundSchema(UpdatePlanType);
var UpdatePlanFeatureDisplay$inboundSchema = object({
  singular: string4(),
  plural: string4()
});
var UpdatePlanCreditSchema$inboundSchema = pipe(
  object({
    metered_feature_id: string4(),
    credit_cost: number2()
  }),
  transform((v) => {
    return remap(v, {
      "metered_feature_id": "meteredFeatureId",
      "credit_cost": "creditCost"
    });
  })
);
var UpdatePlanFeature$inboundSchema = pipe(
  object({
    id: string4(),
    name: optional(nullable$1(string4())),
    type: UpdatePlanType$inboundSchema,
    display: optional(
      nullable$1(_lazy(() => UpdatePlanFeatureDisplay$inboundSchema))
    ),
    credit_schema: optional(
      nullable$1(array(_lazy(() => UpdatePlanCreditSchema$inboundSchema)))
    ),
    archived: optional(nullable$1(boolean2()))
  }),
  transform((v) => {
    return remap(v, {
      "credit_schema": "creditSchema"
    });
  })
);
var UpdatePlanResetIntervalResponse$inboundSchema = inboundSchema(UpdatePlanResetIntervalResponse);
var UpdatePlanResetResponse$inboundSchema = pipe(
  object({
    interval: UpdatePlanResetIntervalResponse$inboundSchema,
    interval_count: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var UpdatePlanTierResponse$inboundSchema = pipe(
  object({
    to: smartUnion([number2(), string4()]),
    amount: number2(),
    flat_amount: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "flat_amount": "flatAmount"
    });
  })
);
var UpdatePlanTierBehaviorResponse$inboundSchema = inboundSchema(UpdatePlanTierBehaviorResponse);
var UpdatePlanPriceItemIntervalResponse$inboundSchema = inboundSchema(UpdatePlanPriceItemIntervalResponse);
var UpdatePlanBillingMethodResponse$inboundSchema = inboundSchema(UpdatePlanBillingMethodResponse);
var UpdatePlanItemPriceResponse$inboundSchema = pipe(
  object({
    amount: optional3(number2()),
    tiers: optional3(
      array(_lazy(() => UpdatePlanTierResponse$inboundSchema))
    ),
    tier_behavior: optional3(UpdatePlanTierBehaviorResponse$inboundSchema),
    interval: UpdatePlanPriceItemIntervalResponse$inboundSchema,
    interval_count: optional3(number2()),
    billing_units: number2(),
    billing_method: UpdatePlanBillingMethodResponse$inboundSchema,
    max_purchase: nullable(number2())
  }),
  transform((v) => {
    return remap(v, {
      "tier_behavior": "tierBehavior",
      "interval_count": "intervalCount",
      "billing_units": "billingUnits",
      "billing_method": "billingMethod",
      "max_purchase": "maxPurchase"
    });
  })
);
var UpdatePlanItemDisplay$inboundSchema = pipe(
  object({
    primary_text: string4(),
    secondary_text: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "primary_text": "primaryText",
      "secondary_text": "secondaryText"
    });
  })
);
var UpdatePlanExpiryDurationTypeResponse$inboundSchema = inboundSchema(UpdatePlanExpiryDurationTypeResponse);
var UpdatePlanRolloverResponse$inboundSchema = pipe(
  object({
    max: nullable(number2()),
    max_percentage: optional(nullable$1(number2())),
    expiry_duration_type: UpdatePlanExpiryDurationTypeResponse$inboundSchema,
    expiry_duration_length: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "max_percentage": "maxPercentage",
      "expiry_duration_type": "expiryDurationType",
      "expiry_duration_length": "expiryDurationLength"
    });
  })
);
var UpdatePlanItem$inboundSchema = pipe(
  object({
    feature_id: string4(),
    feature: optional3(_lazy(() => UpdatePlanFeature$inboundSchema)),
    included: number2(),
    unlimited: boolean2(),
    reset: nullable(_lazy(() => UpdatePlanResetResponse$inboundSchema)),
    price: nullable(
      _lazy(() => UpdatePlanItemPriceResponse$inboundSchema)
    ),
    display: optional3(_lazy(() => UpdatePlanItemDisplay$inboundSchema)),
    rollover: optional3(
      _lazy(() => UpdatePlanRolloverResponse$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var UpdatePlanDurationTypeResponse$inboundSchema = inboundSchema(UpdatePlanDurationTypeResponse);
var UpdatePlanOnEndResponse$inboundSchema = inboundSchema(UpdatePlanOnEndResponse);
var UpdatePlanFreeTrial$inboundSchema = pipe(
  object({
    duration_length: number2(),
    duration_type: UpdatePlanDurationTypeResponse$inboundSchema,
    card_required: boolean2(),
    on_end: optional(nullable$1(UpdatePlanOnEndResponse$inboundSchema))
  }),
  transform((v) => {
    return remap(v, {
      "duration_length": "durationLength",
      "duration_type": "durationType",
      "card_required": "cardRequired",
      "on_end": "onEnd"
    });
  })
);
var UpdatePlanEnv$inboundSchema = inboundSchema(UpdatePlanEnv);
var UpdatePlanConfigResponse$inboundSchema = pipe(
  object({
    ignore_past_due: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "ignore_past_due": "ignorePastDue"
    });
  })
);
var UpdatePlanPurchaseLimitIntervalResponse$inboundSchema = inboundSchema(UpdatePlanPurchaseLimitIntervalResponse);
var UpdatePlanPurchaseLimitResponse$inboundSchema = pipe(
  object({
    interval: UpdatePlanPurchaseLimitIntervalResponse$inboundSchema,
    interval_count: _default(number2(), 1),
    limit: number2()
  }),
  transform((v) => {
    return remap(v, {
      "interval_count": "intervalCount"
    });
  })
);
var UpdatePlanAutoTopupResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false),
    threshold: number2(),
    quantity: number2(),
    purchase_limit: optional3(
      _lazy(() => UpdatePlanPurchaseLimitResponse$inboundSchema)
    ),
    invoice_mode: optional3(boolean2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "purchase_limit": "purchaseLimit",
      "invoice_mode": "invoiceMode"
    });
  })
);
var UpdatePlanLimitTypeResponse$inboundSchema = inboundSchema(UpdatePlanLimitTypeResponse);
var UpdatePlanSpendLimitResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), false),
    limit_type: optional3(UpdatePlanLimitTypeResponse$inboundSchema),
    overage_limit: optional3(number2())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "limit_type": "limitType",
      "overage_limit": "overageLimit"
    });
  })
);
var UpdatePlanUsageLimitIntervalResponse$inboundSchema = inboundSchema(UpdatePlanUsageLimitIntervalResponse);
var UpdatePlanUsageLimitResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), true),
    limit: number2(),
    interval: UpdatePlanUsageLimitIntervalResponse$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var UpdatePlanThresholdTypeResponse$inboundSchema = inboundSchema(UpdatePlanThresholdTypeResponse);
var UpdatePlanUsageAlertResponse$inboundSchema = pipe(
  object({
    feature_id: optional3(string4()),
    enabled: _default(boolean2(), true),
    threshold: number2(),
    threshold_type: UpdatePlanThresholdTypeResponse$inboundSchema,
    name: optional3(string4())
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId",
      "threshold_type": "thresholdType"
    });
  })
);
var UpdatePlanOverageAllowedResponse$inboundSchema = pipe(
  object({
    feature_id: string4(),
    enabled: _default(boolean2(), false)
  }),
  transform((v) => {
    return remap(v, {
      "feature_id": "featureId"
    });
  })
);
var UpdatePlanBillingControlsResponse$inboundSchema = pipe(
  object({
    auto_topups: optional3(
      array(_lazy(() => UpdatePlanAutoTopupResponse$inboundSchema))
    ),
    spend_limits: optional3(
      array(_lazy(() => UpdatePlanSpendLimitResponse$inboundSchema))
    ),
    usage_limits: optional3(
      array(_lazy(() => UpdatePlanUsageLimitResponse$inboundSchema))
    ),
    usage_alerts: optional3(
      array(_lazy(() => UpdatePlanUsageAlertResponse$inboundSchema))
    ),
    overage_allowed: optional3(
      array(_lazy(() => UpdatePlanOverageAllowedResponse$inboundSchema))
    )
  }),
  transform((v) => {
    return remap(v, {
      "auto_topups": "autoTopups",
      "spend_limits": "spendLimits",
      "usage_limits": "usageLimits",
      "usage_alerts": "usageAlerts",
      "overage_allowed": "overageAllowed"
    });
  })
);
var UpdatePlanStatus$inboundSchema = inboundSchema(UpdatePlanStatus);
var UpdatePlanAttachAction$inboundSchema = inboundSchema(UpdatePlanAttachAction);
var UpdatePlanCustomerEligibility$inboundSchema = pipe(
  object({
    trial_available: optional3(boolean2()),
    status: optional3(UpdatePlanStatus$inboundSchema),
    canceling: optional3(boolean2()),
    trialing: optional3(boolean2()),
    attach_action: UpdatePlanAttachAction$inboundSchema
  }),
  transform((v) => {
    return remap(v, {
      "trial_available": "trialAvailable",
      "attach_action": "attachAction"
    });
  })
);
var UpdatePlanResponse$inboundSchema = pipe(
  object({
    id: string4(),
    name: string4(),
    description: nullable(string4()),
    group: nullable(string4()),
    version: number2(),
    add_on: boolean2(),
    auto_enable: boolean2(),
    price: nullable(_lazy(() => UpdatePlanPriceResponse$inboundSchema)),
    items: array(_lazy(() => UpdatePlanItem$inboundSchema)),
    free_trial: optional3(_lazy(() => UpdatePlanFreeTrial$inboundSchema)),
    created_at: number2(),
    env: UpdatePlanEnv$inboundSchema,
    archived: boolean2(),
    base_variant_id: nullable(string4()),
    config: _lazy(() => UpdatePlanConfigResponse$inboundSchema),
    billing_controls: optional3(
      _lazy(() => UpdatePlanBillingControlsResponse$inboundSchema)
    ),
    metadata: record(string(), any()),
    customer_eligibility: optional3(
      _lazy(() => UpdatePlanCustomerEligibility$inboundSchema)
    )
  }),
  transform((v) => {
    return remap(v, {
      "add_on": "addOn",
      "auto_enable": "autoEnable",
      "free_trial": "freeTrial",
      "created_at": "createdAt",
      "base_variant_id": "baseVariantId",
      "billing_controls": "billingControls",
      "customer_eligibility": "customerEligibility"
    });
  })
);
var _a, _promise, _unwrapped;
_a = Symbol.toStringTag;
var APIPromise = class {
  constructor(p) {
    __privateAdd(this, _promise);
    __privateAdd(this, _unwrapped);
    __publicField(this, _a, "APIPromise");
    __privateSet(this, _promise, p instanceof Promise ? p : Promise.resolve(p));
    __privateSet(this, _unwrapped, p instanceof Promise ? __privateGet(this, _promise).then(([value]) => value) : Promise.resolve(p[0]));
  }
  then(onfulfilled, onrejected) {
    return __privateGet(this, _promise).then(
      onfulfilled ? ([value]) => onfulfilled(value) : void 0,
      onrejected
    );
  }
  catch(onrejected) {
    return __privateGet(this, _unwrapped).catch(onrejected);
  }
  finally(onfinally) {
    return __privateGet(this, _unwrapped).finally(onfinally);
  }
  $inspect() {
    return __privateGet(this, _promise);
  }
};
_promise = /* @__PURE__ */ new WeakMap();
_unwrapped = /* @__PURE__ */ new WeakMap();
function batchTrack(client, request, options) {
  return new APIPromise($do(
    client,
    request,
    options
  ));
}
async function $do(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(array(RequestBody$outboundSchema), value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/balances.batch_track")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "batchTrack",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(202, BatchTrackResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function check(client, request, options) {
  return new APIPromise($do2(
    client,
    request,
    options
  ));
}
async function $do2(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(CheckParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/balances.check")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "check",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, CheckResponse$inboundSchema),
    json(202, CheckResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function trackTokens(client, request, options) {
  return new APIPromise($do3(
    client,
    request,
    options
  ));
}
async function $do3(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(TrackTokensParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/balances.track_tokens")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "trackTokens",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, TrackTokensResponse$inboundSchema),
    json(202, TrackTokensResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function track(client, request, options) {
  return new APIPromise($do4(
    client,
    request,
    options
  ));
}
async function $do4(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(TrackParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/balances.track")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "track",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, TrackResponse$inboundSchema),
    json(202, TrackResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var FAIL_OPEN_OPERATION_IDS = /* @__PURE__ */ new Set([
  "check",
  "track",
  "getOrCreateCustomer",
  "getEntity"
]);
var FAIL_OPEN_LOG_MESSAGE = "[Autumn] Request failed — failing open. Learn more: https://docs.useautumn.com/documentation/fail-open";
var FAIL_OPEN_BODIES = {
  check: {
    allowed: true,
    customer_id: null,
    balance: null,
    flag: null
  },
  track: {
    customer_id: null,
    value: 0,
    balance: null
  },
  getOrCreateCustomer: {
    id: null,
    name: null,
    email: null,
    created_at: 0,
    fingerprint: null,
    stripe_id: null,
    env: "live",
    metadata: {},
    send_email_receipts: false,
    billing_controls: {},
    subscriptions: [],
    purchases: [],
    balances: {},
    flags: {}
  },
  getEntity: {
    id: null,
    name: null,
    customer_id: null,
    feature_id: null,
    created_at: 0,
    env: "live",
    subscriptions: [],
    purchases: [],
    balances: {},
    flags: {}
  }
};
var FailOpenHook = class {
  constructor() {
    __publicField(this, "enabled", true);
  }
  sdkInit(opts) {
    if (opts.failOpen === false) {
      this.enabled = false;
      return opts;
    }
    this.enabled = true;
    opts.httpClient = new HTTPClient({
      fetcher: async (input, init) => {
        try {
          return init == null ? await fetch(input) : await fetch(input, init);
        } catch (error) {
          console.log(error);
          console.log(
            `Network failed to reach Autumn: ${error}. Returning 555 Network Error.`
          );
          return new Response(null, {
            status: 555,
            statusText: "Network Error"
          });
        }
      }
    });
    return opts;
  }
  afterError(hookCtx, response, error) {
    if (!this.enabled) {
      return { response, error };
    }
    if (!response || response.status < 500) {
      return { response, error };
    }
    if (!FAIL_OPEN_OPERATION_IDS.has(hookCtx.operationID)) {
      return { response, error };
    }
    const body = FAIL_OPEN_BODIES[hookCtx.operationID];
    if (!body) {
      return { response, error };
    }
    console.error(FAIL_OPEN_LOG_MESSAGE);
    console.error(
      `  Operation: ${hookCtx.operationID} | Status: ${response.status} | Error: ${error ?? "Server error"}`
    );
    return {
      response: new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }),
      error: null
    };
  }
};
var DEFAULT_TIMEOUT_MS = 5e3;
var AUTO_TIMEOUT_OPERATION_IDS = /* @__PURE__ */ new Set(["check", "track"]);
var TimeoutFixHook = class {
  beforeRequest(hookCtx, request) {
    let timeoutMs = hookCtx.options.timeoutMs;
    if ((!timeoutMs || timeoutMs <= 0) && AUTO_TIMEOUT_OPERATION_IDS.has(hookCtx.operationID))
      timeoutMs = DEFAULT_TIMEOUT_MS;
    if (!timeoutMs || timeoutMs <= 0) return request;
    const signal = typeof AbortSignal.any === "function" ? AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
    return new Request(request, {
      signal
    });
  }
};
function initHooks(hooks) {
  const failOpenHook = new FailOpenHook();
  const timeoutFixHook = new TimeoutFixHook();
  hooks.registerSDKInitHook(failOpenHook);
  hooks.registerBeforeRequestHook(timeoutFixHook);
  hooks.registerAfterErrorHook(failOpenHook);
}
var SDKHooks = class {
  constructor() {
    __publicField(this, "sdkInitHooks", []);
    __publicField(this, "beforeCreateRequestHooks", []);
    __publicField(this, "beforeRequestHooks", []);
    __publicField(this, "afterSuccessHooks", []);
    __publicField(this, "afterErrorHooks", []);
    initHooks(this);
    const presetHooks = [];
    for (const hook of presetHooks) {
      if ("sdkInit" in hook) {
        this.registerSDKInitHook(hook);
      }
      if ("beforeCreateRequest" in hook) {
        this.registerBeforeCreateRequestHook(hook);
      }
      if ("beforeRequest" in hook) {
        this.registerBeforeRequestHook(hook);
      }
      if ("afterSuccess" in hook) {
        this.registerAfterSuccessHook(hook);
      }
      if ("afterError" in hook) {
        this.registerAfterErrorHook(hook);
      }
    }
  }
  registerSDKInitHook(hook) {
    this.sdkInitHooks.push(hook);
  }
  registerBeforeCreateRequestHook(hook) {
    this.beforeCreateRequestHooks.push(hook);
  }
  registerBeforeRequestHook(hook) {
    this.beforeRequestHooks.push(hook);
  }
  registerAfterSuccessHook(hook) {
    this.afterSuccessHooks.push(hook);
  }
  registerAfterErrorHook(hook) {
    this.afterErrorHooks.push(hook);
  }
  sdkInit(opts) {
    return this.sdkInitHooks.reduce((opts2, hook) => hook.sdkInit(opts2), opts);
  }
  beforeCreateRequest(hookCtx, input) {
    let inp = input;
    for (const hook of this.beforeCreateRequestHooks) {
      inp = hook.beforeCreateRequest(hookCtx, inp);
    }
    return inp;
  }
  async beforeRequest(hookCtx, request) {
    let req = request;
    for (const hook of this.beforeRequestHooks) {
      req = await hook.beforeRequest(hookCtx, req);
    }
    return req;
  }
  async afterSuccess(hookCtx, response) {
    let res = response;
    for (const hook of this.afterSuccessHooks) {
      res = await hook.afterSuccess(hookCtx, res);
    }
    return res;
  }
  async afterError(hookCtx, response, error) {
    let res = response;
    let err = error;
    for (const hook of this.afterErrorHooks) {
      const result = await hook.afterError(hookCtx, res, err);
      res = result.response;
      err = result.error;
    }
    return { response: res, error: err };
  }
};
var defaultBackoff = {
  initialInterval: 500,
  maxInterval: 6e4,
  exponent: 1.5,
  maxElapsedTime: 36e5
};
var PermanentError = class _PermanentError extends Error {
  constructor(message, options) {
    let msg = message;
    if (options?.cause) {
      msg += `: ${options.cause}`;
    }
    super(msg, options);
    __publicField(this, "cause");
    this.name = "PermanentError";
    if (typeof this.cause === "undefined") {
      this.cause = options?.cause;
    }
    Object.setPrototypeOf(this, _PermanentError.prototype);
  }
};
var TemporaryError = class _TemporaryError extends Error {
  constructor(message, response) {
    super(message);
    __publicField(this, "response");
    this.response = response;
    this.name = "TemporaryError";
    Object.setPrototypeOf(this, _TemporaryError.prototype);
  }
};
async function retry(fetchFn, options) {
  switch (options.config.strategy) {
    case "backoff":
      return retryBackoff(
        wrapFetcher(fetchFn, {
          statusCodes: options.statusCodes,
          retryConnectionErrors: !!options.config.retryConnectionErrors
        }),
        options.config.backoff ?? defaultBackoff
      );
    default:
      return await fetchFn();
  }
}
function wrapFetcher(fn, options) {
  return async () => {
    try {
      const res = await fn();
      if (isRetryableResponse(res, options.statusCodes)) {
        throw new TemporaryError(
          "Response failed with retryable status code",
          res
        );
      }
      return res;
    } catch (err) {
      if (err instanceof TemporaryError) {
        throw err;
      }
      if (options.retryConnectionErrors && (isTimeoutError(err) || isConnectionError(err))) {
        throw err;
      }
      throw new PermanentError("Permanent error", { cause: err });
    }
  };
}
var codeRangeRE2 = new RegExp("^[0-9]xx$", "i");
function isRetryableResponse(res, statusCodes) {
  const actual = `${res.status}`;
  return statusCodes.some((code) => {
    if (!codeRangeRE2.test(code)) {
      return code === actual;
    }
    const expectFamily = code.charAt(0);
    if (!expectFamily) {
      throw new Error("Invalid status code range");
    }
    const actualFamily = actual.charAt(0);
    if (!actualFamily) {
      throw new Error(`Invalid response status code: ${actual}`);
    }
    return actualFamily === expectFamily;
  });
}
async function retryBackoff(fn, strategy) {
  const { maxElapsedTime, initialInterval, exponent, maxInterval } = strategy;
  const start = Date.now();
  let x = 0;
  while (true) {
    try {
      const res = await fn();
      return res;
    } catch (err) {
      if (err instanceof PermanentError) {
        throw err.cause;
      }
      const elapsed = Date.now() - start;
      if (elapsed > maxElapsedTime) {
        if (err instanceof TemporaryError) {
          return err.response;
        }
        throw err;
      }
      let retryInterval = 0;
      if (err instanceof TemporaryError) {
        retryInterval = retryIntervalFromResponse(err.response);
      }
      if (retryInterval <= 0) {
        retryInterval = initialInterval * Math.pow(x, exponent) + Math.random() * 1e3;
      }
      const d = Math.min(retryInterval, maxInterval);
      await delay(d);
      x++;
    }
  }
}
function retryIntervalFromResponse(res) {
  const retryVal = res.headers.get("retry-after") || "";
  if (!retryVal) {
    return 0;
  }
  const parsedNumber = Number(retryVal);
  if (Number.isInteger(parsedNumber)) {
    return parsedNumber * 1e3;
  }
  const parsedDate = Date.parse(retryVal);
  if (Number.isInteger(parsedDate)) {
    const deltaMS = parsedDate - Date.now();
    return deltaMS > 0 ? Math.ceil(deltaMS) : 0;
  }
  return 0;
}
async function delay(delay2) {
  return new Promise((resolve) => setTimeout(resolve, delay2));
}
var gt = typeof globalThis === "undefined" ? null : globalThis;
var webWorkerLike = typeof gt === "object" && gt != null && "importScripts" in gt && typeof gt["importScripts"] === "function";
var isBrowserLike = webWorkerLike || typeof navigator !== "undefined" && "serviceWorker" in navigator || typeof window === "object" && typeof window.document !== "undefined";
var _httpClient, _hooks, _logger;
var ClientSDK = class {
  constructor(options = {}) {
    __privateAdd(this, _httpClient);
    __privateAdd(this, _hooks);
    __privateAdd(this, _logger);
    __publicField(this, "_baseURL");
    __publicField(this, "_options");
    const opt = options;
    if (typeof opt === "object" && opt != null && "hooks" in opt && opt.hooks instanceof SDKHooks) {
      __privateSet(this, _hooks, opt.hooks);
    } else {
      __privateSet(this, _hooks, new SDKHooks());
    }
    const defaultHttpClient = new HTTPClient();
    options.httpClient = options.httpClient || defaultHttpClient;
    options = __privateGet(this, _hooks).sdkInit(options);
    const url = serverURLFromOptions(options);
    if (url) {
      url.pathname = url.pathname.replace(/\/+$/, "") + "/";
    }
    this._baseURL = url;
    __privateSet(this, _httpClient, options.httpClient || defaultHttpClient);
    this._options = { ...fillGlobals(options), hooks: __privateGet(this, _hooks) };
    __privateSet(this, _logger, this._options.debugLogger);
    if (!__privateGet(this, _logger) && env().AUTUMN_DEBUG) {
      __privateSet(this, _logger, console);
    }
  }
  _createRequest(context, conf, options) {
    const { method, path, query, headers: opHeaders, security } = conf;
    const base = conf.baseURL ?? this._baseURL;
    if (!base) {
      return ERR(new InvalidRequestError("No base URL provided for operation"));
    }
    const baseURL = new URL(base);
    let reqURL;
    if (path) {
      baseURL.pathname = baseURL.pathname.replace(/\/+$/, "") + "/";
      reqURL = new URL(path, baseURL);
    } else {
      reqURL = baseURL;
    }
    reqURL.hash = "";
    let finalQuery = query || "";
    const secQuery = [];
    for (const [k, v] of Object.entries(security?.queryParams || {})) {
      const q = encodeForm(k, v, { charEncoding: "percent" });
      if (typeof q !== "undefined") {
        secQuery.push(q);
      }
    }
    if (secQuery.length) {
      finalQuery += `&${secQuery.join("&")}`;
    }
    if (finalQuery) {
      const q = finalQuery.startsWith("&") ? finalQuery.slice(1) : finalQuery;
      reqURL.search = `?${q}`;
    }
    const headers = new Headers(opHeaders);
    const username = security?.basic.username;
    const password = security?.basic.password;
    if (username != null || password != null) {
      const encoded = stringToBase64(
        [username || "", password || ""].join(":")
      );
      headers.set("Authorization", `Basic ${encoded}`);
    }
    const securityHeaders = new Headers(security?.headers || {});
    for (const [k, v] of securityHeaders) {
      headers.set(k, v);
    }
    let cookie = headers.get("cookie") || "";
    for (const [k, v] of Object.entries(security?.cookies || {})) {
      cookie += `; ${k}=${v}`;
    }
    cookie = cookie.startsWith("; ") ? cookie.slice(2) : cookie;
    headers.set("cookie", cookie);
    const userHeaders = new Headers(
      options?.headers ?? options?.fetchOptions?.headers
    );
    for (const [k, v] of userHeaders) {
      headers.set(k, v);
    }
    if (!isBrowserLike) {
      headers.set(
        conf.uaHeader ?? "user-agent",
        conf.userAgent ?? SDK_METADATA.userAgent
      );
    }
    const fetchOptions = {
      ...options?.fetchOptions,
      ...options
    };
    if (!fetchOptions?.signal && conf.timeoutMs && conf.timeoutMs > 0) {
      const timeoutSignal = AbortSignal.timeout(conf.timeoutMs);
      fetchOptions.signal = timeoutSignal;
    }
    if (conf.body instanceof ReadableStream) {
      Object.assign(fetchOptions, { duplex: "half" });
    }
    let input;
    try {
      input = __privateGet(this, _hooks).beforeCreateRequest(context, {
        url: reqURL,
        options: {
          ...fetchOptions,
          body: conf.body ?? null,
          headers,
          method
        }
      });
    } catch (err) {
      return ERR(
        new UnexpectedClientError("Create request hook failed to execute", {
          cause: err
        })
      );
    }
    return OK(new Request(input.url, input.options));
  }
  async _do(request, options) {
    const { context, isErrorStatusCode } = options;
    return retry(
      async () => {
        const req = await __privateGet(this, _hooks).beforeRequest(context, request.clone());
        await logRequest(__privateGet(this, _logger), req).catch(
          (e) => __privateGet(this, _logger)?.log("Failed to log request:", e)
        );
        let response = await __privateGet(this, _httpClient).request(req);
        try {
          if (isErrorStatusCode(response.status)) {
            const result = await __privateGet(this, _hooks).afterError(
              context,
              response,
              null
            );
            if (result.error) {
              throw result.error;
            }
            response = result.response || response;
          } else {
            response = await __privateGet(this, _hooks).afterSuccess(context, response);
          }
        } finally {
          await logResponse(__privateGet(this, _logger), response, req).catch((e) => __privateGet(this, _logger)?.log("Failed to log response:", e));
        }
        return response;
      },
      { config: options.retryConfig, statusCodes: options.retryCodes }
    ).then(
      (r) => OK(r),
      (err) => {
        switch (true) {
          case isAbortError(err):
            return ERR(
              new RequestAbortedError("Request aborted by client", {
                cause: err
              })
            );
          case isTimeoutError(err):
            return ERR(
              new RequestTimeoutError("Request timed out", { cause: err })
            );
          case isConnectionError(err):
            return ERR(
              new ConnectionError("Unable to make request", { cause: err })
            );
          default:
            return ERR(
              new UnexpectedClientError("Unexpected HTTP client error", {
                cause: err
              })
            );
        }
      }
    );
  }
};
_httpClient = /* @__PURE__ */ new WeakMap();
_hooks = /* @__PURE__ */ new WeakMap();
_logger = /* @__PURE__ */ new WeakMap();
var jsonLikeContentTypeRE = /^(application|text)\/([^+]+\+)*json.*/;
var jsonlLikeContentTypeRE = /^(application|text)\/([^+]+\+)*(jsonl|x-ndjson)\b.*/;
async function logRequest(logger, req) {
  if (!logger) {
    return;
  }
  const contentType = req.headers.get("content-type");
  const ct = contentType?.split(";")[0] || "";
  logger.group(`> Request: ${req.method} ${req.url}`);
  logger.group("Headers:");
  for (const [k, v] of req.headers.entries()) {
    logger.log(`${k}: ${v}`);
  }
  logger.groupEnd();
  logger.group("Body:");
  switch (true) {
    case jsonLikeContentTypeRE.test(ct):
      logger.log(await req.clone().json());
      break;
    case ct.startsWith("text/"):
      logger.log(await req.clone().text());
      break;
    case ct === "multipart/form-data": {
      const body = await req.clone().formData();
      for (const [k, v] of body) {
        const vlabel = v instanceof Blob ? "<Blob>" : v;
        logger.log(`${k}: ${vlabel}`);
      }
      break;
    }
    default:
      logger.log(`<${contentType}>`);
      break;
  }
  logger.groupEnd();
  logger.groupEnd();
}
async function logResponse(logger, res, req) {
  if (!logger) {
    return;
  }
  const contentType = res.headers.get("content-type");
  const ct = contentType?.split(";")[0] || "";
  logger.group(`< Response: ${req.method} ${req.url}`);
  logger.log("Status Code:", res.status, res.statusText);
  logger.group("Headers:");
  for (const [k, v] of res.headers.entries()) {
    logger.log(`${k}: ${v}`);
  }
  logger.groupEnd();
  logger.group("Body:");
  switch (true) {
    case (matchContentType(res, "application/json") || jsonLikeContentTypeRE.test(ct) && !jsonlLikeContentTypeRE.test(ct)):
      logger.log(await res.clone().json());
      break;
    case (matchContentType(res, "application/jsonl") || jsonlLikeContentTypeRE.test(ct)):
    case matchContentType(res, "text/event-stream"):
      logger.log(`<${contentType}>`);
      break;
    case matchContentType(res, "text/*"):
      logger.log(await res.clone().text());
      break;
    case matchContentType(res, "multipart/form-data"): {
      const body = await res.clone().formData();
      for (const [k, v] of body) {
        const vlabel = v instanceof Blob ? "<Blob>" : v;
        logger.log(`${k}: ${vlabel}`);
      }
      break;
    }
    default:
      logger.log(`<${contentType}>`);
      break;
  }
  logger.groupEnd();
  logger.groupEnd();
}
function balancesCreate(client, request, options) {
  return new APIPromise($do5(
    client,
    request,
    options
  ));
}
async function $do5(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(CreateBalanceParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/balances.create")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "createBalance",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, CreateBalanceResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function balancesDelete(client, request, options) {
  return new APIPromise($do6(
    client,
    request,
    options
  ));
}
async function $do6(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(DeleteBalanceParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/balances.delete")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "deleteBalance",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, DeleteBalanceResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function balancesFinalize(client, request, options) {
  return new APIPromise($do7(
    client,
    request,
    options
  ));
}
async function $do7(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(FinalizeBalanceParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/balances.finalize")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "finalizeLock",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, FinalizeLockResponse$inboundSchema),
    json(202, FinalizeLockResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function balancesUpdate(client, request, options) {
  return new APIPromise($do8(
    client,
    request,
    options
  ));
}
async function $do8(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(UpdateBalanceParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/balances.update")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "updateBalance",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, UpdateBalanceResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Balances = class extends ClientSDK {
  /**
   * Create a balance for a customer feature.
   */
  async create(request, options) {
    return unwrapAsync(balancesCreate(
      this,
      request,
      options
    ));
  }
  /**
   * Update a customer balance.
   */
  async update(request, options) {
    return unwrapAsync(balancesUpdate(
      this,
      request,
      options
    ));
  }
  /**
   * Delete a balance for a customer feature. Can only delete a balance that is not attached to a price (eg. you cannot delete messages that have an overage price).
   */
  async delete(request, options) {
    return unwrapAsync(balancesDelete(
      this,
      request,
      options
    ));
  }
  /**
   * Finalize a previously locked balance. Use 'confirm' to commit the deduction, or 'release' to return the held balance.
   */
  async finalize(request, options) {
    return unwrapAsync(balancesFinalize(
      this,
      request,
      options
    ));
  }
};
function billingAttach(client, request, options) {
  return new APIPromise($do9(
    client,
    request,
    options
  ));
}
async function $do9(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(AttachParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/billing.attach")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "attach",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, AttachResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function billingCreateSchedule(client, request, options) {
  return new APIPromise($do10(
    client,
    request,
    options
  ));
}
async function $do10(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(CreateScheduleParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/billing.create_schedule")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "createSchedule",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, CreateScheduleResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function billingMultiAttach(client, request, options) {
  return new APIPromise($do11(
    client,
    request,
    options
  ));
}
async function $do11(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(MultiAttachParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/billing.multi_attach")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "multiAttach",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, MultiAttachResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function billingOpenCustomerPortal(client, request, options) {
  return new APIPromise($do12(
    client,
    request,
    options
  ));
}
async function $do12(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(OpenCustomerPortalParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/billing.open_customer_portal")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "openCustomerPortal",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, OpenCustomerPortalResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function billingPreviewAttach(client, request, options) {
  return new APIPromise($do13(
    client,
    request,
    options
  ));
}
async function $do13(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(PreviewAttachParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/billing.preview_attach")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "previewAttach",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, PreviewAttachResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function billingPreviewMultiAttach(client, request, options) {
  return new APIPromise($do14(
    client,
    request,
    options
  ));
}
async function $do14(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(PreviewMultiAttachParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/billing.preview_multi_attach")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "previewMultiAttach",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, PreviewMultiAttachResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function billingPreviewUpdate(client, request, options) {
  return new APIPromise($do15(
    client,
    request,
    options
  ));
}
async function $do15(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(PreviewUpdateParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/billing.preview_update")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "previewUpdate",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, PreviewUpdateResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function billingSetupPayment(client, request, options) {
  return new APIPromise($do16(
    client,
    request,
    options
  ));
}
async function $do16(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(SetupPaymentParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/billing.setup_payment")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "setupPayment",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, SetupPaymentResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function billingUpdate(client, request, options) {
  return new APIPromise($do17(
    client,
    request,
    options
  ));
}
async function $do17(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(UpdateSubscriptionParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/billing.update")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "billingUpdate",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, BillingUpdateResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Billing = class extends ClientSDK {
  /**
   * Attaches a plan to a customer. Handles new subscriptions, upgrades and downgrades.
   *
   * Use this endpoint to subscribe a customer to a plan, upgrade/downgrade between plans, or add an add-on product.
   *
   * @example
   * ```typescript
   * // Attach a plan to a customer
   * const response = await client.billing.attach({ customerId: "cus_123", planId: "pro_plan" });
   * ```
   *
   * @example
   * ```typescript
   * // Attach with a free trial
   * const response = await client.billing.attach({ customerId: "cus_123", planId: "pro_plan", freeTrial: {"durationLength":14,"durationType":"day"} });
   * ```
   *
   * @example
   * ```typescript
   * // Attach with custom pricing
   * const response = await client.billing.attach({ customerId: "cus_123", planId: "pro_plan", customize: {"price":{"amount":4900,"interval":"month"}} });
   * ```
   *
   * @param customerId - The ID of the customer to attach the plan to.
   * @param entityId - The ID of the entity to attach the plan to. (optional)
   * @param planId - The ID of the plan.
   * @param featureQuantities - If this plan contains prepaid features, use this field to specify the quantity of each prepaid feature. This quantity includes the included amount and billing units defined when setting up the plan. (optional)
   * @param version - The version of the plan to attach. (optional)
   * @param customize - Customize the plan to attach. Can override the price, items, free trial, or a combination. (optional)
   * @param invoiceMode - Invoice mode creates a draft or open invoice and sends it to the customer, instead of charging their card immediately. This uses Stripe's send_invoice collection method. (optional)
   * @param prorationBehavior - How to handle proration when updating an existing subscription. 'prorate_immediately' charges/credits prorated amounts now, 'none' skips creating any charges. (optional)
   * @param redirectMode - Controls when to return a checkout URL. 'always' returns a URL even if payment succeeds, 'if_required' only when payment action is needed, 'never' disables redirects. (optional)
   * @param subscriptionId - A unique ID to identify this subscription. Can be used to target specific subscriptions in update operations when a customer has multiple products with the same plan. (optional)
   * @param discounts - List of discounts to apply. Each discount can be an Autumn reward ID, Stripe coupon ID, or Stripe promotion code. (optional)
   * @param successUrl - URL to redirect to after successful checkout. (optional)
   * @param newBillingSubscription - Only applicable when the customer has an existing Stripe subscription. If true, creates a new separate subscription instead of merging into the existing one. (optional)
   * @param billingCycleAnchor - Reset the billing cycle anchor immediately with 'now'. (optional)
   * @param planSchedule - When the plan change should take effect. 'immediate' applies now, 'end_of_cycle' schedules for the end of the current billing cycle. By default, upgrades are immediate and downgrades are scheduled. (optional)
   * @param startsAt - Unix timestamp in milliseconds for when the attached plan should start. Future dates create a scheduled subscription. (optional)
   * @param endsAt - Unix timestamp in milliseconds for when the attached plan should end. (optional)
   * @param checkoutSessionParams - Additional parameters to pass into the creation of the Stripe checkout session. (optional)
   * @param longLivedCheckout - If true, returns an Autumn-hosted checkout link that can create a fresh Stripe checkout session when opened. (optional)
   * @param customLineItems - Custom line items that override the auto-generated proration invoice. Only valid for immediate plan changes (eg. upgrades or one off plans). (optional)
   * @param processorSubscriptionId - The processor subscription ID to link. Use this to attach an existing Stripe subscription instead of creating a new one. (optional)
   * @param carryOverBalances - Whether to carry over balances from the previous plan. (optional)
   * @param carryOverUsages - Whether to carry over usages from the previous plan. (optional)
   * @param metadata - Key-value metadata to attach to the Stripe subscription, invoice, and checkout session created during this attach flow. Keys prefixed with 'autumn_' are reserved and will be stripped. (optional)
   * @param noBillingChanges - If true, skips any billing changes for the attach operation. (optional)
   * @param enablePlanImmediately - If true, the customer's plan is activated immediately even when payment is deferred (invoice mode) or pending (Stripe checkout). For Stripe checkout, the customer_product is inserted before the customer completes the hosted form. (optional)
   * @param taxRateId - Stripe tax rate ID (txr_...) to apply as the default tax rate on the created subscription, invoice, or checkout session line items. (optional)
   *
   * @returns A billing response with customer ID, invoice details, and payment URL (if checkout required).
   */
  async attach(request, options) {
    return unwrapAsync(billingAttach(
      this,
      request,
      options
    ));
  }
  /**
   * Creates a multi-phase subscription schedule for a customer. The first phase starts immediately and subsequent phases automatically transition at their scheduled start times.
   *
   * Use this endpoint to schedule future plan changes (e.g. switch from a trial plan to a paid plan on a specific date) or to define a sequence of plans that should activate over time.
   *
   * @example
   * ```typescript
   * // Schedule a transition from a trial plan to a paid plan
   * const response = await client.billing.createSchedule({ customerId: "cus_123", phases: [{"startsAt":1782490690668,"plans":[{"planId":"trial_plan"}]},{"startsAt":1783700290668,"plans":[{"planId":"pro_plan"}]}] });
   * ```
   *
   * @param customerId - The ID of the customer to create the schedule for.
   * @param entityId - Optional entity ID for an entity-scoped schedule. (optional)
   * @param invoiceMode - Invoice mode creates and sends an invoice instead of charging the customer's payment method immediately for the first phase. (optional)
   * @param discounts - List of discounts to apply to the immediate phase. Each discount can be an Autumn reward ID, Stripe coupon ID, or Stripe promotion code. (optional)
   * @param successUrl - URL to redirect to after successful checkout. (optional)
   * @param checkoutSessionParams - Additional parameters to pass into the creation of the Stripe checkout session. (optional)
   * @param redirectMode - Controls when to return a checkout URL for the immediate phase. 'always' forces a confirmation or checkout flow, 'if_required' only redirects when needed, and 'never' disables redirects. (optional)
   * @param billingBehavior - Whether to prorate the immediate phase. 'none' skips proration charges and credits. (optional)
   * @param billingCycleAnchor - Pass 'now' to reset the billing cycle anchor of the immediate phase to the current time. (optional)
   * @param enablePlanImmediately - If true, the immediate-phase cusProducts are activated immediately (and scheduled-phase cusProducts pre-inserted) even when payment is pending via Stripe checkout. The Autumn schedule rows are persisted on checkout.session.completed. (optional)
   * @param phases - Ordered phase definitions for the schedule.
   *
   * @returns A create-schedule response with the schedule ID, persisted phases, and any required payment or checkout URL.
   */
  async createSchedule(request, options) {
    return unwrapAsync(billingCreateSchedule(
      this,
      request,
      options
    ));
  }
  /**
   * Attaches multiple plans to a customer in a single request. Creates a single Stripe subscription with all plans consolidated.
   *
   * Use this endpoint when you need to subscribe a customer to multiple plans at once, such as a base plan plus add-ons, or to create a bundle of products.
   *
   * @example
   * ```typescript
   * // Attach multiple plans to a customer
   * const response = await client.billing.multiAttach({ customerId: "cus_123", plans: [{"planId":"pro_plan"},{"planId":"addon_seats","featureQuantities":[{"featureId":"seats","quantity":5}]}] });
   * ```
   *
   * @example
   * ```typescript
   * // Attach with free trial applied to all plans
   * const response = await client.billing.multiAttach({ customerId: "cus_123", plans: [{"planId":"pro_plan"},{"planId":"addon_storage"}], freeTrial: {"durationLength":14,"durationType":"day"} });
   * ```
   *
   * @example
   * ```typescript
   * // Attach with custom pricing on one plan
   * const response = await client.billing.multiAttach({ customerId: "cus_123", plans: [{"planId":"pro_plan","customize":{"price":{"amount":4900,"interval":"month"}}},{"planId":"addon_support"}] });
   * ```
   *
   * @param customerId - The ID of the customer to attach the plans to.
   * @param entityId - The ID of the entity to attach the plans to. (optional)
   * @param plans - The list of plans to attach to the customer.
   * @param freeTrial - Free trial configuration applied to all plans. Pass an object to set a custom trial, or null to remove any trial. (optional)
   * @param invoiceMode - Invoice mode creates a draft or open invoice and sends it to the customer, instead of charging their card immediately. (optional)
   * @param discounts - List of discounts to apply. Each discount can be an Autumn reward ID, Stripe coupon ID, or Stripe promotion code. (optional)
   * @param successUrl - URL to redirect to after successful checkout. (optional)
   * @param checkoutSessionParams - Additional parameters to pass into the creation of the Stripe checkout session. (optional)
   * @param redirectMode - Controls when to return a checkout URL. 'always' returns a URL even if payment succeeds, 'if_required' only when payment action is needed, 'never' disables redirects. (optional)
   * @param newBillingSubscription - Only applicable when the customer has an existing Stripe subscription. If true, creates a new separate subscription instead of merging into the existing one. (optional)
   * @param enablePlanImmediately - If true, the cusProducts are activated immediately even when payment is pending via Stripe checkout. (optional)
   *
   * @returns A billing response with customer ID, invoice details, and payment URL (if checkout required).
   */
  async multiAttach(request, options) {
    return unwrapAsync(billingMultiAttach(
      this,
      request,
      options
    ));
  }
  /**
   * Previews the billing changes that would occur when attaching a plan, without actually making any changes.
   *
   * Use this endpoint to show customers what they will be charged before confirming a subscription change.
   *
   * @example
   * ```typescript
   * // Preview attaching a plan
   * const response = await client.billing.previewAttach({ customerId: "cus_123", planId: "pro_plan" });
   * ```
   *
   * @param customerId - The ID of the customer to attach the plan to.
   * @param entityId - The ID of the entity to attach the plan to. (optional)
   * @param planId - The ID of the plan.
   * @param featureQuantities - If this plan contains prepaid features, use this field to specify the quantity of each prepaid feature. This quantity includes the included amount and billing units defined when setting up the plan. (optional)
   * @param version - The version of the plan to attach. (optional)
   * @param customize - Customize the plan to attach. Can override the price, items, free trial, or a combination. (optional)
   * @param invoiceMode - Invoice mode creates a draft or open invoice and sends it to the customer, instead of charging their card immediately. This uses Stripe's send_invoice collection method. (optional)
   * @param prorationBehavior - How to handle proration when updating an existing subscription. 'prorate_immediately' charges/credits prorated amounts now, 'none' skips creating any charges. (optional)
   * @param redirectMode - Controls when to return a checkout URL. 'always' returns a URL even if payment succeeds, 'if_required' only when payment action is needed, 'never' disables redirects. (optional)
   * @param subscriptionId - A unique ID to identify this subscription. Can be used to target specific subscriptions in update operations when a customer has multiple products with the same plan. (optional)
   * @param discounts - List of discounts to apply. Each discount can be an Autumn reward ID, Stripe coupon ID, or Stripe promotion code. (optional)
   * @param successUrl - URL to redirect to after successful checkout. (optional)
   * @param newBillingSubscription - Only applicable when the customer has an existing Stripe subscription. If true, creates a new separate subscription instead of merging into the existing one. (optional)
   * @param billingCycleAnchor - Reset the billing cycle anchor immediately with 'now'. (optional)
   * @param planSchedule - When the plan change should take effect. 'immediate' applies now, 'end_of_cycle' schedules for the end of the current billing cycle. By default, upgrades are immediate and downgrades are scheduled. (optional)
   * @param startsAt - Unix timestamp in milliseconds for when the attached plan should start. Future dates create a scheduled subscription. (optional)
   * @param endsAt - Unix timestamp in milliseconds for when the attached plan should end. (optional)
   * @param checkoutSessionParams - Additional parameters to pass into the creation of the Stripe checkout session. (optional)
   * @param longLivedCheckout - If true, returns an Autumn-hosted checkout link that can create a fresh Stripe checkout session when opened. (optional)
   * @param customLineItems - Custom line items that override the auto-generated proration invoice. Only valid for immediate plan changes (eg. upgrades or one off plans). (optional)
   * @param processorSubscriptionId - The processor subscription ID to link. Use this to attach an existing Stripe subscription instead of creating a new one. (optional)
   * @param carryOverBalances - Whether to carry over balances from the previous plan. (optional)
   * @param carryOverUsages - Whether to carry over usages from the previous plan. (optional)
   * @param metadata - Key-value metadata to attach to the Stripe subscription, invoice, and checkout session created during this attach flow. Keys prefixed with 'autumn_' are reserved and will be stripped. (optional)
   * @param noBillingChanges - If true, skips any billing changes for the attach operation. (optional)
   * @param enablePlanImmediately - If true, the customer's plan is activated immediately even when payment is deferred (invoice mode) or pending (Stripe checkout). For Stripe checkout, the customer_product is inserted before the customer completes the hosted form. (optional)
   * @param taxRateId - Stripe tax rate ID (txr_...) to apply as the default tax rate on the created subscription, invoice, or checkout session line items. (optional)
   *
   * @returns A preview response with line items, totals, and effective dates for the proposed changes.
   */
  async previewAttach(request, options) {
    return unwrapAsync(billingPreviewAttach(
      this,
      request,
      options
    ));
  }
  /**
   * Previews the billing changes that would occur when attaching multiple plans, without actually making any changes.
   *
   * Use this endpoint to show customers what they will be charged before confirming a multi-plan subscription.
   *
   * @example
   * ```typescript
   * // Preview attaching multiple plans
   * const response = await client.billing.previewMultiAttach({ customerId: "cus_123", plans: [{"planId":"pro_plan"},{"planId":"addon_seats","featureQuantities":[{"featureId":"seats","quantity":5}]}] });
   * ```
   *
   * @param customerId - The ID of the customer to attach the plans to.
   * @param entityId - The ID of the entity to attach the plans to. (optional)
   * @param plans - The list of plans to attach to the customer.
   * @param freeTrial - Free trial configuration applied to all plans. Pass an object to set a custom trial, or null to remove any trial. (optional)
   * @param invoiceMode - Invoice mode creates a draft or open invoice and sends it to the customer, instead of charging their card immediately. (optional)
   * @param discounts - List of discounts to apply. Each discount can be an Autumn reward ID, Stripe coupon ID, or Stripe promotion code. (optional)
   * @param successUrl - URL to redirect to after successful checkout. (optional)
   * @param checkoutSessionParams - Additional parameters to pass into the creation of the Stripe checkout session. (optional)
   * @param redirectMode - Controls when to return a checkout URL. 'always' returns a URL even if payment succeeds, 'if_required' only when payment action is needed, 'never' disables redirects. (optional)
   * @param newBillingSubscription - Only applicable when the customer has an existing Stripe subscription. If true, creates a new separate subscription instead of merging into the existing one. (optional)
   * @param enablePlanImmediately - If true, the cusProducts are activated immediately even when payment is pending via Stripe checkout. (optional)
   *
   * @returns A preview response with line items, totals, and effective dates for the proposed multi-plan attachment.
   */
  async previewMultiAttach(request, options) {
    return unwrapAsync(billingPreviewMultiAttach(
      this,
      request,
      options
    ));
  }
  /**
   * Updates an existing subscription. Use to modify feature quantities, cancel, or change plan configuration.
   *
   * Use this endpoint to update prepaid quantities, cancel a subscription (immediately or at end of cycle), or modify subscription settings.
   *
   * @example
   * ```typescript
   * // Update prepaid feature quantity
   * const response = await client.billing.update({ customerId: "cus_123", planId: "pro_plan", featureQuantities: [{"featureId":"seats","quantity":10}] });
   * ```
   *
   * @example
   * ```typescript
   * // Cancel a subscription at end of billing cycle
   * const response = await client.billing.update({ customerId: "cus_123", planId: "pro_plan", cancelAction: "cancel_end_of_cycle" });
   * ```
   *
   * @example
   * ```typescript
   * // Uncancel a subscription at the end of the billing cycle
   * const response = await client.billing.update({ customerId: "cus_123", planId: "pro_plan", cancelAction: "uncancel" });
   * ```
   *
   * @param customerId - The ID of the customer to attach the plan to.
   * @param entityId - The ID of the entity to attach the plan to. (optional)
   * @param planId - The ID of the plan to update. Optional if subscription_id is provided, or if the customer has only one product. (optional)
   * @param featureQuantities - If this plan contains prepaid features, use this field to specify the quantity of each prepaid feature. This quantity includes the included amount and billing units defined when setting up the plan. (optional)
   * @param version - The version of the plan to attach. (optional)
   * @param customize - Customize the plan to attach. Can override the price, items, free trial, or a combination. (optional)
   * @param invoiceMode - Invoice mode creates a draft or open invoice and sends it to the customer, instead of charging their card immediately. This uses Stripe's send_invoice collection method. (optional)
   * @param prorationBehavior - How to handle proration when updating an existing subscription. 'prorate_immediately' charges/credits prorated amounts now, 'none' skips creating any charges. (optional)
   * @param redirectMode - Controls when to return a checkout URL. 'always' returns a URL even if payment succeeds, 'if_required' only when payment action is needed, 'never' disables redirects. (optional)
   * @param subscriptionId - A unique ID to identify this subscription. Can be used to target specific subscriptions in update operations when a customer has multiple products with the same plan. (optional)
   * @param discounts - List of discounts to apply. Each discount can be an Autumn reward ID, Stripe coupon ID, or Stripe promotion code. (optional)
   * @param cancelAction - Action to perform for cancellation. 'cancel_immediately' cancels now with prorated refund, 'cancel_end_of_cycle' cancels at period end, 'uncancel' reverses a pending cancellation. (optional)
   * @param billingCycleAnchor - Reset the billing cycle anchor immediately with 'now' (optional)
   * @param noBillingChanges - If true, the subscription is updated internally without applying billing changes in Stripe. (optional)
   * @param recalculateBalances - Controls whether balances should be recalculated during the subscription update. (optional)
   * @param carryOverUsages - Whether to carry over usages from the previous plan. (optional)
   *
   * @returns A billing response with customer ID, invoice details, and payment URL (if next action is required).
   */
  async update(request, options) {
    return unwrapAsync(billingUpdate(
      this,
      request,
      options
    ));
  }
  /**
   * Previews the billing changes that would occur when updating a subscription, without actually making any changes.
   *
   * Use this endpoint to show customers prorated charges or refunds before confirming subscription modifications.
   *
   * @example
   * ```typescript
   * // Preview updating seat quantity
   * const response = await client.billing.previewUpdate({ customerId: "cus_123", planId: "pro_plan", featureQuantities: [{"featureId":"seats","quantity":15}] });
   * ```
   *
   * @param customerId - The ID of the customer to attach the plan to.
   * @param entityId - The ID of the entity to attach the plan to. (optional)
   * @param planId - The ID of the plan to update. Optional if subscription_id is provided, or if the customer has only one product. (optional)
   * @param featureQuantities - If this plan contains prepaid features, use this field to specify the quantity of each prepaid feature. This quantity includes the included amount and billing units defined when setting up the plan. (optional)
   * @param version - The version of the plan to attach. (optional)
   * @param customize - Customize the plan to attach. Can override the price, items, free trial, or a combination. (optional)
   * @param invoiceMode - Invoice mode creates a draft or open invoice and sends it to the customer, instead of charging their card immediately. This uses Stripe's send_invoice collection method. (optional)
   * @param prorationBehavior - How to handle proration when updating an existing subscription. 'prorate_immediately' charges/credits prorated amounts now, 'none' skips creating any charges. (optional)
   * @param redirectMode - Controls when to return a checkout URL. 'always' returns a URL even if payment succeeds, 'if_required' only when payment action is needed, 'never' disables redirects. (optional)
   * @param subscriptionId - A unique ID to identify this subscription. Can be used to target specific subscriptions in update operations when a customer has multiple products with the same plan. (optional)
   * @param discounts - List of discounts to apply. Each discount can be an Autumn reward ID, Stripe coupon ID, or Stripe promotion code. (optional)
   * @param cancelAction - Action to perform for cancellation. 'cancel_immediately' cancels now with prorated refund, 'cancel_end_of_cycle' cancels at period end, 'uncancel' reverses a pending cancellation. (optional)
   * @param billingCycleAnchor - Reset the billing cycle anchor immediately with 'now' (optional)
   * @param noBillingChanges - If true, the subscription is updated internally without applying billing changes in Stripe. (optional)
   * @param recalculateBalances - Controls whether balances should be recalculated during the subscription update. (optional)
   * @param carryOverUsages - Whether to carry over usages from the previous plan. (optional)
   *
   * @returns A preview response with line items showing prorated charges or credits for the proposed changes.
   */
  async previewUpdate(request, options) {
    return unwrapAsync(billingPreviewUpdate(
      this,
      request,
      options
    ));
  }
  /**
   * Create a billing portal session for a customer to manage their subscription.
   */
  async openCustomerPortal(request, options) {
    return unwrapAsync(billingOpenCustomerPortal(
      this,
      request,
      options
    ));
  }
  /**
   * Create a payment setup session for a customer to add or update their payment method.
   */
  async setupPayment(request, options) {
    return unwrapAsync(billingSetupPayment(
      this,
      request,
      options
    ));
  }
};
function customersDelete(client, request, options) {
  return new APIPromise($do18(
    client,
    request,
    options
  ));
}
async function $do18(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(DeleteCustomerParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/customers.delete")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "deleteCustomer",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, DeleteCustomerResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function customersGetOrCreate(client, request, options) {
  return new APIPromise($do19(
    client,
    request,
    options
  ));
}
async function $do19(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(GetOrCreateCustomerParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/customers.get_or_create")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "getOrCreateCustomer",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, Customer$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function customersGet(client, request, options) {
  return new APIPromise($do20(
    client,
    request,
    options
  ));
}
async function $do20(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(GetCustomerParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/customers.get")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "getCustomer",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, GetCustomerResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function customersList(client, request, options) {
  return new APIPromise($do21(
    client,
    request,
    options
  ));
}
async function $do21(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(ListCustomersParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/customers.list")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "listCustomers",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, ListCustomersResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function customersUpdate(client, request, options) {
  return new APIPromise($do22(
    client,
    request,
    options
  ));
}
async function $do22(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(UpdateCustomerParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/customers.update")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "updateCustomer",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, UpdateCustomerResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Customers = class extends ClientSDK {
  /**
   * Creates a customer if they do not exist, or returns the existing customer by your external customer ID.
   *
   * Use this as the primary entrypoint before billing operations so the customer record is always present and up to date.
   *
   * @example
   * ```typescript
   * // Create or fetch a customer by external ID
   * const response = await client.getOrCreate({ customerId: "cus_123", name: "John Doe", email: "john@example.com" });
   * ```
   *
   * @param id - Your unique identifier for the customer (optional)
   * @param name - Customer's name (optional)
   * @param email - Customer's email address (optional)
   * @param fingerprint - Unique identifier (eg, serial number) to detect duplicate customers and prevent free trial abuse (optional)
   * @param metadata - Additional metadata for the customer (optional)
   * @param stripeId - Stripe customer ID if you already have one (optional)
   * @param createInStripe - Whether to create the customer in Stripe (optional)
   * @param autoEnablePlanId - The ID of the free plan to auto-enable for the customer (optional)
   * @param sendEmailReceipts - Whether to send email receipts to this customer (optional)
   * @param billingControls - Billing controls for the customer (auto top-ups, etc.) (optional)
   * @param config - Miscellaneous configurations for the customer. (optional)
   * @param expand - Fields to expand in the returned customer response, such as subscriptions.plan, purchases.plan, balances.feature, or flags.feature. (optional)
   */
  async getOrCreate(request, options) {
    return unwrapAsync(customersGetOrCreate(
      this,
      request,
      options
    ));
  }
  /**
   * Fetches a customer by ID, optionally expanding related data such as invoices or entities.
   *
   * Use this when you know the customer exists or assert they exist without creating them.
   *
   * @example
   * ```typescript
   * // Fetch a customer by external ID
   * const response = await client.get({ customerId: "cus_123" });
   * ```
   *
   * @example
   * ```typescript
   * // Fetch a customer with expanded invoices and entities
   * const response = await client.get({ customerId: "cus_123", expand: ["invoices","entities"] });
   * ```
   *
   * @param customerId - ID of the customer to fetch
   * @param expand - Expand related customer data like invoices or entities, or expand nested objects like balances.feature, flags.feature, subscriptions.plan, and purchases.plan. (optional)
   */
  async get(request, options) {
    return unwrapAsync(customersGet(
      this,
      request,
      options
    ));
  }
  /**
   * Lists customers with cursor pagination and optional filters. Pass `start_cursor: ""` (or omit) for the first page; use `next_cursor` from a prior response for subsequent pages.
   */
  async list(request, options) {
    return unwrapAsync(customersList(
      this,
      request,
      options
    ));
  }
  /**
   * Updates an existing customer by ID.
   */
  async update(request, options) {
    return unwrapAsync(customersUpdate(
      this,
      request,
      options
    ));
  }
  /**
   * Deletes a customer by ID.
   */
  async delete(request, options) {
    return unwrapAsync(customersDelete(
      this,
      request,
      options
    ));
  }
};
function entitiesCreate(client, request, options) {
  return new APIPromise($do23(
    client,
    request,
    options
  ));
}
async function $do23(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(CreateEntityParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/entities.create")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "createEntity",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, CreateEntityResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function entitiesDelete(client, request, options) {
  return new APIPromise($do24(
    client,
    request,
    options
  ));
}
async function $do24(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(DeleteEntityParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/entities.delete")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "deleteEntity",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, DeleteEntityResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function entitiesGet(client, request, options) {
  return new APIPromise($do25(
    client,
    request,
    options
  ));
}
async function $do25(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(GetEntityParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/entities.get")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "getEntity",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, GetEntityResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function entitiesList(client, request, options) {
  return new APIPromise($do26(
    client,
    request,
    options
  ));
}
async function $do26(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(ListEntitiesParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/entities.list")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "listEntities",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, ListEntitiesResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function entitiesUpdate(client, request, options) {
  return new APIPromise($do27(
    client,
    request,
    options
  ));
}
async function $do27(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(UpdateEntityParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/entities.update")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "updateEntity",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, UpdateEntityResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Entities = class extends ClientSDK {
  /**
   * Creates an entity for a customer and feature, then returns the entity with balances and subscriptions.
   *
   * Use entities when usage and access must be scoped to sub-resources (for example seats, projects, or workspaces) instead of only the customer.
   *
   * @example
   * ```typescript
   * // Create a seat entity
   * const response = await client.entities.create({
   *
   *   customerId: "cus_123",
   *   entityId: "seat_42",
   *   featureId: "seats",
   *   name: "Seat 42",
   * });
   * ```
   *
   * @param name - The name of the entity (optional)
   * @param featureId - The ID of the feature this entity is associated with
   * @param billingControls - Billing controls for the entity. (optional)
   * @param customerData - Customer attributes used to resolve the customer when customer_id is not provided. (optional)
   * @param customerId - The ID of the customer to create the entity for.
   * @param entityId - The ID of the entity.
   *
   * @returns The created entity object including its current subscriptions, purchases, and balances.
   */
  async create(request, options) {
    return unwrapAsync(entitiesCreate(
      this,
      request,
      options
    ));
  }
  /**
   * Fetches an entity by its ID.
   *
   * Use this to read one entity's current state. Pass customerId when you want to scope the lookup to a specific customer.
   *
   * @example
   * ```typescript
   * // Fetch a seat entity
   * const response = await client.entities.get({ entityId: "seat_42" });
   * ```
   *
   * @example
   * ```typescript
   * // Fetch a seat entity for a specific customer
   * const response = await client.entities.get({ customerId: "cus_123", entityId: "seat_42" });
   * ```
   *
   * @param customerId - The ID of the customer to create the entity for. (optional)
   * @param entityId - The ID of the entity.
   *
   * @returns The entity object including its current subscriptions, purchases, and balances.
   */
  async get(request, options) {
    return unwrapAsync(entitiesGet(
      this,
      request,
      options
    ));
  }
  /**
   * Lists entities across the organization with pagination and optional filters.
   *
   * Use this to page through entities globally, including filtering by plans inherited from parent customers or attached directly to entities.
   *
   * @example
   * ```typescript
   * // List entities on a plan
   * const response = await client.entities.list({ plans: [{"id":"pro_plan"}], limit: 10, offset: 0 });
   * ```
   *
   * @example
   * ```typescript
   * // Search entities by ID or name
   * const response = await client.entities.list({ search: "workspace" });
   * ```
   *
   * @param offset - Number of items to skip (optional)
   * @param limit - Number of items to return. Default 10, max 1000. (optional)
   * @param plans - Filter by plan ID and version. Returns entities with active subscriptions to this plan, including plans inherited from the parent customer. (optional)
   * @param subscriptionStatus - Filter customer products used for entity hydration and plan matching. Defaults to active and scheduled. (optional)
   * @param search - Search entities by id or name. (optional)
   * @param processors - Filter by parent customer processor type (stripe, revenuecat, vercel). (optional)
   * @param customerId - Restrict the response to entities owned by this customer id. Use to bulk-fetch all entities for one customer in a single paginated call instead of iterating entities.get. (optional)
   *
   * @returns A paginated list of entity objects including their current subscriptions, purchases, balances, and flags.
   */
  async list(request, options) {
    return unwrapAsync(entitiesList(
      this,
      request,
      options
    ));
  }
  /**
   * Updates an existing entity and returns the refreshed entity object.
   *
   * Use this to change entity billing controls or other mutable entity fields after the entity has already been created.
   *
   * @example
   * ```typescript
   * // Update a seat entity's billing controls
   * const response = await client.entities.update({ customerId: "cus_123", entityId: "seat_42", billingControls: {"spendLimits":[{"featureId":"messages","enabled":true,"overageLimit":25}]} });
   * ```
   *
   * @param customerId - The ID of the customer that owns the entity. (optional)
   * @param entityId - The ID of the entity.
   * @param billingControls - Billing controls to replace on the entity. (optional)
   *
   * @returns The updated entity object including its current subscriptions, purchases, and balances.
   */
  async update(request, options) {
    return unwrapAsync(entitiesUpdate(
      this,
      request,
      options
    ));
  }
  /**
   * Deletes an entity by entity ID.
   *
   * Use this when the underlying resource is removed and you no longer want entity-scoped balances or subscriptions tracked for it.
   *
   * @example
   * ```typescript
   * // Delete a seat entity
   * const response = await client.entities.delete({ entityId: "seat_42" });
   * ```
   *
   * @param customerId - The ID of the customer. (optional)
   * @param entityId - The ID of the entity.
   *
   * @returns A success flag indicating the entity was deleted.
   */
  async delete(request, options) {
    return unwrapAsync(entitiesDelete(
      this,
      request,
      options
    ));
  }
};
function eventsAggregate(client, request, options) {
  return new APIPromise($do28(
    client,
    request,
    options
  ));
}
async function $do28(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(EventsAggregateParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/events.aggregate")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "aggregateEvents",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, AggregateEventsResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function eventsList(client, request, options) {
  return new APIPromise($do29(
    client,
    request,
    options
  ));
}
async function $do29(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(EventsListParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/events.list")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "listEvents",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, ListEventsResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Events = class extends ClientSDK {
  /**
   * List usage events for your organization. Filter by customer, feature, or time range.
   */
  async list(request, options) {
    return unwrapAsync(eventsList(
      this,
      request,
      options
    ));
  }
  /**
   * Aggregate usage events by time period. Returns usage totals grouped by feature and optionally by a custom property.
   */
  async aggregate(request, options) {
    return unwrapAsync(eventsAggregate(
      this,
      request,
      options
    ));
  }
};
function featuresCreate(client, request, options) {
  return new APIPromise($do30(
    client,
    request,
    options
  ));
}
async function $do30(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(CreateFeatureParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/features.create")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "createFeature",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, CreateFeatureResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function featuresDelete(client, request, options) {
  return new APIPromise($do31(
    client,
    request,
    options
  ));
}
async function $do31(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(DeleteFeatureParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/features.delete")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "deleteFeature",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, DeleteFeatureResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function featuresGet(client, request, options) {
  return new APIPromise($do32(
    client,
    request,
    options
  ));
}
async function $do32(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(GetFeatureParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/features.get")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "getFeature",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, GetFeatureResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function featuresList(client, _request, options) {
  return new APIPromise($do33(
    client,
    _request,
    options
  ));
}
async function $do33(client, _request, options) {
  const path = pathToFunc("/v1/features.list")();
  const headers = new Headers(compactMap({
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "listFeatures",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, ListFeaturesResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function featuresUpdate(client, request, options) {
  return new APIPromise($do34(
    client,
    request,
    options
  ));
}
async function $do34(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(UpdateFeatureParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/features.update")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "updateFeature",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, UpdateFeatureResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Features = class extends ClientSDK {
  /**
   * Creates a new feature.
   *
   * Use this to programmatically create features for metering usage, managing access, or building credit systems.
   *
   * @example
   * ```typescript
   * // Create a metered feature for API calls
   * const response = await client.features.create({
   *
   *   featureId: "api-calls",
   *   name: "API Calls",
   *   type: "metered",
   *   consumable: true,
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Create a boolean feature for a premium feature flag
   * const response = await client.features.create({ featureId: "advanced-analytics", name: "Advanced Analytics", type: "boolean" });
   * ```
   *
   * @param name - The name of the feature.
   * @param type - The type of the feature. 'single_use' features are consumed, like API calls, tokens, or messages. 'continuous_use' features are allocated, like seats, workspaces, or projects. 'credit_system' features are schemas that unify multiple 'single_use' features into a single credit system.
   * @param consumable - Whether this feature is consumable. A consumable feature is one that periodically resets and is consumed rather than allocated (like credits, API requests, etc.). Applicable only for 'metered' features. (optional)
   * @param display - Singular and plural display names for the feature in your user interface. (optional)
   * @param creditSchema - A schema that maps 'single_use' feature IDs to credit costs. For classic credit systems only — AI credit systems use model_markups instead. (optional)
   * @param modelMarkups - Per-model markup overrides for AI credit systems. Maps model IDs to their markup configuration. (optional)
   * @param defaultMarkup - Default percentage markup for this AI credit system. Used when no model or provider markup applies. Use -100 to make usage free. (optional)
   * @param providerMarkups - Per-provider default markup percentages for AI credit systems. Provider keys match the first segment of model_id. (optional)
   * @param featureId - The ID of the feature to create.
   *
   * @returns The created feature object.
   */
  async create(request, options) {
    return unwrapAsync(featuresCreate(
      this,
      request,
      options
    ));
  }
  /**
   * Retrieves a single feature by its ID.
   *
   * Use this when you need to fetch the details of a specific feature.
   *
   * @example
   * ```typescript
   * // Get a feature by ID
   * const response = await client.features.get({ featureId: "api-calls" });
   * ```
   *
   * @param featureId - The ID of the feature.
   *
   * @returns The feature object with its full configuration.
   */
  async get(request, options) {
    return unwrapAsync(featuresGet(
      this,
      request,
      options
    ));
  }
  /**
   * Lists all features in the current environment.
   *
   * Use this to retrieve all features configured for your organization to display in dashboards or for feature management.
   *
   * @returns A list of all features with their configuration and metadata.
   */
  async list(request, options) {
    return unwrapAsync(featuresList(
      this,
      request,
      options
    ));
  }
  /**
   * Updates an existing feature.
   *
   * Use this to modify feature properties like name, display settings, or to archive a feature.
   *
   * @example
   * ```typescript
   * // Update a feature's display name
   * const response = await client.features.update({ featureId: "api-calls", name: "API Requests", display: {"singular":"API request","plural":"API requests"} });
   * ```
   *
   * @example
   * ```typescript
   * // Archive a feature
   * const response = await client.features.update({ featureId: "deprecated-feature", archived: true });
   * ```
   *
   * @param name - The name of the feature. (optional)
   * @param type - The type of the feature. 'single_use' features are consumed, like API calls, tokens, or messages. 'continuous_use' features are allocated, like seats, workspaces, or projects. 'credit_system' features are schemas that unify multiple 'single_use' features into a single credit system. (optional)
   * @param consumable - Whether this feature is consumable. A consumable feature is one that periodically resets and is consumed rather than allocated (like credits, API requests, etc.). Applicable only for 'metered' features. (optional)
   * @param display - Singular and plural display names for the feature in your user interface. (optional)
   * @param creditSchema - A schema that maps 'single_use' feature IDs to credit costs. For classic credit systems only — AI credit systems use model_markups instead. (optional)
   * @param modelMarkups - Per-model markup overrides for AI credit systems. Maps model IDs to their markup configuration. (optional)
   * @param defaultMarkup - Default percentage markup for this AI credit system. Used when no model or provider markup applies. Use -100 to make usage free. (optional)
   * @param providerMarkups - Per-provider default markup percentages for AI credit systems. Provider keys match the first segment of model_id. (optional)
   * @param archived - Whether the feature is archived. Archived features are hidden from the dashboard. (optional)
   * @param featureId - The ID of the feature to update.
   * @param newFeatureId - The new ID of the feature. Feature ID can only be updated if it's not being used by any customers. (optional)
   *
   * @returns The updated feature object.
   */
  async update(request, options) {
    return unwrapAsync(featuresUpdate(
      this,
      request,
      options
    ));
  }
  /**
   * Deletes a feature by its ID.
   *
   * Use this to permanently remove a feature. Note: features that are used in products cannot be deleted - archive them instead.
   *
   * @example
   * ```typescript
   * // Delete an unused feature
   * const response = await client.features.delete({ featureId: "old-feature" });
   * ```
   *
   * @param featureId - The ID of the feature to delete.
   *
   * @returns A success flag indicating the feature was deleted.
   */
  async delete(request, options) {
    return unwrapAsync(featuresDelete(
      this,
      request,
      options
    ));
  }
};
function keysMint(client, request, options) {
  return new APIPromise($do35(
    client,
    request,
    options
  ));
}
async function $do35(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(MintKeyParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/keys.mint")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "mintKey",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, MintKeyResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function keysRefresh(client, _request, options) {
  return new APIPromise($do36(
    client,
    _request,
    options
  ));
}
async function $do36(client, _request, options) {
  const path = pathToFunc("/v1/keys.refresh")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "refreshKey",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, RefreshKeyResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function keysRevoke(client, request, options) {
  return new APIPromise($do37(
    client,
    request,
    options
  ));
}
async function $do37(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(RevokeKeyParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/keys.revoke")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "revokeKey",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, RevokeKeyResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Keys = class extends ClientSDK {
  /**
   * Mints a per-customer token (a scoped `am_jwt_` credential) so a downstream / self-hosted app can call Autumn directly without your secret key. Returns a short-lived access token plus a rotating refresh token, both bound to the given customer. Authenticated with your secret key.
   */
  async mint(request, options) {
    return unwrapAsync(keysMint(
      this,
      request,
      options
    ));
  }
  /**
   * Exchanges a refresh token (sent as the Bearer credential) for a freshly rotated access + refresh pair. Self-service for the token holder — no secret key required. The previous refresh token is honored for one rotation as a grace window; replaying an older one revokes the customer's tokens.
   */
  async refresh(request, options) {
    return unwrapAsync(keysRefresh(
      this,
      request,
      options
    ));
  }
  /**
   * Revokes every outstanding token (access and refresh) for a customer. Authenticated with your secret key. New tokens can be issued afterwards with `keys.mint`.
   */
  async revoke(request, options) {
    return unwrapAsync(keysRevoke(
      this,
      request,
      options
    ));
  }
};
function plansCreate(client, request, options) {
  return new APIPromise($do38(
    client,
    request,
    options
  ));
}
async function $do38(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(CreatePlanParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/plans.create")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "createPlan",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, CreatePlanResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function plansDelete(client, request, options) {
  return new APIPromise($do39(
    client,
    request,
    options
  ));
}
async function $do39(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(DeletePlanParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/plans.delete")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "deletePlan",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, DeletePlanResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function plansGet(client, request, options) {
  return new APIPromise($do40(
    client,
    request,
    options
  ));
}
async function $do40(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(GetPlanParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/plans.get")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "getPlan",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, GetPlanResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function plansList(client, request, options) {
  return new APIPromise($do41(
    client,
    request,
    options
  ));
}
async function $do41(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(optional(ListPlansParams$outboundSchema), value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = payload === void 0 ? null : encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/plans.list")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "listPlans",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, ListPlansResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function plansUpdate(client, request, options) {
  return new APIPromise($do42(
    client,
    request,
    options
  ));
}
async function $do42(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(UpdatePlanParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/plans.update")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "updatePlan",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, UpdatePlanResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Plans = class extends ClientSDK {
  /**
   * Create a plan
   *
   * @remarks
   * Creates a new plan with optional base price and feature configurations.
   *
   * Use this to programmatically create pricing plans. See [How plans work](/documentation/pricing/plans) for concepts.
   *
   * @example
   * ```typescript
   * // Create a free plan with limited features
   * const response = await client.plans.create({
   *   planId: "free_plan",
   *   name: "Free",
   *   autoEnable: true,
   *   items: [{"featureId":"messages","included":100,"reset":{"interval":"month"}}],
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Create a paid plan with base price and usage-based feature
   * const response = await client.plans.create({
   *   planId: "pro_plan",
   *   name: "Pro Plan",
   *   price: {"amount":10,"interval":"month"},
   *   items: [{"featureId":"messages","included":1000,"reset":{"interval":"month"},"price":{"amount":0.01,"interval":"month","billingUnits":1,"billingMethod":"usage_based"}}],
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Create a plan with prepaid seats
   * const response = await client.plans.create({
   *   planId: "team_plan",
   *   name: "Team Plan",
   *   price: {"amount":49,"interval":"month"},
   *   items: [{"featureId":"seats","included":5,"price":{"amount":10,"interval":"month","billingUnits":1,"billingMethod":"prepaid"}}],
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Create an add-on plan
   * const response = await client.plans.create({
   *   planId: "analytics_addon",
   *   name: "Advanced Analytics",
   *   addOn: true,
   *   price: {"amount":20,"interval":"month"},
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Create a plan with tiered pricing
   * const response = await client.plans.create({ planId: "api_plan", name: "API Plan", items: [{"featureId":"api_calls","included":1000,"reset":{"interval":"month"},"price":{"tiers":[{"to":10000,"amount":0.001},{"to":100000,"amount":0.0005},{"to":"inf","amount":0.0001}],"interval":"month","billingUnits":1,"billingMethod":"usage_based"}}] });
   * ```
   *
   * @example
   * ```typescript
   * // Create a plan with free trial
   * const response = await client.plans.create({
   *   planId: "premium_plan",
   *   name: "Premium",
   *   price: {"amount":99,"interval":"month"},
   *   freeTrial: {"durationLength":14,"durationType":"day","cardRequired":true},
   * });
   * ```
   *
   * @param planId - The ID of the plan to create.
   * @param group - Group identifier for organizing related plans. Plans in the same group are mutually exclusive. (optional)
   * @param name - Display name of the plan.
   * @param description - Optional description of the plan. (optional)
   * @param addOn - If true, this plan can be attached alongside other plans. Otherwise, attaching replaces existing plans in the same group. (optional)
   * @param autoEnable - If true, plan is automatically attached when a customer is created. Use for free tiers. (optional)
   * @param price - Base recurring price for the plan. Omit for free or usage-only plans. (optional)
   * @param items - Feature configurations for this plan. Each item defines included units, pricing, and reset behavior. (optional)
   * @param freeTrial - Free trial configuration. Customers can try this plan before being charged. (optional)
   * @param config - Miscellaneous plan-level configuration flags. (optional)
   * @param billingControls - Plan-level billing controls used as customer defaults. (optional)
   * @param metadata - Arbitrary key-value metadata defined by you for your own use (e.g. UI copy, feature highlights). Values can be any JSON-serializable value. Shared across all versions of the plan. (optional)
   *
   * @returns The created plan object.
   */
  async create(request, options) {
    return unwrapAsync(plansCreate(
      this,
      request,
      options
    ));
  }
  /**
   * Get a plan
   *
   * @remarks
   * Retrieves a single plan by its ID.
   *
   * Use this to fetch the full configuration of a specific plan, including its features and pricing.
   *
   * @example
   * ```typescript
   * // Get a plan by ID
   * const response = await client.plans.get({ planId: "pro_plan" });
   * ```
   *
   * @example
   * ```typescript
   * // Get a specific version of a plan
   * const response = await client.plans.get({ planId: "pro_plan", version: 2 });
   * ```
   *
   * @param planId - The ID of the plan to retrieve.
   * @param version - The version of the plan to get. Defaults to the latest version. (optional)
   *
   * @returns The plan object with its full configuration.
   */
  async get(request, options) {
    return unwrapAsync(plansGet(
      this,
      request,
      options
    ));
  }
  /**
   * List all plans
   *
   * @remarks
   * Lists all plans in the current environment.
   *
   * Use this to retrieve all plans for displaying pricing pages or managing plan configurations.
   *
   * @returns A list of all plans with their pricing and feature configurations.
   */
  async list(request, options) {
    return unwrapAsync(plansList(
      this,
      request,
      options
    ));
  }
  /**
   * Update a plan
   *
   * @remarks
   * Updates an existing plan. Creates a new version unless `disableVersion` is set.
   *
   * Use this to modify plan properties, pricing, or feature configurations. See [Adding features to plans](/documentation/pricing/plan-features) for item configuration.
   *
   * @example
   * ```typescript
   * // Update plan name and price
   * const response = await client.plans.update({ planId: "pro_plan", name: "Pro Plan (Updated)", price: {"amount":15,"interval":"month"} });
   * ```
   *
   * @example
   * ```typescript
   * // Add a feature to an existing plan
   * const response = await client.plans.update({ planId: "pro_plan", items: [{"featureId":"messages","included":1000,"reset":{"interval":"month"}},{"featureId":"storage","included":10,"reset":{"interval":"month"}}] });
   * ```
   *
   * @example
   * ```typescript
   * // Remove the base price (make usage-only)
   * const response = await client.plans.update({ planId: "pro_plan", price: null });
   * ```
   *
   * @example
   * ```typescript
   * // Archive a plan
   * const response = await client.plans.update({ planId: "old_plan", archived: true });
   * ```
   *
   * @example
   * ```typescript
   * // Update feature's included amount
   * const response = await client.plans.update({ planId: "pro_plan", items: [{"featureId":"messages","included":2000,"reset":{"interval":"month"}}] });
   * ```
   *
   * @param planId - The ID of the plan to update.
   * @param group - Group identifier for organizing related plans. Plans in the same group are mutually exclusive. (optional)
   * @param name - Display name of the plan. (optional)
   * @param addOn - Whether the plan is an add-on. (optional)
   * @param autoEnable - Whether the plan is automatically enabled. (optional)
   * @param price - The price of the plan. Set to null to remove the base price. (optional)
   * @param items - Feature configurations for this plan. Each item defines included units, pricing, and reset behavior. (optional)
   * @param freeTrial - The free trial of the plan. Set to null to remove the free trial. (optional)
   * @param config - Miscellaneous plan-level configuration flags. (optional)
   * @param billingControls - Plan-level billing controls used as customer defaults. (optional)
   * @param metadata - Arbitrary key-value metadata defined by you for your own use (e.g. UI copy, feature highlights). Values can be any JSON-serializable value. Shared across all versions of the plan. (optional)
   * @param newPlanId - The new ID to use for the plan. Can only be updated if the plan has not been used by any customers. (optional)
   *
   * @returns The updated plan object.
   */
  async update(request, options) {
    return unwrapAsync(plansUpdate(
      this,
      request,
      options
    ));
  }
  /**
   * Delete a plan
   *
   * @remarks
   * Deletes a plan by its ID.
   *
   * Use this to permanently remove a plan. Plans with active customers cannot be deleted - archive them instead.
   *
   * @example
   * ```typescript
   * // Delete a plan
   * const response = await client.plans.delete({ planId: "unused_plan" });
   * ```
   *
   * @example
   * ```typescript
   * // Delete all versions of a plan
   * const response = await client.plans.delete({ planId: "legacy_plan", allVersions: true });
   * ```
   *
   * @param planId - The ID of the plan to delete.
   * @param allVersions - If true, deletes all versions of the plan. Otherwise, only deletes the latest version. (optional)
   *
   * @returns A success flag indicating the plan was deleted.
   */
  async delete(request, options) {
    return unwrapAsync(plansDelete(
      this,
      request,
      options
    ));
  }
};
function platformGetRevenueCatKeys(client, request, options) {
  return new APIPromise($do43(
    client,
    request,
    options
  ));
}
async function $do43(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(GetRevenueCatKeysParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/platform.get_revenuecat_keys")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "getRevenueCatKeys",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, GetRevenueCatKeysResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function platformLinkRevenueCat(client, request, options) {
  return new APIPromise($do44(
    client,
    request,
    options
  ));
}
async function $do44(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(LinkRevenueCatParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/platform.link_revenuecat")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "linkRevenueCat",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, LinkRevenueCatResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function platformSyncRevenueCat(client, request, options) {
  return new APIPromise($do45(
    client,
    request,
    options
  ));
}
async function $do45(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(SyncRevenueCatParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/platform.sync_revenuecat")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "syncRevenueCat",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, SyncRevenueCatResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Platform = class extends ClientSDK {
  /**
   * Generate a RevenueCat OAuth URL for linking a project to an organization.
   */
  async linkRevenueCat(request, options) {
    return unwrapAsync(platformLinkRevenueCat(
      this,
      request,
      options
    ));
  }
  /**
   * Push an organization's plans into RevenueCat as products (creating or renaming them across the project's apps) and set test-store prices from each plan's price. Requires the org to have linked RevenueCat via OAuth.
   */
  async syncRevenueCat(request, options) {
    return unwrapAsync(platformSyncRevenueCat(
      this,
      request,
      options
    ));
  }
  /**
   * Retrieve a managed organization's RevenueCat public (SDK) API keys, grouped by app — for the test store, App Store, and Google Play Store. Use these to configure the RevenueCat SDK in the org's mobile app.
   */
  async getRevenueCatKeys(request, options) {
    return unwrapAsync(platformGetRevenueCatKeys(
      this,
      request,
      options
    ));
  }
};
function referralsCreateCode(client, request, options) {
  return new APIPromise($do46(
    client,
    request,
    options
  ));
}
async function $do46(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(CreateReferralCodeParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/referrals.create_code")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "createReferralCode",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, CreateReferralCodeResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
function referralsRedeemCode(client, request, options) {
  return new APIPromise($do47(
    client,
    request,
    options
  ));
}
async function $do47(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(RedeemReferralCodeParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/referrals.redeem_code")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "redeemReferralCode",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, RedeemReferralCodeResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Referrals = class extends ClientSDK {
  /**
   * Create or fetch a referral code for a customer in a referral program.
   */
  async createCode(request, options) {
    return unwrapAsync(referralsCreateCode(
      this,
      request,
      options
    ));
  }
  /**
   * Redeem a referral code for a customer.
   */
  async redeemCode(request, options) {
    return unwrapAsync(referralsRedeemCode(
      this,
      request,
      options
    ));
  }
};
function rewardsRedeemCode(client, request, options) {
  return new APIPromise($do48(
    client,
    request,
    options
  ));
}
async function $do48(client, request, options) {
  const parsed = safeParse(
    request,
    (value) => parse(RedeemRewardCodeParams$outboundSchema, value),
    "Input validation failed"
  );
  if (!parsed.ok) {
    return [parsed, { status: "invalid" }];
  }
  const payload = parsed.value;
  const body = encodeJSON("body", payload, { explode: true });
  const path = pathToFunc("/v1/rewards.redeem")();
  const headers = new Headers(compactMap({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": encodeSimple(
      "x-api-version",
      client._options.xApiVersion,
      { explode: false, charEncoding: "none" }
    )
  }));
  const secConfig = await extractSecurity(client._options.secretKey);
  const securityInput = secConfig == null ? {} : { secretKey: secConfig };
  const requestSecurity = resolveGlobalSecurity(securityInput);
  const context = {
    options: client._options,
    baseURL: options?.serverURL ?? client._baseURL ?? "",
    operationID: "redeemRewardCode",
    oAuth2Scopes: null,
    resolvedSecurity: requestSecurity,
    securitySource: client._options.secretKey,
    retryConfig: options?.retries || client._options.retryConfig || { strategy: "none" },
    retryCodes: options?.retryCodes || ["429", "500", "502", "503", "504"]
  };
  const requestRes = client._createRequest(context, {
    security: requestSecurity,
    method: "POST",
    baseURL: options?.serverURL,
    path,
    headers,
    body,
    userAgent: client._options.userAgent,
    timeoutMs: options?.timeoutMs || client._options.timeoutMs || -1
  }, options);
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;
  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode) => matchStatusCode({ status: statusCode }, ["4XX", "5XX"]),
    retryConfig: context.retryConfig,
    retryCodes: context.retryCodes
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;
  const [result] = await match(
    json(200, RedeemRewardCodeResponse$inboundSchema),
    fail("4XX"),
    fail("5XX")
  )(response, req);
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }
  return [result, { status: "complete", request: req, response }];
}
var Rewards = class extends ClientSDK {
  /**
   * Redeem a reward promo code for a customer.
   */
  async redeemCode(request, options) {
    return unwrapAsync(rewardsRedeemCode(
      this,
      request,
      options
    ));
  }
};
var Autumn = class extends ClientSDK {
  constructor() {
    super(...arguments);
    __publicField(this, "_customers");
    __publicField(this, "_plans");
    __publicField(this, "_features");
    __publicField(this, "_billing");
    __publicField(this, "_balances");
    __publicField(this, "_events");
    __publicField(this, "_entities");
    __publicField(this, "_referrals");
    __publicField(this, "_rewards");
    __publicField(this, "_platform");
    __publicField(this, "_keys");
  }
  get customers() {
    return this._customers ?? (this._customers = new Customers(this._options));
  }
  get plans() {
    return this._plans ?? (this._plans = new Plans(this._options));
  }
  get features() {
    return this._features ?? (this._features = new Features(this._options));
  }
  get billing() {
    return this._billing ?? (this._billing = new Billing(this._options));
  }
  get balances() {
    return this._balances ?? (this._balances = new Balances(this._options));
  }
  get events() {
    return this._events ?? (this._events = new Events(this._options));
  }
  get entities() {
    return this._entities ?? (this._entities = new Entities(this._options));
  }
  get referrals() {
    return this._referrals ?? (this._referrals = new Referrals(this._options));
  }
  get rewards() {
    return this._rewards ?? (this._rewards = new Rewards(this._options));
  }
  get platform() {
    return this._platform ?? (this._platform = new Platform(this._options));
  }
  get keys() {
    return this._keys ?? (this._keys = new Keys(this._options));
  }
  /**
   * Checks whether a customer currently has enough balance to use a feature.
   *
   * Use this to gate access before a feature action. Enable sendEvent when you want to check and consume balance atomically in one request.
   *
   * @example
   * ```typescript
   * // Check access for a feature
   * const response = await client.check({ customerId: "cus_123", featureId: "messages" });
   * ```
   *
   * @example
   * ```typescript
   * // Check and consume 3 units in one call
   * const response = await client.check({
   *
   *   customerId: "cus_123",
   *   featureId: "messages",
   *   requiredBalance: 3,
   *   sendEvent: true,
   * });
   * ```
   *
   * @param customerId - The ID of the customer.
   * @param featureId - The ID of the feature.
   * @param entityId - The ID of the entity for entity-scoped balances (e.g., per-seat limits). (optional)
   * @param requiredBalance - Minimum balance required for access. Returns allowed: false if the customer's balance is below this value. Defaults to 1. (optional)
   * @param properties - Additional properties to attach to the usage event if send_event is true. (optional)
   * @param sendEvent - If true, atomically records a usage event while checking access. The required_balance value is used as the usage amount. Combines check + track in one call. (optional)
   * @param lock - Reserve units of a feature upfront by passing a lock_id, then call balances.finalize to confirm or release the hold. (optional)
   * @param withPreview - If true, includes upgrade/upsell information in the response when access is denied. Useful for displaying paywalls. (optional)
   *
   * @returns Whether access is allowed, plus the current balance for that feature. If Autumn is experiencing degraded service from a downstream provider, the API may return 202 and allow access fail-open.
   */
  async check(request, options) {
    return unwrapAsync(check(
      this,
      request,
      options
    ));
  }
  /**
   * Records usage for a customer feature and returns updated balances.
   *
   * Use this after an action happens to decrement usage, or send a negative value to credit balance back.
   *
   * @example
   * ```typescript
   * // Track one message event
   * const response = await client.track({ customerId: "cus_123", featureId: "messages", value: 1 });
   * ```
   *
   * @example
   * ```typescript
   * // Track an event mapped to multiple features
   * const response = await client.track({ customerId: "cus_123", eventName: "ai_chat_request", value: 1 });
   * ```
   *
   * @param customerId - The ID of the customer.
   * @param featureId - The ID of the feature to track usage for. Required if event_name is not provided. (optional)
   * @param entityId - The ID of the entity for entity-scoped balances (e.g., per-seat limits). (optional)
   * @param eventName - Event name to track usage for. Use instead of feature_id when multiple features should be tracked from a single event. (optional)
   * @param value - The amount of usage to record. Defaults to 1. Use negative values to credit balance (e.g., when removing a seat). (optional)
   * @param properties - Additional properties to attach to this usage event. (optional)
   * @param timestamp - Unix timestamp in milliseconds to use for the usage event. Defaults to the current time. (optional)
   * @param async - If true, enqueue the event for asynchronous processing and return 204 immediately. The response will not include balance information. (optional)
   *
   * @returns The usage value recorded, with either a single updated balance or a map of updated balances. If Autumn is experiencing degraded service from a downstream provider, the API may return 202 after accepting the event for replay so it can be tracked as soon as the service is restored.
   */
  async track(request, options) {
    return unwrapAsync(track(
      this,
      request,
      options
    ));
  }
  /**
   * Records AI token usage for a customer and returns the updated AI credit balance.
   *
   * Use this after an LLM request when you have input and output token counts. Autumn converts token usage to a dollar amount using the configured model pricing and markup, then tracks that value against the customer's AI credit system.
   *
   * @example
   * ```typescript
   * // Track one LLM response
   * const response = await client.trackTokens({
   *
   *   customerId: "cus_123",
   *   featureId: "ai_credits",
   *   modelId: "anthropic/claude-sonnet-4-20250514",
   *   inputTokens: 1000,
   *   outputTokens: 500,
   * });
   * ```
   *
   * @param customerId - The ID of the customer.
   * @param entityId - The ID of the entity for entity-scoped balances. (optional)
   * @param featureId - The ID of the AI credit system feature. Auto-detected from the customer's entitlements if omitted — only required when a customer has multiple AI credit systems. (optional)
   * @param modelId - The AI model as '<provider>/<model>' (e.g. 'anthropic/claude-opus-4-8', 'openrouter/openai/gpt-4o'). The provider is the first path segment and must match a provider + model key in models.dev.
   * @param inputTokens - Number of non-cached text input tokens consumed. Exclusive of cache and audio token pools.
   * @param outputTokens - Number of text output tokens consumed. Exclusive of the reasoning and audio output pools.
   * @param cacheReadTokens - Number of cached input tokens read. (optional)
   * @param cacheWriteTokens - Number of input tokens written to the cache. (optional)
   * @param audioInputTokens - Number of audio input tokens consumed. (optional)
   * @param audioOutputTokens - Number of audio output tokens generated. (optional)
   * @param reasoningTokens - Number of reasoning tokens generated. (optional)
   * @param properties - Additional properties to attach to this usage event. (optional)
   * @param timestamp - Unix timestamp in milliseconds to use for the usage event. Defaults to the current time. (optional)
   * @param async - If true, enqueue the event for asynchronous processing and return 204 immediately. The response will not include balance information. (optional)
   *
   * @returns The dollar value recorded and the updated AI credit system balance. If Autumn is experiencing degraded service from a downstream provider, the API may return 202 after accepting the token usage event for replay so it can be tracked as soon as the service is restored.
   */
  async trackTokens(request, options) {
    return unwrapAsync(trackTokens(
      this,
      request,
      options
    ));
  }
  /**
   * Enqueue up to 1000 usage events for asynchronous processing. Items are validated synchronously up front; validated items are then enqueued via SQS for background deduction by workers. The response returns 202 immediately and does not include balance information. On partial enqueue failure (some items fail to enqueue, others succeed), the endpoint still returns 202 and logs the failures server-side; clients should NOT retry, because retrying re-enqueues the already-succeeded items. A 503 is returned only when zero items were successfully enqueued (queue entirely unavailable) — that case is safe to retry.
   */
  async batchTrack(request, options) {
    return unwrapAsync(batchTrack(
      this,
      request,
      options
    ));
  }
};
var types_exports = {};
__export(types_exports, {
  RFCDate: () => RFCDate,
  bigint: () => bigint,
  blobLikeSchema: () => blobLikeSchema,
  boolean: () => boolean2,
  createPageIterator: () => createPageIterator,
  date: () => date2,
  defaultToZeroValue: () => defaultToZeroValue,
  isBlobLike: () => isBlobLike,
  literal: () => literal2,
  literalBigInt: () => literalBigInt,
  nullable: () => nullable,
  number: () => number2,
  optional: () => optional3,
  startCountingDefaultToZeroValue: () => startCountingDefaultToZeroValue,
  startCountingUnrecognized: () => startCountingUnrecognized,
  string: () => string4,
  unrecognized: () => unrecognized
});
var blobLikeSchema = custom(
  isBlobLike,
  {
    message: "expected a Blob, File or Blob-like object",
    abort: true
  }
);
function isBlobLike(val) {
  if (val instanceof Blob) {
    return true;
  }
  if (typeof val !== "object" || val == null || !(Symbol.toStringTag in val)) {
    return false;
  }
  const name = val[Symbol.toStringTag];
  if (typeof name !== "string") {
    return false;
  }
  if (name !== "Blob" && name !== "File") {
    return false;
  }
  return "stream" in val && typeof val.stream === "function";
}
function createPageIterator(page, halt) {
  return {
    [Symbol.asyncIterator]: async function* paginator() {
      yield page;
      if (halt(page)) {
        return;
      }
      let p = page;
      for (p = await p.next(); p != null; p = await p.next()) {
        yield p;
        if (halt(p)) {
          return;
        }
      }
    }
  };
}
export {
  AggregateEventsCustomRange$outboundSchema,
  AggregateEventsList$inboundSchema,
  AggregateEventsResponse$inboundSchema,
  ApiKey$inboundSchema,
  AttachAction,
  AttachAction$inboundSchema,
  AttachAddItemBillingMethod,
  AttachAddItemBillingMethod$outboundSchema,
  AttachAddItemExpiryDurationType,
  AttachAddItemExpiryDurationType$outboundSchema,
  AttachAddItemOnDecrease,
  AttachAddItemOnDecrease$outboundSchema,
  AttachAddItemOnIncrease,
  AttachAddItemOnIncrease$outboundSchema,
  AttachAddItemPlanItem$outboundSchema,
  AttachAddItemPrice$outboundSchema,
  AttachAddItemPriceInterval,
  AttachAddItemPriceInterval$outboundSchema,
  AttachAddItemProration$outboundSchema,
  AttachAddItemReset$outboundSchema,
  AttachAddItemResetInterval,
  AttachAddItemResetInterval$outboundSchema,
  AttachAddItemRollover$outboundSchema,
  AttachAddItemTier$outboundSchema,
  AttachAddItemTierBehavior,
  AttachAddItemTierBehavior$outboundSchema,
  AttachAttachDiscount$outboundSchema,
  AttachAutoTopup$outboundSchema,
  AttachBasePrice$outboundSchema,
  AttachBillingControls$outboundSchema,
  AttachCarryOverBalances$outboundSchema,
  AttachCarryOverUsages$outboundSchema,
  AttachCode,
  AttachCode$inboundSchema,
  AttachCustomLineItem$outboundSchema,
  AttachCustomize$outboundSchema,
  AttachDurationType,
  AttachDurationType$outboundSchema,
  AttachFeatureQuantity$outboundSchema,
  AttachFreeTrialParams$outboundSchema,
  AttachIntervalRemoveItemEnum1,
  AttachIntervalRemoveItemEnum1$outboundSchema,
  AttachIntervalRemoveItemEnum2,
  AttachIntervalRemoveItemEnum2$outboundSchema,
  AttachInvoice$inboundSchema,
  AttachInvoiceMode$outboundSchema,
  AttachItemBillingMethod,
  AttachItemBillingMethod$outboundSchema,
  AttachItemExpiryDurationType,
  AttachItemExpiryDurationType$outboundSchema,
  AttachItemOnDecrease,
  AttachItemOnDecrease$outboundSchema,
  AttachItemOnIncrease,
  AttachItemOnIncrease$outboundSchema,
  AttachItemPlanItem$outboundSchema,
  AttachItemPrice$outboundSchema,
  AttachItemPriceInterval,
  AttachItemPriceInterval$outboundSchema,
  AttachItemProration$outboundSchema,
  AttachItemReset$outboundSchema,
  AttachItemResetInterval,
  AttachItemResetInterval$outboundSchema,
  AttachItemRollover$outboundSchema,
  AttachItemTier$outboundSchema,
  AttachItemTierBehavior,
  AttachItemTierBehavior$outboundSchema,
  AttachLimitType,
  AttachLimitType$outboundSchema,
  AttachOnEnd,
  AttachOnEnd$outboundSchema,
  AttachOverageAllowed$outboundSchema,
  AttachParams$outboundSchema,
  AttachPlanItemFilter$outboundSchema,
  AttachPlanSchedule,
  AttachPlanSchedule$outboundSchema,
  AttachPriceInterval,
  AttachPriceInterval$outboundSchema,
  AttachProrationBehavior,
  AttachProrationBehavior$outboundSchema,
  AttachPurchaseLimit$outboundSchema,
  AttachPurchaseLimitInterval,
  AttachPurchaseLimitInterval$outboundSchema,
  AttachRedirectMode,
  AttachRedirectMode$outboundSchema,
  AttachRemoveItemBillingMethod,
  AttachRemoveItemBillingMethod$outboundSchema,
  AttachRequiredAction$inboundSchema,
  AttachResponse$inboundSchema,
  AttachSpendLimit$outboundSchema,
  AttachThresholdType,
  AttachThresholdType$outboundSchema,
  AttachUsageAlert$outboundSchema,
  AttachUsageLimit$outboundSchema,
  AttachUsageLimitInterval,
  AttachUsageLimitInterval$outboundSchema,
  Autumn,
  AutumnDefaultError,
  AutumnError,
  Balance$inboundSchema,
  BalanceBillingMethod,
  BalanceBillingMethod$inboundSchema,
  BalanceCreditSchema$inboundSchema,
  BalanceDisplay$inboundSchema,
  BalanceFeature$inboundSchema,
  BalanceIntervalEnum,
  BalanceIntervalEnum$inboundSchema,
  BalanceModelMarkups$inboundSchema,
  BalancePrice$inboundSchema,
  BalanceProviderMarkups$inboundSchema,
  BalanceReset$inboundSchema,
  BalanceRollover$inboundSchema,
  BalanceTier$inboundSchema,
  BalanceTierBehavior,
  BalanceTierBehavior$inboundSchema,
  BalanceType,
  BalanceType$inboundSchema,
  BatchTrackLock$outboundSchema,
  BatchTrackResponse$inboundSchema,
  BillingBehavior,
  BillingBehavior$outboundSchema,
  BillingUpdateAddItemBillingMethod,
  BillingUpdateAddItemBillingMethod$outboundSchema,
  BillingUpdateAddItemExpiryDurationType,
  BillingUpdateAddItemExpiryDurationType$outboundSchema,
  BillingUpdateAddItemOnDecrease,
  BillingUpdateAddItemOnDecrease$outboundSchema,
  BillingUpdateAddItemOnIncrease,
  BillingUpdateAddItemOnIncrease$outboundSchema,
  BillingUpdateAddItemPlanItem$outboundSchema,
  BillingUpdateAddItemPrice$outboundSchema,
  BillingUpdateAddItemPriceInterval,
  BillingUpdateAddItemPriceInterval$outboundSchema,
  BillingUpdateAddItemProration$outboundSchema,
  BillingUpdateAddItemReset$outboundSchema,
  BillingUpdateAddItemResetInterval,
  BillingUpdateAddItemResetInterval$outboundSchema,
  BillingUpdateAddItemRollover$outboundSchema,
  BillingUpdateAddItemTier$outboundSchema,
  BillingUpdateAddItemTierBehavior,
  BillingUpdateAddItemTierBehavior$outboundSchema,
  BillingUpdateAttachDiscount$outboundSchema,
  BillingUpdateAutoTopup$outboundSchema,
  BillingUpdateBasePrice$outboundSchema,
  BillingUpdateBillingControls$outboundSchema,
  BillingUpdateCancelAction,
  BillingUpdateCancelAction$outboundSchema,
  BillingUpdateCarryOverUsages$outboundSchema,
  BillingUpdateCode,
  BillingUpdateCode$inboundSchema,
  BillingUpdateCustomize$outboundSchema,
  BillingUpdateDurationType,
  BillingUpdateDurationType$outboundSchema,
  BillingUpdateFeatureQuantity$outboundSchema,
  BillingUpdateFreeTrialParams$outboundSchema,
  BillingUpdateIntervalRemoveItemEnum1,
  BillingUpdateIntervalRemoveItemEnum1$outboundSchema,
  BillingUpdateIntervalRemoveItemEnum2,
  BillingUpdateIntervalRemoveItemEnum2$outboundSchema,
  BillingUpdateInvoice$inboundSchema,
  BillingUpdateInvoiceMode$outboundSchema,
  BillingUpdateItemBillingMethod,
  BillingUpdateItemBillingMethod$outboundSchema,
  BillingUpdateItemExpiryDurationType,
  BillingUpdateItemExpiryDurationType$outboundSchema,
  BillingUpdateItemOnDecrease,
  BillingUpdateItemOnDecrease$outboundSchema,
  BillingUpdateItemOnIncrease,
  BillingUpdateItemOnIncrease$outboundSchema,
  BillingUpdateItemPlanItem$outboundSchema,
  BillingUpdateItemPrice$outboundSchema,
  BillingUpdateItemPriceInterval,
  BillingUpdateItemPriceInterval$outboundSchema,
  BillingUpdateItemProration$outboundSchema,
  BillingUpdateItemReset$outboundSchema,
  BillingUpdateItemResetInterval,
  BillingUpdateItemResetInterval$outboundSchema,
  BillingUpdateItemRollover$outboundSchema,
  BillingUpdateItemTier$outboundSchema,
  BillingUpdateItemTierBehavior,
  BillingUpdateItemTierBehavior$outboundSchema,
  BillingUpdateLimitType,
  BillingUpdateLimitType$outboundSchema,
  BillingUpdateOnEnd,
  BillingUpdateOnEnd$outboundSchema,
  BillingUpdateOverageAllowed$outboundSchema,
  BillingUpdatePlanItemFilter$outboundSchema,
  BillingUpdatePriceInterval,
  BillingUpdatePriceInterval$outboundSchema,
  BillingUpdateProrationBehavior,
  BillingUpdateProrationBehavior$outboundSchema,
  BillingUpdatePurchaseLimit$outboundSchema,
  BillingUpdatePurchaseLimitInterval,
  BillingUpdatePurchaseLimitInterval$outboundSchema,
  BillingUpdateRecalculateBalances$outboundSchema,
  BillingUpdateRedirectMode,
  BillingUpdateRedirectMode$outboundSchema,
  BillingUpdateRemoveItemBillingMethod,
  BillingUpdateRemoveItemBillingMethod$outboundSchema,
  BillingUpdateRequiredAction$inboundSchema,
  BillingUpdateResponse$inboundSchema,
  BillingUpdateSpendLimit$outboundSchema,
  BillingUpdateThresholdType,
  BillingUpdateThresholdType$outboundSchema,
  BillingUpdateUsageAlert$outboundSchema,
  BillingUpdateUsageLimit$outboundSchema,
  BillingUpdateUsageLimitInterval,
  BillingUpdateUsageLimitInterval$outboundSchema,
  BinSize,
  BinSize$outboundSchema,
  Breakdown$inboundSchema,
  CheckAutoTopup1$inboundSchema,
  CheckAutoTopup2$inboundSchema,
  CheckBillingControls1$inboundSchema,
  CheckBillingControls2$inboundSchema,
  CheckConfig1$inboundSchema,
  CheckConfig2$inboundSchema,
  CheckCreditSchema1$inboundSchema,
  CheckCreditSchema2$inboundSchema,
  CheckEnv1,
  CheckEnv1$inboundSchema,
  CheckEnv2,
  CheckEnv2$inboundSchema,
  CheckFeature1$inboundSchema,
  CheckFeature2$inboundSchema,
  CheckFreeTrial1$inboundSchema,
  CheckFreeTrial2$inboundSchema,
  CheckItem1$inboundSchema,
  CheckItem2$inboundSchema,
  CheckItemInterval1,
  CheckItemInterval1$inboundSchema,
  CheckItemInterval2,
  CheckItemInterval2$inboundSchema,
  CheckLimitType1,
  CheckLimitType1$inboundSchema,
  CheckLimitType2,
  CheckLimitType2$inboundSchema,
  CheckLock$outboundSchema,
  CheckModelMarkups1$inboundSchema,
  CheckModelMarkups2$inboundSchema,
  CheckOnDecrease1,
  CheckOnDecrease1$inboundSchema,
  CheckOnDecrease2,
  CheckOnDecrease2$inboundSchema,
  CheckOnEnd1,
  CheckOnEnd1$inboundSchema,
  CheckOnEnd2,
  CheckOnEnd2$inboundSchema,
  CheckOnIncrease1,
  CheckOnIncrease1$inboundSchema,
  CheckOnIncrease2,
  CheckOnIncrease2$inboundSchema,
  CheckOverageAllowed1$inboundSchema,
  CheckOverageAllowed2$inboundSchema,
  CheckParams$outboundSchema,
  CheckProduct1$inboundSchema,
  CheckProduct2$inboundSchema,
  CheckProviderMarkups1$inboundSchema,
  CheckProviderMarkups2$inboundSchema,
  CheckPurchaseLimit1$inboundSchema,
  CheckPurchaseLimit2$inboundSchema,
  CheckPurchaseLimitInterval1,
  CheckPurchaseLimitInterval1$inboundSchema,
  CheckPurchaseLimitInterval2,
  CheckPurchaseLimitInterval2$inboundSchema,
  CheckResponse$inboundSchema,
  CheckResponseBody1$inboundSchema,
  CheckResponseBody2$inboundSchema,
  CheckRollover1$inboundSchema,
  CheckRollover2$inboundSchema,
  CheckSpendLimit1$inboundSchema,
  CheckSpendLimit2$inboundSchema,
  CheckThresholdType1,
  CheckThresholdType1$inboundSchema,
  CheckThresholdType2,
  CheckThresholdType2$inboundSchema,
  CheckTierBehavior1,
  CheckTierBehavior1$inboundSchema,
  CheckTierBehavior2,
  CheckTierBehavior2$inboundSchema,
  CheckUsageAlert1$inboundSchema,
  CheckUsageAlert2$inboundSchema,
  CheckUsageLimit1$inboundSchema,
  CheckUsageLimit2$inboundSchema,
  CheckUsageLimitInterval1,
  CheckUsageLimitInterval1$inboundSchema,
  CheckUsageLimitInterval2,
  CheckUsageLimitInterval2$inboundSchema,
  ConfigDuration1,
  ConfigDuration1$inboundSchema,
  ConfigDuration2,
  ConfigDuration2$inboundSchema,
  ConnectionError,
  CreateBalanceDuration,
  CreateBalanceDuration$outboundSchema,
  CreateBalanceInterval,
  CreateBalanceInterval$outboundSchema,
  CreateBalanceParams$outboundSchema,
  CreateBalanceReset$outboundSchema,
  CreateBalanceResponse$inboundSchema,
  CreateBalanceRollover$outboundSchema,
  CreateEntityBillingControlsRequest$outboundSchema,
  CreateEntityBillingControlsResponse$inboundSchema,
  CreateEntityCreditSchema$inboundSchema,
  CreateEntityDisplay$inboundSchema,
  CreateEntityEnv,
  CreateEntityEnv$inboundSchema,
  CreateEntityFeature$inboundSchema,
  CreateEntityFlags$inboundSchema,
  CreateEntityIntervalRequestBody,
  CreateEntityIntervalRequestBody$outboundSchema,
  CreateEntityIntervalResponse,
  CreateEntityIntervalResponse$inboundSchema,
  CreateEntityInvoice$inboundSchema,
  CreateEntityLimitTypeRequestBody,
  CreateEntityLimitTypeRequestBody$outboundSchema,
  CreateEntityLimitTypeResponse,
  CreateEntityLimitTypeResponse$inboundSchema,
  CreateEntityModelMarkups$inboundSchema,
  CreateEntityOverageAllowedRequest$outboundSchema,
  CreateEntityOverageAllowedResponse$inboundSchema,
  CreateEntityParams$outboundSchema,
  CreateEntityProcessorType,
  CreateEntityProcessorType$inboundSchema,
  CreateEntityProviderMarkups$inboundSchema,
  CreateEntityPurchase$inboundSchema,
  CreateEntityPurchaseScope,
  CreateEntityPurchaseScope$inboundSchema,
  CreateEntityResponse$inboundSchema,
  CreateEntitySpendLimitRequest$outboundSchema,
  CreateEntitySpendLimitResponse$inboundSchema,
  CreateEntityStatus,
  CreateEntityStatus$inboundSchema,
  CreateEntitySubscription$inboundSchema,
  CreateEntitySubscriptionScope,
  CreateEntitySubscriptionScope$inboundSchema,
  CreateEntityThresholdTypeRequestBody,
  CreateEntityThresholdTypeRequestBody$outboundSchema,
  CreateEntityThresholdTypeResponse,
  CreateEntityThresholdTypeResponse$inboundSchema,
  CreateEntityType,
  CreateEntityType$inboundSchema,
  CreateEntityUsageAlertRequestBody$outboundSchema,
  CreateEntityUsageAlertResponse$inboundSchema,
  CreateEntityUsageLimitRequest$outboundSchema,
  CreateEntityUsageLimitResponse$inboundSchema,
  CreateFeatureCreditSchemaRequestBody$outboundSchema,
  CreateFeatureCreditSchemaResponse$inboundSchema,
  CreateFeatureDisplayRequestBody$outboundSchema,
  CreateFeatureDisplayResponse$inboundSchema,
  CreateFeatureModelMarkupsRequest$outboundSchema,
  CreateFeatureModelMarkupsResponse$inboundSchema,
  CreateFeatureParams$outboundSchema,
  CreateFeatureProviderMarkupsRequest$outboundSchema,
  CreateFeatureProviderMarkupsResponse$inboundSchema,
  CreateFeatureResponse$inboundSchema,
  CreateFeatureTypeRequestBody,
  CreateFeatureTypeRequestBody$outboundSchema,
  CreateFeatureTypeResponse,
  CreateFeatureTypeResponse$inboundSchema,
  CreatePlanAttachAction,
  CreatePlanAttachAction$inboundSchema,
  CreatePlanAutoTopupRequest$outboundSchema,
  CreatePlanAutoTopupResponse$inboundSchema,
  CreatePlanBillingControlsRequest$outboundSchema,
  CreatePlanBillingControlsResponse$inboundSchema,
  CreatePlanBillingMethodRequestBody,
  CreatePlanBillingMethodRequestBody$outboundSchema,
  CreatePlanBillingMethodResponse,
  CreatePlanBillingMethodResponse$inboundSchema,
  CreatePlanConfigRequest$outboundSchema,
  CreatePlanConfigResponse$inboundSchema,
  CreatePlanCreditSchema$inboundSchema,
  CreatePlanCustomerEligibility$inboundSchema,
  CreatePlanDurationTypeRequest,
  CreatePlanDurationTypeRequest$outboundSchema,
  CreatePlanDurationTypeResponse,
  CreatePlanDurationTypeResponse$inboundSchema,
  CreatePlanEnv,
  CreatePlanEnv$inboundSchema,
  CreatePlanExpiryDurationTypeRequestBody,
  CreatePlanExpiryDurationTypeRequestBody$outboundSchema,
  CreatePlanExpiryDurationTypeResponse,
  CreatePlanExpiryDurationTypeResponse$inboundSchema,
  CreatePlanFeature$inboundSchema,
  CreatePlanFeatureDisplay$inboundSchema,
  CreatePlanFreeTrialResponse$inboundSchema,
  CreatePlanItem$inboundSchema,
  CreatePlanItemDisplay$inboundSchema,
  CreatePlanItemPriceIntervalRequestBody,
  CreatePlanItemPriceIntervalRequestBody$outboundSchema,
  CreatePlanItemPriceRequestBody$outboundSchema,
  CreatePlanItemPriceResponse$inboundSchema,
  CreatePlanLimitTypeRequestBody,
  CreatePlanLimitTypeRequestBody$outboundSchema,
  CreatePlanLimitTypeResponse,
  CreatePlanLimitTypeResponse$inboundSchema,
  CreatePlanOnDecrease,
  CreatePlanOnDecrease$outboundSchema,
  CreatePlanOnEndRequest,
  CreatePlanOnEndRequest$outboundSchema,
  CreatePlanOnEndResponse,
  CreatePlanOnEndResponse$inboundSchema,
  CreatePlanOnIncrease,
  CreatePlanOnIncrease$outboundSchema,
  CreatePlanOverageAllowedRequest$outboundSchema,
  CreatePlanOverageAllowedResponse$inboundSchema,
  CreatePlanParams$outboundSchema,
  CreatePlanPlanItem$outboundSchema,
  CreatePlanPriceDisplay$inboundSchema,
  CreatePlanPriceIntervalRequestBody,
  CreatePlanPriceIntervalRequestBody$outboundSchema,
  CreatePlanPriceIntervalResponse,
  CreatePlanPriceIntervalResponse$inboundSchema,
  CreatePlanPriceItemIntervalResponse,
  CreatePlanPriceItemIntervalResponse$inboundSchema,
  CreatePlanPriceRequestBody$outboundSchema,
  CreatePlanPriceResponse$inboundSchema,
  CreatePlanProration$outboundSchema,
  CreatePlanPurchaseLimitIntervalRequestBody,
  CreatePlanPurchaseLimitIntervalRequestBody$outboundSchema,
  CreatePlanPurchaseLimitIntervalResponse,
  CreatePlanPurchaseLimitIntervalResponse$inboundSchema,
  CreatePlanPurchaseLimitRequest$outboundSchema,
  CreatePlanPurchaseLimitResponse$inboundSchema,
  CreatePlanResetIntervalRequestBody,
  CreatePlanResetIntervalRequestBody$outboundSchema,
  CreatePlanResetIntervalResponse,
  CreatePlanResetIntervalResponse$inboundSchema,
  CreatePlanResetRequestBody$outboundSchema,
  CreatePlanResetResponse$inboundSchema,
  CreatePlanResponse$inboundSchema,
  CreatePlanRolloverRequestBody$outboundSchema,
  CreatePlanRolloverResponse$inboundSchema,
  CreatePlanSpendLimitRequest$outboundSchema,
  CreatePlanSpendLimitResponse$inboundSchema,
  CreatePlanStatus,
  CreatePlanStatus$inboundSchema,
  CreatePlanThresholdTypeRequestBody,
  CreatePlanThresholdTypeRequestBody$outboundSchema,
  CreatePlanThresholdTypeResponse,
  CreatePlanThresholdTypeResponse$inboundSchema,
  CreatePlanTierBehaviorRequestBody,
  CreatePlanTierBehaviorRequestBody$outboundSchema,
  CreatePlanTierBehaviorResponse,
  CreatePlanTierBehaviorResponse$inboundSchema,
  CreatePlanTierRequestBody$outboundSchema,
  CreatePlanTierResponse$inboundSchema,
  CreatePlanType,
  CreatePlanType$inboundSchema,
  CreatePlanUsageAlertRequestBody$outboundSchema,
  CreatePlanUsageAlertResponse$inboundSchema,
  CreatePlanUsageLimitIntervalRequestBody,
  CreatePlanUsageLimitIntervalRequestBody$outboundSchema,
  CreatePlanUsageLimitIntervalResponse,
  CreatePlanUsageLimitIntervalResponse$inboundSchema,
  CreatePlanUsageLimitRequest$outboundSchema,
  CreatePlanUsageLimitResponse$inboundSchema,
  CreateReferralCodeParams$outboundSchema,
  CreateReferralCodeResponse$inboundSchema,
  CreateScheduleAddItemBillingMethod2,
  CreateScheduleAddItemBillingMethod2$outboundSchema,
  CreateScheduleAddItemExpiryDurationType2,
  CreateScheduleAddItemExpiryDurationType2$outboundSchema,
  CreateScheduleAddItemOnDecrease2,
  CreateScheduleAddItemOnDecrease2$outboundSchema,
  CreateScheduleAddItemOnIncrease2,
  CreateScheduleAddItemOnIncrease2$outboundSchema,
  CreateScheduleAddItemPlanItem2$outboundSchema,
  CreateScheduleAddItemPrice2$outboundSchema,
  CreateScheduleAddItemPriceInterval2,
  CreateScheduleAddItemPriceInterval2$outboundSchema,
  CreateScheduleAddItemProration2$outboundSchema,
  CreateScheduleAddItemReset2$outboundSchema,
  CreateScheduleAddItemResetInterval2,
  CreateScheduleAddItemResetInterval2$outboundSchema,
  CreateScheduleAddItemRollover2$outboundSchema,
  CreateScheduleAddItemTier2$outboundSchema,
  CreateScheduleAddItemTierBehavior2,
  CreateScheduleAddItemTierBehavior2$outboundSchema,
  CreateScheduleAttachDiscount$outboundSchema,
  CreateScheduleAutoTopup2$outboundSchema,
  CreateScheduleBasePrice2$outboundSchema,
  CreateScheduleBillingControls2$outboundSchema,
  CreateScheduleCode,
  CreateScheduleCode$inboundSchema,
  CreateScheduleCustomize2$outboundSchema,
  CreateScheduleDurationType2,
  CreateScheduleDurationType2$outboundSchema,
  CreateScheduleFeatureQuantity2$outboundSchema,
  CreateScheduleIntervalRemoveItemEnum3,
  CreateScheduleIntervalRemoveItemEnum3$outboundSchema,
  CreateScheduleIntervalRemoveItemEnum4,
  CreateScheduleIntervalRemoveItemEnum4$outboundSchema,
  CreateScheduleInvoice$inboundSchema,
  CreateScheduleInvoiceMode$outboundSchema,
  CreateScheduleItemBillingMethod2,
  CreateScheduleItemBillingMethod2$outboundSchema,
  CreateScheduleItemExpiryDurationType2,
  CreateScheduleItemExpiryDurationType2$outboundSchema,
  CreateScheduleItemOnDecrease2,
  CreateScheduleItemOnDecrease2$outboundSchema,
  CreateScheduleItemOnIncrease2,
  CreateScheduleItemOnIncrease2$outboundSchema,
  CreateScheduleItemPlanItem2$outboundSchema,
  CreateScheduleItemPrice2$outboundSchema,
  CreateScheduleItemPriceInterval2,
  CreateScheduleItemPriceInterval2$outboundSchema,
  CreateScheduleItemProration2$outboundSchema,
  CreateScheduleItemReset2$outboundSchema,
  CreateScheduleItemResetInterval2,
  CreateScheduleItemResetInterval2$outboundSchema,
  CreateScheduleItemRollover2$outboundSchema,
  CreateScheduleItemTier2$outboundSchema,
  CreateScheduleItemTierBehavior2,
  CreateScheduleItemTierBehavior2$outboundSchema,
  CreateScheduleLimitType2,
  CreateScheduleLimitType2$outboundSchema,
  CreateScheduleOverageAllowed2$outboundSchema,
  CreateScheduleParams$outboundSchema,
  CreateSchedulePlan2$outboundSchema,
  CreateSchedulePlanItemFilter2$outboundSchema,
  CreateSchedulePriceInterval2,
  CreateSchedulePriceInterval2$outboundSchema,
  CreateSchedulePurchaseLimit2$outboundSchema,
  CreateSchedulePurchaseLimitInterval2,
  CreateSchedulePurchaseLimitInterval2$outboundSchema,
  CreateScheduleRedirectMode,
  CreateScheduleRedirectMode$outboundSchema,
  CreateScheduleRemoveItemBillingMethod2,
  CreateScheduleRemoveItemBillingMethod2$outboundSchema,
  CreateScheduleRequiredAction$inboundSchema,
  CreateScheduleResponse$inboundSchema,
  CreateScheduleSpendLimit2$outboundSchema,
  CreateScheduleStatus,
  CreateScheduleStatus$inboundSchema,
  CreateScheduleThresholdType2,
  CreateScheduleThresholdType2$outboundSchema,
  CreateScheduleUsageAlert2$outboundSchema,
  CreateScheduleUsageLimit2$outboundSchema,
  CreateScheduleUsageLimitInterval2,
  CreateScheduleUsageLimitInterval2$outboundSchema,
  Customer$inboundSchema,
  CustomerAutoTopup$inboundSchema,
  CustomerBillingControls$inboundSchema,
  CustomerConfig$inboundSchema,
  CustomerCreditSchema$inboundSchema,
  CustomerData$outboundSchema,
  CustomerDataAutoTopup$outboundSchema,
  CustomerDataBillingControls$outboundSchema,
  CustomerDataConfig$outboundSchema,
  CustomerDataLimitType,
  CustomerDataLimitType$outboundSchema,
  CustomerDataOverageAllowed$outboundSchema,
  CustomerDataPurchaseLimit$outboundSchema,
  CustomerDataPurchaseLimitInterval,
  CustomerDataPurchaseLimitInterval$outboundSchema,
  CustomerDataSpendLimit$outboundSchema,
  CustomerDataThresholdType,
  CustomerDataThresholdType$outboundSchema,
  CustomerDataUsageAlert$outboundSchema,
  CustomerDataUsageLimit$outboundSchema,
  CustomerDataUsageLimitInterval,
  CustomerDataUsageLimitInterval$outboundSchema,
  CustomerDisplay$inboundSchema,
  CustomerDurationType,
  CustomerDurationType$inboundSchema,
  CustomerEligibility$inboundSchema,
  CustomerEntityEnv,
  CustomerEntityEnv$inboundSchema,
  CustomerEnv,
  CustomerEnv$inboundSchema,
  CustomerExpand,
  CustomerExpand$outboundSchema,
  CustomerFeature$inboundSchema,
  CustomerFlagsType,
  CustomerFlagsType$inboundSchema,
  CustomerLimitType,
  CustomerLimitType$inboundSchema,
  CustomerModelMarkups$inboundSchema,
  CustomerOverageAllowed$inboundSchema,
  CustomerProviderMarkups$inboundSchema,
  CustomerPurchaseLimit1$inboundSchema,
  CustomerPurchaseLimit2$inboundSchema,
  CustomerPurchaseLimitInterval1,
  CustomerPurchaseLimitInterval1$inboundSchema,
  CustomerPurchaseLimitInterval2,
  CustomerPurchaseLimitInterval2$inboundSchema,
  CustomerRewardsType,
  CustomerRewardsType$inboundSchema,
  CustomerSpendLimit$inboundSchema,
  CustomerStatus,
  CustomerStatus$inboundSchema,
  CustomerThresholdType,
  CustomerThresholdType$inboundSchema,
  CustomerUsageAlert$inboundSchema,
  CustomerUsageLimit$inboundSchema,
  CustomerUsageLimitInterval,
  CustomerUsageLimitInterval$inboundSchema,
  Deductions$inboundSchema,
  DeleteBalanceInterval,
  DeleteBalanceInterval$outboundSchema,
  DeleteBalanceParams$outboundSchema,
  DeleteBalanceResponse$inboundSchema,
  DeleteCustomerParams$outboundSchema,
  DeleteCustomerResponse$inboundSchema,
  DeleteEntityParams$outboundSchema,
  DeleteEntityResponse$inboundSchema,
  DeleteFeatureParams$outboundSchema,
  DeleteFeatureResponse$inboundSchema,
  DeletePlanParams$outboundSchema,
  DeletePlanResponse$inboundSchema,
  Discount$inboundSchema,
  EntitlementsGranted$inboundSchema,
  Entity$inboundSchema,
  EventsAggregateParams$outboundSchema,
  EventsListParams$outboundSchema,
  ExpiryDurationType,
  ExpiryDurationType$inboundSchema,
  FeatureType1,
  FeatureType1$inboundSchema,
  FeatureType2,
  FeatureType2$inboundSchema,
  FinalizeBalanceParams$outboundSchema,
  FinalizeLockAction,
  FinalizeLockAction$outboundSchema,
  FinalizeLockResponse$inboundSchema,
  FinalizeLockResponseBody1$inboundSchema,
  FinalizeLockResponseBody2$inboundSchema,
  Flag1$inboundSchema,
  Flag2$inboundSchema,
  FlagDisplay1$inboundSchema,
  FlagDisplay2$inboundSchema,
  FlagType1,
  FlagType1$inboundSchema,
  FlagType2,
  FlagType2$inboundSchema,
  Flags$inboundSchema,
  FreeTrial$inboundSchema,
  FreeTrialDuration1,
  FreeTrialDuration1$inboundSchema,
  FreeTrialDuration2,
  FreeTrialDuration2$inboundSchema,
  FreeTrialRequest$outboundSchema,
  GetCustomerAutoTopup$inboundSchema,
  GetCustomerBillingControls$inboundSchema,
  GetCustomerConfig$inboundSchema,
  GetCustomerCreditSchema$inboundSchema,
  GetCustomerCustomer$inboundSchema,
  GetCustomerDiscount$inboundSchema,
  GetCustomerDisplay$inboundSchema,
  GetCustomerDurationType,
  GetCustomerDurationType$inboundSchema,
  GetCustomerEntity$inboundSchema,
  GetCustomerEntityEnv,
  GetCustomerEntityEnv$inboundSchema,
  GetCustomerEnv,
  GetCustomerEnv$inboundSchema,
  GetCustomerFeature$inboundSchema,
  GetCustomerFlags$inboundSchema,
  GetCustomerFlagsType,
  GetCustomerFlagsType$inboundSchema,
  GetCustomerInvoice$inboundSchema,
  GetCustomerLimitType,
  GetCustomerLimitType$inboundSchema,
  GetCustomerModelMarkups$inboundSchema,
  GetCustomerOverageAllowed$inboundSchema,
  GetCustomerParams$outboundSchema,
  GetCustomerProcessorType,
  GetCustomerProcessorType$inboundSchema,
  GetCustomerProcessors$inboundSchema,
  GetCustomerProviderMarkups$inboundSchema,
  GetCustomerPurchase$inboundSchema,
  GetCustomerPurchaseLimit1$inboundSchema,
  GetCustomerPurchaseLimit2$inboundSchema,
  GetCustomerPurchaseLimitInterval1,
  GetCustomerPurchaseLimitInterval1$inboundSchema,
  GetCustomerPurchaseLimitInterval2,
  GetCustomerPurchaseLimitInterval2$inboundSchema,
  GetCustomerPurchaseScope,
  GetCustomerPurchaseScope$inboundSchema,
  GetCustomerReferral$inboundSchema,
  GetCustomerResponse$inboundSchema,
  GetCustomerRevenuecat$inboundSchema,
  GetCustomerRewards$inboundSchema,
  GetCustomerRewardsType,
  GetCustomerRewardsType$inboundSchema,
  GetCustomerSpendLimit$inboundSchema,
  GetCustomerStatus,
  GetCustomerStatus$inboundSchema,
  GetCustomerStripe$inboundSchema,
  GetCustomerSubscription$inboundSchema,
  GetCustomerSubscriptionScope,
  GetCustomerSubscriptionScope$inboundSchema,
  GetCustomerThresholdType,
  GetCustomerThresholdType$inboundSchema,
  GetCustomerTrialsUsed$inboundSchema,
  GetCustomerUsageAlert$inboundSchema,
  GetCustomerUsageLimit$inboundSchema,
  GetCustomerUsageLimitInterval,
  GetCustomerUsageLimitInterval$inboundSchema,
  GetCustomerVercel$inboundSchema,
  GetEntityBillingControls$inboundSchema,
  GetEntityCreditSchema$inboundSchema,
  GetEntityDisplay$inboundSchema,
  GetEntityEnv,
  GetEntityEnv$inboundSchema,
  GetEntityFeature$inboundSchema,
  GetEntityFlags$inboundSchema,
  GetEntityInterval,
  GetEntityInterval$inboundSchema,
  GetEntityInvoice$inboundSchema,
  GetEntityLimitType,
  GetEntityLimitType$inboundSchema,
  GetEntityModelMarkups$inboundSchema,
  GetEntityOverageAllowed$inboundSchema,
  GetEntityParams$outboundSchema,
  GetEntityProcessorType,
  GetEntityProcessorType$inboundSchema,
  GetEntityProviderMarkups$inboundSchema,
  GetEntityPurchase$inboundSchema,
  GetEntityPurchaseScope,
  GetEntityPurchaseScope$inboundSchema,
  GetEntityResponse$inboundSchema,
  GetEntitySpendLimit$inboundSchema,
  GetEntityStatus,
  GetEntityStatus$inboundSchema,
  GetEntitySubscription$inboundSchema,
  GetEntitySubscriptionScope,
  GetEntitySubscriptionScope$inboundSchema,
  GetEntityThresholdType,
  GetEntityThresholdType$inboundSchema,
  GetEntityType,
  GetEntityType$inboundSchema,
  GetEntityUsageAlert$inboundSchema,
  GetEntityUsageLimit$inboundSchema,
  GetFeatureCreditSchema$inboundSchema,
  GetFeatureDisplay$inboundSchema,
  GetFeatureModelMarkups$inboundSchema,
  GetFeatureParams$outboundSchema,
  GetFeatureProviderMarkups$inboundSchema,
  GetFeatureResponse$inboundSchema,
  GetFeatureType,
  GetFeatureType$inboundSchema,
  GetOrCreateCustomerAutoTopup$outboundSchema,
  GetOrCreateCustomerBillingControls$outboundSchema,
  GetOrCreateCustomerConfig$outboundSchema,
  GetOrCreateCustomerLimitType,
  GetOrCreateCustomerLimitType$outboundSchema,
  GetOrCreateCustomerOverageAllowed$outboundSchema,
  GetOrCreateCustomerParams$outboundSchema,
  GetOrCreateCustomerPurchaseLimit$outboundSchema,
  GetOrCreateCustomerPurchaseLimitInterval,
  GetOrCreateCustomerPurchaseLimitInterval$outboundSchema,
  GetOrCreateCustomerSpendLimit$outboundSchema,
  GetOrCreateCustomerThresholdType,
  GetOrCreateCustomerThresholdType$outboundSchema,
  GetOrCreateCustomerUsageAlert$outboundSchema,
  GetOrCreateCustomerUsageLimit$outboundSchema,
  GetOrCreateCustomerUsageLimitInterval,
  GetOrCreateCustomerUsageLimitInterval$outboundSchema,
  GetPlanAttachAction,
  GetPlanAttachAction$inboundSchema,
  GetPlanAutoTopup$inboundSchema,
  GetPlanBillingControls$inboundSchema,
  GetPlanBillingMethod,
  GetPlanBillingMethod$inboundSchema,
  GetPlanConfig$inboundSchema,
  GetPlanCreditSchema$inboundSchema,
  GetPlanCustomerEligibility$inboundSchema,
  GetPlanDurationType,
  GetPlanDurationType$inboundSchema,
  GetPlanEnv,
  GetPlanEnv$inboundSchema,
  GetPlanExpiryDurationType,
  GetPlanExpiryDurationType$inboundSchema,
  GetPlanFeature$inboundSchema,
  GetPlanFeatureDisplay$inboundSchema,
  GetPlanFreeTrial$inboundSchema,
  GetPlanItem$inboundSchema,
  GetPlanItemDisplay$inboundSchema,
  GetPlanItemPrice$inboundSchema,
  GetPlanLimitType,
  GetPlanLimitType$inboundSchema,
  GetPlanOnEnd,
  GetPlanOnEnd$inboundSchema,
  GetPlanOverageAllowed$inboundSchema,
  GetPlanParams$outboundSchema,
  GetPlanPrice$inboundSchema,
  GetPlanPriceDisplay$inboundSchema,
  GetPlanPriceInterval,
  GetPlanPriceInterval$inboundSchema,
  GetPlanPriceItemInterval,
  GetPlanPriceItemInterval$inboundSchema,
  GetPlanPurchaseLimit$inboundSchema,
  GetPlanPurchaseLimitInterval,
  GetPlanPurchaseLimitInterval$inboundSchema,
  GetPlanReset$inboundSchema,
  GetPlanResetInterval,
  GetPlanResetInterval$inboundSchema,
  GetPlanResponse$inboundSchema,
  GetPlanRollover$inboundSchema,
  GetPlanSpendLimit$inboundSchema,
  GetPlanStatus,
  GetPlanStatus$inboundSchema,
  GetPlanThresholdType,
  GetPlanThresholdType$inboundSchema,
  GetPlanTier$inboundSchema,
  GetPlanTierBehavior,
  GetPlanTierBehavior$inboundSchema,
  GetPlanType,
  GetPlanType$inboundSchema,
  GetPlanUsageAlert$inboundSchema,
  GetPlanUsageLimit$inboundSchema,
  GetPlanUsageLimitInterval,
  GetPlanUsageLimitInterval$inboundSchema,
  GetRevenueCatKeysApp$inboundSchema,
  GetRevenueCatKeysEnv,
  GetRevenueCatKeysEnv$outboundSchema,
  GetRevenueCatKeysParams$outboundSchema,
  GetRevenueCatKeysResponse$inboundSchema,
  HTTPClient,
  HTTPClientError,
  Intent,
  Intent$inboundSchema,
  InvalidRequestError,
  Invoice$inboundSchema,
  Item$inboundSchema,
  LinkRevenueCatEnv,
  LinkRevenueCatEnv$outboundSchema,
  LinkRevenueCatParams$outboundSchema,
  LinkRevenueCatResponse$inboundSchema,
  ListCustomersAutoTopup$inboundSchema,
  ListCustomersBillingControls$inboundSchema,
  ListCustomersConfig$inboundSchema,
  ListCustomersCreditSchema$inboundSchema,
  ListCustomersDisplay$inboundSchema,
  ListCustomersEnv,
  ListCustomersEnv$inboundSchema,
  ListCustomersFeature$inboundSchema,
  ListCustomersFlags$inboundSchema,
  ListCustomersLimitType,
  ListCustomersLimitType$inboundSchema,
  ListCustomersList$inboundSchema,
  ListCustomersModelMarkups$inboundSchema,
  ListCustomersOverageAllowed$inboundSchema,
  ListCustomersParams$outboundSchema,
  ListCustomersPlan$outboundSchema,
  ListCustomersProcessor,
  ListCustomersProcessor$outboundSchema,
  ListCustomersProcessors$inboundSchema,
  ListCustomersProviderMarkups$inboundSchema,
  ListCustomersPurchase$inboundSchema,
  ListCustomersPurchaseLimit1$inboundSchema,
  ListCustomersPurchaseLimit2$inboundSchema,
  ListCustomersPurchaseLimitInterval1,
  ListCustomersPurchaseLimitInterval1$inboundSchema,
  ListCustomersPurchaseLimitInterval2,
  ListCustomersPurchaseLimitInterval2$inboundSchema,
  ListCustomersPurchaseScope,
  ListCustomersPurchaseScope$inboundSchema,
  ListCustomersResponse$inboundSchema,
  ListCustomersRevenuecat$inboundSchema,
  ListCustomersSpendLimit$inboundSchema,
  ListCustomersStatus,
  ListCustomersStatus$inboundSchema,
  ListCustomersStripe$inboundSchema,
  ListCustomersSubscription$inboundSchema,
  ListCustomersSubscriptionScope,
  ListCustomersSubscriptionScope$inboundSchema,
  ListCustomersSubscriptionStatus,
  ListCustomersSubscriptionStatus$outboundSchema,
  ListCustomersThresholdType,
  ListCustomersThresholdType$inboundSchema,
  ListCustomersType,
  ListCustomersType$inboundSchema,
  ListCustomersUsageAlert$inboundSchema,
  ListCustomersUsageLimit$inboundSchema,
  ListCustomersUsageLimitInterval,
  ListCustomersUsageLimitInterval$inboundSchema,
  ListCustomersVercel$inboundSchema,
  ListEntitiesBillingControls$inboundSchema,
  ListEntitiesCreditSchema$inboundSchema,
  ListEntitiesDisplay$inboundSchema,
  ListEntitiesEnv,
  ListEntitiesEnv$inboundSchema,
  ListEntitiesFeature$inboundSchema,
  ListEntitiesFlags$inboundSchema,
  ListEntitiesInterval,
  ListEntitiesInterval$inboundSchema,
  ListEntitiesInvoice$inboundSchema,
  ListEntitiesLimitType,
  ListEntitiesLimitType$inboundSchema,
  ListEntitiesList$inboundSchema,
  ListEntitiesModelMarkups$inboundSchema,
  ListEntitiesOverageAllowed$inboundSchema,
  ListEntitiesParams$outboundSchema,
  ListEntitiesPlan$outboundSchema,
  ListEntitiesProcessor,
  ListEntitiesProcessor$outboundSchema,
  ListEntitiesProcessorType,
  ListEntitiesProcessorType$inboundSchema,
  ListEntitiesProviderMarkups$inboundSchema,
  ListEntitiesPurchase$inboundSchema,
  ListEntitiesPurchaseScope,
  ListEntitiesPurchaseScope$inboundSchema,
  ListEntitiesResponse$inboundSchema,
  ListEntitiesSpendLimit$inboundSchema,
  ListEntitiesStatus,
  ListEntitiesStatus$inboundSchema,
  ListEntitiesSubscription$inboundSchema,
  ListEntitiesSubscriptionScope,
  ListEntitiesSubscriptionScope$inboundSchema,
  ListEntitiesSubscriptionStatus,
  ListEntitiesSubscriptionStatus$outboundSchema,
  ListEntitiesThresholdType,
  ListEntitiesThresholdType$inboundSchema,
  ListEntitiesType,
  ListEntitiesType$inboundSchema,
  ListEntitiesUsageAlert$inboundSchema,
  ListEntitiesUsageLimit$inboundSchema,
  ListEventsCustomRange$outboundSchema,
  ListEventsIntervalEnum,
  ListEventsIntervalEnum$inboundSchema,
  ListEventsList$inboundSchema,
  ListEventsReset$inboundSchema,
  ListEventsResponse$inboundSchema,
  ListFeaturesCreditSchema$inboundSchema,
  ListFeaturesDisplay$inboundSchema,
  ListFeaturesList$inboundSchema,
  ListFeaturesModelMarkups$inboundSchema,
  ListFeaturesProviderMarkups$inboundSchema,
  ListFeaturesResponse$inboundSchema,
  ListFeaturesType,
  ListFeaturesType$inboundSchema,
  ListPlansAttachAction,
  ListPlansAttachAction$inboundSchema,
  ListPlansAutoTopup$inboundSchema,
  ListPlansBillingControls$inboundSchema,
  ListPlansBillingMethod,
  ListPlansBillingMethod$inboundSchema,
  ListPlansConfig$inboundSchema,
  ListPlansCreditSchema$inboundSchema,
  ListPlansCustomerEligibility$inboundSchema,
  ListPlansDurationType,
  ListPlansDurationType$inboundSchema,
  ListPlansEnv,
  ListPlansEnv$inboundSchema,
  ListPlansExpiryDurationType,
  ListPlansExpiryDurationType$inboundSchema,
  ListPlansFeature$inboundSchema,
  ListPlansFeatureDisplay$inboundSchema,
  ListPlansFreeTrial$inboundSchema,
  ListPlansItem$inboundSchema,
  ListPlansItemDisplay$inboundSchema,
  ListPlansItemPrice$inboundSchema,
  ListPlansLimitType,
  ListPlansLimitType$inboundSchema,
  ListPlansList$inboundSchema,
  ListPlansOnEnd,
  ListPlansOnEnd$inboundSchema,
  ListPlansOverageAllowed$inboundSchema,
  ListPlansParams$outboundSchema,
  ListPlansPrice$inboundSchema,
  ListPlansPriceDisplay$inboundSchema,
  ListPlansPriceInterval,
  ListPlansPriceInterval$inboundSchema,
  ListPlansPriceItemInterval,
  ListPlansPriceItemInterval$inboundSchema,
  ListPlansPurchaseLimit$inboundSchema,
  ListPlansPurchaseLimitInterval,
  ListPlansPurchaseLimitInterval$inboundSchema,
  ListPlansReset$inboundSchema,
  ListPlansResetInterval,
  ListPlansResetInterval$inboundSchema,
  ListPlansResponse$inboundSchema,
  ListPlansRollover$inboundSchema,
  ListPlansSpendLimit$inboundSchema,
  ListPlansStatus,
  ListPlansStatus$inboundSchema,
  ListPlansThresholdType,
  ListPlansThresholdType$inboundSchema,
  ListPlansTier$inboundSchema,
  ListPlansTierBehavior,
  ListPlansTierBehavior$inboundSchema,
  ListPlansType,
  ListPlansType$inboundSchema,
  ListPlansUsageAlert$inboundSchema,
  ListPlansUsageLimit$inboundSchema,
  ListPlansUsageLimitInterval,
  ListPlansUsageLimitInterval$inboundSchema,
  MintKeyParams$outboundSchema,
  MintKeyResponse$inboundSchema,
  MultiAttachAttachDiscount$outboundSchema,
  MultiAttachBasePrice$outboundSchema,
  MultiAttachBillingControls$outboundSchema,
  MultiAttachBillingMethod,
  MultiAttachBillingMethod$outboundSchema,
  MultiAttachCode,
  MultiAttachCode$inboundSchema,
  MultiAttachCustomize$outboundSchema,
  MultiAttachDurationType,
  MultiAttachDurationType$outboundSchema,
  MultiAttachEntityData$outboundSchema,
  MultiAttachEntityDataInterval,
  MultiAttachEntityDataInterval$outboundSchema,
  MultiAttachExpiryDurationType,
  MultiAttachExpiryDurationType$outboundSchema,
  MultiAttachFeatureQuantity$outboundSchema,
  MultiAttachFreeTrialParams$outboundSchema,
  MultiAttachInvoice$inboundSchema,
  MultiAttachInvoiceMode$outboundSchema,
  MultiAttachItemPriceInterval,
  MultiAttachItemPriceInterval$outboundSchema,
  MultiAttachLimitType,
  MultiAttachLimitType$outboundSchema,
  MultiAttachOnDecrease,
  MultiAttachOnDecrease$outboundSchema,
  MultiAttachOnEnd,
  MultiAttachOnEnd$outboundSchema,
  MultiAttachOnIncrease,
  MultiAttachOnIncrease$outboundSchema,
  MultiAttachOverageAllowed$outboundSchema,
  MultiAttachParams$outboundSchema,
  MultiAttachPlan$outboundSchema,
  MultiAttachPlanItem$outboundSchema,
  MultiAttachPrice$outboundSchema,
  MultiAttachPriceInterval,
  MultiAttachPriceInterval$outboundSchema,
  MultiAttachProration$outboundSchema,
  MultiAttachRedirectMode,
  MultiAttachRedirectMode$outboundSchema,
  MultiAttachRequiredAction$inboundSchema,
  MultiAttachReset$outboundSchema,
  MultiAttachResetInterval,
  MultiAttachResetInterval$outboundSchema,
  MultiAttachResponse$inboundSchema,
  MultiAttachRollover$outboundSchema,
  MultiAttachSpendLimit$outboundSchema,
  MultiAttachThresholdType,
  MultiAttachThresholdType$outboundSchema,
  MultiAttachTier$outboundSchema,
  MultiAttachTierBehavior,
  MultiAttachTierBehavior$outboundSchema,
  MultiAttachUsageAlert$outboundSchema,
  MultiAttachUsageLimit$outboundSchema,
  OnEnd,
  OnEnd$inboundSchema,
  OpenCustomerPortalParams$outboundSchema,
  OpenCustomerPortalResponse$inboundSchema,
  PhaseRequest2$outboundSchema,
  PhaseResponse$inboundSchema,
  Plan$inboundSchema,
  PlanAutoTopup$inboundSchema,
  PlanBillingControls$inboundSchema,
  PlanBillingMethod,
  PlanBillingMethod$inboundSchema,
  PlanConfig$inboundSchema,
  PlanCreditSchema$inboundSchema,
  PlanDurationType,
  PlanDurationType$inboundSchema,
  PlanEnv,
  PlanEnv$inboundSchema,
  PlanFeature$inboundSchema,
  PlanFeatureDisplay$inboundSchema,
  PlanItemDisplay$inboundSchema,
  PlanItemPrice$inboundSchema,
  PlanLimitType,
  PlanLimitType$inboundSchema,
  PlanOverageAllowed$inboundSchema,
  PlanPrice$inboundSchema,
  PlanPriceDisplay$inboundSchema,
  PlanPriceInterval,
  PlanPriceInterval$inboundSchema,
  PlanPriceItemInterval,
  PlanPriceItemInterval$inboundSchema,
  PlanPurchaseLimit$inboundSchema,
  PlanPurchaseLimitInterval,
  PlanPurchaseLimitInterval$inboundSchema,
  PlanReset$inboundSchema,
  PlanResetInterval,
  PlanResetInterval$inboundSchema,
  PlanRollover$inboundSchema,
  PlanSpendLimit$inboundSchema,
  PlanStatus,
  PlanStatus$inboundSchema,
  PlanThresholdType,
  PlanThresholdType$inboundSchema,
  PlanTier$inboundSchema,
  PlanTierBehavior,
  PlanTierBehavior$inboundSchema,
  PlanType,
  PlanType$inboundSchema,
  PlanUsageAlert$inboundSchema,
  PlanUsageLimit$inboundSchema,
  PlanUsageLimitInterval,
  PlanUsageLimitInterval$inboundSchema,
  Preview1$inboundSchema,
  Preview2$inboundSchema,
  PreviewAttachAddItemBillingMethod,
  PreviewAttachAddItemBillingMethod$outboundSchema,
  PreviewAttachAddItemExpiryDurationType,
  PreviewAttachAddItemExpiryDurationType$outboundSchema,
  PreviewAttachAddItemOnDecrease,
  PreviewAttachAddItemOnDecrease$outboundSchema,
  PreviewAttachAddItemOnIncrease,
  PreviewAttachAddItemOnIncrease$outboundSchema,
  PreviewAttachAddItemPlanItem$outboundSchema,
  PreviewAttachAddItemPrice$outboundSchema,
  PreviewAttachAddItemPriceInterval,
  PreviewAttachAddItemPriceInterval$outboundSchema,
  PreviewAttachAddItemProration$outboundSchema,
  PreviewAttachAddItemReset$outboundSchema,
  PreviewAttachAddItemResetInterval,
  PreviewAttachAddItemResetInterval$outboundSchema,
  PreviewAttachAddItemRollover$outboundSchema,
  PreviewAttachAddItemTier$outboundSchema,
  PreviewAttachAddItemTierBehavior,
  PreviewAttachAddItemTierBehavior$outboundSchema,
  PreviewAttachAttachDiscount$outboundSchema,
  PreviewAttachAutoTopup$outboundSchema,
  PreviewAttachBasePrice$outboundSchema,
  PreviewAttachBillingControls$outboundSchema,
  PreviewAttachCarryOverBalances$outboundSchema,
  PreviewAttachCarryOverUsages$outboundSchema,
  PreviewAttachCheckoutType,
  PreviewAttachCheckoutType$inboundSchema,
  PreviewAttachCustomLineItem$outboundSchema,
  PreviewAttachCustomize$outboundSchema,
  PreviewAttachDiscount$inboundSchema,
  PreviewAttachDurationType,
  PreviewAttachDurationType$outboundSchema,
  PreviewAttachFeatureQuantityRequest$outboundSchema,
  PreviewAttachFreeTrialParams$outboundSchema,
  PreviewAttachIncoming$inboundSchema,
  PreviewAttachIncomingFeatureQuantity$inboundSchema,
  PreviewAttachIntervalRemoveItemEnum1,
  PreviewAttachIntervalRemoveItemEnum1$outboundSchema,
  PreviewAttachIntervalRemoveItemEnum2,
  PreviewAttachIntervalRemoveItemEnum2$outboundSchema,
  PreviewAttachInvoiceCredits$inboundSchema,
  PreviewAttachInvoiceMode$outboundSchema,
  PreviewAttachItemBillingMethod,
  PreviewAttachItemBillingMethod$outboundSchema,
  PreviewAttachItemExpiryDurationType,
  PreviewAttachItemExpiryDurationType$outboundSchema,
  PreviewAttachItemOnDecrease,
  PreviewAttachItemOnDecrease$outboundSchema,
  PreviewAttachItemOnIncrease,
  PreviewAttachItemOnIncrease$outboundSchema,
  PreviewAttachItemPlanItem$outboundSchema,
  PreviewAttachItemPrice$outboundSchema,
  PreviewAttachItemPriceInterval,
  PreviewAttachItemPriceInterval$outboundSchema,
  PreviewAttachItemProration$outboundSchema,
  PreviewAttachItemReset$outboundSchema,
  PreviewAttachItemResetInterval,
  PreviewAttachItemResetInterval$outboundSchema,
  PreviewAttachItemRollover$outboundSchema,
  PreviewAttachItemTier$outboundSchema,
  PreviewAttachItemTierBehavior,
  PreviewAttachItemTierBehavior$outboundSchema,
  PreviewAttachLimitType,
  PreviewAttachLimitType$outboundSchema,
  PreviewAttachLineItem$inboundSchema,
  PreviewAttachLineItemPeriod$inboundSchema,
  PreviewAttachNextCycle$inboundSchema,
  PreviewAttachNextCycleDiscount$inboundSchema,
  PreviewAttachNextCycleLineItem$inboundSchema,
  PreviewAttachNextCycleLineItemPeriod$inboundSchema,
  PreviewAttachOnEnd,
  PreviewAttachOnEnd$outboundSchema,
  PreviewAttachOutgoing$inboundSchema,
  PreviewAttachOutgoingFeatureQuantity$inboundSchema,
  PreviewAttachOverageAllowed$outboundSchema,
  PreviewAttachParams$outboundSchema,
  PreviewAttachPlanItemFilter$outboundSchema,
  PreviewAttachPlanSchedule,
  PreviewAttachPlanSchedule$outboundSchema,
  PreviewAttachPriceInterval,
  PreviewAttachPriceInterval$outboundSchema,
  PreviewAttachProrationBehavior,
  PreviewAttachProrationBehavior$outboundSchema,
  PreviewAttachPurchaseLimit$outboundSchema,
  PreviewAttachPurchaseLimitInterval,
  PreviewAttachPurchaseLimitInterval$outboundSchema,
  PreviewAttachRedirectMode,
  PreviewAttachRedirectMode$outboundSchema,
  PreviewAttachRemoveItemBillingMethod,
  PreviewAttachRemoveItemBillingMethod$outboundSchema,
  PreviewAttachResponse$inboundSchema,
  PreviewAttachSpendLimit$outboundSchema,
  PreviewAttachStatus,
  PreviewAttachStatus$inboundSchema,
  PreviewAttachTax$inboundSchema,
  PreviewAttachThresholdType,
  PreviewAttachThresholdType$outboundSchema,
  PreviewAttachUsageAlert$outboundSchema,
  PreviewAttachUsageLimit$outboundSchema,
  PreviewAttachUsageLimitInterval,
  PreviewAttachUsageLimitInterval$outboundSchema,
  PreviewAttachUsageLineItem$inboundSchema,
  PreviewAttachUsageLineItemPeriod$inboundSchema,
  PreviewMultiAttachAttachDiscount$outboundSchema,
  PreviewMultiAttachBasePrice$outboundSchema,
  PreviewMultiAttachBillingControls$outboundSchema,
  PreviewMultiAttachBillingMethod,
  PreviewMultiAttachBillingMethod$outboundSchema,
  PreviewMultiAttachCheckoutType,
  PreviewMultiAttachCheckoutType$inboundSchema,
  PreviewMultiAttachCustomize$outboundSchema,
  PreviewMultiAttachDiscount$inboundSchema,
  PreviewMultiAttachDurationType,
  PreviewMultiAttachDurationType$outboundSchema,
  PreviewMultiAttachEntityData$outboundSchema,
  PreviewMultiAttachEntityDataInterval,
  PreviewMultiAttachEntityDataInterval$outboundSchema,
  PreviewMultiAttachExpiryDurationType,
  PreviewMultiAttachExpiryDurationType$outboundSchema,
  PreviewMultiAttachFreeTrialParams$outboundSchema,
  PreviewMultiAttachIncoming$inboundSchema,
  PreviewMultiAttachIncomingFeatureQuantity$inboundSchema,
  PreviewMultiAttachInvoiceCredits$inboundSchema,
  PreviewMultiAttachInvoiceMode$outboundSchema,
  PreviewMultiAttachItemPriceInterval,
  PreviewMultiAttachItemPriceInterval$outboundSchema,
  PreviewMultiAttachLimitType,
  PreviewMultiAttachLimitType$outboundSchema,
  PreviewMultiAttachLineItem$inboundSchema,
  PreviewMultiAttachLineItemPeriod$inboundSchema,
  PreviewMultiAttachNextCycle$inboundSchema,
  PreviewMultiAttachNextCycleDiscount$inboundSchema,
  PreviewMultiAttachNextCycleLineItem$inboundSchema,
  PreviewMultiAttachNextCycleLineItemPeriod$inboundSchema,
  PreviewMultiAttachOnDecrease,
  PreviewMultiAttachOnDecrease$outboundSchema,
  PreviewMultiAttachOnEnd,
  PreviewMultiAttachOnEnd$outboundSchema,
  PreviewMultiAttachOnIncrease,
  PreviewMultiAttachOnIncrease$outboundSchema,
  PreviewMultiAttachOutgoing$inboundSchema,
  PreviewMultiAttachOutgoingFeatureQuantity$inboundSchema,
  PreviewMultiAttachOverageAllowed$outboundSchema,
  PreviewMultiAttachParams$outboundSchema,
  PreviewMultiAttachPlan$outboundSchema,
  PreviewMultiAttachPlanFeatureQuantity$outboundSchema,
  PreviewMultiAttachPlanItem$outboundSchema,
  PreviewMultiAttachPrice$outboundSchema,
  PreviewMultiAttachPriceInterval,
  PreviewMultiAttachPriceInterval$outboundSchema,
  PreviewMultiAttachProration$outboundSchema,
  PreviewMultiAttachRedirectMode,
  PreviewMultiAttachRedirectMode$outboundSchema,
  PreviewMultiAttachReset$outboundSchema,
  PreviewMultiAttachResetInterval,
  PreviewMultiAttachResetInterval$outboundSchema,
  PreviewMultiAttachResponse$inboundSchema,
  PreviewMultiAttachRollover$outboundSchema,
  PreviewMultiAttachSpendLimit$outboundSchema,
  PreviewMultiAttachStatus,
  PreviewMultiAttachStatus$inboundSchema,
  PreviewMultiAttachTax$inboundSchema,
  PreviewMultiAttachThresholdType,
  PreviewMultiAttachThresholdType$outboundSchema,
  PreviewMultiAttachTier$outboundSchema,
  PreviewMultiAttachTierBehavior,
  PreviewMultiAttachTierBehavior$outboundSchema,
  PreviewMultiAttachUsageAlert$outboundSchema,
  PreviewMultiAttachUsageLimit$outboundSchema,
  PreviewMultiAttachUsageLineItem$inboundSchema,
  PreviewMultiAttachUsageLineItemPeriod$inboundSchema,
  PreviewUpdateAddItemBillingMethod,
  PreviewUpdateAddItemBillingMethod$outboundSchema,
  PreviewUpdateAddItemExpiryDurationType,
  PreviewUpdateAddItemExpiryDurationType$outboundSchema,
  PreviewUpdateAddItemOnDecrease,
  PreviewUpdateAddItemOnDecrease$outboundSchema,
  PreviewUpdateAddItemOnIncrease,
  PreviewUpdateAddItemOnIncrease$outboundSchema,
  PreviewUpdateAddItemPlanItem$outboundSchema,
  PreviewUpdateAddItemPrice$outboundSchema,
  PreviewUpdateAddItemPriceInterval,
  PreviewUpdateAddItemPriceInterval$outboundSchema,
  PreviewUpdateAddItemProration$outboundSchema,
  PreviewUpdateAddItemReset$outboundSchema,
  PreviewUpdateAddItemResetInterval,
  PreviewUpdateAddItemResetInterval$outboundSchema,
  PreviewUpdateAddItemRollover$outboundSchema,
  PreviewUpdateAddItemTier$outboundSchema,
  PreviewUpdateAddItemTierBehavior,
  PreviewUpdateAddItemTierBehavior$outboundSchema,
  PreviewUpdateAttachDiscount$outboundSchema,
  PreviewUpdateAutoTopup$outboundSchema,
  PreviewUpdateBasePrice$outboundSchema,
  PreviewUpdateBillingControls$outboundSchema,
  PreviewUpdateCancelAction,
  PreviewUpdateCancelAction$outboundSchema,
  PreviewUpdateCarryOverUsages$outboundSchema,
  PreviewUpdateCustomize$outboundSchema,
  PreviewUpdateDiscount$inboundSchema,
  PreviewUpdateDurationType,
  PreviewUpdateDurationType$outboundSchema,
  PreviewUpdateFeatureQuantityRequest$outboundSchema,
  PreviewUpdateFreeTrialParams$outboundSchema,
  PreviewUpdateIncoming$inboundSchema,
  PreviewUpdateIncomingFeatureQuantity$inboundSchema,
  PreviewUpdateIntervalRemoveItemEnum1,
  PreviewUpdateIntervalRemoveItemEnum1$outboundSchema,
  PreviewUpdateIntervalRemoveItemEnum2,
  PreviewUpdateIntervalRemoveItemEnum2$outboundSchema,
  PreviewUpdateInvoiceCredits$inboundSchema,
  PreviewUpdateInvoiceMode$outboundSchema,
  PreviewUpdateItemBillingMethod,
  PreviewUpdateItemBillingMethod$outboundSchema,
  PreviewUpdateItemExpiryDurationType,
  PreviewUpdateItemExpiryDurationType$outboundSchema,
  PreviewUpdateItemOnDecrease,
  PreviewUpdateItemOnDecrease$outboundSchema,
  PreviewUpdateItemOnIncrease,
  PreviewUpdateItemOnIncrease$outboundSchema,
  PreviewUpdateItemPlanItem$outboundSchema,
  PreviewUpdateItemPrice$outboundSchema,
  PreviewUpdateItemPriceInterval,
  PreviewUpdateItemPriceInterval$outboundSchema,
  PreviewUpdateItemProration$outboundSchema,
  PreviewUpdateItemReset$outboundSchema,
  PreviewUpdateItemResetInterval,
  PreviewUpdateItemResetInterval$outboundSchema,
  PreviewUpdateItemRollover$outboundSchema,
  PreviewUpdateItemTier$outboundSchema,
  PreviewUpdateItemTierBehavior,
  PreviewUpdateItemTierBehavior$outboundSchema,
  PreviewUpdateLimitType,
  PreviewUpdateLimitType$outboundSchema,
  PreviewUpdateLineItem$inboundSchema,
  PreviewUpdateLineItemPeriod$inboundSchema,
  PreviewUpdateNextCycle$inboundSchema,
  PreviewUpdateNextCycleDiscount$inboundSchema,
  PreviewUpdateNextCycleLineItem$inboundSchema,
  PreviewUpdateNextCycleLineItemPeriod$inboundSchema,
  PreviewUpdateOnEnd,
  PreviewUpdateOnEnd$outboundSchema,
  PreviewUpdateOutgoing$inboundSchema,
  PreviewUpdateOutgoingFeatureQuantity$inboundSchema,
  PreviewUpdateOverageAllowed$outboundSchema,
  PreviewUpdateParams$outboundSchema,
  PreviewUpdatePlanItemFilter$outboundSchema,
  PreviewUpdatePriceInterval,
  PreviewUpdatePriceInterval$outboundSchema,
  PreviewUpdateProrationBehavior,
  PreviewUpdateProrationBehavior$outboundSchema,
  PreviewUpdatePurchaseLimit$outboundSchema,
  PreviewUpdatePurchaseLimitInterval,
  PreviewUpdatePurchaseLimitInterval$outboundSchema,
  PreviewUpdateRecalculateBalances$outboundSchema,
  PreviewUpdateRedirectMode,
  PreviewUpdateRedirectMode$outboundSchema,
  PreviewUpdateRemoveItemBillingMethod,
  PreviewUpdateRemoveItemBillingMethod$outboundSchema,
  PreviewUpdateResponse$inboundSchema,
  PreviewUpdateSpendLimit$outboundSchema,
  PreviewUpdateStatus,
  PreviewUpdateStatus$inboundSchema,
  PreviewUpdateTax$inboundSchema,
  PreviewUpdateThresholdType,
  PreviewUpdateThresholdType$outboundSchema,
  PreviewUpdateUsageAlert$outboundSchema,
  PreviewUpdateUsageLimit$outboundSchema,
  PreviewUpdateUsageLimitInterval,
  PreviewUpdateUsageLimitInterval$outboundSchema,
  PreviewUpdateUsageLineItem$inboundSchema,
  PreviewUpdateUsageLineItemPeriod$inboundSchema,
  ProcessorType,
  ProcessorType$inboundSchema,
  Processors$inboundSchema,
  ProductDisplay1$inboundSchema,
  ProductDisplay2$inboundSchema,
  ProductScenario1,
  ProductScenario1$inboundSchema,
  ProductScenario2,
  ProductScenario2$inboundSchema,
  ProductType1,
  ProductType1$inboundSchema,
  ProductType2,
  ProductType2$inboundSchema,
  Properties1$inboundSchema,
  Properties2$inboundSchema,
  Purchase$inboundSchema,
  PurchaseScope,
  PurchaseScope$inboundSchema,
  Range,
  Range$outboundSchema,
  RedeemReferralCodeParams$outboundSchema,
  RedeemReferralCodeResponse$inboundSchema,
  RedeemRewardCodeParams$outboundSchema,
  RedeemRewardCodeResponse$inboundSchema,
  Referral$inboundSchema,
  ReferralCustomer$inboundSchema,
  RefreshKeyResponse$inboundSchema,
  RequestAbortedError,
  RequestBody$outboundSchema,
  RequestTimeoutError,
  ResponseValidationError,
  Result$inboundSchema,
  Revenuecat$inboundSchema,
  RevokeKeyParams$outboundSchema,
  RevokeKeyResponse$inboundSchema,
  Rewards$inboundSchema,
  SDKValidationError,
  SDK_METADATA,
  Scenario1,
  Scenario1$inboundSchema,
  Scenario2,
  Scenario2$inboundSchema,
  ServerList,
  SetupPaymentAddItemBillingMethod,
  SetupPaymentAddItemBillingMethod$outboundSchema,
  SetupPaymentAddItemExpiryDurationType,
  SetupPaymentAddItemExpiryDurationType$outboundSchema,
  SetupPaymentAddItemOnDecrease,
  SetupPaymentAddItemOnDecrease$outboundSchema,
  SetupPaymentAddItemOnIncrease,
  SetupPaymentAddItemOnIncrease$outboundSchema,
  SetupPaymentAddItemPlanItem$outboundSchema,
  SetupPaymentAddItemPrice$outboundSchema,
  SetupPaymentAddItemPriceInterval,
  SetupPaymentAddItemPriceInterval$outboundSchema,
  SetupPaymentAddItemProration$outboundSchema,
  SetupPaymentAddItemReset$outboundSchema,
  SetupPaymentAddItemResetInterval,
  SetupPaymentAddItemResetInterval$outboundSchema,
  SetupPaymentAddItemRollover$outboundSchema,
  SetupPaymentAddItemTier$outboundSchema,
  SetupPaymentAddItemTierBehavior,
  SetupPaymentAddItemTierBehavior$outboundSchema,
  SetupPaymentAttachDiscount$outboundSchema,
  SetupPaymentAutoTopup$outboundSchema,
  SetupPaymentBasePrice$outboundSchema,
  SetupPaymentBillingControls$outboundSchema,
  SetupPaymentCarryOverBalances$outboundSchema,
  SetupPaymentCarryOverUsages$outboundSchema,
  SetupPaymentCustomLineItem$outboundSchema,
  SetupPaymentCustomize$outboundSchema,
  SetupPaymentDurationType,
  SetupPaymentDurationType$outboundSchema,
  SetupPaymentFeatureQuantity$outboundSchema,
  SetupPaymentFreeTrialParams$outboundSchema,
  SetupPaymentIntervalRemoveItemEnum1,
  SetupPaymentIntervalRemoveItemEnum1$outboundSchema,
  SetupPaymentIntervalRemoveItemEnum2,
  SetupPaymentIntervalRemoveItemEnum2$outboundSchema,
  SetupPaymentItemBillingMethod,
  SetupPaymentItemBillingMethod$outboundSchema,
  SetupPaymentItemExpiryDurationType,
  SetupPaymentItemExpiryDurationType$outboundSchema,
  SetupPaymentItemOnDecrease,
  SetupPaymentItemOnDecrease$outboundSchema,
  SetupPaymentItemOnIncrease,
  SetupPaymentItemOnIncrease$outboundSchema,
  SetupPaymentItemPlanItem$outboundSchema,
  SetupPaymentItemPrice$outboundSchema,
  SetupPaymentItemPriceInterval,
  SetupPaymentItemPriceInterval$outboundSchema,
  SetupPaymentItemProration$outboundSchema,
  SetupPaymentItemReset$outboundSchema,
  SetupPaymentItemResetInterval,
  SetupPaymentItemResetInterval$outboundSchema,
  SetupPaymentItemRollover$outboundSchema,
  SetupPaymentItemTier$outboundSchema,
  SetupPaymentItemTierBehavior,
  SetupPaymentItemTierBehavior$outboundSchema,
  SetupPaymentLimitType,
  SetupPaymentLimitType$outboundSchema,
  SetupPaymentOnEnd,
  SetupPaymentOnEnd$outboundSchema,
  SetupPaymentOverageAllowed$outboundSchema,
  SetupPaymentParams$outboundSchema,
  SetupPaymentPlanItemFilter$outboundSchema,
  SetupPaymentPriceInterval,
  SetupPaymentPriceInterval$outboundSchema,
  SetupPaymentProrationBehavior,
  SetupPaymentProrationBehavior$outboundSchema,
  SetupPaymentPurchaseLimit$outboundSchema,
  SetupPaymentPurchaseLimitInterval,
  SetupPaymentPurchaseLimitInterval$outboundSchema,
  SetupPaymentRemoveItemBillingMethod,
  SetupPaymentRemoveItemBillingMethod$outboundSchema,
  SetupPaymentResponse$inboundSchema,
  SetupPaymentSpendLimit$outboundSchema,
  SetupPaymentThresholdType,
  SetupPaymentThresholdType$outboundSchema,
  SetupPaymentUsageAlert$outboundSchema,
  SetupPaymentUsageLimit$outboundSchema,
  SetupPaymentUsageLimitInterval,
  SetupPaymentUsageLimitInterval$outboundSchema,
  StartingAfter2$outboundSchema,
  StorePush,
  StorePush$inboundSchema,
  Stripe$inboundSchema,
  Subscription$inboundSchema,
  SubscriptionScope,
  SubscriptionScope$inboundSchema,
  SyncRevenueCatApp$inboundSchema,
  SyncRevenueCatEnv,
  SyncRevenueCatEnv$outboundSchema,
  SyncRevenueCatParams$outboundSchema,
  SyncRevenueCatPrice,
  SyncRevenueCatPrice$inboundSchema,
  SyncRevenueCatProduct,
  SyncRevenueCatProduct$inboundSchema,
  SyncRevenueCatResponse$inboundSchema,
  SyncRevenueCatStatus,
  SyncRevenueCatStatus$inboundSchema,
  Total$inboundSchema,
  TrackDeduction1$inboundSchema,
  TrackDeduction2$inboundSchema,
  TrackIntervalEnum1,
  TrackIntervalEnum1$inboundSchema,
  TrackIntervalEnum2,
  TrackIntervalEnum2$inboundSchema,
  TrackLock$outboundSchema,
  TrackParams$outboundSchema,
  TrackReset1$inboundSchema,
  TrackReset2$inboundSchema,
  TrackResponse$inboundSchema,
  TrackResponseBody1$inboundSchema,
  TrackResponseBody2$inboundSchema,
  TrackTokensDeduction1$inboundSchema,
  TrackTokensDeduction2$inboundSchema,
  TrackTokensIntervalEnum1,
  TrackTokensIntervalEnum1$inboundSchema,
  TrackTokensIntervalEnum2,
  TrackTokensIntervalEnum2$inboundSchema,
  TrackTokensParams$outboundSchema,
  TrackTokensReset1$inboundSchema,
  TrackTokensReset2$inboundSchema,
  TrackTokensResponse$inboundSchema,
  TrackTokensResponseBody1$inboundSchema,
  TrackTokensResponseBody2$inboundSchema,
  TrialsUsed$inboundSchema,
  UnexpectedClientError,
  UpdateBalanceInterval,
  UpdateBalanceInterval$outboundSchema,
  UpdateBalanceParams$outboundSchema,
  UpdateBalanceResponse$inboundSchema,
  UpdateCustomerAutoTopupRequest$outboundSchema,
  UpdateCustomerAutoTopupResponse$inboundSchema,
  UpdateCustomerBillingControlsRequest$outboundSchema,
  UpdateCustomerBillingControlsResponse$inboundSchema,
  UpdateCustomerConfigRequest$outboundSchema,
  UpdateCustomerConfigResponse$inboundSchema,
  UpdateCustomerCreditSchema$inboundSchema,
  UpdateCustomerDisplay$inboundSchema,
  UpdateCustomerEnv,
  UpdateCustomerEnv$inboundSchema,
  UpdateCustomerFeature$inboundSchema,
  UpdateCustomerFlags$inboundSchema,
  UpdateCustomerLimitTypeRequestBody,
  UpdateCustomerLimitTypeRequestBody$outboundSchema,
  UpdateCustomerLimitTypeResponse,
  UpdateCustomerLimitTypeResponse$inboundSchema,
  UpdateCustomerModelMarkups$inboundSchema,
  UpdateCustomerOverageAllowedRequest$outboundSchema,
  UpdateCustomerOverageAllowedResponse$inboundSchema,
  UpdateCustomerParams$outboundSchema,
  UpdateCustomerProcessors$inboundSchema,
  UpdateCustomerProviderMarkups$inboundSchema,
  UpdateCustomerPurchase$inboundSchema,
  UpdateCustomerPurchaseLimitIntervalRequestBody,
  UpdateCustomerPurchaseLimitIntervalRequestBody$outboundSchema,
  UpdateCustomerPurchaseLimitIntervalResponse1,
  UpdateCustomerPurchaseLimitIntervalResponse1$inboundSchema,
  UpdateCustomerPurchaseLimitIntervalResponse2,
  UpdateCustomerPurchaseLimitIntervalResponse2$inboundSchema,
  UpdateCustomerPurchaseLimitRequest$outboundSchema,
  UpdateCustomerPurchaseLimitResponse1$inboundSchema,
  UpdateCustomerPurchaseLimitResponse2$inboundSchema,
  UpdateCustomerPurchaseScope,
  UpdateCustomerPurchaseScope$inboundSchema,
  UpdateCustomerResponse$inboundSchema,
  UpdateCustomerRevenuecat$inboundSchema,
  UpdateCustomerSpendLimitRequest$outboundSchema,
  UpdateCustomerSpendLimitResponse$inboundSchema,
  UpdateCustomerStatus,
  UpdateCustomerStatus$inboundSchema,
  UpdateCustomerStripe$inboundSchema,
  UpdateCustomerSubscription$inboundSchema,
  UpdateCustomerSubscriptionScope,
  UpdateCustomerSubscriptionScope$inboundSchema,
  UpdateCustomerThresholdTypeRequestBody,
  UpdateCustomerThresholdTypeRequestBody$outboundSchema,
  UpdateCustomerThresholdTypeResponse,
  UpdateCustomerThresholdTypeResponse$inboundSchema,
  UpdateCustomerType,
  UpdateCustomerType$inboundSchema,
  UpdateCustomerUsageAlertRequestBody$outboundSchema,
  UpdateCustomerUsageAlertResponse$inboundSchema,
  UpdateCustomerUsageLimitIntervalRequestBody,
  UpdateCustomerUsageLimitIntervalRequestBody$outboundSchema,
  UpdateCustomerUsageLimitIntervalResponse,
  UpdateCustomerUsageLimitIntervalResponse$inboundSchema,
  UpdateCustomerUsageLimitRequest$outboundSchema,
  UpdateCustomerUsageLimitResponse$inboundSchema,
  UpdateCustomerVercel$inboundSchema,
  UpdateEntityBillingControlsRequest$outboundSchema,
  UpdateEntityBillingControlsResponse$inboundSchema,
  UpdateEntityCreditSchema$inboundSchema,
  UpdateEntityDisplay$inboundSchema,
  UpdateEntityEnv,
  UpdateEntityEnv$inboundSchema,
  UpdateEntityFeature$inboundSchema,
  UpdateEntityFlags$inboundSchema,
  UpdateEntityIntervalRequestBody,
  UpdateEntityIntervalRequestBody$outboundSchema,
  UpdateEntityIntervalResponse,
  UpdateEntityIntervalResponse$inboundSchema,
  UpdateEntityInvoice$inboundSchema,
  UpdateEntityLimitTypeRequestBody,
  UpdateEntityLimitTypeRequestBody$outboundSchema,
  UpdateEntityLimitTypeResponse,
  UpdateEntityLimitTypeResponse$inboundSchema,
  UpdateEntityModelMarkups$inboundSchema,
  UpdateEntityOverageAllowedRequest$outboundSchema,
  UpdateEntityOverageAllowedResponse$inboundSchema,
  UpdateEntityParams$outboundSchema,
  UpdateEntityProcessorType,
  UpdateEntityProcessorType$inboundSchema,
  UpdateEntityProviderMarkups$inboundSchema,
  UpdateEntityPurchase$inboundSchema,
  UpdateEntityPurchaseScope,
  UpdateEntityPurchaseScope$inboundSchema,
  UpdateEntityResponse$inboundSchema,
  UpdateEntitySpendLimitRequest$outboundSchema,
  UpdateEntitySpendLimitResponse$inboundSchema,
  UpdateEntityStatus,
  UpdateEntityStatus$inboundSchema,
  UpdateEntitySubscription$inboundSchema,
  UpdateEntitySubscriptionScope,
  UpdateEntitySubscriptionScope$inboundSchema,
  UpdateEntityThresholdTypeRequestBody,
  UpdateEntityThresholdTypeRequestBody$outboundSchema,
  UpdateEntityThresholdTypeResponse,
  UpdateEntityThresholdTypeResponse$inboundSchema,
  UpdateEntityType,
  UpdateEntityType$inboundSchema,
  UpdateEntityUsageAlertRequestBody$outboundSchema,
  UpdateEntityUsageAlertResponse$inboundSchema,
  UpdateEntityUsageLimitRequest$outboundSchema,
  UpdateEntityUsageLimitResponse$inboundSchema,
  UpdateFeatureCreditSchemaRequestBody$outboundSchema,
  UpdateFeatureCreditSchemaResponse$inboundSchema,
  UpdateFeatureDisplayRequestBody$outboundSchema,
  UpdateFeatureDisplayResponse$inboundSchema,
  UpdateFeatureModelMarkupsRequest$outboundSchema,
  UpdateFeatureModelMarkupsResponse$inboundSchema,
  UpdateFeatureParams$outboundSchema,
  UpdateFeatureProviderMarkupsRequest$outboundSchema,
  UpdateFeatureProviderMarkupsResponse$inboundSchema,
  UpdateFeatureResponse$inboundSchema,
  UpdateFeatureTypeRequestBody,
  UpdateFeatureTypeRequestBody$outboundSchema,
  UpdateFeatureTypeResponse,
  UpdateFeatureTypeResponse$inboundSchema,
  UpdatePlanAttachAction,
  UpdatePlanAttachAction$inboundSchema,
  UpdatePlanAutoTopupRequest$outboundSchema,
  UpdatePlanAutoTopupResponse$inboundSchema,
  UpdatePlanBasePrice$outboundSchema,
  UpdatePlanBillingControlsRequest$outboundSchema,
  UpdatePlanBillingControlsResponse$inboundSchema,
  UpdatePlanBillingMethodRequestBody,
  UpdatePlanBillingMethodRequestBody$outboundSchema,
  UpdatePlanBillingMethodResponse,
  UpdatePlanBillingMethodResponse$inboundSchema,
  UpdatePlanConfigRequest$outboundSchema,
  UpdatePlanConfigResponse$inboundSchema,
  UpdatePlanCreditSchema$inboundSchema,
  UpdatePlanCustomerEligibility$inboundSchema,
  UpdatePlanDurationTypeRequest,
  UpdatePlanDurationTypeRequest$outboundSchema,
  UpdatePlanDurationTypeResponse,
  UpdatePlanDurationTypeResponse$inboundSchema,
  UpdatePlanEnv,
  UpdatePlanEnv$inboundSchema,
  UpdatePlanExpiryDurationTypeRequestBody,
  UpdatePlanExpiryDurationTypeRequestBody$outboundSchema,
  UpdatePlanExpiryDurationTypeResponse,
  UpdatePlanExpiryDurationTypeResponse$inboundSchema,
  UpdatePlanFeature$inboundSchema,
  UpdatePlanFeatureDisplay$inboundSchema,
  UpdatePlanFreeTrial$inboundSchema,
  UpdatePlanFreeTrialParams$outboundSchema,
  UpdatePlanItem$inboundSchema,
  UpdatePlanItemDisplay$inboundSchema,
  UpdatePlanItemPriceIntervalRequestBody,
  UpdatePlanItemPriceIntervalRequestBody$outboundSchema,
  UpdatePlanItemPriceResponse$inboundSchema,
  UpdatePlanLimitTypeRequestBody,
  UpdatePlanLimitTypeRequestBody$outboundSchema,
  UpdatePlanLimitTypeResponse,
  UpdatePlanLimitTypeResponse$inboundSchema,
  UpdatePlanOnDecrease,
  UpdatePlanOnDecrease$outboundSchema,
  UpdatePlanOnEndRequest,
  UpdatePlanOnEndRequest$outboundSchema,
  UpdatePlanOnEndResponse,
  UpdatePlanOnEndResponse$inboundSchema,
  UpdatePlanOnIncrease,
  UpdatePlanOnIncrease$outboundSchema,
  UpdatePlanOverageAllowedRequest$outboundSchema,
  UpdatePlanOverageAllowedResponse$inboundSchema,
  UpdatePlanParams$outboundSchema,
  UpdatePlanPlanItem$outboundSchema,
  UpdatePlanPriceDisplay$inboundSchema,
  UpdatePlanPriceIntervalRequestBody,
  UpdatePlanPriceIntervalRequestBody$outboundSchema,
  UpdatePlanPriceIntervalResponse,
  UpdatePlanPriceIntervalResponse$inboundSchema,
  UpdatePlanPriceItemIntervalResponse,
  UpdatePlanPriceItemIntervalResponse$inboundSchema,
  UpdatePlanPriceRequestBody$outboundSchema,
  UpdatePlanPriceResponse$inboundSchema,
  UpdatePlanProration$outboundSchema,
  UpdatePlanPurchaseLimitIntervalRequestBody,
  UpdatePlanPurchaseLimitIntervalRequestBody$outboundSchema,
  UpdatePlanPurchaseLimitIntervalResponse,
  UpdatePlanPurchaseLimitIntervalResponse$inboundSchema,
  UpdatePlanPurchaseLimitRequest$outboundSchema,
  UpdatePlanPurchaseLimitResponse$inboundSchema,
  UpdatePlanResetIntervalRequestBody,
  UpdatePlanResetIntervalRequestBody$outboundSchema,
  UpdatePlanResetIntervalResponse,
  UpdatePlanResetIntervalResponse$inboundSchema,
  UpdatePlanResetRequestBody$outboundSchema,
  UpdatePlanResetResponse$inboundSchema,
  UpdatePlanResponse$inboundSchema,
  UpdatePlanRolloverRequestBody$outboundSchema,
  UpdatePlanRolloverResponse$inboundSchema,
  UpdatePlanSpendLimitRequest$outboundSchema,
  UpdatePlanSpendLimitResponse$inboundSchema,
  UpdatePlanStatus,
  UpdatePlanStatus$inboundSchema,
  UpdatePlanThresholdTypeRequestBody,
  UpdatePlanThresholdTypeRequestBody$outboundSchema,
  UpdatePlanThresholdTypeResponse,
  UpdatePlanThresholdTypeResponse$inboundSchema,
  UpdatePlanTierBehaviorRequestBody,
  UpdatePlanTierBehaviorRequestBody$outboundSchema,
  UpdatePlanTierBehaviorResponse,
  UpdatePlanTierBehaviorResponse$inboundSchema,
  UpdatePlanTierRequestBody$outboundSchema,
  UpdatePlanTierResponse$inboundSchema,
  UpdatePlanType,
  UpdatePlanType$inboundSchema,
  UpdatePlanUsageAlertRequestBody$outboundSchema,
  UpdatePlanUsageAlertResponse$inboundSchema,
  UpdatePlanUsageLimitIntervalRequestBody,
  UpdatePlanUsageLimitIntervalRequestBody$outboundSchema,
  UpdatePlanUsageLimitIntervalResponse,
  UpdatePlanUsageLimitIntervalResponse$inboundSchema,
  UpdatePlanUsageLimitRequest$outboundSchema,
  UpdatePlanUsageLimitResponse$inboundSchema,
  UpdateSubscriptionParams$outboundSchema,
  UsageModel1,
  UsageModel1$inboundSchema,
  UsageModel2,
  UsageModel2$inboundSchema,
  Vercel$inboundSchema,
  files_exports as files,
  formatZodError,
  serverURLFromOptions,
  types_exports as types
};
