import { test, expect } from '@playwright/test';
test('configured chat streams a conversation, retries failures, and resets without persistence',async({page})=>{
  let calls=0;
  await page.route('**/api/chat',async route=>{
    if(route.request().method()==='GET')return route.fulfill({json:{configured:true,presets:['default']}});
    calls++;
    if(calls===2)return route.fulfill({status:502,json:{error:'The AI service is temporarily unavailable. Please try again shortly.'}});
    return route.fulfill({contentType:'text/plain; charset=utf-8',body:'A mocked response for practice.'});
  });
  await page.goto('/showcase');await page.getByRole('button',{name:'Send message'}).click();
  await expect(page.getByText('A mocked response for practice.',{exact:true})).toBeVisible();
  await page.getByLabel('Your message',{exact:true}).fill('A second prompt');await page.getByRole('button',{name:'Send message'}).click();
  await expect(page.locator('.chat-error')).toContainText('temporarily unavailable');
  await page.getByRole('button',{name:'Retry last message'}).click();await expect(page.getByText('A mocked response for practice.',{exact:true})).toHaveCount(2);
  await page.getByRole('button',{name:'Reset conversation'}).click();await expect(page.getByText('A mocked response for practice.',{exact:true})).toHaveCount(0);
  await page.reload();await expect(page.getByRole('log',{name:'Practice conversation'})).toBeEmpty();
});
