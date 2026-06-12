import { test, expect } from "@chromatic-com/playwright";

test("利用規約ページが直接 URL で開ける", async ({ page }) => {
  await page.goto("/terms-of-service");
  await expect(page.getByRole("heading", { name: "利用規約", level: 1 })).toBeVisible();
  await expect(page.getByText(/最終更新日/)).toBeVisible();
  // 主要章タイトルの存在確認 (本文逐語は assert しないことで文言更新に強くする)
  await expect(page.getByRole("heading", { name: /禁止事項/, level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /免責事項/, level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /準拠法・裁判管轄/, level: 2 })).toBeVisible();
});

test("ホームのフッタから利用規約へ遷移できる", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "利用規約" }).click();
  await expect(page).toHaveURL("/terms-of-service");
  await expect(page.getByRole("heading", { name: "利用規約", level: 1 })).toBeVisible();
});

test("利用規約本文からプライバシーポリシーへ遷移できる", async ({ page }) => {
  await page.goto("/terms-of-service");
  // 本文中の「個人情報の取扱い」節に貼ってあるリンク (footer 由来ではない方)
  await page.getByRole("main").getByRole("link", { name: "プライバシーポリシー" }).click();
  await expect(page).toHaveURL("/privacy-policy");
  await expect(page.getByRole("heading", { name: "プライバシーポリシー", level: 1 })).toBeVisible();
});
