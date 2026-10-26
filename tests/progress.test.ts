import { describe, expect, it } from "vitest";
import { emptyProgress, parseProgress, PROGRESS_VERSION, recordExerciseProgress, toggleLessonProgress } from "../src/lib/progress/model";

describe("progress persistence model", () => {
  it("starts empty and rejects corrupt or incompatible storage", () => {
    for (const value of [null, "", "not json", "null", "[]", '{"version":2}', '{"completed":[]}']) {
      expect(parseProgress(value)).toEqual(emptyProgress());
    }
  });

  it("round-trips completion and exercise attempts", () => {
    let state = toggleLessonProgress(emptyProgress(), "lesson-1");
    state = recordExerciseProgress(state, "quiz-1", false);
    state = recordExerciseProgress(state, "quiz-1", true);
    expect(parseProgress(JSON.stringify(state))).toEqual({
      version: PROGRESS_VERSION,
      completed: ["lesson-1"],
      outcomes: { "quiz-1": { correct: true, attempts: 2 } },
    });
  });

  it("toggles lessons without mutating previous state", () => {
    const initial = emptyProgress();
    const completed = toggleLessonProgress(initial, "a");
    expect(initial.completed).toEqual([]);
    expect(toggleLessonProgress(completed, "a").completed).toEqual([]);
    expect(toggleLessonProgress(completed, "b").completed).toEqual(["a", "b"]);
    expect(toggleLessonProgress(initial, " ")).toBe(initial);
  });

  it("salvages valid entries and deduplicates completed lessons", () => {
    const state = parseProgress(JSON.stringify({
      version: 1,
      completed: ["a", "a", 1, null, "", " "],
      outcomes: {
        good: { correct: false, attempts: 3 },
        bad: { correct: "yes", attempts: 1 },
        zero: { correct: true, attempts: 0 },
        fractional: { correct: true, attempts: 1.5 },
        oversized: { correct: true, attempts: 1e20 },
      },
    }));
    expect(state.completed).toEqual(["a"]);
    expect(state.outcomes).toEqual({ good: { correct: false, attempts: 3 } });
  });

  it("handles missing collections", () => {
    expect(parseProgress('{"version":1,"completed":{},"outcomes":[]}')).toEqual(emptyProgress());
  });

  it("records latest correctness without mutating previous attempts", () => {
    const first = recordExerciseProgress(emptyProgress(), "q", true);
    const next = recordExerciseProgress(first, "q", false);
    expect(first.outcomes.q).toEqual({ correct: true, attempts: 1 });
    expect(next.outcomes.q).toEqual({ correct: false, attempts: 2 });
    expect(recordExerciseProgress(first, "", true)).toBe(first);
  });

  it("treats prototype-like ids as normal exercise ids", () => {
    const state = recordExerciseProgress(emptyProgress(), "__proto__", true);
    expect(state.outcomes["__proto__"]).toEqual({ correct: true, attempts: 1 });
    expect(parseProgress(JSON.stringify(state))).toEqual(state);
    expect(recordExerciseProgress(emptyProgress(), "constructor", false).outcomes.constructor).toEqual({ correct: false, attempts: 1 });
  });
});
