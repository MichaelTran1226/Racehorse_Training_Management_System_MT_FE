import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill('equiflow123');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

// C-08 · Flow 3: Khóa huấn luyện — chỉ VET đặt khóa, HT và CM chỉ xem.
test('a veterinarian places a training lock', async ({ page }) => {
  await signIn(page, 'chau.le@gmail.com');
  await page.goto('/locks');
  await page.getByRole('button', { name: 'Place Training Lock' }).click();
  const confirm = page.getByRole('button', { name: 'Confirm Training Lock' });
  await expect(confirm).toBeDisabled(); // chưa có lý do
  const dialog = page.getByRole('dialog');
  // Ngựa mặc định trong ô chọn (chỉ gồm ngựa chưa bị khóa) — tên đứng trước dấu " (".
  const picked = await dialog.locator('select').first().evaluate((el: HTMLSelectElement) => el.selectedOptions[0].text);
  const horseName = picked.split(' (')[0].trim();
  await page.getByPlaceholder(/Superficial digital flexor/).fill('Heat and swelling on the left fore tendon after work.');
  await confirm.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('table', { name: 'Training locks' }).getByText(horseName).first()).toBeVisible();
});

for (const email of ['nam.tran@gmail.com', 'viet.do@gmail.com']) {
  test(`${email} sees the locks but cannot place one`, async ({ page }) => {
    await signIn(page, email);
    await page.goto('/locks');
    await expect(page.getByRole('heading', { name: 'Training Locks' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Place Training Lock' })).toHaveCount(0);
  });
}
