import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrandMark } from "./BrandMark";

const meta: Meta<typeof BrandMark> = { component: BrandMark };
export default meta;

type Story = StoryObj<typeof meta>;

// 装飾扱い (`aria-hidden`)。SiteHeader 等のように直後に同じ文字列のテキストノードがある
// 場合の screen reader 二重読み上げを避けるため、これが default。
export const Default: Story = {};

// Standalone 用途で screen reader にロゴ意図を伝えたい場合の例 (`role="img"` + `aria-label`)。
export const Labeled: Story = { args: { title: "Private Todo" } };

export const Small: Story = { args: { className: "h-4 w-4" } };

export const Large: Story = { args: { className: "h-16 w-16" } };
