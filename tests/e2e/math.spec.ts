import { test, expect } from '@playwright/test';

test('MDX formulas render inline, display, and aligned math with accessible MathML', async ({ page }) => {
  await page.goto('/showcase');
  await expect(page.locator('.katex')).toHaveCount(3);
  await expect(page.locator('.katex-display')).toHaveCount(2);
  await expect(page.locator('.katex math')).toHaveCount(3);
  await expect(page.locator('.katex-error')).toHaveCount(0);
  await expect(page.locator('.katex-display').first()).toContainText('x');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('formula examples in the authoring guide stay literal in code blocks', async ({ page }) => {
  await page.goto('/authoring');
  await expect(page.getByRole('heading', { name: 'Write formulas' })).toBeVisible();
  await expect(page.locator('pre').filter({ hasText: '\\frac{1}{n}' })).toContainText('$$');
  await expect(page.locator('.katex-error')).toHaveCount(0);
});
