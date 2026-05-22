import { test, expect } from "@playwright/test";

test("プライバシーポリシーページが直接 URL で開ける", async ({ page }) => {
  await page.goto("/privacy-policy");
  await expect(page.getByRole("heading", { name: "プライバシーポリシー", level: 1 })).toBeVisible();
  await expect(page.getByText(/最終更新日/)).toBeVisible();
  // 主要章タイトルの存在確認 (本文逐語は assert しないことで文言更新に強くする)
  await expect(page.getByRole("heading", { name: /取得する情報/, level: 2 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /第三者提供および業務委託/, level: 2 }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /お問い合わせ/, level: 2 })).toBeVisible();
});

test("ホームのフッタからプライバシーポリシーへ遷移できる", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "プライバシーポリシー" }).click();
  await expect(page).toHaveURL("/privacy-policy");
  await expect(page.getByRole("heading", { name: "プライバシーポリシー", level: 1 })).toBeVisible();
});
