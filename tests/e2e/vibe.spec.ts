import { test, expect } from '@playwright/test';

test('vibe coding shares code with the coach but never lets it edit', async ({ page }) => {
  const captured: { messages: { role: string; content: string }[] }[] = [];
  await page.route('**/api/chat', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { configured: true, presets: ['code-reviewer'] } });
    captured.push(route.request().postDataJSON());
    return route.fulfill({ contentType: 'text/plain; charset=utf-8', body: '看看第 4 行：赋值语句少了一个分号。' });
  });
  await page.goto('/showcase');
  const card = page.getByRole('region', { name: 'AI 结对编程练习' });
  const editor = card.getByLabel(/代码编辑区/);
  const firstCode = 'public class Sum {\n    public static void main(String[] args) {\n        int total = 0\n        System.out.println(total);\n    }\n}';
  await editor.fill(firstCode);
  await card.getByLabel('你的提问', { exact: true }).fill('为什么编译不过？');
  await card.getByRole('button', { name: '发送' }).click();
  await expect(card.getByText('看看第 4 行：赋值语句少了一个分号。')).toBeVisible();

  // The coach received the task, the student's code, and the question.
  const firstRequest = captured[0]?.messages;
  expect(firstRequest?.at(-1)?.role).toBe('user');
  expect(firstRequest?.at(-1)?.content).toContain('int total = 0');
  expect(firstRequest?.at(-1)?.content).toContain('为什么编译不过？');

  // The AI exchange never touches the editor.
  await expect(editor).toHaveValue(firstCode);

  // A second turn carries the updated code on the newest message only.
  const secondCode = firstCode.replace('int total = 0', 'int total = 0;');
  await editor.fill(secondCode);
  await card.getByLabel('你的提问', { exact: true }).fill('现在还有问题吗？');
  await card.getByRole('button', { name: '发送' }).click();
  await expect(card.getByText('看看第 4 行：赋值语句少了一个分号。')).toHaveCount(2);
  const secondRequest = captured[1]?.messages;
  expect(secondRequest).toHaveLength(3);
  expect(secondRequest?.[0]?.content).not.toContain('【我的当前代码】');
  expect(secondRequest?.at(-1)?.content).toContain('int total = 0;');
  await expect(editor).toHaveValue(secondCode);
  await card.getByLabel('你的提问', { exact: true }).fill('还有一个新问题');
  await expect(card.getByRole('button', { name: '发送' })).toBeEnabled();
});
