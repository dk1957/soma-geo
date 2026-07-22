import { G as object, H as string, y as createServerFn, aL as isHostedClientAuthMode, aM as reactExports, aN as jsxRuntimeExports, bM as isToolUIPart, bN as getToolName, bW as nanoid, bP as transition } from "./index-CSpjggkr.js";
import { q as createLucideIcon, p as createSsrRpc, s as useQuery, x as getStandardErrorMessage, L as Link, b7 as ShieldAlert, j as useNavigate, J as useMutation, a_ as LoaderCircle, b8 as Route } from "./router-8qflvY1T.js";
import { i as invalidateSamSessions, c as createSamSession, s as samSessionsQueryOptions } from "./samQueries-cDPgZMT_.js";
import { r as requireProjectContext } from "./middleware-CNUfdy2z.js";
import { u as useChat, a as useAgent, m as messageHasVisibleContent, C as ChatMessage, h as humanizeToolLabel, c as ChatComposer } from "./OnboardingChatParts-FlK51GWl.js";
import { P as Plus } from "./plus-ClJgelga.js";
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
import "./Markdown-Cup334nZ.js";
import "./pencil-IZdwj4v7.js";
import "./triangle-alert-CtV7H1mP.js";
import "./check-C_HETtUw.js";
import "./copy-DgxzPDJt.js";
import "./globe-xsi-TwrE.js";
import "./sparkles-D0nOSwIL.js";
const __iconNode = [
  [
    "path",
    {
      d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",
      key: "1ngwbx"
    }
  ]
];
const Wrench = createLucideIcon("wrench", __iconNode);
const projectScopedSchema = object({
  projectId: string().min(1)
});
const getSamAccessSetupStatus = createServerFn({
  method: "GET"
}).middleware(requireProjectContext).validator(projectScopedSchema).handler(createSsrRpc("57eebe4b148ecd8baeab46c7dc1c92b78de5e9a45d9f805e437b74cda250d02e"));
function useSamAccess(projectId) {
  const isHosted = isHostedClientAuthMode();
  const { data, error, isRefetching, refetch } = useQuery({
    queryKey: ["samAccessStatus", projectId],
    queryFn: () => getSamAccessSetupStatus({ data: { projectId } }),
    enabled: !isHosted,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1e3
  });
  const onRetry = reactExports.useCallback(() => {
    void refetch();
  }, [refetch]);
  if (isHosted) {
    return {
      showSetupGate: false,
      errorMessage: null,
      isRefetching: false,
      onRetry
    };
  }
  const resolved = data !== void 0 || error != null;
  return {
    showSetupGate: resolved && !(data?.enabled ?? false),
    errorMessage: data?.errorMessage ?? (error ? getStandardErrorMessage(
      error,
      "Could not load AI agent setup status."
    ) : null),
    isRefetching,
    onRetry
  };
}
function SamSetupGate({
  errorMessage,
  isRefetching,
  onRetry
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-base-300 bg-base-100 p-6 md:p-7 space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl bg-warning/15 p-2.5 text-warning shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold", children: "Enable AI Features" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-base-content/68", children: [
          "SAM, OpenSEO's in-app AI agent, needs an OpenRouter API key. Create a key on OpenRouter, set it as the",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "OPENROUTER_API_KEY" }),
          " environment variable, restart OpenSEO, then confirm here."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-base-content/50", children: [
          "Step-by-step instructions for every deployment are in the",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              className: "underline underline-offset-2 hover:text-base-content/70",
              to: "/help/openrouter-api-key",
              children: "OpenRouter API key setup guide"
            }
          ),
          "."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "btn btn-primary",
          onClick: onRetry,
          disabled: isRefetching,
          children: isRefetching ? "Confirming..." : "Confirm API Key"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          className: "btn",
          href: "https://openrouter.ai/settings/keys",
          target: "_blank",
          rel: "noreferrer",
          children: "Open OpenRouter Keys"
        }
      )
    ] }),
    errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert alert-warning", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "size-4 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: errorMessage })
    ] }) : null
  ] }) });
}
const RESUME_PROBE_TIMEOUT_MS = 5e3;
const RESUME_PENDING_TIMEOUT_MS = 6e4;
var WebSocketChatTransport = class {
  constructor(options) {
    this._resumeResolver = null;
    this._resumeNoneResolver = null;
    this._onStreamPending = null;
    this._expectToolContinuation = false;
    this._abortToolContinuation = null;
    this._activeServerTurnId = null;
    this._cancelAttachedStream = null;
    this.agent = options.agent;
    this.prepareBody = options.prepareBody;
    this.activeRequestIds = options.activeRequestIds;
    this.cancelOnClientAbort = options.cancelOnClientAbort ?? false;
  }
  setCancelOnClientAbort(cancelOnClientAbort) {
    this.cancelOnClientAbort = cancelOnClientAbort;
  }
  /**
  * Explicitly cancel the active server turn, if any.
  * This is separate from generic client-side abort/cancel lifecycle so
  * clients can detach locally without stopping server work.
  */
  cancelActiveServerTurn() {
    const requestId = this._activeServerTurnId;
    let cancelledRequest = false;
    if (requestId) {
      this.sendCancelFrame(requestId);
      this._cancelAttachedStream?.();
      this.clearActiveServerTurn(requestId);
      cancelledRequest = true;
    }
    const cancelledToolContinuation = this.abortActiveToolContinuation();
    return cancelledRequest || cancelledToolContinuation;
  }
  sendCancelFrame(requestId) {
    try {
      this.agent.send(JSON.stringify({
        id: requestId,
        type: "cf_agent_chat_request_cancel"
      }));
    } catch {
    }
  }
  setActiveServerTurn(requestId, cancelAttachedStream) {
    this._activeServerTurnId = requestId;
    this._cancelAttachedStream = cancelAttachedStream;
  }
  clearActiveServerTurn(requestId) {
    if (this._activeServerTurnId === requestId) {
      this._activeServerTurnId = null;
      this._cancelAttachedStream = null;
    }
  }
  /**
  * Mark that the next reconnectToStream() call should attach to a
  * server-initiated tool continuation rather than a page-load resume.
  */
  expectToolContinuation() {
    this._expectToolContinuation = true;
  }
  /**
  * Abort the active client-side tool continuation stream, if one is attached
  * to a server request id.
  */
  abortActiveToolContinuation() {
    return this._abortToolContinuation?.() ?? false;
  }
  /**
  * True when the transport is waiting for a resume handshake.
  */
  isAwaitingResume() {
    return this._resumeResolver !== null || this._resumeNoneResolver !== null;
  }
  /**
  * Called by onAgentMessage when it receives CF_AGENT_STREAM_RESUMING.
  * If reconnectToStream is waiting, this handles the resume handshake
  * (ACK + stream creation) and returns true. Otherwise returns false
  * so the caller can use its own fallback path.
  */
  handleStreamResuming(data) {
    if (!this._resumeResolver) return false;
    this._resumeResolver(data);
    return true;
  }
  /**
  * Called by onAgentMessage when it receives CF_AGENT_STREAM_RESUME_NONE.
  * If reconnectToStream is waiting, resolves the promise with null
  * immediately (no 5-second timeout). Returns true if handled.
  */
  handleStreamResumeNone() {
    if (!this._resumeNoneResolver) return false;
    this._resumeNoneResolver();
    return true;
  }
  /**
  * Called by onAgentMessage when it receives CF_AGENT_STREAM_PENDING (#1784):
  * the server accepted a turn but its stream has not started yet. If a resume
  * path is awaiting, extend its probe timeout (so it keeps waiting for the
  * eventual STREAM_RESUMING / STREAM_RESUME_NONE instead of resolving null
  * after the short window). Returns true if a waiting path consumed it.
  */
  handleStreamPending() {
    if (!this._onStreamPending) return false;
    this._onStreamPending();
    return true;
  }
  /**
  * Called by the hook's shared message handler when a server turn finishes
  * outside the currently attached transport stream, such as after local-only
  * client cleanup.
  */
  handleServerTurnCompleted(requestId) {
    this.clearActiveServerTurn(requestId);
  }
  /**
  * Register a server turn that is being rendered outside a transport-owned
  * stream, such as the hook's fallback cross-tab/resume observer path.
  */
  observeServerTurn(requestId) {
    this.setActiveServerTurn(requestId, null);
  }
  async sendMessages(options) {
    const requestId = nanoid(8);
    const abortController = new AbortController();
    let completed = false;
    let requestSent = false;
    let extraBody = {};
    if (this.prepareBody) extraBody = await this.prepareBody({
      messages: options.messages,
      trigger: options.trigger,
      messageId: options.messageId
    });
    if (options.body) extraBody = {
      ...extraBody,
      ...options.body
    };
    const bodyPayload = JSON.stringify({
      messages: options.messages,
      trigger: options.trigger,
      ...extraBody
    });
    this.activeRequestIds?.add(requestId);
    const agent = this.agent;
    const activeIds = this.activeRequestIds;
    const finish = (action, keepId = false, clearServerTurn = true) => {
      if (completed) return;
      completed = true;
      if (clearServerTurn) this.clearActiveServerTurn(requestId);
      try {
        action();
      } catch {
      }
      if (!keepId) activeIds?.delete(requestId);
      abortController.abort();
    };
    const abortError = /* @__PURE__ */ new Error("Aborted");
    abortError.name = "AbortError";
    const cancelActiveRequest = () => {
      if (completed) return false;
      finish(() => streamController.error(abortError), true);
      return true;
    };
    this.setActiveServerTurn(requestId, cancelActiveRequest);
    const onAbort = () => {
      if (completed) return;
      if (this.cancelOnClientAbort) {
        if (requestSent) this.sendCancelFrame(requestId);
        finish(() => streamController.error(abortError), requestSent);
      } else finish(() => streamController.error(abortError), false, !requestSent);
    };
    let streamController;
    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;
        const onMessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type !== "cf_agent_use_chat_response") return;
            if (data.id !== requestId) return;
            if (data.error) {
              finish(() => controller.error(new Error(data.body || "Stream error")));
              return;
            }
            if (data.body?.trim()) try {
              const chunk = JSON.parse(data.body);
              controller.enqueue(chunk);
            } catch {
            }
            if (data.done) finish(() => controller.close());
          } catch {
          }
        };
        const onClose = () => {
          finish(() => controller.close(), false, false);
        };
        agent.addEventListener("message", onMessage, { signal: abortController.signal });
        agent.addEventListener("close", onClose, { signal: abortController.signal });
      },
      cancel() {
        onAbort();
      }
    });
    if (options.abortSignal) {
      options.abortSignal.addEventListener("abort", onAbort, { once: true });
      if (options.abortSignal.aborted) onAbort();
    }
    if (completed) return stream;
    requestSent = true;
    agent.send(JSON.stringify({
      id: requestId,
      init: {
        method: "POST",
        body: bodyPayload
      },
      type: "cf_agent_use_chat_request"
    }));
    return stream;
  }
  async reconnectToStream(_options) {
    if (this._expectToolContinuation) {
      this._expectToolContinuation = false;
      return this._createToolContinuationStream();
    }
    const activeIds = this.activeRequestIds;
    return new Promise((resolve) => {
      let resolved = false;
      let timeout;
      const done = (value) => {
        if (resolved) return;
        resolved = true;
        this._resumeResolver = null;
        this._resumeNoneResolver = null;
        this._onStreamPending = null;
        if (timeout) clearTimeout(timeout);
        resolve(value);
      };
      this._onStreamPending = () => {
        if (resolved) return;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => done(null), RESUME_PENDING_TIMEOUT_MS);
      };
      this._resumeNoneResolver = () => done(null);
      this._resumeResolver = (data) => {
        const requestId = data.id;
        activeIds?.add(requestId);
        const stream = this._createResumeStream(requestId);
        this.agent.send(JSON.stringify({
          type: "cf_agent_stream_resume_ack",
          id: requestId
        }));
        done(stream);
      };
      try {
        this.agent.send(JSON.stringify({ type: "cf_agent_stream_resume_request" }));
      } catch {
      }
      timeout = setTimeout(() => done(null), RESUME_PROBE_TIMEOUT_MS);
    });
  }
  /**
  * Creates a deferred ReadableStream for client-side tool continuations.
  * The stream is returned immediately so AI SDK status becomes "submitted"
  * right after addToolOutput()/addToolApprovalResponse(), then it waits for
  * the server to announce the continuation via STREAM_RESUMING.
  */
  _createToolContinuationStream() {
    const agent = this.agent;
    const activeIds = this.activeRequestIds;
    const streamController = new AbortController();
    const abortError = /* @__PURE__ */ new Error("Aborted");
    abortError.name = "AbortError";
    let completed = false;
    let requestId = null;
    let readerController;
    let onResumeRef = null;
    let onResumeNoneRef = null;
    const clearHandshakeResolvers = (resumeResolver, resumeNoneResolver) => {
      if (resumeResolver === void 0 && resumeNoneResolver === void 0) {
        this._resumeResolver = null;
        this._resumeNoneResolver = null;
        return;
      }
      if (resumeResolver && this._resumeResolver === resumeResolver) this._resumeResolver = null;
      if (resumeNoneResolver && this._resumeNoneResolver === resumeNoneResolver) this._resumeNoneResolver = null;
    };
    const finish = (action, resumeResolver, resumeNoneResolver, keepRequestId = false) => {
      if (completed) return;
      completed = true;
      this._abortToolContinuation = null;
      this._onStreamPending = null;
      clearHandshakeResolvers(resumeResolver, resumeNoneResolver);
      try {
        action();
      } catch {
      }
      if (requestId && !keepRequestId) activeIds?.delete(requestId);
      streamController.abort();
    };
    const transport = this;
    this._abortToolContinuation = () => {
      if (completed) return false;
      if (requestId === null) {
        finish(() => readerController.error(abortError), onResumeRef, onResumeNoneRef);
        return true;
      }
      try {
        agent.send(JSON.stringify({
          type: "cf_agent_chat_request_cancel",
          id: requestId
        }));
      } catch {
      }
      finish(() => readerController.error(abortError), onResumeRef, onResumeNoneRef, true);
      return true;
    };
    return new ReadableStream({
      start(controller) {
        readerController = controller;
        let timeout;
        const onResumeNone = () => {
          if (timeout) clearTimeout(timeout);
          finish(() => controller.close(), onResume, onResumeNone);
        };
        const onResume = (data) => {
          if (requestId) return;
          requestId = data.id;
          activeIds?.add(requestId);
          clearHandshakeResolvers(onResume, onResumeNone);
          transport._onStreamPending = null;
          if (timeout) clearTimeout(timeout);
          agent.send(JSON.stringify({
            type: "cf_agent_stream_resume_ack",
            id: requestId
          }));
        };
        onResumeRef = onResume;
        onResumeNoneRef = onResumeNone;
        timeout = setTimeout(() => finish(() => controller.close(), onResume, onResumeNone), RESUME_PROBE_TIMEOUT_MS);
        transport._onStreamPending = () => {
          if (completed) return;
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => finish(() => controller.close(), onResume, onResumeNone), RESUME_PENDING_TIMEOUT_MS);
        };
        transport._resumeResolver = onResume;
        transport._resumeNoneResolver = onResumeNone;
        const onMessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type !== "cf_agent_use_chat_response" || requestId == null || data.id !== requestId) return;
            if (data.error) {
              finish(() => controller.error(new Error(data.body || "Stream error")), onResume, onResumeNone);
              return;
            }
            if (data.body?.trim()) try {
              const chunk = JSON.parse(data.body);
              controller.enqueue(chunk);
            } catch {
            }
            if (data.done) finish(() => controller.close(), onResume, onResumeNone);
          } catch {
          }
        };
        const onClose = () => {
          if (timeout) clearTimeout(timeout);
          finish(() => controller.close(), onResume, onResumeNone);
        };
        agent.addEventListener("message", onMessage, { signal: streamController.signal });
        agent.addEventListener("close", onClose, { signal: streamController.signal });
        try {
          agent.send(JSON.stringify({ type: "cf_agent_stream_resume_request" }));
        } catch {
          finish(() => controller.close());
        }
      },
      cancel() {
        if (requestId && transport.cancelOnClientAbort) {
          transport.sendCancelFrame(requestId);
          finish(() => {
          }, onResumeRef, onResumeNoneRef, true);
        } else finish(() => {
        }, onResumeRef, onResumeNoneRef);
      }
    });
  }
  /**
  * Creates a ReadableStream that receives resumed stream chunks
  * and forwards them to useChat as UIMessageChunk objects.
  */
  _createResumeStream(requestId) {
    const agent = this.agent;
    const activeIds = this.activeRequestIds;
    const chunkController = new AbortController();
    const abortError = /* @__PURE__ */ new Error("Aborted");
    abortError.name = "AbortError";
    let completed = false;
    const finish = (action, keepId = false, clearServerTurn = true) => {
      if (completed) return;
      completed = true;
      if (clearServerTurn) this.clearActiveServerTurn(requestId);
      try {
        action();
      } catch {
      }
      if (!keepId) activeIds?.delete(requestId);
      chunkController.abort();
    };
    const cancelActiveRequest = () => {
      if (completed) return false;
      finish(() => streamController.error(abortError), true);
      return true;
    };
    this.setActiveServerTurn(requestId, cancelActiveRequest);
    let streamController;
    const transport = this;
    return new ReadableStream({
      start(controller) {
        streamController = controller;
        const onMessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type !== "cf_agent_use_chat_response") return;
            if (data.id !== requestId) return;
            if (data.error) {
              finish(() => controller.error(new Error(data.body || "Stream error")));
              return;
            }
            if (data.body?.trim()) try {
              const chunk = JSON.parse(data.body);
              controller.enqueue(chunk);
            } catch {
            }
            if (data.done) finish(() => controller.close());
          } catch {
          }
        };
        const onClose = () => {
          finish(() => controller.close(), false, false);
        };
        agent.addEventListener("message", onMessage, { signal: chunkController.signal });
        agent.addEventListener("close", onClose, { signal: chunkController.signal });
      },
      cancel() {
        if (transport.cancelOnClientAbort) {
          transport.sendCancelFrame(requestId);
          finish(() => {
          }, true);
        } else finish(() => {
        }, false, false);
      }
    });
  }
};
const _deprecationWarnings = /* @__PURE__ */ new Set();
function warnDeprecated(id, message) {
  if (!_deprecationWarnings.has(id)) {
    _deprecationWarnings.add(id);
    console.warn(`[agents/chat] Deprecated: ${message}`);
  }
}
function extractClientToolSchemas(tools) {
  if (!tools) return void 0;
  const schemas = Object.entries(tools).filter(([_, tool]) => tool.execute).map(([name, tool]) => {
    if (tool.inputSchema && !tool.parameters) console.warn(`[useAgentChat] Tool "${name}" uses deprecated 'inputSchema'. Please migrate to 'parameters'.`);
    return {
      name,
      description: tool.description,
      parameters: tool.parameters ?? tool.inputSchema
    };
  });
  return schemas.length > 0 ? schemas : void 0;
}
const requestCache = /* @__PURE__ */ new Map();
function findLastAssistantMessage(messages) {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message.role === "assistant") return {
      index,
      message
    };
  }
  return null;
}
function moveMessageToEnd(messages, messageId) {
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx < 0 || idx === messages.length - 1) return messages;
  const result = [...messages];
  const [msg] = result.splice(idx, 1);
  if (!msg) return messages;
  result.push(msg);
  return result;
}
function prependMissingHydratedMessages(hydratedMessages, currentMessages) {
  if (currentMessages.length === 0) return hydratedMessages;
  const currentMessageIds = new Set(currentMessages.map((message) => message.id));
  const missingHydratedMessages = hydratedMessages.filter((message) => !currentMessageIds.has(message.id));
  if (missingHydratedMessages.length === 0) return currentMessages;
  return [...missingHydratedMessages, ...currentMessages];
}
function useAgentChat$1(options) {
  const { agent, getInitialMessages, messages: optionsInitialMessages, onToolCall, onData, experimental_automaticToolResolution, tools, toolsRequiringConfirmation: manualToolsRequiringConfirmation, autoContinueAfterToolResult = true, autoSendAfterAllConfirmationsResolved = true, resume = true, cancelOnClientAbort = false, syncMessagesToServer = true, body: bodyOption, prepareSendMessagesRequest, ...rest } = options;
  if (manualToolsRequiringConfirmation) warnDeprecated("useAgentChat.toolsRequiringConfirmation", "The 'toolsRequiringConfirmation' option is deprecated. Use needsApproval on server-side tools instead. Will be removed in the next major version.");
  if (experimental_automaticToolResolution) warnDeprecated("useAgentChat.experimental_automaticToolResolution", "The 'experimental_automaticToolResolution' option is deprecated. Use the onToolCall callback instead. Will be removed in the next major version.");
  if (options.autoSendAfterAllConfirmationsResolved !== void 0) warnDeprecated("useAgentChat.autoSendAfterAllConfirmationsResolved", "The 'autoSendAfterAllConfirmationsResolved' option is deprecated. Use sendAutomaticallyWhen from AI SDK instead. Will be removed in the next major version.");
  const toolsRequiringConfirmation = reactExports.useMemo(() => {
    if (manualToolsRequiringConfirmation) return manualToolsRequiringConfirmation;
    if (!tools) return [];
    return Object.entries(tools).filter(([_name, tool]) => !tool.execute).map(([name]) => name);
  }, [manualToolsRequiringConfirmation, tools]);
  const onToolCallRef = reactExports.useRef(onToolCall);
  onToolCallRef.current = onToolCall;
  const onDataRef = reactExports.useRef(onData);
  onDataRef.current = onData;
  const rawHttpUrl = agent.getHttpUrl();
  const agentUrl = rawHttpUrl ? new URL(rawHttpUrl) : null;
  if (agentUrl) agentUrl.searchParams.delete("_pk");
  const agentUrlString = agentUrl?.toString() ?? null;
  const agentAddressKey = Array.isArray(agent.path) ? JSON.stringify(agent.path.map((step) => [step.agent, step.name])) : JSON.stringify([[agent.agent ?? "", agent.name ?? ""]]);
  const resolvedInitialMessagesCacheKey = agentUrl ? `${agentUrl.origin}${agentUrl.pathname}|${agentAddressKey}` : null;
  const initialMessagesCacheKey = agentAddressKey;
  const stableChatIdRef = reactExports.useRef(null);
  const previousAgentRef = reactExports.useRef(null);
  const previousAgentAddressKeyRef = reactExports.useRef(null);
  const fallbackChatId = agentAddressKey;
  const agentPathChanged = Array.isArray(agent.path) && previousAgentAddressKeyRef.current !== null && previousAgentAddressKeyRef.current !== agentAddressKey;
  if (stableChatIdRef.current === null) stableChatIdRef.current = resolvedInitialMessagesCacheKey ?? fallbackChatId;
  else if (previousAgentRef.current !== agent || agentPathChanged) stableChatIdRef.current = resolvedInitialMessagesCacheKey ?? fallbackChatId;
  previousAgentRef.current = agent;
  previousAgentAddressKeyRef.current = agentAddressKey;
  const agentRef = reactExports.useRef(agent);
  agentRef.current = agent;
  async function defaultGetInitialMessagesFetch({ url }) {
    if (!url) return [];
    const getMessagesUrl = new URL(url);
    getMessagesUrl.pathname += "/get-messages";
    const response = await fetch(getMessagesUrl.toString(), {
      credentials: options.credentials,
      headers: options.headers
    });
    if (!response.ok) {
      console.warn(`Failed to fetch initial messages: ${response.status} ${response.statusText}`);
      return [];
    }
    const text = await response.text();
    if (!text.trim()) return [];
    try {
      return JSON.parse(text);
    } catch (error) {
      console.warn("Failed to parse initial messages JSON:", error);
      return [];
    }
  }
  const getInitialMessagesFetch = getInitialMessages || defaultGetInitialMessagesFetch;
  function doGetInitialMessages(getInitialMessagesOptions, cacheKey) {
    if (requestCache.has(cacheKey)) return requestCache.get(cacheKey);
    const promise = getInitialMessagesFetch(getInitialMessagesOptions);
    requestCache.set(cacheKey, promise);
    return promise;
  }
  const initialMessagesPromise = !(getInitialMessages === null ? false : getInitialMessages ? true : !!agentUrlString) ? null : doGetInitialMessages({
    agent: agent.agent,
    name: agent.name,
    url: agentUrlString ?? void 0
  }, initialMessagesCacheKey);
  const initialMessages = initialMessagesPromise ? reactExports.use(initialMessagesPromise) : optionsInitialMessages ?? [];
  reactExports.useEffect(() => {
    if (!initialMessagesPromise) return;
    requestCache.set(initialMessagesCacheKey, initialMessagesPromise);
    return () => {
      if (requestCache.get(initialMessagesCacheKey) === initialMessagesPromise) requestCache.delete(initialMessagesCacheKey);
    };
  }, [initialMessagesCacheKey, initialMessagesPromise]);
  const toolsRef = reactExports.useRef(tools);
  toolsRef.current = tools;
  const prepareSendMessagesRequestRef = reactExports.useRef(prepareSendMessagesRequest);
  prepareSendMessagesRequestRef.current = prepareSendMessagesRequest;
  const bodyOptionRef = reactExports.useRef(bodyOption);
  bodyOptionRef.current = bodyOption;
  const localRequestIdsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const pendingReplayResumeRequestIdsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const replayHydratedAssistantMessageIdsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const fallbackAckedResumeRequestIdsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const customTransportRef = reactExports.useRef(null);
  if (customTransportRef.current === null) customTransportRef.current = new WebSocketChatTransport({
    agent: agentRef.current,
    activeRequestIds: localRequestIdsRef.current,
    cancelOnClientAbort,
    prepareBody: async ({ messages: msgs, trigger, messageId }) => {
      let extraBody = {};
      const currentBody = bodyOptionRef.current;
      if (currentBody) extraBody = { ...typeof currentBody === "function" ? await currentBody() : currentBody };
      if (toolsRef.current) {
        const clientToolSchemas = extractClientToolSchemas(toolsRef.current);
        if (clientToolSchemas) extraBody.clientTools = clientToolSchemas;
      }
      if (prepareSendMessagesRequestRef.current) {
        const userResult = await prepareSendMessagesRequestRef.current({
          id: agentRef.current._pk,
          messages: msgs,
          trigger,
          messageId
        });
        if (userResult.body) Object.assign(extraBody, userResult.body);
      }
      return extraBody;
    }
  });
  customTransportRef.current.agent = agentRef.current;
  customTransportRef.current.setCancelOnClientAbort(cancelOnClientAbort);
  const customTransport = customTransportRef.current;
  const useChatHelpers = useChat({
    ...rest,
    onData,
    messages: initialMessages,
    transport: customTransport,
    id: stableChatIdRef.current,
    resume
  });
  const { messages: chatMessages, setMessages, addToolResult, addToolApprovalResponse, sendMessage, resumeStream, status, stop } = useChatHelpers;
  const statusRef = reactExports.useRef(status);
  statusRef.current = status;
  const resumeStreamRef = reactExports.useRef(resumeStream);
  resumeStreamRef.current = resumeStream;
  const hasConnectedOnceRef = reactExports.useRef(false);
  const resumeInFlightRef = reactExports.useRef(false);
  const resumeGenerationRef = reactExports.useRef(0);
  const resumingToolContinuationRef = reactExports.useRef(false);
  const pendingToolContinuationRef = reactExports.useRef(false);
  const observedToolContinuationRequestIdRef = reactExports.useRef(null);
  const continuationLaunchTimerRef = reactExports.useRef(null);
  const continuationGenerationRef = reactExports.useRef(0);
  const [isToolContinuation, setIsToolContinuation] = reactExports.useState(false);
  const resetToolContinuation = reactExports.useCallback(() => {
    continuationGenerationRef.current++;
    pendingToolContinuationRef.current = false;
    resumingToolContinuationRef.current = false;
    observedToolContinuationRequestIdRef.current = null;
    if (continuationLaunchTimerRef.current) {
      clearTimeout(continuationLaunchTimerRef.current);
      continuationLaunchTimerRef.current = null;
    }
    setIsToolContinuation(false);
  }, []);
  const scheduleToolContinuationLaunch = reactExports.useCallback(() => {
    if (!pendingToolContinuationRef.current || statusRef.current !== "ready" || continuationLaunchTimerRef.current) return;
    continuationLaunchTimerRef.current = setTimeout(() => {
      continuationLaunchTimerRef.current = null;
      if (!pendingToolContinuationRef.current || statusRef.current !== "ready") return;
      pendingToolContinuationRef.current = false;
      const myGeneration = continuationGenerationRef.current;
      customTransport.expectToolContinuation();
      resumeStream().catch((error) => {
        console.error("[useAgentChat] Tool continuation resume failed:", error);
      }).finally(() => {
        if (continuationGenerationRef.current !== myGeneration) return;
        resumingToolContinuationRef.current = false;
        setIsToolContinuation(false);
      });
    }, 0);
  }, [customTransport, resumeStream]);
  const startToolContinuation = reactExports.useCallback(() => {
    if (!autoContinueAfterToolResult || resumingToolContinuationRef.current) return;
    ++continuationGenerationRef.current;
    resumingToolContinuationRef.current = true;
    pendingToolContinuationRef.current = true;
    setIsToolContinuation(true);
    scheduleToolContinuationLaunch();
  }, [autoContinueAfterToolResult, scheduleToolContinuationLaunch]);
  reactExports.useEffect(() => {
    if (status === "error" && pendingToolContinuationRef.current) {
      resetToolContinuation();
      return;
    }
    scheduleToolContinuationLaunch();
  }, [
    resetToolContinuation,
    scheduleToolContinuationLaunch,
    status
  ]);
  const stopWithToolContinuationAbort = reactExports.useCallback(async () => {
    try {
      customTransport.cancelActiveServerTurn();
      await stop();
    } finally {
      customTransport.abortActiveToolContinuation();
    }
  }, [stop, customTransport]);
  const processedToolCalls = reactExports.useRef(/* @__PURE__ */ new Set());
  const isResolvingToolsRef = reactExports.useRef(false);
  const [toolResolutionTrigger, setToolResolutionTrigger] = reactExports.useState(0);
  const [clientToolResults, setClientToolResults] = reactExports.useState(/* @__PURE__ */ new Map());
  const messagesRef = reactExports.useRef(chatMessages);
  messagesRef.current = chatMessages;
  const initialMessagesRef = reactExports.useRef(initialMessages);
  initialMessagesRef.current = initialMessages;
  const seededInitialMessagesKeyRef = reactExports.useRef(null);
  const markInitialMessagesSeeded = reactExports.useCallback(() => {
    seededInitialMessagesKeyRef.current = initialMessagesCacheKey;
  }, [initialMessagesCacheKey]);
  reactExports.useEffect(() => {
    if (!initialMessagesPromise) return;
    if (seededInitialMessagesKeyRef.current === initialMessagesCacheKey) return;
    markInitialMessagesSeeded();
    setMessages((prevMessages) => prependMissingHydratedMessages(initialMessagesRef.current, prevMessages));
  }, [
    initialMessagesCacheKey,
    initialMessagesPromise,
    markInitialMessagesSeeded,
    setMessages
  ]);
  const localResponseMessageIdsRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const protectedStreamingAssistantRef = reactExports.useRef(null);
  const preserveProtectedStreamingAssistant = reactExports.useCallback((messages) => {
    const protection = protectedStreamingAssistantRef.current;
    if (!protection) return [...messages];
    const protectedIndex = messages.findIndex((message) => message.id === protection.assistantId);
    if (protectedIndex >= 0 && messages.slice(protectedIndex + 1).some((message) => message.role === "assistant")) {
      protectedStreamingAssistantRef.current = null;
      return [...messages];
    }
    const protectedAssistant = messagesRef.current.find((message) => message.id === protection.assistantId) ?? messages.find((message) => message.id === protection.assistantId);
    if (!protectedAssistant) return [...messages];
    return [...messages.filter((message) => message.id !== protection.assistantId), protectedAssistant];
  }, []);
  const protectStreamingAssistantTail = reactExports.useCallback(() => {
    if (statusRef.current !== "streaming") return;
    const assistantInfo = findLastAssistantMessage(messagesRef.current);
    if (!assistantInfo) return;
    if (protectedStreamingAssistantRef.current?.assistantId !== assistantInfo.message.id) protectedStreamingAssistantRef.current = {
      assistantId: assistantInfo.message.id,
      anchorMessageId: messagesRef.current[assistantInfo.index - 1]?.id ?? null
    };
    setMessages((prevMessages) => {
      const protection = protectedStreamingAssistantRef.current;
      if (!protection) return prevMessages;
      return moveMessageToEnd(prevMessages, protection.assistantId);
    });
  }, [setMessages]);
  const restoreProtectedStreamingAssistant = reactExports.useCallback((assistantId) => {
    const protection = protectedStreamingAssistantRef.current;
    if (!protection || assistantId !== void 0 && protection.assistantId !== assistantId) return;
    protectedStreamingAssistantRef.current = null;
    setMessages((prevMessages) => {
      const sourceIdx = prevMessages.findIndex((m) => m.id === protection.assistantId);
      if (sourceIdx < 0) return prevMessages;
      const result = [...prevMessages];
      const [msg] = result.splice(sourceIdx, 1);
      if (!msg) return prevMessages;
      if (protection.anchorMessageId === null) result.unshift(msg);
      else {
        const anchorIdx = result.findIndex((m) => m.id === protection.anchorMessageId);
        result.splice(anchorIdx >= 0 ? anchorIdx + 1 : sourceIdx, 0, msg);
      }
      return result;
    });
  }, [setMessages]);
  const resetMatchingHydratedAssistantForReplay = reactExports.useCallback((messageId) => {
    setMessages((prevMessages) => {
      const lastMessage2 = prevMessages[prevMessages.length - 1];
      if (!lastMessage2 || lastMessage2.role !== "assistant" || lastMessage2.id !== messageId) return prevMessages;
      replayHydratedAssistantMessageIdsRef.current.add(messageId);
      const next = [...prevMessages];
      next[next.length - 1] = {
        ...lastMessage2,
        parts: []
      };
      return next;
    });
  }, [setMessages]);
  const collapseHydratedReplayTextParts = reactExports.useCallback((message) => {
    const parts = message.parts;
    const nextParts = parts.filter((part, index) => {
      if (part.type !== "text" || !("text" in part) || !part.text) return true;
      return !parts.some((candidate, candidateIndex) => {
        if (candidateIndex <= index) return false;
        if (candidate.type !== "text" || !("text" in candidate) || !candidate.text) return false;
        return candidate.text.startsWith(part.text);
      });
    });
    return nextParts.length === parts.length ? message : {
      ...message,
      parts: nextParts
    };
  }, []);
  reactExports.useEffect(() => {
    if (replayHydratedAssistantMessageIdsRef.current.size === 0) return;
    const idsToCollapse = new Set(chatMessages.filter((message) => replayHydratedAssistantMessageIdsRef.current.has(message.id) && message.role === "assistant" && collapseHydratedReplayTextParts(message) !== message).map((message) => message.id));
    if (idsToCollapse.size === 0) return;
    setMessages((prevMessages) => {
      let changed = false;
      const nextMessages = prevMessages.map((message) => {
        if (!idsToCollapse.has(message.id)) return message;
        const nextMessage = collapseHydratedReplayTextParts(message);
        if (nextMessage !== message) changed = true;
        return nextMessage;
      });
      return changed ? nextMessages : prevMessages;
    });
  }, [
    chatMessages,
    collapseHydratedReplayTextParts,
    setMessages
  ]);
  const resetLocalChatState = reactExports.useCallback(() => {
    markInitialMessagesSeeded();
    setMessages([]);
    setClientToolResults(/* @__PURE__ */ new Map());
    setPendingOnToolCallIds(/* @__PURE__ */ new Set());
    resetToolContinuation();
    processedToolCalls.current.clear();
    localResponseMessageIdsRef.current.clear();
    pendingReplayResumeRequestIdsRef.current.clear();
    fallbackAckedResumeRequestIdsRef.current.clear();
    replayHydratedAssistantMessageIdsRef.current.clear();
    protectedStreamingAssistantRef.current = null;
  }, [
    markInitialMessagesSeeded,
    setMessages,
    resetToolContinuation
  ]);
  const sendMessageWithStreamingProtection = reactExports.useCallback(async (message, options2) => {
    const request = sendMessage(message, options2);
    if (message !== void 0 && !(typeof message === "object" && message !== null && "messageId" in message && message.messageId != null)) protectStreamingAssistantTail();
    return request;
  }, [sendMessage, protectStreamingAssistantTail]);
  const lastMessage = chatMessages[chatMessages.length - 1];
  const pendingConfirmations = (() => {
    if (!lastMessage || lastMessage.role !== "assistant") return {
      messageId: void 0,
      toolCallIds: /* @__PURE__ */ new Set()
    };
    const pendingIds = /* @__PURE__ */ new Set();
    for (const part of lastMessage.parts ?? []) if (isToolUIPart(part) && part.state === "input-available" && toolsRequiringConfirmation.includes(getToolName(part))) pendingIds.add(part.toolCallId);
    return {
      messageId: lastMessage.id,
      toolCallIds: pendingIds
    };
  })();
  const pendingConfirmationsRef = reactExports.useRef(pendingConfirmations);
  pendingConfirmationsRef.current = pendingConfirmations;
  const [pendingOnToolCallIds, setPendingOnToolCallIds] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const finishOnToolCall = reactExports.useCallback((toolCallId) => {
    setPendingOnToolCallIds((prev) => {
      if (!prev.has(toolCallId)) return prev;
      const next = new Set(prev);
      next.delete(toolCallId);
      return next;
    });
  }, []);
  reactExports.useEffect(() => {
    if (!experimental_automaticToolResolution) return;
    if (isResolvingToolsRef.current) return;
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    const toolCalls = lastMsg.parts.filter((part) => isToolUIPart(part) && part.state === "input-available" && !processedToolCalls.current.has(part.toolCallId));
    if (toolCalls.length > 0) {
      const currentTools = toolsRef.current;
      const toolCallsToResolve = toolCalls.filter((part) => isToolUIPart(part) && !toolsRequiringConfirmation.includes(getToolName(part)) && currentTools?.[getToolName(part)]?.execute);
      if (toolCallsToResolve.length > 0) {
        isResolvingToolsRef.current = true;
        (async () => {
          try {
            const toolResults = [];
            for (const part of toolCallsToResolve) if (isToolUIPart(part)) {
              let toolOutput = null;
              const toolName = getToolName(part);
              const tool = currentTools?.[toolName];
              if (tool?.execute && part.input !== void 0) try {
                toolOutput = await tool.execute(part.input);
              } catch (error) {
                toolOutput = `Error executing tool: ${error instanceof Error ? error.message : String(error)}`;
              }
              processedToolCalls.current.add(part.toolCallId);
              toolResults.push({
                toolCallId: part.toolCallId,
                toolName,
                output: toolOutput
              });
            }
            if (toolResults.length > 0) {
              const clientToolSchemas = extractClientToolSchemas(currentTools);
              for (const result of toolResults) agentRef.current.send(JSON.stringify({
                type: "cf_agent_tool_result",
                toolCallId: result.toolCallId,
                toolName: result.toolName,
                output: result.output,
                autoContinue: autoContinueAfterToolResult,
                clientTools: clientToolSchemas
              }));
              await Promise.all(toolResults.map((result) => addToolResult({
                tool: result.toolName,
                toolCallId: result.toolCallId,
                output: result.output
              })));
              setClientToolResults((prev) => {
                const newMap = new Map(prev);
                for (const result of toolResults) newMap.set(result.toolCallId, result.output);
                return newMap;
              });
              startToolContinuation();
            }
          } finally {
            isResolvingToolsRef.current = false;
            setToolResolutionTrigger((c) => c + 1);
          }
        })();
      }
    }
  }, [
    chatMessages,
    experimental_automaticToolResolution,
    addToolResult,
    toolsRequiringConfirmation,
    autoContinueAfterToolResult,
    startToolContinuation,
    toolResolutionTrigger
  ]);
  const sendToolOutputToServer = reactExports.useCallback((toolCallId, toolName, output, state, errorText) => {
    const shouldAutoContinue = state === "output-error" ? false : autoContinueAfterToolResult;
    agentRef.current.send(JSON.stringify({
      type: "cf_agent_tool_result",
      toolCallId,
      toolName,
      output,
      ...state ? { state } : {},
      ...errorText !== void 0 ? { errorText } : {},
      autoContinue: shouldAutoContinue,
      clientTools: toolsRef.current ? extractClientToolSchemas(toolsRef.current) : void 0
    }));
    if (state !== "output-error") setClientToolResults((prev) => new Map(prev).set(toolCallId, output));
    if (shouldAutoContinue) startToolContinuation();
  }, [autoContinueAfterToolResult, startToolContinuation]);
  const sendToolApprovalToServer = reactExports.useCallback((toolCallId, approved) => {
    agentRef.current.send(JSON.stringify({
      type: "cf_agent_tool_approval",
      toolCallId,
      approved,
      autoContinue: autoContinueAfterToolResult
    }));
    if (autoContinueAfterToolResult) startToolContinuation();
  }, [autoContinueAfterToolResult, startToolContinuation]);
  reactExports.useEffect(() => {
    const currentOnToolCall = onToolCallRef.current;
    if (!currentOnToolCall) return;
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    const pendingToolCalls = lastMsg.parts.filter((part) => isToolUIPart(part) && part.state === "input-available" && !processedToolCalls.current.has(part.toolCallId));
    for (const part of pendingToolCalls) if (isToolUIPart(part)) {
      const toolCallId = part.toolCallId;
      const toolName = getToolName(part);
      processedToolCalls.current.add(toolCallId);
      setPendingOnToolCallIds((prev) => {
        if (prev.has(toolCallId)) return prev;
        const next = new Set(prev);
        next.add(toolCallId);
        return next;
      });
      const addToolOutput2 = (opts) => {
        sendToolOutputToServer(opts.toolCallId, toolName, opts.output, opts.state, opts.errorText);
        addToolResult({
          tool: toolName,
          toolCallId: opts.toolCallId,
          output: opts.state === "output-error" ? opts.errorText ?? "Tool execution denied by user" : opts.output
        });
      };
      let result;
      try {
        result = currentOnToolCall({
          toolCall: {
            toolCallId,
            toolName,
            input: part.input
          },
          addToolOutput: addToolOutput2
        });
      } catch (error) {
        finishOnToolCall(toolCallId);
        throw error;
      }
      Promise.resolve(result).finally(() => {
        finishOnToolCall(toolCallId);
      });
    }
  }, [
    chatMessages,
    sendToolOutputToServer,
    addToolResult,
    finishOnToolCall
  ]);
  const streamStateRef = reactExports.useRef({ status: "idle" });
  const [isServerStreaming, setIsServerStreaming] = reactExports.useState(false);
  const [isRecovering, setIsRecovering] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const localResponseIds = localResponseMessageIdsRef.current;
    function onAgentMessage(event) {
      if (typeof event.data !== "string") return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (_error) {
        return;
      }
      switch (data.type) {
        case "cf_agent_chat_clear":
          streamStateRef.current = transition(streamStateRef.current, { type: "clear" }).state;
          setIsServerStreaming(false);
          setIsRecovering(false);
          resetLocalChatState();
          break;
        case "cf_agent_chat_recovering":
          setIsRecovering(Boolean(data.recovering));
          break;
        case "cf_agent_chat_messages": {
          let next = preserveProtectedStreamingAssistant(data.messages);
          const observed = streamStateRef.current;
          if (observed.status === "observing" && observed.accumulator.parts.length > 0) {
            const snapshotIdx = next.findIndex((m) => m.id === observed.accumulator.messageId);
            const snapshotParts = snapshotIdx >= 0 ? next[snapshotIdx].parts.length : 0;
            if (observed.accumulator.parts.length >= snapshotParts) next = observed.accumulator.mergeInto(next);
          }
          setMessages(next);
          break;
        }
        case "cf_agent_message_updated":
          setMessages((prevMessages) => {
            const updatedMessage = data.message;
            let idx = prevMessages.findIndex((m) => m.id === updatedMessage.id);
            if (idx < 0) {
              const updatedToolCallIds = new Set(updatedMessage.parts.filter((p) => "toolCallId" in p && p.toolCallId).map((p) => p.toolCallId));
              if (updatedToolCallIds.size > 0) idx = prevMessages.findIndex((m) => m.parts.some((p) => "toolCallId" in p && updatedToolCallIds.has(p.toolCallId)));
            }
            if (idx >= 0) {
              const updated = [...prevMessages];
              updated[idx] = {
                ...updatedMessage,
                id: prevMessages[idx].id
              };
              return updated;
            }
            return prevMessages;
          });
          break;
        case "cf_agent_stream_resume_none":
          customTransport.handleStreamResumeNone();
          break;
        case "cf_agent_stream_pending":
          customTransport.handleStreamPending();
          break;
        case "cf_agent_stream_resuming": {
          const isEarlyToolContinuation = resumingToolContinuationRef.current && !customTransport.isAwaitingResume();
          if (!resume && !customTransport.isAwaitingResume()) {
            if (!isEarlyToolContinuation) return;
          }
          if (!resumingToolContinuationRef.current) pendingReplayResumeRequestIdsRef.current.add(data.id);
          if (customTransport.handleStreamResuming(data)) return;
          if (localRequestIdsRef.current.has(data.id)) return;
          if (fallbackAckedResumeRequestIdsRef.current.has(data.id)) return;
          if (isEarlyToolContinuation) {
            pendingToolContinuationRef.current = false;
            observedToolContinuationRequestIdRef.current = data.id;
            if (continuationLaunchTimerRef.current) {
              clearTimeout(continuationLaunchTimerRef.current);
              continuationLaunchTimerRef.current = null;
            }
          }
          streamStateRef.current = transition(streamStateRef.current, {
            type: "resume-fallback",
            streamId: data.id,
            messageId: nanoid()
          }).state;
          customTransport.observeServerTurn(data.id);
          setIsServerStreaming(true);
          setIsRecovering(false);
          fallbackAckedResumeRequestIdsRef.current.add(data.id);
          agentRef.current.send(JSON.stringify({
            type: "cf_agent_stream_resume_ack",
            id: data.id
          }));
          break;
        }
        case "cf_agent_use_chat_response": {
          if (localRequestIdsRef.current.has(data.id)) {
            if (data.body?.trim()) try {
              const chunkData2 = JSON.parse(data.body);
              if (chunkData2.type === "start" && typeof chunkData2.messageId === "string") {
                localResponseIds.set(data.id, chunkData2.messageId);
                if (!data.continuation) {
                  if (protectedStreamingAssistantRef.current?.assistantId !== chunkData2.messageId) {
                    const msgs = messagesRef.current;
                    const idx = msgs.findIndex((m) => m.id === chunkData2.messageId);
                    const anchorMessageId = idx >= 0 ? msgs[idx - 1]?.id ?? null : msgs[msgs.length - 1]?.id ?? null;
                    protectedStreamingAssistantRef.current = {
                      assistantId: chunkData2.messageId,
                      anchorMessageId
                    };
                  }
                }
                if (data.replay && !data.continuation && !resumingToolContinuationRef.current && observedToolContinuationRequestIdRef.current !== data.id) {
                  pendingReplayResumeRequestIdsRef.current.delete(data.id);
                  resetMatchingHydratedAssistantForReplay(chunkData2.messageId);
                }
              }
            } catch {
            }
            if (data.done || data.replayComplete) pendingReplayResumeRequestIdsRef.current.delete(data.id);
            if (data.done) {
              if (streamStateRef.current.status === "observing" && streamStateRef.current.streamId === data.id) {
                streamStateRef.current = { status: "idle" };
                setIsServerStreaming(false);
              }
              customTransport.handleServerTurnCompleted(data.id);
              restoreProtectedStreamingAssistant(localResponseIds.get(data.id));
              localResponseIds.delete(data.id);
              localRequestIdsRef.current.delete(data.id);
              fallbackAckedResumeRequestIdsRef.current.delete(data.id);
            }
            return;
          }
          let chunkData;
          if (data.replay && streamStateRef.current.status !== "observing" && !pendingReplayResumeRequestIdsRef.current.has(data.id)) return;
          if (data.body?.trim()) try {
            chunkData = JSON.parse(data.body);
            if (data.replay && !data.continuation && !resumingToolContinuationRef.current && observedToolContinuationRequestIdRef.current !== data.id && typeof chunkData.messageId === "string" && chunkData.type === "start") {
              pendingReplayResumeRequestIdsRef.current.delete(data.id);
              resetMatchingHydratedAssistantForReplay(chunkData.messageId);
            }
            if (typeof chunkData.type === "string" && chunkData.type.startsWith("data-") && onDataRef.current) onDataRef.current(chunkData);
          } catch (parseError) {
            console.warn("[useAgentChat] Failed to parse stream chunk:", parseError instanceof Error ? parseError.message : parseError, "body:", data.body?.slice(0, 100));
          }
          if (data.done || data.replayComplete) pendingReplayResumeRequestIdsRef.current.delete(data.id);
          if (data.done) {
            customTransport.handleServerTurnCompleted(data.id);
            fallbackAckedResumeRequestIdsRef.current.delete(data.id);
            setIsRecovering(false);
          }
          const completedObservedToolContinuation = data.done && observedToolContinuationRequestIdRef.current === data.id;
          const result = transition(streamStateRef.current, {
            type: "response",
            streamId: data.id,
            messageId: nanoid(),
            chunkData,
            done: data.done,
            error: data.error,
            replay: data.replay,
            replayComplete: data.replayComplete,
            continuation: data.continuation,
            currentMessages: data.continuation ? messagesRef.current : void 0
          });
          streamStateRef.current = result.state;
          if (result.messagesUpdate) setMessages(result.messagesUpdate);
          setIsServerStreaming(result.isStreaming);
          if (completedObservedToolContinuation) resetToolContinuation();
          break;
        }
      }
    }
    const fallbackAckedResumeRequestIds = fallbackAckedResumeRequestIdsRef.current;
    function onAgentClose() {
      fallbackAckedResumeRequestIds.clear();
    }
    function onAgentOpen() {
      if (!hasConnectedOnceRef.current) {
        hasConnectedOnceRef.current = true;
        return;
      }
      if (!resume || statusRef.current !== "ready" || resumingToolContinuationRef.current || resumeInFlightRef.current || customTransport.isAwaitingResume()) return;
      const resumeStreamFn = resumeStreamRef.current;
      if (!resumeStreamFn) return;
      resumeInFlightRef.current = true;
      const myGeneration = resumeGenerationRef.current;
      Promise.resolve(resumeStreamFn()).catch(() => {
      }).finally(() => {
        if (resumeGenerationRef.current !== myGeneration) return;
        resumeInFlightRef.current = false;
      });
    }
    agent.addEventListener("message", onAgentMessage);
    agent.addEventListener("close", onAgentClose);
    agent.addEventListener("open", onAgentOpen);
    return () => {
      agent.removeEventListener("message", onAgentMessage);
      agent.removeEventListener("close", onAgentClose);
      agent.removeEventListener("open", onAgentOpen);
      fallbackAckedResumeRequestIds.clear();
      streamStateRef.current = { status: "idle" };
      setIsServerStreaming(false);
      setIsRecovering(false);
      protectedStreamingAssistantRef.current = null;
      localResponseIds.clear();
      resumeGenerationRef.current++;
      resumeInFlightRef.current = false;
    };
  }, [
    agent,
    setMessages,
    resume,
    customTransport,
    preserveProtectedStreamingAssistant,
    resetToolContinuation,
    resetMatchingHydratedAssistantForReplay,
    restoreProtectedStreamingAssistant,
    resetLocalChatState
  ]);
  const addToolResultAndSendMessage = async (args) => {
    const { toolCallId } = args;
    const toolName = "tool" in args ? args.tool : "";
    const output = "output" in args ? args.output : void 0;
    agentRef.current.send(JSON.stringify({
      type: "cf_agent_tool_result",
      toolCallId,
      toolName,
      output,
      autoContinue: autoContinueAfterToolResult,
      clientTools: toolsRef.current ? extractClientToolSchemas(toolsRef.current) : void 0
    }));
    setClientToolResults((prev) => new Map(prev).set(toolCallId, output));
    addToolResult(args);
    if (autoContinueAfterToolResult) startToolContinuation();
    if (!autoContinueAfterToolResult) {
      if (!autoSendAfterAllConfirmationsResolved) {
        sendMessage();
        return;
      }
      const pending = pendingConfirmationsRef.current?.toolCallIds;
      if (!pending) {
        sendMessage();
        return;
      }
      const wasLast = pending.size === 1 && pending.has(toolCallId);
      if (pending.has(toolCallId)) pending.delete(toolCallId);
      if (wasLast || pending.size === 0) sendMessage();
    }
  };
  const addToolApprovalResponseAndNotifyServer = (args) => {
    const { id: approvalId, approved } = args;
    let toolCallId;
    for (const msg of messagesRef.current) {
      for (const part of msg.parts) if ("toolCallId" in part && "approval" in part && part.approval?.id === approvalId) {
        toolCallId = part.toolCallId;
        break;
      }
      if (toolCallId) break;
    }
    if (toolCallId) sendToolApprovalToServer(toolCallId, approved);
    else console.warn(`[useAgentChat] addToolApprovalResponse: Could not find toolCallId for approval ID "${approvalId}". Server will not be notified, which may cause duplicate messages.`);
    addToolApprovalResponse(args);
  };
  const messagesWithToolResults = reactExports.useMemo(() => {
    if (clientToolResults.size === 0) return chatMessages;
    return chatMessages.map((msg) => ({
      ...msg,
      parts: msg.parts.map((p) => {
        if (!("toolCallId" in p) || !("state" in p) || p.state !== "input-available" || !clientToolResults.has(p.toolCallId)) return p;
        return {
          ...p,
          state: "output-available",
          output: clientToolResults.get(p.toolCallId)
        };
      })
    }));
  }, [chatMessages, clientToolResults]);
  reactExports.useEffect(() => {
    const currentToolCallIds = /* @__PURE__ */ new Set();
    for (const msg of chatMessages) for (const part of msg.parts) if ("toolCallId" in part && part.toolCallId) currentToolCallIds.add(part.toolCallId);
    setClientToolResults((prev) => {
      if (prev.size === 0) return prev;
      let hasStaleEntries = false;
      for (const toolCallId of prev.keys()) if (!currentToolCallIds.has(toolCallId)) {
        hasStaleEntries = true;
        break;
      }
      if (!hasStaleEntries) return prev;
      const newMap = /* @__PURE__ */ new Map();
      for (const [id, output] of prev) if (currentToolCallIds.has(id)) newMap.set(id, output);
      return newMap;
    });
    for (const toolCallId of processedToolCalls.current) if (!currentToolCallIds.has(toolCallId)) processedToolCalls.current.delete(toolCallId);
  }, [chatMessages]);
  const addToolOutput = reactExports.useCallback((opts) => {
    const toolName = opts.toolName ?? "";
    sendToolOutputToServer(opts.toolCallId, toolName, opts.output, opts.state, opts.errorText);
    addToolResult({
      tool: toolName,
      toolCallId: opts.toolCallId,
      output: opts.state === "output-error" ? opts.errorText ?? "Tool execution denied by user" : opts.output
    });
  }, [sendToolOutputToServer, addToolResult]);
  const lastAssistantMessage = messagesWithToolResults[messagesWithToolResults.length - 1];
  const hasPendingClientToolCalls = (() => {
    if (pendingOnToolCallIds.size === 0 && !tools) return false;
    if (!lastAssistantMessage || lastAssistantMessage.role !== "assistant") return false;
    for (const part of lastAssistantMessage.parts) {
      if (!isToolUIPart(part)) continue;
      if (part.state !== "input-available") continue;
      const toolName = getToolName(part);
      if (toolsRequiringConfirmation.includes(toolName)) continue;
      if (pendingOnToolCallIds.has(part.toolCallId)) return true;
      if (tools?.[toolName]?.execute) return true;
    }
    return false;
  })();
  const effectiveIsServerStreaming = isServerStreaming || hasPendingClientToolCalls;
  const isStreaming = status === "streaming" || effectiveIsServerStreaming;
  return {
    ...useChatHelpers,
    messages: messagesWithToolResults,
    isServerStreaming: effectiveIsServerStreaming,
    isStreaming,
    /**
    * True while a durable chat turn is being recovered (interrupted by a
    * deploy/eviction or a stream-stall watchdog abort and now resuming, #1620).
    * Distinct from `isStreaming` — a recovering turn isn't producing tokens
    * yet. Render a "recovering…" hint; most UIs treat `isStreaming ||
    * isRecovering` as "busy". Cleared automatically on the next stream/terminal.
    */
    isRecovering,
    isToolContinuation,
    connectionError: agent.connectionError ?? null,
    sendMessage: sendMessageWithStreamingProtection,
    stop: stopWithToolContinuationAbort,
    /**
    * Provide output for a tool call. Use this for tools that require user interaction
    * or client-side execution.
    */
    addToolOutput,
    /**
    * @deprecated Use `addToolOutput` instead.
    */
    addToolResult: addToolResultAndSendMessage,
    /**
    * Respond to a tool approval request. Use this for tools with `needsApproval`.
    * This wrapper notifies the server before updating local state, preventing
    * duplicate messages when sendMessage() is called afterward.
    */
    addToolApprovalResponse: addToolApprovalResponseAndNotifyServer,
    clearHistory: () => {
      resetLocalChatState();
      agent.send(JSON.stringify({ type: "cf_agent_chat_clear" }));
    },
    setMessages: (messagesOrUpdater) => {
      let resolvedMessages;
      if (typeof messagesOrUpdater === "function") resolvedMessages = messagesOrUpdater(messagesRef.current);
      else resolvedMessages = messagesOrUpdater;
      if (resolvedMessages.length === 0) markInitialMessagesSeeded();
      setMessages(resolvedMessages);
      if (syncMessagesToServer) agent.send(JSON.stringify({
        messages: resolvedMessages,
        type: "cf_agent_chat_messages"
      }));
    }
  };
}
function useAgentChat(options) {
  options.syncMessagesToServer;
  return useAgentChat$1({
    ...options,
    syncMessagesToServer: false
  });
}
const SUGGESTIONS = [
  "What keywords should I focus on next?",
  "Who are my top SERP competitors?",
  "How is my Search Console traffic trending?",
  "Find quick-win keywords I already rank for"
];
function SamConversation({
  projectId,
  sessionId
}) {
  const agent = useAgent({ agent: "sam-chat", name: sessionId });
  const { messages, sendMessage, setMessages, status } = useAgentChat({ agent });
  const isBusy = status === "submitted" || status === "streaming";
  const sendText = (text) => void sendMessage({ text });
  const rewindTo = async (messageId) => {
    const response = await fetch(`/agents/sam-chat/${sessionId}/rewind`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageId })
    });
    if (!response.ok) return false;
    const fresh = await fetch(
      `/agents/sam-chat/${sessionId}/get-messages`
    ).then((res) => res.ok ? res.json() : null);
    if (Array.isArray(fresh)) setMessages(fresh);
    return true;
  };
  const undoFrom = (messageId) => void rewindTo(messageId);
  const editAndResend = async (messageId, newText) => {
    if (await rewindTo(messageId)) void sendMessage({ text: newText });
  };
  const wasBusyRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (isBusy) {
      wasBusyRef.current = true;
      return;
    }
    if (wasBusyRef.current) {
      wasBusyRef.current = false;
      invalidateSamSessions(projectId);
    }
  }, [isBusy, projectId]);
  const scrollRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);
  const lastMessage = messages[messages.length - 1];
  const showTyping = isBusy && (lastMessage?.role !== "assistant" || !messageHasVisibleContent(lastMessage));
  const showSuggestions = messages.length === 0 && !isBusy;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex min-w-0 flex-1 flex-col", children: [
    null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollRef, className: "flex-1 overflow-y-auto px-5 py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-2xl space-y-6", children: [
      messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm text-base-content/80", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Hey, I’m SAM — your in-app SEO agent. I can research keywords, size up competitors, read your SERPs, backlinks, rank tracking and Search Console, and turn it into next steps for this project." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Ask me anything, or start with one of these:" })
      ] }) : null,
      messages.map((message, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        ChatMessage,
        {
          message,
          resolveToolLabel: humanizeToolLabel,
          streaming: isBusy && index === messages.length - 1 && message.role === "assistant",
          onUndo: (
            // Allowed even mid-turn: rewind aborts the in-flight turn
            // server-side, so undo doubles as "stop and take it back".
            message.role === "user" ? () => undoFrom(message.id) : void 0
          ),
          onEdit: message.role === "user" ? (newText) => void editAndResend(message.id, newText) : void 0
        },
        message.id
      )),
      showTyping ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 pt-1 text-base-content/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-1.5 animate-bounce rounded-full bg-current" })
      ] }) }) : null,
      status === "error" ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: "Something went wrong. Please try again." }) : null,
      showSuggestions ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: SUGGESTIONS.map((question) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-medium text-base-content/70 transition-colors hover:border-primary/50 hover:text-base-content",
          onClick: () => sendText(question),
          children: question
        },
        question
      )) }) : null
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 border-t border-base-300 px-5 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-full max-w-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      ChatComposer,
      {
        busy: isBusy,
        onSend: sendText,
        placeholder: "Ask SAM to research, analyze, or track anything…"
      }
    ) }) })
  ] });
}
function SamChat({
  projectId,
  activeSessionId
}) {
  const navigate = useNavigate();
  const access = useSamAccess(projectId);
  const sessionsQuery = useQuery(samSessionsQueryOptions(projectId));
  const sessions = sessionsQuery.data ?? [];
  const goToSession = reactExports.useCallback(
    (sessionId) => void navigate({
      to: "/p/$projectId/sam",
      params: { projectId },
      search: { s: sessionId },
      replace: true
    }),
    [navigate, projectId]
  );
  const createSession = useMutation({
    mutationFn: () => createSamSession({ data: { projectId } }),
    onSuccess: ({ id }) => {
      invalidateSamSessions(projectId);
      goToSession(id);
    }
  });
  const firstSessionId = sessions[0]?.id;
  reactExports.useEffect(() => {
    if (activeSessionId || !firstSessionId) return;
    goToSession(firstSessionId);
  }, [activeSessionId, firstSessionId, goToSession]);
  if (access.showSetupGate) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-auto px-4 py-4 md:px-6 md:py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-3xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      SamSetupGate,
      {
        errorMessage: access.errorMessage,
        isRefetching: access.isRefetching,
        onRetry: access.onRetry
      }
    ) }) });
  }
  if (activeSessionId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      reactExports.Suspense,
      {
        fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-5 animate-spin text-base-content/40" }) }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SamConversation,
          {
            projectId,
            sessionId: activeSessionId
          },
          activeSessionId
        )
      }
    ) });
  }
  if (sessionsQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-5 animate-spin text-base-content/40" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-4 p-6 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-6" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: "What should we work on?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-sm text-base-content/60", children: "SAM is your in-app SEO agent with access to every OpenSEO research tool. Start a chat to get going." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "btn btn-primary btn-sm gap-1",
        disabled: createSession.isPending,
        onClick: () => createSession.mutate(),
        children: [
          createSession.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
          "New chat"
        ]
      }
    )
  ] });
}
function SamRoute() {
  const {
    projectId
  } = Route.useParams();
  const {
    s
  } = Route.useSearch();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SamChat, { projectId, activeSessionId: s });
}
export {
  SamRoute as component
};
