import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email = 'viet.do@gmail.com') {
  await page.goto('/login');
  await page.getByLabel('Club email', { exact: false }).fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

test('audit filters, pagination, detail and date validation', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await signIn(page);
  const actorName = await page.evaluate(() => {
    const key = 'equiflow.mock.db.v1';
    const db = JSON.parse(localStorage.getItem(key)!);
    const actor = db.accounts.find((a: { email: string }) => a.email === 'viet.do@gmail.com').fullName;
    db.audit = Array.from({ length: 25 }, (_, n) => ({ at: new Date(Date.UTC(2026, 8, 30, 12, n)).toISOString(), actor, action: n % 2 ? 'AUTH_LOGIN' : 'ACCOUNT_EDITED', detail: `Event ${n}` }));
    localStorage.setItem(key, JSON.stringify(db));
    return actor as string;
  });
  await page.goto('/audit');
  await expect(page.locator('span[role=status]')).toContainText('25 events');
  await expect(page.getByRole('row')).toHaveCount(21);
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.locator('span[role=status]')).toContainText('Page 2 of 2');
  await expect(page.getByRole('row')).toHaveCount(6);
  await page.getByLabel('Action', { exact: true }).fill('AUTH_LOGIN');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.locator('span[role=status]')).toContainText('12 events');
  await page.getByRole('button', { name: 'View details for AUTH_LOGIN' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Not recorded');
  await expect(page.getByRole('dialog')).toContainText('Event 23');
  await page.screenshot({ path: testInfo.outputPath('audit-detail.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Actor', { exact: true }).fill(actorName);
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.locator('span[role=status]')).toContainText('12 events');
  await page.getByLabel('Actor', { exact: true }).fill('no-matching-actor');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByText('No audit events match these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('span[role=status]')).toContainText('25 events');
  await page.getByLabel('From', { exact: true }).fill('2026-09-30T12:20');
  await page.getByLabel('To', { exact: true }).fill('2026-09-29T12:20');
  await expect(page.getByRole('button', { name: 'Apply filters' })).toBeDisabled();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('span[role=status]')).toContainText('25 events');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('audit-list.png'), fullPage: true });
  await page.setViewportSize({ width: 1920, height: 1080 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('audit-list-1920.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.getByRole('navigation', { name: 'Main navigation' }).evaluate(el => el.getBoundingClientRect().right)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('audit-mobile.png'), fullPage: true });
});

test('audit permission denied and explicit grant without accounts permission', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/audit');
  await expect(page.getByText('403', { exact: false }).first()).toBeVisible();
  await page.evaluate(() => {
    const key = 'equiflow.mock.db.v1';
    const db = JSON.parse(localStorage.getItem(key)!);
    db.accounts.find((a: { id: string }) => a.id === 'nam').permissions.viewAudit = true;
    localStorage.setItem(key, JSON.stringify(db));
  });
  await page.goto('/audit');
  await expect(page.getByRole('heading', { name: 'Audit Log', exact: true })).toBeVisible();
  await expect(page.locator('span[role=status]')).toContainText('events');
  await expect(page.getByRole('link', { name: 'Audit Log' })).toBeVisible();
});


test('audit load failure can be retried', async ({ page }) => {
  await signIn(page);
  const saved = await page.evaluate(() => {
    const key = 'equiflow.mock.db.v1';
    const raw = localStorage.getItem(key)!;
    const db = JSON.parse(raw);
    db.audit = null;
    localStorage.setItem(key, JSON.stringify(db));
    return raw;
  });
  await page.goto('/audit');
  await expect(page.getByText('Audit history could not be loaded')).toBeVisible();
  await page.evaluate(raw => localStorage.setItem('equiflow.mock.db.v1', raw), saved);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('span[role=status]')).toContainText('1 events');
  await expect(page.getByText('Audit history could not be loaded')).toHaveCount(0);
});

