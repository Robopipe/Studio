import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 5174);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Run dev (not preview) so hot-reloaded source matches what unit tests cover.
    // VITE_E2E=true is read by the app to expose `window.__editor`.
    //
    // NOTE: these specs navigate to `/` and wait for `window.__editor` (see e2e/helpers.ts).
    // They will not pass until the graph editor Workspace
    // (src/modules/evaluation/graph/workspace/Workspace.tsx) is mounted at a route the suite
    // visits and the E2E test hook is installed there. That route wiring is a follow-up.
    command: `VITE_E2E=true pnpm dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
