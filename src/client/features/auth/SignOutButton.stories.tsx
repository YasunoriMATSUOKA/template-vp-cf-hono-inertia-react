import type { Meta, StoryObj } from "@storybook/react-vite";
import { SignOutButton } from "./SignOutButton";

const meta: Meta<typeof SignOutButton> = { component: SignOutButton };
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
