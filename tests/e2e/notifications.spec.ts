import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

// C-01: chuông đọc thông báo qua API /notifications; mở tab Pending thì thông báo đăng ký mới được đánh dấu đã đọc.
test('opening the Pending tab marks the sign-up notification as read', async ({ page }) => {
  await signIn(page, 'viet.do@gmail.com');
  await expect(page.getByRole('button', { name: 'Notifications, 2 unread' })).toBeVisible();
  await page.goto('/accounts');
  await page.getByRole('tab', { name: /Pending/ }).click();
  await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible();
});

test('a role only sees its own notifications', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/notifications');
  await expect(page.getByText('New Account Registration Request')).toHaveCount(0);
});
