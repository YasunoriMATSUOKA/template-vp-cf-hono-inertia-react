import { request } from "@playwright/test";
import { findLink, waitForEmail } from "./mailosaur";

const BASE_URL = "http://localhost:5173";

// API 経由でサインアップし、Mailosaur で確認リンクを踏んで emailVerified 済みユーザーを作る。
// (UI を介さずテストの前提条件を整えるためのヘルパ)
export async function signUpAndVerify(email: string, password: string): Promise<void> {
  // Better Auth は CSRF 防御として Origin ヘッダ必須
  const ctx = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Origin: BASE_URL },
  });
  try {
    const signUp = await ctx.post("/api/auth/sign-up/email", {
      data: { email, password, name: "E2E User" },
      failOnStatusCode: false,
    });
    if (!signUp.ok()) {
      throw new Error(`sign-up failed: ${signUp.status()} ${await signUp.text()}`);
    }
    const message = await waitForEmail(email);
    const verifyLink = findLink(message, "/api/auth/verify-email");
    await ctx.get(verifyLink);
  } finally {
    await ctx.dispose();
  }
}
