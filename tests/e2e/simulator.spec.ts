import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email = 'nam.tran@gmail.com') {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

async function switchToVietnamese(page: Page) {
  const toggle = page.getByRole('button', { name: 'Chuyển sang Tiếng Việt' });
  if (await toggle.isVisible()) {
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Switch to English' })).toBeVisible();
  }
}

test('live monitor renders mock simulator sessions with telemetry metrics and warning badges', async ({ page }) => {
  await signIn(page);
  await page.goto('/training/monitor');

  // Must show page title
  await expect(page.getByRole('heading', { name: /Session Telemetry & Biometrics/i })).toBeVisible();

  // Must render sessions from simulator API, including warning badge on alert metrics
  await expect(page.getByText('Thunderbolt Swift').first()).toBeVisible();
  await expect(page.getByText('Shadowfax Wonder').first()).toBeVisible();

  // Warning badge for session with high heart rate alert
  await expect(page.getByText(/Elevated Heart Rate/i).first()).toBeVisible();

  // Test bilingual support
  await switchToVietnamese(page);
  await expect(page.getByRole('heading', { name: /Số liệu & sinh trắc buổi tập/i })).toBeVisible();
  await expect(page.getByText(/Nhịp tim tăng cao/i).first()).toBeVisible();
});

test('live monitor displays empty state when no simulator sessions exist', async ({ page }) => {
  await signIn(page);
  await page.evaluate(() => sessionStorage.setItem('equiflow.mock.empty_simulator', 'true'));
  await page.goto('/training/monitor');

  await expect(page.getByText(/No active or recent simulator sessions/i).first()).toBeVisible();
});
