import { defineConfig } from '@playwright/test';

// Chạy trên FE + BE + PostgreSQL thật (VITE_USE_MOCK=false). Cần sẵn: BE ở :3000 (đã seed) và `npm run dev` ở :5173.
export default defineConfig({
  testDir: './tests/live',
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.LIVE_WEB_URL ?? 'http://localhost:5173',
    locale: 'en-US',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
});
