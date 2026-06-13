import { request } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findLink, mailosaurConfigured, uniqueEmail, waitForEmail } from "./mailosaur";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const STORAGE_STATE = path.join(__dirname, ".auth/storage-state.json");
export const TEST_PASSWORD = "e2e-test-password-1234";

const BASE_URL = "http://localhost:5173";

// chromium-authenticated プロジェクト (todos.spec.ts) 用に、
// メール確認まで完了した検証済みユーザーのセッションを storageState として用意する。
// 本番同様 requireEmailVerification が有効 (MAIL_RELAY_URL あり) なので、
// サインアップ → Mailosaur で確認メール取得 → verify リンク (autoSignInAfterVerification)
// の完全フローを通してから cookie を保存する。
export default async function globalSetup() {
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  if (!mailosaurConfigured) {
    throw new Error(
      "globalSetup: MAILOSAUR_API_KEY / MAILOSAUR_SERVER_ID が未設定です。" +
        " .env に Mailosaur 資格情報を設定してください (README の Mailosaur 節参照)。",
    );
  }

  const email = uniqueEmail("todos-user");
  const ctx = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Origin: BASE_URL },
  });

  const signUp = await ctx.post("/api/auth/sign-up/email", {
    data: { email, password: TEST_PASSWORD, name: "E2E Todos User" },
    failOnStatusCode: false,
  });
  if (!signUp.ok()) {
    throw new Error(
      `globalSetup: sign-up 失敗 status=${signUp.status()} body=${await signUp.text()}`,
    );
  }

  // 確認メールを Mailosaur から取得し、verify リンクを踏む (= 自動ログイン)。
  const message = await waitForEmail(email);
  const verifyLink = findLink(message, "/api/auth/verify-email");
  await ctx.get(verifyLink);

  await ctx.storageState({ path: STORAGE_STATE });
  await ctx.dispose();
}
