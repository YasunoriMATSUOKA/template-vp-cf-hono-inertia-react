import { test, expect } from "@chromatic-com/playwright";

// 認証済みプロジェクト (storageState) で動く。アバターメニューの
// ホーム / Todo一覧 リンクがそれぞれ正しいページへ遷移することを検証する。

test("アバターメニュー: Todo一覧へ遷移", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "アカウントメニュー" }).click();
  await page.getByRole("link", { name: "Todo一覧" }).click();
  await page.waitForURL("**/todos");
  await expect(page.getByRole("heading", { name: "Todo" })).toBeVisible();
});

test("アバターメニュー: ホームへ遷移", async ({ page }) => {
  await page.goto("/todos");
  await page.getByRole("button", { name: "アカウントメニュー" }).click();
  await page.getByRole("link", { name: "ホーム" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading", { name: "Private Todo" })).toBeVisible();
});
