import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

async function switchToVietnamese(page: Page) {
  const toggle = page.getByRole('button', { name: 'Chuyển sang Tiếng Việt' });
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Switch to English' })).toBeVisible();
}

// Yêu cầu song ngữ: nút đổi ngôn ngữ chuyển toàn bộ chữ giao diện sang tiếng Việt và ghi nhớ lựa chọn.
test('the language toggle switches the interface to Vietnamese and remembers it', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Chuyển sang Tiếng Việt' }).click();
  await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
});

test('horse profile page reflects bilingual attributes and age localization', async ({ page }) => {
  await signIn(page, 'viet.do@gmail.com');
  await page.goto('/horses/horse-1');

  // In English:
  await expect(page.getByText(/\d+ y\/o/).first()).toBeVisible();

  // Switch to Vietnamese:
  await switchToVietnamese(page);
  await expect(page.getByText(/\d+ tuổi/).first()).toBeVisible();
  await expect(page.getByText('Giống ngựa').first()).toBeVisible();
  await expect(page.getByText('Giới tính').first()).toBeVisible();
  await expect(page.getByText('Màu lông').first()).toBeVisible();
});

test('stable map page localizes search placeholder and empty search state in Vietnamese', async ({ page }) => {
  await signIn(page, 'viet.do@gmail.com');
  await page.goto('/stalls');
  await switchToVietnamese(page);

  const searchInput = page.getByPlaceholder('Tên hoặc mã ngựa');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('ZZZZ_UNKNOWN_HORSE_QUERY');

  await expect(page.getByText('Không tìm thấy ngựa trên sơ đồ.')).toBeVisible();
});

test('medical record prescriptions table displays Vietnamese units and intervals', async ({ page }) => {
  await signIn(page, 'chau.le@gmail.com');
  await switchToVietnamese(page);
  await page.goto('/medical/records/rec-1?tab=prescriptions');

  await expect(page.getByRole('tab', { name: 'Đơn thuốc' })).toBeVisible();
  await expect(page.getByText('lần/ngày').first()).toBeVisible();
  await expect(page.getByText('ngày').first()).toBeVisible();
});
