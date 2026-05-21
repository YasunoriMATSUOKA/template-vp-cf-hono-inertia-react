import type { Meta, StoryObj } from "@storybook/react-vite";
import { MainLayout } from "./MainLayout";

const meta: Meta<typeof MainLayout> = { component: MainLayout };
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "max-w-2xl",
    children: (
      <>
        <h1 className="text-3xl font-bold mb-2">タイトル</h1>
        <p className="text-base-content/70">MainLayout 内の本文サンプル。</p>
      </>
    ),
  },
};

export const Narrow: Story = {
  args: { className: "max-w-md", children: <p>狭いレイアウト (max-w-md)。</p> },
};

export const NoMaxWidth: Story = {
  args: { children: <p>maxWidth 指定なし。</p> },
};
