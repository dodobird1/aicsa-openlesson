"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useProgress } from "../../lib/progress/store";
import { evaluateQuiz, validateExercise } from "./quiz";

export { evaluateQuiz } from "./quiz";

export interface MultipleChoiceProps {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  answer: string[];
  multiple?: boolean;
  explanation?: string;
}

export function MultipleChoice(props: MultipleChoiceProps) {
  validateExercise(props);
  return <MultipleChoiceExercise key={props.id} {...props} />;
}

function MultipleChoiceExercise({ id, question, options, answer, multiple = false, explanation }: MultipleChoiceProps) {
  const instanceId = useId();
  const { outcomes, recordExercise } = useProgress();
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const previous = Object.prototype.hasOwnProperty.call(outcomes, id) ? outcomes[id] : undefined;
  const feedbackId = `${instanceId}-feedback`;
  const hintId = `${instanceId}-hint`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected.length || result !== null) return;
    const correct = evaluateQuiz(selected, answer);
    setResult(correct);
    recordExercise(id, correct);
  }

  function retry() {
    setSelected([]);
    setResult(null);
    firstInput.current?.focus();
  }

  return (
    <section className="exercise-card" aria-label="Practice exercise">
      <p className="eyebrow">Check your understanding</p>
      <form onSubmit={submit} onReset={retry}>
        <fieldset aria-describedby={hintId} style={{ border: 0, margin: 0, padding: 0 }}>
          <legend>{question}</legend>
          <p id={hintId} className="muted">{multiple ? "Select all answers that apply." : "Select one answer."}</p>
          {options.map((option, index) => (
            <label key={option.id} className="quiz-option" style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
              <input
                ref={index === 0 ? firstInput : undefined}
                type={multiple ? "checkbox" : "radio"}
                name={instanceId}
                value={option.id}
                checked={selected.includes(option.id)}
                disabled={result !== null}
                onChange={(event) => {
                  setSelected((current) => multiple
                    ? event.target.checked ? [...current, option.id] : current.filter((value) => value !== option.id)
                    : [option.id]);
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button type="submit" className="button button-primary" disabled={!selected.length || result !== null} aria-describedby={result !== null ? feedbackId : undefined}>Check answer</button>
          <button type="reset" className="button button-secondary" disabled={!selected.length && result === null}>{result === null ? "Clear selection" : "Try again"}</button>
        </div>
        <div id={feedbackId} className={`quiz-feedback${result === false ? ' is-error' : ''}`} role="status" aria-live="polite" aria-atomic="true">
          {result !== null && <><p><strong>{result ? "Correct!" : "Not quite. Try again."}</strong></p>{explanation && <p>{explanation}</p>}</>}
        </div>
        {previous && <p className="muted">Last saved result: {previous.correct ? "correct" : "not yet correct"}. Attempts: {previous.attempts}.</p>}
      </form>
    </section>
  );
}

export default MultipleChoice;
