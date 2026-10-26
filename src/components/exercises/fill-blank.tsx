'use client';

import { Children, cloneElement, Fragment, isValidElement, use, useState, type FormEvent, type ReactElement, type ReactNode } from 'react';
import { useProgress } from '../../lib/progress/store';

export interface FillBlankProps {
  id: string;
  question: string;
  answers: string[];
  explanation?: string;
  caseSensitive?: boolean;
  children?: ReactNode;
}

/** Any run of three or more question marks marks one blank. */
const BLANK_PATTERN = /\?{3,}/g;

export interface TemplatePart { text?: string; blank?: boolean }

export function splitOnBlanks(text: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(BLANK_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push({ text: text.slice(cursor, start) });
    parts.push({ blank: true });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}

function validateFillBlank({ id, question, answers }: FillBlankProps, blankCount: number): void {
  const label = id?.trim() || 'unknown';
  if (!id?.trim() || !question?.trim()) throw new Error(`Fill-in-the-blank "${label}" needs an id and a question.`);
  if (!Array.isArray(answers) || !answers.length || answers.some((answer) => typeof answer !== 'string' || !answer.trim())) {
    throw new Error(`Fill-in-the-blank "${label}" needs at least one non-empty answer.`);
  }
  if (blankCount < 1 || blankCount !== answers.length) {
    throw new Error(`Fill-in-the-blank "${label}" has ${blankCount} blanks but ${answers.length} answers; they must match.`);
  }
}

/** Answers compare after trimming and collapsing runs of whitespace. */
function normalizeBlank(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * RSC serialization hands deep children subtrees to client components as lazy
 * chunks instead of plain elements: on the server the payload arrives
 * fulfilled ({ _payload: { status: 'fulfilled', value } }, sometimes the
 * payload itself), while during client hydration the same payload is still a
 * pending promise until React resolves the chunk. React unwraps them while
 * rendering; our own traversals must too, or only the first couple of code
 * lines are ever seen and validation throws during hydration.
 */
function fulfilledValueOf(node: ReactNode): ReactNode | undefined {
  if (!node || typeof node !== 'object' || isValidElement(node)) return undefined;
  const carrier = node as { status?: unknown; value?: ReactNode; _payload?: { status?: unknown; value?: ReactNode } };
  const payload = carrier._payload ?? carrier;
  if (payload && typeof payload === 'object' && payload.status === 'fulfilled' && 'value' in payload) return payload.value as ReactNode;
  return undefined;
}

function pendingPayloadOf(node: ReactNode): Promise<unknown> | undefined {
  if (!node || typeof node !== 'object' || isValidElement(node)) return undefined;
  const carrier = node as { _payload?: unknown; then?: unknown };
  const payload = (carrier._payload ?? node) as { then?: unknown };
  return typeof payload.then === 'function' ? Promise.resolve(payload as unknown as Promise<unknown>) : undefined;
}

export function evaluateFillBlank(inputs: readonly string[], answers: readonly string[], caseSensitive = true): boolean[] {
  return answers.map((answer, index) => {
    const given = normalizeBlank(inputs[index] ?? '');
    const expected = normalizeBlank(answer);
    return given !== '' && (caseSensitive ? given === expected : given.toLowerCase() === expected.toLowerCase());
  });
}

export function blankCountOf(node: ReactNode): number {
  const source = fulfilledValueOf(node) ?? node;
  if (typeof source === 'string') return [...source.matchAll(BLANK_PATTERN)].length;
  if (Array.isArray(source)) return source.reduce((total, child) => total + blankCountOf(child), 0);
  if (isValidElement<{ children?: ReactNode }>(source)) return blankCountOf(source.props.children);
  return 0;
}

function collectPending(node: ReactNode, out: Promise<unknown>[]): void {
  const pending = pendingPayloadOf(node);
  if (pending) { out.push(pending); return; }
  const source = fulfilledValueOf(node) ?? node;
  if (Array.isArray(source)) { source.forEach((child) => collectPending(child, out)); return; }
  if (isValidElement<{ children?: ReactNode }>(source)) collectPending(source.props.children, out);
}

/** Recursively replace ??? markers in any MDX content (text, paragraphs, code blocks) with inputs.
 * The next blank index is threaded through the recursion instead of mutated, per react-hooks rules.
 * Fulfilled thenables from RSC serialization are unwrapped so deep code lines are not skipped. */
function renderWithBlanks(node: ReactNode, renderBlank: (index: number) => ReactNode, startIndex: number): { node: ReactNode; nextIndex: number } {
  const source = fulfilledValueOf(node) ?? node;
  if (typeof source === 'string') {
    const parts = splitOnBlanks(source);
    if (parts.length === 1 && !parts[0].blank) return { node, nextIndex: startIndex };
    const acc = parts.reduce<{ nodes: ReactNode[]; nextIndex: number }>((state, part) => part.blank
      ? { nodes: [...state.nodes, <Fragment key={`blank-${state.nextIndex}`}>{renderBlank(state.nextIndex)}</Fragment>], nextIndex: state.nextIndex + 1 }
      : { nodes: [...state.nodes, <Fragment key={`text-${state.nextIndex}`}>{part.text}</Fragment>], nextIndex: state.nextIndex },
      { nodes: [], nextIndex: startIndex });
    return { node: acc.nodes, nextIndex: acc.nextIndex };
  }
  if (Array.isArray(source)) {
    const acc = source.reduce<{ nodes: ReactNode[]; nextIndex: number }>((state, child, index) => {
      const result = renderWithBlanks(child, renderBlank, state.nextIndex);
      return { nodes: [...state.nodes, <Fragment key={index}>{result.node}</Fragment>], nextIndex: result.nextIndex };
    }, { nodes: [], nextIndex: startIndex });
    return { node: acc.nodes, nextIndex: acc.nextIndex };
  }
  if (isValidElement<{ children?: ReactNode }>(source)) {
    const element = source as ReactElement<{ children?: ReactNode }>;
    const acc = Children.toArray(element.props.children).reduce<{ nodes: ReactNode[]; nextIndex: number }>((state, child) => {
      const result = renderWithBlanks(child, renderBlank, state.nextIndex);
      return { nodes: [...state.nodes, result.node], nextIndex: result.nextIndex };
    }, { nodes: [], nextIndex: startIndex });
    return { node: cloneElement(element, {}, ...acc.nodes), nextIndex: acc.nextIndex };
  }
  return { node, nextIndex: startIndex };
}

export function FillBlank(props: FillBlankProps) {
  // Deep children subtrees arrive as lazy RSC chunks; during hydration their
  // payloads are still pending promises. Suspend until they resolve so the
  // count and the rendered inputs see the complete tree, like React itself.
  const pending: Promise<unknown>[] = [];
  collectPending(props.children, pending);
  if (pending.length) use(Promise.all(pending));
  const blankCount = blankCountOf(props.children);
  validateFillBlank(props, blankCount);
  return <FillBlankExercise key={props.id} {...props} blankCount={blankCount} />;
}

function FillBlankExercise({ id, question, answers, explanation, caseSensitive = true, children, blankCount }: FillBlankProps & { blankCount: number }) {
  const { outcomes, recordExercise } = useProgress();
  const [values, setValues] = useState<string[]>(() => answers.map(() => ''));
  const [result, setResult] = useState<boolean[] | null>(null);
  const solved = result !== null && result.every(Boolean);
  const previous = Object.prototype.hasOwnProperty.call(outcomes, id) ? outcomes[id] : undefined;

  const { node: body } = renderWithBlanks(children, (index) => {
    const mark = result?.[index];
    return <input
      className={`fill-blank-input${mark === undefined ? '' : mark ? ' is-correct' : ' is-wrong'}`}
      aria-label={`第 ${index + 1} 空，共 ${blankCount} 空`}
      aria-invalid={mark === false || undefined}
      value={values[index] ?? ''}
      onChange={(event) => setValues((current) => current.map((value, position) => (position === index ? event.target.value : value)))}
      disabled={solved}
      style={{ width: `${Math.max(4, (answers[index] ?? '').length + 1)}ch` }}
    />;
  }, 0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (solved || values.some((value) => !value.trim())) return;
    const marks = evaluateFillBlank(values, answers, caseSensitive);
    setResult(marks);
    recordExercise(id, marks.every(Boolean));
  }

  function clear() {
    setValues(answers.map(() => ''));
    setResult(null);
  }

  return (
    <section className="exercise-card" aria-label="填空练习">
      <p className="eyebrow">Fill in the blanks · 填空</p>
      <form onSubmit={submit} onReset={clear}>
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend>{question}</legend>
          <p className="muted">把 ??? 处补全，然后检查答案。本题完全在浏览器本地运行，不调用 AI 服务。</p>
          <div className="fill-blank-body">{body}</div>
        </fieldset>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button type="submit" className="button button-primary" disabled={solved || values.some((value) => !value.trim())}>检查答案</button>
          <button type="reset" className="button button-secondary" disabled={solved}>清空重写</button>
        </div>
        <div className={`quiz-feedback${result !== null && !solved ? ' is-error' : ''}`} role="status" aria-live="polite" aria-atomic="true">
          {result !== null && <><p><strong>{solved ? '全部正确！' : '还有空没答对，看看标红的空。'}</strong></p>{explanation && <p>{explanation}</p>}</>}
        </div>
        {previous && <p className="muted">上次结果：{previous.correct ? '正确' : '未通过'} · 已尝试 {previous.attempts} 次。</p>}
      </form>
    </section>
  );
}

export default FillBlank;
