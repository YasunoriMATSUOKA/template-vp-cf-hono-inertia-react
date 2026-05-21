import type { Preview } from "@storybook/react-vite";
import "../src/client/styles/main.css";

const preview: Preview = {
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
