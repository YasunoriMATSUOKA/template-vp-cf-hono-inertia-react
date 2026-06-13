import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { EmailSignInForm } from "./EmailSignInForm";

// authClient を直接呼ぶため submit はネットワークに依存する (SignInButton.stories と同方針)。
// story では render + 入力 (controlled input) までを検証し、送信フローは E2E で担保する。
const meta: Meta<typeof EmailSignInForm> = { component: EmailSignInForm };
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByPlaceholderText("メールアドレス") as HTMLInputElement;
    const password = canvas.getByPlaceholderText("パスワード") as HTMLInputElement;
    await userEvent.type(email, "user@example.com");
    await userEvent.type(password, "password1234");
    await expect(email.value).toBe("user@example.com");
    await expect(password.value).toBe("password1234");
  },
};
