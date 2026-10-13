import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Club email', { exact: false }).fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

// P1-12 SC-1.06: CM thêm giống mới, form tạo ngựa chọn được giống đó (danh mục thay cho danh sách viết cứng).
test('manager adds a breed and the horse form offers it', async ({ page }) => {
  await signIn(page, 'viet.do@gmail.com');
  await page.goto('/catalogs/breeds');
  await expect(page.getByRole('heading', { name: 'Breeds & coat colours' })).toBeVisible();

  await page.getByRole('button', { name: 'Add new' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Code').fill('AKHAL_TEKE');
  await dialog.getByLabel('Name').fill('Akhal-Teke');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Akhal-Teke', { exact: true })).toBeVisible();

  await page.goto('/horses/new');
  await expect(page.getByLabel('Breed', { exact: false }).locator('option', { hasText: 'Akhal-Teke' })).toHaveCount(1);
});

test('only the manager edits the breed catalogue', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/catalogs/breeds');
  await expect(page.getByText('Thoroughbred', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add new' })).toHaveCount(0);
});

// P1-14 SC-3.01: CM, HT có menu Herd Health; trang không còn nút tạo / xóa ngựa giả.
test('head trainer opens herd health from the menu and sees the colour cards', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.getByRole('link', { name: 'Herd Health' }).first().click();
  await expect(page).toHaveURL('/herd');
  await expect(page.getByRole('button', { name: /^Fit to work\s*\d+$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Training Lock\s*\d+$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Horse' })).toHaveCount(0);
});
