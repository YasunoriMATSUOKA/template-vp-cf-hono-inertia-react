import { test, expect } from "@playwright/test";

test("ログインページに Google ボタンがある", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Google でログイン/ })).toBeVisible();
});
