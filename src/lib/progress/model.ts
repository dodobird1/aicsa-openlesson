export const PROGRESS_VERSION = 1 as const;
export const PROGRESS_STORAGE_KEY = "aicsa-openlesson:progress:v1";

export interface ExerciseOutcome {
  /** Result of the most recent submission. */
  correct: boolean;
  attempts: number;
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION;
  completed: string[];
  outcomes: Record<string, ExerciseOutcome>;
}

export function emptyProgress(): ProgressState {
  return { version: PROGRESS_VERSION, completed: [], outcomes: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Reject incompatible versions; salvage valid entries from damaged records. */
export function parseProgress(serialized: string | null): ProgressState {
  if (!serialized) return emptyProgress();
  try {
    const value: unknown = JSON.parse(serialized);
    if (!isRecord(value) || value.version !== PROGRESS_VERSION) return emptyProgress();
    const completed = Array.isArray(value.completed)
      ? [...new Set(value.completed.filter(validId))]
      : [];
    const outcomes: Record<string, ExerciseOutcome> = Object.fromEntries(
      Object.entries(isRecord(value.outcomes) ? value.outcomes : {}).flatMap(([id, outcome]) => {
        if (!validId(id) || !isRecord(outcome) || typeof outcome.correct !== "boolean" ||
          typeof outcome.attempts !== "number" || !Number.isSafeInteger(outcome.attempts) || outcome.attempts < 1) return [];
        return [[id, { correct: outcome.correct, attempts: outcome.attempts }]];
      }),
    );
    return { version: PROGRESS_VERSION, completed, outcomes };
  } catch {
    return emptyProgress();
  }
}

export function toggleLessonProgress(state: ProgressState, id: string): ProgressState {
  if (!validId(id)) return state;
  return {
    ...state,
    completed: state.completed.includes(id)
      ? state.completed.filter((completedId) => completedId !== id)
      : [...state.completed, id],
  };
}

export function recordExerciseProgress(state: ProgressState, id: string, correct: boolean): ProgressState {
  if (!validId(id)) return state;
  const previous = Object.prototype.hasOwnProperty.call(state.outcomes, id) ? state.outcomes[id] : undefined;
  return {
    ...state,
    outcomes: {
      ...state.outcomes,
      [id]: { correct, attempts: Math.min((previous?.attempts ?? 0) + 1, Number.MAX_SAFE_INTEGER) },
    },
  };
}
