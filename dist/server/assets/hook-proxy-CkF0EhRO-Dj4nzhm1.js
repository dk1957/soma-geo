function jsonSafe(value, depth = 0) {
  if (depth > 6) return void 0;
  if (value === null || value === void 0) return value;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (t === "bigint") return String(value);
  if (t === "function" || t === "symbol") return void 0;
  if (value instanceof Error) return {
    name: value.name,
    message: value.message,
    stack: value.stack
  };
  if (Array.isArray(value)) return value.map((v) => jsonSafe(v, depth + 1));
  if (t === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v instanceof AbortSignal) continue;
      const safe = jsonSafe(v, depth + 1);
      if (safe !== void 0) out[k] = safe;
    }
    return out;
  }
  try {
    return String(value);
  } catch {
    return;
  }
}
function createTurnContextSnapshot(ctx) {
  return {
    system: ctx.system,
    toolNames: Object.keys(ctx.tools),
    messageCount: ctx.messages.length,
    continuation: ctx.continuation,
    body: ctx.body,
    modelId: ctx.model.modelId ?? "unknown"
  };
}
function parseHookResult(json) {
  try {
    const parsed = JSON.parse(json);
    if (parsed.skipped) return { skipped: true };
    if (parsed.error) return { error: parsed.error };
    return { config: parsed.result ?? {} };
  } catch {
    return { error: "Failed to parse hook result" };
  }
}
function createToolCallStartSnapshot(event) {
  return {
    toolName: event.toolCall.toolName,
    toolCallId: event.toolCall.toolCallId,
    input: jsonSafe(event.toolCall.input),
    stepNumber: event.stepNumber,
    ...event.toolCall.dynamic !== void 0 ? { dynamic: event.toolCall.dynamic } : {}
  };
}
function createToolCallFinishSnapshot(event) {
  return {
    toolName: event.toolCall.toolName,
    toolCallId: event.toolCall.toolCallId,
    input: jsonSafe(event.toolCall.input),
    stepNumber: event.stepNumber,
    durationMs: event.durationMs,
    success: event.success,
    ...event.success ? { output: jsonSafe(event.output) } : { error: jsonSafe(event.error) },
    ...event.toolCall.dynamic !== void 0 ? { dynamic: event.toolCall.dynamic } : {}
  };
}
function createStepFinishSnapshot(event) {
  return {
    stepNumber: event.stepNumber,
    finishReason: event.finishReason,
    text: event.text,
    reasoningText: event.reasoningText,
    toolCallCount: event.toolCalls.length,
    toolResultCount: event.toolResults.length,
    usage: event.usage ? {
      inputTokens: event.usage.inputTokens,
      outputTokens: event.usage.outputTokens,
      totalTokens: event.usage.totalTokens,
      reasoningTokens: event.usage.reasoningTokens,
      cachedInputTokens: event.usage.cachedInputTokens
    } : void 0,
    providerMetadata: event.providerMetadata
  };
}
function createChunkSnapshot(event) {
  const c = event.chunk;
  const snapshot = { type: c.type };
  if (typeof c.text === "string") snapshot.text = c.text;
  if (typeof c.toolName === "string") snapshot.toolName = c.toolName;
  if (typeof c.toolCallId === "string") snapshot.toolCallId = c.toolCallId;
  return snapshot;
}
export {
  createChunkSnapshot,
  createStepFinishSnapshot,
  createToolCallFinishSnapshot,
  createToolCallStartSnapshot,
  createTurnContextSnapshot,
  parseHookResult
};
