import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Club email', { exact: false }).fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

// Q-0.01 = B: mỗi vai trò một dashboard riêng.
test('the club manager lands on the club overview', async ({ page }) => {
  await signIn(page, 'viet.do@gmail.com');
  await expect(page.getByText('Horses under management')).toBeVisible();
  await expect(page.getByText('Medical safety', { exact: true })).toBeVisible();
});

test('the head trainer lands on the training dashboard', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await expect(page.getByText('Active training plans')).toBeVisible();
  await expect(page.getByText("Today's workouts", { exact: true })).toBeVisible();
  await expect(page.getByText('Horses under management')).toHaveCount(0);
});

test('the veterinarian lands on the medical dashboard', async ({ page }) => {
  await signIn(page, 'chau.le@gmail.com');
  await expect(page.getByText('Training Locks in force')).toBeVisible();
  await expect(page.getByText('Abnormal signs to review')).toBeVisible();
});

// Q-0.04: Head Trainer xem danh sách cảnh báo nhưng không ghi nhận (chỉ VET).
test('the head trainer sees alerts but cannot acknowledge them', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.getByRole('link', { name: 'Threshold Alerts' }).click();
  await expect(page).toHaveURL('/alerts');
  await expect(page.getByRole('button', { name: 'Review & respond' })).toHaveCount(0);
});
