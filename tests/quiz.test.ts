import { describe, expect, it } from "vitest";
import { evaluateQuiz, validateExercise } from "../src/components/exercises/quiz";

describe("evaluateQuiz", () => {
  it("evaluates a single answer", () => {
    expect(evaluateQuiz(["a"], ["a"])).toBe(true);
    expect(evaluateQuiz(["b"], ["a"])).toBe(false);
  });

  it("matches multiple answers regardless of order", () => {
    expect(evaluateQuiz(["c", "a"], ["a", "c"])).toBe(true);
  });

  it("rejects missing, additional, and duplicate selections", () => {
    expect(evaluateQuiz(["a"], ["a", "b"])).toBe(false);
    expect(evaluateQuiz(["a", "b"], ["a"])).toBe(false);
    expect(evaluateQuiz(["a", "a"], ["a"])).toBe(false);
  });

  it("does not accept unanswered or unconfigured quizzes", () => {
    expect(evaluateQuiz([], ["a"])).toBe(false);
    expect(evaluateQuiz([], [])).toBe(false);
    expect(evaluateQuiz(["a"], [])).toBe(false);
  });

  it("rejects exercises whose answers cannot be selected", () => {
    const options = [{ id: "a" }, { id: "b" }];
    expect(() => validateExercise({ id: "check", options, answer: ["missing"] })).toThrow(/answer ids/);
    expect(() => validateExercise({ id: "check", options, answer: ["a", "a"] })).toThrow(/answer ids/);
    expect(() => validateExercise({ id: "check", options: [{ id: "a" }, { id: "a" }], answer: ["a"] })).toThrow(/duplicate/);
    expect(() => validateExercise({ id: "check", options, answer: ["a", "b"] })).toThrow(/exactly one/);
    expect(() => validateExercise({ id: "check", options, answer: ["a", "b"], multiple: true })).not.toThrow();
  });

  it("does not mutate its inputs", () => {
    const selected = Object.freeze(["b", "a"]);
    const answer = Object.freeze(["a", "b"]);
    expect(evaluateQuiz(selected, answer)).toBe(true);
    expect(selected).toEqual(["b", "a"]);
    expect(answer).toEqual(["a", "b"]);
  });
});
