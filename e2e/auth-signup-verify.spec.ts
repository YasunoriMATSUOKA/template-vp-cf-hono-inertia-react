import { test, expect } from "@chromatic-com/playwright";
import { findLink, uniqueEmail, waitForEmail } from "./mailosaur";

const PASSWORD = "e2e-signup-pw-1234";

test("サインアップ → 確認メール → 確認完了 → /todos に入れる", async ({ page }) => {
  const email = uniqueEmail("signup");

  await page.goto("/login");
  await page.getByRole("button", { name: "新規登録", exact: true }).click();
  await page.getByPlaceholder("表示名").fill("Signup E2E");
  await page.getByPlaceholder("メールアドレス").fill(email);
  await page.getByPlaceholder("パスワード (8 文字以上)").fill(PASSWORD);
  await page.getByRole("button", { name: "アカウント作成" }).click();

  // 確認必須なのでこの時点ではセッションは無く、確認メール案内が出る
  await expect(page.getByText("確認メールを送信しました")).toBeVisible();

  // Mailosaur から確認リンクを取得して踏む (autoSignInAfterVerification でログイン状態に)
  const message = await waitForEmail(email);
  const verifyLink = findLink(message, "/api/auth/verify-email");
  await page.goto(verifyLink);
  await expect(page.getByText("メールアドレスの確認が完了しました")).toBeVisible();

  // 検証済みなので /todos に入れる
  await page.goto("/todos");
  await expect(page.getByRole("heading", { name: "Todo" })).toBeVisible();
});

test("未確認のままではログインできず、確認メール再送できる", async ({ page }) => {
  const email = uniqueEmail("unverified");

  // サインアップ (確認メールは送られるが踏まない)
  await page.goto("/login");
  await page.getByRole("button", { name: "新規登録", exact: true }).click();
  await page.getByPlaceholder("メールアドレス").fill(email);
  await page.getByPlaceholder("パスワード (8 文字以上)").fill(PASSWORD);
  await page.getByRole("button", { name: "アカウント作成" }).click();
  await expect(page.getByText("確認メールを送信しました")).toBeVisible();

  // 未確認のままログインを試みる → 未確認警告 + 再送ボタン
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await page.getByPlaceholder("メールアドレス").fill(email);
  await page.getByPlaceholder("パスワード").fill(PASSWORD);
  await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
  await expect(page.getByText("メールアドレスが未確認です")).toBeVisible();
  await page.getByRole("button", { name: "確認メールを再送" }).click();
  await expect(page.getByText("確認メールを再送しました")).toBeVisible();
});
