import { test, expect } from '@playwright/test';

test('course home lists lessons and leads to author tools',async({page})=>{
  await page.goto('/');await page.screenshot({path:'test-results/framework-home.png',fullPage:true});await expect(page.getByRole('heading',{name:'从这里开始，一课一练。'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Overview'})).toHaveAttribute('aria-current','page');
  await page.getByRole('link',{name:/欢迎：这门课怎么学/}).first().click();await expect(page.getByRole('heading',{name:'欢迎：这门课怎么学'})).toBeVisible();
  await page.getByRole('link',{name:'Component showcase'}).click();await expect(page.getByRole('heading',{name:'Knowledge checks',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'AI practice',exact:true})).toBeVisible();
});
test('quiz feedback survives reload and chat matches configuration',async({page})=>{
  await page.goto('/showcase');
  await page.getByLabel('MDX — Markdown with components').check();
  await page.getByRole('button',{name:/check answer|submit answer/i}).first().click();
  await expect(page.getByText(/correct|nicely done|you got it/i).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(/correct|nicely done|you got it/i).first()).toBeVisible();
  const status = await page.evaluate(()=>fetch('/api/chat').then((r)=>r.json()) as Promise<{configured:boolean}>);
  const chatComposer = page.getByLabel('Your message',{exact:true});
  if (status.configured) { await expect(chatComposer).toBeEnabled(); }
  else {
    await expect(page.getByText(/not configured|not connected|isn.t connected|not available for this exercise/i).first()).toBeVisible();
    await expect(chatComposer).toBeDisabled();
  }
});
test('mobile navigation and layout',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.getByText('Menu',{exact:true}).click();
  await expect(page.getByRole('button',{name:'Reset progress'})).toBeVisible();
  await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Authoring guide'}).click();
  await expect(page.getByRole('navigation',{name:'Mobile navigation'})).toBeHidden();
  await expect(page.getByRole('heading',{name:'Start with one file'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('copying a code example keeps its line breaks',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/showcase');
  await page.getByRole('button',{name:'Copy code'}).first().click();
  await expect.poll(()=>page.evaluate(()=>navigator.clipboard.readText())).toContain('def say_hello(name):\n');
});
