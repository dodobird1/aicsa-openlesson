'use client';

import { useState, type DragEvent, type FormEvent } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useProgress } from '../../lib/progress/store';

export interface ParsonsProblemProps {
  id: string;
  question: string;
  lines: string[];
  explanation?: string;
}

function validateParsons({ id, question, lines }: ParsonsProblemProps): void {
  const label = id?.trim() || 'unknown';
  if (!id?.trim() || !question?.trim()) throw new Error(`Parsons problem "${label}" needs an id and a question.`);
  if (!Array.isArray(lines) || lines.length < 2 || lines.some((line) => typeof line !== 'string' || !line.trim())) {
    throw new Error(`Parsons problem "${label}" needs at least two non-empty lines, given in the correct order.`);
  }
}

/** Order matters, so only the exact sequence counts. */
export function evaluateParsons(current: readonly string[], answer: readonly string[]): boolean {
  return current.length === answer.length && current.every((line, index) => line === answer[index]);
}

function seedFrom(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic scramble: the same exercise always opens the same way, but never already solved. */
export function scrambleLines(lines: readonly string[], seedText: string): string[] {
  if (lines.length < 2) return [...lines];
  const scrambled = [...lines];
  let state = seedFrom(seedText) || 1;
  for (let index = scrambled.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swap = state % (index + 1);
    [scrambled[index], scrambled[swap]] = [scrambled[swap], scrambled[index]];
  }
  if (scrambled.every((line, index) => line === lines[index])) scrambled.push(scrambled.shift() as string);
  return scrambled;
}

export function ParsonsProblem(props: ParsonsProblemProps) {
  validateParsons(props);
  return <ParsonsExercise key={props.id} {...props} />;
}

function ParsonsExercise({ id, question, lines, explanation }: ParsonsProblemProps) {
  const { outcomes, recordExercise } = useProgress();
  const [scrambleCount, setScrambleCount] = useState(0);
  const [order, setOrder] = useState<string[]>(() => scrambleLines(lines, id));
  const [dragging, setDragging] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const solved = result === true;
  const previous = Object.prototype.hasOwnProperty.call(outcomes, id) ? outcomes[id] : undefined;

  function move(from: number, to: number) {
    if (solved || from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (solved) return;
    const correct = evaluateParsons(order, lines);
    setResult(correct);
    recordExercise(id, correct);
  }

  function rescramble() {
    setScrambleCount((count) => count + 1);
    setOrder(scrambleLines(lines, `${id}#${scrambleCount + 1}`));
    setResult(null);
  }

  function onDragStart(event: DragEvent<HTMLLIElement>, index: number) {
    setDragging(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }

  function onDrop(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();
    if (dragging !== null) move(dragging, index);
    setDragging(null);
    setOverIndex(null);
  }

  return (
    <section className="exercise-card" aria-label="代码排序练习">
      <p className="eyebrow">Parsons problem · 代码排序</p>
      <form onSubmit={submit} onReset={rescramble}>
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend>{question}</legend>
          <p className="muted">拖动代码行，或用箭头按钮调整顺序，然后检查答案。本题完全在浏览器本地运行，不调用 AI 服务。</p>
          <ul className="parsons-list" onDragOver={(event) => event.preventDefault()}>
            {order.map((line, index) => (
              <li
                key={index}
                className={`parsons-item${overIndex === index ? ' is-over' : ''}`}
                draggable={!solved}
                onDragStart={(event) => onDragStart(event, index)}
                onDragEnter={() => setOverIndex(index)}
                onDragLeave={() => setOverIndex((current) => (current === index ? null : current))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDrop(event, index)}
                onDragEnd={() => { setDragging(null); setOverIndex(null); }}
              >
                <span className="parsons-line">{line}</span>
                <span className="parsons-controls">
                  <button type="button" className="parsons-move" aria-label="上移" disabled={solved || index === 0} onClick={() => move(index, index - 1)}><ChevronUp size={12} /></button>
                  <button type="button" className="parsons-move" aria-label="下移" disabled={solved || index === order.length - 1} onClick={() => move(index, index + 1)}><ChevronDown size={12} /></button>
                </span>
              </li>
            ))}
          </ul>
        </fieldset>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button type="submit" className="button button-primary" disabled={solved}>检查答案</button>
          <button type="reset" className="button button-secondary" disabled={solved}>重新打乱</button>
        </div>
        <div className={`quiz-feedback${result === false ? ' is-error' : ''}`} role="status" aria-live="polite" aria-atomic="true">
          {result !== null && <><p><strong>{result ? '回答正确！' : '顺序还不对，继续调整。'}</strong></p>{explanation && <p>{explanation}</p>}</>}
        </div>
        {previous && <p className="muted">上次结果：{previous.correct ? '正确' : '未通过'} · 已尝试 {previous.attempts} 次。</p>}
      </form>
    </section>
  );
}

export default ParsonsProblem;
