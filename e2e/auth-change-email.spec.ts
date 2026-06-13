import { test, expect } from "@chromatic-com/playwright";
import { signUpAndVerify } from "./auth-helpers";
import { findLink, uniqueEmail, waitForEmail } from "./mailosaur";

const PASSWORD = "e2e-change-pw-1234";

test("メールアドレス変更: 旧アドレス確認 → 新アドレス確認 → 反映", async ({ page }) => {
  const oldEmail = uniqueEmail("change-old");
  const newEmail = uniqueEmail("change-new");
  await signUpAndVerify(oldEmail, PASSWORD);

  // ログイン
  await page.goto("/login");
  await page.getByPlaceholder("メールアドレス").fill(oldEmail);
  await page.getByPlaceholder("パスワード").fill(PASSWORD);
  await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
  await page.waitForURL("**/todos");

  // 設定画面でメールアドレス変更を要求
  const requestedAt = new Date();
  await page.goto("/settings");
  await page.getByPlaceholder("新しいメールアドレス").fill(newEmail);
  await page.getByRole("button", { name: "メールアドレスを変更" }).click();
  await expect(page.getByText("確認メールを送信しました")).toBeVisible();

  // 確認メールは現在(旧)アドレスへ届く。signUpAndVerify の確認メールと混同しないよう
  // requestedAt 以降に絞って取得し、承認リンクを踏む。
  const confirmMsg = await waitForEmail(oldEmail, requestedAt);
  const confirmLink = findLink(confirmMsg, "/api/auth");
  await page.goto(confirmLink);

  // 承認後、新アドレスへ verification が届くので踏む
  const verifyMsg = await waitForEmail(newEmail);
  const verifyLink = findLink(verifyMsg, "/api/auth/verify-email");
  await page.goto(verifyLink);

  // 設定画面に現在のメールアドレスとして新アドレスが表示される
  await page.goto("/settings");
  await expect(page.getByText(newEmail)).toBeVisible();
});
