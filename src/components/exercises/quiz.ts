export function validateExercise({ id, options, answer, multiple }: { id: string; options: { id: string }[]; answer: string[]; multiple?: boolean }): void {
  const label = id?.trim() || "unknown";
  if (!id?.trim() || !Array.isArray(options) || !Array.isArray(answer)) throw new Error(`Exercise "${label}" needs an id, options, and an answer.`);
  const ids = options.map((option) => option.id);
  if (ids.some((optionId) => !optionId?.trim()) || new Set(ids).size !== ids.length) throw new Error(`Exercise "${label}" has missing or duplicate option ids.`);
  const expected = new Set(answer);
  if (!answer.length || expected.size !== answer.length || answer.some((optionId) => !ids.includes(optionId))) throw new Error(`Exercise "${label}" has answer ids that do not match its options.`);
  if (!multiple && answer.length !== 1) throw new Error(`Exercise "${label}" needs exactly one answer, or set multiple.`);
}

/** Answers are unordered sets; extra, missing, or duplicate selections fail. */
export function evaluateQuiz(selected: readonly string[], answer: readonly string[]): boolean {
  const expected = new Set(answer);
  const actual = new Set(selected);
  if (!expected.size || actual.size !== selected.length || actual.size !== expected.size) return false;
  return [...actual].every((id) => expected.has(id));
}
