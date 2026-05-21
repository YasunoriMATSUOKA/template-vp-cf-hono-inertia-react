import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn } from "storybook/test";
import { TodoForm } from "./TodoForm";

const meta: Meta<typeof TodoForm> = {
  component: TodoForm,
  // onSubmit に「受け取った reset を即呼ぶ」実装を仕込む。本番では Inertia の
  // onSuccess 経由で reset が呼ばれるが、ストーリー上は明示的に再現する。
  args: { onSubmit: fn((_title: string, reset: () => void) => reset()) },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Submits: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("やること") as HTMLInputElement;
    await userEvent.type(input, "買い物");
    await userEvent.click(canvas.getByRole("button", { name: "追加" }));
    await expect(args.onSubmit).toHaveBeenCalledWith("買い物", expect.any(Function));
    // onSubmit の reset コールバックが呼ばれて入力欄が空になっていることを確認
    await expect(input.value).toBe("");
  },
};

export const RejectsWhitespace: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText("やること"), "   ");
    await userEvent.click(canvas.getByRole("button", { name: "追加" }));
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};
