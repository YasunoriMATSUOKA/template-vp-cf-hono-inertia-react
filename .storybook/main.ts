import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-vitest", "storybook-addon-vis"],
  framework: { name: "@storybook/react-vite", options: {} },
  viteFinal: async (config) => {
    // cloudflare plugin は workerd 起動が前提で Storybook では動かない
    // inertiaPages plugin も pages.gen.ts 自動生成のためで Storybook では不要
    config.plugins = config.plugins?.filter((p) => {
      const name = (p as { name?: string })?.name ?? "";
      return !name.includes("cloudflare") && !name.includes("inertia");
    });
    return config;
  },
};

export default config;
