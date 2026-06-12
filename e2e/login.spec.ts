import { test, expect } from "@chromatic-com/playwright";

test("ログインページに Google ボタンがある", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Google でログイン/ })).toBeVisible();
});
