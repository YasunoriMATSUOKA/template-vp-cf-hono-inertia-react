import { request } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TEST_USER = {
  email: "e2e-test@example.com",
  password: "e2e-test-password-1234",
  name: "E2E Test",
};

export const STORAGE_STATE = path.join(__dirname, ".auth/storage-state.json");

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  const baseURL = "http://localhost:5173";
  // Better Auth は CSRF 防御として Origin ヘッダ必須 (MISSING_OR_NULL_ORIGIN を返す)
  const ctx = await request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });

  // 初回は sign-up を試す。既存ユーザーなら 422/400 系で失敗するので sign-in にフォールバック。
  const signUp = await ctx.post("/api/auth/sign-up/email", {
    data: TEST_USER,
    failOnStatusCode: false,
  });

  if (!signUp.ok()) {
    const signIn = await ctx.post("/api/auth/sign-in/email", {
      data: { email: TEST_USER.email, password: TEST_USER.password },
      failOnStatusCode: false,
    });
    if (!signIn.ok()) {
      throw new Error(
        `globalSetup: sign-up と sign-in 両方失敗。status: signUp=${signUp.status()}, signIn=${signIn.status()}, signInBody=${await signIn.text()}`,
      );
    }
  }

  await ctx.storageState({ path: STORAGE_STATE });
  await ctx.dispose();
}
