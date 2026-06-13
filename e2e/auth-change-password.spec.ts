import { test, expect } from "@chromatic-com/playwright";
import { signUpAndVerify } from "./auth-helpers";
import { uniqueEmail } from "./mailosaur";

const OLD_PASSWORD = "e2e-cp-old-1234";
const NEW_PASSWORD = "e2e-cp-new-5678";

test("パスワード変更: ログイン中に変更 → 旧パスワードでは入れず新パスワードでログイン", async ({
  page,
}) => {
  const email = uniqueEmail("changepw");
  await signUpAndVerify(email, OLD_PASSWORD);

  // 旧パスワードでログイン
  await page.goto("/login");
  await page.getByPlaceholder("メールアドレス").fill(email);
  await page.getByPlaceholder("パスワード").fill(OLD_PASSWORD);
  await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
  await page.waitForURL("**/todos");

  // 設定画面でパスワード変更
  await page.goto("/settings");
  await page.getByPlaceholder("現在のパスワード").fill(OLD_PASSWORD);
  await page.getByPlaceholder("新しいパスワード (8 文字以上)").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "パスワードを変更" }).click();
  await expect(page.getByText("パスワードを変更しました")).toBeVisible();

  // ログアウト (アバターメニューを開いてから)
  await page.getByRole("button", { name: "アカウントメニュー" }).click();
  await page.getByRole("button", { name: "ログアウト" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/settings"));

  // 旧パスワードではログインできない
  await page.goto("/login");
  await page.getByPlaceholder("メールアドレス").fill(email);
  await page.getByPlaceholder("パスワード").fill(OLD_PASSWORD);
  await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
  await expect(page).toHaveURL(/\/login/);

  // 新パスワードでログインできる
  await page.getByPlaceholder("メールアドレス").fill(email);
  await page.getByPlaceholder("パスワード").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
  await page.waitForURL("**/todos");
  await expect(page.getByRole("heading", { name: "Todo" })).toBeVisible();
});
