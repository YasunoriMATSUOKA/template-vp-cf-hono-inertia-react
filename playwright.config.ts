import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE = path.join(__dirname, "e2e/.auth/storage-state.json");

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },
  projects: [
    {
      name: "chromium-unauthenticated",
      use: { browserName: "chromium" },
      testMatch: /(home|login)\.spec\.ts/,
    },
    {
      name: "chromium-authenticated",
      use: { browserName: "chromium", storageState: STORAGE_STATE },
      testMatch: /todos\.spec\.ts/,
    },
  ],
});
