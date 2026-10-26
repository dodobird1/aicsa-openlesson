import { test, expect } from '@playwright/test';

// The showcase Parsons demo always opens scrambled but never solved, and its answer is fixed content.
const parsonsAnswer = ['for (int i = 0; i < 2; i++) {', '    System.out.println("Hello!");', '}'];

test('parsons problems reorder, check, and persist attempts locally', async ({ page }) => {
  await page.goto('/showcase');
  const card = page.getByRole('region', { name: '代码排序练习' });
  await card.getByRole('button', { name: '检查答案' }).click();
  await expect(card.getByText('顺序还不对，继续调整。')).toBeVisible();
  let current = await card.locator('.parsons-item .parsons-line').allTextContents();
  for (let target = 0; target < parsonsAnswer.length; target += 1) {
    while (current[target]?.trim() !== parsonsAnswer[target].trim()) {
      const from = current.findIndex((line) => line.trim() === parsonsAnswer[target].trim());
      await card.locator('.parsons-item').nth(from).getByRole('button', { name: '上移' }).click();
      current = await card.locator('.parsons-item .parsons-line').allTextContents();
    }
  }
  await card.getByRole('button', { name: '检查答案' }).click();
  await expect(card.getByText('回答正确！')).toBeVisible();
  await expect(card.getByRole('button', { name: '检查答案' })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('region', { name: '代码排序练习' }).getByText(/已尝试 2 次/)).toBeVisible();
});

test('fill-in-the-blank marks each blank and locks when solved', async ({ page }) => {
  await page.goto('/showcase');
  const card = page.getByRole('region', { name: '填空练习' });
  const inputs = card.locator('input');
  await expect(inputs).toHaveCount(2);
  await inputs.nth(0).fill('double');
  await inputs.nth(1).fill('nextInt');
  await card.getByRole('button', { name: '检查答案' }).click();
  await expect(card.getByText('还有空没答对，看看标红的空。')).toBeVisible();
  await expect(inputs.nth(0)).toHaveClass(/is-wrong/);
  await expect(inputs.nth(1)).toHaveClass(/is-correct/);
  await inputs.nth(0).fill('int');
  await card.getByRole('button', { name: '检查答案' }).click();
  await expect(card.getByText('全部正确！')).toBeVisible();
  await expect(inputs.nth(0)).toBeDisabled();
});
