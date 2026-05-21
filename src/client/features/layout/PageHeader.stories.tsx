import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageHeader } from "./PageHeader";

const meta: Meta<typeof PageHeader> = { component: PageHeader };
export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = { args: { title: "Todo" } };

export const WithActions: Story = {
  args: {
    title: "Todo",
    actions: <button className="btn btn-sm btn-outline">Action</button>,
  },
};
