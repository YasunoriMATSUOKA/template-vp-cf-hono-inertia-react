import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { EmailSignUpForm } from "./EmailSignUpForm";

const meta: Meta<typeof EmailSignUpForm> = { component: EmailSignUpForm };
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText("表示名"), "山田太郎");
    await userEvent.type(canvas.getByPlaceholderText("メールアドレス"), "new@example.com");
    const password = canvas.getByPlaceholderText("パスワード (8 文字以上)") as HTMLInputElement;
    await userEvent.type(password, "password1234");
    await expect(password.value).toBe("password1234");
  },
};
