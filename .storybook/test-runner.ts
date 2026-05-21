import type { TestRunnerConfig } from "@storybook/test-runner";
import { toMatchImageSnapshot } from "jest-image-snapshot";

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },
  async postVisit(page, context) {
    // フォント読込・lazy-load 完了を待ってからスクリーンショット
    // (待たないと 初回 vs 2回目 で 56% 差分が出る classic な visual regression 問題)
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");

    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot({
      customSnapshotsDir: `${process.cwd()}/__image_snapshots__`,
      customSnapshotIdentifier: context.id,
      failureThreshold: 0.01,
      failureThresholdType: "percent",
    });
  },
};

export default config;
