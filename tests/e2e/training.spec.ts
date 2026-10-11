import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Club email', { exact: false }).fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

/** Ngày mai theo giờ câu lạc bộ (UTC+7), dạng YYYY-MM-DD. */
function tomorrowClub(): string {
  return new Date(Date.now() + 7 * 3600_000 + 24 * 3600_000).toISOString().slice(0, 10);
}

// Flow 2 DL-2.02: giáo án Nháp chưa có buổi tập thì không kích hoạt được.
test('head trainer cannot activate a draft plan without workouts', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/plans');
  const row = page.getByRole('row', { name: /Autumn base building/ });
  await row.getByRole('button', { name: 'Activate' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Activate' }).click();
  await expect(dialog.getByText('Add at least one workout before activating the plan.')).toBeVisible();
});

// Flow 2 DL-2.01 + DL-2.02: xếp buổi đi bộ nhẹ cho giáo án Nháp, rồi kích hoạt (có xác nhận VET).
test('head trainer schedules a light workout and then activates the plan', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/calendar');
  await page.getByRole('button', { name: '+ Schedule Workout' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Horse / plan').selectOption('plan-3');
  await dialog.getByLabel('Date').fill(tomorrowClub());
  await dialog.getByLabel('Workout type').selectOption('WALK');
  await dialog.getByLabel('Intensity').selectOption('LIGHT');
  await dialog.getByRole('button', { name: 'Save workout' }).click();
  await expect(page.getByText('Workout added.')).toBeVisible();

  await page.goto('/training/plans');
  const row = page.getByRole('row', { name: /Autumn base building/ });
  await row.getByRole('button', { name: 'Activate' }).click();
  const activate = page.getByRole('dialog');
  await activate.getByRole('button', { name: 'Activate' }).click();
  // Ngựa đang "Cần theo dõi" -> phải xác nhận đã trao đổi với bác sĩ thú y (DL-2.02 ⚠).
  await activate.getByText('I have discussed this plan with the Veterinarian').click();
  await activate.getByRole('button', { name: 'Activate' }).click();
  await expect(page.getByText('Training plan activated.')).toBeVisible();
  await expect(row.getByText('Active', { exact: true })).toBeVisible();
});

// RULE-MED-01: buổi tập nặng của ngựa đang khóa hiện "Bị chặn" và chưa khôi phục được.
test('a heavy workout of a locked horse is blocked and cannot be restored yet', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/calendar');
  await page.locator('input[type=date]').first().fill(tomorrowClub());
  const blocked = page.getByText('Blocked by Training Lock').first();
  await expect(blocked).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore' }).first()).toBeDisabled();
});
