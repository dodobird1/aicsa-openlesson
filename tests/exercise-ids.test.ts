import { describe, expect, it } from 'vitest';
import { assertUniqueExerciseIds, exerciseIdsFromSource } from '../src/lib/content';

describe('exercise id uniqueness', () => {
  it('extracts ids from rendered exercise components', () => {
    expect(exerciseIdsFromSource('<MultipleChoice id="a" question="Q?" />')).toEqual(['a']);
    expect(exerciseIdsFromSource("<LLMPractice id='b' instructions='Try it.' />")).toEqual(['b']);
    expect(exerciseIdsFromSource('<MultipleChoice\n  id="c"\n  question="Q?"\n/>')).toEqual(['c']);
  });

  it('ignores examples inside code fences and inline code', () => {
    expect(exerciseIdsFromSource('```mdx\n<MultipleChoice id="a" />\n```\nUse `<LLMPractice id="b" />` carefully.')).toEqual([]);
  });

  it('accepts distinct ids and reports duplicates with their locations', () => {
    expect(() => assertUniqueExerciseIds([
      { name: 'one.mdx', source: '<MultipleChoice id="a" />' },
      { name: 'two.mdx', source: '<LLMPractice id="b" />' },
    ])).not.toThrow();
    expect(() => assertUniqueExerciseIds([
      { name: 'one.mdx', source: '<MultipleChoice id="a" />' },
      { name: 'two.mdx', source: '<LLMPractice id="a" />' },
    ])).toThrow(/one\.mdx/);
  });
});
