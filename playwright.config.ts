import { defineConfig, devices } from "@playwright/test";

// End-to-end checks run against the app's built-in demo backend (the credential-free
// `npm run dev` mode), so they need no database and no accounts. They click through
// the screens a gym owner and their staff use, check every screen with axe for
// accessibility problems, and check the layouts on a phone and a tablet.
//
//   npm run e2e            everything
//   npm run e2e -- --project=phone    one device
//
// In CI, `npx playwright install --with-deps chromium` provides the browser. Where a
// browser is already installed (a sandbox), point PW_CHROMIUM at it.
const PORT = 5174;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] },
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 }, hasTouch: true }, testMatch: /(responsive|billing-tab)\.spec\.ts/ },
    { name: "phone", use: { ...devices["Pixel 5"] }, testMatch: /(responsive|billing-tab)\.spec\.ts/ },
  ],
});
