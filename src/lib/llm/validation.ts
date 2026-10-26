import "server-only";
import { LIMITS, PRESETS } from "./config";

export interface ChatMessage { role: "user" | "assistant"; content: string }
export interface ChatInput { preset: string; messages: ChatMessage[] }
export class ChatError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function validateChatInput(value: unknown): ChatInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ChatError("Send a valid conversation.");
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some((key) => !["preset", "messages"].includes(key))) throw new ChatError("Unexpected request fields.");
  const preset = data.preset === undefined ? "default" : data.preset;
  if (typeof preset !== "string" || !Object.hasOwn(PRESETS, preset)) throw new ChatError("Choose a supported practice preset.");
  if (!Array.isArray(data.messages) || !data.messages.length || data.messages.length > LIMITS.messages) throw new ChatError(`Send between 1 and ${LIMITS.messages} messages. Reset to start a new conversation.`);
  let total = 0;
  const messages = data.messages.map((entry: unknown, index: number): ChatMessage => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new ChatError("Invalid message.");
    const message = entry as Record<string, unknown>;
    if (Object.keys(message).some((key) => !["role", "content"].includes(key)) || message.role !== (index % 2 === 0 ? "user" : "assistant")) throw new ChatError("Messages must alternate between user and assistant, beginning with user.");
    if (typeof message.content !== "string" || !message.content.trim() || message.content.length > LIMITS.messageCharacters) throw new ChatError(`Each message must contain 1–${LIMITS.messageCharacters} characters.`);
    total += message.content.length;
    return { role: index % 2 === 0 ? "user" : "assistant", content: message.content };
  });
  if (total > LIMITS.historyCharacters) throw new ChatError("This conversation is too long. Reset to start again.");
  if (messages[messages.length - 1].role !== "user") throw new ChatError("End the conversation with a user message.");
  return { preset, messages };
}

/** Compare the browser origin with the public host, including requests forwarded by a proxy. */
export function isSameSiteRequest(origin: string | null, host: string | null, fetchSite: string | null, requestOrigin: string): boolean {
  if (!origin || fetchSite === "cross-site") return false;
  try {
    // Compare hostnames so a TLS-terminating proxy can use a different internal port.
    if (host) return new URL(origin).hostname.toLowerCase() === new URL(`http://${host}`).hostname.toLowerCase();
    return origin === requestOrigin;
  } catch {
    return false;
  }
}

export async function readBoundedJSON(request: Request, signal: AbortSignal = request.signal): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > LIMITS.requestBytes)) throw new ChatError("Request is too large.", 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ChatError("Use a JSON request.", 415);
  if (!request.body) throw new ChatError("Send a conversation.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const onAbort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener("abort", onAbort, { once: true });
  if (signal.aborted) onAbort();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > LIMITS.requestBytes) {
        await reader.cancel();
        throw new ChatError("Request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally { signal.removeEventListener("abort", onAbort); reader.releaseLock(); }
  if (signal.aborted) throw new ChatError("The request was cancelled or timed out. Please retry.", 408);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new ChatError("Send valid JSON."); }
}
