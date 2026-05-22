import type { Meta, StoryObj } from "@storybook/react-vite";
import { SiteFooter } from "./SiteFooter";

const meta: Meta<typeof SiteFooter> = { component: SiteFooter };
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
