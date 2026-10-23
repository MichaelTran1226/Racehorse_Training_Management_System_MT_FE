import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email: string, password = 'equiflow123') {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

/** Ngày mai theo giờ câu lạc bộ (UTC+7), dạng YYYY-MM-DD. */
function tomorrowClub(): string {
  return new Date(Date.now() + 7 * 3600_000 + 24 * 3600_000).toISOString().slice(0, 10);
}

// SC-2.04 / DL-2.02: giáo án Nháp chưa có buổi tập thì nút Kích hoạt bị vô hiệu hóa, có lý do.
test('a draft plan without workouts cannot be activated', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/plans');
  await page.getByRole('row', { name: /Autumn base building/ }).click();
  await expect(page).toHaveURL(/\/training\/plans\/plan-3$/);
  const activate = page.getByRole('button', { name: 'Activate' });
  await expect(activate).toBeDisabled();
  await expect(activate).toHaveAttribute('title', 'The plan has no workouts yet.');
});

// DL-2.01 + DL-2.02: xếp buổi đi bộ nhẹ cho giáo án Nháp, rồi kích hoạt (có xác nhận VET).
test('head trainer schedules a light workout and then activates the plan', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/calendar');
  await page.getByRole('button', { name: '+ Schedule Workout' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Horse / plan').selectOption('plan-3');
  await dialog.getByLabel('Date').fill(tomorrowClub());
  await dialog.getByLabel('Start time').fill('09:00');
  await dialog.getByLabel('Workout type').selectOption('WALK');
  await dialog.getByLabel('Intensity').selectOption('LIGHT');
  await dialog.getByRole('button', { name: 'Save workout' }).click();
  await expect(page.getByText('Workout added.')).toBeVisible();

  await page.goto('/training/plans/plan-3');
  await page.getByRole('button', { name: 'Activate' }).click();
  const activate = page.getByRole('dialog');
  // Ngựa đang "Cần theo dõi" -> phải xác nhận đã trao đổi với bác sĩ thú y (DL-2.02 ⚠).
  await expect(activate.getByRole('button', { name: 'Activate' })).toBeDisabled();
  await activate.getByText('I have discussed this plan with the Veterinarian').click();
  await activate.getByRole('button', { name: 'Activate' }).click();
  await expect(page.getByText('Training plan activated.')).toBeVisible();
  await expect(page.getByText('Active', { exact: true }).first()).toBeVisible();
});

// RULE-MED-01: buổi tập nặng của ngựa đang khóa hiện "Bị chặn" và chưa khôi phục được.
test('a heavy workout of a locked horse is blocked and cannot be restored yet', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/calendar');
  await page.locator('input[type=date]').first().fill(tomorrowClub());
  await page.getByRole('button', { name: /Blocked.*Northern Dancer Legacy/ }).click();
  const restore = page.getByRole('button', { name: 'Restore' });
  await expect(restore).toBeDisabled();
  await expect(restore).toHaveAttribute('title', 'The horse is still under a Training Lock.');
});

// SC-2.01: tổng quan có 4 thẻ chỉ số và bảng ngựa.
test('training overview shows the KPI cards and the horse table', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training');
  await expect(page.getByText('Active plans', { exact: true })).toBeVisible();
  await expect(page.getByText('Sudden load increase', { exact: true })).toBeVisible();
  await expect(page.getByRole('row', { name: /Thunderbolt Swift/ })).toBeVisible();
});

// SC-2.06: kết quả có dấu hiệu bất thường; quá 48 giờ thì không sửa được.
test('a recorded result shows abnormal signs and cannot be edited after 48 hours', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/sessions/w-105/result');
  await expect(page.getByText('Abnormal signs', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit result' })).toBeDisabled();
});

// SC-2.08: Groom xem buổi được phân công.
test('a groom sees the workouts assigned to them', async ({ page }) => {
  // Mật khẩu của tài khoản seed trong src/shared/mock/accounts.ts
  await signIn(page, 'groom@gmail.com', 'EquiFlow@2026');
  await page.goto('/my-training');
  await page.getByRole('tab', { name: 'Tomorrow' }).click();
  await expect(page.getByText(/Thunderbolt Swift/).first()).toBeVisible();
  await expect(page.getByText('do not take the horse to the track', { exact: false }).first()).toBeVisible();
});

test('head trainer launches a due trial with the URL issued by the backend', async ({ page }) => {
  await page.context().route('http://localhost:5175/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Simulator</title>' }),
  );
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/trials');

  const dueRow = page.getByRole('row').filter({ hasText: 'Thunderbolt Swift' }).filter({ hasText: '1200m' });
  const futureRow = page.getByRole('row').filter({ hasText: 'Thunderbolt Swift' }).filter({ hasText: '1000m' });
  await expect(futureRow.getByRole('button', { name: 'Run simulation' })).toBeDisabled();
  await expect(futureRow.getByRole('button', { name: 'Run simulation' })).toHaveAttribute(
    'title',
    'The trial has not reached its scheduled start time.',
  );
  const popupPromise = page.waitForEvent('popup');
  await dueRow.getByRole('button', { name: 'Run simulation' }).click();
  const popup = await popupPromise;

  await expect(popup).toHaveURL(/localhost:5175\/\?sessionId=mock-sim-w-106/);
});

test('live monitor renders telemetry returned by the simulator API', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/monitor');

  await expect(page.getByText('MICROCHIP-LIVE-001')).toBeVisible();
  await expect(page.getByText('43.2 km/h')).toBeVisible();
  await expect(page.getByText('156 bpm')).toBeVisible();
  await expect(page.getByText('600m / 1200m')).toBeVisible();
  await expect(page.getByText('Waiting for the first telemetry packet…')).toBeVisible();
});

test('trainer result form is prefilled from a finished simulator session', async ({ page }) => {
  await signIn(page, 'nam.tran@gmail.com');
  await page.goto('/training/sessions/w-106/result');

  await expect(page.getByLabel('Actual distance (m)')).toHaveValue('1187');
  await expect(page.getByLabel('Running time (mm:ss.s)')).toHaveValue('01:12.4');
  await expect(page.getByLabel('Peak heart rate (bpm)')).toHaveValue('195');
  await expect(page.getByLabel('Heart rate after 10 min rest (bpm)')).toHaveValue('86');
  await expect(page.getByLabel('Top speed (km/h)')).toHaveValue('65.5');
  await expect(page.getByLabel('Actual surface')).toHaveValue('TURF');
  await expect(page.getByLabel('Track condition')).toHaveValue('SOFT');
  await expect(page.getByLabel('Performance score')).toHaveValue('');
  await expect(page.getByLabel('Completion')).toHaveValue('');
  await expect(page.getByLabel(/Professional comment/)).toHaveValue('');

  await page.getByLabel('Performance score').selectOption('7');
  await page.getByLabel('Completion').selectOption('PARTIAL');
  await page.getByLabel(/Professional comment/).fill('Stopped safely and referred for veterinary review.');
  await page.getByRole('button', { name: 'Save result' }).click();
  await expect(page).toHaveURL('/dashboard');

  await page.goto('/training/sessions/w-106/result');
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  await expect(page.getByText('65.5 km/h')).toBeVisible();
  await expect(page.getByText('Stopped safely and referred for veterinary review.')).toBeVisible();
});
