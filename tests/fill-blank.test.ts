import { describe, expect, it } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { blankCountOf, evaluateFillBlank, splitOnBlanks } from '../src/components/exercises/fill-blank';

const answers = ['int', 'nextInt'];

describe('splitOnBlanks', () => {
  it('splits text around runs of three or more question marks', () => {
    expect(splitOnBlanks('??? total = scanner.???();')).toEqual([
      { blank: true }, { text: ' total = scanner.' }, { blank: true }, { text: '();' },
    ]);
    expect(splitOnBlanks('no blanks here')).toEqual([{ text: 'no blanks here' }]);
    expect(splitOnBlanks('????')).toEqual([{ blank: true }]);
    expect(splitOnBlanks('')).toEqual([]);
  });
});

describe('evaluateFillBlank', () => {
  it('marks each blank independently with whitespace normalization', () => {
    expect(evaluateFillBlank(['int', ' nextInt '], answers)).toEqual([true, true]);
    expect(evaluateFillBlank(['', 'nextInt'], answers)).toEqual([false, true]);
    expect(evaluateFillBlank(['INT', 'nextInt'], answers)).toEqual([false, true]);
  });
  it('can ignore letter case for prose answers', () => {
    expect(evaluateFillBlank(['INT', 'NextInt'], answers, false)).toEqual([true, true]);
  });
  it('collapses repeated spaces inside answers', () => {
    expect(evaluateFillBlank(['a  +  b'], ['a + b'])).toEqual([true]);
  });
});

describe('blankCountOf', () => {
  it('counts blanks through nested JSX element trees', () => {
    const tree = createElement('code', null, [
      createElement('span', { 'data-line': '' }, '??? class Greeter {'),
      '\n',
      createElement('span', { 'data-line': '' }, createElement('span', { style: {} }, '    public static ??? main')),
    ]);
    expect(blankCountOf(tree)).toBe(2);
  });
  it('unwraps RSC thenables so deep code lines still count', () => {
    // RSC serialization delivers deep children subtrees as lazy wrappers with
    // a fulfilled payload ({ _payload: { status, value } }), or as the payload
    // itself. Both shapes must unwrap to the inner element.
    const lazyWrap = { _payload: { status: 'fulfilled', value: createElement('span', null, 'System.out.???("x");') } } as unknown as ReactNode;
    const bareThenable = { status: 'fulfilled', value: createElement('span', null, '??? nextInt();') } as unknown as ReactNode;
    const tree = createElement('code', null, [
      createElement('span', null, 'line one has no blank'),
      '\n',
      lazyWrap,
      '\n',
      bareThenable,
    ]);
    expect(blankCountOf(tree)).toBe(2);
  });
  it('ignores pending thenables instead of crashing', () => {
    const tree = createElement('code', null, [
      { _payload: { status: 'pending', value: createElement('span', null, '???') } } as unknown as ReactNode,
      { status: 'pending', value: createElement('span', null, '???') } as unknown as ReactNode,
    ]);
    expect(blankCountOf(tree)).toBe(0);
  });
});
