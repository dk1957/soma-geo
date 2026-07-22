import { c1 as isInternalJsStubProp, aM as reactExports, c2 as camelCaseToKebabCase, c3 as EventSourceParserStream, c4 as InvalidArgumentError, c5 as TypeValidationError, c6 as JSONParseError, c7 as safeParseAsync, c8 as toJSONSchema, c9 as ZodFirstPartyTypeKind, ca as AISDKError, au as union, H as string, cb as _instanceof, cc as custom, cd as lazy, ce as _null, Y as number, a4 as boolean, aj as record, a3 as array$1, G as object$1, a5 as literal, cf as unknown, av as discriminatedUnion, cg as strictObject, a2 as _enum, ch as getDefaultExportFromCjs, aN as jsxRuntimeExports, bQ as FREE_ONBOARDING_QUESTION_LIMIT } from "./index-CSpjggkr.js";
import { b as Markdown } from "./Markdown-Cup334nZ.js";
import { P as Pencil } from "./pencil-IZdwj4v7.js";
import { q as createLucideIcon, a_ as LoaderCircle, K as ChevronRight, bc as ArrowUp } from "./router-8qflvY1T.js";
import { T as TriangleAlert } from "./triangle-alert-CtV7H1mP.js";
import { C as Check } from "./check-C_HETtUw.js";
import { C as Copy } from "./copy-DgxzPDJt.js";
import { G as Globe } from "./globe-xsi-TwrE.js";
import { S as Sparkles } from "./sparkles-D0nOSwIL.js";
const __iconNode = [
  ["path", { d: "M9 14 4 9l5-5", key: "102s5s" }],
  ["path", { d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11", key: "f3b9sd" }]
];
const Undo2 = createLucideIcon("undo-2", __iconNode);
if (!globalThis.EventTarget || !globalThis.Event)
  console.error(`
  PartySocket requires a global 'EventTarget' class to be available!
  You can polyfill this global by adding this to your code before any partysocket imports: 
  
  \`\`\`
  import 'partysocket/event-target-polyfill';
  \`\`\`
  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.
`);
var ErrorEvent = class extends Event {
  message;
  error;
  constructor(error, target) {
    super("error", target);
    this.message = error.message;
    this.error = error;
  }
};
var CloseEvent = class extends Event {
  code;
  reason;
  wasClean = true;
  constructor(code = 1e3, reason = "", target) {
    super("close", target);
    this.code = code;
    this.reason = reason;
  }
};
const Events = {
  Event,
  ErrorEvent,
  CloseEvent
};
function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}
function cloneEventBrowser(e) {
  return new e.constructor(e.type, e);
}
function cloneEventNode(e) {
  if ("data" in e) return new MessageEvent(e.type, e);
  if ("code" in e || "reason" in e)
    return new CloseEvent(e.code || 1999, e.reason || "unknown reason", e);
  if ("error" in e) return new ErrorEvent(e.error, e);
  return new Event(e.type, e);
}
const isNode = typeof process !== "undefined" && typeof process.versions?.node !== "undefined";
const isReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";
const cloneEvent = isNode || isReactNative ? cloneEventNode : cloneEventBrowser;
const DEFAULT = {
  maxReconnectionDelay: 1e4,
  minReconnectionDelay: 3e3,
  minUptime: 5e3,
  reconnectionDelayGrowFactor: 1.3,
  connectionTimeout: 4e3,
  maxRetries: Number.POSITIVE_INFINITY,
  maxEnqueuedMessages: Number.POSITIVE_INFINITY
};
let didWarnAboutMissingWebSocket = false;
function absorbError() {
}
var ReconnectingWebSocket = class ReconnectingWebSocket2 extends EventTarget {
  _ws;
  _retryCount = -1;
  _uptimeTimeout;
  _connectTimeout;
  _shouldReconnect = true;
  _connectLock = false;
  _binaryType = "blob";
  _closeCalled = false;
  _didWarnAboutClosedSend = false;
  _messageQueue = [];
  _debugLogger = console.log.bind(console);
  _url;
  _protocols;
  _options;
  constructor(url, protocols, options = {}) {
    super();
    this._url = url;
    this._protocols = protocols;
    this._options = options;
    if (this._options.startClosed) this._shouldReconnect = false;
    if (this._options.debugLogger)
      this._debugLogger = this._options.debugLogger;
    this._connect();
  }
  static get CONNECTING() {
    return 0;
  }
  static get OPEN() {
    return 1;
  }
  static get CLOSING() {
    return 2;
  }
  static get CLOSED() {
    return 3;
  }
  get CONNECTING() {
    return ReconnectingWebSocket2.CONNECTING;
  }
  get OPEN() {
    return ReconnectingWebSocket2.OPEN;
  }
  get CLOSING() {
    return ReconnectingWebSocket2.CLOSING;
  }
  get CLOSED() {
    return ReconnectingWebSocket2.CLOSED;
  }
  get binaryType() {
    return this._ws ? this._ws.binaryType : this._binaryType;
  }
  set binaryType(value) {
    this._binaryType = value;
    if (this._ws) this._ws.binaryType = value;
  }
  /**
   * Returns the number or connection retries
   */
  get retryCount() {
    return Math.max(this._retryCount, 0);
  }
  /**
   * The number of bytes of data that have been queued using calls to send() but not yet
   * transmitted to the network. This value resets to zero once all queued data has been sent.
   * This value does not reset to zero when the connection is closed; if you keep calling send(),
   * this will continue to climb. Read only
   */
  get bufferedAmount() {
    return this._messageQueue.reduce((acc, message) => {
      if (typeof message === "string") acc += message.length;
      else if (message instanceof Blob) acc += message.size;
      else acc += message.byteLength;
      return acc;
    }, 0) + (this._ws ? this._ws.bufferedAmount : 0);
  }
  /**
   * The extensions selected by the server. This is currently only the empty string or a list of
   * extensions as negotiated by the connection
   */
  get extensions() {
    return this._ws ? this._ws.extensions : "";
  }
  /**
   * A string indicating the name of the sub-protocol the server selected;
   * this will be one of the strings specified in the protocols parameter when creating the
   * WebSocket object
   */
  get protocol() {
    return this._ws ? this._ws.protocol : "";
  }
  /**
   * The current state of the connection; this is one of the Ready state constants
   */
  get readyState() {
    if (this._closeCalled) return ReconnectingWebSocket2.CLOSED;
    if (this._ws) return this._ws.readyState;
    return this._options.startClosed ? ReconnectingWebSocket2.CLOSED : ReconnectingWebSocket2.CONNECTING;
  }
  /**
   * The URL as resolved by the constructor
   */
  get url() {
    return this._ws ? this._ws.url : "";
  }
  /**
   * Whether the websocket object is now in reconnectable state
   */
  get shouldReconnect() {
    return this._shouldReconnect;
  }
  /**
   * An event listener to be called when the WebSocket connection's readyState changes to CLOSED
   */
  onclose = null;
  /**
   * An event listener to be called when an error occurs
   */
  onerror = null;
  /**
   * An event listener to be called when a message is received from the server
   */
  onmessage = null;
  /**
   * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
   * this indicates that the connection is ready to send and receive data
   */
  onopen = null;
  /**
   * Closes the WebSocket connection or connection attempt, if any. If the connection is already
   * CLOSED or CLOSING, this method does nothing.
   *
   * The `close` event is dispatched synchronously (mirroring how
   * `reconnect()` dispatches its synthetic close). This guarantees
   * consumers observe a terminal event for every explicit close, even
   * if their listeners are detached right after this call — previously
   * the real (asynchronous) browser close event could fire after
   * listeners were removed and go unobserved entirely.
   */
  close(code = 1e3, reason) {
    this._closeCalled = true;
    this._shouldReconnect = false;
    this._clearTimeouts();
    if (!this._ws) {
      this._debug("close enqueued: no ws instance");
      return;
    }
    if (this._ws.readyState === this.CLOSED || this._ws.readyState === this.CLOSING) {
      this._debug("close: already closing or closed");
      return;
    }
    this._disconnect(code, reason);
  }
  /**
   * Closes the WebSocket connection or connection attempt and connects again.
   * Resets retry counter;
   */
  reconnect(code, reason) {
    this._shouldReconnect = true;
    this._closeCalled = false;
    this._didWarnAboutClosedSend = false;
    this._retryCount = -1;
    if (!this._ws || this._ws.readyState === this.CLOSED || this._ws.readyState === this.CLOSING)
      this._connect();
    else {
      this._disconnect(code, reason);
      this._connect();
    }
  }
  /**
   * Enqueue specified data to be transmitted to the server over the WebSocket connection.
   *
   * @returns `true` if the message was transmitted immediately over an open
   * connection; `false` if it was buffered (sent when the connection next
   * opens — the buffer is always flushed before the `open` event is
   * dispatched) or dropped because `maxEnqueuedMessages` was reached.
   */
  send(data) {
    if (this._ws && this._ws.readyState === this.OPEN) {
      this._debug("send", data);
      this._ws.send(data);
      return true;
    }
    if (this._closeCalled && !this._didWarnAboutClosedSend) {
      this._didWarnAboutClosedSend = true;
      console.warn(
        "ReconnectingWebSocket: send() was called after close(). The message has been buffered, but it will only be delivered if reconnect() is called on this socket. If this socket has been discarded, the message is lost — this usually means a stale socket reference is being used."
      );
    }
    const { maxEnqueuedMessages = DEFAULT.maxEnqueuedMessages } = this._options;
    if (this._messageQueue.length < maxEnqueuedMessages) {
      this._debug("enqueue", data);
      this._messageQueue.push(data);
    }
    return false;
  }
  /**
   * Removes and returns all messages that were passed to send() but never
   * transmitted (they were buffered while the connection wasn't open).
   *
   * Useful when a socket is being discarded and replaced (e.g. the React
   * hooks recreate the socket when connection options change): the
   * replacement socket can re-send these messages, instead of them being
   * silently lost with the old instance.
   */
  drainQueuedMessages() {
    const queue = this._messageQueue;
    this._messageQueue = [];
    return queue;
  }
  _debug(...args) {
    if (this._options.debug) this._debugLogger("RWS>", ...args);
  }
  _getNextDelay() {
    const {
      reconnectionDelayGrowFactor = DEFAULT.reconnectionDelayGrowFactor,
      minReconnectionDelay = DEFAULT.minReconnectionDelay,
      maxReconnectionDelay = DEFAULT.maxReconnectionDelay
    } = this._options;
    let delay = 0;
    if (this._retryCount > 0) {
      delay = minReconnectionDelay * reconnectionDelayGrowFactor ** (this._retryCount - 1);
      if (delay > maxReconnectionDelay) delay = maxReconnectionDelay;
    }
    this._debug("next delay", delay);
    return delay;
  }
  _wait() {
    return new Promise((resolve2) => {
      setTimeout(resolve2, this._getNextDelay());
    });
  }
  _getNextProtocols(protocolsProvider) {
    if (!protocolsProvider) return Promise.resolve(null);
    if (typeof protocolsProvider === "string" || Array.isArray(protocolsProvider))
      return Promise.resolve(protocolsProvider);
    if (typeof protocolsProvider === "function") {
      const protocols = protocolsProvider();
      if (!protocols) return Promise.resolve(null);
      if (typeof protocols === "string" || Array.isArray(protocols))
        return Promise.resolve(protocols);
      if (protocols.then) return protocols;
    }
    throw Error("Invalid protocols");
  }
  _getNextUrl(urlProvider) {
    if (typeof urlProvider === "string") return Promise.resolve(urlProvider);
    if (typeof urlProvider === "function") {
      const url = urlProvider();
      if (typeof url === "string") return Promise.resolve(url);
      if (url.then) return url;
    }
    throw Error("Invalid URL");
  }
  _connect() {
    if (this._connectLock || !this._shouldReconnect) return;
    this._connectLock = true;
    const {
      maxRetries = DEFAULT.maxRetries,
      connectionTimeout = DEFAULT.connectionTimeout
    } = this._options;
    if (this._retryCount >= maxRetries) {
      this._debug("max retries reached", this._retryCount, ">=", maxRetries);
      this._connectLock = false;
      return;
    }
    this._retryCount++;
    this._debug("connect", this._retryCount);
    this._removeListeners();
    this._wait().then(
      () => Promise.all([
        this._getNextUrl(this._url),
        this._getNextProtocols(this._protocols || null)
      ])
    ).then(([url, protocols]) => {
      if (this._closeCalled) {
        this._connectLock = false;
        return;
      }
      if (!this._options.WebSocket && typeof WebSocket === "undefined" && !didWarnAboutMissingWebSocket) {
        console.error(`‼️ No WebSocket implementation available. You should define options.WebSocket. 

For example, if you're using node.js, run \`npm install ws\`, and then in your code:

import PartySocket from 'partysocket';
import WS from 'ws';

const partysocket = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test-room",
  WebSocket: WS
});

`);
        didWarnAboutMissingWebSocket = true;
      }
      const WS = this._options.WebSocket || WebSocket;
      this._debug("connect", {
        url,
        protocols
      });
      this._ws = protocols ? new WS(url, protocols) : new WS(url);
      this._ws.binaryType = this._binaryType;
      this._connectLock = false;
      this._addListeners();
      this._connectTimeout = setTimeout(
        () => this._handleTimeout(),
        connectionTimeout
      );
    }).catch((err) => {
      this._connectLock = false;
      this._handleError(new Events.ErrorEvent(Error(err.message), this));
    });
  }
  _handleTimeout() {
    this._debug("timeout event");
    this._handleError(new Events.ErrorEvent(Error("TIMEOUT"), this));
  }
  _disconnect(code = 1e3, reason) {
    this._clearTimeouts();
    if (!this._ws) return;
    this._removeListeners();
    try {
      if (this._ws.readyState === this.OPEN || this._ws.readyState === this.CONNECTING)
        this._ws.close(code, reason);
      this._handleClose(new Events.CloseEvent(code, reason, this));
    } catch (_error2) {
    }
  }
  _acceptOpen() {
    this._debug("accept open");
    this._retryCount = 0;
  }
  _handleOpen = (event) => {
    this._debug("open event");
    const { minUptime = DEFAULT.minUptime } = this._options;
    clearTimeout(this._connectTimeout);
    this._uptimeTimeout = setTimeout(() => this._acceptOpen(), minUptime);
    assert(this._ws, "WebSocket is not defined");
    this._ws.binaryType = this._binaryType;
    this._messageQueue.forEach((message) => {
      this._ws?.send(message);
    });
    this._messageQueue = [];
    if (this.onopen) this.onopen(event);
    this.dispatchEvent(cloneEvent(event));
  };
  _handleMessage = (event) => {
    this._debug("message event");
    if (this.onmessage) this.onmessage(event);
    this.dispatchEvent(cloneEvent(event));
  };
  _handleError = (event) => {
    this._debug("error event", event.message);
    this._disconnect(void 0, event.message === "TIMEOUT" ? "timeout" : void 0);
    if (this.onerror) this.onerror(event);
    this._debug("exec error listeners");
    this.dispatchEvent(cloneEvent(event));
    this._connect();
  };
  _handleClose = (event) => {
    this._debug("close event");
    this._clearTimeouts();
    if (this._options.shouldReconnectOnClose && !this._options.shouldReconnectOnClose(event))
      this._shouldReconnect = false;
    if (this._shouldReconnect) this._connect();
    if (this.onclose) this.onclose(event);
    this.dispatchEvent(cloneEvent(event));
  };
  _removeListeners() {
    if (!this._ws) return;
    this._debug("removeListeners");
    this._ws.removeEventListener("open", this._handleOpen);
    this._ws.removeEventListener("close", this._handleClose);
    this._ws.removeEventListener("message", this._handleMessage);
    this._ws.removeEventListener("error", this._handleError);
    this._ws.addEventListener("error", absorbError);
  }
  _addListeners() {
    if (!this._ws) return;
    this._debug("addListeners");
    this._ws.addEventListener("open", this._handleOpen);
    this._ws.addEventListener("close", this._handleClose);
    this._ws.addEventListener("message", this._handleMessage);
    this._ws.addEventListener("error", this._handleError);
  }
  _clearTimeouts() {
    clearTimeout(this._connectTimeout);
    clearTimeout(this._uptimeTimeout);
  }
};
const valueIsNotNil = (keyValuePair) => keyValuePair[1] !== null && keyValuePair[1] !== void 0;
function generateUUID() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  let d = Date.now();
  let d2 = performance?.now && performance.now() * 1e3 || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : r & 3 | 8).toString(16);
  });
}
function getPartyInfo(partySocketOptions, defaultProtocol, defaultParams = {}) {
  const {
    host: rawHost,
    path: rawPath,
    protocol: rawProtocol,
    room,
    party,
    basePath,
    prefix,
    query
  } = partySocketOptions;
  let host = rawHost.replace(/^(http|https|ws|wss):\/\//, "");
  if (host.endsWith("/")) host = host.slice(0, -1);
  if (rawPath?.startsWith("/"))
    throw new Error("path must not start with a slash");
  const name = party ?? "main";
  const path = rawPath ? `/${rawPath}` : "";
  const protocol = rawProtocol || (host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.") && host.split(".")[1] >= "16" && host.split(".")[1] <= "31" || host.startsWith("[::ffff:7f00:1]:") ? defaultProtocol : `${defaultProtocol}s`);
  const baseUrl = `${protocol}://${host}/${basePath || `${prefix || "parties"}/${name}/${room}`}${path}`;
  const makeUrl = (query2 = {}) => `${baseUrl}?${new URLSearchParams([...Object.entries(defaultParams), ...Object.entries(query2).filter(valueIsNotNil)])}`;
  const urlProvider = typeof query === "function" ? async () => makeUrl(await query()) : makeUrl(query);
  return {
    host,
    path,
    room,
    name,
    protocol,
    partyUrl: baseUrl,
    urlProvider
  };
}
var PartySocket = class extends ReconnectingWebSocket {
  _pk;
  _pkurl;
  name;
  room;
  host;
  path;
  basePath;
  constructor(partySocketOptions) {
    const wsOptions = getWSOptions(partySocketOptions);
    super(wsOptions.urlProvider, wsOptions.protocols, wsOptions.socketOptions);
    this.partySocketOptions = partySocketOptions;
    this.setWSProperties(wsOptions);
    if (!partySocketOptions.startClosed && !this.room && !this.basePath) {
      this.close();
      throw new Error(
        "Either room or basePath must be provided to connect. Use startClosed: true to create a socket and set them via updateProperties before calling reconnect()."
      );
    }
    if (!partySocketOptions.disableNameValidation) {
      if (partySocketOptions.party?.includes("/"))
        console.warn(
          `PartySocket: party name "${partySocketOptions.party}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`
        );
      if (partySocketOptions.room?.includes("/"))
        console.warn(
          `PartySocket: room name "${partySocketOptions.room}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`
        );
    }
  }
  updateProperties(partySocketOptions) {
    const wsOptions = getWSOptions({
      ...this.partySocketOptions,
      ...partySocketOptions,
      host: partySocketOptions.host ?? this.host,
      room: partySocketOptions.room ?? this.room,
      path: partySocketOptions.path ?? this.path,
      basePath: partySocketOptions.basePath ?? this.basePath
    });
    this._url = wsOptions.urlProvider;
    this._protocols = wsOptions.protocols;
    this._options = wsOptions.socketOptions;
    this.setWSProperties(wsOptions);
  }
  setWSProperties(wsOptions) {
    const { _pk, _pkurl, name, room, host, path, basePath } = wsOptions;
    this._pk = _pk;
    this._pkurl = _pkurl;
    this.name = name;
    this.room = room;
    this.host = host;
    this.path = path;
    this.basePath = basePath;
  }
  reconnect(code, reason) {
    if (!this.host)
      throw new Error(
        "The host must be set before connecting, use `updateProperties` method to set it or pass it to the constructor."
      );
    if (!this.room && !this.basePath)
      throw new Error(
        "The room (or basePath) must be set before connecting, use `updateProperties` method to set it or pass it to the constructor."
      );
    super.reconnect(code, reason);
  }
  get id() {
    return this._pk;
  }
  /**
   * Exposes the static PartyKit room URL without applying query parameters.
   * To access the currently connected WebSocket url, use PartySocket#url.
   */
  get roomUrl() {
    return this._pkurl;
  }
  static async fetch(options, init) {
    const party = getPartyInfo(options, "http");
    const url = typeof party.urlProvider === "string" ? party.urlProvider : await party.urlProvider();
    return (options.fetch ?? fetch)(url, init);
  }
};
function getWSOptions(partySocketOptions) {
  const {
    id,
    host: _host,
    path: _path,
    party: _party,
    room: _room,
    protocol: _protocol,
    query: _query,
    protocols,
    ...socketOptions
  } = partySocketOptions;
  const _pk = id || generateUUID();
  const party = getPartyInfo(partySocketOptions, "ws", { _pk });
  return {
    _pk,
    _pkurl: party.partyUrl,
    name: party.name,
    room: party.room,
    host: party.host,
    path: party.path,
    basePath: partySocketOptions.basePath,
    protocols,
    socketOptions,
    urlProvider: party.urlProvider
  };
}
var AgentConnectionError = class extends Error {
  constructor(event) {
    const reason = event.reason || `WebSocket closed with code ${event.code}`;
    super(`Agent connection closed: ${reason}`);
    this.name = "AgentConnectionError";
    this.code = event.code;
    this.reason = event.reason;
    this.wasClean = event.wasClean;
  }
};
function isTerminalCloseEvent(event) {
  return event.code === 1008 || event.code >= 4e3 && event.code <= 4999;
}
function createStubProxy(call) {
  return new Proxy({}, { get: (_target, method) => {
    if (isInternalJsStubProp(method)) return;
    return (...args) => call(method, args);
  } });
}
const useAttachWebSocketEventHandlers = (socket, options) => {
  const handlersRef = reactExports.useRef(options);
  handlersRef.current = options;
  reactExports.useEffect(() => {
    const onOpen = (event) => handlersRef.current?.onOpen?.(event);
    const onMessage = (event) => handlersRef.current?.onMessage?.(event);
    const onClose = (event) => handlersRef.current?.onClose?.(event);
    const onError = (event) => handlersRef.current?.onError?.(event);
    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("error", onError);
    socket.addEventListener("message", onMessage);
    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("message", onMessage);
    };
  }, [socket]);
};
const getOptionsThatShouldCauseRestartWhenChanged = (options) => [
  options.startClosed,
  options.minUptime,
  options.maxRetries,
  options.connectionTimeout,
  options.maxEnqueuedMessages,
  options.maxReconnectionDelay,
  options.minReconnectionDelay,
  options.reconnectionDelayGrowFactor,
  options.debug
];
function useStableSocket({
  options,
  createSocket,
  createSocketMemoKey: createOptionsMemoKey,
  createSocketDestinationKey
}) {
  const { enabled = true } = options;
  const socketOptions = reactExports.useMemo(() => {
    return options;
  }, [createOptionsMemoKey(options)]);
  const [socket, setSocket] = reactExports.useState(
    () => createSocket({
      ...socketOptions,
      startClosed: true
    })
  );
  const socketInitializedRef = reactExports.useRef(null);
  const createSocketRef = reactExports.useRef(createSocket);
  createSocketRef.current = createSocket;
  const prevEnabledRef = reactExports.useRef(enabled);
  const prevSocketOptionsRef = reactExports.useRef(socketOptions);
  const optionsChangedWhileDisabledRef = reactExports.useRef(false);
  const socketCreatedWithOptionsRef = reactExports.useRef(socketOptions);
  const createReplacementSocket = (oldSocket) => {
    const newSocket = createSocketRef.current({
      ...socketOptions,
      startClosed: true
    });
    const queued = oldSocket.drainQueuedMessages();
    if (queued.length > 0) {
      const sameDestination = createSocketDestinationKey ? createSocketDestinationKey(socketCreatedWithOptionsRef.current) === createSocketDestinationKey(socketOptions) : false;
      if (socketOptions.transferEnqueuedMessages ?? sameDestination)
        for (const message of queued) newSocket.send(message);
      else
        console.warn(
          `PartySocket: discarded ${queued.length} buffered message(s) while replacing the socket, because the connection destination changed. Pass transferEnqueuedMessages: true to deliver buffered messages to the new destination instead.`
        );
    }
    socketCreatedWithOptionsRef.current = socketOptions;
    return newSocket;
  };
  const createReplacementSocketRef = reactExports.useRef(createReplacementSocket);
  createReplacementSocketRef.current = createReplacementSocket;
  reactExports.useEffect(() => {
    const optionsChanged = prevSocketOptionsRef.current !== socketOptions;
    prevSocketOptionsRef.current = socketOptions;
    if (!enabled) {
      socket.close();
      prevEnabledRef.current = enabled;
      if (optionsChanged) optionsChangedWhileDisabledRef.current = true;
      return () => {
        socket.close();
      };
    }
    if (!prevEnabledRef.current && enabled) {
      prevEnabledRef.current = enabled;
      const needsNewSocket = optionsChanged || optionsChangedWhileDisabledRef.current;
      optionsChangedWhileDisabledRef.current = false;
      if (!needsNewSocket) {
        socket.reconnect();
        return () => {
          socket.close();
        };
      }
      const newSocket = createReplacementSocketRef.current(socket);
      setSocket(newSocket);
      return () => {
        newSocket.close();
      };
    }
    prevEnabledRef.current = enabled;
    if (socketInitializedRef.current === socket)
      if (optionsChanged) {
        const newSocket = createReplacementSocketRef.current(socket);
        setSocket(newSocket);
        return () => {
          newSocket.close();
        };
      } else {
        if (socketOptions.startClosed !== true) socket.reconnect();
        return () => {
          socket.close();
        };
      }
    else {
      if (!socketInitializedRef.current) {
        if (socketOptions.startClosed !== true) socket.reconnect();
      } else if (socketInitializedRef.current !== socket) socket.reconnect();
      socketInitializedRef.current = socket;
      return () => {
        socket.close();
      };
    }
  }, [socket, socketOptions, enabled]);
  return socket;
}
function usePartySocket(options) {
  const { host, ...otherOptions } = options;
  const socket = useStableSocket({
    options: {
      host: host || (typeof window !== "undefined" ? window.location.host : "dummy-domain.com"),
      ...otherOptions
    },
    createSocket: (options2) => new PartySocket(options2),
    createSocketMemoKey: (options2) => JSON.stringify([
      options2.query,
      options2.id,
      options2.host,
      options2.room,
      options2.party,
      options2.path,
      options2.protocol,
      options2.protocols,
      options2.basePath,
      options2.prefix,
      ...getOptionsThatShouldCauseRestartWhenChanged(options2)
    ]),
    createSocketDestinationKey: (options2) => JSON.stringify([
      options2.host,
      options2.room,
      options2.party,
      options2.path,
      options2.protocol,
      options2.protocols,
      options2.basePath,
      options2.prefix
    ])
  });
  useAttachWebSocketEventHandlers(socket, options);
  return socket;
}
const queryCache = /* @__PURE__ */ new Map();
function createCacheKey(agentNamespace, name, subChainOrDeps, deps) {
  if (deps === void 0) return JSON.stringify([
    agentNamespace,
    name || "default",
    ...subChainOrDeps
  ]);
  const subChain = subChainOrDeps;
  if (subChain.length === 0) return JSON.stringify([
    agentNamespace,
    name || "default",
    ...deps
  ]);
  return JSON.stringify([
    agentNamespace,
    name || "default",
    subChain.map((s) => [s.agent, s.name]),
    ...deps
  ]);
}
function buildSubPath(subChain, extraPath) {
  if (subChain.length === 0) return extraPath ?? "";
  const combined = subChain.flatMap((step) => [
    "sub",
    camelCaseToKebabCase(step.agent),
    encodeURIComponent(step.name)
  ]).join("/");
  if (extraPath) return `${combined}/${extraPath.startsWith("/") ? extraPath.slice(1) : extraPath}`;
  return combined;
}
function getCacheEntry(key) {
  const entry = queryCache.get(key);
  if (!entry) return void 0;
  if (Date.now() >= entry.expiresAt) {
    queryCache.delete(key);
    return;
  }
  return entry;
}
function setCacheEntry(key, promise, cacheTtl) {
  const entry = {
    promise,
    expiresAt: Date.now() + cacheTtl
  };
  queryCache.set(key, entry);
  return entry;
}
function deleteCacheEntry(key) {
  queryCache.delete(key);
}
function useAgent(options) {
  const agentNamespace = camelCaseToKebabCase(options.agent);
  const { query, queryDeps, cacheTtl, sub: subOption, path: userPath, defaultCallTimeout, onConnectionError, shouldReconnectOnClose, ...restOptions } = options;
  const subChain = reactExports.useMemo(() => (subOption ?? []).map((s) => ({
    agent: s.agent,
    name: s.name
  })), [JSON.stringify(subOption ?? [])]);
  const leafAgent = subChain.length > 0 ? subChain[subChain.length - 1].agent : options.agent;
  const leafName = subChain.length > 0 ? subChain[subChain.length - 1].name : options.name || "default";
  const fullPath = reactExports.useMemo(() => [{
    agent: options.agent,
    name: options.name || "default"
  }, ...subChain], [
    options.agent,
    options.name,
    subChain
  ]);
  const pendingCallsRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const socketRef = reactExports.useRef(null);
  const defaultCallTimeoutRef = reactExports.useRef(defaultCallTimeout ?? 3e4);
  defaultCallTimeoutRef.current = defaultCallTimeout ?? 3e4;
  const rejectCallsSentOn = (socket, reason) => {
    const error = new Error(reason);
    for (const [id, pending] of pendingCallsRef.current) if (pending.sentOn === socket) {
      if (pending.timeoutId) clearTimeout(pending.timeoutId);
      pendingCallsRef.current.delete(id);
      pending.reject(error);
      pending.stream?.onError?.(reason);
    }
  };
  const flushQueuedCalls = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== socket.OPEN) return;
    for (const pending of pendingCallsRef.current.values()) if (pending.sentOn === null) {
      socket.send(pending.request);
      pending.sentOn = socket;
    }
  };
  const rejectQueuedCalls = (reason) => {
    const error = new Error(reason);
    for (const [id, pending] of pendingCallsRef.current) if (pending.sentOn === null) {
      if (pending.timeoutId) clearTimeout(pending.timeoutId);
      pendingCallsRef.current.delete(id);
      pending.reject(error);
      pending.stream?.onError?.(reason);
    }
  };
  const cacheKey = reactExports.useMemo(() => createCacheKey(agentNamespace, options.name, subChain, queryDeps || []), [
    agentNamespace,
    options.name,
    subChain,
    queryDeps
  ]);
  const cacheKeyRef = reactExports.useRef(cacheKey);
  cacheKeyRef.current = cacheKey;
  const ttl = cacheTtl ?? 300 * 1e3;
  const [cacheInvalidatedAt, setCacheInvalidatedAt] = reactExports.useState(0);
  const isAsyncQuery = query && typeof query === "function";
  const [awaitingQueryRefresh, setAwaitingQueryRefresh] = reactExports.useState(false);
  const queryPromise = reactExports.useMemo(() => {
    if (!query || typeof query !== "function") return null;
    const cached = getCacheEntry(cacheKey);
    if (cached) return cached.promise;
    const promise = query().catch((error) => {
      console.error(`[useAgent] Query failed for agent "${options.agent}":`, error);
      deleteCacheEntry(cacheKey);
      throw error;
    });
    setCacheEntry(cacheKey, promise, ttl);
    return promise;
  }, [
    cacheKey,
    query,
    options.agent,
    ttl,
    cacheInvalidatedAt
  ]);
  reactExports.useEffect(() => {
    if (!queryPromise || ttl <= 0) return;
    const entry = getCacheEntry(cacheKey);
    if (!entry) return;
    const timeUntilExpiry = entry.expiresAt - Date.now();
    const timer = setTimeout(() => {
      deleteCacheEntry(cacheKey);
      setCacheInvalidatedAt(Date.now());
    }, Math.max(0, timeUntilExpiry));
    return () => clearTimeout(timer);
  }, [
    cacheKey,
    queryPromise,
    ttl
  ]);
  let resolvedQuery;
  if (query) if (typeof query === "function") {
    const queryResult = reactExports.use(queryPromise);
    if (queryResult) {
      for (const [key, value] of Object.entries(queryResult)) if (value !== null && value !== void 0 && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") console.warn(`[useAgent] Query parameter "${key}" is an object and will be converted to "[object Object]". Query parameters should be string, number, boolean, or null.`);
      resolvedQuery = queryResult;
    }
  } else resolvedQuery = query;
  reactExports.useEffect(() => {
    if (awaitingQueryRefresh && resolvedQuery !== void 0) setAwaitingQueryRefresh(false);
  }, [awaitingQueryRefresh, resolvedQuery]);
  const [agentState, setAgentState] = reactExports.useState(void 0);
  const [connectionError, setConnectionError] = reactExports.useState(null);
  const connectionErrorRef = reactExports.useRef(null);
  const connectionErrorAddressKeyRef = reactExports.useRef(null);
  const shouldReconnectOnCloseRef = reactExports.useRef(shouldReconnectOnClose);
  shouldReconnectOnCloseRef.current = shouldReconnectOnClose;
  const classifyReconnect = reactExports.useCallback((event) => (shouldReconnectOnCloseRef.current?.(event) ?? true) && !isTerminalCloseEvent(event), []);
  const [identity, setIdentity] = reactExports.useState({
    name: leafName,
    agent: camelCaseToKebabCase(leafAgent),
    identified: false
  });
  const previousIdentityRef = reactExports.useRef({
    name: null,
    agent: null
  });
  const readyRef = reactExports.useRef(void 0);
  const resetReady = () => {
    let resolve2;
    readyRef.current = {
      promise: new Promise((r) => {
        resolve2 = r;
      }),
      resolve: resolve2
    };
  };
  if (!readyRef.current) resetReady();
  const mutableAgentRef = reactExports.useRef(null);
  const combinedPath = reactExports.useMemo(() => buildSubPath(subChain, userPath), [subChain, userPath]);
  const socketOptions = options.basePath ? {
    basePath: options.basePath,
    path: combinedPath || void 0,
    query: resolvedQuery,
    ...restOptions,
    shouldReconnectOnClose: classifyReconnect
  } : {
    party: agentNamespace,
    prefix: "agents",
    room: options.name || "default",
    path: combinedPath || void 0,
    query: resolvedQuery,
    ...restOptions,
    shouldReconnectOnClose: classifyReconnect
  };
  const socketEnabled = !awaitingQueryRefresh && (restOptions.enabled ?? true);
  const addressKey = JSON.stringify([
    options.host ?? null,
    options.basePath ?? null,
    agentNamespace,
    options.name || "default",
    combinedPath || null
  ]);
  const visibleConnectionError = connectionErrorAddressKeyRef.current === addressKey ? connectionError : null;
  connectionErrorRef.current = visibleConnectionError;
  const agent = usePartySocket({
    ...socketOptions,
    enabled: socketEnabled,
    onOpen: (event) => {
      connectionErrorAddressKeyRef.current = null;
      setConnectionError(null);
      flushQueuedCalls();
      options.onOpen?.(event);
    },
    onMessage: (message) => {
      if (typeof message.data === "string") {
        let parsedMessage;
        try {
          parsedMessage = JSON.parse(message.data);
        } catch (_error2) {
          return options.onMessage?.(message);
        }
        if (parsedMessage.type === "cf_agent_identity") {
          const oldName = previousIdentityRef.current.name;
          const oldAgent = previousIdentityRef.current.agent;
          const newName = parsedMessage.name;
          const newAgent = parsedMessage.agent;
          const currentAgent = mutableAgentRef.current;
          if (currentAgent) {
            currentAgent.name = newName;
            currentAgent.agent = newAgent;
            currentAgent.identified = true;
          }
          setIdentity({
            name: newName,
            agent: newAgent,
            identified: true
          });
          readyRef.current?.resolve();
          if (oldName !== null && oldAgent !== null && (oldName !== newName || oldAgent !== newAgent)) if (options.onIdentityChange) options.onIdentityChange(oldName, newName, oldAgent, newAgent);
          else {
            const agentChanged = oldAgent !== newAgent;
            const nameChanged = oldName !== newName;
            let changeDescription = "";
            if (agentChanged && nameChanged) changeDescription = `agent "${oldAgent}" → "${newAgent}", instance "${oldName}" → "${newName}"`;
            else if (agentChanged) changeDescription = `agent "${oldAgent}" → "${newAgent}"`;
            else changeDescription = `instance "${oldName}" → "${newName}"`;
            console.warn(`[agents] Identity changed on reconnect: ${changeDescription}. This can happen with server-side routing (e.g., basePath with getAgentByName) where the instance is determined by auth/session. Provide onIdentityChange callback to handle this explicitly, or ignore if this is expected for your routing pattern.`);
          }
          previousIdentityRef.current = {
            name: newName,
            agent: newAgent
          };
          options.onIdentity?.(newName, newAgent);
          return;
        }
        if (parsedMessage.type === "cf_agent_state") {
          setAgentState(parsedMessage.state);
          options.onStateUpdate?.(parsedMessage.state, "server");
          return;
        }
        if (parsedMessage.type === "cf_agent_state_error") {
          options.onStateUpdateError?.(parsedMessage.error);
          return;
        }
        if (parsedMessage.type === "cf_agent_mcp_servers") {
          options.onMcpUpdate?.(parsedMessage.mcp);
          return;
        }
        if (parsedMessage.type === "rpc") {
          const response = parsedMessage;
          const pending = pendingCallsRef.current.get(response.id);
          if (!pending) {
            console.warn(`[useAgent] Discarded an RPC response with no matching pending call (id "${response.id}"). The call likely timed out or was rejected when its connection closed before the response arrived.`);
            return;
          }
          if (!response.success) {
            if (pending.timeoutId) clearTimeout(pending.timeoutId);
            pending.reject(new Error(response.error));
            pendingCallsRef.current.delete(response.id);
            pending.stream?.onError?.(response.error);
            return;
          }
          if ("done" in response) if (response.done) {
            if (pending.timeoutId) clearTimeout(pending.timeoutId);
            pending.resolve(response.result);
            pendingCallsRef.current.delete(response.id);
            pending.stream?.onDone?.(response.result);
          } else pending.stream?.onChunk?.(response.result);
          else {
            if (pending.timeoutId) clearTimeout(pending.timeoutId);
            pending.resolve(response.result);
            pendingCallsRef.current.delete(response.id);
          }
          return;
        }
      }
      options.onMessage?.(message);
    },
    onClose: (event) => {
      const closedSocket = event.target ?? socketRef.current;
      const isCurrentSocket = closedSocket === socketRef.current;
      const terminalClose = isTerminalCloseEvent(event);
      if (closedSocket) {
        rejectCallsSentOn(closedSocket, "Connection closed");
        if (isCurrentSocket && !closedSocket.shouldReconnect) rejectQueuedCalls("Connection closed");
      }
      if (isCurrentSocket) {
        resetReady();
        if (mutableAgentRef.current) mutableAgentRef.current.identified = false;
        setIdentity((prev) => ({
          ...prev,
          identified: false
        }));
        if (closedSocket?.shouldReconnect) {
          if (isAsyncQuery) setAwaitingQueryRefresh(true);
          deleteCacheEntry(cacheKeyRef.current);
          setCacheInvalidatedAt(Date.now());
        }
        if (!closedSocket?.shouldReconnect && terminalClose) {
          const error = new AgentConnectionError(event);
          connectionErrorAddressKeyRef.current = addressKey;
          setConnectionError(error);
          onConnectionError?.(error);
        }
      }
      options.onClose?.(event);
    }
  });
  socketRef.current = agent;
  const prevSocketRef = reactExports.useRef(null);
  const prevAddressKeyRef = reactExports.useRef(addressKey);
  reactExports.useEffect(() => {
    const prev = prevSocketRef.current;
    prevSocketRef.current = agent;
    const prevAddress = prevAddressKeyRef.current;
    prevAddressKeyRef.current = addressKey;
    if (prevAddress !== addressKey) {
      connectionErrorAddressKeyRef.current = null;
      setConnectionError(null);
      rejectQueuedCalls("Call discarded: the agent address changed before the request could be sent");
    }
    if (prev && prev !== agent) {
      rejectCallsSentOn(prev, "Connection closed");
      resetReady();
      if (mutableAgentRef.current) mutableAgentRef.current.identified = false;
      setIdentity((current) => current.identified ? {
        ...current,
        identified: false
      } : current);
    }
  }, [agent, addressKey]);
  const call = reactExports.useCallback((method, args = [], options2) => {
    return new Promise((resolve2, reject) => {
      const socket = socketRef.current;
      if (socket && connectionErrorRef.current && socket.readyState === socket.CLOSED) {
        reject(/* @__PURE__ */ new Error("Connection closed"));
        return;
      }
      const id = crypto.randomUUID();
      let timeoutId;
      const isLegacyFormat = options2 && ("onChunk" in options2 || "onDone" in options2 || "onError" in options2);
      const streamOptions = isLegacyFormat ? options2 : options2?.stream;
      const timeout = isLegacyFormat ? void 0 : options2?.timeout;
      const effectiveTimeout = timeout !== void 0 ? timeout : streamOptions ? void 0 : defaultCallTimeoutRef.current;
      if (effectiveTimeout) timeoutId = setTimeout(() => {
        const pending = pendingCallsRef.current.get(id);
        pendingCallsRef.current.delete(id);
        const errorMessage = `RPC call to ${method} timed out after ${effectiveTimeout}ms`;
        pending?.stream?.onError?.(errorMessage);
        reject(new Error(errorMessage));
      }, effectiveTimeout);
      const request = JSON.stringify({
        args,
        id,
        method,
        type: "rpc"
      });
      pendingCallsRef.current.set(id, {
        reject,
        resolve: resolve2,
        stream: streamOptions,
        timeoutId,
        request,
        sentOn: null
      });
      if (socket && socket.readyState === socket.OPEN) {
        socket.send(request);
        const pending = pendingCallsRef.current.get(id);
        if (pending) pending.sentOn = socket;
      }
    });
  }, []);
  agent.setState = (newState) => {
    (socketRef.current ?? agent).send(JSON.stringify({
      state: newState,
      type: "cf_agent_state"
    }));
    setAgentState(newState);
    options.onStateUpdate?.(newState, "client");
  };
  agent.call = call;
  agent.agent = identity.agent;
  agent.name = identity.name;
  agent.path = fullPath;
  agent.identified = identity.identified;
  agent.ready = readyRef.current.promise;
  agent.state = agentState;
  agent.connectionError = visibleConnectionError;
  mutableAgentRef.current = agent;
  agent.stub = reactExports.useMemo(() => createStubProxy(call), [call]);
  agent.getHttpUrl = () => {
    return (agent._url || agent._pkurl || "").replace("ws://", "http://").replace("wss://", "https://");
  };
  if (identity.agent !== identity.agent.toLowerCase()) console.warn("Agent name: " + identity.agent + " should probably be in lowercase. Received: " + identity.agent);
  return agent;
}
var createIdGenerator = ({
  prefix,
  size = 16,
  alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  separator = "-"
} = {}) => {
  const generator = () => {
    const alphabetLength = alphabet.length;
    const chars = new Array(size);
    for (let i = 0; i < size; i++) {
      chars[i] = alphabet[Math.random() * alphabetLength | 0];
    }
    return chars.join("");
  };
  if (prefix == null) {
    return generator;
  }
  if (alphabet.includes(separator)) {
    throw new InvalidArgumentError({
      argument: "separator",
      message: `The separator "${separator}" must not be part of the alphabet "${alphabet}".`
    });
  }
  return () => `${prefix}${separator}${generator()}`;
};
var generateId = createIdGenerator();
function normalizeHeaders(headers) {
  if (headers == null) {
    return {};
  }
  const normalized = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalized[key.toLowerCase()] = value;
    });
  } else {
    if (!Array.isArray(headers)) {
      headers = Object.entries(headers);
    }
    for (const [key, value] of headers) {
      if (value != null) {
        normalized[key.toLowerCase()] = value;
      }
    }
  }
  return normalized;
}
var suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
var suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
function _parse(text2) {
  const obj = JSON.parse(text2);
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (suspectProtoRx.test(text2) === false && suspectConstructorRx.test(text2) === false) {
    return obj;
  }
  return filter(obj);
}
function filter(obj) {
  let next = [obj];
  while (next.length) {
    const nodes = next;
    next = [];
    for (const node of nodes) {
      if (Object.prototype.hasOwnProperty.call(node, "__proto__")) {
        throw new SyntaxError("Object contains forbidden prototype property");
      }
      if (Object.prototype.hasOwnProperty.call(node, "constructor") && node.constructor !== null && typeof node.constructor === "object" && Object.prototype.hasOwnProperty.call(node.constructor, "prototype")) {
        throw new SyntaxError("Object contains forbidden prototype property");
      }
      for (const key in node) {
        const value = node[key];
        if (value && typeof value === "object") {
          next.push(value);
        }
      }
    }
  }
  return obj;
}
function secureJsonParse(text2) {
  const { stackTraceLimit } = Error;
  try {
    Error.stackTraceLimit = 0;
  } catch (e) {
    return _parse(text2);
  }
  try {
    return _parse(text2);
  } finally {
    Error.stackTraceLimit = stackTraceLimit;
  }
}
function addAdditionalPropertiesToJsonSchema(jsonSchema2) {
  if (jsonSchema2.type === "object" || Array.isArray(jsonSchema2.type) && jsonSchema2.type.includes("object")) {
    jsonSchema2.additionalProperties = false;
    const { properties } = jsonSchema2;
    if (properties != null) {
      for (const key of Object.keys(properties)) {
        properties[key] = visit(properties[key]);
      }
    }
  }
  if (jsonSchema2.items != null) {
    jsonSchema2.items = Array.isArray(jsonSchema2.items) ? jsonSchema2.items.map(visit) : visit(jsonSchema2.items);
  }
  if (jsonSchema2.anyOf != null) {
    jsonSchema2.anyOf = jsonSchema2.anyOf.map(visit);
  }
  if (jsonSchema2.allOf != null) {
    jsonSchema2.allOf = jsonSchema2.allOf.map(visit);
  }
  if (jsonSchema2.oneOf != null) {
    jsonSchema2.oneOf = jsonSchema2.oneOf.map(visit);
  }
  const { definitions } = jsonSchema2;
  if (definitions != null) {
    for (const key of Object.keys(definitions)) {
      definitions[key] = visit(definitions[key]);
    }
  }
  return jsonSchema2;
}
function visit(def) {
  if (typeof def === "boolean") return def;
  return addAdditionalPropertiesToJsonSchema(def);
}
var ignoreOverride = /* @__PURE__ */ Symbol(
  "Let zodToJsonSchema decide on which parser to use"
);
var defaultOptions = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: true,
  rejectedAdditionalProperties: false,
  definitionPath: "definitions",
  strictUnions: false,
  definitions: {},
  errorMessages: false,
  patternStrategy: "escape",
  applyRegexFlags: false,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
  ...defaultOptions,
  name: options
} : {
  ...defaultOptions,
  ...options
};
function parseAnyDef() {
  return {};
}
function parseArrayDef(def, refs) {
  var _a2, _b2, _c;
  const res = {
    type: "array"
  };
  if (((_a2 = def.type) == null ? void 0 : _a2._def) && ((_c = (_b2 = def.type) == null ? void 0 : _b2._def) == null ? void 0 : _c.typeName) !== ZodFirstPartyTypeKind.ZodAny) {
    res.items = parseDef(def.type._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    });
  }
  if (def.minLength) {
    res.minItems = def.minLength.value;
  }
  if (def.maxLength) {
    res.maxItems = def.maxLength.value;
  }
  if (def.exactLength) {
    res.minItems = def.exactLength.value;
    res.maxItems = def.exactLength.value;
  }
  return res;
}
function parseBigintDef(def) {
  const res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks) return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        if (check.inclusive) {
          res.minimum = check.value;
        } else {
          res.exclusiveMinimum = check.value;
        }
        break;
      case "max":
        if (check.inclusive) {
          res.maximum = check.value;
        } else {
          res.exclusiveMaximum = check.value;
        }
        break;
      case "multipleOf":
        res.multipleOf = check.value;
        break;
    }
  }
  return res;
}
function parseBooleanDef() {
  return { type: "boolean" };
}
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}
var parseCatchDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};
function parseDateDef(def, refs, overrideDateStrategy) {
  const strategy = overrideDateStrategy != null ? overrideDateStrategy : refs.dateStrategy;
  if (Array.isArray(strategy)) {
    return {
      anyOf: strategy.map((item, i) => parseDateDef(def, refs, item))
    };
  }
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def);
  }
}
var integerDateParser = (def) => {
  const res = {
    type: "integer",
    format: "unix-time"
  };
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        res.minimum = check.value;
        break;
      case "max":
        res.maximum = check.value;
        break;
    }
  }
  return res;
};
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef();
}
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}
var isJsonSchema7AllOfType = (type) => {
  if ("type" in type && type.type === "string") return false;
  return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
  const allOf = [
    parseDef(def.left._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "0"]
    }),
    parseDef(def.right._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "1"]
    })
  ].filter((x) => !!x);
  const mergedAllOf = [];
  allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema)) {
      mergedAllOf.push(...schema.allOf);
    } else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === false) {
        const { additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      }
      mergedAllOf.push(nestedSchema);
    }
  });
  return mergedAllOf.length ? { allOf: mergedAllOf } : void 0;
}
function parseLiteralDef(def) {
  const parsedType = typeof def.value;
  if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") {
    return {
      type: Array.isArray(def.value) ? "array" : "object"
    };
  }
  return {
    type: parsedType === "bigint" ? "integer" : parsedType,
    const: def.value
  };
}
var emojiRegex = void 0;
var zodPatterns = {
  /**
   * `c` was changed to `[cC]` to replicate /i flag
   */
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  /**
   * `a-z` was added to replicate /i flag
   */
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  /**
   * Constructed a valid Unicode RegExp
   *
   * Lazily instantiate since this type of regex isn't supported
   * in all envs (e.g. React Native).
   *
   * See:
   * https://github.com/colinhacks/zod/issues/2433
   * Fix in Zod:
   * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
   */
  emoji: () => {
    if (emojiRegex === void 0) {
      emojiRegex = RegExp(
        "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$",
        "u"
      );
    }
    return emojiRegex;
  },
  /**
   * Unused
   */
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  /**
   * Unused
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  /**
   * Unused
   */
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
  const res = {
    type: "string"
  };
  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case "min":
          res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
          break;
        case "max":
          res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check.message, refs);
          break;
        case "regex":
          addPattern(res, check.regex, check.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check.message, refs);
          break;
        case "startsWith":
          addPattern(
            res,
            RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`),
            check.message,
            refs
          );
          break;
        case "endsWith":
          addPattern(
            res,
            RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`),
            check.message,
            refs
          );
          break;
        case "datetime":
          addFormat(res, "date-time", check.message, refs);
          break;
        case "date":
          addFormat(res, "date", check.message, refs);
          break;
        case "time":
          addFormat(res, "time", check.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check.message, refs);
          break;
        case "length":
          res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
          res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
          break;
        case "includes": {
          addPattern(
            res,
            RegExp(escapeLiteralCheckValue(check.value, refs)),
            check.message,
            refs
          );
          break;
        }
        case "ip": {
          if (check.version !== "v6") {
            addFormat(res, "ipv4", check.message, refs);
          }
          if (check.version !== "v4") {
            addFormat(res, "ipv6", check.message, refs);
          }
          break;
        }
        case "base64url":
          addPattern(res, zodPatterns.base64url, check.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check.message, refs);
          break;
        case "cidr": {
          if (check.version !== "v6") {
            addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
          }
          if (check.version !== "v4") {
            addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
          }
          break;
        }
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check.message, refs);
          break;
        case "ulid": {
          addPattern(res, zodPatterns.ulid, check.message, refs);
          break;
        }
        case "base64": {
          switch (refs.base64Strategy) {
            case "format:binary": {
              addFormat(res, "binary", check.message, refs);
              break;
            }
            case "contentEncoding:base64": {
              res.contentEncoding = "base64";
              break;
            }
            case "pattern:zod": {
              addPattern(res, zodPatterns.base64, check.message, refs);
              break;
            }
          }
          break;
        }
        case "nanoid": {
          addPattern(res, zodPatterns.nanoid, check.message, refs);
        }
      }
    }
  }
  return res;
}
function escapeLiteralCheckValue(literal2, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal2) : literal2;
}
var ALPHA_NUMERIC = new Set(
  "ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789"
);
function escapeNonAlphaNumeric(source) {
  let result = "";
  for (let i = 0; i < source.length; i++) {
    if (!ALPHA_NUMERIC.has(source[i])) {
      result += "\\";
    }
    result += source[i];
  }
  return result;
}
function addFormat(schema, value, message, refs) {
  var _a2;
  if (schema.format || ((_a2 = schema.anyOf) == null ? void 0 : _a2.some((x) => x.format))) {
    if (!schema.anyOf) {
      schema.anyOf = [];
    }
    if (schema.format) {
      schema.anyOf.push({
        format: schema.format
      });
      delete schema.format;
    }
    schema.anyOf.push({
      format: value,
      ...message && refs.errorMessages && { errorMessage: { format: message } }
    });
  } else {
    schema.format = value;
  }
}
function addPattern(schema, regex, message, refs) {
  var _a2;
  if (schema.pattern || ((_a2 = schema.allOf) == null ? void 0 : _a2.some((x) => x.pattern))) {
    if (!schema.allOf) {
      schema.allOf = [];
    }
    if (schema.pattern) {
      schema.allOf.push({
        pattern: schema.pattern
      });
      delete schema.pattern;
    }
    schema.allOf.push({
      pattern: stringifyRegExpWithFlags(regex, refs),
      ...message && refs.errorMessages && { errorMessage: { pattern: message } }
    });
  } else {
    schema.pattern = stringifyRegExpWithFlags(regex, refs);
  }
}
function stringifyRegExpWithFlags(regex, refs) {
  var _a2;
  if (!refs.applyRegexFlags || !regex.flags) {
    return regex.source;
  }
  const flags = {
    i: regex.flags.includes("i"),
    // Case-insensitive
    m: regex.flags.includes("m"),
    // `^` and `$` matches adjacent to newline characters
    s: regex.flags.includes("s")
    // `.` matches newlines
  };
  const source = flags.i ? regex.source.toLowerCase() : regex.source;
  let pattern = "";
  let isEscaped = false;
  let inCharGroup = false;
  let inCharRange = false;
  for (let i = 0; i < source.length; i++) {
    if (isEscaped) {
      pattern += source[i];
      isEscaped = false;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source[i].match(/[a-z]/)) {
          if (inCharRange) {
            pattern += source[i];
            pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
            inCharRange = false;
          } else if (source[i + 1] === "-" && ((_a2 = source[i + 2]) == null ? void 0 : _a2.match(/[a-z]/))) {
            pattern += source[i];
            inCharRange = true;
          } else {
            pattern += `${source[i]}${source[i].toUpperCase()}`;
          }
          continue;
        }
      } else if (source[i].match(/[a-z]/)) {
        pattern += `[${source[i]}${source[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source[i] === ".") {
      pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
      continue;
    }
    pattern += source[i];
    if (source[i] === "\\") {
      isEscaped = true;
    } else if (inCharGroup && source[i] === "]") {
      inCharGroup = false;
    } else if (!inCharGroup && source[i] === "[") {
      inCharGroup = true;
    }
  }
  try {
    new RegExp(pattern);
  } catch (e) {
    console.warn(
      `Could not convert regex pattern at ${refs.currentPath.join(
        "/"
      )} to a flag-independent form! Falling back to the flag-ignorant source`
    );
    return regex.source;
  }
  return pattern;
}
function parseRecordDef(def, refs) {
  var _a2, _b2, _c, _d, _e, _f;
  const schema = {
    type: "object",
    additionalProperties: (_a2 = parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    })) != null ? _a2 : refs.allowedAdditionalProperties
  };
  if (((_b2 = def.keyType) == null ? void 0 : _b2._def.typeName) === ZodFirstPartyTypeKind.ZodString && ((_c = def.keyType._def.checks) == null ? void 0 : _c.length)) {
    const { type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else if (((_d = def.keyType) == null ? void 0 : _d._def.typeName) === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      ...schema,
      propertyNames: {
        enum: def.keyType._def.values
      }
    };
  } else if (((_e = def.keyType) == null ? void 0 : _e._def.typeName) === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && ((_f = def.keyType._def.type._def.checks) == null ? void 0 : _f.length)) {
    const { type, ...keyType } = parseBrandedDef(
      def.keyType._def,
      refs
    );
    return {
      ...schema,
      propertyNames: keyType
    };
  }
  return schema;
}
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record") {
    return parseRecordDef(def, refs);
  }
  const keys = parseDef(def.keyType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "0"]
  }) || parseAnyDef();
  const values = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "1"]
  }) || parseAnyDef();
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [keys, values],
      minItems: 2,
      maxItems: 2
    }
  };
}
function parseNativeEnumDef(def) {
  const object2 = def.values;
  const actualKeys = Object.keys(def.values).filter((key) => {
    return typeof object2[object2[key]] !== "number";
  });
  const actualValues = actualKeys.map((key) => object2[key]);
  const parsedTypes = Array.from(
    new Set(actualValues.map((values) => typeof values))
  );
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}
function parseNeverDef() {
  return { not: parseAnyDef() };
}
function parseNullDef() {
  return {
    type: "null"
  };
}
var primitiveMappings = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function parseUnionDef(def, refs) {
  const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every(
    (x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length)
  )) {
    const types = options.reduce((types2, x) => {
      const type = primitiveMappings[x._def.typeName];
      return type && !types2.includes(type) ? [...types2, type] : types2;
    }, []);
    return {
      type: types.length > 1 ? types : types[0]
    };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    const types = options.reduce(
      (acc, x) => {
        const type = typeof x._def.value;
        switch (type) {
          case "string":
          case "number":
          case "boolean":
            return [...acc, type];
          case "bigint":
            return [...acc, "integer"];
          case "object":
            if (x._def.value === null) return [...acc, "null"];
          case "symbol":
          case "undefined":
          case "function":
          default:
            return acc;
        }
      },
      []
    );
    if (types.length === options.length) {
      const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce(
          (acc, x) => {
            return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
          },
          []
        )
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum")) {
    return {
      type: "string",
      enum: options.reduce(
        (acc, x) => [
          ...acc,
          ...x._def.values.filter((x2) => !acc.includes(x2))
        ],
        []
      )
    };
  }
  return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
  const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map(
    (x, i) => parseDef(x._def, {
      ...refs,
      currentPath: [...refs.currentPath, "anyOf", `${i}`]
    })
  ).filter(
    (x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0)
  );
  return anyOf.length ? { anyOf } : void 0;
};
function parseNullableDef(def, refs) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(
    def.innerType._def.typeName
  ) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
    return {
      type: [
        primitiveMappings[def.innerType._def.typeName],
        "null"
      ]
    };
  }
  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "0"]
  });
  return base && { anyOf: [base, { type: "null" }] };
}
function parseNumberDef(def) {
  const res = {
    type: "number"
  };
  if (!def.checks) return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "int":
        res.type = "integer";
        break;
      case "min":
        if (check.inclusive) {
          res.minimum = check.value;
        } else {
          res.exclusiveMinimum = check.value;
        }
        break;
      case "max":
        if (check.inclusive) {
          res.maximum = check.value;
        } else {
          res.exclusiveMaximum = check.value;
        }
        break;
      case "multipleOf":
        res.multipleOf = check.value;
        break;
    }
  }
  return res;
}
function parseObjectDef(def, refs) {
  const result = {
    type: "object",
    properties: {}
  };
  const required = [];
  const shape = def.shape();
  for (const propName in shape) {
    let propDef = shape[propName];
    if (propDef === void 0 || propDef._def === void 0) {
      continue;
    }
    const propOptional = safeIsOptional(propDef);
    const parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [...refs.currentPath, "properties", propName],
      propertyPath: [...refs.currentPath, "properties", propName]
    });
    if (parsedDef === void 0) {
      continue;
    }
    result.properties[propName] = parsedDef;
    if (!propOptional) {
      required.push(propName);
    }
  }
  if (required.length) {
    result.required = required;
  }
  const additionalProperties = decideAdditionalProperties(def, refs);
  if (additionalProperties !== void 0) {
    result.additionalProperties = additionalProperties;
  }
  return result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever") {
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  }
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch (e) {
    return true;
  }
}
var parseOptionalDef = (def, refs) => {
  var _a2;
  if (refs.currentPath.toString() === ((_a2 = refs.propertyPath) == null ? void 0 : _a2.toString())) {
    return parseDef(def.innerType._def, refs);
  }
  const innerSchema = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "1"]
  });
  return innerSchema ? { anyOf: [{ not: parseAnyDef() }, innerSchema] } : parseAnyDef();
};
var parsePipelineDef = (def, refs) => {
  if (refs.pipeStrategy === "input") {
    return parseDef(def.in._def, refs);
  } else if (refs.pipeStrategy === "output") {
    return parseDef(def.out._def, refs);
  }
  const a = parseDef(def.in._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", "0"]
  });
  const b = parseDef(def.out._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", a ? "1" : "0"]
  });
  return {
    allOf: [a, b].filter((x) => x !== void 0)
  };
};
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}
function parseSetDef(def, refs) {
  const items = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items"]
  });
  const schema = {
    type: "array",
    uniqueItems: true,
    items
  };
  if (def.minSize) {
    schema.minItems = def.minSize.value;
  }
  if (def.maxSize) {
    schema.maxItems = def.maxSize.value;
  }
  return schema;
}
function parseTupleDef(def, refs) {
  if (def.rest) {
    return {
      type: "array",
      minItems: def.items.length,
      items: def.items.map(
        (x, i) => parseDef(x._def, {
          ...refs,
          currentPath: [...refs.currentPath, "items", `${i}`]
        })
      ).reduce(
        (acc, x) => x === void 0 ? acc : [...acc, x],
        []
      ),
      additionalItems: parseDef(def.rest._def, {
        ...refs,
        currentPath: [...refs.currentPath, "additionalItems"]
      })
    };
  } else {
    return {
      type: "array",
      minItems: def.items.length,
      maxItems: def.items.length,
      items: def.items.map(
        (x, i) => parseDef(x._def, {
          ...refs,
          currentPath: [...refs.currentPath, "items", `${i}`]
        })
      ).reduce(
        (acc, x) => x === void 0 ? acc : [...acc, x],
        []
      )
    };
  }
}
function parseUndefinedDef() {
  return {
    not: parseAnyDef()
  };
}
function parseUnknownDef() {
  return parseAnyDef();
}
var parseReadonlyDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};
var selectParser = (def, typeName, refs) => {
  switch (typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return parseStringDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNumber:
      return parseNumberDef(def);
    case ZodFirstPartyTypeKind.ZodObject:
      return parseObjectDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBigInt:
      return parseBigintDef(def);
    case ZodFirstPartyTypeKind.ZodBoolean:
      return parseBooleanDef();
    case ZodFirstPartyTypeKind.ZodDate:
      return parseDateDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUndefined:
      return parseUndefinedDef();
    case ZodFirstPartyTypeKind.ZodNull:
      return parseNullDef();
    case ZodFirstPartyTypeKind.ZodArray:
      return parseArrayDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUnion:
    case ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodIntersection:
      return parseIntersectionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodTuple:
      return parseTupleDef(def, refs);
    case ZodFirstPartyTypeKind.ZodRecord:
      return parseRecordDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLiteral:
      return parseLiteralDef(def);
    case ZodFirstPartyTypeKind.ZodEnum:
      return parseEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNativeEnum:
      return parseNativeEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNullable:
      return parseNullableDef(def, refs);
    case ZodFirstPartyTypeKind.ZodOptional:
      return parseOptionalDef(def, refs);
    case ZodFirstPartyTypeKind.ZodMap:
      return parseMapDef(def, refs);
    case ZodFirstPartyTypeKind.ZodSet:
      return parseSetDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLazy:
      return () => def.getter()._def;
    case ZodFirstPartyTypeKind.ZodPromise:
      return parsePromiseDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNaN:
    case ZodFirstPartyTypeKind.ZodNever:
      return parseNeverDef();
    case ZodFirstPartyTypeKind.ZodEffects:
      return parseEffectsDef(def, refs);
    case ZodFirstPartyTypeKind.ZodAny:
      return parseAnyDef();
    case ZodFirstPartyTypeKind.ZodUnknown:
      return parseUnknownDef();
    case ZodFirstPartyTypeKind.ZodDefault:
      return parseDefaultDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBranded:
      return parseBrandedDef(def, refs);
    case ZodFirstPartyTypeKind.ZodReadonly:
      return parseReadonlyDef(def, refs);
    case ZodFirstPartyTypeKind.ZodCatch:
      return parseCatchDef(def, refs);
    case ZodFirstPartyTypeKind.ZodPipeline:
      return parsePipelineDef(def, refs);
    case ZodFirstPartyTypeKind.ZodFunction:
    case ZodFirstPartyTypeKind.ZodVoid:
    case ZodFirstPartyTypeKind.ZodSymbol:
      return void 0;
    default:
      return /* @__PURE__ */ ((_) => void 0)();
  }
};
var getRelativePath = (pathA, pathB) => {
  let i = 0;
  for (; i < pathA.length && i < pathB.length; i++) {
    if (pathA[i] !== pathB[i]) break;
  }
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};
function parseDef(def, refs, forceResolution = false) {
  var _a2;
  const seenItem = refs.seen.get(def);
  if (refs.override) {
    const overrideResult = (_a2 = refs.override) == null ? void 0 : _a2.call(
      refs,
      def,
      refs,
      seenItem,
      forceResolution
    );
    if (overrideResult !== ignoreOverride) {
      return overrideResult;
    }
  }
  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== void 0) {
      return seenSchema;
    }
  }
  const newItem = { def, path: refs.currentPath, jsonSchema: void 0 };
  refs.seen.set(def, newItem);
  const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
  const jsonSchema2 = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema2) {
    addMeta(def, refs, jsonSchema2);
  }
  if (refs.postProcess) {
    const postProcessResult = refs.postProcess(jsonSchema2, def, refs);
    newItem.jsonSchema = jsonSchema2;
    return postProcessResult;
  }
  newItem.jsonSchema = jsonSchema2;
  return jsonSchema2;
}
var get$ref = (item, refs) => {
  switch (refs.$refStrategy) {
    case "root":
      return { $ref: item.path.join("/") };
    case "relative":
      return { $ref: getRelativePath(refs.currentPath, item.path) };
    case "none":
    case "seen": {
      if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
        console.warn(
          `Recursive reference detected at ${refs.currentPath.join(
            "/"
          )}! Defaulting to any`
        );
        return parseAnyDef();
      }
      return refs.$refStrategy === "seen" ? parseAnyDef() : void 0;
    }
  }
};
var addMeta = (def, refs, jsonSchema2) => {
  if (def.description) {
    jsonSchema2.description = def.description;
  }
  return jsonSchema2;
};
var getRefs = (options) => {
  const _options = getDefaultOptions(options);
  const currentPath = _options.name !== void 0 ? [..._options.basePath, _options.definitionPath, _options.name] : _options.basePath;
  return {
    ..._options,
    currentPath,
    propertyPath: void 0,
    seen: new Map(
      Object.entries(_options.definitions).map(([name2, def]) => [
        def._def,
        {
          def: def._def,
          path: [..._options.basePath, _options.definitionPath, name2],
          // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
          jsonSchema: void 0
        }
      ])
    )
  };
};
var zod3ToJsonSchema = (schema, options) => {
  var _a2;
  const refs = getRefs(options);
  let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce(
    (acc, [name3, schema2]) => {
      var _a3;
      return {
        ...acc,
        [name3]: (_a3 = parseDef(
          schema2._def,
          {
            ...refs,
            currentPath: [...refs.basePath, refs.definitionPath, name3]
          },
          true
        )) != null ? _a3 : parseAnyDef()
      };
    },
    {}
  ) : void 0;
  const name2 = typeof options === "string" ? options : (options == null ? void 0 : options.nameStrategy) === "title" ? void 0 : options == null ? void 0 : options.name;
  const main = (_a2 = parseDef(
    schema._def,
    name2 === void 0 ? refs : {
      ...refs,
      currentPath: [...refs.basePath, refs.definitionPath, name2]
    },
    false
  )) != null ? _a2 : parseAnyDef();
  const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
  if (title !== void 0) {
    main.title = title;
  }
  const combined = name2 === void 0 ? definitions ? {
    ...main,
    [refs.definitionPath]: definitions
  } : main : {
    $ref: [
      ...refs.$refStrategy === "relative" ? [] : refs.basePath,
      refs.definitionPath,
      name2
    ].join("/"),
    [refs.definitionPath]: {
      ...definitions,
      [name2]: main
    }
  };
  combined.$schema = "http://json-schema.org/draft-07/schema#";
  return combined;
};
var schemaSymbol = /* @__PURE__ */ Symbol.for("vercel.ai.schema");
function lazySchema(createSchema) {
  let schema;
  return () => {
    if (schema == null) {
      schema = createSchema();
    }
    return schema;
  };
}
function jsonSchema(jsonSchema2, {
  validate
} = {}) {
  return {
    [schemaSymbol]: true,
    _type: void 0,
    // should never be used directly
    get jsonSchema() {
      if (typeof jsonSchema2 === "function") {
        jsonSchema2 = jsonSchema2();
      }
      return jsonSchema2;
    },
    validate
  };
}
function isSchema(value) {
  return typeof value === "object" && value !== null && schemaSymbol in value && value[schemaSymbol] === true && "jsonSchema" in value && "validate" in value;
}
function asSchema(schema) {
  return schema == null ? jsonSchema({ properties: {}, additionalProperties: false }) : isSchema(schema) ? schema : "~standard" in schema ? schema["~standard"].vendor === "zod" ? zodSchema(schema) : standardSchema(schema) : schema();
}
function standardSchema(standardSchema2) {
  return jsonSchema(
    () => addAdditionalPropertiesToJsonSchema(
      standardSchema2["~standard"].jsonSchema.input({
        target: "draft-07"
      })
    ),
    {
      validate: async (value) => {
        const result = await standardSchema2["~standard"].validate(value);
        return "value" in result ? { success: true, value: result.value } : {
          success: false,
          error: new TypeValidationError({
            value,
            cause: result.issues
          })
        };
      }
    }
  );
}
function zod3Schema(zodSchema2, options) {
  var _a2;
  const useReferences = (_a2 = void 0) != null ? _a2 : false;
  return jsonSchema(
    // defer json schema creation to avoid unnecessary computation when only validation is needed
    () => zod3ToJsonSchema(zodSchema2, {
      $refStrategy: useReferences ? "root" : "none"
    }),
    {
      validate: async (value) => {
        const result = await zodSchema2.safeParseAsync(value);
        return result.success ? { success: true, value: result.data } : { success: false, error: result.error };
      }
    }
  );
}
function zod4Schema(zodSchema2, options) {
  var _a2;
  const useReferences = (_a2 = void 0) != null ? _a2 : false;
  return jsonSchema(
    // defer json schema creation to avoid unnecessary computation when only validation is needed
    () => addAdditionalPropertiesToJsonSchema(
      toJSONSchema(zodSchema2, {
        target: "draft-7",
        io: "input",
        reused: useReferences ? "ref" : "inline"
      })
    ),
    {
      validate: async (value) => {
        const result = await safeParseAsync(zodSchema2, value);
        return result.success ? { success: true, value: result.data } : { success: false, error: result.error };
      }
    }
  );
}
function isZod4Schema(zodSchema2) {
  return "_zod" in zodSchema2;
}
function zodSchema(zodSchema2, options) {
  if (isZod4Schema(zodSchema2)) {
    return zod4Schema(zodSchema2);
  } else {
    return zod3Schema(zodSchema2);
  }
}
async function validateTypes({
  value,
  schema,
  context
}) {
  const result = await safeValidateTypes({ value, schema, context });
  if (!result.success) {
    throw TypeValidationError.wrap({ value, cause: result.error, context });
  }
  return result.value;
}
async function safeValidateTypes({
  value,
  schema,
  context
}) {
  const actualSchema = asSchema(schema);
  try {
    if (actualSchema.validate == null) {
      return { success: true, value, rawValue: value };
    }
    const result = await actualSchema.validate(value);
    if (result.success) {
      return { success: true, value: result.value, rawValue: value };
    }
    return {
      success: false,
      error: TypeValidationError.wrap({ value, cause: result.error, context }),
      rawValue: value
    };
  } catch (error) {
    return {
      success: false,
      error: TypeValidationError.wrap({ value, cause: error, context }),
      rawValue: value
    };
  }
}
async function safeParseJSON({
  text: text2,
  schema
}) {
  try {
    const value = secureJsonParse(text2);
    if (schema == null) {
      return { success: true, value, rawValue: value };
    }
    return await safeValidateTypes({ value, schema });
  } catch (error) {
    return {
      success: false,
      error: JSONParseError.isInstance(error) ? error : new JSONParseError({ text: text2, cause: error }),
      rawValue: void 0
    };
  }
}
function parseJsonEventStream({
  stream,
  schema
}) {
  return stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).pipeThrough(
    new TransformStream({
      async transform({ data }, controller) {
        if (data === "[DONE]") {
          return;
        }
        controller.enqueue(await safeParseJSON({ text: data, schema }));
      }
    })
  );
}
async function resolve(value) {
  if (typeof value === "function") {
    value = value();
  }
  return Promise.resolve(value);
}
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name22 in all)
    __defProp(target, name22, { get: all[name22], enumerable: true });
};
var name9 = "AI_NoObjectGeneratedError";
var marker9 = `vercel.ai.error.${name9}`;
var symbol9 = Symbol.for(marker9);
var _a9;
var NoObjectGeneratedError = class extends AISDKError {
  constructor({
    message = "No object generated.",
    cause,
    text: text2,
    response,
    usage,
    finishReason
  }) {
    super({ name: name9, message, cause });
    this[_a9] = true;
    this.text = text2;
    this.response = response;
    this.usage = usage;
    this.finishReason = finishReason;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker9);
  }
};
_a9 = symbol9;
var name16 = "AI_UIMessageStreamError";
var marker16 = `vercel.ai.error.${name16}`;
var symbol16 = Symbol.for(marker16);
var _a16;
var UIMessageStreamError = class extends AISDKError {
  constructor({
    chunkType,
    chunkId,
    message
  }) {
    super({ name: name16, message });
    this[_a16] = true;
    this.chunkType = chunkType;
    this.chunkId = chunkId;
  }
  static isInstance(error) {
    return AISDKError.hasMarker(error, marker16);
  }
};
_a16 = symbol16;
var dataContentSchema = union([
  string(),
  _instanceof(Uint8Array),
  _instanceof(ArrayBuffer),
  custom(
    // Buffer might not be available in some environments such as CloudFlare:
    (value) => {
      var _a22, _b;
      return (_b = (_a22 = globalThis.Buffer) == null ? void 0 : _a22.isBuffer(value)) != null ? _b : false;
    },
    { message: "Must be a Buffer" }
  )
]);
var jsonValueSchema = lazy(
  () => union([
    _null(),
    string(),
    number(),
    boolean(),
    record(string(), jsonValueSchema.optional()),
    array$1(jsonValueSchema)
  ])
);
var providerMetadataSchema = record(
  string(),
  record(string(), jsonValueSchema.optional())
);
var textPartSchema = object$1({
  type: literal("text"),
  text: string(),
  providerOptions: providerMetadataSchema.optional()
});
var imagePartSchema = object$1({
  type: literal("image"),
  image: union([dataContentSchema, _instanceof(URL)]),
  mediaType: string().optional(),
  providerOptions: providerMetadataSchema.optional()
});
var filePartSchema = object$1({
  type: literal("file"),
  data: union([dataContentSchema, _instanceof(URL)]),
  filename: string().optional(),
  mediaType: string(),
  providerOptions: providerMetadataSchema.optional()
});
var reasoningPartSchema = object$1({
  type: literal("reasoning"),
  text: string(),
  providerOptions: providerMetadataSchema.optional()
});
var toolCallPartSchema = object$1({
  type: literal("tool-call"),
  toolCallId: string(),
  toolName: string(),
  input: unknown(),
  providerOptions: providerMetadataSchema.optional(),
  providerExecuted: boolean().optional()
});
var outputSchema = discriminatedUnion(
  "type",
  [
    object$1({
      type: literal("text"),
      value: string(),
      providerOptions: providerMetadataSchema.optional()
    }),
    object$1({
      type: literal("json"),
      value: jsonValueSchema,
      providerOptions: providerMetadataSchema.optional()
    }),
    object$1({
      type: literal("execution-denied"),
      reason: string().optional(),
      providerOptions: providerMetadataSchema.optional()
    }),
    object$1({
      type: literal("error-text"),
      value: string(),
      providerOptions: providerMetadataSchema.optional()
    }),
    object$1({
      type: literal("error-json"),
      value: jsonValueSchema,
      providerOptions: providerMetadataSchema.optional()
    }),
    object$1({
      type: literal("content"),
      value: array$1(
        union([
          object$1({
            type: literal("text"),
            text: string(),
            providerOptions: providerMetadataSchema.optional()
          }),
          object$1({
            type: literal("media"),
            data: string(),
            mediaType: string()
          }),
          object$1({
            type: literal("file-data"),
            data: string(),
            mediaType: string(),
            filename: string().optional(),
            providerOptions: providerMetadataSchema.optional()
          }),
          object$1({
            type: literal("file-url"),
            url: string(),
            providerOptions: providerMetadataSchema.optional()
          }),
          object$1({
            type: literal("file-id"),
            fileId: union([string(), record(string(), string())]),
            providerOptions: providerMetadataSchema.optional()
          }),
          object$1({
            type: literal("image-data"),
            data: string(),
            mediaType: string(),
            providerOptions: providerMetadataSchema.optional()
          }),
          object$1({
            type: literal("image-url"),
            url: string(),
            providerOptions: providerMetadataSchema.optional()
          }),
          object$1({
            type: literal("image-file-id"),
            fileId: union([string(), record(string(), string())]),
            providerOptions: providerMetadataSchema.optional()
          }),
          object$1({
            type: literal("custom"),
            providerOptions: providerMetadataSchema.optional()
          })
        ])
      )
    })
  ]
);
var toolResultPartSchema = object$1({
  type: literal("tool-result"),
  toolCallId: string(),
  toolName: string(),
  output: outputSchema,
  providerOptions: providerMetadataSchema.optional()
});
var toolApprovalRequestSchema = object$1({
  type: literal("tool-approval-request"),
  approvalId: string(),
  toolCallId: string()
});
var toolApprovalResponseSchema = object$1({
  type: literal("tool-approval-response"),
  approvalId: string(),
  approved: boolean(),
  reason: string().optional()
});
var systemModelMessageSchema = object$1(
  {
    role: literal("system"),
    content: string(),
    providerOptions: providerMetadataSchema.optional()
  }
);
var userModelMessageSchema = object$1({
  role: literal("user"),
  content: union([
    string(),
    array$1(union([textPartSchema, imagePartSchema, filePartSchema]))
  ]),
  providerOptions: providerMetadataSchema.optional()
});
var assistantModelMessageSchema = object$1({
  role: literal("assistant"),
  content: union([
    string(),
    array$1(
      union([
        textPartSchema,
        filePartSchema,
        reasoningPartSchema,
        toolCallPartSchema,
        toolResultPartSchema,
        toolApprovalRequestSchema
      ])
    )
  ]),
  providerOptions: providerMetadataSchema.optional()
});
var toolModelMessageSchema = object$1({
  role: literal("tool"),
  content: array$1(union([toolResultPartSchema, toolApprovalResponseSchema])),
  providerOptions: providerMetadataSchema.optional()
});
union([
  systemModelMessageSchema,
  userModelMessageSchema,
  assistantModelMessageSchema,
  toolModelMessageSchema
]);
function mergeObjects(base, overrides) {
  if (base === void 0 && overrides === void 0) {
    return void 0;
  }
  if (base === void 0) {
    return overrides;
  }
  if (overrides === void 0) {
    return base;
  }
  const result = { ...base };
  for (const key in overrides) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      const overridesValue = overrides[key];
      if (overridesValue === void 0)
        continue;
      const baseValue = key in base ? base[key] : void 0;
      const isSourceObject = overridesValue !== null && typeof overridesValue === "object" && !Array.isArray(overridesValue) && !(overridesValue instanceof Date) && !(overridesValue instanceof RegExp);
      const isTargetObject = baseValue !== null && baseValue !== void 0 && typeof baseValue === "object" && !Array.isArray(baseValue) && !(baseValue instanceof Date) && !(baseValue instanceof RegExp);
      if (isSourceObject && isTargetObject) {
        result[key] = mergeObjects(
          baseValue,
          overridesValue
        );
      } else {
        result[key] = overridesValue;
      }
    }
  }
  return result;
}
new TextEncoder();
var output_exports = {};
__export(output_exports, {
  array: () => array,
  choice: () => choice,
  json: () => json,
  object: () => object,
  text: () => text
});
function fixJson(input) {
  const stack = ["ROOT"];
  let lastValidIndex = -1;
  let literalStart = null;
  let unicodeEscapeDigits = 0;
  function isHexDigit(char) {
    return char >= "0" && char <= "9" || char >= "A" && char <= "F" || char >= "a" && char <= "f";
  }
  function processValueStart(char, i, swapState) {
    {
      switch (char) {
        case '"': {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_STRING");
          break;
        }
        case "f":
        case "t":
        case "n": {
          lastValidIndex = i;
          literalStart = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_LITERAL");
          break;
        }
        case "-": {
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_NUMBER");
          break;
        }
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9": {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_NUMBER");
          break;
        }
        case "{": {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_OBJECT_START");
          break;
        }
        case "[": {
          lastValidIndex = i;
          stack.pop();
          stack.push(swapState);
          stack.push("INSIDE_ARRAY_START");
          break;
        }
      }
    }
  }
  function processAfterObjectValue(char, i) {
    switch (char) {
      case ",": {
        stack.pop();
        stack.push("INSIDE_OBJECT_AFTER_COMMA");
        break;
      }
      case "}": {
        lastValidIndex = i;
        stack.pop();
        break;
      }
    }
  }
  function processAfterArrayValue(char, i) {
    switch (char) {
      case ",": {
        stack.pop();
        stack.push("INSIDE_ARRAY_AFTER_COMMA");
        break;
      }
      case "]": {
        lastValidIndex = i;
        stack.pop();
        break;
      }
    }
  }
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const currentState = stack[stack.length - 1];
    switch (currentState) {
      case "ROOT":
        processValueStart(char, i, "FINISH");
        break;
      case "INSIDE_OBJECT_START": {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push("INSIDE_OBJECT_KEY");
            break;
          }
          case "}": {
            lastValidIndex = i;
            stack.pop();
            break;
          }
        }
        break;
      }
      case "INSIDE_OBJECT_AFTER_COMMA": {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push("INSIDE_OBJECT_KEY");
            break;
          }
        }
        break;
      }
      case "INSIDE_OBJECT_KEY": {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push("INSIDE_OBJECT_AFTER_KEY");
            break;
          }
        }
        break;
      }
      case "INSIDE_OBJECT_AFTER_KEY": {
        switch (char) {
          case ":": {
            stack.pop();
            stack.push("INSIDE_OBJECT_BEFORE_VALUE");
            break;
          }
        }
        break;
      }
      case "INSIDE_OBJECT_BEFORE_VALUE": {
        processValueStart(char, i, "INSIDE_OBJECT_AFTER_VALUE");
        break;
      }
      case "INSIDE_OBJECT_AFTER_VALUE": {
        processAfterObjectValue(char, i);
        break;
      }
      case "INSIDE_STRING": {
        switch (char) {
          case '"': {
            stack.pop();
            lastValidIndex = i;
            break;
          }
          case "\\": {
            stack.push("INSIDE_STRING_ESCAPE");
            break;
          }
          default: {
            lastValidIndex = i;
          }
        }
        break;
      }
      case "INSIDE_ARRAY_START": {
        switch (char) {
          case "]": {
            lastValidIndex = i;
            stack.pop();
            break;
          }
          default: {
            lastValidIndex = i;
            processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
            break;
          }
        }
        break;
      }
      case "INSIDE_ARRAY_AFTER_VALUE": {
        switch (char) {
          case ",": {
            stack.pop();
            stack.push("INSIDE_ARRAY_AFTER_COMMA");
            break;
          }
          case "]": {
            lastValidIndex = i;
            stack.pop();
            break;
          }
          default: {
            lastValidIndex = i;
            break;
          }
        }
        break;
      }
      case "INSIDE_ARRAY_AFTER_COMMA": {
        processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
        break;
      }
      case "INSIDE_STRING_ESCAPE": {
        stack.pop();
        if (char === "u") {
          unicodeEscapeDigits = 0;
          stack.push("INSIDE_STRING_UNICODE_ESCAPE");
        } else {
          lastValidIndex = i;
        }
        break;
      }
      case "INSIDE_STRING_UNICODE_ESCAPE": {
        if (isHexDigit(char)) {
          unicodeEscapeDigits++;
          if (unicodeEscapeDigits === 4) {
            stack.pop();
            lastValidIndex = i;
          }
        }
        break;
      }
      case "INSIDE_NUMBER": {
        switch (char) {
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9": {
            lastValidIndex = i;
            break;
          }
          case "e":
          case "E":
          case "-":
          case ".": {
            break;
          }
          case ",": {
            stack.pop();
            if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") {
              processAfterArrayValue(char, i);
            }
            if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") {
              processAfterObjectValue(char, i);
            }
            break;
          }
          case "}": {
            stack.pop();
            if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") {
              processAfterObjectValue(char, i);
            }
            break;
          }
          case "]": {
            stack.pop();
            if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") {
              processAfterArrayValue(char, i);
            }
            break;
          }
          default: {
            stack.pop();
            break;
          }
        }
        break;
      }
      case "INSIDE_LITERAL": {
        const partialLiteral = input.substring(literalStart, i + 1);
        if (!"false".startsWith(partialLiteral) && !"true".startsWith(partialLiteral) && !"null".startsWith(partialLiteral)) {
          stack.pop();
          if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") {
            processAfterObjectValue(char, i);
          } else if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") {
            processAfterArrayValue(char, i);
          }
        } else {
          lastValidIndex = i;
        }
        break;
      }
    }
  }
  let result = input.slice(0, lastValidIndex + 1);
  for (let i = stack.length - 1; i >= 0; i--) {
    const state = stack[i];
    switch (state) {
      case "INSIDE_STRING": {
        result += '"';
        break;
      }
      case "INSIDE_OBJECT_KEY":
      case "INSIDE_OBJECT_AFTER_KEY":
      case "INSIDE_OBJECT_AFTER_COMMA":
      case "INSIDE_OBJECT_START":
      case "INSIDE_OBJECT_BEFORE_VALUE":
      case "INSIDE_OBJECT_AFTER_VALUE": {
        result += "}";
        break;
      }
      case "INSIDE_ARRAY_START":
      case "INSIDE_ARRAY_AFTER_COMMA":
      case "INSIDE_ARRAY_AFTER_VALUE": {
        result += "]";
        break;
      }
      case "INSIDE_LITERAL": {
        const partialLiteral = input.substring(literalStart, input.length);
        if ("true".startsWith(partialLiteral)) {
          result += "true".slice(partialLiteral.length);
        } else if ("false".startsWith(partialLiteral)) {
          result += "false".slice(partialLiteral.length);
        } else if ("null".startsWith(partialLiteral)) {
          result += "null".slice(partialLiteral.length);
        }
      }
    }
  }
  return result;
}
async function parsePartialJson(jsonText) {
  if (jsonText === void 0) {
    return { value: void 0, state: "undefined-input" };
  }
  let result = await safeParseJSON({ text: jsonText });
  if (result.success) {
    return { value: result.value, state: "successful-parse" };
  }
  result = await safeParseJSON({ text: fixJson(jsonText) });
  if (result.success) {
    return { value: result.value, state: "repaired-parse" };
  }
  return { value: void 0, state: "failed-parse" };
}
var text = () => ({
  name: "text",
  responseFormat: Promise.resolve({ type: "text" }),
  async parseCompleteOutput({ text: text2 }) {
    return text2;
  },
  async parsePartialOutput({ text: text2 }) {
    return { partial: text2 };
  },
  createElementStreamTransform() {
    return void 0;
  }
});
var object = ({
  schema: inputSchema,
  name: name22,
  description
}) => {
  const schema = asSchema(inputSchema);
  return {
    name: "object",
    responseFormat: resolve(schema.jsonSchema).then((jsonSchema2) => ({
      type: "json",
      schema: jsonSchema2,
      ...name22 != null && { name: name22 },
      ...description != null && { description }
    })),
    async parseCompleteOutput({ text: text2 }, context2) {
      const parseResult = await safeParseJSON({ text: text2 });
      if (!parseResult.success) {
        throw new NoObjectGeneratedError({
          message: "No object generated: could not parse the response.",
          cause: parseResult.error,
          text: text2,
          response: context2.response,
          usage: context2.usage,
          finishReason: context2.finishReason
        });
      }
      const validationResult = await safeValidateTypes({
        value: parseResult.value,
        schema
      });
      if (!validationResult.success) {
        throw new NoObjectGeneratedError({
          message: "No object generated: response did not match schema.",
          cause: validationResult.error,
          text: text2,
          response: context2.response,
          usage: context2.usage,
          finishReason: context2.finishReason
        });
      }
      return validationResult.value;
    },
    async parsePartialOutput({ text: text2 }) {
      const result = await parsePartialJson(text2);
      switch (result.state) {
        case "failed-parse":
        case "undefined-input": {
          return void 0;
        }
        case "repaired-parse":
        case "successful-parse": {
          return {
            // Note: currently no validation of partial results:
            partial: result.value
          };
        }
      }
    },
    createElementStreamTransform() {
      return void 0;
    }
  };
};
var array = ({
  element: inputElementSchema,
  name: name22,
  description
}) => {
  const elementSchema = asSchema(inputElementSchema);
  return {
    name: "array",
    // JSON schema that describes an array of elements:
    responseFormat: resolve(elementSchema.jsonSchema).then((jsonSchema2) => {
      const { $schema, ...itemSchema } = jsonSchema2;
      return {
        type: "json",
        schema: {
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          properties: {
            elements: { type: "array", items: itemSchema }
          },
          required: ["elements"],
          additionalProperties: false
        },
        ...name22 != null && { name: name22 },
        ...description != null && { description }
      };
    }),
    async parseCompleteOutput({ text: text2 }, context2) {
      const parseResult = await safeParseJSON({ text: text2 });
      if (!parseResult.success) {
        throw new NoObjectGeneratedError({
          message: "No object generated: could not parse the response.",
          cause: parseResult.error,
          text: text2,
          response: context2.response,
          usage: context2.usage,
          finishReason: context2.finishReason
        });
      }
      const outerValue = parseResult.value;
      if (outerValue == null || typeof outerValue !== "object" || !("elements" in outerValue) || !Array.isArray(outerValue.elements)) {
        throw new NoObjectGeneratedError({
          message: "No object generated: response did not match schema.",
          cause: new TypeValidationError({
            value: outerValue,
            cause: "response must be an object with an elements array"
          }),
          text: text2,
          response: context2.response,
          usage: context2.usage,
          finishReason: context2.finishReason
        });
      }
      for (const element of outerValue.elements) {
        const validationResult = await safeValidateTypes({
          value: element,
          schema: elementSchema
        });
        if (!validationResult.success) {
          throw new NoObjectGeneratedError({
            message: "No object generated: response did not match schema.",
            cause: validationResult.error,
            text: text2,
            response: context2.response,
            usage: context2.usage,
            finishReason: context2.finishReason
          });
        }
      }
      return outerValue.elements;
    },
    async parsePartialOutput({ text: text2 }) {
      const result = await parsePartialJson(text2);
      switch (result.state) {
        case "failed-parse":
        case "undefined-input": {
          return void 0;
        }
        case "repaired-parse":
        case "successful-parse": {
          const outerValue = result.value;
          if (outerValue == null || typeof outerValue !== "object" || !("elements" in outerValue) || !Array.isArray(outerValue.elements)) {
            return void 0;
          }
          const rawElements = result.state === "repaired-parse" && outerValue.elements.length > 0 ? outerValue.elements.slice(0, -1) : outerValue.elements;
          const parsedElements = [];
          for (const rawElement of rawElements) {
            const validationResult = await safeValidateTypes({
              value: rawElement,
              schema: elementSchema
            });
            if (validationResult.success) {
              parsedElements.push(validationResult.value);
            }
          }
          return { partial: parsedElements };
        }
      }
    },
    createElementStreamTransform() {
      let publishedElements = 0;
      return new TransformStream({
        transform({ partialOutput }, controller) {
          if (partialOutput != null) {
            for (; publishedElements < partialOutput.length; publishedElements++) {
              controller.enqueue(partialOutput[publishedElements]);
            }
          }
        }
      });
    }
  };
};
var choice = ({
  options: choiceOptions,
  name: name22,
  description
}) => {
  return {
    name: "choice",
    // JSON schema that describes an enumeration:
    responseFormat: Promise.resolve({
      type: "json",
      schema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          result: { type: "string", enum: choiceOptions }
        },
        required: ["result"],
        additionalProperties: false
      },
      ...name22 != null && { name: name22 },
      ...description != null && { description }
    }),
    async parseCompleteOutput({ text: text2 }, context2) {
      const parseResult = await safeParseJSON({ text: text2 });
      if (!parseResult.success) {
        throw new NoObjectGeneratedError({
          message: "No object generated: could not parse the response.",
          cause: parseResult.error,
          text: text2,
          response: context2.response,
          usage: context2.usage,
          finishReason: context2.finishReason
        });
      }
      const outerValue = parseResult.value;
      if (outerValue == null || typeof outerValue !== "object" || !("result" in outerValue) || typeof outerValue.result !== "string" || !choiceOptions.includes(outerValue.result)) {
        throw new NoObjectGeneratedError({
          message: "No object generated: response did not match schema.",
          cause: new TypeValidationError({
            value: outerValue,
            cause: "response must be an object that contains a choice value."
          }),
          text: text2,
          response: context2.response,
          usage: context2.usage,
          finishReason: context2.finishReason
        });
      }
      return outerValue.result;
    },
    async parsePartialOutput({ text: text2 }) {
      const result = await parsePartialJson(text2);
      switch (result.state) {
        case "failed-parse":
        case "undefined-input": {
          return void 0;
        }
        case "repaired-parse":
        case "successful-parse": {
          const outerValue = result.value;
          if (outerValue == null || typeof outerValue !== "object" || !("result" in outerValue) || typeof outerValue.result !== "string") {
            return void 0;
          }
          const potentialMatches = choiceOptions.filter(
            (choiceOption) => choiceOption.startsWith(outerValue.result)
          );
          if (result.state === "successful-parse") {
            return potentialMatches.includes(outerValue.result) ? { partial: outerValue.result } : void 0;
          } else {
            return potentialMatches.length === 1 ? { partial: potentialMatches[0] } : void 0;
          }
        }
      }
    },
    createElementStreamTransform() {
      return void 0;
    }
  };
};
var json = ({
  name: name22,
  description
} = {}) => {
  return {
    name: "json",
    responseFormat: Promise.resolve({
      type: "json",
      ...name22 != null && { name: name22 },
      ...description != null && { description }
    }),
    async parseCompleteOutput({ text: text2 }, context2) {
      const parseResult = await safeParseJSON({ text: text2 });
      if (!parseResult.success) {
        throw new NoObjectGeneratedError({
          message: "No object generated: could not parse the response.",
          cause: parseResult.error,
          text: text2,
          response: context2.response,
          usage: context2.usage,
          finishReason: context2.finishReason
        });
      }
      return parseResult.value;
    },
    async parsePartialOutput({ text: text2 }) {
      const result = await parsePartialJson(text2);
      switch (result.state) {
        case "failed-parse":
        case "undefined-input": {
          return void 0;
        }
        case "repaired-parse":
        case "successful-parse": {
          return result.value === void 0 ? void 0 : { partial: result.value };
        }
      }
    },
    createElementStreamTransform() {
      return void 0;
    }
  };
};
createIdGenerator({
  prefix: "aitxt",
  size: 24
});
(class extends TransformStream {
  constructor() {
    super({
      transform(part, controller) {
        controller.enqueue(`data: ${JSON.stringify(part)}

`);
      },
      flush(controller) {
        controller.enqueue("data: [DONE]\n\n");
      }
    });
  }
});
var toolMetadataSchema = record(
  string(),
  jsonValueSchema.optional()
);
var uiMessageChunkSchema = lazySchema(
  () => zodSchema(
    union([
      strictObject({
        type: literal("text-start"),
        id: string(),
        providerMetadata: providerMetadataSchema.optional()
      }),
      strictObject({
        type: literal("text-delta"),
        id: string(),
        delta: string(),
        providerMetadata: providerMetadataSchema.optional()
      }),
      strictObject({
        type: literal("text-end"),
        id: string(),
        providerMetadata: providerMetadataSchema.optional()
      }),
      strictObject({
        type: literal("error"),
        errorText: string()
      }),
      strictObject({
        type: literal("tool-input-start"),
        toolCallId: string(),
        toolName: string(),
        providerExecuted: boolean().optional(),
        providerMetadata: providerMetadataSchema.optional(),
        toolMetadata: toolMetadataSchema.optional(),
        dynamic: boolean().optional(),
        title: string().optional()
      }),
      strictObject({
        type: literal("tool-input-delta"),
        toolCallId: string(),
        inputTextDelta: string()
      }),
      strictObject({
        type: literal("tool-input-available"),
        toolCallId: string(),
        toolName: string(),
        input: unknown(),
        providerExecuted: boolean().optional(),
        providerMetadata: providerMetadataSchema.optional(),
        toolMetadata: toolMetadataSchema.optional(),
        dynamic: boolean().optional(),
        title: string().optional()
      }),
      strictObject({
        type: literal("tool-input-error"),
        toolCallId: string(),
        toolName: string(),
        input: unknown(),
        providerExecuted: boolean().optional(),
        providerMetadata: providerMetadataSchema.optional(),
        toolMetadata: toolMetadataSchema.optional(),
        dynamic: boolean().optional(),
        errorText: string(),
        title: string().optional()
      }),
      strictObject({
        type: literal("tool-approval-request"),
        approvalId: string(),
        toolCallId: string(),
        signature: string().optional()
      }),
      strictObject({
        type: literal("tool-output-available"),
        toolCallId: string(),
        output: unknown(),
        providerExecuted: boolean().optional(),
        providerMetadata: providerMetadataSchema.optional(),
        toolMetadata: toolMetadataSchema.optional(),
        dynamic: boolean().optional(),
        preliminary: boolean().optional()
      }),
      strictObject({
        type: literal("tool-output-error"),
        toolCallId: string(),
        errorText: string(),
        providerExecuted: boolean().optional(),
        providerMetadata: providerMetadataSchema.optional(),
        toolMetadata: toolMetadataSchema.optional(),
        dynamic: boolean().optional()
      }),
      strictObject({
        type: literal("tool-output-denied"),
        toolCallId: string()
      }),
      strictObject({
        type: literal("reasoning-start"),
        id: string(),
        providerMetadata: providerMetadataSchema.optional()
      }),
      strictObject({
        type: literal("reasoning-delta"),
        id: string(),
        delta: string(),
        providerMetadata: providerMetadataSchema.optional()
      }),
      strictObject({
        type: literal("reasoning-end"),
        id: string(),
        providerMetadata: providerMetadataSchema.optional()
      }),
      strictObject({
        type: literal("source-url"),
        sourceId: string(),
        url: string(),
        title: string().optional(),
        providerMetadata: providerMetadataSchema.optional()
      }),
      strictObject({
        type: literal("source-document"),
        sourceId: string(),
        mediaType: string(),
        title: string(),
        filename: string().optional(),
        providerMetadata: providerMetadataSchema.optional()
      }),
      strictObject({
        type: literal("file"),
        url: string(),
        mediaType: string(),
        providerMetadata: providerMetadataSchema.optional()
      }),
      strictObject({
        type: custom(
          (value) => typeof value === "string" && value.startsWith("data-"),
          { message: 'Type must start with "data-"' }
        ),
        id: string().optional(),
        data: unknown(),
        transient: boolean().optional()
      }),
      strictObject({
        type: literal("start-step")
      }),
      strictObject({
        type: literal("finish-step")
      }),
      strictObject({
        type: literal("start"),
        messageId: string().optional(),
        messageMetadata: unknown().optional()
      }),
      strictObject({
        type: literal("finish"),
        finishReason: _enum([
          "stop",
          "length",
          "content-filter",
          "tool-calls",
          "error",
          "other"
        ]).optional(),
        messageMetadata: unknown().optional()
      }),
      strictObject({
        type: literal("abort"),
        reason: string().optional()
      }),
      strictObject({
        type: literal("message-metadata"),
        messageMetadata: unknown()
      })
    ])
  )
);
function isDataUIMessageChunk(chunk) {
  return chunk.type.startsWith("data-");
}
function createIdMap() {
  return /* @__PURE__ */ Object.create(null);
}
function isStaticToolUIPart(part) {
  return part.type.startsWith("tool-");
}
function isDynamicToolUIPart(part) {
  return part.type === "dynamic-tool";
}
function isToolUIPart(part) {
  return isStaticToolUIPart(part) || isDynamicToolUIPart(part);
}
function getStaticToolName(part) {
  return part.type.split("-").slice(1).join("-");
}
function createStreamingUIMessageState({
  lastMessage,
  messageId
}) {
  return {
    message: (lastMessage == null ? void 0 : lastMessage.role) === "assistant" ? lastMessage : {
      id: messageId,
      metadata: void 0,
      role: "assistant",
      parts: []
    },
    activeTextParts: createIdMap(),
    activeReasoningParts: createIdMap(),
    partialToolCalls: createIdMap()
  };
}
function processUIMessageStream({
  stream,
  messageMetadataSchema,
  dataPartSchemas,
  runUpdateMessageJob,
  onError,
  onToolCall,
  onData
}) {
  return stream.pipeThrough(
    new TransformStream({
      async transform(chunk, controller) {
        await runUpdateMessageJob(async ({ state, write }) => {
          var _a22, _b, _c, _d;
          function getToolInvocation(toolCallId) {
            const toolInvocations = state.message.parts.filter(isToolUIPart);
            const toolInvocation = toolInvocations.find(
              (invocation) => invocation.toolCallId === toolCallId
            );
            if (toolInvocation == null) {
              throw new UIMessageStreamError({
                chunkType: "tool-invocation",
                chunkId: toolCallId,
                message: `No tool invocation found for tool call ID "${toolCallId}".`
              });
            }
            return toolInvocation;
          }
          function updateToolPart(options) {
            var _a23;
            const part = state.message.parts.find(
              (part2) => isStaticToolUIPart(part2) && part2.toolCallId === options.toolCallId
            );
            const anyOptions = options;
            const anyPart = part;
            if (part != null) {
              part.state = options.state;
              anyPart.input = anyOptions.input;
              anyPart.output = anyOptions.output;
              anyPart.errorText = anyOptions.errorText;
              anyPart.rawInput = anyOptions.rawInput;
              anyPart.preliminary = anyOptions.preliminary;
              if (options.title !== void 0) {
                anyPart.title = options.title;
              }
              if (options.toolMetadata !== void 0) {
                anyPart.toolMetadata = options.toolMetadata;
              }
              anyPart.providerExecuted = (_a23 = anyOptions.providerExecuted) != null ? _a23 : part.providerExecuted;
              const providerMetadata = anyOptions.providerMetadata;
              if (providerMetadata != null) {
                if (options.state === "output-available" || options.state === "output-error") {
                  const resultPart = part;
                  resultPart.resultProviderMetadata = providerMetadata;
                } else {
                  part.callProviderMetadata = providerMetadata;
                }
              }
            } else {
              state.message.parts.push({
                type: `tool-${options.toolName}`,
                toolCallId: options.toolCallId,
                state: options.state,
                title: options.title,
                ...options.toolMetadata !== void 0 ? { toolMetadata: options.toolMetadata } : {},
                input: anyOptions.input,
                output: anyOptions.output,
                rawInput: anyOptions.rawInput,
                errorText: anyOptions.errorText,
                providerExecuted: anyOptions.providerExecuted,
                preliminary: anyOptions.preliminary,
                ...anyOptions.providerMetadata != null && (options.state === "output-available" || options.state === "output-error") ? { resultProviderMetadata: anyOptions.providerMetadata } : {},
                ...anyOptions.providerMetadata != null && !(options.state === "output-available" || options.state === "output-error") ? { callProviderMetadata: anyOptions.providerMetadata } : {}
              });
            }
          }
          function updateDynamicToolPart(options) {
            var _a23, _b2;
            const part = state.message.parts.find(
              (part2) => part2.type === "dynamic-tool" && part2.toolCallId === options.toolCallId
            );
            const anyOptions = options;
            const anyPart = part;
            if (part != null) {
              part.state = options.state;
              anyPart.toolName = options.toolName;
              anyPart.input = anyOptions.input;
              anyPart.output = anyOptions.output;
              anyPart.errorText = anyOptions.errorText;
              anyPart.rawInput = (_a23 = anyOptions.rawInput) != null ? _a23 : anyPart.rawInput;
              anyPart.preliminary = anyOptions.preliminary;
              if (options.title !== void 0) {
                anyPart.title = options.title;
              }
              if (options.toolMetadata !== void 0) {
                anyPart.toolMetadata = options.toolMetadata;
              }
              anyPart.providerExecuted = (_b2 = anyOptions.providerExecuted) != null ? _b2 : part.providerExecuted;
              const providerMetadata = anyOptions.providerMetadata;
              if (providerMetadata != null) {
                if (options.state === "output-available" || options.state === "output-error") {
                  const resultPart = part;
                  resultPart.resultProviderMetadata = providerMetadata;
                } else {
                  part.callProviderMetadata = providerMetadata;
                }
              }
            } else {
              state.message.parts.push({
                type: "dynamic-tool",
                toolName: options.toolName,
                toolCallId: options.toolCallId,
                state: options.state,
                input: anyOptions.input,
                output: anyOptions.output,
                errorText: anyOptions.errorText,
                preliminary: anyOptions.preliminary,
                providerExecuted: anyOptions.providerExecuted,
                title: options.title,
                ...options.toolMetadata !== void 0 ? { toolMetadata: options.toolMetadata } : {},
                ...anyOptions.providerMetadata != null && (options.state === "output-available" || options.state === "output-error") ? { resultProviderMetadata: anyOptions.providerMetadata } : {},
                ...anyOptions.providerMetadata != null && !(options.state === "output-available" || options.state === "output-error") ? { callProviderMetadata: anyOptions.providerMetadata } : {}
              });
            }
          }
          async function updateMessageMetadata(metadata) {
            if (metadata != null) {
              const mergedMetadata = state.message.metadata != null ? mergeObjects(state.message.metadata, metadata) : metadata;
              if (messageMetadataSchema != null) {
                await validateTypes({
                  value: mergedMetadata,
                  schema: messageMetadataSchema,
                  context: {
                    field: "message.metadata",
                    entityId: state.message.id
                  }
                });
              }
              state.message.metadata = mergedMetadata;
            }
          }
          switch (chunk.type) {
            case "text-start": {
              const textPart = {
                type: "text",
                text: "",
                providerMetadata: chunk.providerMetadata,
                state: "streaming"
              };
              state.activeTextParts[chunk.id] = textPart;
              state.message.parts.push(textPart);
              write();
              break;
            }
            case "text-delta": {
              const textPart = state.activeTextParts[chunk.id];
              if (textPart == null) {
                throw new UIMessageStreamError({
                  chunkType: "text-delta",
                  chunkId: chunk.id,
                  message: `Received text-delta for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-delta" chunks.`
                });
              }
              textPart.text += chunk.delta;
              textPart.providerMetadata = (_a22 = chunk.providerMetadata) != null ? _a22 : textPart.providerMetadata;
              write();
              break;
            }
            case "text-end": {
              const textPart = state.activeTextParts[chunk.id];
              if (textPart == null) {
                throw new UIMessageStreamError({
                  chunkType: "text-end",
                  chunkId: chunk.id,
                  message: `Received text-end for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-end" chunks.`
                });
              }
              textPart.state = "done";
              textPart.providerMetadata = (_b = chunk.providerMetadata) != null ? _b : textPart.providerMetadata;
              delete state.activeTextParts[chunk.id];
              write();
              break;
            }
            case "reasoning-start": {
              const reasoningPart = {
                type: "reasoning",
                text: "",
                providerMetadata: chunk.providerMetadata,
                state: "streaming"
              };
              state.activeReasoningParts[chunk.id] = reasoningPart;
              state.message.parts.push(reasoningPart);
              write();
              break;
            }
            case "reasoning-delta": {
              const reasoningPart = state.activeReasoningParts[chunk.id];
              if (reasoningPart == null) {
                throw new UIMessageStreamError({
                  chunkType: "reasoning-delta",
                  chunkId: chunk.id,
                  message: `Received reasoning-delta for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-delta" chunks.`
                });
              }
              reasoningPart.text += chunk.delta;
              reasoningPart.providerMetadata = (_c = chunk.providerMetadata) != null ? _c : reasoningPart.providerMetadata;
              write();
              break;
            }
            case "reasoning-end": {
              const reasoningPart = state.activeReasoningParts[chunk.id];
              if (reasoningPart == null) {
                throw new UIMessageStreamError({
                  chunkType: "reasoning-end",
                  chunkId: chunk.id,
                  message: `Received reasoning-end for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-end" chunks.`
                });
              }
              reasoningPart.providerMetadata = (_d = chunk.providerMetadata) != null ? _d : reasoningPart.providerMetadata;
              reasoningPart.state = "done";
              delete state.activeReasoningParts[chunk.id];
              write();
              break;
            }
            case "file": {
              state.message.parts.push({
                type: "file",
                mediaType: chunk.mediaType,
                url: chunk.url,
                ...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {}
              });
              write();
              break;
            }
            case "source-url": {
              state.message.parts.push({
                type: "source-url",
                sourceId: chunk.sourceId,
                url: chunk.url,
                title: chunk.title,
                providerMetadata: chunk.providerMetadata
              });
              write();
              break;
            }
            case "source-document": {
              state.message.parts.push({
                type: "source-document",
                sourceId: chunk.sourceId,
                mediaType: chunk.mediaType,
                title: chunk.title,
                filename: chunk.filename,
                providerMetadata: chunk.providerMetadata
              });
              write();
              break;
            }
            case "tool-input-start": {
              const toolInvocations = state.message.parts.filter(isStaticToolUIPart);
              state.partialToolCalls[chunk.toolCallId] = {
                text: "",
                toolName: chunk.toolName,
                index: toolInvocations.length,
                dynamic: chunk.dynamic,
                title: chunk.title,
                toolMetadata: chunk.toolMetadata
              };
              if (chunk.dynamic) {
                updateDynamicToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  state: "input-streaming",
                  input: void 0,
                  providerExecuted: chunk.providerExecuted,
                  title: chunk.title,
                  toolMetadata: chunk.toolMetadata,
                  providerMetadata: chunk.providerMetadata
                });
              } else {
                updateToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  state: "input-streaming",
                  input: void 0,
                  providerExecuted: chunk.providerExecuted,
                  title: chunk.title,
                  toolMetadata: chunk.toolMetadata,
                  providerMetadata: chunk.providerMetadata
                });
              }
              write();
              break;
            }
            case "tool-input-delta": {
              const partialToolCall = state.partialToolCalls[chunk.toolCallId];
              if (partialToolCall == null) {
                throw new UIMessageStreamError({
                  chunkType: "tool-input-delta",
                  chunkId: chunk.toolCallId,
                  message: `Received tool-input-delta for missing tool call with ID "${chunk.toolCallId}". Ensure a "tool-input-start" chunk is sent before any "tool-input-delta" chunks.`
                });
              }
              partialToolCall.text += chunk.inputTextDelta;
              const { value: partialArgs } = await parsePartialJson(
                partialToolCall.text
              );
              if (partialToolCall.dynamic) {
                updateDynamicToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: partialToolCall.toolName,
                  state: "input-streaming",
                  input: partialArgs,
                  title: partialToolCall.title,
                  toolMetadata: partialToolCall.toolMetadata
                });
              } else {
                updateToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: partialToolCall.toolName,
                  state: "input-streaming",
                  input: partialArgs,
                  title: partialToolCall.title,
                  toolMetadata: partialToolCall.toolMetadata
                });
              }
              write();
              break;
            }
            case "tool-input-available": {
              if (chunk.dynamic) {
                updateDynamicToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  state: "input-available",
                  input: chunk.input,
                  providerExecuted: chunk.providerExecuted,
                  providerMetadata: chunk.providerMetadata,
                  title: chunk.title,
                  toolMetadata: chunk.toolMetadata
                });
              } else {
                updateToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  state: "input-available",
                  input: chunk.input,
                  providerExecuted: chunk.providerExecuted,
                  providerMetadata: chunk.providerMetadata,
                  title: chunk.title,
                  toolMetadata: chunk.toolMetadata
                });
              }
              write();
              if (onToolCall && !chunk.providerExecuted) {
                await onToolCall({
                  toolCall: chunk
                });
              }
              break;
            }
            case "tool-input-error": {
              const existingPart = state.message.parts.filter(isToolUIPart).find((p) => p.toolCallId === chunk.toolCallId);
              const isDynamic = existingPart != null ? existingPart.type === "dynamic-tool" : !!chunk.dynamic;
              if (isDynamic) {
                updateDynamicToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  state: "output-error",
                  input: chunk.input,
                  errorText: chunk.errorText,
                  providerExecuted: chunk.providerExecuted,
                  providerMetadata: chunk.providerMetadata,
                  toolMetadata: chunk.toolMetadata
                });
              } else {
                updateToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  state: "output-error",
                  input: void 0,
                  rawInput: chunk.input,
                  errorText: chunk.errorText,
                  providerExecuted: chunk.providerExecuted,
                  providerMetadata: chunk.providerMetadata,
                  toolMetadata: chunk.toolMetadata
                });
              }
              write();
              break;
            }
            case "tool-approval-request": {
              const toolInvocation = getToolInvocation(chunk.toolCallId);
              toolInvocation.state = "approval-requested";
              toolInvocation.approval = {
                id: chunk.approvalId,
                ...chunk.signature != null ? { signature: chunk.signature } : {}
              };
              write();
              break;
            }
            case "tool-output-denied": {
              const toolInvocation = getToolInvocation(chunk.toolCallId);
              toolInvocation.state = "output-denied";
              write();
              break;
            }
            case "tool-output-available": {
              const toolInvocation = getToolInvocation(chunk.toolCallId);
              if (toolInvocation.type === "dynamic-tool") {
                updateDynamicToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: toolInvocation.toolName,
                  state: "output-available",
                  input: toolInvocation.input,
                  output: chunk.output,
                  preliminary: chunk.preliminary,
                  providerExecuted: chunk.providerExecuted,
                  providerMetadata: chunk.providerMetadata,
                  title: toolInvocation.title,
                  toolMetadata: toolInvocation.toolMetadata
                });
              } else {
                updateToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: getStaticToolName(toolInvocation),
                  state: "output-available",
                  input: toolInvocation.input,
                  output: chunk.output,
                  providerExecuted: chunk.providerExecuted,
                  preliminary: chunk.preliminary,
                  providerMetadata: chunk.providerMetadata,
                  title: toolInvocation.title,
                  toolMetadata: toolInvocation.toolMetadata
                });
              }
              write();
              break;
            }
            case "tool-output-error": {
              const toolInvocation = getToolInvocation(chunk.toolCallId);
              if (toolInvocation.type === "dynamic-tool") {
                updateDynamicToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: toolInvocation.toolName,
                  state: "output-error",
                  input: toolInvocation.input,
                  errorText: chunk.errorText,
                  providerExecuted: chunk.providerExecuted,
                  providerMetadata: chunk.providerMetadata,
                  title: toolInvocation.title,
                  toolMetadata: toolInvocation.toolMetadata
                });
              } else {
                updateToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: getStaticToolName(toolInvocation),
                  state: "output-error",
                  input: toolInvocation.input,
                  rawInput: toolInvocation.rawInput,
                  errorText: chunk.errorText,
                  providerExecuted: chunk.providerExecuted,
                  providerMetadata: chunk.providerMetadata,
                  title: toolInvocation.title,
                  toolMetadata: toolInvocation.toolMetadata
                });
              }
              write();
              break;
            }
            case "start-step": {
              state.message.parts.push({ type: "step-start" });
              break;
            }
            case "finish-step": {
              state.activeTextParts = createIdMap();
              state.activeReasoningParts = createIdMap();
              break;
            }
            case "start": {
              if (chunk.messageId != null) {
                state.message.id = chunk.messageId;
              }
              await updateMessageMetadata(chunk.messageMetadata);
              if (chunk.messageId != null || chunk.messageMetadata != null) {
                write();
              }
              break;
            }
            case "finish": {
              if (chunk.finishReason != null) {
                state.finishReason = chunk.finishReason;
              }
              await updateMessageMetadata(chunk.messageMetadata);
              if (chunk.messageMetadata != null) {
                write();
              }
              break;
            }
            case "message-metadata": {
              await updateMessageMetadata(chunk.messageMetadata);
              if (chunk.messageMetadata != null) {
                write();
              }
              break;
            }
            case "error": {
              onError == null ? void 0 : onError(new Error(chunk.errorText));
              break;
            }
            default: {
              if (isDataUIMessageChunk(chunk)) {
                if ((dataPartSchemas == null ? void 0 : dataPartSchemas[chunk.type]) != null) {
                  const partIdx = state.message.parts.findIndex(
                    (p) => "id" in p && "data" in p && p.id === chunk.id && p.type === chunk.type
                  );
                  const actualPartIdx = partIdx >= 0 ? partIdx : state.message.parts.length;
                  await validateTypes({
                    value: chunk.data,
                    schema: dataPartSchemas[chunk.type],
                    context: {
                      field: `message.parts[${actualPartIdx}].data`,
                      entityName: chunk.type,
                      entityId: chunk.id
                    }
                  });
                }
                const dataChunk = chunk;
                if (dataChunk.transient) {
                  onData == null ? void 0 : onData(dataChunk);
                  break;
                }
                const existingUIPart = dataChunk.id != null ? state.message.parts.find(
                  (chunkArg) => dataChunk.type === chunkArg.type && dataChunk.id === chunkArg.id
                ) : void 0;
                if (existingUIPart != null) {
                  existingUIPart.data = dataChunk.data;
                } else {
                  state.message.parts.push(dataChunk);
                }
                onData == null ? void 0 : onData(dataChunk);
                write();
              }
            }
          }
          controller.enqueue(chunk);
        });
      }
    })
  );
}
async function consumeStream({
  stream,
  onError
}) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done } = await reader.read();
      if (done)
        break;
    }
  } catch (error) {
    onError == null ? void 0 : onError(error);
  } finally {
    reader.releaseLock();
  }
}
createIdGenerator({
  prefix: "aitxt",
  size: 24
});
record(
  string(),
  jsonValueSchema.optional()
);
createIdGenerator({ prefix: "aiobj", size: 24 });
var SerialJobExecutor = class {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }
  async processQueue() {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    while (this.queue.length > 0) {
      await this.queue[0]();
      this.queue.shift();
    }
    this.isProcessing = false;
  }
  async run(job) {
    return new Promise((resolve3, reject) => {
      this.queue.push(async () => {
        try {
          await job();
          resolve3();
        } catch (error) {
          reject(error);
        }
      });
      void this.processQueue();
    });
  }
};
createIdGenerator({ prefix: "aiobj", size: 24 });
async function convertFileListToFileUIParts(files) {
  if (files == null) {
    return [];
  }
  if (!globalThis.FileList || !(files instanceof globalThis.FileList)) {
    throw new Error("FileList is not supported in the current environment");
  }
  return Promise.all(
    Array.from(files).map(async (file) => {
      const { name: name22, type } = file;
      const dataUrl = await new Promise((resolve3, reject) => {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          var _a22;
          resolve3((_a22 = readerEvent.target) == null ? void 0 : _a22.result);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
      return {
        type: "file",
        mediaType: type,
        filename: name22,
        url: dataUrl
      };
    })
  );
}
var HttpChatTransport = class {
  constructor({
    api = "/api/chat",
    credentials,
    headers,
    body,
    fetch: fetch2,
    prepareSendMessagesRequest,
    prepareReconnectToStreamRequest
  }) {
    this.api = api;
    this.credentials = credentials;
    this.headers = headers;
    this.body = body;
    this.fetch = fetch2;
    this.prepareSendMessagesRequest = prepareSendMessagesRequest;
    this.prepareReconnectToStreamRequest = prepareReconnectToStreamRequest;
  }
  async sendMessages({
    abortSignal,
    ...options
  }) {
    var _a22, _b, _c, _d, _e;
    const resolvedBody = await resolve(this.body);
    const resolvedHeaders = await resolve(this.headers);
    const resolvedCredentials = await resolve(this.credentials);
    const baseHeaders = {
      ...normalizeHeaders(resolvedHeaders),
      ...normalizeHeaders(options.headers)
    };
    const preparedRequest = await ((_a22 = this.prepareSendMessagesRequest) == null ? void 0 : _a22.call(this, {
      api: this.api,
      id: options.chatId,
      messages: options.messages,
      body: { ...resolvedBody, ...options.body },
      headers: baseHeaders,
      credentials: resolvedCredentials,
      requestMetadata: options.metadata,
      trigger: options.trigger,
      messageId: options.messageId
    }));
    const api = (_b = preparedRequest == null ? void 0 : preparedRequest.api) != null ? _b : this.api;
    const headers = (preparedRequest == null ? void 0 : preparedRequest.headers) !== void 0 ? normalizeHeaders(preparedRequest.headers) : baseHeaders;
    const body = (preparedRequest == null ? void 0 : preparedRequest.body) !== void 0 ? preparedRequest.body : {
      ...resolvedBody,
      ...options.body,
      id: options.chatId,
      messages: options.messages,
      trigger: options.trigger,
      messageId: options.messageId
    };
    const credentials = (_c = preparedRequest == null ? void 0 : preparedRequest.credentials) != null ? _c : resolvedCredentials;
    const fetch2 = (_d = this.fetch) != null ? _d : globalThis.fetch;
    const response = await fetch2(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(body),
      credentials,
      signal: abortSignal
    });
    if (!response.ok) {
      throw new Error(
        (_e = await response.text()) != null ? _e : "Failed to fetch the chat response."
      );
    }
    if (!response.body) {
      throw new Error("The response body is empty.");
    }
    return this.processResponseStream(response.body);
  }
  async reconnectToStream(options) {
    var _a22, _b, _c, _d, _e;
    const resolvedBody = await resolve(this.body);
    const resolvedHeaders = await resolve(this.headers);
    const resolvedCredentials = await resolve(this.credentials);
    const baseHeaders = {
      ...normalizeHeaders(resolvedHeaders),
      ...normalizeHeaders(options.headers)
    };
    const preparedRequest = await ((_a22 = this.prepareReconnectToStreamRequest) == null ? void 0 : _a22.call(this, {
      api: this.api,
      id: options.chatId,
      body: { ...resolvedBody, ...options.body },
      headers: baseHeaders,
      credentials: resolvedCredentials,
      requestMetadata: options.metadata
    }));
    const api = (_b = preparedRequest == null ? void 0 : preparedRequest.api) != null ? _b : `${this.api}/${options.chatId}/stream`;
    const headers = (preparedRequest == null ? void 0 : preparedRequest.headers) !== void 0 ? normalizeHeaders(preparedRequest.headers) : baseHeaders;
    const credentials = (_c = preparedRequest == null ? void 0 : preparedRequest.credentials) != null ? _c : resolvedCredentials;
    const fetch2 = (_d = this.fetch) != null ? _d : globalThis.fetch;
    const response = await fetch2(api, {
      method: "GET",
      headers,
      credentials
    });
    if (response.status === 204) {
      return null;
    }
    if (!response.ok) {
      throw new Error(
        (_e = await response.text()) != null ? _e : "Failed to fetch the chat response."
      );
    }
    if (!response.body) {
      throw new Error("The response body is empty.");
    }
    return this.processResponseStream(response.body);
  }
};
var DefaultChatTransport = class extends HttpChatTransport {
  constructor(options = {}) {
    super(options);
  }
  processResponseStream(stream) {
    return parseJsonEventStream({
      stream,
      schema: uiMessageChunkSchema
    }).pipeThrough(
      new TransformStream({
        async transform(chunk, controller) {
          if (!chunk.success) {
            throw chunk.error;
          }
          controller.enqueue(chunk.value);
        }
      })
    );
  }
};
var AbstractChat = class {
  constructor({
    generateId: generateId2 = generateId,
    id = generateId2(),
    transport = new DefaultChatTransport(),
    messageMetadataSchema,
    dataPartSchemas,
    state,
    onError,
    onToolCall,
    onFinish,
    onData,
    sendAutomaticallyWhen
  }) {
    this.activeResponse = void 0;
    this.jobExecutor = new SerialJobExecutor();
    this.sendMessage = async (message, options) => {
      var _a22, _b, _c, _d;
      if (message == null) {
        await this.makeRequest({
          trigger: "submit-message",
          messageId: (_a22 = this.lastMessage) == null ? void 0 : _a22.id,
          ...options
        });
        return;
      }
      let uiMessage;
      if ("text" in message || "files" in message) {
        const fileParts = Array.isArray(message.files) ? message.files : await convertFileListToFileUIParts(message.files);
        uiMessage = {
          parts: [
            ...fileParts,
            ..."text" in message && message.text != null ? [{ type: "text", text: message.text }] : []
          ]
        };
      } else {
        uiMessage = message;
      }
      if (message.messageId != null) {
        const messageIndex = this.state.messages.findIndex(
          (m) => m.id === message.messageId
        );
        if (messageIndex === -1) {
          throw new Error(`message with id ${message.messageId} not found`);
        }
        if (this.state.messages[messageIndex].role !== "user") {
          throw new Error(
            `message with id ${message.messageId} is not a user message`
          );
        }
        this.state.messages = this.state.messages.slice(0, messageIndex + 1);
        this.state.replaceMessage(messageIndex, {
          ...uiMessage,
          id: message.messageId,
          role: (_b = uiMessage.role) != null ? _b : "user",
          metadata: message.metadata
        });
      } else {
        this.state.pushMessage({
          ...uiMessage,
          id: (_c = uiMessage.id) != null ? _c : this.generateId(),
          role: (_d = uiMessage.role) != null ? _d : "user",
          metadata: message.metadata
        });
      }
      await this.makeRequest({
        trigger: "submit-message",
        messageId: message.messageId,
        ...options
      });
    };
    this.regenerate = async ({
      messageId,
      ...options
    } = {}) => {
      const messageIndex = messageId == null ? this.state.messages.length - 1 : this.state.messages.findIndex((message) => message.id === messageId);
      if (messageIndex === -1) {
        throw new Error(`message ${messageId} not found`);
      }
      this.state.messages = this.state.messages.slice(
        0,
        // if the message is a user message, we need to include it in the request:
        this.messages[messageIndex].role === "assistant" ? messageIndex : messageIndex + 1
      );
      await this.makeRequest({
        trigger: "regenerate-message",
        messageId,
        ...options
      });
    };
    this.resumeStream = async (options = {}) => {
      await this.makeRequest({ trigger: "resume-stream", ...options });
    };
    this.clearError = () => {
      if (this.status === "error") {
        this.state.error = void 0;
        this.setStatus({ status: "ready" });
      }
    };
    this.addToolApprovalResponse = async ({
      id: id2,
      approved,
      reason,
      options
    }) => this.jobExecutor.run(async () => {
      const messages = this.state.messages;
      const lastMessage = messages[messages.length - 1];
      const updatePart = (part) => isToolUIPart(part) && part.state === "approval-requested" && part.approval.id === id2 ? {
        ...part,
        state: "approval-responded",
        approval: { id: id2, approved, reason }
      } : part;
      this.state.replaceMessage(messages.length - 1, {
        ...lastMessage,
        parts: lastMessage.parts.map(updatePart)
      });
      if (this.activeResponse) {
        this.activeResponse.state.message.parts = this.activeResponse.state.message.parts.map(updatePart);
      }
      if (this.status !== "streaming" && this.status !== "submitted" && this.sendAutomaticallyWhen) {
        this.shouldSendAutomatically().then((shouldSend) => {
          var _a22;
          if (shouldSend) {
            this.makeRequest({
              trigger: "submit-message",
              messageId: (_a22 = this.lastMessage) == null ? void 0 : _a22.id,
              ...options
            });
          }
        });
      }
    });
    this.addToolOutput = async ({
      state: state2 = "output-available",
      toolCallId,
      output,
      errorText,
      options
    }) => this.jobExecutor.run(async () => {
      const messages = this.state.messages;
      const lastMessage = messages[messages.length - 1];
      const updatePart = (part) => isToolUIPart(part) && part.toolCallId === toolCallId ? { ...part, state: state2, output, errorText } : part;
      this.state.replaceMessage(messages.length - 1, {
        ...lastMessage,
        parts: lastMessage.parts.map(updatePart)
      });
      if (this.activeResponse) {
        this.activeResponse.state.message.parts = this.activeResponse.state.message.parts.map(updatePart);
      }
      if (this.status !== "streaming" && this.status !== "submitted" && this.sendAutomaticallyWhen) {
        this.shouldSendAutomatically().then((shouldSend) => {
          var _a22;
          if (shouldSend) {
            this.makeRequest({
              trigger: "submit-message",
              messageId: (_a22 = this.lastMessage) == null ? void 0 : _a22.id,
              ...options
            });
          }
        });
      }
    });
    this.addToolResult = this.addToolOutput;
    this.stop = async () => {
      var _a22;
      if (this.status !== "streaming" && this.status !== "submitted")
        return;
      if ((_a22 = this.activeResponse) == null ? void 0 : _a22.abortController) {
        this.activeResponse.abortController.abort();
      }
    };
    this.id = id;
    this.transport = transport;
    this.generateId = generateId2;
    this.messageMetadataSchema = messageMetadataSchema;
    this.dataPartSchemas = dataPartSchemas;
    this.state = state;
    this.onError = onError;
    this.onToolCall = onToolCall;
    this.onFinish = onFinish;
    this.onData = onData;
    this.sendAutomaticallyWhen = sendAutomaticallyWhen;
  }
  /**
   * Hook status:
   *
   * - `submitted`: The message has been sent to the API and we're awaiting the start of the response stream.
   * - `streaming`: The response is actively streaming in from the API, receiving chunks of data.
   * - `ready`: The full response has been received and processed; a new user message can be submitted.
   * - `error`: An error occurred during the API request, preventing successful completion.
   */
  get status() {
    return this.state.status;
  }
  setStatus({
    status,
    error
  }) {
    if (this.status === status)
      return;
    this.state.status = status;
    this.state.error = error;
  }
  get error() {
    return this.state.error;
  }
  get messages() {
    return this.state.messages;
  }
  get lastMessage() {
    return this.state.messages[this.state.messages.length - 1];
  }
  set messages(messages) {
    this.state.messages = messages;
  }
  async shouldSendAutomatically() {
    if (!this.sendAutomaticallyWhen)
      return false;
    const result = this.sendAutomaticallyWhen({
      messages: this.state.messages
    });
    if (result && typeof result === "object" && "then" in result) {
      return await result;
    }
    return result;
  }
  async makeRequest({
    trigger,
    metadata,
    headers,
    body,
    messageId
  }) {
    var _a22, _b, _c;
    let resumeStream;
    if (trigger === "resume-stream") {
      try {
        const reconnect = await this.transport.reconnectToStream({
          chatId: this.id,
          metadata,
          headers,
          body
        });
        if (reconnect == null) {
          return;
        }
        resumeStream = reconnect;
      } catch (err) {
        if (this.onError && err instanceof Error) {
          this.onError(err);
        }
        this.setStatus({ status: "error", error: err });
        return;
      }
    }
    this.setStatus({ status: "submitted", error: void 0 });
    const lastMessage = this.lastMessage;
    let isAbort = false;
    let isDisconnect = false;
    let isError = false;
    try {
      const activeResponse = {
        state: createStreamingUIMessageState({
          lastMessage: this.state.snapshot(lastMessage),
          messageId: this.generateId()
        }),
        abortController: new AbortController()
      };
      activeResponse.abortController.signal.addEventListener("abort", () => {
        isAbort = true;
      });
      this.activeResponse = activeResponse;
      let stream;
      if (trigger === "resume-stream") {
        stream = resumeStream;
      } else {
        stream = await this.transport.sendMessages({
          chatId: this.id,
          messages: this.state.messages,
          abortSignal: activeResponse.abortController.signal,
          metadata,
          headers,
          body,
          trigger,
          messageId
        });
      }
      const runUpdateMessageJob = (job) => (
        // serialize the job execution to avoid race conditions:
        this.jobExecutor.run(
          () => job({
            state: activeResponse.state,
            write: () => {
              var _a23;
              this.setStatus({ status: "streaming" });
              const replaceLastMessage = activeResponse.state.message.id === ((_a23 = this.lastMessage) == null ? void 0 : _a23.id);
              if (replaceLastMessage) {
                this.state.replaceMessage(
                  this.state.messages.length - 1,
                  activeResponse.state.message
                );
              } else {
                this.state.pushMessage(activeResponse.state.message);
              }
            }
          })
        )
      );
      await consumeStream({
        stream: processUIMessageStream({
          stream,
          onToolCall: this.onToolCall,
          onData: this.onData,
          messageMetadataSchema: this.messageMetadataSchema,
          dataPartSchemas: this.dataPartSchemas,
          runUpdateMessageJob,
          onError: (error) => {
            throw error;
          }
        }),
        onError: (error) => {
          throw error;
        }
      });
      this.setStatus({ status: "ready" });
    } catch (err) {
      if (isAbort || err.name === "AbortError") {
        isAbort = true;
        this.setStatus({ status: "ready" });
        return null;
      }
      isError = true;
      if (err instanceof TypeError && (err.message.toLowerCase().includes("fetch") || err.message.toLowerCase().includes("network"))) {
        isDisconnect = true;
      }
      if (this.onError && err instanceof Error) {
        this.onError(err);
      }
      this.setStatus({ status: "error", error: err });
    } finally {
      try {
        (_b = this.onFinish) == null ? void 0 : _b.call(this, {
          message: this.activeResponse.state.message,
          messages: this.state.messages,
          isAbort,
          isDisconnect,
          isError,
          finishReason: (_a22 = this.activeResponse) == null ? void 0 : _a22.state.finishReason
        });
      } catch (err) {
        console.error(err);
      }
      this.activeResponse = void 0;
    }
    if (!isError && await this.shouldSendAutomatically()) {
      await this.makeRequest({
        trigger: "submit-message",
        messageId: (_c = this.lastMessage) == null ? void 0 : _c.id,
        metadata,
        headers,
        body
      });
    }
  }
};
var throttleit;
var hasRequiredThrottleit;
function requireThrottleit() {
  if (hasRequiredThrottleit) return throttleit;
  hasRequiredThrottleit = 1;
  function throttle2(function_, wait) {
    if (typeof function_ !== "function") {
      throw new TypeError(`Expected the first argument to be a \`function\`, got \`${typeof function_}\`.`);
    }
    let timeoutId;
    let lastCallTime = 0;
    return function throttled(...arguments_) {
      clearTimeout(timeoutId);
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;
      const delayForNextCall = wait - timeSinceLastCall;
      if (delayForNextCall <= 0) {
        lastCallTime = now;
        function_.apply(this, arguments_);
      } else {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          function_.apply(this, arguments_);
        }, delayForNextCall);
      }
    };
  }
  throttleit = throttle2;
  return throttleit;
}
var throttleitExports = /* @__PURE__ */ requireThrottleit();
const throttleFunction = /* @__PURE__ */ getDefaultExportFromCjs(throttleitExports);
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  member.set(obj, value);
  return value;
};
function throttle(fn, waitMs) {
  return waitMs != null ? throttleFunction(fn, waitMs) : fn;
}
var _messages, _status, _error, _messagesCallbacks, _statusCallbacks, _errorCallbacks, _callMessagesCallbacks, _callStatusCallbacks, _callErrorCallbacks;
var ReactChatState = class {
  constructor(initialMessages = []) {
    __privateAdd(this, _messages, void 0);
    __privateAdd(this, _status, "ready");
    __privateAdd(this, _error, void 0);
    __privateAdd(this, _messagesCallbacks, /* @__PURE__ */ new Set());
    __privateAdd(this, _statusCallbacks, /* @__PURE__ */ new Set());
    __privateAdd(this, _errorCallbacks, /* @__PURE__ */ new Set());
    this.pushMessage = (message) => {
      __privateSet(this, _messages, __privateGet(this, _messages).concat(message));
      __privateGet(this, _callMessagesCallbacks).call(this);
    };
    this.popMessage = () => {
      __privateSet(this, _messages, __privateGet(this, _messages).slice(0, -1));
      __privateGet(this, _callMessagesCallbacks).call(this);
    };
    this.replaceMessage = (index, message) => {
      __privateSet(this, _messages, [
        ...__privateGet(this, _messages).slice(0, index),
        // We deep clone the message here to ensure the new React Compiler (currently in RC) detects deeply nested parts/metadata changes:
        this.snapshot(message),
        ...__privateGet(this, _messages).slice(index + 1)
      ]);
      __privateGet(this, _callMessagesCallbacks).call(this);
    };
    this.snapshot = (value) => structuredClone(value);
    this["~registerMessagesCallback"] = (onChange, throttleWaitMs) => {
      const callback = throttleWaitMs ? throttle(onChange, throttleWaitMs) : onChange;
      __privateGet(this, _messagesCallbacks).add(callback);
      return () => {
        __privateGet(this, _messagesCallbacks).delete(callback);
      };
    };
    this["~registerStatusCallback"] = (onChange) => {
      __privateGet(this, _statusCallbacks).add(onChange);
      return () => {
        __privateGet(this, _statusCallbacks).delete(onChange);
      };
    };
    this["~registerErrorCallback"] = (onChange) => {
      __privateGet(this, _errorCallbacks).add(onChange);
      return () => {
        __privateGet(this, _errorCallbacks).delete(onChange);
      };
    };
    __privateAdd(this, _callMessagesCallbacks, () => {
      __privateGet(this, _messagesCallbacks).forEach((callback) => callback());
    });
    __privateAdd(this, _callStatusCallbacks, () => {
      __privateGet(this, _statusCallbacks).forEach((callback) => callback());
    });
    __privateAdd(this, _callErrorCallbacks, () => {
      __privateGet(this, _errorCallbacks).forEach((callback) => callback());
    });
    __privateSet(this, _messages, initialMessages);
  }
  get status() {
    return __privateGet(this, _status);
  }
  set status(newStatus) {
    __privateSet(this, _status, newStatus);
    __privateGet(this, _callStatusCallbacks).call(this);
  }
  get error() {
    return __privateGet(this, _error);
  }
  set error(newError) {
    __privateSet(this, _error, newError);
    __privateGet(this, _callErrorCallbacks).call(this);
  }
  get messages() {
    return __privateGet(this, _messages);
  }
  set messages(newMessages) {
    __privateSet(this, _messages, [...newMessages]);
    __privateGet(this, _callMessagesCallbacks).call(this);
  }
};
_messages = /* @__PURE__ */ new WeakMap();
_status = /* @__PURE__ */ new WeakMap();
_error = /* @__PURE__ */ new WeakMap();
_messagesCallbacks = /* @__PURE__ */ new WeakMap();
_statusCallbacks = /* @__PURE__ */ new WeakMap();
_errorCallbacks = /* @__PURE__ */ new WeakMap();
_callMessagesCallbacks = /* @__PURE__ */ new WeakMap();
_callStatusCallbacks = /* @__PURE__ */ new WeakMap();
_callErrorCallbacks = /* @__PURE__ */ new WeakMap();
var _state;
var Chat = class extends AbstractChat {
  constructor({ messages, ...init }) {
    const state = new ReactChatState(messages);
    super({ ...init, state });
    __privateAdd(this, _state, void 0);
    this["~registerMessagesCallback"] = (onChange, throttleWaitMs) => __privateGet(this, _state)["~registerMessagesCallback"](onChange, throttleWaitMs);
    this["~registerStatusCallback"] = (onChange) => __privateGet(this, _state)["~registerStatusCallback"](onChange);
    this["~registerErrorCallback"] = (onChange) => __privateGet(this, _state)["~registerErrorCallback"](onChange);
    __privateSet(this, _state, state);
  }
};
_state = /* @__PURE__ */ new WeakMap();
function useChat({
  experimental_throttle: throttleWaitMs,
  resume = false,
  ...options
} = {}) {
  const callbacksRef = reactExports.useRef(
    !("chat" in options) ? {
      onToolCall: options.onToolCall,
      onData: options.onData,
      onFinish: options.onFinish,
      onError: options.onError,
      sendAutomaticallyWhen: options.sendAutomaticallyWhen
    } : {}
  );
  if (!("chat" in options)) {
    callbacksRef.current = {
      onToolCall: options.onToolCall,
      onData: options.onData,
      onFinish: options.onFinish,
      onError: options.onError,
      sendAutomaticallyWhen: options.sendAutomaticallyWhen
    };
  }
  const optionsWithCallbacks = {
    ...options,
    onToolCall: (arg) => {
      var _a, _b;
      return (_b = (_a = callbacksRef.current).onToolCall) == null ? void 0 : _b.call(_a, arg);
    },
    onData: (arg) => {
      var _a, _b;
      return (_b = (_a = callbacksRef.current).onData) == null ? void 0 : _b.call(_a, arg);
    },
    onFinish: (arg) => {
      var _a, _b;
      return (_b = (_a = callbacksRef.current).onFinish) == null ? void 0 : _b.call(_a, arg);
    },
    onError: (arg) => {
      var _a, _b;
      return (_b = (_a = callbacksRef.current).onError) == null ? void 0 : _b.call(_a, arg);
    },
    sendAutomaticallyWhen: (arg) => {
      var _a, _b, _c;
      return (_c = (_b = (_a = callbacksRef.current).sendAutomaticallyWhen) == null ? void 0 : _b.call(_a, arg)) != null ? _c : false;
    }
  };
  const chatRef = reactExports.useRef(
    "chat" in options ? options.chat : new Chat(optionsWithCallbacks)
  );
  const shouldRecreateChat = "chat" in options && options.chat !== chatRef.current || "id" in options && chatRef.current.id !== options.id;
  if (shouldRecreateChat) {
    chatRef.current = "chat" in options ? options.chat : new Chat(optionsWithCallbacks);
  }
  const subscribeToMessages = reactExports.useCallback(
    (update) => chatRef.current["~registerMessagesCallback"](update, throttleWaitMs),
    // `chatRef.current.id` is required to trigger re-subscription when the chat ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [throttleWaitMs, chatRef.current.id]
  );
  const messages = reactExports.useSyncExternalStore(
    subscribeToMessages,
    () => chatRef.current.messages,
    () => chatRef.current.messages
  );
  const status = reactExports.useSyncExternalStore(
    chatRef.current["~registerStatusCallback"],
    () => chatRef.current.status,
    () => chatRef.current.status
  );
  const error = reactExports.useSyncExternalStore(
    chatRef.current["~registerErrorCallback"],
    () => chatRef.current.error,
    () => chatRef.current.error
  );
  const setMessages = reactExports.useCallback(
    (messagesParam) => {
      if (typeof messagesParam === "function") {
        messagesParam = messagesParam(chatRef.current.messages);
      }
      chatRef.current.messages = messagesParam;
    },
    [chatRef]
  );
  reactExports.useEffect(() => {
    if (resume) {
      chatRef.current.resumeStream();
    }
  }, [resume, chatRef]);
  return {
    id: chatRef.current.id,
    messages,
    setMessages,
    sendMessage: chatRef.current.sendMessage,
    regenerate: chatRef.current.regenerate,
    clearError: chatRef.current.clearError,
    stop: chatRef.current.stop,
    error,
    resumeStream: chatRef.current.resumeStream,
    status,
    /**
     * @deprecated Use `addToolOutput` instead.
     */
    addToolResult: chatRef.current.addToolOutput,
    addToolOutput: chatRef.current.addToolOutput,
    addToolApprovalResponse: chatRef.current.addToolApprovalResponse
  };
}
function humanizeToolLabel(partType) {
  const name = partType.replace(/^tool-/, "").replace(/_/g, " ");
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  return { running: label, done: label };
}
function messageHasVisibleContent(message) {
  return message.parts.some(
    (part) => part.type === "text" && part.text.trim().length > 0 || part.type === "reasoning" && part.text.trim().length > 0 || part.type.startsWith("tool-")
  );
}
function messageText(message) {
  return message.parts.filter(
    (part) => part.type === "text"
  ).map((part) => part.text).join("\n").trim();
}
function CopyButton({ message }) {
  const [copied, setCopied] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      "aria-label": "Copy message",
      title: "Copy",
      className: "btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content",
      onClick: () => {
        void navigator.clipboard.writeText(messageText(message));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-3.5" })
    }
  );
}
function MessageActions({
  message,
  onUndo,
  onStartEdit
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${message.role === "user" ? "justify-end" : ""}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CopyButton, { message }),
        onStartEdit ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "aria-label": "Edit message",
            title: "Edit and resend",
            className: "btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content",
            onClick: onStartEdit,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3.5" })
          }
        ) : null,
        onUndo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "aria-label": "Undo from this message",
            title: "Undo — remove this message and everything after it",
            className: "btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content",
            onClick: onUndo,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Undo2, { className: "size-3.5" })
          }
        ) : null
      ]
    }
  );
}
function ReasoningBlock({
  part,
  live
}) {
  const [expanded, setExpanded] = reactExports.useState(false);
  const isStreaming = live && part.state === "streaming";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-base-content/60", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setExpanded((open) => !open),
        className: "inline-flex items-center gap-1.5 text-xs hover:text-base-content/80",
        children: [
          isStreaming ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            ChevronRight,
            {
              className: `size-3 transition-transform ${expanded ? "rotate-90" : ""}`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isStreaming ? "Thinking…" : "Thought process" })
        ]
      }
    ),
    expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 whitespace-pre-wrap border-l-2 border-base-300 pl-3 text-xs text-base-content/50", children: part.text }) : null
  ] });
}
function ToolBadge({
  part,
  live,
  resolveToolLabel
}) {
  const labels = resolveToolLabel(part.type);
  if (!labels) return null;
  const state = "state" in part ? part.state : void 0;
  const isDone = state === "output-available";
  const isError = state === "output-error" || !isDone && !live;
  const isRunning = !isError && !isDone;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${isError ? "bg-error/10 text-error" : "bg-base-200 text-base-content/70"}`,
      children: [
        isRunning ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3 animate-spin" }) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isRunning ? `${labels.running}…` : labels.done })
      ]
    }
  );
}
function ChatMessage({
  message,
  resolveToolLabel,
  streaming,
  onUndo,
  onEdit
}) {
  const [editing, setEditing] = reactExports.useState(false);
  const [draft, setDraft] = reactExports.useState("");
  if (message.role === "user") {
    if (editing && onEdit) {
      const submit = () => {
        const text2 = draft.trim();
        setEditing(false);
        if (text2 && text2 !== messageText(message)) onEdit(text2);
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1.5 pl-8 sm:pl-16", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: "textarea textarea-bordered w-full max-w-xl text-sm",
            rows: Math.min(6, Math.max(2, draft.split("\n").length)),
            value: draft,
            autoFocus: true,
            onChange: (event) => setDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
              if (event.key === "Escape") setEditing(false);
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "btn btn-ghost btn-xs",
              onClick: () => setEditing(false),
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "btn btn-primary btn-xs",
              onClick: submit,
              children: "Save & resend"
            }
          )
        ] })
      ] });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end pl-8 sm:pl-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-box rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-content", children: message.parts.map(
        (part, index) => part.type === "text" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "whitespace-pre-wrap", children: part.text }, index) : null
      ) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MessageActions,
        {
          message,
          onUndo,
          onStartEdit: onEdit ? () => {
            setDraft(messageText(message));
            setEditing(true);
          } : void 0
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group flex flex-col gap-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 space-y-2 text-sm", children: message.parts.map((part, index) => {
      if (part.type === "reasoning") {
        return part.text.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          ReasoningBlock,
          {
            part,
            live: Boolean(streaming)
          },
          index
        ) : null;
      }
      if (part.type === "text") {
        return part.text.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx(Markdown, { children: part.text }, index) : null;
      }
      if (part.type.startsWith("tool-")) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          ToolBadge,
          {
            part,
            live: Boolean(streaming),
            resolveToolLabel
          },
          index
        );
      }
      return null;
    }) }),
    streaming ? null : /* @__PURE__ */ jsxRuntimeExports.jsx(MessageActions, { message })
  ] });
}
const DISCORD_URL = "https://discord.gg/c9uGs3cFXr";
function SuggestedQuestions({
  questions,
  primaryQuestions = [],
  onSelect
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-10 flex flex-wrap gap-2", children: questions.map(
    (question) => primaryQuestions.includes(question) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15",
        onClick: () => onSelect(question),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-3.5" }),
          question
        ]
      },
      question
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-medium text-base-content/70 transition-colors hover:border-primary/50 hover:text-base-content",
        onClick: () => onSelect(question),
        children: question
      },
      question
    )
  ) });
}
function WelcomeMessage({
  domain,
  checkoutError,
  isStartingCheckout,
  onUpgrade
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-4" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-3 pt-0.5 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-base-content/80", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Hey, I’m Sam — welcome to OpenSEO." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "To get full access to OpenSEO, you need to upgrade to the paid plan. But, I’m here if you have any questions." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          "You can also",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              href: DISCORD_URL,
              target: "_blank",
              rel: "noreferrer",
              className: "link link-primary",
              children: "join the Discord"
            }
          ),
          " ",
          "or email",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "mailto:ben@openseo.so", className: "link link-primary", children: "ben@openseo.so" }),
          " ",
          "if you have any questions I can’t help you with."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          "Want me to analyze",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-base-content", children: domain }),
          " and draft a strategy, or do you have questions first? Pick one below to get started."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-box border border-base-300 bg-base-200/50 p-3 text-xs lg:hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Want Sam to keep going?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 text-base-content/70", children: [
          "Upgrade to run keyword research, rank tracking, and site audits on",
          " ",
          domain,
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "btn btn-primary btn-xs mt-2",
            disabled: isStartingCheckout,
            onClick: onUpgrade,
            children: isStartingCheckout ? "Redirecting..." : "Upgrade"
          }
        ),
        checkoutError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-error", children: checkoutError }) : null
      ] })
    ] })
  ] });
}
function UpgradeSidebar({
  domain,
  questionsUsed,
  isStartingCheckout,
  onUpgrade
}) {
  const features = [
    "Keyword research, backlinks, rank tracking & site audits",
    "Google Search Console — read-only, no credits, no Google Cloud setup",
    "Connect Claude, Cursor, Codex & other MCP clients",
    "Top-up credits roll over and never expire"
  ];
  const used = Math.min(questionsUsed, FREE_ONBOARDING_QUESTION_LIMIT);
  const progress = used / FREE_ONBOARDING_QUESTION_LIMIT * 100;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "hidden w-96 flex-shrink-0 flex-col border-r border-base-300 bg-base-200/20 lg:flex", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 border-b border-base-300 px-6 py-4 text-xs text-base-content/55", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex size-8 items-center justify-center rounded-full border border-base-300 bg-base-100 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "size-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-base-content/80", children: "Previewing OpenSEO" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate", title: domain, children: domain })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col gap-5 px-6 py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-semibold tracking-tight", children: "$10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-base-content/55", children: "/month" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs leading-relaxed text-base-content/55", children: "Includes $10 of usage credits every month, plus a 30-day money-back guarantee." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3 border-t border-base-300 pt-5", children: features.map((label) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "li",
        {
          className: "flex gap-2.5 text-sm leading-snug text-base-content/75",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mt-0.5 size-4 flex-shrink-0 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label })
          ]
        },
        label
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto space-y-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "btn btn-primary w-full",
            disabled: isStartingCheckout,
            onClick: onUpgrade,
            children: isStartingCheckout ? "Redirecting..." : "Upgrade to continue"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-xs leading-relaxed text-base-content/55", children: [
          "Want advice from other OpenSEO users?",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              href: DISCORD_URL,
              target: "_blank",
              rel: "noreferrer",
              className: "link link-primary",
              children: "Join the Discord"
            }
          ),
          "."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 border-t border-base-300 px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 w-full overflow-hidden rounded-full bg-base-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full rounded-full bg-primary transition-all",
          style: { width: `${progress}%` }
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-base-content/55", children: [
        used,
        " of ",
        FREE_ONBOARDING_QUESTION_LIMIT,
        " free questions used"
      ] })
    ] })
  ] });
}
function ChatGate({
  isStartingCheckout,
  onUpgrade
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 border-t border-base-300 px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-2xl rounded-box border border-primary/30 bg-primary/5 p-4 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium", children: [
      "That’s all ",
      FREE_ONBOARDING_QUESTION_LIMIT,
      " free questions"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-1 max-w-md text-xs text-base-content/70", children: "Upgrade to keep working with Sam and unlock the full OpenSEO app." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "btn btn-primary btn-sm mt-3",
        disabled: isStartingCheckout,
        onClick: onUpgrade,
        children: isStartingCheckout ? "Redirecting..." : "Upgrade to continue"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-base-content/45", children: "30-day money-back guarantee" })
  ] }) });
}
function ChatComposer({
  busy,
  onSend,
  placeholder = "Ask Sam about your strategy or OpenSEO…"
}) {
  const [value, setValue] = reactExports.useState("");
  const textareaRef = reactExports.useRef(null);
  reactExports.useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);
  function submit() {
    const text2 = value.trim();
    if (!text2 || busy) return;
    onSend(text2);
    setValue("");
  }
  function handleSubmit(event) {
    event.preventDefault();
    submit();
  }
  function handleKey(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      onSubmit: handleSubmit,
      className: "flex items-end gap-2 rounded-box border border-base-300 bg-base-100 px-3 py-2 focus-within:border-primary",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            ref: textareaRef,
            value,
            onChange: (event) => setValue(event.target.value),
            onKeyDown: handleKey,
            rows: 1,
            placeholder,
            className: "max-h-40 flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm leading-relaxed outline-none placeholder:text-base-content/50 focus:outline-none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "submit",
            "aria-label": "Send message",
            disabled: busy || !value.trim(),
            className: "btn btn-primary btn-circle btn-sm",
            children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "size-4" })
          }
        )
      ]
    }
  );
}
export {
  ChatMessage as C,
  SuggestedQuestions as S,
  UpgradeSidebar as U,
  WelcomeMessage as W,
  useAgent as a,
  ChatGate as b,
  ChatComposer as c,
  humanizeToolLabel as h,
  messageHasVisibleContent as m,
  useChat as u
};
