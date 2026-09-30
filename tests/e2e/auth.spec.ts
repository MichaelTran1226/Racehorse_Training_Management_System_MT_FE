import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Club email', { exact: false }).fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
}

test('unauthenticated account access redirects to login', async ({ page }) => {
  await page.goto('/accounts');
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});

test('manager opens accounts and retains the session on reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await signIn(page, 'viet.do@gmail.com');
  await expect(page).toHaveURL('/dashboard');
  await page.goto('/accounts');
  await expect(page.getByText('viet.do@gmail.com', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('viet.do@gmail.com', { exact: true })).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflows).toBe(false);
  expect(errors).toEqual([]);
});

test('trainer is denied account management', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await expect(page).toHaveURL('/dashboard');
  await page.goto('/accounts');
  await expect(page.getByText('403', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('viet.do@gmail.com', { exact: true })).toHaveCount(0);
});

test('locked account cannot enter dashboard', async ({ page }) => {
  await signIn(page, 'binh.pham@gmail.com');
  await expect(page.getByRole('alert')).toContainText(/locked/i);
  await expect(page).toHaveURL('/login');
});
