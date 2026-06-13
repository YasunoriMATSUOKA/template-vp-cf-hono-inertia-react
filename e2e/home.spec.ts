import { test, expect } from "@chromatic-com/playwright";

test("未ログインのホームでログインリンクが見える", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Private Todo" })).toBeVisible();
  await expect(page.getByRole("link", { name: /ログインして始める/ })).toBeVisible();
});
