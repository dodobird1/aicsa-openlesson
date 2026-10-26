import { getLLMConfig, LIMITS, PRESETS } from "../../../lib/llm/config";
import { ChatError, isSameSiteRequest, readBoundedJSON, validateChatInput } from "../../../lib/llm/validation";
import { allowChatRequest } from "../../../lib/llm/rate-limit";
import { parseCompletionStream } from "../../../lib/llm/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: privateHeaders });
}

export function GET() {
  return Response.json({ configured: Boolean(getLLMConfig()), presets: Object.keys(PRESETS) }, { headers: privateHeaders });
}

export async function POST(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
  if (!isSameSiteRequest(request.headers.get("origin"), forwardedHost, request.headers.get("sec-fetch-site"), new URL(request.url).origin)) return errorResponse("Requests must come from this site.", 403);
  const config = getLLMConfig();
  if (!config) return errorResponse("AI practice is not configured yet. You can still use the other exercises.", 503);
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
  const key = (forwardedFor.at(-1) || "shared").slice(0, 128);
  if (!allowChatRequest(key)) return errorResponse("Too many requests. Please wait a minute and try again.", 429);

  const abort = new AbortController();
  const onAbort = () => abort.abort();
  request.signal.addEventListener("abort", onAbort, { once: true });
  if (request.signal.aborted) abort.abort();
  const timer = setTimeout(() => abort.abort(), LIMITS.timeoutMs);
  const cleanup = () => {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", onAbort);
  };
  try {
    const input = validateChatInput(await readBoundedJSON(request, abort.signal));
    if (abort.signal.aborted) throw new ChatError("The request was cancelled or timed out. Please retry.", 408);
    const upstream = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({
        model: config.model,
        stream: true,
        max_tokens: LIMITS.outputTokens,
        messages: [
          { role: "system", content: [PRESETS[input.preset], config.systemPrompt].filter(Boolean).join("\n\n") },
          ...input.messages,
        ],
      }),
      signal: abort.signal,
      redirect: "error",
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body || !upstream.headers.get("content-type")?.toLowerCase().includes("text/event-stream")) {
      await upstream.body?.cancel();
      abort.abort();
      cleanup();
      return errorResponse("The AI service is temporarily unavailable. Please try again shortly.", 502);
    }
    const iterator = parseCompletionStream(upstream.body);
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const result = await iterator.next();
          if (result.done) { cleanup(); abort.abort(); controller.close(); }
          else controller.enqueue(encoder.encode(result.value));
        } catch {
          cleanup(); abort.abort();
          controller.error(new Error("The AI response was interrupted. Please retry."));
        }
      },
      async cancel() {
        abort.abort(); cleanup();
        await iterator.return(undefined).catch(() => undefined);
      },
    });
    return new Response(stream, { headers: { ...privateHeaders, "Content-Type": "text/plain; charset=utf-8", "X-Accel-Buffering": "no" } });
  } catch (error) {
    cleanup(); abort.abort();
    if (error instanceof ChatError) return errorResponse(error.message, error.status);
    return errorResponse("The AI service did not respond. Please try again shortly.", 502);
  }
}
