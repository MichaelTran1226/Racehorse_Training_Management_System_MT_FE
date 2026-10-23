import { test, expect } from '@playwright/test';

/**
 * Parameterized 5-Role Matrix Landing Test (OPTIMIZED TESTING WORKFLOW)
 * Verifies that all 5 roles land on their dedicated dashboards without runtime errors.
 */
const ROLES_MATRIX = [
  {
    role: 'CLUB_MANAGER',
    email: 'manager@gmail.com',
    expectedText: 'Horses under management',
  },
  {
    role: 'HEAD_TRAINER',
    email: 'trainer@gmail.com',
    expectedText: 'Active training plans',
  },
  {
    role: 'VETERINARIAN',
    email: 'vet@gmail.com',
    expectedText: 'Training Locks in force',
  },
  {
    role: 'GROOM',
    email: 'groom@gmail.com',
    expectedText: 'Assigned horses',
  },
  {
    role: 'HORSE_OWNER',
    email: 'owner@gmail.com',
    expectedText: 'My horses',
  },
];

for (const { role, email, expectedText } of ROLES_MATRIX) {
  test(`5-Role Matrix Landing: ${role} lands on dashboard with zero runtime errors`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/login');
    await page.locator('input[type=email]').fill(email);
    await page.locator('input[type=password]').fill('EquiFlow@2026');
    await page.locator('button[type=submit]').click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(expectedText).first()).toBeVisible();

    // Zero uncaught runtime errors during render
    expect(pageErrors).toEqual([]);
  });
}
