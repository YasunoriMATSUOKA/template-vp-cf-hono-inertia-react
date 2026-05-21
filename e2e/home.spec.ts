import { test, expect } from "@playwright/test";

test("未ログインのホームでログインリンクが見える", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Private Todo" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Google でログインして始める/ })).toBeVisible();
});
