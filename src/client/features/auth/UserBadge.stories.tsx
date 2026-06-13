import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { UserBadge } from "./UserBadge";

const meta: Meta<typeof UserBadge> = { component: UserBadge };
export default meta;

type Story = StoryObj<typeof meta>;

// 名前あり → アバターはイニシャル (placeholder)
export const WithName: Story = {
  args: { user: { name: "松岡 康紀", email: "yasunori@example.com" } },
};

// 名前なし → email の先頭文字をイニシャルに
export const EmailFallback: Story = {
  args: { user: { name: null, email: "anon@example.com" } },
};

// 画像あり (deterministic な data URI でビジュアル回帰を安定させる)
export const WithImage: Story = {
  args: {
    user: {
      name: "松岡 康紀",
      email: "yasunori@example.com",
      image:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='%23570df8'/></svg>",
    },
  },
};

// アバターをクリックするとメニュー (設定 / ログアウト) が開く
export const OpenMenu: Story = {
  args: { user: { name: "松岡 康紀", email: "yasunori@example.com" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "アカウントメニュー" }));
    await expect(canvas.getByRole("link", { name: "設定" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "ログアウト" })).toBeVisible();
  },
};
