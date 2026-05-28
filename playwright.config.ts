import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER !== "1";

export default defineConfig({
  testDir: "./tests/e2e",
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium-mobile",
      use: {
        browserName: "chromium",
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 }
      }
    }
  ],
  webServer: shouldStartWebServer
    ? {
        command: `./node_modules/.bin/next start -H 127.0.0.1 -p ${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL
      }
    : undefined
});
