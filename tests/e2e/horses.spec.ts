import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

async function deleteThunderbolt(page: Page) {
  await page.goto('/horses/horse-1');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: 'Delete profile' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Reason for deletion').fill('Created by mistake during the import');
  await dialog.getByLabel(/Type the horse name/).fill('thunderbolt  swift');
  await dialog.getByRole('button', { name: 'Delete profile' }).click();
  await expect(page).toHaveURL('/horses');
}

// Flow 1 DL-1.10 / SC-1.05 / DL-1.11: xóa mềm, Hoàn tác, khôi phục.
test('manager deletes a horse, undoes it, then restores it from Deleted horses', async ({ page }) => {
  await signIn(page, 'viet.do@gmail.com');

  await deleteThunderbolt(page);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page).toHaveURL('/horses/horse-1');
  await expect(page.getByRole('heading', { name: 'Thunderbolt Swift' }).first()).toBeVisible();

  await deleteThunderbolt(page);
  await page.getByRole('link', { name: 'Deleted horses' }).click();
  await expect(page).toHaveURL('/horses/deleted');
  await expect(page.getByText('Created by mistake during the import')).toBeVisible();

  await page.getByRole('button', { name: 'Restore' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Reason').fill('Deleted by mistake, restore it');
  await dialog.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByText('No horse profiles have been deleted.')).toBeVisible();
});

test('only the manager can open Deleted horses', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/horses/deleted');
  await expect(page.getByText('403', { exact: false }).first()).toBeVisible();
});
