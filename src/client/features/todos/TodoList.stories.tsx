import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn } from "storybook/test";
import { TodoList } from "./TodoList";

const meta: Meta<typeof TodoList> = {
  component: TodoList,
  args: { onToggle: fn(), onDelete: fn() },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { items: [] } };

export const Mixed: Story = {
  args: {
    items: [
      { id: "1", userId: "u1", title: "買い物", done: false, createdAt: 0 },
      { id: "2", userId: "u1", title: "掃除", done: true, createdAt: 0 },
      { id: "3", userId: "u1", title: "読書", done: false, createdAt: 0 },
    ],
  },
};

export const AllDone: Story = {
  args: {
    items: [
      { id: "1", userId: "u1", title: "買い物", done: true, createdAt: 0 },
      { id: "2", userId: "u1", title: "掃除", done: true, createdAt: 0 },
    ],
  },
};

export const ToggleClick: Story = {
  args: { items: [{ id: "1", userId: "u1", title: "買い物", done: false, createdAt: 0 }] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("checkbox"));
    await expect(args.onToggle).toHaveBeenCalledWith("1");
  },
};

export const DeleteClick: Story = {
  args: { items: [{ id: "1", userId: "u1", title: "買い物", done: false, createdAt: 0 }] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "削除" }));
    await expect(args.onDelete).toHaveBeenCalledWith("1");
  },
};
