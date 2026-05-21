import type { Meta, StoryObj } from "@storybook/react-vite";
import { SignInButton } from "./SignInButton";

const meta: Meta<typeof SignInButton> = { component: SignInButton };
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { children: "Google で続行", callbackURL: "/" },
};
