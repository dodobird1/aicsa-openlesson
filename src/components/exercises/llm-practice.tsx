"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

export interface LLMPracticeProps {
  id: string;
  instructions: string;
  starterMessage?: string;
  preset?: string;
}
interface Message { role: "user" | "assistant"; content: string }
type Configuration = "loading" | "ready" | "disabled" | "error";

export function LLMPractice({ id, instructions, starterMessage = "", preset = "default" }: LLMPracticeProps) {
  const [configuration, setConfiguration] = useState<Configuration>("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(starterMessage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryHistory, setRetryHistory] = useState<Message[] | null>(null);
  const active = useRef<AbortController | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/chat", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Configuration unavailable");
        const status = await response.json() as { configured?: boolean; presets?: string[] };
        if (!controller.signal.aborted) setConfiguration(status.configured && status.presets?.includes(preset) ? "ready" : "disabled");
      })
      .catch(() => { if (!controller.signal.aborted) setConfiguration("error"); });
    return () => { controller.abort(); generation.current += 1; active.current?.abort(); };
  }, [preset]);

  async function send(history: Message[]) {
    if (active.current || configuration !== "ready") return;
    const controller = new AbortController();
    active.current = controller;
    const token = ++generation.current;
    setBusy(true); setError(""); setRetryHistory(null);
    setMessages([...history, { role: "assistant", content: "" }]);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let text = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset, messages: history }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        if (response.status === 503) setConfiguration("disabled");
        throw new Error(typeof data.error === "string" ? data.error : "The AI service is unavailable. Please retry.");
      }
      if (!response.body) throw new Error("No response received. Please retry.");
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        text += done ? decoder.decode() : decoder.decode(value, { stream: true });
        if (text.length > 12_000) throw new Error("The response exceeded the practice limit.");
        if (token !== generation.current) return;
        setMessages([...history, { role: "assistant", content: text }]);
        if (done) break;
      }
      if (!text.trim()) throw new Error("No answer was returned. Please retry.");
    } catch (caught) {
      if (token !== generation.current) return;
      setRetryHistory(history);
      setError(controller.signal.aborted ? "Response stopped. Retry to replace the partial answer." : caught instanceof Error ? caught.message : "The response was interrupted. Please retry.");
    } finally {
      await reader?.cancel().catch(() => undefined);
      reader?.releaseLock();
      if (token === generation.current) { active.current = null; setBusy(false); }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !draft.trim() || retryHistory) return;
    const history = [...messages, { role: "user" as const, content: draft.trim() }];
    if (history.length > 20 || history.reduce((sum, message) => sum + message.content.length, 0) > 16_000) {
      setError("This conversation reached the practice limit. Reset to start a new one."); return;
    }
    setDraft("");
    void send(history);
  }

  function reset() {
    generation.current += 1; active.current?.abort(); active.current = null;
    setMessages([]); setDraft(starterMessage); setError(""); setRetryHistory(null); setBusy(false);
  }

  return (
    <section className="chat-card" aria-labelledby={`${id}-title`}>
      <p className="eyebrow">AI practice</p>
      <h3 id={`${id}-title`}>Try it with an AI coach</h3>
      <p>{instructions}</p>
      <p className="muted" id={`${id}-privacy`}>Your messages are sent to the configured AI provider. Do not share personal, confidential, or sensitive information. This app does not save conversations; they are kept only in this page’s memory. Provider retention policies may apply. AI answers can be wrong—check important claims.</p>
      {configuration === "loading" && <p role="status">Checking AI practice availability…</p>}
      {configuration === "disabled" && <p role="status">AI practice is not available for this exercise yet. A site administrator must configure the server’s AI provider. You can still complete the other exercises.</p>}
      {configuration === "error" && <p role="status">Could not check AI availability. Reload this page to try again.</p>}
      <div className="chat-messages" role="log" aria-label="Practice conversation" aria-live="polite" aria-relevant="additions text" aria-busy={busy}>
        {messages.map((message, index) => (
          <div className={`chat-message chat-message-${message.role}`} key={index}>
            <strong>{message.role === "user" ? "You" : "AI coach"}</strong>
            <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{message.content || (busy ? "Thinking…" : "No answer received.")}</p>
          </div>
        ))}
      </div>
      {error && <p role="alert" className="chat-error">{error}</p>}
      <form onSubmit={submit}>
        <label htmlFor={`${id}-message`}>Your message</label>
        <textarea id={`${id}-message`} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={6000} rows={4} disabled={configuration !== "ready" || busy || Boolean(retryHistory)} aria-describedby={`${id}-privacy`} placeholder="Write a prompt to practice…" />
        <div className="chat-actions">
          <button type="submit" className="button button-primary" disabled={configuration !== "ready" || busy || !draft.trim() || Boolean(retryHistory)}>Send message</button>
          {busy && <button type="button" className="button button-secondary" onClick={() => active.current?.abort()}>Stop</button>}
          {retryHistory && <button type="button" className="button button-secondary" disabled={busy || configuration !== "ready"} onClick={() => void send(retryHistory)}>Retry last message</button>}
          <button type="button" className="button button-secondary" onClick={reset}>Reset conversation</button>
        </div>
      </form>
    </section>
  );
}

export default LLMPractice;
