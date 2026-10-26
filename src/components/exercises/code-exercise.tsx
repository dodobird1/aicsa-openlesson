"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export interface CodeExerciseProps {
  id: string;
  prompt: string;
  rubric: string[];
  title?: string;
  starter?: string;
  hints?: string[];
  preset?: string;
  language?: string;
}

const CODE_LIMIT = 4_000;

function validateProps({ id, prompt, rubric, hints }: CodeExerciseProps): void {
  const label = id?.trim() || "unknown";
  if (!id?.trim() || !prompt?.trim()) throw new Error(`Code exercise "${label}" needs an id and a prompt.`);
  if (!Array.isArray(rubric) || !rubric.length || rubric.some((item) => !item?.trim())) throw new Error(`Code exercise "${label}" needs at least one rubric item.`);
  if (hints && (!Array.isArray(hints) || hints.some((item) => !item?.trim()))) throw new Error(`Code exercise "${label}" has empty hint entries.`);
}

export function CodeExercise(props: CodeExerciseProps) {
  validateProps(props);
  return <CodeExerciseCard key={props.id} {...props} />;
}

function CodeExerciseCard({ id, prompt, rubric, title = "动手写代码", starter = "", hints = [], preset = "code-grader", language = "java" }: CodeExerciseProps) {
  const [configuration, setConfiguration] = useState<"loading" | "ready" | "disabled" | "error">("loading");
  const [code, setCode] = useState(starter);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [retryDraft, setRetryDraft] = useState<string | null>(null);
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

  async function grade(submission: string) {
    if (active.current || configuration !== "ready") return;
    const controller = new AbortController();
    active.current = controller;
    const token = ++generation.current;
    setBusy(true); setError(""); setRetryDraft(null);
    setFeedback("");
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let text = "";
    try {
      const message = [
        "【题目】",
        prompt,
        "",
        "【评分标准 rubric】",
        ...rubric.map((item, index) => `${index + 1}. ${item}`),
        "",
        "【我的提交】",
        "```" + language,
        submission,
        "```",
        "",
        "请按评分标准批改我的代码。",
      ].join("\n");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset, messages: [{ role: "user", content: message }] }),
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
        setFeedback(text);
        if (done) break;
      }
      if (!text.trim()) throw new Error("No answer was returned. Please retry.");
      setAttempts((count) => count + 1);
    } catch (caught) {
      if (token !== generation.current) return;
      setRetryDraft(submission);
      setError(controller.signal.aborted ? "Response stopped. Retry to resubmit." : caught instanceof Error ? caught.message : "The response was interrupted. Please retry.");
    } finally {
      await reader?.cancel().catch(() => undefined);
      reader?.releaseLock();
      if (token === generation.current) { active.current = null; setBusy(false); }
    }
  }

  function submit() {
    if (busy || !code.trim() || retryDraft) return;
    void grade(code);
  }

  function resetCode() {
    generation.current += 1; active.current?.abort(); active.current = null;
    setCode(starter); setFeedback(""); setError(""); setRetryDraft(null); setBusy(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Tab") {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = event.currentTarget;
      setCode(value.slice(0, selectionStart) + "    " + value.slice(selectionEnd));
      requestAnimationFrame(() => { event.currentTarget.selectionStart = event.currentTarget.selectionEnd = selectionStart + 4; });
    }
  }

  return (
    <section className="exercise-card" aria-labelledby={`${id}-title`}>
      <p className="eyebrow">Code exercise · 代码题</p>
      <h3 id={`${id}-title`}>{title}</h3>
      <div className="quiz-feedback" style={{ background: "#f8faf5" }}>
        <p style={{ margin: 0, fontWeight: 500 }}>{prompt}</p>
        <p className="muted" style={{ margin: "8px 0 0" }}>评分标准（AI 按以下条目逐条批改）：</p>
        <ol style={{ margin: "4px 0 0", paddingLeft: "20px", fontSize: 12, lineHeight: 1.8 }}>
          {rubric.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </div>
      {hints.length > 0 && (
        <div style={{ margin: "14px 0 0" }}>
          {hints.slice(0, hintsShown).map((hint, index) => (
            <p key={hint} className="quiz-feedback" style={{ margin: "8px 0" }}><strong>提示 {index + 1}：</strong>{hint}</p>
          ))}
          {hintsShown < hints.length && (
            <button type="button" className="button button-secondary" disabled={busy} onClick={() => setHintsShown((count) => count + 1)}>
              显示提示 {hintsShown + 1} / {hints.length}
            </button>
          )}
        </div>
      )}
      <p className="muted" id={`${id}-privacy`} style={{ marginTop: 14 }}>在下面写代码（支持 Tab 缩进），提交后由 AI 批改员按评分标准逐条点评。代码会发送到配置的 AI 服务商；不要提交个人信息。AI 的判断可能有误——重要结论以本地运行为准。</p>
      {configuration === "loading" && <p role="status">正在检查 AI 批改可用性…</p>}
      {configuration === "disabled" && <p role="status">AI 批改暂不可用。站点管理员需要先配置 AI 服务；你仍可在本地完成这道题。</p>}
      {configuration === "error" && <p role="status">无法检查 AI 可用性。刷新页面重试。</p>}
      <textarea
        aria-label={`${title} 的代码输入区`}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={onKeyDown}
        maxLength={CODE_LIMIT}
        rows={Math.max(8, starter.split("\n").length + 4)}
        disabled={configuration !== "ready" || busy}
        spellCheck={false}
        style={{ width: "100%", marginTop: 10, marginBottom: 0, border: "1px solid #dce3d3", borderRadius: 7, padding: 12, background: "#fcfdf9", fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12.5, lineHeight: 1.9, resize: "vertical", minHeight: 150 }}
      />
      <div style={{ display: "flex", gap: "0.75rem", marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" className="button button-primary" onClick={submit} disabled={configuration !== "ready" || busy || !code.trim() || Boolean(retryDraft)}>提交批改</button>
        {busy && <button type="button" className="button button-secondary" onClick={() => active.current?.abort()}>停止</button>}
        {retryDraft && <button type="button" className="button button-secondary" disabled={busy || configuration !== "ready"} onClick={() => void grade(retryDraft)}>重试本次提交</button>}
        <button type="button" className="button button-secondary" onClick={resetCode} disabled={busy && !retryDraft}>重置代码</button>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>{attempts > 0 ? `已提交 ${attempts} 次。改完「最值得先修的一处」再提交，比一次改十处更有效。` : "先自己写一版再提交——空白提交只会收到起步提示。"}</p>
      {error && <p role="alert" className="chat-error" style={{ fontSize: 12, color: "#8a3d2d" }}>{error}</p>}
      <div className="chat-message" role="log" aria-label="AI 批改结果" aria-live="polite">
        {feedback
          ? <><strong>AI 批改员</strong><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0 }}>{feedback}</p></>
          : busy ? "正在批改…" : ""}
      </div>
    </section>
  );
}

export default CodeExercise;
