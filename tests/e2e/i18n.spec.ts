import { test, expect } from '@playwright/test';

// Yêu cầu song ngữ: nút đổi ngôn ngữ chuyển toàn bộ chữ giao diện sang tiếng Việt và ghi nhớ lựa chọn.
test('the language toggle switches the interface to Vietnamese and remembers it', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Enter workspace' })).toBeVisible();
  await page.getByRole('button', { name: 'Chuyển sang Tiếng Việt' }).click();
  await expect(page.getByRole('button', { name: 'Vào không gian làm việc' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Vào không gian làm việc' })).toBeVisible();
});
