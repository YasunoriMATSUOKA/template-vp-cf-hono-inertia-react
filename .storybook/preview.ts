import type { Preview } from "@storybook/react-vite";
import addonVis from "storybook-addon-vis";
import "../src/client/styles/main.css";

// `storybook-addon-vis` を全 story に自動 screenshot するモード (`auto: true`) で登録。
// addon-vitest が story を DOM に mount しない (= `#storybook-root` が生成されない) 構造のため、
// addon-vitest 単体では視覚回帰が成立しない。本 addon が portable-story の render を仕掛けて
// 各 story の afterEach で snapshot を撮影し、`__vis__/__baselines__/` 配下に保存する。
//
// Storybook 10.3+ では addon-vitest が project annotations を自動適用するため、
// `vitest.setup.ts` の `setProjectAnnotations` 経由ではなく preview.ts 側で register する
// (addon-vis README "Storybook 10.3+ and Vitest project annotations" の指針)。
// CSF 旧形式の preview 構造との互換のため、`addonVis()` の戻り値を spread で merge する。
const visAddon = addonVis({ auto: true });

const preview: Preview = {
  ...visAddon,
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#fff" },
        { name: "dark", value: "#1a1a1a" },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: "DaisyUI theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      document.documentElement.setAttribute("data-theme", ctx.globals.theme ?? "light");
      return Story();
    },
  ],
};

export default preview;
