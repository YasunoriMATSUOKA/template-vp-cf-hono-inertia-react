import { defineConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE = path.join(__dirname, "e2e/.auth/storage-state.json");

// .env / .dev.vars (KEY=VALUE) を process.env に流し込む (未設定のキーのみ)。
// Mailosaur 資格情報 (.env) を global-setup / spec / メールリレーが参照できるようにするため。
// (Mailosaur はテスト基盤専用なので Worker ランタイムの .dev.vars ではなく .env 側に置く)
for (const file of [".env", ".dev.vars"]) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // `pnpm dev` は scripts/dev.mjs (メールリレー + vp dev を同時起動) なので、
  // E2E でもこれ 1 つで「Worker + Mailosaur リレー」が揃う。MAIL_RELAY_URL は
  // .dev.vars に常設済みなので事前準備 (toggle) は不要。
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  // HTML レポート + 機械可読 JSON + console list を出力
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    // trace はデフォルトで常時有効 (trace viewer で stack・network・DOM・失敗箇所を確認可)。
    // 負荷を抑えたい場合は "retain-on-failure" / "on-first-retry" に変更してもよい。
    trace: "on",
    // screenshot / video は普段オフ。必要に応じて以下を uncomment して記録を有効化する
    // (取得物は test-results/ 配下に出力される):
    // screenshot: "on", // 全テストケースでスクリーンショット取得
    // video: "on",      // 全テストケースで動画取得
  },
  projects: [
    {
      name: "chromium-unauthenticated",
      use: { browserName: "chromium" },
      testMatch:
        /(home|login|privacy-policy|terms-of-service|auth-signup-verify|auth-password-reset|auth-change-email|auth-change-password)\.spec\.ts/,
    },
    {
      name: "chromium-authenticated",
      use: { browserName: "chromium", storageState: STORAGE_STATE },
      testMatch: /todos\.spec\.ts/,
    },
  ],
});
