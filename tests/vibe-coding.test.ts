import { describe, expect, it } from 'vitest';
import { buildVibeMessage } from '../src/components/exercises/vibe-coding';

const task = '打印 1 到 5 的和。';
const code = 'int total = 0;\nSystem.out.println(total);';
const question = '为什么没有输出？';

describe('buildVibeMessage', () => {
  it('gives the coach the task, the current code, and the question', () => {
    const message = buildVibeMessage(task, code, 'java', question, true);
    expect(message).toContain(`【任务】${task}`);
    expect(message).toContain('【我的当前代码】\n```java\nint total = 0;');
    expect(message).toContain(`【我的问题】\n${question}`);
  });

  it('can omit the code when the student turns attachment off', () => {
    const message = buildVibeMessage(task, code, 'java', question, false);
    expect(message).not.toContain('【我的当前代码】');
    expect(message).toContain(question);
  });

  it('omits the code section when the editor is empty', () => {
    expect(buildVibeMessage(task, '   ', 'java', question, true)).not.toContain('【我的当前代码】');
  });
});
