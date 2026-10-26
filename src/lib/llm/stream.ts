import "server-only";
import { LIMITS } from "./config";

/** Incremental SSE parser: UTF-8, CR/LF/CRLF, multiline data and partial frames. */
export async function* parseCompletionStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let pending = "";
  let data: string[] = [];
  let eventSize = 0;
  let completed = false;
  let outputSize = 0;
  function parseEvent(): string | null {
    const payload = data.join("\n");
    data = []; eventSize = 0;
    if (!payload) return null;
    if (payload === "[DONE]") { completed = true; return null; }
    let parsed: unknown;
    try { parsed = JSON.parse(payload); } catch { throw new Error("The AI provider sent an invalid response."); }
    if (!parsed || typeof parsed !== "object") throw new Error("The AI provider sent an invalid response.");
    const event = parsed as { error?: unknown; choices?: { delta?: { content?: unknown } }[] };
    if (event.error) throw new Error("The AI provider could not finish the response.");
    const content = event.choices?.[0]?.delta?.content;
    if (content == null) return null;
    if (typeof content !== "string") throw new Error("The AI provider sent an invalid response.");
    return content;
  }
  try {
    while (!completed) {
      const { value, done } = await reader.read();
      pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let index: number;
      while ((index = pending.search(/[\r\n]/)) !== -1) {
        if (pending[index] === "\r" && index === pending.length - 1 && !done) break;
        const line = pending.slice(0, index);
        const width = pending[index] === "\r" && pending[index + 1] === "\n" ? 2 : 1;
        pending = pending.slice(index + width);
        if (line === "") {
          const text = parseEvent();
          if (text) {
            const remaining = LIMITS.outputCharacters - outputSize;
            const bounded = text.slice(0, remaining);
            outputSize += bounded.length;
            if (bounded) yield bounded;
            if (outputSize >= LIMITS.outputCharacters) return;
          }
          if (completed) break;
        } else if (line.startsWith("data:")) {
          const fragment = line.slice(5).replace(/^ /, "");
          eventSize += fragment.length;
          if (eventSize > 65_536) throw new Error("The AI provider sent an oversized response.");
          data.push(fragment);
        }
      }
      if (pending.length > 65_536) throw new Error("The AI provider sent an oversized response.");
      if (done) {
        // A finished event can end without the optional [DONE] marker. An unfinished frame cannot.
        if (data.length || pending.trim()) throw new Error("The AI response was interrupted. Please retry.");
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
