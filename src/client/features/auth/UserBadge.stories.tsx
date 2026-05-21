import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserBadge } from "./UserBadge";

const meta: Meta<typeof UserBadge> = { component: UserBadge };
export default meta;

type Story = StoryObj<typeof meta>;

export const WithName: Story = {
  args: { user: { name: "松岡 康紀", email: "yasunori@example.com" } },
};

export const EmailFallback: Story = {
  args: { user: { name: null, email: "anon@example.com" } },
};
