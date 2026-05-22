import type { Meta, StoryObj } from "@storybook/react-vite";
import { SiteHeader } from "./SiteHeader";

const meta: Meta<typeof SiteHeader> = { component: SiteHeader };
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
