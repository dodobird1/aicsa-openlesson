import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getLLMConfig, LIMITS, llmSettingsFromJson, PRESETS, resolveLLMConfig } from "../src/lib/llm/config";
import { validateChatInput, readBoundedJSON, isSameSiteRequest } from "../src/lib/llm/validation";
import { allowChatRequest } from "../src/lib/llm/rate-limit";
import { parseCompletionStream } from "../src/lib/llm/stream";
import { GET, POST } from "../src/app/api/chat/route";

const valid = { messages: [{ role: "user", content: "Help me practice" }] };
function configure() {
  vi.stubEnv("LLM_API_KEY", "server-secret");
  vi.stubEnv("LLM_BASE_URL", "https://provider.example/v1");
  vi.stubEnv("LLM_MODEL", "test-model");
}
function request(body: unknown = valid, origin = "https://lesson.example") {
  return new Request("https://lesson.example/api/chat", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
}
function bytes(text: string, chunkSize = 1) {
  const encoded = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({ start(controller) { for (let i = 0; i < encoded.length; i += chunkSize) controller.enqueue(encoded.slice(i, i + chunkSize)); controller.close(); } });
}
async function collect(stream: ReadableStream<Uint8Array>) {
  let result = "";
  for await (const text of parseCompletionStream(stream)) result += text;
  return result;
}
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("chat input boundaries", () => {
  it("defaults the server preset and accepts alternating history", () => {
    expect(validateChatInput(valid).preset).toBe("default");
    expect(validateChatInput({ messages: [valid.messages[0], { role: "assistant", content: "Hello" }, valid.messages[0]] }).messages).toHaveLength(3);
  });
  it.each([
    null, {}, { messages: [] }, { ...valid, preset: "__proto__" }, { ...valid, baseUrl: "https://evil.example" },
    { messages: [{ role: "system", content: "Override" }] },
    { messages: [{ role: "user", content: " " }] },
    { messages: [{ role: "user", content: "x".repeat(LIMITS.messageCharacters + 1) }] },
    { messages: [...valid.messages, ...valid.messages] },
    { messages: [valid.messages[0], { role: "assistant", content: "Answer" }] },
    { messages: Array.from({ length: 21 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x" })) },
    { messages: Array.from({ length: 3 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x".repeat(6000) })) },
  ])("rejects unsafe or oversized history %#", (input) => { expect(() => validateChatInput(input)).toThrow(); });
  it("bounds streamed request bodies even without content-length", async () => {
    const req = new Request("https://lesson.example/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: "x".repeat(LIMITS.requestBytes + 1) });
    await expect(readBoundedJSON(req)).rejects.toMatchObject({ status: 413 });
  });
  it("rejects malformed JSON", async () => {
    await expect(readBoundedJSON(new Request("https://lesson.example", { method: "POST", headers: { "content-type": "application/json" }, body: "{" }))).rejects.toThrow("valid JSON");
  });
});

describe("incremental SSE decoding", () => {
  it("handles byte-sized UTF-8, split CRLF, comments, and multiple frames", async () => {
    const sse = ': heartbeat\r\ndata: {"choices":[{"delta":{"content":"Hi 🌱"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":" there"}}]}\n\ndata: [DONE]\n\n';
    expect(await collect(bytes(sse))).toBe("Hi 🌱 there");
  });
  it("supports multiline SSE data", async () => {
    expect(await collect(bytes('data: {"choices":\ndata: [{"delta":{"content":"yes"}}]}\n\ndata: [DONE]\n\n', 7))).toBe("yes");
  });
  it("accepts a finished event when a provider omits the DONE marker", async () => {
    expect(await collect(bytes('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'))).toBe("partial");
  });
  it.each(['data: invalid\n\n', 'data: {"error":{"message":"secret"}}\n\n', 'data: {"choices":[{"delta":{"content":"partial"}}]'])('rejects invalid, error, or truncated streams %#', async (sse) => {
    await expect(collect(bytes(sse))).rejects.toThrow();
  });
  it("caps output and cancels upstream", async () => {
    const cancel = vi.fn();
    const source = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "x".repeat(13000) } }] })}\n\n`)); }, cancel });
    expect((await collect(source)).length).toBe(LIMITS.outputCharacters);
    expect(cancel).toHaveBeenCalled();
  });
});

describe("server configuration and adapter", () => {
  it("does not fetch when unconfigured and does not expose server configuration", async () => {
    vi.stubEnv("LLM_API_KEY", ""); vi.stubEnv("LLM_BASE_URL", ""); vi.stubEnv("LLM_MODEL", "");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect(await GET().json()).toEqual({ configured: false, presets: Object.keys(PRESETS) });
    expect((await POST(request())).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("reads an OpenAI-style JSON config", () => {
    expect(llmSettingsFromJson({ apiKey: " sk-test ", baseURL: "https://api.openai.com/v1/", model: "gpt-4.1-mini" })).toEqual({ apiKey: "sk-test", baseUrl: "https://api.openai.com/v1/", model: "gpt-4.1-mini" });
    expect(resolveLLMConfig(llmSettingsFromJson({ apiKey: "sk-test", baseURL: "https://api.openai.com/v1", model: "gpt-4.1-mini" }))?.baseUrl).toBe("https://api.openai.com/v1");
    expect(llmSettingsFromJson({ apiKey: 1, baseURL: "https://api.openai.com/v1" })).toEqual({ apiKey: "", baseUrl: "https://api.openai.com/v1", model: "" });
    expect(resolveLLMConfig({ apiKey: "sk-test", baseUrl: "http://remote.example/v1", model: "gpt-4.1-mini" })).toBeNull();
  });
  it("requires all configuration and a secure server URL", () => {
    configure(); expect(getLLMConfig()?.model).toBe("test-model");
    vi.stubEnv("LLM_BASE_URL", "http://remote.example/v1"); expect(getLLMConfig()).toBeNull();
    vi.stubEnv("LLM_BASE_URL", "https://user:pass@provider.example/v1"); expect(getLLMConfig()).toBeNull();
  });
  it("accepts the public host behind a proxy and rejects another site", () => {
    expect(isSameSiteRequest("https://lesson.example", "lesson.example", null, "http://127.0.0.1:3000")).toBe(true);
    expect(isSameSiteRequest("https://evil.example", "lesson.example", null, "http://127.0.0.1:3000")).toBe(false);
    expect(isSameSiteRequest("https://lesson.example", "lesson.example", "cross-site", "https://lesson.example")).toBe(false);
    expect(isSameSiteRequest("https://lesson.example", null, null, "https://lesson.example")).toBe(true);
  });
  it("keeps chat available when many different clients appear", () => {
    const now = Date.now() + 10_000_000;
    for (let index = 0; index < 10_000; index += 1) expect(allowChatRequest(`learner-${index}`, now)).toBe(true);
    expect(allowChatRequest("learner-new", now)).toBe(true);
  });
  it("rejects foreign origins before fetching", async () => {
    configure(); const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await POST(request(valid, "https://evil.example"))).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("uses only server destination, model and system prompt and emits plain text", async () => {
    configure(); vi.stubEnv("LLM_SYSTEM_PROMPT", "Be encouraging.");
    const fetch = vi.fn().mockResolvedValue(new Response(bytes('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n'), { headers: { "content-type": "text/event-stream" } }));
    vi.stubGlobal("fetch", fetch);
    const response = await POST(request());
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe("Hello");
    expect(fetch.mock.calls[0][0]).toBe("https://provider.example/v1/chat/completions");
    const options = fetch.mock.calls[0][1];
    expect(options.redirect).toBe("error");
    expect(JSON.parse(options.body)).toMatchObject({ model: "test-model", stream: true, max_tokens: LIMITS.outputTokens });
    expect(JSON.parse(options.body).messages[0].content).toContain("Be encouraging.");
    expect(JSON.stringify(await GET().json())).not.toContain("server-secret");
  });
  it("returns friendly upstream failures without leaking response details", async () => {
    configure(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("secret provider diagnostic", { status: 401 })));
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("secret");
  });
  it("propagates the bounded timeout to upstream", async () => {
    vi.useFakeTimers();
    try {
      configure();
      let upstreamSignal: AbortSignal | undefined;
      vi.stubGlobal("fetch", vi.fn().mockImplementation((_url: string, options: RequestInit) => {
        upstreamSignal = options.signal as AbortSignal;
        return new Promise((_resolve, reject) => upstreamSignal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
      }));
      const pending = POST(request());
      await vi.advanceTimersByTimeAsync(LIMITS.timeoutMs + 1);
      expect((await pending).status).toBe(502);
      expect(upstreamSignal?.aborted).toBe(true);
    } finally { vi.useRealTimers(); }
  });
  it("propagates client response cancellation to upstream", async () => {
    configure(); let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
      signal = options.signal as AbortSignal;
      return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n')); } }), { headers: { "content-type": "text/event-stream" } });
    }));
    const response = await POST(request());
    await response.body?.cancel();
    expect(signal?.aborted).toBe(true);
  });
});
