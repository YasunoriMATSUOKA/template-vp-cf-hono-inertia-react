import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { storybookVis } from "storybook-addon-vis/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vitest workspace 構成。2 project に分ける:
//   - unit:      既存の Node 環境ユニット test (src/**/*.test.ts)
//   - storybook: Storybook の CSF stories を `@storybook/addon-vitest` が test に変換し、
//                playwright provider + headless chromium で実行。
//                視覚回帰は `.storybook/vitest.setup.ts` の afterEach で `toMatchScreenshot`
//                を呼ぶことで全 story 自動。
//
// storybook project の vite plugin は `.storybook/main.ts` の viteFinal が
// cloudflare / inertia plugin を filter する (browser mode で workerd が起動しないよう)。
export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        plugins: [
          // `tailwindcss/vite` を明示登録する: addon-vitest が `.storybook/main.ts` の
          // viteFinal を経由して vite config を組み立てる際、root の vite.config.ts plugin が
          // 確実に継承されない (storybook の standalone build 用に独立した plugin chain を作る)
          // ので、Tailwind v4 が utility class を生成できず素 HTML だけが render される。
          // 視覚回帰の baseline が無意味になるので、storybook project には明示的に Tailwind を
          // 差し込む。
          tailwindcss(),
          // `storybookVis` は story render の afterEach hook で `toMatchImageSnapshot` を仕掛ける
          // (preview.ts の `addonVis({ auto: true })` と組で動く)。順序は `storybookTest` の前。
          //
          // `snapshotRootDir` を platform 名で固定: vitest-plugin-vis の default は local では
          // `__vis__/local/` を使い CI では `__vis__/<process.platform>/` (= linux on GHA) に
          // 分岐するため、何もしないと local の baseline を commit しても CI で comparison が
          // 通らない (baseline path が異なる)。dev が WSL/Linux 前提なので両方 linux に揃える。
          // mac/win から baseline 更新する場合は Docker か act 経由で linux 上で再生成する。
          storybookVis({
            snapshotRootDir: ({ rootDir, platform }) => `${rootDir}/${platform}`,
          }),
          storybookTest({ configDir: path.join(__dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
