import { test, expect } from "@playwright/test";

test("todo を追加・toggle・削除できる", async ({ page }) => {
  await page.goto("/todos");
  await expect(page.getByRole("heading", { name: "Todo" })).toBeVisible();

  const unique = `e2e-${Date.now()}`;

  // 1. 追加
  await page.getByPlaceholder("やること").fill(unique);
  await page.getByRole("button", { name: "追加" }).click();
  const item = page.locator("li", { hasText: unique });
  await expect(item).toBeVisible();

  // 2. toggle (click → Inertia の router.post + 303 reload を経て取消線が付く)
  await item.getByRole("checkbox").click();
  await expect(item.locator("span").first()).toHaveClass(/line-through/);

  // 3. 削除
  await item.getByRole("button", { name: "削除" }).click();
  await expect(item).toHaveCount(0);
});
