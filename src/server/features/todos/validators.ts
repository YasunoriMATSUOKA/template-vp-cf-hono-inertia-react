import { z } from "zod";

export const createTodoInput = z.object({
  title: z.string().trim().min(1).max(200),
});

// route param `:id` のフォーマット検証。queries.ts は crypto.randomUUID() で
// 発行した UUID v4 のみを ID として書き込むため、参照側も UUID 限定で受け取る。
export const todoIdParam = z.object({
  id: z.string().uuid(),
});
