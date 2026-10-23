import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// Dashboard phải hiện đúng số liệu BE trả về, không còn số cứng/số giả khi dữ liệu thật đã có.
const API = process.env.LIVE_API_URL ?? 'http://localhost:3000/api';
const PASSWORD = process.env.LIVE_PASSWORD ?? 'EquiFlow@2026'; // mật khẩu tài khoản seed (prisma/seed.ts)

async function token(request: APIRequestContext, email: string): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: { email, password: PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).data.accessToken;
}

async function get<T>(request: APIRequestContext, auth: string, path: string): Promise<T> {
  const res = await request.get(`${API}${path}`, { headers: { authorization: `Bearer ${auth}` } });
  expect(res.ok(), path).toBeTruthy();
  return (await res.json()).data as T;
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(PASSWORD);
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL('/dashboard');
}

/** Ô KPI: nhãn đứng ngay trước giá trị; trỏ đúng trang đã có route. */
async function expectKpi(page: Page, label: string, value: string | number, href: string) {
  const card = page.getByRole('link', { name: new RegExp(`^${label}`) });
  const v = String(value);
  await expect(card).toHaveText(new RegExp(`^${label}${v.replace('/', '\\/')}${/\d$/.test(v) ? '(\\D|$)' : ''}`));
  await expect(card).toHaveAttribute('href', href);
}

/** Ngày CLB (Asia/Ho_Chi_Minh) dạng YYYY-MM-DD, khớp todayClub() của FE. */
const clubDate = (d = new Date()) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
function clubWeek(): [string, string] {
  const today = new Date(`${clubDate()}T00:00:00Z`);
  const monday = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * 86_400_000);
  return [monday.toISOString().slice(0, 10), new Date(monday.getTime() + 6 * 86_400_000).toISOString().slice(0, 10)];
}

type List<T> = { items: T[]; total: number };

test('groom dashboard shows the groom’s real horses, shifts, tasks and open incidents', async ({ page, request }) => {
  const auth = await token(request, 'groom@gmail.com');
  const horses = await get<List<unknown>>(request, auth, '/horses?limit=100');
  const [from, to] = clubWeek();
  const shifts = await get<unknown[]>(request, auth, `/shift-rosters/my?startDate=${from}&endDate=${to}`);
  const tasks = await get<{ stats: { total: number; completed: number } }>(request, auth, `/daily-tasks?date=${clubDate()}&onlyMine=true`);
  const reported = await get<List<unknown>>(request, auth, '/incidents?status=REPORTED&limit=1');
  const reviewing = await get<List<unknown>>(request, auth, '/incidents?status=UNDER_REVIEW&limit=1');

  await signIn(page, 'groom@gmail.com');
  await expectKpi(page, 'Assigned horses', horses.items.length, '/horses');
  await expectKpi(page, 'Weekly Roster', shifts.length, '/stable/shifts');
  await expectKpi(page, 'Daily tasks', `${tasks.stats.completed}/${tasks.stats.total}`, '/tasks');
  await expectKpi(page, 'Incidents', reported.total + reviewing.total, '/incidents');
  await expect(page.getByText('Morning feeds completed.')).toHaveCount(0);
});

test('owner dashboard shows the owner’s real horses, plans, race entries and latest invoice', async ({ page, request }) => {
  const auth = await token(request, 'owner@gmail.com');
  const horses = await get<List<{ id: string }>>(request, auth, '/horses?limit=100');
  const plans = await get<List<unknown>>(request, auth, '/training/plans?status=ACTIVE&pageSize=100');
  const tournaments = await get<List<{ id: string; registeredCount: number }>>(request, auth, '/tournaments?limit=100');
  const mine = new Set(horses.items.map((h) => h.id));
  let entries = 0;
  for (const t of tournaments.items.filter((x) => x.registeredCount > 0)) {
    const detail = await get<{ registrations: { horseId: string }[] }>(request, auth, `/tournaments/${t.id}`);
    entries += detail.registrations.filter((r) => mine.has(r.horseId)).length;
  }
  const summary = await get<{ invoices: { status: string; billingPeriod: string }[] }>(request, auth, '/invoices/owner-summary');
  const latest = [...summary.invoices].sort((a, b) => b.billingPeriod.localeCompare(a.billingPeriod))[0];
  const statusText: Record<string, string> = { DRAFT: 'Draft', SENT: 'Sent', PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled' };

  await signIn(page, 'owner@gmail.com');
  await expectKpi(page, 'Owned horses', horses.items.length, '/my-horses');
  await expectKpi(page, 'Active plans', plans.total, '/progress');
  await expectKpi(page, 'Races entered', entries, '/races');
  await expectKpi(page, 'Monthly invoice', latest ? statusText[latest.status] : 'None', '/financial-reports');
  await expect(page.getByText(/Thunderbolt Swift is in prime fitness/)).toHaveCount(0);
});

test('manager dashboard shows no invented trend or sample horses', async ({ page, request }) => {
  const auth = await token(request, 'manager@gmail.com');
  const board = await get<{ summary: { total: number } }>(request, auth, '/medical/health-board');

  await signIn(page, 'manager@gmail.com');
  await expectKpi(page, 'Horses under management', board.summary.total, '/horses');
  await expect(page.getByText(/vs last month/)).toHaveCount(0);
});
