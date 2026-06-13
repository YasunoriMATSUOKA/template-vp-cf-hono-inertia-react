import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { ChangePasswordForm } from "./ChangePasswordForm";

const meta: Meta<typeof ChangePasswordForm> = { component: ChangePasswordForm };
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = canvas.getByPlaceholderText("現在のパスワード") as HTMLInputElement;
    const next = canvas.getByPlaceholderText("新しいパスワード (8 文字以上)") as HTMLInputElement;
    await userEvent.type(current, "old-password");
    await userEvent.type(next, "new-password");
    await expect(current.value).toBe("old-password");
    await expect(next.value).toBe("new-password");
  },
};
