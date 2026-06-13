import type { Meta, StoryObj } from "@storybook/react-vite";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

const meta: Meta<typeof ForgotPasswordForm> = { component: ForgotPasswordForm };
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
