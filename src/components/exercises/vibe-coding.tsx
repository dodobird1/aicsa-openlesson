'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

export interface VibeCodingProps {
  id: string;
  task: string;
  title?: string;
  starter?: string;
  preset?: string;
  language?: string;
}

interface Message { role: 'user' | 'assistant'; content: string }
type Configuration = 'loading' | 'ready' | 'disabled' | 'error';

// Mirrors the server's per-message and conversation limits; the server enforces them too.
const CODE_LIMIT = 4_000;
const MESSAGE_LIMIT = 6_000;
const HISTORY_MESSAGES = 20;
const HISTORY_CHARACTERS = 16_000;

function validateVibeCoding({ id, task, starter }: VibeCodingProps): void {
  const label = id?.trim() || 'unknown';
  if (!id?.trim() || !task?.trim()) throw new Error(`Vibe coding "${label}" needs an id and a task.`);
  if (typeof starter !== 'string' || starter.length > CODE_LIMIT) throw new Error(`Vibe coding "${label}" starter code must stay under ${CODE_LIMIT} characters.`);
}

/** The AI sees the task and the current code as context; the student alone edits the code. */
export function buildVibeMessage(task: string, code: string, language: string, question: string, includeCode: boolean): string {
  const parts = [`【任务】${task.trim()}`];
  if (includeCode && code.trim()) parts.push(`【我的当前代码】\n\`\`\`${language}\n${code}\n\`\`\``);
  parts.push(`【我的问题】\n${question.trim()}`);
  return parts.join('\n\n');
}

export function VibeCoding(props: VibeCodingProps) {
  validateVibeCoding(props);
  return <VibeCodingCard key={props.id} {...props} />;
}

function VibeCodingCard({ id, task, title = 'AI 结对编程', starter = '', preset = 'code-reviewer', language = 'java' }: VibeCodingProps) {
  const questionId = `${id}-question`;
  const [configuration, setConfiguration] = useState<Configuration>('loading');
  const [code, setCode] = useState(starter);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retryHistory, setRetryHistory] = useState<Message[] | null>(null);
  const [attachCode, setAttachCode] = useState(true);
  const active = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/chat', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Configuration unavailable');
        const status = await response.json() as { configured?: boolean; presets?: string[] };
        if (!controller.signal.aborted) setConfiguration(status.configured && status.presets?.includes(preset) ? 'ready' : 'disabled');
      })
      .catch(() => { if (!controller.signal.aborted) setConfiguration('error'); });
    return () => { controller.abort(); generation.current += 1; active.current?.abort(); };
  }, [preset]);

  async function send(history: Message[]) {
    if (active.current || configuration !== 'ready') return;
    const controller = new AbortController();
    active.current = controller;
    const token = ++generation.current;
    setBusy(true); setError(''); setRetryHistory(null);
    setMessages([...history, { role: 'assistant', content: '' }]);
    // Only the newest user message carries the code snapshot, so history stays within limits.
    const outgoing = history.map((message, index) =>
      message.role === 'user' && index === history.length - 1
        ? { role: 'user' as const, content: buildVibeMessage(task, code, language, message.content, attachCode) }
        : message,
    );
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let text = '';
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset, messages: outgoing }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        if (response.status === 503) setConfiguration('disabled');
        throw new Error(typeof data.error === 'string' ? data.error : 'AI 服务暂不可用，请稍后再试。');
      }
      if (!response.body) throw new Error('没有收到响应，请重试。');
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        text += done ? decoder.decode() : decoder.decode(value, { stream: true });
        if (text.length > 12_000) throw new Error('回复超出练习长度限制。');
        if (token !== generation.current) return;
        setMessages([...history, { role: 'assistant', content: text }]);
        if (done) break;
      }
      if (!text.trim()) throw new Error('没有收到回答，请重试。');
    } catch (caught) {
      if (token !== generation.current) return;
      setRetryHistory(history);
      setError(controller.signal.aborted ? '回答已停止，可重试获取新回答。' : caught instanceof Error ? caught.message : '连接中断，请重试。');
    } finally {
      await reader?.cancel().catch(() => undefined);
      reader?.releaseLock();
      if (token === generation.current) { active.current = null; setBusy(false); }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !draft.trim() || retryHistory) return;
    const question = draft.trim();
    const history = [...messages, { role: 'user' as const, content: question }];
    if (history.length > HISTORY_MESSAGES || history.reduce((sum, message) => sum + message.content.length, 0) > HISTORY_CHARACTERS) {
      setError('对话太长了，清空后重新开始。');
      return;
    }
    if (buildVibeMessage(task, code, language, question, attachCode).length > MESSAGE_LIMIT) {
      setError('代码加上问题超过了单条消息的长度限制，精简后再发送。');
      return;
    }
    setDraft('');
    void send(history);
  }

  function resetConversation() {
    generation.current += 1; active.current?.abort(); active.current = null;
    setMessages([]); setDraft(''); setError(''); setRetryHistory(null); setBusy(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Tab') {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = event.currentTarget;
      setCode(value.slice(0, selectionStart) + '    ' + value.slice(selectionEnd));
      requestAnimationFrame(() => { event.currentTarget.selectionStart = event.currentTarget.selectionEnd = selectionStart + 4; });
    }
  }

  function syncScroll() {
    if (gutterRef.current && editorRef.current) gutterRef.current.scrollTop = editorRef.current.scrollTop;
  }

  const lineCount = code.split('\n').length;

  return (
    <section className="exercise-card" aria-label="AI 结对编程练习">
      <p className="eyebrow">Vibe coding · AI 结对编程</p>
      <h3>{title}</h3>
      <div className="quiz-feedback" style={{ background: '#f8faf5' }}>
        <p style={{ margin: 0, fontWeight: 500 }}>{task}</p>
        <p className="muted" style={{ margin: '8px 0 0' }}>左边是你自己的代码编辑器，右边是 AI 教练：它能看到你的代码、指出问题、给建议——但它<span style={{ fontWeight: 600 }}>不会替你改代码</span>，这里没有任何「自动应用」按钮。改代码的每一下都由你亲手完成。</p>
      </div>
      <div className="vibe-layout">
        <div className="vibe-editor">
          <div className="vibe-editor-head">
            <span className="vibe-file">{language} · {lineCount} 行 · {code.length}/{CODE_LIMIT} 字符</span>
            <span className="vibe-badge">AI 只读 · 不代改</span>
            <button type="button" className="button button-secondary" onClick={() => setCode(starter)}>恢复初始代码</button>
          </div>
          <div className="vibe-code-wrap">
            <div className="vibe-gutter" ref={gutterRef} aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')}</div>
            <textarea
              ref={editorRef}
              className="vibe-code"
              aria-label={`${title} 代码编辑区`}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={onKeyDown}
              onScroll={syncScroll}
              maxLength={CODE_LIMIT}
              spellCheck={false}
              wrap="off"
            />
          </div>
        </div>
        <div className="vibe-chat">
          <div className="chat-messages" role="log" aria-label="结对编程对话" aria-live="polite" aria-busy={busy}>
            {messages.map((message, index) => (
              <div className={`chat-message chat-message-${message.role}`} key={index}>
                <strong>{message.role === 'user' ? '你' : 'AI 教练'}</strong>
                <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.content || (busy ? '思考中…' : '没有收到回答。')}</p>
              </div>
            ))}
          </div>
          {configuration === 'loading' && <p role="status">正在检查 AI 教练可用性…</p>}
          {configuration === 'disabled' && <p role="status">AI 教练暂不可用（站点管理员需配置 AI 服务，或当前练习未启用）。编辑器不受影响，你仍可正常写代码。</p>}
          {configuration === 'error' && <p role="status">无法检查 AI 可用性，刷新页面重试。</p>}
          {error && <p role="alert" className="chat-error" style={{ fontSize: 12, color: '#8a3d2d' }}>{error}</p>}
          <form onSubmit={submit}>
            <label htmlFor={questionId}>你的提问</label>
            <textarea id={questionId} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2_000} rows={3}
              disabled={configuration !== 'ready' || busy || Boolean(retryHistory)} placeholder="例如：第 3 行为什么会报错？" />
            <label className="vibe-attach">
              <input type="checkbox" checked={attachCode} onChange={(event) => setAttachCode(event.target.checked)} />
              随消息附上当前代码（AI 需要看到代码才能定位问题）
            </label>
            <div className="chat-actions">
              <button type="submit" className="button button-primary" disabled={configuration !== 'ready' || busy || !draft.trim() || Boolean(retryHistory)}>发送</button>
              {busy && <button type="button" className="button button-secondary" onClick={() => active.current?.abort()}>停止</button>}
              {retryHistory && <button type="button" className="button button-secondary" disabled={busy || configuration !== 'ready'} onClick={() => void send(retryHistory)}>重试上次提问</button>}
              <button type="button" className="button button-secondary" onClick={resetConversation}>清空对话</button>
            </div>
          </form>
          <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>你的代码和问题会发送到配置的 AI 服务商，请勿包含个人信息。AI 的建议可能有误——以本地编译和运行结果为准。</p>
        </div>
      </div>
    </section>
  );
}

export default VibeCoding;
