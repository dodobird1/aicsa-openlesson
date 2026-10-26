import { describe, expect, it } from 'vitest';
import { evaluateParsons, scrambleLines } from '../src/components/exercises/parsons';

const spec = { id: 'p1', question: 'Order the lines.', lines: ['int sum = 0;', '    for (int n : numbers) {', '        sum += n;', '    }', '}'] };

describe('scrambleLines', () => {
  it('keeps every line and is deterministic for a seed', () => {
    const first = scrambleLines(spec.lines, 'p1');
    expect([...first].sort()).toEqual([...spec.lines].sort());
    expect(scrambleLines(spec.lines, 'p1')).toEqual(first);
  });
  it('never presents the solved order for multi-line problems', () => {
    for (let seed = 0; seed < 30; seed += 1) expect(scrambleLines(spec.lines, `seed-${seed}`)).not.toEqual(spec.lines);
  });
  it('different seeds can produce different orders', () => {
    const orders = new Set(['p1', 'p2', 'p3', 'p4', 'p5'].map((seed) => scrambleLines(spec.lines, seed).join('\n')));
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('evaluateParsons', () => {
  it('matches only the exact sequence', () => {
    expect(evaluateParsons(spec.lines, spec.lines)).toBe(true);
    expect(evaluateParsons([spec.lines[0], spec.lines[2], spec.lines[1]], spec.lines)).toBe(false);
    expect(evaluateParsons(spec.lines.slice(0, 4), spec.lines)).toBe(false);
  });
  it('does not mutate its inputs', () => {
    const current = Object.freeze([...spec.lines]);
    expect(evaluateParsons(current, spec.lines)).toBe(true);
  });
});
