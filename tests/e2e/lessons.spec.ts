import { test, expect } from '@playwright/test';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
const files=['framework-smoke-one','framework-smoke-two'];
test.beforeAll(async()=>{for(const [index,slug] of files.entries()) await writeFile(path.join(process.cwd(),'content/lessons',`${slug}.mdx`),`---\nid: ${slug}\ntitle: Smoke lesson ${index+1}\norder: ${298+index}\ngroup: Test fixtures\n---\n## A test heading\n\nTemporary browser-test content.\n\n## Read [the guide](/authoring)\n\n### Intro\n\n## Intro\n`);});
test.afterAll(async()=>{for(const slug of files)await unlink(path.join(process.cwd(),'content/lessons',`${slug}.mdx`)).catch(()=>{});});
test('lesson ordering, navigation, and completion persistence',async({page})=>{
  await page.goto(`/lessons/${files[0]}`);await expect(page.getByRole('heading',{name:'Smoke lesson 1'})).toBeVisible();
  await page.getByRole('button',{name:'Mark lesson complete'}).click();await page.reload();
  await expect(page.getByRole('button',{name:'Completed — mark incomplete'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('navigation',{name:'Lesson navigation'}).getByRole('link',{name:'Smoke lesson 2'}).click();
  await expect(page.getByRole('heading',{name:'Smoke lesson 2'})).toBeVisible();
  const links = page.getByRole('navigation',{name:'On this page'}).getByRole('link');
  await expect(links).toHaveCount(3);
  for (const href of await links.evaluateAll((items)=>items.map((item)=>item.getAttribute('href')))) {
    expect(href).toBeTruthy();
    await expect(page.locator(href!)).toHaveCount(1);
  }
  await expect(links.nth(2)).toHaveAttribute('href','#intro-1');
});
