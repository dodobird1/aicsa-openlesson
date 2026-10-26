"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { useProgress } from "../../lib/progress/store";

export function LessonComplete({ id }: { id: string }) {
  const { completed, toggleLesson } = useProgress();
  const isComplete = completed.includes(id);
  return (
    <button type="button" className={`button ${isComplete ? "button-secondary" : "button-primary"}`} aria-pressed={isComplete} onClick={() => toggleLesson(id)}>
      {isComplete ? "Completed — mark incomplete" : "Mark lesson complete"}
    </button>
  );
}

export function LessonStatus({ id }: { id: string }) {
  const done = useProgress().completed.includes(id);
  return <span className={`lesson-status${done ? " is-complete" : ""}`} aria-label={done ? "Completed" : undefined} aria-hidden={done ? undefined : true}>{done ? <Check size={14} /> : <span className="status-ring" />}</span>;
}

export function ProgressSummary({ lessonIds }: { lessonIds: string[] }) {
  const { completed } = useProgress();
  const labelId = useId();
  const uniqueIds = [...new Set(lessonIds.filter((id) => id.trim()))];
  const count = uniqueIds.filter((id) => completed.includes(id)).length;
  const total = uniqueIds.length;
  return (
    <div className="progress-summary">
      <p id={labelId} aria-live="polite">{count} of {total} lessons completed</p>
      <progress value={count} max={total || 1} aria-labelledby={labelId} style={{ width: "100%" }} />
      <p className="muted">Progress is saved in this browser when local storage is available.</p>
    </div>
  );
}

export function ResetProgress() {
  const { reset } = useProgress();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div className="reset-progress">
      {confirming ? (
        <div>
          <p>Reset all lesson progress and exercise results in this browser?</p>
          <button type="button" className="button button-secondary" onClick={() => {
            reset();
            setConfirming(false);
            setMessage("Your progress has been reset.");
          }}>Yes, reset progress</button>{" "}
          <button type="button" className="button button-secondary" onClick={() => setConfirming(false)}>Cancel</button>
        </div>
      ) : (
        <button type="button" className="button button-secondary" onClick={() => {
          setMessage("");
          setConfirming(true);
        }}>Reset progress</button>
      )}
      <p className="muted" role="status">{message}</p>
    </div>
  );
}
