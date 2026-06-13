import { test, expect } from "@chromatic-com/playwright";
import { signUpAndVerify } from "./auth-helpers";
import { findLink, uniqueEmail, waitForEmail } from "./mailosaur";

const OLD_PASSWORD = "e2e-old-pw-1234";
const NEW_PASSWORD = "e2e-new-pw-5678";

test("パスワードリセット: リセットメール → 新パスワード設定 → 新パスワードでログイン", async ({
  page,
}) => {
  const email = uniqueEmail("reset");
  await signUpAndVerify(email, OLD_PASSWORD);

  // ログイン画面からリセットを要求
  await page.goto("/login");
  await page.getByRole("button", { name: "パスワードをお忘れですか？" }).click();
  await page.getByPlaceholder("登録済みのメールアドレス").fill(email);
  await page.getByRole("button", { name: "再設定メールを送信" }).click();
  await expect(page.getByText("パスワード再設定用のメールを送信")).toBeVisible();

  // Mailosaur からリセットリンクを取得して踏む (→ /reset-password?token=...)
  const message = await waitForEmail(email);
  const resetLink = findLink(message, "/api/auth/reset-password");
  await page.goto(resetLink);

  await page.getByPlaceholder("新しいパスワード (8 文字以上)").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "パスワードを再設定" }).click();
  await expect(page.getByText("パスワードを再設定しました")).toBeVisible();

  // 新パスワードでログインできる
  await page.goto("/login");
  await page.getByPlaceholder("メールアドレス").fill(email);
  await page.getByPlaceholder("パスワード").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
  await page.waitForURL("**/todos");
  await expect(page.getByRole("heading", { name: "Todo" })).toBeVisible();
});
