import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChangeEmailForm } from "./ChangeEmailForm";

const meta: Meta<typeof ChangeEmailForm> = {
  component: ChangeEmailForm,
  args: { currentEmail: "current@example.com" },
};
export default meta;

type Story = StoryObj<typeof meta>;

// 現在のメールアドレスが表示されることを含む既定表示。
export const Default: Story = {};
