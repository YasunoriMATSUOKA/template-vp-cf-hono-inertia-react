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
  // CRLF (\r\n) でも値末尾に \r を残さないよう \r?\n で分割する。
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

// この run 固有の ID を一度だけ発行する。config はランナー親プロセスで先に評価されるので
// ここで env にセットされ、その後 fork される各ワーカーは親 env を継承する。ワーカー側で
// config が再評価されても `??=` で既存値を維持するため、全ワーカー + global-setup/teardown が
// 同一 ID を共有する。uniqueEmail() がこの ID をアドレスに埋め込み、global-teardown は
// 自分の run が作ったユーザーだけを削除する (同時並行 run を巻き込まないため)。
// ハイフンを含まない base36 にして teardown 側の LIKE 区切りを一意にする。
process.env.E2E_RUN_ID ??= `run${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // 全テスト後に、この run が作ったテストユーザーをローカル D1 から削除する
  // (run スコープ + serverId スコープで並行 run / 他 mailosaur サーバーを巻き込まない)。
  globalTeardown: "./e2e/global-teardown.ts",
  // E2E では orchestrator (scripts/dev.mjs) を使わず、Playwright にリレーと素の dev を
  // 別 webServer として管理させる (orchestrator の子プロセスを Playwright が teardown で
  // 殺し切れず、CI でプロセスが終了せずハングしたため)。MAIL_RELAY_URL は .dev.vars に
  // 常設済みなので、この 2 つが上がれば Worker → リレー → Mailosaur の経路が揃う。
  webServer: [
    {
      command: "node scripts/mail-relay.mjs",
      url: "http://localhost:3001/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "pnpm dev:vite",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
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
      // ファイル名をパス区切り (/) と末尾 ($) でアンカーし、auth-todos.spec.ts 等の
      // 部分一致による誤マッチを防ぐ。
      testMatch: /\/(todos|avatar-menu)\.spec\.ts$/,
    },
  ],
});
